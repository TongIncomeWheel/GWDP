"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OralExercise } from "@/lib/types";
import BottomNav from "./BottomNav";
import NanoBanana from "./NanoBanana";

type TypeFilter = "ALL" | "READING" | "STIMULUS";

export default function HomePage() {
  const [exercises, setExercises] = useState<OralExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => {
        setExercises(data);
        setLoading(false);
      });
  }, []);

  const filtered = exercises.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, OralExercise[]>>((acc, ex) => {
    const key = ex.topic;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const topics = Object.keys(grouped);

  return (
    <>
      <header className="page-header">
        <h1>PSLE Oral Practice</h1>
        <div className="subtitle">Singapore Primary School English Oral</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          <NanoBanana mood="smiling" />

          <div className="filter-row" style={{ marginTop: 16 }}>
            {(["ALL", "READING", "STIMULUS"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                className={`filter-pill ${typeFilter === t ? "active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "ALL" ? "All" : t === "READING" ? "Reading Aloud" : "SBC"}
              </button>
            ))}
          </div>

          {loading ? (
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
                <div className="section-label">{topic}</div>
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
  return (
    <Link href={`/practice/${exercise.id}`}>
      <div className="card" style={{ cursor: "pointer" }}>
        <div className="card-title">{exercise.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          {exercise.topic}
        </div>
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
