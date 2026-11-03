/* etoolbox QR tools — everything runs in the browser; nothing is uploaded. */
(function () {
  "use strict";

  var CFG = window.ETB_CONFIG || {};
  if (window.qrcode) qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  /* ---------- Payload builders (pure functions, exported for tests) ---------- */

  function escWifi(s) { return String(s).replace(/([\\;,:"])/g, "\\$1"); }
  function escVcard(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }

  function normaliseUrl(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;            // already has a scheme
    if (/^[^\s]+\.[a-z]{2,}([\/?#].*)?$/i.test(s)) return "https://" + s; // looks like a domain
    return s;                                                  // plain text
  }

  function normalisePhone(raw) {
    var d = String(raw || "").replace(/[^\d+]/g, "");
    if (d.indexOf("+") === 0) d = d.slice(1);
    else if (d.indexOf("00") === 0) d = d.slice(2);
    else if (d.charAt(0) === "0") d = "44" + d.slice(1);        // UK local number -> +44
    d = d.replace(/\D/g, "");
    return d;
  }

  var builders = {
    url: function (v) {
      var u = normaliseUrl(v.url);
      if (!u) return { error: "Enter a website address or some text." };
      return { data: u };
    },
    menu: function (v) {
      var u = normaliseUrl(v.url);
      if (!u) return { error: "Enter the web address of your menu." };
      if (!/^https?:\/\//i.test(u)) return { error: "That doesn't look like a web address (e.g. yourcafe.co.uk/menu)." };
      return { data: u };
    },
    wifi: function (v) {
      if (!v.ssid) return { error: "Enter your Wi-Fi network name." };
      var t = v.security || "WPA";
      if (t !== "nopass" && !v.password) return { error: "Enter the Wi-Fi password (or choose 'No password')." };
      var s = "WIFI:T:" + t + ";S:" + escWifi(v.ssid) + ";";
      if (t !== "nopass") s += "P:" + escWifi(v.password) + ";";
      if (v.hidden) s += "H:true;";
      return { data: s + ";" };
    },
    vcard: function (v) {
      var first = (v.first || "").trim(), last = (v.last || "").trim();
      if (!first && !last && !(v.org || "").trim()) return { error: "Enter at least a name or a business name." };
      var L = ["BEGIN:VCARD", "VERSION:3.0",
        "N:" + escVcard(last) + ";" + escVcard(first) + ";;;",
        "FN:" + escVcard((first + " " + last).trim() || v.org)];
      if (v.org) L.push("ORG:" + escVcard(v.org));
      if (v.title) L.push("TITLE:" + escVcard(v.title));
      if (v.phone) L.push("TEL;TYPE=CELL:" + escVcard(v.phone));
      if (v.workphone) L.push("TEL;TYPE=WORK:" + escVcard(v.workphone));
      if (v.email) L.push("EMAIL:" + escVcard(v.email));
      if (v.website) L.push("URL:" + escVcard(normaliseUrl(v.website)));
      if (v.street || v.city || v.postcode || v.country)
        L.push("ADR;TYPE=WORK:;;" + [v.street, v.city, "", v.postcode, v.country].map(function (x) { return escVcard(x || ""); }).join(";"));
      L.push("END:VCARD");
      return { data: L.join("\r\n") };
    },
    whatsapp: function (v) {
      var n = normalisePhone(v.phone);
      if (n.length < 8) return { error: "Enter a full phone number, e.g. 07700 900123 or +44 7700 900123." };
      var s = "https://wa.me/" + n;
      if (v.message) s += "?text=" + encodeURIComponent(v.message);
      return { data: s };
    }
  };

  /* ---------- QR rendering ---------- */

  function makeQr(data, ecc) {
    var qr = qrcode(0, ecc || "M");
    qr.addData(data, "Byte");
    qr.make();
    return qr;
  }

  function drawQr(canvas, qr, sizePx, fg, bg, margin) {
    var n = qr.getModuleCount(), total = n + margin * 2, s = sizePx / total;
    canvas.width = sizePx; canvas.height = sizePx;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sizePx, sizePx);
    ctx.fillStyle = fg;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      var x0 = Math.round((c + margin) * s), y0 = Math.round((r + margin) * s);
      var x1 = Math.round((c + margin + 1) * s), y1 = Math.round((r + margin + 1) * s);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    return canvas;
  }

  function qrSvg(qr, fg, bg, margin) {
    var n = qr.getModuleCount(), total = n + margin * 2, d = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++)
      if (qr.isDark(r, c)) d += "M" + (c + margin) + " " + (r + margin) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total + '" width="1024" height="1024" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="' + bg + '"/><path fill="' + fg + '" d="' + d + '"/></svg>';
  }

  function luminance(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return 0;
    var v = parseInt(m[1], 16), rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(function (x) {
      x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrastIssue(fg, bg) {
    var a = luminance(fg), b = luminance(bg);
    if (a > b) return "Use a darker colour for the code than the background, or some phones won't scan it.";
    if ((b + 0.05) / (a + 0.05) < 4) return "These colours are too similar. Phones may struggle to scan it.";
    return "";
  }

  function download(href, name) {
    var a = document.createElement("a"); a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- Printable table card (menu tool) ---------- */

  function wrapText(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCard(qr, opts) {
    var W = 1240, H = 1748, c = document.createElement("canvas"); // A6 at 300dpi
    c.width = W; c.height = H;
    var ctx = c.getContext("2d"), font = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = opts.accent; ctx.fillRect(0, 0, W, 300);
    ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
    ctx.font = "800 96px " + font;
    var nameLines = wrapText(ctx, opts.name || "Our menu", W - 160).slice(0, 2);
    if (nameLines.length > 1) ctx.font = "800 76px " + font;
    nameLines.forEach(function (l, i) { ctx.fillText(l, W / 2, nameLines.length > 1 ? 130 + i * 90 : 185); });
    ctx.fillStyle = "#14213d"; ctx.font = "700 72px " + font;
    ctx.fillText(opts.heading || "Scan to view our menu", W / 2, 430);
    var q = document.createElement("canvas");
    drawQr(q, qr, 860, "#000000", "#ffffff", 2);
    ctx.drawImage(q, (W - 860) / 2, 490);
    ctx.fillStyle = "#4a5672"; ctx.font = "500 46px " + font;
    wrapText(ctx, opts.caption || "", W - 200).slice(0, 2).forEach(function (l, i) { ctx.fillText(l, W / 2, 1450 + i * 60); });
    if (opts.watermark) { ctx.fillStyle = "#9aa3b8"; ctx.font = "500 30px " + font; ctx.fillText("Free QR codes at etoolbox.co.uk", W / 2, H - 50); }
    return c;
  }

  /* ---------- Page wiring ---------- */

  function formValues(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      v[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return v;
  }

  function initGenerator(form) {
    var tool = form.getAttribute("data-tool"), build = builders[tool];
    var canvas = document.getElementById("qr-canvas"), empty = document.getElementById("qr-empty");
    var warn = document.getElementById("qr-warn"), actions = document.getElementById("qr-actions");
    var current = null, timer = null;

    function update() {
      var v = formValues(form), res = build(v);
      var fg = v.fg || "#000000", bg = v.bg || "#ffffff", ecc = v.ecc || "M";
      var touched = form.getAttribute("data-touched") === "1";
      warn.textContent = "";
      if (res.error) {
        current = null; canvas.hidden = true; empty.hidden = false; actions.hidden = true;
        if (touched) warn.textContent = res.error;
        return;
      }
      try { current = { qr: makeQr(res.data, ecc), data: res.data, fg: fg, bg: bg, v: v }; }
      catch (e) { current = null; warn.textContent = "That's too much information for one QR code. Please shorten it."; return; }
      drawQr(canvas, current.qr, 640, fg, bg, 4);
      canvas.setAttribute("data-payload", res.data);
      canvas.hidden = false; empty.hidden = true; actions.hidden = false;
      warn.textContent = contrastIssue(fg, bg);
    }

    form.addEventListener("input", function () {
      form.setAttribute("data-touched", "1");
      clearTimeout(timer); timer = setTimeout(update, 120);
    });
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); form.setAttribute("data-touched", "1"); update(); });

    var fname = "qr-" + tool;
    document.getElementById("dl-png").addEventListener("click", function () {
      if (!current) return;
      var size = parseInt(current.v.size || "1024", 10);
      download(drawQr(document.createElement("canvas"), current.qr, size, current.fg, current.bg, 4).toDataURL("image/png"), fname + ".png");
    });
    document.getElementById("dl-svg").addEventListener("click", function () {
      if (!current) return;
      var blob = new Blob([qrSvg(current.qr, current.fg, current.bg, 4)], { type: "image/svg+xml" });
      var url = URL.createObjectURL(blob); download(url, fname + ".svg"); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    var cardBtn = document.getElementById("dl-card");
    if (cardBtn) cardBtn.addEventListener("click", function () {
      if (!current) return;
      var v = current.v;
      download(drawCard(current.qr, { name: v.business, heading: v.heading, caption: v.caption, accent: v.accent || "#ff6b35", watermark: true }).toDataURL("image/png"), "table-card.png");
    });

    update();
  }

  function initProLinks() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-plan]"), function (a) {
      var plan = a.getAttribute("data-plan");
      var url = plan === "yearly" ? CFG.proYearlyCheckoutUrl : CFG.proMonthlyCheckoutUrl;
      if (url) { a.href = url; return; }
      a.textContent = "Join early access";
      a.href = "mailto:" + (CFG.contactEmail || "") + "?subject=" + encodeURIComponent("etoolbox Pro early access") +
        "&body=" + encodeURIComponent("Hi, I'd like early access to etoolbox Pro (dynamic QR codes).\n\nBusiness name:\nWhat I'd use it for:\n");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-price]"), function (el) {
      var k = el.getAttribute("data-price"); if (CFG[k]) el.textContent = CFG[k];
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-contact]"), function (el) {
      el.href = "mailto:" + CFG.contactEmail; if (!el.textContent.trim()) el.textContent = CFG.contactEmail;
    });
  }


  /* ---------- Platform: theme, search, favourites, recently used ---------- */
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var TOOLS = (window.ETB_TOOLS || []).map(function (t) { return { slug: t[0], icon: t[1], name: t[2], desc: t[3], cat: t[4] }; });
  var BY = {}; TOOLS.forEach(function (t) { BY[t.slug] = t; });

  function initTheme() {
    var b = document.getElementById("theme-toggle"); if (!b) return;
    function current() { var a = document.documentElement.getAttribute("data-theme"); return a || (matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
    function label() { var d = current() === "dark"; b.textContent = d ? "☀" : "☾"; b.setAttribute("aria-label", d ? "Switch to light mode" : "Switch to dark mode"); }
    b.addEventListener("click", function () { var n = current() === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", n); try { localStorage.setItem("etb-theme", n); } catch (e) {} label(); });
    label();
  }

  var SYN = { pdf: "document acrobat", jpg: "jpeg photo picture image", png: "image picture", compress: "reduce shrink smaller size", convert: "change", word: "docx doc", qr: "qrcode barcode", vat: "tax", money: "finance £ pounds", password: "secure", ocr: "text scan read extract", dns: "domain nameserver", email: "mail gmail outlook", photo: "image picture", resize: "scale dimensions", merge: "combine join", split: "separate extract", rename: "files bulk batch", duplicate: "same identical files", speed: "performance pagespeed core web vitals lcp", budget: "money spending", time: "zone clock meeting", recipe: "cooking food ingredients", webcam: "camera microphone mic test", invoice: "bill receipt" };
  function score(t, q) {
    var hay = (t.name + " " + t.desc + " " + t.cat + " " + t.slug.replace(/-/g, " ")).toLowerCase(), words = q.toLowerCase().split(/\s+/).filter(Boolean), sc = 0;
    Object.keys(SYN).forEach(function (k) { if (hay.indexOf(k) >= 0) hay += " " + SYN[k]; });
    for (var i = 0; i < words.length; i++) {
      var w = words[i]; if (hay.indexOf(w) < 0) return 0;
      sc += t.name.toLowerCase().indexOf(w) === 0 ? 6 : t.name.toLowerCase().indexOf(w) >= 0 ? 4 : 1;
    }
    return sc;
  }
  function search(q) { return TOOLS.map(function (t) { return { t: t, s: score(t, q) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (x) { return x.t; }); }

  function initSearch() {
    var input = document.getElementById("tool-search"), list = document.getElementById("search-results"); if (!input) return;
    var items = [], active = -1;
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function render() {
      var q = input.value.trim(); active = -1;
      if (!q) { list.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
      items = search(q);
      list.innerHTML = items.length ? items.map(function (t, i) { return '<li role="option" id="sr-' + i + '"><a href="/' + t.slug + '/"><span>' + t.icon + "</span><span><strong>" + esc(t.name) + '</strong><span class="muted">' + esc(t.desc) + "</span></span></a></li>"; }).join("") : '<li class="empty">No tools match "' + esc(q) + '". Try another word.</li>';
      list.hidden = false; input.setAttribute("aria-expanded", "true");
    }
    function move(d) { var lis = list.querySelectorAll("li[role=option]"); if (!lis.length) return; active = (active + d + lis.length) % lis.length; lis.forEach(function (li, i) { li.classList.toggle("active", i === active); }); input.setAttribute("aria-activedescendant", "sr-" + active); }
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); } else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { var t = items[active >= 0 ? active : 0]; if (t) { e.preventDefault(); location.href = "/" + t.slug + "/"; } }
      else if (e.key === "Escape") { input.value = ""; render(); input.blur(); }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".search")) list.hidden = true; });
    input.addEventListener("focus", render);
    document.addEventListener("keydown", function (e) { if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); input.focus(); } });
  }

  function initFavRecent() {
    var head = document.querySelector(".page-head[data-slug]");
    if (head && BY[head.getAttribute("data-slug")]) {
      var slug = head.getAttribute("data-slug"), favs = store("etb-favs") || [], rec = (store("etb-recent") || []).filter(function (x) { return x !== slug; });
      rec.unshift(slug); store("etb-recent", rec.slice(0, 8));
      var b = document.createElement("button"); b.type = "button"; b.className = "fav-btn";
      var set = function (on) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = on ? "★ Saved to favourites" : "☆ Add to favourites"; };
      set(favs.indexOf(slug) >= 0);
      b.addEventListener("click", function () { var f = store("etb-favs") || [], i = f.indexOf(slug); if (i >= 0) f.splice(i, 1); else f.unshift(slug); store("etb-favs", f); set(i < 0); });
      head.querySelector("h1").appendChild(b);
    }
    var mine = document.getElementById("my-tools");
    if (mine) {
      var card = function (t) { return '<a class="tool-card" href="/' + t.slug + '/"><div class="icon">' + t.icon + "</div><h3>" + t.name + "</h3><p>" + t.desc + "</p></a>"; };
      var f = (store("etb-favs") || []).filter(function (x) { return BY[x]; }).map(function (x) { return BY[x]; });
      var r = (store("etb-recent") || []).filter(function (x) { return BY[x]; }).map(function (x) { return BY[x]; }).slice(0, 6);
      var html = "";
      if (f.length) html += '<section id="favourites"><h2>⭐ Your favourites</h2><div class="grid">' + f.map(card).join("") + "</div></section>";
      if (r.length) html += '<section id="recent"><h2>🕘 Recently used</h2><div class="grid">' + r.map(card).join("") + "</div></section>";
      mine.innerHTML = html;
    }
  }

  window.ETBSearch = search;

  window.ETB = { builders: builders, normaliseUrl: normaliseUrl, normalisePhone: normalisePhone, makeQr: makeQr };

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("qr-form");
    if (form) initGenerator(form);
    initProLinks(); initTheme(); initSearch(); initFavRecent();
  });
})();
