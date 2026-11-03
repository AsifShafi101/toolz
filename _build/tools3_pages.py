# ---------------- Batch 3: from the user's top-25 list ----------------

PDFJS = ("vendor/pdf-lib.min.js", "pdftools.js")

tool_page("compress-pdf", "Compress PDF – Reduce PDF File Size Free, No Upload | etoolbox", "Compress PDF",
    "Make PDFs smaller so they fit email limits and upload forms. Choose how much to compress. Your file is processed on your device and never uploaded.",
    pdf_ui("compress", button="Compress PDF", opts=f"""
<label>Compression</label>
{seg("level", [("light", "Light (keeps text)"), ("recommended", "Recommended"), ("strong", "Strong (smallest)")], "recommended")}
<p class="hint" style="margin-top:8px">'Recommended' and 'Strong' work best on scanned or image-heavy PDFs. They turn pages into images, so text can't be selected afterwards. 'Light' keeps everything editable.</p>"""),
    """<h2>Which level should I choose?</h2><ul><li><strong>Light:</strong> tidies up the file's structure without touching quality. It's best for text documents, though savings are usually modest.</li>
<li><strong>Recommended:</strong> 144 dpi, which looks sharp on screen and prints fine. It's great for scans and photos.</li><li><strong>Strong:</strong> 96 dpi gives the smallest files and suits email attachments and upload limits.</li></ul>
<p>If compressing doesn't make the file smaller, we keep your original so you never get a bigger file.</p>""" + PDF_PRIVACY,
    [("Why didn't my PDF get much smaller?", "Text-only PDFs are already compact. The biggest savings come from scanned documents and PDFs full of photos."),
     ("Can I still search the text?", "With 'Light', yes. 'Recommended' and 'Strong' turn pages into images, so the text can no longer be selected or searched.")], PDFJS)

tool_page("pdf-to-word", "PDF to Word – Convert PDF to Editable DOCX Free | etoolbox", "PDF to Word converter",
    "Turn the text in a PDF into an editable Word document (.docx), with paragraphs and headings preserved. It's free, and your file never leaves your device.",
    pdf_ui("pdf2word", button="Convert to Word"),
    """<h2>What gets converted</h2><ul><li>✓ All the text, grouped into paragraphs</li><li>✓ Headings, which are detected from larger text and made bold</li><li>✓ Page breaks</li><li>✗ Exact layout, images and tables. For pixel-perfect layouts, a desktop app such as Microsoft Word (File → Open the PDF) does a fuller conversion.</li></ul>
<p>Scanned PDFs are just pictures of text, so there's no text to extract. They need OCR software.</p>""" + PDF_PRIVACY,
    [("Does it work with Google Docs?", "Yes. Upload the .docx to Google Drive and open it with Google Docs."),
     ("Why is my document empty?", "If the PDF is a scan or photo, it contains images rather than text. You'd need OCR (text recognition) to convert it.")], PDFJS + ("vendor/fflate.min.js",))

tool_page("word-to-pdf", "Word to PDF – Convert DOCX to PDF Free | etoolbox", "Word to PDF converter",
    "Convert a Word document (.docx) to PDF in your browser, with headings, lists, tables and images. There's no upload and no sign-up.",
    """
  <div class="inv">
    <form class="panel" data-word2pdf novalidate>
      <label class="drop" id="drop" for="doc-input"><strong>Choose a Word document or drop it here</strong><span class="muted">.docx files · converted on your device, never uploaded</span>
        <input type="file" id="doc-input" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="sr-only"></label>
      <p class="muted" id="doc-name" style="margin:10px 0 0"></p>
      <div class="run-row"><button type="button" class="btn" id="print-doc" disabled>Download PDF</button><span id="doc-msg" class="warn" role="status"></span></div>
      <p class="hint" style="margin-top:10px">Your browser's print window opens. Choose <strong>Save as PDF</strong> as the destination. On a phone, use Share → Print → pinch out to save.</p>
    </form>
    <div class="doc-wrap"><div class="doc flow" id="doc" aria-label="Document preview"><p class="muted">Your document preview will appear here.</p></div></div>
  </div>""",
    """<h2>Good to know</h2><ul><li>Headings, bold and italic text, lists, tables, links and images are kept.</li><li>Complex layouts (text boxes, columns, headers and footers) are simplified.</li><li>Old .doc files: open them in Word and save as .docx first.</li></ul>""",
    [("Is my document uploaded?", "No. The conversion runs in your browser, which is ideal for contracts, CVs and anything confidential."),
     ("Can I convert Google Docs?", "Yes. In Google Docs, go to File → Download → PDF. Or download as .docx and use this tool.")],
    ("vendor/mammoth.browser.min.js", "word2pdf.js"))

