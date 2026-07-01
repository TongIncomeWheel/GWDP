"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise, PracticeHistory } from "@/lib/types";
import AudioPlayer from "../../../AudioPlayer";
import { ScoreRow } from "@/components/ScoreRow";
import { StructuredTranscriptView } from "@/components/StructuredTranscriptView";
import { resolveAudioSrc, hasAudio } from "@/lib/audio";

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
  const [repracticing, setRepracticing] = useState(false);
  const [repracticeRequested, setRepracticeRequested] = useState(false);

  // Collapsible section state
  const [showPassage, setShowPassage] = useState(true);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [showModelAnswers, setShowModelAnswers] = useState(false);

  useEffect(() => {
    fetch(`/api/practice?id=${sessionId}`)
      .then((r) => r.json())
      .then((historyData: PracticeHistory) => {
        setHistory(historyData);
        if (historyData.parentScore1 != null) setParentScore1(historyData.parentScore1);
        if (historyData.parentScore2 != null) setParentScore2(historyData.parentScore2);
        if (historyData.parentScore3 != null) setParentScore3(historyData.parentScore3);
        if (historyData.parentFeedback) setParentFeedback(historyData.parentFeedback);
        return fetch(`/api/exercises/${historyData.exerciseId}`).then((r) => r.json());
      })
      .then((ex: OralExercise & { error?: string }) => {
        if (ex && !ex.error) {
          setExercise(ex);
          setRepracticeRequested(!!ex.repracticeRequested);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [sessionId]);

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
    : ["Question 1", "Question 2", "Question 3"];

  const parentTotal = isReading
    ? parentScore1 + parentScore2
    : parentScore1 + parentScore2 + parentScore3;

  const handleSaveGrade = async () => {
    if (!history) return;
    setSaving(true);
    setSaveMsg("");

    // Send only grading fields — no audio blobs to avoid payload size issues
    const payload = {
      id: history.id,
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
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveMsg("Saved!");
        setHistory({
          ...history,
          parentScore1: payload.parentScore1,
          parentScore2: payload.parentScore2,
          parentScore3: payload.parentScore3,
          parentFeedback: payload.parentFeedback,
          parentTotalScore: payload.parentTotalScore,
        });
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

  const handleToggleRepractice = async (request: boolean) => {
    if (!exercise) return;
    setRepracticing(true);
    try {
      await fetch("/api/exercises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exercise.id, repracticeRequested: request }),
      });
      setRepracticeRequested(request);
    } catch {
      alert("Failed to update. Please try again.");
    }
    setRepracticing(false);
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
        audioPath1: null,
        audioPath2: null,
        audioPath3: null,
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

  const SectionHeader = ({
    title,
    open,
    onToggle,
  }: {
    title: string;
    open: boolean;
    onToggle: () => void;
  }) => (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div className="card-title" style={{ margin: 0 }}>{title}</div>
      <span style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1 }}>
        {open ? "▾" : "▸"}
      </span>
    </div>
  );

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
                  color: "var(--purple-soft)",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Parent Score: {history.parentTotalScore}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <span className={`badge ${isReading ? "badge-reading" : "badge-stimulus"}`}>
                {isReading ? "📖 Reading Aloud" : "🖼️ SBC"}
              </span>
              {exercise && <span className="badge badge-difficulty">{exercise.difficulty}</span>}
            </div>
          </div>

          {/* Passage / Questions — collapsible */}
          {(exercise || history.exerciseType) && (
            <div className="card">
              <SectionHeader
                title={isReading ? "Reading Passage" : "Stimulus Questions"}
                open={showPassage}
                onToggle={() => setShowPassage((v) => !v)}
              />
              {showPassage && (
                <div style={{ marginTop: 12 }}>
                  {exercise ? (
                    <>
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
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Exercise content not available.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recordings are shown inside the Parent Grading box below */}

          {/* Transcripts (always visible, compact) */}
          {(history.transcript1 || history.transcript2 || history.transcript3) && (
            <div className="card feedback-section">
              <h3 style={{ marginBottom: 10 }}>Transcripts</h3>
              {history.transcript1 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                    {isReading ? "Reading:" : "Response 1:"}
                  </div>
                  <div className="transcript-box has-text">{history.transcript1}</div>
                </div>
              )}
              {!isReading && history.transcript2 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Response 2:</div>
                  <div className="transcript-box has-text">{history.transcript2}</div>
                </div>
              )}
              {!isReading && history.transcript3 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Response 3:</div>
                  <div className="transcript-box has-text">{history.transcript3}</div>
                </div>
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
                label={isReading ? "Rhythm, Fluency & Expressiveness" : "Clarity of Expression"}
                score={history.score2}
              />
              {!isReading && (
                <ScoreRow label="Engagement in Conversation" score={history.score3} />
              )}
            </div>
          </div>

          {/* AI Detailed Feedback — collapsible */}
          {(history.generalFeedback || history.strengths || history.areasOfImprovement) && (
            <div className="card feedback-section">
              <SectionHeader
                title="AI Detailed Feedback"
                open={showAIFeedback}
                onToggle={() => setShowAIFeedback((v) => !v)}
              />
              {showAIFeedback && (
                <div style={{ marginTop: 12 }}>
                  {history.generalFeedback && (
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ marginBottom: 6, fontSize: 13 }}>General Feedback</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>{history.generalFeedback}</p>
                    </div>
                  )}
                  {history.strengths && (
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ color: "var(--success)", marginBottom: 6, fontSize: 13 }}>Strengths</h3>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {history.strengths.split("\n").filter(Boolean).map((s, i) => (
                          <li key={i}>{s.replace(/^-\s*/, "")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {history.areasOfImprovement && (
                    <div>
                      <h3 style={{ color: "var(--warning)", marginBottom: 6, fontSize: 13 }}>Areas for Improvement</h3>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {history.areasOfImprovement.split("\n").filter(Boolean).map((s, i) => (
                          <li key={i}>{s.replace(/^-\s*/, "")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Structured Transcripts */}
                  {(history.structuredTranscript1 || history.structuredTranscript2 || history.structuredTranscript3) && (
                    <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <h3 style={{ marginBottom: 8, fontSize: 13 }}>Structured Analysis</h3>
                      <StructuredTranscriptView raw={history.structuredTranscript1} label={isReading ? "Reading" : "Response 1"} />
                      {!isReading && <StructuredTranscriptView raw={history.structuredTranscript2} label="Response 2" />}
                      {!isReading && <StructuredTranscriptView raw={history.structuredTranscript3} label="Response 3" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Answers — collapsible */}
          {(history.modelAnswer1 || history.modelAnswer2 || history.modelAnswer3) && (
            <div className="card feedback-section">
              <SectionHeader
                title="Model Answers"
                open={showModelAnswers}
                onToggle={() => setShowModelAnswers((v) => !v)}
              />
              {showModelAnswers && (
                <div style={{ marginTop: 12 }}>
                  {history.modelAnswer1 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        {isReading ? "Model Reading" : "Q1 Model Answer"}
                      </div>
                      <div className="model-answer">{history.modelAnswer1}</div>
                    </div>
                  )}
                  {!isReading && history.modelAnswer2 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        Q2 Model Answer
                      </div>
                      <div className="model-answer">{history.modelAnswer2}</div>
                    </div>
                  )}
                  {!isReading && history.modelAnswer3 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        Q3 Model Answer
                      </div>
                      <div className="model-answer">{history.modelAnswer3}</div>
                    </div>
                  )}
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

            {/* For Reading: single player before sliders */}
            {isReading && (
              <div style={{ marginTop: 12 }}>
                {resolveAudioSrc(history.audioPath1, null) ? (
                  <AudioPlayer src={resolveAudioSrc(history.audioPath1, null)!} label="Listen to recording" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 8 }}>
                    No recording available for this session.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {sliderLabels.map((label, idx) => {
                const paths = [history.audioPath1, history.audioPath2, history.audioPath3];
                const src = resolveAudioSrc(paths[idx], null);
                const value = idx === 0 ? parentScore1 : idx === 1 ? parentScore2 : parentScore3;
                const setter = idx === 0 ? setParentScore1 : idx === 1 ? setParentScore2 : setParentScore3;

                return (
                  <div key={idx} style={{ marginBottom: 20 }}>
                    {/* For SBC: player per question above its slider */}
                    {!isReading && src && (
                      <AudioPlayer src={src} label={`Listen — Question ${idx + 1}`} />
                    )}
                    {!isReading && !src && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 6 }}>
                        No recording for Q{idx + 1}
                      </div>
                    )}
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
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
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
                color: "var(--purple-soft)",
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

          {/* Send for Re-Practice */}
          <div className="card" style={{ padding: "14px 16px", border: repracticeRequested ? "1px solid rgba(251,191,36,0.4)" : undefined }}>
            <div className="card-title" style={{ marginBottom: 8 }}>Re-Practice</div>
            {repracticeRequested ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    background: "rgba(251,191,36,0.15)", color: "var(--gold)",
                    padding: "2px 8px", borderRadius: 4,
                    border: "1px solid rgba(251,191,36,0.3)",
                  }}>
                    Re-Practice Requested
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  The student will see a prompt to redo this exercise. Tap below to cancel the request.
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: "auto" }}
                  disabled={repracticing}
                  onClick={() => handleToggleRepractice(false)}
                >
                  {repracticing ? "Cancelling..." : "Cancel Re-Practice"}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  Send this exercise back to the student for another attempt.
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: "auto", background: "var(--gold)", borderColor: "var(--gold)" }}
                  disabled={repracticing || !exercise}
                  onClick={() => handleToggleRepractice(true)}
                >
                  {repracticing ? "Sending..." : "Send for Re-Practice"}
                </button>
              </>
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
            hasAudio(history.audioPath1, history.audioPath2, history.audioPath3, history.audioBlob1, history.audioBlob2, history.audioBlob3) && (
              <div className="card" style={{ borderColor: "var(--danger)" }}>
                <div className="card-title" style={{ color: "var(--danger)" }}>
                  Storage Management
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
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

