import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/db";

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
      description,
      error: "No Gemini API key configured. Set it in Parent > Settings to enable image generation.",
    });
  }

  const prompt = `Generate a realistic photograph suitable for a Singapore primary school English oral examination stimulus-based conversation exercise. The image should depict: ${description}. The image should be appropriate for children aged 11-12, realistic, and clearly show the described scene. Do NOT include any text or words in the image.`;

  const errors: string[] = [];

  const imagenUrl = await tryImagenGeneration(apiKey, prompt, errors);
  if (imagenUrl) return NextResponse.json({ imageUrl: imagenUrl, description });

  const geminiUrl = await tryGeminiGeneration(apiKey, prompt, errors);
  if (geminiUrl) return NextResponse.json({ imageUrl: geminiUrl, description });

  return NextResponse.json({
    imageUrl: null,
    description,
    error: `Image generation failed: ${errors.join(" | ")}`,
  });
}

// GET: diagnostic endpoint — returns exact API errors without generating
export async function GET() {
  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    return NextResponse.json({ hasKey: false, errors: ["No API key configured"] });
  }

  const results: Record<string, string> = {};

  // Test Imagen
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a red apple", sampleCount: 1 }),
    });
    const text = await res.text();
    results["imagen-3.0-generate-002"] = `${res.status}: ${text.slice(0, 200)}`;
  } catch (e) {
    results["imagen-3.0-generate-002"] = `exception: ${(e as Error).message}`;
  }

  // Test gemini-2.0-flash-preview-image-generation
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "a red apple" }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    const text = await res.text();
    results["gemini-2.0-flash-preview-image-generation"] = `${res.status}: ${text.slice(0, 200)}`;
  } catch (e) {
    results["gemini-2.0-flash-preview-image-generation"] = `exception: ${(e as Error).message}`;
  }

  return NextResponse.json({ hasKey: true, keyTail: apiKey.slice(-4), results });
}

async function tryImagenGeneration(apiKey: string, prompt: string, errors: string[]): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
    // REST body format — NOT the Python SDK "config" wrapper
    const body = {
      prompt,
      sampleCount: 1,
      aspectRatio: "4:3",
      safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
      personGeneration: "ALLOW_ADULT",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const msg = `Imagen ${res.status}: ${errText.slice(0, 200)}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
      return null;
    }

    const data = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded
      || data.generatedImages?.[0]?.image?.imageBytes;
    if (b64) return `data:image/png;base64,${b64}`;

    console.log("[POSTER] Imagen: unexpected response shape", JSON.stringify(data).slice(0, 200));
    errors.push("Imagen: no image bytes in response");
    return null;
  } catch (e) {
    const msg = `Imagen exception: ${(e as Error).message}`;
    console.log(`[POSTER] ${msg}`);
    errors.push(msg);
    return null;
  }
}

async function tryGeminiGeneration(apiKey: string, prompt: string, errors: string[]): Promise<string | null> {
  // gemini-2.0-flash-preview-image-generation is the current production name
  // gemini-2.0-flash-exp is the older alias that some keys still support
  const models = [
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash-exp",
  ];
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
        const errText = await res.text().catch(() => "");
        const msg = `${model} ${res.status}: ${errText.slice(0, 200)}`;
        console.log(`[POSTER] ${msg}`);
        errors.push(msg);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts) {
        errors.push(`${model}: no content parts`);
        continue;
      }

      const imagePart = parts.find((p: Record<string, unknown>) => p.inlineData);
      if (imagePart?.inlineData) {
        const { mimeType, data: b64 } = imagePart.inlineData as { mimeType: string; data: string };
        return `data:${mimeType};base64,${b64}`;
      }
      errors.push(`${model}: no inlineData image part`);
    } catch (e) {
      const msg = `${model} exception: ${(e as Error).message}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
    }
  }
  return null;
}
