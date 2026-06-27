"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise, PracticeHistory, StructuredTranscript } from "@/lib/types";

export default function ParentSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const [history, setHistory] = useState<PracticeHistory | null>(null);
  const [exercise, setExercise] = useState<OralExercise | null>(null);
  const [loading, setLoading] = useState(true);

  // Parent grading state
  const [parentScore1, setParentScore1] = useState(5);
  const [parentScore2, setParentScore2] = useState(5);
  const [parentScore3, setParentScore3] = useState(5);
  const [parentFeedback, setParentFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const pin = localStorage.getItem("parentPin");
    if (!pin) {
      router.push("/parent");
      return;
    }

    Promise.all([
      fetch(`/api/practice?id=${sessionId}`).then((r) => r.json()),
      fetch("/api/exercises").then((r) => r.json()),
    ])
      .then(([historyData, exercisesData]: [PracticeHistory, OralExercise[]]) => {
        setHistory(historyData);
        if (historyData.parentScore1 != null) setParentScore1(historyData.parentScore1);
        if (historyData.parentScore2 != null) setParentScore2(historyData.parentScore2);
        if (historyData.parentScore3 != null) setParentScore3(historyData.parentScore3);
        if (historyData.parentFeedback) setParentFeedback(historyData.parentFeedback);
        const ex = exercisesData.find((e) => e.id === historyData.exerciseId);
        if (ex) setExercise(ex);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId, router]);

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

  if (!history) {
    return (
      <>
        <header className="page-header">
          <h1>Not Found</h1>
        </header>
        <main>
          <div className="container" style={{ paddingTop: 20 }}>
            <div className="empty-state">
              <p>Session not found.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => router.push("/parent")}
              >
                Back to Dashboard
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

  const sliderLabels = isReading
    ? ["Pronunciation & Articulation", "Rhythm, Fluency & Expressiveness"]
    : ["Personal Response", "Clarity of Expression", "Engagement in Conversation"];

  const parentTotal = isReading
    ? parentScore1 + parentScore2
    : parentScore1 + parentScore2 + parentScore3;

  const handleSaveGrade = async () => {
    if (!history) return;
    setSaving(true);
    setSaveMsg("");

    const updated = {
      ...history,
      parentScore1,
      parentScore2,
      parentScore3: isReading ? 0 : parentScore3,
      parentFeedback,
      parentTotalScore: parentTotal,
    };

    try {
      const res = await fetch("/api/practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setSaveMsg("Saved!");
        setHistory(updated);
      } else {
        setSaveMsg("Error saving. Try again.");
      }
    } catch {
      setSaveMsg("Error saving. Try again.");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleCloseExercise = async () => {
    if (!confirm("Close this exercise? It will be archived and removed from the student's active list."))
      return;
    setClosing(true);
    try {
      await fetch(`/api/practice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, isClosed: true }),
      });
      setHistory((prev) => prev ? { ...prev, isClosed: true } : prev);
    } catch {
      alert("Failed to close exercise.");
    }
    setClosing(false);
  };

  const handleReopenExercise = async () => {
    try {
      await fetch(`/api/practice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, isClosed: false }),
      });
      setHistory((prev) => prev ? { ...prev, isClosed: false } : prev);
    } catch {
      alert("Failed to reopen exercise.");
    }
  };

  const handleDeleteRecordings = async () => {
    if (!confirm("Delete all recordings for this session? This cannot be undone."))
      return;
    setDeleting(true);
    try {
      await fetch(`/api/practice/recordings?id=${sessionId}`, {
        method: "DELETE",
      });
      setHistory({
        ...history,
        audioBlob1: null,
        audioBlob2: null,
        audioBlob3: null,
        structuredTranscript1: null,
        structuredTranscript2: null,
        structuredTranscript3: null,
      });
    } catch {
      // ignore
    }
    setDeleting(false);
  };

  const parseTranscript = (raw: string | null): StructuredTranscript | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StructuredTranscript;
    } catch {
      return null;
    }
  };

  const renderAudio = (blob: string | null, label: string) => {
    if (!blob) return null;
    return (
      <div className="audio-player-mini">
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <audio controls preload="none" style={{ flex: 1, height: 32 }}>
          <source src={blob} />
        </audio>
      </div>
    );
  };

  const renderStructuredTranscript = (raw: string | null, label: string) => {
    const st = parseTranscript(raw);
    if (!st) return null;
    return (
      <div className="structured-transcript">
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
          {label} - {st.framework} Framework
        </div>
        <div className="st-section st-peel">
          <div className="st-label">Point</div>
          <div className="st-text">{st.point}</div>
        </div>
        <div className="st-section st-evidence">
          <div className="st-label">Evidence</div>
          <div className="st-text">{st.evidence}</div>
        </div>
        <div className="st-section st-explain">
          <div className="st-label">Explanation</div>
          <div className="st-text">{st.explanation}</div>
        </div>
        <div className="st-section st-link">
          <div className="st-label">Link</div>
          <div className="st-text">{st.link}</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 10,
              background:
                st.overallCoherence === "strong"
                  ? "#D1FAE5"
                  : st.overallCoherence === "moderate"
                  ? "#FEF3C7"
                  : "#FEE2E2",
              color:
                st.overallCoherence === "strong"
                  ? "#065F46"
                  : st.overallCoherence === "moderate"
                  ? "#92400E"
                  : "#991B1B",
            }}
          >
            Coherence: {st.overallCoherence}
          </span>
        </div>
        {st.vocabularyHighlights.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <strong>Vocabulary:</strong> {st.vocabularyHighlights.join(", ")}
          </div>
        )}
        {st.grammarNotes.length > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
            <strong>Grammar:</strong> {st.grammarNotes.join("; ")}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/parent")}
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
            <h1>Session Detail</h1>
            <div className="subtitle">{history.exerciseTitle}</div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {/* Score Overview */}
          <div className="card" style={{ textAlign: "center" }}>
            <div
              className={`score-circle ${scoreClass}`}
              style={{ marginBottom: 12 }}
            >
              <span className="score-value">{history.totalScore}</span>
              <span className="score-max">/ {history.maxScore}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              AI Score: {percentage}%
            </div>
            {history.parentTotalScore != null && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--primary)",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Parent Score: {history.parentTotalScore}
              </div>
            )}
          </div>

          {/* Exercise Context */}
          {exercise && (
            <div className="card">
              <div className="card-title">
                {isReading ? "Reading Passage" : "Stimulus-Based Conversation"}
              </div>
              <div className="flex-badges" style={{ marginBottom: 10 }}>
                <span className={`badge ${isReading ? "badge-reading" : "badge-stimulus"}`}>
                  {isReading ? "📖 Reading Aloud" : "🖼️ SBC"}
                </span>
                <span className="badge badge-difficulty">{exercise.difficulty}</span>
              </div>

              {isReading && exercise.passageText && (
                <div className="passage-text" style={{ fontSize: 13, lineHeight: 1.7 }}>
                  {exercise.passageText}
                </div>
              )}

              {!isReading && (
                <>
                  {exercise.generatedImageUrl && (
                    <div className="poster-image-area" style={{ marginBottom: 12 }}>
                      <img src={exercise.generatedImageUrl} alt="Visual stimulus" />
                    </div>
                  )}
                  {!exercise.generatedImageUrl && exercise.photographDescription && (
                    <div className="poster-desc" style={{ marginBottom: 12 }}>
                      <strong>Visual Stimulus</strong>
                      {exercise.photographDescription}
                    </div>
                  )}
                  {exercise.question1 && (
                    <div className="question-block">
                      <div className="q-label">Question 1</div>
                      <div style={{ fontSize: 14 }}>{exercise.question1}</div>
                    </div>
                  )}
                  {exercise.question2 && (
                    <div className="question-block">
                      <div className="q-label">Question 2</div>
                      <div style={{ fontSize: 14 }}>{exercise.question2}</div>
                    </div>
                  )}
                  {exercise.question3 && (
                    <div className="question-block">
                      <div className="q-label">Question 3</div>
                      <div style={{ fontSize: 14 }}>{exercise.question3}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* AI Score Breakdown */}
          <div className="card">
            <div className="card-title">AI Score Breakdown</div>
            <div style={{ marginTop: 8 }}>
              <ScoreRow
                label={isReading ? "Pronunciation & Articulation" : "Personal Response"}
                score={history.score1}
              />
              <ScoreRow
                label={
                  isReading
                    ? "Rhythm, Fluency & Expressiveness"
                    : "Clarity of Expression"
                }
                score={history.score2}
              />
              {!isReading && (
                <ScoreRow label="Engagement in Conversation" score={history.score3} />
              )}
            </div>
          </div>

          {/* Audio Playback */}
          {(history.audioBlob1 || history.audioBlob2 || history.audioBlob3) && (
            <div className="card">
              <div className="card-title">Recordings</div>
              {renderAudio(
                history.audioBlob1,
                isReading ? "Reading" : "Response 1"
              )}
              {!isReading && renderAudio(history.audioBlob2, "Response 2")}
              {!isReading && renderAudio(history.audioBlob3, "Response 3")}
            </div>
          )}

          {/* Transcripts */}
          {(history.transcript1 || history.transcript2 || history.transcript3) && (
            <div className="card feedback-section">
              <h3>Transcripts</h3>
              {history.transcript1 && (
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    {isReading ? "Reading:" : "Response 1:"}
                  </div>
                  <div className="transcript-box has-text">
                    {history.transcript1}
                  </div>
                </div>
              )}
              {!isReading && history.transcript2 && (
                <div style={{ marginBottom: 10 }}>
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

          {/* Structured Transcripts */}
          {(history.structuredTranscript1 ||
            history.structuredTranscript2 ||
            history.structuredTranscript3) && (
            <div className="card feedback-section">
              <h3>Structured Analysis</h3>
              {renderStructuredTranscript(
                history.structuredTranscript1,
                isReading ? "Reading" : "Response 1"
              )}
              {!isReading &&
                renderStructuredTranscript(
                  history.structuredTranscript2,
                  "Response 2"
                )}
              {!isReading &&
                renderStructuredTranscript(
                  history.structuredTranscript3,
                  "Response 3"
                )}
            </div>
          )}

          {/* AI Feedback */}
          {history.generalFeedback && (
            <div className="card feedback-section">
              <h3>General Feedback</h3>
              <p>{history.generalFeedback}</p>
            </div>
          )}

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
          {(history.modelAnswer1 || history.modelAnswer2 || history.modelAnswer3) && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--success)" }}>Model Answers</h3>
              {history.modelAnswer1 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    {isReading ? "Model Reading" : "Q1 Model Answer"}
                  </div>
                  <div className="model-answer">{history.modelAnswer1}</div>
                </div>
              )}
              {!isReading && history.modelAnswer2 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Q2 Model Answer
                  </div>
                  <div className="model-answer">{history.modelAnswer2}</div>
                </div>
              )}
              {!isReading && history.modelAnswer3 && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Q3 Model Answer
                  </div>
                  <div className="model-answer">{history.modelAnswer3}</div>
                </div>
              )}
            </div>
          )}

          {/* Parent Grading Section */}
          <div
            className="card"
            style={{
              border: "2px solid rgba(139, 92, 246, 0.3)",
              background: "rgba(139, 92, 246, 0.06)",
            }}
          >
            <div className="card-title" style={{ color: "var(--purple-soft)" }}>
              Parent Grading
            </div>
            <div style={{ marginTop: 12 }}>
              {sliderLabels.map((label, idx) => {
                const value =
                  idx === 0
                    ? parentScore1
                    : idx === 1
                    ? parentScore2
                    : parentScore3;
                const setter =
                  idx === 0
                    ? setParentScore1
                    : idx === 1
                    ? setParentScore2
                    : setParentScore3;

                return (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div className="grading-row">
                      <label>{label}</label>
                      <div className="grade-value">{value}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="grading-slider"
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>0</span>
                      <span>10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--primary)",
                margin: "8px 0 16px",
              }}
            >
              Parent Total: {parentTotal}
            </div>

            <textarea
              className="parent-note-input"
              placeholder="Add feedback or notes for your child..."
              value={parentFeedback}
              onChange={(e) => setParentFeedback(e.target.value)}
            />

            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              disabled={saving}
              onClick={handleSaveGrade}
            >
              {saving ? "Saving..." : "Save Parent Grade"}
            </button>

            {saveMsg && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: saveMsg === "Saved!" ? "var(--success)" : "var(--danger)",
                }}
              >
                {saveMsg}
              </div>
            )}
          </div>

          {/* Close / Reopen Exercise */}
          <div className="card" style={{ padding: "14px 16px" }}>
            {!history.isClosed ? (
              <>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  Close this exercise to archive it. It will be removed from the student&apos;s active exercise list but kept in history.
                </div>
                <button
                  className="btn btn-outline"
                  style={{ borderColor: "var(--coral)", color: "var(--coral)" }}
                  disabled={closing}
                  onClick={handleCloseExercise}
                >
                  {closing ? "Closing..." : "Close & Archive"}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    background: "var(--bg-elevated)", color: "var(--text-muted)",
                    padding: "2px 8px", borderRadius: 4,
                  }}>
                    Archived
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    This exercise is closed.
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: "auto" }}
                  onClick={handleReopenExercise}
                >
                  Reopen Exercise
                </button>
              </>
            )}
          </div>

          {/* Delete Recordings */}
          {history.isClosed &&
            (history.audioBlob1 || history.audioBlob2 || history.audioBlob3) && (
              <div className="card" style={{ borderColor: "var(--danger)" }}>
                <div className="card-title" style={{ color: "var(--danger)" }}>
                  Storage Management
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 12,
                  }}
                >
                  This exercise is closed. You can delete the audio recordings to
                  free up storage. Transcripts and scores will be preserved.
                </p>
                <button
                  className="btn btn-danger"
                  disabled={deleting}
                  onClick={handleDeleteRecordings}
                >
                  {deleting ? "Deleting..." : "Delete Recordings"}
                </button>
              </div>
            )}

          <div style={{ paddingBottom: 24 }} />
        </div>
      </main>
    </>
  );
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  const barWidth = (score / 10) * 100;
  const barColor =
    score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{score}/10</span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barWidth}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.5s",
          }}
        />
      </div>
    </div>
  );
}
