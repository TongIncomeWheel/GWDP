"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { OralExercise } from "@/lib/types";
import BottomNav from "./BottomNav";
import NanoBanana from "./NanoBanana";

type TypeFilter = "ALL" | "READING" | "STIMULUS" | "DAILY";
type DifficultyFilter = "ALL" | "Foundation" | "Intermediate" | "Advanced";

export default function HomePage() {
  const [exercises, setExercises] = useState<OralExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || `HTTP ${r.status}`); });
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setExercises(data);
        } else {
          throw new Error(data?.error || "Invalid response from server");
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load exercises");
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (typeFilter === "DAILY" && !e.isDaily) return false;
      if (typeFilter === "READING" && e.type !== "READING") return false;
      if (typeFilter === "STIMULUS" && e.type !== "STIMULUS") return false;
      if (difficultyFilter !== "ALL" && e.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [exercises, typeFilter, difficultyFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, OralExercise[]>>((acc, ex) => {
      const key = ex.topic;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ex);
      return acc;
    }, {});
  }, [filtered]);

  const topics = Object.keys(grouped);

  const typeFilters: { value: TypeFilter; label: string; icon: string }[] = [
    { value: "ALL", label: "All", icon: "📚" },
    { value: "READING", label: "Reading", icon: "📖" },
    { value: "STIMULUS", label: "Stimulus", icon: "🖼️" },
    { value: "DAILY", label: "Daily", icon: "⭐" },
  ];

  const difficultyFilters: { value: DifficultyFilter; label: string }[] = [
    { value: "ALL", label: "All Levels" },
    { value: "Foundation", label: "Foundation" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ];

  const readingCount = exercises.filter(e => e.type === "READING").length;
  const stimulusCount = exercises.filter(e => e.type === "STIMULUS").length;
  const dailyCount = exercises.filter(e => e.isDaily).length;

  return (
    <>
      <main>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 100 }}>
          {/* Hero Section */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <NanoBanana mood="smiling" />
          </div>

          {/* Stats Dashboard */}
          {!loading && !error && exercises.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--royal-blue)" }}>
                    {exercises.length}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Total
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border-light)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--royal-blue)" }}>
                    {readingCount}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Reading
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border-light)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--laurel-teal)" }}>
                    {stimulusCount}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Stimulus
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border-light)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold-leaf)" }}>
                    {dailyCount}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Daily
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Practice Journey Steps */}
          {!loading && !error && (
            <div className="card" style={{
              marginBottom: 20,
              background: "linear-gradient(135deg, #F0F4FF 0%, #F0FAF6 100%)",
              border: "1px solid rgba(74, 111, 165, 0.15)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--slate-ink)", marginBottom: 12 }}>
                📋 Practice Journey
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { num: "1", label: "Pick", color: "var(--royal-blue)" },
                  { num: "2", label: "Read", color: "var(--gold-leaf)" },
                  { num: "3", label: "Speak", color: "var(--coral-red)" },
                  { num: "4", label: "Score", color: "var(--laurel-teal)" },
                ].map((step, i, arr) => (
                  <div key={step.num} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: step.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {step.num}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                      {step.label}
                    </span>
                    {i < arr.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: 2,
                        background: `linear-gradient(to right, ${step.color}, ${arr[i + 1].color})`,
                        borderRadius: 1,
                        opacity: 0.3,
                        minWidth: 8,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type filter pills */}
          <div className="filter-row" style={{ marginTop: 4 }}>
            {typeFilters.map((t) => (
              <button
                key={t.value}
                className={`filter-pill ${typeFilter === t.value ? "active" : ""}`}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Difficulty filter pills */}
          <div className="filter-row" style={{ marginTop: 4 }}>
            {difficultyFilters.map((d) => (
              <button
                key={d.value}
                className={`filter-pill ${difficultyFilter === d.value ? "active" : ""}`}
                onClick={() => setDifficultyFilter(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Exercise count */}
          {!loading && !error && (
            <div style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginTop: 12,
              marginBottom: 4,
              fontWeight: 500,
            }}>
              {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} found
            </div>
          )}

          {error ? (
            <div className="card" style={{
              marginTop: 16,
              borderLeft: "4px solid var(--coral-red)",
              background: "var(--danger-bg)",
            }}>
              <div style={{ fontWeight: 700, color: "var(--coral-red)", fontSize: 14, marginBottom: 4 }}>
                Error loading exercises:
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", wordBreak: "break-all", lineHeight: 1.5 }}>
                {error}
              </p>
              <button
                className="btn btn-sm btn-primary"
                style={{ marginTop: 12, width: "auto" }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading exercises...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <p>No exercises match your filter.</p>
            </div>
          ) : (
            topics.map((topic) => (
              <div key={topic}>
                <div className="section-label">
                  {topic}
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                    ({grouped[topic].length})
                  </span>
                </div>
                {grouped[topic].map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav active="home" />
    </>
  );
}

function ExerciseCard({ exercise }: { exercise: OralExercise }) {
  const photoPreview =
    exercise.type === "STIMULUS" && exercise.photographDescription
      ? exercise.photographDescription.length > 60
        ? exercise.photographDescription.slice(0, 60) + "..."
        : exercise.photographDescription
      : null;

  const accentColor = exercise.type === "READING" ? "var(--royal-blue)" : "var(--laurel-teal)";

  return (
    <Link href={`/practice/${exercise.id}`}>
      <div className="card" style={{ cursor: "pointer", borderLeft: `3px solid ${accentColor}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div className="card-title">{exercise.title}</div>
          {exercise.isDaily && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 10,
              background: "var(--gold-highlight-bg)",
              color: "var(--gold-highlight-text)",
              border: "1px solid var(--gold-highlight-border)",
              whiteSpace: "nowrap",
            }}>
              ⭐ DAILY
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          {exercise.topic}
        </div>
        {photoPreview && (
          <div style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 8,
            fontStyle: "italic",
            lineHeight: 1.4,
          }}>
            {photoPreview}
          </div>
        )}
        <div className="flex-badges">
          <span className={`badge ${exercise.type === "READING" ? "badge-reading" : "badge-stimulus"}`}>
            {exercise.type === "READING" ? "📖 Reading Aloud" : "🖼️ Stimulus-Based"}
          </span>
          <span className="badge badge-difficulty">{exercise.difficulty}</span>
        </div>
      </div>
    </Link>
  );
}
