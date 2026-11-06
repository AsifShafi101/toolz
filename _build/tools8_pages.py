# ---------------- Digital postcard maker ----------------
_pc_card = """<div class="pc-stage"><div class="pc-card" id="pc-card" tabindex="0" role="button" aria-label="Postcard: click to turn over">
  <div class="pc-face pc-front"><canvas aria-hidden="true"></canvas></div><div class="pc-face pc-back"><canvas aria-hidden="true"></canvas></div></div></div>"""

tool_page("digital-postcard-maker",
    "Free Digital Postcard Maker – Send an Online Postcard from Famous Cities | etoolbox",
    "Digital postcard maker",
    "Send a free online postcard from London, Paris, New York, Lahore, Karachi, Islamabad and 21 more famous places, or use your own photo. Write your message, add who it's to and from, then share a link or download it. No sign-up, no ads in the card.",
    f"""
  <div class="pc-wrap">
    <form class="panel pc-form" data-postcard novalidate>
      <h3 class="pc-step"><b>1</b> Pick a place</h3>
      <div class="pc-search" role="search"><input type="search" id="pc-q" placeholder="Search any place in the world, e.g. Moscow, Petra, Antarctica" aria-label="Search any place in the world" autocomplete="off"><button type="button" class="btn" id="pc-go">Search</button></div>
      <div id="pc-results" hidden><p class="hint" id="pc-rmsg" role="status"></p><div class="pc-grid" id="pc-rgrid"></div></div>
      <p class="hint" style="margin:10px 0 6px">Popular places</p>
      <div class="pc-grid" id="pc-grid"></div>
      <h3 class="pc-step"><b>2</b> Front of the card</h3>
      <div class="row"><div><label for="greet">Greeting</label><input type="text" id="greet" name="greet" value="Greetings from" maxlength="30"></div>
      <div><label for="place">Place name</label><input type="text" id="place" name="place" maxlength="24"></div></div>
      <div class="row"><div><label for="style">Design</label><select id="style" name="style"><option value="auto">Automatic</option><option value="big">Big letters</option><option value="panel">Photo + colour panel</option><option value="caption">Simple caption</option><option value="photo">Photo only</option></select></div>
      <div><label for="theme">Colours</label><select id="theme" name="theme"><option value="sunset">Sunset</option><option value="ocean">Ocean</option><option value="gold">Gold</option><option value="royal">Royal</option><option value="white">Classic white</option></select></div></div>
      <h3 class="pc-step"><b>3</b> Your message</h3>
      <label for="msg">Message</label><textarea id="msg" name="msg" rows="5" maxlength="420">Wish you were here! The weather's lovely and the food is even better. Thinking of you. Lots of love x</textarea>
      <div class="row"><div><label for="to">To</label><input type="text" id="to" name="to" maxlength="40" placeholder="e.g. Grandma"></div>
      <div><label for="from">From</label><input type="text" id="from" name="from" maxlength="40" placeholder="Your name"></div></div>
      <label for="addr">Address on the card <span class="muted">(optional, just for the look)</span></label><textarea id="addr" name="addr" rows="2" maxlength="120" placeholder="12 Rose Lane&#10;Leeds"></textarea>
      <label for="ink">Handwriting</label><select id="ink" name="ink"><option value="hand">Handwritten</option><option value="neat">Neat italic</option></select>
    </form>
    <div class="pc-side">
      {_pc_card}
      <p class="pc-hint">Click the card to turn it over. <span id="pc-status" role="status"></span></p>
      <div class="pc-actions">
        <button type="button" class="btn secondary" id="pc-flip">↻ Turn over</button>
        <button type="button" class="btn secondary" id="pc-dl-front">Download front</button>
        <button type="button" class="btn secondary" id="pc-dl-back">Download back</button>
        <button type="button" class="btn" id="pc-dl-both">Download both sides</button>
      </div>
      <div id="pc-share-wrap" class="pc-share"><strong>Send it</strong>
        <div class="pc-actions"><button type="button" class="btn" id="pc-copy">Copy share link</button><button type="button" class="btn secondary" id="pc-wa">WhatsApp</button><button type="button" class="btn secondary" id="pc-mail">Email</button><button type="button" class="btn secondary" id="pc-native" hidden>Share…</button></div>
        <input type="text" id="pc-link" class="pc-link" readonly hidden aria-label="Share link">
        <p class="hint">The link opens your postcard with a turn-over animation. Your message is stored in the link itself, not on our server.</p></div>
      <p id="pc-own-note" class="hint" hidden>Postcards with your own photo can be downloaded and sent as a picture. Share links only work with our places, because your photo never leaves your device.</p>
      <p class="hint pc-credit" id="pc-credit"></p>
    </div>
  </div>""",
    """<h2>How to send a digital postcard</h2><ol><li>Pick a famous place, search for any place in the world, or upload your own holiday photo.</li><li>Choose a design and colours. “Greetings from” and the place name appear on the front.</li><li>Write your message and who it's to and from. You'll see it on the back of the card.</li><li>Press <strong>Copy share link</strong>, or send it by WhatsApp or email. You can also download the card as a picture to post on social media or print.</li></ol>
<h2>Why use this postcard maker?</h2><ul><li><strong>Completely free:</strong> no membership, no “one free card a month” and no sign-up.</li><li><strong>Private:</strong> your message travels inside the link, and your own photos never leave your device.</li><li><strong>Looks like the real thing:</strong> a stamp, postmark and handwriting on the back, and it turns over like a real card.</li></ul>
<h2>Any place in the world</h2><p>Type a city, country, landmark or even “Antarctica” into the search box. You'll see freely licensed photos from Wikimedia Commons, the free media library behind Wikipedia. Pick one and it goes straight onto your card.</p>
<h2>The photos</h2><p>The landmark photos are freely licensed pictures from Wikimedia Commons, taken by the photographers credited on each card. Most are licensed under Creative Commons Attribution-ShareAlike (CC BY-SA). The credit printed on the back of every postcard keeps it in line with the licence.</p>""",
    [("Is it really free?", "Yes. Make and send as many postcards as you like. There's no account and no paid tier for postcards."),
     ("Can the person I send it to see it without an app?", "Yes. The link opens in any web browser on a phone or computer, and the card turns over to show your message."),
     ("Can I use my own photo?", "Yes. Choose “Your own photo”. It stays on your device, so download the card and send it as a picture."),
     ("Can I print it?", "Yes. Download both sides as images and print them at 6 × 4 inches (15 × 10 cm), standard postcard size."),
     ("Who took the photos?", "Photographers who share their work on Wikimedia Commons. Each card shows the photographer and the licence on the back.")],
    ("postcard.js",))

