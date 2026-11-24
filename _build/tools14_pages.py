# ---------------- Batch 5: image tools (text, meme, collage, favicon, Instagram grid, social resizer, SVG to PNG, palette) ----------------
_IMG_JS = ("vendor/fflate.min.js", "imgtools.js")
_FONT_OPTS = '<option value="bold">Bold poster (Anton)</option><option value="sans">Clean sans (Arial)</option><option value="serif">Elegant serif</option><option value="display">Tall display (Bebas Neue)</option><option value="script">Handwritten script</option><option value="mono">Typewriter mono</option>'


def _drop(i, title, sub, multi=False, accept="image/*"):
    return (f'<label class="drop" id="drop" for="{i}"><strong>{title}</strong><span class="muted">{sub}</span>'
            f'<input type="file" id="{i}" accept="{accept}" class="sr-only"{" multiple" if multi else ""}></label>')


tool_page("add-text-to-image",
    "Add Text to Image Online Free – Put Words on a Photo | etoolbox",
    "Add text to image",
    "Put text on any photo in seconds. Choose a font, colour, outline, shadow or background box, drag the words where you want them and add as many text layers as you like. Free, no watermark, and your photo never leaves your device.",
    f"""
  <form class="panel" data-addtext novalidate>
    {_drop("tx-input", "Choose a photo or drop it here", "JPG, PNG or WebP · never uploaded")}
    <div id="tx-work" hidden>
      <div class="it-stage"><canvas id="tx-view" aria-label="Your image. Drag text to move it."></canvas></div>
      <p class="hint">Drag the text on the picture to move it. Click a piece of text to edit it.</p>
      <div class="tx-layers-row"><div id="tx-layers" class="tx-layers"></div><button type="button" class="btn secondary sm" id="tx-add">+ Add text</button><button type="button" class="btn secondary sm" id="tx-del">Delete selected</button></div>
      <div id="tx-edit">
        <label for="tx-text">Text</label><textarea id="tx-text" name="text" rows="2"></textarea>
        <div class="row3">
          <div><label for="tx-font">Font</label><select id="tx-font" name="font">{_FONT_OPTS}</select></div>
          <div><label for="tx-size">Size <span class="muted">(px)</span></label><input type="number" id="tx-size" name="size" min="8" max="1000"></div>
          <div><label for="tx-align">Align</label><select id="tx-align" name="align"><option value="center">Centre</option><option value="left">Left</option><option value="right">Right</option></select></div>
        </div>
        <div class="row3">
          <div><label for="tx-color">Text colour</label><input type="color" id="tx-color" name="color"></div>
          <div><label for="tx-sc">Outline colour</label><input type="color" id="tx-sc" name="sc"></div>
          <div><label for="tx-stroke">Outline width</label><input type="range" id="tx-stroke" name="stroke" min="0" max="60"></div>
        </div>
        <div class="checks"><label><input type="checkbox" name="bold"> Bold</label><label><input type="checkbox" name="italic"> Italic</label><label><input type="checkbox" name="shadow"> Shadow</label><label><input type="checkbox" name="bg"> Background box</label><label>Box colour <input type="color" name="bgc"></label></div>
      </div>
      <div class="actions"><select name="fmt" aria-label="Save as"><option value="image/jpeg">Save as JPG</option><option value="image/png">Save as PNG</option></select><button type="button" class="btn" id="tx-dl">Download image</button></div>
    </div>
  </form>""",
    """<h2>How to add text to a photo</h2><ol><li>Choose or drop a photo.</li><li>Type your words in the <strong>Text</strong> box. Press Enter for a new line.</li><li>Pick a font, size and colour. A dark outline or shadow keeps text readable on busy photos.</li><li>Drag the text on the picture to place it, and click <strong>+ Add text</strong> for another layer.</li><li>Click <strong>Download image</strong>. It's saved at the photo's full resolution.</li></ol>
<h2>Tips for readable text</h2><ul><li>White text with a black outline works on almost any photo.</li><li>Use the <strong>background box</strong> for longer captions, quotes and price labels.</li><li>Keep important words away from the edges. Social apps often crop them or cover them with buttons.</li></ul>
<p>Making a meme? The <a href="/meme-generator/">meme generator</a> adds classic top and bottom captions automatically. To protect your photos, try <a href="/add-watermark-to-image/">watermark photos</a>.</p>""",
    [("Is there a watermark?", "No. Your image is saved exactly as you designed it, with no watermark and no sign-up."),
     ("Will it reduce the quality of my photo?", "No. The finished image is saved at the original resolution. Choose PNG for no compression at all."),
     ("Can I add more than one piece of text?", "Yes. Click “+ Add text” for each new layer. Click any layer's button, or click the text on the picture, to edit it."),
     ("Is my photo uploaded?", "No. Everything happens in your browser, so your photo stays on your device.")],
    _IMG_JS)

