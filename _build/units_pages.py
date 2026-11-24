# ---------------- Single unit-conversion pages (cm-to-inches, kg-to-stone …) ----------------
# Factors match assets/units.js (base units: m, kg, l, m2, m/s, bytes). test29.js checks the live JS against these tables.
UF = {"mm": 0.001, "cm": 0.01, "m": 1, "km": 1000, "in": 0.0254, "ft": 0.3048, "yd": 0.9144, "mi": 1609.344,
      "g": 0.001, "kg": 1, "oz": 0.028349523125, "lb": 0.45359237, "st": 6.35029318,
      "ml": 0.001, "l": 1, "floz": 0.0284130625, "pt": 0.56826125, "gal": 4.54609, "cup": 0.25,
      "m2": 1, "ft2": 0.09290304, "acre": 4046.8564224, "ha": 10000,
      "ms": 1, "kmh": 1 / 3.6, "mph": 0.44704, "kn": 1852 / 3600, "MB": 1e6, "GB": 1e9}
UN = {  # unit: (short, singular, plural)
    "mm": ("mm", "millimetre", "millimetres"), "cm": ("cm", "centimetre", "centimetres"), "m": ("m", "metre", "metres"), "km": ("km", "kilometre", "kilometres"),
    "in": ("in", "inch", "inches"), "ft": ("ft", "foot", "feet"), "yd": ("yd", "yard", "yards"), "mi": ("mi", "mile", "miles"),
    "g": ("g", "gram", "grams"), "kg": ("kg", "kilogram", "kilograms"), "oz": ("oz", "ounce", "ounces"), "lb": ("lb", "pound", "pounds"), "st": ("st", "stone", "stone"),
    "ml": ("ml", "millilitre", "millilitres"), "l": ("l", "litre", "litres"), "floz": ("fl oz", "UK fluid ounce", "UK fluid ounces"), "pt": ("pt", "UK pint", "UK pints"),
    "gal": ("gal", "UK gallon", "UK gallons"), "cup": ("cup", "metric cup", "metric cups"),
    "m2": ("m²", "square metre", "square metres"), "ft2": ("sq ft", "square foot", "square feet"), "acre": ("acre", "acre", "acres"), "ha": ("ha", "hectare", "hectares"),
    "kmh": ("km/h", "kilometre per hour", "kilometres per hour"), "mph": ("mph", "mile per hour", "miles per hour"), "kn": ("kn", "knot", "knots"),
    "MB": ("MB", "megabyte", "megabytes"), "GB": ("GB", "gigabyte", "gigabytes"),
    "c": ("°C", "degree Celsius", "degrees Celsius"), "f": ("°F", "degree Fahrenheit", "degrees Fahrenheit"), "k": ("K", "kelvin", "kelvin"),
    "mpg": ("mpg", "mile per gallon (UK)", "miles per gallon (UK)"), "l100": ("L/100 km", "litre per 100 km", "litres per 100 km")}
