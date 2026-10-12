// street: a busy Indian market street. Camera stands on the near footpath (1.1 m high) looking
// across the road at a row of shops; a side lane (gali) and hazy skyline give depth.
// World 2400x1350, feet on the near footpath at y=1250 (4 m from camera).
(function () {
  'use strict';
  var ID = 'street';

  // ---------- utils ----------
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
  function tw(s, fs) {
    var w = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], c = s.charCodeAt(i);
      if (ch === ' ') w += 0.28;
      else if ('iIl.,:;|!\'j'.indexOf(ch) >= 0) w += 0.3;
      else if ('mwMW'.indexOf(ch) >= 0) w += 0.88;
      else if (ch >= 'A' && ch <= 'Z') w += 0.72;
      else if (ch >= '0' && ch <= '9') w += 0.63;
      else if (c >= 0x900 && c < 0x980) w += 0.46;
      else w += 0.6;
    }
    return w * fs;
  }

  // ---------- camera ----------
  var CX = 1200, CAM = 1.1, FL = 1788, HZ = 1250 - CAM * 447;
  function P(x, h, d) { return [CX + x * FL / d, HZ - (h - CAM) * FL / d]; }
  function S(d) { return FL / d; }
  function pth(pts) { return 'M' + pts.map(function (p) { return n(p[0]) + ' ' + n(p[1]); }).join('L') + 'Z'; }
  function poly(pts, fill, a) { return '<path d="' + pth(pts) + '" fill="' + fill + '"' + (a ? ' ' + a : '') + '/>'; }
  function R(x, y, w, h, fill, rx, a) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' + (a ? ' ' + a : '') + '/>'; }
  function FR(x0, x1, h0, h1, d, fill, rx, a) { var p = P(x0, h1, d), q = P(x1, h0, d); return R(p[0], p[1], q[0] - p[0], q[1] - p[1], fill, rx, a); }
  function HQ(x0, x1, h, d0, d1, fill, a) { return poly([P(x0, h, d0), P(x1, h, d0), P(x1, h, d1), P(x0, h, d1)], fill, a); }
  function SQ(x, h0, h1, d0, d1, fill, a) { return poly([P(x, h0, d0), P(x, h1, d0), P(x, h1, d1), P(x, h0, d1)], fill, a); }
  function txt(x, y, s, fs, fill, w, a) { return '<text x="' + n(x) + '" y="' + n(y) + '" font-family="Poppins" font-weight="' + (w || 500) + '" font-size="' + n(fs) + '" fill="' + fill + '" text-anchor="middle"' + (a ? ' ' + a : '') + '>' + s + '</text>'; }
  function qcurve(x1, y1, x2, y2, sag) { return { x1: x1, y1: y1, x2: x2, y2: y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 + sag * 2 }; }
  function qpt(c, t) { var u = 1 - t; return [u * u * c.x1 + 2 * u * t * c.cx + t * t * c.x2, u * u * c.y1 + 2 * u * t * c.cy + t * t * c.y2]; }
  function qpath(c, col, w, op) { return '<path d="M' + n(c.x1) + ' ' + n(c.y1) + 'Q' + n(c.cx) + ' ' + n(c.cy) + ' ' + n(c.x2) + ' ' + n(c.y2) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  function cloud(cx, cy, w, base, shade, rnd) {
    var k = 5 + Math.floor(rnd() * 3), hh = w * 0.3, i, x, r, pts = [];
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

  // ---------- vehicles (side views facing left, local cm, ground y=0) ----------
  function wheel(cx, cy, r, tire, rim, hub) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + tire + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + n(r * 0.62) + '" fill="' + rim + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + n(r * 0.25) + '" fill="' + hub + '"/>';
  }
  function auto(X, Y, k, C, night) {
    var body = C('#3E8E5E'), bodyS = C('#2E7049'), bodyH = C('#6DB386'), roof = C('#E7B04A'), roofS = C('#C99133'), roofH = C('#F2D16B'),
      dark = C('#1F2633'), seat = C('#7A5233'), seatS = C('#5E3E26'), tire = C('#22262E'), rim = C('#AEB6C2'), chrome = C('#DCE1E8');
    var g = '<g transform="translate(' + n(X) + ' ' + n(Y) + ') scale(' + k.toFixed(4) + ')">';
    g += '<ellipse cx="135" cy="0" rx="140" ry="8" fill="#0B1020" opacity="' + (night ? 0.45 : 0.3) + '"/>';
    g += wheel(200, -21, 21, tire, rim, C('#5B6576'));
    // cabin interior (dark) + seats
    g += R(40, -146, 196, 66, dark);
    g += '<path d="M138 -132 L226 -132 L226 -92 L140 -92 Z" fill="' + seat + '"/><path d="M138 -96 L226 -96 L226 -84 L134 -84 Z" fill="' + seatS + '"/>';
    g += '<path d="M58 -108 L104 -108 L104 -96 L58 -96Z" fill="' + seat + '"/>';
    g += '<path d="M44 -128 L66 -134" stroke="' + chrome + '" stroke-width="4" stroke-linecap="round"/>';
    // lower body with rear arch
    g += '<path d="M40 -30 L170 -30 A30 30 0 0 1 230 -30 L252 -30 C260 -30 264 -40 264 -52 L264 -86 L40 -86 Z" fill="' + body + '"/>';
    g += '<path d="M40 -40 L168 -40 M232 -40 L262 -40" stroke="' + bodyS + '" stroke-width="5"/>';
    g += '<path d="M44 -84 L262 -84" stroke="' + bodyH + '" stroke-width="4"/>';
    // rear closed panel
    g += R(230, -150, 34, 66, roof);
    g += R(252, -150, 12, 66, roofS);
    g += R(254, -80, 8, 14, night ? '#E04A3A' : C('#C8332B'), 2);
    // front cowl (nose) + front wheel
    g += wheel(28, -21, 21, tire, rim, C('#5B6576'));
    g += '<path d="M48 -24 C24 -22 6 -36 4 -60 C2 -86 10 -106 22 -114 L46 -114 L50 -24 Z" fill="' + body + '"/>';
    g += '<path d="M10 -50 C10 -76 16 -98 26 -110 L32 -110 C22 -96 16 -76 16 -50Z" fill="' + bodyH + '" opacity=".7"/>';
    g += '<path d="M48 -24 C38 -24 30 -28 26 -34 L50 -34Z" fill="' + bodyS + '"/>';
    g += '<circle cx="10" cy="-74" r="7" fill="' + (night ? '#E8E4D2' : C('#F3F1E8')) + '"/><circle cx="10" cy="-74" r="9" fill="none" stroke="' + chrome + '" stroke-width="2"/>';
    g += '<path d="M4 -44 L30 -44" stroke="' + chrome + '" stroke-width="4" stroke-linecap="round"/>';
    // windshield + struts
    g += '<path d="M22 -114 L28 -150 L46 -150 L46 -114Z" fill="' + C('#3A4A63') + '"/>';
    g += '<path d="M26 -120 L31 -146" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="3"/>';
    g += '<path d="M118 -86 L118 -150" stroke="' + roofS + '" stroke-width="5"/>';
    g += '<path d="M28 -140 L12 -146" stroke="' + chrome + '" stroke-width="2"/><ellipse cx="10" cy="-148" rx="6" ry="4" fill="' + dark + '"/>';
    // canopy roof
    g += '<path d="M18 -146 C20 -168 32 -178 54 -178 L244 -178 C258 -178 266 -170 266 -156 L266 -146 Z" fill="' + roof + '"/>';
    g += '<path d="M24 -160 C30 -170 40 -174 56 -174 L244 -174 C254 -174 260 -168 262 -160Z" fill="' + roofH + '" opacity=".6"/>';
    g += R(18, -150, 248, 6, roofS);
    // number plate + stripe
    g += R(236, -70, 18, 10, C('#F4F1E2'), 1.5);
    g += '<path d="M60 -60 L164 -60" stroke="' + roof + '" stroke-width="4" opacity=".8"/>';
    g += '</g>';
    return g;
  }
  function bike(X, Y, k, C, col, night) {
    var c = C(col), cS = C(mix(col, '#1F2A44', 0.3)), cH = C(mix(col, '#FFFFFF', 0.35)), dark = C('#1F2633'), tire = C('#22262E'), rim = C('#8C96A4'), chrome = C('#DCE1E8'), grey = C('#5B6576');
    var g = '<g transform="translate(' + n(X) + ' ' + n(Y) + ') scale(' + k.toFixed(4) + ')">';
    g += '<ellipse cx="100" cy="0" rx="108" ry="6" fill="#0B1020" opacity="' + (night ? 0.45 : 0.28) + '"/>';
    function sp(cx) {
      var s = '<circle cx="' + cx + '" cy="-30" r="30" fill="' + tire + '"/><circle cx="' + cx + '" cy="-30" r="22" fill="none" stroke="' + rim + '" stroke-width="3"/>';
      for (var a = 0; a < 6; a++) { var an = a * Math.PI / 3; s += '<path d="M' + cx + ' -30 l' + n(Math.cos(an) * 21) + ' ' + n(Math.sin(an) * 21) + '" stroke="' + rim + '" stroke-width="2.5"/>'; }
      return s + '<circle cx="' + cx + '" cy="-30" r="6" fill="' + grey + '"/>';
    }
    g += sp(168) + sp(34);
    g += '<path d="M60 -50 L118 -40 L170 -34" stroke="' + grey + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
    g += '<path d="M76 -66 L122 -66 L126 -38 L84 -34 C76 -40 74 -56 76 -66Z" fill="' + grey + '"/>';
    g += '<path d="M84 -58 L118 -58" stroke="' + C('#7B8695') + '" stroke-width="4"/>';
    g += '<path d="M112 -44 L188 -40 C194 -40 196 -32 190 -31 L112 -34Z" fill="' + chrome + '"/>';
    g += '<path d="M56 -112 L36 -30" stroke="' + chrome + '" stroke-width="7" stroke-linecap="round"/>';
    g += '<path d="M14 -46 C18 -64 46 -66 56 -50 L50 -48 C42 -58 24 -58 20 -44Z" fill="' + c + '"/>';
    g += '<path d="M118 -74 L176 -74 C188 -74 196 -68 198 -60 L170 -58 L120 -62Z" fill="' + c + '"/>';
    g += '<path d="M104 -82 L170 -84 C176 -84 178 -76 172 -74 L106 -72Z" fill="' + dark + '"/>';
    g += '<path d="M70 -90 C74 -102 104 -104 116 -92 C120 -84 116 -74 106 -72 L80 -70 C70 -72 66 -82 70 -90Z" fill="' + c + '"/>';
    g += '<path d="M76 -92 C84 -100 102 -100 110 -94" fill="none" stroke="' + cH + '" stroke-width="4" stroke-linecap="round"/>';
    g += '<path d="M80 -72 L106 -72 L104 -66 L82 -66Z" fill="' + cS + '"/>';
    g += '<path d="M54 -116 L80 -120" stroke="' + dark + '" stroke-width="5" stroke-linecap="round"/>';
    g += '<path d="M64 -118 L60 -134" stroke="' + chrome + '" stroke-width="2.4"/><ellipse cx="59" cy="-137" rx="8" ry="5" fill="' + dark + '"/>';
    g += '<circle cx="48" cy="-98" r="11" fill="' + c + '"/><circle cx="45" cy="-98" r="7" fill="' + (night ? '#D9D6CA' : C('#EEF3F7')) + '"/>';
    g += R(190, -66, 7, 8, night ? '#E04A3A' : C('#C8332B'), 2);
    g += '<path d="M100 -34 L108 -4" stroke="' + grey + '" stroke-width="3" stroke-linecap="round"/>';
    g += '</g>';
    return g;
  }
  function cycle(X, Y, k, C) {
    var fr = C('#2B3242'), tire = C('#1F2633'), rim = C('#AEB6C2'), seat = C('#3A2A22');
    var g = '<g transform="translate(' + n(X) + ' ' + n(Y) + ') scale(' + k.toFixed(4) + ')">';
    g += '<ellipse cx="88" cy="0" rx="92" ry="5" fill="#0B1020" opacity=".25"/>';
    [34, 142].forEach(function (cx) {
      g += '<circle cx="' + cx + '" cy="-34" r="33" fill="none" stroke="' + tire + '" stroke-width="6"/><circle cx="' + cx + '" cy="-34" r="28" fill="none" stroke="' + rim + '" stroke-width="2"/>';
      for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; g += '<path d="M' + cx + ' -34 l' + n(Math.cos(an) * 28) + ' ' + n(Math.sin(an) * 28) + '" stroke="' + rim + '" stroke-width="1.2"/>'; }
    });
    g += '<path d="M34 -34 L58 -96 M58 -96 L120 -92 L94 -34 Z M94 -34 L142 -34 L120 -92 M94 -34 L112 -112" fill="none" stroke="' + fr + '" stroke-width="5" stroke-linejoin="round"/>';
    g += '<path d="M54 -104 L62 -88 M46 -112 L70 -110" stroke="' + fr + '" stroke-width="5" stroke-linecap="round"/>';
    g += '<path d="M100 -116 L126 -114 C128 -110 124 -108 120 -108 L102 -110Z" fill="' + seat + '"/>';
    g += '<path d="M120 -94 L168 -96 L168 -88 L122 -86Z" fill="' + fr + '"/>';
    g += '<circle cx="94" cy="-34" r="9" fill="none" stroke="' + fr + '" stroke-width="3"/>';
    g += '</g>';
    return g;
  }
  function fruitCart(X, Y, k, C, night) {
    var wood = C('#B9875A'), woodS = C('#9A6B43'), woodD = C('#7A5233'), tire = C('#22262E'), rim = C('#AEB6C2');
    var g = '<g transform="translate(' + n(X) + ' ' + n(Y) + ') scale(' + k.toFixed(4) + ')">';
    g += '<ellipse cx="110" cy="0" rx="118" ry="7" fill="#0B1020" opacity=".25"/>';
    [40, 180].forEach(function (cx) { g += wheel(cx, -26, 26, tire, rim, C('#5B6576')); });
    g += R(0, -80, 220, 14, woodS) + R(0, -84, 220, 6, wood) + R(-6, -66, 232, 8, woodD);
    // umbrella canopy
    g += '<path d="M110 -86 L110 -230" stroke="' + C('#4A5568') + '" stroke-width="4"/>';
    g += '<path d="M10 -206 Q110 -262 210 -206 Z" fill="' + C('#E36F5C') + '"/><path d="M10 -206 Q60 -236 110 -244 L110 -206Z" fill="' + C('#F3EBDD') + '" opacity=".85"/><path d="M160 -228 Q190 -220 210 -206 L160 -206Z" fill="' + C('#F3EBDD') + '" opacity=".85"/>';
    // fruit piles
    var r = mulberry32(5), f = '';
    var cols = [[C('#E7A43A'), C('#C9862A')], [C('#D9503F'), C('#B03A2E')], [C('#9DC35A'), C('#7FA445')]];
    for (var pile = 0; pile < 3; pile++) {
      var px = 20 + pile * 64, cc = cols[pile];
      for (var row = 0; row < 3; row++) for (var i = 0; i < 4 - row; i++) {
        var cx = px + row * 8 + i * 15 + (r() - 0.5) * 2, cy = -92 - row * 12;
        f += '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="8" fill="' + cc[(i + row) % 2] + '"/>';
      }
    }
    // banana bunch hanging
    f += '<path d="M196 -186 c-10 10 -12 30 -4 44 M204 -186 c-6 12 -6 30 2 42 M212 -186 c-2 12 0 28 8 38" stroke="' + C('#F2D16B') + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
    f += '<path d="M204 -206 L204 -186" stroke="' + C('#4A5568') + '" stroke-width="2"/>';
    g += f + '</g>';
    return g;
  }

  window.SETS = window.SETS || {};
  window.SETS[ID] = {
    floorY: 1250,
    spots: {
      left: { x: 500, zone: 'front' },
      mid: { x: 1200, zone: 'front' },
      right: { x: 1900, zone: 'front' }
    },
    draw: function (opts) {
      opts = opts || {};
      var night = opts.time === 'night', rain = !!opts.rain;
      var NAVY = '#141C33';
      var C = night ? function (c) { return mix(c, NAVY, 0.55); } : rain ? function (c) { return mix(c, '#5E6878', 0.24); } : function (c) { return c; };
      var back = '', mid = '', front = '', fore = '', defs = '';
      var i, j, x, y, d, p, q;
      var warm = '#FFD58A', warmL = '#FFE9BF';

      // depth plan (m): near footpath to 4.6, road 4.6–10.4, far footpath 10.4–12.6, shop facades 12.6, lane to 40
      var dNC = 4.6, dFC = 10.4, dSF = 12.6, dFP = 10.75, sF = S(dSF);

      var sky0, sky1, sky2;
      if (night && rain) { sky0 = '#0D1326'; sky1 = '#18213A'; sky2 = '#2A3450'; }
      else if (night) { sky0 = '#0B1530'; sky1 = '#1B2B52'; sky2 = '#3A4A72'; }
      else if (rain) { sky0 = '#7E8999'; sky1 = '#A3ADB9'; sky2 = '#C4CAD2'; }
      else { sky0 = '#69A9DA'; sky1 = '#A6D0EC'; sky2 = '#EEF0E6'; }
      var haze = sky2;
      function H(c, t) { return mix(C(c), haze, t); }

      defs += '<linearGradient id="' + ID + '_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky0 + '"/><stop offset=".28" stop-color="' + sky1 + '"/><stop offset=".55" stop-color="' + sky2 + '"/><stop offset="1" stop-color="' + sky2 + '"/></linearGradient>';
      defs += '<filter id="' + ID + '_b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>';
      defs += '<filter id="' + ID + '_b18" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>';
      defs += '<filter id="' + ID + '_b40" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="40"/></filter>';
      defs += '<linearGradient id="' + ID + '_down" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020" stop-opacity=".28"/><stop offset="1" stop-color="#0B1020" stop-opacity="0"/></linearGradient>';
      defs += '<linearGradient id="' + ID + '_haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + haze + '" stop-opacity="0"/><stop offset="1" stop-color="' + haze + '" stop-opacity=".55"/></linearGradient>';
      defs += '<radialGradient id="' + ID + '_pool"><stop offset="0" stop-color="' + warmL + '" stop-opacity=".55"/><stop offset=".5" stop-color="' + warm + '" stop-opacity=".18"/><stop offset="1" stop-color="' + warm + '" stop-opacity="0"/></radialGradient>';
      defs += '<radialGradient id="' + ID + '_sun" cx=".1" cy="0" r=".9"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".3"/><stop offset="1" stop-color="#FFF4D8" stop-opacity="0"/></radialGradient>';
      defs += '<linearGradient id="' + ID + '_wet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1222" stop-opacity=".15"/><stop offset="1" stop-color="#0A1222" stop-opacity=".35"/></linearGradient>';
      ['E36F5C', 'F2D16B', '7FC1F0', 'FFD58A', 'B48ED6', '7BC18E'].forEach(function (c) {
        defs += '<linearGradient id="' + ID + '_r' + c + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="#' + c + '" stop-opacity="0"/></linearGradient>';
      });
      back += '<defs>' + defs + '</defs>';

      // ---------- sky ----------
      back += R(0, 0, 2400, 1350, 'url(#' + ID + '_sky)');
      if (night && !rain) {
        var sr = mulberry32(77), st = '';
        for (i = 0; i < 80; i++) { x = sr() * 2400; y = sr() * 360; st += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(0.8 + sr() * 1.8) + '" opacity="' + n(0.25 + sr() * 0.6) + '"/>'; }
        back += '<g fill="#EAF0FF">' + st + '</g>';
        back += '<circle cx="1610" cy="78" r="110" fill="#F4E9C8" opacity=".08"/><circle cx="1610" cy="78" r="58" fill="#F4E9C8" opacity=".12"/><circle cx="1610" cy="78" r="34" fill="#F3EAD0"/><circle cx="1600" cy="70" r="7" fill="#E1D6B6"/><circle cx="1620" cy="90" r="5" fill="#E1D6B6"/>';
      }
      var cr = mulberry32(13);
      var cb = night ? '#2A3A60' : rain ? '#B4BCC7' : '#FFFFFF', cs = night ? '#22314F' : rain ? '#97A0AD' : '#DCE8F1';
      back += '<g opacity="' + (night ? 0.7 : 0.95) + '">' + cloud(night ? 1930 : 1830, night ? 190 : 150, 360, cb, cs, cr) + cloud(960, 90, 300, cb, cs, cr) + (night && !rain ? '' : cloud(1560, 50, 240, cb, cs, cr));
      if (rain) back += cloud(1400, 40, 520, cb, cs, cr) + cloud(800, 30, 500, cb, cs, cr);
      back += '</g>';

      // ---------- distant skyline (aerial perspective) ----------
      var far = '';
      function farRow(dd, hz, seed, cols, minH, maxH) {
        var out = '', r = mulberry32(seed), xx = -16;
        var s = S(dd);
        while (xx < 16) {
          var w = 3 + r() * 6, hgt = minH + r() * (maxH - minH), col = H(cols[Math.floor(r() * cols.length)], hz);
          var a = P(xx, hgt, dd), b = P(xx + w, 0, dd);
          if (b[0] > -50 && a[0] < 2450) {
            out += R(a[0], a[1], b[0] - a[0], b[1] - a[1] + 4, col);
            out += R(b[0] - 0.12 * w * s, a[1], 0.12 * w * s, b[1] - a[1], H('#6B7686', hz + 0.08), 0, 'opacity=".35"');
            var wc = H(night ? '#F2C97A' : '#6B7686', night ? 0.1 : hz + 0.12);
            for (var fy = hgt - 1.2; fy > 1; fy -= 2.6) for (var fx = xx + 0.6; fx < xx + w - 0.8; fx += 1.4) {
              if (night && r() > 0.45) continue;
              var wp = P(fx, fy, dd); out += R(wp[0], wp[1], 0.6 * s, 0.9 * s, wc, 0, night ? 'opacity=".8"' : '');
            }
            if (r() > 0.6) { var tp = P(xx + w * 0.3, hgt, dd); out += R(tp[0], tp[1] - 1.2 * s, 1.4 * s, 1.2 * s, H('#3A4356', hz), 3); }
          }
          xx += w + r() * 1.2;
        }
        return out;
      }
      far += farRow(90, night ? 0.35 : 0.68, 3, ['#D7CDBE', '#CBD2DB', '#E1D2BC', '#C9CED6'], 14, 34);
      // temple shikhara with saffron flag
      var tpx = 3.6, tpd = 70, ts = S(tpd), tb0 = P(tpx, 9, tpd), tt0 = P(tpx, 30, tpd);
      far += R(tb0[0] - 7 * ts, tb0[1], 14 * ts, 9 * ts, H('#E2C9A6', night ? 0.3 : 0.55));
      far += '<path d="M' + n(tb0[0] - 5 * ts) + ' ' + n(tb0[1]) + 'Q' + n(tb0[0] - 4 * ts) + ' ' + n(tt0[1] + 6 * ts) + ' ' + n(tb0[0]) + ' ' + n(tt0[1]) + 'Q' + n(tb0[0] + 4 * ts) + ' ' + n(tt0[1] + 6 * ts) + ' ' + n(tb0[0] + 5 * ts) + ' ' + n(tb0[1]) + 'Z" fill="' + H('#E2B98A', night ? 0.3 : 0.55) + '"/>';
      far += '<path d="M' + n(tb0[0]) + ' ' + n(tt0[1]) + 'v-' + n(5 * ts) + '" stroke="' + H('#7A5233', 0.4) + '" stroke-width="2"/><path d="M' + n(tb0[0]) + ' ' + n(tt0[1] - 5 * ts) + 'l' + n(3 * ts) + ' ' + n(1.2 * ts) + 'l-' + n(3 * ts) + ' ' + n(1.2 * ts) + 'Z" fill="' + C('#E8833A') + '"/>';
      far += farRow(48, night ? 0.25 : 0.48, 7, ['#E6D6BF', '#D3DAE2', '#EAD9C2', '#D8CFC2', '#DCE1E8'], 9, 22);
      var mt = P(5.8, 0, 48), ms = S(48);
      far += '<g stroke="' + H('#7A8494', night ? 0.2 : 0.45) + '" stroke-width="2.5" fill="none"><path d="M' + n(mt[0] - 1.2 * ms) + ' ' + n(mt[1]) + 'L' + n(mt[0] - 0.2 * ms) + ' ' + n(P(0, 34, 48)[1]) + 'M' + n(mt[0] + 1.2 * ms) + ' ' + n(mt[1]) + 'L' + n(mt[0] + 0.2 * ms) + ' ' + n(P(0, 34, 48)[1]) + '"/>';
      for (y = 2; y < 33; y += 3) { var w1 = 1.2 - y / 34, w2 = 1.2 - (y + 3) / 34; far += '<path d="M' + n(mt[0] - w1 * ms) + ' ' + n(P(0, y, 48)[1]) + 'L' + n(mt[0] + w2 * ms) + ' ' + n(P(0, y + 3, 48)[1]) + 'M' + n(mt[0] + w1 * ms) + ' ' + n(P(0, y, 48)[1]) + 'L' + n(mt[0] - w2 * ms) + ' ' + n(P(0, y + 3, 48)[1]) + '"/>'; }
      far += '</g>';
      far += R(mt[0] - 0.9 * ms, P(0, 30, 48)[1], 0.5 * ms, 1.6 * ms, H('#AEB6C2', 0.3), 2) + R(mt[0] + 0.4 * ms, P(0, 28, 48)[1], 0.5 * ms, 1.6 * ms, H('#AEB6C2', 0.3), 2);
      if (night) far += '<circle cx="' + n(mt[0]) + '" cy="' + n(P(0, 34.5, 48)[1]) + '" r="5" fill="#FF5A4A"/><circle cx="' + n(mt[0]) + '" cy="' + n(P(0, 34.5, 48)[1]) + '" r="14" fill="#FF5A4A" opacity=".3"/>';
      far += farRow(30, night ? 0.18 : 0.32, 11, ['#EAD3B5', '#D9E4D6', '#E9DCC6', '#E4D9E8', '#DCE1E8'], 6, 13);
      back += far;
      back += R(0, 250, 2400, HZ - 250 + 80, 'url(#' + ID + '_haze)');

      // ---------- road + zebra + far footpath ----------
      var yFCt = P(0, 0, dFC)[1], yFCb = P(0, -0.15, dFC)[1], ySF = P(0, 0, dSF)[1];
      var road = C(rain ? '#3F4553' : '#5A606C'), roadL = C(rain ? '#4A5160' : '#666C78');
      back += R(0, yFCb, 2400, 1350 - yFCb, road);
      [[6.2, 0.5], [8.8, 0.45]].forEach(function (t) { var a = P(0, -0.15, t[0] - t[1] / 2), b = P(0, -0.15, t[0] + t[1] / 2); back += R(0, b[1], 2400, a[1] - b[1], roadL, 0, 'opacity=".5"'); });
      var dash = '';
      for (x = -30; x < 30; x += 3) {
        if (x > -3.2 && x < 1.0) continue;
        var a0 = P(x, -0.15, 7.4), a1 = P(x + 1.5, -0.15, 7.55);
        if (a1[0] < 0 || a0[0] > 2400) continue;
        dash += pth([P(x, -0.15, 7.4), P(x + 1.5, -0.15, 7.4), P(x + 1.5, -0.15, 7.55), P(x, -0.15, 7.55)]);
      }
      back += '<path d="' + dash + '" fill="' + C('#E9E4D6') + '" opacity=".75"/>';
      // zebra crossing (stripes parallel to traffic)
      var zb = '';
      for (d = dNC + 0.15; d < dFC - 0.2; d += 0.9) zb += pth([P(-2.6, -0.15, d), P(0.6, -0.15, d), P(0.6, -0.15, d + 0.45), P(-2.6, -0.15, d + 0.45)]);
      back += '<path d="' + zb + '" fill="' + C('#ECE8DC') + '" opacity="' + (rain ? 0.6 : 0.82) + '"/>';
      var rr0 = mulberry32(9), spk = '';
      for (i = 0; i < 240; i++) { d = 5.2 + rr0() * 5.0; x = -12 + rr0() * 24; p = P(x, -0.15, d); spk += 'M' + n(p[0]) + ' ' + n(p[1]) + 'h' + n((0.04 + rr0() * 0.1) * S(d)); }
      back += '<path d="' + spk + '" stroke="' + C('#8A909B') + '" stroke-width="2" opacity=".45"/>';
      [[-7.5, 6.4, 1.6, 0.7], [4.0, 8.9, 1.2, 0.5], [7.2, 5.6, 2.0, 0.5]].forEach(function (pt) { back += HQ(pt[0], pt[0] + pt[2], -0.15, pt[1], pt[1] + pt[3], C('#4E5460'), 'opacity=".55"'); });
      p = P(2.2, -0.15, 6.3);
      back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n(0.33 * S(6.3)) + '" ry="' + n(0.07 * S(6.3)) + '" fill="' + C('#3E434E') + '"/><ellipse cx="' + n(p[0]) + '" cy="' + n(p[1] - 2) + '" rx="' + n(0.28 * S(6.3)) + '" ry="' + n(0.055 * S(6.3)) + '" fill="' + C('#6E7480') + '"/>';
      back += R(0, yFCt, 2400, yFCb - yFCt, C('#B9B2A5'));
      var fcp = '';
      for (x = -20; x < 20; x += 1.4) { var e0 = P(x, 0, dFC), e1 = P(x + 0.7, 0, dFC); fcp += 'M' + n(e0[0]) + ' ' + n(yFCt) + 'H' + n(e1[0]) + 'V' + n(yFCb) + 'H' + n(e0[0]) + 'Z'; }
      back += '<path d="' + fcp + '" fill="' + C('#2E333D') + '"/>';
      back += R(0, ySF, 2400, yFCt - ySF, C('#C8BFB1'));
      var ftl = '';
      for (x = -20; x < 20; x += 0.5) { var f0 = P(x, 0, dFC), f1 = P(x, 0, dSF); ftl += 'M' + n(f0[0]) + ' ' + n(f0[1]) + 'L' + n(f1[0]) + ' ' + n(f1[1]); }
      ftl += 'M0 ' + n(P(0, 0, 11.5)[1]) + 'H2400';
      back += '<path d="' + ftl + '" stroke="' + C('#A99E8F') + '" stroke-width="1.5" opacity=".55"/>';

      // ---------- shop row ----------
      var row = '';
      var B = [
        { x0: -9.8, x1: -3.3, col: '#EBD3B4', top: 12, d: dSF },
        { x0: -0.9, x1: 2.5, col: '#D9E4D6', top: 9, d: dSF },
        { x0: 2.5, x1: 5.6, col: '#F3EBDD', top: 3.75, d: dSF + 0.1 },
        { x0: 5.6, x1: 9.8, col: '#E4D9E8', top: 12, d: dSF - 0.1 }
      ];
      function wcolOf(bi, t) { var c = B[bi].col; return C(t >= 0 ? mix(c, '#FFFFFF', t) : mix(c, '#7A6A55', -t)); }
      // --- side lane (gali): ground, far end, left wall built from several buildings ---
      var dGE = 40, gl = '';
      gl += HQ(-3.3, -0.9, 0, dSF, dGE, C('#B8AE9F'));
      var gls = ''; for (var dz0 = dSF + 2; dz0 < dGE; dz0 += 2.5) { var g0 = P(-3.3, 0, dz0), g1 = P(-0.9, 0, dz0); gls += 'M' + n(g0[0]) + ' ' + n(g0[1]) + 'H' + n(g1[0]); }
      gl += '<path d="' + gls + '" stroke="' + C('#A39888') + '" stroke-width="1.5" opacity=".5"/>';
      gl += FR(-8, 4, 0, 9, dGE, H('#E6D6BF', 0.35));
      for (y = 1; y < 8; y += 3) for (x = -3.0; x < -0.9; x += 1.1) gl += FR(x, x + 0.55, y + 0.8, y + 2.0, dGE, H(night ? '#F2C97A' : '#6B7686', night ? 0.05 : 0.45), 0, night ? 'opacity=".85"' : '');
      var laneB = [[30, 40, 8.5, '#E9DCC6'], [21.5, 30, 6.4, '#D9E4D6'], [dSF, 21.5, 10.5, '#E6CBA8']];
      laneB.forEach(function (lb) {
        var hz2 = Math.min(0.5, (lb[0] - dSF) / 40);
        var lw = mix(C(mix(lb[3], '#7A6A55', 0.12)), haze, hz2), lwS = mix(C(mix(lb[3], '#7A6A55', 0.3)), haze, hz2), win = mix(C(night ? '#F2C97A' : '#3E4A60'), haze, night ? hz2 * 0.3 : hz2 * 0.8);
        gl += SQ(-3.3, 0, lb[2], lb[0], lb[1], lw);
        gl += SQ(-3.3, lb[2] - 0.25, lb[2], lb[0], lb[1], mix(C(mix(lb[3], '#FFFFFF', 0.35)), haze, hz2));
        for (var dz = lb[0] + 0.9; dz < lb[1] - 1.4; dz += 3.2) {
          gl += SQ(-3.3, 0.0, 2.1, dz, dz + 1.0, mix(C(night ? '#E9BC6E' : '#7A5233'), haze, hz2));
          for (var fl0 = 3.6; fl0 < lb[2] - 1.2; fl0 += 3.0) {
            gl += SQ(-3.3, fl0 + 0.4, fl0 + 1.7, dz + 0.2, dz + 1.3, win);
            gl += SQ(-3.3, fl0 + 1.75, fl0 + 1.9, dz, dz + 1.5, lwS);
          }
        }
        gl += SQ(-3.3, 3.45, 3.6, lb[0], lb[1], lwS);
      });
      gl += SQ(-3.3, 0, 12, dSF, dGE, '#0B1020', 'opacity=".06"');
      // clothes line across the lane
      var cl = qcurve(P(-3.3, 3.2, 17)[0], P(-3.3, 3.2, 17)[1], P(-0.9, 3.2, 17)[0], P(-0.9, 3.2, 17)[1], 8);
      gl += qpath(cl, C('#4A5568'), 1.5);
      var ccols = ['#E36F5C', '#5AA0D8', '#F2D16B', '#FFFFFF', '#B48ED6'];
      for (i = 1; i < 6; i++) { var cp = qpt(cl, i / 6.4); gl += R(cp[0] - 8, cp[1], 16, 20 + (i % 2) * 7, C(ccols[i % 5]), 2); }
      // lane street sign
      p = P(-3.25, 3.15, dSF - 0.05);
      gl += R(p[0], p[1], 0.75 * sF, 0.28 * sF, C('#2F6EA6'), 3) + txt(p[0] + 0.375 * sF, p[1] + 0.2 * sF, 'गली नं. 4', 0.15 * sF, '#FFFFFF', 500);
      row += gl;

      // --- building facades ---
      B.forEach(function (b) {
        var wcol = C(b.col), wS = C(mix(b.col, '#7A6A55', 0.18)), wH = C(mix(b.col, '#FFFFFF', 0.4));
        row += FR(b.x0, b.x1, 0, b.top, b.d, wcol);
        row += FR(b.x0, b.x1, 3.55, 3.7, b.d - 0.05, wH);
        row += poly([P(b.x0, 3.55, b.d - 0.05), P(b.x1, 3.55, b.d - 0.05), P(b.x1, 3.55, b.d), P(b.x0, 3.55, b.d)], wS);
        if (b.top > 7) row += FR(b.x0, b.x1, 6.55, 6.7, b.d - 0.05, wH);
        row += FR(b.x0, b.x1, 0, 0.15, b.d, C('#9C9488'));
        row += FR(b.x1 - 0.12, b.x1, 0, b.top, b.d, '#0B1020', 0, 'opacity=".08"');
      });
      // B1 upper: windows, balcony with laundry + plants, AC
      (function () {
        var dd2 = B[0].d;
        for (x = -9.2; x < -3.8; x += 1.85) {
          row += FR(x, x + 1.1, 4.3, 5.8, dd2, C(night ? '#F6CF86' : '#3E4A60'), 0, night ? 'opacity=".9"' : '');
          if (!night) row += FR(x + 0.05, x + 1.05, 4.35, 5.75, dd2, '#9FC3E0', 0, 'opacity=".22"');
          var gr = ''; for (var gx = x + 0.12; gx < x + 1.1; gx += 0.16) { p = P(gx, 5.8, dd2); q = P(gx, 4.3, dd2); gr += 'M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]); }
          row += '<path d="' + gr + '" stroke="' + C('#E7EAEE') + '" stroke-width="2"/>';
          row += FR(x - 0.15, x + 1.25, 5.85, 5.98, dd2 - 0.25, wcolOf(0, 0.4)) + poly([P(x - 0.15, 5.85, dd2 - 0.25), P(x + 1.25, 5.85, dd2 - 0.25), P(x + 1.25, 5.85, dd2), P(x - 0.15, 5.85, dd2)], wcolOf(0, -0.2));
          row += FR(x, x + 1.1, 7.3, 9.0, dd2, C(night ? '#E9BC6E' : '#3E4A60'), 0, night ? 'opacity=".75"' : '');
        }
        var bd = dd2 - 0.9;
        row += poly([P(-9.8, 3.7, bd), P(-3.4, 3.7, bd), P(-3.4, 3.7, dd2), P(-9.8, 3.7, dd2)], wcolOf(0, -0.25));
        row += FR(-9.8, -3.4, 3.7, 3.85, bd, wcolOf(0, 0.35));
        var rail = '';
        for (x = -9.75; x < -3.4; x += 0.14) { p = P(x, 3.85, bd); q = P(x, 4.75, bd); rail += 'M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]); }
        row += '<path d="' + rail + '" stroke="' + C('#4A5568') + '" stroke-width="2.5"/>';
        row += FR(-9.8, -3.4, 4.72, 4.8, bd, C('#4A5568'));
        var ll = qcurve(P(-8.2, 5.1, bd + 0.3)[0], P(-8.2, 5.1, bd + 0.3)[1], P(-4.4, 5.1, bd + 0.3)[0], P(-4.4, 5.1, bd + 0.3)[1], 6);
        row += qpath(ll, C('#3A4356'), 1.5);
        var lr = mulberry32(8), lcol = ['#E36F5C', '#5AA0D8', '#F2D16B', '#FFFFFF', '#7BC18E', '#B48ED6'];
        for (i = 0; i < 7; i++) { var lp = qpt(ll, 0.08 + i * 0.13); var lw2 = 14 + lr() * 14, lh2 = 30 + lr() * 34; row += R(lp[0] - lw2 / 2, lp[1], lw2, lh2, C(lcol[i % 6]), 2); }
        [-9.4, -6.4, -3.9].forEach(function (px) { p = P(px, 4.8, bd); row += R(p[0] - 14, p[1] - 22, 28, 22, C('#C0714F'), 3) + '<circle cx="' + n(p[0]) + '" cy="' + n(p[1] - 32) + '" r="17" fill="' + C('#5A9A58') + '"/><circle cx="' + n(p[0] + 9) + '" cy="' + n(p[1] - 40) + '" r="11" fill="' + C('#7BC18E') + '"/>'; });
        row += FR(-4.5, -3.75, 6.0, 6.45, dd2 - 0.3, C('#E9ECEF'), 3);
        p = P(-4.25, 6.22, dd2 - 0.3); row += '<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" r="' + n(0.15 * sF) + '" fill="' + C('#B5BDC8') + '"/>';
        if (night) {
          var fl = qcurve(P(-9.8, 4.72, bd)[0], P(-9.8, 4.72, bd)[1], P(-3.4, 4.72, bd)[0], P(-3.4, 4.72, bd)[1], 10), fls = '';
          for (i = 0; i <= 30; i++) { var lp3 = qpt(fl, i / 30); fls += '<circle cx="' + n(lp3[0]) + '" cy="' + n(lp3[1] + 3) + '" r="3.6" fill="' + ['#FFE08A', '#FF9C6E', '#9FE3FF'][i % 3] + '"/><circle cx="' + n(lp3[0]) + '" cy="' + n(lp3[1] + 3) + '" r="10" fill="#FFE08A" opacity=".18"/>'; }
          row += fls;
        }
      })();
      // B2 upper: coaching banner + windows with sunshade + small balcony
      (function () {
        var dd2 = B[1].d, s2 = S(dd2);
        row += FR(-0.6, 0.9, 5.5, 7.0, dd2, C(night ? '#F6CF86' : '#3E4A60'));
        if (!night) row += FR(-0.55, 0.85, 5.55, 6.95, dd2, '#9FC3E0', 0, 'opacity=".22"');
        var gr = ''; for (var gx = -0.48; gx < 0.9; gx += 0.16) { p = P(gx, 7.0, dd2); q = P(gx, 5.5, dd2); gr += 'M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]); }
        row += '<path d="' + gr + '" stroke="' + C('#F3F5F7') + '" stroke-width="2"/>';
        row += FR(1.35, 2.2, 3.7, 5.9, dd2, C(night ? '#E9BC6E' : '#7A5233'));
        row += FR(1.2, 2.35, 4.6, 4.66, dd2 - 0.5, C('#4A5568'));
        var rl2 = ''; for (x = 1.22; x < 2.35; x += 0.1) { p = P(x, 3.7, dd2 - 0.5); q = P(x, 4.62, dd2 - 0.5); rl2 += 'M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]); }
        row += '<path d="' + rl2 + '" stroke="' + C('#4A5568') + '" stroke-width="2"/>';
        p = P(1.45, 4.66, dd2 - 0.5); row += R(p[0] - 10, p[1] - 16, 20, 16, C('#C0714F'), 2) + '<circle cx="' + n(p[0]) + '" cy="' + n(p[1] - 24) + '" r="12" fill="' + C('#5A9A58') + '"/>';
        p = P(2.15, 4.66, dd2 - 0.5); row += R(p[0] - 9, p[1] - 14, 18, 14, C('#C0714F'), 2) + '<circle cx="' + n(p[0]) + '" cy="' + n(p[1] - 22) + '" r="11" fill="' + C('#E36F5C') + '"/><circle cx="' + n(p[0] - 5) + '" cy="' + n(p[1] - 16) + '" r="8" fill="' + C('#5A9A58') + '"/>';
        // vinyl banner tied to the wall
        var bx0 = -0.75, bx1 = 1.15, bh0 = 3.85, bh1 = 5.15, bdd = dd2 - 0.03;
        var b0 = P(bx0, bh1, bdd), b1 = P(bx1, bh0, bdd), bw = b1[0] - b0[0], bh = b1[1] - b0[1];
        row += R(b0[0] + 4, b0[1] + 5, bw, bh, '#0B1020', 2, 'opacity=".12"');
        row += R(b0[0], b0[1], bw, bh, C(night ? '#FFF6E6' : '#FBF6EC'), 2);
        row += R(b0[0], b0[1], bw, bh * 0.3, C('#C8161E'), 2);
        row += txt(b0[0] + bw / 2, b0[1] + bh * 0.21, 'ADMISSION OPEN', Math.min(bh * 0.2, (bw - 20) / tw('ADMISSION OPEN', 1)), '#FFFFFF', 600);
        row += txt(b0[0] + bw / 2, b0[1] + bh * 0.55, 'विद्या कोचिंग सेंटर', Math.min(bh * 0.2, (bw - 20) / tw('विद्या कोचिंग सेंटर', 1)), C('#1F2A44'), 600);
        row += txt(b0[0] + bw / 2, b0[1] + bh * 0.8, 'Class 6–12 • Maths • Science', Math.min(bh * 0.12, (bw - 20) / tw('Class 6–12 • Maths • Science', 1)), C('#3A4356'), 500);
        [[b0[0], b0[1]], [b1[0], b0[1]], [b0[0], b1[1]], [b1[0], b1[1]]].forEach(function (c) { row += '<circle cx="' + n(c[0]) + '" cy="' + n(c[1]) + '" r="3.5" fill="' + C('#6B7686') + '"/>'; });
      })();
      // B3 single storey: parapet, water tank, dish, sky above
      (function () {
        var dd2 = B[2].d;
        row += FR(2.5, 5.6, 3.75, 4.2, dd2, wcolOf(2, 0.3));
        var jl = ''; for (x = 2.65; x < 5.5; x += 0.32) { var j0 = P(x, 3.86, dd2 - 0.01), j1 = P(x + 0.2, 4.08, dd2 - 0.01); jl += R(j0[0], j1[1], j1[0] - j0[0], j0[1] - j1[1], wcolOf(2, -0.25), 3); }
        row += jl + FR(2.45, 5.65, 4.2, 4.27, dd2 - 0.03, wcolOf(2, 0.5));
        p = P(4.6, 4.2, dd2 + 1.2); var s3 = S(dd2 + 1.2);
        var tkW = 0.8 * s3, tkH = 0.82 * s3, tkY = p[1] - 0.25 * s3;
        row += '<path d="M' + n(p[0] + 6) + ' ' + n(p[1]) + 'L' + n(p[0] + 10) + ' ' + n(tkY) + 'M' + n(p[0] + tkW - 6) + ' ' + n(p[1]) + 'L' + n(p[0] + tkW - 10) + ' ' + n(tkY) + '" stroke="' + H('#6B7686', 0.15) + '" stroke-width="4"/>';
        row += R(p[0] - 4, tkY - 6, tkW + 8, 8, H('#7D8794', 0.15), 2);
        row += R(p[0], tkY - tkH, tkW, tkH, H('#323A4C', 0.18), 9);
        row += R(p[0] + tkW * 0.7, tkY - tkH, tkW * 0.3, tkH, H('#262D3D', 0.18), 9);
        row += R(p[0] + tkW * 0.12, tkY - tkH + 6, tkW * 0.12, tkH - 12, H('#56607A', 0.18), 5);
        var rbs = ''; for (i = 1; i < 4; i++) rbs += 'M' + n(p[0]) + ' ' + n(tkY - tkH * i / 4) + 'h' + n(tkW);
        row += '<path d="' + rbs + '" stroke="' + H('#1F2633', 0.18) + '" stroke-width="2.5"/>';
        row += R(p[0] + tkW * 0.25, tkY - tkH - 9, tkW * 0.5, 12, H('#3A4356', 0.18), 5);
        p = P(3.1, 4.27, dd2 + 0.6);
        row += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'v-30" stroke="' + C('#6B7686') + '" stroke-width="3"/><ellipse cx="' + n(p[0] - 8) + '" cy="' + n(p[1] - 44) + '" rx="13" ry="22" transform="rotate(-25 ' + n(p[0] - 8) + ' ' + n(p[1] - 44) + ')" fill="' + C('#DCE1E8') + '"/>';
      })();
      // B4 upper: windows with sunshades
      (function () {
        var dd2 = B[3].d;
        for (x = 6.1; x < 9.6; x += 1.7) {
          row += FR(x, x + 1.0, 4.3, 5.7, dd2, C(night ? '#F6CF86' : '#3E4A60'), 0, night ? 'opacity=".85"' : '');
          if (!night) row += FR(x + 0.05, x + 0.95, 4.35, 5.65, dd2, '#9FC3E0', 0, 'opacity=".22"');
          var gr = ''; for (var gx = x + 0.12; gx < x + 1.0; gx += 0.16) { p = P(gx, 5.7, dd2); q = P(gx, 4.3, dd2); gr += 'M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]); }
          row += '<path d="' + gr + '" stroke="' + C('#E7EAEE') + '" stroke-width="2"/>';
          row += FR(x - 0.12, x + 1.12, 5.75, 5.86, dd2 - 0.3, wcolOf(3, 0.4)) + poly([P(x - 0.12, 5.75, dd2 - 0.3), P(x + 1.12, 5.75, dd2 - 0.3), P(x + 1.12, 5.75, dd2), P(x - 0.12, 5.75, dd2)], wcolOf(3, -0.25));
          row += FR(x, x + 1.0, 7.4, 9.0, dd2, C(night ? '#E9BC6E' : '#3E4A60'), 0, night ? 'opacity=".7"' : '');
        }
        p = P(5.85, 4.4, dd2 - 0.3);
        row += FR(5.7, 6.0, 4.0, 6.5, dd2 - 0.05, C('#AEB6C2'));
      })();

      // --- shopfronts ---
      var signCols = { sweets: ['#D9603F', '#FFF4E2', '#F2D16B'], kirana: ['#E7B04A', '#6E1B1B', '#7A2A1A'], fashion: ['#7E5AA8', '#FFFFFF', '#F2D16B'], elec: ['#2F6EA6', '#FFFFFF', '#F2D16B'], tea: ['#2E8A7E', '#FFFFFF', '#F2D16B'] };
      var shops = [
        { x0: -9.6, x1: -6.4, kind: 'sweets', b: 0, big: 'गुप्ता स्वीट्स', small: 'GUPTA SWEETS & NAMKEEN' },
        { x0: -6.4, x1: -3.45, kind: 'kirana', b: 0, big: 'श्री राम किराना स्टोर', small: 'SHREE RAM KIRANA STORE' },
        { x0: -0.75, x1: 2.4, kind: 'fashion', b: 1, big: 'NEW FASHION POINT', small: 'न्यू फैशन पॉइंट • Ladies & Kids Wear' },
        { x0: 2.6, x1: 5.5, kind: 'elec', b: 2, big: 'BHARAT ELECTRICALS', small: 'भारत इलेक्ट्रिकल्स • Fans • Lights' },
        { x0: 5.75, x1: 9.6, kind: 'tea', b: 3, big: 'मोहन टी स्टॉल', small: 'MOHAN TEA STALL • Chai • Snacks' }
      ];
      var bc = ['#E7B04A', '#5AA0D8', '#E36F5C', '#7BC18E', '#B48ED6', '#F2D16B', '#FFFFFF'];
      shops.forEach(function (sh, si) {
        var dd2 = B[sh.b].d, x0 = sh.x0, x1 = sh.x1, ox0 = x0 + 0.18, ox1 = x1 - 0.18;
        var s2 = S(dd2), sc = signCols[sh.kind];
        var dI = dd2 + 2.2, r = mulberry32(100 + si * 17);
        var o = '';
        o += FR(ox0, ox1, 0.15, 2.55, dd2, night ? C('#B89A6E') : C('#5E5852'));
        o += FR(ox0, ox1, 0.15, 2.55, dI, night ? '#F3DDB5' : C('#8B8174'));
        if (ox0 < 0) o += SQ(ox0, 0.15, 2.55, dd2, dI, night ? '#E2C796' : C('#77706A'));
        if (ox1 > 0) o += SQ(ox1, 0.15, 2.55, dd2, dI, night ? '#E2C796' : C('#77706A'));
        o += HQ(ox0, ox1, 2.55, dd2, dI, night ? '#F6E6C6' : C('#9A9086'));
        o += HQ(ox0, ox1, 0.15, dd2, dI, night ? '#D9C49F' : C('#6E665E'));
        var dim = function (c) { return night ? mix(c, '#FFF2D8', 0.08) : C(mix(c, '#4A4440', 0.28)); };
        if (sh.kind === 'sweets') {
          for (y = 1.4; y < 2.4; y += 0.36) { o += FR(ox0, ox1, y - 0.03, y, dI - 0.05, dim('#B9875A')); for (x = ox0 + 0.05; x < ox1 - 0.2; x += 0.22) o += FR(x, x + 0.18, y, y + 0.16 + r() * 0.08, dI - 0.05, dim(['#E36F5C', '#F2D16B', '#FFFFFF', '#E7B04A'][Math.floor(r() * 4)]), 2); }
          var kd = dd2 + 0.35;
          o += FR(ox0 + 0.1, ox1 - 0.1, 0.15, 0.55, kd, dim('#9A6B43'));
          o += FR(ox0 + 0.1, ox1 - 0.1, 0.55, 1.2, kd, night ? '#F8EBD0' : C('#C9D6DA'));
          for (var tr2 = 0; tr2 < 2; tr2++) {
            var ty = 0.62 + tr2 * 0.3;
            for (x = ox0 + 0.2; x < ox1 - 0.45; x += 0.42) {
              o += FR(x, x + 0.36, ty, ty + 0.05, kd + 0.05, dim('#DCE1E8'), 2);
              var sw = ['#E7A43A', '#F6F1E4', '#7BC18E', '#E36F5C', '#F2D16B'][Math.floor(r() * 5)];
              for (var bb = 0; bb < 4; bb++) { var sp2 = P(x + 0.06 + bb * 0.08, ty + 0.08, kd + 0.05); o += '<circle cx="' + n(sp2[0]) + '" cy="' + n(sp2[1]) + '" r="' + n(0.04 * S(kd)) + '" fill="' + dim(sw) + '"/>'; }
            }
          }
          o += FR(ox0 + 0.1, ox1 - 0.1, 1.2, 1.26, kd, dim('#B9875A'));
          var mg = qcurve(P(ox0, 2.5, dd2 - 0.03)[0], P(ox0, 2.5, dd2 - 0.03)[1], P(ox1, 2.5, dd2 - 0.03)[0], P(ox1, 2.5, dd2 - 0.03)[1], 18);
          for (i = 0; i <= 26; i++) { var mp = qpt(mg, i / 26); o += '<circle cx="' + n(mp[0]) + '" cy="' + n(mp[1]) + '" r="5.5" fill="' + (i % 3 ? C('#F29A1F') : C('#E8C33A')) + '"/>'; }
        } else if (sh.kind === 'kirana') {
          for (y = 0.9; y < 2.45; y += 0.32) { o += FR(ox0, ox1, y - 0.03, y, dI - 0.05, dim('#9A6B43')); for (x = ox0 + 0.04; x < ox1 - 0.08; x += 0.07 + r() * 0.06) o += FR(x, x + 0.05 + r() * 0.03, y, y + 0.12 + r() * 0.14, dI - 0.05, dim(bc[Math.floor(r() * bc.length)])); }
          for (x = ox0 + 0.15; x < ox1 - 0.1; x += 0.3) { p = P(x, 2.5, dd2 + 0.05); q = P(x, 1.75, dd2 + 0.05); o += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]) + '" stroke="' + C('#6B7686') + '" stroke-width="1.5"/>'; for (y = 2.42; y > 1.8; y -= 0.13) { var pc = P(x - 0.05, y, dd2 + 0.05); o += R(pc[0], pc[1], 0.1 * s2, 0.11 * s2, C(bc[Math.floor(r() * 6)]), 2); } }
          var sk2 = dd2 - 0.5, ss2 = S(sk2);
          [['#F3EBDD', '#FFFFFF'], ['#E7B04A', '#F2D16B'], ['#C0503A', '#D9603F'], ['#E9DCC6', '#F6EFE2']].forEach(function (k2, ki) {
            var sx = ox0 + 0.25 + ki * 0.62, sp3 = P(sx, 0.15, sk2);
            o += '<path d="M' + n(sp3[0] - 0.26 * ss2) + ' ' + n(sp3[1]) + 'C' + n(sp3[0] - 0.3 * ss2) + ' ' + n(sp3[1] - 0.3 * ss2) + ' ' + n(sp3[0] - 0.28 * ss2) + ' ' + n(sp3[1] - 0.45 * ss2) + ' ' + n(sp3[0] - 0.24 * ss2) + ' ' + n(sp3[1] - 0.5 * ss2) + 'H' + n(sp3[0] + 0.24 * ss2) + 'C' + n(sp3[0] + 0.28 * ss2) + ' ' + n(sp3[1] - 0.45 * ss2) + ' ' + n(sp3[0] + 0.3 * ss2) + ' ' + n(sp3[1] - 0.3 * ss2) + ' ' + n(sp3[0] + 0.26 * ss2) + ' ' + n(sp3[1]) + 'Z" fill="' + C('#C9B58E') + '"/>';
            o += '<path d="M' + n(sp3[0] + 0.05 * ss2) + ' ' + n(sp3[1] - 0.48 * ss2) + 'C' + n(sp3[0] + 0.2 * ss2) + ' ' + n(sp3[1] - 0.4 * ss2) + ' ' + n(sp3[0] + 0.24 * ss2) + ' ' + n(sp3[1] - 0.2 * ss2) + ' ' + n(sp3[0] + 0.2 * ss2) + ' ' + n(sp3[1]) + 'H' + n(sp3[0] + 0.26 * ss2) + 'C' + n(sp3[0] + 0.3 * ss2) + ' ' + n(sp3[1] - 0.3 * ss2) + ' ' + n(sp3[0] + 0.28 * ss2) + ' ' + n(sp3[1] - 0.45 * ss2) + ' ' + n(sp3[0] + 0.24 * ss2) + ' ' + n(sp3[1] - 0.5 * ss2) + 'Z" fill="' + C('#A8946C') + '"/>';
            o += '<ellipse cx="' + n(sp3[0]) + '" cy="' + n(sp3[1] - 0.5 * ss2) + '" rx="' + n(0.25 * ss2) + '" ry="' + n(0.07 * ss2) + '" fill="' + C('#B39E76') + '"/>';
            o += '<ellipse cx="' + n(sp3[0]) + '" cy="' + n(sp3[1] - 0.52 * ss2) + '" rx="' + n(0.2 * ss2) + '" ry="' + n(0.05 * ss2) + '" fill="' + C(k2[0]) + '"/>';
            o += '<ellipse cx="' + n(sp3[0] - 0.03 * ss2) + '" cy="' + n(sp3[1] - 0.545 * ss2) + '" rx="' + n(0.12 * ss2) + '" ry="' + n(0.025 * ss2) + '" fill="' + C(k2[1]) + '"/>';
          });
        } else if (sh.kind === 'fashion') {
          for (var rl3 = 0; rl3 < 2; rl3++) {
            var ry = 2.2 - rl3 * 0.95, rd = dI - 0.4 - rl3 * 0.7;
            p = P(ox0, ry, rd); q = P(ox1, ry, rd);
            o += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'H' + n(q[0]) + '" stroke="' + dim('#AEB6C2') + '" stroke-width="3"/>';
            for (x = ox0 + 0.08; x < ox1 - 0.12; x += 0.13) { var gp = P(x, ry, rd), gh = (0.55 + r() * 0.25) * S(rd), gw = 0.11 * S(rd); o += '<path d="M' + n(gp[0] - gw / 2) + ' ' + n(gp[1] + 4) + 'h' + n(gw) + 'l' + n(gw * 0.2) + ' ' + n(gh) + 'h-' + n(gw * 1.4) + 'Z" fill="' + dim(['#E36F5C', '#B48ED6', '#5AA0D8', '#F2D16B', '#7BC18E', '#C8161E', '#FFFFFF', '#1E9E62'][Math.floor(r() * 8)]) + '"/>'; }
          }
          [ox0 + 0.45, ox1 - 0.45].forEach(function (mx, mi) {
            var md = dd2 + 0.3, ms2 = S(md), mp2 = P(mx, 0.15, md), col = C(mi ? '#C8508A' : '#E7A43A');
            o += R(mp2[0] - 0.03 * ms2, mp2[1] - 0.95 * ms2, 0.06 * ms2, 0.95 * ms2, C('#4A5568'));
            o += R(mp2[0] - 0.2 * ms2, mp2[1] - 0.03 * ms2, 0.4 * ms2, 0.03 * ms2, C('#4A5568'));
            o += '<path d="M' + n(mp2[0] - 0.2 * ms2) + ' ' + n(mp2[1] - 1.55 * ms2) + 'Q' + n(mp2[0]) + ' ' + n(mp2[1] - 1.68 * ms2) + ' ' + n(mp2[0] + 0.2 * ms2) + ' ' + n(mp2[1] - 1.55 * ms2) + 'L' + n(mp2[0] + 0.3 * ms2) + ' ' + n(mp2[1] - 0.55 * ms2) + 'H' + n(mp2[0] - 0.3 * ms2) + 'Z" fill="' + col + '"/>';
            o += '<path d="M' + n(mp2[0] - 0.08 * ms2) + ' ' + n(mp2[1] - 1.6 * ms2) + 'L' + n(mp2[0] + 0.24 * ms2) + ' ' + n(mp2[1] - 0.9 * ms2) + '" stroke="' + C('#F2D16B') + '" stroke-width="' + n(0.06 * ms2) + '" opacity=".85"/>';
            o += '<ellipse cx="' + n(mp2[0]) + '" cy="' + n(mp2[1] - 1.72 * ms2) + '" rx="' + n(0.09 * ms2) + '" ry="' + n(0.11 * ms2) + '" fill="' + C('#E8D8C4') + '"/>';
          });
          p = P(ox0 + 0.1, 2.35, dd2 - 0.02);
          o += R(p[0], p[1], 0.6 * s2, 0.2 * s2, C('#C8161E'), 3) + txt(p[0] + 0.3 * s2, p[1] + 0.15 * s2, 'SALE', 0.13 * s2, '#FFFFFF', 600);
        } else if (sh.kind === 'elec') {
          for (y = 1.0; y < 2.0; y += 0.33) { o += FR(ox0, ox1, y - 0.03, y, dI - 0.05, dim('#9A6B43')); for (x = ox0 + 0.05; x < ox1 - 0.2; x += 0.2 + r() * 0.1) o += FR(x, x + 0.16, y, y + 0.14 + r() * 0.1, dI - 0.05, dim(['#FFFFFF', '#5AA0D8', '#E7B04A', '#DCE1E8'][Math.floor(r() * 4)]), 2); }
          [ox0 + 0.7, (ox0 + ox1) / 2, ox1 - 0.7].forEach(function (fx, fi) {
            var fd = dd2 + 0.9, fs3 = S(fd), fp = P(fx, 2.55, fd), fq = P(fx, 2.3, fd);
            o += '<path d="M' + n(fp[0]) + ' ' + n(fp[1]) + 'V' + n(fq[1]) + '" stroke="' + dim('#6B7686') + '" stroke-width="3"/>';
            o += '<ellipse cx="' + n(fq[0]) + '" cy="' + n(fq[1]) + '" rx="' + n(0.09 * fs3) + '" ry="' + n(0.04 * fs3) + '" fill="' + dim(fi === 1 ? '#7A5233' : '#FFFFFF') + '"/>';
            o += '<path d="M' + n(fq[0] - 0.62 * fs3) + ' ' + n(fq[1] + 2) + 'L' + n(fq[0] + 0.62 * fs3) + ' ' + n(fq[1] - 2) + '" stroke="' + dim(fi === 1 ? '#9A6B43' : '#F3F5F7') + '" stroke-width="' + n(0.07 * fs3) + '" stroke-linecap="round"/>';
          });
          for (x = ox0 + 0.35; x < ox1 - 0.2; x += 0.4) { p = P(x, 2.55, dd2 + 0.2); q = P(x, 2.22 - (Math.round(x * 10) % 3) * 0.06, dd2 + 0.2); o += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'V' + n(q[1]) + '" stroke="' + C('#2A3142') + '" stroke-width="1.5"/><circle cx="' + n(q[0]) + '" cy="' + n(q[1] + 6) + '" r="7" fill="' + (night ? '#FFF1C8' : C('#F6F1E4')) + '"/>'; if (night) o += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1] + 6) + '" r="20" fill="#FFE9BF" opacity=".25"/>'; }
          o += FR(ox0 + 0.2, ox1 - 0.2, 0.15, 1.05, dd2 + 0.5, dim('#7D8A9B'));
          o += FR(ox0 + 0.2, ox1 - 0.2, 0.98, 1.05, dd2 + 0.5, dim('#AEB6C2'));
          [ox0 + 0.35, ox0 + 0.75].forEach(function (cx2, ci) { var cp2 = P(cx2, 0.38, dd2 - 0.1), cs2 = S(dd2 - 0.1); o += '<circle cx="' + n(cp2[0]) + '" cy="' + n(cp2[1]) + '" r="' + n(0.2 * cs2) + '" fill="none" stroke="' + C(ci ? '#C8332B' : '#E7B04A') + '" stroke-width="' + n(0.09 * cs2) + '"/>'; });
        } else if (sh.kind === 'tea') {
          o += FR(ox0, ox1, 1.6, 2.4, dI - 0.05, dim('#B9875A'));
          for (x = ox0 + 0.1; x < ox1 - 0.25; x += 0.28) o += FR(x, x + 0.2, 1.68, 1.95, dI - 0.06, dim(['#E7B04A', '#E36F5C', '#F2D16B', '#7BC18E'][Math.floor(r() * 4)]), 3);
          var td = dd2 + 0.25, tsc = S(td);
          o += FR(ox0 + 0.1, ox1 - 0.1, 0.15, 1.0, td, dim('#9A6B43'));
          o += FR(ox0 + 0.1, ox1 - 0.1, 0.92, 1.0, td, dim('#B9875A'));
          var kp = P(ox0 + 0.7, 1.0, td);
          o += R(kp[0] - 0.22 * tsc, kp[1] - 0.12 * tsc, 0.44 * tsc, 0.12 * tsc, C('#3A4356'), 3);
          o += '<path d="M' + n(kp[0] - 0.16 * tsc) + ' ' + n(kp[1] - 0.12 * tsc) + 'C' + n(kp[0] - 0.2 * tsc) + ' ' + n(kp[1] - 0.4 * tsc) + ' ' + n(kp[0] + 0.2 * tsc) + ' ' + n(kp[1] - 0.4 * tsc) + ' ' + n(kp[0] + 0.16 * tsc) + ' ' + n(kp[1] - 0.12 * tsc) + 'Z" fill="' + C('#C9CFD8') + '"/><path d="M' + n(kp[0] + 0.15 * tsc) + ' ' + n(kp[1] - 0.25 * tsc) + 'l' + n(0.14 * tsc) + ' -' + n(0.08 * tsc) + '" stroke="' + C('#AEB6C2') + '" stroke-width="5"/>';
          o += '<path d="M' + n(kp[0]) + ' ' + n(kp[1] - 0.45 * tsc) + 'c-10 -16 10 -24 0 -40 c-8 -12 8 -20 2 -32" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>';
          for (x = ox0 + 1.3; x < ox1 - 0.3; x += 0.38) { var jp = P(x, 1.0, td); o += R(jp[0], jp[1] - 0.3 * tsc, 0.24 * tsc, 0.3 * tsc, C('#DCE7EC'), 4, 'opacity=".9"') + R(jp[0] + 3, jp[1] - 0.2 * tsc, 0.24 * tsc - 6, 0.17 * tsc, C(['#E7B04A', '#F2D16B', '#E36F5C'][Math.floor(r() * 3)]), 3) + R(jp[0] + 2, jp[1] - 0.34 * tsc, 0.24 * tsc - 4, 0.05 * tsc, C('#C8161E'), 2); }
          // tin shade awning (underside visible)
          var a0d = dd2 - 0.02, a1d = dd2 - 1.2;
          o += poly([P(x0 - 0.05, 2.7, a0d), P(x1, 2.7, a0d), P(x1, 2.5, a1d), P(x0 - 0.05, 2.5, a1d)], C('#61768C'));
          var corr = ''; for (x = x0; x < x1; x += 0.15) { p = P(x, 2.7, a0d); q = P(x, 2.5, a1d); corr += 'M' + n(p[0]) + ' ' + n(p[1]) + 'L' + n(q[0]) + ' ' + n(q[1]); }
          o += '<path d="' + corr + '" stroke="' + C('#7F95AA') + '" stroke-width="4" opacity=".75"/>';
          o += FR(x0 - 0.05, x1, 2.44, 2.5, a1d, C('#7F95AA'));
          [x0 + 0.1, x1 - 0.1].forEach(function (px) { var s0 = P(px, 0, a1d + 0.05), s1 = P(px, 2.45, a1d + 0.05); o += '<path d="M' + n(s0[0]) + ' ' + n(s0[1]) + 'V' + n(s1[1]) + '" stroke="' + C('#4A5568') + '" stroke-width="5"/>'; });
          var bp = P(ox0 + 1.0, 0, dd2 - 1.0), bs2 = S(dd2 - 1.0);
          o += R(bp[0], bp[1] - 0.45 * bs2, 1.6 * bs2, 0.07 * bs2, C('#9A6B43'), 2) + R(bp[0] + 0.1 * bs2, bp[1] - 0.45 * bs2, 0.06 * bs2, 0.45 * bs2, C('#7A5233')) + R(bp[0] + 1.44 * bs2, bp[1] - 0.45 * bs2, 0.06 * bs2, 0.45 * bs2, C('#7A5233'));
        }
        if (!night) o += FR(ox0, ox1, 0.15, 2.55, dd2, '#1A2238', 0, 'opacity="' + (rain ? 0.08 : 0.12) + '"');
        else o += FR(ox0, ox1, 0.15, 2.55, dd2, warm, 0, 'opacity=".08"');
        o += FR(ox0 - 0.04, ox1 + 0.04, 2.55, 2.72, dd2 - 0.03, C('#9AA3AF'));
        o += FR(ox0 - 0.04, ox1 + 0.04, 2.55, 2.58, dd2 - 0.03, C('#6B7686'));
        o += FR(ox0 - 0.05, ox0 + 0.02, 0.15, 2.55, dd2 - 0.02, C('#8F98A5')) + FR(ox1 - 0.02, ox1 + 0.05, 0.15, 2.55, dd2 - 0.02, C('#8F98A5'));
        // signboard
        var sd = dd2 - 0.08, sb0 = P(x0 + 0.04, 3.45, sd), sb1 = P(x1 - 0.04, 2.78, sd);
        var sw2 = sb1[0] - sb0[0], sh2 = sb1[1] - sb0[1];
        if (night) o += R(sb0[0] - 16, sb0[1] - 16, sw2 + 32, sh2 + 32, mix(sc[0], '#FFFFFF', 0.4), 16, 'opacity=".32" filter="url(#' + ID + '_b18)"');
        o += R(sb0[0], sb0[1], sw2, sh2, night ? mix(sc[0], '#FFFFFF', 0.12) : C(sc[0]), 4);
        o += R(sb0[0], sb1[1] - 0.07 * s2, sw2, 0.07 * s2, night ? mix(sc[0], '#1F2A44', 0.15) : C(mix(sc[0], '#1F2A44', 0.25)), 0);
        o += R(sb0[0] + 4, sb0[1] + 4, sw2 - 8, sh2 * 0.35, '#FFFFFF', 3, 'opacity=".12"');
        var tcx = sb0[0] + sw2 / 2, avail = sw2 - 36;
        var fsBig = Math.min(0.29 * s2, avail / tw(sh.big, 1)), fsSm = Math.min(0.11 * s2, avail / tw(sh.small, 1));
        var tc1 = night ? sc[1] : C(sc[1]), tc2 = night ? sc[2] : C(sc[2]);
        o += txt(tcx, sb0[1] + sh2 * 0.55, sh.big, fsBig, tc1, 600);
        o += txt(tcx, sb0[1] + sh2 * 0.83, sh.small, fsSm, tc2, 500, 'letter-spacing="1"');
        o += poly([P(x0 + 0.04, 2.78, sd), P(x1 - 0.04, 2.78, sd), P(x1 - 0.04, 2.78, dd2), P(x0 + 0.04, 2.78, dd2)], C('#3E4A60'));
        row += o;
      });
      [[-9.8, -9.6], [-6.55, -6.25], [-3.6, -3.3], [-0.9, -0.75], [2.4, 2.6], [5.5, 5.75], [9.6, 9.8]].forEach(function (pl) { row += FR(pl[0], pl[1], 0.15, 2.72, dSF - 0.04, C('#E9DCC6')); });
      // cable bundle along facades
      var cb2 = '';
      [3.62, 3.68].forEach(function (ch, ci) { for (x = -11; x < 11; x += 1.6) { var c0 = P(x, ch, dSF - 0.1), c1 = P(x + 1.6, ch, dSF - 0.1); cb2 += 'M' + n(c0[0]) + ' ' + n(c0[1]) + 'Q' + n((c0[0] + c1[0]) / 2) + ' ' + n(c0[1] + 6 + ci * 3) + ' ' + n(c1[0]) + ' ' + n(c1[1]); } });
      row += '<path d="' + cb2 + '" stroke="' + (night ? '#0A0F1C' : C('#232A38')) + '" stroke-width="2.5" fill="none"/>';
      // festive bunting along the shop row (gali to tea stall), bulbs glow at night
      var bun = '', bcol = ['#E36F5C', '#F2D16B', '#5AA0D8', '#7BC18E', '#B48ED6', '#E7B04A'];
      [[-3.3, -0.9], [-0.9, 2.5], [2.5, 5.6], [5.6, 9.8]].forEach(function (sp, k) {
        var c0 = P(sp[0], 3.82, dSF - 0.3), c1 = P(sp[1], 3.82, dSF - 0.3);
        var bq = qcurve(c0[0], c0[1], c1[0], c1[1], 12);
        bun += qpath(bq, C('#3A4356'), 1.3);
        var N = Math.max(4, Math.round((c1[0] - c0[0]) / 34));
        for (i = 0; i < N; i++) {
          var t = (i + 0.2) / N, a = qpt(bq, t), b2 = qpt(bq, t + 0.6 / N);
          bun += '<path d="M' + n(a[0]) + ' ' + n(a[1]) + 'L' + n(b2[0]) + ' ' + n(b2[1]) + 'L' + n((a[0] + b2[0]) / 2) + ' ' + n((a[1] + b2[1]) / 2 + 26) + 'Z" fill="' + C(bcol[(i + k) % 6]) + '"/>';
          if (night) { var lb2 = qpt(bq, t - 0.2 / N); bun += '<circle cx="' + n(lb2[0]) + '" cy="' + n(lb2[1] + 2) + '" r="3.4" fill="' + ['#FFE08A', '#FF9C6E', '#9FE3FF'][i % 3] + '"/><circle cx="' + n(lb2[0]) + '" cy="' + n(lb2[1] + 2) + '" r="10" fill="#FFE08A" opacity=".2"/>'; }
        }
      });
      row += bun;
      row += R(0, ySF - 2, 2400, 18, 'url(#' + ID + '_down)');
      // aerial haze over the far row to separate depth layers
      row += R(0, 0, 2400, ySF + 2, haze, 0, 'opacity="' + (night ? 0.05 : rain ? 0.16 : 0.1) + '"');
      back += row;

      // ---------- far poles ----------
      var poles = '';
      [-6.4, 6.9].forEach(function (px) {
        var pp = P(px, 0, dFP), pw2 = 0.22 * S(dFP);
        poles += R(pp[0] - pw2 / 2, -10, pw2, pp[1] + 10, C('#B7B2A9')) + R(pp[0] + pw2 * 0.1, -10, pw2 * 0.35, pp[1] + 10, C('#9C978E'));
        poles += R(pp[0] - pw2 / 2, pp[1] - 0.9 * S(dFP), pw2, 0.3 * S(dFP), C('#F3EBDD')) + R(pp[0] - pw2 / 2, pp[1] - 0.6 * S(dFP), pw2, 0.3 * S(dFP), C('#2E333D'));
        var tb = P(px, 4.3, dFP - 0.1); poles += R(tb[0] - pw2 * 0.9, tb[1], pw2 * 1.8, 0.4 * S(dFP), C('#7D8794'), 3);
      });
      back += poles;

      // ---------- vehicles + carts (mid layer) ----------
      var veh = '';
      var cyp = P(5.1, 0, dFP + 0.15);
      veh += cycle(cyp[0], cyp[1], S(dFP + 0.15) / 100, C);
      var fcd = 11.6, fc = P(-3.15, 0, fcd);
      veh += fruitCart(fc[0], fc[1], S(fcd) / 100, C, night);
      var bkd = 9.75;
      [[-7.6, '#8E2B2B'], [-6.45, '#2F6EA6'], [-5.35, '#1F2A44']].forEach(function (bb2, bi2) { var dd3 = bkd + bi2 * 0.25, bp2 = P(bb2[0], -0.15, dd3); veh += bike(bp2[0], bp2[1], S(dd3) / 100, C, bb2[1], night); });
      var ad = 9.3, ap = P(0.62, -0.15, ad);
      veh += auto(ap[0], ap[1], S(ad) / 100, C, night);
      mid += veh;

      // ---------- near footpath ----------
      var dNF = 3.3, yNC = P(0, 0, dNC)[1], yNt = P(0, 0, 4.45)[1];
      var nf = '';
      nf += R(0, yNC, 2400, 1350 - yNC, C(rain ? '#9E978C' : '#C3BAAC'));
      var slab = '', alt = '';
      var drows = [];
      for (d = 4.45; d > dNF; d -= 0.45) drows.push(d);
      drows.forEach(function (d0, ri) {
        var d1 = Math.max(d0 - 0.45, dNF);
        var off = (ri % 2) * 0.3;
        for (x = -12 + off; x < 12; x += 0.6) {
          var a = P(x, 0, d0), b2 = P(x + 0.6, 0, d1);
          if (b2[0] < -100 || a[0] > 2500) continue;
          if ((Math.round((x - off) / 0.6) + ri) % 3 === 0) alt += pth([a, P(x + 0.6, 0, d0), b2, P(x, 0, d1)]);
          var c2 = P(x, 0, d1);
          slab += 'M' + n(a[0]) + ' ' + n(a[1]) + 'L' + n(c2[0]) + ' ' + n(c2[1]);
        }
        var e = P(0, 0, d0); slab += 'M0 ' + n(e[1]) + 'H2400';
      });
      nf += '<path d="' + alt + '" fill="' + C(rain ? '#8F887E' : '#B5AB9C') + '" opacity=".5"/>';
      nf += '<path d="' + slab + '" stroke="' + C('#A0968A') + '" stroke-width="2" opacity=".55"/>';
      var wr = mulberry32(42), wear = '';
      for (i = 0; i < 30; i++) { d = 3.5 + wr() * 0.9; x = -5 + wr() * 10; p = P(x, 0, d); wear += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n((0.1 + wr() * 0.35) * S(d)) + '" ry="' + n((0.03 + wr() * 0.04) * S(d)) + '"/>'; }
      nf += '<g fill="' + C('#8E8476') + '" opacity=".12">' + wear + '</g>';
      var lf = '';
      for (i = 0; i < 9; i++) { d = 3.7 + wr() * 0.7; x = -4.4 + wr() * 2.2; p = P(x, 0, d); var an = wr() * 180; lf += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n(0.045 * S(d)) + '" ry="' + n(0.016 * S(d)) + '" transform="rotate(' + n(an) + ' ' + n(p[0]) + ' ' + n(p[1]) + ')" fill="' + C(['#A89A5A', '#8C9A5A', '#B08A52'][i % 3]) + '" opacity=".8"/>'; }
      nf += lf;
      nf += R(0, yNC, 2400, yNt - yNC, C('#D9D3C6'));
      var ncp = '';
      for (x = -12; x < 12; x += 1.2) { var n0 = P(x, 0, dNC), n1 = P(x + 0.6, 0, 4.45), n2 = P(x + 0.6, 0, dNC); if (n2[0] < 0 || n0[0] > 2400) continue; ncp += 'M' + n(n0[0]) + ' ' + n(yNC) + 'H' + n(n2[0]) + 'L' + n(n1[0]) + ' ' + n(yNt) + 'H' + n(P(x, 0, 4.45)[0]) + 'Z'; }
      nf += '<path d="' + ncp + '" fill="' + C('#2E333D') + '"/>';
      nf += R(0, yNC - 2, 2400, 4, '#0B1020', 0, 'opacity=".3"');
      back += nf;

      // ---------- lighting ----------
      if (!night && !rain) {
        var dsh = '', dr2 = mulberry32(71);
        for (i = 0; i < 16; i++) { d = 3.5 + dr2() * 3.2; x = -4.6 + dr2() * 4.4; p = P(x, d > dNC ? -0.15 : 0, d); dsh += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="' + n((0.35 + dr2() * 0.6) * S(d)) + '" ry="' + n((0.08 + dr2() * 0.1) * S(d)) + '"/>'; }
        back += '<g fill="#1F2A44" opacity=".1">' + dsh + '</g>';
        back += R(0, 0, 2400, 1350, 'url(#' + ID + '_sun)');
      }
      if (night) {
        shops.forEach(function (sh) { var c0 = P((sh.x0 + sh.x1) / 2, 0, dFC + 0.6); back += '<ellipse cx="' + n(c0[0]) + '" cy="' + n(c0[1] - 6) + '" rx="' + n((sh.x1 - sh.x0) * 0.6 * S(dFC)) + '" ry="40" fill="' + warm + '" opacity=".22" filter="url(#' + ID + '_b18)"/>'; });
        p = P(2.6, 0, 4.2);
        back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" rx="560" ry="120" fill="url(#' + ID + '_pool)"/>';
        [-6.4, 6.9].forEach(function (px) {
          p = P(px, 0, dFP); back += '<ellipse cx="' + n(p[0]) + '" cy="' + n(p[1] + 30) + '" rx="260" ry="50" fill="url(#' + ID + '_pool)"/>';
          var t0 = P(px + 0.6, 7.5, dFP), b0 = P(px, -0.15, dFP - 0.6);
          back += '<path d="M' + n(t0[0] - 10) + ' ' + n(t0[1]) + 'L' + n(b0[0] - 250) + ' ' + n(b0[1]) + 'H' + n(b0[0] + 280) + 'L' + n(t0[0] + 10) + ' ' + n(t0[1]) + 'Z" fill="#FFD58A" opacity=".06"/>';
        });
      }

      // ---------- rain ----------
      if (rain) {
        back += R(0, yFCb, 2400, 1350 - yFCb, 'url(#' + ID + '_wet)');
        var rf = '', rcol = { sweets: 'E36F5C', kirana: 'F2D16B', fashion: 'B48ED6', elec: '7FC1F0', tea: '7BC18E' };
        shops.forEach(function (sh) {
          var a = P(sh.x0 + 0.3, 0, dFC - 0.1), b2 = P(sh.x1 - 0.3, 0, dFC - 0.1);
          rf += R(a[0], yFCb + 4, b2[0] - a[0], 200, 'url(#' + ID + '_r' + rcol[sh.kind] + ')', 0, 'opacity="' + (night ? 0.7 : 0.35) + '" filter="url(#' + ID + '_b6)"');
          if (night) rf += R(a[0] + 20, yFCb + 4, b2[0] - a[0] - 40, 160, 'url(#' + ID + '_rFFD58A)', 0, 'opacity=".5" filter="url(#' + ID + '_b6)"');
        });
        back += rf;
        var rr = mulberry32(64), shs = '';
        for (i = 0; i < 120; i++) { d = 5.2 + rr() * 5; x = -12 + rr() * 24; p = P(x, -0.15, d); shs += 'M' + n(p[0]) + ' ' + n(p[1]) + 'h' + n((0.3 + rr() * 0.9) * S(d)); }
        back += '<path d="' + shs + '" stroke="' + (night ? '#C9D6F0' : '#EEF2F6') + '" stroke-width="2" opacity=".2" stroke-linecap="round"/>';
        var pud = '';
        [[-4.6, 6.0, 1.8, 0.6], [3.2, 5.5, 1.4, 0.5], [6.8, 8.2, 2.2, 0.6], [-1.0, 3.9, 1.0, 0.4], [-7.6, 4.0, 1.3, 0.4]].forEach(function (u) {
          var hh = u[1] > dNC ? -0.15 : 0;
          var c0 = P(u[0], hh, u[1]), sc2 = S(u[1]);
          var rx = u[2] * sc2 / 2, ry = (P(u[0], hh, u[1] - u[3] / 2)[1] - P(u[0], hh, u[1] + u[3] / 2)[1]) / 2;
          pud += '<ellipse cx="' + n(c0[0]) + '" cy="' + n(c0[1]) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + (night ? '#34456F' : '#C9D1DB') + '" opacity=".7"/>';
          pud += '<ellipse cx="' + n(c0[0]) + '" cy="' + n(c0[1] - ry * 0.15) + '" rx="' + n(rx * 0.55) + '" ry="' + n(ry * 0.4) + '" fill="' + (night ? warm : '#FFFFFF') + '" opacity=".25" filter="url(#' + ID + '_b6)"/>';
          for (var k3 = 0; k3 < 3; k3++) { var rx2 = c0[0] + (rr() - 0.5) * rx, ry2 = c0[1] + (rr() - 0.5) * ry * 0.6, rs = (0.6 + rr()) * sc2 / 400; pud += '<ellipse cx="' + n(rx2) + '" cy="' + n(ry2) + '" rx="' + n(14 * rs) + '" ry="' + n(4 * rs) + '" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".45"/>'; }
        });
        back += pud;
        var rb = '', rr2 = mulberry32(123);
        for (i = 0; i < 560; i++) { x = rr2() * 2600 - 150; y = rr2() * 1350; var L = 24 + rr2() * 38; rb += 'M' + n(x) + ' ' + n(y) + 'l' + n(L * 0.18) + ' ' + n(L); }
        back += '<path d="' + rb + '" stroke="' + (night ? '#AFC2E6' : '#F4F7FA') + '" stroke-width="1.5" stroke-linecap="round" opacity="' + (night ? 0.3 : 0.38) + '"/>';
        back += R(0, 300, 2400, 600, night ? '#40507A' : '#E4E8EE', 0, 'opacity=".12" filter="url(#' + ID + '_b40)"');
      }

      // ---------- near tree (left) ----------
      var td2 = 4.75, tp = P(-3.1, 0, td2), tsz = S(td2);
      var trunk = C('#7A5A45'), trunkS = C('#5E4434'), trunkH = C('#94725A');
      var tree = '';
      tree += '<ellipse cx="' + n(tp[0]) + '" cy="' + n(tp[1]) + '" rx="' + n(0.6 * tsz) + '" ry="' + n(0.1 * tsz) + '" fill="#0B1020" opacity=".25"/>';
      // branches into the canopy
      tree += '<path d="M' + n(tp[0] + 10) + ' 420 C' + n(tp[0] + 70) + ' 330 ' + n(tp[0] + 170) + ' 300 ' + n(tp[0] + 300) + ' 250 M' + n(tp[0] - 10) + ' 380 C' + n(tp[0] - 40) + ' 300 ' + n(tp[0] - 70) + ' 240 ' + n(tp[0] - 110) + ' 170 M' + n(tp[0] + 20) + ' 330 C' + n(tp[0] + 60) + ' 250 ' + n(tp[0] + 90) + ' 190 ' + n(tp[0] + 150) + ' 120" stroke="' + trunk + '" stroke-width="20" fill="none" stroke-linecap="round"/>';
      tree += '<path d="M' + n(tp[0] - 0.2 * tsz) + ' ' + n(tp[1]) + 'C' + n(tp[0] - 0.16 * tsz) + ' ' + n(tp[1] - 1.5 * tsz) + ' ' + n(tp[0] - 0.12 * tsz) + ' ' + n(tp[1] - 2.2 * tsz) + ' ' + n(tp[0] - 0.14 * tsz) + ' 300 L' + n(tp[0] + 0.12 * tsz) + ' 300 C' + n(tp[0] + 0.08 * tsz) + ' ' + n(tp[1] - 2.2 * tsz) + ' ' + n(tp[0] + 0.12 * tsz) + ' ' + n(tp[1] - 1.5 * tsz) + ' ' + n(tp[0] + 0.2 * tsz) + ' ' + n(tp[1]) + 'Z" fill="' + trunk + '"/>';
      tree += '<path d="M' + n(tp[0] + 0.05 * tsz) + ' ' + n(tp[1]) + 'C' + n(tp[0] + 0.03 * tsz) + ' ' + n(tp[1] - 1.5 * tsz) + ' ' + n(tp[0] + 0.05 * tsz) + ' ' + n(tp[1] - 2.2 * tsz) + ' ' + n(tp[0] + 0.02 * tsz) + ' 300 L' + n(tp[0] + 0.12 * tsz) + ' 300 C' + n(tp[0] + 0.08 * tsz) + ' ' + n(tp[1] - 2.2 * tsz) + ' ' + n(tp[0] + 0.12 * tsz) + ' ' + n(tp[1] - 1.5 * tsz) + ' ' + n(tp[0] + 0.2 * tsz) + ' ' + n(tp[1]) + 'Z" fill="' + trunkS + '"/>';
      tree += '<path d="M' + n(tp[0] - 0.11 * tsz) + ' ' + n(tp[1] - 1.1 * tsz) + 'C' + n(tp[0] - 0.09 * tsz) + ' ' + n(tp[1] - 1.6 * tsz) + ' ' + n(tp[0] - 0.08 * tsz) + ' ' + n(tp[1] - 2.0 * tsz) + ' ' + n(tp[0] - 0.09 * tsz) + ' ' + n(tp[1] - 2.4 * tsz) + '" stroke="' + trunkH + '" stroke-width="' + n(0.035 * tsz) + '" fill="none" opacity=".6"/>';
      tree += R(tp[0] - 0.205 * tsz, tp[1] - 0.95 * tsz, 0.41 * tsz, 0.5 * tsz, C('#F4F1EA')) + R(tp[0] - 0.205 * tsz, tp[1] - 0.7 * tsz, 0.41 * tsz, 0.1 * tsz, C('#C8332B'));
      tree += R(tp[0] + 0.05 * tsz, tp[1] - 0.95 * tsz, 0.155 * tsz, 0.5 * tsz, C('#D9D3C6'), 0, 'opacity=".6"');
      var guard = '';
      for (i = 0; i <= 8; i++) { var ga = Math.PI * i / 8, gx2 = tp[0] - Math.cos(ga) * 0.4 * tsz, gy2 = Math.sin(ga) * 0.05 * tsz; guard += 'M' + n(gx2) + ' ' + n(tp[1] + gy2) + 'V' + n(tp[1] - 0.85 * tsz + gy2); }
      tree += '<path d="' + guard + '" stroke="' + C('#2B3242') + '" stroke-width="' + n(0.022 * tsz) + '" fill="none"/>';
      tree += '<ellipse cx="' + n(tp[0]) + '" cy="' + n(tp[1] - 0.85 * tsz) + '" rx="' + n(0.4 * tsz) + '" ry="' + n(0.05 * tsz) + '" fill="none" stroke="' + C('#2B3242') + '" stroke-width="' + n(0.025 * tsz) + '"/>';
      tree += '<ellipse cx="' + n(tp[0]) + '" cy="' + n(tp[1] - 0.45 * tsz) + '" rx="' + n(0.4 * tsz) + '" ry="' + n(0.05 * tsz) + '" fill="none" stroke="' + C('#2B3242') + '" stroke-width="' + n(0.018 * tsz) + '"/>';
      // canopy: leaf clumps with cel shading (shadow underside, base, sunlit tops)
      var cr2 = mulberry32(55), cS = '', cB = '', cH2 = '';
      var cg = C('#5E9256'), cgS = C('#3F6E40'), cgH = C('#8DBA72');
      var clumps = [[40, 60, 150], [210, 20, 140], [380, 70, 130], [520, 150, 110], [130, 190, 130], [300, 210, 120], [-40, 210, 110], [460, 260, 90], [600, 40, 100], [-30, -40, 120], [160, -60, 110], [420, -50, 110]];
      clumps.forEach(function (cl2) {
        var k = 6;
        for (var m = 0; m < k; m++) {
          var an2 = m / k * Math.PI * 2 + cr2(), rd2 = cl2[2] * (0.35 + cr2() * 0.3);
          var ccx = cl2[0] + Math.cos(an2) * rd2, ccy = cl2[1] + Math.sin(an2) * rd2 * 0.7, crr = cl2[2] * (0.45 + cr2() * 0.2);
          cS += '<circle cx="' + n(ccx + crr * 0.1) + '" cy="' + n(ccy + crr * 0.22) + '" r="' + n(crr) + '"/>';
          cB += '<circle cx="' + n(ccx) + '" cy="' + n(ccy) + '" r="' + n(crr * 0.94) + '"/>';
        }
        var hr = cl2[2] * 0.6;
        cH2 += '<circle cx="' + n(cl2[0] - cl2[2] * 0.22) + '" cy="' + n(cl2[1] - cl2[2] * 0.26) + '" r="' + n(hr) + '"/><circle cx="' + n(cl2[0] + cl2[2] * 0.12) + '" cy="' + n(cl2[1] - cl2[2] * 0.36) + '" r="' + n(hr * 0.62) + '"/>';
      });
      tree += '<g fill="' + cgS + '">' + cS + '</g><g fill="' + cg + '">' + cB + '</g><g fill="' + cgH + '" opacity=".55">' + cH2 + '</g>';
      if (night) tree += '<g fill="#0B1020" opacity=".25">' + cB + '</g>';
      mid += tree;

      // ---------- near electric pole (right) + wires ----------
      var pd3 = 4.55, pp3 = P(2.78, 0, pd3), pw3 = 0.24 * S(pd3);
      mid += '<ellipse cx="' + n(pp3[0]) + '" cy="' + n(pp3[1]) + '" rx="' + n(pw3 * 1.2) + '" ry="10" fill="#0B1020" opacity=".25"/>';
      mid += R(pp3[0] - pw3 / 2, -20, pw3, pp3[1] + 20, C('#B7B2A9')) + R(pp3[0] + pw3 * 0.15, -20, pw3 * 0.35, pp3[1] + 20, C('#9C978E'));
      mid += R(pp3[0] - pw3 / 2, pp3[1] - 0.9 * S(pd3), pw3, 0.3 * S(pd3), C('#F3EBDD')) + R(pp3[0] - pw3 / 2, pp3[1] - 0.6 * S(pd3), pw3, 0.3 * S(pd3), C('#2E333D'));
      p = P(2.78, 1.9, pd3 - 0.13);
      mid += R(p[0] - pw3 * 0.55, p[1], pw3 * 1.1, 0.5 * S(pd3), C('#F6F1E4'), 2, 'transform="rotate(-2 ' + n(p[0]) + ' ' + n(p[1]) + ')"') + R(p[0] - pw3 * 0.4, p[1] + 16, pw3 * 0.8, 12, C('#1E9E62'), 1) + R(p[0] - pw3 * 0.4, p[1] + 40, pw3 * 0.7, 7, C('#6B7686')) + R(p[0] - pw3 * 0.4, p[1] + 56, pw3 * 0.6, 7, C('#6B7686'));
      p = P(2.78, 3.0, pd3 - 0.15);
      mid += R(p[0] - pw3 * 0.75, p[1], pw3 * 1.5, 0.35 * S(pd3), C('#7D8794'), 4) + R(p[0] - pw3 * 0.75, p[1], pw3 * 1.5, 12, C('#9AA3AF'), 4);
      var coil = '';
      for (i = 0; i < 4; i++) coil += '<ellipse cx="' + n(p[0] - 6 + i * 4) + '" cy="' + n(p[1] - 70 - i * 4) + '" rx="' + n(54 - i * 4) + '" ry="' + n(30 - i * 2) + '" fill="none" stroke="' + C('#1F2633') + '" stroke-width="3"/>';
      mid += coil;
      var wc = night ? '#0A0F1C' : C('#232A38'), ws = '';
      var t2 = P(-6.4, 4.4, dFP), t3 = P(6.9, 4.4, dFP);
      ws += qpath(qcurve(pp3[0] - 6, -10, t3[0], t3[1], 30), wc, 2.6, 0.9) + qpath(qcurve(pp3[0], 20, t3[0], t3[1] + 8, 40), wc, 2.2, 0.85);
      ws += qpath(qcurve(pp3[0] - 10, 0, t2[0], t2[1], 90), wc, 2.6, 0.9) + qpath(qcurve(pp3[0] - 4, 36, t2[0], t2[1] + 10, 110), wc, 2.2, 0.85);
      ws += qpath(qcurve(t2[0], t2[1], t3[0], t3[1], 22), wc, 2.2, 0.85) + qpath(qcurve(t2[0], t2[1] + 9, t3[0], t3[1] + 9, 30), wc, 1.8, 0.8);
      ws += qpath(qcurve(-40, 330, t2[0], t2[1], 20), wc, 2.2, 0.85) + qpath(qcurve(t3[0], t3[1], 2440, 380, 20), wc, 2.2, 0.85);
      [[-8.4, 3.7], [-4.0, 3.7]].forEach(function (sv) { var s4 = P(sv[0], sv[1], dSF - 0.1); ws += qpath(qcurve(t2[0], t2[1] + 4, s4[0], s4[1], 18), wc, 1.6, 0.8); });
      [[4.0, 3.7], [8.4, 3.7]].forEach(function (sv) { var s4 = P(sv[0], sv[1], dSF - 0.1); ws += qpath(qcurve(t3[0], t3[1] + 4, s4[0], s4[1], 18), wc, 1.6, 0.8); });
      mid += ws;
      if (!night && !rain) {
        var bw = qcurve(t2[0], t2[1], t3[0], t3[1], 22), bdd = '';
        [0.55, 0.585, 0.66].forEach(function (t, k) { var bpt = qpt(bw, t); bdd += '<g transform="translate(' + n(bpt[0]) + ' ' + n(bpt[1] + 1) + ') scale(' + (k === 1 ? -0.75 : 0.75) + ' 0.75)"><path d="M-12 0c2-12 10-18 20-16c6-6 14-4 15 1c-5 1-7 3-8 6c0 7-8 11-16 10c-5 0-9-1-11-1Z" fill="' + C('#2A3142') + '"/><path d="M-12 -1l-10 4" stroke="' + C('#2A3142') + '" stroke-width="4"/></g>'; });
        mid += bdd;
      }
      if (night) mid += '<ellipse cx="' + n(pp3[0] - 40) + '" cy="-40" rx="280" ry="220" fill="url(#' + ID + '_pool)" opacity=".8"/>';

      // ---------- FORE: near rain ----------
      if (rain) {
        var frr = mulberry32(321), f1 = '', f2 = '';
        for (i = 0; i < 260; i++) { x = frr() * 2700 - 200; y = frr() * 1400 - 60; var L2 = 60 + frr() * 110; f1 += 'M' + n(x) + ' ' + n(y) + 'l' + n(L2 * 0.18) + ' ' + n(L2); }
        for (i = 0; i < 90; i++) { x = frr() * 2700 - 200; y = frr() * 1400 - 60; var L3 = 120 + frr() * 160; f2 += 'M' + n(x) + ' ' + n(y) + 'l' + n(L3 * 0.18) + ' ' + n(L3); }
        fore += '<path d="' + f1 + '" stroke="' + (night ? '#C3D3F2' : '#FFFFFF') + '" stroke-width="2.2" stroke-linecap="round" opacity="' + (night ? 0.32 : 0.4) + '"/>';
        fore += '<path d="' + f2 + '" stroke="' + (night ? '#D5E1F7' : '#FFFFFF') + '" stroke-width="3.5" stroke-linecap="round" opacity=".16"/>';
      }

      return { back: back, mid: mid, front: front, fore: fore };
    }
  };
})();
