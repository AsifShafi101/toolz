/* etoolbox – PDF to text, with OCR for scanned pages (Tesseract, English, all in the browser). */
(function () {
  "use strict";
  var MAX_PAGES = 300;

  // Turn pdf.js text items into lines (pure, tested)
  function itemsToText(items) {
    var lines = [], cur = "", lastY = null, lastEnd = null;
    items.forEach(function (it) {
      if (typeof it.str !== "string") return;
      var y = it.transform ? Math.round(it.transform[5]) : null, x = it.transform ? it.transform[4] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) { lines.push(cur); cur = ""; lastEnd = null; }
      if (cur && lastEnd !== null && x !== null && x - lastEnd > 1.5 && !/\s$/.test(cur) && !/^\s/.test(it.str)) cur += " ";
      cur += it.str; if (y !== null) lastY = y; if (x !== null && it.width) lastEnd = x + it.width;
      if (it.hasEOL) { lines.push(cur); cur = ""; lastY = null; lastEnd = null; }
    });
    if (cur) lines.push(cur);
    return lines.map(function (l) { return l.replace(/[ \t]+$/g, ""); }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function init(form) {
    var E = form.elements, out = document.getElementById("pt-out"), msg = document.getElementById("pt-msg"), prog = document.getElementById("pt-progress");
    var input = document.getElementById("pt-input"), drop = document.getElementById("drop"), name = "document", worker = null, running = false;
    function say(t, cls) { msg.innerHTML = t; msg.className = "hint " + (cls || ""); }
    function getWorker() {
      if (worker) return Promise.resolve(worker);
      return Tesseract.createWorker("eng", 1, { workerPath: "/assets/vendor/ocr/worker.min.js", corePath: "/assets/vendor/ocr/", langPath: "/assets/vendor/ocr/", gzip: true })
        .then(function (w) { worker = w; return w; });
    }

    function run(file) {
      if (running) return;
      if (!file || !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name))) { say("Please choose a PDF file.", "warn"); return; }
      running = true; name = file.name.replace(/\.pdf$/i, "") || "document"; out.value = ""; document.getElementById("pt-actions").hidden = true; prog.hidden = false; prog.value = 0;
      var ocrMode = E.ocr.value, sep = E.sep.checked, parts = [], ocrPages = 0;
      file.arrayBuffer().then(function (buf) {
        return window.ETBPdf.pdfjs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(buf) }).promise; });
      }).then(function (doc) {
        var n = Math.min(doc.numPages, MAX_PAGES), i = 0;
        function next() {
          if (i >= n) return;
          var num = ++i; say("Reading page " + num + " of " + n + "…"); prog.value = Math.round((num - 1) / n * 100);
          return doc.getPage(num).then(function (pg) {
            return pg.getTextContent().then(function (tc) {
              var text = itemsToText(tc.items);
              if (ocrMode === "always" || (ocrMode === "auto" && text.replace(/\s/g, "").length < 20)) {
                ocrPages++; say("Page " + num + " looks scanned. Reading it with OCR (this can take a few seconds per page)…");
                var vp = pg.getViewport({ scale: 1 }), s = Math.min(3, 2400 / Math.max(vp.width, vp.height)), v2 = pg.getViewport({ scale: s }), c = document.createElement("canvas");
                c.width = Math.ceil(v2.width); c.height = Math.ceil(v2.height); var cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height);
                return pg.render({ canvasContext: cx, viewport: v2 }).promise.then(getWorker).then(function (w) { return w.recognize(c); }).then(function (r) { return r.data.text.replace(/\n{3,}/g, "\n\n").trim(); });
              }
              return text;
            });
          }).then(function (t) { parts.push(sep ? "--- Page " + num + " ---\n" + t : t); return next(); });
        }
        return next().then(function () {
          out.value = parts.join(sep ? "\n\n" : "\n\n").trim();
          var words = (out.value.match(/\S+/g) || []).length; prog.value = 100; prog.hidden = true;
          document.getElementById("pt-actions").hidden = false; form.setAttribute("data-done", String(words));
          say(words ? "<strong>Done.</strong> " + n + " page" + (n === 1 ? "" : "s") + " · " + words.toLocaleString("en-GB") + " words" + (ocrPages ? " · " + ocrPages + " page" + (ocrPages === 1 ? "" : "s") + " read with OCR" : "") + (doc.numPages > MAX_PAGES ? " · only the first " + MAX_PAGES + " pages were read" : "") + "." :
            "No text found. If this is a scanned PDF, choose <strong>Always use OCR</strong> and try again.", words ? "good" : "warn");
          if (window.ETBUse) window.ETBUse();
        });
      }).catch(function (e) { prog.hidden = true; say(/password|encrypt/i.test((e && (e.message || e.name)) || "") ? "This PDF is password-protected. Unlock it first with our Unlock PDF tool." : "Sorry, this PDF couldn't be read: " + ((e && e.message) || "unknown error") + ".", "warn"); })
        .then(function () { running = false; });
    }

    document.getElementById("pt-copy").addEventListener("click", function () {
      var b = this; (navigator.clipboard ? navigator.clipboard.writeText(out.value) : Promise.reject()).then(function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy text"; }, 1500); }, function () { out.select(); document.execCommand("copy"); });
    });
    document.getElementById("pt-dl").addEventListener("click", function () {
      var a = document.createElement("a"), u = URL.createObjectURL(new Blob([out.value], { type: "text/plain;charset=utf-8" })); a.href = u; a.download = name + ".txt"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    });
    input.addEventListener("change", function () { run(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { run(e.dataTransfer.files[0]); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  window.ETBPdfText = { itemsToText: itemsToText };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-pdftext]"); if (f) init(f); });
})();
