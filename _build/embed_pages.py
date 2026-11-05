# Embeddable calculators: other sites paste an <iframe>; each embed links back to etoolbox.
EMBEDS = [
    ("take-home-pay", "take-home-pay-calculator", "UK take-home pay calculator", 760),
    ("vat", "vat-calculator", "UK VAT calculator", 560),
    ("mileage", "mileage-allowance-calculator", "HMRC mileage allowance calculator", 600),
    ("hourly-rate", "hourly-rate-calculator", "Freelance hourly rate calculator", 640),
]


def embed_code(key, height):
    return f'<iframe src="{SITE}/embed/{key}/" title="{dict((e[0], e[2]) for e in EMBEDS)[key]} by etoolbox" width="100%" height="{height}" style="border:0;max-width:720px" loading="lazy"></iframe>'


for key, base, name, height in EMBEDS:
    src = TOOL_SRC[base]
    scripts = "\n".join(f'<script src="/assets/{x}"></script>' for x in src["scripts"])
    write(f"/embed/{key}/", f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name} – etoolbox</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="{SITE}/{base}/">
<link rel="stylesheet" href="/assets/style.css"><style>html,body{{background:transparent!important}}body{{margin:0;padding:8px}}#page-net,.fad{{display:none!important}}
.gen{{grid-template-columns:1fr!important}}.emb-by{{margin:10px 2px 0;font:600 13px/1.4 Inter,system-ui,sans-serif;color:#46557a}}.emb-by a{{color:#ff6b35;text-decoration:none}}</style></head>
<body class="embed">{src["ui"]}
<p class="emb-by">Free {name} by <a href="{SITE}/{base}/" target="_blank" rel="noopener">etoolbox.co.uk</a></p>
{scripts}</body></html>""")

_cards = ""
for key, base, name, height in EMBEDS:
    code = html.escape(embed_code(key, height))
    _cards += f"""<section class="emb-card"><h2>{name}</h2>
<iframe src="/embed/{key}/" title="{name} preview" width="100%" height="{height}" style="border:1px solid var(--line);border-radius:14px;background:var(--card)" loading="lazy"></iframe>
<label for="code-{key}" style="margin-top:12px">Copy this code into your website</label>
<textarea id="code-{key}" class="emb-code" readonly rows="3">{code}</textarea>
<button type="button" class="btn small emb-copy" data-for="code-{key}">Copy code</button></section>"""

_faqs = [("Is it really free?", "Yes. Free for any website, personal or business. Please keep the small “by etoolbox.co.uk” credit."),
         ("Will the numbers stay up to date?", "Yes. The calculator loads from etoolbox, so when tax rates change each April your embedded version updates automatically."),
         ("Does it work with WordPress, Wix and Squarespace?", "Yes. Paste the code into a Custom HTML block (WordPress), an Embed element (Wix) or a Code block (Squarespace)."),
         ("Do you track my visitors?", "No. There are no ads or tracking cookies in the embedded calculators.")]
write("/embed/", head("Free UK Calculators for Your Website – Embed Code | etoolbox",
      "Add a free UK take-home pay, VAT, mileage or hourly rate calculator to your website or blog. Copy one line of code. Always up to date with HMRC rates.",
      "/embed/", faq_ld(_faqs)) + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Calculators for your website</span></nav>
  <div class="page-head"><h1>Free calculators for your website</h1>
  <p>Add a UK take-home pay, VAT, mileage or hourly rate calculator to your blog, accountancy site, recruitment page or intranet. It's one line of code, free, with no ads, and it updates automatically when tax rates change.</p></div>
  <div class="emb-grid">{_cards}</div>
  {faq_html(_faqs)}
</div>
<script>document.querySelectorAll('.emb-copy').forEach(function(b){{b.addEventListener('click',function(){{var t=document.getElementById(b.dataset.for);t.select();(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.resolve(document.execCommand('copy'))).then(function(){{b.textContent='Copied!';setTimeout(function(){{b.textContent='Copy code'}},1600)}})}})}})</script>
""" + foot(()))
EXTRA_PATHS = EXTRA_PATHS + ["/embed/"]
