# Our Schedule

A private, mobile-first shared calendar. Static site, no backend, no build step.

## Files

```
index.html        the entire app (UI + logic)
schedule.json      your editable data — edit this to add/change plans
manifest.json      PWA config (name, icons, theme color)
sw.js              offline caching (service worker)
icons/             home screen icons (192px, 512px)
```

## Run it locally

Opening `index.html` directly with `file://` won't work — `fetch()` and the
passcode hashing (`crypto.subtle`) both require a real server context.

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy (Vercel or Netlify)

Push this folder to a **private** GitHub repo, then import it as-is —
no build command, no output directory override needed (static root).

- **Vercel**: New Project → Import your repo → Framework Preset: "Other" → Deploy.
- **Netlify**: Add new site → Import from Git → leave build command blank,
  publish directory `.` → Deploy.

Both give you HTTPS automatically, which you need for the passcode to work
and for "Add to Home Screen" to offer the standalone (no address bar) mode.

## Change the passcode

The default is **1234**. To change it:

1. Open your browser console (on desktop is easiest) and run:
   ```js
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOUR-4-DIGITS"))
     .then(b => console.log(Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,"0")).join("")))
   ```
2. Copy the printed hash into `index.html`, replacing the `PASSCODE_HASH`
   constant near the top of the `<script>` block.

This is a deterrent for casual lookers, not real security — anyone who reads
the source can brute-force 4 digits offline. Don't put anything in here you
wouldn't want a determined visitor to see.

## Update the schedule

Edit `schedule.json` directly. Each event looks like:

```json
{
  "id": "20260814-1",
  "date": "2026-08-14",
  "block": ["morning"],
  "category": "sports",
  "title": "Run — GBK",
  "note": ""
}
```

- `block`: one of `["morning"]`, `["afternoon"]`, `["night"]`, `["anytime"]`,
  or a span like `["afternoon","night"]` for something that runs across blocks.
- `category`: must match a key under `categories` at the top of the file
  (`sports`, `social`, `church`, `date`, `other`). Add your own category
  there any time — give it a `label`, `color` (hex), and `emoji`, and it
  shows up automatically in the filter chips and everywhere else.
- Month navigation (‹ ›) works for any month you add data for — just add
  more `events` entries with the right `date` and it'll appear.

Commit and push — Vercel/Netlify redeploy automatically.

## Regenerating icons

If you want different app icons, replace `icons/icon-192.png` and
`icons/icon-512.png` (same filenames, square PNGs) — no other changes needed.

## Adding to your home screen

- **iPhone**: open the deployed URL in Safari → Share → Add to Home Screen.
- **Android**: open in Chrome → ⋮ menu → Add to Home screen / Install app.

Once installed, it opens full-screen with no browser address bar.
