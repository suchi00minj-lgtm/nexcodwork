// abstract_white — premium white cyclorama studio for talking-to-camera and testimonials.
// World 2400x1350, floor line y=1250. Infinity cove: wall melts into the floor around y 1000-1150.
// Soft brand-red (#C8161E) and light-grey geometric cut-outs live in the corners at low opacity.
window.SETS = window.SETS || {};
(function () {
  const ID = 'abstract_white';
  const n = v => Math.round(v * 10) / 10;
  const RED = '#C8161E';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // per-layer defs registry so each layer <svg> carries its own gradients/filters
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
        if (!seen[nm]) { seen[nm] = 1; out += `<filter id="${id(nm)}" ${box || 'x="-40%" y="-40%" width="180%" height="180%"'} color-interpolation-filters="sRGB">${inner}</filter>`; }
        return `url(#${id(nm)})`;
      },
      wrap(body) { return `<g>${out ? `<defs>${out}</defs>` : ''}${body}</g>`; }
    };
  }
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const ring = (x, y, r, col, w, op) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`;
  function dotGrid(x0, y0, cols, rows, gap, r, col, op) {
    let d = '';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d += `M${n(x0 + i * gap - r)} ${n(y0 + j * gap)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    return `<path d="${d}" fill="${col}" opacity="${op}"/>`;
  }
  function plusGrid(x0, y0, cols, rows, gap, s, col, w, op) {
    let d = '';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = x0 + i * gap, y = y0 + j * gap;
      d += `M${n(x - s)} ${n(y)}h${2 * s}M${n(x)} ${n(y - s)}v${2 * s}`;
    }
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}" fill="none"/>`;
  }
  function stripes(x, y, w, h, gap, col, sw, op, clipId) {
    let d = '';
    for (let k = -h; k < w + h; k += gap) d += `M${n(x + k)} ${n(y + h)}L${n(x + k + h)} ${n(y)}`;
    return `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` +
      `<path d="${d}" stroke="${col}" stroke-width="${sw}" opacity="${op}" clip-path="url(#${clipId})"/>`;
  }
  function roundedSquare(cx, cy, s, rx, rot, fill, ex) {
    return `<rect x="${n(cx - s / 2)}" y="${n(cy - s / 2)}" width="${n(s)}" height="${n(s)}" rx="${rx}" fill="${fill}" transform="rotate(${rot} ${n(cx)} ${n(cy)})"${ex ? ' ' + ex : ''}/>`;
  }
  function tri(cx, cy, s, rot) {
    const pts = [0, 1, 2].map(i => {
      const a = (rot + i * 120 - 90) * Math.PI / 180;
      return n(cx + Math.cos(a) * s) + ' ' + n(cy + Math.sin(a) * s);
    });
    return 'M' + pts.join('L') + 'Z';
  }

  function back(night) {
    const D = Defs('b');
    const P = night
      ? { c0: '#FBFBFC', c1: '#F1F2F5', c2: '#D4D8DF', cove: '#DADDE3', floorN: '#ECEEF1', shade: '#A9B0BB', paper: '#E9EBEF', paperS: '#DADDE3', dot: '#AEB6C2', bloom: '#FFF7EC' }
      : { c0: '#FFFFFF', c1: '#F7F8FA', c2: '#E2E5EA', cove: '#E5E8EC', floorN: '#F6F7F9', shade: '#B7BDC6', paper: '#F0F2F5', paperS: '#E3E6EA', dot: '#BEC5CF', bloom: '#FFFFFF' };
    let s = '';
    // seamless cyc: lit centre falling off softly to the corners
    s += R(0, 0, 2400, 1350, D.rad('wall', 1200, 600, 1500, [[0, P.c0], [0.45, P.c1], [1, P.c2]], 'fx="1200" fy="520"'));
    // gentle top falloff (studio ceiling is unlit)
    s += R(0, 0, 2400, 420, D.lin('top', 0, 0, 0, 420, [[0, P.c2, 0.55], [1, P.c2, 0]]));
    // the cove: wall bends into the floor — a soft darker band, then a brighter floor
    s += R(0, 900, 2400, 450, D.lin('cove', 0, 900, 0, 1350, [[0, P.cove, 0], [0.34, P.cove, 0.55], [0.5, P.cove, 0.42], [0.78, P.floorN, 0.55], [1, P.c0, 0.75]]));
    // side vignette on the floor
    s += R(0, 1000, 2400, 350, D.lin('fside', 0, 0, 2400, 0, [[0, P.c2, 0.6], [0.22, P.c2, 0], [0.78, P.c2, 0], [1, P.c2, 0.6]]));
    // key light bloom behind the talent
    s += E(1200, 560, 820, 560, D.rad('bloom', 1200, 560, 820, [[0, P.bloom, night ? 0.85 : 0.9], [0.6, P.bloom, 0.25], [1, P.bloom, 0]]));
    // soft diagonal light shafts (softbox spill from top-left)
    const shaft = D.lin('shaft', 0, 0, 1400, 900, [[0, '#FFFFFF', night ? 0.35 : 0.55], [1, '#FFFFFF', 0]]);
    s += `<path d="M250 0L560 0L1500 1000L1080 1000Z" fill="${shaft}"/>`;
    s += `<path d="M700 0L840 0L1820 980L1620 980Z" fill="${shaft}" opacity=".7"/>`;

    // ---------- geometric cut-outs (low opacity, soft paper shadows) ----------
    const sh = D.filter('soft', `<feDropShadow dx="8" dy="14" stdDeviation="14" flood-color="${P.shade}" flood-opacity="${night ? 0.32 : 0.26}"/>`, 'x="-30%" y="-30%" width="170%" height="170%"');
    const blur = D.filter('blur', '<feGaussianBlur stdDeviation="2.2"/>');

    // top-left cluster
    let g = '';
    g += C(110, 70, 300, RED, 'opacity=".07"');
    g += C(110, 70, 205, RED, 'opacity=".045"');
    g += `<g filter="${sh}">${C(392, 286, 104, P.paper)}</g>`;
    g += ring(392, 286, 62, RED, 12, 0.26);
    g += dotGrid(92, 470, 6, 4, 34, 5, P.dot, 0.55);
    g += `<path d="M560 40L760 240M600 40L800 240M640 40L840 240" stroke="${P.dot}" stroke-width="4" stroke-linecap="round" opacity=".65"/>`;
    // top-right cluster
    g += `<g filter="${sh}">${roundedSquare(2150, 250, 300, 42, 18, P.paper)}</g>`;
    g += roundedSquare(2150, 250, 176, 26, 18, 'none', `stroke="${RED}" stroke-width="7" opacity=".24"`);
    g += `<path d="M2400 380A150 150 0 0 0 2400 680Z" fill="${RED}" opacity=".1"/>`;
    g += `<path d="${tri(1880, 120, 42, -8)}" fill="${RED}" opacity=".16"/>`;
    g += plusGrid(1880, 420, 3, 3, 40, 10, P.dot, 5, 0.7);
    g += `<path d="M1700 0Q1950 140 2400 120" stroke="${P.dot}" stroke-width="4" fill="none" opacity=".6"/>`;
    // bottom-left cluster
    g += `<path d="M0 1010A340 340 0 0 1 340 1350L0 1350Z" fill="${RED}" opacity=".085"/>`;
    g += `<g filter="${sh}">${C(330, 1120, 74, P.paper)}</g>`;
    g += ring(330, 1120, 74, P.dot, 10, 0.55);
    g += stripes(60, 800, 250, 120, 26, P.dot, 5, 0.6, ID + '_b_clipst');
    // bottom-right cluster
    g += `<g filter="${sh}">${C(2270, 1190, 196, P.paper)}</g>`;
    g += C(2270, 1190, 120, P.paperS, 'opacity=".8"');
    g += C(2050, 1000, 26, RED, 'opacity=".34"');
    g += dotGrid(1960, 1100, 5, 3, 32, 5, RED, 0.28);
    g += `<path d="M1930 1350A520 520 0 0 1 2400 870" stroke="${RED}" stroke-width="5" fill="none" opacity=".14"/>`;
    // faint mid-frame accents (visible in medium / close framings, kept very light)
    g += ring(1640, 440, 340, P.dot, 3, 0.32);
    g += `<path d="M560 640H660" stroke="${RED}" stroke-width="5" stroke-linecap="round" opacity=".22"/>`;
    s += `<g>${g}</g>`;
    // a few out-of-focus floating flecks for depth
    const rng = mulberry32(night ? 77 : 41);
    let fl = '';
    for (let i = 0; i < 8; i++) {
      const edge = i % 2 ? 1 : 0;
      const x = edge ? 1980 + rng() * 400 : 20 + rng() * 380;
      const y = 120 + rng() * 820;
      fl += C(x, y, 4 + rng() * 7, i % 4 === 0 ? RED : P.dot, `opacity="${n(0.1 + rng() * 0.18)}"`);
    }
    s += `<g filter="${blur}">${fl}</g>`;

    // ---------- floor shadow area ----------
    s += E(1200, 1262, 1050, 120, D.rad('fsh', 1200, 1262, 1050, [[0, P.shade, night ? 0.4 : 0.32], [0.6, P.shade, 0.12], [1, P.shade, 0]], 'gradientTransform="translate(0 1100) scale(1 0.12) translate(0 -1100)"'));
    for (const x of [800, 1200, 1600]) {
      const f = D.rad('ssh' + x, x, 1254, 250, [[0, P.shade, night ? 0.4 : 0.32], [1, P.shade, 0]], 'gradientTransform="translate(0 1254) scale(1 0.152) translate(0 -1254)"');
      s += E(x, 1254, 250, 38, f);
    }
    // fine film-like sheen line at the floor seam to sell the cove
    s += R(0, 1085, 2400, 3, D.lin('seam', 0, 0, 2400, 0, [[0, '#FFFFFF', 0], [0.5, '#FFFFFF', night ? 0.35 : 0.55], [1, '#FFFFFF', 0]]));
    return D.wrap(s);
  }

  function fore(night) {
    const D = Defs('o');
    let s = '';
    // out-of-focus foreground shapes at the extreme corners (engine blurs + parallaxes this layer)
    s += C(40, 1360, 130, '#C9CED6', `opacity="${night ? 0.4 : 0.32}"`);
    s += C(2290, 1380, 60, RED, 'opacity=".1"');
    s += C(2380, 40, 120, '#C9CED6', 'opacity=".35"');
    return D.wrap(s);
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      center: { x: 1200, zone: 'front' },
      left: { x: 800, zone: 'front' },
      right: { x: 1600, zone: 'front' }
    },
    draw(opts) {
      const night = (opts && opts.time) === 'night';
      return { back: back(night), mid: '', front: '', fore: fore(night) };
    }
  };
})();
