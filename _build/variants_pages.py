# Render the format landing pages defined in variants_data.py
def variant_page(v):
    base, slug, label, h1, title, intro, about, steps, faqs, repl = v
    src = TOOL_SRC[base]
    ui = src["ui"]
    for a, b in repl:
        ui = ui.replace(a, b)
    path = f"/{slug}/"
    cat = CAT_OF[base]
    base_name = dict((t[0], t[2]) for t in cat[3])[base]
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": html.unescape(base_name), "item": SITE + f"/{base}/"},
        {"@type": "ListItem", "position": 3, "name": html.unescape(h1), "item": SITE + path}]}
    nav = (f'<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/{base}/">{base_name}</a>'
           f'<span aria-hidden="true">›</span><span aria-current="page">{label}</span></nav>')
    sibs = [x for x in VARIANT_LINKS.get(base, []) if x[0] != slug]
    sib_html = "".join(f'<a class="pop" href="/{s}/">{l}</a>' for s, l in sibs)
    body = (f"<h2>How to convert {label}</h2><ol>" + "".join(f"<li>{x}</li>" for x in steps) + "</ol>"
            f"<h2>Good to know</h2><p>{about}</p>"
            f'<p>This page uses our <a href="/{base}/">{base_name}</a> tool, set up for {label}.</p>')
    page = head(title, intro, path, faq_ld(faqs) + app_ld(h1, path) + f'<script type="application/ld+json">{json.dumps(ld)}</script>\n' + src["extra"]) + f"""
<div class="wrap">
  {nav}
  <div class="page-head" data-slug="{base}"><div class="ph-row">{tool_icon(base)}<h1>{h1}<button type="button" class="fav-btn" aria-pressed="false">☆ Add to favourites</button></h1></div><p>{intro}</p>{privacy_tag(base)}</div>
  {ui}
  {share_bar(path, html.unescape(h1) + " – free, no sign-up, nothing uploaded")}
  <section class="prose">{body}</section>
  {('<section class="var-links"><h2>Other conversions</h2><div class="pops">' + sib_html + '</div></section>') if sibs else ""}
  {faq_html(faqs)}
  {related(base)}
</div>
""" + foot(src["scripts"])
    write(path, page)


for _v in VARIANTS:
    variant_page(_v)
EXTRA_PATHS = globals().get("EXTRA_PATHS", []) + [f"/{v[1]}/" for v in VARIANTS]