tool_page("meme-generator",
    "Meme Generator – Make a Meme From Your Own Photo, Free | etoolbox",
    "Meme generator",
    "Turn any photo or screenshot into a meme. Add classic bold top and bottom text with a black outline, or a white caption bar above the picture. Text resizes itself to fit. Free, no watermark, and nothing is uploaded.",
    """
  <form class="panel" data-meme novalidate>
    """ + _drop("mm-input", "Choose your image or drop it here", "Use your own photo or screenshot · JPG, PNG or WebP · never uploaded") + """
    <div id="mm-work" hidden>
      <label for="mm-style">Style</label><select id="mm-style" name="style"><option value="classic">Classic: top &amp; bottom text</option><option value="caption">Modern: caption bar above the image</option></select>
      <label for="mm-top" id="mm-top-label">Top text</label><textarea id="mm-top" name="top" rows="2" placeholder="When the tool is free"></textarea>
      <div id="mm-bottom-row"><label for="mm-bottom">Bottom text</label><textarea id="mm-bottom" name="bottom" rows="2" placeholder="And there's no watermark"></textarea></div>
      <div class="it-stage"><canvas id="mm-view" aria-label="Meme preview"></canvas></div>
      <div class="actions"><button type="button" class="btn" id="mm-dl">Download meme</button></div>
    </div>
  </form>""",
    """<h2>How to make a meme</h2><ol><li>Choose a photo or screenshot of your own.</li><li>Type the top and bottom text. It's made upper case and shrinks to fit automatically.</li><li>Or switch to <strong>caption bar</strong> for the modern style with black text on a white strip above the picture.</li><li>Click <strong>Download meme</strong> and share it.</li></ol>
<h2>About images and copyright</h2><p>We don't host a library of meme templates, because most famous meme pictures are owned by someone. Use your own photos, screenshots you have the right to share, or images with a licence that allows reuse. For other layouts, the <a href="/add-text-to-image/">add text to image</a> tool lets you put text anywhere.</p>""",
    [("Why is there no template library?", "Most popular meme images are copyrighted photos or film stills. Using your own images keeps things simple, and your meme is completely original."),
     ("What font do memes use?", "Classic memes use a bold condensed font with a black outline. We use Anton, a free font with the same look, so it works on every device."),
     ("Is there a watermark?", "No. Memes are saved without any watermark or branding.")],
    _IMG_JS)

