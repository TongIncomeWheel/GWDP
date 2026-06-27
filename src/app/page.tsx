"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OralExercise } from "@/lib/types";
import BottomNav from "./BottomNav";

export default function HomePage() {
  const [exercises, setExercises] = useState<OralExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => {
        setExercises(data);
        setLoading(false);
      });
  }, []);

  const dailyExercises = exercises.filter((e) => e.isDaily);
  const allExercises = exercises.filter((e) => !e.isDaily);

  return (
    <>
      <header className="page-header">
        <h1>PSLE Oral Practice</h1>
        <div className="subtitle">Singapore Primary School English Oral</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading exercises...</span>
            </div>
          ) : (
            <>
              {dailyExercises.length > 0 && (
                <>
                  <div className="section-label">Daily Practice</div>
                  {dailyExercises.map((ex) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </>
              )}

              {allExercises.length > 0 && (
                <>
                  <div className="section-label">All Exercises</div>
                  {allExercises.map((ex) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </>
              )}

              {exercises.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <p>No exercises available yet.</p>
                </div>
              )}
            </>
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
