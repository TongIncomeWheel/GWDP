import type { OralExercise, PracticeHistory, PSLEEvaluationResult, StructuredTranscript } from "./types";

function tryParseStructuredTranscript(raw: string | null): StructuredTranscript | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StructuredTranscript;
  } catch {
    return null;
  }
}

function formatStructuredTranscriptForPrompt(st: StructuredTranscript, label: string): string {
  const lines: string[] = [];
  lines.push(`[${label} - ${st.framework} Breakdown]:`);
  if (st.point) lines.push(`  Point: ${st.point}`);
  if (st.evidence) lines.push(`  Evidence: ${st.evidence}`);
  if (st.explanation) lines.push(`  Explanation: ${st.explanation}`);
  if (st.link) lines.push(`  Link: ${st.link}`);
  lines.push(`  Overall Coherence: ${st.overallCoherence}`);
  if (st.vocabularyHighlights && st.vocabularyHighlights.length > 0) {
    lines.push(`  Vocabulary Highlights: ${st.vocabularyHighlights.join(", ")}`);
  }
  if (st.grammarNotes && st.grammarNotes.length > 0) {
    lines.push(`  Grammar Notes: ${st.grammarNotes.join("; ")}`);
  }
  return lines.join("\n");
}

function computeWordCoverage(passage: string, transcript: string): { coveragePercent: number; missingWords: string[]; addedWords: string[] } {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const passageWords = normalize(passage);
  const transcriptWords = normalize(transcript);

  const passageSet = new Map<string, number>();
  for (const w of passageWords) {
    passageSet.set(w, (passageSet.get(w) || 0) + 1);
  }

  const transcriptSet = new Map<string, number>();
  for (const w of transcriptWords) {
    transcriptSet.set(w, (transcriptSet.get(w) || 0) + 1);
  }

  let matchedCount = 0;
  const missing: string[] = [];
  for (const [word, count] of passageSet) {
    const tCount = transcriptSet.get(word) || 0;
    matchedCount += Math.min(count, tCount);
    if (tCount < count) {
      for (let i = 0; i < count - tCount; i++) missing.push(word);
    }
  }

  const added: string[] = [];
  for (const [word, count] of transcriptSet) {
    const pCount = passageSet.get(word) || 0;
    if (count > pCount) {
      for (let i = 0; i < count - pCount; i++) added.push(word);
    }
  }

  const coveragePercent = passageWords.length > 0 ? Math.round((matchedCount / passageWords.length) * 100) : 0;

  return { coveragePercent, missingWords: missing.slice(0, 20), addedWords: added.slice(0, 20) };
}

