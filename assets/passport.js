/* etoolbox – passport & visa photo maker. Position and size the face inside the official frame,
   optionally replace the background (on-device AI, bgremove.js), then download a digital photo
   or a 6×4 inch print sheet. Nothing is uploaded. */
(function () {
  "use strict";
  // w,h: photo size in mm; head: [min,max] chin-to-crown in mm; px: output pixels per mm
  var P = {
    uk: { name: "UK passport", w: 35, h: 45, head: [29, 34], bg: "#e8e8e6", tips: "Plain cream or light grey background, no shadows. Head 29–34 mm from chin to crown. Neutral expression, mouth closed, eyes open. No glasses unless you can't remove them. Online applications need at least 600 × 750 pixels." },
    ukvisa: { name: "UK visa / BRP", w: 35, h: 45, head: [29, 34], bg: "#e8e8e6", tips: "Same rules as a UK passport photo: plain light background, head 29–34 mm, neutral expression, no glasses." },
    ie: { name: "Ireland passport", w: 35, h: 45, head: [32, 36], bg: "#f2f2f2", tips: "Plain white or light grey background. Head 32–36 mm from chin to crown. Neutral expression." },
    schengen: { name: "Schengen / EU visa", w: 35, h: 45, head: [32, 36], bg: "#f2f2f2", tips: "Light, plain background. Face 32–36 mm from chin to crown (70–80% of the photo). Neutral expression." },
    au: { name: "Australia passport", w: 35, h: 45, head: [32, 36], bg: "#f2f2f2", tips: "Plain white or light grey background. Head 32–36 mm from chin to crown." },
    pk: { name: "Pakistan passport / NICOP", w: 35, h: 45, head: [30, 35], bg: "#ffffff", tips: "Plain white background. Face centred, ears visible, neutral expression. Check NADRA's latest rules before you apply." },
    us: { name: "US passport / visa (2×2 in)", w: 51, h: 51, head: [25, 35], bg: "#ffffff", tips: "White or off-white background. Head 25–35 mm (1–1⅜ in) from chin to crown. No glasses." },
    in: { name: "India visa / OCI (2×2 in)", w: 51, h: 51, head: [25, 35], bg: "#ffffff", tips: "Plain white or light background. Head 25–35 mm. Full face, front view, eyes open." },
    ca: { name: "Canada passport", w: 50, h: 70, head: [31, 36], bg: "#ffffff", tips: "Plain white or light background. Head 31–36 mm from chin to crown." },
    cn: { name: "China visa", w: 33, h: 48, head: [28, 33], bg: "#ffffff", tips: "White background. Head 28–33 mm from chin to crown, ears visible." }
  };
  var PXMM = 26;                 // digital photo ≈ 660 dpi (35×45 mm → 910×1170 px)
  var SHEET = { w: 1800, h: 1200, dpi: 300 }; // 6×4 inch at 300 dpi

  function drawPhoto(ctx, s, preset, pxmm, bg) {
    var W = preset.w * pxmm, H = preset.h * pxmm;
    ctx.save(); ctx.fillStyle = bg || "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.translate(s.cx * pxmm, s.cy * pxmm); ctx.rotate(s.rot * Math.PI / 180); ctx.scale(s.sc * pxmm, s.sc * pxmm);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(s.src, -s.src.width / 2, -s.src.height / 2);
    ctx.restore();
  }

  // Oval head guide: chin to crown = middle of the allowed range, crown ~38% of the spare space from the top
  function guide(preset) {
    var head = (preset.head[0] + preset.head[1]) / 2, top = (preset.h - head) * 0.38;
    return { top: top, chin: top + head, cx: preset.w / 2, rx: head * 0.38, ry: head / 2, min: preset.head[0], max: preset.head[1] };
  }

  function sheetLayout(preset) {
    var mm = SHEET.dpi / 25.4, pw = Math.round(preset.w * mm), ph = Math.round(preset.h * mm), gap = Math.round(2 * mm);
    var cols = Math.max(1, Math.floor((SHEET.w - gap) / (pw + gap))), rows = Math.max(1, Math.floor((SHEET.h - gap) / (ph + gap)));
    return { pw: pw, ph: ph, gap: gap, cols: cols, rows: rows, n: cols * rows, mm: mm };
  }

  function init(form) {
    var E = form.elements, view = document.getElementById("pp-view"), msg = document.getElementById("pp-msg"), prog = document.getElementById("pp-progress");
    var editor = document.getElementById("pp-editor"), tipsEl = document.getElementById("pp-tips"), input = document.getElementById("pp-input"), drop = document.getElementById("drop");
    var st = null, orig = null, bgCache = {}, busy = false;

    function preset() { return P[E.country.value] || P.uk; }
    function bgColour() { var v = E.bg.value; return v === "keep" ? "#ffffff" : v === "grey" ? "#e8e8e6" : v === "cream" ? "#f1ead7" : "#ffffff"; }
    function say(t, cls) { msg.textContent = t; msg.className = "hint " + (cls || ""); }

    function fitInitial() {
      var pr = preset(), g = guide(pr), src = st.src;
      // assume a typical head-and-shoulders photo: head is ~45% of the image height
      var sc = Math.max(pr.w / src.width, pr.h / src.height, (g.chin - g.top) / (src.height * 0.45));
      st.base = Math.max(pr.w / src.width, pr.h / src.height); st.sc = Math.max(sc, st.base); st.cx = pr.w / 2; st.cy = pr.h / 2 + src.height * st.sc * 0.06; st.rot = 0;
      E.zoom.value = Math.round(st.sc / st.base * 100); E.rot.value = 0;
    }

    function draw() {
      if (!st) return;
      var pr = preset(), pxmm = Math.min(360 / pr.w, 440 / pr.h), W = Math.round(pr.w * pxmm), H = Math.round(pr.h * pxmm);
      view.width = W; view.height = H;
      var c = view.getContext("2d"); drawPhoto(c, st, pr, pxmm, bgColour());
      if (E.guides.checked) {
        var g = guide(pr); c.save(); c.strokeStyle = "rgba(255,107,53,.95)"; c.lineWidth = 2; c.setLineDash([7, 5]);
        c.beginPath(); c.ellipse(g.cx * pxmm, (g.top + g.ry) * pxmm, g.rx * pxmm, g.ry * pxmm, 0, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]); c.lineWidth = 1.5; c.strokeStyle = "rgba(22,163,74,.9)";
        [[g.top, "Top of head"], [g.chin, "Chin"]].forEach(function (l) { c.beginPath(); c.moveTo(0, l[0] * pxmm); c.lineTo(W, l[0] * pxmm); c.stroke(); c.fillStyle = "rgba(22,163,74,.95)"; c.font = "600 11px system-ui, sans-serif"; c.fillText(l[1], 6, l[0] * pxmm - 4); });
        c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.strokeStyle = "rgba(255,255,255,.55)"; c.stroke();
        c.restore();
      }
      document.getElementById("pp-size").textContent = pr.w + " × " + pr.h + " mm · head " + pr.head[0] + "–" + pr.head[1] + " mm";
      form.setAttribute("data-ready", "1");
    }

    function setSource(img) {
      orig = img; bgCache = {}; st = { src: img }; fitInitial();
      editor.hidden = false; document.getElementById("pp-actions").hidden = false; draw();
      say("Drag the photo to move it, and use Zoom so the top of the head and the chin sit on the green lines.");
      if (E.bg.value !== "keep") replaceBg();
    }

    function load(file) {
      if (!file || !/^image\//.test(file.type)) { say("Please choose a photo (JPG, PNG or WebP).", "warn"); return; }
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 2400, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); setSource(c);
      };
      img.onerror = function () { say("This photo couldn't be opened. Try a JPG or PNG.", "warn"); };
      img.src = url;
    }

    function replaceBg() {
      if (!orig) return;
      var key = "ai";
      if (bgCache[key]) { st.src = bgCache[key]; draw(); return; }
      if (!window.ETBBgAI) { say("The background tool couldn't load. Refresh and try again.", "warn"); return; }
      busy = true; prog.hidden = false; prog.value = 0; say("Removing the background on your device… The first time this downloads the AI model (about 46 MB).");
      window.ETBBgAI.predict(orig, function (f) { prog.value = Math.round(f * 100); }).then(function (p) {
        var S = Math.sqrt(p.length), m = document.createElement("canvas"); m.width = S; m.height = S;
        var mc = m.getContext("2d"), id = mc.createImageData(S, S);
        for (var i = 0; i < p.length; i++) { var a = Math.min(1, Math.max(0, (p[i] - 0.3) / 0.4)); id.data[i * 4 + 3] = Math.round(a * 255); }
        mc.putImageData(id, 0, 0);
        var out = document.createElement("canvas"); out.width = orig.width; out.height = orig.height;
        var oc = out.getContext("2d"); oc.drawImage(orig, 0, 0); oc.globalCompositeOperation = "destination-in"; oc.imageSmoothingQuality = "high"; oc.drawImage(m, 0, 0, out.width, out.height);
        bgCache[key] = out; if (E.bg.value !== "keep") st.src = out;
        prog.hidden = true; busy = false; draw(); say("Background replaced. Check the edges around hair and shoulders before you download.", "good");
      }).catch(function (e) { prog.hidden = true; busy = false; E.bg.value = "keep"; st.src = orig; draw(); say("Sorry, the background couldn't be replaced on this device: " + (e.message || "unknown error") + ".", "warn"); });
    }

    function save(canvas, name) { canvas.toBlob(function (b) { var a = document.createElement("a"), u = URL.createObjectURL(b); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }, "image/jpeg", 0.95); }

    function digital() {
      var pr = preset(), c = document.createElement("canvas"); c.width = pr.w * PXMM; c.height = pr.h * PXMM;
      drawPhoto(c.getContext("2d"), st, pr, PXMM, bgColour()); save(c, "passport-photo-" + E.country.value + "-" + c.width + "x" + c.height + ".jpg");
      return c;
    }
    function sheet() {
      var pr = preset(), L = sheetLayout(pr), c = document.createElement("canvas"); c.width = SHEET.w; c.height = SHEET.h;
      var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      var one = document.createElement("canvas"); one.width = L.pw; one.height = L.ph; drawPhoto(one.getContext("2d"), st, pr, L.mm, bgColour());
      var ox = Math.round((SHEET.w - (L.cols * L.pw + (L.cols - 1) * L.gap)) / 2), oy = Math.round((SHEET.h - (L.rows * L.ph + (L.rows - 1) * L.gap)) / 2);
      x.strokeStyle = "#b8b8b8"; x.lineWidth = 1;
      for (var r = 0; r < L.rows; r++) for (var k = 0; k < L.cols; k++) { var px = ox + k * (L.pw + L.gap), py = oy + r * (L.ph + L.gap); x.drawImage(one, px, py); x.strokeRect(px - 0.5, py - 0.5, L.pw + 1, L.ph + 1); }
      x.fillStyle = "#888"; x.font = "20px Arial, sans-serif"; x.fillText(pr.name + " · " + pr.w + "×" + pr.h + " mm · print at 6×4 in (10×15 cm), 100%", 24, SHEET.h - 14);
      save(c, "passport-photos-6x4-" + E.country.value + ".jpg"); return L.n;
    }

    // dragging
    var drag = null;
    view.addEventListener("pointerdown", function (e) { if (!st) return; drag = { x: e.clientX, y: e.clientY, cx: st.cx, cy: st.cy }; view.setPointerCapture(e.pointerId); });
    view.addEventListener("pointermove", function (e) {
      if (!drag) return; var pr = preset(), k = pr.w / view.getBoundingClientRect().width;
      st.cx = drag.cx + (e.clientX - drag.x) * k; st.cy = drag.cy + (e.clientY - drag.y) * k; draw();
    });
    ["pointerup", "pointercancel"].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });
    view.addEventListener("wheel", function (e) { if (!st) return; e.preventDefault(); E.zoom.value = Math.max(100, Math.min(400, +E.zoom.value - Math.sign(e.deltaY) * 4)); E.zoom.dispatchEvent(new Event("input", { bubbles: true })); }, { passive: false });
    view.addEventListener("keydown", function (e) {
      if (!st) return; var d = { ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0], ArrowUp: [0, -0.3], ArrowDown: [0, 0.3] }[e.key];
      if (d) { e.preventDefault(); st.cx += d[0]; st.cy += d[1]; draw(); }
    });

    form.addEventListener("input", function (e) {
      if (!st) return;
      if (e.target.name === "zoom") { st.sc = st.base * (+E.zoom.value / 100); draw(); }
      else if (e.target.name === "rot") { st.rot = +E.rot.value; draw(); }
      else if (e.target.name === "guides") draw();
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "country") { tipsEl.textContent = preset().tips; if (st) { fitInitial(); draw(); } }
      if (e.target.name === "bg" && st) { if (E.bg.value === "keep") { st.src = orig; draw(); } else if (bgCache.ai) { st.src = bgCache.ai; draw(); } else replaceBg(); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("pp-digital").addEventListener("click", function () { if (st && !busy) { var c = digital(); say("Saved a " + c.width + " × " + c.height + " pixel JPG, ready for an online application.", "good"); } });
    document.getElementById("pp-sheet").addEventListener("click", function () { if (st && !busy) { var n = sheet(); say("Saved a 6×4 inch print sheet with " + n + " photos. Print it at 100% (no borders) at a photo shop or at home, then cut along the grey lines.", "good"); if (window.ETBUse) window.ETBUse(); } });
    document.getElementById("pp-reset").addEventListener("click", function () { if (st) { fitInitial(); draw(); } });
    input.addEventListener("change", function () { load(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files[0]); });
    tipsEl.textContent = preset().tips;
    window.ETBPassportState = function () { return st && { cx: st.cx, cy: st.cy, sc: st.sc, rot: st.rot, w: st.src.width }; };
  }

  window.ETBPassport = { P: P, guide: guide, sheetLayout: sheetLayout, PXMM: PXMM };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-passport]"); if (f) init(f); });
})();
