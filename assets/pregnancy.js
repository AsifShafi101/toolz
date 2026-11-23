/* etoolbox – pregnancy due date and ovulation calculators. Standard obstetric date rules
   (Naegele's rule with cycle adjustment), NHS-style milestones. Dates are handled as whole UTC days. */
(function () {
  "use strict";
  var DAY = 86400000;
  function d(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
  function today() { var t = new Date(); return Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()); }
  function add(t, n) { return t + n * DAY; }
  function fmt(t, long) { return new Date(t).toLocaleDateString("en-GB", { timeZone: "UTC", weekday: long ? "long" : "short", day: "numeric", month: long ? "long" : "short", year: "numeric" }); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }

  // method: lmp | conception | ivf5 | ivf3 | due
  function dueDate(method, date, cycle) {
    var t = d(date); if (isNaN(t)) return NaN;
    cycle = +cycle || 28;
    return method === "lmp" ? add(t, 280 + (cycle - 28)) : method === "conception" ? add(t, 266) : method === "ivf5" ? add(t, 261) : method === "ivf3" ? add(t, 263) : t;
  }
  function gestation(due, on) { var days = 280 - Math.round((due - on) / DAY); return { days: days, w: Math.floor(days / 7), d: ((days % 7) + 7) % 7 }; }
  function trimester(w) { return w < 13 ? 1 : w < 28 ? 2 : 3; }

  function milestones(due) {
    var start = add(due, -280), at = function (w, dd) { return add(start, w * 7 + (dd || 0)); };
    var ewc = add(due, -new Date(due).getUTCDay()); // expected week of childbirth starts on Sunday
    return [
      { t: at(8), e: at(10), n: "Booking appointment with a midwife", note: "Ideally by 10 weeks" },
      { t: at(11, 2), e: at(14, 1), n: "Dating scan", note: "Between 11 and 14 weeks" },
      { t: at(16), e: null, n: "Whooping cough vaccine offered", note: "From 16 weeks" },
      { t: at(18), e: at(20, 6), n: "Mid-pregnancy scan", note: "Between 18 and 21 weeks" },
      { t: at(20), e: null, n: "MATB1 maternity certificate available", note: "From your midwife or GP" },
      { t: add(ewc, -15 * 7 + 6), e: null, n: "Tell your employer you're pregnant", note: "By the end of the 15th week before your due week (UK)" },
      { t: add(ewc, -11 * 7), e: null, n: "Earliest start of maternity leave", note: "11 weeks before your due week (UK)" },
      { t: at(28), e: null, n: "Third trimester begins", note: "28 weeks" },
      { t: at(37), e: null, n: "Full term", note: "37 weeks" },
      { t: due, e: null, n: "Estimated due date", note: "40 weeks" }
    ];
  }

  function cycles(lmp, cycle, period, count) {
    var t = d(lmp), out = []; cycle = Math.max(20, Math.min(45, +cycle || 28)); period = Math.max(1, Math.min(10, +period || 5));
    if (isNaN(t)) return out;
    for (var k = 0; k < (count || 3); k++) {
      var start = add(t, k * cycle), next = add(start, cycle), ov = add(next, -14);
      out.push({ start: start, periodEnd: add(start, period - 1), fertileStart: add(ov, -5), fertileEnd: add(ov, 1), ovulation: ov, next: next, test: next });
    }
    return out;
  }

  function initDue(form) {
    var E = form.elements, out = document.getElementById("due-out");
    function show() { document.querySelectorAll("[data-for-method]").forEach(function (el) { el.hidden = el.getAttribute("data-for-method").split(" ").indexOf(E.method.value) < 0; }); }
    function calc() {
      show();
      var due = dueDate(E.method.value, E.date.value, E.cycle.value), now = today();
      if (isNaN(due)) { out.innerHTML = '<p class="muted">Enter a date to see your due date.</p>'; form.removeAttribute("data-due"); return; }
      var g = gestation(due, now), lab = { lmp: "first day of your last period", conception: "conception date", ivf5: "embryo transfer date", ivf3: "embryo transfer date", due: "due date" }[E.method.value];
      if (g.days < 0 || g.days > 44 * 7) { out.innerHTML = '<p class="warn">That date gives a pregnancy of ' + (g.days < 0 ? "less than 0" : "more than 44") + " weeks today. Please check the " + lab + ".</p>"; form.removeAttribute("data-due"); return; }
      var pct = Math.max(0, Math.min(100, g.days / 280 * 100)), left = Math.round((due - now) / DAY), tri = trimester(g.w);
      var ms = milestones(due).map(function (m) {
        var past = (m.e || m.t) < now, cur = m.t <= now && (m.e || m.t) >= now;
        return '<li class="' + (past ? "past" : cur ? "now" : "") + '"><span class="ms-d">' + fmt(m.t) + (m.e ? " – " + fmt(m.e) : "") + '</span><span class="ms-n"><strong>' + m.n + "</strong> <span class=\"muted\">" + m.note + "</span></span></li>";
      }).join("");
      out.innerHTML = '<div class="due-hero"><span class="due-l">Estimated due date</span><strong class="due-d">' + fmt(due, true) + "</strong>" +
        '<span class="due-s">You are <b>' + g.w + " weeks " + g.d + " day" + (g.d === 1 ? "" : "s") + "</b> pregnant · " + ["", "1st", "2nd", "3rd"][tri] + " trimester · " + (left >= 0 ? left + " days to go" : -left + " days past your due date") + "</span>" +
        '<div class="due-bar" role="img" aria-label="' + Math.round(pct) + '% of the way to your due date"><i style="width:' + pct.toFixed(1) + '%"></i><span style="left:' + (13 / 40 * 100) + '%"></span><span style="left:' + (28 / 40 * 100) + '%"></span></div>' +
        '<div class="due-tri"><span>1st trimester</span><span>2nd</span><span>3rd</span></div></div>' +
        '<h3 class="ms-h">Key dates</h3><ul class="ms">' + ms + '</ul><p class="hint">Only about 1 in 20 babies arrives on the due date itself; most are born between 37 and 42 weeks. Your dating scan may change your due date.</p>' +
        '<div class="actions"><button type="button" class="btn secondary" id="due-ics">Add key dates to my calendar</button></div>';
      form.setAttribute("data-due", iso(due)); form.setAttribute("data-weeks", g.w + "+" + g.d);
      document.getElementById("due-ics").addEventListener("click", function () { ics(due); });
    }
    function ics(due) {
      var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//etoolbox//pregnancy//EN"];
      milestones(due).forEach(function (m, i) {
        var a = iso(m.t).replace(/-/g, ""), b = iso(add(m.e || m.t, 1)).replace(/-/g, "");
        lines.push("BEGIN:VEVENT", "UID:etb-preg-" + a + "-" + i + "@etoolbox.co.uk", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;VALUE=DATE:" + a, "DTEND;VALUE=DATE:" + b, "SUMMARY:" + m.n, "DESCRIPTION:" + m.note, "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      var a2 = document.createElement("a"), u = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })); a2.href = u; a2.download = "pregnancy-key-dates.ics"; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); });
    if (!E.date.value) E.date.value = iso(add(today(), -70)); E.date.max = iso(add(today(), 300)); calc();
  }

  function initOvu(form) {
    var E = form.elements, out = document.getElementById("ovu-out");
    function calc() {
      var cs = cycles(E.lmp.value, E.cycle.value, E.period.value, 3);
      if (!cs.length) { out.innerHTML = '<p class="muted">Enter the first day of your last period.</p>'; return; }
      var c0 = cs.filter(function (c) { return c.fertileEnd >= today(); })[0] || cs[0];
      var kind = function (t) { for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (t === c.ovulation) return "ov"; if (t >= c.fertileStart && t <= c.fertileEnd) return "fe"; if (t >= c.start && t <= c.periodEnd) return "pe"; } return ""; };
      var first = new Date(cs[0].start), months = [];
      for (var m = 0; m < 3; m++) months.push(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + m, 1));
      var cal = months.map(function (ms) {
        var dt = new Date(ms), y = dt.getUTCFullYear(), mo = dt.getUTCMonth(), dim = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(), lead = (dt.getUTCDay() + 6) % 7, cells = "";
        for (var i = 0; i < lead; i++) cells += "<span></span>";
        for (var day = 1; day <= dim; day++) { var t = Date.UTC(y, mo, day), k = kind(t); cells += '<span class="' + k + (t === today() ? " today" : "") + '"' + (k ? ' title="' + { ov: "Estimated ovulation", fe: "Fertile window", pe: "Period" }[k] + '"' : "") + ">" + day + "</span>"; }
        return '<div class="ovu-m"><h4>' + dt.toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }) + '</h4><div class="ovu-g"><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b><b>S</b><b>S</b>' + cells + "</div></div>";
      }).join("");
      out.innerHTML = '<div class="due-hero"><span class="due-l">Most fertile days</span><strong class="due-d">' + fmt(c0.fertileStart) + " – " + fmt(c0.fertileEnd) + "</strong>" +
        '<span class="due-s">Estimated ovulation <b>' + fmt(c0.ovulation, true) + "</b> · next period around <b>" + fmt(c0.next) + "</b> · pregnancy test from <b>" + fmt(c0.test) + "</b></span></div>" +
        '<div class="ovu-key"><span class="pe">Period</span><span class="fe">Fertile window</span><span class="ov">Ovulation</span></div><div class="ovu-cal">' + cal + "</div>" +
        '<ul class="ms">' + cs.map(function (c) { return '<li><span class="ms-d">' + fmt(c.fertileStart) + " – " + fmt(c.fertileEnd) + '</span><span class="ms-n"><strong>Fertile window</strong> <span class="muted">ovulation around ' + fmt(c.ovulation) + ", next period " + fmt(c.next) + "</span></span></li>"; }).join("") + "</ul>";
      form.setAttribute("data-ovulation", iso(c0.ovulation));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); });
    if (!E.lmp.value) E.lmp.value = iso(add(today(), -10)); E.lmp.max = iso(today()); calc();
  }

  window.ETBPreg = { dueDate: function (m, s, c) { var t = dueDate(m, s, c); return isNaN(t) ? null : iso(t); }, gestation: gestation, cycles: function (a, b, c, n) { return cycles(a, b, c, n).map(function (x) { return { ovulation: iso(x.ovulation), fertileStart: iso(x.fertileStart), fertileEnd: iso(x.fertileEnd), next: iso(x.next) }; }); },
    milestones: function (s) { return milestones(d(s)).map(function (m) { return { n: m.n, t: iso(m.t) }; }); } };
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelector("form[data-due-calc]"); if (f) initDue(f);
    var g = document.querySelector("form[data-ovu-calc]"); if (g) initOvu(g);
  });
})();
