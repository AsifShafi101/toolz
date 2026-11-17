# Website and web tool development services: a band on the homepage and the /web-development/ page.
SERVICES_PATH = "/web-development/"

PROJECTS = [
    dict(name="Al-Fitrah Academy", url="https://www.alfitrahacademy.com/", domain="alfitrahacademy.com", tag="Education · UK non-profit",
         c1="#0F1E46", c2="#d8b25a", head="Learn the Qur'an online", sub="Live classes for children, young girls and women", btn="Register now",
         desc="Website for a UK non-profit that teaches live online Qur'an classes in English, Urdu, Pashto, Dari and Punjabi.",
         feats=["Courses, fees and online registration", "Student login, recordings and resource library", "Fees, donations and shop pages"]),
    dict(name="KL-UK", url="https://kl-tech.co.uk/", domain="kl-tech.co.uk", tag="Telecom engineering · B2B",
         c1="#0A2745", c2="#35c3e8", head="5G SA, IMS, IT & Telecom Operations Experts", sub="From radio to data centre", btn="Our services",
         desc="Website for a UK telecom engineering company covering 5G Standalone, IMS and VoLTE, DevOps, testing and data centre support.",
         feats=["A page for every specialist service", "Built for search: structured, fast service pages", "Clear routes to get in touch"]),
    dict(name="Sky Gold", url="https://www.skygoldltd.co.uk/", domain="skygoldltd.co.uk", tag="E-commerce · Food & gifts",
         c1="#24104f", c2="#f2b632", head="Premium dry fruits & nuts", sub="Delivered across the UK", btn="Shop now",
         desc="Online shop for premium dry fruits, nuts, healthy snacks and gift hampers, delivering across the UK.",
         feats=["Shop by category, best sellers, 250 g to 1 kg packs", "Build-your-own mix with live pricing", "Wholesale, delivery, returns and FAQs"]),
]

SERVICES = [
    ("monitor-smartphone", "Business websites", "Fast, mobile-first websites that look professional and are built to be found on Google."),
    ("shopping-cart", "Online shops", "Product catalogues, baskets, secure card payments and delivery options, ready to sell."),
    ("calculator", "Custom web tools", "Quote calculators, booking and order forms, price builders and internal dashboards, built like the tools on etoolbox."),
    ("graduation-cap", "Portals & memberships", "Registration, logins, course pages, fees and donations for schools, academies and clubs."),
    ("search", "SEO & speed", "Search Console, structured data, page speed and content that helps the right customers find you."),
    ("shield-check", "Care & support", "Updates, backups, security checks and small changes, so your site keeps working."),
]

STEPS = [
    ("Free consultation", "Tell us what you need. We'll suggest the simplest way to get there and send a clear quote before any work starts."),
    ("Design & build", "We design around your brand and build it. You see progress and give feedback along the way."),
    ("Launch", "We connect your domain, set up Google Search Console and analytics, and check everything on phones and computers."),
    ("Ongoing support", "Need changes later? We're here for updates, new pages and new features as your business grows."),
]

SVC_FAQ = [
    ("How much does a website cost?", "It depends on what you need: a few pages, an online shop or a custom tool. Tell us about your project and we'll send a clear quote before any work starts, with no obligation."),
    ("How long does it take?", "A small business website usually takes a few weeks from the first call to launch. Shops, portals and custom tools take longer, and we'll agree a timeline with you up front."),
    ("Will my website work on phones?", "Yes. Everything we build is designed for phones first, then tablets and computers."),
    ("Will I own my website?", "Yes. Your domain, your content and your website are yours."),
    ("Can you build a tool or calculator for my website?", "Yes. That's our speciality: every one of the free tools on etoolbox was built by us. We can build calculators, quote builders, booking forms and other tools that fit your business."),
    ("Can you improve my existing website?", "Yes. We can speed it up, improve its search ranking, refresh the design or add new features without starting again."),
]

