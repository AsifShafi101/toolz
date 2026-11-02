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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/screenshot") return screenshot(request, env, ctx, url);
    if (url.pathname.startsWith("/api/")) return json(404, { error: "Not found" });
    return env.ASSETS.fetch(request);
  },
};
