# ---------------- Batch: passport photos, cropper, PDF pages, PDF to text / OCR, pregnancy & ovulation ----------------

# ---- Passport & visa photo maker ----
_pp_opts = "".join(f'<option value="{k}">{n}</option>' for k, n in [
    ("uk", "UK passport (35×45 mm)"), ("ukvisa", "UK visa / BRP (35×45 mm)"), ("ie", "Ireland passport (35×45 mm)"), ("schengen", "Schengen / EU visa (35×45 mm)"),
    ("au", "Australia passport (35×45 mm)"), ("pk", "Pakistan passport / NICOP (35×45 mm)"), ("us", "US passport / visa (2×2 in)"), ("in", "India visa / OCI (2×2 in)"),
    ("ca", "Canada passport (50×70 mm)"), ("cn", "China visa (33×48 mm)")])
tool_page("passport-photo-maker",
    "Passport Photo Maker UK – Free 35x45mm Photos & Print Sheet | etoolbox",
    "Passport photo maker",
    "Make a UK passport photo (35×45 mm) or a visa photo for the US, Schengen, Canada, India, Pakistan, China and more. Line up your face with the guides, then download a digital photo for online applications or a 6×4 inch sheet to print. Free and private: your photo never leaves your device.",
    f"""
  <div class="gen pp-gen">
    <form class="panel" data-passport novalidate>
      <label for="pp-country">Photo type</label><select id="pp-country" name="country">{_pp_opts}</select>
      <p class="hint" id="pp-tips"></p>
      <label class="drop" id="drop" for="pp-input"><strong>Choose a photo or drop it here</strong><span class="muted">A clear, front-facing photo in good light · JPG, PNG or WebP · never uploaded</span>
        <input type="file" id="pp-input" accept="image/jpeg,image/png,image/webp" class="sr-only"></label>
      <div id="pp-editor" hidden>
        <label for="pp-zoom">Zoom</label><input type="range" id="pp-zoom" name="zoom" min="100" max="400" value="100">
        <label for="pp-rot">Straighten</label><input type="range" id="pp-rot" name="rot" min="-15" max="15" step="0.5" value="0">
        <label for="pp-bg">Background</label><select id="pp-bg" name="bg"><option value="keep">Keep my background</option><option value="grey">Plain light grey (AI)</option><option value="cream">Plain cream (AI)</option><option value="white">Plain white (AI)</option></select>
        <p class="hint">UK rules say passport photos must not be digitally altered. Only replace the background if the rules for your document allow it; the safest option is to take the photo against a plain, light wall.</p>
        <label class="check"><input type="checkbox" name="guides" checked> Show face guides</label>
      </div>
      <progress id="pp-progress" max="100" value="0" hidden style="width:100%;margin-top:12px"></progress>
      <p id="pp-msg" class="hint" role="status" aria-live="polite"></p>
    </form>
    <div class="panel preview pp-preview">
      <div class="pp-stage"><canvas id="pp-view" tabindex="0" aria-label="Passport photo preview. Drag to move the photo; arrow keys nudge it."></canvas></div>
      <p class="muted pp-size" id="pp-size"></p>
      <div class="actions" id="pp-actions" hidden>
        <button type="button" class="btn" id="pp-digital">Download digital photo</button>
        <button type="button" class="btn secondary" id="pp-sheet">Download 6×4 print sheet</button>
        <button type="button" class="btn ghost" id="pp-reset">Reset position</button>
      </div>
    </div>
  </div>""",
    """<h2>How to make a passport photo at home</h2><ol><li>Stand against a plain, light wall in even daylight, facing a window, with no shadows on your face or the wall.</li>
<li>Ask someone to take the photo from about 1.5 metres away at eye level. Look straight at the camera with a neutral expression and your mouth closed.</li>
<li>Choose the photo type, upload the picture, and drag and zoom until the top of your head and your chin sit on the green lines.</li>
<li>Download the <strong>digital photo</strong> for an online application, or the <strong>6×4 print sheet</strong>, then print it at a photo kiosk or shop and cut along the lines.</li></ol>
<h2>UK passport photo rules (summary)</h2><ul><li>35 mm wide by 45 mm high, with your head 29–34 mm from chin to crown.</li><li>Plain cream or light grey background, in focus, with no shadows, glare or red eye.</li>
<li>Facing forward with a neutral expression, mouth closed, eyes open and visible, nothing covering your face. No glasses unless you can't remove them for medical reasons.</li><li>Taken in the last month, not edited by computer software, and printed on photo-quality paper if you apply on paper.</li></ul>
<p>Always check the latest official rules before you apply, for example on <a href="https://www.gov.uk/photos-for-passports" target="_blank" rel="noopener">GOV.UK: photos for passports</a>. This tool sizes and lays out your photo; it can't guarantee that a photo will be accepted.</p>
<h2>Printing the 6×4 sheet</h2><p>The sheet is a standard 6×4 inch (10×15 cm) photo print at 300 dpi, so you can print it cheaply at Boots, Asda, Tesco, Snappy Snaps or any photo kiosk. Choose <strong>no borders</strong> and <strong>actual size</strong>, not "fit" or "fill", so the photos stay exactly 35×45 mm.</p>""",
    [("Is this photo accepted for a UK passport?", "The tool makes photos at the correct size (35×45 mm, head 29–34 mm) with the right layout. Whether a photo is accepted also depends on the photo itself: lighting, background, expression and sharpness. Follow the tips above and check GOV.UK's rules before you apply."),
     ("Can I use this for an online passport application?", "Yes. Download the digital photo (910×1170 pixels for 35×45 mm, above GOV.UK's 600×750 minimum). For online applications, HM Passport Office usually prefers a photo that hasn't been cropped from a larger picture, so if your online photo is rejected, use the service's own photo guide."),
     ("How many photos are on the print sheet?", "Eight 35×45 mm photos fit on a 6×4 inch print, with grey cutting lines. Larger sizes, like US 2×2 inch photos, fit fewer."),
     ("Is my photo uploaded?", "No. The photo is resized in your browser. If you replace the background, the AI also runs on your device; only the model file (about 46 MB, once) is downloaded from etoolbox."),
     ("Can I smile in a passport photo?", "No. For a UK passport you need a neutral expression with your mouth closed.")],
    ("passport.js", "bgremove.js"))

