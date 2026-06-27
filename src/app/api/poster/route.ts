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
                   await tryGeminiGeneration(apiKey, prompt);

  if (imageUrl) {
    await updateExerciseImage(Number(exerciseId), imageUrl);
    return NextResponse.json({ imageUrl, description });
  }

  return NextResponse.json({
    imageUrl: null,
    description,
    error: "Image generation failed. Your API key may not have access to image generation models.",
  });
}

async function tryImagenGeneration(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
    const body = {
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "4:3",
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.log(`[POSTER] Imagen failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const b64 = data.generatedImages?.[0]?.image?.imageBytes;
    if (b64) {
      return `data:image/png;base64,${b64}`;
    }
    return null;
  } catch (e) {
    console.log(`[POSTER] Imagen error: ${(e as Error).message}`);
    return null;
  }
}

async function tryGeminiGeneration(apiKey: string, prompt: string): Promise<string | null> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash-001"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

      if (!res.ok) {
        console.log(`[POSTER] ${model} failed: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      const imagePart = parts.find((p: Record<string, unknown>) => p.inlineData);
      if (imagePart?.inlineData) {
        const { mimeType, data: b64 } = imagePart.inlineData as { mimeType: string; data: string };
        return `data:${mimeType};base64,${b64}`;
      }
    } catch (e) {
      console.log(`[POSTER] ${model} error: ${(e as Error).message}`);
    }
  }
  return null;
}
