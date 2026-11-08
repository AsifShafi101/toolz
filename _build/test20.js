// Spanish and Arabic sections: language attributes, hreflang, switcher, no English left on screen
// (including messages scripts add after you use a tool), and every translated tool still works.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
const W = '/home/claude/wmtest/', IMG = '/home/claude/toolz/assets/og.png';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ES = { 'merge-pdf': 'unir-pdf', 'compress-pdf': 'comprimir-pdf', 'split-pdf': 'dividir-pdf', 'jpg-to-pdf': 'jpg-a-pdf', 'pdf-to-jpg': 'pdf-a-jpg',
  'image-compressor': 'comprimir-imagen', 'image-resizer': 'redimensionar-imagen', 'png-to-jpg': 'png-a-jpg', 'qr-code-generator': 'generador-codigo-qr', 'bmi-calculator': 'calculadora-imc' };
const ALLOW = new Set('PDF PDFs JPG JPEG PNG WebP SVG QR A4 Letter px cm kg lb st KB MB etoolbox e tool box co uk Pro PRO Google Instagram Facebook WhatsApp LinkedIn X NHS BMI Mac Windows Chromebook iPhone Android https www auto ES EN English Español hello yourbusiness com og pdf jpg png webp docx'.split(' '));
const EN = new Set(`the and your you to of for with this is are it on in or file files page pages image images download choose drop here free tools search more home contact privacy terms share copy link email result results quality size add from by at be will can upload uploaded never device browser healthy weight height merge compress split convert resize background code high low medium what how why which when does do we our us yes processed ready appear keep text after before one all any every feet inches pounds stone kilograms centimetres tips chart gauge working done helpful thanks`.split(' '));

async function leftover(p, lang) {
  return p.evaluate(({ lang, allow, en }) => {
    const A = new Set(allow), E = new Set(en), bad = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      const el = n.parentElement; if (!el || el.closest('script,style,code,.file-name,.img-info strong,[hidden],.fad,.search-results,.lang-menu')) continue;
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      for (const x of (n.nodeValue.match(/\p{L}+(?:'\p{L}+)?/gu) || []).filter(x => /^[A-Za-z']+$/.test(x))) {
        if (lang === 'ar' ? !A.has(x) && !/^[A-Z]+$/.test(x) : E.has(x.toLowerCase())) bad.add(x);
      }
    }
    document.querySelectorAll('[placeholder],[aria-label],[title],img[alt]').forEach(el => ['placeholder', 'aria-label', 'title', 'alt'].forEach(a => {
      const v = el.getAttribute(a); if (!v || el.closest('.lang-menu,.share-bar a[data-net]')) return;
      for (const x of (v.match(/[A-Za-z]+/g) || [])) if (lang === 'ar' ? !A.has(x) && !/^[A-Z]+$/.test(x) : E.has(x.toLowerCase())) bad.add(a + ':' + x);
    }));
    return [...bad];
  }, { lang, allow: [...ALLOW], en: [...EN] });
}

