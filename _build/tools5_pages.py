# Batch 5: watermark tools (PDF + image)

def wm_fields(kind):
    pdf = kind == "pdf"
    presets = ("CONFIDENTIAL", "DRAFT", "COPY", "SAMPLE", "PAID") if pdf else ("© Your Business", "SAMPLE", "PROOF", "Do not copy")
    chips = "".join(f'<button type="button" class="wm-chip" data-preset="{p}">{p}</button>' for p in presets)
    default_text = "CONFIDENTIAL" if pdf else "© Your Business"
    return f"""
      <label style="margin-top:14px">Watermark type</label>
      <div class="seg" role="radiogroup" aria-label="Watermark type"><label><input type="radio" name="wtype" value="text" checked><span>Text</span></label><label><input type="radio" name="wtype" value="image"><span>Logo / image</span></label></div>
      <div data-show-when="wtype=text">
        <label for="wtext">Text</label><input type="text" id="wtext" name="wtext" value="{default_text}" maxlength="120">
        <div class="chips" aria-label="Quick text">{chips}</div>
        <div class="row"><div><label for="font">Font</label><select id="font" name="font"><option value="hb">Helvetica Bold</option><option value="h">Helvetica</option><option value="tb">Times Bold</option><option value="cb">Courier Bold</option></select></div>
        <div><label for="colour">Colour</label><input type="color" id="colour" name="colour" value="{'#d62828' if pdf else '#ffffff'}" style="width:100%;height:46px"></div></div>
      </div>
      <div data-show-when="wtype=image">
        <label class="drop small" for="logo-input"><strong>Choose your logo</strong><span class="muted" id="logo-name">PNG with a transparent background works best</span>
          <input type="file" id="logo-input" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only"></label>
      </div>
      <div class="row"><div><label for="position">Position</label><select id="position" name="position">
        <option value="tile"{' ' if pdf else ' selected'}>Tiled across the {'page' if pdf else 'image'} (strongest)</option><option value="c"{' selected' if pdf else ''}>Centre</option>
        <option value="tl">Top left</option><option value="t">Top centre</option><option value="tr">Top right</option><option value="l">Middle left</option><option value="r">Middle right</option>
        <option value="bl">Bottom left</option><option value="b">Bottom centre</option><option value="br">Bottom right</option></select></div>
      <div><label for="angle">Angle: <span id="angle-val"></span></label><input type="range" id="angle" name="angle" min="-90" max="90" step="5" value="{45 if pdf else 30}"></div></div>
      <div class="row"><div><label for="size">Size: <span id="size-val"></span> <span class="hint">of the width</span></label><input type="range" id="size" name="size" min="5" max="100" value="{60 if pdf else 30}"></div>
      <div><label for="opacity">Opacity: <span id="opacity-val"></span></label><input type="range" id="opacity" name="opacity" min="5" max="100" value="{25 if pdf else 45}"></div></div>
      <div data-show-when="position=tile"><label for="gap">Tile spacing: <span id="gap-val"></span></label><input type="range" id="gap" name="gap" min="0" max="200" value="{60 if pdf else 40}"></div>"""


tool_page("add-watermark-to-pdf", "Add Watermark to PDF Free – Text or Logo, No Upload | etoolbox", "Add a watermark to a PDF",
    "Stamp CONFIDENTIAL, DRAFT, your name or your logo on every page of a PDF. Choose tiled or single, angle, size and transparency, and flatten it so it can't be removed. Free, and your PDF never leaves your device.",
    f"""
  <div class="gen">
    <form class="panel" data-wm="pdf" novalidate>
      <label class="drop" id="drop" for="wm-input"><strong>Choose a PDF or drop it here</strong><span class="muted">PDF files · processed on your device, never uploaded</span>
        <input type="file" id="wm-input" accept="application/pdf,.pdf" class="sr-only"></label>
      <ul class="file-list" id="file-list"></ul>
      {wm_fields("pdf")}
      <div class="row"><div><label for="pages">Pages</label><select id="pages" name="pages"><option value="all">All pages</option><option value="first">First page only</option><option value="odd">Odd pages</option><option value="even">Even pages</option><option value="some">Choose pages…</option></select></div>
      <div data-show-when="pages=some"><label for="range">Page numbers</label><input type="text" id="range" name="range" placeholder="e.g. 1-3, 5"></div></div>
      <label class="check" style="margin-top:14px"><input type="checkbox" name="flatten"> <span><strong>Flatten</strong> – lock the watermark in so it can't be deleted in a PDF editor <span class="hint">(text becomes an image and can't be selected)</span></span></label>
      <div class="run-row"><button type="button" class="btn" id="run" disabled>Add watermark</button><span id="wm-msg" class="warn" role="status"></span></div>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Preview <span class="hint">(first page)</span></h3><div id="wm-preview" class="wm-preview"><p class="muted">Choose a PDF to see a live preview.</p></div>
      <div id="wm-out" aria-live="polite" style="margin-top:14px"><p class="muted">Your file will appear here, ready to download.</p></div></div>
  </div>""",
    """<h2>How to watermark a PDF</h2><ol><li>Choose your PDF.</li><li>Type your text (or pick <em>CONFIDENTIAL</em>, <em>DRAFT</em>…) or upload your logo.</li><li>Set the position, angle, size and opacity. The preview updates as you go.</li><li>Click <strong>Add watermark</strong> and download your PDF.</li></ol>
<h2>Make the watermark hard to remove</h2><p>A normal watermark is added as a separate layer, which someone with a PDF editor could delete. For contracts, proofs and price lists you're sending out, use <strong>Tiled</strong> so it covers the whole page and tick <strong>Flatten</strong>. Flattening turns each page into a high-resolution image with the watermark baked in, so it can't be selected or removed.</p>
<h2>Private by design</h2><p>Most PDF websites upload your files to their servers. etoolbox adds the watermark <strong>in your browser</strong>, so confidential documents never leave your device.</p>""",
    [("Is it free?", "Yes. There's no sign-up and no limit, and we don't add our own branding to your PDF."),
     ("Can I use my company logo?", "Yes. Choose 'Logo / image' and upload a PNG, JPG or WebP. A PNG with a transparent background looks best."),
     ("Can I watermark only some pages?", "Yes. Choose first page, odd or even pages, or type page numbers such as 1-3, 5."),
     ("Does it work with rotated or landscape pages?", "Yes. The watermark is placed according to how each page is displayed."),
     ("Will flattening make my file bigger?", "Usually yes, because each page becomes an image. Leave Flatten off if the file needs to stay small or the text needs to stay searchable.")],
    ("vendor/pdf-lib.min.js", "pdftools.js", "watermark.js"))


