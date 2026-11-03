/* etoolbox – animated backgrounds: particle network (homepage hero) + 3D dot wave (rest of every page).
   1) Homepage hero (#net-bg inside .hero-band): fuller animation.
   2) Every page: a faint fixed background behind the content (#page-net). The hero and footer have
      solid backgrounds, so it only shows between them. Colours follow the site theme (teal #2a9d8f,
      orange #ff6b35, navy #14213d). Pauses when the tab is hidden, runs at ~30 fps, and draws one still
      frame for people who prefer reduced motion. */
(function () {
  "use strict";
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  var TEAL = [42, 157, 143], ORANGE = [255, 107, 53], NAVY = [20, 33, 61], CYAN = [94, 234, 212];

  function Net(canvas, opts) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
    var nodes = [], links = [], sparks = [], raf = 0, last = 0, acc = 0, visible = true;
    function pal() {
      var d = isDark(), k = opts.strength;
      return d
        ? { node: CYAN, warm: [255, 150, 100], link: CYAN, linkA: 0.30 * k, glow: 0.85 * k, grid: "rgba(94,234,212," + 0.05 * k + ")" }
        : { node: TEAL, warm: ORANGE, link: opts.page ? NAVY : TEAL, linkA: (opts.page ? 0.16 : 0.28) * k, glow: 0.55 * k, grid: "rgba(20,33,61," + 0.045 * k + ")" };
    }
    function size() {
      var w = opts.page ? window.innerWidth : canvas.parentElement.getBoundingClientRect().width;
      var h = opts.page ? window.innerHeight : canvas.parentElement.getBoundingClientRect().height;
      return [Math.max(320, w), Math.max(300, h)];
    }
    function build() {
      var s = size(); W = s[0]; H = s[1];
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var count = Math.round(Math.min(opts.max, Math.max(opts.min, W * H / opts.density)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        var x = Math.random() * W, y = Math.random() * H;
        // keep the reading column fairly clear: push most nodes towards the sides
        var clear = opts.page ? 0.3 : 0.22;
        if (Math.abs(x - W / 2) < W * clear && Math.random() < (opts.page ? 0.8 : 0.7)) x = Math.random() < 0.5 ? Math.random() * W * (0.5 - clear) : W - Math.random() * W * (0.5 - clear);
        nodes.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, r: 1.4 + Math.random() * 2, warm: Math.random() < 0.14, ph: Math.random() * 6.28 });
      }
      links = []; var seen = {};
      nodes.forEach(function (a, i) {
        nodes.map(function (b, j) { return { j: j, d: Math.hypot(a.x - b.x, a.y - b.y) }; })
          .filter(function (o) { return o.j !== i; }).sort(function (p, q) { return p.d - q.d; }).slice(0, 2 + (i % 2))
          .forEach(function (o) { var k = Math.min(i, o.j) + "-" + Math.max(i, o.j); if (!seen[k] && o.d < Math.max(W, H) * 0.45) { seen[k] = 1; links.push([Math.min(i, o.j), Math.max(i, o.j)]); } });
      });
      sparks = [];
      for (var s2 = 0; s2 < Math.min(opts.sparks, links.length * 1.5); s2++) sparks.push({ l: Math.floor(Math.random() * links.length), t: Math.random(), v: 0.0012 + Math.random() * 0.003 });
    }
    function draw(dt) {
      var P = pal(); ctx.clearRect(0, 0, W, H);
      if (opts.grid) {
        ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.beginPath();
        for (var gx = 0; gx < W; gx += 44) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); }
        for (var gy = 0; gy < H; gy += 44) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); }
        ctx.stroke();
      }
      nodes.forEach(function (n) {
        n.x += n.vx * dt * 0.06; n.y += n.vy * dt * 0.06; n.ph += dt * 0.002;
        if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      links.forEach(function (lk) {
        var a = nodes[lk[0]], b = nodes[lk[1]], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(4, Math.floor(d / 9)), fade = Math.max(0, 1 - d / (Math.max(W, H) * 0.5));
        for (var i = 1; i < steps; i++) {
          var t = i / steps; ctx.fillStyle = rgba(P.link, P.linkA * fade * (0.55 + 0.45 * Math.sin(i * 1.7 + a.ph)));
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.9 + 0.5 * Math.abs(Math.sin(i * 0.9)), 0, 6.283); ctx.fill();
        }
      });
      sparks.forEach(function (s) {
        s.t += s.v * dt * 0.06; if (s.t > 1) { s.t = 0; s.l = Math.floor(Math.random() * links.length); }
        var lk = links[s.l]; if (!lk) return; var a = nodes[lk[0]], b = nodes[lk[1]], x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 5); g.addColorStop(0, rgba(P.node, P.glow)); g.addColorStop(1, rgba(P.node, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
      });
      nodes.forEach(function (n) {
        var c = n.warm ? P.warm : P.node, pulse = 0.75 + 0.25 * Math.sin(n.ph), R = n.r * 5;
        var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, R); g.addColorStop(0, rgba(c, 0.55 * P.glow * pulse)); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgba(c, 0.9 * pulse * Math.min(1, opts.strength + 0.2)); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
        for (var k = 0; k < 6; k++) { var ang = n.ph * 0.3 + k * 1.047, rr = n.r * (2.5 + (k % 3)); ctx.fillStyle = rgba(c, 0.35 * opts.strength); ctx.fillRect(n.x + Math.cos(ang) * rr, n.y + Math.sin(ang) * rr, 1.2, 1.2); }
      });
    }
    function loop(ts) {
      var dt = Math.min(64, ts - (last || ts)); last = ts; acc += dt;
      if (acc >= opts.frameMs) { draw(acc); acc = 0; }
      raf = (!REDUCED && visible && !document.hidden) ? requestAnimationFrame(loop) : 0;
    }
    function start() { if (!raf && !REDUCED) { last = 0; raf = requestAnimationFrame(loop); } }
    build(); draw(16); start();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { build(); draw(16); }, 150); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
    if (!opts.page && "IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas.parentElement);
    var tt = document.getElementById("theme-toggle"); if (tt) tt.addEventListener("click", function () { setTimeout(function () { draw(16); }, 30); });
  }

  /* 3D wave of dots (page background): a grid of points on a moving wave surface seen in perspective. */
  function Wave(canvas) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1), raf = 0, last = 0, acc = 0, t = 0, pts = [];
    function build() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var cols = Math.round(Math.min(72, Math.max(36, W / 19))), rows = 30; pts = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var h = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453; h = h - Math.floor(h);
        pts.push({ u: c / (cols - 1) * 2 - 1, v: r / (rows - 1), warm: h > 0.968 });
      }
    }
    function draw(dt) {
      t += dt * 0.00035;
      var d = isDark(), base = d ? CYAN : TEAL, warm = d ? [255, 205, 120] : ORANGE, k = d ? 0.8 : 0.42;
      ctx.clearRect(0, 0, W, H);
      var top = H * 0.32, span = H * 0.78, far = 3.2;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], z = 1 + p.v * (far - 1), sc = 1 / z, depth = (sc - 1 / far) / (1 - 1 / far); // 1 = nearest row, 0 = farthest
        var x = p.u * 1.9;
        var y = Math.sin(x * 2.1 + t * 2.2) * 0.45 + Math.sin(z * 2.4 - t * 1.7) * 0.35 + Math.sin((x * 1.3 + z) + t * 1.1) * 0.25;
        var sx = W / 2 + x * W * 0.55 * sc, sy = top + span * depth - y * 70 * sc;
        if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
        var lift = (y + 1) / 2, size = 0.5 + 2.3 * sc * (0.7 + lift * 0.6), a = k * (0.2 + 0.7 * depth) * (0.55 + lift * 0.6);
        var col = p.warm ? warm : base;
        if (p.warm || size > 2.3) { var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 2.6); g.addColorStop(0, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, size * 2.6, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = rgba(col, Math.min(1, a)); ctx.beginPath(); ctx.arc(sx, sy, size, 0, 6.283); ctx.fill();
      }
    }
    function loop(ts) { var dt = Math.min(64, ts - (last || ts)); last = ts; acc += dt; if (acc >= 33) { draw(acc); acc = 0; } raf = (!REDUCED && !document.hidden) ? requestAnimationFrame(loop) : 0; }
    function start() { if (!raf && !REDUCED) { last = 0; raf = requestAnimationFrame(loop); } }
    build(); draw(16); start();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { build(); draw(16); }, 150); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
    var tt = document.getElementById("theme-toggle"); if (tt) tt.addEventListener("click", function () { setTimeout(function () { draw(16); }, 30); });
  }

  function init() {
    if (window.ETB_NO_NET) return;
    var hero = document.getElementById("net-bg");
    if (hero && hero.getContext) Net(hero, { page: false, strength: 1, min: 10, max: 26, density: 52000, sparks: 40, grid: true, frameMs: 16 });
    // Page-wide background (skip very small screens to save battery)
    if (window.innerWidth >= 560 && document.createElement("canvas").getContext) {
      var c = document.createElement("canvas"); c.id = "page-net"; c.className = "page-net"; c.setAttribute("aria-hidden", "true");
      document.body.insertBefore(c, document.body.firstChild);
      Wave(c);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
