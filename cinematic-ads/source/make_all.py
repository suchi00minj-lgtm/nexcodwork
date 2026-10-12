#!/usr/bin/env python3
"""Batch: script -> timeline -> soundtrack -> 16:9 + 9:16 renders -> muxed films, posters, QA sheets.
usage: python make_all.py [--workers 3] [--aspects 16x9,9x16] [--skip-existing] 01 02 ..."""
import argparse, json, os, subprocess, sys, concurrent.futures as cf, threading

HERE = os.path.dirname(os.path.abspath(__file__))
PY = os.path.join(HERE, '..', 'venv', 'bin', 'python')
OUT = os.path.join(HERE, 'out')
LOG = os.path.join(HERE, 'build', 'logs')
for d in (OUT, LOG, os.path.join(OUT, 'silent'), os.path.join(OUT, 'final'), os.path.join(OUT, 'posters'), os.path.join(OUT, 'qa')):
    os.makedirs(d, exist_ok=True)
lock = threading.Lock()


def say(*a):
    with lock: print(*a, flush=True)


def run(cmd, log):
    with open(log, 'a') as f:
        r = subprocess.run(cmd, cwd=HERE, stdout=f, stderr=subprocess.STDOUT)
    if r.returncode: raise RuntimeError(f'{cmd[:3]} failed, see {log}')


def prep(i):
    run([PY, 'timeline.py', f'scripts/day-{i}.json'], f'{LOG}/{i}-prep.log')
    run([PY, 'audio.py', f'build/timeline-{i}.json'], f'{LOG}/{i}-prep.log')
    tl = json.load(open(f'{HERE}/build/timeline-{i}.json'))
    say(f'[prep] {i} {tl["total"]:.1f}s, {len(tl["shots"])} shots')
    return tl


def render(i, aspect, tl, skip):
    final = f'{OUT}/final/day-{i}-{aspect}.mp4'
    if skip and os.path.exists(final): return final
    silent = f'{OUT}/silent/day-{i}-{aspect}.mp4'
    run(['node', 'render_film.js', f'build/timeline-{i}.json', aspect, silent], f'{LOG}/{i}-{aspect}.log')
    run([PY, '-c', f'import audio; audio.mux("{silent}", "build/mix-{i}.wav", "{final}")'], f'{LOG}/{i}-{aspect}.log')
    # poster: middle of the most "hero" scene shot (first close/medium after 30% of runtime), else 40%
    shots = tl['shots']
    pick = next((s for s in shots if s['type'] == 'scene' and s['start'] > tl['total'] * .25 and
                 str((s.get('camera') or {}).get('frame', '')).startswith(('two', 'medium', 'wide'))), None)
    t = pick['start'] + pick['dur'] * .6 if pick else tl['total'] * .4
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', final, '-frames:v', '1', '-q:v', '3',
                    f'{OUT}/posters/day-{i}-{aspect}.jpg'])
    # QA sheet: one frame per shot at 65 %
    frames = []
    for k, s in enumerate(shots):
        f = f'{HERE}/build/qa_{i}_{aspect}_{k:02d}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s["start"] + s["dur"] * .65:.2f}', '-i', final, '-frames:v', '1',
                        '-vf', 'scale=480:-1' if aspect == '16x9' else 'scale=270:-1', f])
        frames.append(f)
    cols = 4 if aspect == '16x9' else 6
    while len(frames) % cols: frames.append(frames[-1])
    ins = sum([['-i', f] for f in frames], [])
    rows = len(frames) // cols
    fc = ''.join(f'[{r * cols + c}]' for r in range(rows) for c in range(cols))
    fc += f'xstack=inputs={len(frames)}:layout=' + '|'.join(
        f'{"+".join(["w0"] * c) or "0"}_{"+".join(["h0"] * r) or "0"}' for r in range(rows) for c in range(cols))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-q:v', '4', f'{OUT}/qa/day-{i}-{aspect}.jpg'])
    for f in set(frames): os.remove(f)
    say(f'[done] {i} {aspect}')
    return final


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='+'); ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--aspects', default='16x9,9x16'); ap.add_argument('--skip-existing', action='store_true')
    ap.add_argument('--no-prep', action='store_true')
    a = ap.parse_args()
    tls = {}
    for i in a.ids:
        tls[i] = json.load(open(f'{HERE}/build/timeline-{i}.json')) if a.no_prep else prep(i)
    jobs = [(i, asp) for i in a.ids for asp in a.aspects.split(',')]
    with cf.ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(render, i, asp, tls[i], a.skip_existing): (i, asp) for i, asp in jobs}
        for f in cf.as_completed(futs):
            try: f.result()
            except Exception as e: say('[fail]', futs[f], e)
