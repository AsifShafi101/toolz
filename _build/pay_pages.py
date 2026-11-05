# "£X a month after tax" and "£X an hour is how much a year" pages (England, Wales & NI, 2026/27).
# Uses sal_calc() from salary_pages.py, so the numbers match the calculator (checked by test15.js).

NLW = 12.71  # National Living Wage (21+) from 1 April 2026 – GOV.UK press release
MONTHLY = list(range(1000, 8001, 250))
HOURLY = [NLW] + list(range(13, 51))
HOURS = 37.5


def hr_slug(h):
    return f"/hourly-wage/{('%.2f' % h).replace('.', '-') if h != int(h) else int(h)}/"


def mo_slug(m):
    return f"/monthly-salary-after-tax/{m}/"


def money2(x):
    return f"£{x:,.2f}"


def pay_table(r):
    def row(label, key, neg=True):
        v = r[key]; s = "−" if neg and v else ""
        return f"<tr><th>{label}</th><td>{s}{money2(v)}</td><td>{s}{money2(v / 12)}</td><td>{s}{money2(v / 52)}</td></tr>"
    return ("<table class=\"sal-table\"><thead><tr><th></th><th>Year</th><th>Month</th><th>Week</th></tr></thead><tbody>"
            + row("Gross pay", "gross", False) + row("Income Tax", "tax") + row("National Insurance", "ni")
            + f'<tr class="tot"><th>Take-home pay</th><td>{money2(r["net"])}</td><td>{money2(r["net"] / 12)}</td><td>{money2(r["net"] / 52)}</td></tr></tbody></table>')


def stats(items):
    return '<div class="sal-stats">' + "".join(f'<div class="sal-stat{" big" if i == 0 else ""}"><span>{l}</span><strong>{v}</strong></div>' for i, (l, v) in enumerate(items)) + "</div>"


def pay_page(path, title, desc, h1, lead, stat_items, note, gross, faqs, crumb_label, hub, hub_name, near):
    r = sal_calc(gross)
    p5, p2 = sal_calc(gross, .05), sal_calc(gross, 0, True)
    eff = (r["tax"] + r["ni"]) / gross * 100 if gross else 0
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": hub_name, "item": SITE + hub},
        {"@type": "ListItem", "position": 3, "name": crumb_label, "item": SITE + path}]}
    variants = ("<table class=\"sal-table\"><thead><tr><th>Your situation</th><th>Take-home a month</th><th>A year</th></tr></thead><tbody>"
                + "".join(f"<tr><th>{l}</th><td>{money2(x['net'] / 12)}</td><td>{money2(x['net'])}</td></tr>" for l, x in [
                    ("No pension, no student loan", r), ("5% workplace pension", p5), ("Plan 2 student loan", p2)]) + "</tbody></table>")
    page = head(title, desc, path, faq_ld(faqs) + f'<script type="application/ld+json">{json.dumps(ld)}</script>\n') + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="{hub}">{hub_name}</a><span aria-hidden="true">›</span><span aria-current="page">{crumb_label}</span></nav>
  <div class="page-head"><div class="ph-row">{tool_icon("take-home-pay-calculator")}<h1>{h1}</h1></div><p>{lead}</p></div>
  {stats(stat_items)}
  <p class="note">{note}</p>
  <p><a class="btn" href="/take-home-pay-calculator/?salary={round(gross)}">Add your pension, student loan or Scotland →</a></p>
  {share_bar(path, html.unescape(h1))}
  <section class="prose">
    <h2>Breakdown</h2>{pay_table(r)}
    <h2>With a pension or student loan</h2>{variants}
    <p>In total you pay <strong>{eff:.1f}%</strong> of your pay in Income Tax and National Insurance, using {SAL_YEAR} rates for England, Wales and Northern Ireland and a standard 1257L tax code.</p>
    <p class="note">Rates checked against GOV.UK in November 2026. This is an estimate; your payslip can differ because of your tax code, benefits or pay timing.</p>
  </section>
  <section><h2>Compare</h2><div class="pops sal-near">{near}</div><p><a href="{hub}">See the full table →</a> · <a href="/salary-after-tax/">Yearly salary after tax →</a></p></section>
  {faq_html(faqs)}
