# ---------------- Calculators ----------------

MONEY_CALCS = {"vat", "margin", "hourly", "takehome", "mileage", "loan", "mortgage", "compound", "discount"}


def calc_ui(kind, fields):
    note = "Calculated on your device. Figures are rounded to the nearest penny." if kind in MONEY_CALCS else "Calculated instantly on your device. Nothing is sent anywhere."
    return f"""
  <div class="gen">
    <form class="panel" data-calc="{kind}" autocomplete="off" novalidate>{fields}</form>
    <div class="panel preview"><div id="calc-out" class="calc-out" aria-live="polite"></div>
      <p class="note">{note}</p></div>
  </div>"""


def seg(name, options, checked):
    return '<div class="seg" role="radiogroup">' + "".join(
        f'<label><input type="radio" name="{name}" value="{v}"{" checked" if v == checked else ""}><span>{t}</span></label>' for v, t in options) + "</div>"


tool_page("vat-calculator",
    "VAT Calculator UK – Add or Remove 20% VAT | etoolbox",
    "UK VAT calculator",
    "Add VAT to a price or work out how much VAT is included. It covers the 20% standard rate, the 5% reduced rate, or any rate you choose.",
    calc_ui("vat", f"""
<label>What do you want to do?</label>
{seg("mode", [("add", "Add VAT"), ("remove", "Remove VAT")], "add")}
<label for="amount">Amount (£)</label>
<input type="text" id="amount" name="amount" inputmode="decimal" placeholder="e.g. 100">
<label>VAT rate</label>
{seg("rate", [("20", "20% standard"), ("5", "5% reduced"), ("0", "0% zero"), ("custom", "Other")], "20")}
<div data-show-when="rate=custom"><label for="custom">Custom rate (%)</label><input type="text" id="custom" name="custom" inputmode="decimal" placeholder="e.g. 12.5"></div>"""),
    """<h2>How to work out VAT</h2>
<ul><li><strong>Adding 20% VAT:</strong> multiply the net price by 1.2. For example, £100 + VAT = £120.</li>
<li><strong>Removing 20% VAT:</strong> divide the gross price by 1.2. For example, £120 including VAT is £100 net, with £20 of VAT.</li>
<li><strong>Common mistake:</strong> taking 20% off a VAT-inclusive price gives the wrong answer. To find the VAT in a gross price, divide by 6, not 5.</li></ul>
<h2>UK VAT rates</h2>
<p>Most goods and services use the standard rate of 20%. Some, such as domestic energy and children's car seats, use the reduced 5% rate. Others, including most food and children's clothes, are zero-rated. Check GOV.UK for the rate that applies to what you sell.</p>""",
    [("How do I calculate 20% VAT?", "To add VAT, multiply by 1.2. To find the VAT inside a VAT-inclusive price, divide the price by 6. To get the price without VAT, divide by 1.2."),
     ("When do I have to register for VAT?", "You must register when your VAT-taxable turnover goes over the registration threshold set by HMRC. Check GOV.UK for the current figure."),
     ("Is this calculator accurate?", "Yes. It works to the penny and rounds the final figures to 2 decimal places, as invoices do.")],
    ("calc.js",))