# ---- Image cropper and circle crop ----
def _crop_ui(preset):
    ratios = [("free", "Free"), ("1:1", "Square 1:1"), ("circle", "Circle"), ("4:5", "Instagram portrait 4:5"), ("16:9", "Widescreen 16:9"), ("9:16", "Story 9:16"),
              ("3:2", "Photo 3:2"), ("2:3", "Photo 2:3"), ("4:3", "4:3"), ("1.91:1", "Link preview 1.91:1")]
    opts = "".join(f'<option value="{k}"{" selected" if k == preset else ""}>{n}</option>' for k, n in ratios)
    return f"""
  <form class="panel cr-form" data-crop data-preset="{preset}" novalidate>
    <label class="drop" id="drop" for="cr-input"><strong>Choose an image or drop it here</strong><span class="muted">JPG, PNG, WebP or GIF · or paste with Ctrl+V · never uploaded</span>
      <input type="file" id="cr-input" accept="image/*" class="sr-only"></label>
    <div id="cr-work" hidden>
      <div class="cr-bar">
        <div><label for="cr-ratio">Shape</label><select id="cr-ratio" name="ratio">{opts}</select></div>
        <div><label for="cr-fmt">Save as</label><select id="cr-fmt" name="fmt"><option value="">Same as original</option><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></div>
        <div><label for="cr-width">Resize width <span class="muted">(px, optional)</span></label><input type="number" id="cr-width" name="width" min="16" max="8000" placeholder="e.g. 400"></div>
        <div class="cr-btns"><span class="lbl">Rotate &amp; flip</span><div><button type="button" class="btn secondary sm" id="cr-rotl" aria-label="Rotate left">⟲</button><button type="button" class="btn secondary sm" id="cr-rotr" aria-label="Rotate right">⟳</button><button type="button" class="btn secondary sm" id="cr-fliph" aria-label="Flip horizontally">⇋</button><button type="button" class="btn secondary sm" id="cr-flipv" aria-label="Flip vertically">⇵</button></div></div>
      </div>
      <div class="cr-stage"><canvas id="cr-view" tabindex="0" aria-label="Crop area. Drag the box or its handles; arrow keys move it."></canvas></div>
      <div class="cr-nums"><label>X <input type="number" name="cx" min="0"></label><label>Y <input type="number" name="cy" min="0"></label><label>Width <input type="number" name="cw" min="8"></label><label>Height <input type="number" name="ch" min="8"></label><span class="muted" id="cr-dim"></span></div>
      <div class="actions"><button type="button" class="btn" id="cr-dl">Crop &amp; download</button></div>
    </div>
    <p id="cr-msg" class="hint" role="status"></p>
  </form>"""

