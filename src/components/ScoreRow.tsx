export function ScoreRow({ label, score }: { label: string; score: number }) {
  const barWidth = (score / 10) * 100;
  const barColor =
    score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{score}/10</span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barWidth}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.5s",
          }}
        />
      </div>
    </div>
  );
}
