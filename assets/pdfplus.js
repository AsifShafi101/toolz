/* etoolbox – protect PDF, unlock PDF, sign PDF, PDF to Excel. Everything runs in the browser.
   Protect/unlock use @cantoo/pdf-lib (MIT, AES-256). Sign and PDF→Excel use pdf.js for rendering/text. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function kb(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function base(n) { return n.replace(/\.[^.]+$/, ""); }
  function isPdf(f) { return f && (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)); }
  function bindDrop(drop, input, onFiles) {
    input.addEventListener("change", function () { onFiles(Array.from(input.files)); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { onFiles(Array.from(e.dataTransfer.files)); });
  }
  function result(out, blob, name, note) {
    out.innerHTML = "";
    var a = document.createElement("a"); a.className = "btn"; a.id = "pp-download"; a.href = URL.createObjectURL(blob); a.download = name;
    a.textContent = "Download " + name + " (" + kb(blob.size) + ")"; out.appendChild(a);
    if (note) { var p = document.createElement("p"); p.className = "muted"; p.textContent = note; out.appendChild(p); }
    a.click();
  }
  function fileRow(list, f, extra) { list.innerHTML = "<li><span>" + esc(f.name) + "</span> <span class='muted'>· " + (extra ? extra + " · " : "") + kb(f.size) + "</span></li>"; }

  /* ---------------- Protect PDF ---------------- */
  function initProtect(form) {
    var input = $("pp-input"), msg = $("pp-msg"), out = $("pp-out"), run = $("run"), list = $("file-list"), file = null, bytes = null;
    bindDrop($("drop"), input, async function (files) {
      var f = files.find(isPdf); if (!f) { msg.textContent = "Please choose a PDF file."; return; }
      bytes = await f.arrayBuffer(); file = f; msg.textContent = "";
      try {
        var d = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        if (d.isEncrypted) { msg.textContent = "This PDF already has a password. Remove it first with Unlock PDF, then protect it again."; run.disabled = true; return; }
        fileRow(list, f, d.getPageCount() + " pages"); run.disabled = false;
      } catch (e) { msg.textContent = "This file isn't a valid PDF."; run.disabled = true; }
    });
    form.elements.show.addEventListener("change", function () { var t = this.checked ? "text" : "password"; form.elements.pw.type = t; form.elements.pw2.type = t; });
    run.addEventListener("click", async function () {
      var e = form.elements, pw = e.pw.value, pw2 = e.pw2.value;
      if (pw.length < 4) { msg.textContent = "Use a password of at least 4 characters (longer is safer)."; return; }
      if (pw !== pw2) { msg.textContent = "The two passwords don't match."; return; }
      run.disabled = true; msg.textContent = "Encrypting…";
      try {
        var doc = await PDFLib.PDFDocument.load(bytes);
        var owner = e.owner.value || Array.from(crypto.getRandomValues(new Uint8Array(18)), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        doc.encrypt({ userPassword: pw, ownerPassword: owner, permissions: {
          printing: e.print.checked ? "highResolution" : false, copying: e.copy.checked, modifying: e.edit.checked,
          annotating: e.edit.checked, fillingForms: true, contentAccessibility: true, documentAssembly: e.edit.checked } });
        var res = await doc.save();
        result(out, new Blob([res], { type: "application/pdf" }), base(file.name) + "-protected.pdf", "Protected with AES-256. Keep the password safe: it can't be recovered.");
        msg.textContent = "";
      } catch (err) { msg.textContent = "Couldn't protect this PDF: " + err.message; }
      run.disabled = false;
    });
  }

  /* ---------------- Unlock PDF ---------------- */
  function initUnlock(form) {
    var input = $("pp-input"), msg = $("pp-msg"), out = $("pp-out"), run = $("run"), list = $("file-list"), pwRow = $("pw-row"), file = null, bytes = null;
    bindDrop($("drop"), input, async function (files) {
      var f = files.find(isPdf); if (!f) { msg.textContent = "Please choose a PDF file."; return; }
      bytes = await f.arrayBuffer(); file = f; msg.textContent = ""; out.innerHTML = "";
      try {
        var d = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        fileRow(list, f, d.isEncrypted ? "password-protected" : "not protected");
        if (!d.isEncrypted) { msg.textContent = "This PDF isn't password-protected, so there's nothing to remove."; run.disabled = true; return; }
        // Owner-password-only PDFs (restrictions but no open password) open with an empty password
        try { await PDFLib.PDFDocument.load(bytes, { password: "" }); pwRow.hidden = true; form.dataset.nopw = "1"; msg.textContent = "This PDF opens without a password but has restrictions (printing, copying or editing). Click Unlock to remove them."; }
        catch (e) { pwRow.hidden = false; form.dataset.nopw = ""; form.elements.pw.focus(); }
        run.disabled = false;
      } catch (e) { msg.textContent = "This file isn't a valid PDF."; run.disabled = true; }
    });
    run.addEventListener("click", async function () {
      run.disabled = true; msg.textContent = "Unlocking…";
      try {
        var doc;
        try { doc = await PDFLib.PDFDocument.load(bytes, { password: form.dataset.nopw ? "" : form.elements.pw.value }); }
        catch (e) { throw new Error("That password isn't right. Check it and try again."); }
        // Copy the decrypted pages into a fresh document so no encryption dictionary is carried over
        var outDoc = await PDFLib.PDFDocument.create(), copied = await outDoc.copyPages(doc, doc.getPageIndices());
        copied.forEach(function (pg) { outDoc.addPage(pg); });
        try { var t = doc.getTitle(), a = doc.getAuthor(); if (t) outDoc.setTitle(t); if (a) outDoc.setAuthor(a); } catch (e) { /* metadata is optional */ }
        var res = await outDoc.save();
        result(out, new Blob([res], { type: "application/pdf" }), base(file.name) + "-unlocked.pdf", "The password and restrictions have been removed from this copy.");
        msg.textContent = "";
      } catch (err) { msg.textContent = err.message; }
      run.disabled = false;
    });
    form.elements.pw.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run.click(); } });
  }

  /* ---------------- Sign PDF ---------------- */
  var FONT_READY = null;
  function scriptFont() {
    if (!FONT_READY) FONT_READY = (window.FontFace ? new FontFace("EtbScript", "url(/assets/fonts/dancing-script.woff2)").load().then(function (f) { document.fonts.add(f); }) : Promise.resolve()).catch(function () {});
    return FONT_READY;
  }
  function trimCanvas(c) {
    var x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, t = H, l = W, r = -1, b = -1;
    for (var y = 0; y < H; y++) for (var i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 8) { if (y < t) t = y; if (y > b) b = y; if (i < l) l = i; if (i > r) r = i; }
    if (r < 0) return null;
    var p = 6, o = document.createElement("canvas"); o.width = r - l + 1 + p * 2; o.height = b - t + 1 + p * 2;
    o.getContext("2d").drawImage(c, l - p, t - p, o.width, o.height, 0, 0, o.width, o.height); return o;
  }
  function textCanvas(text, font, colour, px) {
    var c = document.createElement("canvas"), x = c.getContext("2d"); x.font = px + "px " + font;
    var w = Math.ceil(x.measureText(text).width) + 20; c.width = w; c.height = Math.ceil(px * 1.5);
    x = c.getContext("2d"); x.font = px + "px " + font; x.fillStyle = colour; x.textBaseline = "middle"; x.fillText(text, 10, c.height / 2);
    return trimCanvas(c) || c;
  }

  function initSign(form) {
    var input = $("pp-input"), msg = $("pp-msg"), viewer = $("sign-pages"), run = $("run"), list = $("file-list");
    var pad = $("sig-pad"), pctx = pad.getContext("2d"), bytes = null, file = null, pages = [], items = [], pending = null, drawn = false;
    function colour() { return form.elements.ink.value; }
    // --- signature pad
    function padReset() { pctx.clearRect(0, 0, pad.width, pad.height); drawn = false; }
    var drawing = false, last = null;
    function pt(e) { var r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; }
    pad.addEventListener("pointerdown", function (e) { drawing = true; last = pt(e); pad.setPointerCapture(e.pointerId); pctx.beginPath(); pctx.arc(last[0], last[1], 1.6, 0, 7); pctx.fillStyle = colour(); pctx.fill(); drawn = true; });
    pad.addEventListener("pointermove", function (e) {
      if (!drawing) return; var p = pt(e); pctx.strokeStyle = colour(); pctx.lineWidth = 3.2; pctx.lineCap = "round"; pctx.lineJoin = "round";
      pctx.beginPath(); pctx.moveTo(last[0], last[1]); pctx.lineTo(p[0], p[1]); pctx.stroke(); last = p; drawn = true;
    });
    ["pointerup", "pointercancel"].forEach(function (ev) { pad.addEventListener(ev, function () { drawing = false; }); });
    $("sig-clear").addEventListener("click", padReset);
    var upload = null;
    $("sig-upload").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return; var im = new Image();
      im.onload = function () {
        var c = document.createElement("canvas"), s = Math.min(1, 900 / im.naturalWidth); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        var x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
        if (form.elements.knockout.checked) { var id = x.getImageData(0, 0, c.width, c.height), d = id.data; for (var i = 0; i < d.length; i += 4) { var l = (d[i] + d[i + 1] + d[i + 2]) / 3; d[i + 3] = l > 200 ? 0 : l > 150 ? Math.round((200 - l) / 50 * d[i + 3]) : d[i + 3]; } x.putImageData(id, 0, 0); }
        upload = trimCanvas(c) || c; $("sig-up-name").textContent = f.name;
      };
      im.src = URL.createObjectURL(f);
    });
    function makeSignature() {
      var m = form.elements.sigmode.value;
      if (m === "draw") { if (!drawn) throw new Error("Draw your signature in the box first."); return trimCanvas(pad); }
      if (m === "type") { var n = form.elements.signame.value.trim(); if (!n) throw new Error("Type your name first."); return textCanvas(n, "EtbScript, 'Brush Script MT', cursive", colour(), 120); }
      if (!upload) throw new Error("Choose an image of your signature first."); return upload;
    }
    function startPlacing(canvas, kind) { pending = { canvas: canvas, kind: kind }; viewer.classList.add("placing"); msg.textContent = "Now click on the page where it should go."; }
    $("add-sig").addEventListener("click", async function () { try { await scriptFont(); startPlacing(makeSignature(), "signature"); } catch (e) { msg.textContent = e.message; } });
    $("add-date").addEventListener("click", function () { startPlacing(textCanvas(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), "Helvetica, Arial, sans-serif", colour(), 64), "text"); });
    $("add-text").addEventListener("click", function () { var t = form.elements.extratext.value.trim(); if (!t) { msg.textContent = "Type the text to add first (e.g. your name or initials)."; return; } startPlacing(textCanvas(t, "Helvetica, Arial, sans-serif", colour(), 64), "text"); });

    function addItem(pg, canvas, kind, cx, cy) {
      var wrap = pg.el, W = wrap.clientWidth, w = Math.min(kind === "signature" ? W * 0.32 : W * 0.25, canvas.width), h = w * canvas.height / canvas.width;
      var el = document.createElement("div"); el.className = "sig-item"; el.tabIndex = 0;
      var img = document.createElement("img"); img.src = canvas.toDataURL("image/png"); img.alt = kind === "signature" ? "Your signature" : "Added text"; el.appendChild(img);
      var del = document.createElement("button"); del.type = "button"; del.className = "sig-del"; del.setAttribute("aria-label", "Remove"); del.textContent = "×"; el.appendChild(del);
      var rs = document.createElement("span"); rs.className = "sig-resize"; rs.setAttribute("aria-hidden", "true"); el.appendChild(rs);
      var it = { page: pg.index, canvas: canvas, el: el, x: Math.max(0, Math.min(W - w, cx - w / 2)), y: Math.max(0, cy - h / 2), w: w, h: h };
      function place() { el.style.left = it.x + "px"; el.style.top = it.y + "px"; el.style.width = it.w + "px"; el.style.height = it.h + "px"; }
      place(); wrap.appendChild(el); items.push(it);
      del.addEventListener("click", function (e) { e.stopPropagation(); el.remove(); items.splice(items.indexOf(it), 1); run.disabled = !items.length; });
      var mode = null, sx, sy, ox, oy, ow;
      el.addEventListener("pointerdown", function (e) { if (e.target === del) return; e.preventDefault(); e.stopPropagation(); mode = e.target === rs ? "resize" : "move"; sx = e.clientX; sy = e.clientY; ox = it.x; oy = it.y; ow = it.w; el.setPointerCapture(e.pointerId); });
      el.addEventListener("pointermove", function (e) {
        if (!mode) return; var dx = e.clientX - sx, dy = e.clientY - sy, PW = wrap.clientWidth, PH = wrap.clientHeight;
        if (mode === "move") { it.x = Math.max(0, Math.min(PW - it.w, ox + dx)); it.y = Math.max(0, Math.min(PH - it.h, oy + dy)); }
        else { it.w = Math.max(20, Math.min(PW - it.x, ow + dx)); it.h = it.w * canvas.height / canvas.width; }
        place();
      });
      el.addEventListener("pointerup", function () { mode = null; });
      el.addEventListener("click", function (e) { e.stopPropagation(); });
      el.addEventListener("keydown", function (e) { var s = e.shiftKey ? 10 : 2; if (e.key === "Delete" || e.key === "Backspace") del.click(); else if (/^Arrow/.test(e.key)) { e.preventDefault(); if (e.key === "ArrowLeft") it.x -= s; if (e.key === "ArrowRight") it.x += s; if (e.key === "ArrowUp") it.y -= s; if (e.key === "ArrowDown") it.y += s; place(); } });
      run.disabled = false; el.focus();
    }

    bindDrop($("drop"), input, async function (files) {
      var f = files.find(isPdf); if (!f) { msg.textContent = "Please choose a PDF file."; return; }
      msg.textContent = "Opening…"; viewer.innerHTML = ""; pages = []; items = []; run.disabled = true;
      try {
        bytes = await f.arrayBuffer(); file = f;
        var lib = await window.ETBPdf.pdfjs(), pdf = await lib.getDocument({ data: bytes.slice(0) }).promise;
        fileRow(list, f, pdf.numPages + " page" + (pdf.numPages === 1 ? "" : "s"));
        var avail = Math.min(760, (viewer.clientWidth || 796) - 38);
        for (var i = 1; i <= pdf.numPages; i++) {
          var p = await pdf.getPage(i), vp1 = p.getViewport({ scale: 1 }), scale = avail / vp1.width, vp = p.getViewport({ scale: scale }), ratio = Math.min(2, window.devicePixelRatio || 1);
          var wrap = document.createElement("div"); wrap.className = "sign-page"; wrap.style.width = vp.width + "px"; wrap.style.height = vp.height + "px"; wrap.setAttribute("data-page", i);
          var c = document.createElement("canvas"); c.width = Math.floor(vp.width * ratio); c.height = Math.floor(vp.height * ratio); c.style.width = vp.width + "px"; c.style.height = vp.height + "px";
          await p.render({ canvasContext: c.getContext("2d"), viewport: p.getViewport({ scale: scale * ratio }) }).promise;
          var label = document.createElement("span"); label.className = "sign-pno"; label.textContent = "Page " + i + " of " + pdf.numPages;
          wrap.appendChild(c); wrap.appendChild(label); viewer.appendChild(wrap);
          var pg = { index: i - 1, el: wrap, vp: vp, rotate: vp.rotation }; pages.push(pg);
          (function (pg) { pg.el.addEventListener("click", function (e) { if (!pending) return; var r = pg.el.getBoundingClientRect(); addItem(pg, pending.canvas, pending.kind, e.clientX - r.left, e.clientY - r.top); pending = null; viewer.classList.remove("placing"); msg.textContent = "Drag to move, use the corner to resize, × to remove. Add more or click Download signed PDF."; }); })(pg);
        }
        msg.textContent = "Create your signature, click 'Place signature', then click on the page.";
        viewer.setAttribute("data-ready", "1");
      } catch (e) { msg.textContent = /password/i.test(e.message) ? "This PDF is password-protected. Unlock it first." : "This file couldn't be opened as a PDF."; }
    });

    run.addEventListener("click", async function () {
      if (!items.length) return; run.disabled = true; msg.textContent = "Saving…";
      try {
        var doc = await PDFLib.PDFDocument.load(bytes), dpages = doc.getPages();
        for (var k = 0; k < items.length; k++) {
          var it = items[k], pg = pages[it.page], png = await new Promise(function (r) { it.canvas.toBlob(function (b) { b.arrayBuffer().then(r); }, "image/png"); });
          var im = await doc.embedPng(png), s = pg.vp.scale;
          var p0 = pg.vp.convertToPdfPoint(it.x, it.y + it.h); // visual bottom-left of the item
          dpages[it.page].drawImage(im, { x: p0[0], y: p0[1], width: it.w / s, height: it.h / s, rotate: PDFLib.degrees(pg.rotate || 0) });
        }
        var res = await doc.save();
        result($("pp-out"), new Blob([res], { type: "application/pdf" }), base(file.name) + "-signed.pdf");
        msg.textContent = "";
      } catch (err) { msg.textContent = "Couldn't save: " + err.message; }
      run.disabled = false;
    });
    form.addEventListener("change", function (e) { if (e.target.name === "sigmode") Array.prototype.forEach.call(form.querySelectorAll("[data-sig]"), function (el) { el.hidden = el.getAttribute("data-sig") !== form.elements.sigmode.value; }); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    scriptFont();
  }

  /* ---------------- PDF to Excel ---------------- */
  var NUM = /^\(?-?[£$€]?\s?-?\d{1,3}(,\d{3})*(\.\d+)?\)?%?$|^\(?-?[£$€]?\s?-?\d+(\.\d+)?\)?%?$/;
  function toNumber(s) {
    var t = s.trim(); if (!NUM.test(t)) return null;
    var neg = /^\(.*\)$/.test(t) || /^-|[£$€]\s?-/.test(t), pct = /%$/.test(t), v = parseFloat(t.replace(/[()£$€,%\s-]/g, ""));
    if (isNaN(v)) return null; v = neg ? -v : v; return pct ? v / 100 : v;
  }
  /* Turn pdf.js text items into rows of cells using their positions. */
  function pageToRows(items, pageHeight) {
    var toks = items.filter(function (t) { return t.str && t.str.trim(); }).map(function (t) {
      var h = Math.hypot(t.transform[2], t.transform[3]) || 10; return { x: t.transform[4], y: t.transform[5], w: t.width, h: h, s: t.str };
    });
    if (!toks.length) return [];
    toks.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [];
    toks.forEach(function (t) { var L = lines.length && lines[lines.length - 1]; if (L && Math.abs(L.y - t.y) < Math.max(2.5, t.h * 0.45)) L.t.push(t); else lines.push({ y: t.y, t: [t] }); });
    // merge tokens into cells: a gap wider than ~1 character starts a new cell
    var cellsByLine = lines.map(function (L) {
      L.t.sort(function (a, b) { return a.x - b.x; });
      var cells = [], cur = null;
      L.t.forEach(function (t) {
        var cw = t.s.length ? t.w / t.s.length : t.h * 0.5, gap = cur ? t.x - (cur.x + cur.w) : 0;
        if (cur && gap < Math.max(cw * 1.1, t.h * 0.6)) { cur.s += (gap > cw * 0.25 && !/\s$/.test(cur.s) ? " " : "") + t.s; cur.w = t.x + t.w - cur.x; }
        else { cur = { x: t.x, w: t.w, s: t.s }; cells.push(cur); }
      });
      return cells.map(function (c) { c.s = c.s.replace(/\s+/g, " ").trim(); return c; });
    });
    // column positions: cluster cell left edges and right edges (numbers are often right-aligned)
    var anchors = [];
    cellsByLine.forEach(function (cells) { cells.forEach(function (c) { var num = toNumber(c.s) !== null, key = num ? c.x + c.w : c.x; anchors.push({ k: key, right: num }); }); });
    anchors.sort(function (a, b) { return a.k - b.k; });
    var cols = [];
    anchors.forEach(function (a) { var C = cols.length && cols[cols.length - 1]; if (C && a.k - C.max < 8) { C.max = a.k; C.sum += a.k; C.n++; } else cols.push({ min: a.k, max: a.k, sum: a.k, n: 1 }); });
    var centres = cols.map(function (c) { return c.sum / c.n; });
    var spans = centres.map(function () { return [Infinity, -Infinity]; });
    var rows = cellsByLine.map(function (cells) {
      var row = [];
      cells.forEach(function (c) {
        var key = toNumber(c.s) !== null ? c.x + c.w : c.x, best = 0, bd = Infinity;
        centres.forEach(function (m, i) { var d = Math.abs(m - key); if (d < bd) { bd = d; best = i; } });
        while (row[best] !== undefined && best < centres.length) best++;
        row[best] = c.s;
        if (spans[best]) { spans[best][0] = Math.min(spans[best][0], c.x); spans[best][1] = Math.max(spans[best][1], c.x + c.w); }
      });
      return row;
    });
    // drop columns that are always empty
    var keep = centres.map(function (_, i) { return rows.some(function (r) { return r[i] !== undefined && r[i] !== ""; }); });
    rows = rows.map(function (r) { return centres.map(function (_, i) { return r[i]; }).filter(function (_, i) { return keep[i]; }); });
    spans = spans.filter(function (_, i) { return keep[i]; });
    // merge neighbouring columns that never both have a value and sit on top of each other
    // (e.g. a left-aligned heading above right-aligned numbers)
    var merged = true;
    while (merged) {
      merged = false;
      for (var i = 0; i < spans.length - 1; i++) {
        var a = spans[i], b2 = spans[i + 1], clash = rows.some(function (r) { return r[i] !== undefined && r[i] !== "" && r[i + 1] !== undefined && r[i + 1] !== ""; });
        if (!clash && b2[0] - a[1] < 12) {
          rows.forEach(function (r) { if (r[i] === undefined || r[i] === "") r[i] = r[i + 1]; r.splice(i + 1, 1); });
          spans[i] = [Math.min(a[0], b2[0]), Math.max(a[1], b2[1])]; spans.splice(i + 1, 1); merged = true; break;
        }
      }
    }
    return rows.map(function (r) { return spans.map(function (_, i) { return r[i] === undefined ? "" : r[i]; }); });
  }
  function xmlEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ""); }
  function colName(i) { var s = ""; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function sheetXml(rows, numbers) {
    var widths = []; rows.forEach(function (r) { r.forEach(function (v, i) { widths[i] = Math.max(widths[i] || 6, Math.min(60, String(v).length + 2)); }); });
    var cols = widths.length ? "<cols>" + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols>" : "";
    var data = rows.map(function (r, ri) {
      return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
        if (v === "" || v === undefined) return ""; var ref = colName(ci) + (ri + 1), n = numbers ? toNumber(String(v)) : null;
        return n !== null ? '<c r="' + ref + '"><v>' + n + "</v></c>" : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + "</t></is></c>";
      }).join("") + "</row>";
    }).join("");
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + cols + "<sheetData>" + data + "</sheetData></worksheet>";
  }
  function buildXlsx(sheets, numbers) {
    var u = fflate.strToU8, z = {};
    z["[Content_Types].xml"] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") + "</Types>");
    z["_rels/.rels"] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    z["xl/workbook.xml"] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + xmlEsc(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + "</sheets></workbook>");
    z["xl/_rels/workbook.xml.rels"] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") + "</Relationships>");
    sheets.forEach(function (s, i) { z["xl/worksheets/sheet" + (i + 1) + ".xml"] = u(sheetXml(s.rows, numbers)); });
    return new Blob([fflate.zipSync(z)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  function toCsv(rows) { return rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n"); }

  function initExcel(form) {
    var input = $("pp-input"), msg = $("pp-msg"), out = $("pp-out"), run = $("run"), list = $("file-list"), prev = $("xl-preview"), file = null, pageRows = null;
    bindDrop($("drop"), input, async function (files) {
      var f = files.find(isPdf); if (!f) { msg.textContent = "Please choose a PDF file."; return; }
      file = f; msg.textContent = "Reading tables…"; out.innerHTML = ""; prev.innerHTML = ""; run.disabled = true;
      try {
        var lib = await window.ETBPdf.pdfjs(), pdf = await lib.getDocument({ data: await f.arrayBuffer() }).promise; pageRows = [];
        for (var i = 1; i <= pdf.numPages; i++) { var p = await pdf.getPage(i), tc = await p.getTextContent(); pageRows.push(pageToRows(tc.items, p.getViewport({ scale: 1 }).height)); }
        fileRow(list, f, pdf.numPages + " page" + (pdf.numPages === 1 ? "" : "s"));
        var total = pageRows.reduce(function (a, r) { return a + r.length; }, 0);
        if (!total) { msg.innerHTML = 'No text found. This looks like a scanned PDF. Use <a href="/image-to-text/">Image to text (OCR)</a> first.'; return; }
        var first = pageRows.find(function (r) { return r.length; }), shown = first.slice(0, 25);
        prev.innerHTML = '<table class="xl-table"><tbody>' + shown.map(function (r) { return "<tr>" + r.map(function (v) { return "<td" + (toNumber(String(v)) !== null ? ' class="num"' : "") + ">" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" + (first.length > 25 ? '<p class="muted">Showing 25 of ' + first.length + " rows from the first page.</p>" : "");
        msg.textContent = "Found " + total + " rows across " + pageRows.length + " page" + (pageRows.length === 1 ? "" : "s") + ".";
        run.disabled = false; prev.setAttribute("data-ready", "1");
      } catch (e) { msg.textContent = /password/i.test(e.message) ? "This PDF is password-protected. Unlock it first." : "This file couldn't be read as a PDF."; }
    });
    run.addEventListener("click", function () {
      if (!pageRows) return; var e = form.elements, numbers = e.numbers.checked, layout = e.layout.value, fmt = e.format.value;
      var sheets = layout === "one" ? [{ name: "PDF", rows: [].concat.apply([], pageRows.map(function (r, i) { return i && r.length ? [[]].concat(r) : r; })) }] : pageRows.map(function (r, i) { return { name: "Page " + (i + 1), rows: r }; }).filter(function (s) { return s.rows.length; });
      if (fmt === "csv") { var all = [].concat.apply([], sheets.map(function (s) { return s.rows; })); result(out, new Blob(["﻿" + toCsv(all)], { type: "text/csv" }), base(file.name) + ".csv"); }
      else result(out, buildXlsx(sheets, numbers), base(file.name) + ".xlsx", "Opens in Excel, Google Sheets, Numbers and LibreOffice. Check the columns, as complex layouts can need tidying.");
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  window.ETBPdfPlus = { pageToRows: pageToRows, toNumber: toNumber, buildXlsx: buildXlsx, colName: colName };
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelector("form[data-pp]"); if (!f) return;
    ({ protect: initProtect, unlock: initUnlock, sign: initSign, excel: initExcel })[f.getAttribute("data-pp")](f);
  });
})();
