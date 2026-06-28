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

  const evaluated = history.filter((h) => h.isEvaluated && !h.isClosed);
  const totalSessions = evaluated.length;

  const avgScore =
    totalSessions > 0
      ? Math.round(
          evaluated.reduce((sum, h) => sum + (h.maxScore > 0 ? (h.totalScore / h.maxScore) * 100 : 0), 0) /
            totalSessions
        )
      : 0;

  const readingSessions = evaluated.filter((h) => h.exerciseType === "READING");
  const sbcSessions = evaluated.filter((h) => h.exerciseType !== "READING");
  const avgReading =
    readingSessions.length > 0
      ? Math.round(readingSessions.reduce((s, h) => s + (h.totalScore / h.maxScore) * 100, 0) / readingSessions.length)
      : null;
  const avgSBC =
    sbcSessions.length > 0
      ? Math.round(sbcSessions.reduce((s, h) => s + (h.totalScore / h.maxScore) * 100, 0) / sbcSessions.length)
      : null;

  const streak = (() => {
    if (!evaluated.length) return 0;
    const daySet = new Set<string>();
    evaluated.forEach((h) => {
      const d = new Date(h.dateMillis);
      daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    const days = Array.from(daySet)
      .map((s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m, d).getTime(); })
      .sort((a, b) => b - a);
    let count = 1;
    const oneDay = 86400000;
    for (let i = 0; i < days.length - 1; i++) {
      if (days[i] - days[i + 1] <= oneDay) count++;
      else break;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (days[0] < today.getTime() - oneDay) return 0;
    return count;
  })();

  // Score trend — last 8 evaluated sessions oldest→newest
  const trendSessions = evaluated.slice(0, 8).reverse();

  // Insights — aggregate strengths and areas from last 10 evaluated sessions
  const insightBase = evaluated.slice(0, 10);
  const strengthCounts = new Map<string, number>();
  const areaCounts = new Map<string, number>();
  insightBase.forEach((h) => {
    (h.strengths || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => {
      strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
    });
    (h.areasOfImprovement || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((a) => {
      areaCounts.set(a, (areaCounts.get(a) || 0) + 1);
    });
  });
  const topStrengths = [...strengthCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topAreas = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hasInsights = topStrengths.length > 0 || topAreas.length > 0;

  const scoreColor = (pct: number) =>
    pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--gold)" : "var(--coral)";

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1>Parent Dashboard</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => router.push("/test-plan")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              &#9989; UAT
            </button>
            <button
              onClick={() => router.push("/parent/settings")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              &#9881; Settings
            </button>
            <button
              onClick={() => router.push("/")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Back to Student
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /><span>Loading data...</span></div>
          ) : (
            <>
              {/* Overview */}
              <div className="card">
                <div className="card-title">Overview</div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-value">{totalSessions}</div>
                    <div className="stat-label">Sessions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: scoreColor(avgScore) }}>{totalSessions > 0 ? `${avgScore}%` : "—"}</div>
                    <div className="stat-label">Overall Avg</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: avgReading != null ? scoreColor(avgReading) : undefined }}>{avgReading != null ? `${avgReading}%` : "—"}</div>
                    <div className="stat-label">Reading Avg</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: avgSBC != null ? scoreColor(avgSBC) : undefined }}>{avgSBC != null ? `${avgSBC}%` : "—"}</div>
                    <div className="stat-label">SBC Avg</div>
                  </div>
                </div>
                {streak > 0 && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
                    🔥 {streak}-day practice streak
                  </div>
                )}
              </div>

              {/* Score Trend */}
              {trendSessions.length >= 2 && (
                <div className="card">
                  <div className="card-title">Score Trend</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64, marginTop: 8 }}>
                    {trendSessions.map((h, i) => {
                      const pct = h.maxScore > 0 ? Math.round((h.totalScore / h.maxScore) * 100) : 0;
                      const barH = Math.max(8, Math.round((pct / 100) * 56));
                      return (
                        <div key={h.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{pct}%</div>
                          <div style={{ width: "100%", height: barH, background: scoreColor(pct), borderRadius: 4, minHeight: 8 }} title={`${h.exerciseTitle} — ${pct}%`} />
                          <div style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>
                            {h.exerciseType === "READING" ? "R" : "SBC"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>← Older</span>
                    <span style={{ marginLeft: "auto" }}>Recent →</span>
                  </div>
                </div>
              )}

              {/* Insights */}
              {hasInsights && (
                <div className="card">
                  <div className="card-title">Performance Insights</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                    Based on last {insightBase.length} evaluated session{insightBase.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Strengths */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--success)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        ✓ Doing Well
                      </div>
                      {topStrengths.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No data yet</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {topStrengths.map(([text, count]) => (
                            <div key={text} style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, display: "flex", gap: 6, alignItems: "flex-start" }}>
                              <span style={{ color: "var(--success)", flexShrink: 0 }}>•</span>
                              <span>
                                {text}
                                {count > 1 && (
                                  <span style={{ marginLeft: 4, fontSize: 10, color: "var(--text-muted)", background: "rgba(34,197,94,0.12)", padding: "1px 5px", borderRadius: 8 }}>
                                    ×{count}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Areas to improve */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        ↑ Needs Support
                      </div>
                      {topAreas.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No data yet</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {topAreas.map(([text, count]) => (
                            <div key={text} style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, display: "flex", gap: 6, alignItems: "flex-start" }}>
                              <span style={{ color: "var(--coral)", flexShrink: 0 }}>•</span>
                              <span>
                                {text}
                                {count > 1 && (
                                  <span style={{ marginLeft: 4, fontSize: 10, color: "var(--text-muted)", background: "rgba(239,68,68,0.12)", padding: "1px 5px", borderRadius: 8 }}>
                                    ×{count}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Session list */}
              {history.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div className="section-label" style={{ margin: 0 }}>
                    {showArchived ? "Archived Sessions" : "Active Sessions"}
                  </div>
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    style={{ background: "none", border: "none", color: "var(--purple-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
                  >
                    {showArchived ? "Show Active" : `Show Archived (${history.filter((h) => h.isClosed).length})`}
                  </button>
                </div>
              )}

              {history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">&#x1F4CA;</div>
                  <p>No practice sessions yet.</p>
                  <p style={{ marginTop: 4, fontSize: 13 }}>Sessions will appear here once your child completes a practice.</p>
                </div>
              ) : (
                history
                  .filter((h) => (showArchived ? h.isClosed : !h.isClosed))
                  .map((h) => {
                    const percentage = h.maxScore > 0 ? Math.round((h.totalScore / h.maxScore) * 100) : 0;
                    const scoreClass = percentage >= 70 ? "score-high" : percentage >= 50 ? "score-mid" : "score-low";
                    const date = new Date(h.dateMillis);
                    const dateStr = date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

                    return (
                      <div
                        key={h.id}
                        className="card"
                        style={{ cursor: "pointer", opacity: h.isClosed ? 0.7 : 1 }}
                        onClick={() => router.push(`/parent/session/${h.id}`)}
                      >
                        <div className="history-item">
                          <div className={`hi-score ${scoreClass}`}>
                            {h.isEvaluated ? `${h.totalScore}` : h.isEvaluating ? "..." : "—"}
                          </div>
                          <div className="hi-info">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="hi-title">{h.exerciseTitle}</div>
                              {h.isClosed && (
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(110,106,142,0.2)", color: "var(--text-secondary)", padding: "2px 7px", borderRadius: 4, flexShrink: 0, border: "1px solid rgba(110,106,142,0.3)" }}>
                                  Archived
                                </span>
                              )}
                            </div>
                            <div className="hi-meta">
                              {dateStr} &middot; {h.exerciseType === "READING" ? "Reading" : "SBC"} &middot;{" "}
                              {h.isEvaluated ? `${h.totalScore}/${h.maxScore}` : h.errorMessage ? "Error" : "Pending"}
                              {h.parentTotalScore != null && <span> &middot; Parent: {h.parentTotalScore}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 20, color: "var(--purple-soft)", fontWeight: 700 }}>&rsaquo;</span>
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
