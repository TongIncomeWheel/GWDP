import type { OralExercise, PracticeHistory, PSLEEvaluationResult } from "./types";

function buildEvaluationPrompt(history: PracticeHistory, exercise: OralExercise): string {
  if (exercise.type === "READING") {
    return `
Evaluate the student's Reading Aloud practice.

[Syllabus Reading Passage]:
"${exercise.passageText}"

[Student's Speech Transcription]:
"${history.transcript1 || "[No voice transcribed]"}"

Evaluate how closely they read the passage. Look for:
- Pronunciation of tricky words.
- Fluency, punctuation pauses, and dramatic expression.
- Missing or added words compared to the original passage.

Provide scores out of 10 for:
1. Pronunciation & Articulation
2. Rhythm, Fluency & Expressiveness
(set score3 to 0).

Include strengths, areas for improvement, and a suggested reading model answer indicating which words to stress and where to pause (e.g. use slash '/' for pauses and UPPERCASE for stressed words).

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10>,
  "score2": <number 0-10>,
  "score3": 0,
  "generalFeedback": "<string>",
  "strengths": ["<string>", ...],
  "areasOfImprovement": ["<string>", ...],
  "suggestedResponse1": "<model reading with stress marks and pauses>",
  "suggestedResponse2": "",
  "suggestedResponse3": ""
}`.trim();
  }

  return `
Evaluate the student's Stimulus-Based Conversation practice.

[Visual Poster Theme]: ${exercise.topic}
[Detailed Poster Layout & Content]:
"${exercise.posterDescription}"

[Question 1]: "${exercise.question1}"
[Student's SBC Response 1]: "${history.transcript1 || "[No answer]"}"

[Question 2]: "${exercise.question2}"
[Student's SBC Response 2]: "${history.transcript2 || "[No answer]"}"

[Question 3]: "${exercise.question3}"
[Student's SBC Response 3]: "${history.transcript3 || "[No answer]"}"

Evaluate their responses under Singapore PSLE criteria:
1. Personal Response (10m) - Did they address the prompts directly with clear PEEL structure (Point, Explanation, Example, Link)?
2. Clarity of Expression (10m) - Did they use good vocabulary (e.g., instead of 'good' or 'nice', did they use words like 'vibrant', 'educational', 'beneficial') and accurate grammar?
3. Engagement in Conversation (10m) - Cohesion of thoughts, confidence, and fluency.

Provide detailed feedback, list specific vocabulary improvements, and provide model answers for Question 1, 2, and 3 that would secure an A* (AL1) grade.

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10>,
  "score2": <number 0-10>,
  "score3": <number 0-10>,
  "generalFeedback": "<string>",
  "strengths": ["<string>", ...],
  "areasOfImprovement": ["<string>", ...],
  "suggestedResponse1": "<model answer for Q1>",
  "suggestedResponse2": "<model answer for Q2>",
  "suggestedResponse3": "<model answer for Q3>"
}`.trim();
}

export async function evaluateWithGemini(
  history: PracticeHistory,
  exercise: OralExercise,
  apiKey: string
): Promise<PSLEEvaluationResult> {
  const prompt = buildEvaluationPrompt(history, exercise);

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error("Empty response from Gemini");

  const cleaned = textContent.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as PSLEEvaluationResult;
}

export function generateMockEvaluation(
  history: PracticeHistory,
  exercise: OralExercise
): PSLEEvaluationResult {
  const hasSpeech1 = !!history.transcript1 && history.transcript1 !== "No speech recognized";
  const hasSpeech2 = !!history.transcript2 && history.transcript2 !== "No speech recognized";
  const hasSpeech3 = !!history.transcript3 && history.transcript3 !== "No speech recognized";

  if (exercise.type === "READING") {
    return {
      score1: hasSpeech1 ? 8 : 5,
      score2: hasSpeech1 ? 7 : 4,
      score3: 0,
      generalFeedback:
        "Good effort! You read with clear, steady pacing and demonstrated solid pronunciation on key adjectives like 'miniature'. To improve your score further, try to elevate your expression in the narrative sections to reflect the suspense!",
      strengths: [
        "Clear articulation of final consonant sounds (e.g., 'leaped', 'starry').",
        "Steady, moderate reading pace that allows the listener to digest the text.",
        "Natural pausing at periods and full stops.",
      ],
      areasOfImprovement: [
        "Stress expressive verbs like 'FROZE' and 'HAMMERING' to build dramatic tension.",
        "Ensure word endings like 's' in 'sparks' are fully articulated.",
        "Practice keeping your voice up at commas to maintain listener engagement.",
      ],
      suggestedResponse1:
        "The CRACKLE of the campfire / was the ONLY sound that broke the silence of the night. Sparks LEAPED up / into the starry sky / like MINIATURE shooting stars. Sitting CLOSELY in a circle, / we wrapped our blankets TIGHTLY / around our shoulders to keep out the chilly mountain air.",
      suggestedResponse2: "",
      suggestedResponse3: "",
    };
  }

  return {
    score1: hasSpeech1 ? 8 : 4,
    score2: hasSpeech2 ? 8 : 4,
    score3: hasSpeech3 ? 7 : 3,
    generalFeedback:
      "Well done! You expressed your thoughts in a clear, structured manner and engaged well with the poster's contents. Work on incorporating higher-level vocabulary and more elaborate personal anecdotes.",
    strengths: [
      "Excellent structure: used Point-Explanation-Example-Link (PEEL) to organize SBC responses.",
      "Direct connection to visual details on the poster.",
      "Fluent, audible tone with minimal hesitations.",
    ],
    areasOfImprovement: [
      "Replace basic vocabulary like 'good' and 'happy' with premium vocabulary such as 'extremely beneficial', 'invigorating', or 'vibrant'.",
      "Elaborate more on your personal experiences, such as describing a specific school sports event.",
      "Focus on subject-verb agreement (e.g. 'everyone has' instead of 'everyone have').",
    ],
    suggestedResponse1:
      "Personally, I would definitely participate in the Wellness Week activities. Firstly, the step tracking challenge is highly appealing because it is interactive. It would motivate me to stay active with my friends. For instance, we could organize brisk walking sessions during recess to hit the 10,000 steps target together. Furthermore, receiving a beautiful, reusable dynamic water bottle is a wonderful incentive that promotes both fitness and environmental sustainability. Therefore, I believe this is an excellent campaign that I would fully support.",
    suggestedResponse2:
      "To maintain a healthy lifestyle, I adopt a two-pronged approach. Firstly, in school, I prioritize balanced nutrition. I make it a habit to purchase sliced fruit from the fruit stall during recess and stay well-hydrated by drinking at least two liters of plain water. Secondly, at home, I engage in regular physical activity. Every Tuesday and Thursday evening, my father and I cycle around the neighborhood park connector.",
    suggestedResponse3:
      "In my opinion, canteens should avoid outright bans and instead focus on education and moderation. Banning foods entirely can lead to a 'rebellion effect' where students crave fried items and purchase them outside school premises. A better alternative is the traffic-light system, where healthier options are cheaper and fried items are only sold once a week.",
  };
}
