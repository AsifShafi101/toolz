# ---------------- PDF tools ----------------

PDF_SCRIPTS = ("vendor/pdf-lib.min.js", "pdftools.js")


def pdf_ui(mode, accept_images=False, multiple=False, opts="", button="Process"):
    acc = "image/jpeg,image/png,image/webp" if accept_images else "application/pdf,.pdf"
    what = "images" if accept_images else ("PDFs" if multiple else "a PDF")
    sub = "JPG, PNG or WebP" if accept_images else "PDF files"
    return f"""
  <div class="gen">
    <form class="panel" data-pdf="{mode}" novalidate>
      <label class="drop" id="drop" for="pdf-input"><strong>Choose {what} or drop {'them' if multiple else 'it'} here</strong><span class="muted">{sub} · processed on your device, never uploaded</span>
        <input type="file" id="pdf-input" accept="{acc}"{' multiple' if multiple else ''} class="sr-only"></label>
      <ul class="file-list" id="file-list"></ul>
      {opts}
      <div class="run-row"><button type="button" class="btn" id="run" disabled>{button}</button><span id="pdf-msg" class="warn" role="status"></span></div>
    </form>
    <div class="panel"><h3 style="margin:0 0 4px">Result</h3><div id="pdf-out" aria-live="polite"><p class="muted">Your file will appear here, ready to download.</p></div></div>
  </div>"""


PDF_PRIVACY = "<h2>Private by design</h2><p>Most PDF websites upload your files to their servers. etoolbox processes them <strong>in your browser</strong>, so contracts, invoices and ID documents never leave your device.</p>"

tool_page("merge-pdf", "Merge PDF – Combine PDF Files Free, No Upload | etoolbox", "Merge PDF files",
    "Combine several PDFs into one document in the order you choose. It's free, needs no sign-up, and your files never leave your device.",
    pdf_ui("merge", multiple=True, button="Merge PDFs"),
    """<h2>How to merge PDFs</h2><ol><li>Choose two or more PDF files (or drag them in).</li><li>Use the ↑ ↓ arrows to put them in order.</li><li>Click <strong>Merge PDFs</strong> and download the combined file.</li></ol>""" + PDF_PRIVACY,
    [("Is there a file size limit?", "There's no fixed limit. Very large files (hundreds of MB) depend on your device's memory."),
     ("Can I merge password-protected PDFs?", "Not yet. Remove the password first, then merge.")], PDF_SCRIPTS)

tool_page("split-pdf", "Split PDF – Extract or Remove Pages Free | etoolbox", "Split PDF",
    "Extract the pages you need, delete pages you don't, or split a PDF into separate files. It's free and private, because everything happens in your browser.",
    pdf_ui("split", button="Split PDF", opts=f"""
<label>What do you want to do?</label>
{seg("splitmode", [("extract", "Extract pages"), ("remove", "Remove pages"), ("every", "Split into files")], "extract")}
<div data-show-when="splitmode=extract|remove"><label for="pages">Pages <span class="hint">(e.g. 1-3, 5, 8-)</span></label><input type="text" id="pages" name="pages" placeholder="1-3, 5"></div>
<div data-show-when="splitmode=every"><label for="every">Pages per file</label><input type="number" id="every" name="every" min="1" value="1"></div>"""),
    """<h2>Page ranges</h2><ul><li><code>1-3</code> means pages 1, 2 and 3.</li><li><code>5</code> means page 5 only.</li><li><code>8-</code> means page 8 to the end.</li><li>Combine them with commas: <code>1-3, 5, 8-</code></li></ul>""" + PDF_PRIVACY,
    [("Does splitting reduce quality?", "No. Pages are copied exactly as they are, without re-compressing anything."),
     ("Can I reorder pages?", "Yes. When extracting, the pages come out in the order you type them, for example 3, 1, 2.")], PDF_SCRIPTS)

