#!/usr/bin/env python3
"""Script JSON -> timeline JSON: synthesises every line with its character's voice,
measures it, builds a lip-sync envelope and lays out shots, lines, music cues, sfx and ambience.
usage: python3 timeline.py scripts/day-01.json [...]"""
import json, sys, os, subprocess, hashlib, concurrent.futures as cf
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VENV = os.path.join(HERE, '..', 'venv', 'bin', 'edge-tts')
FPS = 30
VOICES = {  # name: (edge voice, pitch, rate)
    'madhur': ('hi-IN-MadhurNeural', '+0Hz', '+6%'), 'madhur_old': ('hi-IN-MadhurNeural', '-14Hz', '-10%'),
    'madhur_deep': ('hi-IN-MadhurNeural', '-8Hz', '+0%'), 'narrator': ('hi-IN-MadhurNeural', '-6Hz', '-2%'),
    'swara': ('hi-IN-SwaraNeural', '+0Hz', '+6%'), 'swara_old': ('hi-IN-SwaraNeural', '-14Hz', '-8%'),
    'brian': ('en-US-BrianMultilingualNeural', '+0Hz', '+4%'), 'andrew': ('en-US-AndrewMultilingualNeural', '-4Hz', '+0%'),
    'ava': ('en-US-AvaMultilingualNeural', '+0Hz', '+4%'), 'ava_kid': ('en-US-AvaMultilingualNeural', '+30Hz', '+8%'),
    'emma': ('en-US-EmmaMultilingualNeural', '+0Hz', '+4%'), 'florian': ('de-DE-FlorianMultilingualNeural', '+0Hz', '+2%'),
    'giuseppe': ('it-IT-GiuseppeMultilingualNeural', '+0Hz', '+4%'), 'vivienne': ('fr-FR-VivienneMultilingualNeural', '+0Hz', '+2%'),
}
CHAR_VOICE = {'rakesh': 'madhur', 'aman': 'brian', 'papa': 'madhur_old', 'sunita': 'swara', 'raju': 'giuseppe', 'pooja': 'ava',
              'aunty': 'swara_old', 'uncle': 'florian', 'inspector': 'andrew', 'ca': 'emma', 'mr': 'giuseppe', 'doctor': 'madhur_deep',
              'young_mom': 'vivienne', 'kid': 'ava_kid', 'anchor': 'emma', 'narrator': 'narrator'}
AMB = {'store_interior': 'store', 'store_front': 'street_soft', 'counter_closeup': 'store', 'godown': 'fan', 'home': 'room',
       'ca_office': 'ac', 'street': 'street', 'clinic': 'ac', 'news_studio': None, 'abstract_white': None}
CACHE = os.path.join(HERE, 'audio', 'tts')
os.makedirs(CACHE, exist_ok=True)
ENV = dict(os.environ, SSL_CERT_FILE='/root/.ccr/ca-bundle.crt')

def tts(text, voice):
    v, pitch, rate = VOICES[voice]
    key = hashlib.md5(f'{v}|{pitch}|{rate}|{text}'.encode()).hexdigest()[:16]
    out = os.path.join(CACHE, key + '.mp3')
    if not (os.path.exists(out) and os.path.getsize(out) > 0):
        for _ in range(4):
            cmd = [VENV, '--voice', v, f'--pitch={pitch}', f'--rate={rate}', '--text', text, '--write-media', out]
            if os.environ.get('HTTPS_PROXY'): cmd[1:1] = ['--proxy', os.environ['HTTPS_PROXY']]
            r = subprocess.run(cmd, env=ENV, capture_output=True, text=True)
            if r.returncode == 0 and os.path.getsize(out) > 0: break
        else:
            raise RuntimeError('TTS failed: ' + text + r.stderr[-300:])
    return out

