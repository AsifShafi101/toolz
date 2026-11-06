# Homepage

def cat_grid():
    out = []
    for key, title, blurb, tools in CATS:
        cards = "".join(card(s, n, d) for s, i, n, d in tools)
        out.append(f'<section id="{key}" class="cat" data-cat="{key}"><div class="cat-title"><span class="ti c-{key}">{svg(CAT_ICON[key])}</span>'
                   f'<div><h2>{title}</h2><p class="muted">{blurb}</p></div></div><div class="grid">{cards}</div></section>')
    return "".join(out)


def tabs():
    t = '<button type="button" class="tab" data-filter="all" aria-pressed="true">All</button>'
    t += "".join(f'<button type="button" class="tab" data-filter="{c[0]}" aria-pressed="false">{CAT_SHORT[c[0]]}</button>' for c in CATS)
    return f'<div class="tabs" role="toolbar" aria-label="Filter tools by category">{t}</div>'


POPULAR = [("merge-pdf", "Merge PDF"), ("compress-pdf", "Compress PDF"), ("background-remover", "Remove background"), ("pdf-to-word", "PDF to Word"),
           ("jpg-to-pdf", "JPG to PDF"), ("add-watermark-to-pdf", "Watermark PDF"), ("invoice-generator", "Invoice"), ("take-home-pay-calculator", "Take-home pay"), ("bmi-calculator", "BMI calculator")]
pop_chips = "".join(f'<a class="pop" href="/{s}/">{tool_icon(s)}<span>{n}</span></a>' for s, n in POPULAR)

FEATURED = ["merge-pdf", "compress-pdf", "background-remover", "add-watermark-to-pdf", "pdf-to-word", "invoice-generator", "image-compressor", "take-home-pay-calculator"]
NAMES = {t[0]: t for t in TOOLS}
featured = "".join(card(s, NAMES[s][2], NAMES[s][3]) for s in FEATURED)

HOME_FAQ = [
    ("Are the tools really free?", "Yes. Every tool on etoolbox is free to use with no sign-up and no daily limit. An optional Pro plan adds extras such as your logo on invoices and dynamic QR codes."),
    ("Are my files uploaded?", "No, for almost every tool. PDFs, images, invoices and calculations are processed in your browser, so the files never leave your device. The few tools that need a server, such as the website screenshot tool, say so clearly on the page."),
    ("Do the tools work on a phone?", "Yes. etoolbox works in any modern browser on iPhone, Android, Windows, Mac and Chromebook. There's nothing to install."),
    ("Are the UK tax calculators up to date?", "Yes. The take-home pay, mileage and VAT calculators use the 2026/27 UK rates and thresholds, including Scottish income tax bands."),
    ("Do you add a watermark to my files?", "No. etoolbox never adds its own branding or watermark to your PDFs, images or invoices."),
]

ORG = {"@context": "https://schema.org", "@graph": [
    {"@type": "Organization", "@id": SITE + "/#org", "name": "etoolbox", "url": SITE + "/", "logo": SITE + "/assets/apple-touch-icon.png",
     "email": "hello@etoolbox.co.uk", "areaServed": "GB",
     "contactPoint": {"@type": "ContactPoint", "contactType": "customer support", "email": "hello@etoolbox.co.uk", "url": SITE + "/contact/", "areaServed": "GB", "availableLanguage": "English"}},
    {"@type": "WebSite", "@id": SITE + "/#website", "name": "etoolbox", "url": SITE + "/", "inLanguage": "en-GB", "publisher": {"@id": SITE + "/#org"},
     "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": SITE + "/?q={search_term_string}"},
                         "query-input": "required name=search_term_string"}},
    {"@type": "ItemList", "name": "Free online tools", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "url": SITE + "/" + t[0] + "/", "name": html.unescape(t[2])} for i, t in enumerate(TOOLS)]}]}

