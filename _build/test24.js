// Batch 2: wheel spinner, name picker & teams, coin, dice, countdown, stopwatch, pomodoro, working days.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };

  // wheel: many spins, winner always from the list and matches the pointer maths
  let p = await page('/wheel-spinner/');
  await p.fill('#wh-entries', 'Red\nGreen\nBlue'); const seen = {};
  for (let i = 0; i < 12; i++) { await p.click('#wh-spin'); await p.waitForFunction(() => !document.getElementById('wh-spin').disabled); seen[await p.getAttribute('form[data-wheel]', 'data-winner')] = 1; }
  ok(Object.keys(seen).every(k => ['Red', 'Green', 'Blue'].includes(k)) && Object.keys(seen).length >= 2, 'wheel winners come from the list ' + Object.keys(seen));
  ok(/The winner is/.test(await p.textContent('#wh-result')), 'winner shown');
  ok(await p.evaluate(() => [ETBWheel.winnerAt(0, 4), ETBWheel.winnerAt(-Math.PI / 2 - 0.01, 4), ETBWheel.winnerAt(-Math.PI - 0.01, 4)].join()) === '0,1,2', 'pointer maths');
  await p.check('input[name=remove]'); await p.click('#wh-spin'); await p.waitForFunction(() => !document.getElementById('wh-spin').disabled); await p.waitForTimeout(1000);
  ok((await p.inputValue('#wh-entries')).split('\n').length === 2, 'remove winner after spin');
  await p.goto(BASE + '/wheel-spinner/#w=' + Buffer.from('Pizza\nCurry').toString('base64'), { waitUntil: 'networkidle' }); await p.reload({ waitUntil: 'networkidle' });
  ok(await p.inputValue('#wh-entries') === 'Pizza\nCurry', 'shared wheel link loads entries');
  await p.close();

  // name picker
  p = await page('/random-name-picker/'); await p.fill('#np-names', 'A\nB\nC\nD'); await p.dispatchEvent('#np-names', 'input');
  const picks = []; for (let i = 0; i < 4; i++) { await p.click('#np-pick'); await p.waitForSelector('.np-big.done', { timeout: 5000 }).catch(async () => console.log('OUT', await p.innerHTML('#np-out'), await p.inputValue('#np-names'))); picks.push(await p.getAttribute('form[data-picker]', 'data-picked')); }
  ok(new Set(picks).size === 4 && picks.every(x => 'ABCD'.includes(x)), 'no repeats until everyone is picked ' + picks);
  await p.click('#np-pick'); ok(/Everyone has been picked/.test(await p.textContent('#np-out')), 'tells you when everyone is picked');
  await p.fill('#np-names', Array.from({ length: 10 }, (_, i) => 'N' + i).join('\n')); await p.fill('#np-tn', '3'); await p.click('#np-teams');
  let t = JSON.parse(await p.getAttribute('form[data-picker]', 'data-teams')); ok(t.length === 3 && t.flat().length === 10 && t.every(g => g.length >= 3 && g.length <= 4), 'three balanced teams ' + t.map(g => g.length));
  await p.selectOption('#np-tby', 'size'); await p.fill('#np-tn', '4'); await p.click('#np-teams'); t = JSON.parse(await p.getAttribute('form[data-picker]', 'data-teams')); ok(t.length === 3 && t.flat().length === 10, 'teams of four ' + t.map(g => g.length));
  await p.close();

  // coin and dice
  p = await page('/coin-flip/'); const sides = {};
  for (let i = 0; i < 12; i++) { await p.click('#cf-flip'); await p.waitForTimeout(120); sides[await p.getAttribute('form[data-coin]', 'data-last')] = 1; }
  ok(sides.heads && sides.tails, 'coin lands on both sides'); ok(/12 flips/.test(await p.textContent('#cf-stats')), 'tally counts flips');
  await p.close();
  p = await page('/dice-roller/'); await p.selectOption('#dc-count', '3'); await p.selectOption('#dc-sides', '20'); await p.click('#dc-roll'); await p.waitForTimeout(300);
  let r = (await p.getAttribute('form[data-dice]', 'data-roll')).split(',').map(Number); ok(r.length === 3 && r.every(v => v >= 1 && v <= 20), 'three d20 ' + r);
  ok(new RegExp('Total ' + r.reduce((a, c) => a + c)).test(await p.textContent('#dc-out')), 'total shown');
  await p.selectOption('#dc-sides', '6'); await p.waitForTimeout(300); ok((await p.$$('#dc-tray .die-p')).length >= 3, 'six-sided dice show pips');
  await p.close();

  // timers
  p = await page('/countdown-timer/?t=3'); ok(await p.inputValue('#cd-s') === '3', 'timer link presets 3 seconds');
  await p.click('#cd-start'); await p.waitForSelector('form[data-done]', { timeout: 6000 }); ok(/Time's up/.test(await p.textContent('#cd-time')), 'countdown finishes');
  await p.click('[data-preset="300"]'); await p.waitForTimeout(1200); const left = +(await p.getAttribute('form[data-countdown]', 'data-left')); ok(left <= 299 && left >= 296, 'preset 5 min runs ' + left);
  await p.click('#cd-start'); const paused = await p.textContent('#cd-time'); await p.waitForTimeout(1200); ok(await p.textContent('#cd-time') === paused, 'pause holds the time');
  await p.close();
  p = await page('/stopwatch/'); await p.click('#sw-start'); await p.waitForTimeout(600); await p.click('#sw-lap'); await p.waitForTimeout(400); await p.click('#sw-lap'); await p.click('#sw-start');
  const ms = +(await p.getAttribute('form[data-stopwatch]', 'data-ms')); ok(ms > 900 && ms < 2000 && await p.getAttribute('form[data-stopwatch]', 'data-laps') === '2', 'stopwatch time and laps ' + ms);
  await p.click('#sw-lap'); ok(await p.textContent('#sw-time') === '0:00.00', 'reset clears');
  await p.close();
  p = await page('/pomodoro-timer/'); ok(await p.textContent('#po-time') === '25:00', 'pomodoro starts at 25:00');
  await p.click('#po-skip'); ok(await p.getAttribute('form[data-pomodoro]', 'data-phase') === 'short' && /1 session/.test(await p.textContent('#po-done')), 'skip moves to a short break and counts the session');
  await p.click('[data-phase-btn="long"]'); ok(await p.textContent('#po-time') === '15:00', 'long break tab');
  await p.close();

  // working days
  p = await page('/working-days-calculator/');
  const wd = await p.evaluate(() => [ETBWorkdays.count('2026-12-21', '2027-01-08', 'ew', true).work, ETBWorkdays.addWork('2026-12-23', 3, 'ew'), ETBWorkdays.holidays(2027, 'sc')[1], ETBWorkdays.holidays(2026, 'ni').filter(h => /Boyne/.test(h))[0], ETBWorkdays.easter(2027)]);
  ok(wd.join('|') === '12|2026-12-30|2027-01-04 2nd January (substitute day)|2026-07-13 Battle of the Boyne (Orangemen\'s Day) (substitute day)|2027-03-28', 'bank holiday maths ' + wd.join('|'));
  await p.fill('#wd-from', '2026-12-21'); await p.fill('#wd-to', '2027-01-08'); await p.dispatchEvent('#wd-to', 'change');
  ok(await p.getAttribute('form[data-workdays]', 'data-result') === '12' && /Boxing Day/.test(await p.textContent('#wd-out')), 'UI counts 12 working days over Christmas');
  await p.selectOption('#wd-region', 'sc'); ok(await p.getAttribute('form[data-workdays]', 'data-result') === '11', 'Scotland has 2 January off too');
  await p.selectOption('#wd-mode', 'add'); await p.fill('#wd-start', '2026-12-23'); await p.fill('#wd-n', '3'); await p.dispatchEvent('#wd-n', 'input');
  ok(await p.getAttribute('form[data-workdays]', 'data-result') === '2026-12-30', 'add 3 working days');
  await p.close();

  for (const u of ['/wheel-spinner/', '/random-name-picker/', '/coin-flip/', '/dice-roller/', '/countdown-timer/', '/stopwatch/', '/pomodoro-timer/', '/working-days-calculator/']) {
    const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, u + ' fits a phone (' + sw + ')'); await m.close(); }
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
