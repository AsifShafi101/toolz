/* etoolbox – more PDF tools: crop, header & footer, redact, fill forms, flatten, extract images, N-up and booklet.
   pdf-lib builds the new PDF and pdf.js renders pages. Everything runs in the browser; nothing is uploaded. */
(function () {
  "use strict";
  var MM = 72 / 25.4;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function base(n) { return (n || "document").replace(/\.pdf$/i, "") || "document"; }
  function saveBytes(bytes, name, type) { var a = document.createElement("a"), u = URL.createObjectURL(new Blob([bytes], { type: type || "application/pdf" })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 8000); }
  function pdfjs() { return window.ETBPdf.pdfjs(); }
  function libLoad(bytes) {
    return PDFLib.PDFDocument.load(bytes).catch(function (e) {
      if (/encrypt/i.test(e.message)) throw new Error("This PDF is password-protected. Remove the password first with Unlock PDF.");
      throw new Error("This file isn't a valid PDF.");
    });
  }
  function jsLoad(bytes) { return pdfjs().then(function (L) { return L.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false }).promise; }); }
  function dropZone(drop, input, cb) {
    input.addEventListener("change", function () { if (input.files.length) cb(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) cb(e.dataTransfer.files[0]); });
  }
  function isPdf(f) { return f && (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)); }
  function say(el, t, warn) { el.innerHTML = warn ? "<span class='warn'>" + esc(t) + "</span>" : esc(t); }
  function renderPage(page, scale, annot) {
    return pdfjs().then(function (L) {
      var vp = page.getViewport({ scale: scale }), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(vp.width)); c.height = Math.max(1, Math.round(vp.height));
      var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      return page.render({ canvasContext: x, viewport: vp, annotationMode: annot ? L.AnnotationMode.ENABLE : L.AnnotationMode.ENABLE_FORMS }).promise.then(function () { return { canvas: c, viewport: vp }; });
    });
  }
  function canvasJpeg(c, q) { return new Promise(function (r) { c.toBlob(function (b) { b.arrayBuffer().then(r); }, "image/jpeg", q || 0.92); }); }
  function shell(form, cb) { // common: load a PDF from the drop zone
    var msg = form.querySelector("[data-msg]");
    dropZone($("drop"), form.querySelector("input[type=file]"), function (f) {
      if (!isPdf(f)) { say(msg, "Please choose a PDF file.", true); return; }
      say(msg, "Opening " + f.name + "…");
      f.arrayBuffer().then(function (buf) { return cb(f, buf); }).then(function () { say(msg, ""); form.setAttribute("data-ready", "1"); }, function (e) { console.error(e); say(msg, e.message || "This PDF couldn't be opened.", true); });
    });
    return msg;
  }
  // Rotation-aware: convert a point measured on the page as you see it (from its bottom-left) to PDF user space
  function visualToPdf(box, rot, u, v) {
    var W = box.width, H = box.height, x, y;
    if (rot === 90) { x = W - v; y = u; } else if (rot === 180) { x = W - u; y = H - v; } else if (rot === 270) { x = v; y = H - u; } else { x = u; y = v; }
    return { x: box.x + x, y: box.y + y };
  }
  function visualSize(box, rot) { return rot === 90 || rot === 270 ? { w: box.height, h: box.width } : { w: box.width, h: box.height }; }
  function rotOf(p) { return ((p.getRotation().angle % 360) + 360) % 360; }

  // ---------------- Crop ----------------
  function initCrop(form) {
    var E = form.elements, view = $("cp-view"), bytes = null, name = "document", jsDoc = null, pageNo = 1, rect = null, vp = null, bg = null;
    var msg = shell(form, function (f, buf) {
      bytes = buf; name = base(f.name);
      return jsLoad(buf).then(function (d) { jsDoc = d; E.page.innerHTML = ""; for (var i = 1; i <= d.numPages; i++) E.page.insertAdjacentHTML("beforeend", "<option value='" + i + "'>Page " + i + "</option>"); pageNo = 1; $("cp-work").hidden = false; return show(); });
    });
    function show() {
      return jsDoc.getPage(pageNo).then(function (pg) { var v1 = pg.getViewport({ scale: 1 }); var s = Math.min(620 / v1.width, 640 / v1.height, 2); return renderPage(pg, s); }).then(function (r) {
        bg = r.canvas; vp = r.viewport; view.width = bg.width; view.height = bg.height; if (!rect) fromInputs(); draw(); });
    }
    function mmW() { return vp.width / vp.scale / MM; } function mmH() { return vp.height / vp.scale / MM; }
    function fromInputs() { if (!vp) return; var t = +E.top.value || 0, r = +E.right.value || 0, b = +E.bottom.value || 0, l = +E.left.value || 0, W = mmW(), H = mmH();
      rect = { x0: Math.min(l / W, 0.95), y0: Math.min(t / H, 0.95), x1: Math.max(1 - r / W, 0.05), y1: Math.max(1 - b / H, 0.05) }; }
    function toInputs() { var W = mmW(), H = mmH(); E.left.value = (rect.x0 * W).toFixed(1); E.top.value = (rect.y0 * H).toFixed(1); E.right.value = ((1 - rect.x1) * W).toFixed(1); E.bottom.value = ((1 - rect.y1) * H).toFixed(1); }
    function draw() {
      var x = view.getContext("2d"), w = view.width, h = view.height; x.drawImage(bg, 0, 0);
      var r = { x: rect.x0 * w, y: rect.y0 * h, w: (rect.x1 - rect.x0) * w, h: (rect.y1 - rect.y0) * h };
      x.fillStyle = "rgba(15,23,42,.55)"; x.fillRect(0, 0, w, r.y); x.fillRect(0, r.y + r.h, w, h - r.y - r.h); x.fillRect(0, r.y, r.x, r.h); x.fillRect(r.x + r.w, r.y, w - r.x - r.w, r.h);
      x.strokeStyle = "#ff6b35"; x.lineWidth = 2; x.setLineDash([6, 4]); x.strokeRect(r.x, r.y, r.w, r.h); x.setLineDash([]);
      $("cp-size").textContent = "Cropped size: " + ((rect.x1 - rect.x0) * mmW()).toFixed(0) + " × " + ((rect.y1 - rect.y0) * mmH()).toFixed(0) + " mm";
    }
    var drag = null;
    function pos(e) { var b = view.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) }; }
    view.addEventListener("pointerdown", function (e) { if (!vp) return; drag = pos(e); view.setPointerCapture(e.pointerId); });
    view.addEventListener("pointermove", function (e) { if (!drag) return; var p = pos(e); if (Math.abs(p.x - drag.x) < 0.01 && Math.abs(p.y - drag.y) < 0.01) return; rect = { x0: Math.min(drag.x, p.x), y0: Math.min(drag.y, p.y), x1: Math.max(drag.x, p.x), y1: Math.max(drag.y, p.y) }; toInputs(); draw(); });
    ["pointerup", "pointercancel"].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });
    form.addEventListener("input", function (e) { if (["top", "right", "bottom", "left"].indexOf(e.target.name) >= 0 && vp) { fromInputs(); draw(); } });
    E.page.addEventListener("change", function () { pageNo = +E.page.value; show(); });
    $("cp-reset").addEventListener("click", function () { E.top.value = E.right.value = E.bottom.value = E.left.value = 0; fromInputs(); draw(); });
    $("cp-run").addEventListener("click", function () {
      if (!bytes) return; say(msg, "Cropping…");
      Promise.all([libLoad(bytes), jsDoc]).then(function (r) {
        var doc = r[0], pages = doc.getPages(), which = E.apply.value === "one" ? [pageNo - 1] : pages.map(function (p, i) { return i; });
        return Promise.all(which.map(function (i) { return jsDoc.getPage(i + 1).then(function (jp) {
          var v = jp.getViewport({ scale: 1 }), a = v.convertToPdfPoint(rect.x0 * v.width, rect.y0 * v.height), b = v.convertToPdfPoint(rect.x1 * v.width, rect.y1 * v.height);
          var x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]), w = Math.abs(a[0] - b[0]), h = Math.abs(a[1] - b[1]);
          pages[i].setCropBox(x0, y0, w, h); pages[i].setMediaBox(x0, y0, w, h); pages[i].setTrimBox(x0, y0, w, h); pages[i].setBleedBox(x0, y0, w, h); pages[i].setArtBox(x0, y0, w, h);
        }); })).then(function () { return doc.save(); });
      }).then(function (out) { saveBytes(out, name + "-cropped.pdf"); say(msg, "Done. Your cropped PDF has downloaded."); form.setAttribute("data-done", "1"); }, function (e) { say(msg, e.message, true); });
    });
  }

  // ---------------- Header & footer ----------------
  function fillTokens(t, o) { return String(t || "").replace(/\{(page|total|date|file|n)\}/gi, function (m, k) { k = k.toLowerCase(); return k === "page" || k === "n" ? o.page : k === "total" ? o.total : k === "date" ? o.date : o.file; }); }
  function fmtDate(d, f) { var dd = ("0" + d.getDate()).slice(-2), mm = ("0" + (d.getMonth() + 1)).slice(-2), y = d.getFullYear();
    return f === "iso" ? y + "-" + mm + "-" + dd : f === "us" ? mm + "/" + dd + "/" + y : f === "long" ? d.getDate() + " " + ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()] + " " + y : dd + "/" + mm + "/" + y; }
  function initHeaderFooter(form) {
    var E = form.elements, bytes = null, name = "document", file = "document.pdf";
    var msg = shell(form, function (f, buf) { bytes = buf; name = base(f.name); file = f.name; return libLoad(buf).then(function (d) { $("hf-info").textContent = f.name + " · " + d.getPageCount() + " pages"; $("hf-work").hidden = false; preview(); }); });
    function preview() { var o = { page: E.start.value || 1, total: "12", date: fmtDate(new Date(), E.datefmt.value), file: file };
      ["hl", "hc", "hr", "fl", "fc", "fr"].forEach(function (k) { $("hf-p-" + k).textContent = fillTokens(E[k].value, o); }); }
    form.addEventListener("input", preview); form.addEventListener("change", preview);
    form.addEventListener("click", function (e) { var t = e.target.closest("[data-tok]"); if (!t) return; var f = form.querySelector("[data-last]") || E.fc; f.value += t.getAttribute("data-tok"); f.focus(); preview(); });
    form.addEventListener("focusin", function (e) { if (/^(h|f)[lcr]$/.test(e.target.name)) { var l = form.querySelector("[data-last]"); if (l) l.removeAttribute("data-last"); e.target.setAttribute("data-last", "1"); } });
    $("hf-run").addEventListener("click", function () {
      if (!bytes) return; say(msg, "Adding headers and footers…");
      libLoad(bytes).then(function (doc) {
        var fontName = { helv: "Helvetica", times: "TimesRoman", courier: "Courier" }[E.font.value] || "Helvetica";
        return doc.embedFont(PDFLib.StandardFonts[fontName]).then(function (font) {
          var pages = doc.getPages(), skip = E.skipfirst.checked, start = parseInt(E.start.value, 10) || 1, total = pages.length - (skip ? 1 : 0) + start - 1;
          var size = +E.size.value || 10, m = (+E.margin.value || 10) * MM, hex = E.color.value, col = PDFLib.rgb(parseInt(hex.substr(1, 2), 16) / 255, parseInt(hex.substr(3, 2), 16) / 255, parseInt(hex.substr(5, 2), 16) / 255);
          var date = fmtDate(new Date(), E.datefmt.value), slots = { hl: ["l", "t"], hc: ["c", "t"], hr: ["r", "t"], fl: ["l", "b"], fc: ["c", "b"], fr: ["r", "b"] };
          pages.forEach(function (p, i) {
            if (skip && i === 0) return;
            var rot = rotOf(p), box = p.getCropBox(), vs = visualSize(box, rot), o = { page: start + i - (skip ? 1 : 0), total: total, date: date, file: file };
            Object.keys(slots).forEach(function (k) {
              var text = fillTokens(E[k].value, o); if (!text.trim()) return;
              var w; try { w = font.widthOfTextAtSize(text, size); } catch (err) { throw new Error("“" + text + "” uses characters the standard PDF fonts can't show. Use plain Latin letters."); }
              var s = slots[k], u = s[0] === "l" ? m : s[0] === "r" ? vs.w - m - w : (vs.w - w) / 2, v = s[1] === "t" ? vs.h - m - size * 0.8 : m;
              var pt = visualToPdf(box, rot, u, v);
              p.drawText(text, { x: pt.x, y: pt.y, size: size, font: font, color: col, rotate: PDFLib.degrees(rot) });
            });
          });
          return doc.save();
        });
      }).then(function (out) { saveBytes(out, name + "-header-footer.pdf"); say(msg, "Done. Your PDF has downloaded."); form.setAttribute("data-done", "1"); }, function (e) { say(msg, e.message, true); });
    });
  }

  // ---------------- Redact ----------------
  function initRedact(form) {
    var E = form.elements, view = $("rd-view"), bytes = null, name = "document", jsDoc = null, pageNo = 1, boxes = {}, bg = null, vp = null;
    var msg = shell(form, function (f, buf) { bytes = buf; name = base(f.name); boxes = {}; return jsLoad(buf).then(function (d) { jsDoc = d; pageNo = 1; $("rd-work").hidden = false; return show(); }); });
    function show() {
      return jsDoc.getPage(pageNo).then(function (pg) { var v1 = pg.getViewport({ scale: 1 }); return renderPage(pg, Math.min(760 / v1.width, 2)); }).then(function (r) {
        bg = r.canvas; vp = r.viewport; view.width = bg.width; view.height = bg.height; draw(); $("rd-pg").textContent = "Page " + pageNo + " of " + jsDoc.numPages; });
    }
    function list() { var n = 0, pg = 0; Object.keys(boxes).forEach(function (k) { if (boxes[k].length) { n += boxes[k].length; pg++; } }); $("rd-count").textContent = n ? n + " area" + (n > 1 ? "s" : "") + " on " + pg + " page" + (pg > 1 ? "s" : "") + " will be blacked out" : "Nothing marked yet"; form.setAttribute("data-boxes", String(n)); $("rd-run").disabled = !n; }
    function draw(tmp) {
      var x = view.getContext("2d"), w = view.width, h = view.height; x.drawImage(bg, 0, 0);
      (boxes[pageNo] || []).concat(tmp ? [tmp] : []).forEach(function (b, i) { x.fillStyle = b === tmp ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.85)"; x.fillRect(b.x * w, b.y * h, b.w * w, b.h * h); });
      list();
    }
    var drag = null;
    function pos(e) { var b = view.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) }; }
    function boxFrom(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
    view.addEventListener("pointerdown", function (e) { if (!vp) return; var p = pos(e), list = boxes[pageNo] || [];
      for (var i = list.length - 1; i >= 0; i--) { var b = list[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { list.splice(i, 1); draw(); return; } }
      drag = { a: p }; view.setPointerCapture(e.pointerId); });
    view.addEventListener("pointermove", function (e) { if (drag) { drag.b = pos(e); draw(boxFrom(drag.a, drag.b)); } });
    view.addEventListener("pointerup", function () { if (drag && drag.b) { var b = boxFrom(drag.a, drag.b); if (b.w > 0.004 && b.h > 0.004) (boxes[pageNo] = boxes[pageNo] || []).push(b); } drag = null; draw(); });
    $("rd-prev").addEventListener("click", function () { if (pageNo > 1) { pageNo--; show(); } });
    $("rd-next").addEventListener("click", function () { if (jsDoc && pageNo < jsDoc.numPages) { pageNo++; show(); } });
    $("rd-clear").addEventListener("click", function () { boxes[pageNo] = []; draw(); });
    function findText(term) { // returns {page: [box fractions]}
      term = term.trim().toLowerCase(); if (!term) return Promise.resolve({});
      var out = {}, jobs = [];
      return pdfjs().then(function (L) {
        for (var i = 1; i <= jsDoc.numPages; i++) jobs.push(jsDoc.getPage(i).then(function (pg) {
          var v = pg.getViewport({ scale: 1 });
          return pg.getTextContent().then(function (tc) {
            tc.items.forEach(function (it) {
              var s = (it.str || "").toLowerCase(), idx = s.indexOf(term); if (idx < 0 || !s.length) return;
              var t = L.Util.transform(v.transform, it.transform), fh = Math.hypot(t[2], t[3]) || 10, wid = (it.width || 0) * v.scale, dl = Math.hypot(t[0], t[1]) || 1, dx = t[0] / dl, dy = t[1] / dl, ux = t[2] / fh, uy = t[3] / fh;
              while (idx >= 0) { var a0 = wid * idx / s.length - 1, a1 = wid * (idx + term.length) / s.length + 1, xs = [], ys = [];
                [a0, a1].forEach(function (a) { [-0.25 * fh, 1.1 * fh].forEach(function (bb) { xs.push(t[4] + a * dx + bb * ux); ys.push(t[5] + a * dy + bb * uy); }); });
                var bx = Math.min.apply(null, xs), by = Math.min.apply(null, ys);
                (out[pg.pageNumber] = out[pg.pageNumber] || []).push({ x: bx / v.width, y: by / v.height, w: (Math.max.apply(null, xs) - bx) / v.width, h: (Math.max.apply(null, ys) - by) / v.height });
                idx = s.indexOf(term, idx + term.length); }
            });
          });
        }));
        return Promise.all(jobs).then(function () { return out; });
      });
    }
    $("rd-find").addEventListener("click", function () {
      if (!jsDoc) return; var term = E.find.value; say(msg, "Searching…");
      findText(term).then(function (found) { var n = 0; Object.keys(found).forEach(function (p) { boxes[p] = (boxes[p] || []).concat(found[p]); n += found[p].length; }); say(msg, n ? "Marked " + n + " match" + (n > 1 ? "es" : "") + " for “" + term + "”. Check each page, then download." : "No matches for “" + term + "”. Scanned pages have no text to search, so draw boxes by hand.", !n); draw(); });
    });
    $("rd-run").addEventListener("click", function () {
      say(msg, "Redacting… pages with redactions are being turned into images.");
      var dpi = +E.dpi.value || 150, pages = Object.keys(boxes).filter(function (k) { return boxes[k].length; }).map(Number);
      Promise.all([libLoad(bytes), PDFLib.PDFDocument.create()]).then(function (r) {
        var src = r[0], out = r[1], n = src.getPageCount(), idx = []; for (var i = 0; i < n; i++) idx.push(i);
        return out.copyPages(src, idx).then(function (copied) {
          var chain = Promise.resolve();
          copied.forEach(function (cp, i) {
            chain = chain.then(function () {
              if (pages.indexOf(i + 1) < 0) { out.addPage(cp); return; }
              return jsDoc.getPage(i + 1).then(function (pg) { return renderPage(pg, dpi / 72, true); }).then(function (rr) {
                var c = rr.canvas, x = c.getContext("2d"); x.fillStyle = "#000"; boxes[i + 1].forEach(function (b) { x.fillRect(Math.floor(b.x * c.width), Math.floor(b.y * c.height), Math.ceil(b.w * c.width) + 1, Math.ceil(b.h * c.height) + 1); });
                return canvasJpeg(c, 0.9).then(function (jb) { return out.embedJpg(jb); }).then(function (img) { var w = rr.viewport.width * 72 / dpi, h = rr.viewport.height * 72 / dpi; var p = out.addPage([w, h]); p.drawImage(img, { x: 0, y: 0, width: w, height: h }); });
              });
            });
          });
          return chain.then(function () { out.setProducer("etoolbox"); out.setCreator("etoolbox"); return out.save(); });
        });
      }).then(function (b) { saveBytes(b, name + "-redacted.pdf"); say(msg, "Done. " + pages.length + " page" + (pages.length > 1 ? "s were" : " was") + " redacted. The hidden text is permanently removed, and document properties were cleared."); form.setAttribute("data-done", String(pages.length)); }, function (e) { console.error(e); say(msg, e.message, true); });
    });
    window.ETBRedact = { find: function (t) { return findText(t); } };
  }

  // ---------------- Fill forms ----------------
  function fieldType(f) { var P = PDFLib; return f instanceof P.PDFTextField ? "text" : f instanceof P.PDFCheckBox ? "check" : f instanceof P.PDFDropdown ? "drop" : f instanceof P.PDFRadioGroup ? "radio" : f instanceof P.PDFOptionList ? "list" : f instanceof P.PDFSignature ? "sig" : "button"; }
  function initFill(form) {
    var box = $("ff-fields"), bytes = null, name = "document", doc = null;
    var msg = shell(form, function (f, buf) {
      bytes = buf; name = base(f.name);
      return libLoad(buf).then(function (d) {
        doc = d; var fields = d.getForm().getFields(), pages = d.getPages(), html = "", n = 0;
        fields.forEach(function (fl, i) {
          var t = fieldType(fl), nm = fl.getName(), id = "ff-" + i, pg = "";
          try { var w = fl.acroField.getWidgets()[0], ref = w && w.P(); var pi = ref ? pages.findIndex(function (p) { return p.ref === ref; }) : -1; if (pi >= 0) pg = " <span class='muted'>(page " + (pi + 1) + ")</span>"; } catch (e) { /* ignore */ }
          var lbl = "<label for='" + id + "'>" + esc(nm) + pg + "</label>", ro = fl.isReadOnly && fl.isReadOnly();
          if (t === "text") { var v = fl.getText() || "", ml = fl.isMultiline(); html += "<div class='ff-f'>" + lbl + (ml ? "<textarea id='" + id + "' data-f='" + i + "' rows='3'" + (ro ? " disabled" : "") + ">" + esc(v) + "</textarea>" : "<input type='text' id='" + id + "' data-f='" + i + "' value='" + esc(v) + "'" + (fl.getMaxLength() ? " maxlength='" + fl.getMaxLength() + "'" : "") + (ro ? " disabled" : "") + ">") + "</div>"; n++; }
          else if (t === "check") { html += "<div class='ff-f'><label class='check'><input type='checkbox' id='" + id + "' data-f='" + i + "'" + (fl.isChecked() ? " checked" : "") + (ro ? " disabled" : "") + "> " + esc(nm) + pg + "</label></div>"; n++; }
          else if (t === "drop" || t === "radio" || t === "list") { var opts = fl.getOptions(), sel = t === "radio" ? [fl.getSelected()] : fl.getSelected() || [];
            html += "<div class='ff-f'>" + lbl + "<select id='" + id + "' data-f='" + i + "'" + (t === "list" && fl.isMultiselect && fl.isMultiselect() ? " multiple" : "") + (ro ? " disabled" : "") + ">" + (t !== "list" ? "<option value=''>—</option>" : "") + opts.map(function (o) { return "<option" + (sel.indexOf(o) >= 0 ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select></div>"; n++; }
        });
        box.innerHTML = n ? html : "<p class='warn'>This PDF has no fillable form fields. To type onto a flat form, use <a href='/sign-pdf/'>Sign PDF</a>, which lets you add text anywhere.</p>";
        $("ff-info").textContent = n ? f.name + " · " + n + " field" + (n > 1 ? "s" : "") + " to fill" : f.name;
        $("ff-work").hidden = !n; form.setAttribute("data-fields", String(n));
      });
    });
    $("ff-run").addEventListener("click", function () {
      if (!bytes) return; say(msg, "Filling…");
      libLoad(bytes).then(function (d) {
        var frm = d.getForm(), fields = frm.getFields();
        box.querySelectorAll("[data-f]").forEach(function (el) {
          var fl = fields[+el.getAttribute("data-f")], t = fieldType(fl); if (el.disabled) return;
          try {
            if (t === "text") fl.setText(el.value || undefined);
            else if (t === "check") { if (el.checked) fl.check(); else fl.uncheck(); }
            else if (t === "drop") { if (el.value) fl.select(el.value); else fl.clear(); }
            else if (t === "radio") { if (el.value) fl.select(el.value); else fl.clear(); }
            else if (t === "list") { var v = Array.prototype.filter.call(el.options, function (o) { return o.selected; }).map(function (o) { return o.value; }); if (v.length) fl.select(v); else fl.clear(); }
          } catch (e) { throw new Error("“" + fl.getName() + "”: " + (/WinAnsi|encode/i.test(e.message) ? "this field can only take plain Latin characters." : e.message)); }
        });
        if (form.elements.flatten.checked) frm.flatten();
        return d.save();
      }).then(function (out) { saveBytes(out, name + "-filled.pdf"); say(msg, "Done. Your filled PDF has downloaded."); form.setAttribute("data-done", "1"); }, function (e) { say(msg, e.message, true); });
    });
  }

  // ---------------- Flatten ----------------
  function initFlatten(form) {
    var E = form.elements, bytes = null, name = "document", info = $("fl-info");
    var msg = shell(form, function (f, buf) { bytes = buf; name = base(f.name); return libLoad(buf).then(function (d) { var n = d.getForm().getFields().length; info.textContent = f.name + " · " + d.getPageCount() + " pages · " + (n ? n + " form field" + (n > 1 ? "s" : "") : "no form fields"); $("fl-work").hidden = false; }); });
    $("fl-run").addEventListener("click", function () {
      if (!bytes) return; var mode = E.mode.value; say(msg, mode === "image" ? "Turning every page into an image…" : "Flattening…");
      (mode === "forms" ? libLoad(bytes).then(function (d) { d.getForm().flatten(); return d.save(); }) :
        Promise.all([jsLoad(bytes), PDFLib.PDFDocument.create()]).then(function (r) {
          var js = r[0], out = r[1], dpi = +E.dpi.value || 150, chain = Promise.resolve();
          for (var i = 1; i <= js.numPages; i++) (function (n) { chain = chain.then(function () { return js.getPage(n).then(function (pg) { return renderPage(pg, dpi / 72, true); }).then(function (rr) { return canvasJpeg(rr.canvas, 0.9).then(function (jb) { return out.embedJpg(jb); }).then(function (img) { var w = rr.viewport.width * 72 / dpi, h = rr.viewport.height * 72 / dpi; out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h }); }); }); }); })(i);
          return chain.then(function () { return out.save(); });
        })).then(function (out) { saveBytes(out, name + "-flattened.pdf"); say(msg, "Done. Your flattened PDF has downloaded."); form.setAttribute("data-done", mode); }, function (e) { say(msg, e.message, true); });
    });
  }

  // ---------------- Extract images ----------------
  function imgToCanvas(img) {
    var c = document.createElement("canvas"); c.width = img.width; c.height = img.height; var x = c.getContext("2d");
    if (img.bitmap) { x.drawImage(img.bitmap, 0, 0); return c; }
    if (!img.data) return null;
    var id = x.createImageData(img.width, img.height), d = id.data, s = img.data, n = img.width * img.height, i, j;
    if (img.kind === 3 || s.length === n * 4) d.set(s.subarray ? s.subarray(0, n * 4) : s);
    else if (img.kind === 2 || s.length === n * 3) { for (i = 0, j = 0; i < n; i++, j += 3) { d[i * 4] = s[j]; d[i * 4 + 1] = s[j + 1]; d[i * 4 + 2] = s[j + 2]; d[i * 4 + 3] = 255; } }
    else { var rowBytes = (img.width + 7) >> 3; for (var y = 0; y < img.height; y++) for (var xx = 0; xx < img.width; xx++) { var bit = (s[y * rowBytes + (xx >> 3)] >> (7 - (xx & 7))) & 1, v = bit ? 255 : 0, k = (y * img.width + xx) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; } }
    x.putImageData(id, 0, 0); return c;
  }
  function objGet(objs, id) { return new Promise(function (res) { var done = false; try { objs.get(id, function (o) { done = true; res(o); }); } catch (e) { res(null); } setTimeout(function () { if (!done) res(null); }, 4000); }); }
  function initExtract(form) {
    var E = form.elements, grid = $("ex-grid"), found = [], name = "document";
    var msg = shell(form, function (f, buf) {
      name = base(f.name); found = []; grid.innerHTML = "";
      return Promise.all([jsLoad(buf), pdfjs()]).then(function (r) {
        var js = r[0], L = r[1], OPS = L.OPS, seen = {}, chain = Promise.resolve();
        for (var i = 1; i <= js.numPages; i++) (function (n) {
          chain = chain.then(function () { say(msg, "Looking for images… page " + n + " of " + js.numPages); return js.getPage(n).then(function (pg) {
            return pg.getOperatorList().then(function (ol) {
              var jobs = [];
              ol.fnArray.forEach(function (fn, k) {
                if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) { var id = ol.argsArray[k][0]; if (seen[n + ":" + id]) return; seen[n + ":" + id] = 1; jobs.push(objGet(/^g_/.test(id) ? pg.commonObjs : pg.objs, id).then(function (o) { return o && { o: o, gid: /^g_/.test(id) ? id : null }; })); }
                else if (fn === OPS.paintInlineImageXObject) jobs.push(Promise.resolve({ o: ol.argsArray[k][0] }));
              });
              return Promise.all(jobs).then(function (imgs) { var j = 0; imgs.forEach(function (it) { if (!it) return; if (it.gid) { if (seen[it.gid]) return; seen[it.gid] = 1; } var c = imgToCanvas(it.o); if (c) found.push({ c: c, page: n, n: ++j }); }); });
            });
          }); });
        })(i);
        return chain.then(function () { show(); });
      });
    });
    function show() {
      var min = +E.min.value || 0, list = found.filter(function (f) { return f.c.width >= min && f.c.height >= min; });
      grid.innerHTML = ""; list.forEach(function (f) { var fig = document.createElement("figure"); fig.className = "ex-item"; var t = document.createElement("canvas"), k = Math.min(1, 160 / f.c.width, 140 / f.c.height); t.width = Math.max(1, f.c.width * k); t.height = Math.max(1, f.c.height * k); t.getContext("2d").drawImage(f.c, 0, 0, t.width, t.height); fig.appendChild(t); fig.insertAdjacentHTML("beforeend", "<figcaption>Page " + f.page + " · " + f.c.width + "×" + f.c.height + "</figcaption>"); grid.appendChild(fig); });
      $("ex-sum").textContent = found.length ? list.length + " image" + (list.length === 1 ? "" : "s") + " found" + (found.length > list.length ? " (" + (found.length - list.length) + " small one" + (found.length - list.length > 1 ? "s" : "") + " hidden)" : "") : "No images found. Scanned pages are sometimes one image each; text and drawings aren't images.";
      $("ex-run").hidden = !list.length; form.setAttribute("data-images", String(list.length)); return list;
    }
    E.min.addEventListener("change", show);
    $("ex-run").addEventListener("click", function () {
      var list = show(), fmt = E.fmt.value, ext = fmt === "image/png" ? "png" : "jpg";
      Promise.all(list.map(function (f) { return new Promise(function (r) { var c = f.c; if (ext === "jpg") { var w = document.createElement("canvas"); w.width = c.width; w.height = c.height; var x = w.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w.width, w.height); x.drawImage(c, 0, 0); c = w; } c.toBlob(function (b) { b.arrayBuffer().then(function (a) { r([name + "-page" + f.page + "-image" + f.n + "." + ext, new Uint8Array(a)]); }); }, fmt, 0.92); }); }))
        .then(function (files) { if (files.length === 1) { saveBytes(files[0][1], files[0][0], fmt); return; } var z = {}; files.forEach(function (f) { z[f[0]] = f[1]; }); saveBytes(fflate.zipSync(z, { level: 0 }), name + "-images.zip", "application/zip"); });
    });
  }

  // ---------------- N-up and booklet ----------------
  var PAPER = { a4: [595.28, 841.89], a3: [841.89, 1190.55], letter: [612, 792], a5: [419.53, 595.28] };
  function bookletOrder(n) { var N = Math.ceil(n / 4) * 4, out = []; for (var i = 0; i < N / 2; i++) { var a = i % 2 === 0 ? [N - 1 - i, i] : [i, N - 1 - i]; out.push(a.map(function (p) { return p < n ? p : null; })); } return out; }
  function nupGrid(k, landscapeSrc) { var g = { 2: [2, 1, true], 4: [2, 2, false], 6: [3, 2, true], 8: [4, 2, true], 9: [3, 3, false], 16: [4, 4, false] }[k] || [2, 2, false]; return landscapeSrc ? [g[1], g[0], !g[2]] : g; }
  function drawIn(page, emb, rot, cx, cy, cw, ch, border) {
    var w = emb.width, h = emb.height, vw = rot % 180 ? h : w, vh = rot % 180 ? w : h, s = Math.min(cw / vw, ch / vh), dw = vw * s, dh = vh * s, x = cx + (cw - dw) / 2, y = cy + (ch - dh) / 2, px = x, py = y;
    if (rot === 90) py = y + dh; else if (rot === 180) { px = x + dw; py = y + dh; } else if (rot === 270) px = x + dw;
    page.drawPage(emb, { x: px, y: py, xScale: s, yScale: s, rotate: PDFLib.degrees(-rot) });
    if (border) page.drawRectangle({ x: x, y: y, width: dw, height: dh, borderColor: PDFLib.rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
  }
  function initNup(form) {
    var E = form.elements, mode = form.getAttribute("data-nup"), bytes = null, name = "document", count = 0;
    var msg = shell(form, function (f, buf) { bytes = buf; name = base(f.name); return libLoad(buf).then(function (d) { count = d.getPageCount(); $("nu-work").hidden = false; plan(); }); });
    function plan() {
      if (!count) return; var t = "";
      if (mode === "booklet") { var o = bookletOrder(count), sheets = o.length / 2; t = count + " pages → " + sheets + " sheet" + (sheets > 1 ? "s" : "") + " of paper, printed on both sides" + (count % 4 ? " (" + (Math.ceil(count / 4) * 4 - count) + " blank page" + (Math.ceil(count / 4) * 4 - count > 1 ? "s" : "") + " added at the end)" : "") + ".";
        $("nu-order").innerHTML = o.map(function (s, i) { return "<span>" + (i % 2 ? "Back" : "Front") + " " + (Math.floor(i / 2) + 1) + ": " + s.map(function (p) { return p === null ? "blank" : p + 1; }).join(" | ") + "</span>"; }).join(""); }
      else { var k = +E.per.value; t = count + " pages → " + Math.ceil(count / k) + " sheet" + (Math.ceil(count / k) > 1 ? "s" : "") + ", " + k + " pages on each."; }
      $("nu-plan").textContent = t;
    }
    form.addEventListener("change", plan);
    $("nu-run").addEventListener("click", function () {
      if (!bytes) return; say(msg, "Arranging pages…");
      Promise.all([libLoad(bytes), PDFLib.PDFDocument.create()]).then(function (r) {
        var src = r[0], out = r[1], sp = src.getPages(), idx = sp.map(function (p, i) { return i; });
        return out.embedPdf(bytes, idx).then(function (embs) {
          var paper = PAPER[E.paper.value] || PAPER.a4, m = (+E.margin.value || 0) * MM, gap = (+E.gap.value || 0) * MM, border = E.border.checked;
          var first = sp[0], fr = rotOf(first), fs = visualSize(first.getCropBox(), fr), landSrc = fs.w > fs.h;
          if (mode === "booklet") {
            var W = paper[1], H = paper[0], order = bookletOrder(sp.length);
            order.forEach(function (side) { var pg = out.addPage([W, H]), cw = (W - 2 * m - gap) / 2, ch = H - 2 * m;
              side.forEach(function (p, j) { if (p === null) return; drawIn(pg, embs[p], rotOf(sp[p]), m + j * (cw + gap), m, cw, ch, border); }); });
          } else {
            var g = nupGrid(+E.per.value, landSrc), cols = g[0], rows = g[1], land = g[2], PW = land ? paper[1] : paper[0], PH = land ? paper[0] : paper[1], per = cols * rows;
            var cw2 = (PW - 2 * m - gap * (cols - 1)) / cols, ch2 = (PH - 2 * m - gap * (rows - 1)) / rows;
            for (var s = 0; s < embs.length; s += per) { var pg2 = out.addPage([PW, PH]);
              for (var q = 0; q < per && s + q < embs.length; q++) { var col = q % cols, row = Math.floor(q / cols); drawIn(pg2, embs[s + q], rotOf(sp[s + q]), m + col * (cw2 + gap), PH - m - (row + 1) * ch2 - row * gap, cw2, ch2, border); } }
          }
          return out.save();
        });
      }).then(function (b) { saveBytes(b, name + (mode === "booklet" ? "-booklet.pdf" : "-" + E.per.value + "-up.pdf")); say(msg, "Done. Your PDF has downloaded."); form.setAttribute("data-done", "1"); }, function (e) { console.error(e); say(msg, e.message, true); });
    });
  }

  window.ETBPdf2 = { fillTokens: fillTokens, fmtDate: fmtDate, bookletOrder: bookletOrder, nupGrid: nupGrid, visualToPdf: visualToPdf };
  document.addEventListener("DOMContentLoaded", function () {
    var m = { "data-crop-pdf": initCrop, "data-hf": initHeaderFooter, "data-redact": initRedact, "data-fill": initFill, "data-flatten": initFlatten, "data-extract": initExtract, "data-nup": initNup };
    Object.keys(m).forEach(function (a) { var f = document.querySelector("form[" + a + "]"); if (f) m[a](f); });
  });
})();
