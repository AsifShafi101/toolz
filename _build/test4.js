// E2E tests for batch 3 (the user's top-25 list).
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const mammoth = require('mammoth');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOTS = process.env.SHOTS || '/tmp/shots';
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info).slice(0, 400)); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const errors = [];
  const open = async (p) => { const page = await ctx.newPage(); page.on('pageerror', e => errors.push(p + ': ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(p + ': ' + m.text()); }); await page.goto(BASE + p); return page; };
  const run = async (page) => { await page.evaluate(() => { const o = document.getElementById('pdf-out'); o.removeAttribute('data-done'); o.removeAttribute('data-error'); document.getElementById('pdf-msg').textContent = ''; });
    await page.click('#run'); await page.waitForFunction(() => { const o = document.getElementById('pdf-out'); return o.hasAttribute('data-done') || o.hasAttribute('data-error') || document.getElementById('pdf-msg').textContent; }, null, { timeout: 90000 }); };
  const outFile = async (page) => { const href = await page.getAttribute('#pdf-out a[data-dl]', 'href'); return Buffer.from(await page.evaluate(async (h) => Array.from(new Uint8Array(await (await fetch(h)).arrayBuffer())), href)); };
  const result = async (page) => JSON.parse((await page.getAttribute('#calc-out', 'data-result')) || 'null');

  // Build test PDFs: image-heavy and text-with-heading
  let page = await open('/compress-pdf/');
  const noisyJpg = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 2400; c.height = 3200; const x = c.getContext('2d'); for (let i = 0; i < 30000; i++) { x.fillStyle = `hsl(${Math.random() * 360},70%,50%)`; x.fillRect(Math.random() * 2400, Math.random() * 3200, 4 + Math.random() * 40, 4 + Math.random() * 40); } return Array.from(atob(c.toDataURL('image/jpeg', 0.97).split(',')[1]), ch => ch.charCodeAt(0)); }));
  const imgDoc = await PDFDocument.create(); const jp = await imgDoc.embedJpg(noisyJpg);
  for (let i = 0; i < 2; i++) imgDoc.addPage([595.28, 841.89]).drawImage(jp, { x: 0, y: 0, width: 595.28, height: 841.89 });
  const IMGPDF = Buffer.from(await imgDoc.save());
  const tDoc = await PDFDocument.create(), font = await tDoc.embedFont(StandardFonts.Helvetica), bold = await tDoc.embedFont(StandardFonts.HelveticaBold);
  let p1 = tDoc.addPage([595.28, 841.89]);
  p1.drawText('Quarterly Report', { x: 72, y: 760, size: 28, font: bold });
  p1.drawText('Sales grew strongly this quarter across all regions.', { x: 72, y: 700, size: 12, font });
  p1.drawText('Customers in Leeds and York led the increase.', { x: 72, y: 685, size: 12, font });
  p1.drawText('A second paragraph starts after a gap & has <special> chars.', { x: 72, y: 640, size: 12, font });
  tDoc.addPage([595.28, 841.89]).drawText('Page two text here.', { x: 72, y: 760, size: 12, font });
  const TEXTPDF = Buffer.from(await tDoc.save());
  const pdfFile = (name, buffer) => ({ name, mimeType: 'application/pdf', buffer });

  // ---- Compress
  await page.setInputFiles('#pdf-input', [pdfFile('scan.pdf', IMGPDF)]); await run(page);
  let out = await outFile(page), d = await PDFDocument.load(out);
  check('compress recommended: much smaller, same pages', out.length < IMGPDF.length * 0.6 && d.getPageCount() === 2 && Math.round(d.getPage(0).getWidth()) === 595, { in: IMGPDF.length, out: out.length });
  check('compress shows saving note', /% smaller/.test(await page.textContent('#pdf-out')));
  await page.check('input[name=level][value=strong]', { force: true }); await run(page);
  const strong = await outFile(page); check('strong smaller than recommended', strong.length < out.length, { strong: strong.length, rec: out.length });
  await page.setInputFiles('#pdf-input', [pdfFile('text.pdf', TEXTPDF)]); await page.check('input[name=level][value=light]', { force: true }); await run(page);
  out = await outFile(page); check('light never bigger than original', out.length <= TEXTPDF.length, { in: TEXTPDF.length, out: out.length });
  await page.close();

  // ---- PDF to Word
  page = await open('/pdf-to-word/');
  await page.setInputFiles('#pdf-input', [pdfFile('report.pdf', TEXTPDF)]); await run(page);
  const docx = await outFile(page);
  check('pdf→word filename', (await page.getAttribute('#pdf-out a[data-dl]', 'download')) === 'report.docx');
  const raw = (await mammoth.extractRawText({ buffer: docx })).value, html = (await mammoth.convertToHtml({ buffer: docx })).value;
  check('docx contains all text', raw.includes('Quarterly Report') && raw.includes('Sales grew strongly this quarter across all regions. Customers in Leeds and York led the increase.') && raw.includes('<special>') && raw.includes('Page two text here.'), raw);
  check('heading is bold, paragraphs split', /<strong>Quarterly Report<\/strong>/.test(html) && (html.match(/<p>/g) || []).length >= 4, html);
  fs.writeFileSync('/tmp/report.docx', docx);
  const scan = await (async () => { const s = await PDFDocument.create(); const j = await s.embedJpg(noisyJpg); s.addPage([300, 400]).drawImage(j, { x: 0, y: 0, width: 300, height: 400 }); return Buffer.from(await s.save()); })();
  await page.setInputFiles('#pdf-input', [pdfFile('scan.pdf', scan)]); await run(page);
  check('scanned PDF explained', (await page.textContent('#pdf-msg')).includes('looks like a scan'));
  await page.close();

  // ---- Word to PDF
  page = await open('/word-to-pdf/');
  await page.setInputFiles('#doc-input', [{ name: 'report.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docx }]);
  await page.waitForSelector('#doc[data-ready]');
  check('docx preview rendered', (await page.textContent('#doc')).includes('Customers in Leeds') && !(await page.isDisabled('#print-doc')));
  await page.evaluate(() => { window.__p = 0; window.print = () => window.__p++; }); await page.click('#print-doc');
  check('print called', (await page.evaluate(() => window.__p)) === 1);
  await page.emulateMedia({ media: 'print' }); await page.pdf({ path: '/tmp/w2p.pdf', format: 'A4' }); await page.emulateMedia({ media: 'screen' });
  const w2p = await PDFDocument.load(fs.readFileSync('/tmp/w2p.pdf')); check('printed PDF is clean A4 (1 page)', w2p.getPageCount() === 1, w2p.getPageCount());
  await page.setInputFiles('#doc-input', [{ name: 'old.doc', mimeType: 'application/msword', buffer: Buffer.from('x') }]);
  check('.doc explained', (await page.textContent('#doc-msg')).includes('Save As'));
  await page.close();

  // ---- JPG to PNG landing page
  page = await open('/jpg-to-png/');
  const jpg = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; c.getContext('2d').fillRect(0, 0, 100, 100); return Array.from(atob(c.toDataURL('image/jpeg').split(',')[1]), ch => ch.charCodeAt(0)); }));
  await page.setInputFiles('#img-input', [{ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: jpg }]);
  await page.waitForSelector('[data-out]'); const o = JSON.parse(await page.getAttribute('[data-out]', 'data-out'));
  check('jpg-to-png defaults to PNG', o.type === 'image/png' && (await page.getAttribute('.img-item a', 'download')) === 'photo.png', o);
  await page.close();
  page = await open('/png-to-jpg/'); check('png-to-jpg defaults to JPG', await page.isChecked('input[name=format][value=jpeg]')); await page.close();

  // ---- Background remover
  page = await open('/background-remover/');
  const prod = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#fbfbfb'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#c0392b'; x.beginPath(); x.arc(200, 150, 80, 0, Math.PI * 2); x.fill(); return Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0)); }));
  await page.setInputFiles('#bg-input', [{ name: 'product.png', mimeType: 'image/png', buffer: prod }]);
  await page.waitForSelector('#bg-view[data-cleared]');
  const px = await page.evaluate(() => { const v = document.getElementById('bg-view'), x = v.getContext('2d'); return { corner: x.getImageData(5, 5, 1, 1).data[3], centre: x.getImageData(200, 150, 1, 1).data[3], cleared: +v.getAttribute('data-cleared'), detected: document.getElementById('bgcolour').value }; });
  const expected = 1 - Math.PI * 80 * 80 / (400 * 300);
  check('background removed, subject kept', px.corner === 0 && px.centre === 255 && Math.abs(px.cleared - expected) < 0.02 && px.detected === '#fbfbfb', { px, expected });
  await page.selectOption('#fill', 'colour');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bg-dl')]);
  check('solid background → JPG', dl.suggestedFilename() === 'product-new-background.jpg');
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/bg.png' });
  await page.close();

  // ---- Colour picker
  page = await open('/colour-picker/');
  await page.fill('#code', 'rgb(0, 128, 255)'); const fmts = await page.textContent('#formats');
  check('rgb → hex/hsl/cmyk', fmts.includes('#0080FF') && fmts.includes('hsl(210, 100%, 50%)') && fmts.includes('100%, 50%, 0%, 0%'), fmts);
  const cv = await page.evaluate(() => ({ c: ETBColour.contrast([255, 255, 255], [0, 0, 0]), h: ETBColour.rgbToHex(ETBColour.hslToRgb([16, 100, 60])) }));
  check('contrast 21:1 & hsl round trip', Math.abs(cv.c - 21) < 1e-9 && cv.h === '#ff6933', cv);
  await page.fill('#code', 'nonsense'); check('bad code message', (await page.textContent('#code-msg')).includes('HEX'));
  await page.close();

  // ---- JSON
  page = await open('/json-formatter/');
  await page.fill('#json-in', "{'a': 1}"); await page.click('#json-format');
  check('invalid JSON explained with tip', /line 1, column 2/.test(await page.textContent('#json-msg')) && (await page.textContent('#json-msg')).includes('double quotes'), await page.textContent('#json-msg'));
  await page.fill('#json-in', '{"b":2,"a":[1,2,{"c":null}]}'); await page.check('#sortkeys'); await page.click('#json-format');
  check('format + sort keys', (await page.inputValue('#json-out')) === '{\n  "a": [\n    1,\n    2,\n    {\n      "c": null\n    }\n  ],\n  "b": 2\n}', await page.inputValue('#json-out'));
  await page.click('#json-minify'); check('minify', (await page.inputValue('#json-out')) === '{"a":[1,2,{"c":null}],"b":2}');
  await page.fill('#json-in', '[1,2,]'); await page.click('#json-format'); check('trailing comma tip', (await page.textContent('#json-msg')).includes('remove the comma'));
  await page.close();

  // ---- Meta description
  page = await open('/meta-description-generator/');
  await page.fill('#business', 'Shafi Plumbing'); await page.fill('#keyword', 'emergency plumber'); await page.fill('#location', 'Leeds'); await page.fill('#usp', '24/7 call-outs with no call-out fee');
  const ideas = await page.$$eval('.idea', els => els.map(e => e.textContent));
  check('4 ideas generated', ideas.length === 4 && ideas[0].startsWith('Emergency plumber in Leeds from Shafi Plumbing.'), ideas);
  await page.click('.idea >> nth=0');
  check('idea fills description + preview', (await page.inputValue('#description')) === ideas[0] && (await page.textContent('#serp-desc')) === ideas[0]);
  check('auto title', (await page.textContent('#serp-title')).startsWith('Emergency plumber in Leeds | Shafi Plumbing'));
  check('meta code', (await page.inputValue('#meta-code')).includes('<meta name="description" content="' + ideas[0].replace(/&/g, '&amp;') + '">'));
  await page.fill('#description', 'x'.repeat(200)); check('too long flagged', (await page.textContent('#desc-count')).includes('too long') && (await page.textContent('#serp-desc')).endsWith('…'));
  await page.setViewportSize({ width: 1280, height: 900 }); await page.fill('#description', ideas[1]); await page.screenshot({ path: SHOTS + '/meta.png' });
  await page.close();

  // ---- YouTube thumbnails (image server mocked)
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('yt: ' + e.message));
  const thumb = fs.readFileSync('/tmp/thumb.jpg');
  await page.route('https://i.ytimg.com/**', route => route.request().url().includes('maxresdefault') ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ status: 200, contentType: 'image/jpeg', body: thumb, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto(BASE + '/youtube-thumbnail-downloader/');
  const ids = await page.evaluate(() => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'https://youtu.be/dQw4w9WgXcQ?si=x', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'https://vimeo.com/123'].map(ETBMedia.ytId));
  check('YouTube ID parsing', ids.slice(0, 6).every(i => i === 'dQw4w9WgXcQ') && ids[6] === null, ids);
  await page.fill('#url', 'https://youtu.be/dQw4w9WgXcQ'); await page.waitForTimeout(800);
  check('missing HD size hidden, 3 sizes shown', (await page.$$('.yt-card')).length === 3, (await page.$$('.yt-card')).length);
  const [ydl] = await Promise.all([page.waitForEvent('download'), page.click('.yt-card [data-dl] >> nth=0')]);
  check('thumbnail downloads', ydl.suggestedFilename() === 'youtube-dQw4w9WgXcQ-sddefault.jpg');
  await page.fill('#url', 'https://example.com'); check('bad link message', (await page.textContent('#yt-msg')).includes("doesn't look like"));
  await page.close();

  // ---- Currency (API mocked)
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('fx: ' + e.message));
  await page.route('https://api.frankfurter.dev/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ amount: 1, base: 'EUR', date: '2026-10-30', rates: { GBP: 0.85, USD: 1.1, JPY: 160 } }) }));
  await page.goto(BASE + '/currency-converter/'); await page.waitForSelector('#fx-out[data-result]');
  let fx = JSON.parse(await page.getAttribute('#fx-out', 'data-result'));
  check('100 GBP → 117.65 EUR', fx.value === 117.65, fx);
  check('rate date shown', (await page.textContent('#fx-info')).includes('30 October 2026'));
  await page.selectOption('#to', 'USD'); fx = JSON.parse(await page.getAttribute('#fx-out', 'data-result'));
  check('GBP → USD cross rate', fx.value === 129.41, fx);
  await page.click('#fx-swap'); check('swap', (await page.inputValue('#from')) === 'USD');
  await page.close();

  // ---- Screenshot tool (API mocked)
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('shot: ' + e.message));
  let calls = [];
  await page.route('**/api/screenshot**', route => { calls.push(route.request().url()); const u = new URL(route.request().url()); return u.searchParams.get('url') === 'bad.example' ? route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: "We couldn't load that website." }) }) : route.fulfill({ status: 200, contentType: 'image/jpeg', body: thumb }); });
  await page.goto(BASE + '/website-screenshot/');
  await page.fill('#url', 'bbc.co.uk'); await page.selectOption('#device', 'mobile'); await page.check('input[name=full]'); await page.click('#shot-run');
  await page.waitForSelector('#shot-img');
  check('screenshot shown + params', calls[0].includes('url=bbc.co.uk') && calls[0].includes('device=mobile') && calls[0].includes('full=1') && (await page.getAttribute('#shot-dl', 'download')) === 'screenshot-bbc.co.uk-mobile.jpg', calls);
  await page.fill('#url', 'bad.example'); await page.click('#shot-run'); await page.waitForFunction(() => document.getElementById('shot-msg').textContent);
  check('screenshot error shown', (await page.textContent('#shot-msg')).includes("couldn't load"));
  await page.close();

  // ---- BMI
  page = await open('/bmi-calculator/');
  await page.fill('#cm', '175'); await page.fill('#kg', '75'); let r = await result(page);
  check('BMI 24.5 healthy', r.bmi === 24.5 && r.category === 'Healthy weight range', r);
  await page.selectOption('#ethnic', 'yes'); r = await result(page); check('lower thresholds → overweight range', r.category === 'Overweight range', r);
  await page.selectOption('#ethnic', 'no'); await page.check('input[name=units][value=imperial]', { force: true });
  await page.fill('#ft', '5'); await page.fill('#inch', '9'); await page.fill('#st', '11'); await page.fill('#lb', '11'); r = await result(page);
  check('imperial BMI 24.4', r.bmi === 24.4, r);
  await page.close();

  // ---- Speech pages load cleanly
  for (const p of ['/text-to-speech/', '/speech-to-text/']) { page = await open(p); await page.waitForTimeout(300); check('loads ' + p, (await page.title()).includes('etoolbox')); await page.close(); }

  // ---- All new pages: load, mobile fit, links
  const all = ['/', '/compress-pdf/', '/pdf-to-word/', '/word-to-pdf/', '/jpg-to-png/', '/png-to-jpg/', '/webp-to-jpg/', '/background-remover/', '/colour-picker/', '/json-formatter/', '/meta-description-generator/', '/website-screenshot/', '/youtube-thumbnail-downloader/', '/text-to-speech/', '/speech-to-text/', '/currency-converter/', '/bmi-calculator/'];
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mob.route('https://api.frankfurter.dev/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ amount: 1, base: 'EUR', date: '2026-10-30', rates: { GBP: 0.85, USD: 1.1 } }) }));
  const seen = new Set();
  for (const p of all) {
    const pg = await mob.newPage(); pg.on('pageerror', e => errors.push(p + ' (mobile): ' + e.message));
    const rr = await pg.goto(BASE + p); check('loads ' + p, rr.status() === 200);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth); check('mobile fits ' + p, sw <= 390, sw);
    for (const l of await pg.$$eval('a[href^="/"]', as => as.map(a => a.getAttribute('href').split('#')[0]))) { if (seen.has(l)) continue; seen.add(l); const x = await pg.request.get(BASE + l); if (x.status() !== 200) check('link ' + l, false, x.status()); }
    if (p === '/') await pg.screenshot({ path: SHOTS + '/m-home3.png', fullPage: true });
    await pg.close();
  }
  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})();
