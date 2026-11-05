"""Shared layout helpers for the etoolbox static site generator."""
import json, os, html

OUT = "/home/claude/toolz"
SITE = "https://etoolbox.co.uk"
YEAR = "2026"

# The logo mark is a small 3D cube (each face shows the etoolbox mark) that tumbles in different directions.
LOGO = ('<span class="logo-mark cube3d" aria-hidden="true"><span class="cube3d-in">'
        + "".join(f'<i class="cf cf{i}"></i>' for i in range(1, 7)) + '</span></span>')


def big_cube():
    """Hero 3x3x3 cube made of small cubes in the logo colours; the top layer twists like a puzzle cube."""
    accents = {(0, 0, 2): "o", (2, 0, 2): "w", (0, 2, 2): "w", (2, 2, 2): "o", (1, 1, 2): "n",
               (2, 0, 0): "o", (0, 1, 0): "w", (2, 2, 1): "o", (0, 0, 1): "w", (1, 2, 0): "o"}
    def cubelet(x, y, z):
        acc = accents.get((x, y, z), "")
        faces = "".join(f'<i class="bf bf{i}{" acc-" + acc if acc and i == (1 if z == 2 else 3 if z == 0 else 2 if x == 2 else 4) else ""}"></i>' for i in range(1, 7))
        return f'<span class="bc" style="--x:{x - 1};--y:{y - 1};--z:{z - 1}">{faces}</span>'
    top = "".join(cubelet(x, 0, z) for x in range(3) for z in range(3))
    rest = "".join(cubelet(x, y, z) for y in (1, 2) for x in range(3) for z in range(3))
    return ('<div class="hero-cube" aria-hidden="true"><div class="hc-rot">'
            f'<div class="hc-layer hc-top">{top}</div><div class="hc-layer">{rest}</div></div><div class="hc-floor"></div></div>')


