# ---------------- Batch 4: advanced everyday tools ----------------

def drop(input_id, title, sub, accept, multiple=False, extra=""):
    return f'''<label class="drop" id="drop" for="{input_id}"><strong>{title}</strong><span class="muted">{sub}</span>
      <input type="file" id="{input_id}" accept="{accept}"{' multiple' if multiple else ''}{extra} class="sr-only"></label>'''

# ---- Files ----
tool_page("batch-file-renamer", "Batch File Renamer – Rename Multiple Files Online Free | etoolbox", "Batch file renamer",
    "Rename hundreds of files at once with find and replace, numbering, dates and tidy formatting. Download renamed copies as a zip, or a one-click script that renames the originals.",
    f"""
  <div class="gen">
    <form class="panel" data-renamer novalidate>
      {drop("rn-input", "Choose files or drop them here", "Any file type · up to 2,000 files · nothing is uploaded", "*", True)}
      <div class="row"><div><label for="find">Find</label><input type="text" id="find" name="find" placeholder="e.g. IMG_"></div><div><label for="replace">Replace with</label><input type="text" id="replace" name="replace" placeholder="e.g. Holiday-"></div></div>
      <div class="btn-row" style="margin-top:6px"><label class="check" style="margin:0"><input type="checkbox" name="regex"> Regular expression</label><label class="check" style="margin:0"><input type="checkbox" name="matchcase"> Match case</label></div>
      <label for="template">New name pattern <span class="hint">({{name}} = current name, {{n}} = number, {{date}} = file date)</span></label>
      <input type="text" id="template" name="template" placeholder="e.g. {{name}}-{{n}}  or  Invoice {{date}} {{n}}">
      <div class="row"><div><label for="start">Start number</label><input type="number" id="start" name="start" value="1"></div><div><label for="pad">Digits</label><select id="pad" name="pad"><option value="1">1, 2, 3</option><option value="2">01, 02</option><option value="3" selected>001, 002</option><option value="4">0001</option></select></div></div>
      <div class="row"><div><label for="casing">Letter case</label><select id="casing" name="casing"><option value="">Keep</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option><option value="title">Title Case</option></select></div>
      <div><label for="spaces">Spaces</label><select id="spaces" name="spaces"><option value="">Keep</option><option value="dash">Replace with -</option><option value="underscore">Replace with _</option><option value="remove">Remove</option></select></div></div>
      <div class="row"><div><label for="ext">New extension <span class="hint">(optional)</span></label><input type="text" id="ext" name="ext" placeholder="e.g. jpg"></div><div><label for="extcase">Extension case</label><select id="extcase" name="extcase"><option value="">Keep</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option></select></div></div>
      <div class="row"><div><label for="sort">Number files in order of</label><select id="sort" name="sort"><option value="name">Name</option><option value="date">Date modified</option><option value="size">Size</option><option value="pick">As chosen</option></select></div>
      <div><label for="os">Script for</label><select id="os" name="os"><option value="win">Windows (.bat)</option><option value="unix">Mac / Linux (.sh)</option></select></div></div>
      <p id="rn-msg" class="warn" role="status"></p>
    </form>
    <div class="panel"><h3 style="margin:0">Preview <span class="hint" id="rn-count"></span></h3><div id="rn-list"></div>
      <div class="btn-row"><button type="button" class="btn" id="rn-zip">Download renamed copies (.zip)</button><button type="button" class="btn secondary" id="rn-script">Download rename script</button></div>
      <p class="hint">Web pages can't rename files on your computer directly. Download renamed copies, or download the script, put it in the same folder and run it to rename the originals.</p></div>
  </div>""",
    """<h2>Examples</h2><ul><li><strong>Photos:</strong> pattern <code>Wedding-{n}</code> turns <code>IMG_4821.JPG</code> into <code>Wedding-001.JPG</code>.</li><li><strong>Invoices:</strong> <code>Invoice {date} {n}</code> uses each file's date.</li><li><strong>Tidy names:</strong> choose lowercase and replace spaces with <code>-</code> for web-friendly names.</li></ul>""",
    [("Are my files uploaded?", "No. The renaming happens in your browser. Even the zip is made on your device."),
     ("Is the script safe?", "It only contains rename commands for the files you chose, and you can open it in a text editor to check. On Mac/Linux it won't overwrite existing files.")],
    ("vendor/fflate.min.js", "files.js"))

