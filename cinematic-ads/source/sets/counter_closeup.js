// counter_closeup — tight, cinematic insert of a pharmacy counter top (owner's point of view).
// Real perspective: a camera 42 cm above a glass-topped wooden counter, pitched 42° down
// (focal 1700 units). Every prop is modelled in centimetres on the table plane and projected,
// so boxes, strips, the open bill book, calculator, phone and the rubber-banded distributor
// bills all converge correctly. The far counter edge sits near y≈325; beyond it the shop is
// thrown out of focus. Mostly a prop / insert set; 'hands' is the only spot.
window.SETS = window.SETS || {};
(function () {
  const ID = 'counter_closeup';
  const n = v => Math.round(v * 10) / 10;
  const r4 = v => Math.round(v * 1e4) / 1e4;

  // ---------- camera ----------
  const TH = 42 * Math.PI / 180, SN = Math.sin(TH), CS = Math.cos(TH), CH = 42, FOC = 1700, CX = 1200, CY = 675;
  function proj(X, Y, Z) { const d = (CH - Y) * SN + Z * CS, up = (Y - CH) * CS + Z * SN; return [CX + FOC * X / d, CY - FOC * up / d]; }
  const scaleAt = (Y, Z) => FOC / ((CH - Y) * SN + Z * CS);
  const ZFAR = 72, GLASS = 0.6;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hx(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function toHex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function Defs(layer) {
    let out = '';
    const seen = {};
    const id = nm => `${ID}_${layer}_${nm}`;
    const stops = st => st.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    return {
      lin(nm, x1, y1, x2, y2, st) {
        if (!seen[nm]) { seen[nm] = 1; out += `<linearGradient id="${id(nm)}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stops(st)}</linearGradient>`; }
        return `url(#${id(nm)})`;
      },
      rad(nm, cx, cy, r, st, ex) {
        if (!seen[nm]) { seen[nm] = 1; out += `<radialGradient id="${id(nm)}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${ex ? ' ' + ex : ''}>${stops(st)}</radialGradient>`; }
        return `url(#${id(nm)})`;
      },
      filter(nm, inner, box) {
        if (!seen[nm]) { seen[nm] = 1; out += `<filter id="${id(nm)}" ${box || 'x="-30%" y="-30%" width="160%" height="160%"'} color-interpolation-filters="sRGB">${inner}</filter>`; }
        return `url(#${id(nm)})`;
      },
      wrap(body) { return `<g>${out ? `<defs>${out}</defs>` : ''}${body}</g>`; }
    };
  }
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const dP = pts => 'M' + pts.map(p => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z';
  const dO = pts => 'M' + pts.map(p => n(p[0]) + ' ' + n(p[1])).join('L');
  const path = (d, f, ex) => `<path d="${d}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  function smooth(P) { // Catmull-Rom through screen points
    if (P.length < 3) return dO(P);
    let d = `M${n(P[0][0])} ${n(P[0][1])}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
    }
    return d;
  }
  function hull(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  // ---------- items: local "print" coords (x right, y toward the camera), c = height ----------
  function item(X, Z, deg, y0) { const r = deg * Math.PI / 180; return { X, Z, y0: y0 == null ? GLASS : y0, cr: Math.cos(r), sr: Math.sin(r) }; }
  function world(it, x, y, c) { const a = x, b = -y; return [it.X + a * it.cr - b * it.sr, it.y0 + c, it.Z + a * it.sr + b * it.cr]; }
  function sp(it, x, y, c) { const w = world(it, x, y, c); return proj(w[0], w[1], w[2]); }
  const surf = (it, c) => (x, y) => sp(it, x, y, typeof c === 'function' ? c(x, y) : c);
  const sPoly = (sf, pts) => dP(pts.map(p => sf(p[0], p[1])));
  function sMat(sf, x, y) {
    const e = 0.12, p0 = sf(x, y), px = sf(x + e, y), py = sf(x, y + e);
    return `matrix(${r4((px[0] - p0[0]) / e)} ${r4((px[1] - p0[1]) / e)} ${r4((py[0] - p0[0]) / e)} ${r4((py[1] - p0[1]) / e)} ${n(p0[0])} ${n(p0[1])})`;
  }
  const sText = (sf, x, y, size, fill, str, ex) => `<text transform="${sMat(sf, x, y)}" font-size="${size}" fill="${fill}" font-family="Poppins"${ex ? ' ' + ex : ''}>${str}</text>`;
  function sLine(sf, x1, y1, x2, y2, k) { const P = []; k = k || 1; for (let i = 0; i <= k; i++) P.push(sf(x1 + (x2 - x1) * i / k, y1 + (y2 - y1) * i / k)); return dO(P); }
  function rrPts(cx, cy, w, h, r, seg) {
    seg = seg == null ? 4 : seg; r = Math.min(r, w / 2, h / 2);
    const pts = [];
    const cs = [[cx + w / 2 - r, cy - h / 2 + r, -90], [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180]];
    for (const [x, y, a0] of cs) {
      if (r <= 0.001 || seg === 0) { pts.push([x + Math.sign(Math.cos((a0 + 45) * Math.PI / 180)) * r, y + Math.sign(Math.sin((a0 + 45) * Math.PI / 180)) * r]); continue; }
      for (let i = 0; i <= seg; i++) { const a = (a0 + 90 * i / seg) * Math.PI / 180; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    }
    return pts;
  }
  const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  function circPts(cx, cy, rx, ry, seg) { const P = []; seg = seg || 14; for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; P.push([cx + rx * Math.cos(a), cy + (ry == null ? rx : ry) * Math.sin(a)]); } return P; }
  // vertical extrusion of a convex outline: silhouette in side colour, camera-facing walls shaded, top on top
  function slab(it, pts, c0, c1, side, top, ex) {
    const B = pts.map(p => sp(it, p[0], p[1], c0)), Tp = pts.map(p => sp(it, p[0], p[1], c1));
    let s = path(dP(hull(B.concat(Tp))), side);
    if (ex && ex.walls) {
      let area = 0;
      for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; }
      const sgn = area > 0 ? 1 : -1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        let nx = (q[1] - p[1]) * sgn, ny = -(q[0] - p[0]) * sgn; // outward normal in print coords (y toward camera)
        const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
        const na = nx, nb = -ny;
        const wX = na * it.cr - nb * it.sr, wZ = na * it.sr + nb * it.cr;
        const m = world(it, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, c0);
        if (-m[0] * wX - m[2] * wZ <= 0) continue;
        const lit = Math.max(0, -wX) * 0.35 + Math.max(0, wZ) * 0.2;
        s += path(dP([B[i], B[(i + 1) % pts.length], Tp[(i + 1) % pts.length], Tp[i]]), lit > 0.02 ? mix(side, ex.walls, Math.min(1, lit)) : side);
      }
    }
    if (top) s += path(dP(Tp), top, ex && ex.topEx);
    return s;
  }

  // ---------- handwriting ----------
  const DIG = {
    '0': [[[0.3, 0.02], [0.08, 0.2], [0.04, 0.6], [0.16, 0.95], [0.38, 0.97], [0.52, 0.65], [0.5, 0.25], [0.36, 0.02], [0.22, 0.06]]],
    '1': [[[0.1, 0.22], [0.32, 0.0], [0.3, 1.0]]],
    '2': [[[0.04, 0.28], [0.14, 0.06], [0.32, 0.0], [0.48, 0.1], [0.5, 0.3], [0.36, 0.55], [0.16, 0.78], [0.02, 1.0], [0.3, 0.96], [0.58, 0.98]]],
    '3': [[[0.05, 0.12], [0.25, 0.0], [0.45, 0.07], [0.47, 0.25], [0.32, 0.43], [0.18, 0.47], [0.4, 0.53], [0.53, 0.72], [0.46, 0.92], [0.24, 1.0], [0.02, 0.9]]],
    '4': [[[0.4, 0.0], [0.03, 0.66], [0.58, 0.66]], [[0.42, 0.3], [0.4, 1.0]]],
    '5': [[[0.52, 0.0], [0.14, 0.02], [0.08, 0.45], [0.3, 0.38], [0.5, 0.5], [0.54, 0.75], [0.42, 0.95], [0.2, 1.0], [0.02, 0.9]]],
    '6': [[[0.46, 0.03], [0.24, 0.2], [0.08, 0.5], [0.06, 0.8], [0.2, 0.99], [0.4, 0.97], [0.52, 0.78], [0.44, 0.58], [0.26, 0.54], [0.09, 0.66]]],
    '7': [[[0.02, 0.03], [0.56, 0.0], [0.32, 0.48], [0.2, 1.0]]],
    '8': [[[0.46, 0.15], [0.28, 0.0], [0.08, 0.12], [0.12, 0.34], [0.3, 0.47], [0.5, 0.63], [0.52, 0.86], [0.3, 1.0], [0.06, 0.88], [0.08, 0.66], [0.28, 0.48], [0.44, 0.32], [0.46, 0.15]]],
    '9': [[[0.48, 0.3], [0.28, 0.44], [0.1, 0.36], [0.08, 0.12], [0.28, 0.0], [0.48, 0.12], [0.48, 0.42], [0.42, 0.76], [0.3, 1.0]]],
    '/': [[[0.0, 1.05], [0.34, -0.05]]], '-': [[[0.0, 0.55], [0.3, 0.52]]], '.': [[[0.05, 0.95], [0.1, 1.0]]],
    '+': [[[0.0, 0.55], [0.42, 0.53]], [[0.2, 0.32], [0.22, 0.78]]], '=': [[[0.0, 0.42], [0.42, 0.4]], [[0.0, 0.66], [0.42, 0.64]]],
    'x': [[[0.02, 0.45], [0.36, 0.98]], [[0.36, 0.45], [0.02, 0.98]]]
  };
  const CUR = {
    n: [[[0, 1], [0.06, 0.56], [0.16, 0.5], [0.2, 0.74], [0.22, 1], [0.27, 0.6], [0.36, 0.5], [0.42, 0.72], [0.45, 1]], 0.48],
    e: [[[0, 0.86], [0.22, 0.7], [0.26, 0.55], [0.16, 0.5], [0.06, 0.62], [0.06, 0.88], [0.18, 1], [0.32, 0.95]], 0.34],
    l: [[[0, 0.9], [0.18, 0.45], [0.22, 0.12], [0.14, 0.0], [0.07, 0.2], [0.1, 0.72], [0.14, 1], [0.26, 0.95]], 0.28],
    o: [[[0, 0.76], [0.1, 0.52], [0.22, 0.52], [0.27, 0.76], [0.18, 1], [0.06, 0.95], [0.05, 0.7], [0.18, 0.56], [0.34, 0.58]], 0.36],
    a: [[[0.28, 0.58], [0.14, 0.52], [0.03, 0.7], [0.08, 0.98], [0.22, 0.92], [0.29, 0.6], [0.28, 0.9], [0.36, 1]], 0.38],
    t: [[[0, 0.95], [0.1, 0.6], [0.14, 0.15], [0.12, 0.8], [0.18, 1], [0.28, 0.95]], 0.3],
    i: [[[0, 0.95], [0.08, 0.56], [0.1, 0.95], [0.18, 1]], 0.2],
    g: [[[0.28, 0.6], [0.12, 0.52], [0.03, 0.72], [0.12, 0.92], [0.26, 0.8], [0.28, 0.55], [0.27, 1.2], [0.18, 1.42], [0.05, 1.35], [0.1, 1.1], [0.36, 0.98]], 0.38],
    m: [[[0, 1], [0.05, 0.56], [0.13, 0.52], [0.17, 1], [0.21, 0.58], [0.3, 0.52], [0.33, 1], [0.38, 0.58], [0.47, 0.54], [0.51, 0.8], [0.54, 1]], 0.58],
    s: [[[0, 0.95], [0.12, 0.5], [0.2, 0.7], [0.24, 0.95], [0.1, 1], [0.3, 0.96]], 0.32]
  };
  const LET = { a: 'a', d: 'a', q: 'a', b: 'l', h: 'l', k: 'l', l: 'l', f: 'l', c: 'e', e: 'e', g: 'g', j: 'g', p: 'g', y: 'g', i: 'i', m: 'm', w: 'm', n: 'n', u: 'n', v: 'n', r: 'n', x: 'n', o: 'o', s: 's', z: 's', t: 't' };
  // returns svg path data (screen space) for `str` written at (x, y) baseline-left, glyph height h (cm)
  function hand(sf, x, y, str, h, seed, slant) {
    const rng = mulberry32(seed || 7);
    const sl = slant == null ? 0.2 : slant;
    let d = '', cx = x;
    const tr = (gx, gy, s, ox, oy) => sf(cx + (gx + (1 - gy) * sl) * h * s + (ox || 0), y - h + gy * h * s + (1 - s) * h + (oy || 0));
    let word = null, extras = [];
    const flush = () => { if (word && word.length > 1) d += smooth(word); word = null; for (const e of extras) d += smooth(e); extras = []; };
    for (const ch of String(str)) {
      const lo = ch.toLowerCase();
      const wob = (rng() - 0.5) * 0.06 * h;
      if (DIG[ch]) {
        flush();
        const s = 0.92 + rng() * 0.12;
        for (const st of DIG[ch]) d += smooth(st.map(p => tr(p[0], p[1], s, 0, wob)));
        cx += (ch === '.' ? 0.22 : ch === '1' ? 0.42 : ch === '-' ? 0.42 : 0.66) * h * s;
      } else if (LET[lo]) {
        const [g, w] = CUR[LET[lo]];
        const s = ch !== lo ? 1.25 : 1;
        const pts = g.map(p => tr(p[0], ch !== lo ? Math.min(p[1], 1) * 1 - (1 - p[1]) * 0.6 : p[1], 1, 0, wob));
        if (!word) word = pts; else word = word.concat(pts);
        if (lo === 'i' || lo === 'j') extras.push([tr(0.12, 0.3, 1), tr(0.15, 0.33, 1)]);
        if (lo === 't') extras.push([tr(0.0, 0.42, 1), tr(0.3, 0.4, 1)]);
        cx += w * h * s * (0.95 + rng() * 0.1);
      } else { flush(); cx += 0.42 * h; }
    }
    flush();
    return d;
  }
  const ink = (d, col, w, op) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${op != null ? ` opacity="${op}"` : ''}/>`;

  // ---------- palette ----------
  function makeK(night) {
    if (!night) return c => c;
    return c => { const [r, g, b] = hx(c); return toHex([r * 0.66 + 10, g * 0.6 + 10, b * 0.6 + 22]); };
  }

  // ================= BACKGROUND (out of focus shop beyond the counter) =================
  function background(D, K, night) {
    const yE = proj(0, GLASS, ZFAR)[1];
    const rng = mulberry32(night ? 3131 : 1313);
    let s = R(0, 0, 2400, 1350, night ? '#1A1F2E' : '#E9D9BE');
    let g = '';
    // outside street seen through the open shutter (top band)
    g += R(-100, -40, 2600, 200, night ? '#0E1630' : '#FFF4DD');
    g += R(560, -40, 1300, 190, night ? '#132048' : '#FFFBF0');
    if (!night) {
      g += R(900, 60, 320, 90, '#E7B04A', 'rx="40" opacity=".75"');   // passing auto-rickshaw blur
      g += R(930, 40, 200, 40, '#3C6E4F', 'rx="20" opacity=".6"');
      g += R(1500, 30, 70, 150, '#5A6B8C', 'rx="30" opacity=".6"');   // passer-by
      g += R(1580, 40, 60, 140, '#B48ED6', 'rx="30" opacity=".5"');
    } else {
      g += R(700, 80, 360, 60, '#2C3E70', 'rx="30"');
      g += R(1600, 20, 260, 140, '#1E9E62', 'rx="40" opacity=".35"');  // pharmacy cross glow
    }
    // shutter edges / shop front walls
    g += R(380, -40, 200, 380, night ? '#262838' : '#B9A88E');
    g += R(1840, -40, 220, 380, night ? '#262838' : '#B9A88E');
    // side shelves with colourful medicine stock
    for (const [x0, x1] of [[-60, 380], [2060, 2460]]) {
      g += R(x0, -40, x1 - x0, 400, night ? '#2B2422' : '#8A6446');
      for (let row = 0; row < 3; row++) {
        let x = x0 + 10;
        while (x < x1 - 20) {
          const w = 30 + rng() * 50;
          const col = ['#E7B04A', '#5AA0D8', '#E36F5C', '#7BC18E', '#B48ED6', '#F2D16B', '#FFFFFF'][Math.floor(rng() * 7)];
          g += R(x, 10 + row * 110 + rng() * 20, w, 70 + rng() * 20, night ? K(col) : col, 'opacity=".85"');
          x += w + 8;
        }
      }
    }
    // shop floor between door and counter (with the door's light spill)
    g += R(-100, 150, 2600, 260, night ? '#2A2C3A' : '#D8C6A6');
    g += `<path d="M640 150L1780 150L2100 420L320 420Z" fill="${night ? '#3B4566' : '#FFF6E2'}" opacity="${night ? 0.5 : 0.75}"/>`;
    g += R(-100, 300, 2600, 120, night ? '#141722' : '#7C6650', 'opacity=".55"'); // shadow of the counter body
    s += `<g filter="${D.filter('bgblur', '<feGaussianBlur stdDeviation="18"/>', 'x="-5%" y="-30%" width="110%" height="170%"')}">${g}</g>`;
    // bokeh
    let bk = '';
    const cols = night ? ['#FFB35C', '#FFD38A', '#FFFFFF', '#FF6A5A', '#5BE09A', '#9CC4F0'] : ['#FFFFFF', '#FFF2D6', '#FFE7B0'];
    for (let i = 0; i < (night ? 30 : 16); i++) {
      const x = 450 + rng() * 1500, y = -10 + rng() * 210, r = 14 + rng() * 34;
      const c = cols[Math.floor(rng() * cols.length)];
      bk += C(x, y, r, c, `opacity="${n((night ? 0.18 : 0.22) + rng() * 0.2)}"`);
    }
    s += `<g filter="${D.filter('bk', '<feGaussianBlur stdDeviation="2.5"/>')}">${bk}</g>`;
    return { s, yE };
  }

  // ================= COUNTER SURFACE =================
  function counter(D, K, night, yE) {
    let s = '';
    const W0 = K('#B9875A'), W1 = K('#9A6B43'), W2 = K('#7A5233'), WL = K('#CFA176');
    s += R(0, yE, 2400, 1350 - yE, D.lin('wood', 0, yE, 0, 1350, [[0, mix(W0, WL, 0.25)], [0.45, W0], [1, mix(W0, W1, 0.5)]]));
    // wood grain (laminate) running left-right, projected on the table plane
    const rng = mulberry32(555);
    let g1 = '', g2 = '', g3 = '';
    for (let k = 0; k < 64; k++) {
      const Z0 = 20 + Math.pow(rng(), 0.85) * 52, amp = 0.15 + rng() * 0.6, fr = 0.02 + rng() * 0.05, ph = rng() * 6;
      const P = [];
      for (let X = -110; X <= 110; X += 7) P.push(proj(X, 0, Z0 + amp * Math.sin(X * fr + ph) + 0.25 * Math.sin(X * 0.17 + k)));
      const dd = smooth(P);
      if (k % 3 === 0) g3 += dd; else if (k % 3 === 1) g1 += dd; else g2 += dd;
    }
    s += `<path d="${g1}" stroke="${W1}" stroke-width="2.6" fill="none" opacity=".55"/>`;
    s += `<path d="${g2}" stroke="${W2}" stroke-width="1.6" fill="none" opacity=".4"/>`;
    s += `<path d="${g3}" stroke="${WL}" stroke-width="3" fill="none" opacity=".45"/>`;
    // cathedral figure in the grain
    let cat = '';
    for (const [Xc, Zc] of [[-34, 54], [30, 31], [8, 66]]) {
      for (let j = 0; j < 5; j++) {
        const P = [];
        const len = 14 + j * 5, wid = 1.2 + j * 0.9;
        for (let t = -1; t <= 1.001; t += 0.1) P.push(proj(Xc + t * len, 0, Zc + wid * (1 - t * t) - wid * 0.2));
        cat += smooth(P);
      }
    }
    s += `<path d="${cat}" stroke="${W1}" stroke-width="2.2" fill="none" opacity=".45"/>`;
    // edge of the counter + glass arris glint
    s += R(0, yE - 6, 2400, 10, W2);
    s += R(0, yE + 2, 2400, 3, '#FFFFFF', `opacity="${night ? 0.35 : 0.55}"`);
    s += R(0, yE + 5, 2400, 30, D.lin('edgeSh', 0, yE + 5, 0, yE + 35, [[0, '#000000', 0.18], [1, '#000000', 0]]));
    // top light falling on the far half of the counter
    s += E(1150, 560, 1500, 520, D.rad('pool', 1150, 560, 1500, [[0, night ? '#FFD9A0' : '#FFF1D8', night ? 0.32 : 0.42], [0.6, '#FFF1D8', 0.1], [1, '#FFF1D8', 0]], 'gradientTransform="translate(1150 560) scale(1 0.35) translate(-1150 -560)"'));
    return s;
  }

  // items that sit UNDER the glass (printed matter tucked under the counter glass)
  function underGlass(D, K, night) {
    let s = '';
    // generic UPI QR card
    const q = item(-5, 66, 4, 0.02);
    const qs = surf(q, 0);
    s += path(sPoly(qs, rrPts(0, 0, 8, 11, 0.4)), K('#FFFFFF'));
    s += path(sPoly(qs, rectPts(-4, -5.5, 8, 2)), K('#1F2A44'));
    s += sText(qs, 0, -4.15, 0.75, K('#FFFFFF'), 'SCAN &amp; PAY', 'font-weight="600" text-anchor="middle"');
    const rng = mulberry32(808);
    let mod = '';
    const ms = 0.3, q0x = -2.85, q0y = -2.9;
    for (let i = 0; i < 19; i++) for (let j = 0; j < 19; j++) {
      const finder = (i < 7 && j < 7) || (i > 11 && j < 7) || (i < 7 && j > 11);
      let on;
      if (finder) { const a = i > 11 ? i - 12 : i, b = j > 11 ? j - 12 : j; on = a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); } else on = rng() < 0.48;
      if (on) mod += sPoly(qs, rectPts(q0x + i * ms, q0y + j * ms, ms * 1.02, ms * 1.02));
    }
    s += path(mod, K('#1F2A44'));
    s += path(sPoly(qs, rectPts(-2.4, 3.2, 4.8, 0.35)), K('#AEB6C2')) + path(sPoly(qs, rectPts(-1.6, 3.9, 3.2, 0.3)), K('#C8161E'), 'opacity=".7"');
    // visiting cards
    const v1 = item(-27, 67, -7, 0.02), v1s = surf(v1, 0);
    s += path(sPoly(v1s, rectPts(-4.5, -2.7, 9, 5.4)), K('#F6F1E6'));
    s += path(sPoly(v1s, rectPts(-4.5, -2.7, 1.4, 5.4)), K('#1E9E62'));
    s += sText(v1s, -2.5, -0.9, 0.62, K('#1F2A44'), 'Dr. A. Verma', 'font-weight="600"');
    s += sText(v1s, -2.5, 0.0, 0.38, K('#6B7686'), 'MBBS, MD · Clinic 9 to 1');
    s += path(sPoly(v1s, rectPts(-2.5, 0.8, 5.6, 0.28)), K('#AEB6C2')) + path(sPoly(v1s, rectPts(-2.5, 1.4, 4.2, 0.28)), K('#AEB6C2'));
    const v2 = item(-17.5, 70, 5, 0.02), v2s = surf(v2, 0);
    s += path(sPoly(v2s, rectPts(-4.5, -2.7, 9, 5.4)), K('#FFFFFF'));
    s += path(sPoly(v2s, rectPts(-4.5, -2.7, 9, 1.3)), K('#C8161E'), 'opacity=".85"');
    s += path(sPoly(v2s, rectPts(-3.6, 0.2, 5.6, 0.3)), K('#AEB6C2')) + path(sPoly(v2s, rectPts(-3.6, 0.9, 4, 0.3)), K('#AEB6C2'));
    // printed price list sheet
    const pl = item(41, 64, -3, 0.02), pls = surf(pl, 0);
    s += path(sPoly(pls, rectPts(-10.5, -7.4, 21, 14.8)), K('#F3EFE4'));
    s += path(sPoly(pls, rectPts(-10.5, -7.4, 21, 1.8)), K('#5AA0D8'), 'opacity=".8"');
    let lines = '';
    for (let k = 0; k < 9; k++) lines += sLine(pls, -9.8, -4.6 + k * 1.3, 9.8, -4.6 + k * 1.3, 2);
    s += `<path d="${lines}" stroke="${K('#AEB6C2')}" stroke-width="2" fill="none"/>`;
    // glass tint over everything under it
    s += R(0, 300, 2400, 1050, night ? '#9FB8C8' : '#D9EEF0', 'opacity=".08"');
    return s;
  }

  function glassSheen(D, night) {
    let s = '';
    const band = [proj(-70, GLASS, 62.5), proj(25, GLASS, 62.5), proj(25, GLASS, 65.5), proj(-70, GLASS, 65.5)];
    s += `<g filter="${D.filter('sheen', '<feGaussianBlur stdDeviation="14"/>', 'x="-20%" y="-200%" width="140%" height="500%"')}">${path(dP(band), '#FFFFFF', `opacity="${night ? 0.32 : 0.45}"`)}</g>`;
    const band2 = [proj(-60, GLASS, 63.6), proj(10, GLASS, 63.6), proj(10, GLASS, 64.3), proj(-60, GLASS, 64.3)];
    s += path(dP(band2), '#FFFFFF', `opacity="${night ? 0.25 : 0.35}"`);
    // faint diagonal reflection streaks
    s += path(dP([proj(-80, GLASS, 30), proj(-62, GLASS, 30), proj(-20, GLASS, 72), proj(-38, GLASS, 72)]), '#FFFFFF', 'opacity=".05"');
    s += path(dP([proj(-55, GLASS, 25), proj(-50, GLASS, 25), proj(-8, GLASS, 72), proj(-13, GLASS, 72)]), '#FFFFFF', 'opacity=".05"');
    return s;
  }

  // ================= PROPS =================
  // soft shadow footprints are accumulated, then drawn blurred under the props
  function footprint(it, pts, h) {
    const off = [0.35 + h * 0.25, -(0.5 + h * 0.55)];
    return dP(pts.map(p => { const w = world(it, p[0], p[1], 0); return proj(w[0] + off[0], GLASS, w[2] + off[1]); }));
  }
  function contact(it, pts) { return dP(pts.map(p => { const w = world(it, p[0], p[1], 0); return proj(w[0], GLASS, w[2]); })); }

  function medBox(K, it, w, d, h, col, name, sub, upright) {
    let s = '';
    const pts = rrPts(0, 0, w, d, 0.12, 1);
    const side = K(mix(col, '#3A2A20', 0.32)), sideL = K(mix(col, '#FFFFFF', 0.1));
    s += slab(it, pts, 0, h, side, K('#FFFFFF'), { walls: sideL });
    const ts = surf(it, h);
    if (!upright) {
      s += path(sPoly(ts, rectPts(-w / 2, -d / 2, w * 0.36, d)), K(col));
      s += path(sPoly(ts, rectPts(-w / 2 + w * 0.36, -d / 2 + d * 0.72, w * 0.64, d * 0.1)), K(col), 'opacity=".6"');
      s += sText(ts, -w / 2 + w * 0.4, -d / 2 + d * 0.38, d * 0.17, K('#1F2A44'), name, `font-weight="600" textLength="${n(w * 0.56)}" lengthAdjust="spacingAndGlyphs"`);
      s += sText(ts, -w / 2 + w * 0.4, -d / 2 + d * 0.58, d * 0.11, K('#6B7686'), sub);
      s += sText(ts, -w / 2 + w * 0.18, d * 0.12, d * 0.3, K('#FFFFFF'), 'Rx', 'font-weight="600" text-anchor="middle"');
    } else {
      s += path(sPoly(ts, rectPts(-w / 2, -d / 2, w, d)), K(col));
      // label on the camera-facing wall
      const fs = (x, y) => sp(it, x, d / 2, h - y);
      s += path(sPoly(fs, rectPts(-w / 2 + 0.3, 1.4, w - 0.6, 4.2)), K('#FFFFFF'), 'opacity=".92"');
      s += sText(fs, 0, 3.0, 0.95, K('#1F2A44'), name, 'font-weight="600" text-anchor="middle"');
      s += sText(fs, 0, 4.3, 0.5, K('#6B7686'), sub, 'text-anchor="middle"');
      s += path(sPoly(fs, rectPts(-w / 2, 6.6, w, 1.1)), K(col), 'opacity=".55"');
    }
    return s;
  }

  // blister strip; kind: 'tab' | 'cap'; cols: number of columns left (cut strip); empties: indices pushed out
  function strip(K, it, o) {
    let s = '';
    const cols = o.cols || 5, L = cols * 2.25 + 2.3, W = 5.6;
    const x0 = -L / 2;
    const fs = surf(it, 0.05);
    const foil = K(o.foil || '#D5DBE2'), foilD = K(mix(o.foil || '#D5DBE2', '#6B7686', 0.35));
    s += path(sPoly(surf(it, 0), rrPts(0, 0, L, W, 0.35, 2)), foilD);
    s += path(sPoly(fs, rrPts(0, 0, L, W, 0.35, 2)), foil);
    // print on foil
    s += path(sPoly(fs, rectPts(x0 + L - 2.1, -W / 2, 2.1, W)), K(o.band || '#5AA0D8'), 'opacity=".85"');
    s += sText(fs, x0 + L - 1.05, 0.25, 0.42, K('#FFFFFF'), o.dose || '650', 'font-weight="600" text-anchor="middle"');
    for (let i = 0; i < cols; i++) {
      const cx = x0 + 1.25 + i * 2.25;
      s += path(sPoly(fs, rectPts(cx - 0.8, -0.18, 1.6, 0.14)), K(o.band || '#5AA0D8'), 'opacity=".55"');
      if (i < cols - 1) s += `<path d="${sLine(fs, cx + 1.12, -W / 2 + 0.2, cx + 1.12, W / 2 - 0.2, 1)}" stroke="${foilD}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".7"/>`;
    }
    const rng = mulberry32(o.seed || 1);
    for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) {
      const cx = x0 + 1.25 + i * 2.25, cy = j ? 1.35 : -1.35;
      const idx = i * 2 + j;
      if (o.empty && o.empty.includes(idx)) {
        const P = [];
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = (o.kind === 'cap' ? 0.7 : 0.75) * (0.75 + rng() * 0.35); P.push([cx + r * Math.cos(a) * (o.kind === 'cap' ? 0.7 : 1), cy + r * Math.sin(a) * (o.kind === 'cap' ? 1.3 : 1)]); }
        s += path(sPoly(fs, P), K('#59616E'));
        s += path(sPoly(surf(it, 0.09), P.map(p => [cx + (p[0] - cx) * 0.6, cy + (p[1] - cy) * 0.6])), K('#9AA3AE'));
        continue;
      }
      const shapeAt = (c, sc) => o.kind === 'cap' ? sPoly(surf(it, c), rrPts(cx, cy, 0.95 * sc, 2.1 * sc, 0.47 * sc, 3)) : sPoly(surf(it, c), circPts(cx, cy, 0.92 * sc, null, 14));
      s += path(shapeAt(0.06, 1.08), K('#8E97A3'), 'opacity=".55"');
      if (o.kind === 'cap') {
        const s1 = surf(it, 0.42);
        s += path(sPoly(s1, rrPts(cx, cy, 0.8, 1.9, 0.4, 3)), K(o.c2 || '#F2D16B'));
        s += path(sPoly(s1, rrPts(cx, cy - 0.45, 0.8, 1.0, 0.4, 3)), K(o.c1 || '#E36F5C'));
        s += path(sPoly(s1, rrPts(cx - 0.18, cy - 0.1, 0.18, 1.3, 0.09, 2)), '#FFFFFF', 'opacity=".55"');
      } else {
        s += path(sPoly(surf(it, 0.36), circPts(cx + 0.06, cy + 0.06, 0.78, null, 14)), K(mix(o.tab || '#FFFFFF', '#8E97A3', 0.4)));
        s += path(sPoly(surf(it, 0.42), circPts(cx - 0.03, cy - 0.03, 0.72, null, 14)), K(o.tab || '#FFFFFF'));
        s += `<path d="${sLine(surf(it, 0.43), cx - 0.5, cy, cx + 0.5, cy, 1)}" stroke="${K(mix(o.tab || '#FFFFFF', '#6B7686', 0.4))}" stroke-width="1.6"/>`;
      }
      s += path(shapeAt(0.5, 1.0), '#FFFFFF', 'opacity=".16"');
      s += path(sPoly(surf(it, 0.52), circPts(cx - 0.42, cy - 0.45, 0.2, 0.12, 8)), '#FFFFFF', 'opacity=".85"');
    }
    // foil sheen
    s += path(sPoly(fs, [[x0 + 0.5, -W / 2], [x0 + 2.2, -W / 2], [x0 + 0.9, W / 2], [x0 - 0.2, W / 2]]), '#FFFFFF', 'opacity=".35"');
    return { s, pts: rrPts(0, 0, L, W, 0.35, 1) };
  }

  // ---------- open bill book ----------
  function billBook(K, night, name) {
    const it = item(0, 45, -3);
    const PW = 14.5, PH = 21, COV = 0.3, PG = 0.55;
    const lift = u => 0.42 * Math.exp(-u / 1.3);       // pages bulge up at the spine
    const cTop = (x) => COV + PG + lift(Math.abs(x));
    let s = '';
    // cover
    s += slab(it, rrPts(0, 0, 2 * PW + 1.0, PH + 0.9, 0.35, 2), 0, COV, K('#141C30'), K('#1F2A44'), { walls: K('#2C3A5C') });
    // page blocks
    const pageOutline = side => {
      const P = [];
      const xs = side < 0 ? [-PW, -0.15] : [0.15, PW];
      return [[xs[0], -PH / 2], [xs[1], -PH / 2], [xs[1], PH / 2], [xs[0], PH / 2]];
    };
    for (const side of [-1, 1]) {
      const o = pageOutline(side);
      const B = o.map(p => sp(it, p[0], p[1], COV));
      // near-edge face (the page block thickness), sampled to follow the bulge
      const face = [];
      const xA = o[3][0], xB = o[2][0];
      for (let k = 0; k <= 12; k++) { const x = xA + (xB - xA) * k / 12; face.push(sp(it, x, PH / 2, cTop(x))); }
      for (let k = 12; k >= 0; k--) { const x = xA + (xB - xA) * k / 12; face.push(sp(it, x, PH / 2, COV)); }
      s += path(dP(face), K('#E4DCC8'));
      let ln = '';
      for (let k = 1; k < 5; k++) { const c = COV + PG * k / 5; ln += sLine((x, y) => sp(it, x, y, c), xA + 0.1, PH / 2, xB - 0.1, PH / 2, 1); }
      s += `<path d="${ln}" stroke="${K('#BDB29A')}" stroke-width="1.2" fill="none"/>`;
      void B;
      // page surface
      const top = [];
      for (let k = 0; k <= 14; k++) { const x = xA + (xB - xA) * k / 14; top.push(sp(it, x, -PH / 2, cTop(x))); }
      for (let k = 14; k >= 0; k--) { const x = xA + (xB - xA) * k / 14; top.push(sp(it, x, PH / 2, cTop(x))); }
      s += path(dP(top), K(side < 0 ? '#F8EFCB' : '#FBF8F1'));
    }
    // gutter shading
    const gsf = (x, y) => sp(it, x, y, cTop(x));
    for (const [x1, x2, op] of [[-1.6, 1.6, 0.1], [-0.8, 0.8, 0.12], [-0.3, 0.3, 0.18]]) {
      const P = [];
      for (let k = 0; k <= 4; k++) P.push(gsf(x1 + (x2 - x1) * k / 4, -PH / 2));
      for (let k = 4; k >= 0; k--) P.push(gsf(x1 + (x2 - x1) * k / 4, PH / 2));
      s += path(dP(P), '#5A4630', `opacity="${op}"`);
    }
    // carbon sheet peeking from under the right page top edge
    s += path(dP([sp(it, 1.0, -PH / 2 - 0.45, COV + PG), sp(it, PW - 0.6, -PH / 2 - 0.25, COV + PG), sp(it, PW - 0.6, -PH / 2 + 0.05, COV + PG), sp(it, 1.0, -PH / 2 + 0.05, COV + PG)]), K('#2E2F6B'));

    // ---- printing on both pages ----
    const RED = K('#B8323A'), RULE = K('#E3A3A6'), BLUE = K('#22357F'), CARB = K('#4B4B9A');
    const pg = side => (u, v) => { const x = side < 0 ? -PW + u : 0.15 + u; return gsf(x, -PH / 2 + v); };
    const store = esc(String(name || 'Sharma Medical Store').toUpperCase());
    for (const side of [-1, 1]) {
      const f = pg(side);
      const est = store.length * 0.62 * 0.62;
      s += sText(f, PW / 2, 1.35, 0.62, RED, store, `font-weight="600" text-anchor="middle"${est > 12.6 ? ` textLength="12.6" lengthAdjust="spacingAndGlyphs"` : ''}`);
      s += sText(f, PW / 2, 1.95, 0.32, RED, 'Chemists &amp; Druggists · Main Bazaar', 'text-anchor="middle"');
      s += path(sPoly(f, rrPts(PW / 2, 2.75, 3.4, 0.62, 0.3, 3)), RED);
      s += sText(f, PW / 2, 2.92, 0.36, K('#FFFFFF'), 'CASH MEMO', 'font-weight="600" text-anchor="middle" letter-spacing=".05"');
      s += sText(f, 0.7, 3.75, 0.36, RED, 'No.', 'font-weight="500"');
      s += sText(f, 1.45, 3.75, 0.46, K('#C8161E'), side < 0 ? '1427' : '1428', 'font-weight="600"');
      s += sText(f, 9.4, 3.75, 0.36, RED, 'Date', 'font-weight="500"');
      s += `<path d="${sLine(f, 10.4, 3.85, 13.8, 3.85, 3)}" stroke="${RULE}" stroke-width="1.6" fill="none"/>`;
      s += sText(f, 0.7, 4.65, 0.36, RED, 'Name', 'font-weight="500"');
      s += `<path d="${sLine(f, 1.8, 4.75, 13.8, 4.75, 4)}" stroke="${RULE}" stroke-width="1.6" fill="none"/>`;
      // table
      const cols = [0.6, 1.7, 7.9, 9.9, 11.5, 13.9];
      const heads = ['Qty', 'Particulars', 'Batch', 'Exp.', 'Amount'];
      s += path(sPoly(f, rectPts(0.6, 5.2, 13.3, 0.7)), RED, 'opacity=".12"');
      heads.forEach((h, i) => { s += sText(f, (cols[i] + cols[i + 1]) / 2, 5.7, 0.34, RED, h, 'font-weight="600" text-anchor="middle"'); });
      let rl = sLine(f, 0.6, 5.2, 13.9, 5.2, 4) + sLine(f, 0.6, 5.9, 13.9, 5.9, 4);
      for (let k = 1; k <= 9; k++) rl += sLine(f, 0.6, 5.9 + k * 1.05, 13.9, 5.9 + k * 1.05, 4);
      for (const x of cols) rl += sLine(f, x, 5.2, x, 15.35, 3);
      rl += sLine(f, 9.9, 16.4, 13.9, 16.4, 2);
      s += `<path d="${rl}" stroke="${RULE}" stroke-width="1.5" fill="none"/>`;
      s += sText(f, 9.75, 16.15, 0.38, RED, 'TOTAL', 'font-weight="600" text-anchor="end"');
      s += `<path d="${sLine(f, 0.8, 18.6, 5.2, 18.6, 2)}" stroke="${RULE}" stroke-width="1.5" fill="none"/>`;
      s += sText(f, 0.8, 19.1, 0.3, RED, 'E. &amp; O.E.');
      s += sText(f, 13.8, 19.1, 0.3, RED, 'for ' + store, `text-anchor="end"${store.length > 22 ? ' textLength="6.4" lengthAdjust="spacingAndGlyphs"' : ''}`);
    }
    // ---- handwriting ----
    const L = pg(-1), Rp = pg(1);
    let carb = '', blue = '';
    const rowY = k => 5.9 + k * 1.05 + 0.82;
    const leftRows = [['2', 'Paracetamol', 'B2041', '8/27', '112'], ['1', 'Cough syrup', 'CS118', '3/27', '45'], ['3', 'Antacid gel', 'AG07', '11/26', '260'], ['1', 'ORS', 'OR55', '6/27', '38'], ['2', 'Vit C tabs', 'VC31', '1/28', '90']];
    carb += hand(L, 10.6, 3.7, '10/10', 0.5, 11);
    carb += hand(L, 2.1, 4.55, 'Ramesh ji', 0.55, 12);
    leftRows.forEach((r, k) => {
      const y = rowY(k);
      carb += hand(L, 0.95, y, r[0], 0.55, 20 + k) + hand(L, 1.95, y, r[1], 0.5, 30 + k) + hand(L, 8.1, y, r[2], 0.42, 40 + k, 0.1) + hand(L, 10.05, y, r[3], 0.42, 50 + k) + hand(L, 12.1, y, r[4] + '/-', 0.55, 60 + k);
    });
    carb += hand(L, 11.7, 16.15, '545/-', 0.66, 70);
    const ringP = circPts(12.75, 15.9, 1.35, 0.6, 18).map(p => L(p[0], p[1]));
    carb += smooth(ringP.concat([ringP[0], ringP[1]]));
    carb += hand(L, 1.2, 18.4, 'Sharma', 0.6, 71);
    s += ink(carb, CARB, 2.6, 0.78);
    // right page: the bill being written right now
    blue += hand(Rp, 10.6, 3.7, '11/10', 0.5, 81);
    blue += hand(Rp, 2.1, 4.55, 'Behen ji', 0.55, 82);
    const rightRows = [['1', 'Amlodipine', 'AM90', '4/27', '240'], ['1', 'Cough syrup', 'CS121', '5/27', '75'], ['2', 'Bandage', '', '', '']];
    rightRows.forEach((r, k) => {
      const y = rowY(k);
      blue += hand(Rp, 0.95, y, r[0], 0.55, 90 + k) + hand(Rp, 1.95, y, r[1], 0.5, 95 + k);
      if (r[2]) blue += hand(Rp, 8.1, y, r[2], 0.42, 100 + k, 0.1) + hand(Rp, 10.05, y, r[3], 0.42, 105 + k) + hand(Rp, 12.1, y, r[4] + '/-', 0.55, 110 + k);
    });
    s += ink(blue, BLUE, 2.4);
    // ---- pen lying across the right page ----
    const pen = penOn(K, night, it, cTop);
    s += pen;
    return { s, it, pts: rrPts(0, 0, 2 * PW + 1.0, PH + 0.9, 0.35, 1) };
  }

  function tube(K, a, b, ra, rb, col, hl) { // a, b world points; screen-space capsule section
    const A = proj(a[0], a[1], a[2]), B = proj(b[0], b[1], b[2]);
    const sa = scaleAt(a[1], a[2]) * ra, sb = scaleAt(b[1], b[2]) * rb;
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
    let s = path(dP([[A[0] + px * sa, A[1] + py * sa], [B[0] + px * sb, B[1] + py * sb], [B[0] - px * sb, B[1] - py * sb], [A[0] - px * sa, A[1] - py * sa]]), col);
    // shade (lower edge) + highlight (upper edge); screen 'up' side is -y
    const up = py < 0 ? 1 : -1;
    s += path(dP([[A[0] - up * px * sa, A[1] - up * py * sa], [B[0] - up * px * sb, B[1] - up * py * sb], [B[0] - up * px * sb * 0.35, B[1] - up * py * sb * 0.35], [A[0] - up * px * sa * 0.35, A[1] - up * py * sa * 0.35]]), '#000000', 'opacity=".18"');
    if (hl) s += path(dP([[A[0] + up * px * sa * 0.75, A[1] + up * py * sa * 0.75], [B[0] + up * px * sb * 0.75, B[1] + up * py * sb * 0.75], [B[0] + up * px * sb * 0.35, B[1] + up * py * sb * 0.35], [A[0] + up * px * sa * 0.35, A[1] + up * py * sa * 0.35]]), '#FFFFFF', `opacity="${hl}"`);
    return s;
  }
  function penOn(K, night, bookIt, cTop) {
    // pen axis in world coords, resting on the right page
    const T = world(bookIt, 4.4, 4.2, 0), E2 = world(bookIt, 16.8, -4.8, 0);
    const base = bookIt.y0 + cTop(6) + 0.45;
    const at = t => [T[0] + (E2[0] - T[0]) * t, base, T[2] + (E2[2] - T[2]) * t];
    const len = Math.hypot(E2[0] - T[0], E2[2] - T[2]);
    const u = cm => cm / len;
    let s = '';
    // shadow on the page
    const sh = [[0, 0.1], [1, 0.42]].map(([t, r]) => { const p = at(t); return proj(p[0] + 0.45, base - 0.45, p[2] - 0.75); });
    s += `<path d="${dO(sh)}" stroke="#2A1E14" stroke-width="16" stroke-linecap="round" opacity=".28" filter="url(#${ID}_m_soft2)"/>`;
    s += tube(K, at(u(0)), at(u(0.25)), 0.06, 0.1, '#20232A');
    s += tube(K, at(u(0.25)), at(u(1.4)), 0.1, 0.38, K('#C9CED6'), 0.6);
    s += tube(K, at(u(1.4)), at(u(4.2)), 0.42, 0.44, K('#7FA3D9'), 0.35);
    s += tube(K, at(u(4.2)), at(u(12.4)), 0.44, 0.45, K('#F4F6F8'), 0.75);
    s += tube(K, at(u(12.4)), at(u(14.6)), 0.47, 0.47, K('#2C4A9A'), 0.4);
    const ce = proj(...at(1)); s += C(ce[0], ce[1], scaleAt(base, at(1)[2]) * 0.46, K('#24407F'));
    // clip
    const c1 = at(u(10.3)), c2 = at(u(14.2));
    s += tube(K, [c1[0] - 0.1, base + 0.42, c1[2] + 0.2], [c2[0] - 0.1, base + 0.42, c2[2] + 0.2], 0.12, 0.13, K('#DCE1E8'), 0.7);
    return s;
  }

  // ---------- calculator ----------
  function calculator(K, night) {
    const it = item(22, 27.5, -14);
    const w = 8.6, d = 15, h = 1.5;
    const out = rrPts(0, 0, w, d, 0.9, 4);
    let s = '';
    s += slab(it, out, 0, h, K('#262B35'), K('#3E4655'), { walls: K('#4A5363') });
    const ts = surf(it, h);
    s += path(sPoly(surf(it, h + 0.05), rrPts(0, 0, w - 0.5, d - 0.5, 0.7, 3)), K('#454E5E'));
    // solar cells + label
    s += path(sPoly(ts, rrPts(1.9, -6.35, 3.6, 0.95, 0.12, 1)), K('#2A221F'));
    let cl = '';
    for (let k = 1; k < 4; k++) cl += sLine(ts, 0.1 + k * 0.9, -6.82, 0.1 + k * 0.9, -5.88, 1);
    s += `<path d="${cl}" stroke="${K('#5B4A40')}" stroke-width="1.4"/>`;
    s += sText(ts, -3.6, -6.1, 0.42, K('#AEB6C2'), '12 DIGITS', 'font-weight="600"');
    // display
    s += path(sPoly(surf(it, h + 0.05), rrPts(0, -4.3, 7.5, 2.4, 0.3, 2)), K('#1C2028'));
    s += path(sPoly(surf(it, h + 0.02), rrPts(0, -4.3, 6.9, 1.8, 0.15, 2)), night ? '#A9BC97' : '#BAC6A8');
    s += path(sPoly(surf(it, h + 0.02), [[-3.45, -5.2], [-1.2, -5.2], [-2.6, -3.4], [-3.45, -3.4]]), '#FFFFFF', 'opacity=".22"');
    s += sText(surf(it, h + 0.02), 3.2, -3.72, 1.25, '#2B3528', '3,820.', 'font-weight="500" text-anchor="end"');
    s += sText(surf(it, h + 0.02), -3.2, -4.75, 0.32, '#2B3528', 'M  GT', 'font-weight="600"');
    // keys
    const rows = [['MC', 'MR', 'M−', 'M+', '÷'], ['%', '7', '8', '9', '×'], ['√', '4', '5', '6', '−'], ['C', '1', '2', '3', '+'], ['AC', '0', '00', '.', '=']];
    rows.forEach((row, j) => row.forEach((lab, i) => {
      const cx = -3.28 + i * 1.64, cy = -1.55 + j * 1.83;
      const num = /^[0-9.]+$/.test(lab) || lab === '00';
      const red = lab === 'AC' || lab === 'C';
      const topC = red ? K('#E36F5C') : num ? K('#E9ECF0') : K('#626B7B');
      const skC = red ? K('#A84A3A') : num ? K('#AAB2BE') : K('#3A404C');
      const kp = rrPts(cx, cy, 1.34, 1.22, 0.28, 2);
      s += slab(it, kp, h, h + 0.38, skC, topC);
      s += path(sPoly(surf(it, h + 0.385), rrPts(cx - 0.1, cy - 0.1, 0.9, 0.7, 0.2, 2)), '#FFFFFF', `opacity="${num ? 0.35 : 0.1}"`);
      s += sText(surf(it, h + 0.39), cx, cy + 0.2, num ? 0.6 : 0.42, num ? K('#2A2F3A') : K('#FFFFFF'), lab, 'font-weight="600" text-anchor="middle"');
    }));
    return { s, it, pts: out, h };
  }

  // ---------- smartphone, face up, screen off ----------
  function phone(K, night) {
    const it = item(-14, 25.5, 16);
    const w = 7.6, d = 16.2, h = 0.85;
    const out = rrPts(0, 0, w, d, 1.05, 5);
    let s = '';
    s += slab(it, out, 0, h, K('#3B414D'), '#0B0E14', { walls: K('#6B7686') });
    // side buttons on the camera-facing long edge
    for (const [y0, len] of [[-4.2, 2.2], [-1.3, 1.2]]) {
      s += slab(it, rectPts(w / 2 - 0.02, y0, 0.12, len), 0.25, 0.6, K('#6B7686'), K('#8C95A3'));
    }
    const sc = surf(it, h + 0.01);
    s += path(sPoly(sc, rrPts(0, 0, w - 0.36, d - 0.36, 0.85, 4)), night ? '#121725' : '#141A28');
    // soft reflection of the tube light sweeping across the glass
    s += path(sPoly(sc, [[-3.6, -2.6], [3.6, -5.6], [3.6, -3.4], [-3.6, -0.4]]), '#FFFFFF', `opacity="${night ? 0.07 : 0.1}"`);
    s += path(sPoly(sc, [[-3.6, 1.0], [3.6, -2.0], [3.6, -1.6], [-3.6, 1.4]]), '#FFFFFF', `opacity="${night ? 0.05 : 0.07}"`);
    s += path(sPoly(sc, circPts(0, -7.35, 0.22, null, 10)), '#03050A');
    s += path(sPoly(sc, circPts(-0.06, -7.41, 0.07, null, 6)), '#3B5B9A', 'opacity=".9"');
    s += path(sPoly(sc, rrPts(0, -7.92, 1.3, 0.1, 0.05, 1)), '#222833');
    // bright rim highlight along the far edge
    const rim = rrPts(0, 0, w - 0.08, d - 0.08, 1.0, 5).filter(p => p[1] < -d / 2 + 1.2 || p[0] < -w / 2 + 0.3);
    s += `<path d="${dO(rim.map(p => sp(it, p[0], p[1], h)))}" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".35"/>`;
    return { s, it, pts: out, h };
  }

  // ---------- rubber-banded stack of distributor bills ----------
  function billStack(K, night) {
    const it = item(31, 46.5, 9);
    const w = 21, d = 14.8;
    const rng = mulberry32(2024);
    let s = '';
    const cols = ['#FFFFFF', '#F6D6DA', '#FFFFFF', '#F7E7AE', '#FFFFFF', '#FFFFFF', '#F6D6DA', '#FFFFFF', '#DDEBF7', '#FFFFFF', '#F7E7AE', '#FFFFFF', '#FFFFFF'];
    const N = cols.length, th = 0.11;
    let top = 0;
    for (let i = 0; i < N; i++) {
      const dx = (rng() - 0.5) * 0.7, dy = (rng() - 0.5) * 0.6, rot = (rng() - 0.5) * 2.4 * Math.PI / 180;
      const P = rectPts(-w / 2, -d / 2, w, d).map(p => [dx + p[0] * Math.cos(rot) - p[1] * Math.sin(rot), dy + p[0] * Math.sin(rot) + p[1] * Math.cos(rot)]);
      const c = (i + 1) * th;
      s += path(sPoly(surf(it, c - th * 0.6), P), K(mix(cols[i], '#8A7A62', 0.35)));
      s += path(sPoly(surf(it, c), P), K(cols[i]));
      top = c;
    }
    const ts = surf(it, top + 0.005);
    // printed invoice on the top sheet (dot-matrix look)
    s += path(sPoly(ts, rectPts(-9.8, -6.6, 6.2, 1.5)), K('#1F2A44'));
    s += path(sPoly(ts, rectPts(-9.4, -6.2, 4.4, 0.3)), K('#FFFFFF'), 'opacity=".85"') + path(sPoly(ts, rectPts(-9.4, -5.6, 3.2, 0.22)), K('#FFFFFF'), 'opacity=".6"');
    s += sText(ts, 9.8, -5.5, 0.62, K('#1F2A44'), 'TAX INVOICE', 'font-weight="600" text-anchor="end"');
    s += sText(ts, 9.8, -4.85, 0.32, K('#6B7686'), 'Inv. No. D/2611 · Credit 30 days', 'text-anchor="end"');
    let ln = '';
    for (let k = 0; k < 3; k++) ln += sLine(ts, -9.8, -4.3 + k * 0.45, -9.8 + 5 + rng() * 3, -4.3 + k * 0.45, 2);
    s += `<path d="${ln}" stroke="${K('#8C95A3')}" stroke-width="2.2" fill="none"/>`;
    s += path(sPoly(ts, rectPts(-9.8, -2.7, 19.6, 0.6)), K('#DCE1E8'));
    let grid = '';
    for (let k = 0; k < 8; k++) {
      const y = -1.55 + k * 0.72;
      for (const [x0, ww] of [[-9.6, 0.8 + rng() * 0.4], [-8.2, 4 + rng() * 2.5], [-1.6, 1.4], [0.6, 1.2], [2.6, 1.0], [4.4, 1.6], [7.4, 1.8 + rng() * 0.3]]) grid += sLine(ts, x0, y, x0 + ww, y, 1);
    }
    s += `<path d="${grid}" stroke="${K('#7A8494')}" stroke-width="2" stroke-dasharray="3 1.5" fill="none"/>`;
    s += `<path d="${sLine(ts, 3.5, 4.4, 9.8, 4.4, 2)}" stroke="${K('#6B7686')}" stroke-width="1.6"/>`;
    s += sText(ts, 4.2, 5.25, 0.42, K('#1F2A44'), 'NET', 'font-weight="600"');
    s += sText(ts, 9.7, 5.25, 0.55, K('#1F2A44'), '18,640.00', 'font-weight="600" text-anchor="end"');
    // violet "RECEIVED" stamp + tick
    const st = (x, y) => ts(x * Math.cos(-0.3) - y * Math.sin(-0.3) - 5.2, x * Math.sin(-0.3) + y * Math.cos(-0.3) + 4.4);
    s += path(sPoly(st, circPts(0, 0, 1.75, null, 22)), 'none', `stroke="${K('#6A4FA0')}" stroke-width="3.2" opacity=".6"`);
    s += path(sPoly(st, circPts(0, 0, 1.3, null, 22)), 'none', `stroke="${K('#6A4FA0')}" stroke-width="1.6" opacity=".5"`);
    s += sText(st, 0, 0.18, 0.5, K('#6A4FA0'), 'RECEIVED', 'font-weight="600" text-anchor="middle" opacity=".65"');
    s += ink(hand(ts, -2.4, 5.4, 'checked', 0.55, 404), K('#22357F'), 2.4);
    // rubber bands: across the short side and around the long side
    const band = K('#C46A3E'), bandL = K('#E39A6E');
    const tb = top + 0.05;
    const across = [[3.6, -d / 2 - 0.05], [4.05, -d / 2 - 0.05], [4.05, d / 2 + 0.05], [3.6, d / 2 + 0.05]];
    s += path(sPoly(surf(it, tb), across), band);
    s += path(dP([sp(it, 3.6, d / 2 + 0.05, tb), sp(it, 4.05, d / 2 + 0.05, tb), sp(it, 4.05, d / 2 + 0.05, 0.05), sp(it, 3.6, d / 2 + 0.05, 0.05)]), K('#9E4E2A'));
    s += `<path d="${sLine(surf(it, tb + 0.01), 3.7, -d / 2, 3.7, d / 2, 2)}" stroke="${bandL}" stroke-width="1.6"/>`;
    const along = [[-w / 2 - 0.05, 2.2], [w / 2 + 0.05, 2.2], [w / 2 + 0.05, 2.65], [-w / 2 - 0.05, 2.65]];
    s += path(sPoly(surf(it, tb + 0.02), along), band);
    s += path(dP([sp(it, -w / 2 - 0.05, 2.2, tb), sp(it, -w / 2 - 0.05, 2.65, tb), sp(it, -w / 2 - 0.05, 2.65, 0.05), sp(it, -w / 2 - 0.05, 2.2, 0.05)]), K('#9E4E2A'));
    s += `<path d="${sLine(surf(it, tb + 0.03), -w / 2, 2.3, w / 2, 2.3, 3)}" stroke="${bandL}" stroke-width="1.6"/>`;
    return { s, it, pts: rectPts(-w / 2 - 0.3, -d / 2 - 0.3, w + 0.6, d + 0.6), h: top };
  }

  // ---------- cutting-chai glass ----------
  function chai(K, night) {
    const it = item(25.5, 66.5, 0);
    const rb = 2.25, rt = 2.95, H = 7.2, tl = 4.9, rtl = rb + (rt - rb) * tl / H;
    let s = '';
    const ring = (r, c, seg) => circPts(0, 0, r, null, seg || 26).map(p => sp(it, p[0], p[1], c));
    s += path(dP(hull(ring(rb, 0.3).concat(ring(rtl, tl)))), K('#9A5A2C'));
    s += path(dP(hull(ring(rb, 0.3).concat(ring(rtl, tl)))), '#000000', 'opacity=".001"');
    // tea body shading: lighter on the lit left
    const tb = ring(rtl, tl), bb = ring(rb, 0.3);
    s += path(dP([bb[13], bb[16], tb[16], tb[13]]), K('#C27C45'), 'opacity=".7"');
    s += path(dP([bb[20], bb[24], tb[24], tb[20]]), K('#6E3C1C'), 'opacity=".55"');
    s += path(dP(ring(rtl - 0.05, tl, 26)), K('#C98A55'));
    s += path(dP(circPts(-0.4, -0.3, rtl * 0.62, rtl * 0.55, 18).map(p => sp(it, p[0], p[1], tl + 0.01))), K('#D9A673'), 'opacity=".6"');
    // empty glass above the tea
    s += path(dP(hull(ring(rtl, tl).concat(ring(rt, H)))), '#FFFFFF', 'opacity=".12"');
    // ribs
    let rib = '';
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2;
      if (Math.sin(a) < -0.1) continue;
      const p1 = sp(it, rb * Math.cos(a), rb * Math.sin(a), 0.3), p2 = sp(it, rt * Math.cos(a), rt * Math.sin(a), H);
      rib += `M${n(p1[0])} ${n(p1[1])}L${n(p2[0])} ${n(p2[1])}`;
    }
    s += `<path d="${rib}" stroke="#FFFFFF" stroke-width="2" opacity=".22"/>`;
    s += `<path d="${dP(ring(rt, H, 30))}" stroke="#FFFFFF" stroke-width="3.2" fill="none" opacity=".75"/>`;
    s += `<path d="${dP(ring(rb + 0.1, 0.05, 26))}" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".35"/>`;
    const hl1 = sp(it, -rb * 0.75, rb * 0.55, 0.8), hl2 = sp(it, -rt * 0.75, rt * 0.55, H - 0.4);
    s += `<path d="M${n(hl1[0])} ${n(hl1[1])}L${n(hl2[0])} ${n(hl2[1])}" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".45"/>`;
    return { s, it, pts: circPts(0, 0, rb + 0.2, null, 16), h: H };
  }

  function coin(K, X, Z, kind, deg) {
    const it = item(X, Z, deg);
    const r = kind === 10 ? 1.35 : 1.15;
    let s = slab(it, circPts(0, 0, r, null, 22), 0, 0.2, K(kind === 10 ? '#8F949C' : '#9C7A2E'), K(kind === 10 ? '#C9CED6' : '#D3AE55'));
    const ts = surf(it, 0.21);
    if (kind === 10) s += path(sPoly(ts, circPts(0, 0, 0.82, null, 18)), K('#D9B45A'));
    s += path(sPoly(ts, circPts(0, 0, r * 0.88, null, 20)), 'none', `stroke="${K('#FFFFFF')}" stroke-width="1.5" opacity=".4"`);
    s += sText(ts, 0, 0.28, 0.75, K(kind === 10 ? '#9C7A2E' : '#8A6A22'), String(kind), 'font-weight="600" text-anchor="middle"');
    return { s, it, pts: circPts(0, 0, r, null, 12), h: 0.2 };
  }

  // ================= LAYERS =================
  function back(night) {
    const D = Defs('b');
    const K = makeK(night);
    const bg = background(D, K, night);
    let s = bg.s;
    s += counter(D, K, night, bg.yE);
    s += underGlass(D, K, night);
    s += glassSheen(D, night);
    return D.wrap(s);
  }

  function mid(night, name) {
    const D = Defs('m');
    const K = makeK(night);
    D.filter('soft2', '<feGaussianBlur stdDeviation="4"/>');
    const softF = D.filter('soft', '<feGaussianBlur stdDeviation="13"/>', 'x="-20%" y="-20%" width="140%" height="140%"');
    const contF = D.filter('cont', '<feGaussianBlur stdDeviation="3.5"/>', 'x="-10%" y="-10%" width="120%" height="120%"');

    // build props
    const boxA = { it: item(-43.5, 60, 12), w: 11, d: 6.2, h: 3.2 };
    const boxB = { it: item(-42.6, 60.4, -5, GLASS + 3.2), w: 9.4, d: 5, h: 2.6 };
    const boxC = { it: item(-33, 67, 22), w: 5, d: 3, h: 10.5 };
    const boxD = { it: item(45, 67, -9), w: 12, d: 6.4, h: 3 };
    const sCut = strip(K, item(-12.5, 61.5, 9), { cols: 3, empty: [0, 3], seed: 3, band: '#E36F5C', dose: '500', tab: '#FFF6E0' });
    const sCap = strip(K, item(11.5, 62.5, -13), { kind: 'cap', seed: 4, band: '#B48ED6', dose: '20', empty: [9] });
    const fan = [
      [item(-29, 39.5, 98), { seed: 5, band: '#5AA0D8', dose: '650' }],
      [item(-26, 42.5, 72), { seed: 6, band: '#7BC18E', dose: '10', tab: '#FFE1E6' }],
      [item(-23.8, 45.5, 56), { seed: 7, band: '#E7B04A', dose: '40', tab: '#FFF3C4', empty: [1] }]
    ].map(([it, o]) => ({ it, r: strip(K, it, o) }));
    const book = billBook(K, night, name);
    const stack = billStack(K, night);
    const calc = calculator(K, night);
    const ph = phone(K, night);
    const glass = chai(K, night);
    const coins = [coin(K, 10.8, 25.2, 10, 0), coin(K, 13.4, 23.4, 5, 20), coin(K, 9.2, 22.4, 10, 50)];

    // shadows (soft + contact) of everything resting on the glass
    const rr = (o) => rrPts(0, 0, o.w, o.d, 0.12, 1);
    let soft = '', cont = '';
    const add = (it, pts, h) => { soft += footprint(it, pts, h); cont += contact(it, pts); };
    add(boxA.it, rr(boxA), 5.8); add(boxC.it, rr(boxC), 10.5); add(boxD.it, rr(boxD), 3);
    add(sCut.it || item(-12.5, 61.5, 9), sCut.pts, 0.4); add(item(11.5, 62.5, -13), sCap.pts, 0.4);
    for (const f of fan) add(f.it, f.r.pts, 0.4);
    add(book.it, book.pts, 1.2); add(stack.it, stack.pts, stack.h); add(calc.it, calc.pts, calc.h); add(ph.it, ph.pts, ph.h);
    add(glass.it, glass.pts, glass.h);
    for (const c of coins) add(c.it, c.pts, 0.2);
    let s = '';
    s += `<g filter="${softF}" opacity="${night ? 0.5 : 0.38}"><path d="${soft}" fill="#2A1A0E"/></g>`;
    s += `<g filter="${contF}" opacity="${night ? 0.6 : 0.5}"><path d="${cont}" fill="#1E120A"/></g>`;
    // chai glass casts a warm caustic
    const cg = sp(glass.it, 0.6, 3.2, 0);
    s += E(cg[0], cg[1], 60, 18, '#E8A24E', `opacity=".25" filter="url(#${ID}_m_soft2)"`);

    // painter's order: far → near
    s += medBox(K, boxC.it, boxC.w, boxC.d, boxC.h, '#7BC18E', 'ORS', 'Orange flavour · 21 g', true);
    s += medBox(K, boxA.it, boxA.w, boxA.d, boxA.h, '#5AA0D8', 'AMOXYCILLIN 500', 'Capsules IP · 10x10');
    s += `<g filter="${D.filter('bsh', '<feGaussianBlur stdDeviation="5"/>')}" opacity=".35">${path(footprint(boxB.it, rr(boxB), 2.6), '#1E120A')}</g>`;
    s += medBox(K, boxB.it, boxB.w, boxB.d, boxB.h, '#E7B04A', 'CETIRIZINE 10', 'Tablets IP · 10x10');
    s += medBox(K, boxD.it, boxD.w, boxD.d, boxD.h, '#E36F5C', 'PANTOPRAZOLE 40', 'Gastro-resistant · 15x10');
    s += glass.s;
    s += sCut.s + sCap.s;
    s += stack.s;
    s += book.s;
    for (const f of fan) s += f.r.s;
    for (const c of coins) s += c.s;
    s += calc.s;
    s += ph.s;
    return D.wrap(s);
  }

  function front(night) {
    const D = Defs('f');
    let s = '';
    // light falloff toward the frame edges (top light pool), stronger at night
    s += R(0, 0, 2400, 1350, D.rad('vig', 1180, 640, 1450, [[0, '#1A0F08', 0], [0.55, '#1A0F08', night ? 0.12 : 0.04], [1, '#1A0F08', night ? 0.62 : 0.34]], 'gradientTransform="translate(1180 640) scale(1 0.78) translate(-1180 -640)"'));
    if (night) s += E(1150, 640, 900, 520, D.rad('warm', 1150, 640, 900, [[0, '#FFC982', 0.12], [1, '#FFC982', 0]]));
    return D.wrap(s);
  }

  function fore(night) {
    const D = Defs('o');
    const K = makeK(night);
    // an out-of-focus blister strip right under the lens, bottom-right corner
    const it = item(31, 21.5, -28);
    const st = strip(K, it, { seed: 9, band: '#E36F5C', dose: '250', tab: '#FFFFFF' });
    return D.wrap(`<g opacity=".95">${st.s}</g>`);
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: { hands: { x: 1200, zone: 'front' } },
    draw(opts) {
      const night = (opts && opts.time) === 'night';
      const name = (opts && opts.name) || 'Sharma Medical Store';
      return { back: back(night), mid: mid(night, name), front: front(night), fore: fore(night) };
    }
  };
})();
