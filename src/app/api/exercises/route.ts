import { NextResponse } from "next/server";
import { getAllExercises, prepopulateExercisesIfNeeded } from "@/lib/db";

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
