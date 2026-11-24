# ---------------- Batch 3: calories, body fat, ideal weight, stamp duty, student loans ----------------
def _units(height=True, weight=True, extra=""):
    h = """<div data-u="met"><label for="hc-cm">Height (cm)</label><input type="number" id="hc-cm" name="cm" min="100" max="250" value="170" inputmode="decimal"></div>
      <div data-u="imp" hidden><span class="lbl">Height</span><div class="row"><div><label for="hc-ft" class="sr-only">Feet</label><input type="number" id="hc-ft" name="ft" min="3" max="8" value="5" aria-label="Feet"> <span class="muted">ft</span></div><div><label for="hc-in" class="sr-only">Inches</label><input type="number" id="hc-in" name="inch" min="0" max="11.9" step="0.1" value="7" aria-label="Inches"> <span class="muted">in</span></div></div></div>""" if height else ""
    w = """<div data-u="met"><label for="hc-kg">Weight (kg)</label><input type="number" id="hc-kg" name="kg" min="25" max="300" step="0.1" value="75" inputmode="decimal"></div>
      <div data-u="imp" hidden><span class="lbl">Weight</span><div class="row"><div><input type="number" name="st" min="3" max="45" value="11" aria-label="Stone"> <span class="muted">st</span></div><div><input type="number" name="lb" min="0" max="13.9" step="0.1" value="11" aria-label="Pounds"> <span class="muted">lb</span></div></div></div>""" if weight else ""
    return f"""<div class="row"><div><label for="hc-units">Units</label><select id="hc-units" name="units"><option value="met">Metric (cm, kg)</option><option value="imp">Imperial (ft, st)</option></select></div>
      <div><label for="hc-sex">Sex</label><select id="hc-sex" name="sex"><option value="f">Female</option><option value="m">Male</option></select></div></div>{h}{w}{extra}"""

_health_note = '<p>See also: <a href="/bmi-calculator/">BMI calculator</a> · <a href="/calorie-calculator/">calorie calculator</a> · <a href="/body-fat-calculator/">body fat calculator</a> · <a href="/ideal-weight-calculator/">ideal weight calculator</a>. These calculators give general information, not medical advice. If you have a health condition, are pregnant, or have (or think you may have) an eating disorder, speak to your GP before changing your diet.</p>'

tool_page("calorie-calculator",
    "Calorie Calculator UK – How Many Calories Do I Need? (BMR & TDEE) | etoolbox",
    "Calorie calculator",
    "Find out how many calories you burn each day (your TDEE) and how many to eat to lose, keep or gain weight safely. Uses the Mifflin-St Jeor formula, recommended by dietitians, with metric or imperial units.",
    f"""
  <div class="gen"><form class="panel" data-cal novalidate>
    {_units()}
    <label for="hc-age">Age</label><input type="number" id="hc-age" name="age" min="15" max="100" value="35">
    <label for="hc-act">How active are you?</label><select id="hc-act" name="activity"><option value="1.2">Little or no exercise (desk job)</option><option value="1.375" selected>Light exercise 1–3 days a week</option><option value="1.55">Moderate exercise 3–5 days a week</option><option value="1.725">Hard exercise 6–7 days a week</option><option value="1.9">Very hard exercise or a physical job</option></select>
  </form><div class="panel" id="hc-out" aria-live="polite"></div></div>""",
    """<h2>How it works</h2><p>Your <strong>basal metabolic rate (BMR)</strong> is what your body burns at complete rest. We calculate it with the Mifflin-St Jeor equation, then multiply it by your activity level to get your <strong>total daily energy expenditure (TDEE)</strong>: the calories that keep your weight steady.</p>
<p>Eating about 500 kcal a day less than your TDEE usually leads to losing about 0.5 kg (1 lb) a week, which the NHS describes as a safe, sustainable pace. Bodies differ, so use the numbers as a starting point and adjust after a few weeks.</p>""" + _health_note,
    [("How many calories should I eat to lose weight?", "Roughly 500 kcal a day below your maintenance calories, for about 0.5 kg (1 lb) a week. Don't go below about 1,200 kcal (women) or 1,500 kcal (men) a day without medical supervision."),
     ("Is this accurate?", "Mifflin-St Jeor is one of the most accurate formulas for most people, usually within about 10%. Very muscular people burn more than it predicts."),
     ("Is my data stored?", "No. Everything is calculated in your browser.")],
    ("health.js",))

