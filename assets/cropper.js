/* etoolbox – image cropper: drag a crop box (free or fixed ratio, square or circle), rotate and flip,
   then download as PNG, JPG or WebP. Everything happens in the browser. */
(function () {
  "use strict";
  var RATIOS = { free: 0, "1:1": 1, circle: 1, "4:5": 4 / 5, "3:2": 3 / 2, "2:3": 2 / 3, "4:3": 4 / 3, "16:9": 16 / 9, "9:16": 9 / 16, "1.91:1": 1.91 };

  function clampRect(r, W, H, ratio) {
    r.w = Math.max(8, Math.min(r.w, W)); r.h = Math.max(8, Math.min(r.h, H));
    if (ratio) { if (r.w / r.h > ratio) r.w = r.h * ratio; else r.h = r.w / ratio; }
    r.x = Math.max(0, Math.min(r.x, W - r.w)); r.y = Math.max(0, Math.min(r.y, H - r.h));
    return r;
  }
  function centred(W, H, ratio) {
    var w = W * 0.8, h = H * 0.8;
    if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
    return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
  }
  function cropTo(src, r, opts) {
    var w = Math.round(r.w), h = Math.round(r.h), k = opts.width ? opts.width / w : 1, c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var x = c.getContext("2d"); x.imageSmoothingQuality = "high";
    if (opts.fmt === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }
    if (opts.circle) { x.beginPath(); x.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2); x.clip(); }
    x.drawImage(src, Math.round(r.x), Math.round(r.y), w, h, 0, 0, c.width, c.height);
    return c;
  }

  function init(form) {
    var E = form.elements, view = document.getElementById("cr-view"), msg = document.getElementById("cr-msg"), input = document.getElementById("cr-input"), drop = document.getElementById("drop");
    var src = null, base = null, rect = null, name = "image", rot = 0, flipH = false, flipV = false;
    function ratio() { return RATIOS[E.ratio.value] || 0; }
    function circle() { return E.ratio.value === "circle"; }

    function rebuild() {
      var sw = base.width, sh = base.height, swap = rot % 180 !== 0, c = document.createElement("canvas");
      c.width = swap ? sh : sw; c.height = swap ? sw : sh;
      var x = c.getContext("2d"); x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      x.drawImage(base, -sw / 2, -sh / 2); src = c; rect = centred(src.width, src.height, ratio()); draw();
    }
    function scale() { return view.width / src.width; }
    function draw() {
      if (!src) return;
      var maxW = Math.min(820, view.parentNode.clientWidth || 820), k = Math.min(maxW / src.width, 560 / src.height, 1);
      view.width = Math.round(src.width * k); view.height = Math.round(src.height * k);
      var x = view.getContext("2d"), r = { x: rect.x * k, y: rect.y * k, w: rect.w * k, h: rect.h * k };
      x.drawImage(src, 0, 0, view.width, view.height);
      x.save(); x.fillStyle = "rgba(15,23,42,.55)"; x.beginPath(); x.rect(0, 0, view.width, view.height);
      if (circle()) x.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2, true); else x.rect(r.x + r.w, r.y, -r.w, r.h);
      x.fill("evenodd"); x.restore();
      x.strokeStyle = "#fff"; x.lineWidth = 2; x.strokeRect(r.x, r.y, r.w, r.h);
      x.strokeStyle = "rgba(255,255,255,.45)"; x.lineWidth = 1; x.beginPath();
      for (var i = 1; i < 3; i++) { x.moveTo(r.x + r.w * i / 3, r.y); x.lineTo(r.x + r.w * i / 3, r.y + r.h); x.moveTo(r.x, r.y + r.h * i / 3); x.lineTo(r.x + r.w, r.y + r.h * i / 3); }
      x.stroke(); x.fillStyle = "#fff";
      handles(r).forEach(function (h) { x.fillRect(h.x - 6, h.y - 6, 12, 12); });
      ["x", "y", "w", "h"].forEach(function (f) { if (document.activeElement !== E["c" + f]) E["c" + f].value = Math.round(rect[f]); });
      document.getElementById("cr-dim").textContent = Math.round(rect.w) + " × " + Math.round(rect.h) + " px" + (E.width.value ? " → " + E.width.value + " × " + Math.round(E.width.value * rect.h / rect.w) + " px" : "");
    }
    function handles(r) {
      return [["nw", r.x, r.y], ["n", r.x + r.w / 2, r.y], ["ne", r.x + r.w, r.y], ["e", r.x + r.w, r.y + r.h / 2], ["se", r.x + r.w, r.y + r.h], ["s", r.x + r.w / 2, r.y + r.h], ["sw", r.x, r.y + r.h], ["w", r.x, r.y + r.h / 2]]
        .map(function (a) { return { id: a[0], x: a[1], y: a[2] }; });
    }
    function pos(e) { var b = view.getBoundingClientRect(), k = view.width / b.width; return { x: (e.clientX - b.left) * k, y: (e.clientY - b.top) * k }; }

    var drag = null;
    view.addEventListener("pointerdown", function (e) {
      if (!src) return; var p = pos(e), k = scale(), r = { x: rect.x * k, y: rect.y * k, w: rect.w * k, h: rect.h * k }, tol = 16 * view.width / view.getBoundingClientRect().width;
      var hit = handles(r).filter(function (h) { return Math.abs(h.x - p.x) < tol && Math.abs(h.y - p.y) < tol; })[0];
      var mode = hit ? hit.id : (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h ? "move" : "new");
      drag = { mode: mode, p: p, r: { x: rect.x, y: rect.y, w: rect.w, h: rect.h } };
      if (mode === "new") { rect = { x: p.x / k, y: p.y / k, w: 8, h: 8 }; drag.mode = "se"; drag.r = { x: rect.x, y: rect.y, w: 0, h: 0 }; }
      view.setPointerCapture(e.pointerId); e.preventDefault();
    });
    view.addEventListener("pointermove", function (e) {
      if (!src) return; var p = pos(e), k = scale();
      if (!drag) { var r0 = { x: rect.x * k, y: rect.y * k, w: rect.w * k, h: rect.h * k }, tol = 16, hh = handles(r0).filter(function (h) { return Math.abs(h.x - p.x) < tol && Math.abs(h.y - p.y) < tol; })[0];
        view.style.cursor = hh ? hh.id + "-resize" : (p.x > r0.x && p.x < r0.x + r0.w && p.y > r0.y && p.y < r0.y + r0.h ? "move" : "crosshair"); return; }
      var dx = (p.x - drag.p.x) / k, dy = (p.y - drag.p.y) / k, o = drag.r, r = { x: o.x, y: o.y, w: o.w, h: o.h }, R = ratio(), m = drag.mode;
      if (m === "move") { r.x = o.x + dx; r.y = o.y + dy; rect = clampRect(r, src.width, src.height, 0); draw(); return; }
      if (m.indexOf("e") >= 0) r.w = o.w + dx; if (m.indexOf("s") >= 0) r.h = o.h + dy;
      if (m.indexOf("w") >= 0) { r.x = o.x + dx; r.w = o.w - dx; } if (m.indexOf("n") >= 0) { r.y = o.y + dy; r.h = o.h - dy; }
      if (R) { if (m === "n" || m === "s") r.w = r.h * R; else r.h = r.w / R; if (m.indexOf("n") >= 0) r.y = o.y + o.h - r.h; if (m.indexOf("w") >= 0) r.x = o.x + o.w - r.w; }
      if (r.w < 8 || r.h < 8) return;
      r.x = Math.max(0, r.x); r.y = Math.max(0, r.y); if (r.x + r.w > src.width) r.w = src.width - r.x; if (r.y + r.h > src.height) r.h = src.height - r.y;
      if (R) { if (r.w / r.h > R) r.w = r.h * R; else r.h = r.w / R; }
      rect = r; draw();
    });
    ["pointerup", "pointercancel"].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });
    view.addEventListener("keydown", function (e) {
      if (!src) return; var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!d) return;
      e.preventDefault(); var s = e.shiftKey ? 10 : 1; rect.x += d[0] * s; rect.y += d[1] * s; rect = clampRect(rect, src.width, src.height, 0); draw();
    });

    function load(file) {
      if (!file || !/^image\//.test(file.type)) { msg.textContent = "Please choose an image (JPG, PNG, WebP or GIF)."; return; }
      name = file.name.replace(/\.[^.]+$/, "") || "image";
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        base = document.createElement("canvas"); base.width = img.naturalWidth; base.height = img.naturalHeight; base.getContext("2d").drawImage(img, 0, 0); URL.revokeObjectURL(url);
        rot = 0; flipH = flipV = false; document.getElementById("cr-work").hidden = false;
        if (!E.fmt.value) E.fmt.value = /png|webp|gif/.test(file.type) ? "image/png" : "image/jpeg";
        rebuild(); form.setAttribute("data-ready", "1"); msg.textContent = "Drag the box or its corners. Drag outside the box to draw a new one.";
      };
      img.onerror = function () { msg.textContent = "This image couldn't be opened."; };
      img.src = url;
    }
    form.addEventListener("change", function (e) {
      if (!src) return;
      if (e.target.name === "ratio") { if (circle() && E.fmt.value === "image/jpeg") E.fmt.value = "image/png"; rect = centred(src.width, src.height, ratio()); draw(); }
      if (/^c[xywh]$/.test(e.target.name)) { rect = clampRect({ x: +E.cx.value, y: +E.cy.value, w: +E.cw.value, h: +E.ch.value }, src.width, src.height, ratio()); draw(); }
      if (e.target.name === "width") draw();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("cr-rotl").addEventListener("click", function () { rot = (rot + 270) % 360; rebuild(); });
    document.getElementById("cr-rotr").addEventListener("click", function () { rot = (rot + 90) % 360; rebuild(); });
    document.getElementById("cr-fliph").addEventListener("click", function () { flipH = !flipH; rebuild(); });
    document.getElementById("cr-flipv").addEventListener("click", function () { flipV = !flipV; rebuild(); });
    document.getElementById("cr-dl").addEventListener("click", function () {
      if (!src) return; var fmt = circle() && E.fmt.value === "image/jpeg" ? "image/png" : E.fmt.value || "image/png";
      var c = cropTo(src, rect, { fmt: fmt, circle: circle(), width: +E.width.value || 0 });
      c.toBlob(function (b) {
        var a = document.createElement("a"), u = URL.createObjectURL(b); a.href = u; a.download = name + "-cropped." + ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" })[fmt];
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        msg.textContent = "Saved " + c.width + " × " + c.height + " px."; form.setAttribute("data-saved", c.width + "x" + c.height);
      }, fmt, 0.92);
    });
    window.addEventListener("resize", draw);
    input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
    document.addEventListener("paste", function (e) { var it = e.clipboardData && Array.prototype.find.call(e.clipboardData.files || [], function (f) { return /^image\//.test(f.type); }); if (it) load(it); });
    var preset = form.getAttribute("data-preset"); if (preset) E.ratio.value = preset;
    window.ETBCropState = function () { return rect && { x: rect.x, y: rect.y, w: rect.w, h: rect.h }; };
  }

  window.ETBCrop = { clampRect: clampRect, centred: centred, cropTo: cropTo };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-crop]"); if (f) init(f); });
})();
