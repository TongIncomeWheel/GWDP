import type { StructuredTranscript } from "@/lib/types";

const PEEL_COLORS: Record<string, { bg: string; text: string }> = {
  Point: { bg: "#BBDEFB", text: "#0D47A1" },
  Evidence: { bg: "#C8E6C9", text: "#1B5E20" },
  Explanation: { bg: "#FFE0B2", text: "#E65100" },
  Link: { bg: "#E1BEE7", text: "#4A148C" },
};

function PeelRow({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  const colors = PEEL_COLORS[label] || { bg: "#E0E0E0", text: "#333" };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.text,
          background: colors.bg,
          padding: "2px 8px",
          borderRadius: 4,
          flexShrink: 0,
          lineHeight: "16px",
          marginTop: 1,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, lineHeight: "18px" }}>{text}</span>
    </div>
  );
}

export function StructuredTranscriptView({ raw, label }: { raw: string | null; label: string }) {
  if (!raw) return null;

  let st: StructuredTranscript;
  try {
    st = JSON.parse(raw);
  } catch {
    return null;
  }

  const coherenceBg =
    st.overallCoherence === "strong"
      ? "#D1FAE5"
      : st.overallCoherence === "moderate"
        ? "#FEF3C7"
        : "#FEE2E2";
  const coherenceText =
    st.overallCoherence === "strong"
      ? "#065F46"
      : st.overallCoherence === "moderate"
        ? "#92400E"
        : "#991B1B";

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
        {label} &mdash; {st.framework} Framework
      </div>

      <PeelRow label="Point" text={st.point} />
      <PeelRow label="Evidence" text={st.evidence} />
      <PeelRow label="Explanation" text={st.explanation} />
      <PeelRow label="Link" text={st.link} />

      <div style={{ marginTop: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 10,
            background: coherenceBg,
            color: coherenceText,
          }}
        >
          Coherence: {st.overallCoherence}
        </span>
      </div>

      {st.vocabularyHighlights && st.vocabularyHighlights.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <strong>Vocabulary:</strong> {st.vocabularyHighlights.join(", ")}
        </div>
      )}

      {st.grammarNotes && st.grammarNotes.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
          <strong>Grammar:</strong> {st.grammarNotes.join("; ")}
        </div>
      )}
    </div>
  );
}
