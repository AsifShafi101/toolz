/* etoolbox document tools — compare documents, OCR (image to text), invoice data extractor, email header analyser. */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dl(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  /* ---------- Text extraction from PDF / DOCX / TXT ---------- */
  function pdfText(buf) {
    return ETBPdf.pdfjs().then(function (pj) { return pj.getDocument({ data: new Uint8Array(buf) }).promise; }).then(function (pdf) {
      var pages = [], chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) (function (i) { chain = chain.then(function () { return pdf.getPage(i); }).then(function (p) { return p.getTextContent(); }).then(function (tc) { pages.push(tc.items); }); })(i);
      return chain.then(function () { return { paras: ETBPdf.textToParagraphs(pages).filter(function (p) { return !p.pageBreak; }).map(function (p) { return p.text; }), pages: pdf.numPages }; });
    });
  }
  function extract(file) {
    return file.arrayBuffer().then(function (buf) {
      if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") return pdfText(buf).then(function (r) { return r.paras.join("\n"); });
      if (/\.docx$/i.test(file.name)) return mammoth.extractRawText({ arrayBuffer: buf }).then(function (r) { return r.value; });
      if (/\.doc$/i.test(file.name)) throw new Error("Old .doc files aren't supported. Save as .docx first.");
      return new TextDecoder().decode(buf);
    });
  }

  /* ---------- Diff (Myers O(ND)) ---------- */
  function myers(a, b, eq, maxD) {
    var n = a.length, m = b.length, max = n + m, v = { 1: 0 }, trace = [];
    for (var d = 0; d <= max; d++) {
      if (d > (maxD || 4000)) return null;
      trace.push(Object.assign({}, v));
      for (var k = -d; k <= d; k += 2) {
        var x = (k === -d || (k !== d && v[k - 1] < v[k + 1])) ? v[k + 1] : v[k - 1] + 1, y = x - k;
        while (x < n && y < m && eq(a[x], b[y])) { x++; y++; }
        v[k] = x;
        if (x >= n && y >= m) return backtrack(trace, a, b, d);
      }
    }
    return null;
  }
  function backtrack(trace, a, b, D) {
    var x = a.length, y = b.length, ops = [];
    for (var d = D; d > 0; d--) {
      var v = trace[d], k = x - y, pk = (k === -d || (k !== d && v[k - 1] < v[k + 1])) ? k + 1 : k - 1, px = v[pk], py = px - pk;
      while (x > px && y > py) { ops.push(["=", a[x - 1], b[y - 1]]); x--; y--; }
      if (x === px) ops.push(["+", null, b[y - 1]]); else ops.push(["-", a[x - 1], null]);
      x = px; y = py;
    }
    while (x > 0 && y > 0) { ops.push(["=", a[x - 1], b[y - 1]]); x--; y--; }
    return ops.reverse();
  }
  function norm(o) { return function (s) { var t = s; if (o.ignoreCase) t = t.toLowerCase(); if (o.ignoreSpace) t = t.replace(/\s+/g, " ").trim(); if (o.ignorePunct) t = t.replace(/[^\p{L}\p{N}\s]/gu, ""); return t; }; }
  function words(s) { return s.match(/\s+|[^\s]+/g) || []; }
  // Returns { html, added, removed, same } — pure, exported for tests.
  function compare(textA, textB, o) {
    o = o || {}; var N = norm(o);
    var la = textA.replace(/\r/g, "").split("\n").filter(function (l) { return !o.ignoreSpace || l.trim(); }), lb = textB.replace(/\r/g, "").split("\n").filter(function (l) { return !o.ignoreSpace || l.trim(); });
    var lines = myers(la, lb, function (x, y) { return N(x) === N(y); }, 3000);
    if (!lines) return { tooDifferent: true };
    var html = [], added = 0, removed = 0, same = 0, i = 0;
    var wcount = function (s) { return (s.match(/\S+/g) || []).length; };
    while (i < lines.length) {
      if (lines[i][0] === "=") { html.push('<p class="d-same">' + (esc(lines[i][1]) || "&nbsp;") + "</p>"); same += wcount(lines[i][1]); i++; continue; }
      var del = [], ins = [];
      while (i < lines.length && lines[i][0] !== "=") { if (lines[i][0] === "-") del.push(lines[i][1]); else ins.push(lines[i][2]); i++; }
      var wa = words(del.join("\n")), wb = words(ins.join("\n")), wops = (wa.length + wb.length < 6000) ? myers(wa, wb, function (x, y) { return /^\s+$/.test(x) && /^\s+$/.test(y) ? true : N(x) === N(y); }, 3000) : null;
      if (!wops) { if (del.length) html.push('<p class="d-chg"><del>' + esc(del.join("\n")) + "</del></p>"); if (ins.length) html.push('<p class="d-chg"><ins>' + esc(ins.join("\n")) + "</ins></p>"); removed += wcount(del.join(" ")); added += wcount(ins.join(" ")); continue; }
      var buf = "";
      wops.forEach(function (op) {
        if (op[0] === "=") { buf += esc(op[2]); if (/\S/.test(op[2])) same++; }
        else if (op[0] === "-") { buf += "<del>" + esc(op[1]) + "</del>"; if (/\S/.test(op[1])) removed++; }
        else { buf += "<ins>" + esc(op[2]) + "</ins>"; if (/\S/.test(op[2])) added++; }
      });
      html.push('<p class="d-chg">' + buf.replace(/\n/g, "<br>").replace(/<\/del><del>/g, "").replace(/<\/ins><ins>/g, "") + "</p>");
    }
    var total = same + Math.max(added, removed);
    return { html: html.join(""), added: added, removed: removed, same: same, similarity: total ? Math.round(same / (same + (added + removed) / 2) * 1000) / 10 : 100 };
  }

  function initCompare(form) {
    var out = document.getElementById("cmp-out"), stats = document.getElementById("cmp-stats"), texts = { a: "", b: "" };
    ["a", "b"].forEach(function (side) {
      var input = document.getElementById("file-" + side), ta = document.getElementById("text-" + side), name = document.getElementById("name-" + side);
      input.addEventListener("change", function () {
        var f = input.files[0]; input.value = ""; if (!f) return; name.textContent = "Reading " + f.name + "…";
        extract(f).then(function (t) { ta.value = t; name.textContent = f.name + " · " + (t.match(/\S+/g) || []).length.toLocaleString("en-GB") + " words"; run(); })
          .catch(function (e) { name.textContent = e.message || "Couldn't read that file."; });
      });
      ta.addEventListener("input", function () { clearTimeout(ta.t); ta.t = setTimeout(run, 400); });
    });
    function run() {
      var a = document.getElementById("text-a").value, b = document.getElementById("text-b").value;
      if (!a.trim() || !b.trim()) { out.innerHTML = '<p class="muted">Add both documents to see the differences.</p>'; stats.textContent = ""; return; }
      var r = compare(a, b, { ignoreCase: form.elements.icase.checked, ignoreSpace: form.elements.ispace.checked, ignorePunct: form.elements.ipunct.checked });
      if (r.tooDifferent) { out.innerHTML = '<p class="warn">These documents are almost completely different, so there\'s nothing useful to highlight.</p>'; return; }
      out.innerHTML = r.html; out.setAttribute("data-result", JSON.stringify({ added: r.added, removed: r.removed, similarity: r.similarity }));
      stats.innerHTML = '<span class="ins-tag">+' + r.added + " words added</span> <span class=\"del-tag\">−" + r.removed + " words removed</span> · <strong>" + r.similarity + "%</strong> the same" + (r.added + r.removed === 0 ? ' · <b class="good">Identical text ✓</b>' : "");
      if (form.elements.onlychanges.checked) out.classList.add("only-changes"); else out.classList.remove("only-changes");
    }
    form.addEventListener("change", run); form.addEventListener("submit", function (e) { e.preventDefault(); });
    run();
  }

  /* ---------- OCR (Tesseract.js, all local) ---------- */
  function initOcr(form) {
    var out = document.getElementById("ocr-text"), status = document.getElementById("ocr-status"), prev = document.getElementById("ocr-preview"), worker = null, wLang = null;
    function getWorker(lang) {
      if (worker && wLang === lang) return Promise.resolve(worker);
      var old = worker; worker = null; if (old) old.terminate();
      return Tesseract.createWorker(lang, 1, { workerPath: "/assets/vendor/ocr/worker.min.js", corePath: "/assets/vendor/ocr/", langPath: "/assets/vendor/ocr/", gzip: true,
        logger: function (m) { if (m.status === "recognizing text") status.textContent = "Reading text… " + Math.round(m.progress * 100) + "%"; else if (/loading|initializ/.test(m.status)) status.textContent = "Loading the text reader (first time only)…"; } })
        .then(function (w) { worker = w; wLang = lang; return w; });
    }
    function run(file) {
      if (!file || !/^image\//.test(file.type)) { status.textContent = "Please choose an image (PNG, JPG, WebP) or paste a screenshot."; return; }
      prev.src = URL.createObjectURL(file); prev.hidden = false; status.textContent = "Starting…"; out.value = "";
      getWorker("eng").then(function (w) { return w.recognize(file); }).then(function (r) {
        out.value = r.data.text.replace(/\n{3,}/g, "\n\n").trim();
        var words = (out.value.match(/\S+/g) || []).length;
        status.innerHTML = words ? "<b class=\"good\">Done.</b> " + words + " words found · confidence " + Math.round(r.data.confidence) + "%" : "No text found. Try a sharper, larger or better-lit image.";
        form.setAttribute("data-done", "1");
      }).catch(function (e) { status.textContent = "Sorry, the text reader couldn't start. Please refresh and try again."; });
    }
    var input = document.getElementById("ocr-input"), drop = document.getElementById("drop");
    input.addEventListener("change", function () { run(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { run(e.dataTransfer.files[0]); });
    document.addEventListener("paste", function (e) { var it = Array.prototype.filter.call((e.clipboardData || {}).items || [], function (x) { return /^image\//.test(x.type); })[0]; if (it) { e.preventDefault(); run(it.getAsFile()); } });
    document.getElementById("ocr-copy").addEventListener("click", function (e) { navigator.clipboard.writeText(out.value).then(function () { e.target.textContent = "Copied ✓"; setTimeout(function () { e.target.textContent = "Copy text"; }, 1200); }); });
    document.getElementById("ocr-dl").addEventListener("click", function () { dl(new Blob([out.value], { type: "text/plain" }), "extracted-text.txt"); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  /* ---------- Invoice data extractor ---------- */
  var MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
  function money(s) { var m = /(£|€|\$)?\s?(-?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})|-?\d+(?:\.\d{2}))/.exec(s); return m ? { cur: m[1] || "", value: parseFloat(m[2].replace(/[,\s]/g, "")) } : null; }
  function findAfter(text, labels, pat, needDigit) {
    for (var i = 0; i < labels.length; i++) {
      var re = new RegExp("\\b(?:" + labels[i] + ")[ \\t]*(?:no\\.?|number|#)?[ \\t]*[:#]?[ \\t]*" + pat, "gim"), m;
      while ((m = re.exec(text))) { var v = m[1].trim(); if (!needDigit || /\d/.test(v)) return v; }
    }
    return "";
  }
  // Pure: text -> fields. Exported for tests.
  function invoiceFields(text) {
    var t = text.replace(/ /g, " "), lines = t.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var date = "(\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:" + MONTHS + ")[a-z]*\\.?\\s+\\d{4}|(?:" + MONTHS + ")[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})";
    var f = {};
    f.invoiceNumber = findAfter(t, ["invoice ref(?:erence)?", "invoice", "inv", "bill"], "([A-Z0-9][A-Z0-9\\-\\/]{1,24})", true);
    if (/^(date|to|from|number|no)$/i.test(f.invoiceNumber)) f.invoiceNumber = "";
    f.invoiceDate = findAfter(t, ["invoice date", "date of issue", "issue date", "tax point", "date"], date);
    f.dueDate = findAfter(t, ["due date", "payment due", "due by", "pay by", "due"], date);
    var tot = null;
    ["total due", "amount due", "balance due", "total to pay", "grand total", "invoice total", "total \\(gbp\\)", "total inc(?:l|luding)?\\.? vat", "total"].some(function (lab) {
      var re = new RegExp("^.*\\b" + lab + "\\b[^\\n\\d£€$-]*([£€$]?\\s?-?[\\d,]+\\.\\d{2})", "gim"), m, last = null;
      while ((m = re.exec(t))) last = m; if (last) { tot = money(last[1]); return true; } return false;
    });
    f.total = tot ? tot.value.toFixed(2) : ""; f.currency = tot && tot.cur ? ({ "£": "GBP", "€": "EUR", "$": "USD" })[tot.cur] : (/£|GBP/.test(t) ? "GBP" : /€|EUR/.test(t) ? "EUR" : /\$|USD/.test(t) ? "USD" : "");
    var vatM = /^(?!.*(?:reg|number|no\b)).*\bVAT\b[^\n\d£€$]*(?:\d{1,2}(?:\.\d+)?\s?%[^\n\d£€$]*)?([£€$]?\s?[\d,]+\.\d{2})/im.exec(t); f.vat = vatM ? money(vatM[1]).value.toFixed(2) : "";
    var subM = /\b(?:sub-?\s?total|net(?: amount| total)?|total (?:ex|excl)\.?(?:uding)? vat)\b[^\n\d£€$]*([£€$]?\s?[\d,]+\.\d{2})/im.exec(t); f.subtotal = subM ? money(subM[1]).value.toFixed(2) : "";
    var vatNo = /\b(?:VAT\s*(?:reg(?:istration)?\.?\s*)?(?:no\.?|number|#)?)\s*:?\s*((?:GB)?\s?\d{3}\s?\d{4}\s?\d{2}(?:\s?\d{3})?)\b/i.exec(t); f.vatNumber = vatNo ? vatNo[1].replace(/\s/g, "") : "";
    var sort = /\bsort\s*code\b\s*:?\s*(\d{2}[-\s]?\d{2}[-\s]?\d{2})/i.exec(t); f.sortCode = sort ? sort[1].replace(/\s/g, "-") : "";
    var acc = /\b(?:account\s*(?:no\.?|number)|acc(?:ount)?\s*#?)\s*:?\s*(\d{8})\b/i.exec(t); f.accountNumber = acc ? acc[1] : "";
    var iban = /\b(GB\d{2}\s?[A-Z]{4}(?:\s?\d{4}){3}\s?\d{2})\b/.exec(t); f.iban = iban ? iban[1].replace(/\s/g, "") : "";
    var em = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(t); f.email = em ? em[0] : "";
    f.supplier = lines.length ? lines.filter(function (l) { return !/invoice|^date|^page|^\d/i.test(l); })[0] || "" : "";
    if (f.subtotal && f.vat && !f.total) f.total = (parseFloat(f.subtotal) + parseFloat(f.vat)).toFixed(2);
    return f;
  }
  var FIELDS = [["supplier", "Supplier"], ["invoiceNumber", "Invoice number"], ["invoiceDate", "Invoice date"], ["dueDate", "Due date"], ["subtotal", "Net / subtotal"], ["vat", "VAT"], ["total", "Total"], ["currency", "Currency"], ["vatNumber", "Supplier VAT no."], ["sortCode", "Sort code"], ["accountNumber", "Account no."], ["iban", "IBAN"], ["email", "Email"]];
  function initInvoice(form) {
    var rows = [], table = document.getElementById("inv-table"), status = document.getElementById("inv-status");
    function render() {
      if (!rows.length) { table.innerHTML = '<p class="muted">Add invoices to extract their details.</p>'; document.getElementById("inv-csv").hidden = true; return; }
      table.innerHTML = '<div class="tbl-wrap"><table class="rn-table"><thead><tr><th>File</th>' + FIELDS.map(function (f) { return "<th>" + f[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (r, i) { return "<tr><td>" + esc(r.file) + "</td>" + FIELDS.map(function (f) { return '<td contenteditable="true" data-i="' + i + '" data-k="' + f[0] + '">' + esc(r[f[0]]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
      document.getElementById("inv-csv").hidden = false; table.setAttribute("data-rows", JSON.stringify(rows));
    }
    table.addEventListener("input", function (e) { var td = e.target.closest("td[data-k]"); if (td) rows[+td.getAttribute("data-i")][td.getAttribute("data-k")] = td.textContent.trim(); });
    function add(fl) {
      var files = Array.prototype.filter.call(fl, function (f) { return /\.pdf$/i.test(f.name) || f.type === "application/pdf"; });
      if (!files.length) { status.textContent = "Please choose PDF invoices."; return; }
      status.textContent = "Reading " + files.length + " invoice" + (files.length > 1 ? "s" : "") + "…";
      var chain = Promise.resolve(), scans = 0;
      files.forEach(function (f) { chain = chain.then(function () { return f.arrayBuffer(); }).then(pdfText).then(function (r) { var txt = r.paras.join("\n"); if (!txt.trim()) scans++; var x = invoiceFields(txt); x.file = f.name; rows.push(x); render(); }).catch(function () { rows.push({ file: f.name + " (couldn't read)" }); render(); }); });
      chain.then(function () { status.textContent = "Done. Check the highlighted values; you can click any cell to correct it." + (scans ? " " + scans + " file(s) look like scans with no text. Use Image to text (OCR) first." : ""); });
    }
    var input = document.getElementById("inv-input"), drop = document.getElementById("drop");
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { add(e.dataTransfer.files); });
    document.getElementById("inv-csv").addEventListener("click", function () {
      var data = [["File"].concat(FIELDS.map(function (f) { return f[1]; }))].concat(rows.map(function (r) { return [r.file].concat(FIELDS.map(function (f) { return r[f[0]] || ""; })); }));
      dl(new Blob(["﻿" + data.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n")], { type: "text/csv" }), "invoices.csv");
    });
    document.getElementById("inv-clear").addEventListener("click", function () { rows = []; render(); status.textContent = ""; });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    render();
  }

  /* ---------- Email header analyser ---------- */
  function unfold(raw) { return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]+/g, " "); }
  function headers(raw) {
    var head = unfold(raw).split(/\n\n/)[0], out = [];
    head.split("\n").forEach(function (l) { var m = /^([!-9;-~]+):\s?(.*)$/.exec(l); if (m) out.push([m[1], m[2]]); });
    return out;
  }
  function parseDate(s) { var d = new Date(s.replace(/\s*\([^)]*\)\s*$/, "").trim()); return isNaN(d) ? null : d; }
  function analyseEmail(raw) {
    var H = headers(raw), get = function (n) { n = n.toLowerCase(); var h = H.filter(function (x) { return x[0].toLowerCase() === n; })[0]; return h ? h[1] : ""; }, all = function (n) { n = n.toLowerCase(); return H.filter(function (x) { return x[0].toLowerCase() === n; }).map(function (x) { return x[1]; }); };
    if (!H.length) return { error: "No email headers found. Paste the full headers (they start with lines like 'Received:' and 'From:')." };
    var hops = all("Received").map(function (r) {
      var semi = r.lastIndexOf(";"), when = semi >= 0 ? parseDate(r.slice(semi + 1)) : null;
      var from = (/\bfrom\s+([^\s;]+)(?:\s+\(([^)]*)\))?/i.exec(r) || []), by = (/\bby\s+([^\s;]+)/i.exec(r) || []), with_ = (/\bwith\s+([^\s;]+)/i.exec(r) || []);
      var ip = (/\[((?:\d{1,3}\.){3}\d{1,3}|[0-9a-f:]+:[0-9a-f:]+)\]/i.exec(r) || [])[1] || "";
      return { from: from[1] || "", by: by[1] || "", with: with_[1] || "", ip: ip, when: when };
    }).reverse();
    hops.forEach(function (h, i) { h.delay = i && h.when && hops[i - 1].when ? Math.round((h.when - hops[i - 1].when) / 1000) : null; });
    var auth = all("Authentication-Results").join("; ") + "; " + all("ARC-Authentication-Results").join("; ");
    var res = function (k) { var m = new RegExp("\\b" + k + "=(\\w+)", "i").exec(auth); return m ? m[1].toLowerCase() : ""; };
    var spf = res("spf") || ((/^(\w+)/.exec(get("Received-SPF")) || [])[1] || "").toLowerCase(), dkim = res("dkim"), dmarc = res("dmarc");
    var addr = function (s) { var m = /<([^>]+)>/.exec(s) || /([\w.+-]+@[\w.-]+)/.exec(s); return m ? m[1].toLowerCase() : ""; };
    var dom = function (a) { return a.split("@")[1] || ""; };
    var from = addr(get("From")), rp = addr(get("Return-Path")), reply = addr(get("Reply-To"));
    var warnings = [];
    if (spf && spf !== "pass") warnings.push("SPF " + spf + ": the sending server isn't authorised by the sender's domain.");
    if (dkim && dkim !== "pass") warnings.push("DKIM " + dkim + ": the message signature didn't verify.");
    if (dmarc && dmarc !== "pass") warnings.push("DMARC " + dmarc + ": the message failed the domain's anti-spoofing policy.");
    if (from && rp && dom(from) !== dom(rp)) warnings.push("The From domain (" + dom(from) + ") differs from the Return-Path domain (" + dom(rp) + "). That's common for mailing services, but also for spoofing.");
    if (reply && from && dom(reply) !== dom(from)) warnings.push("Replies go to a different domain (" + dom(reply) + ") than the sender (" + dom(from) + "). Be careful with this, as it's a common phishing trick.");
    var total = hops.length > 1 && hops[0].when && hops[hops.length - 1].when ? Math.round((hops[hops.length - 1].when - hops[0].when) / 1000) : null;
    return { from: get("From"), to: get("To"), subject: get("Subject"), date: get("Date"), messageId: get("Message-ID"), returnPath: get("Return-Path"), replyTo: get("Reply-To"),
      spf: spf, dkim: dkim, dmarc: dmarc, hops: hops, total: total, warnings: warnings, count: H.length, xMailer: get("X-Mailer") || get("User-Agent") };
  }
  function secs(n) { if (n == null) return "–"; if (n < 0) return "clock difference"; return n < 60 ? n + "s" : n < 3600 ? Math.round(n / 60) + " min" : (n / 3600).toFixed(1) + " h"; }
  function initEmail(form) {
    var out = document.getElementById("eh-out");
    function run() {
      var raw = form.elements.raw.value; if (!raw.trim()) { out.innerHTML = '<p class="muted">Paste email headers to analyse them.</p>'; return; }
      var r = analyseEmail(raw); if (r.error) { out.innerHTML = '<p class="warn">' + r.error + "</p>"; return; }
      var badge = function (v) { return v ? '<span class="auth ' + (v === "pass" ? "ok" : v === "none" || v === "neutral" ? "meh" : "bad") + '">' + v.toUpperCase() + "</span>" : '<span class="auth meh">NOT FOUND</span>'; };
      out.innerHTML = '<div class="auth-row"><div>SPF ' + badge(r.spf) + "</div><div>DKIM " + badge(r.dkim) + "</div><div>DMARC " + badge(r.dmarc) + "</div></div>" +
        (r.warnings.length ? '<div class="eh-warn"><strong>⚠ Things to check</strong><ul>' + r.warnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>" : '<p class="good"><strong>✓ No warning signs found.</strong></p>') +
        '<div class="calc-out" style="margin:12px 0">' + [["From", r.from], ["To", r.to], ["Subject", r.subject], ["Date", r.date], ["Return-Path", r.returnPath], ["Reply-To", r.replyTo], ["Sent with", r.xMailer], ["Message-ID", r.messageId]].filter(function (x) { return x[1]; }).map(function (x) { return '<div class="calc-row"><span>' + x[0] + "</span><strong>" + esc(x[1]) + "</strong></div>"; }).join("") + "</div>" +
        "<h3>Delivery route (" + r.hops.length + " hops" + (r.total != null ? ", " + secs(r.total) + " in total" : "") + ")</h3><div class=\"tbl-wrap\"><table class=\"rn-table\"><thead><tr><th>#</th><th>From</th><th>By</th><th>Protocol</th><th>Time</th><th>Delay</th></tr></thead><tbody>" +
        r.hops.map(function (h, i) { return "<tr><td>" + (i + 1) + "</td><td>" + esc(h.from) + (h.ip ? ' <span class="muted">' + esc(h.ip) + "</span>" : "") + "</td><td>" + esc(h.by) + "</td><td>" + esc(h.with) + "</td><td>" + (h.when ? h.when.toLocaleString("en-GB") : "–") + '</td><td class="' + (h.delay > 300 ? "warn" : "") + '">' + secs(h.delay) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      out.setAttribute("data-result", JSON.stringify({ spf: r.spf, dkim: r.dkim, dmarc: r.dmarc, hops: r.hops.length, warnings: r.warnings.length, total: r.total }));
    }
    form.addEventListener("input", function () { clearTimeout(form.t); form.t = setTimeout(run, 300); }); form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    run();
  }

  window.ETBDocs = { compare: compare, invoiceFields: invoiceFields, analyseEmail: analyseEmail };
  document.addEventListener("DOMContentLoaded", function () {
    var f; if ((f = document.querySelector("form[data-compare]"))) initCompare(f);
    if ((f = document.querySelector("form[data-ocr]"))) initOcr(f);
    if ((f = document.querySelector("form[data-invoice-extract]"))) initInvoice(f);
    if ((f = document.querySelector("form[data-email-headers]"))) initEmail(f);
  });
})();
