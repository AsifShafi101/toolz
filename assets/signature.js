/* etoolbox email signature generator. Details are saved in this browser only. */
(function () {
  "use strict";
  var KEY = "etb-signature-v1";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function url(u) { u = String(u || "").trim(); if (!u || (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:\/\//i.test(u))) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ""; }
  function telHref(p) { return "tel:" + String(p).replace(/[^\d+]/g, ""); }

  function build(v) {
    var c = /^#[0-9a-f]{6}$/i.test(v.color || "") ? v.color : "#ff6b35", font = "Arial, Helvetica, sans-serif";
    var lines = [];
    if (v.phone) lines.push('<a href="' + telHref(v.phone) + '" style="color:#333;text-decoration:none">' + esc(v.phone) + "</a>");
    if (v.mobile) lines.push('<a href="' + telHref(v.mobile) + '" style="color:#333;text-decoration:none">' + esc(v.mobile) + "</a>");
    if (v.email) lines.push('<a href="mailto:' + esc(v.email) + '" style="color:#333;text-decoration:none">' + esc(v.email) + "</a>");
    var site = url(v.website); if (site) lines.push('<a href="' + esc(site) + '" style="color:' + c + ';text-decoration:none">' + esc(v.website.replace(/^https?:\/\//, "").replace(/\/$/, "")) + "</a>");
    var socials = [["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X"], ["tiktok", "TikTok"]].filter(function (s) { return url(v[s[0]]); })
      .map(function (s) { return '<a href="' + esc(url(v[s[0]])) + '" style="color:' + c + ';text-decoration:none;font-weight:bold">' + s[1] + "</a>"; }).join(' <span style="color:#bbb">|</span> ');
    var lw = Math.max(40, Math.min(200, parseInt(v.logosize, 10) || 90));
    var src = url(v.logo) || (/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(v.logoData || "") ? v.logoData : "");
    var logo = src ? '<img src="' + esc(src) + '" alt="' + esc(v.company || "Logo") + '" width="' + lw + '" style="display:block;width:' + lw + 'px;max-width:' + lw + 'px;height:auto;border:0">' : "";
    var name = '<div style="font-size:16px;font-weight:bold;color:#111">' + esc(v.name || "Your Name") + "</div>";
    var role = (v.title || v.company) ? '<div style="font-size:13px;color:#555">' + esc([v.title, v.company].filter(Boolean).join(" · ")) + "</div>" : "";
    var info = '<div style="font-size:13px;color:#333;line-height:1.6;margin-top:6px">' + lines.join("<br>") + (v.address ? "<br>" + esc(v.address) : "") + "</div>";
    var soc = socials ? '<div style="font-size:12px;margin-top:6px">' + socials + "</div>" : "";
    var note = v.note ? '<div style="font-size:11px;color:#888;margin-top:8px;max-width:420px">' + esc(v.note) + "</div>" : "";
    if (v.layout === "stacked") {
      return '<table cellpadding="0" cellspacing="0" border="0" style="font-family:' + font + ';border-collapse:collapse"><tr><td style="border-top:3px solid ' + c + ';padding-top:10px">' +
        (logo ? logo + '<div style="height:8px"></div>' : "") + name + role + info + soc + note + "</td></tr></table>";
    }
    return '<table cellpadding="0" cellspacing="0" border="0" style="font-family:' + font + ';border-collapse:collapse"><tr>' +
      (logo ? '<td style="padding-right:14px;vertical-align:top">' + logo + "</td>" : "") +
      '<td style="border-left:3px solid ' + c + ';padding-left:14px;vertical-align:top">' + name + role + info + soc + "</td></tr>" +
      (note ? '<tr><td colspan="2">' + note + "</td></tr>" : "") + "</table>";
  }

  // Shrink the logo (max 400px wide for sharp retina display) and return PNG/JPG bytes + a data URL.
  function prepareLogo(file) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error("Please choose an image (PNG, JPG, WebP or SVG)."));
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth || 400, h = img.naturalHeight || 400, s = Math.min(1, 400 / w, 400 / h);
        var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
        var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var png = c.toDataURL("image/png"), out = png;
        if (png.length > 250000) { var j = document.createElement("canvas"); j.width = c.width; j.height = c.height; var jx = j.getContext("2d"); jx.fillStyle = "#fff"; jx.fillRect(0, 0, j.width, j.height); jx.drawImage(c, 0, 0); out = j.toDataURL("image/jpeg", 0.85); }
        var bin = atob(out.split(",")[1]), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        res({ dataUrl: out, bytes: bytes, type: /png/.test(out.slice(0, 20)) ? "image/png" : "image/jpeg" });
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error("This image couldn't be opened.")); };
      img.src = u;
    });
  }

  function init(form) {
    var prev = document.getElementById("sig-preview"), msg = document.getElementById("sig-msg"), logoMsg = document.getElementById("logo-msg"), logoData = "";
    try { var saved = JSON.parse(localStorage.getItem(KEY) || "{}"); Object.keys(saved).forEach(function (k) { if (form.elements[k] && form.elements[k].type !== "radio") form.elements[k].value = saved[k]; else if (form.elements[k]) form.elements[k].value = saved[k]; }); } catch (e) {}
    function vals() { var v = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name && el.type !== "file" && (el.type !== "radio" || el.checked)) v[el.name] = el.value.trim(); }); v.logoData = logoData; return v; }
    function upd() { var v = vals(); prev.innerHTML = build(v); document.getElementById("logo-remove").hidden = !(v.logo || v.logoData); var keep = {}; Object.keys(v).forEach(function (k) { if (k !== "logoData") keep[k] = v[k]; }); try { localStorage.setItem(KEY, JSON.stringify(keep)); } catch (e) {} }
    document.getElementById("logo-file").addEventListener("change", function (e) {
      var f = e.target.files[0]; e.target.value = ""; if (!f) return;
      logoMsg.className = "hint"; logoMsg.textContent = "Preparing your logo…";
      prepareLogo(f).then(function (p) {
        logoData = p.dataUrl; form.elements.logo.value = ""; upd();
        logoMsg.textContent = "Uploading so it shows in Gmail too…";
        return fetch("/api/logo", { method: "POST", headers: { "content-type": p.type }, body: p.bytes }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || "upload failed"); return j.url; });
        }).then(function (hosted) {
          form.elements.logo.value = hosted; logoData = ""; upd();
          logoMsg.className = "good"; logoMsg.textContent = "✓ Logo added. It works in Gmail, Outlook and Apple Mail.";
          document.getElementById("logo-remove").hidden = false;
        }).catch(function (err) {
          document.getElementById("logo-remove").hidden = false;
          logoMsg.className = "warn"; logoMsg.textContent = "Logo added and embedded in the signature (works in Outlook and Apple Mail). We couldn't host it" + (err && /large|PNG|JPG/.test(err.message) ? " (" + err.message + ")" : "") + ", so Gmail may not show it. Try again later or paste a logo web address below.";
        });
      }).catch(function (err) { logoMsg.className = "warn"; logoMsg.textContent = err.message; });
    });
    document.getElementById("logo-remove").addEventListener("click", function () { logoData = ""; form.elements.logo.value = ""; logoMsg.textContent = ""; this.hidden = true; upd(); });
    function flash(t) { msg.textContent = t; setTimeout(function () { msg.textContent = ""; }, 2500); }
    document.getElementById("copy-sig").addEventListener("click", function () {
      var html = build(vals());
      if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([prev.innerText], { type: "text/plain" }) })])
          .then(function () { flash("Copied! Paste it into your email signature settings."); }, fallback);
      } else fallback();
      function fallback() { var r = document.createRange(); r.selectNodeContents(prev); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand("copy"); flash("Copied! Paste it into your email signature settings."); } catch (e) { flash("Select the signature and copy it."); } s.removeAllRanges(); }
    });
    document.getElementById("copy-html").addEventListener("click", function () {
      var t = build(vals());
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { flash("HTML copied."); }, function () { flash("Couldn't copy. Please try again."); });
    });
    form.addEventListener("input", upd); form.addEventListener("change", upd); form.addEventListener("submit", function (e) { e.preventDefault(); });
    upd();
  }

  window.ETBSignature = { build: build };
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-signature]"); if (f) init(f); });
})();