function buildReadingPrompt(history: PracticeHistory, exercise: OralExercise): string {
  const transcript = history.transcript1 || "";
  const hasTranscript = transcript && transcript !== "No speech recognized" && transcript.trim().length > 0;

  let coverageInfo = "";
  if (hasTranscript && exercise.passageText) {
    const { coveragePercent, missingWords, addedWords } = computeWordCoverage(exercise.passageText, transcript);
    coverageInfo = `
[Automated Word Coverage Analysis]:
- Words in passage: ${exercise.passageText.split(/\s+/).length}
- Words in transcript: ${transcript.split(/\s+/).length}
- Word coverage: ${coveragePercent}%
- Missing/skipped words (sample): ${missingWords.length > 0 ? missingWords.join(", ") : "none detected"}
- Added/substituted words (sample): ${addedWords.length > 0 ? addedWords.join(", ") : "none detected"}

IMPORTANT: If word coverage is below 70%, the student clearly did not read the full passage. Score MUST reflect this — a student who reads only half the passage cannot score above 4/10 on any criterion. If coverage is below 40%, scores should be 0-2/10.`;
  }

  return `
You are a strict, experienced PSLE English Oral examiner for Singapore primary schools. Your role is to evaluate a P6 student's Reading Aloud performance with accuracy and honesty. Do NOT inflate scores. A poor reading MUST receive a poor score.

[SEAB PSLE Reading Aloud Marking Rubric]:

CRITERION 1: Pronunciation & Articulation (0-10)
- Band 9-10 (Excellent): Near-native clarity, all words pronounced correctly including difficult vocabulary, clear consonant clusters, accurate vowel sounds
- Band 7-8 (Good): Most words pronounced correctly, minor errors on difficult words only, generally clear articulation
- Band 5-6 (Adequate): Several pronunciation errors, some words unclear or mispronounced, but meaning is still mostly conveyed
- Band 3-4 (Below Average): Frequent pronunciation errors, many words mispronounced or unclear, listener must guess at meaning
- Band 1-2 (Poor): Severe pronunciation issues throughout, most words unrecognizable or heavily accented, passage meaning lost
- Band 0 (No attempt): No speech or completely unintelligible

CRITERION 2: Rhythm, Fluency & Expressiveness (0-10)
- Band 9-10 (Excellent): Natural rhythm, appropriate pausing at punctuation, varied intonation matching meaning, expressive delivery
- Band 7-8 (Good): Generally fluent with minor hesitations, reasonable pausing, some expression
- Band 5-6 (Adequate): Noticeable hesitations/stumbles, mostly monotone but with some variation, basic pausing
- Band 3-4 (Below Average): Frequent pauses/restarts, choppy delivery, monotone throughout, rushed or painfully slow
- Band 1-2 (Poor): Extremely halting, constant stumbling, no expression or rhythm, sounds like word-by-word decoding
- Band 0 (No attempt): No speech or completely unreadable delivery

PUNCTUATION & DELIVERY EXPECTATIONS:
- COMMAS (,): Student should pause briefly (0.3-0.5s). No pause at a comma = fluency deduction.
- FULL STOPS (.): Student should pause longer (0.5-1s) and drop intonation. Running through full stops = major fluency deduction.
- QUESTION MARKS (?): Voice should rise at the end. Flat delivery of questions = expressiveness deduction.
- EXCLAMATION MARKS (!): Voice should show emphasis/excitement. Monotone delivery of exclamations = expressiveness deduction.
- DIALOGUE (quoted speech): Should sound distinctly different from narration — slightly different pitch or character voice. Reading dialogue flatly like narration = expressiveness deduction.
- ELLIPSIS (...): Should have a thoughtful, drawn-out pause.
- DASHES (— or -): Should have a brief, abrupt pause.

TONE & MOOD MATCHING:
- Identify the emotional tone of each paragraph/section (e.g., happy, sad, tense, reflective, urgent).
- The student's delivery should match the mood. Reading a tense scene cheerfully, or a happy scene flatly, is an expressiveness error.
- Narrative vs dialogue transitions should be clearly audible.

CRITICAL SCORING RULES:
1. COMPLETENESS: If the student did not read the ENTIRE passage, deduct heavily. Reading only part of the passage = maximum 4/10 on each criterion. Reading less than a third = maximum 2/10.
2. ACCURACY: Compare the transcript word-for-word against the passage. Every skipped, added, or mispronounced word counts against the score.
3. NO CHARITY SCORING: This is a serious examination tool. Parents rely on these scores to assess their child's readiness. Inflated scores are harmful and misleading.
4. DEFAULT TO LOWER BAND: When in doubt between two bands, choose the LOWER band. It is better to be strict than to give undeserved marks.
5. EMPTY/MINIMAL TRANSCRIPTS: If the transcript is empty, says "No speech recognized", or contains fewer than 10 words, ALL scores must be 0-1.
6. PACE: Natural conversational pace with variation. Too fast (rushing) or too slow (plodding) = fluency deduction. Target ~130-160 words per minute for P6 level.

[Syllabus Reading Passage]:
"${exercise.passageText}"

[Student's Speech Transcription]:
"${hasTranscript ? transcript : "[NO SPEECH DETECTED - student did not read or microphone failed]"}"
${coverageInfo}

${!hasTranscript ? "\nCRITICAL: No speech was detected. Both scores MUST be 0." : ""}

Evaluate strictly according to the rubric above. For EACH criterion, you must:
1. Pronunciation & Articulation (score1): List specific words mispronounced, skipped words, substituted words, and added words with corrections.
2. Rhythm, Fluency & Expressiveness (score2): Assess punctuation awareness (did they pause at commas/full stops? rise at questions?), tone matching (did delivery match the mood?), dialogue vs narration distinction, and pace appropriateness.
(set score3 to 0 — Reading Aloud has only 2 criteria)

Include specific strengths (with word-level examples from the transcript), specific areas for improvement (citing exact words that were mispronounced or skipped, AND specific punctuation/tone issues), and a model reading answer with stress marks (UPPERCASE), pauses (/), rising intonation (↑), and mood annotations [calm], [excited], [tense].

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10>,
  "score2": <number 0-10>,
  "score3": 0,
  "generalFeedback": "<string - be honest about performance level, mention completeness, pronunciation accuracy, and delivery quality>",
  "strengths": ["<string with specific examples>", ...],
  "areasOfImprovement": ["<string with specific examples including punctuation/tone issues>", ...],
  "suggestedResponse1": "<model reading with STRESS marks, / pauses, ↑ rising intonation, and [mood] annotations>",
  "suggestedResponse2": "",
  "suggestedResponse3": ""
}`.trim();
}