def conv_page(slug, title, h1, intro, fmt, faqs):
    tool_page(slug, title, h1, intro, img_ui("convert", f"""
<label>Convert to</label>
{seg("format", [("jpeg", "JPG"), ("png", "PNG"), ("webp", "WebP")], fmt)}
{QUALITY.format(q=90)}
<div data-show-when="format=jpeg"><label class="check" style="margin-top:12px">Background for transparent areas <input type="color" name="bg" value="#ffffff"></label></div>
<input type="hidden" name="resizeby" value="pixels">"""),
    """<p>Converts up to 30 images at once, right in your browser. Need other sizes too? Try the <a href="/image-resizer/">image resizer</a> or <a href="/image-compressor/">compressor</a>.</p>""", faqs, ("image.js",))

conv_page("jpg-to-png", "JPG to PNG Converter – Free, Batch, No Upload | etoolbox", "JPG to PNG converter",
    "Convert JPG photos to PNG in seconds, one image or up to 30 at once. It's free, and your images never leave your device.", "png",
    [("Will PNG make my photo better quality?", "No. It keeps the current quality exactly, but files are usually larger. Use PNG when you need to edit the image further or need a format that won't lose detail."),
     ("Will the background become transparent?", "No. JPGs have no transparency to keep. Use the background remover to make backgrounds transparent.")])
conv_page("png-to-jpg", "PNG to JPG Converter – Free, Batch, No Upload | etoolbox", "PNG to JPG converter",
    "Convert PNG images to JPG for smaller files that work everywhere. Transparent areas are filled with white or a colour you choose.", "jpeg",
    [("Why convert PNG to JPG?", "Photos saved as PNG are often 5–10 times bigger than the same photo as a JPG.")])
conv_page("webp-to-jpg", "WebP to JPG Converter – Free, No Upload | etoolbox", "WebP to JPG converter",
    "Downloaded a .webp image that won't open? Convert WebP to JPG (or PNG) in your browser. It's free and nothing is uploaded.", "jpeg",
    [("What is WebP?", "WebP is a modern image format used by many websites. Some older apps and printers don't support it, so JPG is the safer choice for sharing.")])

