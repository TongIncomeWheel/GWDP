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
You are an experienced PSLE English Oral examiner for Singapore primary schools, calibrated to the MOE/SEAB standard. You are assessing P6 students who speak Singapore Standard English (SSE), which has its own legitimate phonological and prosodic features — do NOT penalise students for speaking in the Singapore accent or with Singapore intonation patterns.

SINGAPORE ENGLISH CONTEXT (apply throughout your assessment):
- Singapore English naturally has flatter intonation than British or American English. This is NORMAL and should NOT be marked as "monotone" unless the student reads with zero variation at all and sounds robotic.
- Singapore English vowels and consonants differ from RP (e.g., final consonant reduction, different /æ/ and /ɛ/ realisation). These are features of SSE, NOT errors.
- Do NOT penalise for a Singapore accent. Penalise only when words are genuinely unclear or unrecognisable to a Singaporean listener.
- Benchmark: compare to what an MOE-trained PSLE examiner in Singapore would accept, not to a British or American standard.

[SEAB PSLE Reading Aloud Marking Rubric]:

CRITERION 1: Pronunciation & Articulation (0-10)
- Band 8-10 (Good to Excellent): Words are clear and recognisable to a Singaporean listener. Difficult vocabulary handled well. Minor SSE-accent features are acceptable and not penalised.
- Band 6-7 (Competent): Most words clear and recognisable. Some errors on genuinely difficult words. SSE features present — do not deduct for these.
- Band 4-5 (Adequate): Several words mispronounced in ways that impede understanding, or word substitutions that change meaning. Listener has to work to follow.
- Band 2-3 (Below Average): Frequent errors that make the passage hard to follow even for a Singaporean listener. Many words garbled or unrecognisable.
- Band 0-1 (Poor/No attempt): Mostly unintelligible or no speech.

CRITERION 2: Rhythm, Fluency & Expressiveness (0-10)
- Band 8-10 (Good to Excellent): Reads smoothly with appropriate pausing at major punctuation. Some variation in pace and pitch — does not need to be dramatic. Singaporean delivery style with controlled expression is perfectly acceptable at this band.
- Band 6-7 (Competent): Generally fluent. Pauses reasonably at sentence boundaries. Some hesitations but recovers well. Delivery is controlled even if not highly expressive — this is fine for Band 6-7.
- Band 4-5 (Adequate): Noticeable stumbles or long unnatural pauses. Limited punctuation awareness but some present. Very flat delivery with minimal variation in speed or pitch.
- Band 2-3 (Below Average): Choppy, word-by-word reading. Almost no punctuation awareness. Delivery sounds like decoding rather than reading.
- Band 0-1 (Poor/No attempt): Extremely halting or no attempt.

DELIVERY ASSESSMENT — FROM AUDIO ONLY:
The transcript is machine-generated and has NO punctuation. Do NOT penalise for missing punctuation in the transcript. Judge all delivery from what you HEAR in the audio recording:
- PAUSING: Does the student pause at sentence boundaries and major commas? (Does not need to be perfectly timed — natural-feeling pauses count.)
- INTONATION: Is there any variation at all? Even slight pitch changes at questions or emphasis count positively.
- MOOD: Is the delivery controlled and purposeful, even if understated? Singaporean students do not need to perform dramatically to score well.
- PACE: Comfortable and readable, approximately 110-160 wpm for P6. Slightly fast or slow is fine; only penalise if it seriously affects intelligibility.

CRITICAL SCORING RULES:
1. AUDIO IS PRIMARY FOR DELIVERY: Listen to the actual audio. Do not infer delivery quality from the transcript text.
2. SINGAPORE STANDARD: A Singaporean P6 student who reads the full passage clearly, with reasonable pacing and some punctuation awareness, should score 7-8/10 on each criterion. Reserve 9-10 for notably expressive or exceptionally accurate delivery. Do not require a Western accent or dramatic intonation for high scores.
3. COMPLETENESS: If the student did not read the ENTIRE passage, deduct heavily. Reading only part = maximum 4/10 on each criterion. Reading less than a third = maximum 2/10.
4. ACCURACY: Compare transcript against passage for word coverage, but verify with the audio — the speech-to-text may have minor errors.
5. EMPTY/MINIMAL TRANSCRIPTS: If transcript is empty but audio is provided, evaluate entirely from audio. Only score 0 if the student genuinely did not speak.
6. DO NOT over-penalise SSE features: flat-ish intonation, Singapore vowel quality, and light final consonants are characteristics of the local accent — they are NOT pronunciation errors.

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

Include specific strengths (with examples from the transcript and audio), specific areas for improvement (citing exact words or delivery issues), and a model reading answer with stress marks (UPPERCASE), pauses (/), rising intonation (↑), and mood annotations [calm], [excited], [tense].

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
You are an experienced PSLE English Oral examiner for Singapore primary schools, calibrated to the MOE/SEAB standard. You are assessing P6 students who speak Singapore Standard English (SSE). Do NOT apply British or American English norms for pronunciation, intonation, or conversational style.

SINGAPORE ENGLISH CONTEXT (apply throughout):
- Singapore English has characteristically flatter intonation than Western English. A controlled, even delivery is NORMAL for Singaporean students and must NOT be marked as "monotone" or "lacking expression" unless the student is truly robotic with zero variation.
- Singapore English grammar patterns (e.g., dropping articles, light final consonants, different vowel quality) are features of SSE. Only penalise if they make the student genuinely hard to understand.
- Do NOT penalise for a Singapore accent. Benchmark against what a Singaporean PSLE examiner would accept.
- A P6 Singapore student who answers clearly, gives a relevant example, and speaks fluently in SSE should score 6-8/10. Reserve 9-10 for genuinely rich, well-structured, impressive responses.

