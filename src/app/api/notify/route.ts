import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, getPracticeHistoryById } from "@/lib/db";
import { Resend } from "resend";
import nodemailer from "nodemailer";

const SENDER_NAME = "PSLE Oral Hero";

function todayStr() {
  return new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function emailWrapper(content: string) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px">
        <div style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px">${SENDER_NAME}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:2px">PSLE Oral Practice Tracker</div>
      </div>
      <div style="padding:28px">
        ${content}
      </div>
      <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
        ${SENDER_NAME} · PSLE Oral Practice · ${todayStr()}
      </div>
    </div>`;
}

async function sendEmail(to: string[], subject: string, html: string, settings: Awaited<ReturnType<typeof getAllSettings>>) {
  const gmailUser = settings.gmailUser || process.env.GMAIL_USER;
  const gmailPass = settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    const info = await transporter.sendMail({ from: `${SENDER_NAME} <${gmailUser}>`, to, subject, html });
    console.log(`[NOTIFY] Gmail sent — messageId: ${info.messageId}`);
    return { sent: true, via: "gmail", id: info.messageId };
  }

  const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    const fromEmail = settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || `${SENDER_NAME} <onboarding@resend.dev>`;
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
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://gwdp-123776171401.asia-southeast1.run.app";
  const date = todayStr();

  let subject = "";
  let html = "";

  if (type === "completion") {
    const session = historyId ? await getPracticeHistoryById(Number(historyId)) : null;
    const score = session ? `${session.totalScore}/${session.maxScore}` : "N/A";
    const pct = session?.maxScore ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
    const exercise = session?.exerciseTitle || "an exercise";
    const exerciseType = session?.exerciseType === "READING" ? "Reading Aloud" : "Stimulus-Based Conversation";
    const feedback = session?.generalFeedback || "";
    const strengths = session?.strengths ? session.strengths.split("\n").filter(Boolean) : [];
    const areas = session?.areasOfImprovement ? session.areasOfImprovement.split("\n").filter(Boolean) : [];
    const scoreColor = pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
    const sessionUrl = session ? `${baseUrl}/parent/session/${session.id}` : `${baseUrl}/parent`;

    subject = `[${date}] ${childName} completed: ${exercise}`;
    html = emailWrapper(`
      <h2 style="margin:0 0 4px;color:#111827;font-size:22px">Practice Complete ✅</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px">${childName} just finished a session on ${date}.</p>

      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb">
        <div style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${exerciseType}</div>
        <div style="font-size:19px;font-weight:700;color:#111827;margin-bottom:12px">${exercise}</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span style="font-size:38px;font-weight:800;color:${scoreColor};line-height:1">${score}</span>
          <span style="font-size:16px;color:${scoreColor};font-weight:600">(${pct}%)</span>
        </div>
      </div>

      ${feedback ? `
      <div style="margin-bottom:20px">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">AI Feedback</div>
        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;background:#f9fafb;padding:14px;border-radius:8px;border-left:4px solid #7c3aed">${feedback}</p>
      </div>` : ""}

      ${strengths.length ? `
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:8px">✓ Doing Well</div>
        <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8">
          ${strengths.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>` : ""}

      ${areas.length ? `
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px">↑ Needs Support</div>
        <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8">
          ${areas.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>` : ""}

      <a href="${sessionUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px">View Full Results →</a>
    `);

  } else if (type === "missed") {
    const goal = settings.dailyPracticeGoal || 1;
    subject = `[${date}] Reminder: ${childName} hasn't practised today`;
    html = emailWrapper(`
      <h2 style="margin:0 0 4px;color:#111827;font-size:22px">Daily Practice Reminder 📚</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px">${childName} hasn't completed any practice exercises today (${date}).</p>

      <div style="background:#fef9c3;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #fde68a">
        <div style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:4px">Daily Goal</div>
        <div style="font-size:28px;font-weight:800;color:#92400e">${goal} exercise${goal > 1 ? "s" : ""}</div>
        <div style="font-size:13px;color:#92400e;margin-top:4px">Completed today: 0</div>
      </div>

      <a href="${baseUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px">Start Practising →</a>
    `);

  } else if (type === "test") {
    subject = `[${date}] ${SENDER_NAME} — Email Test`;
    html = emailWrapper(`
      <h2 style="margin:0 0 4px;color:#111827;font-size:22px">Email Notifications Working ✅</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Your ${SENDER_NAME} notification settings are configured correctly.</p>

      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #e5e7eb">
        <div style="font-size:12px;color:#9ca3af;font-weight:600;margin-bottom:4px">SENDING TO</div>
        <div style="font-weight:600;color:#111827;font-size:15px">${toEmails.join(", ")}</div>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7">You will receive alerts like this whenever ${childName} completes a practice session, including their score, AI feedback, strengths, and areas to improve.</p>

      <a href="${baseUrl}/parent" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px">Open Parent Dashboard →</a>
    `);
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