tool_page("body-fat-calculator",
    "Body Fat Calculator – US Navy Tape Measure Method | etoolbox",
    "Body fat calculator",
    "Estimate your body fat percentage with just a tape measure, using the US Navy method. See your category, your fat and lean mass, and how you compare with healthy ranges. Metric or imperial.",
    f"""
  <div class="gen"><form class="panel" data-fat novalidate>
    {_units(height=True, weight=True, extra='''<div class="row"><div><label for="hc-neck">Neck <span class="muted" data-u="met">(cm)</span><span class="muted" data-u="imp" hidden>(in)</span></label><input type="number" id="hc-neck" name="neck" step="0.1" value="34"></div>
      <div><label for="hc-waist">Waist <span class="muted" data-u="met">(cm)</span><span class="muted" data-u="imp" hidden>(in)</span></label><input type="number" id="hc-waist" name="waist" step="0.1" value="80"></div></div>
      <div data-hip><label for="hc-hip">Hips <span class="muted" data-u="met">(cm)</span><span class="muted" data-u="imp" hidden>(in)</span></label><input type="number" id="hc-hip" name="hip" step="0.1" value="98"></div>''')}
    <p class="hint">Weight is optional and only used to show your fat and lean mass.</p>
  </form><div class="panel" id="hc-out" aria-live="polite"></div></div>""",
    """<h2>How to measure</h2><ul><li><strong>Neck:</strong> just below the Adam's apple, with the tape sloping slightly down at the front.</li><li><strong>Waist:</strong> men at the navel; women at the narrowest point, usually just above the belly button. Breathe out normally, don't suck in.</li><li><strong>Hips (women):</strong> at the widest point of the bottom.</li></ul>
<h2>Healthy body fat ranges</h2><p>For men, 14–24% is typical of a healthy, active adult; for women, 21–31%. Some fat is essential: about 2–5% for men and 10–13% for women.</p>""" + _health_note,
    [("How accurate is the tape-measure method?", "It's typically within 3–4 percentage points of a DEXA scan for most people. It's best for tracking change over time with the same measuring technique."),
     ("Why do women need a hip measurement?", "The US Navy formula for women uses neck, waist and hips, because women tend to carry more fat on the hips and thighs.")],
    ("health.js",))

tool_page("ideal-weight-calculator",
    "Ideal Weight Calculator – Healthy Weight for My Height | etoolbox",
    "Ideal weight calculator",
    "Find a healthy weight range for your height, based on the WHO and NHS BMI range, and compare four well-known ideal weight formulas. Works in kg or stone and pounds.",
    f"""
  <div class="gen"><form class="panel" data-ideal novalidate>{_units(weight=False)}</form><div class="panel" id="hc-out" aria-live="polite"></div></div>""",
    """<h2>Which number should I use?</h2><p>The <strong>healthy BMI range</strong> (18.5–24.9) is what the NHS and WHO use, and gives a range rather than a single "ideal". The older formulas (Devine, Robinson, Miller and Hamwi) each give one number. They were designed for drug doses and life insurance tables, and they differ by several kilos.</p>
<p>If you're of South Asian, Chinese, Middle Eastern, Black African or African-Caribbean family background, UK guidance uses a lower BMI threshold (23) for overweight, so aim for the lower part of the range. See the <a href="/bmi-calculator/">BMI calculator</a> for more.</p>""" + _health_note,
    [("What's the ideal weight for 5 ft 7 in?", "A healthy BMI range at 5 ft 7 in (170 cm) is about 53.5–72 kg, or 8 st 6 lb to 11 st 5 lb."),
     ("Why don't the formulas agree?", "Each was built from different data for a different purpose. Use them as a rough guide alongside the healthy BMI range.")],
    ("health.js",))