def analyse(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    # trim leading/trailing silence for tighter timing
    thr = 0.012
    idx = np.where(np.abs(a) > thr)[0]
    lead = idx[0] / 16000 if len(idx) else 0
    tail = (len(a) - idx[-1]) / 16000 if len(idx) else 0
    hop = 16000 // FPS
    n = int(np.ceil(len(a) / hop))
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    ref = np.percentile(rms, 92) + 1e-6
    env = np.clip(rms / ref, 0, 1.2)
    env = np.where(env < 0.12, 0, env) ** 0.75
    env = np.convolve(env, [0.25, 0.5, 0.25], mode='same')
    return len(a) / 16000, lead, tail, [round(float(x), 3) for x in env]

def build(path):
    d = json.load(open(path))
    jobs = []
    for s in d['shots']:
        for l in s.get('lines', []):
            voice = CHAR_VOICE.get(l['who'], 'narrator')
            jobs.append((l, voice))
    with cf.ThreadPoolExecutor(6) as ex:
        files = list(ex.map(lambda j: tts(j[0]['hi'], j[1]), jobs))
    for (l, voice), f in zip(jobs, files):
        dur, lead, tail, env = analyse(f)
        l.update(file=f, voice=voice, adur=round(dur, 3), lead=round(lead, 3), tail=round(tail, 3), env=env)
    t = 0.0
    sfx, amb = [], []
    shots = d['shots']
    for i, s in enumerate(shots):
        typ = s['type']
        start_pad = 0.35 if typ == 'scene' else 0.55
        if typ == 'screen': start_pad = 1.9  # let the zoom land before the voice starts
        if typ == 'endcard': start_pad = 0.9
        if typ == 'card' and s.get('card') in ('title', 'countdown', 'quiz', 'chat'): start_pad = 0.6
        cur = start_pad
        enter = {a['who']: a.get('at', 0) + 1.9 for a in s.get('actions', []) if a.get('do', '').startswith('enter')}
        for l in s.get('lines', []):
            if l['who'] in enter: cur = max(cur, enter[l['who']])
            # audio file contains small leading silence; align visible speech to it
            l['astart'] = round(cur, 3)
            l['start'] = round(cur + l['lead'], 3)
            l['end'] = round(cur + l['adur'] - l['tail'], 3)
            cur = cur + l['adur'] - l['tail'] + 0.28
        hold = float(s.get('hold', 0))
        dur = cur + hold + (0.25 if s.get('lines') else 0)
        mins = {'scene': 1.6, 'screen': 4.6, 'card': 2.6, 'endcard': 6.0}
        if typ == 'card' and s.get('card') in ('kinetic', 'checklist', 'split'):
            n = len((s.get('data') or {}).get('lines') or (s.get('data') or {}).get('items') or ((s.get('data') or {}).get('left', []) + (s.get('data') or {}).get('right', [])))
            mins['card'] = max(2.6, 1.2 + n * 0.8)
        if typ == 'card' and s.get('card') == 'quiz': mins['card'] = 6.0
        if typ == 'card' and s.get('card') == 'chat': mins['card'] = max(4.5, 1.4 + 1.1 * len((s.get('data') or {}).get('messages', [])))
        dur = max(dur, mins.get(typ, 1.6))
        if typ == 'screen' and s.get('zoom') and len(s['zoom']) > 1: dur = max(dur, 6.8)
        s['dur'] = round(dur, 3); s['start'] = round(t, 3)
        for x in s.get('sfx', []): sfx.append({'name': x['name'], 'time': round(t + float(x.get('at', 0)), 3)})
        if typ == 'scene':
            a = AMB.get(s.get('set'))
            if s.get('rain'): a = 'rain'
            elif a == 'store' and s.get('time') == 'night': a = 'store_night'
            if a: amb.append({'name': a, 'start': round(t, 3), 'end': round(t + dur, 3)})
        t += dur
    for i in range(len(shots) - 1):
        if shots[i + 1].get('transition') in ('dip_black', 'whip'): shots[i]['transOut'] = shots[i + 1]['transition']
    music = []
    for m in d.get('music', []):
        k = min(int(m.get('at_shot', 0)), len(shots) - 1)
        music.append({'mood': m['mood'], 'time': shots[k]['start']})
    if not music: music = [{'mood': 'upbeat', 'time': 0}]
    music.sort(key=lambda m: m['time'])
    d.update(total=round(t, 3), sfx=sfx, amb=amb, music_cues=music)
    out = os.path.join(HERE, 'build', f"timeline-{d['id']}.json")
    json.dump(d, open(out, 'w'), ensure_ascii=False)
    return d['id'], d['total'], len(shots)

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(*build(p))
