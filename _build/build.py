"""Generates the static HTML pages for etoolbox.co.uk into the repo."""
import os
here = os.path.dirname(os.path.abspath(__file__))
G = {}
exec(open(os.path.join(here, "core.py")).read(), G)
G["OUT"] = os.path.dirname(here)  # site root = repo root
for part in ("qr_pages.py", "tools_pages.py"):
    exec(open(os.path.join(here, part)).read(), G)

exec('''
def cat_grid():
    out = []
    for key, title, blurb, tools in CATS:
        cards = "".join(f'<a class="tool-card" href="/{s}/"><div class="icon">{i}</div><h3>{n}</h3><p>{d}</p></a>' for s, i, n, d in tools)
        out.append(f'<section id="{key}"><h2>{title}</h2><p class="muted" style="margin:-8px 0 16px">{blurb}</p><div class="grid">{cards}</div></section>')
    return "".join(out)

home = head("etoolbox – Free Online Tools for UK Small Businesses",
            "Free invoice generator, VAT and margin calculators, QR codes, and image and text tools. No sign-up, nothing uploaded. Made for UK small businesses.",
            "/") + f"""
<div class="wrap">
  <div class="hero">
    <span class="pill">{len(TOOLS)} free tools · No sign-up · Nothing uploaded</span>
    <h1>Free tools for <em>small businesses</em></h1>
    <p class="lead">Invoices, quotes, VAT and pricing calculators, QR codes for menus and Wi-Fi, and image and text tools. Everything runs in your browser, and it's made in the UK for cafés, shops, salons, trades and freelancers.</p>
    <a class="btn" href="/invoice-generator/">Make an invoice</a>
    <a class="btn secondary" href="/menu-qr-code-generator/">Menu QR code</a>
  </div>
  <div id="tools">{cat_grid()}</div>
  {UPSELL}
  <section class="prose">
    <h2>Why etoolbox?</h2>
    <ul>
      <li><strong>Actually free.</strong> No sign-up, no watermarks on invoices, and QR codes that never expire.</li>
      <li><strong>Private.</strong> Tools run in your browser. Your invoices, photos, passwords and Wi-Fi details are never uploaded.</li>
      <li><strong>Made for UK businesses.</strong> Pounds, UK VAT rates, UK dates and +44 phone numbers by default.</li>
    </ul>
  </section>
</div>
""" + foot(())
write("/", home)
''', G)

exec(open(os.path.join(here, "rest_pages.py")).read(), G)
