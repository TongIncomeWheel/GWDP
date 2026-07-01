"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Fetches audio as a blob and plays it locally.
 *
 * Two fixes for Chrome MediaRecorder WebM:
 * 1. Blob fetch: eliminates the range-request duration scan that causes ~10s
 *    of silence when loading from a stream URL.
 * 2. Duration fix: Chrome WebM has no Duration element → audio.duration = Infinity
 *    → browser puts the playhead at an unknown position. Setting currentTime = 1e101
 *    forces the browser to scan to the end of the blob (fast, in RAM), which lets
 *    it determine the real duration. Then we reset to 0 so play starts from the top.
 *
 * Used identically on practice, results, and parent pages.
 */
export default function AudioPlayer({ src, label }: { src: string; label: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const currentBlobUrl = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isFinite(audio.duration)) {
      // Chrome WebM: no Duration element → duration = Infinity.
      // Seek to a huge time value to force the browser to scan the entire blob
      // (it's already in RAM so this is instant), which resolves the real duration.
      // Then reset to 0 so playback starts from the beginning.
      audio.currentTime = 1e101;
      const resetToStart = () => {
        audio.currentTime = 0;
        audio.removeEventListener("timeupdate", resetToStart);
      };
      audio.addEventListener("timeupdate", resetToStart);
    }
  };

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
          ref={audioRef}
          controls
          src={blobUrl ?? undefined}
          style={{ flex: 1, height: 32 }}
          onError={() => setError(true)}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </div>
  );
}
