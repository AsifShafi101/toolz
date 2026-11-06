/* etoolbox – Remove watermark from PDF (for documents you own or may edit).
   Finds watermarks that were added as a separate layer and removes only those:
     1. Watermark annotations (/Subtype /Watermark) – and, optionally, stamp annotations
     2. Marked "/Artifact" content tagged /Watermark (how Acrobat and many tools add them)
     3. Optional-content layers named like Watermark / Draft / Confidential / Sample / Copy
     4. Watermark form objects (Acrobat's /PieceInfo … /Watermark)
     5. Optional: see-through overlay layers added on top of a page later (most online watermark tools)
   Text that is part of a scanned image can't be separated, so it is left alone. Runs entirely in the browser. */
(function () {
  "use strict";
  var form = document.querySelector("form[data-pdfwm]"); if (!form) return;
  var PL = window.PDFLib, N = function (n) { return PL.PDFName.of(n); };
  var NAME_RX = /water\s*mark|draft|confidential|sample|copy|proof|preview|not for (distribution|sale)|specimen/i;
  var $ = function (id) { return document.getElementById(id); };
  var file = null, outBytes = null;

  function latin1(u8) { var s = "", C = 0x8000; for (var i = 0; i < u8.length; i += C) s += String.fromCharCode.apply(null, u8.subarray(i, i + C)); return s; }
  function bytes(str) { var u = new Uint8Array(str.length); for (var i = 0; i < str.length; i++) u[i] = str.charCodeAt(i) & 255; return u; }
  function lookup(d, k) { try { return d && d.lookup ? d.lookup(N(k)) : undefined; } catch (e) { return undefined; } }
  function nameOf(v) { return v && v.asString ? v.asString() : v && v.decodeText ? v.decodeText() : v && v.encodedName ? v.encodedName : v ? String(v) : ""; }
  function str(v) { try { return v ? (v.decodeText ? v.decodeText() : String(v)) : ""; } catch (e) { return String(v); } }
  function inherited(node, key) { var n = node, i = 0; while (n && i++ < 30) { var v = lookup(n, key); if (v) return v; n = lookup(n, "Parent"); } return undefined; }

  function isWmOCG(o) { if (!o) return false; var nm = lookup(o, "Name"); if (nm && NAME_RX.test(str(nm))) return true; var ocgs = lookup(o, "OCGs"); if (ocgs) { var arr = ocgs.asArray ? ocgs.asArray() : [ocgs]; for (var i = 0; i < arr.length; i++) { var g = ocgs.lookup ? ocgs.lookup(i) : arr[i]; if (isWmOCG(g)) return true; } } return false; }
  function isWmXObject(x) {
    if (!x || !x.dict) return false; var d = x.dict;
    if (isWmOCG(lookup(d, "OC"))) return true;
    var pi = lookup(d, "PieceInfo"), ct = pi && lookup(pi, "ADBE_CompoundType"), pr = ct && lookup(ct, "Private");
    return !!(pr && /Watermark/i.test(nameOf(pr)));
  }

  /* Tokenise a content stream and return byte ranges to delete. */
  function scan(src, res, report) {
    var props = res && lookup(res, "Properties"), xobjs = res && lookup(res, "XObject");
    var i = 0, L = src.length, ops = [], opStart = -1, stack = [], cut = [];
    function ws(c) { return c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0; }
    function delim(c) { return c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37; }
    while (i < L) {
      var c = src.charCodeAt(i);
      if (ws(c)) { i++; continue; }
      if (c === 37) { while (i < L && src.charCodeAt(i) !== 10 && src.charCodeAt(i) !== 13) i++; continue; }
      var st = i, tok;
      if (c === 40) { var depth = 1; i++; while (i < L && depth) { var d = src.charCodeAt(i); if (d === 92) i += 2; else { if (d === 40) depth++; else if (d === 41) depth--; i++; } } tok = { t: "str" }; }
      else if (c === 60 && src.charCodeAt(i + 1) === 60) { var dd = 0; do { if (src.substr(i, 2) === "<<") { dd++; i += 2; } else if (src.substr(i, 2) === ">>") { dd--; i += 2; } else if (src.charCodeAt(i) === 40) { var dp = 1; i++; while (i < L && dp) { var e = src.charCodeAt(i); if (e === 92) i += 2; else { if (e === 40) dp++; else if (e === 41) dp--; i++; } } } else i++; } while (i < L && dd > 0); tok = { t: "dict", v: src.slice(st, i) }; }
      else if (c === 60) { while (i < L && src.charCodeAt(i) !== 62) i++; i++; tok = { t: "hex" }; }
      else if (c === 91) { var ad = 0; do { var a = src.charCodeAt(i); if (a === 91) ad++; else if (a === 93) ad--; else if (a === 40) { var ap = 1; i++; while (i < L && ap) { var b = src.charCodeAt(i); if (b === 92) i += 2; else { if (b === 40) ap++; else if (b === 41) ap--; i++; } } continue; } i++; } while (i < L && ad > 0); tok = { t: "arr" }; }
      else if (c === 47) { i++; while (i < L && !ws(src.charCodeAt(i)) && !delim(src.charCodeAt(i))) i++; tok = { t: "name", v: src.slice(st + 1, i) }; }
      else { while (i < L && !ws(src.charCodeAt(i)) && !delim(src.charCodeAt(i))) i++; if (i === st) { i++; continue; } var w = src.slice(st, i); tok = /^[-+.\d]+$/.test(w) ? { t: "num" } : { t: "op", v: w }; }
      if (tok.t !== "op") { if (opStart < 0) opStart = st; ops.push(tok); continue; }
      var op = tok.v, from = opStart < 0 ? st : opStart;
      if (op === "ID") { // inline image data: skip to EI
        var m = /\sEI(?=[\s]|$)/g; m.lastIndex = i + 1; var r = m.exec(src); i = r ? r.index + 3 : L;
      } else if (op === "BDC" || op === "BMC") {
        var rm = false;
        if (op === "BDC" && ops.length >= 2 && ops[0].t === "name") {
          var tag = ops[0].v, p = ops[1], pd = null;
          if (p.t === "dict") pd = p.v; else if (p.t === "name" && props) pd = lookup(props, p.v);
          if (tag === "Artifact") rm = typeof pd === "string" ? /\/Subtype\s*\/Watermark/.test(pd) : !!(pd && /Watermark/i.test(nameOf(lookup(pd, "Subtype"))));
          else if (tag === "OC" && pd && typeof pd !== "string") rm = isWmOCG(pd);
          if (rm) report[tag === "OC" ? "layer" : "artifact"]++;
        }
        stack.push({ from: from, rm: rm });
      } else if (op === "EMC") {
        var top = stack.pop(); if (top && top.rm && !stack.some(function (s) { return s.rm; })) cut.push([top.from, i]);
      } else if (op === "Do" && ops.length && ops[ops.length - 1].t === "name" && xobjs && !stack.some(function (s) { return s.rm; })) {
        var xo = lookup(xobjs, ops[ops.length - 1].v);
        if (isWmXObject(xo)) { cut.push([from, i]); report.object++; }
      }
      ops = []; opStart = -1;
    }
    return cut;
  }

  function transparentGS(res) {
    var gs = res && lookup(res, "ExtGState"), out = {};
    if (gs && gs.entries) gs.entries().forEach(function (kv) { var g = gs.lookup(kv[0]); var ca = lookup(g, "ca"), CA = lookup(g, "CA"); if ((ca && ca.asNumber() < 0.98) || (CA && CA.asNumber() < 0.98)) out[nameOf(kv[0]).replace(/^\//, "")] = 1; });
    return out;
  }

  async function process() {
    var o = { stamps: form.elements.stamps.checked, overlay: form.elements.overlay.checked };
    var buf = await file.arrayBuffer(), doc;
    try { doc = await PL.PDFDocument.load(buf, { updateMetadata: false }); }
    catch (e) { throw new Error(/encrypt/i.test(e.message) ? "This PDF is password-protected. Unlock it first with our Unlock PDF tool." : "This file couldn't be read as a PDF."); }
    var report = { annot: 0, stamp: 0, artifact: 0, layer: 0, object: 0, overlay: 0, pages: 0 }, ctx = doc.context, firstHit = -1;
    doc.getPages().forEach(function (page, pi) {
      var node = page.node, before = JSON.stringify(report), res = inherited(node, "Resources");
      // 1) annotations
      var annots = lookup(node, "Annots");
      if (annots && annots.size) {
        var keep = [];
        for (var k = 0; k < annots.size(); k++) {
          var a = annots.lookup(k), sub = nameOf(lookup(a, "Subtype"));
          if (/Watermark/.test(sub)) { report.annot++; continue; }
          if (o.stamps && /Stamp/.test(sub)) { report.stamp++; continue; }
          keep.push(annots.get(k));
        }
        if (keep.length !== annots.size()) node.set(N("Annots"), ctx.obj(keep));
      }
      // 2–5) content streams
      var cont = node.get(N("Contents")), list = [];
      if (cont instanceof PL.PDFArray) { for (var j = 0; j < cont.size(); j++) list.push(cont.get(j)); } else if (cont) list.push(cont);
      var transp = o.overlay ? transparentGS(res) : {}, newList = [], changed = false;
      list.forEach(function (ref, idx) {
        var sObj = ref instanceof PL.PDFRef ? ctx.lookup(ref) : ref, text;
        try { text = latin1(PL.decodePDFRawStream(sObj).decode()); } catch (e) { newList.push(ref); return; }
        // overlay layer: a later stream that only paints see-through text/images on top
        if (o.overlay && idx > 0 && list.length > 1 && text.length < 300000) {
          var gsUsed = (text.match(/\/([^\s/<>[\]()]+)\s+gs\b/g) || []).map(function (x) { return x.replace(/^\//, "").replace(/\s+gs$/, ""); });
          var paints = /\bBT\b|\bDo\b/.test(text), seeThrough = gsUsed.length && gsUsed.every(function (g) { return transp[g]; });
          if (paints && seeThrough) { report.overlay++; changed = true; return; }
        }
        var cuts = scan(text, res, report);
        if (!cuts.length) { newList.push(ref); return; }
        cuts.sort(function (a, b) { return a[0] - b[0]; });
        var out = "", pos = 0; cuts.forEach(function (c) { if (c[0] >= pos) { out += text.slice(pos, c[0]) + " "; pos = c[1]; } }); out += text.slice(pos);
        newList.push(ctx.register(ctx.flateStream(bytes(out)))); changed = true;
      });
      if (changed) node.set(N("Contents"), newList.length === 1 ? newList[0] : ctx.obj(newList));
      if (JSON.stringify(report) !== before) { report.pages++; if (firstHit < 0) firstHit = pi; }
    });
    outBytes = await doc.save();
    return { report: report, firstHit: firstHit < 0 ? 0 : firstHit, total: doc.getPageCount(), orig: new Uint8Array(buf) };
  }

  async function preview(orig, cleaned, pageIndex) {
    var lib = await window.ETBPdf.pdfjs();
    async function draw(data, canvas) {
      var pdf = await lib.getDocument({ data: data.slice(0) }).promise, page = await pdf.getPage(pageIndex + 1);
      var vp0 = page.getViewport({ scale: 1 }), scale = Math.min(2, 520 / vp0.width), vp = page.getViewport({ scale: scale });
      canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    }
    await Promise.all([draw(orig, $("wm-before")), draw(cleaned, $("wm-after"))]);
  }

  function summary(r) {
    var parts = [];
    if (r.artifact) parts.push(r.artifact + " watermark mark" + (r.artifact > 1 ? "s" : ""));
    if (r.layer) parts.push(r.layer + " watermark layer section" + (r.layer > 1 ? "s" : ""));
    if (r.object) parts.push(r.object + " watermark object" + (r.object > 1 ? "s" : ""));
    if (r.annot) parts.push(r.annot + " watermark annotation" + (r.annot > 1 ? "s" : ""));
    if (r.stamp) parts.push(r.stamp + " stamp" + (r.stamp > 1 ? "s" : ""));
    if (r.overlay) parts.push(r.overlay + " see-through overlay layer" + (r.overlay > 1 ? "s" : ""));
    return parts;
  }

  var input = $("wm-input"), drop = $("wm-drop"), msg = $("wm-msg"), out = $("wm-out");
  function pick(f) {
    if (!f) return; if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { msg.innerHTML = "<span class='warn'>Please choose a PDF file.</span>"; return; }
    file = f; $("wm-name").textContent = f.name; run();
  }
  async function run() {
    if (!file) return;
    out.hidden = true; msg.textContent = "Looking for watermarks…";
    try {
      var r = await process(), parts = summary(r.report);
      out.setAttribute("data-report", JSON.stringify(r.report));
      if (!parts.length) {
        msg.innerHTML = "<span class='warn'>No separate watermark layer was found in this PDF.</span> If the watermark is part of a scanned page or was flattened into the page image, it can't be separated from the content." + (form.elements.overlay.checked ? "" : " Try ticking “Also remove see-through overlay layers”.");
        return;
      }
      msg.textContent = "Removed " + parts.join(", ") + " on " + r.report.pages + " of " + r.total + " page" + (r.total > 1 ? "s" : "") + ". Check the preview, then download.";
      await preview(r.orig, outBytes, r.firstHit);
      $("wm-page").textContent = "Page " + (r.firstHit + 1);
      out.hidden = false;
    } catch (e) { msg.innerHTML = "<span class='warn'>" + (e.message || "Something went wrong.") + "</span>"; console.error(e); }
  }
  input.addEventListener("change", function () { pick(input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { pick(e.dataTransfer.files[0]); });
  form.addEventListener("change", function (e) { if (e.target.type === "checkbox") run(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  $("wm-dl").addEventListener("click", function () {
    if (!outBytes) return; var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([outBytes], { type: "application/pdf" }));
    a.download = file.name.replace(/\.pdf$/i, "") + "-no-watermark.pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  });
})();