tool_page("add-watermark-to-image", "Watermark Photos Free – Add Text or Logo to JPG/PNG | etoolbox", "Add a watermark to photos",
    "Protect your photos with a text or logo watermark. Watermark up to 50 JPG, PNG or WebP images at once, tiled or in a corner, then download them all as a zip. Free, no sign-up, and nothing is uploaded.",
    f"""
  <div class="gen">
    <form class="panel" data-wm="img" novalidate>
      <label class="drop" id="drop" for="wm-input"><strong>Choose photos or drop them here</strong><span class="muted">JPG, PNG or WebP · up to 50 at a time · never uploaded</span>
        <input type="file" id="wm-input" accept="image/jpeg,image/png,image/webp" multiple class="sr-only"></label>
      <p class="hint" id="wm-count" style="margin:8px 0 0"></p>
      {wm_fields("img")}
      <label class="check" style="margin-top:14px"><input type="checkbox" name="outline" checked> Add an outline so it shows on light and dark areas</label>
      <label for="format">Save as</label><select id="format" name="format"><option value="same">Same format as the original</option><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select>
      <div class="run-row"><button type="button" class="btn" id="run" disabled>Watermark photos</button><span id="wm-msg" class="warn" role="status"></span></div>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Preview</h3><div id="wm-preview" class="wm-preview"><p class="muted">Choose photos to see a live preview.</p></div>
      <ul class="img-results" id="wm-results"></ul><button type="button" class="btn" id="dl-all" hidden style="margin-top:12px">Download all (.zip)</button></div>
  </div>""",
    """<h2>How to watermark photos</h2><ol><li>Choose one or more photos (up to 50).</li><li>Type your text, such as <em>© Your Business</em>, or upload your logo.</li><li>Pick <strong>Tiled</strong> for the strongest protection or a corner for a subtle mark, then adjust size and opacity.</li><li>Click <strong>Watermark photos</strong> and download them one by one or as a zip.</li></ol>
<h2>Tips for a watermark that works</h2><ul><li><strong>Tiled watermarks</strong> are much harder to crop or edit out than a single corner logo.</li><li>Keep opacity around 30–50% so the photo is still enjoyable to look at.</li><li>Leave the <strong>outline</strong> on so white text still shows on bright skies and white backgrounds.</li><li>Always keep your original, un-watermarked photos somewhere safe.</li></ul>
<h2>Good for</h2><ul><li>Product photos for eBay, Etsy, Vinted and your website</li><li>Property photos for lettings and sales</li><li>Photography proofs for clients</li><li>Social media posts and portfolios</li></ul>""",
    [("Is it free?", "Yes. No sign-up, no limits, and no etoolbox branding added to your photos."),
     ("Are my photos uploaded?", "No. Watermarks are added in your browser and your photos never leave your device."),
     ("Is the photo quality reduced?", "Photos keep their original size. JPGs are saved at high quality (92%). Choose PNG if you need lossless output."),
     ("Can I remove a watermark from someone else's photo?", "No. etoolbox only adds watermarks. Removing other people's watermarks usually breaks copyright law.")],
    ("vendor/fflate.min.js", "watermark.js"))
