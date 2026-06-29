import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, getPracticeHistoryById } from "@/lib/db";
import { Resend } from "resend";
import nodemailer from "nodemailer";

async function sendEmail(to: string[], subject: string, html: string, settings: Awaited<ReturnType<typeof getAllSettings>>) {
  // Gmail first (no domain needed, sends to anyone)
  const gmailUser = settings.gmailUser || process.env.GMAIL_USER;
  const gmailPass = settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    const info = await transporter.sendMail({ from: `GWDP <${gmailUser}>`, to, subject, html });
    console.log(`[NOTIFY] Gmail sent — messageId: ${info.messageId}`);
    return { sent: true, via: "gmail", id: info.messageId };
  }

  // Resend fallback (requires verified domain)
  const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    const fromEmail = settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({ from: fromEmail, to, subject, html });
    if (error) throw new Error(error.message);
    console.log(`[NOTIFY] Resend sent — id: ${data?.id}`);
    return { sent: true, via: "resend", id: data?.id };
  }

  throw new Error("No email provider configured. Add Gmail credentials or a Resend key in Settings.");
}

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

  const childName = settings.childName || "Your child";
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
        <p style="color:#888;font-size:12px;margin-top:20px">Log in to the Parent Portal to view full results.</p>
      </div>`;
  } else if (type === "missed") {
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
      </div>`;
  } else if (type === "test") {
    subject = "GWDP Notification Test";
    html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Email Notifications Working ✅</h2>
        <p style="color:#555;margin-bottom:20px">Your GWDP notification settings are configured correctly.</p>
        <div style="background:#fff;border-radius:8px;padding:16px">
          <div style="font-size:13px;color:#888;margin-bottom:4px">Sending to</div>
          <div style="font-weight:600;color:#1a1a2e">${toEmails.join(", ")}</div>
        </div>
        <p style="color:#888;font-size:12px;margin-top:20px">You will receive alerts like this when ${childName} completes a session.</p>
      </div>`;
  } else {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  try {
    const result = await sendEmail(toEmails, subject, html, settings);
    return NextResponse.json({ ...result, to: toEmails });
  } catch (e) {
    console.error("[NOTIFY] Error:", e);
    return NextResponse.json({ sent: false, error: String((e as Error).message) }, { status: 500 });
  }
}
