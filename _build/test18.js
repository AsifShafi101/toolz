// Remove watermark from PDF: each kind of watermark layer is removed and the real content stays.
const { chromium } = require('playwright'); const { execSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8765', D = process.env.WMT || '/home/claude/wmtest';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${BASE}/remove-watermark-from-pdf/`);
  for (const [f, key] of [['artifact.pdf', 'artifact'], ['ocg.pdf', 'layer'], ['annot.pdf', 'annot'], ['overlay.pdf', 'overlay']]) {
    await p.evaluate(() => { document.getElementById('wm-out').hidden = true; document.getElementById('wm-msg').textContent = ''; document.getElementById('wm-out').removeAttribute('data-report'); });
    await p.setInputFiles('#wm-input', `${D}/${f}`);
    await p.waitForFunction(() => document.getElementById('wm-out').hasAttribute('data-report') && !/Looking/.test(document.getElementById('wm-msg').textContent), null, { timeout: 20000 });
    const rep = JSON.parse(await p.getAttribute('#wm-out', 'data-report'));
    ok(rep[key] >= 2 && rep.pages === 2, `${f}: removed ${key} on both pages ${JSON.stringify(rep)}`);
    const dl = p.waitForEvent('download'); await p.click('#wm-dl'); const d = await dl; await d.saveAs('/tmp/wm-out.pdf');
    const txt = execSync('pdftotext /tmp/wm-out.pdf -').toString().replace(/\s+/g, ' ');
    const flat = txt.replace(/ /g, '');
    ok(flat.includes('Realcontentpage1') && flat.includes('Realcontentpage2') && !/[DRAFTMK]{6,}/.test(flat.replace(/Realcontentpage\d/g, '')), `${f}: content kept, watermark gone (${txt.trim()})`);
    if (key === 'annot') ok(!execSync('python3 -c "import sys;d=open(\'/tmp/wm-out.pdf\',\'rb\').read();print(b\'/Watermark\' in d)"').toString().includes('True'), 'annotation removed from file');
  }
  await p.setInputFiles('#wm-input', `${D}/clean.pdf`); await p.waitForTimeout(1500);
  ok(/No separate watermark layer/.test(await p.textContent('#wm-msg')) && await p.isHidden('#wm-out'), 'clean PDF: explains nothing was found');
  ok(await p.isVisible('#wm-out') === false, 'no download offered when nothing changed');
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); await m.goto(`${BASE}/remove-watermark-from-pdf/`);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no mobile overflow');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
