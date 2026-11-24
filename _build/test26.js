// Batch 4: degree classification, final grade, Harvard referencing, lorem ipsum, find & replace, sort lines, slugs, text diff.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };

  let p = await page('/degree-classification-calculator/');
  const dg = await p.evaluate(() => { const d = ETBStudy.degree; const a = d([{ w: 0, avg: 55 }, { w: 40, avg: 62 }, { w: 60, avg: 71 }]); const bb = d([{ w: 0, avg: null }, { w: 40, avg: 65 }, { w: 60, avg: null }]);
    const m = d([{ w: 1, modules: [{ c: 20, m: 60 }, { c: 40, m: 75 }] }]); return [a.avg.toFixed(1), a.cls.name, !!a.border, bb.needed.map(n => n.need.toFixed(2)).join('/'), m.avg.toFixed(2)]; });
  // 0.4*62 + 0.6*71 = 67.4 (2:1, borderline First). Need: First (70*100-2600)/60 = 73.33; 2:1 56.67; 2:2 40; 3rd 23.33. Modules: (20*60+40*75)/60 = 70
  ok(dg.join('|') === '67.4|Upper second-class honours (2:1)|false|73.33/56.67/40.00/23.33|70.00', 'degree maths ' + dg.join('|'));
  await p.fill('.dg-year[data-y="1"] .dg-avg', '66'); await p.fill('.dg-year[data-y="2"] .dg-avg', '70'); await p.dispatchEvent('.dg-year[data-y="2"] .dg-avg', 'input');
  ok(await p.getAttribute('form[data-degree]', 'data-avg') === '68.4' && /within 2% of a <strong>First/.test(await p.innerHTML('#dg-out')), 'UI average 68.4 with borderline First note');
  await p.fill('.dg-year[data-y="2"] .dg-avg', ''); await p.dispatchEvent('.dg-year[data-y="2"] .dg-avg', 'input'); ok(/What you need in final year/.test(await p.textContent('#dg-out')) && /72.7%/.test(await p.textContent('#dg-out')), 'shows what is needed for a First (72.7%)');
  await p.click('.dg-year[data-y="1"] .dg-mods-btn'); await p.fill('.dg-year[data-y="1"] .dg-mod:nth-of-type(2) .dg-m', '50'); await p.fill('.dg-year[data-y="1"] .dg-mod:nth-of-type(3) .dg-m', '80'); await p.dispatchEvent('.dg-year[data-y="1"] .dg-mod:nth-of-type(3) .dg-m', 'input');
  ok(await p.inputValue('.dg-year[data-y="1"] .dg-avg') === '65', 'module marks give the year average');
  await p.close();

  p = await page('/final-grade-calculator/'); ok(await p.getAttribute('form[data-final]', 'data-needed') === '77.5', 'final grade 77.5% example');
  await p.fill('#fg-t', '95'); ok(/More than 100%/.test(await p.textContent('#fg-out')), 'impossible target flagged'); await p.close();

  p = await page('/harvard-referencing-generator/');
  const hv = await p.evaluate(() => [ETBStudy.cite('book', { authors: 'Jane A. Smith\nPeter Jones', year: '2020', title: 'Understanding research', edition: '2', place: 'London', publisher: 'Sage' }),
    ETBStudy.cite('journal', { authors: 'Ravi Patel', year: '2023', title: 'Remote work and wellbeing', journal: 'Journal of Occupational Psychology', volume: '96', issue: '2', pages: '145-167', doi: 'https://doi.org/10.1111/joop.12345' }),
    ETBStudy.cite('website', { authors: 'NHS', org: true, year: '2024', title: 'Healthy weight', url: 'https://www.nhs.uk/', accessed: '2026-11-14' }),
    ETBStudy.cite('book', { authors: 'A Ab\nB Bb\nC Cc\nD Dd', year: '2019', title: 'T', publisher: 'P' })]);
  ok(hv[0].text === 'Smith, J.A. and Jones, P. (2020) Understanding research. 2nd edn. London: Sage.' && /<i>Understanding research<\/i>/.test(hv[0].html) && hv[0].intext === '(Smith and Jones, 2020)', 'book reference ' + hv[0].text);
  ok(hv[1].text === "Patel, R. (2023) 'Remote work and wellbeing', Journal of Occupational Psychology, 96(2), pp. 145–167. Available at: https://doi.org/10.1111/joop.12345.", 'journal reference ' + hv[1].text);
  ok(hv[2].text === 'NHS (2024) Healthy weight. Available at: https://www.nhs.uk/ (Accessed: 14 November 2026).' && hv[2].intext === '(NHS, 2024)', 'website reference ' + hv[2].text);
  ok(hv[3].intext === '(Ab et al., 2019)', 'four authors → et al. ' + hv[3].intext);
  await p.fill('#hv-auth', 'Mary Beard'); await p.fill('#hv-year', '2015'); await p.fill('#hv-title', 'SPQR'); await p.fill('#hv-pub', 'Profile'); await p.click('#hv-add');
  await p.fill('#hv-auth', 'Alan Turing'); await p.fill('#hv-title', 'Computing'); await p.click('#hv-add');
  ok((await p.$$eval('#hv-list li', l => l.map(x => x.textContent.slice(0, 6)))).join('|') === 'Beard,|Turing', 'reference list sorted A–Z');
  await p.reload({ waitUntil: 'networkidle' }); ok((await p.$$('#hv-list li')).length === 2, 'reference list saved');
  await p.close();

  p = await page('/lorem-ipsum-generator/');
  const lo = await p.evaluate(() => [ETBText.lorem('words', 50, true)[0].split(' ').length, ETBText.lorem('paragraphs', 4, true).length, ETBText.lorem('sentences', 3, true)[0].startsWith('Lorem ipsum dolor sit amet')]);
  ok(lo.join() === '50,4,true', 'lorem counts ' + lo); await p.check('input[name=html]'); ok(/^<p>Lorem ipsum/.test(await p.inputValue('#lo-out')), 'HTML paragraphs'); await p.close();

  p = await page('/find-and-replace-text/'); ok(await p.getAttribute('form[data-findrep]', 'data-count') === '2' && (await p.$$('#fr-prev mark')).length === 2, 'two matches highlighted');
  await p.click('#fr-go'); ok(await p.inputValue('#fr-text') === 'The quick brown fox jumps over the lazy cat. The cat sleeps.', 'replace all');
  const fr = await p.evaluate(() => [ETBText.replaceAll('a1 b22 c333', '(\\w)(\\d+)', '$2$1', { regex: true }).text, ETBText.replaceAll('cat Cat category', 'cat', 'X', { word: true }).text, ETBText.replaceAll('a.b.c', '.', '-', {}).text]);
  ok(fr.join('|') === '1a 22b 333c|X X category|a-b-c', 'regex groups, whole words, literal dots ' + fr.join('|'));
  await p.check('input[name=regex]'); await p.fill('#fr-find', '('); ok(/isn't valid/.test(await p.textContent('#fr-msg')), 'bad regex message'); await p.close();

  p = await page('/sort-lines-remove-duplicates/'); ok(await p.inputValue('#so-out') === 'Apple\nbanana\ncherry\nitem 2\nitem 10', 'sort A–Z, dedupe case-insensitive, natural numbers: ' + JSON.stringify(await p.inputValue('#so-out')));
  await p.selectOption('#so-sort', 'none'); await p.uncheck('input[name=ci]'); ok(await p.inputValue('#so-out') === 'banana\nApple\ncherry\napple\nitem 10\nitem 2', 'keep order, case-sensitive dedupe'); await p.close();

  p = await page('/slug-generator/'); ok(await p.getAttribute('form[data-slug]', 'data-slug') === '10-best-cafes-in-manchester-a-locals-guide', 'slug with accents and apostrophe');
  const sg = await p.evaluate(() => [ETBText.slugify('How to Write a CV & Cover Letter', { stop: true }), ETBText.slugify('Über Straße', {}), ETBText.slugify('one two three four five', { max: 12 })]);
  ok(sg.join('|') === 'write-cv-cover-letter|uber-strasse|one-two', 'slug options ' + sg.join('|')); await p.close();

  p = await page('/text-diff-checker/'); ok(await p.getAttribute('form[data-diff]', 'data-added') === '2' && await p.getAttribute('form[data-diff]', 'data-removed') === '1', 'diff counts');
  ok(/<del>Monday<\/del>/.test(await p.innerHTML('#df-out')) && /<ins>Tuesday<\/ins>/.test(await p.innerHTML('#df-out')), 'word-level highlights');
  await p.fill('#df-b', await p.inputValue('#df-a')); await p.dispatchEvent('#df-b', 'change'); ok(/identical/.test(await p.textContent('#df-msg')), 'identical texts');
  ok(await p.evaluate(() => ETBText.diff('A\nB', 'a\nb', { ci: true }).same), 'ignore case option'); await p.close();

  for (const u of ['/degree-classification-calculator/', '/final-grade-calculator/', '/harvard-referencing-generator/', '/lorem-ipsum-generator/', '/find-and-replace-text/', '/sort-lines-remove-duplicates/', '/slug-generator/', '/text-diff-checker/']) {
    const m = await b.newPage({ viewport: { width: 390, height: 800 } }); await m.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, u + ' fits a phone (' + sw + ')'); await m.close(); }
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