tool_page("background-remover", "Remove Background from Image Free – AI, No Upload | etoolbox", "Remove image background",
    "Remove the background from any photo with AI: people, products, pets, cars and logos. Get a transparent PNG, a white or coloured background, or a blurred one. Free, no sign-up, and your photo is processed on your device.",
    """
  <div class="gen">
    <form class="panel" data-bgai novalidate>
      <label class="drop" id="drop" for="bg-input"><strong>Choose a photo or drop it here</strong><span class="muted">JPG, PNG or WebP · or paste with Ctrl+V · never uploaded</span>
        <input type="file" id="bg-input" accept="image/jpeg,image/png,image/webp" class="sr-only"></label>
      <label style="margin-top:14px">Method</label>
      <div class="seg" role="radiogroup" aria-label="Method"><label><input type="radio" name="method" value="ai" checked><span>AI – any background</span></label><label><input type="radio" name="method" value="colour"><span>Plain colour (logos, signatures)</span></label></div>
      <div data-show-when="method=ai"><label for="cleanup">Edge cleanup: <span id="cln-val"></span> <span class="hint">(raise to remove faint halos, lower to keep hair and fine detail)</span></label><input type="range" id="cleanup" name="cleanup" min="0" max="100" value="35"></div>
      <div data-show-when="method=colour">
        <div class="row" style="margin-top:6px"><div><label for="bgcolour">Background colour <span class="hint">(auto-detected)</span></label><input type="color" id="bgcolour" name="bgcolour" value="#ffffff" style="width:100%;height:46px"></div>
        <div><label for="mode">Remove</label><select id="mode" name="mode"><option value="connected">Background only (edges inwards)</option><option value="all">Every matching colour</option></select></div></div>
        <label for="tolerance">Tolerance: <span id="tol-val"></span></label><input type="range" id="tolerance" name="tolerance" min="1" max="60" value="12">
        <label for="feather">Edge softness: <span id="fea-val"></span></label><input type="range" id="feather" name="feather" min="0" max="40" value="8">
      </div>
      <div class="row"><div><label for="fill">New background</label><select id="fill" name="fill"><option value="none">Transparent (PNG)</option><option value="colour">Solid colour (JPG)</option><option value="blur">Blurred original (JPG)</option></select></div>
      <div data-show-when="fill=colour"><label for="fillcolour">Colour</label><input type="color" id="fillcolour" name="fillcolour" value="#ffffff" style="width:100%;height:46px"></div></div>
      <progress id="bg-progress" max="100" value="0" hidden style="width:100%;margin-top:12px"></progress>
      <p id="bg-msg" class="hint" role="status" aria-live="polite" style="margin-top:10px"></p>
    </form>
    <div class="panel preview"><div class="checker"><canvas id="bg-view" hidden aria-label="Result preview"></canvas></div>
      <div id="bg-actions" class="actions" hidden><button type="button" class="btn" id="bg-dl">Download</button><button type="button" class="btn secondary" id="bg-orig" title="Hold to compare with the original">Hold to compare</button><button type="button" class="btn secondary" id="bg-reset">Undo clicks</button></div>
      <p class="note">Tip: click any leftover background in the preview to remove it too.</p></div>
  </div>""",
    """<h2>How to remove a background</h2><ol><li>Choose or drop a photo. You can also paste a screenshot with Ctrl+V.</li><li>The AI finds the main subject (a person, product, pet, car or logo) and removes everything else.</li><li>Pick a transparent, coloured or blurred background, then click <strong>Download</strong>.</li></ol>
<h2>Private AI that runs on your device</h2><p>Most background removers upload your photo to their servers. etoolbox runs the AI model <strong>inside your browser</strong>. The first time, your browser downloads the model (about 46&nbsp;MB) from etoolbox and keeps it, so later photos are processed straight away, even offline. Your photo is never uploaded.</p>
<h2>Which method should I use?</h2><ul><li><strong>AI</strong> works on almost any photo: people, products on a table, pets, cars, food and busy backgrounds.</li><li><strong>Plain colour</strong> is best for logos, signatures, stamps and icons on a white or single-colour background, where you want razor-sharp edges.</li><li>Use <strong>Edge cleanup</strong> to fine-tune: higher removes faint halos, lower keeps fine hair.</li></ul>
<h2>Popular uses</h2><ul><li>Product photos for eBay, Etsy, Amazon, Vinted and Shopify (white background)</li><li>Profile pictures and LinkedIn headshots</li><li>Transparent logos and signatures for documents</li><li>Passport-style photos on a plain background (check the official rules before you submit)</li></ul>""",
    [("Is it really free?", "Yes. There's no sign-up, no watermark and no limit on how many photos you process."),
     ("Is my photo uploaded?", "No. The AI runs in your browser. Only the model file is downloaded from etoolbox; your photo stays on your device."),
     ("Why is the first photo slower?", "Your browser downloads the AI model once (about 46 MB). After that it's stored on your device, so the next photos take a few seconds."),
     ("What resolution do I get?", "Images up to 2,500 pixels on the longest side are kept at full size. Larger photos are scaled down to 2,500 pixels."),
     ("How do I make a transparent signature?", "Photograph your signature on white paper in good light, choose 'Plain colour', and download the PNG."),
     ("Which AI model is used?", "ISNet (Dichotomous Image Segmentation), an open-source model released under the Apache 2.0 licence, compressed to run in the browser.")],
    ("colour.js", "bgremove.js"))

