/* etoolbox – watermark tools (PDF + images). Everything runs in the browser.
   PDF: pdf-lib draws text/logo onto pages; optional "flatten" re-renders pages as images with pdf.js
   so the watermark can't be deleted in a PDF editor. Images: canvas, batch, zip download. */
(function () {
  "use strict";
  var FONTS = {
    hb: { pdf: "HelveticaBold", css: "bold {s}px Helvetica, Arial, sans-serif" },
    h: { pdf: "Helvetica", css: "{s}px Helvetica, Arial, sans-serif" },
    tb: { pdf: "TimesRomanBold", css: "bold {s}px 'Times New Roman', Times, serif" },
    cb: { pdf: "CourierBold", css: "bold {s}px 'Courier New', Courier, monospace" }
  };
  var RAD = Math.PI / 180;

  function hexToRgb(h) { var v = parseInt(String(h).replace("#", ""), 16) || 0; return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; }

  /* Centre points (top-left origin, y down) where a w×h mark rotated by angle goes on a W×H page. */
  function placements(W, H, w, h, o) {
    var m = o.margin * Math.min(W, H) / 100, a = o.angle * RAD;
    // bounding box of the rotated mark
    var bw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)), bh = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    if (o.position === "tile") {
      var gap = Math.max(w, h) * o.gap / 100, sx = bw + gap, sy = bh + gap, pts = [], row = 0;
      for (var y = -bh; y < H + bh; y += sy, row++) for (var x = -bw + (row % 2 ? sx / 2 : 0); x < W + bw; x += sx) pts.push([x, y]);
      return pts;
    }
    var p = o.position, cx = W / 2, cy = H / 2;
    if (/l/.test(p)) cx = m + bw / 2; if (/r/.test(p)) cx = W - m - bw / 2;
    if (/^t/.test(p)) cy = m + bh / 2; if (/^b/.test(p)) cy = H - m - bh / 2;
    return [[cx, cy]];
  }

  function readOpts(form, kind) {
    var e = form.elements;
    return {
      type: e.wtype.value, text: (e.wtext.value || "").trim(), font: e.font.value, colour: e.colour.value,
      opacity: +e.opacity.value / 100, angle: +e.angle.value, size: +e.size.value, position: e.position.value,
      gap: +e.gap.value, margin: 4, outline: kind === "img" && e.outline && e.outline.checked
    };
  }

  /* ---------- Canvas renderer (images, previews) ---------- */
  function drawMark(ctx, W, H, o, logo) {
    var a = o.angle * RAD, w, h, fs = 0;
    if (o.type === "image") {
      if (!logo) return;
      w = W * o.size / 100; h = w * logo.height / logo.width;
    } else {
      if (!o.text) return;
      ctx.font = FONTS[o.font].css.replace("{s}", 100);
      var tw = ctx.measureText(o.text).width || 1;
      fs = 100 * (W * o.size / 100) / tw; w = W * o.size / 100; h = fs * 0.72;
      ctx.font = FONTS[o.font].css.replace("{s}", fs.toFixed(2));
    }
    ctx.save(); ctx.globalAlpha = o.opacity;
    placements(W, H, w, h, o).forEach(function (pt) {
      ctx.save(); ctx.translate(pt[0], pt[1]); ctx.rotate(-a);
      if (o.type === "image") ctx.drawImage(logo, -w / 2, -h / 2, w, h);
      else {
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (o.outline) { ctx.lineJoin = "round"; ctx.lineWidth = Math.max(1, fs / 14); var c = hexToRgb(o.colour), lum = c[0] * .3 + c[1] * .59 + c[2] * .11; ctx.strokeStyle = lum > .5 ? "rgba(0,0,0,.65)" : "rgba(255,255,255,.75)"; ctx.strokeText(o.text, 0, 0); }
        ctx.fillStyle = o.colour; ctx.fillText(o.text, 0, 0);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  /* ---------- PDF renderer (pdf-lib) ---------- */
  async function watermarkPdf(doc, indices, o, logoPng) {
    var PL = window.PDFLib, font = null, img = null, col = hexToRgb(o.colour);
    if (o.type === "image") { if (!logoPng) throw new Error("Choose a logo or image to use as the watermark."); img = await doc.embedPng(logoPng); }
    else { if (!o.text) throw new Error("Type the watermark text."); font = await doc.embedFont(PL.StandardFonts[FONTS[o.font].pdf]); }
    var pages = doc.getPages();
    indices.forEach(function (i) {
      var page = pages[i], box = page.getCropBox ? page.getCropBox() : page.getMediaBox(), rot = ((page.getRotation().angle % 360) + 360) % 360;
      var uw = box.width, uh = box.height, swap = rot === 90 || rot === 270, VW = swap ? uh : uw, VH = swap ? uw : uh;
      var w, h, fs = 0;
      if (img) { w = VW * o.size / 100; h = w * img.height / img.width; }
      else { var tw = font.widthOfTextAtSize(o.text, 100) || 1; fs = 100 * (VW * o.size / 100) / tw; w = VW * o.size / 100; h = font.heightAtSize(fs, { descender: false }) * 0.72; }
      var ua = o.angle + rot, a = ua * RAD, cos = Math.cos(a), sin = Math.sin(a);
      placements(VW, VH, w, h, o).forEach(function (pt) {
        var vx = pt[0], vy = VH - pt[1], x, y; // visual coords, y up
        if (rot === 90) { x = uw - vy; y = vx; } else if (rot === 180) { x = uw - vx; y = uh - vy; } else if (rot === 270) { x = vy; y = uh - vx; } else { x = vx; y = vy; }
        x += box.x; y += box.y;
        var dx = -w / 2, dy = -h / 2, ox = x + dx * cos - dy * sin, oy = y + dx * sin + dy * cos;
        if (img) page.drawImage(img, { x: ox, y: oy, width: w, height: h, rotate: PL.degrees(ua), opacity: o.opacity });
        else page.drawText(o.text, { x: ox, y: oy, size: fs, font: font, color: PL.rgb(col[0], col[1], col[2]), rotate: PL.degrees(ua), opacity: o.opacity });
      });
    });
  }

  async function flattenPdf(bytes, onPage) {
    var pdfjsLib = await window.ETBPdf.pdfjs(), PL = window.PDFLib;
    var src = await pdfjsLib.getDocument({ data: bytes }).promise, out = await PL.PDFDocument.create();
    for (var i = 1; i <= src.numPages; i++) {
      onPage && onPage(i, src.numPages);
      var pg = await src.getPage(i), vp1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 2 });
      var c = document.createElement("canvas"); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      var jpg = await new Promise(function (r) { c.toBlob(function (b) { b.arrayBuffer().then(r); }, "image/jpeg", 0.86); });
      var im = await out.embedJpg(jpg), np = out.addPage([vp1.width, vp1.height]);
      np.drawImage(im, { x: 0, y: 0, width: vp1.width, height: vp1.height });
      pg.cleanup();
    }
    await src.destroy();
    return out.save();
  }

  function pageIndices(form, n) {
    var which = form.elements.pages.value;
    if (which === "all") return Array.from({ length: n }, function (_, i) { return i; });
    if (which === "first") return [0];
    if (which === "odd") return Array.from({ length: n }, function (_, i) { return i; }).filter(function (i) { return i % 2 === 0; });
    if (which === "even") return Array.from({ length: n }, function (_, i) { return i; }).filter(function (i) { return i % 2 === 1; });
    return window.ETBPdf.parseRanges(form.elements.range.value, n);
  }

  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { rej(new Error("'" + file.name + "' couldn't be opened as an image.")); }; im.src = url;
    });
  }
  function toPng(im) {
    var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0);
    return new Promise(function (r) { c.toBlob(function (b) { b.arrayBuffer().then(r); }, "image/png"); });
  }
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000); }
  function base(n) { return n.replace(/\.[^.]+$/, ""); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  function bindDrop(drop, input, onFiles) {
    input.addEventListener("change", function () { onFiles(Array.from(input.files)); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { onFiles(Array.from(e.dataTransfer.files)); });
  }

  function common(form, kind, refresh) {
    var logo = null, logoPng = null, logoName = document.getElementById("logo-name");
    function showWhen() {
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) {
        var p = el.getAttribute("data-show-when").split("="); el.hidden = p[1].split("|").indexOf(form.elements[p[0]].value) < 0;
      });
      [["opacity", "%"], ["size", "%"], ["gap", "%"], ["angle", "°"]].forEach(function (k) { var s = document.getElementById(k[0] + "-val"); if (s) s.textContent = form.elements[k[0]].value + k[1]; });
    }
    document.getElementById("logo-input").addEventListener("change", async function (e) {
      var f = e.target.files[0]; if (!f) return;
      try { logo = await loadImage(f); logoPng = await toPng(logo); logoName.textContent = f.name; form.elements.wtype.value = "image"; showWhen(); refresh(); }
      catch (err) { logoName.textContent = err.message; }
    });
    form.querySelectorAll("[data-preset]").forEach(function (b) { b.addEventListener("click", function () { form.elements.wtype.value = "text"; form.elements.wtext.value = b.getAttribute("data-preset"); showWhen(); refresh(); }); });
    var t; form.addEventListener("input", function () { showWhen(); clearTimeout(t); t = setTimeout(refresh, kind === "pdf" ? 350 : 60); });
    form.addEventListener("change", function (e) {
      if (e.target.name === "position") { var sz = form.elements.size; if (e.target.value === "tile" && +sz.value > 35) sz.value = 25; else if (e.target.value !== "tile" && +sz.value < 20) sz.value = kind === "pdf" ? 60 : 30; refresh(); }
      showWhen();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    showWhen();
    return { logo: function () { return logo; }, logoPng: function () { return logoPng; } };
  }

  /* ---------- PDF page ---------- */
  function initPdf(form) {
    var input = document.getElementById("wm-input"), drop = document.getElementById("drop"), list = document.getElementById("file-list");
    var run = document.getElementById("run"), msg = document.getElementById("wm-msg"), out = document.getElementById("wm-out"), prev = document.getElementById("wm-preview");
    var file = null, bytes = null, previewBytes = null, pageCount = 0, previewToken = 0, c;
    async function refresh() {
      if (!previewBytes) return;
      var my = ++previewToken;
      try {
        var o = readOpts(form, "pdf"), doc = await PDFLib.PDFDocument.load(previewBytes);
        if ((o.type === "text" && !o.text) || (o.type === "image" && !c.logoPng())) { msg.textContent = ""; }
        else await watermarkPdf(doc, [0], o, c.logoPng());
        var pb = await doc.save(); if (my !== previewToken) return;
        var lib = await window.ETBPdf.pdfjs(), pdf = await lib.getDocument({ data: pb }).promise, pg = await pdf.getPage(1);
        var vp1 = pg.getViewport({ scale: 1 }), scale = Math.min(2, 520 / vp1.width), vp = pg.getViewport({ scale: scale });
        var cv = document.createElement("canvas"); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; await pdf.destroy();
        if (my !== previewToken) return;
        prev.innerHTML = ""; cv.className = "wm-canvas"; cv.setAttribute("aria-label", "Preview of the first page"); prev.appendChild(cv); prev.setAttribute("data-ready", "1");
      } catch (err) { if (my === previewToken) msg.textContent = err.message; }
    }
    c = common(form, "pdf", refresh);
    bindDrop(drop, input, async function (files) {
      var f = files.find(function (x) { return /pdf$/i.test(x.type) || /\.pdf$/i.test(x.name); });
      if (!f) { msg.textContent = "Please choose a PDF file."; return; }
      msg.textContent = ""; out.innerHTML = '<p class="muted">Your file will appear here, ready to download.</p>';
      try {
        bytes = await f.arrayBuffer();
        var doc = await PDFLib.PDFDocument.load(bytes).catch(function (e) { throw new Error(/encrypt/i.test(e.message) ? "This PDF is password-protected. Remove the password first." : "This file isn't a valid PDF."); });
        pageCount = doc.getPageCount(); file = f;
        var one = await PDFLib.PDFDocument.create(), cp = await one.copyPages(doc, [0]); one.addPage(cp[0]); previewBytes = await one.save();
        list.innerHTML = "<li><span>" + f.name.replace(/</g, "&lt;") + "</span> <span class='muted'>· " + pageCount + " page" + (pageCount === 1 ? "" : "s") + " · " + kb(f.size) + "</span></li>";
        run.disabled = false; refresh();
      } catch (err) { msg.textContent = err.message; run.disabled = true; }
    });
    run.addEventListener("click", async function () {
      if (!bytes) return;
      run.disabled = true; msg.textContent = "Adding watermark…";
      try {
        var o = readOpts(form, "pdf"), doc = await PDFLib.PDFDocument.load(bytes), idx = pageIndices(form, pageCount);
        await watermarkPdf(doc, idx, o, c.logoPng());
        var res = await doc.save();
        if (form.elements.flatten.checked) res = await flattenPdf(res, function (i, n) { msg.textContent = "Flattening page " + i + " of " + n + "…"; });
        var blob = new Blob([res], { type: "application/pdf" }), name = base(file.name) + "-watermarked.pdf";
        out.innerHTML = ""; var a = document.createElement("a"); a.className = "btn"; a.href = URL.createObjectURL(blob); a.download = name; a.textContent = "Download " + name + " (" + kb(blob.size) + ")"; a.id = "wm-download";
        out.appendChild(a); var p = document.createElement("p"); p.className = "muted"; p.textContent = "Watermarked " + idx.length + " of " + pageCount + " page" + (pageCount === 1 ? "" : "s") + (form.elements.flatten.checked ? ", flattened" : "") + "."; out.appendChild(p);
        msg.textContent = ""; a.click();
      } catch (err) { msg.textContent = err.message; }
      run.disabled = false;
    });
  }

  /* ---------- Image page ---------- */
  function initImg(form) {
    var input = document.getElementById("wm-input"), drop = document.getElementById("drop"), msg = document.getElementById("wm-msg");
    var prev = document.getElementById("wm-preview"), results = document.getElementById("wm-results"), run = document.getElementById("run"), allBtn = document.getElementById("dl-all");
    var images = [], c;
    function refresh() {
      if (!images.length) return;
      var im = images[0].img, s = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), cv = prev.querySelector("canvas") || document.createElement("canvas");
      cv.width = Math.round(im.naturalWidth * s); cv.height = Math.round(im.naturalHeight * s);
      var ctx = cv.getContext("2d"); ctx.drawImage(im, 0, 0, cv.width, cv.height); drawMark(ctx, cv.width, cv.height, readOpts(form, "img"), c.logo());
      cv.className = "wm-canvas"; if (!cv.parentNode) { prev.innerHTML = ""; prev.appendChild(cv); } prev.setAttribute("data-ready", "1");
    }
    c = common(form, "img", refresh);
    bindDrop(drop, input, async function (files) {
      files = files.filter(function (f) { return /^image\//.test(f.type); }).slice(0, 50);
      if (!files.length) { msg.textContent = "Please choose JPG, PNG or WebP images."; return; }
      msg.textContent = ""; images = [];
      for (var i = 0; i < files.length; i++) { try { images.push({ file: files[i], img: await loadImage(files[i]) }); } catch (e) { msg.textContent = e.message; } }
      document.getElementById("wm-count").textContent = images.length + " image" + (images.length === 1 ? "" : "s") + " selected";
      run.disabled = !images.length; results.innerHTML = ""; allBtn.hidden = true; refresh();
    });
    var outputs = [];
    run.addEventListener("click", async function () {
      if (!images.length) return;
      run.disabled = true; results.innerHTML = ""; outputs = [];
      var o = readOpts(form, "img"), fmt = form.elements.format.value;
      if (o.type === "image" && !c.logo()) { msg.textContent = "Choose a logo or image to use as the watermark."; run.disabled = false; return; }
      if (o.type === "text" && !o.text) { msg.textContent = "Type the watermark text."; run.disabled = false; return; }
      for (var i = 0; i < images.length; i++) {
        msg.textContent = "Watermarking " + (i + 1) + " of " + images.length + "…";
        var im = images[i].img, cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        var ctx = cv.getContext("2d"), type = fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : fmt === "jpeg" ? "image/jpeg" : (images[i].file.type === "image/png" ? "image/png" : images[i].file.type === "image/webp" ? "image/webp" : "image/jpeg");
        if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); }
        ctx.drawImage(im, 0, 0); drawMark(ctx, cv.width, cv.height, o, c.logo());
        var blob = await new Promise(function (r) { cv.toBlob(r, type, 0.92); });
        var name = base(images[i].file.name) + "-watermarked." + (type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg");
        outputs.push({ name: name, blob: blob });
        var li = document.createElement("li"), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.textContent = "Download";
        li.innerHTML = '<span></span><span class="muted"></span>'; li.firstChild.textContent = name; li.children[1].textContent = cv.width + "×" + cv.height + " · " + kb(blob.size); li.appendChild(a); results.appendChild(li);
      }
      msg.textContent = ""; allBtn.hidden = outputs.length < 2; run.disabled = false;
      if (outputs.length === 1) download(outputs[0].blob, outputs[0].name);
    });
    allBtn.addEventListener("click", async function () {
      var z = {}; for (var i = 0; i < outputs.length; i++) z[outputs[i].name] = [new Uint8Array(await outputs[i].blob.arrayBuffer()), { level: 0 }];
      download(new Blob([fflate.zipSync(z)], { type: "application/zip" }), "watermarked-images.zip");
    });
  }

  window.ETBWatermark = { placements: placements, drawMark: drawMark, watermarkPdf: watermarkPdf, flattenPdf: flattenPdf };
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelector("form[data-wm]"); if (!f) return;
    if (f.getAttribute("data-wm") === "pdf") initPdf(f); else initImg(f);
  });
})();
