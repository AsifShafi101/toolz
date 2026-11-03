// etoolbox Worker: serves the static site and provides /api/screenshot using Cloudflare Browser Rendering.
import puppeteer from "@cloudflare/puppeteer";

const DEVICES = {
  desktop: { width: 1366, height: 768, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const MAX_FULL_HEIGHT = 8000;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

// Only allow public http(s) websites — never internal or private addresses.
export function checkTarget(raw) {
  let s = String(raw || "").trim();
  if (!s) return { error: "Enter a website address." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch { return { error: "That isn't a valid web address." }; }
  if (!/^https?:$/.test(u.protocol)) return { error: "Only http and https websites can be captured." };
  if (u.username || u.password) return { error: "Addresses with passwords aren't allowed." };
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h.includes(".") || /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(h)) return { error: "Only public websites can be captured." };
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return { error: "Please use a website name rather than an IP address." };
  if (u.port && !["80", "443"].includes(u.port)) return { error: "Only standard web ports are allowed." };
  return { url: u.toString() };
}

async function screenshot(request, env, ctx, reqUrl) {
  if (request.method !== "GET") return json(405, { error: "Method not allowed" });
  const t = checkTarget(reqUrl.searchParams.get("url"));
  if (t.error) return json(400, { error: t.error });
  const device = DEVICES[reqUrl.searchParams.get("device")] ? reqUrl.searchParams.get("device") : "desktop";
  const full = reqUrl.searchParams.get("full") === "1";

  const cacheKey = new Request(`https://cache.etoolbox/shot?u=${encodeURIComponent(t.url)}&d=${device}&f=${full ? 1 : 0}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  if (!env.BROWSER) return json(503, { error: "The screenshot service isn't switched on yet." });
  let browser;
  try {
    browser = await puppeteer.launch(env.BROWSER);
  } catch (e) {
    const busy = /429|limit/i.test(String(e && e.message));
    return json(busy ? 429 : 503, { error: busy ? "Our free screenshot capacity is used up for now. Please try again in a minute (or tomorrow if it's been busy)." : "The screenshot service is unavailable right now. Please try again shortly." });
  }
  try {
    const page = await browser.newPage();
    await page.setViewport(DEVICES[device]);
    if (DEVICES[device].isMobile) await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    try { await page.goto(t.url, { waitUntil: "networkidle2", timeout: 25000 }); }
    catch { await page.goto(t.url, { waitUntil: "load", timeout: 20000 }); }
    let clip;
    if (full) {
      const h = await page.evaluate(() => Math.max(document.body ? document.body.scrollHeight : 0, document.documentElement.scrollHeight));
      clip = { x: 0, y: 0, width: DEVICES[device].width, height: Math.min(h || DEVICES[device].height, MAX_FULL_HEIGHT) };
    }
    const img = await page.screenshot({ type: "jpeg", quality: 82, fullPage: !!full && !clip, clip, captureBeyondViewport: !!full });
    const res = new Response(img, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=3600, s-maxage=86400", "x-captured-url": t.url } });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (e) {
    return json(502, { error: "We couldn't load that website. Check the address, or the site may be blocking automated visits." });
  } finally {
    try { await browser.close(); } catch {}
  }
}


// ---- DNS over HTTPS (RFC 8484) against several public resolvers ----
export const RESOLVERS = {
  cloudflare: { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query" },
  google: { name: "Google", url: "https://dns.google/dns-query" },
  quad9: { name: "Quad9", url: "https://dns.quad9.net/dns-query" },
  opendns: { name: "Cisco OpenDNS", url: "https://doh.opendns.com/dns-query" },
  adguard: { name: "AdGuard", url: "https://dns.adguard-dns.com/dns-query" },
  mullvad: { name: "Mullvad", url: "https://dns.mullvad.net/dns-query" },
  dnssb: { name: "DNS.SB", url: "https://doh.dns.sb/dns-query" },
  controld: { name: "Control D", url: "https://freedns.controld.com/p0" },
};
export const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257 };
const TYPE_NAMES = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));
const RCODES = ["NOERROR", "FORMERR", "SERVFAIL", "NXDOMAIN", "NOTIMP", "REFUSED"];

export function encodeQuery(name, type) {
  const labels = name.replace(/\.$/, "").split(".");
  const parts = [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  for (const l of labels) { const b = new TextEncoder().encode(l); if (!b.length || b.length > 63) throw new Error("bad label"); parts.push(b.length, ...b); }
  parts.push(0, TYPES[type] >> 8, TYPES[type] & 255, 0, 1);
  return new Uint8Array(parts);
}
function readName(buf, off) {
  const labels = []; let jumped = false, next = off, guard = 0;
  while (guard++ < 128) {
    const len = buf[off];
    if (len === 0) { if (!jumped) next = off + 1; break; }
    if ((len & 0xc0) === 0xc0) { if (!jumped) next = off + 2; off = ((len & 0x3f) << 8) | buf[off + 1]; jumped = true; continue; }
    labels.push(new TextDecoder().decode(buf.subarray(off + 1, off + 1 + len))); off += len + 1;
  }
  return [labels.join(".") || ".", next];
}
export function decodeResponse(ab) {
  const b = new Uint8Array(ab), dv = new DataView(ab);
  const rcode = b[3] & 15, qd = dv.getUint16(4), an = dv.getUint16(6);
  let off = 12;
  for (let i = 0; i < qd; i++) { off = readName(b, off)[1] + 4; }
  const answers = [];
  for (let i = 0; i < an; i++) {
    const [name, o2] = readName(b, off); off = o2;
    const type = dv.getUint16(off), ttl = dv.getUint32(off + 4), len = dv.getUint16(off + 8), rd = off + 10; off = rd + len;
    let data;
    if (type === 1) data = [...b.subarray(rd, rd + 4)].join(".");
    else if (type === 28) { const h = []; for (let j = 0; j < 16; j += 2) h.push(dv.getUint16(rd + j).toString(16)); data = h.join(":").replace(/\b(?:0+:){2,}/, ":").replace(/^0::|::0$/, "::"); }
    else if (type === 2 || type === 5 || type === 12) data = readName(b, rd)[0];
    else if (type === 15) data = dv.getUint16(rd) + " " + readName(b, rd + 2)[0];
    else if (type === 16) { const t = []; let p = rd; while (p < rd + len) { const l = b[p]; t.push(new TextDecoder().decode(b.subarray(p + 1, p + 1 + l))); p += l + 1; } data = t.join(""); }
    else if (type === 6) { const [m, p1] = readName(b, rd), [r, p2] = readName(b, p1); data = `${m} ${r} ${dv.getUint32(p2)} ${dv.getUint32(p2 + 4)} ${dv.getUint32(p2 + 8)} ${dv.getUint32(p2 + 12)} ${dv.getUint32(p2 + 16)}`; }
    else if (type === 33) data = `${dv.getUint16(rd)} ${dv.getUint16(rd + 2)} ${dv.getUint16(rd + 4)} ${readName(b, rd + 6)[0]}`;
    else if (type === 257) { const tl = b[rd + 1]; data = `${b[rd]} ${new TextDecoder().decode(b.subarray(rd + 2, rd + 2 + tl))} "${new TextDecoder().decode(b.subarray(rd + 2 + tl, rd + len))}"`; }
    else data = [...b.subarray(rd, rd + len)].map(x => x.toString(16).padStart(2, "0")).join("");
    answers.push({ name, type: TYPE_NAMES[type] || String(type), ttl, data });
  }
  return { status: RCODES[rcode] || "RCODE" + rcode, answers };
}
function b64url(u8) { let s = ""; for (const x of u8) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function askResolver(key, name, type) {
  const r = RESOLVERS[key], t0 = Date.now();
  try {
    const res = await fetch(r.url + "?dns=" + b64url(encodeQuery(name, type)), { headers: { accept: "application/dns-message" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return { id: key, resolver: r.name, ms: Date.now() - t0, ...decodeResponse(await res.arrayBuffer()) };
  } catch (e) { return { id: key, resolver: r.name, ms: Date.now() - t0, status: "ERROR", error: String(e && e.message || e), answers: [] }; }
}
async function dnsApi(url) {
  let name = (url.searchParams.get("name") || "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/\.$/, "");
  const type = (url.searchParams.get("type") || "A").toUpperCase();
  if (!/^(?=.{1,253}$)([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/i.test(name)) return json(400, { error: "Enter a valid domain name, e.g. example.co.uk" });
  if (!TYPES[type]) return json(400, { error: "Unsupported record type." });
  const only = url.searchParams.get("resolver");
  const keys = only && RESOLVERS[only] ? [only] : Object.keys(RESOLVERS);
  const results = await Promise.all(keys.map(k => askResolver(k, name, type)));
  return new Response(JSON.stringify({ name, type, results }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

// ---- Logo hosting for email signatures (KV: LOGOS) ----
const MAX_LOGO = 200 * 1024;
function sniff(b) {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  return null;
}
async function uploadLogo(request, env, url) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!env.LOGOS) return json(503, { error: "Logo hosting isn't switched on." });
  const len = +(request.headers.get("content-length") || 0);
  if (len > MAX_LOGO) return json(413, { error: "That logo is too large. Please use an image under 200 KB." });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_LOGO) return json(413, { error: "That logo is too large. Please use an image under 200 KB." });
  const kind = sniff(bytes);
  if (!kind) return json(415, { error: "Please upload a PNG or JPG image." });
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].slice(0, 16).map(x => x.toString(16).padStart(2, "0")).join("");
  const key = hash + "." + kind.ext;
  const exists = await env.LOGOS.get(key, { type: "stream" });
  if (!exists) await env.LOGOS.put(key, bytes, { metadata: { type: kind.type, created: Date.now() } });
  else await exists.cancel();
  return json(200, { url: url.origin + "/logo/" + key });
}
async function serveLogo(env, path) {
  const m = /^\/logo\/([0-9a-f]{32}\.(png|jpg))$/.exec(path);
  if (!m || !env.LOGOS) return new Response("Not found", { status: 404 });
  const data = await env.LOGOS.get(m[1], { type: "arrayBuffer" });
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data, { headers: { "content-type": m[2] === "png" ? "image/png" : "image/jpeg", "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'", "access-control-allow-origin": "*" } });
}

// ---- Pro licence keys (KV: PRO). Entry: key "key:ETB-XXXX-XXXX-XXXX-XXXX" → {"email":"…","plan":"pro","expires":"2027-11-03"} ----
async function proActivate(request, env) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!env.PRO) return json(503, { error: "Pro activation isn't switched on yet." });
  let body = {}; try { body = await request.json(); } catch {}
  const key = String(body.key || "").trim().toUpperCase();
  if (!/^ETB(-[A-Z0-9]{4}){4}$/.test(key)) return json(400, { error: "Pro keys look like ETB-XXXX-XXXX-XXXX-XXXX." });
  const rec = await env.PRO.get("key:" + key, { type: "json" });
  if (!rec) return json(404, { error: "That key isn't valid. Check for typos, or contact us if you've just paid." });
  if (rec.revoked) return json(410, { error: "This key has been cancelled." });
  if (rec.expires && Date.parse(rec.expires) < Date.now()) return json(410, { error: "This key expired on " + rec.expires + ". Renew Pro to keep using it." });
  return json(200, { ok: true, plan: rec.plan || "pro", expires: rec.expires || null });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/screenshot") return screenshot(request, env, ctx, url);
    if (url.pathname === "/api/logo") return uploadLogo(request, env, url);
    if (url.pathname === "/api/dns") return dnsApi(url);
    if (url.pathname === "/api/pro/activate") return proActivate(request, env);
    if (url.pathname.startsWith("/logo/")) return serveLogo(env, url.pathname);
    if (url.pathname.startsWith("/api/")) return json(404, { error: "Not found" });
    return env.ASSETS.fetch(request);
  },
};
