// store_front: an Indian neighbourhood medical store seen from the street at eye level.
// World 2400x1350, feet on the footpath at y=1250. Low (1 m) camera, one-point perspective,
// shop facade 7.2 m from camera, people standing 4 m from camera at the footpath's front edge.
(function () {
  'use strict';
  var ID = 'store_front';

  // ---------- small utils ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function h2r(h) { h = h.replace('#', ''); var v = parseInt(h, 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function r2h(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = h2r(a), B = h2r(b); return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  function n(v) { return Math.round(v * 10) / 10; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function tw(s, fs) { // rough Poppins 600 advance-width estimate
    var w = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], c = s.charCodeAt(i);
      if (ch === ' ') w += 0.28;
      else if ('iIl.,:;|!\'j'.indexOf(ch) >= 0) w += 0.3;
      else if ('mwMW'.indexOf(ch) >= 0) w += 0.88;
      else if (ch >= 'A' && ch <= 'Z') w += 0.72;
      else if (ch >= '0' && ch <= '9') w += 0.63;
      else if (c >= 0x900 && c < 0x980) w += 0.5;
      else w += 0.6;
    }
    return w * fs;
  }

  // ---------- camera: 1.0 m high, horizon y=803, focal 1788 (447 units/m at 4 m = feet line) ----------
  var CX = 1200, HZ = 803, FL = 1788, CAM = 1.0;
  function P(x, h, d) { return [CX + x * FL / d, HZ - (h - CAM) * FL / d]; }
  function S(d) { return FL / d; }
  function pth(pts) { return 'M' + pts.map(function (p) { return n(p[0]) + ' ' + n(p[1]); }).join('L') + 'Z'; }
  function poly(pts, fill, a) { return '<path d="' + pth(pts) + '" fill="' + fill + '"' + (a ? ' ' + a : '') + '/>'; }
  function R(x, y, w, h, fill, rx, a) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' + (a ? ' ' + a : '') + '/>'; }
  function FR(x0, x1, h0, h1, d, fill, rx, a) { var p = P(x0, h1, d), q = P(x1, h0, d); return R(p[0], p[1], q[0] - p[0], q[1] - p[1], fill, rx, a); }
  function HQ(x0, x1, h, d0, d1, fill, a) { return poly([P(x0, h, d0), P(x1, h, d0), P(x1, h, d1), P(x0, h, d1)], fill, a); }
  function SQ(x, h0, h1, d0, d1, fill, a) { return poly([P(x, h0, d0), P(x, h1, d0), P(x, h1, d1), P(x, h0, d1)], fill, a); }
  function txt(x, y, s, fs, fill, w, a) { return '<text x="' + n(x) + '" y="' + n(y) + '" font-family="Poppins" font-weight="' + (w || 500) + '" font-size="' + n(fs) + '" fill="' + fill + '" text-anchor="middle"' + (a ? ' ' + a : '') + '>' + s + '</text>'; }
  // sagging cable as a quadratic curve; returns path + evaluator
  function wireY(x1, y1, x2, y2, sag, X) { var t = (X - x1) / (x2 - x1), cy = (y1 + y2) / 2 + sag * 2; return (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2; }
  function wire(x1, y1, x2, y2, sag, col, w, op) {
    return '<path d="M' + n(x1) + ' ' + n(y1) + 'Q' + n((x1 + x2) / 2) + ' ' + n((y1 + y2) / 2 + sag * 2) + ' ' + n(x2) + ' ' + n(y2) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (op ? ' opacity="' + op + '"' : '') + '/>';
  }
  function cloud(cx, cy, w, base, shade, rnd) {
    var k = 5 + Math.floor(rnd() * 3), hh = w * 0.32, i, x, r, pts = [];
    for (i = 0; i < k; i++) {
      x = cx - w / 2 + w * (i + 0.5) / k + (rnd() - 0.5) * w * 0.06;
      r = hh * (0.45 + 0.55 * Math.sin(Math.PI * (i + 0.5) / k)) * (0.85 + rnd() * 0.3);
      pts.push([x, r]);
    }
    var sh = '', bs = '';
    pts.forEach(function (p) {
      sh += '<circle cx="' + n(p[0]) + '" cy="' + n(cy - p[1] * 0.55 + hh * 0.08) + '" r="' + n(p[1]) + '"/>';
      bs += '<circle cx="' + n(p[0] - p[1] * 0.08) + '" cy="' + n(cy - p[1] * 0.62) + '" r="' + n(p[1] * 0.92) + '"/>';
    });
    return '<g fill="' + shade + '">' + sh + R(cx - w / 2 + 6, cy - hh * 0.5, w - 12, hh * 0.58, shade, n(hh * 0.28)) + '</g><g fill="' + base + '">' + bs + '</g>';
  }
  function cross(cx, cy, s, fill, a) {
    var t = s * 0.34, b = s;
    return '<path d="M' + n(cx - t) + ' ' + n(cy - b) + 'h' + n(2 * t) + 'v' + n(b - t) + 'h' + n(b - t) + 'v' + n(2 * t) + 'h-' + n(b - t) + 'v' + n(b - t) + 'h-' + n(2 * t) + 'v-' + n(b - t) + 'h-' + n(b - t) + 'v-' + n(2 * t) + 'h' + n(b - t) + 'Z" fill="' + fill + '"' + (a ? ' ' + a : '') + '/>';
  }

  // ---------- scooter (side view, facing left; local units = cm, ground y=0) ----------
  function scooter(X, Y, k, C, night) {
    var body = C('#5A93C6'), bodyS = C('#3F77AA'), bodyH = C('#93C3E8'), dark = C('#25304A'), darkH = C('#3A4766'),
      tire = C('#23272F'), rim = C('#B9C1CC'), rimS = C('#7B8695'), chrome = C('#E4E8EE'), grey = C('#5B6576');
    var g = '<g transform="translate(' + n(X) + ' ' + n(Y) + ') scale(' + k.toFixed(4) + ')">';
    g += '<ellipse cx="98" cy="0" rx="108" ry="6" fill="#0B1020" opacity="' + (night ? 0.45 : 0.28) + '"/>';
    function wheel(cx) {
      return '<circle cx="' + cx + '" cy="-21" r="21" fill="' + tire + '"/><circle cx="' + cx + '" cy="-21" r="14" fill="' + rimS + '"/>' +
        '<circle cx="' + cx + '" cy="-21" r="11.5" fill="' + rim + '"/><circle cx="' + cx + '" cy="-21" r="4.5" fill="' + grey + '"/>' +
        '<path d="M' + (cx - 16) + ' -33 A20 20 0 0 1 ' + (cx + 8) + ' -40" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="3"/>';
    }
    g += wheel(152) + wheel(32);
    g += '<path d="M114 -40 L166 -32 C176 -30 176 -15 166 -13 L126 -16 C114 -18 108 -32 114 -40Z" fill="' + grey + '"/>';
    g += '<path d="M122 -30 L164 -25" stroke="' + C('#465062') + '" stroke-width="3" stroke-linecap="round"/>';
    g += '<path d="M58 -44 L106 -44 L108 -32 L62 -32Z" fill="' + dark + '"/>';
    g += '<path d="M62 -32 L108 -32 C110 -27 106 -24 100 -24 L68 -24 C63 -24 60 -27 62 -32Z" fill="' + bodyS + '"/>';
    g += '<path d="M100 -38 C96 -58 102 -74 120 -82 L178 -86 C190 -84 195 -70 193 -58 C192 -47 188 -40 181 -39 A29 29 0 0 0 123 -39Z" fill="' + body + '"/>';
    g += '<path d="M106 -46 C106 -62 112 -74 124 -78 L177 -81 C185 -80 189 -74 190 -66 C176 -70 140 -68 120 -60 C112 -56 108 -51 106 -46Z" fill="' + bodyH + '" opacity=".55"/>';
    g += '<path d="M123 -39 A29 29 0 0 1 181 -39 C186 -41 190 -45 191 -51 C184 -47 180 -45 178 -45 A25 25 0 0 0 126 -45Z" fill="' + bodyS + '"/>';
    g += '<path d="M110 -52 C130 -60 160 -62 188 -60" fill="none" stroke="' + bodyS + '" stroke-width="2.5" stroke-linecap="round"/>';
    g += '<rect x="186" y="-76" width="8" height="11" rx="3" fill="' + (night ? '#E04A3A' : C('#C8332B')) + '"/>';
    g += '<path d="M168 -88 C178 -90 189 -88 195 -79" fill="none" stroke="' + chrome + '" stroke-width="3.5" stroke-linecap="round"/>';
    g += '<path d="M110 -81 C114 -95 152 -97 184 -92 C191 -91 192 -85 186 -84 L112 -80Z" fill="' + dark + '"/>';
    g += '<path d="M120 -88 C132 -93 158 -94 180 -91" fill="none" stroke="' + darkH + '" stroke-width="3" stroke-linecap="round"/>';
    // leg shield with a hint of its front face
    g += '<path d="M66 -36 C60 -60 56 -86 58 -112 L40 -112 C38 -86 42 -58 48 -30Z" fill="' + body + '"/>';
    g += '<path d="M66 -36 C60 -60 56 -86 58 -112 L53 -112 C51 -86 55 -60 60 -35Z" fill="' + bodyS + '"/>';
    g += '<path d="M48 -30 C42 -58 38 -86 40 -112 L35 -110 C34 -84 37 -56 43 -30Z" fill="' + bodyH + '"/>';
    g += '<path d="M46 -100 L33 -22" stroke="' + rimS + '" stroke-width="6" stroke-linecap="round"/>';
    g += '<path d="M12 -26 C16 -50 48 -54 56 -30 L50 -28 C44 -44 24 -44 18 -24Z" fill="' + body + '"/>';
    g += '<path d="M16 -32 C22 -44 42 -46 50 -36" fill="none" stroke="' + bodyH + '" stroke-width="2" opacity=".7"/>';
    // handlebar
    g += '<path d="M52 -124 L72 -128" stroke="' + dark + '" stroke-width="5" stroke-linecap="round"/>';
    g += '<path d="M57 -127 L53 -142" stroke="' + chrome + '" stroke-width="2.4"/>';
    g += '<ellipse cx="52" cy="-145" rx="9" ry="5" fill="' + dark + '"/>';
    g += '<path d="M30 -110 C28 -124 40 -130 58 -128 L65 -117 C56 -110 42 -107 30 -110Z" fill="' + body + '"/>';
    g += '<path d="M33 -116 C37 -124 48 -126 58 -125" fill="none" stroke="' + bodyH + '" stroke-width="2.5" opacity=".7"/>';
    g += '<ellipse cx="31" cy="-118" rx="5" ry="7" fill="' + C('#EEF3F7') + '"/>';
    g += '<rect x="36" y="-111" width="8" height="4" rx="2" fill="' + C('#E7A43A') + '"/>';
    g += '<rect x="40" y="-78" width="7" height="17" rx="1.5" fill="' + C('#F4F4EE') + '"/>';
    g += '<path d="M112 -34 L120 -3" stroke="' + grey + '" stroke-width="3" stroke-linecap="round"/>';
    g += '</g>';
    return g;
  }

  window.SETS = window.SETS || {};
  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      walk_left: { x: 350, zone: 'front' },
      door: { x: 1200, zone: 'front' },
      walk_right: { x: 2000, zone: 'front' }
    },
    draw: function (opts) {
      opts = opts || {};
      var night = opts.time === 'night', rain = !!opts.rain;
      var name = String(opts.name || 'Sharma Medical Store');
      var NAVY = '#141C33';
      var C = night ? function (c) { return mix(c, NAVY, 0.56); } : rain ? function (c) { return mix(c, '#5E6878', 0.24); } : function (c) { return c; };
      var back = '', mid = '', front = '', fore = '', defs = '';
      var i, j, x, y, d, p, q;

      // geometry (metres)
      var dM = 7.2, dL = 6.8, dR = 7.6, dS = 7.05, dB = 11.2, dK = 9.6;
      var FLH = 0.3, OT = 2.6, sM = S(dM);
      var dC = 3.88, dF = 8.1;

      // ---------- palette ----------
      var sky0, sky1, sky2;
      if (night && rain) { sky0 = '#0D1326'; sky1 = '#18213A'; sky2 = '#28324D'; }
      else if (night) { sky0 = '#0B1530'; sky1 = '#1A2A50'; sky2 = '#34466F'; }
      else if (rain) { sky0 = '#7E8999'; sky1 = '#A7B0BC'; sky2 = '#C4CAD2'; }
      else { sky0 = '#6FAEDD'; sky1 = '#A9D3EE'; sky2 = '#EDEFE4'; }
      var haze = sky2;
      function H(c, t) { return mix(C(c), haze, t); }
      var warm = '#FFD58A', warmL = '#FFE9BF';
      var boxCols = ['#E7B04A', '#5AA0D8', '#E36F5C', '#7BC18E', '#B48ED6', '#F2D16B', '#FFFFFF', '#FFFFFF', '#5AA0D8', '#7BC18E'];
      var dispCols = ['#5AA0D8', '#E36F5C', '#7BC18E', '#F2D16B', '#B48ED6', '#FFFFFF', '#E7B04A', '#1F2A44'];

      defs += '<linearGradient id="' + ID + '_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky0 + '"/><stop offset=".3" stop-color="' + sky1 + '"/><stop offset=".55" stop-color="' + sky2 + '"/><stop offset="1" stop-color="' + sky2 + '"/></linearGradient>';
      defs += '<filter id="' + ID + '_b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>';
      defs += '<filter id="' + ID + '_b18" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>';
      defs += '<filter id="' + ID + '_b40" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="40"/></filter>';
      defs += '<linearGradient id="' + ID + '_spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + warm + '" stop-opacity=".55"/><stop offset=".55" stop-color="' + warm + '" stop-opacity=".2"/><stop offset="1" stop-color="' + warm + '" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_down" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020" stop-opacity=".26"/><stop offset="1" stop-color="#0B1020" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_sun" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#FFF3D6" stop-opacity=".22"/><stop offset=".6" stop-color="#FFF3D6" stop-opacity="0"/></linearGradient>';
      defs += '<radialGradient id="' + ID + '_lamp"><stop offset="0" stop-color="' + warmL + '" stop-opacity=".9"/><stop offset=".35" stop-color="' + warm + '" stop-opacity=".35"/><stop offset="1" stop-color="' + warm + '" stop-opacity="0"/></radialGradient>';
      defs += '<radialGradient id="' + ID + '_gcross"><stop offset="0" stop-color="#5CFFAE" stop-opacity=".8"/><stop offset=".4" stop-color="#22D07F" stop-opacity=".3"/><stop offset="1" stop-color="#22D07F" stop-opacity="0"/></radialGradient>';
      defs += '<linearGradient id="' + ID + '_refw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + warm + '" stop-opacity=".6"/><stop offset="1" stop-color="' + warm + '" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_refg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3BF29A" stop-opacity=".65"/><stop offset="1" stop-color="#3BF29A" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_refs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EEF4" stop-opacity=".5"/><stop offset="1" stop-color="#E9EEF4" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_wet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1222" stop-opacity=".16"/><stop offset="1" stop-color="#0A1222" stop-opacity=".36"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_pud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (night ? '#3A4C7A' : '#E8EDF2') + '"/><stop offset="1" stop-color="' + (night ? '#1C2744' : '#AAB4C1') + '"/></linearGradient>';
      back += '<defs>' + defs + '</defs>';

      // ---------- sky ----------
      back += R(0, 0, 2400, 1350, 'url(#' + ID + '_sky)');
      if (night && !rain) {
        var sr = mulberry32(77), st = '';
        for (i = 0; i < 70; i++) { x = sr() * 2400; y = sr() * 300; st += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(0.8 + sr() * 1.8) + '" opacity="' + n(0.25 + sr() * 0.6) + '"/>'; }
        back += '<g fill="#EAF0FF">' + st + '</g>';
        back += '<circle cx="492" cy="74" r="95" fill="#F4E9C8" opacity=".08"/><circle cx="492" cy="74" r="52" fill="#F4E9C8" opacity=".12"/>';
        back += '<circle cx="492" cy="74" r="28" fill="#F3EAD0"/><circle cx="484" cy="67" r="6" fill="#E1D6B6"/><circle cx="500" cy="84" r="4.5" fill="#E1D6B6"/>';
      }
      var cr = mulberry32(11);
      var cb = night ? '#2A3A60' : rain ? '#B8BFC9' : '#FFFFFF', cs = night ? '#22314F' : rain ? '#98A1AE' : '#DCE8F1';
      back += '<g opacity="' + (night ? 0.75 : 0.95) + '">';
      back += cloud(430, 150, 240, cb, cs, cr) + cloud(1960, 130, 280, cb, cs, cr) + cloud(2330, 50, 220, cb, cs, cr);
      if (rain) back += cloud(520, 30, 420, cb, cs, cr) + cloud(1880, 30, 360, cb, cs, cr);
      back += '</g>';

      // ---------- distant city (hazy) ----------
      var far = '';
      var blds = [[1790, 92, 220, '#D7CDBE'], [1990, 36, 180, '#CBD2DB'], [2160, 118, 150, '#E1D2BC'], [2290, 66, 140, '#C9CED6']];
      blds.forEach(function (b, bi) {
        var bx = b[0], by = b[1], bw = b[2], col = H(b[3], night ? 0.25 : 0.45);
        far += R(bx, by, bw, 400, col);
        far += R(bx + bw - 26, by, 26, 400, H(mix(b[3], '#6B7686', 0.25), night ? 0.25 : 0.45));
        var wr0 = mulberry32(bi * 31 + 7);
        for (var fy = by + 22; fy < 300; fy += 34) {
          for (var fx = bx + 16; fx < bx + bw - 40; fx += 30) {
            var lit = night && wr0() > 0.55;
            far += R(fx, fy, 15, 18, lit ? '#F2C97A' : H('#6B7686', night ? 0.3 : 0.55), 2, lit ? 'opacity=".85"' : '');
          }
        }
        far += R(bx - 4, by - 8, bw + 8, 10, H(mix(b[3], '#FFFFFF', 0.25), night ? 0.25 : 0.4));
      });
      far += R(2030, 8, 44, 30, H('#4A5568', 0.4), 6) + R(2026, 4, 52, 8, H('#4A5568', 0.35), 3);
      var tX = 1905, tw0 = 26;
      far += '<g stroke="' + H('#7A8494', night ? 0.2 : 0.45) + '" stroke-width="3" fill="none">';
      far += '<path d="M' + (tX - tw0) + ' 300 L' + (tX - 6) + ' -10 M' + (tX + tw0) + ' 300 L' + (tX + 6) + ' -10"/>';
      for (y = 290; y > 0; y -= 34) { var ww = 6 + (tw0 - 6) * (y + 10) / 310; far += '<path d="M' + n(tX - ww) + ' ' + y + ' L' + n(tX + ww) + ' ' + (y - 34) + ' M' + n(tX + ww) + ' ' + y + ' L' + n(tX - ww) + ' ' + (y - 34) + '"/>'; }
      far += '</g>';
      far += R(tX - 20, 36, 10, 34, H('#AEB6C2', 0.3), 3) + R(tX + 10, 48, 10, 34, H('#AEB6C2', 0.3), 3);
      if (night) far += '<circle cx="' + tX + '" cy="-2" r="6" fill="#FF5A4A"/><circle cx="' + tX + '" cy="-2" r="16" fill="#FF5A4A" opacity=".25"/>';
      // big neem tree behind the left shop
      var tr = mulberry32(5), tree = '';
      var tg = [H('#6E9A72', night ? 0.15 : 0.28), H('#5C8762', night ? 0.15 : 0.28), H('#88B087', night ? 0.15 : 0.28)];
      tree += '<path d="M150 330 L165 170 L140 110 M165 170 L205 100" stroke="' + H('#6E5444', 0.3) + '" stroke-width="20" fill="none" stroke-linecap="round"/>';
      for (i = 0; i < 26; i++) {
        var aa = tr() * Math.PI, rr = 42 + tr() * 50;
        var cx0 = 150 + Math.cos(aa) * (90 + tr() * 110), cy0 = 120 - Math.sin(aa) * 95 + tr() * 50;
        tree += '<circle cx="' + n(cx0) + '" cy="' + n(cy0) + '" r="' + n(rr) + '" fill="' + tg[i % 2] + '"/>';
      }
      for (i = 0; i < 10; i++) tree += '<circle cx="' + n(40 + tr() * 230) + '" cy="' + n(20 + tr() * 90) + '" r="' + n(22 + tr() * 28) + '" fill="' + tg[2] + '"/>';
      // a far shop roofline + mobile tower silhouette behind, between tree and building
      tree += R(300, 168, 280, 200, H('#E4D3BA', night ? 0.2 : 0.4)) + R(296, 160, 290, 12, H('#F2E6D2', night ? 0.2 : 0.4));
      for (i = 0; i < 4; i++) tree += R(318 + i * 64, 200, 34, 40, H('#7D8794', night ? 0.25 : 0.5), 3, night && i % 2 ? 'fill-opacity="1" style="fill:#E9BC6E"' : '');
      back += far + tree;

      // ---------- footpath (whole strip; buildings cover the far part) ----------
      var tileA = C(rain ? '#ABA398' : '#CBC2B4'), tileB = C(rain ? '#9C8A80' : '#BE9F8C'), grout = C(rain ? '#857D72' : '#A89D8E');
      var yF = P(0, 0, dF)[1], yC = P(0, 0, dC)[1];
      back += R(0, yF - 2, 2400, yC - yF + 4, tileA);
      var rows = [], dd;
      for (dd = dC; dd < dF; dd += 0.3) rows.push(dd);
      var tB = '', gr = '';
      for (i = 0; i < rows.length; i++) {
        var d0 = rows[i], d1 = Math.min(rows[i] + 0.3, dF);
        for (x = -14.1; x < 14.1; x += 0.3) {
          var ix = Math.round((x + 14.1) / 0.3);
          var a0 = P(x, 0, d0), a1 = P(x + 0.3, 0, d0);
          if (a1[0] < -60 || a0[0] > 2460) continue;
          if ((ix + i) % 2 === 0) tB += pth([a0, a1, P(x + 0.3, 0, d1), P(x, 0, d1)]);
        }
        p = P(0, 0, d0);
        gr += 'M0 ' + n(p[1]) + 'H2400';
      }
      for (x = -14.1; x < 14.1; x += 0.3) {
        p = P(x, 0, dC); q = P(x, 0, dF);
        if (Math.max(p[0], q[0]) < -50 || Math.min(p[0], q[0]) > 2450) continue;
        gr += 'M' + n(p[0]) + ' ' + n(p[1]) + 'L' + n(q[0]) + ' ' + n(q[1]);
      }
      back += '<path d="' + tB + '" fill="' + tileB + '" opacity=".32"/>';
      back += '<path d="' + gr + '" stroke="' + grout + '" stroke-width="1.6" fill="none" opacity=".5"/>';
      var wr = mulberry32(42), wear = '';
      for (i = 0; i < 26; i++) {
        d = 4.1 + wr() * 3.0; x = -6 + wr() * 12; p = P(x, 0, d);
        wear += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n((0.15 + wr() * 0.4) * S(d)) + '" ry="' + n((0.04 + wr() * 0.05) * S(d)) + '"/>';
      }
      back += '<g fill="' + C('#8E8476') + '" opacity=".12">' + wear + '</g>';
      p = P(-4.9, 0, 5.0);
      back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n(0.36 * S(5.0)) + '" ry="' + n(0.09 * S(5.0)) + '" fill="' + C('#7F7A72') + '"/>';
      back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1] - 2) + '" rx="' + n(0.3 * S(5.0)) + '" ry="' + n(0.07 * S(5.0)) + '" fill="' + C('#958F86') + '"/>';

      // ---------- curb + road ----------
      var yCt = P(0, 0, 4.02)[1], yCb = P(0, -0.13, dC)[1];
      back += R(0, yCt, 2400, yC - yCt, C('#D9D3C6'));
      back += R(0, yC, 2400, yCb - yC, C('#B9B2A5'));
      var cy1 = '';
      for (x = -8; x < 8; x += 1.2) {
        var c0 = P(x, 0, dC), c1 = P(x + 0.6, 0, dC);
        if (c1[0] < 0 || c0[0] > 2400) continue;
        cy1 += 'M' + n(c0[0]) + ' ' + n(yCt) + 'H' + n(c1[0]) + 'V' + n(yCb) + 'H' + n(c0[0]) + 'Z';
      }
      back += '<path d="' + cy1 + '" fill="' + C('#2E333D') + '"/>';
      back += R(0, yC - 1, 2400, 3, '#FFFFFF', 0, 'opacity=".22"');
      back += R(0, yCb, 2400, 1350 - yCb, C(rain ? '#3E4452' : '#555B67'));
      back += R(0, yCb, 2400, 8, '#0B1020', 0, 'opacity=".25"');
      var ar = mulberry32(9), asp = '';
      for (i = 0; i < 160; i++) asp += '<rect x="' + n(ar() * 2400) + '" y="' + n(yCb + 6 + ar() * (1350 - yCb - 8)) + '" width="' + n(2 + ar() * 5) + '" height="2"/>';
      back += '<g fill="' + C('#7A808C') + '" opacity=".5">' + asp + '</g>';

      // ---------- right neighbour: mobile shop (set back, d=7.6) ----------
      var rn = '';
      var wallR = C('#DCE1E8'), wallRs = C('#C2C9D3');
      rn += FR(2.55, 9, 0, 3.6, dR, wallR);
      rn += FR(2.5, 9, 3.5, 3.62, dR - 0.05, C('#EEF1F4'));
      rn += poly([P(2.5, 3.5, dR - 0.05), P(9, 3.5, dR - 0.05), P(9, 3.5, dR), P(2.55, 3.5, dR)], wallRs);
      var ro = [2.95, 6.3];
      rn += FR(ro[0], ro[1], 0.2, 2.3, dR, night ? C('#9FB3CB') : C('#5E6878'));
      var dr = mulberry32(31), disp = '';
      for (y = 2.05; y > 1.05; y -= 0.24) for (x = ro[0] + 0.22; x < ro[1] - 0.2; x += 0.16) {
        p = P(x, y, dR + 0.6);
        disp += R(p[0], p[1], 0.09 * S(dR + 0.6), 0.17 * S(dR + 0.6), mix(C(dispCols[Math.floor(dr() * dispCols.length)]), night ? '#AFC4DB' : '#3A4252', night ? 0.25 : 0.35), 2);
      }
      rn += disp;
      rn += FR(ro[0] + 0.1, ro[1] - 0.1, 0.2, 0.98, dR + 0.15, C(night ? '#8FB3D4' : '#7D8A9B'));
      rn += FR(ro[0] + 0.1, ro[1] - 0.1, 0.9, 0.98, dR + 0.15, C('#AEB6C2'));
      rn += FR(ro[0] + 0.1, ro[1] - 0.1, 0.2, 0.38, dR + 0.15, C('#3B4456'));
      for (x = ro[0] + 0.3; x < ro[1] - 0.3; x += 0.32) { rn += FR(x, x + 0.14, 0.55, 0.8, dR + 0.15, C('#1F2A44'), 2) + FR(x + 0.02, x + 0.12, 0.58, 0.77, dR + 0.15, night ? '#7FC1F0' : C('#4E6A8C'), 2); }
      rn += FR(ro[0] - 0.05, ro[1] + 0.05, 2.3, 2.44, dR - 0.05, C('#9AA3AF'));
      rn += FR(ro[0] - 0.05, ro[1] + 0.05, 2.3, 2.33, dR - 0.05, C('#6B7686'));
      rn += FR(ro[0] - 0.06, ro[0] + 0.02, 0.2, 2.3, dR - 0.03, C('#8F98A5')) + FR(ro[1] - 0.02, ro[1] + 0.06, 0.2, 2.3, dR - 0.03, C('#8F98A5'));
      rn += FR(2.55, 9, 0, 0.2, dR, C('#8F98A5'));
      // signboard
      var sbR = C('#2F6EA6'), sbRs = C('#245A8A');
      rn += FR(2.62, 6.8, 2.47, 2.93, dR - 0.08, sbR, 4);
      rn += FR(2.62, 6.8, 2.47, 2.53, dR - 0.08, sbRs);
      p = P(3.6, 2.7, dR - 0.08);
      rn += txt(p[0], p[1], 'RAJ MOBILE', 0.19 * S(dR), '#FFFFFF', 600, 'letter-spacing="2"');
      p = P(3.6, 2.56, dR - 0.08);
      rn += txt(p[0], p[1], 'Repair • Recharge • Covers', 0.075 * S(dR), C('#F2D16B'), 500);
      // wall lamp
      p = P(2.75, 3.15, dR - 0.2);
      rn += '<path d="M' + n(p[0]) + ' ' + n(p[1] - 6) + 'h22v6" stroke="' + C('#4A5568') + '" stroke-width="3" fill="none"/>';
      rn += '<circle cx="' + n(p[0] + 22) + '" cy="' + n(p[1] + 8) + '" r="7" fill="' + (night ? '#FFF4D6' : C('#E8ECF0')) + '"/>';
      if (night) {
        rn += '<circle cx="' + n(p[0] + 22) + '" cy="' + n(p[1] + 8) + '" r="60" fill="url(#' + ID + '_lamp)"/>';
        q = P(4.6, 1.3, dR);
        rn += '<ellipse cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" rx="420" ry="320" fill="#CFE6FF" opacity=".08" filter="url(#' + ID + '_b40)"/>';
      }
      back += rn;

      // ---------- left neighbour: stationery shop (forward, d=6.8) ----------
      var ln = '';
      var wallL = C('#EBD5B8'), wallLs = C('#D9BF9C');
      p = P(-3.55, 3.3, dL + 0.6);
      ln += R(p[0] - 52, p[1] - 86, 104, 86, C('#2B3242'), 14) + R(p[0] - 58, p[1] - 94, 116, 14, C('#3A4356'), 6) + R(p[0] - 36, p[1] - 82, 14, 74, C('#4A556C'), 6, 'opacity=".7"');
      ln += R(p[0] - 70, p[1] - 4, 140, 30, C('#9C9488'));
      ln += FR(-9, -2.55, 0, 3.22, dL, wallL);
      ln += SQ(-2.55, 0, 3.22, dL, dM, wallLs);
      // tin roof edge (sloping back; we only see the fascia lip)
      ln += FR(-9, -2.5, 3.18, 3.3, dL - 0.08, C('#7F95AA'));
      ln += FR(-9, -2.5, 3.18, 3.21, dL - 0.08, C('#61768C'));
      var lo = [-6.2, -2.9];
      ln += FR(lo[0], lo[1], 0.25, 2.45, dL, C(night ? '#3A3646' : '#6A6460'));
      var sr2 = mulberry32(19), shelfL = '';
      for (y = 0.7; y < 2.3; y += 0.4) {
        shelfL += FR(lo[0], lo[1], y - 0.04, y, dL + 0.9, C('#9A6B43'));
        for (x = lo[0] + 0.05; x < lo[1] - 0.1; x += 0.07 + sr2() * 0.08) {
          var bh = 0.18 + sr2() * 0.14;
          shelfL += FR(x, x + 0.05 + sr2() * 0.04, y, y + bh, dL + 0.9, mix(C(dispCols[Math.floor(sr2() * 7)]), '#3A3646', night ? 0.4 : 0.38));
        }
      }
      ln += shelfL;
      ln += FR(lo[0] + 0.1, lo[1] - 0.15, 0.25, 1.0, dL + 0.2, C('#9A6B43'));
      ln += FR(lo[0] + 0.1, lo[1] - 0.15, 0.93, 1.0, dL + 0.2, C('#B9875A'));
      for (x = lo[0] + 0.3; x < lo[1] - 0.4; x += 0.42) {
        ln += FR(x, x + 0.22, 1.0, 1.3, dL + 0.25, C('#DCE7EC'), 4, 'opacity=".9"') + FR(x + 0.02, x + 0.2, 1.03, 1.19, dL + 0.25, C(dispCols[Math.floor(sr2() * 5)]), 3) + FR(x + 0.03, x + 0.19, 1.3, 1.36, dL + 0.25, C('#C8161E'), 2);
      }
      var hs = '';
      for (x = lo[0] + 0.15; x < lo[1] - 0.1; x += 0.36) {
        p = P(x, 2.45, dL - 0.05); q = P(x, 1.55, dL - 0.05);
        hs += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]) + '" stroke="' + C('#6B7686') + '" stroke-width="2"/>';
        for (y = 2.35; y > 1.6; y -= 0.17) { var pc = P(x - 0.06, y, dL - 0.05); hs += R(pc[0], pc[1], 0.12 * S(dL), 0.14 * S(dL), C(dispCols[Math.floor(sr2() * 7)]), 3); }
      }
      ln += hs;
      ln += FR(lo[0] - 0.05, lo[1] + 0.05, 2.45, 2.62, dL - 0.03, C('#7D8DA0'));
      ln += FR(-9, -2.55, 0, 0.25, dL, C('#9C9488'));
      ln += FR(-9, -2.55, 0.22, 0.25, dL, C('#BDB4A6'));
      // fascia signboard (mustard)
      ln += FR(-6.6, -2.62, 2.7, 3.16, dL - 0.06, C('#E7B04A'), 4);
      ln += FR(-6.6, -2.62, 2.7, 2.75, dL - 0.06, C('#C99133'));
      p = P(-3.62, 2.9, dL - 0.06);
      ln += txt(p[0], p[1], 'न्यू भारत स्टेशनरी', 0.165 * S(dL), C('#7A1E1E'), 600);
      p = P(-3.62, 2.77, dL - 0.06);
      ln += txt(p[0], p[1], 'NEW BHARAT STATIONERY', 0.07 * S(dL), C('#5A1818'), 500, 'letter-spacing="3"');
      // tin awning (underside visible, camera below)
      var aw0 = 2.66, aw1 = 2.42, awD = 5.95;
      var tin = C('#7F95AA'), tinS = C('#61768C');
      ln += poly([P(-9, aw0, dL - 0.02), P(-2.6, aw0, dL - 0.02), P(-2.6, aw1, awD), P(-9, aw1, awD)], tinS);
      var cor = '';
      for (x = -9; x < -2.6; x += 0.14) { p = P(x, aw0, dL - 0.02); q = P(x, aw1, awD); cor += 'M' + n(p[0]) + ' ' + n(p[1]) + 'L' + n(q[0]) + ' ' + n(q[1]); }
      ln += '<path d="' + cor + '" stroke="' + tin + '" stroke-width="5" opacity=".7"/>';
      // support struts
      [-5.6, -3.0].forEach(function (sx) { var s0 = P(sx, 2.0, dL), s1 = P(sx, aw1 + 0.02, awD + 0.1); ln += '<path d="M' + n(s0[0]) + ' ' + n(s0[1]) + 'L' + n(s1[0]) + ' ' + n(s1[1]) + '" stroke="' + C('#4A5568') + '" stroke-width="5"/>'; });
      var vy0 = P(0, aw1, awD)[1], vy1 = P(0, aw1 - 0.15, awD)[1], vx1 = P(-2.6, 0, awD)[0], vs = '';
      ln += R(-10, vy0, vx1 + 10, vy1 - vy0, C('#F3EBDD'));
      for (x = -9; x < -2.6; x += 0.3) { p = P(x, aw1, awD); q = P(Math.min(x + 0.15, -2.6), aw1, awD); vs += 'M' + n(p[0]) + ' ' + n(vy0) + 'H' + n(q[0]) + 'V' + n(vy1 + 8) + 'Q' + n((p[0] + q[0]) / 2) + ' ' + n(vy1 + 16) + ' ' + n(p[0]) + ' ' + n(vy1 + 8) + 'Z'; }
      ln += '<path d="' + vs + '" fill="' + C('#2E8A5E') + '"/>';
      ln += R(-10, vy0, vx1 + 10, 5, '#0B1020', 0, 'opacity=".15"');
      if (!night) { var awT = P(0, aw0, dL)[1], awB = P(-2.6, 1.9, dL); ln += R(-10, awT, awB[0] + 10, awB[1] - awT, '#2A2440', 0, 'opacity=".13"'); }
      if (night) { p = P(-4.5, 1.5, dL); ln += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="380" ry="260" fill="' + warm + '" opacity=".1" filter="url(#' + ID + '_b40)"/>'; }
      back += ln;

      // ---------- medical store building (facade d=7.2) ----------
      var ms = '';
      var wall = C('#F3EBDD'), wallS = C('#E2D2B8'), wallH = C('#FBF6EC');
      ms += FR(-2.55, 2.55, 0, 7, dM, wall);
      // balcony slab overhead (underside visible) + railing
      ms += poly([P(-2.7, 3.92, dM - 0.3), P(2.7, 3.92, dM - 0.3), P(2.55, 3.92, dM), P(-2.55, 3.92, dM)], C('#CDBDA2'));
      ms += FR(-2.7, 2.7, 3.92, 4.06, dM - 0.3, wallH);
      ms += FR(-2.7, 2.7, 3.92, 3.95, dM - 0.3, wallS);
      ms += FR(-2.7, 2.7, 4.06, 5.2, dM - 0.32, C('#E8D2B4'));
      ms += FR(-2.7, 2.7, 4.06, 4.1, dM - 0.32, C('#D2B994'));
      if (night) ms += R(560, -5, 1280, P(0, 4.06, dM - 0.3)[1] + 5, '#F6CF86', 0, 'opacity=".12"');
      // pillars (cream tile cladding)
      [[-2.55, -2.2], [2.2, 2.55]].forEach(function (pl, k) {
        ms += FR(pl[0], pl[1], FLH, 3.0, dM - 0.02, C('#F7F0E3'));
        var tl = '';
        for (var hy = FLH + 0.3; hy < 3.0; hy += 0.3) { p = P(pl[0], hy, dM - 0.02); q = P(pl[1], hy, dM - 0.02); tl += 'M' + n(p[0]) + ' ' + n(p[1]) + 'H' + n(q[0]); }
        ms += '<path d="' + tl + '" stroke="' + C('#E0D3BE') + '" stroke-width="2"/>';
        ms += SQ(k === 0 ? pl[1] : pl[0], FLH, 3.0, dM - 0.02, dM + 0.2, wallS);
      });
      // plinth (granite)
      var gran = C('#7C8492'), granH = C('#A3AAB6');
      ms += FR(-2.55, 2.55, 0, FLH, dM, gran);
      ms += FR(-2.55, 2.55, FLH - 0.035, FLH, dM - 0.03, granH);
      var gs = mulberry32(3), gsp = '';
      for (i = 0; i < 90; i++) { p = P(-2.5 + gs() * 5, 0.03 + gs() * 0.22, dM); gsp += '<rect x="' + n(p[0]) + '" y="' + n(p[1]) + '" width="' + n(3 + gs() * 6) + '" height="2"/>'; }
      ms += '<g fill="' + C('#C5CBD4') + '" opacity=".35">' + gsp + '</g>';
      back += ms;

      // ---------- interior (seen through the glass) ----------
      var it = '';
      var iw = night ? '#F7E6C6' : C('#E6DCCB'), iwS = night ? '#E8CFA2' : C('#D4C6AE');
      var CEIL = 2.9;
      it += FR(-2.25, 2.25, FLH, CEIL, dB, iw);
      it += HQ(-2.25, 2.25, CEIL, dM, dB, night ? '#F3DFBB' : C('#EFE7DA'));
      it += HQ(-2.25, 2.25, FLH, dM, dB, night ? '#E9D9BE' : C('#D8D2C8'));
      var fl = '';
      for (x = -2.2; x <= 2.2; x += 0.6) { p = P(x, FLH, dM); q = P(x, FLH, dB); fl += 'M' + n(p[0]) + ' ' + n(p[1]) + 'L' + n(q[0]) + ' ' + n(q[1]); }
      for (d = dM + 0.6; d < dB; d += 0.6) { p = P(-2.25, FLH, d); q = P(2.25, FLH, d); fl += 'M' + n(p[0]) + ' ' + n(p[1]) + 'H' + n(q[0]); }
      it += '<path d="' + fl + '" stroke="' + (night ? '#D6C29F' : C('#C3BCB0')) + '" stroke-width="1.5" fill="none"/>';
      it += SQ(-2.25, FLH, CEIL, dM, dB, iwS);
      it += SQ(2.25, FLH, CEIL, dM, dB, iwS);
      var wood = C('#B9875A'), woodS = C('#9A6B43'), woodD = C('#7A5233');
      var br = mulberry32(101), bx = '';
      var bc = function (c) { return night ? mix(c, '#FFE9C4', 0.12) : C(mix(c, '#8A8478', 0.12)); };
      it += FR(-2.0, 2.0, 1.15, 2.75, dB - 0.02, woodD);
      for (y = 1.2; y < 2.7; y += 0.31) {
        for (x = -1.96; x < 1.94;) {
          var bw = 0.07 + br() * 0.11, bhh = 0.12 + br() * 0.13;
          if (x + bw > 1.96) break;
          var col = bc(boxCols[Math.floor(br() * boxCols.length)]);
          bx += FR(x, x + bw, y, y + bhh, dB - 0.05, col);
          if (br() > 0.5) bx += FR(x, x + bw, y + bhh * 0.55, y + bhh * 0.7, dB - 0.05, mix(col, '#1F2A44', 0.25));
          x += bw + 0.008;
        }
        it += bx; bx = '';
        it += FR(-2.0, 2.0, y - 0.035, y, dB - 0.06, wood);
      }
      it += FR(-2.0, 2.0, 2.72, 2.78, dB - 0.06, wood);
      [-1, 1].forEach(function (sd) {
        var xw = sd * 2.25, xi = sd * 1.92;
        for (var hy = 0.6; hy < 2.7; hy += 0.34) {
          it += poly([P(xw, hy, dM + 0.1), P(xi, hy, dM + 0.1), P(xi, hy, dB - 0.1), P(xw, hy, dB - 0.1)], woodS);
          it += poly([P(xi, hy - 0.035, dM + 0.1), P(xi, hy, dM + 0.1), P(xi, hy, dB - 0.1), P(xi, hy - 0.035, dB - 0.1)], wood);
          for (var dz = dM + 0.15; dz < dB - 0.2;) {
            var dw = 0.09 + br() * 0.12, bh2 = 0.13 + br() * 0.14;
            var cc = bc(boxCols[Math.floor(br() * boxCols.length)]);
            it += poly([P(xi, hy, dz), P(xi, hy + bh2, dz), P(xi, hy + bh2, dz + dw), P(xi, hy, dz + dw)], cc);
            it += poly([P(xi, hy + bh2, dz + dw * 0.8), P(xi, hy + bh2, dz + dw), P(xi, hy, dz + dw), P(xi, hy, dz + dw * 0.8)], mix(cc, '#1F2A44', 0.2));
            dz += dw + 0.01;
          }
        }
      });
      var tl0 = P(-0.7, 2.84, dB - 0.03), tl1 = P(0.7, 2.79, dB - 0.03);
      it += R(tl0[0], tl0[1], tl1[0] - tl0[0], tl1[1] - tl0[1] + 2, night ? '#FFFFFF' : C('#F6F8FA'), 3);
      if (night) it += '<ellipse cx="' + n((tl0[0] + tl1[0]) / 2) + '" cy="' + n(tl0[1] + 4) + '" rx="190" ry="40" fill="#FFF6E0" opacity=".55" filter="url(#' + ID + '_b18)"/>';
      p = P(-1.55, 2.98, dB - 0.03);
      it += '<circle cx="' + n(p[0]) + '" cy="' + n(p[1] + 20) + '" r="16" fill="' + C('#FFFFFF') + '" stroke="' + C('#7A5233') + '" stroke-width="3"/><path d="M' + n(p[0]) + ' ' + n(p[1] + 20) + 'v-10M' + n(p[0]) + ' ' + n(p[1] + 20) + 'h7" stroke="' + C('#1F2A44') + '" stroke-width="2"/>';
      // small framed deity picture with marigold garland
      p = P(1.45, 2.95, dB - 0.03);
      it += R(p[0] - 18, p[1], 36, 44, C('#C9A15A'), 3) + R(p[0] - 13, p[1] + 5, 26, 34, C('#E8A04A'), 2) + '<circle cx="' + n(p[0]) + '" cy="' + n(p[1] + 18) + '" r="7" fill="' + C('#F6D9A0') + '"/>';
      it += '<path d="M' + n(p[0] - 18) + ' ' + n(p[1] + 2) + 'Q' + n(p[0]) + ' ' + n(p[1] + 34) + ' ' + n(p[0] + 18) + ' ' + n(p[1] + 2) + '" fill="none" stroke="' + C('#F29A1F') + '" stroke-width="5" stroke-dasharray="4 2"/>';
      // ceiling fan
      p = P(0, CEIL, 9.8); q = P(0, CEIL - 0.22, 9.8);
      it += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]) + '" stroke="' + C('#8A7A68') + '" stroke-width="4"/>';
      it += '<ellipse cx="' + n(q[0]) + '" cy="' + n(q[1] + 4) + '" rx="22" ry="9" fill="' + C('#A89784') + '"/>';
      it += '<path d="M' + n(q[0] - 20) + ' ' + n(q[1] + 4) + 'L' + n(q[0] - 190) + ' ' + n(q[1] + 18) + 'L' + n(q[0] - 185) + ' ' + n(q[1] + 2) + 'Z M' + n(q[0] + 20) + ' ' + n(q[1] + 4) + 'L' + n(q[0] + 150) + ' ' + n(q[1] - 6) + 'L' + n(q[0] + 158) + ' ' + n(q[1] + 8) + 'Z" fill="' + C('#C9BBA8') + '"/>';
      // glass counter
      var KT = FLH + 1.0;
      it += FR(-1.7, 2.25, FLH, FLH + 0.2, dK, woodS);
      it += FR(-1.7, 2.25, FLH + 0.2, KT - 0.06, dK, night ? '#CFE3E8' : C('#AFC3C9'));
      for (var sh = 0; sh < 2; sh++) {
        var hy0 = FLH + 0.24 + sh * 0.36;
        for (x = -1.62; x < 2.15;) {
          var w2 = 0.08 + br() * 0.1;
          it += FR(x, x + w2, hy0, hy0 + 0.1 + br() * 0.12, dK + 0.05, bc(boxCols[Math.floor(br() * boxCols.length)]));
          x += w2 + 0.015;
        }
        it += FR(-1.7, 2.25, hy0 - 0.02, hy0, dK + 0.05, C('#DCE6EA'));
      }
      it += FR(-1.7, 2.25, FLH + 0.2, KT - 0.06, dK - 0.01, '#FFFFFF', 0, 'opacity=".18"');
      it += FR(-1.7, 2.25, KT - 0.06, KT, dK - 0.02, wood);
      it += FR(-1.7, 2.25, KT - 0.06, KT - 0.04, dK - 0.02, woodD);
      // billing monitor (back) + printer + candy jar
      it += FR(0.92, 1.0, KT, KT + 0.19, dK + 0.1, C('#3A4356'));
      it += FR(0.62, 1.32, KT + 0.17, KT + 0.59, dK + 0.12, C('#2A3142'), 4);
      it += FR(0.68, 1.26, KT + 0.23, KT + 0.53, dK + 0.12, C('#323B4F'), 3);
      it += FR(1.5, 1.82, KT, KT + 0.15, dK + 0.05, C('#E9ECEF'), 3) + FR(1.54, 1.78, KT + 0.13, KT + 0.17, dK + 0.05, C('#FFFFFF'));
      it += FR(-1.2, -1.0, KT, KT + 0.23, dK + 0.05, C('#DCE7EC'), 5, 'opacity=".9"') + FR(-1.18, -1.02, KT + 0.02, KT + 0.15, dK + 0.05, C('#E36F5C'), 4) + FR(-1.19, -1.01, KT + 0.23, KT + 0.28, dK + 0.05, C('#1E9E62'), 2);
      if (!night) it += FR(-2.25, 2.25, FLH, CEIL, dM, '#1A2238', 0, 'opacity="' + (rain ? 0.1 : 0.18) + '"');
      else it += FR(-2.25, 2.25, FLH, CEIL, dM, warm, 0, 'opacity=".1"');
      back += it;

      // ---------- glass front, frames, stickers, shutter ----------
      var gl = '';
      var alu = C('#C9CFD8'), aluS = C('#97A0AD');
      var ref = night ? 0.07 : rain ? 0.14 : 0.2;
      gl += FR(-2.2, 2.2, FLH, OT, dM + 0.06, night ? '#FFF5DE' : '#D6EEF6', 0, 'opacity="' + (night ? 0.05 : 0.15) + '"');
      var rf = '';
      [[-2.1, 0.5], [-1.4, 0.18], [0.15, 0.4], [1.1, 0.16], [1.55, 0.35]].forEach(function (r) {
        rf += pth([P(r[0], FLH + 0.1, dM + 0.05), P(r[0] + r[1], FLH + 0.1, dM + 0.05), P(r[0] + r[1] + 0.9, OT - 0.05, dM + 0.05), P(r[0] + 0.9, OT - 0.05, dM + 0.05)]);
      });
      gl += '<clipPath id="' + ID + '_gclip">' + FR(-2.2, 2.2, FLH, OT, dM + 0.06, '#fff') + '</clipPath>';
      gl += '<path d="' + rf + '" fill="#FFFFFF" opacity="' + ref + '" clip-path="url(#' + ID + '_gclip)"/>';
      var TB = 2.18;
      [-2.2, -0.72, 0, 0.72, 2.2].forEach(function (mx) { gl += FR(mx - 0.04, mx + 0.04, FLH, OT, dM + 0.05, alu) + FR(mx + 0.02, mx + 0.04, FLH, OT, dM + 0.05, aluS); });
      gl += FR(-2.2, 2.2, TB, TB + 0.06, dM + 0.05, alu) + FR(-2.2, 2.2, TB, TB + 0.015, dM + 0.05, aluS);
      gl += FR(-2.2, 2.2, FLH, FLH + 0.14, dM + 0.05, alu) + FR(-2.2, 2.2, FLH, FLH + 0.03, dM + 0.05, aluS);
      gl += FR(-2.16, 2.16, TB + 0.08, TB + 0.28, dM + 0.05, night ? '#FFF9EE' : '#FFFFFF', 0, 'opacity="' + (night ? 0.85 : 0.78) + '"');
      p = P(0, TB + 0.135, dM + 0.05);
      gl += txt(p[0], p[1], 'MEDICINES  •  SURGICALS  •  BABY CARE  •  WELLNESS', 0.1 * sM, C('#177A4C'), 500, 'letter-spacing="3"');
      gl += FR(-0.17, -0.12, 0.85, 1.55, dM, C('#E9EDF2'), 3) + FR(0.12, 0.17, 0.85, 1.55, dM, C('#E9EDF2'), 3);
      gl += FR(-0.16, -0.12, 0.85, 1.55, dM, C('#AEB6C2'), 2) + FR(0.13, 0.17, 0.85, 1.55, dM, C('#AEB6C2'), 2);
      [-0.38, 0.38].forEach(function (sx) {
        p = P(sx, 1.78, dM);
        var rr2 = 0.14 * sM;
        gl += '<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" r="' + n(rr2) + '" fill="#FFFFFF" opacity=".92"/>';
        gl += cross(p[0], p[1], rr2 * 0.68, C('#1E9E62'));
        p = P(sx, 1.02, dM);
        gl += txt(p[0], p[1], sx < 0 ? 'PULL' : 'PUSH', 0.065 * sM, C('#FFFFFF'), 600, 'opacity=".8" letter-spacing="2"');
      });
      p = P(-0.53, 1.42, dM - 0.02);
      gl += '<path d="M' + n(p[0] + 8) + ' ' + n(p[1]) + 'L' + n(p[0] + 30) + ' ' + n(p[1] - 26) + 'L' + n(p[0] + 52) + ' ' + n(p[1]) + '" fill="none" stroke="' + C('#3A4356') + '" stroke-width="2"/>';
      gl += R(p[0] - 6, p[1], 72, 30, C('#FFFFFF'), 5) + R(p[0] - 6, p[1] + 24, 72, 6, C('#1E9E62'), 2);
      gl += txt(p[0] + 30, p[1] + 20, 'OPEN', 17, C('#C8161E'), 600);
      p = P(1.62, 1.5, dM);
      gl += R(p[0], p[1], 0.32 * sM, 0.4 * sM, C('#FFFFFF'), 6);
      gl += R(p[0] + 8, p[1] + 8, 0.32 * sM - 16, 0.32 * sM - 20, C('#1F2A44'), 3);
      var qr = mulberry32(55), qrs = '';
      for (i = 0; i < 6; i++) for (j = 0; j < 6; j++) if (qr() > 0.45) qrs += R(p[0] + 12 + i * 9, p[1] + 12 + j * 8, 7, 6, '#FFFFFF');
      gl += qrs + txt(p[0] + 0.16 * sM, p[1] + 0.37 * sM, 'SCAN &amp; PAY', 13, C('#1F2A44'), 600);
      // shutter rolled up into its box + bottom slat + guide rails
      var shu = C('#AEB6C2'), shuS = C('#8C95A3'), shuD = C('#6B7686');
      gl += FR(-2.2, -2.13, FLH, OT, dM - 0.02, shuS) + FR(2.13, 2.2, FLH, OT, dM - 0.02, shuS);
      gl += FR(-2.25, 2.25, OT - 0.1, OT + 0.02, dM - 0.03, shu);
      var rib = '';
      for (y = OT - 0.08; y < OT + 0.02; y += 0.035) { p = P(-2.25, y, dM - 0.03); q = P(2.25, y, dM - 0.03); rib += 'M' + n(p[0]) + ' ' + n(p[1]) + 'H' + n(q[0]); }
      gl += '<path d="' + rib + '" stroke="' + shuS + '" stroke-width="2"/>';
      gl += FR(-2.25, 2.25, OT - 0.12, OT - 0.09, dM - 0.03, shuD);
      [-1.2, 1.2].forEach(function (hx) { p = P(hx, OT - 0.12, dM - 0.05); gl += '<path d="M' + n(p[0] - 12) + ' ' + n(p[1]) + 'v8h24v-8" stroke="' + shuD + '" stroke-width="3" fill="none"/>'; });
      gl += FR(-2.3, 2.3, OT + 0.02, OT + 0.28, dM - 0.06, shuS, 4);
      gl += FR(-2.3, 2.3, OT + 0.02, OT + 0.06, dM - 0.06, shuD);
      gl += poly([P(-2.3, OT + 0.02, dM - 0.06), P(2.3, OT + 0.02, dM - 0.06), P(2.25, OT + 0.02, dM), P(-2.25, OT + 0.02, dM)], shuD);
      for (y = OT + 0.1; y < OT + 0.27; y += 0.055) { p = P(-2.28, y, dM - 0.06); q = P(2.28, y, dM - 0.06); gl += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'H' + n(q[0]) + '" stroke="' + shu + '" stroke-width="2"/>'; }
      // meter box + conduit on left pillar
      gl += FR(-2.5, -2.27, 1.7, 2.12, dM - 0.06, C('#E1E5EA'), 4) + FR(-2.47, -2.3, 1.86, 1.99, dM - 0.06, C('#3A4356'), 2);
      p = P(-2.385, 2.12, dM - 0.06); q = P(-2.385, 2.95, dM - 0.06);
      gl += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]) + '" stroke="' + C('#2A3142') + '" stroke-width="5"/>';
      back += gl;
      // daylight wash from upper left
      if (!night && !rain) back += R(0, 0, 2400, 1100, 'url(#' + ID + '_sun)');

      // ---------- signboard ----------
      var sb = '';
      var BX = 2.75, BB = 2.95, BT = 3.78;
      var b0 = P(-BX, BT, dS), b1 = P(BX, BB, dS);
      var bw0 = b1[0] - b0[0], bh0 = b1[1] - b0[1];
      if (night) sb += R(b0[0] - 30, b0[1] - 30, bw0 + 60, bh0 + 60, '#FFF1D2', 30, 'opacity=".32" filter="url(#' + ID + '_b40)"');
      if (!night) sb += R(b0[0] + 10, b1[1], bw0 - 20, 46, 'url(#' + ID + '_down)');
      sb += poly([P(-BX, BB, dS), P(BX, BB, dS), P(BX, BB, dM), P(-BX, BB, dM)], C('#3E4A60'));
      sb += R(b0[0], b0[1], bw0, bh0, C('#1A7F50'), 8);
      sb += R(b0[0] + 8, b0[1] + 8, bw0 - 16, bh0 - 16, night ? '#FFFDF6' : C('#FDFBF5'), 5);
      sb += R(b0[0] + 8, b0[1] + 8, bw0 - 16, (bh0 - 16) * 0.45, '#FFFFFF', 5, 'opacity="' + (night ? 0.0 : 0.3) + '"');
      var ecL = [b0[0] + 96, b0[1] + bh0 * 0.47], ecR = [b1[0] - 96, b0[1] + bh0 * 0.47], er = bh0 * 0.34;
      sb += '<circle cx="' + n(ecL[0]) + '" cy="' + n(ecL[1]) + '" r="' + n(er) + '" fill="' + C('#1E9E62') + '"/>';
      sb += '<circle cx="' + n(ecL[0]) + '" cy="' + n(ecL[1]) + '" r="' + n(er * 0.84) + '" fill="#FFFFFF"/>';
      sb += cross(ecL[0], ecL[1], er * 0.62, night ? '#22C27A' : C('#1E9E62'));
      sb += cross(ecL[0] - er * 0.04, ecL[1] - er * 0.04, er * 0.5, night ? '#7DFFC0' : mix(C('#1E9E62'), '#FFFFFF', 0.22));
      sb += '<circle cx="' + n(ecR[0]) + '" cy="' + n(ecR[1]) + '" r="' + n(er) + '" fill="' + C('#1E9E62') + '"/>';
      sb += txt(ecR[0], ecR[1] + er * 0.36, 'Rx', er * 1.05, '#FFFFFF', 600);
      var tx0 = ecL[0] + er + 28, tx1 = ecR[0] - er - 28, tcx = (tx0 + tx1) / 2, tAvail = tx1 - tx0;
      var fs = Math.min(bh0 * 0.4, tAvail / tw(name, 1));
      var nameY = b0[1] + bh0 * 0.49 + fs * 0.1;
      sb += txt(tcx, nameY, esc(name), fs, C('#C8161E'), 600);
      var bandY = b0[1] + bh0 * 0.6, bandH = bh0 * 0.2;
      var sub = 'Medical & General Store', sfs = bandH * 0.62, sw = tw(sub, sfs) + 70;
      sb += R(tcx - sw / 2, bandY, sw, bandH, C('#1E9E62'), n(bandH / 2));
      sb += txt(tcx, bandY + bandH * 0.72, esc(sub), sfs, '#FFFFFF', 500, 'letter-spacing="1"');
      sb += R(b0[0] + 8, b1[1] - 22, bw0 - 16, 14, C('#C8161E'), 0, 'opacity=".9"');
      // goose-neck sign lamps
      [-1.85, 0, 1.85].forEach(function (sx) {
        var a0 = P(sx, 3.84, dM), a1 = P(sx, 3.86, dS - 0.42);
        sb += '<path d="M' + n(a0[0]) + ' ' + n(a0[1]) + 'C' + n(a0[0]) + ' ' + n(a0[1] - 30) + ' ' + n(a1[0]) + ' ' + n(a1[1] - 20) + ' ' + n(a1[0]) + ' ' + n(a1[1]) + '" stroke="' + C('#3A4356') + '" stroke-width="5" fill="none"/>';
        sb += '<path d="M' + n(a1[0] - 15) + ' ' + n(a1[1] - 2) + 'h30l-5 16h-20Z" fill="' + C('#2A3142') + '"/>';
        if (night) {
          sb += '<path d="M' + n(a1[0] - 12) + ' ' + n(a1[1] + 14) + 'L' + n(a1[0] - 170) + ' ' + n(b1[1]) + 'H' + n(a1[0] + 170) + 'L' + n(a1[0] + 12) + ' ' + n(a1[1] + 14) + 'Z" fill="#FFF6DC" opacity=".14"/>';
          sb += '<ellipse cx="' + n(a1[0]) + '" cy="' + n(a1[1] + 14) + '" rx="20" ry="7" fill="#FFF8E6"/>';
        }
      });
      if (night) sb += '<circle cx="' + n(ecL[0]) + '" cy="' + n(ecL[1]) + '" r="' + n(er * 1.9) + '" fill="url(#' + ID + '_gcross)" opacity=".6"/>';
      back += sb;

      // ---------- LED green cross on a bracket beside the board ----------
      var dX = dM - 0.35, lc = P(3.0, 3.3, dX), ls = 0.27 * S(dX), led = '';
      led += '<path d="M' + n(b1[0] - 4) + ' ' + n(lc[1] - ls * 0.55) + 'H' + n(lc[0] - ls * 0.2) + 'M' + n(b1[0] - 4) + ' ' + n(lc[1] + ls * 0.55) + 'H' + n(lc[0] - ls * 0.2) + '" stroke="' + C('#4A5568') + '" stroke-width="6"/>';
      if (night) {
        led += '<circle cx="' + n(lc[0]) + '" cy="' + n(lc[1]) + '" r="' + n(ls * 3.4) + '" fill="url(#' + ID + '_gcross)"/>';
        led += cross(lc[0] + 3, lc[1] + 3, ls * 1.06, '#13803F');
        led += cross(lc[0], lc[1], ls * 1.04, '#26C27A');
        led += cross(lc[0], lc[1], ls * 0.94, '#7DFFC0');
        led += '<g filter="url(#' + ID + '_b6)">' + cross(lc[0], lc[1], ls * 0.84, '#E6FFF1') + '</g>';
      } else {
        led += cross(lc[0] + 5, lc[1] + 5, ls, C('#156B44'));
        led += cross(lc[0], lc[1], ls, C('#1E9E62'));
        var dots = '';
        for (i = -2; i <= 2; i++) for (j = -2; j <= 2; j++) if (i === 0 || j === 0) dots += '<circle cx="' + n(lc[0] + i * ls * 0.36) + '" cy="' + n(lc[1] + j * ls * 0.36) + '" r="3.2"/>';
        led += '<g fill="' + C('#5FD39A') + '">' + dots + '</g>';
      }
      back += led;

      // ---------- steps ----------
      var stp = '', stone = C('#B9B4AC'), stoneT = C('#DAD6CE'), stoneS = C('#8F8A82');
      var sx0 = -1.0, sx1 = 1.0;
      stp += poly([P(sx0, 0.2, dM), P(sx1, 0.2, dM), P(sx1, 0.2, dM - 0.32), P(sx0, 0.2, dM - 0.32)], stoneT);
      stp += FR(sx0, sx1, 0, 0.2, dM - 0.32, stone);
      stp += FR(sx0, sx1, 0.18, 0.2, dM - 0.32, stoneT);
      stp += poly([P(sx0 - 0.1, 0.1, dM - 0.32), P(sx1 + 0.1, 0.1, dM - 0.32), P(sx1 + 0.1, 0.1, dM - 0.64), P(sx0 - 0.1, 0.1, dM - 0.64)], stoneT);
      stp += FR(sx0 - 0.1, sx1 + 0.1, 0, 0.1, dM - 0.64, stone);
      stp += FR(sx0 - 0.1, sx1 + 0.1, 0.085, 0.1, dM - 0.64, stoneT);
      stp += FR(sx0, sx1, 0.1, 0.13, dM - 0.33, stoneS, 0, 'opacity=".5"');
      if (!night) stp += poly([P(sx1 + 0.1, 0, dM - 0.64), P(sx1 + 0.4, 0, dM - 0.64), P(sx1 + 0.3, 0, dM), P(sx1, 0, dM)], '#1F2A44', 'opacity=".12"');
      back += stp;
      back += R(0, P(0, 0, dM)[1] - 2, 2400, 34, 'url(#' + ID + '_down)');

      // ---------- night light spill from the shop ----------
      if (night) {
        back += poly([P(-2.2, FLH, dM), P(2.2, FLH, dM), P(3.6, 0, 4.3), P(-3.6, 0, 4.3)], 'url(#' + ID + '_spill)');
        p = P(0, 0.2, dM - 0.4);
        back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="640" ry="110" fill="' + warm + '" opacity=".22" filter="url(#' + ID + '_b40)"/>';
        p = P(3.0, 0, 6.2);
        back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="170" ry="34" fill="#3BF29A" opacity=".14" filter="url(#' + ID + '_b18)"/>';
      }

      // ---------- rain: wet ground, reflections, puddles ----------
      if (rain) {
        back += R(0, yF, 2400, 1350 - yF, 'url(#' + ID + '_wet)');
        var refl = '';
        if (night) {
          refl += poly([P(-2.1, 0, dM - 0.7), P(2.1, 0, dM - 0.7), P(2.6, 0, 4.0), P(-2.6, 0, 4.0)], 'url(#' + ID + '_refw)', 'opacity=".55"');
          p = P(3.0, 0, dM - 0.4);
          refl += R(p[0] - 36, p[1], 72, 1290 - p[1], 'url(#' + ID + '_refg)', 0, 'filter="url(#' + ID + '_b6)"');
          p = P(-0.2, 0, dM - 0.4);
          refl += R(p[0] - 520, p[1], 1040, 120, 'url(#' + ID + '_refs)', 0, 'opacity=".25" filter="url(#' + ID + '_b18)"');
          p = P(4.6, 0, dR - 0.1);
          refl += R(p[0] - 160, p[1], 320, 230, 'url(#' + ID + '_refs)', 0, 'opacity=".45" filter="url(#' + ID + '_b18)"');
          p = P(-4.5, 0, dL - 0.4);
          refl += R(p[0] - 200, p[1], 400, 230, 'url(#' + ID + '_refw)', 0, 'opacity=".3" filter="url(#' + ID + '_b18)"');
        } else {
          refl += poly([P(-2.1, 0, dM - 0.7), P(2.1, 0, dM - 0.7), P(2.5, 0, 4.0), P(-2.5, 0, 4.0)], 'url(#' + ID + '_refs)', 'opacity=".35"');
          p = P(3.0, 0, dM - 0.4);
          refl += R(p[0] - 30, p[1], 60, 200, 'url(#' + ID + '_refg)', 0, 'opacity=".4" filter="url(#' + ID + '_b6)"');
        }
        back += refl;
        var shr = mulberry32(64), shs = '';
        for (i = 0; i < 70; i++) { d = 4.05 + shr() * 3.0; x = -5.5 + shr() * 11; p = P(x, 0, d); shs += 'M' + n(p[0]) + ' ' + n(p[1]) + 'h' + n((0.2 + shr() * 0.6) * S(d)); }
        back += '<path d="' + shs + '" stroke="' + (night ? '#C9D6F0' : '#EEF2F6') + '" stroke-width="2" opacity=".2" stroke-linecap="round"/>';
        var pud = [[-1.35, 4.5, 1.15, 0.7], [1.45, 4.35, 1.0, 0.6], [-0.2, 6.0, 1.3, 0.55], [3.5, 5.4, 1.1, 0.5], [-5.6, 5.6, 1.5, 0.6], [5.6, 4.6, 1.2, 0.6]];
        var ps = '';
        pud.forEach(function (u) {
          var c0 = P(u[0], 0, u[1]), sc = S(u[1]);
          var rx = u[2] * sc / 2, ry = (P(u[0], 0, u[1] - u[3] / 2)[1] - P(u[0], 0, u[1] + u[3] / 2)[1]) / 2;
          ps += '<ellipse cx="' + n(c0[0]) + '" cy="' + n(c0[1]) + '" rx="' + n(rx + 4) + '" ry="' + n(ry + 2) + '" fill="#0A1222" opacity=".25"/>';
          ps += '<ellipse cx="' + n(c0[0]) + '" cy="' + n(c0[1]) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="url(#' + ID + '_pud)" opacity="' + (night ? 0.85 : 0.7) + '"/>';
          var refC = night ? (Math.abs(u[0]) < 2.6 ? warm : (u[0] > 2.6 ? '#3BF29A' : '#8FA6D6')) : '#FFFFFF';
          ps += '<ellipse cx="' + n(c0[0] - rx * 0.12) + '" cy="' + n(c0[1] - ry * 0.1) + '" rx="' + n(rx * 0.55) + '" ry="' + n(ry * 0.4) + '" fill="' + refC + '" opacity="' + (night ? 0.3 : 0.35) + '" filter="url(#' + ID + '_b6)"/>';
          ps += '<path d="M' + n(c0[0] - rx * 0.8) + ' ' + n(c0[1] - ry * 0.5) + 'Q' + n(c0[0]) + ' ' + n(c0[1] - ry * 1.05) + ' ' + n(c0[0] + rx * 0.8) + ' ' + n(c0[1] - ry * 0.5) + '" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".35"/>';
          for (var rI = 0; rI < 4; rI++) {
            var rxx = c0[0] + (shr() - 0.5) * rx * 1.2, ryy = c0[1] + (shr() - 0.5) * ry * 0.8, rs = (0.6 + shr()) * sc / 400;
            ps += '<ellipse cx="' + n(rxx) + '" cy="' + n(ryy) + '" rx="' + n(12 * rs) + '" ry="' + n(3.5 * rs) + '" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity=".5"/>';
            ps += '<ellipse cx="' + n(rxx) + '" cy="' + n(ryy) + '" rx="' + n(26 * rs) + '" ry="' + n(7 * rs) + '" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".25"/>';
          }
        });
        back += ps;
        // drips from the signboard, shutter box and awning edges
        var drr = mulberry32(88), drp = '';
        for (i = 0; i < 26; i++) { x = b0[0] + 20 + drr() * (bw0 - 40); y = b1[1] + 12 + drr() * 110; drp += 'M' + n(x) + ' ' + n(y) + 'v' + n(10 + drr() * 18); }
        for (i = 0; i < 18; i++) { x = drr() * (vx1 - 10); y = vy1 + 20 + drr() * 240; drp += 'M' + n(x) + ' ' + n(y) + 'v' + n(12 + drr() * 18); }
        back += '<path d="' + drp + '" stroke="#DDE8F5" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>';
        // tiny splash rings on the footpath
        var spl = '';
        for (i = 0; i < 70; i++) { d = 3.95 + shr() * 3.0; x = -6 + shr() * 12; p = P(x, 0, d); var ss = S(d) / 450; spl += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n(9 * ss) + '" ry="' + n(2.4 * ss) + '"/>'; }
        back += '<g fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".4">' + spl + '</g>';
        // far rain
        var rr = mulberry32(123), rb = '';
        for (i = 0; i < 520; i++) { x = rr() * 2600 - 150; y = rr() * 1350; var L = 26 + rr() * 40; rb += 'M' + n(x) + ' ' + n(y) + 'l' + n(L * 0.2) + ' ' + n(L); }
        back += '<path d="' + rb + '" stroke="' + (night ? '#AFC2E6' : '#F4F7FA') + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (night ? 0.3 : 0.38) + '"/>';
        back += R(0, 560, 2400, 420, night ? '#40507A' : '#E4E8EE', 0, 'opacity=".1" filter="url(#' + ID + '_b40)"');
      }

      // ---------- MID: pole, wires, scooter, plant, A-frame ----------
      var pd = 6.0, pX = P(3.6, 0, pd), pw = 0.24 * S(pd);
      mid += '<ellipse cx="' + n(pX[0]) + '" cy="' + n(pX[1]) + '" rx="' + n(pw * 1.3) + '" ry="10" fill="#0B1020" opacity=".25"/>';
      mid += R(pX[0] - pw / 2, -20, pw, pX[1] + 20, C('#B7B2A9'));
      mid += R(pX[0] + pw * 0.15, -20, pw * 0.35, pX[1] + 20, C('#9C978E'));
      mid += R(pX[0] - pw / 2, pX[1] - 0.9 * S(pd), pw, 0.25 * S(pd), C('#F3EBDD')) + R(pX[0] - pw / 2, pX[1] - 0.65 * S(pd), pw, 0.25 * S(pd), C('#2E333D')) + R(pX[0] - pw / 2, pX[1] - 0.4 * S(pd), pw, 0.25 * S(pd), C('#F3EBDD'));
      p = P(3.6, 2.0, pd - 0.13);
      mid += R(p[0] - pw * 0.55, p[1], pw * 1.1, 0.5 * S(pd), C('#F6F1E4'), 2, 'transform="rotate(-2 ' + n(p[0]) + ' ' + n(p[1]) + ')"');
      mid += R(p[0] - pw * 0.4, p[1] + 14, pw * 0.8, 10, C('#C8161E'), 1) + R(p[0] - pw * 0.4, p[1] + 34, pw * 0.7, 6, C('#6B7686')) + R(p[0] - pw * 0.4, p[1] + 48, pw * 0.6, 6, C('#6B7686')) + R(p[0] - pw * 0.4, p[1] + 62, pw * 0.75, 6, C('#6B7686'));
      p = P(3.6, 2.65, pd - 0.13);
      mid += R(p[0] - pw * 0.5, p[1], pw, 0.36 * S(pd), C('#F2D16B'), 2, 'transform="rotate(3 ' + n(p[0]) + ' ' + n(p[1]) + ')"');
      mid += R(p[0] - pw * 0.35, p[1] + 16, pw * 0.7, 8, C('#1F2A44')) + R(p[0] - pw * 0.35, p[1] + 34, pw * 0.5, 6, C('#1F2A44'));
      p = P(3.6, 3.35, pd - 0.15);
      mid += R(p[0] - pw * 0.7, p[1], pw * 1.4, 0.32 * S(pd), C('#7D8794'), 4) + R(p[0] - pw * 0.7, p[1], pw * 1.4, 10, C('#9AA3AF'), 4);
      var coil = '';
      for (i = 0; i < 4; i++) coil += '<ellipse cx="' + n(p[0] - 6 + i * 4) + '" cy="' + n(p[1] - 60 - i * 3) + '" rx="' + n(46 - i * 4) + '" ry="' + n(26 - i * 2) + '" fill="none" stroke="' + C('#1F2633') + '" stroke-width="3"/>';
      mid += coil;
      // overhead wires: kept above the signboard (lowest point < y 90 across the shop)
      var wc = night ? '#0A0F1C' : C('#232A38'), wr2 = '';
      var wspec = [[-30, 20, 60, 3.5], [-10, 50, 50, 3], [10, 70, 40, 3], [-50, 0, 70, 2.5], [20, 30, 50, 3.5], [-20, 90, 30, 2.5]];
      wspec.forEach(function (ws) { wr2 += wire(pX[0], ws[0], -30, ws[1], ws[2], wc, ws[3], 0.92); });
      wr2 += wire(pX[0], 40, 2440, 20, 26, wc, 3, 0.9) + wire(pX[0], 90, 2440, 110, 20, wc, 2.5, 0.9);
      p = P(2.5, 3.86, dM);
      wr2 += wire(pX[0], 70, p[0], p[1] - 4, 22, wc, 2.5, 0.9);
      p = P(2.9, 3.4, dR);
      wr2 += wire(pX[0], 110, p[0] + 30, 175, 16, wc, 2.2, 0.85);
      wr2 += wire(-30, 140, P(-3.2, 3.3, dL)[0], P(-3.2, 3.3, dL)[1], 30, wc, 2.2, 0.85);
      mid += wr2;
      if (!night && !rain) {
        var bd = '';
        [2010, 2052, 2140].forEach(function (bxx, k) {
          var byy = wireY(pX[0], 10, -30, 70, 40, bxx);
          var fl0 = k === 1 ? -1 : 1;
          bd += '<g transform="translate(' + n(bxx) + ' ' + n(byy + 1) + ') scale(' + fl0 + ' 1)"><path d="M-12 0c2-12 10-18 20-16c6-6 14-4 15 1c-5 1-7 3-8 6c0 7-8 11-16 10c-5 0-9-1-11-1Z" fill="' + C('#2A3142') + '"/><path d="M-12 -1l-10 4" stroke="' + C('#2A3142') + '" stroke-width="4"/></g>';
        });
        mid += bd;
      }
      // potted plant beside the steps
      var pt = P(1.32, 0, dM - 0.22), pks = S(dM - 0.22);
      var potW = 0.36 * pks, potH = 0.4 * pks;
      mid += '<ellipse cx="' + n(pt[0]) + '" cy="' + n(pt[1]) + '" rx="' + n(potW * 0.7) + '" ry="7" fill="#0B1020" opacity=".25"/>';
      mid += '<path d="M' + n(pt[0] - potW / 2) + ' ' + n(pt[1] - potH) + 'H' + n(pt[0] + potW / 2) + 'L' + n(pt[0] + potW * 0.36) + ' ' + n(pt[1]) + 'H' + n(pt[0] - potW * 0.36) + 'Z" fill="' + C('#C0714F') + '"/>';
      mid += '<path d="M' + n(pt[0] + potW * 0.15) + ' ' + n(pt[1] - potH) + 'H' + n(pt[0] + potW / 2) + 'L' + n(pt[0] + potW * 0.36) + ' ' + n(pt[1]) + 'H' + n(pt[0] + potW * 0.1) + 'Z" fill="' + C('#A55C3E') + '"/>';
      mid += R(pt[0] - potW * 0.56, pt[1] - potH - 10, potW * 1.12, 16, C('#CF8462'), 5);
      var lr = mulberry32(17), lv = '';
      var leafC = [C('#3F7F4A'), C('#5A9A58'), C('#7BC18E')];
      for (i = 0; i < 24; i++) {
        var la = -Math.PI * (0.08 + lr() * 0.84), ll = (0.18 + lr() * 0.32) * pks;
        var lx = pt[0] + Math.cos(la) * ll * 0.9, ly = pt[1] - potH - 6 + Math.sin(la) * ll;
        lv += '<ellipse cx="' + n(lx) + '" cy="' + n(ly) + '" rx="' + n(ll * 0.32) + '" ry="' + n(ll * 0.14) + '" transform="rotate(' + n(la * 180 / Math.PI) + ' ' + n(lx) + ' ' + n(ly) + ')" fill="' + leafC[i % 3] + '"/>';
      }
      mid += lv;
      // A-frame chalk board
      var af = P(1.95, 0, 6.45), afs = S(6.45);
      var afw = 0.5 * afs, afh = 0.85 * afs;
      mid += '<ellipse cx="' + n(af[0]) + '" cy="' + n(af[1]) + '" rx="' + n(afw * 0.75) + '" ry="9" fill="#0B1020" opacity=".25"/>';
      mid += '<path d="M' + n(af[0] - afw / 2) + ' ' + n(af[1]) + 'L' + n(af[0] - afw / 2 + 14) + ' ' + n(af[1] - afh) + 'H' + n(af[0] + afw / 2 - 14) + 'L' + n(af[0] + afw / 2) + ' ' + n(af[1]) + '" fill="none" stroke="' + C('#7A5233') + '" stroke-width="10" stroke-linejoin="round"/>';
      mid += R(af[0] - afw / 2 + 14, af[1] - afh + 6, afw - 28, afh * 0.8, C('#2E3A33'), 6);
      mid += cross(af[0], af[1] - afh + 0.16 * afs, 0.07 * afs, C('#3FCB86'));
      mid += txt(af[0], af[1] - afh + 0.36 * afs, 'OPEN', 0.085 * afs, C('#F3EBDD'), 600);
      mid += txt(af[0], af[1] - afh + 0.47 * afs, '8 AM – 10 PM', 0.05 * afs, C('#F2D16B'), 500);
      mid += txt(af[0], af[1] - afh + 0.58 * afs, 'दवाइयाँ उपलब्ध', 0.046 * afs, C('#DCE1E8'), 400);
      // scooter parked left of the steps
      var scd = 6.6, sc0 = P(-3.0, 0, scd), sck = S(scd) / 100;
      if (!night) mid += poly([[sc0[0] + 20 * sck, sc0[1]], [sc0[0] + 200 * sck, sc0[1]], [sc0[0] + 250 * sck, sc0[1] - 14 * sck], [sc0[0] + 70 * sck, sc0[1] - 14 * sck]], '#1F2A44', 'opacity=".14"');
      mid += scooter(sc0[0], sc0[1], sck, C, night);
      if (night) mid += '<ellipse cx="' + n(sc0[0] + 330) + '" cy="' + n(sc0[1] - 150) + '" rx="260" ry="160" fill="' + warm + '" opacity=".08" filter="url(#' + ID + '_b40)"/>';

      // ---------- FORE: near rain ----------
      if (rain) {
        var fr = mulberry32(321), f1 = '', f2 = '';
        for (i = 0; i < 260; i++) { x = fr() * 2700 - 200; y = fr() * 1400 - 60; var L2 = 60 + fr() * 110; f1 += 'M' + n(x) + ' ' + n(y) + 'l' + n(L2 * 0.2) + ' ' + n(L2); }
        for (i = 0; i < 90; i++) { x = fr() * 2700 - 200; y = fr() * 1400 - 60; var L3 = 120 + fr() * 160; f2 += 'M' + n(x) + ' ' + n(y) + 'l' + n(L3 * 0.2) + ' ' + n(L3); }
        fore += '<path d="' + f1 + '" stroke="' + (night ? '#C3D3F2' : '#FFFFFF') + '" stroke-width="2.2" stroke-linecap="round" opacity="' + (night ? 0.32 : 0.4) + '"/>';
        fore += '<path d="' + f2 + '" stroke="' + (night ? '#D5E1F7' : '#FFFFFF') + '" stroke-width="3.5" stroke-linecap="round" opacity=".16"/>';
        if (night) {
          var wl = '';
          for (i = 0; i < 120; i++) { x = 650 + fr() * 1100; y = 260 + fr() * 900; var L4 = 40 + fr() * 70; wl += 'M' + n(x) + ' ' + n(y) + 'l' + n(L4 * 0.2) + ' ' + n(L4); }
          fore += '<path d="' + wl + '" stroke="#FFE2A8" stroke-width="2" stroke-linecap="round" opacity=".32"/>';
          var gl2 = '';
          for (i = 0; i < 40; i++) { x = lc[0] - 200 + fr() * 400; y = lc[1] - 120 + fr() * 420; var L5 = 30 + fr() * 50; gl2 += 'M' + n(x) + ' ' + n(y) + 'l' + n(L5 * 0.2) + ' ' + n(L5); }
          fore += '<path d="' + gl2 + '" stroke="#9BFFD0" stroke-width="2" stroke-linecap="round" opacity=".35"/>';
        }
      }

      return { back: back, mid: mid, front: front, fore: fore };
    }
  };
})();
