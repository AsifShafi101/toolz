/* etoolbox – image tools: add text, meme maker, collage, favicon, Instagram grid, social resizer, SVG to PNG,
   colour palette. Everything happens on canvas in the browser; nothing is uploaded. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function loadImg(file, max) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error("No file"));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 800, h = img.naturalHeight || 600, k = max ? Math.min(1, max / Math.max(w, h)) : 1, c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("This image couldn't be opened.")); };
      img.src = url;
    });
  }
  function saveBlob(blob, name) { var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }
  function toBlob(c, type, q) { return new Promise(function (r) { c.toBlob(r, type || "image/png", q || 0.92); }); }
  function zipAndSave(files, name) { // files: [{name, blob}]
    return Promise.all(files.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return [f.name, new Uint8Array(b)]; }); })).then(function (arr) {
      var z = {}; arr.forEach(function (x) { z[x[0]] = x[1]; }); saveBlob(new Blob([fflate.zipSync(z, { level: 0 })], { type: "application/zip" }), name);
    });
  }
  function dropZone(drop, input, cb, multi) {
    input.addEventListener("change", function () { if (input.files.length) cb(multi ? Array.prototype.slice.call(input.files) : input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { var f = Array.prototype.slice.call(e.dataTransfer.files); if (f.length) cb(multi ? f : f[0]); });
  }
  function baseName(f) { return (f && f.name ? f.name.replace(/\.[^.]+$/, "") : "image") || "image"; }
  function fit(view, c, maxW, maxH) { var k = Math.min(1, (maxW || 760) / c.width, (maxH || 620) / c.height); view.width = Math.round(c.width * k); view.height = Math.round(c.height * k); return k; }
  function cover(x, img, dx, dy, dw, dh, ox, oy) { // draw image to fill a box, with optional pan offsets (-1..1)
    var k = Math.max(dw / img.width, dh / img.height), sw = dw / k, sh = dh / k, sx = (img.width - sw) / 2 * (1 + (ox || 0)), sy = (img.height - sh) / 2 * (1 + (oy || 0));
    x.drawImage(img, Math.max(0, Math.min(img.width - sw, sx)), Math.max(0, Math.min(img.height - sh, sy)), sw, sh, dx, dy, dw, dh);
  }
  function wrapText(x, text, maxW) { var out = []; String(text).split("\n").forEach(function (para) { var cur = ""; para.split(/\s+/).forEach(function (w) { var t = cur ? cur + " " + w : w; if (x.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } }); out.push(cur); }); return out; }

  // ---------------- Add text to image ----------------
  var FONTS = { sans: "Arial, Helvetica, sans-serif", serif: '"Instrument Serif", Georgia, serif', bold: "Anton, Impact, sans-serif", display: '"Bebas Neue", Impact, sans-serif', script: '"Dancing Script", cursive', mono: "ui-monospace, Menlo, Consolas, monospace" };
  function initText(form) {
    var E = form.elements, view = document.getElementById("tx-view"), img = null, name = "image", layers = [], sel = -1, k = 1;
    function L() { return layers[sel]; }
    function font(l) { return (l.bold ? "700 " : "400 ") + (l.italic ? "italic " : "") + l.size + "px " + FONTS[l.font]; }
    function render(x, scale, showSel) {
      x.drawImage(img, 0, 0, img.width * scale, img.height * scale);
      layers.forEach(function (l, i) {
        x.save(); x.font = font(l).replace(/(\d+)px/, function (m, n) { return n * scale + "px"; }); x.textAlign = l.align; x.textBaseline = "middle";
        var lines = String(l.text).split("\n"), lh = l.size * 1.15 * scale, y0 = l.y * scale - (lines.length - 1) * lh / 2;
        if (l.shadow) { x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = l.size * 0.15 * scale; x.shadowOffsetY = l.size * 0.05 * scale; }
        if (l.bg) { var w = 0; lines.forEach(function (t) { w = Math.max(w, x.measureText(t).width); }); var pad = l.size * 0.3 * scale, bx = l.align === "center" ? l.x * scale - w / 2 : l.align === "right" ? l.x * scale - w : l.x * scale;
          x.fillStyle = l.bgc; x.globalAlpha = 0.85; x.fillRect(bx - pad, y0 - lh / 2 - pad / 2, w + pad * 2, lh * lines.length + pad); x.globalAlpha = 1; x.shadowColor = "transparent"; }
        lines.forEach(function (t, j) { var y = y0 + j * lh; if (l.stroke > 0) { x.lineJoin = "round"; x.lineWidth = l.stroke * scale; x.strokeStyle = l.sc; x.strokeText(t, l.x * scale, y); } x.fillStyle = l.color; x.fillText(t, l.x * scale, y); });
        if (showSel && i === sel) { var mw = 0; lines.forEach(function (t) { mw = Math.max(mw, x.measureText(t).width); }); var bx2 = l.align === "center" ? l.x * scale - mw / 2 : l.align === "right" ? l.x * scale - mw : l.x * scale;
          x.shadowColor = "transparent"; x.setLineDash([6, 4]); x.strokeStyle = "#ff6b35"; x.lineWidth = 2; x.strokeRect(bx2 - 6, y0 - lh / 2 - 4, mw + 12, lh * lines.length + 8); }
        x.restore();
      });
    }
    function draw() { if (!img) return; k = fit(view, img, Math.min(820, view.parentNode.clientWidth || 820), 620); render(view.getContext("2d"), k, true); }
    function syncForm() { var l = L(); document.getElementById("tx-edit").hidden = !l; if (!l) return; ["text", "font", "size", "color", "sc", "stroke", "align", "bgc"].forEach(function (f) { E[f].value = l[f]; }); E.bold.checked = l.bold; E.italic.checked = l.italic; E.shadow.checked = l.shadow; E.bg.checked = l.bg; }
    function list() { document.getElementById("tx-layers").innerHTML = layers.map(function (l, i) { return '<button type="button" class="tx-layer' + (i === sel ? " on" : "") + '" data-i="' + i + '">' + esc(String(l.text).split("\n")[0].slice(0, 24) || "Text") + "</button>"; }).join(""); }
    function add(text) { var s = Math.round(img.width / 12); layers.push({ text: text || "Your text here", font: "bold", size: s, color: "#ffffff", sc: "#000000", stroke: Math.round(s / 12), align: "center", bold: false, italic: false, shadow: true, bg: false, bgc: "#000000", x: img.width / 2, y: img.height * (layers.length ? 0.85 : 0.15) }); sel = layers.length - 1; syncForm(); list(); draw(); }
    form.addEventListener("input", function (e) { var l = L(); if (!l || !e.target.name || e.target.name === "fmt") return; var f = e.target.name; l[f] = e.target.type === "checkbox" ? e.target.checked : (f === "size" || f === "stroke") ? +e.target.value : e.target.value; list(); draw(); });
    document.getElementById("tx-layers").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) { sel = +b.getAttribute("data-i"); syncForm(); list(); draw(); } });
    document.getElementById("tx-add").addEventListener("click", function () { if (img) add(); });
    document.getElementById("tx-del").addEventListener("click", function () { if (sel >= 0) { layers.splice(sel, 1); sel = layers.length - 1; syncForm(); list(); draw(); } });
    var drag = null;
    view.addEventListener("pointerdown", function (e) { if (!img) return; var r = view.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * img.width, py = (e.clientY - r.top) / r.height * img.height, best = -1, bd = 1e9;
      layers.forEach(function (l, i) { var d = Math.hypot(l.x - px, l.y - py); if (d < bd && d < Math.max(l.size * 3, img.width / 4)) { bd = d; best = i; } });
      if (best >= 0) { sel = best; syncForm(); list(); drag = { dx: L().x - px, dy: L().y - py }; view.setPointerCapture(e.pointerId); draw(); } });
    view.addEventListener("pointermove", function (e) { if (!drag) return; var r = view.getBoundingClientRect(); L().x = (e.clientX - r.left) / r.width * img.width + drag.dx; L().y = (e.clientY - r.top) / r.height * img.height + drag.dy; draw(); });
    ["pointerup", "pointercancel"].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });
    document.getElementById("tx-dl").addEventListener("click", function () { if (!img) return; var c = document.createElement("canvas"); c.width = img.width; c.height = img.height; render(c.getContext("2d"), 1, false); var fmt = E.fmt.value; toBlob(c, fmt, 0.92).then(function (b) { saveBlob(b, name + "-text." + (fmt === "image/png" ? "png" : "jpg")); form.setAttribute("data-saved", c.width + "x" + c.height); }); });
    dropZone(document.getElementById("drop"), document.getElementById("tx-input"), function (f) { loadImg(f, 4000).then(function (c) { img = c; name = baseName(f); layers = []; document.getElementById("tx-work").hidden = false; add(); form.setAttribute("data-ready", "1"); }); });
    window.addEventListener("resize", draw);
    if (document.fonts) document.fonts.load("40px Anton").then(draw, function () {});
    window.ETBTextLayers = function () { return layers.map(function (l) { return { text: l.text, x: Math.round(l.x), y: Math.round(l.y) }; }); };
  }

  // ---------------- Meme generator ----------------
  function memeLines(x, text, W, maxSize, maxH) {
    text = String(text || "").toUpperCase(); if (!text.trim()) return { lines: [], size: 0 };
    for (var s = maxSize; s >= 14; s -= 2) { x.font = s + "px Anton, Impact, sans-serif"; var ls = wrapText(x, text, W * 0.94); if (ls.length * s * 1.1 <= maxH) return { lines: ls, size: s }; }
    x.font = "14px Anton, Impact, sans-serif"; return { lines: wrapText(x, text, W * 0.94), size: 14 };
  }
  function renderMeme(c, img, o) {
    var W = img.width, top = 0, bar = 0, x = c.getContext("2d");
    if (o.style === "caption") { x.font = "10px Arial"; var cap = (function () { for (var s = Math.round(W / 12); s >= 14; s -= 2) { x.font = "700 " + s + "px Arial, Helvetica, sans-serif"; var ls = wrapText(x, o.top || "", W * 0.9); if (ls.length <= 4) return { s: s, ls: ls }; } return { s: 14, ls: wrapText(x, o.top || "", W * 0.9) }; })();
      bar = o.top ? cap.ls.length * cap.s * 1.25 + cap.s : 0; c.width = W; c.height = img.height + bar; x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, bar); x.drawImage(img, 0, bar);
      x.fillStyle = "#111"; x.textAlign = "center"; x.textBaseline = "top"; x.font = "700 " + cap.s + "px Arial, Helvetica, sans-serif"; cap.ls.forEach(function (t, i) { x.fillText(t, W / 2, cap.s * 0.5 + i * cap.s * 1.25); }); return; }
    c.width = W; c.height = img.height; x = c.getContext("2d"); x.drawImage(img, 0, 0);
    var max = Math.round(W / 8), maxH = img.height * 0.3;
    [["top", "top"], ["bottom", "bottom"]].forEach(function (p) {
      var r = memeLines(x, o[p[0]], W, max, maxH); if (!r.lines.length) return;
      x.font = r.size + "px Anton, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = p[1] === "top" ? "top" : "bottom"; x.lineJoin = "round"; x.lineWidth = Math.max(2, r.size / 8); x.strokeStyle = "#000"; x.fillStyle = "#fff";
      r.lines.forEach(function (t, i) { var y = p[1] === "top" ? img.height * 0.03 + i * r.size * 1.1 : img.height * 0.97 - (r.lines.length - 1 - i) * r.size * 1.1; x.strokeText(t, W / 2, y); x.fillText(t, W / 2, y); });
    });
    top = bar;
  }
  function initMeme(form) {
    var E = form.elements, view = document.getElementById("mm-view"), img = null, name = "meme", full = document.createElement("canvas");
    function draw() { if (!img) return; renderMeme(full, img, { top: E.top.value, bottom: E.bottom.value, style: E.style.value }); fit(view, full, Math.min(700, view.parentNode.clientWidth || 700), 640); view.getContext("2d").drawImage(full, 0, 0, view.width, view.height); document.getElementById("mm-bottom-row").hidden = E.style.value === "caption"; document.getElementById("mm-top-label").textContent = E.style.value === "caption" ? "Caption" : "Top text"; }
    form.addEventListener("input", draw); form.addEventListener("change", draw); form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("mm-dl").addEventListener("click", function () { if (!img) return; draw(); toBlob(full, "image/jpeg", 0.92).then(function (b) { saveBlob(b, name + "-meme.jpg"); form.setAttribute("data-saved", full.width + "x" + full.height); }); });
    dropZone(document.getElementById("drop"), document.getElementById("mm-input"), function (f) { loadImg(f, 1600).then(function (c) { img = c; name = baseName(f); document.getElementById("mm-work").hidden = false; form.setAttribute("data-ready", "1"); draw(); }); });
    if (document.fonts) document.fonts.load("40px Anton").then(draw, function () {});
  }

  // ---------------- Photo collage ----------------
  var LAYOUTS = { // cells as [x, y, w, h] in fractions
    "2v": [[0, 0, .5, 1], [.5, 0, .5, 1]], "2h": [[0, 0, 1, .5], [0, .5, 1, .5]], "3a": [[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]], "3b": [[0, 0, 1, .5], [0, .5, .5, .5], [.5, .5, .5, .5]],
    "4": [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], "5": [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, 1 / 3, .5], [1 / 3, .5, 1 / 3, .5], [2 / 3, .5, 1 / 3, .5]],
    "6": [[0, 0, 1 / 3, .5], [1 / 3, 0, 1 / 3, .5], [2 / 3, 0, 1 / 3, .5], [0, .5, 1 / 3, .5], [1 / 3, .5, 1 / 3, .5], [2 / 3, .5, 1 / 3, .5]],
    "9": [0, 1, 2].reduce(function (a, r) { return a.concat([0, 1, 2].map(function (c) { return [c / 3, r / 3, 1 / 3, 1 / 3]; })); }, []) };
  var CANVAS = { sq: [2160, 2160], portrait: [2160, 2700], story: [1080, 1920], land: [2400, 1350], a4: [2480, 3508] };
  function initCollage(form) {
    var E = form.elements, view = document.getElementById("cl-view"), pics = [], pan = [], target = 0, input = document.getElementById("cl-input");
    function cells() { return LAYOUTS[E.layout.value] || LAYOUTS["4"]; }
    function render(c, W, H, ui) {
      var x = c.getContext("2d"), g = +E.gap.value / 1000 * Math.min(W, H), rad = +E.radius.value / 100 * Math.min(W, H) * 0.25;
      x.fillStyle = E.bgc.value; x.fillRect(0, 0, W, H);
      cells().forEach(function (cl, i) {
        var dx = cl[0] * W + g, dy = cl[1] * H + g, dw = cl[2] * W - g * (cl[0] + cl[2] >= 0.999 ? 2 : 1) - (cl[0] === 0 ? 0 : 0), dh = cl[3] * H - g * (cl[1] + cl[3] >= 0.999 ? 2 : 1);
        if (cl[0] > 0) { dw = cl[2] * W - g * (cl[0] + cl[2] >= 0.999 ? 1.5 : 1); dx = cl[0] * W + g / 2; } if (cl[0] === 0 && cl[2] < 0.999) dw = cl[2] * W - g * 1.5;
        if (cl[1] > 0) { dh = cl[3] * H - g * (cl[1] + cl[3] >= 0.999 ? 1.5 : 1); dy = cl[1] * H + g / 2; } if (cl[1] === 0 && cl[3] < 0.999) dh = cl[3] * H - g * 1.5;
        x.save(); x.beginPath(); if (x.roundRect) x.roundRect(dx, dy, dw, dh, rad); else x.rect(dx, dy, dw, dh); x.clip();
        if (pics[i]) cover(x, pics[i], dx, dy, dw, dh, (pan[i] || [0, 0])[0], (pan[i] || [0, 0])[1]);
        else if (ui) { x.fillStyle = "rgba(127,127,127,.18)"; x.fillRect(dx, dy, dw, dh); x.fillStyle = "rgba(100,116,139,.9)"; x.font = "600 " + Math.round(Math.min(dw, dh) / 9) + "px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("+ Add photo", dx + dw / 2, dy + dh / 2); }
        x.restore(); cl.box = [dx, dy, dw, dh];
      });
    }
    function draw() { var s = CANVAS[E.size.value]; var k = Math.min(1, Math.min(620, view.parentNode.clientWidth || 620) / s[0], 620 / s[1]); view.width = Math.round(s[0] * k); view.height = Math.round(s[1] * k); render(view, view.width, view.height, true); document.getElementById("cl-count").textContent = pics.filter(Boolean).length + " of " + cells().length + " photos"; }
    function cellAt(e) { var r = view.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height, cs = cells(); for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (px >= c[0] && px <= c[0] + c[2] && py >= c[1] && py <= c[1] + c[3]) return i; } return -1; }
    function addFiles(files) { var cs = cells(), slots = []; for (var i = 0; i < cs.length; i++) if (!pics[i]) slots.push(i); if (target >= 0 && files.length === 1) slots = [target];
      Promise.all(files.slice(0, slots.length || 1).map(function (f) { return loadImg(f, 2400); })).then(function (imgs) { imgs.forEach(function (im, j) { var s = slots[j] === undefined ? j : slots[j]; pics[s] = im; pan[s] = [0, 0]; }); draw(); form.setAttribute("data-photos", String(pics.filter(Boolean).length)); }); }
    var drag = null;
    view.addEventListener("pointerdown", function (e) { var i = cellAt(e); if (i < 0) return; if (!pics[i]) { target = i; input.click(); return; } drag = { i: i, x: e.clientX, y: e.clientY, p: (pan[i] || [0, 0]).slice(), moved: false }; view.setPointerCapture(e.pointerId); });
    view.addEventListener("pointermove", function (e) { if (!drag) return; var c = cells()[drag.i], r = view.getBoundingClientRect(); var dx = (e.clientX - drag.x) / (c[2] * r.width), dy = (e.clientY - drag.y) / (c[3] * r.height); if (Math.abs(dx) + Math.abs(dy) > 0.01) drag.moved = true; pan[drag.i] = [Math.max(-1, Math.min(1, drag.p[0] - dx * 2)), Math.max(-1, Math.min(1, drag.p[1] - dy * 2))]; draw(); });
    view.addEventListener("pointerup", function () { if (drag && !drag.moved) { target = drag.i; input.click(); } drag = null; });
    input.addEventListener("change", function () { if (input.files.length) addFiles(Array.prototype.slice.call(input.files)); input.value = ""; target = -1; });
    var drop = document.getElementById("drop"); ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); }); });
    drop.addEventListener("drop", function (e) { e.preventDefault(); target = -1; addFiles(Array.prototype.slice.call(e.dataTransfer.files).filter(function (f) { return /^image\//.test(f.type); })); });
    document.getElementById("cl-add").addEventListener("click", function () { target = -1; input.click(); });
    document.getElementById("cl-clear").addEventListener("click", function () { pics = []; pan = []; draw(); });
    document.getElementById("cl-shuffle").addEventListener("click", function () { var p = pics.filter(Boolean); for (var i = p.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; } pics = p; pan = []; draw(); });
    document.getElementById("cl-dl").addEventListener("click", function () { var s = CANVAS[E.size.value], c = document.createElement("canvas"); c.width = s[0]; c.height = s[1]; render(c, s[0], s[1], false); var fmt = E.fmt.value; toBlob(c, fmt, 0.92).then(function (b) { saveBlob(b, "collage." + (fmt === "image/png" ? "png" : "jpg")); form.setAttribute("data-saved", c.width + "x" + c.height); }); });
    form.addEventListener("input", draw); form.addEventListener("change", draw); form.addEventListener("submit", function (e) { e.preventDefault(); }); window.addEventListener("resize", draw);
    target = -1; draw();
  }

  // ---------------- Favicon generator ----------------
  var FAV = [16, 32, 48, 180, 192, 512];
  function ico(pngs) { // pngs: [{size, bytes}] -> ICO with embedded PNGs
    var n = pngs.length, head = 6 + n * 16, total = head + pngs.reduce(function (a, p) { return a + p.bytes.length; }, 0), buf = new Uint8Array(total), dv = new DataView(buf.buffer), off = head;
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, n, true);
    pngs.forEach(function (p, i) { var o = 6 + i * 16; buf[o] = p.size >= 256 ? 0 : p.size; buf[o + 1] = p.size >= 256 ? 0 : p.size; buf[o + 2] = 0; buf[o + 3] = 0; dv.setUint16(o + 4, 1, true); dv.setUint16(o + 6, 32, true); dv.setUint32(o + 8, p.bytes.length, true); dv.setUint32(o + 12, off, true); buf.set(p.bytes, off); off += p.bytes.length; });
    return buf;
  }
  function initFavicon(form) {
    var E = form.elements, prev = document.getElementById("fv-prev"), src = null, snippet = document.getElementById("fv-code");
    function master(size) {
      var c = document.createElement("canvas"); c.width = c.height = size; var x = c.getContext("2d"), r = +E.radius.value / 100 * size / 2;
      x.save(); x.beginPath(); if (x.roundRect) x.roundRect(0, 0, size, size, r); else x.rect(0, 0, size, size); x.clip();
      if (E.mode.value === "image" && src) { if (E.bgon.checked) { x.fillStyle = E.bgc.value; x.fillRect(0, 0, size, size); } var pad = +E.pad.value / 100 * size; cover(x, src, pad, pad, size - pad * 2, size - pad * 2); }
      else { x.fillStyle = E.bgc.value; x.fillRect(0, 0, size, size); var t = (E.text.value || "e").slice(0, 3); x.fillStyle = E.fg.value; x.textAlign = "center"; x.textBaseline = "middle"; var fs = size * (t.length === 1 ? 0.68 : t.length === 2 ? 0.52 : 0.4); x.font = "700 " + fs + "px " + (FONTS[E.font.value] || FONTS.sans); x.fillText(t, size / 2, size * 0.54); }
      x.restore(); return c;
    }
    function draw() {
      document.querySelectorAll("[data-fv]").forEach(function (el) { el.hidden = el.getAttribute("data-fv") !== E.mode.value; });
      prev.innerHTML = ""; [16, 32, 48, 180].forEach(function (s) { var c = master(s), w = document.createElement("figure"); c.style.width = c.style.height = Math.max(32, Math.min(s, 96)) + "px"; c.style.imageRendering = s < 48 ? "pixelated" : "auto"; w.appendChild(c); w.insertAdjacentHTML("beforeend", "<figcaption>" + s + "×" + s + "</figcaption>"); prev.appendChild(w); });
      var tab = document.getElementById("fv-tab"); tab.innerHTML = ""; var t = master(32); t.style.width = t.style.height = "16px"; tab.appendChild(t); tab.insertAdjacentHTML("beforeend", "<span>" + esc(E.title.value || "My website") + "</span>");
      snippet.value = '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">';
    }
    function build() {
      return Promise.all(FAV.map(function (s) { return toBlob(master(s), "image/png").then(function (b) { return b.arrayBuffer().then(function (a) { return { size: s, bytes: new Uint8Array(a) }; }); }); })).then(function (ps) {
        var by = {}; ps.forEach(function (p) { by[p.size] = p.bytes; });
        var nm = E.title.value || "My website", manifest = JSON.stringify({ name: nm, short_name: nm.slice(0, 12), icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }], theme_color: E.bgc.value, background_color: "#ffffff", display: "standalone" }, null, 2);
        return { "favicon.ico": ico(ps.filter(function (p) { return p.size <= 48; })), "favicon-16x16.png": by[16], "favicon-32x32.png": by[32], "apple-touch-icon.png": by[180], "android-chrome-192x192.png": by[192], "android-chrome-512x512.png": by[512],
          "site.webmanifest": new TextEncoder().encode(manifest), "favicon-html.txt": new TextEncoder().encode(snippet.value + "\n") };
      });
    }
    document.getElementById("fv-dl").addEventListener("click", function () { build().then(function (files) { saveBlob(new Blob([fflate.zipSync(files)], { type: "application/zip" }), "favicon.zip"); form.setAttribute("data-files", Object.keys(files).join(",")); }); });
    document.getElementById("fv-copy").addEventListener("click", function () { var b = this; navigator.clipboard.writeText(snippet.value).then(function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy HTML"; }, 1400); }); });
    dropZone(document.getElementById("drop"), document.getElementById("fv-input"), function (f) { loadImg(f, 1024).then(function (c) { src = c; E.mode.value = "image"; draw(); }); });
    form.addEventListener("input", draw); form.addEventListener("change", draw); form.addEventListener("submit", function (e) { e.preventDefault(); });
    window.ETBFavicon = { build: build, ico: ico }; draw();
  }

  // ---------------- Instagram grid splitter ----------------
  function initGrid(form) {
    var E = form.elements, view = document.getElementById("ig-view"), img = null, name = "grid";
    function dims() { var cols = 3, rows = +E.rows.value, ar = E.shape.value === "45" ? 1.25 : E.shape.value === "34" ? 4 / 3 : 1; return { cols: cols, rows: rows, ar: ar, tw: 1080, th: Math.round(1080 * ar) }; }
    function draw() {
      if (!img) return; var d = dims(), W = d.cols * d.tw, H = d.rows * d.th, k = Math.min(1, Math.min(620, view.parentNode.clientWidth || 620) / W), x;
      view.width = Math.round(W * k); view.height = Math.round(H * k); x = view.getContext("2d"); cover(x, img, 0, 0, view.width, view.height);
      x.strokeStyle = "#fff"; x.lineWidth = 3; for (var c = 1; c < d.cols; c++) { x.beginPath(); x.moveTo(view.width * c / d.cols, 0); x.lineTo(view.width * c / d.cols, view.height); x.stroke(); } for (var r = 1; r < d.rows; r++) { x.beginPath(); x.moveTo(0, view.height * r / d.rows); x.lineTo(view.width, view.height * r / d.rows); x.stroke(); }
      x.fillStyle = "rgba(0,0,0,.55)"; x.font = "700 14px system-ui, sans-serif"; var n = d.cols * d.rows;
      for (var i = 0; i < n; i++) { var cx = (i % d.cols) * view.width / d.cols, cy = Math.floor(i / d.cols) * view.height / d.rows; x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(cx + 6, cy + 6, 26, 22); x.fillStyle = "#fff"; x.fillText(String(n - i), cx + 12, cy + 22); }
      document.getElementById("ig-note").textContent = n + " posts of " + d.tw + " × " + d.th + " px. Post them in number order, starting with 1 (bottom right).";
    }
    function tiles() {
      var d = dims(), W = d.cols * d.tw, H = d.rows * d.th, big = document.createElement("canvas"); big.width = W; big.height = H; cover(big.getContext("2d"), img, 0, 0, W, H);
      var out = [], n = d.cols * d.rows;
      for (var i = 0; i < n; i++) { var c = document.createElement("canvas"); c.width = d.tw; c.height = d.th; c.getContext("2d").drawImage(big, (i % d.cols) * d.tw, Math.floor(i / d.cols) * d.th, d.tw, d.th, 0, 0, d.tw, d.th); out.push({ c: c, post: n - i }); }
      return out.sort(function (a, b) { return a.post - b.post; });
    }
    document.getElementById("ig-dl").addEventListener("click", function () { if (!img) return; var t = tiles(); Promise.all(t.map(function (x) { return toBlob(x.c, "image/jpeg", 0.93).then(function (b) { return { name: name + "-post-" + String(x.post).padStart(2, "0") + ".jpg", blob: b }; }); })).then(function (files) { form.setAttribute("data-tiles", String(files.length)); return zipAndSave(files, name + "-instagram-grid.zip"); }); });
    dropZone(document.getElementById("drop"), document.getElementById("ig-input"), function (f) { loadImg(f, 6000).then(function (c) { img = c; name = baseName(f); document.getElementById("ig-work").hidden = false; form.setAttribute("data-ready", "1"); draw(); }); });
    form.addEventListener("change", draw); form.addEventListener("submit", function (e) { e.preventDefault(); }); window.addEventListener("resize", draw);
  }

  // ---------------- Social media image resizer ----------------
  var SOCIAL = [["Instagram", "Post (square)", 1080, 1080], ["Instagram", "Post (portrait)", 1080, 1350], ["Instagram", "Story / Reel", 1080, 1920], ["Facebook", "Post", 1200, 630], ["Facebook", "Cover photo", 851, 315], ["Facebook", "Story", 1080, 1920],
    ["X (Twitter)", "Post", 1600, 900], ["X (Twitter)", "Header", 1500, 500], ["LinkedIn", "Post", 1200, 627], ["LinkedIn", "Personal banner", 1584, 396], ["LinkedIn", "Company logo", 400, 400], ["YouTube", "Thumbnail", 1280, 720], ["YouTube", "Channel banner", 2560, 1440],
    ["TikTok", "Video cover", 1080, 1920], ["Pinterest", "Pin", 1000, 1500], ["WhatsApp", "Profile photo", 500, 500]];
  function initSocial(form) {
    var E = form.elements, grid = document.getElementById("sm-grid"), img = null, name = "image";
    function render(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d");
      if (E.mode.value === "crop") cover(x, img, 0, 0, w, h, +E.px.value / 100, +E.py.value / 100);
      else { if (E.mode.value === "blur") { x.filter = "blur(" + Math.round(Math.max(w, h) / 40) + "px) brightness(.85)"; cover(x, img, -20, -20, w + 40, h + 40); x.filter = "none"; } else { x.fillStyle = E.bgc.value; x.fillRect(0, 0, w, h); }
        var k = Math.min(w / img.width, h / img.height); x.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k); }
      return c; }
    function draw() {
      document.getElementById("sm-bg").hidden = E.mode.value !== "fit"; document.getElementById("sm-pos").hidden = E.mode.value !== "crop";
      if (!img) return;
      grid.innerHTML = SOCIAL.map(function (s, i) { return '<label class="sm-card"><input type="checkbox" name="pick" value="' + i + '"><span class="sm-thumb" data-i="' + i + '"></span><strong>' + s[0] + "</strong><span>" + s[1] + " · " + s[2] + "×" + s[3] + "</span></label>"; }).join("");
      grid.querySelectorAll(".sm-thumb").forEach(function (el) { var s = SOCIAL[+el.getAttribute("data-i")], k = Math.min(150 / s[2], 110 / s[3]), c = render(Math.round(s[2] * k), Math.round(s[3] * k)); el.appendChild(c); });
    }
    var picked = [0];
    grid.addEventListener("change", function () { picked = [].map.call(form.querySelectorAll("input[name=pick]:checked"), function (c) { return +c.value; }); });
    function redraw() { draw(); form.querySelectorAll("input[name=pick]").forEach(function (c) { c.checked = picked.indexOf(+c.value) >= 0; }); }
    document.getElementById("sm-dl").addEventListener("click", function () {
      if (!img || !picked.length) return;
      Promise.all(picked.map(function (i) { var s = SOCIAL[i]; return toBlob(render(s[2], s[3]), "image/jpeg", 0.92).then(function (b) { return { name: name + "-" + (s[0] + "-" + s[1]).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + s[2] + "x" + s[3] + ".jpg", blob: b }; }); }))
        .then(function (files) { form.setAttribute("data-files", files.map(function (f) { return f.name; }).join("|")); if (files.length === 1) saveBlob(files[0].blob, files[0].name); else return zipAndSave(files, name + "-social-sizes.zip"); });
    });
    document.getElementById("sm-all").addEventListener("click", function () { picked = SOCIAL.map(function (s, i) { return i; }); redraw(); });
    dropZone(document.getElementById("drop"), document.getElementById("sm-input"), function (f) { loadImg(f, 3000).then(function (c) { img = c; name = baseName(f); document.getElementById("sm-work").hidden = false; form.setAttribute("data-ready", "1"); redraw(); }); });
    form.addEventListener("input", function (e) { if (e.target.name !== "pick") redraw(); }); form.addEventListener("submit", function (e) { e.preventDefault(); }); draw();
  }

  // ---------------- SVG to PNG ----------------
  function svgSize(text) {
    var d = new DOMParser().parseFromString(text, "image/svg+xml"), s = d.documentElement; if (!s || s.nodeName.toLowerCase() !== "svg") throw new Error("That doesn't look like an SVG file.");
    var vb = (s.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number), w = parseFloat(s.getAttribute("width")), h = parseFloat(s.getAttribute("height"));
    if (!(w > 0) && vb.length === 4) w = vb[2]; if (!(h > 0) && vb.length === 4) h = vb[3]; if (!(w > 0)) w = 300; if (!(h > 0)) h = 150;
    if (!s.getAttribute("width") || /%/.test(s.getAttribute("width"))) { s.setAttribute("width", w); s.setAttribute("height", h); }
    return { w: w, h: h, text: new XMLSerializer().serializeToString(s) };
  }
  function svgToCanvas(text, width, bg) {
    var info = svgSize(text), k = width ? width / info.w : 1, c = document.createElement("canvas"); c.width = Math.max(1, Math.round(info.w * k)); c.height = Math.max(1, Math.round(info.h * k));
    return new Promise(function (res, rej) { var img = new Image(); img.onload = function () { var x = c.getContext("2d"); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); } x.drawImage(img, 0, 0, c.width, c.height); res(c); }; img.onerror = function () { rej(new Error("This SVG couldn't be drawn. It may use external files or fonts.")); }; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(info.text); });
  }
  function initSvg(form) {
    var E = form.elements, out = document.getElementById("sv-out"), msg = document.getElementById("sv-msg"), files = [], showSeq = 0;
    function opts() { return { width: E.sizing.value === "scale" ? 0 : +E.width.value || 0, scale: +E.scale.value || 1, bg: E.bgon.checked ? E.bgc.value : null, fmt: E.fmt.value }; }
    function conv(item) { var o = opts(), info = svgSize(item.text), w = o.width || Math.round(info.w * o.scale); return svgToCanvas(item.text, w, o.fmt === "image/jpeg" ? (o.bg || "#ffffff") : o.bg); }
    function show() {
      document.getElementById("sv-w").hidden = E.sizing.value !== "width"; document.getElementById("sv-s").hidden = E.sizing.value !== "scale";
      msg.textContent = ""; var seq = ++showSeq;
      Promise.all(files.map(function (f) { return conv(f).then(function (c) { var fig = document.createElement("figure"); fig.className = "sv-item"; var t = document.createElement("canvas"); var k = Math.min(1, 220 / c.width, 160 / c.height); t.width = Math.max(1, c.width * k); t.height = Math.max(1, c.height * k); t.getContext("2d").drawImage(c, 0, 0, t.width, t.height); fig.appendChild(t); fig.insertAdjacentHTML("beforeend", "<figcaption>" + esc(f.name) + " · " + c.width + "×" + c.height + "</figcaption>"); return fig; }, function (e) { msg.textContent = f.name + ": " + e.message; return null; }); }))
        .then(function (figs) { if (seq !== showSeq) return; out.innerHTML = ""; figs.forEach(function (g) { if (g) out.appendChild(g); }); });
      document.getElementById("sv-actions").hidden = !files.length;
    }
    function addText(name, text) { try { svgSize(text); files.push({ name: name, text: text }); show(); form.setAttribute("data-count", String(files.length)); } catch (e) { msg.textContent = name + ": " + e.message; } }
    dropZone(document.getElementById("drop"), document.getElementById("sv-input"), function (fs) { fs.forEach(function (f) { f.text().then(function (t) { addText(f.name.replace(/\.svg$/i, ""), t); }); }); }, true);
    document.getElementById("sv-paste").addEventListener("click", function () { var t = E.code.value.trim(); if (t) addText("pasted-svg", t); });
    document.getElementById("sv-clear").addEventListener("click", function () { files = []; show(); });
    document.getElementById("sv-dl").addEventListener("click", function () {
      var fmt = E.fmt.value, ext = fmt === "image/png" ? "png" : fmt === "image/webp" ? "webp" : "jpg";
      Promise.all(files.map(function (f) { return conv(f).then(function (c) { return toBlob(c, fmt, 0.95); }).then(function (b) { return { name: f.name + "." + ext, blob: b }; }); }))
        .then(function (bs) { form.setAttribute("data-saved", String(bs.length)); if (bs.length === 1) saveBlob(bs[0].blob, bs[0].name); else return zipAndSave(bs, "svg-converted.zip"); }, function (e) { msg.textContent = e.message; });
    });
    form.addEventListener("change", show); form.addEventListener("submit", function (e) { e.preventDefault(); });
    window.ETBSvg = { svgSize: function (t) { var s = svgSize(t); return [s.w, s.h]; } };
  }

  // ---------------- Colour palette from image ----------------
  function palette(data, k) { // k-means++ on sampled pixels, deterministic seeding
    var px = []; for (var i = 0; i < data.length; i += 4) if (data[i + 3] > 125) px.push([data[i], data[i + 1], data[i + 2]]);
    if (!px.length) return [];
    var step = Math.max(1, Math.floor(px.length / 6000)), s = []; for (i = 0; i < px.length; i += step) s.push(px[i]);
    var d2 = function (a, b) { var r = a[0] - b[0], g = a[1] - b[1], bb = a[2] - b[2]; return r * r * 0.3 + g * g * 0.59 + bb * bb * 0.11; };
    var C = [s[Math.floor(s.length / 2)].slice()];
    while (C.length < k) { var best = null, bd = -1; for (i = 0; i < s.length; i += 3) { var m = Infinity; for (var j = 0; j < C.length; j++) m = Math.min(m, d2(s[i], C[j])); if (m > bd) { bd = m; best = s[i]; } } if (!best || bd < 30) break; C.push(best.slice()); }
    var assign = new Int16Array(s.length);
    for (var it = 0; it < 12; it++) {
      var sum = C.map(function () { return [0, 0, 0, 0]; });
      for (i = 0; i < s.length; i++) { var bi = 0, bv = Infinity; for (j = 0; j < C.length; j++) { var v = d2(s[i], C[j]); if (v < bv) { bv = v; bi = j; } } assign[i] = bi; sum[bi][0] += s[i][0]; sum[bi][1] += s[i][1]; sum[bi][2] += s[i][2]; sum[bi][3]++; }
      C = C.map(function (c, j) { return sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3], sum[j][3]] : c.concat([0]).slice(0, 4); });
    }
    var tot = s.length;
    return C.map(function (c) { return { rgb: [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])], share: (c[3] || 0) / tot }; }).filter(function (c) { return c.share > 0.004; }).sort(function (a, b) { return b.share - a.share; });
  }
  function hex(rgb) { return "#" + rgb.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("").toUpperCase(); }
  function initPalette(form) {
    var E = form.elements, out = document.getElementById("pl-out"), view = document.getElementById("pl-view"), img = null, pal = [], name = "palette";
    function run() {
      if (!img) return; var k = Math.min(1, 200 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k)); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      pal = palette(c.getContext("2d").getImageData(0, 0, c.width, c.height).data, +E.count.value);
      out.innerHTML = '<div class="pl-strip">' + pal.map(function (p) { var h = hex(p.rgb), light = p.rgb[0] * .299 + p.rgb[1] * .587 + p.rgb[2] * .114 > 150; return '<button type="button" class="pl-sw" style="background:' + h + ";color:" + (light ? "#111" : "#fff") + '" data-hex="' + h + '" title="Copy ' + h + '"><b>' + h + "</b><span>rgb(" + p.rgb.join(", ") + ")</span><span>" + Math.round(p.share * 100) + "%</span></button>"; }).join("") + "</div>";
      document.getElementById("pl-css").value = ":root {\n" + pal.map(function (p, i) { return "  --colour-" + (i + 1) + ": " + hex(p.rgb) + ";"; }).join("\n") + "\n}";
      document.getElementById("pl-actions").hidden = false; form.setAttribute("data-colours", pal.map(function (p) { return hex(p.rgb); }).join(","));
    }
    out.addEventListener("click", function (e) { var b = e.target.closest("[data-hex]"); if (!b) return; navigator.clipboard.writeText(b.getAttribute("data-hex")).then(function () { var t = b.querySelector("b"), o = t.textContent; t.textContent = "Copied!"; setTimeout(function () { t.textContent = o; }, 1000); }); });
    document.getElementById("pl-copy").addEventListener("click", function () { var b = this; navigator.clipboard.writeText(document.getElementById("pl-css").value).then(function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy CSS"; }, 1400); }); });
    document.getElementById("pl-png").addEventListener("click", function () { var c = document.createElement("canvas"), w = 200; c.width = w * pal.length; c.height = 260; var x = c.getContext("2d"); pal.forEach(function (p, i) { x.fillStyle = hex(p.rgb); x.fillRect(i * w, 0, w, 200); x.fillStyle = "#fff"; x.fillRect(i * w, 200, w, 60); x.fillStyle = "#111"; x.font = "600 22px Arial"; x.textAlign = "center"; x.fillText(hex(p.rgb), i * w + w / 2, 240); }); toBlob(c).then(function (b) { saveBlob(b, name + "-palette.png"); }); });
    dropZone(document.getElementById("drop"), document.getElementById("pl-input"), function (f) { loadImg(f, 1600).then(function (c) { img = c; name = baseName(f); fit(view, c, Math.min(520, view.parentNode.clientWidth || 520), 420); view.getContext("2d").drawImage(c, 0, 0, view.width, view.height); document.getElementById("pl-work").hidden = false; run(); }); });
    form.addEventListener("change", run); form.addEventListener("submit", function (e) { e.preventDefault(); });
    window.ETBPalette = { palette: palette, hex: hex };
  }

  window.ETBImg = { renderMeme: renderMeme, svgSize: svgSize };
  document.addEventListener("DOMContentLoaded", function () {
    var m = { "data-addtext": initText, "data-meme": initMeme, "data-collage": initCollage, "data-favicon": initFavicon, "data-iggrid": initGrid, "data-social": initSocial, "data-svgpng": initSvg, "data-palette": initPalette };
    Object.keys(m).forEach(function (a) { var f = document.querySelector("form[" + a + "]"); if (f) m[a](f); });
  });
})();
