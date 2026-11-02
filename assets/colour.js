/* etoolbox colour picker & background remover (both run on your device). */
(function () {
  "use strict";

  /* ---------- Colour maths ---------- */
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function hexToRgb(h) { h = String(h).trim().replace(/^#/, ""); if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, "$&$&"); if (!/^[0-9a-f]{6}$/i.test(h)) return null; var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgbToHex(r) { return "#" + r.map(function (v) { return ("0" + clamp(Math.round(v), 0, 255).toString(16)).slice(-2); }).join(""); }
  function rgbToHsl(r) { var R = r[0] / 255, G = r[1] / 255, B = r[2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60; }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; }
  function hslToRgb(h) { var H = h[0] / 360, S = h[1] / 100, L = h[2] / 100; if (!S) return [L * 255, L * 255, L * 255].map(Math.round);
    var q = L < 0.5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q, f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(H + 1 / 3), f(H), f(H - 1 / 3)].map(function (v) { return Math.round(v * 255); }); }
  function rgbToCmyk(r) { var R = r[0] / 255, G = r[1] / 255, B = r[2] / 255, k = 1 - Math.max(R, G, B); if (k === 1) return [0, 0, 0, 100];
    return [(1 - R - k) / (1 - k), (1 - G - k) / (1 - k), (1 - B - k) / (1 - k), k].map(function (v) { return Math.round(v * 100); }); }
  function lum(r) { return r.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function parseAny(s) {
    s = String(s).trim();
    var rgb = hexToRgb(s); if (rgb) return rgb;
    var m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s); if (m) return [+m[1], +m[2], +m[3]].map(function (v) { return clamp(v, 0, 255); });
    m = /^hsla?\(\s*(\d+)[\s,]+(\d+)%?[\s,]+(\d+)%?/i.exec(s); if (m) return hslToRgb([+m[1] % 360, clamp(+m[2], 0, 100), clamp(+m[3], 0, 100)]);
    return null;
  }

  function initColour(form) {
    var picker = form.elements.picker, text = form.elements.code, fmt = document.getElementById("formats"), shades = document.getElementById("shades"), cr = document.getElementById("contrast");
    var imgCanvas = document.getElementById("pick-canvas"), cur = [255, 107, 53];
    function set(rgb, from) {
      cur = rgb; var hex = rgbToHex(rgb), hsl = rgbToHsl(rgb), cmyk = rgbToCmyk(rgb);
      if (from !== "picker") picker.value = hex;
      if (from !== "text") text.value = hex.toUpperCase();
      document.getElementById("swatch").style.background = hex;
      var rows = [["HEX", hex.toUpperCase()], ["RGB", "rgb(" + rgb.join(", ") + ")"], ["HSL", "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)"], ["CMYK", cmyk.join("%, ") + "%"]];
      fmt.innerHTML = rows.map(function (r) { return '<div class="calc-row"><span>' + r[0] + '</span><strong><button type="button" class="copyable" title="Copy">' + r[1] + "</button></strong></div>"; }).join("");
      fmt.setAttribute("data-hex", hex);
      var steps = [95, 85, 75, 65, 55, 45, 35, 25, 15];
      shades.innerHTML = steps.map(function (l) { var c = rgbToHex(hslToRgb([hsl[0], hsl[1], l])); return '<button type="button" class="shade" style="background:' + c + ";color:" + (l > 55 ? "#111" : "#fff") + '" data-hex="' + c + '">' + c.toUpperCase() + "</button>"; }).join("");
      var w = contrast(rgb, [255, 255, 255]), b = contrast(rgb, [0, 0, 0]);
      var badge = function (r) { return r >= 7 ? '<b class="good">AAA</b>' : r >= 4.5 ? '<b class="good">AA</b>' : r >= 3 ? '<b class="muted">AA large text only</b>' : '<b class="warn">Fail</b>'; };
      cr.innerHTML = '<div class="cr" style="background:' + hex + ';color:#fff">White text ' + w.toFixed(2) + ":1 " + badge(w) + '</div><div class="cr" style="background:' + hex + ';color:#000">Black text ' + b.toFixed(2) + ":1 " + badge(b) + "</div>";
      cr.setAttribute("data-white", w.toFixed(2));
    }
    picker.addEventListener("input", function () { set(hexToRgb(picker.value), "picker"); });
    text.addEventListener("input", function () { var r = parseAny(text.value); document.getElementById("code-msg").textContent = r ? "" : "Enter a HEX (#ff6b35), RGB or HSL colour."; if (r) set(r, "text"); });
    fmt.addEventListener("click", function (e) { var b = e.target.closest(".copyable"); if (b) navigator.clipboard.writeText(b.textContent).then(function () { var t = b.textContent; b.textContent = "Copied ✓"; setTimeout(function () { b.textContent = t; }, 900); }); });
    shades.addEventListener("click", function (e) { var b = e.target.closest(".shade"); if (b) set(hexToRgb(b.getAttribute("data-hex"))); });
    var eye = document.getElementById("eyedropper");
    if (window.EyeDropper) eye.addEventListener("click", function () { new EyeDropper().open().then(function (r) { set(hexToRgb(r.sRGBHex)); }).catch(function () {}); });
    else eye.hidden = true;
    document.getElementById("pick-input").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return; var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () { var s = Math.min(1, 900 / img.naturalWidth); imgCanvas.width = Math.round(img.naturalWidth * s); imgCanvas.height = Math.round(img.naturalHeight * s); imgCanvas.getContext("2d").drawImage(img, 0, 0, imgCanvas.width, imgCanvas.height); imgCanvas.hidden = false; URL.revokeObjectURL(url); };
      img.src = url;
    });
    imgCanvas.addEventListener("click", function (e) { var r = imgCanvas.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * imgCanvas.width / r.width), y = Math.floor((e.clientY - r.top) * imgCanvas.height / r.height); var d = imgCanvas.getContext("2d").getImageData(x, y, 1, 1).data; set([d[0], d[1], d[2]]); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    set(cur);
  }

  /* ---------- Background remover (colour-based flood fill) ---------- */
  function removeBg(img, o) {
    var W = img.width, H = img.height, src = img.data, out = new Uint8ClampedArray(src), n = W * H;
    var tol = o.tolerance, feather = o.feather, target = o.colour;
    function dist(i) { var p = i * 4, dr = src[p] - target[0], dg = src[p + 1] - target[1], db = src[p + 2] - target[2]; return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11) / 2.55; } // 0..~100
    var alphaFor = function (d) { return d <= tol ? 0 : d >= tol + feather ? 255 : Math.round((d - tol) / feather * 255); };
    if (o.mode === "all") { for (var i = 0; i < n; i++) out[i * 4 + 3] = Math.min(src[i * 4 + 3], alphaFor(dist(i))); }
    else {
      var seen = new Uint8Array(n), stack = [];
      var seeds = o.seeds && o.seeds.length ? o.seeds : null;
      if (seeds) seeds.forEach(function (s) { stack.push(s[1] * W + s[0]); });
      else { for (var x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); } for (var y = 0; y < H; y++) { stack.push(y * W); stack.push(y * W + W - 1); } }
      while (stack.length) {
        var k = stack.pop(); if (seen[k]) continue; seen[k] = 1;
        var d = dist(k); if (d > tol + feather) continue;
        out[k * 4 + 3] = Math.min(out[k * 4 + 3], alphaFor(d));
        if (d > tol) continue; // only spread through pixels clearly inside the background
        var px = k % W, py = (k - px) / W;
        if (px > 0) stack.push(k - 1); if (px < W - 1) stack.push(k + 1); if (py > 0) stack.push(k - W); if (py < H - 1) stack.push(k + W);
      }
    }
    return out;
  }
  function borderColour(img) {
    var W = img.width, H = img.height, d = img.data, rs = [], gs = [], bs = [], add = function (i) { rs.push(d[i * 4]); gs.push(d[i * 4 + 1]); bs.push(d[i * 4 + 2]); };
    for (var x = 0; x < W; x += 2) { add(x); add((H - 1) * W + x); } for (var y = 0; y < H; y += 2) { add(y * W); add(y * W + W - 1); }
    var med = function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; };
    return [med(rs), med(gs), med(bs)];
  }

  function initBg(form) {
    var input = document.getElementById("bg-input"), drop = document.getElementById("drop"), view = document.getElementById("bg-view"), actions = document.getElementById("bg-actions"), msg = document.getElementById("bg-msg");
    var srcData = null, name = "image", seeds = [], c = document.createElement("canvas");
    function opts() { var e = form.elements; return { tolerance: +e.tolerance.value, feather: +e.feather.value, mode: e.mode.value, colour: hexToRgb(e.bgcolour.value), fill: e.fill.value, fillcolour: e.fillcolour.value }; }
    function render() {
      document.getElementById("tol-val").textContent = form.elements.tolerance.value; document.getElementById("fea-val").textContent = form.elements.feather.value;
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) { var p = el.getAttribute("data-show-when").split("="); el.hidden = form.elements[p[0]].value !== p[1]; });
      if (!srcData) return;
      var o = opts(), ctx = view.getContext("2d");
      var alpha = removeBg(srcData, { tolerance: o.tolerance, feather: o.feather, mode: o.mode, colour: o.colour });
      seeds.forEach(function (sd) { // each clicked spot is removed using its own colour
        var extra = removeBg(srcData, { tolerance: o.tolerance, feather: o.feather, mode: "connected", colour: sd[2], seeds: [sd] });
        for (var j = 3; j < alpha.length; j += 4) if (extra[j] < alpha[j]) alpha[j] = extra[j];
      });
      view.width = srcData.width; view.height = srcData.height;
      var id = new ImageData(alpha, srcData.width, srcData.height);
      if (o.fill === "colour") { ctx.fillStyle = o.fillcolour; ctx.fillRect(0, 0, view.width, view.height); c.width = view.width; c.height = view.height; c.getContext("2d").putImageData(id, 0, 0); ctx.drawImage(c, 0, 0); }
      else { ctx.clearRect(0, 0, view.width, view.height); ctx.putImageData(id, 0, 0); }
      var cleared = 0; for (var i = 3; i < alpha.length; i += 4) if (alpha[i] < 128) cleared++;
      view.setAttribute("data-cleared", (cleared / (alpha.length / 4)).toFixed(3));
      actions.hidden = false;
    }
    function load(f) {
      if (!f || !/^image\//.test(f.type)) { msg.textContent = "Please choose a JPG, PNG or WebP image."; return; }
      msg.textContent = ""; name = f.name.replace(/\.[^.]+$/, ""); seeds = [];
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var s = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        var ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height); srcData = ctx.getImageData(0, 0, c.width, c.height); URL.revokeObjectURL(url);
        form.elements.bgcolour.value = rgbToHex(borderColour(srcData)); view.hidden = false; render();
      };
      img.onerror = function () { msg.textContent = "This image couldn't be opened."; };
      img.src = url;
    }
    view.addEventListener("click", function (e) {
      if (!srcData) return; var r = view.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * view.width / r.width), y = Math.floor((e.clientY - r.top) * view.height / r.height), p = (y * srcData.width + x) * 4;
      seeds.push([x, y, [srcData.data[p], srcData.data[p + 1], srcData.data[p + 2]]]);
      render(); msg.textContent = "Removed the area you clicked. Click more areas to remove them too, or use 'Start again'.";
    });
    document.getElementById("bg-reset").addEventListener("click", function () { seeds = []; if (srcData) form.elements.bgcolour.value = rgbToHex(borderColour(srcData)); msg.textContent = ""; render(); });
    document.getElementById("bg-dl").addEventListener("click", function () { var a = document.createElement("a"); a.href = view.toDataURL(opts().fill === "colour" ? "image/jpeg" : "image/png", 0.92); a.download = name + (opts().fill === "colour" ? "-new-background.jpg" : "-no-background.png"); a.click(); });
    input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
    var t; form.addEventListener("input", function () { clearTimeout(t); t = setTimeout(render, 60); }); form.addEventListener("change", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    render();
  }

  window.ETBColour = { hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, rgbToCmyk: rgbToCmyk, contrast: contrast, parseAny: parseAny, removeBg: removeBg, borderColour: borderColour };
  document.addEventListener("DOMContentLoaded", function () {
    var f; if ((f = document.querySelector("form[data-colour]"))) initColour(f);
    if ((f = document.querySelector("form[data-bg]"))) initBg(f);
  });
})();