tool_page("profit-margin-calculator",
    "Profit Margin Calculator – Margin, Markup & Selling Price | etoolbox",
    "Profit margin &amp; markup calculator",
    "Find your profit margin and markup, or work out what to charge to hit a target margin. It's built for shops, makers and resellers.",
    calc_ui("margin", f"""
<label>What do you want to find?</label>
{seg("mode", [("find", "My margin"), ("margin", "Price for a margin"), ("markup", "Price for a markup")], "find")}
<label for="cost">Cost price (£)</label>
<input type="text" id="cost" name="cost" inputmode="decimal" placeholder="What it costs you, e.g. 6">
<div data-show-when="mode=find"><label for="price">Selling price (£)</label><input type="text" id="price" name="price" inputmode="decimal" placeholder="e.g. 10"></div>
<div data-show-when="mode=margin|markup"><label for="target">Target (%)</label><input type="text" id="target" name="target" inputmode="decimal" placeholder="e.g. 40"></div>"""),
    """<h2>Margin vs markup</h2>
<p><strong>Margin</strong> is profit as a percentage of the <em>selling price</em>. <strong>Markup</strong> is profit as a percentage of the <em>cost</em>. Something that costs £6 and sells for £10 makes £4 profit. That's a 40% margin and a 66.67% markup.</p>
<h2>Formulas</h2>
<ul><li>Margin = (price − cost) ÷ price × 100</li><li>Markup = (price − cost) ÷ cost × 100</li><li>Price for a target margin = cost ÷ (1 − margin)</li></ul>
<p>Tip: if you're VAT registered, use prices <em>without</em> VAT, because the VAT isn't your money.</p>""",
    [("What's a good profit margin?", "It varies widely by sector. Food and retail often run on thin margins, while services and digital products can be much higher. Compare yourself with businesses like yours."),
     ("Why can't the margin be 100% or more?", "Margin is a share of the selling price, so even with zero cost it can only approach 100%. Markup, however, can be any size.")],
    ("calc.js",))

tool_page("hourly-rate-calculator",
    "Freelance Hourly Rate Calculator UK | etoolbox",
    "Freelance hourly rate calculator",
    "Work out the hourly and day rate you need to charge to earn your target income. It allows for holidays, sick days, business costs and non-billable time.",
    calc_ui("hourly", """
<label for="income">Yearly income you want (£, before tax)</label>
<input type="text" id="income" name="income" inputmode="decimal" placeholder="e.g. 40000">
<label for="expenses">Yearly business costs (£)</label>
<input type="text" id="expenses" name="expenses" inputmode="decimal" placeholder="Software, equipment, insurance, travel…" value="">
<div class="row">
  <div><label for="weeksoff">Weeks off per year</label><input type="number" id="weeksoff" name="weeksoff" min="0" max="51" value="7"><p class="hint">Holidays, bank holidays and sick days</p></div>
  <div><label for="hours">Billable hours per week</label><input type="number" id="hours" name="hours" min="1" max="80" value="25"><p class="hint">Hours you can charge for</p></div>
</div>"""),
    """<h2>Why your rate is higher than an employee's</h2>
<p>As a freelancer you don't get paid for holidays, sick days, admin, marketing or time spent finding clients. You also pay your own equipment, software and insurance costs. Most freelancers can only bill 20–30 hours in a typical week.</p>
<h2>How it's calculated</h2>
<p>Hourly rate = (target income + business costs) ÷ (working weeks × billable hours per week).</p>
<p>The income you enter is before tax. Remember to set aside money for Income Tax and National Insurance, and for a pension.</p>""",
    [("What should I enter for billable hours?", "Use only the hours you can actually charge to clients. 20–30 hours a week is common once you allow for admin, emails and finding work."),
     ("Should I charge by the hour or by the day?", "Day rates or fixed project prices often work better for both sides. Use the hourly figure as your minimum and build your quotes from it.")],
    ("calc.js",))

tool_page("percentage-calculator",
    "Percentage Calculator – % of a Number, % Change | etoolbox",
    "Percentage calculator",
    "Work out a percentage of a number, what percentage one number is of another, or the percentage increase or decrease between two numbers.",
    calc_ui("percent", f"""
<label>Calculation</label>
{seg("mode", [("of", "X% of Y"), ("is", "X is what % of Y"), ("change", "% change X → Y")], "of")}
<div class="row">
  <div><label for="a">X</label><input type="text" id="a" name="a" inputmode="decimal" placeholder="e.g. 15"></div>
  <div><label for="b">Y</label><input type="text" id="b" name="b" inputmode="decimal" placeholder="e.g. 240"></div>
</div>"""),
    """<h2>Examples</h2>
<ul><li><strong>15% of 240</strong> = 36. That's handy for discounts and tips.</li>
<li><strong>36 is what % of 240?</strong> 15%.</li>
<li><strong>Change from 200 to 250</strong> = +25%. That's useful for comparing sales month to month.</li></ul>""",
    [("How do I work out a percentage increase?", "Subtract the old value from the new value, divide by the old value and multiply by 100."),
     ("How do I take a percentage off a price?", "Multiply the price by (100 − discount) ÷ 100. For example, 20% off £50 is £50 × 0.8 = £40.")],
    ("calc.js",))

