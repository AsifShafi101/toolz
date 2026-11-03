// Maths tools: scientific calculator, number base converter, fraction calculator, statistics.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fail = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) fail++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36' });
  const errs = []; const open = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ': ' + e.message)); await p.goto(BASE + u); return p; };
  const k = (p, key) => p.click(`.sci [data-k="${key}"]`);
  const out = (p) => p.textContent('#sci-out');

  // ---- Scientific calculator
  let p = await open('/scientific-calculator/');
  for (const key of ['7', '×', '8']) await k(p, key); await k(p, '=');
  ok((await out(p)) === '56', 'buttons: 7 × 8 = 56', await out(p));
  await k(p, '+'); ok((await p.inputValue('#sci-expr')) === 'Ans+', 'operator after answer continues with Ans');
  await k(p, '4'); await k(p, '='); ok((await out(p)) === '60', 'Ans + 4 = 60');
  await k(p, 'AC'); await p.fill('#sci-expr', '3/4'); await p.press('#sci-expr', 'Enter');
  ok((await out(p)) === '3/4' && (await p.textContent('#sci-alt')).includes('0.75'), 'fraction answer with S⇔D alternative', [await out(p), await p.textContent('#sci-alt')]);
  await k(p, 'SD'); ok((await out(p)) === '0.75', 'S⇔D switches to decimal');
  await p.fill('#sci-expr', '√(8)'); await p.press('#sci-expr', 'Enter'); ok((await out(p)) === '2√2', 'surd form 2√2', await out(p));
  await k(p, 'AC'); await k(p, 'shift'); ok(await p.evaluate(() => document.querySelector('.sci').classList.contains('shifted')), 'SHIFT on');
  await k(p, '²'); ok((await p.inputValue('#sci-expr')) === '√(', 'SHIFT + x² inserts √(', await p.inputValue('#sci-expr'));
  await k(p, 'AC'); await k(p, 'sin('); await k(p, '3'); await k(p, '0'); await k(p, '='); ok((await out(p)) === '1/2', 'sin(30) = 1/2 in DEG', await out(p));
  await p.click('[data-mode="rad"]'); await p.fill('#sci-expr', 'cos(π)'); await p.press('#sci-expr', 'Enter'); ok((await out(p)) === '-1', 'RAD mode cos(π) = -1', await out(p));
  await p.click('[data-mode="deg"]');
  await p.fill('#sci-expr', '5C2 + 3!'); await p.press('#sci-expr', 'Enter'); ok((await out(p)) === '16', 'nCr and factorial', await out(p));
  await p.fill('#sci-expr', '1/0'); await p.press('#sci-expr', 'Enter'); ok((await p.textContent('#sci-err')).includes('divide by zero'), 'divide by zero error');
  await p.fill('#sci-expr', '2^40'); await p.press('#sci-expr', 'Enter'); ok((await out(p)) === '1.099511628×10^12', 'standard form for big numbers', await out(p));
  ok((await p.$$('#sci-hist li button')).length >= 5, 'history recorded');
  // memory
  await p.fill('#sci-expr', '10'); await p.press('#sci-expr', 'Enter'); await k(p, 'M+'); ok(await p.isVisible('#sci-mem'), 'M indicator after M+');
  await k(p, 'AC'); await k(p, 'MR'); await k(p, '×'); await k(p, '2'); await k(p, '='); ok((await out(p)) === '20', 'MR recalls memory', await out(p));
  await k(p, 'shift'); await k(p, 'MR'); ok(await p.isHidden('#sci-mem'), 'SHIFT+MR clears memory');
  // keyboard typing
  await k(p, 'AC'); await p.click('#sci-expr'); await p.keyboard.type('2*(3+4)^2'); await p.keyboard.press('Enter'); ok((await out(p)) === '98', 'keyboard input', await out(p));
  // table of values
  await p.fill('#fx', 'x²-3x+2'); await p.fill('#start', '0'); await p.fill('#end', '3'); await p.fill('#step', '1'); await p.click('#tbl-form button[type=submit]');
  const tbl = await p.$$eval('#tbl-out tbody tr', trs => trs.map(t => [...t.children].map(td => td.textContent)));
  ok(JSON.stringify(tbl) === JSON.stringify([['0', '2'], ['1', '0'], ['2', '0'], ['3', '2']]), 'table of values', tbl);
  await p.screenshot({ path: '/home/claude/build/shots/sci.png' });
  await p.reload(); ok((await p.$$('#sci-hist li button')).length >= 5, 'history kept after reload');
  await p.close();
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 }); await m.goto(BASE + '/scientific-calculator/');
  ok((await m.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no sideways scroll on phones');
  await m.screenshot({ path: '/home/claude/build/shots/sci-m.png', fullPage: false }); await m.close();

  // ---- Base converter
  p = await open('/hex-to-decimal-converter/');
  await p.fill('#hex', 'ff'); ok((await p.inputValue('#dec')) === '255' && (await p.inputValue('#bin')) === '11111111' && (await p.inputValue('#oct')) === '377', 'FF → 255 / 11111111 / 377');
  await p.fill('#dec', '-5'); await p.selectOption('#bits', '8');
  ok((await p.textContent('#base-extra')).includes('1111 1011'), "two's complement of -5 (8-bit)", await p.textContent('#base-extra'));
  await p.fill('#bin', '1012'); ok((await p.textContent('#base-msg')).includes("isn't a valid"), 'invalid binary digit message');
  await p.selectOption('#bwbase', '16'); await p.selectOption('#op', 'AND'); await p.fill('#a', 'F0'); await p.fill('#b', '3C');
  ok((await p.getAttribute('#bw-out', 'data-dec')) === '48', 'bitwise F0 AND 3C = 0x30', await p.textContent('#bw-out'));
  await p.close();

  // ---- Fractions
  p = await open('/fraction-calculator/');
  await p.waitForSelector('#fr-out[data-answer]');
  ok((await p.getAttribute('#fr-out', 'data-answer')) === '9/4' && (await p.textContent('#fr-out')).includes('2 1/4'), 'default 1 1/2 + 3/4 = 9/4 = 2 1/4');
  await p.fill('#fexpr', '1/2 + 1/3'); ok((await p.getAttribute('#fr-out', 'data-answer')) === '5/6' && (await p.textContent('.steps')).includes('Common denominator: 6'), 'working shown for 1/2 + 1/3');
  await p.fill('#fexpr', '3/4 ÷ 1/2'); ok((await p.getAttribute('#fr-out', 'data-answer')) === '3/2', '3/4 ÷ 1/2 = 3/2');
  await p.close();

  // ---- Statistics
  p = await open('/statistics-calculator/');
  const st = await p.textContent('#st-out');
  ok(/Median\s*15/.test(st) && /Mode\s*8 \(2 times\)/.test(st) && /Range\s*38/.test(st), 'stats for default data', st.slice(0, 200));
  await p.fill('#data', '£10\n£20\n£30\nabc'); const st2 = await p.textContent('#st-out');
  ok(/Mean \(average\)\s*20/.test(st2) && (await p.textContent('#st-msg')).includes('abc'), 'ignores £ and reports bad values');
  await p.close();

  ok(!errs.length, 'no page errors', errs);
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED'); process.exit(fail ? 1 : 0);
})();
