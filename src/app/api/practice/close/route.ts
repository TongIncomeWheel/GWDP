import { NextRequest, NextResponse } from "next/server";
import { closeExercise } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await closeExercise(Number(id));
  return NextResponse.json({ ok: true });
}
