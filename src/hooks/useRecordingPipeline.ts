"use client";

import { useState, useRef, useCallback } from "react";
import fixWebmDuration from "fix-webm-duration";

export type RecordingState = "idle" | "recording" | "done";

export interface RecordingPipeline {
  recordingStates: RecordingState[];
  transcripts: string[];
  audioPaths: (string | null)[];    // raw GCS object names e.g. "audio/uuid.webm"
  uploadingAudio: boolean[];        // true while uploading to GCS
  transcribingAudio: boolean[];
  recordingErrors: string[];
  toggleRecording: (questionIdx: number) => void;
  resetAll: () => void;
}

export function useRecordingPipeline(): RecordingPipeline {
  const [recordingStates, setRecordingStates] = useState<RecordingState[]>(["idle", "idle", "idle"]);
  const [transcripts, setTranscripts] = useState<string[]>(["", "", ""]);
  const [audioPaths, setAudioPaths] = useState<(string | null)[]>([null, null, null]);
  const [uploadingAudio, setUploadingAudio] = useState<boolean[]>([false, false, false]);
  const [transcribingAudio, setTranscribingAudio] = useState<boolean[]>([false, false, false]);
  const [recordingErrors, setRecordingErrors] = useState<string[]>(["", "", ""]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<{ [idx: number]: Blob[] }>({ 0: [], 1: [], 2: [] });
  const recordingVersionRef = useRef<number[]>([0, 0, 0]);
  const recordingStartTimeRef = useRef<{ [idx: number]: number }>({ 0: 0, 1: 0, 2: 0 });

  const startRecording = useCallback(async (questionIdx: number) => {
    const myVersion = recordingVersionRef.current[questionIdx];
    setRecordingErrors((prev) => { const n = [...prev]; n[questionIdx] = ""; return n; });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setRecordingErrors((prev) => { const n = [...prev]; n[questionIdx] = "Microphone access denied."; return n; });
      setRecordingStates((prev) => { const n = [...prev]; n[questionIdx] = "idle"; return n; });
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

    const mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 })
      : new MediaRecorder(stream, { audioBitsPerSecond: 24000 });

    audioChunksRef.current[questionIdx] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current[questionIdx].push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (recordingVersionRef.current[questionIdx] !== myVersion) return;

      const capturedMime = mediaRecorder.mimeType || "audio/webm";
      const rawBlob = new Blob(audioChunksRef.current[questionIdx], { type: capturedMime });
      const durationMs = Date.now() - (recordingStartTimeRef.current[questionIdx] || Date.now());

      // Fix WebM duration metadata so browsers can seek (not needed for mp4)
      let blob = rawBlob;
      if (capturedMime.includes("webm")) {
        try { blob = await fixWebmDuration(rawBlob, durationMs); } catch { blob = rawBlob; }
      }

      // Convert to base64 for upload and transcription
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      if (recordingVersionRef.current[questionIdx] !== myVersion) return;

      // Upload to GCS and transcribe in parallel
      setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });
      setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });

      const [uploadResult, transcribeResult] = await Promise.allSettled([
        fetch("/api/practice/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64 }),
        }).then((r) => r.json()),
        fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: base64, mimeType: capturedMime }),
        }).then((r) => r.json()),
      ]);

      if (recordingVersionRef.current[questionIdx] !== myVersion) return;

      // Handle upload result
      if (uploadResult.status === "fulfilled" && uploadResult.value?.path) {
        setAudioPaths((prev) => { const n = [...prev]; n[questionIdx] = uploadResult.value.path; return n; });
      } else {
        setRecordingErrors((prev) => {
          const n = [...prev];
          n[questionIdx] = "Audio upload failed — recording may not be available for playback.";
          return n;
        });
      }
      setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });

      // Handle transcription result
      if (transcribeResult.status === "fulfilled" && transcribeResult.value?.transcript) {
        setTranscripts((prev) => { const n = [...prev]; n[questionIdx] = transcribeResult.value.transcript; return n; });
      } else {
        setRecordingErrors((prev) => {
          const n = [...prev];
          // Only overwrite if no upload error already set
          if (!n[questionIdx]) n[questionIdx] = "Transcription failed — audio saved and will still be graded.";
          return n;
        });
      }
      setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
    };

    recordingStartTimeRef.current[questionIdx] = Date.now();
    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setRecordingStates((prev) => { const n = [...prev]; n[questionIdx] = "recording"; return n; });
  }, []);

  const stopRecording = useCallback((questionIdx: number) => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecordingStates((prev) => { const n = [...prev]; n[questionIdx] = "done"; return n; });
  }, []);

  const toggleRecording = useCallback(
    (questionIdx: number) => {
      setRecordingStates((prev) => {
        if (prev[questionIdx] === "recording") {
          stopRecording(questionIdx);
        } else {
          recordingVersionRef.current[questionIdx]++;
          audioChunksRef.current[questionIdx] = [];
          setTranscripts((t) => { const n = [...t]; n[questionIdx] = ""; return n; });
          setAudioPaths((p) => { const n = [...p]; n[questionIdx] = null; return n; });
          setUploadingAudio((u) => { const n = [...u]; n[questionIdx] = false; return n; });
          setRecordingErrors((e) => { const n = [...e]; n[questionIdx] = ""; return n; });
          setTranscribingAudio((t) => { const n = [...t]; n[questionIdx] = false; return n; });
          startRecording(questionIdx);
        }
        return prev;
      });
    },
    [startRecording, stopRecording]
  );

  const resetAll = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    recordingVersionRef.current = [0, 0, 0];
    audioChunksRef.current = { 0: [], 1: [], 2: [] };
    recordingStartTimeRef.current = { 0: 0, 1: 0, 2: 0 };
    setRecordingStates(["idle", "idle", "idle"]);
    setTranscripts(["", "", ""]);
    setAudioPaths([null, null, null]);
    setUploadingAudio([false, false, false]);
    setTranscribingAudio([false, false, false]);
    setRecordingErrors(["", "", ""]);
  }, []);

  return {
    recordingStates,
    transcripts,
    audioPaths,
    uploadingAudio,
    transcribingAudio,
    recordingErrors,
    toggleRecording,
    resetAll,
  };
}
