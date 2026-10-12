#!/usr/bin/env python3
"""Builds the deliverable folder: index.html calendar page + videos + posters + captions + ad-copy CSVs.
usage: python build_calendar.py <dest_dir>"""
import json, os, sys, shutil, csv, html, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'site')
IDS = [f'{i:02d}' for i in range(1, 16)]
CAST = {'rakesh': 'Rakesh ji · owner', 'aman': 'Aman · son', 'papa': 'Papa ji · father', 'sunita': 'Sunita · co-owner',
        'raju': 'Raju · counter staff', 'pooja': 'Pooja · assistant', 'aunty': 'Aunty ji · customer', 'uncle': 'Chacha ji · customer',
        'inspector': 'Drug inspector', 'ca': 'CA madam', 'mr': 'Distributor rep', 'doctor': 'Doctor sahab', 'young_mom': 'Young mother',
        'kid': 'Child', 'anchor': 'News anchor', 'narrator': 'Narrator (voice)'}
e = lambda s: html.escape(str(s), quote=True)


def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def captions(tl, key):
    out, n = [], 1
    for s in tl['shots']:
        for l in s.get('lines', []):
            a, b = s['start'] + l['start'], s['start'] + l['end'] + 0.15
            out.append(f"{n}\n{srt_time(a)} --> {srt_time(b)}\n{l[key]}\n"); n += 1
    return '\n'.join(out)


def fmt_dur(t):
    t = int(round(t)); return f'{t // 60}:{t % 60:02d}'


