"use client";

import { useEffect, useState } from "react";

export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let url: string;

    if (src.startsWith("data:")) {
      // iOS Safari can't reliably fetch() data URLs — decode directly
      try {
        const comma = src.indexOf(",");
        const header = src.slice(0, comma);
        const base64 = src.slice(comma + 1);
        const mimeMatch = header.match(/data:(.*?);/);
        const mime = mimeMatch?.[1] || "audio/webm";
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: mime });
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        setBlobUrl(src);
      }
    } else {
      fetch(src)
        .then((r) => r.blob())
        .then((blob) => {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch(() => setBlobUrl(src));
    }

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
