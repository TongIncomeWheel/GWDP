import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/db";

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
    contents: [{
      parts: [
        { text: "Transcribe this audio recording exactly as spoken by the student. Return only the spoken words with no commentary, labels, or punctuation corrections." },
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
  const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  return NextResponse.json({ transcript });
}