for _i in ("monitor-smartphone", "shopping-cart", "calculator", "graduation-cap", "search", "shield-check", "arrow-up-right", "send", "check"):
    if _i not in UI_ICONS:
        UI_ICONS.append(_i)


def project_shot(p):
    return (f'<div class="pj-shot" style="--pc:{p["c1"]};--pa:{p["c2"]}" aria-hidden="true">'
            f'<div class="pj-bar"><i></i><i></i><i></i><span>{p["domain"]}</span></div>'
            f'<div class="pj-nav"><b>{p["name"]}</b><i></i><i></i><i></i></div>'
            f'<div class="pj-hero"><strong>{p["head"]}</strong><small>{p["sub"]}</small><span class="pj-btn">{p["btn"]}</span></div>'
            f'<div class="pj-cards"><i></i><i></i><i></i></div></div>')


def project_card(p, full=False):
    feats = "".join(f"<li>{svg('check')}{f}</li>" for f in p["feats"]) if full else ""
    return (f'<a class="pj" href="{p["url"]}" target="_blank" rel="noopener">{project_shot(p)}'
            f'<div class="pj-body"><span class="pj-tag">{p["tag"]}</span><h3>{p["name"]}</h3><p>{p["desc"]}</p>'
            f'{"<ul class=pj-feat>" + feats + "</ul>" if full else ""}<span class="pj-link">Visit {p["domain"]} {svg("arrow-up-right")}</span></div></a>')


def services_band():
    """Homepage section: our development services, with recent projects."""
    svc = "".join(f'<li>{svg(i)}<div><strong>{t}</strong><span>{d}</span></div></li>' for i, t, d in SERVICES[:4])
    return f"""<section class="svc-band" id="services" aria-labelledby="svc-h">
  <div class="svc-intro">
    <span class="svc-eyebrow">{svg("sparkles")} Website &amp; tool development</span>
    <h2 id="svc-h">Need a website or a custom tool? We build those too.</h2>
    <p>The team behind etoolbox designs and builds fast, professional websites, online shops and web tools for UK businesses, schools and charities.</p>
    <ul class="svc-mini">{svc}</ul>
    <div class="svc-cta"><a class="btn" href="{SERVICES_PATH}#quote">Get a free quote</a><a class="btn ghost" href="{SERVICES_PATH}">See our services</a></div>
  </div>
  <div class="svc-work"><h3 class="svc-work-h">Recent projects</h3><div class="pj-list">{"".join(project_card(p) for p in PROJECTS)}</div></div>
</section>"""


