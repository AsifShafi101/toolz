const { chromium } = require('playwright');
const { PDFDocument, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
async function textPerPage(buf) {
  const pdfjs = await import('/home/claude/vendor/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const d = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise; const out = [];
  for (let i = 1; i <= d.numPages; i++) { const t = await (await d.getPage(i)).getTextContent(); out.push(t.items.map(x => x.str).join(' ')); }
  return out;
}
(async () => {
  const doc = await PDFDocument.create(); const f = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 3; i++) { const p = doc.addPage(i === 2 ? [842, 595] : [595, 842]); p.drawText('Page body ' + (i + 1), { x: 50, y: 500, size: 20, font: f }); if (i === 1) p.setRotation(degrees(90)); }
  fs.mkdirSync('/tmp/wm', { recursive: true }); fs.writeFileSync('/tmp/wm/in.pdf', await doc.save());
  const BASE = process.env.BASE || 'http://localhost:8765';
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/add-watermark-to-pdf/');
  await p.setInputFiles('#wm-input', '/tmp/wm/in.pdf');
  await p.waitForSelector('#wm-preview[data-ready="1"] canvas', { timeout: 30000 });
  ok(true, 'pdf preview rendered');
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  let buf = fs.readFileSync(await dl.path()); let txt = await textPerPage(buf);
  ok(txt.length === 3 && txt.every(t => /CONFIDENTIAL/.test(t)), 'all 3 pages have CONFIDENTIAL: ' + JSON.stringify(txt).slice(0, 160));
  ok(/watermarked\.pdf$/.test(dl.suggestedFilename()), 'filename ' + dl.suggestedFilename());
  // tiled + range page 2 only, preset DRAFT
  await p.click('[data-preset="DRAFT"]'); await p.selectOption('#position', 'tile'); await p.selectOption('#pages', 'some'); await p.fill('#range', '2');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  txt = await textPerPage(fs.readFileSync(await dl.path()));
  const n2 = (txt[1].match(/DRAFT/g) || []).length;
  ok(!/DRAFT/.test(txt[0]) && n2 >= 1 && !/DRAFT/.test(txt[2]), 'tiled DRAFT only on page 2 (' + n2 + ' tiles)');
  await p.screenshot({ path: '/home/claude/build/shots/wm-pdf.png', fullPage: false });
  // flatten
  await p.selectOption('#pages', 'all'); await p.check('input[name=flatten]');
  [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#run')]);
  buf = fs.readFileSync(await dl.path()); txt = await textPerPage(buf);
  const fd = await PDFDocument.load(buf);
  ok(fd.getPageCount() === 3 && txt.every(t => !t.trim()), 'flattened: 3 pages, no selectable text');
  ok(Math.round(fd.getPage(1).getWidth()) === 842, 'flattened rotated page displayed landscape (w=' + fd.getPage(1).getWidth() + ')');
  // logo watermark
  await p.uncheck('input[name=flatten]');
  const mk = async (pg, w, h, col, type) => Buffer.from(await pg.evaluate(([w, h, col, type]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(w / 4, h / 4, w / 2, h / 2); return Array.from(atob(c.toDataURL(type, 0.9).split(',')[1]), ch => ch.charCodeAt(0)); }, [w, h, col, type]));
  await p.setInputFiles('#logo-input', [{ name: 'logo.png', mimeType: 'image/png', buffer: await mk(p, 300, 120, '#1d4ed8', 'image/png') }]);
  await p.waitForFunction(() => document.querySelector('input[name=wtype][value=image]').checked);
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  buf = fs.readFileSync(await dl.path());
  ok(buf.length > 2000 && (await PDFDocument.load(buf)).getPageCount() === 3 && (await PDFDocument.load(buf)).getPage(0).node.Resources().toString().includes('XObject'), 'logo watermark PDF ' + buf.length + ' bytes');
  ok(!errs.length, 'no page errors ' + errs.join('; '));

  // images
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto(BASE + '/add-watermark-to-image/');
  await q.setInputFiles('#wm-input', [{ name: 'car.jpg', mimeType: 'image/jpeg', buffer: await mk(q, 480, 360, '#336699', 'image/jpeg') }, { name: 'shop.png', mimeType: 'image/png', buffer: await mk(q, 800, 600, '#993333', 'image/png') }]);
  await q.waitForSelector('#wm-preview[data-ready="1"] canvas');
  ok((await q.textContent('#wm-count')).includes('2 images'), 'two images selected');
  await q.click('#run'); await q.waitForSelector('#wm-results li:nth-child(2)');
  ok(await q.isVisible('#dl-all'), 'zip button visible');
  const [z] = await Promise.all([q.waitForEvent('download'), q.click('#dl-all')]);
  ok(fs.statSync(await z.path()).size > 5000, 'zip size ' + fs.statSync(await z.path()).size);
  // pixel check: watermark changed the pixels vs original
  const diff = await q.evaluate(async () => {
    const links = document.querySelectorAll('#wm-results a'), out = [];
    for (const a of links) { const im = await createImageBitmap(await (await fetch(a.href)).blob()); const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
      // count pixels that are no longer the two original flat colours (watermark text)
      const d = x.getImageData(0, 0, im.width, im.height).data; let changed = 0; for (let i = 0; i < d.length; i += 4) { const flat = (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) || (Math.abs(d[i] - 0x33) < 8 && Math.abs(d[i + 1] - 0x66) < 8 && Math.abs(d[i + 2] - 0x99) < 8) || (Math.abs(d[i] - 0x99) < 8 && Math.abs(d[i + 1] - 0x33) < 8 && Math.abs(d[i + 2] - 0x33) < 8); if (!flat) changed++; }
      out.push([im.width, im.height, a.download, changed / (d.length / 4)]); }
    return out;
  });
  ok(diff[0][0] === 480 && diff[0][1] === 360 && diff[1][0] === 800 && /png$/.test(diff[1][2]) && /jpg$/.test(diff[0][2]), 'outputs keep size and format ' + JSON.stringify(diff));
  ok(diff.every(d => d[3] > 0.02), 'watermark visibly changed pixels ' + diff.map(d => d[3].toFixed(3)));
  await q.screenshot({ path: '/home/claude/build/shots/wm-img.png' });
  ok(!errs.length, 'no page errors ' + errs.join('; '));

  // ---- Homepage redesign + SEO
  const h = await ctx.newPage(); const herr = []; h.on('pageerror', e => herr.push(e.message)); h.on('console', m => { if (m.type() === 'error') herr.push(m.text()); });
  await h.goto(BASE + '/?q=watermark');
  await h.waitForSelector('#hero-results:not([hidden]) li');
  const hr = await h.$$eval('#hero-results li a', as => as.map(a => a.getAttribute('href')));
  ok(hr.includes('/add-watermark-to-pdf/') && hr.includes('/add-watermark-to-image/'), '?q= search finds both watermark tools ' + hr);
  await h.fill('#hero-search', 'remove bg'); await h.waitForTimeout(100);
  ok((await h.$$eval('#hero-results li a', as => as.map(a => a.getAttribute('href'))))[0] === '/background-remover/', '"remove bg" → background remover');
  await h.click('.tab[data-filter="images"]');
  const vis = await h.$$eval('.cat[data-cat]', cs => cs.filter(c => !c.hidden).map(c => c.dataset.cat));
  ok(vis.length === 1 && vis[0] === 'images', 'tab filter shows only images ' + vis);
  await h.click('.tab[data-filter="all"]');
  ok((await h.$$eval('.cat[data-cat]', cs => cs.filter(c => !c.hidden).length)) === 11, 'All shows every category');
  const iconOk = await h.evaluate(async () => { const r = await fetch('/assets/icons.svg'); const t = await r.text(); const ids = [...document.querySelectorAll('use')].map(u => u.getAttribute('href').split('#')[1]); return ids.length > 50 && ids.every(id => t.includes('id="' + id + '"')); });
  ok(iconOk, 'every icon used on the homepage exists in the sprite');
  const seo = await h.evaluate(() => ({ og: document.querySelector('meta[property="og:image"]').content, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)), dir: document.querySelectorAll('.directory a').length, h1: document.querySelectorAll('h1').length }));
  ok(/og\.png$/.test(seo.og) && seo.h1 === 1, 'og:image and a single h1');
  const graph = seo.ld.find(x => x['@graph']);
  ok(graph && graph['@graph'].some(n => n['@type'] === 'WebSite' && n.potentialAction) && seo.ld.some(x => x['@type'] === 'FAQPage'), 'WebSite SearchAction + FAQ schema on homepage');
  ok(seo.dir >= 80, 'footer directory links ' + seo.dir);
  const og = await h.request.get(BASE + '/assets/og.png'); ok(og.ok() && (await og.body()).length > 20000, 'og.png served');
  await h.goto(BASE + '/add-watermark-to-pdf/');
  const bc = await h.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(x => x['@type'] === 'BreadcrumbList'));
  ok(bc && bc.itemListElement.length === 3 && bc.itemListElement[2].item.endsWith('/add-watermark-to-pdf/'), 'BreadcrumbList on tool page');
  ok(await h.isVisible('nav.crumbs'), 'visible breadcrumbs');
  const sm = await (await h.request.get(BASE + '/sitemap.xml')).text();
  ok(sm.includes('/add-watermark-to-pdf/') && sm.includes('/add-watermark-to-image/') && /<lastmod>\d{4}-\d\d-\d\d<\/lastmod>/.test(sm), 'sitemap includes new tools with lastmod');
  ok(!herr.length, 'homepage has no errors ' + herr.join('; '));
  if (BASE.includes('8787')) {
    const hd = await h.request.get(BASE + '/background-remover/');
    ok(hd.headers()['cross-origin-opener-policy'] === 'same-origin' && hd.headers()['cross-origin-embedder-policy'] === 'credentialless', 'background remover is cross-origin isolated (threads)');
  }
  await h.setViewportSize({ width: 1280, height: 900 }); await h.goto(BASE + '/'); await h.screenshot({ path: '/home/claude/build/shots/home.png' });
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED'); process.exit(fail ? 1 : 0);
})();
