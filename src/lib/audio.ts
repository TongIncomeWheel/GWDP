/**
 * Client-side helpers for resolving audio playback URLs.
 * Server-side audio operations live in src/lib/audio-service.ts.
 *
 * audioPath = raw GCS object name e.g. "audio/uuid.webm"
 * audioBlob = legacy base64 data URL (old records only — not used for playback)
 *
 * Only GCS stream URLs are used for playback. Legacy blobs were corrupted by
 * fixWebmDuration and are not reliably playable.
 */
export function resolveAudioSrc(
  audioPath: string | null | undefined,
  audioBlob: string | null | undefined  // kept for API compatibility, not used
): string | null {
  if (audioPath) return `/api/audio/stream?path=${encodeURIComponent(audioPath)}`;
  return null;
}

export function hasAudio(
  audioPath1: string | null | undefined,
  audioPath2: string | null | undefined,
  audioPath3: string | null | undefined,
  audioBlob1: string | null | undefined,  // kept for API compatibility
  audioBlob2: string | null | undefined,  // kept for API compatibility
  audioBlob3: string | null | undefined   // kept for API compatibility
): boolean {
  return !!(audioPath1 || audioPath2 || audioPath3);
}
