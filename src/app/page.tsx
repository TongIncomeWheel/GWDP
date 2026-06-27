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

  const typeFilters: { value: TypeFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "READING", label: "Reading Aloud" },
    { value: "STIMULUS", label: "Stimulus-Based" },
    { value: "DAILY", label: "Daily" },
  ];

  const difficultyFilters: { value: DifficultyFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "Foundation", label: "Foundation" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ];

  return (
    <>
      <header className="page-header">
        <h1>PSLE Oral Practice</h1>
        <div className="subtitle">Singapore Primary School English Oral</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          <NanoBanana mood="smiling" />

          {/* Type filter pills */}
          <div className="filter-row" style={{ marginTop: 16 }}>
            {typeFilters.map((t) => (
              <button
                key={t.value}
                className={`filter-pill ${typeFilter === t.value ? "active" : ""}`}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Difficulty filter pills */}
          <div className="filter-row" style={{ marginTop: 8 }}>
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
          {!loading && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, marginBottom: 4 }}>
              {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} found
            </div>
          )}

          {error ? (
            <div className="error-banner" style={{ marginTop: 16 }}>
              <strong>Error loading exercises:</strong>
              <p style={{ marginTop: 4, wordBreak: "break-all" }}>{error}</p>
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
              <div className="empty-icon">&#x1F4DA;</div>
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

  return (
    <Link href={`/practice/${exercise.id}`}>
      <div className="card" style={{ cursor: "pointer" }}>
        <div className="card-title">{exercise.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          {exercise.topic}
        </div>
        {photoPreview && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 8,
              fontStyle: "italic",
              lineHeight: 1.4,
            }}
          >
            {photoPreview}
          </div>
        )}
        <div className="flex-badges">
          <span className={`badge ${exercise.type === "READING" ? "badge-reading" : "badge-stimulus"}`}>
            {exercise.type === "READING" ? "Reading Aloud" : "Stimulus-Based"}
          </span>
          <span className="badge badge-difficulty">{exercise.difficulty}</span>
          {exercise.isDaily && <span className="badge badge-daily">Daily</span>}
        </div>
      </div>
    </Link>
  );
}
