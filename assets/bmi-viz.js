/* etoolbox – BMI visuals: animated gauge, BMI chart, healthy-weight progress and advice based on
   WHO and NHS guidance. Reads the result calc.js writes to #calc-out[data-result]. */
(function () {
  "use strict";
  var out = document.getElementById("calc-out"), box = document.getElementById("bmi-viz");
  if (!out || !box) return;
  var NS = "http://www.w3.org/2000/svg", MIN = 15, MAX = 40;
  var COL = { under: "#3b82f6", healthy: "#22c55e", over: "#f59e0b", obese: "#ef4444", severe: "#b91c1c" };
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function kgText(kg, unit) {
    if (unit === "stlb") { var lb = Math.round(kg / 0.45359237), st = Math.floor(lb / 14); return st + " st " + (lb - st * 14) + " lb"; }
    if (unit === "lb") return Math.round(kg / 0.45359237) + " lb";
    return (Math.round(kg * 10) / 10) + " kg";
  }
  function band(b, r) { return b < 18.5 ? "under" : b < r.over ? "healthy" : b < r.obese ? "over" : b < 40 ? "obese" : "severe"; }

  /* ---------- gauge ---------- */
  var g = document.getElementById("bmi-gauge"), CX = 160, CY = 160, RAD = 130;
  function ang(b) { var t = (Math.min(MAX, Math.max(MIN, b)) - MIN) / (MAX - MIN); return Math.PI * (1 - t); }
  function pt(a, r) { return [CX + r * Math.cos(a), CY - r * Math.sin(a)]; }
  function arc(b0, b1, r, w, col) {
    var a0 = ang(b0), a1 = ang(b1), p0 = pt(a0, r), p1 = pt(a1, r);
    return el("path", { d: "M" + p0[0] + " " + p0[1] + " A" + r + " " + r + " 0 0 1 " + p1[0] + " " + p1[1], stroke: col, "stroke-width": w, fill: "none", "stroke-linecap": "butt" });
  }
  function drawGauge(r) {
    g.innerHTML = "";
    [[MIN, 18.5, COL.under], [18.5, r.over, COL.healthy], [r.over, r.obese, COL.over], [r.obese, 40, COL.obese]].forEach(function (s) { g.appendChild(arc(s[0], s[1], RAD, 26, s[2])); });
    [18.5, r.over, r.obese].forEach(function (v) { var p = pt(ang(v), RAD + 24); var t = el("text", { x: p[0], y: p[1], "text-anchor": "middle", class: "gz-tick" }); t.textContent = v; g.appendChild(t); });
    var needle = el("g", { class: "gz-needle", id: "gz-needle" });
    needle.appendChild(el("path", { d: "M" + (CX - 6) + " " + CY + " L" + CX + " " + (CY - RAD + 18) + " L" + (CX + 6) + " " + CY + " Z" }));
    needle.appendChild(el("circle", { cx: CX, cy: CY, r: 11 }));
    g.appendChild(needle);
  }
  var shown = MIN, anim = 0;
  function animateTo(r) {
    var target = r.bmi, start = shown, t0 = performance.now(), num = document.getElementById("bmi-big"), needle = document.getElementById("gz-needle");
    cancelAnimationFrame(anim);
    (function step(now) {
      var k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3), v = start + (target - start) * e;
      shown = v; num.textContent = v.toFixed(1);
      needle.setAttribute("transform", "rotate(" + (90 - ang(v) * 180 / Math.PI) + " " + CX + " " + CY + ")");
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- BMI chart (height × weight with coloured zones) ---------- */
  var chart = document.getElementById("bmi-chart"), CW = 560, CH = 340, PL = 46, PB = 36, PT = 10, PR = 12;
  var H0 = 145, H1 = 205, W0 = 35, W1 = 160;
  function sx(cm) { return PL + (cm - H0) / (H1 - H0) * (CW - PL - PR); }
  function sy(kg) { return CH - PB - (kg - W0) / (W1 - W0) * (CH - PB - PT); }
  function curve(b) { var pts = []; for (var cm = H0; cm <= H1; cm += 2.5) pts.push([sx(cm), sy(Math.min(W1, Math.max(W0, b * cm * cm / 10000)))]); return pts; }
  function drawChart(r) {
    chart.innerHTML = "";
    var levels = [[0, COL.under], [18.5, COL.healthy], [r.over, COL.over], [r.obese, COL.obese], [40, COL.severe], [99, null]];
    for (var i = 0; i < levels.length - 1; i++) {
      var lo = curve(levels[i][0] || 1), hi = curve(levels[i + 1][0]);
      var d = "M" + lo.map(function (p) { return p.join(" "); }).join(" L") + " L" + hi.reverse().map(function (p) { return p.join(" "); }).join(" L") + " Z";
      chart.appendChild(el("path", { d: d, fill: levels[i][1], opacity: .22 }));
    }
    for (var cm = 150; cm <= 200; cm += 10) { chart.appendChild(el("line", { x1: sx(cm), x2: sx(cm), y1: PT, y2: CH - PB, class: "ch-grid" })); var t = el("text", { x: sx(cm), y: CH - PB + 18, "text-anchor": "middle", class: "ch-lab" }); t.textContent = cm; chart.appendChild(t); }
    for (var kg = 40; kg <= 160; kg += 20) { chart.appendChild(el("line", { x1: PL, x2: CW - PR, y1: sy(kg), y2: sy(kg), class: "ch-grid" })); var t2 = el("text", { x: PL - 8, y: sy(kg) + 4, "text-anchor": "end", class: "ch-lab" }); t2.textContent = kg; chart.appendChild(t2); }
    var xl = el("text", { x: (CW + PL) / 2, y: CH - 4, "text-anchor": "middle", class: "ch-axis" }); xl.textContent = "Height (cm)"; chart.appendChild(xl);
    var yl = el("text", { x: 12, y: (CH - PB) / 2, "text-anchor": "middle", class: "ch-axis", transform: "rotate(-90 12 " + (CH - PB) / 2 + ")" }); yl.textContent = "Weight (kg)"; chart.appendChild(yl);
    var cmU = Math.min(H1, Math.max(H0, r.h * 100)), kgU = Math.min(W1, Math.max(W0, r.w)), x = sx(cmU), y = sy(kgU);
    chart.appendChild(el("circle", { cx: x, cy: y, r: 16, class: "ch-pulse" }));
    chart.appendChild(el("circle", { cx: x, cy: y, r: 7, class: "ch-dot" }));
    var lab = el("text", { x: x + (x > CW - 120 ? -14 : 14), y: y - 12, "text-anchor": x > CW - 120 ? "end" : "start", class: "ch-you" }); lab.textContent = "You · " + r.bmi.toFixed(1); chart.appendChild(lab);
  }

  /* ---------- healthy-weight bar + advice ---------- */
  function weightBar(r, b) {
    var lo = r.lo, hi = r.hi, w = r.w, span = Math.max(hi * 1.6, w * 1.15) - lo * 0.7, start = lo * 0.7;
    var pos = function (kg) { return Math.max(0, Math.min(100, (kg - start) / span * 100)); };
    document.getElementById("wb-range").style.left = pos(lo) + "%"; document.getElementById("wb-range").style.width = (pos(hi) - pos(lo)) + "%";
    document.getElementById("wb-you").style.left = pos(w) + "%";
    document.getElementById("wb-lo").textContent = kgText(lo, r.wunit); document.getElementById("wb-hi").textContent = kgText(hi, r.wunit);
    var m = document.getElementById("wb-msg"), gap;
    if (b === "healthy") m.innerHTML = "<strong>You're in the healthy range for your height.</strong> Keep doing what you're doing.";
    else if (b === "under") { gap = lo - w; m.innerHTML = "You're <strong>" + kgText(gap, r.wunit) + "</strong> below the healthy range. It's worth a chat with your GP to check everything is OK."; }
    else { gap = w - hi; var wk1 = Math.ceil(gap / 1), wk2 = Math.ceil(gap / 0.5);
      m.innerHTML = "You're <strong>" + kgText(gap, r.wunit) + "</strong> above the healthy range. At the NHS's safe pace of 0.5–1 kg a week, that's about <strong>" + (wk1 === wk2 ? wk1 : wk1 + "–" + wk2) + " weeks</strong>. Even losing 5% of your weight (" + kgText(w * 0.05, r.wunit) + ") brings real health benefits."; }
  }
  var ADV = {
    move: { t: "Move more", i: "🚶", p: ["Aim for <strong>150–300 minutes</strong> of moderate activity a week (brisk walking, cycling, dancing), or 75–150 minutes of vigorous activity like running.", "Do <strong>muscle-strengthening</strong> exercises (weights, resistance bands, yoga, heavy gardening) on 2 or more days a week.", "Sit less. Every bit of movement counts, even taking the stairs."] },
    eat: { t: "Eat well", i: "🥗", p: ["Eat at least <strong>400 g of fruit and vegetables</strong> a day (about 5 portions), plus beans, lentils, nuts and whole grains.", "Keep <strong>free sugars under 10%</strong> of your energy, about 12 teaspoons a day, and ideally under 5%. That includes sugar in drinks, honey and fruit juice.", "Swap saturated and trans fats for unsaturated ones (fish, nuts, most plant oils), and keep <strong>salt under 5 g</strong> a day, about a teaspoon."] },
    pace: { t: "Go steady", i: "🎯", p: ["Small, lasting changes work better than strict diets.", "The NHS suggests losing <strong>0.5–1 kg a week</strong> as a safe, realistic pace.", "Your GP can refer you to free local weight management support."] },
    gain: { t: "Build up healthily", i: "💪", p: ["Have regular meals and snacks with energy-dense, nourishing foods: nuts, seeds, milk, eggs, beans, oily fish and whole grains.", "Strength exercises help you gain muscle, not just fat.", "Speak to your GP, especially if you've lost weight without trying."] },
    keep: { t: "Keep it up", i: "🌟", p: ["Stay active: 150–300 minutes a week, plus strength exercises twice a week.", "Keep filling half your plate with vegetables and fruit.", "Weigh yourself now and then to catch slow changes early."] }
  };
  function advice(b) {
    var keys = b === "under" ? ["gain", "eat", "move"] : b === "healthy" ? ["keep", "eat", "move"] : ["move", "eat", "pace"];
    document.getElementById("bmi-advice").innerHTML = keys.map(function (k) { var a = ADV[k]; return '<div class="adv"><div class="adv-h"><span>' + a.i + "</span>" + a.t + "</div><ul>" + a.p.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>"; }).join("");
  }
  var LABEL = { under: "Underweight", healthy: "Healthy weight", over: "Overweight", obese: "Obese", severe: "Severely obese" };
  function update() {
    var r; try { r = JSON.parse(out.getAttribute("data-result") || "null"); } catch (e) { r = null; }
    if (!r || !r.h) { box.hidden = true; return; }
    var b = band(r.bmi, r);
    box.hidden = false; box.setAttribute("data-band", b);
    drawGauge(r); animateTo(r); drawChart(r); weightBar(r, b); advice(b);
    var chip = document.getElementById("bmi-chip"); chip.textContent = LABEL[b]; chip.style.background = COL[b];
    if (b === "healthy" && !box.dataset.cheered) { box.dataset.cheered = "1"; cheer(); }
  }
  function cheer() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var host = document.getElementById("bmi-gauge-wrap");
    for (var i = 0; i < 26; i++) { var s = document.createElement("i"); s.className = "bmi-spark"; s.style.left = (10 + Math.random() * 80) + "%"; s.style.background = ["#22c55e", "#ff6b35", "#3b82f6", "#f7c948"][i % 4]; s.style.animationDelay = (Math.random() * .4) + "s"; host.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 1800); }
  }
  new MutationObserver(update).observe(out, { attributes: true, attributeFilter: ["data-result"] });
  update();
})();
