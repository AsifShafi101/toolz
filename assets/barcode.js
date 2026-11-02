/* etoolbox barcode generator — Code 128 (B/C), EAN-13, UPC-A. */
(function () {
  "use strict";

  var C128 = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
  var L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
  var G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
  var R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
  var PAR = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

  function widthsToBits(w) { var s = "", bar = true; for (var i = 0; i < w.length; i++) { s += (bar ? "1" : "0").repeat(+w[i]); bar = !bar; } return s; }

  // Code 128: uses set C for all-digit strings of even length >= 4, otherwise set B.
  function code128(text) {
    if (!text) throw new Error("Enter some text or numbers.");
    for (var i = 0; i < text.length; i++) { var c = text.charCodeAt(i); if (c < 32 || c > 126) throw new Error("Code 128 here supports standard keyboard characters only."); }
    var vals;
    if (/^\d+$/.test(text) && text.length >= 4 && text.length % 2 === 0) { vals = [105]; for (i = 0; i < text.length; i += 2) vals.push(parseInt(text.substr(i, 2), 10)); }
    else { vals = [104]; for (i = 0; i < text.length; i++) vals.push(text.charCodeAt(i) - 32); }
    var sum = vals[0]; for (i = 1; i < vals.length; i++) sum += vals[i] * i;
    vals.push(sum % 103); vals.push(106);
    return { bits: vals.map(function (v) { return widthsToBits(C128[v]); }).join(""), text: text };
  }

  function eanCheck(d12) { var s = 0; for (var i = 0; i < 12; i++) s += +d12[i] * (i % 2 ? 3 : 1); return (10 - s % 10) % 10; }

  function ean13(input, isUpc) {
    var d = String(input).replace(/\s|-/g, "");
    if (!/^\d+$/.test(d)) throw new Error("Use digits only.");
    var need = isUpc ? 11 : 12;
    if (d.length === need) d += isUpc ? eanCheck("0" + d) : eanCheck(d);
    else if (d.length === need + 1) {
      var exp = isUpc ? eanCheck("0" + d.slice(0, 11)) : eanCheck(d.slice(0, 12));
      if (+d[d.length - 1] !== exp) throw new Error("The check digit should be " + exp + ". Enter the first " + need + " digits and we'll add it.");
    } else throw new Error((isUpc ? "UPC-A" : "EAN-13") + " needs " + need + " digits (we add the check digit) or " + (need + 1) + " including it.");
    var full = isUpc ? "0" + d : d, bits = "101", par = PAR[+full[0]];
    for (var i = 1; i <= 6; i++) bits += (par[i - 1] === "L" ? L : G)[+full[i]];
    bits += "01010";
    for (i = 7; i <= 12; i++) bits += R[+full[i]];
    bits += "101";
    return { bits: bits, text: isUpc ? d : full, guards: true, digits: full };
  }

  function encode(type, text) { return type === "ean13" ? ean13(text, false) : type === "upca" ? ean13(text, true) : code128(text); }

  function draw(enc, o) {
    var mod = o.module || 3, h = o.height || 100, quiet = 10 * mod, showText = o.showText !== false, font = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    var fs = Math.max(12, Math.round(mod * 6)), textH = showText ? fs + 8 : 0;
    var W = enc.bits.length * mod + quiet * 2, H = h + textH + 2 * mod * 4;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#000";
    var top = mod * 4;
    for (var i = 0; i < enc.bits.length; i++) if (enc.bits[i] === "1") {
      var guard = enc.guards && (i < 3 || (i >= 45 && i < 50) || i >= 92);
      ctx.fillRect(quiet + i * mod, top, mod, h + (guard && showText ? fs / 2 : 0));
    }
    if (showText) {
      ctx.font = "500 " + fs + "px " + font; ctx.textAlign = "center"; ctx.textBaseline = "top";
      if (enc.guards) {
        var y = top + h + 4;
        ctx.textAlign = "right"; ctx.fillText(enc.digits[0], quiet - 2, y);
        ctx.textAlign = "center"; ctx.fillText(enc.digits.slice(1, 7), quiet + 24 * mod, y); ctx.fillText(enc.digits.slice(7), quiet + 71 * mod, y);
      } else ctx.fillText(enc.text, W / 2, top + h + 4);
    }
    return c;
  }

  function svg(enc, o) {
    var mod = o.module || 3, h = o.height || 100, quiet = 10 * mod, W = enc.bits.length * mod + quiet * 2, fs = Math.max(12, Math.round(mod * 6)), H = h + (o.showText !== false ? fs + 8 : 0) + mod * 8, top = mod * 4, d = "";
    for (var i = 0; i < enc.bits.length; i++) if (enc.bits[i] === "1") d += "M" + (quiet + i * mod) + " " + top + "h" + mod + "v" + h + "h-" + mod + "z";
    var t = o.showText !== false ? '<text x="' + W / 2 + '" y="' + (top + h + fs + 2) + '" font-family="Arial, sans-serif" font-size="' + fs + '" text-anchor="middle">' + String(enc.digits || enc.text).replace(/[&<>]/g, "") + "</text>" : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/>' + t + "</svg>";
  }

  function init(form) {
    var host = document.getElementById("bc-canvas"), warn = document.getElementById("bc-warn"), actions = document.getElementById("bc-actions"), cur = null;
    function upd() {
      var e = form.elements, o = { module: parseInt(e.module.value, 10), height: parseInt(e.bh.value, 10), showText: e.showtext.checked };
      var hint = { code128: "Any text or numbers, e.g. SKU-10045", ean13: "12 digits, e.g. 501234567890 (check digit added)", upca: "11 digits, e.g. 03600029145" }[e.btype.value];
      e.data.placeholder = hint;
      warn.textContent = "";
      if (!e.data.value.trim()) { host.innerHTML = '<div class="empty">Your barcode will appear here.</div>'; actions.hidden = true; cur = null; return; }
      try { var enc = encode(e.btype.value, e.data.value.trim()); cur = { enc: enc, o: o }; host.innerHTML = ""; var c = draw(enc, o); c.id = "bc-img"; c.setAttribute("data-text", enc.digits || enc.text); host.appendChild(c); actions.hidden = false; }
      catch (err) { warn.textContent = err.message; host.innerHTML = '<div class="empty">Your barcode will appear here.</div>'; actions.hidden = true; cur = null; }
    }
    function dl(href, name) { var a = document.createElement("a"); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    document.getElementById("bc-png").addEventListener("click", function () { if (cur) dl(draw(cur.enc, cur.o).toDataURL("image/png"), "barcode.png"); });
    document.getElementById("bc-svg").addEventListener("click", function () { if (!cur) return; var u = URL.createObjectURL(new Blob([svg(cur.enc, cur.o)], { type: "image/svg+xml" })); dl(u, "barcode.svg"); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); });
    form.addEventListener("input", upd); form.addEventListener("change", upd); form.addEventListener("submit", function (e) { e.preventDefault(); });
    upd();
  }

  window.ETBBarcode = { encode: encode, eanCheck: eanCheck, C128: C128 };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-barcode]"); if (f) init(f); });
})();
