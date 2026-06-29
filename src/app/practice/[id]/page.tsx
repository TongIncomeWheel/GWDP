"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise } from "@/lib/types";
import ReRe from "../../ReRe";

type RecordingState = "idle" | "recording" | "done";

function splitIntoPEEL(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const len = sentences.length;
  if (len <= 1)
    return { point: text, evidence: "", explanation: "", link: "" };
  if (len === 2)
    return {
      point: sentences[0].trim(),
      evidence: "",
      explanation: sentences[1].trim(),
      link: "",
    };
  if (len === 3)
    return {
      point: sentences[0].trim(),
      evidence: sentences[1].trim(),
      explanation: sentences[2].trim(),
      link: "",
    };
  const q = Math.floor(len / 4);
  return {
    point: sentences.slice(0, q).join(" ").trim(),
    evidence: sentences.slice(q, q * 2).join(" ").trim(),
    explanation: sentences.slice(q * 2, q * 3).join(" ").trim(),
    link: sentences.slice(q * 3).join(" ").trim(),
  };
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = Number(params.id);

  const [exercise, setExercise] = useState<OralExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  interface Attempt {
    transcripts: string[];
    audioBlobs: (string | null)[];
    id?: number;
    evaluated?: boolean;
    scores?: { s1: number; s2: number; s3: number; total: number; max: number };
  }

  const [transcripts, setTranscripts] = useState<string[]>(["", "", ""]);
  const [audioBlobs, setAudioBlobs] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [audioPaths, setAudioPaths] = useState<(string | null)[]>([null, null, null]);
  const [uploadingAudio, setUploadingAudio] = useState<boolean[]>([false, false, false]);
  const [transcribingAudio, setTranscribingAudio] = useState<boolean[]>([false, false, false]);
  const [recordingStates, setRecordingStates] = useState<RecordingState[]>([
    "idle",
    "idle",
    "idle",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [mascotMood, setMascotMood] = useState<"smiling" | "thinking">(
    "smiling"
  );

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntentRef = useRef<boolean>(false);
  const speechRestartCountRef = useRef<number>(0);
  // Incremented each time a question re-records — invalidates in-flight upload/transcribe chains
  const recordingVersionRef = useRef<number[]>([0, 0, 0]);
  const [speechWarnings, setSpeechWarnings] = useState<string[]>(["", "", ""]);
  const [speechDiag, setSpeechDiag] = useState<{ event: string; error: string; restarts: number; results: number }[]>([
    { event: "—", error: "—", restarts: 0, results: 0 },
    { event: "—", error: "—", restarts: 0, results: 0 },
    { event: "—", error: "—", restarts: 0, results: 0 },
  ]);

  const imageGenerationTriggered = useRef(false);

  const CACHE_KEY = `poster_img_${exerciseId}`;

  useEffect(() => {
    fetch(`/api/exercises/${exerciseId}`)
      .then((r) => r.json())
      .then((ex: OralExercise & { error?: string }) => {
        if (ex && !ex.error) setExercise(ex);
        else setExercise(null);
        if (ex && !ex.error && ex.type === "STIMULUS") {
          if (ex.generatedImageUrl) {
            // Already persisted in Firestore — use it directly, no API call needed
            setPosterImage(ex.generatedImageUrl);
          } else {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              setPosterImage(cached);
            } else if (!imageGenerationTriggered.current) {
              imageGenerationTriggered.current = true;
              autoGenerateImage(ex);
            }
          }
        }
        setLoading(false);
      });
  }, [exerciseId, CACHE_KEY]);

  const totalQuestions = exercise?.type === "READING" ? 1 : 3;

  const startRecording = useCallback(
    async (questionIdx: number) => {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        alert("Speech recognition is not supported in your browser. Please use Chrome on Android or desktop.");
        return;
      }

      recordingIntentRef.current = true;
      speechRestartCountRef.current = 0;

      setSpeechWarnings((prev) => { const n = [...prev]; n[questionIdx] = ""; return n; });
      setSpeechDiag((prev) => {
        const n = [...prev];
        n[questionIdx] = { event: "starting", error: "—", restarts: 0, results: 0 };
        return n;
      });

      // Android Chrome cannot run SpeechRecognition and MediaRecorder simultaneously —
      // the mic hardware goes exclusively to MediaRecorder and SR gets silence.
      // Android strategy: MediaRecorder captures audio for delivery grading, then after
      // stop the audio is sent to Gemini to transcribe. Transcript appears post-recording.
      // Desktop/iOS strategy: run both simultaneously — live transcript + audio capture.
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (isAndroid) {
        // ── Android: MediaRecorder only, transcribe via Gemini after stop ──
        const myVersion = recordingVersionRef.current[questionIdx];
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.onstop = () => {
            // If the student re-recorded, this version is stale — discard
            if (recordingVersionRef.current[questionIdx] !== myVersion) return;

            const capturedMime = mediaRecorder.mimeType || "audio/webm";
            const blob = new Blob(audioChunksRef.current, { type: capturedMime });
            const reader = new FileReader();
            reader.onloadend = () => {
              if (recordingVersionRef.current[questionIdx] !== myVersion) return;
              const base64 = reader.result as string;
              setAudioBlobs((prev) => { const next = [...prev]; next[questionIdx] = base64; return next; });
              setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });

              fetch("/api/practice/audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: base64, mimeType: capturedMime }),
              })
                .then((r) => r.json())
                .then(async (data) => {
                  if (recordingVersionRef.current[questionIdx] !== myVersion) return;
                  if (data.url) {
                    setAudioPaths((prev) => { const n = [...prev]; n[questionIdx] = data.url; return n; });
                    setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });
                    try {
                      const txRes = await fetch("/api/transcribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ audioUrl: data.url, mimeType: capturedMime }),
                      });
                      const txData = await txRes.json();
                      if (recordingVersionRef.current[questionIdx] !== myVersion) return;
                      if (txData.transcript) {
                        setTranscripts((prev) => {
                          const next = [...prev];
                          next[questionIdx] = txData.transcript;
                          return next;
                        });
                      }
                    } catch {
                      // transcription failed — Gemini will still evaluate from audio
                    } finally {
                      if (recordingVersionRef.current[questionIdx] === myVersion) {
                        setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
                      }
                    }
                  }
                })
                .catch(() => {})
                .finally(() => {
                  if (recordingVersionRef.current[questionIdx] === myVersion) {
                    setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
                  }
                });
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach((t) => t.stop());
          };
          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
        } catch {
          setSpeechWarnings((prev) => {
            const n = [...prev];
            n[questionIdx] = "Microphone access denied.";
            return n;
          });
          setRecordingStates((prev) => { const n = [...prev]; n[questionIdx] = "done"; return n; });
          return;
        }
      } else {
        // ── Desktop / iOS: SpeechRecognition (live transcript) + MediaRecorder ──
        const makeSpeechInstance = () => {
          const r = new SpeechRecognitionClass();
          r.continuous = true;
          r.interimResults = true;
          r.lang = "en-US";
          return r;
        };

        let finalTranscript = "";

        const onresult = (event: SpeechRecognitionEvent) => {
          setSpeechWarnings((prev) => { const n = [...prev]; n[questionIdx] = ""; return n; });
          setSpeechDiag((prev) => {
            const n = [...prev];
            n[questionIdx] = { ...n[questionIdx], event: "onresult", results: n[questionIdx].results + 1 };
            return n;
          });
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal)
              finalTranscript += event.results[i][0].transcript + " ";
            else interim += event.results[i][0].transcript;
          }
          setTranscripts((prev) => {
            const next = [...prev];
            next[questionIdx] = (finalTranscript + interim).trim();
            return next;
          });
        };

        const onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("[SpeechRecognition] error:", event.error);
          setSpeechDiag((prev) => {
            const n = [...prev];
            n[questionIdx] = { ...n[questionIdx], event: "onerror", error: event.error };
            return n;
          });
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            recordingIntentRef.current = false;
            setSpeechWarnings((prev) => {
              const n = [...prev];
              n[questionIdx] = "Microphone permission denied.";
              return n;
            });
          } else if (event.error !== "aborted") {
            setSpeechWarnings((prev) => {
              const n = [...prev];
              n[questionIdx] = "Transcript interrupted — audio still recording.";
              return n;
            });
          }
        };

        const onend = () => {
          setSpeechDiag((prev) => {
            const n = [...prev];
            n[questionIdx] = { ...n[questionIdx], event: "onend" };
            return n;
          });
          if (!recordingIntentRef.current) return;
          if (speechRestartCountRef.current < 100) {
            speechRestartCountRef.current += 1;
            setTimeout(() => {
              if (!recordingIntentRef.current) return;
              try {
                const newR = makeSpeechInstance();
                newR.onresult = onresult;
                newR.onerror = onerror;
                newR.onend = onend;
                recognitionRef.current = newR;
                newR.start();
              } catch { /* ignore */ }
            }, 300);
          }
        };

        const recognition = makeSpeechInstance();
        recognition.onresult = onresult;
        recognition.onerror = onerror;
        recognition.onend = onend;
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { /* ignore */ }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.onstop = () => {
            const capturedMime = mediaRecorder.mimeType || "audio/webm";
            const blob = new Blob(audioChunksRef.current, { type: capturedMime });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              setAudioBlobs((prev) => { const next = [...prev]; next[questionIdx] = base64; return next; });
              setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = true; return n; });
              setAudioPaths((prev) => { const n = [...prev]; n[questionIdx] = null; return n; });
              fetch("/api/practice/audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: base64, mimeType: capturedMime }),
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.url) {
                    setAudioPaths((prev) => { const n = [...prev]; n[questionIdx] = data.url; return n; });
                  }
                })
                .catch(() => {})
                .finally(() => {
                  setUploadingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
                });
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach((t) => t.stop());
          };
          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
        } catch {
          console.warn("MediaRecorder failed — transcript only");
        }
      }

      setRecordingStates((prev) => {
        const n = [...prev]; n[questionIdx] = "recording"; return n;
      });
    },
    []
  );

  const stopRecording = useCallback((questionIdx: number) => {
    recordingIntentRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecordingStates((prev) => {
      const n = [...prev];
      n[questionIdx] = "done";
      return n;
    });
  }, []);

  const toggleRecording = useCallback(
    (questionIdx: number) => {
      if (recordingStates[questionIdx] === "recording") {
        stopRecording(questionIdx);
      } else {
        recordingVersionRef.current[questionIdx]++;
        setTranscripts((prev) => { const n = [...prev]; n[questionIdx] = ""; return n; });
        setAudioBlobs((prev) => { const n = [...prev]; n[questionIdx] = null; return n; });
        setAudioPaths((prev) => { const n = [...prev]; n[questionIdx] = null; return n; });
        setSpeechWarnings((prev) => { const n = [...prev]; n[questionIdx] = ""; return n; });
        setTranscribingAudio((prev) => { const n = [...prev]; n[questionIdx] = false; return n; });
        startRecording(questionIdx);
      }
    },
    [recordingStates, startRecording, stopRecording]
  );

  const fetchPosterImage = async (ex: OralExercise, force = false, pollCount = 0) => {
    if (pollCount === 0) {
      setGeneratingImage(true);
      setImageError("");
    }
    try {
      const res = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: ex.photographDescription || ex.posterDescription,
          exerciseId: ex.id,
          force,
        }),
      });
      const data = await res.json();
      if (data.generating) {
        // Another device is generating — poll every 3s until it's ready (max 30s)
        if (pollCount < 10) {
          setTimeout(() => fetchPosterImage(ex, false, pollCount + 1), 3000);
        } else {
          setImageError("Image is being generated on another device. Reload to see it.");
          setGeneratingImage(false);
        }
        return;
      }
      if (data.imageUrl) {
        setPosterImage(data.imageUrl);
        try {
          localStorage.setItem(CACHE_KEY, data.imageUrl);
        } catch {
          // localStorage quota exceeded — still show image, just won't cache
        }
      } else if (data.error) {
        setImageError(data.error);
      }
    } catch {
      setImageError("Network error generating image.");
    }
    setGeneratingImage(false);
  };

  const autoGenerateImage = (ex: OralExercise) => {
    fetchPosterImage(ex, false);
  };

  const generateImage = () => {
    if (exercise) {
      localStorage.removeItem(CACHE_KEY);
      fetchPosterImage(exercise, true);
    }
  };

  const uploadsComplete = uploadingAudio.every((u) => !u);
  const transcriptReady = transcribingAudio.every((t) => !t);
  const allRecorded =
    (exercise?.type === "READING"
      ? recordingStates[0] === "done"
      : recordingStates.slice(0, 3).every((s) => s === "done")) && uploadsComplete && transcriptReady;

  const missingQuestions =
    exercise?.type === "STIMULUS"
      ? [0, 1, 2].filter((i) => recordingStates[i] !== "done")
      : recordingStates[0] === "done"
        ? []
        : [0];

  const handleBack = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    const hasAnything = transcripts.some((t) => t.trim()) || recordingStates.some((s) => s === "done");
    if (hasAnything) {
      if (confirm("You have recordings. Leave without submitting?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const handleSaveAttempt = async () => {
    if (!exercise || !allRecorded) return;
    if (attempts.length >= 3) {
      alert("Maximum 3 attempts reached. Please confirm one to submit.");
      return;
    }
    setSubmitting(true);
    setMascotMood("thinking");

    const structuredTranscripts =
      exercise.type === "STIMULUS"
        ? transcripts.map((t) =>
            t
              ? JSON.stringify({
                  ...splitIntoPEEL(t),
                  rawText: t,
                  framework: "PEEL",
                })
              : null
          )
        : [null, null, null];

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          exerciseType: exercise.type,
          exerciseTopic: exercise.topic,
          transcript1: transcripts[0] || null,
          transcript2: transcripts[1] || null,
          transcript3: transcripts[2] || null,
          audioPath1: audioPaths[0] || null,
          audioPath2: audioPaths[1] || null,
          audioPath3: audioPaths[2] || null,
          structuredTranscript1: structuredTranscripts[0],
          structuredTranscript2: structuredTranscripts[1],
          structuredTranscript3: structuredTranscripts[2],
        }),
      });
      if (!res.ok) throw new Error(`Failed to save practice session (${res.status})`);
      const { id } = await res.json();
      if (!id) throw new Error("No session ID returned from server");

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId: id }),
      });
      const evalData = await evalRes.json();

      const newAttempt: Attempt = {
        transcripts: [...transcripts],
        audioBlobs: [...audioBlobs],
        id,
        evaluated: evalData.isEvaluated,
        scores: evalData.isEvaluated ? {
          s1: evalData.score1, s2: evalData.score2, s3: evalData.score3,
          total: evalData.totalScore, max: evalData.maxScore,
        } : undefined,
      };
      setAttempts((prev) => [...prev, newAttempt]);
      setSelectedAttempt(attempts.length);
      setTranscripts(["", "", ""]);
      setAudioBlobs([null, null, null]);
      setAudioPaths([null, null, null]);
      setUploadingAudio([false, false, false]);
      setTranscribingAudio([false, false, false]);
      setSpeechWarnings(["", "", ""]);
      setRecordingStates(["idle", "idle", "idle"]);
      recordingVersionRef.current = [0, 0, 0];
      setMascotMood("smiling");

      if (attempts.length >= 2) {
        setConfirming(true);
      }
    } catch {
      alert("Failed to submit. Please try again.");
      setMascotMood("smiling");
    }
    setSubmitting(false);
  };

  const handleConfirmAttempt = async (attemptIdx: number) => {
    const chosen = attempts[attemptIdx];
    if (!chosen?.id) return;
    setConfirming(false);

    const toDelete = attempts.filter((_, i) => i !== attemptIdx && _.id);
    for (const a of toDelete) {
      await fetch(`/api/practice?id=${a.id}`, { method: "DELETE" }).catch(() => {});
    }

    router.push(`/results/${chosen.id}`);
  };

  const stopAllMedia = () => {
    recordingIntentRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h1>Loading...</h1>
        </header>
        <main>
          <div className="container">
            <div className="loading">
              <div className="spinner" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!exercise) {
    return (
      <>
        <header className="page-header">
          <h1>Not Found</h1>
        </header>
        <main>
          <div className="container" style={{ paddingTop: 20 }}>
            <div className="empty-state">
              <p>Exercise not found.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, maxWidth: 200 }}
                onClick={() => router.push("/")}
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const isReading = exercise.type === "READING";
  const questions = isReading
    ? [exercise.passageText]
    : [exercise.question1, exercise.question2, exercise.question3];

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              padding: 0,
            }}
          >
            &#x2190;
          </button>
          <div>
            <h1>{exercise.title}</h1>
            <div className="subtitle">
              {isReading ? "Reading Aloud" : "Stimulus-Based Conversation"}{" "}
              &middot; {exercise.difficulty}
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 12 }}>
          <ReRe mood={mascotMood} compact />

          {exercise.preambleText && (
            <div className="info-banner">{exercise.preambleText}</div>
          )}

          {!isReading &&
            (exercise.photographDescription || exercise.posterDescription) && (
              <>
                {posterImage ? (
                  <div className="poster-image-area">
                    <img src={posterImage} alt="Visual stimulus" />
                    <button
                      className="regenerate-btn"
                      onClick={generateImage}
                      disabled={generatingImage}
                    >
                      {generatingImage ? "Generating..." : "Regenerate"}
                    </button>
                  </div>
                ) : generatingImage ? (
                  <div className="poster-image-area" style={{
                    flexDirection: "column",
                    gap: 12,
                    padding: 24,
                  }}>
                    <ReRe mood="thinking" message="Generating your visual stimulus..." compact />
                    <div className="spinner" />
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      This may take a few seconds...
                    </div>
                  </div>
                ) : (
                  <div className="poster-desc">
                    <strong>Visual Stimulus: {exercise.topic}</strong>
                    {exercise.photographDescription ||
                      exercise.posterDescription}
                    {imageError && (
                      <div style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--coral)",
                        padding: "6px 10px",
                        background: "var(--coral-soft)",
                        borderRadius: 8,
                      }}>
                        {imageError}
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={generateImage}
                        style={{ width: "auto" }}
                      >
                        {imageError ? "Retry Image Generation" : "Generate Image"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          {isReading ? (
            <>
              <div className="passage-text">{exercise.passageText}</div>
              {exercise.readingTips && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 6,
                    fontStyle: "italic",
                  }}
                >
                  Tips: {exercise.readingTips}
                </div>
              )}
              <div className="section-label">Your Reading</div>
              <RecordingSection
                idx={0}
                state={recordingStates[0]}
                transcript={transcripts[0]}
                audio={audioBlobs[0]}
                onToggle={() => toggleRecording(0)}
              />
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 0",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    onClick={() => {
                      stopAllMedia();
                      setCurrentQuestion(i);
                    }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      cursor: "pointer",
                      background:
                        i === currentQuestion
                          ? "var(--primary)"
                          : transcripts[i].trim()
                            ? "var(--success)"
                            : "var(--border)",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
              <div className="section-label">
                Question {currentQuestion + 1} of 3
              </div>
              <div className="question-block">
                <div className="q-label">
                  {exercise.sbcQ1Type && currentQuestion === 0
                    ? "Picture Inference"
                    : currentQuestion === 1
                      ? "Personal Experience"
                      : "Opinion"}
                </div>
                <div style={{ fontSize: 15 }}>{questions[currentQuestion]}</div>
              </div>
              <RecordingSection
                idx={currentQuestion}
                state={recordingStates[currentQuestion]}
                transcript={transcripts[currentQuestion]}
                audio={audioBlobs[currentQuestion]}
                onToggle={() => toggleRecording(currentQuestion)}
                isStimulus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {currentQuestion > 0 && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      stopAllMedia();
                      setCurrentQuestion((q) => q - 1);
                    }}
                  >
                    Previous
                  </button>
                )}
                {currentQuestion < 2 && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      stopAllMedia();
                      setCurrentQuestion((q) => q + 1);
                    }}
                  >
                    Next Question
                  </button>
                )}
              </div>
            </>
          )}

          {missingQuestions.length > 0 &&
            recordingStates.some((s) => s === "done") && (
              <div className="error-banner" style={{ marginTop: 12 }}>
                {isReading
                  ? "Please record your reading before submitting."
                  : `Still need to record Question${missingQuestions.length > 1 ? "s" : ""} ${missingQuestions.map((i) => i + 1).join(", ")}.`}
              </div>
            )}

          {/* Transcribing status (Android post-recording) */}
          {transcribingAudio[isReading ? 0 : currentQuestion] && (
            <div className="error-banner" style={{ marginTop: 8, background: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.35)", color: "var(--primary)" }}>
              ⏳ Transcribing your recording…
            </div>
          )}

          {/* Speech recognition warning */}
          {speechWarnings[isReading ? 0 : currentQuestion] && (
            <div className="error-banner" style={{ marginTop: 8, background: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.35)", color: "var(--gold)" }}>
              ⚠️ {speechWarnings[isReading ? 0 : currentQuestion]}
            </div>
          )}

          {/* Speech diagnostics — visible when recording or after, helps diagnose Android issues */}
          {speechDiag[isReading ? 0 : currentQuestion].event !== "—" && (
            <div style={{
              marginTop: 6,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "monospace",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}>
              {(() => {
                const d = speechDiag[isReading ? 0 : currentQuestion];
                return (
                  <>
                    <span>event: <b style={{ color: "var(--text-primary)" }}>{d.event}</b></span>
                    <span>error: <b style={{ color: d.error !== "—" ? "var(--coral)" : "var(--text-primary)" }}>{d.error}</b></span>
                    <span>restarts: <b style={{ color: "var(--text-primary)" }}>{d.restarts}</b></span>
                    <span>results: <b style={{ color: d.results > 0 ? "var(--teal)" : "var(--text-primary)" }}>{d.results}</b></span>
                  </>
                );
              })()}
            </div>
          )}

          {/* Previous attempts */}
          {attempts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="section-label">
                Your Attempts ({attempts.length}/3)
              </div>
              {attempts.map((a, i) => (
                <div key={i} className="card" style={{
                  padding: "10px 14px",
                  marginBottom: 8,
                  borderLeft: `3px solid ${selectedAttempt === i ? "var(--purple-glow)" : "var(--border)"}`,
                  cursor: "pointer",
                  opacity: confirming && selectedAttempt !== i ? 0.7 : 1,
                }} onClick={() => setSelectedAttempt(i)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        Attempt {i + 1}
                      </span>
                      {a.scores && (
                        <span style={{ fontSize: 12, color: "var(--teal)", marginLeft: 8 }}>
                          {a.scores.total}/{a.scores.max}
                        </span>
                      )}
                    </div>
                    {confirming && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: "auto", padding: "4px 14px", fontSize: 12 }}
                        onClick={(e) => { e.stopPropagation(); handleConfirmAttempt(i); }}
                      >
                        Confirm This
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {a.transcripts[0].slice(0, 80)}{a.transcripts[0].length > 80 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirming state */}
          {confirming && (
            <div className="info-banner" style={{ marginTop: 12 }}>
              Select which attempt to keep. The others will be deleted.
            </div>
          )}

          <div style={{ marginTop: 20, paddingBottom: 24 }}>
            {!confirming && attempts.length < 3 && (
              <button
                className="btn btn-primary"
                disabled={!allRecorded || submitting}
                onClick={handleSaveAttempt}
              >
                {submitting ? (
                  <>
                    <div
                      className="spinner"
                      style={{ width: 20, height: 20, borderWidth: 2 }}
                    />{" "}
                    Evaluating...
                  </>
                ) : uploadingAudio.some((u) => u) ? (
                  "Uploading audio..."
                ) : transcribingAudio.some((t) => t) ? (
                  "Transcribing..."
                ) : attempts.length === 0 ? (
                  "Submit Attempt 1"
                ) : (
                  `Submit Attempt ${attempts.length + 1} (${3 - attempts.length} left)`
                )}
              </button>
            )}
            {attempts.length > 0 && !confirming && (
              <button
                className="btn btn-outline"
                style={{ marginTop: 8 }}
                onClick={() => {
                  if (attempts.length === 1) {
                    handleConfirmAttempt(0);
                  } else {
                    setConfirming(true);
                  }
                }}
              >
                Confirm & Finish ({attempts.length} attempt{attempts.length !== 1 ? "s" : ""})
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function RecordingSection({
  idx,
  state,
  transcript,
  audio,
  onToggle,
  isStimulus,
}: {
  idx: number;
  state: RecordingState;
  transcript: string;
  audio: string | null;
  onToggle: () => void;
  isStimulus?: boolean;
}) {
  const peel = isStimulus && transcript ? splitIntoPEEL(transcript) : null;
  return (
    <>
      <div className="record-area">
        <button
          className={`btn-record ${state === "recording" ? "recording" : ""}`}
          onClick={onToggle}
        >
          {state === "recording" ? "⏹" : "🎤"}
        </button>
        <div
          className={`record-status ${state === "recording" ? "active" : ""}`}
        >
          {state === "idle" && "Tap to start recording"}
          {state === "recording" && "Recording... Tap to stop"}
          {state === "done" && "Recording complete. Tap to re-record"}
        </div>
      </div>
      <div className={`transcript-box ${transcript ? "has-text" : ""}`}>
        {transcript || "Your speech will appear here..."}
      </div>
      {audio && (
        <div className="audio-player-mini">
          <audio controls src={audio} style={{ width: "100%", height: 32 }} />
        </div>
      )}
      {peel && transcript && (
        <div className="structured-transcript">
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
              color: "var(--text-muted)",
            }}
          >
            PEEL Framework Analysis
          </div>
          {peel.point && (
            <div className="st-section st-peel">
              <div className="st-label">Point</div>
              <div className="st-text">{peel.point}</div>
            </div>
          )}
          {peel.evidence && (
            <div className="st-section st-evidence">
              <div className="st-label">Evidence / Experience</div>
              <div className="st-text">{peel.evidence}</div>
            </div>
          )}
          {peel.explanation && (
            <div className="st-section st-explain">
              <div className="st-label">Explanation</div>
              <div className="st-text">{peel.explanation}</div>
            </div>
          )}
          {peel.link && (
            <div className="st-section st-link">
              <div className="st-label">Link</div>
              <div className="st-text">{peel.link}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
