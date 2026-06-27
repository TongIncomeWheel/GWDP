"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise } from "@/lib/types";
import NanoBanana from "../../NanoBanana";

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

  const [transcripts, setTranscripts] = useState<string[]>(["", "", ""]);
  const [audioBlobs, setAudioBlobs] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [recordingStates, setRecordingStates] = useState<RecordingState[]>([
    "idle",
    "idle",
    "idle",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [mascotMood, setMascotMood] = useState<"smiling" | "thinking">(
    "smiling"
  );
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const imageGenerationTriggered = useRef(false);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data: OralExercise[]) => {
        const ex = data.find((e) => e.id === exerciseId);
        setExercise(ex || null);
        if (ex?.generatedImageUrl) {
          setPosterImage(ex.generatedImageUrl);
        } else if (ex && ex.type === "STIMULUS" && !imageGenerationTriggered.current) {
          imageGenerationTriggered.current = true;
          autoGenerateImage(ex);
        }
        setLoading(false);
      });
  }, [exerciseId]);

  const totalQuestions = exercise?.type === "READING" ? 1 : 3;

  const startRecording = useCallback(
    async (questionIdx: number) => {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        alert(
          "Speech recognition is not supported in your browser. Please use Chrome or Edge."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioBlobs((prev) => {
              const next = [...prev];
              next[questionIdx] = reader.result as string;
              return next;
            });
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } catch {
        console.warn(
          "Microphone access denied, recording without audio capture"
        );
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-SG";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal)
            final += event.results[i][0].transcript + " ";
          else interim += event.results[i][0].transcript;
        }
        setTranscripts((prev) => {
          const next = [...prev];
          next[questionIdx] = (final + interim).trim();
          return next;
        });
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== "aborted") {
          setRecordingStates((prev) => {
            const n = [...prev];
            n[questionIdx] = "done";
            return n;
          });
        }
      };
      recognition.onend = () => {
        setRecordingStates((prev) => {
          const n = [...prev];
          if (n[questionIdx] === "recording") n[questionIdx] = "done";
          return n;
        });
      };
      recognitionRef.current = recognition;
      recognition.start();
      setRecordingStates((prev) => {
        const n = [...prev];
        n[questionIdx] = "recording";
        return n;
      });
    },
    []
  );

  const stopRecording = useCallback((questionIdx: number) => {
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
        setTranscripts((prev) => {
          const n = [...prev];
          n[questionIdx] = "";
          return n;
        });
        setAudioBlobs((prev) => {
          const n = [...prev];
          n[questionIdx] = null;
          return n;
        });
        startRecording(questionIdx);
      }
    },
    [recordingStates, startRecording, stopRecording]
  );

  const fetchPosterImage = async (ex: OralExercise) => {
    setGeneratingImage(true);
    setImageError("");
    try {
      const res = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: ex.photographDescription || ex.posterDescription,
          exerciseId: ex.id,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setPosterImage(data.imageUrl);
      } else if (data.error) {
        setImageError(data.error);
      }
    } catch {
      setImageError("Network error generating image.");
    }
    setGeneratingImage(false);
  };

  const autoGenerateImage = (ex: OralExercise) => {
    fetchPosterImage(ex);
  };

  const generateImage = () => {
    if (exercise) fetchPosterImage(exercise);
  };

  const allRecorded =
    exercise?.type === "READING"
      ? transcripts[0].trim().length > 0
      : transcripts.slice(0, 3).every((t) => t.trim().length > 0);

  const missingQuestions =
    exercise?.type === "STIMULUS"
      ? [0, 1, 2].filter((i) => !transcripts[i].trim())
      : transcripts[0].trim()
        ? []
        : [0];

  const handleBack = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    if (transcripts.some((t) => t.trim())) {
      if (confirm("You have recordings. Leave without submitting?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async () => {
    if (!exercise || !allRecorded) return;
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
          audioBlob1: audioBlobs[0],
          audioBlob2: audioBlobs[1],
          audioBlob3: audioBlobs[2],
          structuredTranscript1: structuredTranscripts[0],
          structuredTranscript2: structuredTranscripts[1],
          structuredTranscript3: structuredTranscripts[2],
        }),
      });
      const { id } = await res.json();
      await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId: id }),
      });
      router.push(`/results/${id}`);
    } catch {
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
      setMascotMood("smiling");
    }
  };

  const stopAllMedia = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
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
          <NanoBanana mood={mascotMood} compact />

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
                    <NanoBanana mood="thinking" message="Generating your visual stimulus..." compact />
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
            transcripts.some((t) => t.trim()) && (
              <div className="error-banner" style={{ marginTop: 12 }}>
                {isReading
                  ? "Please record your reading before submitting."
                  : `Missing recording for Question${missingQuestions.length > 1 ? "s" : ""} ${missingQuestions.map((i) => i + 1).join(", ")}. All questions must be recorded.`}
              </div>
            )}

          <div style={{ marginTop: 20, paddingBottom: 24 }}>
            <button
              className="btn btn-primary"
              disabled={!allRecorded || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />{" "}
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
