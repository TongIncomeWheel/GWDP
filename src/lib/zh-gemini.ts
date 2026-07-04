import type { OralExercise, PracticeHistory, PSLEEvaluationResult } from "./types";

function computeChineseCharCoverage(passage: string, transcript: string): { coveragePercent: number; missingChars: string[]; addedChars: string[] } {
  // Tokenise by individual Chinese characters (CJK block U+4E00–U+9FFF)
  // plus any ASCII words, treating each character/word as a token.
  const toTokens = (s: string): string[] =>
    Array.from(s)
      .filter((c) => /[一-鿿㐀-䶿\u{20000}-\u{2a6df}a-zA-Z0-9]/u.test(c))
      .map((c) => c.toLowerCase());

  const passageTokens = toTokens(passage);
  const transcriptTokens = toTokens(transcript);

  const passageMap = new Map<string, number>();
  for (const t of passageTokens) passageMap.set(t, (passageMap.get(t) || 0) + 1);

  const transcriptMap = new Map<string, number>();
  for (const t of transcriptTokens) transcriptMap.set(t, (transcriptMap.get(t) || 0) + 1);

  let matched = 0;
  const missing: string[] = [];
  for (const [ch, count] of passageMap) {
    const tCount = transcriptMap.get(ch) || 0;
    matched += Math.min(count, tCount);
    if (tCount < count) {
      for (let i = 0; i < count - tCount; i++) missing.push(ch);
    }
  }

  const added: string[] = [];
  for (const [ch, count] of transcriptMap) {
    const pCount = passageMap.get(ch) || 0;
    if (count > pCount) {
      for (let i = 0; i < count - pCount; i++) added.push(ch);
    }
  }

  const coveragePercent = passageTokens.length > 0 ? Math.round((matched / passageTokens.length) * 100) : 0;
  return { coveragePercent, missingChars: missing.slice(0, 30), addedChars: added.slice(0, 20) };
}