# ---------------- Invoice & quote ----------------

def doc_ui(kind):
    is_q = kind == "quote"
    return f"""
  <div class="inv">
    <form class="panel" data-doc="{kind}" autocomplete="on" novalidate>
      <fieldset><legend>Your business</legend>
        <label for="bizname">Business name</label><input type="text" id="bizname" name="bizname" autocomplete="organization">
        <label for="bizaddress">Address</label><textarea id="bizaddress" name="bizaddress" rows="3" style="min-height:70px"></textarea>
        <div class="row">
          <div><label for="bizemail">Email</label><input type="email" id="bizemail" name="bizemail" autocomplete="email"></div>
          <div><label for="bizphone">Phone</label><input type="tel" id="bizphone" name="bizphone" autocomplete="tel"></div>
        </div>
        <label for="vatno">VAT number <span class="hint">(only if VAT registered)</span></label><input type="text" id="vatno" name="vatno">
        <label>Company logo <span class="badge pro">PRO</span></label>
        <div class="btn-row" style="margin-top:0;align-items:center"><label class="btn secondary small" for="logo-file" style="margin:0">⬆ Upload logo<input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only"></label>
          <button type="button" class="btn secondary small" id="logo-remove" hidden>Remove</button>
          <label class="check" style="margin:0">Size <select id="logosize" name="logosize" style="width:auto;padding:6px 8px"><option value="s">Small</option><option value="m" selected>Medium</option><option value="l">Large</option></select></label></div>
        <p id="logo-msg" class="hint" role="status" style="margin:6px 0 0"></p>
        <p id="logo-pro-note" class="hint" hidden style="margin:4px 0 0">Try it in the preview for free. <a href="/pricing/">Pro</a> lets you download {kind}s with your logo.</p>
      </fieldset>
      <fieldset><legend>Currency</legend>
        <div class="row"><div><label for="currency" style="margin-top:0">{"Quote" if is_q else "Invoice"} currency</label><select id="currency" name="currency"></select></div>
        <div><label for="cur2" style="margin-top:0">Also show total in</label><select id="cur2" name="cur2"></select></div></div>
        <div id="rate-row" hidden><label for="rate2">Exchange rate <span class="hint" id="rate-note"></span></label><input type="text" id="rate2" name="rate2" inputmode="decimal" placeholder="e.g. 1.1650"></div>
      </fieldset>
      <fieldset><legend>{"Customer" if is_q else "Bill to"}</legend>
        <label for="client">Customer name</label><input type="text" id="client" name="client" autocomplete="off">
        <label for="clientaddress">Customer address</label><textarea id="clientaddress" name="clientaddress" rows="3" style="min-height:70px" autocomplete="off"></textarea>
      </fieldset>
      <fieldset><legend>{"Quote" if is_q else "Invoice"} details</legend>
        <div class="row">
          <div><label for="number">{"Quote" if is_q else "Invoice"} number</label><input type="text" id="number" name="number"></div>
          <div><label for="date">Date</label><input type="date" id="date" name="date"></div>
        </div>
        <label for="due">{"Valid until" if is_q else "Payment due"}</label><input type="date" id="due" name="due">
        <label for="doctitle">Document heading <span class="badge pro">PRO</span></label>
        <input type="text" id="doctitle" name="doctitle" list="doctitle-list" maxlength="40" placeholder="{"QUOTE" if is_q else "INVOICE"}" autocomplete="off">
        <datalist id="doctitle-list">{"".join(f'<option value="{t}">' for t in (["Quote", "Quotation", "Estimate", "Proposal"] if is_q else ["Invoice", "Tax invoice", "Pro forma invoice", "Receipt", "Bill", "Credit note", "Statement"]))}</datalist>
        <p id="title-pro-note" class="hint" hidden style="margin:4px 0 0">Try it in the preview for free. <a href="/pricing/">Pro</a> lets you download with your own heading.</p>
      </fieldset>
      <fieldset><legend>Items</legend>
        <table class="items-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Price</th><th>VAT</th><th></th></tr></thead><tbody id="items"></tbody></table>
        <button type="button" class="btn secondary small" id="add-row" style="margin-top:8px">+ Add line</button>
      </fieldset>
      <fieldset><legend>{"Terms" if is_q else "Payment details"}</legend>
        <textarea id="payment" name="payment" rows="3" style="min-height:70px" placeholder="{"e.g. 50% deposit to book. Price includes materials and labour." if is_q else "e.g. Bank transfer to: Account name, Sort code 00-00-00, Account no. 12345678"}"></textarea>
        <label for="notes">Notes <span class="hint">(optional)</span></label><textarea id="notes" name="notes" rows="2" style="min-height:56px" placeholder="Thank you for your business!"></textarea>
      </fieldset>
      <div class="btn-row">
        <button type="button" class="btn" id="print-doc">Download PDF / Print</button>
        <button type="button" class="btn secondary" id="clear-doc">New {kind} (keep my details)</button>
      </div>
      <p class="hint" style="margin-top:10px">To save as a PDF, choose <strong>Save as PDF</strong> as the printer. Your business details are remembered on this device only.</p>
    </form>
    <div class="doc-wrap"><div class="doc" id="doc" aria-label="{kind} preview"></div></div>
  </div>
  <div class="modal" id="pro-modal" hidden role="dialog" aria-modal="true" aria-labelledby="pro-title"><div class="modal-box">
    <button type="button" class="modal-x" data-close aria-label="Close">×</button>
    <h3 id="pro-title" style="margin-top:0">That's a Pro feature ⭐</h3>
    <p>Put your logo and your own heading (like “Tax invoice” or “Receipt”) on every {kind}. Pro also includes dynamic QR codes, scan stats and unbranded table cards.</p>
    <label for="pro-key">Have a Pro key?</label><div class="row" style="grid-template-columns:1fr auto"><input type="text" id="pro-key" placeholder="ETB-XXXX-XXXX-XXXX-XXXX" autocomplete="off"><button type="button" class="btn" id="pro-activate">Unlock</button></div>
    <p id="pro-msg" class="muted" role="status"></p>
    <div class="btn-row"><a class="btn secondary" href="/pricing/">See Pro plans</a><button type="button" class="btn secondary" id="pro-nologo">Download the free version</button></div>
  </div></div>"""


