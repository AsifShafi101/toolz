# Programmatic "£X after tax" pages (England, Wales & NI, 2026/27).
# Same maths as assets/calc.js takeHome(), kept in step by _build/test12.js.

SAL_YEAR = "2026/27"
SAL_AMOUNTS = list(range(15000, 100001, 1000)) + list(range(105000, 200001, 5000))


def sal_calc(gross, pension_pct=0.0, plan2=False):
    pension = gross * pension_pct
    ani = gross - pension
    pa = max(0.0, 12570 - max(0.0, (ani - 100000) / 2))
    taxable = max(0.0, ani - pa)
    tax, prev = 0.0, 0.0
    for top, rate in ((37700, .20), (125140, .40), (float("inf"), .45)):
        if taxable <= prev:
            break
        tax += (min(taxable, top) - prev) * rate
        prev = top
    ni = max(0.0, min(gross, 50270) - 12570) * .08 + max(0.0, gross - 50270) * .02
    sl = max(0.0, gross - 29385) * .09 if plan2 else 0.0
    net = gross - pension - tax - ni - sl
    return {"gross": gross, "tax": tax, "ni": ni, "sl": sl, "pension": pension, "net": net, "pa": pa}


def money(x, pence=False):
    return f"£{x:,.2f}" if pence else f"£{int(x + 0.5) if x >= 0 else round(x):,}"


def short(n):
    return f"£{n // 1000}k"


def sal_slug(n):
    return f"/salary-after-tax/{n}/"


SAL_CSS_DONE = True


def salary_page(n):
    r = sal_calc(n)
    path = sal_slug(n)
    eff = (r["tax"] + r["ni"]) / n * 100
    nxt = sal_calc(n + 100)
    marg = 100 - (nxt["net"] - r["net"])  # % lost on the next £100
    rise = sal_calc(n + 1000)["net"] - r["net"]
    p5, p2, both = sal_calc(n, .05), sal_calc(n, 0, True), sal_calc(n, .05, True)
    N = money(n)
    title = f"{N} After Tax UK {SAL_YEAR} – {money(r['net'] / 12)} a Month Take-Home | etoolbox"
    desc = (f"On a {N} salary you take home {money(r['net'])} a year, {money(r['net'] / 12)} a month or {money(r['net'] / 52)} a week "
            f"after Income Tax and National Insurance ({SAL_YEAR}, England, Wales & NI).")
    faqs = [
        (f"How much is {N} a month after tax?", f"About {money(r['net'] / 12, True)} a month in {SAL_YEAR}, with no pension or student loan, on a standard 1257L tax code in England, Wales or Northern Ireland."),
        (f"How much tax do I pay on {N}?", f"{money(r['tax'], True)} Income Tax and {money(r['ni'], True)} National Insurance a year. That's {eff:.1f}% of your salary in total."),
        (f"What if I pay into a pension or have a student loan?", f"With a 5% workplace pension you'd take home about {money(p5['net'] / 12)} a month. With a Plan 2 student loan it's about {money(p2['net'] / 12)}. Use the calculator for your exact mix."),
        ("Is this right for Scotland?", "No. Scotland has its own Income Tax bands, so your take-home will be different. Choose Scotland in the take-home pay calculator."),
    ]
    crumbs_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Salary after tax", "item": SITE + "/salary-after-tax/"},
        {"@type": "ListItem", "position": 3, "name": f"{N} after tax", "item": SITE + path}]}
    stats = "".join(f'<div class="sal-stat{" big" if b else ""}"><span>{l}</span><strong>{v}</strong></div>' for l, v, b in [
        ("Per month", money(r["net"] / 12, True), True), ("Per year", money(r["net"], True), False),
        ("Per week", money(r["net"] / 52, True), False), ("Per day*", money(r["net"] / 260, True), False),
        ("Per hour*", money(r["net"] / (37.5 * 52), True), False)])

    def row(label, key, neg=True):
        v = r[key]
        s = "−" if neg and v else ""
        return f"<tr><th>{label}</th><td>{s}{money(v, True)}</td><td>{s}{money(v / 12, True)}</td><td>{s}{money(v / 52, True)}</td></tr>"
    table = ("<table class=\"sal-table\"><thead><tr><th></th><th>Year</th><th>Month</th><th>Week</th></tr></thead><tbody>"
             + row("Gross salary", "gross", False) + row("Income Tax", "tax") + row("National Insurance", "ni")
             + f'<tr class="tot"><th>Take-home pay</th><td>{money(r["net"], True)}</td><td>{money(r["net"] / 12, True)}</td><td>{money(r["net"] / 52, True)}</td></tr></tbody></table>')
    variants = ("<table class=\"sal-table\"><thead><tr><th>Your situation</th><th>Take-home a month</th><th>A year</th></tr></thead><tbody>"
                + "".join(f"<tr><th>{l}</th><td>{money(x['net'] / 12, True)}</td><td>{money(x['net'], True)}</td></tr>" for l, x in [
                    ("No pension, no student loan", r), ("5% workplace pension", p5), ("Plan 2 student loan", p2), ("5% pension + Plan 2 loan", both)])
                + "</tbody></table>")
    steps = [f"<li><strong>Personal Allowance:</strong> the first {money(r['pa'])} is tax-free"
             + (" (it shrinks by £1 for every £2 over £100,000)." if n > 100000 else ".") + "</li>"]
    taxable = max(0, n - r["pa"])
    b = min(taxable, 37700)
    steps.append(f"<li><strong>Basic rate 20%:</strong> on {money(b)} = {money(b * .2, True)}.</li>")
    if taxable > 37700:
        h = min(taxable, 125140) - 37700
        steps.append(f"<li><strong>Higher rate 40%:</strong> on {money(h)} = {money(h * .4, True)}.</li>")
    if taxable > 125140:
        a = taxable - 125140
        steps.append(f"<li><strong>Additional rate 45%:</strong> on {money(a)} = {money(a * .45, True)}.</li>")
    steps.append(f"<li><strong>National Insurance:</strong> 8% on earnings between £12,570 and £50,270"
                 + (", plus 2% above that" if n > 50270 else "") + f" = {money(r['ni'], True)}.</li>")
    near = [x for x in (n - 5000, n - 2000, n - 1000, n + 1000, n + 2000, n + 5000, n + 10000) if x in SAL_AMOUNTS]
    near_links = "".join(f'<a class="pop" href="{sal_slug(x)}">{money(x)}</a>' for x in near)
    nav = (f'<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span>'
           f'<a href="/salary-after-tax/">Salary after tax</a><span aria-hidden="true">›</span><span aria-current="page">{N}</span></nav>')
    page = head(title, desc, path, faq_ld(faqs) + f'<script type="application/ld+json">{json.dumps(crumbs_ld)}</script>\n') + f"""
<div class="wrap">
  {nav}
  <div class="page-head"><div class="ph-row">{tool_icon("take-home-pay-calculator")}<h1>{N} after tax in the UK ({SAL_YEAR})</h1></div>
  <p>On a <strong>{N}</strong> salary you take home <strong>{money(r['net'])}</strong> a year, which is <strong>{money(r['net'] / 12)} a month</strong>.
  That's after {money(r['tax'])} Income Tax and {money(r['ni'])} National Insurance, using {SAL_YEAR} rates for England, Wales and Northern Ireland.</p></div>
  <div class="sal-stats">{stats}</div>
  <p class="note">*Based on 5 working days and 37.5 hours a week. Standard 1257L tax code, no pension or student loan.</p>
  <p><a class="btn" href="/take-home-pay-calculator/?salary={n}">Add your pension, student loan or Scotland →</a></p>
  {share_bar(path, f"{N} after tax in the UK: {money(r['net'] / 12)} a month take-home ({SAL_YEAR})")}
  <section class="prose">
    <h2>{N} salary breakdown</h2>{table}
    <h2>With a pension or student loan</h2>{variants}
    <h2>How it's worked out</h2><ol>{"".join(steps)}</ol>
    <p>In total you pay <strong>{eff:.1f}%</strong> of your salary in tax and National Insurance. On the next £100 you earn, about <strong>£{marg:.0f}</strong> goes in tax and NI.
    A £1,000 pay rise to {money(n + 1000)} would add about <strong>{money(rise)}</strong> a year ({money(rise / 12)} a month) to your take-home pay.</p>
    <p class="note">Rates checked against GOV.UK in November 2026. This is an estimate. Your payslip can differ because of your tax code, benefits or pay timing.</p>
  </section>
  <section><h2>Compare nearby salaries</h2><div class="pops sal-near">{near_links}</div>
  <p><a href="/salary-after-tax/">See every salary from £15,000 to £200,000 →</a> · <a href="/monthly-salary-after-tax/">Monthly pay after tax →</a> · <a href="/hourly-wage/">Hourly wage to salary →</a></p></section>
  {faq_html(faqs)}
</div>
""" + foot(("calc.js",))
    write(path, page)


