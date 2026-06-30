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

    const blob1: string | null = body.audioBlob1 || null;
    const blob2: string | null = body.audioBlob2 || null;
    const blob3: string | null = body.audioBlob3 || null;
    const totalBlobBytes = (blob1?.length ?? 0) + (blob2?.length ?? 0) + (blob3?.length ?? 0);
    if (totalBlobBytes > 800_000) {
      return NextResponse.json(
        { error: "Audio recordings are too large to store (limit ~600 KB). Please re-record with shorter responses." },
        { status: 413 }
      );
    }

    const id = await insertPracticeHistory({
      exerciseId: body.exerciseId,
      exerciseTitle: body.exerciseTitle || "",
      exerciseType: body.exerciseType || "READING",
      exerciseTopic: body.exerciseTopic || "",
      dateMillis: Date.now(),
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
      audioBlob1: blob1,
      audioBlob2: blob2,
      audioBlob3: blob3,
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
