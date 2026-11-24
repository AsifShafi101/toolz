# ---------------- Batch 6: PDF crop, header & footer, redact, fill forms, flatten, extract images, N-up, booklet; audio tools ----------------
_PDF2 = ("vendor/pdf-lib.min.js", "pdftools.js", "vendor/fflate.min.js", "pdf2.js")
_AUDIO_EXTRA = '<script type="importmap">{"imports":{"mediabunny":"/assets/vendor/mediabunny/mediabunny.min.mjs"}}</script>\n<script type="module" src="' + ver("audio.js") + '"></script>\n'


def _pdrop(i, title="Choose a PDF or drop it here", sub="Nothing is uploaded: the PDF never leaves your device"):
    return (f'<label class="drop" id="drop" for="{i}"><strong>{title}</strong><span class="muted">{sub}</span>'
            f'<input type="file" id="{i}" accept="application/pdf,.pdf" class="sr-only"></label>')


_MSG = '<p class="hint" data-msg role="status" aria-live="polite"></p>'

tool_page("crop-pdf",
    "Crop PDF Online Free – Trim Margins From PDF Pages | etoolbox",
    "Crop PDF",
    "Trim the white margins off a PDF, or cut every page down to just the part you need. Draw the crop area on the page or type exact margins in millimetres, then crop one page or all of them. Free, and your PDF never leaves your device.",
    f"""
  <form class="panel" data-crop-pdf novalidate>
    {_pdrop("cp-input")}{_MSG}
    <div id="cp-work" hidden>
      <div class="row3"><div><label for="cp-page">Preview page</label><select id="cp-page" name="page"></select></div>
      <div><label for="cp-apply">Crop</label><select id="cp-apply" name="apply"><option value="all">All pages</option><option value="one">Only the page shown</option></select></div></div>
      <div class="it-stage"><canvas id="cp-view" aria-label="Page preview. Drag to draw the area to keep."></canvas></div>
      <p class="hint">Drag on the page to draw the area to keep, or type the margins to remove. <span id="cp-size"></span></p>
      <div class="cp-m"><label>Top <input type="number" name="top" min="0" step="0.5" value="0"></label><label>Right <input type="number" name="right" min="0" step="0.5" value="0"></label><label>Bottom <input type="number" name="bottom" min="0" step="0.5" value="0"></label><label>Left <input type="number" name="left" min="0" step="0.5" value="0"></label><span class="muted">mm</span></div>
      <div class="actions"><button type="button" class="btn secondary" id="cp-reset">Reset</button><button type="button" class="btn" id="cp-run">Crop &amp; download</button></div>
    </div>
  </form>""",
    """<h2>How to crop a PDF</h2><ol><li>Choose your PDF.</li><li>Drag a box over the part of the page you want to keep, or type the margins to cut off in millimetres.</li><li>Choose whether to crop all pages or just the one shown.</li><li>Click <strong>Crop &amp; download</strong>.</li></ol>
<h2>Good uses</h2><ul><li>Remove wide white margins so a PDF is easier to read on a phone or e-reader.</li><li>Cut a scanned receipt or ticket down to size.</li><li>Trim printer's crop marks and bleed from a design proof.</li></ul>
<p>The crop changes the page size of the PDF, so it prints and displays at the new size. Text stays sharp and selectable. To shrink the file size instead, use <a href="/compress-pdf/">Compress PDF</a>.</p>""",
    [("Does cropping delete the hidden part?", "The part outside the crop is hidden in every PDF viewer and printer, but it's still in the file. To remove sensitive content for good, use Redact PDF."),
     ("Can I crop pages differently?", "Yes. Choose “Only the page shown”, crop and download, then open the new file and crop the next page."),
     ("Is my PDF uploaded?", "No. Cropping happens in your browser.")],
    _PDF2)

