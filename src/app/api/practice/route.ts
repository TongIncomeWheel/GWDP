import { NextRequest, NextResponse } from "next/server";
import {
  getAllPracticeHistoryMeta,
  getPracticeHistoryById,
  insertPracticeHistory,
  updateParentGrading,
  deletePracticeHistoryById,
} from "@/lib/db";
import type { PracticeHistory } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const history = await getPracticeHistoryById(Number(id));
      if (!history) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(history);
    }
    return NextResponse.json(await getAllPracticeHistoryMeta());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Audio already uploaded to GCS by the client; paths passed directly.
    const audioPath1: string | null = body.audioPath1 || null;
    const audioPath2: string | null = body.audioPath2 || null;
    const audioPath3: string | null = body.audioPath3 || null;

    const id = await insertPracticeHistory({
      exerciseId: body.exerciseId,
      exerciseTitle: body.exerciseTitle || "",
      exerciseType: body.exerciseType || "READING",
      exerciseTopic: body.exerciseTopic || "",
      dateMillis: Date.now(),
      audioPath1: audioPath1 ?? null,
      audioPath2: audioPath2 ?? null,
      audioPath3: audioPath3 ?? null,
      transcript1: body.transcript1 || null,
      transcript2: body.transcript2 || null,
      transcript3: body.transcript3 || null,
      score1: 0, score2: 0, score3: 0,
      totalScore: 0, maxScore: 0,
      generalFeedback: null, strengths: null, areasOfImprovement: null,
      modelAnswer1: null, modelAnswer2: null, modelAnswer3: null,
      isEvaluated: false, isEvaluating: false, errorMessage: null,
      parentScore1: null, parentScore2: null, parentScore3: null,
      parentFeedback: null, parentTotalScore: null,
      audioBlob1: null,
      audioBlob2: null,
      audioBlob3: null,
      structuredTranscript1: body.structuredTranscript1 || null,
      structuredTranscript2: body.structuredTranscript2 || null,
      structuredTranscript3: body.structuredTranscript3 || null,
      isClosed: false,
    });

    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Parent grading — targeted update, never touches audio blobs
    if (body.parentScore1 !== undefined || body.parentFeedback !== undefined) {
      await updateParentGrading(
        Number(body.id),
        body.parentScore1 ?? 0,
        body.parentScore2 ?? 0,
        body.parentScore3 ?? 0,
        body.parentFeedback ?? ""
      );
      return NextResponse.json({ ok: true });
    }

    // Other targeted updates (close, etc.) — use existing history as base
    const existing = await getPracticeHistoryById(Number(body.id));
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated: PracticeHistory = { ...existing, ...body };
    const { updatePracticeHistory } = await import("@/lib/db");
    await updatePracticeHistory(updated);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deletePracticeHistoryById(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