tool_page("duplicate-file-finder", "Duplicate File Finder Online – Find Identical Files Free | etoolbox", "Duplicate file finder",
    "Choose a folder to find identical files, even if they have different names. See how much space you'd free. Files are compared on your device using SHA-256 fingerprints.",
    """
  <div class="panel" data-dupes>
    <div class="btn-row" style="margin-top:0"><label class="btn" for="dup-folder" style="margin:0">📁 Choose a folder<input type="file" id="dup-folder" webkitdirectory directory multiple class="sr-only"></label>
      <label class="btn secondary" for="dup-files" style="margin:0">Choose files<input type="file" id="dup-files" multiple class="sr-only"></label>
      <button type="button" class="btn secondary" id="dup-csv" hidden>Download list (.csv)</button></div>
    <p id="dup-status" class="muted" role="status" style="margin-top:12px">Choose a folder (including its sub-folders) to scan. Nothing is uploaded.</p>
    <div id="dup-out"></div>
  </div>""",
    """<h2>How it works</h2><ol><li>Files are grouped by size. Files with different sizes can't be identical, so this is fast.</li><li>Files with the same size get a SHA-256 fingerprint, which only matches if the contents are byte-for-byte identical.</li><li>Each group lists one file to keep and the duplicates you can safely delete.</li></ol>
<p>For safety, this tool never deletes anything. Use the list (or the CSV) to delete duplicates yourself.</p>""",
    [("Does it find similar photos?", "It finds exact duplicates only, i.e. the same file saved twice, even with different names. Edited or resized copies count as different."),
     ("How big a folder can I scan?", "Tens of thousands of files work fine. Very large files (over 512 MB) are compared by sampling, and these are labelled.")],
    ("files.js",))

tool_page("file-checksum", "File Checksum Checker – MD5, SHA-256 Hash Online | etoolbox", "File checksum checker",
    "Calculate a file's MD5, SHA-1, SHA-256 and SHA-512 checksums and compare them with the one published by the download site, to check the file is genuine and complete.",
    f"""
  <div class="gen">
    <form class="panel" data-checksum novalidate>
      {drop("ck-input", "Choose a file or drop it here", "Any file up to 2 GB · nothing is uploaded", "*")}
      <label for="expected">Expected checksum <span class="hint">(optional; paste it to compare)</span></label><input type="text" id="expected" name="expected" placeholder="e.g. 3a7bd3e2360a3d…">
      <span id="ck-match" role="status"></span>
    </form>
    <div class="panel"><div id="ck-out" class="calc-out"><p class="muted">Your file's checksums will appear here.</p></div></div>
  </div>""",
    "<p>Software publishers often list a SHA-256 checksum next to downloads. If yours matches exactly, the file is genuine and wasn't corrupted during download.</p>",
    [("Which checksum should I use?", "SHA-256 is the modern standard. MD5 and SHA-1 are fine for spotting accidental corruption, but not for security.")],
    ("files.js",))

