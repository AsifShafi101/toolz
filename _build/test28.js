// Batch 6: crop, header & footer, redact, fill forms, flatten, extract images, N-up, booklet; WAV/MP3/M4A converters and audio cutter.
const { chromium } = require('playwright');
const fs = require('fs'); const { execSync } = require('child_process');
const PDFLib = require('../assets/vendor/pdf-lib.min.js');
const BASE = process.env.BASE || 'http://localhost:8765';
const D = '/tmp/t28/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  const dl = async (p, sel, t) => { const [d] = await Promise.all([p.waitForEvent('download', { timeout: t || 60000 }), p.click(sel)]); return d; };
  const bytes = async (d) => fs.readFileSync(await d.path());
  const pdfText = async (p, buf) => p.evaluate(async (b64) => { const L = await ETBPdf.pdfjs(); const doc = await L.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise; const out = []; for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i); out.push((await pg.getTextContent()).items.map(x => x.str).join(' ')); } return out; }, buf.toString('base64'));
  const load = async (p, file) => { await p.setInputFiles('input[type=file]', D + file); await p.waitForSelector('form[data-ready]', { timeout: 30000 }); };

  // Pure helpers
  let p = await page('/pdf-header-footer/');
  const h = await p.evaluate(() => [ETBPdf2.fillTokens('Page {page} of {total} · {DATE} · {file}', { page: 3, total: 12, date: '24/11/2026', file: 'a.pdf' }), ETBPdf2.fmtDate(new Date(2026, 0, 5), 'long'), ETBPdf2.fmtDate(new Date(2026, 0, 5), 'uk'),
    JSON.stringify(ETBPdf2.bookletOrder(5)), JSON.stringify(ETBPdf2.bookletOrder(8)), JSON.stringify(ETBPdf2.nupGrid(2, false)), JSON.stringify(ETBPdf2.nupGrid(2, true)),
    JSON.stringify([0, 90, 180, 270].map(r => { const q = ETBPdf2.visualToPdf({ x: 0, y: 0, width: 100, height: 200 }, r, 10, 20); return [q.x, q.y]; }))]);
  ok(h[0] === 'Page 3 of 12 · 24/11/2026 · a.pdf', 'tokens ' + h[0]);
  ok(h[1] === '5 January 2026' && h[2] === '05/01/2026', 'date formats');
  ok(h[3] === '[[null,0],[1,null],[null,2],[3,4]]' && h[4] === '[[7,0],[1,6],[5,2],[3,4]]', 'booklet imposition ' + h[3] + ' ' + h[4]);
  ok(h[5] === '[2,1,true]' && h[6] === '[1,2,false]', 'n-up grid flips for landscape pages');
  ok(h[7] === '[[10,20],[80,10],[90,180],[20,190]]', 'rotation mapping ' + h[7]);

  // Header & footer
  await load(p, 'text5.pdf'); ok(/5 pages/.test(await p.textContent('#hf-info')), 'reads page count');
  ok(/Page 1 of 12/.test(await p.textContent('#hf-p-fr')) && (await p.textContent('#hf-p-fl')) === 'text5.pdf', 'live preview');
  await p.fill('#hf-hc', 'CONFIDENTIAL £'); await p.check('input[name=skipfirst]');
  let d = await dl(p, '#hf-run'); let buf = await bytes(d); let txt = await pdfText(p, buf);
  ok(d.suggestedFilename() === 'text5-header-footer.pdf' && !/CONFIDENTIAL/.test(txt[0]) && /CONFIDENTIAL £/.test(txt[1]) && /Page 1 of 4/.test(txt[1]) && /Page 4 of 4/.test(txt[4]) && /text5\.pdf/.test(txt[2]), 'header/footer drawn, cover skipped, numbering 1–4');
  await p.fill('#hf-hc', 'مرحبا'); await p.click('#hf-run'); await p.waitForTimeout(800); ok(/Latin/.test(await p.textContent('[data-msg]')), 'non-Latin text gives a clear message'); await p.close();

  // Crop
  p = await page('/crop-pdf/'); await load(p, 'text5.pdf');
  ok((await p.$$('#cp-page option')).length === 5, 'page picker lists 5 pages');
  for (const [k, v] of [['top', '20'], ['right', '10'], ['bottom', '30'], ['left', '15']]) await p.fill(`input[name=${k}]`, v);
  ok(/Cropped size: 185 × 247 mm/.test(await p.textContent('#cp-size')), 'size readout ' + await p.textContent('#cp-size'));
  d = await dl(p, '#cp-run'); let doc = await PDFLib.PDFDocument.load(await bytes(d)); let cb = doc.getPage(0).getCropBox();
  const MM = 72 / 25.4;
  ok(Math.abs(cb.x - 15 * MM) < 0.6 && Math.abs(cb.y - 30 * MM) < 0.6 && Math.abs(cb.width - (595.28 - 25 * MM)) < 0.6 && Math.abs(cb.height - (841.89 - 50 * MM)) < 0.6, 'crop box from margins ' + JSON.stringify(cb));
  const rb = doc.getPage(2).getCropBox(); ok(Math.abs(rb.width - 595.28 * 247 / 297) < 1 && Math.abs(rb.height - 841.89 * 185 / 210) < 1, 'rotated page cropped as seen ' + JSON.stringify(rb));
  await p.$eval('#cp-view', e => e.scrollIntoView({ block: 'center' })); const box = await p.locator('#cp-view').boundingBox(); await p.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 4 }); await p.mouse.up();
  ok(Math.abs(+(await p.inputValue('input[name=left]')) - 21) < 1.5 && Math.abs(+(await p.inputValue('input[name=bottom]')) - 148.5) < 2, 'dragging sets margins');
  await p.selectOption('#cp-apply', 'one'); d = await dl(p, '#cp-run'); doc = await PDFLib.PDFDocument.load(await bytes(d)); ok(doc.getPage(1).getCropBox().width > 590 && doc.getPage(0).getCropBox().width < 320, 'crop only the page shown'); await p.close();

  // Redact
  p = await page('/redact-pdf/'); await load(p, 'text5.pdf');
  ok(/Page 1 of 5/.test(await p.textContent('#rd-pg')) && await p.isDisabled('#rd-run'), 'shows first page, nothing to redact yet');
  await p.fill('#rd-q', 'secret'); await p.click('#rd-find'); await p.waitForSelector('form[data-boxes="5"]');
  ok(/Marked 5 matches/.test(await p.textContent('[data-msg]')), 'search marks a match on every page');
  await p.click('#rd-next'); await p.click('#rd-clear'); ok(await p.getAttribute('form[data-redact]', 'data-boxes') === '4', 'clear page removes its boxes');
  await p.$eval('#rd-view', e => e.scrollIntoView({ block: 'center' })); const vb = await p.locator('#rd-view').boundingBox(); await p.mouse.move(vb.x + 20, vb.y + vb.height * 0.4); await p.mouse.down(); await p.mouse.move(vb.x + 120, vb.y + vb.height * 0.45, { steps: 3 }); await p.mouse.up();
  ok(await p.getAttribute('form[data-redact]', 'data-boxes') === '5', 'draw a box by hand');
  d = await dl(p, '#rd-run', 90000); buf = await bytes(d); txt = await pdfText(p, buf);
  ok(txt.length === 5 && txt[0] === '' && txt[1] === '' && !txt.join(' ').toLowerCase().includes('secret'), 'redacted pages have no text left: ' + JSON.stringify(txt.map(t => t.slice(0, 20))));
  const shot = await p.evaluate(async (b64) => { const L = await ETBPdf.pdfjs(); const doc = await L.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise; const pg = await doc.getPage(1); const vp = pg.getViewport({ scale: 1 }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    const r = await (await ETBRedact.find('secret'))[1][0]; return [Math.round(vp.width), Array.from(c.getContext('2d').getImageData(Math.round((r.x + r.w / 2) * vp.width), Math.round((r.y + r.h / 2) * vp.height), 1, 1).data.slice(0, 3))]; }, buf.toString('base64'));
  ok(shot[0] === 595 && shot[1].every(v => v < 40), 'black box burned in where the word was ' + JSON.stringify(shot));
  doc = await PDFLib.PDFDocument.load(buf); ok(doc.getTitle() === undefined && doc.getPageCount() === 5, 'document properties cleared'); await p.close();

  // Fill form
  p = await page('/fill-pdf-form/'); await load(p, 'form.pdf');
  ok(await p.getAttribute('form[data-fill]', 'data-fields') === '4' && /page 1/.test(await p.textContent('#ff-fields')), 'lists 4 fields with page number');
  await p.fill('#ff-fields input[type=text]', 'Asif Shafi'); await p.check('#ff-fields input[type=checkbox]');
  const sels = await p.$$('#ff-fields select'); await sels[0].selectOption('Wales'); await sels[1].selectOption('L');
  d = await dl(p, '#ff-run'); doc = await PDFLib.PDFDocument.load(await bytes(d)); let fm = doc.getForm();
  ok(fm.getTextField('full_name').getText() === 'Asif Shafi' && fm.getCheckBox('agree').isChecked() && fm.getDropdown('country').getSelected()[0] === 'Wales' && fm.getRadioGroup('size').getSelected() === 'L', 'filled values saved');
  await p.check('input[name=flatten]'); d = await dl(p, '#ff-run'); buf = await bytes(d); doc = await PDFLib.PDFDocument.load(buf);
  ok(doc.getForm().getFields().length === 0 && /Asif Shafi/.test((await pdfText(p, buf))[0]), 'lock answers flattens form, text kept');
  await p.setInputFiles('input[type=file]', D + 'text5.pdf'); await p.waitForTimeout(800); ok(/no fillable form fields/.test(await p.textContent('#ff-fields')) && await p.isHidden('#ff-work'), 'non-form PDF explained'); await p.close();

  // Flatten
  p = await page('/flatten-pdf/'); await load(p, 'form.pdf'); ok(/4 form fields/.test(await p.textContent('#fl-info')), 'counts form fields');
  d = await dl(p, '#fl-run'); doc = await PDFLib.PDFDocument.load(await bytes(d)); ok(doc.getForm().getFields().length === 0, 'form fields flattened');
  await p.selectOption('#fl-mode', 'image'); d = await dl(p, '#fl-run'); buf = await bytes(d); doc = await PDFLib.PDFDocument.load(buf);
  ok(doc.getPageCount() === 1 && (await pdfText(p, buf))[0] === '' && Math.round(doc.getPage(0).getWidth()) === 595, 'everything mode makes image pages'); await p.close();

  // Extract images
  p = await page('/extract-images-from-pdf/'); await load(p, 'images.pdf');
  ok(await p.getAttribute('form[data-extract]', 'data-images') === '2' && /1 small one hidden/.test(await p.textContent('#ex-sum')), 'finds images, hides the tiny one ' + await p.textContent('#ex-sum'));
  ok(/Page 1 · 300×200/.test(await p.textContent('#ex-grid')), 'original resolution shown');
  d = await dl(p, '#ex-run'); const z = await p.evaluate((b64) => Object.keys(fflate.unzipSync(Uint8Array.from(atob(b64), c => c.charCodeAt(0)))).sort(), (await bytes(d)).toString('base64'));
  ok(z.join() === 'images-page1-image1.png,images-page2-image1.png', 'ZIP of images ' + z.join());
  await p.selectOption('#ex-min', '0'); ok(await p.getAttribute('form[data-extract]', 'data-images') === '3', 'keep all shows the icon too'); await p.close();

  // N-up
  p = await page('/n-up-pdf/'); await load(p, 'text5.pdf'); ok(/5 pages → 2 sheets, 4 pages on each/.test(await p.textContent('#nu-plan')), 'plan text');
  d = await dl(p, '#nu-run'); doc = await PDFLib.PDFDocument.load(await bytes(d)); ok(d.suggestedFilename() === 'text5-4-up.pdf' && doc.getPageCount() === 2 && Math.round(doc.getPage(0).getWidth()) === 595, '4-up on 2 portrait A4 sheets');
  await p.selectOption('#nu-per', '2'); d = await dl(p, '#nu-run'); buf = await bytes(d); doc = await PDFLib.PDFDocument.load(buf); txt = await pdfText(p, buf);
  ok(doc.getPageCount() === 3 && Math.round(doc.getPage(0).getWidth()) === 842 && /Page 1 .*Page 2 /.test(txt[0]), '2-up on landscape sheets, in order'); await p.close();

  // Booklet
  p = await page('/pdf-booklet-maker/'); await load(p, 'text5.pdf');
  ok(/2 sheets of paper/.test(await p.textContent('#nu-plan')) && /3 blank pages/.test(await p.textContent('#nu-plan')) && /Front 1: blank \| 1/.test(await p.textContent('#nu-order')), 'booklet plan and order');
  d = await dl(p, '#nu-run'); buf = await bytes(d); doc = await PDFLib.PDFDocument.load(buf); txt = await pdfText(p, buf);
  ok(doc.getPageCount() === 4 && Math.round(doc.getPage(0).getWidth()) === 842 && /^Page 1 /.test(txt[0].trim()) && /Page 2 .*SECRET.*\s*$/.test(txt[1]) && /Page 4 .*Page 5 /.test(txt[3]), 'booklet sides ' + JSON.stringify(txt.map(t => t.replace(/ SECRET 12345 public text/g, ''))));
  await p.close();

  // Audio converters
  const probe = (f) => JSON.parse(execSync(`ffprobe -v error -show_streams -show_format -of json "${f}"`).toString());
  for (const [u, file, ext, codec] of [['/mp3-to-wav/', 'tone.mp3', 'wav', 'pcm_s16le']]) {
    p = await page(u); await p.setInputFiles('#ac-input', D + file); await p.waitForFunction(() => !document.getElementById('ac-go').disabled, null, { timeout: 30000 });
    ok(/0:06 long/.test(await p.textContent('#ac-info')), u + ' reads duration');
    if (ext === 'mp3') await p.selectOption('#ac-ch', '1');
    d = await dl(p, '#ac-go'); const out = '/tmp/t28/out-' + file + '.' + ext; await d.saveAs(out); const pr = probe(out);
    ok(d.suggestedFilename() === 'tone.' + ext && pr.streams[0].codec_name === codec && Math.abs(pr.format.duration - 6) < 0.3 && (ext !== 'mp3' || pr.streams[0].channels === 1), `${u} → ${codec} ${(+pr.format.duration).toFixed(2)}s ${pr.streams[0].channels}ch`);
    ok(await p.isVisible('#ac-audio'), u + ' player shown'); await p.close();
  }
  // Audio cutter
  p = await page('/audio-cutter/');
  const cf = await p.evaluate(() => { const a = new Float32Array(10).fill(1); const r = ETBAudio.cutFade([a], 10, 0.2, 0.8, 0.2, 0.2); const w = ETBAudio.wavBytes([new Float32Array([0, 1, -1])], 8000); return [Array.from(r[0]).map(v => +v.toFixed(2)), w.length, String.fromCharCode(...w.slice(0, 4)), new DataView(w.buffer).getInt16(46, true), new DataView(w.buffer).getInt16(48, true)]; });
  ok(JSON.stringify(cf[0]) === '[0,0.5,1,1,0.5,0]' && cf[1] === 50 && cf[2] === 'RIFF' && cf[3] === 32767 && cf[4] === -32768, 'cut, fade and WAV writer ' + JSON.stringify(cf));
  await p.setInputFiles('#cu-input', D + 'tone.mp3'); await p.waitForSelector('form[data-cutter][data-ready]', { timeout: 30000 });
  ok(/^0:0[0-]/.test(await p.inputValue('#cu-start')) && /0:06/.test(await p.inputValue('#cu-end')), 'whole file selected at first');
  await p.fill('#cu-start', '1'); await p.fill('#cu-end', '3.5'); await p.dispatchEvent('#cu-end', 'change');
  ok(await p.getAttribute('form[data-cutter]', 'data-sel') === '1.00-3.50', 'typed times set the selection');
  await p.$eval('#cu-wave', e => e.scrollIntoView({ block: 'center' })); const wb = await p.locator('#cu-wave').boundingBox(); const sx = wb.x + wb.width * (1 / 6.0); await p.mouse.move(sx, wb.y + 70); await p.mouse.down(); await p.mouse.move(wb.x + wb.width * 0.25, wb.y + 70, { steps: 4 }); await p.mouse.up();
  const sel = (await p.getAttribute('form[data-cutter]', 'data-sel')).split('-').map(Number); ok(Math.abs(sel[0] - 1.5) < 0.2 && sel[1] === 3.5, 'drag the start handle ' + sel.join('-'));
  await p.fill('#cu-start', '1'); await p.dispatchEvent('#cu-start', 'change'); await p.fill('#cu-fo', '1');
  await p.selectOption('#cu-fmt', 'wav'); ok(await p.isHidden('#cu-br'), 'WAV hides MP3 quality');
  d = await dl(p, '#cu-dl'); await d.saveAs('/tmp/t28/cut.wav'); let pr = probe('/tmp/t28/cut.wav'); ok(d.suggestedFilename() === 'tone-cut.wav' && Math.abs(pr.format.duration - 2.5) < 0.05, 'WAV cut is 2.5 s ' + pr.format.duration);
  const tail = execSync('ffmpeg -hide_banner -sseof -0.05 -i /tmp/t28/cut.wav -af volumedetect -f null - 2>&1').toString(); const mv = +((tail.match(/max_volume: (-?[\d.]+)/) || [])[1]);
  ok(mv < -20, 'fade-out makes the end quiet (' + mv + ' dB)');
  await p.selectOption('#cu-fmt', 'mp3'); await p.selectOption('#cu-ch', '1'); d = await dl(p, '#cu-dl'); await d.saveAs('/tmp/t28/cut.mp3'); pr = probe('/tmp/t28/cut.mp3');
  ok(pr.streams[0].codec_name === 'mp3' && pr.streams[0].channels === 1 && Math.abs(pr.format.duration - 2.5) < 0.15, 'MP3 cut, mono ' + pr.format.duration); await p.close();

  // Home links + mobile
  p = await page('/'); const home = await p.content(); ok(['crop-pdf', 'redact-pdf', 'fill-pdf-form', 'pdf-header-footer', 'flatten-pdf', 'extract-images-from-pdf', 'n-up-pdf', 'pdf-booklet-maker', 'audio-cutter', 'mp3-to-wav'].every(s => home.includes('/' + s + '/')), 'all 10 tools linked from the homepage'); await p.close();
  const m = await b.newContext({ viewport: { width: 390, height: 844 } });
  for (const u of ['/pdf-header-footer/', '/audio-cutter/', '/redact-pdf/']) { const mp = await m.newPage(); await mp.goto(BASE + u, { waitUntil: 'networkidle' }); if (u === '/audio-cutter/') { await mp.setInputFiles('#cu-input', D + 'tone.wav'); await mp.waitForSelector('form[data-ready]'); } else { await mp.setInputFiles('input[type=file]', D + 'text5.pdf'); await mp.waitForSelector('form[data-ready]'); }
    ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal scroll on mobile ' + u); await mp.close(); }
  await m.close();

  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
