/* etoolbox – audio converter (WAV, MP3, M4A…) and audio cutter. Uses Mediabunny (MPL-2.0) with the LAME MP3 encoder (LGPL)
   for MP3 output, and the browser's own decoder for the cutter. Nothing is uploaded. */
const V = "/assets/vendor/mediabunny/";
const $ = (id) => document.getElementById(id);
const fmtTime = (s, ms) => { s = Math.max(0, s); const m = Math.floor(s / 60), x = s - m * 60; return m + ":" + (ms ? x.toFixed(1).padStart(4, "0") : String(Math.floor(x)).padStart(2, "0")); };
const fmtSize = (n) => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1) + " MB";
const parseTime = (t) => { t = String(t || "").trim(); if (!t) return null; const p = t.split(":").map(Number); if (p.some(isNaN)) return NaN; return p.reduce((a, b) => a * 60 + b, 0); };
const base = (n) => (n || "audio").replace(/\.[^.]+$/, "") || "audio";
const download = (blob, name) => { const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 10000); return u; };

let MB = null, encReady = null;
async function lib() {
  if (!MB) MB = await import(V + "mediabunny.min.mjs");
  if (!encReady) encReady = (async () => { if (!(await MB.canEncodeAudio("mp3"))) { const enc = await import(V + "mediabunny-mp3-encoder.min.mjs"); enc.registerMp3Encoder(); } })();
  await encReady; return MB;
}