for _n in SAL_AMOUNTS:
    salary_page(_n)

# Hub page
_rows = "".join(
    f'<tr><th><a href="{sal_slug(n)}">{money(n)}</a></th><td>{money(sal_calc(n)["net"] / 12, True)}</td><td>{money(sal_calc(n)["net"], True)}</td></tr>'
    for n in SAL_AMOUNTS)
_faqs = [("Which tax year is this?", f"{SAL_YEAR}, from 6 April 2026 to 5 April 2027."),
         ("Does this include pension or student loan?", "The table doesn't. Each salary page shows those, or use the take-home pay calculator.")]
write("/salary-after-tax/", head(f"Salary After Tax UK {SAL_YEAR} – Take-Home Pay Table £15k to £200k | etoolbox",
      f"Take-home pay for every UK salary from £15,000 to £200,000 in {SAL_YEAR}: monthly and yearly pay after Income Tax and National Insurance.",
      "/salary-after-tax/", faq_ld(_faqs)) + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Salary after tax</span></nav>
  <div class="page-head"><div class="ph-row">{tool_icon("take-home-pay-calculator")}<h1>UK salary after tax table ({SAL_YEAR})</h1></div>
  <p>Take-home pay for salaries from £15,000 to £200,000 in England, Wales and Northern Ireland, after Income Tax and National Insurance. Tap a salary for the full breakdown.</p></div>
  <p><a class="btn" href="/take-home-pay-calculator/">Work out your exact take-home pay →</a></p>
  {share_bar("/salary-after-tax/", f"UK salary after tax table {SAL_YEAR}, £15k to £200k")}
  <section class="prose"><table class="sal-table"><thead><tr><th>Salary</th><th>Take-home a month</th><th>Take-home a year</th></tr></thead><tbody>{_rows}</tbody></table>
  <p class="note">Standard 1257L tax code, no pension or student loan. Rates checked against GOV.UK in November 2026.</p></section>
  {faq_html(_faqs)}
</div>
""" + foot(()))

EXTRA_PATHS = globals().get("EXTRA_PATHS", []) + ["/salary-after-tax/"] + [sal_slug(n) for n in SAL_AMOUNTS]