tool_page("invoice-generator",
    "Free Invoice Generator UK – Make a PDF Invoice | etoolbox",
    "Free invoice generator",
    "Make a professional invoice in minutes, with VAT, payment details and automatic numbering. Download it as a PDF. There's no sign-up and no watermark.",
    doc_ui("invoice"),
    """<h2>What a UK invoice must include</h2>
<ul><li>A unique invoice number (we number them for you: INV-0001, INV-0002…)</li>
<li>Your business name and address, plus the customer's name and address</li>
<li>The invoice date, plus a clear description of what you supplied and when</li>
<li>The amount owed. If you're VAT registered, also show your VAT number and the VAT for each rate</li></ul>
<p>Check GOV.UK for the full rules, especially if you're a limited company or VAT registered.</p>
<h2>Get paid faster</h2>
<ul><li>Put your bank details on every invoice.</li><li>Set a clear due date; 14 or 30 days is common.</li><li>Send the invoice as soon as the work is done.</li></ul>""",
    [("Is this invoice generator really free?", "Yes. You can make unlimited invoices with no watermark and no sign-up."),
     ("Where is my data stored?", "Only in your browser on this device. Your business details are remembered so you don't retype them. Nothing is uploaded to us."),
     ("How do I save it as a PDF?", "Click 'Download PDF / Print' and choose 'Save as PDF' as the printer. On a phone, use the share or print option."),
     ("I'm not VAT registered. What do I choose?", "Set each line's VAT to 'No VAT'. The VAT column then disappears from the invoice."),
     ("Can I charge by the hour or day?", "Yes. Pick a unit for each line (hour, day, week, month, item and more). The invoice then shows, for example, '8 hours × £45.00 / hr'."),
     ("Can I invoice in euros or dollars?", "Yes. Choose from about 40 currencies. You can also show the total in a second currency, such as pounds, using today's European Central Bank rate or a rate you enter."),
     ("Can I add my logo?", "Yes, with Pro. You can try your logo in the preview for free.")],
    ("invoice.js",))