function buildSBCPrompt(history: PracticeHistory, exercise: OralExercise): string {
  const st1 = tryParseStructuredTranscript(history.structuredTranscript1);
  const st2 = tryParseStructuredTranscript(history.structuredTranscript2);
  const st3 = tryParseStructuredTranscript(history.structuredTranscript3);

  let structuredSection = "";
  if (st1 || st2 || st3) {
    structuredSection = "\n\n[Structured Transcript Analysis (pre-parsed PEEL/TREES framework)]:\n";
    if (st1) structuredSection += formatStructuredTranscriptForPrompt(st1, "Response 1") + "\n";
    if (st2) structuredSection += formatStructuredTranscriptForPrompt(st2, "Response 2") + "\n";
    if (st3) structuredSection += formatStructuredTranscriptForPrompt(st3, "Response 3") + "\n";
  }

  const q1Type = exercise.sbcQ1Type || "";
  const q2Type = exercise.sbcQ2Type || "";
  const q3Type = exercise.sbcQ3Type || "";

  let frameworkGuidance = "";
  if (q1Type || q2Type || q3Type) {
    frameworkGuidance = `
[SBC Question Types & Expected Frameworks]:
- Q1 Type: ${q1Type || "General"} ${q1Type === "personal" ? "(PEEL: Point, Evidence/Example, Explanation, Link)" : ""}
- Q2 Type: ${q2Type || "General"} ${q2Type === "opinion" ? "(TREES: Topic sentence, Reason, Evidence, Explanation, Summary)" : ""}
- Q3 Type: ${q3Type || "General"} ${q3Type === "suggestion" ? "(PEEL/TREES: structured argument with personal connection)" : ""}
`;
  }

  const hasT1 = !!history.transcript1 && history.transcript1 !== "No speech recognized" && history.transcript1.trim().length > 0;
  const hasT2 = !!history.transcript2 && history.transcript2 !== "No speech recognized" && history.transcript2.trim().length > 0;
  const hasT3 = !!history.transcript3 && history.transcript3 !== "No speech recognized" && history.transcript3.trim().length > 0;
  const answeredCount = [hasT1, hasT2, hasT3].filter(Boolean).length;

  return `
You are a strict, experienced PSLE English Oral examiner for Singapore primary schools. Your role is to evaluate a P6 student's Stimulus-Based Conversation (SBC) responses with accuracy and honesty. Do NOT inflate scores. A poor response MUST receive a poor score.

[SEAB PSLE SBC Marking Rubric]:

CRITERION 1: Personal Response & Content (0-10)
- Band 9-10 (Excellent): Directly addresses the question with a clear point, relevant personal examples, logical explanation, and a strong link back. Uses PEEL/TREES framework naturally. Shows deep engagement with the stimulus.
- Band 7-8 (Good): Addresses the question with a reasonable point and some supporting detail. Framework structure is present but may lack depth.
- Band 5-6 (Adequate): Partially addresses the question. Limited or generic examples. Weak structure — may state a point without proper support.
- Band 3-4 (Below Average): Vague or off-topic response. No clear structure. Examples are irrelevant or absent. Very short responses.
- Band 1-2 (Poor): Barely addresses the question. One or two words/sentences with no substance. No connection to the stimulus.
- Band 0 (No attempt): No response or completely irrelevant.

CRITERION 2: Clarity of Expression & Language (0-10)
- Band 9-10 (Excellent): Rich, varied vocabulary (e.g., "beneficial", "invigorating" instead of "good", "nice"). Accurate grammar. Sophisticated sentence structures.
- Band 7-8 (Good): Good vocabulary with some variety. Minor grammar errors. Generally well-constructed sentences.
- Band 5-6 (Adequate): Basic vocabulary ("good", "bad", "happy", "sad"). Some grammar errors. Simple sentence patterns.
- Band 3-4 (Below Average): Very limited vocabulary. Frequent grammar errors. Fragmented or incomplete sentences.
- Band 1-2 (Poor): Minimal language. Severe grammar issues. Cannot form coherent sentences.
- Band 0 (No attempt): No response.

CRITERION 3: Engagement & Conversational Quality (0-10)
- Band 9-10 (Excellent): Confident, fluent delivery. Natural elaboration. Cohesive thoughts with clear transitions. Feels like a genuine conversation.
- Band 7-8 (Good): Mostly fluent. Reasonable elaboration. Some transitions between ideas.
- Band 5-6 (Adequate): Some hesitation. Limited elaboration — answers are short but coherent. Few transitions.
- Band 3-4 (Below Average): Frequent hesitation. Very short responses. No elaboration. Disjointed.
- Band 1-2 (Poor): Extremely hesitant. One-word or incomplete answers. No engagement.
- Band 0 (No attempt): No response.

CRITICAL SCORING RULES:
1. SCORE EACH QUESTION INDEPENDENTLY: score1 = Q1 only, score2 = Q2 only, score3 = Q3 only. Each question is evaluated holistically across all 3 criteria (content, language, engagement) to produce ONE score for that question.
2. NO CROSS-QUESTION AVERAGING: A strong Q1 does NOT raise the score for a weak Q2. Each question stands alone.
3. NO CHARITY SCORING: Parents rely on accurate scores. Inflated scores are harmful and misleading.
4. DEFAULT TO LOWER BAND: When in doubt between two bands, choose the LOWER band.
5. EMPTY/MINIMAL RESPONSES: If a response is empty, says "No speech recognized", or has fewer than 5 words, that question's score MUST be 0.
6. VOCABULARY CHECK: If the student uses only basic words like "good", "bad", "nice", "fun", "happy", "sad" — that question CANNOT score above 5/10.
7. FRAMEWORK CHECK: If the student does NOT use any structured framework (no clear point, no evidence/example, no explanation) — that question CANNOT score above 5/10.

[Visual Poster Theme]: ${exercise.topic}
[Detailed Poster Layout & Content]:
"${exercise.posterDescription}"
${frameworkGuidance}
[Question 1]: "${exercise.question1}"
[Student's Response 1]: "${hasT1 ? history.transcript1 : "[NO RESPONSE - student did not answer]"}"

[Question 2]: "${exercise.question2}"
[Student's Response 2]: "${hasT2 ? history.transcript2 : "[NO RESPONSE - student did not answer]"}"

[Question 3]: "${exercise.question3}"
[Student's Response 3]: "${hasT3 ? history.transcript3 : "[NO RESPONSE - student did not answer]"}"
${structuredSection}
Questions answered: ${answeredCount}/3${answeredCount < 3 ? ` — INCOMPLETE. ${3 - answeredCount} question(s) unanswered. Unanswered questions MUST score 0.` : ""}

${structuredSection ? "Use the pre-parsed structured transcript analysis above to inform your evaluation per question." : ""}

Evaluate each question strictly and independently. score1, score2, score3 represent Q1, Q2, Q3 holistic scores (0-10 each). Total = score1 + score2 + score3 (max 30). Provide model answers for all 3 questions at AL1 grade using PEEL framework.

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10, Q1 holistic score>,
  "score2": <number 0-10, Q2 holistic score>,
  "score3": <number 0-10, Q3 holistic score>,
  "generalFeedback": "<string - overall performance summary across all 3 questions>",
  "strengths": ["<string with specific examples from transcripts>", ...],
  "areasOfImprovement": ["<string with specific examples per question>", ...],
  "suggestedResponse1": "<AL1 model answer for Q1 using PEEL>",
  "suggestedResponse2": "<AL1 model answer for Q2 using PEEL>",
  "suggestedResponse3": "<AL1 model answer for Q3 using PEEL>"
}`.trim();
}

