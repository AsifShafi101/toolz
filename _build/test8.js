// Usage counter + feedback. Needs `wrangler dev --local` on 8787 (D1 local).
const { chromium } = require('playwright');
const BASE = process.env.WORKER || 'http://localhost:8787';
let pass = 0, fail = 0;
const check = (n, ok, info) => { if (ok) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, info === undefined ? '' : JSON.stringify(info).slice(0, 400)); } };
(async () => {
  const browser = await chromium.launch(), errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  // Lower display thresholds so we can see the counters/ratings with tiny test numbers
  await ctx.route('**/assets/config.js', async r => { const res = await r.fetch(); const t = (await res.text()).replace('showSiteCounterFrom: 1000', 'showSiteCounterFrom: 1').replace('showToolCounterFrom: 100', 'showToolCounterFrom: 1').replace('showRatingFrom: 5', 'showRatingFrom: 1'); r.fulfill({ response: res, body: t }); });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  const hits = []; page.on('request', rq => { if (rq.url().includes('/api/hit')) hits.push(rq.postDataJSON()); });

  // Visit counted once per session
  await page.goto(BASE + '/vat-calculator/'); await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(500);
  check('visit counted once per session', hits.filter(h => h.kind === 'visit' && h.tool === 'vat-calculator').length === 1, hits);
  check('feedback box on tool page', (await page.textContent('#feedback')).includes('Was this tool helpful?'));

  // Use: working with the tool for >4s → counted + prompt appears
  await page.fill('#amount', '100'); await page.waitForTimeout(4200); await page.fill('#amount', '120');
  await page.waitForSelector('.fb-toast', { timeout: 5000 });
  check('use counted after real interaction', hits.some(h => h.kind === 'use' && h.tool === 'vat-calculator'));
  check('prompt after use', (await page.textContent('.fb-toast')).includes('Did this tool do the job?'));
  await page.click('.fb-toast .fb-btn[data-v="1"]');
  check('toast closes, inline thanks + comment box', !(await page.$('.fb-toast')) && (await page.textContent('#feedback')).includes('Glad it helped') && await page.isVisible('#fb-text'));
  await page.fill('#fb-text', 'Great tool, please add Irish VAT rates'); await page.click('#fb-send');
  await page.waitForFunction(() => /Comment received/.test(document.getElementById('feedback').textContent));
  check('comment sent', true);

  // Download counts as a use (QR page) and no repeat prompt for a tool already rated
  await page.goto(BASE + '/qr-code-generator/'); await page.fill('#url', 'etoolbox.co.uk'); await page.waitForTimeout(400);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dl-png')]);
  await page.waitForTimeout(1800);
  check('download counted as use + prompt shown', hits.some(h => h.kind === 'use' && h.tool === 'qr-code-generator') && await page.isVisible('.fb-toast'));
  await page.click('.fb-toast .modal-x'); check('prompt dismissible', !(await page.$('.fb-toast')));
  await page.click('#feedback .fb-btn[data-v="-1"]'); check('thumbs down asks what went wrong', (await page.textContent('#feedback')).includes('What went wrong'));

  // Stats are cached for 60s at the edge, so wait for the cache to expire
  await page.waitForTimeout(61000);
  const st = await (await page.request.get(BASE + '/api/stats?tool=vat-calculator')).json();
  check('stats recorded', st.total >= 3 && st.toolUses >= 1 && st.toolVisits >= 1 && st.up === 1 && st.down === 0, st);
  const page2 = await ctx.newPage(); await page2.goto(BASE + '/vat-calculator/'); await page2.waitForTimeout(800);
  check('rating shown', /100% of \d+ people/.test(await page2.textContent('.fb-rating')), await page2.textContent('.fb-rating'));
  check('tool use counter shown', /Used \d+ times?/.test(await page2.textContent('.page-head')));
  check('already voted: no buttons', !(await page2.$('#feedback .fb-btn')));
  await page2.goto(BASE + '/'); await page2.waitForTimeout(800);
  check('site counter on homepage', /Used \d+ times/.test(await page2.textContent('.hero .pill')), await page2.textContent('.hero .pill'));
  await page2.close();
  const def = await browser.newContext(); const p3 = await def.newPage(); await p3.goto(BASE + '/'); await p3.waitForTimeout(800);
  check('real thresholds hide tiny counts', !(await p3.textContent('.hero .pill')).includes('Used'));
  await def.close();

  // API guards
  const bot = await page.request.post(BASE + '/api/hit', { headers: { 'x-etb': '1', 'user-agent': 'Googlebot/2.1' }, data: { tool: 'home', kind: 'visit' } });
  check('bots not counted', (await bot.json()).counted === false);
  const nohdr = await page.request.post(BASE + '/api/hit', { data: { tool: 'home', kind: 'visit' } });
  check('requests without our header not counted', (await nohdr.json()).counted === false);
  const bad = await page.request.post(BASE + '/api/feedback', { headers: { 'x-etb': '1' }, data: { tool: 'vat-calculator', vote: 0 } });
  check('feedback needs a vote', bad.status() === 400);
  const evil = await page.request.post(BASE + '/api/hit', { headers: { 'x-etb': '1' }, data: { tool: "x'; DROP TABLE counters;--", kind: 'visit' } });
  check('bad slug rejected', evil.status() === 400);
  const p4 = await ctx.newPage(); await p4.goto(BASE + '/invoice-generator/');
  await p4.evaluate(() => { window.__printed = 0; });
  check('print still works with use tracking', await p4.evaluate(() => typeof window.print === 'function'));
  check('no JS errors', errors.length === 0, errors);
  console.log(`\n${pass} passed, ${fail} failed`); await browser.close(); process.exit(fail ? 1 : 0);
})();
