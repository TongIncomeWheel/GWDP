import { NextResponse } from "next/server";
import { getAllExercises, prepopulateExercisesIfNeeded } from "@/lib/db";

export async function GET() {
  prepopulateExercisesIfNeeded();
  const exercises = getAllExercises();
  return NextResponse.json(exercises);
}
