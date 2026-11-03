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
  var TOOLS = (window.ETB_TOOLS || []).map(function (t) { return { slug: t[0], icon: t[1], name: t[2], desc: t[3], cat: t[4], key: t[5] }; });
  var BY = {}; TOOLS.forEach(function (t) { BY[t.slug] = t; });

  function initTheme() {
    var b = document.getElementById("theme-toggle"); if (!b) return;
    function current() { var a = document.documentElement.getAttribute("data-theme"); return a || (matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
    function label() { var d = current() === "dark"; b.textContent = d ? "☀" : "☾"; b.setAttribute("aria-label", d ? "Switch to light mode" : "Switch to dark mode"); }
    b.addEventListener("click", function () { var n = current() === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", n); try { localStorage.setItem("etb-theme", n); } catch (e) {} label(); });
    label();
  }

  var SYN = { pdf: "document acrobat", jpg: "jpeg photo picture image", png: "image picture", compress: "reduce shrink smaller size", convert: "change", word: "docx doc", qr: "qrcode barcode", vat: "tax", money: "finance £ pounds", password: "secure", ocr: "text scan read extract", dns: "domain nameserver", email: "mail gmail outlook", photo: "image picture", resize: "scale dimensions", merge: "combine join", split: "separate extract", rename: "files bulk batch", duplicate: "same identical files", speed: "performance pagespeed core web vitals lcp", budget: "money spending", time: "zone clock meeting", recipe: "cooking food ingredients", webcam: "camera microphone mic test", invoice: "bill receipt", background: "remove bg cutout transparent erase", watermark: "stamp logo copyright protect confidential draft brand", signature: "sign" };
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

  function initSearchBox(input, list, shortcut) {
    var items = [], active = -1, box = input.closest(".search");
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function render() {
      var q = input.value.trim(); active = -1;
      if (!q) { list.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
      items = search(q);
      var pre = list.id + "-";
      list.innerHTML = items.length ? items.map(function (t, i) { return '<li role="option" id="' + pre + i + '"><a href="/' + t.slug + '/">' + t.icon + "<span><strong>" + esc(t.name) + '</strong><span class="muted">' + esc(t.desc) + "</span></span></a></li>"; }).join("") : '<li class="empty">No tools match "' + esc(q) + '". Try another word.</li>';
      list.hidden = false; input.setAttribute("aria-expanded", "true");
    }
    function move(d) { var lis = list.querySelectorAll("li[role=option]"); if (!lis.length) return; active = (active + d + lis.length) % lis.length; lis.forEach(function (li, i) { li.classList.toggle("active", i === active); }); input.setAttribute("aria-activedescendant", list.id + "-" + active); }
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); } else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { var t = items[active >= 0 ? active : 0]; if (t) { e.preventDefault(); location.href = "/" + t.slug + "/"; } }
      else if (e.key === "Escape") { input.value = ""; render(); input.blur(); }
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) list.hidden = true; });
    input.addEventListener("focus", render);
    if (shortcut) document.addEventListener("keydown", function (e) { if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); (document.getElementById("hero-search") || input).focus(); } });
    return render;
  }
  function initSearch() {
    var input = document.getElementById("tool-search"), list = document.getElementById("search-results");
    if (input && list) initSearchBox(input, list, true);
    var hero = document.getElementById("hero-search"), hl = document.getElementById("hero-results");
    if (hero && hl) {
      var r = initSearchBox(hero, hl, false), q = null;
      try { q = new URLSearchParams(location.search).get("q"); } catch (e) { q = null; }
      if (q) { hero.value = q; r(); hero.focus(); }
    }
  }

  function initTabs() {
    var bar = document.querySelector(".tabs[role=toolbar]"); if (!bar) return;
    var cats = document.querySelectorAll(".cat[data-cat]");
    function show(f) {
      bar.querySelectorAll(".tab").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filter") === f ? "true" : "false"); });
      cats.forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-cat") !== f; });
    }
    bar.addEventListener("click", function (e) { var b = e.target.closest(".tab"); if (b) show(b.getAttribute("data-filter")); });
    // Category links (#pdf etc.) from the header or footer: show that category and scroll to it
    function fromHash() { var h = location.hash.slice(1); if (h && document.querySelector('.cat[data-cat="' + h + '"]')) { show(h); } }
    window.addEventListener("hashchange", fromHash); fromHash();
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
      var card = function (t) { return '<a class="tool-card" href="/' + t.slug + '/">' + t.icon + "<h3>" + t.name + "</h3><p>" + t.desc + "</p></a>"; };
      var f = (store("etb-favs") || []).filter(function (x) { return BY[x]; }).map(function (x) { return BY[x]; });
      var r = (store("etb-recent") || []).filter(function (x) { return BY[x]; }).map(function (x) { return BY[x]; }).slice(0, 6);
      var html = "";
      if (f.length) html += '<section id="favourites"><h2>Your favourites</h2><div class="grid">' + f.map(card).join("") + "</div></section>";
      if (r.length) html += '<section id="recent"><h2>Recently used</h2><div class="grid">' + r.map(card).join("") + "</div></section>";
      mine.innerHTML = html;
    }
  }

  window.ETBSearch = search;

  /* ---------- Pro licence (keys checked by our server, remembered on this device) ---------- */
  var ETBPro = (function () {
    var K = "etb-pro", FMT = /^ETB(-[A-Z0-9]{4}){4}$/;
    function get() { try { return JSON.parse(localStorage.getItem(K) || "null"); } catch (e) { return null; } }
    function put(v) { try { if (v) localStorage.setItem(K, JSON.stringify(v)); else localStorage.removeItem(K); } catch (e) {} document.dispatchEvent(new Event("etb-pro-change")); }
    function isPro() { var d = get(); return !!(d && d.key && (!d.expires || Date.parse(d.expires) > Date.now())); }
    function norm(k) { return String(k || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^ETB/, "").replace(/(.{4})(?=.)/g, "$1-").replace(/^/, "ETB-"); }
    function check(key) {
      return fetch("/api/pro/activate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: key }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) { var e = new Error(j.error || "Couldn't check your key. Please try again."); e.status = r.status; throw e; } return j; }); });
    }
    function activate(raw) {
      var key = norm(raw);
      if (!FMT.test(key)) return Promise.reject(new Error("Pro keys look like ETB-XXXX-XXXX-XXXX-XXXX."));
      return check(key).then(function (j) { put({ key: key, plan: j.plan || "pro", expires: j.expires || null, checked: Date.now() }); return j; });
    }
    // Re-check once a day so cancelled or expired keys stop working.
    var d = get();
    if (d && d.key && (!d.checked || Date.now() - d.checked > 864e5)) check(d.key).then(function (j) { d.checked = Date.now(); d.expires = j.expires || null; put(d); }).catch(function (e) { if (e.status === 404 || e.status === 410) put(null); });
    return { isPro: isPro, activate: activate, deactivate: function () { put(null); }, info: get, normalise: norm };
  })();
  window.ETBPro = ETBPro;


  /* ---------- Usage counter & feedback ---------- */
  function initUsage() {
    var CFG2 = window.ETB_CONFIG || {}, head = document.querySelector(".page-head[data-slug]"), isHome = !!document.getElementById("my-tools");
    var slug = head ? head.getAttribute("data-slug") : isHome ? "home" : null; if (!slug) return;
    function post(path, body) { return fetch(path, { method: "POST", keepalive: true, headers: { "content-type": "application/json", "x-etb": "1" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
    var seenKey = "etb-v:" + slug;
    try { if (!sessionStorage.getItem(seenKey)) { sessionStorage.setItem(seenKey, "1"); post("/api/hit", { tool: slug, kind: "visit" }).catch(function () {}); } } catch (e) {}
    var fmt = function (n) { return Number(n).toLocaleString("en-GB"); };
    var stats = null;
    fetch("/api/stats?tool=" + slug).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return; stats = j;
      var pill = document.querySelector(".hero .pill");
      if (isHome && pill && j.total >= (CFG2.showSiteCounterFrom || 1000)) pill.insertAdjacentHTML("beforeend", ' · <span id="site-count">Used ' + fmt(j.total) + " times</span>");
      if (head && j.toolUses >= (CFG2.showToolCounterFrom || 100)) { var t = head.querySelector(".privacy-tag"); if (t) t.insertAdjacentHTML("afterend", ' <span class="privacy-tag use-count">✓ Used ' + fmt(j.toolUses) + " times</span>"); }
      renderRating();
    }).catch(function () {});
    if (!head) return;

    // ----- feedback box (inline at the end of the tool, plus a one-time prompt after first use) -----
    var VKEY = "etb-fb:" + slug, voted = null; try { voted = JSON.parse(localStorage.getItem(VKEY) || "null"); } catch (e) {}
    var box = document.createElement("section"); box.className = "fb-box"; box.id = "feedback";
    var anchor = document.querySelector("main .wrap > section.prose") || document.querySelector("main .wrap > section");
    if (anchor) anchor.parentNode.insertBefore(box, anchor); else document.querySelector("main .wrap").appendChild(box);
    function renderRating() {
      var r = box.querySelector(".fb-rating"); if (!r || !stats) return; var n = stats.up + stats.down;
      r.textContent = n >= ((window.ETB_CONFIG || {}).showRatingFrom || 5) ? Math.round(stats.up / n * 100) + "% of " + fmt(n) + " people found this helpful" : "";
    }
    function vote(v, where) {
      voted = { vote: v, ts: Date.now() }; try { localStorage.setItem(VKEY, JSON.stringify(voted)); } catch (e) {}
      post("/api/feedback", { tool: slug, vote: v }).then(function (j) { if (j && j.ok && stats) { stats.up = j.up; stats.down = j.down; renderRating(); } }).catch(function () {});
      draw(); closeToast(); box.querySelector("textarea") && box.querySelector("textarea").focus();
      if (where === "toast") box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function draw(sent) {
      box.innerHTML = '<div class="fb-row"><strong>' + (voted ? (voted.vote > 0 ? "Thanks! Glad it helped 🙌" : "Thanks. Sorry it wasn't great 🙏") : "Was this tool helpful?") + "</strong>" +
        (voted ? "" : '<button type="button" class="fb-btn" data-v="1" aria-label="Yes, helpful">👍 Yes</button><button type="button" class="fb-btn" data-v="-1" aria-label="No, not helpful">👎 No</button>') +
        '<span class="fb-rating muted"></span></div>' +
        (voted && !sent ? '<div class="fb-comment"><label for="fb-text">' + (voted.vote > 0 ? "Anything we could make even better? (optional)" : "What went wrong, or what were you hoping for? (optional)") + '</label><textarea id="fb-text" maxlength="1000" rows="2" placeholder="Your comment helps us improve this tool"></textarea>' +
          '<div class="btn-row" style="margin-top:6px"><button type="button" class="btn small" id="fb-send">Send comment</button><span class="hint">Please don\'t include personal details.</span></div></div>' : "") +
        (sent ? '<p class="good" style="margin:6px 0 0">✓ Comment received. Thank you!</p>' : "");
      renderRating();
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".fb-btn"); if (b) { vote(+b.getAttribute("data-v"), "inline"); return; }
      if (e.target.id === "fb-send") {
        var t = box.querySelector("textarea").value.trim(); if (!t) { box.querySelector("textarea").focus(); return; }
        e.target.disabled = true;
        post("/api/feedback", { tool: slug, vote: voted ? voted.vote : 1, comment: t }).then(function (j) { if (!j.ok) throw new Error(j.error); draw(true); }).catch(function (err) { e.target.disabled = false; e.target.textContent = "Couldn't send. Try again"; });
      }
    });
    draw();

    var toast = null;
    function closeToast() { if (toast) { toast.remove(); toast = null; } }
    function askAfterUse() {
      var AK = "etb-fb-asked:" + slug; try { if (voted || localStorage.getItem(AK)) return; localStorage.setItem(AK, "1"); } catch (e) { return; }
      toast = document.createElement("div"); toast.className = "fb-toast"; toast.setAttribute("role", "dialog"); toast.setAttribute("aria-label", "Feedback");
      toast.innerHTML = '<button type="button" class="modal-x" aria-label="Close">×</button><strong>Did this tool do the job?</strong><div class="btn-row" style="margin-top:8px"><button type="button" class="fb-btn" data-v="1">👍 Yes</button><button type="button" class="fb-btn" data-v="-1">👎 No</button></div>';
      toast.addEventListener("click", function (e) { var b = e.target.closest(".fb-btn"); if (b) vote(+b.getAttribute("data-v"), "toast"); else if (e.target.closest(".modal-x")) closeToast(); });
      document.body.appendChild(toast); setTimeout(closeToast, 20000);
    }

    // ----- count a "use" once per page load: download, print, copy, or a few seconds of working with the tool -----
    var used = false;
    function markUse() { if (used) return; used = true; post("/api/hit", { tool: slug, kind: "use" }).catch(function () {}); setTimeout(askAfterUse, 1500); }
    window.ETBUse = markUse;
    var oc = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute("download")) markUse(); return oc.apply(this, arguments); };
    document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[download]"); if (a) markUse(); }, true);
    var op = window.print; window.print = function () { markUse(); return op.apply(window, arguments); };
    if (navigator.clipboard && navigator.clipboard.writeText) { var ow = navigator.clipboard.writeText.bind(navigator.clipboard); try { navigator.clipboard.writeText = function (t) { markUse(); return ow(t); }; } catch (e) {} }
    var tool = document.querySelector("main .wrap"), t0 = 0;
    ["input", "change"].forEach(function (ev) { tool.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest(".fb-box, .search")) return; if (!t0) t0 = Date.now(); else if (Date.now() - t0 > 4000) markUse(); }); });
  }

  function initProBox() {
    var box = document.getElementById("pro-box"); if (!box) return;
    var st = document.getElementById("pro-state"), input = document.getElementById("pro-key2"), btn = document.getElementById("pro-go"), msg = document.getElementById("pro-msg2");
    function show() { var on = ETBPro.isPro(), d = ETBPro.info(); st.innerHTML = on ? '<b class="good">✓ Pro is active on this device</b>' + (d.expires ? " until " + new Date(d.expires).toLocaleDateString("en-GB") : "") + ' · <button type="button" class="linkish" id="pro-off">Remove from this device</button>' : "Already bought Pro? Enter your key to unlock it on this device."; var off = document.getElementById("pro-off"); if (off) off.addEventListener("click", function () { ETBPro.deactivate(); show(); }); }
    btn.addEventListener("click", function () { btn.disabled = true; msg.className = "muted"; msg.textContent = "Checking…"; ETBPro.activate(input.value).then(function () { msg.className = "good"; msg.textContent = "Unlocked. Enjoy Pro!"; input.value = ""; show(); }).catch(function (e) { msg.className = "warn"; msg.textContent = e.message; }).then(function () { btn.disabled = false; }); });
    show();
  }


  window.ETB = { builders: builders, normaliseUrl: normaliseUrl, normalisePhone: normalisePhone, makeQr: makeQr };

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("qr-form");
    if (form) initGenerator(form);
    initProLinks(); initTheme(); initSearch(); initTabs(); initFavRecent(); initProBox(); initUsage();
  });
})();

