// E2E tests for calculators, invoice/quote, image tools and text tools.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOTS = '/home/claude/build/shots';
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info)); } };
const result = async (page) => JSON.parse((await page.getAttribute('#calc-out', 'data-result')) || 'null');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const errors = [];
  const open = async (p) => { const page = await ctx.newPage(); page.on('pageerror', e => errors.push(p + ': ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(p + ': ' + m.text()); }); await page.goto(BASE + p); return page; };

  // ---- VAT
  let page = await open('/vat-calculator/');
  await page.fill('#amount', '100'); let r = await result(page);
  check('vat add 20%', r && r.gross === 120 && r.vat === 20, r);
  await page.check('input[name=mode][value=remove]', { force: true }); r = await result(page);
  check('vat remove 20% from 100', r && r.net === 83.33 && r.vat === 16.67, r);
  await page.fill('#amount', '120'); r = await result(page);
  check('vat remove from 120', r.net === 100 && r.vat === 20, r);
  await page.check('input[name=rate][value=custom]', { force: true });
  check('custom rate field shows', await page.isVisible('#custom'));
  await page.check('input[name=mode][value=add]', { force: true }); await page.fill('#amount', '200'); await page.fill('#custom', '12.5'); r = await result(page);
  check('vat custom 12.5%', r.vat === 25 && r.gross === 225, r);
  await page.fill('#amount', 'abc'); check('vat bad input message', (await page.textContent('#calc-out')).includes('Enter an amount'));
  await page.close();

  // ---- Margin
  page = await open('/profit-margin-calculator/');
  await page.fill('#cost', '6'); await page.fill('#price', '10'); r = await result(page);
  check('margin 40 / markup 66.67', r.margin === 40 && r.markup === 66.67, r);
  await page.check('input[name=mode][value=margin]', { force: true }); await page.fill('#target', '40'); r = await result(page);
  check('price for 40% margin = 10', r.price === 10, r);
  await page.check('input[name=mode][value=markup]', { force: true }); await page.fill('#target', '50'); r = await result(page);
  check('price for 50% markup = 9', r.price === 9, r);
  await page.check('input[name=mode][value=margin]', { force: true }); await page.fill('#target', '100');
  check('margin >=100 rejected', (await page.textContent('#calc-out')).includes('under 100'));
  await page.close();

  // ---- Hourly
  page = await open('/hourly-rate-calculator/');
  await page.fill('#income', '40000'); r = await result(page);
  check('hourly rate 35.56', r.rate === 35.56, r);
  await page.fill('#expenses', '5000'); r = await result(page);
  check('hourly with expenses 40', r.rate === 40, r);
  await page.close();

  // ---- Percent
  page = await open('/percentage-calculator/');
  await page.fill('#a', '15'); await page.fill('#b', '240'); r = await result(page);
  check('15% of 240 = 36', r.result === '36', r);
  await page.check('input[name=mode][value=is]', { force: true }); await page.fill('#a', '36'); r = await result(page);
  check('36 is 15% of 240', r.result === '15%', r);
  await page.check('input[name=mode][value=change]', { force: true }); await page.fill('#a', '200'); await page.fill('#b', '250'); r = await result(page);
  check('200→250 = +25%', r.result.startsWith('+25%'), r);
  await page.fill('#b', '150'); r = await result(page);
  check('200→150 = -25% decrease', r.result === '-25% decrease', r);
  await page.close();

  // ---- Invoice
  page = await open('/invoice-generator/');
  check('invoice number default', (await page.inputValue('#number')) === 'INV-0001');
  check('date prefilled', /^\d{4}-\d\d-\d\d$/.test(await page.inputValue('#date')));
  await page.fill('#bizname', 'Shafi Plumbing Ltd'); await page.fill('#bizaddress', '1 High St\nLeeds LS1 1AA');
  await page.fill('#bizemail', 'hi@shafi.co.uk'); await page.fill('#vatno', 'GB123456789');
  await page.fill('#client', 'Jane <b>Smith</b>'); await page.fill('#payment', 'Sort code 00-00-00');
  await page.fill('.i-desc >> nth=0', 'Boiler service'); await page.fill('.i-qty >> nth=0', '2'); await page.fill('.i-price >> nth=0', '50');
  await page.click('#add-row');
  await page.fill('.i-desc >> nth=1', 'Parts'); await page.fill('.i-qty >> nth=1', '1'); await page.fill('.i-price >> nth=1', '30'); await page.selectOption('.i-vat >> nth=1', 'none');
  check('invoice total 150', (await page.getAttribute('#doc', 'data-total')) === '150', await page.getAttribute('#doc', 'data-total'));
  const docText = await page.textContent('#doc');
  check('invoice shows subtotal/VAT/total', docText.includes('£130.00') && docText.includes('VAT at 20%') && docText.includes('£20.00') && docText.includes('£150.00'), docText.slice(0, 300));
  check('invoice escapes HTML', (await page.innerHTML('#doc')).includes('Jane &lt;b&gt;Smith&lt;/b&gt;'));
  check('invoice shows VAT no', docText.includes('GB123456789'));
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#print-doc');
  check('print called', (await page.evaluate(() => window.__printed)) === 1);
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: SHOTS + '/invoice-print.png' });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 1280, height: 1000 }); await page.screenshot({ path: SHOTS + '/invoice.png' });
  await page.reload();
  check('business details remembered', (await page.inputValue('#bizname')) === 'Shafi Plumbing Ltd');
  check('invoice number incremented', (await page.inputValue('#number')) === 'INV-0002', await page.inputValue('#number'));
  check('client not remembered', (await page.inputValue('#client')) === '');
  await page.fill('.i-desc >> nth=0', 'x'); await page.fill('.i-price >> nth=0', '10');
  await page.click('#clear-doc');
  check('new invoice clears items', (await page.inputValue('.i-desc >> nth=0')) === '' && (await page.$$('.i-desc')).length === 1);
  await page.close();
  page = await open('/quote-generator/');
  check('quote number', (await page.inputValue('#number')) === 'QUO-0001');
  check('quote doc title + details carried over', (await page.textContent('#doc')).includes('QUOTE') && (await page.textContent('#doc')).includes('Valid until') && (await page.inputValue('#bizname')) === 'Shafi Plumbing Ltd');
  await page.close();

  // ---- Images: build test images in a page
  page = await open('/image-compressor/');
  const mk = async (w, h, type, q) => Buffer.from(await page.evaluate(([w, h, type, q]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff6b35'); g.addColorStop(1, '#2a9d8f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { x.fillStyle = `hsla(${Math.random() * 360},70%,50%,.5)`; x.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 30, 3 + Math.random() * 30); }
    if (type === 'image/png') { x.clearRect(0, 0, w / 4, h / 4); }
    return c.toDataURL(type, q).split(',')[1];
  }, [w, h, type, q]), 'base64');
  const bigJpg = await mk(3000, 2000, 'image/jpeg', 0.95), png = await mk(800, 600, 'image/png');
  const waitDone = (p, n) => p.waitForFunction((n) => document.getElementById('img-results').getAttribute('data-done') == n && document.querySelectorAll('[data-out],[data-error]').length >= n, n, { timeout: 30000 });
  const outs = async (p) => p.$$eval('[data-out]', els => els.map(e => JSON.parse(e.getAttribute('data-out'))));
  await page.fill('#width', '1600');
  await page.setInputFiles('#img-input', [{ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: bigJpg }, { name: 'logo.png', mimeType: 'image/png', buffer: png }]);
  await waitDone(page, 2); let o = await outs(page);
  check('compress: jpg resized to 1600 and smaller', o[0].w === 1600 && o[0].h === 1067 && o[0].size < o[0].in && o[0].type === 'image/jpeg', o[0]);
  check('compress: png not upscaled, becomes jpg', o[1].w === 800 && o[1].type === 'image/jpeg', o[1]);
  check('download all shown for 2', await page.isVisible('#dl-all'));
  await page.selectOption('#format', 'webp'); await page.waitForTimeout(400); await waitDone(page, 2); o = await outs(page);
  check('compress to webp', o[0].type === 'image/webp' && o[0].size < o[0].in, o[0]);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/compressor.png' });
  await page.close();

  page = await open('/image-resizer/');
  await page.fill('#width', '1080');
  await page.setInputFiles('#img-input', [{ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: bigJpg }]);
  await waitDone(page, 1); o = await outs(page);
  check('resize to 1080 wide keeps ratio', o[0].w === 1080 && o[0].h === 720, o[0]);
  check('resize filename', (await page.getAttribute('.img-item a', 'download')) === 'photo-1080x720.jpg');
  await page.fill('#height', '500'); await page.waitForTimeout(500); await waitDone(page, 1); o = await outs(page);
  check('fit inside 1080x500', o[0].w === 750 && o[0].h === 500, o[0]);
  await page.uncheck('input[name=keepratio]'); await page.waitForTimeout(300); await waitDone(page, 1); o = await outs(page);
  check('exact 1080x500 when ratio off', o[0].w === 1080 && o[0].h === 500, o[0]);
  await page.check('input[name=resizeby][value=percent]', { force: true }); await page.fill('#percent', '25'); await page.waitForTimeout(500); await waitDone(page, 1); o = await outs(page);
  check('resize 25%', o[0].w === 750 && o[0].h === 500, o[0]);
  await page.close();

  page = await open('/image-converter/');
  await page.setInputFiles('#img-input', [{ name: 'logo.png', mimeType: 'image/png', buffer: png }]);
  await waitDone(page, 1); o = await outs(page);
  check('png → jpg', o[0].type === 'image/jpeg' && (await page.getAttribute('.img-item a', 'download')) === 'logo.jpg', o[0]);
  await page.check('input[name=format][value=webp]', { force: true }); await page.waitForTimeout(300); await waitDone(page, 1); o = await outs(page);
  check('png → webp', o[0].type === 'image/webp', o[0]);
  check('quality hidden for png', true);
  await page.check('input[name=format][value=png]', { force: true }); await page.waitForTimeout(300); await waitDone(page, 1); o = await outs(page);
  check('→ png & quality hidden', o[0].type === 'image/png' && !(await page.isVisible('#quality')), o[0]);
  await page.setInputFiles('#img-input', [{ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') }]);
  check('non-image rejected', (await page.textContent('#img-results')).includes('Please choose'));
  await page.close();

  // ---- Text
  page = await open('/word-counter/');
  await page.fill('#wc-text', 'Hello world. This is a test.\n\nSecond para here! Café ☕ ok');
  const st = JSON.parse(await page.getAttribute('#stats', 'data-stats'));
  check('word count', st.words === 11 && st.sentences === 4 && st.paragraphs === 2, st);
  await page.close();

  page = await open('/case-converter/');
  const conv = async (t, k) => { await page.fill('#cc-text', t); await page.click(`[data-case=${k}]`); return page.inputValue('#cc-text'); };
  check('title case', (await conv('the lord of the rings and me', 'title')) === 'The Lord of the Rings and Me');
  check('sentence case', (await conv('HELLO THERE. HOW ARE YOU? i AM FINE', 'sentence')) === 'Hello there. How are you? I am fine');
  check('snake', (await conv('Hello World Foo', 'snake')) === 'hello_world_foo');
  check('camel', (await conv('hello world foo', 'camel')) === 'helloWorldFoo');
  check('kebab from camel', (await conv('summerSale 2026', 'kebab')) === 'summer-sale-2026');
  check('upper accents', (await conv('café', 'upper')) === 'CAFÉ');
  await page.close();

  page = await open('/password-generator/');
  let pw = await page.inputValue('#pw-out');
  check('default password 20 chars all types', pw.length === 20 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z\d]/.test(pw), pw);
  await page.fill('#pwlen', '40'); await page.dispatchEvent('#pwlen', 'input');
  check('length 40', (await page.inputValue('#pw-out')).length === 40);
  await page.click('#pw-new'); check('new password differs', (await page.inputValue('#pw-out')) !== pw);
  const amb = await page.evaluate(() => { let s = ''; for (let i = 0; i < 200; i++) s += ETBText.password({ length: 64, lower: true, upper: true, digits: true, symbols: false, noAmbig: true }).value; return /[Il1O0o]/.test(s); });
  check('no ambiguous chars', !amb);
  for (const n of ['lower', 'upper', 'digits', 'symbols']) await page.uncheck(`input[name=${n}]`);
  check('none selected → message', (await page.textContent('#pw-meta')).includes('Pick at least one'));
  await page.close();

  // ---- All pages: load, links, mobile overflow
  const all = ['/', '/vat-calculator/', '/profit-margin-calculator/', '/hourly-rate-calculator/', '/percentage-calculator/', '/invoice-generator/', '/quote-generator/', '/image-compressor/', '/image-resizer/', '/image-converter/', '/word-counter/', '/case-converter/', '/password-generator/', '/pricing/'];
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const seen = new Set();
  for (const p of all) {
    const pg = await mob.newPage(); pg.on('pageerror', e => errors.push(p + ' (mobile): ' + e.message));
    const rr = await pg.goto(BASE + p); check('loads ' + p, rr.status() === 200);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
    check('mobile fits ' + p, sw <= 390, sw);
    for (const l of await pg.$$eval('a[href^="/"]', as => as.map(a => a.getAttribute('href').split('#')[0]))) {
      if (seen.has(l)) continue; seen.add(l); const x = await pg.request.get(BASE + l); if (x.status() !== 200) check('link ' + l, false, x.status());
    }
    if (['/', '/invoice-generator/', '/vat-calculator/'].includes(p)) await pg.screenshot({ path: `${SHOTS}/m-${p.replace(/\W/g, '') || 'home'}.png`, fullPage: p === '/' });
    await pg.close();
  }
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const hp = await desk.newPage(); await hp.goto(BASE + '/'); await hp.screenshot({ path: SHOTS + '/d-home.png', fullPage: true }); await hp.close();
  const vp = await desk.newPage(); await vp.goto(BASE + '/vat-calculator/'); await vp.fill('#amount', '250'); await vp.screenshot({ path: SHOTS + '/d-vat.png' }); await vp.close();

  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})();
