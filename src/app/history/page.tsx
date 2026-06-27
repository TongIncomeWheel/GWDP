"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PracticeHistory } from "@/lib/types";
import BottomNav from "../BottomNav";

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

  return (
    <>
      <header className="page-header">
        <h1>Practice History</h1>
        <div className="subtitle">Your past practice sessions</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
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

              return (
                <div
                  key={h.id}
                  className="card"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/results/${h.id}`)}
                >
                  <div className="history-item">
                    <div className={`hi-score ${scoreClass}`}>
                      {h.isEvaluated ? `${h.totalScore}` : "..."}
                    </div>
                    <div className="hi-info">
                      <div className="hi-title">{h.exerciseTitle}</div>
                      <div className="hi-meta">
                        {dateStr} · {h.exerciseType === "READING" ? "Reading" : "SBC"} · {h.totalScore}/{h.maxScore}
                      </div>
                    </div>
                    <button
                      className="hi-action"
                      onClick={(e) => handleDelete(h.id, e)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}
                      title="Delete"
                    >
                      🗑
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
