/* etoolbox – UK working days calculator. Bank holidays are worked out from the rules for each nation
   (Easter, first/last Mondays, substitute days when a holiday falls at the weekend). Special one-off
   holidays (such as coronations) are listed in EXTRA. */
(function () {
  "use strict";
  var DAY = 86400000;
  var EXTRA = { ew: [], sc: [], ni: [] }; // add one-off holidays here as "YYYY-MM-DD"
  function U(y, m, d) { return Date.UTC(y, m - 1, d); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function d(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? U(+m[1], +m[2], +m[3]) : NaN; }
  function wd(t) { return new Date(t).getUTCDay(); }
  function easter(y) { // anonymous Gregorian algorithm
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return U(y, month, day);
  }
  function firstMon(y, m) { var t = U(y, m, 1); while (wd(t) !== 1) t += DAY; return t; }
  function lastMon(y, m) { var t = U(y, m + 1, 1) - DAY; while (wd(t) !== 1) t -= DAY; return t; }

  // Fixed-date holidays move to the next free weekday when they fall at the weekend
  function withSubs(fixed, taken) {
    var out = [];
    fixed.sort(function (a, b) { return a.t - b.t; }).forEach(function (h) {
      var t = h.t;
      if (wd(t) === 0 || wd(t) === 6) { t += DAY; while (wd(t) === 0 || wd(t) === 6 || taken[t]) t += DAY; out.push({ t: t, n: h.n + " (substitute day)" }); }
      else out.push({ t: t, n: h.n });
      taken[t] = 1;
    });
    return out;
  }

  var NAMES = { ew: "England and Wales", sc: "Scotland", ni: "Northern Ireland" };
  var cache = {};
  function holidays(y, region) {
    var key = region + y; if (cache[key]) return cache[key];
    var e = easter(y), list = [{ t: e - 2 * DAY, n: "Good Friday" }], taken = {}, fixed;
    if (region !== "sc") list.push({ t: e + DAY, n: "Easter Monday" });
    list.push({ t: firstMon(y, 5), n: "Early May bank holiday" }, { t: lastMon(y, 5), n: "Spring bank holiday" });
    list.push(region === "sc" ? { t: firstMon(y, 8), n: "Summer bank holiday" } : { t: lastMon(y, 8), n: "Summer bank holiday" });
    list.forEach(function (h) { taken[h.t] = 1; });
    fixed = [{ t: U(y, 1, 1), n: "New Year's Day" }, { t: U(y, 12, 25), n: "Christmas Day" }, { t: U(y, 12, 26), n: "Boxing Day" }];
    if (region === "sc") fixed.push({ t: U(y, 1, 2), n: "2nd January" }, { t: U(y, 11, 30), n: "St Andrew's Day" });
    if (region === "ni") fixed.push({ t: U(y, 3, 17), n: "St Patrick's Day" }, { t: U(y, 7, 12), n: "Battle of the Boyne (Orangemen's Day)" });
    // handle the New Year pair first so 1/2 January substitutes chain correctly, then the rest in date order
    list = list.concat(withSubs(fixed, taken));
    (EXTRA[region] || []).forEach(function (s) { if (s.slice(0, 4) === String(y)) list.push({ t: d(s), n: "Special bank holiday" }); });
    list.sort(function (a, b) { return a.t - b.t; });
    return (cache[key] = list);
  }
  function holidaySet(a, b, region) {
    var set = {}, y1 = new Date(Math.min(a, b)).getUTCFullYear(), y2 = new Date(Math.max(a, b)).getUTCFullYear() + 1;
    for (var y = y1 - 1; y <= y2; y++) holidays(y, region).forEach(function (h) { set[h.t] = h.n; });
    return set;
  }
  function count(a, b, region, inclEnd) {
    var lo = Math.min(a, b), hi = Math.max(a, b), set = holidaySet(lo, hi, region), r = { days: 0, work: 0, weekend: 0, hols: [] };
    for (var t = lo; inclEnd ? t <= hi : t < hi; t += DAY) {
      r.days++; var w = wd(t);
      if (w === 0 || w === 6) r.weekend++; else if (set[t]) r.hols.push({ t: t, n: set[t] }); else r.work++;
    }
    return r;
  }
  function addWork(a, n, region) {
    var step = n < 0 ? -1 : 1, left = Math.abs(n), t = a, set = holidaySet(a, a + step * (left * 2 + 30) * DAY, region);
    while (left > 0) { t += step * DAY; var w = wd(t); if (w !== 0 && w !== 6 && !set[t]) left--; }
    return t;
  }

  function fmt(t, long) { return new Date(t).toLocaleDateString("en-GB", { timeZone: "UTC", weekday: long ? "long" : "short", day: "numeric", month: long ? "long" : "short", year: "numeric" }); }
  function init(form) {
    var E = form.elements, out = document.getElementById("wd-out");
    function today() { var n = new Date(); return U(n.getFullYear(), n.getMonth() + 1, n.getDate()); }
    function calc() {
      document.querySelectorAll("[data-wd-mode]").forEach(function (el) { el.hidden = el.getAttribute("data-wd-mode") !== E.mode.value; });
      var reg = E.region.value, html = "";
      if (E.mode.value === "between") {
        var a = d(E.from.value), b = d(E.to.value); if (isNaN(a) || isNaN(b)) { out.innerHTML = '<p class="muted">Pick two dates.</p>'; return; }
        var r = count(a, b, reg, E.incl.checked);
        html = '<div class="due-hero"><span class="due-l">Working days</span><strong class="due-d">' + r.work.toLocaleString("en-GB") + " working day" + (r.work === 1 ? "" : "s") + "</strong>" +
          '<span class="due-s">' + r.days.toLocaleString("en-GB") + " days in total · " + r.weekend + " weekend days · " + r.hols.length + " bank holiday" + (r.hols.length === 1 ? "" : "s") + " in " + NAMES[reg] + "</span></div>";
        if (r.hols.length) html += '<h3 class="ms-h">Bank holidays in this period</h3><ul class="ms">' + r.hols.map(function (h) { return '<li><span class="ms-d">' + fmt(h.t) + '</span><span class="ms-n">' + h.n + "</span></li>"; }).join("") + "</ul>";
        form.setAttribute("data-result", String(r.work));
      } else {
        var s = d(E.start.value), n = parseInt(E.n.value, 10); if (isNaN(s) || isNaN(n)) { out.innerHTML = '<p class="muted">Pick a start date and a number of days.</p>'; return; }
        var t = addWork(s, E.dir.value === "sub" ? -n : n, reg);
        html = '<div class="due-hero"><span class="due-l">' + Math.abs(n) + " working days " + (E.dir.value === "sub" ? "before" : "after") + " " + fmt(s) + '</span><strong class="due-d">' + fmt(t, true) + "</strong>" +
          '<span class="due-s">Skipping weekends and ' + NAMES[reg] + " bank holidays</span></div>";
        form.setAttribute("data-result", iso(t));
      }
      var y = new Date(E.mode.value === "between" ? d(E.from.value) || today() : d(E.start.value) || today()).getUTCFullYear();
      html += '<h3 class="ms-h">' + NAMES[reg] + " bank holidays " + y + '</h3><ul class="ms wd-year">' + holidays(y, reg).map(function (h) { return '<li class="' + (h.t < today() ? "past" : "") + '"><span class="ms-d">' + fmt(h.t) + '</span><span class="ms-n">' + h.n + "</span></li>"; }).join("") + "</ul>";
      out.innerHTML = html;
    }
    var t0 = today();
    if (!E.from.value) E.from.value = iso(t0); if (!E.to.value) E.to.value = iso(t0 + 30 * DAY); if (!E.start.value) E.start.value = iso(t0);
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); });
    calc();
  }

  window.ETBWorkdays = { holidays: function (y, r) { return holidays(y, r).map(function (h) { return iso(h.t) + " " + h.n; }); },
    count: function (a, b, r, i) { var x = count(d(a), d(b), r, i); return { work: x.work, weekend: x.weekend, hols: x.hols.length, days: x.days }; },
    addWork: function (a, n, r) { return iso(addWork(d(a), n, r)); }, easter: function (y) { return iso(easter(y)); } };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-workdays]"); if (f) init(f); });
})();
