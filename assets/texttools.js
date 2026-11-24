/* etoolbox – text tools: lorem ipsum, find & replace, sort & de-duplicate lines, slug generator, text diff. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function copyBtn(btn, getText) { btn.addEventListener("click", function () { var b = this, label = b.textContent; (navigator.clipboard ? navigator.clipboard.writeText(getText()) : Promise.reject()).then(function () { b.textContent = "Copied!"; setTimeout(function () { b.textContent = label; }, 1400); }); }); }
  function rnd(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }

  // ---------------- Lorem ipsum ----------------
  var LATIN = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum " +
    "praesent elementum facilisis leo vel fringilla est ullamcorper eget nulla facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui faucibus ornare suspendisse sed nisi lacus sed viverra tellus hac habitasse platea dictumst vestibulum rhoncus pellentesque eleifend donec pretium vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae").split(" ");
  var OPEN = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";
  function sentence() { var n = 7 + rnd(9), w = []; for (var i = 0; i < n; i++) w.push(LATIN[rnd(LATIN.length)]); if (n > 9) w[rnd(n - 4) + 2] += ","; var s = w.join(" "); return s.charAt(0).toUpperCase() + s.slice(1) + "."; }
  function paragraph() { var n = 4 + rnd(4), s = []; for (var i = 0; i < n; i++) s.push(sentence()); return s.join(" "); }
  function lorem(kind, count, start) {
    count = Math.max(1, Math.min(kind === "words" ? 5000 : 200, +count || 1)); var out;
    if (kind === "words") { var w = []; for (var i = 0; i < count; i++) w.push(LATIN[rnd(LATIN.length)]); if (start) w.splice(0, Math.min(8, count), ...OPEN.replace(",", "").toLowerCase().split(" ").slice(0, Math.min(8, count))); out = [w.join(" ")]; out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1); }
    else if (kind === "sentences") { out = []; for (var j = 0; j < count; j++) out.push(sentence()); if (start) out[0] = OPEN + "."; out = [out.join(" ")]; }
    else { out = []; for (var k = 0; k < count; k++) out.push(paragraph()); if (start) out[0] = OPEN + ". " + out[0]; }
    return out;
  }
  function initLorem(form) {
    var E = form.elements, out = document.getElementById("lo-out");
    function gen() { var p = lorem(E.kind.value, E.count.value, E.start.checked); out.value = E.html.checked ? p.map(function (x) { return "<p>" + x + "</p>"; }).join("\n") : p.join("\n\n"); form.setAttribute("data-words", String((out.value.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length)); }
    document.getElementById("lo-gen").addEventListener("click", gen); form.addEventListener("change", gen); form.addEventListener("submit", function (e) { e.preventDefault(); gen(); });
    copyBtn(document.getElementById("lo-copy"), function () { return out.value; }); gen();
  }

  // ---------------- Find & replace ----------------
  function buildRe(find, o) {
    if (!find) return null;
    var src = o.regex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (o.word) src = "\\b(?:" + src + ")\\b";
    return new RegExp(src, "g" + (o.cs ? "" : "i") + (o.regex ? "m" : ""));
  }
  function replaceAll(text, find, rep, o) {
    var re = buildRe(find, o); if (!re) return { text: text, n: 0 };
    var n = 0; var res = text.replace(re, function () { n++; var args = arguments; return o.regex ? rep.replace(/\$(\d)/g, function (m, d) { return args[+d] === undefined ? "" : args[+d]; }).replace(/\\n/g, "\n").replace(/\\t/g, "\t") : rep; });
    return { text: res, n: n };
  }
  function initFind(form) {
    var E = form.elements, msg = document.getElementById("fr-msg"), prev = document.getElementById("fr-prev");
    function opts() { return { cs: E.cs.checked, word: E.word.checked, regex: E.regex.checked }; }
    function preview() {
      var t = E.text.value, re; msg.textContent = "";
      try { re = buildRe(E.find.value, opts()); } catch (e) { msg.textContent = "That regular expression isn't valid: " + e.message; prev.innerHTML = ""; return; }
      if (!re) { prev.innerHTML = ""; form.setAttribute("data-count", "0"); return; }
      var src = t.slice(0, 20000), html = "", last = 0, m, total = 0; re.lastIndex = 0;
      while ((m = re.exec(src))) { if (m[0] === "") { re.lastIndex++; continue; } html += esc(src.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>"; last = m.index + m[0].length; }
      html += esc(src.slice(last)); total = (t.match(re) || []).filter(function (x) { return x !== ""; }).length; prev.innerHTML = html; msg.textContent = total + (total === 1 ? " match" : " matches"); form.setAttribute("data-count", String(total));
    }
    document.getElementById("fr-go").addEventListener("click", function () {
      try { var r = replaceAll(E.text.value, E.find.value, E.rep.value, opts()); E.text.value = r.text; preview(); msg.textContent = "Replaced " + r.n + (r.n === 1 ? " match." : " matches."); form.setAttribute("data-replaced", String(r.n)); }
      catch (e) { msg.textContent = "That regular expression isn't valid: " + e.message; }
    });
    copyBtn(document.getElementById("fr-copy"), function () { return E.text.value; });
    form.addEventListener("input", preview); form.addEventListener("change", preview); form.addEventListener("submit", function (e) { e.preventDefault(); }); preview();
  }

  // ---------------- Sort & de-duplicate lines ----------------
  function sortLines(text, o) {
    var lines = text.split(/\r?\n/), before = lines.length;
    if (o.trim) lines = lines.map(function (l) { return l.trim(); });
    if (o.empty) lines = lines.filter(function (l) { return l.trim() !== ""; });
    var dups = 0;
    if (o.dedupe) { var seen = {}; lines = lines.filter(function (l) { var k = o.ci ? l.toLowerCase() : l; if (seen[k]) { dups++; return false; } seen[k] = 1; return true; }); }
    var coll = new Intl.Collator("en-GB", { numeric: true, sensitivity: o.ci ? "base" : "variant" });
    if (o.sort === "az") lines.sort(coll.compare); else if (o.sort === "za") lines.sort(function (a, b) { return coll.compare(b, a); });
    else if (o.sort === "len") lines.sort(function (a, b) { return a.length - b.length || coll.compare(a, b); }); else if (o.sort === "lenr") lines.sort(function (a, b) { return b.length - a.length || coll.compare(a, b); });
    else if (o.sort === "rev") lines.reverse(); else if (o.sort === "shuffle") for (var i = lines.length - 1; i > 0; i--) { var j = rnd(i + 1), t = lines[i]; lines[i] = lines[j]; lines[j] = t; }
    return { text: lines.join("\n"), before: before, after: lines.length, dups: dups };
  }
  function initSort(form) {
    var E = form.elements, out = document.getElementById("so-out"), msg = document.getElementById("so-msg");
    function run() {
      var r = sortLines(E.text.value, { sort: E.sort.value, dedupe: E.dedupe.checked, ci: E.ci.checked, trim: E.trim.checked, empty: E.empty.checked });
      out.value = r.text; msg.textContent = r.before + " lines in → " + r.after + " lines out" + (E.dedupe.checked ? " · " + r.dups + " duplicate" + (r.dups === 1 ? "" : "s") + " removed" : "");
      form.setAttribute("data-out", String(r.after));
    }
    form.addEventListener("input", run); form.addEventListener("change", run); form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("so-shuffle").addEventListener("click", run);
    copyBtn(document.getElementById("so-copy"), function () { return out.value; }); run();
  }

  // ---------------- Slug generator ----------------
  var STOP = "a an and are as at be but by for from how in into is it of on or our that the their this to was what when where which who why will with your".split(" ");
  function slugify(s, o) {
    o = o || {}; var sep = o.sep == null ? "-" : o.sep;
    var t = String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/æ/gi, "ae").replace(/ø/gi, "o").replace(/&/g, " and ").replace(/['’]/g, "");
    if (o.lower !== false) t = t.toLowerCase();
    var words = t.split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (o.stop) { var k = words.filter(function (w) { return STOP.indexOf(w.toLowerCase()) < 0; }); if (k.length) words = k; }
    var out = words.join(sep);
    if (o.max > 0 && out.length > o.max) { out = out.slice(0, o.max); var cut = out.lastIndexOf(sep); if (sep && cut > o.max * 0.5) out = out.slice(0, cut); }
    return out;
  }
  function initSlug(form) {
    var E = form.elements, out = document.getElementById("sg-out");
    function run() {
      var o = { sep: E.sep.value, lower: E.lower.checked, stop: E.stop.checked, max: +E.max.value || 0 };
      out.value = E.text.value.split(/\r?\n/).map(function (l) { return l.trim() ? slugify(l, o) : ""; }).join("\n");
      document.getElementById("sg-url").textContent = out.value ? "https://example.com/" + out.value.split("\n")[0] + "/" : "";
      form.setAttribute("data-slug", out.value.split("\n")[0]);
    }
    form.addEventListener("input", run); form.addEventListener("change", run); form.addEventListener("submit", function (e) { e.preventDefault(); });
    copyBtn(document.getElementById("sg-copy"), function () { return out.value; }); run();
  }

  // ---------------- Text diff ----------------
  function lcsOps(a, b) { // ops: [type, item] with type " ", "-", "+"
    var n = a.length, m = b.length, pre = 0, suf = 0;
    while (pre < n && pre < m && a[pre] === b[pre]) pre++;
    while (suf < n - pre && suf < m - pre && a[n - 1 - suf] === b[m - 1 - suf]) suf++;
    var A = a.slice(pre, n - suf), B = b.slice(pre, m - suf), N = A.length, M = B.length, ops = [];
    if (N * M > 9e6) { A.forEach(function (x) { ops.push(["-", x]); }); B.forEach(function (x) { ops.push(["+", x]); }); }
    else {
      var dp = new Array(N + 1); for (var i = 0; i <= N; i++) dp[i] = new Uint16Array(M + 1);
      for (i = N - 1; i >= 0; i--) for (var j = M - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      i = 0; j = 0; while (i < N && j < M) { if (A[i] === B[j]) { ops.push([" ", A[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(["-", A[i++]]); else ops.push(["+", B[j++]]); }
      while (i < N) ops.push(["-", A[i++]]); while (j < M) ops.push(["+", B[j++]]);
    }
    return a.slice(0, pre).map(function (x) { return [" ", x]; }).concat(ops, a.slice(n - suf).map(function (x) { return [" ", x]; }));
  }
  function wordDiff(x, y) {
    var ta = x.match(/\s+|[^\s]+/g) || [], tb = y.match(/\s+|[^\s]+/g) || [], ops = lcsOps(ta, tb), l = "", r = "";
    ops.forEach(function (o) { if (o[0] === " ") { l += esc(o[1]); r += esc(o[1]); } else if (o[0] === "-") l += "<del>" + esc(o[1]) + "</del>"; else r += "<ins>" + esc(o[1]) + "</ins>"; });
    return [l, r];
  }
  function diff(a, b, o) {
    var norm = function (s) { return o.ws ? s.replace(/\s+/g, " ").trim() : s; }, ci = function (s) { return o.ci ? norm(s).toLowerCase() : norm(s); };
    var la = a.split(/\r?\n/), lb = b.split(/\r?\n/), ka = la.map(ci), kb = lb.map(ci), ops = lcsOps(ka, kb), ia = 0, ib = 0, rows = [], add = 0, del = 0;
    ops.forEach(function (op) { if (op[0] === " ") rows.push({ t: " ", a: la[ia++], b: lb[ib++], na: ia, nb: ib }); else if (op[0] === "-") { rows.push({ t: "-", a: la[ia++], na: ia }); del++; } else { rows.push({ t: "+", b: lb[ib++], nb: ib }); add++; } });
    // pair up neighbouring removed/added lines as changes with word-level highlights
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].t === "-") { var j = i; while (j < rows.length && rows[j].t === "-") j++; var k = j; while (k < rows.length && rows[k].t === "+") k++;
        var dels = rows.slice(i, j), adds = rows.slice(j, k), p = Math.min(dels.length, adds.length);
        for (var q = 0; q < Math.max(dels.length, adds.length); q++) { if (q < p) { var w = wordDiff(dels[q].a, adds[q].b); out.push({ t: "~", a: w[0], b: w[1], na: dels[q].na, nb: adds[q].nb }); } else if (q < dels.length) out.push({ t: "-", a: esc(dels[q].a), na: dels[q].na }); else out.push({ t: "+", b: esc(adds[q].b), nb: adds[q].nb }); }
        i = k - 1; } else out.push(rows[i].t === " " ? { t: " ", a: esc(rows[i].a), b: esc(rows[i].b), na: rows[i].na, nb: rows[i].nb } : { t: "+", b: esc(rows[i].b), nb: rows[i].nb });
    }
    return { rows: out, added: add, removed: del, same: !add && !del };
  }
  function initDiff(form) {
    var E = form.elements, out = document.getElementById("df-out"), msg = document.getElementById("df-msg");
    function run() {
      var r = diff(E.a.value, E.b.value, { ci: E.ci.checked, ws: E.ws.checked });
      var ch = r.rows.filter(function (x) { return x.t === "~"; }).length, ad = r.added - ch, rm = r.removed - ch, pl = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };
      msg.innerHTML = r.same ? '<strong class="good">The two texts are identical.</strong>' : [ch ? '<span class="df-chg">' + pl(ch, "line") + " changed</span>" : "", ad ? '<span class="df-add">' + pl(ad, "line") + " added</span>" : "", rm ? '<span class="df-del">' + pl(rm, "line") + " removed</span>" : ""].filter(Boolean).join(" · ");
      out.innerHTML = r.same ? "" : '<table class="df"><tbody>' + r.rows.map(function (x) {
        var cls = { " ": "", "-": "df-r", "+": "df-a", "~": "df-c" }[x.t];
        return '<tr class="' + cls + '"><td class="df-n">' + (x.na || "") + '</td><td class="df-l">' + (x.a !== undefined ? x.a || "&nbsp;" : "") + '</td><td class="df-n">' + (x.nb || "") + '</td><td class="df-l">' + (x.b !== undefined ? x.b || "&nbsp;" : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
      form.setAttribute("data-added", String(r.added)); form.setAttribute("data-removed", String(r.removed));
    }
    var tm = 0; form.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(run, 250); }); form.addEventListener("change", run); form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    document.getElementById("df-swap").addEventListener("click", function () { var t = E.a.value; E.a.value = E.b.value; E.b.value = t; run(); });
    run();
  }

  window.ETBText = { lorem: lorem, replaceAll: replaceAll, sortLines: sortLines, slugify: slugify, diff: function (a, b, o) { var r = diff(a, b, o || {}); return { added: r.added, removed: r.removed, same: r.same, changed: r.rows.filter(function (x) { return x.t === "~"; }).length }; } };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-lorem]"))) initLorem(f);
    if ((f = document.querySelector("form[data-findrep]"))) initFind(f);
    if ((f = document.querySelector("form[data-sortlines]"))) initSort(f);
    if ((f = document.querySelector("form[data-slug]"))) initSlug(f);
    if ((f = document.querySelector("form[data-diff]"))) initDiff(f);
  });
})();
