import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, getAllPracticeHistory } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { type, historyId } = await request.json();
  const settings = getAllSettings();

  if (!settings.notificationEmail) {
    return NextResponse.json({ skipped: true, reason: "No notification email configured" });
  }

  if (type === "completion" && !settings.emailOnCompletion) {
    return NextResponse.json({ skipped: true, reason: "Completion notifications disabled" });
  }

  if (type === "missed" && !settings.emailOnMissed) {
    return NextResponse.json({ skipped: true, reason: "Missed practice notifications disabled" });
  }

  const childName = settings.childName || "Your child";

  let subject = "";
  let body = "";

  if (type === "completion") {
    const history = getAllPracticeHistory();
    const session = history.find((h) => h.id === historyId);
    const score = session ? `${session.totalScore}/${session.maxScore}` : "N/A";
    const exercise = session?.exerciseTitle || "an exercise";
    subject = `${childName} completed: ${exercise}`;
    body = [
      `Hi!`,
      ``,
      `${childName} just completed "${exercise}".`,
      `AI Score: ${score}`,
      session?.generalFeedback ? `Feedback: ${session.generalFeedback}` : "",
      ``,
      `View the full results in the GWDP Parent Portal.`,
    ]
      .filter(Boolean)
      .join("\n");
  } else if (type === "missed") {
    const history = getAllPracticeHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todaySessions = history.filter((h) => h.dateMillis >= todayMs);
    const goal = settings.dailyPracticeGoal || 1;

    if (todaySessions.length >= goal) {
      return NextResponse.json({ skipped: true, reason: "Daily goal already met" });
    }

    subject = `Reminder: ${childName} hasn't practised today`;
    body = [
      `Hi!`,
      ``,
      `${childName} hasn't completed any practice exercises today.`,
      `Daily goal: ${goal} exercise${goal > 1 ? "s" : ""}`,
      `Completed today: ${todaySessions.length}`,
      ``,
      `Open the GWDP app to start practising!`,
    ].join("\n");
  }

  // For now, log the notification (actual email sending requires SMTP/Gmail API setup in Phase 4)
  console.log(`[NOTIFICATION] To: ${settings.notificationEmail}`);
  console.log(`[NOTIFICATION] Subject: ${subject}`);
  console.log(`[NOTIFICATION] Body:\n${body}`);

  return NextResponse.json({
    sent: false,
    queued: true,
    to: settings.notificationEmail,
    subject,
    note: "Email delivery will be active after SMTP/Gmail API configuration in deployment. Notification logged to server console.",
  });
}
