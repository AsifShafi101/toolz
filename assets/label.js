/* etoolbox – 4×6 shipping label maker. Draws the label on a 300 dpi canvas, then saves it as a
   PDF page of the exact label size (pdf-lib), a PNG, or prints it. Nothing is uploaded. */
(function () {
  "use strict";
  var DPI = 300, MM = DPI / 25.4;
  var SIZES = { "4x6": { w: 4 * DPI, h: 6 * DPI, pw: 288, ph: 432, name: "4x6" }, "a6": { w: Math.round(105 * MM), h: Math.round(148 * MM), pw: 297.64, ph: 419.53, name: "A6" },
    "100x150": { w: Math.round(100 * MM), h: Math.round(150 * MM), pw: 283.46, ph: 425.2, name: "100x150mm" } };
  var F = "Arial, Helvetica, sans-serif";
  var PC = /\b(GIR ?0AA|[A-PR-UWYZ](?:\d[A-HJKPSTUW\d]?|[A-HK-Y]\d[ABEHMNPRV-Y\d]?) ?\d[ABD-HJLNP-UW-Z]{2})\b/i;
  var PHONE = /(?:\+?44\s?|0)(?:\d[\s-]?){9,10}\d?/;

  function fmtPostcode(s) {
    var c = String(s || "").toUpperCase().replace(/\s+/g, "");
    return c.length > 4 && PC.test(c) ? c.slice(0, -3) + " " + c.slice(-3) : String(s || "").toUpperCase().trim();
  }

  // Turn a pasted address (any common layout) into fields
  function parse(text) {
    var out = { to: [], from: [], phone: "", postcode: "", fromPhone: "" }, mode = "to";
    String(text || "").split(/\r?\n/).forEach(function (raw) {
      var l = raw.replace(/\t+/g, " ").replace(/\s{2,}/g, " ").trim();
      if (!l) return;
      var m;
      if ((m = /^(?:from|sender|return(?: address)?|ship from)\s*[:\-–]?\s*(.*)$/i.exec(l))) { mode = "from"; if (m[1]) out.from.push(m[1]); return; }
      if ((m = /^(?:post to|ship to|deliver to|send to|to|recipient|deliver)\s*[:\-–]?\s*(.*)$/i.exec(l)) && !/^to(wn|wer)\b/i.test(l)) { mode = "to"; if (m[1]) out.to.push(m[1]); return; }
      if ((m = /^(?:phone|tel|telephone|mobile|mob|contact)\.?\s*(?:no\.?|number)?\s*[:\-–]?\s*(.+)$/i.exec(l))) { if (mode === "from") out.fromPhone = m[1].trim(); else out.phone = m[1].trim(); return; }
      if (mode === "to" && !out.phone && PHONE.test(l) && l.replace(/[\d\s+()-]/g, "").length === 0) { out.phone = l; return; }
      (mode === "from" ? out.from : out.to).push(l);
    });
    // postcode: a line that is a postcode, or ends with one
    for (var i = out.to.length - 1; i >= 0; i--) {
      var pm = PC.exec(out.to[i]);
      if (pm) { out.postcode = fmtPostcode(pm[1]); var rest = out.to[i].replace(pm[0], "").replace(/[,\s]+$/, "").trim(); if (rest) out.to[i] = rest; else out.to.splice(i, 1); break; }
    }
    var r = { name: out.to[0] || "", company: "", line1: "", line2: "", town: "", county: "", postcode: out.postcode, phone: out.phone,
      fromName: out.from[0] || "", fromAddr: out.from.slice(1).join("\n"), fromPhone: out.fromPhone };
    var mid = out.to.slice(1);
    if (mid.length) r.town = mid.pop();
    if (mid.length >= 3) r.company = mid.shift();
    r.line1 = mid.shift() || ""; r.line2 = mid.join(", ");
    return r;
  }

  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } });
    if (cur) lines.push(cur);
    return lines;
  }

  // Largest font size (<= max) at which the lines fit the box
  function fit(ctx, items, maxW, maxH, max, min) {
    for (var s = max; s >= min; s -= 2) {
      var total = 0, laid = [];
      items.forEach(function (it) {
        var sz = Math.round(s * (it.k || 1)); ctx.font = (it.b ? "700 " : "400 ") + sz + "px " + F;
        wrap(ctx, it.t, maxW).forEach(function (ln) { laid.push({ t: ln, sz: sz, b: it.b, gap: it.gap }); total += sz * 1.18; });
        if (it.gap) total += it.gap * s;
      });
      if (total <= maxH || s <= min) return { lines: laid, s: s };
    }
  }

  function draw(d, canvas) {
    var S = SIZES[d.size] || SIZES["4x6"], W = S.w, H = S.h, u = W / 1200, m = 54 * u;
    canvas.width = W; canvas.height = H;
    var x = canvas.getContext("2d"), y = m;
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.fillStyle = "#000"; x.strokeStyle = "#000"; x.textBaseline = "top"; x.textAlign = "left";
    x.lineWidth = 6 * u; x.strokeRect(m / 2, m / 2, W - m, H - m);
    var up = function (s) { return d.caps ? String(s).toUpperCase() : String(s); };

    // FROM + stamp area
    var stampW = d.stamp ? 300 * u : 0, fromW = W - 2 * m - (stampW ? stampW + 30 * u : 0), topH = d.stamp ? 300 * u : 0;
    var from = [d.fromName].concat(String(d.fromAddr || "").split(/\n/)).concat(d.fromPhone ? ["Tel: " + d.fromPhone] : []).filter(function (s) { return String(s).trim(); });
    if (from.length) {
      x.font = "700 " + 28 * u + "px " + F; x.fillText("FROM", m, y);
      var fl = fit(x, from.map(function (t, i) { return { t: up(t), b: i === 0 }; }), fromW, Math.max(topH - 44 * u, 210 * u), 40 * u, 24 * u);
      var fy = y + 42 * u; fl.lines.forEach(function (l) { x.font = (l.b ? "700 " : "400 ") + l.sz + "px " + F; x.fillText(l.t, m, fy); fy += l.sz * 1.18; });
      topH = Math.max(topH, fy - y);
    }
    if (d.stamp) {
      var sx = W - m - stampW; x.save(); x.setLineDash([16 * u, 12 * u]); x.lineWidth = 3 * u; x.strokeRect(sx, y, stampW, 300 * u); x.restore();
      x.textAlign = "center"; x.font = "700 " + 30 * u + "px " + F; x.fillText("PLACE", sx + stampW / 2, y + 108 * u); x.fillText("POSTAGE", sx + stampW / 2, y + 146 * u); x.fillText("HERE", sx + stampW / 2, y + 184 * u); x.textAlign = "left";
    }
    if (topH) { y += topH + 26 * u; x.fillRect(m, y, W - 2 * m, 8 * u); y += 8 * u + 26 * u; }

    // Service / handling banner
    if (d.service) {
      x.fillRect(m, y, W - 2 * m, 110 * u); x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
      var bs = 64 * u; x.font = "800 " + bs + "px " + F; while (x.measureText(d.service.toUpperCase()).width > W - 2 * m - 40 * u && bs > 30 * u) { bs -= 2 * u; x.font = "800 " + bs + "px " + F; }
      x.fillText(d.service.toUpperCase(), W / 2, y + 57 * u); x.fillStyle = "#000"; x.textAlign = "left"; x.textBaseline = "top"; y += 110 * u + 30 * u;
    }

    // Footer zone (barcode, details, credit)
    var foot = 0, info = [d.ref ? "Ref: " + d.ref : "", d.items ? "Items: " + d.items : "", d.weight ? "Weight: " + d.weight : "", d.date ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""].filter(Boolean);
    var bc = null;
    if (d.ref && window.ETBBarcode) { try { bc = window.ETBBarcode.encode("code128", String(d.ref).trim()); } catch (e) { bc = null; } }
    if (bc) foot += 210 * u; if (info.length) foot += 66 * u; if (!d.pro) foot += 44 * u;
    var bottom = H - m - foot;

    // DELIVER TO
    y += 52 * u;
    var items = [{ t: up(d.name), b: true, k: 1.15 }];
    if (d.company) items.push({ t: up(d.company) });
    if (d.line1) items.push({ t: up(d.line1) }); if (d.line2) items.push({ t: up(d.line2) });
    if (d.town) items.push({ t: up(d.town).toUpperCase(), b: true }); if (d.county) items.push({ t: up(d.county) });
    var pcH = d.postcode ? 175 * u : 0, telH = d.phone ? 70 * u : 0, ctryH = d.country ? 64 * u : 0;
    var room = bottom - y - pcH - telH - ctryH - 20 * u;
    var al = fit(x, items.filter(function (i) { return String(i.t).trim(); }), W - 2 * m, room, 74 * u, 34 * u);
    var blockH = al.lines.reduce(function (t, l) { return t + l.sz * 1.18; }, 0) + pcH + telH + ctryH;
    y += Math.max(0, (bottom - y - blockH - 20 * u) * 0.35);
    x.font = "700 " + 32 * u + "px " + F; x.fillText("DELIVER TO", m, y - 52 * u);
    al.lines.forEach(function (l) { x.font = (l.b ? "700 " : "400 ") + l.sz + "px " + F; x.fillText(l.t, m, y); y += l.sz * 1.18; });
    if (d.postcode) {
      y += 10 * u; var ps = 150 * u; x.font = "800 " + ps + "px " + F;
      while (x.measureText(d.postcode).width > W - 2 * m && ps > 60 * u) { ps -= 4 * u; x.font = "800 " + ps + "px " + F; }
      x.fillText(d.postcode, m, y); y += ps * 1.08;
    }
    if (d.country) { x.font = "700 " + 52 * u + "px " + F; x.fillText(d.country.toUpperCase(), m, y); y += 64 * u; }
    if (d.phone) { x.font = "400 " + 44 * u + "px " + F; x.fillText("Tel: " + d.phone, m, y + 6 * u); }

    // footer
    var fy2 = H - m - foot;
    if (foot) { x.fillRect(m, fy2 - 18 * u, W - 2 * m, 4 * u); }
    if (bc) {
      var bits = bc.bits, quiet = 10, mod = Math.max(2, Math.floor((W - 2 * m) / (bits.length + 2 * quiet))), bw = mod * bits.length, bx = (W - bw) / 2;
      for (var i = 0; i < bits.length; i++) if (bits[i] === "1") x.fillRect(bx + i * mod, fy2 + 8 * u, mod, 140 * u);
      x.textAlign = "center"; x.font = "400 " + 34 * u + "px " + F; x.fillText(bc.text, W / 2, fy2 + 156 * u); x.textAlign = "left"; fy2 += 210 * u;
    }
    if (info.length) { x.font = "700 " + 34 * u + "px " + F; x.fillText(info.join("   ·   "), m, fy2 + 10 * u); fy2 += 66 * u; }
    if (!d.pro) { x.textAlign = "center"; x.font = "400 " + 24 * u + "px " + F; x.fillStyle = "#444"; x.fillText("Label made free at etoolbox.co.uk", W / 2, fy2 + 6 * u); x.textAlign = "left"; x.fillStyle = "#000"; }
    return { size: S, overflow: y > bottom + 2 * u };
  }

  function init(form) {
    var E = form.elements, cv = document.getElementById("lb-canvas"), warn = document.getElementById("lb-warn"), paste = document.getElementById("lb-paste");
    var KEY = "etb-label-from";
    try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) ["fromName", "fromAddr", "fromPhone"].forEach(function (k) { if (saved[k] && E[k] && !E[k].value) E[k].value = saved[k]; }); } catch (e) {}

    function data() {
      var g = function (n) { return E[n] ? String(E[n].value || "").trim() : ""; };
      return { name: g("name"), company: g("company"), line1: g("line1"), line2: g("line2"), town: g("town"), county: g("county"), postcode: fmtPostcode(g("postcode")),
        country: g("country"), phone: g("phone"), fromName: g("fromName"), fromAddr: g("fromAddr"), fromPhone: g("fromPhone"), service: g("service"), ref: g("ref"),
        items: g("items"), weight: g("weight"), date: E.date.checked, stamp: E.stamp.checked, caps: E.caps.checked, size: E.size.value,
        copies: Math.max(1, Math.min(50, parseInt(E.copies.value, 10) || 1)), pro: !!(window.ETBPro && window.ETBPro.isPro()) };
    }
    function upd() {
      var d = data(), msgs = [];
      if (!d.name) msgs.push("Add the recipient's name.");
      if (!d.line1 && !d.town) msgs.push("Add the delivery address.");
      if (!d.postcode) msgs.push("Add the postcode.");
      else if (!d.country && !PC.test(d.postcode)) msgs.push("“" + d.postcode + "” doesn't look like a UK postcode. Check it, or fill in the country for an overseas address.");
      if (d.ref && window.ETBBarcode) { try { window.ETBBarcode.encode("code128", d.ref); } catch (e) { msgs.push("The reference can only use standard keyboard characters, so it won't show as a barcode."); } }
      var r = draw(d, cv);
      if (r.overflow) msgs.push("The address is long for this label. Shorten it, or switch off the stamp space or details.");
      warn.textContent = msgs.join(" "); warn.hidden = !msgs.length;
      form.setAttribute("data-ready", d.name && d.postcode ? "1" : "0");
      try { localStorage.setItem(KEY, JSON.stringify({ fromName: d.fromName, fromAddr: d.fromAddr, fromPhone: d.fromPhone })); } catch (e) {}
      return d;
    }
    function fileBase(d) { return "label-" + ((d.postcode || d.name || "address").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "address"); }
    function save(blob, name) { var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
    function ready() { var d = upd(); if (form.getAttribute("data-ready") !== "1") { warn.hidden = false; warn.textContent = "Add at least the recipient's name and postcode first."; return null; } return d; }

    function pdf() {
      var d = ready(); if (!d) return;
      var c = document.createElement("canvas"), S = draw(d, c).size;
      c.toBlob(function (png) {
        png.arrayBuffer().then(function (buf) {
          return PDFLib.PDFDocument.create().then(function (doc) {
            doc.setTitle("Shipping label"); doc.setCreator("etoolbox.co.uk");
            return doc.embedPng(buf).then(function (img) {
              for (var i = 0; i < d.copies; i++) doc.addPage([S.pw, S.ph]).drawImage(img, { x: 0, y: 0, width: S.pw, height: S.ph });
              return doc.save();
            });
          });
        }).then(function (bytes) {
          save(new Blob([bytes], { type: "application/pdf" }), fileBase(d) + ".pdf");
          document.getElementById("lb-done").hidden = false;
          if (window.ETBNudge) window.ETBNudge("label", "Pro removes the small etoolbox credit from your labels.");
        });
      }, "image/png");
    }
    function png() { var d = ready(); if (!d) return; var c = document.createElement("canvas"); draw(d, c); c.toBlob(function (b) { save(b, fileBase(d) + ".png"); }, "image/png"); }
    function print() {
      var d = ready(); if (!d) return;
      var c = document.createElement("canvas"), S = draw(d, c).size, url = c.toDataURL("image/png"), box = document.getElementById("lb-print");
      var pw = S.name === "4x6" ? "4in 6in" : S.name === "A6" ? "105mm 148mm" : "100mm 150mm";
      document.getElementById("lb-page").textContent = "@page { size: " + pw + "; margin: 0; }";
      var dims = pw.split(" ");
      if (box.parentNode !== document.body) document.body.appendChild(box);
      box.innerHTML = ""; for (var i = 0; i < d.copies; i++) { var im = new Image(); im.src = url; im.alt = ""; im.style.width = dims[0]; im.style.height = dims[1]; box.appendChild(im); }
      document.documentElement.classList.add("lb-printing");
      setTimeout(function () { window.print(); }, 200);
    }
    paste.addEventListener("input", function () {
      var t = paste.value; if (!t.trim()) return;
      var r = parse(t);
      ["name", "company", "line1", "line2", "town", "county", "postcode", "phone"].forEach(function (k) { E[k].value = r[k] || ""; });
      if (r.fromName) { E.fromName.value = r.fromName; E.fromAddr.value = r.fromAddr; E.fromPhone.value = r.fromPhone; }
      document.getElementById("lb-parsed").textContent = "Filled in from your text. Check each field below.";
      upd();
    });
    E.postcode.addEventListener("blur", function () { E.postcode.value = fmtPostcode(E.postcode.value); upd(); });
    document.getElementById("lb-pdf").addEventListener("click", pdf);
    document.getElementById("lb-png").addEventListener("click", png);
    document.getElementById("lb-printbtn").addEventListener("click", print);
    document.getElementById("lb-clear").addEventListener("click", function () {
      ["name", "company", "line1", "line2", "town", "county", "postcode", "country", "phone", "ref", "items", "weight"].forEach(function (k) { E[k].value = ""; });
      paste.value = ""; document.getElementById("lb-parsed").textContent = ""; upd(); E.name.focus();
    });
    form.addEventListener("input", function (e) { if (e.target !== paste) upd(); }); form.addEventListener("change", upd);
    form.addEventListener("submit", function (e) { e.preventDefault(); pdf(); });
    window.addEventListener("etb-pro-change", upd);
    window.addEventListener("afterprint", function () { document.documentElement.classList.remove("lb-printing"); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(upd);
    upd();
  }

  window.ETBLabel = { parse: parse, fmtPostcode: fmtPostcode };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-label]"); if (f) init(f); });
})();