tool_page("colour-picker", "Colour Picker – HEX, RGB, HSL, CMYK & Contrast Checker | etoolbox", "Colour picker &amp; converter",
    "Pick a colour and get its HEX, RGB, HSL and CMYK codes, lighter and darker shades, and WCAG contrast scores. You can also pick colours from your screen or a photo.",
    """
  <div class="gen">
    <form class="panel" data-colour novalidate>
      <div class="swatch" id="swatch"></div>
      <div class="row"><div><label for="picker">Pick a colour</label><input type="color" id="picker" name="picker" value="#ff6b35" style="width:100%;height:46px"></div>
      <div><label for="code">Or type a code</label><input type="text" id="code" name="code" placeholder="#FF6B35, rgb(…) or hsl(…)"></div></div>
      <p id="code-msg" class="warn"></p>
      <div class="btn-row"><button type="button" class="btn secondary small" id="eyedropper">💧 Pick from screen</button>
        <label class="btn secondary small" for="pick-input" style="margin:0">🖼️ Pick from a photo<input type="file" id="pick-input" accept="image/*" class="sr-only"></label></div>
      <canvas id="pick-canvas" hidden></canvas>
    </form>
    <div class="panel preview" style="text-align:left"><div id="formats" class="calc-out"></div>
      <h3 style="margin:16px 0 0">Shades</h3><div class="shades" id="shades"></div>
      <h3 style="margin:16px 0 0">Text contrast (WCAG)</h3><div id="contrast"></div></div>
  </div>""",
    """<h2>Which code do I need?</h2><ul><li><strong>HEX</strong> (#FF6B35): websites, Canva and most design apps.</li><li><strong>RGB:</strong> screens and CSS.</li><li><strong>CMYK:</strong> print shops and leaflets.</li></ul>
<p><strong>Contrast:</strong> for readable text, aim for at least <strong>4.5:1</strong> (WCAG AA). Large headings need 3:1.</p>""",
    [("How do I find a colour from my logo?", "Click 'Pick from a photo', upload your logo, then click the colour you want."),
     ("Are CMYK values exact?", "They're a standard conversion. For brand-critical printing, ask your printer for a proof, because inks and paper affect the result.")],
    ("colour.js",))

# ---------------- Web & developer ----------------

tool_page("json-formatter", "JSON Formatter & Validator – Beautify, Minify, Check | etoolbox", "JSON formatter &amp; validator",
    "Paste JSON to format it, validate it with clear error messages (line and column), sort keys or minify it. Everything runs in your browser.",
    """
  <div class="panel" data-json>
    <div class="btn-row" style="margin:0 0 12px">
      <button type="button" class="btn small" id="json-format">Format</button><button type="button" class="btn secondary small" id="json-minify">Minify</button>
      <label class="check" style="margin:0 8px">Indent <select id="indent" style="width:auto;padding:6px 8px"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label>
      <label class="check" style="margin:0"><input type="checkbox" id="sortkeys"> Sort keys</label>
      <button type="button" class="btn secondary small" id="json-sample" style="margin-left:auto">Load example</button>
    </div>
    <div class="json-grid">
      <div><label for="json-in">Input</label><textarea id="json-in" class="code" spellcheck="false" placeholder='{"paste": "your JSON here"}'></textarea></div>
      <div><label for="json-out">Output</label><textarea id="json-out" class="code" spellcheck="false" readonly></textarea>
        <div class="btn-row"><button type="button" class="btn small" id="json-copy">Copy</button><button type="button" class="btn secondary small" id="json-dl">Download .json</button></div></div>
    </div>
    <p id="json-msg" class="muted" role="status" style="margin:12px 0 0">Paste JSON on the left.</p>
  </div>""",
    """<h2>Common JSON errors</h2><ul><li>Single quotes: JSON needs <code>"double quotes"</code>.</li><li>Trailing commas: <code>[1, 2, 3,]</code> isn't allowed.</li><li>Comments aren't allowed in JSON.</li><li>Keys must be quoted: <code>{"name": "x"}</code>, not <code>{name: "x"}</code>.</li></ul>""",
    [("Is my JSON sent anywhere?", "No. Formatting and validation happen in your browser, so it's safe for API keys and private data.")],
    ("devtools.js",))

