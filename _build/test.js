// End-to-end test: fill each generator, decode the rendered canvas with jsQR, check payloads, downloads, console errors.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const JSQR = fs.readFileSync('/home/claude/vendor/node_modules/jsqr/dist/jsQR.js', 'utf8');
const BASE = 'http://localhost:8765';
const SHOTS = '/home/claude/build/shots';
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, info) { if (ok) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, info || ''); } }

async function decode(page, sel = '#qr-canvas') {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel);
    if (!c || c.hidden) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    const r = jsQR(d.data, d.width, d.height);
    return r ? r.data : null;
  }, sel);
}

const cases = [
  { name: 'url adds https', p: '/qr-code-generator/', fill: { '#url': 'example.co.uk/menu' }, expect: 'https://example.co.uk/menu' },
  { name: 'url plain text', p: '/qr-code-generator/', fill: { '#url': 'Hello café ☕ world' }, expect: 'Hello café ☕ world' },
  { name: 'url keeps scheme', p: '/qr-code-generator/', fill: { '#url': 'http://a.com/x?y=1&z=2' }, expect: 'http://a.com/x?y=1&z=2' },
  { name: 'wifi WPA escaping', p: '/wifi-qr-code-generator/', fill: { '#ssid': 'Cafe;Guest', '#password': 'p:a,ss"w\\d' }, expect: 'WIFI:T:WPA;S:Cafe\\;Guest;P:p\\:a\\,ss\\"w\\\\d;;' },
  { name: 'wifi open hidden', p: '/wifi-qr-code-generator/', fill: { '#ssid': 'Open' }, select: { '#security': 'nopass' }, checkHidden: true, expect: 'WIFI:T:nopass;S:Open;H:true;;' },
  { name: 'whatsapp uk number + msg', p: '/whatsapp-qr-code-generator/', fill: { '#phone': '07700 900123', '#message': "Hi! I'd like to order" }, expect: 'https://wa.me/447700900123?text=Hi!%20I\'d%20like%20to%20order' },
  { name: 'whatsapp intl', p: '/whatsapp-qr-code-generator/', fill: { '#phone': '+1 (555) 010-9999' }, expect: 'https://wa.me/15550109999' },
  { name: 'menu', p: '/menu-qr-code-generator/', fill: { '#url': 'cornercafe.co.uk/menu', '#business': 'The Corner Café', '#caption': 'Free Wi-Fi: ask at the counter' }, expect: 'https://cornercafe.co.uk/menu', card: true },
  { name: 'vcard', p: '/vcard-qr-code-generator/', fill: { '#first': 'Asif', '#last': 'Shafi', '#org': 'Shafi, Sons; Ltd', '#phone': '07700 900123', '#email': 'a@b.co.uk', '#website': 'b.co.uk', '#street': '1 High St', 'input[name=city]': 'Leeds', 'input[name=postcode]': 'LS1 1AA' },
    expect: 'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Shafi;Asif;;;\r\nFN:Asif Shafi\r\nORG:Shafi\\, Sons\\; Ltd\r\nTEL;TYPE=CELL:07700 900123\r\nEMAIL:a@b.co.uk\r\nURL:https://b.co.uk\r\nADR;TYPE=WORK:;;1 High St;Leeds;;LS1 1AA;\r\nEND:VCARD' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const errors = [];

  for (const c of cases) {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(c.name + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(c.name + ': ' + m.text()); });
    await page.goto(BASE + c.p);
    await page.addScriptTag({ content: JSQR });
    check(c.name + ' empty state', await page.isVisible('#qr-empty'));
    for (const [sel, val] of Object.entries(c.select || {})) await page.selectOption(sel, val);
    for (const [sel, val] of Object.entries(c.fill)) await page.fill(sel, val);
    if (c.checkHidden) await page.check('input[name=hidden]');
    await page.waitForTimeout(300);
    const payload = await page.getAttribute('#qr-canvas', 'data-payload');
    check(c.name + ' payload', payload === c.expect, JSON.stringify({ payload, expect: c.expect }));
    const decoded = await decode(page);
    check(c.name + ' decodes', decoded === c.expect, JSON.stringify(decoded));

    // PNG download
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dl-png')]);
    const f = path.join(SHOTS, c.name.replace(/\W+/g, '_') + '.png'); await dl.saveAs(f);
    check(c.name + ' png download', dl.suggestedFilename().endsWith('.png') && fs.statSync(f).size > 1000);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#dl-svg')]);
    const sf = path.join(SHOTS, 'x.svg'); await dl2.saveAs(sf);
    check(c.name + ' svg download', fs.readFileSync(sf, 'utf8').startsWith('<svg'));
    if (c.card) {
      const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('#dl-card')]);
      await dl3.saveAs(path.join(SHOTS, 'table-card.png'));
      check('menu card download', fs.statSync(path.join(SHOTS, 'table-card.png')).size > 10000);
    }
    await page.close();
  }

  // Downloaded PNG at 2048 decodes (test via page decode of an image)
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/qr-code-generator/');
    await page.addScriptTag({ content: JSQR });
    await page.fill('#url', 'etoolbox.co.uk');
    await page.click('summary');
    await page.selectOption('#size', '2048'); await page.selectOption('#ecc', 'H');
    await page.waitForTimeout(200);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dl-png')]);
    const f = path.join(SHOTS, 'big.png'); await dl.saveAs(f);
    const b64 = fs.readFileSync(f).toString('base64');
    const res = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height); const r = jsQR(d.data, d.width, d.height);
      return { w: img.width, data: r && r.data };
    }, b64);
    check('2048px PNG decodes', res.w === 2048 && res.data === 'https://etoolbox.co.uk', JSON.stringify(res));
    // Table card decode
    const cb64 = fs.readFileSync(path.join(SHOTS, 'table-card.png')).toString('base64');
    const cres = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height); const r = jsQR(d.data, d.width, d.height);
      return r && r.data;
    }, cb64);
    check('table card QR decodes', cres === 'https://cornercafe.co.uk/menu', cres);
    // Contrast warning
    await page.fill('input[name=fg]', '#ffffff'); await page.dispatchEvent('input[name=fg]', 'change');
    check('contrast warning shown', (await page.textContent('#qr-warn')).length > 10);
    // Validation message
    await page.fill('#url', ''); await page.waitForTimeout(300);
    check('empty input shows error', (await page.textContent('#qr-warn')).includes('Enter'));
    await page.close();
  }

  // Pricing links fall back to mailto; all pages load without errors; screenshots
  const pages = ['/', '/pricing/', '/qr-code-generator/', '/menu-qr-code-generator/', '/wifi-qr-code-generator/', '/vcard-qr-code-generator/', '/whatsapp-qr-code-generator/', '/privacy/', '/terms/'];
  for (const p of pages) {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(p + ': ' + e.message));
    const r = await page.goto(BASE + p);
    check('loads ' + p, r.status() === 200);
    // internal links resolve
    const links = await page.$$eval('a[href^="/"]', as => [...new Set(as.map(a => a.getAttribute('href').split('#')[0]))]);
    for (const l of links) { const rr = await page.request.get(BASE + l); if (rr.status() !== 200) check('link ' + l + ' on ' + p, false, rr.status()); }
    if (p === '/pricing/') {
      const href = await page.getAttribute('[data-plan=monthly]', 'href');
      check('pro button mailto fallback', href.startsWith('mailto:hello@etoolbox.co.uk'), href);
    }
    await page.close();
  }

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const [p, n] of [['/', 'home'], ['/menu-qr-code-generator/', 'menu'], ['/pricing/', 'pricing']]) {
    const page = await mobile.newPage(); await page.goto(BASE + p);
    if (n === 'menu') { await page.fill('#url', 'cornercafe.co.uk/menu'); await page.fill('#business', 'The Corner Café'); await page.waitForTimeout(300); }
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check('no horizontal scroll on mobile ' + p, sw <= 390, sw);
    await page.screenshot({ path: `${SHOTS}/mobile-${n}.png`, fullPage: true }); await page.close();
  }
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  for (const [p, n] of [['/', 'home'], ['/menu-qr-code-generator/', 'menu']]) {
    const page = await desk.newPage(); await page.goto(BASE + p);
    if (n === 'menu') { await page.fill('#url', 'cornercafe.co.uk/menu'); await page.fill('#business', 'The Corner Café'); await page.waitForTimeout(300); }
    await page.screenshot({ path: `${SHOTS}/desktop-${n}.png`, fullPage: n === 'home' }); await page.close();
  }

  check('no JS errors', errors.length === 0, errors.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
