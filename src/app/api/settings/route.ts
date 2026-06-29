import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, saveAllSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getAllSettings();
    const envGeminiKey = process.env.GEMINI_API_KEY || "";
    const effectiveGeminiKey = settings.geminiApiKey || envGeminiKey;
    return NextResponse.json({
      ...settings,
      geminiApiKey: settings.geminiApiKey ? "••••" + settings.geminiApiKey.slice(-4) : "",
      resendApiKey: settings.resendApiKey ? "••••" + settings.resendApiKey.slice(-4) : "",
      gmailAppPassword: settings.gmailAppPassword ? "••••" + settings.gmailAppPassword.slice(-4) : "",
      hasEnvApiKey: !!envGeminiKey,
      hasEffectiveApiKey: !!effectiveGeminiKey,
      hasResendKey: !!settings.resendApiKey || !!process.env.RESEND_API_KEY,
      hasGmail: !!(settings.gmailUser && settings.gmailAppPassword),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: AppSettings & { hasEnvApiKey?: boolean; hasEffectiveApiKey?: boolean; hasResendKey?: boolean } = await request.json();
    const current = await getAllSettings();
    const toSave: AppSettings = {
      geminiApiKey: body.geminiApiKey === "••••" + current.geminiApiKey.slice(-4)
        ? current.geminiApiKey
        : (body.geminiApiKey ?? ""),
      resendApiKey: body.resendApiKey === "••••" + current.resendApiKey.slice(-4)
        ? current.resendApiKey
        : (body.resendApiKey ?? ""),
      resendFromEmail: body.resendFromEmail ?? "",
      gmailUser: body.gmailUser ?? "",
      gmailAppPassword: body.gmailAppPassword === "••••" + current.gmailAppPassword.slice(-4)
        ? current.gmailAppPassword
        : (body.gmailAppPassword ?? ""),
      notificationEmail: body.notificationEmail ?? "",
      emailOnCompletion: Boolean(body.emailOnCompletion),
      emailOnMissed: Boolean(body.emailOnMissed),
      childName: body.childName ?? "",
      dailyPracticeGoal: Number(body.dailyPracticeGoal) || 1,
    };
    await saveAllSettings(toSave);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
