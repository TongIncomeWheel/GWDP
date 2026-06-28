import { NextRequest, NextResponse } from "next/server";
import { getAllExercises, prepopulateExercisesIfNeeded, setExerciseRepractice } from "@/lib/db";

export async function GET() {
  try {
    await prepopulateExercisesIfNeeded();
    const exercises = await getAllExercises();
    return NextResponse.json(exercises);
  } catch (e) {
    console.error("[EXERCISES API ERROR]", e);
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
    await setExerciseRepractice(Number(id), repracticeRequested);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[EXERCISES PUT ERROR]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