(async () => {
  const b = await chromium.launch();
  const page = async (u) => { const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.errs = [];
    p.on('pageerror', e => p.errs.push(e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  const path = (lang, s) => lang === 'es' ? `/es/${ES[s]}/` : `/ar/${s}/`;

  for (const lang of ['es', 'ar']) {
    // every page: lang/dir, hreflang, no English, no script errors
    for (const s of [''].concat(Object.keys(ES))) {
      const u = s ? path(lang, s) : `/${lang}/`, p = await page(u);
      const info = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, hl: [...document.querySelectorAll('link[hreflang]')].map(l => l.hreflang).join(','),
        canon: document.querySelector('link[rel=canonical]').href }));
      ok(info.lang === lang && info.dir === (lang === 'ar' ? 'rtl' : 'ltr') && info.hl === 'en-GB,es,ar,x-default' && info.canon.endsWith(u), `${u} lang=${info.lang} dir=${info.dir} hreflang`);
      const left = await leftover(p, lang); ok(!left.length, `${u} no English on screen ${left.join(' ')}`);
      ok(!p.errs.length, `${u} no script errors ${p.errs.join(' | ')}`);
      await p.close();
    }
    const say = (p, sel, re, m) => p.waitForFunction(([sel, re]) => new RegExp(re).test((document.querySelector(sel) || {}).textContent || ''), [sel, re.source], { timeout: 20000 }).then(() => ok(true, m), () => ok(false, m));

    // merge
    let p = await page(path(lang, 'merge-pdf'));
    await p.setInputFiles('#pdf-input', [W + 'clean.pdf', W + 'annot.pdf']); await p.click('#run');
    await say(p, '#pdf-out', lang === 'es' ? /Listo\..*2 archivos|1 archivo listo/ : /تم\./, `${lang} merge works and reports in ${lang}`);
    let left = await leftover(p, lang); ok(!left.length, `${lang} merge result has no English ${left.join(' ')}`); await p.close();
    // split with a bad range -> translated error
    p = await page(path(lang, 'split-pdf'));
    await p.setInputFiles('#pdf-input', W + 'clean.pdf'); await p.fill('input[name=pages]', '99'); await p.click('#run');
    await say(p, '#pdf-msg', lang === 'es' ? /Las páginas deben estar entre 1 y \d+/ : /يجب أن تكون أرقام الصفحات بين 1 و\d+/, `${lang} split error message translated`);
    await p.fill('input[name=pages]', lang === 'ar' ? '1،1' : '1'); await p.click('#run');
    await say(p, '#pdf-out', lang === 'es' ? /Listo/ : /تم/, `${lang} split extracts a page${lang === 'ar' ? ' (Arabic comma accepted)' : ''}`); await p.close();
    // compress
    p = await page(path(lang, 'compress-pdf'));
    await p.setInputFiles('#pdf-input', W + 'overlay.pdf'); await p.click('#run');
    await say(p, '#pdf-out', lang === 'es' ? /(más pequeño|conservado el original)/ : /(أصغر بنسبة|احتفظنا بالملف الأصلي)/, `${lang} compress note translated`); await p.close();
    // images -> PDF and PDF -> images
    p = await page(path(lang, 'jpg-to-pdf')); await p.setInputFiles('#pdf-input', IMG); await p.click('#run');
    await say(p, '#pdf-out', lang === 'es' ? /Listo/ : /تم/, `${lang} JPG to PDF works`); await p.close();
    p = await page(path(lang, 'pdf-to-jpg')); await p.setInputFiles('#pdf-input', W + 'clean.pdf'); await p.click('#run');
    await say(p, '#pdf-out', lang === 'es' ? /Listo/ : /تم/, `${lang} PDF to JPG works`); left = await leftover(p, lang); ok(!left.length, `${lang} PDF to JPG result no English ${left.join(' ')}`); await p.close();
    // image tools
    for (const s of ['image-compressor', 'image-resizer', 'png-to-jpg']) {
      p = await page(path(lang, s)); if (s === 'image-resizer') await p.fill('input[name=width]', '300');
      await p.setInputFiles('#img-input', IMG); await p.waitForSelector('#img-results[data-done] .img-item a', { timeout: 20000 }).catch(() => {});
      const t = await p.textContent('#img-results'); ok(/(Descargar|تنزيل)/.test(t), `${lang} ${s} works and shows a translated download button ${/(Descargar|تنزيل)/.test(t) ? "" : t.slice(0, 200)}`);
      left = await leftover(p, lang); ok(!left.length, `${lang} ${s} result no English ${left.join(' ')}`); await p.close();
    }
    // QR
    p = await page(path(lang, 'qr-code-generator')); await p.fill('input[name=url]', 'etoolbox.co.uk/es/'); await p.waitForSelector('#qr-canvas:not([hidden])');
    ok(true, `${lang} QR code drawn`); await p.fill('input[name=url]', 'x'.repeat(3500)); await p.waitForTimeout(400);
    const warn = await p.textContent('#qr-warn'); ok(lang === 'es' ? /demasiada información/.test(warn) : /أكثر مما يتسع/.test(warn), `${lang} QR "too long" warning translated: ${warn}`); await p.close();
    // BMI
    p = await page(path(lang, 'bmi-calculator'));
    await p.check('input[name=hunit][value=cm]', { force: true }); await p.fill('#cm', '170'); await p.fill('#kg', '82.5'); await p.waitForTimeout(1300);
    const out = await p.textContent('#calc-out'), adv = await p.textContent('#bmi-advice'), chip = await p.textContent('#bmi-chip'), big = await p.textContent('#bmi-big');
    ok(lang === 'es' ? /Tu IMC/.test(out) && /Sobrepeso/.test(out) && /28,5/.test(out) : /مؤشر كتلة جسمك/.test(out) && /وزن زائد/.test(out) && /28\.5/.test(out), `${lang} BMI result translated (${out.replace(/\s+/g, ' ').slice(0, 90)})`);
    ok(lang === 'es' ? big === '28,5' && /Muévete más/.test(adv) && chip === 'Sobrepeso' : big === '28.5' && /تحرّك أكثر/.test(adv) && chip === 'وزن زائد', `${lang} BMI gauge, chip and advice translated (${big}, ${chip})`);
    left = await leftover(p, lang); ok(!left.length, `${lang} BMI page after result has no English ${left.join(' ')}`); await p.close();
    // search finds translated tools and links to the translated page
    p = await page(`/${lang}/`); await p.fill('#hero-search', lang === 'es' ? 'unir' : 'دمج'); await p.waitForTimeout(300);
    const href = await p.getAttribute('#hero-results li a', 'href'); ok(href === path(lang, 'merge-pdf'), `${lang} search links to translated page (${href})`);
    await p.fill('#hero-search', 'merge'); await p.waitForTimeout(300);
    ok(await p.getAttribute('#hero-results li a', 'href') === path(lang, 'merge-pdf'), `${lang} English search words still find translated tools`); await p.close();
  }
  // switcher on English pages
  let p = await page('/merge-pdf/');
  const links = await p.$$eval('.lang-menu a', as => as.map(a => a.getAttribute('href')));
  ok(links.join(',') === '/merge-pdf/,/es/unir-pdf/,/ar/merge-pdf/', `English tool page switcher links to translations (${links})`);
  await p.click('.lang-menu summary'); ok(await p.isVisible('.lang-menu ul'), 'switcher opens'); await p.click('h1'); ok(!(await p.isVisible('.lang-menu ul')), 'switcher closes on outside click');
  await p.close(); p = await page('/vat-calculator/');
  ok((await p.$$eval('.lang-menu a', as => as.map(a => a.getAttribute('href')))).join(',') === '/,/es/,/ar/', 'untranslated page switcher points to language homepages');
  ok(!(await p.$('link[hreflang]')), 'untranslated page has no hreflang'); await p.close();
  // RTL page has no sideways scroll on a phone
  for (const u of ['/ar/', '/ar/bmi-calculator/', '/ar/merge-pdf/', '/es/']) {
    p = await b.newPage({ viewport: { width: 390, height: 800 } }); await p.goto(BASE + u, { waitUntil: 'networkidle' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 391, `${u} fits a phone screen (scrollWidth ${sw})`); await p.close();
  }
  await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
