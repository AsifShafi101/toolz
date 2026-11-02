/* etoolbox currency converter — European Central Bank reference rates via the free Frankfurter API. */
(function () {
  "use strict";
  var API = "https://api.frankfurter.dev/v1/latest?base=EUR", KEY = "etb-fx-v1", MAX_AGE = 6 * 3600 * 1000;
  var POPULAR = ["GBP", "EUR", "USD", "AUD", "CAD", "JPY", "CHF", "CNY", "INR", "PLN", "SEK", "TRY", "AED"];

  function names(code) { try { return new Intl.DisplayNames(["en-GB"], { type: "currency" }).of(code); } catch (e) { return code; } }
  function cached() { try { var c = JSON.parse(localStorage.getItem(KEY)); return c && c.rates ? c : null; } catch (e) { return null; } }
  function getRates() {
    var c = cached();
    if (c && Date.now() - c.saved < MAX_AGE) return Promise.resolve(c);
    return fetch(API).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (j) {
      j.rates.EUR = 1; var d = { rates: j.rates, date: j.date, saved: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
      return d;
    }).catch(function (e) { if (c) { c.stale = true; return c; } throw e; });
  }
  function convert(rates, amount, from, to) { return amount / rates[from] * rates[to]; }
  function fmt(n, code) { try { return n.toLocaleString("en-GB", { style: "currency", currency: code, maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2 }); } catch (e) { return n.toFixed(2) + " " + code; } }

  function init(form) {
    var out = document.getElementById("fx-out"), info = document.getElementById("fx-info"), table = document.getElementById("fx-table"), data = null;
    function upd() {
      if (!data) return;
      var a = parseFloat(String(form.elements.amount.value).replace(/[,£$€\s]/g, "")), f = form.elements.from.value, t = form.elements.to.value;
      if (isNaN(a)) { out.innerHTML = '<p class="calc-empty">Enter an amount.</p>'; return; }
      var r = convert(data.rates, a, f, t), unit = convert(data.rates, 1, f, t);
      out.innerHTML = '<div class="calc-row big"><span>' + fmt(a, f) + " =</span><strong>" + fmt(r, t) + "</strong></div>" +
        '<div class="calc-row"><span>1 ' + f + "</span><strong>" + unit.toFixed(4) + " " + t + '</strong></div><div class="calc-row"><span>1 ' + t + "</span><strong>" + (1 / unit).toFixed(4) + " " + f + "</strong></div>";
      out.setAttribute("data-result", JSON.stringify({ value: Math.round(r * 100) / 100, rate: unit }));
      table.innerHTML = POPULAR.filter(function (c) { return c !== f && data.rates[c]; }).slice(0, 10).map(function (c) {
        return '<div class="calc-row"><span>' + names(c) + " (" + c + ")</span><strong>" + fmt(convert(data.rates, a, f, c), c) + "</strong></div>";
      }).join("");
    }
    out.innerHTML = '<p class="calc-empty">Loading today\'s rates…</p>';
    getRates().then(function (d) {
      data = d;
      var codes = Object.keys(d.rates).sort(function (a, b) { var pa = POPULAR.indexOf(a), pb = POPULAR.indexOf(b); return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.localeCompare(b); });
      var opts = codes.map(function (c) { return '<option value="' + c + '">' + c + " – " + names(c) + "</option>"; }).join("");
      form.elements.from.innerHTML = opts; form.elements.to.innerHTML = opts; form.elements.from.value = "GBP"; form.elements.to.value = "EUR";
      var q = /[?&]from=([A-Z]{3}).*?[?&]?to=([A-Z]{3})/.exec(location.search); if (q && d.rates[q[1]] && d.rates[q[2]]) { form.elements.from.value = q[1]; form.elements.to.value = q[2]; }
      info.textContent = "European Central Bank reference rates for " + new Date(d.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + (d.stale ? " (offline; showing saved rates)" : "") + ". Updated every working day around 4pm CET.";
      upd();
    }).catch(function () { out.innerHTML = '<p class="calc-empty">Couldn\'t load exchange rates right now. Please check your connection and try again.</p>'; });
    form.addEventListener("input", upd); form.addEventListener("change", upd);
    document.getElementById("fx-swap").addEventListener("click", function () { var t = form.elements.from.value; form.elements.from.value = form.elements.to.value; form.elements.to.value = t; upd(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  window.ETBFx = { convert: convert };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-fx]"); if (f) init(f); });
})();
