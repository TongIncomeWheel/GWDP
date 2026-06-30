/**
 * Resolve the best audio source for a practice session recording.
 * New records: audioPath is a GCS object name → streamed through /api/audio/stream.
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