_L1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100]
UNIT_PAGES = [  # slug, category, from, to, values for the table, note
    ("cm-to-inches", "length", "cm", "in", _L1 + [150, 200], "TV and monitor sizes are measured in inches across the diagonal."),
    ("inches-to-cm", "length", "in", "cm", _L1 + [32, 36, 43, 50, 55, 65], "Screen sizes such as 55 inches are measured diagonally."),
    ("mm-to-inches", "length", "mm", "in", [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 19, 20, 22, 25, 30, 32, 40, 50, 100], "Spanners, drill bits and pipe sizes often come in both millimetres and fractions of an inch."),
    ("inches-to-mm", "length", "in", "mm", [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 6, 8, 10, 12], "1/8 in is 0.125, 1/4 in is 0.25 and 3/8 in is 0.375 as decimals."),
    ("feet-to-metres", "length", "ft", "m", _L1 + [200, 500, 1000], ""),
    ("metres-to-feet", "length", "m", "ft", [0.5, 1, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 3, 5, 10, 20, 50, 100, 1000], ""),
    ("cm-to-feet", "length", "cm", "ft", [100, 120, 140, 150, 155, 160, 163, 165, 168, 170, 173, 175, 178, 180, 183, 185, 188, 190, 193, 200], "Heights in the UK are often given in feet and inches, so the result shows both."),
    ("feet-to-cm", "length", "ft", "cm", [4, 4.5, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 7], "Enter feet and inches, for example 5 ft 10 in."),
    ("km-to-miles", "length", "km", "mi", [1, 2, 3, 5, 8, 10, 15, 20, 21.0975, 25, 30, 40, 42.195, 50, 80, 100, 160, 200, 500], "A half marathon is 21.0975 km (13.1 miles) and a marathon 42.195 km (26.2 miles)."),
    ("miles-to-km", "length", "mi", "km", [1, 2, 3, 5, 6.2, 10, 13.1, 20, 26.2, 30, 50, 60, 70, 100, 200, 500], "UK road signs and speed limits use miles."),
    ("yards-to-metres", "length", "yd", "m", [1, 2, 5, 10, 20, 25, 50, 100, 150, 200, 220, 440, 500, 1000, 1760], "There are 1,760 yards in a mile."),
    ("metres-to-yards", "length", "m", "yd", [1, 2, 5, 10, 20, 25, 50, 100, 200, 400, 500, 1000], ""),
    ("kg-to-lbs", "weight", "kg", "lb", [0.5, 1, 2, 2.5, 5, 10, 15, 20, 23, 25, 30, 40, 50, 60, 70, 80, 90, 100], "Airline baggage limits of 23 kg are about 50.7 lb."),
    ("lbs-to-kg", "weight", "lb", "kg", [1, 2, 5, 10, 15, 20, 25, 50, 100, 120, 140, 150, 160, 180, 200, 220, 250], ""),
    ("kg-to-stone", "weight", "kg", "st", [40, 45, 50, 55, 60, 63.5, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 150], "Body weight in the UK is usually given in stone and pounds; 1 stone is 14 lb."),
    ("stone-to-kg", "weight", "st", "kg", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 25], "Enter stone and pounds, for example 11 st 4 lb."),
    ("stone-to-lbs", "weight", "st", "lb", [1, 2, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20], "1 stone = 14 pounds exactly."),
    ("lbs-to-stone", "weight", "lb", "st", [14, 28, 50, 100, 112, 126, 140, 154, 168, 182, 196, 210, 224, 252, 280], "1 stone = 14 pounds exactly."),
    ("grams-to-ounces", "weight", "g", "oz", [1, 5, 10, 25, 28, 50, 100, 125, 150, 200, 225, 250, 300, 400, 454, 500, 1000], "Handy for older British recipes that use ounces."),
    ("ounces-to-grams", "weight", "oz", "g", [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16], "16 oz make 1 lb."),
    ("celsius-to-fahrenheit", "temperature", "c", "f", [-40, -20, -10, -5, 0, 5, 10, 15, 18, 20, 21, 22, 25, 30, 35, 37, 38, 40, 50, 100, 180, 200, 220], "37 °C (98.6 °F) is normal body temperature; 180 °C is a common oven setting (gas mark 4)."),
    ("fahrenheit-to-celsius", "temperature", "f", "c", [0, 32, 40, 50, 60, 65, 68, 70, 72, 75, 80, 90, 98.6, 100, 212, 350, 400, 425, 450], "American recipes often use 350 °F, which is about 180 °C."),
    ("celsius-to-kelvin", "temperature", "c", "k", [-273.15, -100, -40, 0, 20, 25, 37, 100, 1000], "0 K is absolute zero, −273.15 °C."),
    ("litres-to-gallons", "volume", "l", "gal", [1, 5, 10, 20, 40, 45, 50, 55, 60, 70, 80, 100, 200, 1000], "These are UK gallons (4.546 litres). A US gallon is smaller, 3.785 litres."),
    ("gallons-to-litres", "volume", "gal", "l", [1, 2, 5, 10, 12, 15, 20, 50, 100], "These are UK (imperial) gallons."),
    ("ml-to-fl-oz", "volume", "ml", "floz", [5, 10, 15, 25, 30, 50, 100, 150, 200, 250, 300, 500, 568, 1000], "These are UK fluid ounces (28.41 ml). A US fluid ounce is 29.57 ml."),
    ("fl-oz-to-ml", "volume", "floz", "ml", [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 40], "There are 20 UK fluid ounces in a UK pint."),
    ("litres-to-pints", "volume", "l", "pt", [0.25, 0.5, 0.568, 1, 1.5, 2, 2.5, 3, 4, 5, 10], "A UK pint is 568 ml; a US pint is 473 ml."),
    ("pints-to-litres", "volume", "pt", "l", [0.25, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 20], "These are UK pints, as served in British pubs."),
    ("cups-to-ml", "volume", "cup", "ml", [0.25, 0.333333, 0.5, 0.666667, 0.75, 1, 1.5, 2, 3, 4], "This uses the metric cup (250 ml) found in UK and Australian recipes. A US cup is about 237 ml."),
    ("ml-to-cups", "volume", "ml", "cup", [50, 60, 75, 100, 125, 150, 200, 250, 300, 375, 500, 750, 1000], "This uses the metric cup (250 ml)."),
    ("square-metres-to-square-feet", "area", "m2", "ft2", [1, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 500, 1000], "Estate agents often list floor areas in both."),
    ("square-feet-to-square-metres", "area", "ft2", "m2", [10, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000], ""),
    ("acres-to-hectares", "area", "acre", "ha", [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 500, 1000], "A football pitch is roughly 1.75 acres (0.7 hectares)."),
    ("hectares-to-acres", "area", "ha", "acre", [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 1000], ""),
    ("mph-to-kmh", "speed", "mph", "kmh", [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 100, 120, 150, 200], "UK speed limits are 20, 30, 40, 50, 60 and 70 mph."),
    ("kmh-to-mph", "speed", "kmh", "mph", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 150, 200, 300], "Most of Europe uses km/h: 130 km/h is about 81 mph."),
    ("knots-to-mph", "speed", "kn", "mph", [1, 5, 10, 15, 20, 25, 30, 40, 50, 100, 500], "Knots are used for wind speed at sea and for aircraft."),
    ("mb-to-gb", "data", "MB", "GB", [1, 10, 50, 100, 250, 500, 750, 1000, 2000, 5000, 10000], "This uses decimal units (1 GB = 1,000 MB), as phone networks and drive makers do. Windows uses binary units, where 1 GB = 1,024 MB."),
    ("gb-to-mb", "data", "GB", "MB", [0.1, 0.5, 1, 2, 4, 5, 8, 10, 16, 32, 64, 128], "This uses decimal units (1 GB = 1,000 MB)."),
    ("mpg-to-litres-per-100km", "fuel", "mpg", "l100", [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70], "This uses UK gallons. A UK-mpg figure is about 20% higher than a US one for the same car."),
    ("litres-per-100km-to-mpg", "fuel", "l100", "mpg", [3, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10, 12, 15], "This gives UK miles per gallon."),
]


