// Email signature logo upload: hosted path (needs `wrangler dev` on 8787) and fallback path (static server on 8765).
const { chromium } = require('playwright');
const fs = require('fs');
const WORKER = process.env.WORKER || 'http://localhost:8787', STATIC = process.env.BASE || 'http://localhost:8765';
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info).slice(0, 300)); } };
(async () => {
  const browser = await chromium.launch(), errors = [];
  const logo = fs.readFileSync('/tmp/logo.png');
  for (const [base, hosted] of [[WORKER, true], [STATIC, false]]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }), page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/email-signature-generator/');
    await page.fill('#name', 'Muhammad Asif'); await page.fill('#title', 'Director'); await page.fill('#company', 'KL Tech');
    await page.setInputFiles('#logo-file', [{ name: 'logo.png', mimeType: 'image/png', buffer: logo }]);
    await page.waitForFunction(() => /✓|embedded/.test(document.getElementById('logo-msg').textContent), null, { timeout: 15000 });
    const src = await page.getAttribute('#sig-preview img', 'src'), w = await page.getAttribute('#sig-preview img', 'width');
    if (hosted) {
      check('logo hosted URL used', /\/logo\/[0-9a-f]{32}\.png$/.test(src) && (await page.inputValue('#logo')) === src, src);
      const r = await page.request.get(src); check('hosted logo loads', r.status() === 200 && r.headers()['content-type'] === 'image/png');
      check('logo resized to ≤400px', await page.evaluate(async (s) => { const i = new Image(); i.src = s; await i.decode(); return i.naturalWidth <= 400; }, src));
      check('success message', (await page.textContent('#logo-msg')).includes('Gmail, Outlook and Apple Mail'));
      await page.selectOption('#logosize', '120'); check('logo size option', (await page.getAttribute('#sig-preview img', 'width')) === '120');
      await page.reload(); check('hosted logo remembered after reload', /\/logo\//.test(await page.getAttribute('#sig-preview img', 'src') || ''));
      check('remove button visible after reload', await page.isVisible('#logo-remove'));
      await page.screenshot({ path: '/home/claude/build/shots/signature-logo.png' });
    } else {
      check('fallback embeds logo as data URI', /^data:image\/png;base64,/.test(src) && w === '90', (src || '').slice(0, 40));
      check('fallback explains Gmail caveat', (await page.textContent('#logo-msg')).includes('Gmail may not show it'));
      await page.click('#logo-remove'); check('remove logo', !(await page.$('#sig-preview img')));
      await page.setInputFiles('#logo-file', [{ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }]);
      check('non-image rejected', (await page.textContent('#logo-msg')).includes('choose an image'));
    }
    await ctx.close();
  }
  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`); await browser.close(); process.exit(fail ? 1 : 0);
})();
