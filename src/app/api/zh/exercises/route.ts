import { NextRequest, NextResponse } from "next/server";
import { getAllZhExercises, prepopulateZhExercisesIfNeeded, setZhExerciseRepractice } from "@/lib/zh-db";

export async function GET() {
  try {
    await prepopulateZhExercisesIfNeeded();
    const exercises = await getAllZhExercises();
    return NextResponse.json(exercises);
  } catch (e) {
    console.error("[ZH EXERCISES API ERROR]", e);
    return NextResponse.json(
      { error: (e as Error).message, stack: (e as Error).stack },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, repracticeRequested } = body;
    if (!id || typeof repracticeRequested !== "boolean") {
      return NextResponse.json({ error: "id and repracticeRequested required" }, { status: 400 });
    }
    await setZhExerciseRepractice(Number(id), repracticeRequested);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ZH EXERCISES PUT ERROR]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
