/* etoolbox – Digital postcard maker.
   Landmark photos are freely licensed images from Wikimedia Commons, loaded from Wikimedia's servers.
   Each card credits the photographer and licence on the back, as the licences require.
   Everything is drawn in the browser on <canvas>; your own photos are never uploaded.
   Share links carry the card in the part of the address after # (never sent to our server). */
(function () {
  "use strict";
  var WM = "https://upload.wikimedia.org/wikipedia/commons/";
  var LIC = {
    "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
    "CC BY-SA 3.0 DE": "https://creativecommons.org/licenses/by-sa/3.0/de/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/", "Public domain": "https://commons.wikimedia.org/wiki/Help:Public_domain",
    "Free Art License": "https://artlibre.org/licence/lal/en/"
  };
  // id, place, country, landmark, hash path, file name, original width, portrait?, author, licence, focus (0–1 vertical)
  var CITIES = [
    ["london", "London", "United Kingdom", "Big Ben & Westminster", "0/05", "Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster,_London.jpg", 4347, 1, "Christian David", "CC BY-SA 4.0", .3],
    ["london-bridge", "London", "United Kingdom", "Tower Bridge", "5/59", "Tower_Bridge_at_Dawn.jpg", 5554, 0, "Fuzzypiggy", "CC BY-SA 3.0", .5],
    ["edinburgh", "Edinburgh", "Scotland", "Edinburgh Castle", "b/bb", "Edinburgh_Castle_from_Esplanade_20211019.jpg", 3832, 0, "Daniel Kraft", "CC BY-SA 3.0", .5],
    ["paris", "Paris", "France", "Eiffel Tower", "8/85", "Tour_Eiffel_Wikimedia_Commons_(cropped).jpg", 2900, 1, "Benh LIEU SONG", "Public domain", .35],
    ["rome", "Rome", "Italy", "Colosseum", "d/de", "Colosseo_2020.jpg", 12051, 0, "FeaturedPics (Wikimedia Commons)", "CC BY-SA 4.0", .5],
    ["venice", "Venice", "Italy", "Grand Canal", "5/51", "View_of_the_Grand_Canal_from_Rialto_to_Ca'Foscari.jpg", 7360, 0, "Didier Descouens", "CC BY-SA 4.0", .5],
    ["barcelona", "Barcelona", "Spain", "Sagrada Família", "e/ef", "SF_maig_2_cropped.jpg", 1227, 1, "Canaan", "CC BY-SA 4.0", .3],
    ["berlin", "Berlin", "Germany", "Brandenburg Gate", "a/a6", "Brandenburger_Tor_abends.jpg", 1920, 0, "Thomas Wolf, www.foto-tw.de", "CC BY-SA 3.0", .55],
    ["bavaria", "Bavaria", "Germany", "Neuschwanstein Castle", "f/f8", "Schloss_Neuschwanstein_2013.jpg", 5979, 0, "Thomas Wolf, www.foto-tw.de", "CC BY-SA 3.0 DE", .45],
    ["prague", "Prague", "Czechia", "Charles Bridge", "2/22", "Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg", 4555, 0, "A. Savin", "Free Art License", .5],
    ["istanbul", "Istanbul", "Türkiye", "Hagia Sophia", "4/4a", "Hagia_Sophia_(228968325).jpeg", 2048, 0, "Adli Wahid", "CC BY-SA 3.0", .5],
    ["lahore", "Lahore", "Pakistan", "Badshahi Mosque", "c/c8", "Badshahi_Mosque_front_picture.jpg", 2592, 0, "Romero Maia", "CC BY-SA 4.0", .6],
    ["lahore-minar", "Lahore", "Pakistan", "Minar-e-Pakistan", "4/42", "Minar_e_Pakistan_2021.jpg", 1217, 1, "King Eliot", "CC BY-SA 4.0", .25],
    ["karachi", "Karachi", "Pakistan", "Mazar-e-Quaid", "4/47", "PK_Karachi_asv2020-02_img52_Mazar-e-Quaid.jpg", 5176, 0, "A. Savin", "Free Art License", .45],
    ["islamabad", "Islamabad", "Pakistan", "Faisal Mosque", "e/e0", "Ali_Mujtaba_WLM2017_FAISAL_MOSQUE_019.jpg", 5392, 0, "Ali Mujtaba", "CC BY-SA 4.0", .5],
    ["faisalabad", "Faisalabad", "Pakistan", "Clock Tower (Ghanta Ghar)", "f/f1", "Clock_Tower_Faisalabad_by_Usman_Nadeem.jpg", 4920, 0, "Usman Nadeem", "CC BY-SA 4.0", .5],
    ["toba-tek-singh", "Toba Tek Singh", "Pakistan", "Railway Station", "2/27", "Toba_Tek_Singh_Train_Station.jpg", 3072, 0, "Hwt4321 (English Wikipedia)", "Public domain", .55],
    ["new-york", "New York", "USA", "Statue of Liberty", "8/89", "Front_view_of_Statue_of_Liberty_(cropped).jpg", 2498, 1, "AskALotl", "CC0", .3],
    ["san-francisco", "San Francisco", "USA", "Golden Gate Bridge", "b/bf", "Golden_Gate_Bridge_as_seen_from_Battery_East.jpg", 5388, 0, "Frank Schulenburg", "CC BY-SA 4.0", .5],
    ["rio", "Rio de Janeiro", "Brazil", "Christ the Redeemer", "4/4f", "Christ_the_Redeemer_-_Cristo_Redentor.jpg", 2497, 1, "Arne Müseler", "CC BY-SA 3.0 DE", .3],
    ["machu-picchu", "Machu Picchu", "Peru", "Machu Picchu", "b/bb", "Machu_Picchu,_2023_(012).jpg", 6960, 0, "Draceane", "CC BY-SA 4.0", .5],
    ["cairo", "Cairo", "Egypt", "Pyramids of Giza", "9/96", "Pyramids_of_the_Giza_Necropolis.jpg", 10104, 0, "KennyOMG", "CC BY-SA 4.0", .5],
    ["agra", "Agra", "India", "Taj Mahal", "1/1d", "Taj_Mahal_(Edited).jpeg", 3840, 0, "Yann; edited by Jim Carter", "CC BY-SA 4.0", .5],
    ["beijing", "Beijing", "China", "Great Wall of China", "2/23", "The_Great_Wall_of_China_at_Jinshanling-edit.jpg", 4288, 0, "Severin.stalder", "CC BY-SA 3.0", .5],
    ["japan", "Japan", "Japan", "Mount Fuji", "f/f8", "View_of_Mount_Fuji_from_Ōwakudani_20211202.jpg", 4231, 0, "Suicasmo", "CC BY-SA 4.0", .45],
    ["singapore", "Singapore", "Singapore", "Marina Bay Sands", "c/c7", "Marina_Bay_Sands_(I).jpg", 6366, 0, "Supanut Arunoprayote", "CC BY 4.0", .5],
    ["sydney", "Sydney", "Australia", "Sydney Opera House", "e/e1", "Sydney_Opera_House_2026.jpg", 5184, 0, "BAVhah", "CC BY-SA 4.0", .5]
  ].map(function (a) { return { id: a[0], place: a[1], country: a[2], landmark: a[3], h: a[4], file: a[5], ow: a[6], portrait: !!a[7], author: a[8], lic: a[9], focus: a[10] }; });
  var BY = {}; CITIES.forEach(function (c) { BY[c.id] = c; });

  function enc(f) { return encodeURIComponent(f).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27"); }
  function imgUrl(c, w) { var e = enc(c.file); return w >= c.ow ? WM + c.h + "/" + e : WM + "thumb/" + c.h + "/" + e + "/" + w + "px-" + e; }
  function pageUrl(c) { return "https://commons.wikimedia.org/wiki/File:" + enc(c.file); }

  var THEMES = { sunset: ["#ff6b35", "#ff3d7f"], ocean: ["#1fb6ff", "#2a9d8f"], gold: ["#f7c948", "#e07a1f"], white: ["#ffffff", "#f1f1f1"], royal: ["#7c5cff", "#2563eb"] };
  var W = 1500, H = 1000;
  var cache = {};
  function loadImg(src) {
    if (cache[src]) return cache[src];
    cache[src] = new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = function () { delete cache[src]; rej(new Error("img")); }; i.src = src; });
    return cache[src];
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['400 80px "Bebas Neue"', '700 40px "Dancing Script"', 'italic 400 40px "Instrument Serif"', '400 40px "Instrument Serif"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  }
  function cover(ctx, img, x, y, w, h, focus) {
    var s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
    var sx = (img.width - sw) / 2, sy = (img.height - sh) * (focus == null ? .5 : focus);
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function fitText(ctx, text, font, maxW, startPx, minPx) {
    var px = startPx; ctx.font = font.replace("{px}", px);
    while (px > minPx && ctx.measureText(text).width > maxW) { px -= 2; ctx.font = font.replace("{px}", px); }
    return px;
  }
  function wrap(ctx, text, maxW) {
    var out = [];
    String(text).split(/\n/).forEach(function (para) {
      var words = para.split(/\s+/), line = "";
      words.forEach(function (w) {
        var t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; }
        else line = t;
      });
      out.push(line);
    });
    return out;
  }

  /* ---------- Front ---------- */
  function drawFront(ctx, img, s, c) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H);
    var th = THEMES[s.theme] || THEMES.sunset, place = (s.place || "").toUpperCase(), greet = s.greet || "";
    var layout = s.style === "auto" ? ((c && c.portrait) || (img && img.height > img.width * 1.05) ? "panel" : "big") : s.style;
    if (layout === "panel") {
      var pw = Math.round(W * 0.56);
      if (img) cover(ctx, img, 0, 0, pw, H, c ? c.focus : .4);
      var g = ctx.createLinearGradient(pw, 0, W, H); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]);
      ctx.fillStyle = s.theme === "white" ? "#14213d" : g; ctx.fillRect(pw, 0, W - pw, H);
      // fine stripes for a vintage poster feel
      ctx.globalAlpha = .08; ctx.fillStyle = "#fff"; for (var i = -H; i < W; i += 28) { ctx.beginPath(); ctx.moveTo(pw + i, 0); ctx.lineTo(pw + i + 14, 0); ctx.lineTo(pw + i + 14 + H, H); ctx.lineTo(pw + i + H, H); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(pw, 0, W - pw, H); ctx.clip();
      var cx = pw + (W - pw) / 2;
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      if (greet) { ctx.font = '700 64px "Dancing Script", cursive'; ctx.fillText(greet, cx, H * 0.36); }
      var words = place.split(" "), lines = place.length > 9 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [place];
      var px = Math.min.apply(null, lines.map(function (l) { return fitText(ctx, l, '400 {px}px "Bebas Neue", Impact, sans-serif', W - pw - 90, 210, 60); }));
      ctx.font = '400 ' + px + 'px "Bebas Neue", Impact, sans-serif';
      ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowOffsetY = 6; ctx.shadowBlur = 12;
      lines.forEach(function (l, i) { ctx.fillText(l, cx, H * 0.36 + 40 + px * 0.92 * (i + 1)); });
      ctx.shadowColor = "transparent";
      if (c) { ctx.font = '600 30px Inter, Arial, sans-serif'; ctx.globalAlpha = .9; ctx.fillText(c.landmark, cx, H - 70); ctx.globalAlpha = 1; }
      ctx.restore();
      return;
    }
    if (img) cover(ctx, img, 0, 0, W, H, c ? c.focus : .5);
    var sh = ctx.createLinearGradient(0, H * 0.35, 0, H); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.6)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    if (layout === "photo") return;
    if (layout === "caption") {
      ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 14;
      if (greet) { ctx.font = '700 58px "Dancing Script", cursive'; ctx.fillText(greet, 70, H - 170); }
      fitText(ctx, place, '400 {px}px "Bebas Neue", Impact, sans-serif', W - 140, 130, 50); ctx.fillText(place, 70, H - 60);
      ctx.shadowColor = "transparent"; return;
    }
    // "big": large letters filled with colour, white outline and a deep shadow – the classic postcard look
    ctx.textAlign = "center";
    var size = fitText(ctx, place, '400 {px}px "Bebas Neue", Impact, sans-serif', W - 120, 420, 90);
    var y = H * 0.5 + size * 0.36;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 12; ctx.shadowBlur = 0;
    ctx.lineWidth = 26; ctx.strokeStyle = "#1b1b2a"; ctx.strokeText(place, W / 2, y);
    ctx.shadowColor = "transparent"; ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.lineWidth = 12; ctx.strokeStyle = "#fff"; ctx.strokeText(place, W / 2, y);
    var gr = ctx.createLinearGradient(0, y - size * 0.75, 0, y); gr.addColorStop(0, th[0]); gr.addColorStop(1, th[1]);
    ctx.fillStyle = gr; ctx.fillText(place, W / 2, y);
    if (greet) {
      ctx.font = '700 86px "Dancing Script", cursive'; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 16;
      ctx.fillText(greet, W / 2, y - size * 0.78 - 10); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
    }
  }

  /* ---------- Back ---------- */
  function drawBack(ctx, img, s, c) {
    ctx.clearRect(0, 0, W, H);
    var p = ctx.createLinearGradient(0, 0, W, H); p.addColorStop(0, "#fbf6ec"); p.addColorStop(1, "#f3ead8");
    ctx.fillStyle = p; ctx.fillRect(0, 0, W, H);
    // paper grain
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    ctx.fillStyle = "rgba(120,90,40,.05)"; for (var i = 0; i < 1600; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    var ink = "#22324f", hand = s.ink === "neat" ? 'italic 400 {px}px "Instrument Serif", Georgia, serif' : '700 {px}px "Dancing Script", cursive';
    ctx.fillStyle = "#7a6a55"; ctx.textAlign = "center"; ctx.font = '700 30px Inter, Arial, sans-serif';
    ctx.save(); ctx.translate(W / 2, 74); var t = "P O S T C A R D"; ctx.fillText(t, 0, 0); ctx.restore();
    // divider
    ctx.strokeStyle = "rgba(122,106,85,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * 0.56, 130); ctx.lineTo(W * 0.56, H - 110); ctx.stroke();
    // message
    var msg = s.msg || "", mx = 80, mw = W * 0.56 - 130, top = 150, bottom = H - 150;
    var px = 46, lines, lh;
    for (; px >= 24; px -= 2) {
      ctx.font = hand.replace("{px}", px); lines = wrap(ctx, msg, mw); lh = px * 1.32;
      if (lines.length * lh <= bottom - top - (s.from ? px * 1.6 : 0)) break;
    }
    ctx.fillStyle = ink; ctx.textAlign = "left";
    lines.forEach(function (l, i) { ctx.fillText(l, mx, top + px + i * lh); });
    if (s.from) { ctx.font = hand.replace("{px}", px + 2); ctx.textAlign = "right"; ctx.fillText("— " + s.from, W * 0.56 - 50, Math.min(bottom + 40, top + px + lines.length * lh + px * 1.3)); }
    // stamp (perforated edge with the landmark inside)
    var sx = W - 290, sy = 120, sw = 200, sh2 = 240;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.rect(sx, sy, sw, sh2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    for (var k = 0; k <= sw; k += 20) { ctx.beginPath(); ctx.arc(sx + k, sy, 6, 0, 7); ctx.arc(sx + k, sy + sh2, 6, 0, 7); ctx.fill(); }
    for (var k2 = 0; k2 <= sh2; k2 += 20) { ctx.beginPath(); ctx.arc(sx, sy + k2, 6, 0, 7); ctx.arc(sx + sw, sy + k2, 6, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(sx + 16, sy + 16, sw - 32, sh2 - 66); ctx.clip();
    if (img) cover(ctx, img, sx + 16, sy + 16, sw - 32, sh2 - 66, c ? c.focus : .5); else { ctx.fillStyle = "#ff6b35"; ctx.fillRect(sx + 16, sy + 16, sw - 32, sh2 - 66); }
    ctx.restore();
    ctx.fillStyle = "#22324f"; ctx.textAlign = "center"; ctx.font = '400 30px "Bebas Neue", Impact, sans-serif';
    ctx.fillText(((c && c.country) || s.place || "POSTCARD").toUpperCase().slice(0, 18), sx + sw / 2, sy + sh2 - 18);
    // postmark
    var pmx = sx - 40, pmy = sy + 150, d = new Date(), date = d.getDate() + " " + d.toLocaleString("en-GB", { month: "short" }).toUpperCase() + " " + d.getFullYear();
    ctx.save(); ctx.globalAlpha = .62; ctx.strokeStyle = "#2b3e66"; ctx.fillStyle = "#2b3e66"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(pmx, pmy, 92, 0, 7); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pmx, pmy, 76, 0, 7); ctx.stroke();
    ctx.font = '700 22px Inter, Arial, sans-serif'; ctx.textAlign = "center";
    var ring = (s.place || "POSTCARD").toUpperCase().slice(0, 16); ctx.fillText(ring, pmx, pmy - 18); ctx.font = '700 24px Inter, Arial, sans-serif'; ctx.fillText(date, pmx, pmy + 18);
    ctx.lineWidth = 4; for (var wv = 0; wv < 4; wv++) { ctx.beginPath(); for (var x = 0; x <= 260; x += 8) { var yy = pmy - 36 + wv * 24 + Math.sin(x / 22) * 7; if (x === 0) ctx.moveTo(pmx + 100 + x, yy); else ctx.lineTo(pmx + 100 + x, yy); } ctx.stroke(); }
    ctx.restore();
    // address
    var ax = W * 0.6, aw = W - ax - 70, ay = 470;
    ctx.strokeStyle = "rgba(122,106,85,.45)"; ctx.lineWidth = 2;
    for (var l = 0; l < 4; l++) { ctx.beginPath(); ctx.moveTo(ax, ay + l * 92); ctx.lineTo(ax + aw, ay + l * 92); ctx.stroke(); }
    ctx.fillStyle = "#7a6a55"; ctx.textAlign = "left"; ctx.font = '600 24px Inter, Arial, sans-serif'; ctx.fillText("To", ax, ay - 64);
    ctx.fillStyle = ink;
    var addr = [s.to || ""].concat(String(s.addr || "").split(/\n/)).filter(function (x, i) { return i === 0 || x.trim(); }).slice(0, 4);
    addr.forEach(function (a, i) { var f = hand.replace("{px}", i === 0 ? 46 : 38); ctx.font = f; var fx = fitText(ctx, a, hand, aw, i === 0 ? 46 : 38, 22); ctx.font = hand.replace("{px}", fx); ctx.fillText(a, ax + 6, ay - 14 + i * 92); });
    // credit + footer
    ctx.fillStyle = "#8b7d68"; ctx.textAlign = "left"; ctx.font = '400 17px Inter, Arial, sans-serif';
    var credit = c ? "Photo: " + c.author + " · " + c.lic + " · via Wikimedia Commons" : (s.own ? "Photo: sender's own" : "");
    ctx.fillText(credit.slice(0, 95), 60, H - 44);
    ctx.textAlign = "right"; ctx.fillText(s.pro ? "" : "Made free at etoolbox.co.uk", W - 60, H - 44);
  }

  /* ---------- Share links (#data after the address; never sent to the server) ---------- */
  function b64e(o) { var j = unescape(encodeURIComponent(JSON.stringify(o))); return btoa(j).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function shareUrl(s) { return location.origin + "/postcard/#" + b64e({ c: s.city, g: s.greet, p: s.place, y: s.style, t: s.theme, m: s.msg, to: s.to, f: s.from, i: s.ink }); }

  window.ETBPostcard = { CITIES: CITIES, BY: BY, imgUrl: imgUrl, pageUrl: pageUrl, LIC: LIC, drawFront: drawFront, drawBack: drawBack, loadImg: loadImg, fontsReady: fontsReady, b64d: b64d, shareUrl: shareUrl, W: W, H: H };

  /* ---------- Maker page ---------- */
  var form = document.querySelector("form[data-postcard]");
  if (form) maker(form);
  var viewer = document.getElementById("pc-view");
  if (viewer) view(viewer);

  function card(el) {
    // returns {front, back} canvases placed in a flip card
    var f = el.querySelector(".pc-front canvas"), b = el.querySelector(".pc-back canvas");
    [f, b].forEach(function (cv) { cv.width = W; cv.height = H; });
    el.addEventListener("click", function () { el.classList.toggle("flipped"); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.classList.toggle("flipped"); } });
    return { el: el, f: f, b: b };
  }

  function maker(form) {
    var grid = document.getElementById("pc-grid"), cardEl = card(document.getElementById("pc-card")), own = null, ownUrl = null, current = "london-bridge", token = 0;
    var credit = document.getElementById("pc-credit"), status = document.getElementById("pc-status");
    grid.innerHTML = CITIES.map(function (c) {
      return '<button type="button" class="pc-tile" data-id="' + c.id + '" title="' + c.landmark + ", " + c.place + '"><img src="' + imgUrl(c, 330) + '" alt="" loading="lazy" crossorigin="anonymous"><span>' + c.place + "<small>" + c.landmark + "</small></span></button>";
    }).join("") + '<label class="pc-tile pc-own" title="Use your own photo"><input type="file" accept="image/*" id="pc-file" class="sr-only"><span class="pc-plus">+</span><span>Your own photo<small>Never uploaded</small></span></label>';
    function state() {
      var e = form.elements;
      return { city: own ? "" : current, own: !!own, greet: e.greet.value, place: e.place.value, style: e.style.value, theme: e.theme.value, msg: e.msg.value, to: e.to.value, addr: e.addr.value, from: e.from.value, ink: e.ink.value, pro: !!(window.ETBPro && ETBPro.isPro()) };
    }
    function select(id) {
      own = null; current = id;
      Array.prototype.forEach.call(grid.querySelectorAll(".pc-tile"), function (t) { t.classList.toggle("on", t.getAttribute("data-id") === id); });
      var c = BY[id]; form.elements.place.value = c.place; render();
    }
    function render() {
      var s = state(), c = own ? null : BY[current], my = ++token;
      status.textContent = "Loading photo…";
      Promise.all([fontsReady(), own ? Promise.resolve(own) : loadImg(imgUrl(c, 1280))]).then(function (r) {
        if (my !== token) return;
        var img = r[1];
        drawFront(cardEl.f.getContext("2d"), img, s, c); drawBack(cardEl.b.getContext("2d"), img, s, c);
        status.textContent = "";
        credit.innerHTML = c ? 'Photo: <a href="' + pageUrl(c) + '" target="_blank" rel="noopener">' + c.landmark + "</a> by " + c.author + ', <a href="' + LIC[c.lic] + '" target="_blank" rel="noopener">' + c.lic + "</a>, via Wikimedia Commons." : "Your own photo: it stays on your device.";
        document.getElementById("pc-share-wrap").hidden = !!own;
        document.getElementById("pc-own-note").hidden = !own;
      }).catch(function () { if (my === token) status.textContent = "Couldn't load that photo. Check your connection or pick another."; });
    }
    grid.addEventListener("click", function (e) { var t = e.target.closest(".pc-tile[data-id]"); if (t) select(t.getAttribute("data-id")); });
    document.getElementById("pc-file").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      if (ownUrl) URL.revokeObjectURL(ownUrl); ownUrl = URL.createObjectURL(f);
      var i = new Image(); i.onload = function () { own = i; Array.prototype.forEach.call(grid.querySelectorAll(".pc-tile"), function (t) { t.classList.toggle("on", t.classList.contains("pc-own")); }); render(); }; i.src = ownUrl;
    });
    var tmr; form.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(render, 120); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.getElementById("pc-flip").addEventListener("click", function () { cardEl.el.classList.toggle("flipped"); });
    function dl(canvas, name) { canvas.toBlob(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }, "image/jpeg", 0.92); }
    var fname = function () { return "postcard-" + ((form.elements.place.value || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card"); };
    document.getElementById("pc-dl-front").addEventListener("click", function () { dl(cardEl.f, fname() + "-front.jpg"); });
    document.getElementById("pc-dl-back").addEventListener("click", function () { dl(cardEl.b, fname() + "-back.jpg"); });
    document.getElementById("pc-dl-both").addEventListener("click", function () {
      var c2 = document.createElement("canvas"), gap = 40; c2.width = W; c2.height = H * 2 + gap; var x = c2.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(cardEl.f, 0, 0); x.drawImage(cardEl.b, 0, H + gap); dl(c2, fname() + ".jpg");
    });
    var link = document.getElementById("pc-link");
    document.getElementById("pc-copy").addEventListener("click", function () {
      var u = shareUrl(state()); link.value = u; link.hidden = false; link.select();
      var b = this; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = "Link copied!"; setTimeout(function () { b.textContent = "Copy share link"; }, 1800); }, function () {});
    });
    document.getElementById("pc-wa").addEventListener("click", function () { window.open("https://wa.me/?text=" + encodeURIComponent("I sent you a postcard 💌 " + shareUrl(state())), "_blank", "noopener"); });
    document.getElementById("pc-mail").addEventListener("click", function () { location.href = "mailto:?subject=" + encodeURIComponent("A postcard for you 💌") + "&body=" + encodeURIComponent("Open your postcard: " + shareUrl(state())); });
    var nat = document.getElementById("pc-native");
    if (navigator.share) { nat.hidden = false; nat.addEventListener("click", function () { navigator.share({ title: "A postcard for you", text: "I sent you a postcard 💌", url: shareUrl(state()) }).catch(function () {}); }); }
    // start from a shared card if one was opened with "Make your own"
    select(current);
  }

  function view(box) {
    window.addEventListener("hashchange", function () { location.reload(); });
    var data = null;
    try { data = b64d(location.hash.slice(1)); } catch (e) {}
    var cardEl = card(document.getElementById("pc-card"));
    if (!data || !BY[data.c]) { box.classList.add("empty"); return; }
    var c = BY[data.c], s = { greet: data.g || "", place: data.p || c.place, style: data.y || "auto", theme: data.t || "sunset", msg: data.m || "", to: data.to || "", addr: "", from: data.f || "", ink: data.i || "hand" };
    document.getElementById("pc-from-line").textContent = s.from ? s.from + " sent you a postcard from " + (s.place || c.place) + " 💌" : "You've got a postcard from " + (s.place || c.place) + " 💌";
    Promise.all([fontsReady(), loadImg(imgUrl(c, 1280))]).then(function (r) {
      drawFront(cardEl.f.getContext("2d"), r[1], s, c); drawBack(cardEl.b.getContext("2d"), r[1], s, c);
      box.classList.add("ready");
      setTimeout(function () { cardEl.el.classList.add("flipped"); }, 1800);
      document.getElementById("pc-credit").innerHTML = 'Photo: <a href="' + pageUrl(c) + '" target="_blank" rel="noopener">' + c.landmark + "</a> by " + c.author + ', <a href="' + LIC[c.lic] + '" target="_blank" rel="noopener">' + c.lic + "</a>, via Wikimedia Commons.";
    });
  }
})();
