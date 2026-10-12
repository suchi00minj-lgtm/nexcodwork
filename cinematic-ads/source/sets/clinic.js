// clinic — a general physician's consulting cabin, front view.
// World 2400x1350, floor line y=1250 (character plane, s=1).
// One-point perspective: eye height 660 units, vanishing point (1250, 590).
// A point (X lateral, H height above floor, Z depth) projects with s = D/Z.
// Doctor's desk across the right half (front layer, top y≈885), executive chair behind,
// examination couch with a privacy curtain on the left, window with venetian blinds,
// degree certificates, eye chart, steel medicine cupboard on the right.
window.SETS = window.SETS || {};
(function () {
  const ID = 'clinic';
  let LAYER = '';
  const P = s => ID + '_' + LAYER + s;
  const U = s => 'url(#' + P(s) + ')';
  const D = 1800, VPX = 1250, VPY = 590, EYE = 660;
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
  const DARK = '#1E2433';
  const shade = (c, t) => mix(c, DARK, t);
  const tint = (c, t) => mix(c, '#FFFFFF', t);

  // ---------- lighting ----------
  // Evening OPD: tube lights on, so the room stays readable; cooler and dimmer than day.
  let night = false, rain = false;
  function nightify(c) { const [r, g, b] = hx(c); return toHex([r * 0.6 + 8, g * 0.64 + 12, b * 0.72 + 30]); }
  function warmLit(c) { const [r, g, b] = hx(c); return toHex([r * 0.95 + 16, g * 0.84 + 8, b * 0.62 + 4]); }
  const LIGHTS = [[1080, 700, 260, 0.6]];   // desk lamp
  function K(c, x, y) {
    if (!night) return c;
    const nc = nightify(c);
    if (x === undefined) return nc;
    let f = 0;
    for (const [lx, ly, r, a] of LIGHTS) f += a * Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (r * r));
    return f < 0.02 ? nc : mix(nc, warmLit(c), Math.min(0.8, f));
  }

  // ---------- primitives ----------
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(Math.max(0.3, ry))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const PA = (d, f, ex) => `<path d="${d}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const ST = (d, col, w, ex) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"${ex ? ' ' + ex : ''}/>`;
  const quad = (pts, f, ex) => `<path d="M${pts.map(p => pt(p[0], p[1], p[2])).join('L')}Z" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const rnd = (f, w) => `stroke="${f}" stroke-width="${w}" stroke-linejoin="round"`;
  const T = (x, y, size, fill, txt, ex) => `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" fill="${fill}"${ex ? ' ' + ex : ''}>${txt}</text>`;
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
  function RZ(X0, X1, H0, H1, Z, f, rx, ex) {
    const s = SC(Z);
    return R(SX(X0, Z), SY(H1, Z), (X1 - X0) * s, (H1 - H0) * s, f, (rx ? `rx="${n(rx * s)}"` : '') + (ex ? ' ' + ex : ''));
  }
  const sq = (X, z0, z1, h0, h1, f, ex) => quad([[X, h0, z0], [X, h1, z0], [X, h1, z1], [X, h0, z1]], f, ex);
  function flatE(X, H, Z, r, f, ex) {
    const y0 = SY(H, Z - r), y1 = SY(H, Z + r);
    return E(SX(X, Z), (y0 + y1) / 2, r * SC(Z), Math.abs(y0 - y1) / 2, f, ex);
  }
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
  const ZB = 2600, XL = -1350, XR = 1350, HC = 1300, DADO = 520;
  const BX = X => SX(X, ZB), BY = H => SY(H, ZB);
  const WALL = '#F5F1E8', MINT = '#CFE4D8', WALL_S = '#EAE4D8';

  function defs() {
    const lg = (id, stops, at) => `<linearGradient id="${P(id)}" ${at || 'x1="0" y1="0" x2="0" y2="1"'}>${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
    const rg = (id, stops, at) => `<radialGradient id="${P(id)}" ${at || ''}>${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;
    const sky = night ? [[0, '#0B1532'], [0.6, '#1A2B55'], [1, '#2C4475']]
      : rain ? [[0, '#8692A3'], [1, '#C3CAD3']] : [[0, '#9CCBEA'], [0.7, '#D2E8F3'], [1, '#EEF4EE']];
    const vig = night ? '#060A18' : '#141A26';
    return `<defs>
${lg('sky', sky)}
${lg('floor', night ? [[0, '#7E8496'], [1, '#8E92A0']] : [[0, '#D3D1CA'], [1, '#E6E4DE']])}
${lg('wallV', [[0, DARK, 0.14], [0.1, DARK, 0.02], [0.85, DARK, 0], [1, DARK, 0.1]])}
${lg('aoR', [[0, DARK, 0], [1, DARK, 0.18]], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('aoL', [[0, DARK, 0.18], [1, DARK, 0]], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('aoB', [[0, DARK, 0], [1, DARK, night ? 0.26 : 0.18]])}
${lg('aoT', [[0, DARK, 0.22], [1, DARK, 0]])}
${lg('glass', [[0, '#FFFFFF', 0], [0.45, '#FFFFFF', night ? 0.08 : 0.3], [0.55, '#FFFFFF', night ? 0.03 : 0.12], [1, '#FFFFFF', 0]], 'x1="0" y1="0" x2="1" y2="1"')}
${lg('beam', [[0, '#FFF7E4', 0.5], [1, '#FFF7E4', 0]])}
${lg('chair', [[0, '#3A4664'], [1, '#232B40']])}
${lg('desk', [[0, '#F1F3F5'], [1, '#DDE2E8']])}
${lg('tube', [[0, '#FFFFFF', 0], [0.5, '#FFFFFF', 1], [1, '#FFFFFF', 0]])}
${lg('mercury', [[0, '#E9EEF2'], [1, '#C9D2DA']], 'x1="0" y1="0" x2="1" y2="0"')}
${lg('cone', [[0, '#FFD597', 0.5], [1, '#FFD597', 0]])}
${rg('tubeglow', [[0, '#EAF4FF', night ? 0.6 : 0.25], [1, '#EAF4FF', 0]])}
${rg('warm', [[0, '#FFC777', 0.55], [0.3, '#FFB25E', 0.22], [1, '#FF9C48', 0]])}
${rg('pool', [[0, '#FFD08A', 0.5], [1, '#FFD08A', 0]])}
${rg('sun', [[0, '#FFF7E2', 0.5], [1, '#FFF7E2', 0]])}
${rg('vig', [[0.55, vig, 0], [1, vig, night ? 0.5 : 0.2]], 'cx=".5" cy=".46" r=".78"')}
<clipPath id="${P('win')}"><rect x="${n(BX(-500))}" y="${n(BY(1150))}" width="${n(BX(150) - BX(-500))}" height="${n(BY(450) - BY(1150))}"/></clipPath>
<filter id="${P('soft')}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="${P('b6')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${P('b3')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;
  }

  // ---------- shell ----------
  function shell() {
    let s = R(0, 0, 2400, 1350, K(WALL_S));
    const bx0 = BX(XL), bx1 = BX(XR), by0 = BY(HC), by1 = BY(0), byd = BY(DADO);
    // ceiling
    s += quad([[XL, HC, ZB], [XR, HC, ZB], [XR, HC, 1300], [XL, HC, 1300]], K('#F7F6F2'));
    // back wall: warm white above, mint dado below with a chair rail
    s += R(bx0, by0, bx1 - bx0, byd - by0, K(WALL));
    s += R(bx0, byd, bx1 - bx0, by1 - byd, K(MINT));
    // side walls
    s += quad([[XL, -5, ZB], [XL, HC, ZB], [XL, HC, 1300], [XL, -5, 1300]], K('#ECE6DA'));
    s += quad([[XL, -5, ZB], [XL, DADO, ZB], [XL, DADO, 1300], [XL, -5, 1300]], K('#C6DCCF'));
    s += quad([[XR, -5, ZB], [XR, HC, ZB], [XR, HC, 1300], [XR, -5, 1300]], K('#EFE9DE'));
    s += quad([[XR, -5, ZB], [XR, DADO, ZB], [XR, DADO, 1300], [XR, -5, 1300]], K('#C9DFD2'));
    // chair rails
    const rail = K('#9FC2AF'), railL = K('#E3F0E8');
    s += R(bx0, byd - 5, bx1 - bx0, 9, rail) + R(bx0, byd - 5, bx1 - bx0, 3, railL);
    s += quad([[XL, DADO - 7, ZB], [XL, DADO + 7, ZB], [XL, DADO + 7, 1300], [XL, DADO - 7, 1300]], rail);
    s += quad([[XR, DADO - 7, ZB], [XR, DADO + 7, ZB], [XR, DADO + 7, 1300], [XR, DADO - 7, 1300]], rail);
    // floor: 60 cm vitrified tiles
    s += quad([[XL, 0, ZB], [XR, 0, ZB], [XR, 0, 1300], [XL, 0, 1300]], U('floor'));
    const rng = mulberry32(21);
    let tl = '';
    const TS = 268;
    for (let Z = ZB; Z > 1350; Z -= TS) for (let X = XL; X < XR; X += TS) {
      if (rng() < 0.5) continue;
      const x1 = Math.min(XR, X + TS), z1 = Math.max(1350, Z - TS);
      tl += `M${pt(X, 0, Z)}L${pt(x1, 0, Z)}L${pt(x1, 0, z1)}L${pt(X, 0, z1)}Z`;
    }
    s += PA(tl, '#FFFFFF', `opacity="${night ? 0.04 : 0.12}"`);
    let g = '';
    for (let X = XL; X <= XR; X += TS) g += `M${pt(X, 0, ZB)}L${pt(X, 0, 1350)}`;
    for (let Z = ZB; Z > 1350; Z -= TS) g += `M${pt(XL, 0, Z)}L${pt(XR, 0, Z)}`;
    s += ST(g, K('#B9B6AE'), 2, 'opacity=".75"');
    // skirting
    s += R(bx0, BY(60), bx1 - bx0, by1 - BY(60), K('#A9C9B8'));
    s += quad([[XL, 0, ZB], [XL, 60, ZB], [XL, 60, 1300], [XL, 0, 1300]], K('#A2C3B1'));
    s += quad([[XR, 0, ZB], [XR, 60, ZB], [XR, 60, 1300], [XR, 0, 1300]], K('#A2C3B1'));
    // cornice
    s += R(bx0, by0, bx1 - bx0, 22, K('#FAF8F3')) + R(bx0, by0 + 22, bx1 - bx0, 3, K('#DCD6CA'));
    // AO
    s += R(bx0, by0, bx1 - bx0, by1 - by0, U('wallV'));
    s += R(bx0, by0, 60, by1 - by0, U('aoL')) + R(bx1 - 60, by0, 60, by1 - by0, U('aoR'));
    s += R(bx0, by1 - 24, bx1 - bx0, 24, U('aoB'));
    s += R(bx0, by1 - 1, bx1 - bx0, 3, K('#8FAF9E'), 'opacity=".6"');
    return s;
  }

  // ---------- window with venetian blinds ----------
  const WX0 = -500, WX1 = 150, WH0 = 450, WH1 = 1150, ZW = ZB + 60;
  function windowBlock() {
    const ox0 = BX(WX0), ox1 = BX(WX1), oy0 = BY(WH1), oy1 = BY(WH0), w = ox1 - ox0, h = oy1 - oy0;
    const rng = mulberry32(night ? 77 : 66);
    let v = R(ox0, oy0, w, h, U('sky'));
    // view: a peepal tree and the hospital block across the road
    const bc = night ? '#1E2846' : rain ? '#A9AFB8' : '#E3DCCF', bcS = night ? '#18203A' : rain ? '#959BA5' : '#CFC6B6';
    v += R(ox0 + w * 0.45, oy0 + h * 0.38, w * 0.6, h, bc) + R(ox0 + w * 0.45, oy0 + h * 0.38, w * 0.6, 12, bcS);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const lit = night && (r + c * 2) % 3 === 0;
      v += R(ox0 + w * 0.5 + c * 44, oy0 + h * 0.45 + r * 52, 30, 34, lit ? '#F4CF84' : night ? '#121A30' : rain ? '#77828F' : '#8FA9BC');
    }
    // red cross on the hospital block
    if (!night) v += R(ox0 + w * 0.86, oy0 + h * 0.3, 40, 12, '#C8161E') + R(ox0 + w * 0.86 + 14, oy0 + h * 0.3 - 14, 12, 40, '#C8161E');
    else v += R(ox0 + w * 0.86, oy0 + h * 0.3, 40, 12, '#FF4A4A') + R(ox0 + w * 0.86 + 14, oy0 + h * 0.3 - 14, 12, 40, '#FF4A4A') + C(ox0 + w * 0.86 + 20, oy0 + h * 0.3 + 6, 40, '#FF5A5A', 'opacity=".2"');
    const lv = night ? ['#0F1A2E', '#132036', '#0C1526'] : rain ? ['#5F7F5A', '#4F6E4C', '#6D8E66'] : ['#6FA35A', '#5A8E4A', '#86B86C'];
    v += R(ox0 + w * 0.2, oy0 + h * 0.55, 16, h * 0.5, night ? '#0B1220' : '#6B513C');
    const bl = [[0.05, 0.4, 90], [0.24, 0.3, 100], [0.4, 0.46, 80], [0.12, 0.62, 90], [0.32, 0.66, 80], [0.02, 0.85, 90], [0.3, 0.9, 80]];
    bl.forEach(([a, b, r], i) => { v += C(ox0 + w * a, oy0 + h * b, r, lv[i % 3]); });
    if (!night) bl.forEach(([a, b, r]) => { v += C(ox0 + w * a - r * 0.3, oy0 + h * b - r * 0.3, r * 0.4, lv[2], 'opacity=".6"'); });
    if (rain) { let rs = ''; for (let i = 0; i < 70; i++) rs += `M${n(ox0 + rng() * (w + 60))} ${n(oy0 + rng() * h)}l-9 28`; v += ST(rs, '#E8EEF6', 1.4, `opacity="${night ? 0.35 : 0.55}"`); }
    // glass
    v += R(ox0, oy0, w, h, U('glass'));
    // aluminium sliding frame
    const al = K('#E6EAEE'), alD = K('#BFC6CE');
    const t = 26;
    v += quad([[WX0, WH1, ZW], [WX1, WH1, ZW], [WX1, WH1 - t, ZW], [WX0, WH1 - t, ZW]], al);
    v += quad([[WX0, WH0 + t, ZW], [WX1, WH0 + t, ZW], [WX1, WH0, ZW], [WX0, WH0, ZW]], al);
    v += quad([[WX0, WH0, ZW], [WX0 + t, WH0, ZW], [WX0 + t, WH1, ZW], [WX0, WH1, ZW]], al);
    v += quad([[WX1 - t, WH0, ZW], [WX1, WH0, ZW], [WX1, WH1, ZW], [WX1 - t, WH1, ZW]], al);
    v += quad([[-190, WH0, ZW], [-160, WH0, ZW], [-160, WH1, ZW], [-190, WH1, ZW]], al);
    v += quad([[-160, WH0, ZW], [-154, WH0, ZW], [-154, WH1, ZW], [-160, WH1, ZW]], alD);
    // reveals (both jambs face the camera: the window straddles the eye axis)
    const rv = K('#E8E2D6');
    v += quad([[WX0, WH0, ZB], [WX0, WH1, ZB], [WX0, WH1, ZW], [WX0, WH0, ZW]], rv);
    v += quad([[WX1, WH0, ZB], [WX1, WH1, ZB], [WX1, WH1, ZW], [WX1, WH0, ZW]], K('#DCD5C8'));
    v += quad([[WX0, WH1, ZB], [WX1, WH1, ZB], [WX1, WH1, ZW], [WX0, WH1, ZW]], K('#D4CDBF'));
    v += quad([[WX0, WH0, ZB], [WX1, WH0, ZB], [WX1, WH0, ZW], [WX0, WH0, ZW]], K('#F1EDE5'));
    let s = `<g clip-path="url(#${P('win')})">${v}</g>`;
    s += R(ox0, oy0, w, 16, U('aoT'));
    // venetian blind (mounted inside the opening, lowered ~60 %)
    const bz = ZB + 10, bx0 = SX(WX0 + 6, bz), bx1 = SX(WX1 - 6, bz);
    const top = SY(WH1 - 4, bz), bottom = SY(720, bz);
    const slat = K('#F1EEE6'), slatD = K('#D6D1C5'), slatL = K('#FFFFFF');
    s += R(bx0 - 4, top - 4, bx1 - bx0 + 8, 18, K('#E9E5DC'), 'rx="3"') + R(bx0 - 4, top + 10, bx1 - bx0 + 8, 3, K('#C9C3B6'));
    let sl = '', sd = '', sh = '';
    for (let y = top + 22; y < bottom - 8; y += 17) {
      sl += `M${n(bx0)} ${n(y)}H${n(bx1)}V${n(y + 9)}H${n(bx0)}Z`;
      sd += `M${n(bx0)} ${n(y + 9)}H${n(bx1)}V${n(y + 11.5)}H${n(bx0)}Z`;
      sh += `M${n(bx0)} ${n(y)}H${n(bx1)}V${n(y + 1.6)}H${n(bx0)}Z`;
    }
    s += PA(sl, slat) + PA(sd, slatD, 'opacity=".9"') + PA(sh, slatL, 'opacity=".8"');
    s += R(bx0 - 2, bottom - 10, bx1 - bx0 + 4, 12, K('#E3DED3'), 'rx="3"') + R(bx0 - 2, bottom + 1, bx1 - bx0 + 4, 2, K('#BFB8AA'));
    // ladder tapes + pull cord
    for (const u of [0.18, 0.5, 0.82]) s += R(bx0 + (bx1 - bx0) * u - 1.5, top + 14, 3, bottom - top - 18, slatD, 'opacity=".6"');
    s += ST(`M${n(bx1 - 16)} ${n(top + 12)}V${n(bottom + 120)}`, K('#BFB8AA'), 2) + E(bx1 - 16, bottom + 128, 4, 9, K('#E7E2D8'));
    // sill
    s += box(WX0 - 30, WX1 + 30, WH0 - 22, WH0, ZB - 50, ZB, { t: K('#F4F1EB'), f: K('#DCD6CA') }, 2);
    return s;
  }

  // ---------- tube light (wall-mounted batten) ----------
  function tubeLight() {
    const x0 = BX(-470), x1 = BX(120), y = BY(1215);
    let s = '';
    if (night) s += E((x0 + x1) / 2, y + 10, (x1 - x0) * 0.85, 150, U('tubeglow'), 'style="mix-blend-mode:screen"');
    s += R(x0, y - 9, x1 - x0, 18, K('#E9ECEF'), 'rx="8"') + R(x0, y + 4, x1 - x0, 5, K('#C9CFD6'), 'rx="2"');
    s += R(x0 + 10, y - 4, x1 - x0 - 20, 9, night ? '#FFFFFF' : '#F7FAFC', 'rx="4"');
    if (night) s += R(x0 + 10, y - 10, x1 - x0 - 20, 22, '#EAF4FF', `opacity=".55" filter="url(#${P('b6')})"`);
    return s;
  }

  // ---------- ceiling fan ----------
  function ceilingFan() {
    const FX = -520, FZ = 2120;
    const body = K('#EEF0F2'), bodyD = K('#C9CED5'), blade = K('#E9ECEF'), bladeD = K('#C4CAD2'), trim = K('#9AA3AF');
    let s = cyl(FX, FZ, 36, 1272, HC, bodyD, body);
    s += R(SX(FX, FZ) - 4, SY(HC - 20, FZ), 8, SY(1150, FZ) - SY(HC - 20, FZ), bodyD);
    const Hb = 1122;
    for (let i = 0; i < 3; i++) {
      const a = (i * 120 + 98) * Math.PI / 180;
      const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
      const p = (r, w) => [FX + dx * r + px * w, Hb, FZ + dz * r + pz * w];
      const pts = [p(70, -16), p(120, -32), p(560, -40), p(576, 0), p(560, 40), p(120, 32), p(70, 16)];
      const bc = i === 0 ? bladeD : blade;
      s += `<path d="M${pts.map(q => pt(q[0], q[1], q[2])).join('L')}Z" fill="${bc}" ${rnd(bc, 4)}/>`;
      s += `<path d="M${pt(...p(60, -14))}L${pt(...p(140, -14))}L${pt(...p(140, 14))}L${pt(...p(60, 14))}Z" fill="${trim}"/>`;
    }
    s += cyl(FX, FZ, 88, 1100, 1156, body, bodyD);
    s += flatE(FX, 1100, FZ, 50, bodyD);
    return s;
  }

  // ---------- anatomy poster ----------
  function anatomyPoster() {
    const x0 = BX(-1110), x1 = BX(-770), y0 = BY(1180), y1 = BY(700);
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
    let s = R(x0 + 4, y0 + 6, w, h, DARK, `opacity=".18" filter="url(#${P('b3')})"`);
    s += R(x0, y0, w, h, K('#FDFCF8')) + R(x0, y0, w, 30, K('#1F2A44'));
    s += T(cx, y0 + 20, 13, K('#FFFFFF'), 'HUMAN ANATOMY', 'font-weight="600" text-anchor="middle" letter-spacing="1.5"');
    // body outline
    const bx = cx, by = y0 + 56, k = h / 330;
    const skin = K('#F0C9A8'), outl = K('#D9A47E');
    const body = `M${n(bx)} ${n(by)}c14 0 22 10 22 24s-8 26-14 30v6c18 2 38 8 44 22l12 72c2 10-8 12-12 4l-14-62-4 0 2 78c0 40-4 70-8 96h-14l-6-90h-4l-6 90h-14c-4-26-8-56-8-96l2-78-4 0-14 62c-4 8-14 6-12-4l12-72c6-14 26-20 44-22v-6c-6-4-14-16-14-30s8-24 22-24z`;
    s += `<g transform="translate(${n(bx)} ${n(by)}) scale(${n(k)}) translate(${n(-bx)} ${n(-by)})">`;
    s += PA(body, skin, `stroke="${outl}" stroke-width="2"`);
    // organs
    s += E(bx - 9, by + 84, 9, 15, K('#E79A9A')) + E(bx + 10, by + 84, 9, 15, K('#E79A9A'));
    s += PA(`M${n(bx + 1)} ${n(by + 82)}c4 -6 12 -4 12 3c0 7 -8 12 -12 16c-4 -4 -12 -9 -12 -16c0 -7 8 -9 12 -3z`, K('#C8161E'));
    s += E(bx + 8, by + 112, 11, 7, K('#A86A4A')) + E(bx - 6, by + 114, 8, 6, K('#E7B04A'));
    s += PA(`M${n(bx - 14)} ${n(by + 126)}h28v24h-28z`, K('#E9A3A3'), 'rx="6"');
    let intest = '';
    for (let i = 0; i < 4; i++) intest += `M${n(bx - 12)} ${n(by + 130 + i * 5)}H${n(bx + 12)}`;
    s += ST(intest, K('#C97F7F'), 1.6);
    s += ST(`M${n(bx)} ${n(by + 34)}V${n(by + 76)}`, K('#5AA0D8'), 2.4) + ST(`M${n(bx - 1)} ${n(by + 92)}V${n(by + 170)}`, K('#5AA0D8'), 1.6, 'opacity=".7"');
    s += '</g>';
    // label lines
    let lab = '';
    for (const [ly, side] of [[0.32, -1], [0.42, 1], [0.5, -1], [0.58, 1]]) {
      const yy = y0 + h * ly, xa = side < 0 ? x0 + 14 : x1 - 14;
      lab += `M${n(xa)} ${n(yy)}H${n(cx + side * 22)}`;
      s += R(side < 0 ? x0 + 10 : x1 - 46, yy - 12, 36, 4, K('#AEB6C2'));
    }
    s += ST(lab, K('#6B7686'), 1);
    s += R(x0 + 8, y1 - 26, w - 16, 5, K('#AEB6C2')) + R(x0 + 8, y1 - 16, w * 0.6, 5, K('#AEB6C2'));
    // pins
    s += C(x0 + 8, y0 + 40, 3.5, K('#C8161E')) + C(x1 - 8, y0 + 40, 3.5, K('#C8161E'));
    return s;
  }

  // ---------- examination couch + privacy curtain + footstep ----------
  function examCouch() {
    let s = '';
    const x0 = -1330, x1 = -580, z0 = 2330, z1 = 2590;
    s += quad([[x0, 0, z0 - 40], [x1 + 30, 0, z0 - 40], [x1 + 30, 0, z1], [x0, 0, z1]], DARK, `opacity=".22" filter="url(#${P('b6')})"`);
    const steel = K('#B7C0CB'), steelD = K('#8F9AA8'), steelL = K('#DDE3EA');
    // legs + lower bar
    for (const X of [x0 + 30, x1 - 30]) s += RZ(X - 12, X + 12, 0, 300, z0 + 20, steel) + RZ(X - 12, X - 6, 0, 300, z0 + 19, steelL);
    s += RZ(x0 + 30, x1 - 30, 90, 110, z0 + 22, steelD);
    s += quad([[x0 + 40, 100, z0 + 30], [x1 - 40, 100, z0 + 30], [x1 - 40, 100, z1 - 20], [x0 + 40, 100, z1 - 20]], K('#9AA5B2'), 'opacity=".5"');
    // frame + mattress
    s += box(x0, x1, 280, 310, z0, z1, { t: steel, f: steelD }, 2);
    const mat = K('#3F8D7E'), matT = K('#56A493'), matD = K('#2F6E62');
    s += box(x0 + 10, x1 - 10, 310, 352, z0 + 6, z1 - 6, { t: matT, f: mat }, 10);
    // inclined backrest at the head end (left)
    s += PA(`M${pt(x0 + 10, 352, z0 + 6)}L${pt(x0 + 10, 352, z1 - 6)}L${pt(x0 + 120, 560, z1 - 6)}L${pt(x0 + 120, 560, z0 + 6)}Z`, matT, rnd(matT, 10));
    s += PA(`M${pt(x0 + 120, 560, z0 + 6)}L${pt(x0 + 160, 545, z0 + 6)}L${pt(x0 + 50, 352, z0 + 6)}L${pt(x0 + 10, 352, z0 + 6)}Z`, mat, rnd(mat, 6));
    // disposable paper sheet + pillow
    s += quad([[x0 + 220, 353, z0 + 30], [x1 - 40, 353, z0 + 30], [x1 - 40, 353, z1 - 30], [x0 + 220, 353, z1 - 30]], K('#F4F6F7'));
    s += quad([[x0 + 220, 353, z0 + 30], [x1 - 40, 353, z0 + 30], [x1 - 40, 330, z0 + 28], [x0 + 220, 330, z0 + 28]], K('#E2E7EA'));
    s += E(SX(x0 + 120, 2460), SY(500, 2460), 52, 22, K('#FFFFFF'), 'transform="rotate(-38 ' + n(SX(x0 + 120, 2460)) + ' ' + n(SY(500, 2460)) + ')"');
    s += ST(`M${pt(x0 + 20, 340, z0 + 4)}L${pt(x1 - 20, 340, z0 + 4)}`, matD, 3, 'opacity=".6"');
    // two-step footstool
    const fx0 = -820, fx1 = -660, fz = 2190;
    s += quad([[fx0 - 10, 0, fz - 10], [fx1 + 10, 0, fz - 10], [fx1 + 10, 0, fz + 150], [fx0 - 10, 0, fz + 150]], DARK, `opacity=".25" filter="url(#${P('b3')})"`);
    s += box(fx0, fx1, 110, 128, fz + 70, fz + 140, { t: steel, f: steelD }, 2);
    s += box(fx0 + 6, fx1 - 6, 128, 134, fz + 74, fz + 136, { t: K('#2F3540') });
    for (const X of [fx0 + 10, fx1 - 10]) s += quad([[X - 5, 0, fz], [X + 5, 0, fz], [X + 5, 120, fz + 70], [X - 5, 120, fz + 70]], steel);
    s += box(fx0, fx1, 52, 66, fz, fz + 60, { t: steel, f: steelD }, 2);
    s += box(fx0 + 6, fx1 - 6, 66, 72, fz + 4, fz + 56, { t: K('#2F3540') });
    return s;
  }
  function privacyCurtain() {
    const Z = 2250, H1 = 1255;
    let s = ST(`M${pt(XL, H1, Z)}L${pt(-520, H1, Z)}`, K('#C9CFD6'), 6);
    // hanging rod from the ceiling
    s += ST(`M${pt(-560, HC, Z)}L${pt(-560, H1, Z)}`, K('#C9CFD6'), 3);
    // bunched curtain near the left wall
    const xa = SX(-1340, Z), xb = SX(-1080, Z), xc = SX(-1060, Z), yt = SY(H1 - 10, Z), yb = SY(150, Z);
    const base = K('#8FC3D0'), dk = K('#6FA7B6'), lt = K('#B6DCE4');
    s += PA(`M${n(xa)} ${n(yt)}H${n(xb)}C${n(xb + 10)} ${n(yt + 300)} ${n(xc - 10)} ${n(yb - 300)} ${n(xc)} ${n(yb)}Q${n((xa + xc) / 2)} ${n(yb + 12)} ${n(xa)} ${n(yb + 4)}Z`, base);
    let fd = '', fh = '';
    for (let i = 1; i < 7; i++) {
      const u = i / 7, x1 = xa + (xb - xa) * u, x2 = xa + (xc - xa) * u;
      const p = `M${n(x1)} ${n(yt + 6)}C${n(x1 + 4)} ${n(yt + 300)} ${n(x2 - 4)} ${n(yb - 300)} ${n(x2)} ${n(yb)}`;
      if (i % 2) fd += p; else fh += p;
    }
    s += ST(fd, dk, 9, 'opacity=".8"') + ST(fh, lt, 5, 'opacity=".7"');
    s += R(xa, yb - 40, xc - xa, 14, lt, 'opacity=".55"');
    // runners
    for (let i = 0; i <= 6; i++) s += C(xa + (xb - xa) * i / 6, SY(H1, Z), 4, K('#AEB6C2'));
    return s;
  }

  // ---------- entrance door on the left wall ----------
  function door() {
    const z0 = 1960, z1 = 2190, H = 960;
    let s = sq(XL + 1, z0 - 40, z1 + 40, 0, H + 40, K('#E1E6EA'));
    s += sq(XL + 2, z0, z1, 0, H, K('#B9875A'));
    s += sq(XL + 3, z0 + 40, z1 - 40, 520, H - 60, K('#DCE7EE'));
    s += sq(XL + 3, z0 + 40, z1 - 40, 120, 440, K('#9A6B43'));
    s += sq(XL + 4, z0 + 50, z1 - 50, 540, H - 80, K('#EEF4F8'), 'opacity=".6"');
    s += sq(XL + 4, z1 - 60, z1 - 40, 470, 490, K('#C9CFD6'));
    // hand sanitiser dispenser beside the door
    s += sq(XL + 2, z1 + 90, z1 + 140, 560, 700, K('#FFFFFF')) + sq(XL + 3, z1 + 96, z1 + 134, 600, 640, K('#5AA0D8'));
    return s;
  }

  // ---------- certificates + eye chart ----------
  function certificates() {
    let s = '';
    const frame = (X0, X1, H0, H1, big) => {
      const x0 = BX(X0), x1 = BX(X1), y0 = BY(H1), y1 = BY(H0), w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
      let o = R(x0 + 4, y0 + 6, w, h, DARK, `opacity=".2" filter="url(#${P('b3')})"`);
      o += R(x0, y0, w, h, K('#2E2A28')) + R(x0 + 6, y0 + 6, w - 12, h - 12, K('#C9A45C')) + R(x0 + 9, y0 + 9, w - 18, h - 18, K('#FBF8EF'));
      o += T(cx, y0 + h * 0.27, big ? 11 : 9.5, K('#1F2A44'), 'CERTIFICATE', 'font-weight="600" text-anchor="middle" letter-spacing="1"');
      o += R(cx - w * 0.3, y0 + h * 0.4, w * 0.6, 3, K('#9AA1AC')) + R(cx - w * 0.22, y0 + h * 0.5, w * 0.44, 3, K('#9AA1AC')) + R(cx - w * 0.26, y0 + h * 0.6, w * 0.52, 3, K('#9AA1AC'));
      o += C(x0 + w * 0.25, y0 + h * 0.78, big ? 8 : 6.5, K('#C8161E')) + R(x0 + w * 0.55, y0 + h * 0.79, w * 0.28, 2, K('#6B7686'));
      return o;
    };
    s += frame(240, 450, 830, 1060, true) + frame(480, 690, 830, 1060, true);
    s += frame(380, 550, 1090, 1220, false);
    return s;
  }
  function eyeChart() {
    const x0 = BX(760), x1 = BX(950), y0 = BY(1110), y1 = BY(600);
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
    let s = R(x0 + 4, y0 + 6, w, h, DARK, `opacity=".18" filter="url(#${P('b3')})"`);
    s += R(x0, y0, w, h, K('#FFFFFF'), 'rx="3"') + R(x0, y0, w, 7, K('#1E9E62'), 'rx="3"');
    const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D'];
    let y = y0 + 14;
    rows.forEach((r, i) => {
      const fs = Math.max(6, 50 * Math.pow(0.7, i));
      y += fs + 7;
      s += T(cx, y, fs, K('#14161C'), r, `font-weight="600" text-anchor="middle"`);
      if (i === 4) s += R(x0 + 8, y + 5, w - 16, 2, K('#C8161E'));
    });
    s += R(x0 + 10, y1 - 14, w - 20, 3, K('#AEB6C2'));
    return s;
  }

  // ---------- steel medicine cupboard ----------
  function cupboard() {
    const x0 = 940, x1 = 1340, z0 = 2420, H = 1000;
    let s = quad([[x0 - 20, 0, z0 - 30], [x1, 0, z0 - 30], [x1, 0, ZB], [x0 - 20, 0, ZB]], DARK, `opacity=".22" filter="url(#${P('b6')})"`);
    const st = K('#E3E8EE'), stS = K('#B8C1CC'), stD = K('#C9D1DA');
    s += box(x0, x1, 0, H, z0, ZB, { f: st, s: stS }, 3);
    // upper glass doors with shelves of medicines
    const gx0 = x0 + 24, gx1 = x1 - 24, g0 = 500, g1 = H - 30;
    s += RZ(gx0, gx1, g0, g1, z0 - 1, K('#F6F8FA'));
    const rng = mulberry32(5);
    const boxC = ['#E7B04A', '#5AA0D8', '#E36F5C', '#7BC18E', '#B48ED6', '#F2D16B', '#FFFFFF'];
    const shelves = [g0 + 10, g0 + 165, g0 + 320];
    shelves.forEach(hs => {
      s += RZ(gx0 + 8, gx1 - 8, hs, hs + 8, z0 + 60, K('#C3CBD4'));
      let X = gx0 + 16;
      while (X < gx1 - 40) {
        const kind = rng();
        if (kind < 0.3) { // bottle
          const bw = 36 + rng() * 10, bh = 80 + rng() * 40;
          const col = rng() < 0.5 ? '#9A5B2E' : '#E9EEF2';
          s += RZ(X, X + bw, hs + 8, hs + 8 + bh, z0 + 70, K(col), 8) + RZ(X + 8, X + bw - 8, hs + 8 + bh, hs + 24 + bh, z0 + 70, K('#FFFFFF'), 3);
          s += RZ(X + 4, X + bw - 4, hs + 20, hs + 8 + bh * 0.6, z0 + 69, K('#FFFFFF'), 2);
          X += bw + 8;
        } else { // box
          const bw = 40 + rng() * 50, bh = 60 + rng() * 70, col = boxC[Math.floor(rng() * boxC.length)];
          s += RZ(X, X + bw, hs + 8, hs + 8 + bh, z0 + 70, K(col), 2) + RZ(X, X + bw, hs + 8 + bh * 0.55, hs + 8 + bh * 0.72, z0 + 69, K(col === '#FFFFFF' ? '#5AA0D8' : '#FFFFFF'));
          X += bw + 5;
        }
      }
    });
    s += RZ(gx0, gx1, g0, g1, z0 - 2, K('#CFE3EC'), 0, 'opacity=".25"');
    s += PA(`M${pt(gx0 + 40, g1, z0 - 3)}L${pt(gx0 + 110, g1, z0 - 3)}L${pt(gx0 + 10, g0 + 160, z0 - 3)}L${pt(gx0, g0 + 160, z0 - 3)}L${pt(gx0, g1 - 80, z0 - 3)}Z`, '#FFFFFF', `opacity="${night ? 0.12 : 0.35}"`);
    s += PA(`M${pt(gx1 - 120, g1, z0 - 3)}L${pt(gx1 - 90, g1, z0 - 3)}L${pt(gx1 - 200, g0, z0 - 3)}L${pt(gx1 - 230, g0, z0 - 3)}Z`, '#FFFFFF', `opacity="${night ? 0.08 : 0.22}"`);
    // door frames
    const mid = (x0 + x1) / 2;
    s += RZ(mid - 6, mid + 6, g0, g1, z0 - 4, stD);
    s += RZ(gx0 - 2, gx1 + 2, g0 - 6, g0 + 2, z0 - 4, stD) + RZ(gx0 - 2, gx1 + 2, g1 - 2, g1 + 6, z0 - 4, stD);
    // green cross sticker
    const cx = SX(mid + 80, z0), cy = SY(g1 - 90, z0);
    s += R(cx - 22, cy - 7, 44, 14, K('#1E9E62'), 'rx="2"') + R(cx - 7, cy - 22, 14, 44, K('#1E9E62'), 'rx="2"');
    // lower solid doors
    s += RZ(x0 + 24, mid - 8, 40, 470, z0 - 1, stD, 4) + RZ(mid + 8, x1 - 24, 40, 470, z0 - 1, stD, 4);
    s += RZ(x0 + 34, mid - 18, 50, 460, z0 - 2, st, 3) + RZ(mid + 18, x1 - 34, 50, 460, z0 - 2, st, 3);
    s += RZ(mid - 40, mid - 26, 250, 340, z0 - 3, K('#8F9AA8'), 4) + RZ(mid + 26, mid + 40, 250, 340, z0 - 3, K('#8F9AA8'), 4);
    s += RZ(mid + 46, mid + 66, 300, 320, z0 - 3, K('#6B7686'), 6);
    // vents
    let vt = '';
    for (let i = 0; i < 5; i++) vt += `M${pt(x0 + 70, 120 + i * 18, z0 - 3)}L${pt(mid - 60, 120 + i * 18, z0 - 3)}`;
    s += ST(vt, K('#AEB6C2'), 2);
    // carton boxes on top
    s += box(980, 1180, H, H + 110, 2440, 2580, { f: K('#C89B67'), s: K('#A87D4F') }, 2) + box(1200, 1320, H, H + 70, 2450, 2580, { f: K('#D2A774'), s: K('#B48A5A') }, 2);
    s += RZ(1050, 1110, H + 30, H + 70, 2439, K('#F3EEE2'));
    return s;
  }

  // ---------- right wall: wash basin + mirror ----------
  function washBasin() {
    let s = '';
    const X = XR - 2;
    s += sq(X, 2160, 2380, 820, 1100, K('#BFC9D3')) + sq(X - 1, 2170, 2370, 830, 1090, K('#DCE7EF'));
    s += quad([[X - 2, 1080, 2200], [X - 2, 1080, 2240], [X - 2, 860, 2330], [X - 2, 860, 2290]], '#FFFFFF', 'opacity=".35"');
    s += box(X - 140, X, 640, 700, 2180, 2360, { t: K('#F7F9FA'), f: K('#FFFFFF'), s: K('#E3E8EC') }, 6);
    s += flatE(X - 70, 701, 2270, 40, K('#D9E0E6'));
    s += sq(X - 1, 2250, 2290, 700, 760, K('#C9CFD6'));
    s += quad([[X - 60, 750, 2270], [X - 2, 760, 2270], [X - 2, 745, 2270], [X - 60, 738, 2270]], K('#AEB6C2'));
    // liquid soap bottle
    s += cyl(X - 110, 2200, 14, 700, 760, K('#7BC18E'), K('#FFFFFF'));
    // towel ring with a towel
    s += sq(X - 2, 2120, 2140, 600, 640, K('#AEB6C2')) + sq(X - 6, 2110, 2150, 420, 600, K('#7BC18E')) + sq(X - 7, 2110, 2150, 440, 460, K('#FFFFFF'), 'opacity=".7"');
    return s;
  }
  function weighingScale() {
    const X = 1080, Z = 2290;
    let s = flatE(X, 0, Z, 120, DARK, `opacity=".25" filter="url(#${P('b3')})"`);
    s += box(X - 110, X + 110, 0, 40, Z - 100, Z + 100, { t: K('#E9ECEF'), f: K('#BFC6CE'), s: K('#AEB6C2') }, 6);
    s += quad([[X - 80, 41, Z - 70], [X + 80, 41, Z - 70], [X + 80, 41, Z + 20], [X - 80, 41, Z + 20]], K('#2F3540'));
    s += flatE(X, 42, Z + 55, 34, K('#FFFFFF')) + flatE(X, 43, Z + 55, 26, K('#F4F6F8'));
    s += ST(`M${pt(X, 44, Z + 55)}L${pt(X + 10, 44, Z + 35)}`, K('#C8161E'), 2);
    return s;
  }

  // ---------- instrument trolley behind the desk ----------
  function trolley() {
    const x0 = 660, x1 = 880, z0 = 2380, z1 = 2540;
    const steel = K('#C3CBD4'), steelD = K('#9AA5B2'), steelL = K('#E6EBF0');
    let s = quad([[x0, 0, z0 - 20], [x1 + 20, 0, z0 - 20], [x1 + 20, 0, z1], [x0, 0, z1]], DARK, `opacity=".2" filter="url(#${P('b6')})"`);
    for (const X of [x0 + 10, x1 - 10]) s += RZ(X - 6, X + 6, 30, 560, z0 + 6, steelD);
    for (const X of [x0 + 10, x1 - 10]) s += flatE(X, 15, z0 + 6, 14, K('#3A3F4A'));
    s += box(x0, x1, 240, 256, z0, z1, { t: steel, f: steelD, s: steelD }, 2);
    s += box(x0, x1, 544, 560, z0, z1, { t: steelL, f: steelD, s: steelD }, 2);
    // kidney tray, cotton jar, spirit bottle, glove box
    s += flatE(735, 562, 2470, 46, K('#DDE3EA')) + flatE(735, 564, 2470, 36, K('#C3CBD4'));
    s += cyl(810, 2440, 22, 560, 640, K('#EEF4F8'), K('#C3CBD4')) + cyl(810, 2440, 18, 566, 626, K('#FFFFFF'), K('#FFFFFF'));
    s += cyl(860, 2500, 13, 560, 640, K('#5AA0D8'), K('#FFFFFF'));
    s += box(680, 780, 256, 316, 2400, 2500, { t: K('#F2F4F6'), f: K('#5AA0D8'), s: K('#4A88BD') }, 2);
    s += RZ(690, 770, 280, 296, 2399, K('#FFFFFF'));
    return s;
  }

  // ---------- doctor's chair (mid) ----------
  function docChair() {
    const Z = 1990, s0 = SC(Z), x = SX(275, Z);
    const top = SY(650, Z), bot = SY(330, Z), w = 270 * s0;
    let s = '';
    s += PA(`M${n(x - w / 2)} ${n(bot)}C${n(x - w / 2 - 6)} ${n(top + 60)} ${n(x - w / 2 + 4)} ${n(top + 8)} ${n(x - w * 0.36)} ${n(top)}H${n(x + w * 0.36)}C${n(x + w / 2 - 4)} ${n(top + 8)} ${n(x + w / 2 + 6)} ${n(top + 60)} ${n(x + w / 2)} ${n(bot)}Z`, U('chair'));
    s += PA(`M${n(x - w * 0.36)} ${n(top + 30)}H${n(x + w * 0.36)}`, 'none', `stroke="${K('#4A5878')}" stroke-width="3" opacity=".8"`);
    let seams = '';
    for (const u of [-0.18, 0.18]) seams += `M${n(x + w * u)} ${n(top + 40)}V${n(bot - 10)}`;
    s += ST(seams, K('#1A2132'), 2.5, 'opacity=".7"');
    s += PA(`M${n(x - w / 2 + 8)} ${n(top + 40)}C${n(x - w / 2 + 2)} ${n(top + 120)} ${n(x - w / 2 + 6)} ${n(bot - 40)} ${n(x - w / 2 + 10)} ${n(bot)}`, 'none', `stroke="${K('#55658A')}" stroke-width="5" opacity=".6"`);
    // arm rests (mostly hidden by the desk)
    s += R(x - w / 2 - 26, SY(450, Z), 30, 18, K('#1A2132'), 'rx="8"') + R(x + w / 2 - 4, SY(450, Z), 30, 18, K('#1A2132'), 'rx="8"');
    return s;
  }

  // ---------- desk + props (front) ----------
  const DZ0 = 1620, DZ1 = 1950, DH = 340, DX0 = -171, DX1 = 639;
  function desk() {
    let s = '';
    s += quad([[DX0 - 20, 0, DZ0 - 30], [DX1 + 20, 0, DZ0 - 30], [DX1 + 20, 0, DZ1], [DX0 - 20, 0, DZ1]], DARK, `opacity=".28" filter="url(#${P('b6')})"`);
    // front modesty panel (white laminate) with pharmacy-green stripe
    s += quad([[DX0 + 8, 0, DZ0 + 6], [DX1 - 8, 0, DZ0 + 6], [DX1 - 8, DH - 30, DZ0 + 6], [DX0 + 8, DH - 30, DZ0 + 6]], K('#E7EBEF'));
    s += quad([[DX0 + 8, DH - 80, DZ0 + 5], [DX1 - 8, DH - 80, DZ0 + 5], [DX1 - 8, DH - 30, DZ0 + 5], [DX0 + 8, DH - 30, DZ0 + 5]], DARK, 'opacity=".08"');
    s += quad([[DX0 + 8, 90, DZ0 + 5], [DX1 - 8, 90, DZ0 + 5], [DX1 - 8, 104, DZ0 + 5], [DX0 + 8, 104, DZ0 + 5]], K('#1E9E62'));
    // wooden side panels (legs)
    s += box(DX0, DX0 + 40, 0, DH - 30, DZ0, DZ1, { f: K('#9A6B43') }, 2);
    s += box(DX1 - 40, DX1, 0, DH - 30, DZ0, DZ1, { f: K('#9A6B43') }, 2);
    s += quad([[DX0 + 4, 0, DZ0 - 1], [DX0 + 12, 0, DZ0 - 1], [DX0 + 12, DH - 30, DZ0 - 1], [DX0 + 4, DH - 30, DZ0 - 1]], K('#B9875A'), 'opacity=".7"');
    // green cross logo plate on the panel
    const lx = SX(234, DZ0), ly = SY(205, DZ0);
    s += C(lx, ly, 44, K('#FFFFFF')) + C(lx, ly, 44, 'none', `stroke="${K('#1E9E62')}" stroke-width="4"`);
    s += R(lx - 26, ly - 9, 52, 18, K('#1E9E62'), 'rx="3"') + R(lx - 9, ly - 26, 18, 52, K('#1E9E62'), 'rx="3"');
    // wooden top slab
    s += box(DX0 - 10, DX1 + 10, DH - 30, DH, DZ0 - 10, DZ1, { t: K('#B9875A'), f: K('#8C6140') }, 3);
    s += ST(`M${pt(DX0, DH - 2, DZ0 - 10)}L${pt(DX1, DH - 2, DZ0 - 10)}`, K('#D4A574'), 2.5);
    // glass top sheet with a reflection
    s += quad([[DX0 + 10, DH + 1, DZ0 + 6], [DX1 - 10, DH + 1, DZ0 + 6], [DX1 - 10, DH + 1, DZ1 - 10], [DX0 + 10, DH + 1, DZ1 - 10]], K('#CFE6EA'), 'opacity=".22"');
    s += quad([[DX0 + 300, DH + 2, DZ0 + 6], [DX0 + 380, DH + 2, DZ0 + 6], [DX0 + 320, DH + 2, DZ1 - 10], [DX0 + 250, DH + 2, DZ1 - 10]], '#FFFFFF', `opacity="${night ? 0.06 : 0.14}"`);
    return s;
  }
  function deskProps() {
    let s = '';
    const H = DH + 2;
    // patient files stack (left back)
    const fc = ['#5AA0D8', '#E7B04A', '#E36F5C', '#7BC18E'];
    fc.forEach((c, i) => { s += box(-150, -20, H + i * 12, H + (i + 1) * 12, 1840 + i * 4, 1930 + i * 4, { t: K(tint(c, 0.2)), f: K(c) }, 1); });
    s += box(-140, -30, H + 48, H + 50, 1850, 1930, { t: K('#FFFFFF') });
    // pen stand
    s += cyl(-90, 1740, 26, H, H + 70, K('#2F3540'), K('#1A1E26'));
    s += ST(`M${n(SX(-96, 1740))} ${n(SY(H + 66, 1740))}l-6 -38M${n(SX(-86, 1740))} ${n(SY(H + 66, 1740))}l4 -44M${n(SX(-90, 1740))} ${n(SY(H + 66, 1740))}l-1 -30`, K('#1F2A44'), 4);
    s += C(SX(-102, 1740), SY(H + 104, 1740), 3.5, K('#C8161E')) + C(SX(-82, 1740), SY(H + 110, 1740), 3.5, K('#5AA0D8'));
    // prescription pad + pen (in front of the doctor)
    s += quad([[110, H, 1660], [280, H, 1655], [285, H, 1790], [115, H, 1795]], K('#FFFFFF'));
    s += quad([[110, H, 1790], [285, H, 1786], [285, H - 4, 1786], [110, H - 4, 1790]], K('#D9DEE4'));
    s += quad([[118, H + 1, 1770], [278, H + 1, 1766], [278, H + 1, 1788], [118, H + 1, 1792]], K('#1E9E62'));
    s += T(SX(128, 1720), SY(H, 1720) + 2, 15, K('#1F2A44'), 'Rx', 'font-weight="600" transform="scale(1 0.55)" transform-origin="' + n(SX(128, 1720)) + ' ' + n(SY(H, 1720)) + '"');
    let ln = '';
    for (let i = 0; i < 4; i++) ln += `M${pt(160, H + 1, 1690 + i * 18)}L${pt(268, H + 1, 1688 + i * 18)}`;
    s += ST(ln, K('#AEB6C2'), 1.6);
    s += ST(`M${pt(300, H + 4, 1700)}L${pt(360, H + 4, 1770)}`, K('#1F2A44'), 5) + ST(`M${pt(300, H + 4, 1700)}L${pt(310, H + 4, 1712)}`, K('#C9A45C'), 5);
    // stethoscope coiled on the desk
    const sx = -30, sz = 1720;
    const tube = K('#2B2F38');
    s += ST(`M${pt(sx - 60, H + 3, sz)}C${pt(sx - 70, H + 3, sz + 90)} ${pt(sx + 60, H + 3, sz + 100)} ${pt(sx + 70, H + 3, sz + 20)}C${pt(sx + 80, H + 3, sz - 50)} ${pt(sx - 20, H + 3, sz - 60)} ${pt(sx - 30, H + 3, sz - 10)}C${pt(sx - 40, H + 3, sz + 40)} ${pt(sx + 30, H + 3, sz + 50)} ${pt(sx + 20, H + 3, sz)}`, tube, 6);
    s += ST(`M${pt(sx - 60, H + 3, sz)}L${pt(sx - 80, H + 3, sz - 50)}M${pt(sx - 60, H + 3, sz)}L${pt(sx - 40, H + 3, sz - 56)}`, K('#C3CBD4'), 4);
    s += flatE(sx + 20, H + 4, sz, 24, K('#C3CBD4')) + flatE(sx + 20, H + 6, sz, 17, K('#E6EBF0'));
    s += C(SX(sx - 80, sz - 50), SY(H + 3, sz - 50), 4, K('#2B2F38')) + C(SX(sx - 40, sz - 56), SY(H + 3, sz - 56), 4, K('#2B2F38'));
    // mercury BP apparatus: open box, lid with scale, cuff and bulb
    const bx0 = 410, bx1 = 580, bz0 = 1760, bz1 = 1890;
    s += box(bx0, bx1, H, H + 50, bz0, bz1, { t: K('#E9ECEF'), f: K('#BFC6CE'), s: K('#AEB6C2') }, 3);
    s += quad([[bx0 + 10, H + 51, bz0 + 10], [bx1 - 10, H + 51, bz0 + 10], [bx1 - 10, H + 51, bz1 - 10], [bx0 + 10, H + 51, bz1 - 10]], K('#2F3540'));
    // lid standing up at the back
    s += quad([[bx0, H + 50, bz1], [bx1, H + 50, bz1], [bx1, H + 330, bz1 + 20], [bx0, H + 330, bz1 + 20]], K('#E3E8EE'), rnd(K('#E3E8EE'), 4));
    s += quad([[bx0 + 20, H + 70, bz1 + 1], [bx1 - 20, H + 70, bz1 + 1], [bx1 - 20, H + 312, bz1 + 19], [bx0 + 20, H + 312, bz1 + 19]], U('mercury'));
    let tk = '';
    for (let i = 0; i <= 15; i++) { const hh = H + 80 + i * 14.5, wv = i % 5 === 0 ? 34 : 20; tk += `M${pt(bx0 + 52, hh, bz1 + 2 + (hh - H - 50) / 14)}L${pt(bx0 + 52 + wv, hh, bz1 + 2 + (hh - H - 50) / 14)}`; tk += `M${pt(bx1 - 52 - wv, hh, bz1 + 2 + (hh - H - 50) / 14)}L${pt(bx1 - 52, hh, bz1 + 2 + (hh - H - 50) / 14)}`; }
    s += ST(tk, K('#3A3F4A'), 1.2);
    s += quad([[(bx0 + bx1) / 2 - 5, H + 80, bz1 + 3], [(bx0 + bx1) / 2 + 5, H + 80, bz1 + 3], [(bx0 + bx1) / 2 + 5, H + 300, bz1 + 18], [(bx0 + bx1) / 2 - 5, H + 300, bz1 + 18]], K('#FFFFFF'));
    s += quad([[(bx0 + bx1) / 2 - 4, H + 80, bz1 + 3], [(bx0 + bx1) / 2 + 4, H + 80, bz1 + 3], [(bx0 + bx1) / 2 + 4, H + 200, bz1 + 11], [(bx0 + bx1) / 2 - 4, H + 200, bz1 + 11]], K('#C8161E'));
    // cuff (rolled) + bulb
    s += box(bx0 + 20, bx1 - 10, H + 51, H + 82, bz0 + 14, bz0 + 70, { t: K('#4A5878'), f: K('#3A4664') }, 10);
    s += ST(`M${pt(bx0 + 40, H + 70, bz0 + 40)}C${pt(bx0 - 20, H + 80, bz0 - 10)} ${pt(bx0 - 50, H + 10, bz0 - 60)} ${pt(bx0 - 30, H + 10, bz0 - 90)}`, K('#2B2F38'), 3.5);
    s += E(SX(bx0 - 30, bz0 - 90), SY(H + 18, bz0 - 90), 15, 11, K('#1F2229')) + E(SX(bx0 - 34, bz0 - 92), SY(H + 22, bz0 - 92), 5, 3, K('#4A4F5A'));
    // hand sanitiser + tissue box (right front)
    s += box(560, 640, H, H + 50, 1660, 1740, { t: K('#FFFFFF'), f: K('#7BC18E'), s: K('#5FA673') }, 3);
    s += E(SX(600, 1700), SY(H + 52, 1700), 10, 3, K('#FFFFFF')) + PA(`M${n(SX(600, 1700) - 6)} ${n(SY(H + 52, 1700))}q6 -24 14 -18q-8 6 -2 18z`, K('#FFFFFF'));
    s += cyl(520, 1660, 18, H, H + 70, K('#CFE6F0'), K('#1E9E62')) + R(SX(520, 1660) - 10, SY(H + 50, 1660), 20, 14, K('#FFFFFF'));
    // desk lamp (left back corner), angled toward the pad
    const ax = SX(-120, 1900), ay = SY(H, 1900), js = SC(1900);
    const lampC = K('#1F2A44'), lampL = K('#3A4664');
    s += E(ax, ay, 46 * js, 9, lampC) + E(ax, ay - 3, 40 * js, 7, lampL);
    const jx = ax + 30, jy = ay - 170, hx2 = ax + 140, hy2 = ay - 230;
    s += ST(`M${n(ax)} ${n(ay - 6)}L${n(jx)} ${n(jy)}L${n(hx2)} ${n(hy2)}`, lampC, 6) + C(jx, jy, 6, lampL);
    s += `<g transform="translate(${n(hx2)} ${n(hy2)}) rotate(28)"><path d="M-10 -14H14L40 34H-36Z" fill="${lampC}"/><path d="M-36 34H40" stroke="${night ? '#FFE8B8' : lampL}" stroke-width="5"/></g>`;
    if (night) {
      s += PA(`M${n(hx2 - 30)} ${n(hy2 + 40)}L${n(hx2 + 10)} ${n(hy2 + 52)}L${n(SX(300, 1720))} ${n(SY(H, 1720))}L${n(SX(60, 1700))} ${n(SY(H, 1700))}Z`, U('cone'), `filter="url(#${P('b3')})" style="mix-blend-mode:screen"`);
      s += E(SX(190, 1720), SY(H, 1720), 150, 26, U('pool'), 'style="mix-blend-mode:screen"');
    }
    return s;
  }
  // patient stool (revolving, chrome base, black cushion)
  function stool() {
    const X = -330, Z = 1700;
    let s = flatE(X, 0, Z, 110, DARK, `opacity=".3" filter="url(#${P('b3')})"`);
    const ch = K('#B7C0CB'), chD = K('#8F9AA8');
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 + 18) * Math.PI / 180;
      const fx = X + Math.cos(a) * 100, fz = Z + Math.sin(a) * 100;
      s += ST(`M${pt(X, 50, Z)}L${pt(fx, 16, fz)}`, chD, 7) + flatE(fx, 8, fz, 12, K('#2F3540'));
    }
    s += cyl(X, Z, 16, 50, 225, ch, ch) + R(SX(X, Z) - 8, SY(220, Z), 5, 160, K('#E6EBF0'), 'opacity=".7"');
    s += cyl(X, Z, 150, 228, 250, K('#2B2F38'), K('#3A3F4A'));
    s += cyl(X, Z, 140, 250, 280, K('#1F2229'), K('#3A3F4A'));
    s += flatE(X - 30, 281, Z - 20, 60, '#FFFFFF', `opacity="${night ? 0.04 : 0.1}"`);
    return s;
  }

  // ---------- light overlays ----------
  function lightsDay() {
    let s = '';
    s += E(BX(-175), BY(800), 420, 360, U('sun'), 'style="mix-blend-mode:screen"');
    // light through the open lower part of the window and the blind slats onto the floor
    s += PA(`M${n(BX(-480))} ${n(BY(720))}H${n(BX(130))}L${pt(380, 0, 1900)}L${pt(-640, 0, 1900)}Z`, U('beam'), `opacity=".3" filter="url(#${P('soft')})" style="mix-blend-mode:screen"`);
    let st = '';
    for (let i = 0; i < 7; i++) {
      const z0 = 2520 - i * 70, z1 = z0 - 38;
      st += `M${pt(-520 + (2520 - z0) * 0.25, 1, z0)}L${pt(130 + (2520 - z0) * 0.25, 1, z0)}L${pt(130 + (2520 - z1) * 0.25, 1, z1)}L${pt(-520 + (2520 - z1) * 0.25, 1, z1)}Z`;
    }
    s += PA(st, '#FFF8E8', `opacity=".26" filter="url(#${P('b3')})"`);
    return s;
  }
  function lightsNight() {
    let s = '';
    s += E(BX(-175), BY(1100), 700, 420, U('tubeglow'), 'opacity=".55" style="mix-blend-mode:screen"');
    s += E(1250, 1150, 900, 180, U('tubeglow'), 'opacity=".25" style="mix-blend-mode:screen"');
    return s;
  }

  // ---------- foreground ----------
  function fore() {
    let s = '';
    // snake plant (sansevieria) in the bottom-left corner
    const lv = night ? ['#1A2E25', '#22392D', '#132119'] : ['#3E7A4E', '#4F8E5B', '#2F6040'];
    const band = night ? '#2E4A38' : '#9CC07A';
    const blades = [[-30, 1380, -14, 420, 46], [40, 1390, -4, 520, 54], [110, 1400, 9, 460, 48], [170, 1410, 20, 380, 42], [-80, 1360, -28, 360, 40]];
    blades.forEach(([x, y, a, h, w], i) => {
      s += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M${-w / 2} 0C${-w / 2} ${-h * 0.5} ${-w * 0.3} ${-h * 0.85} 0 ${-h}C${w * 0.3} ${-h * 0.85} ${w / 2} ${-h * 0.5} ${w / 2} 0Z" fill="${lv[i % 3]}"/><path d="M${-w / 2 + 4} 0C${-w / 2 + 4} ${-h * 0.5} ${-w * 0.3 + 3} ${-h * 0.85} 0 ${-h + 6}" stroke="${band}" stroke-width="4" fill="none" opacity=".8"/></g>`;
    });
    s += `<path d="M-40 1350L-20 1290H260L280 1350Z" fill="${night ? '#5A4E46' : '#E9E4DA'}"/>`;
    // edge of a folding hospital screen on the right
    const fr = night ? '#7D8696' : '#D5DBE2', cl = night ? '#4F7A70' : '#8CC5B4';
    s += `<rect x="2290" y="300" width="18" height="1050" fill="${fr}"/><rect x="2308" y="330" width="120" height="980" fill="${cl}" opacity=".95"/>`;
    let fo = '';
    for (let x = 2322; x < 2420; x += 22) fo += `M${x} 340V1300`;
    s += `<path d="${fo}" stroke="${night ? '#3F6359' : '#74B2A0'}" stroke-width="7" fill="none"/>`;
    s += `<rect x="2290" y="1300" width="130" height="18" fill="${fr}"/>`;
    return s;
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      doctor: { x: 1500, zone: 'behind' },
      patient: { x: 750, zone: 'front' }
    },
    draw(opts) {
      opts = opts || {};
      night = opts.time === 'night';
      rain = !!opts.rain;
      LAYER = '';
      let back = defs();
      back += shell();
      back += ceilingFan();
      back += windowBlock();
      back += tubeLight();
      back += door();
      back += anatomyPoster();
      back += certificates();
      back += eyeChart();
      back += washBasin();
      back += cupboard();
      back += privacyCurtain();
      back += examCouch();
      back += trolley();
      back += weighingScale();
      back += night ? lightsNight() : lightsDay();
      back += R(0, 0, 2400, 1350, U('vig'));
      LAYER = 'm_';
      const mid = defs() + docChair();
      LAYER = 'f_';
      const front = defs() + desk() + deskProps() + stool();
      LAYER = 'o_';
      const fr = fore();
      LAYER = '';
      return { back, mid, front, fore: fr };
    }
  };
})();
