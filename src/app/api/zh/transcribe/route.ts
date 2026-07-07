import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/zh-db";

export async function POST(request: NextRequest) {
  const { audioUrl, audioBase64, mimeType: hintMime } = await request.json();

  const apiKey = await getEffectiveApiKey();
  if (!apiKey) return NextResponse.json({ error: "No API key configured" }, { status: 503 });

  let base64: string;
  let mimeType: string;

  if (audioBase64) {
    // Direct base64 path — no GCS round-trip needed
    const raw = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
    base64 = raw;
    mimeType = hintMime || "audio/webm";
  } else if (audioUrl) {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) return NextResponse.json({ error: "Could not fetch audio" }, { status: 502 });
    mimeType = audioRes.headers.get("content-type") || hintMime || "audio/webm";
    const buffer = await audioRes.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } else {
    return NextResponse.json({ error: "audioUrl or audioBase64 required" }, { status: 400 });
  }

  const body = {
    systemInstruction: {
      parts: [{
        text: "You are transcribing audio from a Singapore primary school student speaking Mandarin Chinese (普通话). ALWAYS output in Simplified Chinese characters (简体中文汉字). NEVER use Pinyin, Traditional Chinese, or English unless those exact words were spoken. If the audio is inaudible or silent, return an empty string."
      }]
    },
    contents: [{
      parts: [
        { text: "请将这段录音逐字转录成简体中文汉字。只输出学生所说的文字内容，不加标点注释、拼音、英文或任何说明。如果听不到任何内容，请返回空字符串。" },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
    }],
    generationConfig: { temperature: 0 },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Gemini error: ${text}` }, { status: 502 });
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

  // Validate the transcript actually contains Chinese characters.
  // If Gemini returned Pinyin, English, or garbage instead of Chinese, discard it
  // so the evaluator falls back to audio-only grading (avoids garbage-in → garbage-out).
  const chineseChars = (raw.match(/[一-鿿]/g) || []).length;
  const totalChars = raw.replace(/\s/g, "").length;
  const chineseRatio = totalChars > 0 ? chineseChars / totalChars : 0;
  const transcript = chineseRatio >= 0.3 ? raw : "";

  return NextResponse.json({ transcript });
}
