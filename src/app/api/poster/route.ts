import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/db";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export async function POST(request: NextRequest) {
  try {
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

    // Try new Interactions API (gemini-3.1-flash-image)
    const imageUrl = await tryInteractionsAPI(apiKey, prompt, errors);
    if (imageUrl) return NextResponse.json({ imageUrl, description });

    return NextResponse.json({
      imageUrl: null,
      description,
      error: `Image generation failed: ${errors.join(" | ")}`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET: diagnostic — discover available models and probe image generation
export async function GET() {
  try {
  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    return NextResponse.json({ hasKey: false, errors: ["No API key configured"] });
  }

  const results: Record<string, string> = {};

  // Probe each image model via the new Interactions API
  const imageModels = [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image",
  ];

  for (const model of imageModels) {
    try {
      const res = await fetch(INTERACTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          input: [{ type: "text", text: "a red apple" }],
          response_format: { type: "image", mime_type: "image/jpeg" },
        }),
      });
      const text = await res.text();
      results[model] = `${res.status}: ${text.slice(0, 400)}`;
    } catch (e) {
      results[model] = `exception: ${(e as Error).message}`;
    }
  }

  return NextResponse.json({ hasKey: true, keyTail: apiKey.slice(-4), results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function tryInteractionsAPI(apiKey: string, prompt: string, errors: string[]): Promise<string | null> {
  const models = [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
  ];

  for (const model of models) {
    try {
      const res = await fetch(INTERACTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          input: [{ type: "text", text: prompt }],
          response_format: {
            type: "image",
            mime_type: "image/jpeg",
            aspect_ratio: "4:3",
            image_size: "1K",
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const msg = `${model} ${res.status}: ${errText.slice(0, 200)}`;
        console.log(`[POSTER] ${msg}`);
        errors.push(msg);
        continue;
      }

      const data = await res.json();
      console.log(`[POSTER] ${model} response keys:`, Object.keys(data));

      // Try output_image convenience property first
      const b64 = data.output_image?.data
        // Also check steps array for interleaved outputs
        || data.steps?.find((s: Record<string, unknown>) => s.output_image)?.output_image?.data;

      if (b64) {
        const mime = data.output_image?.mime_type || "image/jpeg";
        console.log(`[POSTER] ${model}: success`);
        return `data:${mime};base64,${b64}`;
      }

      console.log(`[POSTER] ${model}: no image data in response`, JSON.stringify(data).slice(0, 300));
      errors.push(`${model}: no image data in response`);
    } catch (e) {
      const msg = `${model} exception: ${(e as Error).message}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
    }
  }

  return null;
}