tool_page("photo-collage-maker",
    "Photo Collage Maker – Free Online Picture Grid | etoolbox",
    "Photo collage maker",
    "Put 2 to 9 photos into one picture. Choose a layout and size for Instagram, Stories, Facebook or printing on A4, then adjust the spacing, rounded corners and background colour. Drag each photo to reposition it. Free, no watermark, and nothing is uploaded.",
    """
  <form class="panel" data-collage novalidate>
    <div class="row3">
      <div><label for="cl-layout">Layout</label><select id="cl-layout" name="layout"><option value="2v">2 photos side by side</option><option value="2h">2 photos stacked</option><option value="3a">3 photos: 1 large left</option><option value="3b">3 photos: 1 large top</option><option value="4" selected>4 photos: 2 × 2 grid</option><option value="5">5 photos</option><option value="6">6 photos: 3 × 2</option><option value="9">9 photos: 3 × 3</option></select></div>
      <div><label for="cl-size">Size</label><select id="cl-size" name="size"><option value="sq">Square (Instagram post)</option><option value="portrait">Portrait 4:5 (Instagram)</option><option value="story">Story 9:16</option><option value="land">Landscape 16:9</option><option value="a4">A4 print (300 dpi)</option></select></div>
      <div><label for="cl-bgc">Background</label><input type="color" id="cl-bgc" name="bgc" value="#ffffff"></div>
    </div>
    <div class="row3">
      <div><label for="cl-gap">Spacing</label><input type="range" id="cl-gap" name="gap" min="0" max="60" value="16"></div>
      <div><label for="cl-radius">Rounded corners</label><input type="range" id="cl-radius" name="radius" min="0" max="100" value="0"></div>
      <div><label for="cl-fmt">Save as</label><select id="cl-fmt" name="fmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></div>
    </div>
    <div class="cl-stage" id="drop"><canvas id="cl-view" aria-label="Collage. Click an empty box to add a photo, drag a photo to reposition it."></canvas></div>
    <input type="file" id="cl-input" accept="image/*" multiple class="sr-only" aria-label="Add photos">
    <p class="hint"><span id="cl-count"></span> · Click an empty box to add a photo, or drop several at once. Drag a photo to change which part shows, or click it to replace it.</p>
    <div class="actions"><button type="button" class="btn secondary" id="cl-add">Add photos</button><button type="button" class="btn secondary" id="cl-shuffle">Shuffle</button><button type="button" class="btn secondary" id="cl-clear">Clear</button><button type="button" class="btn" id="cl-dl">Download collage</button></div>
  </form>""",
    """<h2>How to make a photo collage</h2><ol><li>Choose a layout and the size you need.</li><li>Click <strong>Add photos</strong> and select them all at once, or click each empty box.</li><li>Drag inside a photo to choose which part shows.</li><li>Adjust spacing, corners and background, then click <strong>Download collage</strong>.</li></ol>
<h2>Which size should I choose?</h2><ul><li><strong>Square</strong> or <strong>portrait 4:5</strong> for Instagram and Facebook posts.</li><li><strong>Story 9:16</strong> for Instagram, Facebook and WhatsApp Stories.</li><li><strong>A4 print</strong> for a sharp print at home or for a noticeboard.</li></ul>
<p>Want each photo in exactly the right size for a platform? Use the <a href="/social-media-image-resizer/">social media image resizer</a>.</p>""",
    [("How many photos can I use?", "From 2 to 9, depending on the layout."),
     ("Is there a watermark?", "No. Your collage is saved with no watermark or logo."),
     ("Are my photos uploaded?", "No. The collage is made in your browser, so your photos never leave your device.")],
    _IMG_JS)