def main():
    for d in ('videos', 'posters', 'captions'): os.makedirs(os.path.join(DEST, d), exist_ok=True)
    days = []
    for i in IDS:
        sc = json.load(open(f'{HERE}/scripts/day-{i}.json'))
        tl = json.load(open(f'{HERE}/build/timeline-{i}.json'))
        for asp in ('16x9', '9x16'):
            src = f'{HERE}/out/web/day-{i}-{asp}.mp4'
            if os.path.exists(src): shutil.copy(src, f'{DEST}/videos/day-{i}-{asp}.mp4')
            p = f'{HERE}/out/posters/day-{i}-{asp}.jpg'
            if os.path.exists(p):
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vf', 'scale=960:-1' if asp == '16x9' else 'scale=540:-1', '-q:v', '4',
                                f'{DEST}/posters/day-{i}-{asp}.jpg'])
        open(f'{DEST}/captions/day-{i}.hinglish.srt', 'w').write(captions(tl, 'sub'))
        open(f'{DEST}/captions/day-{i}.hi.srt', 'w').write(captions(tl, 'hi'))
        lines = [(l['who'], l['hi'], l['sub']) for s in tl['shots'] for l in s.get('lines', [])]
        days.append(dict(id=i, sc=sc, total=tl['total'], lines=lines, shots=len(tl['shots'])))
    # CSVs
    with open(f'{DEST}/google-ads-rsa.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Ad group', 'Final URL'] + [f'Headline {k}' for k in range(1, 16)] + [f'Description {k}' for k in range(1, 5)] + ['Video (YouTube upload)'])
        for d in days:
            a = d['sc']['ads']; h = (a['google_headlines'] + [''] * 15)[:15]; ds = (a['google_descriptions'] + [''] * 4)[:4]
            w.writerow([f"Day {d['id']} · {d['sc']['title']}", 'https://nexcodpos.in/'] + h + ds + [f"videos/day-{d['id']}-16x9.mp4"])
    with open(f'{DEST}/meta-ads.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Ad name', 'Primary text', 'Headline', 'Call to action', 'Website URL', 'Video 9:16 (Reels, Stories)', 'Video 16:9 (Feed, in-stream)'])
        for d in days:
            a = d['sc']['ads']
            w.writerow([f"Day {d['id']} · {d['sc']['title']}", a['meta_primary_text'], a['meta_headline'], a.get('cta', 'Learn more'), 'https://nexcodpos.in/',
                        f"videos/day-{d['id']}-9x16.mp4", f"videos/day-{d['id']}-16x9.mp4"])
    with open(f'{DEST}/calendar.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Day', 'Title', 'Style', 'Length', 'Problem it solves', 'Audience'])
        for d in days: w.writerow([d['id'], d['sc']['title'], d['sc']['style'], fmt_dur(d['total']), d['sc']['problem'], d['sc']['audience']])
    open(f'{DEST}/index.html', 'w').write(page(days))
    print('built', DEST, sum(os.path.getsize(os.path.join(r, x)) for r, _, fs in os.walk(DEST) for x in fs) // 1e6, 'MB')


def chips(items): return ''.join(f'<li>{e(x)}</li>' for x in items)


def copyblock(label, text, limit=None, note=None):
    n = len(text)
    cnt = f'<span class="cnt{" over" if limit and n > limit else ""}">{n}{f"/{limit}" if limit else ""}</span>' if limit else ''
    return (f'<div class="cp"><div class="cp-h"><span class="lab">{e(label)}</span>{cnt}</div>'
            f'<div class="cp-row"><p class="cp-t">{e(text)}</p><button class="copy" type="button" data-copy="{e(text)}" aria-label="Copy {e(label)}">Copy</button></div>'
            + (f'<p class="hint">{e(note)}</p>' if note else '') + '</div>')


def day_html(d):
    sc, a, i = d['sc'], d['sc']['ads'], d['id']
    heads = ''.join(f'<li><span>{e(h)}</span><span class="cnt{" over" if len(h) > 30 else ""}">{len(h)}/30</span></li>' for h in a['google_headlines'])
    descs = ''.join(f'<li><span>{e(x)}</span><span class="cnt{" over" if len(x) > 90 else ""}">{len(x)}/90</span></li>' for x in a['google_descriptions'])
    cast = ''.join(f'<li>{e(CAST.get(c, c))}</li>' for c in sc['cast'])
    script = ''.join(f'<li><span class="who">{e(CAST.get(w, w).split(" · ")[0])}</span> {e(sub)}<span class="hi" lang="hi">{e(hi)}</span></li>' for w, hi, sub in d['lines'])
    long_note = ('<p class="hint">Over 60 seconds. Best for YouTube in-stream and the Facebook feed. For Stories, choose a shorter film or let Ads Manager cut it into cards.</p>'
                 if d['total'] > 60 else '')
    fest = ('<p class="flag">Festival film. Dhanteras is on Friday, 6 Nov 2026, and Diwali on Sunday, 8 Nov. Run it again from 1–6 Nov, when the rush is real.</p>'
            if i == '14' else '')
    return f'''
<section class="day" id="day-{i}" data-day="{int(i)}">
  <div class="day-head">
    <div class="num"><span>Day</span>{int(i)}</div>
    <div>
      <p class="kick"><span class="date" data-off="{int(i) - 1}"></span> · {e(sc['style'])} · {fmt_dur(d['total'])}</p>
      <h2>{e(sc['title'])}</h2>
    </div>
  </div>
  <div class="day-body">
    <div class="player">
      <div class="tabs" role="group" aria-label="Video format">
        <button type="button" class="on" data-asp="16x9" aria-pressed="true">16:9 · YouTube, Google</button>
        <button type="button" data-asp="9x16" aria-pressed="false">9:16 · Reels, Stories, Shorts</button>
      </div>
      <div class="screen asp-16x9">
        <video controls preload="none" playsinline poster="posters/day-{i}-16x9.jpg" data-base="videos/day-{i}-" data-poster="posters/day-{i}-">
          <source src="videos/day-{i}-16x9.mp4" type="video/mp4">
        </video>
      </div>
      <p class="dl">Download: <a href="videos/day-{i}-16x9.mp4" download>16:9 MP4</a> · <a href="videos/day-{i}-9x16.mp4" download>9:16 MP4</a> ·
        <a href="captions/day-{i}.hinglish.srt" download>captions (Hinglish)</a> · <a href="captions/day-{i}.hi.srt" download>captions (हिंदी)</a></p>
      {long_note}{fest}
    </div>
    <div class="info">
      <div class="prob"><span class="lab">Problem it solves</span><p>{e(sc['problem'])}</p></div>
      <div class="two">
        <div><span class="lab">Who it is for</span><p class="small">{e(sc['audience'])}</p></div>
        <div><span class="lab">Cast</span><ul class="cast">{cast}</ul></div>
      </div>
      <details class="ads" open>
        <summary><span class="pf g">Google Ads</span> Responsive search ad + YouTube video</summary>
        <div class="ann"><svg viewBox="0 0 60 30" aria-hidden="true"><path d="M2 26 C 18 24, 34 18, 52 6" /><path d="M42 5 L53 5 L49 15" /></svg>
          Paste these into one ad group. Google mixes the headlines itself.</div>
        <span class="lab">Headlines (max 30 characters)</span><ul class="list">{heads}</ul>
        <span class="lab">Descriptions (max 90 characters)</span><ul class="list">{descs}</ul>
        <button class="copy wide" type="button" data-copy="{e(chr(10).join(a['google_headlines']) + chr(10) + chr(10) + chr(10).join(a['google_descriptions']))}">Copy all Google copy</button>
      </details>
      <details class="ads" open>
        <summary><span class="pf m">Meta Ads</span> Facebook + Instagram</summary>
        {copyblock('Primary text', a['meta_primary_text'], 280, 'About the first 125 characters show before “See more”, so the hook is at the start.')}
        {copyblock('Headline', a['meta_headline'], 40)}
        <p class="small cta"><span class="lab">Call to action button</span>{e(a.get('cta', 'Learn more'))} → nexcodpos.in, or “Send WhatsApp message” → 72819 21783</p>
      </details>
      <details class="ads">
        <summary>Full dialogue ({len(d['lines'])} lines)</summary>
        <ol class="script">{script}</ol>
      </details>
    </div>
  </div>
</section>'''


def page(days):
    nav = ''.join(f'<a href="#day-{d["id"]}"><b>{int(d["id"])}</b><span class="date" data-off="{int(d["id"]) - 1}" data-short="1"></span><i>{e(d["sc"]["style"].split(" (")[0].split(" /")[0])}</i></a>' for d in days)
    total = sum(d['total'] for d in days)
    body = ''.join(day_html(d) for d in days)
    lo, hi = min(d['total'] for d in days), max(d['total'] for d in days)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nexcod POS Film Calendar</title>
<meta name="description" content="Fifteen cinematic ad films for Nexcod POS, one per day, ready for Google Ads and Meta Ads, with ad copy, captions and targeting notes.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
/* White theme, Poppins at 400 with 500/600 only for headings; red brand accents; hand-drawn arrow notes explain what to do. */
:root{{--bg:#fff;--ink:#17141a;--muted:#5f5a63;--line:#e7e3e6;--soft:#f7f6f8;--brand:#c8161e;--orange:#ea580c;--green:#1e9e62;--blue:#2454c8}}
html{{color-scheme:light;scroll-behavior:smooth}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:Poppins,system-ui,sans-serif;font-size:15.5px;line-height:1.65;font-weight:400}}
b,strong{{font-weight:500}}
a{{color:var(--brand)}}
.page{{max-width:1180px;margin:0 auto;padding:36px 16px 120px}}
header{{border-bottom:3px solid var(--brand);padding-bottom:22px}}
.eyebrow{{font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--brand)}}
h1{{font-weight:600;font-size:clamp(30px,5vw,46px);line-height:1.1;margin:.2em 0 .3em;letter-spacing:-.01em}}
.lead{{color:var(--muted);max-width:72ch;margin:0}}
.facts{{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}}
.facts li{{font-size:13.5px;border:1px solid var(--line);border-radius:999px;padding:3px 12px;background:#fff}}
.start{{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:22px 0 0}}
.start label{{font-weight:500}}
.start input{{font:inherit;border:1px solid var(--line);border-radius:10px;padding:6px 10px;color:var(--ink);background:#fff}}
.start .hint{{margin:0}}
nav.days{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:26px 0 10px}}
nav.days a{{display:flex;flex-direction:column;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fff;min-width:0}}
nav.days a b{{font-size:24px;font-weight:600;color:var(--brand);line-height:1.1}}
nav.days a span{{font-size:13px;color:var(--muted)}}
nav.days a i{{font-style:normal;font-size:12.5px;line-height:1.35;margin-top:2px;overflow-wrap:anywhere}}
nav.days a:hover,nav.days a:focus-visible{{border-color:var(--brand);outline:none}}
.ann{{display:flex;align-items:flex-start;gap:8px;color:var(--brand);font-size:13.5px;line-height:1.4;margin:4px 0 10px}}
.ann svg{{flex:none;width:46px;height:24px;fill:none;stroke:var(--brand);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}}
.guide{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:28px 0 8px}}
.card{{border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:#fff}}
.card h3{{font-size:17px;font-weight:500;margin:0 0 6px}}
.card ul{{margin:0;padding-left:18px}}
.card li{{margin:4px 0;font-size:14.5px}}
.pf{{display:inline-block;font-size:12px;font-weight:500;letter-spacing:.06em;border-radius:6px;padding:1px 8px;color:#fff;margin-right:6px}}
.pf.g{{background:var(--blue)}}.pf.m{{background:#1877f2}}
.day{{padding:34px 0;border-bottom:1px solid var(--line);scroll-margin-top:10px}}
.day-head{{display:flex;gap:16px;align-items:center;margin-bottom:16px}}
.num{{flex:none;width:68px;height:68px;border-radius:16px;background:linear-gradient(135deg,var(--brand),var(--orange));color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:28px;font-weight:600;line-height:1}}
.num span{{font-size:11px;font-weight:400;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px}}
.kick{{margin:0;font-size:13px;color:var(--muted);letter-spacing:.02em}}
h2{{font-size:clamp(22px,3vw,28px);font-weight:600;margin:.1em 0 0;line-height:1.2}}
.day-body{{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:28px;align-items:start}}
.tabs{{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}}
.tabs button{{font:inherit;font-size:13.5px;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:5px 12px;cursor:pointer}}
.tabs button.on{{border-color:var(--brand);color:var(--brand);background:#fff5f5}}
.player{{position:sticky;top:16px}}
.screen video{{display:block;width:100%;border-radius:14px;background:#0d0f14;box-shadow:0 18px 40px rgba(23,20,26,.16)}}
.screen.asp-16x9 video{{aspect-ratio:16/9}}
.screen.asp-9x16{{max-width:340px}}
.screen.asp-9x16 video{{aspect-ratio:9/16}}
.dl{{font-size:14px;color:var(--muted);margin:10px 0 0}}
.hint{{font-size:13.5px;color:var(--muted);margin:6px 0 0}}
.flag{{font-size:14px;border-left:3px solid var(--orange);background:#fff8f2;padding:8px 12px;border-radius:6px;margin:10px 0 0}}
.lab{{display:block;font-size:11.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:12px 0 4px}}
.prob p{{margin:0;font-size:16px}}
.prob{{border-left:3px solid var(--brand);padding-left:14px}}
.two{{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}}
.small{{font-size:14px;margin:0}}
.cast{{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}}
.cast li{{font-size:12.5px;border:1px solid var(--line);border-radius:999px;padding:1px 10px;background:var(--soft)}}
details.ads{{border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin-top:14px;background:#fff}}
details.ads summary{{cursor:pointer;font-weight:500}}
.list{{list-style:none;margin:0;padding:0}}
.list li{{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed var(--line);padding:4px 0;font-size:14.5px}}
.cnt{{flex:none;font-size:12px;color:var(--green)}}.cnt.over{{color:var(--brand)}}
.cp-h{{display:flex;justify-content:space-between;align-items:baseline}}
.cp-row{{display:flex;gap:10px;align-items:flex-start}}
.cp-t{{flex:1;margin:0;font-size:14.5px;background:var(--soft);border-radius:8px;padding:8px 10px}}
.copy{{font:inherit;font-size:13.5px;font-weight:500;color:#fff;background:var(--orange);border:0;border-radius:8px;padding:6px 12px;cursor:pointer}}
.copy.wide{{margin-top:12px}}
.copy:focus-visible,.tabs button:focus-visible{{outline:3px solid var(--blue);outline-offset:2px}}
.cta{{margin-top:6px}}
.script{{padding-left:20px;margin:8px 0 0}}
.script li{{margin:6px 0;font-size:14.5px}}
.script .who{{font-weight:500}}
.script .hi{{display:block;color:var(--muted);font-size:13.5px}}
footer{{margin-top:40px;font-size:14px;color:var(--muted)}}
footer ul{{padding-left:18px}}
@media (max-width:960px){{.player{{position:static}}.day-body{{grid-template-columns:1fr}}.guide{{grid-template-columns:1fr}}}}
@media (max-width:620px){{nav.days{{grid-template-columns:repeat(3,minmax(0,1fr))}}.two{{grid-template-columns:1fr}}.cp-row{{flex-direction:column}}}}
@media (prefers-reduced-motion:reduce){{html{{scroll-behavior:auto}}}}
</style></head>
<body><div class="page">
<header>
  <div class="eyebrow">Nexcod POS · Cinematic ad calendar</div>
  <h1>15 days, 15 short films</h1>
  <p class="lead">Each film follows one real problem at a medical store counter, with a cast of characters, a story and a clear ending: how Nexcod POS solves it. Every film comes in two formats, with Google Ads and Meta Ads copy ready to paste.</p>
  <ul class="facts"><li>16:9 · 1920×1080 and 9:16 · 1080×1920</li><li>24 fps · H.264 + AAC · −14 LUFS</li><li>{fmt_dur(lo)} to {fmt_dur(hi)} each · {round(total / 60)} min in total</li><li>Hindi dialogue, Hinglish subtitles burned in</li><li>Every film is marked “Dramatization”</li></ul>
  <div class="start"><label for="startDate">Campaign start date</label><input type="date" id="startDate" value="2026-10-12">
    <p class="hint">Change it and every day below shows its real date.</p></div>
</header>
<nav class="days" aria-label="Days">{nav}</nav>
<div class="guide">
  <div class="card"><h3><span class="pf g">Google</span> How to run</h3><ul>
    <li>Upload the 16:9 files to the brand YouTube channel (unlisted is fine), then use them in a Video or Demand Gen campaign.</li>
    <li>Search campaign: use each day's headlines and descriptions as one responsive search ad. The file <a href="google-ads-rsa.csv" download>google-ads-rsa.csv</a> has them all.</li>
    <li>Keywords: medical store billing software, pharmacy billing software, chemist billing software, medical shop software, GST billing for medical store, pharmacy inventory software, medicine expiry software.</li>
    <li>Negative keywords: job, course, salary, near me, online medicine, crack, pdf.</li>
  </ul></div>
  <div class="card"><h3><span class="pf m">Meta</span> How to run</h3><ul>
    <li>Use the 9:16 file for Reels and Stories and the 16:9 file for Feed and in-stream. Upload both in one ad and let Advantage+ placements choose.</li>
    <li>Goal: Leads through WhatsApp (72819 21783) or traffic to nexcodpos.in. All copy is in <a href="meta-ads.csv" download>meta-ads.csv</a>.</li>
    <li>Audience: India, ages 25–60. Suggest the interests pharmacy, pharmacist, chemist, retail and small business, and start with the Hindi-speaking states.</li>
    <li>Upload the matching .srt file so captions also work with the sound off.</li>
  </ul></div>
  <div class="card"><h3>Budget and testing</h3><ul>
    <li>Week 1: ₹500–₹1,000 a day per platform. Each day's new film runs next to the films already live.</li>
    <li>After 7 days, keep the 3 films with the lowest cost per trial sign-up or WhatsApp chat, and pause the rest.</li>
    <li>Day 15 is the offer film. Keep it running after the campaign as the remarketing ad for site visitors.</li>
    <li>Prices and claims match nexcodpos.in: 7-day free trial, ₹1,299 a year, no auto-renew. Update the copy if the prices change.</li>
  </ul></div>
</div>
{body}
<footer>
  <p><b>Files in this folder</b></p>
  <ul>
    <li><code>videos/day-XX-16x9.mp4</code> and <code>videos/day-XX-9x16.mp4</code>: the films.</li>
    <li><code>captions/day-XX.hinglish.srt</code> and <code>day-XX.hi.srt</code>: caption files for YouTube and Meta.</li>
    <li><a href="google-ads-rsa.csv" download>google-ads-rsa.csv</a>, <a href="meta-ads.csv" download>meta-ads.csv</a>, <a href="calendar.csv" download>calendar.csv</a>: the copy and the plan as spreadsheets.</li>
  </ul>
  <p>All characters, stores and situations are fictional dramatizations. Voices are synthetic. Screens shown are the real Nexcod POS software (v3.0.0) with sample data.</p>
</footer>
</div>
<script>
(function(){{
  var input=document.getElementById('startDate');
  try{{var saved=localStorage.getItem('nx-start');if(saved)input.value=saved;}}catch(e){{}}
  var W=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function paint(){{
    var p=(input.value||'2026-10-12').split('-'),base=new Date(+p[0],+p[1]-1,+p[2]);
    document.querySelectorAll('.date').forEach(function(el){{
      var d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+(+el.dataset.off));
      el.textContent=el.dataset.short?(W[d.getDay()]+' '+d.getDate()+' '+M[d.getMonth()]):(W[d.getDay()]+', '+d.getDate()+' '+M[d.getMonth()]+' '+d.getFullYear());
    }});
  }}
  input.addEventListener('change',function(){{try{{localStorage.setItem('nx-start',input.value);}}catch(e){{}}paint();}});
  paint();
  document.querySelectorAll('.player').forEach(function(pl){{
    var v=pl.querySelector('video'),scr=pl.querySelector('.screen');
    pl.querySelectorAll('.tabs button').forEach(function(b){{
      b.addEventListener('click',function(){{
        pl.querySelectorAll('.tabs button').forEach(function(x){{x.classList.remove('on');x.setAttribute('aria-pressed','false');}});
        b.classList.add('on');b.setAttribute('aria-pressed','true');
        var a=b.dataset.asp;scr.className='screen asp-'+a;
        v.pause();v.setAttribute('poster',v.dataset.poster+a+'.jpg');
        v.querySelector('source').src=v.dataset.base+a+'.mp4';v.load();
      }});
    }});
  }});
  document.querySelectorAll('.copy').forEach(function(b){{
    b.addEventListener('click',function(){{
      var t=b.dataset.copy,done=function(){{var o=b.textContent;b.textContent='Copied';setTimeout(function(){{b.textContent=o;}},1400);}};
      if(navigator.clipboard&&navigator.clipboard.writeText){{navigator.clipboard.writeText(t).then(done,function(){{fallback(t);done();}});}}else{{fallback(t);done();}}
    }});
  }});
  function fallback(t){{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{{document.execCommand('copy');}}catch(e){{}}a.remove();}}
}})();
</script>
</body></html>'''


if __name__ == '__main__':
    main()
