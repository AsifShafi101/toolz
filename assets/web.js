/* etoolbox web tools — DNS checker, email DNS (SPF/DKIM/DMARC) checker, website speed test, API request builder, JWT decoder. */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cleanDomain(s) { return String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^[^@]*@/, "").split(/[/?#:]/)[0].replace(/\.$/, ""); }
  function api(name, type, resolver) {
    return fetch("/api/dns?name=" + encodeURIComponent(name) + "&type=" + type + (resolver ? "&resolver=" + resolver : "")).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Lookup failed"); return j; });
    });
  }

  /* ---------- DNS propagation checker ---------- */
  function initDns(form) {
    var out = document.getElementById("dns-out"), sum = document.getElementById("dns-sum"), btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var name = cleanDomain(form.elements.domain.value), type = form.elements.rtype.value;
      if (!name) { sum.textContent = "Enter a domain name."; return; }
      btn.disabled = true; sum.innerHTML = '<span class="spinner"></span> Asking 8 DNS providers…'; out.innerHTML = "";
      api(name, type).then(function (j) {
        var norm = function (r) { return r.answers.filter(function (a) { return a.type === type; }).map(function (a) { return a.data; }).sort().join(" | "); };
        var counts = {}; j.results.forEach(function (r) { if (r.status === "NOERROR") { var k = norm(r); counts[k] = (counts[k] || 0) + 1; } });
        var main = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || "";
        var agree = j.results.filter(function (r) { return r.status === "NOERROR" && norm(r) === main; }).length;
        out.innerHTML = '<div class="tbl-wrap"><table class="rn-table"><thead><tr><th>Provider</th><th>Result</th><th>TTL</th><th>Time</th></tr></thead><tbody>' + j.results.map(function (r) {
          var vals = r.answers.filter(function (a) { return a.type === type; }), ok = r.status === "NOERROR" && vals.length, same = ok && norm(r) === main;
          return "<tr><td><strong>" + (ok ? (same ? "✅" : "⚠️") : r.status === "NXDOMAIN" ? "❌" : "⚪") + " " + esc(r.resolver) + "</strong></td><td>" +
            (ok ? vals.map(function (a) { return "<code>" + esc(a.data) + "</code>"; }).join("<br>") : '<span class="muted">' + (r.status === "NOERROR" ? "No " + type + " record" : r.status === "NXDOMAIN" ? "Domain not found" : r.status === "ERROR" ? "No response" : r.status) + "</span>") +
            "</td><td>" + (ok ? vals[0].ttl + "s" : "–") + "</td><td>" + r.ms + " ms</td></tr>";
        }).join("") + "</tbody></table></div>";
        out.setAttribute("data-result", JSON.stringify({ agree: agree, total: j.results.length }));
        sum.innerHTML = main ? (agree === j.results.length ? '<b class="good">✓ Fully propagated.</b> All ' + agree + " providers return the same " + type + " record." : "<strong>" + agree + " of " + j.results.length + "</strong> providers return the most common answer. The others may still have the old record cached; it updates when its TTL runs out.")
          : "No " + type + " records found for " + esc(name) + ".";
      }).catch(function (err) { sum.textContent = err.message; }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Email DNS checker (MX, SPF, DMARC, DKIM) ---------- */
  var SELECTORS = ["google", "selector1", "selector2", "default", "k1", "k2", "s1", "s2", "mail", "dkim", "smtp", "mandrill", "zoho", "fm1", "protonmail", "sig1"];
  function parseTags(rec) { var o = {}; rec.split(";").forEach(function (p) { var m = /^\s*([a-z]+)\s*=\s*(.*?)\s*$/i.exec(p); if (m) o[m[1].toLowerCase()] = m[2]; }); return o; }
  function spfLookups(domain, depth, seen) {
    seen = seen || {}; if (depth > 10 || seen[domain]) return Promise.resolve({ count: 0, tree: [] }); seen[domain] = 1;
    return api(domain, "TXT", "cloudflare").then(function (j) {
      var recs = j.results[0].answers.filter(function (a) { return a.type === "TXT" && /^v=spf1\b/i.test(a.data); }).map(function (a) { return a.data; });
      if (!recs.length) return { count: 0, tree: [], missing: true };
      var terms = recs[0].split(/\s+/).slice(1), count = 0, subs = [];
      terms.forEach(function (t) {
        var m = /^[+\-~?]?(include|redirect|a|mx|ptr|exists)(?=$|[:/=])(?:[:=/](.+))?/i.exec(t); if (!m) return;
        count++; var kind = m[1].toLowerCase(); if ((kind === "include" || kind === "redirect") && m[2]) subs.push(m[2]);
      });
      return Promise.all(subs.map(function (s) { return spfLookups(s, depth + 1, seen); })).then(function (rs) {
        return { count: count + rs.reduce(function (n, r) { return n + r.count; }, 0), record: recs[0], multiple: recs.length > 1, tree: subs.map(function (s, i) { return { domain: s, count: rs[i].count }; }) };
      });
    });
  }
  function initEmailDns(form) {
    var out = document.getElementById("edns-out"), btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var d = cleanDomain(form.elements.domain.value), extra = (form.elements.selector.value || "").trim();
      if (!d) { out.innerHTML = '<p class="warn">Enter your email domain, e.g. yourbusiness.co.uk</p>'; return; }
      btn.disabled = true; out.innerHTML = '<p><span class="spinner"></span> Checking ' + esc(d) + "…</p>";
      var sels = extra ? [extra].concat(SELECTORS) : SELECTORS;
      Promise.all([api(d, "MX", "cloudflare"), spfLookups(d, 0), api("_dmarc." + d, "TXT", "cloudflare"),
        Promise.all(sels.map(function (s) { return api(s + "._domainkey." + d, "TXT", "cloudflare").then(function (j) { var a = j.results[0].answers.filter(function (x) { return x.type === "TXT" && /p=/.test(x.data); })[0]; return a ? { sel: s, rec: a.data } : null; }).catch(function () { return null; }); }))
      ]).then(function (r) {
        var mx = r[0].results[0].answers.filter(function (a) { return a.type === "MX"; }).map(function (a) { return a.data; }).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
        var spf = r[1], dm = r[2].results[0].answers.filter(function (a) { return a.type === "TXT" && /^v=DMARC1/i.test(a.data); })[0], dkim = r[3].filter(Boolean);
        var items = [], score = 0;
        var row = function (state, title, body) { items.push('<div class="check-item ' + state + '"><div class="ci-head"><span class="ci-dot"></span><strong>' + title + "</strong></div>" + body + "</div>"); if (state === "ok") score++; };
        row(mx.length ? "ok" : "bad", "MX (receiving email)", mx.length ? "<p>" + mx.map(function (m) { return "<code>" + esc(m) + "</code>"; }).join(" ") + "</p>" : "<p>No MX records, so this domain can't receive email.</p>");
        if (spf.missing || !spf.record) row("bad", "SPF", "<p>No SPF record found. Add a TXT record starting with <code>v=spf1</code> listing the services that send your email, or your messages may go to spam.</p>");
        else {
          var all = (/[~\-?+]?all\b/.exec(spf.record) || [""])[0], st = spf.count > 10 || spf.multiple ? "bad" : /^\+?all$/.test(all) ? "bad" : all === "?all" || !all ? "warn" : "ok";
          row(st, "SPF", "<p><code>" + esc(spf.record) + "</code></p><p>" + spf.count + " of 10 allowed DNS lookups" + (spf.count > 10 ? ' <b class="warn">over the limit, so SPF will fail</b>' : "") + (spf.multiple ? ' · <b class="warn">more than one SPF record, which is invalid</b>' : "") +
            " · ends with <code>" + esc(all || "nothing") + "</code> " + (all === "-all" ? "(strict)" : all === "~all" ? "(soft fail, which is common)" : all === "?all" ? "(neutral, which doesn't protect you)" : /all/.test(all) ? "(allows anyone, which is dangerous)" : "(missing an <code>all</code> rule)") + "</p>");
        }
        if (!dm) row("bad", "DMARC", "<p>No DMARC record. Add a TXT record at <code>_dmarc." + esc(d) + "</code>, for example <code>v=DMARC1; p=none; rua=mailto:dmarc@" + esc(d) + "</code>, then tighten it to <code>p=quarantine</code> once your reports look clean.</p>");
        else { var t = parseTags(dm.data), p = (t.p || "").toLowerCase(); row(p === "reject" || p === "quarantine" ? "ok" : "warn", "DMARC", "<p><code>" + esc(dm.data) + "</code></p><p>Policy: <strong>" + esc(p || "missing") + "</strong>" + (p === "none" ? " (monitoring only, so spoofed emails aren't blocked yet)" : "") + (t.rua ? " · reports sent to " + esc(t.rua) : " · no report address (rua)") + (t.pct && t.pct !== "100" ? " · applies to " + esc(t.pct) + "% of mail" : "") + "</p>"); }
        row(dkim.length ? "ok" : "warn", "DKIM", dkim.length ? dkim.map(function (k) { var key = (/p=([A-Za-z0-9+\/=]+)/.exec(k.rec) || [])[1] || ""; return "<p>Selector <code>" + esc(k.sel) + "</code> ✓" + (key ? " · ~" + Math.round(key.length * 6 / 1024 / 1.37) * 1024 + "-bit key" : " · <b class=\"warn\">empty key (revoked)</b>") + "</p>"; }).join("") : "<p>No DKIM key found on common selectors. DKIM may still be set up under a custom name. Enter your selector above (find it in an email's <code>DKIM-Signature: … s=</code> header).</p>");
        out.innerHTML = '<p class="score-line">Email security score: <strong>' + score + " / 4</strong></p>" + items.join("");
        out.setAttribute("data-result", JSON.stringify({ score: score, mx: mx.length, spf: !!spf.record, dmarc: !!dm, dkim: dkim.map(function (k) { return k.sel; }) }));
      }).catch(function (err) { out.innerHTML = '<p class="warn">' + esc(err.message) + "</p>"; }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Website speed test (Google PageSpeed Insights) ---------- */
  var METRICS = [["largest-contentful-paint", "Largest Contentful Paint", "LCP"], ["cumulative-layout-shift", "Cumulative Layout Shift", "CLS"], ["total-blocking-time", "Total Blocking Time", "TBT"], ["first-contentful-paint", "First Contentful Paint", "FCP"], ["speed-index", "Speed Index", "SI"]];
  var FIELD = [["LARGEST_CONTENTFUL_PAINT_MS", "LCP", function (v) { return (v / 1000).toFixed(1) + " s"; }], ["INTERACTION_TO_NEXT_PAINT", "INP", function (v) { return v + " ms"; }], ["CUMULATIVE_LAYOUT_SHIFT_SCORE", "CLS", function (v) { return (v / 100).toFixed(2); }]];
  function gauge(score, label) { var s = Math.round(score * 100), c = s >= 90 ? "ok" : s >= 50 ? "warn" : "bad"; return '<div class="gauge ' + c + '"><div class="g-ring" style="--p:' + s + '"><span>' + s + "</span></div><div>" + label + "</div></div>"; }
  function initSpeed(form) {
    var out = document.getElementById("ps-out"), btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var u = form.elements.url.value.trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = "https://" + u;
      var strategy = form.elements.strategy.value;
      btn.disabled = true; out.innerHTML = '<p><span class="spinner"></span> Testing ' + esc(u) + " on " + strategy + "… this takes 15–40 seconds.</p>";
      var q = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodeURIComponent(u) + "&strategy=" + strategy + ["performance", "accessibility", "best-practices", "seo"].map(function (c) { return "&category=" + c; }).join("");
      fetch(q).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(r.status === 429 ? "Google's free testing limit has been reached for now. Please try again in a few minutes." : (j.error && j.error.message) || "The test failed."); return j; }); }).then(function (j) {
        var lh = j.lighthouseResult, cats = lh.categories, au = lh.audits, fe = (j.loadingExperience && j.loadingExperience.metrics) || null;
        var opp = Object.keys(au).map(function (k) { return au[k]; }).filter(function (a) { return a.details && a.details.type === "opportunity" && a.score !== null && a.score < 0.9 && a.details.overallSavingsMs > 50; }).sort(function (a, b) { return b.details.overallSavingsMs - a.details.overallSavingsMs; }).slice(0, 6);
        out.innerHTML = '<div class="gauges">' + gauge(cats.performance.score, "Performance") + gauge(cats.accessibility.score, "Accessibility") + gauge(cats["best-practices"].score, "Best practices") + gauge(cats.seo.score, "SEO") + "</div>" +
          "<h3>Core Web Vitals: real visitors (last 28 days)</h3>" + (fe ? '<div class="calc-out">' + FIELD.map(function (f) { var m = fe[f[0]]; if (!m) return ""; var c = m.category === "FAST" ? "good" : m.category === "AVERAGE" ? "muted" : "warn"; return '<div class="calc-row"><span>' + f[1] + '</span><strong class="' + c + '">' + f[2](m.percentile) + " · " + (m.category === "FAST" ? "Good" : m.category === "AVERAGE" ? "Needs improvement" : "Poor") + "</strong></div>"; }).join("") + "</div>" : '<p class="muted">Not enough real-visitor data for this page yet (Google needs a reasonable amount of Chrome traffic). The lab results below still apply.</p>') +
          "<h3>Lab test</h3><div class=\"calc-out\">" + METRICS.map(function (m) { var a = au[m[0]]; return a ? '<div class="calc-row"><span>' + m[1] + " (" + m[2] + ')</span><strong class="' + (a.score >= 0.9 ? "good" : a.score >= 0.5 ? "muted" : "warn") + '">' + esc(a.displayValue) + "</strong></div>" : ""; }).join("") + "</div>" +
          (opp.length ? "<h3>Top improvements</h3><ul class=\"opp\">" + opp.map(function (a) { return "<li><strong>" + esc(a.title) + "</strong> <span class=\"muted\">· save ~" + (a.details.overallSavingsMs / 1000).toFixed(1) + "s</span></li>"; }).join("") + "</ul>" : "");
        out.setAttribute("data-result", JSON.stringify({ performance: cats.performance.score }));
      }).catch(function (err) { out.innerHTML = '<p class="warn">' + esc(err.message) + "</p>"; }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- API request builder ---------- */
  function parseHeaders(t) { var h = {}; String(t || "").split("\n").forEach(function (l) { var i = l.indexOf(":"); if (i > 0) h[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }); return h; }
  function codeFor(o) {
    var h = parseHeaders(o.headers), hasBody = o.body && !/^(GET|HEAD)$/.test(o.method);
    var curl = "curl -X " + o.method + " '" + o.url.replace(/'/g, "'\\''") + "'" + Object.keys(h).map(function (k) { return " \\\n  -H '" + (k + ": " + h[k]).replace(/'/g, "'\\''") + "'"; }).join("") + (hasBody ? " \\\n  --data '" + o.body.replace(/'/g, "'\\''") + "'" : "");
    var js = "const res = await fetch(" + JSON.stringify(o.url) + ", {\n  method: " + JSON.stringify(o.method) + (Object.keys(h).length ? ",\n  headers: " + JSON.stringify(h, null, 2).replace(/\n/g, "\n  ") : "") + (hasBody ? ",\n  body: " + JSON.stringify(o.body) : "") + "\n});\nconsole.log(res.status, await res.text());";
    var py = "import requests\n\nres = requests.request(" + JSON.stringify(o.method) + ", " + JSON.stringify(o.url) + (Object.keys(h).length ? ",\n    headers=" + JSON.stringify(h) : "") + (hasBody ? ",\n    data=" + JSON.stringify(o.body) : "") + ")\nprint(res.status_code, res.text)";
    return { curl: curl, js: js, python: py };
  }
  function initApi(form) {
    var out = document.getElementById("api-out"), code = document.getElementById("api-code");
    function o() { return { method: form.elements.method.value, url: form.elements.url.value.trim(), headers: form.elements.headers.value, body: form.elements.body.value }; }
    function showCode() { var c = codeFor(o()); code.textContent = c[form.elements.lang.value]; }
    form.addEventListener("input", showCode); form.addEventListener("change", showCode);
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var x = o(); if (!/^https?:\/\//i.test(x.url)) { out.innerHTML = '<p class="warn">Enter a full URL starting with https://</p>'; return; }
      var t0 = performance.now(); out.innerHTML = '<p><span class="spinner"></span> Sending…</p>';
      var init = { method: x.method, headers: parseHeaders(x.headers) }; if (x.body && !/^(GET|HEAD)$/.test(x.method)) init.body = x.body;
      fetch(x.url, init).then(function (r) {
        return r.text().then(function (t) {
          var ms = Math.round(performance.now() - t0), pretty = t; try { pretty = JSON.stringify(JSON.parse(t), null, 2); } catch (er) {}
          var hs = []; r.headers.forEach(function (v, k) { hs.push([k, v]); });
          out.innerHTML = '<p><span class="status-pill ' + (r.ok ? "ok" : "bad") + '">' + r.status + " " + esc(r.statusText) + "</span> " + ms + " ms · " + new Blob([t]).size.toLocaleString("en-GB") + " bytes</p>" +
            "<details open><summary>Body</summary><pre class=\"code-out\">" + esc(pretty.slice(0, 200000)) + "</pre></details><details><summary>Headers (" + hs.length + ")</summary><pre class=\"code-out\">" + esc(hs.map(function (h) { return h[0] + ": " + h[1]; }).join("\n")) + "</pre></details>";
          out.setAttribute("data-status", r.status);
        });
      }).catch(function () {
        out.innerHTML = '<p class="warn"><strong>The request was blocked or failed.</strong> Browsers only allow requests to APIs that permit it (CORS), so many APIs can\'t be called from a web page. Copy the cURL command below and run it in a terminal instead. That always works.</p>';
        out.setAttribute("data-status", "blocked");
      });
    });
    showCode();
  }

  /* ---------- JWT decoder ---------- */
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function decodeJwt(t) {
    var p = String(t).trim().replace(/^Bearer\s+/i, "").split(".");
    if (p.length < 2) throw new Error("A JWT has three parts separated by dots.");
    var h, b; try { h = JSON.parse(b64d(p[0])); b = JSON.parse(b64d(p[1])); } catch (e) { throw new Error("That doesn't look like a valid JWT."); }
    return { header: h, payload: b, signature: p[2] || "" };
  }
  function initJwt(form) {
    var out = document.getElementById("jwt-out");
    function run() {
      var t = form.elements.token.value.trim(); if (!t) { out.innerHTML = '<p class="muted">Paste a token to decode it.</p>'; return; }
      try {
        var r = decodeJwt(t), now = Date.now() / 1000, times = ["iat", "nbf", "exp"].filter(function (k) { return typeof r.payload[k] === "number"; });
        var status = typeof r.payload.exp === "number" ? (r.payload.exp < now ? '<b class="warn">Expired ' + new Date(r.payload.exp * 1000).toLocaleString("en-GB") + "</b>" : '<b class="good">Valid until ' + new Date(r.payload.exp * 1000).toLocaleString("en-GB") + "</b>") : '<span class="muted">No expiry (exp) claim</span>';
        out.innerHTML = "<p>" + status + " · algorithm <code>" + esc(r.header.alg) + "</code></p><h3>Header</h3><pre class=\"code-out\">" + esc(JSON.stringify(r.header, null, 2)) + "</pre><h3>Payload</h3><pre class=\"code-out\">" + esc(JSON.stringify(r.payload, null, 2)) + "</pre>" +
          (times.length ? '<div class="calc-out">' + times.map(function (k) { return '<div class="calc-row"><span>' + ({ iat: "Issued", nbf: "Not before", exp: "Expires" })[k] + " (" + k + ")</span><strong>" + new Date(r.payload[k] * 1000).toLocaleString("en-GB") + "</strong></div>"; }).join("") + "</div>" : "") +
          '<p class="muted">The signature isn\'t verified here, so never trust a token\'s contents without checking it on your server.</p>';
        out.setAttribute("data-result", JSON.stringify(r.payload));
      } catch (e) { out.innerHTML = '<p class="warn">' + esc(e.message) + "</p>"; }
    }
    form.addEventListener("input", run); form.addEventListener("submit", function (e) { e.preventDefault(); }); run();
  }

  window.ETBWeb = { codeFor: codeFor, decodeJwt: decodeJwt, parseTags: parseTags, cleanDomain: cleanDomain };
  document.addEventListener("DOMContentLoaded", function () {
    var f; if ((f = document.querySelector("form[data-dns]"))) initDns(f);
    if ((f = document.querySelector("form[data-emaildns]"))) initEmailDns(f);
    if ((f = document.querySelector("form[data-speed]"))) initSpeed(f);
    if ((f = document.querySelector("form[data-api]"))) initApi(f);
    if ((f = document.querySelector("form[data-jwt]"))) initJwt(f);
  });
})();