tool_page("jpg-to-pdf", "JPG to PDF – Convert Images to PDF Free | etoolbox", "JPG to PDF converter",
    "Turn photos, scans and screenshots (JPG, PNG or WebP) into one PDF, fitted to A4 or Letter. It's free and private.",
    pdf_ui("img2pdf", accept_images=True, multiple=True, button="Create PDF", opts=f"""
<div class="row">
  <div><label for="pagesize">Page size</label><select id="pagesize" name="pagesize"><option value="a4" selected>A4</option><option value="letter">US Letter</option><option value="fit">Same as image</option></select></div>
  <div data-show-when="pagesize=a4|letter"><label for="orientation">Orientation</label><select id="orientation" name="orientation"><option value="auto">Automatic</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
</div>
<label for="margin">Margin</label><select id="margin" name="margin"><option value="none">None</option><option value="small" selected>Small</option><option value="large">Large</option></select>"""),
    """<h2>Good for</h2><ul><li>Sending receipts and scanned documents as one file</li><li>Turning phone photos of paperwork into a PDF for HMRC, your accountant or a landlord</li><li>Making a simple portfolio or catalogue</li></ul>""" + PDF_PRIVACY,
    [("How many images can I add?", "Up to 50 at a time. Use the arrows to set the page order."),
     ("Will my photos lose quality?", "JPG and PNG images are placed in the PDF unchanged. WebP images are converted to PNG first.")], PDF_SCRIPTS)

tool_page("pdf-to-jpg", "PDF to JPG – Convert PDF Pages to Images Free | etoolbox", "PDF to JPG converter",
    "Save every page of a PDF as a high-quality JPG or PNG image. It's useful for social media, websites and presentations, and nothing is uploaded.",
    pdf_ui("pdf2img", button="Convert to images", opts="""
<div class="row">
  <div><label for="imgformat">Format</label><select id="imgformat" name="imgformat"><option value="jpg">JPG</option><option value="png">PNG</option></select></div>
  <div><label for="scale">Quality</label><select id="scale" name="scale"><option value="1">Standard (72 dpi)</option><option value="2" selected>High (144 dpi)</option><option value="3">Very high (216 dpi)</option></select></div>
</div>"""),
    """<h2>Tips</h2><ul><li>Choose <strong>High</strong> for most uses, or <strong>Very high</strong> for printing.</li><li>Choose PNG for pages with sharp text or diagrams, and JPG for photos (smaller files).</li></ul>""" + PDF_PRIVACY,
    [("Is there a page limit?", "We convert up to 200 pages per file."),
     ("Why does it take a moment to start?", "The PDF reader (about 1.7 MB) loads the first time you convert. After that it's cached.")],
    ("vendor/pdf-lib.min.js", "pdftools.js"))

tool_page("rotate-pdf", "Rotate PDF – Turn PDF Pages Free | etoolbox", "Rotate PDF pages",
    "Fix sideways or upside-down pages. Rotate every page or just the ones you choose, then download the corrected PDF.",
    pdf_ui("rotate", button="Rotate PDF", opts=f"""
<label>Rotate by</label>
{seg("angle", [("90", "90° right"), ("180", "180°"), ("270", "90° left")], "90")}
<label>Which pages?</label>
{seg("which", [("all", "All pages"), ("some", "Some pages")], "all")}
<div data-show-when="which=some"><label for="pages">Pages <span class="hint">(e.g. 2, 4-6)</span></label><input type="text" id="pages" name="pages"></div>"""),
    PDF_PRIVACY, [("Is the rotation permanent?", "Yes. The pages are saved rotated, so they'll display correctly in any PDF reader.")], PDF_SCRIPTS)

tool_page("add-page-numbers-to-pdf", "Add Page Numbers to PDF Free | etoolbox", "Add page numbers to a PDF",
    "Number the pages of any PDF. Choose the position, the style ('1' or 'Page 1 of 10') and the starting number.",
    pdf_ui("numbers", button="Add page numbers", opts="""
<div class="row">
  <div><label for="position">Position</label><select id="position" name="position"><option value="bottom-center">Bottom centre</option><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-center">Top centre</option><option value="top-right">Top right</option></select></div>
  <div><label for="format">Style</label><select id="format" name="format"><option value="plain">1, 2, 3</option><option value="of">Page 1 of 10</option><option value="dash">- 1 -</option></select></div>
</div>
<div class="row">
  <div><label for="start">Start at</label><input type="number" id="start" name="start" value="1" min="0"></div>
  <div><label for="fontsize">Text size</label><input type="number" id="fontsize" name="fontsize" value="11" min="6" max="36"></div>
</div>
<label class="check" style="margin-top:12px"><input type="checkbox" name="skipfirst"> Don't number the first page (cover)</label>"""),
    PDF_PRIVACY, [("Can I skip the cover page?", "Yes. Tick 'Don't number the first page' and numbering starts on page 2.")], PDF_SCRIPTS)

# ---------------- Money ----------------

