// Web development services: homepage band, services page, quote form builds the enquiry email.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const links = await p.$$eval('#services .pj', a => a.map(x => x.href));
  ok(links.join() === 'https://www.alfitrahacademy.com/,https://kl-tech.co.uk/,https://www.skygoldltd.co.uk/', 'homepage shows the 3 projects');
  ok(await p.$('#services a[href="/web-development/#quote"]'), 'homepage links to the quote form');
  await p.goto(BASE + '/web-development/', { waitUntil: 'networkidle' });
  ok((await p.$$('.svc-card')).length === 6 && (await p.$$('#work .pj')).length === 3, 'services page lists 6 services and 3 projects');
  ok(await p.$$eval('#work .pj', a => a.every(x => x.target === '_blank' && /noopener/.test(x.rel))), 'project links open safely in a new tab');
  await p.click('#svc-form button'); ok(/add your name/.test(await p.textContent('#svc-form-msg')), 'form asks for a name');
  await p.fill('#q-name', 'Sam'); await p.fill('#q-biz', 'Sam Bakes'); await p.selectOption('#q-what', 'Online shops'); await p.fill('#q-msg', 'Need a shop');
  await p.click('#svc-form button'); await p.waitForTimeout(300);
  ok(/email app should open/.test(await p.textContent('#svc-form-msg')), 'form opens the enquiry email');
  ok(await p.$('script[type="application/ld+json"]') && !!(await p.content()).match(/ProfessionalService/), 'structured data present');
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  for (const u of ['/', '/web-development/']) { const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, `${u} fits a phone (${sw})`); await m.close(); }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
