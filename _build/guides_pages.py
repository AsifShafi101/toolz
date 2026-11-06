# How-to guides. Each one answers a real question fully and links to the matching tool.
# Facts checked November 2026 (GOV.UK / HMRC VAT Notice 700, provider help pages).
GUIDE_DATE = "2026-11-06"


def cta(slug, text):
    name = dict((t[0], t[2]) for c in CATS for t in c[3]).get(slug, text)
    return (f'<div class="guide-cta">{tool_icon(slug)}<div><strong>{name}</strong><span>{text}</span></div>'
            f'<a class="btn" href="/{slug}/">Open the tool →</a></div>')


GUIDES = [
    ("how-to-create-a-vat-invoice", "invoice-generator",
     "How to Create a VAT Invoice in the UK (2026 Checklist) | etoolbox",
     "Exactly what a UK VAT invoice must show, when you can use a simplified invoice, and how to make one free in minutes.",
     "How to create a VAT invoice in the UK",
     f"""<p>If you're VAT-registered and you sell to another VAT-registered business, you normally have to give them a VAT invoice, usually within 30 days of the sale. Your customer needs it to reclaim the VAT, so getting it right matters to both of you. Here's what HMRC says it must include, in plain English.</p>
<h2>Do you need to charge VAT?</h2>
<p>Only VAT-registered businesses can charge VAT or issue VAT invoices. You must register once your taxable turnover goes over <strong>£90,000</strong> in any rolling 12 months (the threshold for 2026/27). Below that you can register voluntarily. If you're not registered, send a normal invoice and <strong>don't</strong> add VAT.</p>
<h2>What a full VAT invoice must show</h2>
<ol>
<li>A <strong>unique invoice number</strong> that follows on from your last one (INV-0041, INV-0042…).</li>
<li>Your business <strong>name, address</strong> and <strong>VAT registration number</strong>.</li>
<li>The <strong>invoice date</strong>, and the <strong>time of supply</strong> (tax point) if it's different.</li>
<li>Your customer's <strong>name</strong> (or trading name) and <strong>address</strong>.</li>
<li>A <strong>description</strong> of each item clear enough to identify what you supplied.</li>
<li>For each item: the <strong>quantity</strong>, the <strong>unit price excluding VAT</strong>, the <strong>VAT rate</strong> and the <strong>amount excluding VAT</strong>.</li>
<li>Any <strong>discount</strong> you've given.</li>
<li>The <strong>total excluding VAT</strong> and the <strong>total VAT</strong>, shown in pounds sterling.</li>
</ol>
<p>Prices in a foreign currency are fine, but the VAT amount must also be shown in sterling.</p>
<h2>Simplified invoices for £250 or less</h2>
<p>If the total including VAT is <strong>£250 or less</strong>, you can give a simplified VAT invoice instead. It only needs your name, address and VAT number, the time of supply, a description of the goods or services, and for each VAT rate the total including VAT and the rate charged. You don't need the customer's details.</p>
<h2>Make one in 3 minutes</h2>
<ol><li>Open the <a href="/invoice-generator/">free invoice generator</a> and enter your business details and VAT number. They're remembered for next time.</li>
<li>Add your customer and each item with its quantity, price and VAT rate (20%, 5% or 0%). The VAT and totals are worked out for you.</li>
<li>Add your bank details under payment details, then press <strong>Download PDF</strong>.</li></ol>
{cta("invoice-generator", "Free, with VAT, automatic numbering and PDF download. Nothing is uploaded.")}
<h2>Common mistakes</h2>
<ul><li>Charging VAT when you're not registered. That's not allowed.</li>
<li>Reusing or skipping invoice numbers. Keep one unbroken sequence.</li>
<li>Showing one total with no VAT breakdown. The VAT must be shown separately.</li>
<li>Forgetting your VAT number. Without it, your customer can't reclaim the VAT.</li></ul>
<p class="note">This guide is general information, not tax advice. See GOV.UK's “VAT guide (VAT Notice 700)” for the full rules.</p>""",
     [("Do I have to send a VAT invoice?", "Yes, if you're VAT-registered and selling to another VAT-registered business, normally within 30 days. For sales to the public you only need to if they ask."),
      ("Can I send a VAT invoice as a PDF?", "Yes. Electronic invoices are fine as long as your customer agrees and you keep a copy for your records."),
      ("What is the VAT rate in the UK?", "The standard rate is 20%. Some goods and services are 5% (reduced rate) or 0% (zero rate).")]),

    ("how-to-calculate-vat", "vat-calculator",
     "How to Calculate VAT at 20% – Add or Remove VAT (Simple Formulas) | etoolbox",
     "The two formulas for adding and removing 20% VAT, with worked examples, the common ÷1.2 mistake, and a free calculator.",
     "How to calculate VAT at 20% (add or remove it)",
     f"""<p>There are only two sums you'll ever need: adding VAT to a price, and taking VAT off a price that already includes it. Most mistakes come from using the wrong one.</p>
<h2>Adding 20% VAT</h2>
<p><strong>Price with VAT = price without VAT × 1.2</strong></p>
<p>Example: £250 + VAT = £250 × 1.2 = <strong>£300</strong>. The VAT is £50.</p>
<h2>Removing 20% VAT</h2>
<p><strong>Price without VAT = price with VAT ÷ 1.2</strong></p>
<p>Example: £300 including VAT ÷ 1.2 = <strong>£250</strong>. The VAT inside it is £300 − £250 = £50.</p>
<p>A quick way to find just the VAT in a price that includes it: divide by 6. £300 ÷ 6 = £50. This works because 20% VAT is one-sixth of the VAT-inclusive price.</p>
<h2>The common mistake</h2>
<p>Many people take 20% off a VAT-inclusive price: £300 − 20% = £240. That's wrong, because the VAT was 20% of £250, not of £300. Always divide by 1.2.</p>
<h2>Other VAT rates</h2>
<table class="sal-table"><thead><tr><th>Rate</th><th>Add VAT</th><th>Remove VAT</th><th>VAT in a gross price</th></tr></thead><tbody>
<tr><th>20% (standard)</th><td>× 1.2</td><td>÷ 1.2</td><td>÷ 6</td></tr>
<tr><th>5% (reduced)</th><td>× 1.05</td><td>÷ 1.05</td><td>÷ 21</td></tr>
<tr><th>0% (zero)</th><td colspan="3">No VAT to add or remove</td></tr></tbody></table>
<h2>Skip the maths</h2>
{cta("vat-calculator", "Add or remove VAT at 20%, 5% or any rate, and see the net, VAT and gross amounts instantly.")}
<p>Doing this for a whole invoice? The <a href="/invoice-generator/">invoice generator</a> works out the VAT line by line for you.</p>""",
     [("How do I work out 20% VAT on a calculator?", "To add VAT, multiply by 1.2. To remove VAT from a price that includes it, divide by 1.2."),
      ("How much VAT is in £100 including VAT?", "£16.67. £100 ÷ 1.2 = £83.33 before VAT, so the VAT is £16.67."),
      ("Is VAT 20% of the total price?", "No. It's 20% of the price before VAT, which works out to one-sixth (about 16.67%) of the price including VAT.")]),

    ("how-to-calculate-freelance-hourly-rate", "hourly-rate-calculator",
     "How to Calculate Your Freelance Hourly Rate (UK 2026) | etoolbox",
     "A simple 4-step method to set a freelance day or hourly rate that covers tax, holidays, expenses and unbilled time.",
     "How to work out your freelance hourly rate",
     f"""<p>The biggest mistake new freelancers make is taking their old salary and dividing it by 1,950 working hours. As a freelancer you pay your own holiday, sick days, pension and expenses, and you won't bill every hour you work. Here's a better way.</p>
<h2>Step 1: Decide what you want to earn</h2>
<p>Start with the yearly income you want before tax, the same as a salary. Then add what an employer would have paid on top: a typical workplace pension contribution is 3–5%, plus any training and kit they'd cover.</p>
<h2>Step 2: Add your business costs</h2>
<p>Add up a year of expenses: software, phone, insurance, accountant, equipment, travel, co-working and marketing. Many freelancers spend £2,000–£6,000 a year.</p>
<h2>Step 3: Work out your billable hours</h2>
<p>There are 52 weeks in a year. Take off holidays (say 5 weeks including bank holidays) and a week or two for illness and quiet spells, leaving about 45 weeks. Then be honest about how much of each week you actually bill: admin, sales and invoicing usually take 25–40% of your time. At 37.5 hours a week and 70% billable, that's about <strong>1,180 billable hours</strong> a year.</p>
<h2>Step 4: Divide</h2>
<p><strong>Hourly rate = (target income + costs) ÷ billable hours</strong></p>
<p>Example: (£45,000 + £4,000) ÷ 1,180 = <strong>£41.50 an hour</strong>, or about £310 a day. Compare that with £45,000 ÷ 1,950 = £23 an hour, which would leave you badly short.</p>
{cta("hourly-rate-calculator", "Enter your target income, costs, holidays and billable time and get your hourly and day rate.")}
<h2>Then sanity-check it</h2>
<ul><li>Look at what others in your field and area charge. Rate surveys, job boards and freelancer communities help.</li>
<li>If you're VAT-registered, add VAT on top of your rate.</li>
<li>Review your rate every year. Your costs and experience go up.</li></ul>
<p>Once you've agreed work, send a professional <a href="/quote-generator/">quote</a> and then an <a href="/invoice-generator/">invoice</a>.</p>""",
     [("What's a good day rate?", "It depends on your field and experience. Work out your minimum with the method above, then compare it with what others in your area charge."),
      ("How many billable hours should I plan for?", "Many freelancers plan for around 1,100–1,400 billable hours a year once holidays, sickness and admin are taken out."),
      ("Should I charge by the hour or by the project?", "Hourly is simplest at the start. As you get faster, fixed project prices usually earn you more for the same work.")]),

    ("how-to-reduce-pdf-size-for-email", "compress-pdf",
     "How to Reduce a PDF File Size for Email (Gmail & Outlook Limits) | etoolbox",
     "Why your PDF is too big to email, the real Gmail and Outlook limits, and 4 ways to make it smaller without losing readability.",
     "How to reduce a PDF's size so you can email it",
     f"""<p>“Attachment too large” usually means a PDF full of photos or scanned pages. Here's how big is too big, and how to fix it.</p>
<h2>How big can an email attachment be?</h2>
<ul><li><strong>Gmail:</strong> 25 MB in total per email.</li>
<li><strong>Outlook:</strong> 20 MB for many accounts; work Exchange accounts are often 10 MB.</li>
<li><strong>The hidden catch:</strong> email encoding makes files about a third bigger in transit, so a 20 MB PDF can bounce from a 25 MB limit.</li></ul>
<p>To be safe, aim for <strong>under 10 MB</strong>, especially when you don't know your recipient's email system.</p>
<h2>Why PDFs get so big</h2>
<p>Text takes almost no space. Large PDFs are nearly always caused by high-resolution images: phone photos, scans saved at 600 dpi, or slides with big pictures. Shrinking those images is what brings the size down.</p>
<h2>4 ways to make it smaller</h2>
<ol><li><strong>Compress it.</strong> Our <a href="/compress-pdf/">PDF compressor</a> shrinks the images inside your PDF. Try “Recommended” first, and “Strong” if it's still too big. Scans often drop by 70–90%.</li>
<li><strong>Remove pages you don't need</strong> with <a href="/split-pdf/">Split PDF</a>, keeping only the relevant pages.</li>
<li><strong>Send it in parts.</strong> Split a long document into two emails.</li>
<li><strong>Rescan at a lower setting.</strong> 150–200 dpi in greyscale is plenty for most documents.</li></ol>
{cta("compress-pdf", "Shrink PDFs in your browser: the file is never uploaded, so it's safe for contracts and ID.")}
<h2>Still too big?</h2>
<p>Share it with a link instead: Gmail offers Google Drive and Outlook offers OneDrive for large files. Check who can open the link before you send it.</p>""",
     [("Will compressing a PDF make the text blurry?", "No. Text stays sharp because it isn't an image. Only photos and scanned pages are reduced, and “Recommended” keeps them easy to read."),
      ("Is it safe to compress private documents?", "With etoolbox, yes: the PDF is processed on your own device and never uploaded."),
      ("What's the best size for email?", "Under 10 MB is safe for almost everyone. Under 20 MB usually works for Gmail-to-Gmail.")]),

    ("how-to-make-a-qr-code-for-your-business", "qr-code-generator",
     "How to Make a QR Code for Your Business (Free, No Expiry) | etoolbox",
     "Where QR codes help a small business, how to make one free that never expires, and the printing mistakes to avoid.",
     "How to make a QR code for your business",
     f"""<p>A QR code turns a printed sign, card or flyer into a one-tap link. They're free to make, and if you choose the right type they never expire.</p>
<h2>Good places to use one</h2>
<ul><li><strong>Menus and table cards:</strong> link to your online menu. See the <a href="/menu-qr-code-generator/">menu QR code generator</a>, which also makes a printable table card.</li>
<li><strong>Wi-Fi:</strong> guests scan to join without typing the password, with the <a href="/wifi-qr-code-generator/">Wi-Fi QR code</a>.</li>
<li><strong>Business cards:</strong> a <a href="/vcard-qr-code-generator/">vCard QR code</a> saves your details straight to their contacts.</li>
<li><strong>Reviews:</strong> link straight to your Google review page on receipts and the counter.</li>
<li><strong>WhatsApp:</strong> start a chat with you in one tap, using the <a href="/whatsapp-qr-code-generator/">WhatsApp QR code</a>.</li></ul>
<h2>Static or dynamic?</h2>
<p>A <strong>static</strong> QR code stores the link itself. It works forever and needs no account, but if the link changes you have to reprint it. A <strong>dynamic</strong> code points to a short link you can change later and track scans, which usually needs a subscription. For most small businesses a static code pointing at a page you control (like your own website) is all you need.</p>
<p>Be careful with “free” QR sites that quietly make dynamic codes, then stop them working unless you pay. etoolbox codes are static, so they never expire.</p>
<h2>How to make one</h2>
<ol><li>Open the <a href="/qr-code-generator/">QR code generator</a> and paste your link.</li>
<li>Pick colours if you like, keeping a dark code on a light background.</li>
<li>Download the PNG for screens, or SVG for print. SVG stays sharp at any size.</li></ol>
{cta("qr-code-generator", "Free static QR codes that never expire. PNG and SVG, no sign-up.")}
<h2>Printing tips</h2>
<ul><li>Print it at least <strong>2 × 2 cm</strong>, bigger if people will scan from a distance (roughly 1 cm of code per 10 cm of distance).</li>
<li>Leave a clear margin (the “quiet zone”) around it.</li>
<li>Always scan a test print with two different phones before printing hundreds.</li>
<li>Add a short label such as “Scan for our menu”, so people know what they'll get.</li></ul>""",
     [("Do free QR codes expire?", "Static QR codes never expire. Codes from sites that use a redirect (dynamic codes) can stop working if you stop paying."),
      ("Can I change the link later?", "Not with a static code. Point it at a page you control, like your website, and change that page instead."),
      ("What size should a QR code be?", "At least 2 × 2 cm for close scanning, and larger for posters or windows. Allow about 1 cm of code for every 10 cm of scanning distance.")]),
]