tool_page("take-home-pay-calculator",
    "Take-Home Pay Calculator UK 2026/27 – Salary After Tax | etoolbox",
    "UK take-home pay calculator 2026/27",
    "Work out your salary after Income Tax, National Insurance, pension and student loan, using the 2026/27 rates for England, Wales, Northern Ireland and Scotland.",
    calc_ui("takehome", f"""
<label for="salary">Your pay (£)</label>
<input type="text" id="salary" name="salary" inputmode="decimal" placeholder="e.g. 35000">
{seg("period", [("year", "Per year"), ("month", "Per month"), ("week", "Per week"), ("hour", "Per hour")], "year")}
<div data-show-when="period=hour"><label for="hoursweek">Hours per week</label><input type="number" id="hoursweek" name="hoursweek" value="37.5" step="0.5"></div>
<label>Where do you live?</label>
{seg("region", [("ruk", "England, Wales or NI"), ("scotland", "Scotland")], "ruk")}
<div class="row">
  <div><label for="pension">Pension contribution (%)</label><input type="text" id="pension" name="pension" inputmode="decimal" value="5"></div>
  <div><label for="sacrifice">Pension type</label><select id="sacrifice" name="sacrifice"><option value="no">Workplace (net pay)</option><option value="yes">Salary sacrifice</option></select></div>
</div>
<div class="row">
  <div><label for="loan">Student loan</label><select id="loan" name="loan"><option value="none">None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option><option value="plan4">Plan 4 (Scotland)</option><option value="plan5">Plan 5</option></select></div>
  <div><label for="postgrad">Postgraduate loan</label><select id="postgrad" name="postgrad"><option value="no">No</option><option value="yes">Yes</option></select></div>
</div>"""),
    """<h2>2026/27 rates used</h2>
<ul><li><strong>Personal Allowance:</strong> £12,570. It's reduced by £1 for every £2 earned over £100,000.</li>
<li><strong>England, Wales and NI:</strong> 20% up to £50,270, 40% up to £125,140, and 45% above.</li>
<li><strong>Scotland:</strong> 19%, 20%, 21%, 42%, 45% and 48% bands (starter rate up to £16,537, higher rate from £43,663, top rate over £125,140).</li>
<li><strong>National Insurance (employees):</strong> 8% between £12,570 and £50,270, and 2% above.</li>
<li><strong>Student loans:</strong> 9% above £26,900 (Plan 1), £29,385 (Plan 2), £33,795 (Plan 4) or £25,000 (Plan 5). Postgraduate loans are 6% above £21,000.</li></ul>
<p>Want a quick answer? See our <a href="/salary-after-tax/">salary after tax table</a>, with a full breakdown for every salary from £15,000 to £200,000, such as <a href="/salary-after-tax/30000/">£30,000</a>, <a href="/salary-after-tax/40000/">£40,000</a> and <a href="/salary-after-tax/50000/">£50,000</a>. You can also look up <a href="/monthly-salary-after-tax/">monthly pay after tax</a> or <a href="/hourly-wage/">what an hourly wage is worth a year</a>.</p>
<p>Rates were checked against GOV.UK in November 2026. This is an estimate for a standard tax code (1257L), and your payslip may differ slightly because of your tax code, benefits or pay timing.</p>""",
    [("How much is £30,000 after tax?", "In England, Wales or NI with no pension or student loan, it's about £25,120 a year (roughly £2,093 a month) in 2026/27. Enter your own figures above for an exact estimate."),
     ("What's the difference between net pay and salary sacrifice?", "Both reduce your Income Tax. Salary sacrifice also reduces your National Insurance, so you take home a little more for the same pension contribution."),
     ("Does this include employer pension contributions?", "No. It only shows what's deducted from your pay. Your employer's contribution is extra.")],
    ("calc.js",))

