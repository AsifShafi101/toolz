/* etoolbox – animated "particle network" background for the homepage hero.
   Soft glowing nodes joined by dotted links, with small particles travelling along the links.
   Light colours on the light theme, cyan glow on the dark theme. Pauses when off-screen or the
   tab is hidden, and draws a single still frame for people who prefer reduced motion. */
(function () {
  "use strict";
  var canvas = document.getElementById("net-bg"); if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d"), host = canvas.parentElement;
  var W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1), nodes = [], links = [], sparks = [], raf = 0, visible = true, last = 0;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function palette() {
    return dark()
      ? { node: [94, 234, 212], warm: [255, 160, 110], link: 0.32, glow: 0.9, grid: "rgba(94,234,212,0.05)" }
      : { node: [20, 160, 150], warm: [255, 120, 70], link: 0.28, glow: 0.55, grid: "rgba(20,33,61,0.045)" };
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  function build() {
    var r = host.getBoundingClientRect(); W = Math.max(320, r.width); H = Math.max(300, r.height);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var count = Math.round(Math.min(26, Math.max(10, W * H / 52000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      // keep the centre (where the heading and search sit) a little emptier
      var x = Math.random() * W, y = Math.random() * H;
      if (Math.abs(x - W / 2) < W * 0.22 && y > H * 0.15 && y < H * 0.8 && Math.random() < 0.7) x = Math.random() < 0.5 ? Math.random() * W * 0.28 : W - Math.random() * W * 0.28;
      nodes.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, r: 1.6 + Math.random() * 2.2, warm: Math.random() < 0.12, ph: Math.random() * 6.28 });
    }
    // connect each node to its 2–3 nearest neighbours
    links = []; var seen = {};
    nodes.forEach(function (a, i) {
      var near = nodes.map(function (b, j) { return { j: j, d: Math.hypot(a.x - b.x, a.y - b.y) }; }).filter(function (o) { return o.j !== i; }).sort(function (p, q) { return p.d - q.d; }).slice(0, 2 + (i % 2));
      near.forEach(function (o) { var k = Math.min(i, o.j) + "-" + Math.max(i, o.j); if (!seen[k] && o.d < Math.max(W, H) * 0.42) { seen[k] = 1; links.push([Math.min(i, o.j), Math.max(i, o.j)]); } });
    });
    sparks = [];
    for (var s = 0; s < Math.min(40, links.length * 1.5); s++) sparks.push({ l: Math.floor(Math.random() * links.length), t: Math.random(), v: 0.0012 + Math.random() * 0.003 });
  }

  function frame(ts) {
    var dt = Math.min(48, ts - (last || ts)); last = ts;
    var P = palette(); ctx.clearRect(0, 0, W, H);
    // faint grid
    ctx.strokeStyle = P.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (var gx = 0; gx < W; gx += 44) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); }
    for (var gy = 0; gy < H; gy += 44) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); }
    ctx.stroke();
    // move nodes gently, bouncing off the edges
    nodes.forEach(function (n) {
      n.x += n.vx * dt * 0.06; n.y += n.vy * dt * 0.06; n.ph += dt * 0.002;
      if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    // dotted links
    links.forEach(function (lk) {
      var a = nodes[lk[0]], b = nodes[lk[1]], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(4, Math.floor(d / 9));
      var fade = Math.max(0, 1 - d / (Math.max(W, H) * 0.5));
      for (var i = 1; i < steps; i++) {
        var t = i / steps, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        ctx.fillStyle = rgba(P.node, P.link * fade * (0.55 + 0.45 * Math.sin(i * 1.7 + a.ph)));
        ctx.beginPath(); ctx.arc(x, y, 0.9 + 0.5 * Math.abs(Math.sin(i * 0.9)), 0, 6.283); ctx.fill();
      }
    });
    // travelling sparks
    sparks.forEach(function (s) {
      s.t += s.v * dt * 0.06; if (s.t > 1) { s.t = 0; s.l = Math.floor(Math.random() * links.length); }
      var lk = links[s.l]; if (!lk) return; var a = nodes[lk[0]], b = nodes[lk[1]], x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
      var g = ctx.createRadialGradient(x, y, 0, x, y, 5); g.addColorStop(0, rgba(P.node, P.glow)); g.addColorStop(1, rgba(P.node, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
    });
    // glowing nodes with a small cluster of dust around them
    nodes.forEach(function (n) {
      var c = n.warm ? P.warm : P.node, pulse = 0.75 + 0.25 * Math.sin(n.ph), R = n.r * 5;
      var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, R); g.addColorStop(0, rgba(c, 0.55 * P.glow * pulse)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(c, 0.9 * pulse); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
      for (var k = 0; k < 6; k++) { var ang = n.ph * 0.3 + k * 1.047, rr = n.r * (2.5 + (k % 3)); ctx.fillStyle = rgba(c, 0.35); ctx.fillRect(n.x + Math.cos(ang) * rr, n.y + Math.sin(ang) * rr, 1.2, 1.2); }
    });
    if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame); else raf = 0;
  }
  function start() { if (!raf && !still) raf = requestAnimationFrame(frame); }

  build(); frame(performance.now());
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (still) frame(performance.now()); }, 150); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(host);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
  var tt = document.getElementById("theme-toggle"); if (tt) tt.addEventListener("click", function () { setTimeout(function () { frame(performance.now()); }, 30); });
})();
