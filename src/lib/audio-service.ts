/**
 * audio-service.ts — single source of truth for all audio operations.
 *
 * Upload:   uploadAudio(base64DataUrl) → GCS object name
 * Download: streamAudio(objectName)    → { buffer, mimeType } for HTTP response
 * Delete:   deleteAudio(objectName)    → void
 * URL:      audioStreamUrl(objectName) → "/api/audio/stream?path=..."
 *
 * All server API routes and pages import from here. Nothing else touches GCS directly.
 */

import { getBucket } from "./db";

export async function uploadAudio(base64DataUrl: string): Promise<string> {
  let mimeType = "audio/webm";
  if (base64DataUrl.startsWith("data:")) {
    const m = base64DataUrl.match(/^data:([^;,]+)/);
    if (m) mimeType = m[1];
  }
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const objectName = `audio/${crypto.randomUUID()}.${ext}`;
  const raw = base64DataUrl.includes(",") ? base64DataUrl.split(",")[1] : base64DataUrl;
  const buffer = Buffer.from(raw, "base64");
  await getBucket().file(objectName).save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });
  return objectName;
}

export async function downloadAudio(objectName: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const file = getBucket().file(objectName);
  const [buffer] = await file.download();
  const [meta] = await file.getMetadata();
  return {
    buffer: Buffer.from(buffer),
    mimeType: (meta.contentType as string) || "audio/webm",
  };
}

export async function deleteAudio(objectName: string): Promise<void> {
  try {
    await getBucket().file(objectName).delete();
  } catch {
    // Non-fatal — object may already be deleted
  }
}

export function audioStreamUrl(objectName: string | null | undefined): string | null {
  if (!objectName) return null;
  return `/api/audio/stream?path=${encodeURIComponent(objectName)}`;
}

export async function audioToBase64(objectName: string | null | undefined): Promise<string | null> {
  if (!objectName) return null;
  try {
    const { buffer, mimeType } = await downloadAudio(objectName);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
