// Video to MP3: converts a 10-min WebM/Opus and a 60-min MP4/AAC (if the test browser has AAC) to valid MP3s.
const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8765', DIR = process.env.V2M || '/home/claude/v2m';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
async function run(p, file, opts = {}) {
  await p.goto(`${BASE}/video-to-mp3/`);
  await p.setInputFiles('#v2m-input', `${DIR}/${file}`);
  await p.waitForFunction(() => !document.getElementById('v2m-go').disabled || /warn/.test(document.getElementById('v2m-msg').innerHTML), null, { timeout: 60000 });
  const info = await p.textContent('#v2m-info');
  if (opts.bitrate) await p.selectOption('#bitrate', opts.bitrate);
  if (opts.mono) await p.selectOption('#channels', '1');
  if (opts.start) { await p.click('summary'); await p.fill('#start', opts.start); await p.fill('#end', opts.end); }
  const t0 = Date.now();
  const dl = p.waitForEvent('download', { timeout: 900000 });
  await p.click('#v2m-go');
  const d = await dl; const out = `/tmp/${file}.mp3`; await d.saveAs(out);
  return { info, secs: (Date.now() - t0) / 1000, out, name: d.suggestedFilename() };
}
const probe = (f) => JSON.parse(execSync(`ffprobe -v error -show_entries format=duration:stream=codec_name,channels,sample_rate,bit_rate -of json "${f}"`).toString());
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${BASE}/video-to-mp3/`);
  const aac = await p.evaluate(async () => (await AudioDecoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2 })).supported);
  console.log('test browser AAC decode:', aac);
  let r = await run(p, 'ten.webm');
  let pr = probe(r.out);
  ok(r.info.includes('10:00'), 'reads 10-minute duration: ' + r.info);
  ok(pr.streams[0].codec_name === 'mp3' && Math.abs(pr.format.duration - 600) < 2, `WebM → MP3 ${(+pr.format.duration).toFixed(1)}s in ${r.secs.toFixed(1)}s`);
  ok(r.name === 'ten.mp3', 'filename ten.mp3');
  r = await run(p, 'ten.webm', { mono: true, bitrate: '96', start: '1:00', end: '2:30' });
  pr = probe(r.out);
  ok(pr.streams[0].channels === 1 && Math.abs(pr.format.duration - 90) < 1.5, `trim + mono: ${(+pr.format.duration).toFixed(1)}s, ${pr.streams[0].channels} ch`);
  if (aac) {
    r = await run(p, 'long60.mp4');
    pr = probe(r.out);
    ok(r.info.includes('1:00:00'), '60-minute MP4 read: ' + r.info);
    ok(Math.abs(pr.format.duration - 3600) < 3, `60-min MP4 → MP3 ${(+pr.format.duration).toFixed(0)}s, ${(fs.statSync(r.out).size / 1048576).toFixed(1)} MB in ${r.secs.toFixed(0)}s`);
  }
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); await m.goto(`${BASE}/video-to-mp3/`);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll on mobile');
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