CATS = [
    ("docs", "Invoices & business documents", "Professional documents in minutes, saved as a PDF.", [
        ("invoice-generator", "🧾", "Invoice generator", "Make a professional invoice with VAT and save it as a PDF."),
        ("quote-generator", "📝", "Quote generator", "Send customers a clear, professional quote or estimate."),
        ("email-signature-generator", "✉️", "Email signature generator", "A professional signature for Gmail, Outlook and Apple Mail."),
        ("barcode-generator", "▥", "Barcode generator", "EAN-13, UPC-A and Code 128 barcodes for products and stock."),
    ]),
    ("pdf", "PDF tools", "Merge, split, convert and number PDFs. Files never leave your device.", [
        ("merge-pdf", "📑", "Merge PDF", "Combine several PDFs into one file, in any order."),
        ("split-pdf", "✂️", "Split PDF", "Extract pages, remove pages or split into separate files."),
        ("jpg-to-pdf", "🖼️", "JPG to PDF", "Turn photos and scans into a single PDF."),
        ("pdf-to-jpg", "🏞️", "PDF to JPG", "Save every PDF page as a JPG or PNG image."),
        ("rotate-pdf", "🔃", "Rotate PDF", "Fix sideways or upside-down pages."),
        ("add-page-numbers-to-pdf", "🔢", "Add page numbers", "Number the pages of any PDF."),
        ("compress-pdf", "🗜️", "Compress PDF", "Make PDFs smaller for email and uploads."),
        ("add-watermark-to-pdf", "💧", "Add watermark to PDF", "Stamp text or your logo on every page, tiled or centred."),
        ("sign-pdf", "✍️", "Sign PDF", "Draw, type or upload your signature and place it on a PDF."),
        ("protect-pdf", "🔒", "Protect PDF", "Add a password with strong AES-256 encryption."),
        ("unlock-pdf", "🔓", "Unlock PDF", "Remove the password from a PDF you can open."),
        ("pdf-to-excel", "📊", "PDF to Excel", "Turn PDF tables and statements into an Excel spreadsheet."),
        ("pdf-to-word", "📄", "PDF to Word", "Turn PDF text into an editable Word document."),
        ("word-to-pdf", "📘", "Word to PDF", "Convert .docx documents to PDF."),
        ("compare-documents", "🆚", "Compare documents", "Spot every change between two PDFs, Word files or texts."),
        ("image-to-text", "🔤", "Image to text (OCR)", "Copy text out of screenshots, photos and scans."),
        ("invoice-data-extractor", "🧮", "Invoice data extractor", "Pull totals, VAT and dates from PDF invoices into a spreadsheet."),
    ]),
    ("files", "File tools", "Bulk-rename, de-duplicate and verify files. They never leave your computer.", [
        ("batch-file-renamer", "🏷️", "Batch file renamer", "Rename hundreds of files at once with patterns and numbering."),
        ("duplicate-file-finder", "👯", "Duplicate file finder", "Find identical files in a folder and see how much space you can free."),
        ("file-checksum", "🔏", "File checksum checker", "Get MD5/SHA-256 hashes and verify downloads."),
    ]),
    ("money", "Money & tax calculators", "UK pay, VAT, pricing and borrowing, using 2026/27 rates.", [
        ("take-home-pay-calculator", "💰", "Take-home pay calculator", "Your UK salary after tax, NI, pension and student loan (2026/27)."),
        ("vat-calculator", "💷", "VAT calculator", "Add or remove UK VAT at 20%, 5% or any rate."),
        ("profit-margin-calculator", "📈", "Profit margin calculator", "Work out margin, markup and the right selling price."),
        ("hourly-rate-calculator", "⏱️", "Hourly rate calculator", "Find the rate you need to charge as a freelancer."),
        ("mileage-allowance-calculator", "🚗", "Mileage allowance calculator", "HMRC mileage at the 2026/27 rates (55p/25p)."),
        ("loan-calculator", "🏦", "Loan calculator", "Monthly payments and total interest on a loan."),
        ("mortgage-calculator", "🏠", "Mortgage calculator", "Monthly repayments, LTV and total interest."),
        ("compound-interest-calculator", "🌱", "Savings & compound interest", "See how your savings could grow."),
        ("discount-calculator", "🏷️", "Discount calculator", "Sale prices and percentage off."),
        ("percentage-calculator", "➗", "Percentage calculator", "Percentages of numbers, and percentage increases and decreases."),
        ("currency-converter", "💱", "Currency converter", "Convert pounds, euros, dollars and 30 currencies at today's ECB rates."),
    ]),
    ("qr", "QR code tools", "Menus, Wi-Fi, contact cards and more. Free codes never expire.", [
        ("qr-code-generator", "🔗", "Website QR code", "Send people to any web page, review page or booking link."),
        ("menu-qr-code-generator", "🍽️", "Menu QR code + table card", "Print-ready table cards for cafés, pubs and takeaways."),
        ("wifi-qr-code-generator", "📶", "Wi-Fi QR code", "Guests scan to join your Wi-Fi. No more spelling out passwords."),
        ("vcard-qr-code-generator", "👤", "Contact card QR code", "Put your contact details on business cards and flyers."),
        ("whatsapp-qr-code-generator", "💬", "WhatsApp QR code", "Customers scan to start a WhatsApp chat with you."),
    ]),
    ("images", "Image tools", "Resize and shrink photos for your website and social media. Nothing is uploaded.", [
        ("image-compressor", "🗜️", "Image compressor", "Make JPG, PNG and WebP files smaller without visible quality loss."),
        ("image-resizer", "📐", "Image resizer", "Resize photos to exact pixels or by percentage."),
        ("image-converter", "🔄", "Image converter", "Convert between JPG, PNG and WebP."),
        ("background-remover", "✨", "Background remover (AI)", "Remove the background from any photo with AI, on your device."),
        ("add-watermark-to-image", "©️", "Watermark photos", "Add a text or logo watermark to up to 50 photos at once."),
        ("heic-to-jpg", "📱", "HEIC to JPG", "Convert iPhone HEIC photos to JPG, up to 50 at once."),
        ("jpg-to-png", "🖼️", "JPG to PNG", "Convert JPG photos to PNG."),
        ("png-to-jpg", "📷", "PNG to JPG", "Convert PNG images to smaller JPGs."),
        ("webp-to-jpg", "🌐", "WebP to JPG", "Open-anywhere JPGs from WebP images."),
        ("colour-picker", "🎨", "Colour picker", "HEX, RGB, HSL and CMYK codes, shades and contrast checks."),
        ("photo-metadata-remover", "📍", "Photo metadata & GPS remover", "See what your photos reveal and strip location and camera data."),
    ]),
    ("web", "Website & developer tools", "Handy tools for your website and online presence.", [
        ("meta-description-generator", "🔍", "Meta description generator", "Write meta descriptions and preview your Google listing."),
        ("website-screenshot", "🖥️", "Website screenshot", "Capture any website on desktop, tablet or mobile."),
        ("json-formatter", "{ }", "JSON formatter", "Format, validate and minify JSON."),
        ("website-speed-test", "⚡", "Website speed test", "Core Web Vitals and Google PageSpeed scores for any page."),
        ("dns-checker", "🌍", "DNS propagation checker", "See what 8 public DNS providers return for your domain."),
        ("email-dns-checker", "🛡️", "SPF, DKIM & DMARC checker", "Check your domain's email security records."),
        ("email-header-analyzer", "📨", "Email header analyser", "Trace an email's route and check SPF/DKIM/DMARC results."),
        ("api-request-builder", "🔌", "API request builder", "Send HTTP requests and get cURL, JavaScript and Python code."),
        ("jwt-decoder", "🔑", "JWT decoder", "Decode JSON Web Tokens and check expiry."),
    ]),
    ("plan", "Planners & trackers", "Saved privately in your browser, with no account needed.", [
        ("budget-planner", "📊", "Monthly budget planner", "Plan income and spending with the 50/30/20 rule."),
        ("subscription-tracker", "🔁", "Subscription tracker", "Track every subscription and add renewal reminders to your calendar."),
        ("travel-budget-planner", "🧳", "Travel budget planner", "Estimate trip costs per person, in pounds and local currency."),
        ("trip-cost-splitter", "🤝", "Trip cost splitter", "Split shared costs and see who owes whom."),
        ("meeting-time-finder", "🕒", "Meeting time finder", "Find a time that works across time zones."),
    ]),
    ("media", "Media & audio", "Video to MP3, YouTube, speech and audio helpers.", [
        ("video-to-mp3", "🎵", "Video to MP3 converter", "Extract MP3 audio from any video, even 2-hour files. Nothing uploaded."),
        ("youtube-thumbnail-downloader", "▶️", "YouTube thumbnail downloader", "Get any video's thumbnail in HD."),
        ("text-to-speech", "🔊", "Text to speech", "Listen to any text read aloud in natural voices."),
        ("speech-to-text", "🎙️", "Speech to text", "Dictate and get a written transcript."),
    ]),
    ("maths", "Maths calculators", "Scientific, fraction and statistics calculators, plus number base conversion.", [
        ("scientific-calculator", "🧮", "Scientific calculator", "Fractions, surds, trig, logs, nCr, memory and a table of values."),
        ("fraction-calculator", "➗", "Fraction calculator", "Add, subtract, multiply and divide fractions, with working."),
        ("statistics-calculator", "📊", "Mean, median & mode calculator", "Mean, median, mode, range, quartiles and standard deviation."),
        ("hex-to-decimal-converter", "🔢", "Hex, binary & decimal converter", "Convert between hex, decimal, binary and octal, plus bitwise maths."),
    ]),
    ("everyday", "Everyday tools", "Quick answers you need every day.", [
        ("age-calculator", "🎂", "Age calculator", "Exact age in years, months and days."),
        ("days-between-dates", "📅", "Days between dates", "Count days and working days, or add days to a date."),
        ("unit-converter", "📏", "Unit converter", "Length, weight, volume, temperature and more."),
        ("bmi-calculator", "⚖️", "BMI calculator", "Body mass index with NHS categories, in metric or imperial."),
        ("recipe-scaler", "🍳", "Recipe scaler", "Scale ingredients up or down and convert cups to grams."),
        ("webcam-mic-test", "🎥", "Webcam & mic test", "Check your camera, microphone and speakers before a call."),
        ("word-counter", "🔤", "Word counter", "Count words, characters and reading time."),
        ("case-converter", "🔠", "Case converter", "UPPER, lower, Title Case, Sentence case and more."),
        ("password-generator", "🔐", "Password generator", "Strong random passwords, made on your device."),
    ]),
]
TOOLS = [t for c in CATS for t in c[3]]
CAT_OF = {t[0]: c for c in CATS for t in c[3]}

