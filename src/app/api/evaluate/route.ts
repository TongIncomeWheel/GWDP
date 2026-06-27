import { NextRequest, NextResponse } from "next/server";
import { getPracticeHistoryById, getExerciseById, updatePracticeHistory, getEffectiveApiKey, getAllSettings } from "@/lib/db";
import { evaluateWithGemini, generateMockEvaluation } from "@/lib/gemini";

function triggerCompletionNotification(historyId: number) {
  const settings = getAllSettings();
  if (settings.notificationEmail && settings.emailOnCompletion) {
    console.log(`[NOTIFY] Triggering completion notification for session ${historyId}`);
    const { notificationEmail, childName } = settings;
    const history = getPracticeHistoryById(historyId);
    const exercise = history?.exerciseTitle || "an exercise";
    const score = history ? `${history.totalScore}/${history.maxScore}` : "N/A";
    console.log(`[NOTIFY] To: ${notificationEmail}`);
    console.log(`[NOTIFY] ${childName || "Your child"} completed "${exercise}" - Score: ${score}`);
  }
}

export async function POST(request: NextRequest) {
  const { historyId } = await request.json();

  const history = getPracticeHistoryById(historyId);
  if (!history) {
    return NextResponse.json({ error: "Practice history not found" }, { status: 404 });
  }

  updatePracticeHistory({ ...history, isEvaluating: true, errorMessage: null });

  const exercise = getExerciseById(history.exerciseId);
  if (!exercise) {
    const errorState = { ...history, isEvaluating: false, errorMessage: "Corresponding exercise not found." };
    updatePracticeHistory(errorState);
    return NextResponse.json(errorState);
  }

  const apiKey = getEffectiveApiKey();

  if (!apiKey) {
    const result = generateMockEvaluation(history, exercise);
    const total = result.score1 + result.score2 + result.score3;
    const max = exercise.type === "READING" ? 20 : 30;
    const evaluated = {
      ...history,
      score1: result.score1,
      score2: result.score2,
      score3: result.score3,
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
      errorMessage: "No API key configured. Showing simulated assessment for practice purposes.",
    };
    updatePracticeHistory(evaluated);
    return NextResponse.json(evaluated);
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
    updatePracticeHistory(evaluated);
    triggerCompletionNotification(historyId);
    return NextResponse.json(evaluated);
  } catch (e) {
    const result = generateMockEvaluation(history, exercise);
    const total = result.score1 + result.score2 + result.score3;
    const max = exercise.type === "READING" ? 20 : 30;
    const fallback = {
      ...history,
      score1: result.score1,
      score2: result.score2,
      score3: result.score3,
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
      errorMessage: `Network issue occurred. Showing simulated assessment. (${(e as Error).message})`,
    };
    updatePracticeHistory(fallback);
    return NextResponse.json(fallback);
  }
}