# ---- Documents ----
tool_page("compare-documents", "Compare Documents – PDF, Word & Text Diff Checker | etoolbox", "Compare documents",
    "Compare two versions of a contract, essay or report and see every word added or removed. It works with PDF, Word (.docx) and plain text, all on your device.",
    """
  <form class="panel" data-compare novalidate>
    <div class="cmp-grid">
      <div><label class="btn secondary small" for="file-a" style="margin:0">📄 Original: choose a file<input type="file" id="file-a" accept=".pdf,.docx,.txt,.md,.csv,.html" class="sr-only"></label> <span class="hint" id="name-a"></span>
        <label for="text-a" class="sr-only">Original text</label><textarea id="text-a" class="big-text" placeholder="…or paste the original text" style="margin-top:8px;min-height:160px"></textarea></div>
      <div><label class="btn secondary small" for="file-b" style="margin:0">📄 New version: choose a file<input type="file" id="file-b" accept=".pdf,.docx,.txt,.md,.csv,.html" class="sr-only"></label> <span class="hint" id="name-b"></span>
        <label for="text-b" class="sr-only">New text</label><textarea id="text-b" class="big-text" placeholder="…or paste the new text" style="margin-top:8px;min-height:160px"></textarea></div>
    </div>
    <div class="btn-row"><label class="check" style="margin:0"><input type="checkbox" name="icase"> Ignore capitals</label><label class="check" style="margin:0"><input type="checkbox" name="ispace" checked> Ignore spacing</label><label class="check" style="margin:0"><input type="checkbox" name="ipunct"> Ignore punctuation</label><label class="check" style="margin:0"><input type="checkbox" name="onlychanges"> Show changed paragraphs only</label></div>
  </form>
  <div class="panel" style="margin-top:16px"><p id="cmp-stats" role="status" style="margin-top:0"></p><div class="diff-out" id="cmp-out"></div></div>""",
    """<h2>Good for</h2><ul><li>Checking what a client or landlord changed in a contract</li><li>Comparing essay drafts or policy versions</li><li>Proofreading edits before you sign</li></ul><p><ins>Green</ins> text was added in the new version and <del>red</del> text was removed.</p>""",
    [("Are my documents uploaded?", "No. Text is extracted and compared in your browser, which is ideal for confidential contracts."),
     ("Can it compare scanned PDFs?", "Scans are images. Run them through Image to text (OCR) first, then paste the text here.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "vendor/mammoth.browser.min.js", "docs.js"))

tool_page("image-to-text", "Image to Text (OCR) – Extract Text from Screenshots Free | etoolbox", "Image to text (OCR)",
    "Copy the text out of screenshots, photos of documents, receipts and scans. Paste a screenshot with Ctrl+V or choose an image. Text recognition runs on your device.",
    f"""
  <div class="gen">
    <form class="panel" data-ocr novalidate>
      {drop("ocr-input", "Choose an image, drop it here or press Ctrl+V", "PNG, JPG or WebP screenshots and photos · English text", "image/*")}
      <p id="ocr-status" class="muted" role="status" style="margin-top:10px">The text reader (about 11 MB) downloads once, the first time you use it.</p>
      <img id="ocr-preview" class="ocr-preview" alt="Your image" hidden>
    </form>
    <div class="panel"><label for="ocr-text" style="margin-top:0">Extracted text <span class="hint">(you can edit it)</span></label><textarea id="ocr-text" class="big-text"></textarea>
      <div class="btn-row"><button type="button" class="btn small" id="ocr-copy">Copy text</button><button type="button" class="btn secondary small" id="ocr-dl">Download .txt</button></div></div>
  </div>""",
    """<h2>Tips for accurate results</h2><ul><li>Screenshots work best, because the text is perfectly sharp.</li><li>For photos, fill the frame with the page, keep it flat and use good light.</li><li>Crop away anything that isn't text.</li></ul>""",
    [("Is my image uploaded?", "No. The text recognition engine (Tesseract) runs entirely in your browser."),
     ("Does it work with handwriting?", "Only neat, printed-style handwriting. It's designed for typed text.")],
    ("vendor/ocr/tesseract.min.js", "docs.js"))

tool_page("invoice-data-extractor", "Invoice Data Extractor – PDF Invoices to Excel/CSV | etoolbox", "Invoice data extractor",
    "Drop in PDF invoices and get the supplier, invoice number, dates, net, VAT and total in a table. Correct anything that's wrong, then download a CSV for Excel or your accounts software.",
    f"""
  <form class="panel" data-invoice-extract novalidate>
    {drop("inv-input", "Choose PDF invoices or drop them here", "Several at once · read on your device, never uploaded", "application/pdf,.pdf", True)}
    <p id="inv-status" class="muted" role="status" style="margin-top:10px"></p>
    <div id="inv-table"></div>
    <div class="btn-row"><button type="button" class="btn" id="inv-csv" hidden>Download CSV</button><button type="button" class="btn secondary" id="inv-clear">Clear</button></div>
  </form>""",
    """<h2>What it finds</h2><p>Supplier, invoice number, invoice date, due date, net amount, VAT, total, currency, the supplier's VAT number and bank details (sort code, account number and IBAN). Every invoice is laid out differently, so check the values and click any cell to fix it before exporting.</p>
<p>Scanned (photo) invoices contain no text. Use <a href="/image-to-text/">Image to text</a> first.</p>""",
    [("Does it work with Xero, QuickBooks or FreeAgent?", "Download the CSV and use your software's bank or bill import, or keep it as a record for your accountant."),
     ("Is it safe for confidential invoices?", "Yes. Invoices are read in your browser and never sent anywhere.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "docs.js"))

tool_page("email-header-analyzer", "Email Header Analyser – Trace Emails & Check SPF/DKIM | etoolbox", "Email header analyser",
    "Paste an email's headers to see the route it took, any delivery delays, and whether it passed SPF, DKIM and DMARC. It also flags signs of spoofing or phishing.",
    """
  <div class="gen">
    <form class="panel" data-email-headers novalidate>
      <label for="raw" style="margin-top:0">Email headers</label><textarea id="raw" name="raw" class="code" style="min-height:300px" placeholder="Received: from mail.example.com …&#10;From: …&#10;Subject: …"></textarea>
      <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">How do I find the headers?</summary><ul class="hint"><li><strong>Gmail:</strong> open the email → ⋮ → Show original → Copy to clipboard.</li><li><strong>Outlook:</strong> open the email → … → View → View message details.</li><li><strong>Apple Mail:</strong> View → Message → All Headers.</li></ul></details>
    </form>
    <div class="panel"><div id="eh-out"></div></div>
  </div>""",
    """<h2>What the results mean</h2><ul><li><strong>SPF:</strong> was the sending server allowed to send for that domain?</li><li><strong>DKIM:</strong> was the message signed by the domain and left unchanged?</li><li><strong>DMARC:</strong> did it pass the domain owner's anti-spoofing policy?</li></ul><p>A failure on a message claiming to be from your bank or HMRC is a strong sign of phishing. Don't click links in it.</p>""",
    [("Is it safe to paste headers?", "Headers are analysed in your browser and not sent anywhere. They contain addresses and server names, not the message body.")],
    ("docs.js",))

# ---- Web & developer ----
tool_page("dns-checker", "DNS Propagation Checker – Check A, MX, TXT Records | etoolbox", "DNS propagation checker",
    "Check whether your DNS change has spread. See what eight major public DNS providers (Cloudflare, Google, Quad9 and more) currently return for any domain and record type.",
    """
  <div class="panel"><form data-dns novalidate>
    <div class="row"><div><label for="domain" style="margin-top:0">Domain</label><input type="text" id="domain" name="domain" placeholder="e.g. etoolbox.co.uk" inputmode="url"></div>
    <div><label for="rtype" style="margin-top:0">Record type</label><select id="rtype" name="rtype"><option>A</option><option>AAAA</option><option>CNAME</option><option>MX</option><option>TXT</option><option>NS</option><option>CAA</option><option>SOA</option></select></div></div>
    <div class="run-row"><button type="submit" class="btn">Check DNS</button></div></form>
    <p id="dns-sum" role="status" style="margin-top:12px"></p><div id="dns-out"></div></div>""",
    """<h2>Why do DNS changes take time?</h2><p>Each DNS provider caches your records for the record's TTL (time to live). After you change a record, providers keep showing the old value until their cached copy expires, usually minutes and occasionally up to 48 hours. Lower the TTL a day before planned changes to make them spread faster.</p>""",
    [("What does ⚠️ mean?", "That provider is returning a different answer from most others, usually because it still has the old record cached."),
     ("Which record do I need?", "A/AAAA point your domain at a website, MX handles email, TXT holds verification and SPF/DMARC, and CNAME is an alias for another name.")],
    ("web.js",))

tool_page("email-dns-checker", "SPF, DKIM & DMARC Checker – Email Security Test | etoolbox", "SPF, DKIM &amp; DMARC checker",
    "Check that your business email is set up to reach inboxes and resist spoofing. We look up your MX, SPF, DKIM and DMARC records and explain what to fix.",
    """
  <div class="panel"><form data-emaildns novalidate>
    <div class="row"><div><label for="domain" style="margin-top:0">Your email domain</label><input type="text" id="domain" name="domain" placeholder="e.g. yourbusiness.co.uk" inputmode="url"></div>
    <div><label for="selector" style="margin-top:0">DKIM selector <span class="hint">(optional)</span></label><input type="text" id="selector" name="selector" placeholder="We try common ones"></div></div>
    <div class="run-row"><button type="submit" class="btn">Check my email security</button></div></form>
    <div id="edns-out" style="margin-top:12px"></div></div>""",
    """<h2>Why it matters</h2><p>Since 2024, Gmail and Yahoo require senders to have SPF, DKIM and DMARC set up properly. Without them, your invoices and quotes are more likely to land in spam, and criminals can more easily send emails pretending to be you.</p>
<ul><li><strong>SPF</strong> lists the services allowed to send your email (Microsoft 365, Google Workspace, Mailchimp…).</li><li><strong>DKIM</strong> digitally signs your emails.</li><li><strong>DMARC</strong> tells receivers what to do with emails that fail. Start with <code>p=none</code>, then move to <code>quarantine</code>.</li></ul>""",
    [("I use Microsoft 365 or Google Workspace. Where do I add these?", "In your domain's DNS settings (wherever you bought the domain, or Cloudflare). Both providers' admin centres show the exact records to add.")],
    ("web.js",))

tool_page("website-speed-test", "Website Speed Test – Core Web Vitals & PageSpeed Score | etoolbox", "Website speed test",
    "Test any page's speed on mobile or desktop. You get Google's Core Web Vitals from real visitors (LCP, INP, CLS), PageSpeed scores and the top fixes.",
    """
  <div class="panel"><form data-speed novalidate>
    <div class="row"><div><label for="url" style="margin-top:0">Page address</label><input type="text" id="url" name="url" placeholder="e.g. yourbusiness.co.uk" inputmode="url"></div>
    <div><label for="strategy" style="margin-top:0">Device</label><select id="strategy" name="strategy"><option value="mobile">Mobile</option><option value="desktop">Desktop</option></select></div></div>
    <div class="run-row"><button type="submit" class="btn">Run speed test</button></div></form>
    <div id="ps-out" style="margin-top:12px"></div></div>""",
    """<h2>Core Web Vitals targets</h2><ul><li><strong>LCP</strong> (loading): under 2.5 seconds</li><li><strong>INP</strong> (responsiveness): under 200 ms</li><li><strong>CLS</strong> (visual stability): under 0.1</li></ul><p>Google uses these as a ranking signal. The quickest wins are usually compressing images (try our <a href="/image-compressor/">image compressor</a>), removing unused plugins and using good hosting.</p>""",
    [("Where do the results come from?", "Google PageSpeed Insights. Real-visitor data comes from the Chrome UX Report, and lab scores come from a Lighthouse test Google runs for you."),
     ("Why do scores change between runs?", "Lab tests vary a little with network and server conditions. Look at trends rather than single numbers.")],
    ("web.js",))

tool_page("api-request-builder", "API Request Builder – Online HTTP Client & cURL Generator | etoolbox", "API request builder",
    "Send GET, POST, PUT, PATCH and DELETE requests with headers and a body, inspect the response, and copy ready-made cURL, JavaScript and Python code.",
    """
  <div class="gen">
    <form class="panel" data-api novalidate>
      <div class="row" style="grid-template-columns:120px 1fr"><div><label for="method" style="margin-top:0">Method</label><select id="method" name="method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option></select></div>
      <div><label for="url" style="margin-top:0">URL</label><input type="text" id="url" name="url" value="https://api.frankfurter.dev/v1/latest?base=GBP" inputmode="url"></div></div>
      <label for="headers">Headers <span class="hint">(one per line, e.g. Authorization: Bearer …)</span></label><textarea id="headers" name="headers" class="code" style="min-height:80px" placeholder="Content-Type: application/json"></textarea>
      <label for="body">Body</label><textarea id="body" name="body" class="code" style="min-height:110px" placeholder='{"name": "test"}'></textarea>
      <div class="run-row"><button type="submit" class="btn">Send request</button></div>
      <label for="lang">Code</label><select id="lang" name="lang" style="width:auto"><option value="curl">cURL</option><option value="js">JavaScript (fetch)</option><option value="python">Python (requests)</option></select>
      <pre class="code-out" id="api-code"></pre>
    </form>
    <div class="panel"><h3 style="margin-top:0">Response</h3><div id="api-out"><p class="muted">Send a request to see the response.</p></div></div>
  </div>""",
    """<p>Requests go directly from your browser to the API, never through us. So your API keys stay private, but APIs that don't allow browser access (CORS) will be blocked. For those, copy the cURL command.</p>""",
    [("Why was my request blocked?", "Many APIs only accept requests from servers, not web pages (a browser security rule called CORS). The generated cURL command works from any terminal.")],
    ("web.js",))

tool_page("jwt-decoder", "JWT Decoder – Decode JSON Web Tokens Online | etoolbox", "JWT decoder",
    "Paste a JSON Web Token to see its header and payload, readable dates and whether it has expired. Decoding happens in your browser.",
    """
  <div class="gen">
    <form class="panel" data-jwt novalidate><label for="token" style="margin-top:0">Token</label><textarea id="token" name="token" class="code" style="min-height:220px" placeholder="eyJhbGciOi…"></textarea></form>
    <div class="panel"><div id="jwt-out"></div></div>
  </div>""",
    "<p>JWTs are commonly used for logins and API access. Their contents are only encoded, not encrypted, so anyone can read them. Never put secrets in a JWT payload.</p>",
    [("Is it safe to paste my token?", "Decoding happens in your browser and nothing is sent anywhere. Still, treat live tokens like passwords.")],
    ("web.js",))

# ---- Images ----
tool_page("photo-metadata-remover", "Remove EXIF & GPS Location from Photos – Metadata Viewer | etoolbox", "Photo metadata &amp; GPS remover",
    "See the hidden information in your photos (GPS location, camera, date and time) and remove it before you share or sell online. JPEGs are cleaned without losing any quality.",
    f"""
  <form class="panel" data-exif novalidate>
    {drop("meta-input", "Choose photos or drop them here", "JPG, PNG, WebP or HEIC · up to 50 · nothing is uploaded", "image/*,.heic,.heif", True)}
    <div id="meta-list"></div>
    <button type="button" class="btn" id="meta-all" hidden style="margin-top:12px">Download all clean photos (.zip)</button>
  </form>""",
    """<h2>Why remove photo metadata?</h2><p>Phones save the exact GPS location in most photos. If you post a photo of an item for sale, or of your home or children, people may be able to see where it was taken. Cleaning also removes the camera's serial number and the date and time.</p>
<p>Many social networks remove location data when you upload, but email, WhatsApp documents, marketplaces and websites often keep it.</p>""",
    [("Does it reduce quality?", "No. For JPEG and PNG, only the metadata is removed and the image itself is kept byte-for-byte. Photos that need rotating are re-saved at very high quality."),
     ("Are my photos uploaded?", "No. Everything happens on your device.")],
    ("vendor/exifr.min.js", "vendor/fflate.min.js", "exif.js"))

# ---- Planners ----
tool_page("budget-planner", "Monthly Budget Planner UK – 50/30/20 Calculator | etoolbox", "Monthly budget planner",
    "Plan your monthly income and spending, see what's left over and compare against the 50/30/20 rule. Your budget saves automatically in this browser, with no sign-up.",
    """
  <div class="gen" data-budget>
    <div class="panel"><h3 style="margin-top:0">Money in</h3><div id="bp-income"></div><h3>Money out</h3><div id="bp-exp"></div>
      <div class="btn-row"><button type="button" class="btn secondary small" id="bp-csv">Download CSV</button><button type="button" class="btn secondary small" id="bp-reset">Start again</button></div></div>
    <div class="panel preview" style="text-align:left"><div id="bp-sum"></div></div>
  </div>""",
    """<h2>Budgeting tips</h2><ul><li>Use your <strong>take-home</strong> pay (after tax). Our <a href="/take-home-pay-calculator/">take-home pay calculator</a> can help.</li><li>Check your bank statements for the real amounts. Small costs add up.</li><li>Pay yourself first: move savings on payday.</li></ul>""",
    [("Where is my budget saved?", "Only in this browser on this device. Use 'Download CSV' to keep a copy.")],
    ("planners.js",))

tool_page("subscription-tracker", "Subscription Tracker – See What Your Subscriptions Cost | etoolbox", "Subscription tracker",
    "List your subscriptions and see the true monthly and yearly cost, what's renewing soon, and add renewal reminders to your phone's calendar so you can cancel in time.",
    """
  <div class="gen" data-subs>
    <div class="panel"><div id="st-rows"></div>
      <div class="btn-row"><button type="button" class="btn small" id="st-ics">📅 Add reminders to calendar</button><button type="button" class="btn secondary small" id="st-csv">Download CSV</button></div>
      <p class="hint">The calendar file works with Google Calendar, Outlook and iPhone, with a reminder 2 days before each renewal.</p></div>
    <div class="panel preview" style="text-align:left"><div id="st-sum"></div></div>
  </div>""",
    "<p>Free trials that turn into paid plans, and price rises on streaming and software, are easy to miss. Review your list every few months and cancel anything you no longer use.</p>",
    [("Is my list private?", "Yes. It's saved only in this browser on this device. Nothing is sent to us.")],
    ("planners.js",))

tool_page("travel-budget-planner", "Travel Budget Planner – Holiday Cost Calculator | etoolbox", "Travel budget planner",
    "Estimate the full cost of a trip: travel, accommodation, food, activities and insurance, per person and per day. It converts to the local currency at today's rates.",
    """
  <div class="gen">
    <form class="panel" data-travel novalidate>
      <div class="row"><div><label for="people" style="margin-top:0">Travellers</label><input type="number" id="people" name="people" value="2" min="1"></div><div><label for="nights" style="margin-top:0">Nights</label><input type="number" id="nights" name="nights" value="7" min="0"></div></div>
      <div class="row"><div><label for="flights">Flights / travel (£ per person)</label><input type="text" id="flights" name="flights" inputmode="decimal" value="250"></div><div><label for="hotel">Accommodation (£ per night)</label><input type="text" id="hotel" name="hotel" inputmode="decimal" value="120"></div></div>
      <div class="row"><div><label for="food">Food & drink (£ per person per day)</label><input type="text" id="food" name="food" inputmode="decimal" value="45"></div><div><label for="local">Local transport (£ per day)</label><input type="text" id="local" name="local" inputmode="decimal" value="20"></div></div>
      <div class="row"><div><label for="activities">Activities & trips (£ total)</label><input type="text" id="activities" name="activities" inputmode="decimal" value="200"></div><div><label for="insurance">Travel insurance (£ per person)</label><input type="text" id="insurance" name="insurance" inputmode="decimal" value="25"></div></div>
      <div class="row"><div><label for="other">Other (£ total)</label><input type="text" id="other" name="other" inputmode="decimal" value="0"></div><div><label for="buffer">Buffer for surprises</label><select id="buffer" name="buffer"><option value="0">None</option><option value="5">5%</option><option value="10" selected>10%</option><option value="15">15%</option></select></div></div>
      <label for="cur">Local currency</label><select id="cur" name="cur"><option value="GBP">— Pounds only —</option><option value="EUR" selected>Euro (EUR)</option><option value="USD">US dollar (USD)</option><option value="TRY">Turkish lira (TRY)</option><option value="AED">UAE dirham (AED)</option><option value="INR">Indian rupee (INR)</option><option value="JPY">Japanese yen (JPY)</option><option value="THB">Thai baht (THB)</option><option value="AUD">Australian dollar (AUD)</option><option value="CAD">Canadian dollar (CAD)</option><option value="PLN">Polish złoty (PLN)</option><option value="CHF">Swiss franc (CHF)</option></select>
    </form>
    <div class="panel preview" style="text-align:left"><div id="tb-out"></div></div>
  </div>""",
    "<p>Your figures are saved in this browser so you can come back and tweak them. Exchange rates are ECB reference rates. Compare your bank's travel card fees before you go.</p>",
    [("Does it include currency fees?", "No. Banks and bureaux add 1–5% on top of the reference rate, which the buffer can cover.")],
    ("planners.js",))

tool_page("trip-cost-splitter", "Trip Cost Splitter – Split Expenses & Settle Up | etoolbox", "Trip cost splitter",
    "Add who paid for what on a holiday, stag do or shared house, and get the fewest bank transfers needed to settle up. No app or sign-up needed.",
    """
  <div class="gen" data-split>
    <div class="panel"><h3 style="margin-top:0">People</h3><div id="sp-people"></div>
      <h3>Expenses</h3><div id="sp-exp"></div>
      <div class="btn-row"><button type="button" class="btn small" id="sp-adde">+ Add expense</button><button type="button" class="btn secondary small" id="sp-reset">Start again</button></div></div>
    <div class="panel preview" style="text-align:left"><div id="sp-out"></div></div>
  </div>""",
    "<p>Expenses are split equally between the people ticked for each one, so not everyone has to share every cost. The settle-up list uses the smallest number of payments.</p>",
    [("Is my data saved?", "Yes, in this browser only, so you can keep adding expenses during the trip.")],
    ("planners.js",))

tool_page("meeting-time-finder", "Meeting Time Finder – Time Zone Meeting Planner | etoolbox", "Meeting time finder",
    "Find a meeting time that suits everyone across time zones. See all the local times side by side, with working hours highlighted and the best slots listed.",
    """
  <form class="panel" data-meet novalidate>
    <div class="row4"><div><label for="addtz" style="margin-top:0">Add a time zone</label><select id="addtz" name="addtz"></select></div>
      <div><label for="date" style="margin-top:0">Date</label><input type="date" id="date" name="date"></div>
      <div><label for="ws" style="margin-top:0">Work starts</label><select id="ws" name="ws"><option>7</option><option>8</option><option selected>9</option><option>10</option></select></div>
      <div><label for="we" style="margin-top:0">Work ends</label><select id="we" name="we"><option>16</option><option selected>17</option><option>18</option><option>19</option></select></div></div>
    <div id="mt-grid"></div>
    <div class="legend"><span><i style="background:color-mix(in srgb,#22c55e 40%,transparent)"></i>Working hours</span><span><i style="background:color-mix(in srgb,#f59e0b 40%,transparent)"></i>Early / evening</span><span><i style="background:color-mix(in srgb,#64748b 40%,transparent)"></i>Night</span><span><i style="outline:2px solid var(--brand)"></i>Works for everyone</span></div>
    <div id="mt-best" class="panel" style="margin-top:14px;box-shadow:none"></div>
  </form>""",
    "<p>The first time zone is your base. Each column is one hour of your day. Daylight-saving changes are handled automatically for the date you pick.</p>",
    [("Does it handle British Summer Time?", "Yes. Times are worked out for the exact date, including BST and daylight saving elsewhere.")],
    ("planners.js",))

# ---- Everyday ----
tool_page("recipe-scaler", "Recipe Scaler – Adjust Servings & Convert Cups to Grams | etoolbox", "Recipe scaler",
    "Paste a recipe's ingredients, choose how many people you're cooking for and get the scaled quantities. You can also convert US cups, ounces and pounds to millilitres and grams.",
    """
  <div class="gen">
    <form class="panel" data-recipe novalidate>
      <div class="row"><div><label for="from" style="margin-top:0">Recipe serves</label><input type="number" id="from" name="from" value="4" min="1"></div><div><label for="to" style="margin-top:0">I'm cooking for</label><input type="number" id="to" name="to" value="6" min="1"></div></div>
      <label for="ingredients">Ingredients <span class="hint">(one per line)</span></label>
      <textarea id="ingredients" name="ingredients" class="big-text">2 cups plain flour
1 1/2 tsp baking powder
½ tsp salt
200g butter, softened
3 large eggs
8 oz cheddar, grated
1/3 cup milk
Salt and pepper to taste</textarea>
      <label class="check" style="margin-top:10px"><input type="checkbox" name="metric"> Convert cups, oz and lb to ml and grams</label>
    </form>
    <div class="panel"><h3 style="margin-top:0">Scaled ingredients</h3><div id="rc-out"></div><button type="button" class="btn small" id="rc-copy">Copy list</button></div>
  </div>""",
    "<p>Baking tip: cups measure volume, so 1 cup of flour (about 125 g) weighs much less than 1 cup of sugar (about 200 g). For precise baking, weigh dry ingredients.</p>",
    [("What about eggs?", "Scaled eggs can come out as fractions (e.g. 1½). Round to the nearest whole egg, or beat one egg and use part of it.")],
    ("planners.js",))

tool_page("webcam-mic-test", "Webcam & Microphone Test – Check Camera, Mic & Speakers | etoolbox", "Webcam, microphone &amp; speaker test",
    "Check your camera, microphone and speakers before a Teams, Zoom or job interview call. You'll see the camera's resolution and a live microphone level, and can play a left/right speaker test.",
    """
  <div class="gen" data-device>
    <div class="panel cam-box"><h3 style="margin-top:0">📷 Camera</h3><label for="cam-sel" class="sub">Camera</label><select id="cam-sel"></select>
      <div class="btn-row"><button type="button" class="btn small" id="cam-start">Start camera</button><button type="button" class="btn secondary small" id="cam-snap" hidden>Take a test photo</button></div>
      <p id="cam-info" class="hint" role="status"></p><video id="cam-video" autoplay playsinline muted hidden></video></div>
    <div class="panel"><h3 style="margin-top:0">🎙️ Microphone</h3><label for="mic-sel" class="sub">Microphone</label><select id="mic-sel"></select>
      <div class="btn-row"><button type="button" class="btn small" id="mic-start">Start microphone</button><button type="button" class="btn secondary small" id="mic-rec" hidden>⏺ Record 5 seconds</button></div>
      <div class="meter" id="mic-meter" role="meter" aria-label="Microphone level"></div><p id="mic-info" class="hint" role="status"></p><audio id="mic-play" controls hidden></audio>
      <h3>🔊 Speakers</h3><div class="btn-row" style="margin-top:0"><button type="button" class="btn secondary small" data-pan="-1">◀ Left</button><button type="button" class="btn secondary small" data-pan="0">Both</button><button type="button" class="btn secondary small" data-pan="1">Right ▶</button></div></div>
  </div>""",
    """<h2>Fixing common problems</h2><ul><li><strong>Permission denied:</strong> click the camera icon in the address bar and allow access.</li><li><strong>Camera in use:</strong> close Teams, Zoom or other apps using it.</li><li><strong>Mic bar doesn't move:</strong> check you've picked the right microphone and that it isn't muted on the device or headset.</li></ul>""",
    [("Is my video recorded or sent anywhere?", "No. The preview and test recording stay on your device and disappear when you leave the page.")],
    ("planners.js",))