ICONS = {
    "invoice-generator": "receipt", "quote-generator": "file-pen-line", "email-signature-generator": "mail", "barcode-generator": "barcode",
    "merge-pdf": "files", "split-pdf": "scissors", "jpg-to-pdf": "file-image", "pdf-to-jpg": "image-down", "rotate-pdf": "rotate-cw",
    "add-page-numbers-to-pdf": "list-ordered", "compress-pdf": "file-down", "add-watermark-to-pdf": "stamp", "pdf-to-word": "file-type",
    "word-to-pdf": "file-output", "compare-documents": "git-compare", "image-to-text": "scan-text", "invoice-data-extractor": "file-spreadsheet",
    "batch-file-renamer": "text-cursor-input", "duplicate-file-finder": "copy", "file-checksum": "fingerprint",
    "take-home-pay-calculator": "wallet", "vat-calculator": "percent", "profit-margin-calculator": "trending-up", "hourly-rate-calculator": "timer",
    "mileage-allowance-calculator": "car", "loan-calculator": "landmark", "mortgage-calculator": "house", "compound-interest-calculator": "piggy-bank",
    "discount-calculator": "tag", "percentage-calculator": "percent", "currency-converter": "arrow-left-right",
    "qr-code-generator": "qr-code", "menu-qr-code-generator": "utensils", "wifi-qr-code-generator": "wifi", "vcard-qr-code-generator": "contact",
    "whatsapp-qr-code-generator": "message-circle", "image-compressor": "minimize-2", "image-resizer": "scaling", "image-converter": "repeat",
    "background-remover": "eraser", "add-watermark-to-image": "copyright", "jpg-to-png": "image-plus", "png-to-jpg": "images", "webp-to-jpg": "image",
    "colour-picker": "pipette", "photo-metadata-remover": "map-pin-off", "meta-description-generator": "search", "website-screenshot": "monitor",
    "json-formatter": "braces", "website-speed-test": "gauge", "dns-checker": "globe", "email-dns-checker": "shield-check", "email-header-analyzer": "mail-search",
    "api-request-builder": "plug", "jwt-decoder": "key-round", "budget-planner": "chart-pie", "subscription-tracker": "refresh-cw",
    "travel-budget-planner": "luggage", "trip-cost-splitter": "handshake", "meeting-time-finder": "clock", "youtube-thumbnail-downloader": "play", "video-to-mp3": "file-audio",
    "text-to-speech": "volume-2", "speech-to-text": "mic", "age-calculator": "cake", "days-between-dates": "calendar-days", "unit-converter": "ruler",
    "bmi-calculator": "scale", "recipe-scaler": "chef-hat", "webcam-mic-test": "webcam", "word-counter": "type", "case-converter": "case-sensitive",
    "password-generator": "lock-keyhole", "sign-pdf": "signature", "protect-pdf": "file-lock", "unlock-pdf": "lock-keyhole-open",
    "pdf-to-excel": "sheet", "heic-to-jpg": "image-up", "scientific-calculator": "calculator", "fraction-calculator": "divide",
    "statistics-calculator": "chart-column", "hex-to-decimal-converter": "binary",
}
CAT_ICON = {"docs": "receipt", "pdf": "file-text", "files": "folder-search", "money": "wallet", "qr": "qr-code", "images": "image",
            "web": "globe", "plan": "calendar-days", "media": "volume-2", "everyday": "calculator", "maths": "sigma"}
