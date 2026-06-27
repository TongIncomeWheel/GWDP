"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PracticeHistory, StructuredTranscript } from "@/lib/types";
import NanoBanana from "../../NanoBanana";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = Number(params.id);

  const [history, setHistory] = useState<PracticeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetch(`/api/practice?id=${historyId}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [historyId]);

  const handleClose = async () => {
    if (!confirm("Close this exercise? Scores will be finalized.")) return;
    setClosing(true);
    try {
      await fetch("/api/practice/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: historyId }),
      });
      setHistory((prev) => prev ? { ...prev, isClosed: true } : prev);
    } catch {
      // ignore
    }
    setClosing(false);
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
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const isReading = history.exerciseType === "READING";
  const percentage = history.maxScore > 0 ? Math.round((history.totalScore / history.maxScore) * 100) : 0;
  const scoreClass = percentage >= 70 ? "score-high" : percentage >= 50 ? "score-mid" : "score-low";
  const bananaMood = percentage >= 70 ? "cheering" : percentage >= 50 ? "encouraging" : "confused";

  const parseTranscript = (raw: string | null): StructuredTranscript | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StructuredTranscript;
    } catch {
      return null;
    }
  };

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", padding: 0 }}
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
          <NanoBanana mood={bananaMood} />

          {history.errorMessage && (
            <div className="info-banner" style={{ marginTop: 12 }}>{history.errorMessage}</div>
          )}

          {history.isClosed && (
            <div style={{ textAlign: "center", margin: "8px 0", padding: "6px 12px", background: "#E8F5E9", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>
              Exercise Closed
            </div>
          )}

          <div className="card" style={{ textAlign: "center" }}>
            <div className={`score-circle ${scoreClass}`} style={{ marginBottom: 12 }}>
              <span className="score-value">{history.totalScore}</span>
              <span className="score-max">/ {history.maxScore}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {percentage}% &mdash; {percentage >= 70 ? "Well Done!" : percentage >= 50 ? "Good Effort!" : "Keep Practising!"}
            </div>
            {history.parentTotalScore != null && (
              <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, marginTop: 4 }}>
                Parent Score: {history.parentTotalScore}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Score Breakdown</div>
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

          {/* Audio Playback */}
          {(history.audioBlob1 || history.audioBlob2 || history.audioBlob3) && (
            <div className="card">
              <div className="card-title">Your Recordings</div>
              {history.audioBlob1 && (
                <div className="audio-player-mini">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {isReading ? "Reading" : "Response 1"}
                  </span>
                  <audio controls preload="none" style={{ flex: 1, height: 32 }}>
                    <source src={history.audioBlob1} />
                  </audio>
                </div>
              )}
              {!isReading && history.audioBlob2 && (
                <div className="audio-player-mini">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Response 2</span>
                  <audio controls preload="none" style={{ flex: 1, height: 32 }}>
                    <source src={history.audioBlob2} />
                  </audio>
                </div>
              )}
              {!isReading && history.audioBlob3 && (
                <div className="audio-player-mini">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Response 3</span>
                  <audio controls preload="none" style={{ flex: 1, height: 32 }}>
                    <source src={history.audioBlob3} />
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* Structured Transcripts */}
          {(history.structuredTranscript1 || history.structuredTranscript2 || history.structuredTranscript3) && (
            <div className="card feedback-section">
              <h3>Structured Analysis</h3>
              <StructuredTranscriptView raw={history.structuredTranscript1} label={isReading ? "Reading" : "Response 1"} />
              {!isReading && <StructuredTranscriptView raw={history.structuredTranscript2} label="Response 2" />}
              {!isReading && <StructuredTranscriptView raw={history.structuredTranscript3} label="Response 3" />}
            </div>
          )}

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
                {history.strengths.split("\n").filter(Boolean).map((s, i) => (
                  <li key={i}>{s.replace(/^-\s*/, "")}</li>
                ))}
              </ul>
            </div>
          )}

          {history.areasOfImprovement && (
            <div className="card feedback-section">
              <h3 style={{ color: "var(--warning)" }}>Areas for Improvement</h3>
              <ul>
                {history.areasOfImprovement.split("\n").filter(Boolean).map((s, i) => (
                  <li key={i}>{s.replace(/^-\s*/, "")}</li>
                ))}
              </ul>
            </div>
          )}

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

          {(history.transcript1 || history.transcript2 || history.transcript3) && (
            <div className="card feedback-section">
              <h3>Your Responses</h3>
              {history.transcript1 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                    {isReading ? "Your Reading:" : "Response 1:"}
                  </div>
                  <div className="transcript-box has-text">{history.transcript1}</div>
                </div>
              )}
              {!isReading && history.transcript2 && (
                <div style={{ marginBottom: 8 }}>
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

          <div style={{ display: "flex", gap: 8, paddingBottom: 8, marginTop: 16, flexWrap: "wrap" }}>
            {!history.isClosed && history.isEvaluated && (
              <button
                className="btn btn-outline"
                disabled={closing}
                onClick={handleClose}
                style={{ borderColor: "var(--success)", color: "var(--success)" }}
              >
                {closing ? "Closing..." : "Close Exercise"}
              </button>
            )}
            <button className="btn btn-outline" onClick={() => router.push(`/practice/${history.exerciseId}`)}>
              Try Again
            </button>
            <button className="btn btn-primary" onClick={() => router.push("/")}>
              Home
            </button>
          </div>

          {history.parentFeedback && (
            <div className="card" style={{ border: "2px solid var(--primary-light)", background: "#F5F3FF", marginTop: 8 }}>
              <div className="card-title" style={{ color: "var(--primary)" }}>Parent Feedback</div>
              <p style={{ fontSize: 13 }}>{history.parentFeedback}</p>
              {history.parentTotalScore != null && (
                <div style={{ fontWeight: 700, color: "var(--primary)", marginTop: 4 }}>
                  Parent Total: {history.parentTotalScore}
                </div>
              )}
            </div>
          )}

          <div style={{ paddingBottom: 24 }} />
        </div>
      </main>
    </>
  );
}

function StructuredTranscriptView({ raw, label }: { raw: string | null; label: string }) {
  if (!raw) return null;
  let st: StructuredTranscript;
  try {
    st = JSON.parse(raw);
  } catch {
    return null;
  }
  return (
    <div className="structured-transcript">
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
        {label} &mdash; {st.framework} Framework
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
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
          background: st.overallCoherence === "strong" ? "#D1FAE5" : st.overallCoherence === "moderate" ? "#FEF3C7" : "#FEE2E2",
          color: st.overallCoherence === "strong" ? "#065F46" : st.overallCoherence === "moderate" ? "#92400E" : "#991B1B",
        }}>
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
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  const barWidth = (score / 10) * 100;
  const barColor = score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{score}/10</span>
      </div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barWidth}%`, background: barColor, borderRadius: 4, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}