tool_page("pdf-header-footer",
    "Add Header and Footer to PDF – Page Numbers, Dates, Text Free | etoolbox",
    "Add header & footer to PDF",
    "Add headers and footers to every page of a PDF: page numbers like “Page 3 of 12”, today's date, the file name, a company name or “Confidential”. Choose left, centre or right, the font, size and colour. Free, and nothing is uploaded.",
    f"""
  <form class="panel" data-hf novalidate>
    {_pdrop("hf-input")}{_MSG}
    <div id="hf-work" hidden>
      <p class="hint" id="hf-info"></p>
      <h3>Header</h3><div class="row3"><div><label for="hf-hl">Left</label><input type="text" id="hf-hl" name="hl"></div><div><label for="hf-hc">Centre</label><input type="text" id="hf-hc" name="hc"></div><div><label for="hf-hr">Right</label><input type="text" id="hf-hr" name="hr" value="{{date}}"></div></div>
      <h3>Footer</h3><div class="row3"><div><label for="hf-fl">Left</label><input type="text" id="hf-fl" name="fl" value="{{file}}"></div><div><label for="hf-fc">Centre</label><input type="text" id="hf-fc" name="fc"></div><div><label for="hf-fr">Right</label><input type="text" id="hf-fr" name="fr" value="Page {{page}} of {{total}}"></div></div>
      <p class="hint">Insert: <button type="button" class="chip" data-tok="{{page}}">Page number</button> <button type="button" class="chip" data-tok="{{total}}">Total pages</button> <button type="button" class="chip" data-tok="{{date}}">Date</button> <button type="button" class="chip" data-tok="{{file}}">File name</button></p>
      <div class="hf-prev" aria-label="Preview"><div class="hf-row"><span id="hf-p-hl"></span><span id="hf-p-hc"></span><span id="hf-p-hr"></span></div><div class="hf-body"></div><div class="hf-row"><span id="hf-p-fl"></span><span id="hf-p-fc"></span><span id="hf-p-fr"></span></div></div>
      <div class="row3">
        <div><label for="hf-font">Font</label><select id="hf-font" name="font"><option value="helv">Helvetica (sans)</option><option value="times">Times (serif)</option><option value="courier">Courier (mono)</option></select></div>
        <div><label for="hf-size">Size <span class="muted">(pt)</span></label><input type="number" id="hf-size" name="size" min="5" max="40" value="9"></div>
        <div><label for="hf-color">Colour</label><input type="color" id="hf-color" name="color" value="#444444"></div>
      </div>
      <div class="row3">
        <div><label for="hf-margin">Distance from edge <span class="muted">(mm)</span></label><input type="number" id="hf-margin" name="margin" min="2" max="50" value="10"></div>
        <div><label for="hf-start">First page number</label><input type="number" id="hf-start" name="start" min="0" value="1"></div>
        <div><label for="hf-datefmt">Date format</label><select id="hf-datefmt" name="datefmt"><option value="uk">24/11/2026</option><option value="long">24 November 2026</option><option value="iso">2026-11-24</option><option value="us">11/24/2026</option></select></div>
      </div>
      <label class="check"><input type="checkbox" name="skipfirst"> Skip the first page (cover)</label>
      <div class="actions"><button type="button" class="btn" id="hf-run">Add &amp; download</button></div>
    </div>
  </form>""",
    """<h2>How to add a header or footer to a PDF</h2><ol><li>Choose your PDF.</li><li>Type text into any of the six boxes. Use the buttons to insert the page number, total pages, today's date or the file name.</li><li>Pick the font, size and colour, and skip the cover page if you like.</li><li>Click <strong>Add &amp; download</strong>.</li></ol>
<h2>Ideas</h2><ul><li><strong>Bundles and court documents:</strong> “Page {page} of {total}” bottom right and the case name top left.</li><li><strong>Reports:</strong> your company name in the footer and the date in the header.</li><li><strong>Drafts:</strong> “DRAFT – not for circulation” in the header centre.</li></ul>
<p>Only need page numbers? <a href="/add-page-numbers-to-pdf/">Add page numbers</a> is quicker. To stamp text across the middle of each page, use <a href="/add-watermark-to-pdf/">Add watermark to PDF</a>.</p>""",
    [("Can I use characters like £, é or ü?", "Yes, Western European characters work. Characters outside that set, such as Arabic, Chinese or emoji, can't be drawn with the standard PDF fonts."),
     ("Will it cover my existing text?", "Headers and footers are placed 10 mm from the edge by default. If your document has text there, increase the distance or reduce the font size."),
     ("Does it work on landscape or rotated pages?", "Yes. Text is placed on the page the way you see it.")],
    _PDF2)

