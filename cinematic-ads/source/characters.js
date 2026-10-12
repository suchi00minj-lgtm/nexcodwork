// Parametric flat-vector characters for the Nexcod POS ad films.
// Each character is drawn facing right in a 3/4 view, origin at the feet, y up = negative.
// update(state) moves joints, face and mouth every frame (deterministic in t).
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SKIN = {
    light: ['#EAC1A0', '#D7A584'], medium: ['#D2A07A', '#BC8763'], brown: ['#B57C55', '#9C6744'], dark: ['#8F5E3E', '#784C31']
  };
  const HAIR = { black: '#231C19', greying: '#3A3532', grey: '#A8A49E', white: '#E2DFD9', brown: '#3B2A20' };
  const shade = (hex, f) => { // f<1 darker, >1 lighter
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const m = v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
    return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1);
  };

  const PRESETS = {
    rakesh: { build: 'male', skin: 'brown', hair: { style: 'receding', color: 'greying', temples: true }, mustache: 'thick', top: { type: 'shirt_vest', color: '#F4F4F2', color2: '#22305A' }, bottom: { type: 'trousers', color: '#3B3F4A' }, shoes: '#3A2A20' },
    aman: { build: 'male', skin: 'medium', hair: { style: 'modern', color: 'black' }, beard: 'stubble', top: { type: 'shirt', color: '#8EC3E8' }, bottom: { type: 'trousers', color: '#2E3A52' }, shoes: '#E9E6E1' },
    papa: { build: 'male', skin: 'medium', hair: { style: 'bald_sides', color: 'grey' }, mustache: 'white', glasses: 'round', top: { type: 'kurta', color: '#EFE6D2' }, shawl: '#8A5A3A', bottom: { type: 'pajama', color: '#F1ECE2' }, shoes: '#5A3B26', old: true },
    sunita: { build: 'female', skin: 'medium', hair: { style: 'bun', color: 'black' }, bindi: true, top: { type: 'kurta_f', color: '#8E2433' }, dupatta: '#E2B04C', bottom: { type: 'churidar', color: '#EFD9B5' }, shoes: '#6B3A2A' },
    raju: { build: 'male', skin: 'dark', hair: { style: 'messy', color: 'black' }, top: { type: 'polo', color: '#1E9E62' }, bottom: { type: 'trousers', color: '#2B2F38' }, shoes: '#2E2E2E', young: true },
    pooja: { build: 'female', skin: 'light', hair: { style: 'ponytail', color: 'brown' }, top: { type: 'kurta_f', color: '#2F9C9A' }, coat: true, bottom: { type: 'churidar', color: '#F2F0EA' }, shoes: '#E9E6E1', young: true },
    aunty: { build: 'female', skin: 'medium', hair: { style: 'bun', color: 'grey' }, glasses: 'rect', bindi: true, top: { type: 'saree', color: '#6B3F8E', color2: '#E3B14C' }, bottom: { type: 'saree', color: '#6B3F8E' }, shoes: '#5A3B26', old: true, bag: '#C9A46B' },
    uncle: { build: 'male', skin: 'brown', hair: { style: 'short', color: 'greying' }, mustache: 'thin', cap: 'nehru', top: { type: 'kurta', color: '#9BB6C9' }, bottom: { type: 'pajama', color: '#EDE7DA' }, shoes: '#4A3324' },
    inspector: { build: 'male', skin: 'medium', hair: { style: 'side_part', color: 'black' }, glasses: 'rect', mustache: 'thin', top: { type: 'shirt', color: '#BFD3EA' }, bottom: { type: 'trousers', color: '#2B3242' }, shoes: '#1E1E1E', file: true },
    ca: { build: 'female', skin: 'light', hair: { style: 'open', color: 'black' }, glasses: 'rect', top: { type: 'blazer', color: '#2D3B55', color2: '#F3F1EC' }, bottom: { type: 'trousers', color: '#2D3B55' }, shoes: '#2A2A2A' },
    mr: { build: 'male', skin: 'medium', hair: { style: 'side_part', color: 'black' }, top: { type: 'shirt_tie', color: '#F2F4F7', color2: '#B3262E' }, bottom: { type: 'trousers', color: '#353A46' }, shoes: '#1E1E1E', bag: '#3A3F4A', young: true },
    doctor: { build: 'male', skin: 'brown', hair: { style: 'short', color: 'greying' }, beard: 'short', top: { type: 'coat_doc', color: '#FFFFFF', color2: '#7FA7C9' }, bottom: { type: 'trousers', color: '#3A3F4A' }, shoes: '#2A2A2A', stetho: true },
    young_mom: { build: 'female', skin: 'brown', hair: { style: 'open', color: 'black' }, bindi: true, top: { type: 'kurta_f', color: '#E07A3F' }, dupatta: '#F3D9A4', bottom: { type: 'churidar', color: '#F5E9D3' }, shoes: '#6B3A2A', young: true },
    kid: { build: 'kid', skin: 'medium', hair: { style: 'kid', color: 'black' }, top: { type: 'school', color: '#FFFFFF', color2: '#2B4C8C' }, bottom: { type: 'shorts', color: '#2B4C8C' }, shoes: '#1E1E1E' },
    anchor: { build: 'female', skin: 'light', hair: { style: 'open', color: 'brown' }, top: { type: 'blazer', color: '#B3262E', color2: '#F7F2EC' }, bottom: { type: 'trousers', color: '#2A2A2A' }, shoes: '#2A2A2A' },
  };

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const capsule = (len, w, color, edge) => `<rect x="${-w / 2}" y="${-w / 2}" width="${w}" height="${len + w}" rx="${w / 2}" fill="${color}"${edge ? ` stroke="${edge}" stroke-width="3"` : ''}/>`;

  // mouth outline for openness o (0..1) and smile s (-1..1)
  function mouthPath(o, s, w) {
    const hw = w / 2, up = -s * 6, open = o * 22;
    // corners at (±hw, up), upper lip mid at (0, -1 - o*2), lower lip mid at (0, open + 2 - s*3)
    const ul = -1 - o * 3 + s * 1.5, ll = open + 2 + Math.max(0, s) * 4 - Math.max(0, -s) * 2;
    return `M${-hw},${up} Q${-hw * 0.4},${ul - 2} 0,${ul} Q${hw * 0.4},${ul - 2} ${hw},${up} Q${hw * 0.5},${ll} 0,${ll} Q${-hw * 0.5},${ll} ${-hw},${up} Z`;
  }
  const BROWS = { // [innerDy, outerDy, tilt]
    neutral: [0, 0], happy: [-3, -2], worried: [-7, 3], angry: [6, -3], surprised: [-10, -8], sad: [-6, 4], relieved: [-2, 1], thinking: [-6, 0], confident: [1, -3]
  };
  const SMILE = { neutral: 0.05, happy: 0.85, worried: -0.35, angry: -0.5, surprised: 0, sad: -0.6, relieved: 0.5, thinking: -0.05, confident: 0.45 };

  // arm poses: [shoulderFront, elbowFront, shoulderBack, elbowBack, hand]
  const POSES = {
    idle: [10, 12, -8, 10, 'fist'], talk: [8, 58, -6, 14, 'open'], point: [88, 4, -6, 10, 'point'], wave: [150, 30, -6, 10, 'open'],
    hands_on_head: [140, 95, 200, -74, 'open'], thumbs_up: [30, 80, -6, 10, 'thumb'], hold_phone: [28, 128, -4, 14, 'phone'],
    show_phone: [72, 48, -6, 12, 'phone_show'], shrug: [38, 92, 36, 92, 'open'], arms_crossed: [10, -105, -10, 100, 'fist'],
    nod: [10, 12, -8, 10, 'fist'], shake_head: [10, 12, -8, 10, 'fist'], give: [70, 8, -6, 10, 'give'], type: [38, 64, 30, 60, 'fist'],
    facepalm: [120, 135, -8, 10, 'open'], clap: [50, 75, 46, 75, 'open'], think: [60, 165, -6, 12, 'fist'], namaste: [10, 175, -10, 138, 'namaste'],
    count_cash: [40, 80, 34, 78, 'cash']
  };

  function build(id, parent, opts) {
    const P = PRESETS[id]; if (!P) throw new Error('unknown character ' + id);
    const kid = P.build === 'kid', fem = P.build === 'female';
    const S = kid ? 0.62 : 1;
    const [skin, skinS] = SKIN[P.skin];
    const hairC = HAIR[P.hair.color];
    const root = el('g', { class: 'char', 'data-id': id }, parent);
    const flip = el('g', {}, root);
    const body = el('g', {}, flip); // scaled body
    body.setAttribute('transform', `scale(${S})`);
    // ground shadow
    el('ellipse', { cx: 6, cy: 0, rx: 120, ry: 16, fill: 'rgba(30,25,20,0.18)' }, body);
    const top = P.top, bot = P.bottom;
    const topC = top.color, topS = shade(topC, 0.86);
    const hipY = -372, shY = -612;
    // ---------- legs ----------
    const legsG = el('g', {}, body);
    const legBack = el('g', { transform: `translate(-16,${hipY})` }, legsG);
    const legFront = el('g', { transform: `translate(22,${hipY})` }, legsG);
    const legLen = 352;
    const legC = bot.type === 'saree' ? shade(bot.color, 0.8) : bot.color;
    const drawLeg = (g, front) => {
      const c = front ? legC : shade(legC, 0.85);
      if (bot.type === 'shorts') {
        g.innerHTML = `<rect x="-30" y="-6" width="60" height="120" rx="20" fill="${c}"/>` + capsule(legLen - 120, 40, front ? skin : skinS).replace('<rect ', `<rect transform="translate(0,118)" `)
          + `<path d="M-24,${legLen - 6} q2,-14 22,-14 q32,0 44,16 q4,8 -6,10 h-58 q-6,0 -2,-12z" fill="${P.shoes}"/>`;
      } else {
        const wTop = bot.type === 'pajama' || bot.type === 'churidar' ? 60 : 62, wBot = bot.type === 'churidar' ? 36 : 48;
        g.innerHTML = `<path d="M${-wTop / 2},-8 L${wTop / 2},-8 L${wBot / 2 + 2},${legLen - 18} L${-wBot / 2},${legLen - 18} Z" fill="${c}"/>`
          + `<path d="M-26,${legLen - 10} q2,-16 24,-16 q36,0 50,18 q4,9 -6,11 h-64 q-8,0 -4,-13z" fill="${P.shoes}"/>`;
      }
    };
    drawLeg(legBack, false); drawLeg(legFront, true);
    // saree / long garments cover legs
    const skirt = el('g', {}, body);
    if (top.type === 'saree') {
      skirt.innerHTML = `<path d="M-66,${hipY - 30} C-80,-200 -96,-60 -104,-14 L110,-14 C104,-60 92,-200 80,${hipY - 30} Z" fill="${top.color}"/>`
        + `<path d="M10,${hipY - 20} C14,-200 18,-80 22,-14 L60,-14 C52,-90 40,-220 34,${hipY - 20} Z" fill="${shade(top.color, 0.82)}"/>`
        + `<path d="M-104,-30 L110,-30 L110,-14 L-104,-14 Z" fill="${top.color2}"/>`;
    }
    // ---------- back arm ----------
    const armBack = el('g', { transform: `translate(-34,${shY + 8})` }, body);
    // ---------- torso ----------
    const torso = el('g', {}, body);
    const sleeveC = top.type === 'blazer' ? topC : (top.type === 'coat_doc' ? topC : topC);
    let torsoSvg = '';
    const longTop = ['kurta', 'kurta_f', 'coat_doc'].includes(top.type);
    const hemY = top.type === 'kurta' ? -190 : top.type === 'kurta_f' ? -170 : top.type === 'coat_doc' ? -230 : hipY + 18;
    const w1 = fem ? 74 : 86, w2 = fem ? 64 : 80, w3 = longTop ? (fem ? 92 : 90) : (fem ? 74 : 80);
    torsoSvg += `<path d="M${-w1},${shY + 18} Q${-w1},${shY - 6} ${-w1 + 26},${shY - 10} L${w1 - 20},${shY - 12} Q${w1 + 6},${shY - 6} ${w1 + 4},${shY + 22} L${w2 + 6},${hipY} L${w3 + 6},${hemY} L${-w3},${hemY} L${-w2},${hipY} Z" fill="${topC}"/>`;
    torsoSvg += `<path d="M${-w1},${shY + 18} Q${-w1},${shY - 6} ${-w1 + 26},${shY - 10} L${-w1 + 40},${shY - 10} L${-w2 + 16},${hipY} L${-w3 + 12},${hemY} L${-w3},${hemY} L${-w2},${hipY} Z" fill="${topS}" opacity="0.9"/>`;
    if (top.type === 'shirt' || top.type === 'shirt_vest' || top.type === 'shirt_tie' || top.type === 'school') {
      torsoSvg += `<path d="M-6,${shY - 12} L22,${shY + 26} L46,${shY - 12} Z" fill="${shade(topC, 0.8)}"/>`; // collar shadow
      torsoSvg += `<path d="M-8,${shY - 14} L20,${shY + 18} L4,${shY + 30} Z M48,${shY - 14} L22,${shY + 18} L40,${shY + 30} Z" fill="${shade(topC, 1.08)}"/>`;
      for (let i = 0; i < 5; i++) torsoSvg += `<circle cx="${24 - i * 0.6}" cy="${shY + 50 + i * 46}" r="3.4" fill="${shade(topC, 0.7)}"/>`;
      torsoSvg += `<path d="M${-w2 + 4},${hipY - 6} L${w2 + 4},${hipY - 6} L${w2 + 6},${hipY + 14} L${-w2},${hipY + 14} Z" fill="#2B2420" opacity="0.85"/>`; // belt
    }
    if (top.type === 'shirt_vest') {
      const v = top.color2, vs = shade(v, 0.8);
      torsoSvg += `<path d="M${-w1 + 8},${shY + 6} L4,${shY + 8} L22,${shY + 120} L42,${shY + 8} L${w1 - 6},${shY + 4} L${w2 + 4},${hipY + 6} L${-w2},${hipY + 6} Z" fill="${v}"/>`;
      torsoSvg += `<path d="M${-w1 + 8},${shY + 6} L4,${shY + 8} L${-w2 + 30},${hipY + 6} L${-w2},${hipY + 6} Z" fill="${vs}"/>`;
      for (let i = 0; i < 3; i++) torsoSvg += `<circle cx="${30}" cy="${shY + 150 + i * 40}" r="4" fill="${shade(v, 1.25)}"/>`;
    }
    if (top.type === 'shirt_tie') {
      torsoSvg += `<path d="M18,${shY + 14} L28,${shY + 14} L32,${shY + 30} L36,${shY + 190} L23,${shY + 214} L12,${shY + 190} L16,${shY + 30} Z" fill="${top.color2}"/>`;
    }
    if (top.type === 'polo') {
      torsoSvg += `<path d="M2,${shY - 12} L24,${shY + 10} L44,${shY - 12} L36,${shY - 16} L24,${shY - 2} L10,${shY - 16} Z" fill="${shade(topC, 0.8)}"/><rect x="21" y="${shY - 4}" width="6" height="60" fill="${shade(topC, 0.82)}"/>`;
      torsoSvg += `<g transform="translate(46,${shY + 70})"><circle r="15" fill="#fff" opacity="0.95"/><path d="M-3,-9h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="${topC}"/></g>`;
    }
    if (top.type === 'kurta' || top.type === 'kurta_f') {
      torsoSvg += `<path d="M14,${shY - 10} L18,${shY + 110}" stroke="${shade(topC, 0.75)}" stroke-width="4"/>`;
      for (let i = 0; i < 3; i++) torsoSvg += `<circle cx="22" cy="${shY + 20 + i * 30}" r="3.2" fill="${shade(topC, 0.65)}"/>`;
      torsoSvg += `<path d="M${w3 + 2},${hemY} L${w2 + 10},${hipY + 40}" stroke="${shade(topC, 0.72)}" stroke-width="3"/>`;
      if (top.type === 'kurta_f') {
        torsoSvg += `<path d="M-30,${shY - 8} Q22,${shY + 34} 64,${shY - 8}" fill="none" stroke="${shade(topC, 0.6)}" stroke-width="5"/>`;
        torsoSvg += `<path d="M${-w3 + 8},${hemY - 18} L${w3 + 2},${hemY - 18}" stroke="${shade(topC, 1.35)}" stroke-width="8" opacity="0.8"/>`;
      }
    }
    if (top.type === 'blazer') {
      const sh = top.color2;
      torsoSvg += `<path d="M2,${shY - 10} L22,${shY + 120} L44,${shY - 10} Z" fill="${sh}"/>`;
      torsoSvg += `<path d="M2,${shY - 10} L-14,${shY + 40} L18,${shY + 110} Z M44,${shY - 10} L64,${shY + 40} L28,${shY + 110} Z" fill="${shade(topC, 0.8)}"/>`;
      torsoSvg += `<circle cx="24" cy="${shY + 170}" r="5" fill="${shade(topC, 1.4)}"/>`;
    }
    if (top.type === 'coat_doc') {
      torsoSvg += `<path d="M-2,${shY - 10} L20,${shY + 130} L46,${shY - 10} Z" fill="${top.color2}"/>`;
      torsoSvg += `<path d="M20,${shY + 130} L22,${hemY}" stroke="${shade(topC, 0.82)}" stroke-width="3"/>`;
      torsoSvg += `<path d="M-4,${shY - 10} L-20,${shY + 60} L18,${shY + 130} Z M48,${shY - 10} L66,${shY + 60} L24,${shY + 130} Z" fill="${shade(topC, 0.9)}"/>`;
      torsoSvg += `<rect x="38" y="${shY + 150}" width="34" height="40" rx="4" fill="${shade(topC, 0.88)}"/>`;
    }
    if (top.type === 'school') {
      torsoSvg += `<path d="M18,${shY + 14} L28,${shY + 14} L31,${shY + 26} L33,${shY + 120} L23,${shY + 134} L14,${shY + 120} L16,${shY + 26} Z" fill="${top.color2}"/>`;
    }
    if (P.coat) { // white coat over kurta (pharmacist)
      torsoSvg += `<path d="M${-w1 - 4},${shY + 16} Q${-w1 - 2},${shY - 8} ${-w1 + 24},${shY - 12} L4,${shY - 12} L20,${shY + 140} L18,${hemY - 4} L${-w3 - 6},${hemY - 4} L${-w2 - 6},${hipY} Z" fill="#FBFBFA"/>`;
      torsoSvg += `<path d="M${-w1 - 4},${shY + 16} L${-w1 + 30},${shY - 12} L${-w2 + 22},${hipY} L${-w3 + 10},${hemY - 4} L${-w3 - 6},${hemY - 4} L${-w2 - 6},${hipY} Z" fill="#E6E8EB"/>`;
    }
    if (top.type === 'saree') {
      torsoSvg = `<path d="M${-w1},${shY + 18} Q${-w1},${shY - 6} ${-w1 + 26},${shY - 10} L${w1 - 20},${shY - 12} Q${w1 + 6},${shY - 6} ${w1 + 4},${shY + 22} L${w2 + 6},${hipY - 20} L${-w2},${hipY - 20} Z" fill="${top.color2}"/>`
        + `<path d="M${-w1 + 4},${shY - 8} L${-w1 + 60},${shY - 12} L${w2 + 8},${hipY - 10} L${w2 - 30},${hipY + 10} L${-w2 - 6},${hipY - 30} Z" fill="${topC}"/>`
        + `<path d="M${-w1 + 4},${shY - 8} L${-w1 + 30},${shY - 10} L${w2 - 40},${hipY} L${-w2 - 6},${hipY - 30} Z" fill="${shade(topC, 0.8)}"/>`
        + `<path d="M${-w1 + 60},${shY - 12} L${w2 + 8},${hipY - 10}" stroke="${top.color2}" stroke-width="7"/>`;
    }
    torso.innerHTML = torsoSvg;
    if (P.dupatta) {
      el('g', {}, torso).innerHTML = `<path d="M-60,${shY - 6} Q20,${shY + 60} 70,${shY - 4} L74,${shY + 10} Q20,${shY + 82} -64,${shY + 10} Z" fill="${P.dupatta}"/>`
        + `<path d="M-70,${shY + 4} L-84,${shY + 260} L-56,${shY + 262} L-48,${shY + 14} Z" fill="${shade(P.dupatta, 0.85)}"/>`;
    }
    if (P.shawl) {
      el('g', {}, torso).innerHTML = `<path d="M${-w1 - 6},${shY + 20} Q${-w1},${shY - 14} ${-w1 + 30},${shY - 14} L10,${shY - 12} L-10,${shY + 200} L${-w1 - 10},${shY + 230} Z" fill="${P.shawl}"/>`
        + `<path d="M${-w1 - 6},${shY + 20} L${-w1 + 20},${shY - 12} L${-w1 + 34},${shY + 220} L${-w1 - 10},${shY + 230} Z" fill="${shade(P.shawl, 0.8)}"/>`;
    }
    if (P.stetho) {
      el('g', {}, torso).innerHTML = `<path d="M-10,${shY - 4} Q-26,${shY + 90} 10,${shY + 120} Q44,${shY + 90} 50,${shY - 6}" fill="none" stroke="#3B3F4A" stroke-width="6"/><circle cx="10" cy="${shY + 126}" r="12" fill="#AEB6C2" stroke="#3B3F4A" stroke-width="4"/>`;
    }
    // ---------- neck & head ----------
    const headPivot = el('g', { transform: `translate(6,${shY - 12})` }, body);
    el('rect', { x: -18, y: -42, width: 40, height: 56, rx: 12, fill: skinS }, headPivot);
    const head = el('g', { transform: 'translate(0,-92)' }, headPivot);
    const hs = kid ? 1.18 : 1.1;
    head.setAttribute('transform', `translate(0,-92) scale(${hs})`);
    const hairBack = el('g', {}, head);
    const hb = P.hair.style;
    if (hb === 'bun') hairBack.innerHTML = `<circle cx="-56" cy="-30" r="34" fill="${hairC}"/><circle cx="-60" cy="-34" r="20" fill="${shade(hairC, 1.15)}" opacity="0.4"/>`;
    if (hb === 'ponytail') hairBack.innerHTML = `<path d="M-50,-40 C-110,-30 -112,60 -86,120 C-74,80 -66,20 -40,-6 Z" fill="${hairC}"/>`;
    if (hb === 'open') hairBack.innerHTML = `<path d="M-66,-50 C-90,30 -84,110 -60,128 L40,128 C30,100 20,60 30,-30 Z" fill="${hairC}"/>`;
    // ear
    el('ellipse', { cx: -42, cy: 4, rx: 13, ry: 19, fill: skinS }, head);
    el('ellipse', { cx: -40, cy: 5, rx: 6, ry: 10, fill: shade(skinS, 0.85) }, head);
    // face
    el('path', { d: 'M-58,-22 C-60,-74 -26,-86 4,-86 C42,-86 66,-62 66,-18 C66,22 56,52 30,70 C16,79 -6,80 -22,70 C-46,56 -58,30 -58,-22 Z', fill: skin }, head);
    el('path', { d: 'M-58,-22 C-60,-74 -26,-86 4,-86 C-20,-80 -40,-60 -44,-20 C-46,20 -36,54 -8,76 C-14,77 -18,74 -22,70 C-46,56 -58,30 -58,-22 Z', fill: skinS, opacity: 0.55 }, head);
    const blush = el('g', { opacity: 0 }, head);
    blush.innerHTML = `<ellipse cx="6" cy="30" rx="13" ry="7" fill="#E07A6A" opacity="0.35"/><ellipse cx="58" cy="28" rx="8" ry="6" fill="#E07A6A" opacity="0.3"/>`;
    // eyes
    const eyes = [];
    [[8, -8, 10.5], [48, -7, 8.5]].forEach(([x, y, rx]) => {
      const g = el('g', { transform: `translate(${x},${y})` }, head);
      el('ellipse', { cx: 0, cy: 0, rx, ry: 7.5, fill: '#FFFFFF' }, g);
      const pupil = el('g', {}, g);
      el('circle', { cx: 2, cy: 0.5, r: 5.6, fill: '#3A2418' }, pupil);
      el('circle', { cx: 3.6, cy: -1.6, r: 1.8, fill: '#FFFFFF' }, pupil);
      const lid = el('rect', { x: -rx - 1, y: -10, width: rx * 2 + 2, height: 0, fill: skin }, g);
      el('path', { d: `M${-rx},-1 Q0,-10 ${rx},-1`, fill: 'none', stroke: shade(skin, 0.55), 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      eyes.push({ g, pupil, lid, rx });
    });
    // brows
    const brows = [[8, -26, 13], [48, -25, 10]].map(([x, y, w]) => {
      const p = el('path', { fill: 'none', stroke: P.hair.color === 'white' || P.hair.color === 'grey' ? shade(hairC, 0.8) : hairC, 'stroke-width': 5.5, 'stroke-linecap': 'round' }, head);
      return { p, x, y, w };
    });
    // nose
    el('path', { d: 'M40,-2 C44,12 50,22 46,28 C42,32 34,31 31,28', fill: 'none', stroke: shade(skin, 0.68), 'stroke-width': 3.2, 'stroke-linecap': 'round' }, head);
    el('ellipse', { cx: 40, cy: 30, rx: 8, ry: 3.5, fill: shade(skin, 0.82) }, head);
    // mouth
    const mouthG = el('g', { transform: 'translate(30,47)' }, head);
    const mouthInner = el('path', { fill: '#5A1E1E' }, mouthG);
    const teeth = el('rect', { x: -9, y: -3, width: 18, height: 5, rx: 2, fill: '#FAF6F0', opacity: 0 }, mouthG);
    const lipLine = el('path', { fill: 'none', stroke: shade(skin, 0.5), 'stroke-width': 2.6, 'stroke-linecap': 'round' }, mouthG);
    // facial hair
    if (P.mustache) {
      const mc = P.mustache === 'white' ? '#EEEAE3' : hairC, th = P.mustache === 'thick' ? 1 : P.mustache === 'thin' ? 0.55 : 0.9;
      el('path', { d: `M12,${40 - 8 * th} C22,${34 - 6 * th} 34,${34 - 6 * th} 40,${38 - 4 * th} C46,${34 - 6 * th} 54,${35 - 5 * th} 58,${41 - 6 * th} C54,${44} 46,${42} 40,${41} C32,${44} 20,${45} 12,${40 - 8 * th} Z`, fill: mc }, head);
    }
    if (P.beard === 'stubble') el('path', { d: 'M-40,30 C-30,62 0,80 28,74 C52,64 62,42 64,20 C58,40 48,56 30,62 C10,70 -20,58 -40,30 Z', fill: hairC, opacity: 0.22 }, head);
    if (P.beard === 'short') el('path', { d: 'M-44,20 C-36,64 -4,86 28,80 C54,70 66,44 66,16 C60,40 50,52 40,56 C30,62 20,62 10,58 C-10,56 -30,44 -44,20 Z', fill: hairC }, head);
    // front hair
    const hairFront = el('g', {}, head);
    const hf = {
      receding: `<path d="M-60,-20 C-66,-70 -30,-96 4,-94 C30,-94 52,-86 62,-60 C48,-70 30,-74 12,-70 C-6,-66 -20,-60 -30,-46 C-40,-36 -46,-24 -46,-6 Z" fill="${hairC}"/>` + (P.hair.temples ? `<path d="M-58,-30 C-60,-50 -52,-60 -44,-62 C-48,-46 -48,-30 -46,-10 Z" fill="#9C978F"/>` : ''),
      modern: `<path d="M-62,-18 C-70,-80 -30,-104 10,-100 C46,-98 70,-80 70,-48 C60,-56 46,-60 30,-58 C18,-74 -2,-76 -16,-70 C-34,-62 -44,-46 -46,-10 Z" fill="${hairC}"/><path d="M-20,-96 C10,-108 50,-96 66,-70 C46,-82 20,-88 -20,-82 Z" fill="${shade(hairC, 1.25)}"/>`,
      bald_sides: `<path d="M-60,-6 C-62,-40 -56,-56 -46,-62 C-48,-40 -46,-20 -44,4 Z" fill="${hairC}"/><path d="M-50,-50 C-30,-80 10,-90 40,-80" fill="none" stroke="${hairC}" stroke-width="3" opacity="0.5"/>`,
      messy: `<path d="M-62,-14 C-74,-60 -50,-100 -6,-100 C34,-104 70,-84 68,-46 L56,-56 L52,-44 L40,-62 L30,-50 L18,-66 L4,-52 L-10,-66 L-20,-50 L-36,-58 L-44,-30 L-48,-4 Z" fill="${hairC}"/>`,
      short: `<path d="M-62,-14 C-68,-70 -30,-98 6,-96 C42,-96 66,-78 66,-50 C52,-62 34,-66 16,-64 C-8,-62 -30,-54 -44,-30 L-48,-4 Z" fill="${hairC}"/>`,
      side_part: `<path d="M-62,-14 C-70,-74 -28,-100 10,-98 C48,-96 70,-74 68,-44 C54,-62 30,-72 6,-70 L-2,-78 C-20,-70 -36,-56 -44,-30 L-48,-4 Z" fill="${hairC}"/><path d="M-2,-78 C20,-90 50,-86 66,-60" fill="none" stroke="${shade(hairC, 1.3)}" stroke-width="3"/>`,
      bun: `<path d="M-60,-10 C-68,-72 -26,-98 10,-96 C46,-94 68,-72 64,-36 C52,-60 26,-72 2,-70 C-22,-66 -40,-50 -46,-20 Z" fill="${hairC}"/><path d="M2,-70 C10,-86 30,-90 46,-84" fill="none" stroke="${shade(hairC, 1.25)}" stroke-width="3"/>`,
      ponytail: `<path d="M-60,-10 C-68,-74 -26,-100 12,-98 C48,-96 70,-74 66,-36 C52,-60 30,-70 6,-68 C-20,-64 -40,-48 -46,-20 Z" fill="${hairC}"/>`,
      open: `<path d="M-62,-6 C-72,-76 -26,-102 12,-100 C50,-98 74,-74 70,-30 C60,-56 40,-70 16,-68 C2,-60 -8,-52 -16,-38 C-30,-40 -42,-28 -48,8 Z" fill="${hairC}"/><path d="M-50,-60 C-20,-92 30,-96 58,-70" fill="none" stroke="${shade(hairC, 1.25)}" stroke-width="3"/>`,
      kid: `<path d="M-62,-14 C-70,-74 -30,-100 8,-98 C46,-98 70,-78 68,-44 C58,-54 44,-58 30,-56 L22,-66 L12,-56 C-10,-60 -32,-52 -44,-30 L-48,-4 Z" fill="${hairC}"/>`
    }[hb] || '';
    hairFront.innerHTML = hf;
    if (P.bindi) el('circle', { cx: 30, cy: -22, r: 4, fill: '#C8161E' }, head);
    if (P.glasses) {
      const g = el('g', { fill: 'none', stroke: '#3A3530', 'stroke-width': 3 }, head);
      if (P.glasses === 'round') g.innerHTML = `<circle cx="8" cy="-8" r="15"/><circle cx="48" cy="-7" r="12"/><path d="M23,-9 Q30,-14 36,-8 M-7,-10 L-40,-4"/>`;
      else g.innerHTML = `<rect x="-8" y="-20" width="31" height="23" rx="6"/><rect x="36" y="-19" width="24" height="22" rx="6"/><path d="M23,-10 Q30,-14 36,-9 M-8,-10 L-40,-4"/>`;
    }
    if (P.cap === 'nehru') el('path', { d: 'M-60,-46 C-58,-90 60,-96 68,-56 L66,-36 C30,-50 -20,-54 -60,-36 Z', fill: '#F7F5EF' }, head);
    // ---------- front arm ----------
    const armFront = el('g', { transform: `translate(42,${shY + 6})` }, body);
    const longSleeve = !['polo', 'shorts'].includes(top.type) && top.type !== 'school' || top.type === 'coat_doc';
    const sleeveCol = P.coat ? '#FBFBFA' : (top.type === 'saree' ? top.color2 : sleeveC);
    const mkArm = (g, front) => {
      const upper = el('g', {}, g), lower = el('g', {}, upper), hand = el('g', {}, lower);
      const sc = front ? sleeveCol : shade(sleeveCol, 0.85);
      upper.innerHTML = capsule(140, 42, sc, shade(sc, 0.78));
      lower.setAttribute('transform', 'translate(0,140)');
      const foreC = (longSleeve && top.type !== 'saree') ? sc : (front ? skin : skinS);
      lower.innerHTML = capsule(124, 36, foreC, shade(foreC, 0.8));
      hand.setAttribute('transform', 'translate(0,130)');
      upper.appendChild(lower); lower.appendChild(hand);
      return { upper, lower, hand, skinC: front ? skin : skinS };
    };
    const AB = mkArm(armBack, false), AF = mkArm(armFront, true);
    // props on front hand
    const handShape = (kind, c) => {
      switch (kind) {
        case 'point': return `<circle r="20" fill="${c}"/><rect x="-6" y="6" width="12" height="38" rx="6" fill="${c}"/>`;
        case 'thumb': return `<circle r="21" fill="${c}"/><rect x="10" y="-40" width="12" height="34" rx="6" fill="${c}" transform="rotate(-10)"/>`;
        case 'open': return `<ellipse rx="19" ry="25" cy="8" fill="${c}"/><rect x="-16" y="16" width="8" height="22" rx="4" fill="${c}"/><rect x="-6" y="20" width="8" height="24" rx="4" fill="${c}"/><rect x="4" y="18" width="8" height="22" rx="4" fill="${c}"/>`;
        case 'phone': return `<circle r="20" fill="${c}"/><g transform="translate(-4,8) rotate(-30)"><rect x="-16" y="-30" width="34" height="60" rx="6" fill="#1F2430"/><rect x="-13" y="-25" width="28" height="48" rx="3" fill="#5AA0D8"/></g>`;
        case 'phone_show': return `<circle r="20" fill="${c}"/><g transform="translate(12,-18)"><rect x="-22" y="-40" width="46" height="80" rx="8" fill="#1F2430"/><rect x="-18" y="-34" width="38" height="66" rx="4" fill="#EAF3FB"/><rect x="-14" y="-28" width="30" height="6" rx="2" fill="#C8161E"/><rect x="-14" y="-16" width="24" height="4" rx="2" fill="#AEB6C2"/><rect x="-14" y="-8" width="28" height="4" rx="2" fill="#AEB6C2"/><rect x="-14" y="16" width="30" height="10" rx="3" fill="#1E9E62"/></g>`;
        case 'give': return `<circle r="20" fill="${c}"/><g transform="translate(6,22)"><rect x="-26" y="-12" width="56" height="26" rx="4" fill="#E7B04A"/><rect x="-26" y="-12" width="56" height="8" rx="3" fill="#F3D9A4"/></g>`;
        case 'cash': return `<circle r="20" fill="${c}"/><g transform="translate(8,10) rotate(-15)"><rect x="-24" y="-14" width="52" height="28" rx="3" fill="#8DBF8B"/><rect x="-20" y="-10" width="44" height="20" rx="2" fill="none" stroke="#5E9A5C" stroke-width="2"/></g>`;
        case 'namaste': return `<ellipse rx="16" ry="28" cy="-6" fill="${c}"/>`;
        default: return `<circle r="21" fill="${c}"/>`;
      }
    };
    // file prop for inspector held by back arm
    if (P.file) AB.hand.innerHTML = `<circle r="20" fill="${skinS}"/><g transform="translate(-8,10)"><rect x="-40" y="-8" width="80" height="104" rx="5" fill="#E7B04A"/><rect x="-36" y="-4" width="72" height="12" fill="#C9963A"/></g>`;
    else AB.hand.innerHTML = handShape('fist', skinS);
    if (P.bag) { const bg = el('g', {}, AB.hand); bg.innerHTML = `<path d="M-10,8 L-14,40" stroke="${shade(P.bag, 0.7)}" stroke-width="5"/><rect x="-48" y="36" width="76" height="70" rx="10" fill="${P.bag}"/>`; }

    const state = { handKind: null };
    const api = {
      id, root, kid, scale: S,
      headWorldOffset: [6 * S, (shY - 104) * S], chestOffset: [0, (shY + 80) * S],
      update(st) {
        // st: {x,y,face,t,amp,emotion,pose,poseFrom,poseMix,walk,nod,shake,blink,look}
        root.setAttribute('transform', `translate(${st.x},${st.y})`);
        flip.setAttribute('transform', `scale(${st.face < 0 ? -1 : 1},1)`);
        const breath = Math.sin(st.t * 2.1 + (id.length * 0.7)) * 0.006;
        const bob = st.walk ? Math.abs(Math.sin(st.walkPhase)) * -10 : 0;
        body.setAttribute('transform', `translate(0,${bob}) scale(${S},${S * (1 + breath)})`);
        // legs
        const swing = st.walk ? Math.sin(st.walkPhase) * 24 : 0;
        legFront.setAttribute('transform', `translate(22,${hipY}) rotate(${-swing})`);
        legBack.setAttribute('transform', `translate(-16,${hipY}) rotate(${swing})`);
        // arms: blend poses
        const A = POSES[st.pose] || POSES.idle, B = POSES[st.poseFrom] || POSES.idle, m = st.poseMix;
        const mix = i => B[i] + (A[i] - B[i]) * m;
        let sf = mix(0), ef = mix(1), sb = mix(2), eb = mix(3);
        const tt = st.t;
        if (st.pose === 'wave' && m > 0.9) ef += Math.sin(tt * 9) * 24;
        if (st.pose === 'type' && m > 0.9) { ef += Math.sin(tt * 17) * 6; eb += Math.cos(tt * 15) * 6; }
        if (st.pose === 'clap' && m > 0.9) { const c = (Math.sin(tt * 10) + 1) / 2; sf -= c * 10; sb += c * 10; }
        if (st.pose === 'count_cash' && m > 0.9) ef += Math.sin(tt * 12) * 8;
        if (st.pose === 'talk') { sf += Math.sin(tt * 3.1) * 6 * st.amp; ef += Math.sin(tt * 4.3) * 10 * st.amp; }
        if (st.walk) { sf = 10 - swing * 0.9; sb = -8 + swing * 0.9; ef = 14; eb = 12; }
        AF.upper.setAttribute('transform', `rotate(${-sf})`); AF.lower.setAttribute('transform', `translate(0,140) rotate(${-ef})`);
        AB.upper.setAttribute('transform', `rotate(${-sb})`); AB.lower.setAttribute('transform', `translate(0,140) rotate(${-eb})`);
        const hk = m > 0.5 ? A[4] : B[4];
        if (hk !== state.handKind) { AF.hand.innerHTML = handShape(hk, AF.skinC); state.handKind = hk; }
        // head
        let hr = Math.sin(tt * 1.3 + id.length) * 1.2 + st.amp * Math.sin(tt * 7) * 2.2;
        let hy = 0;
        if (st.pose === 'nod') hy = Math.sin(tt * 8) * 6 * m;
        if (st.pose === 'shake_head') hr += Math.sin(tt * 9) * 7 * m;
        if (st.pose === 'hold_phone') hr += 8 * m;
        if (st.emotion === 'sad') hr += 5;
        headPivot.setAttribute('transform', `translate(6,${shY - 12 + hy}) rotate(${hr})`);
        // face
        const bw = BROWS[st.emotion] || BROWS.neutral;
        const lift = st.amp * -2.5;
        brows.forEach((b, i) => {
          const inner = i === 0 ? b.w : -b.w; // near brow inner end is towards the face centre (+x)
          const yi = b.y + bw[0] + lift, yo = b.y + bw[1] + lift;
          const x0 = b.x - b.w, x1 = b.x + b.w;
          const yL = i === 0 ? yo : yi, yR = i === 0 ? yi : yo;
          b.p.setAttribute('d', `M${x0},${yL} Q${b.x},${Math.min(yL, yR) - 5} ${x1},${yR}`);
        });
        const wide = st.emotion === 'surprised' ? 1.25 : 1;
        const halfLid = (st.emotion === 'relieved' || st.emotion === 'sad' || st.emotion === 'thinking') ? 0.35 : 0;
        eyes.forEach(e => {
          const lidH = Math.max(halfLid, st.blink) * 18;
          e.lid.setAttribute('height', lidH);
          e.g.setAttribute('transform', e.g.getAttribute('transform').replace(/ scale\([^)]*\)/, '') + ` scale(1,${wide})`);
          e.pupil.setAttribute('transform', `translate(${st.look[0]},${st.look[1]})`);
        });
        const smile = SMILE[st.emotion] ?? 0;
        let o = Math.min(1, st.amp * 1.15);
        if (st.emotion === 'surprised' && o < 0.25) o = 0.3;
        const d = mouthPath(o, smile, 26);
        mouthInner.setAttribute('d', d);
        mouthInner.setAttribute('fill', o > 0.08 ? '#5A1E1E' : shade(skin, 0.55));
        teeth.setAttribute('opacity', o > 0.35 ? 0.9 : (smile > 0.6 && o > 0.05 ? 0.8 : 0));
        lipLine.setAttribute('d', o > 0.08 ? '' : `M-13,${-smile * 6} Q0,${2 + smile * 5} 13,${-smile * 6}`);
        blush.setAttribute('opacity', smile > 0.6 ? 1 : 0);
      }
    };
    return api;
  }
  window.CHAR = { build, PRESETS, POSES };
})();
