/* etoolbox PDF tools — merge, split, images→PDF, PDF→images, rotate, page numbers.
   Uses pdf-lib (MIT) and pdf.js (Apache-2.0). Files never leave the browser. */
(function () {
  "use strict";

  var MM = 72 / 25.4, SIZES = { a4: [210 * MM, 297 * MM], letter: [612, 792] };

  function kb(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function base(n) { return n.replace(/\.[^.]+$/, ""); }
  function readBuf(file) { return file.arrayBuffer ? file.arrayBuffer() : new Response(file).arrayBuffer(); }

  // "1-3, 5, 8-" -> zero-based indices (in order, de-duplicated). Exported for tests.
  function parseRanges(text, n) {
    var out = [], seen = {}, parts = String(text || "").split(/[,\s]+/).filter(Boolean);
    if (!parts.length) throw new Error("Enter the pages, e.g. 1-3, 5");
    parts.forEach(function (p) {
      var m = /^(\d*)\s*-\s*(\d*)$/.exec(p), a, b;
      if (m) { a = m[1] ? parseInt(m[1], 10) : 1; b = m[2] ? parseInt(m[2], 10) : n; }
      else if (/^\d+$/.test(p)) { a = b = parseInt(p, 10); }
      else throw new Error("'" + p + "' isn't a page number or range.");
      if (a < 1 || b > n || a > b) throw new Error("Pages must be between 1 and " + n + ".");
      for (var i = a; i <= b; i++) if (!seen[i]) { seen[i] = 1; out.push(i - 1); }
    });
    return out;
  }

  function loadPdf(buf) {
    return PDFLib.PDFDocument.load(buf, { ignoreEncryption: false }).catch(function (e) {
      if (/encrypt/i.test(e.message)) throw new Error("This PDF is password-protected. Remove the password first.");
      throw new Error("This file isn't a valid PDF.");
    });
  }

  var pdfjsPromise = null;
  function pdfjs() {
    if (!pdfjsPromise) pdfjsPromise = import("/assets/vendor/pdf.min.mjs").then(function (m) {
      m.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdf.worker.min.mjs"; return m;
    });
    return pdfjsPromise;
  }

  function imageToPngBytes(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0); URL.revokeObjectURL(url);
        c.toBlob(function (b) { b.arrayBuffer().then(function (ab) { res({ bytes: ab, w: c.width, h: c.height, type: "png" }); }); }, "image/png");
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error(file.name + " couldn't be opened.")); };
      img.src = url;
    });
  }

  /* ---------- Operations (each returns [{name, bytes, mime}]) ---------- */

  var ops = {
    merge: function (files) {
      if (files.length < 2) throw new Error("Add at least two PDFs to merge.");
      return PDFLib.PDFDocument.create().then(function (out) {
        return files.reduce(function (p, f) {
          return p.then(function () { return readBuf(f).then(loadPdf).then(function (src) {
            return out.copyPages(src, src.getPageIndices()).then(function (pages) { pages.forEach(function (pg) { out.addPage(pg); }); });
          }); });
        }, Promise.resolve()).then(function () { return out.save(); }).then(function (b) { return [{ name: "merged.pdf", bytes: b }]; });
      });
    },
    split: function (files, o) {
      var f = files[0];
      return readBuf(f).then(loadPdf).then(function (src) {
        var n = src.getPageCount(), groups;
        if (o.splitmode === "every") {
          var k = Math.max(1, parseInt(o.every, 10) || 1); groups = [];
          for (var i = 0; i < n; i += k) { var g = []; for (var j = i; j < Math.min(n, i + k); j++) g.push(j); groups.push(g); }
        } else if (o.splitmode === "remove") {
          var drop = parseRanges(o.pages, n), keep = src.getPageIndices().filter(function (i) { return drop.indexOf(i) < 0; });
          if (!keep.length) throw new Error("You can't remove every page.");
          groups = [keep];
        } else groups = [parseRanges(o.pages, n)];
        return Promise.all(groups.map(function (g, gi) {
          return PDFLib.PDFDocument.create().then(function (out) {
            return out.copyPages(src, g).then(function (pages) { pages.forEach(function (pg) { out.addPage(pg); }); return out.save(); });
          }).then(function (b) {
            var label = o.splitmode === "every" ? (g.length === 1 ? "page-" + (g[0] + 1) : "pages-" + (g[0] + 1) + "-" + (g[g.length - 1] + 1)) : o.splitmode === "remove" ? "edited" : "extracted";
            return { name: base(f.name) + "-" + label + ".pdf", bytes: b };
          });
        }));
      });
    },
    rotate: function (files, o) {
      var f = files[0], deg = parseInt(o.angle, 10) || 90;
      return readBuf(f).then(loadPdf).then(function (doc) {
        var n = doc.getPageCount(), which = o.which === "some" ? parseRanges(o.pages, n) : doc.getPageIndices();
        which.forEach(function (i) { var p = doc.getPage(i); p.setRotation(PDFLib.degrees((p.getRotation().angle + deg) % 360)); });
        return doc.save();
      }).then(function (b) { return [{ name: base(f.name) + "-rotated.pdf", bytes: b }]; });
    },
    numbers: function (files, o) {
      var f = files[0];
      return readBuf(f).then(loadPdf).then(function (doc) {
        return doc.embedFont(PDFLib.StandardFonts.Helvetica).then(function (font) {
          var pages = doc.getPages(), total = pages.length, start = parseInt(o.start, 10) || 1, size = parseInt(o.fontsize, 10) || 11;
          var skipFirst = !!o.skipfirst;
          pages.forEach(function (p, i) {
            if (skipFirst && i === 0) return;
            var num = start + i - (skipFirst ? 1 : 0), shownTotal = total - (skipFirst ? 1 : 0) + start - 1;
            var text = o.format === "of" ? "Page " + num + " of " + shownTotal : o.format === "dash" ? "- " + num + " -" : String(num);
            var w = font.widthOfTextAtSize(text, size), box = p.getMediaBox();
            var W = box.width, H = box.height, m = 24;
            var x = o.position.indexOf("right") >= 0 ? W - m - w : o.position.indexOf("left") >= 0 ? m : (W - w) / 2;
            var y = o.position.indexOf("top") >= 0 ? H - m - size : m;
            p.drawText(text, { x: box.x + x, y: box.y + y, size: size, font: font, color: PDFLib.rgb(0.2, 0.2, 0.2) });
          });
          return doc.save();
        });
      }).then(function (b) { return [{ name: base(f.name) + "-numbered.pdf", bytes: b }]; });
    },
    img2pdf: function (files, o) {
      if (!files.length) throw new Error("Add at least one image.");
      return PDFLib.PDFDocument.create().then(function (doc) {
        var margin = o.margin === "none" ? 0 : o.margin === "large" ? 36 : 18;
        return files.reduce(function (p, f) {
          return p.then(function () {
            var load = f.type === "image/jpeg" ? readBuf(f).then(function (ab) { return doc.embedJpg(ab); }) :
              f.type === "image/png" ? readBuf(f).then(function (ab) { return doc.embedPng(ab); }) :
              imageToPngBytes(f).then(function (r) { return doc.embedPng(r.bytes); });
            return load.then(function (img) {
              var iw = img.width, ih = img.height, pw, ph;
              if (o.pagesize === "fit") { pw = iw + margin * 2; ph = ih + margin * 2; }
              else {
                var s = SIZES[o.pagesize] || SIZES.a4; pw = s[0]; ph = s[1];
                var land = o.orientation === "landscape" || (o.orientation === "auto" && iw > ih);
                if (land) { var t = pw; pw = ph; ph = t; }
              }
              var page = doc.addPage([pw, ph]), aw = pw - margin * 2, ah = ph - margin * 2;
              var sc = Math.min(aw / iw, ah / ih, o.pagesize === "fit" ? 1 : Infinity), dw = iw * sc, dh = ih * sc;
              page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
            }).catch(function (e) { throw new Error(f.name + ": " + (e.message || "couldn't be added")); });
          });
        }, Promise.resolve()).then(function () { return doc.save(); });
      }).then(function (b) { return [{ name: files.length === 1 ? base(files[0].name) + ".pdf" : "images.pdf", bytes: b }]; });
    },
    pdf2img: function (files, o) {
      var f = files[0], scale = parseFloat(o.scale) || 2, type = o.imgformat === "png" ? "image/png" : "image/jpeg";
      return Promise.all([pdfjs(), readBuf(f)]).then(function (r) {
        return r[0].getDocument({ data: new Uint8Array(r[1]) }).promise.catch(function (e) {
          throw new Error(/password/i.test(e.name + e.message) ? "This PDF is password-protected." : "This file isn't a valid PDF.");
        });
      }).then(function (pdf) {
        var out = [], chain = Promise.resolve(), n = Math.min(pdf.numPages, 200);
        for (var i = 1; i <= n; i++) (function (i) {
          chain = chain.then(function () { return pdf.getPage(i); }).then(function (page) {
            var vp = page.getViewport({ scale: scale }), c = document.createElement("canvas");
            c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
            var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
            return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
              return new Promise(function (res) { c.toBlob(function (b) { res(b); }, type, 0.92); });
            }).then(function (b) { out.push({ name: base(f.name) + "-page-" + i + (type === "image/png" ? ".png" : ".jpg"), blob: b, mime: type, w: c.width, h: c.height }); });
          });
        })(i);
        return chain.then(function () { return out; });
      });
    },
    compress: function (files, o) {
      var f = files[0], level = o.level || "recommended";
      return readBuf(f).then(function (orig) {
        var origBytes = new Uint8Array(orig.slice(0));
        var done = function (bytes, how) {
          if (bytes.length >= origBytes.length) return [{ name: base(f.name) + "-compressed.pdf", bytes: origBytes, note: "This PDF is already well optimised, so we kept your original (" + kb(origBytes.length) + ")." }];
          var saved = Math.round((1 - bytes.length / origBytes.length) * 100);
          return [{ name: base(f.name) + "-compressed.pdf", bytes: bytes, note: kb(origBytes.length) + " → " + kb(bytes.length) + " (" + saved + "% smaller)" + how }];
        };
        if (level === "light") return loadPdf(orig).then(function (doc) { return doc.save({ useObjectStreams: true }); }).then(function (b) { return done(b, ". Text stays selectable."); });
        var dpi = level === "strong" ? 96 : 144, q = level === "strong" ? 0.55 : 0.72;
        return Promise.all([pdfjs(), loadPdf(orig)]).then(function (r) {
          return r[0].getDocument({ data: origBytes.slice(0) }).promise.then(function (pdf) {
            return PDFLib.PDFDocument.create().then(function (out) {
              var chain = Promise.resolve();
              for (var i = 1; i <= pdf.numPages; i++) (function (i) {
                chain = chain.then(function () { return pdf.getPage(i); }).then(function (page) {
                  var vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: dpi / 72 }), c = document.createElement("canvas");
                  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
                  var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
                  return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
                    return new Promise(function (res) { c.toBlob(res, "image/jpeg", q); });
                  }).then(function (blob) { return blob.arrayBuffer(); }).then(function (ab) { return out.embedJpg(ab); }).then(function (img) {
                    var pg = out.addPage([vp1.width, vp1.height]); pg.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
                  });
                });
              })(i);
              return chain.then(function () { return out.save({ useObjectStreams: true }); });
            });
          });
        }).then(function (b) { return done(b, ". Pages were converted to images, so text is no longer selectable."); });
      });
    },
    pdf2word: function (files) {
      var f = files[0];
      return Promise.all([pdfjs(), readBuf(f)]).then(function (r) {
        return r[0].getDocument({ data: new Uint8Array(r[1]) }).promise.catch(function (e) {
          throw new Error(/password/i.test(e.name + e.message) ? "This PDF is password-protected." : "This file isn't a valid PDF.");
        });
      }).then(function (pdf) {
        var pages = [], chain = Promise.resolve();
        for (var i = 1; i <= pdf.numPages; i++) (function (i) {
          chain = chain.then(function () { return pdf.getPage(i); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) { pages.push(tc.items); });
        })(i);
        return chain.then(function () {
          var paras = textToParagraphs(pages);
          if (!paras.some(function (p) { return p.text; })) throw new Error("No text found. This PDF looks like a scan (images only), so there's no text to convert.");
          var xml = docxXml(paras);
          var zip = fflate.zipSync({
            "[Content_Types].xml": fflate.strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
            "_rels/.rels": fflate.strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
            "word/document.xml": fflate.strToU8(xml)
          });
          var words = paras.reduce(function (n, p) { return n + (p.text ? p.text.split(/\s+/).length : 0); }, 0);
          return [{ name: base(f.name) + ".docx", blob: new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
                    note: pdf.numPages + " page" + (pdf.numPages > 1 ? "s" : "") + " · " + words.toLocaleString("en-GB") + " words converted" }];
        });
      });
    }
  };

  // Group pdf.js text items into lines and paragraphs. Exported for tests.
  function textToParagraphs(pages) {
    var all = [];
    pages.forEach(function (items, pi) {
      var lines = [];
      items.forEach(function (it) {
        if (!it.str && !it.hasEOL) return;
        var x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
        var line = null;
        for (var k = 0; k < lines.length; k++) if (Math.abs(lines[k].y - y) < h * 0.5) { line = lines[k]; break; }
        if (!line) { line = { y: y, h: h, items: [] }; lines.push(line); }
        line.h = Math.max(line.h, h); line.items.push({ x: x, w: it.width || 0, s: it.str, h: h });
      });
      lines.sort(function (a, b) { return b.y - a.y; });
      lines.forEach(function (l) {
        l.items.sort(function (a, b) { return a.x - b.x; });
        var t = "", end = null;
        l.items.forEach(function (it) {
          if (end !== null && it.x - end > it.h * 0.2 && !/\s$/.test(t) && !/^\s/.test(it.s)) t += " ";
          t += it.s; end = it.x + it.w;
        });
        l.text = t.replace(/\s+/g, " ").trim();
      });
      lines = lines.filter(function (l) { return l.text; });
      var hs = lines.map(function (l) { return l.h; }).sort(function (a, b) { return a - b; }), body = hs.length ? hs[Math.floor(hs.length / 2)] : 10;
      var cur = null;
      lines.forEach(function (l, i) {
        var heading = l.h >= body * 1.25, prev = lines[i - 1];
        var gap = prev ? prev.y - l.y : 0, newPara = !cur || heading || cur.heading || gap > Math.max(prev.h, l.h) * 1.6;
        if (newPara) { cur = { text: l.text, heading: heading, size: l.h }; all.push(cur); }
        else cur.text += (/-$/.test(cur.text) ? "" : " ") + l.text;
      });
      if (pi < pages.length - 1) all.push({ pageBreak: true });
    });
    return all;
  }

  function xmlEsc(s) { return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function docxXml(paras) {
    var body = paras.map(function (p) {
      if (p.pageBreak) return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      var rpr = p.heading ? "<w:rPr><w:b/><w:sz w:val=\"" + Math.min(48, Math.max(26, Math.round(p.size * 2))) + "\"/></w:rPr>" : "";
      return "<w:p>" + (p.heading ? '<w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>' : '<w:pPr><w:spacing w:after="160"/></w:pPr>') +
        "<w:r>" + rpr + '<w:t xml:space="preserve">' + xmlEsc(p.text) + "</w:t></w:r></w:p>";
    }).join("");
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
  }

  function opts(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) o[el.name] = el.value; }
      else if (el.type === "checkbox") o[el.name] = el.checked;
      else o[el.name] = el.value;
    });
    return o;
  }

  function init(form) {
    var mode = form.getAttribute("data-pdf"), multi = mode === "merge" || mode === "img2pdf";
    var input = document.getElementById("pdf-input"), drop = document.getElementById("drop");
    var list = document.getElementById("file-list"), runBtn = document.getElementById("run"), out = document.getElementById("pdf-out"), msg = document.getElementById("pdf-msg");
    var files = [];

    function syncUi() {
      var o = opts(form);
      Array.prototype.forEach.call(form.querySelectorAll("[data-show-when]"), function (el) {
        var p = el.getAttribute("data-show-when").split("="); el.hidden = p[1].split("|").indexOf(String(o[p[0]])) < 0;
      });
    }

    function renderList() {
      list.innerHTML = files.map(function (f, i) {
        return '<li class="file-row"><span class="file-name">' + esc(f.name) + ' <span class="muted">' + kb(f.size) + (f.pages ? " · " + f.pages + " pages" : "") + "</span></span>" +
          (multi ? '<button type="button" class="icon-btn" data-up="' + i + '" aria-label="Move up"' + (i ? "" : " disabled") + '>↑</button><button type="button" class="icon-btn" data-down="' + i + '" aria-label="Move down"' + (i < files.length - 1 ? "" : " disabled") + ">↓</button>" : "") +
          '<button type="button" class="icon-btn" data-del="' + i + '" aria-label="Remove">×</button></li>';
      }).join("");
      runBtn.disabled = !files.length;
    }

    list.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var i;
      if (b.hasAttribute("data-del")) { files.splice(+b.getAttribute("data-del"), 1); }
      else if (b.hasAttribute("data-up")) { i = +b.getAttribute("data-up"); files.splice(i - 1, 0, files.splice(i, 1)[0]); }
      else if (b.hasAttribute("data-down")) { i = +b.getAttribute("data-down"); files.splice(i + 1, 0, files.splice(i, 1)[0]); }
      renderList();
    });

    function take(fl) {
      var accept = mode === "img2pdf" ? /^image\// : /pdf$/;
      var picked = Array.prototype.filter.call(fl, function (f) { return accept.test(f.type) || (mode !== "img2pdf" && /\.pdf$/i.test(f.name)); });
      if (!picked.length) { msg.textContent = mode === "img2pdf" ? "Please choose JPG, PNG or WebP images." : "Please choose a PDF file."; return; }
      msg.textContent = "";
      files = multi ? files.concat(picked).slice(0, 50) : [picked[0]];
      out.innerHTML = "";
      renderList();
      if (mode !== "img2pdf" && window.PDFLib) files.forEach(function (f) {
        if (f.pages) return;
        readBuf(f).then(function (b) { return PDFLib.PDFDocument.load(b); }).then(function (d) { f.pages = d.getPageCount(); renderList(); }).catch(function () {});
      });
    }

    input.addEventListener("change", function () { take(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { take(e.dataTransfer.files); });
    form.addEventListener("change", syncUi); form.addEventListener("input", syncUi);
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    runBtn.addEventListener("click", function () {
      if (!files.length) return;
      msg.textContent = ""; out.innerHTML = '<p class="muted">Working…</p>'; runBtn.disabled = true;
      var started = Date.now();
      Promise.resolve().then(function () { return ops[mode](files, opts(form)); }).then(function (results) {
        out.innerHTML = '<p class="good"><strong>Done.</strong> ' + results.length + " file" + (results.length > 1 ? "s" : "") + " ready.</p>" +
          '<ul class="img-results">' + results.map(function (r, i) {
            var blob = r.blob || new Blob([r.bytes], { type: "application/pdf" }), url = URL.createObjectURL(blob);
            return '<li class="img-item" data-out=\'' + JSON.stringify({ name: r.name, size: blob.size, mime: blob.type }) + "'>" +
              (r.blob && /image/.test(blob.type) ? '<img src="' + url + '" alt="">' : '<span class="pdf-ico">' + (/word/.test(blob.type) ? "DOCX" : "PDF") + '</span>') +
              '<div class="img-info"><strong>' + esc(r.name) + '</strong><span class="muted">' + (r.note ? esc(r.note) : kb(blob.size)) + (r.w ? " · " + r.w + "×" + r.h : "") + "</span></div>" +
              '<a class="btn small" href="' + url + '" download="' + esc(r.name) + '" data-dl="' + i + '">Download</a></li>';
          }).join("") + "</ul>" + (results.length > 1 ? '<button type="button" class="btn" id="dl-all" style="margin-top:12px">Download all</button>' : "");
        var all = document.getElementById("dl-all");
        if (all) all.addEventListener("click", function () {
          Array.prototype.forEach.call(out.querySelectorAll("[data-dl]"), function (a, i) { setTimeout(function () { a.click(); }, i * 300); });
        });
        out.setAttribute("data-done", String(Date.now() - started));
      }).catch(function (e) {
        out.innerHTML = ""; msg.textContent = e.message || "Something went wrong."; out.setAttribute("data-error", msg.textContent);
      }).then(function () { runBtn.disabled = !files.length; });
    });
    syncUi(); renderList();
  }

  window.ETBPdf = { parseRanges: parseRanges, ops: ops, textToParagraphs: textToParagraphs, pdfjs: pdfjs };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-pdf]"); if (f) init(f); });
})();
