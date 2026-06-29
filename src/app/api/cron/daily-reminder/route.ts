import { NextRequest, NextResponse } from "next/server";
import { getAllPracticeHistoryMeta, getAllSettings } from "@/lib/db";

// Called daily at 20:00 SGT (12:00 UTC) by Cloud Scheduler.
// Sends a missed-practice email only if zero sessions were completed today (SGT).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // "Today" in SGT (UTC+8)
  const nowUtc = Date.now();
  const sgtOffset = 8 * 60 * 60 * 1000;
  const nowSgt = nowUtc + sgtOffset;
  const midnightSgt = nowSgt - (nowSgt % (24 * 60 * 60 * 1000));
  const todayStartUtc = midnightSgt - sgtOffset;
  const todayEndUtc = todayStartUtc + 24 * 60 * 60 * 1000;

  const history = await getAllPracticeHistoryMeta();
  const practicedToday = history.some(
    (h) => h.dateMillis !== undefined && h.dateMillis >= todayStartUtc && h.dateMillis < todayEndUtc
  );

  if (practicedToday) {
    return NextResponse.json({ skipped: true, reason: "Practice already completed today" });
  }

  const settings = await getAllSettings();
  if (!settings.notificationEmail || !settings.emailOnMissed) {
    return NextResponse.json({ skipped: true, reason: "Missed notifications not configured" });
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://gwdp-123776171401.asia-southeast1.run.app";
  const res = await fetch(`${baseUrl}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "missed" }),
  });
  const result = await res.json();
  return NextResponse.json(result);
}