</div>
""" + foot(())
    write(path, page)


# ---- Monthly gross → take-home ----
for m in MONTHLY:
    g = m * 12; r = sal_calc(g); M = f"£{m:,}"
    near = "".join(f'<a class="pop" href="{mo_slug(x)}">£{x:,} a month</a>' for x in (m - 500, m - 250, m + 250, m + 500, m + 1000) if x in MONTHLY)
    pay_page(mo_slug(m), f"{M} a Month After Tax UK {SAL_YEAR} – {money(r['net'] / 12)} Take-Home | etoolbox",
             f"Earning {M} a month before tax? You take home about {money(r['net'] / 12)} a month ({money(r['net'])} a year) after Income Tax and National Insurance in {SAL_YEAR}.",
             f"{M} a month after tax ({SAL_YEAR})",
             f"If you earn <strong>{M} a month</strong> before tax (<strong>{money(g)}</strong> a year), you take home about <strong>{money(r['net'] / 12)} a month</strong> after Income Tax and National Insurance.",
             [("Take-home a month", money2(r["net"] / 12)), ("A year", money2(r["net"])), ("A week", money2(r["net"] / 52)), ("Tax a month", money2(r["tax"] / 12)), ("NI a month", money2(r["ni"] / 12))],
             "Standard 1257L tax code, paid monthly, no pension or student loan.", g,
             [(f"How much is {M} a month after tax?", f"About {money2(r['net'] / 12)} a month in {SAL_YEAR}, in England, Wales or Northern Ireland, with no pension or student loan."),
              (f"What salary is {M} a month?", f"{M} a month is {money(g)} a year before tax."),
              ("Is this right for Scotland?", "No. Scotland has its own Income Tax bands. Choose Scotland in the take-home pay calculator.")],
             f"{M} a month", "/monthly-salary-after-tax/", "Monthly salary after tax", near)

# ---- Hourly wage → yearly ----
for h in HOURLY:
    g = round(h * HOURS * 52, 2); r = sal_calc(g); H = money2(h) if h != int(h) else f"£{int(h)}"
    nl = " (the National Living Wage)" if h == NLW else ""
    near = "".join(f'<a class="pop" href="{hr_slug(x)}">{money2(x) if x != int(x) else "£" + str(int(x))} an hour</a>' for x in HOURLY if x != h and abs(x - h) <= 3)
    pay_page(hr_slug(h), f"{H} an Hour Is How Much a Year? UK {SAL_YEAR} After Tax | etoolbox",
             f"{H} an hour{nl} is {money(g)} a year on 37.5 hours a week. After tax and NI you take home about {money(r['net'] / 12)} a month ({SAL_YEAR}).",
             f"{H} an hour is how much a year?",
             f"<strong>{H} an hour</strong>{nl} on a full-time 37.5-hour week is <strong>{money(g)} a year</strong> before tax. After Income Tax and National Insurance, you take home about <strong>{money(r['net'] / 12)} a month</strong>.",
             [("A year (gross)", money(g)), ("Take-home a month", money2(r["net"] / 12)), ("Take-home a week", money2(r["net"] / 52)), ("Gross a month", money2(g / 12)), ("Gross a week", money2(g / 52))],
             "Based on 37.5 hours a week, 52 weeks a year (paid holiday included). Standard 1257L tax code.", g,
             [(f"{H} an hour is how much a year?", f"{money(g)} on 37.5 hours a week. On 40 hours a week it's {money(h * 40 * 52)}."),
              (f"How much is {H} an hour after tax?", f"About {money2(r['net'] / 12)} a month, or {money2(r['net'] / 52)} a week, in {SAL_YEAR}."),
              ("What's the National Living Wage?", f"From 1 April 2026 it's £12.71 an hour for workers aged 21 and over (GOV.UK).")],
             f"{H} an hour", "/hourly-wage/", "Hourly wage to salary", near)

# ---- Hubs ----
_mrows = "".join(f'<tr><th><a href="{mo_slug(m)}">£{m:,}</a></th><td>{money(m * 12)}</td><td>{money2(sal_calc(m * 12)["net"] / 12)}</td></tr>' for m in MONTHLY)
_hrows = "".join(f'<tr><th><a href="{hr_slug(h)}">{money2(h)}</a></th><td>{money(h * HOURS * 52)}</td><td>{money2(sal_calc(round(h * HOURS * 52, 2))["net"] / 12)}</td></tr>' for h in HOURLY)
for path, title, desc, h1, lead, head_cols, rows in [
    ("/monthly-salary-after-tax/", f"Monthly Salary After Tax UK {SAL_YEAR} – £1,000 to £8,000 a Month | etoolbox",
     f"Take-home pay for monthly salaries from £1,000 to £8,000 before tax, {SAL_YEAR}.", f"Monthly salary after tax ({SAL_YEAR})",
     "Monthly take-home pay in England, Wales and Northern Ireland, after Income Tax and National Insurance. Tap a row for the full breakdown.",
     ("Gross a month", "A year", "Take-home a month"), _mrows),
    ("/hourly-wage/", f"Hourly Wage to Annual Salary UK {SAL_YEAR} – £12.71 to £50 an Hour | etoolbox",
     f"What an hourly wage is worth a year and a month after tax in {SAL_YEAR}, from the £12.71 National Living Wage to £50 an hour.", f"Hourly wage to salary ({SAL_YEAR})",
     "Yearly pay and monthly take-home for full-time hourly wages (37.5 hours a week). Tap a rate for the full breakdown.",
     ("Hourly rate", "A year (gross)", "Take-home a month"), _hrows)]:
    write(path, head(title, desc, path) + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">{h1}</span></nav>
  <div class="page-head"><div class="ph-row">{tool_icon("take-home-pay-calculator")}<h1>{h1}</h1></div><p>{lead}</p></div>
  <p><a class="btn" href="/take-home-pay-calculator/">Work out your exact take-home pay →</a></p>
  {share_bar(path, html.unescape(h1))}
  <section class="prose"><table class="sal-table"><thead><tr>{"".join(f"<th>{c}</th>" for c in head_cols)}</tr></thead><tbody>{rows}</tbody></table>
  <p class="note">Standard 1257L tax code, no pension or student loan. Rates checked against GOV.UK in November 2026.</p></section>
</div>
""" + foot(()))

EXTRA_PATHS = EXTRA_PATHS + ["/monthly-salary-after-tax/", "/hourly-wage/"] + [mo_slug(m) for m in MONTHLY] + [hr_slug(h) for h in HOURLY]