CAT_SHORT = {"docs": "Business docs", "pdf": "PDF", "files": "Files", "money": "Money & tax", "qr": "QR codes", "images": "Images",
             "web": "Website", "plan": "Planners", "media": "Media", "maths": "Maths", "everyday": "Everyday"}
UI_ICONS = ["lock", "shield", "sparkles", "zap", "smartphone", "badge-percent", "search", "arrow-right", "check", "upload", "download", "x", "share-2", "link", "message-circle", "mail"]


def svg(name, cls="ic"):
    return f'<svg class="{cls}" aria-hidden="true"><use href="/assets/icons.svg#{name}"/></svg>'


def tool_icon(slug):
    return f'<span class="ti c-{CAT_OF[slug][0]}">{svg(ICONS.get(slug, "sparkles"))}</span>'


def card(slug, name, desc, extra=""):
    return f'<a class="tool-card" href="/{slug}/"{extra}>{tool_icon(slug)}<h3>{name}</h3><p>{desc}</p></a>'


def build_sprite(src_dir):
    import re as _re
    names = sorted(set(list(ICONS.values()) + list(CAT_ICON.values()) + UI_ICONS))
    out = ['<svg xmlns="http://www.w3.org/2000/svg"><!-- Lucide icons (ISC licence) https://lucide.dev -->']
    for n in names:
        body = open(os.path.join(src_dir, n + ".svg")).read()
        inner = _re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", body, flags=_re.S).strip()
        inner = _re.sub(r"\s+", " ", inner)
        out.append(f'<symbol id="{n}" viewBox="0 0 24 24">{inner}</symbol>')
    out.append("</svg>")
    with open(os.path.join(OUT, "assets", "icons.svg"), "w") as f:
        f.write("".join(out))