tool_page("mileage-allowance-calculator",
    "Mileage Allowance Calculator UK 2026/27 – HMRC 55p Rate | etoolbox",
    "HMRC mileage allowance calculator",
    "Work out tax-free business mileage at the 2026/27 HMRC approved rates: 55p a mile for the first 10,000 miles in a car or van, then 25p. Motorcycles are 24p and bicycles 20p.",
    calc_ui("mileage", f"""
<label>Vehicle</label>
{seg("vehicle", [("car", "Car or van"), ("motorcycle", "Motorcycle"), ("bicycle", "Bicycle")], "car")}
<label for="miles">Business miles</label>
<input type="text" id="miles" name="miles" inputmode="decimal" placeholder="e.g. 4200">
<div data-show-when="vehicle=car"><div class="row">
  <div><label for="prior">Business miles already done this tax year</label><input type="text" id="prior" name="prior" inputmode="decimal" value="0"></div>
  <div><label for="passengers">Work passengers</label><input type="number" id="passengers" name="passengers" value="0" min="0"></div>
</div></div>
<label for="paid">What your employer pays (pence per mile) <span class="hint">(optional)</span></label>
<input type="text" id="paid" name="paid" inputmode="decimal" placeholder="e.g. 30">"""),
    """<h2>HMRC approved mileage rates 2026/27</h2>
<ul><li><strong>Cars and vans:</strong> 55p a mile for the first 10,000 business miles in the tax year, then 25p. The rate went up from 45p on 6 April 2026, the first rise since 2011.</li>
<li><strong>Motorcycles:</strong> 24p a mile. <strong>Bicycles:</strong> 20p a mile.</li>
<li><strong>Passengers:</strong> up to 5p per passenger per mile can be paid tax-free.</li></ul>
<p>If your employer pays less than the approved rate, you can claim <strong>Mileage Allowance Relief</strong> on the difference from HMRC. Claims for 2025/26 and earlier use the old 45p rate.</p>""",
    [("Does the 55p rate apply to electric cars?", "Yes. For your own car, the same rates apply whether it's petrol, diesel, hybrid or electric."),
     ("Can self-employed people use these rates?", "Yes. Sole traders can use simplified expenses at the same per-mile rates instead of claiming actual vehicle costs.")],
    ("calc.js",))

tool_page("loan-calculator", "Loan Calculator UK – Monthly Repayments & Interest | etoolbox", "Loan repayment calculator",
    "See your monthly repayment, the total cost and the interest on a personal loan, car finance or business loan.",
    calc_ui("loan", f"""
<label for="amount">Amount to borrow (£)</label><input type="text" id="amount" name="amount" inputmode="decimal" placeholder="e.g. 10000">
<label for="apr">APR (%)</label><input type="text" id="apr" name="apr" inputmode="decimal" placeholder="e.g. 6.9">
<div class="row"><div><label for="term">Term</label><input type="text" id="term" name="term" inputmode="decimal" value="5"></div>
<div><label for="termunit">&nbsp;</label><select id="termunit" name="termunit"><option value="years">Years</option><option value="months">Months</option></select></div></div>"""),
    """<h2>How it's worked out</h2><p>We convert the APR (annual percentage rate) to a monthly rate and use the standard repayment formula. Your lender's figure may differ by a few pence because of fees and rounding.</p>""",
    [("What's a good APR?", "It depends on your credit history and the amount. Compare the representative APR from several lenders, and check eligibility tools that don't affect your credit score.")],
    ("calc.js",))

tool_page("mortgage-calculator", "Mortgage Calculator UK – Monthly Repayments | etoolbox", "Mortgage repayment calculator",
    "Work out monthly mortgage payments, your loan-to-value (LTV) and the total interest, for repayment or interest-only mortgages.",
    calc_ui("mortgage", f"""
<div class="row"><div><label for="price">Property price (£)</label><input type="text" id="price" name="price" inputmode="decimal" placeholder="e.g. 280000"></div>
<div><label for="deposit">Deposit (£)</label><input type="text" id="deposit" name="deposit" inputmode="decimal" placeholder="e.g. 28000"></div></div>
<div class="row"><div><label for="rate">Interest rate (%)</label><input type="text" id="rate" name="rate" inputmode="decimal" placeholder="e.g. 4.5"></div>
<div><label for="years">Term (years)</label><input type="number" id="years" name="years" value="25"></div></div>
<label>Mortgage type</label>{seg("mtype", [("repayment", "Repayment"), ("interest", "Interest only")], "repayment")}"""),
    """<h2>Good to know</h2><ul><li>A lower <strong>LTV</strong> (bigger deposit) usually gets you better rates. 60%, 75% and 90% are common cut-offs.</li><li>This assumes the same rate for the whole term. Most UK deals are fixed for 2–5 years and then move to the lender's standard variable rate.</li><li>It doesn't include fees, Stamp Duty or insurance.</li></ul>""",
    [("Repayment or interest only?", "With a repayment mortgage you clear the loan by the end of the term. With interest only, you still owe the full amount at the end and need a plan to repay it.")],
    ("calc.js",))

