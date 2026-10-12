// home — a warm Indian middle-class living room, front view.
// World 2400x1350, floor line y=1250 (character plane, s=1).
// One-point perspective: eye height 660 units, vanishing point (950, 590).
// A point (X lateral, H height above floor, Z depth) projects with s = D/Z.
// Sofa against the back wall, tea table on a dhurrie in front of it, window with
// curtains on the left, doorway to the kitchen on the right, TV wall on the right wall.
window.SETS = window.SETS || {};
(function () {
  const ID = 'home';
  let LAYER = '';                      // every layer <svg> carries its own defs
  const P = s => ID + '_' + LAYER + s;
  const U = s => 'url(#' + P(s) + ')';
  const D = 1800, VPX = 950, VPY = 590, EYE = 660;
  const n = v => Math.round(v * 10) / 10;
  const SC = Z => D / Z;
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
  const DARK = '#2A1C14';
  const shade = (c, t) => mix(c, DARK, t);
  const tint = (c, t) => mix(c, '#FFFFFF', t);

  // ---------- lighting state ----------
  let night = false, rain = false;
  function nightify(c) { const [r, g, b] = hx(c); return toHex([r * 0.39 + 6, g * 0.41 + 10, b * 0.49 + 28]); }
  function warmLit(c) { const [r, g, b] = hx(c); return toHex([r * 0.9 + 20, g * 0.76 + 12, b * 0.56 + 6]); }
  // practical lights at night (screen x, y, radius, strength)
  const LIGHTS = [[722, 600, 400, 0.85], [1543, 740, 300, 0.75], [1745, 760, 230, 0.4]];
  function lf(x, y) { let f = 0; for (const [lx, ly, r, a] of LIGHTS) f += a * Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (r * r)); return Math.min(0.9, f); }
  // colour for an object; (x, y) = its screen position so lamps can warm it at night
  function K(c, x, y) {
    if (!night) return c;
    const nc = nightify(c);
    if (x === undefined) return nc;
    const f = lf(x, y);
    return f < 0.02 ? nc : mix(nc, warmLit(c), f * 0.85);
  }
  // inner room (kitchen) seen through the doorway: lit warm at night
  const KI = c => night ? mix(shade(c, 0.12), '#FFC27A', 0.22) : shade(c, 0.06);

  // ---------- primitives ----------
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(Math.max(0.3, ry))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const PA = (d, f, ex) => `<path d="${d}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const ST = (d, col, w, ex) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"${ex ? ' ' + ex : ''}/>`;
  const quad = (pts, f, ex) => `<path d="M${pts.map(p => pt(p[0], p[1], p[2])).join('L')}Z" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const rnd = (f, w) => `stroke="${f}" stroke-width="${w}" stroke-linejoin="round"`;
  const T = (x, y, size, fill, txt, ex) => `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" fill="${fill}"${ex ? ' ' + ex : ''}>${txt}</text>`;
  // box: faces visible from the camera; c = {t: top, f: front, s: side, b: bottom}; r = soft corner
  function box(x0, x1, h0, h1, z0, z1, c, r) {
    let s = '';
    const ex = f => r ? rnd(f, r) : '';
    if (h1 < EYE && c.t) s += quad([[x0, h1, z0], [x1, h1, z0], [x1, h1, z1], [x0, h1, z1]], c.t, ex(c.t));
    if (h0 > EYE && c.b) s += quad([[x0, h0, z0], [x1, h0, z0], [x1, h0, z1], [x0, h0, z1]], c.b, ex(c.b));
    if (x0 > 0 && c.s) s += quad([[x0, h0, z0], [x0, h1, z0], [x0, h1, z1], [x0, h0, z1]], c.s, ex(c.s));
    if (x1 < 0 && c.s) s += quad([[x1, h0, z0], [x1, h1, z0], [x1, h1, z1], [x1, h0, z1]], c.s, ex(c.s));
    if (c.f) s += quad([[x0, h0, z0], [x1, h0, z0], [x1, h1, z0], [x0, h1, z0]], c.f, ex(c.f));
    return s;
  }
  // camera-facing rectangle at depth Z
  function RZ(X0, X1, H0, H1, Z, f, rx, ex) {
    const s = SC(Z);
    return R(SX(X0, Z), SY(H1, Z), (X1 - X0) * s, (H1 - H0) * s, f, (rx ? `rx="${n(rx * s)}"` : '') + (ex ? ' ' + ex : ''));
  }
  // plane on a side wall (constant X)
  const sq = (X, z0, z1, h0, h1, f, ex) => quad([[X, h0, z0], [X, h1, z0], [X, h1, z1], [X, h0, z1]], f, ex);
  // ellipse lying flat at height H
  function flatE(X, H, Z, r, f, ex) {
    const y0 = SY(H, Z - r), y1 = SY(H, Z + r);
    return E(SX(X, Z), (y0 + y1) / 2, r * SC(Z), Math.abs(y0 - y1) / 2, f, ex);
  }
  // vertical cylinder
  function cyl(X, Z, r, h0, h1, side, cap, ex) {
    const s = SC(Z), x = SX(X, Z), rx = r * s;
    const ry0 = Math.abs(SY(h0, Z - r) - SY(h0, Z + r)) / 2, ry1 = Math.abs(SY(h1, Z - r) - SY(h1, Z + r)) / 2;
    const y0 = SY(h0, Z), y1 = SY(h1, Z);
    let o = E(x, y0, rx, ry0, side, ex) + R(x - rx, y1, 2 * rx, y0 - y1, side, ex);
    if (h1 < EYE) o += E(x, y1, rx, ry1, cap, ex);
    else o += E(x, y0, rx, ry0, cap, ex);
    return o;
  }

  // ---------- room ----------
  const ZB = 2700;                 // back wall (s = 0.667)
  const XL = -1500, XR = 1480;     // left wall off-frame, right wall = TV wall
  const HC = 1340;                 // ceiling (3 m)
  const WALL = '#F3EBDD', WALL_R = '#EADCC5', ACCENT = '#E3C7A4';
  const BX = X => SX(X, ZB), BY = H => SY(H, ZB);

  function defs() {
    const lg = (id, stops, at) => `<linearGradient id="${P(id)}" ${at || 'x1="0" y1="0" x2="0" y2="1"'}>${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
    const rg = (id, stops, at) => `<radialGradient id="${P(id)}" ${at || ''}>${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;
    const sky = night ? [[0, '#0A1430'], [0.55, '#172A52'], [1, '#2B4374']]
      : rain ? [[0, '#8692A3'], [0.6, '#A9B3C0'], [1, '#C7CDD4']]
        : [[0, '#94C4E6'], [0.6, '#C8E1F0'], [1, '#EEF2E6']];
    const fl = night ? [[0, '#5A5A66'], [1, '#6E6A70']] : [[0, '#D7C9B2'], [1, '#EADFCD']];
    const vig = night ? '#060A16' : '#1A120C';
    return `<defs>
${lg('sky', sky)}
${lg('floor', fl)}
${lg('wallV', [[0, DARK, 0.18], [0.1, DARK, 0.03], [0.8, DARK, 0], [1, DARK, 0.12]])}
${lg('aoR', [[0, DARK, 0], [1, DARK, night ? 0.3 : 0.2]], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('aoL', [[0, DARK, night ? 0.3 : 0.18], [1, DARK, 0]], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('aoB', [[0, DARK, 0], [1, DARK, night ? 0.3 : 0.2]])}
${lg('aoT', [[0, DARK, 0.25], [1, DARK, 0]])}
${lg('glass', [[0, '#FFFFFF', 0], [0.45, '#FFFFFF', night ? 0.06 : 0.22], [0.55, '#FFFFFF', night ? 0.03 : 0.1], [1, '#FFFFFF', 0]], 'x1="0" y1="0" x2="1" y2="1"')}
${lg('beam', [[0, '#FFF3D2', 0.5], [1, '#FFF3D2', 0]])}
${lg('tv', [[0, '#3A4458'], [0.5, '#1B2130'], [1, '#10141D']], 'x1="0" y1="0" x2="1" y2="1"')}
${lg('tvref', [[0, '#FFFFFF', 0], [0.48, '#FFFFFF', night ? 0.05 : 0.14], [0.52, '#FFFFFF', 0]], 'x1="0" y1="0" x2="1" y2="1"')}
${lg('shadeOn', [[0, '#FFF7E2'], [0.6, '#FFE1A6'], [1, '#FFC97A']])}
${lg('coneUp', [[0, '#FFD08A', 0], [1, '#FFD08A', 0.42]])}
${lg('coneDn', [[0, '#FFD08A', 0.36], [1, '#FFD08A', 0]])}
${lg('photo', [[0, '#C9D3DA'], [1, '#93A6B6']])}
${lg('fridge', [[0, '#9A4646'], [1, '#7A3434']], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('led', [[0, '#FFD08A', 0.85], [1, '#FFD08A', 0]])}
${rg('warm', [[0, '#FFC777', 0.6], [0.22, '#FFB25E', 0.3], [0.6, '#FF9C48', 0.08], [1, '#FF9C48', 0]])}
${rg('pool', [[0, '#FFC983', 0.6], [1, '#FFC983', 0]])}
${rg('cool', [[0, '#7F9CD6', 0.22], [1, '#7F9CD6', 0]])}
${rg('sun', [[0, '#FFF6DE', 0.55], [1, '#FFF6DE', 0]])}
${rg('vig', [[0.55, vig, 0], [1, vig, night ? 0.62 : 0.24]], 'cx=".5" cy=".46" r=".78"')}
<clipPath id="${P('win')}"><rect x="${n(BX(-1170))}" y="${n(BY(1180))}" width="${n(BX(-530) - BX(-1170))}" height="${n(BY(380) - BY(1180))}"/></clipPath>
<clipPath id="${P('door')}"><rect x="${n(BX(1020))}" y="${n(BY(960))}" width="${n(BX(1360) - BX(1020))}" height="${n(BY(0) - BY(960) + 2)}"/></clipPath>
<clipPath id="${P('acc')}"><rect x="${n(BX(-380))}" y="${n(BY(HC) + 30)}" width="${n(BX(820) - BX(-380))}" height="${n(BY(70) - BY(HC) - 30)}"/></clipPath>
<clipPath id="${P('ph')}"><rect x="${n(BX(72))}" y="${n(BY(948))}" width="${n(BX(418) - BX(72))}" height="${n(BY(682) - BY(948))}"/></clipPath>
<filter id="${P('soft')}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="${P('b6')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${P('b3')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;
  }

  // ---------- walls, ceiling, floor ----------
  function shell() {
    let s = '';
    const bx0 = BX(XL), bx1 = BX(XR), by0 = BY(HC), by1 = BY(0);
    s += R(0, 0, 2400, 1350, K('#E9DCC6'));
    // ceiling
    s += quad([[XL, HC, ZB], [XR, HC, ZB], [XR, HC, 1200], [XL, HC, 1200]], night ? K(shade('#F6F1E8', 0.28)) : '#F6F1E8');
    // back wall + textured accent panel behind the sofa
    s += R(bx0, by0, bx1 - bx0, by1 - by0, K(WALL, 1100, 500));
    const ax0 = BX(-380), ax1 = BX(820);
    s += R(ax0, by0, ax1 - ax0, by1 - by0, K(ACCENT, 1000, 600));
    // stencil motif (small four-petal flowers) on the accent wall
    // jaali-style ogee lattice
    let m = '', dm = '';
    const sw = 64, shh = 92;
    for (let row = 0, y = by0 + 30; y < by1 - 60; y += shh, row++) {
      for (let x = ax0 + (row % 2 ? sw / 2 : 0); x < ax1 + sw; x += sw) {
        m += `M${n(x)} ${n(y)}C${n(x + sw * 0.5)} ${n(y + shh * 0.2)} ${n(x + sw * 0.5)} ${n(y + shh * 0.8)} ${n(x)} ${n(y + shh)}`;
        m += `M${n(x)} ${n(y)}C${n(x - sw * 0.5)} ${n(y + shh * 0.2)} ${n(x - sw * 0.5)} ${n(y + shh * 0.8)} ${n(x)} ${n(y + shh)}`;
        dm += `M${n(x)} ${n(y + shh / 2 - 7)}L${n(x + 5)} ${n(y + shh / 2)}L${n(x)} ${n(y + shh / 2 + 7)}L${n(x - 5)} ${n(y + shh / 2)}Z`;
      }
    }
    s += `<g clip-path="url(#${P('acc')})">` + ST(m, K(shade(ACCENT, 0.16), 1000, 600), 2.2, 'opacity=".55"') + PA(dm, K(shade(ACCENT, 0.2), 1000, 600), 'opacity=".5"') + '</g>';
    // thin wooden trims framing the accent panel
    s += R(ax0 - 5, by0, 7, by1 - by0, K('#B9875A', ax0, 600)) + R(ax1 - 2, by0, 7, by1 - by0, K('#B9875A', ax1, 600));
    // right (TV) wall
    s += quad([[XR, -5, ZB], [XR, HC, ZB], [XR, HC, 1200], [XR, -5, 1200]], K(WALL_R, 2150, 700));
    // floor + vitrified tiles (60 cm)
    s += quad([[XL, 0, ZB], [XR, 0, ZB], [XR, 0, 1200], [XL, 0, 1200]], U('floor'));
    const rng = mulberry32(77);
    const TS = 268;
    let tl = '';
    for (let Z = ZB; Z > 1250; Z -= TS) {
      for (let X = XL; X < XR; X += TS) {
        const v = rng();
        if (v < 0.45) continue;
        const x1 = Math.min(XR, X + TS), z1 = Math.max(1250, Z - TS);
        tl += `M${pt(X, 0, Z)}L${pt(x1, 0, Z)}L${pt(x1, 0, z1)}L${pt(X, 0, z1)}Z`;
      }
    }
    s += PA(tl, '#FFFFFF', `opacity="${night ? 0.03 : 0.1}"`);
    let g = '';
    for (let X = XL; X <= XR; X += TS) g += `M${pt(X, 0, ZB)}L${pt(X, 0, 1250)}`;
    for (let Z = ZB; Z > 1250; Z -= TS) g += `M${pt(XL, 0, Z)}L${pt(XR, 0, Z)}`;
    s += ST(g, K('#BFAF96'), 2, 'opacity=".7"');
    // faint marble veins
    let vn = '';
    for (let i = 0; i < 14; i++) {
      const X = XL + rng() * (XR - XL), Z = 1500 + rng() * 1150, L = 150 + rng() * 200;
      vn += `M${pt(X, 0, Z)}Q${pt(X + L * 0.5, 0, Z - 60 + rng() * 120)} ${pt(X + L, 0, Z + (rng() - 0.5) * 140)}`;
    }
    s += ST(vn, K('#BBA98E'), 1.6, 'opacity=".35"');
    // skirting (tile skirting, as in most Indian homes)
    s += R(bx0, BY(70), bx1 - bx0, by1 - BY(70), K('#DCCDB5', 1000, 1000));
    s += R(bx0, BY(70), bx1 - bx0, 2.5, K('#C2B094'));
    s += quad([[XR, 0, ZB], [XR, 70, ZB], [XR, 70, 1200], [XR, 0, 1200]], K('#D3C3A9', 2200, 1100));
    // cornice
    s += R(bx0, by0, bx1 - bx0, 26, K('#F8F3EA')) + R(bx0, by0 + 26, bx1 - bx0, 4, K('#D9CCB6'));
    s += quad([[XR, HC, ZB], [XR, HC - 39, ZB], [XR, HC - 39, 1200], [XR, HC, 1200]], K('#F1E9DC'));
    // ambient occlusion: ceiling/floor junctions and the back-right corner
    s += R(bx0, by0, bx1 - bx0, by1 - by0, U('wallV'));
    s += R(bx1 - 70, by0, 70, by1 - by0, U('aoR'));
    s += quad([[XR, 0, ZB], [XR, HC, ZB], [XR, HC, 2450], [XR, 0, 2450]], U('aoL'));
    s += R(bx0, by1 - 26, bx1 - bx0, 26, U('aoB'));
    // back-wall / floor seam
    s += R(bx0, by1 - 1, bx1 - bx0, 3, K('#A8977E'), 'opacity=".6"');
    return s;
  }

  // ---------- window with a neighbourhood view ----------
  const WX0 = -1170, WX1 = -530, WH0 = 380, WH1 = 1180, ZW = ZB + 80;
  function outside() {
    const x0 = BX(WX0), x1 = BX(WX1), y0 = BY(WH1), y1 = BY(WH0), w = x1 - x0, h = y1 - y0;
    const rng = mulberry32(night ? 515 : 414);
    let s = R(x0, y0, w, h, U('sky'));
    if (night) {
      let st = '';
      for (let i = 0; i < 22; i++) st += `<circle cx="${n(x0 + rng() * w)}" cy="${n(y0 + rng() * h * 0.45)}" r="${n(0.8 + rng() * 1.3)}"/>`;
      if (!rain) s += `<g fill="#FFFFFF" opacity=".7">${st}</g>`;
      if (!rain) s += C(x0 + w * 0.24, y0 + h * 0.17, 40, '#DCE6FF', 'opacity=".12"') + C(x0 + w * 0.24, y0 + h * 0.17, 17, '#F4EFD8');
    } else if (!rain) {
      s += E(x0 + w * 0.3, y0 + h * 0.16, 64, 13, '#FFFFFF', 'opacity=".85"') + E(x0 + w * 0.38, y0 + h * 0.13, 38, 13, '#FFFFFF', 'opacity=".85"');
      s += E(x0 + w * 0.82, y0 + h * 0.3, 54, 10, '#FFFFFF', 'opacity=".7"');
    }
    // far skyline
    let fb = '';
    let x = x0 - 10;
    while (x < x1) { const bw = 26 + rng() * 44, bh = 70 + rng() * 90; fb += `M${n(x)} ${n(y0 + h * 0.6)}V${n(y0 + h * 0.6 - bh)}H${n(x + bw)}V${n(y0 + h * 0.6)}Z`; x += bw + 3; }
    s += PA(fb, night ? '#1C2848' : rain ? '#9AA4B2' : '#B9CCD8');
    // neighbour's building (peach plaster, sunshades, black water tank)
    const bx = x0 + w * 0.38, by = y0 + h * 0.36;
    const wallc = night ? '#222D4A' : rain ? '#B7A28A' : '#E8CBA6', wallS = night ? '#1A2440' : rain ? '#A08C76' : '#D2AF88';
    s += R(bx, by, x1 - bx + 10, y1 - by, wallc);
    s += R(bx, by - 14, x1 - bx + 10, 14, wallS);
    s += R(bx + 30, by - 64, 46, 50, night ? '#11182B' : '#2B2F36', 'rx="8"') + R(bx + 30, by - 60, 46, 6, night ? '#1A2238' : '#454B55');
    s += R(bx + 40, by - 14, 4, 0, '#000');
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const wx = bx + 22 + c * 88, wy = by + 30 + r * 116;
        const lit = night && ((r * 3 + c) % 4 === 1 || (r === 2 && c === 0));
        s += R(wx - 6, wy - 12, 66, 9, wallS);
        s += R(wx, wy, 54, 64, lit ? '#F4C46A' : night ? '#121A2E' : rain ? '#6E7C8C' : '#7E97AB');
        if (lit) s += R(wx, wy, 54, 64, '#FFE0A0', 'opacity=".25"');
        let gr = '';
        for (let k = 1; k < 5; k++) gr += `M${n(wx + k * 10.8)} ${n(wy)}V${n(wy + 64)}`;
        s += ST(gr + `M${n(wx)} ${n(wy + 32)}H${n(wx + 54)}`, night ? '#0C1220' : '#5B6676', 1.6);
      }
    }
    // split-AC outdoor unit
    s += R(bx + 220, by + 186, 48, 34, night ? '#2C3652' : '#EDEFF0', 'rx="3"') + C(bx + 238, by + 203, 11, night ? '#1E2740' : '#C7CDD3');
    // trees (neem) on the left
    const lv = night ? ['#101A2E', '#14203A', '#0D1626'] : rain ? ['#5F7F5A', '#4F6E4C', '#6D8E66'] : ['#7DA963', '#5F8E4D', '#94BC74'];
    s += R(x0 + w * 0.17, y0 + h * 0.6, 14, h * 0.4, night ? '#0C1322' : '#6B513C');
    const blobs = [[0.06, 0.52, 70], [0.2, 0.42, 82], [0.34, 0.55, 64], [0.1, 0.72, 74], [0.3, 0.74, 66], [0.02, 0.86, 80], [0.24, 0.9, 72]];
    blobs.forEach(([bx2, by2, r], i) => { s += C(x0 + w * bx2, y0 + h * by2, r, lv[i % 3]); });
    blobs.forEach(([bx2, by2, r], i) => { if (!night) s += C(x0 + w * bx2 - r * 0.25, y0 + h * by2 - r * 0.3, r * 0.45, lv[2], 'opacity=".55"'); });
    // overhead wires
    s += ST(`M${n(x0 - 5)} ${n(y0 + h * 0.3)}Q${n(x0 + w * 0.5)} ${n(y0 + h * 0.42)} ${n(x1 + 5)} ${n(y0 + h * 0.27)}M${n(x0 - 5)} ${n(y0 + h * 0.34)}Q${n(x0 + w * 0.5)} ${n(y0 + h * 0.47)} ${n(x1 + 5)} ${n(y0 + h * 0.32)}`, night ? '#0A0F1C' : '#3D4048', 1.6, 'opacity=".8"');
    if (!night && !rain) { // a pair of birds on the wire
      s += E(x0 + w * 0.66, y0 + h * 0.355, 7, 5, '#3B3F48') + C(x0 + w * 0.66 + 6, y0 + h * 0.345, 3.4, '#3B3F48');
      s += E(x0 + w * 0.72, y0 + h * 0.36, 7, 5, '#3B3F48') + C(x0 + w * 0.72 - 6, y0 + h * 0.35, 3.4, '#3B3F48');
    }
    if (rain) {
      let rs = '';
      for (let i = 0; i < 70; i++) { const rx = x0 + rng() * (w + 60), ry = y0 + rng() * h; rs += `M${n(rx)} ${n(ry)}l-9 28`; }
      s += ST(rs, '#E8EEF6', 1.4, `opacity="${night ? 0.35 : 0.55}"`);
    }
    return s;
  }
  function windowBlock() {
    const sF = SC(ZW);
    const ox0 = BX(WX0), ox1 = BX(WX1), oy0 = BY(WH1), oy1 = BY(WH0);
    let s = `<g clip-path="url(#${P('win')})">`;
    s += outside();
    // iron grill (outside the glass)
    let gr = '';
    for (let X = WX0 + 50; X < WX1; X += 58) gr += `M${pt(X, WH0, ZW + 15)}L${pt(X, WH1, ZW + 15)}`;
    for (const H of [560, 800, 1040]) gr += `M${pt(WX0, H, ZW + 15)}L${pt(WX1, H, ZW + 15)}`;
    s += ST(gr, K('#3C3633'), 3.6);
    // decorative grill arcs
    let arc = '';
    for (let X = WX0 + 50; X < WX1 - 58; X += 116) {
      const xa = SX(X, ZW + 15), xb = SX(X + 116, ZW + 15), ya = SY(800, ZW + 15);
      arc += `M${n(xa)} ${n(ya)}Q${n((xa + xb) / 2)} ${n(ya - 40)} ${n(xb)} ${n(ya)}`;
    }
    s += ST(arc, K('#3C3633'), 3);
    // glass reflection
    s += R(ox0, oy0, ox1 - ox0, oy1 - oy0, U('glass'));
    if (rain) {
      const rng = mulberry32(31);
      let dr = '';
      for (let i = 0; i < 40; i++) { const dx = ox0 + rng() * (ox1 - ox0), dy = oy0 + rng() * (oy1 - oy0); dr += `<ellipse cx="${n(dx)}" cy="${n(dy)}" rx="2.2" ry="3.4"/>`; }
      s += `<g fill="#FFFFFF" opacity=".5">${dr}</g>`;
    }
    // wooden frame: outer, centre mullion, transom
    const fc = K('#9A6B43', 400, 500), fcL = K('#B9875A', 400, 500), fcD = K('#7A5233', 400, 500);
    const t = 30;
    s += quad([[WX0, WH1, ZW], [WX1, WH1, ZW], [WX1, WH1 - t, ZW], [WX0, WH1 - t, ZW]], fc);
    s += quad([[WX0, WH0 + t, ZW], [WX1, WH0 + t, ZW], [WX1, WH0, ZW], [WX0, WH0, ZW]], fc);
    s += quad([[WX0, WH0, ZW], [WX0 + t, WH0, ZW], [WX0 + t, WH1, ZW], [WX0, WH1, ZW]], fc);
    s += quad([[WX1 - t, WH0, ZW], [WX1, WH0, ZW], [WX1, WH1, ZW], [WX1 - t, WH1, ZW]], fc);
    s += quad([[-863, WH0, ZW], [-837, WH0, ZW], [-837, WH1, ZW], [-863, WH1, ZW]], fc);
    s += quad([[WX0, 935, ZW], [WX1, 935, ZW], [WX1, 960, ZW], [WX0, 960, ZW]], fc);
    s += quad([[-863, WH0 + t, ZW], [-855, WH0 + t, ZW], [-855, 935, ZW], [-863, 935, ZW]], fcL);
    s += quad([[WX0 + t, 935, ZW], [WX1 - t, 935, ZW], [WX1 - t, 929, ZW], [WX0 + t, 929, ZW]], fcD);
    // casement handles
    s += RZ(-890, -880, 620, 700, ZW - 5, K('#C9A45C', 420, 650), 4) + RZ(-820, -810, 620, 700, ZW - 5, K('#C9A45C', 420, 650), 4);
    // reveals: left jamb, lintel underside, sill
    const rv = K('#E4D6BF', 300, 500);
    s += quad([[WX0, WH0, ZB], [WX0, WH1, ZB], [WX0, WH1, ZW], [WX0, WH0, ZW]], rv);
    s += quad([[WX0, WH1, ZB], [WX1, WH1, ZB], [WX1, WH1, ZW], [WX0, WH1, ZW]], K('#D8C8AE'));
    s += quad([[WX0, WH0, ZB], [WX1, WH0, ZB], [WX1, WH0, ZW], [WX0, WH0, ZW]], K('#EFE6D7'));
    s += `</g>`;
    // inner shadow along the top of the opening
    s += R(ox0, oy0, ox1 - ox0, 18, U('aoT'));
    // marble sill ledge
    s += box(-1205, -495, 362, 382, ZB - 70, ZB, { t: K('#F2ECE2', 380, 780), f: K('#D7CCBB', 380, 780) }, 3);
    // potted money plant on the ledge
    s += plantOnLedge(-620, ZB - 35);
    s += plantOnLedge(-1110, ZB - 35, true);
    return s;
  }
  function plantOnLedge(X, Z, small) {
    const s0 = SC(Z), x = SX(X, Z), y = SY(382, Z);
    const k = small ? 0.8 : 1;
    let s = PA(`M${n(x - 26 * k)} ${n(y - 44 * k)}H${n(x + 26 * k)}L${n(x + 20 * k)} ${n(y)}H${n(x - 20 * k)}Z`, K('#C46A4A', x, y));
    s += R(x - 28 * k, y - 48 * k, 56 * k, 8 * k, K('#A9583B', x, y), 'rx="3"');
    const lv = [K('#4F8A4E', x, y), K('#6FA35E', x, y), K('#3E7240', x, y)];
    const leaves = small
      ? [[-14, -62, -30], [10, -70, 20], [0, -84, -5], [-24, -50, -60], [22, -54, 50]]
      : [[-18, -64, -30], [14, -72, 25], [0, -90, -5], [-30, -50, -65], [30, -52, 60], [-36, -26, -90], [40, -10, 95], [46, 16, 120]];
    leaves.forEach(([dx, dy, a], i) => {
      s += `<path d="M0 0C8 -8 10 -22 0 -30C-10 -22 -8 -8 0 0Z" fill="${lv[i % 3]}" transform="translate(${n(x + dx * k)} ${n(y - 44 * k + dy * k + 44)}) rotate(${a}) scale(${n(k * 1.15)})"/>`;
    });
    if (!small) s += ST(`M${n(x + 22)} ${n(y - 40)}C${n(x + 40)} ${n(y - 20)} ${n(x + 44)} ${n(y + 10)} ${n(x + 46)} ${n(y + 30)}`, lv[2], 2.2);
    return s;
  }
  // floor-length terracotta curtains with tie-backs
  function curtains() {
    const Z = 2650, sC = SC(Z);
    const rodY = SY(1255, Z);
    let s = '';
    s += ST(`M${n(SX(-1320, Z))} ${n(rodY)}H${n(SX(-380, Z))}`, K('#8E6A3E', 400, 300), 7);
    s += C(SX(-1330, Z), rodY, 9, K('#C9A45C', 300, 300)) + C(SX(-370, Z), rodY, 9, K('#C9A45C', 500, 300));
    const base = '#C8714E', sh = '#A7583A', hl = '#DE8D66';
    const panel = (a0, a1, t0, t1, b0, b1, side) => {
      const yt = rodY + 6, yTie = SY(600, Z), yb = SY(8, Z);
      const X = v => SX(v, Z);
      const xa0 = X(a0), xa1 = X(a1), xt0 = X(t0), xt1 = X(t1), xb0 = X(b0), xb1 = X(b1);
      const cx = (xa0 + xa1) / 2, cy = (yt + yb) / 2;
      const d = `M${n(xa0)} ${n(yt)}H${n(xa1)}C${n(xa1)} ${n(yt + (yTie - yt) * 0.55)} ${n(xt1 + 6)} ${n(yTie - 40)} ${n(xt1)} ${n(yTie)}C${n(xt1 + 4)} ${n(yTie + 70)} ${n(xb1)} ${n(yb - 140)} ${n(xb1)} ${n(yb)}Q${n((xb0 + xb1) / 2)} ${n(yb + 8)} ${n(xb0)} ${n(yb)}C${n(xb0)} ${n(yb - 140)} ${n(xt0 - 4)} ${n(yTie + 70)} ${n(xt0)} ${n(yTie)}C${n(xt0 - 6)} ${n(yTie - 40)} ${n(xa0)} ${n(yt + (yTie - yt) * 0.55)} ${n(xa0)} ${n(yt)}Z`;
      let o = PA(d, K(base, cx, cy));
      // folds
      const N = 6;
      let fd = '', fh = '';
      for (let i = 1; i < N; i++) {
        const u = i / N;
        const xa = xa0 + (xa1 - xa0) * u, xt = xt0 + (xt1 - xt0) * u, xb = xb0 + (xb1 - xb0) * u;
        const p = `M${n(xa)} ${n(yt + 4)}C${n(xa)} ${n(yt + (yTie - yt) * 0.6)} ${n(xt)} ${n(yTie - 50)} ${n(xt)} ${n(yTie)}C${n(xt)} ${n(yTie + 80)} ${n(xb)} ${n(yb - 150)} ${n(xb)} ${n(yb - 2)}`;
        if (i % 2) fd += p; else fh += p;
      }
      o += ST(fd, K(sh, cx, cy), 7 * sC + 2, 'opacity=".75"');
      o += ST(fh, K(hl, cx, cy), 4 * sC + 1, 'opacity=".6"');
      // block-print border near the hem
      o += ST(`M${n(xb0 + 3)} ${n(yb - 26)}Q${n((xb0 + xb1) / 2)} ${n(yb - 20)} ${n(xb1 - 3)} ${n(yb - 26)}`, K('#E7B04A', cx, cy), 5, 'opacity=".85"');
      // top pleats shadow
      o += R(xa0, yt, xa1 - xa0, 10, K(sh, cx, cy), 'opacity=".6"');
      // rings
      for (let i = 0; i <= 4; i++) o += C(xa0 + (xa1 - xa0) * i / 4, rodY, 4.5, K('#B08A4F', cx, cy));
      // tie-back with tassel
      const tx = side < 0 ? xt0 : xt1;
      o += ST(`M${n(xt0 - 4)} ${n(yTie)}Q${n((xt0 + xt1) / 2)} ${n(yTie + 10)} ${n(xt1 + 4)} ${n(yTie)}`, K('#E7B04A', cx, cy), 6);
      o += C(tx, yTie + 4, 6, K('#C98F2E', cx, cy)) + PA(`M${n(tx - 5)} ${n(yTie + 8)}L${n(tx + 5)} ${n(yTie + 8)}L${n(tx + 7)} ${n(yTie + 34)}H${n(tx - 7)}Z`, K('#E7B04A', cx, cy));
      return o;
    };
    s += panel(-1310, -1110, -1290, -1210, -1330, -1085, -1);
    s += panel(-590, -390, -480, -400, -615, -380, 1);
    return s;
  }

  // ---------- low console under the window ----------
  function console_() {
    const z0 = 2570, z1 = 2690;
    let s = quad([[-1070, 0, z0 - 30], [-640, 0, z0 - 30], [-640, 0, z1], [-1070, 0, z1]], DARK, `opacity=".22" filter="url(#${P('b6')})"`);
    const wf = K('#9A6B43', 350, 900), wt = K('#B9875A', 350, 900), wd = K('#7A5233', 350, 900);
    s += box(-1060, -650, 30, 300, z0, z1, { t: wt, f: wf }, 4);
    s += RZ(-1060, -650, 0, 30, z0 + 20, wd);
    // two doors with cane panels
    for (const [a, b] of [[-1045, -860], [-850, -665]]) {
      s += RZ(a, b, 50, 275, z0 - 1, wd, 4) + RZ(a + 14, b - 14, 64, 261, z0 - 2, K('#D8B989', 350, 900), 3);
      let cane = '';
      const xa = SX(a + 14, z0), xb = SX(b - 14, z0), ya = SY(261, z0), yb = SY(64, z0);
      for (let x = xa + 6; x < xb; x += 8) cane += `M${n(x)} ${n(ya)}V${n(yb)}`;
      for (let y = ya + 6; y < yb; y += 8) cane += `M${n(xa)} ${n(y)}H${n(xb)}`;
      s += ST(cane, K('#B9935F', 350, 900), 1.2, 'opacity=".7"');
    }
    s += C(SX(-868, z0), SY(165, z0), 4, K('#C9A45C', 350, 900)) + C(SX(-842, z0), SY(165, z0), 4, K('#C9A45C', 350, 900));
    // on top: brass vase with marigolds, a book stack
    const vx = SX(-760, 2630), vy = SY(300, 2630);
    s += PA(`M${n(vx - 14)} ${n(vy)}C${n(vx - 26)} ${n(vy - 30)} ${n(vx - 8)} ${n(vy - 46)} ${n(vx - 7)} ${n(vy - 62)}H${n(vx + 7)}C${n(vx + 8)} ${n(vy - 46)} ${n(vx + 26)} ${n(vy - 30)} ${n(vx + 14)} ${n(vy)}Z`, K('#C9A45C', vx, vy));
    s += PA(`M${n(vx + 4)} ${n(vy - 58)}C${n(vx + 12)} ${n(vy - 40)} ${n(vx + 16)} ${n(vy - 22)} ${n(vx + 10)} ${n(vy - 4)}`, K('#F1D892', vx, vy), 'opacity=".0"');
    s += R(vx + 3, vy - 56, 3, 50, K('#F1D892', vx, vy), 'opacity=".7"');
    const fl = [[-22, -84, '#E7B04A'], [0, -96, '#E9892F'], [20, -82, '#E7B04A'], [-10, -74, '#E9892F'], [12, -70, '#F2D16B']];
    s += ST(`M${n(vx)} ${n(vy - 60)}L${n(vx - 20)} ${n(vy - 82)}M${n(vx)} ${n(vy - 60)}L${n(vx)} ${n(vy - 94)}M${n(vx)} ${n(vy - 60)}L${n(vx + 18)} ${n(vy - 80)}`, K('#5F8E4D', vx, vy), 2.4);
    fl.forEach(([dx, dy, c]) => { s += C(vx + dx, vy + dy, 10, K(c, vx, vy)) + C(vx + dx, vy + dy, 4, K(shade(c, 0.25), vx, vy)); });
    const bx = SX(-1000, 2620), by = SY(300, 2620), bs = SC(2620);
    const books = [['#5AA0D8', 150, 18], ['#E36F5C', 140, 16], ['#F3EBDD', 155, 14], ['#1F2A44', 145, 18]];
    let yy = by;
    books.forEach(([c, w, h]) => { s += R(bx, yy - h * bs, w * bs, h * bs, K(c, bx, yy), 'rx="1.5"') + R(bx + w * bs - 6, yy - h * bs, 6, h * bs, K(shade(c, 0.2), bx, yy)); yy -= h * bs; });
    return s;
  }

  // ---------- floor lamp (tripod, linen drum shade) ----------
  const LX = -330, LZ = 2560;
  function floorLamp() {
    let s = '';
    s += flatE(LX, 0, LZ + 30, 120, DARK, `opacity=".25" filter="url(#${P('b6')})"`);
    const wood = K('#7A5233', 700, 800), woodL = K('#9A6B43', 700, 800);
    const j = pt(LX, 470, LZ + 20);
    s += ST(`M${pt(LX - 120, 0, LZ + 70)}L${j}`, wood, 7) + ST(`M${pt(LX + 95, 0, LZ + 90)}L${j}`, wood, 7);
    s += ST(`M${pt(LX + 10, 0, LZ - 70)}L${j}`, woodL, 8);
    s += ST(`M${j}L${pt(LX, 610, LZ + 20)}`, K('#B08A4F', 700, 700), 5);
    // shade
    const Z = LZ + 20, x = SX(LX, Z), s0 = SC(Z);
    const yb = SY(600, Z), yt = SY(800, Z), rb = 104 * s0, rt = 86 * s0;
    if (night) {
      // light spilling up and down from the open shade
      s += PA(`M${n(x - rt)} ${n(yt)}L${n(x - rt - 120)} ${n(BY(HC))}H${n(x + rt + 120)}L${n(x + rt)} ${n(yt)}Z`, U('coneUp'), `filter="url(#${P('b3')})" style="mix-blend-mode:screen"`);
      s += PA(`M${n(x - rb)} ${n(yb)}L${n(x - rb - 90)} ${n(SY(0, LZ))}H${n(x + rb + 90)}L${n(x + rb)} ${n(yb)}Z`, U('coneDn'), 'opacity=".4" style="mix-blend-mode:screen"');
      s += E(x, yb, rb, 9, '#FFF3D0');
      s += PA(`M${n(x - rt)} ${n(yt)}H${n(x + rt)}L${n(x + rb)} ${n(yb)}H${n(x - rb)}Z`, U('shadeOn'));
      s += R(x - rb, yb - 6, 2 * rb, 6, '#FFD48A', 'opacity=".8"');
    } else {
      s += E(x, yb, rb, 9, K('#D8C7A6'));
      s += PA(`M${n(x - rt)} ${n(yt)}H${n(x + rt)}L${n(x + rb)} ${n(yb)}H${n(x - rb)}Z`, '#F2E3C4');
      s += PA(`M${n(x + rt * 0.35)} ${n(yt)}H${n(x + rt)}L${n(x + rb)} ${n(yb)}H${n(x + rb * 0.35)}Z`, '#E1CDA6', 'opacity=".8"');
      s += PA(`M${n(x - rt)} ${n(yt)}H${n(x - rt * 0.55)}L${n(x - rb * 0.55)} ${n(yb)}H${n(x - rb)}Z`, '#FBF3E2', 'opacity=".8"');
    }
    s += ST(`M${n(x - rt)} ${n(yt)}H${n(x + rt)}`, night ? '#FFE9B8' : '#D9C49C', 3);
    return s;
  }

  // ---------- sofa ----------
  const SX0 = -230, SX1 = 700, ZF = 2290, ZK = 2690;
  const SOFA = '#4C6B7A', SOFA_D = '#3B5563', SOFA_L = '#5E8293', SOFA_T = '#5A7C8C';
  function pillow(cx, cy, w, h, rot, col, print) {
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, b = w * 0.07;
    const d = `M${n(x0)} ${n(y0)}Q0 ${n(y0 + b)} ${n(x1)} ${n(y0)}Q${n(x1 - b)} 0 ${n(x1)} ${n(y1)}Q0 ${n(y1 - b)} ${n(x0)} ${n(y1)}Q${n(x0 + b)} 0 ${n(x0)} ${n(y0)}Z`;
    const c = K(col, cx, cy), cs = K(shade(col, 0.22), cx, cy), cl = K(tint(col, 0.22), cx, cy);
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${rot})">`;
    s += PA(d, c, rnd(c, 8));
    s += PA(`M${n(x0)} ${n(y1 * 0.15)}Q${n(x0 + b)} ${n(y1 * 0.6)} ${n(x0)} ${n(y1)}Q0 ${n(y1 - b)} ${n(x1)} ${n(y1)}Q${n(x1 - b)} ${n(y1 * 0.6)} ${n(x1)} ${n(y1 * 0.15)}Q0 ${n(y1 * 0.3)} ${n(x0)} ${n(y1 * 0.15)}Z`, cs, 'opacity=".55"');
    s += PA(`M${n(x0 + w * 0.12)} ${n(y0 + h * 0.12)}Q0 ${n(y0 + h * 0.2)} ${n(x1 - w * 0.12)} ${n(y0 + h * 0.12)}`, 'none', `stroke="${cl}" stroke-width="5" stroke-linecap="round" opacity=".7"`);
    if (print === 'diamond') {
      let p = '';
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const px = i * w * 0.24, py = j * h * 0.24, r = w * 0.07; p += `M${n(px)} ${n(py - r)}L${n(px + r)} ${n(py)}L${n(px)} ${n(py + r)}L${n(px - r)} ${n(py)}Z`; }
      s += PA(p, K('#FFF4DC', cx, cy), 'opacity=".75"');
    } else if (print === 'stripe') {
      s += R(x0 + 4, -h * 0.08, w - 8, h * 0.07, K('#FFF4DC', cx, cy), 'opacity=".8"') + R(x0 + 4, h * 0.06, w - 8, h * 0.03, K('#1F2A44', cx, cy), 'opacity=".55"');
      s += R(x0 + 4, -h * 0.2, w - 8, h * 0.03, K('#1F2A44', cx, cy), 'opacity=".55"');
    } else if (print === 'mandala') {
      const mc = K('#C8714E', cx, cy);
      s += C(0, 0, w * 0.2, 'none', `stroke="${mc}" stroke-width="3"`) + C(0, 0, w * 0.09, mc);
      let pe = '';
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, px = Math.cos(a) * w * 0.28, py = Math.sin(a) * w * 0.28; pe += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(w * 0.035)}"/>`; }
      s += `<g fill="${mc}">${pe}</g>`;
    }
    s += '</g>';
    return s;
  }
  function sofa() {
    let s = '';
    // floor shadow
    s += quad([[SX0 - 40, 0, ZF - 50], [SX1 + 40, 0, ZF - 50], [SX1 + 30, 0, ZK], [SX0 - 30, 0, ZK]], DARK, `opacity="${night ? 0.4 : 0.28}" filter="url(#${P('b6')})"`);
    const cx = 1100, cy = 880;
    const Kc = (c, x) => K(c, x === undefined ? cx : x, cy);
    // legs
    for (const X of [SX0 + 30, SX1 - 30]) s += RZ(X - 16, X + 16, 0, 64, ZF + 24, Kc('#5E3F27', SX(X, ZF)), 3);
    for (const X of [-60, 520]) s += RZ(X - 14, X + 14, 0, 60, ZF + 60, Kc('#4A3220', SX(X, ZF)), 3);
    // back frame
    s += box(SX0, SX1, 60, 485, 2580, ZK, { t: Kc(SOFA_T), f: Kc(SOFA_D) }, 18);
    // seat base
    s += box(-100, 570, 60, 200, 2320, 2580, { f: Kc(SOFA_D) }, 6);
    // back cushions (leaning)
    const cw = (570 - (-100)) / 3;
    for (let i = 0; i < 3; i++) {
      const a = -100 + i * cw + 7, b = -100 + (i + 1) * cw - 7;
      const xm = SX((a + b) / 2, 2550);
      const c = Kc(SOFA, xm), cl = Kc(SOFA_L, xm), cd = Kc(SOFA_D, xm);
      s += PA(`M${pt(a, 470, 2590)}L${pt(b, 470, 2590)}L${pt(b, 252, 2520)}L${pt(a, 252, 2520)}Z`, c, rnd(c, 22));
      s += PA(`M${pt(a, 470, 2590)}L${pt(b, 470, 2590)}L${pt(b, 420, 2575)}L${pt(a, 420, 2575)}Z`, cl, rnd(cl, 14) + ' opacity=".9"');
      s += PA(`M${pt(a + 10, 300, 2535)}L${pt(b - 10, 300, 2535)}L${pt(b - 10, 252, 2520)}L${pt(a + 10, 252, 2520)}Z`, cd, 'opacity=".55"');
      // button tufting
      for (const u of [0.3, 0.7]) s += C(SX(a + (b - a) * u, 2560), SY(370, 2560), 3.2, cd);
    }
    // seat cushions
    for (let i = 0; i < 3; i++) {
      const a = -100 + i * cw + 5, b = -100 + (i + 1) * cw - 5;
      const xm = SX((a + b) / 2, 2400);
      s += box(a, b, 196, 266, 2302, 2556, { t: Kc(SOFA_T, xm), f: Kc(SOFA, xm) }, 14);
      s += ST(`M${pt(a + 8, 262, 2302)}L${pt(b - 8, 262, 2302)}`, Kc(SOFA_L, xm), 3, 'opacity=".8"');
      s += ST(`M${pt(a + 10, 208, 2302)}L${pt(b - 10, 208, 2302)}`, Kc(SOFA_D, xm), 3, 'opacity=".5"');
    }
    // throw pillows
    s += pillow(SX(-20, 2500), SY(372, 2500), 118, 112, -9, '#E7B04A', 'diamond');
    s += pillow(SX(225, 2505), SY(350, 2505), 92, 88, -3, '#F1E4CB', 'mandala');
    s += pillow(SX(470, 2500), SY(368, 2500), 116, 110, 8, '#E36F5C', 'stripe');
    // arms (rolled)
    for (const [a, b] of [[SX0, -100], [570, SX1]]) {
      const xm = SX((a + b) / 2, ZF);
      s += box(a, b, 60, 345, ZF, ZK, { t: Kc(SOFA_T, xm), f: Kc(SOFA, xm), s: Kc(SOFA_D, xm) }, 20);
      s += PA(`M${pt(a + 10, 330, ZF)}L${pt(b - 10, 330, ZF)}L${pt(b - 10, 300, ZF)}L${pt(a + 10, 300, ZF)}Z`, Kc(SOFA_L, xm), 'opacity=".7"');
      s += PA(`M${pt(a + 8, 120, ZF)}L${pt(b - 8, 120, ZF)}L${pt(b - 8, 66, ZF)}L${pt(a + 8, 66, ZF)}Z`, Kc(SOFA_D, xm), 'opacity=".5"');
    }
    // knitted throw draped over the right arm
    {
      const xm = SX(640, ZF), ym = 860;
      const tc = K('#EFE3CC', xm, ym), ts = K('#D8C7A6', xm, ym);
      const d = `M${pt(585, 352, 2470)}L${pt(690, 352, 2470)}L${pt(690, 352, ZF)}L${pt(692, 160, ZF - 4)}L${pt(583, 150, ZF - 4)}L${pt(585, 352, ZF)}Z`;
      s += PA(d, tc, rnd(tc, 8));
      s += PA(`M${pt(585, 352, 2470)}L${pt(690, 352, 2470)}L${pt(690, 352, 2420)}L${pt(585, 352, 2420)}Z`, ts, 'opacity=".7"');
      let str = '';
      for (const H of [300, 270, 200]) str += `M${pt(587, H, ZF - 5)}L${pt(690, H + 2, ZF - 5)}`;
      s += ST(str, K('#E7B04A', xm, ym), 4) + ST(`M${pt(587, 285, ZF - 5)}L${pt(690, 287, ZF - 5)}`, K('#1F2A44', xm, ym), 3, 'opacity=".7"');
      let fr = '';
      for (let X = 590; X <= 688; X += 9) fr += `M${pt(X, 150 + (X - 583) * 0.09, ZF - 5)}l0 9`;
      s += ST(fr, tc, 2.4);
    }
    return s;
  }

  // ---------- side table with a table lamp ----------
  function sideTable() {
    const z0 = 2470, z1 = 2690, x0 = 740, x1 = 960;
    let s = quad([[x0 - 10, 0, z0 - 20], [x1 + 20, 0, z0 - 20], [x1 + 20, 0, z1], [x0 - 10, 0, z1]], DARK, `opacity=".3" filter="url(#${P('b6')})"`);
    const cx = 1560, cy = 960;
    const wf = K('#9A6B43', cx, cy), wt = K('#B9875A', cx, cy), ws = K('#7A5233', cx, cy);
    for (const X of [x0 + 18, x1 - 18]) s += RZ(X - 10, X + 10, 0, 60, z0 + 12, ws);
    s += box(x0, x1, 60, 250, z0, z1, { t: wt, f: wf, s: ws }, 4);
    s += RZ(x0 + 14, x1 - 14, 160, 236, z0 - 1, ws, 3) + RZ(x0 + 18, x1 - 18, 164, 232, z0 - 2, wf, 3);
    s += C(SX((x0 + x1) / 2, z0), SY(198, z0), 4, K('#C9A45C', cx, cy));
    s += RZ(x0 + 14, x1 - 14, 76, 146, z0 - 1, ws, 3);
    // books on the lower shelf
    const bb = [['#5AA0D8', 30], ['#E7B04A', 24], ['#1F2A44', 34], ['#E36F5C', 22]];
    let bx = x0 + 26;
    bb.forEach(([c, w]) => { s += RZ(bx, bx + w, 80, 136 - (w % 3) * 6, z0 + 30, K(c, cx, cy), 2); bx += w + 3; });
    // table lamp: ceramic gourd base + drum shade
    const LZ2 = 2580, X2 = 850, x = SX(X2, LZ2), s2 = SC(LZ2);
    const yb = SY(250, LZ2);
    s += PA(`M${n(x - 18 * s2)} ${n(yb)}C${n(x - 70 * s2)} ${n(yb - 40 * s2)} ${n(x - 60 * s2)} ${n(yb - 120 * s2)} ${n(x - 16 * s2)} ${n(yb - 150 * s2)}H${n(x + 16 * s2)}C${n(x + 60 * s2)} ${n(yb - 120 * s2)} ${n(x + 70 * s2)} ${n(yb - 40 * s2)} ${n(x + 18 * s2)} ${n(yb)}Z`, K('#4E8FA8', x, yb - 60));
    s += PA(`M${n(x - 30 * s2)} ${n(yb - 20 * s2)}C${n(x - 56 * s2)} ${n(yb - 60 * s2)} ${n(x - 46 * s2)} ${n(yb - 110 * s2)} ${n(x - 16 * s2)} ${n(yb - 140 * s2)}`, 'none', `stroke="${K('#8CC3D6', x, yb - 60)}" stroke-width="4" stroke-linecap="round" opacity=".7"`);
    s += R(x - 3, yb - 175 * s2, 6, 30 * s2, K('#B08A4F', x, yb - 80));
    const ys0 = SY(405, LZ2), ys1 = SY(570, LZ2), rb = 96 * s2, rt = 74 * s2;
    if (night) {
      s += PA(`M${n(x - rt)} ${n(ys1)}L${n(x - rt - 70)} ${n(ys1 - 260)}H${n(x + rt + 70)}L${n(x + rt)} ${n(ys1)}Z`, U('coneUp'), `filter="url(#${P('b3')})" style="mix-blend-mode:screen"`);
      s += PA(`M${n(x - rt)} ${n(ys1)}H${n(x + rt)}L${n(x + rb)} ${n(ys0)}H${n(x - rb)}Z`, U('shadeOn'));
      s += E(x, ys0, rb, 6, '#FFF3D0');
    } else {
      s += PA(`M${n(x - rt)} ${n(ys1)}H${n(x + rt)}L${n(x + rb)} ${n(ys0)}H${n(x - rb)}Z`, '#F4E8D0');
      s += PA(`M${n(x + rt * 0.3)} ${n(ys1)}H${n(x + rt)}L${n(x + rb)} ${n(ys0)}H${n(x + rb * 0.3)}Z`, '#E3D2B2', 'opacity=".8"');
    }
    // small framed photo on the table
    const fx = SX(925, 2560), fy = SY(250, 2560), f2 = SC(2560);
    s += PA(`M${n(fx - 30 * f2)} ${n(fy)}L${n(fx - 26 * f2)} ${n(fy - 82 * f2)}H${n(fx + 34 * f2)}L${n(fx + 30 * f2)} ${n(fy)}Z`, K('#C9A45C', fx, fy));
    s += R(fx - 20 * f2, fy - 72 * f2, 44 * f2, 62 * f2, K('#9FB3C4', fx, fy));
    s += C(fx + 2 * f2, fy - 48 * f2, 9 * f2, K('#C68B62', fx, fy)) + PA(`M${n(fx - 14 * f2)} ${n(fy - 10 * f2)}Q${n(fx + 2 * f2)} ${n(fy - 44 * f2)} ${n(fx + 18 * f2)} ${n(fy - 10 * f2)}Z`, K('#E36F5C', fx, fy));
    return s;
  }

  // ---------- wall decor ----------
  function familyPhoto() {
    const x0 = BX(40), x1 = BX(450), y0 = BY(980), y1 = BY(650);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let s = R(x0 + 6, y0 + 10, x1 - x0, y1 - y0, DARK, `opacity=".22" filter="url(#${P('b3')})"`);
    s += R(x0, y0, x1 - x0, y1 - y0, K('#6E4A2E', cx, cy), 'rx="3"');
    s += R(x0 + 3, y0 + 3, x1 - x0 - 6, 5, K('#9A6B43', cx, cy));
    s += R(x0 + 14, y0 + 14, x1 - x0 - 28, y1 - y0 - 28, K('#C9A45C', cx, cy));
    s += R(x0 + 17, y0 + 17, x1 - x0 - 34, y1 - y0 - 34, K('#F6F0E2', cx, cy));
    // photo (studio portrait of a family of four)
    const px0 = BX(72), px1 = BX(418), py0 = BY(948), py1 = BY(682);
    const pw = px1 - px0, ph = py1 - py0;
    let p = R(px0, py0, pw, ph, U('photo'));
    p += E(px0 + pw * 0.5, py0 + ph * 0.42, pw * 0.42, ph * 0.38, '#FFFFFF', 'opacity=".25"');
    const skin = ['#B97A50', '#C88A5E', '#D09A6C', '#C07F55'];
    const fig = (fx, fy, r, shirt, hair, opts2) => {
      let o = '';
      // shoulders
      o += PA(`M${n(fx - r * 2.1)} ${n(py1 + 2)}C${n(fx - r * 2.1)} ${n(fy + r * 1.4)} ${n(fx - r * 1.2)} ${n(fy + r * 1.1)} ${n(fx)} ${n(fy + r * 1.1)}C${n(fx + r * 1.2)} ${n(fy + r * 1.1)} ${n(fx + r * 2.1)} ${n(fy + r * 1.4)} ${n(fx + r * 2.1)} ${n(py1 + 2)}Z`, shirt);
      o += R(fx - r * 0.32, fy + r * 0.7, r * 0.64, r * 0.55, opts2.skin);
      o += E(fx, fy, r * 0.86, r, opts2.skin);
      if (opts2.long) o += PA(`M${n(fx - r * 0.95)} ${n(fy + r * 1.5)}C${n(fx - r * 1.2)} ${n(fy - r * 0.6)} ${n(fx - r * 0.6)} ${n(fy - r * 1.15)} ${n(fx)} ${n(fy - r * 1.12)}C${n(fx + r * 0.6)} ${n(fy - r * 1.15)} ${n(fx + r * 1.2)} ${n(fy - r * 0.6)} ${n(fx + r * 0.95)} ${n(fy + r * 1.5)}L${n(fx + r * 0.7)} ${n(fy - r * 0.2)}C${n(fx + r * 0.4)} ${n(fy - r * 0.62)} ${n(fx - r * 0.4)} ${n(fy - r * 0.62)} ${n(fx - r * 0.7)} ${n(fy - r * 0.2)}Z`, hair);
      else o += PA(`M${n(fx - r * 0.9)} ${n(fy - r * 0.05)}C${n(fx - r * 1.0)} ${n(fy - r * 1.05)} ${n(fx + r * 1.0)} ${n(fy - r * 1.25)} ${n(fx + r * 0.9)} ${n(fy - r * 0.05)}C${n(fx + r * 0.6)} ${n(fy - r * 0.55)} ${n(fx - r * 0.6)} ${n(fy - r * 0.55)} ${n(fx - r * 0.9)} ${n(fy - r * 0.05)}Z`, hair);
      if (opts2.mous) o += PA(`M${n(fx - r * 0.38)} ${n(fy + r * 0.36)}Q${n(fx)} ${n(fy + r * 0.16)} ${n(fx + r * 0.38)} ${n(fy + r * 0.36)}Q${n(fx)} ${n(fy + r * 0.3)} ${n(fx - r * 0.38)} ${n(fy + r * 0.36)}Z`, hair);
      if (opts2.bindi) o += C(fx, fy - r * 0.28, r * 0.09, '#B3202A');
      o += C(fx - r * 0.3, fy + r * 0.02, r * 0.08, '#2A1C14') + C(fx + r * 0.3, fy + r * 0.02, r * 0.08, '#2A1C14');
      o += ST(`M${n(fx - r * 0.22)} ${n(fy + r * 0.5)}Q${n(fx)} ${n(fy + r * 0.64)} ${n(fx + r * 0.22)} ${n(fy + r * 0.5)}`, '#7A3B2A', r * 0.07);
      return o;
    };
    const r0 = ph * 0.13;
    p += fig(px0 + pw * 0.36, py0 + ph * 0.36, r0, '#F2F0EA', '#1E1A18', { skin: skin[0], mous: true });
    p += fig(px0 + pw * 0.62, py0 + ph * 0.4, r0 * 0.95, '#9E2F3E', '#1E1A18', { skin: skin[1], long: true, bindi: true });
    p += PA(`M${n(px0 + pw * 0.48)} ${n(py1)}L${n(px0 + pw * 0.7)} ${n(py0 + ph * 0.56)}L${n(px0 + pw * 0.8)} ${n(py1)}Z`, '#E7B04A', 'opacity=".9"');
    p += fig(px0 + pw * 0.22, py0 + ph * 0.62, r0 * 0.78, '#5AA0D8', '#1E1A18', { skin: skin[2] });
    p += fig(px0 + pw * 0.82, py0 + ph * 0.64, r0 * 0.74, '#E36F5C', '#2A1F1A', { skin: skin[3], long: true });
    s += `<g clip-path="url(#${P('ph')})">${p}</g>`;
    if (night) s += R(px0, py0, pw, ph, '#0B1430', 'opacity=".25"');
    // glass glare
    s += PA(`M${n(px0 + pw * 0.55)} ${n(py0)}H${n(px0 + pw * 0.7)}L${n(px0 + pw * 0.45)} ${n(py1)}H${n(px0 + pw * 0.3)}Z`, '#FFFFFF', `opacity="${night ? 0.06 : 0.14}"`);
    // small brass hook + string hidden; a marigold garland draped on the frame
    let gar = '';
    const g0 = x0 + 8, g1 = x1 - 8, gy = y0 + 4;
    for (let i = 0; i <= 18; i++) {
      const u = i / 18, gx = g0 + (g1 - g0) * u;
      const yy = gy + Math.sin(u * Math.PI) * 26 * (u < 0.5 ? 1 : 1);
      gar += `<circle cx="${n(gx)}" cy="${n(yy)}" r="6.4" fill="${K(i % 2 ? '#E9892F' : '#F2B33D', cx, cy)}"/>`;
    }
    s += gar;
    s += ST(`M${n(g0)} ${n(gy)}l-4 26M${n(g1)} ${n(gy)}l4 26`, K('#E9892F', cx, cy), 6, 'stroke-dasharray="1 9"');
    return s;
  }
  function madhubani() {
    // small folk painting (two fish) beside the doorway
    const x0 = BX(790), x1 = BX(960), y0 = BY(930), y1 = BY(720);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
    let s = R(x0 + 4, y0 + 7, w, h, DARK, `opacity=".2" filter="url(#${P('b3')})"`);
    s += R(x0, y0, w, h, K('#2E2622', cx, cy), 'rx="2"') + R(x0 + 7, y0 + 7, w - 14, h - 14, K('#F2E2BF', cx, cy));
    const fish = (fx, fy, flip, col) => {
      const k = flip ? -1 : 1;
      return `<g transform="translate(${n(fx)} ${n(fy)}) scale(${k} 1)"><path d="M-34 0C-20 -18 14 -18 26 0C14 18 -20 18 -34 0Z" fill="${col}"/><path d="M24 0L40 -13L36 0L40 13Z" fill="${col}"/><circle cx="-20" cy="-3" r="3.4" fill="#F2E2BF"/><path d="M-6 -12V12M4 -12V12M14 -9V9" stroke="#F2E2BF" stroke-width="2"/></g>`;
    };
    s += fish(cx, y0 + h * 0.36, false, K('#C8432F', cx, cy)) + fish(cx, y0 + h * 0.66, true, K('#1E7F86', cx, cy));
    s += R(x0 + 12, y0 + 12, w - 24, h - 24, 'none', `stroke="${K('#C8432F', cx, cy)}" stroke-width="2.5" stroke-dasharray="6 4"`);
    return s;
  }
  function switchboard() {
    const x0 = BX(905), x1 = BX(975), y0 = BY(620), y1 = BY(500);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let s = R(x0 + 2, y0 + 3, x1 - x0, y1 - y0, DARK, 'opacity=".15" rx="4"');
    s += R(x0, y0, x1 - x0, y1 - y0, K('#FBF8F2', cx, cy), 'rx="4"');
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += R(x0 + 7 + i * 20, y0 + 8 + j * 34, 16, 26, K('#E8E3DA', cx, cy), 'rx="2"') + R(x0 + 9 + i * 20, y0 + 10 + j * 34 + (i + j) % 2 * 10, 12, 12, K('#F7F4EE', cx, cy), 'rx="2"');
    s += C(x1 - 8, y0 + 8, 2.4, night ? '#FF5A4A' : '#D6463A');
    return s;
  }
  function wallClock() {
    const x = BX(1190), y = BY(1150), r = 74 * SC(ZB);
    let s = C(x + 4, y + 6, r, DARK, `opacity=".22" filter="url(#${P('b3')})"`);
    s += C(x, y, r, K('#7A5233', x, y)) + C(x, y, r - 4, K('#9A6B43', x, y)) + C(x, y, r - 8, K('#FBF6EC', x, y));
    let tk = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, r1 = r - 12, r2 = i % 3 === 0 ? r - 22 : r - 17;
      tk += `M${n(x + Math.sin(a) * r1)} ${n(y - Math.cos(a) * r1)}L${n(x + Math.sin(a) * r2)} ${n(y - Math.cos(a) * r2)}`;
    }
    s += ST(tk, K('#2A2A33', x, y), 2.6);
    const [hh, mm] = night ? [9, 40] : [10, 10];
    const ha = (hh % 12 + mm / 60) * Math.PI / 6, ma = mm * Math.PI / 30;
    s += ST(`M${n(x)} ${n(y)}L${n(x + Math.sin(ha) * r * 0.48)} ${n(y - Math.cos(ha) * r * 0.48)}`, K('#1F2A44', x, y), 4.5);
    s += ST(`M${n(x)} ${n(y)}L${n(x + Math.sin(ma) * r * 0.7)} ${n(y - Math.cos(ma) * r * 0.7)}`, K('#1F2A44', x, y), 3);
    s += C(x, y, 4, K('#C8161E', x, y));
    return s;
  }

  // ---------- doorway to the kitchen ----------
  const DX0 = 1020, DX1 = 1360, DH = 960, ZD = ZB + 110;
  function doorway() {
    let s = '';
    const ox0 = BX(DX0), ox1 = BX(DX1), oy0 = BY(DH), oy1 = BY(0);
    let in_ = '';
    const ZI = 3560;
    // inner room: back wall, floor
    in_ += R(ox0, oy0, ox1 - ox0, oy1 - oy0, KI('#DCE3CF'));
    in_ += quad([[DX0 - 400, 0, ZI], [DX1 + 800, 0, ZI], [DX1 + 800, 0, ZD], [DX0 - 400, 0, ZD]], KI('#CDBFA6'));
    let tg = '';
    for (let X = 800; X < 2300; X += 180) tg += `M${pt(X, 0, ZI)}L${pt(X, 0, ZD)}`;
    for (let Z = ZI; Z > ZD; Z -= 180) tg += `M${pt(800, 0, Z)}L${pt(2300, 0, Z)}`;
    in_ += ST(tg, KI('#B5A68B'), 1.4, 'opacity=".7"');
    in_ += R(ox0, SY(60, ZI), ox1 - ox0, SY(0, ZI) - SY(60, ZI), KI('#C9C0A8'));
    // calendar on the inner wall
    in_ += RZ(1290, 1400, 560, 760, ZI, KI('#FFFFFF')) + RZ(1290, 1400, 690, 760, ZI, KI('#E36F5C')) + RZ(1300, 1390, 570, 680, ZI, KI('#EEE8DE'));
    let cal = '';
    for (let i = 0; i < 4; i++) cal += `M${pt(1305, 660 - i * 24, ZI)}L${pt(1385, 660 - i * 24, ZI)}`;
    in_ += ST(cal, KI('#AEB6C2'), 1.6);
    // refrigerator (maroon, steel handle, magnets)
    const fz = 3370;
    in_ += box(1420, 1780, 20, 820, fz, ZI - 10, { f: KI('#8E3D3D'), s: KI('#6E2C2C'), t: KI('#A55252') }, 6);
    in_ += RZ(1420, 1780, 0, 20, fz + 10, KI('#2A2A30'));
    in_ += RZ(1430, 1770, 560, 562, fz - 1, KI('#5E2424'));
    in_ += RZ(1450, 1466, 380, 540, fz - 2, KI('#D9DDE2'), 6) + RZ(1450, 1466, 600, 720, fz - 2, KI('#D9DDE2'), 6);
    in_ += RZ(1520, 1600, 600, 700, fz - 2, KI('#F6F2E8')) + C(SX(1640, fz), SY(650, fz), 6, KI('#F2D16B')) + C(SX(1680, fz), SY(700, fz), 5, KI('#5AA0D8'));
    in_ += PA(`M${pt(1430, 815, fz)}L${pt(1520, 815, fz)}L${pt(1430, 740, fz)}Z`, '#FFFFFF', 'opacity=".12"');
    // steel containers on top of the fridge
    in_ += RZ(1460, 1560, 820, 880, fz + 40, KI('#C7CDD3'), 6) + RZ(1580, 1650, 820, 860, fz + 40, KI('#AEB6C2'), 6);
    // ceiling light glow in the kitchen
    if (night) in_ += E((ox0 + ox1) / 2 + 40, oy0 + 40, 220, 120, '#FFE3B0', `opacity=".35" filter="url(#${P('soft')})"`);
    else in_ += E((ox0 + ox1) / 2 + 40, oy0 + 80, 200, 140, '#FFFFFF', `opacity=".18" filter="url(#${P('soft')})"`);
    // reveals: right jamb + lintel underside (wall thickness)
    in_ += quad([[DX1, 0, ZB], [DX1, DH, ZB], [DX1, DH, ZD], [DX1, 0, ZD]], K('#E2D2B8', 1840, 700));
    in_ += quad([[DX0, DH, ZB], [DX1, DH, ZB], [DX1, DH, ZD], [DX0, DH, ZD]], K('#D6C6AC', 1740, 400));
    s += `<g clip-path="url(#${P('door')})">${in_}</g>`;
    // wooden casing (architrave)
    const cw = 44;
    const cf = K('#9A6B43', 1740, 600), cl = K('#B9875A', 1740, 600);
    s += RZ(DX0 - cw, DX0, 0, DH + cw, ZB - 4, cf) + RZ(DX1, DX1 + cw, 0, DH + cw, ZB - 4, cf) + RZ(DX0 - cw - 8, DX1 + cw + 8, DH, DH + cw + 6, ZB - 6, cf);
    s += RZ(DX0 - cw, DX0 - cw + 8, 0, DH + cw, ZB - 5, cl) + RZ(DX0 - cw - 8, DX1 + cw + 8, DH + cw, DH + cw + 6, ZB - 7, cl);
    // threshold
    s += box(DX0, DX1, 0, 12, ZB - 8, ZD, { t: K('#C9B79C', 1740, 1030), f: K('#B3A285', 1740, 1030) });
    // door curtain (indigo block print), gathered to the left
    const Zc = ZB - 18;
    const rodY = SY(DH + 20, Zc);
    s += ST(`M${n(SX(DX0 - 30, Zc))} ${n(rodY)}H${n(SX(DX1 + 30, Zc))}`, K('#B08A4F', 1740, 380), 4);
    const cx0 = SX(DX0 - 10, Zc), cx1 = SX(DX0 + 120, Zc), cxb = SX(DX0 + 150, Zc), yb = SY(14, Zc);
    const ccx = (cx0 + cx1) / 2, ccy = 700;
    s += PA(`M${n(cx0)} ${n(rodY)}H${n(cx1)}C${n(cx1 + 6)} ${n(rodY + 200)} ${n(cxb - 10)} ${n(yb - 200)} ${n(cxb)} ${n(yb)}H${n(cx0)}Z`, K('#3E5385', ccx, ccy));
    let fo = '';
    for (let i = 1; i < 5; i++) { const u = i / 5; const xa = cx0 + (cx1 - cx0) * u, xb = cx0 + (cxb - cx0) * u; fo += `M${n(xa)} ${n(rodY + 4)}C${n(xa + 3)} ${n(rodY + 200)} ${n(xb - 6)} ${n(yb - 200)} ${n(xb)} ${n(yb)}`; }
    s += ST(fo, K('#2C3C66', ccx, ccy), 6, 'opacity=".8"');
    const rng = mulberry32(9);
    let dots = '';
    for (let i = 0; i < 46; i++) { const u = rng(), v = rng(); const yy = rodY + 14 + v * (yb - rodY - 40); const xl = cx0 + 6, xr = cx1 + (cxb - cx1) * ((yy - rodY) / (yb - rodY)) - 6; dots += `<circle cx="${n(xl + u * (xr - xl))}" cy="${n(yy)}" r="2.6"/>`; }
    s += `<g fill="${K('#F1E4CB', ccx, ccy)}" opacity=".8">${dots}</g>`;
    s += R(cx0, yb - 22, cxb - cx0, 10, K('#E7B04A', ccx, ccy), 'opacity=".85"');
    for (let i = 0; i <= 3; i++) s += C(cx0 + (cx1 - cx0) * i / 3, rodY, 4, K('#C9A45C', ccx, ccy));
    // coir doormat + slippers
    s += quad([[DX0 + 30, 1, 2560], [DX1 - 50, 1, 2560], [DX1 - 50, 1, 2680], [DX0 + 30, 1, 2680]], K('#A9814F', 1740, 1050));
    s += quad([[DX0 + 46, 2, 2575], [DX1 - 66, 2, 2575], [DX1 - 66, 2, 2665], [DX0 + 46, 2, 2665]], K('#8E6A3E', 1740, 1050));
    const slip = (X, Z, col) => flatE(X, 3, Z, 34, K(col, SX(X, Z), SY(0, Z)), '') + flatE(X + 4, 6, Z - 6, 18, K(shade(col, 0.3), SX(X, Z), SY(0, Z)));
    s += slip(900, 2520, '#5A4A3A') + slip(960, 2510, '#5A4A3A') + slip(1290, 2470, '#B48ED6') + slip(1335, 2480, '#B48ED6');
    return s;
  }

  // ---------- TV wall on the right wall ----------
  function tvWall() {
    const X = XR - 2;
    let s = '';
    const cx = 2150, cy = 600;
    const oak = K('#C99A6A', cx, cy), oakD = K('#A87A4E', cx, cy), wal = K('#5E4630', cx, cy);
    s += sq(X, 1960, 2640, 0, 1180, oak);
    let gv = '';
    for (let Z = 1990; Z < 2640; Z += 46) gv += `M${pt(X, 0, Z)}L${pt(X, 1180, Z)}`;
    s += ST(gv, oakD, 1.8, 'opacity=".7"');
    s += sq(X, 1960, 1975, 0, 1180, oakD);
    // recessed walnut niche behind the TV with LED cove
    s += sq(X - 1, 2020, 2580, 440, 900, wal);
    if (night) s += quad([[X - 2, 900, 2020], [X - 2, 900, 2580], [X - 2, 780, 2580], [X - 2, 780, 2020]], U('led'), 'style="mix-blend-mode:screen"');
    s += sq(X - 2, 2020, 2580, 893, 900, night ? '#FFD995' : K('#8A6A4A', cx, cy));
    // floating shelf above the niche
    s += box(X - 110, X, 930, 952, 2080, 2520, { b: K('#7A5233', cx, cy), f: K('#9A6B43', cx, cy), s: K('#9A6B43', cx, cy) });
    const books = [[2110, '#1F2A44', 120], [2150, '#E36F5C', 104], [2185, '#E7B04A', 114], [2225, '#F3EBDD', 96]];
    books.forEach(([Z, c, h]) => { s += quad([[X - 80, 952, Z], [X - 80, 952 + h, Z], [X - 80, 952 + h, Z + 32], [X - 80, 952, Z + 32]], K(c, cx, cy)); });
    s += cyl(X - 50, 2440, 28, 952, 1010, K('#F3EBDD', cx, cy), K('#E4D9C5', cx, cy));
    s += C(SX(X - 50, 2440), SY(1050, 2440), 22, K('#5F8E4D', cx, cy)) + C(SX(X - 60, 2420), SY(1030, 2420), 15, K('#7BA65C', cx, cy));
    // brass bell / decor on the shelf
    s += PA(`M${pt(X - 50, 952, 2330)}L${pt(X - 50, 1030, 2350)}L${pt(X - 50, 952, 2370)}Z`, K('#C9A45C', cx, cy));
    // cabinet (walnut, floor standing)
    const c0 = 2000, c1 = 2600, cX = 1290;
    s += quad([[cX - 20, 0, c0 - 30], [X, 0, c0 - 30], [X, 0, c1], [cX - 20, 0, c1]], DARK, `opacity=".3" filter="url(#${P('b6')})"`);
    for (const Z of [c0 + 30, c1 - 30]) s += sq(cX + 20, Z - 12, Z + 12, 0, 40, K('#3A2A1C', cx, 1000));
    s += box(cX, X, 40, 250, c0, c1, { t: K('#9A6B43', cx, 900), f: K('#6A4529', cx, 900), s: K('#7A5233', cx, 900) }, 3);
    const doors = [[c0 + 12, c0 + 196], [c0 + 208, c0 + 392], [c0 + 404, c1 - 12]];
    doors.forEach(([a, b], i) => {
      s += sq(cX - 1, a, b, 56, 236, K(i === 1 ? '#C99A6A' : '#7A5233', cx, 900));
      s += sq(cX - 2, a + 70, b - 70, 200, 210, K('#C9A45C', cx, 900));
    });
    // set-top box, speaker, plant, brass urli on top of the cabinet
    s += box(1330, 1440, 250, 282, 2270, 2420, { t: K('#3A3F4A', cx, 900), f: K('#22262E', cx, 900), s: K('#2A2F38', cx, 900) }, 2);
    s += C(SX(1330, 2300), SY(266, 2300), 2, night ? '#5BE08A' : '#3BA46A');
    s += box(1360, 1440, 250, 420, 2480, 2540, { t: K('#3A3F4A', cx, 900), f: K('#22262E', cx, 900), s: K('#2A2F38', cx, 900) }, 3);
    s += C(SX(1360, 2510), SY(370, 2510), 9, K('#3F4552', cx, 900)) + C(SX(1360, 2510), SY(300, 2510), 12, K('#3F4552', cx, 900));
    s += cyl(1390, 2080, 46, 250, 330, K('#F3EBDD', cx, 900), K('#5A4636', cx, 900));
    const px = SX(1390, 2080), py = SY(330, 2080);
    const lv = [K('#4F8A4E', px, py), K('#6FA35E', px, py), K('#3E7240', px, py)];
    [[-30, -40, -35], [20, -58, 15], [0, -70, -5], [-44, -14, -70], [40, -20, 60], [10, -40, 30]].forEach(([dx, dy, a], i) => {
      s += `<path d="M0 0C10 -10 12 -30 0 -42C-12 -30 -10 -10 0 0Z" fill="${lv[i % 3]}" transform="translate(${n(px + dx * 0.3)} ${n(py + 2)}) rotate(${a}) scale(${n(1 + (i % 2) * 0.25)})"/>`;
    });
    s += flatE(1395, 252, 2210, 52, K('#B08A4F', cx, 900)) + flatE(1395, 256, 2210, 42, K('#C9A45C', cx, 900));
    s += flatE(1385, 258, 2200, 12, K('#E9892F', cx, 900)) + flatE(1405, 258, 2220, 11, K('#F2B33D', cx, 900));
    // the TV
    const t0 = 2080, t1 = 2520, tb = 520, tt = 780, tX = X - 26;
    s += quad([[tX, tb, t0], [X - 4, tb, t0], [X - 4, tt, t0], [tX, tt, t0]], '#14161C');
    s += sq(tX, t0, t1, tb, tt, '#16181E');
    s += sq(tX - 1, t0 + 10, t1 - 10, tb + 10, tt - 10, U('tv'));
    s += sq(tX - 2, t0 + 10, t1 - 10, tb + 10, tt - 10, U('tvref'));
    if (night) s += sq(tX - 2, t0 + 10, t1 - 10, tb + 10, tt - 10, '#FFB25E', 'opacity=".06"');
    s += sq(tX - 2, 2280, 2320, tb - 6, tb + 2, '#2A2D35');
    // ambient occlusion where the right wall recedes behind the cabinet
    s += quad([[X, 0, 1900], [X, 0, ZB], [X, 60, ZB], [X, 60, 1900]], DARK, 'opacity=".08"');
    // wall switch near the front of the right wall
    s += sq(X - 1, 1880, 1925, 500, 610, K('#FBF8F2', 2330, 550));
    return s;
  }

  // ---------- ceiling fan + ceiling light ----------
  function ceilingFan() {
    const FX = 230, FZ = 2290;
    let s = '';
    const cx = SX(FX, FZ), cy = SY(1150, FZ);
    const body = K('#ECE5D8', cx, cy), bodyD = K('#CFC5B4', cx, cy), blade = K('#E6DDCF', cx, cy), bladeD = K('#C8BDAA', cx, cy), trim = K('#9A6B43', cx, cy);
    s += cyl(FX, FZ, 40, 1310, HC, bodyD, body);
    s += R(SX(FX, FZ) - 4, SY(HC - 20, FZ), 8, SY(1170, FZ) - SY(HC - 20, FZ), bodyD);
    // blades (in the plane H=1140, seen from below)
    const Hb = 1142;
    for (let i = 0; i < 3; i++) {
      const a = (i * 120 + 98) * Math.PI / 180;
      const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
      const p = (r, w) => [FX + dx * r + px * w, Hb, FZ + dz * r + pz * w];
      const pts = [p(70, -16), p(120, -34), p(560, -44), p(578, 0), p(560, 44), p(120, 34), p(70, 16)];
      const bc = i === 0 ? bladeD : blade;
      s += `<path d="M${pts.map(q => pt(q[0], q[1], q[2])).join('L')}Z" fill="${bc}" ${rnd(bc, 4)}/>`;
      const sp = [p(120, 0), p(560, -6), p(560, 6)];
      s += `<path d="M${pts.slice(0, 4).map(q => pt(q[0], q[1] - 1, q[2])).join('L')}Z" fill="${bladeD}" opacity=".5"/>`;
      s += `<path d="M${pt(...p(60, -14))}L${pt(...p(150, -14))}L${pt(...p(150, 14))}L${pt(...p(60, 14))}Z" fill="${trim}"/>`;
      void sp;
    }
    s += cyl(FX, FZ, 92, 1118, 1176, body, bodyD);
    s += cyl(FX, FZ, 70, 1100, 1120, trim, trim);
    s += flatE(FX, 1100, FZ, 52, bodyD);
    // flush ceiling light
    const lx = SX(-500, 2500), ly = SY(HC, 2500);
    s += flatE(-500, HC - 4, 2500, 90, night ? K('#E9E2D4') : '#FFFFFF');
    s += flatE(-500, HC - 8, 2500, 70, night ? K('#F3EEE4') : '#F4F7FA');
    void lx; void ly;
    return s;
  }

  // contact shadows where furniture meets the back wall
  function wallAO() {
    const band = (X0, X1, H, h) => R(BX(X0), BY(H) - h, BX(X1) - BX(X0), h + 6, U('aoB'), `filter="url(#${P('b6')})"`);
    let s = band(SX0 + 10, SX1 - 10, 485, 46) + band(-1050, -660, 300, 30) + band(750, 950, 250, 28);
    s += R(BX(SX0 + 10), BY(485), BX(SX1 - 10) - BX(SX0 + 10), BY(60) - BY(485), DARK, `opacity="${night ? 0.25 : 0.12}" filter="url(#${P('b6')})"`);
    return s;
  }

  // ---------- dhurrie rug ----------
  function rug() {
    const x0 = -540, x1 = 940, z0 = 1700, z1 = 2420;
    const cx = 1150, cy = 1120;
    const field = K('#A04A3B', cx, cy), cream = K('#ECDDC2', cx, cy), navy = K('#24304F', cx, cy), mus = K('#E2A843', cx, cy);
    let s = quad([[x0, 1, z0], [x1, 1, z0], [x1, 1, z1], [x0, 1, z1]], field);
    // fringe on the near edge
    let fr = '';
    for (let X = x0 + 10; X < x1; X += 22) fr += `M${pt(X, 1, z0)}L${pt(X, 1, z0 - 26)}`;
    s += ST(fr, cream, 2.2);
    const band = (i0, i1, f) => {
      const a = [[x0 + i0, z0 + i0], [x1 - i0, z0 + i0], [x1 - i0, z1 - i0], [x0 + i0, z1 - i0]];
      const b = [[x0 + i1, z0 + i1], [x0 + i1, z1 - i1], [x1 - i1, z1 - i1], [x1 - i1, z0 + i1]];
      return `<path d="M${a.map(q => pt(q[0], 2, q[1])).join('L')}ZM${b.map(q => pt(q[0], 2, q[1])).join('L')}Z" fill="${f}" fill-rule="evenodd"/>`;
    };
    s += band(30, 90, cream);
    s += band(92, 112, navy);
    s += band(150, 158, mus);
    // zigzag motif in the cream border
    let zz = '';
    const zr = (X0, X1, Z, a) => { let d = ''; for (let X = X0, k = 0; X < X1 - 30; X += 30, k++) d += `${k ? 'L' : 'M'}${pt(X, 3, Z + (k % 2 ? a : -a))}`; return d; };
    zz += zr(x0 + 60, x1 - 40, z0 + 60, 16) + zr(x0 + 60, x1 - 40, z1 - 60, 16);
    s += ST(zz, K('#C8714E', cx, cy), 4, 'stroke-linejoin="round"');
    // central medallion + diamonds
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const dia = (X, Z, rx, rz, f) => `<path d="M${pt(X, 3, Z - rz)}L${pt(X + rx, 3, Z)}L${pt(X, 3, Z + rz)}L${pt(X - rx, 3, Z)}Z" fill="${f}"/>`;
    s += dia(mx, mz, 330, 170, navy) + dia(mx, mz, 280, 136, mus) + dia(mx, mz, 220, 100, field) + dia(mx, mz, 120, 54, cream) + dia(mx, mz, 50, 22, navy);
    for (const [X, Z] of [[x0 + 260, z0 + 230], [x1 - 260, z0 + 230], [x0 + 260, z1 - 230], [x1 - 260, z1 - 230]]) s += dia(X, Z, 60, 34, mus) + dia(X, Z, 26, 14, navy);
    let tri = '';
    for (const [X, Z] of [[x0 + 160, mz], [x1 - 160, mz]]) for (let k = -2; k <= 2; k++) tri += dia(X, Z + k * 48, 22, 16, cream);
    s += tri;
    // subtle wear / pile shading toward the far edge
    s += quad([[x0, 3, z1 - 140], [x1, 3, z1 - 140], [x1, 3, z1], [x0, 3, z1]], DARK, 'opacity=".12"');
    return s;
  }

  // ---------- tea table (mid layer) ----------
  function teaTable() {
    const x0 = -40, x1 = 400, z0 = 1990, z1 = 2230, H = 200;
    const cx = 1110, cy = 990;
    let s = quad([[x0 - 30, 4, z0 - 40], [x1 + 30, 4, z0 - 40], [x1 + 30, 4, z1 + 20], [x0 - 30, 4, z1 + 20]], DARK, `opacity="${night ? 0.38 : 0.26}" filter="url(#${P('b6')})"`);
    const wt = K('#B9875A', cx, cy), wf = K('#9A6B43', cx, cy), ws = K('#7A5233', cx, cy);
    // back legs then lower shelf then front legs
    for (const X of [x0 + 20, x1 - 20]) s += RZ(X - 13, X + 13, 0, H - 20, z1 - 20, ws);
    s += box(x0 + 14, x1 - 14, 48, 64, z0 + 14, z1 - 14, { t: wt, f: wf }, 2);
    // magazines + newspaper on the lower shelf
    s += quad([[30, 66, 2060], [190, 66, 2050], [200, 66, 2170], [40, 66, 2180]], K('#EEE8DC', cx, cy));
    s += quad([[50, 70, 2070], [175, 70, 2068], [180, 70, 2150], [55, 70, 2152]], K('#5AA0D8', cx, cy));
    s += quad([[220, 66, 2060], [360, 66, 2064], [356, 66, 2170], [216, 66, 2166]], K('#F2D16B', cx, cy));
    for (const X of [x0 + 20, x1 - 20]) s += RZ(X - 15, X + 15, 0, H - 20, z0 + 16, wf) + RZ(X - 15, X - 7, 0, H - 20, z0 + 15, wt, 0, 'opacity=".5"');
    // top slab with a glass inlay
    s += box(x0, x1, H - 26, H, z0, z1, { t: wt, f: wf }, 4);
    s += quad([[x0 + 30, H + 1, z0 + 24], [x1 - 30, H + 1, z0 + 24], [x1 - 30, H + 1, z1 - 24], [x0 + 30, H + 1, z1 - 24]], K('#8E6A47', cx, cy));
    s += quad([[x0 + 34, H + 2, z0 + 28], [x1 - 34, H + 2, z0 + 28], [x1 - 34, H + 2, z1 - 28], [x0 + 34, H + 2, z1 - 28]], K('#A3D1D6', cx, cy), 'opacity=".28"');
    s += quad([[x0 + 120, H + 3, z0 + 28], [x0 + 190, H + 3, z0 + 28], [x0 + 130, H + 3, z1 - 28], [x0 + 60, H + 3, z1 - 28]], '#FFFFFF', `opacity="${night ? 0.07 : 0.22}"`);
    s += ST(`M${pt(x0 + 6, H - 3, z0)}L${pt(x1 - 6, H - 3, z0)}`, K(tint('#B9875A', 0.3), cx, cy), 2.5);
    // folded newspaper
    const np = [[250, H + 4, 2150], [395, H + 4, 2140], [400, H + 4, 2222], [256, H + 4, 2228]];
    s += quad(np, K('#F1EDE3', cx, cy));
    let ln = '';
    for (let i = 0; i < 4; i++) ln += `M${pt(300, H + 5, 2160 + i * 15)}L${pt(385, H + 5, 2156 + i * 15)}`;
    s += ST(ln, K('#9AA1AC', cx, cy), 1.6) + quad([[262, H + 5, 2162], [292, H + 5, 2160], [294, H + 5, 2200], [264, H + 5, 2202]], K('#7F8794', cx, cy));
    s += ST(`M${pt(262, H + 5, 2150)}L${pt(330, H + 5, 2147)}`, K('#3A3F4A', cx, cy), 3);
    // plate of biscuits
    s += flatE(215, H + 4, 2100, 58, K('#E9EDF1', cx, cy)) + flatE(215, H + 5, 2100, 44, K('#D7DCE2', cx, cy));
    for (let i = 0; i < 4; i++) s += flatE(195 + i * 14, H + 8 + i * 1.5, 2096 - i * 4, 24, K(i % 2 ? '#E2A843' : '#D69A3A', cx, cy));
    // two cups of chai on saucers
    const cup = (X, Z) => {
      const x = SX(X, Z), s0 = SC(Z);
      let o = flatE(X, H + 3, Z, 34, K('#F4F1EA', cx, cy)) + flatE(X, H + 4, Z, 24, K('#E2DDD2', cx, cy));
      o += cyl(X, Z, 20, H + 4, H + 46, K('#F7F4EE', cx, cy), K('#8A5A32', cx, cy));
      o += R(x - 20 * s0, SY(H + 30, Z), 40 * s0, 5 * s0, K('#C8714E', cx, cy));
      o += PA(`M${n(x + 19 * s0)} ${n(SY(H + 38, Z))}C${n(x + 34 * s0)} ${n(SY(H + 40, Z))} ${n(x + 34 * s0)} ${n(SY(H + 14, Z))} ${n(x + 19 * s0)} ${n(SY(H + 16, Z))}`, 'none', `stroke="${K('#F7F4EE', cx, cy)}" stroke-width="${n(6 * s0)}"`);
      o += R(x - 20 * s0 + 3, SY(H + 44, Z), 5, 34 * s0, '#FFFFFF', 'opacity=".55"');
      return o;
    };
    s += cup(60, 2130) + cup(125, 2080);
    // steam (day only, chai is fresh)
    if (!night) s += ST(`M${n(SX(60, 2130))} ${n(SY(H + 52, 2130))}c-8 -14 8 -22 0 -38M${n(SX(125, 2080))} ${n(SY(H + 52, 2080))}c8 -14 -8 -22 0 -40`, '#FFFFFF', 3, 'opacity=".55"');
    // steel tumbler + TV remote
    s += cyl(355, 2040, 20, H + 4, H + 64, K('#C3CAD2', cx, cy), K('#E3E8EE', cx, cy)) + R(SX(355, 2040) - 6, SY(H + 60, 2040), 4, 50, '#FFFFFF', 'opacity=".6"');
    s += quad([[-10, H + 4, 2040], [60, H + 4, 2034], [62, H + 4, 2056], [-8, H + 4, 2062]], K('#2A2F38', cx, cy));
    s += C(SX(46, 2046), SY(H + 5, 2046), 2.2, K('#C8161E', cx, cy));
    return s;
  }

  // ---------- light overlays ----------
  function lightsDay() {
    let s = '';
    // window glow on the wall + a soft beam to the floor
    s += E(BX(-850), BY(780), 360, 330, U('sun'), 'style="mix-blend-mode:screen"');
    s += PA(`M${n(BX(-1150))} ${n(BY(1150))}H${n(BX(-560))}L${pt(-80, 0, 2050)}L${pt(-900, 0, 2050)}Z`, U('beam'), `opacity=".35" filter="url(#${P('soft')})" style="mix-blend-mode:screen"`);
    // sun patch on the floor with the grill pattern
    s += quad([[-1140, 2, 2640], [-560, 2, 2640], [-260, 2, 2140], [-860, 2, 2140]], '#FFF6E0', `opacity=".38" filter="url(#${P('b3')})"`);
    let gs = '';
    for (let i = 1; i < 10; i++) { const u = i / 10; gs += `M${pt(-1140 + 580 * u, 3, 2640)}L${pt(-860 + 600 * u, 3, 2140)}`; }
    gs += `M${pt(-1140, 3, 2390)}L${pt(-410, 3, 2390)}`;
    s += ST(gs, '#D8C6AA', 3, 'opacity=".45"');
    // bounce light on the sofa wall
    s += E(1120, 640, 520, 260, U('sun'), 'opacity=".35" style="mix-blend-mode:screen"');
    return s;
  }
  function lightsNight() {
    let s = '';
    // moonlight from the window
    s += quad([[-1140, 2, 2640], [-560, 2, 2640], [-260, 2, 2120], [-860, 2, 2120]], '#6F8BC9', `opacity=".14" filter="url(#${P('soft')})"`);
    s += E(BX(-850), BY(780), 300, 300, U('cool'));
    // floor lamp pools (wall + floor)
    const lx = SX(LX, LZ + 20), ly = SY(700, LZ + 20);
    s += E(lx, ly, 440, 400, U('warm'), 'style="mix-blend-mode:screen"');
    s += E(lx, BY(HC) - 6, 230, 46, U('pool'), 'style="mix-blend-mode:screen"');
    s += E(lx + 20, SY(0, LZ), 330, 70, U('pool'), 'style="mix-blend-mode:screen"');
    // table lamp
    const tx = SX(850, 2580), ty = SY(480, 2580);
    s += E(tx, ty, 300, 270, U('warm'), 'opacity=".85" style="mix-blend-mode:screen"');
    s += E(tx, SY(250, 2560), 150, 40, U('pool'), 'style="mix-blend-mode:screen"');
    // the near part of the right wall falls off into darkness
    s += quad([[XR - 1, -5, 1200], [XR - 1, HC, 1200], [XR - 1, HC, 2000], [XR - 1, -5, 2000]], '#0A0E1C', 'opacity=".28"');
    // kitchen light spilling through the doorway onto the floor
    s += PA(`M${pt(DX0, 1, ZB)}L${pt(DX1, 1, ZB)}L${pt(DX1 + 260, 1, 2050)}L${pt(DX0 - 160, 1, 2050)}Z`, '#FFC983', `opacity=".22" filter="url(#${P('soft')})" style="mix-blend-mode:screen"`);
    return s;
  }

  // ---------- foreground (blurred by the engine) ----------
  function fore() {
    let s = '';
    const lv = night ? ['#16261D', '#1C3024', '#101C14'] : ['#3F7A4E', '#4F8E5B', '#2F6040'];
    const leaf = (x, y, a, k, c) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})"><path d="M0 0C60 -30 110 -120 60 -220C40 -260 0 -270 0 -270C0 -270 -40 -260 -60 -220C-110 -120 -60 -30 0 0Z" fill="${c}"/><path d="M0 -10V-250" stroke="${shade(c, 0.3)}" stroke-width="5" fill="none"/></g>`;
    s += leaf(-20, 1380, 30, 1.3, lv[0]) + leaf(90, 1400, 8, 1.05, lv[1]) + leaf(-60, 1300, 62, 1.1, lv[2]) + leaf(180, 1420, -18, 0.9, lv[0]);
    // brass lota on a stool corner at the bottom right
    const wood = night ? '#3A2A20' : '#7A5233', woodT = night ? '#4A3628' : '#9A6B43';
    s += `<path d="M2140 1350L2190 1236H2420V1350Z" fill="${woodT}"/><path d="M2140 1350L2190 1236H2420V1258H2205L2162 1350Z" fill="${wood}" opacity=".6"/>`;
    const br = night ? '#8A6A36' : '#C9A45C', brD = night ? '#6A4F28' : '#A7843F';
    s += `<path d="M2262 1240C2222 1236 2214 1180 2246 1160C2236 1150 2240 1138 2256 1136H2304C2320 1138 2324 1150 2314 1160C2346 1180 2338 1236 2298 1240Z" fill="${br}"/><path d="M2280 1240C2320 1236 2328 1180 2300 1162H2314C2346 1180 2338 1236 2298 1240Z" fill="${brD}"/><ellipse cx="2280" cy="1137" rx="26" ry="6" fill="${brD}"/>`;
    return s;
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      sofa_left: { x: 900, zone: 'front' },
      sofa_right: { x: 1300, zone: 'front' },
      stand: { x: 1900, zone: 'front' }
    },
    draw(opts) {
      opts = opts || {};
      night = opts.time === 'night';
      rain = !!opts.rain;
      // ----- back -----
      LAYER = '';
      let back = defs();
      back += shell();
      back += ceilingFan();
      back += windowBlock();
      back += wallAO();
      back += console_();
      back += curtains();
      back += familyPhoto();
      back += madhubani();
      back += switchboard();
      back += wallClock();
      back += doorway();
      back += tvWall();
      back += rug();
      back += sideTable();
      back += floorLamp();
      back += sofa();
      back += night ? lightsNight() : lightsDay();
      back += R(0, 0, 2400, 1350, U('vig'));
      // ----- mid -----
      LAYER = 'm_';
      let mid = defs() + teaTable();
      // ----- front -----
      const front = '';
      // ----- fore -----
      LAYER = 'f_';
      const fr = fore();
      LAYER = '';
      return { back, mid, front, fore: fr };
    }
  };
})();
