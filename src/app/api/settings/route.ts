import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, saveAllSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export async function GET() {
  const settings = getAllSettings();
  const masked = {
    ...settings,
    geminiApiKey: settings.geminiApiKey ? "••••" + settings.geminiApiKey.slice(-4) : "",
  };
  return NextResponse.json(masked);
}

export async function PUT(request: NextRequest) {
  const body: AppSettings = await request.json();
  const current = getAllSettings();
  const toSave: AppSettings = {
    geminiApiKey: body.geminiApiKey === "••••" + current.geminiApiKey.slice(-4)
      ? current.geminiApiKey
      : body.geminiApiKey,
    notificationEmail: body.notificationEmail,
    emailOnCompletion: body.emailOnCompletion,
    emailOnMissed: body.emailOnMissed,
    childName: body.childName,
    dailyPracticeGoal: body.dailyPracticeGoal || 1,
  };
  saveAllSettings(toSave);
  return NextResponse.json({ ok: true });
}
