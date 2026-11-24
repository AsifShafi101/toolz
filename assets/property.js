/* etoolbox – UK stamp duty (SDLT England & NI, LBTT Scotland, LTT Wales) and student loan repayment calculators.
   Rates checked 24 Nov 2026 against GOV.UK, gov.scot / Revenue Scotland and gov.wales. Update RATES when they change. */
(function () {
  "use strict";
  var I = Infinity;
  var RATES = {
    sdlt: { std: [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.10], [I, 0.12]], ftb: [[300000, 0], [500000, 0.05]], ftbMax: 500000, surcharge: 0.05, nonRes: 0.02 },
    lbtt: { std: [[145000, 0], [250000, 0.02], [325000, 0.05], [750000, 0.10], [I, 0.12]], ftb: [[175000, 0], [250000, 0.02], [325000, 0.05], [750000, 0.10], [I, 0.12]], ads: 0.08 },
    ltt: { std: [[225000, 0], [400000, 0.06], [750000, 0.075], [1500000, 0.10], [I, 0.12]], higher: [[180000, 0.05], [250000, 0.085], [400000, 0.10], [750000, 0.125], [1500000, 0.15], [I, 0.17]] }
  };
  function bands(price, table, extra) {
    var rows = [], lo = 0, tax = 0;
    for (var i = 0; i < table.length && lo < price; i++) {
      var hi = Math.min(price, table[i][0]), part = hi - lo, rate = table[i][1] + (extra || 0), t = part * rate;
      rows.push({ from: lo, to: hi, rate: rate, tax: t }); tax += t; lo = table[i][0];
    }
    return { tax: tax, rows: rows };
  }
  // region: england | scotland | wales ; buyer: ftb | mover | additional ; nonRes: bool (England & NI only)
  function stampDuty(price, region, buyer, nonRes) {
    price = Math.max(0, +price || 0); var R, res, notes = [], extra = 0;
    if (region === "scotland") {
      R = RATES.lbtt; res = bands(price, buyer === "ftb" ? R.ftb : R.std);
      if (buyer === "additional" && price >= 40000) { var ads = price * R.ads; res.rows.push({ ads: true, rate: R.ads, tax: ads }); res.tax += ads; notes.push("Includes the 8% Additional Dwelling Supplement on the whole price."); }
      if (buyer === "ftb") notes.push("First-time buyer relief raises the 0% band to £175,000 (saving up to £600).");
    } else if (region === "wales") {
      R = RATES.ltt; res = bands(price, buyer === "additional" && price >= 40000 ? R.higher : R.std);
      if (buyer === "ftb") notes.push("Wales has no first-time buyer relief, but no tax is due on the first £225,000.");
      if (buyer === "additional") notes.push("Higher residential rates apply to additional properties.");
    } else {
      R = RATES.sdlt;
      if (buyer === "additional" && price >= 40000) extra += R.surcharge;
      if (nonRes) extra += R.nonRes;
      if (buyer === "ftb" && price <= R.ftbMax) { res = bands(price, R.ftb, extra); notes.push("First-time buyer relief: 0% up to £300,000, then 5% up to £500,000."); }
      else { res = bands(price, R.std, extra); if (buyer === "ftb") notes.push("First-time buyer relief doesn't apply above £500,000, so standard rates are used."); }
      if (buyer === "additional" && price >= 40000) notes.push("Includes the 5% surcharge for additional properties on every band.");
      if (nonRes) notes.push("Includes the 2% non-UK resident surcharge.");
    }
    res.tax = Math.round(res.tax * 100) / 100; res.notes = notes; res.eff = price ? res.tax / price : 0;
    return res;
  }

  // ---- Student loans 2026/27 ----
  var PLANS = { p1: { n: "Plan 1", th: 26900, r: 0.09, wo: "25 years after the April you were first due to repay (or age 65 for older loans)" },
    p2: { n: "Plan 2", th: 29385, r: 0.09, wo: "30 years after the April you were first due to repay" },
    p4: { n: "Plan 4", th: 33795, r: 0.09, wo: "30 years after the April you were first due to repay (or age 65 for older loans)" },
    p5: { n: "Plan 5", th: 25000, r: 0.09, wo: "40 years after the April you were first due to repay" },
    pg: { n: "Postgraduate Loan", th: 21000, r: 0.06, wo: "30 years after the April you were first due to repay" } };
  function loanRepay(salary, plan, pg) {
    salary = Math.max(0, +salary || 0); var out = [], tot = 0;
    if (plan && PLANS[plan]) { var a = Math.max(0, salary - PLANS[plan].th) * PLANS[plan].r; out.push({ k: plan, year: a }); tot += a; }
    if (pg) { var b = Math.max(0, salary - PLANS.pg.th) * PLANS.pg.r; out.push({ k: "pg", year: b }); tot += b; }
    return { items: out, year: tot, month: tot / 12, week: tot / 52 };
  }
  function payoff(balance, salary, plan, rate, growth, maxYears) { // simple yearly projection
    var b = +balance || 0, s = +salary || 0, paid = 0;
    for (var y = 1; y <= maxYears; y++) {
      b *= 1 + (+rate || 0) / 100; var pay = Math.min(b, Math.max(0, s - PLANS[plan].th) * PLANS[plan].r);
      b -= pay; paid += pay; s *= 1 + (+growth || 0) / 100;
      if (b <= 0.5) return { years: y, paid: paid, cleared: true };
    }
    return { years: maxYears, paid: paid, cleared: false, left: b };
  }

  var gbp = function (n, dp) { return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
  var pct = function (r) { return (Math.round(r * 1000) / 10) + "%"; };

  function initStamp(form) {
    var E = form.elements, out = document.getElementById("sd-out");
    function calc() {
      document.getElementById("sd-nonres").hidden = E.region.value !== "england";
      var price = parseFloat(String(E.price.value).replace(/[£,\s]/g, ""));
      if (!(price > 0)) { out.innerHTML = '<p class="muted">Enter the property price.</p>'; return; }
      var r = stampDuty(price, E.region.value, E.buyer.value, E.region.value === "england" && E.nonres.checked);
      var name = { england: "Stamp Duty Land Tax", scotland: "Land and Buildings Transaction Tax", wales: "Land Transaction Tax" }[E.region.value];
      out.innerHTML = '<div class="due-hero"><span class="due-l">' + name + '</span><strong class="due-d">' + gbp(r.tax) + "</strong>" +
        '<span class="due-s">Effective rate ' + pct(r.eff) + " of " + gbp(price) + "</span></div>" +
        '<table class="sal-table sd-table"><thead><tr><th>Portion of the price</th><th>Rate</th><th>Tax</th></tr></thead><tbody>' +
        r.rows.map(function (b) { return b.ads ? "<tr><td>Additional Dwelling Supplement (whole price)</td><td>" + pct(b.rate) + "</td><td>" + gbp(b.tax) + "</td></tr>" :
          "<tr><td>" + gbp(b.from) + (b.to === Infinity ? "+" : " – " + gbp(b.to)) + "</td><td>" + pct(b.rate) + "</td><td>" + gbp(b.tax) + "</td></tr>"; }).join("") +
        "</tbody></table>" + (r.notes.length ? '<ul class="sd-notes">' + r.notes.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul>" : "");
      form.setAttribute("data-tax", String(r.tax));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }

  function initLoan(form) {
    var E = form.elements, out = document.getElementById("sl-out");
    function calc() {
      var sal = parseFloat(String(E.salary.value).replace(/[£,\s]/g, "")) || 0, plan = E.plan.value, r = loanRepay(sal, plan === "none" ? null : plan, E.pg.checked);
      var rows = r.items.map(function (i) { var P = PLANS[i.k]; return "<tr><td>" + P.n + " <span class=\"muted\">(9% above " + gbp(P.th) + ")</span></td><td>" + gbp(i.year / 12, 2) + "</td><td>" + gbp(i.year) + "</td></tr>"; }).join("").replace(/9% above (£21,000)/, "6% above $1");
      var html = '<div class="due-hero"><span class="due-l">Your student loan repayments (2026/27)</span><strong class="due-d">' + gbp(r.month, 2) + " a month</strong>" +
        '<span class="due-s">' + gbp(r.year) + " a year · " + gbp(r.week, 2) + " a week</span></div>";
      if (r.items.length) html += '<table class="sal-table"><thead><tr><th>Loan</th><th>Monthly</th><th>Yearly</th></tr></thead><tbody>' + rows + "</tbody></table>";
      if (!r.year && r.items.length) html += '<p class="hint">You earn less than the repayment threshold, so you don\'t repay anything at the moment. Interest is still added to the balance.</p>';
      var bal = parseFloat(String(E.balance.value).replace(/[£,\s]/g, ""));
      if (bal > 0 && plan !== "none") {
        var maxY = { p1: 25, p2: 30, p4: 30, p5: 40 }[plan], po = payoff(bal, sal, plan, E.rate.value, E.growth.value, maxY);
        html += '<div class="sl-proj"><h3 class="ms-h">Will you pay it off?</h3><p>' + (po.cleared ? "On these assumptions you'd clear " + gbp(bal) + " in about <strong>" + po.years + " year" + (po.years === 1 ? "" : "s") + "</strong>, repaying about <strong>" + gbp(po.paid) + "</strong> in total." :
          "On these assumptions you'd repay about <strong>" + gbp(po.paid) + "</strong> over " + maxY + " years, and the remaining <strong>" + gbp(po.left) + "</strong> would be written off.") +
          '</p><p class="hint">' + PLANS[plan].n + " loans are written off " + PLANS[plan].wo + ". This projection assumes a steady interest rate and pay rise, so treat it as a rough guide.</p></div>";
        form.setAttribute("data-years", String(po.years)); form.setAttribute("data-cleared", String(po.cleared));
      }
      out.innerHTML = html; form.setAttribute("data-month", r.month.toFixed(2));
    }
    form.addEventListener("input", calc); form.addEventListener("change", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }

  window.ETBProperty = { stampDuty: function (p, r, b, n) { var x = stampDuty(p, r, b, n); return x.tax; }, loanRepay: loanRepay, payoff: payoff, PLANS: PLANS };
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelector("form[data-stamp]"); if (f) initStamp(f);
    var g = document.querySelector("form[data-loan]"); if (g) initLoan(g);
  });
})();
