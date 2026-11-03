/* etoolbox file tools — batch renamer, duplicate finder, checksum verifier. Files never leave your device. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function size(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : n < 1073741824 ? (n / 1048576).toFixed(1) + " MB" : (n / 1073741824).toFixed(2) + " GB"; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function dl(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }
  function wireDrop(drop, input, cb) {
    input.addEventListener("change", function () { cb(input.files); });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { cb(e.dataTransfer.files); });
  }

  /* ---------- Batch renamer ---------- */
  function splitName(n) { var i = n.lastIndexOf("."); return i > 0 ? [n.slice(0, i), n.slice(i + 1)] : [n, ""]; }
  function titleCase(s) { return s.toLowerCase().replace(/(^|[\s_-])(\p{L})/gu, function (m, a, b) { return a + b.toUpperCase(); }); }
  // Pure function, exported for tests.
  function newNames(files, o) {
    var seen = {}, out = [];
    files.forEach(function (f, i) {
      var p = splitName(f.name), base = p[0], ext = p[1];
      if (o.find) {
        if (o.regex) { try { base = base.replace(new RegExp(o.find, o.matchcase ? "g" : "gi"), o.replace || ""); } catch (e) { throw new Error("That pattern isn't a valid regular expression."); } }
        else { var re = new RegExp(o.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), o.matchcase ? "g" : "gi"); base = base.replace(re, o.replace || ""); }
      }
      if (o.template) {
        var num = String((+o.start || 1) + i * (+o.step || 1)); var pad = Math.max(0, +o.pad || 0); while (num.length < pad) num = "0" + num;
        var d = f.lastModified ? new Date(f.lastModified) : new Date(), iso = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
        base = o.template.replace(/\{name\}/g, base).replace(/\{n\}/g, num).replace(/\{date\}/g, iso).replace(/\{ext\}/g, ext);
      }
      if (o.casing === "lower") base = base.toLowerCase(); else if (o.casing === "upper") base = base.toUpperCase(); else if (o.casing === "title") base = titleCase(base);
      if (o.spaces === "dash") base = base.replace(/\s+/g, "-"); else if (o.spaces === "underscore") base = base.replace(/\s+/g, "_"); else if (o.spaces === "remove") base = base.replace(/\s+/g, "");
      base = base.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").trim() || "file";
      if (o.ext) ext = o.ext.replace(/^\./, "");
      if (o.extcase === "lower") ext = ext.toLowerCase(); else if (o.extcase === "upper") ext = ext.toUpperCase();
      var name = ext ? base + "." + ext : base, k = name.toLowerCase(), c = 2;
      while (seen[k]) { name = (ext ? base + " (" + c + ")." + ext : base + " (" + c + ")"); k = name.toLowerCase(); c++; }
      seen[k] = 1; out.push(name);
    });
    return out;
  }
  function shellQuote(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }
  function initRenamer(form) {
    var input = document.getElementById("rn-input"), list = document.getElementById("rn-list"), msg = document.getElementById("rn-msg"), files = [];
    function opts() { var o = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) o[el.name] = el.type === "checkbox" ? el.checked : el.value; }); return o; }
    function sorted() {
      var o = opts(), f = files.slice();
      if (o.sort === "name") f.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
      else if (o.sort === "date") f.sort(function (a, b) { return a.lastModified - b.lastModified; });
      else if (o.sort === "size") f.sort(function (a, b) { return a.size - b.size; });
      return f;
    }
    function render() {
      msg.textContent = "";
      if (!files.length) { list.innerHTML = '<p class="muted">Choose files to see a preview of the new names.</p>'; return; }
      try {
        var f = sorted(), n = newNames(f, opts()), changed = 0;
        list.innerHTML = '<table class="rn-table"><thead><tr><th>Current name</th><th>New name</th></tr></thead><tbody>' + f.slice(0, 500).map(function (x, i) {
          if (x.name !== n[i]) changed++;
          return "<tr><td>" + esc(x.name) + "</td><td" + (x.name !== n[i] ? ' class="good"' : "") + ">" + esc(n[i]) + "</td></tr>";
        }).join("") + "</tbody></table>" + (f.length > 500 ? '<p class="muted">…and ' + (f.length - 500) + " more</p>" : "");
        list.setAttribute("data-names", JSON.stringify(n));
        document.getElementById("rn-count").textContent = files.length + " files · " + changed + " will change";
      } catch (e) { msg.textContent = e.message; }
    }
    wireDrop(document.getElementById("drop"), input, function (fl) { files = Array.prototype.slice.call(fl, 0, 2000); input.value = ""; render(); });
    form.addEventListener("input", render); form.addEventListener("change", render); form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("rn-zip").addEventListener("click", function () {
      if (!files.length) return; var f = sorted(), n = newNames(f, opts()), btn = this, total = f.reduce(function (s, x) { return s + x.size; }, 0);
      if (total > 1.5 * 1073741824) { msg.textContent = "That's more than 1.5 GB. Use the rename script instead, which renames the files in place."; return; }
      btn.disabled = true; btn.textContent = "Zipping…";
      Promise.all(f.map(function (x) { return x.arrayBuffer(); })).then(function (bufs) {
        var z = {}; bufs.forEach(function (b, i) { z[n[i]] = [new Uint8Array(b), { level: 0 }]; });
        dl(new Blob([fflate.zipSync(z)], { type: "application/zip" }), "renamed-files.zip");
      }).catch(function () { msg.textContent = "Couldn't read some files. Please try again."; }).then(function () { btn.disabled = false; btn.textContent = "Download renamed copies (.zip)"; });
    });
    document.getElementById("rn-script").addEventListener("click", function () {
      if (!files.length) return; var f = sorted(), n = newNames(f, opts()), os = form.elements.os.value, lines;
      if (os === "win") lines = ["@echo off", "REM Put this file in the same folder as your files, then double-click it."].concat(f.map(function (x, i) { return x.name === n[i] ? null : 'ren "' + x.name + '" "' + n[i] + '"'; }).filter(Boolean));
      else lines = ["#!/bin/sh", "# Run inside the folder that holds your files:  sh rename.sh", "set -e"].concat(f.map(function (x, i) { return x.name === n[i] ? null : "mv -n -- " + shellQuote(x.name) + " " + shellQuote(n[i]); }).filter(Boolean));
      dl(new Blob([lines.join(os === "win" ? "\r\n" : "\n") + "\n"], { type: "text/plain" }), os === "win" ? "rename.bat" : "rename.sh");
    });
    render();
  }

  /* ---------- Hashing helpers ---------- */
  // Compact MD5 (public-domain algorithm), for checksum verification only.
  function md5(buf) {
    var b = new Uint8Array(buf), n = b.length, words = new Uint32Array(((n + 8 >>> 6) + 1) << 4);
    for (var i = 0; i < n; i++) words[i >> 2] |= b[i] << ((i % 4) << 3);
    words[n >> 2] |= 0x80 << ((n % 4) << 3); words[words.length - 2] = (n * 8) >>> 0; words[words.length - 1] = Math.floor(n / 536870912) >>> 0;
    var S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21], K = [];
    for (i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (var j = 0; j < words.length; j += 16) {
      var A = a0, B = b0, C = c0, D = d0;
      for (i = 0; i < 64; i++) {
        var F, g, r = i >> 4;
        if (r === 0) { F = (B & C) | (~B & D); g = i; } else if (r === 1) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; } else if (r === 2) { F = B ^ C ^ D; g = (3 * i + 5) % 16; } else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + words[j + g]) >>> 0; A = D; D = C; C = B;
        var s = S[(r << 2) | (i & 3)]; B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return [a0, b0, c0, d0].map(function (v) { var h = ""; for (var k = 0; k < 4; k++) h += ("0" + ((v >>> (k * 8)) & 255).toString(16)).slice(-2); return h; }).join("");
  }
  function digest(alg, buf) { return alg === "MD5" ? Promise.resolve(md5(buf)) : crypto.subtle.digest(alg, buf).then(hex); }

  /* ---------- Duplicate finder ---------- */
  var BIG = 512 * 1048576;
  function fingerprint(f) {
    if (f.size <= BIG) return f.arrayBuffer().then(function (b) { return crypto.subtle.digest("SHA-256", b); }).then(hex);
    var parts = [f.slice(0, 4194304), f.slice(Math.floor(f.size / 2), Math.floor(f.size / 2) + 4194304), f.slice(f.size - 4194304)];
    return Promise.all(parts.map(function (p) { return p.arrayBuffer(); })).then(function (bs) { var all = new Uint8Array(bs.reduce(function (s, b) { return s + b.byteLength; }, 0)), o = 0; bs.forEach(function (b) { all.set(new Uint8Array(b), o); o += b.byteLength; }); return crypto.subtle.digest("SHA-256", all); }).then(function (h) { return "~" + hex(h); });
  }
  function initDupes(form) {
    var out = document.getElementById("dup-out"), status = document.getElementById("dup-status"), groups = [];
    function scan(fl) {
      var files = Array.prototype.filter.call(fl, function (f) { return f.size > 0 && !/(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(f.webkitRelativePath || f.name); });
      if (!files.length) { status.textContent = "No files found."; return; }
      var bySize = {}; files.forEach(function (f) { (bySize[f.size] = bySize[f.size] || []).push(f); });
      var cands = Object.keys(bySize).filter(function (k) { return bySize[k].length > 1; }).reduce(function (a, k) { return a.concat(bySize[k]); }, []);
      var done = 0, byHash = {}; out.innerHTML = "";
      status.textContent = "Scanning " + files.length.toLocaleString("en-GB") + " files… checking " + cands.length + " possible matches";
      var chain = Promise.resolve();
      cands.forEach(function (f) { chain = chain.then(function () { return fingerprint(f); }).then(function (h) { (byHash[f.size + ":" + h] = byHash[f.size + ":" + h] || []).push(f); done++; if (done % 10 === 0) status.textContent = "Checked " + done + " of " + cands.length + " possible matches…"; }); });
      chain.then(function () {
        groups = Object.keys(byHash).filter(function (k) { return byHash[k].length > 1; }).map(function (k) { return { files: byHash[k], likely: k.indexOf("~") >= 0 }; })
          .sort(function (a, b) { return b.files[0].size * (b.files.length - 1) - a.files[0].size * (a.files.length - 1); });
        var wasted = groups.reduce(function (s, g) { return s + g.files[0].size * (g.files.length - 1); }, 0);
        status.innerHTML = "<strong>" + files.length.toLocaleString("en-GB") + "</strong> files scanned · <strong>" + groups.length + "</strong> groups of duplicates · <strong>" + size(wasted) + "</strong> could be freed";
        out.setAttribute("data-groups", groups.length); out.setAttribute("data-wasted", wasted);
        out.innerHTML = groups.length ? groups.slice(0, 300).map(function (g, i) {
          return '<div class="dup-group"><div class="dup-head"><strong>' + esc(g.files[0].name) + '</strong><span class="muted">' + g.files.length + " copies · " + size(g.files[0].size) + " each" + (g.likely ? " · very large file, matched by sampling" : "") + "</span></div><ul>" +
            g.files.map(function (f, j) { return "<li>" + (j === 0 ? '<span class="badge">keep</span> ' : '<span class="badge dupe">duplicate</span> ') + esc(f.webkitRelativePath || f.name) + "</li>"; }).join("") + "</ul></div>";
        }).join("") : '<p class="good"><strong>No duplicates found.</strong> Every file is unique.</p>';
        document.getElementById("dup-csv").hidden = !groups.length;
      });
    }
    document.getElementById("dup-folder").addEventListener("change", function (e) { scan(e.target.files); e.target.value = ""; });
    document.getElementById("dup-files").addEventListener("change", function (e) { scan(e.target.files); e.target.value = ""; });
    document.getElementById("dup-csv").addEventListener("click", function () {
      var rows = [["Group", "Role", "Path", "Size (bytes)"]];
      groups.forEach(function (g, i) { g.files.forEach(function (f, j) { rows.push([i + 1, j ? "duplicate" : "keep", f.webkitRelativePath || f.name, f.size]); }); });
      dl(new Blob([rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n")], { type: "text/csv" }), "duplicates.csv");
    });
  }

  /* ---------- Checksum ---------- */
  function initChecksum(form) {
    var out = document.getElementById("ck-out"), file = null, hashes = {};
    function compare() {
      var exp = form.elements.expected.value.trim().toLowerCase().replace(/\s+/g, ""), m = document.getElementById("ck-match");
      if (!exp || !file) { m.textContent = ""; m.className = ""; return; }
      var hit = Object.keys(hashes).filter(function (k) { return hashes[k] === exp; })[0];
      m.className = hit ? "match ok" : "match bad"; m.textContent = hit ? "✓ Match: the file is identical (" + hit + ")" : "✗ No match. The file is different, corrupted or tampered with.";
    }
    function go(fl) {
      file = fl[0]; if (!file) return; hashes = {};
      out.innerHTML = '<p class="muted">Calculating checksums for ' + esc(file.name) + " (" + size(file.size) + ")…</p>";
      if (file.size > 2 * 1073741824) { out.innerHTML = '<p class="warn">Files over 2 GB are too large to check in a browser.</p>'; return; }
      file.arrayBuffer().then(function (buf) {
        var algs = ["MD5", "SHA-1", "SHA-256", "SHA-512"];
        return Promise.all(algs.map(function (a) { return digest(a, buf); })).then(function (r) {
          algs.forEach(function (a, i) { hashes[a] = r[i]; });
          out.innerHTML = '<p><strong>' + esc(file.name) + '</strong> <span class="muted">' + size(file.size) + "</span></p>" + algs.map(function (a) { return '<div class="calc-row"><span>' + a + '</span><code class="hash">' + hashes[a] + "</code></div>"; }).join("");
          out.setAttribute("data-sha256", hashes["SHA-256"]); compare();
        });
      }).catch(function () { out.innerHTML = '<p class="warn">Couldn\'t read that file.</p>'; });
    }
    wireDrop(document.getElementById("drop"), document.getElementById("ck-input"), go);
    form.elements.expected.addEventListener("input", compare); form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  window.ETBFiles = { newNames: newNames, md5: md5 };
  document.addEventListener("DOMContentLoaded", function () {
    var f; if ((f = document.querySelector("form[data-renamer]"))) initRenamer(f);
    if ((f = document.querySelector("[data-dupes]"))) initDupes(f);
    if ((f = document.querySelector("form[data-checksum]"))) initChecksum(f);
  });
})();
