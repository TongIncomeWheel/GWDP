"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: "",
    notificationEmail: "",
    emailOnCompletion: true,
    emailOnMissed: true,
    childName: "",
    dailyPracticeGoal: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  const [hasEffectiveApiKey, setHasEffectiveApiKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data as AppSettings);
        setHasEnvApiKey(!!data.hasEnvApiKey);
        setHasEffectiveApiKey(!!data.hasEffectiveApiKey);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(`Failed to save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/parent")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                width: 32,
                height: 32,
                borderRadius: 8,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &#8592;
            </button>
            <h1 style={{ margin: 0 }}>Settings</h1>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>
          {/* Child Profile */}
          <div className="card">
            <div className="card-title">Child Profile</div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Child&apos;s Name</label>
              <input
                type="text"
                value={settings.childName}
                onChange={(e) => setSettings({ ...settings, childName: e.target.value })}
                placeholder="e.g. Sarah"
                style={inputStyle}
              />
              <p style={helpStyle}>Used in notifications and reports.</p>
            </div>
            <div>
              <label style={labelStyle}>Daily Practice Goal</label>
              <select
                value={settings.dailyPracticeGoal}
                onChange={(e) =>
                  setSettings({ ...settings, dailyPracticeGoal: parseInt(e.target.value, 10) })
                }
                style={inputStyle}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} exercise{n > 1 ? "s" : ""} per day
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* API Configuration */}
          <div className="card">
            <div className="card-title">AI Configuration</div>
            <div>
              <label style={labelStyle}>Gemini API Key</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="Enter your Gemini API key"
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: "4px 8px",
                  }}
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={helpStyle}>
                Get your key from{" "}
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  aistudio.google.com
                </span>
                . Settings are saved in Firestore and persist across deployments.
              </p>
              {hasEnvApiKey && (
                <p style={{ ...helpStyle, color: "var(--teal, #2DD4BF)", marginTop: 6 }}>
                  Server environment variable GEMINI_API_KEY is set. This is used as a fallback if no key is entered above.
                </p>
              )}
              {hasEffectiveApiKey && !settings.geminiApiKey && (
                <p style={{ ...helpStyle, color: "var(--teal, #2DD4BF)", marginTop: 4 }}>
                  Using server environment variable for API access.
                </p>
              )}
              {!hasEffectiveApiKey && (
                <p style={{ ...helpStyle, color: "var(--coral, #F87171)", marginTop: 6 }}>
                  No API key configured. Enter one above or set GEMINI_API_KEY in Cloud Run environment variables.
                </p>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-title">Notifications</div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Notification Email</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                placeholder="parent@email.com"
                style={inputStyle}
              />
              <p style={helpStyle}>Email address to receive practice notifications.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={toggleRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Completion alerts</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Get notified when an exercise is completed
                  </div>
                </div>
                <div
                  onClick={() =>
                    setSettings({ ...settings, emailOnCompletion: !settings.emailOnCompletion })
                  }
                  style={{
                    ...toggleTrack,
                    background: settings.emailOnCompletion ? "var(--primary)" : "#ccc",
                  }}
                >
                  <div
                    style={{
                      ...toggleThumb,
                      transform: settings.emailOnCompletion ? "translateX(20px)" : "translateX(2px)",
                    }}
                  />
                </div>
              </label>

              <label style={toggleRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Missed practice alerts</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Get reminded if the daily goal isn&apos;t met
                  </div>
                </div>
                <div
                  onClick={() =>
                    setSettings({ ...settings, emailOnMissed: !settings.emailOnMissed })
                  }
                  style={{
                    ...toggleTrack,
                    background: settings.emailOnMissed ? "var(--primary)" : "#ccc",
                  }}
                >
                  <div
                    style={{
                      ...toggleThumb,
                      transform: settings.emailOnMissed ? "translateX(20px)" : "translateX(2px)",
                    }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          {error && (
            <div
              style={{
                background: "var(--danger-bg, #fef2f2)",
                color: "var(--danger)",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {saved && (
            <div
              style={{
                background: "var(--teal-soft, #f0fdf4)",
                color: "var(--teal, #16a34a)",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Settings saved successfully!
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", padding: "14px 0", fontSize: 15 }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          {/* Reset PIN */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              onClick={() => {
                if (confirm("Reset your parent PIN? You will need to set a new one.")) {
                  localStorage.removeItem("parentPin");
                  router.push("/parent");
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--danger, #dc2626)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Reset Parent PIN
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "var(--text-primary)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid var(--border, #e5e7eb)",
  fontSize: 14,
  background: "var(--bg-elevated, #2A254A)",
  color: "var(--text-primary, #F1F0F7)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const helpStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginTop: 4,
  marginBottom: 0,
};

const toggleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  gap: 12,
};

const toggleTrack: React.CSSProperties = {
  width: 44,
  height: 24,
  borderRadius: 12,
  position: "relative",
  flexShrink: 0,
  transition: "background 0.2s",
  cursor: "pointer",
};

const toggleThumb: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 10,
  background: "white",
  position: "absolute",
  top: 2,
  transition: "transform 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
