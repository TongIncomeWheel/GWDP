"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OralExercise, PracticeHistory } from "@/lib/types";
import BottomNav from "../BottomNav";
import ReRe from "../ReRe";

type TypeFilter = "ALL" | "READING" | "STIMULUS" | "DAILY";
type DifficultyFilter = "ALL" | "Foundation" | "Intermediate" | "Advanced";

const ZH_PSLE_TOPICS = [
  "关爱与友谊",
  "家庭与亲情",
  "社区与公民责任",
  "环境与可持续发展",
  "科技与数码生活",
  "健康与生活方式",
  "教育与学习",
  "体育与课外活动",
  "艺术与文化",
  "饮食与营养",
  "安全与责任",
  "新加坡文化遗产",
  "动物与大自然",
  "旅行与探索",
  "节日与庆典",
  "坚毅与克服困难",
  "创意与创新",
  "心理健康与情绪",
  "科学与探索",
  "价值观与品德",
];

export default function ZhHomePage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<OralExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");

  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([]);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const [genRemaining, setGenRemaining] = useState<number | null>(null);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genDifficulty, setGenDifficulty] = useState("Intermediate");

  const loadExercises = useCallback(() => {
    fetch("/api/zh/exercises")
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
    fetch("/api/zh/generate-exercise")
      .then((r) => r.json())
      .then((data) => setGenRemaining(data.remaining))
      .catch(() => {});
    fetch("/api/practice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPracticeHistory(data); })
      .catch(() => {});
  }, [loadExercises]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    setGenSuccess("");
    try {
      const res = await fetch("/api/zh/generate-exercise", {
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

  const closedExerciseIds = useMemo(() => {
    return new Set(
      practiceHistory
        .filter((h) => h.isClosed)
        .map((h) => h.exerciseId)
    );
  }, [practiceHistory]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (closedExerciseIds.has(e.id)) return false;
      if (typeFilter === "DAILY" && !e.isDaily) return false;
      if (typeFilter === "READING" && e.type !== "READING") return false;
      if (typeFilter === "STIMULUS" && e.type !== "STIMULUS") return false;
      if (difficultyFilter !== "ALL" && e.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [exercises, typeFilter, difficultyFilter, closedExerciseIds]);

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
    { value: "READING", label: "朗读", icon: "📖" },
    { value: "STIMULUS", label: "看图说话", icon: "🖼️" },
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

  const streakData = useMemo(() => {
    if (practiceHistory.length === 0) return { current: 0, best: 0, total: 0, avgScore: 0, todayDone: 0, weekScores: [] as number[] };

    const practiceDays = new Set(
      practiceHistory.map((h) => {
        const d = new Date(h.dateMillis);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    const sortedDays = Array.from(practiceDays)
      .map((s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m, d); })
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const todayDone = practiceHistory.filter((h) => {
      const d = new Date(h.dateMillis);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
    }).length;

    let current = 0;
    if (sortedDays.length > 0) {
      const firstDayDiff = Math.floor((today.getTime() - sortedDays[0].getTime()) / (24 * 60 * 60 * 1000));
      if (firstDayDiff <= 1) {
        current = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const diff = sortedDays[i - 1].getTime() - sortedDays[i].getTime();
          if (diff <= 24 * 60 * 60 * 1000) current++;
          else break;
        }
      }
    }

    let best = 0, run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = sortedDays[i - 1].getTime() - sortedDays[i].getTime();
      if (diff <= 24 * 60 * 60 * 1000) run++;
      else { best = Math.max(best, run); run = 1; }
    }
    best = Math.max(best, run, current);

    const evaluated = practiceHistory.filter((h) => h.isEvaluated && h.maxScore > 0);
    const avgScore = evaluated.length > 0
      ? Math.round(evaluated.reduce((sum, h) => sum + (h.totalScore / h.maxScore) * 100, 0) / evaluated.length)
      : 0;

    const weekAgo = today.getTime() - 7 * 24 * 60 * 60 * 1000;
    const weekScores = evaluated
      .filter((h) => h.dateMillis >= weekAgo)
      .sort((a, b) => a.dateMillis - b.dateMillis)
      .slice(-7)
      .map((h) => Math.round((h.totalScore / h.maxScore) * 100));

    return { current, best, total: practiceHistory.length, avgScore, todayDone, weekScores };
  }, [practiceHistory]);

  const mascotMood = generating ? "thinking" as const
    : streakData.current >= 7 ? "cheering" as const
    : streakData.current >= 3 ? "encouraging" as const
    : "smiling" as const;

  const mascotMessage = generating ? undefined
    : streakData.current >= 7 ? `${streakData.current}-day streak! You're on fire!`
    : streakData.current >= 3 ? `${streakData.current} days strong! Keep going!`
    : streakData.todayDone > 0 ? "Great job practising today!"
    : streakData.total > 0 ? "Ready for today's practice?"
    : undefined;

  return (
    <>
      <main>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 100 }}>
          {/* Hero Section with ReRe */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <ReRe mood={mascotMood} message={mascotMessage} />
            <div style={{ marginTop: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                华文口试练习
              </h1>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Mandarin PSLE Oral
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--text-secondary)",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back to English
            </button>
          </div>

          {/* Streak Dashboard */}
          {!loading && practiceHistory.length > 0 && (
            <div className="card" style={{
              marginBottom: 16,
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(45, 212, 191, 0.1) 100%)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 14 }}>
                {/* Streak Ring */}
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="url(#streakGradZh)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${Math.min(streakData.current / 7, 1) * 213.6} 213.6`}
                      transform="rotate(-90 40 40)"
                    />
                    <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(45, 212, 191, 0.15)" strokeWidth="5" />
                    <circle
                      cx="40" cy="40" r="24" fill="none"
                      stroke="var(--teal)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${Math.min(streakData.todayDone / 2, 1) * 150.8} 150.8`}
                      transform="rotate(-90 40 40)"
                    />
                    <defs>
                      <linearGradient id="streakGradZh" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    fontSize: 20, fontWeight: 800, color: "var(--text-primary)",
                  }}>
                    {streakData.current}
                  </div>
                </div>

                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Day Streak
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    Best: {streakData.best} days
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 1 }}>
                    Today: {streakData.todayDone} session{streakData.todayDone !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid rgba(139, 92, 246, 0.15)", paddingTop: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--purple-soft)" }}>{streakData.total}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>Total</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: streakData.avgScore >= 70 ? "var(--teal)" : streakData.avgScore >= 50 ? "var(--gold)" : "var(--coral)" }}>
                    {streakData.avgScore}%
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>Avg Score</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{streakData.weekScores.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>This Week</div>
                </div>
              </div>

              {/* Mini week sparkline */}
              {streakData.weekScores.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  <svg width="200" height="32" viewBox="0 0 200 32">
                    {streakData.weekScores.map((score, i, arr) => {
                      const x = (i / Math.max(arr.length - 1, 1)) * 180 + 10;
                      const y = 28 - (score / 100) * 24;
                      const prevX = i > 0 ? ((i - 1) / Math.max(arr.length - 1, 1)) * 180 + 10 : x;
                      const prevY = i > 0 ? 28 - (arr[i - 1] / 100) * 24 : y;
                      return (
                        <g key={i}>
                          {i > 0 && <line x1={prevX} y1={prevY} x2={x} y2={y} stroke="var(--purple-soft)" strokeWidth="2" strokeLinecap="round" />}
                          <circle cx={x} cy={y} r="3" fill={score >= 70 ? "var(--teal)" : score >= 50 ? "var(--gold)" : "var(--coral)"} />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          )}

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
                    AI creates a 朗读 + 看图说话 pair{genRemaining !== null ? ` · ${genRemaining}/2 left today` : ""}
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
                      {ZH_PSLE_TOPICS.map((t) => (
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
                        "AI Generate Chinese Exercise"
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

          {/* Exercise Stats */}
          {!loading && !error && exercises.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div className="card" style={{ flex: 1, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--blue)" }}>{readingCount}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>朗读</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--teal)" }}>{stimulusCount}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>看图说话</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)" }}>{dailyCount}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Daily</div>
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
                  <ZhExerciseCard key={ex.id} exercise={ex} />
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

function ZhExerciseCard({ exercise }: { exercise: OralExercise }) {
  const photoPreview =
    exercise.type === "STIMULUS" && exercise.photographDescription
      ? exercise.photographDescription.length > 60
        ? exercise.photographDescription.slice(0, 60) + "..."
        : exercise.photographDescription
      : null;

  const accentColor = exercise.type === "READING" ? "var(--blue)" : "var(--teal)";

  return (
    <Link href={`/zh/practice/${exercise.id}`}>
      <div className="card" style={{ cursor: "pointer", borderLeft: `3px solid ${accentColor}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div className="card-title">{exercise.title}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {exercise.repracticeRequested && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: "rgba(251,191,36,0.15)",
                color: "var(--gold)",
                border: "1px solid rgba(251, 191, 36, 0.35)",
                whiteSpace: "nowrap",
              }}>
                ↩ RE-PRACTICE
              </span>
            )}
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
            {exercise.type === "READING" ? "📖 朗读" : "🖼️ 看图说话"}
          </span>
          <span className="badge badge-difficulty">{exercise.difficulty}</span>
        </div>
      </div>
    </Link>
  );
}
