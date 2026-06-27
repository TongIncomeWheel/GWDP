import { NextRequest, NextResponse } from "next/server";
import {
  getAllPracticeHistory,
  getPracticeHistoryById,
  insertPracticeHistory,
  updatePracticeHistory,
  deletePracticeHistoryById,
} from "@/lib/db";
import type { PracticeHistory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const history = getPracticeHistoryById(Number(id));
    if (!history) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(history);
  }
  return NextResponse.json(getAllPracticeHistory());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = insertPracticeHistory({
    exerciseId: body.exerciseId,
    exerciseTitle: body.exerciseTitle || "",
    exerciseType: body.exerciseType || "READING",
    exerciseTopic: body.exerciseTopic || "",
    dateMillis: Date.now(),
    audioPath1: null,
    audioPath2: null,
    audioPath3: null,
    transcript1: body.transcript1 || null,
    transcript2: body.transcript2 || null,
    transcript3: body.transcript3 || null,
    score1: 0,
    score2: 0,
    score3: 0,
    totalScore: 0,
    maxScore: 0,
    generalFeedback: null,
    strengths: null,
    areasOfImprovement: null,
    modelAnswer1: null,
    modelAnswer2: null,
    modelAnswer3: null,
    isEvaluated: false,
    isEvaluating: false,
    errorMessage: null,
  });
  return NextResponse.json({ id });
}

export async function PUT(request: NextRequest) {
  const body: PracticeHistory = await request.json();
  updatePracticeHistory(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deletePracticeHistoryById(Number(id));
  return NextResponse.json({ ok: true });
}
