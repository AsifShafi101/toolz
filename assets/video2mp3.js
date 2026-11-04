/* etoolbox – Video to MP3. Streams the file through Mediabunny (MPL-2.0) and the LAME MP3 encoder (LGPL),
   so long videos (60+ minutes, several GB) are converted in the browser without loading the whole file into memory. */
const V = "/assets/vendor/mediabunny/";
const $ = (id) => document.getElementById(id);
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const fmtSize = (n) => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : n < 1073741824 ? (n / 1048576).toFixed(1) + " MB" : (n / 1073741824).toFixed(2) + " GB";
const parseTime = (t) => { t = (t || "").trim(); if (!t) return null; const p = t.split(":").map(Number); if (p.some(isNaN)) return NaN; return p.reduce((a, b) => a * 60 + b, 0); };
const base = (n) => n.replace(/\.[^.]+$/, "") || "audio";

let MB = null, encReady = null;
async function lib() {
  if (!MB) MB = await import(V + "mediabunny.min.mjs");
  if (!encReady) encReady = (async () => {
    if (!(await MB.canEncodeAudio("mp3"))) { const enc = await import(V + "mediabunny-mp3-encoder.min.mjs"); enc.registerMp3Encoder(); }
  })();
  await encReady;
  return MB;
}

function init(form) {
  const input = $("v2m-input"), drop = $("v2m-drop"), msg = $("v2m-msg"), info = $("v2m-info"), go = $("v2m-go"), cancel = $("v2m-cancel");
  const bar = $("v2m-bar"), barIn = bar.querySelector("i"), out = $("v2m-out");
  let file = null, duration = 0, conv = null, url = null;

  if (typeof AudioDecoder === "undefined") {
    msg.innerHTML = "<span class='warn'>Your browser can't decode audio here yet. Please use the latest Chrome, Edge or Firefox (or Safari 26+).</span>";
  }

  async function pick(f) {
    if (!f) return;
    file = null; out.hidden = true; go.disabled = true; info.textContent = ""; bar.hidden = true;
    msg.textContent = "Reading " + f.name + "…";
    try {
      const M = await lib();
      const inp = new M.Input({ source: new M.BlobSource(f), formats: M.ALL_FORMATS });
      const track = await inp.getPrimaryAudioTrack();
      if (!track) { msg.innerHTML = "<span class='warn'>This file has no audio track.</span>"; return; }
      duration = await inp.computeDuration();
      file = f;
      info.textContent = f.name + " · " + fmtSize(f.size) + " · " + fmtTime(duration) + " long";
      msg.textContent = "Ready. Choose a quality and press Convert to MP3.";
      go.disabled = false; estimate();
    } catch (e) {
      console.error(e);
      msg.innerHTML = "<span class='warn'>Couldn't read this file. Try an MP4, MOV, MKV, WebM, M4A, WAV or OGG file.</span>";
    }
  }
  function settings() {
    const kbps = +form.elements.bitrate.value, mono = form.elements.channels.value === "1";
    const start = parseTime(form.elements.start.value), end = parseTime(form.elements.end.value);
    return { kbps, mono, start, end };
  }
  function estimate() {
    if (!file) return;
    const s = settings(); let len = duration;
    if (s.start > 0 || s.end > 0) len = Math.max(0, Math.min(duration, s.end > 0 ? s.end : duration) - (s.start > 0 ? s.start : 0));
    $("v2m-est").textContent = "MP3 will be about " + fmtSize(len * s.kbps * 125) + ".";
  }

  async function convert() {
    if (!file || conv) return;
    const s = settings();
    if (isNaN(s.start) || isNaN(s.end)) { msg.innerHTML = "<span class='warn'>Use times like 1:30 or 1:02:45.</span>"; return; }
    if (s.end != null && s.start != null && s.end <= s.start) { msg.innerHTML = "<span class='warn'>The end time must be after the start time.</span>"; return; }
    const M = await lib();
    go.disabled = true; cancel.hidden = false; out.hidden = true; bar.hidden = false; barIn.style.width = "0%";
    msg.textContent = "Converting… keep this tab open.";
    const t0 = performance.now();
    try {
      const input = new M.Input({ source: new M.BlobSource(file), formats: M.ALL_FORMATS });
      const target = new M.BufferTarget();
      const output = new M.Output({ format: new M.Mp3OutputFormat(), target });
      const opts = { input, output, video: { discard: true }, audio: { codec: "mp3", bitrate: s.kbps * 1000, forceTranscode: true } };
      if (s.mono) opts.audio.numberOfChannels = 1;
      if (s.start > 0 || s.end > 0) opts.trim = {}; if (s.start > 0) opts.trim.start = s.start; if (s.end > 0) opts.trim.end = Math.min(s.end, duration);
      conv = await M.Conversion.init(opts);
      if (!conv.isValid) throw new Error("invalid");
      conv.onProgress = (p) => {
        barIn.style.width = (p * 100).toFixed(1) + "%";
        const el = (performance.now() - t0) / 1000, left = p > 0.02 ? el / p - el : null;
        msg.textContent = "Converting… " + Math.floor(p * 100) + "%" + (left != null ? " · about " + fmtTime(left) + " left" : "") + " · keep this tab open.";
      };
      await conv.execute();
      const blob = new Blob([target.buffer], { type: "audio/mpeg" });
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      const name = base(file.name) + ".mp3";
      $("v2m-audio").src = url;
      const a = $("v2m-dl"); a.href = url; a.download = name;
      $("v2m-res").textContent = name + " · " + fmtSize(blob.size) + " · converted in " + fmtTime((performance.now() - t0) / 1000);
      out.hidden = false; out.setAttribute("data-size", blob.size);
      barIn.style.width = "100%";
      msg.textContent = "Done! Your MP3 is ready.";
      a.click();
    } catch (e) {
      if (conv && conv.state === "canceled") msg.textContent = "Cancelled.";
      else { msg.innerHTML = "<span class='warn'>Sorry, this file couldn't be converted. It may use an audio format your browser can't decode. Try the latest Chrome or Edge.</span>"; console.error(e); }
      bar.hidden = true;
    } finally { conv = null; go.disabled = !file; cancel.hidden = true; }
  }

  input.addEventListener("change", () => { pick(input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => pick(e.dataTransfer.files[0]));
  go.addEventListener("click", convert);
  cancel.addEventListener("click", () => { if (conv) conv.cancel(); });
  form.addEventListener("input", estimate);
  form.addEventListener("submit", (e) => e.preventDefault());
  window.addEventListener("beforeunload", (e) => { if (conv) { e.preventDefault(); e.returnValue = ""; } });
  lib().catch(() => {});
}
const f = document.querySelector("form[data-v2m]"); if (f) init(f);
