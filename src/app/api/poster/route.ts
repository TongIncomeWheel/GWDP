import { NextRequest, NextResponse } from "next/server";
import { updateExerciseImage, getEffectiveApiKey } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { exerciseId, description } = await request.json();
  if (!exerciseId || !description) {
    return NextResponse.json(
      { error: "exerciseId and description required" },
      { status: 400 }
    );
  }

  const apiKey = getEffectiveApiKey();

  if (!apiKey) {
    // No API key: return a placeholder description instead of generating
    return NextResponse.json({
      imageUrl: null,
      description: description,
    });
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

    const imagePart = parts.find(
      (p: Record<string, unknown>) => p.inlineData
    );
    if (imagePart?.inlineData) {
      const { mimeType, data: b64 } = imagePart.inlineData as {
        mimeType: string;
        data: string;
      };
      const dataUrl = `data:${mimeType};base64,${b64}`;
      updateExerciseImage(Number(exerciseId), dataUrl);
      return NextResponse.json({
        imageUrl: dataUrl,
        description: description,
      });
    }

    // Image generation did not return inline data
    return NextResponse.json({
      imageUrl: null,
      description: description,
    });
  } catch (e) {
    // On error, return null imageUrl with description as fallback
    return NextResponse.json({
      imageUrl: null,
      description: description,
      error: (e as Error).message,
    });
  }
}
