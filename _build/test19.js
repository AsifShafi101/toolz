// Photo object eraser: paint over an orange date stamp, erase, check it's gone and the fill matches the background.
// Needs /tmp/er-stamp.png and er-truth.png in the site root (made by the snippet in the commit that added this test).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${BASE}/photo-object-eraser/`);
  await p.setInputFiles('#er-input', '/tmp/er-stamp.png'); await p.waitForSelector('#er-stage:not([hidden])');
  const box = await (await p.$('#er-mask')).boundingBox(), sx = box.width / 1200, sy = box.height / 800;
  await p.fill('#brush', '40'); await p.dispatchEvent('#brush', 'input');
  // paint two strokes over the stamp (900–1106 × 708–743)
  for (const yy of [716, 735]) { await p.mouse.move(box.x + 892 * sx, box.y + yy * sy); await p.mouse.down(); for (let x = 892; x <= 1114; x += 10) await p.mouse.move(box.x + x * sx, box.y + yy * sy); await p.mouse.up(); }
  ok(!(await p.isDisabled('#er-go')), 'Erase enabled after painting');
  const t0 = Date.now(); await p.click('#er-go');
  await p.waitForFunction(() => document.getElementById('er-stage').getAttribute('data-erased') === '1', null, { timeout: 60000 });
  const secs = (Date.now() - t0) / 1000;
  const res = await p.evaluate(async () => {
    const v = document.getElementById('er-view'), d = v.getContext('2d').getImageData(900, 708, 206, 35).data; let orange = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 80 && d[i + 1] < 170 && d[i + 2] < 80) orange++;
    const t = new Image(); t.src = '/__truth.png'; return { orange, n: d.length / 4 };
  });
  ok(res.orange === 0, `date stamp gone (orange pixels left: ${res.orange}) in ${secs.toFixed(1)}s`);
  const truthDiff = await p.evaluate(async (truthUrl) => {
    const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = truthUrl; });
    const c = document.createElement('canvas'); c.width = 1200; c.height = 800; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const a = x.getImageData(900, 708, 206, 35).data, b = document.getElementById('er-view').getContext('2d').getImageData(900, 708, 206, 35).data; let s = 0;
    for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    return s / (a.length / 4) / 3;
  }, await p.evaluate(() => location.origin) + '/er-truth.png');
  ok(truthDiff < 25, `fill matches the real background (mean difference ${truthDiff.toFixed(1)} / 255)`);
  await p.click('#er-undo'); const back = await p.evaluate(() => { const d = document.getElementById('er-view').getContext('2d').getImageData(900, 708, 206, 35).data; let o = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 80 && d[i + 1] < 170 && d[i + 2] < 80) o++; return o; });
  ok(back > 100, 'undo brings the original back');
  await p.click('#er-undo').catch(() => {});
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); await m.goto(`${BASE}/photo-object-eraser/`);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no mobile overflow');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
