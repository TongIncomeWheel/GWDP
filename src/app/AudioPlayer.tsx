"use client";

import { useState } from "react";

export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  const [error, setError] = useState(false);

  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
          {label}
        </div>
      )}
      {error ? (
        <div style={{ fontSize: 12, color: "#c0392b", padding: "8px 0" }}>
          Audio could not be loaded. Please try refreshing the page.
        </div>
      ) : (
        <audio
          controls
          src={src}
          style={{ width: "100%", minHeight: 48 }}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
