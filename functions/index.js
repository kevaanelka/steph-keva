// Runs once a day and pushes a notification to both of your phones if
// there's anything on the schedule for that day.
//
// Deploy with:
//   firebase deploy --only functions
//
// Change the time it fires by editing the `schedule` cron string below
// (minute hour * * *, in the `timeZone` given) — currently 07:00 Asia/Jakarta.

const { onSchedule } = require("firebase-functions/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const CATEGORY_EMOJI = {
  sports: "🏃",
  social: "🎉",
  church: "🙏",
  date: "💕",
  other: "✨",
};

const BLOCK_ORDER = { morning: 0, afternoon: 1, night: 2, anytime: 3 };

exports.dailyDigest = onSchedule(
  { schedule: "0 7 * * *", timeZone: "Asia/Jakarta" },
  async () => {
    const db = getFirestore();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const eventsSnap = await db.collection("events").where("date", "==", todayStr).get();
    if (eventsSnap.empty) {
      console.log(`No plans for ${todayStr} — skipping.`);
      return;
    }

    const events = eventsSnap.docs.map((d) => d.data());
    events.sort((a, b) => (BLOCK_ORDER[a.block?.[0]] ?? 9) - (BLOCK_ORDER[b.block?.[0]] ?? 9));

    const names = events.slice(0, 3).map((e) => `${CATEGORY_EMOJI[e.category] || "✨"} ${e.title}`).join(", ");
    const extra = events.length > 3 ? ` +${events.length - 3} more` : "";

    const tokensSnap = await db.collection("pushTokens").get();
    if (tokensSnap.empty) {
      console.log("No registered devices — skipping.");
      return;
    }
    const tokens = tokensSnap.docs.map((d) => d.id);

    const message = {
      notification: {
        title: "Today's plans 💜",
        body: names + extra,
      },
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`Sent to ${response.successCount}/${tokens.length} device(s).`);

    // Clean up tokens that are no longer valid (app uninstalled, etc.)
    const deletions = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error && r.error.code === "messaging/registration-token-not-registered") {
        deletions.push(db.collection("pushTokens").doc(tokens[i]).delete());
      }
    });
    if (deletions.length) await Promise.all(deletions);
  }
);
