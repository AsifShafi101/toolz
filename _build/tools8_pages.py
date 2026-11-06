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
