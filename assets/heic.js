/* etoolbox – HEIC/HEIF (iPhone photos) to JPG/PNG. Decoding uses heic-to (libheif, LGPL-3.0), loaded only on this page. */
(function () {
  "use strict";
  function kb(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
  function base(n) { return n.replace(/\.[^.]+$/, ""); }
  var libPromise = null;
  function lib() {
    if (window.HeicTo) return Promise.resolve(window.HeicTo);
    if (!libPromise) libPromise = new Promise(function (res, rej) { var s = document.createElement("script"); s.src = "/assets/vendor/heic/heic-to.js"; s.onload = function () { res(window.HeicTo); }; s.onerror = function () { libPromise = null; rej(new Error("Couldn't load the HEIC decoder.")); }; document.head.appendChild(s); });
    return libPromise;
  }
  function looksHeic(f) { return /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type); }

  function init(form) {
    var input = document.getElementById("heic-input"), drop = document.getElementById("drop"), msg = document.getElementById("heic-msg");
    var list = document.getElementById("heic-results"), allBtn = document.getElementById("dl-all"), outs = [];
    function q() { return +form.elements.quality.value / 100; }
    function showWhen() { var png = form.elements.format.value === "image/png"; document.getElementById("q-wrap").hidden = png; document.getElementById("q-val").textContent = form.elements.quality.value + "%"; }
    async function convert(files) {
      files = files.filter(looksHeic).slice(0, 50);
      if (!files.length) { msg.textContent = "Please choose .HEIC or .HEIF photos (the format iPhones use)."; return; }
      msg.textContent = "Loading the converter…"; list.innerHTML = ""; outs = []; allBtn.hidden = true;
      var HeicTo; try { HeicTo = await lib(); } catch (e) { msg.textContent = e.message; return; }
      var type = form.elements.format.value, ext = type === "image/png" ? "png" : "jpg";
      for (var i = 0; i < files.length; i++) {
        msg.textContent = "Converting " + (i + 1) + " of " + files.length + "…";
        var li = document.createElement("li"); list.appendChild(li);
        try {
          var blob = await HeicTo({ blob: files[i], type: type, quality: q() });
          var name = base(files[i].name) + "." + ext, url = URL.createObjectURL(blob);
          outs.push({ name: name, blob: blob });
          li.innerHTML = '<img alt="" class="heic-thumb"><span></span><span class="muted"></span><a>Download</a>';
          li.querySelector("img").src = url; li.children[1].textContent = name; li.children[2].textContent = kb(files[i].size) + " → " + kb(blob.size);
          var a = li.querySelector("a"); a.href = url; a.download = name;
        } catch (err) { li.innerHTML = "<span></span><span class='warn'>Couldn't convert this file.</span>"; li.firstChild.textContent = files[i].name; }
      }
      msg.textContent = outs.length ? "Done. " + outs.length + " photo" + (outs.length === 1 ? "" : "s") + " converted." : "";
      allBtn.hidden = outs.length < 2; list.setAttribute("data-done", outs.length);
      if (outs.length === 1) list.querySelector("a").click();
    }
    input.addEventListener("change", function () { convert(Array.from(input.files)); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { convert(Array.from(e.dataTransfer.files)); });
    allBtn.addEventListener("click", async function () {
      var z = {}; for (var i = 0; i < outs.length; i++) z[outs[i].name] = [new Uint8Array(await outs[i].blob.arrayBuffer()), { level: 0 }];
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([fflate.zipSync(z)], { type: "application/zip" })); a.download = "converted-photos.zip"; a.click();
    });
    form.addEventListener("input", showWhen); form.addEventListener("submit", function (e) { e.preventDefault(); });
    showWhen(); lib().catch(function () {}); // start loading the decoder early
  }
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-heic]"); if (f) init(f); });
})();