tool_page("quote-generator",
    "Free Quote & Estimate Generator UK – PDF Quotes | etoolbox",
    "Free quote generator",
    "Create a clear, professional quote or estimate for your customers, with VAT, terms and an expiry date. Download it as a PDF. It's free with no sign-up.",
    doc_ui("quote"),
    """<h2>Quote vs estimate</h2>
<p>A <strong>quote</strong> is a fixed price for the job. An <strong>estimate</strong> is your best guess and can change. Make clear which one you're giving, and say what's included and excluded.</p>
<h2>Tips for winning more work</h2>
<ul><li>Break the price into clear lines (labour, materials, extras).</li>
<li>Add a 'valid until' date so prices don't drift.</li>
<li>State your deposit and payment terms up front.</li></ul>""",
    [("Can I turn a quote into an invoice?", "Your business details carry across. Open the invoice generator and they'll already be filled in, so you only need to add the items."),
     ("Is my quote saved?", "Your business details are saved in this browser. Download a PDF of each quote to keep a record.")],
    ("invoice.js",))

# ---------------- Image tools ----------------

def img_ui(mode, opts_html):
    return f"""
  <div class="gen">
    <form class="panel" data-img="{mode}" novalidate>
      <label class="drop" id="drop" for="img-input"><strong>Choose images or drop them here</strong><span class="muted">JPG, PNG or WebP · up to 30 at a time · nothing is uploaded</span>
        <input type="file" id="img-input" accept="image/jpeg,image/png,image/webp" multiple class="sr-only"></label>
      {opts_html}
    </form>
    <div class="panel"><h3 style="margin:0">Results</h3><ul class="img-results" id="img-results"><li class="muted">Your processed images will appear here.</li></ul>
      <button type="button" class="btn" id="dl-all" hidden style="margin-top:12px">Download all</button></div>
  </div>"""


QUALITY = """<div data-show-when="format=same|jpeg|webp"><label for="quality">Quality <span class="hint" id="q-val"></span></label>
<input type="range" id="quality" name="quality" min="10" max="100" value="{q}"></div>"""

tool_page("image-compressor",
    "Free Image Compressor – Reduce JPG, PNG & WebP Size | etoolbox",
    "Image compressor",
    "Make photos smaller so your website loads faster and emails send easily. Your images are compressed in your browser and never uploaded.",
    img_ui("compress", f"""
<label for="format">Output format</label>
<select id="format" name="format"><option value="same">Same as original (PNG becomes JPG)</option><option value="webp">WebP (smallest)</option><option value="jpeg">JPG</option></select>
{QUALITY.format(q=75)}
<label for="width">Max width (px) <span class="hint">(optional; shrinking huge photos saves the most)</span></label>
<input type="number" id="width" name="width" min="1" placeholder="e.g. 1600">
<input type="hidden" name="resizeby" value="pixels">"""),
    """<h2>How much can I save?</h2>
<p>Phone photos are often 3–5 MB. Resizing them to 1600 px wide at 75% quality usually brings them under 300 KB with no difference you can see on screen. That makes a big difference to how fast your website loads.</p>
<h2>Which format should I use?</h2>
<ul><li><strong>WebP:</strong> the smallest files, supported by all modern browsers. Best for websites.</li><li><strong>JPG:</strong> works everywhere. Best for photos you'll email or print.</li><li><strong>PNG:</strong> for logos and graphics with transparency (use the converter).</li></ul>""",
    [("Are my images uploaded?", "No. Compression happens entirely in your browser, so your photos never leave your device."),
     ("Why is the file sometimes bigger?", "Some images are already well compressed. If we can't make the file smaller without resizing, we keep your original.")],
    ("image.js",))

