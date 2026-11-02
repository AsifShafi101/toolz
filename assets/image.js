/* etoolbox image tools — compress, resize, convert. Images never leave the browser. */
(function () {
  "use strict";

  var TYPES = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

  function kb(n) { return n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
  function baseName(n) { return n.replace(/\.[^.]+$/, ""); }

  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("This file couldn't be opened. Try a JPG, PNG or WebP image.")); };
      img.src = url;
    });
  }

  // Pure size maths, exported for tests
  function targetSize(w, h, o) {
    if (o.resizeBy === "percent") { var p = Math.max(1, Math.min(400, o.percent || 100)) / 100; return [Math.max(1, Math.round(w * p)), Math.max(1, Math.round(h * p))]; }
    var mw = o.width || 0, mh = o.height || 0;
    if (!mw && !mh) return [w, h];
    if (!o.keepRatio && mw && mh) return [mw, mh];
    var s = Math.min(mw ? mw / w : Infinity, mh ? mh / h : Infinity);
    if (o.noUpscale && s > 1) s = 1;
    return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
  }

  function process(file, o) {
    return loadImage(file).then(function (L) {
      var w = L.img.naturalWidth, h = L.img.naturalHeight, sz = targetSize(w, h, o);
      var outType = o.format === "same" ? (TYPES[file.type.split("/")[1]] || "image/jpeg") : TYPES[o.format];
      if (o.mode === "compress" && o.format === "same" && file.type === "image/png") outType = "image/jpeg"; // PNG photos shrink far more as JPG
      var c = document.createElement("canvas"); c.width = sz[0]; c.height = sz[1];
      var ctx = c.getContext("2d");
      if (outType === "image/jpeg") { ctx.fillStyle = o.bg || "#ffffff"; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(L.img, 0, 0, sz[0], sz[1]);
      URL.revokeObjectURL(L.url);
      return new Promise(function (res) {
        c.toBlob(function (blob) {
          var keptOriginal = false;
          if (o.mode === "compress" && blob && blob.size >= file.size && sz[0] === w && sz[1] === h && outType === file.type) { blob = file; keptOriginal = true; }
          res({ blob: blob, type: outType, w: sz[0], h: sz[1], ow: w, oh: h, keptOriginal: keptOriginal });
        }, outType, outType === "image/png" ? undefined : (o.quality || 80) / 100);
      });
    });
  }

  function opts(form) {
    var e = form.elements;
    return {
      mode: form.getAttribute("data-img"),
      format: e.format ? e.format.value : "same",
      quality: e.quality ? parseInt(e.quality.value, 10) : 80,
      resizeBy: e.resizeby ? e.resizeby.value : "pixels",
      width: e.width ? parseInt(e.width.value, 10) || 0 : 0,
      height: e.height ? parseInt(e.height.value, 10) || 0 : 0,
      percent: e.percent ? parseInt(e.percent.value, 10) || 100 : 100,
      keepRatio: e.keepratio ? e.keepratio.checked : true,
      noUpscale: form.getAttribute("data-img") === "compress",
      bg: e.bg ? e.bg.value : "#ffffff"
    };
  }

  function init(form) {
    var input = document.getElementById("img-input"), drop = document.getElementById("drop"), list = document.getElementById("img-results");
    var allBtn = document.getElementById("dl-all"), files = [], results = [];

    function syncUi() {
      var o = opts(form);
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) {
        var p = el.getAttribute("data-show-when").split("="), val = p[0] === "format" ? o.format : p[0] === "resizeby" ? o.resizeBy : "";
        el.hidden = p[1].split("|").indexOf(val) < 0;
      });
      var q = document.getElementById("q-val"); if (q) q.textContent = o.quality + "%";
    }

    function run() {
      syncUi();
      if (!files.length) return;
      var o = opts(form), token = {}; run.token = token;
      list.innerHTML = ""; results = []; allBtn.hidden = true;
      var chain = Promise.resolve();
      files.forEach(function (file, i) {
        var li = document.createElement("li"); li.className = "img-item"; li.innerHTML = '<span class="muted">Processing ' + file.name + "…</span>"; list.appendChild(li);
        chain = chain.then(function () {
          return process(file, o).then(function (r) {
            if (run.token !== token) return;
            var name = baseName(file.name) + (o.mode === "resize" ? "-" + r.w + "x" + r.h : o.mode === "compress" ? "-compressed" : "") + "." + EXT[r.type];
            var url = URL.createObjectURL(r.blob), saved = file.size ? Math.round((1 - r.blob.size / file.size) * 100) : 0;
            results[i] = { url: url, name: name };
            li.innerHTML = '<img src="' + url + '" alt="">' +
              '<div class="img-info"><strong>' + name.replace(/</g, "&lt;") + '</strong><span class="muted">' + r.ow + "×" + r.oh + " → " + r.w + "×" + r.h + " · " + kb(file.size) + " → " + kb(r.blob.size) +
              (r.keptOriginal ? " · already well compressed, original kept" : saved > 0 ? ' · <b class="good">' + saved + "% smaller</b>" : saved < 0 ? " · " + -saved + "% larger" : "") + "</span></div>" +
              '<a class="btn small" download="' + name.replace(/"/g, "") + '" href="' + url + '">Download</a>';
            li.setAttribute("data-out", JSON.stringify({ w: r.w, h: r.h, type: r.type, size: r.blob.size, in: file.size }));
          }).catch(function (err) { li.innerHTML = '<span class="warn">' + file.name + ": " + err.message + "</span>"; li.setAttribute("data-error", "1"); });
        });
      });
      chain.then(function () { if (run.token === token && results.filter(Boolean).length > 1) allBtn.hidden = false; list.setAttribute("data-done", files.length); });
    }

    function take(fileList) {
      files = Array.prototype.filter.call(fileList, function (f) { return /^image\//.test(f.type); }).slice(0, 30);
      if (!files.length) { list.innerHTML = '<li class="warn">Please choose JPG, PNG or WebP images.</li>'; return; }
      run();
    }

    input.addEventListener("change", function () { take(input.files); });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { take(e.dataTransfer.files); });
    var t; form.addEventListener("input", function () { syncUi(); clearTimeout(t); t = setTimeout(run, 250); });
    form.addEventListener("change", function () { syncUi(); clearTimeout(t); t = setTimeout(run, 50); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    allBtn.addEventListener("click", function () {
      results.filter(Boolean).forEach(function (r, i) { setTimeout(function () { var a = document.createElement("a"); a.href = r.url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove(); }, i * 300); });
    });
    syncUi();
  }

  window.ETBImage = { targetSize: targetSize };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-img]"); if (f) init(f); });
})();
