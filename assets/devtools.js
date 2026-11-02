/* etoolbox JSON formatter & SEO meta description generator. */
(function () {
  "use strict";

  /* ---------- JSON ---------- */
  function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === "object") return Object.keys(v).sort().reduce(function (o, k) { o[k] = sortKeys(v[k]); return o; }, {});
    return v;
  }
  function lineCol(text, pos) { var before = text.slice(0, pos).split("\n"); return { line: before.length, col: before[before.length - 1].length + 1 }; }
  function parseJson(text) {
    try { return { value: JSON.parse(text) }; }
    catch (e) {
      var m = /position (\d+)/i.exec(e.message), lc = /line (\d+) column (\d+)/i.exec(e.message), where = null;
      if (lc) where = { line: +lc[1], col: +lc[2] }; else if (m) where = lineCol(text, +m[1]);
      var hint = "";
      if (/'/.test(text) && !/"/.test(text)) hint = " Tip: JSON needs double quotes (\"), not single quotes.";
      else if (/,\s*[}\]]/.test(text)) hint = " Tip: remove the comma before a closing } or ].";
      return { error: e.message.replace(/^JSON\.parse: /, "").replace(/ in JSON at position \d+.*$/, "") + (where ? " (line " + where.line + ", column " + where.col + ")" : "") + "." + hint, where: where };
    }
  }
  function formatJson(text, o) {
    var p = parseJson(text); if (p.error) return p;
    var v = o.sort ? sortKeys(p.value) : p.value;
    return { out: o.minify ? JSON.stringify(v) : JSON.stringify(v, null, o.indent === "tab" ? "\t" : +o.indent || 2) };
  }

  function stats(v) { var n = 0, depth = 0; (function walk(x, d) { n++; depth = Math.max(depth, d); if (x && typeof x === "object") Object.keys(x).forEach(function (k) { walk(x[k], d + 1); }); })(v, 0); return { nodes: n, depth: depth }; }

  function initJson(root) {
    var src = document.getElementById("json-in"), out = document.getElementById("json-out"), msg = document.getElementById("json-msg"), ind = document.getElementById("indent"), sort = document.getElementById("sortkeys");
    function run(minify) {
      if (!src.value.trim()) { msg.className = "muted"; msg.textContent = "Paste JSON on the left."; out.value = ""; return; }
      var r = formatJson(src.value, { minify: minify, indent: ind.value, sort: sort.checked });
      if (r.error) { msg.className = "warn"; msg.textContent = "✗ Invalid JSON: " + r.error; out.value = ""; root.setAttribute("data-valid", "0");
        if (r.where) { var lines = src.value.split("\n"), pos = 0; for (var i = 0; i < r.where.line - 1; i++) pos += lines[i].length + 1; src.focus(); src.setSelectionRange(pos + r.where.col - 1, pos + r.where.col); }
        return; }
      out.value = r.out; var s = stats(JSON.parse(r.out));
      msg.className = "good"; msg.textContent = "✓ Valid JSON · " + s.nodes.toLocaleString("en-GB") + " values · depth " + s.depth + " · " + new Blob([r.out]).size.toLocaleString("en-GB") + " bytes";
      root.setAttribute("data-valid", "1");
    }
    document.getElementById("json-format").addEventListener("click", function () { run(false); });
    document.getElementById("json-minify").addEventListener("click", function () { run(true); });
    document.getElementById("json-copy").addEventListener("click", function (e) { if (out.value) navigator.clipboard.writeText(out.value).then(function () { e.target.textContent = "Copied ✓"; setTimeout(function () { e.target.textContent = "Copy"; }, 1200); }); });
    document.getElementById("json-dl").addEventListener("click", function () { if (!out.value) return; var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out.value], { type: "application/json" })); a.download = "formatted.json"; a.click(); });
    document.getElementById("json-sample").addEventListener("click", function () { src.value = '{"business":"The Corner Café","open":true,"rating":4.7,"tags":["coffee","brunch"],"address":{"street":"1 High St","city":"Leeds","postcode":"LS1 1AA"}}'; run(false); });
    src.addEventListener("input", function () { clearTimeout(src.t); src.t = setTimeout(function () { run(false); }, 400); });
    [ind, sort].forEach(function (el) { el.addEventListener("change", function () { run(false); }); });
  }

  /* ---------- Meta description / SERP preview ---------- */
  var cnv = document.createElement("canvas").getContext("2d");
  function px(text, font) { cnv.font = font; return Math.round(cnv.measureText(text).width); }
  var LIMITS = { title: { px: 580, font: "20px Arial" }, desc: { px: 920, font: "14px Arial", min: 120, max: 160 } };
  function truncate(text, max, font) { if (px(text, font) <= max) return text; var t = text; while (t.length && px(t + " …", font) > max) t = t.slice(0, -1); return t.replace(/\s+\S*$/, "") + " …"; }
  function ideas(v) {
    var biz = v.business || "Your business", kw = v.keyword || "", loc = v.location ? " in " + v.location : "", usp = v.usp ? v.usp.replace(/\.$/, "") : "", cta = v.cta || "Book today";
    var K = kw ? kw.charAt(0).toUpperCase() + kw.slice(1) : biz;
    var list = [
      K + loc + " from " + biz + "." + (usp ? " " + usp + "." : "") + " " + cta + ".",
      "Looking for " + (kw || "a trusted local business") + loc + "? " + biz + (usp ? " offers " + usp.charAt(0).toLowerCase() + usp.slice(1) : " is here to help") + ". " + cta + ".",
      biz + ": " + (kw || "quality service") + loc + "." + (usp ? " " + usp + "." : "") + " Friendly, local and trusted. " + cta + ".",
      (usp ? usp + ". " : "") + K + loc + " you can rely on. See prices and reviews from " + biz + ". " + cta + "."
    ];
    return list.map(function (s) { return s.replace(/\s+/g, " ").replace(/\.\./g, ".").trim(); });
  }
  function rateDesc(s) { var n = s.length, w = px(s, LIMITS.desc.font); return w > LIMITS.desc.px ? "Too long, Google will cut it off" : n < LIMITS.desc.min ? "A bit short. Aim for 120–160 characters" : "Good length"; }

  function initMeta(form) {
    var list = document.getElementById("meta-ideas");
    function v() { var o = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) o[el.name] = el.value.trim(); }); return o; }
    function preview() {
      var o = v(), title = o.title || (o.keyword ? o.keyword.charAt(0).toUpperCase() + o.keyword.slice(1) + (o.location ? " in " + o.location : "") + " | " : "") + (o.business || "Page title");
      var desc = o.description || "Your meta description will appear here. Choose one of the ideas or write your own.";
      var url = (o.url || "https://www.yourbusiness.co.uk/").replace(/^https?:\/\//, "").replace(/\/$/, "");
      document.getElementById("serp-url").textContent = url.split("/").join(" › ");
      document.getElementById("serp-title").textContent = truncate(title, LIMITS.title.px, LIMITS.title.font);
      document.getElementById("serp-desc").textContent = truncate(desc, LIMITS.desc.px, LIMITS.desc.font);
      var tl = px(title, LIMITS.title.font), dl = px(desc, LIMITS.desc.font);
      document.getElementById("title-count").innerHTML = title.length + " characters · " + tl + "px " + (tl > LIMITS.title.px ? '<b class="warn">too long</b>' : '<b class="good">fits</b>');
      document.getElementById("desc-count").innerHTML = (o.description ? o.description.length : 0) + " characters · " + (o.description ? dl : 0) + "px " + (o.description ? (dl > LIMITS.desc.px ? '<b class="warn">too long</b>' : o.description.length < LIMITS.desc.min ? '<b class="muted">short</b>' : '<b class="good">good</b>') : "");
      var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); };
      var canonical = o.url && /^https?:\/\//.test(o.url) ? o.url : "";
      document.getElementById("meta-code").value = "<title>" + esc(title) + "</title>\n" + '<meta name="description" content="' + esc(desc) + '">\n' +
        (canonical ? '<link rel="canonical" href="' + esc(canonical) + '">\n' : "") + '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
        (canonical ? '<meta property="og:url" content="' + esc(canonical) + '">\n' : "") + '<meta name="twitter:card" content="summary_large_image">';
      list.innerHTML = ideas(o).map(function (s, i) { return '<li><button type="button" class="idea" data-i="' + i + '">' + esc(s) + '</button><span class="muted"> ' + s.length + " chars · " + rateDesc(s) + "</span></li>"; }).join("");
    }
    list.addEventListener("click", function (e) { var b = e.target.closest(".idea"); if (!b) return; form.elements.description.value = b.textContent; preview(); });
    document.getElementById("meta-copy").addEventListener("click", function (e) { navigator.clipboard.writeText(document.getElementById("meta-code").value).then(function () { e.target.textContent = "Copied ✓"; setTimeout(function () { e.target.textContent = "Copy code"; }, 1200); }); });
    form.addEventListener("input", preview); form.addEventListener("submit", function (e) { e.preventDefault(); });
    preview();
  }

  window.ETBDev = { formatJson: formatJson, parseJson: parseJson, ideas: ideas, px: px };
  document.addEventListener("DOMContentLoaded", function () {
    var j = document.querySelector("[data-json]"); if (j) initJson(j);
    var m = document.querySelector("form[data-meta]"); if (m) initMeta(m);
  });
})();
