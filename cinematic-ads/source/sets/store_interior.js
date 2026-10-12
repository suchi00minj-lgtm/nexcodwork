// store_interior — Indian chemist shop, customer-side front view.
// World 2400x1350, floor line y=1250, eye level / vanishing point (1200, 600).
window.SETS = window.SETS || {};
(function () {
  const ID = 'store_interior';
  const P = s => ID + '_' + s;
  const U = s => 'url(#' + P(s) + ')';
  const VPX = 1200, VPY = 600;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const n = v => Math.round(v * 10) / 10;
  function hx(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function toHex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nightify(c) { const [r, g, b] = hx(c); return toHex([r * 0.56 + 4, g * 0.52 + 8, b * 0.52 + 20]); }
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const pick = (rng, a) => a[Math.floor(rng() * a.length) % a.length];

  const BOXC = ['#E7B04A', '#5AA0D8', '#E36F5C', '#7BC18E', '#B48ED6', '#F2D16B', '#FFFFFF', '#1E9E62',
    '#4F86B8', '#D98A4E', '#9FC8E8', '#C25B4C', '#6FAF8A', '#FFFFFF', '#E7B04A', '#5AA0D8'];
  const DARK = '#2B2230';

  // ---------- small props ----------
  function box(K, x, b, w, h, c, st, below) {
    const y = b - h, base = K(c), wh = K('#FBF8F2'), dk = K(mix(c, DARK, 0.3));
    let s = '';
    if (st === 1) {
      s += R(x, y, w, h, wh) + R(x, y, w, h * 0.3, base) + R(x + w * 0.14, y + h * 0.6, w * 0.5, Math.max(3, h * 0.07), base);
    } else if (st === 2) {
      s += R(x, y, w, h, base) + `<circle cx="${n(x + w * 0.45)}" cy="${n(y + h * 0.42)}" r="${n(Math.min(w, h) * 0.24)}" fill="${wh}"/>` + R(x, y + h * 0.78, w, h * 0.1, dk);
    } else if (st === 3) {
      s += R(x, y, w, h, base) + `<path d="M${n(x)} ${n(y + h * 0.72)}Q${n(x + w * 0.5)} ${n(y + h * 0.42)} ${n(x + w)} ${n(y + h * 0.55)}V${n(y + h * 0.7)}Q${n(x + w * 0.5)} ${n(y + h * 0.6)} ${n(x)} ${n(y + h * 0.88)}Z" fill="${wh}" opacity=".85"/>`;
    } else {
      s += R(x, y, w, h, base) + R(x, y + h * 0.36, w, h * 0.28, wh) + R(x + w * 0.14, y + h * 0.44, w * 0.46, Math.max(2.5, h * 0.05), dk);
    }
    s += R(x + w * 0.8, y, w * 0.2, h, DARK, 'opacity=".2"');
    if (below) s += R(x, y, w, 3, '#FFFFFF', 'opacity=".35"');
    return s;
  }
  function bottle(K, x, b, w, h, cap, lab, glass) {
    const y = b - h, nw = w * 0.42, nx = x + (w - nw) / 2;
    const body = K(glass), bdk = K(mix(glass, DARK, 0.3));
    let s = R(nx - 1, y + h * 0.04, nw + 2, h * 0.12, K(cap), 'rx="2"');
    s += R(nx, y + h * 0.15, nw, h * 0.1, bdk);
    s += R(x, y + h * 0.22, w, h * 0.78, body, `rx="${n(w * 0.24)}"`);
    s += R(x + 1.5, y + h * 0.44, w - 3, h * 0.34, K(lab)) + R(x + 1.5, y + h * 0.44, w - 3, h * 0.07, K(cap));
    s += R(x + w * 0.16, y + h * 0.3, w * 0.12, h * 0.6, '#FFFFFF', 'opacity=".28" rx="2"');
    s += R(x + w * 0.76, y + h * 0.24, w * 0.24, h * 0.74, DARK, 'opacity=".18"');
    return s;
  }
  function tub(K, x, b, w, h, c) {
    const y = b - h;
    let s = R(x, y + 8, w, h - 8, K('#F4F1EA'), 'rx="5"') + R(x - 1, y, w + 2, 11, K(c), 'rx="3"');
    s += R(x, y + h * 0.42, w, h * 0.3, K(mix(c, '#FFFFFF', 0.25))) + R(x + w * 0.75, y + 8, w * 0.25, h - 8, DARK, 'opacity=".15"');
    return s;
  }
  function stripStack(K, x, b, w, k, c) {
    let s = '';
    for (let i = 0; i < k; i++) {
      const y = b - (i + 1) * 6;
      s += R(x + (i % 2) * 2, y, w - 2, 5.5, K(i % 2 ? '#D5DBE2' : '#C3CAD3'), 'rx="1.5"');
      s += R(x + (i % 2) * 2, y, 8, 5.5, K(c));
    }
    return s;
  }

  // ---------- back wall shelves ----------
  const UPS = [480, 860, 1240, 1620, 2000];
  const BOARDS = [258, 368, 478, 588, 698, 808, 918];
  const CATS = ['PAIN & FEVER', 'ANTIBIOTICS', 'COUGH & COLD', 'VITAMINS & OTC'];

  function shelfRow(K, rng, x0, x1, rest, maxH) {
    let s = '', x = x0 + 3;
    const below = rest > VPY;
    while (x < x1 - 14) {
      const t = rng(), room = x1 - 3 - x;
      if (t < 0.03) { x += 6 + rng() * 10; continue; }
      if (t < 0.66) { // a facing of identical boxes
        let w = 18 + rng() * 26; const h = maxH * (0.5 + rng() * 0.46);
        const c = pick(rng, BOXC), st = Math.floor(rng() * 4), k = 2 + Math.floor(rng() * 4);
        for (let q = 0; q < k; q++) {
          let ww = w;
          if (x + ww > x1 - 3) { ww = x1 - 3 - x; if (ww < 12) break; }
          s += box(K, x, rest, ww, h, c, st, below); x += ww + 1.2;
        }
        x += 1 + rng() * 3;
      } else if (t < 0.8) {
        const w = 20 + rng() * 10, h = Math.min(maxH, maxH * (0.55 + rng() * 0.4));
        const glass = rng() < 0.65 ? '#A8642F' : (rng() < 0.5 ? '#F4F1EA' : '#7FA8C9');
        const cap = pick(rng, ['#FFFFFF', '#E36F5C', '#5AA0D8', '#1E9E62', '#E7B04A']);
        const lab = rng() < 0.5 ? '#FBF8F2' : '#F2D16B';
        const k = 2 + Math.floor(rng() * 3);
        for (let q = 0; q < k; q++) { if (x + w > x1 - 3) break; s += bottle(K, x, rest, w, h, cap, lab, glass); x += w + 1.5; }
        x += 2;
      } else if (t < 0.9) {
        const w = 34 + rng() * 12, h = Math.min(maxH, 38 + rng() * 22), c = pick(rng, BOXC.slice(0, 6));
        const k = 1 + Math.floor(rng() * 3);
        for (let q = 0; q < k; q++) { if (x + w > x1 - 3) break; s += tub(K, x, rest, w, h, c); x += w + 1.5; }
        x += 2;
      } else {
        let w = 40 + rng() * 22;
        if (w > room) { if (room < 24) break; w = room; }
        s += stripStack(K, x, rest, w, 5 + Math.floor(rng() * 7), pick(rng, BOXC.slice(0, 6)));
        x += w + 2;
      }
    }
    return s;
  }

  function shelves(K) {
    const rng = mulberry32(7741), lr = mulberry32(99);
    let s = R(470, 214, 1540, 946, K('#E2D1B5'));
    // inner side faces of the uprights (perspective depth)
    for (const u of UPS) {
      const f = 0.05, side = u < VPX ? 1 : -1, ux = u + side * 12;
      const bx = ux + (VPX - ux) * f;
      s += `<path d="M${ux} 258L${n(bx)} ${n(258 + (VPY - 258) * f)}L${n(bx)} ${n(918 + (VPY - 918) * f)}L${ux} 918Z" fill="${K('#A87A50')}"/>`;
    }
    for (let j = 0; j < 4; j++) {
      const x0 = UPS[j] + 12, x1 = UPS[j + 1] - 12;
      for (let i = 0; i < 6; i++) {
        const top = i === 0 ? 258 : BOARDS[i] + 12, bot = BOARDS[i + 1];
        const t = bot > VPY ? Math.min(10, (bot - VPY) * 0.034) : 0;
        const rest = bot - t * 0.6;
        s += shelfRow(K, rng, x0, x1, rest, rest - top - 10);
        s += R(x0, top, x1 - x0, 26, U('ao'));
      }
    }
    // boards
    for (let i = 1; i < 7; i++) {
      const y = BOARDS[i];
      if (y > VPY) { const t = Math.min(10, (y - VPY) * 0.034); s += R(470, y - t, 1540, t, K('#CFA474')); }
      s += R(470, y, 1540, 12, K('#B9875A')) + R(470, y + 9, 1540, 3, K('#9A6B43')) + R(470, y, 1540, 2, K('#D3A77A'));
      if (y < VPY) { const t = Math.max(1, (VPY - y) * 0.034); s += R(470, y + 12, 1540, t, K('#7A5233')); }
      for (let j = 0; j < 4; j++) {
        const x0 = UPS[j] + 16, x1 = UPS[j + 1] - 16;
        const k = 2;
        for (let q = 0; q < k; q++) {
          const lx = x0 + 8 + (q + lr() * 0.6) * (x1 - x0 - 50) / k;
          s += R(lx, y + 2, 32, 8, K('#FBF8F0'), 'rx="1"') + `<text x="${n(lx + 16)}" y="${n(y + 8.6)}" font-size="7" font-weight="600" text-anchor="middle" fill="${K('#1F2A44')}">${'ABCD'[j]}-${i}${q + 1}</text>`;
        }
      }
    }
    // drawer cabinet
    for (let j = 0; j < 4; j++) {
      const x0 = UPS[j] + 11, x1 = UPS[j + 1] - 11, dw = (x1 - x0) / 3;
      for (let r = 0; r < 2; r++) {
        const dy = 930 + r * 108;
        for (let c = 0; c < 3; c++) {
          const dx = x0 + c * dw;
          s += R(dx + 3, dy + 3, dw - 6, 102, K('#C29263'), 'rx="3"') + R(dx + 3, dy + 99, dw - 6, 6, K('#9A6B43'));
          s += R(dx + dw / 2 - 18, dy + 20, 36, 7, K('#8E98A6'), 'rx="3"') + R(dx + dw / 2 - 18, dy + 20, 36, 3, K('#C9D0DA'), 'rx="1.5"');
          s += R(dx + dw / 2 - 20, dy + 40, 40, 16, K('#F6F1E6'), 'rx="2"') + R(dx + dw / 2 - 14, dy + 46, 28, 3, K('#AEB6C2'));
        }
      }
    }
    s += R(470, 1146, 1540, 14, K('#5E3F27'));
    // crown with category labels
    s += R(466, 214, 1548, 44, K('#9A6B43')) + R(466, 214, 1548, 6, K('#B9875A')) + R(466, 252, 1548, 6, K('#7A5233'));
    for (let j = 0; j < 4; j++) {
      const cx = (UPS[j] + UPS[j + 1]) / 2;
      s += `<text x="${cx}" y="243" font-size="16" font-weight="600" letter-spacing="3" text-anchor="middle" fill="${K('#F7E9D2')}">${CATS[j].replace('&', '&amp;')}</text>`;
    }
    // uprights
    for (const u of UPS) {
      const w = (u === 480 || u === 2000) ? 28 : 22;
      s += R(u - w / 2, 214, w, 946, K('#9A6B43')) + R(u - w / 2, 214, 5, 946, K('#B9875A')) + R(u + w / 2 - 5, 214, 5, 946, K('#7A5233'));
    }
    return s;
  }

  // ---------- wall decor ----------
  function clock(K, cx, cy, r) {
    let s = `<circle cx="${cx + 5}" cy="${cy + 7}" r="${r}" fill="#2a1c14" opacity=".14"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${K('#1F2A44')}"/><circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="${K('#FBF7EE')}"/>`;
    let d = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, l0 = r - (i % 3 ? 15 : 20), l1 = r - 11;
      d += `M${n(cx + Math.sin(a) * l0)} ${n(cy - Math.cos(a) * l0)}L${n(cx + Math.sin(a) * l1)} ${n(cy - Math.cos(a) * l1)}`;
    }
    s += `<path d="${d}" stroke="${K('#1F2A44')}" stroke-width="3.5" stroke-linecap="round"/>`;
    const hand = (deg, len, wd, col) => { const a = deg * Math.PI / 180; return `<path d="M${cx} ${cy}L${n(cx + Math.sin(a) * len)} ${n(cy - Math.cos(a) * len)}" stroke="${col}" stroke-width="${wd}" stroke-linecap="round"/>`; };
    s += hand(304, r * 0.48, 6, K('#1F2A44')) + hand(48, r * 0.7, 4, K('#1F2A44')) + hand(200, r * 0.74, 2, K('#C8161E'));
    s += `<circle cx="${cx}" cy="${cy}" r="5" fill="${K('#C8161E')}"/>`;
    s += `<path d="M${cx - r * 0.62} ${cy - r * 0.3}A${r * 0.7} ${r * 0.7} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.66}" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`;
    return s;
  }

  function deity(K, x, y, w, h, night) {
    const cx = x + w / 2;
    let s = R(x + 6, y + 8, w, h, '#2a1c14', 'opacity=".14" rx="4"');
    s += R(x, y, w, h, K('#C79A3F'), 'rx="4"') + R(x + 3, y + 3, w - 6, 4, K('#E8C46A'));
    s += R(x + 9, y + 9, w - 18, h - 18, K('#7C2D2A'));
    s += `<circle cx="${cx}" cy="${y + h * 0.44}" r="${w * 0.3}" fill="${K('#E7B04A')}" opacity=".9"/><circle cx="${cx}" cy="${y + h * 0.44}" r="${w * 0.2}" fill="${K('#F6DC8C')}"/>`;
    const py = y + h * 0.6, pk = K(mix('#E36F5C', '#FFFFFF', 0.45)), pk2 = K(mix('#E36F5C', '#FFFFFF', 0.2));
    s += `<path d="M${cx} ${py}C${cx - 26} ${py - 12} ${cx - 30} ${py - 30} ${cx - 22} ${py - 34}C${cx - 12} ${py - 26} ${cx - 4} ${py - 14} ${cx} ${py}Z" fill="${pk2}"/>`;
    s += `<path d="M${cx} ${py}C${cx + 26} ${py - 12} ${cx + 30} ${py - 30} ${cx + 22} ${py - 34}C${cx + 12} ${py - 26} ${cx + 4} ${py - 14} ${cx} ${py}Z" fill="${pk2}"/>`;
    s += `<path d="M${cx} ${py}C${cx - 14} ${py - 18} ${cx - 10} ${py - 40} ${cx} ${py - 50}C${cx + 10} ${py - 40} ${cx + 14} ${py - 18} ${cx} ${py}Z" fill="${pk}"/>`;
    s += `<path d="M${cx - 30} ${py + 6}Q${cx} ${py - 6} ${cx + 30} ${py + 6}Q${cx} ${py + 14} ${cx - 30} ${py + 6}Z" fill="${K('#6FAF8A')}"/>`;
    // marigold garland
    let g = '';
    const N = 15;
    for (let i = 0; i <= N; i++) {
      const t = i / N, gx = x + 6 + t * (w - 12), gy = y + 12 + Math.sin(Math.PI * t) * (h * 0.7);
      g += `<circle cx="${n(gx)}" cy="${n(gy)}" r="6.5" fill="${K(i % 3 === 1 ? '#F2D16B' : (i % 3 ? '#E7B04A' : '#E58A3C'))}"/>`;
    }
    g += `<path d="M${cx} ${y + 12 + h * 0.7}v12" stroke="${K('#6FAF8A')}" stroke-width="3"/><circle cx="${cx}" cy="${y + h * 0.7 + 28}" r="6" fill="${K('#E58A3C')}"/>`;
    s += g;
    return s;
  }

  function diya(K, x, y, night) {
    let s = '';
    if (night) s += `<circle cx="${x}" cy="${y - 20}" r="60" fill="${U('flame')}"/>`;
    else s += `<circle cx="${x}" cy="${y - 20}" r="30" fill="${U('flame')}" opacity=".6"/>`;
    s += `<path d="M${x - 16} ${y - 9}Q${x} ${y + 6} ${x + 16} ${y - 9}Z" fill="${K('#C79A3F')}"/><path d="M${x - 16} ${y - 9}H${x + 16}" stroke="${K('#E8C46A')}" stroke-width="3"/>`;
    s += `<path d="M${x} ${y - 34}C${x - 7} ${y - 22} ${x - 6} ${y - 12} ${x} ${y - 11}C${x + 6} ${y - 12} ${x + 7} ${y - 22} ${x} ${y - 34}Z" fill="#FFB547"/><path d="M${x} ${y - 25}C${x - 3} ${y - 18} ${x - 3} ${y - 13} ${x} ${y - 12}C${x + 3} ${y - 13} ${x + 3} ${y - 18} ${x} ${y - 25}Z" fill="#FFF1C2"/>`;
    return s;
  }

  function calendar(K, x, y, w, h) {
    let s = `<path d="M${x + 14} ${y + 4}L${x + w / 2} ${y - 18}L${x + w - 14} ${y + 4}" stroke="${K('#6B7686')}" stroke-width="2" fill="none"/><circle cx="${x + w / 2}" cy="${y - 18}" r="4" fill="${K('#6B7686')}"/>`;
    s += R(x + 6, y + 8, w, h, '#2a1c14', 'opacity=".12"') + R(x, y, w, h, K('#FDFBF6'));
    const ph = h * 0.4;
    s += R(x + 8, y + 12, w - 16, ph, K('#F7DDB0'));
    s += `<circle cx="${x + w * 0.66}" cy="${y + 12 + ph * 0.45}" r="${w * 0.1}" fill="${K('#F2B35B')}"/>`;
    s += `<path d="M${x + 8} ${y + 12 + ph * 0.7}Q${x + w * 0.3} ${y + 12 + ph * 0.38} ${x + w * 0.55} ${y + 12 + ph * 0.66}T${x + w - 8} ${y + 12 + ph * 0.55}V${y + 12 + ph}H${x + 8}Z" fill="${K('#8DBF8A')}"/>`;
    s += `<path d="M${x + 8} ${y + 12 + ph * 0.86}Q${x + w * 0.45} ${y + 12 + ph * 0.62} ${x + w - 8} ${y + 12 + ph * 0.8}V${y + 12 + ph}H${x + 8}Z" fill="${K('#5E8F6E')}"/>`;
    for (let i = 0; i < 9; i++) s += `<circle cx="${n(x + 12 + i * (w - 24) / 8)}" cy="${y + 5}" r="2.6" fill="${K('#1F2A44')}"/>`;
    const hy = y + 12 + ph + 24;
    s += `<text x="${x + w / 2}" y="${hy}" font-size="15" font-weight="600" text-anchor="middle" fill="${K('#C8161E')}" letter-spacing="1">OCTOBER 2026</text>`;
    const days = 'SMTWTFS', cw = (w - 20) / 7;
    let t = '';
    for (let i = 0; i < 7; i++) t += `<text x="${n(x + 10 + cw * (i + 0.5))}" y="${hy + 17}" fill="${K(i === 0 ? '#C8161E' : '#6B7686')}">${days[i]}</text>`;
    for (let d = 1; d <= 31; d++) {
      const p = d + 3, col = p % 7, row = Math.floor(p / 7);
      t += `<text x="${n(x + 10 + cw * (col + 0.5))}" y="${n(hy + 33 + row * 15.5)}" fill="${K(col === 0 ? '#C8161E' : '#1F2A44')}">${d}</text>`;
    }
    s += `<g font-size="10.5" font-weight="500" text-anchor="middle">${t}</g>`;
    s += R(x, y + h - 18, w, 18, K('#1E9E62')) + `<text x="${x + w / 2}" y="${y + h - 5}" font-size="10" font-weight="500" text-anchor="middle" fill="${K('#FFFFFF')}" letter-spacing="1">Health is Wealth</text>`;
    return s;
  }

  function notice(K, x, y, w, h) {
    let s = R(x + 5, y + 7, w, h, '#2a1c14', 'opacity=".12"') + R(x, y, w, h, K('#C8161E'), 'rx="3"') + R(x + 5, y + 5, w - 10, h - 10, K('#FFFDF8'));
    s += R(x + 5, y + 5, w - 10, 24, K('#C8161E'));
    s += `<text x="${x + w / 2}" y="${y + 22}" font-size="13" font-weight="600" text-anchor="middle" fill="${K('#FFFFFF')}" letter-spacing="2">NOTICE</text>`;
    const L = ['Schedule H & H1 drugs', 'sold only against a valid', "doctor's prescription."];
    L.forEach((l, i) => { s += `<text x="${x + w / 2}" y="${y + 50 + i * 16}" font-size="11" font-weight="500" text-anchor="middle" fill="${K('#1F2A44')}">${esc(l)}</text>`; });
    s += `<text x="${x + w / 2}" y="${y + h - 16}" font-size="12" font-weight="600" text-anchor="middle" fill="${K('#C8161E')}">बिना पर्चे के दवा नहीं</text>`;
    return s;
  }

  function cctv(K, x, y, night) {
    let s = R(x - 4, y - 6, 30, 12, K('#DCE1E8'), 'rx="3"') + R(x + 6, y, 8, 26, K('#C9D0DA'));
    s += `<g transform="rotate(28 ${x + 10} ${y + 26})">` + R(x - 6, y + 18, 74, 30, K('#F4F6F9'), 'rx="10"') + R(x - 6, y + 38, 74, 10, K('#C9D0DA'), 'rx="5"') + R(x + 56, y + 14, 18, 38, K('#E3E7EC'), 'rx="5"');
    s += `<circle cx="${x + 70}" cy="${y + 33}" r="9" fill="${K('#1F2A44')}"/><circle cx="${x + 72}" cy="${y + 31}" r="3" fill="#6FA8DC" opacity=".8"/></g>`;
    s += `<circle cx="${x + 18}" cy="${y + 40}" r="2.6" fill="#FF4D4D"${night ? '' : ' opacity=".8"'}/>`;
    return s;
  }

  function switchboard(K, x, y) {
    let s = R(x + 3, y + 4, 44, 74, '#2a1c14', 'opacity=".1" rx="4"') + R(x, y, 44, 74, K('#F8F6F1'), 'rx="4"');
    for (let i = 0; i < 3; i++) s += R(x + 9, y + 10 + i * 20, 26, 14, K('#E3E6EA'), 'rx="2"') + R(x + 9, y + 10 + i * 20, 26, 6, K('#FFFFFF'), 'rx="2"') + `<circle cx="${x + 30}" cy="${y + 17 + i * 20}" r="1.8" fill="${K('#E36F5C')}"/>`;
    return s;
  }

  // ---------- door with outside view ----------
  function door(K, night) {
    const gx = 88, gy = 308, gw = 324, gh = 838;
    let o = '';
    if (!night) {
      o += R(gx, gy, gw, gh, U('sky'));
      o += R(60, 430, 170, 400, '#EDD3B6') + R(232, 520, 104, 310, '#C9DAD2') + R(338, 380, 110, 450, '#EFE2C9');
      let w = '';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) w += `M${86 + c * 46} ${456 + r * 60}h26v34h-26z`;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) w += `M${248 + c * 44} ${548 + r * 64}h24v36h-24z`;
      for (let r = 0; r < 7; r++) w += `M${356} ${404 + r * 58}h30v32h-30z`;
      o += `<path d="${w}" fill="#B9C9D3" opacity=".8"/>`;
      o += R(60, 560, 170, 10, '#D9B894') + R(338, 600, 110, 10, '#D8C8AA');
      o += `<path d="M150 360V840" stroke="#8C8C86" stroke-width="7"/><path d="M118 392H184" stroke="#8C8C86" stroke-width="5"/><path d="M60 410Q250 450 470 418M60 432Q250 476 470 440" stroke="#6E6E6A" stroke-width="2" fill="none"/>`;
      o += `<circle cx="378" cy="640" r="70" fill="#8DBF8A"/><circle cx="330" cy="690" r="56" fill="#7BAF84"/><circle cx="410" cy="700" r="50" fill="#6FA56F"/><path d="M372 700V840" stroke="#7A5A3E" stroke-width="12"/>`;
      o += R(gx, 826, gw, 110, '#B5B2AA') + R(gx, 826, gw, 8, '#CFCBC1') + `<path d="M${gx} 880H${gx + gw}" stroke="#E8E4D8" stroke-width="4" stroke-dasharray="40 30"/>`;
      o += R(gx, 936, gw, 220, '#D8D0BF') + `<path d="M${gx} 990H${gx + gw}M${gx} 1060H${gx + gw}M160 936L120 1150M280 936L300 1150" stroke="#C6BCA8" stroke-width="3"/>`;
      o += R(gx, gy, gw, gh, '#FFFFFF', 'opacity=".22"');
    } else {
      o += R(gx, gy, gw, gh, U('sky'));
      o += R(60, 430, 170, 400, '#141C2E') + R(232, 520, 104, 310, '#1A2337') + R(338, 380, 110, 450, '#111829');
      const lit = [[0, 1], [1, 2], [2, 0], [3, 1], [4, 2], [5, 0]];
      let w = '', wl = '';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { const on = lit.some(p => p[0] === r && p[1] === c); (on ? wl += `M${86 + c * 46} ${456 + r * 60}h26v34h-26z` : w += `M${86 + c * 46} ${456 + r * 60}h26v34h-26z`); }
      for (let r = 0; r < 7; r++) { const s2 = `M356 ${404 + r * 58}h30v32h-30z`; if (r % 3 === 1) wl += s2; else w += s2; }
      o += `<path d="${w}" fill="#202a40"/><path d="${wl}" fill="#F2C46B" opacity=".85"/>`;
      o += `<path d="M150 360V840" stroke="#0B101C" stroke-width="7"/><path d="M60 410Q250 450 470 418M60 432Q250 476 470 440" stroke="#0B101C" stroke-width="2" fill="none"/>`;
      o += `<path d="M292 470V840" stroke="#0E1422" stroke-width="8"/><path d="M292 474Q292 452 262 452" stroke="#0E1422" stroke-width="6" fill="none"/>`;
      o += `<circle cx="258" cy="462" r="96" fill="${U('lamp')}" opacity=".85"/><circle cx="258" cy="462" r="9" fill="#FFE2A8"/>`;
      o += R(gx, 826, gw, 110, '#1A2030') + `<ellipse cx="258" cy="884" rx="130" ry="30" fill="${U('lamp')}" opacity=".45"/>`;
      o += `<circle cx="130" cy="872" r="6" fill="#FF6B5B" opacity=".9"/><circle cx="150" cy="872" r="6" fill="#FF6B5B" opacity=".9"/><circle cx="380" cy="890" r="9" fill="#FFF3D6" opacity=".7"/>`;
      o += R(gx, 936, gw, 220, '#242B3B') + `<path d="M${gx} 990H${gx + gw}M${gx} 1060H${gx + gw}" stroke="#2E3648" stroke-width="3"/>`;
    }
    let s = R(56, 278, 388, 884, K('#C9BFAE'));
    s += `<g clip-path="url(#${P('dclip')})">${o}`;
    s += `<path d="M${gx + 40} ${gy}h70L${gx} ${gy + 360}v-140ZM${gx + 170} ${gy}h28L${gx} ${gy + 640}v-92Z" fill="#FFFFFF" opacity="${night ? 0.07 : 0.2}"/>`;
    s += R(gx, gy, gw, gh, '#CFE6EC', `opacity="${night ? 0.06 : 0.12}"`) + '</g>';
    const fr = K('#AEB6C2'), frd = K('#8E98A6'), frl = K('#DCE1E8');
    s += `<path d="M66 286H434V1158H66ZM${gx} ${gy}V${gy + gh}H${gx + gw}V${gy}Z" fill="${fr}" fill-rule="evenodd"/>`;
    s += R(66, 286, 368, 5, frl) + R(429, 286, 5, 872, frd) + R(66, 286, 5, 872, frl);
    s += R(gx, 760, gw, 18, fr) + R(gx, 760, gw, 4, frl) + R(gx, 1074, gw, 72, fr) + R(gx, 1074, gw, 4, frl) + R(gx, 1140, gw, 6, frd);
    s += R(384, 590, 12, 270, K('#E8ECF0'), 'rx="6"') + R(390, 590, 6, 270, K('#AEB6C2'), 'rx="3"') + R(374, 604, 14, 8, frd) + R(374, 838, 14, 8, frd);
    s += R(222, 688, 70, 26, K('#FFFFFF'), 'rx="4" opacity=".9"') + `<text x="257" y="707" font-size="14" font-weight="600" text-anchor="middle" fill="${K('#1F2A44')}" letter-spacing="2">PULL</text>`;
    s += R(56, 1150, 388, 12, K('#7D8794'));
    return s;
  }

  // ---------- name board ----------
  function nameBoard(K, name, night) {
    const x = 690, y = 62, w = 1020, h = 136;
    let s = '';
    if (night) s += R(x - 30, y - 24, w + 60, h + 48, '#FF5A3C', `opacity=".35" rx="40" filter="url(#${P('blur')})"`);
    s += R(x + 6, y + 9, w, h, '#2a1c14', 'opacity=".16" rx="10"');
    s += R(x, y, w, h, K('#7A5233'), 'rx="10"');
    s += R(x + 8, y + 8, w - 16, h - 16, U('sign'), 'rx="5"');
    s += R(x + 8, y + 8, w - 16, (h - 16) * 0.45, '#FFFFFF', 'opacity=".07" rx="5"');
    const ex = x + 84, ey = y + h / 2;
    s += `<circle cx="${ex}" cy="${ey}" r="46" fill="#FFFFFF"/>` + R(ex - 12, ey - 32, 24, 64, '#1E9E62', 'rx="3"') + R(ex - 32, ey - 12, 64, 24, '#1E9E62', 'rx="3"');
    const plain = name.replace(/&amp;/g, '&').replace(/&lt;|&gt;|&quot;/g, 'x');
    const len = Math.max(6, plain.length), avail = 820;
    const fs = Math.min(66, avail / (len * 0.6));
    const tl = len * 0.6 * fs > avail ? ` textLength="${avail}" lengthAdjust="spacingAndGlyphs"` : '';
    const tx = x + 150 + avail / 2;
    s += `<text x="${tx + 3}" y="${ey + fs * 0.12 + 3}" font-size="${n(fs)}" font-weight="600" text-anchor="middle" fill="#7E0D12" opacity=".55"${tl}>${name}</text>`;
    s += `<text x="${tx}" y="${ey + fs * 0.12}" font-size="${n(fs)}" font-weight="600" text-anchor="middle" fill="#FFFFFF"${tl}>${name}</text>`;
    s += `<text x="${tx}" y="${ey + 50}" font-size="17" font-weight="500" text-anchor="middle" fill="#FFE1D2" letter-spacing="7">CHEMISTS &amp; DRUGGISTS</text>`;
    for (const [sx, sy] of [[x + 16, y + 16], [x + w - 16, y + 16], [x + 16, y + h - 16], [x + w - 16, y + h - 16]]) s += `<circle cx="${sx}" cy="${sy}" r="4" fill="${K('#E8C46A')}"/>`;
    return s;
  }

  function tube(K, x, y, len, night) {
    let s = '';
    s += `<ellipse cx="${x + len / 2}" cy="${y + 150}" rx="${len * 1.2}" ry="340" fill="${U('wash')}"/>`;
    s += R(x + 4, y + 20, len, 10, '#2a1c14', `opacity=".12" rx="5" filter="url(#${P('soft')})"`);
    s += `<ellipse cx="${x + len / 2}" cy="${y + 10}" rx="${len * 0.72}" ry="54" fill="${U('tglow')}"/>`;
    s += R(x, y, len, 22, K('#DCE1E8'), 'rx="7"') + R(x, y + 15, len, 7, K('#AEB6C2'), 'rx="3"');
    s += R(x - 8, y - 3, 16, 28, K('#B9C1CC'), 'rx="4"') + R(x + len - 8, y - 3, 16, 28, K('#B9C1CC'), 'rx="4"');
    s += R(x + 10, y + 5, len - 20, 10, night ? '#FFF1D6' : '#FFFFFF', 'rx="5"');
    s += R(x + 10, y + 5, len - 20, 10, night ? '#FFE2B0' : '#FFFDF6', `rx="5" opacity=".8" filter="url(#${P('soft')})"`);
    return s;
  }

  // ---------- pharma fridge (mid) ----------
  function fridge(K, night, rng) {
    const x = 2200, y = 540, w = 182, h = 620;
    let s = `<ellipse cx="${x + w / 2}" cy="${y + h + 4}" rx="${w * 0.62}" ry="14" fill="#2a1c14" opacity=".22"/>`;
    s += R(x, y, w, h, K('#EEF1F4'), 'rx="10"') + R(x + w - 18, y, 18, h, K('#C9D0DA'), 'rx="8"') + R(x, y, w, 6, K('#FFFFFF'), 'rx="3"');
    s += R(x + 12, y + 14, w - 36, 48, K('#1F2A44'), 'rx="5"');
    s += `<text x="${x + 24}" y="${y + 46}" font-size="18" font-weight="600" fill="#5BE3A0">4.2°C</text><text x="${x + w - 30}" y="${y + 34}" font-size="9" font-weight="500" text-anchor="end" fill="${K('#DCE1E8')}">MEDICINE</text><text x="${x + w - 30}" y="${y + 48}" font-size="9" font-weight="500" text-anchor="end" fill="${K('#DCE1E8')}">COOLER</text>`;
    const gx = x + 14, gy = y + 76, gw = w - 40, gh = h - 150;
    const inside = night ? '#DDEBF2' : K('#D6E2EA');
    s += R(x + 8, gy - 6, w - 24, gh + 12, K('#AEB6C2'), 'rx="6"');
    s += R(gx, gy, gw, gh, inside);
    for (let k = 0; k < 4; k++) {
      const sy = gy + 22 + (k + 1) * (gh - 30) / 4;
      let xx = gx + 6;
      while (xx < gx + gw - 22) {
        const bw = 16 + rng() * 14, bh = 30 + rng() * 34, c = pick(rng, ['#FFFFFF', '#5AA0D8', '#FFFFFF', '#9FC8E8', '#7BC18E', '#E36F5C']);
        if (xx + bw > gx + gw - 4) break;
        s += R(xx, sy - bh, bw, bh, K(c)) + R(xx, sy - bh * 0.6, bw, bh * 0.22, K('#FBF8F2')) + R(xx + bw * 0.75, sy - bh, bw * 0.25, bh, DARK, 'opacity=".15"');
        xx += bw + 2;
      }
      s += R(gx, sy, gw, 4, K('#AEB6C2'));
    }
    if (night) s += R(gx, gy, gw, gh, U('fglow'));
    s += `<path d="M${gx + 20} ${gy}h40L${gx} ${gy + 180}v-60ZM${gx + 90} ${gy}h16L${gx} ${gy + 330}v-30Z" fill="#FFFFFF" opacity=".25"/>`;
    s += R(x + w - 34, gy + 40, 9, 180, K('#AEB6C2'), 'rx="4"');
    let v = '';
    for (let i = 0; i < 6; i++) v += `M${x + 24} ${y + h - 48 + i * 6}H${x + w - 40}`;
    s += `<path d="${v}" stroke="${K('#AEB6C2')}" stroke-width="2.5"/>`;
    s += R(x + 22, gy + gh + 12, 70, 14, K('#1E9E62'), 'rx="3"') + `<text x="${x + 57}" y="${gy + gh + 23}" font-size="9" font-weight="600" text-anchor="middle" fill="${K('#FFFFFF')}">2°C – 8°C</text>`;
    if (night) s += `<ellipse cx="${x + w / 2}" cy="${y + h + 30}" rx="220" ry="60" fill="${U('coolfl')}"/>`;
    return s;
  }

  // ---------- counter (front layer) ----------
  const MULL = [690, 1010, 1330, 1650, 1970];
  function displayBay(K, rng, x0, x1, night) {
    let s = '';
    const top = 926, bot = 1166, shelfY = 1048;
    s += R(x0, top, x1 - x0, bot - top, night ? mix(K('#E8DCC8'), '#FFE6BC', 0.35) : K('#EADFCC'));
    s += R(x0, top, x1 - x0, 70, U('ledglow'));
    // upper level: blister strips fanned, plus small boxes
    let x = x0 + 8;
    while (x < x1 - 30) {
      if (rng() < 0.62) {
        const k = 3 + Math.floor(rng() * 4), c = pick(rng, BOXC.slice(0, 8)), pill = pick(rng, ['#FFFFFF', '#F7D6D0', '#F6E7A8', '#D6E9F7']);
        const sw = 26, shh = 54 + rng() * 12;
        for (let q = 0; q < k; q++) {
          if (x + sw > x1 - 6) break;
          const ang = (q - k / 2) * 3;
          let st = R(x, shelfY - shh, sw, shh, K(q % 2 ? '#D5DBE2' : '#C8CFD8'), 'rx="2"') + R(x, shelfY - shh, sw, 11, K(c), 'rx="2"');
          let pd = '';
          for (let r = 0; r < 4; r++) for (let cc = 0; cc < 2; cc++) pd += `M${n(x + 8 + cc * 10 - 3.4)} ${n(shelfY - shh + 20 + r * 9)}a3.4 3 0 1 0 6.8 0a3.4 3 0 1 0 -6.8 0`;
          st += `<path d="${pd}" fill="${K(pill)}"/>`;
          s += `<g transform="rotate(${n(ang)} ${n(x + sw / 2)} ${shelfY})">${st}</g>`;
          x += sw * 0.62;
        }
        x += 18;
      } else {
        const w = 26 + rng() * 22, h = 30 + rng() * 36, c = pick(rng, BOXC);
        const k = 1 + Math.floor(rng() * 3);
        for (let q = 0; q < k; q++) { if (x + w > x1 - 6) break; s += box(K, x, shelfY, w, h, c, Math.floor(rng() * 4), true); x += w + 2; }
        x += 6;
      }
    }
    s += R(x0, shelfY, x1 - x0, 5, K('#CFE3E8'), 'opacity=".9"') + R(x0, shelfY + 5, x1 - x0, 6, '#2a1c14', 'opacity=".08"');
    // lower level: bigger items
    x = x0 + 10;
    while (x < x1 - 40) {
      const t = rng();
      if (t < 0.28) { // device box (BP monitor / glucometer)
        const w = 78 + rng() * 22, h = 62 + rng() * 22;
        if (x + w > x1 - 6) break;
        s += R(x, bot - h, w, h, K('#FBF8F2')) + R(x, bot - h, w, h * 0.22, K(pick(rng, ['#5AA0D8', '#1F2A44', '#1E9E62', '#E36F5C'])));
        s += R(x + w * 0.18, bot - h * 0.66, w * 0.36, h * 0.38, K('#AEB6C2'), 'rx="4"') + R(x + w * 0.22, bot - h * 0.6, w * 0.28, h * 0.16, K('#DCE1E8'));
        s += `<circle cx="${n(x + w * 0.72)}" cy="${n(bot - h * 0.42)}" r="${n(h * 0.13)}" fill="${K('#6B7686')}"/>` + R(x + w * 0.8, bot - h, w * 0.2, h, DARK, 'opacity=".12"');
        x += w + 8;
      } else if (t < 0.55) { // sanitizer / lotion bottles
        const k = 2 + Math.floor(rng() * 3), c = pick(rng, ['#9FC8E8', '#7BC18E', '#B48ED6', '#FFFFFF']);
        for (let q = 0; q < k; q++) {
          const w = 24, h = 70 + rng() * 10;
          if (x + w > x1 - 6) break;
          s += R(x + 9, bot - h - 14, 6, 14, K('#FFFFFF')) + R(x + 6, bot - h - 18, 18, 5, K('#FFFFFF'), 'rx="2"');
          s += R(x, bot - h, w, h, K(c), 'rx="8"') + R(x + 2, bot - h * 0.65, w - 4, h * 0.35, K('#FBF8F2')) + R(x + 4, bot - h + 8, 4, h - 20, '#FFFFFF', 'opacity=".35" rx="2"');
          x += w + 4;
        }
        x += 8;
      } else {
        const w = 30 + rng() * 26, h = 40 + rng() * 40, c = pick(rng, BOXC);
        const k = 1 + Math.floor(rng() * 3);
        for (let q = 0; q < k; q++) { if (x + w > x1 - 6) break; s += box(K, x, bot, w, h, c, Math.floor(rng() * 4), true); x += w + 2; }
        x += 8;
      }
    }
    // glass
    s += R(x0, top, x1 - x0, bot - top, '#BFD9E0', `opacity="${night ? 0.1 : 0.16}"`);
    const a = 50 + rng() * 80;
    s += `<path d="M${n(x0 + a)} ${top}h70L${n(x0 + a - 10)} ${bot}h-70ZM${n(x0 + a + 110)} ${top}h22L${n(x0 + a + 52)} ${bot}h-22Z" fill="#FFFFFF" opacity="${night ? 0.12 : 0.22}"/>`;
    s += R(x0, top, x1 - x0, 4, '#FFF8E6');
    return s;
  }

  function counter(K, night) {
    const rng = mulberry32(31337);
    let s = '';
    if (night) s += `<ellipse cx="1330" cy="1290" rx="820" ry="90" fill="${U('warmfl')}"/>`;
    s += R(650, 1252, 1360, 60, U('cshadow'));
    s += `<ellipse cx="1330" cy="1264" rx="700" ry="12" fill="#2a1c14" opacity=".22"/>`;
    // carcass
    s += R(690, 900, 1280, 362, K('#9A6B43'));
    for (let j = 0; j < 4; j++) s += displayBay(K, rng, MULL[j] + 12, MULL[j + 1] - 12, night);
    for (const m of MULL) {
      const w = (m === 690 || m === 1970) ? 26 : 22;
      s += R(m - w / 2, 914, w, 256, K('#9A6B43')) + R(m - w / 2, 914, 4, 256, K('#B9875A')) + R(m + w / 2 - 4, 914, 4, 256, K('#7A5233'));
    }
    s += R(690, 900, 1280, 26, K('#9A6B43')) + R(690, 900, 1280, 7, K('#5E3F27'));
    s += R(690, 1166, 1280, 18, K('#9A6B43')) + R(690, 1166, 1280, 3, K('#B9875A'));
    // plinth
    s += R(690, 1184, 1280, 78, K('#7A5233')) + R(690, 1184, 1280, 7, K('#5E3F27')) + R(696, 1196, 1268, 4, '#1E9E62', `opacity="${night ? 0.9 : 0.85}"`);
    s += R(690, 1250, 1280, 12, K('#5E3F27'));
    // top slab with perspective
    s += `<path d="M688 885L1972 885L1962 858L698 858Z" fill="${K('#EFE7D9')}"/>`;
    s += `<path d="M698 858L1962 858L1964 863L696 863Z" fill="${K('#E0D5C2')}"/>`;
    s += `<path d="M900 884L960 884L990 859L940 859ZM1000 884L1016 884L1044 859L1030 859Z" fill="#FFFFFF" opacity="${night ? 0.1 : 0.35}"/>`;
    s += R(686, 884, 1288, 18, K('#B9875A'), 'rx="3"') + R(686, 884, 1288, 3, K('#D7AC7E')) + R(686, 898, 1288, 4, K('#8A5D3A'));
    return s;
  }

  function printer(K) {
    const x = 742, y = 812;
    let s = `<ellipse cx="${x + 42}" cy="880" rx="52" ry="5" fill="#2a1c14" opacity=".25"/>`;
    s += `<path d="M${x + 20} ${y + 4}C${x + 14} ${y - 34} ${x + 30} ${y - 48} ${x + 52} ${y - 46}L${x + 66} ${y - 46}C${x + 50} ${y - 36} ${x + 58} ${y - 14} ${x + 62} ${y + 4}Z" fill="${K('#FFFFFF')}"/>`;
    s += `<path d="M${x + 26} ${y - 14}h28M${x + 25} ${y - 22}h22M${x + 26} ${y - 30}h26M${x + 30} ${y - 6}h20" stroke="${K('#AEB6C2')}" stroke-width="2"/>`;
    s += R(x, y, 84, 68, K('#3A4150'), 'rx="10"') + R(x, y, 84, 22, K('#4C5568'), 'rx="10"') + R(x + 4, y + 2, 76, 4, K('#6B7686'), 'rx="2"');
    s += R(x + 16, y + 6, 52, 4, K('#1F2532'), 'rx="2"') + R(x + 64, y + 54, 14, 10, DARK, 'opacity=".3"');
    s += `<circle cx="${x + 70}" cy="${y + 36}" r="3" fill="#7BE0A0"/>` + R(x + 10, y + 34, 26, 6, K('#2B313E'), 'rx="3"');
    return s;
  }

  function qrStand(K) {
    const x = 1090, y = 798, rng = mulberry32(4242);
    let s = `<ellipse cx="${x + 26}" cy="881" rx="34" ry="4" fill="#2a1c14" opacity=".22"/>`;
    s += R(x - 4, 868, 60, 12, K('#DCE1E8'), 'rx="3"') + R(x - 4, 868, 60, 3, K('#FFFFFF'));
    s += R(x, y, 52, 72, K('#FFFFFF'), 'rx="4"') + R(x, y, 52, 15, K('#1F2A44'), 'rx="4"') + R(x, y + 10, 52, 5, K('#1F2A44'));
    s += `<text x="${x + 26}" y="${y + 11}" font-size="8.5" font-weight="600" text-anchor="middle" fill="#FFFFFF">UPI</text>`;
    let q = '';
    const c = 3.6, ox = x + 9.8, oy = y + 20;
    for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) {
      const fin = (r < 3 && k < 3) || (r < 3 && k > 5) || (r > 5 && k < 3);
      if (fin ? !(r % 2 === 1 && k % 2 === 1) : rng() < 0.5) q += `M${n(ox + k * c)} ${n(oy + r * c)}h${c}v${c}h-${c}z`;
    }
    s += `<path d="${q}" fill="${K('#1F2A44')}"/>`;
    s += `<text x="${x + 26}" y="${y + 66}" font-size="6.5" font-weight="600" text-anchor="middle" fill="${K('#1E9E62')}">SCAN &amp; PAY</text>`;
    return s;
  }

  function scanner(K) {
    const cx = 1376;
    const body = K('#4C5568'), dk = K('#2E3545'), lt = K('#6B7686');
    let s = `<ellipse cx="${cx}" cy="881" rx="32" ry="4.5" fill="#2a1c14" opacity=".28"/>`;
    s += `<path d="M${cx - 26} 880Q${cx - 26} 868 ${cx - 12} 866H${cx + 14}Q${cx + 26} 866 ${cx + 26} 880Z" fill="${dk}"/>`;
    s += `<path d="M${cx - 6} 868L${cx - 2} 840H${cx + 8}L${cx + 6} 868Z" fill="${dk}"/>`;
    // handle (sits in the cradle) then head pointing up-left
    s += `<path d="M${cx - 2} 874L${cx + 6} 836L${cx + 22} 838L${cx + 14} 876Q${cx + 6} 880 ${cx - 2} 874Z" fill="${body}"/>`;
    s += `<path d="M${cx + 8} 852L${cx + 12} 838" stroke="${K('#E7B04A')}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M${cx + 24} 840Q${cx + 30} 826 ${cx + 20} 818L${cx - 28} 790Q${cx - 40} 784 ${cx - 46} 796L${cx - 50} 806Q${cx - 52} 816 ${cx - 42} 820L${cx + 2} 842Q${cx + 14} 848 ${cx + 24} 840Z" fill="${body}"/>`;
    s += `<path d="M${cx + 20} 818L${cx - 28} 790Q${cx - 40} 784 ${cx - 46} 796L${cx - 44} 800Q${cx - 36} 792 ${cx - 26} 797L${cx + 18} 824Z" fill="${lt}"/>`;
    s += `<path d="M${cx - 46} 796L${cx - 50} 806Q${cx - 52} 816 ${cx - 42} 820L${cx - 38} 808Z" fill="#E36F5C"/>`;
    s += `<path d="M${cx - 42} 820L${cx + 2} 842Q${cx + 14} 848 ${cx + 24} 840L${cx + 22} 836Q${cx + 12} 842 ${cx + 2} 836L${cx - 38} 814Z" fill="${dk}" opacity=".6"/>`;
    return s;
  }

  function monitor(K, night) {
    const [sx, sy, sw, sh] = [1622, 688, 288, 162];
    let s = '';
    if (night) s += `<ellipse cx="${sx + sw / 2}" cy="872" rx="170" ry="9" fill="#CFE4FF" opacity=".28"/>`;
    s += `<ellipse cx="${sx + sw / 2 + 4}" cy="881" rx="96" ry="5" fill="#2a1c14" opacity=".28"/>`;
    s += R(sx + sw / 2 - 16, 856, 32, 22, K('#3A4150')) + R(sx + sw / 2 + 8, 856, 8, 22, K('#2B313E'));
    s += R(sx + sw / 2 - 52, 873, 104, 9, K('#2E3545'), 'rx="4"') + R(sx + sw / 2 - 52, 873, 104, 3, K('#4C5568'), 'rx="1.5"');
    s += `<path d="M${sx + sw + 12} ${sy - 10}L${sx + sw + 28} ${sy - 2}L${sx + sw + 28} ${sy + sh + 4}L${sx + sw + 12} ${sy + sh + 14}Z" fill="${K('#1A2030')}"/>`;
    s += R(sx - 12, sy - 12, sw + 24, sh + 26, K('#252C3B'), 'rx="9"') + R(sx - 12, sy - 12, sw + 24, 3, K('#4C5568'), 'rx="1.5"');
    // generic screen content (engine may overlay real UI in screenRect)
    const g = night ? (c => c) : (c => c);
    let sc = R(sx, sy, sw, sh, g('#F4F6FA'));
    sc += R(sx, sy, sw, 15, g('#1F2A44')) + `<circle cx="${sx + 9}" cy="${sy + 7.5}" r="4" fill="#C8161E"/>` + R(sx + 18, sy + 5, 40, 5, '#AEB6C2', 'rx="2"');
    sc += R(sx, sy + 15, 34, sh - 15, g('#E7EBF1'));
    for (let i = 0; i < 6; i++) sc += R(sx + 8, sy + 24 + i * 18, 18, 9, i === 1 ? '#C8161E' : '#AEB6C2', 'rx="2"');
    sc += R(sx + 42, sy + 22, sw - 50, 14, '#FFFFFF', 'rx="3"') + R(sx + 48, sy + 27, 70, 4, '#AEB6C2', 'rx="2"');
    sc += R(sx + 42, sy + 42, sw - 50, 11, '#DCE1E8');
    for (let i = 0; i < 6; i++) {
      const yy = sy + 57 + i * 12;
      sc += R(sx + 42, yy, sw - 50, 11, i % 2 ? '#FFFFFF' : '#F0F3F7') + R(sx + 46, yy + 4, 60 + (i * 23 % 40), 3.5, '#6B7686', 'rx="1.5"') + R(sx + 150, yy + 4, 26, 3.5, '#AEB6C2', 'rx="1.5"') + R(sx + 200, yy + 4, 30, 3.5, i === 3 ? '#E36F5C' : '#AEB6C2', 'rx="1.5"');
    }
    sc += R(sx + sw - 116, sy + sh - 22, 108, 16, '#1E9E62', 'rx="3"') + R(sx + sw - 106, sy + sh - 16, 50, 4, '#FFFFFF', 'rx="2"');
    sc += R(sx + 42, sy + sh - 22, 60, 16, '#1F2A44', 'rx="3"');
    s += sc;
    if (night) s += R(sx, sy, sw, sh, '#000814', 'opacity=".06"');
    s += `<path d="M${sx} ${sy}H${sx + 120}L${sx + 40} ${sy + sh}H${sx}Z" fill="#FFFFFF" opacity=".08"/>`;
    s += `<circle cx="${sx + sw / 2}" cy="${sy + sh + 7}" r="2.4" fill="${K('#6B7686')}"/>`;
    return s;
  }

  // ---------- foreground sachet strips ----------
  function sachets(K, x, y0, count, c1, c2, rot) {
    let s = `<g transform="rotate(${rot} ${x + 45} ${y0})">`;
    s += R(x + 40, y0 - 30, 10, 40, K('#6B7686'));
    for (let i = 0; i < count; i++) {
      const y = y0 + i * 74;
      s += R(x, y, 90, 72, K(i % 2 ? c2 : c1), 'rx="3"') + R(x, y + 26, 90, 22, K('#FBF8F2')) + R(x + 12, y + 32, 40, 4, K('#1F2A44')) + R(x + 12, y + 40, 28, 3, K('#6B7686'));
      s += `<circle cx="${x + 72}" cy="${y + 13}" r="8" fill="${K('#FBF8F2')}"/>` + R(x + 70, y + 31, 10, 10, K('#C8161E'));
      s += R(x, y + 64, 90, 8, DARK, 'opacity=".18"') + R(x + 70, y, 20, 72, DARK, 'opacity=".12"');
    }
    return s + '</g>';
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      counter_left: { x: 980, zone: 'behind' },
      counter_mid: { x: 1250, zone: 'behind' },
      counter_right: { x: 1500, zone: 'behind' },
      cust_left: { x: 430, zone: 'front' },
      cust_right: { x: 2080, zone: 'front' }
    },
    screenRect: [1622, 688, 288, 162],
    draw(opts) {
      opts = opts || {};
      const night = opts.time === 'night';
      const K = night ? nightify : (c => c);
      const name = esc(opts.name || 'Medical Store');

      // ----- defs -----
      const defs = `<defs>
<linearGradient id="${P('wall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#EEE3D0')}"/><stop offset=".35" stop-color="${K('#F3EBDD')}"/><stop offset="1" stop-color="${K('#E7D9C2')}"/></linearGradient>
<linearGradient id="${P('floor')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#CDBB9E')}"/><stop offset="1" stop-color="${K('#E2D4BC')}"/></linearGradient>
<linearGradient id="${P('ao')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c14" stop-opacity=".32"/><stop offset="1" stop-color="#2a1c14" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('sky')}" x1="0" y1="0" x2="0" y2="1">${night ? '<stop offset="0" stop-color="#0A1120"/><stop offset=".6" stop-color="#1B2742"/><stop offset="1" stop-color="#22304E"/>' : '<stop offset="0" stop-color="#B9D6EC"/><stop offset=".6" stop-color="#E4EFF2"/><stop offset="1" stop-color="#F4F1E6"/>'}</linearGradient>
<linearGradient id="${P('sign')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#E0262E' : '#CD1A22'}"/><stop offset="1" stop-color="${night ? '#B8141C' : '#A51219'}"/></linearGradient>
<radialGradient id="${P('tglow')}"><stop offset="0" stop-color="${night ? '#FFE9C4' : '#FFFFFF'}" stop-opacity=".9"/><stop offset="1" stop-color="${night ? '#FFE9C4' : '#FFFFFF'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('wash')}"><stop offset="0" stop-color="${night ? '#FFD49A' : '#FFFBF2'}" stop-opacity="${night ? 0.5 : 0.55}"/><stop offset="1" stop-color="${night ? '#FFD49A' : '#FFFBF2'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('lamp')}"><stop offset="0" stop-color="#FFC170" stop-opacity=".75"/><stop offset="1" stop-color="#FFC170" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('flame')}"><stop offset="0" stop-color="#FFC45C" stop-opacity=".7"/><stop offset="1" stop-color="#FFC45C" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('vig')}" cx=".5" cy=".42" r=".75"><stop offset=".5" stop-color="${night ? '#0B1220' : '#1a120c'}" stop-opacity="0"/><stop offset="1" stop-color="${night ? '#0B1220' : '#1a120c'}" stop-opacity="${night ? 0.62 : 0.2}"/></radialGradient>
<radialGradient id="${P('pool')}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${night ? '#FFD9A6' : '#FFFFFF'}" stop-opacity="${night ? 0.32 : 0.16}"/><stop offset="1" stop-color="${night ? '#FFD9A6' : '#FFFFFF'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('warmfl')}"><stop offset="0" stop-color="#FFE2B0" stop-opacity=".22"/><stop offset="1" stop-color="#FFE2B0" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('coolfl')}"><stop offset="0" stop-color="#BFE0F2" stop-opacity=".26"/><stop offset="1" stop-color="#BFE0F2" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('whfl')}"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<clipPath id="${P('dclip')}"><rect x="88" y="308" width="324" height="838"/></clipPath>
<filter id="${P('blur')}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="${P('soft')}" x="-10%" y="-100%" width="120%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${P('sblur')}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
<linearGradient id="${P('lowdark')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c14" stop-opacity="0"/><stop offset="1" stop-color="#2a1c14" stop-opacity="${night ? 0.22 : 0.1}"/></linearGradient>
</defs>`;

      // ----- back -----
      let back = defs;
      back += R(0, 0, 2400, 1350, U('wall'));
      back += R(0, 0, 2400, 22, K('#DDD0BA')) + R(0, 22, 2400, 8, K('#EFE6D6')) + R(0, 30, 2400, 4, K('#CDBEA5'));
      // floor
      back += R(0, 1158, 2400, 192, U('floor'));
      let fl = '';
      for (let x0 = -1810; x0 <= 4210; x0 += 200) { const xt = VPX + (x0 - VPX) * (1158 - VPY) / (1350 - VPY); fl += `M${n(xt)} 1158L${x0} 1350`; }
      for (const y of [1194, 1236, 1284, 1338]) fl += `M0 ${y}H2400`;
      let tl = '';
      const ys = [1158, 1194, 1236, 1284, 1338, 1350];
      const xa = (x0, y) => VPX + (x0 - VPX) * (y - VPY) / (1350 - VPY);
      for (let k = 0; k < 5; k++) for (let c = 0; c < 30; c++) {
        if ((c + k) % 2) continue;
        const a = -1810 + c * 200, b = a + 200, y0 = ys[k], y1 = ys[k + 1];
        tl += `M${n(xa(a, y0))} ${y0}L${n(xa(b, y0))} ${y0}L${n(xa(b, y1))} ${y1}L${n(xa(a, y1))} ${y1}Z`;
      }
      back += `<path d="${tl}" fill="#FFFFFF" opacity="${night ? 0.03 : 0.07}"/>`;
      back += `<path d="${fl}" stroke="${K('#BBA787')}" stroke-width="2" fill="none" opacity=".55"/>`;
      back += `<path d="M66 1160H434L${n(VPX + (434 - VPX) * 1.34)} 1350H${n(VPX + (66 - VPX) * 1.34)}Z" fill="${night ? '#6F8BC0' : '#FFFFFF'}" opacity="${night ? 0.1 : 0.28}"/>`;
      back += `<ellipse cx="1200" cy="1318" rx="1150" ry="60" fill="${U('whfl')}" opacity="${night ? 0.12 : 0.4}"/>`;
      back += R(0, 1158, 2400, 16, '#2a1c14', 'opacity=".14"');
      back += R(0, 1134, 470, 24, K('#D5C4A7')) + R(2010, 1134, 390, 24, K('#D5C4A7')) + R(0, 1134, 470, 3, K('#E6D8C0')) + R(2010, 1134, 390, 3, K('#E6D8C0'));
      // walls decor
      back += door(K, night);
      back += switchboard(K, 6, 640);
      back += cctv(K, 436, 34, night);
      back += R(484, 226, 1548, 940, '#2a1c14', `opacity="${night ? 0.3 : 0.2}" filter="url(#${P('sblur')})"`);
      back += shelves(K);
      back += R(466, 600, 1548, 560, U('lowdark'));
      // shelf haze to push it back a touch
      back += R(466, 214, 1548, 946, night ? '#1d2236' : '#F3EBDD', `opacity="${night ? 0.1 : 0.1}"`);
      back += nameBoard(K, name, night);
      back += clock(K, 586, 138, 58);
      back += deity(K, 1768, 92, 112, 122, night) + diya(K, 1906, 214, night);
      back += notice(K, 2026, 170, 158, 138);
      back += calendar(K, 2216, 150, 156, 300);
      back += tube(K, 92, 54, 320, night) + tube(K, 2010, 54, 320, night);
      back += `<ellipse cx="1200" cy="560" rx="900" ry="520" fill="${U('pool')}"/>`;
      back += R(0, 0, 2400, 1350, U('vig'));

      // ----- mid -----
      let mid = fridge(K, night, mulberry32(555));

      // ----- front -----
      let front = `<defs>
<linearGradient id="${P('cshadow')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c14" stop-opacity=".3"/><stop offset="1" stop-color="#2a1c14" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('ledglow')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6DE" stop-opacity="${night ? 0.8 : 0.55}"/><stop offset="1" stop-color="#FFF6DE" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('fglow')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset="1" stop-color="#BFE0F2" stop-opacity=".05"/></linearGradient>
</defs>`;
      front += counter(K, night) + printer(K) + qrStand(K) + scanner(K) + monitor(K, night);

      // ----- fore -----
      let fore = sachets(K, -34, -10, 4, '#E58A3C', '#F2D16B', 3) + sachets(K, 64, -40, 3, '#5AA0D8', '#9FC8E8', -2);

      return { back, mid, front, fore };
    }
  };
})();