// 16-bit PCM WAV from an AudioBuffer (or channel arrays)
export function wavBytes(channels, sampleRate) {
  const nCh = channels.length, len = channels[0].length, data = len * nCh * 2, buf = new ArrayBuffer(44 + data), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + data, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nCh, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, data, true);
  let o = 44; for (let i = 0; i < len; i++) for (let c = 0; c < nCh; c++) { const s = Math.max(-1, Math.min(1, channels[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Uint8Array(buf);
}
// Cut + fade (pure, tested): returns new channel arrays
export function cutFade(channels, sampleRate, start, end, fadeIn, fadeOut) {
  const a = Math.max(0, Math.round(start * sampleRate)), b = Math.min(channels[0].length, Math.round(end * sampleRate)), n = Math.max(0, b - a);
  const fi = Math.min(n, Math.round(fadeIn * sampleRate)), fo = Math.min(n, Math.round(fadeOut * sampleRate));
  return channels.map((ch) => { const out = ch.slice(a, b); for (let i = 0; i < fi; i++) out[i] *= i / fi; for (let i = 0; i < fo; i++) out[n - 1 - i] *= i / fo; return out; });
}

async function encodeMp3(channels, sampleRate, kbps) {
  const M = await lib();
  const target = new M.BufferTarget(), output = new M.Output({ format: new M.Mp3OutputFormat(), target });
  const src = new M.AudioBufferSource({ codec: "mp3", bitrate: kbps * 1000 });
  output.addAudioTrack(src); await output.start();
  const ctx = new OfflineAudioContext(channels.length, Math.max(1, channels[0].length), sampleRate), ab = ctx.createBuffer(channels.length, Math.max(1, channels[0].length), sampleRate);
  channels.forEach((c, i) => ab.copyToChannel(c, i));
  await src.add(ab); src.close(); await output.finalize();
  return new Uint8Array(target.buffer);
}

// ---------------- Converter (WAV↔MP3, M4A→MP3 …) ----------------
function initConvert(form) {
  const to = form.getAttribute("data-audioconv"), input = $("ac-input"), drop = $("drop"), msg = $("ac-msg"), info = $("ac-info"), go = $("ac-go"), bar = $("ac-bar"), barIn = bar.querySelector("i"), out = $("ac-out");
  let file = null, duration = 0, conv = null, url = null;
  async function pick(f) {
    if (!f) return; file = null; go.disabled = true; out.hidden = true; info.textContent = ""; msg.textContent = "Reading " + f.name + "…";
    try {
      const M = await lib(), inp = new M.Input({ source: new M.BlobSource(f), formats: M.ALL_FORMATS }), tr = await inp.getPrimaryAudioTrack();
      if (!tr) { msg.innerHTML = "<span class='warn'>This file has no audio.</span>"; return; }
      duration = await inp.computeDuration(); file = f;
      info.textContent = f.name + " · " + fmtSize(f.size) + " · " + fmtTime(duration) + " long";
      msg.textContent = "Ready. Press Convert."; go.disabled = false;
    } catch (e) { console.error(e); msg.innerHTML = "<span class='warn'>Couldn't read this file. It may use a format your browser can't decode; try the latest Chrome or Edge.</span>"; }
  }
  async function convert() {
    if (!file || conv) return;
    const M = await lib(); go.disabled = true; bar.hidden = false; barIn.style.width = "0%"; msg.textContent = "Converting… keep this tab open."; const t0 = performance.now();
    try {
      const input = new M.Input({ source: new M.BlobSource(file), formats: M.ALL_FORMATS }), target = new M.BufferTarget();
      const mp3 = to === "mp3", output = new M.Output({ format: mp3 ? new M.Mp3OutputFormat() : new M.WavOutputFormat(), target });
      const audio = mp3 ? { codec: "mp3", bitrate: +form.elements.bitrate.value * 1000, forceTranscode: true } : { codec: "pcm-s16", forceTranscode: true };
      if (form.elements.channels.value === "1") audio.numberOfChannels = 1;
      conv = await M.Conversion.init({ input, output, video: { discard: true }, audio });
      if (!conv.isValid) throw new Error("invalid");
      conv.onProgress = (p) => { barIn.style.width = (p * 100).toFixed(1) + "%"; msg.textContent = "Converting… " + Math.floor(p * 100) + "%"; };
      await conv.execute();
      const blob = new Blob([target.buffer], { type: mp3 ? "audio/mpeg" : "audio/wav" }), name = base(file.name) + "." + to;
      if (url) URL.revokeObjectURL(url);
      url = download(blob, name); $("ac-audio").src = url; const a = $("ac-dl"); a.href = url; a.download = name;
      $("ac-res").textContent = name + " · " + fmtSize(blob.size) + " · done in " + ((performance.now() - t0) / 1000).toFixed(1) + " s"; out.hidden = false; out.setAttribute("data-size", blob.size);
      msg.textContent = "Done! Your " + to.toUpperCase() + " has downloaded."; barIn.style.width = "100%";
    } catch (e) { console.error(e); msg.innerHTML = "<span class='warn'>Sorry, this file couldn't be converted. Try the latest Chrome or Edge.</span>"; bar.hidden = true; }
    finally { conv = null; go.disabled = !file; }
  }
  input.addEventListener("change", () => { pick(input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => pick(e.dataTransfer.files[0]));
  go.addEventListener("click", convert); form.addEventListener("submit", (e) => e.preventDefault());
  window.addEventListener("beforeunload", (e) => { if (conv) { e.preventDefault(); e.returnValue = ""; } });
  lib().catch(() => {});
}

// ---------------- Cutter ----------------
function initCutter(form) {
  const E = form.elements, input = $("cu-input"), drop = $("drop"), msg = $("cu-msg"), wave = $("cu-wave");
  let buf = null, name = "audio", sel = [0, 0], peaks = null, ctx = null, player = null, playStart = 0, raf = 0, drag = null;
  const dur = () => buf ? buf.duration : 0;
  function computePeaks() { const W = 1200, ch = buf.getChannelData(0), step = Math.max(1, Math.floor(ch.length / W)); peaks = new Float32Array(W); for (let i = 0; i < W; i++) { let m = 0; const s = i * step; for (let j = 0; j < step && s + j < ch.length; j += 4) m = Math.max(m, Math.abs(ch[s + j])); peaks[i] = m; } }
  function draw(head) {
    const w = wave.clientWidth || 800, h = 140; if (wave.width !== w * 2) { wave.width = w * 2; wave.height = h * 2; } const x = wave.getContext("2d"), W = wave.width, H = wave.height, d = dur();
    x.clearRect(0, 0, W, H); const a = sel[0] / d * W, b = sel[1] / d * W;
    x.fillStyle = "rgba(255,107,53,.12)"; x.fillRect(a, 0, b - a, H);
    for (let i = 0; i < W; i += 2) { const p = peaks[Math.floor(i / W * peaks.length)] || 0, ph = Math.max(2, p * H * 0.9); x.fillStyle = i >= a && i <= b ? "#ff6b35" : "rgba(100,116,139,.45)"; x.fillRect(i, (H - ph) / 2, 1.6, ph); }
    x.fillStyle = "#c2410c"; [a, b].forEach((p) => { x.fillRect(p - 2, 0, 4, H); x.beginPath(); x.arc(p, H / 2, 12, 0, 7); x.fill(); });
    if (head != null) { x.fillStyle = "#0f172a"; x.fillRect(head / d * W - 1, 0, 2, H); }
    $("cu-len").textContent = "Selection: " + fmtTime(sel[1] - sel[0], true) + " of " + fmtTime(d, true);
  }
  function setSel(a, b, fromInput) { const d = dur(); a = Math.max(0, Math.min(a, d)); b = Math.max(0, Math.min(b, d)); if (b - a < 0.05) return; sel = [a, b]; if (!fromInput) { E.start.value = fmtTime(a, true); E.end.value = fmtTime(b, true); } form.setAttribute("data-sel", a.toFixed(2) + "-" + b.toFixed(2)); draw(); }
  async function pick(f) {
    if (!f) return; stop(); msg.textContent = "Reading " + f.name + "…";
    try { const ab = await f.arrayBuffer(); ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); buf = await ctx.decodeAudioData(ab); name = base(f.name);
      $("cu-work").hidden = false; computePeaks(); setSel(0, buf.duration); msg.textContent = f.name + " · " + fmtTime(buf.duration) + " · " + buf.numberOfChannels + " channel" + (buf.numberOfChannels > 1 ? "s" : "") + ". Drag the orange handles or type times."; form.setAttribute("data-ready", "1"); }
    catch (e) { console.error(e); msg.innerHTML = "<span class='warn'>Couldn't read this audio. Try MP3, WAV, M4A or OGG in the latest Chrome or Edge.</span>"; }
  }
  function stop() { if (player) { try { player.stop(); } catch (e) { /* already stopped */ } player = null; } cancelAnimationFrame(raf); $("cu-play").textContent = "▶ Play selection"; if (buf) draw(); }
  function play() {
    if (player) { stop(); return; } if (!buf) return; ctx.resume();
    const s = cutFade(Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i)), buf.sampleRate, sel[0], sel[1], +E.fadein.value || 0, +E.fadeout.value || 0);
    const b = ctx.createBuffer(s.length, s[0].length, buf.sampleRate); s.forEach((c, i) => b.copyToChannel(c, i));
    player = ctx.createBufferSource(); player.buffer = b; player.connect(ctx.destination); player.onended = stop; player.start(); playStart = ctx.currentTime; $("cu-play").textContent = "■ Stop";
    const tick = () => { if (!player) return; draw(sel[0] + ctx.currentTime - playStart); raf = requestAnimationFrame(tick); }; tick();
  }
  const tAt = (e) => { const r = wave.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur(); };
  wave.addEventListener("pointerdown", (e) => { if (!buf) return; const t = tAt(e), px = dur() / (wave.clientWidth || 800) * 16; drag = Math.abs(t - sel[0]) <= px ? 0 : Math.abs(t - sel[1]) <= px ? 1 : (Math.abs(t - sel[0]) < Math.abs(t - sel[1]) ? 0 : 1); wave.setPointerCapture(e.pointerId); move(e); });
  const move = (e) => { if (drag == null) return; const t = tAt(e); if (drag === 0) setSel(Math.min(t, sel[1] - 0.05), sel[1]); else setSel(sel[0], Math.max(t, sel[0] + 0.05)); };
  wave.addEventListener("pointermove", move); ["pointerup", "pointercancel"].forEach((ev) => wave.addEventListener(ev, () => { drag = null; }));
  form.addEventListener("change", (e) => { if (e.target.name === "start" || e.target.name === "end") { const a = parseTime(E.start.value), b = parseTime(E.end.value); if (isNaN(a) || isNaN(b) || a == null || b == null || b <= a) { msg.innerHTML = "<span class='warn'>Use times like 0:30 or 1:05.5, with the end after the start.</span>"; return; } setSel(a, b, true); } });
  $("cu-play").addEventListener("click", play);
  $("cu-dl").addEventListener("click", async () => {
    if (!buf) return; stop(); msg.textContent = "Saving…";
    try {
      const s = cutFade(Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i)), buf.sampleRate, sel[0], sel[1], +E.fadein.value || 0, +E.fadeout.value || 0);
      const ch = E.channels.value === "1" && s.length > 1 ? [s[0].map((v, i) => (v + s[1][i]) / 2)] : s;
      const mp3 = E.fmt.value === "mp3", bytes = mp3 ? await encodeMp3(ch, buf.sampleRate, +E.bitrate.value || 192) : wavBytes(ch, buf.sampleRate);
      const blob = new Blob([bytes], { type: mp3 ? "audio/mpeg" : "audio/wav" }); download(blob, name + "-cut." + (mp3 ? "mp3" : "wav"));
      msg.textContent = "Done! " + fmtTime(sel[1] - sel[0], true) + " saved as " + (mp3 ? "MP3" : "WAV") + " (" + fmtSize(blob.size) + ")."; form.setAttribute("data-saved", String(blob.size));
    } catch (e) { console.error(e); msg.innerHTML = "<span class='warn'>Sorry, saving failed. Try WAV, or the latest Chrome or Edge.</span>"; }
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  E.fmt.addEventListener("change", () => { $("cu-br").hidden = E.fmt.value !== "mp3"; });
  input.addEventListener("change", () => { pick(input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => pick(e.dataTransfer.files[0]));
  window.addEventListener("resize", () => { if (buf) draw(); });
  window.ETBCutter = { setSel: (a, b) => setSel(a, b) };
}

window.ETBAudio = { wavBytes, cutFade, encodeMp3 };
const fc = document.querySelector("form[data-audioconv]"); if (fc) initConvert(fc);
const fu = document.querySelector("form[data-cutter]"); if (fu) initCutter(fu);
