import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey, insertExercises, getSetting, setSetting } from "@/lib/db";

const PSLE_TOPICS = [
  "Community and Kindness",
  "Environment and Sustainability",
  "Technology and Digital Literacy",
  "Health and Wellness",
  "Education and Learning",
  "Family and Relationships",
  "Sports and Physical Activities",
  "Arts and Culture",
  "Food and Nutrition",
  "Safety and Responsibility",
  "Singapore Heritage and Identity",
  "Animals and Nature",
  "Travel and Exploration",
  "Festivals and Celebrations",
  "Friendship and Teamwork",
  "Resilience and Perseverance",
  "Creativity and Innovation",
  "Civic Responsibility and Values",
  "Mental Health and Emotions",
  "Science and Discovery",
];

const DAILY_LIMIT = 2;

async function checkDailyLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await getSetting("generationTracker");
  let tracker: { date: string; count: number } = { date: today, count: 0 };
  if (raw) {
    try {
      tracker = JSON.parse(raw);
      if (tracker.date !== today) {
        tracker = { date: today, count: 0 };
      }
    } catch {
      tracker = { date: today, count: 0 };
    }
  }
  return { allowed: tracker.count < DAILY_LIMIT, remaining: DAILY_LIMIT - tracker.count };
}

async function incrementDailyCount(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await getSetting("generationTracker");
  let tracker: { date: string; count: number } = { date: today, count: 0 };
  if (raw) {
    try {
      tracker = JSON.parse(raw);
      if (tracker.date !== today) {
        tracker = { date: today, count: 0 };
      }
    } catch {
      tracker = { date: today, count: 0 };
    }
  }
  tracker.count++;
  await setSetting("generationTracker", JSON.stringify(tracker));
}

function buildReadingPrompt(topic: string, difficulty: string): string {
  return `
You are an expert Singapore PSLE English Oral examination content creator. Generate a NEW, ORIGINAL Reading Aloud passage for Primary 6 students.

REQUIREMENTS:
- Topic: "${topic}"
- Difficulty: "${difficulty}"
- The passage MUST be 150-200 words long (${difficulty === "Foundation" ? "simpler vocabulary, shorter sentences" : difficulty === "Intermediate" ? "moderate vocabulary, varied sentence structures" : "advanced vocabulary, complex sentence structures, literary devices"})
- Set in a SINGAPORE context (HDB, hawker centres, MRT, local schools, neighbourhood, etc.)
- Use Singapore-appropriate names (mix of Chinese, Malay, Indian, Eurasian names)
- Include vocabulary suitable for P6 level
- Include a mix of dialogue and narrative
- Natural reading rhythm with opportunities for expressive delivery
- Follow SEAB oral reading passage conventions

READING TIPS should identify:
- 3-4 specific words to stress/emphasise
- Where to pause for effect
- Tone shifts in the passage

Respond in valid JSON:
{
  "title": "<concise title, 4-8 words>",
  "passageText": "<the full 150-200 word passage>",
  "preamblePact": "{\\"purpose\\":\\"...\\",\\"audience\\":\\"...\\",\\"context\\":\\"...\\",\\"tone\\":\\"...\\"}",
  "readingTips": "<specific tips referencing words/sections in the passage>"
}`.trim();
}

