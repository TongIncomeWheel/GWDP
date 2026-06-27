import { NextRequest, NextResponse } from "next/server";
import { getPracticeHistoryById, getExerciseById, updatePracticeHistory, getEffectiveApiKey, getAllSettings } from "@/lib/db";
import { evaluateWithGemini } from "@/lib/gemini";

async function triggerCompletionNotification(historyId: number) {
  const settings = await getAllSettings();
  if (settings.notificationEmail && settings.emailOnCompletion) {
    console.log(`[NOTIFY] Triggering completion notification for session ${historyId}`);
    const { notificationEmail, childName } = settings;
    const history = await getPracticeHistoryById(historyId);
    const exercise = history?.exerciseTitle || "an exercise";
    const score = history ? `${history.totalScore}/${history.maxScore}` : "N/A";
    console.log(`[NOTIFY] To: ${notificationEmail}`);
    console.log(`[NOTIFY] ${childName || "Your child"} completed "${exercise}" - Score: ${score}`);
  }
}

export async function POST(request: NextRequest) {
  const { historyId } = await request.json();

  const history = await getPracticeHistoryById(historyId);
  if (!history) {
    return NextResponse.json({ error: "Practice history not found" }, { status: 404 });
  }

  await updatePracticeHistory({ ...history, isEvaluating: true, errorMessage: null });

  const exercise = await getExerciseById(history.exerciseId);
  if (!exercise) {
    const errorState = { ...history, isEvaluating: false, errorMessage: "Corresponding exercise not found." };
    await updatePracticeHistory(errorState);
    return NextResponse.json(errorState);
  }

  const apiKey = await getEffectiveApiKey();

  if (!apiKey) {
    const errorState = {
      ...history,
      score1: 0,
      score2: 0,
      score3: 0,
      totalScore: 0,
      maxScore: exercise.type === "READING" ? 20 : 30,
      generalFeedback: null,
      strengths: null,
      areasOfImprovement: null,
      modelAnswer1: null,
      modelAnswer2: null,
      modelAnswer3: null,
      isEvaluated: false,
      isEvaluating: false,
      errorMessage: "Gemini API key is required for evaluation. Please configure your API key in Parent > Settings before submitting practice sessions.",
    };
    await updatePracticeHistory(errorState);
    return NextResponse.json(errorState, { status: 503 });
  }

  try {
    const result = await evaluateWithGemini(history, exercise, apiKey);

    const finalScore1 = Math.max(0, Math.min(10, result.score1));
    const finalScore2 = Math.max(0, Math.min(10, result.score2));
    const finalScore3 = exercise.type === "STIMULUS" ? Math.max(0, Math.min(10, result.score3)) : 0;
    const total = finalScore1 + finalScore2 + finalScore3;
    const max = exercise.type === "READING" ? 20 : 30;

    const evaluated = {
      ...history,
      score1: finalScore1,
      score2: finalScore2,
      score3: finalScore3,
      totalScore: total,
      maxScore: max,
      generalFeedback: result.generalFeedback,
      strengths: result.strengths.join("\n"),
      areasOfImprovement: result.areasOfImprovement.join("\n"),
      modelAnswer1: result.suggestedResponse1,
      modelAnswer2: result.suggestedResponse2,
      modelAnswer3: result.suggestedResponse3,
      isEvaluated: true,
      isEvaluating: false,
      errorMessage: null,
    };
    await updatePracticeHistory(evaluated);
    await triggerCompletionNotification(historyId);
    return NextResponse.json(evaluated);
  } catch (e) {
    const errorState = {
      ...history,
      score1: 0,
      score2: 0,
      score3: 0,
      totalScore: 0,
      maxScore: exercise.type === "READING" ? 20 : 30,
      generalFeedback: null,
      strengths: null,
      areasOfImprovement: null,
      modelAnswer1: null,
      modelAnswer2: null,
      modelAnswer3: null,
      isEvaluated: false,
      isEvaluating: false,
      errorMessage: `Evaluation failed: ${(e as Error).message}. Please check your Gemini API key in Settings and try again.`,
    };
    await updatePracticeHistory(errorState);
    return NextResponse.json(errorState, { status: 502 });
  }
}