tool_page("image-cropper",
    "Crop Image Online Free – Crop Photos to Any Size or Ratio | etoolbox",
    "Image cropper",
    "Crop a photo freely or to an exact shape: square, circle, 4:5 for Instagram, 16:9 or 9:16 for stories. Rotate, flip, resize and download as JPG, PNG or WebP. Free, with no watermark, and your image never leaves your device.",
    _crop_ui("free"),
    """<h2>How to crop an image</h2><ol><li>Choose or drop an image, or paste a screenshot with Ctrl+V.</li><li>Pick a shape, or keep <strong>Free</strong> to crop any size.</li><li>Drag the box to move it and drag its corners or edges to resize it. You can also type exact pixel values.</li><li>Click <strong>Crop &amp; download</strong>.</li></ol>
<h2>Which shape should I use?</h2><ul><li><strong>Square 1:1:</strong> Instagram posts, profile pictures and product photos.</li><li><strong>4:5:</strong> Instagram portrait posts (they take up more of the feed).</li><li><strong>9:16:</strong> Instagram and Facebook Stories, TikTok and YouTube Shorts.</li><li><strong>16:9:</strong> YouTube thumbnails, presentations and website banners.</li><li><strong>1.91:1:</strong> link previews on LinkedIn, Facebook and X.</li></ul>""",
    [("Does cropping reduce quality?", "No. The pixels you keep are saved at full resolution. Only use “Resize width” if you want a smaller file."),
     ("Can I crop to a circle?", "Yes. Choose Circle and save as PNG to keep the corners transparent. There's also a dedicated circle crop and profile picture page."),
     ("Is there a watermark?", "No. Cropped images are yours, with no watermark and no sign-up.")],
    ("cropper.js",))

tool_page("circle-crop-image",
    "Circle Crop Image – Free Round Profile Picture Maker | etoolbox",
    "Circle crop & profile picture maker",
    "Crop any photo into a perfect circle for a profile picture, avatar or logo. Get a PNG with a transparent background, at any size. Free, no sign-up, and nothing is uploaded.",
    _crop_ui("circle"),
    """<h2>Make a round profile picture</h2><ol><li>Choose a photo.</li><li>Drag the circle over your face and resize it with the corner handles.</li><li>Optionally set a width, such as 400 px for most profile pictures.</li><li>Click <strong>Crop &amp; download</strong> to get a round PNG with transparent corners.</li></ol>
<p>Most sites (LinkedIn, WhatsApp, X, Instagram, Teams and Zoom) show profile pictures as circles but ask you to upload a square. Upload the round PNG to see exactly how it will look, or choose <em>Square 1:1</em> under Shape to save a square version instead.</p>""",
    [("What size should a profile picture be?", "400×400 pixels works well almost everywhere. LinkedIn recommends at least 400×400 pixels."),
     ("Why PNG?", "PNG keeps the area outside the circle transparent. A JPG can't be transparent, so the corners would turn white.")],
    ("cropper.js",))

# ---- PDF page organiser (three pages, one engine) ----
def _pages_ui(mode):
    pick = {"delete": ("Pages to delete", "e.g. 2, 5-7"), "extract": ("Pages to extract", "e.g. 1-3, 8")}.get(mode)
    run = {"delete": "Delete pages &amp; download", "extract": "Extract pages &amp; download", "reorder": "Save new order &amp; download"}[mode]
    pick_html = f'<div class="pg-pick"><label for="pg-pick">{pick[0]} <span class="muted">(or click pages below)</span></label><input type="text" id="pg-pick" placeholder="{pick[1]}" autocomplete="off"></div>' if pick else ""
    return f"""
  <form class="panel pg-form" data-pages data-mode="{mode}" novalidate>
    <label class="drop" id="drop" for="pg-input"><strong>Choose a PDF or drop it here</strong><span class="muted">See every page before you change anything · never uploaded</span>
      <input type="file" id="pg-input" accept="application/pdf,.pdf" class="sr-only"></label>
    <div id="pg-bar" class="pg-bar" hidden>
      {pick_html}
      <div class="pg-sum"><strong id="pg-count"></strong><button type="button" class="btn ghost sm" id="pg-all">{"Select all" if mode == "extract" else "Keep all"}</button><button type="button" class="btn ghost sm" id="pg-none">Reset</button>
        <button type="button" class="btn" id="pg-run">{run}</button></div>
    </div>
    <p id="pg-msg" class="hint" role="status" aria-live="polite"></p>
    <ol class="pg-grid" id="pg-grid" aria-label="Pages"></ol>
  </form>"""

