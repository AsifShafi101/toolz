/* etoolbox – wheel spinner, random name picker & team maker, coin flip, dice roller.
   Randomness comes from crypto.getRandomValues (fair, not Math.random). Nothing is uploaded. */
(function () {
  "use strict";
  function rnd() { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
  function rint(n) { return Math.floor(rnd() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rint(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lines(t) { return String(t || "").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function teams(names, n, by) { // by: "teams" (n teams) or "size" (n per team)
    var list = shuffle(names), k = by === "size" ? Math.max(1, Math.ceil(list.length / Math.max(1, n))) : Math.max(1, Math.min(n, list.length)), out = [];
    for (var i = 0; i < k; i++) out.push([]);
    list.forEach(function (x, i) { out[i % k].push(x); });
    return out;
  }
  var audio = null;
  function tick(freq, len, vol) {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); var o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq || 900; g.gain.value = vol || 0.05; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (len || 0.04)); o.stop(audio.currentTime + (len || 0.04)); } catch (e) {}
  }
  function confetti(host) {
    var c = document.createElement("canvas"); c.className = "fun-confetti"; c.width = host.clientWidth; c.height = host.clientHeight; host.appendChild(c);
    var x = c.getContext("2d"), P = [], cols = ["#ff6b35", "#f59e0b", "#16a34a", "#3b82f6", "#a855f7", "#ec4899"];
    for (var i = 0; i < 140; i++) P.push({ x: c.width / 2, y: c.height / 3, vx: (rnd() - 0.5) * 12, vy: -rnd() * 11 - 3, r: rnd() * 6 + 3, c: cols[i % cols.length], a: rnd() * 6 });
    var t0 = performance.now();
    (function f(t) { x.clearRect(0, 0, c.width, c.height); P.forEach(function (p) { p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(f); else c.remove(); })(t0);
  }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COLS = ["#ff6b35", "#3b82f6", "#16a34a", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#ef4444", "#6366f1", "#84cc16"];

  // ---------------- Wheel spinner ----------------
  function initWheel(form) {
    var E = form.elements, cv = document.getElementById("wh-canvas"), btn = document.getElementById("wh-spin"), res = document.getElementById("wh-result"), hist = document.getElementById("wh-hist");
    var angle = 0, spinning = false, history = [];
    // entries from a shared link
    try { var h = location.hash.match(/#w=([^&]+)/); if (h) E.entries.value = decodeURIComponent(escape(atob(h[1].replace(/-/g, "+").replace(/_/g, "/")))); } catch (e) {}
    function items() { return lines(E.entries.value).slice(0, 200); }
    function draw() {
      var it = items(), size = Math.min(520, cv.parentNode.clientWidth || 520), dpr = window.devicePixelRatio || 1;
      cv.style.width = cv.style.height = size + "px"; cv.width = cv.height = Math.round(size * dpr);
      var x = cv.getContext("2d"), R = cv.width / 2, n = Math.max(1, it.length), seg = Math.PI * 2 / n;
      x.clearRect(0, 0, cv.width, cv.height); x.save(); x.translate(R, R); x.rotate(angle);
      for (var i = 0; i < n; i++) {
        x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R - 6 * dpr, i * seg, (i + 1) * seg); x.closePath();
        x.fillStyle = it.length ? COLS[i % COLS.length] : "#cbd5e1"; if (n > 1 && n % COLS.length === 1 && i === n - 1) x.fillStyle = COLS[1]; x.fill();
        x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 2 * dpr; x.stroke();
        x.save(); x.rotate(i * seg + seg / 2); x.textAlign = "right"; x.textBaseline = "middle"; x.fillStyle = "#fff";
        var fs = Math.max(10, Math.min(26, 360 / Math.max(6, n) + 6)) * dpr; x.font = "700 " + fs + "px system-ui, sans-serif";
        var label = it[i] || "Add some entries", maxW = R - 50 * dpr; while (x.measureText(label).width > maxW && label.length > 2) label = label.slice(0, -2) + "…";
        x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 3 * dpr; x.fillText(label, R - 22 * dpr, 0); x.restore();
      }
      x.restore();
      x.beginPath(); x.arc(R, R, 34 * dpr, 0, Math.PI * 2); x.fillStyle = "#fff"; x.fill(); x.lineWidth = 4 * dpr; x.strokeStyle = "#0f172a"; x.stroke();
      x.beginPath(); x.moveTo(cv.width - 4 * dpr, R - 18 * dpr); x.lineTo(cv.width - 4 * dpr, R + 18 * dpr); x.lineTo(cv.width - 40 * dpr, R); x.closePath(); x.fillStyle = "#0f172a"; x.fill();
      document.getElementById("wh-count").textContent = it.length + (it.length === 1 ? " entry" : " entries");
    }
    function winnerAt(a, n) { // pointer is at angle 0 (right side)
      var seg = Math.PI * 2 / n, rel = ((-a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return Math.floor(rel / seg) % n;
    }
    function spin() {
      var it = items(); if (spinning || it.length < 2) { if (it.length < 2) res.innerHTML = '<span class="warn">Add at least two entries, one per line.</span>'; return; }
      spinning = true; btn.disabled = true; res.textContent = "";
      var n = it.length, target = rint(n), seg = Math.PI * 2 / n, within = (0.15 + rnd() * 0.7) * seg;
      var TAU = Math.PI * 2, finalRel = target * seg + within, start = angle, turns = 5 + rint(3);
      var endA = start - turns * TAU - (((start + finalRel) % TAU) + TAU) % TAU; // lands with the pointer inside the target slice
      var dur = reduce ? 600 : 4200 + rint(1500), t0 = performance.now(), lastSeg = -1;
      (function f(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); angle = start + (endA - start) * e; draw();
        var sIdx = Math.floor((((-angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / seg); if (sIdx !== lastSeg) { if (lastSeg >= 0 && E.sound.checked) tick(1000, 0.03, 0.04); lastSeg = sIdx; }
        if (p < 1) return requestAnimationFrame(f);
        var w = it[winnerAt(angle, n)]; spinning = false; btn.disabled = false; history.unshift(w);
        res.innerHTML = '<span class="wh-label">The winner is</span><strong>' + esc(w) + "</strong>";
        hist.innerHTML = history.slice(0, 12).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join(""); form.setAttribute("data-winner", w);
        if (E.sound.checked) { tick(660, 0.15, 0.08); setTimeout(function () { tick(990, 0.25, 0.08); }, 140); }
        if (!reduce) confetti(document.getElementById("wh-stage"));
        if (E.remove.checked) { var arr = lines(E.entries.value), idx = arr.indexOf(w); if (idx >= 0) arr.splice(idx, 1); E.entries.value = arr.join("\n"); setTimeout(draw, 900); }
      })(t0);
    }
    btn.addEventListener("click", spin); cv.addEventListener("click", spin);
    cv.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); spin(); } });
    E.entries.addEventListener("input", draw); window.addEventListener("resize", draw);
    document.getElementById("wh-shuffle").addEventListener("click", function () { E.entries.value = shuffle(items()).join("\n"); draw(); });
    document.getElementById("wh-sort").addEventListener("click", function () { E.entries.value = items().sort(function (a, b) { return a.localeCompare(b); }).join("\n"); draw(); });
    document.getElementById("wh-share").addEventListener("click", function () {
      var b64 = btoa(unescape(encodeURIComponent(items().join("\n")))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), url = location.origin + location.pathname + "#w=" + b64, el = this;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { el.textContent = "Link copied!"; setTimeout(function () { el.textContent = "Copy link to this wheel"; }, 1600); }, function () { prompt("Copy this link:", url); });
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    draw();
    window.ETBWheel = { winnerAt: winnerAt };
  }

  // ---------------- Random name picker & teams ----------------
  function initPicker(form) {
    var E = form.elements, out = document.getElementById("np-out"), picked = [];
    function pool() { var all = lines(E.names.value); return E.norepeat.checked ? all.filter(function (n) { return picked.indexOf(n) < 0; }) : all; }
    function updCount() { var all = lines(E.names.value).length, left = pool().length; document.getElementById("np-count").textContent = all + " names" + (E.norepeat.checked && picked.length ? " · " + left + " not picked yet" : ""); }
    function pick() {
      var p = pool(), k = Math.max(1, Math.min(+E.howmany.value || 1, p.length));
      if (!p.length) { out.innerHTML = '<p class="warn">' + (lines(E.names.value).length ? "Everyone has been picked. Press Reset to start again." : "Add some names, one per line.") + "</p>"; return; }
      var chosen = shuffle(p).slice(0, k), box = document.createElement("div"); box.className = "np-big"; out.innerHTML = ""; out.appendChild(box);
      var frames = reduce ? 1 : 16, f = 0;
      (function roll() {
        box.textContent = p[rint(p.length)]; if (E.sound.checked) tick(700 + f * 20, 0.03, 0.03);
        if (++f < frames) return setTimeout(roll, 40 + f * 9);
        box.innerHTML = chosen.map(function (n) { return "<span>" + esc(n) + "</span>"; }).join(""); box.classList.add("done");
        if (E.norepeat.checked) picked = picked.concat(chosen);
        form.setAttribute("data-picked", chosen.join("|")); updCount();
        if (E.sound.checked) tick(990, 0.2, 0.07); if (!reduce) confetti(out);
        document.getElementById("np-hist").innerHTML = picked.slice(-20).reverse().map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
      })();
    }
    function makeTeams() {
      var names = lines(E.names.value); if (names.length < 2) { out.innerHTML = '<p class="warn">Add at least two names.</p>'; return; }
      var t = teams(names, +E.tn.value || 2, E.tby.value);
      out.innerHTML = '<div class="np-teams">' + t.map(function (g, i) { return '<div class="np-team" style="--tc:' + COLS[i % COLS.length] + '"><h4>Team ' + (i + 1) + ' <span class="muted">(' + g.length + ")</span></h4><ol>" + g.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ol></div>"; }).join("") +
        '</div><div class="actions"><button type="button" class="btn secondary" id="np-copy">Copy teams</button></div>';
      form.setAttribute("data-teams", JSON.stringify(t));
      document.getElementById("np-copy").addEventListener("click", function () { var txt = t.map(function (g, i) { return "Team " + (i + 1) + ": " + g.join(", "); }).join("\n"), b = this; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.textContent = "Copied!"; }); });
    }
    document.getElementById("np-pick").addEventListener("click", pick);
    document.getElementById("np-teams").addEventListener("click", makeTeams);
    document.getElementById("np-reset").addEventListener("click", function () { picked = []; out.innerHTML = ""; document.getElementById("np-hist").innerHTML = ""; updCount(); });
    document.getElementById("np-shuffle").addEventListener("click", function () { E.names.value = shuffle(lines(E.names.value)).join("\n"); });
    form.addEventListener("input", updCount); form.addEventListener("submit", function (e) { e.preventDefault(); pick(); });
    try { var saved = localStorage.getItem("etb-names"); if (saved && !location.hash) E.names.value = saved; } catch (e) {}
    E.names.addEventListener("change", function () { try { localStorage.setItem("etb-names", E.names.value); } catch (e) {} });
    updCount();
  }

  // ---------------- Coin flip ----------------
  function initCoin(form) {
    var coin = document.getElementById("cf-coin"), out = document.getElementById("cf-out"), tally = { h: 0, t: 0 }, hist = [], flipping = false, rot = 0;
    function flip() {
      if (flipping) return; flipping = true;
      var heads = rnd() < 0.5, turns = 5 + rint(3); rot += turns * 360 + ((heads ? 0 : 180) - (rot % 360) + 360) % 360;
      coin.style.transitionDuration = reduce ? "0s" : "1.6s"; coin.style.transform = "rotateY(" + rot + "deg)"; out.textContent = "";
      setTimeout(function () {
        flipping = false; tally[heads ? "h" : "t"]++; hist.unshift(heads ? "H" : "T");
        out.innerHTML = "<strong>" + (heads ? "Heads" : "Tails") + "!</strong>"; form.setAttribute("data-last", heads ? "heads" : "tails");
        var n = tally.h + tally.t, streak = 1; while (streak < hist.length && hist[streak] === hist[0]) streak++;
        document.getElementById("cf-stats").innerHTML = "Heads <b>" + tally.h + "</b> (" + Math.round(tally.h / n * 100) + "%) · Tails <b>" + tally.t + "</b> (" + Math.round(tally.t / n * 100) + "%) · " + n + (n === 1 ? " flip" : " flips") + (streak > 1 ? " · streak of " + streak : "");
        document.getElementById("cf-hist").textContent = hist.slice(0, 40).join(" ");
        tick(heads ? 880 : 660, 0.12, 0.06);
      }, reduce ? 50 : 1650);
    }
    document.getElementById("cf-flip").addEventListener("click", flip); coin.addEventListener("click", flip);
    document.addEventListener("keydown", function (e) { if (e.key === " " && document.activeElement === document.body) { e.preventDefault(); flip(); } });
    document.getElementById("cf-reset").addEventListener("click", function () { tally = { h: 0, t: 0 }; hist = []; document.getElementById("cf-stats").textContent = ""; document.getElementById("cf-hist").textContent = ""; out.textContent = ""; });
    form.addEventListener("submit", function (e) { e.preventDefault(); flip(); });
  }

  // ---------------- Dice roller ----------------
  var PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
  function dieSvg(v, sides) {
    if (sides === 6) return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" class="die-b"/>' + PIPS[v].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8.5" class="die-p"/>'; }).join("") + "</svg>";
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,4 95,30 95,70 50,96 5,70 5,30" class="die-b"/><text x="50" y="62" text-anchor="middle" class="die-t">' + v + "</text></svg>";
  }
  function initDice(form) {
    var E = form.elements, tray = document.getElementById("dc-tray"), out = document.getElementById("dc-out"), hist = [];
    function roll() {
      var n = Math.max(1, Math.min(10, +E.count.value || 1)), s = +E.sides.value || 6, vals = [];
      for (var i = 0; i < n; i++) vals.push(rint(s) + 1);
      var frames = reduce ? 1 : 9, f = 0;
      (function anim() {
        var show = f < frames - 1 ? vals.map(function () { return rint(s) + 1; }) : vals;
        tray.innerHTML = show.map(function (v) { return '<span class="die' + (f < frames - 1 ? " rolling" : "") + '" role="img" aria-label="' + v + '">' + dieSvg(v, s) + "</span>"; }).join("");
        if (++f < frames) { tick(500 + rint(400), 0.02, 0.03); return setTimeout(anim, 70); }
        var total = vals.reduce(function (a, b) { return a + b; }, 0); hist.unshift(vals.join(" + ") + (n > 1 ? " = " + total : ""));
        out.innerHTML = n > 1 ? "Total <strong>" + total + "</strong>" : "You rolled <strong>" + total + "</strong>"; form.setAttribute("data-roll", vals.join(","));
        document.getElementById("dc-hist").innerHTML = hist.slice(0, 15).map(function (h) { return "<li>" + h + "</li>"; }).join("");
      })();
    }
    document.getElementById("dc-roll").addEventListener("click", roll); tray.addEventListener("click", roll);
    form.addEventListener("change", roll); form.addEventListener("submit", function (e) { e.preventDefault(); roll(); });
    tray.innerHTML = '<span class="die">' + dieSvg(6, 6) + "</span>";
  }

  window.ETBFun = { teams: teams, shuffle: shuffle, lines: lines, dieSvg: dieSvg };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-wheel]"))) initWheel(f);
    if ((f = document.querySelector("form[data-picker]"))) initPicker(f);
    if ((f = document.querySelector("form[data-coin]"))) initCoin(f);
    if ((f = document.querySelector("form[data-dice]"))) initDice(f);
  });
})();