function buildSBCPrompt(topic: string, difficulty: string): string {
  const q1Types = ["inference", "observation", "description"];
  const q2Types = ["experience", "personal", "comparison"];
  const q3Types = ["opinion", "suggestion", "evaluation"];
  const q1 = q1Types[Math.floor(Math.random() * q1Types.length)];
  const q2 = q2Types[Math.floor(Math.random() * q2Types.length)];
  const q3 = q3Types[Math.floor(Math.random() * q3Types.length)];

  return `
You are an expert Singapore PSLE English Oral examination content creator. Generate a NEW, ORIGINAL Stimulus-Based Conversation (SBC) exercise for Primary 6 students.

REQUIREMENTS:
- Topic: "${topic}"
- Difficulty: "${difficulty}"
- Singapore context

PHOTOGRAPH DESCRIPTION (80-120 words):
- Describe a realistic photograph/poster suitable for PSLE oral
- Visually rich with specific details
- Singapore setting
- Appropriate for 11-12 year olds

THREE SBC QUESTIONS (SEAB pattern):
1. Q1 (${q1}): About what's happening in the picture
2. Q2 (${q2}): Personal experience related to the topic
3. Q3 (${q3}): Opinion or suggestion on a broader issue

Questions must be open-ended, age-appropriate for P6, ${difficulty === "Foundation" ? "straightforward" : difficulty === "Intermediate" ? "moderately challenging" : "challenging with mature reasoning"}.

Respond in valid JSON:
{
  "title": "<concise title> (SBC)",
  "posterDescription": "<80-120 word visual stimulus description>",
  "question1": "<${q1} question>",
  "question2": "<${q2} question>",
  "question3": "<${q3} question>",
  "sbcQ1Type": "${q1}",
  "sbcQ2Type": "${q2}",
  "sbcQ3Type": "${q3}",
  "imageSearchSuggestion": "<5-7 word photo search query>"
}`.trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { topic, difficulty } = body;

  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    return NextResponse.json({
      error: "Gemini API key is required to generate exercises. Ask your parent to configure it in Settings.",
    }, { status: 503 });
  }

  const { allowed, remaining } = await checkDailyLimit();
  if (!allowed) {
    return NextResponse.json({
      error: "Daily limit reached! You can generate up to 2 new exercise sets per day. Come back tomorrow for more!",
      remaining: 0,
    }, { status: 429 });
  }

  const selectedTopic = topic || PSLE_TOPICS[Math.floor(Math.random() * PSLE_TOPICS.length)];
  const selectedDifficulty = difficulty || "Intermediate";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const [readingRes, sbcRes] = await Promise.all([
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildReadingPrompt(selectedTopic, selectedDifficulty) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
        }),
      }),
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildSBCPrompt(selectedTopic, selectedDifficulty) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
        }),
      }),
    ]);

    if (!readingRes.ok || !sbcRes.ok) {
      const errText = !readingRes.ok ? await readingRes.text() : await sbcRes.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
    }

    const readingData = await readingRes.json();
    const sbcData = await sbcRes.json();

    const readingText = readingData.candidates?.[0]?.content?.parts?.[0]?.text;
    const sbcText = sbcData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!readingText || !sbcText) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
    }

    const reading = JSON.parse(readingText.replace(/```json\n?|\n?```/g, "").trim());
    const sbc = JSON.parse(sbcText.replace(/```json\n?|\n?```/g, "").trim());

    const exercises = [
      {
        type: "READING" as const,
        title: reading.title,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        preambleText: "Read the following passage aloud clearly and expressively.",
        passageText: reading.passageText,
        posterImageResName: "",
        posterDescription: "",
        question1: "",
        question2: "",
        question3: "",
        isDaily: false,
        preamblePact: typeof reading.preamblePact === "string" ? reading.preamblePact : JSON.stringify(reading.preamblePact || {}),
        readingTips: reading.readingTips || "",
        photographDescription: "",
        imageSearchSuggestion: "",
        sbcQ1Type: "",
        sbcQ2Type: "",
        sbcQ3Type: "",
        generatedImageUrl: null,
      },
      {
        type: "STIMULUS" as const,
        title: sbc.title,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        preambleText: "Look at the photograph below and answer the questions that follow.",
        passageText: "",
        posterImageResName: "",
        posterDescription: sbc.posterDescription,
        question1: sbc.question1,
        question2: sbc.question2,
        question3: sbc.question3,
        isDaily: false,
        preamblePact: "",
        readingTips: "",
        photographDescription: sbc.posterDescription,
        imageSearchSuggestion: sbc.imageSearchSuggestion || "",
        sbcQ1Type: sbc.sbcQ1Type || "inference",
        sbcQ2Type: sbc.sbcQ2Type || "experience",
        sbcQ3Type: sbc.sbcQ3Type || "opinion",
        generatedImageUrl: null,
      },
    ];

    await insertExercises(exercises);
    await incrementDailyCount();

    return NextResponse.json({
      success: true,
      topic: selectedTopic,
      difficulty: selectedDifficulty,
      exercises: exercises.map((e) => ({ title: e.title, type: e.type })),
      remaining: remaining - 1,
    });
  } catch (e) {
    return NextResponse.json({ error: `Generation failed: ${(e as Error).message}` }, { status: 500 });
  }
}

export async function GET() {
  const { remaining } = await checkDailyLimit();
  return NextResponse.json({ topics: PSLE_TOPICS, remaining, dailyLimit: DAILY_LIMIT });
}
