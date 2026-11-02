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

  function values(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) v[el.name] = el.value; } else v[el.name] = el.value;
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