tool_page("favicon-generator",
    "Favicon Generator – Make favicon.ico and App Icons Free | etoolbox",
    "Favicon generator",
    "Make a complete favicon set for your website from a logo or from a letter or emoji. Get favicon.ico, PNG icons, the Apple touch icon, Android icons, site.webmanifest and the HTML to paste, all in one ZIP. Free and private.",
    f"""
  <div class="gen"><form class="panel" data-favicon novalidate>
    <label for="fv-mode">Make it from</label><select id="fv-mode" name="mode"><option value="text">A letter, initials or emoji</option><option value="image">My logo or image</option></select>
    <div data-fv="text">
      <label for="fv-text">Letters or emoji <span class="muted">(up to 3)</span></label><input type="text" id="fv-text" name="text" value="e" maxlength="4">
      <div class="row3"><div><label for="fv-font">Font</label><select id="fv-font" name="font"><option value="sans">Clean sans</option><option value="serif">Elegant serif</option><option value="bold">Bold poster</option><option value="display">Tall display</option><option value="script">Script</option><option value="mono">Mono</option></select></div>
      <div><label for="fv-fg">Letter colour</label><input type="color" id="fv-fg" name="fg" value="#ffffff"></div></div>
    </div>
    <div data-fv="image" hidden>
      {_drop("fv-input", "Choose your logo or drop it here", "Square PNG or SVG works best · never uploaded", accept="image/*,.svg")}
      <label for="fv-pad">Padding</label><input type="range" id="fv-pad" name="pad" min="0" max="25" value="0">
      <label class="check"><input type="checkbox" name="bgon"> Add a background colour</label>
    </div>
    <div class="row3"><div><label for="fv-bgc">Background colour</label><input type="color" id="fv-bgc" name="bgc" value="#ff6b35"></div>
    <div><label for="fv-radius">Corner rounding</label><input type="range" id="fv-radius" name="radius" min="0" max="100" value="20"></div></div>
    <label for="fv-title">Website name <span class="muted">(for the manifest)</span></label><input type="text" id="fv-title" name="title" value="My website">
  </form>
  <div class="panel">
    <h3>Preview</h3><div class="fv-tab" id="fv-tab"></div><div class="fv-prev" id="fv-prev"></div>
    <div class="actions"><button type="button" class="btn" id="fv-dl">Download favicon ZIP</button></div>
    <label for="fv-code">Paste this into your page's &lt;head&gt;</label><textarea id="fv-code" rows="5" readonly class="mono"></textarea>
    <div class="actions"><button type="button" class="btn secondary sm" id="fv-copy">Copy HTML</button></div>
  </div></div>""",
    """<h2>What's in the ZIP</h2><table class="sal-table"><thead><tr><th>File</th><th>Used by</th></tr></thead><tbody>
<tr><td>favicon.ico (16, 32 and 48 px)</td><td>Every browser, including older ones, and search results</td></tr><tr><td>favicon-16x16.png, favicon-32x32.png</td><td>Modern browser tabs</td></tr>
<tr><td>apple-touch-icon.png (180 px)</td><td>iPhone and iPad home screens</td></tr><tr><td>android-chrome-192x192.png, -512x512.png</td><td>Android home screens and installable web apps</td></tr>
<tr><td>site.webmanifest</td><td>Tells phones your site's name, icons and theme colour</td></tr></tbody></table>
<h2>How to add a favicon to your website</h2><ol><li>Unzip the files and upload them to the root folder of your site, next to your home page.</li><li>Paste the HTML snippet into the <code>&lt;head&gt;</code> of every page.</li><li>Reload your site. Browsers cache favicons, so you may need a hard refresh (Ctrl+Shift+R).</li></ol>
<p>Google shows your favicon next to your site in search results. It needs to be at least 48×48 pixels, which the ICO file includes.</p>
<p>Need a full website? See our <a href="/web-development/">web design and development services</a>.</p>""",
    [("What size should a favicon be?", "Browsers use 16×16 and 32×32 in tabs, Google wants at least 48×48, Apple uses 180×180 and Android uses 192×192 and 512×512. The ZIP includes all of them."),
     ("Can I use an emoji as a favicon?", "Yes. Type an emoji in the letters box. It's drawn with your device's emoji font."),
     ("Do I still need favicon.ico?", "Modern browsers can use PNG, but favicon.ico in your site's root folder is still the most reliable option, so it's included.")],
    _IMG_JS)

