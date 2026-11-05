// Monthly and hourly pay pages match the take-home calculator.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const num = (t) => parseFloat(t.replace(/[£,]/g, ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const c = await b.newPage(); await c.goto(`${BASE}/take-home-pay-calculator/`);
  const calc = (g) => c.evaluate(g => window.ETBCalc.takehome({ salary: String(g), period: 'year', region: 'ruk', pension: '0', sacrifice: 'no', loan: 'none', postgrad: 'no' }).raw.net, g);
  for (const m of [1000, 2500, 4000, 8000]) {
    await p.goto(`${BASE}/monthly-salary-after-tax/${m}/`);
    const shown = num(await p.textContent('.sal-stat.big strong')); const js = await calc(m * 12);
    ok(Math.abs(shown - js / 12) < 0.01, `£${m}/month → ${shown} vs calculator ${(js / 12).toFixed(2)}`);
  }
  for (const [slug, h] of [['12-71', 12.71], ['15', 15], ['50', 50]]) {
    await p.goto(`${BASE}/hourly-wage/${slug}/`);
    const yr = num(await p.textContent('.sal-stat.big strong')); const g = Math.round(h * 37.5 * 52 * 100) / 100;
    const mo = num(await p.textContent('.sal-stat:nth-child(2) strong')); const js = await calc(g);
    ok(Math.abs(yr - g) <= 0.5 && Math.abs(mo - js / 12) < 0.01, `£${h}/hr → ${yr}/yr, ${mo}/month (calc ${(js / 12).toFixed(2)})`);
  }
  await p.goto(`${BASE}/hourly-wage/`); ok((await p.$$('.sal-table tbody tr')).length === 39, 'hourly hub 39 rows');
  await p.goto(`${BASE}/monthly-salary-after-tax/`); ok((await p.$$('.sal-table tbody tr')).length === 29, 'monthly hub 29 rows');
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); await m.goto(`${BASE}/hourly-wage/12-71/`);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no mobile overflow');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
