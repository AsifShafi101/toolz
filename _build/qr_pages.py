# ---------------- Generator pages ----------------

gen_page(
    "qr-code-generator",
    "Free QR Code Generator – No Sign-up, Never Expires | etoolbox",
    "Free QR code generator",
    "Turn any web address or text into a QR code. Download a high-resolution PNG or SVG. There's no sign-up and the code never expires.",
    "url",
    """<label for="url">Website address or text</label>
<input type="text" id="url" name="url" placeholder="e.g. yourbusiness.co.uk" inputmode="url">
<p class="hint" style="margin:6px 0 0">Tip: link to your Google reviews page to collect more reviews.</p>""",
    """<h2>How to make a QR code</h2>
<ol><li>Type or paste your web address. We add <code>https://</code> for you.</li>
<li>Check the preview, then point your phone camera at it to test it.</li>
<li>Download a PNG for screens and documents, or an SVG for professional printing.</li></ol>
<h2>Good ideas for small businesses</h2>
<ul><li><strong>Google reviews:</strong> put a code on receipts and the counter to ask happy customers for a review.</li>
<li><strong>Bookings:</strong> link straight to your booking page from posters and shop windows.</li>
<li><strong>Social media:</strong> send people to your Instagram or Facebook page.</li>
<li><strong>Flyers:</strong> link to an offer page so you can see whether the flyer works.</li></ul>""",
    [("Do these QR codes expire?", "No. A free code here contains your link directly, so it keeps working for as long as that web page exists. We can't switch it off."),
     ("Can I change the link after printing?", "Not with a free (static) code, because the link is built into the pattern. If you think the link may change, use a Pro dynamic QR code, which you can redirect at any time."),
     ("Can I use them commercially?", "Yes. Use them on menus, packaging, flyers and signs at no cost and with no attribution needed."),
     ("PNG or SVG?", "PNG works everywhere. SVG stays sharp at any size, so it's best for printers and large signs.")])

gen_page(
    "menu-qr-code-generator",
    "Free Menu QR Code Generator + Printable Table Cards | etoolbox",
    "Menu QR code &amp; table card maker",
    "Make a QR code for your menu and download a print-ready A6 table card. It's built for UK cafés, restaurants, pubs and takeaways, and it's free.",
    "menu",
    """<label for="url">Link to your menu <span class="hint">(website page, PDF link or ordering page)</span></label>
<input type="text" id="url" name="url" placeholder="e.g. yourcafe.co.uk/menu" inputmode="url">
<label for="business">Business name <span class="hint">(shown on the table card)</span></label>
<input type="text" id="business" name="business" placeholder="e.g. The Corner Café" maxlength="40">
<div class="row">
  <div><label for="heading">Card heading</label><input type="text" id="heading" name="heading" value="Scan to view our menu" maxlength="32"></div>
  <div><label for="accent">Card colour</label><input type="color" id="accent" name="accent" value="#ff6b35" style="width:100%;height:46px"></div>
</div>
<label for="caption">Small print <span class="hint">(optional)</span></label>
<input type="text" id="caption" name="caption" placeholder="e.g. Free Wi-Fi: ask at the counter" maxlength="70">""",
    """<h2>How it works</h2>
<ol><li>Paste the link to your menu. That can be a page on your website, a PDF stored online, or your online ordering page.</li>
<li>Add your business name and choose a colour to match your branding.</li>
<li>Download the table card (A6, 300 dpi). It fits a standard table stand or acrylic holder.</li></ol>
<h2>Tips for menu QR codes</h2>
<ul><li>Test the code with an iPhone and an Android phone before you print a batch.</li>
<li>Keep paper menus available. Some customers prefer them, and it helps with accessibility.</li>
<li>Will you update prices or change the menu link? Use a <a href="/pricing/">Pro dynamic code</a> so you never have to reprint.</li></ul>""",
    [("What size is the table card?", "It's A6 (105 × 148 mm) at 300 dpi, so it prints sharp at home or at a print shop. You can also scale it up to A5 or A4."),
     ("Can I link to a PDF menu?", "Yes. Upload the PDF to your website or a file host such as Google Drive (set it to 'anyone with the link'), then paste that link here."),
     ("What if my menu link changes?", "A free code always points to the same link, so you'd need to reprint. Pro dynamic codes can point to a new link at any time without reprinting."),
     ("Is there a watermark?", "The free table card shows a small 'etoolbox.co.uk' line at the bottom. The QR code itself is never watermarked.")],
    card=True)