home = head("Free Online Tools – PDF, Image & Calculators, No Sign-up | etoolbox",
            f"Free tools for personal and business use: merge and compress PDFs, remove image backgrounds with AI, add watermarks, make invoices, and use BMI, VAT and UK tax calculators. {len(TOOLS)} free tools that run in your browser, so your files stay private.",
            "/", faq_ld(HOME_FAQ) + '<script type="application/ld+json">' + json.dumps(ORG) + "</script>\n", "home") + f"""
<div class="hero-band dark-band">
<canvas id="net-bg" class="net-bg" aria-hidden="true"></canvas>
<div class="wrap hero hero-split">
 <div class="hero-copy">
  <span class="pill">{svg("sparkles")} {len(TOOLS)} free tools · No sign-up · Files stay on your device</span>
  <h1 class="brand-h1"><span class="h1-main"><span class="h1-logo">{LOGO}<span class="h1-word">e<b>tool</b>box</span></span> has everything for you and your business</span><span class="h1-sub">Free online tools for PDFs, images, calculators and more</span></h1>
  <p class="lead">Merge and compress PDFs, remove photo backgrounds with AI, add watermarks, make invoices, and check your BMI or UK take-home pay. Everything runs in your browser, so nothing is uploaded.</p>
  <div class="search hero-search" role="search"><label for="hero-search" class="sr-only">Search all tools</label>
    {svg("search", "ic search-ic")}<input type="search" id="hero-search" placeholder="What do you need? e.g. compress PDF, remove background" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="hero-results" aria-expanded="false">
    <ul class="search-results" id="hero-results" role="listbox" hidden></ul></div>
  <div class="pops" aria-label="Popular tools">{pop_chips}</div>
 </div>
 <div class="hero-visual">{big_cube()}</div>
</div>
<div class="wrap trust-wrap"><ul class="trust trust-card">
  <li>{svg("lock")}<div><strong>Private by design</strong><span>Files are processed on your device, not on our servers</span></div></li>
  <li>{svg("badge-percent")}<div><strong>Free, no sign-up</strong><span>No accounts, no daily limits, no watermarks</span></div></li>
  <li>{svg("zap")}<div><strong>Fast</strong><span>No upload queues. Results in seconds</span></div></li>
  <li>{svg("smartphone")}<div><strong>Works everywhere</strong><span>Phone, tablet, Mac, Windows and Chromebook</span></div></li>
</ul></div>
</div>
<div class="wrap">
  <div id="my-tools"></div>
  <section id="popular"><div class="sec-head"><h2>Most popular</h2></div><div class="grid">{featured}</div></section>
  <div id="tools" class="all-tools"><div class="sec-head"><h2>All {len(TOOLS)} tools</h2>{tabs()}</div>{cat_grid()}</div>
  <section class="how"><h2>How it works</h2><ol class="steps">
    <li><span class="num">1</span><h3>Choose a tool</h3><p>Search or browse {len(TOOLS)} tools for PDFs, images, documents and money.</p></li>
    <li><span class="num">2</span><h3>Add your file</h3><p>Drop in a file or type your details. It's processed right there in your browser.</p></li>
    <li><span class="num">3</span><h3>Download</h3><p>Get your result straight away. No email, no account, no waiting.</p></li></ol></section>
  {UPSELL}
  <section class="prose">
    <h2>Why etoolbox?</h2>
    <p>Most PDF and image websites upload every file you give them to their servers. etoolbox works differently: the tools run <strong>inside your web browser</strong>, so contracts, payslips, ID scans and customer photos stay on your device. It's quicker too, because there's nothing to upload.</p>
    <ul>
      <li><strong>Actually free.</strong> No sign-up, no watermarks, and QR codes that never expire.</li>
      <li><strong>Made for UK businesses.</strong> Pounds, UK VAT, 2026/27 tax rates, HMRC mileage rates, UK dates and +44 phone numbers.</li>
      <li><strong>Everything in one place.</strong> PDF tools, an AI background remover, an invoice generator, calculators, QR codes and website tools.</li>
    </ul>
  </section>
  {faq_html(HOME_FAQ)}
</div>
""" + foot(("network-bg.js",))
write("/", home)
