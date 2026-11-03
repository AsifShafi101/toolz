// Salary-after-tax pages match the calculator; share bar + URL prefill work.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  for (const n of [15000, 30000, 50000, 75000, 110000, 150000, 200000]) {
    await p.goto(`${BASE}/salary-after-tax/${n}/`);
    const yr = await p.$eval('.sal-stat:nth-child(2) strong', e => e.textContent);
    const js = await p.evaluate(n => window.ETBCalc.takehome({ salary: String(n), period: 'year', region: 'ruk', pension: '0', sacrifice: 'no', loan: 'none', postgrad: 'no' }).raw.net, n);
    ok(Math.abs(parseFloat(yr.replace(/[£,]/g, '')) - js) < 0.01, `£${n} page ${yr} = calculator £${js}`);
  }
  ok(await p.$('.share-bar .sh-copy') !== null, 'share bar on salary page');
  await p.goto(`${BASE}/take-home-pay-calculator/?salary=42000&pension=0&loan=plan2`);
  const res = await p.$eval('#calc-out', e => JSON.parse(e.getAttribute('data-result')));
  ok(res.gross === 42000 && res.pension === 0 && res.sl > 0, 'calculator prefilled from URL');
  ok(await p.$('.share-bar') !== null, 'share bar on tool page');
  await p.goto(`${BASE}/salary-after-tax/`);
  ok((await p.$$('.sal-table tbody tr')).length === 106, 'hub lists 106 salaries');
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto(`${BASE}/salary-after-tax/45000/`);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll on mobile');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
