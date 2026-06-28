import { NextRequest, NextResponse } from "next/server";
import { getTestResults, saveTestResult } from "@/lib/db";

export async function GET() {
  try {
    const results = await getTestResults();
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, notes, tester } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await saveTestResult(id, status ?? "untested", notes ?? "", tester ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
