"use client";

import { useEffect, useState } from "react";

export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let url: string;
    // Convert data: URL to a real Blob URL so browsers can determine duration
    // and play without needing a seek first.
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(src)); // fallback: use data URL directly

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
          {label}
        </div>
      )}
      {blobUrl ? (
        <audio controls src={blobUrl} style={{ width: "100%", minHeight: 48 }} />
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>
          Loading audio…
        </div>
      )}
    </div>
  );
}
