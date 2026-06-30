"use client";

import { useState, useRef, useCallback } from "react";
import fixWebmDuration from "fix-webm-duration";

export type RecordingState = "idle" | "recording" | "done";

export interface RecordingPipeline {
  recordingStates: RecordingState[];
  transcripts: string[];
  audioBlobs: (string | null)[];   // base64 data URLs — for AI scoring only
  audioPaths: (string | null)[];   // /api/audio/stream?path=... — for playback everywhere
  transcribingAudio: boolean[];
  recordingErrors: string[];
  toggleRecording: (questionIdx: number) => void;
  resetAll: () => void;
}

export function useRecordingPipeline(): RecordingPipeline {
  const [recordingStates, setRecordingStates] = useState<RecordingState[]>(["idle", "idle", "idle"]);
  const [transcripts, setTranscripts] = useState<string[]>(["", "", ""]);
  const [audioBlobs, setAudioBlobs] = useState<(string | null)[]>([null, null, null]);
  const [audioPaths, setAudioPaths] = useState<(string | null)[]>([null, null, null]);
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

      let blob = rawBlob;
      if (capturedMime.includes("webm")) {
        try { blob = await fixWebmDuration(rawBlob, durationMs); } catch { blob = rawBlob; }
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (recordingVersionRef.current[questionIdx] !== myVersion) return;
        const base64 = reader.result as string;
        setAudioBlobs((prev) => { const n = [...prev]; n[questionIdx] = base64; return n; });

        // Upload to GCS immediately — playback uses the stream URL, works on all platforms
        try {
          const res = await fetch("/api/practice/audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: base64 }),
          });
          const json = await res.json();
          if (recordingVersionRef.current[questionIdx] !== myVersion) return;
          if (json.path) {
            setAudioPaths((prev) => {
              const n = [...prev];
              n[questionIdx] = `/api/audio/stream?path=${encodeURIComponent(json.path)}`;
              return n;
            });
          }
        } catch {
          // Non-fatal: playback falls back to base64 blob
        }

        // Transcribe in parallel
        setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });
        try {
          const txRes = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, mimeType: capturedMime }),
          });
          const txData = await txRes.json();
          if (recordingVersionRef.current[questionIdx] !== myVersion) return;
          if (txData.transcript) {
            setTranscripts((prev) => { const n = [...prev]; n[questionIdx] = txData.transcript; return n; });
          } else {
            setRecordingErrors((prev) => {
              const n = [...prev]; n[questionIdx] = "Transcription failed — audio saved and will still be graded."; return n;
            });
          }
        } catch {
          if (recordingVersionRef.current[questionIdx] === myVersion) {
            setRecordingErrors((prev) => {
              const n = [...prev]; n[questionIdx] = "Transcription failed — audio saved and will still be graded."; return n;
            });
          }
        } finally {
          if (recordingVersionRef.current[questionIdx] === myVersion) {
            setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
          }
        }
      };
      reader.readAsDataURL(blob);
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
          setAudioBlobs((b) => { const n = [...b]; n[questionIdx] = null; return n; });
          setAudioPaths((p) => { const n = [...p]; n[questionIdx] = null; return n; });
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
    setAudioBlobs([null, null, null]);
    setAudioPaths([null, null, null]);
    setTranscribingAudio([false, false, false]);
    setRecordingErrors(["", "", ""]);
  }, []);

  return {
    recordingStates,
    transcripts,
    audioBlobs,
    audioPaths,
    transcribingAudio,
    recordingErrors,
    toggleRecording,
    resetAll,
  };
}