function buildEvaluationPrompt(history: PracticeHistory, exercise: OralExercise): string {
  if (exercise.type === "READING") {
    return buildReadingPrompt(history, exercise);
  }
  return buildSBCPrompt(history, exercise);
}

async function fetchAudioPart(url: string): Promise<{ inline_data: { mime_type: string; data: string } } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type") || "audio/webm";
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { inline_data: { mime_type: mimeType, data } };
  } catch {
    return null;
  }
}

export async function evaluateWithGemini(
  history: PracticeHistory,
  exercise: OralExercise,
  apiKey: string
): Promise<PSLEEvaluationResult> {
  const prompt = buildEvaluationPrompt(history, exercise);

  // When transcripts are empty (e.g. Android SpeechRecognition failure), include
  // the actual audio files so Gemini can evaluate from audio directly.
  const needsAudio =
    !history.transcript1?.trim() ||
    (exercise.type === "STIMULUS" && (!history.transcript2?.trim() || !history.transcript3?.trim()));

  const parts: object[] = [{ text: prompt }];

  if (needsAudio) {
    const audioPaths = [history.audioPath1, history.audioPath2, history.audioPath3].filter(Boolean) as string[];
    for (const audioPath of audioPaths) {
      const audioPart = await fetchAudioPart(audioPath);
      if (audioPart) parts.push(audioPart);
    }
    if (parts.length > 1) {
      // Prepend an instruction so Gemini knows to listen to the audio
      parts.unshift({ text: "Audio recordings are attached below. The transcript may be empty or incomplete — evaluate based on what you hear in the audio." });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
  const result = JSON.parse(cleaned) as PSLEEvaluationResult;

  result.score1 = Math.max(0, Math.min(10, Math.round(result.score1)));
  result.score2 = Math.max(0, Math.min(10, Math.round(result.score2)));
  result.score3 = Math.max(0, Math.min(10, Math.round(result.score3)));

  return result;
}
