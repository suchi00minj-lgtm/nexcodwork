// Cinematic ad engine: builds one shot at a time and renders any time t inside it.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const WW = 2400, WH = 1350, FPS = 30;
  const $ = s => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const noise = (t, s) => (Math.sin(t * 1.7 + s) + Math.sin(t * 2.9 + s * 2.1) * 0.6 + Math.sin(t * 4.3 + s * 3.7) * 0.3) / 1.9;
  const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- screen catalogue (1366x768 screenshots) ----------
  const REG = {
    dash_qa: [205, 50, 700, 230], dash_alert: [205, 385, 660, 95], dash_cards: [205, 470, 700, 200],
    bill_lines: [205, 230, 700, 200], bill_lines_r: [690, 230, 670, 200], bill_total: [205, 690, 620, 78], bill_print: [880, 690, 486, 78],
    search_list: [60, 110, 720, 160], search_list_r: [620, 110, 680, 160], rate_full: [240, 85, 885, 590], rate_quote: [240, 380, 620, 210],
    pay: [350, 52, 660, 312], keys: [240, 190, 600, 390], keys_r: [640, 190, 500, 390], inv_tabs: [560, 55, 800, 120], inv_table: [200, 250, 1160, 250],
    near: [200, 160, 700, 200], near_r: [690, 160, 670, 200], pe_import: [500, 40, 866, 220], pe_scheme: [200, 185, 600, 110],
    po_sugg: [205, 150, 700, 300], po_sugg_r: [700, 150, 660, 300], lowstock: [250, 180, 620, 400], sched: [200, 80, 800, 300],
    registers: [200, 50, 700, 240], gst_grid: [200, 130, 700, 260], gst_grid_r: [690, 130, 670, 260], gst_check: [200, 220, 700, 250],
    gst_check_r: [660, 220, 700, 250], sales_rep: [200, 120, 700, 230], zrep: [200, 360, 700, 230], pl: [200, 230, 700, 260],
    daybook: [600, 60, 766, 250], inv_list: [200, 130, 650, 90], inv_list_r: [716, 130, 650, 90], cust: [200, 80, 700, 200], cust_r: [600, 80, 700, 200],
    cust_add: [1100, 420, 266, 340], outst: [200, 50, 700, 400], roles: [200, 330, 700, 430], rules_top: [460, 90, 700, 230], fmb: [330, 120, 710, 560], wa: [470, 110, 700, 190]
  };
  const TGT = {
    dashboard: { new_bill: [304, 80], expiry_tile: [288, 430], lowstock_tile: [617, 430], outofstock_tile: [780, 430], dues_tile: [1110, 430] },
    'billing-search': { search_box: [300, 148], salt: [360, 226], batch_col: [730, 226], stock_col: [940, 226] },
    'billing-items': { batch: [615, 286], qty_pack: [893, 281], qty_loose: [956, 281], above_mrp: [1060, 348], total: [720, 740], print_btn: [1210, 732] },
    'rate-desk': { flat_rate: [940, 214], you_make: [1074, 458], break_even: [1098, 486] },
    payment: { cash: [426, 152], upi: [528, 152], credit: [938, 152], amount: [480, 258] },
    keys: { f2: [330, 328], f9: [290, 492], f1: [640, 428] },
    inventory: { search: [430, 104], tabs: [848, 104], import: [1057, 149], add_product: [1281, 149], stock: [1168, 451] },
    'near-expiry': { batch: [400, 288], days_left: [600, 288], value_at_risk: [880, 288] },
    'purchase-entry': { import: [1010, 74], rate_on_bill: [250, 240], scheme: [550, 240], free_qty: [780, 418], bill_total: [1060, 512] },
    'po-new': { suggest: [314, 170], why: [854, 238], order_qty: [1244, 238] },
    'schedule-check': { untagged: [570, 194], apply: [300, 388] },
    'reports-gst': { gstr1: [320, 194], before_file: [640, 258], gstr3b: [920, 268] },
    'gst-filecheck': { fix_this: [530, 288], what_to_do: [1120, 288] },
    'reports-sales': { pick_report: [304, 188], z_cash: [854, 448], z_credit: [274, 518] },
    'books-pl': { net_profit: [264, 384] }, daybook: { tally_export: [1176, 148] },
    invoices: { invoice_list: [324, 298], whatsapp_btn: [1160, 298], sent: [1264, 328] },
    customers: { due_amount: [700, 170], collect: [940, 170] }, 'customer-add': { credit_limit: [1164, 688] },
    outstanding: { since_when: [354, 200], supplier_dues: [564, 364] }, 'staff-roles': { make_bill: [280, 400], hide_cost: [380, 728] },
    rules: { block_expired: [510, 120] }, 'find-my-bills': { email_code: [678, 598] }, whatsapp: { own_number: [530, 168] }
  };
  const URL = { dashboard: 'dashboard', 'billing-search': 'billing', 'billing-items': 'billing', 'rate-desk': 'billing', payment: 'billing', keys: 'billing', inventory: 'inventory', 'near-expiry': 'reports', 'purchase-entry': 'purchase', 'po-new': 'purchase-orders', 'low-stock': 'low-stock', 'schedule-check': 'schedule-check', 'reports-registers': 'reports', 'reports-gst': 'reports', 'gst-filecheck': 'reports', 'reports-sales': 'reports', 'books-pl': 'accounts', daybook: 'accounts', invoices: 'invoices', customers: 'customers', 'customer-add': 'customers', outstanding: 'accounts', 'staff-roles': 'staff-management', rules: 'settings', 'find-my-bills': 'find-my-bills', whatsapp: 'settings' };

  let W, H, V, S = {}; // stage size, vertical flag, current shot state

  // ---------- film grain ----------
  function makeGrain() {
    const c = $('#grain'); c.width = 512; c.height = 512; const g = c.getContext('2d'); const im = g.createImageData(512, 512);
    let s = 1234567; for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = s % 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); c.style.width = W + 'px'; c.style.height = H + 'px';
  }

  window.ENGINE = {
    init(aspect) {
      V = aspect === '9x16'; W = V ? 1080 : 1920; H = V ? 1920 : 1080;
      const st = $('#stage'); st.style.width = W + 'px'; st.style.height = H + 'px';
      makeGrain();
      const lb = V ? 0 : Math.round(H * 0.105);
      $('#lbt').style.cssText = `top:0;height:${lb}px`; $('#lbb').style.cssText = `bottom:0;height:${lb}px`;
      S.lbH = lb;
      const subs = $('#subs');
      subs.style.bottom = (V ? 640 : lb + 26) + 'px'; subs.querySelector('span').style.fontSize = (V ? 44 : 38) + 'px';
      const bug = $('#bug'); bug.querySelector('img').style.width = bug.querySelector('img').style.height = (V ? 54 : 40) + 'px';
      bug.style.fontSize = (V ? 28 : 22) + 'px';
      if (V) { bug.style.right = '44px'; bug.style.top = '290px'; } else { bug.style.right = '40px'; bug.style.top = (lb - 52) / 2 + 'px'; }
      const disc = $('#disc'); disc.style.fontSize = (V ? 20 : 16) + 'px';
      if (V) { disc.style.left = '44px'; disc.style.top = '306px'; disc.style.bottom = 'auto'; } else { disc.style.left = '40px'; disc.style.bottom = (lb - 22) / 2 + 'px'; }
      const ttl = $('#ttl'); ttl.style.fontSize = (V ? 40 : 34) + 'px';
      if (V) { ttl.style.left = '60px'; ttl.style.top = '380px'; } else { ttl.style.left = '80px'; ttl.style.top = (lb + 46) + 'px'; }
      return { W, H };
    },

    async build(shot, meta) {
      S = Object.assign({ lbH: S.lbH }, { shot, meta, t: 0 });
      const scene = $('#scene'), ui = $('#ui');
      scene.innerHTML = ''; ui.innerHTML = '';
      $('#scene').style.filter = '';
      const isScene = shot.type === 'scene' || (shot.type === 'card' && shot.card === 'news');
      S.isScene = isScene;
      const isNews = shot.type === 'card' && shot.card === 'news';
      $('#subs').style.bottom = (V ? 640 : S.lbH + (isNews ? 70 : 26)) + 'px';
      $('#lb').style.display = (!V && isScene) ? '' : 'none';
      $('#bug').style.display = isScene ? '' : 'none';
      $('#disc').style.display = (isScene && meta.dramatization) ? '' : 'none';
      $('#vig').style.opacity = isScene ? 1 : 0.35;
      $('#grain').style.display = isScene ? '' : 'none';
      $('#ttl').innerHTML = shot.title ? `<b></b>${esc(shot.title)}` : '';
      $('#ttl').style.opacity = 0;
      // grade
      const night = shot.time === 'night';
      const g = shot.grade || (night ? 'night' : 'warm');
      const gr = $('#grade');
      gr.style.mixBlendMode = 'normal'; gr.style.background = 'none'; gr.style.opacity = 1;
      if (isScene) {
        if (g === 'night') { gr.style.background = shot.rain ? 'linear-gradient(rgba(18,30,64,.30),rgba(10,16,40,.38))' : 'linear-gradient(rgba(20,28,70,.24),rgba(14,18,48,.32))'; gr.style.mixBlendMode = 'multiply'; }
        else if (g === 'warm') { gr.style.background = 'linear-gradient(rgba(255,196,128,.10),rgba(255,170,90,.06))'; gr.style.mixBlendMode = 'soft-light'; }
        else if (g === 'cool') { gr.style.background = 'rgba(120,160,220,.12)'; gr.style.mixBlendMode = 'soft-light'; }
        else if (g === 'flashback') { scene.style.filter = 'sepia(.55) saturate(.8) contrast(1.05)'; }
      }
      if (shot.type === 'scene' || (shot.type === 'card' && shot.card === 'news')) await this.buildScene(shot, meta);
      else if (shot.type === 'screen') await this.buildScreen(shot, meta);
      else if (shot.type === 'card') await this.buildCard(shot, meta);
      else if (shot.type === 'endcard') await this.buildEnd(shot, meta);
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
      this.frame(0);
      return true;
    },

    // ================= SCENE =================
    async buildScene(shot, meta) {
      const setId = shot.type === 'card' ? 'news_studio' : shot.set;
      const SET = window.SETS[setId];
      const L = SET.draw({ time: shot.time || 'day', name: meta.store || 'Sharma Medical Store', rain: !!shot.rain });
      const scene = $('#scene');
      const mk = (cls, inner) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'layer ' + cls); s.setAttribute('width', W); s.setAttribute('height', H); s.style.fontFamily = 'Poppins'; const g = document.createElementNS(NS, 'g'); g.innerHTML = inner || ''; s.appendChild(g); scene.appendChild(s); return { s, g }; };
      S.layers = { back: mk('back', L.back), mid: mk('mid', L.mid), cb: mk('cb', ''), front: mk('front', L.front), cf: mk('cf', ''), fore: mk('fore', L.fore) };
      S.floorY = SET.floorY || 1250; S.set = SET;
      // characters
      S.chars = {};
      let place = shot.place || [];
      if (shot.type === 'card' && meta.cast && meta.cast.includes('anchor') && !place.length) place = [{ who: 'anchor', spot: 'anchor', face: 'right' }];
      for (const p of place) {
        const spot = SET.spots[p.spot] || { x: 1200, zone: 'front' };
        const layer = spot.zone === 'behind' ? S.layers.cb.g : S.layers.cf.g;
        const c = CHAR.build(p.who, layer);
        S.chars[p.who] = { c, x: spot.x, baseX: spot.x, face: p.face === 'left' ? -1 : 1, spot: p.spot, seed: hash(p.who) * 10, lastEmo: 'neutral', path: [] };
      }
      // actions → movement paths
      for (const a of (shot.actions || [])) {
        const ch = S.chars[a.who]; if (!ch) continue;
        const at = a.at || 0;
        const speed = 420;
        if (a.do === 'enter_left' || a.do === 'enter_right') {
          const from = a.do === 'enter_left' ? -260 : WW + 260;
          ch.path.push({ t0: at, t1: at + Math.abs(ch.baseX - from) / speed, x0: from, x1: ch.baseX });
          ch.hiddenBefore = at;
        } else if (a.do === 'exit_left' || a.do === 'exit_right') {
          const to = a.do === 'exit_left' ? -300 : WW + 300;
          ch.path.push({ t0: at, t1: at + Math.abs(ch.baseX - to) / speed, x0: ch.baseX, x1: to });
        } else if (a.do.startsWith('walk_to:')) {
          const sp = SET.spots[a.do.split(':')[1]]; if (!sp) continue;
          ch.path.push({ t0: at, t1: at + Math.abs(ch.baseX - sp.x) / speed, x0: ch.baseX, x1: sp.x });
        }
      }
      // news overlay
      if (shot.type === 'card' && shot.card === 'news') {
        const d = shot.data || {};
        const ui = $('#ui');
        const fs = V ? 1.25 : 1;
        ui.innerHTML = `<div class="lower3" style="left:${V ? 50 : 90}px;right:${V ? 50 : 'auto'};bottom:${V ? 800 : S.lbH + 150}px;font-size:${34 * fs}px"><span class="tag">BREAKING</span><span class="hl">${esc(d.headline || '')}</span></div>`
          + `<div class="ticker" style="bottom:${V ? 560 : S.lbH}px;font-size:${24 * fs}px;padding:${10 * fs}px 0"><span>${esc(d.ticker || '')} &nbsp;•&nbsp; ${esc(d.ticker || '')}</span></div>`;
      }
    },

    camRect(t) {
      const shot = S.shot, cam = shot.camera || {};
      const fr = (shot.type === 'card' ? 'medium:anchor' : (cam.frame || 'wide'));
      const fy = S.floorY;
      const ch = id => S.chars[id];
      const headY = c => fy - 716 * c.c.scale - 30;
      const aspect = W / H;
      let cx = WW / 2, cy = WH / 2, h = WH;
      const speaker = this.speakerAt(t);
      const parts = fr.split(':');
      const kind = parts[0];
      let subj = parts[1] ? parts[1].split(',') : [];
      if (V && (kind === 'two' || kind === 'wide') && speaker && ch(speaker)) {
        // vertical: follow whoever is speaking, medium framing
        const fx = this.followX(t);
        h = kind === 'wide' ? WH : 1150; cx = fx; cy = kind === 'wide' ? WH / 2 : headY(ch(speaker)) + 470;
      } else if (kind === 'wide' || kind === 'insert') {
        h = V ? WH : WH * 0.96;
        if (V) { const xs = Object.values(S.chars).map(c => c.x); cx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : WW / 2; }
      } else if (kind === 'two' && subj.every(ch)) {
        const a = ch(subj[0]), b = ch(subj[1]);
        const x0 = Math.min(a.x, b.x) - 380, x1 = Math.max(a.x, b.x) + 380;
        const w = Math.max(1300, x1 - x0); h = w / aspect; cx = (x0 + x1) / 2; cy = Math.min(headY(a), headY(b)) + h * 0.36;
      } else if ((kind === 'medium' || kind === 'close') && subj[0] && ch(subj[0])) {
        const c = ch(subj[0]);
        const cxm = this.charX(subj[0], t);
        if (kind === 'medium') { h = V ? 1150 : 860; cx = cxm + c.face * (V ? 10 : 140); cy = headY(c) + (V ? 470 : 330); }
        else { h = V ? 650 : 480; cx = cxm + c.face * (V ? 18 : 70); cy = headY(c) + (V ? 170 : 95); }
      }
      let w = h * aspect;
      // moves
      const T = S.shot.dur, p = ease(t / T);
      const mv = cam.move || 'static';
      if (mv === 'push_in') { const k = lerp(1, 0.88, p); w *= k; h *= k; }
      if (mv === 'pull_out') { const k = lerp(0.88, 1, p); w *= k; h *= k; }
      if (mv === 'pan_left') cx += lerp(0.07, -0.07, p) * w;
      if (mv === 'pan_right') cx += lerp(-0.07, 0.07, p) * w;
      let rot = 0;
      if (mv === 'handheld') { cx += noise(t * 0.9, 1) * w * 0.006; cy += noise(t * 0.8, 5) * h * 0.006; rot = noise(t * 0.6, 9) * 0.35; }
      if (mv === 'shake') { const k = 1 - p * 0.6; cx += noise(t * 9, 1) * w * 0.012 * k; cy += noise(t * 8, 5) * h * 0.012 * k; rot = noise(t * 7, 9) * 0.9 * k; }
      // whip in
      if (S.shot.transition === 'whip' && t < 0.28) cx += (1 - easeOut(t / 0.28)) * w * 0.5;
      if (S.shot.transOut === 'whip' && t > T - 0.22) cx -= ease((t - (T - 0.22)) / 0.22) * w * 0.5;
      // clamp inside the world
      w = Math.min(w, WW); h = Math.min(h, WH);
      // keep the framed heads below the letterbox / logo bug with some headroom
      const keep = kind === 'two' ? subj : (kind === 'medium' || kind === 'close') ? subj.slice(0, 1) : (V && speaker ? [speaker] : []);
      const lbF = V ? 0.15 : S.lbH / H, room = kind === 'close' ? 0.035 : 0.07;
      for (const id of keep) {
        const c = ch(id); if (!c) continue;
        const top = fy - 845 * c.c.scale;
        if (cy - h / 2 + lbF * h > top - room * h) cy = top - room * h + h / 2 - lbF * h;
      }
      cx = clamp(cx, w / 2, WW - w / 2); cy = clamp(cy, h / 2, WH - h / 2);
      return { cx, cy, w, h, rot };
    },
    speakerAt(t) {
      const ls = S.shot.lines || []; let sp = null;
      for (const l of ls) { if (l.who === 'narrator') continue; if (t >= l.start - 0.25) sp = l.who; }
      if (!sp) { const f = ls.find(l => l.who !== 'narrator'); sp = f ? f.who : (Object.keys(S.chars)[0] || null); }
      return sp;
    },
    followX(t) {
      const ls = (S.shot.lines || []).filter(l => l.who !== 'narrator' && S.chars[l.who]);
      if (!ls.length) { const k = Object.keys(S.chars); return k.length ? this.charX(k[0], t) : WW / 2; }
      let x = this.charX(ls[0].who, t);
      for (let i = 1; i < ls.length; i++) {
        const k = ease((t - (ls[i].start - 0.45)) / 0.45);
        if (k > 0) x = lerp(x, this.charX(ls[i].who, t), k);
      }
      return x;
    },
    charX(id, t) {
      const c = S.chars[id]; let x = c.baseX;
      for (const p of c.path) { if (t >= p.t0) x = t >= p.t1 ? p.x1 : lerp(p.x0, p.x1, (t - p.t0) / (p.t1 - p.t0)); }
      return x;
    },

    renderScene(t) {
      const cam = this.camRect(t);
      const k = W / cam.w;
      const par = { back: 0.9, mid: 1, cb: 1, front: 1, cf: 1, fore: 1.18 };
      for (const [name, L] of Object.entries(S.layers)) {
        const p = par[name];
        const cx = WW / 2 + (cam.cx - WW / 2) * p, cy = WH / 2 + (cam.cy - WH / 2) * p;
        const kk = name === 'fore' ? k * 1.04 : k;
        L.g.setAttribute('transform', `translate(${W / 2},${H / 2}) rotate(${cam.rot}) scale(${kk}) translate(${-cx},${-cy})`);
      }
      const closeish = /^(close|medium)/.test((S.shot.camera || {}).frame || '');
      S.layers.back.s.style.filter = closeish ? `blur(${/^close/.test(S.shot.camera.frame) ? 3 : 1.4}px)` : '';
      S.layers.fore.s.style.filter = 'blur(7px)';
      if (S.shot.transition === 'whip' || S.shot.transOut === 'whip') {
        const T = S.shot.dur; const b = t < 0.28 && S.shot.transition === 'whip' ? (1 - t / 0.28) * 14 : (S.shot.transOut === 'whip' && t > T - 0.22 ? (t - (T - 0.22)) / 0.22 * 14 : 0);
        $('#scene').style.filter = b > 0.2 ? `blur(${b}px)` : (S.shot.grade === 'flashback' ? 'sepia(.55) saturate(.8) contrast(1.05)' : '');
      }
      // characters
      const lines = S.shot.lines || [];
      const cur = lines.find(l => t >= l.start && t <= l.end);
      for (const [id, ch] of Object.entries(S.chars)) {
        const x = this.charX(id, t);
        let walking = false, dir = ch.face;
        for (const p of ch.path) if (t >= p.t0 && t < p.t1) { walking = true; dir = p.x1 > p.x0 ? 1 : -1; }
        const hidden = ch.hiddenBefore != null && t < ch.hiddenBefore;
        ch.c.root.style.display = hidden ? 'none' : '';
        // gesture + emotion for this character
        let pose = 'idle', poseFrom = 'idle', mix = 1, amp = 0, emo = ch.lastEmo;
        const mine = lines.filter(l => l.who === id);
        for (const l of mine) { if (t >= l.start - 0.1) emo = l.emotion || emo; }
        const now = mine.find(l => t >= l.start - 0.25 && t <= l.end + 0.3);
        if (now) {
          let g = now.gesture || 'talk';
          // a reaching arm would pass through a neighbour standing close in front: talk with the hands instead
          if (g === 'point' || g === 'give' || g === 'show_phone') {
            for (const [oid, o] of Object.entries(S.chars)) {
              if (oid === id) continue;
              const dx = (this.charX(oid, t) - x) * ch.face;
              if (dx > 0 && dx < 420) { g = g === 'show_phone' ? 'hold_phone' : 'talk'; break; }
            }
          }
          const into = ease((t - (now.start - 0.25)) / 0.3), out = ease((t - now.end) / 0.3);
          pose = out > 0 ? 'idle' : g; poseFrom = out > 0 ? g : 'idle'; mix = out > 0 ? out : into;
          if (t >= now.start && t <= now.end && now.env) { const i = Math.floor((t - now.start) * FPS); amp = now.env[Math.min(now.env.length - 1, Math.max(0, i))] || 0; }
        }
        // look: towards current speaker
        let look = [2, 0];
        if (cur && cur.who !== id && S.chars[cur.who]) { const dx = this.charX(cur.who, t) - x; look = [Math.sign(dx) * (ch.face) * 2.6, 0.6]; }
        if (pose === 'hold_phone') look = [1.5, 3];
        const per = 2.8 + (ch.seed % 1.7), ph = (t + ch.seed) % per;
        const blink = ph < 0.12 ? Math.sin(ph / 0.12 * Math.PI) : 0;
        ch.c.update({ x, y: S.floorY, face: walking ? dir : ch.face, t: t + ch.seed, amp, emotion: emo, pose: walking ? 'idle' : pose, poseFrom, poseMix: mix, walk: walking, walkPhase: t * 9, blink, look });
      }
    },

    // ================= SCREEN =================
    async buildScreen(shot, meta) {
      const ui = $('#ui');
      const W0 = V ? 1000 : 1400, H0 = V ? (shot.head ? 600 : 720) : 720;
      const left = V ? 40 : (W - W0) / 2, top = V ? (shot.head ? 540 : 420) : (shot.head ? 250 : 170);
      const head = shot.head ? `<div class="head" style="${V ? 'left:70px;right:70px;top:300px' : 'left:240px;right:240px;top:70px;text-align:center'}"><h1 style="font-size:${V ? 70 : 52}px">${esc(shot.head)}</h1>${shot.sub ? `<p style="font-size:${V ? 38 : 28}px">${esc(shot.sub)}</p>` : ''}</div>` : '';
      ui.innerHTML = `<div class="scr"><div class="grid"></div>${head}
        <div class="frame" style="left:${left}px;top:${top}px;width:${W0}px"><div class="chrome"><i></i><i></i><i></i><div class="url">nexcodpos.in/${URL[shot.img] || ''}</div></div>
        <div class="view" style="width:${W0}px;height:${H0}px"><div class="vlayer"><img src="shots/${shot.img}.png"></div></div></div>
        <div id="notes" style="position:absolute;left:${left}px;top:${top + 52}px;width:${W0}px;height:${H0}px"><svg width="${W0}" height="${H0}" style="position:absolute;left:0;top:0;overflow:visible"></svg></div></div>`;
      const fit = r => { let s = Math.min(W0 / r[2], H0 / r[3]) * (V ? 1 : 0.72); s = Math.max(Math.max(W0 / 1366, H0 / 768), Math.min(s, V ? 2.3 : 1.55)); let tx = W0 / 2 - s * (r[0] + r[2] / 2), ty = H0 / 2 - s * (r[1] + r[3] / 2); const iw = 1366 * s, ih = 768 * s; tx = iw >= W0 ? Math.min(0, Math.max(W0 - iw, tx)) : (W0 - iw) / 2; ty = ih >= H0 ? Math.min(0, Math.max(H0 - ih, ty)) : (H0 - ih) / 2; return { tx, ty, s }; };
      const z = (shot.zoom || []).map(n => REG[n]).filter(Boolean);
      if (!z.length) z.push([0, 0, 1366, 768]);
      const z0 = z[0], cx = z0[0] + z0[2] / 2, cy = z0[1] + z0[3] / 2, ew = Math.min(1366, z0[2] * 1.5), eh = Math.min(768, z0[3] * 1.5);
      const full = [clamp(cx - ew / 2, 0, 1366 - ew), clamp(cy - eh / 2, 0, 768 - eh), ew, eh];
      S.scr = { W0, H0, Tf: fit(full), T0: fit(z[0]), T1: z[1] ? fit(z[1]) : null, layer: ui.querySelector('.vlayer'), notes: [], frameEl: ui.querySelector('.frame') };
      // notes: assign to zoom step containing the target
      const tg = TGT[shot.img] || {};
      const svg = ui.querySelector('#notes svg'), box = ui.querySelector('#notes');
      const ns = (shot.notes || []).map(n => ({ ...n, p: tg[n.target] })).filter(n => n.p);
      ns.forEach(n => { n.step = (z[1] && !(n.p[0] >= z[0][0] && n.p[0] <= z[0][0] + z[0][2] && n.p[1] >= z[0][1] && n.p[1] <= z[0][1] + z[0][3])) ? 1 : 0; });
      const D = shot.dur;
      const o2 = Math.min(2.0, D * 0.4), pan0 = D * 0.5, pan1 = Math.min(D - 0.6, pan0 + 1.1);
      S.scr.times = { o1: 0.45, o2, pan0, pan1 };
      for (const step of [0, 1]) {
        const T = step ? S.scr.T1 : S.scr.T0; if (!T) continue;
        const list = ns.filter(n => n.step === step);
        const sorted = list.map(n => ({ n, px: T.tx + T.s * n.p[0], py: T.ty + T.s * n.p[1] })).sort((a, b) => a.px - b.px);
        const t0 = step ? pan1 + 0.1 : o2 + 0.15, t1 = (step === 0 && S.scr.T1) ? pan0 - 0.1 : null;
        const span = (t1 != null ? t1 : D - 0.3) - t0;
        sorted.forEach((o, i) => {
          const k = sorted.length;
          const lx = k === 1 ? clamp(o.px + clamp((W0 / 2 - o.px) * 0.6, -260, 260), 200, W0 - 200) : (k === 2 ? [W0 * 0.3, W0 * 0.7][i] : 180 + i * ((W0 - 360) / (k - 1)));
          const ly = o.py + (o.py > H0 * 0.5 ? -H0 * 0.27 : H0 * 0.27);
          const el = document.createElement('div'); el.className = 'note'; el.style.fontSize = (V ? 32 : 26) + 'px'; el.textContent = o.n.text; el.style.left = lx + 'px'; el.style.top = ly + 'px'; box.appendChild(el);
          const sy = ly + (ly < o.py ? 30 : -30), mx = (o.px + lx) / 2 + (lx < o.px ? 50 : -50), my = (o.py + sy) / 2;
          const ang = Math.atan2(o.py - my, o.px - mx), ex = o.px - Math.cos(ang) * 16, ey = o.py - Math.sin(ang) * 16, ah = 22;
          const g = document.createElementNS(NS, 'g');
          g.innerHTML = `<circle cx="${o.px}" cy="${o.py}" r="18" fill="rgba(200,22,30,.12)" stroke="#C8161E" stroke-width="4"/><path d="M${lx},${sy} Q${mx},${my} ${ex},${ey}" fill="none" stroke="#C8161E" stroke-width="5.5" stroke-linecap="round"/><path d="M${ex + Math.cos(ang + 2.5) * ah},${ey + Math.sin(ang + 2.5) * ah} L${ex},${ey} L${ex + Math.cos(ang - 2.5) * ah},${ey + Math.sin(ang - 2.5) * ah}" fill="none" stroke="#C8161E" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`;
          svg.appendChild(g);
          S.scr.notes.push({ el, g, a: t0 + i * Math.min(0.8, span / (k + 1)), b: t1 });
        });
      }
    },
    renderScreen(t) {
      const sc = S.scr, { o1, o2, pan0, pan1 } = sc.times;
      const T2S = q => `translate(${q.tx}px,${q.ty}px) scale(${q.s})`;
      const mixT = (a, b, k) => ({ tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), s: lerp(a.s, b.s, k) });
      let q = sc.Tf;
      if (t > o1) q = mixT(sc.Tf, sc.T0, ease((t - o1) / (o2 - o1)));
      if (sc.T1 && t > pan0) q = mixT(sc.T0, sc.T1, ease((t - pan0) / (pan1 - pan0)));
      sc.layer.style.transform = T2S(q);
      const fin = easeOut(t / 0.6);
      sc.frameEl.style.transform = `translateY(${(1 - fin) * 80}px)`; sc.frameEl.style.opacity = fin;
      const hd = $('#ui .head'); if (hd) { hd.style.opacity = easeOut(t / 0.5); hd.style.transform = `translateY(${(1 - easeOut(t / 0.5)) * 30}px)`; }
      for (const n of sc.notes) {
        let o = ease((t - n.a) / 0.35); if (n.b != null) o *= 1 - ease((t - n.b) / 0.25);
        n.el.style.opacity = o; n.g.style.opacity = o; n.el.style.transform = `translate(-50%,-50%) scale(${0.85 + 0.15 * o})`;
      }
    },

    // ================= CARDS =================
    async buildCard(shot, meta) {
      const ui = $('#ui'), d = shot.data || {}, c = shot.card;
      const f = V ? 1.25 : 1;
      let h = `<div class="card" style="padding-bottom:${V ? 440 : 0}px"><div class="grid"></div>`;
      if (c === 'title') {
        h += `<div class="pad" style="text-align:center"><div class="rule a" style="margin:0 auto ${30 * f}px"></div>${(d.lines || []).map((l, i) => `<div class="big a" style="font-size:${(i ? 64 : 76) * f}px;font-weight:${i ? 400 : 600};margin-top:${10 * f}px">${esc(l)}</div>`).join('')}${d.sub ? `<div class="mut a" style="font-size:${30 * f}px;margin-top:${26 * f}px;letter-spacing:.08em">${esc(d.sub)}</div>` : ''}</div>`;
      } else if (c === 'kinetic') {
        h += `<div class="pad">${(d.lines || []).map((l, i) => `<div class="big a" style="font-size:${(V ? 96 : 104)}px;${i === (d.lines.length - 1) ? 'color:var(--red)' : ''}">${esc(l)}</div>`).join('')}<div class="rule a" style="margin-top:${36 * f}px"></div></div>`;
      } else if (c === 'stat') {
        h += `<div class="pad" style="text-align:center">${d.small ? `<div class="kick a" style="font-size:${26 * f}px;margin-bottom:${28 * f}px">${esc(d.small)}</div>` : ''}<div class="big a" id="statbig" style="font-size:${(V ? 150 : 150)}px">${esc(d.big)}</div><div class="mut a" style="font-size:${40 * f}px;margin-top:${28 * f}px">${esc(d.label || '')}</div><div class="rule a" style="margin:${36 * f}px auto 0"></div></div>`;
      } else if (c === 'split') {
        const col = (title, items, good) => `<div style="flex:1;min-width:0;padding:${36 * f}px;border-radius:${28 * f}px;background:${good ? '#fff' : '#F3F4F6'};border:1px solid var(--line);${good ? 'box-shadow:0 20px 50px rgba(21,24,34,.10)' : ''}"><div class="a" style="font-size:${34 * f}px;font-weight:600;color:${good ? 'var(--green)' : '#6B7280'};margin-bottom:${22 * f}px">${esc(title)}</div>${items.map(it => `<div class="item a" style="font-size:${28 * f}px;padding:${16 * f}px ${18 * f}px;margin-bottom:${14 * f}px"><span class="ck ${good ? 'g' : 'x'}" style="width:${40 * f}px;height:${40 * f}px">${good ? '<svg width="60%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>' : '<svg width="50%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'}</span><span>${esc(it)}</span></div>`).join('')}</div>`;
        h += `<div class="pad" style="display:flex;flex-direction:${V ? 'column' : 'row'};gap:${36 * f}px">${col(d.left_title || 'Pehle', d.left || [], false)}${col(d.right_title || 'Nexcod POS ke saath', d.right || [], true)}</div>`;
      } else if (c === 'chat') {
        const pw = V ? 620 : 480, ph = V ? 880 : 800;
        h += `<div class="phone" style="width:${pw}px;height:${ph}px;left:${(W - pw) / 2}px;top:${V ? 310 : 40}px"><div class="scrn"><div class="bar" style="font-size:${V ? 30 : 22}px"><div class="av" style="width:${V ? 64 : 48}px;height:${V ? 64 : 48}px"><img src="logo.png" style="width:100%"></div><div><div style="font-weight:600">${esc(d.contact || 'Sharma Medical Store')}</div><div style="font-size:.7em;opacity:.8">online</div></div></div><div class="msgs" style="font-size:${V ? 30 : 22}px">${(d.messages || []).map(m => `<div class="bub ${m.from === 'me' ? 'me' : 'shop'} a">${m.attach === 'pdf_bill' ? `<div class="pdf"><i>PDF</i><div><div style="font-weight:600">Bill-INV-00076.pdf</div><div style="font-size:.75em;color:#6B7280">Tap to view · download · print</div></div></div>` : ''}${esc(m.text)}</div>`).join('')}</div></div></div>`;
      } else if (c === 'quiz') {
        h += `<div class="pad">${d.small ? '' : `<div class="kick a" style="font-size:${26 * f}px;margin-bottom:${24 * f}px">Quiz</div>`}<div class="big a" style="font-size:${(V ? 64 : 58)}px">${esc(d.q || '')}</div><div style="display:flex;flex-direction:column;gap:${18 * f}px;margin-top:${40 * f}px">${(d.options || []).map((o, i) => `<div class="opt a" data-i="${i}" style="font-size:${34 * f}px;padding:${18 * f}px ${24 * f}px"><b style="width:${54 * f}px;height:${54 * f}px">${'ABCD'[i]}</b><span>${esc(o)}</span></div>`).join('')}</div><div id="qtimer" style="margin-top:${30 * f}px;height:${10 * f}px;border-radius:10px;background:var(--soft);overflow:hidden"><i style="display:block;height:100%;background:linear-gradient(90deg,var(--red),var(--orange));transform-origin:left"></i></div></div>`;
      } else if (c === 'checklist') {
        h += `<div class="pad"><div class="big a" style="font-size:${(V ? 72 : 64)}px;margin-bottom:${40 * f}px">${esc(d.title || '')}</div>${(d.items || []).map(it => `<div class="item a" style="font-size:${38 * f}px;padding:${20 * f}px ${24 * f}px;margin-bottom:${18 * f}px"><span class="ck" style="width:${56 * f}px;height:${56 * f}px"><svg width="60%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><span>${esc(it)}</span></div>`).join('')}</div>`;
      } else if (c === 'countdown') {
        h += `<div class="pad" style="text-align:center"><div class="kick a" style="font-size:${30 * f}px">${esc(d.label || '')}</div><div class="big" id="cdn" style="font-size:${V ? 380 : 340}px;color:var(--red);line-height:1">${d.from || 10}</div><div class="mut a" style="font-size:${30 * f}px">minute</div></div>`;
      } else if (c === 'price') {
        h += `<div class="pad" style="text-align:center"><span class="pill a" style="font-size:${30 * f}px;letter-spacing:.14em">PLATINUM · 1 SAAL</span><div class="mut a" style="font-size:${60 * f}px;text-decoration:line-through;text-decoration-color:var(--red);margin-top:${40 * f}px">₹4,999</div><div class="big a" style="font-size:${V ? 230 : 200}px;letter-spacing:-.04em">₹1,299<span class="mut" style="font-size:.28em;letter-spacing:0"> /saal</span></div><div class="a" style="font-size:${48 * f}px;margin-top:${26 * f}px">Sirf <b style="color:var(--red)">₹108</b> mahina · 7 din free trial</div></div>`;
      }
      h += '</div>';
      ui.innerHTML = h;
      S.anim = [...ui.querySelectorAll('.a')];
    },
    renderCard(t) {
      const shot = S.shot, c = shot.card, D = shot.dur, els = S.anim || [];
      const lines = shot.lines || [];
      // reveal elements spread over the shot (synchronised to voice lines when present)
      const n = els.length;
      els.forEach((e, i) => {
        let at;
        if (c === 'kinetic' || c === 'checklist' || c === 'split') at = 0.2 + i * Math.min(0.75, (D * 0.7) / Math.max(1, n));
        else at = 0.1 + i * 0.12;
        const k = easeOut((t - at) / 0.5);
        e.style.opacity = k; e.style.transform = `translateY(${(1 - k) * 40}px)`;
      });
      if (c === 'countdown') { const d0 = shot.data.from || 10; const v = Math.max(0, Math.ceil(d0 * (1 - t / D))); const el = $('#cdn'); el.textContent = v; const fr = (t * d0 / D) % 1; el.style.transform = `scale(${1 + 0.08 * (1 - fr)})`; }
      if (c === 'quiz') {
        const reveal = D * 0.7; const bar = $('#qtimer i'); if (bar) bar.style.transform = `scaleX(${clamp(1 - t / reveal, 0, 1)})`;
        document.querySelectorAll('.opt').forEach(o => { const i = +o.dataset.i; const r = t > reveal; o.style.borderColor = r && i === shot.data.answer ? 'var(--green)' : 'var(--line)'; o.style.background = r && i === shot.data.answer ? '#EAF7F0' : '#fff'; o.style.opacity = r && i !== shot.data.answer ? 0.45 : o.style.opacity; });
      }
      if (c === 'chat') {
        const bubs = [...document.querySelectorAll('.bub')]; const k = bubs.length;
        bubs.forEach((b, i) => { const at = 0.4 + i * ((D - 1) / Math.max(1, k)); const v = easeOut((t - at) / 0.35); b.style.opacity = v; b.style.transform = `translateY(${(1 - v) * 30}px) scale(${0.96 + 0.04 * v})`; b.style.display = t < at - 0.05 ? 'none' : ''; });
      }
    },

    // ================= END CARD =================
    async buildEnd(shot, meta) {
      const f = V ? 1.3 : 1;
      $('#ui').innerHTML = `<div class="end" style="padding-bottom:${V ? 440 : 0}px"><img class="logo a" src="logo.png" style="width:${170 * f}px;height:${170 * f}px">
        <div class="big a" style="font-size:${78 * f}px;margin-top:${30 * f}px">Nexcod <span style="color:var(--red)">POS</span></div>
        <div class="mut a" style="font-size:${30 * f}px">Pharmacy Billing Software</div>
        <div class="btn a" style="font-size:${42 * f}px;padding:${22 * f}px ${50 * f}px;margin-top:${40 * f}px">7 din FREE trial<div style="font-size:.6em;font-weight:400">Koi card nahi chahiye · Plans ₹1,299/saal</div></div>
        <div class="big a" style="font-size:${58 * f}px;margin-top:${38 * f}px">nexcodpos.in</div>
        <div class="mut a" style="font-size:${26 * f}px;margin-top:${12 * f}px">Call <b style="color:var(--ink);font-weight:500">73198 33790</b> · WhatsApp <b style="color:var(--ink);font-weight:500">72819 21783</b></div>
        <div class="mut a" style="font-size:${22 * f}px;margin-top:${26 * f}px;display:flex;align-items:center;gap:10px"><span class="flag" style="width:${38 * f}px;height:${26 * f}px"><i></i><i></i><i></i></span>Made in India, for Indian pharmacies</div>
        ${meta.dramatization ? `<div class="mut" style="${V ? 'margin-top:44px' : 'position:absolute;bottom:30px'};font-size:${16 * f}px;opacity:.75">Characters and events are dramatized for illustration.</div>` : ''}</div>`;
      S.anim = [...document.querySelectorAll('#ui .a')];
    },
    renderEnd(t) {
      (S.anim || []).forEach((e, i) => { const k = easeOut((t - 0.1 - i * 0.18) / 0.55); e.style.opacity = k; e.style.transform = `translateY(${(1 - k) * 36}px)` + (i === 0 ? ` scale(${0.7 + 0.3 * k}) rotate(${(1 - k) * -30}deg)` : ''); });
      const btn = document.querySelector('.end .btn'); if (btn && t > 1.8) btn.style.transform = `scale(${1 + 0.035 * Math.sin((t - 1.8) * 5)})`;
    },

    // ================= FRAME =================
    frame(t) {
      S.t = t; const shot = S.shot, D = shot.dur;
      if (S.layers && (shot.type === 'scene' || shot.card === 'news')) this.renderScene(t);
      if (shot.type === 'screen') this.renderScreen(t);
      if (shot.type === 'card' && shot.card !== 'news') this.renderCard(t);
      if (shot.type === 'endcard') this.renderEnd(t);
      if (shot.type === 'card' && shot.card === 'news') { const tk = document.querySelector('.ticker span'); if (tk) tk.style.transform = `translateX(${-t * 160}px)`; }
      // subtitles
      const ls = shot.lines || [], cur = ls.find(l => t >= l.start - 0.05 && t <= l.end + 0.2);
      const sp = $('#subs span');
      if (cur && shot.type !== 'endcard') { sp.textContent = cur.sub; sp.style.opacity = 1; } else { sp.style.opacity = 0; }
      // title text
      if (shot.title) { const k = ease(t / 0.4) * (1 - ease((t - 2.8) / 0.4)); $('#ttl').style.opacity = k; }
      // grain jitter
      const gx = Math.floor(hash('g' + Math.floor(t * 24)) * 400), gy = Math.floor(hash('h' + Math.floor(t * 24)) * 400);
      $('#grain').style.transform = `translate(${-gx % 60}px,${-gy % 60}px) scale(1.1)`;
      // transitions
      const tr = $('#trans'); let o = 0, col = '#000';
      if (shot.transition === 'fade' || shot.transition === 'dip_black') o = Math.max(o, 1 - ease(t / 0.4));
      if (shot.transOut === 'dip_black') o = Math.max(o, ease((t - (D - 0.35)) / 0.35));
      if (shot.transition === 'flash') { col = '#fff'; o = Math.max(o, 1 - ease(t / 0.3)); }
      if (S.meta && S.meta.first && t < 0.5) o = Math.max(o, 1 - ease(t / 0.5));
      if (S.meta && S.meta.last) o = Math.max(o, ease((t - (D - 0.6)) / 0.6) * 0); // end card holds
      tr.style.background = col; tr.style.opacity = o;
    }
  };
})();