/* Share bar: native share on phones, copy link everywhere */
(function () {
  document.querySelectorAll(".share-bar").forEach(function (bar) {
    var url = bar.getAttribute("data-url"), text = bar.getAttribute("data-text");
    var nat = bar.querySelector(".sh-native");
    if (nat && navigator.share) { nat.hidden = false; nat.addEventListener("click", function () { navigator.share({ title: text, url: url }).catch(function () {}); }); }
    var cp = bar.querySelector(".sh-copy");
    if (cp) cp.addEventListener("click", function () {
      var done = function () { var s = cp.querySelector("span"); s.textContent = "Copied!"; setTimeout(function () { s.textContent = "Copy link"; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
    });
  });
})();

/* Featured local business: right rail on wide screens, small card bottom-right elsewhere; hide for 7 days when closed */
(function () {
  var ad = document.getElementById("fad"); if (!ad) return;
  var KEY = "etb-fad-hide", now = Date.now();
  try { if (+localStorage.getItem(KEY) > now) return; } catch (e) {}
  var wide = function () { return window.innerWidth >= 1420; };
  var show = function () { ad.hidden = false; requestAnimationFrame(function () { ad.classList.add("in"); }); };
  if (wide()) setTimeout(show, 900);
  else { var on = function () { if (window.scrollY > 500) { show(); window.removeEventListener("scroll", on); } }; window.addEventListener("scroll", on, { passive: true }); }
  ad.querySelector(".fad-x").addEventListener("click", function () {
    ad.classList.remove("in"); setTimeout(function () { ad.hidden = true; }, 250);
    try { localStorage.setItem(KEY, String(now + 7 * 864e5)); } catch (e) {}
  });
})();
