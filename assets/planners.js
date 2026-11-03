/* etoolbox planners — budget, subscriptions, travel budget, trip splitter, meeting time finder, recipe scaler, device tester.
   Planner data is saved in this browser only (localStorage). */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[£,\s]/g, "")); return isFinite(n) ? n : 0; }
  function gbp(n, cur) { try { return n.toLocaleString("en-GB", { style: "currency", currency: cur || "GBP" }); } catch (e) { return "£" + n.toFixed(2); } }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dl(text, name, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function csv(rows) { return "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n"); }

  // Generic editable rows. cols: [{key,label,type:'text'|'number'|'select'|'date',options,width}]
  function rowsEditor(host, cols, rows, onChange, addLabel) {
    function render() {
      host.innerHTML = '<div class="tbl-wrap"><table class="ed-table"><thead><tr>' + cols.map(function (c) { return "<th>" + c.label + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" +
        rows.map(function (r, i) { return "<tr>" + cols.map(function (c) {
          var v = r[c.key] == null ? "" : r[c.key], a = ' data-i="' + i + '" data-k="' + c.key + '" aria-label="' + esc(c.label) + '"';
          if (c.type === "select") return "<td><select" + a + ">" + c.options.map(function (o) { var ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (String(ov) === String(v) ? " selected" : "") + ">" + esc(ol) + "</option>"; }).join("") + "</select></td>";
          return '<td><input type="' + (c.type === "date" ? "date" : "text") + '"' + (c.type === "number" ? ' inputmode="decimal"' : "") + ' value="' + esc(v) + '"' + a + (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") + "></td>";
        }).join("") + '<td><button type="button" class="row-del" data-del="' + i + '" aria-label="Remove row">×</button></td></tr>'; }).join("") +
        '</tbody></table></div><button type="button" class="btn secondary small ed-add">+ ' + (addLabel || "Add row") + "</button>";
    }
    host.addEventListener("input", function (e) { var el = e.target; if (!el.hasAttribute("data-k")) return; rows[+el.getAttribute("data-i")][el.getAttribute("data-k")] = el.value; onChange(); });
    host.addEventListener("change", function (e) { var el = e.target; if (!el.hasAttribute("data-k")) return; rows[+el.getAttribute("data-i")][el.getAttribute("data-k")] = el.value; onChange(); });
    host.addEventListener("click", function (e) {
      var d = e.target.closest("[data-del]"); if (d) { rows.splice(+d.getAttribute("data-del"), 1); render(); onChange(); return; }
      if (e.target.closest(".ed-add")) { var r = {}; cols.forEach(function (c) { r[c.key] = c.def != null ? c.def : (c.type === "select" ? (Array.isArray(c.options[0]) ? c.options[0][0] : c.options[0]) : ""); }); rows.push(r); render(); onChange(); var ins = host.querySelectorAll("tbody tr:last-child input"); if (ins[0]) ins[0].focus(); }
    });
    render();
    return { render: render, rows: function () { return rows; }, set: function (r) { rows = r; render(); } };
  }
  function bars(items, total) { return items.map(function (it) { var p = total ? Math.min(100, it[1] / total * 100) : 0; return '<div class="bar-row"><span>' + esc(it[0]) + '</span><div class="bar"><i style="width:' + p.toFixed(1) + "%" + (it[2] ? ";background:" + it[2] : "") + '"></i></div><strong>' + gbp(it[1]) + "</strong></div>"; }).join(""); }

  /* ---------- Monthly budget planner ---------- */
  var CATS = [["needs", "Needs (essentials)"], ["wants", "Wants (lifestyle)"], ["savings", "Savings & debt"]];
  var DEF_BUDGET = { income: [{ name: "Take-home pay", amount: "" }], expenses: [
    { name: "Rent / mortgage", amount: "", cat: "needs" }, { name: "Council tax", amount: "", cat: "needs" }, { name: "Gas & electricity", amount: "", cat: "needs" }, { name: "Water", amount: "", cat: "needs" },
    { name: "Food shopping", amount: "", cat: "needs" }, { name: "Transport / fuel", amount: "", cat: "needs" }, { name: "Phone & broadband", amount: "", cat: "needs" }, { name: "Insurance", amount: "", cat: "needs" },
    { name: "Eating out & takeaways", amount: "", cat: "wants" }, { name: "Subscriptions", amount: "", cat: "wants" }, { name: "Clothes & shopping", amount: "", cat: "wants" }, { name: "Savings", amount: "", cat: "savings" }, { name: "Debt repayments", amount: "", cat: "savings" }] };
  function budgetSummary(d) {
    var inc = d.income.reduce(function (s, r) { return s + num(r.amount); }, 0), by = { needs: 0, wants: 0, savings: 0 };
    d.expenses.forEach(function (r) { by[r.cat] = (by[r.cat] || 0) + num(r.amount); });
    var out = by.needs + by.wants + by.savings;
    return { income: inc, spent: out, left: inc - out, by: by };
  }
  function initBudget(root) {
    var KEY = "etb-budget-v1", d = load(KEY, JSON.parse(JSON.stringify(DEF_BUDGET))), sum = document.getElementById("bp-sum");
    function upd() {
      save(KEY, d); var s = budgetSummary(d);
      var rule = [["needs", 50, "#2a9d8f"], ["wants", 30, "#f4a261"], ["savings", 20, "#6366f1"]];
      sum.innerHTML = '<div class="calc-out"><div class="calc-row"><span>Income</span><strong>' + gbp(s.income) + '</strong></div><div class="calc-row"><span>Spending & saving</span><strong>' + gbp(s.spent) + '</strong></div><div class="calc-row big"><span>' + (s.left >= 0 ? "Left over" : "Over budget") + "</span><strong" + (s.left < 0 ? ' class="warn"' : "") + ">" + gbp(s.left) + "</strong></div></div>" +
        "<h3>50/30/20 check</h3>" + rule.map(function (r) { var v = s.by[r[0]], p = s.income ? v / s.income * 100 : 0; return '<div class="bar-row"><span>' + CATS.filter(function (c) { return c[0] === r[0]; })[0][1] + '</span><div class="bar"><i style="width:' + Math.min(100, p).toFixed(1) + "%;background:" + r[2] + '"></i><b class="target" style="left:' + r[1] + '%"></b></div><strong>' + Math.round(p) + "% <span class=\"muted\">/ " + r[1] + "%</span></strong></div>"; }).join("") +
        '<p class="hint">The 50/30/20 rule is a guide: about 50% on needs, 30% on wants and 20% on savings and paying off debt.</p>';
      sum.setAttribute("data-result", JSON.stringify(s));
    }
    rowsEditor(document.getElementById("bp-income"), [{ key: "name", label: "Income", placeholder: "e.g. Salary" }, { key: "amount", label: "£ per month", type: "number" }], d.income, upd, "Add income");
    var ex = rowsEditor(document.getElementById("bp-exp"), [{ key: "name", label: "Expense" }, { key: "amount", label: "£ per month", type: "number" }, { key: "cat", label: "Type", type: "select", options: CATS, def: "needs" }], d.expenses, upd, "Add expense");
    document.getElementById("bp-csv").addEventListener("click", function () { dl(csv([["Type", "Name", "Category", "Monthly £"]].concat(d.income.map(function (r) { return ["Income", r.name, "", num(r.amount)]; }), d.expenses.map(function (r) { return ["Expense", r.name, r.cat, num(r.amount)]; }))), "budget.csv", "text/csv"); });
    document.getElementById("bp-reset").addEventListener("click", function () { if (!confirmReset()) return; d = JSON.parse(JSON.stringify(DEF_BUDGET)); save(KEY, d); location.reload(); });
    upd();
  }
  function confirmReset() { var b = document.activeElement; if (b && b.getAttribute("data-armed") !== "1") { b.setAttribute("data-armed", "1"); var t = b.textContent; b.textContent = "Click again to clear"; setTimeout(function () { b.removeAttribute("data-armed"); b.textContent = t; }, 3000); return false; } return true; }

  /* ---------- Subscription tracker ---------- */
  var PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  function nextDate(iso, cycle, today) {
    if (!iso) return null; var d = new Date(iso + "T12:00:00"); if (isNaN(d)) return null; var guard = 0;
    while (d < today && guard++ < 1000) { if (cycle === "weekly") d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + (cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12)); }
    return d;
  }
  function subSummary(rows, today) {
    var m = rows.reduce(function (s, r) { return s + num(r.cost) * (PER_MONTH[r.cycle] || 1); }, 0);
    var up = rows.map(function (r) { return { r: r, d: nextDate(r.next, r.cycle, today) }; }).filter(function (x) { return x.d; }).sort(function (a, b) { return a.d - b.d; });
    return { monthly: m, yearly: m * 12, upcoming: up };
  }
  function icsFor(rows) {
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var ev = rows.filter(function (r) { return r.next && r.name; }).map(function (r, i) {
      var d = r.next.replace(/-/g, ""), freq = { weekly: "WEEKLY", monthly: "MONTHLY", quarterly: "MONTHLY;INTERVAL=3", yearly: "YEARLY" }[r.cycle] || "MONTHLY";
      return ["BEGIN:VEVENT", "UID:etb-sub-" + i + "-" + d + "@etoolbox.co.uk", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + d, "RRULE:FREQ=" + freq, "SUMMARY:" + (r.name + " renews (" + gbp(num(r.cost)) + ")").replace(/[,;]/g, " "),
        "BEGIN:VALARM", "TRIGGER:-P2D", "ACTION:DISPLAY", "DESCRIPTION:Subscription renews in 2 days", "END:VALARM", "END:VEVENT"].join("\r\n");
    });
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//etoolbox//Subscription tracker//EN"].concat(ev, ["END:VCALENDAR"]).join("\r\n");
  }
  function initSubs(root) {
    var KEY = "etb-subs-v1", rows = load(KEY, [{ name: "", cost: "", cycle: "monthly", next: "", cat: "Entertainment" }]), sum = document.getElementById("st-sum");
    function upd() {
      save(KEY, rows); var today = new Date(); today.setHours(0, 0, 0, 0); var s = subSummary(rows, today);
      var soon = s.upcoming.filter(function (x) { return (x.d - today) / 864e5 <= 30; });
      var byCat = {}; rows.forEach(function (r) { byCat[r.cat || "Other"] = (byCat[r.cat || "Other"] || 0) + num(r.cost) * (PER_MONTH[r.cycle] || 1); });
      sum.innerHTML = '<div class="calc-out"><div class="calc-row big"><span>Per month</span><strong>' + gbp(s.monthly) + '</strong></div><div class="calc-row"><span>Per year</span><strong>' + gbp(s.yearly) + "</strong></div></div>" +
        "<h3>Renewing in the next 30 days</h3>" + (soon.length ? '<ul class="soon">' + soon.map(function (x) { var days = Math.round((x.d - today) / 864e5); return "<li><strong>" + esc(x.r.name || "Unnamed") + "</strong> " + gbp(num(x.r.cost)) + ' <span class="muted">· ' + (days === 0 ? "today" : days === 1 ? "tomorrow" : "in " + days + " days") + " (" + x.d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ")</span></li>"; }).join("") + "</ul>" : '<p class="muted">Nothing due in the next 30 days (add next payment dates to see renewals).</p>') +
        "<h3>By category (monthly)</h3>" + bars(Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (k) { return [k, byCat[k]]; }), s.monthly);
      sum.setAttribute("data-result", JSON.stringify({ monthly: Math.round(s.monthly * 100) / 100, yearly: Math.round(s.yearly * 100) / 100, soon: soon.length }));
    }
    rowsEditor(document.getElementById("st-rows"), [{ key: "name", label: "Service", placeholder: "e.g. Netflix" }, { key: "cost", label: "Cost £", type: "number" }, { key: "cycle", label: "Billed", type: "select", options: [["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]], def: "monthly" }, { key: "next", label: "Next payment", type: "date" }, { key: "cat", label: "Category", type: "select", options: ["Entertainment", "Software", "Phone & internet", "Health & fitness", "News & magazines", "Shopping", "Business", "Other"], def: "Entertainment" }], rows, upd, "Add subscription");
    document.getElementById("st-ics").addEventListener("click", function () { dl(icsFor(rows), "subscription-reminders.ics", "text/calendar"); });
    document.getElementById("st-csv").addEventListener("click", function () { dl(csv([["Service", "Cost", "Billed", "Next payment", "Category", "Monthly equivalent"]].concat(rows.map(function (r) { return [r.name, num(r.cost), r.cycle, r.next, r.cat, (num(r.cost) * (PER_MONTH[r.cycle] || 1)).toFixed(2)]; }))), "subscriptions.csv", "text/csv"); });
    upd();
  }

  /* ---------- Travel budget planner ---------- */
  function initTravel(form) {
    var KEY = "etb-travel-v1", out = document.getElementById("tb-out"), rates = null;
    var saved = load(KEY, null); if (saved) Object.keys(saved).forEach(function (k) { if (form.elements[k]) form.elements[k].value = saved[k]; });
    function v(k) { return form.elements[k].value; }
    function upd() {
      var o = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) o[el.name] = el.value; }); save(KEY, o);
      var people = Math.max(1, Math.round(num(v("people")))), nights = Math.max(0, Math.round(num(v("nights")))), days = nights + 1;
      var items = [["Flights / travel", num(v("flights")) * people], ["Accommodation", num(v("hotel")) * nights], ["Food & drink", num(v("food")) * people * days], ["Local transport", num(v("local")) * days], ["Activities", num(v("activities"))], ["Insurance", num(v("insurance")) * people], ["Other", num(v("other"))]];
      var buffer = num(v("buffer")) / 100, sub = items.reduce(function (s, i) { return s + i[1]; }, 0), total = sub * (1 + buffer), cur = v("cur");
      var conv = rates && cur !== "GBP" && rates[cur] ? rates[cur] / rates.GBP : null;
      out.innerHTML = '<div class="calc-out"><div class="calc-row big"><span>Total trip cost</span><strong>' + gbp(total) + '</strong></div><div class="calc-row"><span>Per person</span><strong>' + gbp(total / people) + '</strong></div><div class="calc-row"><span>Per day</span><strong>' + gbp(total / days) + "</strong></div>" +
        (conv ? '<div class="calc-row"><span>In ' + cur + "</span><strong>" + gbp(total * conv, cur) + " <span class=\"muted\">(" + gbp(total / people * conv, cur) + " each)</span></strong></div>" : "") + "</div>" +
        "<h3>Breakdown</h3>" + bars(items.filter(function (i) { return i[1]; }).concat(buffer ? [["Buffer (" + Math.round(buffer * 100) + "%)", sub * buffer]] : []), total) +
        (conv ? '<p class="hint">Spending money to take: about <strong>' + gbp((num(v("food")) * people * days + num(v("local")) * days + num(v("activities"))) * conv, cur) + "</strong> in " + cur + " (ECB reference rate; your bank's rate will be a little worse).</p>" : "");
      out.setAttribute("data-result", JSON.stringify({ total: Math.round(total * 100) / 100, perPerson: Math.round(total / people * 100) / 100 }));
    }
    fetch("https://api.frankfurter.dev/v1/latest?base=EUR").then(function (r) { return r.json(); }).then(function (j) { j.rates.EUR = 1; rates = j.rates; upd(); }).catch(function () {});
    form.addEventListener("input", upd); form.addEventListener("change", upd); form.addEventListener("submit", function (e) { e.preventDefault(); });
    upd();
  }

  /* ---------- Trip cost splitter ---------- */
  function settle(people, expenses) {
    var bal = {}; people.forEach(function (p) { bal[p] = 0; });
    expenses.forEach(function (e) {
      var amt = num(e.amount), among = (e.among && e.among.length ? e.among : people).filter(function (p) { return p in bal; });
      if (!amt || !(e.paidBy in bal) || !among.length) return;
      bal[e.paidBy] += amt; among.forEach(function (p) { bal[p] -= amt / among.length; });
    });
    var cred = [], debt = [];
    Object.keys(bal).forEach(function (p) { var v = Math.round(bal[p] * 100) / 100; if (v > 0.005) cred.push([p, v]); else if (v < -0.005) debt.push([p, -v]); });
    cred.sort(function (a, b) { return b[1] - a[1]; }); debt.sort(function (a, b) { return b[1] - a[1]; });
    var tx = [], i = 0, j = 0;
    while (i < debt.length && j < cred.length) { var x = Math.min(debt[i][1], cred[j][1]); tx.push({ from: debt[i][0], to: cred[j][0], amount: Math.round(x * 100) / 100 }); debt[i][1] -= x; cred[j][1] -= x; if (debt[i][1] < 0.005) i++; if (cred[j][1] < 0.005) j++; }
    return { balances: bal, transfers: tx };
  }
  function initSplit(root) {
    var KEY = "etb-split-v1", d = load(KEY, { people: ["Me", "Friend"], expenses: [] }), pplHost = document.getElementById("sp-people"), exHost = document.getElementById("sp-exp"), out = document.getElementById("sp-out");
    function render() {
      save(KEY, d);
      pplHost.innerHTML = d.people.map(function (p, i) { return '<span class="chip"><input value="' + esc(p) + '" data-p="' + i + '" aria-label="Name"><button type="button" data-rmp="' + i + '" aria-label="Remove">×</button></span>'; }).join("") + '<button type="button" class="btn secondary small" id="sp-addp">+ Person</button>';
      exHost.innerHTML = d.expenses.length ? d.expenses.map(function (e, i) {
        return '<div class="sp-row"><input value="' + esc(e.desc) + '" data-e="' + i + '" data-k="desc" placeholder="What for?" aria-label="Description"><input value="' + esc(e.amount) + '" data-e="' + i + '" data-k="amount" inputmode="decimal" placeholder="£" aria-label="Amount">' +
          '<select data-e="' + i + '" data-k="paidBy" aria-label="Paid by">' + d.people.map(function (p) { return "<option" + (p === e.paidBy ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("") + '</select><button type="button" class="row-del" data-rme="' + i + '" aria-label="Remove">×</button>' +
          '<div class="sp-among">Split between: ' + d.people.map(function (p) { var on = !e.among || !e.among.length || e.among.indexOf(p) >= 0; return '<label class="check"><input type="checkbox" data-am="' + i + '" value="' + esc(p) + '"' + (on ? " checked" : "") + "> " + esc(p) + "</label>"; }).join("") + "</div></div>";
      }).join("") : '<p class="muted">No expenses yet.</p>';
      calc();
    }
    function calc() {
      save(KEY, d); var r = settle(d.people, d.expenses), total = d.expenses.reduce(function (s, e) { return s + num(e.amount); }, 0);
      out.innerHTML = '<div class="calc-out"><div class="calc-row"><span>Total spent</span><strong>' + gbp(total) + '</strong></div><div class="calc-row"><span>Fair share (equal split)</span><strong>' + gbp(d.people.length ? total / d.people.length : 0) + "</strong></div></div>" +
        "<h3>Who pays whom</h3>" + (r.transfers.length ? '<ul class="settle">' + r.transfers.map(function (t) { return "<li><strong>" + esc(t.from) + "</strong> pays <strong>" + esc(t.to) + "</strong> <span class=\"amt\">" + gbp(t.amount) + "</span></li>"; }).join("") + "</ul>" : '<p class="good">Everyone is square. ✓</p>') +
        '<button type="button" class="btn secondary small" id="sp-copy">Copy summary</button>';
      out.setAttribute("data-result", JSON.stringify(r.transfers));
    }
    root.addEventListener("input", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-p")) { var i = +t.getAttribute("data-p"), old = d.people[i], nv = t.value.trim() || old; d.people[i] = nv; d.expenses.forEach(function (x) { if (x.paidBy === old) x.paidBy = nv; if (x.among) x.among = x.among.map(function (a) { return a === old ? nv : a; }); }); calc(); }
      else if (t.hasAttribute("data-k")) { d.expenses[+t.getAttribute("data-e")][t.getAttribute("data-k")] = t.value; calc(); }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-am")) { var ex = d.expenses[+t.getAttribute("data-am")]; ex.among = Array.prototype.filter.call(root.querySelectorAll('[data-am="' + t.getAttribute("data-am") + '"]'), function (c) { return c.checked; }).map(function (c) { return c.value; }); calc(); }
      else if (t.hasAttribute("data-p")) render();
      else if (t.tagName === "SELECT" && t.hasAttribute("data-k")) { d.expenses[+t.getAttribute("data-e")].paidBy = t.value; calc(); }
    });
    root.addEventListener("click", function (e) {
      var t = e.target;
      if (t.id === "sp-addp") { var n = "Person " + (d.people.length + 1); d.people.push(n); render(); }
      else if (t.hasAttribute("data-rmp")) { if (d.people.length > 2) { var gone = d.people.splice(+t.getAttribute("data-rmp"), 1)[0]; d.expenses.forEach(function (x) { if (x.paidBy === gone) x.paidBy = d.people[0]; if (x.among) x.among = x.among.filter(function (a) { return a !== gone; }); }); render(); } }
      else if (t.id === "sp-adde") { d.expenses.push({ desc: "", amount: "", paidBy: d.people[0], among: [] }); render(); var ins = exHost.querySelectorAll(".sp-row:last-child input"); if (ins[0]) ins[0].focus(); }
      else if (t.hasAttribute("data-rme")) { d.expenses.splice(+t.getAttribute("data-rme"), 1); render(); }
      else if (t.id === "sp-copy") { var r = settle(d.people, d.expenses); navigator.clipboard.writeText("Trip costs settled up:\n" + (r.transfers.map(function (x) { return x.from + " pays " + x.to + " " + gbp(x.amount); }).join("\n") || "Everyone is square") + "\n\nMade with etoolbox.co.uk").then(function () { t.textContent = "Copied ✓"; }); }
      else if (t.id === "sp-reset") { if (confirmReset()) { d = { people: ["Me", "Friend"], expenses: [] }; render(); } }
    });
    render();
  }

  /* ---------- Meeting time finder ---------- */
  function hourIn(tz, date) { var p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(date), o = {}; p.forEach(function (x) { o[x.type] = x.value; }); return { h: +o.hour, m: +o.minute, wd: o.weekday }; }
  var POPULAR_TZ = ["Europe/London", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/Paris", "Europe/Berlin", "Europe/Warsaw", "Europe/Istanbul", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland", "Africa/Lagos", "Africa/Johannesburg", "America/Toronto", "America/Sao_Paulo"];
  function tzOffset(tz, date) { var p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(date), o = {}; p.forEach(function (x) { o[x.type] = +x.value; }); return (Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute, o.second) - Math.floor(date.getTime() / 1000) * 1000) / 60000; }
  function tzLabel(tz) { return tz.split("/").pop().replace(/_/g, " "); }
  function initMeet(form) {
    var KEY = "etb-meet-v1", grid = document.getElementById("mt-grid"), best = document.getElementById("mt-best");
    var all = (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : POPULAR_TZ).slice(); if (all.indexOf("Europe/London") < 0) all.unshift("Europe/London");
    var zones = load(KEY, ["Europe/London", "America/New_York", "Asia/Dubai"]);
    form.elements.addtz.innerHTML = '<option value="">+ Add a city / time zone…</option><optgroup label="Popular">' + POPULAR_TZ.map(function (z) { return '<option value="' + z + '">' + tzLabel(z) + " (" + z.split("/")[0] + ")</option>"; }).join("") + '</optgroup><optgroup label="All">' + all.map(function (z) { return '<option value="' + z + '">' + z.replace(/_/g, " ") + "</option>"; }).join("") + "</optgroup>";
    if (!form.elements.date.value) form.elements.date.value = new Date().toISOString().slice(0, 10);
    function upd() {
      save(KEY, zones);
      var ws = +form.elements.ws.value, we = +form.elements.we.value, day = form.elements.date.value, base = zones[0];
      // Start at local midnight of the first zone on the chosen date
      var guess = new Date(day + "T00:00:00Z"), start = new Date(guess.getTime() - tzOffset(base, guess) * 60000);
      start = new Date(guess.getTime() - tzOffset(base, start) * 60000); // second pass handles DST changes
      var slots = [];
      for (var i = 0; i < 24; i++) slots.push(new Date(start.getTime() + i * 3600000));
      var good = slots.map(function (t) { return zones.every(function (z) { var x = hourIn(z, t); return x.h >= ws && x.h < we && x.wd !== "Sat" && x.wd !== "Sun"; }); });
      var ok2 = slots.map(function (t) { return zones.every(function (z) { var h = hourIn(z, t).h; return h >= 7 && h < 22; }); });
      grid.innerHTML = '<div class="tbl-wrap"><table class="tz-table"><tbody>' + zones.map(function (z, zi) {
        return '<tr><th><span class="tz-name">' + esc(tzLabel(z)) + '</span><span class="muted">' + esc(new Intl.DateTimeFormat("en-GB", { timeZone: z, timeZoneName: "short" }).formatToParts(slots[0]).filter(function (p) { return p.type === "timeZoneName"; })[0].value) + "</span>" + (zi ? '<button type="button" class="row-del" data-rmz="' + zi + '" aria-label="Remove">×</button>' : ' <span class="badge">base</span>') + "</th>" +
          slots.map(function (t, i) { var x = hourIn(z, t), cls = x.h >= ws && x.h < we && x.wd !== "Sat" && x.wd !== "Sun" ? "w" : x.h >= 7 && x.h < 22 ? "e" : "n"; return '<td class="' + cls + (good[i] ? " best" : "") + '" title="' + x.wd + " " + ("0" + x.h).slice(-2) + ":" + ("0" + x.m).slice(-2) + '">' + x.h + (x.m ? '<sup>' + x.m + "</sup>" : "") + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
      var idx = good.map(function (g, i) { return g ? i : -1; }).filter(function (i) { return i >= 0; });
      var alt = ok2.map(function (g, i) { return g ? i : -1; }).filter(function (i) { return i >= 0; });
      var fmtSlot = function (i) { return zones.map(function (z) { var x = hourIn(z, slots[i]); return esc(tzLabel(z)) + " " + ("0" + x.h).slice(-2) + ":" + ("0" + x.m).slice(-2); }).join(" · "); };
      best.innerHTML = idx.length ? "<strong>✓ " + idx.length + " hour" + (idx.length > 1 ? "s" : "") + " work for everyone:</strong><ul>" + idx.map(function (i) { return "<li>" + fmtSlot(i) + "</li>"; }).join("") + "</ul>"
        : alt.length ? "<strong>No time is inside everyone's working hours.</strong> These times avoid the night for everyone:<ul>" + alt.slice(0, 4).map(function (i) { return "<li>" + fmtSlot(i) + "</li>"; }).join("") + "</ul>" : "<strong>No reasonable overlap.</strong> Consider splitting into two meetings.";
      best.setAttribute("data-result", JSON.stringify({ best: idx.length, zones: zones.length }));
    }
    form.elements.addtz.addEventListener("change", function () { var z = form.elements.addtz.value; if (z && zones.indexOf(z) < 0) zones.push(z); form.elements.addtz.value = ""; upd(); });
    grid.addEventListener("click", function (e) { var b = e.target.closest("[data-rmz]"); if (b) { zones.splice(+b.getAttribute("data-rmz"), 1); upd(); } });
    ["date", "ws", "we"].forEach(function (k) { form.elements[k].addEventListener("change", upd); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    upd();
  }

  /* ---------- Recipe scaler ---------- */
  var UF = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅕": 0.2, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
  var QTY = "(\\d+\\s+\\d+\\/\\d+|\\d+\\s*[½⅓⅔¼¾⅕⅛⅜⅝⅞]|\\d+\\/\\d+|\\d*\\.\\d+|\\d+|[½⅓⅔¼¾⅕⅛⅜⅝⅞])";
  function parseQty(s) {
    s = s.trim(); var m;
    if ((m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s))) return +m[1] + m[2] / m[3];
    if ((m = /^(\d+)\s*([½⅓⅔¼¾⅕⅛⅜⅝⅞])$/.exec(s))) return +m[1] + UF[m[2]];
    if ((m = /^(\d+)\/(\d+)$/.exec(s))) return m[1] / m[2];
    if (UF[s]) return UF[s];
    return parseFloat(s);
  }
  function prettyQty(x, unit) {
    if (/^(g|ml|kg|l|grams?|millilitres?|ml\.)$/i.test(unit || "")) return x >= 100 ? String(Math.round(x / 5) * 5) : x >= 10 ? String(Math.round(x)) : String(Math.round(x * 10) / 10);
    var whole = Math.floor(x + 1e-9), frac = x - whole, best = null;
    [[0, ""], [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]].forEach(function (f) { if (!best || Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f; });
    if (Math.abs(frac - best[0]) > 0.06 && x < 10) return String(Math.round(x * 100) / 100);
    if (best[0] === 1) { whole++; best = [0, ""]; }
    return (whole ? whole + (best[1] ? " " : "") : "") + best[1] || "0";
  }
  var METRIC = [[/^(cups?|c)$/i, "ml", 240], [/^(fl\.?\s?oz|fluid ounces?)$/i, "ml", 28.41], [/^(oz|ounces?)$/i, "g", 28.35], [/^(lbs?|pounds?)$/i, "g", 453.6], [/^(pints?|pt)$/i, "ml", 568]];
  function scaleLine(line, f, metric) {
    var re = new RegExp("^(\\s*[-•*]?\\s*)" + QTY + "(?:\\s*(?:-|–|to)\\s*" + QTY + ")?(\\s*)([a-zA-Z.]+)?");
    var m = re.exec(line); if (!m) return { text: line, changed: false };
    var a = parseQty(m[2]) * f, b = m[3] ? parseQty(m[3]) * f : null, unit = m[5] || "", rest = line.slice(m[0].length);
    if (metric) { for (var i = 0; i < METRIC.length; i++) if (METRIC[i][0].test(unit)) { a *= METRIC[i][2]; if (b) b *= METRIC[i][2]; unit = METRIC[i][1]; break; } }
    return { text: m[1] + prettyQty(a, unit) + (b ? "–" + prettyQty(b, unit) : "") + (m[4] || (unit ? " " : "")) + unit + rest, changed: true };
  }
  function initRecipe(form) {
    var out = document.getElementById("rc-out");
    function upd() {
      var from = num(form.elements.from.value) || 1, to = num(form.elements.to.value) || from, f = to / from, metric = form.elements.metric.checked;
      var lines = form.elements.ingredients.value.split("\n"), res = lines.map(function (l) { return scaleLine(l, f, metric); });
      out.innerHTML = '<p class="muted">Scaled ×' + (Math.round(f * 100) / 100) + " (" + from + " → " + to + " servings)</p><ul class=\"rc-list\">" + res.filter(function (r) { return r.text.trim(); }).map(function (r) { return "<li" + (r.changed ? "" : ' class="muted"') + ">" + esc(r.text.trim()) + "</li>"; }).join("") + "</ul>";
      out.setAttribute("data-lines", JSON.stringify(res.map(function (r) { return r.text; })));
    }
    document.getElementById("rc-copy").addEventListener("click", function (e) { navigator.clipboard.writeText(JSON.parse(out.getAttribute("data-lines") || "[]").join("\n")).then(function () { e.target.textContent = "Copied ✓"; }); });
    form.addEventListener("input", upd); form.addEventListener("submit", function (e) { e.preventDefault(); }); upd();
  }

  /* ---------- Webcam, microphone & speaker tester ---------- */
  function initDevice(root) {
    var video = document.getElementById("cam-video"), camInfo = document.getElementById("cam-info"), camSel = document.getElementById("cam-sel"), micSel = document.getElementById("mic-sel"), meter = document.getElementById("mic-meter"), micInfo = document.getElementById("mic-info");
    var camStream = null, micStream = null, actx = null, raf = 0;
    function err(e, what) { return e && e.name === "NotAllowedError" ? "Permission denied. Allow " + what + " access in your browser's address bar, then try again." : e && e.name === "NotFoundError" ? "No " + what + " was found. Is it plugged in?" : e && e.name === "NotReadableError" ? "The " + what + " is being used by another app (e.g. Zoom or Teams). Close it and try again." : "Couldn't start the " + what + "."; }
    function listDevices() { return navigator.mediaDevices.enumerateDevices().then(function (ds) {
      var fill = function (sel, kind, label) { var v = sel.value, list = ds.filter(function (d) { return d.kind === kind; }); sel.innerHTML = list.map(function (d, i) { return '<option value="' + d.deviceId + '">' + esc(d.label || label + " " + (i + 1)) + "</option>"; }).join(""); if (v) sel.value = v; return list.length; };
      fill(camSel, "videoinput", "Camera"); fill(micSel, "audioinput", "Microphone");
    }); }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camInfo.textContent = micInfo.textContent = "Your browser doesn't support camera and microphone access."; return; }
    document.getElementById("cam-start").addEventListener("click", function () {
      if (camStream) camStream.getTracks().forEach(function (t) { t.stop(); });
      navigator.mediaDevices.getUserMedia({ video: camSel.value ? { deviceId: { exact: camSel.value }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } } }).then(function (s) {
        camStream = s; video.srcObject = s; video.hidden = false; var st = s.getVideoTracks()[0].getSettings();
        camInfo.innerHTML = '<b class="good">✓ Camera working</b> · ' + (st.width || "?") + "×" + (st.height || "?") + (st.frameRate ? " · " + Math.round(st.frameRate) + " fps" : "") + " · " + esc(s.getVideoTracks()[0].label);
        document.getElementById("cam-snap").hidden = false; root.setAttribute("data-cam", "ok"); listDevices();
      }).catch(function (e) { camInfo.textContent = err(e, "camera"); root.setAttribute("data-cam", "fail"); });
    });
    document.getElementById("cam-snap").addEventListener("click", function () { var c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight; c.getContext("2d").drawImage(video, 0, 0); var a = document.createElement("a"); a.href = c.toDataURL("image/jpeg", 0.92); a.download = "webcam-test.jpg"; a.click(); });
    document.getElementById("mic-start").addEventListener("click", function () {
      if (micStream) micStream.getTracks().forEach(function (t) { t.stop(); }); cancelAnimationFrame(raf);
      navigator.mediaDevices.getUserMedia({ audio: micSel.value ? { deviceId: { exact: micSel.value } } : true }).then(function (s) {
        micStream = s; actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var an = actx.createAnalyser(); an.fftSize = 1024; actx.createMediaStreamSource(s).connect(an);
        var data = new Uint8Array(an.fftSize), peak = 0;
        (function tick() { an.getByteTimeDomainData(data); var sum = 0; for (var i = 0; i < data.length; i++) { var v = (data[i] - 128) / 128; sum += v * v; } var rms = Math.sqrt(sum / data.length), lvl = Math.min(100, rms * 300); peak = Math.max(peak * 0.97, lvl); meter.style.setProperty("--lvl", lvl + "%"); meter.style.setProperty("--peak", peak + "%"); if (lvl > 8) root.setAttribute("data-mic", "heard"); raf = requestAnimationFrame(tick); })();
        micInfo.innerHTML = '<b class="good">✓ Microphone on.</b> Speak, and the bar should move. · ' + esc(s.getAudioTracks()[0].label);
        document.getElementById("mic-rec").hidden = false; root.setAttribute("data-mic", root.getAttribute("data-mic") || "ok"); listDevices();
      }).catch(function (e) { micInfo.textContent = err(e, "microphone"); });
    });
    document.getElementById("mic-rec").addEventListener("click", function () {
      if (!micStream || !window.MediaRecorder) return; var b = this, chunks = [], rec = new MediaRecorder(micStream);
      rec.ondataavailable = function (e) { chunks.push(e.data); }; rec.onstop = function () { var a = document.getElementById("mic-play"); a.src = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })); a.hidden = false; a.play(); b.disabled = false; b.textContent = "⏺ Record 5 seconds"; };
      rec.start(); b.disabled = true; var n = 5; b.textContent = "Recording… " + n; var iv = setInterval(function () { n--; b.textContent = "Recording… " + n; if (!n) { clearInterval(iv); rec.stop(); } }, 1000);
    });
    function tone(pan) {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume();
      var o = actx.createOscillator(), g = actx.createGain(), p = actx.createStereoPanner ? actx.createStereoPanner() : null;
      o.frequency.value = 440; g.gain.setValueAtTime(0.0001, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 1.2);
      if (p) { p.pan.value = pan; o.connect(g).connect(p).connect(actx.destination); } else o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 1.25); root.setAttribute("data-spk", "played");
    }
    root.querySelectorAll("[data-pan]").forEach(function (b) { b.addEventListener("click", function () { tone(+b.getAttribute("data-pan")); }); });
    window.addEventListener("pagehide", function () { [camStream, micStream].forEach(function (s) { if (s) s.getTracks().forEach(function (t) { t.stop(); }); }); });
    listDevices().catch(function () {});
  }

  window.ETBPlan = { budgetSummary: budgetSummary, subSummary: subSummary, icsFor: icsFor, settle: settle, scaleLine: scaleLine, parseQty: parseQty, hourIn: hourIn, tzOffset: tzOffset };
  document.addEventListener("DOMContentLoaded", function () {
    var f;
    if ((f = document.querySelector("[data-budget]"))) initBudget(f);
    if ((f = document.querySelector("[data-subs]"))) initSubs(f);
    if ((f = document.querySelector("form[data-travel]"))) initTravel(f);
    if ((f = document.querySelector("[data-split]"))) initSplit(f);
    if ((f = document.querySelector("form[data-meet]"))) initMeet(f);
    if ((f = document.querySelector("form[data-recipe]"))) initRecipe(f);
    if ((f = document.querySelector("[data-device]"))) initDevice(f);
  });
})();
