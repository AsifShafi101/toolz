/* etoolbox website screenshot — calls our own /api/screenshot (Cloudflare Browser Rendering). */
(function () {
  "use strict";
  function init(form) {
    var out = document.getElementById("shot-out"), msg = document.getElementById("shot-msg"), btn = document.getElementById("shot-run"), dl = document.getElementById("shot-dl"), busy = false, last = null;
    form.addEventListener("submit", function (e) {
      e.preventDefault(); if (busy) return;
      var raw = form.elements.url.value.trim(); if (!raw) { msg.textContent = "Enter a website address."; return; }
      busy = true; btn.disabled = true; msg.textContent = ""; dl.hidden = true;
      out.innerHTML = '<div class="shot-loading"><span class="spinner"></span> Opening the page in a real browser… this takes 5–20 seconds.</div>';
      var q = "/api/screenshot?url=" + encodeURIComponent(raw) + "&device=" + form.elements.device.value + "&full=" + (form.elements.full.checked ? 1 : 0);
      fetch(q).then(function (r) {
        var ct = r.headers.get("content-type") || "";
        if (r.ok && /^image\//.test(ct)) return r.blob();
        return (/json/.test(ct) ? r.json() : Promise.resolve({})).then(function (j) { throw new Error(j.error || "Something went wrong (" + r.status + "). Please try again."); });
      }).then(function (blob) {
        if (last) URL.revokeObjectURL(last);
        last = URL.createObjectURL(blob);
        var host = raw.replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/[^a-z0-9.-]/gi, "");
        out.innerHTML = '<img id="shot-img" src="' + last + '" alt="Screenshot of ' + host + '">';
        dl.href = last; dl.download = "screenshot-" + host + "-" + form.elements.device.value + ".jpg"; dl.hidden = false;
      }).catch(function (err) { out.innerHTML = ""; msg.textContent = err.message; })
        .then(function () { busy = false; btn.disabled = false; });
    });
  }
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-shot]"); if (f) init(f); });
})();
