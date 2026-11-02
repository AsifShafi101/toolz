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
    var logo = url(v.logo) ? '<img src="' + esc(url(v.logo)) + '" alt="' + esc(v.company) + '" width="80" style="display:block;width:80px;max-width:80px;height:auto;border:0">' : "";
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

  function init(form) {
    var prev = document.getElementById("sig-preview"), msg = document.getElementById("sig-msg");
    try { var saved = JSON.parse(localStorage.getItem(KEY) || "{}"); Object.keys(saved).forEach(function (k) { if (form.elements[k] && form.elements[k].type !== "radio") form.elements[k].value = saved[k]; else if (form.elements[k]) form.elements[k].value = saved[k]; }); } catch (e) {}
    function vals() { var v = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name && (el.type !== "radio" || el.checked)) v[el.name] = el.value.trim(); }); return v; }
    function upd() { var v = vals(); prev.innerHTML = build(v); try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
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
