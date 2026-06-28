import { NextRequest, NextResponse } from "next/server";
import { getPracticeHistoryById, getExerciseById, updateEvaluationResult, setEvaluating, getEffectiveApiKey, getAllSettings } from "@/lib/db";
import { evaluateWithGemini } from "@/lib/gemini";

async function triggerCompletionNotification(historyId: number) {
  const settings = await getAllSettings();
  if (settings.notificationEmail && settings.emailOnCompletion) {
    const history = await getPracticeHistoryById(historyId);
    const exercise = history?.exerciseTitle || "an exercise";
    const score = history ? `${history.totalScore}/${history.maxScore}` : "N/A";
    console.log(`[NOTIFY] To: ${settings.notificationEmail}`);
    console.log(`[NOTIFY] ${settings.childName || "Your child"} completed "${exercise}" - Score: ${score}`);
  }
}

export async function POST(request: NextRequest) {
  const { historyId } = await request.json();

  const history = await getPracticeHistoryById(historyId);
  if (!history) {
    return NextResponse.json({ error: "Practice history not found" }, { status: 404 });
  }

  await setEvaluating(historyId, true, null);

  const exercise = await getExerciseById(history.exerciseId);
  if (!exercise) {
    await setEvaluating(historyId, false, "Corresponding exercise not found.");
    return NextResponse.json({ ...history, isEvaluating: false, errorMessage: "Corresponding exercise not found." });
  }

  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    const errorMessage = "Gemini API key is required for evaluation. Please configure your API key in Parent > Settings before submitting practice sessions.";
    await setEvaluating(historyId, false, errorMessage);
    return NextResponse.json({ ...history, isEvaluating: false, isEvaluated: false, errorMessage }, { status: 503 });
  }

  try {
    const result = await evaluateWithGemini(history, exercise, apiKey);

    const score1 = Math.max(0, Math.min(10, result.score1));
    const score2 = Math.max(0, Math.min(10, result.score2));
    const score3 = exercise.type === "STIMULUS" ? Math.max(0, Math.min(10, result.score3)) : 0;
    const totalScore = score1 + score2 + score3;
    const maxScore = exercise.type === "READING" ? 20 : 30;

    const evalFields = {
      score1, score2, score3, totalScore, maxScore,
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
    await updateEvaluationResult(historyId, evalFields);
    await triggerCompletionNotification(historyId);
    return NextResponse.json({ ...history, ...evalFields });
  } catch (e) {
    const errorMessage = `Evaluation failed: ${(e as Error).message}. Please check your Gemini API key in Settings and try again.`;
    const errorFields = {
      score1: 0, score2: 0, score3: 0, totalScore: 0,
      maxScore: exercise.type === "READING" ? 20 : 30,
      generalFeedback: null, strengths: null, areasOfImprovement: null,
      modelAnswer1: null, modelAnswer2: null, modelAnswer3: null,
      isEvaluated: false, isEvaluating: false, errorMessage,
    };
    await updateEvaluationResult(historyId, errorFields);
    return NextResponse.json({ ...history, ...errorFields }, { status: 502 });
  }
}
