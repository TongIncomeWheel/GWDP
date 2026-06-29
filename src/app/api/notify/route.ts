import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, getPracticeHistoryById } from "@/lib/db";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const { type, historyId } = await request.json();
  const settings = await getAllSettings();

  if (!settings.notificationEmail) {
    return NextResponse.json({ skipped: true, reason: "No notification email configured" });
  }
  if (type === "completion" && !settings.emailOnCompletion) {
    return NextResponse.json({ skipped: true, reason: "Completion notifications disabled" });
  }
  if (type === "missed" && !settings.emailOnMissed) {
    return NextResponse.json({ skipped: true, reason: "Missed practice notifications disabled" });
  }

  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[NOTIFY] No Resend API key — configure it in Parent > Settings");
    return NextResponse.json({ skipped: true, reason: "Resend API key not configured" });
  }

  const childName = settings.childName || "Your child";
  const fromEmail = settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || "GWDP <notifications@gwdp.app>";
  // Support multiple comma-separated recipients
  const toEmails = settings.notificationEmail.split(",").map((e) => e.trim()).filter(Boolean);

  let subject = "";
  let html = "";

  if (type === "completion") {
    const session = historyId ? await getPracticeHistoryById(Number(historyId)) : null;
    const score = session ? `${session.totalScore}/${session.maxScore}` : "N/A";
    const exercise = session?.exerciseTitle || "an exercise";
    const exerciseType = session?.exerciseType === "READING" ? "Reading Aloud" : "Stimulus-Based Conversation";
    const feedback = session?.generalFeedback || "";

    subject = `${childName} completed: ${exercise}`;
    html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Practice Complete ✅</h2>
        <p style="color:#555;margin-bottom:20px">${childName} just finished a practice session.</p>
        <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:16px">
          <div style="font-size:13px;color:#888;margin-bottom:4px">${exerciseType}</div>
          <div style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:4px">${exercise}</div>
          <div style="font-size:28px;font-weight:800;color:#7c3aed">Score: ${score}</div>
        </div>
        ${feedback ? `<div style="background:#fff;border-radius:8px;padding:16px;border-left:4px solid #7c3aed"><p style="margin:0;color:#444;font-size:14px;line-height:1.6">${feedback}</p></div>` : ""}
        <p style="color:#888;font-size:12px;margin-top:20px">Log in to the Parent Portal to view the full results and provide your own grading.</p>
      </div>
    `;
  } else if (type === "missed") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const goal = settings.dailyPracticeGoal || 1;

    subject = `Reminder: ${childName} hasn't practised today`;
    html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Daily Practice Reminder 📚</h2>
        <p style="color:#555;margin-bottom:20px">${childName} hasn't completed any practice exercises today.</p>
        <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:16px">
          <div style="color:#888;font-size:13px">Daily goal</div>
          <div style="font-size:22px;font-weight:700;color:#1a1a2e">${goal} exercise${goal > 1 ? "s" : ""}</div>
        </div>
        <p style="color:#888;font-size:12px;margin-top:20px">Open the GWDP app to start practising!</p>
      </div>
    `;
  } else {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject,
      html,
    });

    if (error) {
      console.error("[NOTIFY] Resend error:", error);
      return NextResponse.json({ sent: false, error: error.message }, { status: 500 });
    }

    console.log(`[NOTIFY] Sent to ${toEmails.join(", ")} — id: ${data?.id}`);
    return NextResponse.json({ sent: true, id: data?.id, to: toEmails });
  } catch (e) {
    console.error("[NOTIFY] Exception:", e);
    return NextResponse.json({ sent: false, error: String(e) }, { status: 500 });
  }
}