_src_sd = '<p class="hint">Rates checked on 24 November 2026 against <a href="https://www.gov.uk/stamp-duty-land-tax/residential-property-rates" target="_blank" rel="noopener">GOV.UK (SDLT)</a>, <a href="https://www.gov.scot/publications/scottish-budget-2026-2027-scottish-tax-ready-reckoners/pages/4/" target="_blank" rel="noopener">gov.scot (LBTT 2026–27)</a> and <a href="https://www.gov.wales/land-transaction-tax-rates-and-bands" target="_blank" rel="noopener">gov.wales (LTT)</a>. Always confirm with your solicitor or conveyancer.</p>'
tool_page("stamp-duty-calculator",
    "Stamp Duty Calculator 2026 – England, Scotland (LBTT) & Wales (LTT) | etoolbox",
    "Stamp duty calculator",
    "Work out the stamp duty on a home in England or Northern Ireland, Land and Buildings Transaction Tax in Scotland, or Land Transaction Tax in Wales. Covers first-time buyers, home movers, second homes and buy-to-let, with a band-by-band breakdown.",
    f"""
  <div class="gen"><form class="panel" data-stamp novalidate>
    <label for="sd-price">Property price (£)</label><input type="text" id="sd-price" name="price" inputmode="decimal" value="300,000">
    <label for="sd-region">Where is the property?</label><select id="sd-region" name="region"><option value="england">England or Northern Ireland (SDLT)</option><option value="scotland">Scotland (LBTT)</option><option value="wales">Wales (LTT)</option></select>
    <label for="sd-buyer">I am</label><select id="sd-buyer" name="buyer"><option value="mover">Moving home (replacing my main home)</option><option value="ftb">A first-time buyer</option><option value="additional">Buying a second home or buy-to-let</option></select>
    <label class="check" id="sd-nonres"><input type="checkbox" name="nonres"> I'm not a UK resident (2% surcharge)</label>
    {_src_sd}
  </form><div class="panel" id="hc-out-sd"><div id="sd-out" aria-live="polite"></div></div></div>""",
    """<h2>Stamp duty rates in England and Northern Ireland</h2><table class="sal-table"><thead><tr><th>Portion of the price</th><th>Standard</th><th>Additional property</th></tr></thead><tbody>
<tr><td>Up to £125,000</td><td>0%</td><td>5%</td></tr><tr><td>£125,001 – £250,000</td><td>2%</td><td>7%</td></tr><tr><td>£250,001 – £925,000</td><td>5%</td><td>10%</td></tr><tr><td>£925,001 – £1.5 million</td><td>10%</td><td>15%</td></tr><tr><td>Over £1.5 million</td><td>12%</td><td>17%</td></tr></tbody></table>
<p><strong>First-time buyers</strong> pay nothing up to £300,000 and 5% from £300,001 to £500,000. Above £500,000, standard rates apply to the whole price. Non-UK residents pay an extra 2%.</p>
<h2>Scotland (LBTT)</h2><p>0% up to £145,000 (£175,000 for first-time buyers), 2% to £250,000, 5% to £325,000, 10% to £750,000 and 12% above. Second homes pay an 8% Additional Dwelling Supplement on the whole price.</p>
<h2>Wales (LTT)</h2><p>0% up to £225,000, 6% to £400,000, 7.5% to £750,000, 10% to £1.5 million and 12% above. There's no first-time buyer relief. Additional properties pay higher rates, from 5% on the first £180,000.</p>
<p>If you're replacing your main home but haven't sold the old one yet, you usually pay the higher rates and can claim a refund if you sell it within the time limit (usually 3 years). Shared ownership, mixed-use and non-residential purchases have different rules.</p>""",
    [("Do first-time buyers pay stamp duty?", "In England and Northern Ireland, not on homes up to £300,000. Between £300,000 and £500,000, you pay 5% on the part above £300,000. In Scotland, first-time buyers pay nothing up to £175,000; Wales has no special relief, but nothing is due below £225,000."),
     ("How much is stamp duty on a £300,000 house?", "For a home mover in England: £5,000. For a first-time buyer: £0. For a second home: £20,000."),
     ("When do I pay?", "Your solicitor or conveyancer usually pays it for you within 14 days of completion in England and Northern Ireland, and 30 days in Scotland and Wales.")],
    ("property.js",))