tool_page("redact-pdf",
    "Redact PDF Free – Black Out Text Permanently | etoolbox",
    "Redact PDF",
    "Black out names, addresses, account numbers and anything else in a PDF, permanently. Search for words to redact everywhere at once or draw boxes by hand. Redacted pages are rebuilt as images, so the hidden text really is gone, not just covered. Free, and nothing is uploaded.",
    f"""
  <form class="panel" data-redact novalidate>
    {_pdrop("rd-input")}{_MSG}
    <div id="rd-work" hidden>
      <div class="rd-find"><label for="rd-q">Find and redact text</label><div class="rd-q"><input type="text" id="rd-q" name="find" placeholder="e.g. a name, email or account number"><button type="button" class="btn secondary" id="rd-find">Redact all matches</button></div></div>
      <div class="rd-nav"><button type="button" class="btn secondary sm" id="rd-prev" aria-label="Previous page">‹ Prev</button><span id="rd-pg"></span><button type="button" class="btn secondary sm" id="rd-next" aria-label="Next page">Next ›</button><button type="button" class="btn ghost sm" id="rd-clear">Clear this page</button></div>
      <div class="it-stage"><canvas id="rd-view" aria-label="Page. Drag to draw a redaction box; click a box to remove it."></canvas></div>
      <p class="hint">Drag to draw a black box. Click a box to remove it. <strong id="rd-count"></strong></p>
      <div class="row3"><div><label for="rd-dpi">Quality of redacted pages</label><select id="rd-dpi" name="dpi"><option value="150" selected>150 dpi · smaller file</option><option value="200">200 dpi</option><option value="300">300 dpi · best for printing</option></select></div></div>
      <div class="actions"><button type="button" class="btn" id="rd-run" disabled>Redact &amp; download</button></div>
    </div>
  </form>""",
    """<h2>How to redact a PDF</h2><ol><li>Choose your PDF.</li><li>Type a word, name or number and click <strong>Redact all matches</strong> to black it out on every page. Repeat for anything else.</li><li>Go through the pages and drag boxes over anything the search missed, such as signatures, photos or handwriting.</li><li>Click <strong>Redact &amp; download</strong>.</li></ol>
<h2>Why this is real redaction</h2><p>Drawing a black rectangle in most PDF editors only <em>covers</em> the text. Anyone can copy it out from underneath or delete the box. Here, every page with a redaction is turned into a flat image with the black boxes burned in, so the original text, hidden layers and any metadata on that page are removed. Pages without redactions are kept as they are, with selectable text.</p>
<p>The new PDF also leaves out the original document properties (title, author and so on).</p>
<p class="note">Always check the downloaded file before sharing it. The text search can't find words in scanned pages, images or unusual fonts, so draw those boxes by hand.</p>""",
    [("Can redacted text be recovered?", "No. Redacted pages are rebuilt from an image with the boxes burned in, so the text under the boxes no longer exists in the file."),
     ("Why can't I select text on redacted pages any more?", "Because those pages are now images. That is what makes the redaction permanent. Pages you didn't redact keep their text."),
     ("Is it safe for confidential documents?", "Yes. The PDF is processed in your browser and never uploaded to us or anyone else.")],
    _PDF2)

tool_page("fill-pdf-form",
    "Fill PDF Form Online Free – Type Into PDF Forms | etoolbox",
    "Fill in a PDF form",
    "Fill in a fillable PDF form without Adobe: type into text boxes, tick checkboxes and choose options, then download the completed PDF. You can lock the answers so they can't be changed. Free, and your form never leaves your device.",
    f"""
  <form class="panel" data-fill novalidate>
    {_pdrop("ff-input", "Choose a PDF form or drop it here")}{_MSG}
    <p class="hint" id="ff-info"></p>
    <div class="ff-fields" id="ff-fields"></div>
    <div id="ff-work" hidden>
      <label class="check"><input type="checkbox" name="flatten"> Lock the answers (flatten the form so it can't be edited)</label>
      <div class="actions"><button type="button" class="btn" id="ff-run">Download filled PDF</button></div>
    </div>
  </form>""",
    """<h2>How to fill in a PDF form</h2><ol><li>Choose the PDF form. Every fillable field is listed with its page number.</li><li>Type your answers, tick the boxes and choose options.</li><li>Tick <strong>Lock the answers</strong> if you're sending the form on and don't want it changed.</li><li>Click <strong>Download filled PDF</strong>.</li></ol>
<h2>What if my PDF isn't fillable?</h2><p>Many forms are just printed pages saved as PDF, with no boxes to type in. For those, use <a href="/sign-pdf/">Sign PDF</a>, which lets you type text, tick marks and your signature anywhere on the page.</p>
<p>Need to send it to someone who mustn't edit it? <a href="/flatten-pdf/">Flatten PDF</a> locks forms, and <a href="/protect-pdf/">Protect PDF</a> adds a password.</p>""",
    [("Is this safe for forms with personal details?", "Yes. The form is filled in your browser and never uploaded."),
     ("Why are some fields greyed out?", "They're marked read-only in the PDF, so they can't be changed."),
     ("Can I save and finish later?", "Yes. Download the PDF without locking it, then open it here again later. Your answers will still be there.")],
    _PDF2)

