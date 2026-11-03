// Tests for protect PDF, unlock PDF, sign PDF, PDF to Excel, HEIC to JPG.
// NODE_PATH must include @cantoo/pdf-lib (npm i @cantoo/pdf-lib). Needs python3 + openpyxl, pdftoppm, and /home/claude/build/test.heic.
const { chromium } = require('playwright');
const CP = require('@cantoo/pdf-lib');
const fs = require('fs'), { execSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8765';
const T = '/tmp/t10'; fs.mkdirSync(T, { recursive: true });
let fail = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) fail++; };

(async () => {
  // fixtures
  const doc = await CP.PDFDocument.create(); const f = await doc.embedFont(CP.StandardFonts.Helvetica);
  for (let i = 0; i < 2; i++) { const p = doc.addPage([595, 842]); p.drawText('Page ' + (i + 1), { x: 50, y: 780, size: 20, font: f }); if (i === 1) p.setRotation(CP.degrees(90)); }
  fs.writeFileSync(T + '/plain.pdf', await doc.save());
  const own = await CP.PDFDocument.load(fs.readFileSync(T + '/plain.pdf'));
  own.encrypt({ userPassword: '', ownerPassword: 'owner-only-pw', permissions: { printing: false, copying: false } });
  fs.writeFileSync(T + '/owner-only.pdf', await own.save());
  // table PDF
  const tb = await CP.PDFDocument.create(), tf = await tb.embedFont(CP.StandardFonts.Helvetica), tp = tb.addPage([595, 842]);
  const rows = [['Date', 'Description', 'Amount', 'Balance'], ['01/10/2026', 'Opening balance', '', '£1,000.00'], ['03/10/2026', 'Tesco Stores', '-£42.15', '£957.85'], ['05/10/2026', 'Salary ACME Ltd', '£2,450.00', '£3,407.85'], ['09/10/2026', 'Council tax', '-£165.00', '£3,242.85']];
  rows.forEach((r, ri) => { const y = 760 - ri * 20; tp.drawText(r[0], { x: 40, y, size: 10, font: tf }); tp.drawText(r[1], { x: 130, y, size: 10, font: tf });
    [r[2], r[3]].forEach((v, k) => { if (!v) return; const right = k ? 540 : 420; tp.drawText(v, { x: right - tf.widthOfTextAtSize(v, 10), y, size: 10, font: tf }); }); });
  fs.writeFileSync(T + '/table.pdf', await tb.save());

  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36' });
  const errs = []; const page = async (u) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(u + ': ' + e.message)); await p.goto(BASE + u); return p; };

  // ---- Protect
  let p = await page('/protect-pdf/');
  await p.setInputFiles('#pp-input', T + '/plain.pdf'); await p.waitForSelector('#run:not([disabled])');
  await p.fill('#pw', 'secret123'); await p.fill('#pw2', 'secret12'); await p.click('#run');
  ok((await p.textContent('#pp-msg')).includes("don't match"), 'mismatch message');
  await p.fill('#pw2', 'secret123'); await p.click('details.style-opts summary'); await p.uncheck('input[name=print]');
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  const prot = fs.readFileSync(await dl.path()); fs.writeFileSync(T + '/protected.pdf', prot);
  const chk = await CP.PDFDocument.load(prot, { ignoreEncryption: true });
  let wrong = false; try { await CP.PDFDocument.load(prot, { password: 'nope' }); } catch (e) { wrong = true; }
  const right = await CP.PDFDocument.load(prot, { password: 'secret123' });
  ok(chk.isEncrypted && wrong && right.getPageCount() === 2 && dl.suggestedFilename() === 'plain-protected.pdf', 'protected: encrypted, wrong pw rejected, right pw opens');
  ok(/AESV3|\/V 5/.test(prot.toString('latin1')), 'uses AES-256 (V5/AESV3)');
  ok(!execSync('pdfinfo -upw secret123 ' + T + '/protected.pdf 2>&1').toString().includes('Error'), 'poppler opens it with the password');
  await p.setInputFiles('#pp-input', T + '/protected.pdf'); await p.waitForTimeout(400);
  ok((await p.textContent('#pp-msg')).includes('already has a password'), 'already-protected warning');
  await p.close();

  // ---- Unlock
  p = await page('/unlock-pdf/');
  await p.setInputFiles('#pp-input', T + '/protected.pdf'); await p.waitForSelector('#pw-row:not([hidden])');
  await p.fill('#pw', 'wrong'); await p.click('#run'); await p.waitForFunction(() => /isn't right/.test(document.getElementById('pp-msg').textContent));
  ok(true, 'wrong password message');
  await p.fill('#pw', 'secret123');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  let un = fs.readFileSync(await dl.path());
  ok(!(await CP.PDFDocument.load(un, { ignoreEncryption: true })).isEncrypted && (await CP.PDFDocument.load(un)).getPageCount() === 2, 'unlocked copy has no password');
  await p.setInputFiles('#pp-input', T + '/owner-only.pdf'); await p.waitForFunction(() => /restrictions/.test(document.getElementById('pp-msg').textContent));
  ok(await p.isHidden('#pw-row'), 'owner-only PDF needs no password');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  un = fs.readFileSync(await dl.path());
  ok(!(await CP.PDFDocument.load(un, { ignoreEncryption: true })).isEncrypted, 'restrictions removed');
  await p.setInputFiles('#pp-input', T + '/plain.pdf'); await p.waitForTimeout(400);
  ok((await p.textContent('#pp-msg')).includes("isn't password-protected"), 'plain PDF message');
  await p.close();

  // ---- Sign
  p = await page('/sign-pdf/');
  await p.setInputFiles('#pp-input', T + '/plain.pdf'); await p.waitForSelector('#sign-pages[data-ready="1"]');
  ok((await p.$$('.sign-page')).length === 2, 'two pages rendered');
  await p.click('#add-sig'); ok((await p.textContent('#pp-msg')).includes('Draw your signature'), 'asks to draw first');
  const pad = await p.$('#sig-pad'), bb = await pad.boundingBox();
  await p.mouse.move(bb.x + 30, bb.y + bb.height * 0.6); await p.mouse.down();
  for (let i = 0; i <= 20; i++) await p.mouse.move(bb.x + 30 + i * 12, bb.y + bb.height * (0.6 - Math.sin(i / 3) * 0.25));
  await p.mouse.up();
  await p.click('#add-sig');
  const clickPage = async (n, fx, fy) => { const el = await p.$('.sign-page[data-page="' + n + '"]'); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(); const vh = 900;
    let y = r.y + r.height * fy; if (y > vh - 10 || y < 70) { await p.evaluate(dy => window.scrollBy(0, dy), y - vh / 2); const r2 = await el.boundingBox(); y = r2.y + r2.height * fy; await p.mouse.click(r2.x + r2.width * fx, y); } else await p.mouse.click(r.x + r.width * fx, y); };
  await clickPage(1, 0.7, 0.8);
  ok((await p.$$('.sign-page[data-page="1"] .sig-item')).length === 1, 'signature placed on page 1');
  // drag it a bit
  await (await p.$('.sig-item')).scrollIntoViewIfNeeded(); const it = await (await p.$('.sig-item')).boundingBox();
  await p.mouse.move(it.x + it.width / 2, it.y + it.height / 2); await p.mouse.down(); await p.mouse.move(it.x + it.width / 2 - 20, it.y + it.height / 2 + 10, { steps: 4 }); await p.mouse.up();
  await p.click('#add-date'); await clickPage(2, 0.3, 0.2);
  // typed signature
  await p.check('input[name=sigmode][value=type]', { force: true }); await p.fill('#signame', 'Sarah Jones'); await p.click('#add-sig');
  await clickPage(1, 0.3, 0.3);
  ok((await p.$$('.sig-item')).length === 3, 'three items placed');
  await p.screenshot({ path: '/home/claude/build/shots/sign.png' });
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  const signed = await dl.path(); fs.copyFileSync(signed, T + '/signed.pdf');
  execSync(`pdftoppm -r 40 -png ${T}/signed.pdf ${T}/sg`);
  const ink = JSON.parse(execSync(`python3 -c "
from PIL import Image
import json
def dark(fn, box):
    im=Image.open(fn).convert('L'); W,H=im.size; x0,y0,x1,y1=[int(v) for v in (box[0]*W,box[1]*H,box[2]*W,box[3]*H)]
    c=im.crop((x0,y0,x1,y1)); return sum(1 for v in c.getdata() if v<150)
import glob; fs=sorted(glob.glob('${T}/sg-*.png'))
print(json.dumps([dark(fs[0],(0.5,0.7,0.95,0.92)), dark(fs[0],(0.1,0.2,0.5,0.4)), dark(fs[1],(0.1,0.1,0.55,0.3)), dark(fs[0],(0.05,0.5,0.4,0.65))]))"`).toString());
  ok(ink[0] > 20 && ink[1] > 20 && ink[2] > 10 && ink[3] < 5, 'ink appears where items were placed (incl. rotated page)', ink);
  await p.close();

  // ---- PDF to Excel
  p = await page('/pdf-to-excel/');
  await p.setInputFiles('#pp-input', T + '/table.pdf'); await p.waitForSelector('#xl-preview[data-ready="1"]');
  const prev = await p.$$eval('.xl-table tr', trs => trs.map(tr => [...tr.children].map(td => td.textContent)));
  ok(prev.length === 5 && prev[0].length === 4 && prev[2][1] === 'Tesco Stores' && prev[3][2] === '£2,450.00', 'preview detects 4 columns', prev);
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  fs.copyFileSync(await dl.path(), T + '/out.xlsx');
  const cells = JSON.parse(execSync(`python3 -c "
import openpyxl,json; ws=openpyxl.load_workbook('${T}/out.xlsx').active
print(json.dumps([[c.value for c in r] for r in ws.iter_rows()]))"`).toString());
  ok(cells[2][2] === -42.15 && cells[3][2] === 2450 && cells[4][3] === 3242.85 && cells[1][1] === 'Opening balance', 'xlsx has real numbers incl. negatives', cells);
  await p.selectOption('#format', 'csv');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#run')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  ok(/Tesco Stores,-£42\.15,£957\.85/.test(csv) && dl.suggestedFilename() === 'table.csv', 'CSV export');
  ok(await p.evaluate(() => ETBPdfPlus.toNumber('(1,234.50)') === -1234.5 && ETBPdfPlus.toNumber('12.5%') === 0.125 && ETBPdfPlus.toNumber('AB12') === null && ETBPdfPlus.colName(27) === 'AB'), 'number parsing & column names');
  await p.close();

  // ---- HEIC
  p = await page('/heic-to-jpg/');
  await p.setInputFiles('#heic-input', '/home/claude/build/test.heic');
  const [hd] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.waitForSelector('#heic-results[data-done="1"]', { timeout: 60000 })]);
  const jpg = fs.readFileSync(await hd.path());
  const info = JSON.parse(execSync(`python3 -c "
from PIL import Image; import json,io,sys; im=Image.open('${await hd.path()}'); print(json.dumps([im.format, im.size, im.convert('RGB').getpixel((160,120)), im.convert('RGB').getpixel((10,10))]))"`).toString());
  ok(info[0] === 'JPEG' && info[1][0] === 320 && info[1][1] === 240 && info[2][2] > 180 && info[3][0] > 160, 'HEIC → JPG with correct size and colours', info);
  ok(hd.suggestedFilename() === 'test.jpg', 'filename test.jpg');
  await p.setInputFiles('#heic-input', T + '/plain.pdf'); await p.waitForTimeout(200);
  ok((await p.textContent('#heic-msg')).includes('HEIC'), 'non-HEIC file message');
  await p.close();

  ok(!errs.length, 'no page errors', errs);
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED'); process.exit(fail ? 1 : 0);
})();