[SEAB PSLE SBC Marking Rubric]:

CRITERION 1: Personal Response & Content (0-10)
- Band 8-10 (Good to Excellent): Directly addresses the question with a clear point and at least one relevant example or personal experience. Some structure evident (point + reason/example + elaboration). Shows genuine engagement with the stimulus topic.
- Band 6-7 (Competent): Addresses the question with a reasonable answer and some supporting detail. May lack full PEEL structure but the response makes sense and is on-topic.
- Band 4-5 (Adequate): Partially addresses the question. Very generic or minimal examples. States an opinion but little or no support.
- Band 2-3 (Below Average): Vague or off-topic. Almost no substance. One or two sentences with no real engagement.
- Band 0-1 (Poor/No attempt): Does not answer, or completely irrelevant.

CRITERION 2: Clarity of Expression & Language (0-10)
- Band 8-10 (Good to Excellent): Vocabulary is appropriate and varied — uses words beyond "good/bad/nice/happy". Grammar is generally accurate. Sentences are complete and well-constructed. Some more ambitious vocabulary earns the higher end.
- Band 6-7 (Competent): Reasonable vocabulary with some variety. Minor grammar errors that do not impede understanding. Sentences are mostly complete. SSE-influenced grammar is acceptable here.
- Band 4-5 (Adequate): Mostly basic vocabulary. Some grammar errors but meaning is still clear. Simple or repetitive sentence patterns.
- Band 2-3 (Below Average): Very limited vocabulary. Frequent grammar errors that affect clarity. Fragmented sentences.
- Band 0-1 (Poor/No attempt): No response or incoherent.

CRITERION 3: Engagement & Conversational Quality (0-10)
- Band 8-10 (Good to Excellent): Speaks fluently and confidently. Elaborates beyond the bare minimum. Response feels like a real conversational answer, not a rehearsed one-liner. Controlled SSE delivery counts positively — dramatic expression is NOT required.
- Band 6-7 (Competent): Mostly fluent with minor hesitation. Gives some elaboration. Delivery is steady even if not highly animated — this is fine for Band 6-7.
- Band 4-5 (Adequate): Some hesitation or filler words. Limited elaboration — gives the point but not much more.
- Band 2-3 (Below Average): Frequent hesitation. Very short answer with no attempt to elaborate.
- Band 0-1 (Poor/No attempt): No response or extremely halting/incoherent.

CRITICAL SCORING RULES:
1. AUDIO IS PRIMARY FOR DELIVERY: Listen to the actual audio recordings. Score engagement, fluency, and delivery from what you HEAR. The audio captures confidence and pacing that the transcript cannot show.
2. SCORE EACH QUESTION INDEPENDENTLY: score1 = Q1 holistic, score2 = Q2 holistic, score3 = Q3 holistic (each 0-10, combining all 3 criteria). A strong Q1 does NOT raise a weak Q2.
3. SINGAPORE STANDARD CALIBRATION: A student who gives a clear, relevant answer with at least one example and speaks fluently (in SSE) should land at 6-8/10 per question. Do NOT require Western intonation, dramatic delivery, or formal RP pronunciation for high scores.
4. MINIMUM RESPONSE FLOOR: If a response is fewer than ~15 words, it is too brief to score above 4/10 regardless of content. If the audio is also silent, score MUST be 0.
5. VOCABULARY CHECK: If every answer uses only the most basic words (good, bad, nice) with zero variation, cap language score component at 5/10. Some variety is needed for 6+.
6. FRAMEWORK CHECK: No structure at all (no point, no reason, no example) = cap content component at 5/10. Even a simple "I think X because Y" counts as structure.

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

function blobToAudioPart(dataUrl: string): { inline_data: { mime_type: string; data: string } } | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) return null;
    const meta = dataUrl.slice(5, comma); // strip "data:"
    const mimeType = meta.split(";")[0] || "audio/webm";
    const data = dataUrl.slice(comma + 1);
    return { inline_data: { mime_type: mimeType, data } };
  } catch {
    return null;
  }
}

export async function evaluateWithGemini(
  history: PracticeHistory,
  exercise: OralExercise,
  apiKey: string,
  audioBlobs: (string | null)[] = []
): Promise<PSLEEvaluationResult> {
  const prompt = buildEvaluationPrompt(history, exercise);

  // Convert base64 audio blobs to Gemini inline_data parts.
  // Audio is the primary source for delivery assessment (rhythm, pronunciation,
  // fluency, expression). Transcript is used for content/word accuracy only.
  const audioParts = audioBlobs
    .filter((b): b is string => !!b)
    .map((b) => blobToAudioPart(b))
    .filter((p): p is { inline_data: { mime_type: string; data: string } } => p !== null);

  const parts: object[] = [];
  if (audioParts.length > 0) {
    parts.push({ text: "The student's audio recordings are attached below. LISTEN to the audio to assess all delivery criteria: pronunciation, rhythm, fluency, pace, pausing, and expression. Do NOT infer delivery from the transcript — the transcript is for content and word accuracy only." });
    parts.push(...audioParts);
  }
  parts.push({ text: prompt });

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
