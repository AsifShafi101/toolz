/* etoolbox – background remover.
   AI mode: ISNet general-use (DIS, Apache-2.0) quantised to int8 and run in the browser with ONNX Runtime Web.
   The model is downloaded once from etoolbox (about 46 MB) and cached; the image itself never leaves the device.
   Plain-colour mode: flood fill from colour.js (ETBColour.removeBg). */
(function () {
  "use strict";
  var MODEL_PARTS = ["/assets/models/isnet-q8.part0", "/assets/models/isnet-q8.part1"];
  var MODEL_BYTES = 46360717, MODEL_CACHE = "etb-models-v1", SIZE = 1024, MAX_SIDE = 2500;
  var sessionPromise = null;

  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("Couldn't load " + src)); }; document.head.appendChild(s); });
  }

  async function fetchModel(onProgress) {
    var cache = null;
    try { cache = await caches.open(MODEL_CACHE); } catch (e) { cache = null; }
    var buf = new Uint8Array(MODEL_BYTES), off = 0;
    for (var i = 0; i < MODEL_PARTS.length; i++) {
      var url = MODEL_PARTS[i], resp = null;
      if (cache) { try { resp = await cache.match(url); } catch (e) { resp = null; } }
      var fromCache = !!resp;
      if (!resp) {
        resp = await fetch(url);
        if (!resp.ok) throw new Error("Model download failed (" + resp.status + ")");
      }
      var stored = fromCache ? null : resp.clone();
      var reader = resp.body.getReader();
      for (;;) {
        var r = await reader.read(); if (r.done) break;
        if (off + r.value.length > buf.length) throw new Error("Unexpected model size");
        buf.set(r.value, off); off += r.value.length; onProgress && onProgress(off / MODEL_BYTES);
      }
      if (stored && cache) { try { await cache.put(url, stored); } catch (e) { /* storage full or private mode */ } }
    }
    if (off !== MODEL_BYTES) throw new Error("Model download was incomplete. Please try again.");
    return buf;
  }

  function getSession(onProgress) {
    if (sessionPromise) return sessionPromise;
    sessionPromise = (async function () {
      if (!window.ort) await loadScript("/assets/vendor/ort/ort.wasm.min.js");
      var ort = window.ort;
      ort.env.wasm.wasmPaths = "/assets/vendor/ort/";
      ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
      ort.env.wasm.proxy = true; // run in a worker so the page stays responsive
      var bytes = await fetchModel(onProgress);
      return ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    })();
    sessionPromise.catch(function () { sessionPromise = null; });
    return sessionPromise;
  }

  /* Returns a Float32Array (SIZE*SIZE) of foreground probability 0..1 for the given canvas. */
  async function predict(srcCanvas, onProgress) {
    var session = await getSession(onProgress);
    var c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, SIZE, SIZE); ctx.drawImage(srcCanvas, 0, 0, SIZE, SIZE);
    var d = ctx.getImageData(0, 0, SIZE, SIZE).data, n = SIZE * SIZE, x = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) { x[i] = d[i * 4] / 255 - 0.5; x[n + i] = d[i * 4 + 1] / 255 - 0.5; x[2 * n + i] = d[i * 4 + 2] / 255 - 0.5; }
    var feeds = {}; feeds[session.inputNames[0]] = new window.ort.Tensor("float32", x, [1, 3, SIZE, SIZE]);
    var out = await session.run(feeds), y = out[session.outputNames[0]].data;
    var mn = Infinity, mx = -Infinity, k;
    for (k = 0; k < n; k++) { if (y[k] < mn) mn = y[k]; if (y[k] > mx) mx = y[k]; }
    var p = new Float32Array(n), r = mx - mn || 1;
    for (k = 0; k < n; k++) p[k] = (y[k] - mn) / r;
    return dropSpecks(p);
  }

  /* Remove small islands (stray specks) that aren't part of the main subject. */
  function dropSpecks(p) {
    var n = SIZE * SIZE, lab = new Int32Array(n), sizes = [0], stack = new Int32Array(n), i;
    for (i = 0; i < n; i++) {
      if (lab[i] || p[i] < 0.5) continue;
      var id = sizes.length, top = 0, count = 0; stack[top++] = i; lab[i] = id;
      while (top) {
        var k = stack[--top], x = k % SIZE; count++;
        var nb = [x > 0 ? k - 1 : -1, x < SIZE - 1 ? k + 1 : -1, k - SIZE, k + SIZE];
        for (var j = 0; j < 4; j++) { var q = nb[j]; if (q >= 0 && q < n && !lab[q] && p[q] >= 0.5) { lab[q] = id; stack[top++] = q; } }
      }
      sizes.push(count);
    }
    var largest = 0; for (i = 1; i < sizes.length; i++) if (sizes[i] > largest) largest = sizes[i];
    var minKeep = Math.max(n * 0.0015, largest * 0.03);
    for (i = 0; i < n; i++) if (lab[i] && sizes[lab[i]] < minKeep) p[i] = 0;
    return p;
  }

  /* Scale the SIZE×SIZE probability map to W×H alpha (0..255), applying an edge-cleanup curve. */
  function maskToAlpha(prob, W, H, cleanup) {
    var lo = cleanup / 100 * 0.45, hi = 1 - cleanup / 100 * 0.45, n = SIZE * SIZE;
    var small = new ImageData(SIZE, SIZE), sd = small.data;
    for (var i = 0; i < n; i++) { var a = (prob[i] - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a; sd[i * 4 + 3] = Math.round(a * 255); }
    var c1 = document.createElement("canvas"); c1.width = SIZE; c1.height = SIZE; c1.getContext("2d").putImageData(small, 0, 0);
    var c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
    var x2 = c2.getContext("2d", { willReadFrequently: true }); x2.imageSmoothingEnabled = true; x2.imageSmoothingQuality = "high"; x2.drawImage(c1, 0, 0, W, H);
    var big = x2.getImageData(0, 0, W, H).data, alpha = new Uint8ClampedArray(W * H);
    for (var j = 0; j < W * H; j++) alpha[j] = big[j * 4 + 3];
    return alpha;
  }

  function hexToRgb(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h); var v = m ? parseInt(m[1], 16) : 0xffffff; return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
  function rgbToHex(c) { return "#" + c.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }

  function init(form) {
    var C = window.ETBColour;
    var input = document.getElementById("bg-input"), drop = document.getElementById("drop"), view = document.getElementById("bg-view");
    var actions = document.getElementById("bg-actions"), msg = document.getElementById("bg-msg"), bar = document.getElementById("bg-progress");
    var src = document.createElement("canvas"), srcData = null, name = "image", seeds = [], aiAlpha = null, aiFor = null, busy = false, token = 0;

    function opts() { var e = form.elements; return { method: e.method.value, tolerance: +e.tolerance.value, feather: +e.feather.value, mode: e.mode.value, colour: hexToRgb(e.bgcolour.value), cleanup: +e.cleanup.value, fill: e.fill.value, fillcolour: e.fillcolour.value }; }
    function status(t, pct) {
      msg.textContent = t || "";
      if (pct == null) bar.hidden = true; else { bar.hidden = false; bar.value = pct; }
    }
    function showWhen() {
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) {
        var p = el.getAttribute("data-show-when").split("="), vals = p[1].split("|"); el.hidden = vals.indexOf(form.elements[p[0]].value) < 0;
      });
      document.getElementById("tol-val").textContent = form.elements.tolerance.value;
      document.getElementById("fea-val").textContent = form.elements.feather.value;
      document.getElementById("cln-val").textContent = form.elements.cleanup.value;
    }

    var aiJob = null;
    async function ensureAi() {
      if (aiAlpha && aiFor === srcData) return true;
      var forData = srcData;
      if (!aiJob || aiJob.for !== forData) {
        busy = true; form.setAttribute("aria-busy", "true");
        var cached = false; try { var ch = await caches.open(MODEL_CACHE); cached = !!(await ch.match(MODEL_PARTS[1])); } catch (e) { cached = false; }
        if (forData !== srcData) return false;
        status(sessionPromise || cached ? "Finding the subject… (a few seconds)" : "Downloading the AI model (about 46 MB, one time only)…", sessionPromise || cached ? null : 0);
        var t0 = performance.now();
        aiJob = { for: forData, t0: t0, promise: predict(src, function (f) { if (aiJob && aiJob.for === srcData) status(f < 1 ? "Downloading the AI model (" + Math.round(f * 46) + " of 46 MB, one time only)…" : "Finding the subject… (a few seconds)", f < 1 ? Math.round(f * 100) : null); }) };
      }
      var job = aiJob;
      try {
        var prob = await job.promise;
        if (job.for !== srcData) return false;
        if (!(aiAlpha && aiFor === srcData)) {
          view.setAttribute("data-ai-ms", Math.round(performance.now() - job.t0));
          view._prob = prob;
          aiAlpha = maskToAlpha(prob, srcData.width, srcData.height, opts().cleanup); aiAlpha._cleanup = opts().cleanup; aiFor = srcData;
          status("Done. Click any leftover background in the preview to remove it too.");
        }
        return true;
      } catch (err) {
        if (aiJob === job) aiJob = null;
        if (job.for === srcData) status("The AI remover couldn't run on this device (" + (err && err.message || err) + "). Try 'Plain colour' instead.");
        return false;
      } finally { if (job.for === srcData) { busy = false; form.removeAttribute("aria-busy"); } }
    }

    async function render() {
      showWhen();
      if (!srcData) return;
      var o = opts(), W = srcData.width, H = srcData.height, n = W * H, alpha = new Uint8ClampedArray(n), i;
      if (o.method === "ai") {
        if (!(await ensureAi()) || opts().method !== "ai") return;
        o = opts();
        if (aiAlpha._cleanup !== o.cleanup) { aiAlpha = maskToAlpha(view._prob, W, H, o.cleanup); aiAlpha._cleanup = o.cleanup; }
        alpha.set(aiAlpha);
      } else {
        if (!seeds.length) status("");
        var rgba = C.removeBg(srcData, { tolerance: o.tolerance, feather: o.feather, mode: o.mode, colour: o.colour });
        for (i = 0; i < n; i++) alpha[i] = rgba[i * 4 + 3];
      }
      seeds.forEach(function (sd) {
        var extra = C.removeBg(srcData, { tolerance: Math.max(o.tolerance, 10), feather: o.feather, mode: "connected", colour: sd[2], seeds: [sd] });
        for (var j = 0; j < n; j++) if (extra[j * 4 + 3] < alpha[j]) alpha[j] = extra[j * 4 + 3];
      });
      var cut = new ImageData(new Uint8ClampedArray(srcData.data), W, H), cd = cut.data, cleared = 0;
      for (i = 0; i < n; i++) { cd[i * 4 + 3] = Math.min(cd[i * 4 + 3], alpha[i]); if (alpha[i] < 128) cleared++; }
      var cc = document.createElement("canvas"); cc.width = W; cc.height = H; cc.getContext("2d").putImageData(cut, 0, 0);
      view.width = W; view.height = H; var ctx = view.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      if (o.fill === "colour") { ctx.fillStyle = o.fillcolour; ctx.fillRect(0, 0, W, H); }
      else if (o.fill === "blur") { // soft blur by shrinking and re-enlarging (no dark edges, works in every browser)
        var sw = Math.max(8, Math.round(W / 28)), sh = Math.max(8, Math.round(H / 28)), m1 = document.createElement("canvas"), m2 = document.createElement("canvas");
        m1.width = sw * 3; m1.height = sh * 3; m2.width = sw; m2.height = sh;
        var c1 = m1.getContext("2d"), c2 = m2.getContext("2d"); c1.imageSmoothingQuality = c2.imageSmoothingQuality = ctx.imageSmoothingQuality = "high";
        c1.drawImage(src, 0, 0, m1.width, m1.height); c2.drawImage(m1, 0, 0, sw, sh); ctx.drawImage(m2, 0, 0, W, H); }
      ctx.drawImage(cc, 0, 0);
      view.hidden = false; actions.hidden = false; document.getElementById("bg-reset").hidden = !seeds.length;
      view.setAttribute("data-cleared", (cleared / n).toFixed(3));
      view.setAttribute("data-ready", "1");
    }

    function load(f) {
      if (!f || !/^image\//.test(f.type)) { status("Please choose a JPG, PNG or WebP image."); return; }
      name = f.name.replace(/\.[^.]+$/, ""); seeds = []; aiAlpha = null; view.removeAttribute("data-ready");
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var s = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        src.width = Math.round(img.naturalWidth * s); src.height = Math.round(img.naturalHeight * s);
        var ctx = src.getContext("2d", { willReadFrequently: true }); ctx.clearRect(0, 0, src.width, src.height); ctx.drawImage(img, 0, 0, src.width, src.height);
        srcData = ctx.getImageData(0, 0, src.width, src.height); URL.revokeObjectURL(url);
        form.elements.bgcolour.value = rgbToHex(C.borderColour(srcData));
        render();
      };
      img.onerror = function () { status("This image couldn't be opened."); };
      img.src = url;
    }

    view.addEventListener("click", function (e) {
      if (!srcData || busy) return;
      var r = view.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * view.width / r.width), y = Math.floor((e.clientY - r.top) * view.height / r.height), p = (y * srcData.width + x) * 4;
      seeds.push([x, y, [srcData.data[p], srcData.data[p + 1], srcData.data[p + 2]]]);
      render().then(function () { status("Removed the area you clicked. Click more areas, or use 'Undo clicks'."); });
    });
    document.getElementById("bg-reset").addEventListener("click", function () { seeds = []; status(""); render(); });
    var orig = document.getElementById("bg-orig");
    function showOrig(on) { if (!srcData) return; if (on) { var ctx = view.getContext("2d"); ctx.clearRect(0, 0, view.width, view.height); ctx.drawImage(src, 0, 0); } else render(); }
    orig.addEventListener("pointerdown", function () { showOrig(true); });
    ["pointerup", "pointerleave"].forEach(function (ev) { orig.addEventListener(ev, function (e) { if (e.type === "pointerleave" && !e.buttons) return; showOrig(false); }); });
    orig.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); showOrig(true); } });
    orig.addEventListener("keyup", function () { showOrig(false); });
    document.getElementById("bg-dl").addEventListener("click", function () {
      var jpg = opts().fill !== "none", a = document.createElement("a");
      a.href = view.toDataURL(jpg ? "image/jpeg" : "image/png", 0.92);
      a.download = name + (jpg ? "-new-background.jpg" : "-no-background.png"); a.click();
    });
    input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
    document.addEventListener("paste", function (e) { var it = e.clipboardData && Array.prototype.find.call(e.clipboardData.files || [], function (f) { return /^image\//.test(f.type); }); if (it) load(it); });
    var t; form.addEventListener("input", function (e) { if (e.target.name === "method") return; clearTimeout(t); t = setTimeout(render, 80); });
    form.addEventListener("change", function (e) { if (e.target.name === "method") { seeds = []; render(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    showWhen();
  }

  window.ETBBgAI = { predict: predict, getSession: getSession };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-bgai]"); if (f) init(f); });
})();