NAV = [("pdf", "PDF tools"), ("images", "Image tools"), ("docs", "Invoices"), ("money", "Calculators")]


def head(title, desc, path, extra="", body_class=""):
    url = SITE + path
    navlinks = "".join(f'<a class="hide-md" href="/#{k}">{t}</a>' for k, t in NAV)
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="etoolbox">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14213d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/style.css">
<script>try{{var t=localStorage.getItem("etb-theme");if(t)document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}</script>
{extra}</head>
<body{(' class="' + body_class + '"') if body_class else ""}>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/" aria-label="etoolbox home">{LOGO}<span>e<b>tool</b>box</span><span class="pro-badge" title="Pro is active on this device">PRO</span></a>
  <div class="search" role="search"><label for="tool-search" class="sr-only">Search tools</label>
    {svg("search", "ic search-ic")}<input type="search" id="tool-search" placeholder="Search {len(TOOLS)} free tools…" title="Tip: press / to search" autocomplete="off" aria-controls="search-results" aria-expanded="false">
    <ul class="search-results" id="search-results" role="listbox" hidden></ul></div>
  <nav class="nav" aria-label="Main">
    {navlinks}
    <a href="/pricing/"{' aria-current="page"' if path == '/pricing/' else ''}>Pricing</a>
    <a class="nav-contact" href="/contact/"{' aria-current="page"' if path == '/contact/' else ''} title="hello@etoolbox.co.uk">{svg("mail")}<span>Contact</span></a>
    <button type="button" class="icon-toggle" id="theme-toggle" aria-label="Switch light or dark mode" title="Light / dark mode">◐</button>
  </nav>
</div></header>
<main id="main">
"""


def directory():
    cols = []
    for key, title, blurb, tools in CATS:
        links = "".join(f'<li><a href="/{s}/">{n}</a></li>' for s, i, n, d in tools)
        cols.append(f'<div><h3><a href="/#{key}">{CAT_SHORT[key]}</a></h3><ul>{links}</ul></div>')
    return '<nav class="directory" aria-label="All tools">' + "".join(cols) + "</nav>"


# ---------- Featured local business (free courtesy spot; set AD_ON = False to remove) ----------
AD_ON = True
AD_ORDER = "https://smokeandpepper.3s-pos.com/"
AD_MAP = "https://www.google.com/maps/search/?api=1&query=Smoke+%26+Pepper+2-3+Butter+Market+Reading+RG1+2DP"
AD_IMG = "/assets/partners/smokeandpepper-burger.webp"
AD_HTML = f"""<aside class="fad" id="fad" aria-label="Featured local business" hidden>
  <button type="button" class="fad-x" aria-label="Hide this">×</button>
  <span class="fad-tag">Featured local business</span>
  <img class="fad-logo" src="/assets/partners/smokeandpepper-logo.svg" alt="Smoke &amp; Pepper" width="180" height="18">
  <div class="fad-photo"><img src="{AD_IMG}" alt="Smoke &amp; Pepper burger" width="360" height="360" loading="lazy"></div>
  <div class="fad-head">We’re Smokin’</div>
  <div class="fad-new">Now open in Reading!</div>
  <p class="fad-what">Burgers &amp; flame-grilled chicken</p>
  <p class="fad-dish"><b>Oklahoma Burger:</b> two beef smash patties, caramelised onions, melted cheese &amp; smoky beef bacon jam</p>
  <p class="fad-meta">100% grass-fed Aberdeen Angus British beef</p>
  <p class="fad-addr">2–3 Butter Market, Reading RG1 2DP</p>
  <div class="fad-btns"><a class="fad-order" href="{AD_ORDER}" target="_blank" rel="nofollow noopener">Order</a><a class="fad-dir" href="{AD_MAP}" target="_blank" rel="nofollow noopener">Directions</a></div>
</aside>"""


def foot(scripts=("qrcode.js",)):
    files = ["config.js", "tools-index.js"] + list(scripts) + ["app.js"] + ([] if "network-bg.js" in scripts else ["network-bg.js"])
    tags = "\n".join(f'<script src="/assets/{x}"></script>' for x in files)
    return f"""</main>
<footer class="site-footer"><div class="wrap">
  {directory()}
  <div class="foot-bottom">
    <div class="foot-brand"><a class="logo" href="/">{LOGO}<span>e<b>tool</b>box</span></a><p>Free online tools for UK small businesses, freelancers and everyone else. Files are processed in your browser.</p>
      <p class="foot-mail">{svg("mail")} <a href="mailto:hello@etoolbox.co.uk">hello@etoolbox.co.uk</a></p></div>
    <div class="foot-links"><a href="/pricing/">Pricing</a><a href="/embed/">Free calculators for your site</a><a href="/salary-after-tax/">Salary after tax</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div>
  </div>
  <p class="foot-copy">© {YEAR} etoolbox.co.uk · Made in the UK</p>
</div></footer>
{AD_HTML if AD_ON else ""}
{tags}
</body>
</html>
"""


FOOT = foot(())


def write(path, content):
    fp = os.path.join(OUT, path.strip("/"), "index.html") if path != "/" else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "w") as f:
        f.write(content)


def faq_html(faqs):
    items = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faqs)
    return f'<section class="faq prose"><h2>Questions</h2>{items}</section>'


def faq_ld(faqs):
    data = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": html.unescape(q), "acceptedAnswer": {"@type": "Answer", "text": html.unescape(a)}} for q, a in faqs]}
    return f'<script type="application/ld+json">{json.dumps(data)}</script>\n'


def related(current):
    cat = CAT_OF[current]
    others = [t for t in cat[3] if t[0] != current]
    popular = ("merge-pdf", "compress-pdf", "background-remover", "invoice-generator", "pdf-to-word", "take-home-pay-calculator", "vat-calculator")
    extra = [t for t in TOOLS if t[0] in popular and t[0] != current and t not in others]
    picks = others[:5] + extra
    cards = "".join(card(slug, name, desc) for slug, icon, name, desc in picks[:8])
    return f'<section><h2>More free tools</h2><div class="grid">{cards}</div></section>'


def crumbs(slug, h1):
    cat = CAT_OF[slug]
    d = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": html.unescape(cat[1]), "item": SITE + "/#" + cat[0]},
        {"@type": "ListItem", "position": 3, "name": html.unescape(h1), "item": SITE + "/" + slug + "/"}]}
    nav = f'<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/#{cat[0]}">{cat[1]}</a><span aria-hidden="true">›</span><span aria-current="page">{dict((t[0], t[2]) for t in cat[3])[slug]}</span></nav>'
    return nav, f'<script type="application/ld+json">{json.dumps(d)}</script>\n'


def app_ld(h1, path):
    d = {"@context": "https://schema.org", "@type": "WebApplication", "name": html.unescape(h1), "url": SITE + path,
         "applicationCategory": "BusinessApplication", "operatingSystem": "Any",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP"}}
    return f'<script type="application/ld+json">{json.dumps(d)}</script>\n'


SERVER_NOTE = {
    "website-screenshot": "🌐 Uses our server: the page is opened in a browser on Cloudflare",
    "dns-checker": "🌐 Uses our server to ask several public DNS resolvers",
    "email-dns-checker": "🌐 Uses our server to look up public DNS records",
    "website-speed-test": "🌐 Sends the web address to Google PageSpeed Insights",
    "currency-converter": "🌐 Downloads exchange rates from the ECB (Frankfurter)",
    "speech-to-text": "🌐 Speech is recognised by your browser's provider (e.g. Google)",
    "api-request-builder": "🌐 Requests go straight from your browser to the API you choose",
}


def privacy_tag(slug):
    if slug in SERVER_NOTE:
        return f'<span class="privacy-tag server">{svg("globe")} {SERVER_NOTE[slug].replace("🌐 ", "")}</span>'
    return f'<span class="privacy-tag">{svg("lock")} Runs in your browser. Nothing is uploaded.</span>'


def share_bar(path, text):
    from urllib.parse import quote
    u = quote(SITE + path, safe=""); t = quote(text, safe="")
    links = [("WhatsApp", f"https://wa.me/?text={t}%20{u}", "message-circle"),
             ("X", f"https://x.com/intent/post?text={t}&url={u}", None),
             ("LinkedIn", f"https://www.linkedin.com/sharing/share-offsite/?url={u}", None),
             ("Facebook", f"https://www.facebook.com/sharer/sharer.php?u={u}", None),
             ("Email", f"mailto:?subject={t}&body={u}", "mail")]
    a = "".join(f'<a class="sh" href="{h}" target="_blank" rel="noopener nofollow" data-net="{n}">{svg(i) if i else ""}{n}</a>' for n, h, i in links)
    return (f'<div class="share-bar" data-url="{SITE}{path}" data-text="{html.escape(text)}"><span class="sh-lead">{svg("share-2")} Useful? Share it free:</span>'
            f'<button type="button" class="sh sh-native" hidden>{svg("share-2")}Share</button>{a}'
            f'<button type="button" class="sh sh-copy">{svg("link")}<span>Copy link</span></button></div>')


TOOL_SRC = {}
VARIANT_LINKS = {}  # base slug -> [(slug, label)], filled from _build/variants.py data


def variant_links(slug):
    v = VARIANT_LINKS.get(slug)
    if not v:
        return ""
    return ('<section class="var-links"><h2>Popular conversions</h2><div class="pops">'
            + "".join(f'<a class="pop" href="/{s}/">{l}</a>' for s, l in v) + "</div></section>")


def tool_page(slug, title, h1, intro, ui, body, faqs, scripts, extra=""):
    TOOL_SRC[slug] = {"ui": ui, "scripts": scripts, "extra": extra}
    path = f"/{slug}/"
    nav, bld = crumbs(slug, h1)
    page = head(title, intro, path, faq_ld(faqs) + app_ld(h1, path) + bld + extra) + f"""
<div class="wrap">
  {nav}
  <div class="page-head" data-slug="{slug}"><div class="ph-row">{tool_icon(slug)}<h1>{h1}</h1></div><p>{intro}</p>{privacy_tag(slug)}</div>
  {ui}
  {share_bar(path, html.unescape(h1) + " – free, no sign-up, nothing uploaded")}
  {'<p class="embed-cta">Run a website or blog? <a href="/embed/">Add this calculator to your site for free →</a></p>' if slug in ("take-home-pay-calculator", "vat-calculator", "mileage-allowance-calculator", "hourly-rate-calculator") else ""}
  <section class="prose">{body}</section>
  {variant_links(slug)}
  {faq_html(faqs)}
  {related(slug)}
</div>
""" + foot(scripts)
    write(path, page)


# ---------- QR generator helpers ----------

STYLE_OPTS = """
<details class="style-opts">
  <summary>Colours &amp; download size</summary>
  <div class="colors" style="margin-top:12px">
    <label class="check">Code <input type="color" name="fg" value="#000000"></label>
    <label class="check">Background <input type="color" name="bg" value="#ffffff"></label>
  </div>
  <div class="row">
    <div><label for="ecc">Error correction <span class="hint">(higher survives scratches)</span></label>
      <select id="ecc" name="ecc"><option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">High</option><option value="H">Highest</option></select></div>
    <div><label for="size">PNG size</label>
      <select id="size" name="size"><option value="512">512 px</option><option value="1024" selected>1024 px</option><option value="2048">2048 px (print)</option></select></div>
  </div>
</details>
"""


def preview(card=False):
    card_btn = '<button type="button" class="btn" id="dl-card">Download table card</button>' if card else ""
    return f"""
<div class="panel preview" aria-live="polite">
  <div id="qr-empty" class="empty">Your QR code will appear here as you type.</div>
  <canvas id="qr-canvas" width="640" height="640" hidden aria-label="Generated QR code"></canvas>
  <div id="qr-warn" class="warn" role="status"></div>
  <div id="qr-actions" class="actions" hidden>
    {card_btn}
    <button type="button" class="btn{' secondary' if card else ''}" id="dl-png">Download PNG</button>
    <button type="button" class="btn secondary" id="dl-svg">Download SVG</button>
  </div>
  <p class="note">Made in your browser. Nothing you type is uploaded or stored.<br>Free codes never expire.</p>
</div>"""


UPSELL = """
<div class="upsell">
  <div><h3>Printed it already and need to change the link?</h3>
  <p>Pro dynamic QR codes let you change where a code points at any time, and show you how many scans each one gets.</p></div>
  <a class="btn" href="/pricing/">See Pro</a>
</div>"""


def gen_page(slug, title, h1, intro, tool, fields, body, faqs, card=False):
    ui = f"""
  <div class="gen">
    <form class="panel" id="qr-form" data-tool="{tool}" autocomplete="off" novalidate>
      {fields}
      {STYLE_OPTS}
    </form>
    {preview(card)}
  </div>
  {UPSELL}"""
    tool_page(slug, title, h1, intro, ui, body, faqs, ("qrcode.js",))


def write_index():
    data = [[slug, tool_icon(slug), html.unescape(name), desc, html.unescape(cat[1]), cat[0]] for cat in CATS for slug, icon, name, desc in cat[3]]
    with open(os.path.join(OUT, "assets", "tools-index.js"), "w") as f:
        f.write("window.ETB_TOOLS=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
