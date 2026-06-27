"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PracticeHistory } from "@/lib/types";
import BottomNav from "../BottomNav";

function computeStreak(history: PracticeHistory[]): number {
  if (history.length === 0) return 0;

  const practiceDays = new Set(
    history.map((h) => {
      const d = new Date(h.dateMillis);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const sortedDays = Array.from(practiceDays)
    .map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = sortedDays[i - 1].getTime() - sortedDays[i].getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (diff <= oneDay) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function MiniBarChart({ scores }: { scores: { ai: number; max: number }[] }) {
  if (scores.length === 0) return null;

  const barWidth = 24;
  const gap = 6;
  const chartHeight = 48;
  const chartWidth = scores.length * (barWidth + gap) - gap;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
        Last {scores.length} score{scores.length !== 1 ? "s" : ""}
      </div>
      <svg width={chartWidth} height={chartHeight + 16} viewBox={`0 0 ${chartWidth} ${chartHeight + 16}`}>
        {scores.map((s, i) => {
          const pct = s.max > 0 ? s.ai / s.max : 0;
          const barH = Math.max(2, pct * chartHeight);
          const color = pct >= 0.7 ? "var(--score-high, #22c55e)" : pct >= 0.5 ? "var(--score-mid, #f59e0b)" : "var(--score-low, #ef4444)";
          const x = i * (barWidth + gap);

          return (
            <g key={i}>
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={4}
                fill="var(--bg-card-hover, #f0f0f0)"
                opacity={0.5}
              />
              {/* Score bar */}
              <rect
                x={x}
                y={chartHeight - barH}
                width={barWidth}
                height={barH}
                rx={4}
                fill={color}
              />
              {/* Score label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted, #999)"
              >
                {s.ai}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/practice")
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this practice record?")) return;
    await fetch(`/api/practice?id=${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const streak = useMemo(() => computeStreak(history), [history]);

  const last5Scores = useMemo(() => {
    const evaluated = history
      .filter((h) => h.isEvaluated && h.maxScore > 0)
      .sort((a, b) => a.dateMillis - b.dateMillis)
      .slice(-5);
    return evaluated.map((h) => ({ ai: h.totalScore, max: h.maxScore }));
  }, [history]);

  return (
    <>
      <header className="page-header">
        <h1>Practice History</h1>
        <div className="subtitle">Your past practice sessions</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {!loading && history.length > 0 && (
            <>
              {/* Streak counter */}
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  padding: "12px 16px",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Practice Streak</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {streak} day{streak !== 1 ? "s" : ""} in a row
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent, #3b82f6)" }}>
                  {streak}
                </div>
              </div>

              {/* Score trend mini bar chart */}
              {last5Scores.length > 0 && (
                <div className="card" style={{ marginBottom: 16, padding: "12px 16px", display: "flex", justifyContent: "center" }}>
                  <MiniBarChart scores={last5Scores} />
                </div>
              )}
            </>
          )}

          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">&#x1F4CA;</div>
              <p>No practice history yet.</p>
              <p style={{ marginTop: 4, fontSize: 13 }}>Complete a practice session to see your results here.</p>
            </div>
          ) : (
            history.map((h) => {
              const percentage = h.maxScore > 0 ? Math.round((h.totalScore / h.maxScore) * 100) : 0;
              const scoreClass = percentage >= 70 ? "score-high" : percentage >= 50 ? "score-mid" : "score-low";
              const date = new Date(h.dateMillis);
              const dateStr = date.toLocaleDateString("en-SG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const hasParentScore = h.parentTotalScore !== null && h.parentTotalScore !== undefined;

              return (
                <div
                  key={h.id}
                  className="card"
                  style={{ cursor: "pointer", position: "relative" }}
                  onClick={() => router.push(`/results/${h.id}`)}
                >
                  {h.isClosed && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: "var(--bg-card-hover, #e5e7eb)",
                        color: "var(--text-muted, #6b7280)",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      Closed
                    </span>
                  )}
                  <div className="history-item">
                    <div className={`hi-score ${scoreClass}`}>
                      {h.isEvaluated ? `${h.totalScore}` : "..."}
                    </div>
                    <div className="hi-info">
                      <div className="hi-title">{h.exerciseTitle}</div>
                      <div className="hi-meta">
                        {dateStr} · {h.exerciseType === "READING" ? "Reading" : "SBC"} · AI: {h.totalScore}/{h.maxScore}
                        {hasParentScore && (
                          <> · Parent: {h.parentTotalScore}/{h.maxScore}</>
                        )}
                      </div>
                    </div>
                    <button
                      className="hi-action"
                      onClick={(e) => handleDelete(h.id, e)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}
                      title="Delete"
                    >
                      &#x1F5D1;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav active="history" />
    </>
  );
}