tool_page("meta-description-generator", "Meta Description Generator & Google SERP Preview | etoolbox", "Meta description generator",
    "Write the perfect meta description and page title. Get ready-made ideas, check the length in pixels like Google does, preview your search result and copy the HTML tags.",
    """
  <div class="gen">
    <form class="panel" data-meta novalidate>
      <div class="row"><div><label for="business">Business or brand</label><input type="text" id="business" name="business" placeholder="e.g. Shafi Plumbing"></div>
      <div><label for="keyword">Main keyword / service</label><input type="text" id="keyword" name="keyword" placeholder="e.g. emergency plumber"></div></div>
      <div class="row"><div><label for="location">Location <span class="hint">(optional)</span></label><input type="text" id="location" name="location" placeholder="e.g. Leeds"></div>
      <div><label for="cta">Call to action</label><input type="text" id="cta" name="cta" value="Call today for a free quote"></div></div>
      <label for="usp">What makes you different? <span class="hint">(optional)</span></label><input type="text" id="usp" name="usp" placeholder="e.g. 24/7 call-outs with no call-out fee">
      <h3 style="margin:18px 0 6px">Ideas <span class="hint">(click one to use it)</span></h3><ul class="ideas" id="meta-ideas"></ul>
      <label for="title">Page title</label><input type="text" id="title" name="title" placeholder="Leave blank to auto-fill"><p class="hint" id="title-count"></p>
      <label for="description">Meta description</label><textarea id="description" name="description" rows="3" style="min-height:80px"></textarea><p class="hint" id="desc-count"></p>
      <label for="url">Page address <span class="hint">(optional)</span></label><input type="text" id="url" name="url" placeholder="https://www.yourbusiness.co.uk/" inputmode="url">
    </form>
    <div class="panel"><h3 style="margin:0 0 10px">Google preview</h3>
      <div class="serp"><div class="serp-url" id="serp-url"></div><div class="serp-title" id="serp-title"></div><div class="serp-desc" id="serp-desc"></div></div>
      <h3 style="margin:18px 0 8px">HTML tags</h3><textarea id="meta-code" class="code" readonly style="min-height:150px;font-size:.78rem"></textarea>
      <div class="btn-row"><button type="button" class="btn small" id="meta-copy">Copy code</button></div></div>
  </div>""",
    """<h2>Tips for meta descriptions that get clicks</h2><ul><li>Aim for <strong>120–160 characters</strong>. Google cuts off longer ones at around 920 pixels on desktop.</li>
<li>Include your main keyword. Google highlights it in bold when it matches the search.</li><li>Say what makes you different, and end with a clear action.</li><li>Write a unique description for every page.</li></ul>
<p>Google sometimes rewrites descriptions using text from your page, so make sure your page content is clear too.</p>""",
    [("Do meta descriptions help my ranking?", "Not directly. A good description gets more people to click your result, and that brings more visitors."),
     ("Where do I paste the code?", "In the <head> section of your page. In WordPress, Wix or Squarespace, use the page's SEO settings instead.")],
    ("devtools.js",))

