// Batch 3: calorie, body fat, ideal weight, stamp duty (SDLT/LBTT/LTT), student loans.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  let p = await page('/stamp-duty-calculator/');
  const sd = await p.evaluate(() => { const f = ETBProperty.stampDuty; return [f(295000, 'england', 'mover'), f(500000, 'england', 'ftb'), f(300000, 'england', 'ftb'), f(300000, 'england', 'additional'), f(600000, 'england', 'ftb'), f(300000, 'england', 'mover', true),
    f(200000, 'scotland', 'mover'), f(200000, 'scotland', 'ftb'), f(300000, 'scotland', 'additional'), f(300000, 'wales', 'mover'), f(300000, 'wales', 'additional'), f(30000, 'england', 'additional')]; });
  // 295k: 2,500+2,250 · FTB 500k: 10,000 · FTB 300k: 0 · 2nd home 300k: 6,250+8,750+5,000 · FTB 600k: standard 2,500+17,500 · non-res 300k: 5,000+6,000
  // LBTT 200k: 1,100 · FTB: 500 · ADS 300k: 2,100+2,500+24,000 · LTT 300k: 4,500 · higher: 9,000+5,950+5,000 · under £40k: no surcharge
  ok(sd.join() === '4750,10000,0,20000,20000,11000,1100,500,28600,4500,19950,0', 'stamp duty maths ' + sd.join());
  await p.fill('#sd-price', '450,000'); await p.selectOption('#sd-buyer', 'ftb'); ok(await p.getAttribute('form[data-stamp]', 'data-tax') === '7500', 'UI first-time buyer at £450k = £7,500');
  ok(/Effective rate 1.7%/.test(await p.textContent('#sd-out')), 'effective rate shown');
  await p.selectOption('#sd-region', 'scotland'); ok(await p.isHidden('#sd-nonres'), 'non-resident option only for England & NI');
  await p.close();

  p = await page('/student-loan-repayment-calculator/');
  const sl = await p.evaluate(() => { const r = ETBProperty.loanRepay; return [r(30000, 'p2').year.toFixed(2), r(30000, 'p5').year, r(40000, 'p1', true).year.toFixed(2), r(20000, 'p4').year, r(50000, null, true).year]; });
  ok(sl.join() === '55.35,450,2319.00,0,1740', 'student loan maths ' + sl.join());
  await p.fill('#sl-sal', '35,000'); await p.selectOption('#sl-plan', 'p5'); ok(await p.getAttribute('form[data-loan]', 'data-month') === '75.00', 'UI £35k on Plan 5 = £75/month');
  await p.fill('#sl-bal', '10,000'); await p.dispatchEvent('#sl-bal', 'input'); ok(await p.getAttribute('form[data-loan]', 'data-cleared') === 'true', 'small balance gets cleared');
  await p.fill('#sl-bal', '90,000'); await p.fill('#sl-sal', '27,000'); await p.dispatchEvent('#sl-sal', 'input'); ok(await p.getAttribute('form[data-loan]', 'data-cleared') === 'false' && /written off/.test(await p.textContent('#sl-out')), 'large balance written off');
  await p.close();

  p = await page('/calorie-calculator/');
  ok(await p.evaluate(() => Math.round(ETBHealth.bmr('m', 80, 180, 30))) === 1780 && await p.evaluate(() => Math.round(ETBHealth.bmr('f', 60, 165, 40))) === 1270, 'Mifflin-St Jeor');
  await p.selectOption('#hc-sex', 'm'); await p.fill('#hc-cm', '180'); await p.fill('#hc-kg', '80'); await p.fill('#hc-age', '30'); await p.selectOption('#hc-act', '1.55');
  ok(await p.getAttribute('form[data-cal]', 'data-tdee') === '2759', 'TDEE moderate activity');
  await p.selectOption('#hc-units', 'imp'); ok(await p.isVisible('input[name=st]') && await p.isHidden('#hc-kg'), 'imperial inputs');
  await p.selectOption('#hc-sex', 'f'); await p.fill('input[name=ft]', '5'); await p.fill('input[name=inch]', '0'); await p.fill('input[name=st]', '7'); await p.fill('input[name=lb]', '0'); await p.fill('#hc-age', '70'); await p.selectOption('#hc-act', '1.2');
  ok(/Not recommended/.test(await p.textContent('#hc-out')), 'unsafe calorie targets are not shown');
  await p.close();
  p = await page('/body-fat-calculator/');
  const bf = await p.evaluate(() => [ETBHealth.navy('m', 178, 38, 86).toFixed(1), ETBHealth.navy('f', 165, 32, 74, 98).toFixed(1)]);
  ok(bf[0] === '17.2' && bf[1] === '28.4', 'US Navy formula ' + bf);
  await p.selectOption('#hc-sex', 'm'); ok(await p.isHidden('[data-hip]'), 'hip only for women'); ok(/Estimated body fat/.test(await p.textContent('#hc-out')), 'result shown');
  await p.close();
  p = await page('/ideal-weight-calculator/');
  ok(await p.getAttribute('form[data-ideal]', 'data-lo') === '53.5', 'healthy range at 170 cm starts at 53.5 kg');
  ok(await p.evaluate(() => ETBHealth.ideal('m', 182.88).devine.toFixed(1)) === '77.6', 'Devine for 6 ft man');
  await p.close();
  p = await page('/bmi-calculator/'); ok(!!(await p.$('a[href="/calorie-calculator/"]')), 'BMI links to new health calculators'); await p.close();

  for (const u of ['/calorie-calculator/', '/body-fat-calculator/', '/ideal-weight-calculator/', '/stamp-duty-calculator/', '/student-loan-repayment-calculator/']) {
    const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, u + ' fits a phone (' + sw + ')'); await m.close(); }
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
