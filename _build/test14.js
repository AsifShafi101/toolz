// Format landing pages: each audio page converts its format; image pages output the right type; presets are selected.
const { chromium } = require('playwright'); const { execSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8765', D = process.env.V2M || '/home/claude/v2m';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const [page, file] of [['mov-to-mp3', 's.mov'], ['mkv-to-mp3', 's.mkv'], ['m4a-to-mp3', 's.m4a'], ['wav-to-mp3', 's.wav'], ['ogg-to-mp3', 's.ogg'], ['whatsapp-audio-to-mp3', 's.opus'], ['extract-audio-from-video', 's.mov']]) {
    await p.goto(`${BASE}/${page}/`);
    await p.setInputFiles('#v2m-input', `${D}/${file}`);
    await p.waitForFunction(() => !document.getElementById('v2m-go').disabled || /warn/.test(document.getElementById('v2m-msg').innerHTML), null, { timeout: 30000 });
    if (await p.isDisabled('#v2m-go')) { ok(false, `${page}: ${await p.textContent('#v2m-msg')}`); continue; }
    const dl = p.waitForEvent('download', { timeout: 60000 }); await p.click('#v2m-go'); const d = await dl; await d.saveAs('/tmp/t14.mp3');
    const dur = +execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/t14.mp3').toString();
    ok(Math.abs(dur - 20) < 1, `${page}: ${file} → MP3 ${dur.toFixed(1)}s`);
  }
  const waitDone = (n) => p.waitForFunction((n) => document.querySelectorAll('#img-results [data-out],#img-results [data-error]').length >= n, n, { timeout: 30000 });
  for (const [page, file, mime] of [['png-to-webp', 's.png', 'image/webp'], ['jpg-to-webp', 's.png', 'image/webp'], ['webp-to-png', 's.png', 'image/png'], ['avif-to-jpg', 's.avif', 'image/jpeg'], ['avif-to-png', 's.avif', 'image/png'], ['bmp-to-jpg', 's.bmp', 'image/jpeg']]) {
    await p.goto(`${BASE}/${page}/`);
    await p.setInputFiles('#img-input', `${D}/${file}`); await p.waitForSelector('#img-results [data-out], #img-results [data-error]', { timeout: 30000 });
    await p.waitForTimeout(1500); await p.waitForSelector('#img-results [data-out]', { timeout: 30000 });
    const outs = await p.$$eval('#img-results [data-out]', els => els.map(e => JSON.parse(e.getAttribute('data-out'))));
    if (!outs.length) console.log(await p.innerHTML('#img-results'));
    ok(outs.length === 1 && outs[0].type === mime, `${page}: ${file} → ${outs[0] && outs[0].type}`);
  }
  await p.goto(`${BASE}/heic-to-png/`); ok(await p.$eval('#format', e => e.value) === 'image/png', 'heic-to-png preselects PNG');
  await p.goto(`${BASE}/pdf-to-png/`); ok(await p.$eval('#imgformat', e => e.value) === 'png', 'pdf-to-png preselects PNG');
  for (const pg of ['png-to-pdf', 'image-to-pdf', 'webp-to-pdf', 'compress-pdf-for-email', 'jfif-to-jpg', 'mp4-to-mp3', 'webm-to-mp3']) {
    const r = await p.goto(`${BASE}/${pg}/`); ok(r.status() === 200 && (await p.$$('h1')).length === 1, `${pg} loads`);
  }
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  for (const pg of ['mp4-to-mp3', 'png-to-webp', 'pdf-to-png']) { await m.goto(`${BASE}/${pg}/`); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${pg} no mobile overflow`); }
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