tool_page("website-screenshot", "Website Screenshot Tool – Capture Any Site Free | etoolbox", "Website screenshot tool",
    "Take a screenshot of any website as it looks on a desktop, laptop, tablet or phone. You can capture the visible screen or the full page.",
    """
  <div class="gen">
    <form class="panel" data-shot novalidate>
      <label for="url">Website address</label><input type="text" id="url" name="url" inputmode="url" placeholder="e.g. bbc.co.uk">
      <label for="device">Device</label><select id="device" name="device"><option value="desktop">Desktop (1366×768)</option><option value="laptop">Laptop (1280×800)</option><option value="tablet">Tablet (768×1024)</option><option value="mobile">Mobile (390×844)</option></select>
      <label class="check" style="margin-top:12px"><input type="checkbox" name="full"> Full page (scroll capture)</label>
      <div class="run-row"><button type="submit" class="btn" id="shot-run">Take screenshot</button><a class="btn secondary" id="shot-dl" hidden>Download JPG</a></div>
      <p id="shot-msg" class="warn" role="status"></p>
    </form>
    <div class="panel"><div id="shot-out"><p class="muted">Your screenshot will appear here.</p></div></div>
  </div>""",
    """<h2>Uses</h2><ul><li>Check how your website looks on phones and tablets</li><li>Save evidence of a web page or advert as it appeared</li><li>Add website images to presentations, portfolios and reports</li></ul>
<p>Screenshots are taken in a real browser by our server (Cloudflare). Only public websites can be captured, so pages behind a login won't work.</p>""",
    [("Why did the screenshot fail?", "Some websites block automated visitors or take too long to load. Try again, or try the site's home page."),
     ("Is there a limit?", "The free service has a daily capacity. If it's busy, please try again a little later.")],
    ("screenshot.js",))

# ---------------- Media & audio ----------------

tool_page("youtube-thumbnail-downloader", "YouTube Thumbnail Downloader – HD, Free | etoolbox", "YouTube thumbnail downloader",
    "Paste a YouTube link to get the video's thumbnail in every size, up to full HD 1280×720. It works with videos, Shorts and live streams.",
    """
  <form class="panel" data-yt novalidate>
    <label for="url">YouTube video link</label><input type="text" id="url" name="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…">
    <p id="yt-msg" class="warn" role="status"></p>
  </form>
  <div class="yt-grid" id="yt-out"></div>""",
    """<h2>Please respect copyright</h2><p>Thumbnails belong to the video's creator. Use them for things like reviews, reference or your own videos. Don't reuse someone else's artwork as your own without permission.</p>
<h2>Sizes</h2><ul><li><strong>Full HD:</strong> 1280×720 (not available on every video)</li><li><strong>Standard:</strong> 640×480</li><li><strong>High:</strong> 480×360</li><li><strong>Medium:</strong> 320×180</li></ul>""",
    [("Why is there no Full HD version?", "Older or low-resolution videos don't have one. Use the largest size shown."),
     ("Does it work for Shorts?", "Yes. Paste the youtube.com/shorts/… link.")],
    ("media.js",))

tool_page("text-to-speech", "Text to Speech – Free Online, Natural Voices | etoolbox", "Text to speech",
    "Paste any text and listen to it read aloud. Choose British and other voices and adjust the speed and pitch. It's free and works in your browser.",
    """
  <div class="gen">
    <form class="panel" data-tts novalidate>
      <label for="text">Text</label><textarea id="text" name="text" class="big-text" placeholder="Type or paste text to hear it read aloud…"></textarea>
      <label for="voice">Voice</label><select id="voice" name="voice"></select>
      <div class="row"><div><label for="rate">Speed: <span id="rate-val"></span></label><input type="range" id="rate" name="rate" min="0.5" max="2" step="0.1" value="1"></div>
      <div><label for="pitch">Pitch: <span id="pitch-val"></span></label><input type="range" id="pitch" name="pitch" min="0.5" max="1.5" step="0.1" value="1"></div></div>
      <div class="run-row"><button type="button" class="btn" id="tts-play">▶ Play</button><button type="button" class="btn secondary" id="tts-pause">❚❚ Pause</button><button type="button" class="btn secondary" id="tts-stop">■ Stop</button></div>
      <p id="tts-msg" class="muted" role="status"></p>
    </form>
    <div class="panel prose"><h3 style="margin-top:0">Uses</h3><ul><li>Proofread your writing by ear and catch mistakes</li><li>Listen to articles and emails while you work</li><li>Help with reading, dyslexia and learning languages</li></ul>
      <p class="muted">Voices come from your device and browser. Edge and Chrome offer the most natural-sounding voices.</p></div>
  </div>""",
    "",
    [("Can I download the audio as an MP3?", "Browsers don't allow saving built-in voices as audio files. To record it, use your computer's sound recorder while it plays."),
     ("Is my text sent anywhere?", "Most voices run on your device. Some 'online' voices (marked in the voice name) are provided by your browser's maker.")],
    ("media.js",))

