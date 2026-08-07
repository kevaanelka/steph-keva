// Paste your Firebase project's config here — Firebase Console → Project settings
// → scroll to "Your apps" → the web app (</>) you registered.
//
// These values are meant to be public/client-side. They are NOT secret keys —
// Firestore's actual security comes from the rules you set in the Firestore
// console (Build → Firestore Database → Rules), not from hiding these.
//
// Until this is filled in, the app will show a friendly "not configured yet"
// message instead of trying (and failing) to connect.
//
// Uses `self` instead of `window` on purpose — this file is loaded both by
// the page and by the service worker (for background push), and `self`
// works in both places while `window` only exists on the page.

self.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB3QQTxRBBHYItC4rhEGSqQmIVeiYP9dBo",
  authDomain: "stephanie-dish.firebaseapp.com",
  projectId: "stephanie-dish",
  storageBucket: "stephanie-dish.firebasestorage.app",
  messagingSenderId: "269606122063",
  appId: "1:269606122063:web:a3fe04a7d74bf2ce94703a",
};

// For push notifications: Firebase Console → Project settings → Cloud Messaging
// tab → "Web configuration" → Web Push certificates → Generate key pair.
// Paste the "Key pair" value here (it's the VAPID public key).
self.FIREBASE_VAPID_KEY = "BD3w43TtVpRf9B7J-BRzBJWr6NU2LeeyF0NaEXCYTdAI1jL6qNdQo6KyXg1fPalqip2kTH0uSW1eSw8o9pnvdeQ";

