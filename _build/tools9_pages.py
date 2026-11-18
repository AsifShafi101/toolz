# ---------------- 4x6 shipping label maker ----------------
tool_page("shipping-label-maker",
    "Free 4x6 Shipping Label Maker – Print UK Postage Address Labels | etoolbox",
    "4×6 shipping label maker",
    "Make a clear 4×6 inch address label for a parcel in seconds. Paste an address or type it in, add your return address and an optional barcode, then save a print-ready PDF for your label printer. Free, no sign-up, and nothing is uploaded.",
    """
  <div class="lb-wrap">
    <form class="panel lb-form" data-label novalidate>
      <label for="lb-paste">Quick fill: paste an address <span class="muted">(optional)</span></label>
      <textarea id="lb-paste" rows="4" placeholder="Paste a whole address, e.g. from an order email:&#10;Post to  Jane Smith&#10;12 High Street&#10;Leeds&#10;LS1 4AB&#10;Phone  07700 900123"></textarea>
      <p class="hint" id="lb-parsed" role="status"></p>

      <h3 class="lb-h">Deliver to</h3>
      <label for="lb-name">Full name</label><input type="text" id="lb-name" name="name" autocomplete="off" maxlength="60">
      <label for="lb-company">Company or c/o <span class="muted">(optional)</span></label><input type="text" id="lb-company" name="company" autocomplete="off" maxlength="60">
      <label for="lb-line1">Address line 1</label><input type="text" id="lb-line1" name="line1" autocomplete="off" maxlength="70">
      <label for="lb-line2">Address line 2 <span class="muted">(optional)</span></label><input type="text" id="lb-line2" name="line2" autocomplete="off" maxlength="70">
      <div class="row"><div><label for="lb-town">Town or city</label><input type="text" id="lb-town" name="town" autocomplete="off" maxlength="40"></div>
      <div><label for="lb-county">County <span class="muted">(optional)</span></label><input type="text" id="lb-county" name="county" autocomplete="off" maxlength="40"></div></div>
      <div class="row"><div><label for="lb-postcode">Postcode</label><input type="text" id="lb-postcode" name="postcode" autocomplete="off" maxlength="12" autocapitalize="characters"></div>
      <div><label for="lb-phone">Phone <span class="muted">(optional)</span></label><input type="tel" id="lb-phone" name="phone" autocomplete="off" maxlength="24"></div></div>
      <label for="lb-country">Country <span class="muted">(leave blank for the UK)</span></label><input type="text" id="lb-country" name="country" autocomplete="off" maxlength="40">

      <h3 class="lb-h">From <span class="muted">(return address, remembered on this device)</span></h3>
      <label for="lb-fname">Name or business</label><input type="text" id="lb-fname" name="fromName" maxlength="60">
      <label for="lb-faddr">Address <span class="muted">(optional)</span></label><textarea id="lb-faddr" name="fromAddr" rows="2" maxlength="160"></textarea>
      <label for="lb-fphone">Phone <span class="muted">(optional)</span></label><input type="tel" id="lb-fphone" name="fromPhone" maxlength="24">

      <details class="lb-more" open><summary>Label options</summary>
        <div class="row"><div><label for="lb-service">Service or handling note</label><input type="text" id="lb-service" name="service" list="lb-services" maxlength="30" placeholder="e.g. Tracked 48, Fragile">
          <datalist id="lb-services"><option value="Royal Mail 1st Class"><option value="Royal Mail 2nd Class"><option value="Tracked 24"><option value="Tracked 48"><option value="Special Delivery"><option value="Next Day"><option value="Fragile"><option value="Do not bend"><option value="This way up"></datalist></div>
        <div><label for="lb-ref">Order or reference no. <span class="muted">(adds a barcode)</span></label><input type="text" id="lb-ref" name="ref" maxlength="30"></div></div>
        <div class="row"><div><label for="lb-items">Items <span class="muted">(optional)</span></label><input type="text" id="lb-items" name="items" maxlength="20" placeholder="e.g. 1 of 2"></div>
        <div><label for="lb-weight">Weight <span class="muted">(optional)</span></label><input type="text" id="lb-weight" name="weight" maxlength="12" placeholder="e.g. 1.2 kg"></div></div>
        <div class="row"><div><label for="lb-size">Label size</label><select id="lb-size" name="size"><option value="4x6">4 × 6 inch (thermal printers)</option><option value="100x150">100 × 150 mm</option><option value="a6">A6 (105 × 148 mm)</option></select></div>
        <div><label for="lb-copies">Copies</label><input type="number" id="lb-copies" name="copies" min="1" max="50" value="1"></div></div>
        <div class="row"><div><label for="lb-dt">Date &amp; time stamp <span class="lb-pro">PRO</span></label><select id="lb-dt" name="dt"><option value="datetime">Date and time</option><option value="date">Date only</option><option value="custom">Choose a date and time…</option><option value="none">No date or time</option></select></div>
        <div id="lb-dtc-wrap" hidden><label for="lb-dtc">Date and time</label><input type="datetime-local" id="lb-dtc" name="dtc"></div></div>
        <p class="hint" id="lb-dt-hint">Free labels show the date and time the label was made. With Pro you can change it or leave it off.</p>
        <label class="check"><input type="checkbox" name="stamp"> Leave space for stamps</label>
        <label class="check"><input type="checkbox" name="caps"> Address in capital letters</label>
      </details>
    </form>
    <div class="lb-side">
      <div class="lb-preview"><canvas id="lb-canvas" role="img" aria-label="Preview of your shipping label"></canvas></div>
      <p class="warn" id="lb-warn" role="status" hidden></p>
      <div class="lb-actions">
        <button type="button" class="btn" id="lb-pdf">Download PDF</button>
        <button type="button" class="btn secondary" id="lb-printbtn">Print</button>
        <button type="button" class="btn secondary" id="lb-png">Download PNG</button>
        <button type="button" class="btn ghost" id="lb-clear">New label</button>
      </div>
      <p class="hint" id="lb-done" hidden>Saved. In your printer settings choose the same paper size as the label and <strong>Actual size</strong> (100%), not "Fit to page".</p>
      <p class="privacy-tag">Made in your browser. Addresses are never uploaded.</p>
    </div>
  </div>
  <div id="lb-print" aria-hidden="true"></div><style id="lb-page"></style>
  <div class="modal" id="lb-pro-modal" hidden role="dialog" aria-modal="true" aria-labelledby="lb-pro-title"><div class="modal-box">
    <button type="button" class="modal-x" data-close aria-label="Close">×</button>
    <h3 id="lb-pro-title" style="margin-top:0">That's a Pro feature ⭐</h3>
    <p>With Pro you can change the date and time on your labels or leave them off, and your labels have no etoolbox credit line. Pro also includes branded invoices, dynamic QR codes and unbranded table cards.</p>
    <label for="lb-pro-key">Have a Pro key?</label><div class="row" style="grid-template-columns:1fr auto"><input type="text" id="lb-pro-key" placeholder="ETB-XXXX-XXXX-XXXX-XXXX" autocomplete="off"><button type="button" class="btn" id="lb-pro-activate">Unlock</button></div>
    <p id="lb-pro-msg" class="muted" role="status"></p>
    <div class="btn-row"><a class="btn secondary" href="/pricing/">See Pro plans</a><button type="button" class="btn secondary" data-close>Keep the date and time</button></div>
  </div></div>
""",
    """<h2>How to make a shipping label</h2><ol><li>Paste the address from an order email or message, or type it in. We'll split it into name, street, town and postcode for you.</li>
<li>Add your return address once. It's remembered on this device for next time.</li>
<li>Pick extras if you need them: a service note like <em>Tracked 48</em>, an order number barcode, the number of parcels or the weight. Every label is stamped with the date and time it was made.</li>
<li>Download the PDF and print it on a 4×6 label, or on A6 or 100×150 mm labels.</li></ol>
<h2>Printing tips</h2><ul><li><strong>Thermal label printers</strong> (Zebra, Rollo, MUNBYN, DYMO 4XL and others): choose the 4×6 paper size and print at 100%. The label is black and white at 300 dpi, so it prints sharp.</li>
<li><strong>Normal printers:</strong> print on A6 sticky labels, or on plain paper and tape it to the parcel with clear tape over the whole label.</li>
<li>Put the label on the largest flat side of the parcel, away from seams and edges.</li></ul>
<h2>Is this a postage label?</h2><p>This tool makes the <strong>address label</strong>. It doesn't include paid postage. Buy postage from your carrier, for example Royal Mail Click &amp; Drop, Parcelforce, Evri or DPD, or use stamps: tick <em>Leave space for stamps</em> and stick them in the box.</p>""",
    [("Does the label include postage?", "No. It's an address label. Buy postage from Royal Mail, Evri, DPD or another carrier, or use stamps and tick “Leave space for stamps”."),
     ("What size is a 4×6 label?", "4 × 6 inches, which is 101.6 × 152.4 mm. It's the standard size for thermal label printers. We also make 100 × 150 mm and A6 (105 × 148 mm) labels."),
     ("Can I print several copies?", "Yes. Set the number of copies and the PDF has one label per page, ready for a roll of labels."),
     ("Is my customer's address safe?", "Yes. The label is drawn in your browser and nothing is uploaded or stored on our servers. Only your own return address is remembered, and only on your device."),
     ("Why is there a date and time on the label?", "It shows when the parcel was labelled, which helps when you send a lot of parcels or need to check when something went out. Pro users can change the date and time or leave it off."),
     ("What is the barcode for?", "If you add an order or reference number, we print it as a Code 128 barcode, so you or your courier can scan it to match the parcel to the order.")],
    ("vendor/pdf-lib.min.js", "barcode.js", "label.js"))
