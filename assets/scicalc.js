/* etoolbox – maths tools: scientific calculator (with table of values), number base converter,
   fraction calculator, statistics calculator. Own parser (no eval). Everything runs in the browser. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ================= Scientific expression engine ================= */
  var FUNCS = {
    sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, sinh: 1, cosh: 1, tanh: 1, asinh: 1, acosh: 1, atanh: 1,
    log: 1, ln: 1, sqrt: 1, cbrt: 1, abs: 1, exp: 1, round: 1, floor: 1, ceil: 1
  };
  // Normalise the friendly symbols shown on screen into parser tokens
  function normalise(s) {
    return String(s)
      .replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-")
      .replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/∛/g, "cbrt")
      .replace(/sin⁻¹/g, "asin").replace(/cos⁻¹/g, "acos").replace(/tan⁻¹/g, "atan")
      .replace(/sinh⁻¹/g, "asinh").replace(/cosh⁻¹/g, "acosh").replace(/tanh⁻¹/g, "atanh")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁻¹/g, "^(-1)")
      .replace(/×10\^/g, "E").replace(/\s+/g, "");
  }
  function tokenize(src) {
    var s = normalise(src), out = [], i = 0, m;
    while (i < s.length) {
      var rest = s.slice(i);
      if ((m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(rest))) { out.push({ t: "num", v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^(asinh|acosh|atanh|asin|acos|atan|sinh|cosh|tanh|sin|cos|tan|log|ln|sqrt|cbrt|abs|exp|round|floor|ceil)/.exec(rest))) { out.push({ t: "fn", v: m[1] }); i += m[1].length; continue; }
      if ((m = /^(pi|Ans|e|x|X)/.exec(rest))) { out.push({ t: "const", v: m[1] === "X" ? "x" : m[1] }); i += m[1].length; continue; }
      var c = s[i];
      if ("+-*/^(),!%CP".indexOf(c) >= 0) { out.push({ t: c === "(" || c === ")" ? c : c === "," ? "," : "op", v: c }); i++; continue; }
      throw new Error("I don't understand '" + c + "'");
    }
    return out;
  }
  /* Recursive-descent parser. Precedence (low→high): + −, × ÷ (and implicit ×), nCr/nPr, unary −, ^ (right-assoc), postfix ! % ² */
  function parse(tokens, env) {
    var p = 0;
    function peek() { return tokens[p]; }
    function next() { return tokens[p++]; }
    function isStart(t) { return t && (t.t === "num" || t.t === "fn" || t.t === "const" || t.t === "("); }
    function expr() {
      var v = term();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) { var o = next().v, r = term(); v = o === "+" ? v + r : v - r; }
      return v;
    }
    function term() {
      var v = comb();
      for (;;) {
        var t = peek();
        if (t && t.t === "op" && (t.v === "*" || t.v === "/")) { next(); var r = comb(); if (t.v === "/" && r === 0) throw new Error("Can't divide by zero"); v = t.v === "*" ? v * r : v / r; }
        else if (isStart(t)) { v = v * comb(); } // implicit multiplication: 2π, 3(4), 2sin30
        else break;
      }
      return v;
    }
    function comb() {
      var v = unary();
      while (peek() && peek().t === "op" && (peek().v === "C" || peek().v === "P")) { var o = next().v, r = unary(); v = o === "C" ? nCr(v, r) : nPr(v, r); }
      return v;
    }
    function unary() {
      var t = peek();
      if (t && t.t === "op" && (t.v === "-" || t.v === "+")) { next(); var v = unary(); return t.v === "-" ? -v : v; }
      return power();
    }
    function power() {
      var b = postfix();
      if (peek() && peek().t === "op" && peek().v === "^") { next(); var e = unary(); var r = Math.pow(b, e); if (isNaN(r) && b < 0) { var q = 1 / e; if (Math.abs(q - Math.round(q)) < 1e-9 && Math.round(q) % 2) r = -Math.pow(-b, e); } return r; }
      return b;
    }
    function postfix() {
      var v = primary();
      for (;;) {
        var t = peek();
        if (t && t.t === "op" && t.v === "!") { next(); v = fact(v); }
        else if (t && t.t === "op" && t.v === "%") { next(); v = v / 100; }
        else break;
      }
      return v;
    }
    function primary() {
      var t = next();
      if (!t) throw new Error("The expression isn't finished");
      if (t.t === "num") return t.v;
      if (t.t === "const") { if (t.v === "pi") return Math.PI; if (t.v === "e") return Math.E; if (t.v === "Ans") return env.ans || 0; if (t.v === "x") { if (env.x === undefined) throw new Error("Use x only in the table of values"); return env.x; } }
      if (t.t === "(") { var v = expr(); if (peek() && peek().t === ")") next(); return v; } // missing ) at the end is allowed
      if (t.t === "fn") {
        var arg;
        if (peek() && peek().t === "(") { next(); arg = expr(); if (peek() && peek().t === ")") next(); }
        else arg = power(); // sin30, √9
        return applyFn(t.v, arg, env);
      }
      throw new Error("Something is missing before '" + t.v + "'");
    }
    var v = expr();
    if (p < tokens.length) throw new Error("Check the brackets near '" + tokens[p].v + "'");
    return v;
  }
  function toRad(v, mode) { return mode === "deg" ? v * Math.PI / 180 : mode === "grad" ? v * Math.PI / 200 : v; }
  function fromRad(v, mode) { return mode === "deg" ? v * 180 / Math.PI : mode === "grad" ? v * 200 / Math.PI : v; }
  function cleanTrig(r) { return Math.abs(r) < 1e-13 ? 0 : Math.abs(r - Math.round(r)) < 1e-13 ? Math.round(r) : r; }
  function applyFn(f, a, env) {
    var m = env.mode || "deg";
    switch (f) {
      case "sin": return cleanTrig(Math.sin(toRad(a, m)));
      case "cos": return cleanTrig(Math.cos(toRad(a, m)));
      case "tan": { var c = Math.cos(toRad(a, m)); if (Math.abs(c) < 1e-13) throw new Error("tan is undefined here"); return cleanTrig(Math.sin(toRad(a, m)) / c); }
      case "asin": if (a < -1 || a > 1) throw new Error("sin⁻¹ needs a value from −1 to 1"); return fromRad(Math.asin(a), m);
      case "acos": if (a < -1 || a > 1) throw new Error("cos⁻¹ needs a value from −1 to 1"); return fromRad(Math.acos(a), m);
      case "atan": return fromRad(Math.atan(a), m);
      case "sinh": return Math.sinh(a); case "cosh": return Math.cosh(a); case "tanh": return Math.tanh(a);
      case "asinh": return Math.asinh(a); case "acosh": return Math.acosh(a); case "atanh": return Math.atanh(a);
      case "log": if (a <= 0) throw new Error("log needs a positive number"); return Math.log10(a);
      case "ln": if (a <= 0) throw new Error("ln needs a positive number"); return Math.log(a);
      case "sqrt": if (a < 0) throw new Error("Can't take the square root of a negative number"); return Math.sqrt(a);
      case "cbrt": return Math.cbrt(a);
      case "abs": return Math.abs(a); case "exp": return Math.exp(a);
      case "round": return Math.round(a); case "floor": return Math.floor(a); case "ceil": return Math.ceil(a);
    }
    throw new Error("Unknown function " + f);
  }
  function fact(n) {
    if (n < 0 || Math.abs(n - Math.round(n)) > 1e-9) throw new Error("x! needs a whole number of 0 or more");
    n = Math.round(n); if (n > 170) throw new Error("That factorial is too large");
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  function nPr(n, r) { if (r > n || r < 0 || n % 1 || r % 1) throw new Error("nPr needs whole numbers with r ≤ n"); var v = 1; for (var i = 0; i < r; i++) v *= n - i; return v; }
  function nCr(n, r) { if (r > n || r < 0 || n % 1 || r % 1) throw new Error("nCr needs whole numbers with r ≤ n"); r = Math.min(r, n - r); var v = 1; for (var i = 1; i <= r; i++) v = v * (n - r + i) / i; return Math.round(v); }
  function evaluate(expr, env) {
    env = env || {}; var toks = tokenize(expr); if (!toks.length) throw new Error("Type a calculation");
    var v = parse(toks, env);
    if (!isFinite(v)) throw new Error(isNaN(v) ? "That isn't a real number" : "The answer is too large");
    return v;
  }
  /* Number formatting like a calculator: 10 significant digits, ×10^n for very large/small values */
  function fmt(v) {
    if (v === 0) return "0";
    var a = Math.abs(v);
    if (a >= 1e10 || a < 1e-9) { var s = v.toExponential(9).replace(/\.?0+e/, "e"); var parts = s.split("e"); return parts[0] + "×10^" + parseInt(parts[1], 10); }
    var r = parseFloat(v.toPrecision(10)); return String(r);
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  /* Decimal → fraction (continued fractions), only when it's clearly exact */
  function toFraction(v, maxDen) {
    maxDen = maxDen || 10000; if (!isFinite(v) || Math.abs(v) > 1e12) return null;
    var sign = v < 0 ? -1 : 1, x = Math.abs(v), h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (var i = 0; i < 40; i++) {
      var a = Math.floor(b), h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break; h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(x - h1 / k1) < 1e-13 * Math.max(1, x)) return { n: sign * h1, d: k1 };
      if (b - a < 1e-12) break; b = 1 / (b - a);
    }
    return null;
  }
  function fracText(f, mixed) {
    if (!f) return null; if (f.d === 1) return String(f.n);
    if (mixed && Math.abs(f.n) > f.d) { var w = Math.trunc(f.n / f.d), r = Math.abs(f.n % f.d); return w + " " + r + "/" + f.d; }
    return f.n + "/" + f.d;
  }
  /* Simple surd form for square roots: a√b/c (only for exact matches) */
  function toSurd(v) {
    if (!isFinite(v) || v === 0) return null; var sign = v < 0 ? "−" : "", x = Math.abs(v), sq = x * x;
    for (var c = 1; c <= 12; c++) {
      var t = sq * c * c, ti = Math.round(t); if (Math.abs(t - ti) > 1e-8 * Math.max(1, t) || ti < 2) continue;
      var a = 1, b = ti; for (var k = Math.floor(Math.sqrt(b)); k > 1; k--) if (b % (k * k) === 0) { a *= k; b /= k * k; break; }
      if (b === 1) return null; var g = gcd(a, c); a /= g; var cc = c / g;
      return sign + (a === 1 ? "" : a) + "√" + b + (cc === 1 ? "" : "/" + cc);
    }
    return null;
  }

  /* ================= Scientific calculator UI ================= */
  function initSci(root) {
    var input = $("sci-expr"), out = $("sci-out"), alt = $("sci-alt"), err = $("sci-err"), hist = $("sci-hist");
    var state = { mode: "deg", ans: 0, mem: 0, shift: false, form: 0, lastVal: null, history: [] };
    try { var saved = JSON.parse(localStorage.getItem("etb-sci") || "null"); if (saved) { state.mode = saved.mode || "deg"; state.mem = saved.mem || 0; state.history = saved.history || []; } } catch (e) { /* storage off */ }
    function save() { try { localStorage.setItem("etb-sci", JSON.stringify({ mode: state.mode, mem: state.mem, history: state.history.slice(0, 12) })); } catch (e) { /* ignore */ } }
    function insert(txt) {
      var s = input.selectionStart == null ? input.value.length : input.selectionStart, e = input.selectionEnd == null ? s : input.selectionEnd;
      if (state.lastVal !== null && s === input.value.length && /^[+\-×÷^²³⁻¹!%CP]/.test(txt)) { input.value = "Ans"; s = e = 3; }
      else if (state.lastVal !== null && s === input.value.length) { input.value = ""; s = e = 0; }
      state.lastVal = null;
      input.value = input.value.slice(0, s) + txt + input.value.slice(e);
      var pos = s + txt.length; input.focus({ preventScroll: true }); input.setSelectionRange(pos, pos); live();
    }
    function showResult(v) {
      var dec = fmt(v), fr = toFraction(v), surd = toSurd(v);
      var forms = [dec]; if (fr && fr.d !== 1) { forms.push(fracText(fr)); if (Math.abs(fr.n) > fr.d) forms.push(fracText(fr, true)); } if (surd) forms.push(surd);
      state.forms = forms; state.form = (fr && fr.d !== 1 && fr.d <= 1000) || surd ? 1 : 0;
      if (surd && !(fr && fr.d !== 1)) state.form = forms.indexOf(surd);
      renderForm();
    }
    function renderForm() {
      var f = state.forms[state.form % state.forms.length]; out.textContent = f;
      alt.textContent = state.forms.length > 1 ? "S⇔D shows: " + state.forms.filter(function (x) { return x !== f; }).join("  ·  ") : "";
      out.setAttribute("data-value", state.lastVal);
    }
    function equals() {
      err.textContent = ""; out.classList.remove("preview");
      try {
        var v = evaluate(input.value, { mode: state.mode, ans: state.ans });
        state.ans = v; state.lastVal = v; showResult(v);
        state.history.unshift({ e: input.value, r: fmt(v) }); state.history = state.history.slice(0, 12); save(); renderHist();
      } catch (e) { err.textContent = e.message; }
    }
    function live() { // preview while typing
      err.textContent = "";
      if (!input.value.trim()) { out.textContent = "0"; alt.textContent = ""; return; }
      try { var v = evaluate(input.value, { mode: state.mode, ans: state.ans }); out.textContent = fmt(v); out.classList.add("preview"); alt.textContent = ""; }
      catch (e) { out.classList.add("preview"); }
    }
    function renderHist() {
      hist.innerHTML = state.history.length ? state.history.map(function (h, i) { return '<li><button type="button" data-h="' + i + '"><span>' + esc(h.e) + '</span><strong>= ' + esc(h.r) + "</strong></button></li>"; }).join("") : '<li class="muted">Your calculations appear here.</li>';
    }
    function setMode(m) { state.mode = m; root.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mode") === m ? "true" : "false"); }); $("sci-mode").textContent = m.toUpperCase(); save(); if (input.value) live(); }
    function setShift(on) { state.shift = on; root.classList.toggle("shifted", on); $("k-shift").setAttribute("aria-pressed", on ? "true" : "false"); }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.hasAttribute("data-h")) { var h = state.history[+b.getAttribute("data-h")]; input.value = h.e; state.lastVal = null; live(); input.focus(); return; }
      if (b.hasAttribute("data-mode")) { setMode(b.getAttribute("data-mode")); return; }
      var k = b.getAttribute("data-k"), sk = b.getAttribute("data-sk"); if (!k) return;
      if (state.shift && sk) { k = sk; setShift(false); }
      out.classList.remove("preview");
      switch (k) {
        case "shift": setShift(!state.shift); return;
        case "=": equals(); return;
        case "AC": input.value = ""; state.lastVal = null; out.textContent = "0"; alt.textContent = ""; err.textContent = ""; input.focus(); return;
        case "DEL": var s = input.selectionStart, en = input.selectionEnd; if (s !== en) { input.value = input.value.slice(0, s) + input.value.slice(en); input.setSelectionRange(s, s); } else if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); input.setSelectionRange(s - 1, s - 1); } state.lastVal = null; live(); input.focus(); return;
        case "SD": if (state.forms && state.lastVal !== null) { state.form = (state.form + 1) % state.forms.length; renderForm(); } return;
        case "M+": case "M-": try { var v = state.lastVal !== null ? state.lastVal : evaluate(input.value, { mode: state.mode, ans: state.ans }); state.mem += k === "M+" ? v : -v; save(); $("sci-mem").hidden = state.mem === 0; err.textContent = "Memory: " + fmt(state.mem); } catch (e2) { err.textContent = e2.message; } return;
        case "MR": insert("(" + fmt(state.mem).replace("×10^", "E") + ")"); return;
        case "MC": state.mem = 0; save(); $("sci-mem").hidden = true; err.textContent = "Memory cleared"; return;
        case "copy": try { navigator.clipboard.writeText(out.textContent); err.textContent = "Copied " + out.textContent; } catch (e3) { /* ignore */ } return;
        default: insert(k);
      }
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
      else if (e.key === "Escape") { input.value = ""; live(); }
      else if (state.lastVal !== null && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); insert(e.key === "*" ? "×" : e.key === "/" ? "÷" : e.key);
      }
    });
    input.addEventListener("input", function () { state.lastVal = null; out.classList.remove("preview"); live(); });
    $("sci-clear-hist").addEventListener("click", function () { state.history = []; save(); renderHist(); });
    $("sci-mem").hidden = state.mem === 0;
    setMode(state.mode); renderHist();

    // Table of values
    var tf = $("tbl-form");
    if (tf) {
      tf.addEventListener("submit", function (e) {
        e.preventDefault(); var t = tf.elements, f = t.fx.value, a = +t.start.value, b = +t.end.value, st = +t.step.value, box = $("tbl-out"), msg = $("tbl-msg"); msg.textContent = "";
        if (!f.trim()) { msg.textContent = "Type a function of x, e.g. x²−3x+2"; return; }
        if (!(st > 0)) { msg.textContent = "The step must be more than 0."; return; }
        if (b < a) { msg.textContent = "End must be greater than start."; return; }
        var n = Math.floor((b - a) / st + 1e-9) + 1; if (n > 45) { msg.textContent = "That's " + n + " rows; the table shows up to 45. Increase the step."; return; }
        var rows = [];
        for (var i = 0; i < n; i++) { var x = parseFloat((a + i * st).toPrecision(12)), y; try { y = fmt(evaluate(f, { mode: state.mode, x: x, ans: state.ans })); } catch (er) { y = "ERROR"; } rows.push("<tr><td>" + fmt(x) + "</td><td>" + esc(y) + "</td></tr>"); }
        box.innerHTML = '<table class="xl-table tbl"><thead><tr><th>x</th><th>f(x)</th></tr></thead><tbody>' + rows.join("") + "</tbody></table>";
      });
    }
  }

  /* ================= Number base converter ================= */
  var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
  function parseBase(str, base) {
    var s = String(str).trim().toLowerCase().replace(/[\s_]/g, ""), neg = false;
    if (s[0] === "-") { neg = true; s = s.slice(1); }
    s = s.replace(/^(0x|0b|0o)/, "");
    if (!s) return null;
    var B = BigInt(base), v = 0n;
    for (var i = 0; i < s.length; i++) { var d = DIGITS.indexOf(s[i]); if (d < 0 || d >= base) throw new Error("'" + s[i] + "' isn't a valid base-" + base + " digit"); v = v * B + BigInt(d); }
    return neg ? -v : v;
  }
  function toBase(v, base) { var neg = v < 0n; if (neg) v = -v; var s = v.toString(base); return (neg ? "-" : "") + (base === 16 ? s.toUpperCase() : s); }
  function group(s, n) { var neg = s[0] === "-"; if (neg) s = s.slice(1); var out = s.replace(new RegExp("\\B(?=(.{" + n + "})+(?!.))", "g"), " "); return (neg ? "-" : "") + out; }
  function initBase(form) {
    var fields = { dec: 10, hex: 16, oct: 8, bin: 2 }, msg = $("base-msg"), extra = $("base-extra"), busy = false;
    function update(from) {
      if (busy) return; busy = true; msg.textContent = "";
      try {
        var v = parseBase(form.elements[from].value, fields[from]);
        Object.keys(fields).forEach(function (k) { if (k !== from) form.elements[k].value = v === null ? "" : toBase(v, fields[k]); });
        if (v === null) { extra.innerHTML = ""; }
        else {
          var bits = +form.elements.bits.value, tw = "", info = [];
          var maxU = (1n << BigInt(bits)) - 1n;
          if (v < 0n) { var t = (maxU + 1n + v); tw = t >= 0n ? group(t.toString(2).padStart(bits, "0"), 4) : "out of range for " + bits + " bits"; }
          info.push(["Binary (grouped)", group(toBase(v < 0n ? -v : v, 2), 4)]);
          if (v < 0n) info.push(["Two's complement (" + bits + "-bit)", tw]);
          info.push(["Hex (grouped)", group(toBase(v < 0n ? -v : v, 16), 2)]);
          info.push(["Bits needed", String((v < 0n ? -v : v).toString(2).length)]);
          if (v >= 0n && v < 0x110000n && v > 31n) { try { info.push(["Character", String.fromCodePoint(Number(v))]); } catch (e) { /* not a character */ } }
          var other = +form.elements.custom.value; if (other >= 2 && other <= 36) info.push(["Base " + other, toBase(v, other)]);
          extra.innerHTML = info.map(function (r) { return '<div class="calc-row"><span>' + esc(r[0]) + "</span><strong>" + esc(r[1]) + "</strong></div>"; }).join("");
          extra.setAttribute("data-dec", v.toString());
        }
      } catch (e) { msg.textContent = e.message; }
      busy = false;
    }
    Object.keys(fields).forEach(function (k) { form.elements[k].addEventListener("input", function () { form.dataset.last = k; update(k); }); });
    ["bits", "custom"].forEach(function (k) { form.elements[k].addEventListener("input", function () { update(form.dataset.last || "dec"); }); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    // Bitwise mini-calculator
    var bw = $("bw-form");
    if (bw) bw.addEventListener("input", function () {
      var e = bw.elements, base = +e.bwbase.value, o = $("bw-out");
      try {
        var a = parseBase(e.a.value, base), b = parseBase(e.b.value, base), op = e.op.value, r;
        if (a === null || (op !== "NOT" && b === null)) { o.textContent = ""; return; }
        var bits = BigInt(+form.elements.bits.value), mask = (1n << bits) - 1n;
        r = op === "AND" ? a & b : op === "OR" ? a | b : op === "XOR" ? a ^ b : op === "NOT" ? (~a) & mask : op === "<<" ? (a << b) & mask : op === ">>" ? a >> b : op === "+" ? a + b : op === "-" ? a - b : a * b;
        o.innerHTML = "= <strong>" + esc(toBase(r, base)) + "</strong> <span class='muted'>(dec " + r.toString() + ", hex " + toBase(r, 16) + ", bin " + group(toBase(r, 2), 4) + ")</span>";
        o.setAttribute("data-dec", r.toString());
      } catch (er) { o.textContent = er.message; }
    });
  }

  /* ================= Fraction calculator (exact, BigInt) ================= */
  function bgcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = b; b = a % b; a = t; } return a; }
  function R(n, d) { n = BigInt(n); d = BigInt(d === undefined ? 1 : d); if (d === 0n) throw new Error("Can't divide by zero"); if (d < 0n) { n = -n; d = -d; } var g = bgcd(n, d) || 1n; return { n: n / g, d: d / g }; }
  var Q = {
    add: function (a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); }, sub: function (a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); },
    mul: function (a, b) { return R(a.n * b.n, a.d * b.d); }, div: function (a, b) { if (b.n === 0n) throw new Error("Can't divide by zero"); return R(a.n * b.d, a.d * b.n); },
    pow: function (a, e) { if (e.d !== 1n) throw new Error("Powers must be whole numbers in the fraction calculator"); var k = e.n, neg = k < 0n; if (neg) k = -k; if (k > 64n) throw new Error("That power is too large"); var r = R(1); for (var i = 0n; i < k; i++) r = Q.mul(r, a); return neg ? Q.div(R(1), r) : r; }
  };
  function decToR(s) { var m = /^(\d*)\.?(\d*)$/.exec(s); var whole = m[1] || "0", frac = m[2] || ""; return R(BigInt(whole + frac), 10n ** BigInt(frac.length)); }
  function fracEval(src) {
    var s = String(src).replace(/×/g, "*").replace(/÷/g, ":").replace(/[−–]/g, "-").trim(), toks = [], i = 0, m;
    // mixed numbers "1 1/2" → (1+1/2)
    s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, "($1+$2/$3)");
    s = s.replace(/\s+/g, "");
    while (i < s.length) {
      var rest = s.slice(i);
      // a typed fraction like 3/4 is one number, so 3/4 ÷ 1/2 means (3/4) ÷ (1/2)
      if ((m = /^(\d+)\/(\d+)(?![\d.])/.exec(rest)) && !(toks.length && toks[toks.length - 1].t === "^")) { toks.push({ t: "num", v: R(BigInt(m[1]), BigInt(m[2])) }); i += m[0].length; continue; }
      if ((m = /^\d+\.?\d*|^\.\d+/.exec(rest))) { toks.push({ t: "num", v: decToR(m[0]) }); i += m[0].length; continue; }
      if (s[i] === ":") { toks.push({ t: "/" }); i++; continue; }
      if ("+-*/^()".indexOf(s[i]) >= 0) { toks.push({ t: s[i] }); i++; continue; }
      throw new Error("I don't understand '" + s[i] + "'");
    }
    if (!toks.length) throw new Error("Type a calculation, e.g. 1/2 + 3/4");
    var p = 0;
    function expr() { var v = term(); while (toks[p] && (toks[p].t === "+" || toks[p].t === "-")) { var o = toks[p++].t; v = o === "+" ? Q.add(v, term()) : Q.sub(v, term()); } return v; }
    function term() { var v = un(); while (toks[p] && (toks[p].t === "*" || toks[p].t === "/" || toks[p].t === "(" || toks[p].t === "num")) { var t = toks[p]; if (t.t === "*" || t.t === "/") { p++; v = t.t === "*" ? Q.mul(v, un()) : Q.div(v, un()); } else v = Q.mul(v, un()); } return v; }
    function un() { if (toks[p] && toks[p].t === "-") { p++; var v = un(); return R(-v.n, v.d); } if (toks[p] && toks[p].t === "+") { p++; return un(); } return pw(); }
    function pw() { var b = prim(); if (toks[p] && toks[p].t === "^") { p++; return Q.pow(b, un()); } return b; }
    function prim() { var t = toks[p++]; if (!t) throw new Error("The calculation isn't finished"); if (t.t === "num") return t.v; if (t.t === "(") { var v = expr(); if (toks[p] && toks[p].t === ")") p++; return v; } throw new Error("Something is missing near '" + t.t + "'"); }
    var v = expr(); if (p < toks.length) throw new Error("Check the brackets"); return v;
  }
  function rText(r) { return r.d === 1n ? r.n.toString() : r.n.toString() + "/" + r.d.toString(); }
  function rMixed(r) { var neg = r.n < 0n, n = neg ? -r.n : r.n; if (r.d === 1n || n < r.d) return null; var w = n / r.d, rem = n % r.d; return (neg ? "-" : "") + w.toString() + (rem ? " " + rem.toString() + "/" + r.d.toString() : ""); }
  function rDec(r) { var v = Number(r.n) / Number(r.d); return fmt(v); }
  function initFrac(form) {
    var outBox = $("fr-out"), msg = $("fr-msg");
    function run() {
      msg.textContent = ""; var e = form.elements.fexpr.value;
      if (!e.trim()) { outBox.innerHTML = '<p class="calc-empty">Type a calculation, e.g. 1 1/2 + 3/4</p>'; return; }
      try {
        var r = fracEval(e), mixed = rMixed(r), rows = [["Answer (simplified)", rText(r)]];
        if (mixed) rows.push(["Mixed number", mixed]);
        rows.push(["Decimal", rDec(r)]);
        var pct = Number(r.n) * 100 / Number(r.d); rows.push(["Percentage", fmt(pct) + "%"]);
        outBox.innerHTML = rows.map(function (x, i) { return '<div class="calc-row' + (i ? "" : " big") + '"><span>' + x[0] + "</span><strong>" + esc(x[1]) + "</strong></div>"; }).join("") + steps(e);
        outBox.setAttribute("data-answer", rText(r));
      } catch (er) { msg.textContent = er.message; }
    }
    // Working for a simple "a/b op c/d"
    function steps(e) {
      var m = /^\s*(-?\d+)\s*\/\s*(\d+)\s*([+\-−×÷*/])\s*(-?\d+)\s*\/\s*(\d+)\s*$/.exec(e); if (!m) return "";
      var a = BigInt(m[1]), b = BigInt(m[2]), op = m[3], c = BigInt(m[4]), d = BigInt(m[5]), lines = [];
      if (b === 0n || d === 0n) return "";
      if (op === "+" || op === "-" || op === "−") {
        var l = b * d / bgcd(b, d), A = a * (l / b), C = c * (l / d), N = op === "+" ? A + C : A - C;
        lines.push("Common denominator: " + l); lines.push(a + "/" + b + " = " + A + "/" + l + ",  " + c + "/" + d + " = " + C + "/" + l);
        lines.push((op === "+" ? "Add" : "Subtract") + " the tops: " + A + (op === "+" ? " + " : " − ") + C + " = " + N); lines.push("= " + N + "/" + l + " → simplify → " + rText(R(N, l)));
      } else if (op === "×" || op === "*") { lines.push("Multiply tops and bottoms: (" + a + "×" + c + ")/(" + b + "×" + d + ") = " + (a * c) + "/" + (b * d)); lines.push("Simplify → " + rText(R(a * c, b * d))); }
      else { if (c === 0n) return ""; lines.push("Flip the second fraction and multiply: " + a + "/" + b + " × " + d + "/" + c); lines.push("= " + (a * d) + "/" + (b * c) + " → simplify → " + rText(R(a * d, b * c))); }
      return '<div class="steps"><h3>Working</h3><ol>' + lines.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    }
    form.addEventListener("input", run); form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    form.querySelectorAll("[data-ins]").forEach(function (b) { b.addEventListener("click", function () { var f = form.elements.fexpr; f.value += b.getAttribute("data-ins"); f.focus(); run(); }); });
    run();
  }

  /* ================= Statistics ================= */
  function quantiles(sorted) {
    var n = sorted.length; function med(a) { var m = a.length; return m % 2 ? a[(m - 1) / 2] : (a[m / 2 - 1] + a[m / 2]) / 2; }
    var lower = sorted.slice(0, Math.floor(n / 2)), upper = sorted.slice(Math.ceil(n / 2));
    return { median: med(sorted), q1: lower.length ? med(lower) : sorted[0], q3: upper.length ? med(upper) : sorted[0] };
  }
  function stats(nums) {
    var n = nums.length; if (!n) return null;
    var sorted = nums.slice().sort(function (a, b) { return a - b; }), sum = nums.reduce(function (a, b) { return a + b; }, 0), mean = sum / n;
    var ss = nums.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0), sumsq = nums.reduce(function (a, b) { return a + b * b; }, 0);
    var counts = {}, best = 0; nums.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; best = Math.max(best, counts[v]); });
    var modes = best > 1 ? Object.keys(counts).filter(function (k) { return counts[k] === best; }).map(Number).sort(function (a, b) { return a - b; }) : [];
    var q = quantiles(sorted);
    return { n: n, sum: sum, sumsq: sumsq, mean: mean, median: q.median, q1: q.q1, q3: q.q3, iqr: q.q3 - q.q1, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
      modes: modes, modeCount: best, popVar: ss / n, popSd: Math.sqrt(ss / n), sampVar: n > 1 ? ss / (n - 1) : NaN, sampSd: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, sorted: sorted };
  }
  function parseData(text, withFreq) {
    var out = [], bad = [];
    String(text).split(/[\n;]+/).forEach(function (line) {
      if (withFreq) {
        var m = /^\s*(-?[\d.]+)\s*[:,\t ]\s*(\d+)\s*$/.exec(line); if (!line.trim()) return;
        if (!m) { bad.push(line.trim()); return; } for (var i = 0; i < +m[2] && i < 100000; i++) out.push(parseFloat(m[1]));
      } else line.split(/[\s,]+/).forEach(function (tok) { if (!tok) return; var v = parseFloat(tok.replace(/[£$€%]/g, "")); if (isNaN(v)) bad.push(tok); else out.push(v); });
    });
    return { nums: out, bad: bad };
  }
  function initStats(form) {
    var outBox = $("st-out"), msg = $("st-msg");
    function run() {
      msg.textContent = "";
      var withFreq = form.elements.freq.checked, d = parseData(form.elements.data.value, withFreq), s = stats(d.nums);
      if (d.bad.length) msg.textContent = "Ignored: " + d.bad.slice(0, 5).join(", ") + (d.bad.length > 5 ? "…" : "");
      if (!s) { outBox.innerHTML = '<p class="calc-empty">Type or paste your numbers.</p>'; return; }
      var rows = [["Mean (average)", fmt(s.mean), 1], ["Median", fmt(s.median)], ["Mode", s.modes.length ? s.modes.map(fmt).join(", ") + " (" + s.modeCount + " times)" : "No mode (no value repeats)"],
        ["Range", fmt(s.range)], ["Count (n)", String(s.n)], ["Sum (Σx)", fmt(s.sum)], ["Sum of squares (Σx²)", fmt(s.sumsq)], ["Minimum", fmt(s.min)], ["Maximum", fmt(s.max)],
        ["Lower quartile (Q1)", fmt(s.q1)], ["Upper quartile (Q3)", fmt(s.q3)], ["Interquartile range", fmt(s.iqr)],
        ["Standard deviation (population, σ)", fmt(s.popSd)], ["Standard deviation (sample, s)", isNaN(s.sampSd) ? "needs 2+ values" : fmt(s.sampSd)],
        ["Variance (population, σ²)", fmt(s.popVar)], ["Variance (sample, s²)", isNaN(s.sampVar) ? "needs 2+ values" : fmt(s.sampVar)]];
      outBox.innerHTML = rows.map(function (r) { return '<div class="calc-row' + (r[2] ? " big" : "") + '"><span>' + r[0] + "</span><strong>" + esc(r[1]) + "</strong></div>"; }).join("") +
        '<p class="hint" style="margin-top:8px">In order: ' + esc(s.sorted.slice(0, 60).map(fmt).join(", ") + (s.n > 60 ? " …" : "")) + "</p>";
      outBox.setAttribute("data-mean", s.mean);
    }
    form.addEventListener("input", run); form.addEventListener("submit", function (e) { e.preventDefault(); }); run();
  }

  window.ETBMaths = { evaluate: evaluate, fmt: fmt, toFraction: toFraction, toSurd: toSurd, parseBase: parseBase, toBase: toBase, fracEval: fracEval, rText: rText, stats: stats, parseData: parseData };
  document.addEventListener("DOMContentLoaded", function () {
    var el;
    if ((el = document.querySelector("[data-sci]"))) initSci(el);
    if ((el = document.querySelector("form[data-base]"))) initBase(el);
    if ((el = document.querySelector("form[data-frac]"))) initFrac(el);
    if ((el = document.querySelector("form[data-stats]"))) initStats(el);
  });
})();
