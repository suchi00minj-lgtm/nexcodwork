// news_studio — modern TV news studio: video wall with abstract data graphics, side screens,
// lighting truss with fresnels, glossy floor + riser, and an anchor desk (front layer, top y≈930)
// with a blank logo panel. World 2400x1350, floor line y=1250, vanishing point (1200, 640).
window.SETS = window.SETS || {};
(function () {
  const ID = 'news_studio';
  const n = v => Math.round(v * 10) / 10;
  const VPX = 1200, VPY = 640, EYE = 610; // floor at s=1 lands on y=1250
  const SY = (H, s) => VPY + (EYE - H) * s;
  const SX = (X, s) => VPX + X * s;
  const SB = 0.72;                 // back wall depth scale
  const WALL_BOT = SY(0, SB);       // ≈1079

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
  function Defs(layer) {
    let out = '';
    const seen = {};
    const id = nm => `${ID}_${layer}_${nm}`;
    const stops = st => st.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    return {
      id,
      lin(nm, x1, y1, x2, y2, st) {
        if (!seen[nm]) { seen[nm] = 1; out += `<linearGradient id="${id(nm)}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stops(st)}</linearGradient>`; }
        return `url(#${id(nm)})`;
      },
      rad(nm, cx, cy, r, st, ex) {
        if (!seen[nm]) { seen[nm] = 1; out += `<radialGradient id="${id(nm)}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${ex ? ' ' + ex : ''}>${stops(st)}</radialGradient>`; }
        return `url(#${id(nm)})`;
      },
      filter(nm, inner, box) {
        if (!seen[nm]) { seen[nm] = 1; out += `<filter id="${id(nm)}" ${box || 'x="-40%" y="-40%" width="180%" height="180%"'} color-interpolation-filters="sRGB">${inner}</filter>`; }
        return `url(#${id(nm)})`;
      },
      clip(nm, inner) {
        if (!seen[nm]) { seen[nm] = 1; out += `<clipPath id="${id(nm)}">${inner}</clipPath>`; }
        return `url(#${id(nm)})`;
      },
      wrap(body) { return `<g>${out ? `<defs>${out}</defs>` : ''}${body}</g>`; }
    };
  }
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const RR = (x, y, w, h, r, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" rx="${r}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const P = (pts, f, ex) => `<path d="M${pts.map(p => n(p[0]) + ' ' + n(p[1])).join('L')}Z" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const T = (x, y, size, fill, txt, ex) => `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" fill="${fill}" font-family="Poppins"${ex ? ' ' + ex : ''}>${txt}</text>`;

  function palette(night) {
    return night ? {
      void: '#05080F', wallA: '#111A33', wallB: '#0B1226', panel: '#16213F', panelL: '#1F2C52', groove: '#070B17',
      blue: '#3D8BFF', blueSoft: '#5AA0D8', red: '#E0252E', redSoft: '#C8161E', white: '#EAF1FA',
      skyA: '#0A1430', skyB: '#1E3470', city1: '#16244A', city2: '#0A1229', win: '#F2C46B', winB: '#9CC4F0',
      scr: '#0B1531', scrB: '#12224A', floorA: '#0A0F1E', floorB: '#121A33', riser: '#18223F', riserS: '#0C1226',
      steel: '#3A4256', steelL: '#5C667D', steelD: '#232838', lamp: '#FFF2D8', beam: 0.16, ambient: 0.0,
      desk: '#E7ECF3', deskS: '#B9C3D2', deskBody: '#1A2547', deskBodyL: '#26365F', deskBodyD: '#0F1730', logo: '#EEF3FA'
    } : {
      void: '#0E1428', wallA: '#22325E', wallB: '#1A2749', panel: '#26386A', panelL: '#30457E', groove: '#121B36',
      blue: '#4C98FF', blueSoft: '#5AA0D8', red: '#E0303A', redSoft: '#C8161E', white: '#F4F8FD',
      skyA: '#4F8FD0', skyB: '#BFDDF4', city1: '#7FA6CF', city2: '#3E5F92', win: '#DCEBFA', winB: '#A9C8E8',
      scr: '#142350', scrB: '#1C3166', floorA: '#18213F', floorB: '#26335A', riser: '#2B3A66', riserS: '#1A2547',
      steel: '#5E6880', steelL: '#8C97AE', steelD: '#3A4256', lamp: '#FFFFFF', beam: 0.12, ambient: 0.08,
      desk: '#F3F6FA', deskS: '#C9D2DE', deskBody: '#24345F', deskBodyL: '#33497F', deskBodyD: '#17223F', logo: '#F7FAFE'
    };
  }

  // ---------- video wall graphic (city + rising data line) ----------
  function videoWall(D, K, night, x0, y0, w, h) {
    const rng = mulberry32(night ? 4242 : 2424);
    let s = '';
    s += R(x0, y0, w, h, D.lin('sky', 0, y0, 0, y0 + h, [[0, K.skyA], [0.75, K.skyB]]));
    // soft sun / moon glow
    if (night) {
      s += C(x0 + w * 0.8, y0 + h * 0.2, 120, D.rad('moon', x0 + w * 0.8, y0 + h * 0.2, 120, [[0, '#9CC4F0', 0.35], [1, '#9CC4F0', 0]]));
      let st = '';
      for (let i = 0; i < 40; i++) st += `M${n(x0 + rng() * w)} ${n(y0 + rng() * h * 0.5)}h2.4v2.4h-2.4Z`;
      s += `<path d="${st}" fill="#FFFFFF" opacity=".55"/>`;
    } else {
      s += C(x0 + w * 0.8, y0 + h * 0.22, 160, D.rad('sun', x0 + w * 0.8, y0 + h * 0.22, 160, [[0, '#FFFFFF', 0.6], [1, '#FFFFFF', 0]]));
      s += E(x0 + w * 0.25, y0 + h * 0.2, 120, 16, '#FFFFFF', 'opacity=".35"') + E(x0 + w * 0.33, y0 + h * 0.17, 80, 12, '#FFFFFF', 'opacity=".3"');
    }
    // data grid
    let g = '';
    for (let x = x0 + 50; x < x0 + w; x += 50) g += `M${x} ${y0}V${y0 + h}`;
    for (let y = y0 + 40; y < y0 + h; y += 40) g += `M${x0} ${y}H${x0 + w}`;
    s += `<path d="${g}" stroke="#FFFFFF" stroke-width="1.2" opacity="${night ? 0.07 : 0.12}"/>`;
    // skyline: far + near layers
    const base = y0 + h;
    for (const [layer, col, hmin, hmax] of [[0, K.city1, 70, 230], [1, K.city2, 40, 170]]) {
      let x = x0 - 10, b = '', wnd = '';
      while (x < x0 + w) {
        const bw = 34 + rng() * 70, bh = hmin + rng() * (hmax - hmin);
        b += `M${n(x)} ${base}V${n(base - bh)}H${n(x + bw)}V${base}Z`;
        if (rng() < 0.35) b += `M${n(x + bw * 0.45)} ${n(base - bh)}v${-n(12 + rng() * 30)}h3v${n(12)}Z`;
        const lit = night ? 0.4 : 0.55;
        for (let wy = base - bh + 12; wy < base - 10; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (rng() < (layer ? lit * 0.6 : lit)) wnd += `M${n(wx)} ${n(wy)}h5v7h-5Z`;
        x += bw + 2 + rng() * 6;
      }
      s += `<path d="${b}" fill="${col}"/>`;
      s += `<path d="${wnd}" fill="${night ? K.win : K.winB}" opacity="${layer ? (night ? 0.8 : 0.35) : (night ? 0.55 : 0.45)}"/>`;
    }
    // rising red data line with area fill
    const pts = [];
    let v = 0.72;
    for (let i = 0; i <= 12; i++) {
      v = Math.max(0.2, Math.min(0.85, v - 0.04 + (rng() - 0.55) * 0.12));
      pts.push([x0 + 40 + i * (w - 80) / 12, y0 + h * v]);
    }
    pts[12][1] = y0 + h * 0.2;
    const line = pts.map((p, i) => (i ? 'L' : 'M') + n(p[0]) + ' ' + n(p[1])).join('');
    s += `<path d="${line}L${n(pts[12][0])} ${base}L${n(pts[0][0])} ${base}Z" fill="${D.lin('area', 0, y0 + 100, 0, base, [[0, K.red, 0.32], [1, K.red, 0]])}"/>`;
    // second (cool) comparison line
    let v2 = 0.6, l2 = '';
    for (let i = 0; i <= 12; i++) { v2 = Math.max(0.3, Math.min(0.8, v2 + (rng() - 0.5) * 0.12)); l2 += (i ? 'L' : 'M') + n(x0 + 40 + i * (w - 80) / 12) + ' ' + n(y0 + h * v2); }
    s += `<path d="${l2}" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-dasharray="10 8" opacity=".55"/>`;
    s += `<path d="${line}" stroke="${K.red}" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (let i = 1; i < 12; i += 2) s += C(pts[i][0], pts[i][1], 7, '#FFFFFF', `stroke="${K.red}" stroke-width="4"`);
    s += C(pts[12][0], pts[12][1], 12, '#FFFFFF') + C(pts[12][0], pts[12][1], 26, 'none', `stroke="#FFFFFF" stroke-width="3" opacity=".5"`);
    // tile seams + per-tile panel variance
    let seams = '', tiles = '';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const a = 0.02 + ((i * 7 + j * 3) % 5) * 0.012;
      tiles += R(x0 + i * w / 3, y0 + j * h / 3, w / 3, h / 3, (i + j) % 2 ? '#FFFFFF' : '#000000', `opacity="${n(a * 100) / 100}"`);
    }
    for (let i = 1; i < 3; i++) seams += `M${n(x0 + i * w / 3)} ${y0}V${y0 + h}M${x0} ${n(y0 + i * h / 3)}H${x0 + w}`;
    s += tiles + `<path d="${seams}" stroke="#070B16" stroke-width="5"/>`;
    // glass sheen
    s += P([[x0, y0], [x0 + w * 0.38, y0], [x0 + w * 0.12, y0 + h], [x0, y0 + h]], '#FFFFFF', `opacity="${night ? 0.03 : 0.06}"`);
    return s;
  }

  function screenFrame(x, y, w, h, K) {
    return RR(x - 10, y - 10, w + 20, h + 20, 10, '#05080F') + RR(x - 4, y - 4, w + 8, h + 8, 6, '#1A2036');
  }
  function pill(x, y, w, col, op) { return RR(x, y, w, 10, 5, col, `opacity="${op}"`); }

  function sideScreens(D, K, night) {
    const rng = mulberry32(night ? 99 : 98);
    let s = '';
    const scrBg = (nm, x, y, w, h) => R(x, y, w, h, D.lin(nm, 0, y, 0, y + h, [[0, K.scrB], [1, K.scr]]));
    // left top: bar chart
    let [x, y, w, h] = [330, 250, 310, 215];
    s += screenFrame(x, y, w, h, K) + scrBg('s1', x, y, w, h);
    s += pill(x + 20, y + 20, 110, K.white, 0.85) + pill(x + 20, y + 38, 70, K.white, 0.35);
    s += `<path d="M${x + 20} ${y + h - 30}H${x + w - 20}" stroke="#FFFFFF" stroke-width="2" opacity=".35"/>`;
    for (let i = 0; i < 7; i++) {
      const bh = 40 + rng() * 95 + i * 6;
      s += RR(x + 30 + i * 38, y + h - 30 - bh, 24, bh, 4, i === 5 ? K.red : K.blueSoft, i === 5 ? '' : `opacity="${n(0.55 + i * 0.05)}"`);
    }
    // left bottom: area chart
    [x, y, w, h] = [330, 500, 310, 215];
    s += screenFrame(x, y, w, h, K) + scrBg('s2', x, y, w, h);
    let d = `M${x} ${y + h}`, l = '';
    for (let i = 0; i <= 10; i++) {
      const py = y + 70 + Math.sin(i * 0.9 + 1) * 28 + (10 - i) * 6 + rng() * 10;
      d += `L${n(x + i * w / 10)} ${n(py)}`; l += (i ? 'L' : 'M') + n(x + i * w / 10) + ' ' + n(py);
    }
    s += `<path d="${d}L${x + w} ${y + h}Z" fill="${D.lin('s2a', 0, y + 60, 0, y + h, [[0, K.blue, 0.55], [1, K.blue, 0.02]])}"/>`;
    s += `<path d="${l}" stroke="#9CC9FF" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
    s += `<path d="M${x} ${y + 120}H${x + w}" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 7" opacity=".4"/>`;
    s += pill(x + 20, y + 20, 90, K.white, 0.8) + RR(x + w - 90, y + 16, 70, 22, 11, K.red);
    // right top: donut + LIVE tag
    [x, y, w, h] = [1760, 250, 310, 215];
    s += screenFrame(x, y, w, h, K) + scrBg('s3', x, y, w, h);
    const cx = x + 95, cy = y + 115, r = 62, cf = 2 * Math.PI * r;
    let off = 0;
    for (const [frac, col] of [[0.38, K.red], [0.27, K.blueSoft], [0.2, '#FFFFFF'], [0.15, '#6B7686']]) {
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="26" stroke-dasharray="${n(frac * cf - 4)} ${n(cf)}" stroke-dashoffset="${n(-off)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      off += frac * cf;
    }
    for (let i = 0; i < 4; i++) s += RR(x + 185, y + 72 + i * 26, 14, 14, 3, [K.red, K.blueSoft, '#FFFFFF', '#6B7686'][i]) + pill(x + 208, y + 74 + i * 26, 60 + (i % 2) * 20, K.white, 0.55);
    s += RR(x + w - 82, y + 16, 66, 28, 6, K.redSoft) + C(x + w - 68, y + 30, 5, '#FFFFFF') + T(x + w - 58, y + 37, 17, '#FFFFFF', 'LIVE', 'font-weight="600" letter-spacing="1"');
    // right bottom: market style rows
    [x, y, w, h] = [1760, 500, 310, 215];
    s += screenFrame(x, y, w, h, K) + scrBg('s4', x, y, w, h);
    const rows = [['+2.4%', 1], ['-0.8%', 0], ['+1.1%', 1], ['+0.6%', 1]];
    rows.forEach((rw, i) => {
      const ry = y + 34 + i * 46;
      s += R(x + 14, ry - 18, w - 28, 38, '#FFFFFF', `opacity="${i % 2 ? 0.03 : 0.07}"`);
      s += rw[1] ? `<path d="M${x + 30} ${ry + 8}l10 -14l10 14Z" fill="#1E9E62"/>` : `<path d="M${x + 30} ${ry - 6}l10 14l10 -14Z" fill="${K.red}"/>`;
      s += pill(x + 62, ry - 4, 70 + (i * 23) % 50, K.white, 0.6);
      s += T(x + w - 26, ry + 8, 20, rw[1] ? '#7BE0A8' : '#FF8A8F', rw[0], 'font-weight="600" text-anchor="end"');
    });
    // screen glow
    return s;
  }

  // ---------- fresnel light on the truss ----------
  function fresnel(x, y, ang, K, night, scale) {
    const sc = scale || 1;
    let s = `<g transform="translate(${n(x)} ${n(y)}) scale(${sc})">`;
    s += R(-4, -40, 8, 40, K.steelD); // hanger
    s += `<path d="M-44 -6Q-44 30 0 30Q44 30 44 -6" stroke="${K.steelD}" stroke-width="7" fill="none"/>`; // yoke
    s += `<g transform="rotate(${ang})">`;
    s += RR(-34, -10, 68, 92, 16, K.steelD);
    s += RR(-34, -10, 30, 92, 14, K.steel, 'opacity=".55"');
    for (let i = 0; i < 4; i++) s += R(-34, 4 + i * 12, 68, 4, '#0B0F1A', 'opacity=".45"'); // cooling fins
    // barn doors
    s += P([[-38, 82], [-58, 118], [-30, 98]], K.steel) + P([[38, 82], [58, 118], [30, 98]], K.steelD);
    s += E(0, 86, 36, 12, '#0B0F1A');
    s += E(0, 88, 30, 10, K.lamp);
    s += E(0, 90, 60, 26, K.lamp, `opacity="${night ? 0.35 : 0.25}"`);
    s += '</g></g>';
    return s;
  }

  function truss(x0, x1, y, hgt, K, op) {
    let s = R(x0, y, x1 - x0, 7, K.steelL, op ? `opacity="${op}"` : '');
    s += R(x0, y + hgt - 7, x1 - x0, 7, K.steel, op ? `opacity="${op}"` : '');
    let d = '';
    const step = hgt * 1.05;
    for (let x = x0; x < x1; x += step) d += `M${n(x)} ${y + 6}L${n(x + step / 2)} ${y + hgt - 6}L${n(x + step)} ${y + 6}`;
    s += `<path d="${d}" stroke="${K.steel}" stroke-width="4" fill="none"${op ? ` opacity="${op}"` : ''}/>`;
    return s;
  }

  function back(night) {
    const D = Defs('b');
    const K = palette(night);
    let s = '';
    s += R(0, 0, 2400, 1350, K.void);
    // back wall
    const WL = 140, WR = 2260, WT = 128;
    s += R(WL, WT, WR - WL, WALL_BOT - WT, D.lin('wall', 0, WT, 0, WALL_BOT, [[0, K.wallB], [0.55, K.wallA], [1, K.wallB]]));
    // panel grooves
    let gr = '';
    for (let x = WL + 120; x < WR; x += 160) gr += `M${x} ${WT}V${n(WALL_BOT)}`;
    for (const y of [300, 820, 950]) gr += `M${WL} ${y}H${WR}`;
    s += `<path d="${gr}" stroke="${K.groove}" stroke-width="4" opacity=".7"/>`;
    // raised wall panel behind the screens
    s += RR(270, 170, 1860, 640, 18, K.panel, 'opacity=".7"');
    s += RR(270, 170, 1860, 8, 4, K.panelL, 'opacity=".6"');
    // anchor key/back light halo on the wall
    s += E(1200, 560, 760, 430, D.rad('halo', 1200, 560, 760, [[0, K.blue, night ? 0.28 : 0.22], [0.6, K.blue, 0.06], [1, K.blue, 0]]));
    // video wall glow + frame + graphic
    const vx = 700, vy = 205, vw = 1000, vh = 560;
    s += `<g filter="${D.filter('glow', '<feGaussianBlur stdDeviation="28"/>', 'x="-20%" y="-20%" width="140%" height="140%"')}">${R(vx, vy, vw, vh, night ? '#3E6FD0' : '#6FA8E8', `opacity="${night ? 0.55 : 0.4}"`)}</g>`;
    s += RR(vx - 16, vy - 16, vw + 32, vh + 32, 12, '#05080F') + RR(vx - 6, vy - 6, vw + 12, vh + 12, 6, '#161C30');
    s += `<g clip-path="${D.clip('vw', `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}"/>`)}">${videoWall(D, K, night, vx, vy, vw, vh)}</g>`;
    // side screens
    s += sideScreens(D, K, night);
    // red LED strip under the video wall + blue verticals
    const glowS = D.filter('gs', '<feGaussianBlur stdDeviation="9"/>', 'x="-10%" y="-200%" width="120%" height="500%"');
    s += `<g filter="${glowS}">${R(560, 828, 1280, 14, K.red, 'opacity=".9"')}${R(282, 180, 12, 620, K.blue)}${R(2106, 180, 12, 620, K.blue)}</g>`;
    s += R(560, 832, 1280, 6, '#FF8088') + R(285, 180, 6, 620, '#BFDBFF') + R(2109, 180, 6, 620, '#BFDBFF');
    // lower wall: backlit acrylic light slot (fades out at the ends) + small status lights
    s += RR(380, 876, 1640, 46, 23, D.lin('slot', 380, 0, 2020, 0, [[0, K.blue, 0], [0.2, K.blue, night ? 0.5 : 0.38], [0.8, K.blue, night ? 0.5 : 0.38], [1, K.blue, 0]]));
    s += RR(380, 897, 1640, 4, 2, D.lin('slotl', 380, 0, 2020, 0, [[0, '#BFDBFF', 0], [0.25, '#BFDBFF', 0.9], [0.75, '#BFDBFF', 0.9], [1, '#BFDBFF', 0]]));
    for (let i = 0; i < 6; i++) s += C(470 + i * 26, 960, 5, i < 4 ? K.blueSoft : K.red, 'opacity=".8"') + C(1930 - i * 26, 960, 5, i < 4 ? K.blueSoft : K.red, 'opacity=".8"');
    // side walls (receding), with LED strips
    for (const side of [-1, 1]) {
      const xb = side < 0 ? WL : WR, xe = side < 0 ? 0 : 2400;
      const s2 = (xe - VPX) / ((xb - VPX) / SB); // depth scale at frame edge
      const yTopB = WT, yBotB = WALL_BOT, yTopE = SY(EYE + (VPY - WT) / SB, s2), yBotE = SY(0, s2);
      s += P([[xb, yTopB], [xe, yTopE], [xe, yBotE], [xb, yBotB]], D.lin('sw' + side, xb, 0, xe, 0, [[0, K.wallB], [1, K.void]]));
      for (let k = 1; k <= 3; k++) {
        const sk = SB + (s2 - SB) * k / 4;
        const X = (xb - VPX) / SB;
        const x = SX(X, sk);
        s += `<path d="M${n(x)} ${n(SY(1180, sk))}V${n(SY(30, sk))}" stroke="${k === 2 ? K.red : K.blue}" stroke-width="${n(5 * sk)}" opacity=".85"/>`;
        s += `<path d="M${n(x)} ${n(SY(1180, sk))}V${n(SY(30, sk))}" stroke="${k === 2 ? K.red : K.blue}" stroke-width="${n(24 * sk)}" opacity=".18"/>`;
      }
    }
    // ceiling void + rear truss with PAR cans
    s += R(0, 0, 2400, WT, D.lin('ceil', 0, 0, 0, WT, [[0, '#000000'], [1, K.void]]));
    s += truss(0, 2400, 92, 30, K, 0.75);
    for (let x = 230; x < 2300; x += 175) {
      const col = (x / 175 | 0) % 3 === 0 ? K.red : K.blue;
      s += RR(x - 14, 122, 28, 26, 6, K.steelD) + C(x, 150, 9, col) + C(x, 156, 26, col, 'opacity=".16"');
    }
    // floor
    s += R(0, WALL_BOT, 2400, 1350 - WALL_BOT, D.lin('floor', 0, WALL_BOT, 0, 1350, [[0, K.floorA], [1, K.floorB]]));
    // floor reflections of the wall lights
    const blurF = D.filter('fb', '<feGaussianBlur stdDeviation="14"/>', 'x="-10%" y="-30%" width="120%" height="160%"');
    s += `<g filter="${blurF}" opacity="${night ? 0.5 : 0.4}">${R(720, WALL_BOT + 6, 960, 120, D.lin('rf', 0, WALL_BOT, 0, WALL_BOT + 130, [[0, night ? '#4D7BD8' : '#8FBCEB', 0.7], [1, '#4D7BD8', 0]]))}${R(560, WALL_BOT + 4, 1280, 18, K.red, 'opacity=".7"')}${R(330, WALL_BOT + 4, 310, 60, K.blue, 'opacity=".4"')}${R(1760, WALL_BOT + 4, 310, 60, K.blue, 'opacity=".4"')}</g>`;
    // floor seams converging to the vanishing point
    let fs = '';
    for (let X = -2400; X <= 2400; X += 300) fs += `M${n(SX(X, SB))} ${n(WALL_BOT)}L${n(SX(X, 1.25))} ${n(SY(0, 1.25))}`;
    s += `<path d="${fs}" stroke="#FFFFFF" stroke-width="2" opacity=".05"/>`;
    s += R(WL, WALL_BOT - 3, WR - WL, 6, '#000000', 'opacity=".35"');
    // riser platform
    const rcx = 1200, rcy = 1236, rrx = 940, rry = 86;
    s += E(rcx, rcy + 30, rrx, rry, K.riserS);
    s += `<path d="M${rcx - rrx} ${rcy}A${rrx} ${rry} 0 0 0 ${rcx + rrx} ${rcy}L${rcx + rrx} ${rcy + 30}A${rrx} ${rry} 0 0 1 ${rcx - rrx} ${rcy + 30}Z" fill="${K.riserS}"/>`;
    s += E(rcx, rcy, rrx, rry, D.lin('riser', 0, rcy - rry, 0, rcy + rry, [[0, mix(K.riser, '#000000', 0.25)], [1, K.riser]]));
    s += E(rcx, rcy, rrx - 70, rry - 12, 'none', `stroke="${K.blue}" stroke-width="2" opacity=".35"`);
    s += `<path d="M${rcx - rrx + 4} ${rcy + 6}A${rrx} ${rry} 0 0 0 ${rcx + rrx - 4} ${rcy + 6}" stroke="${K.blue}" stroke-width="5" fill="none" opacity=".9"/>`;
    s += `<path d="M${rcx - rrx + 4} ${rcy + 10}A${rrx} ${rry} 0 0 0 ${rcx + rrx - 4} ${rcy + 10}" stroke="${K.blue}" stroke-width="22" fill="none" opacity=".18"/>`;
    // front truss with fresnels + volumetric beams
    const beams = [[420, 205, 22], [820, 210, 10], [1580, 210, -10], [1980, 205, -22]];
    let bm = '';
    for (const [x, y, a] of beams) {
      const ang = a * Math.PI / 180;
      const tx = x - Math.sin(ang) * 900, ty = y + Math.cos(ang) * 900;
      const px = Math.cos(ang) * 1, py = Math.sin(ang) * 1;
      bm += P([[x - px * 30, y - py * 30], [x + px * 30, y + py * 30], [tx + px * 230, ty + py * 230], [tx - px * 230, ty - py * 230]], D.lin('bm' + x, x, y, tx, ty, [[0, K.lamp, K.beam * 2.2], [0.5, K.lamp, K.beam * 0.6], [1, K.lamp, 0]]));
    }
    s += `<g filter="${D.filter('bmb', '<feGaussianBlur stdDeviation="10"/>')}">${bm}</g>`;
    s += truss(-20, 2420, 18, 46, K);
    for (const [x, y, a] of beams) s += fresnel(x, 100, a, K, night, 1);
    s += fresnel(1200, 96, 0, K, night, 0.85);
    // overall ambient lift for the day version
    if (K.ambient) s += R(0, 0, 2400, 1350, '#9DB8E6', `opacity="${K.ambient}"`);
    return D.wrap(s);
  }

  // ---------- anchor desk (front layer) ----------
  function front(night) {
    const D = Defs('f');
    const K = palette(night);
    let s = '';
    // desk shadow on the riser
    s += E(1200, 1250, 560, 26, '#000000', 'opacity=".45"');
    const L = 690, Rr = 1710, top = 930;
    // body: tapered, slightly convex front
    const bodyPath = `M${L + 30} ${top + 18}Q1200 ${top + 44} ${Rr - 30} ${top + 18}L${Rr - 80} 1222Q1200 1240 ${L + 80} 1222Z`;
    s += `<path d="${bodyPath}" fill="${D.lin('body', L, 0, Rr, 0, [[0, K.deskBodyD], [0.3, K.deskBody], [0.5, K.deskBodyL], [0.7, K.deskBody], [1, K.deskBodyD]])}"/>`;
    // facet lines + red accent grooves on the side panels
    s += `<path d="M1010 ${top + 36}L1030 1232M1390 ${top + 36}L1370 1232" stroke="#000000" stroke-width="4" opacity=".3"/>`;
    for (const yy of [1010, 1150]) {
      s += `<path d="M${L + 50 + (yy - top) * 0.05} ${yy}L1000 ${yy + 2}M1400 ${yy + 2}L${Rr - 50 - (yy - top) * 0.05} ${yy}" stroke="${K.red}" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
      s += `<path d="M${L + 50 + (yy - top) * 0.05} ${yy}L1000 ${yy + 2}M1400 ${yy + 2}L${Rr - 50 - (yy - top) * 0.05} ${yy}" stroke="${K.red}" stroke-width="18" stroke-linecap="round" opacity=".15"/>`;
    }
    // vertical sheen on the body
    s += `<path d="M${L + 160} ${top + 30}L${L + 220} ${top + 30}L${L + 250} 1228L${L + 200} 1228Z" fill="#FFFFFF" opacity="${night ? 0.05 : 0.07}"/>`;
    s += `<path d="M${Rr - 300} ${top + 30}L${Rr - 270} ${top + 30}L${Rr - 290} 1230L${Rr - 315} 1230Z" fill="#FFFFFF" opacity=".05"/>`;
    // blank logo panel (frosted, edge-lit)
    const lx = 1040, ly = 995, lw = 320, lh = 160;
    s += `<g filter="${D.filter('lg', '<feGaussianBlur stdDeviation="12"/>')}">${RR(lx - 6, ly - 6, lw + 12, lh + 12, 20, K.blue, `opacity="${night ? 0.7 : 0.5}"`)}</g>`;
    s += RR(lx, ly, lw, lh, 16, D.lin('logo', 0, ly, 0, ly + lh, [[0, K.logo], [1, mix(K.logo, '#9DB0CC', 0.35)]]));
    s += RR(lx + 8, ly + 8, lw - 16, lh - 16, 10, 'none', `stroke="#FFFFFF" stroke-width="2" opacity=".7"`);
    s += P([[lx + 20, ly + 8], [lx + 120, ly + 8], [lx + 60, ly + lh - 8], [lx + 8, ly + lh - 8], [lx + 8, ly + 40]], '#FFFFFF', 'opacity=".35"');
    // plinth + blue LED base
    s += `<path d="M${L + 90} 1222Q1200 1240 ${Rr - 90} 1222L${Rr - 100} 1250Q1200 1262 ${L + 100} 1250Z" fill="#05080F"/>`;
    s += `<g filter="${D.filter('led', '<feGaussianBlur stdDeviation="8"/>', 'x="-10%" y="-200%" width="120%" height="500%"')}"><path d="M${L + 100} 1246Q1200 1258 ${Rr - 100} 1246" stroke="${K.blue}" stroke-width="12" fill="none"/></g>`;
    s += `<path d="M${L + 100} 1246Q1200 1258 ${Rr - 100} 1246" stroke="#BFDBFF" stroke-width="3" fill="none"/>`;
    // desk top: slab with visible top surface and edge band
    s += `<path d="M${L} ${top - 2}Q1200 ${top - 20} ${Rr} ${top - 2}L${Rr - 40} ${top - 30}Q1200 ${top - 44} ${L + 40} ${top - 30}Z" fill="${D.lin('top', 0, top - 44, 0, top, [[0, mix(K.desk, '#8C9BB2', 0.25)], [1, K.desk]])}"/>`;
    s += `<path d="M${L} ${top - 2}Q1200 ${top + 22} ${Rr} ${top - 2}L${Rr} ${top + 16}Q1200 ${top + 42} ${L} ${top + 16}Z" fill="${D.lin('edge', 0, top, 0, top + 40, [[0, K.desk], [1, K.deskS]])}"/>`;
    s += `<path d="M${L + 6} ${top + 18}Q1200 ${top + 44} ${Rr - 6} ${top + 18}" stroke="${K.red}" stroke-width="5" fill="none"/>`;
    s += `<path d="M${L + 60} ${top - 22}Q1200 ${top - 34} ${Rr - 60} ${top - 22}" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".6"/>`;
    // props on the desk
    // papers (left)
    s += `<path d="M800 ${top - 14}L944 ${top - 18}L964 ${top - 4}L812 ${top}Z" fill="#DDE3EC"/>`;
    s += `<path d="M806 ${top - 18}L948 ${top - 24}L968 ${top - 10}L818 ${top - 5}Z" fill="#FFFFFF"/>`;
    s += `<path d="M830 ${top - 14}l90 -3M836 ${top - 10}l70 -2" stroke="#AEB6C2" stroke-width="2"/>`;
    s += `<path d="M880 ${top - 6}L986 ${top - 22}" stroke="#1F2A44" stroke-width="6" stroke-linecap="round"/>`;
    // laptop (lid back facing camera)
    const lpx = 1470, lpw = 170;
    s += `<path d="M${lpx - 8} ${top - 16}L${lpx + lpw + 8} ${top - 16}L${lpx + lpw} ${top - 8}L${lpx} ${top - 8}Z" fill="#8C97AE"/>`;
    s += `<path d="M${lpx} ${top - 16}L${lpx + 6} ${top - 124}L${lpx + lpw - 6} ${top - 124}L${lpx + lpw} ${top - 16}Z" fill="${D.lin('lid', lpx, 0, lpx + lpw, 0, [[0, '#B9C3D2'], [0.5, '#DCE1E8'], [1, '#AEB6C2']])}"/>`;
    s += `<path d="M${lpx} ${top - 16}L${lpx + 6} ${top - 124}L${lpx + 50} ${top - 124}L${lpx + 30} ${top - 16}Z" fill="#FFFFFF" opacity=".25"/>`;
    s += C(lpx + lpw / 2, top - 72, 10, '#FFFFFF', 'opacity=".55"');
    // mug
    s += RR(1660, top - 64, 38, 48, 8, K.redSoft) + `<path d="M1696 ${top - 54}q18 2 16 16q-2 12 -16 12" stroke="${K.redSoft}" stroke-width="6" fill="none"/>`;
    s += E(1679, top - 64, 19, 5, '#7A0E13') + R(1664, top - 58, 8, 36, '#FFFFFF', 'opacity=".25" rx="4"');
    return D.wrap(s);
  }

  // ---------- foreground: out-of-focus studio camera on a pedestal (bottom-left corner) ----------
  function fore(night) {
    const D = Defs('o');
    const K = palette(night);
    const dk = night ? '#05070D' : '#0B0F1B', md = night ? '#141A2A' : '#1E2538', hl = night ? '#2A3248' : '#3A4560';
    let s = '<g transform="translate(-40 40)">';
    // pedestal column + base ring
    s += R(70, 1120, 70, 260, dk) + R(70, 1120, 18, 260, hl, 'opacity=".5"');
    s += E(105, 1128, 90, 18, md);
    // pan bars
    s += `<path d="M20 1060L-60 1150" stroke="${md}" stroke-width="16" stroke-linecap="round"/>`;
    // camera body
    s += RR(-60, 930, 300, 170, 22, md);
    s += RR(-60, 930, 300, 34, 16, hl);
    s += RR(-40, 980, 120, 90, 10, dk, 'opacity=".8"');
    // lens barrel + hood, pointing at the desk
    s += R(236, 978, 70, 92, dk) + R(236, 978, 70, 20, hl, 'opacity=".6"');
    s += `<path d="M300 966L372 942L372 1106L300 1082Z" fill="${md}"/>`;
    s += `<path d="M300 966L372 942L372 960L300 980Z" fill="${hl}" opacity=".6"/>`;
    // viewfinder + tally light
    s += RR(-20, 878, 130, 58, 10, dk) + R(10, 860, 70, 22, md);
    s += C(150, 912, 11, K.red) + C(150, 912, 30, K.red, 'opacity=".28"');
    s += '</g>';
    return D.wrap(s);
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: { anchor: { x: 1200, zone: 'behind' } },
    draw(opts) {
      const night = (opts && opts.time) === 'night';
      return { back: back(night), mid: '', front: front(night), fore: fore(night) };
    }
  };
})();
