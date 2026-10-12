// usage:
//   node render_film.js build/timeline-02.json 16x9 out/day-02-16x9-silent.mp4
//   node render_film.js build/timeline-02.json 9x16 still build/stills-02  (one jpg per shot at 60% and 95%)
const { chromium } = require('/tmp/claude-0/-home-user-nexcodwork/8883de67-562e-52b5-aaba-875a013f9fb9/scratchpad/render/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const FPS = 24;
(async () => {
  const [tlPath, aspect, mode, outArg] = process.argv.slice(2);
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const W = aspect === '9x16' ? 1080 : 1920, H = aspect === '9x16' ? 1920 : 1080;
  const b = await chromium.launch({ args: ['--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'engine.html'));
  const setDir = process.env.SET_DIR || path.join(__dirname, 'sets');
  for (const f of fs.readdirSync(setDir).filter(f => f.endsWith('.js'))) await p.addScriptTag({ path: path.join(setDir, f) });
  await p.evaluate(a => window.ENGINE.init(a), aspect);
  const cdp = await p.context().newCDPSession(p);
  const grab = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true })).data, 'base64');
  const meta = { store: tl.store, dramatization: !!tl.dramatization, cast: tl.cast };
  const shots = tl.shots;
  let ff = null;
  if (mode !== 'still') {
    ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), mode], { stdio: ['pipe', 'inherit', 'inherit'] });
  } else fs.mkdirSync(outArg, { recursive: true });
  const t0 = Date.now(); let frames = 0;
  for (const [i, s] of shots.entries()) {
    const m = Object.assign({}, meta, { first: i === 0, last: i === shots.length - 1, index: i });
    await p.evaluate(([s, m]) => window.ENGINE.build(s, m), [s, m]);
    if (mode === 'still') {
      for (const f of [0.6, 0.95]) {
        await p.evaluate(t => window.ENGINE.frame(t), s.dur * f);
        await p.screenshot({ path: path.join(outArg, `s${String(i).padStart(2, '0')}_${Math.round(f * 100)}.jpg`), type: 'jpeg', quality: 80 });
      }
      continue;
    }
    // exact frame count from absolute boundaries keeps audio and video in sync
    const fStart = Math.round(s.start * FPS), fEnd = Math.round((s.start + s.dur) * FPS);
    for (let f = fStart; f < fEnd; f++) {
      const t = (f - fStart) / FPS;
      await p.evaluate(t => window.ENGINE.frame(t), t);
      const buf = await grab();
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      frames++;
    }
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  console.log(JSON.stringify({ id: tl.id, aspect, frames, secs: Math.round((Date.now() - t0) / 1000), errors: errs.slice(0, 5) }));
  await b.close();
})();
