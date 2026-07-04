import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey, getSetting, setSetting } from "@/lib/db";
import { insertZhExercises } from "@/lib/zh-db";

const PSLE_TOPICS = [
  "爱护环境",
  "家庭与孝顺",
  "友谊与合作",
  "科技与生活",
  "健康生活",
  "社区与公民责任",
  "文化与传统",
  "学习与教育",
  "勤俭节约",
  "安全意识",
  "新加坡精神与身份认同",
  "动物与自然",
  "运动与健康",
  "节日与庆典",
  "坚毅不拔",
  "创意与发明",
  "饮食文化",
  "旅游与探索",
  "心理健康",
  "科学与探索",
];

const DAILY_LIMIT = 2;

async function checkDailyLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await getSetting("zhGenerationTracker");
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
  const raw = await getSetting("zhGenerationTracker");
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
  await setSetting("zhGenerationTracker", JSON.stringify(tracker));
}

function buildReadingPrompt(topic: string, difficulty: string): string {
  return `
你是新加坡小学华文口试内容创作专家。请为小六学生创作一篇原创朗读短文。
要求：
- 话题：${topic}
- 难度：${difficulty}
- 字数：约200-250字（${difficulty === "基础" ? "简单词汇" : difficulty === "中等" ? "适中词汇" : "丰富词汇"}）
- 新加坡华文语境（组屋、小贩中心、地铁等）
- 使用新加坡常见的华人、马来人、印度人名字
- 包含对话和叙述
- 自然的节奏，适合朗读

朗读提示应包括：3-4个重要词语的读法、停顿位置、语气变化

请以JSON格式回答：
{
  "title": "简短标题（4-8字）",
  "passageText": "完整约200-250字的短文",
  "preamblePact": "{\\"目的\\":\\"...\\",\\"听众\\":\\"...\\",\\"场景\\":\\"...\\",\\"语气\\":\\"...\\"}",
  "readingTips": "朗读提示..."
}`.trim();
}

function buildSBCPrompt(topic: string, difficulty: string): string {
  return `
你是新加坡小学华文口试内容创作专家。请为小六学生创作一套原创看图说话练习。

要求：
- 话题：${topic}
- 难度：${difficulty}
- 新加坡语境

图片描述（60-100字）：描述一张适合华文口试的真实照片

三道问题（符合MOE华文口试规范）：
1. Q1（观察/描述）：关于图片内容
2. Q2（个人经历）：与话题相关的个人经历
3. Q3（看法/建议）：对相关课题的看法

请以JSON格式回答：
{
  "title": "标题 (看图说话)",
  "posterDescription": "图片描述...",
  "question1": "问题一...",
  "question2": "问题二...",
  "question3": "问题三...",
  "sbcQ1Type": "description",
  "sbcQ2Type": "experience",
  "sbcQ3Type": "opinion",
  "imageSearchSuggestion": "photo search query in English"
}`.trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { topic, difficulty } = body;

  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    return NextResponse.json({
      error: "需要Gemini API密钥才能生成练习。请让家长在设置中配置。",
    }, { status: 503 });
  }

  const { allowed, remaining } = await checkDailyLimit();
  if (!allowed) {
    return NextResponse.json({
      error: "今日生成次数已达上限！每天最多可生成2套新练习。明天再来吧！",
      remaining: 0,
    }, { status: 429 });
  }

  const selectedTopic = topic || PSLE_TOPICS[Math.floor(Math.random() * PSLE_TOPICS.length)];
  const selectedDifficulty = difficulty || "中等";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
        preambleText: "请朗读以下短文，读得清楚又有感情。",
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
        preambleText: "请看图后回答问题。",
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
        sbcQ1Type: sbc.sbcQ1Type || "description",
        sbcQ2Type: sbc.sbcQ2Type || "experience",
        sbcQ3Type: sbc.sbcQ3Type || "opinion",
        generatedImageUrl: null,
      },
    ];

    await insertZhExercises(exercises);
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
  return NextResponse.json({ zhTopics: PSLE_TOPICS, remaining, dailyLimit: DAILY_LIMIT });
}
