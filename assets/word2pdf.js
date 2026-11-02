/* etoolbox Word to PDF — converts .docx to HTML with mammoth (BSD-2), then prints to PDF. Nothing is uploaded. */
(function () {
  "use strict";
  function init(form) {
    var input = document.getElementById("doc-input"), drop = document.getElementById("drop"), doc = document.getElementById("doc");
    var msg = document.getElementById("doc-msg"), btn = document.getElementById("print-doc"), name = "document";

    function take(fl) {
      var f = fl && fl[0]; msg.textContent = "";
      if (!f) return;
      if (!/\.docx$/i.test(f.name)) { msg.textContent = /\.doc$/i.test(f.name) ? "Old .doc files aren't supported. In Word, use File → Save As → .docx first." : "Please choose a Word document (.docx)."; return; }
      name = f.name.replace(/\.docx$/i, "");
      doc.innerHTML = '<p class="muted">Converting…</p>';
      f.arrayBuffer().then(function (ab) {
        return mammoth.convertToHtml({ arrayBuffer: ab }, { styleMap: ["p[style-name='Title'] => h1.doc-h-title:fresh"] });
      }).then(function (res) {
        doc.innerHTML = res.value || '<p class="muted">This document appears to be empty.</p>';
        Array.prototype.forEach.call(doc.querySelectorAll("a[href]"), function (a) { if (!/^(https?:|mailto:|#)/i.test(a.getAttribute("href"))) a.removeAttribute("href"); });
        doc.setAttribute("data-ready", "1"); btn.disabled = false;
        var warn = res.messages.filter(function (m) { return m.type === "warning"; }).length;
        msg.textContent = warn ? "Converted. Some advanced formatting (e.g. text boxes or columns) may look different." : "";
        document.getElementById("doc-name").textContent = f.name;
      }).catch(function () { doc.innerHTML = ""; msg.textContent = "This file couldn't be read. Is it a valid .docx document?"; });
    }
    input.addEventListener("change", function () { take(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { take(e.dataTransfer.files); });
    btn.addEventListener("click", function () { var t = document.title; document.title = name; window.print(); setTimeout(function () { document.title = t; }, 1000); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  document.addEventListener("DOMContentLoaded", function () { var f = document.querySelector("form[data-word2pdf]"); if (f) init(f); });
})();