tool_page("flatten-pdf",
    "Flatten PDF Online Free – Lock Forms and Annotations | etoolbox",
    "Flatten PDF",
    "Flatten a PDF so form fields, answers, comments and stamps become a fixed part of the page and can't be edited. Lock just the form fields and keep the text selectable, or turn every page into an image. Free and private.",
    f"""
  <form class="panel" data-flatten novalidate>
    {_pdrop("fl-input")}{_MSG}
    <div id="fl-work" hidden>
      <p class="hint" id="fl-info"></p>
      <label for="fl-mode">What to flatten</label><select id="fl-mode" name="mode"><option value="forms">Form fields only · text stays selectable, small file</option><option value="image">Everything: forms, comments and stamps · pages become images</option></select>
      <label for="fl-dpi">Image quality <span class="muted">(for “Everything”)</span></label><select id="fl-dpi" name="dpi"><option value="150">150 dpi</option><option value="200">200 dpi</option><option value="300">300 dpi</option></select>
      <div class="actions"><button type="button" class="btn" id="fl-run">Flatten &amp; download</button></div>
    </div>
  </form>""",
    """<h2>What does flattening a PDF do?</h2><p>A filled-in PDF form still has live fields: anyone who opens it can change the answers, and some apps show empty boxes or the wrong values. Flattening turns the fields into ordinary page content, so the form looks the same everywhere and can't be edited.</p>
<ul><li><strong>Form fields only</strong> is best for most forms. The text stays sharp and searchable and the file stays small.</li><li><strong>Everything</strong> also fixes comments, highlights, stamps and signatures in place by turning each page into an image. Use it when a portal or printer shows annotations wrongly.</li></ul>
<p>To fill in a form first, use <a href="/fill-pdf-form/">Fill PDF form</a>.</p>""",
    [("Can I undo flattening?", "Not in the flattened file. Keep your original PDF if you might need to edit the answers later."),
     ("Will the file get bigger?", "Flattening form fields barely changes the size. “Everything” turns pages into images, which usually makes the file bigger."),
     ("Is my PDF uploaded?", "No. Flattening happens in your browser.")],
    _PDF2)

tool_page("extract-images-from-pdf",
    "Extract Images From PDF Free – Save All Pictures as PNG or JPG | etoolbox",
    "Extract images from PDF",
    "Save every photo, logo and picture inside a PDF as separate image files at their original resolution. See them all first, skip tiny icons, and download them as PNG or JPG in one ZIP. Free, and your PDF never leaves your device.",
    f"""
  <form class="panel" data-extract novalidate>
    {_pdrop("ex-input")}{_MSG}
    <div class="row3"><div><label for="ex-min">Skip images smaller than</label><select id="ex-min" name="min"><option value="0">Keep all</option><option value="32">32 px</option><option value="64" selected>64 px</option><option value="200">200 px</option></select></div>
    <div><label for="ex-fmt">Save as</label><select id="ex-fmt" name="fmt"><option value="image/png">PNG · best quality</option><option value="image/jpeg">JPG · smaller files</option></select></div></div>
    <p class="hint" id="ex-sum"></p>
    <div class="ex-grid" id="ex-grid"></div>
    <div class="actions"><button type="button" class="btn" id="ex-run" hidden>Download images</button></div>
  </form>""",
    """<h2>How to extract images from a PDF</h2><ol><li>Choose your PDF. Every picture inside it appears below, with its page and size.</li><li>Hide small icons and decorations with <strong>Skip images smaller than</strong>.</li><li>Click <strong>Download images</strong>. You get one file, or a ZIP if there are several.</li></ol>
<h2>Extract images or convert pages?</h2><p>This tool saves the pictures that are embedded in the PDF, at their original size. If you want a picture of each whole page, including its text, use <a href="/pdf-to-jpg/">PDF to JPG</a> instead.</p>
<p class="note">Only reuse images you have the right to use.</p>""",
    [("Why are some images missing?", "Charts and logos drawn as vector graphics aren't images, so they can't be extracted. Use PDF to JPG to capture them as part of the page."),
     ("Why is a scanned PDF one image per page?", "Scanners save each page as one picture, so that's what's inside the PDF."),
     ("Are images extracted at full quality?", "Yes, at the resolution they're stored in the PDF. Choose PNG to avoid any further compression.")],
    _PDF2)

