// E2E tests for batch 2: PDF tools, money/date calculators, unit converter, barcode, email signature.
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOTS = process.env.SHOTS || '/tmp/shots';
const ZXING = fs.readFileSync(require.resolve('@zxing/library/umd/index.min.js'), 'utf8');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info)); } };

async function makePdf(prefix, n, size = [595.28, 841.89]) {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= n; i++) { const p = doc.addPage(size); p.drawText(prefix + i, { x: 72, y: size[1] - 100, size: 36, font }); }
  return Buffer.from(await doc.save());
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const errors = [];
  const open = async (p) => { const page = await ctx.newPage(); page.on('pageerror', e => errors.push(p + ': ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(p + ': ' + m.text()); }); await page.goto(BASE + p); return page; };
  const result = async (page) => JSON.parse((await page.getAttribute('#calc-out', 'data-result')) || 'null');
  const A = await makePdf('A', 3), B = await makePdf('B', 2);
  const pdfFile = (name, buffer) => ({ name, mimeType: 'application/pdf', buffer });

  // Inspect PDF outputs inside the page (pdf-lib is loaded there; pdf.js loaded on demand)
  const inspect = (page) => page.evaluate(async () => {
    const links = [...document.querySelectorAll('#pdf-out a[data-dl]')];
    const pdfjs = await import('/assets/vendor/pdf.min.mjs'); pdfjs.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdf.worker.min.mjs';
    const out = [];
    for (const a of links) {
      const buf = await (await fetch(a.href)).arrayBuffer();
      if (!a.download.endsWith('.pdf')) { out.push({ name: a.download, size: buf.byteLength }); continue; }
      const doc = await PDFLib.PDFDocument.load(buf);
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const texts = [];
      for (let i = 1; i <= pdf.numPages; i++) { const tc = await (await pdf.getPage(i)).getTextContent(); texts.push(tc.items.map(t => t.str).join(' ').trim()); }
      out.push({ name: a.download, pages: doc.getPageCount(), rot: doc.getPages().map(p => p.getRotation().angle), sizes: doc.getPages().map(p => [Math.round(p.getWidth()), Math.round(p.getHeight())]), texts });
    }
    return out;
  });
  const run = async (page) => { await page.click('#run'); await page.waitForFunction(() => { const o = document.getElementById('pdf-out'); return o.hasAttribute('data-done') || o.hasAttribute('data-error') || document.getElementById('pdf-msg').textContent; }, null, { timeout: 60000 }); };
  const reset = (page) => page.evaluate(() => { const o = document.getElementById('pdf-out'); o.removeAttribute('data-done'); o.removeAttribute('data-error'); });

  // ---- Merge
  let page = await open('/merge-pdf/');
  check('merge button disabled initially', await page.isDisabled('#run'));
  await page.setInputFiles('#pdf-input', [pdfFile('a.pdf', A), pdfFile('b.pdf', B)]);
  await page.waitForFunction(() => document.querySelectorAll('.file-row').length === 2 && /3 pages/.test(document.getElementById('file-list').textContent));
  await run(page); let r = await inspect(page);
  check('merge 5 pages in order', r[0].pages === 5 && r[0].texts.join(',') === 'A1,A2,A3,B1,B2', r[0]);
  await page.click('[data-down="0"]'); await reset(page); await run(page); r = await inspect(page);
  check('merge reordered', r[0].texts.join(',') === 'B1,B2,A1,A2,A3', r[0].texts);
  await page.close();

  // ---- Split
  page = await open('/split-pdf/');
  await page.setInputFiles('#pdf-input', [pdfFile('report.pdf', A)]);
  await page.fill('#pages', '3, 1'); await run(page); r = await inspect(page);
  check('extract 3,1 in order', r[0].pages === 2 && r[0].texts.join(',') === 'A3,A1' && r[0].name === 'report-extracted.pdf', r[0]);
  await page.check('input[name=splitmode][value=remove]', { force: true }); await page.fill('#pages', '2'); await reset(page); await run(page); r = await inspect(page);
  check('remove page 2', r[0].texts.join(',') === 'A1,A3', r[0].texts);
  await page.check('input[name=splitmode][value=every]', { force: true }); await reset(page); await run(page); r = await inspect(page);
  check('split every page → 3 files', r.length === 3 && r[2].texts[0] === 'A3' && r[0].name === 'report-page-1.pdf', r.map(x => x.name));
  await page.check('input[name=splitmode][value=extract]', { force: true }); await page.fill('#pages', '7'); await reset(page); await run(page);
  check('bad range message', (await page.textContent('#pdf-msg')).includes('between 1 and 3'));
  await page.setInputFiles('#pdf-input', [{ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') }]);
  check('non-pdf rejected', (await page.textContent('#pdf-msg')).includes('choose a PDF'));
  await page.setInputFiles('#pdf-input', [pdfFile('fake.pdf', Buffer.from('not a pdf'))]); await page.fill('#pages', '1'); await reset(page); await run(page);
  check('invalid pdf message', (await page.textContent('#pdf-msg')).includes("isn't a valid PDF"));
  await page.close();

  // ---- Rotate
  page = await open('/rotate-pdf/');
  await page.setInputFiles('#pdf-input', [pdfFile('a.pdf', A)]); await run(page); r = await inspect(page);
  check('rotate all 90', r[0].rot.join(',') === '90,90,90', r[0].rot);
  await page.check('input[name=which][value=some]', { force: true }); await page.check('input[name=angle][value="180"]', { force: true }); await page.fill('#pages', '2'); await reset(page); await run(page); r = await inspect(page);
  check('rotate page 2 by 180', r[0].rot.join(',') === '0,180,0', r[0].rot);
  await page.close();

  // ---- Page numbers
  page = await open('/add-page-numbers-to-pdf/');
  await page.setInputFiles('#pdf-input', [pdfFile('a.pdf', A)]); await page.selectOption('#format', 'of'); await run(page); r = await inspect(page);
  check('page numbers "Page 2 of 3"', r[0].texts[1].includes('Page 2 of 3') && r[0].texts[2].includes('Page 3 of 3'), r[0].texts);
  await page.check('input[name=skipfirst]'); await page.selectOption('#format', 'plain'); await reset(page); await run(page); r = await inspect(page);
  check('skip cover numbering', r[0].texts[0] === 'A1' && /A2\s*1|1\s*A2/.test(r[0].texts[1]), r[0].texts);
  await page.close();

  // ---- Images → PDF
  page = await open('/jpg-to-pdf/');
  const mk = async (w, h, type) => Buffer.from(await page.evaluate(([w, h, type]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(10, 10, w / 2, h / 2); return c.toDataURL(type, 0.9).split(',')[1]; }, [w, h, type]), 'base64');
  const wide = await mk(1600, 900, 'image/jpeg'), tall = await mk(600, 900, 'image/png'), webp = await mk(400, 400, 'image/webp');
  await page.setInputFiles('#pdf-input', [{ name: 'wide.jpg', mimeType: 'image/jpeg', buffer: wide }, { name: 'tall.png', mimeType: 'image/png', buffer: tall }, { name: 's.webp', mimeType: 'image/webp', buffer: webp }]);
  await run(page); r = await inspect(page);
  check('3 images → 3 A4 pages (auto orientation)', r[0].pages === 3 && r[0].sizes[0].join('x') === '842x595' && r[0].sizes[1].join('x') === '595x842', r[0].sizes);
  await page.selectOption('#pagesize', 'fit'); await reset(page); await run(page); r = await inspect(page);
  check('fit page size', r[0].sizes[0].join('x') === '1636x936', r[0].sizes);
  await page.close();

  // ---- PDF → images
  page = await open('/pdf-to-jpg/');
  await page.setInputFiles('#pdf-input', [pdfFile('a.pdf', A)]); await run(page);
  const imgs = await page.$$eval('#pdf-out [data-out]', els => els.map(e => JSON.parse(e.getAttribute('data-out'))));
  const dims = await page.$$eval('#pdf-out .img-info .muted', els => els.map(e => e.textContent));
  check('pdf → 3 jpgs at 2x', imgs.length === 3 && imgs.every(i => i.mime === 'image/jpeg' && i.size > 5000) && dims[0].includes('1190×1683'), { imgs, dims });
  await page.selectOption('#imgformat', 'png'); await page.selectOption('#scale', '1'); await reset(page); await run(page);
  const pngs = await page.$$eval('#pdf-out [data-out]', els => els.map(e => JSON.parse(e.getAttribute('data-out'))));
  check('pdf → png 1x', pngs[0].mime === 'image/png' && pngs[0].name === 'a-page-1.png', pngs[0]);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/pdf2jpg.png' });
  await page.close();

  // ---- Take-home pay
  page = await open('/take-home-pay-calculator/');
  await page.fill('#pension', '0');
  await page.fill('#salary', '40000'); r = await result(page);
  check('40k rUK net 32319.60', r.net === 32319.6 && r.tax === 5486 && r.ni === 2194.4, r);
  await page.fill('#salary', '30000'); r = await result(page);
  check('30k rUK net 25119.60 (matches FAQ)', r.net === 25119.6, r);
  await page.check('input[name=region][value=scotland]', { force: true }); r = await result(page);
  check('30k Scotland tax 3451.07', r.tax === 3451.07, r);
  await page.check('input[name=region][value=ruk]', { force: true });
  await page.fill('#salary', '110000'); r = await result(page);
  check('110k PA taper', r.pa === 7570 && r.tax === 33432 && r.ni === 4210.6, r);
  await page.fill('#salary', '150000'); r = await result(page);
  check('150k additional rate', r.pa === 0 && r.tax === 53703, r);
  await page.fill('#salary', '40000'); await page.selectOption('#loan', 'plan2'); r = await result(page);
  check('plan 2 loan 955.35', r.sl === 955.35, r);
  await page.selectOption('#loan', 'none'); await page.fill('#pension', '5'); r = await result(page);
  check('5% net-pay pension', r.pension === 2000 && r.tax === 5086 && r.ni === 2194.4, r);
  await page.selectOption('#sacrifice', 'yes'); r = await result(page);
  check('salary sacrifice reduces NI', r.ni === 2034.4, r);
  await page.check('input[name=period][value=month]', { force: true }); await page.fill('#salary', '3000'); r = await result(page);
  check('monthly input → 36000 gross', r.gross === 36000, r);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/takehome.png' });
  await page.close();

  // ---- Mileage
  page = await open('/mileage-allowance-calculator/');
  await page.fill('#miles', '12000'); r = await result(page);
  check('12000 miles = £6000', r.allowance === 6000, r);
  await page.fill('#paid', '30'); r = await result(page);
  check('MAR claim 2400', r.claim === 2400, r);
  await page.fill('#paid', ''); await page.fill('#prior', '9000'); await page.fill('#miles', '2000'); r = await result(page);
  check('crosses 10k threshold = £800', r.allowance === 800, r);
  await page.check('input[name=vehicle][value=bicycle]', { force: true }); r = await result(page);
  check('bicycle 20p', r.allowance === 400, r);
  await page.close();

  // ---- Loan / mortgage / compound / discount
  page = await open('/loan-calculator/');
  await page.fill('#amount', '10000'); await page.fill('#apr', '6.9'); r = await result(page);
  check('loan 196.56/month', r.monthly === 196.56 && r.total === 11793.43, r); await page.close();
  page = await open('/mortgage-calculator/');
  await page.fill('#price', '280000'); await page.fill('#deposit', '28000'); await page.fill('#rate', '4.5'); r = await result(page);
  check('mortgage 1400.70, LTV 90', r.monthly === 1400.7 && r.ltv === 90, r);
  await page.check('input[name=mtype][value=interest]', { force: true }); r = await result(page);
  check('interest only 945', r.monthly === 945, r); await page.close();
  page = await open('/compound-interest-calculator/');
  await page.fill('#initial', '1000'); await page.fill('#rate', '12'); await page.fill('#years', '1'); r = await result(page);
  check('compound monthly 1126.83', r.balance === 1126.83, r);
  await page.selectOption('#compounding', 'yearly'); r = await result(page);
  check('compound yearly 1120', r.balance === 1120, r); await page.close();
  page = await open('/discount-calculator/');
  await page.fill('#price', '80'); await page.fill('#off', '25'); await page.fill('#extra', '10'); r = await result(page);
  check('discount stack 54', r.sale === 54, r);
  await page.check('input[name=mode][value=find]', { force: true }); await page.fill('#sale', '60'); r = await result(page);
  check('find 25% off', r.pct === 25, r); await page.close();

  // ---- Dates
  page = await open('/age-calculator/');
  check('age "on" defaults to today', /^\d{4}-\d\d-\d\d$/.test(await page.inputValue('#on')));
  await page.fill('#dob', '1990-05-15'); await page.fill('#on', '2026-11-02'); r = await result(page);
  check('age 36y 5m 18d', r.years === 36 && r.months === 5 && r.days === 18, r);
  await page.fill('#dob', '2000-02-29'); await page.fill('#on', '2026-03-01'); r = await result(page);
  check('leap birthday', r.years === 26 && (await page.textContent('#calc-out')).includes('Today'), r);
  await page.close();
  page = await open('/days-between-dates/');
  await page.fill('#start', '2026-12-21'); await page.fill('#end', '2027-01-04'); r = await result(page);
  check('Christmas working days', r.days === 14 && r.workdays === 7 && r.holidays === 3, r);
  await page.check('input[name=mode][value=add]', { force: true }); await page.fill('#n', '10'); await page.selectOption('#unit', 'workdays'); r = await result(page);
  check('+10 working days → 2027-01-07', r.date === '2027-01-07', r);
  await page.fill('#start', '2026-01-31'); await page.fill('#n', '1'); await page.selectOption('#unit', 'months'); r = await result(page);
  check('31 Jan + 1 month → 28 Feb', r.date === '2026-02-28', r);
  await page.close();

  // ---- Units
  page = await open('/unit-converter/');
  const conv = async (cat, from, to, v) => { await page.selectOption('#cat', cat); await page.selectOption('#from', from); await page.selectOption('#to', to); await page.fill('#value', String(v)); return JSON.parse(await page.getAttribute('#unit-out', 'data-result')).value; };
  check('100 C = 212 F', Math.abs(await conv('temperature', 'c', 'f', 100) - 212) < 1e-9);
  check('1 stone = 6.35 kg', Math.abs(await conv('weight', 'st', 'kg', 1) - 6.35029318) < 1e-9);
  check('1 mile = 1.609344 km', Math.abs(await conv('length', 'mi', 'km', 1) - 1.609344) < 1e-12);
  check('30 mpg UK = 9.416 L/100km', Math.abs(await conv('fuel', 'mpg', 'l100', 30) - 9.4162) < 0.001);
  check('1 UK pint = 568.26 ml', Math.abs(await conv('volume', 'pt', 'ml', 1) - 568.26125) < 1e-9);
  await page.click('#swap'); check('swap works', (await page.inputValue('#from')) === 'ml');
  await page.close();

  // ---- Barcodes (decoded with ZXing)
  page = await open('/barcode-generator/');
  await page.addScriptTag({ content: ZXING });
  const decode = () => page.evaluate(() => {
    const c = document.getElementById('bc-img'); if (!c) return null;
    const src = new ZXing.HTMLCanvasElementLuminanceSource(c), bmp = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src));
    try { const res = new ZXing.MultiFormatReader().decode(bmp); return { text: res.getText(), fmt: ZXing.BarcodeFormat[res.getBarcodeFormat()] }; } catch (e) { return { err: String(e) }; }
  });
  await page.fill('#data', 'SKU-10045'); let bc = await decode();
  check('Code 128 text decodes', bc && bc.text === 'SKU-10045' && bc.fmt === 'CODE_128', bc);
  await page.fill('#data', '12345678'); bc = await decode();
  check('Code 128 set C decodes', bc && bc.text === '12345678', bc);
  await page.selectOption('#btype', 'ean13'); await page.fill('#data', '501234567890'); bc = await decode();
  check('EAN-13 with check digit decodes', bc && bc.text === '5012345678900' && bc.fmt === 'EAN_13', bc);
  await page.fill('#data', '5012345678901');
  check('wrong check digit warns', (await page.textContent('#bc-warn')).includes('check digit should be 0'));
  await page.selectOption('#btype', 'upca'); await page.fill('#data', '03600029145'); bc = await decode();
  check('UPC-A decodes', bc && (bc.text === '036000291452') && bc.fmt === 'UPC_A', bc);
  await page.selectOption('#module', '2'); bc = await decode(); check('thin bars still decode', bc && bc.text === '036000291452', bc);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bc-svg')]);
  check('barcode svg download', dl.suggestedFilename() === 'barcode.svg');
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/barcode.png' });
  await page.close();

  // ---- Signature
  page = await open('/email-signature-generator/');
  await page.fill('#name', 'Asif <Shafi>'); await page.fill('#title', 'Director'); await page.fill('#company', 'etoolbox');
  await page.fill('#email', 'hello@etoolbox.co.uk'); await page.fill('#website', 'etoolbox.co.uk'); await page.fill('#phone', '0113 496 0000');
  let html = await page.innerHTML('#sig-preview');
  check('signature escapes + links', html.includes('Asif &lt;Shafi&gt;') && html.includes('href="https://etoolbox.co.uk"') && html.includes('href="tel:01134960000"') && html.includes('mailto:hello@etoolbox.co.uk'), html.slice(0, 200));
  await page.fill('#website', 'javascript:alert(1)'); html = await page.innerHTML('#sig-preview');
  check('rejects javascript: urls', !html.includes('javascript:'));
  await page.selectOption('#layout', 'stacked'); check('stacked layout', (await page.innerHTML('#sig-preview')).includes('border-top:3px'));
  await page.reload(); check('signature remembered', (await page.inputValue('#name')) === 'Asif <Shafi>');
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/signature.png' });
  await page.close();

  // ---- All new pages: load, mobile fit, links
  const all = ['/', '/merge-pdf/', '/split-pdf/', '/jpg-to-pdf/', '/pdf-to-jpg/', '/rotate-pdf/', '/add-page-numbers-to-pdf/', '/take-home-pay-calculator/', '/mileage-allowance-calculator/', '/loan-calculator/', '/mortgage-calculator/', '/compound-interest-calculator/', '/discount-calculator/', '/age-calculator/', '/days-between-dates/', '/unit-converter/', '/barcode-generator/', '/email-signature-generator/'];
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const seen = new Set();
  for (const p of all) {
    const pg = await mob.newPage(); pg.on('pageerror', e => errors.push(p + ' (mobile): ' + e.message));
    const rr = await pg.goto(BASE + p); check('loads ' + p, rr.status() === 200);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth); check('mobile fits ' + p, sw <= 390, sw);
    for (const l of await pg.$$eval('a[href^="/"]', as => as.map(a => a.getAttribute('href').split('#')[0]))) { if (seen.has(l)) continue; seen.add(l); const x = await pg.request.get(BASE + l); if (x.status() !== 200) check('link ' + l, false, x.status()); }
    if (p === '/' || p === '/take-home-pay-calculator/') await pg.screenshot({ path: `${SHOTS}/m${p.replace(/\W/g, '') || 'home'}.png`, fullPage: p === '/' });
    await pg.close();
  }
  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})();
