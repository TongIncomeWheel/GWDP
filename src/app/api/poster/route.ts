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

  const apiKey = await getEffectiveApiKey();

  if (!apiKey) {
    return NextResponse.json({
      imageUrl: null,
      description: description,
      error: "No Gemini API key configured. Set it in Parent > Settings to enable image generation.",
    });
  }

  const prompt = `Generate a realistic photograph suitable for a Singapore primary school English oral examination stimulus-based conversation exercise. The image should depict: ${description}. The image should be appropriate for children aged 11-12, realistic, and clearly show the described scene. Do NOT include any text or words in the image.`;

  const imageUrl = await tryImagenGeneration(apiKey, prompt) ||
                   await tryGeminiFlashGeneration(apiKey, prompt);

  if (imageUrl) {
    await updateExerciseImage(Number(exerciseId), imageUrl);
    return NextResponse.json({ imageUrl, description });
  }

  return NextResponse.json({
    imageUrl: null,
    description,
    error: "Image generation failed. The API may not support image output with your current plan.",
  });
}

async function tryImagenGeneration(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "4:3",
        safetyFilterLevel: "block_few",
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (b64) {
      return `data:image/png;base64,${b64}`;
    }
    return null;
  } catch {
    return null;
  }
}

async function tryGeminiFlashGeneration(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    const imagePart = parts.find((p: Record<string, unknown>) => p.inlineData);
    if (imagePart?.inlineData) {
      const { mimeType, data: b64 } = imagePart.inlineData as { mimeType: string; data: string };
      return `data:${mimeType};base64,${b64}`;
    }
    return null;
  } catch {
    return null;
  }
}