tool_page("student-loan-repayment-calculator",
    "Student Loan Repayment Calculator 2026/27 – Plan 1, 2, 4, 5 & Postgraduate | etoolbox",
    "Student loan repayment calculator",
    "See how much comes out of your pay each month for your student loan in the 2026/27 tax year, for Plan 1, 2, 4 or 5 and Postgraduate Loans. Optionally, estimate whether you'll clear your balance before it's written off.",
    """
  <div class="gen"><form class="panel" data-loan novalidate>
    <label for="sl-sal">Annual salary before tax (£)</label><input type="text" id="sl-sal" name="salary" inputmode="decimal" value="35,000">
    <label for="sl-plan">Undergraduate loan</label><select id="sl-plan" name="plan"><option value="p2">Plan 2: England or Wales, started 2012–2023</option><option value="p5">Plan 5: England, started from August 2023</option><option value="p1">Plan 1: England or Wales before 2012, or Northern Ireland</option><option value="p4">Plan 4: Scotland</option><option value="none">No undergraduate loan</option></select>
    <label class="check"><input type="checkbox" name="pg"> I also have a Postgraduate (Master's or Doctoral) Loan</label>
    <h3 class="lb-h">Will I pay it off? <span class="muted">(optional)</span></h3>
    <label for="sl-bal">Current loan balance (£)</label><input type="text" id="sl-bal" name="balance" inputmode="decimal" placeholder="e.g. 45,000">
    <div class="row"><div><label for="sl-rate">Interest rate (%)</label><input type="number" id="sl-rate" name="rate" step="0.1" value="4.1"></div><div><label for="sl-growth">Pay rise each year (%)</label><input type="number" id="sl-growth" name="growth" step="0.1" value="3"></div></div>
    <p class="hint">2026/27 thresholds: Plan 1 £26,900 · Plan 2 £29,385 · Plan 4 £33,795 · Plan 5 £25,000 · Postgraduate £21,000. Sources: <a href="https://www.gov.uk/repaying-your-student-loan/what-you-pay" target="_blank" rel="noopener">GOV.UK</a> and the Department for Education's threshold announcements.</p>
  </form><div class="panel" id="sl-out" aria-live="polite"></div></div>""",
    """<h2>How student loan repayments work</h2><p>You repay <strong>9%</strong> of your income above your plan's threshold (6% above £21,000 for a Postgraduate Loan). If you have a Postgraduate Loan as well as an undergraduate loan, you repay both at the same time. Repayments are taken through PAYE by your employer, or through Self Assessment if you're self-employed.</p>
<p>Your repayments depend on what you <em>earn</em>, not on how much you owe, and any balance left is written off after a set time (25 to 40 years depending on your plan). That's why many graduates on Plan 2 and Plan 5 never repay the full amount, and why paying extra early doesn't always save money.</p>""",
    [("How much will I repay on £30,000?", "On Plan 2: 9% of £615 (the amount over £29,385) is about £55 a year, or £4.61 a month. On Plan 5: 9% of £5,000 is £450 a year, or £37.50 a month."),
     ("Which plan am I on?", "It depends on where you lived and when you started your course. Check your plan in your online student loan account or on your payslip."),
     ("Does my student loan affect my credit rating?", "No. Student loans don't appear on your credit file, though mortgage lenders consider the monthly repayments as an outgoing.")],
    ("property.js",))