_NUP_OPTS = """
      <div class="row3"><div><label for="nu-paper">Paper</label><select id="nu-paper" name="paper"><option value="a4">A4</option><option value="a3">A3</option><option value="letter">US Letter</option></select></div>
      <div><label for="nu-margin">Margin <span class="muted">(mm)</span></label><input type="number" id="nu-margin" name="margin" min="0" max="40" value="8"></div>
      <div><label for="nu-gap">Gap between pages <span class="muted">(mm)</span></label><input type="number" id="nu-gap" name="gap" min="0" max="40" value="6"></div></div>
      <label class="check"><input type="checkbox" name="border"> Draw a thin border round each page</label>"""

tool_page("n-up-pdf",
    "N-up PDF – Print 2, 4, 6, 8, 9 or 16 Pages Per Sheet Free | etoolbox",
    "Multiple pages per sheet (N-up PDF)",
    "Put 2, 4, 6, 8, 9 or 16 PDF pages on each sheet to save paper when printing handouts, slides and revision notes. Choose A4, A3 or Letter, the margins and borders. Free, and nothing is uploaded.",
    f"""
  <form class="panel" data-nup="nup" novalidate>
    {_pdrop("nu-input")}{_MSG}
    <div id="nu-work" hidden>
      <label for="nu-per">Pages per sheet</label><select id="nu-per" name="per"><option value="2">2 (side by side)</option><option value="4" selected>4 (2 × 2)</option><option value="6">6 (3 × 2)</option><option value="8">8 (4 × 2)</option><option value="9">9 (3 × 3)</option><option value="16">16 (4 × 4)</option></select>
      {_NUP_OPTS}
      <p class="hint" id="nu-plan"></p><div id="nu-order" hidden></div>
      <div class="actions"><button type="button" class="btn" id="nu-run">Create &amp; download</button></div>
    </div>
  </form>""",
    """<h2>How to print several pages on one sheet</h2><ol><li>Choose your PDF.</li><li>Pick how many pages per sheet, the paper size, margins and gap.</li><li>Click <strong>Create &amp; download</strong>, then print the new PDF at 100% (“Actual size”).</li></ol>
<h2>Which layout should I use?</h2><ul><li><strong>2 per sheet:</strong> readable documents on half the paper.</li><li><strong>4 per sheet:</strong> slide handouts and lecture notes.</li><li><strong>6, 8 or 9 per sheet:</strong> revision cards and thumbnails.</li><li><strong>16 per sheet:</strong> a contact sheet to check the order of a long document.</li></ul>
<p>The orientation is chosen for you: landscape pages are arranged so they fit best. Making a folded booklet? Use the <a href="/pdf-booklet-maker/">PDF booklet maker</a>.</p>""",
    [("Will text become too small?", "At 2 or 4 per sheet most documents stay readable. Use A3 paper or fewer pages per sheet for small print."),
     ("What order are pages placed in?", "Left to right, then top to bottom, like reading."),
     ("Is my PDF uploaded?", "No. The new PDF is made in your browser.")],
    _PDF2)

