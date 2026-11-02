# etoolbox.co.uk

Free QR code tools for UK small businesses. This is a plain static site: no build step, no server and no database.

## Tools
| Page | What it does |
|---|---|
| `/qr-code-generator/` | Website or text QR codes |
| `/menu-qr-code-generator/` | Menu QR code plus a printable A6 table card |
| `/wifi-qr-code-generator/` | Guests scan to join Wi-Fi |
| `/vcard-qr-code-generator/` | Contact card (vCard) |
| `/whatsapp-qr-code-generator/` | Opens a WhatsApp chat (UK `0…` numbers become `+44`) |
| `/pricing/` | Free vs Pro (dynamic codes) |

Everything runs in the visitor's browser. Downloads are available as PNG (512/1024/2048 px) and SVG.

## Settings
Edit `assets/config.js` to set:
- `contactEmail`
- `proMonthlyCheckoutUrl` / `proYearlyCheckoutUrl`: paste your Stripe Payment Links here. While these are empty, the Pro buttons say "Join early access" and open an email instead.

## Deploy (free) on Cloudflare Pages
1. Go to Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** and pick this repo.
2. Framework preset: **None**. Leave the build command empty. Set the output directory to `/`.
3. After it deploys, open **Custom domains** and add `etoolbox.co.uk`.
4. Optional: turn on **Web Analytics** (free, no cookies), then submit `https://etoolbox.co.uk/sitemap.xml` in Google Search Console.

## Files
- `assets/app.js`: generator logic (payload builders, rendering, downloads, table card)
- `assets/qrcode.js`: QR encoder by Kazuhiko Arase (MIT licence)
- `assets/style.css`: all styles