def services_page():
    path = SERVICES_PATH
    ld = faq_ld(SVC_FAQ) + '<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org", "@type": "ProfessionalService", "name": "etoolbox – Website & web tool development",
        "url": SITE + path, "areaServed": "GB", "email": "hello@etoolbox.co.uk", "parentOrganization": {"@id": SITE + "/#org"},
        "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Development services", "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": t, "description": d}} for _, t, d in SERVICES]}}) + "</script>\n"
    svc = "".join(f'<li class="svc-card"><span class="svc-ic">{svg(i)}</span><h3>{t}</h3><p>{d}</p></li>' for i, t, d in SERVICES)
    steps = "".join(f'<li><span class="num">{n}</span><h3>{a}</h3><p>{b}</p></li>' for n, (a, b) in enumerate(STEPS, 1))
    opts = "".join(f"<option>{t}</option>" for _, t, _ in SERVICES) + "<option>Something else</option>"
    page = head("Website & Web Tool Development for UK Businesses | etoolbox",
                "Professional websites, online shops, portals and custom web tools for UK businesses, schools and charities. See our recent projects and get a free quote.",
                path, ld, "svc-page") + f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Website &amp; tool development</span></nav>
  <section class="svc-hero">
    <div>
      <span class="svc-eyebrow">{svg("sparkles")} Website &amp; tool development</span>
      <h1>Websites and web tools that work as hard as you do</h1>
      <p class="lead">We design and build fast, professional websites, online shops, portals and custom tools for UK businesses, schools and charities. The same team built every tool on etoolbox.</p>
      <div class="svc-cta"><a class="btn" href="#quote">Get a free quote</a><a class="btn ghost" href="#work">See our work</a></div>
      <ul class="svc-points"><li>{svg("check")}Mobile-first and fast</li><li>{svg("check")}Built to be found on Google</li><li>{svg("check")}Clear quote before we start</li><li>{svg("check")}You own your website</li></ul>
    </div>
    <div class="svc-hero-shot">{project_shot(PROJECTS[2])}{project_shot(PROJECTS[0])}</div>
  </section>

  <section><div class="sec-head"><h2>What we build</h2></div><ul class="svc-grid">{svc}</ul></section>

  <section id="work"><div class="sec-head"><h2>Recent projects</h2></div>
    <div class="pj-list pj-full">{"".join(project_card(p, True) for p in PROJECTS)}</div></section>

  <section class="how"><h2>How we work</h2><ol class="steps steps4">{steps}</ol></section>

  <section class="prose svc-why"><h2>Why work with us?</h2>
    <ul>
      <li><strong>We build tools, not just pages.</strong> etoolbox has {len(TOOLS)} free tools, from PDF editing to invoices and calculators, all designed and built by us. Your website can do more than show information.</li>
      <li><strong>Speed and search come as standard.</strong> Fast pages, clean code and proper search setup help customers find you and stay.</li>
      <li><strong>Plain English, clear quotes.</strong> You'll know what you're getting and what it costs before any work starts.</li>
      <li><strong>UK-based.</strong> We work with businesses, schools and charities across the UK.</li>
    </ul>
  </section>

  <section id="quote" class="svc-quote">
    <div class="svc-quote-copy"><h2>Get a free quote</h2>
      <p>Tell us a little about your project. Pressing the button opens an email to us with your details filled in, ready to send.</p>
      <p class="muted">Prefer to write yourself? Email <a href="mailto:hello@etoolbox.co.uk?subject=Website%20enquiry">hello@etoolbox.co.uk</a>.</p></div>
    <form class="svc-form" id="svc-form" novalidate>
      <div class="field"><label for="q-name">Your name</label><input type="text" id="q-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="q-biz">Business or organisation</label><input type="text" id="q-biz" name="biz" autocomplete="organization"></div>
      <div class="field"><label for="q-what">What do you need?</label><select id="q-what" name="what">{opts}</select></div>
      <div class="field"><label for="q-budget">Budget</label><select id="q-budget" name="budget"><option>Not sure yet</option><option>Under £500</option><option>£500 – £1,500</option><option>£1,500 – £5,000</option><option>£5,000+</option></select></div>
      <div class="field full"><label for="q-msg">About your project</label><textarea id="q-msg" name="msg" rows="5" placeholder="What does your business do, and what should the website or tool do? Any sites you like?"></textarea></div>
      <div class="full"><button class="btn" type="submit">{svg("send")} Write my enquiry email</button><p class="svc-form-msg" id="svc-form-msg" role="status"></p></div>
    </form>
  </section>
  {faq_html(SVC_FAQ)}
</div>
<script>
document.getElementById("svc-form").addEventListener("submit", function (e) {{
  e.preventDefault();
  var f = e.target, g = function (n) {{ return (f.elements[n].value || "").trim(); }}, msg = document.getElementById("svc-form-msg");
  if (!g("name")) {{ msg.textContent = "Please add your name."; f.elements.name.focus(); return; }}
  var body = "Name: " + g("name") + "\\nBusiness: " + (g("biz") || "-") + "\\nService: " + g("what") + "\\nBudget: " + g("budget") + "\\n\\n" + (g("msg") || "");
  location.href = "mailto:hello@etoolbox.co.uk?subject=" + encodeURIComponent("Website enquiry: " + g("what") + (g("biz") ? " for " + g("biz") : "")) + "&body=" + encodeURIComponent(body);
  msg.textContent = "Your email app should open with your enquiry. If it doesn't, email hello@etoolbox.co.uk.";
}});
</script>
""" + foot(())
    write(path, page)
