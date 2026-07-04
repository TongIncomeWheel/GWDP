import { NextRequest, NextResponse } from "next/server";
import { closeZhExercise } from "@/lib/zh-db";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await closeZhExercise(Number(id));
  return NextResponse.json({ ok: true });
}
