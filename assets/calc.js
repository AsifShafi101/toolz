/* etoolbox calculators — VAT, margin, hourly rate, percentage. Runs in the browser. */
(function () {
  "use strict";

  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[£,\s%]/g, "")); return isFinite(n) ? n : NaN; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function gbp(n) { return (n < 0 ? "−" : "") + "£" + Math.abs(r2(n)).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return (Math.round(n * 100) / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 }) + "%"; }

  var calcs = {
    vat: function (v) {
      var a = num(v.amount), rate = v.rate === "custom" ? num(v.custom) : num(v.rate);
      if (isNaN(a)) return { error: "Enter an amount." };
      if (isNaN(rate) || rate < 0) return { error: "Enter a valid VAT rate." };
      var r = rate / 100, net, vat, gross;
      if (v.mode === "remove") { gross = a; net = a / (1 + r); vat = gross - net; }
      else { net = a; vat = a * r; gross = a + vat; }
      return { rows: [["Amount before VAT (net)", gbp(net)], ["VAT at " + pct(rate), gbp(vat)], ["Total including VAT (gross)", gbp(gross), true]],
               raw: { net: r2(net), vat: r2(vat), gross: r2(gross) } };
    },
    margin: function (v) {
      var cost = num(v.cost);
      if (isNaN(cost) || cost < 0) return { error: "Enter what the item costs you." };
      var price;
      if (v.mode === "margin") {
        var m = num(v.target); if (isNaN(m)) return { error: "Enter the margin you want." };
        if (m >= 100) return { error: "Margin must be under 100%." };
        price = cost / (1 - m / 100);
      } else if (v.mode === "markup") {
        var k = num(v.target); if (isNaN(k)) return { error: "Enter the markup you want." };
        price = cost * (1 + k / 100);
      } else {
        price = num(v.price); if (isNaN(price) || price <= 0) return { error: "Enter your selling price." };
      }
      var profit = price - cost;
      return { rows: [["Selling price", gbp(price), v.mode !== "find"], ["Profit per sale", gbp(profit)],
                      ["Gross margin", price ? pct(profit / price * 100) : "–", v.mode === "find"], ["Markup", cost ? pct(profit / cost * 100) : "–"]],
               raw: { price: r2(price), profit: r2(profit), margin: price ? r2(profit / price * 100) : null, markup: cost ? r2(profit / cost * 100) : null } };
    },
    hourly: function (v) {
      var income = num(v.income), exp = num(v.expenses) || 0, weeksOff = num(v.weeksoff), hours = num(v.hours);
      if (isNaN(income) || income <= 0) return { error: "Enter the yearly income you want." };
      if (isNaN(weeksOff) || weeksOff < 0 || weeksOff >= 52) return { error: "Weeks off must be between 0 and 51." };
      if (isNaN(hours) || hours <= 0) return { error: "Enter your billable hours per week." };
      var weeks = 52 - weeksOff, totalHours = weeks * hours, rate = (income + exp) / totalHours;
      return { rows: [["Minimum hourly rate", gbp(rate), true], ["Day rate (7.5 billable hours)", gbp(rate * 7.5)],
                      ["Weekly target", gbp((income + exp) / weeks)], ["Billable hours per year", Math.round(totalHours).toLocaleString("en-GB")]],
               raw: { rate: r2(rate) } };
    },
    percent: function (v) {
      var a = num(v.a), b = num(v.b);
      if (isNaN(a) || isNaN(b)) return { error: "Enter both numbers." };
      var res, label;
      if (v.mode === "of") { res = a / 100 * b; label = pct(a) + " of " + b.toLocaleString("en-GB") + " is"; res = r2(res).toLocaleString("en-GB"); }
      else if (v.mode === "is") { if (b === 0) return { error: "The second number can't be 0." }; label = a.toLocaleString("en-GB") + " is this percentage of " + b.toLocaleString("en-GB"); res = pct(a / b * 100); }
      else { if (a === 0) return { error: "The starting value can't be 0." }; var ch = (b - a) / Math.abs(a) * 100; label = "Change from " + a.toLocaleString("en-GB") + " to " + b.toLocaleString("en-GB"); res = (ch > 0 ? "+" : "") + pct(ch) + (ch > 0 ? " increase" : ch < 0 ? " decrease" : ""); }
      return { rows: [[label, res, true]], raw: { result: res } };
    }
  };


  /* ---- UK take-home pay, 2026/27 (verified against GOV.UK, Nov 2026) ---- */
  var TAX = {
    year: "2026/27", pa: 12570, taperFrom: 100000,
    ruk: [[37700, 0.20], [125140, 0.40], [Infinity, 0.45]],
    scot: [[3967, 0.19], [16956, 0.20], [31092, 0.21], [62430, 0.42], [125140, 0.45], [Infinity, 0.48]],
    niPT: 12570, niUEL: 50270, niMain: 0.08, niUpper: 0.02,
    sl: { plan1: [26900, 0.09], plan2: [29385, 0.09], plan4: [33795, 0.09], plan5: [25000, 0.09] }, pg: [21000, 0.06]
  };
  function bandTax(taxable, bands) {
    var tax = 0, prev = 0;
    for (var i = 0; i < bands.length && taxable > prev; i++) { var top = Math.min(taxable, bands[i][0]); tax += (top - prev) * bands[i][1]; prev = bands[i][0]; }
    return tax;
  }
  function takeHome(v) {
    var amt = num(v.salary);
    if (isNaN(amt) || amt <= 0) return { error: "Enter your salary." };
    var gross = v.period === "month" ? amt * 12 : v.period === "week" ? amt * 52 : v.period === "hour" ? amt * (num(v.hoursweek) || 37.5) * 52 : amt;
    var pct = Math.max(0, Math.min(100, num(v.pension) || 0)) / 100, pension = gross * pct;
    var ani = gross - pension, pa = Math.max(0, TAX.pa - Math.max(0, (ani - TAX.taperFrom) / 2));
    var taxable = Math.max(0, ani - pa), tax = bandTax(taxable, v.region === "scotland" ? TAX.scot : TAX.ruk);
    var niPay = v.sacrifice === "yes" ? gross - pension : gross;
    var ni = Math.max(0, Math.min(niPay, TAX.niUEL) - TAX.niPT) * TAX.niMain + Math.max(0, niPay - TAX.niUEL) * TAX.niUpper;
    var sl = 0;
    if (TAX.sl[v.loan]) sl += Math.max(0, niPay - TAX.sl[v.loan][0]) * TAX.sl[v.loan][1];
    if (v.postgrad === "yes") sl += Math.max(0, niPay - TAX.pg[0]) * TAX.pg[1];
    var net = gross - pension - tax - ni - sl;
    var rows = [["Take-home per month", gbp(net / 12), true], ["Take-home per year", gbp(net)], ["Take-home per week", gbp(net / 52)],
      ["Income Tax (year)", gbp(tax)], ["National Insurance (year)", gbp(ni)]];
    if (pension) rows.push(["Pension (year)", gbp(pension)]);
    if (sl) rows.push(["Student loan (year)", gbp(sl)]);
    rows.push(["Tax-free Personal Allowance", gbp(pa)], ["Gross pay (year)", gbp(gross)]);
    return { rows: rows, raw: { gross: r2(gross), tax: r2(tax), ni: r2(ni), sl: r2(sl), pension: r2(pension), net: r2(net), pa: r2(pa) } };
  }

  function payment(principal, monthlyRate, n) { return monthlyRate === 0 ? principal / n : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)); }

  /* ---- Dates ---- */
  var BH_EW = ["2025-01-01","2025-04-18","2025-04-21","2025-05-05","2025-05-26","2025-08-25","2025-12-25","2025-12-26",
    "2026-01-01","2026-04-03","2026-04-06","2026-05-04","2026-05-25","2026-08-31","2026-12-25","2026-12-28",
    "2027-01-01","2027-03-26","2027-03-29","2027-05-03","2027-05-31","2027-08-30","2027-12-27","2027-12-28",
    "2028-01-03","2028-04-14","2028-04-17","2028-05-01","2028-05-29","2028-08-28","2028-12-25","2028-12-26"];
  function d(s) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || ""); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function longDate(dt) { return dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); }
  var DAY = 86400000;
  function ymd(a, b) { // whole years, months, days from a to b (a <= b)
    var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), dd = b.getUTCDate() - a.getUTCDate();
    if (dd < 0) { m--; dd += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    return [y, m, dd];
  }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function todayIso() { var t = new Date(); return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())).toISOString().slice(0, 10); }

  var more = {
    takehome: takeHome,
    loan: function (v) {
      var P = num(v.amount), apr = num(v.apr), n = Math.round(num(v.term) * (v.termunit === "years" ? 12 : 1));
      if (isNaN(P) || P <= 0) return { error: "Enter how much you want to borrow." };
      if (isNaN(apr) || apr < 0) return { error: "Enter the APR." };
      if (!n || n < 1) return { error: "Enter the loan term." };
      var r = Math.pow(1 + apr / 100, 1 / 12) - 1, pay = payment(P, r, n), total = pay * n;
      return { rows: [["Monthly payment", gbp(pay), true], ["Total to repay", gbp(total)], ["Total interest", gbp(total - P)], ["Number of payments", n]],
               raw: { monthly: r2(pay), total: r2(total) } };
    },
    mortgage: function (v) {
      var price = num(v.price), dep = num(v.deposit) || 0, rate = num(v.rate), years = num(v.years);
      if (isNaN(price) || price <= 0) return { error: "Enter the property price." };
      if (dep >= price) return { error: "The deposit must be less than the price." };
      if (isNaN(rate) || rate < 0) return { error: "Enter the interest rate." };
      if (!years || years <= 0) return { error: "Enter the mortgage term." };
      var L = price - dep, n = Math.round(years * 12), r = rate / 100 / 12;
      var pay = v.mtype === "interest" ? L * r : payment(L, r, n), total = v.mtype === "interest" ? pay * n + L : pay * n;
      return { rows: [["Monthly payment", gbp(pay), true], ["Mortgage amount", gbp(L)], ["Loan to value (LTV)", pct(L / price * 100)],
                      ["Total repaid over " + plural(years, "year"), gbp(total)], ["Total interest", gbp(total - L)]],
               raw: { monthly: r2(pay), loan: r2(L), ltv: r2(L / price * 100) } };
    },
    compound: function (v) {
      var P = num(v.initial) || 0, add = num(v.monthly) || 0, rate = num(v.rate), years = num(v.years);
      if (isNaN(rate)) return { error: "Enter the interest rate." };
      if (!years || years <= 0) return { error: "Enter how many years." };
      if (!P && !add) return { error: "Enter a starting amount or monthly saving." };
      var months = Math.round(years * 12), bal = P, i;
      if (v.compounding === "yearly") {
        for (i = 1; i <= months; i++) { bal += add; if (i % 12 === 0) bal *= 1 + rate / 100; }
      } else { var r = rate / 100 / 12; for (i = 1; i <= months; i++) { bal = bal * (1 + r) + add; } }
      var paid = P + add * months;
      return { rows: [["Final balance", gbp(bal), true], ["Total you put in", gbp(paid)], ["Interest earned", gbp(bal - paid)]], raw: { balance: r2(bal), interest: r2(bal - paid) } };
    },
    discount: function (v) {
      var price = num(v.price);
      if (isNaN(price) || price <= 0) return { error: "Enter the original price." };
      if (v.mode === "find") {
        var sale = num(v.sale); if (isNaN(sale)) return { error: "Enter the sale price." };
        return { rows: [["Discount", pct((price - sale) / price * 100) + " off", true], ["You save", gbp(price - sale)]], raw: { pct: r2((price - sale) / price * 100) } };
      }
      var off = num(v.off); if (isNaN(off) || off < 0 || off > 100) return { error: "Enter a discount between 0 and 100%." };
      var extra = num(v.extra) || 0, after = price * (1 - off / 100) * (1 - extra / 100);
      return { rows: [["Sale price", gbp(after), true], ["You save", gbp(price - after)], ["Total discount", pct((price - after) / price * 100)]], raw: { sale: r2(after) } };
    },
    mileage: function (v) {
      var miles = num(v.miles), prior = num(v.prior) || 0, pax = Math.max(0, Math.round(num(v.passengers) || 0)), paid = num(v.paid);
      if (isNaN(miles) || miles <= 0) return { error: "Enter your business miles." };
      var allow;
      if (v.vehicle === "motorcycle") allow = miles * 0.24;
      else if (v.vehicle === "bicycle") allow = miles * 0.20;
      else { var hi = Math.max(0, Math.min(miles, 10000 - prior)); allow = hi * 0.55 + (miles - hi) * 0.25; }
      var paxAllow = v.vehicle === "car" ? pax * miles * 0.05 : 0;
      var rows = [["Tax-free mileage allowance", gbp(allow), true]];
      if (paxAllow) rows.push(["Passenger payments (5p per passenger per mile)", gbp(paxAllow)]);
      var claim = 0;
      if (!isNaN(paid) && paid >= 0) {
        var got = paid / 100 * miles; claim = Math.max(0, allow - got);
        rows.push(["Your employer pays", gbp(got)]);
        if (claim > 0) rows.push(["Mileage Allowance Relief you can claim on", gbp(claim)], ["Worth to a basic-rate taxpayer (20%)", gbp(claim * 0.2)], ["Worth to a higher-rate taxpayer (40%)", gbp(claim * 0.4)]);
        else if (got > allow) rows.push(["Taxable excess (paid above the approved rate)", gbp(got - allow)]);
      }
      return { rows: rows, raw: { allowance: r2(allow), claim: r2(claim) } };
    },
    age: function (v) {
      var dob = d(v.dob), on = d(v.on || todayIso());
      if (!dob) return { error: "Enter a date of birth." };
      if (!on) return { error: "Enter a valid date." };
      if (dob > on) return { error: "The date of birth is after the other date." };
      var a = ymd(dob, on), days = Math.round((on - dob) / DAY);
      var next = new Date(Date.UTC(on.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
      if (next.getUTCMonth() !== dob.getUTCMonth()) next = new Date(Date.UTC(on.getUTCFullYear(), 2, 1)); // 29 Feb -> 1 Mar
      if (next < on) next = new Date(Date.UTC(on.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
      var toNext = Math.round((next - on) / DAY);
      return { rows: [["Age", plural(a[0], "year") + ", " + plural(a[1], "month") + ", " + plural(a[2], "day"), true],
                      ["Total days", days.toLocaleString("en-GB")], ["Total weeks", Math.floor(days / 7).toLocaleString("en-GB")],
                      ["Next birthday", toNext === 0 ? "Today! 🎉" : "in " + plural(toNext, "day")], ["Born on a", dob.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })]],
               raw: { years: a[0], months: a[1], days: a[2], totalDays: days } };
    },
    datediff: function (v) {
      if (v.mode === "add") {
        var s = d(v.start), n = Math.round(num(v.n)); if (!s) return { error: "Enter a start date." }; if (isNaN(n)) return { error: "Enter a number of days." };
        var res;
        if (v.unit === "workdays") {
          res = new Date(s); var step = n < 0 ? -1 : 1, left = Math.abs(n);
          while (left > 0) { res = new Date(res.getTime() + step * DAY); var wd = res.getUTCDay(); if (wd && wd !== 6 && BH_EW.indexOf(iso(res)) < 0) left--; }
        } else if (v.unit === "weeks") res = new Date(s.getTime() + n * 7 * DAY);
        else if (v.unit === "months") { res = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + n, 1)); var last = new Date(Date.UTC(res.getUTCFullYear(), res.getUTCMonth() + 1, 0)).getUTCDate(); res.setUTCDate(Math.min(s.getUTCDate(), last)); }
        else res = new Date(s.getTime() + n * DAY);
        return { rows: [["Result", longDate(res), true]], raw: { date: iso(res) } };
      }
      var a = d(v.start), b = d(v.end);
      if (!a || !b) return { error: "Enter both dates." };
      var swap = a > b; if (swap) { var t = a; a = b; b = t; }
      var total = Math.round((b - a) / DAY) + (v.inclusive === "yes" ? 1 : 0), work = 0, hol = 0;
      for (var x = a.getTime(), endT = b.getTime() + (v.inclusive === "yes" ? DAY : 0); x < endT; x += DAY) {
        var dt = new Date(x), w = dt.getUTCDay();
        if (w && w !== 6) { if (BH_EW.indexOf(iso(dt)) >= 0) hol++; else work++; }
      }
      var y = ymd(a, b);
      return { rows: [["Days between", total.toLocaleString("en-GB") + " days", true], ["Weeks and days", plural(Math.floor(total / 7), "week") + ", " + plural(total % 7, "day")],
                      ["Years, months, days", plural(y[0], "year") + ", " + plural(y[1], "month") + ", " + plural(y[2], "day")],
                      ["Working days (Mon–Fri, excl. bank holidays)", work.toLocaleString("en-GB")], ["Bank holidays in range (England & Wales)", hol]],
               raw: { days: total, workdays: work, holidays: hol } };
    }
  };

  function bmiHeight(v) { return v.hunit === "cm" ? num(v.cm) / 100 : ((num(v.ft) || 0) * 12 + (num(v.inch) || 0)) * 0.0254; }
  function bmiWeight(v) { return v.wunit === "stlb" ? ((num(v.st) || 0) * 14 + (num(v.lb) || 0)) * 0.45359237 : v.wunit === "lb" ? num(v.lbonly) * 0.45359237 : num(v.kg); }
  function weightText(kg, unit) {
    if (unit === "stlb") { var lb = Math.round(kg / 0.45359237), st = Math.floor(lb / 14); return st + "st " + (lb - st * 14) + "lb"; }
    if (unit === "lb") return Math.round(kg / 0.45359237) + " lb";
    return (Math.round(kg * 10) / 10) + " kg";
  }
  more.bmi = function (v) {
    var h = bmiHeight(v), w = bmiWeight(v);
    if (!h || h < 0.5 || h > 2.6) return { error: "Enter your height." };
    if (!w || w < 10 || w > 400) return { error: "Enter your weight." };
    var bmi = w / (h * h), lower = v.ethnic === "yes";
    var over = lower ? 23 : 25, obese = lower ? 27.5 : 30;
    var cat = bmi < 18.5 ? "Underweight range" : bmi < over ? "Healthy weight range" : bmi < obese ? "Overweight range" : bmi < 40 ? "Obese range" : "Severely obese range";
    var lo = 18.5 * h * h, hi = (over - 0.1) * h * h;
    return { rows: [["Your BMI", (Math.round(bmi * 10) / 10).toFixed(1), true], ["Result", cat], ["Healthy weight range for your height", weightText(lo, v.wunit) + " – " + weightText(hi, v.wunit)]],
             raw: { bmi: Math.round(bmi * 10) / 10, category: cat } };
  };
  // Convert entered values when a unit switch is flipped, and remember the choice.
  function bmiUnits(form) {
    var KEY = "etb-bmi-units", r1 = function (n) { return String(Math.round(n * 10) / 10); };
    var prev = {};
    function cur() { var v = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name && (el.type !== "radio" || el.checked)) v[el.name] = el.value; }); return v; }
    try { var saved = JSON.parse(localStorage.getItem(KEY) || "{}"); ["hunit", "wunit"].forEach(function (k) { var el = saved[k] && form.querySelector('input[name="' + k + '"][value="' + saved[k] + '"]'); if (el) el.checked = true; }); } catch (e) {}
    prev = cur();
    form.addEventListener("change", function (e) {
      var t = e.target, now = cur();
      if (t.name === "hunit" && now.hunit !== prev.hunit) {
        var h = bmiHeight(prev);
        if (h) { if (now.hunit === "cm") form.elements.cm.value = Math.round(h * 100); else { var ins = Math.round(h / 0.0254), f = Math.floor(ins / 12); form.elements.ft.value = f; form.elements.inch.value = ins - f * 12; } }
      }
      if (t.name === "wunit" && now.wunit !== prev.wunit) {
        var w = bmiWeight(prev);
        if (w) {
          if (now.wunit === "kg") form.elements.kg.value = r1(w);
          else if (now.wunit === "lb") form.elements.lbonly.value = Math.round(w / 0.45359237);
          else { var lb = Math.round(w / 0.45359237), st = Math.floor(lb / 14); form.elements.st.value = st; form.elements.lb.value = lb - st * 14; }
        }
      }
      if (t.name === "hunit" || t.name === "wunit") { try { localStorage.setItem(KEY, JSON.stringify({ hunit: now.hunit, wunit: now.wunit })); } catch (er) {} }
      prev = cur();
    }, true);
    form.addEventListener("input", function (e) { if (e.target.type !== "radio") prev = cur(); });
  }
  Object.keys(more).forEach(function (k) { calcs[k] = more[k]; });
  calcs._tax = TAX;

  function values(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) v[el.name] = el.value; } else if (el.type === "checkbox") v[el.name] = el.checked ? "yes" : "no"; else v[el.name] = el.value;
    });
    return v;
  }

  function init(form) {
    var kind = form.getAttribute("data-calc"), out = document.getElementById("calc-out");
    function update() {
      var v = values(form);
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) {
        var p = el.getAttribute("data-show-when").split("="); el.hidden = p[1].split("|").indexOf(v[p[0]]) < 0;
      });
      var res = calcs[kind](v);
      if (res.error) { out.innerHTML = '<p class="calc-empty">' + res.error + "</p>"; out.removeAttribute("data-result"); return; }
      out.innerHTML = res.rows.map(function (r) {
        return '<div class="calc-row' + (r[2] ? " big" : "") + '"><span>' + r[0] + "</span><strong>" + r[1] + "</strong></div>";
      }).join("");
      out.setAttribute("data-result", JSON.stringify(res.raw));
    }
    Array.prototype.forEach.call(form.querySelectorAll("input[data-today]"), function (el) { if (!el.value) el.value = todayIso(); });
    if (kind === "bmi") bmiUnits(form);
    // Prefill from the address, e.g. /take-home-pay-calculator/?salary=30000&pension=0
    try {
      new URLSearchParams(location.search).forEach(function (val, key) {
        var els = form.elements[key]; if (!els || val.length > 40) return;
        if (els.length && els[0] && els[0].type === "radio") { Array.prototype.forEach.call(els, function (r) { r.checked = r.value === val; }); }
        else if (els.tagName === "SELECT") { if (els.querySelector('option[value="' + val.replace(/"/g, "") + '"]')) els.value = val; }
        else if (els.type !== "radio" && els.type !== "checkbox") els.value = val;
      });
    } catch (e) {}
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    update();
  }

  window.ETBCalc = calcs;
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelector("form[data-calc]"); if (f) init(f);
  });
})();
