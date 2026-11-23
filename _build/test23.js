// Batch: passport photos, cropper, PDF page organiser, PDF to text + OCR, pregnancy & ovulation.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
const IMG = '/home/claude/toolz/assets/og.png';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
async function imgSize(p, file) { return p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, fs.readFileSync(file).toString('base64')); }
async function pdfInfo(p, file) { return p.evaluate(async (bytes) => { const d = await PDFLib.PDFDocument.load(new Uint8Array(bytes)); return d.getPages().map(pg => Math.round(pg.getWidth()) + ':' + pg.getRotation().angle); }, [...fs.readFileSync(file)]); }
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  const dl = async (p, sel, to) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); await d.saveAs(to); return d.suggestedFilename(); };

  // --- passport
  let p = await page('/passport-photo-maker/');
  ok(await p.evaluate(() => ETBPassport.sheetLayout(ETBPassport.P.uk).n) === 8, 'UK 35x45 sheet holds 8 photos');
  await p.setInputFiles('#pp-input', IMG); await p.waitForSelector('#pp-actions:not([hidden])');
  let f = await dl(p, '#pp-digital', '/tmp/pp1.jpg'); let s = await p.evaluate(async () => 0);
  const jpgSize = async (file) => p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/jpeg;base64,' + b64; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, fs.readFileSync(file).toString('base64'));
  s = await jpgSize('/tmp/pp1.jpg'); ok(s[0] === 910 && s[1] === 1170 && /uk/.test(f), 'UK digital photo is 910x1170 ' + s + ' ' + f);
  await dl(p, '#pp-sheet', '/tmp/pp2.jpg'); s = await jpgSize('/tmp/pp2.jpg'); ok(s[0] === 1800 && s[1] === 1200, '6x4 sheet at 300 dpi ' + s);
  ok(/8 photos/.test(await p.textContent('#pp-msg')), 'sheet message counts photos');
  await p.selectOption('#pp-country', 'us'); await dl(p, '#pp-digital', '/tmp/pp3.jpg'); s = await jpgSize('/tmp/pp3.jpg'); ok(s[0] === 1326 && s[1] === 1326, 'US 2x2 photo is square ' + s);
  await p.locator('#pp-view').scrollIntoViewIfNeeded(); const before = await p.evaluate(() => ETBPassportState()); const box = await p.locator('#pp-view').boundingBox();
  await p.mouse.move(box.x + 100, box.y + 100); await p.mouse.down(); await p.mouse.move(box.x + 140, box.y + 120, { steps: 3 }); await p.mouse.up();
  const after = await p.evaluate(() => ETBPassportState()); ok(after.cx > before.cx && after.cy > before.cy, 'dragging moves the photo');
  await p.close();

  // --- cropper
  p = await page('/image-cropper/'); await p.setInputFiles('#cr-input', IMG); await p.waitForSelector('#cr-work:not([hidden])');
  await p.selectOption('#cr-ratio', '1:1'); let r = await p.evaluate(() => ETBCropState()); ok(Math.abs(r.w - r.h) < 1, 'square ratio gives a square box');
  f = await dl(p, '#cr-dl', '/tmp/cr1.png'); s = await imgSize(p, '/tmp/cr1.png'); ok(s[0] === s[1] && s[0] > 100 && /cropped\.png$/.test(f), 'square crop downloads ' + s + ' ' + f);
  await p.fill('#cr-width', '200'); await p.dispatchEvent('#cr-width', 'change'); await dl(p, '#cr-dl', '/tmp/cr2.png'); s = await imgSize(p, '/tmp/cr2.png'); ok(s[0] === 200 && s[1] === 200, 'resize width works ' + s);
  await p.fill('input[name=cx]', '10'); await p.fill('input[name=cy]', '20'); await p.fill('input[name=cw]', '300'); await p.fill('input[name=ch]', '300'); await p.dispatchEvent('input[name=ch]', 'change');
  r = await p.evaluate(() => ETBCropState()); ok(r.x === 10 && r.y === 20 && r.w === 300, 'typed crop numbers apply ' + JSON.stringify(r));
  await p.click('#cr-rotr'); const w2 = await p.evaluate(() => document.getElementById('cr-view').height > document.getElementById('cr-view').width); ok(w2, 'rotate right turns a landscape image portrait');
  await p.close();
  p = await page('/circle-crop-image/'); await p.setInputFiles('#cr-input', IMG); await p.waitForSelector('#cr-work:not([hidden])');
  f = await dl(p, '#cr-dl', '/tmp/cr3.png');
  const corner = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return [x.getImageData(1, 1, 1, 1).data[3], x.getImageData(im.width >> 1, im.height >> 1, 1, 1).data[3]]; }, fs.readFileSync('/tmp/cr3.png').toString('base64'));
  ok(/\.png$/.test(f) && corner[0] === 0 && corner[1] === 255, 'circle crop has transparent corners ' + corner);
  await p.close();

  // --- PDF pages: make a 5-page PDF with page widths 101..105
  p = await page('/delete-pdf-pages/');
  const pdf5 = await p.evaluate(async () => { const d = await PDFLib.PDFDocument.create(); const f = await d.embedFont(PDFLib.StandardFonts.Helvetica); for (let i = 1; i <= 5; i++) { const pg = d.addPage([100 + i, 200]); pg.drawText('Page ' + i + ' hello etoolbox', { x: 5, y: 100, size: 8, font: f }); } return [...await d.save()]; });
  fs.writeFileSync('/tmp/five.pdf', Buffer.from(pdf5));
  await p.setInputFiles('#pg-input', '/tmp/five.pdf'); await p.waitForSelector('form[data-ready]');
  ok((await p.$$('.pg-thumb img')).length === 5, 'five page previews');
  await p.click('.pg[data-idx="1"] .pg-thumb'); await p.fill('#pg-pick', '2, 4'); await p.dispatchEvent('#pg-pick', 'change');
  ok(/3 of 5 pages kept/.test(await p.textContent('#pg-count')), 'typed pages marked for deletion');
  await dl(p, '#pg-run', '/tmp/del.pdf'); ok((await pdfInfo(p, '/tmp/del.pdf')).join() === '101:0,103:0,105:0', 'deleted pages 2 and 4');
  await p.close();
  p = await page('/extract-pdf-pages/'); await p.setInputFiles('#pg-input', '/tmp/five.pdf'); await p.waitForSelector('form[data-ready]');
  await p.click('.pg[data-idx="4"] .pg-thumb'); await p.click('.pg[data-idx="1"] .pg-thumb'); await p.click('.pg[data-idx="1"] [data-act=rot]');
  await dl(p, '#pg-run', '/tmp/ext.pdf'); ok((await pdfInfo(p, '/tmp/ext.pdf')).join() === '102:90,105:0', 'extracted 2 and 5 with rotation');
  await p.close();
  p = await page('/reorder-pdf-pages/'); await p.setInputFiles('#pg-input', '/tmp/five.pdf'); await p.waitForSelector('form[data-ready]');
  await p.click('.pg[data-idx="0"] [data-act=right]'); await p.click('.pg[data-idx="4"] [data-act=left]');
  await dl(p, '#pg-run', '/tmp/ord.pdf'); ok((await pdfInfo(p, '/tmp/ord.pdf')).map(x => x.split(':')[0]).join() === '102,101,103,105,104', 'reorder with buttons');
  await p.close();

  // --- PDF to text and OCR
  p = await page('/pdf-to-text/'); await p.setInputFiles('#pt-input', '/tmp/five.pdf'); await p.waitForSelector('form[data-done]', { timeout: 30000 });
  let t = await p.inputValue('#pt-out'); ok(/--- Page 1 ---\nPage 1 hello etoolbox/.test(t) && /Page 5 hello etoolbox/.test(t), 'text extracted from every page');
  await p.close();
  p = await page('/delete-pdf-pages/');
  const scan = await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1200, 400); x.fillStyle = '#000'; x.font = 'bold 90px Arial'; x.fillText('INVOICE 2026', 80, 230);
    const png = await new Promise(r => c.toBlob(b => b.arrayBuffer().then(r), 'image/png')); const d = await PDFLib.PDFDocument.create(); const im = await d.embedPng(png); const pg = d.addPage([600, 200]); pg.drawImage(im, { x: 0, y: 0, width: 600, height: 200 }); return [...await d.save()]; });
  fs.writeFileSync('/tmp/scan.pdf', Buffer.from(scan));
  await p.close(); p = await page('/ocr-pdf/');
  await p.setInputFiles('#pt-input', '/tmp/scan.pdf'); await p.waitForSelector('form[data-done]', { timeout: 90000 });
  t = await p.inputValue('#pt-out'); ok(/INVOICE\s*2026/.test(t), 'OCR reads a scanned page: ' + JSON.stringify(t.slice(0, 60)));
  ok(/read with OCR/.test(await p.textContent('#pt-msg')), 'reports OCR pages');
  await p.close();

  // --- pregnancy
  p = await page('/pregnancy-due-date-calculator/');
  const pr = await p.evaluate(() => [ETBPreg.dueDate('lmp', '2026-01-01', 28), ETBPreg.dueDate('lmp', '2026-01-01', 30), ETBPreg.dueDate('conception', '2026-01-15'), ETBPreg.dueDate('ivf5', '2026-01-20'), ETBPreg.dueDate('ivf3', '2026-01-18')]);
  ok(pr.join() === '2026-10-08,2026-10-10,2026-10-08,2026-10-08,2026-10-08', 'due date rules ' + pr);
  const iso = (d) => d.toISOString().slice(0, 10), lmp = new Date(Date.now() - 70 * 864e5);
  await p.fill('#due-date', iso(lmp)); await p.dispatchEvent('#due-date', 'input');
  ok(await p.getAttribute('form[data-due-calc]', 'data-weeks') === '10+0', 'shows 10 weeks pregnant for a period 70 days ago');
  ok(/Dating scan/.test(await p.textContent('#due-out')) && /Tell your employer/.test(await p.textContent('#due-out')), 'key dates listed');
  f = await dl(p, '#due-ics', '/tmp/preg.ics'); ok(/BEGIN:VEVENT[\s\S]*Estimated due date/.test(fs.readFileSync('/tmp/preg.ics', 'utf8')), 'calendar file ' + f);
  await p.close();
  p = await page('/ovulation-calculator/');
  const ov = await p.evaluate(() => ETBPreg.cycles('2026-11-01', 28, 5, 2)[0]);
  ok(ov.ovulation === '2026-11-15' && ov.fertileStart === '2026-11-10' && ov.fertileEnd === '2026-11-16' && ov.next === '2026-11-29', 'ovulation maths ' + JSON.stringify(ov));
  ok((await p.$$('.ovu-g .ov')).length >= 3, 'calendar marks ovulation days');
  await p.close();

  // --- phones
  for (const u of ['/passport-photo-maker/', '/image-cropper/', '/delete-pdf-pages/', '/pdf-to-text/', '/pregnancy-due-date-calculator/', '/ovulation-calculator/']) {
    const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, u + ' fits a phone (' + sw + ')'); await m.close(); }
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
