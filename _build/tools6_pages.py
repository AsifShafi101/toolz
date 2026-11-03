# Batch 6: protect PDF, unlock PDF, sign PDF, PDF to Excel, HEIC to JPG

def pp_drop(title="Choose a PDF or drop it here"):
    return f'''<label class="drop" id="drop" for="pp-input"><strong>{title}</strong><span class="muted">PDF files · processed on your device, never uploaded</span>
        <input type="file" id="pp-input" accept="application/pdf,.pdf" class="sr-only"></label>
      <ul class="file-list" id="file-list"></ul>'''


RESULT_PANEL = '<div class="panel"><h3 style="margin:0 0 4px">Result</h3><div id="pp-out" aria-live="polite"><p class="muted">Your file will appear here, ready to download.</p></div></div>'
CRYPT_SCRIPTS = ("vendor/pdf-lib-crypt.min.js", "pdftools.js", "pdfplus.js")

tool_page("protect-pdf", "Protect PDF with Password – Free AES-256 Encryption, No Upload | etoolbox", "Password-protect a PDF",
    "Add a password to any PDF so only people who know it can open it. Uses strong AES-256 encryption, lets you block printing, copying or editing, and runs in your browser so your file is never uploaded.",
    f"""
  <div class="gen">
    <form class="panel" data-pp="protect" novalidate autocomplete="off">
      {pp_drop()}
      <div class="row" style="margin-top:6px"><div><label for="pw">Password</label><input type="password" id="pw" name="pw" autocomplete="new-password"></div>
      <div><label for="pw2">Repeat password</label><input type="password" id="pw2" name="pw2" autocomplete="new-password"></div></div>
      <label class="check" style="margin-top:8px"><input type="checkbox" name="show"> Show password</label>
      <details class="style-opts"><summary>Permissions (optional)</summary>
        <p class="hint" style="margin:8px 0">What people can do after opening the PDF with the password:</p>
        <label class="check"><input type="checkbox" name="print" checked> Allow printing</label>
        <label class="check"><input type="checkbox" name="copy" checked> Allow copying text and images</label>
        <label class="check"><input type="checkbox" name="edit"> Allow editing and changing pages</label>
        <label for="owner">Owner password <span class="hint">(optional: lets you change permissions later; we create a random one if empty)</span></label>
        <input type="password" id="owner" name="owner" autocomplete="new-password">
      </details>
      <div class="run-row"><button type="button" class="btn" id="run" disabled>Protect PDF</button><span id="pp-msg" class="warn" role="status"></span></div>
    </form>
    {RESULT_PANEL}
  </div>""",
    """<h2>How to password-protect a PDF</h2><ol><li>Choose your PDF.</li><li>Type a password twice. Use at least 8 characters, ideally a short phrase.</li><li>Optionally block printing, copying or editing.</li><li>Click <strong>Protect PDF</strong> and download the protected copy.</li></ol>
<h2>Strong, private encryption</h2><p>Your PDF is encrypted with <strong>AES-256</strong>, the strongest standard PDF encryption, supported by Adobe Reader, Chrome, Edge, Safari, Preview and phone PDF apps. Because the encryption happens <strong>in your browser</strong>, neither your file nor your password is ever sent to us.</p>
<p>Need a strong password? Use our <a href="/password-generator/">password generator</a>. Send the password to the recipient separately (for example by text message), not in the same email as the PDF.</p>""",
    [("Can you recover a forgotten password?", "No. We never see your password, and AES-256 can't be broken. Keep the password somewhere safe."),
     ("Which apps can open the protected PDF?", "Any modern PDF reader: Adobe Acrobat and Reader, browsers (Chrome, Edge, Firefox, Safari), Apple Preview, and PDF apps on iPhone and Android."),
     ("Do printing and copying restrictions always work?", "Most readers respect them, but some apps ignore them. The open password itself can't be bypassed."),
     ("Is it free?", "Yes. No sign-up, no limits and no watermark.")],
    CRYPT_SCRIPTS)

tool_page("unlock-pdf", "Unlock PDF – Remove PDF Password Free, No Upload | etoolbox", "Remove a password from a PDF",
    "Remove the password and restrictions from a PDF you're allowed to open, so you don't have to type it every time. Free, no sign-up, and the file is processed in your browser.",
    f"""
  <div class="gen">
    <form class="panel" data-pp="unlock" novalidate autocomplete="off">
      {pp_drop()}
      <div id="pw-row" hidden><label for="pw">PDF password</label><input type="password" id="pw" name="pw" autocomplete="off" placeholder="The password you use to open it"></div>
      <div class="run-row"><button type="button" class="btn" id="run" disabled>Unlock PDF</button><span id="pp-msg" class="warn" role="status"></span></div>
      <p class="hint">Only unlock PDFs that belong to you or that you're allowed to open. This tool doesn't guess or crack passwords.</p>
    </form>
    {RESULT_PANEL}
  </div>""",
    """<h2>How to remove a PDF password</h2><ol><li>Choose the protected PDF.</li><li>Type the password you normally use to open it.</li><li>Click <strong>Unlock PDF</strong> and download a copy without the password.</li></ol>
<p>If the PDF opens without a password but won't let you print, copy or edit, the tool spots this and removes the restrictions straight away.</p>
<h2>Good for</h2><ul><li>Bank and credit card statements you open often</li><li>Payslips and P60s for mortgage or rental applications</li><li>Merging protected PDFs with our <a href="/merge-pdf/">Merge PDF</a> tool</li></ul>""",
    [("I've forgotten the password. Can you remove it?", "No. You need the password to unlock the file. We don't crack passwords."),
     ("Is my password sent anywhere?", "No. The PDF is decrypted in your browser and nothing is uploaded."),
     ("Will the unlocked PDF look the same?", "Yes. Only the password and restrictions are removed. Text, images and layout stay the same.")],
    CRYPT_SCRIPTS)

