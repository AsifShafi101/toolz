// Batch 5: add text, meme, collage, favicon, Instagram grid, social resizer, SVG to PNG, colour palette.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765';
const D = '/tmp/t27/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const errs = [];
  const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ' ' + e.message)); await p.goto(BASE + u, { waitUntil: 'networkidle' }); return p; };
  const dl = async (p, sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); return d; };
  const unzip = async (p, d) => { const buf = fs.readFileSync(await d.path()).toString('base64'); return p.evaluate(b64 => { const u = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const z = fflate.unzipSync(u); const o = {}; Object.keys(z).forEach(k => o[k] = z[k].length ? Array.from(z[k].slice(0, 64)) : []); return o; }, buf); };
  const imgSize = async (p, d) => { const b64 = fs.readFileSync(await d.path()).toString('base64'); return p.evaluate(b64 => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth + 'x' + i.naturalHeight); i.src = 'data:image/*;base64,' + b64; }), b64); };

  // Add text
  let p = await page('/add-text-to-image/');
  await p.setInputFiles('#tx-input', D + 'quads.png'); await p.waitForSelector('form[data-addtext][data-ready]');
  ok(await p.isVisible('#tx-view') && (await p.$$('.tx-layer')).length === 1, 'image loads with one text layer');
  await p.fill('#tx-text', 'Hello UK'); ok((await p.textContent('.tx-layer.on')).includes('Hello UK'), 'layer label follows the text');
  await p.locator('#tx-view').scrollIntoViewIfNeeded(); const before = await p.evaluate(() => ETBTextLayers()[0]); const box = await p.locator('#tx-view').boundingBox();
  const sx = box.x + before.x / 800 * box.width, sy = box.y + before.y / 600 * box.height;
  await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx + 100, sy + 120, { steps: 5 }); await p.mouse.up();
  const after = await p.evaluate(() => ETBTextLayers()[0]); ok(after.y > before.y + 100 && after.x > before.x + 80, 'drag moves text ' + JSON.stringify([before, after]));
  await p.click('#tx-add'); ok((await p.$$('.tx-layer')).length === 2, 'second text layer');
  let d = await dl(p, '#tx-dl'); ok(/quads-text\.jpg$/.test(d.suggestedFilename()) && await imgSize(p, d) === '800x600', 'downloads full-size JPG');
  const px = await p.evaluate(() => { const c = document.getElementById('tx-view'); return Array.from(c.getContext('2d').getImageData(5, 5, 1, 1).data.slice(0, 3)); });
  ok(px[0] > 200 && px[1] < 40, 'photo still drawn under text'); await p.close();

  // Meme
  p = await page('/meme-generator/');
  await p.setInputFiles('#mm-input', D + 'quads.png'); await p.waitForSelector('form[data-meme][data-ready]');
  await p.fill('#mm-top', 'top words'); await p.fill('#mm-bottom', 'bottom words');
  d = await dl(p, '#mm-dl'); ok(await p.getAttribute('form[data-meme]', 'data-saved') === '800x600' && /meme\.jpg$/.test(d.suggestedFilename()), 'classic meme same size as photo');
  const white = await p.evaluate(() => { const c = document.createElement('canvas'), i = document.createElement('canvas'); i.width = 400; i.height = 300; const x = i.getContext('2d'); x.fillStyle = '#f00'; x.fillRect(0, 0, 400, 300);
    ETBImg.renderMeme(c, i, { top: 'A VERY LONG CAPTION THAT SHOULD WRAP ONTO SEVERAL LINES WITHOUT OVERFLOWING THE PICTURE', bottom: '', style: 'caption' }); return [c.width, c.height > 300, Array.from(c.getContext('2d').getImageData(2, 2, 1, 1).data.slice(0, 3))]; });
  ok(white[0] === 400 && white[1] && white[2].join() === '255,255,255', 'caption style adds a white bar above');
  await p.selectOption('#mm-style', 'caption'); ok(await p.isHidden('#mm-bottom-row') && (await p.textContent('#mm-top-label')) === 'Caption', 'caption style hides bottom text'); await p.close();

  // Collage
  p = await page('/photo-collage-maker/');
  ok(/0 of 4 photos/.test(await p.textContent('#cl-count')), 'empty 2x2 layout');
  await p.setInputFiles('#cl-input', [D + 'quads.png', D + 'big.png', D + 'quads.png']); await p.waitForSelector('form[data-collage][data-photos="3"]');
  ok(/3 of 4 photos/.test(await p.textContent('#cl-count')), 'three photos placed');
  await p.selectOption('#cl-size', 'story'); d = await dl(p, '#cl-dl'); ok(await p.getAttribute('form[data-collage]', 'data-saved') === '1080x1920' && await imgSize(p, d) === '1080x1920', 'story collage 1080x1920');
  const gapPx = await p.evaluate(() => { const c = document.getElementById('cl-view'); return Array.from(c.getContext('2d').getImageData(1, 1, 1, 1).data.slice(0, 3)).join(); });
  ok(gapPx === '255,255,255', 'background shows in spacing'); await p.close();

  // Favicon
  p = await page('/favicon-generator/');
  ok((await p.$$('#fv-prev canvas')).length === 4 && /favicon\.ico/.test(await p.inputValue('#fv-code')), 'preview sizes and HTML snippet');
  d = await dl(p, '#fv-dl'); const fz = await unzip(p, d);
  ok(['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'site.webmanifest', 'favicon-html.txt'].every(k => fz[k]), 'ZIP has every file ' + Object.keys(fz).join(','));
  ok(fz['favicon.ico'].slice(0, 6).join() === '0,0,1,0,3,0' && fz['favicon.ico'][6] === 16 && fz['favicon.ico'][22] === 32 && fz['favicon.ico'][38] === 48, 'ICO header has 16/32/48 entries');
  ok(fz['apple-touch-icon.png'].slice(1, 4).join() === '80,78,71', 'PNG icons are real PNGs');
  const man = await p.evaluate(() => window.ETBFavicon.build().then(f => JSON.parse(new TextDecoder().decode(f['site.webmanifest']))));
  ok(man.name === 'My website' && man.icons.length === 2 && man.theme_color === '#ff6b35', 'webmanifest content');
  await p.selectOption('#fv-mode', 'image'); ok(await p.isVisible('#fv-input + *') || await p.isVisible('[data-fv="image"]'), 'image mode shows logo upload');
  await p.setInputFiles('#fv-input', D + 'icon.svg'); await p.waitForTimeout(400);
  const fc = await p.evaluate(() => Array.from(document.querySelector('#fv-prev figure:last-child canvas').getContext('2d').getImageData(90, 90, 1, 1).data.slice(0, 3)).join());
  ok(fc === '18,52,86', 'SVG logo drawn into icon ' + fc); await p.close();

  // Instagram grid
  p = await page('/instagram-grid-splitter/');
  await p.setInputFiles('#ig-input', D + 'quads.png'); await p.waitForSelector('form[data-iggrid][data-ready]');
  ok(/9 posts of 1080 × 1350/.test(await p.textContent('#ig-note')), 'default 3x3 portrait tiles');
  await p.selectOption('#ig-rows', '2'); await p.selectOption('#ig-shape', '1');
  d = await dl(p, '#ig-dl'); const gz = await unzip(p, d); const names = Object.keys(gz).sort();
  ok(names.length === 6 && names[0] === 'quads-post-01.jpg' && names[5] === 'quads-post-06.jpg', '6 numbered tiles ' + names.join(','));
  const order = await p.evaluate(async (b64) => {
    const z = fflate.unzipSync(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    const col = async (n) => { const bm = await createImageBitmap(new Blob([z[n]], { type: 'image/jpeg' })); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return [bm.width + 'x' + bm.height, Array.from(x.getImageData(540, 540, 1, 1).data.slice(0, 3))]; };
    return [await col('quads-post-01.jpg'), await col('quads-post-06.jpg')]; }, fs.readFileSync(await d.path()).toString('base64'));
  // 6 tiles 3x2 cropped from 800x600 → 3240x2160 cover. Post 01 = bottom-right (yellow); post 06 = top-left (red).
  ok(order[0][0] === '1080x1080' && order[0][1][0] > 200 && order[0][1][1] > 180 && order[0][1][2] < 90 && order[1][1][0] > 200 && order[1][1][1] < 60, 'post 01 is bottom-right, post 06 top-left ' + JSON.stringify(order)); await p.close();

  // Social resizer
  p = await page('/social-media-image-resizer/');
  await p.setInputFiles('#sm-input', D + 'quads.png'); await p.waitForSelector('form[data-social][data-ready]');
  ok((await p.$$('.sm-card')).length === 16 && (await p.$$('.sm-thumb canvas')).length === 16, '16 presets with previews');
  d = await dl(p, '#sm-dl'); ok(/instagram-post-square-1080x1080\.jpg$/.test(d.suggestedFilename()) && await imgSize(p, d) === '1080x1080', 'single preset downloads as one image ' + d.suggestedFilename());
  await p.check('.sm-card input[value="11"]'); await p.check('.sm-card input[value="7"]');
  d = await dl(p, '#sm-dl'); const sz = Object.keys(await unzip(p, d));
  ok(sz.length === 3 && sz.some(n => /youtube-thumbnail-1280x720/.test(n)) && sz.some(n => /x-twitter-header-1500x500/.test(n)), 'multiple sizes in ZIP ' + sz.join(','));
  await p.selectOption('#sm-mode', 'fit'); ok(await p.isVisible('#sm-bg') && await p.isHidden('#sm-pos') && await p.isChecked('.sm-card input[value="11"]'), 'fit mode shows colour, keeps ticks');
  await p.close();

  // SVG to PNG
  p = await page('/svg-to-png/');
  ok(JSON.stringify(await p.evaluate(() => [ETBSvg.svgSize('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"/>'), ETBSvg.svgSize('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"/>')])) === '[[100,50],[64,32]]', 'reads SVG size from viewBox or width');
  await p.setInputFiles('#sv-input', [D + 'logo.svg', D + 'icon.svg']); await p.waitForSelector('form[data-svgpng][data-count="2"]'); await p.waitForTimeout(300);
  ok(/logo · 200×100/.test(await p.textContent('#sv-out')) && /icon · 128×128/.test(await p.textContent('#sv-out')), 'previews at 2x');
  d = await dl(p, '#sv-dl'); const vz = Object.keys(await unzip(p, d)).sort(); ok(vz.join() === 'icon.png,logo.png', 'two PNGs zipped');
  await p.click('#sv-clear'); await p.setInputFiles('#sv-input', D + 'logo.svg'); await p.waitForSelector('form[data-svgpng][data-count="1"]');
  await p.selectOption('#sv-sizing', 'width'); await p.fill('#sv-width', '500'); await p.dispatchEvent('#sv-width', 'change');
  d = await dl(p, '#sv-dl'); ok(d.suggestedFilename() === 'logo.png' && await imgSize(p, d) === '500x250', 'exact width keeps ratio');
  await p.click('form[data-svgpng] details summary'); await p.fill('textarea[name=code]', 'not an svg'); await p.click('#sv-paste'); ok(/doesn't look like an SVG/.test(await p.textContent('#sv-msg')), 'bad SVG code message'); await p.close();

  // Palette
  p = await page('/colour-palette-from-image/');
  await p.selectOption('#pl-count', '4'); await p.setInputFiles('#pl-input', D + 'quads.png'); await p.waitForSelector('form[data-palette][data-colours]');
  const cols = (await p.getAttribute('form[data-palette]', 'data-colours')).split(',');
  ok(cols.length === 4 && ['#FF0000', '#0080FF', '#14B43C', '#FADC1E'].every(c => cols.includes(c)), 'finds the four quadrant colours ' + cols.join(','));
  ok(/--colour-1: #/.test(await p.inputValue('#pl-css')) && /25%/.test(await p.textContent('#pl-out')), 'CSS variables and shares');
  d = await dl(p, '#pl-png'); ok(/quads-palette\.png$/.test(d.suggestedFilename()) && await imgSize(p, d) === '800x260', 'palette PNG strip'); await p.close();

  // Listed in the image category on the homepage
  p = await page('/'); const home = await p.content(); ok(['add-text-to-image', 'meme-generator', 'photo-collage-maker', 'favicon-generator', 'instagram-grid-splitter', 'social-media-image-resizer', 'svg-to-png', 'colour-palette-from-image'].every(s => home.includes('/' + s + '/')), 'all 8 tools linked from the homepage'); await p.close();

  // Mobile layout check
  const m = await b.newContext({ viewport: { width: 390, height: 844 } }); const mp = await m.newPage(); await mp.goto(BASE + '/social-media-image-resizer/', { waitUntil: 'networkidle' });
  await mp.setInputFiles('#sm-input', D + 'quads.png'); await mp.waitForSelector('form[data-social][data-ready]');
  ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal scroll on mobile'); await m.close();

  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