# Viewer for shared postcards (the card data is in the # part of the address)
write("/postcard/", head("You've got a postcard 💌 | etoolbox", "Someone sent you a digital postcard. Open it to read the message, then send one back free.", "/postcard/",
      '<meta name="robots" content="noindex">\n') + f"""
<div class="wrap pc-viewer" id="pc-view">
  <div class="page-head" style="text-align:center"><h1 id="pc-from-line">You've got a postcard 💌</h1><p class="pc-empty-msg">This postcard link looks incomplete. Ask the sender to copy it again.</p></div>
  {_pc_card}
  <p class="pc-hint" style="text-align:center">Tap the card to turn it over.</p>
  <p style="text-align:center;margin:22px 0 8px"><a class="btn" href="/digital-postcard-maker/">💌 Send a postcard back, free</a></p>
  <p class="hint pc-credit" id="pc-credit" style="text-align:center"></p>
</div>
""" + foot(("postcard.js",)))
EXTRA_PATHS = globals().get("EXTRA_PATHS", [])

# ---------------- Remove watermark from PDF ----------------
tool_page("remove-watermark-from-pdf",
    "Remove Watermark from PDF – Delete DRAFT / CONFIDENTIAL Layers Free | etoolbox",
    "Remove watermark from PDF",
    "Remove DRAFT, CONFIDENTIAL, SAMPLE and other watermark layers from your own PDFs. You'll see a before-and-after preview, and your file is never uploaded.",
    """
  <div class="gen">
    <form class="panel" data-pdfwm novalidate>
      <label class="drop" id="wm-drop" for="wm-input"><strong>Choose a PDF or drop it here</strong><span class="muted">Processed on your device · never uploaded</span>
        <input type="file" id="wm-input" accept="application/pdf,.pdf" class="sr-only"></label>
      <p id="wm-name" class="v2m-info"></p>
      <label class="check"><input type="checkbox" name="overlay" checked> Also remove see-through overlay layers <span class="muted">(added on top by most online watermark tools)</span></label>
      <label class="check"><input type="checkbox" name="stamps"> Also remove stamp annotations <span class="muted">(e.g. “Approved” stamps)</span></label>
      <p id="wm-msg" class="hint" role="status" aria-live="polite"></p>
      <p class="note">Only use this on documents you own or have permission to edit. Removing a watermark doesn't change who owns the document.</p>
    </form>
    <div class="panel" id="wm-out" hidden>
      <div class="wm-compare"><figure><figcaption>Before · <span id="wm-page"></span></figcaption><canvas id="wm-before"></canvas></figure><figure><figcaption>After</figcaption><canvas id="wm-after"></canvas></figure></div>
      <button type="button" class="btn" id="wm-dl">Download PDF without watermark</button>
    </div>
  </div>""",
    """<h2>How to remove a watermark from a PDF</h2><ol><li>Choose your PDF. It's checked on your device straight away.</li><li>See what was found, with a before-and-after preview of the first changed page.</li><li>Download the clean PDF. Your text, images and links stay exactly as they were.</li></ol>
<h2>What it can remove</h2><ul><li>Watermarks added in Adobe Acrobat, Word and most PDF editors, which are saved as a separate watermark layer.</li><li>Layers named Watermark, Draft, Confidential, Sample or Copy.</li><li>Watermarks added by etoolbox's <a href="/add-watermark-to-pdf/">Add watermark to PDF</a> tool and most other online watermark tools.</li><li>Optionally, “Approved” or “Paid”-style stamp annotations.</li></ul>
<h2>What it can't remove</h2><p>If a watermark is part of a scanned page, or the PDF was “flattened” so each page is a single picture, the watermark is part of the image itself and can't be separated without damaging the page.</p>
<p class="note">Please only remove watermarks from documents you own or have permission to change. Removing a copyright notice from someone else's work so you can use it without permission is against UK law.</p>""",
    [("Is my PDF uploaded?", "No. It's processed entirely in your browser and never leaves your device."),
     ("Will it change the rest of my document?", "No. Only the watermark layer is removed. Text, images, links and form fields stay as they were. Check the preview before you download."),
     ("Why wasn't the watermark found?", "It's probably part of the page image (a scan or a flattened PDF). Try ticking “Also remove see-through overlay layers” if it isn't already ticked."),
     ("Does it work on password-protected PDFs?", "Unlock it first with our Unlock PDF tool. You'll need the password.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "pdfwm.js"))

# ---------------- Photo object eraser ----------------
tool_page("photo-object-eraser",
    "Photo Object Eraser – Remove Date Stamps, Spots & Unwanted Objects Free | etoolbox",
    "Photo object eraser",
    "Brush over a date stamp, a spot, a stray wire or a small unwanted object, and it's filled in from the surrounding picture. It's free, and your photo never leaves your device.",
    """
  <div class="er-wrap">
    <form class="panel er-panel" data-eraser novalidate>
      <label class="drop" id="er-drop" for="er-input"><strong>Choose a photo or drop it here</strong><span class="muted">JPG, PNG or WebP · or paste with Ctrl+V · never uploaded</span>
        <input type="file" id="er-input" accept="image/jpeg,image/png,image/webp" class="sr-only"></label>
      <div id="er-tools" hidden>
        <label for="brush">Brush size <span id="er-size" class="muted">28 px</span></label>
        <input type="range" id="brush" name="brush" min="6" max="90" value="28">
        <div class="er-btns">
          <button type="button" class="btn" id="er-go" disabled>🪄 Erase</button>
          <button type="button" class="btn secondary" id="er-clear" disabled>Clear brush</button>
          <button type="button" class="btn secondary" id="er-undo" disabled>↶ Undo</button>
          <button type="button" class="btn secondary" id="er-compare">Hold to compare</button>
        </div>
        <div class="v2m-bar" id="er-bar" hidden><i></i></div>
        <button type="button" class="btn" id="er-dl" disabled style="width:100%;margin-top:12px">Download photo</button>
        <button type="button" class="btn ghost" id="er-new" style="width:100%;margin-top:8px">Open another photo</button>
      </div>
      <p id="er-msg" class="hint" role="status" aria-live="polite"></p>
    </form>
    <div class="er-canvas">
      <p id="er-empty" class="muted">Your photo will appear here. Paint over anything you want to remove.</p>
      <div class="er-stage" id="er-stage" hidden><canvas id="er-view"></canvas><canvas id="er-mask" aria-label="Paint over the area to remove"></canvas></div>
    </div>
  </div>""",
    """<h2>How to remove something from a photo</h2><ol><li>Open your photo.</li><li>Paint over the thing you want gone. Cover it completely, with a little extra round the edges.</li><li>Press <strong>Erase</strong>. It's filled in from the area around it in a second or two.</li><li>Not perfect? Press Undo, or paint over the leftovers and erase again. Then download.</li></ol>
<h2>What it's good at</h2><ul><li>Orange date stamps on old scanned photos</li><li>Dust spots, blemishes and small marks</li><li>Power lines, stray hairs and small signs</li><li>Small objects or people in the background against grass, sky, sand, water or walls</li></ul>
<p>It works by copying matching texture from nearby, so it's best on small areas surrounded by fairly even background. Big objects against busy backgrounds may need a few passes.</p>
<p class="note">Please use it on your own photos. Removing another photographer's or stock library's watermark to use their picture without paying is against copyright law.</p>""",
    [("Is my photo uploaded?", "No. Everything happens in your browser, so your photo never leaves your device."),
     ("Will it reduce the quality?", "Only the painted area changes. Very large photos are worked on at up to 2,400 pixels on the longest side."),
     ("It left a smudge. What can I do?", "Undo, then paint a slightly bigger area, or erase in two smaller steps. Smaller areas give cleaner results."),
     ("Does it work on phones?", "Yes. Paint with your finger. A stylus or zooming the page in helps with small details.")],
    ("eraser.js",))
