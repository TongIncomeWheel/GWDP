"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PracticeHistory } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = Number(params.id);

  const [history, setHistory] = useState<PracticeHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/practice?id=${historyId}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [historyId]);

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

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <div>
            <h1>Results</h1>
            <div className="subtitle">{history.exerciseTitle}</div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {history.errorMessage && (
            <div className="info-banner">{history.errorMessage}</div>
          )}

          <div className="card" style={{ textAlign: "center" }}>
            <div className={`score-circle ${scoreClass}`} style={{ marginBottom: 12 }}>
              <span className="score-value">{history.totalScore}</span>
              <span className="score-max">/ {history.maxScore}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {percentage}% — {percentage >= 70 ? "Well Done!" : percentage >= 50 ? "Good Effort!" : "Keep Practising!"}
            </div>
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

          <div style={{ display: "flex", gap: 8, paddingBottom: 24, marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => router.push(`/practice/${history.exerciseId}`)}>
              Try Again
            </button>
            <button className="btn btn-primary" onClick={() => router.push("/")}>
              Home
            </button>
          </div>
        </div>
      </main>
    </>
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
