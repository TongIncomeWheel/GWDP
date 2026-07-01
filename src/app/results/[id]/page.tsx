"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PracticeHistory } from "@/lib/types";
import ReRe from "../../ReRe";
import AudioPlayer from "../../AudioPlayer";
import { ScoreRow } from "@/components/ScoreRow";
import { StructuredTranscriptView } from "@/components/StructuredTranscriptView";
import { resolveAudioSrc } from "@/lib/audio";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = Number(params.id);

  const [history, setHistory] = useState<PracticeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetchHistory = useCallback(() => {
    fetch(`/api/practice?id=${historyId}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [historyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClose = async () => {
    if (!history || closing) return;
    setClosing(true);
    try {
      const res = await fetch("/api/practice/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: history.id }),
      });
      if (res.ok) {
        setHistory((prev) => (prev ? { ...prev, isClosed: true } : prev));
      }
    } catch {
      // ignore
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h1>Loading Results...</h1>
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

  if (!history) {
    return (
      <>
        <header className="page-header">
          <h1>Not Found</h1>
        </header>
        <main>
          <div className="container" style={{ paddingTop: 20 }}>
            <div className="empty-state">
              <p>Results not found.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
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

  const isReading = history.exerciseType === "READING";
  const percentage =
    history.maxScore > 0
      ? Math.round((history.totalScore / history.maxScore) * 100)
      : 0;
  const scoreClass =
    percentage >= 70 ? "score-high" : percentage >= 50 ? "score-mid" : "score-low";
  const bananaMood: "cheering" | "encouraging" | "confused" =
    percentage >= 70 ? "cheering" : percentage >= 50 ? "encouraging" : "confused";

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              padding: 0,
            }}
          >
            &larr;
          </button>
          <div>
            <h1>Results</h1>
            <div className="subtitle">{history.exerciseTitle}</div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {/* ReRe mascot at top */}
          <ReRe mood={bananaMood} />

          {/* Exercise completed badge */}
          {history.isClosed && (
            <div
              style={{
                textAlign: "center",
                margin: "8px 0",
                padding: "6px 12px",
                background: "var(--teal-soft)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--teal)",
                border: "1px solid rgba(45,212,191,0.25)",
              }}
            >
              Exercise completed
            </div>
          )}

          {history.errorMessage && (
            <div className="info-banner" style={{ marginTop: 12 }}>
              {history.errorMessage}
            </div>
          )}

          {/* Score circle */}
          <div className="card" style={{ textAlign: "center" }}>
            <div
              className={`score-circle ${scoreClass}`}
              style={{ marginBottom: 12 }}
            >
              <span className="score-value">{history.totalScore}</span>
              <span className="score-max">/ {history.maxScore}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {percentage}% &mdash;{" "}
              {percentage >= 70
                ? "Well Done!"
                : percentage >= 50
                  ? "Good Effort!"
                  : "Keep Practising!"}
            </div>
            {history.parentTotalScore != null && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--purple-soft)",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Parent Score: {history.parentTotalScore}
              </div>
            )}
          </div>

          {/* AI Score Breakdown */}
          <div className="card">
            <div className="card-title">Score Breakdown</div>
            <div style={{ marginTop: 8 }}>
              <ScoreRow
                label={
                  isReading
                    ? "Pronunciation & Articulation"
                    : "Question 1"
                }
                score={history.score1}
              />
              <ScoreRow
                label={
                  isReading
                    ? "Rhythm, Fluency & Expressiveness"
                    : "Question 2"
                }
                score={history.score2}
              />
              {!isReading && (
                <ScoreRow
                  label="Question 3"
                  score={history.score3}
                />
              )}
            </div>
          </div>

          {/* Parent's Assessment card */}
          {history.parentScore1 != null && (
            <div
              className="card"
              style={{
                border: "2px solid var(--purple-glow)",
                background: "rgba(139,92,246,0.08)",
              }}
            >
              <div className="card-title">
                Parent&apos;s Assessment
              </div>
              <div style={{ marginTop: 8 }}>
                <ScoreRow
                  label={
                    isReading
                      ? "Pronunciation & Articulation"
                      : "Question 1"
                  }
                  score={history.parentScore1}
                />
                {history.parentScore2 != null && (
                  <ScoreRow
                    label={
                      isReading
                        ? "Rhythm, Fluency & Expressiveness"
                        : "Question 2"
                    }
                    score={history.parentScore2}
                  />
                )}
                {!isReading && history.parentScore3 != null && (
                  <ScoreRow
                    label="Question 3"
                    score={history.parentScore3}
                  />
                )}
                {history.parentTotalScore != null && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--purple-soft)",
                    }}
                  >
                    Parent Total: {history.parentTotalScore} / {history.maxScore}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parent Feedback */}
          {history.parentFeedback && (
            <div
              className="card feedback-section"
              style={{
                border: "2px solid var(--purple-glow)",
                background: "rgba(139,92,246,0.08)",
              }}
            >
              <h3 style={{ color: "var(--purple-soft)" }}>
                Parent&apos;s Feedback
              </h3>
              <p style={{ fontSize: 13 }}>{history.parentFeedback}</p>
            </div>
          )}

          {/* Audio Playback */}
          <div className="card">
            <div className="card-title">Your Recordings</div>
            {isReading ? (
              resolveAudioSrc(history.audioPath1, null) ? (
                <AudioPlayer src={resolveAudioSrc(history.audioPath1, null)!} label="Reading" />
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                  No recording available for this session.
                </div>
              )
            ) : (
              <>
                {resolveAudioSrc(history.audioPath1, null) ? (
                  <AudioPlayer src={resolveAudioSrc(history.audioPath1, null)!} label="Response 1" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
                    No recording for Response 1.
                  </div>
                )}
                {resolveAudioSrc(history.audioPath2, null) ? (
                  <AudioPlayer src={resolveAudioSrc(history.audioPath2, null)!} label="Response 2" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
                    No recording for Response 2.
                  </div>
                )}
                {resolveAudioSrc(history.audioPath3, null) ? (
                  <AudioPlayer src={resolveAudioSrc(history.audioPath3, null)!} label="Response 3" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
                    No recording for Response 3.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Structured Transcripts with PEEL breakdown */}
          {(history.structuredTranscript1 ||
            history.structuredTranscript2 ||
            history.structuredTranscript3) && (
            <div className="card feedback-section">
              <h3>Structured Analysis</h3>
              <StructuredTranscriptView
                raw={history.structuredTranscript1}
                label={isReading ? "Reading" : "Response 1"}
              />
              {!isReading && (
                <StructuredTranscriptView
                  raw={history.structuredTranscript2}
                  label="Response 2"
                />
              )}
              {!isReading && (
                <StructuredTranscriptView
                  raw={history.structuredTranscript3}
                  label="Response 3"
                />
              )}
            </div>
          )}

          {/* General Feedback */}
          {history.generalFeedback && (
            <div className="card feedback-section">
              <h3>General Feedback</h3>
              <p>{history.generalFeedback}</p>
            </div>
          )}

          {/* Strengths */}
          {history.strengths && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--success)" }}>Strengths</h3>
              <ul>
                {history.strengths
                  .split("\n")
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>{s.replace(/^-\s*/, "")}</li>
                  ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {history.areasOfImprovement && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--warning)" }}>Areas for Improvement</h3>
              <ul>
                {history.areasOfImprovement
                  .split("\n")
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>{s.replace(/^-\s*/, "")}</li>
                  ))}
              </ul>
            </div>
          )}

          {/* Model Answers */}
          {history.modelAnswer1 && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--success)" }}>
                {isReading ? "Model Reading" : "Model Answer — Q1"}
              </h3>
              <div className="model-answer">{history.modelAnswer1}</div>
            </div>
          )}

          {!isReading && history.modelAnswer2 && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--success)" }}>Model Answer — Q2</h3>
              <div className="model-answer">{history.modelAnswer2}</div>
            </div>
          )}

          {!isReading && history.modelAnswer3 && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--success)" }}>Model Answer — Q3</h3>
              <div className="model-answer">{history.modelAnswer3}</div>
            </div>
          )}

          {/* Your Responses (plain transcripts) */}
          {(history.transcript1 ||
            history.transcript2 ||
            history.transcript3) && (
            <div className="card feedback-section">
              <h3>Your Responses</h3>
              {history.transcript1 && (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    {isReading ? "Your Reading:" : "Response 1:"}
                  </div>
                  <div className="transcript-box has-text">
                    {history.transcript1}
                  </div>
                </div>
              )}
              {!isReading && history.transcript2 && (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    Response 2:
                  </div>
                  <div className="transcript-box has-text">
                    {history.transcript2}
                  </div>
                </div>
              )}
              {!isReading && history.transcript3 && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    Response 3:
                  </div>
                  <div className="transcript-box has-text">
                    {history.transcript3}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              paddingBottom: 8,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            {!history.isClosed && history.isEvaluated && (
              <button
                className="btn btn-outline"
                disabled={closing}
                onClick={handleClose}
                style={{
                  borderColor: "var(--success)",
                  color: "var(--success)",
                }}
              >
                {closing ? "Closing..." : "Close Exercise"}
              </button>
            )}
            <button
              className="btn btn-outline"
              onClick={() => router.push(`/practice/${history.exerciseId}`)}
            >
              Try Again
            </button>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/")}
            >
              Home
            </button>
            <button
              className="btn btn-outline"
              onClick={() => router.push(`/parent/session/${history.id}`)}
              style={{
                borderColor: "var(--primary)",
                color: "var(--primary)",
              }}
            >
              View as Parent
            </button>
          </div>

          <div style={{ paddingBottom: 24 }} />
        </div>
      </main>
    </>
  );
}