function buildZhReadingPrompt(history: PracticeHistory, exercise: OralExercise): string {
  const transcript = history.transcript1 || "";
  const hasTranscript = transcript && transcript !== "No speech recognized" && transcript.trim().length > 0;

  let coverageInfo = "";
  if (hasTranscript && exercise.passageText) {
    const { coveragePercent, missingChars, addedChars } = computeChineseCharCoverage(exercise.passageText, transcript);
    coverageInfo = `
[自动字符覆盖率分析 / Automated Character Coverage Analysis]:
- 课文字数 / Passage characters: ${Array.from(exercise.passageText).filter((c) => /[一-鿿]/.test(c)).length}
- 转录字数 / Transcript characters: ${Array.from(transcript).filter((c) => /[一-鿿]/.test(c)).length}
- 字符覆盖率 / Character coverage: ${coveragePercent}%
- 漏读/跳读字符样本 / Missing chars (sample): ${missingChars.length > 0 ? missingChars.join("、") : "none detected"}
- 增读/替换字符样本 / Added chars (sample): ${addedChars.length > 0 ? addedChars.join("、") : "none detected"}

IMPORTANT: If character coverage is below 70%, the student clearly did not read the full passage. Score MUST reflect this — a student who reads only half the passage cannot score above 4/10 on any criterion. If coverage is below 40%, scores should be 0-2/10.`;
  }

  return `
You are an experienced PSLE Chinese (Mother Tongue) Oral examiner for Singapore primary schools, calibrated to the MOE/SEAB standard for Higher Chinese and Chinese (B). You are assessing P6 students whose mother tongue is Mandarin Chinese (普通话), not Cantonese or Hokkien.

SINGAPORE CHINESE CONTEXT (apply throughout your assessment):
- The standard is Singapore Standard Mandarin (普通话), NOT Cantonese (广东话) or Hokkien (闽南语).
- A mild Singapore Mandarin accent is completely acceptable and MUST NOT be penalised. Only deduct when a character's pronunciation is clearly wrong or ambiguous to a Singaporean Mandarin listener.
- Tones (声调) ARE important in Mandarin. Consistent tone errors on common characters should be noted, but isolated tone errors on difficult characters are acceptable at the competent band.
- Erhua (儿化音) and Beijing-specific features are NOT required — Singapore students do not use these and must NOT be penalised for their absence.
- Benchmark: compare to what an MOE-trained PSLE Chinese examiner in Singapore would accept.

[SEAB PSLE 华文朗读评分标准 / Chinese Reading Aloud Marking Rubric]:

评分标准一 / CRITERION 1: 发音与咬字 (Pronunciation & Articulation) 0-10
- 声调准确（四声 + 轻声）
- 声母、韵母正确
- 字音清晰，不含糊
- Band 8-10（好至优秀）: 发音准确流利，声调正确，吐字清晰。偶有轻微新加坡口音不扣分。
- Band 6-7（良好）: 大部分发音正确，偶有声调错误或难字读错，不影响整体理解。
- Band 4-5（及格）: 多处发音不准或声调错误，影响部分理解，听者需多加注意。
- Band 2-3（待提高）: 频繁读错，很难听懂，字音混乱。
- Band 0-1（差/未作答）: 几乎没有发音或完全无法理解。

评分标准二 / CRITERION 2: 朗读流利度与表达 (Fluency & Expression) 0-10
- 节奏流畅，停顿自然（在句末、逗号处有合理停顿）
- 语速适中（不过快或过慢）
- 语调有变化，有感情表达（即使新加坡式平稳朗读也可接受）
- Band 8-10（好至优秀）: 流利自然，有感情，节奏好，停顿合理。新加坡式平稳朗读加上适当停顿即可达到此级。
- Band 6-7（良好）: 基本流利，偶有停顿，有基本表达，句子边界停顿合理。
- Band 4-5（及格）: 较多停顿，表达平淡，对标点符号的处理有限。
- Band 2-3（待提高）: 断断续续，一字一顿，几乎没有标点符号意识。
- Band 0-1（差/未作答）: 极不流利或不尝试。

DELIVERY ASSESSMENT — FROM AUDIO ONLY:
The transcript is machine-generated and may have errors or missing punctuation. Do NOT penalise for punctuation gaps in the transcript. Judge all delivery from what you HEAR in the audio:
- PAUSING (停顿): Does the student pause at sentence-end markers (。！？) and major pauses (，)? Natural-feeling pauses count positively.
- INTONATION (语调): Is there any tonal variation? Even slight pitch changes to mark questions or emphasis count.
- PACE (语速): Comfortable and readable for P6 Mandarin, approximately 120-170 characters per minute. Slightly fast or slow is fine; only penalise if it seriously affects intelligibility.
- MOOD (情感): Is the delivery controlled and purposeful? Singapore students do not need to perform dramatically.

CRITICAL SCORING RULES:
1. AUDIO IS PRIMARY FOR DELIVERY: Listen to the actual audio. Do not infer delivery quality from the transcript text.
2. SINGAPORE STANDARD: A Singapore P6 student who reads the full passage clearly with reasonable pacing and some punctuation awareness should score 7-8/10 on each criterion. Reserve 9-10 for notably expressive or exceptionally accurate delivery.
3. COMPLETENESS: If the student did not read the ENTIRE passage, deduct heavily. Reading only part = maximum 4/10. Reading less than a third = maximum 2/10.
4. ACCURACY: Use character coverage data to identify missed/substituted characters, but verify with audio — speech-to-text may have errors.
5. EMPTY/MINIMAL TRANSCRIPTS: If transcript is empty but audio is provided, evaluate entirely from audio. Only score 0 if the student genuinely did not speak.
6. DO NOT penalise for: mild Singapore Mandarin accent, absence of erhua, Beijing-specific tones — these are NOT errors in Singapore Chinese.

[课文 / Reading Passage]:
"${exercise.passageText}"

[学生朗读转录 / Student's Speech Transcription]:
"${hasTranscript ? transcript : "[未检测到语音 — 学生未朗读或麦克风故障 / NO SPEECH DETECTED]"}"
${coverageInfo}

${!hasTranscript ? "\nCRITICAL: No speech was detected. Both scores MUST be 0." : ""}

Evaluate strictly according to the rubric above. For EACH criterion:
1. 发音与咬字 (score1): List specific characters mispronounced (with correct pinyin), skipped characters, and substituted characters.
2. 朗读流利度与表达 (score2): Assess pausing at punctuation, tonal variation, pace, and mood match.
(Set score3 to 0 — Reading Aloud has only 2 criteria.)

In suggestedResponse1, provide a model reading annotation using:
- Pinyin above or beside difficult characters (e.g., 着[zhuó])
- / for natural pauses
- UPPERCASE for stressed characters
- ↑ for rising intonation
- [平静], [兴奋], [紧张] for mood annotations
Leave suggestedResponse2 and suggestedResponse3 as empty strings.

All feedback text in generalFeedback, strengths, and areasOfImprovement MUST be written in English (so parents and tutors can read it).

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10>,
  "score2": <number 0-10>,
  "score3": 0,
  "generalFeedback": "<string in English — be honest about performance level, mention completeness, pronunciation accuracy, and delivery quality>",
  "strengths": ["<string in English with specific examples>", ...],
  "areasOfImprovement": ["<string in English with specific character/tone issues>", ...],
  "suggestedResponse1": "<model reading with pinyin annotations for difficult chars, / pauses, UPPERCASE stress, ↑ rising intonation, and [mood] annotations — in Chinese>",
  "suggestedResponse2": "",
  "suggestedResponse3": ""
}`.trim();
}

