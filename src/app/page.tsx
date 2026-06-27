"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { OralExercise } from "@/lib/types";
import BottomNav from "./BottomNav";
import NanoBanana from "./NanoBanana";

type TypeFilter = "ALL" | "READING" | "STIMULUS" | "DAILY";
type DifficultyFilter = "ALL" | "Foundation" | "Intermediate" | "Advanced";

const PSLE_TOPICS = [
  "Community and Kindness",
  "Environment and Sustainability",
  "Technology and Digital Literacy",
  "Health and Wellness",
  "Education and Learning",
  "Family and Relationships",
  "Sports and Physical Activities",
  "Arts and Culture",
  "Food and Nutrition",
  "Safety and Responsibility",
  "Singapore Heritage and Identity",
  "Animals and Nature",
  "Travel and Exploration",
  "Festivals and Celebrations",
  "Friendship and Teamwork",
  "Resilience and Perseverance",
  "Creativity and Innovation",
  "Civic Responsibility and Values",
  "Mental Health and Emotions",
  "Science and Discovery",
];

export default function HomePage() {
  const [exercises, setExercises] = useState<OralExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const [genRemaining, setGenRemaining] = useState<number | null>(null);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genDifficulty, setGenDifficulty] = useState("Intermediate");

  const loadExercises = useCallback(() => {
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

  useEffect(() => {
    loadExercises();
    fetch("/api/generate-exercise")
      .then((r) => r.json())
      .then((data) => setGenRemaining(data.remaining))
      .catch(() => {});
  }, [loadExercises]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    setGenSuccess("");
    try {
      const res = await fetch("/api/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic || undefined,
          difficulty: genDifficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Generation failed");
        if (data.remaining !== undefined) setGenRemaining(data.remaining);
      } else {
        setGenSuccess(`Created: ${data.exercises.map((e: { title: string }) => e.title).join(" + ")}`);
        setGenRemaining(data.remaining);
        setShowGenPanel(false);
        loadExercises();
      }
    } catch {
      setGenError("Network error. Please try again.");
    }
    setGenerating(false);
  };

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
            <NanoBanana mood={generating ? "thinking" : "smiling"} />
          </div>

          {/* Generate New Practice */}
          {!loading && !error && (
            <div className="card" style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)",
              border: "1px solid rgba(139, 92, 246, 0.25)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showGenPanel ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    Generate New Practice
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    AI creates a Reading + SBC pair{genRemaining !== null ? ` · ${genRemaining}/2 left today` : ""}
                  </div>
                </div>
                {!showGenPanel && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "auto", padding: "8px 20px" }}
                    onClick={() => setShowGenPanel(true)}
                    disabled={generating || genRemaining === 0}
                  >
                    {genRemaining === 0 ? "Limit Reached" : "New"}
                  </button>
                )}
              </div>

              {showGenPanel && (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                      Topic (optional — leave blank for random)
                    </label>
                    <select
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      <option value="">Random Topic</option>
                      {PSLE_TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                      Difficulty
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Foundation", "Intermediate", "Advanced"].map((d) => (
                        <button
                          key={d}
                          className={`filter-pill ${genDifficulty === d ? "active" : ""}`}
                          onClick={() => setGenDifficulty(d)}
                          style={{ flex: 1 }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { setShowGenPanel(false); setGenError(""); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 2 }}
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          Generating...
                        </>
                      ) : (
                        "Generate (1 Reading + 1 SBC)"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {genError && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--coral)", fontWeight: 600 }}>
                  {genError}
                </div>
              )}
              {genSuccess && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--teal)", fontWeight: 600 }}>
                  {genSuccess}
                </div>
              )}
            </div>
          )}

          {/* Stats Dashboard */}
          {!loading && !error && exercises.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple-soft)" }}>
                    {exercises.length}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Total
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--blue)" }}>
                    {readingCount}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Reading
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--teal)" }}>
                    {stimulusCount}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    Stimulus
                  </div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>
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
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(45, 212, 191, 0.06) 100%)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                Practice Journey
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { num: "1", label: "Pick", color: "var(--purple-glow)" },
                  { num: "2", label: "Read", color: "var(--gold)" },
                  { num: "3", label: "Speak", color: "var(--coral)" },
                  { num: "4", label: "Score", color: "var(--teal)" },
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
              borderLeft: "4px solid var(--coral)",
              background: "var(--coral-soft)",
            }}>
              <div style={{ fontWeight: 700, color: "var(--coral)", fontSize: 14, marginBottom: 4 }}>
                Error loading exercises:
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", wordBreak: "break-all", lineHeight: 1.5 }}>
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

  const accentColor = exercise.type === "READING" ? "var(--blue)" : "var(--teal)";

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
              background: "var(--gold-soft)",
              color: "var(--gold)",
              border: "1px solid rgba(251, 191, 36, 0.25)",
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
