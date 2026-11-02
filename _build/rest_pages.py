# ---------------- Pricing ----------------

pricing_faqs = [
    ("What's the difference between free and Pro QR codes?", "Free (static) codes contain your link directly and can never change. Pro (dynamic) codes point to a short etoolbox link that you control, so you can change the destination at any time and see how many scans it gets."),
    ("What happens to my Pro codes if I cancel?", "We'll give you plenty of notice and a chance to move your links before anything stops. Your free codes are never affected."),
    ("Can I cancel any time?", "Yes. Monthly plans can be cancelled at any time."),
]
pricing = head("Pricing – Free & Pro QR Codes | etoolbox",
               "Free QR codes for everyone. Pro adds editable dynamic QR codes, scan statistics and unbranded table cards for UK small businesses.",
               "/pricing/", faq_ld(pricing_faqs)) + """
<div class="wrap">
  <div class="hero" style="padding-bottom:24px">
    <h1>Simple pricing</h1>
    <p class="lead">Free tools for everyone. Upgrade when you need codes you can edit after printing.</p>
  </div>
  <div class="plans">
    <div class="plan">
      <h3>Free</h3>
      <p class="price">£0 <small>forever</small></p>
      <ul>
        <li>Unlimited static QR codes</li>
        <li>Website, menu, Wi-Fi, contact &amp; WhatsApp</li>
        <li>PNG &amp; SVG downloads</li>
        <li>Printable table cards</li>
        <li>Codes never expire</li>
      </ul>
      <a class="btn secondary" href="/qr-code-generator/">Start free</a>
    </div>
    <div class="plan featured">
      <h3>Pro <span class="badge pro">Early access</span></h3>
      <p class="price"><span data-price="proMonthlyPrice">£5.99</span> <small>/ month</small></p>
      <p class="hint" style="margin:4px 0 0">or <span data-price="proYearlyPrice">£49</span> a year (save over 30%)</p>
      <ul>
        <li>Everything in Free</li>
        <li><strong>Dynamic QR codes:</strong> change the link at any time</li>
        <li>Scan statistics: see what's working</li>
        <li>Up to 25 dynamic codes</li>
        <li>Your logo in the code</li>
        <li>Table cards without etoolbox branding</li>
      </ul>
      <a class="btn" data-plan="monthly" href="#">Go Pro monthly</a>
      <a class="btn secondary" data-plan="yearly" href="#" style="margin-top:10px">Go Pro yearly</a>
    </div>
  </div>
  """ + faq_html(pricing_faqs) + """
</div>
""" + FOOT
write("/pricing/", pricing)

# ---------------- Legal ----------------

privacy = head("Privacy Policy | etoolbox", "How etoolbox handles your data.", "/privacy/") + f"""
<div class="wrap prose" style="padding-top:36px">
<h1>Privacy policy</h1>
<p><em>Last updated: 2 November {YEAR}</em></p>
<h2>The short version</h2>
<p>The free tools on etoolbox.co.uk run entirely in your web browser. What you type into them, including Wi-Fi passwords and contact details, is not sent to us or stored by us.</p>
<h2>What we collect</h2>
<ul>
<li><strong>Emails you send us:</strong> if you contact us or join early access, we keep your email so we can reply. We never sell it.</li>
<li><strong>Basic visit statistics:</strong> we may use privacy-friendly analytics (such as Cloudflare Web Analytics) that count page views without cookies or tracking you across sites.</li>
<li><strong>Payments:</strong> if you buy Pro, payment is handled by our payment provider (Stripe). We don't see or store your card details.</li>
</ul>
<h2>Your rights</h2>
<p>Under UK GDPR you can ask to see, correct or delete the personal data we hold about you. Email <a data-contact href="#"></a>.</p>
</div>
""" + FOOT
write("/privacy/", privacy)

terms = head("Terms of Use | etoolbox", "Terms for using etoolbox.co.uk.", "/terms/") + f"""
<div class="wrap prose" style="padding-top:36px">
<h1>Terms of use</h1>
<p><em>Last updated: 2 November {YEAR}</em></p>
<ul>
<li>The free tools are provided as they are, at no cost. Always test a QR code with your own phone before printing it.</li>
<li>You're responsible for the content your QR codes link to. Don't use etoolbox for anything illegal, misleading or harmful.</li>
<li>You can use codes and table cards you make here for personal and commercial purposes.</li>
<li>Paid plans renew automatically until you cancel. You can cancel at any time and keep access until the end of the period you've paid for.</li>
<li>These terms are governed by the laws of England and Wales.</li>
</ul>
<p>Questions? Email <a data-contact href="#"></a>.</p>
</div>
""" + FOOT
write("/terms/", terms)

# 404
with open(os.path.join(OUT, "404.html"), "w") as f:
    f.write(head("Page not found | etoolbox", "Page not found.", "/404") + """
<div class="wrap hero"><h1>Page not found</h1><p class="lead">That page doesn't exist, but the free tools do.</p>
<a class="btn" href="/">Go to the homepage</a></div>
""" + FOOT)

# sitemap + robots
paths = ["/", "/pricing/"] + [f"/{t[0]}/" for t in TOOLS] + ["/privacy/", "/terms/"]
with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for p in paths:
        f.write(f"  <url><loc>{SITE}{p}</loc><lastmod>{YEAR}-11-02</lastmod></url>\n")
    f.write("</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
print("built", len(paths), "pages")
