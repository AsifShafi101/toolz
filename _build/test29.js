// Batch 7: developer tools + single unit-conversion pages.
const { chromium } = require('playwright');
const fs = require('fs'); const crypto = require('crypto');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  const dl = async (p, sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); return d; };

  // Regex
  let p = await page('/regex-tester/');
  await p.waitForSelector('form[data-regex][data-count="3"]'); ok((await p.$$eval('#rx-out mark', m => m.map(x => x.textContent))).join('|') === 'SW1A 2AA|EH2 2EQ|ec1a 1bb', 'postcodes highlighted');
  await p.uncheck('input[name=fi]'); await p.waitForSelector('form[data-regex][data-count="2"]'); ok(true, 'case-sensitive drops the lowercase one');
  await p.fill('#rx-p', '(?<num>\\d+) (?<street>\\w+) St'); await p.waitForFunction(() => /num=/.test(document.getElementById('rx-list').textContent), null, { timeout: 5000 }).catch(() => {}); ok(/num="10"/.test(await p.textContent('#rx-list')), 'named groups listed');
  await p.check('input[name=userep]'); await p.fill('#rx-rep', '$<street> Street'); await p.waitForTimeout(300); ok(/Downing Street, London/.test(await p.inputValue('#rx-result')), 'replace preview with named group');
  await p.fill('#rx-p', '(abc'); await p.waitForSelector('form[data-regex][data-count="err"]'); ok(/Invalid regular expression/i.test(await p.textContent('#rx-msg')), 'syntax error shown');
  await p.fill('#rx-t', 'a'.repeat(32) + '!'); await p.fill('#rx-p', '(a+)+$'); await p.waitForFunction(() => /too long/.test(document.getElementById('rx-msg').textContent), null, { timeout: 5000 }).catch(() => {}); ok(/too long/.test(await p.textContent('#rx-msg')), 'runaway pattern stopped, page still responsive');
  await p.selectOption('#rx-pre', 'email'); await p.fill('#rx-t', 'a.b+c@mail.co.uk, x@y'); await p.waitForSelector('form[data-regex][data-count="1"]'); ok(true, 'email preset'); await p.close();

  // Base64
  p = await page('/base64-encode-decode/');
  const bb = await p.evaluate(() => [ETBDev.b64enc('hello'), ETBDev.b64dec('aGVsbG8='), ETBDev.b64enc('£✓', true), ETBDev.b64dec(ETBDev.b64enc('£✓', true)), (() => { try { ETBDev.b64dec('ab$c'); } catch (e) { return e.message; } })()]);
  ok(bb[0] === 'aGVsbG8=' && bb[1] === 'hello' && bb[2] === Buffer.from('£✓').toString('base64url') && bb[3] === '£✓' && /isn't valid Base64/.test(bb[4]), 'encode/decode, UTF-8, URL-safe, errors');
  await p.click('#b64-enc'); const enc = await p.inputValue('#b64-out'); ok(Buffer.from(enc, 'base64').toString() === 'Hello from etoolbox — £5 off ✓', 'UI encode matches Node');
  await p.click('#b64-swap'); await p.click('#b64-dec'); ok(await p.inputValue('#b64-out') === 'Hello from etoolbox — £5 off ✓', 'round trip');
  await p.setInputFiles('#b64-file', '/tmp/t27/quads.png'); await p.waitForSelector('form[data-b64][data-file]'); const fo = await p.inputValue('textarea[name=fout]');
  ok(fo === 'data:image/png;base64,' + fs.readFileSync('/tmp/t27/quads.png').toString('base64'), 'file to data URI');
  await p.fill('textarea[name=fin]', fo); let d = await dl(p, '#b64-save'); ok(d.suggestedFilename() === 'decoded.png' && fs.readFileSync(await d.path()).equals(fs.readFileSync('/tmp/t27/quads.png')), 'Base64 back to an identical PNG'); await p.close();

  // URL
  p = await page('/url-encode-decode/');
  await p.click('#ue-enc'); ok(await p.inputValue('#ue-out') === encodeURIComponent('https://example.co.uk/search?q=fish & chips&town=Bury St Edmunds'), 'component encode');
  ok(/Bury St Edmunds/.test(await p.textContent('#ue-parts')) && /example\.co\.uk/.test(await p.textContent('#ue-parts')), 'URL parts and decoded query params');
  await p.selectOption('#ue-mode', 'form'); await p.fill('#ue-in', 'fish & chips'); await p.click('#ue-enc'); ok(await p.inputValue('#ue-out') === 'fish+%26+chips', 'form encoding uses +');
  await p.fill('#ue-in', 'caf%C3%A9+au+lait'); await p.click('#ue-dec'); ok(await p.inputValue('#ue-out') === 'café au lait', 'decode');
  await p.fill('#ue-in', 'bad%E0%A4%A'); await p.click('#ue-dec'); ok(/broken %/.test(await p.textContent('#ue-msg')), 'broken % sequence explained'); await p.close();

  // UUID
  p = await page('/uuid-generator/');
  let ids = (await p.inputValue('textarea[name=out]')).split('\n'); ok(ids.length === 5 && ids.every(x => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x)) && new Set(ids).size === 5, '5 valid unique v4');
  await p.selectOption('#uu-ver', '7'); await p.check('input[name=upper]'); ids = (await p.inputValue('textarea[name=out]')).split('\n');
  ok(ids.every(x => /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB]/.test(x)) && ids.slice().sort().join() === ids.join(), 'v7, upper case, sorted by time');
  await p.fill('#uu-check', ids[0]); const inf = await p.textContent('#uu-info'); ok(/version 7/.test(inf) && new RegExp(new Date().toISOString().slice(0, 10)).test(inf), 'inspect v7 shows creation date ' + inf);
  await p.fill('#uu-check', 'c232ab00-9414-11ec-b3c8-9f6bdeced846'); ok(/version 1 .*2022-02-22 19:22:22 UTC/.test(await p.textContent('#uu-info')), 'v1 time decoded ' + await p.textContent('#uu-info'));
  await p.fill('#uu-check', 'not-a-uuid'); ok(/Not a valid UUID/.test(await p.textContent('#uu-info')), 'invalid UUID'); await p.close();

  // Hash
  p = await page('/hash-generator/');
  await p.waitForSelector('form[data-hash][data-sha256]'); ok(await p.getAttribute('form[data-hash]', 'data-sha256') === crypto.createHash('sha256').update('hello').digest('hex') && (await p.textContent('#hs-out')).includes('5d41402abc4b2a76b9719d911017c592'), 'SHA-256 and MD5 of "hello"');
  const md = await p.evaluate(() => [ETBDev.md5(''), ETBDev.md5('a'.repeat(1000)), ETBDev.md5('£ünïcødé ✓'), ETBDev.md5('x'.repeat(55)), ETBDev.md5('x'.repeat(56)), ETBDev.md5('x'.repeat(64))]);
  ok(md.join() === ['', 'a'.repeat(1000), '£ünïcødé ✓', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64)].map(s => crypto.createHash('md5').update(s).digest('hex')).join(), 'MD5 matches Node for edge lengths');
  await p.fill('#hs-t', 'The quick brown fox jumps over the lazy dog'); await p.fill('#hs-key', 'key'); await p.waitForTimeout(300);
  ok((await p.textContent('#hs-out')).includes('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8') && /HMAC-SHA-256/.test(await p.textContent('#hs-out')), 'HMAC-SHA256');
  await p.fill('#hs-key', ''); await p.setInputFiles('#hs-file', '/tmp/t27/quads.png'); const fh = crypto.createHash('sha256').update(fs.readFileSync('/tmp/t27/quads.png')).digest('hex');
  await p.waitForSelector(`form[data-hash][data-sha256="${fh}"]`); await p.fill('#hs-cmp', fh.toUpperCase()); ok(/checksum matches/.test(await p.textContent('#hs-cmp')) && await p.$('.hs-row.hit'), 'file hash and checksum match');
  await p.fill('#hs-cmp', 'deadbeef'); ok(/No match/.test(await p.textContent('#hs-cmp')), 'mismatch reported'); await p.close();

  // Timestamp
  p = await page('/unix-timestamp-converter/');
  const ts = await p.evaluate(() => [ETBDev.tsToDate('1700000000').date.toISOString(), ETBDev.tsToDate('1700000000123').unit, ETBDev.localToTs('2026-07-01T12:00', 'Europe/London'), ETBDev.localToTs('2026-12-01T12:00', 'Europe/London'), ETBDev.localToTs('2026-03-29T01:30', 'UTC')]);
  ok(ts[0] === '2023-11-14T22:13:20.000Z' && ts[1] === 'ms' && ts[2] === Date.UTC(2026, 6, 1, 11) / 1000 && ts[3] === Date.UTC(2026, 11, 1, 12) / 1000 && ts[4] === Date.UTC(2026, 2, 29, 1, 30) / 1000, 'conversions incl. BST ' + JSON.stringify(ts));
  await p.fill('#ts-in', '1782903600'); ok(/UK time.*12:00:00 BST/.test((await p.textContent('#ts-out')).replace(/\s+/g, ' ')), 'shows UK time with BST');
  await p.fill('#ts-in', 'abc'); ok(/whole number/.test(await p.textContent('#ts-out')), 'bad input message');
  await p.fill('#ts-dt', '2026-07-01T12:00'); await p.dispatchEvent('#ts-dt', 'input'); ok(await p.getAttribute('form[data-unixts]', 'data-ts') === '1782903600', 'date to timestamp');
  const now = +(await p.textContent('#ts-now')); ok(Math.abs(now - Date.now() / 1000) < 5, 'live clock'); await p.close();

  // CSV ↔ JSON
  p = await page('/csv-to-json/');
  await p.click('#cj-tojson'); let j = JSON.parse(await p.inputValue('#cj-out'));
  ok(j.length === 2 && j[0].name === 'Smith, Jane' && j[0].age === 34 && j[0].member === true && j[1].member === false, 'CSV with quoted comma and types');
  const cj = await p.evaluate(() => [JSON.stringify(ETBDev.csvToJson('a;b\n1;"x;y"\n2;"say ""hi"""')), ETBDev.jsonToCsv([{ n: 'A', addr: { city: 'Leeds', pc: 'LS1' }, tags: [1, 2] }, { n: 'B, C', extra: 'line\nbreak' }]), JSON.stringify(ETBDev.csvToJson('007,x', { header: false, types: false }))]);
  ok(cj[0] === '[{"a":"1","b":"x;y"},{"a":"2","b":"say \\"hi\\""}]', 'semicolon detection and escaped quotes ' + cj[0]);
  ok(cj[1] === 'n,addr.city,addr.pc,tags,extra\nA,Leeds,LS1,"[1,2]",\n"B, C",,,,"line\nbreak"', 'JSON→CSV flattens and quotes ' + JSON.stringify(cj[1]));
  ok(cj[2] === '[["007","x"]]', 'no headings, keep text');
  await p.click('#cj-swap'); await p.click('#cj-tocsv'); ok((await p.inputValue('#cj-out')).startsWith('name,town,age,member\n"Smith, Jane",Leeds,34,true'), 'round trip back to CSV');
  d = await dl(p, '#cj-dl'); ok(d.suggestedFilename() === 'data.csv', 'download CSV'); await p.close();

  // SQL
  p = await page('/sql-formatter/'); await p.click('#sq-run'); const sql = await p.inputValue('#sq-out'); const L = sql.split('\n');
  ok(L[0] === 'SELECT' && L[1] === '  o.id,' && L.includes('FROM orders o') && L.includes('JOIN customers c') && L.includes('  ON c.id = o.customer_id') && L.includes('LEFT JOIN items i') && L.some(l => /^  AND \(c\.country = 'UK' OR c\.vip = TRUE\)$/.test(l)) && L.includes('ORDER BY') && L.includes('LIMIT 20;'), 'formatted layout:\n' + sql);
  ok(sql.replace(/\s+/g, ' ').toLowerCase().replace(/ ?([(),;=<>*+]) ?/g, '$1') === (await p.inputValue('#sq-in')).replace(/\s+/g, ' ').toLowerCase().replace(/ ?([(),;=<>*+]) ?/g, '$1'), 'same tokens as input (only spacing/case changed)');
  await p.selectOption('#sq-mode', 'min'); ok(!(await p.inputValue('#sq-out')).includes('\n') && /^SELECT o\.id, c\.name, SUM\(i\.qty \* i\.price\) AS total FROM/.test(await p.inputValue('#sq-out')), 'minify ' + (await p.inputValue('#sq-out')).slice(0, 60));
  const sub = await p.evaluate(() => ETBDev.formatSql("select * from t where id in (select id from u where x='a -- b') -- note\n and y=1"));
  ok(/\(\n\s+SELECT/.test(sub) && /'a -- b'/.test(sub) && /-- note/.test(sub), 'subquery indented, strings and comments kept:\n' + sub); await p.close();

  // Cron
  p = await page('/cron-expression-generator/');
  ok(await p.getAttribute('form[data-cron]', 'data-text') === 'At 09:30, Monday to Friday.', 'weekday explain ' + await p.getAttribute('form[data-cron]', 'data-text'));
  const cr = await p.evaluate(() => [ETBDev.explainCron('*/15 * * * *'), ETBDev.explainCron('@monthly'), ETBDev.explainCron('0 9,17 * * sat,sun'), ETBDev.explainCron('0 0 1 jan *'), ETBDev.explainCron('5 */2 * * *'),
    (() => { try { ETBDev.explainCron('61 * * * *'); } catch (e) { return e.message; } })(), (() => { try { ETBDev.explainCron('* * *'); } catch (e) { return e.message; } })(),
    ETBDev.nextRuns('0 9 * * 1', new Date(2026, 10, 24, 10, 0), 2).map(d => d.toString().slice(0, 21)), ETBDev.nextRuns('0 0 13 * 5', new Date(2026, 10, 1), 4).map(d => d.getDate() + '/' + (d.getMonth() + 1)), ETBDev.nextRuns('0 0 29 2 *', new Date(2026, 0, 1), 1).map(d => d.getFullYear())]);
  ok(cr[0] === 'Every 15 minutes.' && cr[1] === 'At 00:00, on day 1 of the month.' && cr[2] === 'At 09:00 and 17:00, on Saturday and Sunday.' && cr[3] === 'At 00:00, on day 1 of the month, in January.' && cr[4] === 'At minute 5 past every 2 hours.', 'explanations ' + JSON.stringify(cr.slice(0, 5)));
  ok(/out of range/.test(cr[5]) && /5 parts/.test(cr[6]), 'errors');
  ok(cr[7].join('|') === 'Mon Nov 30 2026 09:00|Mon Dec 07 2026 09:00' && cr[8].join() === '6/11,13/11,20/11,27/11' && cr[9][0] === 2028, 'next runs incl. day-of-month OR weekday and leap year ' + JSON.stringify(cr.slice(7)));
  await p.click('[data-cx="*/15 * * * *"]'); ok(await p.inputValue('input[name=cmin]') === '*/15' && (await p.$$('#cr-next li')).length === 5, 'example chip fills fields and next runs');
  await p.fill('input[name=chour]', '8'); await p.fill('input[name=cmin]', '0'); ok(await p.inputValue('#cr-e') === '0 8 * * *' && await p.getAttribute('form[data-cron]', 'data-text') === 'At 08:00.', 'build from fields'); await p.close();

  // Gradient
  p = await page('/css-gradient-generator/');
  ok(await p.getAttribute('form[data-gradient]', 'data-css') === 'linear-gradient(135deg, #ff6b35 0%, #f7c948 100%)' && /^background: #ff6b35;\nbackground: linear-gradient/.test(await p.inputValue('#gr-css')), 'default CSS with fallback');
  await p.click('#gr-add'); ok((await p.$$('.gr-stop')).length === 3 && /#ffffff 50%/.test(await p.getAttribute('form[data-gradient]', 'data-css')), 'add a stop, sorted by position');
  await p.selectOption('#gr-type', 'radial'); ok(/^radial-gradient\(circle at center/.test(await p.getAttribute('form[data-gradient]', 'data-css')) && await p.isVisible('#gr-shapebox') && await p.isHidden('#gr-angbox'), 'radial options');
  await p.click('[data-pre="5"]'); ok(/^conic-gradient\(from 0deg at center, #ef4444 0%/.test(await p.getAttribute('form[data-gradient]', 'data-css')), 'preset');
  const bg = await p.$eval('#gr-preview', e => getComputedStyle(e).backgroundImage); ok(/conic-gradient/.test(bg), 'preview uses the CSS');
  await p.fill('input[name=w]', '300'); await p.fill('input[name=h]', '120'); d = await dl(p, '#gr-png'); ok(d.suggestedFilename() === 'gradient-300x120.png', 'PNG download'); await p.close();

  // Unit pages: every page's live result matches its own chart's first row
  const up = fs.readFileSync(__dirname + '/units_pages.py', 'utf8'); const slugs = [...up.matchAll(/^\s+\("([a-z0-9-]+)", "(length|weight|temperature|volume|area|speed|data|fuel)"/gm)].map(m => m[1]);
  ok(slugs.length >= 40, slugs.length + ' unit pages defined');
  let bad = [];
  for (const s of slugs) {
    const q = await page('/' + s + '/');
    const r = await q.evaluate(() => { const row = document.querySelector('.up-table tbody tr'); const a = row.children[0].textContent, want = row.children[1].textContent; const f = document.querySelector('form[data-unitpage]');
      f.elements.v.value = a.match(/[−-]?[\d,]*\.?\d+/)[0].replace('−', '-').replace(/,/g, ''); if (f.elements.v2) f.elements.v2.value = '0'; f.dispatchEvent(new Event('input')); return [a, want, document.querySelector('#up-out strong').textContent, f.getAttribute('data-result')]; });
    const num = (t) => parseFloat(t.replace(/[^\d.−-]/g, '').replace('−', '-'));
    const good = /(ft|st) [\d.]+ (in|lb)/.test(r[1]) ? r[1] === r[2] : Math.abs(num(r[1]) - +r[3]) <= Math.max(0.0005, Math.abs(+r[3]) * 0.002);
    if (!good) bad.push(s + ' ' + JSON.stringify(r));
    await q.close();
  }
  ok(bad.length === 0, 'live converter agrees with every chart ' + bad.join(' | '));
  p = await page('/stone-to-kg/'); await p.fill('#up-v', '11'); await p.fill('#up-v2', '4'); ok(Math.abs(+(await p.getAttribute('form[data-unitpage]', 'data-result')) - (11 + 4 / 14) * 6.35029318) < 1e-9 && /71\.668 kg/.test(await p.textContent('#up-out')), 'stone + pounds input');
  await p.goto(BASE + '/cm-to-feet/'); await p.fill('#up-v', '178'); ok(/5 ft 10.1 in/.test(await p.textContent('#up-out')) && /70\.1 in/.test(await p.textContent('#up-out')), 'cm to feet and inches');
  await p.goto(BASE + '/celsius-to-fahrenheit/'); await p.fill('#up-v', '−40'); ok(/−40 °F/.test(await p.textContent('#up-out')), 'negative with typographic minus');
  await p.goto(BASE + '/unit-converter/'); const links = await p.$$eval('.var-links a.pop', a => a.map(x => x.getAttribute('href'))); ok(slugs.every(s => links.includes('/' + s + '/')), 'unit converter links to every unit page');
  const sm = fs.readFileSync(__dirname + '/../sitemap.xml', 'utf8'); ok(slugs.every(s => sm.includes('/' + s + '/</loc>')) && ['regex-tester', 'css-gradient-generator'].every(s => sm.includes('/' + s + '/</loc>')), 'sitemap includes new pages'); await p.close();

  // Home links
  p = await page('/'); const home = await p.content(); ok(['regex-tester', 'base64-encode-decode', 'url-encode-decode', 'uuid-generator', 'hash-generator', 'unix-timestamp-converter', 'csv-to-json', 'sql-formatter', 'cron-expression-generator', 'css-gradient-generator'].every(s => home.includes('/' + s + '/')), 'all 10 dev tools on the homepage'); await p.close();
  const m = await b.newContext({ viewport: { width: 390, height: 844 } });
  for (const u of ['/hash-generator/', '/cron-expression-generator/', '/css-gradient-generator/', '/kg-to-stone/', '/regex-tester/']) { const mp = await m.newPage(); await mp.goto(BASE + u, { waitUntil: 'networkidle' }); await mp.waitForTimeout(300); ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal scroll on mobile ' + u); await mp.close(); }
  await m.close();
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
