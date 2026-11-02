/* etoolbox media tools — YouTube thumbnails, text to speech, speech to text. */
(function () {
  "use strict";

  /* ---------- YouTube thumbnails ---------- */
  function ytId(s) {
    s = String(s || "").trim();
    var m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(s);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
  }
  var SIZES = [["maxresdefault", "Full HD", "1280×720"], ["sddefault", "Standard", "640×480"], ["hqdefault", "High", "480×360"], ["mqdefault", "Medium", "320×180"]];

  function initYt(form) {
    var out = document.getElementById("yt-out"), msg = document.getElementById("yt-msg");
    function show() {
      var id = ytId(form.elements.url.value);
      msg.textContent = ""; out.innerHTML = "";
      if (!form.elements.url.value.trim()) return;
      if (!id) { msg.textContent = "That doesn't look like a YouTube link. Paste a link like youtube.com/watch?v=… or youtu.be/…"; return; }
      out.setAttribute("data-id", id);
      out.innerHTML = SIZES.map(function (s) {
        var u = "https://i.ytimg.com/vi/" + id + "/" + s[0] + ".jpg";
        return '<div class="yt-card" data-size="' + s[0] + '"><img src="' + u + '" alt="' + s[1] + ' thumbnail" loading="lazy"><div class="yt-meta"><strong>' + s[1] + '</strong><span class="muted">' + s[2] +
          '</span><button type="button" class="btn small" data-dl="' + u + '" data-name="youtube-' + id + "-" + s[0] + '.jpg">Download</button><a class="btn secondary small" href="' + u + '" target="_blank" rel="noopener">Open</a></div></div>';
      }).join("");
      Array.prototype.forEach.call(out.querySelectorAll("img"), function (img) {
        img.addEventListener("load", function () { if (img.naturalWidth <= 120) img.closest(".yt-card").remove(); }); // YouTube returns a 120×90 placeholder when a size doesn't exist
        img.addEventListener("error", function () { img.closest(".yt-card").remove(); });
      });
    }
    out.addEventListener("click", function (e) {
      var b = e.target.closest("[data-dl]"); if (!b) return;
      var u = b.getAttribute("data-dl"), name = b.getAttribute("data-name");
      fetch(u).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (blob) {
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      }).catch(function () { window.open(u, "_blank", "noopener"); msg.textContent = "Opened the image in a new tab. Right-click (or long-press) it and choose Save image."; });
    });
    form.addEventListener("input", show); form.addEventListener("submit", function (e) { e.preventDefault(); show(); });
    show();
  }

  /* ---------- Text to speech ---------- */
  function initTts(form) {
    var synth = window.speechSynthesis, sel = form.elements.voice, msg = document.getElementById("tts-msg");
    if (!synth) { msg.textContent = "Sorry, your browser doesn't support text to speech. Try Chrome, Edge or Safari."; form.querySelector("#tts-play").disabled = true; return; }
    function voices() {
      var vs = synth.getVoices().slice().sort(function (a, b) { var s = function (v) { return (/en-GB/i.test(v.lang) ? 0 : /^en/i.test(v.lang) ? 1 : 2); }; return s(a) - s(b) || a.name.localeCompare(b.name); });
      if (!vs.length) return;
      var cur = sel.value;
      sel.innerHTML = vs.map(function (v) { return '<option value="' + v.name.replace(/"/g, "&quot;") + '">' + v.name + " (" + v.lang + ")</option>"; }).join("");
      if (cur) sel.value = cur;
    }
    voices(); if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = voices;
    function upd() { document.getElementById("rate-val").textContent = (+form.elements.rate.value).toFixed(1) + "×"; document.getElementById("pitch-val").textContent = (+form.elements.pitch.value).toFixed(1); }
    form.addEventListener("input", upd); upd();
    document.getElementById("tts-play").addEventListener("click", function () {
      var text = form.elements.text.value.trim(); if (!text) { msg.textContent = "Type or paste some text first."; return; }
      if (synth.paused) { synth.resume(); return; }
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text), v = synth.getVoices().filter(function (x) { return x.name === sel.value; })[0];
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = +form.elements.rate.value; u.pitch = +form.elements.pitch.value;
      u.onstart = function () { msg.textContent = "Speaking…"; }; u.onend = function () { msg.textContent = ""; };
      u.onerror = function (e) { if (e.error !== "interrupted" && e.error !== "canceled") msg.textContent = "Couldn't play: " + e.error; };
      synth.speak(u);
    });
    document.getElementById("tts-pause").addEventListener("click", function () { if (synth.speaking) synth.pause(); });
    document.getElementById("tts-stop").addEventListener("click", function () { synth.cancel(); msg.textContent = ""; });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  /* ---------- Speech to text ---------- */
  function initStt(form) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, out = form.elements.transcript, msg = document.getElementById("stt-msg"), btn = document.getElementById("stt-start"), rec = null, on = false, base = "";
    if (!SR) { msg.textContent = "Your browser doesn't support speech recognition. Please use Chrome, Edge or Safari."; btn.disabled = true; return; }
    function stop() { on = false; btn.textContent = "🎤 Start dictating"; btn.classList.remove("rec"); if (rec) try { rec.stop(); } catch (e) {} }
    btn.addEventListener("click", function () {
      if (on) { stop(); return; }
      rec = new SR(); rec.lang = form.elements.lang.value; rec.continuous = true; rec.interimResults = true;
      base = out.value ? out.value.replace(/\s*$/, " ") : "";
      rec.onresult = function (e) {
        var fin = "", interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else interim += t; }
        if (fin) { base += fin.trim() + (form.elements.punct.checked ? ". " : " "); }
        out.value = base + interim;
      };
      rec.onerror = function (e) { msg.textContent = e.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser's address bar and try again." : e.error === "no-speech" ? "We didn't hear anything. Try again." : "Error: " + e.error; stop(); };
      rec.onend = function () { if (on) try { rec.start(); } catch (e) { stop(); } };
      try { rec.start(); on = true; btn.textContent = "■ Stop"; btn.classList.add("rec"); msg.textContent = "Listening… speak now."; } catch (e) { msg.textContent = "Couldn't start the microphone."; }
    });
    document.getElementById("stt-copy").addEventListener("click", function (e) { navigator.clipboard.writeText(out.value).then(function () { e.target.textContent = "Copied ✓"; setTimeout(function () { e.target.textContent = "Copy"; }, 1200); }); });
    document.getElementById("stt-dl").addEventListener("click", function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out.value], { type: "text/plain" })); a.download = "transcript.txt"; a.click(); });
    document.getElementById("stt-clear").addEventListener("click", function () { out.value = ""; base = ""; });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  window.ETBMedia = { ytId: ytId };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("form[data-yt]"))) initYt(f);
    if ((f = document.querySelector("form[data-tts]"))) initTts(f);
    if ((f = document.querySelector("form[data-stt]"))) initStt(f);
  });
})();
