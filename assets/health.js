/* etoolbox – calorie (BMR/TDEE), body fat and ideal weight calculators.
   Formulas: Mifflin-St Jeor (BMR), standard activity multipliers, US Navy body fat method,
   Devine / Robinson / Miller / Hamwi ideal weight formulas, and the WHO healthy BMI range. */
(function () {
  "use strict";
  var ACT = { 1.2: "Little or no exercise", 1.375: "Light exercise 1–3 days a week", 1.55: "Moderate exercise 3–5 days a week", 1.725: "Hard exercise 6–7 days a week", 1.9: "Very hard exercise or a physical job" };
  function bmr(sex, kg, cm, age) { return 10 * kg + 6.25 * cm - 5 * age + (sex === "m" ? 5 : -161); }
  function navy(sex, cm, neck, waist, hip) {
    if (sex === "m") { if (waist - neck <= 0) return NaN; return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(cm)) - 450; }
    if (waist + hip - neck <= 0) return NaN; return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(cm)) - 450;
  }
  function fatCategory(sex, bf) { // American Council on Exercise ranges
    var t = sex === "m" ? [6, 14, 18, 25] : [14, 21, 25, 32];
    return bf < t[0] ? "Essential fat" : bf < t[1] ? "Athletic" : bf < t[2] ? "Fit" : bf < t[3] ? "Average" : "Above the healthy range";
  }
  function ideal(sex, cm) {
    var inch = cm / 2.54, over = Math.max(0, inch - 60), m = sex === "m";
    return { devine: (m ? 50 : 45.5) + 2.3 * over, robinson: (m ? 52 : 49) + (m ? 1.9 : 1.7) * over, miller: (m ? 56.2 : 53.1) + (m ? 1.41 : 1.36) * over, hamwi: (m ? 48 : 45.5) + (m ? 2.7 : 2.2) * over,
      bmiLo: 18.5 * Math.pow(cm / 100, 2), bmiHi: 24.9 * Math.pow(cm / 100, 2) };
  }

  // shared unit inputs: height (cm, or ft+in) and weight (kg, or st+lb)
  function height(E) { return E.units.value === "imp" ? ((+E.ft.value || 0) * 12 + (+E.inch.value || 0)) * 2.54 : +E.cm.value || 0; }
  function weight(E) { return E.units.value === "imp" ? ((+E.st.value || 0) * 14 + (+E.lb.value || 0)) * 0.45359237 : +E.kg.value || 0; }
  function len(E, name) { var v = +E[name].value || 0; return E.units.value === "imp" ? v * 2.54 : v; }
  function wtxt(kg, imp) { if (!imp) return (Math.round(kg * 10) / 10) + " kg"; var lb = Math.round(kg / 0.45359237), st = Math.floor(lb / 14); return st + " st " + (lb - st * 14) + " lb"; }
  function syncUnits(form) { var imp = form.elements.units.value === "imp"; form.querySelectorAll("[data-u]").forEach(function (el) { el.hidden = el.getAttribute("data-u") !== (imp ? "imp" : "met"); }); }
  var n0 = function (x) { return Math.round(x).toLocaleString("en-GB"); };

  function initCal(form) {
    var E = form.elements, out = document.getElementById("hc-out");
    function calc() {
      syncUnits(form);
      var cm = height(E), kg = weight(E), age = +E.age.value || 0, sex = E.sex.value, act = +E.activity.value;
      if (!(cm > 100 && kg > 25 && age >= 15)) { out.innerHTML = '<p class="muted">Enter your age (15 or over), height and weight.</p>'; return; }
      var b = bmr(sex, kg, cm, age), t = b * act, floor = sex === "m" ? 1500 : 1200;
      var goals = [["Lose about 0.5 kg (1 lb) a week", t - 500], ["Lose about 0.25 kg (½ lb) a week", t - 250], ["Maintain your weight", t], ["Gain about 0.25 kg (½ lb) a week", t + 250]];
      out.innerHTML = '<div class="due-hero"><span class="due-l">Calories to maintain your weight</span><strong class="due-d">' + n0(t) + " kcal a day</strong>" +
        '<span class="due-s">BMR (calories at complete rest) ' + n0(b) + " kcal · " + ACT[act] + "</span></div>" +
        '<table class="sal-table"><thead><tr><th>Goal</th><th>Calories a day</th></tr></thead><tbody>' +
        goals.map(function (g) { var low = g[1] < floor; return "<tr><td>" + g[0] + "</td><td>" + (low ? "<span class=\"warn\">Not recommended</span>" : n0(g[1]) + " kcal") + "</td></tr>"; }).join("") +
        "</tbody></table><p class=\"hint\">For reference, the NHS uses about 2,500 kcal a day for men and 2,000 kcal for women. Don't eat less than about " + n0(floor) + " kcal a day without medical supervision, and aim to lose no more than 0.5–1 kg a week.</p>";
      form.setAttribute("data-tdee", String(Math.round(t))); form.setAttribute("data-bmr", String(Math.round(b)));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }
  function initFat(form) {
    var E = form.elements, out = document.getElementById("hc-out");
    function calc() {
      syncUnits(form); form.querySelector("[data-hip]").hidden = E.sex.value !== "f";
      var cm = height(E), sex = E.sex.value, neck = len(E, "neck"), waist = len(E, "waist"), hip = len(E, "hip"), kg = weight(E);
      if (!(cm > 100 && neck > 20 && waist > 40 && (sex === "m" || hip > 40))) { out.innerHTML = '<p class="muted">Enter your height and the measurements shown.</p>'; return; }
      var bf = navy(sex, cm, neck, waist, hip);
      if (!(bf > 2 && bf < 70)) { out.innerHTML = '<p class="warn">Please check your measurements: your waist should be larger than your neck.</p>'; return; }
      var cat = fatCategory(sex, bf), imp = E.units.value === "imp";
      var html = '<div class="due-hero"><span class="due-l">Estimated body fat</span><strong class="due-d">' + (Math.round(bf * 10) / 10) + "%</strong><span class=\"due-s\">" + cat + "</span></div>";
      var t = sex === "m" ? [2, 6, 14, 18, 25, 40] : [10, 14, 21, 25, 32, 45], pos = Math.max(0, Math.min(100, (bf - t[0]) / (t[5] - t[0]) * 100));
      html += '<div class="bf-scale"><div class="bf-bar">' + ["Essential", "Athletic", "Fit", "Average", "High"].map(function (n, i) { return '<span style="flex:' + (t[i + 1] - t[i]) + '">' + n + "</span>"; }).join("") + '</div><i style="left:' + pos.toFixed(1) + '%"></i></div>';
      if (kg > 25) html += '<p>That\'s about <strong>' + wtxt(kg * bf / 100, imp) + "</strong> of fat and <strong>" + wtxt(kg * (1 - bf / 100), imp) + "</strong> of lean mass (muscle, bone, water and organs).</p>";
      html += '<p class="hint">The US Navy tape-measure method is usually within about 3–4 percentage points of a DEXA scan. Measure at the same time of day, relaxed, with the tape snug but not tight.</p>';
      out.innerHTML = html; form.setAttribute("data-bf", bf.toFixed(1));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }
  function initIdeal(form) {
    var E = form.elements, out = document.getElementById("hc-out");
    function calc() {
      syncUnits(form);
      var cm = height(E), sex = E.sex.value, imp = E.units.value === "imp";
      if (!(cm > 120 && cm < 240)) { out.innerHTML = '<p class="muted">Enter your height.</p>'; return; }
      var r = ideal(sex, cm);
      out.innerHTML = '<div class="due-hero"><span class="due-l">Healthy weight for your height</span><strong class="due-d">' + wtxt(r.bmiLo, imp) + " – " + wtxt(r.bmiHi, imp) + "</strong>" +
        '<span class="due-s">A healthy BMI of 18.5 to 24.9 (WHO and NHS)</span></div>' +
        '<table class="sal-table"><thead><tr><th>Formula</th><th>“Ideal” weight</th></tr></thead><tbody>' +
        [["Devine (1974), used for medicine doses", r.devine], ["Robinson (1983)", r.robinson], ["Miller (1983)", r.miller], ["Hamwi (1964)", r.hamwi]].map(function (f) { return "<tr><td>" + f[0] + "</td><td>" + wtxt(f[1], imp) + "</td></tr>"; }).join("") +
        "</tbody></table><p class=\"hint\">These formulas were designed for adults of average build and are less accurate for very short or tall people. A healthy weight is a range, not a single number: muscle, frame size and age all matter.</p>";
      form.setAttribute("data-lo", r.bmiLo.toFixed(1)); form.setAttribute("data-devine", r.devine.toFixed(1));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }

  window.ETBHealth = { bmr: bmr, navy: navy, ideal: ideal, fatCategory: fatCategory };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-cal]"))) initCal(f);
    if ((f = document.querySelector("form[data-fat]"))) initFat(f);
    if ((f = document.querySelector("form[data-ideal]"))) initIdeal(f);
  });
})();