function buildZhStimulusPrompt(history: PracticeHistory, exercise: OralExercise): string {
  const hasT1 = !!history.transcript1 && history.transcript1 !== "No speech recognized" && history.transcript1.trim().length > 0;
  const hasT2 = !!history.transcript2 && history.transcript2 !== "No speech recognized" && history.transcript2.trim().length > 0;
  const hasT3 = !!history.transcript3 && history.transcript3 !== "No speech recognized" && history.transcript3.trim().length > 0;
  const answeredCount = [hasT1, hasT2, hasT3].filter(Boolean).length;

  return `
You are an experienced PSLE Chinese (Mother Tongue) Oral examiner for Singapore primary schools, calibrated to the MOE/SEAB standard for the 看图说话 (Stimulus-Based Conversation) component. You are assessing P6 students whose mother tongue is Mandarin Chinese.

SINGAPORE CHINESE CONTEXT (apply throughout):
- The standard is Singapore Standard Mandarin (普通话). A mild Singapore Mandarin accent and local speech patterns are acceptable and must NOT be penalised.
- Simple, clear Mandarin with relevant content scores well. Students do not need to use high-register Classical Chinese vocabulary for a high score.
- Benchmark: a P6 Singapore student who gives a clear, relevant answer with at least one specific example or reason in Mandarin should score 6-8/10 per question. Reserve 9-10 for rich, well-structured, impressive responses.

[SEAB PSLE 华文看图说话评分标准 / Chinese Stimulus-Based Conversation Marking Rubric]:

Each question is scored HOLISTICALLY (0-10), considering all three dimensions together:

维度一 / DIMENSION 1: 内容与回应 (Content & Response)
- 回答切题，内容充实，有例子或细节支撑
- 不只是简单重述图片，有个人看法或延伸

维度二 / DIMENSION 2: 语言表达 (Language Expression)
- 词汇恰当多样，不只用"好/坏/高兴/喜欢"
- 语法基本正确，句子完整
- 轻微新加坡式普通话语法可接受

维度三 / DIMENSION 3: 沟通能力 (Communication)
- 流利自然，表达清晰，有条理
- 回答有组织感（观点 + 理由 + 例子 或 总结）

HOLISTIC BAND DESCRIPTORS (per question, 0-10):
- Band 8-10 (好至优秀): 回答完整，内容丰富，有清晰观点加理由加例子，语言流畅，词汇多样，有组织。
- Band 6-7 (良好): 回答基本切题，有观点和一些支持细节，语言表达清楚，有些组织。
- Band 4-5 (及格): 回答简单，内容有限，语言平淡，基本完整但缺乏细节或组织。
- Band 2-3 (待提高): 回答不完整或偏题，词汇有限，表达有困难，句子不完整。
- Band 0-1 (差/未作答): 无回应或完全无法理解。

CRITICAL SCORING RULES:
1. AUDIO IS PRIMARY FOR DELIVERY: Listen to the actual audio. Score fluency, confidence, and clarity from what you HEAR.
2. SCORE EACH QUESTION INDEPENDENTLY: score1 = Q1 holistic, score2 = Q2 holistic, score3 = Q3 holistic (0-10 each). A strong Q1 does NOT raise a weak Q2.
3. SINGAPORE STANDARD CALIBRATION: A student who answers clearly in Mandarin with at least one reason or example and speaks fluently should score 6-8/10. Do NOT require Beijing Mandarin pronunciation or formal written register.
4. MINIMUM RESPONSE FLOOR: Responses fewer than ~15 Chinese characters / ~10 spoken words cannot score above 4/10 regardless of content. If audio is also silent, score MUST be 0.
5. VOCABULARY CHECK: If every answer uses only the most basic words (好、坏、高兴) with zero variety, cap language component at 5/10.
6. STRUCTURE CHECK: No organisation at all (no point, no reason) = cap content component at 5/10. Even "我觉得……因为……" counts as minimal structure.

[图片主题 / Stimulus Theme]: ${exercise.topic}
[图片内容描述 / Stimulus Description]:
"${exercise.posterDescription}"

[第一题 / Question 1]: "${exercise.question1}"
[学生回答一 / Student's Response 1]: "${hasT1 ? history.transcript1 : "[无回应 — 学生未作答 / NO RESPONSE]"}"

[第二题 / Question 2]: "${exercise.question2}"
[学生回答二 / Student's Response 2]: "${hasT2 ? history.transcript2 : "[无回应 — 学生未作答 / NO RESPONSE]"}"

[第三题 / Question 3]: "${exercise.question3}"
[学生回答三 / Student's Response 3]: "${hasT3 ? history.transcript3 : "[无回应 — 学生未作答 / NO RESPONSE]"}"

Questions answered: ${answeredCount}/3${answeredCount < 3 ? ` — INCOMPLETE. ${3 - answeredCount} question(s) unanswered. Unanswered questions MUST score 0.` : ""}

Evaluate each question strictly and independently. score1, score2, score3 represent Q1, Q2, Q3 holistic scores (0-10 each). Total = score1 + score2 + score3 (max 30).

For model answers (suggestedResponse1/2/3):
- Write in Mandarin Chinese at PSLE AL1 standard
- Use the 观点(Point) + 理由(Reason) + 例子(Example) + 总结(Link) structure (Chinese equivalent of PEEL)
- Annotate difficult or important vocabulary with pinyin in brackets, e.g. 环境[huán jìng]
- Aim for ~60-100 characters per answer — appropriate for a P6 spoken response

All feedback text in generalFeedback, strengths, and areasOfImprovement MUST be written in English (so parents and tutors can read it).

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10, Q1 holistic score>,
  "score2": <number 0-10, Q2 holistic score>,
  "score3": <number 0-10, Q3 holistic score>,
  "generalFeedback": "<string in English — overall performance summary across all 3 questions>",
  "strengths": ["<string in English with specific examples from transcripts>", ...],
  "areasOfImprovement": ["<string in English with specific examples per question>", ...],
  "suggestedResponse1": "<AL1 model answer in Mandarin for Q1 using 观点+理由+例子+总结 structure, with pinyin for difficult words>",
  "suggestedResponse2": "<AL1 model answer in Mandarin for Q2 using 观点+理由+例子+总结 structure, with pinyin for difficult words>",
  "suggestedResponse3": "<AL1 model answer in Mandarin for Q3 using 观点+理由+例子+总结 structure, with pinyin for difficult words>"
}`.trim();
}