tool_page("pdf-booklet-maker",
    "PDF Booklet Maker – Print a Folded A5 Booklet From A4 Free | etoolbox",
    "PDF booklet maker",
    "Turn any PDF into a booklet you can print double-sided, fold in half and staple. Pages are put in the right order automatically, two per side, and blank pages are added if needed. Perfect for A5 programmes, order of service, zines and manuals. Free and private.",
    f"""
  <form class="panel" data-nup="booklet" novalidate>
    {_pdrop("nu-input")}{_MSG}
    <div id="nu-work" hidden>
      {_NUP_OPTS}
      <p class="hint" id="nu-plan"></p><div class="nu-order" id="nu-order"></div>
      <div class="actions"><button type="button" class="btn" id="nu-run">Create booklet</button></div>
    </div>
  </form>""",
    """<h2>How to make and print a booklet</h2><ol><li>Choose your PDF, with the pages in normal reading order.</li><li>Click <strong>Create booklet</strong>. Each sheet of A4 now holds four of your pages: two on the front and two on the back.</li><li>Print the new PDF <strong>double-sided, flipping on the short edge</strong>, at 100% (“Actual size”).</li><li>Stack the sheets in order, fold them in half and staple along the fold.</li></ol>
<p>Printing A4 paper gives an A5 booklet; A3 paper gives an A4 booklet. The number of pages in a booklet is always a multiple of 4, so blank pages are added at the end if needed. If you want a blank inside cover, add blank pages to your document before making the booklet.</p>
<p class="note">No double-sided printer? Print the odd-numbered pages of the booklet PDF, put the stack back in the printer, then print the even pages. Do a one-sheet test first to check which way round the paper goes.</p>""",
    [("Which way should I flip the pages?", "Choose “flip on short edge” (sometimes called “short-edge binding”). Flipping on the long edge prints every back side upside down."),
     ("Why are there blank pages?", "A folded booklet always has a multiple of 4 pages. Blank pages are added at the end to make up the number."),
     ("How many pages can a stapled booklet have?", "With ordinary office paper and a long-arm stapler, about 40 to 60 pages (10 to 15 sheets) folds neatly.")],
    _PDF2)

# ---------------- Audio ----------------
def _ac_ui(to, title, sub, accept):
    opts = ('<div><label for="ac-bitrate">MP3 quality</label><select id="ac-bitrate" name="bitrate"><option value="128">128 kbps · good</option><option value="192" selected>192 kbps · high</option><option value="320">320 kbps · best</option></select></div>'
            if to == "mp3" else '<input type="hidden" name="bitrate" value="0">')
    return f"""
  <div class="gen"><form class="panel" data-audioconv="{to}" novalidate>
    <label class="drop" id="drop" for="ac-input"><strong>{title}</strong><span class="muted">{sub}</span><input type="file" id="ac-input" accept="{accept}" class="sr-only"></label>
    <p id="ac-info" class="v2m-info"></p>
    <div class="row">{opts}<div><label for="ac-ch">Channels</label><select id="ac-ch" name="channels"><option value="2">Same as original</option><option value="1">Mono · half the size</option></select></div></div>
    <div class="v2m-actions"><button type="button" class="btn" id="ac-go" disabled>Convert to {to.upper()}</button></div>
    <div class="v2m-bar" id="ac-bar" hidden><i></i></div>
    <p id="ac-msg" class="hint" role="status" aria-live="polite"></p>
  </form>
  <div class="panel"><h3 style="margin:0">Your {to.upper()}</h3><p class="muted" style="margin:8px 0 0">Your file appears here, ready to play and download.</p>
    <div id="ac-out" hidden><audio id="ac-audio" controls preload="metadata" style="width:100%;margin-top:12px"></audio><p id="ac-res" class="hint"></p><a class="btn" id="ac-dl" href="#">Download {to.upper()}</a></div></div></div>"""


_AC_NOTE = '<p class="note">MP3 encoding uses <a href="https://lame.sourceforge.io/" rel="noopener">LAME</a> (LGPL) via <a href="https://mediabunny.dev/" rel="noopener">Mediabunny</a> (MPL-2.0).</p>'

tool_page("mp3-to-wav",
    "MP3 to WAV Converter – Free, No Upload | etoolbox",
    "MP3 to WAV converter",
    "Convert MP3 (and M4A, OGG or other audio) to standard 16-bit WAV for editing software, DJ apps, phone systems and CDs. Free, with no sign-up, and your audio never leaves your device.",
    _ac_ui("wav", "Choose an MP3 file or drop it here", "MP3, M4A, OGG, FLAC and more · never uploaded", "audio/*,.mp3,.m4a,.ogg,.flac,.opus"),
    """<h2>How to convert MP3 to WAV</h2><ol><li>Choose your MP3 file.</li><li>Choose mono if your phone system or app needs it.</li><li>Click <strong>Convert to WAV</strong>.</li></ol>
<h2>When do you need WAV?</h2><ul><li>Audio editors and DAWs that work best with uncompressed audio.</li><li>Phone systems and on-hold messages, which often need mono WAV.</li><li>Burning an audio CD.</li></ul>
<p>Converting an MP3 to WAV doesn't bring back detail the MP3 removed; it just stores the same sound uncompressed, so the file is about 10 times bigger.</p>""",
    [("What kind of WAV do I get?", "Standard 16-bit PCM WAV at the original sample rate, which every app supports."),
     ("Is my audio uploaded?", "No. The conversion happens in your browser.")],
    (), extra=_AUDIO_EXTRA)

