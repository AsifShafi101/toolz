/* etoolbox – countdown timer, stopwatch and Pomodoro timer. Times are worked out from the clock
   (Date.now), so they stay accurate even when the tab is in the background. */
(function () {
  "use strict";
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(ms, cs) { // h:mm:ss(.cc)
    var neg = ms < 0; ms = Math.abs(ms);
    var t = cs ? Math.floor(ms / 10) : Math.ceil(ms / 1000) * 100, c = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000) % 60, h = Math.floor(t / 360000);
    return (neg ? "-" : "") + (h ? h + ":" + pad(m) : m) + ":" + pad(s) + (cs ? "." + pad(c) : "");
  }
  var ac = null;
  function beep(times) {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      for (var i = 0; i < (times || 3); i++) { var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.45;
        o.type = "sine"; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.36); } } catch (e) {}
  }
  function unlockAudio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} }
  function notify(title, body) { try { if (window.Notification && Notification.permission === "granted" && document.hidden) new Notification(title, { body: body, icon: "/assets/logo-face.svg" }); } catch (e) {} }
  function fullscreen(el) { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); }
  var baseTitle = document.title;

  // ---------------- Countdown ----------------
  function initCountdown(form) {
    var E = form.elements, disp = document.getElementById("cd-time"), bar = document.getElementById("cd-bar"), startB = document.getElementById("cd-start"), stage = document.getElementById("cd-stage");
    var end = 0, total = 0, left = 0, running = false, raf = 0, ringing = 0;
    var q = new URLSearchParams(location.search);
    if (q.get("t")) { var t = +q.get("t"); if (t > 0) { E.h.value = Math.floor(t / 3600); E.m.value = Math.floor(t / 60) % 60; E.s.value = t % 60; } }
    if (q.get("to")) { E.mode.value = "date"; E.to.value = q.get("to"); }
    function dur() { return E.mode.value === "date" ? Math.max(0, new Date(E.to.value).getTime() - Date.now()) : ((+E.h.value || 0) * 3600 + (+E.m.value || 0) * 60 + (+E.s.value || 0)) * 1000; }
    function show() {
      document.querySelectorAll("[data-cd-mode]").forEach(function (el) { el.hidden = el.getAttribute("data-cd-mode") !== E.mode.value; });
      var ms = running ? end - Date.now() : (left || dur());
      if (E.mode.value === "date" && !running && E.to.value) ms = dur();
      var big = ms > 86400000 ? Math.floor(ms / 86400000) + "d " + fmt(ms % 86400000) : fmt(Math.max(0, ms));
      disp.textContent = big; bar.style.width = (total ? Math.max(0, Math.min(100, (1 - ms / total) * 100)) : 0) + "%";
      if (running) document.title = big + " · Countdown"; form.setAttribute("data-left", String(Math.max(0, Math.round(ms / 1000))));
    }
    function loop() {
      show(); if (!running) return;
      if (end - Date.now() <= 0) { running = false; left = 0; startB.textContent = "Start"; disp.textContent = "Time's up!"; stage.classList.add("cd-done"); document.title = "⏰ Time's up! · " + baseTitle;
        form.setAttribute("data-done", "1"); if (E.sound.checked) { beep(4); ringing = setInterval(function () { beep(4); }, 2500); setTimeout(function () { clearInterval(ringing); }, 30000); } notify("Time's up!", "Your etoolbox countdown has finished."); return; }
      raf = setTimeout(loop, 200);
    }
    function start() {
      unlockAudio(); clearInterval(ringing); stage.classList.remove("cd-done");
      if (running) { running = false; left = end - Date.now(); clearTimeout(raf); startB.textContent = "Resume"; document.title = baseTitle; show(); return; }
      var ms = left || dur(); if (ms <= 0) { disp.textContent = E.mode.value === "date" ? "Pick a future date" : "Set a time"; return; }
      if (!left) total = ms; end = Date.now() + ms; left = 0; running = true; startB.textContent = "Pause";
      if (window.Notification && Notification.permission === "default" && E.notify && E.notify.checked) Notification.requestPermission();
      loop();
    }
    function reset() { running = false; left = 0; total = 0; clearTimeout(raf); clearInterval(ringing); stage.classList.remove("cd-done"); startB.textContent = "Start"; document.title = baseTitle; form.removeAttribute("data-done"); show(); }
    startB.addEventListener("click", start); document.getElementById("cd-reset").addEventListener("click", reset);
    document.getElementById("cd-full").addEventListener("click", function () { fullscreen(stage); });
    document.querySelectorAll("[data-preset]").forEach(function (b) { b.addEventListener("click", function () { var s = +b.getAttribute("data-preset"); E.mode.value = "dur"; E.h.value = Math.floor(s / 3600); E.m.value = Math.floor(s / 60) % 60; E.s.value = s % 60; reset(); start(); }); });
    document.getElementById("cd-link").addEventListener("click", function () {
      var u = location.origin + location.pathname + (E.mode.value === "date" ? "?to=" + encodeURIComponent(E.to.value) : "?t=" + Math.round(dur() / 1000)), b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = "Link copied!"; setTimeout(function () { b.textContent = "Copy link"; }, 1500); }, function () { prompt("Copy this link:", u); });
    });
    form.addEventListener("input", function () { if (!running) { left = 0; show(); } }); form.addEventListener("change", function () { if (!running) { left = 0; show(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); start(); });
    document.addEventListener("keydown", function (e) { if (e.target.closest && e.target.closest("input,select,textarea")) return; if (e.key === " ") { e.preventDefault(); start(); } if (e.key === "r" || e.key === "R") reset(); if (e.key === "f" || e.key === "F") fullscreen(stage); });
    if (E.mode.value === "date" && !E.to.value) { var d = new Date(); d.setHours(d.getHours() + 24, 0, 0, 0); E.to.value = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
    show();
  }

  // ---------------- Stopwatch ----------------
  function initStopwatch(form) {
    var disp = document.getElementById("sw-time"), startB = document.getElementById("sw-start"), lapB = document.getElementById("sw-lap"), laps = document.getElementById("sw-laps");
    var t0 = 0, acc = 0, running = false, raf = 0, L = [];
    function now() { return acc + (running ? performance.now() - t0 : 0); }
    function show() { disp.textContent = fmt(now(), true); form.setAttribute("data-ms", String(Math.round(now()))); if (running) raf = requestAnimationFrame(show); }
    function start() { if (running) { acc = now(); running = false; cancelAnimationFrame(raf); startB.textContent = "Start"; lapB.textContent = "Reset"; show(); } else { t0 = performance.now(); running = true; startB.textContent = "Stop"; lapB.textContent = "Lap"; show(); } }
    function lap() {
      if (!running) { acc = 0; L = []; laps.innerHTML = ""; lapB.textContent = "Lap"; document.getElementById("sw-copy").hidden = true; show(); return; }
      var tot = now(), prev = L.length ? L[L.length - 1].tot : 0; L.push({ tot: tot, split: tot - prev });
      var best = Math.min.apply(null, L.map(function (l) { return l.split; })), worst = Math.max.apply(null, L.map(function (l) { return l.split; }));
      laps.innerHTML = L.map(function (l, i) { return "<tr" + (L.length > 2 && l.split === best ? ' class="best"' : L.length > 2 && l.split === worst ? ' class="worst"' : "") + "><td>Lap " + (i + 1) + "</td><td>" + fmt(l.split, true) + "</td><td>" + fmt(l.tot, true) + "</td></tr>"; }).reverse().join("");
      document.getElementById("sw-copy").hidden = false; form.setAttribute("data-laps", String(L.length));
    }
    startB.addEventListener("click", start); lapB.addEventListener("click", lap);
    document.getElementById("sw-full").addEventListener("click", function () { fullscreen(document.getElementById("sw-stage")); });
    document.getElementById("sw-copy").addEventListener("click", function () { var txt = L.map(function (l, i) { return "Lap " + (i + 1) + "\t" + fmt(l.split, true) + "\t" + fmt(l.tot, true); }).join("\n"), b = this; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy laps"; }, 1500); }); });
    document.addEventListener("keydown", function (e) { if (e.target.closest && e.target.closest("input,select,textarea,button")) return; if (e.key === " ") { e.preventDefault(); start(); } if (e.key === "l" || e.key === "L") lap(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    show();
  }

  // ---------------- Pomodoro ----------------
  function initPomodoro(form) {
    var E = form.elements, disp = document.getElementById("po-time"), lab = document.getElementById("po-phase"), ring = document.getElementById("po-ring"), startB = document.getElementById("po-start"), stage = document.getElementById("po-stage");
    var phase = "work", done = 0, end = 0, left = 0, total = 0, running = false, tm = 0, C = 2 * Math.PI * 54;
    var NAMES = { work: "Focus", short: "Short break", long: "Long break" };
    function len(p) { return Math.max(1, +(p === "work" ? E.work.value : p === "short" ? E.short.value : E.long.value) || 1) * 60000; }
    function show() {
      var ms = running ? end - Date.now() : (left || len(phase)); total = total || len(phase);
      disp.textContent = fmt(Math.max(0, ms)); lab.textContent = NAMES[phase]; stage.setAttribute("data-phase", phase);
      ring.style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, ms / total))));
      document.getElementById("po-done").textContent = done + (done === 1 ? " session" : " sessions") + " done today";
      if (running) document.title = fmt(Math.max(0, ms)) + " · " + NAMES[phase];
      form.setAttribute("data-phase", phase); form.setAttribute("data-sessions", String(done));
    }
    function next() {
      if (phase === "work") { done++; try { localStorage.setItem("etb-pomo", JSON.stringify({ d: new Date().toDateString(), n: done })); } catch (e) {} phase = done % (+E.every.value || 4) === 0 ? "long" : "short"; }
      else phase = "work";
      left = 0; total = len(phase);
      if (E.sound.checked) beep(phase === "work" ? 2 : 3); notify(phase === "work" ? "Break over: time to focus" : "Time for a " + NAMES[phase].toLowerCase(), "etoolbox Pomodoro timer");
      if (E.auto.checked) { end = Date.now() + total; running = true; loop(); } else { running = false; startB.textContent = "Start"; document.title = baseTitle; show(); }
    }
    function loop() { show(); if (!running) return; if (end - Date.now() <= 0) return next(); tm = setTimeout(loop, 250); }
    function start() {
      unlockAudio();
      if (running) { running = false; left = end - Date.now(); clearTimeout(tm); startB.textContent = "Resume"; document.title = baseTitle; show(); return; }
      if (window.Notification && Notification.permission === "default" && E.notify.checked) Notification.requestPermission();
      total = total || len(phase); end = Date.now() + (left || len(phase)); left = 0; running = true; startB.textContent = "Pause"; loop();
    }
    function setPhase(p) { running = false; clearTimeout(tm); phase = p; left = 0; total = len(p); startB.textContent = "Start"; document.title = baseTitle; show(); }
    startB.addEventListener("click", start);
    document.getElementById("po-skip").addEventListener("click", function () { clearTimeout(tm); running = false; next(); });
    document.getElementById("po-reset").addEventListener("click", function () { setPhase(phase); });
    document.querySelectorAll("[data-phase-btn]").forEach(function (b) { b.addEventListener("click", function () { setPhase(b.getAttribute("data-phase-btn")); }); });
    form.addEventListener("change", function () { if (!running) { left = 0; total = len(phase); show(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); start(); });
    document.addEventListener("keydown", function (e) { if (e.target.closest && e.target.closest("input,select,textarea,button")) return; if (e.key === " ") { e.preventDefault(); start(); } });
    try { var s = JSON.parse(localStorage.getItem("etb-pomo") || "null"); if (s && s.d === new Date().toDateString()) done = s.n; } catch (e) {}
    ring.style.strokeDasharray = String(C); show();
  }

  window.ETBTimers = { fmt: fmt };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-countdown]"))) initCountdown(f);
    if ((f = document.querySelector("form[data-stopwatch]"))) initStopwatch(f);
    if ((f = document.querySelector("form[data-pomodoro]"))) initPomodoro(f);
  });
})();
