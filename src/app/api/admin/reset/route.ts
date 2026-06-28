import { NextResponse } from "next/server";
import { resetAllPracticeHistory } from "@/lib/db";

export async function DELETE() {
  try {
    await resetAllPracticeHistory();
    return NextResponse.json({ success: true, message: "All practice history deleted and counters reset." });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
