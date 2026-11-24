/* etoolbox – UK degree classification, final grade and Harvard (Cite Them Right) referencing tools. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var r1 = function (x) { return Math.round(x * 100) / 100; };

  // ---------------- Degree classification ----------------
  var CLASSES = [[70, "First-class honours (1st)"], [60, "Upper second-class honours (2:1)"], [50, "Lower second-class honours (2:2)"], [40, "Third-class honours (3rd)"], [0, "Below honours level"]];
  function classify(avg) { for (var i = 0; i < CLASSES.length; i++) if (avg >= CLASSES[i][0]) return { i: i, name: CLASSES[i][1], floor: CLASSES[i][0] }; }
  // years: [{w: weight, avg: mark or null, modules: [{c: credits, m: mark}]}]
  function yearAvg(y) {
    if (y.modules && y.modules.length) { var c = 0, s = 0; y.modules.forEach(function (m) { if (m.c > 0 && m.m >= 0) { c += m.c; s += m.c * m.m; } }); return c ? s / c : null; }
    return y.avg == null || isNaN(y.avg) ? null : y.avg;
  }
  function degree(years) {
    var wt = 0, s = 0, missing = null;
    years.forEach(function (y, i) { var a = yearAvg(y); if (y.w > 0) { if (a == null) { if (missing === null) missing = i; } else { wt += y.w; s += y.w * a; } } });
    var avg = wt ? s / wt : null, out = { avg: avg, missing: missing };
    if (avg != null) { out.cls = classify(avg); var next = CLASSES[out.cls.i - 1]; out.border = next && next[0] - avg <= 2 ? next : null; }
    // what's needed in the first missing year to reach each class
    if (missing !== null) {
      var mw = years[missing].w, tw = wt + mw;
      out.needed = CLASSES.slice(0, 4).map(function (c) { return { name: c[1], need: (c[0] * tw - s) / mw }; });
    }
    return out;
  }

  function initDegree(form) {
    var out = document.getElementById("dg-out"), list = document.getElementById("dg-years"), E = form.elements;
    var SCHEMES = { "0,40,60": [0, 40, 60], "0,30,70": [0, 30, 70], "0,25,75": [0, 25, 75], "0,50,50": [0, 50, 50], "0,33.3,66.7": [0, 1, 2], "0,0,100": [0, 0, 100], "10,30,60": [10, 30, 60], "0,20,30,50": [0, 20, 30, 50] };
    function names(n) { return n === 4 ? ["Year 1", "Year 2", "Placement / Year 3", "Final year"] : ["Year 1", "Year 2", "Final year"]; }
    function build() {
      var w = SCHEMES[E.scheme.value] || [0, 40, 60], nm = names(w.length), prev = {};
      list.querySelectorAll("[data-y]").forEach(function (el) { prev[el.getAttribute("data-y")] = el.querySelector("input.dg-avg").value; });
      list.innerHTML = w.map(function (x, i) {
        return '<div class="dg-year" data-y="' + i + '"><div class="dg-yh"><strong>' + nm[i] + '</strong><label class="dg-w">Weight <input type="number" class="dg-wt" min="0" max="100" step="0.1" value="' + x + '"></label></div>' +
          '<div class="row"><div><label>Average mark (%)</label><input type="number" class="dg-avg" min="0" max="100" step="0.1" placeholder="' + (x ? "e.g. 65" : "doesn't count") + '" value="' + (prev[i] || "") + '"></div>' +
          '<div><button type="button" class="btn ghost sm dg-mods-btn">Use module marks</button></div></div><div class="dg-mods" hidden></div></div>';
      }).join("");
      calc();
    }
    function modRow() { return '<div class="dg-mod"><input type="text" placeholder="Module (optional)" aria-label="Module name"><input type="number" class="dg-c" min="0" max="120" value="20" aria-label="Credits"><input type="number" class="dg-m" min="0" max="100" step="0.1" placeholder="Mark %" aria-label="Mark"><button type="button" class="dg-x" aria-label="Remove module">✕</button></div>'; }
    function read() {
      return Array.prototype.map.call(list.querySelectorAll(".dg-year"), function (el) {
        var mods = el.querySelector(".dg-mods"), m = null;
        if (!mods.hidden) m = Array.prototype.map.call(mods.querySelectorAll(".dg-mod"), function (r) { return { c: +r.querySelector(".dg-c").value || 0, m: r.querySelector(".dg-m").value === "" ? -1 : +r.querySelector(".dg-m").value }; }).filter(function (x) { return x.m >= 0; });
        var a = el.querySelector("input.dg-avg").value;
        return { w: +el.querySelector(".dg-wt").value || 0, avg: a === "" ? null : +a, modules: m && m.length ? m : null };
      });
    }
    function calc() {
      var ys = read(), r = degree(ys);
      list.querySelectorAll(".dg-year").forEach(function (el, i) { var a = yearAvg(ys[i]); if (ys[i].modules) el.querySelector("input.dg-avg").value = a == null ? "" : r1(a); });
      var html = "";
      if (r.avg != null) {
        html += '<div class="due-hero"><span class="due-l">' + (r.missing !== null ? "Predicted so far" : "Your degree classification") + '</span><strong class="due-d">' + r.cls.name + "</strong>" +
          '<span class="due-s">Weighted average <b>' + r1(r.avg) + "%</b></span></div>";
        if (r.border) html += '<p class="dg-border">You\'re within 2% of a <strong>' + r.border[1].replace(/ \(.*/, "") + "</strong>. Many universities review borderline marks, for example if most of your final-year credits are in the higher class. Check your university's rules.</p>";
      } else html += '<p class="muted">Enter your average mark for each year that counts towards your degree.</p>';
      if (r.needed) html += '<h3 class="ms-h">What you need in ' + names(ys.length)[r.missing].toLowerCase() + '</h3><ul class="ms">' + r.needed.map(function (n) {
        var v = n.need, txt = v <= 0 ? "Already secured, even with 0%" : v > 100 ? "Not possible with these marks" : "An average of <strong>" + Math.ceil(v * 10) / 10 + "%</strong>";
        return '<li><span class="ms-d">' + n.name.replace(/ honours/, "") + '</span><span class="ms-n">' + txt + "</span></li>"; }).join("") + "</ul>";
      out.innerHTML = html; form.setAttribute("data-avg", r.avg == null ? "" : r1(r.avg)); form.setAttribute("data-class", r.avg == null ? "" : r.cls.name);
    }
    list.addEventListener("click", function (e) {
      var y = e.target.closest(".dg-year"); if (!y) return;
      if (e.target.classList.contains("dg-mods-btn")) { var m = y.querySelector(".dg-mods"); m.hidden = !m.hidden; if (!m.hidden && !m.children.length) m.innerHTML = '<div class="dg-mh"><span>Module</span><span>Credits</span><span>Mark</span><span></span></div>' + modRow() + modRow() + modRow() + '<button type="button" class="btn ghost sm dg-add">+ Add module</button>'; e.target.textContent = m.hidden ? "Use module marks" : "Hide modules"; calc(); }
      if (e.target.classList.contains("dg-add")) { e.target.insertAdjacentHTML("beforebegin", modRow()); }
      if (e.target.classList.contains("dg-x")) { e.target.closest(".dg-mod").remove(); calc(); }
    });
    list.addEventListener("input", calc); E.scheme.addEventListener("change", build); form.addEventListener("submit", function (e) { e.preventDefault(); });
    build();
  }

  // ---------------- Final grade ----------------
  function needed(current, weight, target) { return weight > 0 ? (target - current * (1 - weight / 100)) / (weight / 100) : NaN; }
  function initFinal(form) {
    var E = form.elements, out = document.getElementById("fg-out");
    function calc() {
      var cur = +E.current.value, w = +E.weight.value, t = +E.target.value;
      if (!(w > 0 && w <= 100) || E.current.value === "" || E.target.value === "") { out.innerHTML = '<p class="muted">Enter your current grade, the weight of the final exam and the grade you want.</p>'; return; }
      var n = needed(cur, w, t), rows = [90, 80, 70, 60, 50, 40].map(function (g) { var x = needed(cur, w, g); return "<tr><td>" + g + "%</td><td>" + (x <= 0 ? "Already there" : x > 100 ? "Not possible" : (Math.ceil(x * 10) / 10) + "%") + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="due-hero"><span class="due-l">You need on the final</span><strong class="due-d">' + (n <= 0 ? "0% – you've already made it" : n > 100 ? "More than 100%" : (Math.ceil(n * 10) / 10) + "%") + "</strong>" +
        '<span class="due-s">to finish with ' + t + "% overall (currently " + cur + "% on the other " + (100 - w) + "%)</span></div>" +
        (n > 100 ? '<p class="warn">Even 100% on the final would give ' + r1(cur * (1 - w / 100) + w) + "% overall.</p>" : "") +
        '<table class="sal-table"><thead><tr><th>Overall grade</th><th>Needed on the final</th></tr></thead><tbody>' + rows + "</tbody></table>";
      form.setAttribute("data-needed", isFinite(n) ? r1(n).toString() : "");
    }
    form.addEventListener("input", calc); form.addEventListener("submit", function (e) { e.preventDefault(); }); calc();
  }

  // ---------------- Harvard referencing (Cite Them Right style) ----------------
  function personName(s) { // "Jane A. Smith" or "Smith, Jane A." -> {sur, ini}
    s = s.trim(); if (!s) return null; var sur, given;
    if (s.indexOf(",") > 0) { sur = s.split(",")[0].trim(); given = s.split(",").slice(1).join(" ").trim(); }
    else { var p = s.split(/\s+/); sur = p.pop(); given = p.join(" "); }
    var ini = given.split(/[\s.-]+/).filter(Boolean).map(function (g) { return g.charAt(0).toUpperCase() + "."; }).join("");
    return { sur: sur, ini: ini, full: ini ? sur + ", " + ini : sur };
  }
  function authorList(lines, org) {
    var a = lines.split(/\n|;/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (org) return { ref: a.join(" and "), cite: a.join(" and "), n: a.length };
    var p = a.map(personName).filter(Boolean), names = p.map(function (x) { return x.full; });
    var ref = names.length <= 1 ? names[0] || "" : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    var cite = p.length === 0 ? "" : p.length === 1 ? p[0].sur : p.length === 2 ? p[0].sur + " and " + p[1].sur : p.length === 3 ? p[0].sur + ", " + p[1].sur + " and " + p[2].sur : p[0].sur + " et al.";
    return { ref: ref, cite: cite, n: p.length };
  }
  function ord(n) { n = +n; var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function accessed(d) { if (!d) return ""; var t = new Date(d + "T00:00:00"); return isNaN(t) ? "" : t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function cite(type, f) { // returns {html, text, intext}
    var au = authorList(f.authors || "", f.org), year = f.year || "no date", who = au.ref || (type === "website" ? f.site || "" : ""), i = "", t = "", parts = [];
    var it = function (s) { return "<i>" + esc(s) + "</i>"; };
    if (type === "book") {
      i = esc(who) + " (" + esc(year) + ") " + it(f.title || "Title") + ". " + (f.edition && +f.edition > 1 ? ord(f.edition) + " edn. " : "") + (f.place ? esc(f.place) + ": " : "") + esc(f.publisher || "") + ".";
    } else if (type === "journal") {
      var pages = f.pages ? (/[-–]/.test(f.pages) ? "pp. " : "p. ") + esc(f.pages.replace("-", "–")) : "";
      i = esc(who) + " (" + esc(year) + ") '" + esc(f.title || "Article title") + "', " + it(f.journal || "Journal") + (f.volume ? ", " + esc(f.volume) + (f.issue ? "(" + esc(f.issue) + ")" : "") : "") + (pages ? ", " + pages : "") + ".";
      if (f.doi) i += " Available at: https://doi.org/" + esc(f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")) + ".";
      else if (f.url) i += " Available at: " + esc(f.url) + " (Accessed: " + esc(accessed(f.accessed)) + ").";
    } else {
      i = esc(who || f.site || "Website") + " (" + esc(year) + ") " + it(f.title || "Page title") + ". Available at: " + esc(f.url || "URL") + " (Accessed: " + esc(accessed(f.accessed)) + ").";
    }
    i = i.replace(/\s+\./g, ".").replace(/\.\./g, ".");
    t = i.replace(/<\/?i>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    var c = au.cite || (type === "website" ? f.site : "") || (f.title || "Anon.");
    return { html: i, text: t, intext: "(" + c + ", " + year + ")" };
  }
  function initHarvard(form) {
    var E = form.elements, out = document.getElementById("hv-out"), listEl = document.getElementById("hv-list"), KEY = "etb-harvard", refs = [];
    try { refs = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
    function fields() { var f = {}; ["authors", "year", "title", "edition", "place", "publisher", "journal", "volume", "issue", "pages", "doi", "url", "accessed", "site"].forEach(function (k) { if (E[k]) f[k] = E[k].value.trim(); }); f.org = E.org.checked; return f; }
    function show() {
      form.querySelectorAll("[data-for]").forEach(function (el) { el.hidden = el.getAttribute("data-for").split(" ").indexOf(E.type.value) < 0; });
      var c = cite(E.type.value, fields());
      out.innerHTML = '<p class="hv-ref">' + c.html + '</p><p class="muted">In-text citation: <strong>' + esc(c.intext) + "</strong></p>";
      form.setAttribute("data-ref", c.text);
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(refs)); } catch (e) {} }
    function renderList() {
      refs.sort(function (a, b) { return a.text.localeCompare(b.text); });
      listEl.innerHTML = refs.length ? refs.map(function (r, i) { return '<li><span>' + r.html + '</span><button type="button" class="dg-x" data-del="' + i + '" aria-label="Remove reference">✕</button></li>'; }).join("") : '<li class="muted">Your reference list is empty. Add references and they\'ll be sorted A–Z here.</li>';
      document.getElementById("hv-copyall").disabled = !refs.length;
    }
    function copyRich(html, text, btn, label) {
      var done = function () { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = label; }, 1500); };
      try { navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]).then(done, function () { navigator.clipboard.writeText(text).then(done); }); }
      catch (e) { navigator.clipboard.writeText(text).then(done); }
    }
    document.getElementById("hv-copy").addEventListener("click", function () { var c = cite(E.type.value, fields()); copyRich(c.html, c.text, this, "Copy reference"); });
    document.getElementById("hv-add").addEventListener("click", function () { var c = cite(E.type.value, fields()); refs.push({ html: c.html, text: c.text }); save(); renderList(); });
    document.getElementById("hv-copyall").addEventListener("click", function () { copyRich(refs.map(function (r) { return "<p>" + r.html + "</p>"; }).join(""), refs.map(function (r) { return r.text; }).join("\n\n"), this, "Copy reference list"); });
    document.getElementById("hv-clear").addEventListener("click", function () { if (!refs.length || confirm("Clear your whole reference list?")) { refs = []; save(); renderList(); } });
    listEl.addEventListener("click", function (e) { var d = e.target.getAttribute("data-del"); if (d !== null) { refs.splice(+d, 1); save(); renderList(); } });
    if (!E.accessed.value) E.accessed.value = new Date().toISOString().slice(0, 10);
    form.addEventListener("input", show); form.addEventListener("change", show); form.addEventListener("submit", function (e) { e.preventDefault(); });
    show(); renderList();
  }

  window.ETBStudy = { degree: degree, classify: classify, needed: needed, cite: cite, authorList: authorList };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-degree]"))) initDegree(f);
    if ((f = document.querySelector("form[data-final]"))) initFinal(f);
    if ((f = document.querySelector("form[data-harvard]"))) initHarvard(f);
  });
})();