function buildZhEvaluationPrompt(history: PracticeHistory, exercise: OralExercise): string {
  if (exercise.type === "READING") {
    return buildZhReadingPrompt(history, exercise);
  }
  return buildZhStimulusPrompt(history, exercise);
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

export async function evaluateZhWithGemini(
  history: PracticeHistory,
  exercise: OralExercise,
  apiKey: string,
  audioBlobs: (string | null)[] = []
): Promise<PSLEEvaluationResult> {
  const prompt = buildZhEvaluationPrompt(history, exercise);

  // Convert base64 audio blobs to Gemini inline_data parts.
  // Audio is the primary source for delivery assessment (pronunciation, tones,
  // fluency, rhythm, expression). Transcript is used for content/character
  // accuracy only.
  const audioParts = audioBlobs
    .filter((b): b is string => !!b)
    .map((b) => blobToAudioPart(b))
    .filter((p): p is { inline_data: { mime_type: string; data: string } } => p !== null);

  const parts: object[] = [];
  if (audioParts.length > 0) {
    parts.push({
      text: "The student's audio recordings are attached below. LISTEN to the audio to assess all delivery criteria: Mandarin tones (声调), pronunciation (发音), rhythm (节奏), fluency (流利度), pace (语速), pausing (停顿), and expression (表达). Do NOT infer delivery from the transcript — the transcript is for content and character accuracy only.",
    });
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