tool_page("image-resizer",
    "Free Image Resizer – Resize Photos Online | etoolbox",
    "Image resizer",
    "Resize photos to exact pixel sizes or by percentage, for websites, social media, eBay, Etsy or email. It's free, fast and private.",
    img_ui("resize", f"""
<label>Resize by</label>
{seg("resizeby", [("pixels", "Pixels"), ("percent", "Percentage")], "pixels")}
<div data-show-when="resizeby=pixels"><div class="row">
  <div><label for="width">Width (px)</label><input type="number" id="width" name="width" min="1" placeholder="e.g. 1080"></div>
  <div><label for="height">Height (px)</label><input type="number" id="height" name="height" min="1" placeholder="auto"></div>
</div><label class="check" style="margin-top:10px"><input type="checkbox" name="keepratio" checked> Keep proportions (fit inside)</label></div>
<div data-show-when="resizeby=percent"><label for="percent">Percentage</label><input type="number" id="percent" name="percent" min="1" max="400" value="50"></div>
<label for="format">Output format</label>
<select id="format" name="format"><option value="same">Same as original</option><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select>
{QUALITY.format(q=90)}"""),
    """<h2>Popular sizes</h2>
<ul><li><strong>Instagram post:</strong> 1080 × 1080 (square) or 1080 × 1350 (portrait)</li>
<li><strong>Facebook cover:</strong> 851 × 315</li><li><strong>Website hero image:</strong> 1600–2000 wide</li>
<li><strong>Product photos:</strong> 1200–2000 on the longest side</li></ul>
<p>Platforms change their recommended sizes from time to time, so check their help pages for the latest.</p>""",
    [("Will resizing reduce quality?", "Making images smaller keeps them sharp. Making them much bigger than the original will look blurry."),
     ("Can I resize lots of images at once?", "Yes. Select up to 30 images and they'll all be resized with the same settings.")],
    ("image.js",))

tool_page("image-converter",
    "Free Image Converter – PNG to JPG, JPG to WebP & more | etoolbox",
    "Image converter",
    "Convert images between JPG, PNG and WebP: PNG to JPG, JPG to PNG, WebP to JPG and more. Conversion happens in your browser, so nothing is uploaded.",
    img_ui("convert", f"""
<label>Convert to</label>
{seg("format", [("jpeg", "JPG"), ("png", "PNG"), ("webp", "WebP")], "jpeg")}
{QUALITY.format(q=90)}
<div data-show-when="format=jpeg"><label class="check" style="margin-top:12px">Background for transparent areas <input type="color" name="bg" value="#ffffff"></label></div>
<input type="hidden" name="resizeby" value="pixels">"""),
    """<h2>When to use each format</h2>
<ul><li><strong>JPG:</strong> photos. Small files that work everywhere, but no transparency.</li>
<li><strong>PNG:</strong> logos, screenshots and graphics. Supports transparency, but files are larger.</li>
<li><strong>WebP:</strong> websites. Small files, with transparency support.</li></ul>""",
    [("Can I convert WebP to JPG?", "Yes. Choose JPG and select your WebP files."),
     ("What happens to transparent backgrounds when converting to JPG?", "JPG doesn't support transparency, so transparent areas are filled with the background colour you choose (white by default).")],
    ("image.js",))

# ---------------- Text tools ----------------

tool_page("word-counter",
    "Word Counter – Count Words & Characters Online | etoolbox",
    "Word counter",
    "Count words, characters, sentences and paragraphs as you type, with reading and speaking time. It's great for essays, ads, bios and social posts.",
    """<div class="panel" data-text="counter"><label for="wc-text" class="sr-only">Your text</label>
  <textarea id="wc-text" class="big-text" placeholder="Type or paste your text here…"></textarea>
  <div class="stats" id="stats" aria-live="polite"></div></div>""",
    """<h2>Common limits</h2>
<ul><li>Google Business Profile description: 750 characters</li><li>Instagram bio: 150 characters</li>
<li>Meta description (for Google results): about 150–160 characters</li><li>X (Twitter) post: 280 characters (standard accounts)</li></ul>
<p>Platforms change their limits from time to time, so check before you publish.</p>""",
    [("Is my text saved or uploaded?", "No. Counting happens in your browser and nothing is stored."),
     ("How is reading time worked out?", "It's based on an average adult reading speed of about 238 words per minute and a speaking speed of 150 words per minute.")],
    ("text.js",))

