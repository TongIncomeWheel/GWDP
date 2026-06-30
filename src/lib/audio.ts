/**
 * Client-side helpers for resolving audio playback URLs.
 * Server-side audio operations live in src/lib/audio-service.ts.
 *
 * audioPath = raw GCS object name e.g. "audio/uuid.webm"
 * audioBlob = legacy base64 data URL (old records only)
 * Old records: audioBlob is a base64 data URL → used directly (AudioPlayer converts it).
 */
export function resolveAudioSrc(
  audioPath: string | null | undefined,
  audioBlob: string | null | undefined
): string | null {
  if (audioPath) return `/api/audio/stream?path=${encodeURIComponent(audioPath)}`;
  if (audioBlob) return audioBlob;
  return null;
}

export function hasAudio(
  audioPath1: string | null | undefined,
  audioPath2: string | null | undefined,
  audioPath3: string | null | undefined,
  audioBlob1: string | null | undefined,
  audioBlob2: string | null | undefined,
  audioBlob3: string | null | undefined
): boolean {
  return !!(audioPath1 || audioPath2 || audioPath3 || audioBlob1 || audioBlob2 || audioBlob3);
}
