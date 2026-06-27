import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/db";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Extract base64 image from any Gemini API response structure
function extractImage(data: Record<string, unknown>): { b64: string; mime: string } | null {
  // ── Interactions API: top-level output_image ──────────────────────────
  const outImg = data.output_image as { data?: string; mime_type?: string } | undefined;
  if (outImg?.data) return { b64: outImg.data, mime: outImg.mime_type || "image/jpeg" };

  // ── Interactions API: steps[] containing output_image ─────────────────
  const steps = data.steps as Array<{ output_image?: { data?: string; mime_type?: string } }> | undefined;
  const stepImg = steps?.find((s) => s.output_image?.data)?.output_image;
  if (stepImg?.data) return { b64: stepImg.data, mime: stepImg.mime_type || "image/jpeg" };

  // ── generateContent format: candidates[].content.parts[].inlineData ───
  type Part = { inlineData?: { data?: string; mimeType?: string }; text?: string };
  type Candidate = { content?: { parts?: Part[] } };
  const candidates = data.candidates as Candidate[] | undefined;
  const inlineData = candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (inlineData?.data) return { b64: inlineData.data, mime: inlineData.mimeType || "image/jpeg" };

  // ── Interactions API: output[] array format ───────────────────────────
  const outputs = data.output as Array<{ type?: string; data?: string; mime_type?: string }> | undefined;
  if (Array.isArray(outputs)) {
    const imgOut = outputs.find((o) => o.type === "image" && o.data);
    if (imgOut?.data) return { b64: imgOut.data, mime: imgOut.mime_type || "image/jpeg" };
  }

  return null;
}

// Try Gemini Interactions API image models
async function tryInteractionsAPI(
  apiKey: string, prompt: string, errors: string[]
): Promise<string | null> {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];

  for (const model of models) {
    try {
      const res = await fetch(INTERACTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model,
          input: [{ type: "text", text: prompt }],
          response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "4:3", image_size: "1K" },
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        const msg = `${model} HTTP ${res.status}: ${txt.slice(0, 150)}`;
        console.log(`[POSTER] ${msg}`);
        errors.push(msg);
        continue;
      }

      const data = await res.json();
      const img = extractImage(data as Record<string, unknown>);
      if (img) {
        console.log(`[POSTER] ${model}: success via Interactions API`);
        return `data:${img.mime};base64,${img.b64}`;
      }

      const snippet = JSON.stringify(data).slice(0, 500);
      console.log(`[POSTER] ${model}: Interactions response has no image. snippet=${snippet}`);
      errors.push(`${model}: no image in Interactions response (keys: ${Object.keys(data).join(",")})`);
    } catch (e) {
      const msg = `${model} exception: ${(e as Error).message}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
    }
  }
  return null;
}

// Try generateContent with responseModalities=IMAGE (supported by flash models)
async function tryGenerateContent(
  apiKey: string, prompt: string, errors: string[]
): Promise<string | null> {
  const models = [
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash-preview-04-17",
    "gemini-2.5-flash",
  ];

  for (const model of models) {
    try {
      const url = `${GENERATE_URL}/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        // 404 = model not available; 400 = modality not supported — both are expected for some models
        if (res.status === 404 || res.status === 400) continue;
        const msg = `${model} generateContent HTTP ${res.status}: ${txt.slice(0, 150)}`;
        console.log(`[POSTER] ${msg}`);
        errors.push(msg);
        continue;
      }

      const data = await res.json();
      const img = extractImage(data as Record<string, unknown>);
      if (img) {
        console.log(`[POSTER] ${model}: success via generateContent`);
        return `data:${img.mime};base64,${img.b64}`;
      }
      // No image in response — this model doesn't support image output, skip silently
    } catch (e) {
      const msg = `${model} generateContent exception: ${(e as Error).message}`;
      console.log(`[POSTER] ${msg}`);
      errors.push(msg);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, description } = await request.json();
    if (!exerciseId || !description) {
      return NextResponse.json({ error: "exerciseId and description required" }, { status: 400 });
    }

    const apiKey = await getEffectiveApiKey();
    if (!apiKey) {
      return NextResponse.json({
        imageUrl: null,
        description,
        error: "No Gemini API key configured. Set it in Parent > Settings to enable image generation.",
      });
    }

    const prompt = `Generate a realistic photograph suitable for a Singapore primary school English oral examination stimulus-based conversation exercise. The image should depict: ${description}. The image must be appropriate for children aged 11-12, photorealistic, clearly show the described scene, and contain NO text or words.`;
    const errors: string[] = [];

    // Try Interactions API first (dedicated image models)
    const imageUrl =
      (await tryInteractionsAPI(apiKey, prompt, errors)) ||
      (await tryGenerateContent(apiKey, prompt, errors));

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

// GET: diagnostic — probe all image generation paths and return raw results
export async function GET() {
  try {
    const apiKey = await getEffectiveApiKey();
    if (!apiKey) {
      return NextResponse.json({ hasKey: false });
    }

    const diagnostics: Record<string, string> = {};
    const testPrompt = "a red apple on a white table";

    // Probe Interactions API models
    for (const model of ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-3-pro-image"]) {
      try {
        const res = await fetch(INTERACTIONS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            model,
            input: [{ type: "text", text: testPrompt }],
            response_format: { type: "image", mime_type: "image/jpeg" },
          }),
        });
        const text = await res.text();
        const snippet = text.slice(0, 400);
        const hasImage = snippet.includes('"data"') && snippet.length > 100;
        diagnostics[`interactions/${model}`] = `${res.status}${hasImage ? " [HAS_IMAGE]" : ""}: ${snippet}`;
      } catch (e) {
        diagnostics[`interactions/${model}`] = `exception: ${(e as Error).message}`;
      }
    }

    // Probe generateContent IMAGE modality models
    for (const model of ["gemini-2.0-flash-exp", "gemini-2.5-flash"]) {
      try {
        const url = `${GENERATE_URL}/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        });
        const text = await res.text();
        const snippet = text.slice(0, 400);
        const hasImage = snippet.includes('"inlineData"') && snippet.includes('"data"');
        diagnostics[`generateContent/${model}`] = `${res.status}${hasImage ? " [HAS_IMAGE]" : ""}: ${snippet}`;
      } catch (e) {
        diagnostics[`generateContent/${model}`] = `exception: ${(e as Error).message}`;
      }
    }

    return NextResponse.json({ hasKey: true, keyTail: apiKey.slice(-4), diagnostics });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