tool_page("speech-to-text", "Speech to Text – Free Online Dictation | etoolbox", "Speech to text (dictation)",
    "Speak and watch your words appear as text. It's great for notes, emails and documents. Copy the transcript or download it as a text file.",
    """
  <div class="gen">
    <form class="panel" data-stt novalidate>
      <div class="row"><div><label for="lang">Language</label><select id="lang" name="lang"><option value="en-GB">English (UK)</option><option value="en-US">English (US)</option><option value="cy-GB">Welsh</option><option value="ur-PK">Urdu</option><option value="hi-IN">Hindi</option><option value="pa-IN">Punjabi</option><option value="ar-SA">Arabic</option><option value="pl-PL">Polish</option><option value="ro-RO">Romanian</option><option value="es-ES">Spanish</option><option value="fr-FR">French</option><option value="de-DE">German</option></select></div>
      <div><label class="check" style="margin-top:38px"><input type="checkbox" name="punct"> Add full stops at pauses</label></div></div>
      <div class="run-row"><button type="button" class="btn" id="stt-start">🎤 Start dictating</button></div>
      <p id="stt-msg" class="muted" role="status"></p>
      <label for="transcript">Transcript</label><textarea id="transcript" name="transcript" class="big-text" placeholder="Your words will appear here… you can edit them too."></textarea>
      <div class="btn-row"><button type="button" class="btn small" id="stt-copy">Copy</button><button type="button" class="btn secondary small" id="stt-dl">Download .txt</button><button type="button" class="btn secondary small" id="stt-clear">Clear</button></div>
    </form>
    <div class="panel prose"><h3 style="margin-top:0">Tips</h3><ul><li>Speak clearly at a normal pace in a quiet room.</li><li>Say punctuation out loud in some browsers, e.g. "comma" or "full stop".</li><li>Works best in Chrome, Edge and Safari.</li></ul>
      <p class="muted"><strong>Privacy:</strong> speech recognition is provided by your browser. In Chrome and Edge, audio is sent to Google or Microsoft to turn it into text. We never receive or store it.</p></div>
  </div>""",
    "",
    [("Does it work on iPhone?", "Yes, in Safari. You can also use the microphone key on your phone's keyboard in any app."),
     ("Is there a time limit?", "No. Keep talking and it keeps listening. Click Stop when you're done.")],
    ("media.js",))

# ---------------- Money & everyday ----------------

