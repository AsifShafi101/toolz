/* etoolbox – visual PDF page organiser: delete, extract, reorder and rotate pages.
   Thumbnails come from pdf.js, the new PDF is built with pdf-lib. Nothing is uploaded. */
(function () {
  "use strict";
  var MAX_PAGES = 500;

  // Pure helper (tested): which original pages go into the output, in order, with rotation
  function plan(pages, mode) {
    return pages.filter(function (p) { return mode === "extract" ? p.sel : !p.del; }).map(function (p) { return { i: p.i, rot: p.rot }; });
  }

  function init(form) {
    var mode = form.getAttribute("data-mode") || "delete", grid = document.getElementById("pg-grid"), msg = document.getElementById("pg-msg");
    var input = document.getElementById("pg-input"), drop = document.getElementById("drop"), bar = document.getElementById("pg-bar"), runBtn = document.getElementById("pg-run");
    var bytes = null, pages = [], name = "document", dragFrom = null;

    function say(t, cls) { msg.innerHTML = t; msg.className = "hint " + (cls || ""); }
    function counts() {
      var n = pages.length, del = pages.filter(function (p) { return p.del; }).length, sel = pages.filter(function (p) { return p.sel; }).length;
      document.getElementById("pg-count").textContent = mode === "extract" ? sel + " of " + n + " pages selected" : mode === "delete" ? (n - del) + " of " + n + " pages kept" + (del ? " · " + del + " to delete" : "") : n + " pages";
      runBtn.disabled = mode === "extract" ? !sel : n - del < 1;
      form.setAttribute("data-count", String(plan(pages, mode).length));
    }
    function card(p, idx) {
      var li = document.createElement("li"); li.className = "pg" + (p.del ? " is-del" : "") + (p.sel ? " is-sel" : ""); li.draggable = true; li.dataset.idx = idx;
      li.innerHTML = '<button type="button" class="pg-thumb" aria-pressed="' + (mode === "extract" ? !!p.sel : !!p.del) + '" aria-label="Page ' + (p.i + 1) + (mode === "extract" ? ", select" : mode === "delete" ? ", mark to delete" : "") + '"></button>' +
        '<div class="pg-tools"><span class="pg-n">' + (p.i + 1) + '</span>' +
        '<button type="button" data-act="left" aria-label="Move page ' + (p.i + 1) + ' earlier">‹</button><button type="button" data-act="rot" aria-label="Rotate page ' + (p.i + 1) + '">⟳</button>' +
        '<button type="button" data-act="right" aria-label="Move page ' + (p.i + 1) + ' later">›</button>' + (mode !== "extract" ? '<button type="button" data-act="del" class="pg-x" aria-label="Delete page ' + (p.i + 1) + '">✕</button>' : "") + "</div>";
      var t = li.querySelector(".pg-thumb");
      if (p.img) { var im = p.img.cloneNode(); im.style.transform = "rotate(" + p.rot + "deg)"; t.appendChild(im); } else t.textContent = "…";
      return li;
    }
    function render() { grid.innerHTML = ""; pages.forEach(function (p, i) { grid.appendChild(card(p, i)); }); counts(); }
    function move(a, b) { if (b < 0 || b >= pages.length) return; var p = pages.splice(a, 1)[0]; pages.splice(b, 0, p); render(); var el = grid.children[b]; if (el) el.querySelector("[data-act=" + (b > a ? "right" : "left") + "]").focus(); }

    grid.addEventListener("click", function (e) {
      var li = e.target.closest(".pg"); if (!li) return; var i = +li.dataset.idx, p = pages[i], act = e.target.closest("[data-act]");
      act = act ? act.getAttribute("data-act") : (e.target.closest(".pg-thumb") ? "toggle" : null);
      if (act === "toggle") { if (mode === "extract") p.sel = !p.sel; else if (mode === "delete") p.del = !p.del; else return; render(); grid.children[i].querySelector(".pg-thumb").focus(); }
      else if (act === "del") { p.del = !p.del; render(); }
      else if (act === "rot") { p.rot = (p.rot + 90) % 360; render(); grid.children[i].querySelector("[data-act=rot]").focus(); }
      else if (act === "left") move(i, i - 1); else if (act === "right") move(i, i + 1);
    });
    grid.addEventListener("dragstart", function (e) { var li = e.target.closest(".pg"); if (!li) return; dragFrom = +li.dataset.idx; li.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(dragFrom)); } catch (x) {} });
    grid.addEventListener("dragover", function (e) { if (dragFrom === null) return; e.preventDefault(); var li = e.target.closest(".pg"); Array.prototype.forEach.call(grid.children, function (c) { c.classList.toggle("drop-here", c === li); }); });
    grid.addEventListener("drop", function (e) { if (dragFrom === null) return; e.preventDefault(); var li = e.target.closest(".pg"); var to = li ? +li.dataset.idx : pages.length - 1; var from = dragFrom; dragFrom = null; if (to !== from) move(from, to); else render(); });
    grid.addEventListener("dragend", function () { dragFrom = null; Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("drop-here", "dragging"); }); });

    document.getElementById("pg-all").addEventListener("click", function () { pages.forEach(function (p) { if (mode === "extract") p.sel = true; else p.del = false; }); render(); });
    document.getElementById("pg-none").addEventListener("click", function () { pages.forEach(function (p) { if (mode === "extract") p.sel = false; else p.del = false; p.rot = 0; }); pages.sort(function (a, b) { return a.i - b.i; }); render(); });
    var pick = document.getElementById("pg-pick");
    if (pick) pick.addEventListener("change", function () {
      try { var want = window.ETBPdf.parseRanges(pick.value, pages.length); var set = {}; want.forEach(function (n) { set[n] = 1; });
        pages.forEach(function (p) { if (mode === "extract") p.sel = !!set[p.i]; else p.del = !!set[p.i]; }); render(); say(""); }
      catch (err) { say(err.message, "warn"); }
    });

    function load(file) {
      if (!file || !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name))) { say("Please choose a PDF file.", "warn"); return; }
      name = file.name.replace(/\.pdf$/i, "") || "document"; say("Opening " + file.name.replace(/</g, "&lt;") + "…"); grid.innerHTML = ""; bar.hidden = true;
      file.arrayBuffer().then(function (buf) {
        bytes = new Uint8Array(buf);
        return window.ETBPdf.pdfjs().then(function (pdfjsLib) { return pdfjsLib.getDocument({ data: bytes.slice() }).promise; });
      }).then(function (doc) {
        if (doc.numPages > MAX_PAGES) throw new Error("This PDF has " + doc.numPages + " pages. We can organise up to " + MAX_PAGES + " pages at a time.");
        pages = []; for (var i = 0; i < doc.numPages; i++) pages.push({ i: i, rot: 0, del: false, sel: false, img: null });
        bar.hidden = false; render(); say("Loading page previews…");
        var k = 0;
        function next() {
          if (k >= doc.numPages) { say(mode === "extract" ? "Click the pages you want to keep, or type page numbers." : mode === "delete" ? "Click the pages you want to delete, or type page numbers." : "Drag pages into the order you want. On a phone, use the ‹ › buttons.");
            form.setAttribute("data-ready", "1"); return; }
          var n = k++;
          return doc.getPage(n + 1).then(function (pg) {
            var vp = pg.getViewport({ scale: 1 }), s = 150 / Math.max(vp.width, vp.height), v2 = pg.getViewport({ scale: s }), c = document.createElement("canvas");
            c.width = Math.ceil(v2.width); c.height = Math.ceil(v2.height);
            return pg.render({ canvasContext: c.getContext("2d"), viewport: v2 }).promise.then(function () {
              var im = new Image(); im.src = c.toDataURL("image/jpeg", 0.7); im.alt = ""; var p = pages.filter(function (q) { return q.i === n; })[0]; p.img = im;
              var li = grid.querySelector('.pg[data-idx="' + pages.indexOf(p) + '"] .pg-thumb'); if (li) { li.textContent = ""; var c2 = im.cloneNode(); c2.style.transform = "rotate(" + p.rot + "deg)"; li.appendChild(c2); }
            });
          }).then(next);
        }
        return next();
      }).catch(function (e) { say(/password|encrypt/i.test(e.message || e.name) ? "This PDF is password-protected. Unlock it first with our Unlock PDF tool." : (e.message || "This file couldn't be opened."), "warn"); });
    }

    runBtn.addEventListener("click", function () {
      var out = plan(pages, mode); if (!out.length) return;
      runBtn.disabled = true; say("Building your PDF…");
      PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false }).then(function (src) {
        return PDFLib.PDFDocument.create().then(function (doc) {
          return doc.copyPages(src, out.map(function (o) { return o.i; })).then(function (copied) {
            copied.forEach(function (pg, j) { if (out[j].rot) pg.setRotation(PDFLib.degrees((pg.getRotation().angle + out[j].rot) % 360)); doc.addPage(pg); });
            return doc.save();
          });
        });
      }).then(function (b) {
        var suffix = mode === "extract" ? "-extracted" : mode === "delete" ? "-pages-removed" : "-reordered", blob = new Blob([b], { type: "application/pdf" });
        var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name + suffix + ".pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        say("<strong>Done.</strong> Your new PDF has " + out.length + " page" + (out.length === 1 ? "" : "s") + ".", "good"); form.setAttribute("data-done", String(out.length));
        if (window.ETBUse) window.ETBUse();
      }).catch(function (e) { say(/encrypt/i.test(e.message) ? "This PDF is password-protected. Unlock it first." : "Sorry, this PDF couldn't be saved: " + e.message, "warn"); })
        .then(function () { runBtn.disabled = false; counts(); });
    });
    input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  window.ETBPages = { plan: plan };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-pages]"); if (f) init(f); });
})();