def uconv(cat, a, b, v):
    if cat == "temperature":
        c = (v - 32) * 5 / 9 if a == "f" else v - 273.15 if a == "k" else v
        return c * 9 / 5 + 32 if b == "f" else c + 273.15 if b == "k" else c
    if cat == "fuel":  # UK mpg <-> L/100 km
        k = 100 * 4.54609 / 1.609344
        return k / v if v else float("inf")
    return v * UF[a] / UF[b]


def ufmt(x, dp=None):
    if x == float("inf"):
        return "–"
    if dp is None:
        a = abs(x)
        dp = 0 if a >= 1000 else 1 if a >= 100 else 2 if a >= 10 else 3 if a >= 1 else 4
    s = f"{x:,.{dp}f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s.replace("-", "−")


def vfmt(v):
    s = f"{v:,.6f}".rstrip("0").rstrip(".")
    return s.replace("-", "−")


def ucompound(to, v):
    if to == "ft":
        ft = int(v)
        inch = round((v - ft) * 12, 1)
        if inch >= 12:
            ft, inch = ft + 1, 0
        return f"{ft} ft {ufmt(inch, 1)} in"
    if to == "st":
        st = int(v)
        lb = round((v - st) * 14, 1)
        if lb >= 14:
            st, lb = st + 1, 0
        return f"{st} st {ufmt(lb, 1)} lb"
    return None