tool_page("case-converter",
    "Case Converter – UPPER, lower, Title & Sentence Case | etoolbox",
    "Case converter",
    "Change text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case or kebab-case in one click.",
    """<div class="panel" data-text="case"><label for="cc-text" class="sr-only">Your text</label>
  <textarea id="cc-text" class="big-text" placeholder="Type or paste your text here…"></textarea>
  <div class="btn-row">
    <button type="button" class="btn secondary small" data-case="sentence">Sentence case</button>
    <button type="button" class="btn secondary small" data-case="title">Title Case</button>
    <button type="button" class="btn secondary small" data-case="upper">UPPERCASE</button>
    <button type="button" class="btn secondary small" data-case="lower">lowercase</button>
    <button type="button" class="btn secondary small" data-case="camel">camelCase</button>
    <button type="button" class="btn secondary small" data-case="snake">snake_case</button>
    <button type="button" class="btn secondary small" data-case="kebab">kebab-case</button>
    <button type="button" class="btn secondary small" data-case="alternating">aLtErNaTiNg</button>
  </div>
  <div class="btn-row"><button type="button" class="btn small" id="copy-text">Copy text</button><button type="button" class="btn secondary small" id="clear-text">Clear</button></div></div>""",
    """<h2>When to use each</h2>
<ul><li><strong>Sentence case:</strong> fixes text typed with Caps Lock on.</li><li><strong>Title Case:</strong> headings, product names and blog titles. Small words like 'and' and 'of' stay lowercase.</li>
<li><strong>kebab-case:</strong> web addresses (slugs), such as /summer-sale-2026.</li></ul>""",
    [("Does it work with accents?", "Yes. Letters like é, ü and ñ are converted correctly."),
     ("Is my text stored?", "No. Everything happens in your browser.")],
    ("text.js",))

tool_page("password-generator",
    "Strong Password Generator – Random & Secure | etoolbox",
    "Password generator",
    "Create strong, random passwords using your device's secure random generator. Passwords are made on your device and never sent anywhere.",
    """<div class="gen"><form class="panel" data-text="password" novalidate>
  <label for="pwlen">Length: <span id="len-val"></span> characters</label>
  <input type="range" id="pwlen" name="pwlen" min="8" max="64" value="20">
  <label class="check"><input type="checkbox" name="lower" checked> Lowercase (a–z)</label>
  <label class="check"><input type="checkbox" name="upper" checked> Uppercase (A–Z)</label>
  <label class="check"><input type="checkbox" name="digits" checked> Numbers (0–9)</label>
  <label class="check"><input type="checkbox" name="symbols" checked> Symbols (!@#…)</label>
  <label class="check"><input type="checkbox" name="noambig"> Avoid look-alikes (I, l, 1, O, 0)</label>
</form>
<div class="panel preview"><label for="pw-out" class="sr-only">Generated password</label>
  <input type="text" id="pw-out" class="pw-out" readonly>
  <p id="pw-meta" class="note" aria-live="polite"></p>
  <div class="actions"><button type="button" class="btn" id="pw-copy">Copy</button><button type="button" class="btn secondary" id="pw-new">New password</button></div>
  <p class="note">Use a password manager to store your passwords safely.</p></div></div>""",
    """<h2>What makes a strong password?</h2>
<ul><li><strong>Length matters most.</strong> Aim for 16 or more characters.</li><li>Use a different password for every account, especially email and banking.</li>
<li>Turn on two-step verification wherever you can.</li><li>The UK's National Cyber Security Centre also recommends 'three random words' for passwords you need to remember.</li></ul>""",
    [("Is it safe to generate a password online?", "This generator runs only on your device using its built-in secure random number generator. The password is never sent over the internet."),
     ("What does 'bits' mean?", "Bits measure how hard a password is to guess. Each extra bit doubles the guesses needed. Over 70 bits is strong.")],
    ("text.js",))
