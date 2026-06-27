"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise } from "@/lib/types";

type RecordingState = "idle" | "recording" | "done";

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = Number(params.id);

  const [exercise, setExercise] = useState<OralExercise | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const totalQuestions = exercise?.type === "READING" ? 1 : 3;

  const [transcripts, setTranscripts] = useState<string[]>(["", "", ""]);
  const [recordingStates, setRecordingStates] = useState<RecordingState[]>(["idle", "idle", "idle"]);
  const [submitting, setSubmitting] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimRef = useRef("");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data: OralExercise[]) => {
        const ex = data.find((e) => e.id === exerciseId);
        setExercise(ex || null);
        setLoading(false);
      });
  }, [exerciseId]);

  const startRecording = useCallback((questionIdx: number) => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge on mobile.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-SG";

    interimRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      interimRef.current = final;
      setTranscripts((prev) => {
        const next = [...prev];
        next[questionIdx] = (final + interim).trim();
        return next;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        setRecordingStates((prev) => {
          const next = [...prev];
          next[questionIdx] = "done";
          return next;
        });
      }
    };

    recognition.onend = () => {
      setRecordingStates((prev) => {
        const next = [...prev];
        if (next[questionIdx] === "recording") {
          next[questionIdx] = "done";
        }
        return next;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();

    setRecordingStates((prev) => {
      const next = [...prev];
      next[questionIdx] = "recording";
      return next;
    });
  }, []);

  const stopRecording = useCallback((questionIdx: number) => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecordingStates((prev) => {
      const next = [...prev];
      next[questionIdx] = "done";
      return next;
    });
    if (interimRef.current) {
      setTranscripts((prev) => {
        const next = [...prev];
        if (!next[questionIdx]) next[questionIdx] = interimRef.current.trim();
        return next;
      });
    }
  }, []);

  const toggleRecording = useCallback((questionIdx: number) => {
    if (recordingStates[questionIdx] === "recording") {
      stopRecording(questionIdx);
    } else {
      setTranscripts((prev) => {
        const next = [...prev];
        next[questionIdx] = "";
        return next;
      });
      startRecording(questionIdx);
    }
  }, [recordingStates, startRecording, stopRecording]);

  const handleSubmit = async () => {
    if (!exercise) return;
    setSubmitting(true);

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
        }),
      });
      const { id } = await res.json();

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId: id }),
      });
      await evalRes.json();

      router.push(`/results/${id}`);
    } catch (e) {
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
    }
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
              <button className="btn btn-primary" style={{ marginTop: 16, maxWidth: 200 }} onClick={() => router.push("/")}>
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

  const canSubmit = transcripts.slice(0, totalQuestions).some((t) => t.trim().length > 0);

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => {
              recognitionRef.current?.stop();
              router.push("/");
            }}
            style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <div>
            <h1>{exercise.title}</h1>
            <div className="subtitle">
              {isReading ? "Reading Aloud" : "Stimulus-Based Conversation"} · {exercise.difficulty}
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {exercise.preambleText && (
            <div className="info-banner">{exercise.preambleText}</div>
          )}

          {!isReading && exercise.posterDescription && (
            <div className="poster-desc">
              <strong>Visual Stimulus: {exercise.topic}</strong>
              {exercise.posterDescription}
            </div>
          )}

          {isReading ? (
            <>
              <div className="passage-text">{exercise.passageText}</div>
              <div className="section-label">Your Reading</div>
              <RecordingSection
                questionIdx={0}
                state={recordingStates[0]}
                transcript={transcripts[0]}
                onToggle={() => toggleRecording(0)}
              />
            </>
          ) : (
            <>
              <div className="section-label">
                Question {currentQuestion + 1} of {totalQuestions}
              </div>

              <div className="question-block">
                <div className="q-label">Question {currentQuestion + 1}</div>
                <div style={{ fontSize: 15 }}>{questions[currentQuestion]}</div>
              </div>

              <RecordingSection
                questionIdx={currentQuestion}
                state={recordingStates[currentQuestion]}
                transcript={transcripts[currentQuestion]}
                onToggle={() => toggleRecording(currentQuestion)}
              />

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {currentQuestion > 0 && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      recognitionRef.current?.stop();
                      setCurrentQuestion((q) => q - 1);
                    }}
                  >
                    Previous
                  </button>
                )}
                {currentQuestion < totalQuestions - 1 && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      recognitionRef.current?.stop();
                      setCurrentQuestion((q) => q + 1);
                    }}
                  >
                    Next Question
                  </button>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop: 24, paddingBottom: 24 }}>
            <button
              className="btn btn-primary"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Evaluating...
                </>
              ) : (
                "Submit for Evaluation"
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function RecordingSection({
  questionIdx,
  state,
  transcript,
  onToggle,
}: {
  questionIdx: number;
  state: RecordingState;
  transcript: string;
  onToggle: () => void;
}) {
  return (
    <>
      <div className="record-area">
        <button
          className={`btn-record ${state === "recording" ? "recording" : ""}`}
          onClick={onToggle}
        >
          {state === "recording" ? "⏹" : "🎙"}
        </button>
        <div className={`record-status ${state === "recording" ? "active" : ""}`}>
          {state === "idle" && "Tap to start recording"}
          {state === "recording" && "Recording... Tap to stop"}
          {state === "done" && "Recording complete. Tap to re-record"}
        </div>
      </div>

      <div className={`transcript-box ${transcript ? "has-text" : ""}`}>
        {transcript || "Your speech will appear here..."}
      </div>
    </>
  );
}