tool_page("compound-interest-calculator", "Compound Interest & Savings Calculator UK | etoolbox", "Savings & compound interest calculator",
    "See how your savings could grow with regular deposits and compound interest. It's useful for ISAs, savings accounts and business reserves.",
    calc_ui("compound", """
<div class="row"><div><label for="initial">Starting amount (£)</label><input type="text" id="initial" name="initial" inputmode="decimal" placeholder="e.g. 1000"></div>
<div><label for="monthly">Monthly saving (£)</label><input type="text" id="monthly" name="monthly" inputmode="decimal" placeholder="e.g. 200"></div></div>
<div class="row"><div><label for="rate">Interest rate (% a year)</label><input type="text" id="rate" name="rate" inputmode="decimal" placeholder="e.g. 4"></div>
<div><label for="years">Years</label><input type="number" id="years" name="years" value="10"></div></div>
<label for="compounding">Interest paid</label><select id="compounding" name="compounding"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>"""),
    """<p>This assumes the rate stays the same and leaves out tax. Interest within your Personal Savings Allowance or an ISA is tax-free.</p>""",
    [("What is compound interest?", "It's interest earned on your interest. Over time, your balance grows faster than with simple interest.")],
    ("calc.js",))

tool_page("discount-calculator", "Discount Calculator – Sale Price & % Off | etoolbox", "Discount calculator",
    "Work out a sale price after a percentage discount, including 'extra % off' deals, or find what percentage off a price is.",
    calc_ui("discount", f"""
<label>Calculation</label>{seg("mode", [("price", "Sale price"), ("find", "% off")], "price")}
<label for="price">Original price (£)</label><input type="text" id="price" name="price" inputmode="decimal" placeholder="e.g. 80">
<div data-show-when="mode=price"><div class="row"><div><label for="off">Discount (%)</label><input type="text" id="off" name="off" inputmode="decimal" placeholder="e.g. 25"></div>
<div><label for="extra">Extra % off <span class="hint">(optional)</span></label><input type="text" id="extra" name="extra" inputmode="decimal"></div></div></div>
<div data-show-when="mode=find"><label for="sale">Sale price (£)</label><input type="text" id="sale" name="sale" inputmode="decimal"></div>"""),
    """<p><strong>Tip:</strong> '25% off, then an extra 10% off' is a 32.5% discount in total, not 35%. The second discount applies to the already-reduced price.</p>""",
    [("How do I work out 20% off?", "Multiply the price by 0.8. For example, £50 × 0.8 = £40.")], ("calc.js",))

# ---------------- Everyday ----------------

tool_page("age-calculator", "Age Calculator – Exact Age in Years, Months & Days | etoolbox", "Age calculator",
    "Find an exact age in years, months and days, plus total days lived and the time until the next birthday.",
    calc_ui("age", """
<label for="dob">Date of birth</label><input type="date" id="dob" name="dob">
<label for="on">Age on <span class="hint">(defaults to today)</span></label><input type="date" id="on" name="on" data-today>"""),
    "<p>Handy for forms, job applications, insurance, and working out when someone reaches 16, 18, 21 or State Pension age.</p>",
    [("How are leap-year birthdays handled?", "If you were born on 29 February, your birthday counts as 1 March in years that aren't leap years.")], ("calc.js",))

tool_page("days-between-dates", "Days Between Dates & Working Days Calculator UK | etoolbox", "Days between dates calculator",
    "Count the days and working days between two dates (excluding England & Wales bank holidays), or add and subtract days, weeks, months or working days.",
    calc_ui("datediff", f"""
<label>Calculation</label>{seg("mode", [("between", "Days between"), ("add", "Add / subtract")], "between")}
<label for="start">Start date</label><input type="date" id="start" name="start" data-today>
<div data-show-when="mode=between"><label for="end">End date</label><input type="date" id="end" name="end">
<label class="check" style="margin-top:12px"><input type="checkbox" name="inclusive"> Include the end date</label></div>
<div data-show-when="mode=add"><div class="row"><div><label for="n">Number <span class="hint">(negative to subtract)</span></label><input type="number" id="n" name="n" value="30"></div>
<div><label for="unit">Unit</label><select id="unit" name="unit"><option value="days">Days</option><option value="workdays">Working days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div></div>"""),
    """<h2>Uses</h2><ul><li>Invoice due dates (e.g. 30 days from today)</li><li>Notice periods and contract end dates</li><li>Counting working days for projects and holidays</li></ul>
<p>Working days exclude weekends and England &amp; Wales bank holidays from 2025 to 2028. Scotland and Northern Ireland have some different bank holidays.</p>""",
    [("Does it count the start date?", "No. It counts the days from the start date to the end date. Tick 'Include the end date' to count both.")], ("calc.js",))