tool_page("instagram-grid-splitter",
    "Instagram Grid Maker – Split a Photo Into 3, 6 or 9 Posts | etoolbox",
    "Instagram grid splitter",
    "Split one photo into a 3, 6, 9 or 12-tile Instagram grid so your profile shows one big picture. Choose square or the new portrait tiles, then download the tiles numbered in the order to post them. Free, and nothing is uploaded.",
    """
  <form class="panel" data-iggrid novalidate>
    """ + _drop("ig-input", "Choose a photo or drop it here", "A large, high-resolution photo works best · never uploaded") + """
    <div id="ig-work" hidden>
      <div class="row3">
        <div><label for="ig-rows">Grid</label><select id="ig-rows" name="rows"><option value="1">3 × 1 (3 posts)</option><option value="2">3 × 2 (6 posts)</option><option value="3" selected>3 × 3 (9 posts)</option><option value="4">3 × 4 (12 posts)</option></select></div>
        <div><label for="ig-shape">Tile shape</label><select id="ig-shape" name="shape"><option value="45">Portrait 4:5 (current profile grid)</option><option value="34">Portrait 3:4</option><option value="1">Square 1:1 (classic)</option></select></div>
      </div>
      <div class="it-stage"><canvas id="ig-view" aria-label="Grid preview with posting order"></canvas></div>
      <p class="hint" id="ig-note"></p>
      <div class="actions"><button type="button" class="btn" id="ig-dl">Download tiles (ZIP)</button></div>
    </div>
  </form>""",
    """<h2>How to post an Instagram grid</h2><ol><li>Choose your photo, grid size and tile shape.</li><li>Download the ZIP and copy the tiles to your phone.</li><li>Post the tiles <strong>in number order</strong>, starting with post 01. Instagram puts the newest post top-left, so tile 01 is the bottom-right piece.</li><li>Post them one after another, with nothing in between, so the picture lines up.</li></ol>
<h2>Square or portrait tiles?</h2><p>Instagram's profile grid now shows posts as portrait rectangles (roughly 3:4) rather than squares. If you choose <strong>square</strong>, the sides of each tile may be cropped on your profile, which breaks the joined-up look. Portrait tiles line up better on the current grid, and you can still crop a single post to square in the app.</p>""",
    [("In what order do I post the tiles?", "Post 01 first and the highest number last. Tiles are numbered so the full picture appears correctly once they're all posted."),
     ("Can I post the tiles as one carousel?", "You can, but a carousel shows as a single tile on your profile grid. Post them separately for the big-picture effect."),
     ("What resolution are the tiles?", "Each tile is 1080 pixels wide, Instagram's standard size.")],
    _IMG_JS)

