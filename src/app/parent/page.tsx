"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PracticeHistory } from "@/lib/types";
import BottomNav from "../BottomNav";

export default function ParentDashboard() {
  const router = useRouter();
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetch("/api/practice")
      .then((r) => r.json())
      .then((data: PracticeHistory[]) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculate stats
  const evaluated = history.filter((h) => h.isEvaluated);
  const totalSessions = evaluated.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(
          evaluated.reduce((sum, h) => {
            const pct = h.maxScore > 0 ? (h.totalScore / h.maxScore) * 100 : 0;
            return sum + pct;
          }, 0) / totalSessions
        )
      : 0;
  const bestScore =
    totalSessions > 0
      ? Math.round(
          Math.max(
            ...evaluated.map((h) =>
              h.maxScore > 0 ? (h.totalScore / h.maxScore) * 100 : 0
            )
          )
        )
      : 0;

  const streak = (() => {
    if (evaluated.length === 0) return 0;
    const daySet = new Set<string>();
    evaluated.forEach((h) => {
      const d = new Date(h.dateMillis);
      daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    const days = Array.from(daySet)
      .map((s) => {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m, d).getTime();
      })
      .sort((a, b) => b - a);

    let count = 1;
    const oneDay = 86400000;
    for (let i = 0; i < days.length - 1; i++) {
      if (days[i] - days[i + 1] <= oneDay) {
        count++;
      } else {
        break;
      }
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (days[0] < today - oneDay) return 0;
    return count;
  })();

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1>Parent Dashboard</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => router.push("/parent/settings")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              &#9881; Settings
            </button>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Student
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading data...</span>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="card">
                <div className="card-title">Overview</div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-value">{totalSessions}</div>
                    <div className="stat-label">Total Sessions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{avgScore}%</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{bestScore}%</div>
                    <div className="stat-label">Best Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{streak}</div>
                    <div className="stat-label">Current Streak</div>
                  </div>
                </div>
              </div>

              {/* Session filter */}
              {history.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div className="section-label" style={{ margin: 0 }}>
                    {showArchived ? "Archived Sessions" : "Active Sessions"}
                  </div>
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    style={{
                      background: "none", border: "none",
                      color: "var(--purple-soft)", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", padding: "4px 0",
                    }}
                  >
                    {showArchived ? "Show Active" : `Show Archived (${history.filter(h => h.isClosed).length})`}
                  </button>
                </div>
              )}

              {history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">&#x1F4CA;</div>
                  <p>No practice sessions yet.</p>
                  <p style={{ marginTop: 4, fontSize: 13 }}>
                    Sessions will appear here once your child completes a practice.
                  </p>
                </div>
              ) : (
                history
                  .filter((h) => showArchived ? h.isClosed : !h.isClosed)
                  .map((h) => {
                    const percentage =
                      h.maxScore > 0
                        ? Math.round((h.totalScore / h.maxScore) * 100)
                        : 0;
                    const scoreClass =
                      percentage >= 70
                        ? "score-high"
                        : percentage >= 50
                        ? "score-mid"
                        : "score-low";
                    const date = new Date(h.dateMillis);
                    const dateStr = date.toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={h.id}
                        className="card"
                        style={{ cursor: "pointer", opacity: h.isClosed ? 0.7 : 1 }}
                        onClick={() => router.push(`/parent/session/${h.id}`)}
                      >
                        <div className="history-item">
                          <div className={`hi-score ${scoreClass}`}>
                            {h.isEvaluated ? `${h.totalScore}` : "..."}
                          </div>
                          <div className="hi-info">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="hi-title">{h.exerciseTitle}</div>
                              {h.isClosed && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                                  background: "rgba(110,106,142,0.2)", color: "var(--text-secondary)",
                                  padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                                  border: "1px solid rgba(110,106,142,0.3)",
                                }}>
                                  Archived
                                </span>
                              )}
                            </div>
                            <div className="hi-meta">
                              {dateStr} &middot;{" "}
                              {h.exerciseType === "READING" ? "Reading" : "SBC"} &middot;{" "}
                              {h.totalScore}/{h.maxScore}
                              {h.parentTotalScore != null && (
                                <span> &middot; Parent: {h.parentTotalScore}</span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: 20, color: "var(--purple-soft)", fontWeight: 700 }}>
                            &rsaquo;
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav active="parent" />
    </>
  );
}
