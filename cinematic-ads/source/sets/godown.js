// godown — pharmaceutical distributor's warehouse-office.
// World 2400x1350, floor line y=1250 (character plane, s=1).
// One-point perspective: eye height 660 units, vanishing point (1200, 590).
// A point (X lateral, H height above floor, Z depth) projects with s = D/Z.
window.SETS = window.SETS || {};
(function () {
  const ID = 'godown';
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
  function nightify(c) { const [r, g, b] = hx(c); return toHex([r * 0.5 + 4, g * 0.5 + 9, b * 0.54 + 24]); }
  const R = (x, y, w, h, f, ex) => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const C = (x, y, r, f, ex) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const quad = (pts, f, ex) => `<path d="M${pts.map(p => pt(p[0], p[1], p[2])).join('L')}Z" fill="${f}"${ex ? ' ' + ex : ''}/>`;
  const pick = (rng, a) => a[Math.floor(rng() * a.length) % a.length];
  const T = (x, y, size, fill, txt, ex) => `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" fill="${fill}"${ex ? ' ' + ex : ''}>${txt}</text>`;
  // estimated Poppins caps width; squeeze text that would not fit
  function fitText(x, y, size, fill, txt, maxW, anchor, weight) {
    const est = txt.length * size * 0.64;
    const fit = est > maxW ? ` textLength="${n(maxW)}" lengthAdjust="spacingAndGlyphs"` : '';
    return T(x, y, size, fill, txt, `font-weight="${weight || 600}" text-anchor="${anchor || 'middle'}"${fit}`);
  }

  // ---------- room ----------
  const ZB = 3576;            // back wall (s = 0.5)
  const XL = -1500, XR = 1150; // side walls
  const DARK = '#2A1C14';
  const KRAFT = ['#C89B67', '#BF8F5B', '#D2A774', '#B7895A', '#CDA06A', '#C49460', '#D6AE7E'];
  const WORDS = ['PARACETAMOL 500', 'AMOXYCILLIN 250', 'CETIRIZINE 10', 'ORS SACHETS', 'COUGH SYRUP', 'VITAMIN C',
    'ANTACID GEL', 'B-COMPLEX', 'IBUPROFEN 400', 'PANTOPRAZOLE', 'METFORMIN 500', 'AZITHROMYCIN', 'CALCIUM + D3',
    'MULTIVITAMIN', 'SURGICAL GLOVES', 'COTTON ROLLS', 'IRON TONIC', 'ANTISEPTIC', 'SALINE 500 ML', 'DICLOFENAC GEL',
    'ZINC TABLETS', 'BANDAGE ROLLS', 'GLUCOSE-D', 'SYRINGES 5 ML', 'ANTIFUNGAL', 'EYE DROPS'];
  const RACK = '#3E5A82', RACK_D = '#2D4566', RACK_L = '#5A77A0';
  const BEAM = '#D98A4E', BEAM_D = '#B46A35', BEAM_L = '#EAA56C';

  // ---------- carton artwork (screen space, front-facing) ----------
  function cartonFace(K, rng, x, y, w, h, c, detail) {
    const base = K(c);
    let s = R(x, y, w, h, base);
    if (detail === 0) { // tiny / far: just tape + label blob
      s += R(x + w * 0.42, y, w * 0.16, h * 0.25, K(mix(c, '#FFF3D6', 0.35)));
      s += R(x + w * 0.14, y + h * 0.45, w * 0.48, h * 0.24, K('#F3EEE2'));
      s += R(x + w * 0.84, y, w * 0.16, h, DARK, 'opacity=".12"');
      return s;
    }
    const wh = K('#F6F2E8'), ink = K('#24324D'), brown = K(mix(c, '#3B2414', 0.62));
    const white = rng() < 0.16;
    if (white) { // printed white shipper
      s = R(x, y, w, h, K('#EEE8DC'));
      const band = pick(rng, ['#5AA0D8', '#1E9E62', '#E36F5C', '#B48ED6', '#E7B04A']);
      s += R(x, y + h * 0.66, w, h * 0.17, K(band)) + R(x, y + h * 0.86, w, h * 0.05, K(band), 'opacity=".6"');
      s += fitText(x + w * 0.08, y + h * 0.42, Math.min(h * 0.17, w * 0.12), ink, pick(rng, WORDS), w * 0.84, 'start');
      s += R(x + w * 0.08, y + h * 0.5, w * 0.36, Math.max(1.5, h * 0.035), K('#8A8F98'));
    } else {
      // packing tape over the top flap seam
      s += R(x + w * 0.42, y, w * 0.16, h * 0.27, K(mix(c, '#FFF3D6', 0.38)), 'opacity=".9"');
      s += R(x + w * 0.42, y + h * 0.27 - 1.5, w * 0.16, 1.5, DARK, 'opacity=".12"');
      const st = rng();
      if (st < 0.62) { // white label with product text
        const lw = w * 0.62, lh = h * 0.34, lx = x + w * (0.08 + rng() * 0.2), ly = y + h * (0.38 + rng() * 0.12);
        s += R(lx, ly, lw, lh, wh, 'rx="1.5"');
        s += R(lx, ly, lw * 0.07, lh, K(pick(rng, ['#E36F5C', '#5AA0D8', '#1E9E62', '#E7B04A'])));
        s += fitText(lx + lw * 0.12, ly + lh * 0.44, lh * 0.3, ink, pick(rng, WORDS), lw * 0.82, 'start');
        s += fitText(lx + lw * 0.12, ly + lh * 0.8, lh * 0.2, K('#7A7F88'), 'BATCH ' + (1000 + Math.floor(rng() * 8999)) + '  EXP ' + (1 + Math.floor(rng() * 12)) + '/2' + (7 + Math.floor(rng() * 2)), lw * 0.82, 'start', 500);
      } else if (st < 0.85) { // printed straight on the kraft
        s += fitText(x + w * 0.5, y + h * 0.56, Math.min(h * 0.16, w * 0.11), brown, pick(rng, WORDS), w * 0.8);
        s += R(x + w * 0.2, y + h * 0.63, w * 0.6, Math.max(1.5, h * 0.025), brown, 'opacity=".7"');
        s += fitText(x + w * 0.5, y + h * 0.76, h * 0.09, brown, 'PHARMA DISTRIBUTION', w * 0.62, 'middle', 500);
      } else { // marker numbers
        s += fitText(x + w * 0.3, y + h * 0.66, h * 0.26, K('#22252B'), pick(rng, ['24', 'x12', 'A-7', '48', '6/B', '120', 'x36']), w * 0.5, 'middle', 600);
      }
      // this-side-up arrows
      if (rng() < 0.6) {
        const ax = x + w * 0.8, ay = y + h * 0.78, a = Math.min(w, h) * 0.07;
        s += `<path d="M${n(ax - a * 1.4)} ${n(ay)}v${n(-a * 1.6)}h${n(-a * 0.6)}l${n(a)} ${n(-a)}l${n(a)} ${n(a)}h${n(-a * 0.6)}v${n(a * 1.6)}ZM${n(ax + a * 0.6)} ${n(ay)}v${n(-a * 1.6)}h${n(-a * 0.6)}l${n(a)} ${n(-a)}l${n(a)} ${n(a)}h${n(-a * 0.6)}v${n(a * 1.6)}Z" fill="${brown}" opacity=".75"/>`;
      }
      if (rng() < 0.18) s += `<g transform="rotate(-8 ${n(x + w * 0.62)} ${n(y + h * 0.3)})">` + R(x + w * 0.4, y + h * 0.22, w * 0.42, h * 0.13, 'none', `stroke="${K('#C8161E')}" stroke-width="${n(Math.max(1, h * 0.018))}" opacity=".8"`) + fitText(x + w * 0.61, y + h * 0.32, h * 0.085, K('#C8161E'), 'FRAGILE', w * 0.36) + '</g>';
      if (rng() < 0.25) s += `<ellipse cx="${n(x + w * 0.5)}" cy="${n(y + h * 0.14)}" rx="${n(w * 0.1)}" ry="${n(h * 0.035)}" fill="${DARK}" opacity=".45"/>`;
    }
    // soft cel shading
    s += R(x + w * 0.86, y, w * 0.14, h, DARK, 'opacity=".11"');
    s += R(x, y + h - Math.max(2, h * 0.05), w, Math.max(2, h * 0.05), DARK, 'opacity=".14"');
    s += R(x, y, w, Math.max(1.2, h * 0.025), '#FFFFFF', 'opacity=".22"');
    return s;
  }

  // a 3D carton: visible faces + front artwork
  function carton3(K, rng, X0, X1, H0, H1, Z0, Z1, c, detail) {
    let s = '';
    const side = K(mix(c, DARK, 0.3)), sideLit = K(mix(c, '#FFF6E6', 0.1)), top = K(mix(c, '#FFF8EC', 0.2)), bot = K(mix(c, DARK, 0.42));
    if (X1 < 0) s += quad([[X1, H0, Z0], [X1, H0, Z1], [X1, H1, Z1], [X1, H1, Z0]], sideLit);
    else if (X0 > 0) s += quad([[X0, H0, Z0], [X0, H0, Z1], [X0, H1, Z1], [X0, H1, Z0]], side);
    if (H1 < EYE) s += quad([[X0, H1, Z0], [X1, H1, Z0], [X1, H1, Z1], [X0, H1, Z1]], top);
    else if (H0 > EYE) s += quad([[X0, H0, Z0], [X1, H0, Z0], [X1, H0, Z1], [X0, H0, Z1]], bot);
    const x = SX(X0, Z0), y = SY(H1, Z0);
    s += cartonFace(K, rng, x, y, SX(X1, Z0) - x, SY(H0, Z0) - y, c, detail);
    return s;
  }

  // carton on the left rack: we see its aisle face (X = X1), near face and top/bottom
  function cartonAisle(K, rng, X0, X1, H0, H1, Z0, Z1, c, nearVisible) {
    let s = '';
    const lit = K(mix(c, '#FFF4E0', 0.12)), top = K(mix(c, '#FFF8EC', 0.2)), bot = K(mix(c, DARK, 0.42));
    if (H1 < EYE) s += quad([[X0, H1, Z0], [X1, H1, Z0], [X1, H1, Z1], [X0, H1, Z1]], top);
    else if (H0 > EYE) s += quad([[X0, H0, Z0], [X1, H0, Z0], [X1, H0, Z1], [X0, H0, Z1]], bot);
    if (nearVisible) {
      // the near end: two cartons side by side across the rack depth
      const Xm = (X0 + X1) / 2;
      const y = SY(H1, Z0), h = SY(H0, Z0) - y;
      s += cartonFace(K, rng, SX(X0, Z0), y, SX(Xm, Z0) - SX(X0, Z0) - 2, h, c, 1);
      s += cartonFace(K, rng, SX(Xm, Z0), y, SX(X1, Z0) - SX(Xm, Z0), h, pick(rng, KRAFT), 1);
    }
    s += quad([[X1, H0, Z0], [X1, H0, Z1], [X1, H1, Z1], [X1, H1, Z0]], lit);
    // tape + label on the foreshortened face (exact projection)
    const zl = Z0 + (Z1 - Z0) * 0.12, zr = Z0 + (Z1 - Z0) * 0.78;
    const hl = H0 + (H1 - H0) * 0.3, hh = H0 + (H1 - H0) * 0.62;
    const zt0 = Z0 + (Z1 - Z0) * 0.42, zt1 = Z0 + (Z1 - Z0) * 0.58;
    s += quad([[X1, H1 - (H1 - H0) * 0.26, zt0], [X1, H1 - (H1 - H0) * 0.26, zt1], [X1, H1, zt1], [X1, H1, zt0]], K(mix(c, '#FFF3D6', 0.38)));
    if (rng() < 0.7) {
      s += quad([[X1, hl, zl], [X1, hl, zr], [X1, hh, zr], [X1, hh, zl]], K('#F3EEE2'));
      // tiny print lines on the label
      const za = zl + (zr - zl) * 0.1, zb = zl + (zr - zl) * 0.85, h1 = hl + (hh - hl) * 0.55, h2 = hl + (hh - hl) * 0.72;
      s += quad([[X1, h1, za], [X1, h1, zb], [X1, h2, zb], [X1, h2, za]], K('#2B3A55'), 'opacity=".75"');
    }
    s += quad([[X1, H0, Z0], [X1, H0, Z1], [X1, H0 + (H1 - H0) * 0.06, Z1], [X1, H0 + (H1 - H0) * 0.06, Z0]], DARK, 'opacity=".14"');
    return s;
  }

  // ---------- back wall rack (front-facing) ----------
  const BR = { x0: -900, x1: 470, z0: 3130, z1: 3540, ups: [-900, -215, 470] };
  const LEVELS = [40, 425, 805, 1185]; // beam bottoms (units above floor)
  const BEAMH = 52, TOPH = 1460, POST = 40;

  function backRack(K, night) {
    const rng = mulberry32(7711);
    const z0 = BR.z0, z1 = BR.z1;
    let s = '';
    // rack interior shadow (we look into the rack depth)
    s += R(SX(BR.x0, z0), SY(TOPH, z0), SX(BR.x1, z0) - SX(BR.x0, z0), SY(0, z0) - SY(TOPH, z0), K('#6E604F'));
    s += R(SX(BR.x0, z0), SY(TOPH, z0), SX(BR.x1, z0) - SX(BR.x0, z0), SY(0, z0) - SY(TOPH, z0), U('rackin'));
    // wall-side posts visible deep inside
    for (const X of BR.ups) s += quad([[X - POST / 2, 0, z1], [X + POST / 2, 0, z1], [X + POST / 2, TOPH, z1], [X - POST / 2, TOPH, z1]], K(RACK_D));
    // decks (thin plates on beams)
    for (const Hb of LEVELS) {
      const Ht = Hb + BEAMH;
      const f = Ht < EYE ? K('#9AA3AE') : K('#4E5966');
      s += quad([[BR.x0, Ht, z0], [BR.x1, Ht, z0], [BR.x1, Ht, z1], [BR.x0, Ht, z1]], f);
    }
    // cartons
    const boxes = [];
    for (let b = 0; b < BR.ups.length - 1; b++) {
      const bx0 = BR.ups[b] + POST / 2 + 6, bx1 = BR.ups[b + 1] - POST / 2 - 6;
      for (let l = 0; l < LEVELS.length; l++) {
        const floorH = LEVELS[l] + BEAMH;
        const ceil = l < LEVELS.length - 1 ? LEVELS[l + 1] - 18 : TOPH + 150;
        let x = bx0;
        while (x < bx1 - 60) {
          let w = 175 + rng() * 95;
          if (x + w > bx1) w = bx1 - x;
          if (w < 90) break;
          if (rng() < 0.08 && l > 0) { x += w; continue; } // empty slot
          let h = floorH;
          const c = pick(rng, KRAFT);
          const recess = 6 + rng() * 40;
          let k = 0;
          while (k < 3) {
            const hh = 120 + rng() * 70;
            if (h + hh > ceil) break;
            boxes.push({ X0: x, X1: x + w - 6, H0: h, H1: h + hh, Z0: z0 + recess, Z1: z0 + recess + 300, c: k ? pick(rng, KRAFT) : c });
            h += hh + 2; k++;
          }
          x += w;
        }
      }
    }
    boxes.sort((a, b) => {
      const ca = Math.abs((a.X0 + a.X1) / 2), cb = Math.abs((b.X0 + b.X1) / 2);
      if (Math.abs(ca - cb) > 1) return cb - ca;
      return Math.abs((b.H0 + b.H1) / 2 - EYE) - Math.abs((a.H0 + a.H1) / 2 - EYE);
    });
    for (const q of boxes) {
      const x0 = SX(q.X0, q.Z0), x1 = SX(q.X1, q.Z0), y0 = SY(q.H1, q.Z0), y1 = SY(q.H0, q.Z0);
      const quiet = x1 > 1150 && x0 < 1450 && y1 > 430 && y0 < 730;
      s += carton3(K, rng, q.X0, q.X1, q.H0, q.H1, q.Z0, q.Z1, q.c, quiet ? 0 : 1);
    }
    // beams
    for (const Hb of LEVELS) {
      const x0 = SX(BR.x0, z0), x1 = SX(BR.x1, z0), y0 = SY(Hb + BEAMH, z0), y1 = SY(Hb, z0);
      s += R(x0, y0, x1 - x0, y1 - y0, K(BEAM)) + R(x0, y0, x1 - x0, (y1 - y0) * 0.28, K(BEAM_L)) + R(x0, y1 - (y1 - y0) * 0.22, x1 - x0, (y1 - y0) * 0.22, K(BEAM_D));
      // load sticker
      s += R(x0 + 40, y0 + (y1 - y0) * 0.3, 26, (y1 - y0) * 0.45, K('#F2D16B'));
    }
    // front posts with slots
    for (const X of BR.ups) {
      const x0 = SX(X - POST / 2, z0), x1 = SX(X + POST / 2, z0), yt = SY(TOPH, z0), yb = SY(0, z0);
      s += R(x0, yt, x1 - x0, yb - yt, K(RACK)) + R(x0, yt, (x1 - x0) * 0.3, yb - yt, K(RACK_L)) + R(x1 - (x1 - x0) * 0.25, yt, (x1 - x0) * 0.25, yb - yt, K(RACK_D));
      let slots = '';
      for (let y = yt + 8; y < yb - 10; y += 14) slots += `M${n((x0 + x1) / 2 - 2)} ${n(y)}h4v7h-4Z`;
      s += `<path d="${slots}" fill="${K('#1F2A44')}" opacity=".55"/>`;
      s += R(x0 - 5, yb - 8, x1 - x0 + 10, 8, K(RACK_D));
    }
    // bay labels
    const labels = ['B-01', 'B-02'];
    for (let b = 0; b < 2; b++) {
      const xc = (SX(BR.ups[b], z0) + SX(BR.ups[b + 1], z0)) / 2, y = SY(LEVELS[3] + BEAMH, z0) + 2;
      s += R(xc - 26, y + 3, 52, 18, K('#FFFFFF'), 'rx="2"') + T(xc, y + 16.5, 12, K('#1F2A44'), labels[b], 'font-weight="600" text-anchor="middle"');
    }
    return s;
  }

  // ---------- left rack row (receding along the aisle) ----------
  const LR = { x0: -1430, x1: -985, zs: [2180, 2640, 3090, 3540] };
  function leftRack(K, night) {
    const rng = mulberry32(4242);
    let s = '';
    const X0 = LR.x0, X1 = LR.x1, zA = LR.zs[0], zZ = LR.zs[3];
    // shadowed rack interior seen past the aisle face
    s += quad([[X1, 0, zA], [X1, 0, zZ], [X1, TOPH + 260, zZ], [X1, TOPH + 260, zA]], K('#5E5244'));
    const boxes = [];
    for (let b = 0; b < 3; b++) {
      const za = LR.zs[b] + 30, zb = LR.zs[b + 1] - 30;
      for (let l = 0; l < LEVELS.length; l++) {
        const floorH = LEVELS[l] + BEAMH;
        const ceil = l < LEVELS.length - 1 ? LEVELS[l + 1] - 18 : TOPH + 200;
        let z = za;
        while (z < zb - 80) {
          let w = 200 + rng() * 80;
          if (z + w > zb) w = zb - z;
          if (w < 110) break;
          if (rng() < 0.06 && !(b === 0 && z === za)) { z += w; continue; }
          let h = floorH; let k = 0;
          const c = pick(rng, KRAFT);
          while (k < 3) {
            const hh = 120 + rng() * 70;
            if (h + hh > ceil) break;
            boxes.push({ H0: h, H1: h + hh, Z0: z, Z1: z + w - 8, c: k ? pick(rng, KRAFT) : c, near: b === 0 && z === za, rec: rng() * 14 });
            h += hh + 2; k++;
          }
          z += w;
        }
      }
    }
    boxes.sort((a, b) => (b.Z0 - a.Z0) || (Math.abs((b.H0 + b.H1) / 2 - EYE) - Math.abs((a.H0 + a.H1) / 2 - EYE)));
    for (const q of boxes) s += cartonAisle(K, rng, X0 + 10, X1 - 6 - q.rec, q.H0, q.H1, q.Z0, q.Z1, q.c, q.near);
    // decks seen from below / above
    for (const Hb of LEVELS) {
      const Ht = Hb + BEAMH;
      if (Ht > EYE) s += quad([[X0, Hb, zA], [X1, Hb, zA], [X1, Hb, zA + 22], [X0, Hb, zA + 22]], K('#3C4654'));
    }
    // beams along the aisle face
    for (const Hb of LEVELS) {
      s += quad([[X1, Hb, zA], [X1, Hb, zZ], [X1, Hb + BEAMH, zZ], [X1, Hb + BEAMH, zA]], K(BEAM));
      s += quad([[X1, Hb + BEAMH * 0.72, zA], [X1, Hb + BEAMH * 0.72, zZ], [X1, Hb + BEAMH, zZ], [X1, Hb + BEAMH, zA]], K(BEAM_L));
      s += quad([[X1, Hb, zA], [X1, Hb, zZ], [X1, Hb + BEAMH * 0.2, zZ], [X1, Hb + BEAMH * 0.2, zA]], K(BEAM_D));
    }
    // aisle-side posts (far to near)
    for (let i = LR.zs.length - 1; i >= 0; i--) {
      const z = LR.zs[i];
      s += quad([[X1, 0, z], [X1, 0, z + POST], [X1, TOPH, z + POST], [X1, TOPH, z]], K(RACK_L));
      s += quad([[X1 - POST, 0, z], [X1, 0, z], [X1, TOPH, z], [X1 - POST, TOPH, z]], K(RACK));
      s += quad([[X1 - POST, 0, z], [X1, 0, z], [X1, TOPH, z], [X1 - POST, TOPH, z]], 'none', `stroke="${K(RACK_D)}" stroke-width="1.5" opacity=".6"`);
    }
    // near end frame: wall-side post + bracing in front of the near cartons
    const z = zA - 4;
    const xa = SX(X0, z), xb = SX(X1 - POST, z), xw = SX(X0 + POST, z);
    const yt = SY(TOPH, z), yb = SY(0, z);
    s += R(xa, yt, xw - xa, yb - yt, K(RACK)) + R(xa, yt, (xw - xa) * 0.3, yb - yt, K(RACK_L));
    let br = '';
    const step = 300;
    for (let H = 120, i = 0; H < TOPH; H += step, i++) {
      const y0 = SY(H, z), y1 = SY(Math.min(TOPH, H + step), z);
      br += `M${n(xw)} ${n(y0)}L${n(xb)} ${n(y0)}`;
      br += i % 2 ? `M${n(xw)} ${n(y0)}L${n(xb)} ${n(y1)}` : `M${n(xb)} ${n(y0)}L${n(xw)} ${n(y1)}`;
    }
    s += `<path d="${br}" stroke="${K(RACK)}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    s += `<path d="${br}" stroke="${K(RACK_L)}" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(-1.5 -2)"/>`;
    // slots on the near aisle post
    const px0 = SX(X1 - POST, LR.zs[0]), px1 = SX(X1, LR.zs[0]);
    let slots = '';
    for (let y = SY(TOPH, LR.zs[0]) + 10; y < SY(0, LR.zs[0]) - 12; y += 17) slots += `M${n((px0 + px1) / 2 - 2.5)} ${n(y)}h5v9h-5Z`;
    s += `<path d="${slots}" fill="${K('#1F2A44')}" opacity=".5"/>`;
    // aisle marker sign on the end frame
    const sx = (xa + xb) / 2 - 70, sy = SY(1620, z);
    s += R(sx, sy, 140, 96, K('#1F2A44'), 'rx="8"') + R(sx + 6, sy + 6, 128, 84, 'none', `rx="5" stroke="${K('#F2D16B')}" stroke-width="2"`);
    s += T(sx + 70, sy + 42, 20, K('#F2D16B'), 'AISLE', 'font-weight="600" text-anchor="middle" letter-spacing="3"');
    s += T(sx + 70, sy + 80, 34, K('#FFFFFF'), 'A', 'font-weight="600" text-anchor="middle"');
    // base plates
    s += R(xa - 6, yb - 10, xw - xa + 12, 10, K(RACK_D)) + R(px0 - 6, SY(0, LR.zs[0]) - 10, px1 - px0 + 12, 10, K(RACK_D));
    // depth haze toward the back
    s += quad([[X1, 0, zA], [X1, 0, zZ], [X1, TOPH + 260, zZ], [X1, TOPH + 260, zA]], U('lhaze'));
    return s;
  }

  // ---------- walls ----------
  function backWall(K, night, rng) {
    let s = '';
    const x0 = SX(XL, ZB), x1 = SX(XR, ZB), yF = SY(0, ZB);
    s += R(x0, 0, x1 - x0, yF, U('bwall'));
    // dado band (1.2 m) and stripe
    const yD = SY(536, ZB);
    s += R(x0, yD, x1 - x0, yF - yD, K('#C2B59D')) + R(x0, yD - 5, x1 - x0, 5, K('#6B7686')) + R(x0, yF - 10, x1 - x0, 10, K('#A69A84'));
    // high clerestory windows + exhaust fan
    const wins = [[-1300, -700], [-500, 100], [300, 900]];
    for (const [a, b] of wins) {
      const wx0 = SX(a, ZB), wx1 = SX(b, ZB), wy0 = SY(1980, ZB), wy1 = SY(1640, ZB);
      s += R(wx0 - 6, wy0 - 6, wx1 - wx0 + 12, wy1 - wy0 + 14, K('#C9BBA2'));
      s += R(wx0, wy0, wx1 - wx0, wy1 - wy0, night ? '#18233D' : U('winsky'));
      if (night) s += R(wx0, wy0, wx1 - wx0, wy1 - wy0, '#3A5A8C', 'opacity=".25"');
      for (let k = 1; k < 4; k++) s += R(wx0 + (wx1 - wx0) * k / 4 - 2, wy0, 4, wy1 - wy0, K('#7D8796'));
      s += R(wx0, (wy0 + wy1) / 2 - 2, wx1 - wx0, 4, K('#7D8796'));
      s += R(wx0 - 8, wy1, wx1 - wx0 + 16, 8, K('#D8CCB6'));
      if (!night) s += `<path d="M${n(wx0 + 18)} ${n(wy1)}L${n(wx0 + 50)} ${n(wy0)}h22L${n(wx0 + 40)} ${n(wy1)}Z" fill="#FFFFFF" opacity=".35"/>`;
    }
    // exhaust fan between windows
    const fx = SX(-200, ZB) + 0, fy = SY(1450, ZB);
    s += R(SX(-80, ZB) - 46, fy - 46, 92, 92, K('#B3A68E'), 'rx="6"') + C(SX(-80, ZB), fy, 38, K('#3B4250'));
    let blades = '';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, cx = SX(-80, ZB), cy = fy; blades += `M${n(cx)} ${n(cy)}Q${n(cx + Math.cos(a) * 30 - Math.sin(a) * 12)} ${n(cy + Math.sin(a) * 30 + Math.cos(a) * 12)} ${n(cx + Math.cos(a + 0.5) * 34)} ${n(cy + Math.sin(a + 0.5) * 34)}Z`; }
    s += `<path d="${blades}" fill="${K('#9AA3AE')}"/>` + C(SX(-80, ZB), fy, 7, K('#6B7686'));
    // electrical conduit along the wall
    const yc = SY(1560, ZB);
    s += R(x0, yc, x1 - x0, 5, K('#9D9585')) + R(x0, yc, x1 - x0, 1.5, K('#D9CFBE'));
    for (let X = -1400; X < 1150; X += 420) s += R(SX(X, ZB) - 7, yc - 5, 14, 15, K('#8B8375'), 'rx="2"');
    // wall calendar
    s += calendar(K, SX(560, ZB), SY(1130, ZB), 116, 172);
    // wall clock above the calendar
    const cx = SX(520, ZB) + 58, cy = SY(1400, ZB);
    s += C(cx + 3, cy + 4, 30, DARK, 'opacity=".18"') + C(cx, cy, 30, K('#2B3346')) + C(cx, cy, 25, K('#F7F3EA'));
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; s += R(cx + Math.cos(a) * 20 - 1, cy + Math.sin(a) * 20 - 1, 2, 2, K('#2B3346')); }
    s += `<path d="M${n(cx)} ${n(cy)}L${n(cx + 9)} ${n(cy - 11)}M${n(cx)} ${n(cy)}L${n(cx - 4)} ${n(cy + 18)}" stroke="${K('#2B3346')}" stroke-width="3" stroke-linecap="round"/>` + C(cx, cy, 2.5, K('#C8161E'));
    // dispatch whiteboard
    const bx = SX(760, ZB), by = SY(1180, ZB), bw = SX(1100, ZB) - bx, bh = 128;
    s += R(bx + 3, by + 4, bw, bh, DARK, 'opacity=".16"') + R(bx, by, bw, bh, K('#B7BEC8'), 'rx="3"') + R(bx + 4, by + 4, bw - 8, bh - 8, K('#F8F8F4'));
    s += T(bx + 10, by + 22, 11, K('#C8161E'), 'DISPATCH', 'font-weight="600"');
    const mk = ['Sharma Med  ✓', 'City Pharma  ✓', 'Gupta Store', 'New Life Chem'];
    for (let k = 0; k < 4; k++) s += T(bx + 10, by + 42 + k * 19, 10, K(k < 2 ? '#1E9E62' : '#2E4A7A'), mk[k], 'font-weight="500"');
    s += R(bx + 8, by + bh - 4, bw - 16, 5, K('#9AA3AE'));
    // switchboard + wire
    const sbx = SX(1010, ZB), sby = SY(620, ZB);
    s += R(sbx, sby, 44, 30, K('#F2EEE6'), 'rx="2"') + R(sbx + 6, sby + 8, 7, 12, K('#6B7686')) + R(sbx + 18, sby + 8, 7, 12, K('#6B7686')) + R(sbx + 30, sby + 8, 7, 12, K('#C8161E'));
    s += R(sbx + 20, sby - (sby - yc) + 5, 3, sby - yc - 5, K('#D9D2C4'));
    return s;
  }

  function calendar(K, x, y, w, h) {
    let s = R(x + 4, y + 5, w, h, DARK, 'opacity=".18"');
    s += R(x, y, w, h, K('#FBF8F2'));
    s += R(x, y, w, h * 0.42, K('#5AA0D8'));
    // little landscape picture
    s += `<path d="M${n(x)} ${n(y + h * 0.42)}L${n(x + w * 0.3)} ${n(y + h * 0.22)}L${n(x + w * 0.5)} ${n(y + h * 0.34)}L${n(x + w * 0.72)} ${n(y + h * 0.16)}L${n(x + w)} ${n(y + h * 0.36)}V${n(y + h * 0.42)}Z" fill="${K('#7BC18E')}"/>`;
    s += C(x + w * 0.24, y + h * 0.12, w * 0.07, K('#F2D16B'));
    s += R(x, y + h * 0.42, w, h * 0.09, K('#C8161E'));
    s += T(x + w / 2, y + h * 0.49, h * 0.055, K('#FFFFFF'), 'OCTOBER 2026', 'font-weight="600" text-anchor="middle" letter-spacing="1"');
    let g = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      const d = r * 7 + c - 3; if (d < 1 || d > 31) continue;
      g += R(x + w * 0.07 + c * w * 0.126, y + h * 0.56 + r * h * 0.075, w * 0.08, h * 0.04, c === 0 ? K('#E36F5C') : K('#6B7686'));
    }
    s += g;
    // a few dates circled in marker (payment due!)
    s += `<circle cx="${n(x + w * 0.07 + 4 * w * 0.126 + w * 0.04)}" cy="${n(y + h * 0.56 + 2 * h * 0.075 + h * 0.02)}" r="${n(w * 0.075)}" fill="none" stroke="${K('#C8161E')}" stroke-width="2"/>`;
    s += R(x + w * 0.46, y - 8, w * 0.08, 10, K('#6B7686'), 'rx="2"');
    return s;
  }

  function rightWall(K, night) {
    let s = '';
    const zN = D * 1200 / 1150; // where the right wall meets the frame edge (x=2400)
    const poly = [[XR, 0, ZB], [XR, 0, zN], [XR, 2600, zN], [XR, 2600, ZB]];
    s += quad(poly, U('rwall'));
    s += quad([[XR, 0, ZB], [XR, 0, zN], [XR, 536, zN], [XR, 536, ZB]], K('#B3A68E'));
    s += quad([[XR, 530, ZB], [XR, 530, zN], [XR, 542, zN], [XR, 542, ZB]], K('#5D6878'));
    s += quad([[XR, 0, ZB], [XR, 0, zN], [XR, 22, zN], [XR, 22, ZB]], K('#958A76'));
    s += quad([[XR, 1560, ZB], [XR, 1560, zN], [XR, 1572, zN], [XR, 1572, ZB]], K('#9D9585'));
    s += loadingDoor(K, night);
    // fire extinguisher + sign
    const ze = 2060;
    const ex = SX(XR, ze), eyT = SY(760, ze), eyB = SY(470, ze);
    s += `<path d="M${n(ex - 8)} ${n(eyT + 20)}h-28a20 20 0 0 0 -20 20v${n(eyB - eyT - 50)}a14 14 0 0 0 14 14h28Z" fill="${K('#C8161E')}"/>`;
    s += `<path d="M${n(ex - 14)} ${n(eyT + 24)}h-14a10 10 0 0 0 -10 10v${n(eyB - eyT - 60)}h24Z" fill="${K('#E5474E')}" opacity=".55"/>`;
    s += R(ex - 52, eyT + 70, 34, 50, K('#F7F3EA'), 'rx="2"') + R(ex - 48, eyT + 78, 26, 4, K('#1F2A44')) + R(ex - 48, eyT + 88, 20, 3, K('#6B7686'));
    s += R(ex - 40, eyT + 4, 18, 18, K('#2B3346'), 'rx="3"') + `<path d="M${n(ex - 36)} ${n(eyT + 8)}q-26 6 -30 40" stroke="${K('#2B3346')}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    // sign above (on wall plane)
    const sz0 = 1990, sz1 = 2130, sH0 = 900, sH1 = 1040;
    s += quad([[XR, sH0, sz0], [XR, sH0, sz1], [XR, sH1, sz1], [XR, sH1, sz0]], K('#C8161E'));
    s += quad([[XR, sH0 + 18, sz0 + 18], [XR, sH0 + 18, sz1 - 18], [XR, sH1 - 18, sz1 - 18], [XR, sH1 - 18, sz0 + 18]], K('#F7F3EA'), 'opacity=".9"');
    s += `<g transform="matrix(${(SX(XR, 2059) - SX(XR, 2060)).toFixed(3)},${(SY(970, 2059) - SY(970, 2060)).toFixed(3)},0,${(D / 2060).toFixed(3)},${n(SX(XR, 2060))},${n(SY(970, 2060))})"><text x="0" y="8" font-size="26" font-weight="600" text-anchor="middle" fill="${K('#C8161E')}">FIRE</text></g>`;
    // no-smoking sign between door and back
    const nz = 3290, nH = 980;
    s += quad([[XR, nH - 90, nz - 110], [XR, nH - 90, nz + 110], [XR, nH + 90, nz + 110], [XR, nH + 90, nz - 110]], K('#F7F3EA'));
    s += `<ellipse cx="${n(SX(XR, nz))}" cy="${n(SY(nH, nz))}" rx="${n(Math.abs(SX(XR, nz + 90) - SX(XR, nz - 90)) / 2)}" ry="${n(80 * D / nz)}" fill="none" stroke="${K('#C8161E')}" stroke-width="5"/>`;
    s += `<path d="M${n(SX(XR, nz - 60))} ${n(SY(nH + 55, nz - 60))}L${n(SX(XR, nz + 60))} ${n(SY(nH - 55, nz + 60))}" stroke="${K('#C8161E')}" stroke-width="5"/>`;
    s += quad([[XR, nH - 8, nz - 50], [XR, nH - 8, nz + 40], [XR, nH + 6, nz + 40], [XR, nH + 6, nz - 50]], K('#3B4250'));
    return s;
  }

  // small rolling-shutter loading door on the right wall
  const DZ0 = 2380, DZ1 = 3120, DH = 1150, OPEN = 860;
  function loadingDoor(K, night) {
    let s = '';
    // frame / jamb shadow
    s += quad([[XR, 0, DZ0 - 50], [XR, 0, DZ1 + 50], [XR, DH + 110, DZ1 + 50], [XR, DH + 110, DZ0 - 50]], K('#9B9080'));
    // outside view clipped by the opening (sight-lines through the door have X/Z in 0.37..0.48)
    s += `<g clip-path="${U('doorclip')}">`;
    const ox = SX(XR, DZ1) - 20, ox1 = SX(XR, DZ0) + 20;
    s += R(ox, 0, ox1 - ox, 1350, night ? '#121B31' : U('outside'));
    // lane ground
    s += quad([[XR, 0, 2000], [XR + 2000, 0, 2000], [XR + 2000, 0, 9000], [XR, 0, 9000]], night ? '#1B2336' : '#E6DCC6');
    // opposite building wall across the lane
    const XW = 2600;
    s += quad([[XW, 0, 4500], [XW, 0, 8000], [XW, 3200, 8000], [XW, 3200, 4500]], night ? '#1E2842' : '#F1E3C2');
    s += quad([[XW, 0, 4500], [XW, 0, 8000], [XW, 420, 8000], [XW, 420, 4500]], night ? '#182036' : '#D9C8A6');
    s += quad([[XW, 1000, 5700], [XW, 1000, 6300], [XW, 1650, 6300], [XW, 1650, 5700]], night ? '#F2B45C' : '#BCD3E2', night ? 'opacity=".9"' : '');
    s += quad([[XW, 1000, 5990], [XW, 1000, 6010], [XW, 1650, 6010], [XW, 1650, 5990]], night ? '#7A5A2E' : '#8EA3B4');
    // tempo backed up to the door: rear face at X = 1480
    const TX = 1480, tz0 = 3170, tz1 = 3880;
    s += quad([[TX - 4, 0, tz0], [TX + 400, 0, tz0], [TX + 400, 0, tz1], [TX - 4, 0, tz1]], '#000000', 'opacity=".25"');
    s += quad([[TX, 200, tz0], [TX, 200, tz1], [TX, 1080, tz1], [TX, 1080, tz0]], night ? '#2A3550' : '#4F8CC0');
    s += quad([[TX, 290, tz0 + 50], [TX, 290, tz1 - 50], [TX, 1010, tz1 - 50], [TX, 1010, tz0 + 50]], night ? '#141A28' : '#3A4458');
    const cz = [tz0 + 60, tz0 + 300, tz0 + 520, tz1 - 60];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const h0 = 300 + j * 250, h1 = h0 + 230;
      s += quad([[TX + 2, h0, cz[i] + 8], [TX + 2, h0, cz[i + 1] - 8], [TX + 2, h1, cz[i + 1] - 8], [TX + 2, h1, cz[i] + 8]], night ? (j ? '#4A3E2E' : '#3C3326') : (j ? '#D2A774' : '#C89B67'));
    }
    s += quad([[TX, 200, tz0], [TX, 200, tz1], [TX, 260, tz1], [TX, 260, tz0]], night ? '#1A2030' : '#2E3442');
    s += quad([[TX - 2, 140, tz0 + 40], [TX - 2, 140, tz0 + 130], [TX - 2, 230, tz0 + 130], [TX - 2, 230, tz0 + 40]], night ? '#FF4D4D' : '#C8161E');
    s += quad([[TX - 2, 140, tz1 - 130], [TX - 2, 140, tz1 - 40], [TX - 2, 230, tz1 - 40], [TX - 2, 230, tz1 - 130]], night ? '#FF4D4D' : '#C8161E');
    s += quad([[TX - 2, 120, 3440], [TX - 2, 120, 3610], [TX - 2, 190, 3610], [TX - 2, 190, 3440]], night ? '#B9A04A' : '#F2D16B');
    if (night) {
      s += `<ellipse cx="${n(SX(TX, 3215))}" cy="${n(SY(185, 3215))}" rx="22" ry="16" fill="#FF4D4D" opacity=".35" filter="${U('soft')}"/>`;
      s += `<ellipse cx="${n(SX(XW, 5200))}" cy="${n(SY(2300, 5200))}" rx="120" ry="150" fill="${U('sodium')}"/>`;
      s += R(ox, 0, ox1 - ox, 1350, '#F2A54A', 'opacity=".07"');
    } else {
      s += R(ox, 0, ox1 - ox, 1350, '#FFFDF5', 'opacity=".34"');
    }
    s += '</g>';
    // shutter (rolled up to OPEN)
    s += quad([[XR, OPEN, DZ0], [XR, OPEN, DZ1], [XR, DH, DZ1], [XR, DH, DZ0]], K('#9AA3AE'));
    let sl = '';
    for (let H = OPEN + 24; H < DH; H += 26) sl += `M${pt(XR, H, DZ0)}L${pt(XR, H, DZ1)}`;
    s += `<path d="${sl}" stroke="${K('#6B7686')}" stroke-width="2.5" fill="none"/>`;
    s += quad([[XR, OPEN, DZ0], [XR, OPEN, DZ1], [XR, OPEN + 34, DZ1], [XR, OPEN + 34, DZ0]], K('#6B7686'));
    s += quad([[XR, OPEN + 10, (DZ0 + DZ1) / 2 - 60], [XR, OPEN + 10, (DZ0 + DZ1) / 2 + 60], [XR, OPEN + 22, (DZ0 + DZ1) / 2 + 60], [XR, OPEN + 22, (DZ0 + DZ1) / 2 - 60]], K('#3B4250'));
    // coil box on top
    s += quad([[XR, DH, DZ0 - 50], [XR, DH, DZ1 + 50], [XR, DH + 110, DZ1 + 50], [XR, DH + 110, DZ0 - 50]], K('#7D8796'));
    s += quad([[XR, DH, DZ0 - 50], [XR, DH, DZ1 + 50], [XR, DH + 14, DZ1 + 50], [XR, DH + 14, DZ0 - 50]], K('#5D6878'));
    // side guide channels
    for (const z of [DZ0 - 50, DZ1 + 10]) s += quad([[XR, 0, z], [XR, 0, z + 40], [XR, DH, z + 40], [XR, DH, z]], K('#6B7686'));
    // threshold plate
    s += quad([[XR, 0, DZ0], [XR - 60, 0, DZ0], [XR - 60, 0, DZ1], [XR, 0, DZ1]], K('#9AA3AE'));
    // outdoor light bloom around the opening
    if (!night) s += quad([[XR, 0, DZ0 - 10], [XR, 0, DZ1 + 10], [XR, OPEN, DZ1 + 10], [XR, OPEN, DZ0 - 10]], '#FFF6DC', `opacity=".55" filter="${U('bloom')}"`);
    else s += quad([[XR, 0, DZ0], [XR, 0, DZ1], [XR, OPEN, DZ1], [XR, OPEN, DZ0]], '#F2A54A', `opacity=".12" filter="${U('bloom')}"`);
    return s;
  }

  // ---------- floor ----------
  function floor(K, night, rng) {
    let s = '';
    const yB = SY(0, ZB);
    s += `<path d="M0 ${n(SY(0, D * 1200 / 1500))}L${n(SX(XL, ZB))} ${n(yB)}L${n(SX(XR, ZB))} ${n(yB)}L2400 ${n(SY(0, D * 1200 / 1150))}V1350H0Z" fill="${U('floor')}"/>`;
    // concrete mottling
    let m = '';
    for (let i = 0; i < 70; i++) {
      const X = -1500 + rng() * 2650, Z = 1500 + rng() * 2000;
      const x = SX(X, Z), y = SY(0, Z), sc = D / Z;
      if (y < yB + 4) continue;
      m += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n((60 + rng() * 140) * sc)}" ry="${n((8 + rng() * 16) * sc)}"/>`;
    }
    s += `<g fill="${K('#8E8577')}" opacity=".08">${m}</g>`;
    // expansion joints
    let j = '';
    for (let X = -1500; X <= 1150; X += 530) j += `M${pt(X, 0, ZB)}L${pt(X, 0, 1350)}`;
    for (const Z of [1600, 2000, 2550, 3200]) j += `M${pt(-1500, 0, Z)}L${pt(1150, 0, Z)}`;
    s += `<path d="${j}" stroke="${K('#9C9486')}" stroke-width="2" fill="none" opacity=".55"/>`;
    // yellow safety lanes
    const lane = (X, w) => quad([[X, 0, 1250], [X + w, 0, 1250], [X + w, 0, ZB], [X, 0, ZB]], K('#E7B04A'), 'opacity=".9"');
    s += lane(-930, 40) + lane(1010, 40);
    // hatched zone in front of the loading door
    let hz = '';
    for (let z = DZ0; z < DZ1; z += 110) hz += `M${pt(XR - 10, 0, z)}L${pt(XR - 200, 0, z + 70)}L${pt(XR - 200, 0, z + 120)}L${pt(XR - 10, 0, z + 50)}Z`;
    s += `<path d="${hz}" fill="${K('#E7B04A')}" opacity=".75"/>`;
    // oil stain + tyre marks
    s += `<ellipse cx="${n(SX(600, 2300))}" cy="${n(SY(0, 2300))}" rx="70" ry="9" fill="${K('#6B6255')}" opacity=".18"/>`;
    s += `<path d="M${pt(300, 0, 2900)}Q${pt(-100, 0, 2300)} ${pt(-300, 0, 1500)}" stroke="${K('#6B6255')}" stroke-width="7" fill="none" opacity=".08"/>`;
    s += `<path d="M${pt(420, 0, 2900)}Q${pt(20, 0, 2300)} ${pt(-160, 0, 1500)}" stroke="${K('#6B6255')}" stroke-width="7" fill="none" opacity=".08"/>`;
    return s;
  }

  // ---------- hanging tube light ----------
  function tubeLight(K, night, x, y, len, sc, glow) {
    let s = '';
    s += `<path d="M${n(x + len * 0.18)} 0V${n(y)}M${n(x + len * 0.82)} 0V${n(y)}" stroke="${K('#5D6878')}" stroke-width="${n(3 * sc)}" stroke-dasharray="${n(6 * sc)} ${n(3 * sc)}"/>`;
    if (night || glow) s += `<ellipse cx="${n(x + len / 2)}" cy="${n(y + 30 * sc)}" rx="${n(len * 0.75)}" ry="${n(90 * sc)}" fill="${U('tglow')}"/>`;
    s += `<path d="M${n(x)} ${n(y)}h${n(len)}l${n(-18 * sc)} ${n(26 * sc)}h${n(-len + 36 * sc)}Z" fill="${K('#E3E6EA')}"/>`;
    s += `<path d="M${n(x)} ${n(y)}h${n(len)}l${n(-4 * sc)} ${n(6 * sc)}h${n(-len + 8 * sc)}Z" fill="${K('#FFFFFF')}" opacity=".6"/>`;
    s += R(x + 16 * sc, y + 22 * sc, len - 32 * sc, 11 * sc, night ? '#FFF6E2' : '#FFFFFF', `rx="${n(5 * sc)}"`);
    s += R(x + 16 * sc, y + 22 * sc, len - 32 * sc, 11 * sc, night ? '#FFE7B8' : '#FFFFFF', `rx="${n(5 * sc)}" filter="${U('soft')}" opacity=".9"`);
    s += R(x + 10 * sc, y + 20 * sc, 10 * sc, 15 * sc, K('#AEB6C2')) + R(x + len - 20 * sc, y + 20 * sc, 10 * sc, 15 * sc, K('#AEB6C2'));
    return s;
  }

  // ---------- desk + props (front layer, screen space) ----------
  const DX0 = 880, DX1 = 1800, DTOP = 880, DBACK = 847, DBOT = 1268;
  function desk(K, night) {
    let s = '';
    const kb = (DBACK - VPY) / (DTOP - VPY);
    const bx0 = VPX + (DX0 - VPX) * kb, bx1 = VPX + (DX1 - VPX) * kb;
    // floor contact shadow
    s += `<ellipse cx="${(DX0 + DX1) / 2}" cy="${DBOT + 4}" rx="${(DX1 - DX0) / 2 + 60}" ry="22" fill="${DARK}" opacity=".28" filter="${U('sblur')}"/>`;
    // body
    s += R(DX0 + 6, DTOP + 20, DX1 - DX0 - 12, DBOT - DTOP - 20, K('#8C5F3B'));
    // two modesty panels with insets
    const mid = (DX0 + DX1) / 2;
    for (const [a, b] of [[DX0 + 34, mid - 8], [mid + 8, DX1 - 34]]) {
      s += R(a, DTOP + 52, b - a, DBOT - DTOP - 110, K('#9A6B43'), 'rx="4"');
      s += R(a, DTOP + 52, b - a, 10, K('#7A5233'), 'opacity=".7"');
      s += R(a, DTOP + 52, 6, DBOT - DTOP - 110, K('#B9875A'), 'opacity=".5"');
    }
    // wood grain
    const rng = mulberry32(99);
    let gr = '';
    for (let i = 0; i < 26; i++) {
      const y = DTOP + 70 + rng() * (DBOT - DTOP - 140), x = DX0 + 50 + rng() * (DX1 - DX0 - 260), w = 80 + rng() * 200;
      gr += `M${n(x)} ${n(y)}q${n(w / 2)} ${n(-3 + rng() * 6)} ${n(w)} 0`;
    }
    s += `<path d="${gr}" stroke="${K('#7A5233')}" stroke-width="2" fill="none" opacity=".3"/>`;
    // side gables
    s += R(DX0, DTOP + 18, 34, DBOT - DTOP - 18, K('#7A5233')) + R(DX1 - 34, DTOP + 18, 34, DBOT - DTOP - 18, K('#7A5233'));
    s += R(DX0, DTOP + 18, 8, DBOT - DTOP - 18, K('#9A6B43'));
    // plinth + aluminium kick strip
    s += R(DX0 + 6, DBOT - 34, DX1 - DX0 - 12, 34, K('#5E3F27'));
    s += R(DX0 + 34, DBOT - 58, DX1 - DX0 - 68, 6, K('#C9CDD3'), 'opacity=".7"');
    // top surface
    s += `<path d="M${n(bx0)} ${DBACK}H${n(bx1)}L${DX1} ${DTOP}H${DX0}Z" fill="${K('#C79A6C')}"/>`;
    s += `<path d="M${n(bx0)} ${DBACK}H${n(bx1)}L${n(bx1 + (DX1 - bx1) * 0.25)} ${n(DBACK + 8)}H${n(bx0 + (DX0 - bx0) * 0.25)}Z" fill="${K('#A87D52')}" opacity=".6"/>`;
    // front edge band
    s += R(DX0 - 6, DTOP, DX1 - DX0 + 12, 24, K('#B9875A'), 'rx="4"') + R(DX0 - 6, DTOP, DX1 - DX0 + 12, 6, K('#D7AC7E'), 'rx="3"') + R(DX0 - 6, DTOP + 19, DX1 - DX0 + 12, 5, K('#7A5233'), 'opacity=".6"');
    s += R(DX0 + 6, DTOP + 24, DX1 - DX0 - 12, 26, U('ao'));
    // printed notice taped to the desk front
    const nx = 1520, ny = 960;
    s += `<g transform="rotate(-2 ${nx + 80} ${ny + 60})">` + R(nx + 4, ny + 5, 160, 116, DARK, 'opacity=".18"') + R(nx, ny, 160, 116, K('#FBF8F2'));
    s += R(nx, ny, 160, 28, K('#C8161E')) + T(nx + 80, ny + 19, 13, K('#FFFFFF'), 'ORDER CUT-OFF', 'font-weight="600" text-anchor="middle" letter-spacing="1"');
    s += T(nx + 80, ny + 66, 30, K('#1F2A44'), '4:00 PM', 'font-weight="600" text-anchor="middle"');
    s += T(nx + 80, ny + 90, 11, K('#6B7686'), 'Same-day dispatch', 'font-weight="500" text-anchor="middle"');
    s += R(nx + 50, ny + 100, 60, 3, K('#AEB6C2'));
    s += `<path d="M${nx - 10} ${ny + 6}l26 -12l6 14l-26 12Z M${nx + 144} ${ny - 6}l26 12l-6 14l-26 -12Z" fill="${K('#EDE3C8')}" opacity=".85"/></g>`;
    if (night) s += `<ellipse cx="1300" cy="${DTOP - 8}" rx="600" ry="42" fill="${U('warm')}"/>`;
    return s;
  }

  function invoices(K, rng) {
    let s = '';
    const x = 1152, b = 870;
    s += `<ellipse cx="${x + 50}" cy="${b + 2}" rx="62" ry="6" fill="${DARK}" opacity=".25"/>`;
    let y = b;
    const cols = ['#F7F3EA', '#EFE8D8', '#F7F3EA', '#E3ECF5', '#F7F3EA', '#F4E7C9', '#F7F3EA'];
    for (let i = 0; i < 8; i++) {
      const h = 7 + rng() * 8, off = (rng() - 0.5) * 10, w = 96 + rng() * 8;
      y -= h;
      s += R(x + off, y, w, h, K(cols[i % cols.length]), 'rx="1"') + R(x + off, y + h - 1.5, w, 1.5, K('#C9BFA8'));
      if (i % 3 === 1) s += R(x + off + w * 0.62, y, 3, h, K('#C8161E'), 'opacity=".8"');
    }
    // binder clip on top bundle
    s += R(x + 34, y - 6, 24, 12, K('#22252B'), 'rx="2"') + `<path d="M${x + 38} ${n(y - 6)}l-4 -16h30l-4 16" stroke="${K('#AEB6C2')}" stroke-width="2.5" fill="none"/>`;
    // a loose bill slipping off the pile
    s += `<path d="M${x + 70} ${b - 2}l58 -4l4 8l-58 4Z" fill="${K('#F7F3EA')}"/>` + `<path d="M${x + 78} ${b - 1}l36 -2.5" stroke="${K('#9AA3AE')}" stroke-width="1.5"/>`;
    return s;
  }

  // dot-matrix printer at the left end of the desk
  const PX0 = 898, PX1 = 1140, PYT = 800, PYB = 872;
  function printer(K, night) {
    let s = '';
    const x = PX0, w = PX1 - PX0, yT = PYT, yB = PYB;
    s += `<ellipse cx="${x + w / 2}" cy="${yB + 2}" rx="${w / 2 + 12}" ry="7" fill="${DARK}" opacity=".3"/>`;
    s += `<path d="M${x} ${yB}V${yT + 14}q0 -14 14 -14H${x + w - 14}q14 0 14 14V${yB}Z" fill="${K('#5D6575')}"/>`;
    s += R(x, yT + 30, w, yB - yT - 30, K('#4A5262'));
    s += R(x, yT + 30, w, 3, K('#7D8796'));
    s += R(x + 6, yT + 2, w - 12, 4, K('#8A93A2'), 'rx="2"');
    s += R(x + 14, yT - 12, w - 28, 16, K('#2B303B'), 'rx="5"'); // smoked lid
    s += R(x + 20, yT - 10, w - 40, 4, K('#6B7686'), 'opacity=".7"');
    // platen knob on the right side
    s += R(x + w - 4, yT + 6, 14, 30, K('#3B4250'), 'rx="5"') + R(x + w - 2, yT + 10, 4, 22, K('#6B7686'));
    // vents (left) + control panel (right)
    let v = '';
    for (let i = 0; i < 4; i++) v += `M${x + 12} ${yT + 42 + i * 7}h40`;
    s += `<path d="${v}" stroke="${K('#363C48')}" stroke-width="3"/>`;
    s += R(x + w - 64, yT + 40, 52, 22, K('#2B303B'), 'rx="3"');
    s += C(x + w - 54, yT + 51, 3.5, night ? '#7CFFB0' : '#1E9E62') + C(x + w - 42, yT + 51, 3.5, night ? '#FFC870' : '#E7B04A');
    s += R(x + w - 32, yT + 46, 14, 10, K('#8A8F98'), 'rx="2"');
    s += R(x, yB - 6, w, 6, K('#363C48'));
    if (night) s += C(x + w - 54, yT + 51, 10, '#7CFFB0', 'opacity=".25"');
    return s;
  }

  // continuous fan-fold (green-bar) paper spewing out of the printer, over the desk edge, onto the floor
  function paperPanel(K, x0, x1, y0, y1, shade, seed) {
    // one fan-fold sheet: green bars, printed bill lines, sprocket holes, all kept inside the sheet
    const wPaper = K('#FBFAF5'), bar = K('#DCEBDD');
    let s = R(x0, y0, x1 - x0, y1 - y0, wPaper);
    let g = '', t = '', h = '';
    const ph = (seed * 15) % 30;
    for (let y = y0 + 4 - ph; y < y1 - 2; y += 30) { const a = Math.max(y, y0), b = Math.min(y + 15, y1); if (b > a) g += `M${n(x0 + 1)} ${n(a)}H${n(x1 - 1)}V${n(b)}H${n(x0 + 1)}Z`; }
    for (let y = y0 + 10, i = seed * 3; y < y1 - 6; y += 15, i++) {
      if (i % 9 === 0) { t += `M${n(x0 + 16)} ${n(y)}h${n((x1 - x0) * 0.45)}v3h${n(-(x1 - x0) * 0.45)}Z`; continue; }
      const L = (x1 - x0) * (0.18 + (i * 37 % 30) / 120);
      t += `M${n(x0 + 16)} ${n(y)}h${n(L)}v2.4h${n(-L)}Z` + `M${n(x1 - 46)} ${n(y)}h14v2.4h-14ZM${n(x1 - 26)} ${n(y)}h14v2.4h-14Z`;
    }
    for (let y = y0 + 6; y < y1 - 3; y += 13) h += `M${n(x0 + 6)} ${n(y)}a2.3 2.3 0 1 0 0.1 0ZM${n(x1 - 6)} ${n(y)}a2.3 2.3 0 1 0 0.1 0Z`;
    s += `<path d="${g}" fill="${bar}"/><path d="${t}" fill="${K('#59606E')}" opacity=".7"/><path d="${h}" fill="${K('#B9B5AA')}"/>`;
    if (shade > 0) s += R(x0, y0, x1 - x0, y1 - y0, K('#7D776A'), `opacity="${shade}"`);
    return s;
  }
  function paperStream(K, night) {
    let s = '';
    const xa = 958, xb = 1080;
    const wPaper = K('#FBFAF5');
    // feed loop rising from the slot
    s += `<path d="M${xa + 4} ${PYT}C${xa} 742 ${xb} 742 ${xb - 4} ${PYT}Z" fill="${wPaper}"/>`;
    s += `<path d="M${xa + 4} ${PYT}C${xa} 742 ${xb} 742 ${xb - 4} ${PYT}C${xb - 8} 770 ${xa + 8} 770 ${xa + 4} ${PYT}Z" fill="${K('#E2DED4')}"/>`;
    // top sheet coming over the printer and across the desk edge
    const top = 790, edge = 884, bottom = 1226;
    s += paperPanel(K, xa, xb, top, edge + 30, 0, 0);
    s += R(xa - 2, edge - 10, xb - xa + 4, 44, U('bend'));
    s += R(xa, top, xb - xa, 14, DARK, 'opacity=".07"');
    // hanging accordion: each fold slightly swayed, faces alternately lit and shaded
    const sway = [2, -4, 3, -6, 1, -3];
    let y = edge + 30, i = 0;
    while (y < bottom - 4) {
      const h = i === 0 ? 120 : 150, y1 = Math.min(bottom, y + h);
      const dx = sway[i % sway.length], nar = i % 2 ? 4 : 0;
      s += paperPanel(K, xa + dx + nar, xb + dx - nar, y, y1, i % 2 ? 0.12 : 0, i + 1);
      // fold crease: bright lip on lit folds, soft shadow under it
      s += R(xa + dx - 2, y - 2, xb - xa + 4, 4, '#FFFFFF', `opacity="${i % 2 ? 0.5 : 0.9}" rx="2"`);
      s += R(xa + dx + nar, y + 2, xb - xa - 2 * nar, 6, DARK, 'opacity=".07"');
      y = y1; i++;
    }
    // zig-zag pile on the floor
    const pile = [[930, 1264], [914, 1252], [936, 1240], [916, 1228], [932, 1216]];
    let p = '';
    for (let k = 0; k < pile.length; k++) {
      const [x, yy] = pile[k], w = 180, dir = k % 2 ? 1 : -1;
      p += `<path d="M${x} ${yy}h${w}l${dir * 14} -13h${-w}Z" fill="${wPaper}"/>`;
      p += `<path d="M${x} ${yy}h${w}v4h${-w}Z" fill="${K('#D5D1C6')}"/>`;
      p += `<path d="M${x + 14} ${yy - 6}h${w - 30}" stroke="${K('#DCEBDD')}" stroke-width="4"/>`;
    }
    s = `<ellipse cx="1020" cy="1270" rx="150" ry="12" fill="${DARK}" opacity=".24"/>` + s + p;
    // loose sheets that escaped the pile
    s += `<path d="M1120 1264c30 -6 60 -4 92 4l-8 12c-30 -6 -58 -8 -88 -4Z" fill="${wPaper}"/><path d="M1120 1264c30 -6 60 -4 92 4" stroke="${K('#DCEBDD')}" stroke-width="3" fill="none"/>`;
    s += `<path d="M840 1270l70 -6l6 10l-70 6Z" fill="${wPaper}"/>`;
    return s;
  }

  const SCR = [1494, 666, 226, 140];
  function computer(K, night) {
    let s = '';
    const [sx, sy, sw, sh] = SCR;
    s += `<ellipse cx="${sx + sw / 2}" cy="874" rx="80" ry="7" fill="${DARK}" opacity=".3"/>`;
    s += `<path d="M${sx + sw / 2 - 14} ${sy + sh + 6}h28l8 54h-44Z" fill="${K('#2E3442')}"/>`;
    s += `<path d="M${sx + sw / 2 - 58} 872q0 -12 12 -12h92q12 0 12 12Z" fill="${K('#353B4A')}"/>`;
    s += R(sx - 10, sy - 10, sw + 20, sh + 22, K('#22262F'), 'rx="8"');
    s += R(sx - 10, sy + sh + 4, sw + 20, 8, K('#2E3442'), 'rx="4"');
    s += C(sx + sw / 2, sy + sh + 8, 2, night ? '#8FD4FF' : '#5AA0D8');
    // screen: billing software UI hint
    s += R(sx, sy, sw, sh, night ? '#EAF2FA' : '#F4F7FA');
    s += R(sx, sy, sw, 16, '#1F2A44') + R(sx + 6, sy + 5, 40, 6, '#C8161E') + R(sx, sy + 16, 32, sh - 16, '#E3E8EF');
    for (let i = 0; i < 6; i++) s += R(sx + 6, sy + 24 + i * 16, 20, 5, i === 1 ? '#C8161E' : '#AEB6C2');
    for (let i = 0; i < 6; i++) s += R(sx + 42, sy + 26 + i * 15, 82, 5, '#6B7686') + R(sx + 136, sy + 26 + i * 15, 28, 5, '#AEB6C2') + R(sx + 176, sy + 26 + i * 15, 40, 5, i === 3 ? '#E36F5C' : '#AEB6C2');
    s += R(sx + 42, sy + sh - 22, 56, 13, '#1F2A44', 'rx="2"') + R(sx + sw - 72, sy + sh - 22, 64, 13, '#1E9E62', 'rx="2"');
    s += `<path d="M${sx} ${sy}h66l-48 ${sh}h-18Z" fill="#FFFFFF" opacity=".16"/>`;
    if (night) s += `<ellipse cx="${sx + sw / 2}" cy="${sy + sh / 2}" rx="${sw}" ry="${sh}" fill="${U('screenglow')}"/>`;
    // CPU tower on the desk (right end)
    const cx = 1730, cy = 690, cw = 62, ch = 182;
    s += `<ellipse cx="${cx + cw / 2}" cy="874" rx="44" ry="6" fill="${DARK}" opacity=".3"/>`;
    s += `<path d="M${cx} ${cy}l-7 -9h${cw}l7 9Z" fill="${K('#4A5262')}"/>`;
    s += R(cx, cy, cw, ch, K('#2E3442'), 'rx="4"') + R(cx, cy, 9, ch, K('#3B4250'));
    s += R(cx + 14, cy + 18, cw - 24, 10, K('#1F232C'), 'rx="2"') + R(cx + 14, cy + 36, cw - 24, 4, K('#4A5262'));
    s += C(cx + 33, cy + 70, 7, K('#4A5262')) + C(cx + 33, cy + 70, 3, night ? '#8FD4FF' : '#5AA0D8');
    let v = '';
    for (let y = cy + 100; y < cy + ch - 12; y += 9) v += `M${cx + 14} ${y}h${cw - 24}`;
    s += `<path d="${v}" stroke="${K('#1F232C')}" stroke-width="3"/>`;
    // keyboard + mouse
    s += `<path d="M1290 873l10 -14h170l10 14Z" fill="${K('#2E3442')}"/>` + `<path d="M1290 873h190v4h-190Z" fill="${K('#1F232C')}"/>`;
    let k = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 15; c++) k += `M${n(1304 + c * 11 + r * 1.5)} ${n(862 + r * 3.7)}h8v2.4h-8Z`;
    s += `<path d="${k}" fill="${K('#5D6575')}"/>`;
    s += `<ellipse cx="1500" cy="869" rx="11" ry="6" fill="${K('#2E3442')}"/>`;
    // calculator lying flat
    s += `<path d="M1640 877l6 -14h66l4 14Z" fill="${K('#3B4250')}"/>` + R(1652, 865, 28, 4, K('#BFD8C8'));
    s += `<path d="M1656 871h46" stroke="${K('#9AA3AE')}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
    // cutting-chai glass
    s += `<path d="M1258 878l-4 -40h30l-4 40Z" fill="${K('#E9E4DA')}" opacity=".85"/>` + `<path d="M1257 870l-2 -20h28l-2 20Z" fill="${K('#C58A4E')}"/>` + R(1254, 836, 30, 3, '#FFFFFF', 'opacity=".6"');
    if (night) s += `<path d="M1264 830q-6 -14 2 -26M1274 828q-6 -14 2 -24" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".25"/>`;
    return s;
  }

  // ---------- mid-layer floor props ----------
  function pallet(K, X0, X1, Z0, Z1) {
    let s = '';
    const wood = '#B9875A', woodD = '#7A5233';
    s += quad([[X0, 0, Z0], [X1, 0, Z0], [X1, 64, Z0], [X0, 64, Z0]], K(woodD));
    for (let i = 0; i < 3; i++) { const xa = X0 + (X1 - X0) * (i * 0.45) + 4, xb = xa + (X1 - X0) * 0.1; s += quad([[xa, 8, Z0], [xb, 8, Z0], [xb, 52, Z0], [xa, 52, Z0]], K('#4E331F')); }
    s += quad([[X0, 52, Z0], [X1, 52, Z0], [X1, 64, Z0], [X0, 64, Z0]], K(wood));
    s += quad([[X0, 0, Z0], [X1, 0, Z0], [X1, 8, Z0], [X0, 8, Z0]], K(wood));
    return s;
  }

  function cartonStack(K, rng, X0, X1, Z0, depth, rows, shrink) {
    let s = pallet(K, X0, X1, Z0, Z0 + depth);
    const boxes = [];
    let H = 64;
    for (let r = 0; r < rows; r++) {
      const hh = 150 + rng() * 40;
      const cols = r === rows - 1 && rng() < 0.6 ? 1 : 2;
      for (let c = 0; c < cols; c++) {
        const w = (X1 - X0) / 2;
        const a = cols === 1 ? X0 + w * 0.5 * (rng() < 0.5 ? 0 : 1) : X0 + c * w;
        boxes.push({ X0: a + 3, X1: a + w - 3, H0: H, H1: H + hh, c: pick(rng, KRAFT) });
      }
      H += hh + 2;
    }
    boxes.sort((a, b) => (Math.abs((a.X0 + a.X1) / 2) > Math.abs((b.X0 + b.X1) / 2) ? -1 : 1) || 0);
    boxes.sort((a, b) => Math.abs((b.H0 + b.H1) / 2 - EYE) - Math.abs((a.H0 + a.H1) / 2 - EYE));
    for (const q of boxes) s += carton3(K, rng, q.X0, q.X1, q.H0, q.H1, Z0 + 4, Z0 + depth, q.c, 1);
    if (shrink) s += quad([[X0, 64, Z0 + 2], [X1, 64, Z0 + 2], [X1, H, Z0 + 2], [X0, H, Z0 + 2]], '#FFFFFF', 'opacity=".12"');
    return s;
  }

  // ---------- light ----------
  function godRays(K, night) {
    // soft shafts of light from the high windows, drifting dust
    const rays = [[620, 170, 260, 900], [1010, 150, 330, 940]];
    let s = '';
    for (const [x, w, dx, len] of rays) s += `<path d="M${x} 30h${w}L${x + w - dx + 160} ${30 + len}H${x - dx - 80}Z" fill="${U('ray')}" filter="${U('raysoft')}" opacity="${night ? 0.4 : 1}"/>`;
    if (night) return s;
    const rng = mulberry32(31);
    let d = '';
    for (let i = 0; i < 46; i++) {
      const t = rng(), r = rays[i % 2];
      const y = 90 + t * (r[3] - 120), x = r[0] - (r[2] - 40) * t + rng() * (r[1] + 60);
      d += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1 + rng() * 2)}" opacity="${n(0.3 + rng() * 0.5)}"/>`;
    }
    return s + `<g fill="#FFFFFF">${d}</g>`;
  }

  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      desk: { x: 1300, zone: 'behind' },
      left: { x: 500, zone: 'front' },
      right: { x: 1900, zone: 'front' }
    },
    screenRect: SCR.slice(),
    draw(opts) {
      opts = opts || {};
      const night = opts.time === 'night';
      const K = night ? nightify : (c => c);
      LAYER = '';
      const rng = mulberry32(2024);
      const doorPts = [[XR, 0, DZ0], [XR, 0, DZ1], [XR, OPEN, DZ1], [XR, OPEN, DZ0]];

      const defs = `<defs>
<linearGradient id="${P('bwall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#DCCDB3')}"/><stop offset=".5" stop-color="${K('#E9DCC6')}"/><stop offset="1" stop-color="${K('#E2D3BA')}"/></linearGradient>
<linearGradient id="${P('rwall')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K('#DCCDB3')}"/><stop offset="1" stop-color="${K('#CDBC9F')}"/></linearGradient>
<linearGradient id="${P('lwall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#C9B99E')}"/><stop offset="1" stop-color="${K('#D8C9AF')}"/></linearGradient>
<linearGradient id="${P('floor')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K('#B2AA9C')}"/><stop offset=".45" stop-color="${K('#C3BBAE')}"/><stop offset="1" stop-color="${K('#CFC8BC')}"/></linearGradient>
<linearGradient id="${P('winsky')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE4F2"/><stop offset="1" stop-color="#F6F1E2"/></linearGradient>
<linearGradient id="${P('outside')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F0F5"/><stop offset="1" stop-color="#FFF8E6"/></linearGradient>
<linearGradient id="${P('rackin')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A120C" stop-opacity=".35"/><stop offset="1" stop-color="#1A120C" stop-opacity=".15"/></linearGradient>
<linearGradient id="${P('lhaze')}" gradientUnits="userSpaceOnUse" x1="340" y1="0" x2="720" y2="0"><stop offset="0" stop-color="${night ? '#141C30' : '#EFE6D6'}" stop-opacity="0"/><stop offset="1" stop-color="${night ? '#141C30' : '#EFE6D6'}" stop-opacity="${night ? 0.5 : 0.32}"/></linearGradient>
<linearGradient id="${P('ray')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#9DB8E8' : '#FFF7E2'}" stop-opacity="${night ? 0.25 : 0.38}"/><stop offset="1" stop-color="${night ? '#9DB8E8' : '#FFF7E2'}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('ao')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DARK}" stop-opacity=".35"/><stop offset="1" stop-color="${DARK}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('bend')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity=".5"/><stop offset=".6" stop-color="${DARK}" stop-opacity=".12"/><stop offset="1" stop-color="${DARK}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('doorpatch')}" gradientUnits="userSpaceOnUse" x1="${n(SX(XR, 2700))}" y1="0" x2="${n(SX(XR - 900, 2400))}" y2="0"><stop offset="0" stop-color="${night ? '#F2A54A' : '#FFF4D6'}" stop-opacity="${night ? 0.18 : 0.6}"/><stop offset="1" stop-color="${night ? '#F2A54A' : '#FFF4D6'}" stop-opacity="0"/></linearGradient>
<linearGradient id="${P('lfall')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${night ? '#070C18' : '#2A1C14'}" stop-opacity="${night ? 0.45 : 0.3}"/><stop offset=".7" stop-color="${night ? '#070C18' : '#2A1C14'}" stop-opacity="${night ? 0.2 : 0.1}"/><stop offset="1" stop-color="${night ? '#070C18' : '#2A1C14'}" stop-opacity="0"/></linearGradient>
<radialGradient id="${P('nightfall')}" gradientUnits="userSpaceOnUse" cx="1270" cy="420" r="1250"><stop offset=".12" stop-color="#060A16" stop-opacity="0"/><stop offset=".6" stop-color="#060A16" stop-opacity=".32"/><stop offset="1" stop-color="#060A16" stop-opacity=".55"/></radialGradient>
<linearGradient id="${P('cone')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7B8" stop-opacity=".22"/><stop offset="1" stop-color="#FFE7B8" stop-opacity="0"/></linearGradient>
<radialGradient id="${P('tglow')}"><stop offset="0" stop-color="${night ? '#FFE9C4' : '#FFFFFF'}" stop-opacity="${night ? 0.75 : 0.5}"/><stop offset="1" stop-color="${night ? '#FFE9C4' : '#FFFFFF'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('warm')}"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".32"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('pool')}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${night ? '#FFD6A0' : '#FFFBF0'}" stop-opacity="${night ? 0.3 : 0.22}"/><stop offset="1" stop-color="${night ? '#FFD6A0' : '#FFFBF0'}" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('sodium')}"><stop offset="0" stop-color="#FFB45C" stop-opacity=".9"/><stop offset="1" stop-color="#FFB45C" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('screenglow')}"><stop offset="0" stop-color="#BFE0FF" stop-opacity=".22"/><stop offset="1" stop-color="#BFE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="${P('vig')}" cx=".5" cy=".45" r=".78"><stop offset=".55" stop-color="${night ? '#070C18' : '#1A120C'}" stop-opacity="0"/><stop offset="1" stop-color="${night ? '#070C18' : '#1A120C'}" stop-opacity="${night ? 0.7 : 0.26}"/></radialGradient>
<clipPath id="${P('doorclip')}"><path d="M${doorPts.map(p => pt(p[0], p[1], p[2])).join('L')}Z"/></clipPath>
<filter id="${P('soft')}" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${P('sblur')}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="${P('raysoft')}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="${P('bloom')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
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
      let back = '';
      back += R(0, 0, 2400, 1350, U('lwall'));
      back += backWall(K, night, rng);
      back += rightWall(K, night);
      back += floor(K, night, rng);
      // light patch from the loading door
      back += quad([[XR - 20, 0, DZ0], [XR - 20, 0, DZ1], [XR - 900, 0, DZ1 - 520], [XR - 900, 0, DZ0 - 420]], U('doorpatch'));
      // glossy floor: reflection of the bright door opening
      back += quad([[XR - 4, 0, DZ0], [XR - 4, 0, DZ1], [XR - 4, -330, DZ1], [XR - 4, -330, DZ0]], night ? '#F2A54A' : '#FFF6DC', `opacity="${night ? 0.1 : 0.32}" filter="${U('bloom')}"`);
      // shadows of racks on the floor
      back += quad([[LR.x1, 0, LR.zs[0]], [LR.x1 + 160, 0, LR.zs[0] - 60], [LR.x1 + 160, 0, ZB], [LR.x1, 0, ZB]], DARK, 'opacity=".12"');
      back += quad([[BR.x0, 0, BR.z0], [BR.x1, 0, BR.z0], [BR.x1, 0, BR.z0 - 150], [BR.x0, 0, BR.z0 - 150]], DARK, 'opacity=".1"');
      back += backRack(K, night);
      // haze on the back wall zone
      back += R(SX(XL, ZB), 0, SX(XR, ZB) - SX(XL, ZB), SY(0, ZB) + 46, night ? '#0E1428' : '#F1E9DB', `opacity="${night ? 0.34 : 0.24}"`);
      back += leftRack(K, night);
      // distant hanging lights over the aisle
      // second tube light hanging over the left aisle (motivates light on the 'left' spot)
      const zl = 2500, kl = D / zl;
      if (night) back += `<path d="M${n(SX(-900, zl) + 20)} ${n(SY(1330, zl) + 30)}H${n(SX(-420, zl) - 20)}L${n(SX(-300, zl) + 120)} ${n(SY(0, 2000))}H${n(SX(-1000, zl) - 160)}Z" fill="${U('cone')}" opacity=".7" filter="${U('raysoft')}"/>`;
      back += tubeLight(K, night, SX(-900, zl), SY(1330, zl), 480 * kl, kl, false);
      if (night) back += `<ellipse cx="${n(SX(-660, 2050))}" cy="${n(SY(0, 2050))}" rx="360" ry="60" fill="${U('warm')}"/>`;
      back += godRays(K, night);
      back += `<ellipse cx="1250" cy="700" rx="950" ry="560" fill="${U('pool')}"/>`;
      if (night) {
        back += R(0, 0, 2400, 1350, U('nightfall'));
        back += `<ellipse cx="1260" cy="1240" rx="700" ry="120" fill="${U('warm')}"/>`;
      }
      // the near rack end sits outside the key light
      back += R(0, 0, 470, 1350, U('lfall'));
      back += R(0, 0, 2400, 1350, U('vig'));

      // ----- mid -----
      LAYER = 'm_';
      let mid = '';
      mid += cartonStack(K, mulberry32(808), 700, 1100, 2330, 400, 2, true);
      if (night) mid += `<path d="M1040 102H1500L1760 900H780Z" fill="${U('cone')}" filter="${U('raysoft')}"/>`;
      mid += tubeLight(K, night, 1010, 70, 520, 1, true);

      // ----- front -----
      LAYER = 'f_';
      let front = desk(K, night) + invoices(K, mulberry32(77)) + printer(K, night) + paperStream(K, night) + computer(K, night);

      // ----- fore ----- (blurred by the engine: keep it simple, big shapes at the corners)
      LAYER = 'o_';
      let fore = '';
      fore += `<path d="M-40 1188h230l-24 162H-40Z" fill="${K('#BF8F5B')}"/>` + `<path d="M-40 1160h260l-30 28H-40Z" fill="${K('#D6AE7E')}"/>` + R(70, 1160, 40, 90, K('#E2C596'), 'opacity=".9"');
      fore += `<path d="M2440 1150h-200l20 200h180Z" fill="${K('#C49460')}"/>` + `<path d="M2440 1124h-226l26 26h200Z" fill="${K('#D2A774')}"/>` + R(2300, 1124, 36, 80, K('#E2C596'), 'opacity=".9"');
      LAYER = '';
      return { back: withDefs('', back), mid: withDefs('m_', mid), front: withDefs('f_', front), fore: withDefs('o_', fore) };
    }
  };
})();
