/* etoolbox – developer tools: regex tester, Base64, URL encode, UUID, hash, Unix timestamp, CSV↔JSON, SQL formatter,
   cron explainer, CSS gradient. Everything runs in the browser. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function copyBtn(btn, get) { btn.addEventListener("click", function () { var t = get(); if (!t) return; navigator.clipboard.writeText(t).then(function () { var o = btn.textContent; btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = o; }, 1300); }); }); }
  function saveText(text, name, type) { var a = document.createElement("a"), u = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }
  function noSubmit(f) { f.addEventListener("submit", function (e) { e.preventDefault(); }); }

  // ---------------- Regex (runs in a worker so a runaway pattern can't freeze the page) ----------------
  var RX_WORKER = "onmessage=function(e){var d=e.data,out={m:[],r:null};try{var re=new RegExp(d.p,d.f.indexOf('g')<0?d.f+'g':d.f),m,n=0;while((m=re.exec(d.t))&&n<1000){out.m.push({i:m.index,t:m[0],g:m.slice(1),n:m.groups||null});n++;if(m[0]==='')re.lastIndex++;}out.more=!!m;if(d.rep!==null){out.r=d.t.replace(new RegExp(d.p,d.f),d.rep);}}catch(x){out.err=x.message}postMessage(out)}";
  function regexRun(p, f, t, rep) {
    return new Promise(function (res) {
      var w = new Worker(URL.createObjectURL(new Blob([RX_WORKER], { type: "text/javascript" }))), done = false;
      var timer = setTimeout(function () { if (!done) { w.terminate(); res({ err: "This pattern took too long (over 1.5 seconds). It may backtrack catastrophically; try making it more specific.", m: [] }); } }, 1500);
      w.onmessage = function (e) { done = true; clearTimeout(timer); w.terminate(); res(e.data); };
      w.postMessage({ p: p, f: f, t: t, rep: rep });
    });
  }
  var RX_PRESETS = { email: ["[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+", "gi"], postcode: ["\\b[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}\\b", "gi"], phone: ["(?:\\+44\\s?7\\d{3}|\\(?07\\d{3}\\)?)\\s?\\d{3}\\s?\\d{3}", "g"], url: ["https?:\\/\\/[^\\s/$.?#].[^\\s]*", "gi"], date: ["\\b(0?[1-9]|[12]\\d|3[01])\\/(0?[1-9]|1[0-2])\\/(\\d{4})\\b", "g"], ni: ["\\b[A-CEGHJ-PR-TW-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-D]\\b", "gi"] };
  function initRegex(form) {
    var E = form.elements, out = $("rx-out"), list = $("rx-list"), msg = $("rx-msg"), seq = 0;
    function flags() { return ["g", "i", "m", "s", "u"].filter(function (f) { return E["f" + f].checked; }).join(""); }
    function run() {
      var my = ++seq, p = E.pattern.value, t = E.text.value, rep = E.userep.checked ? E.rep.value : null;
      $("rx-repbox").hidden = !E.userep.checked;
      if (!p) { out.innerHTML = esc(t); list.innerHTML = ""; msg.textContent = "Type a pattern to see matches."; form.setAttribute("data-count", "0"); return; }
      regexRun(p, flags(), t, rep).then(function (r) {
        if (my !== seq) return;
        if (r.err) { msg.innerHTML = "<span class='warn'>" + esc(r.err) + "</span>"; out.innerHTML = esc(t); list.innerHTML = ""; form.setAttribute("data-count", "err"); return; }
        var html = "", last = 0; r.m.forEach(function (m, k) { if (!E.fg.checked && k > 0) return; html += esc(t.slice(last, m.i)) + "<mark>" + (esc(m.t) || "&#8203;") + "</mark>"; last = m.i + m.t.length; });
        out.innerHTML = html + esc(t.slice(last));
        var n = E.fg.checked ? r.m.length : Math.min(1, r.m.length);
        msg.textContent = n ? n + (r.more ? "+" : "") + " match" + (n === 1 ? "" : "es") : "No matches.";
        list.innerHTML = r.m.slice(0, E.fg.checked ? 200 : 1).map(function (m, k) { var g = m.g.length ? " <span class='muted'>groups: " + m.g.map(function (x, j) { return "$" + (j + 1) + "=" + esc(x === undefined ? "—" : JSON.stringify(x)); }).join(", ") + "</span>" : ""; var ng = m.n ? " <span class='muted'>" + Object.keys(m.n).map(function (k2) { return esc(k2) + "=" + esc(JSON.stringify(m.n[k2])); }).join(", ") + "</span>" : "";
          return "<li><code>" + esc(m.t) + "</code> at " + m.i + g + ng + "</li>"; }).join("");
        $("rx-result").value = r.r !== null && r.r !== undefined ? r.r : ""; form.setAttribute("data-count", String(n));
      });
    }
    form.addEventListener("input", run); form.addEventListener("change", run); noSubmit(form);
    E.preset.addEventListener("change", function () { var p = RX_PRESETS[E.preset.value]; if (!p) return; E.pattern.value = p[0]; ["g", "i", "m", "s", "u"].forEach(function (f) { E["f" + f].checked = p[1].indexOf(f) >= 0; }); run(); });
    copyBtn($("rx-copy"), function () { return "/" + E.pattern.value + "/" + flags(); });
    run();
  }

  // ---------------- Base64 ----------------
  function b64enc(str, urlSafe) { var bytes = new TextEncoder().encode(str), bin = ""; for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); var b = btoa(bin); return urlSafe ? b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b; }
  function b64bytes(b) { b = String(b).trim().replace(/^data:[^,]*,/, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/"); if (/[^A-Za-z0-9+/=]/.test(b)) throw new Error("That isn't valid Base64: it contains characters Base64 doesn't use."); while (b.length % 4) b += "="; var bin = atob(b), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function b64dec(b) { var u = b64bytes(b); try { return new TextDecoder("utf-8", { fatal: true }).decode(u); } catch (e) { throw new Error("This decodes to binary data, not text. Use “Base64 to file” below to save it."); } }
  function sniff(u) { var h = Array.prototype.slice.call(u, 0, 12).map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    return /^89504e47/.test(h) ? ["png", "image/png"] : /^ffd8ff/.test(h) ? ["jpg", "image/jpeg"] : /^47494638/.test(h) ? ["gif", "image/gif"] : /^25504446/.test(h) ? ["pdf", "application/pdf"] : /^504b0304/.test(h) ? ["zip", "application/zip"] : /^52494646.{8}57454250/.test(h) ? ["webp", "image/webp"] : /^3c3f786d6c|^3c737667/.test(h) ? ["svg", "image/svg+xml"] : ["bin", "application/octet-stream"]; }
  function initB64(form) {
    var E = form.elements, msg = $("b64-msg");
    function run(dir) {
      msg.textContent = "";
      try { if (dir === "enc") E.out.value = b64enc(E.inp.value, E.urlsafe.checked); else E.out.value = b64dec(E.inp.value); form.setAttribute("data-mode", dir); }
      catch (e) { E.out.value = ""; msg.innerHTML = "<span class='warn'>" + esc(e.message) + "</span>"; }
    }
    $("b64-enc").addEventListener("click", function () { run("enc"); }); $("b64-dec").addEventListener("click", function () { run("dec"); });
    $("b64-swap").addEventListener("click", function () { E.inp.value = E.out.value; E.out.value = ""; });
    copyBtn($("b64-copy"), function () { return E.out.value; }); noSubmit(form);
    $("b64-file").addEventListener("change", function () { var f = this.files[0]; if (!f) return; this.value = ""; if (f.size > 20 * 1048576) { $("b64-fmsg").textContent = "Files over 20 MB make Base64 text too big to handle comfortably."; return; }
      var r = new FileReader(); r.onload = function () { var d = String(r.result); E.fout.value = E.datauri.checked ? d : d.replace(/^data:[^,]*,/, ""); $("b64-fmsg").textContent = f.name + " · " + f.size.toLocaleString("en-GB") + " bytes → " + E.fout.value.length.toLocaleString("en-GB") + " characters"; form.setAttribute("data-file", String(E.fout.value.length)); }; r.readAsDataURL(f); });
    copyBtn($("b64-fcopy"), function () { return E.fout.value; });
    $("b64-save").addEventListener("click", function () { try { var u = b64bytes(E.fin.value), s = sniff(u); var a = document.createElement("a"), url = URL.createObjectURL(new Blob([u], { type: s[1] })); a.href = url; a.download = "decoded." + s[0]; document.body.appendChild(a); a.click(); a.remove(); $("b64-smsg").textContent = "Saved decoded." + s[0] + " (" + u.length.toLocaleString("en-GB") + " bytes)."; } catch (e) { $("b64-smsg").innerHTML = "<span class='warn'>" + esc(e.message) + "</span>"; } });
  }

  // ---------------- URL encode / decode ----------------
  function initUrl(form) {
    var E = form.elements, msg = $("ue-msg");
    function parse() { var box = $("ue-parts"); try { var u = new URL(E.inp.value.trim()); var rows = [["Protocol", u.protocol], ["Host", u.host], ["Path", decodeURIComponent(u.pathname)], ["Fragment", u.hash]].filter(function (r) { return r[1]; });
        var q = []; u.searchParams.forEach(function (v, k) { q.push([k, v]); });
        box.innerHTML = "<table class='sal-table'><tbody>" + rows.map(function (r) { return "<tr><th>" + r[0] + "</th><td><code>" + esc(r[1]) + "</code></td></tr>"; }).join("") + "</tbody></table>" + (q.length ? "<h3>Query parameters</h3><table class='sal-table'><thead><tr><th>Name</th><th>Value (decoded)</th></tr></thead><tbody>" + q.map(function (r) { return "<tr><td><code>" + esc(r[0]) + "</code></td><td><code>" + esc(r[1]) + "</code></td></tr>"; }).join("") + "</tbody></table>" : ""); box.hidden = false; }
      catch (e) { box.hidden = true; } }
    function run(dir) {
      msg.textContent = ""; var t = E.inp.value;
      try { if (dir === "enc") E.out.value = E.mode.value === "full" ? encodeURI(t) : E.mode.value === "form" ? encodeURIComponent(t).replace(/%20/g, "+") : encodeURIComponent(t);
        else E.out.value = decodeURIComponent(E.mode.value === "form" ? t.replace(/\+/g, " ") : t); }
      catch (e) { E.out.value = ""; msg.innerHTML = "<span class='warn'>This text has a broken % sequence (a % must be followed by two hex digits), so it can't be decoded.</span>"; }
      parse();
    }
    $("ue-enc").addEventListener("click", function () { run("enc"); }); $("ue-dec").addEventListener("click", function () { run("dec"); });
    E.inp.addEventListener("input", parse); copyBtn($("ue-copy"), function () { return E.out.value; }); noSubmit(form);
  }

  // ---------------- UUID ----------------
  function hex(b) { return Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function fmtU(h) { return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20); }
  function uuid4() { var b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; return fmtU(hex(b)); }
  var u7last = -1, u7seq = 0;
  function uuid7(ms) { var b = crypto.getRandomValues(new Uint8Array(16)), t = ms === undefined ? Date.now() : ms;
    if (t <= u7last && ms === undefined) { t = u7last; u7seq++; if (u7seq > 4095) { t = ++u7last; u7seq = b[7] & 0x3ff; } } else { u7last = t; u7seq = ((b[6] & 0x03) << 8) | b[7]; } for (var i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); } b[6] = 0x70 | ((u7seq >> 8) & 0x0f); b[7] = u7seq & 0xff; b[8] = (b[8] & 0x3f) | 0x80; return fmtU(hex(b)); }
  function inspectUuid(s) {
    var h = String(s).trim().toLowerCase().replace(/^urn:uuid:|[{}]/g, ""); if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/.test(h)) return { ok: false };
    h = h.replace(/-/g, ""); var v = parseInt(h[12], 16), varnt = parseInt(h[16], 16), r = { ok: true, version: v, variant: varnt >= 8 && varnt <= 11 ? "RFC 9562" : varnt < 8 ? "NCS (legacy)" : "Microsoft/reserved", nil: /^0+$/.test(h), max: /^f+$/.test(h) };
    if (v === 7) r.time = new Date(parseInt(h.slice(0, 12), 16)).toISOString();
    if (v === 1) { var ts = (BigInt("0x" + h.slice(13, 16) + h.slice(8, 12) + h.slice(0, 8)) - 122192928000000000n) / 10000n; r.time = new Date(Number(ts)).toISOString(); }
    return r;
  }
  function initUuid(form) {
    var E = form.elements;
    function gen() { var n = Math.max(1, Math.min(1000, parseInt(E.count.value, 10) || 1)), out = []; for (var i = 0; i < n; i++) { var u = E.ver.value === "7" ? uuid7() : uuid4(); if (!E.hyph.checked) u = u.replace(/-/g, ""); if (E.upper.checked) u = u.toUpperCase(); if (E.braces.checked) u = "{" + u + "}"; out.push(u); } E.out.value = out.join("\n"); form.setAttribute("data-n", String(n)); }
    $("uu-gen").addEventListener("click", gen); form.addEventListener("change", function (e) { if (e.target.name !== "check") gen(); });
    copyBtn($("uu-copy"), function () { return E.out.value; });
    $("uu-dl").addEventListener("click", function () { saveText(E.out.value + "\n", "uuids.txt"); });
    E.check.addEventListener("input", function () { var r = inspectUuid(E.check.value), o = $("uu-info"); if (!E.check.value.trim()) { o.textContent = ""; return; }
      o.innerHTML = r.ok ? "✓ Valid UUID · version " + r.version + (r.nil ? " (nil UUID)" : r.max ? " (max UUID)" : "") + " · variant " + r.variant + (r.time ? " · created " + esc(r.time.replace("T", " ").replace(".000Z", " UTC").replace("Z", " UTC")) : "") : "<span class='warn'>Not a valid UUID. It should be 32 hex digits, usually as 8-4-4-4-12.</span>"; });
    noSubmit(form); gen();
  }

  // ---------------- Hash ----------------
  function md5(bytes) { // RFC 1321
    var K = [], S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    var n = bytes.length, total = ((n + 8) >> 6) + 1, W = new Int32Array(total * 16);
    for (i = 0; i < n; i++) W[i >> 2] |= bytes[i] << ((i % 4) * 8);
    W[n >> 2] |= 0x80 << ((n % 4) * 8); W[total * 16 - 2] = (n * 8) | 0; W[total * 16 - 1] = Math.floor(n / 536870912);
    var a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
    for (var off = 0; off < W.length; off += 16) {
      var A = a0, B = b0, C = c0, D = d0;
      for (var j = 0; j < 64; j++) { var F, g; if (j < 16) { F = (B & C) | (~B & D); g = j; } else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; } else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; } else { F = C ^ (B | ~D); g = (7 * j) % 16; }
        var tmp = D; D = C; C = B; var x = (A + F + K[j] + W[off + g]) | 0; B = (B + ((x << S[j]) | (x >>> (32 - S[j])))) | 0; A = tmp; }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return [a0, b0, c0, d0].map(function (v) { var s = ""; for (var k = 0; k < 4; k++) s += ("0" + ((v >>> (k * 8)) & 255).toString(16)).slice(-2); return s; }).join("");
  }
  function hashAll(bytes, key) {
    var algs = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    return Promise.all(algs.map(function (a) {
      if (key) return crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: a }, false, ["sign"]).then(function (k) { return crypto.subtle.sign("HMAC", k, bytes); });
      return crypto.subtle.digest(a, bytes);
    })).then(function (rs) { var o = { MD5: key ? null : md5(bytes) }; rs.forEach(function (r, i) { o[algs[i]] = hex(new Uint8Array(r)); }); return o; });
  }
  function initHash(form) {
    var E = form.elements, out = $("hs-out"), cur = null, seq = 0;
    function show(o, label) { cur = o; var cmp = E.cmp.value.trim().toLowerCase();
      out.innerHTML = (label ? "<p class='hint'>" + esc(label) + "</p>" : "") + Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { var v = E.upper.checked ? o[k].toUpperCase() : o[k], hit = cmp && cmp === o[k]; return "<div class='hs-row" + (hit ? " hit" : "") + "'><span>" + (E.key.value ? "HMAC-" : "") + k + (hit ? " ✓ matches" : "") + "</span><code data-v='" + v + "'>" + v + "</code><button type='button' class='btn secondary sm' data-copy='" + k + "'>Copy</button></div>"; }).join("") + (E.key.value ? "<p class='hint'>MD5 isn't offered with a key; HMAC uses the SHA family here.</p>" : "");
      var any = cmp && Object.keys(o).some(function (k) { return o[k] === cmp; }); $("hs-cmp").innerHTML = cmp ? (any ? "✓ The checksum matches." : "<span class='warn'>✗ No match. The file or text is different from the one the checksum was made from.</span>") : "";
      form.setAttribute("data-sha256", o["SHA-256"]); }
    function runText() { var my = ++seq; hashAll(new TextEncoder().encode(E.text.value), E.key.value).then(function (o) { if (my === seq) show(o, ""); }); }
    E.text.addEventListener("input", runText); E.key.addEventListener("input", runText); E.upper.addEventListener("change", function () { if (cur) show(cur); }); E.cmp.addEventListener("input", function () { if (cur) show(cur); });
    out.addEventListener("click", function (e) { var b = e.target.closest("[data-copy]"); if (!b) return; navigator.clipboard.writeText(b.previousElementSibling.getAttribute("data-v")); b.textContent = "Copied!"; setTimeout(function () { b.textContent = "Copy"; }, 1200); });
    $("hs-file").addEventListener("change", function () { var f = this.files[0]; if (!f) return; this.value = ""; if (f.size > 500 * 1048576) { out.innerHTML = "<p class='warn'>Files over 500 MB are too large to hash in the browser.</p>"; return; } out.innerHTML = "<p class='hint'>Hashing " + esc(f.name) + "…</p>"; var my = ++seq;
      f.arrayBuffer().then(function (b) { return hashAll(new Uint8Array(b), E.key.value); }).then(function (o) { if (my === seq) show(o, f.name + " · " + f.size.toLocaleString("en-GB") + " bytes"); }); });
    noSubmit(form); runText();
  }

  // ---------------- Unix timestamp ----------------
  function tsToDate(v) { var s = String(v).trim(); if (!/^-?\d+(\.\d+)?$/.test(s)) return null; var n = parseFloat(s), a = Math.abs(n), unit = a >= 1e17 ? "ns" : a >= 1e14 ? "µs" : a >= 1e11 ? "ms" : "s"; var ms = unit === "s" ? n * 1000 : unit === "ms" ? n : unit === "µs" ? n / 1000 : n / 1e6; return { date: new Date(ms), unit: unit }; }
  function fmtZone(d, tz) { return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(d); }
  function rel(d) { var s = Math.round((d - Date.now()) / 1000), a = Math.abs(s), u = a < 60 ? [s, "second"] : a < 3600 ? [Math.round(s / 60), "minute"] : a < 86400 ? [Math.round(s / 3600), "hour"] : a < 2629800 ? [Math.round(s / 86400), "day"] : a < 31557600 ? [Math.round(s / 2629800), "month"] : [Math.round(s / 31557600), "year"]; return new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" }).format(u[0], u[1]); }
  function zoneOffset(d, tz) { var p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d), o = {}; p.forEach(function (x) { o[x.type] = +x.value; }); return Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second) - Math.floor(d.getTime() / 1000) * 1000; }
  function localToTs(str, tz) { // "2026-11-24T16:20[:ss]" in a zone → seconds
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(str); if (!m) return null; var guess = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    if (tz === "UTC") return guess / 1000; if (tz === "local") return new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime() / 1000;
    var off = zoneOffset(new Date(guess), tz), t = guess - off; off = zoneOffset(new Date(t), tz); return (guess - off) / 1000; }
  function initTimestamp(form) {
    var E = form.elements, now = $("ts-now");
    setInterval(function () { now.textContent = Math.floor(Date.now() / 1000); }, 500); now.textContent = Math.floor(Date.now() / 1000);
    function fwd() { var r = tsToDate(E.ts.value), o = $("ts-out"); if (!E.ts.value.trim()) { o.innerHTML = ""; return; } if (!r || isNaN(r.date)) { o.innerHTML = "<p class='warn'>Enter a whole number of seconds (or milliseconds) since 1 January 1970.</p>"; return; }
      var d = r.date; o.innerHTML = "<p class='hint'>Read as " + { s: "seconds", ms: "milliseconds", "µs": "microseconds", ns: "nanoseconds" }[r.unit] + "</p><table class='sal-table'><tbody>" +
        [["UTC", fmtZone(d, "UTC")], ["UK time", fmtZone(d, "Europe/London")], ["Your time", fmtZone(d, Intl.DateTimeFormat().resolvedOptions().timeZone)], ["ISO 8601", d.toISOString()], ["Relative", rel(d)]].map(function (x) { return "<tr><th>" + x[0] + "</th><td><code>" + esc(x[1]) + "</code></td></tr>"; }).join("") + "</tbody></table>";
      form.setAttribute("data-iso", d.toISOString()); }
    function back() { var o = $("ts-back"); if (!E.dt.value) { o.innerHTML = ""; return; } var s = localToTs(E.dt.value, E.tz.value); if (s === null || isNaN(s)) { o.innerHTML = ""; return; }
      o.innerHTML = "<div class='hs-row'><span>Seconds</span><code>" + s + "</code></div><div class='hs-row'><span>Milliseconds</span><code>" + s * 1000 + "</code></div>"; form.setAttribute("data-ts", String(s)); }
    E.ts.addEventListener("input", fwd); E.dt.addEventListener("input", back); E.tz.addEventListener("change", back);
    $("ts-use").addEventListener("click", function () { E.ts.value = Math.floor(Date.now() / 1000); fwd(); });
    copyBtn($("ts-copy"), function () { return now.textContent; }); noSubmit(form);
    var d = new Date(); d.setSeconds(0, 0); E.dt.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); E.ts.value = Math.floor(Date.now() / 1000); fwd(); back();
  }

  // ---------------- CSV ↔ JSON ----------------
  function detectDelim(t) { var line = t.split(/\r?\n/).slice(0, 5).join("\n"), best = ",", n = -1; [",", ";", "\t", "|"].forEach(function (d) { var c = line.split(d).length; if (c > n) { n = c; best = d; } }); return best; }
  function parseCsv(t, d) {
    var rows = [], row = [], f = "", q = false, i = 0; d = d || detectDelim(t);
    for (; i < t.length; i++) { var c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"' && f === "") q = true; else if (c === d) { row.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; } else f += c; }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return !(r.length === 1 && r[0] === ""); });
  }
  function typed(v) { if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v) && v.length < 16) return Number(v); if (v === "true") return true; if (v === "false") return false; if (v === "" ) return null; return v; }
  function csvToJson(t, o) { o = o || {}; var rows = parseCsv(t, o.delim); if (!rows.length) return []; var conv = o.types ? typed : function (v) { return v; };
    if (o.header === false) return rows.map(function (r) { return r.map(conv); });
    var h = rows[0].map(function (x, i) { return x.trim() || "column" + (i + 1); }); return rows.slice(1).map(function (r) { var obj = {}; h.forEach(function (k, i) { obj[k] = conv(r[i] === undefined ? "" : r[i]); }); return obj; }); }
  function flat(o, pre, out) { out = out || {}; Object.keys(o).forEach(function (k) { var v = o[k], key = pre ? pre + "." + k : k; if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out); else out[key] = Array.isArray(v) ? JSON.stringify(v) : v; }); return out; }
  function csvCell(v, d) { if (v === null || v === undefined) return ""; v = String(v); return /["\r\n]/.test(v) || v.indexOf(d) >= 0 || /^\s|\s$/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function jsonToCsv(data, d) { d = d || ","; if (!Array.isArray(data)) data = [data]; if (data.length && Array.isArray(data[0])) return data.map(function (r) { return r.map(function (v) { return csvCell(v, d); }).join(d); }).join("\n");
    var rows = data.map(function (r) { return r && typeof r === "object" ? flat(r) : { value: r }; }), keys = []; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    return [keys.map(function (k) { return csvCell(k, d); }).join(d)].concat(rows.map(function (r) { return keys.map(function (k) { return csvCell(r[k], d); }).join(d); })).join("\n"); }
  function initCsv(form) {
    var E = form.elements, msg = $("cj-msg");
    function d() { return { auto: "", comma: ",", semi: ";", tab: "\t", pipe: "|" }[E.delim.value]; }
    $("cj-tojson").addEventListener("click", function () { msg.textContent = ""; try { var r = csvToJson(E.inp.value, { delim: d(), header: E.header.checked, types: E.types.checked }); E.out.value = JSON.stringify(r, null, E.min.checked ? 0 : 2); msg.textContent = r.length + " row" + (r.length === 1 ? "" : "s") + " converted."; form.setAttribute("data-dir", "json"); } catch (e) { msg.innerHTML = "<span class='warn'>" + esc(e.message) + "</span>"; } });
    $("cj-tocsv").addEventListener("click", function () { msg.textContent = ""; try { var j = JSON.parse(E.inp.value); E.out.value = jsonToCsv(j, d() || ","); msg.textContent = (Array.isArray(j) ? j.length : 1) + " row(s) converted. Nested objects become columns like address.city."; form.setAttribute("data-dir", "csv"); } catch (e) { msg.innerHTML = "<span class='warn'>That isn't valid JSON: " + esc(e.message) + "</span>"; } });
    $("cj-swap").addEventListener("click", function () { E.inp.value = E.out.value; E.out.value = ""; });
    copyBtn($("cj-copy"), function () { return E.out.value; });
    $("cj-dl").addEventListener("click", function () { if (!E.out.value) return; var j = form.getAttribute("data-dir") === "json"; saveText(E.out.value, j ? "data.json" : "data.csv", j ? "application/json" : "text/csv"); });
    $("cj-file").addEventListener("change", function () { var f = this.files[0]; if (!f) return; this.value = ""; f.text().then(function (t) { E.inp.value = t.replace(/^﻿/, ""); }); });
    noSubmit(form);
  }

  // ---------------- SQL formatter ----------------
  var SQL_KW = "select distinct from where and or not in is null like between exists group by order having limit offset join inner left right full outer cross on as union all insert into values update set delete create table alter drop index primary key foreign references default case when then else end asc desc with count sum avg min max coalesce cast varchar int integer text date timestamp boolean if replace returning top fetch next rows only over partition window ilike any some true false".split(" ");
  var SQL_BREAK = ["select", "from", "where", "group by", "order by", "having", "limit", "offset", "union", "union all", "insert into", "values", "update", "set", "delete from", "returning", "with", "join", "inner join", "left join", "right join", "full join", "left outer join", "right outer join", "full outer join", "cross join", "on", "fetch"];
  function sqlTokens(s) { var t = [], re = /\s+|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`|\[[^\]]*\]|\d+(?:\.\d+)?|[A-Za-z_][\w$]*|<>|!=|<=|>=|::|\|\||[(),;.*=<>+\-/%]|./g, m; while ((m = re.exec(s))) t.push(m[0]); return t; }
  var SQL_NOFN = "in and or on as values exists not when then else where from join select into using over by set having any all some is like".split(" ");
  function sqlSpace(prev, tk) {
    if (!prev) return false;
    if (/^[,);.]$/.test(tk) || /^::/.test(tk) || /^\[?\]$/.test(tk)) return false;
    if (prev === "(" || prev === "." || /::$/.test(prev)) return false;
    if (tk === "(" && /^[A-Za-z_][\w$]*$/.test(prev) && SQL_NOFN.indexOf(prev.toLowerCase()) < 0) return false;
    return true;
  }
  function formatSql(src, o) {
    o = o || {}; var upper = o.upper !== false, ind = o.indent || "  ", toks = sqlTokens(src).filter(function (x) { return !/^\s+$/.test(x); });
    function kw(x) { return /^[a-z_]/i.test(x) && SQL_KW.indexOf(x.toLowerCase()) >= 0 ? (upper ? x.toUpperCase() : x.toLowerCase()) : x; }
    if (o.minify) { var m = "", pv = null; toks.forEach(function (x) { if (/^--/.test(x)) return; if (/^\/\*/.test(x)) x = x.replace(/\s+/g, " "); if (pv !== null && sqlSpace(pv, x)) m += " "; m += kw(x); pv = x; }); return m.trim(); }
    var depth = 0, line = "", lines = [], stack = [], clause = "", last = null, i;
    function pad(n) { return new Array(n + 1).join(ind); }
    function nl(n) { if (line.trim()) lines.push(line.replace(/\s+$/, "")); line = pad(n === undefined ? depth : n); last = null; }
    function add(x) { if (line.trim() && sqlSpace(last, x)) line += " "; line += x; last = x; }
    for (i = 0; i < toks.length; i++) {
      var tk = toks[i], lo = tk.toLowerCase(), two = lo + " " + (toks[i + 1] || "").toLowerCase(), three = two + " " + (toks[i + 2] || "").toLowerCase(), brk = null, top = stack[stack.length - 1];
      if (SQL_BREAK.indexOf(three) >= 0) brk = three; else if (SQL_BREAK.indexOf(two) >= 0) brk = two; else if (SQL_BREAK.indexOf(lo) >= 0) brk = lo;
      if (top && top.t === "inline") brk = null;
      if (/^--|^\/\*/.test(tk)) { if (/^--/.test(tk)) { add(tk); nl(depth + 1); } else add(tk); continue; }
      if (brk) { var w = brk.split(" ").length, words = toks.slice(i, i + w).map(kw).join(" "); i += w - 1; clause = brk;
        if (brk === "on") { nl(depth + 1); add(words); continue; }
        nl(); add(words); if (/^(select|set|values|with|where|having|group by|order by)$/.test(brk)) nl(depth + 1); continue; }
      if ((lo === "and" || lo === "or") && !(top && top.t === "inline") && /where|having|on/.test(clause)) { nl(depth + 1); add(kw(tk)); continue; }
      if (tk === "(") { var isSub = /^(select|with)$/i.test(toks[i + 1] || ""); add("("); stack.push({ t: isSub ? "sub" : "inline", d: depth, ind: (line.match(/^\s*/) || [""])[0], c: clause }); if (isSub) { depth = Math.round(stack[stack.length - 1].ind.length / ind.length) + 1; } continue; }
      if (tk === ")") { var st = stack.pop() || { t: "inline" }; if (st.t === "sub") { depth = st.d; clause = st.c; nl(); line = st.ind + ")"; last = ")"; } else add(")"); continue; }
      if (tk === ",") { add(","); if (!(top && top.t === "inline") && /select|set|group by|order by|values|with/.test(clause)) nl(depth + 1); continue; }
      if (tk === ";") { add(";"); nl(); lines.push(""); clause = ""; continue; }
      add(kw(tk));
    }
    nl(); return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function initSql(form) {
    var E = form.elements;
    function run() { E.out.value = formatSql(E.inp.value, { upper: E.upper.checked, indent: E.indent.value === "tab" ? "\t" : new Array(+E.indent.value + 1).join(" "), minify: E.mode.value === "min" }); }
    $("sq-run").addEventListener("click", run); form.addEventListener("change", function (e) { if (e.target !== E.inp && E.inp.value) run(); });
    copyBtn($("sq-copy"), function () { return E.out.value; }); noSubmit(form);
  }

  // ---------------- Cron ----------------
  var MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var MONN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], DOWN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MACRO = { "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *" };
  function cronField(s, min, max, names) {
    var set = {}, any = s === "*" || s === "?";
    s.toLowerCase().split(",").forEach(function (part) {
      var m = /^(\*|\?|[a-z0-9]+)(?:-([a-z0-9]+))?(?:\/(\d+))?$/.exec(part); if (!m) throw new Error("“" + part + "” isn't valid here.");
      var val = function (x) { if (names) { var k = names.indexOf(x); if (k >= 0) return k + (names === MON ? 1 : 0); } if (!/^\d+$/.test(x)) throw new Error("“" + x + "” isn't valid here."); return +x; };
      var a = m[1] === "*" || m[1] === "?" ? min : val(m[1]), b = m[2] ? val(m[2]) : (m[1] === "*" || m[1] === "?" || m[3] ? max : a), step = m[3] ? +m[3] : 1;
      if (names === DOW) { if (a === 7) a = 0; if (b === 7 && m[2]) b = 7; }
      if (a < min || b > (names === DOW ? 7 : max) || a > b || step < 1) throw new Error("“" + part + "” is out of range (" + min + "–" + max + ").");
      for (var v = a; v <= b; v += step) set[names === DOW && v === 7 ? 0 : v] = 1;
    });
    return { any: any, vals: Object.keys(set).map(Number).sort(function (x, y) { return x - y; }), src: s };
  }
  function parseCron(expr) {
    var e = String(expr).trim().toLowerCase(); e = MACRO[e] || e; var p = e.split(/\s+/);
    if (p.length !== 5) throw new Error("A cron expression has 5 parts: minute, hour, day of month, month and day of week.");
    return { min: cronField(p[0], 0, 59), hour: cronField(p[1], 0, 23), dom: cronField(p[2], 1, 31), mon: cronField(p[3], 1, 12, MON), dow: cronField(p[4], 0, 6, DOW) };
  }
  function listWords(a, f) { a = a.map(f); return a.length < 3 ? a.join(" and ") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function stepOf(fl, min) { var m = /^(\*|\d+)\/(\d+)$/.exec(fl.src); return m ? { step: +m[2], from: m[1] === "*" ? min : +m[1] } : null; }
  function explainCron(expr) {
    var c = parseCron(expr), t, pad = function (n) { return ("0" + n).slice(-2); };
    var ms = stepOf(c.min, 0), hs = stepOf(c.hour, 0);
    if (c.min.any && c.hour.any) t = "Every minute";
    else if (ms && c.hour.any) t = "Every " + ms.step + " minutes" + (ms.from ? " starting at minute " + ms.from : "");
    else if (c.min.any) t = "Every minute during " + listWords(c.hour.vals, function (h) { return pad(h) + ":00–" + pad(h) + ":59"; });
    else if (c.hour.any) t = "At " + listWords(c.min.vals, function (m) { return "minute " + m; }) + " past every hour";
    else if (hs && c.min.vals.length === 1) t = "At minute " + c.min.vals[0] + " past every " + hs.step + " hours" + (hs.from ? " from " + pad(hs.from) + ":00" : "");
    else if (c.hour.vals.length * c.min.vals.length <= 6) { var times = []; c.hour.vals.forEach(function (h) { c.min.vals.forEach(function (m) { times.push(pad(h) + ":" + pad(m)); }); }); t = "At " + listWords(times, function (x) { return x; }); }
    else t = "At minute " + listWords(c.min.vals, String) + " past hour " + listWords(c.hour.vals, String);
    var days = [];
    if (!c.dom.any) days.push("on day " + listWords(c.dom.vals, String) + " of the month");
    if (!c.dow.any) { var dv = c.dow.vals.join(); days.push(dv === "1,2,3,4,5" ? "Monday to Friday" : dv === "0,6" ? "on Saturday and Sunday" : "on " + listWords(c.dow.vals, function (d) { return DOWN[d]; })); }
    if (days.length) t += ", " + days.join(" or ");
    if (!c.mon.any) t += ", in " + listWords(c.mon.vals, function (m) { return MONN[m - 1]; });
    return t + ".";
  }
  function nextRuns(expr, from, n) {
    var c = parseCron(expr), out = [], d = new Date(from.getTime()); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    var has = function (f, v) { return f.vals.indexOf(v) >= 0; }, limit = 0;
    while (out.length < n && limit++ < 600000) {
      if (!has(c.mon, d.getMonth() + 1)) { d.setMonth(d.getMonth() + 1, 1); d.setHours(0, 0, 0, 0); continue; }
      var domOk = has(c.dom, d.getDate()), dowOk = has(c.dow, d.getDay()), dayOk = c.dom.any || c.dow.any ? domOk && dowOk : domOk || dowOk;
      if (!dayOk) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
      if (!has(c.hour, d.getHours())) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
      if (!has(c.min, d.getMinutes())) { d.setMinutes(d.getMinutes() + 1, 0, 0); continue; }
      out.push(new Date(d.getTime())); d.setMinutes(d.getMinutes() + 1, 0, 0);
    }
    return out;
  }
  function initCron(form) {
    var E = form.elements;
    function show() {
      var o = $("cr-out"), list = $("cr-next");
      try { var t = explainCron(E.expr.value); o.innerHTML = "<strong>" + esc(t) + "</strong>"; var r = nextRuns(E.expr.value, new Date(), 5);
        list.innerHTML = r.map(function (d) { return "<li>" + d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "</li>"; }).join("") || "<li>No run in the next year. Check the day and month.</li>"; form.setAttribute("data-text", t); }
      catch (e) { o.innerHTML = "<span class='warn'>" + esc(e.message) + "</span>"; list.innerHTML = ""; form.setAttribute("data-text", "err"); }
    }
    function build() { E.expr.value = [E.cmin.value || "*", E.chour.value || "*", E.cdom.value || "*", E.cmon.value || "*", E.cdow.value || "*"].join(" "); show(); }
    function split() { try { var p = (MACRO[E.expr.value.trim().toLowerCase()] || E.expr.value.trim()).split(/\s+/); if (p.length === 5) { E.cmin.value = p[0]; E.chour.value = p[1]; E.cdom.value = p[2]; E.cmon.value = p[3]; E.cdow.value = p[4]; } } catch (e) { /* ignore */ } }
    E.expr.addEventListener("input", function () { split(); show(); });
    ["cmin", "chour", "cdom", "cmon", "cdow"].forEach(function (k) { E[k].addEventListener("input", build); });
    form.addEventListener("click", function (e) { var b = e.target.closest("[data-cx]"); if (!b) return; E.expr.value = b.getAttribute("data-cx"); split(); show(); });
    copyBtn($("cr-copy"), function () { return E.expr.value; }); noSubmit(form); split(); show();
  }

  // ---------------- CSS gradient ----------------
  function gradientCss(g) {
    var stops = g.stops.slice().sort(function (a, b) { return a.p - b.p; }).map(function (s) { return s.c + " " + s.p + "%"; }).join(", ");
    return g.type === "radial" ? "radial-gradient(" + g.shape + " at " + g.pos + ", " + stops + ")" : g.type === "conic" ? "conic-gradient(from " + g.angle + "deg at " + g.pos + ", " + stops + ")" : "linear-gradient(" + g.angle + "deg, " + stops + ")";
  }
  var GR_PRESETS = [["Sunset", "linear", 135, [["#ff6b35", 0], ["#f7c948", 100]]], ["Ocean", "linear", 160, [["#0ea5e9", 0], ["#1e3a8a", 100]]], ["Mint", "linear", 90, [["#34d399", 0], ["#a7f3d0", 100]]], ["Berry", "linear", 45, [["#8b5cf6", 0], ["#ec4899", 100]]], ["Night", "radial", 0, [["#334155", 0], ["#0f172a", 100]]], ["Rainbow", "conic", 0, [["#ef4444", 0], ["#f59e0b", 20], ["#84cc16", 40], ["#06b6d4", 60], ["#8b5cf6", 80], ["#ef4444", 100]]]];
  function initGradient(form) {
    var E = form.elements, g = { type: "linear", angle: 135, shape: "circle", pos: "center", stops: [{ c: "#ff6b35", p: 0 }, { c: "#f7c948", p: 100 }] }, box = $("gr-stops");
    function stopsUi() { box.innerHTML = g.stops.map(function (s, i) { return "<div class='gr-stop'><input type='color' value='" + s.c + "' data-i='" + i + "' data-k='c' aria-label='Colour " + (i + 1) + "'><input type='range' min='0' max='100' value='" + s.p + "' data-i='" + i + "' data-k='p' aria-label='Position " + (i + 1) + "'><span>" + s.p + "%</span>" + (g.stops.length > 2 ? "<button type='button' class='btn ghost sm' data-del='" + i + "' aria-label='Remove colour'>✕</button>" : "") + "</div>"; }).join(""); }
    function render() { g.type = E.type.value; g.angle = +E.angle.value; g.shape = E.shape.value; g.pos = E.pos.value; var css = gradientCss(g);
      $("gr-preview").style.background = css; E.css.value = "background: " + g.stops[0].c + ";\nbackground: " + css + ";"; $("gr-ang").textContent = g.angle + "°";
      $("gr-angbox").hidden = g.type === "radial"; $("gr-shapebox").hidden = g.type !== "radial"; $("gr-posbox").hidden = g.type === "linear"; form.setAttribute("data-css", css); }
    box.addEventListener("input", function (e) { var i = e.target.getAttribute("data-i"); if (i === null) return; var k = e.target.getAttribute("data-k"); g.stops[+i][k] = k === "p" ? +e.target.value : e.target.value; if (k === "p") e.target.nextElementSibling.textContent = e.target.value + "%"; render(); });
    box.addEventListener("click", function (e) { var d = e.target.getAttribute("data-del"); if (d === null) return; g.stops.splice(+d, 1); stopsUi(); render(); });
    $("gr-add").addEventListener("click", function () { if (g.stops.length >= 8) return; g.stops.push({ c: "#ffffff", p: 50 }); stopsUi(); render(); });
    $("gr-rand").addEventListener("click", function () { var h = Math.floor(Math.random() * 360), c = function (x, l) { var s = 0.75, a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + x / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); }; return "#" + f(0) + f(8) + f(4); };
      g.stops = [{ c: c(h, 0.55), p: 0 }, { c: c((h + 40 + Math.random() * 80) % 360, 0.6), p: 100 }]; E.angle.value = Math.floor(Math.random() * 360); stopsUi(); render(); });
    $("gr-presets").innerHTML = GR_PRESETS.map(function (p, i) { var css = gradientCss({ type: p[1], angle: p[2], shape: "circle", pos: "center", stops: p[3].map(function (s) { return { c: s[0], p: s[1] }; }) }); return "<button type='button' class='gr-pre' data-pre='" + i + "' style=\"background:" + css + "\" title='" + p[0] + "'><span>" + p[0] + "</span></button>"; }).join("");
    $("gr-presets").addEventListener("click", function (e) { var b = e.target.closest("[data-pre]"); if (!b) return; var p = GR_PRESETS[+b.getAttribute("data-pre")]; E.type.value = p[1]; E.angle.value = p[2]; g.stops = p[3].map(function (s) { return { c: s[0], p: s[1] }; }); stopsUi(); render(); });
    copyBtn($("gr-copy"), function () { return E.css.value; });
    $("gr-png").addEventListener("click", function () { var c = document.createElement("canvas"); c.width = +E.w.value || 1920; c.height = +E.h.value || 1080; var x = c.getContext("2d"), W = c.width, H = c.height, gr, st = g.stops.slice().sort(function (a, b) { return a.p - b.p; });
      if (g.type === "linear") { var a = (g.angle - 90) * Math.PI / 180, L = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a)); gr = x.createLinearGradient(W / 2 - Math.cos(a) * L / 2, H / 2 - Math.sin(a) * L / 2, W / 2 + Math.cos(a) * L / 2, H / 2 + Math.sin(a) * L / 2); }
      else if (g.type === "radial") gr = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
      else gr = x.createConicGradient((g.angle - 90) * Math.PI / 180, W / 2, H / 2);
      st.forEach(function (s) { gr.addColorStop(s.p / 100, s.c); }); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      c.toBlob(function (b) { var a2 = document.createElement("a"), u = URL.createObjectURL(b); a2.href = u; a2.download = "gradient-" + W + "x" + H + ".png"; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }); });
    form.addEventListener("input", function (e) { if (!e.target.closest("#gr-stops")) render(); }); form.addEventListener("change", render); noSubmit(form);
    stopsUi(); render();
  }

  window.ETBDev = { b64enc: b64enc, b64dec: b64dec, md5: function (s) { return md5(new TextEncoder().encode(s)); }, hashAll: hashAll, uuid4: uuid4, uuid7: uuid7, inspectUuid: inspectUuid, tsToDate: tsToDate, localToTs: localToTs,
    parseCsv: parseCsv, csvToJson: csvToJson, jsonToCsv: jsonToCsv, formatSql: formatSql, explainCron: explainCron, nextRuns: nextRuns, gradientCss: gradientCss, regexRun: regexRun };
  document.addEventListener("DOMContentLoaded", function () {
    var m = { "data-regex": initRegex, "data-b64": initB64, "data-urlenc": initUrl, "data-uuid": initUuid, "data-hash": initHash, "data-unixts": initTimestamp, "data-csvjson": initCsv, "data-sqlfmt": initSql, "data-cron": initCron, "data-gradient": initGradient };
    Object.keys(m).forEach(function (a) { var f = document.querySelector("form[" + a + "]"); if (f) m[a](f); });
  });
})();