tool_page("sign-pdf", "Sign PDF Online Free – Add Your Signature to a PDF, No Upload | etoolbox", "Sign a PDF",
    "Draw, type or upload your signature and place it anywhere on a PDF. Add the date or your initials too. Free, no account needed, and your document never leaves your device.",
    f"""
  <form data-pp="sign" novalidate autocomplete="off">
  <div class="sign-layout">
    <div class="panel sign-tools">
      {pp_drop()}
      <h3 style="margin:16px 0 6px">1. Your signature</h3>
      <div class="seg" role="radiogroup" aria-label="Signature type"><label><input type="radio" name="sigmode" value="draw" checked><span>Draw</span></label><label><input type="radio" name="sigmode" value="type"><span>Type</span></label><label><input type="radio" name="sigmode" value="upload"><span>Upload</span></label></div>
      <div data-sig="draw"><canvas id="sig-pad" class="sig-pad" width="600" height="220" aria-label="Draw your signature here"></canvas>
        <button type="button" class="btn secondary small" id="sig-clear">Clear</button></div>
      <div data-sig="type" hidden><label for="signame">Your name</label><input type="text" id="signame" name="signame" placeholder="e.g. Sarah Jones"></div>
      <div data-sig="upload" hidden><label class="drop small" for="sig-upload"><strong>Choose a photo of your signature</strong><span class="muted" id="sig-up-name">Sign on white paper, then take a photo</span>
        <input type="file" id="sig-upload" accept="image/*" class="sr-only"></label>
        <label class="check"><input type="checkbox" name="knockout" checked> Remove white background</label></div>
      <div class="row"><div><label for="ink">Ink colour</label><select id="ink" name="ink"><option value="#0b1f5c">Blue-black</option><option value="#111111">Black</option><option value="#1d4ed8">Blue</option></select></div><div></div></div>
      <button type="button" class="btn" id="add-sig" style="margin-top:12px;width:100%">Place signature</button>
      <h3 style="margin:18px 0 6px">2. Extras <span class="hint">(optional)</span></h3>
      <div class="btn-row"><button type="button" class="btn secondary small" id="add-date">Add today's date</button></div>
      <label for="extratext">Text or initials</label><div class="inline-row"><input type="text" id="extratext" name="extratext" placeholder="e.g. SJ or your printed name"><button type="button" class="btn secondary small" id="add-text">Place</button></div>
      <h3 style="margin:18px 0 6px">3. Save</h3>
      <button type="button" class="btn" id="run" disabled style="width:100%">Download signed PDF</button>
      <p id="pp-msg" class="hint" role="status" aria-live="polite" style="margin-top:10px"></p>
      <div id="pp-out"></div>
    </div>
    <div class="sign-pages" id="sign-pages"><p class="muted sign-empty">Choose a PDF to see its pages here.</p></div>
  </div>
  </form>""",
    """<h2>How to sign a PDF</h2><ol><li>Choose your PDF. Its pages appear on the right.</li><li>Draw your signature with a mouse or finger, type your name, or upload a photo of your signature.</li><li>Click <strong>Place signature</strong>, then click where it should go on the page. Drag to move it and use the corner handle to resize.</li><li>Add the date or initials if needed, then click <strong>Download signed PDF</strong>.</li></ol>
<h2>Is an electronic signature legal in the UK?</h2><p>Yes. In England and Wales, electronic signatures are generally valid for most contracts and business documents, including tenancy agreements, employment contracts and supplier terms. Some documents still need a wet-ink or witnessed signature, such as wills and some deeds and property transfers. If you're unsure, check with the other party or a solicitor.</p>
<h2>Private by design</h2><p>Your document and signature stay in your browser. Nothing is uploaded or stored.</p>""",
    [("Can I sign on my phone?", "Yes. Draw your signature with your finger, then tap the page to place it."),
     ("Can I sign more than one page?", "Yes. Click Place signature again and click on another page as many times as you need."),
     ("Is my signature saved?", "No. It exists only in this browser tab and disappears when you close it."),
     ("Is it free?", "Yes. No account, no limits and no watermark.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "pdfplus.js"))

tool_page("pdf-to-excel", "PDF to Excel – Convert PDF Tables to XLSX Free, No Upload | etoolbox", "PDF to Excel converter",
    "Turn tables in PDF bank statements, invoices and reports into an editable Excel spreadsheet (XLSX) or CSV. Numbers and £ amounts become real numbers you can add up. Free, and nothing is uploaded.",
    f"""
  <div class="gen">
    <form class="panel" data-pp="excel" novalidate>
      {pp_drop()}
      <div class="row" style="margin-top:6px"><div><label for="layout">Sheets</label><select id="layout" name="layout"><option value="pages">One sheet per page</option><option value="one">All pages on one sheet</option></select></div>
      <div><label for="format">Save as</label><select id="format" name="format"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV</option></select></div></div>
      <label class="check" style="margin-top:10px"><input type="checkbox" name="numbers" checked> Turn amounts like £1,234.50 and 12% into numbers</label>
      <div class="run-row"><button type="button" class="btn" id="run" disabled>Download spreadsheet</button></div>
      <p id="pp-msg" class="hint" role="status" aria-live="polite"></p>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Preview</h3><div id="xl-preview" class="xl-preview"><p class="muted">The first page's table appears here.</p></div><div id="pp-out" style="margin-top:12px"></div></div>
  </div>""",
    """<h2>How to convert a PDF to Excel</h2><ol><li>Choose a PDF with tables, such as a bank statement, invoice, price list or report.</li><li>Check the preview to see how the columns were detected.</li><li>Click <strong>Download spreadsheet</strong> and open it in Excel, Google Sheets or Numbers.</li></ol>
<h2>Works best with</h2><ul><li>PDFs created by software (online banking, accounting tools, Word or Excel exports)</li><li>Clear tables with one row per line</li></ul>
<p>Scanned PDFs are pictures of text, so run them through <a href="/image-to-text/">Image to text (OCR)</a> first. For invoices, our <a href="/invoice-data-extractor/">invoice data extractor</a> pulls out totals, VAT and dates.</p>""",
    [("Is my bank statement uploaded?", "No. The PDF is read in your browser, so your financial data never leaves your device."),
     ("Why are some columns merged or split?", "PDFs store text positions, not real tables, so columns are worked out from where the text sits. Complex layouts can need a little tidying in Excel."),
     ("Does it work with Google Sheets?", "Yes. Upload the .xlsx to Google Drive, or choose CSV and use File → Import."),
     ("Is it free?", "Yes. No sign-up and no limits.")],
    ("vendor/fflate.min.js", "pdftools.js", "pdfplus.js"))

tool_page("heic-to-jpg", "HEIC to JPG Converter – Convert iPhone Photos Free, No Upload | etoolbox", "HEIC to JPG converter",
    "Convert iPhone HEIC photos to JPG or PNG so they open on any Windows PC, website or app. Convert up to 50 at once and download them as a zip. Free, and your photos never leave your device.",
    """
  <div class="gen">
    <form class="panel" data-heic novalidate>
      <label class="drop" id="drop" for="heic-input"><strong>Choose HEIC photos or drop them here</strong><span class="muted">.HEIC or .HEIF · up to 50 at a time · never uploaded</span>
        <input type="file" id="heic-input" accept=".heic,.heif,image/heic,image/heif" multiple class="sr-only"></label>
      <div class="row" style="margin-top:6px"><div><label for="format">Convert to</label><select id="format" name="format"><option value="image/jpeg">JPG (smaller, works everywhere)</option><option value="image/png">PNG (lossless)</option></select></div>
      <div id="q-wrap"><label for="quality">Quality <span class="hint" id="q-val"></span></label><input type="range" id="quality" name="quality" min="50" max="100" value="92"></div></div>
      <p id="heic-msg" class="hint" role="status" aria-live="polite" style="margin-top:10px"></p>
    </form>
    <div class="panel"><h3 style="margin:0">Converted photos</h3><ul class="img-results" id="heic-results"><li class="muted">Your JPGs will appear here.</li></ul>
      <button type="button" class="btn" id="dl-all" hidden style="margin-top:12px">Download all (.zip)</button></div>
  </div>""",
    """<h2>How to convert HEIC to JPG</h2><ol><li>Choose your iPhone photos (.HEIC). You can pick lots at once.</li><li>Choose JPG or PNG.</li><li>Download each photo, or all of them as a zip.</li></ol>
<h2>What is a HEIC file?</h2><p>iPhones and iPads save photos as HEIC (High Efficiency Image Container) to save space. Many Windows PCs, older apps and websites can't open HEIC, so converting to JPG makes your photos work everywhere.</p>
<p><strong>Tip:</strong> to make your iPhone take JPGs instead, go to <em>Settings → Camera → Formats</em> and choose <em>Most Compatible</em>.</p>""",
    [("Are my photos uploaded?", "No. They're converted in your browser and never leave your device."),
     ("Is quality lost?", "At 92% quality the difference isn't visible. Choose PNG if you need lossless files."),
     ("Is it free?", "Yes. No sign-up, no limits and no watermark.")],
    ("vendor/fflate.min.js", "heic.js"))
