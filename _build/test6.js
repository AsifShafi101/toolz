// E2E tests for batch 4 (advanced tools) + platform features. Uses fake camera/mic and mocked network APIs.
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
const SHOTS = process.env.SHOTS || '/tmp/shots';
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info).slice(0, 500)); } };

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ acceptDownloads: true, permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'] });
  const errors = [];
  // Mock external APIs that the sandbox can't reach
  await ctx.route('https://api.frankfurter.dev/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ amount: 1, base: 'EUR', date: '2026-11-02', rates: { GBP: 0.85, USD: 1.1, TRY: 40 } }) }));
  const open = async (p) => { const page = await ctx.newPage(); page.on('pageerror', e => errors.push(p + ': ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text())) errors.push(p + ': ' + m.text()); }); await page.goto(BASE + p); return page; };
  const attr = async (page, sel, a = 'data-result') => JSON.parse((await page.getAttribute(sel, a)) || 'null');

  // ---------- Platform ----------
  let page = await open('/');
  await page.fill('#tool-search', 'pdf comp'); let first = await page.textContent('#search-results li:first-child strong');
  check('search "pdf comp" → Compress PDF', first === 'Compress PDF', first);
  await page.fill('#tool-search', 'gps photo'); first = await page.textContent('#search-results li:first-child strong');
  check('synonym search "gps photo"', /metadata/i.test(first), first);
  await page.fill('#tool-search', 'zzzzqqq'); check('no results message', (await page.textContent('#search-results')).includes('No tools match'));
  await page.fill('#tool-search', 'vat'); await page.press('#tool-search', 'Enter'); await page.waitForURL('**/vat-calculator/');
  check('Enter opens top result', page.url().endsWith('/vat-calculator/'));
  await page.click('.fav-btn'); check('favourite toggled', (await page.getAttribute('.fav-btn', 'aria-pressed')) === 'true');
  await page.goto(BASE + '/');
  check('favourites + recent on homepage', (await page.textContent('#favourites')).includes('VAT calculator') && (await page.textContent('#recent')).includes('VAT calculator'));
  await page.keyboard.press('/'); check('"/" focuses search', await page.evaluate(() => document.activeElement.id === 'tool-search'));
  await page.click('#theme-toggle'); check('dark mode on', (await page.getAttribute('html', 'data-theme')) === 'dark');
  await page.reload(); check('dark mode remembered', (await page.getAttribute('html', 'data-theme')) === 'dark');
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/dark-home.png' });
  await page.goto(BASE + '/budget-planner/'); await page.screenshot({ path: SHOTS + '/dark-budget.png' });
  await page.click('#theme-toggle'); check('back to light', (await page.getAttribute('html', 'data-theme')) === 'light');
  await page.close();

  // ---------- Batch renamer ----------
  page = await open('/batch-file-renamer/');
  const f = (name, body) => ({ name, mimeType: 'application/octet-stream', buffer: Buffer.from(body) });
  await page.setInputFiles('#rn-input', [f('IMG_002.JPG', 'b'), f('IMG_001.JPG', 'a'), f('My Notes.TXT', 'c')]);
  await page.fill('#template', 'Holiday-{n}'); await page.selectOption('#extcase', 'lower');
  let names = await attr(page, '#rn-list', 'data-names');
  check('renamer pattern + numbering', JSON.stringify(names) === JSON.stringify(['Holiday-001.jpg', 'Holiday-002.jpg', 'Holiday-003.txt']), names);
  await page.fill('#template', ''); await page.fill('#find', 'img_'); await page.fill('#replace', 'Photo '); await page.selectOption('#spaces', 'dash');
  names = await attr(page, '#rn-list', 'data-names'); check('find/replace + spaces', names[0] === 'Photo-001.jpg' && names[2] === 'My-Notes.txt', names);
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rn-zip')]);
  const zipBytes = fs.readFileSync(await dl.path());
  const zipNames = await page.evaluate((b) => Object.keys(fflate.unzipSync(new Uint8Array(b))), [...zipBytes]);
  check('zip contains renamed copies', zipNames.sort().join() === 'My-Notes.txt,Photo-001.jpg,Photo-002.jpg', zipNames);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rn-script')]);
  const bat = fs.readFileSync(await dl.path(), 'utf8'); check('Windows rename script', bat.includes('ren "IMG_001.JPG" "Photo-001.jpg"'), bat);
  await page.selectOption('#os', 'unix'); [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rn-script')]);
  check('Unix script quoting', fs.readFileSync(await dl.path(), 'utf8').includes("mv -n -- 'My Notes.TXT' 'My-Notes.txt'"));
  await page.check('input[name=regex]'); await page.fill('#find', '(');
  check('bad regex message', (await page.textContent('#rn-msg')).includes('regular expression'));
  await page.close();

  // ---------- Duplicate finder ----------
  page = await open('/duplicate-file-finder/');
  await page.setInputFiles('#dup-files', [f('a.txt', 'hello world'), f('copy of a.txt', 'hello world'), f('b.txt', 'hello there'), f('c.bin', 'x'.repeat(5000)), f('c2.bin', 'x'.repeat(5000)), f('c3.bin', 'x'.repeat(5000))]);
  await page.waitForSelector('#dup-out[data-groups]');
  check('duplicate groups found', (await page.getAttribute('#dup-out', 'data-groups')) === '2' && (await page.getAttribute('#dup-out', 'data-wasted')) === String(5000 * 2 + 11), [await page.getAttribute('#dup-out', 'data-groups'), await page.getAttribute('#dup-out', 'data-wasted')]);
  check('CSV button shown', await page.isVisible('#dup-csv'));
  await page.close();

  // ---------- Checksum ----------
  page = await open('/file-checksum/');
  await page.setInputFiles('#ck-input', [f('abc.txt', 'abc')]); await page.waitForSelector('#ck-out[data-sha256]');
  const ck = await page.textContent('#ck-out');
  check('MD5 + SHA-256 correct', ck.includes('900150983cd24fb0d6963f7d28e17f72') && ck.includes('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'), ck);
  await page.fill('#expected', 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'); check('checksum match', (await page.textContent('#ck-match')).includes('Match'));
  await page.fill('#expected', 'deadbeef'); check('checksum mismatch', (await page.textContent('#ck-match')).includes('No match'));
  const md5big = await page.evaluate(() => ETBFiles.md5(new TextEncoder().encode('The quick brown fox jumps over the lazy dog').buffer));
  check('MD5 multi-block', md5big === '9e107d9d372bb6826bd81d3542a419d6', md5big);
  await page.close();

  // ---------- Compare documents ----------
  page = await open('/compare-documents/');
  await page.fill('#text-a', 'The rent is £800 per month.\nThe tenant pays council tax.\nPets are not allowed.');
  await page.fill('#text-b', 'The rent is £850 per month.\nThe tenant pays council tax.\nPets are allowed with permission.');
  await page.waitForTimeout(600); let r = await attr(page, '#cmp-out');
  check('diff counts', r && r.added === 4 && r.removed === 3, r);
  check('diff markup', (await page.innerHTML('#cmp-out')).includes('<del>£800</del><ins>£850</ins>'), await page.innerHTML('#cmp-out'));
  const mkPdf = async (lines) => { const d = await PDFDocument.create(), fo = await d.embedFont(StandardFonts.Helvetica), p = d.addPage([595, 842]); lines.forEach((l, i) => p.drawText(l, { x: 72, y: 760 - i * 40, size: 12, font: fo })); return Buffer.from(await d.save()); };
  await page.setInputFiles('#file-a', [{ name: 'v1.pdf', mimeType: 'application/pdf', buffer: await mkPdf(['Payment is due within 30 days.', 'Late fees apply.']) }]);
  await page.setInputFiles('#file-b', [{ name: 'v2.docx', mimeType: 'application/octet-stream', buffer: fs.readFileSync('/tmp/report.docx') }]);
  await page.waitForFunction(() => /words/.test(document.getElementById('name-b').textContent) && /words/.test(document.getElementById('name-a').textContent), null, { timeout: 20000 });
  check('PDF + DOCX text extracted', (await page.inputValue('#text-a')).includes('Payment is due within 30 days.') && (await page.inputValue('#text-b')).includes('Quarterly Report'));
  await page.close();

  // ---------- OCR (real Tesseract, local files) ----------
  page = await open('/image-to-text/');
  const img = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1000; c.height = 260; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1000, 260); x.fillStyle = '#000'; x.font = '56px Arial'; x.fillText('Invoice total 245.50', 40, 100); x.fillText('Thank you etoolbox', 40, 200); return Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0)); }));
  await page.setInputFiles('#ocr-input', [{ name: 'shot.png', mimeType: 'image/png', buffer: img }]);
  await page.waitForSelector('form[data-ocr][data-done]', { timeout: 120000 }).catch(() => {});
  const ocr = await page.inputValue('#ocr-text');
  check('OCR reads text', /Invoice total 245\.50/.test(ocr) && /etoolbox/i.test(ocr), { ocr, status: await page.textContent('#ocr-status') });
  await page.close();

  // ---------- Invoice extractor ----------
  page = await open('/invoice-data-extractor/');
  const inv = await mkPdf(['Shafi Plumbing Ltd', 'INVOICE', 'Invoice No: INV-0042', 'Invoice Date: 12/10/2026', 'Due Date: 26/10/2026', 'Subtotal £1,250.00', 'VAT 20% £250.00', 'Total due £1,500.00', 'VAT Reg No: GB 123 4567 89', 'Sort code: 12-34-56   Account number: 12345678', 'accounts@shafi.co.uk']);
  await page.setInputFiles('#inv-input', [{ name: 'inv42.pdf', mimeType: 'application/pdf', buffer: inv }]);
  await page.waitForSelector('#inv-table[data-rows]', { timeout: 20000 }); const rows = await attr(page, '#inv-table', 'data-rows');
  const x = rows[0];
  check('invoice fields', x.invoiceNumber === 'INV-0042' && x.invoiceDate === '12/10/2026' && x.dueDate === '26/10/2026' && x.subtotal === '1250.00' && x.vat === '250.00' && x.total === '1500.00' && x.currency === 'GBP' && x.vatNumber === 'GB123456789' && x.sortCode === '12-34-56' && x.accountNumber === '12345678' && x.supplier === 'Shafi Plumbing Ltd', x);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#inv-csv')]);
  check('invoice CSV', fs.readFileSync(await dl.path(), 'utf8').includes('"INV-0042"'));
  await page.close();

  // ---------- Email header analyser ----------
  page = await open('/email-header-analyzer/');
  const hdr = ['Received: from mx.google.com (mx.google.com [209.85.220.41])', '\tby mail.recipient.co.uk with ESMTPS id abc; Tue, 3 Nov 2026 09:00:20 +0000',
    'Received: from relay.example.net (relay.example.net [203.0.113.5]) by mx.google.com with ESMTP id x; Tue, 3 Nov 2026 09:00:05 +0000',
    'Received: from laptop (unknown [10.0.0.4]) by relay.example.net with SMTP; Tue, 3 Nov 2026 09:00:00 +0000',
    'Authentication-Results: mx.google.com; spf=pass smtp.mailfrom=example.net; dkim=pass header.d=example.net; dmarc=fail header.from=bank.co.uk',
    'From: "Your Bank" <alerts@bank.co.uk>', 'Reply-To: help@scam-desk.com', 'Return-Path: <bounce@example.net>', 'Subject: Urgent: verify your account', 'Date: Tue, 3 Nov 2026 09:00:00 +0000', 'Message-ID: <1@example.net>', '', 'Body text'].join('\n');
  await page.fill('#raw', hdr); await page.waitForTimeout(500); r = await attr(page, '#eh-out');
  check('email headers analysed', r && r.spf === 'pass' && r.dkim === 'pass' && r.dmarc === 'fail' && r.hops === 3 && r.total === 20 && r.warnings === 3, r);
  await page.close();

  // ---------- DNS checker (API mocked) ----------
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('dns: ' + e.message));
  await page.route('**/api/dns**', route => { const u = new URL(route.request().url()), n = u.searchParams.get('name'), t = u.searchParams.get('type');
    const ans = (d) => ({ status: 'NOERROR', answers: [{ name: n, type: t, ttl: 300, data: d }] });
    if (u.searchParams.get('resolver')) {
      const map = { 'shafi.co.uk|MX': ans('10 mx1.mail.co.uk'), 'shafi.co.uk|TXT': ans('v=spf1 include:_spf.mail.co.uk ~all'), '_spf.mail.co.uk|TXT': ans('v=spf1 ip4:203.0.113.0/24 -all'), '_dmarc.shafi.co.uk|TXT': ans('v=DMARC1; p=none; rua=mailto:d@shafi.co.uk'), 'selector1._domainkey.shafi.co.uk|TXT': ans('v=DKIM1; k=rsa; p=' + 'A'.repeat(392)) };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ name: n, type: t, results: [Object.assign({ id: 'cloudflare', resolver: 'Cloudflare', ms: 9 }, map[n + '|' + t] || { status: 'NXDOMAIN', answers: [] })] }) });
    }
    const res = ['Cloudflare', 'Google', 'Quad9', 'Cisco OpenDNS', 'AdGuard', 'Mullvad', 'DNS.SB', 'Control D'].map((r, i) => Object.assign({ id: r, resolver: r, ms: 10 + i }, i === 7 ? ans('198.51.100.9') : i === 6 ? { status: 'ERROR', answers: [] } : ans('203.0.113.10')));
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ name: n, type: t, results: res }) }); });
  await page.goto(BASE + '/dns-checker/'); await page.fill('#domain', 'https://Shafi.co.uk/page'); await page.click('button[type=submit]');
  await page.waitForSelector('#dns-out[data-result]'); r = await attr(page, '#dns-out');
  check('DNS propagation summary', r.agree === 6 && r.total === 8 && (await page.textContent('#dns-sum')).includes('6 of 8'), r);
  await page.goto(BASE + '/email-dns-checker/'); await page.fill('#domain', 'shafi.co.uk'); await page.click('button[type=submit]');
  await page.waitForSelector('#edns-out[data-result]'); r = await attr(page, '#edns-out'); const et = await page.textContent('#edns-out');
  check('email DNS check', r.score === 3 && r.mx === 1 && r.spf && r.dmarc && r.dkim.join() === 'selector1' && et.includes('1 of 10 allowed DNS lookups') && et.includes('2048-bit'), { r, et: et.slice(0, 300) });
  await page.close();

  // ---------- Speed test (PSI mocked) ----------
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('psi: ' + e.message));
  await page.route('https://www.googleapis.com/**', route => route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
    loadingExperience: { metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2100, category: 'FAST' }, INTERACTION_TO_NEXT_PAINT: { percentile: 250, category: 'AVERAGE' }, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, category: 'FAST' } } },
    lighthouseResult: { categories: { performance: { score: 0.72 }, accessibility: { score: 0.95 }, 'best-practices': { score: 1 }, seo: { score: 0.9 } }, audits: {
      'largest-contentful-paint': { score: 0.6, displayValue: '3.1 s' }, 'cumulative-layout-shift': { score: 1, displayValue: '0.02' }, 'total-blocking-time': { score: 0.8, displayValue: '190 ms' }, 'first-contentful-paint': { score: 0.9, displayValue: '1.2 s' }, 'speed-index': { score: 0.7, displayValue: '3.9 s' },
      'uses-optimized-images': { title: 'Efficiently encode images', score: 0.3, details: { type: 'opportunity', overallSavingsMs: 1200 } } } } }) }));
  await page.goto(BASE + '/website-speed-test/'); await page.fill('#url', 'example.co.uk'); await page.click('button[type=submit]');
  await page.waitForSelector('#ps-out[data-result]'); const ps = await page.textContent('#ps-out');
  check('speed test rendered', ps.includes('72') && ps.includes('INP') && ps.includes('250 ms · Needs improvement') && ps.includes('Efficiently encode images'), ps.slice(0, 300));
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: SHOTS + '/speed.png' });
  await page.close();

  // ---------- API builder + JWT ----------
  page = await open('/api-request-builder/');
  await page.fill('#url', BASE + '/assets/tools-index.js'); await page.click('button[type=submit]');
  await page.waitForSelector('#api-out[data-status]'); check('API request 200', (await page.getAttribute('#api-out', 'data-status')) === '200');
  await page.selectOption('#method', 'POST'); await page.fill('#headers', 'Content-Type: application/json'); await page.fill('#body', '{"a":1}');
  check('cURL generated', (await page.textContent('#api-code')).includes("curl -X POST") && (await page.textContent('#api-code')).includes("--data '{\"a\":1}'"));
  await page.selectOption('#lang', 'python'); check('Python generated', (await page.textContent('#api-code')).includes('requests.request("POST"'));
  await page.close();
  page = await open('/jwt-decoder/');
  const tok = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify({ sub: '42', name: 'Asif', exp: 1700000000 })).toString('base64url') + '.sig';
  await page.fill('#token', 'Bearer ' + tok); r = await attr(page, '#jwt-out');
  check('JWT decoded + expired', r.name === 'Asif' && (await page.textContent('#jwt-out')).includes('Expired'), r);
  await page.close();

  // ---------- Photo metadata ----------
  page = await open('/photo-metadata-remover/');
  await page.setInputFiles('#meta-input', [{ name: 'holiday.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync('/tmp/gps.jpg') }]);
  await page.waitForSelector('.meta-card[data-out]'); r = await attr(page, '.meta-card', 'data-out');
  const card = await page.textContent('.meta-card');
  check('GPS + camera detected', r.gps && card.includes('TestCam') && card.includes('51.5'), card.slice(0, 300));
  const href = await page.getAttribute('.meta-card a.btn', 'href');
  const after = await page.evaluate(async (h) => { const b = await (await fetch(h)).blob(); const m = await exifr.parse(b, { gps: true, tiff: true }).catch(() => null); const bmp = await createImageBitmap(b); return { meta: m, w: bmp.width, size: b.size }; }, href);
  check('clean copy has no metadata, same pixels size', !after.meta && after.w === 800 && !r.reencoded && r.outSize < r.inSize, { after, r });
  await page.close();

  // ---------- Planners ----------
  page = await open('/budget-planner/');
  const setRow = async (host, i, k, v) => { await page.fill(`${host} [data-i="${i}"][data-k="${k}"]`, v); };
  await setRow('#bp-income', 0, 'amount', '2500'); await setRow('#bp-exp', 0, 'amount', '900'); await setRow('#bp-exp', 8, 'amount', '300'); await setRow('#bp-exp', 11, 'amount', '400');
  r = await attr(page, '#bp-sum'); check('budget totals', r.income === 2500 && r.spent === 1600 && r.left === 900 && r.by.needs === 900 && r.by.wants === 300 && r.by.savings === 400, r);
  await page.reload(); check('budget saved', (await page.inputValue('#bp-income [data-i="0"][data-k="amount"]')) === '2500');
  await page.close();
  page = await open('/subscription-tracker/');
  await page.fill('#st-rows [data-i="0"][data-k="name"]', 'Netflix'); await page.fill('#st-rows [data-i="0"][data-k="cost"]', '10.99');
  const soonDate = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10); await page.fill('#st-rows [data-i="0"][data-k="next"]', soonDate);
  await page.click('#st-rows .ed-add'); await page.fill('#st-rows [data-i="1"][data-k="name"]', 'Adobe'); await page.fill('#st-rows [data-i="1"][data-k="cost"]', '120'); await page.selectOption('#st-rows [data-i="1"][data-k="cycle"]', 'yearly');
  r = await attr(page, '#st-sum'); check('subscription totals', r.monthly === 20.99 && r.yearly === 251.88 && r.soon === 1, r);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#st-ics')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8'); check('calendar reminders', ics.includes('RRULE:FREQ=MONTHLY') && ics.includes('SUMMARY:Netflix renews') && ics.includes('TRIGGER:-P2D'), ics.slice(0, 200));
  await page.close();
  page = await open('/travel-budget-planner/'); await page.waitForTimeout(500); r = await attr(page, '#tb-out');
  check('travel budget', r.total === 2717 && r.perPerson === 1358.5 && (await page.textContent('#tb-out')).includes('In EUR'), r);
  await page.close();
  page = await open('/trip-cost-splitter/');
  await page.click('#sp-addp'); await page.click('#sp-adde'); await page.fill('[data-e="0"][data-k="amount"]', '90');
  await page.click('#sp-adde'); await page.fill('[data-e="1"][data-k="amount"]', '30'); await page.selectOption('[data-e="1"][data-k="paidBy"]', 'Friend'); await page.uncheck('[data-am="1"][value="Me"]');
  r = await attr(page, '#sp-out'); check('split transfers', JSON.stringify(r) === JSON.stringify([{ from: 'Person 3', to: 'Me', amount: 45 }, { from: 'Friend', to: 'Me', amount: 15 }]), r);
  await page.close();
  page = await open('/meeting-time-finder/');
  await page.fill('#date', '2026-11-04'); await page.dispatchEvent('#date', 'change'); r = await attr(page, '#mt-best');
  check('London/NY/Dubai: no full overlap', r.best === 0 && r.zones === 3, r);
  await page.click('[data-rmz="2"]'); r = await attr(page, '#mt-best');
  check('London/NY overlap = 3 hours', r.best === 3 && (await page.textContent('#mt-best')).includes('London 14:00 · New York 09:00'), [r, await page.textContent('#mt-best')]);
  await page.close();
  page = await open('/recipe-scaler/'); const lines = await attr(page, '#rc-out', 'data-lines');
  check('recipe 4→6', lines[0] === '3 cups plain flour' && lines[1] === '2 ¼ tsp baking powder' && lines[4] === '4 ½ large eggs', lines);
  await page.check('input[name=metric]'); const ml = await attr(page, '#rc-out', 'data-lines'); check('cups→ml', ml[0] === '720 ml plain flour' && ml[5] === '340 g cheddar, grated', ml);
  await page.close();
  page = await open('/webcam-mic-test/');
  await page.click('#cam-start'); await page.waitForFunction(() => document.querySelector('[data-device]').getAttribute('data-cam'), null, { timeout: 15000 });
  check('fake camera works', (await page.getAttribute('[data-device]', 'data-cam')) === 'ok' && (await page.textContent('#cam-info')).includes('Camera working'), await page.textContent('#cam-info'));
  await page.click('#mic-start'); await page.waitForTimeout(2500);
  check('fake mic heard', (await page.getAttribute('[data-device]', 'data-mic')) === 'heard', await page.getAttribute('[data-device]', 'data-mic'));
  await page.click('[data-pan="-1"]'); check('speaker tone', (await page.getAttribute('[data-device]', 'data-spk')) === 'played');
  await page.close();

  // ---------- All new pages: load, mobile, links ----------
  const all = ['/', '/batch-file-renamer/', '/duplicate-file-finder/', '/file-checksum/', '/compare-documents/', '/image-to-text/', '/invoice-data-extractor/', '/email-header-analyzer/', '/dns-checker/', '/email-dns-checker/', '/website-speed-test/', '/api-request-builder/', '/jwt-decoder/', '/photo-metadata-remover/', '/budget-planner/', '/subscription-tracker/', '/travel-budget-planner/', '/trip-cost-splitter/', '/meeting-time-finder/', '/recipe-scaler/', '/webcam-mic-test/'];
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mob.route('https://api.frankfurter.dev/**', r2 => r2.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ amount: 1, base: 'EUR', date: '2026-11-02', rates: { GBP: 0.85 } }) }));
  const seen = new Set();
  for (const p of all) {
    const pg = await mob.newPage(); pg.on('pageerror', e => errors.push(p + ' (mobile): ' + e.message));
    const rr = await pg.goto(BASE + p); check('loads ' + p, rr.status() === 200);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth); check('mobile fits ' + p, sw <= 390, sw);
    for (const l of await pg.$$eval('a[href^="/"]', as => as.map(a => a.getAttribute('href').split('#')[0]))) { if (seen.has(l)) continue; seen.add(l); const y = await pg.request.get(BASE + l); if (y.status() !== 200) check('link ' + l, false, y.status()); }
    if (p === '/') await pg.screenshot({ path: SHOTS + '/m-home4.png' });
    if (p === '/meeting-time-finder/') await pg.screenshot({ path: SHOTS + '/m-meet.png', fullPage: true });
    await pg.close();
  }
  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})();
