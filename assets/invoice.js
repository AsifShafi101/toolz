/* etoolbox invoice & quote generator. Everything stays in the browser (details saved in localStorage).
   Free: units per line, any currency, optional second-currency total. Pro: company logo. */
(function () {
  "use strict";

  var STORE = "etb-invoice-v1", LOGO = "etb-invoice-logo";
  var CURRENCIES = ["GBP", "EUR", "USD", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "TRY", "AED", "SAR", "QAR", "INR", "PKR", "BDT", "LKR", "NGN", "KES", "GHS", "ZAR", "EGP", "MAD", "JPY", "CNY", "HKD", "SGD", "MYR", "THB", "PHP", "IDR", "KRW", "BRL", "MXN"];
  var UNITS = [["", "—"], ["item", "item"], ["hour", "hour"], ["day", "day"], ["week", "week"], ["month", "month"], ["year", "year"], ["job", "job"], ["unit", "unit"], ["session", "session"], ["night", "night"], ["person", "person"], ["page", "page"], ["word", "word"], ["mile", "mile"], ["km", "km"], ["m", "m"], ["m²", "m²"], ["kg", "kg"], ["litre", "litre"]];
  var NO_PLURAL = { "m": 1, "m²": 1, "kg": 1, "km": 1 };
  var SHORT = { hour: "hr", month: "mo", week: "wk", year: "yr" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nl(s) { return esc(s).replace(/\n/g, "<br>"); }
  function num(v) { var n = parseFloat(String(v || "").replace(/[£$€,\s]/g, "")); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function money(n, cur) {
    try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: cur || "GBP" }).format(r2(n)); }
    catch (e) { return (cur || "") + " " + r2(n).toFixed(2); }
  }
  function curName(c) { try { return new Intl.DisplayNames(["en-GB"], { type: "currency" }).of(c); } catch (e) { return c; } }
  function unitLabel(u, qty) { if (!u) return ""; return qty === 1 || NO_PLURAL[u] ? u : u + "s"; }
  function fmtDate(iso) { if (!iso) return ""; var d = new Date(iso + "T12:00:00"); return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function isoToday(addDays) { var d = new Date(); d.setDate(d.getDate() + (addDays || 0)); return d.toISOString().slice(0, 10); }

  function compute(items) {
    var sub = 0, vatBy = {}, lines = items.map(function (it) {
      var net = r2(num(it.qty) * num(it.price)), rate = it.vat === "none" ? null : num(it.vat), vat = rate == null ? 0 : r2(net * rate / 100);
      sub += net; if (rate != null) vatBy[rate] = r2((vatBy[rate] || 0) + vat);
      return { desc: it.desc, qty: num(it.qty), price: num(it.price), unit: it.unit || "", rate: rate, net: net, vat: vat };
    });
    var vatTotal = Object.keys(vatBy).reduce(function (s, k) { return s + vatBy[k]; }, 0);
    return { lines: lines, subtotal: r2(sub), vatBy: vatBy, vat: r2(vatTotal), total: r2(sub + vatTotal) };
  }

  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* storage unavailable */ } }
  function getLogo() { try { return localStorage.getItem(LOGO) || ""; } catch (e) { return ""; } }
  function setLogo(v) { try { if (v) localStorage.setItem(LOGO, v); else localStorage.removeItem(LOGO); return true; } catch (e) { return false; } }

  // Resize a logo to max 600px and return a data URL (PNG keeps transparency; large ones fall back to JPEG).
  function prepareLogo(file) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error("Please choose an image (PNG, JPG, SVG or WebP)."));
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth || 600, h = img.naturalHeight || 300, s = Math.min(1, 600 / w, 300 / h), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
        var x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var out = c.toDataURL("image/png");
        if (out.length > 400000) { var j = document.createElement("canvas"); j.width = c.width; j.height = c.height; var jx = j.getContext("2d"); jx.fillStyle = "#fff"; jx.fillRect(0, 0, j.width, j.height); jx.drawImage(c, 0, 0); out = j.toDataURL("image/jpeg", 0.88); }
        res(out);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error("This image couldn't be opened.")); };
      img.src = u;
    });
  }

  function init(form) {
    var kind = form.getAttribute("data-doc"), isQuote = kind === "quote", label = isQuote ? "Quote" : "Invoice";
    var tbody = document.getElementById("items"), preview = document.getElementById("doc");
    var saved = load(), remember = ["bizname", "bizaddress", "bizemail", "bizphone", "vatno", "payment", "currency", "cur2", "logosize", "docstyle", "c1", "c2", "c3"];
    var logo = getLogo(), rates = null, rateFor = "";
    var pro = function () { return !!(window.ETBPro && ETBPro.isPro()); };
    var TKEY = "title_" + kind, forceDefault = false;
    var title = function () { var t = forceDefault ? "" : (form.elements.doctitle.value || "").trim(); return t || label; };
    var customTitle = function () { return title() !== label; };
    var DEF = ["#12355b", "#d9483b", "#12355b"];
    var colours = function () { return forceDefault ? DEF : ["c1", "c2", "c3"].map(function (k, i) { return /^#[0-9a-f]{6}$/i.test(form.elements[k].value) ? form.elements[k].value : DEF[i]; }); };
    var customColours = function () { return colours().join() !== DEF.join(); };
    Array.prototype.forEach.call(document.querySelectorAll("#swatches .sw"), function (b) {
      b.addEventListener("click", function () { b.getAttribute("data-c").split(",").forEach(function (c, i) { form.elements["c" + (i + 1)].value = c; }); render(); });
    });
    if (saved[TKEY]) form.elements.doctitle.value = saved[TKEY];

    // Currency dropdowns
    var curOpts = CURRENCIES.map(function (c) { return '<option value="' + c + '">' + c + " – " + esc(curName(c)) + "</option>"; }).join("");
    form.elements.currency.innerHTML = curOpts;
    form.elements.cur2.innerHTML = '<option value="">Don\'t show</option>' + curOpts;

    function addRow(it) {
      it = it || { desc: "", qty: "1", unit: "", price: "", vat: saved.defaultVat || "20" };
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><input type="text" class="i-desc" placeholder="Description" aria-label="Description"></td>' +
        '<td><input type="text" class="i-qty" inputmode="decimal" aria-label="Quantity"></td>' +
        '<td><select class="i-unit" aria-label="Unit">' + UNITS.map(function (u) { return '<option value="' + u[0] + '">' + u[1] + "</option>"; }).join("") + "</select></td>" +
        '<td><input type="text" class="i-price" inputmode="decimal" placeholder="0.00" aria-label="Unit price"></td>' +
        '<td><select class="i-vat" aria-label="VAT rate"><option value="20">20%</option><option value="5">5%</option><option value="0">0%</option><option value="none">No VAT</option></select></td>' +
        '<td><button type="button" class="row-del" aria-label="Remove line">×</button></td>';
      tr.querySelector(".i-desc").value = it.desc; tr.querySelector(".i-qty").value = it.qty; tr.querySelector(".i-unit").value = it.unit || "";
      tr.querySelector(".i-price").value = it.price; tr.querySelector(".i-vat").value = it.vat;
      tr.querySelector(".row-del").addEventListener("click", function () { if (tbody.children.length > 1) { tr.remove(); render(); } });
      tbody.appendChild(tr);
    }

    function items() {
      return Array.prototype.map.call(tbody.children, function (tr) {
        return { desc: tr.querySelector(".i-desc").value, qty: tr.querySelector(".i-qty").value, unit: tr.querySelector(".i-unit").value, price: tr.querySelector(".i-price").value, vat: tr.querySelector(".i-vat").value };
      });
    }

    function fetchRate() {
      var a = form.elements.currency.value, b = form.elements.cur2.value, key = a + ">" + b;
      if (!b || b === a) return;
      if (rateFor === key && form.elements.rate2.value) return;
      var apply = function () {
        if (rates && rates[a] && rates[b]) { form.elements.rate2.value = (rates[b] / rates[a]).toFixed(4); document.getElementById("rate-note").textContent = "ECB rate for " + fmtDate(rates._date) + ". You can change it."; }
        else { form.elements.rate2.value = ""; document.getElementById("rate-note").textContent = "No automatic rate for this pair. Type the rate you want to use."; }
        rateFor = key; render();
      };
      if (rates) return apply();
      fetch("https://api.frankfurter.dev/v1/latest?base=EUR").then(function (r) { return r.json(); }).then(function (j) { rates = j.rates; rates.EUR = 1; rates._date = j.date; apply(); })
        .catch(function () { document.getElementById("rate-note").textContent = "Couldn't load today's rate. Type the rate you want to use."; });
    }

    function render() {
      var f = form.elements, cur = f.currency.value || "GBP", m = function (n) { return money(n, cur); };
      var c = compute(items()), anyVat = c.lines.some(function (l) { return l.rate != null; });
      var rows = c.lines.filter(function (l) { return l.desc || l.price; }).map(function (l) {
        var q = l.qty.toLocaleString("en-GB") + (l.unit ? " " + esc(unitLabel(l.unit, l.qty)) : "");
        var p = m(l.price) + (l.unit ? '<span class="per"> / ' + esc(SHORT[l.unit] || l.unit) + "</span>" : "");
        return "<tr><td>" + nl(l.desc) + '</td><td class="n">' + q + '</td><td class="n">' + p + "</td>" +
          (anyVat ? '<td class="n">' + (l.rate == null ? "–" : l.rate + "%") + "</td>" : "") + '<td class="n">' + m(l.net) + "</td></tr>";
      }).join("") || '<tr><td colspan="5" class="muted">Add your items on the left.</td></tr>';
      var vatRows = Object.keys(c.vatBy).sort(function (a, b) { return b - a; }).map(function (k) {
        return "<tr><td>VAT at " + k + '%</td><td class="n">' + m(c.vatBy[k]) + "</td></tr>";
      }).join("");
      var cur2 = f.cur2.value, rate = num(f.rate2.value), conv = cur2 && cur2 !== cur && rate > 0;
      document.getElementById("rate-row").hidden = !cur2 || cur2 === cur;
      var due = f.due.value ? '<div><span>' + (isQuote ? "Valid until" : "Due date") + "</span><strong>" + fmtDate(f.due.value) + "</strong></div>" : "";
      var size = { s: 44, m: 64, l: 90 }[f.logosize.value || "m"];
      var logoHtml = logo ? '<div class="doc-logo' + (pro() ? "" : " locked") + '"><img src="' + logo + '" alt="" style="max-height:' + size + 'px">' + (pro() ? "" : '<span class="pro-tag">PRO</span>') + "</div>" : "";
      var T = esc(title()), bizLines = [nl(f.bizaddress.value), esc(f.bizemail.value), esc(f.bizphone.value), f.vatno.value ? "VAT reg. no. " + esc(f.vatno.value) : ""].filter(Boolean);
      var itemsHead = '<table class="doc-items"><thead><tr><th>Description</th><th class="n">Qty</th><th class="n">Unit price</th>' + (anyVat ? '<th class="n">VAT</th>' : "") + '<th class="n">Amount</th></tr></thead><tbody>' + rows + "</tbody></table>";
      var totals = '<table class="doc-totals"><tr><td>Subtotal</td><td class="n">' + m(c.subtotal) + "</td></tr>" + vatRows +
        '<tr class="grand"><td>Total' + (isQuote ? "" : " due") + '</td><td class="n" id="doc-total">' + m(c.total) + "</td></tr>" +
        (conv ? '<tr class="conv"><td>Approx. in ' + cur2 + '</td><td class="n" id="doc-total2">' + money(c.total * rate, cur2) + '</td></tr><tr class="conv-note"><td colspan="2">1 ' + cur + " = " + rate + " " + cur2 + "</td></tr>" : "") + "</table>";
      var powered = pro() ? "" : '<div class="doc-powered"><span>Powered by</span><img src="/assets/logo-face.svg" alt=""><b>etoolbox.co.uk</b></div>';
      var C = colours(); preview.style.setProperty("--c1", C[0]); preview.style.setProperty("--c2", C[1]); preview.style.setProperty("--c3", C[2]);
      var biz = esc(f.bizname.value);
      var thanks = biz ? '<div class="b-thanks"><em>Thank you for doing business with</em><strong>' + biz + "</strong></div>" : '<div class="b-thanks"><em>Thank you for your business</em></div>';
      var style = f.docstyle.value || "bold";
      preview.className = "doc " + style;
      if (style === "bold") {
        preview.innerHTML =
          '<div class="b-band"></div><div class="b-head"><div><div class="doc-title">' + esc(title().toUpperCase()) + '</div><div class="b-rule"></div></div>' + logoHtml + "</div>" +
          '<div class="doc-biz">' + (esc(f.bizname.value) || "Your business name") + '</div><div class="b-bizlines">' + bizLines.join("<br>") + "</div>" +
          '<div class="b-meta"><div class="doc-to"><h4>' + (isQuote ? "Quote for" : "Bill to") + "</h4><strong>" + (esc(f.client.value) || "Client name") + "</strong><div>" + nl(f.clientaddress.value) + "</div></div>" +
          '<dl class="doc-facts"><dt>' + T + " #</dt><dd>" + esc(f.number.value) + "</dd><dt>" + T + " date</dt><dd>" + fmtDate(f.date.value) + "</dd>" +
          (f.due.value ? "<dt>" + (isQuote ? "Valid until" : "Due date") + "</dt><dd>" + fmtDate(f.due.value) + "</dd>" : "") +
          (cur !== "GBP" ? "<dt>Currency</dt><dd>" + cur + "</dd>" : "") + "</dl></div>" +
          itemsHead + totals +
          (f.notes.value ? '<div class="doc-notes"><h4>Notes</h4><div>' + nl(f.notes.value) + "</div></div>" : "") +
          '<div class="b-foot">' + thanks +
          (f.payment.value ? '<div class="b-terms"><h4>' + (isQuote ? "Terms & conditions" : "Payment details") + "</h4><div>" + nl(f.payment.value) + "</div></div>" : "") + "</div>" + powered;
      } else {
        preview.innerHTML =
          '<div class="doc-top"><div>' + logoHtml + '<div class="doc-biz">' + (esc(f.bizname.value) || "Your business name") + '</div><div class="muted">' + nl(f.bizaddress.value) + "</div>" +
          '<div class="muted">' + [esc(f.bizemail.value), esc(f.bizphone.value)].filter(Boolean).join(" · ") + "</div>" +
          (f.vatno.value ? '<div class="muted">VAT reg. no. ' + esc(f.vatno.value) + "</div>" : "") + "</div>" +
          '<div class="doc-title">' + esc(title().toUpperCase()) + "</div></div>" +
          '<div class="doc-meta"><div class="doc-to"><span>' + (isQuote ? "Quote for" : "Bill to") + "</span><strong>" + (esc(f.client.value) || "Client name") + "</strong><div>" + nl(f.clientaddress.value) + "</div></div>" +
          '<div class="doc-facts"><div><span>' + T + " no.</span><strong>" + esc(f.number.value) + "</strong></div><div><span>Date</span><strong>" + fmtDate(f.date.value) + "</strong></div>" + due +
          (cur !== "GBP" ? "<div><span>Currency</span><strong>" + cur + "</strong></div>" : "") + "</div></div>" +
          itemsHead + totals +
          (f.payment.value ? '<div class="doc-notes"><span>' + (isQuote ? "Terms" : "Payment details") + "</span><div>" + nl(f.payment.value) + "</div></div>" : "") +
          (f.notes.value ? '<div class="doc-notes"><span>Notes</span><div>' + nl(f.notes.value) + "</div></div>" : "") + powered;
      }
      document.getElementById("pro-active").hidden = !pro();
      preview.setAttribute("data-total", c.total);
      preview.setAttribute("data-currency", cur);
      var keep = load(); keep.defaultVat = (items()[0] || {}).vat; keep.nextNumber = keep.nextNumber || saved.nextNumber || {};
      remember.forEach(function (k) { keep[k] = f[k].value; });
      keep[TKEY] = f.doctitle.value;
      document.getElementById("title-pro-note").hidden = !customTitle() || pro();
      document.getElementById("colour-pro-note").hidden = !customColours() || pro();
      save(keep);
      document.getElementById("logo-remove").hidden = !logo;
      document.getElementById("logo-pro-note").hidden = !logo || pro();
    }

    // Restore saved business details and set defaults
    remember.forEach(function (k) { if (saved[k] != null && form.elements[k]) form.elements[k].value = saved[k]; });
    if (!form.elements.currency.value) form.elements.currency.value = "GBP";
    var prefix = isQuote ? "QUO-" : "INV-", next = (saved.nextNumber && saved.nextNumber[kind]) || 1;
    form.elements.number.value = prefix + String(next).padStart(4, "0");
    form.elements.date.value = isoToday(0);
    form.elements.due.value = isoToday(isQuote ? 30 : 14);
    addRow();

    // Logo (Pro)
    var logoMsg = document.getElementById("logo-msg");
    document.getElementById("logo-file").addEventListener("change", function (e) {
      var file = e.target.files[0]; e.target.value = ""; if (!file) return;
      prepareLogo(file).then(function (d) {
        logo = d; if (!setLogo(d)) logoMsg.textContent = "Your browser couldn't save the logo, so you'll need to add it again next time.";
        else logoMsg.textContent = pro() ? "✓ Logo added." : "Logo added to the preview. Downloading invoices with your logo is a Pro feature.";
        render();
      }).catch(function (err) { logoMsg.textContent = err.message; });
    });
    document.getElementById("logo-remove").addEventListener("click", function () { logo = ""; setLogo(""); logoMsg.textContent = ""; render(); });

    // Pro modal
    var modal = document.getElementById("pro-modal");
    function openModal() { modal.hidden = false; document.getElementById("pro-key").focus(); }
    function closeModal() { modal.hidden = true; document.getElementById("pro-msg").textContent = ""; }
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
    document.getElementById("pro-activate").addEventListener("click", function () {
      var b = this, msg = document.getElementById("pro-msg"); b.disabled = true; msg.textContent = "Checking…";
      ETBPro.activate(document.getElementById("pro-key").value).then(function (r) {
        msg.className = "good"; msg.textContent = "✓ Pro unlocked" + (r.expires ? " until " + fmtDate(String(r.expires).slice(0, 10)) : "") + ". Thank you!";
        render(); setTimeout(function () { closeModal(); doPrint(); }, 900);
      }).catch(function (err) { msg.className = "warn"; msg.textContent = err.message; }).then(function () { b.disabled = false; });
    });
    document.getElementById("pro-nologo").addEventListener("click", function () { closeModal(); doPrint(true); });

    function doPrint(withoutLogo) {
      var keepLogo = logo;
      if (withoutLogo) { logo = ""; forceDefault = true; }
      render();
      var s = load(); s.nextNumber = s.nextNumber || {};
      var mm = /(\d+)\s*$/.exec(form.elements.number.value); if (mm) s.nextNumber[kind] = parseInt(mm[1], 10) + 1;
      save(s); saved = s;
      var t = document.title; document.title = title() + " " + form.elements.number.value;
      window.print();
      document.title = t;
      if (withoutLogo) { logo = keepLogo; forceDefault = false; render(); }
    }

    document.getElementById("add-row").addEventListener("click", function () { addRow(); render(); tbody.lastChild.querySelector(".i-desc").focus(); });
    form.addEventListener("input", function (e) { if (e.target.name === "rate2") rateFor = form.elements.currency.value + ">" + form.elements.cur2.value; render(); });
    form.addEventListener("change", function (e) { if (e.target.name === "currency" || e.target.name === "cur2") { rateFor = ""; fetchRate(); } render(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("print-doc").addEventListener("click", function () { if ((logo || customTitle() || customColours()) && !pro()) { openModal(); return; } doPrint(); });
    document.getElementById("clear-doc").addEventListener("click", function () {
      ["client", "clientaddress", "notes"].forEach(function (k) { form.elements[k].value = ""; });
      tbody.innerHTML = ""; addRow(); render();
    });
    document.addEventListener("etb-pro-change", render);
    fetchRate();
    render();
  }

  window.ETBInvoice = { compute: compute, money: money, unitLabel: unitLabel };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-doc]"); if (f) init(f); });
})();