tool_page("unit-converter", "Unit Converter – Metric & Imperial (UK) | etoolbox", "Unit converter",
    "Convert length, weight, volume, temperature, area, speed, data and fuel economy, between metric and UK imperial units.",
    """
  <div class="gen">
    <form class="panel" data-units novalidate>
      <label for="cat">Type</label>
      <select id="cat" name="cat"><option value="length">Length</option><option value="weight">Weight</option><option value="volume">Volume</option><option value="temperature">Temperature</option><option value="area">Area</option><option value="speed">Speed</option><option value="data">Data</option><option value="fuel">Fuel economy</option></select>
      <label for="value">Value</label><input type="text" id="value" name="value" inputmode="decimal" value="1">
      <div class="row"><div><label for="from">From</label><select id="from" name="from"></select></div><div><label for="to">To</label><select id="to" name="to"></select></div></div>
      <button type="button" class="btn secondary small" id="swap" style="margin-top:10px">⇅ Swap</button>
    </form>
    <div class="panel preview"><div id="unit-out" class="calc-out" aria-live="polite"></div><div id="unit-table" class="calc-out" style="margin-top:10px"></div></div>
  </div>""",
    "<p>UK pints and gallons are bigger than US ones: a UK pint is 568 ml and a US pint is 473 ml. Choose the right one for recipes and fuel economy.</p>",
    [("How many kg is a stone?", "One stone is 14 pounds, or about 6.35 kg."), ("How do I convert mpg to litres per 100 km?", "Choose Fuel economy, then Miles per gallon (UK) to Litres per 100 km.")],
    ("units.js",))

tool_page("barcode-generator", "Free Barcode Generator – EAN-13, UPC & Code 128 | etoolbox", "Barcode generator",
    "Create EAN-13, UPC-A and Code 128 barcodes for products, stock labels and shelf edges. Download them as PNG or SVG. The check digits are calculated for you.",
    """
  <div class="gen">
    <form class="panel" data-barcode novalidate>
      <label for="btype">Barcode type</label>
      <select id="btype" name="btype"><option value="code128">Code 128 (stock, SKUs, any text)</option><option value="ean13">EAN-13 (retail products, UK/EU)</option><option value="upca">UPC-A (retail products, US)</option></select>
      <label for="data">Data</label><input type="text" id="data" name="data" autocomplete="off">
      <div class="row"><div><label for="module">Bar width</label><select id="module" name="module"><option value="2">Thin</option><option value="3" selected>Normal</option><option value="4">Wide (print)</option></select></div>
      <div><label for="bh">Height (px)</label><input type="number" id="bh" name="bh" value="100" min="30" max="400"></div></div>
      <label class="check" style="margin-top:12px"><input type="checkbox" name="showtext" checked> Show the numbers under the barcode</label>
    </form>
    <div class="panel preview"><div id="bc-canvas"></div><div id="bc-warn" class="warn" role="status"></div>
      <div id="bc-actions" class="actions" hidden><button type="button" class="btn" id="bc-png">Download PNG</button><button type="button" class="btn secondary" id="bc-svg">Download SVG</button></div>
      <p class="note">Always test-scan before printing a batch.</p></div>
  </div>""",
    """<h2>Which barcode do I need?</h2><ul><li><strong>Selling in shops or on Amazon?</strong> You need a real <strong>EAN-13</strong> number registered to your business through GS1 UK. You can't just make up the number, but you can use this tool to draw the barcode once you have it.</li>
<li><strong>Stock control, shelf labels, internal SKUs:</strong> use <strong>Code 128</strong>, which works with letters and numbers.</li></ul>""",
    [("Do I need to buy barcodes?", "For retail products, yes. Retailers expect GS1-registered numbers. For your own stock system, any Code 128 barcode works.")],
    ("barcode.js",))