tool_page("social-media-image-resizer",
    "Social Media Image Resizer – Instagram, Facebook, X, LinkedIn, YouTube Sizes | etoolbox",
    "Social media image resizer",
    "Resize one image to the right size for Instagram, Facebook, X, LinkedIn, YouTube, TikTok, Pinterest and WhatsApp. Crop to fill, or fit the whole picture with a blurred or coloured background. Pick several sizes and get them all in one ZIP. Free and private.",
    """
  <form class="panel" data-social novalidate>
    """ + _drop("sm-input", "Choose an image or drop it here", "JPG, PNG or WebP · never uploaded") + """
    <div id="sm-work" hidden>
      <div class="row3">
        <div><label for="sm-mode">How to fit</label><select id="sm-mode" name="mode"><option value="crop">Crop to fill</option><option value="blur">Fit with blurred background</option><option value="fit">Fit with a colour background</option></select></div>
        <div id="sm-bg" hidden><label for="sm-bgc">Background colour</label><input type="color" id="sm-bgc" name="bgc" value="#ffffff"></div>
        <div id="sm-pos"><label for="sm-px">Focus left ↔ right</label><input type="range" id="sm-px" name="px" min="-100" max="100" value="0"><label for="sm-py">Focus top ↕ bottom</label><input type="range" id="sm-py" name="py" min="-100" max="100" value="0"></div>
      </div>
      <p class="hint">Tick every size you want. <button type="button" class="linkbtn" id="sm-all">Select all</button></p>
      <div class="sm-grid" id="sm-grid"></div>
      <div class="actions"><button type="button" class="btn" id="sm-dl">Download selected sizes</button></div>
    </div>
  </form>""",
    """<h2>Social media image sizes (2026)</h2><table class="sal-table"><thead><tr><th>Platform</th><th>Image</th><th>Size (pixels)</th></tr></thead><tbody>
<tr><td>Instagram</td><td>Square post · portrait post · Story/Reel</td><td>1080 × 1080 · 1080 × 1350 · 1080 × 1920</td></tr>
<tr><td>Facebook</td><td>Link/post image · cover photo · Story</td><td>1200 × 630 · 851 × 315 · 1080 × 1920</td></tr>
<tr><td>X (Twitter)</td><td>Post image · header</td><td>1600 × 900 · 1500 × 500</td></tr>
<tr><td>LinkedIn</td><td>Post image · personal banner · company logo</td><td>1200 × 627 · 1584 × 396 · 400 × 400</td></tr>
<tr><td>YouTube</td><td>Thumbnail · channel banner</td><td>1280 × 720 · 2560 × 1440</td></tr>
<tr><td>TikTok</td><td>Video cover</td><td>1080 × 1920</td></tr><tr><td>Pinterest</td><td>Standard pin</td><td>1000 × 1500</td></tr><tr><td>WhatsApp</td><td>Profile photo</td><td>500 × 500</td></tr></tbody></table>
<p>Platforms change their layouts from time to time, but these sizes are the widely recommended ones. Keep text and faces away from the edges: profile pictures, buttons and captions often cover them.</p>
<h2>Crop or fit?</h2><p><strong>Crop to fill</strong> uses the whole space, so some of the picture is trimmed. Use the focus sliders to choose what stays. <strong>Fit</strong> keeps the whole picture and fills the gaps with a blurred copy or a plain colour, which is ideal for logos, posters and screenshots.</p>
<p>Want to choose the crop by hand? Use the <a href="/image-cropper/">image cropper</a>.</p>""",
    [("Can I resize for several platforms at once?", "Yes. Tick every size you need and they download together in one ZIP, each named after its platform and size."),
     ("Will my image be blurry?", "Images are scaled with high-quality smoothing. If your original is smaller than the target size, it will be enlarged, which can soften it, so start with the largest version you have."),
     ("Is my image uploaded?", "No. Resizing happens in your browser.")],
    _IMG_JS)

tool_page("svg-to-png",
    "SVG to PNG Converter – Free, Any Size, Transparent | etoolbox",
    "SVG to PNG converter",
    "Convert SVG files to sharp PNG, JPG or WebP images at any size. Keep the transparent background or add a colour, set an exact width or scale up to 8×, and convert many files at once. Free, and your files never leave your device.",
    """
  <form class="panel" data-svgpng novalidate>
    """ + _drop("sv-input", "Choose SVG files or drop them here", "Convert one or many at once · never uploaded", multi=True, accept=".svg,image/svg+xml") + """
    <details><summary>Or paste SVG code</summary><textarea name="code" rows="4" class="mono" placeholder="&lt;svg ...&gt;...&lt;/svg&gt;"></textarea><button type="button" class="btn secondary sm" id="sv-paste">Add pasted SVG</button></details>
    <div class="row3">
      <div><label for="sv-sizing">Size</label><select id="sv-sizing" name="sizing"><option value="scale">Scale</option><option value="width">Exact width</option></select></div>
      <div id="sv-s"><label for="sv-scale">Scale</label><select id="sv-scale" name="scale"><option value="1">1× (original)</option><option value="2" selected>2×</option><option value="3">3×</option><option value="4">4×</option><option value="8">8×</option></select></div>
      <div id="sv-w" hidden><label for="sv-width">Width <span class="muted">(px)</span></label><input type="number" id="sv-width" name="width" min="16" max="8000" value="1024"></div>
    </div>
    <div class="row3">
      <div><label for="sv-fmt">Format</label><select id="sv-fmt" name="fmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></div>
      <div><label class="check"><input type="checkbox" name="bgon"> Background colour</label><input type="color" name="bgc" value="#ffffff" aria-label="Background colour"></div>
    </div>
    <p id="sv-msg" class="hint" role="status"></p>
    <div class="sv-out" id="sv-out"></div>
    <div class="actions" id="sv-actions" hidden><button type="button" class="btn secondary" id="sv-clear">Clear</button><button type="button" class="btn" id="sv-dl">Convert &amp; download</button></div>
  </form>""",
    """<h2>How to convert SVG to PNG</h2><ol><li>Choose or drop your SVG files, or paste SVG code.</li><li>Pick a scale (2× is ideal for sharp screens) or an exact width.</li><li>Leave the background off for a transparent PNG, or add a colour.</li><li>Click <strong>Convert &amp; download</strong>. Several files arrive as one ZIP.</li></ol>
<h2>Why convert SVG to PNG?</h2><p>SVG is perfect for websites and logos because it stays sharp at any size, but many apps, social networks, email signatures and Office documents don't accept it. A PNG works everywhere and keeps transparency.</p>
<p>Making website icons? The <a href="/favicon-generator/">favicon generator</a> turns a logo into every icon size you need.</p>""",
    [("Will the PNG be transparent?", "Yes, unless you tick “Background colour” or choose JPG, which can't be transparent."),
     ("Why does my SVG look different?", "SVGs that load external fonts or images can't be drawn safely in a browser canvas, so those parts may be missing. Convert text to outlines in your design app first."),
     ("Is there a size limit?", "You can export up to 8,000 pixels wide. Very large exports can be slow on phones.")],
    _IMG_JS)

