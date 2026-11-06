/* etoolbox – Photo object eraser. Brush over something and it's filled in from its surroundings
   (exemplar-based inpainting, after Criminisi et al.), in a Web Worker so the page stays responsive.
   Works best on small things: date stamps, spots, wires, small objects. Nothing is uploaded. */
(function () {
  "use strict";
  var form = document.querySelector("form[data-eraser]"); if (!form) return;

  /* ---------- the inpainting worker ---------- */
  var WORKER = function () {
    self.onmessage = function (ev) {
      var d = ev.data, W = d.w, H = d.h, px = d.px, hole = d.mask, r = d.r, R = d.R;
      var N = W * H, conf = new Float32Array(N), i, x, y;
      for (i = 0; i < N; i++) conf[i] = hole[i] ? 0 : 1;
      // grey for edge strength
      var grey = new Float32Array(N);
      for (i = 0; i < N; i++) grey[i] = px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11;
      var remaining = 0; for (i = 0; i < N; i++) if (hole[i]) remaining++;
      var total = remaining, lastReport = 0;
      // integral of hole to test "patch fully known" quickly; recomputed every few steps
      var integ = new Int32Array((W + 1) * (H + 1));
      function buildInteg() {
        for (y = 0; y < H; y++) { var row = 0; for (x = 0; x < W; x++) { row += hole[y * W + x]; integ[(y + 1) * (W + 1) + x + 1] = integ[y * (W + 1) + x + 1] + row; } }
      }
      function holesIn(x0, y0, x1, y1) { return integ[(y1 + 1) * (W + 1) + x1 + 1] - integ[y0 * (W + 1) + x1 + 1] - integ[(y1 + 1) * (W + 1) + x0] + integ[y0 * (W + 1) + x0]; }
      buildInteg();
      var steps = 0;
      while (remaining > 0) {
        // 1) pick the front pixel with the highest priority (confidence × (edge strength + small constant))
        var best = -1, bestP = -1;
        for (y = r; y < H - r; y++) for (x = r; x < W - r; x++) {
          var k = y * W + x; if (!hole[k]) continue;
          if (!(!hole[k - 1] || !hole[k + 1] || !hole[k - W] || !hole[k + W])) continue;
          var c = 0, g = 0, n = 0;
          for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { var q = k + dy * W + dx; c += conf[q]; if (!hole[q] && !hole[q + 1] && dx < r) { g += Math.abs(grey[q] - grey[q + 1]); n++; } }
          var P = (c / ((2 * r + 1) * (2 * r + 1))) * ((n ? g / n : 0) / 255 + 0.05);
          if (P > bestP) { bestP = P; best = k; }
        }
        if (best < 0) { // what's left touches the photo's edge: grow inwards from known neighbours
          var changed = true;
          while (remaining > 0 && changed) {
            changed = false; var fill = [];
            for (i = 0; i < N; i++) if (hole[i]) {
              x = i % W; y = (i / W) | 0; var sr = 0, sg = 0, sb = 0, n2 = 0;
              [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { var X = x + o[0], Y = y + o[1]; if (X >= 0 && Y >= 0 && X < W && Y < H && !hole[Y * W + X]) { var j = (Y * W + X) * 4; sr += px[j]; sg += px[j + 1]; sb += px[j + 2]; n2++; } });
              if (n2) fill.push([i, sr / n2, sg / n2, sb / n2]);
            }
            fill.forEach(function (f) { px[f[0] * 4] = f[1]; px[f[0] * 4 + 1] = f[2]; px[f[0] * 4 + 2] = f[3]; hole[f[0]] = 0; remaining--; changed = true; });
          }
          break;
        }
        var bx = best % W, by = (best / W) | 0;
        // 2) best matching fully-known patch nearby (coarse search, then refine)
        var bestS = Infinity, sx = -1, sy = -1;
        function ssd(cx, cy, limit) {
          var s = 0;
          for (var dy = -r; dy <= r; dy++) { var t = (by + dy) * W + bx, o = (cy + dy) * W + cx;
            for (var dx = -r; dx <= r; dx++) { var a = t + dx; if (hole[a]) continue; var b = (o + dx) * 4, a4 = a * 4;
              var e0 = px[a4] - px[b], e1 = px[a4 + 1] - px[b + 1], e2 = px[a4 + 2] - px[b + 2]; s += e0 * e0 + e1 * e1 + e2 * e2; }
            if (s >= limit) return s; }
          return s;
        }
        var x0 = Math.max(r, bx - R), x1 = Math.min(W - r - 1, bx + R), y0 = Math.max(r, by - R), y1 = Math.min(H - r - 1, by + R);
        for (var cy = y0; cy <= y1; cy += 2) for (var cx = x0; cx <= x1; cx += 2) {
          if (holesIn(cx - r, cy - r, cx + r, cy + r)) continue;
          var s = ssd(cx, cy, bestS); if (s < bestS) { bestS = s; sx = cx; sy = cy; }
        }
        if (sx >= 0) for (var ry = Math.max(r, sy - 1); ry <= Math.min(H - r - 1, sy + 1); ry++) for (var rx = Math.max(r, sx - 1); rx <= Math.min(W - r - 1, sx + 1); rx++) {
          if (holesIn(rx - r, ry - r, rx + r, ry + r)) continue; var s2 = ssd(rx, ry, bestS); if (s2 < bestS) { bestS = s2; sx = rx; sy = ry; }
        }
        // 3) copy into the hole part of the target patch
        var cp = 0, cc = 0; for (var dy2 = -r; dy2 <= r; dy2++) for (var dx2 = -r; dx2 <= r; dx2++) cc += conf[best + dy2 * W + dx2]; cp = cc / ((2 * r + 1) * (2 * r + 1));
        for (var dy3 = -r; dy3 <= r; dy3++) for (var dx3 = -r; dx3 <= r; dx3++) {
          var t3 = (by + dy3) * W + bx + dx3; if (!hole[t3]) continue;
          if (sx >= 0) { var s3 = ((sy + dy3) * W + sx + dx3) * 4; px[t3 * 4] = px[s3]; px[t3 * 4 + 1] = px[s3 + 1]; px[t3 * 4 + 2] = px[s3 + 2]; grey[t3] = grey[(sy + dy3) * W + sx + dx3]; }
          hole[t3] = 0; conf[t3] = cp; remaining--;
        }
        if (++steps % 6 === 0) buildInteg();
        if (total - remaining - lastReport > total / 50) { lastReport = total - remaining; self.postMessage({ progress: (total - remaining) / total }); }
      }
      self.postMessage({ done: true, px: px }, [px.buffer]);
    };
  };
  var workerUrl = URL.createObjectURL(new Blob(["(" + WORKER.toString() + ")()"], { type: "text/javascript" }));

  /* ---------- UI ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var input = $("er-input"), drop = $("er-drop"), stage = $("er-stage"), view = $("er-view"), maskC = $("er-mask"), msg = $("er-msg");
  var size = form.elements.brush, img = null, work = null, orig = null, history = [], painting = false, busy = false, fname = "photo", outType = "image/jpeg";
  var vctx = view.getContext("2d"), mctx = maskC.getContext("2d");
  var MAX = 2400;

  function load(f) {
    if (!f || !/^image\//.test(f.type)) { msg.innerHTML = "<span class='warn'>Please choose a JPG, PNG or WebP photo.</span>"; return; }
    fname = f.name.replace(/\.[^.]+$/, ""); outType = /png/.test(f.type) ? "image/png" : /webp/.test(f.type) ? "image/webp" : "image/jpeg";
    var u = URL.createObjectURL(f), i = new Image();
    i.onload = function () {
      var s = Math.min(1, MAX / Math.max(i.width, i.height)), w = Math.round(i.width * s), h = Math.round(i.height * s);
      work = document.createElement("canvas"); work.width = w; work.height = h; work.getContext("2d").drawImage(i, 0, 0, w, h);
      orig = document.createElement("canvas"); orig.width = w; orig.height = h; orig.getContext("2d").drawImage(work, 0, 0);
      [view, maskC].forEach(function (c) { c.width = w; c.height = h; });
      history = []; draw(); clearMask(); stage.hidden = false; $("er-tools").hidden = false; $("er-empty").hidden = true;
      msg.textContent = "Paint over what you want to remove, then press Erase."; URL.revokeObjectURL(u); buttons();
    };
    i.onerror = function () { msg.innerHTML = "<span class='warn'>This image couldn't be opened. Try a JPG or PNG.</span>"; };
    i.src = u;
  }
  function draw(showOrig) { vctx.drawImage(showOrig ? orig : work, 0, 0); }
  function clearMask() { mctx.clearRect(0, 0, maskC.width, maskC.height); hasMask = false; buttons(); }
  var hasMask = false;
  function buttons() { $("er-go").disabled = busy || !hasMask; $("er-undo").disabled = busy || !history.length; $("er-clear").disabled = busy || !hasMask; $("er-dl").disabled = busy || !history.length; }
  function pos(e) { var b = maskC.getBoundingClientRect(); return [(e.clientX - b.left) * maskC.width / b.width, (e.clientY - b.top) * maskC.height / b.height]; }
  function brushPx() { var b = maskC.getBoundingClientRect(); return +size.value * maskC.width / Math.max(1, b.width); }
  var last = null;
  function paint(p) {
    mctx.globalCompositeOperation = "source-over"; mctx.strokeStyle = mctx.fillStyle = "rgba(255,59,48,.55)"; mctx.lineCap = mctx.lineJoin = "round"; mctx.lineWidth = brushPx();
    mctx.beginPath(); if (last) { mctx.moveTo(last[0], last[1]); mctx.lineTo(p[0], p[1]); mctx.stroke(); } else { mctx.arc(p[0], p[1], brushPx() / 2, 0, 7); mctx.fill(); }
    last = p; hasMask = true;
  }
  maskC.addEventListener("pointerdown", function (e) { if (busy || !work) return; painting = true; last = null; maskC.setPointerCapture(e.pointerId); paint(pos(e)); e.preventDefault(); });
  maskC.addEventListener("pointermove", function (e) { if (painting) paint(pos(e)); });
  ["pointerup", "pointercancel"].forEach(function (t) { maskC.addEventListener(t, function () { painting = false; last = null; buttons(); }); });

  function erase() {
    if (!work || !hasMask || busy) return;
    var W = work.width, H = work.height, md = mctx.getImageData(0, 0, W, H).data;
    // bounding box of the painted area
    var minx = W, miny = H, maxx = -1, maxy = -1, holeCount = 0;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (md[(y * W + x) * 4 + 3] > 20) { holeCount++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    if (maxx < 0) return;
    var span = Math.max(maxx - minx, maxy - miny), r = span > 220 ? 6 : span > 90 ? 5 : 4, R = Math.min(160, Math.max(50, Math.round(span * 0.9)));
    var pad = R + 2 * r + 4, cx0 = Math.max(0, minx - pad), cy0 = Math.max(0, miny - pad), cx1 = Math.min(W, maxx + pad + 1), cy1 = Math.min(H, maxy + pad + 1);
    var cw = cx1 - cx0, ch = cy1 - cy0, crop = work.getContext("2d").getImageData(cx0, cy0, cw, ch);
    var mask = new Uint8Array(cw * ch), mdat = mctx.getImageData(cx0, cy0, cw, ch).data;
    // grow the painted area by 2px so edges of the object don't bleed back in
    for (var yy = 0; yy < ch; yy++) for (var xx = 0; xx < cw; xx++) {
      var on = false; for (var dy = -2; dy <= 2 && !on; dy++) for (var dx = -2; dx <= 2 && !on; dx++) { var X = xx + dx, Y = yy + dy; if (X >= 0 && Y >= 0 && X < cw && Y < ch && mdat[(Y * cw + X) * 4 + 3] > 20) on = true; }
      mask[yy * cw + xx] = on ? 1 : 0;
    }
    history.push(work.getContext("2d").getImageData(0, 0, W, H)); if (history.length > 12) history.shift();
    busy = true; buttons(); $("er-bar").hidden = false; $("er-bar").firstElementChild.style.width = "0%"; msg.textContent = "Erasing…";
    var px = new Uint8ClampedArray(crop.data), t0 = performance.now(), w = new Worker(workerUrl);
    w.onmessage = function (ev) {
      if (ev.data.progress != null) { $("er-bar").firstElementChild.style.width = Math.round(ev.data.progress * 100) + "%"; return; }
      var outData = new ImageData(new Uint8ClampedArray(ev.data.px), cw, ch);
      work.getContext("2d").putImageData(outData, cx0, cy0);
      w.terminate(); busy = false; clearMask(); draw(); $("er-bar").hidden = true;
      msg.textContent = "Done in " + ((performance.now() - t0) / 1000).toFixed(1) + " s. Paint more to keep going, or download. Hold “Compare” to see the original.";
      stage.setAttribute("data-erased", (+stage.getAttribute("data-erased") || 0) + 1); buttons();
    };
    w.onerror = function () { w.terminate(); busy = false; history.pop(); buttons(); $("er-bar").hidden = true; msg.innerHTML = "<span class='warn'>Sorry, that didn't work. Try a smaller area.</span>"; };
    w.postMessage({ w: cw, h: ch, px: px, mask: mask, r: r, R: R }, [px.buffer]);
  }
  $("er-go").addEventListener("click", erase);
  $("er-clear").addEventListener("click", clearMask);
  $("er-undo").addEventListener("click", function () { if (!history.length || busy) return; work.getContext("2d").putImageData(history.pop(), 0, 0); draw(); buttons(); });
  var cmp = $("er-compare");
  ["pointerdown"].forEach(function (t) { cmp.addEventListener(t, function () { if (orig) { draw(true); maskC.style.opacity = 0; } }); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) { cmp.addEventListener(t, function () { if (work) { draw(); maskC.style.opacity = ""; } }); });
  $("er-dl").addEventListener("click", function () {
    work.toBlob(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = fname + "-edited." + (outType === "image/png" ? "png" : outType === "image/webp" ? "webp" : "jpg"); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }, outType, 0.93);
  });
  $("er-new").addEventListener("click", function () { input.click(); });
  input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  window.addEventListener("paste", function (e) { var it = (e.clipboardData && e.clipboardData.files) || []; if (it[0]) load(it[0]); });
  size.addEventListener("input", function () { $("er-size").textContent = size.value + " px"; });
})();