tool_page("email-signature-generator", "Free Email Signature Generator – Gmail & Outlook | etoolbox", "Email signature generator",
    "Make a professional email signature for Gmail, Outlook or Apple Mail in a minute. Copy it with one click. There's no sign-up and no branding.",
    """
  <div class="inv">
    <form class="panel" data-signature novalidate>
      <div class="row"><div><label for="name">Full name</label><input type="text" id="name" name="name" autocomplete="name"></div><div><label for="title">Job title</label><input type="text" id="title" name="title"></div></div>
      <label for="company">Business name</label><input type="text" id="company" name="company" autocomplete="organization">
      <div class="row"><div><label for="phone">Phone</label><input type="tel" id="phone" name="phone"></div><div><label for="mobile">Mobile</label><input type="tel" id="mobile" name="mobile"></div></div>
      <div class="row"><div><label for="email">Email</label><input type="email" id="email" name="email"></div><div><label for="website">Website</label><input type="text" id="website" name="website" inputmode="url"></div></div>
      <label for="address">Address <span class="hint">(optional)</span></label><input type="text" id="address" name="address">
      <label>Company logo <span class="hint">(optional)</span></label>
      <div class="btn-row" style="margin-top:0;align-items:center"><label class="btn secondary small" for="logo-file" style="margin:0">⬆ Upload logo<input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" class="sr-only"></label>
        <button type="button" class="btn secondary small" id="logo-remove" hidden>Remove logo</button>
        <label class="check" style="margin:0">Size <select id="logosize" name="logosize" style="width:auto;padding:6px 8px"><option value="60">Small</option><option value="90" selected>Medium</option><option value="120">Large</option><option value="160">Extra large</option></select></label></div>
      <p id="logo-msg" class="hint" role="status" style="margin:6px 0 0"></p>
      <details style="margin-top:6px"><summary class="hint" style="cursor:pointer">Or use a logo that's already online</summary>
        <input type="text" id="logo" name="logo" inputmode="url" placeholder="https://yourbusiness.co.uk/logo.png" style="margin-top:6px"></details>
      <details class="style-opts"><summary>Social links</summary>
        <div class="row"><div><label for="linkedin">LinkedIn</label><input type="text" id="linkedin" name="linkedin"></div><div><label for="facebook">Facebook</label><input type="text" id="facebook" name="facebook"></div></div>
        <div class="row"><div><label for="instagram">Instagram</label><input type="text" id="instagram" name="instagram"></div><div><label for="x">X (Twitter)</label><input type="text" id="x" name="x"></div></div>
        <label for="tiktok">TikTok</label><input type="text" id="tiktok" name="tiktok">
      </details>
      <div class="row"><div><label for="color">Accent colour</label><input type="color" id="color" name="color" value="#ff6b35" style="width:100%;height:46px"></div>
      <div><label for="layout">Layout</label><select id="layout" name="layout"><option value="side">Logo on the left</option><option value="stacked">Stacked</option></select></div></div>
      <label for="note">Small print <span class="hint">(optional, e.g. company number)</span></label><input type="text" id="note" name="note" placeholder="Registered in England & Wales No. 01234567">
    </form>
    <div class="doc-wrap"><div class="panel"><h3 style="margin:0 0 12px">Preview</h3><div class="sig-preview" id="sig-preview"></div>
      <div class="btn-row"><button type="button" class="btn" id="copy-sig">Copy signature</button><button type="button" class="btn secondary" id="copy-html">Copy HTML</button></div>
      <p id="sig-msg" class="good" role="status" style="min-height:1.4em;margin:8px 0 0"></p></div></div>
  </div>""",
    """<h2>How to add it to your email</h2><ul>
<li><strong>Gmail:</strong> Settings (⚙) → See all settings → General → Signature → Create new, then paste.</li>
<li><strong>Outlook:</strong> Settings → Mail → Compose and reply → Email signature, then paste.</li>
<li><strong>Apple Mail:</strong> Mail → Settings → Signatures → +, untick 'Always match my default message font', then paste.</li></ul>
<p>UK limited companies should include their registered name, number and office address on business emails.</p>""",
    [("How does the logo upload work?", "We resize your logo for email (sharp on retina screens) and host it on etoolbox so Gmail, Outlook and Apple Mail can all display it. The image is public to anyone with its link, like any logo in an email, so only upload a logo you're allowed to use."),
     ("My logo doesn't show for some recipients. Why?", "Some email apps hide images until the reader clicks 'Show images'. That's normal for every signature logo."),
     ("Are my details saved?", "Only in this browser, so you can come back and edit them. Nothing is sent to us.")],
    ("signature.js",))
