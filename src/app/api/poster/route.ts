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

  // Try Gemini first (free-tier compatible), then Imagen (paid tier)
  const geminiUrl = await tryGeminiGeneration(apiKey, prompt, errors);
  if (geminiUrl) return NextResponse.json({ imageUrl: geminiUrl, description });

  const imagenUrl = await tryImagenGeneration(apiKey, prompt, errors);
  if (imagenUrl) return NextResponse.json({ imageUrl: imagenUrl, description });

  return NextResponse.json({
    imageUrl: null,
    description,
    error: `Image generation failed: ${errors.join(" | ")}`,
  });
}

// GET: diagnostic — lists available image-capable models, then probes each one
export async function GET() {
  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    return NextResponse.json({ hasKey: false, errors: ["No API key configured"] });
  }

  // Step 1: list all models and find image-capable ones
  let imageModels: string[] = [];
  let listError = "";
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${apiKey}`
    );
    const listData = await listRes.json();
    const all: Array<{ name: string; supportedGenerationMethods?: string[] }> = listData.models || [];
    imageModels = all
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        return (
          methods.includes("generateImages") ||
          methods.includes("predict") ||
          m.name.toLowerCase().includes("image") ||
          m.name.toLowerCase().includes("imagen")
        );
      })
      .map((m) => m.name.replace("models/", ""));
  } catch (e) {
    listError = (e as Error).message;
  }

  // Step 2: probe known candidates + discovered models
  const candidates = Array.from(new Set([
    ...imageModels,
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-generate-001",
    "imagen-3.0-generate-002",
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.5-flash-preview-image-generation",
  ]));

  const results: Record<string, string> = {};
  for (const model of candidates) {
    try {
      const isImagen = model.startsWith("imagen");
      if (isImagen) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImages?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "a red apple", numberOfImages: 1 }),
        });
        const text = await res.text();
        results[model] = `${res.status}: ${text.slice(0, 300)}`;
      } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "a red apple" }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        });
        const text = await res.text();
        results[model] = `${res.status}: ${text.slice(0, 300)}`;
      }
    } catch (e) {
      results[model] = `exception: ${(e as Error).message}`;
    }
  }

  return NextResponse.json({
    hasKey: true,
    keyTail: apiKey.slice(-4),
    imageModelsDiscovered: imageModels,
    listError,
    results,
  });
}

async function tryImagenGeneration(apiKey: string, prompt: string, errors: string[]): Promise<string | null> {
  // Try Imagen 4 fast first (cheaper, faster), then standard, then Imagen 3
  const models = [
    { name: "imagen-4.0-fast-generate-001", body: { prompt, numberOfImages: 1, imageSize: "1K", aspectRatio: "4:3", personGeneration: "ALLOW_ADULT" } },
    { name: "imagen-4.0-generate-001", body: { prompt, numberOfImages: 1, imageSize: "1K", aspectRatio: "4:3", personGeneration: "ALLOW_ADULT" } },
    { name: "imagen-3.0-generate-002", body: { prompt, sampleCount: 1, aspectRatio: "4:3", safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE", personGeneration: "ALLOW_ADULT" } },
  ];

  for (const { name, body } of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateImages?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const msg = `${name} ${res.status}: ${errText.slice(0, 200)}`;
        console.log(`[POSTER] ${msg}`);
        errors.push(msg);
        continue;
      }

      const data = await res.json();
      const b64 = data.predictions?.[0]?.bytesBase64Encoded
        || data.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        console.log(`[POSTER] ${name}: success`);
        return `data:image/png;base64,${b64}`;
      }

      console.log(`[POSTER] ${name}: unexpected response shape`, JSON.stringify(data).slice(0, 200));
      errors.push(`${name}: no image bytes in response`);
    } catch (e) {
      const msg = `${name} exception: ${(e as Error).message}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
    }
  }

  return null;
}

async function tryGeminiGeneration(apiKey: string, prompt: string, errors: string[]): Promise<string | null> {
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
        console.log(`[POSTER] ${model}: success`);
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
