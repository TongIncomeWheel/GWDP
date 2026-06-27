"use client";

import { useState } from "react";
import BottomNav from "../BottomNav";

type Tab = "reading" | "sbc";

interface BandRow {
  band: string;
  label: string;
  description: string;
  color: string;
}

function BandTable({ title, bands }: { title: string; bands: BandRow[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--purple-soft, #A78BFA)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bands.map((b) => (
          <div
            key={b.band}
            className="card"
            style={{
              borderLeft: `4px solid ${b.color}`,
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: b.color,
                marginBottom: 4,
              }}
            >
              Band {b.band} — {b.label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #A8A3C4)",
                lineHeight: 1.5,
              }}
            >
              {b.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEAL = "var(--teal, #2DD4BF)";
const BLUE = "var(--blue, #60A5FA)";
const GOLD = "var(--gold, #FBBF24)";
const CORAL = "var(--coral, #F87171)";
const CORAL_DIM = "rgba(248, 113, 113, 0.55)";
const MUTED = "var(--text-muted, #6E6A8E)";

const readingPronunciation: BandRow[] = [
  { band: "9-10", label: "Excellent", color: TEAL, description: "Near-native clarity, all words pronounced correctly, clear consonant clusters, accurate vowel sounds." },
  { band: "7-8", label: "Good", color: BLUE, description: "Most words correct, minor errors on difficult words only." },
  { band: "5-6", label: "Adequate", color: GOLD, description: "Several pronunciation errors, some unclear, meaning mostly conveyed." },
  { band: "3-4", label: "Below Average", color: CORAL, description: "Frequent errors, many words unclear, listener must guess." },
  { band: "1-2", label: "Poor", color: CORAL_DIM, description: "Severe issues, most words unrecognizable." },
  { band: "0", label: "No attempt", color: MUTED, description: "No attempt made." },
];

const readingRhythm: BandRow[] = [
  { band: "9-10", label: "Excellent", color: TEAL, description: "Natural rhythm, appropriate pausing at punctuation, varied intonation matching sentence meaning (questions rise, exclamations emphasise), expressive delivery of dialogue vs narration." },
  { band: "7-8", label: "Good", color: BLUE, description: "Generally fluent, reasonable pausing, some expression." },
  { band: "5-6", label: "Adequate", color: GOLD, description: "Noticeable hesitations, mostly monotone, basic pausing." },
  { band: "3-4", label: "Below Average", color: CORAL, description: "Frequent pauses/restarts, choppy, monotone, rushed or painfully slow." },
  { band: "1-2", label: "Poor", color: CORAL_DIM, description: "Extremely halting, no expression, word-by-word decoding." },
  { band: "0", label: "No attempt", color: MUTED, description: "No attempt made." },
];

const sbcContent: BandRow[] = [
  { band: "9-10", label: "Excellent", color: TEAL, description: "Clear point, relevant personal examples, logical explanation, strong link. Uses PEEL/TREES framework naturally." },
  { band: "7-8", label: "Good", color: BLUE, description: "Reasonable point with some supporting detail. Framework present but may lack depth." },
  { band: "5-6", label: "Adequate", color: GOLD, description: "Partially addresses question. Limited examples. Weak structure." },
  { band: "3-4", label: "Below Average", color: CORAL, description: "Vague/off-topic. No clear structure. Irrelevant examples." },
  { band: "1-2", label: "Poor", color: CORAL_DIM, description: "Barely addresses question. One or two words/sentences." },
  { band: "0", label: "No response", color: MUTED, description: "No response given." },
];

const sbcLanguage: BandRow[] = [
  { band: "9-10", label: "Excellent", color: TEAL, description: "Rich, varied vocabulary. Accurate grammar. Sophisticated sentences." },
  { band: "7-8", label: "Good", color: BLUE, description: "Good vocabulary variety. Minor grammar errors." },
  { band: "5-6", label: "Adequate", color: GOLD, description: 'Basic vocabulary ("good", "bad", "happy"). Some grammar errors.' },
  { band: "3-4", label: "Below Average", color: CORAL, description: "Very limited vocabulary. Frequent grammar errors." },
  { band: "1-2", label: "Poor", color: CORAL_DIM, description: "Minimal language. Severe grammar issues." },
  { band: "0", label: "No response", color: MUTED, description: "No response given." },
];

const sbcEngagement: BandRow[] = [
  { band: "9-10", label: "Excellent", color: TEAL, description: "Confident, fluent. Natural elaboration. Cohesive with transitions." },
  { band: "7-8", label: "Good", color: BLUE, description: "Mostly fluent. Reasonable elaboration." },
  { band: "5-6", label: "Adequate", color: GOLD, description: "Some hesitation. Limited elaboration. Few transitions." },
  { band: "3-4", label: "Below Average", color: CORAL, description: "Frequent hesitation. Very short. Disjointed." },
  { band: "1-2", label: "Poor", color: CORAL_DIM, description: "Extremely hesitant. One-word answers." },
  { band: "0", label: "No response", color: MUTED, description: "No response given." },
];

export default function RubricPage() {
  const [tab, setTab] = useState<Tab>("reading");

  return (
    <>
      <header className="page-header">
        <h1>Scoring Rubric</h1>
        <div className="subtitle">PSLE English Oral examination criteria</div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              className={`filter-pill${tab === "reading" ? " active" : ""}`}
              onClick={() => setTab("reading")}
            >
              Reading Aloud
            </button>
            <button
              className={`filter-pill${tab === "sbc" ? " active" : ""}`}
              onClick={() => setTab("sbc")}
            >
              SBC
            </button>
          </div>

          {/* Reading Aloud Section */}
          {tab === "reading" && (
            <>
              <BandTable
                title="Criterion 1: Pronunciation & Articulation (0-10)"
                bands={readingPronunciation}
              />
              <BandTable
                title="Criterion 2: Rhythm, Fluency & Expressiveness (0-10)"
                bands={readingRhythm}
              />

              {/* Additional Reading Assessment Factors */}
              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--purple-soft, #A78BFA)",
                    marginBottom: 12,
                  }}
                >
                  Additional Reading Assessment Factors
                </h3>
                <div className="card" style={{ padding: "14px 16px" }}>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      color: "var(--text-secondary, #A8A3C4)",
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        Completeness:
                      </strong>{" "}
                      Must read the ENTIRE passage. Partial reading caps at 4/10.
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        Punctuation Awareness:
                      </strong>{" "}
                      Commas = brief pause, full stops = longer pause, question marks
                      = rising intonation, exclamation marks = emphasis.
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        Tone Matching:
                      </strong>{" "}
                      Dialogue should sound different from narrative. Emotional
                      moments need matching tone.
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        Pace Control:
                      </strong>{" "}
                      Not too fast, not too slow. Natural conversational pace with
                      variation.
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* SBC Section */}
          {tab === "sbc" && (
            <>
              <BandTable
                title="Criterion 1: Personal Response & Content (0-10)"
                bands={sbcContent}
              />
              <BandTable
                title="Criterion 2: Clarity of Expression & Language (0-10)"
                bands={sbcLanguage}
              />
              <BandTable
                title="Criterion 3: Engagement & Conversational Quality (0-10)"
                bands={sbcEngagement}
              />
            </>
          )}

          {/* Scoring Tips */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--purple-soft, #A78BFA)",
                marginBottom: 12,
              }}
            >
              Scoring Tips
            </h3>
            <div className="card" style={{ padding: "14px 16px" }}>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  color: "var(--text-secondary, #A8A3C4)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <li>
                  <strong style={{ color: "var(--teal, #2DD4BF)" }}>PEEL</strong>{" "}
                  = Point, Evidence/Example, Explanation, Link
                </li>
                <li>
                  <strong style={{ color: "var(--teal, #2DD4BF)" }}>TREES</strong>{" "}
                  = Topic sentence, Reason, Evidence, Explanation, Summary
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                    Reading Total:
                  </strong>{" "}
                  /20 (2 criteria x 10)
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                    SBC Total:
                  </strong>{" "}
                  /30 (3 criteria x 10)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <BottomNav active="rubric" />
    </>
  );
}