def uname(u, v=2):
    return UN[u][1] if v == 1 else UN[u][2]


def unit_link_label(s):
    return s[0].replace("-", " ").replace("litres per 100km", "L/100 km").replace(" to ", " → ").replace("kmh", "km/h").replace("mb", "MB").replace("gb", "GB").replace("mpg", "mpg")


VARIANT_LINKS["unit-converter"] = [(p[0], unit_link_label(p)) for p in UNIT_PAGES]
UNIT_SLUGS = {p[0] for p in UNIT_PAGES}


def unit_page(p):
    slug, cat, a, b, vals, note = p
    path = f"/{slug}/"
    A, B = UN[a], UN[b]
    one = uconv(cat, a, b, 1)
    NICE = {"c": "Celsius", "f": "Fahrenheit", "k": "kelvin", "mpg": "UK mpg", "l100": "litres per 100 km"}
    nA, nB = NICE.get(a, A[2]), NICE.get(b, B[2])
    nameA = nA if nA.startswith("UK") else nA[0].upper() + nA[1:]
    h1 = f"{nameA} to {nB}"
    shortA = A[0].replace("°", "").upper() if cat in ("temperature",) else A[0]
    title = f"{nameA} to {nB if nB.startswith('UK') else nB[0].upper() + nB[1:]} ({A[0]} to {B[0]}) Converter | etoolbox"
    if cat == "temperature":
        formula = ("°F = °C × 9/5 + 32" if (a, b) == ("c", "f") else "°C = (°F − 32) × 5/9" if (a, b) == ("f", "c") else "K = °C + 273.15")
    elif cat == "fuel":
        formula = f"{B[0]} = 282.481 ÷ {A[0]}"
    else:
        formula = f"{B[0]} = {A[0]} × {ufmt(one, 6 if one < 0.01 else 5 if one < 1 else 4)}" if one < 1000 else f"{B[0]} = {A[0]} × {ufmt(one, 0)}"
        if one < 1 and one > 0:
            formula += f" (or {A[0]} ÷ {ufmt(1 / one, 4)})"
    if cat == "temperature":
        oneline = formula
    elif cat == "fuel":
        oneline = f"30 mpg = {ufmt(uconv(cat, a, b, 30), 2)} L/100 km" if a == "mpg" else f"6 L/100 km = {ufmt(uconv(cat, a, b, 6), 1)} mpg"
    elif b in ("ft", "st"):
        oneline = f"1 {B[1]} = {ufmt(1 / one, 4)} {A[0]}"
    else:
        oneline = f"1 {A[1]} = {ufmt(one, 6 if abs(one) < 0.01 else 4)} {B[0]}"
    intro = (f"Convert {nA} to {nB} instantly. {oneline}. Type a number to convert it, or use the table of common values below.")
    rows = "".join(f"<tr><td>{vfmt(v)} {A[0]}</td><td>{ucompound(b, uconv(cat, a, b, v)) or (ufmt(uconv(cat, a, b, v)) + ' ' + B[0])}</td></tr>" for v in vals)
    two_in = a in ("ft", "st")
    sub = {"ft": ("in", "inches"), "st": ("lb", "pounds")}.get(a)
    ui = f"""
  <div class="gen"><form class="panel" data-unitpage data-cat="{cat}" data-from="{a}" data-to="{b}" novalidate>
    <label for="up-v">{nameA}</label>
    <div class="up-in"><input type="text" id="up-v" name="v" inputmode="decimal" value="{ufmt(vals[min(4, len(vals) - 1)]) if not two_in else ('5' if a == 'ft' else '11')}" autocomplete="off"><span>{A[0]}</span>
    {f'<input type="text" id="up-v2" name="v2" inputmode="decimal" value="{"10" if a == "ft" else "4"}" aria-label="{sub[1]}" autocomplete="off"><span>{sub[0]}</span>' if two_in else ''}</div>
    <p class="hint">Formula: <code>{formula}</code></p>
    <p class="hint"><a href="/unit-converter/?cat={cat}">Convert other {cat} units →</a></p>
  </form>
  <div class="panel preview"><div class="calc-out" id="up-out" aria-live="polite"></div></div></div>"""
    rev = next((q for q in UNIT_PAGES if q[2] == b and q[3] == a), None)
    same = [q for q in UNIT_PAGES if q[1] == cat and q[0] != slug]
    others = [q for q in UNIT_PAGES if q[1] != cat]
    body = (f"<h2>{nameA} to {nB} chart</h2><table class='sal-table up-table'><thead><tr><th>{nameA}</th><th>{nB[0].upper() + nB[1:]}</th></tr></thead><tbody>{rows}</tbody></table>"
            + (f"<p>{note}</p>" if note else "")
            + (f"<p>Need it the other way round? Use <a href='/{rev[0]}/'>{UN[rev[2]][2]} to {UN[rev[3]][2]}</a>.</p>" if rev else "")
            + "<h2>More conversions</h2><div class='pops'>" + "".join(f"<a class='pop' href='/{q[0]}/'>{unit_link_label(q)}</a>" for q in same + others[:12]) + "</div>")
    ex = vals[min(4, len(vals) - 1)]
    faqs = [(f"How many {B[2]} in a {A[1]}?" if cat not in ("temperature", "fuel") else f"How do you convert {A[2]} to {B[2]}?",
             (f"There are {ufmt(one, 6 if abs(one) < 0.01 else 4)} {B[2]} in one {A[1]}." if cat not in ("temperature", "fuel") else f"Use the formula {formula}.")),
            (f"What is {vfmt(ex)} {A[0]} in {B[2]}?", f"{vfmt(ex)} {A[0]} is {ucompound(b, uconv(cat, a, b, ex)) or (ufmt(uconv(cat, a, b, ex)) + ' ' + B[0])}.")]
    if note:
        faqs.append(("Anything to watch out for?", note))
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Unit converter", "item": SITE + "/unit-converter/"},
        {"@type": "ListItem", "position": 3, "name": h1, "item": SITE + path}]}
    nav = (f'<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/unit-converter/">Unit converter</a>'
           f'<span aria-hidden="true">›</span><span aria-current="page">{h1}</span></nav>')
    page = head(title, intro, path, faq_ld(faqs) + app_ld(h1, path) + f'<script type="application/ld+json">{json.dumps(ld)}</script>\n') + f"""
<div class="wrap">
  {nav}
  <div class="page-head" data-slug="unit-converter"><div class="ph-row">{tool_icon("unit-converter")}<h1>{h1}</h1></div><p>{intro}</p></div>
  {ui}
  {share_bar(path, h1 + " converter – free")}
  <section class="prose">{body}</section>
  {faq_html(faqs)}
  {related("unit-converter")}
</div>
""" + foot(("units.js", "unitpage.js"))
    write(path, page)


for _u in UNIT_PAGES:
    unit_page(_u)
EXTRA_PATHS = globals().get("EXTRA_PATHS", []) + [f"/{u[0]}/" for u in UNIT_PAGES]
