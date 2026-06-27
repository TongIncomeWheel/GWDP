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
    const history = await getPracticeHistoryById(Number(id));
    if (!history) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(history);
  }
  return NextResponse.json(await getAllPracticeHistory());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = await insertPracticeHistory({
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
    parentScore1: null,
    parentScore2: null,
    parentScore3: null,
    parentFeedback: null,
    parentTotalScore: null,
    audioBlob1: body.audioBlob1 || null,
    audioBlob2: body.audioBlob2 || null,
    audioBlob3: body.audioBlob3 || null,
    structuredTranscript1: body.structuredTranscript1 || null,
    structuredTranscript2: body.structuredTranscript2 || null,
    structuredTranscript3: body.structuredTranscript3 || null,
    isClosed: false,
  });
  return NextResponse.json({ id });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (body.id) {
    const existing = await getPracticeHistoryById(Number(body.id));
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated: PracticeHistory = {
      ...existing,
      exerciseId: body.exerciseId ?? existing.exerciseId,
      exerciseTitle: body.exerciseTitle ?? existing.exerciseTitle,
      exerciseType: body.exerciseType ?? existing.exerciseType,
      exerciseTopic: body.exerciseTopic ?? existing.exerciseTopic,
      dateMillis: body.dateMillis ?? existing.dateMillis,
      audioPath1: body.audioPath1 !== undefined ? body.audioPath1 : existing.audioPath1,
      audioPath2: body.audioPath2 !== undefined ? body.audioPath2 : existing.audioPath2,
      audioPath3: body.audioPath3 !== undefined ? body.audioPath3 : existing.audioPath3,
      transcript1: body.transcript1 !== undefined ? body.transcript1 : existing.transcript1,
      transcript2: body.transcript2 !== undefined ? body.transcript2 : existing.transcript2,
      transcript3: body.transcript3 !== undefined ? body.transcript3 : existing.transcript3,
      score1: body.score1 ?? existing.score1,
      score2: body.score2 ?? existing.score2,
      score3: body.score3 ?? existing.score3,
      totalScore: body.totalScore ?? existing.totalScore,
      maxScore: body.maxScore ?? existing.maxScore,
      generalFeedback: body.generalFeedback !== undefined ? body.generalFeedback : existing.generalFeedback,
      strengths: body.strengths !== undefined ? body.strengths : existing.strengths,
      areasOfImprovement: body.areasOfImprovement !== undefined ? body.areasOfImprovement : existing.areasOfImprovement,
      modelAnswer1: body.modelAnswer1 !== undefined ? body.modelAnswer1 : existing.modelAnswer1,
      modelAnswer2: body.modelAnswer2 !== undefined ? body.modelAnswer2 : existing.modelAnswer2,
      modelAnswer3: body.modelAnswer3 !== undefined ? body.modelAnswer3 : existing.modelAnswer3,
      isEvaluated: body.isEvaluated !== undefined ? body.isEvaluated : existing.isEvaluated,
      isEvaluating: body.isEvaluating !== undefined ? body.isEvaluating : existing.isEvaluating,
      errorMessage: body.errorMessage !== undefined ? body.errorMessage : existing.errorMessage,
      parentScore1: body.parentScore1 !== undefined ? body.parentScore1 : existing.parentScore1,
      parentScore2: body.parentScore2 !== undefined ? body.parentScore2 : existing.parentScore2,
      parentScore3: body.parentScore3 !== undefined ? body.parentScore3 : existing.parentScore3,
      parentFeedback: body.parentFeedback !== undefined ? body.parentFeedback : existing.parentFeedback,
      parentTotalScore: body.parentTotalScore !== undefined ? body.parentTotalScore : existing.parentTotalScore,
      audioBlob1: body.audioBlob1 !== undefined ? body.audioBlob1 : existing.audioBlob1,
      audioBlob2: body.audioBlob2 !== undefined ? body.audioBlob2 : existing.audioBlob2,
      audioBlob3: body.audioBlob3 !== undefined ? body.audioBlob3 : existing.audioBlob3,
      structuredTranscript1: body.structuredTranscript1 !== undefined ? body.structuredTranscript1 : existing.structuredTranscript1,
      structuredTranscript2: body.structuredTranscript2 !== undefined ? body.structuredTranscript2 : existing.structuredTranscript2,
      structuredTranscript3: body.structuredTranscript3 !== undefined ? body.structuredTranscript3 : existing.structuredTranscript3,
      isClosed: body.isClosed !== undefined ? body.isClosed : existing.isClosed,
    };

    await updatePracticeHistory(updated);
    return NextResponse.json({ ok: true });
  }

  const fullBody: PracticeHistory = body;
  await updatePracticeHistory(fullBody);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePracticeHistoryById(Number(id));
  return NextResponse.json({ ok: true });
}
