/* etoolbox unit converter */
(function () {
  "use strict";
  // factor = how many base units in one of this unit
  var U = {
    length: { base: "m", units: [["mm", "Millimetres", 0.001], ["cm", "Centimetres", 0.01], ["m", "Metres", 1], ["km", "Kilometres", 1000], ["in", "Inches", 0.0254], ["ft", "Feet", 0.3048], ["yd", "Yards", 0.9144], ["mi", "Miles", 1609.344], ["nmi", "Nautical miles", 1852]] },
    weight: { base: "kg", units: [["mg", "Milligrams", 1e-6], ["g", "Grams", 0.001], ["kg", "Kilograms", 1], ["t", "Tonnes", 1000], ["oz", "Ounces", 0.028349523125], ["lb", "Pounds", 0.45359237], ["st", "Stone", 6.35029318], ["ton", "UK tons (long)", 1016.0469088]] },
    volume: { base: "l", units: [["ml", "Millilitres", 0.001], ["l", "Litres", 1], ["m3", "Cubic metres", 1000], ["tsp", "Teaspoons (UK, 5 ml)", 0.005], ["tbsp", "Tablespoons (UK, 15 ml)", 0.015], ["cup", "Cups (metric, 250 ml)", 0.25], ["floz", "Fluid ounces (UK)", 0.0284130625], ["pt", "Pints (UK)", 0.56826125], ["gal", "Gallons (UK)", 4.54609], ["uspt", "Pints (US)", 0.473176473], ["usgal", "Gallons (US)", 3.785411784]] },
    temperature: { base: "c", units: [["c", "Celsius"], ["f", "Fahrenheit"], ["k", "Kelvin"]] },
    area: { base: "m2", units: [["cm2", "Square centimetres", 1e-4], ["m2", "Square metres", 1], ["ha", "Hectares", 10000], ["km2", "Square kilometres", 1e6], ["in2", "Square inches", 0.00064516], ["ft2", "Square feet", 0.09290304], ["yd2", "Square yards", 0.83612736], ["acre", "Acres", 4046.8564224], ["mi2", "Square miles", 2589988.110336]] },
    speed: { base: "ms", units: [["ms", "Metres per second", 1], ["kmh", "Kilometres per hour", 1 / 3.6], ["mph", "Miles per hour", 0.44704], ["kn", "Knots", 1852 / 3600]] },
    data: { base: "B", units: [["b", "Bits", 0.125], ["B", "Bytes", 1], ["KB", "Kilobytes (1000)", 1e3], ["MB", "Megabytes (1000)", 1e6], ["GB", "Gigabytes (1000)", 1e9], ["TB", "Terabytes (1000)", 1e12], ["KiB", "Kibibytes (1024)", 1024], ["MiB", "Mebibytes (1024²)", 1048576], ["GiB", "Gibibytes (1024³)", 1073741824]] },
    fuel: { base: "mpg", units: [["mpg", "Miles per gallon (UK)"], ["usmpg", "Miles per gallon (US)"], ["l100", "Litres per 100 km"], ["kml", "Kilometres per litre"]] }
  };

  function toBase(cat, unit, v) {
    if (cat === "temperature") return unit === "f" ? (v - 32) * 5 / 9 : unit === "k" ? v - 273.15 : v;
    if (cat === "fuel") { // base: UK mpg
      if (unit === "mpg") return v;
      if (unit === "usmpg") return v * 4.54609 / 3.785411784;
      var kml = unit === "kml" ? v : (v ? 100 / v : Infinity);
      return kml * 4.54609 / 1.609344;
    }
    return v * find(cat, unit)[2];
  }
  function fromBase(cat, unit, b) {
    if (cat === "temperature") return unit === "f" ? b * 9 / 5 + 32 : unit === "k" ? b + 273.15 : b;
    if (cat === "fuel") {
      if (unit === "mpg") return b;
      if (unit === "usmpg") return b * 3.785411784 / 4.54609;
      var kml = b * 1.609344 / 4.54609;
      return unit === "kml" ? kml : (kml ? 100 / kml : Infinity);
    }
    return b / find(cat, unit)[2];
  }
  function find(cat, unit) { return U[cat].units.filter(function (u) { return u[0] === unit; })[0]; }
  function convert(cat, from, to, v) { return fromBase(cat, to, toBase(cat, from, v)); }
  function fmt(n) {
    if (!isFinite(n)) return "–";
    var a = Math.abs(n);
    if (a !== 0 && (a < 1e-6 || a >= 1e15)) return n.toExponential(6).replace(/\.?0+e/, "e");
    return parseFloat(n.toPrecision(10)).toLocaleString("en-GB", { maximumFractionDigits: 8 });
  }

  var DEFAULTS = { length: ["cm", "in"], weight: ["kg", "lb"], volume: ["l", "pt"], temperature: ["c", "f"], area: ["m2", "ft2"], speed: ["kmh", "mph"], data: ["MB", "GB"], fuel: ["mpg", "l100"] };

  function init(form) {
    var cat = form.elements.cat, from = form.elements.from, to = form.elements.to, val = form.elements.value, out = document.getElementById("unit-out"), table = document.getElementById("unit-table");
    function fill(keep) {
      var opts = U[cat.value].units.map(function (u) { return '<option value="' + u[0] + '">' + u[1] + "</option>"; }).join("");
      from.innerHTML = opts; to.innerHTML = opts;
      var d = DEFAULTS[cat.value]; from.value = keep && keep[0] && find(cat.value, keep[0]) ? keep[0] : d[0]; to.value = keep && keep[1] && find(cat.value, keep[1]) ? keep[1] : d[1];
    }
    function upd() {
      var v = parseFloat(String(val.value).replace(/,/g, ""));
      if (isNaN(v)) { out.innerHTML = '<p class="calc-empty">Enter a number to convert.</p>'; table.innerHTML = ""; out.removeAttribute("data-result"); return; }
      var r = convert(cat.value, from.value, to.value, v), fu = find(cat.value, from.value)[1], tu = find(cat.value, to.value)[1];
      out.innerHTML = '<div class="calc-row big"><span>' + fmt(v) + " " + fu.toLowerCase() + " =</span><strong>" + fmt(r) + " " + tu.toLowerCase() + "</strong></div>";
      out.setAttribute("data-result", JSON.stringify({ value: r }));
      table.innerHTML = U[cat.value].units.filter(function (u) { return u[0] !== from.value; }).map(function (u) {
        return '<div class="calc-row"><span>' + u[1] + "</span><strong>" + fmt(convert(cat.value, from.value, u[0], v)) + "</strong></div>";
      }).join("");
    }
    // allow ?cat=weight deep links
    var q = /[?&]cat=(\w+)/.exec(location.search); if (q && U[q[1]]) cat.value = q[1];
    cat.addEventListener("change", function () { fill(); upd(); });
    [from, to, val].forEach(function (el) { el.addEventListener("input", upd); el.addEventListener("change", upd); });
    document.getElementById("swap").addEventListener("click", function () { var t = from.value; from.value = to.value; to.value = t; upd(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    fill(); upd();
  }

  window.ETBUnits = { convert: convert, U: U };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-units]"); if (f) init(f); });
})();
