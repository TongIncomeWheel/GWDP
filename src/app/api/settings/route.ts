import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, saveAllSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getAllSettings();
    const envKey = process.env.GEMINI_API_KEY || "";
    const effectiveKey = settings.geminiApiKey || envKey;
    const masked = {
      ...settings,
      geminiApiKey: settings.geminiApiKey ? "••••" + settings.geminiApiKey.slice(-4) : "",
      hasEnvApiKey: !!envKey,
      hasEffectiveApiKey: !!effectiveKey,
    };
    return NextResponse.json(masked);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: AppSettings = await request.json();
    const current = await getAllSettings();
    const toSave: AppSettings = {
      geminiApiKey: body.geminiApiKey === "••••" + current.geminiApiKey.slice(-4)
        ? current.geminiApiKey
        : body.geminiApiKey,
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
