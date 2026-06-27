import { NextRequest, NextResponse } from "next/server";
import { updateExerciseImage } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { exerciseId, description } = await request.json();
  if (!exerciseId || !description) {
    return NextResponse.json({ error: "exerciseId and description required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    const placeholderUrl = `https://placehold.co/400x300/E8DEF8/4A148C?text=${encodeURIComponent(description.slice(0, 30))}`;
    updateExerciseImage(Number(exerciseId), placeholderUrl);
    return NextResponse.json({ imageUrl: placeholderUrl, mock: true });
  }

  try {
    const prompt = `Generate a realistic photograph suitable for a Singapore primary school English oral examination stimulus-based conversation exercise. The image should depict: ${description}. The image should be appropriate for children aged 11-12, realistic, and clearly show the described scene. Do NOT include any text or words in the image.`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

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
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content in response");

    const imagePart = parts.find((p: Record<string, unknown>) => p.inlineData);
    if (imagePart?.inlineData) {
      const { mimeType, data: b64 } = imagePart.inlineData as { mimeType: string; data: string };
      const dataUrl = `data:${mimeType};base64,${b64}`;
      updateExerciseImage(Number(exerciseId), dataUrl);
      return NextResponse.json({ imageUrl: dataUrl });
    }

    const placeholderUrl = `https://placehold.co/400x300/E8DEF8/4A148C?text=${encodeURIComponent(description.slice(0, 30))}`;
    updateExerciseImage(Number(exerciseId), placeholderUrl);
    return NextResponse.json({ imageUrl: placeholderUrl, mock: true });
  } catch (e) {
    const placeholderUrl = `https://placehold.co/400x300/E8DEF8/4A148C?text=${encodeURIComponent(description.slice(0, 30))}`;
    updateExerciseImage(Number(exerciseId), placeholderUrl);
    return NextResponse.json({
      imageUrl: placeholderUrl,
      mock: true,
      error: (e as Error).message,
    });
  }
}