_pg_private = "<h2>Private by design</h2><p>Your PDF is opened in your browser and never uploaded, so contracts, bank statements and ID documents stay on your device.</p>"
tool_page("delete-pdf-pages",
    "Delete PDF Pages Online Free – Remove Pages from a PDF | etoolbox",
    "Delete pages from a PDF",
    "Remove blank, duplicate or unwanted pages from a PDF. See a preview of every page, click the ones to delete, then download your new PDF. Free, no sign-up, and the file never leaves your device.",
    _pages_ui("delete"),
    """<h2>How to delete pages from a PDF</h2><ol><li>Choose your PDF. A preview of every page appears.</li><li>Click the pages you want to remove (they turn red), or type page numbers like <code>2, 5-7</code>.</li><li>Click <strong>Delete pages &amp; download</strong>.</li></ol>
<p>You can also rotate pages with ⟳ and change their order with ‹ › before you save.</p>""" + _pg_private,
    [("Will the other pages lose quality?", "No. The pages you keep are copied exactly, with their text, links and images unchanged."),
     ("Can I delete pages from a password-protected PDF?", "Unlock it first with our Unlock PDF tool (you'll need the password), then delete the pages.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "pdfpages.js"))

tool_page("extract-pdf-pages",
    "Extract Pages from PDF Free – Save Selected Pages as a New PDF | etoolbox",
    "Extract pages from a PDF",
    "Pick the pages you need, such as one statement page or a single chapter, and save them as a new PDF. See every page first, click to select, and download. Free, private, and nothing is uploaded.",
    _pages_ui("extract"),
    """<h2>How to extract PDF pages</h2><ol><li>Choose your PDF to see every page.</li><li>Click the pages you want (they turn green), or type page numbers like <code>1-3, 8</code>.</li><li>Click <strong>Extract pages &amp; download</strong>. The new PDF keeps the pages in the order shown.</li></ol>
<p>Need each page as its own file? Use <a href="/split-pdf/">Split PDF</a>.</p>""" + _pg_private,
    [("Does the original PDF change?", "No. You get a new PDF with only the selected pages; your original file stays as it was."),
     ("Can I change the page order?", "Yes. Use ‹ › or drag the pages before you extract them.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "pdfpages.js"))

tool_page("reorder-pdf-pages",
    "Reorder PDF Pages Free – Rearrange, Rotate & Sort PDF Pages | etoolbox",
    "Reorder PDF pages",
    "Rearrange the pages of a PDF by dragging them into a new order. Rotate sideways pages and remove the ones you don't need, then download. Free, private, and nothing is uploaded.",
    _pages_ui("reorder"),
    """<h2>How to rearrange PDF pages</h2><ol><li>Choose your PDF to see every page.</li><li>Drag pages into the order you want. On a phone or with a keyboard, use the ‹ › buttons.</li><li>Rotate pages with ⟳ and remove pages with ✕.</li><li>Click <strong>Save new order &amp; download</strong>.</li></ol>""" + _pg_private,
    [("Can I combine pages from different PDFs?", "Merge them first with Merge PDF, then reorder the pages here."),
     ("Is there a page limit?", "You can organise PDFs of up to 500 pages.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "pdfpages.js"))

# ---- PDF to text and OCR ----
def _pt_ui(default):
    sel = lambda v: " selected" if v == default else ""
    return f"""
  <form class="panel pt-form" data-pdftext novalidate>
    <label class="drop" id="drop" for="pt-input"><strong>Choose a PDF or drop it here</strong><span class="muted">Text PDFs and scanned PDFs · read on your device, never uploaded</span>
      <input type="file" id="pt-input" accept="application/pdf,.pdf" class="sr-only"></label>
    <div class="row"><div><label for="pt-ocr">Scanned pages (OCR)</label><select id="pt-ocr" name="ocr"><option value="auto"{sel("auto")}>Use OCR only where there's no text</option><option value="always"{sel("always")}>Always use OCR</option><option value="never"{sel("never")}>Never use OCR (fastest)</option></select></div>
    <div><label class="check" style="margin-top:34px"><input type="checkbox" name="sep" checked> Mark where each page starts</label></div></div>
    <progress id="pt-progress" max="100" value="0" hidden style="width:100%;margin-top:12px"></progress>
    <p id="pt-msg" class="hint" role="status" aria-live="polite"></p>
    <label for="pt-out" class="sr-only">Text from your PDF</label><textarea id="pt-out" rows="14" placeholder="The text from your PDF will appear here." spellcheck="false"></textarea>
    <div class="actions" id="pt-actions" hidden><button type="button" class="btn" id="pt-dl">Download .txt</button><button type="button" class="btn secondary" id="pt-copy">Copy text</button></div>
  </form>"""

tool_page("pdf-to-text",
    "PDF to Text Converter Free – Extract Text from PDF (with OCR) | etoolbox",
    "PDF to text",
    "Get all the text out of a PDF in seconds, ready to copy, edit or search. Scanned pages are read automatically with OCR. Download as a .txt file. Free, no sign-up, and your PDF never leaves your device.",
    _pt_ui("auto"),
    """<h2>How to convert a PDF to text</h2><ol><li>Choose or drop a PDF.</li><li>The text is extracted page by page. Pages without a text layer (scans and photos) are read with OCR.</li><li>Copy the text or download it as a .txt file.</li></ol>
<p>Want to keep the layout and formatting? Use <a href="/pdf-to-word/">PDF to Word</a> instead. Need tables in a spreadsheet? Try <a href="/pdf-to-excel/">PDF to Excel</a>.</p>""",
    [("Does it work with scanned PDFs?", "Yes. Pages without selectable text are read with OCR (optical character recognition). OCR currently reads English text."),
     ("Is my PDF uploaded?", "No. Both the text extraction and the OCR run in your browser."),
     ("Why is the text order odd sometimes?", "PDFs store text in blocks, not paragraphs. Multi-column layouts and tables can come out in a different order from how they look.")],
    ("vendor/ocr/tesseract.min.js", "pdftools.js", "pdftext.js"))

tool_page("ocr-pdf",
    "OCR PDF Online Free – Convert Scanned PDF to Text | etoolbox",
    "OCR PDF: read text from scanned PDFs",
    "Turn a scanned PDF or photographed document into text you can copy, edit and search. Optical character recognition runs in your browser, so the document is never uploaded. Free, with no sign-up and no page limit per day.",
    _pt_ui("always"),
    """<h2>How to OCR a scanned PDF</h2><ol><li>Choose your scanned PDF.</li><li>Each page is turned into an image and read with OCR. Each page takes a few seconds.</li><li>Check the text, then copy it or download it as a .txt file.</li></ol>
<h2>Tips for better results</h2><ul><li>Scan at 300 dpi in black and white or greyscale.</li><li>Make sure pages are straight and the text is sharp.</li><li>Handwriting and very small print are hard for any OCR. Always check important numbers.</li></ul>""",
    [("Which languages are supported?", "OCR currently reads English. Text PDFs in any language are extracted directly without OCR."),
     ("Is it free?", "Yes, with no sign-up, no watermark and no daily limit. Very long scans take longer because each page is read on your device."),
     ("Is my document private?", "Yes. The OCR engine runs in your browser, so the PDF never leaves your device.")],
    ("vendor/ocr/tesseract.min.js", "pdftools.js", "pdftext.js"))

# ---- Pregnancy due date & ovulation ----
tool_page("pregnancy-due-date-calculator",
    "Pregnancy Due Date Calculator UK – How Many Weeks Pregnant Am I? | etoolbox",
    "Pregnancy due date calculator",
    "Work out your baby's due date from the first day of your last period, your conception date or an IVF transfer date. See how many weeks pregnant you are, your trimester and the key dates for scans, maternity leave and more.",
    """
  <div class="gen">
    <form class="panel" data-due-calc novalidate>
      <label for="due-method">Calculate from</label>
      <select id="due-method" name="method"><option value="lmp">First day of my last period</option><option value="conception">Conception date</option><option value="ivf5">IVF transfer (5-day embryo)</option><option value="ivf3">IVF transfer (3-day embryo)</option><option value="due">I know my due date (from a scan)</option></select>
      <label for="due-date">Date</label><input type="date" id="due-date" name="date">
      <div data-for-method="lmp"><label for="due-cycle">Average cycle length <span class="muted">(days, usually 28)</span></label><input type="number" id="due-cycle" name="cycle" min="20" max="45" value="28"></div>
      <p class="hint">This is an estimate. Your midwife will confirm your due date at your dating scan.</p>
    </form>
    <div class="panel" id="due-out" aria-live="polite"></div>
  </div>""",
    """<h2>How is a due date calculated?</h2><p>A pregnancy is counted as 40 weeks (280 days) from the first day of your last period, not from conception. With a typical 28-day cycle, conception happens around two weeks after your period starts, so you're already "2 weeks pregnant" when you conceive. If your cycle is longer or shorter than 28 days, the due date moves by the difference, which this calculator adjusts for.</p>
<ul><li><strong>From conception:</strong> due date = conception date + 266 days.</li><li><strong>IVF:</strong> 5-day transfer + 261 days, or 3-day transfer + 263 days.</li></ul>
<h2>The NHS pregnancy timeline</h2><p>In the UK you'll usually have a booking appointment with a midwife by 10 weeks, a dating scan between 11 and 14 weeks, and a mid-pregnancy scan between 18 and 21 weeks. The key dates list shows these for your pregnancy, plus UK maternity deadlines. You can add them all to your phone's calendar.</p>
<p>This calculator gives general information, not medical advice. Contact your midwife or GP with any questions, and see the <a href="https://www.nhs.uk/pregnancy/" target="_blank" rel="noopener">NHS pregnancy guide</a>.</p>""",
    [("How accurate is a due date?", "It's an estimate. Only about 1 in 20 babies is born on the due date itself; most arrive between 37 and 42 weeks. Your dating scan gives the most accurate date."),
     ("How many weeks pregnant am I?", "Enter the first day of your last period, and the calculator shows how many weeks and days pregnant you are today, counted the way midwives count."),
     ("When do I need to tell my employer?", "In the UK, by the end of the 15th week before the week your baby is due. The calculator shows this date. Check GOV.UK for the full rules on maternity leave and pay."),
     ("Is my information stored?", "No. The calculation happens in your browser and nothing is saved or sent anywhere.")],
    ("pregnancy.js",))

tool_page("ovulation-calculator",
    "Ovulation Calculator – Find Your Fertile Days & Window | etoolbox",
    "Ovulation calculator",
    "Find your most fertile days. Enter the first day of your last period and your usual cycle length to see your fertile window, ovulation day and next period for the next three cycles, on a simple calendar.",
    """
  <div class="gen">
    <form class="panel" data-ovu-calc novalidate>
      <label for="ovu-lmp">First day of your last period</label><input type="date" id="ovu-lmp" name="lmp">
      <div class="row"><div><label for="ovu-cycle">Cycle length <span class="muted">(days)</span></label><input type="number" id="ovu-cycle" name="cycle" min="20" max="45" value="28"></div>
      <div><label for="ovu-period">Period length <span class="muted">(days)</span></label><input type="number" id="ovu-period" name="period" min="1" max="10" value="5"></div></div>
      <p class="hint">Your cycle runs from the first day of one period to the day before the next. If it varies, use your average.</p>
    </form>
    <div class="panel" id="ovu-out" aria-live="polite"></div>
  </div>""",
    """<h2>How ovulation is estimated</h2><p>Ovulation usually happens about 14 days <em>before</em> your next period starts, whatever your cycle length. Sperm can survive for up to 5 days, so your fertile window is the 5 days before ovulation plus the day of ovulation. These 6 days are when you're most likely to get pregnant.</p>
<p>Cycles vary, especially when stress, illness, breastfeeding or stopping contraception are involved, so these dates are estimates. Ovulation tests, cervical mucus changes and tracking your temperature can help you pinpoint ovulation more accurately.</p>
<p><strong>Don't use this calculator as contraception.</strong> For advice on getting pregnant, see the <a href="https://www.nhs.uk/pregnancy/trying-for-a-baby/" target="_blank" rel="noopener">NHS guide to trying for a baby</a> or speak to your GP.</p>""",
    [("When am I most fertile?", "In the 2–3 days before ovulation and on the day of ovulation itself. The calculator highlights your whole fertile window."),
     ("When should I take a pregnancy test?", "From the first day of your missed period. The calculator shows this date for each cycle."),
     ("What if my cycle is irregular?", "Use your average cycle length, and treat the dates as a rough guide. If your cycles are very irregular, talk to your GP."),
     ("Is my information stored?", "No. Everything is calculated in your browser and nothing is saved.")],
    ("pregnancy.js",))
