"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Fetches audio as a blob and plays it locally.
 * Pre-fetching eliminates the browser's range-request duration scan
 * that causes ~10s of silence before WebM playback starts.
 * Used identically on practice, results, and parent pages.
 */
export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const currentBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    setBlobUrl(null);

    let cancelled = false;

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
        const url = URL.createObjectURL(blob);
        currentBlobUrl.current = url;
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--bg-elevated)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        marginTop: 6,
        border: "1px solid var(--border)",
        marginBottom: 6,
      }}
    >
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {label}
        </div>
      )}
      {error ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          Recording unavailable.
        </div>
      ) : loading ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          ⏳ Loading…
        </div>
      ) : (
        <audio
          controls
          src={blobUrl ?? undefined}
          style={{ flex: 1, height: 32 }}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
