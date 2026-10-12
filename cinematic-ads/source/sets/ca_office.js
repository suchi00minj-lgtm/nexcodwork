// ca_office — a chartered accountant's tidy, premium office.
// World 2400x1350, floor line y=1250 (character plane, s=1).
// One-point perspective: eye height 660 units, vanishing point (1200, 590).
// A point (X lateral, H height above floor, Z depth) projects with s = D/Z.
window.SETS = window.SETS || {};
(function () {
  const ID = 'ca_office';
  const P = s => ID + '_' + s;
  let LAYER = ''; // per-layer id prefix so every layer <svg> carries its own defs
  const U = s => 'url(#' + P(LAYER + s) + ')';
  const D = 1788, VPX = 1200, VPY = 590, EYE = 660;
  const n = v => Math.round(v * 10) / 10;
  const SX = (X, Z) => VPX + X * D / Z;
  const SY = (H, Z) => VPY + (EYE - H) * D / Z;
  const pt = (X, H, Z) => n(SX(X, Z)) + ' ' + n(SY(H, Z));

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
  function nightify(c) { const [r, g, b] = hx(c); return toHex([r * 0.5 + 6, g * 0.48 + 10, b * 0.52 + 26]); }
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const quad = (pts, f, ex) => `<path d="M${pts.map(p => pt(p[0], p[1], p[2])).join('L')}Z" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const T = (x, y, size, fill, txt, ex) => `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" fill="${fill}"${ex ? ' ' + ex : ''}>${txt}</text>`;
  const pick = (rng, a) => a[Math.floor(rng() * a.length) % a.length];
  function fitText(x, y, size, fill, txt, maxW, anchor, weight, ex) {
    const est = txt.length * size * 0.62;
    const fit = est > maxW ? ` textLength="${n(maxW)}" lengthAdjust="spacingAndGlyphs"` : '';
    return T(x, y, size, fill, txt, `font-weight="${weight || 600}" text-anchor="${anchor || 'middle'}"${fit}${ex ? ' ' + ex : ''}`);
  }

  // ---------- room ----------
  const ZB = 2980;              // back wall (s = 0.6)
  const XL = -1300, XR = 1350;   // side walls
  const HC = 1380;               // ceiling height (3.1 m)
  const DARK = '#2A1C14';
  const sB = D / ZB;
  const BX = X => SX(X, ZB), BY = H => SY(H, ZB);

  // ---------- walls, ceiling, floor ----------
  function shell(K, night) {
    let s = '';
    // left wall
    s += quad([[XL, -10, 1200], [XL, -10, ZB], [XL, HC, ZB], [XL, HC, 1200]], U('lwall'));
    // right wall
    s += quad([[XR, -10, 1200], [XR, -10, ZB], [XR, HC, ZB], [XR, HC, 1200]], U('rwall'));
    // back wall
    s += R(BX(XL), BY(HC), BX(XR) - BX(XL), BY(0) - BY(HC), U('bwall'));
    // ceiling
    s += quad([[XL, HC, 900], [XR, HC, 900], [XR, HC, ZB], [XL, HC, ZB]], K('#F4EEE3'));
    // ceiling grid + recessed LED panels
    let g = '';
    for (let X = XL; X <= XR; X += 265) g += `M${pt(X, HC, ZB)}L${pt(X, HC, 1300)}`;
    for (let Z = ZB; Z > 1500; Z -= 265) g += `M${pt(XL, HC, Z)}L${pt(XR, HC, Z)}`;
    s += `<path d="${g}" stroke="${K('#DDD3C2')}" stroke-width="2" fill="none"/>`;
    for (const [x0, z0] of [[-795, 2185], [-795, 2715], [265, 2185], [265, 2715]]) {
      const pts = [[x0 + 25, HC - 1, z0 + 25], [x0 + 505, HC - 1, z0 + 25], [x0 + 505, HC - 1, z0 + 240], [x0 + 25, HC - 1, z0 + 240]];
      s += quad(pts, night ? '#FFF8EA' : '#FFFFFF');
      if (night) s += quad(pts, '#FFF1D6', `opacity=".9" filter="${U('glow')}"`);
      else s += quad(pts, K('#E8EEF4'), 'opacity=".5"');
    }
    // cornice shadow lines where ceiling meets walls
    s += `<path d="M${pt(XL, HC, 1500)}L${pt(XL, HC, ZB)}L${pt(XR, HC, ZB)}L${pt(XR, HC, 1500)}" stroke="${K('#CFC3AE')}" stroke-width="5" fill="none"/>`;
    // floor (vitrified tiles)
    s += quad([[XL, 0, 1000], [XR, 0, 1000], [XR, 0, ZB], [XL, 0, ZB]], U('floor'));
    let t = '';
    for (let X = XL; X <= XR; X += 268) t += `M${pt(X, 0, ZB)}L${pt(X, 0, 1150)}`;
    for (let Z = ZB; Z > 1180; Z -= 268) t += `M${pt(XL, 0, Z)}L${pt(XR, 0, Z)}`;
    s += `<path d="${t}" stroke="${K('#C9B79C')}" stroke-width="2" fill="none" opacity=".8"/>`;
    // skirting
    s += R(BX(XL), BY(45), BX(XR) - BX(XL), BY(0) - BY(45), K('#9A6B43'));
    s += quad([[XL, 0, 1200], [XL, 0, ZB], [XL, 45, ZB], [XL, 45, 1200]], K('#8A5E3A'));
    s += quad([[XR, 0, 1200], [XR, 0, ZB], [XR, 45, ZB], [XR, 45, 1200]], K('#8A5E3A'));
    return s;
  }

  // ---------- window with city view ----------
  const WX0 = -500, WX1 = 150, WH0 = 400, WH1 = 1210;
  function cityView(K, night, x0, y0, w, h) {
    const rng = mulberry32(night ? 919 : 919);
    let s = R(x0, y0, w, h, U('sky'));
    if (!night) {
      s += E(x0 + w * 0.3, y0 + h * 0.2, 70, 14, '#FFFFFF', 'opacity=".7"') + E(x0 + w * 0.42, y0 + h * 0.18, 50, 12, '#FFFFFF', 'opacity=".6"');
    } else {
      s += C(x0 + w * 0.78, y0 + h * 0.16, 14, '#F4EBD0') + C(x0 + w * 0.78, y0 + h * 0.16, 34, '#F4EBD0', 'opacity=".12"');
      let st = '';
      for (let i = 0; i < 18; i++) st += `<circle cx="${n(x0 + rng() * w)}" cy="${n(y0 + rng() * h * 0.4)}" r="${n(0.8 + rng() * 1.2)}"/>`;
      s += `<g fill="#FFFFFF" opacity=".6">${st}</g>`;
    }
    // far skyline
    const far = night ? '#2A3858' : '#C7D6E2', farW = night ? '#F2C46B' : '#E4ECF2';
    const near = night ? '#1B2440' : '#A9BCCB', nearW = night ? '#FFD27A' : '#D2DEE8';
    let x = x0 - 10;
    let fb = '', fw = '';
    while (x < x0 + w) {
      const bw = 30 + rng() * 50, bh = h * (0.25 + rng() * 0.3);
      fb += `M${n(x)} ${n(y0 + h - bh)}h${n(bw)}V${n(y0 + h)}h${n(-bw)}Z`;
      for (let yy = y0 + h - bh + 8; yy < y0 + h - 6; yy += 11) for (let xx = x + 5; xx < x + bw - 6; xx += 9) if (rng() < (night ? 0.35 : 0.6)) fw += `M${n(xx)} ${n(yy)}h4v5h-4Z`;
      x += bw + 2 + rng() * 6;
    }
    s += `<path d="${fb}" fill="${far}"/><path d="${fw}" fill="${farW}" opacity="${night ? 0.8 : 0.9}"/>`;
    // water tank + mobile tower silhouettes (Indian city roofline)
    const tx = x0 + w * 0.62, ty = y0 + h * 0.52;
    s += R(tx, ty, 26, 20, far) + R(tx + 4, ty + 20, 4, 30, far) + R(tx + 18, ty + 20, 4, 30, far);
    if (night) s += C(x0 + w * 0.18, y0 + h * 0.5, 3, '#FF4D4D') + C(x0 + w * 0.18, y0 + h * 0.5, 9, '#FF4D4D', 'opacity=".25"');
    // near buildings
    x = x0 - 20; let nb = '', nw = '';
    while (x < x0 + w) {
      const bw = 60 + rng() * 80, bh = h * (0.12 + rng() * 0.22);
      nb += `M${n(x)} ${n(y0 + h - bh)}h${n(bw)}V${n(y0 + h)}h${n(-bw)}Z`;
      for (let yy = y0 + h - bh + 10; yy < y0 + h - 8; yy += 16) for (let xx = x + 8; xx < x + bw - 10; xx += 14) if (rng() < (night ? 0.45 : 0.7)) nw += `M${n(xx)} ${n(yy)}h7v8h-7Z`;
      x += bw + 4 + rng() * 10;
    }
    s += `<path d="${nb}" fill="${near}"/><path d="${nw}" fill="${nearW}" opacity="${night ? 0.9 : 0.8}"/>`;
    if (night) s += `<path d="${nw}" fill="#FFC864" opacity=".35" filter="${U('glow')}"/>`;
    // tree crowns in the foreground of the view
    const tr = night ? '#14202E' : '#7BAE84', tr2 = night ? '#1A2838' : '#93C29A';
    s += E(x0 + 40, y0 + h - 10, 90, 70, tr) + E(x0 + 120, y0 + h + 10, 80, 60, tr) + E(x0 + 60, y0 + h - 40, 50, 38, tr2);
    if (!night) s += R(x0, y0, w, h, '#FFFFFF', 'opacity=".12"');
    return s;
  }

  function windowBlock(K, night) {
    let s = '';
    const x0 = BX(WX0), x1 = BX(WX1), y0 = BY(WH1), y1 = BY(WH0);
    // recess shadow + frame
    s += R(x0 - 16, y0 - 16, x1 - x0 + 32, y1 - y0 + 32, K('#D9CCB5'));
    s += `<g clip-path="${U('winclip')}">` + cityView(K, night, x0, y0, x1 - x0, y1 - y0) + '</g>';
    // aluminium frame + mullions
    const fc = K('#5D6878'), fl = K('#8A95A5');
    s += R(x0 - 8, y0 - 8, x1 - x0 + 16, 10, fc) + R(x0 - 8, y1 - 2, x1 - x0 + 16, 10, fc) + R(x0 - 8, y0 - 8, 10, y1 - y0 + 16, fc) + R(x1 - 2, y0 - 8, 10, y1 - y0 + 16, fc);
    const xm = (x0 + x1) / 2;
    s += R(xm - 5, y0, 10, y1 - y0, fc) + R(xm - 5, y0, 3, y1 - y0, fl);
    s += R(x0, y0 + (y1 - y0) * 0.72 - 4, x1 - x0, 8, fc);
    // glass reflections
    s += `<path d="M${n(x0 + 30)} ${n(y1)}L${n(x0 + 120)} ${n(y0)}h40L${n(x0 + 70)} ${n(y1)}ZM${n(xm + 40)} ${n(y1)}L${n(xm + 120)} ${n(y0)}h16L${n(xm + 56)} ${n(y1)}Z" fill="#FFFFFF" opacity="${night ? 0.05 : 0.22}"/>`;
    // roller blind, pulled a quarter down
    const by = y0 + (y1 - y0) * 0.22;
    s += R(x0 - 12, y0 - 22, x1 - x0 + 24, 20, K('#D8D0C2'), 'rx="6"');
    s += R(x0 - 4, y0 - 4, x1 - x0 + 8, by - y0 + 4, K('#EFE7D8'));
    s += R(x0 - 4, y0 - 4, x1 - x0 + 8, by - y0 + 4, U('blind'));
    s += R(x0 - 6, by - 4, x1 - x0 + 12, 9, K('#B9AE9C'), 'rx="3"');
    s += `<path d="M${n(xm)} ${n(by + 5)}v28" stroke="${K('#B9AE9C')}" stroke-width="2"/>` + C(xm, by + 36, 4, K('#B9AE9C'));
    // marble sill (top face visible: below eye level)
    const sy = y1 + 8;
    s += `<path d="M${n(x0 - 26)} ${n(sy)}H${n(x1 + 26)}L${n(x1 + 34)} ${n(sy + 10)}H${n(x0 - 34)}Z" fill="${K('#F6F2EA')}"/>`;
    s += R(x0 - 34, sy + 10, x1 - x0 + 68, 10, K('#DCD4C6'));
    // small succulent on the sill
    const px = x1 - 60;
    s += `<path d="M${n(px - 14)} ${n(sy + 2)}l3 -26h22l3 26Z" fill="${K('#F4F1EA')}"/>`;
    s += `<path d="M${n(px)} ${n(sy - 24)}q-16 -16 -22 -6q8 4 22 6q-2 -22 0 -30q6 10 0 30q14 -18 22 -10q-8 6 -22 10Z" fill="${K('#6FAF8A')}"/>`;
    return s;
  }

  // ---------- accent wall with certificates ----------
  const PX0 = 205, PX1 = 830; // wood slat panel (X)
  function accentWall(K, night) {
    let s = '';
    const x0 = BX(PX0), x1 = BX(PX1), y0 = BY(HC), y1 = BY(0);
    s += R(x0 - 6, y0, x1 - x0 + 12, y1 - y0, K('#7A5233'));
    s += R(x0, y0, x1 - x0, y1 - y0, K('#9A6B43'));
    let sl = '', sh = '';
    for (let x = x0 + 4; x < x1 - 6; x += 15) { sl += `M${n(x)} ${n(y0)}h8V${n(y1)}h-8Z`; sh += `M${n(x + 8)} ${n(y0)}h2V${n(y1)}h-2Z`; }
    s += `<path d="${sl}" fill="${K('#B9875A')}"/><path d="${sh}" fill="${K('#6E4A2E')}" opacity=".6"/>`;
    // cove light strip at the top of the panel
    s += R(x0, y0, x1 - x0, 10, night ? '#FFE4B0' : K('#E9DCC6'));
    s += R(x0, y0 + 10, x1 - x0, 240, U('cove'));
    // certificates
    s += certificate(K, 1442, 326, 116, 84, 'landscape');
    s += certificate(K, 1336, 410, 76, 104, 'portrait');
    s += certificate(K, 1588, 410, 76, 104, 'portrait');
    return s;
  }
  function certificate(K, x, y, w, h, kind) {
    let s = R(x + 4, y + 6, w, h, DARK, 'opacity=".28"');
    s += R(x, y, w, h, K('#C9A45C')) + R(x + 2, y + 2, w - 4, 2, K('#E8CF8E')) + R(x, y + h - 3, w, 3, K('#9C7A3A'));
    s += R(x + 6, y + 6, w - 12, h - 12, K('#FBF8F1'));
    s += R(x + 10, y + 10, w - 20, h - 20, 'none', `stroke="${K('#C9A45C')}" stroke-width="1.2"`);
    const cx = x + w / 2;
    s += fitText(cx, y + h * 0.27, Math.min(9, w * 0.09), K('#7A5233'), 'CERTIFICATE', w - 30, 'middle', 600, 'letter-spacing="1"');
    s += R(cx - w * 0.28, y + h * 0.38, w * 0.56, 2.5, K('#2B3A55')) + R(cx - w * 0.2, y + h * 0.47, w * 0.4, 2, K('#9AA3AE')) + R(cx - w * 0.24, y + h * 0.54, w * 0.48, 2, K('#9AA3AE'));
    s += C(kind === 'landscape' ? x + w * 0.22 : cx, y + h * 0.74, Math.min(w, h) * 0.08, K('#C8161E')) + C(kind === 'landscape' ? x + w * 0.22 : cx, y + h * 0.74, Math.min(w, h) * 0.045, K('#E36F5C'));
    if (kind === 'landscape') s += R(x + w * 0.55, y + h * 0.76, w * 0.28, 1.5, K('#6B7686'));
    return s;
  }

  // ---------- credenza behind the desk ----------
  function credenza(K, night) {
    let s = '';
    const X0 = 230, X1 = 800, Z0 = ZB - 200, H = 330;
    s += quad([[X0, H, Z0], [X1, H, Z0], [X1, H, ZB - 4], [X0, H, ZB - 4]], K('#C79A6C'));
    const x0 = SX(X0, Z0), x1 = SX(X1, Z0), y0 = SY(H, Z0), y1 = SY(0, Z0);
    s += R(x0, y0, x1 - x0, y1 - y0, K('#8C5F3B'));
    s += R(x0, y0, x1 - x0, 6, K('#B9875A'));
    for (let k = 0; k < 3; k++) { const a = x0 + 6 + k * (x1 - x0 - 12) / 3; s += R(a + 3, y0 + 14, (x1 - x0 - 12) / 3 - 6, y1 - y0 - 30, K('#9A6B43'), 'rx="2"') + R(a + (x1 - x0 - 12) / 6 - 12, y0 + 30, 24, 4, K('#C9A45C')); }
    // box files + small printer on top
    const cols = ['#1F2A44', '#7A2E2E', '#2F5F6B', '#1F2A44', '#B48ED6'];
    let fx = x0 + 18;
    for (let i = 0; i < 5; i++) { const fh = 62 + (i % 2) * 6; s += R(fx, y0 - fh, 18, fh, K(cols[i])) + R(fx + 4, y0 - fh + 12, 10, 18, K('#F4F1EA')) + C(fx + 9, y0 - 14, 3, K('#C9CDD3')); fx += 20; }
    s += R(x1 - 120, y0 - 44, 96, 44, K('#E3E6EA'), 'rx="4"') + R(x1 - 120, y0 - 44, 96, 8, K('#C9CDD3'), 'rx="3"') + R(x1 - 104, y0 - 30, 64, 4, K('#6B7686')) + R(x1 - 112, y0 - 6, 80, 6, K('#AEB6C2'));
    return s;
  }

  // ---------- bookshelf ----------
  function bookshelf(K, night) {
    let s = '';
    const X0 = 880, X1 = 1320, Z0 = ZB - 160, H1 = 1180;
    const x0 = SX(X0, Z0), x1 = SX(X1, Z0), y0 = SY(H1, Z0), y1 = SY(0, Z0);
    // left side face (visible since the shelf sits right of centre)
    s += quad([[X0, 0, Z0], [X0, 0, ZB], [X0, H1, ZB], [X0, H1, Z0]], K('#7A5233'));
    s += R(x0, y0, x1 - x0, y1 - y0, K('#5E3F27'));
    const rng = mulberry32(1313);
    const shelves = 5, inner = (y1 - y0 - 40) / shelves;
    const BOOK = ['#7A2E2E', '#1F2A44', '#2F5F6B', '#8A6A2E', '#4A3A5C', '#1F2A44', '#7A2E2E', '#3E5A40', '#B9875A', '#E9DCC6'];
    for (let k = 0; k < shelves; k++) {
      const sy = y0 + 18 + k * inner, by = sy + inner - 8;
      s += R(x0 + 10, sy, x1 - x0 - 20, inner - 8, K('#4E331F'));
      let x = x0 + 14;
      const end = x1 - 14;
      while (x < end - 6) {
        const r = rng();
        if (r < 0.12 && x < end - 60) { // box file with label
          const w = 30, h = inner - 26;
          s += R(x, by - h, w, h, K(pick(rng, ['#1F2A44', '#7A2E2E', '#2F5F6B']))) + R(x + 6, by - h + 10, w - 12, 26, K('#F4F1EA')) + R(x + 8, by - h + 16, w - 16, 3, K('#6B7686')) + C(x + w / 2, by - 12, 4, K('#C9CDD3'));
          x += w + 2;
        } else if (r < 0.18 && x < end - 50) { // decor: small plant or trophy
          if (rng() < 0.5) s += `<path d="M${n(x + 6)} ${n(by)}l3 -22h22l3 22Z" fill="${K('#F4F1EA')}"/><path d="M${n(x + 20)} ${n(by - 22)}q-14 -20 -20 -8q8 2 20 8q0 -24 6 -28q2 14 -6 28q12 -16 22 -10q-8 8 -22 10Z" fill="${K('#6FAF8A')}"/>`;
          else s += `<path d="M${n(x + 8)} ${n(by)}h24l-4 -8h-16Z M${n(x + 16)} ${n(by - 8)}h8v-12h-8Z M${n(x + 8)} ${n(by - 20)}h24q0 -20 -12 -22q-12 2 -12 22Z" fill="${K('#C9A45C')}"/>`;
          x += 44;
        } else if (r < 0.24) { x += 10 + rng() * 14; } // gap
        else { // run of law books
          const k2 = 3 + Math.floor(rng() * 6), c = pick(rng, BOOK), hb = inner - 24 - rng() * 18;
          for (let q = 0; q < k2 && x < end - 10; q++) {
            const w = 11 + rng() * 6, h = hb - rng() * 6;
            s += R(x, by - h, w, h, K(c)) + R(x, by - h + h * 0.14, w, 3, K('#C9A45C')) + R(x, by - h + h * 0.8, w, 2.5, K('#C9A45C')) + R(x + w - 2, by - h, 2, h, DARK, 'opacity=".25"');
            x += w + 0.8;
          }
          // a leaning book
          if (rng() < 0.3 && x < end - 40) { const hb2 = inner - 34; s += `<path d="M${n(x)} ${n(by)}l${n(hb2 * 0.26)} ${n(-hb2)}l15 3l${n(-hb2 * 0.26)} ${n(hb2 - 3)}Z" fill="${K(pick(rng, BOOK))}"/>`; x += hb2 * 0.26 + 18; }
          x += 2;
        }
      }
      s += R(x0 + 6, by, x1 - x0 - 12, 10, K('#9A6B43')) + R(x0 + 6, by, x1 - x0 - 12, 3, K('#B9875A'));
    }
    s += R(x0, y0, x1 - x0, 14, K('#9A6B43')) + R(x0, y0, 10, y1 - y0, K('#8C5F3B')) + R(x1 - 10, y0, 10, y1 - y0, K('#7A5233'));
    s += R(x0, y1 - 20, x1 - x0, 20, K('#5E3F27'));
    return s;
  }

  // ---------- left wall: entrance door ----------
  function door(K, night) {
    let s = '';
    const z0 = 2180, z1 = 2580, H = 950;
    s += quad([[XL, 0, z0 - 40], [XL, 0, z1 + 40], [XL, H + 50, z1 + 40], [XL, H + 50, z0 - 40]], K('#E7DCC8'));
    s += quad([[XL, 0, z0], [XL, 0, z1], [XL, H, z1], [XL, H, z0]], K('#9A6B43'));
    // frosted glass strip
    s += quad([[XL, 250, z0 + 150], [XL, 250, z0 + 250], [XL, 850, z0 + 250], [XL, 850, z0 + 150]], night ? '#3A4A68' : K('#DCE6EC'));
    s += quad([[XL, 250, z0 + 150], [XL, 250, z0 + 250], [XL, 850, z0 + 250], [XL, 850, z0 + 150]], '#FFFFFF', `opacity="${night ? 0.06 : 0.25}"`);
    // handle
    s += quad([[XL, 470, z1 - 70], [XL, 470, z1 - 40], [XL, 490, z1 - 40], [XL, 490, z1 - 70]], K('#C9CDD3'));
    // frame edges
    s += quad([[XL, 0, z0 - 40], [XL, 0, z0], [XL, H + 50, z0], [XL, H + 50, z0 - 40]], K('#7A5233'));
    s += quad([[XL, 0, z1], [XL, 0, z1 + 40], [XL, H + 50, z1 + 40], [XL, H + 50, z1]], K('#8C5F3B'));
    s += quad([[XL, H, z0 - 40], [XL, H, z1 + 40], [XL, H + 50, z1 + 40], [XL, H + 50, z0 - 40]], K('#8C5F3B'));
    // switch board
    s += quad([[XL, 520, z1 + 120], [XL, 520, z1 + 220], [XL, 600, z1 + 220], [XL, 600, z1 + 120]], K('#F4F1EA'));
    return s;
  }

  // ---------- right wall: split AC + clock ----------
  function rightWallProps(K, night) {
    let s = '';
    const z0 = 2250, z1 = 2800, Xf = XR - 95, h0 = 1140, h1 = 1290;
    s += quad([[Xf, h0, z0], [Xf, h0, z1], [Xf, h1, z1], [Xf, h1, z0]], K('#F6F4F0'));
    s += quad([[Xf, h0, z0], [XR, h0, z0], [XR, h0, z1], [Xf, h0, z1]], K('#CFCBC4'));
    s += quad([[Xf, h0, z0], [XR, h0, z0], [XR, h1, z0], [Xf, h1, z0]], K('#E3E0DA'));
    let v = '';
    for (let h = h0 + 14; h < h0 + 50; h += 9) v += `M${pt(Xf - 1, h, z0 + 30)}L${pt(Xf - 1, h, z1 - 30)}`;
    s += `<path d="${v}" stroke="${K('#AEB6C2')}" stroke-width="2"/>`;
    s += quad([[Xf - 1, h0 + 80, z0 + 60], [Xf - 1, h0 + 80, z0 + 130], [Xf - 1, h0 + 105, z0 + 130], [Xf - 1, h0 + 105, z0 + 60]], night ? '#7FD8FF' : K('#9FC8E8'));
    // wall clock on the right wall
    const cz = 2500, cH = 880, r = 70;
    const cx = SX(XR, cz), cy = SY(cH, cz), rx = Math.abs(SX(XR, cz + r) - SX(XR, cz - r)) / 2, ry = r * D / cz;
    s += E(cx - 4, cy + 4, rx, ry, DARK, 'opacity=".2"') + E(cx, cy, rx, ry, K('#1F2A44')) + E(cx, cy, rx * 0.84, ry * 0.86, K('#FBF8F1'));
    s += `<path d="M${n(cx)} ${n(cy)}L${n(cx + rx * 0.1)} ${n(cy - ry * 0.55)}M${n(cx)} ${n(cy)}L${n(cx + rx * 0.4)} ${n(cy + ry * 0.2)}" stroke="${K('#1F2A44')}" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  }

  // ---------- potted plants ----------
  function leaf(x, y, L, W, ang, dark, light, rib) {
    const d = `M0 0C${n(W * 0.35)} ${n(-L * 0.22)} ${n(W * 0.8)} ${n(-L * 0.68)} 0 ${n(-L)}C${n(-W * 0.8)} ${n(-L * 0.68)} ${n(-W * 0.35)} ${n(-L * 0.22)} 0 0Z`;
    const h = `M0 0C${n(W * 0.35)} ${n(-L * 0.22)} ${n(W * 0.8)} ${n(-L * 0.68)} 0 ${n(-L)}Z`;
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})"><path d="${d}" fill="${dark}"/><path d="${h}" fill="${light}"/><path d="M0 0L0 ${n(-L * 0.92)}" stroke="${rib}" stroke-width="${n(Math.max(1, W * 0.04))}"/></g>`;
  }
  // fiddle-leaf fig in a tall ceramic planter
  function figTree(K, X, Z) {
    const k = D / Z;
    const x = SX(X, Z), y = SY(0, Z);
    let s = E(x, y, 110 * k, 16 * k, DARK, 'opacity=".28"');
    s += `<path d="M${n(x - 78 * k)} ${n(y - 300 * k)}h${n(156 * k)}l${n(-16 * k)} ${n(300 * k)}h${n(-124 * k)}Z" fill="${K('#EEE9DF')}"/>`;
    s += `<path d="M${n(x + 26 * k)} ${n(y - 300 * k)}h${n(52 * k)}l${n(-16 * k)} ${n(300 * k)}h${n(-44 * k)}Z" fill="${K('#D3CCBF')}"/>`;
    s += R(x - 82 * k, y - 312 * k, 164 * k, 18 * k, K('#DDD7CB'), `rx="${n(5 * k)}"`);
    s += R(x - 72 * k, y - 296 * k, 144 * k, 10 * k, K('#6E4A2E'), 'opacity=".7"');
    // trunk and branches
    const ty = y - 300 * k;
    s += `<path d="M${n(x)} ${n(ty)}C${n(x - 10 * k)} ${n(ty - 300 * k)} ${n(x + 20 * k)} ${n(ty - 500 * k)} ${n(x + 6 * k)} ${n(ty - 760 * k)}M${n(x + 2 * k)} ${n(ty - 330 * k)}Q${n(x - 90 * k)} ${n(ty - 420 * k)} ${n(x - 120 * k)} ${n(ty - 560 * k)}M${n(x + 8 * k)} ${n(ty - 430 * k)}Q${n(x + 100 * k)} ${n(ty - 500 * k)} ${n(x + 130 * k)} ${n(ty - 620 * k)}" stroke="${K('#6E4A2E')}" stroke-width="${n(9 * k)}" fill="none" stroke-linecap="round"/>`;
    const rng = mulberry32(55);
    const nodes = [[0, 760, 0], [-120, 560, -1], [130, 620, 1], [6, 600, 0], [-60, 470, -1], [70, 520, 1], [0, 420, 0]];
    const dk = K('#3F7A50'), lt = K('#5E9E6A'), rib = K('#2F5F3E');
    const leaves = [];
    for (const [dx, h, side] of nodes) {
      const cnt = 4 + Math.floor(rng() * 2);
      for (let i = 0; i < cnt; i++) {
        const ang = (side === 0 ? (i - (cnt - 1) / 2) * 38 : side * (20 + i * 30)) + (rng() - 0.5) * 20;
        leaves.push([x + dx * k + (rng() - 0.5) * 30 * k, ty - h * k + rng() * 60 * k, (120 + rng() * 50) * k, (95 + rng() * 30) * k, ang, rng()]);
      }
    }
    leaves.sort((a, b) => a[5] - b[5]);
    for (const [lx, ly, L, W, ang, r] of leaves) s += leaf(lx, ly, L, W, ang, r < 0.35 ? K('#356B45') : dk, lt, rib);
    return s;
  }
  // snake plant (sansevieria) in a low pot
  function snakePlant(K, X, Z) {
    const k = D / Z, x = SX(X, Z), y = SY(0, Z);
    let s = E(x, y, 80 * k, 12 * k, DARK, 'opacity=".25"');
    s += `<path d="M${n(x - 62 * k)} ${n(y - 170 * k)}h${n(124 * k)}l${n(-12 * k)} ${n(170 * k)}h${n(-100 * k)}Z" fill="${K('#2B3A55')}"/>`;
    s += `<path d="M${n(x + 20 * k)} ${n(y - 170 * k)}h${n(42 * k)}l${n(-12 * k)} ${n(170 * k)}h${n(-34 * k)}Z" fill="${K('#1F2A44')}"/>`;
    const bl = [[-40, 480, -12], [-18, 620, -4], [6, 560, 3], [28, 680, 8], [44, 430, 16], [-56, 360, -20], [14, 400, -2]];
    for (const [dx, h, a] of bl) {
      const bx = x + dx * k, by = y - 168 * k;
      s += `<g transform="translate(${n(bx)} ${n(by)}) rotate(${a})"><path d="M${n(-16 * k)} 0Q${n(-20 * k)} ${n(-h * 0.6 * k)} 0 ${n(-h * k)}Q${n(20 * k)} ${n(-h * 0.6 * k)} ${n(16 * k)} 0Z" fill="${K('#3F7A50')}"/><path d="M0 0L0 ${n(-h * k)}Q${n(20 * k)} ${n(-h * 0.6 * k)} ${n(16 * k)} 0Z" fill="${K('#6FAF7A')}"/><path d="M${n(-10 * k)} ${n(-h * 0.3 * k)}h${n(18 * k)}M${n(-12 * k)} ${n(-h * 0.5 * k)}h${n(20 * k)}" stroke="${K('#2F5F3E')}" stroke-width="${n(3 * k)}" opacity=".6"/></g>`;
    }
    return s;
  }

  // ---------- rug ----------
  function rug(K) {
    const X0 = -1060, X1 = 160, Z0 = 1640, Z1 = 2640;
    const rect = (i, f, ex) => quad([[X0 + i, 1, Z0 + i], [X1 - i, 1, Z0 + i], [X1 - i, 1, Z1 - i], [X0 + i, 1, Z1 - i]], f, ex);
    let s = quad([[X0 - 30, 0, Z0 - 40], [X1 + 30, 0, Z0 - 40], [X1 + 30, 0, Z1], [X0 - 30, 0, Z1]], DARK, 'opacity=".1"');
    s += rect(0, K('#8C5A3C'));
    s += rect(34, K('#2B3A55'));
    s += rect(46, 'none', `stroke="${K('#E9DCC6')}" stroke-width="2.5"`);
    s += rect(110, 'none', `stroke="${K('#B9875A')}" stroke-width="2"`);
    // central medallion
    const Xc = (X0 + X1) / 2, Zc = (Z0 + Z1) / 2;
    s += quad([[Xc, 1, Zc - 330], [Xc + 360, 1, Zc], [Xc, 1, Zc + 330], [Xc - 360, 1, Zc]], K('#34476A'));
    s += quad([[Xc, 1, Zc - 330], [Xc + 360, 1, Zc], [Xc, 1, Zc + 330], [Xc - 360, 1, Zc]], 'none', `stroke="${K('#E9DCC6')}" stroke-width="2"`);
    s += quad([[Xc, 1, Zc - 150], [Xc + 160, 1, Zc], [Xc, 1, Zc + 150], [Xc - 160, 1, Zc]], K('#B9875A'));
    s += quad([[Xc, 1, Zc - 60], [Xc + 64, 1, Zc], [Xc, 1, Zc + 60], [Xc - 64, 1, Zc]], K('#E9DCC6'));
    // corner motifs
    for (const [cx, cz] of [[X0 + 170, Z0 + 170], [X1 - 170, Z0 + 170], [X0 + 170, Z1 - 170], [X1 - 170, Z1 - 170]]) s += quad([[cx, 1, cz - 50], [cx + 60, 1, cz], [cx, 1, cz + 50], [cx - 60, 1, cz]], K('#B9875A'));
    // fringe on the near edge
    let f = '';
    for (let X = X0 + 10; X < X1; X += 22) f += `M${pt(X, 0, Z0)}L${pt(X, 0, Z0 - 30)}`;
    s += `<path d="${f}" stroke="${K('#E9DCC6')}" stroke-width="2" opacity=".9"/>`;
    return s;
  }

  // ---------- desk + props (front layer, screen space) ----------
  const DX0 = 1110, DX1 = 1890, DTOP = 880, DBACK = 846, DBOT = 1268;
  function desk(K, night) {
    let s = '';
    const kb = (DBACK - VPY) / (DTOP - VPY);
    const bx0 = VPX + (DX0 - VPX) * kb, bx1 = VPX + (DX1 - VPX) * kb;
    s += E((DX0 + DX1) / 2, DBOT + 4, (DX1 - DX0) / 2 + 70, 22, DARK, `opacity=".3" filter="${U('sblur')}"`);
    // base body (walnut)
    s += R(DX0 + 10, DTOP + 20, DX1 - DX0 - 20, DBOT - DTOP - 20, K('#6E4A2E'));
    // walnut veneer front with book-matched grain, inset brass pinstripes
    s += R(DX0 + 60, DTOP + 50, DX1 - DX0 - 120, DBOT - DTOP - 100, K('#8C5F3B'), 'rx="4"');
    const rg = mulberry32(404);
    let gr = '';
    const cx = (DX0 + DX1) / 2;
    for (let i = 0; i < 14; i++) {
      const y = DTOP + 80 + i * 22 + rg() * 8, w = 120 + rg() * 180;
      gr += `M${n(cx - 6)} ${n(y)}q${n(-w * 0.5)} ${n(-18 - rg() * 10)} ${n(-w)} ${n(-4)}M${n(cx + 6)} ${n(y)}q${n(w * 0.5)} ${n(-18 - rg() * 10)} ${n(w)} ${n(-4)}`;
    }
    s += `<path d="${gr}" stroke="${K('#7A5233')}" stroke-width="2" fill="none" opacity=".4"/>`;
    s += R(DX0 + 60, DTOP + 50, DX1 - DX0 - 120, DBOT - DTOP - 100, U('panel'), 'rx="4"');
    s += R(DX0 + 84, DTOP + 74, DX1 - DX0 - 168, DBOT - DTOP - 148, 'none', `stroke="${K('#C9A45C')}" stroke-width="2.5" rx="3"`);
    s += R(DX0 + 60, DTOP + 50, DX1 - DX0 - 120, 8, K('#6E4A2E'), 'opacity=".6"');
    // fluted wood pilasters at the ends
    for (const xa of [DX0, DX1 - 60]) {
      s += R(xa, DTOP + 20, 60, DBOT - DTOP - 20, K('#8C5F3B'));
      let f = '';
      for (let x = xa + 8; x < xa + 56; x += 12) f += `M${x} ${DTOP + 28}h6V${DBOT - 34}h-6Z`;
      s += `<path d="${f}" fill="${K('#A87A4F')}"/>`;
    }
    s += R(DX0 + 6, DBOT - 30, DX1 - DX0 - 12, 30, K('#4E331F'));
    // top
    s += `<path d="M${n(bx0)} ${DBACK}H${n(bx1)}L${DX1} ${DTOP}H${DX0}Z" fill="${K('#A87A4F')}"/>`;
    s += `<path d="M${n(bx0)} ${DBACK}H${n(bx1)}L${n(bx1 + (DX1 - bx1) * 0.3)} ${n(DBACK + 10)}H${n(bx0 + (DX0 - bx0) * 0.3)}Z" fill="${K('#8C5F3B')}" opacity=".5"/>`;
    // leather desk mat
    s += `<path d="M1290 856H1660L1666 874H1284Z" fill="${K('#1F2A44')}" opacity=".85"/>`;
    s += R(DX0 - 10, DTOP, DX1 - DX0 + 20, 26, K('#9A6B43'), 'rx="5"') + R(DX0 - 10, DTOP, DX1 - DX0 + 20, 7, K('#C79A6C'), 'rx="4"') + R(DX0 - 10, DTOP + 21, DX1 - DX0 + 20, 5, K('#5E3F27'), 'opacity=".7"');
    s += R(DX0 + 10, DTOP + 26, DX1 - DX0 - 20, 24, U('ao'));
    // window light falling across the desk front (day)
    if (!night) s += `<path d="M${DX0 + 60} ${DTOP + 50}h160l-120 ${DBOT - DTOP - 100}h-40Z" fill="#FFF6E0" opacity=".18"/>`;
    return s;
  }

  const SCR = [1170, 718, 172, 106];
  function deskProps(K, night) {
    let s = '';
    // laptop, turned to the visitor
    const [sx, sy, sw, sh] = SCR;
    s += E(sx + sw / 2, 872, 130, 7, DARK, 'opacity=".28"');
    s += R(sx - 10, sy - 10, sw + 20, sh + 22, K('#2B303B'), 'rx="7"');
    s += R(sx - 10, sy + sh + 6, sw + 20, 6, K('#3B4250'));
    s += R(sx, sy, sw, sh, night ? '#EEF3F9' : '#F5F7FA');
    // report on screen: header, bars, table
    s += R(sx, sy, sw, 13, '#1F2A44') + R(sx + 5, sy + 4, 30, 5, '#C8161E');
    const bars = [38, 56, 44, 70, 62];
    for (let i = 0; i < 5; i++) s += R(sx + 12 + i * 15, sy + 86 - bars[i] * 0.8, 10, bars[i] * 0.8, i === 3 ? '#1E9E62' : '#9FC8E8');
    for (let i = 0; i < 5; i++) s += R(sx + 100, sy + 24 + i * 13, 34, 4, '#6B7686') + R(sx + 140, sy + 24 + i * 13, 24, 4, i === 2 ? '#E36F5C' : '#AEB6C2');
    s += R(sx + 100, sy + sh - 18, 62, 11, '#1E9E62', 'rx="2"');
    s += `<path d="M${sx} ${sy}h52l-36 ${sh}h-16Z" fill="#FFFFFF" opacity=".16"/>`;
    if (night) s += E(sx + sw / 2, sy + sh / 2, sw * 0.9, sh * 0.9, U('screenglow'));
    // laptop base (keyboard deck seen from above)
    s += `<path d="M${sx - 12} ${sy + sh + 12}h${sw + 24}l14 22h${-sw - 52}Z" fill="${K('#C9CDD3')}"/>`;
    s += `<path d="M${sx + 4} ${sy + sh + 15}h${sw - 8}l6 10h${-sw - 20}Z" fill="${K('#3B4250')}"/>`;
    s += R(sx + sw / 2 - 22, sy + sh + 27, 44, 5, K('#AEB6C2'), 'rx="2"');
    s += R(sx - 26, sy + sh + 34, sw + 52, 3, K('#9AA3AE'));
    // coffee mug
    s += `<path d="M1388 868v-32h30v32q0 6 -6 6h-18q-6 0 -6 -6Z" fill="${K('#FBF8F1')}"/>` + `<path d="M1418 844q12 0 12 10t-12 10" stroke="${K('#FBF8F1')}" stroke-width="5" fill="none"/>` + R(1388, 846, 30, 6, K('#1E9E62'));
    if (night) s += `<path d="M1398 830q-6 -14 2 -26M1408 828q-6 -14 2 -24" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".25"/>`;
    // name plate "CA"
    s += E(1505, 879, 72, 4, DARK, 'opacity=".3"');
    s += `<path d="M1438 878l8 -34h118l8 34Z" fill="${K('#5E3F27')}"/>`;
    s += `<path d="M1450 872l6 -24h98l6 24Z" fill="${U('brass')}"/>`;
    s += T(1505, 869, 21, K('#1F2A44'), 'CA', 'font-weight="600" text-anchor="middle" letter-spacing="2"');
    // stacked client files
    const files = [['#7A2E2E', 'AUDIT 25-26'], ['#1F2A44', 'GST RETURNS'], ['#2F5F6B', 'ITR - CLIENTS'], ['#E7B04A', 'TDS']];
    let fy = 870;
    for (let i = 0; i < files.length; i++) {
      const h = 15, w = 128 - i * 4, x = 1592 + i * 3 + (i % 2) * 4;
      fy -= h;
      s += R(x, fy + 3, w, h - 3, K('#F4EFE2')) + R(x - 2, fy, w + 4, 5, K(files[i][0])) + R(x - 2, fy + h - 3, w + 4, 3, K(files[i][0]));
      s += R(x - 2, fy, 30, h, K(files[i][0])) + fitText(x + 13, fy + h - 4, 7, K('#FFFFFF'), files[i][1].split(' ')[0], 26, 'middle', 600);
    }
    s += R(1630, fy - 20, 40, 22, K('#FBF8F1')) + `<path d="M1634 ${fy - 14}h30M1634 ${fy - 8}h22" stroke="${K('#AEB6C2')}" stroke-width="2"/>`;
    // pen stand
    s += R(1730, 836, 26, 36, K('#2B303B'), 'rx="3"') + `<path d="M1736 836l-6 -34M1744 836l2 -38M1750 836l8 -30" stroke="${K('#1F2A44')}" stroke-width="3.5" stroke-linecap="round"/>` + C(1746, 798, 3, K('#C8161E'));
    // tax-law book stack, spines to camera
    const books = [['#1F2A44', 'INCOME TAX ACT', 30], ['#7A2E2E', 'GST LAW MANUAL', 26], ['#2F5F6B', 'COMPANIES ACT', 24], ['#4A3A5C', 'TAX AUDIT GUIDE', 20]];
    let by = 872;
    for (let i = 0; i < books.length; i++) {
      const [c, t, h] = books[i];
      const w = 128 - i * 6, x = 1770 + (i % 2 ? 6 : -2);
      by -= h;
      s += R(x + 4, by + 2, w - 4, h - 3, K('#F1EADB')) + R(x, by, w, h, K(c), 'rx="2"');
      s += R(x + 2, by + 2, w - 4, 1.5, K('#FFFFFF'), 'opacity=".25"');
      s += R(x + 8, by + 3, 3, h - 6, K('#C9A45C')) + R(x + w - 11, by + 3, 3, h - 6, K('#C9A45C'));
      s += fitText(x + w / 2, by + h / 2 + 3.5, Math.min(10, h * 0.42), K('#E8CF8E'), t, w - 34, 'middle', 600);
    }
    // green banker's lamp on top of the book stack
    const lx = 1835, ly = by;
    s += E(lx, ly - 2, 26, 5, K('#9C7A3A')) + R(lx - 3, ly - 66, 6, 64, K('#C9A45C'));
    s += `<path d="M${lx - 3} ${ly - 66}q0 -10 10 -10h8" stroke="${K('#C9A45C')}" stroke-width="5" fill="none"/>`;
    s += `<path d="M${lx - 62} ${ly - 54}q4 -30 62 -30q58 0 62 30Z" fill="${K('#1E6B4A')}"/>` + `<path d="M${lx - 52} ${ly - 74}q30 -10 62 -6" stroke="#FFFFFF" stroke-width="3" opacity=".35" fill="none"/>`;
    s += R(lx - 62, ly - 56, 124, 5, K('#C9A45C'), 'rx="2"');
    if (night) {
      s += E(lx, ly - 48, 52, 6, '#FFF1C8', 'opacity=".95"');
      s += `<path d="M${lx - 58} ${ly - 50}H${lx + 58}L${lx + 150} ${ly + 30}H${lx - 150}Z" fill="${U('lampcone')}"/>`;
      s += E(lx - 60, 880, 300, 46, U('lamppool'));
    }
    // small succulent
    s += `<path d="M1688 874l-4 -24h28l-4 24Z" fill="${K('#F4F1EA')}"/>` + `<path d="M1698 850q-12 -14 -18 -4q8 2 18 4q2 -18 8 -20q2 10 -8 20q12 -10 16 -2q-6 4 -16 2Z" fill="${K('#7BC18E')}"/>`;
    return s;
  }

  // visitor chair at the near-left corner of the desk, turned towards the desk
  function visitorChair(K) {
    let s = '';
    const x = 1000, fy = 1262;
    s += E(x + 40, fy + 2, 120, 14, DARK, 'opacity=".25"');
    // legs (chrome sled base)
    s += `<path d="M${x - 50} ${fy}l14 -170M${x + 120} ${fy}l-10 -170M${x - 50} ${fy}h44M${x + 76} ${fy}h44" stroke="${K('#AEB6C2')}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
    // seat
    s += `<path d="M${x - 70} ${fy - 190}q-4 -38 30 -40h150q34 2 30 40q-2 14 -16 14h-178q-14 0 -16 -14Z" fill="${K('#2B3A55')}"/>`;
    s += `<path d="M${x - 66} ${fy - 200}q0 -24 26 -26h150q26 2 26 26Z" fill="${K('#3B4E70')}"/>`;
    // backrest (seen from behind, slightly turned)
    s += `<path d="M${x - 48} ${fy - 214}l-18 -190q-2 -34 34 -36h136q34 2 32 36l-14 190Z" fill="${K('#1F2A44')}"/>`;
    s += `<path d="M${x - 36} ${fy - 222}l-16 -178q0 -20 20 -22h20l8 200Z" fill="${K('#2B3A55')}"/>`;
    s += R(x - 24, fy - 260, 140, 6, K('#2B3A55'), 'rx="3"');
    return s;
  }

  // CA's executive chair (mid layer, behind the desk)
  function execChair(K) {
    // dark cognac leather, so a navy blazer separates from it
    let s = '';
    const x = 1500, top = 600;
    s += `<path d="M${x - 112} 880V${top + 60}q0 -66 66 -70h92q66 4 66 70V880Z" fill="${K('#4A2C1D')}"/>`;
    s += `<path d="M${x - 92} 880V${top + 66}q0 -50 52 -52h80q52 2 52 52V880Z" fill="${K('#6B3F2A')}"/>`;
    s += `<path d="M${x - 84} ${top + 70}q0 -40 44 -42h30q-50 10 -60 60Z" fill="${K('#8A5638')}" opacity=".8"/>`;
    let q = '';
    for (let y = top + 40; y < 880; y += 46) q += `M${x - 90} ${y}h180`;
    s += `<path d="${q}" stroke="${K('#4A2C1D')}" stroke-width="3"/>`;
    let b = '';
    for (let y = top + 63; y < 880; y += 46) for (let xx = x - 70; xx <= x + 70; xx += 35) b += `M${xx} ${y}a2.5 2.5 0 1 0 .1 0Z`;
    s += `<path d="${b}" fill="${K('#C9A45C')}" opacity=".7"/>`;
    s += R(x - 128, 790, 26, 90, K('#2B303B'), 'rx="8"') + R(x + 102, 790, 26, 90, K('#2B303B'), 'rx="8"');
    return s;
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      ca_desk: { x: 1500, zone: 'behind' },
      visitor: { x: 800, zone: 'front' }
    },
    screenRect: SCR.slice(),
    draw(opts) {
      opts = opts || {};
      const night = opts.time === 'night';
      const K = night ? nightify : (c => c);
      LAYER = '';
      const wx0 = BX(WX0), wx1 = BX(WX1), wy0 = BY(WH1), wy1 = BY(WH0);

      const defs = `<defs>
<linearGradient id="${P('bwall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#EDE3D2')}"/><stop offset=".4" stop-color="${K('#F3EBDD')}"/><stop offset="1" stop-color="${K('#EADFCB')}"/></linearGradient>
<linearGradient id="${P('lwall')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K('#D9CAB0')}"/><stop offset="1" stop-color="${K('#E7DAC4')}"/></linearGradient>
<linearGradient id="${P('rwall')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K('#E6D9C3')}"/><stop offset="1" stop-color="${K('#D6C6AA')}"/></linearGradient>
<linearGradient id="${P('floor')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#D8C8AC')}"/><stop offset="1" stop-color="${K('#E6D9C2')}"/></linearGradient>
<linearGradient id="${P('sky')}" x1="0" y1="0" x2="0" y2="1">${night ? '<stop offset="0" stop-color="#0B1326"/><stop offset=".7" stop-color="#1C2A4A"/><stop offset="1" stop-color="#34405E"/>' : '<stop offset="0" stop-color="#9CC6E6"/><stop offset=".65" stop-color="#D6E8F1"/><stop offset="1" stop-color="#F6EEDC"/>'}</linearGradient>
<linearGradient id="${P('blind')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
<linearGradient id="${P('cove')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#FFD9A0' : '#FFFFFF'}" stop-opacity="${night ? 0.45 : 0.2}"/><stop offset="1" stop-color="${night ? '#FFD9A0' : '#FFFFFF'}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('panel')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DARK}" stop-opacity=".12"/><stop offset=".3" stop-color="${DARK}" stop-opacity="0"/><stop offset="1" stop-color="${DARK}" stop-opacity=".1"/></linearGradient>
<linearGradient id="${P('ao')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DARK}" stop-opacity=".35"/><stop offset="1" stop-color="${DARK}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('brass')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#F1D892')}"/><stop offset=".55" stop-color="${K('#C9A45C')}"/><stop offset="1" stop-color="${K('#A7843F')}"/></linearGradient>
<linearGradient id="${P('beam')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".4"/><stop offset="1" stop-color="#FFF4D8" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('lampcone')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE2A8" stop-opacity=".45"/><stop offset="1" stop-color="#FFE2A8" stop-opacity="0"/></linearGradient>
<radialGradient id="${P('lamppool')}"><stop offset="0" stop-color="#FFD28A" stop-opacity=".45"/><stop offset="1" stop-color="#FFD28A" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('screenglow')}"><stop offset="0" stop-color="#CFE6FF" stop-opacity=".25"/><stop offset="1" stop-color="#CFE6FF" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('winglow')}"><stop offset="0" stop-color="${night ? '#5A78B0' : '#FFFBF0'}" stop-opacity="${night ? 0.25 : 0.55}"/><stop offset="1" stop-color="${night ? '#5A78B0' : '#FFFBF0'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('warm')}"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".3"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('vig')}" cx=".5" cy=".45" r=".78"><stop offset=".55" stop-color="${night ? '#070C18' : '#1A120C'}" stop-opacity="0"/><stop offset="1" stop-color="${night ? '#070C18' : '#1A120C'}" stop-opacity="${night ? 0.6 : 0.22}"/></radialGradient>
<clipPath id="${P('winclip')}"><rect x="${n(wx0)}" y="${n(wy0)}" width="${n(wx1 - wx0)}" height="${n(wy1 - wy0)}"/></clipPath>
<filter id="${P('edge')}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
<radialGradient id="${P('nightfall')}" gradientUnits="userSpaceOnUse" cx="1400" cy="640" r="1300"><stop offset=".2" stop-color="#060A16" stop-opacity="0"/><stop offset=".7" stop-color="#060A16" stop-opacity=".22"/><stop offset="1" stop-color="#060A16" stop-opacity=".45"/></radialGradient>
<filter id="${P('glow')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="${P('sblur')}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="${P('soft')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
</defs>`;
      // split the shared defs into a lookup so each layer can embed just what it references
      const lib = {};
      for (const line of defs.split('\n')) { const m = line.match(/ id="([A-Za-z0-9_]+)"/); if (m && m[1].indexOf(ID + '_') === 0) lib[m[1].slice(ID.length + 1)] = line; }
      const withDefs = (prefix, body) => {
        const used = new Set(), re = new RegExp('url\\(#' + ID + '_' + prefix + '([A-Za-z0-9]+)\\)', 'g');
        let m; while ((m = re.exec(body))) used.add(m[1]);
        let d = '';
        for (const k of used) if (lib[k]) d += lib[k].replace(' id="' + P(k) + '"', ' id="' + P(prefix + k) + '"');
        return (d ? '<defs>' + d + '</defs>' : '') + body;
      };

      // ----- back -----
      let back = '' + R(0, 0, 2400, 1350, K('#E7DAC4'));
      back += shell(K, night);
      back += rug(K);
      // sunlight patch on the floor below the window + floor reflection of the window
      if (!night) {
        back += quad([[WX0 + 40, 1, ZB - 10], [WX1 - 20, 1, ZB - 10], [WX1 + 160, 1, ZB - 700], [WX0 + 220, 1, ZB - 700]], '#FFF2D2', `opacity=".45" filter="${U('soft')}"`);
      }
      if (!night) {
        // sunlight through the window panes lands on the floor and rug
        const sun = (X, H) => [X - H * 0.42, 1, ZB - H * 1.05];
        const panes = [[WX0 + 14, -185, 400, 980], [-165, WX1 - 14, 400, 980]];
        let sp = '';
        for (const [a0, a1, h0, h1] of panes) sp += `M${[sun(a0, h0), sun(a1, h0), sun(a1, h1), sun(a0, h1)].map(q => pt(q[0], q[1], q[2])).join('L')}Z`;
        back += `<path d="${sp}" fill="#FFEFC8" opacity=".5" filter="${U('edge')}"/>`;
        back += `<path d="${sp}" fill="#FFFFFF" opacity=".12"/>`;
      }
      back += R(wx0 + 20, BY(0) + 4, wx1 - wx0 - 40, 120, night ? '#7A92C8' : '#FFFFFF', `opacity="${night ? 0.12 : 0.22}" filter="${U('soft')}"`);
      back += door(K, night);
      back += rightWallProps(K, night);
      back += accentWall(K, night);
      back += windowBlock(K, night);
      back += E((wx0 + wx1) / 2, (wy0 + wy1) / 2, 520, 420, U('winglow'));
      back += figTree(K, -1060, 2800);
      back += credenza(K, night);
      back += bookshelf(K, night);
      // soft beam of window light through the room (day)
      if (!night) back += `<path d="M${n(wx0 + 20)} ${n(wy0 + 80)}H${n(wx1 - 40)}L${n(wx1 + 220)} 1250H${n(wx0 + 140)}Z" fill="${U('beam')}" opacity=".55" filter="${U('soft')}"/>`;
      else back += `<ellipse cx="1830" cy="900" rx="520" ry="300" fill="${U('warm')}"/>`;
      if (night) back += R(0, 0, 2400, 1350, U('nightfall'));
      back += R(0, 0, 2400, 1350, U('vig'));

      // ----- mid -----
      LAYER = 'm_';
      let mid = execChair(K) + snakePlant(K, 1150, 2150);

      // ----- front -----
      LAYER = 'f_';
      let front = desk(K, night) + deskProps(K, night) + visitorChair(K);

      // ----- fore ----- (blurred by the engine) a large leaf at the bottom-left corner
      LAYER = 'o_';
      let fore = `<path d="M-30 1350C40 1180 150 1120 260 1100C210 1180 130 1260 70 1350Z" fill="${K('#3F7A52')}"/><path d="M-30 1350C60 1230 120 1180 200 1150" stroke="${K('#2F5F3E')}" stroke-width="5" fill="none"/>`;
      fore += `<path d="M2430 1350C2380 1220 2300 1170 2200 1160C2250 1230 2320 1290 2350 1350Z" fill="${K('#4F8A5B')}"/>`;
      LAYER = '';
      return { back: withDefs('', back), mid: withDefs('m_', mid), front: withDefs('f_', front), fore: withDefs('o_', fore) };
    }
  };
})();
