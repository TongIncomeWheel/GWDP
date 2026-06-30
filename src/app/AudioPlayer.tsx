"use client";

export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
          {label}
        </div>
      )}
      <audio controls src={src} style={{ width: "100%", minHeight: 48 }} />
    </div>
  );
}
