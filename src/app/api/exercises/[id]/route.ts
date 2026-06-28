import { NextResponse } from "next/server";
import { getExerciseById } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exercise = await getExerciseById(Number(id));
    if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(exercise);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