tool_page("currency-converter", "Currency Converter – GBP to EUR, USD & More (ECB Rates) | etoolbox", "Currency converter",
    "Convert pounds, euros, dollars and 30 currencies using the European Central Bank's daily reference rates. It's ideal for invoices, travel and pricing.",
    """
  <div class="gen">
    <form class="panel" data-fx novalidate>
      <label for="amount">Amount</label><input type="text" id="amount" name="amount" inputmode="decimal" value="100">
      <div class="row"><div><label for="from">From</label><select id="from" name="from"></select></div><div><label for="to">To</label><select id="to" name="to"></select></div></div>
      <button type="button" class="btn secondary small" id="fx-swap" style="margin-top:10px">⇅ Swap</button>
      <p class="hint" id="fx-info" style="margin-top:12px"></p>
    </form>
    <div class="panel preview"><div id="fx-out" class="calc-out" aria-live="polite"></div><div id="fx-table" class="calc-out" style="margin-top:10px"></div></div>
  </div>""",
    """<h2>About these rates</h2><p>These are the European Central Bank's official reference (mid-market) rates, published every working day. Banks, card providers and travel money shops add a margin, so the rate you're offered will be a little worse. For VAT on foreign-currency invoices, HMRC publishes its own monthly exchange rates.</p>""",
    [("Are the rates live?", "They're updated once every working day (around 4pm CET), which is right for invoices, quotes and planning, but not for trading."),
     ("Where do the rates come from?", "The European Central Bank, via the free, open-source Frankfurter service.")],
    ("currency.js",))

tool_page("bmi-calculator", "BMI Calculator UK – Metric & Imperial (NHS Categories) | etoolbox", "BMI calculator",
    "Work out your body mass index (BMI) using feet and inches or centimetres, and kilograms, stone or pounds. Mix and match units however you like. You get the NHS weight category and the healthy range for your height.",
    calc_ui("bmi", f"""
<div class="unit-head"><label>Height</label>{seg("hunit", [("ftin", "ft & in"), ("cm", "cm")], "ftin")}</div>
<div data-show-when="hunit=ftin"><div class="row"><div><label for="ft" class="sub">Feet</label><input type="text" id="ft" name="ft" inputmode="decimal" placeholder="5"></div><div><label for="inch" class="sub">Inches</label><input type="text" id="inch" name="inch" inputmode="decimal" placeholder="10"></div></div></div>
<div data-show-when="hunit=cm"><label for="cm" class="sub">Centimetres</label><input type="text" id="cm" name="cm" inputmode="decimal" placeholder="178"></div>
<div class="unit-head"><label>Weight</label>{seg("wunit", [("kg", "kg"), ("stlb", "st & lb"), ("lb", "lb")], "kg")}</div>
<div data-show-when="wunit=kg"><label for="kg" class="sub">Kilograms</label><input type="text" id="kg" name="kg" inputmode="decimal" placeholder="75"></div>
<div data-show-when="wunit=stlb"><div class="row"><div><label for="st" class="sub">Stone</label><input type="text" id="st" name="st" inputmode="decimal" placeholder="11"></div><div><label for="lb" class="sub">Pounds</label><input type="text" id="lb" name="lb" inputmode="decimal" placeholder="11"></div></div></div>
<div data-show-when="wunit=lb"><label for="lbonly" class="sub">Pounds</label><input type="text" id="lbonly" name="lbonly" inputmode="decimal" placeholder="165"></div>
<p class="hint" style="margin-top:8px">Mix and match: switch height or weight units at any time, and your numbers are converted for you.</p>
<label for="ethnic">Family background</label>
<select id="ethnic" name="ethnic"><option value="no">White or other</option><option value="yes">South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean</option></select>"""),
    """<h2>About BMI</h2><p>BMI is your weight in kilograms divided by your height in metres squared. It's a quick screening measure for adults (18+), but it doesn't tell the whole story. It doesn't account for muscle, age or where weight is carried, and it isn't suitable during pregnancy.</p>
<p>UK guidance uses lower thresholds for people from South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds. For them, 23–27.4 is classed as overweight and 27.5 or over as obese, because health risks start at a lower BMI.</p>
<p>If you're worried about your weight or health, talk to your GP or practice nurse. The NHS advises not using BMI calculators if you have, or think you may have, an eating disorder. Support is available from Beat (beateatingdisorders.org.uk).</p>""",
    [("What's a healthy BMI?", "For most adults, 18.5 to 24.9. For people from the backgrounds listed above, it's 18.5 to 22.9."),
     ("Can children use this?", "No. Children's BMI is worked out differently, using age- and sex-specific charts. Use the NHS BMI calculator for children.")],
    ("calc.js",))
