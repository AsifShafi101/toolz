/* etoolbox text tools — word counter, case converter, password generator. */
(function () {
  "use strict";

  function stats(t) {
    var trimmed = t.trim();
    var words = trimmed ? trimmed.split(/\s+/).filter(function (w) { return /[\p{L}\p{N}]/u.test(w); }).length : 0;
    var sentences = trimmed ? (trimmed.match(/[^.!?…]+([.!?…]+|$)/g) || []).filter(function (s) { return /[\p{L}\p{N}]/u.test(s); }).length : 0;
    var paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length : 0;
    var chars = Array.from(t).length, noSpace = Array.from(t.replace(/\s/g, "")).length;
    var mins = words / 238, speak = words / 150;
    function dur(m) { if (!words) return "0 sec"; var s = Math.max(1, Math.round(m * 60)); return s < 60 ? s + " sec" : Math.round(s / 60) + " min"; }
    return { words: words, chars: chars, noSpace: noSpace, sentences: sentences, paragraphs: paragraphs, reading: dur(mins), speaking: dur(speak) };
  }

  var SMALL = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|per|the|to|vs?\.?|via|with)$/i;
  function wordsOf(t) { return t.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_\-]+/g, " ").trim().split(/\s+/).filter(Boolean); }
  var cases = {
    upper: function (t) { return t.toUpperCase(); },
    lower: function (t) { return t.toLowerCase(); },
    title: function (t) {
      return t.toLowerCase().replace(/[^\s]+/g, function (w, i) {
        if (i > 0 && SMALL.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).replace(/([.!?:]\s+)([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
    },
    sentence: function (t) {
      return t.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)([\p{L}])/gu, function (m, p, c) { return p + c.toUpperCase(); }).replace(/\bi\b/g, "I");
    },
    camel: function (t) { return t.split("\n").map(function (l) { return wordsOf(l).map(function (w, i) { w = w.toLowerCase(); return i ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(""); }).join("\n"); },
    snake: function (t) { return t.split("\n").map(function (l) { return wordsOf(l).join("_").toLowerCase(); }).join("\n"); },
    kebab: function (t) { return t.split("\n").map(function (l) { return wordsOf(l).join("-").toLowerCase(); }).join("\n"); },
    alternating: function (t) { var i = 0; return t.replace(/\p{L}/gu, function (c) { return (i++ % 2) ? c.toUpperCase() : c.toLowerCase(); }); }
  };

  var SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.?/" };
  var AMBIG = /[Il1O0o]/g;
  function randInt(n) { var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do { crypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % n; }
  function password(o) {
    var pools = ["lower", "upper", "digits", "symbols"].filter(function (k) { return o[k]; }).map(function (k) { return o.noAmbig ? SETS[k].replace(AMBIG, "") : SETS[k]; });
    if (!pools.length) return { error: "Pick at least one type of character." };
    var len = Math.max(4, Math.min(128, o.length || 16)), all = pools.join(""), chars = [];
    pools.forEach(function (p) { chars.push(p[randInt(p.length)]); });           // at least one of each chosen type
    while (chars.length < len) chars.push(all[randInt(all.length)]);
    for (var i = chars.length - 1; i > 0; i--) { var j = randInt(i + 1), t = chars[i]; chars[i] = chars[j]; chars[j] = t; }
    var bits = Math.round(len * Math.log2(all.length));
    return { value: chars.join(""), bits: bits, strength: bits < 45 ? "Weak" : bits < 70 ? "OK" : bits < 100 ? "Strong" : "Very strong" };
  }

  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = o; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  }

  function initCounter(root) {
    var ta = root.querySelector("textarea"), out = document.getElementById("stats");
    function upd() {
      var s = stats(ta.value);
      out.innerHTML = [["Words", s.words], ["Characters", s.chars], ["Characters (no spaces)", s.noSpace], ["Sentences", s.sentences], ["Paragraphs", s.paragraphs], ["Reading time", s.reading], ["Speaking time", s.speaking]]
        .map(function (r) { return '<div class="stat"><strong>' + (typeof r[1] === "number" ? r[1].toLocaleString("en-GB") : r[1]) + "</strong><span>" + r[0] + "</span></div>"; }).join("");
      out.setAttribute("data-stats", JSON.stringify(s));
    }
    ta.addEventListener("input", upd); upd();
  }

  function initCase(root) {
    var ta = root.querySelector("textarea");
    Array.prototype.forEach.call(root.querySelectorAll("[data-case]"), function (b) {
      b.addEventListener("click", function () { ta.value = cases[b.getAttribute("data-case")](ta.value); ta.dispatchEvent(new Event("input")); });
    });
    document.getElementById("copy-text").addEventListener("click", function (e) { copy(ta.value, e.currentTarget); });
    document.getElementById("clear-text").addEventListener("click", function () { ta.value = ""; ta.focus(); });
  }

  function initPassword(form) {
    var out = document.getElementById("pw-out"), meta = document.getElementById("pw-meta"), lenOut = document.getElementById("len-val");
    function gen() {
      var e = form.elements;
      lenOut.textContent = e.pwlen.value;
      var r = password({ length: parseInt(e.pwlen.value, 10), lower: e.lower.checked, upper: e.upper.checked, digits: e.digits.checked, symbols: e.symbols.checked, noAmbig: e.noambig.checked });
      if (r.error) { out.value = ""; meta.textContent = r.error; return; }
      out.value = r.value; meta.innerHTML = "Strength: <strong>" + r.strength + "</strong> (" + r.bits + " bits)";
      meta.setAttribute("data-strength", r.strength);
    }
    form.addEventListener("input", gen); form.addEventListener("change", gen);
    form.addEventListener("submit", function (e) { e.preventDefault(); gen(); });
    document.getElementById("pw-new").addEventListener("click", gen);
    document.getElementById("pw-copy").addEventListener("click", function (e) { copy(out.value, e.currentTarget); });
    gen();
  }

  window.ETBText = { stats: stats, cases: cases, password: password };
  document.addEventListener("DOMContentLoaded", function () {
    var t = document.querySelector("[data-text]"); if (!t) return;
    var k = t.getAttribute("data-text");
    if (k === "counter") initCounter(t); else if (k === "case") initCase(t); else if (k === "password") initPassword(t);
  });
})();
