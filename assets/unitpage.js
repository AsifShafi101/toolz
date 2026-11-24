/* etoolbox – single unit-conversion pages (uses ETBUnits.convert from units.js) */
(function () {
  "use strict";
  var NAMES = { cm: "cm", "in": "in", mm: "mm", m: "m", km: "km", ft: "ft", yd: "yd", mi: "miles", g: "g", kg: "kg", oz: "oz", lb: "lb", st: "st", ml: "ml", l: "litres", floz: "fl oz (UK)", pt: "UK pints", gal: "UK gallons", cup: "cups", m2: "m²", ft2: "sq ft", acre: "acres", ha: "hectares", kmh: "km/h", mph: "mph", kn: "knots", MB: "MB", GB: "GB", c: "°C", f: "°F", k: "K", mpg: "mpg (UK)", l100: "L/100 km" };
  function num(s) { s = String(s || "").trim().replace(/,/g, "").replace(/−/g, "-"); var m = /^(-?\d+(?:\.\d+)?)(?:\s+(\d+)\/(\d+))?$|^(\d+)\/(\d+)$/.exec(s); if (!m) return NaN; if (m[4]) return m[4] / m[5]; return +m[1] + (m[2] ? m[2] / m[3] : 0); }
  function fmt(x, dp) { if (!isFinite(x)) return "–"; var a = Math.abs(x); if (dp === undefined) dp = a >= 1000 ? 1 : a >= 100 ? 2 : a >= 1 ? 3 : 5; return (+x.toFixed(dp)).toLocaleString("en-GB", { maximumFractionDigits: dp }).replace("-", "−"); }
  function compound(to, v) { if (to !== "ft" && to !== "st") return null; var big = Math.floor(v), k = to === "ft" ? 12 : 14, small = Math.round((v - big) * k * 10) / 10; if (small >= k) { big++; small = 0; } return big + " " + to + " " + fmt(small, 1) + " " + (to === "ft" ? "in" : "lb"); }
  function init(form) {
    var cat = form.getAttribute("data-cat"), a = form.getAttribute("data-from"), b = form.getAttribute("data-to"), E = form.elements, out = document.getElementById("up-out");
    var conv = function (v) { return cat === "data" ? v * (a === "MB" ? 1e6 : 1e9) / (b === "MB" ? 1e6 : 1e9) : window.ETBUnits.convert(cat, a, b, v); };
    function upd() {
      var v = num(E.v.value); if (E.v2) { var v2 = num(E.v2.value || "0"); if (!isNaN(v2)) v = (isNaN(v) ? 0 : v) + v2 / (a === "ft" ? 12 : 14); }
      if (isNaN(v)) { out.innerHTML = '<p class="calc-empty">Enter a number to convert.</p>'; form.removeAttribute("data-result"); return; }
      var r = conv(v), c = compound(b, r), shown = E.v2 ? E.v.value.trim() + " " + a + " " + (E.v2.value.trim() || "0") + " " + (a === "ft" ? "in" : "lb") : fmt(v) + " " + NAMES[a];
      out.innerHTML = '<div class="calc-row big"><span>' + shown.replace(/</g, "&lt;") + " =</span><strong>" + (c || fmt(r) + " " + NAMES[b]) + "</strong></div>" + (c ? '<div class="calc-row"><span>As a decimal</span><strong>' + fmt(r) + " " + NAMES[b] + "</strong></div>" : "") + (b === "ft" ? '<div class="calc-row"><span>In inches</span><strong>' + fmt(r * 12, 1) + " in</strong></div>" : b === "st" ? '<div class="calc-row"><span>In pounds</span><strong>' + fmt(r * 14, 1) + " lb</strong></div>" : "");
      form.setAttribute("data-result", String(r));
    }
    form.addEventListener("input", upd); form.addEventListener("submit", function (e) { e.preventDefault(); }); upd();
  }
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-unitpage]"); if (f) init(f); });
})();
