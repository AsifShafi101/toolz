// Invoice: printed page has no site branding; custom heading is Pro-gated and appears on the document.
const { chromium } = require('playwright'); const { execSync } = require('child_process'); const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${BASE}/invoice-generator/`);
  await p.fill('#bizname', 'Muhammad Asif'); await p.fill('#client', 'Acme Ltd');
  await p.fill('.i-desc', 'Website work'); await p.fill('.i-qty', '2'); await p.fill('.i-price', '150');
  await p.fill('#doctitle', 'Tax invoice');
  ok((await p.textContent('#doc .doc-title')) === 'TAX INVOICE', 'custom heading shows in preview');
  ok(await p.isVisible('#title-pro-note'), 'free users see the Pro note');
  ok((await p.textContent('#doc .doc-powered')).replace(/\s+/g, ' ').includes('Powered by etoolbox.co.uk'), 'free: Powered by etoolbox.co.uk shown');
  await p.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await p.click('#print-doc');
  ok(await p.isVisible('#pro-modal') && !(await p.evaluate(() => window.__printed)), 'free user: custom heading opens the Pro box instead of printing');
  await p.evaluate(() => { document.querySelector('#pro-modal [data-close]').click(); });
  // become Pro
  await p.evaluate(() => { window.ETBPro.isPro = () => true; document.dispatchEvent(new Event('etb-pro-change')); });
  ok(!(await p.isVisible('#title-pro-note')), 'Pro: note hidden');
  await p.click('#print-doc');
  ok(await p.evaluate(() => window.__printed) === 1, 'Pro: prints with custom heading');
  ok((await p.textContent('#doc .doc-facts dt')).startsWith('Tax invoice #'), 'number label uses heading');
  ok(!(await p.$('#doc .doc-powered')), 'Pro: no Powered by etoolbox');
  await p.emulateMedia({ media: 'print' });
  const pdf = await p.pdf({ format: 'A4', preferCSSPageSize: true }); fs.writeFileSync('/tmp/inv.pdf', pdf);
  const txt = execSync('pdftotext -layout /tmp/inv.pdf -').toString();
  ok(txt.includes('TAX INVOICE') && txt.includes('Acme Ltd'), 'PDF has the invoice');
  ok(!/Home|Share|WhatsApp|etoolbox|Breadcrumb|Featured|Powered/i.test(txt), 'PDF has no site branding: ' + (txt.match(/Home|Share|WhatsApp|etoolbox|Featured/i) || ['none'])[0]);
  ok(execSync('pdfinfo /tmp/inv.pdf').toString().match(/Pages:\s+1\n/), 'fits on one page');
  await p.goto(`${BASE}/quote-generator/`); ok((await p.$$eval('#doctitle-list option', o => o.map(x => x.value))).includes('Estimate'), 'quote headings list');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
