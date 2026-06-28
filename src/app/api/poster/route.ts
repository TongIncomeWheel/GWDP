import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKey } from "@/lib/db";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Extract base64 image from Gemini Interactions API (raw REST) or generateContent response.
//
// Interactions API canonical path (confirmed):
//   steps[] → step_type === "model_output" → model_output.parts[] → image.image_bytes
//
// Fallback paths for other shapes / generateContent:
//   { output_image: { data, mime_type } }
//   { candidates[].content.parts[].inlineData.{ data, mimeType } }
//   { steps[].content[].image_url.url }  (OpenAI-compat wrapper)
//   { b64_json }  (DALL-E style)
function extractImage(node: unknown, depth = 0): { b64: string; mime: string } | null {
  if (!node || typeof node !== "object" || depth > 10) return null;

  // ── Interactions API canonical path (raw REST, confirmed) ──────────────
  // steps[] → step_type === "model_output" → model_output.parts[] → image.image_bytes
  if (depth === 0 && !Array.isArray(node)) {
    const root = node as Record<string, unknown>;
    const steps = root.steps as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(steps)) {
      for (const step of steps) {
        if (step.step_type !== "model_output") continue;
        const mo = step.model_output as Record<string, unknown> | undefined;
        const parts = mo?.parts as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(parts)) continue;
        for (const part of parts) {
          const img = part.image as Record<string, unknown> | undefined;
          if (img?.image_bytes) {
            return {
              b64: img.image_bytes as string,
              mime: (img.mime_type as string | undefined) || "image/jpeg",
            };
          }
        }
      }
    }
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const r = extractImage(item, depth + 1);
      if (r) return r;
    }
    return null;
  }

  const obj = node as Record<string, unknown>;

  // ── OpenAI image-gen style: { b64_json: "..." } ──────────────────────
  if (typeof obj.b64_json === "string" && obj.b64_json.length > 100) {
    const mime = (typeof obj.mime_type === "string" && obj.mime_type) || "image/jpeg";
    return { b64: obj.b64_json, mime };
  }

  // ── Interactions / direct: { data: "base64...", (mime_type|media_type) } ─
  if (typeof obj.data === "string" && obj.data.length > 100 &&
      (obj.type === "image" || obj.mime_type || obj.media_type || obj.mimeType)) {
    const mime = String(obj.mime_type || obj.media_type || obj.mimeType || "image/jpeg");
    return { b64: obj.data, mime };
  }

  // ── inlineData / inline_data (generateContent format) ─────────────────
  for (const key of ["inlineData", "inline_data"]) {
    const id = obj[key] as Record<string, unknown> | undefined;
    if (id && typeof id.data === "string" && id.data.length > 100) {
      const mime = String(id.mimeType || id.mime_type || "image/jpeg");
      return { b64: id.data, mime };
    }
  }

  // ── image_url: { url: "data:image/jpeg;base64,..." } ──────────────────
  const iu = obj.image_url as Record<string, unknown> | undefined;
  if (iu && typeof iu.url === "string" && iu.url.startsWith("data:image")) {
    const [header, b64] = iu.url.split(",");
    const mime = header.replace("data:", "").replace(";base64", "");
    if (b64 && b64.length > 100) return { b64, mime };
  }
  if (typeof obj.url === "string" && obj.url.startsWith("data:image")) {
    const [header, b64] = obj.url.split(",");
    const mime = header.replace("data:", "").replace(";base64", "");
    if (b64 && b64.length > 100) return { b64, mime };
  }

  // ── Recurse into known container fields first (fast-path) ─────────────
  for (const key of ["output_image", "output", "content", "parts", "steps",
                     "candidates", "message", "choices", "outputs"]) {
    if (obj[key]) {
      const r = extractImage(obj[key], depth + 1);
      if (r) return r;
    }
  }

  // ── Recurse into all other object values ──────────────────────────────
  for (const [k, v] of Object.entries(obj)) {
    if (["id","model","object","status","usage","created","updated",
         "service_tier","type","role","text","finish_reason",
         "index","prompt_tokens","completion_tokens","total_tokens"].includes(k)) continue;
    const r = extractImage(v, depth + 1);
    if (r) return r;
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

      // Log step[0] structure to help diagnose unknown formats
      const steps = (data as Record<string, unknown>).steps as unknown[] | undefined;
      const step0 = steps?.[0];
      const step0Keys = step0 && typeof step0 === "object" ? Object.keys(step0 as object).join(",") : "none";
      const snippet = JSON.stringify(step0 || data).slice(0, 600);
      console.log(`[POSTER] ${model}: no image found. top-keys=${Object.keys(data).join(",")} step[0]-keys=${step0Keys} snippet=${snippet}`);
      errors.push(`${model}: no image in Interactions response (top-keys: ${Object.keys(data).join(",")}, step[0]-keys: ${step0Keys})`);
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