tool_page("colour-palette-from-image",
    "Colour Palette From Image – Extract Colours & HEX Codes | etoolbox",
    "Colour palette from image",
    "Pull the main colours out of any photo, logo or design. Get HEX and RGB codes, the share of each colour, CSS variables to paste into your site and a palette image to download. Free, and your image never leaves your device.",
    """
  <form class="panel" data-palette novalidate>
    <label for="pl-count">Number of colours</label><select id="pl-count" name="count"><option>3</option><option>4</option><option selected>6</option><option>8</option><option>10</option><option>12</option></select>
    """ + _drop("pl-input", "Choose an image or drop it here", "Photo, logo, screenshot or artwork · never uploaded") + """
    <div id="pl-work" hidden>
      <div class="pl-grid"><div class="it-stage"><canvas id="pl-view" aria-label="Your image"></canvas></div>
      <div><div id="pl-out" aria-live="polite"></div><p class="hint">Click a colour to copy its HEX code.</p></div></div>
      <div id="pl-actions" hidden><label for="pl-css">CSS variables</label><textarea id="pl-css" rows="6" readonly class="mono"></textarea>
      <div class="actions"><button type="button" class="btn secondary" id="pl-copy">Copy CSS</button><button type="button" class="btn" id="pl-png">Download palette image</button></div></div>
    </div>
  </form>""",
    """<h2>How it works</h2><p>The tool samples thousands of pixels from your image and groups similar colours together (a method called k-means clustering). Each swatch is the average of one group, sorted from the most common to the least, with the share of the image it covers.</p>
<h2>Ideas for using your palette</h2><ul><li>Match a website, presentation or social post to a brand logo.</li><li>Build a colour scheme from a favourite photo or room.</li><li>Pick text and background colours that suit your product photos.</li></ul>
<p>Need one exact colour from a specific spot? Use the <a href="/colour-picker/">colour picker</a>.</p>""",
    [("What's the difference between HEX and RGB?", "They're two ways of writing the same colour. HEX (like #FF6B35) is common in web design; RGB (like rgb(255, 107, 53)) gives the red, green and blue amounts from 0 to 255."),
     ("Why don't I see a small accent colour?", "Very small areas can merge into a bigger nearby colour. Choose more colours to pick out smaller details."),
     ("Is my image uploaded?", "No. The colours are worked out in your browser.")],
    _IMG_JS)