tool_page("audio-cutter",
    "Audio Cutter – Trim MP3 and Make Ringtones Free | etoolbox",
    "Audio cutter",
    "Cut and trim MP3, WAV and M4A files: drag the handles on the waveform, listen to your selection, add a fade in and fade out, and save as MP3 or WAV. Great for ringtones, podcast clips and voice notes. Free, and nothing is uploaded.",
    """
  <form class="panel" data-cutter novalidate>
    <label class="drop" id="drop" for="cu-input"><strong>Choose an audio file or drop it here</strong><span class="muted">MP3, WAV, M4A, OGG · never uploaded</span><input type="file" id="cu-input" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac" class="sr-only"></label>
    <p id="cu-msg" class="hint" role="status" aria-live="polite"></p>
    <div id="cu-work" hidden>
      <canvas id="cu-wave" class="cu-wave" aria-label="Waveform. Drag the orange handles to choose the part to keep."></canvas>
      <p class="hint" id="cu-len"></p>
      <div class="row3"><div><label for="cu-start">Start</label><input type="text" id="cu-start" name="start" inputmode="decimal"></div><div><label for="cu-end">End</label><input type="text" id="cu-end" name="end" inputmode="decimal"></div><div class="cu-playbox"><button type="button" class="btn secondary" id="cu-play">▶ Play selection</button></div></div>
      <div class="row3"><div><label for="cu-fi">Fade in <span class="muted">(seconds)</span></label><input type="number" id="cu-fi" name="fadein" min="0" max="30" step="0.5" value="0"></div><div><label for="cu-fo">Fade out <span class="muted">(seconds)</span></label><input type="number" id="cu-fo" name="fadeout" min="0" max="30" step="0.5" value="0"></div>
      <div><label for="cu-ch">Channels</label><select id="cu-ch" name="channels"><option value="2">Same as original</option><option value="1">Mono</option></select></div></div>
      <div class="row3"><div><label for="cu-fmt">Save as</label><select id="cu-fmt" name="fmt"><option value="mp3">MP3</option><option value="wav">WAV</option></select></div><div id="cu-br"><label for="cu-bitrate">MP3 quality</label><select id="cu-bitrate" name="bitrate"><option value="128">128 kbps</option><option value="192" selected>192 kbps</option><option value="320">320 kbps</option></select></div></div>
      <div class="actions"><button type="button" class="btn" id="cu-dl">Cut &amp; download</button></div>
    </div>
  </form>""",
    """<h2>How to cut an audio file</h2><ol><li>Choose your audio file. Its waveform appears.</li><li>Drag the orange handles to the start and end of the part you want, or type the times (like 0:42.5).</li><li>Press <strong>Play selection</strong> to check it, and add a short fade so it doesn't start or stop abruptly.</li><li>Choose MP3 or WAV and click <strong>Cut &amp; download</strong>.</li></ol>
<h2>Make a ringtone</h2><ul><li><strong>iPhone:</strong> ringtones can be up to 40 seconds. Save as MP3, then use GarageBand on your iPhone to set it as a ringtone.</li><li><strong>Android:</strong> save as MP3, copy it to the Ringtones folder (or open it in Files), then choose it in Settings → Sound.</li></ul>
<p>Need a different format for the whole file? Try <a href="/wav-to-mp3/">WAV to MP3</a> or <a href="/m4a-to-mp3/">M4A to MP3</a>. Cutting the sound from a video? Use <a href="/video-to-mp3/">Video to MP3</a>.</p>""" + _AC_NOTE,
    [("How long a file can I cut?", "Files up to about an hour work well on most computers. Very long files need a lot of memory, so use Video to MP3's cut option for those."),
     ("Will cutting reduce quality?", "WAV keeps the audio exactly as decoded. MP3 at 192 or 320 kbps sounds the same to most people."),
     ("Is my audio uploaded?", "No. Everything happens in your browser.")],
    (), extra=_AUDIO_EXTRA)
