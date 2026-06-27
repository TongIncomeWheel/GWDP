import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, saveAllSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = getAllSettings();
    const masked = {
      ...settings,
      geminiApiKey: settings.geminiApiKey ? "••••" + settings.geminiApiKey.slice(-4) : "",
    };
    return NextResponse.json(masked);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: AppSettings = await request.json();
    const current = getAllSettings();
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
    saveAllSettings(toSave);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
