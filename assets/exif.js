/* etoolbox photo metadata viewer & cleaner — reads EXIF/GPS with exifr (MIT) and strips it without re-compressing where possible. */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function kb(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(2) + " MB"; }

  // JPEG: drop APP1 (EXIF/XMP), APP13 (IPTC/Photoshop) and COM segments. Keeps APP0/APP2 (ICC colour) and image data byte-for-byte.
  function stripJpeg(u8) {
    if (u8[0] !== 0xff || u8[1] !== 0xd8) throw new Error("not jpeg");
    var out = [u8.subarray(0, 2)], i = 2, removed = 0;
    while (i < u8.length) {
      if (u8[i] !== 0xff) throw new Error("bad marker");
      var m = u8[i + 1];
      if (m === 0xda) { out.push(u8.subarray(i)); break; }            // start of scan: copy the rest
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { out.push(u8.subarray(i, i + 2)); i += 2; continue; }
      var len = (u8[i + 2] << 8) | u8[i + 3], seg = u8.subarray(i, i + 2 + len);
      if (m === 0xe1 || m === 0xed || m === 0xfe || (m >= 0xe3 && m <= 0xef && m !== 0xee)) removed += seg.length; else out.push(seg);
      i += 2 + len;
    }
    var total = out.reduce(function (s, a) { return s + a.length; }, 0), res = new Uint8Array(total), o = 0;
    out.forEach(function (a) { res.set(a, o); o += a.length; });
    return { bytes: res, removed: removed };
  }
  // PNG: drop text/time/EXIF chunks.
  function stripPng(u8) {
    var sig = [137, 80, 78, 71, 13, 10, 26, 10]; for (var k = 0; k < 8; k++) if (u8[k] !== sig[k]) throw new Error("not png");
    var out = [u8.subarray(0, 8)], i = 8, removed = 0, dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    while (i < u8.length) {
      var len = dv.getUint32(i), type = String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]), chunk = u8.subarray(i, i + 12 + len);
      if (/^(tEXt|iTXt|zTXt|eXIf|tIME)$/.test(type)) removed += chunk.length; else out.push(chunk);
      i += 12 + len; if (type === "IEND") break;
    }
    var total = out.reduce(function (s, a) { return s + a.length; }, 0), res = new Uint8Array(total), o = 0;
    out.forEach(function (a) { res.set(a, o); o += a.length; });
    return { bytes: res, removed: removed };
  }
  function reencode(file) {
    return createImageBitmap(file, { imageOrientation: "from-image" }).then(function (bmp) {
      var c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height; c.getContext("2d").drawImage(bmp, 0, 0);
      var type = file.type === "image/png" ? "image/png" : "image/jpeg";
      return new Promise(function (res) { c.toBlob(function (b) { b.arrayBuffer().then(function (ab) { res({ bytes: new Uint8Array(ab), type: type, reencoded: true }); }); }, type, 0.95); });
    });
  }
  function clean(file, meta) {
    return file.arrayBuffer().then(function (ab) {
      var u8 = new Uint8Array(ab), orient = meta && meta.Orientation;
      var rotated = orient && orient !== 1 && orient !== "Horizontal (normal)";
      if (file.type === "image/jpeg" && !rotated) { var r = stripJpeg(u8); return { bytes: r.bytes, type: "image/jpeg" }; }
      if (file.type === "image/png") { var p = stripPng(u8); return { bytes: p.bytes, type: "image/png" }; }
      return reencode(file); // rotated JPEGs, WebP, HEIC etc.: bake orientation in, metadata dropped
    });
  }

  var LABELS = { Make: "Camera make", Model: "Camera model", LensModel: "Lens", DateTimeOriginal: "Taken", CreateDate: "Created", ModifyDate: "Modified", Software: "Software", Artist: "Artist", Copyright: "Copyright", ExposureTime: "Shutter", FNumber: "Aperture", ISO: "ISO", FocalLength: "Focal length", Flash: "Flash", Orientation: "Orientation", ExifImageWidth: "Width", ExifImageHeight: "Height", latitude: "Latitude", longitude: "Longitude", GPSAltitude: "Altitude", HostComputer: "Device", OwnerName: "Owner", SerialNumber: "Serial number", BodySerialNumber: "Body serial", ImageDescription: "Description", UserComment: "Comment" };
  function fmt(k, v) {
    if (v instanceof Date) return v.toLocaleString("en-GB");
    if (k === "ExposureTime" && typeof v === "number") return v < 1 ? "1/" + Math.round(1 / v) + " s" : v + " s";
    if (k === "FNumber") return "f/" + v; if (k === "FocalLength") return v + " mm"; if (k === "GPSAltitude") return Math.round(v) + " m";
    if (v && typeof v === "object" && !Array.isArray(v)) return "";
    return Array.isArray(v) ? v.join(", ") : String(v);
  }

  function init(form) {
    var list = document.getElementById("meta-list"), allBtn = document.getElementById("meta-all"), results = [];
    function take(fl) {
      var files = Array.prototype.filter.call(fl, function (f) { return /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name); }).slice(0, 50);
      if (!files.length) { list.innerHTML = '<p class="warn">Please choose photos (JPG, PNG, WebP or HEIC).</p>'; return; }
      list.innerHTML = ""; results = []; allBtn.hidden = true;
      var chain = Promise.resolve();
      files.forEach(function (f, idx) {
        var card = document.createElement("div"); card.className = "meta-card"; card.innerHTML = '<p class="muted">Reading ' + esc(f.name) + "…</p>"; list.appendChild(card);
        chain = chain.then(function () { return exifr.parse(f, { tiff: true, exif: true, gps: true, iptc: true, xmp: true, ifd1: false, translateValues: true, reviveValues: true }).catch(function () { return null; }); }).then(function (meta) {
          meta = meta || {};
          var keys = Object.keys(LABELS).filter(function (k) { return meta[k] != null && fmt(k, meta[k]) !== ""; });
          var hasGps = typeof meta.latitude === "number" && typeof meta.longitude === "number";
          var total = Object.keys(meta).length;
          return clean(f, meta).then(function (c) {
            var ext = c.type === "image/png" ? "png" : "jpg", name = f.name.replace(/\.[^.]+$/, "") + "-clean." + ext, blob = new Blob([c.bytes], { type: c.type }), url = URL.createObjectURL(blob);
            results.push({ name: name, bytes: c.bytes });
            card.innerHTML = '<div class="meta-head"><img src="' + url + '" alt=""><div><strong>' + esc(f.name) + '</strong><span class="muted">' + kb(f.size) + " → " + kb(blob.size) + " · " + (total ? total + " metadata fields found" : "no metadata found") + "</span>" +
              (hasGps ? '<span class="gps-warn">📍 Contains GPS location: <a href="https://www.google.com/maps?q=' + meta.latitude.toFixed(6) + "," + meta.longitude.toFixed(6) + '" target="_blank" rel="noopener">' + meta.latitude.toFixed(5) + ", " + meta.longitude.toFixed(5) + "</a></span>" : "") +
              '</div><a class="btn small" href="' + url + '" download="' + esc(name) + '">Download clean copy</a></div>' +
              (keys.length ? '<details' + (idx === 0 ? " open" : "") + '><summary>What this photo reveals (' + keys.length + ")</summary><div class=\"calc-out\">" + keys.map(function (k) { return '<div class="calc-row"><span>' + LABELS[k] + "</span><strong>" + esc(fmt(k, meta[k])) + "</strong></div>"; }).join("") + "</div></details>" : "") +
              (c.reencoded ? '<p class="hint">This photo was re-saved at high quality so it stays the right way up.</p>' : '<p class="hint">Metadata removed without re-compressing, so image quality is untouched.</p>');
            card.setAttribute("data-out", JSON.stringify({ gps: hasGps, fields: total, inSize: f.size, outSize: blob.size, reencoded: !!c.reencoded }));
          });
        }).catch(function () { card.innerHTML = '<p class="warn">' + esc(f.name) + ": couldn't be processed.</p>"; });
      });
      chain.then(function () { if (results.length > 1) allBtn.hidden = false; list.setAttribute("data-done", results.length); });
    }
    allBtn.addEventListener("click", function () { var z = {}; results.forEach(function (r) { z[r.name] = [r.bytes, { level: 0 }]; }); var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([fflate.zipSync(z)], { type: "application/zip" })); a.download = "clean-photos.zip"; a.click(); });
    var input = document.getElementById("meta-input"), drop = document.getElementById("drop");
    input.addEventListener("change", function () { take(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { take(e.dataTransfer.files); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  window.ETBExif = { stripJpeg: stripJpeg, stripPng: stripPng };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-exif]"); if (f) init(f); });
})();
