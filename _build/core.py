"""Shared layout helpers for the etoolbox static site generator."""
import json, os, html

OUT = "/home/claude/toolz"
SITE = "https://etoolbox.co.uk"
YEAR = "2026"

LOGO = ('<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#14213d"/>'
        '<rect x="6" y="6" width="9" height="9" rx="2" fill="#ff6b35"/><rect x="17" y="6" width="9" height="9" rx="2" fill="#fff"/>'
        '<rect x="6" y="17" width="9" height="9" rx="2" fill="#fff"/><rect x="17" y="17" width="4" height="4" rx="1" fill="#ff6b35"/>'
        '<rect x="22" y="22" width="4" height="4" rx="1" fill="#ff6b35"/></svg>')

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
    ]),
    ("everyday", "Everyday tools", "Quick answers you need every day.", [
        ("age-calculator", "🎂", "Age calculator", "Exact age in years, months and days."),
        ("days-between-dates", "📅", "Days between dates", "Count days and working days, or add days to a date."),
        ("unit-converter", "📏", "Unit converter", "Length, weight, volume, temperature and more."),
        ("word-counter", "🔤", "Word counter", "Count words, characters and reading time."),
        ("case-converter", "🔠", "Case converter", "UPPER, lower, Title Case, Sentence case and more."),
        ("password-generator", "🔐", "Password generator", "Strong random passwords, made on your device."),
    ]),
]
TOOLS = [t for c in CATS for t in c[3]]
CAT_OF = {t[0]: c for c in CATS for t in c[3]}


def head(title, desc, path, extra=""):
    url = SITE + path
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta name="theme-color" content="#14213d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
{extra}</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/">{LOGO}<span>e<b>tool</b>box</span></a>
  <nav class="nav">
    <a class="hide-sm" href="/#tools">All tools</a>
    <a href="/pricing/"{' aria-current="page"' if path == '/pricing/' else ''}>Pricing</a>
    <a class="btn small" href="/invoice-generator/">Free invoice</a>
  </nav>
</div></header>
<main>
"""


def foot(scripts=("qrcode.js",)):
    files = ["config.js"] + list(scripts) + ["app.js"]
    tags = "\n".join(f'<script src="/assets/{x}"></script>' for x in files)
    return f"""</main>
<footer class="site-footer"><div class="wrap">
  <div>© {YEAR} etoolbox.co.uk · Free tools for small businesses</div>
  <div><a href="/#tools">All tools</a><a href="/pricing/">Pricing</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a data-contact href="#">Contact</a></div>
</div></footer>
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
    extra = [t for t in TOOLS if t[0] != current and t not in others]
    # Add a couple of popular tools from other categories for internal linking
    picks = others[:5] + [t for t in extra if t[0] in ("invoice-generator", "merge-pdf", "take-home-pay-calculator", "vat-calculator")]
    cards = "".join(
        f'<a class="tool-card" href="/{slug}/"><div class="icon">{icon}</div><h3>{name}</h3><p>{desc}</p></a>'
        for slug, icon, name, desc in picks[:6])
    return f'<section><h2>More free tools</h2><div class="grid">{cards}</div></section>'


def app_ld(h1, path):
    d = {"@context": "https://schema.org", "@type": "WebApplication", "name": html.unescape(h1), "url": SITE + path,
         "applicationCategory": "BusinessApplication", "operatingSystem": "Any",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP"}}
    return f'<script type="application/ld+json">{json.dumps(d)}</script>\n'


def tool_page(slug, title, h1, intro, ui, body, faqs, scripts):
    path = f"/{slug}/"
    page = head(title, intro, path, faq_ld(faqs) + app_ld(h1, path)) + f"""
<div class="wrap">
  <div class="page-head"><h1>{h1}</h1><p>{intro}</p></div>
  {ui}
  <section class="prose">{body}</section>
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