for slug, tool, title, desc, h1, body, faqs in GUIDES:
    path = f"/guides/{slug}/"
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": html.unescape(h1), "description": desc,
          "datePublished": GUIDE_DATE, "dateModified": GUIDE_DATE, "mainEntityOfPage": SITE + path,
          "author": {"@type": "Organization", "name": "etoolbox", "url": SITE + "/"},
          "publisher": {"@type": "Organization", "name": "etoolbox", "logo": {"@type": "ImageObject", "url": SITE + "/assets/og.png"}}}
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"},
        {"@type": "ListItem", "position": 3, "name": html.unescape(h1), "item": SITE + path}]}
    others = "".join(f'<li><a href="/guides/{g[0]}/">{g[4]}</a></li>' for g in GUIDES if g[0] != slug)
    write(path, head(title, desc, path, faq_ld(faqs) + f'<script type="application/ld+json">{json.dumps(ld)}</script>\n<script type="application/ld+json">{json.dumps(bc)}</script>\n') + f"""
<div class="wrap guide">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/guides/">Guides</a><span aria-hidden="true">›</span><span aria-current="page">{h1}</span></nav>
  <article class="prose guide-body">
    <h1>{h1}</h1>
    <p class="guide-meta">Updated 6 November 2026 · etoolbox guides</p>
    {body}
  </article>
  {share_bar(path, html.unescape(h1))}
  {faq_html(faqs)}
  <section class="prose"><h2>More guides</h2><ul>{others}</ul></section>
</div>
""" + foot(()))

_cards = "".join(f'<a class="guide-card" href="/guides/{g[0]}/">{tool_icon(g[1])}<strong>{g[4]}</strong><span>{g[3]}</span></a>' for g in GUIDES)
write("/guides/", head("Guides – UK Invoices, VAT, PDFs & QR Codes Explained | etoolbox",
      "Plain-English how-to guides for UK small businesses and freelancers: VAT invoices, VAT sums, hourly rates, PDF sizes and QR codes.", "/guides/") + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Guides</span></nav>
  <div class="page-head"><h1>Guides</h1><p>Short, plain-English answers to everyday business questions, each with a free tool to get it done.</p></div>
  <div class="guide-grid">{_cards}</div>
</div>
""" + foot(()))

EXTRA_PATHS = EXTRA_PATHS + ["/guides/"] + [f"/guides/{g[0]}/" for g in GUIDES]
