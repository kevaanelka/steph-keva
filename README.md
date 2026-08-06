# Our Schedule

A private, mobile-first shared calendar. Static site, no backend, no build step.

## Files

```
index.html          the entire app (UI + logic)
firebase-config.js   your Firebase project keys — fill this in (see below)
manifest.json        PWA config (name, icons, theme color)
sw.js                offline caching (service worker)
icons/               home screen icons (192px, 512px) — cropped from your photo
images/lock-bg.jpg   the passcode-screen background photo
schedule.json        no longer used by the app — kept only as a readable
                      backup of the original July data (it's baked into
                      index.html as a one-time seed for a fresh database)
```

## Live shared editing (Firebase setup)

Plans now live in a small free Firestore database instead of a static file,
so adding something in the app syncs to both of your phones instantly. This
needs a one-time, free setup:

1. Go to **console.firebase.google.com**, sign in with any Google account.
2. **Add project** → name it anything → turn **off** Google Analytics (not
   needed) → Create.
3. On the project overview page, click the **Web icon `</>`** to register a
   web app. Nickname anything. Leave "Also set up Firebase Hosting"
   **unchecked** (you're already on GitHub Pages/Vercel/Netlify).
4. You'll see a `firebaseConfig` object with 6 values (`apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
   These are safe to be public — real security comes from step 6, not from
   hiding these. Paste them into `firebase-config.js`, replacing the
   `"PASTE_ME"` placeholders.
5. Left sidebar → **Build → Firestore Database → Create database** → pick a
   region close to you → **Production mode**.
6. Left sidebar → **Build → Authentication → Get started → Sign-in method**
   tab → **Anonymous** → Enable → Save. (This quietly verifies "this is
   someone using our app" with no login screen — your 4-digit passcode is
   still the actual gate.)
7. Back in **Firestore Database → Rules**, replace the contents with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /events/{eventId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   Click **Publish**.
8. Deploy (push `firebase-config.js` with your real values). The first
   person to open the app will automatically seed the database with the
   original July schedule — nothing is lost in the switch.

Until `firebase-config.js` is filled in, the app shows a friendly
"not configured yet" message instead of a broken screen.

**Editing in the app:** tap the **+** button (bottom right) to add a plan
from scratch, or open any day and tap **Add to this day** / the pencil icon
on an existing plan to edit it. There's a **Delete** button in edit mode too.

## Push notifications (proactive, even with the app closed)

The app already has a free "notify when you open it" feature (the 🔔 bell).
This section is for the upgraded version: a real push that arrives every
morning if there's something on the schedule, whether or not the app is
open. It needs a small one-time setup — about 15–20 minutes, and it's still
free at this scale, but Google requires a card on file for this tier.

**1. Upgrade to the Blaze plan**
Firebase Console → your project → bottom-left "Spark plan" → **Upgrade** →
**Blaze (Pay as you go)**. You won't be charged unless usage goes far beyond
what two people checking a shared calendar would ever generate.

**2. Generate a Web Push certificate (VAPID key)**
Firebase Console → ⚙️ **Project settings** → **Cloud Messaging** tab →
**Web configuration** → **Web Push certificates** → **Generate key pair**.
Copy the key shown, paste it into `firebase-config.js` as
`FIREBASE_VAPID_KEY`, replacing `"PASTE_ME"`.

**3. Install the tools (one-time, on your computer)**
```bash
# Node.js 20+ if you don't have it: https://nodejs.org
npm install -g firebase-tools
firebase login
```

**4. Deploy the function**
From inside this project folder (it already has `firebase.json`,
`.firebaserc`, and the `functions/` folder with the code):
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```
That's it — no interactive setup needed, the config files are already here.

**5. Turn it on in the app**
Commit + push your updated `firebase-config.js` (with the real VAPID key),
then in the app tap the 🔔 bell to grant notification permission — this
registers your device with the new system automatically, on top of the
existing lite version.

**What it does:** a scheduled Cloud Function (`functions/index.js`) runs
every day at 10:00 Asia/Jakarta time, checks Firestore for anything on that
day, and pushes a notification to every registered device. Change the time
by editing the `schedule` string at the top of that file (cron format) and
redeploying with the same `firebase deploy --only functions` command.

**Checking it's working:** `firebase functions:log` (run from this folder)
shows each run, including "No plans for [date] — skipping" on quiet days.

## What's interactive now

- **Passcode screen**: your photo as a blurred lock-screen background with a
  slow drift (disabled automatically if the OS "reduce motion" setting is on),
  plus a little heart-burst animation on a correct code.
- **Swipe gestures**: swipe left/right anywhere in the main content to move
  between months (same as the ‹ › buttons). Swipe down on the grabber bar at
  the top of a day's detail sheet to dismiss it, like a native bottom sheet.
- **Haptics**: light vibration on taps (day cells, tab switch, filters, unlock)
  on devices/browsers that support it — mostly Android Chrome; iOS Safari
  doesn't support the vibration API, so it's silently skipped there.

To swap in a different photo later, replace `images/lock-bg.jpg` and
re-crop `icons/icon-192.png` / `icons/icon-512.png` (same filenames, square).

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

## Adding a new category

Plans are edited in the app now (see "Live shared editing" above), but
categories are still static config for simplicity. To add one, open
`index.html`, find the `CATEGORIES` constant near the top of the `<script>`
block, and add a key with a `label`, `color` (hex), and `emoji` — it shows up
automatically in the filter chips, the add/edit form, and everywhere else.
Commit and push — Vercel/Netlify/Pages redeploy automatically.

## Regenerating icons

If you want different app icons, replace `icons/icon-192.png` and
`icons/icon-512.png` (same filenames, square PNGs) — no other changes needed.

## Adding to your home screen

- **iPhone**: open the deployed URL in Safari → Share → Add to Home Screen.
- **Android**: open in Chrome → ⋮ menu → Add to Home screen / Install app.

Once installed, it opens full-screen with no browser address bar.
