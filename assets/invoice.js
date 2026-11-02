/* etoolbox invoice & quote generator. Everything stays in the browser (details saved in localStorage). */
(function () {
  "use strict";

  var STORE = "etb-invoice-v1";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nl(s) { return esc(s).replace(/\n/g, "<br>"); }
  function num(v) { var n = parseFloat(String(v || "").replace(/[£,\s]/g, "")); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function gbp(n) { return "£" + r2(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(iso) { if (!iso) return ""; var d = new Date(iso + "T12:00:00"); return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function isoToday(addDays) { var d = new Date(); d.setDate(d.getDate() + (addDays || 0)); return d.toISOString().slice(0, 10); }

  function compute(items) {
    var sub = 0, vatBy = {}, lines = items.map(function (it) {
      var net = r2(num(it.qty) * num(it.price)), rate = it.vat === "none" ? null : num(it.vat), vat = rate == null ? 0 : r2(net * rate / 100);
      sub += net; if (rate != null) vatBy[rate] = r2((vatBy[rate] || 0) + vat);
      return { desc: it.desc, qty: num(it.qty), price: num(it.price), rate: rate, net: net, vat: vat };
    });
    var vatTotal = Object.keys(vatBy).reduce(function (s, k) { return s + vatBy[k]; }, 0);
    return { lines: lines, subtotal: r2(sub), vatBy: vatBy, vat: r2(vatTotal), total: r2(sub + vatTotal) };
  }

  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* storage unavailable */ } }

  function init(form) {
    var kind = form.getAttribute("data-doc"), isQuote = kind === "quote", label = isQuote ? "Quote" : "Invoice";
    var tbody = document.getElementById("items"), preview = document.getElementById("doc");
    var saved = load(), remember = ["bizname", "bizaddress", "bizemail", "bizphone", "vatno", "payment"];

    function addRow(it) {
      it = it || { desc: "", qty: "1", price: "", vat: saved.defaultVat || "20" };
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><input type="text" class="i-desc" placeholder="Description" aria-label="Description"></td>' +
        '<td><input type="text" class="i-qty" inputmode="decimal" aria-label="Quantity"></td>' +
        '<td><input type="text" class="i-price" inputmode="decimal" placeholder="0.00" aria-label="Unit price"></td>' +
        '<td><select class="i-vat" aria-label="VAT rate"><option value="20">20%</option><option value="5">5%</option><option value="0">0%</option><option value="none">No VAT</option></select></td>' +
        '<td><button type="button" class="row-del" aria-label="Remove line">×</button></td>';
      tr.querySelector(".i-desc").value = it.desc; tr.querySelector(".i-qty").value = it.qty;
      tr.querySelector(".i-price").value = it.price; tr.querySelector(".i-vat").value = it.vat;
      tr.querySelector(".row-del").addEventListener("click", function () { if (tbody.children.length > 1) { tr.remove(); render(); } });
      tbody.appendChild(tr);
    }

    function items() {
      return Array.prototype.map.call(tbody.children, function (tr) {
        return { desc: tr.querySelector(".i-desc").value, qty: tr.querySelector(".i-qty").value, price: tr.querySelector(".i-price").value, vat: tr.querySelector(".i-vat").value };
      });
    }

    function render() {
      var f = form.elements, c = compute(items()), anyVat = c.lines.some(function (l) { return l.rate != null; });
      var rows = c.lines.filter(function (l) { return l.desc || l.price; }).map(function (l) {
        return "<tr><td>" + nl(l.desc) + '</td><td class="n">' + l.qty.toLocaleString("en-GB") + '</td><td class="n">' + gbp(l.price) + "</td>" +
          (anyVat ? '<td class="n">' + (l.rate == null ? "–" : l.rate + "%") + "</td>" : "") + '<td class="n">' + gbp(l.net) + "</td></tr>";
      }).join("") || '<tr><td colspan="5" class="muted">Add your items on the left.</td></tr>';
      var vatRows = Object.keys(c.vatBy).sort(function (a, b) { return b - a; }).map(function (k) {
        return "<tr><td>VAT at " + k + '%</td><td class="n">' + gbp(c.vatBy[k]) + "</td></tr>";
      }).join("");
      var due = f.due.value ? '<div><span>' + (isQuote ? "Valid until" : "Due date") + "</span><strong>" + fmtDate(f.due.value) + "</strong></div>" : "";
      preview.innerHTML =
        '<div class="doc-top"><div><div class="doc-biz">' + (esc(f.bizname.value) || "Your business name") + '</div><div class="muted">' + nl(f.bizaddress.value) + "</div>" +
        '<div class="muted">' + [esc(f.bizemail.value), esc(f.bizphone.value)].filter(Boolean).join(" · ") + "</div>" +
        (f.vatno.value ? '<div class="muted">VAT reg. no. ' + esc(f.vatno.value) + "</div>" : "") + "</div>" +
        '<div class="doc-title">' + label.toUpperCase() + "</div></div>" +
        '<div class="doc-meta"><div class="doc-to"><span>' + (isQuote ? "Quote for" : "Bill to") + "</span><strong>" + (esc(f.client.value) || "Client name") + "</strong><div>" + nl(f.clientaddress.value) + "</div></div>" +
        '<div class="doc-facts"><div><span>' + label + " no.</span><strong>" + esc(f.number.value) + "</strong></div><div><span>Date</span><strong>" + fmtDate(f.date.value) + "</strong></div>" + due + "</div></div>" +
        '<table class="doc-items"><thead><tr><th>Description</th><th class="n">Qty</th><th class="n">Unit price</th>' + (anyVat ? '<th class="n">VAT</th>' : "") + '<th class="n">Amount</th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<table class="doc-totals"><tr><td>Subtotal</td><td class="n">' + gbp(c.subtotal) + "</td></tr>" + vatRows +
        '<tr class="grand"><td>Total' + (isQuote ? "" : " due") + '</td><td class="n" id="doc-total">' + gbp(c.total) + "</td></tr></table>" +
        (f.payment.value ? '<div class="doc-notes"><span>' + (isQuote ? "Terms" : "Payment details") + "</span><div>" + nl(f.payment.value) + "</div></div>" : "") +
        (f.notes.value ? '<div class="doc-notes"><span>Notes</span><div>' + nl(f.notes.value) + "</div></div>" : "");
      preview.setAttribute("data-total", c.total);
      var keep = { defaultVat: (items()[0] || {}).vat, nextNumber: saved.nextNumber || {} };
      remember.forEach(function (k) { keep[k] = f[k].value; });
      save(keep);
    }

    // Restore saved business details and set defaults
    remember.forEach(function (k) { if (saved[k]) form.elements[k].value = saved[k]; });
    var prefix = isQuote ? "QUO-" : "INV-", next = (saved.nextNumber && saved.nextNumber[kind]) || 1;
    form.elements.number.value = prefix + String(next).padStart(4, "0");
    form.elements.date.value = isoToday(0);
    form.elements.due.value = isoToday(isQuote ? 30 : 14);
    addRow();

    document.getElementById("add-row").addEventListener("click", function () { addRow(); render(); tbody.lastChild.querySelector(".i-desc").focus(); });
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("print-doc").addEventListener("click", function () {
      render();
      var s = load(); s.nextNumber = s.nextNumber || {};
      var m = /(\d+)\s*$/.exec(form.elements.number.value); if (m) s.nextNumber[kind] = parseInt(m[1], 10) + 1;
      save(s); saved = s;
      document.title = label + " " + form.elements.number.value;
      window.print();
    });
    document.getElementById("clear-doc").addEventListener("click", function () {
      ["client", "clientaddress", "notes"].forEach(function (k) { form.elements[k].value = ""; });
      tbody.innerHTML = ""; addRow(); render();
    });
    render();
  }

  window.ETBInvoice = { compute: compute };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-doc]"); if (f) init(f); });
})();
