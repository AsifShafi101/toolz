/* etoolbox – translates text that scripts add to the page after it loads (status messages, results,
   feedback box). The page itself is translated when the site is built; this only covers what changes later.
   Strings come from window.ETB_I18N (assets/i18n-<lang>.js). */
(function () {
  "use strict";
  var I = window.ETB_I18N; if (!I || !I.s) return;
  var S = I.s, ATTRS = ["placeholder", "aria-label", "title", "alt"], SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };

  function look(t) {
    var k = t.replace(/\s+/g, " ").trim();
    if (!k) return null;
    var v = S[k];
    return v == null || v === k ? null : { k: k, v: v, lead: (/^\s*/.exec(t) || [""])[0], trail: (/\s*$/.exec(t) || [""])[0] };
  }
  function skip(el) { for (; el && el.nodeType === 1; el = el.parentNode) { if (SKIP[el.tagName] || el.isContentEditable || el.hasAttribute("data-no-tr")) return true; } return false; }
  function textNode(n) {
    if (!n.parentNode || skip(n.parentNode)) return;
    var r = look(n.nodeValue); if (!r) return;
    if (r.v.indexOf("<") < 0) { n.nodeValue = r.lead + r.v + r.trail; return; }
    var tpl = document.createElement("template"); tpl.innerHTML = r.lead + r.v + r.trail; n.parentNode.replaceChild(tpl.content, n);
  }
  function attrs(el) {
    if (el.nodeType !== 1 || skip(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]); if (!a) continue;
      var r = look(a); if (r) el.setAttribute(ATTRS[i], r.v.replace(/<[^>]+>/g, ""));
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (x) { if (x.nodeType === 3) textNode(x); else attrs(x); });
  }
  function start() {
    walk(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === "childList") Array.prototype.forEach.call(m.addedNodes, walk);
        else if (m.type === "characterData") textNode(m.target);
        else if (m.type === "attributes") attrs(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
