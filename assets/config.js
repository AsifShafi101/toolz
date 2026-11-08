// Site settings — edit these, no other code changes needed.
window.ETB_CONFIG = {
  siteName: "etoolbox",
  siteUrl: "https://etoolbox.co.uk",
  // Where people can contact you (set up free forwarding in Cloudflare Email Routing).
  contactEmail: "hello@etoolbox.co.uk",
  // Paste your Stripe Payment Links here when ready. While empty, the Pro buttons
  // become "Join early access" and open an email to contactEmail instead.
  proMonthlyCheckoutUrl: "",
  proYearlyCheckoutUrl: "",
  proMonthlyPrice: "£5.99",
  proYearlyPrice: "£49",
  // Usage counter: only shown once the REAL count reaches these numbers (so low early numbers stay hidden).
  showSiteCounterFrom: 1000,
  showToolCounterFrom: 100,
  // Ratings ("92% found this helpful") are shown once a tool has at least this many votes.
  showRatingFrom: 5
};

// Translation hook: on /es/ and /ar/ pages ETB_I18N holds the strings; elsewhere T() returns the English text.
window.T = function (s, v) { var d = window.ETB_I18N && window.ETB_I18N.s, r = (d && d[s]) || s; if (v) r = r.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); return r; };
// Decimal comma for Spanish pages (24.5 -> 24,5); other languages keep the point.
window.ETB_DEC = function (x) { x = String(x); return /^es/.test(document.documentElement.lang || "") ? x.replace(/(\d)\.(\d)/g, "$1,$2") : x; };