gen_page(
    "wifi-qr-code-generator",
    "Free Wi-Fi QR Code Generator – Guests Scan to Connect | etoolbox",
    "Wi-Fi QR code generator",
    "Let customers and guests join your Wi-Fi by scanning a code, without typing a password. It works with iPhone and Android cameras.",
    "wifi",
    """<label for="ssid">Network name (SSID)</label>
<input type="text" id="ssid" name="ssid" placeholder="e.g. CornerCafe-Guest">
<div class="row">
  <div><label for="security">Security</label>
  <select id="security" name="security"><option value="WPA" selected>WPA / WPA2 / WPA3</option><option value="WEP">WEP (old)</option><option value="nopass">No password</option></select></div>
  <div><label for="password">Password</label><input type="text" id="password" name="password" placeholder="Wi-Fi password"></div>
</div>
<label class="check" style="margin-top:12px"><input type="checkbox" name="hidden"> Hidden network</label>""",
    """<h2>How to share your Wi-Fi with a QR code</h2>
<ol><li>Enter your network name exactly as it appears on your phone, including capital letters.</li>
<li>Choose the security type. Most routers use WPA2 or WPA3, which is the default.</li>
<li>Enter the password and test the code with your phone camera.</li>
<li>Print it for the counter, tables or reception.</li></ol>
<h2>Keep your business network safe</h2>
<p>Share a separate <strong>guest network</strong>, not the one your till or office computers use. Most broadband routers let you turn on a guest network in their settings.</p>""",
    [("Is my Wi-Fi password sent anywhere?", "No. The code is made entirely in your browser, and your password never leaves your device."),
     ("Does it work on iPhone?", "Yes. iPhones (iOS 11 and later) and modern Android phones join Wi-Fi straight from the camera app."),
     ("I changed my Wi-Fi password. Does the code still work?", "No. The password is built into the code, so make a new code whenever you change it.")])

gen_page(
    "vcard-qr-code-generator",
    "Free Contact Card (vCard) QR Code Generator | etoolbox",
    "Contact card QR code (vCard)",
    "Put your phone number, email, website and address into a QR code. When someone scans it, their phone offers to save you as a contact.",
    "vcard",
    """<div class="row">
  <div><label for="first">First name</label><input type="text" id="first" name="first"></div>
  <div><label for="last">Last name</label><input type="text" id="last" name="last"></div>
</div>
<div class="row">
  <div><label for="org">Business name</label><input type="text" id="org" name="org"></div>
  <div><label for="title">Job title</label><input type="text" id="title" name="title"></div>
</div>
<div class="row">
  <div><label for="phone">Mobile</label><input type="tel" id="phone" name="phone"></div>
  <div><label for="workphone">Work phone</label><input type="tel" id="workphone" name="workphone"></div>
</div>
<div class="row">
  <div><label for="email">Email</label><input type="email" id="email" name="email"></div>
  <div><label for="website">Website</label><input type="text" id="website" name="website" inputmode="url"></div>
</div>
<label for="street">Address <span class="hint">(optional)</span></label>
<input type="text" id="street" name="street" placeholder="Street">
<div class="row" style="margin-top:8px">
  <input type="text" name="city" placeholder="Town / city" aria-label="Town or city">
  <input type="text" name="postcode" placeholder="Postcode" aria-label="Postcode">
</div>
<input type="hidden" name="country" value="">""",
    """<h2>Where to use a contact QR code</h2>
<ul><li>On the back of business cards, so people save you in one tap.</li>
<li>On your van, shop window or market stall banner.</li>
<li>On email signatures, quotes and invoices.</li></ul>
<p>Only fill in what you want to share. The more details you add, the denser the code gets, so keep it short for small prints.</p>""",
    [("What happens when someone scans it?", "Their phone shows your details and offers to add you to their contacts."),
     ("Can I update my details later?", "A free code can't be edited, so you'd make a new one. A Pro dynamic code can point to details you update at any time.")])

gen_page(
    "whatsapp-qr-code-generator",
    "Free WhatsApp QR Code Generator – Start a Chat by Scanning | etoolbox",
    "WhatsApp QR code generator",
    "Customers scan and a WhatsApp chat with your business opens, with an optional ready-typed message. It's great for orders, bookings and quotes.",
    "whatsapp",
    """<label for="phone">WhatsApp number</label>
<input type="tel" id="phone" name="phone" placeholder="e.g. 07700 900123 or +44 7700 900123">
<p class="hint" style="margin:6px 0 0">UK numbers starting with 0 are converted to +44 automatically. Include the country code for other countries.</p>
<label for="message">Pre-filled message <span class="hint">(optional)</span></label>
<textarea id="message" name="message" placeholder="e.g. Hi! I'd like to place an order."></textarea>""",
    """<h2>Ideas</h2>
<ul><li><strong>Takeaways:</strong> "Hi, I'd like to order…" on flyers and windows.</li>
<li><strong>Trades:</strong> "Hi, I'd like a quote for…" on your van and leaflets.</li>
<li><strong>Salons:</strong> "Hi, I'd like to book an appointment" at the till.</li></ul>""",
    [("Does the customer need my number saved?", "No. The code opens a chat with you directly, even if they don't have you as a contact."),
     ("Does it work with WhatsApp Business?", "Yes. It works with both WhatsApp and WhatsApp Business numbers.")])

