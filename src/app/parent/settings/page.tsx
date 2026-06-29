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
    resendApiKey: "",
    resendFromEmail: "",
    gmailUser: "",
    gmailAppPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [showGmailPass, setShowGmailPass] = useState(false);
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  const [hasEffectiveApiKey, setHasEffectiveApiKey] = useState(false);
  const [hasResendKey, setHasResendKey] = useState(false);
  const [hasGmail, setHasGmail] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data as AppSettings);
        setHasEnvApiKey(!!data.hasEnvApiKey);
        setHasEffectiveApiKey(!!data.hasEffectiveApiKey);
        setHasResendKey(!!data.hasResendKey);
        setHasGmail(!!data.hasGmail);
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

            {/* Gmail (recommended — no domain needed) */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Option 1 — Gmail (recommended, no domain needed)
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Gmail Address</label>
                <input
                  type="email"
                  value={settings.gmailUser}
                  onChange={(e) => setSettings({ ...settings, gmailUser: e.target.value })}
                  placeholder="yourname@gmail.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Gmail App Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showGmailPass ? "text" : "password"}
                    value={settings.gmailAppPassword}
                    onChange={(e) => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    style={{ ...inputStyle, paddingRight: 48 }}
                  />
                  <button type="button" onClick={() => setShowGmailPass(!showGmailPass)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "4px 8px" }}>
                    {showGmailPass ? "Hide" : "Show"}
                  </button>
                </div>
                <p style={helpStyle}>
                  Not your Gmail password. Go to{" "}
                  <span style={{ color: "var(--primary)", fontWeight: 600 }}>myaccount.google.com → Security → 2-Step Verification → App Passwords</span>
                  {" "}and generate one for &quot;Mail&quot;.
                </p>
                {hasGmail && <p style={{ ...helpStyle, color: "var(--teal, #2DD4BF)", marginTop: 4 }}>✓ Gmail configured — sends to anyone, no domain required.</p>}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0" }} />

            {/* Resend API Key */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Option 2 — Resend (requires verified domain)
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Resend API Key</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showResendKey ? "text" : "password"}
                  value={settings.resendApiKey}
                  onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowResendKey(!showResendKey)}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "4px 8px" }}
                >
                  {showResendKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={helpStyle}>
                Get your free API key at{" "}
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>resend.com</span>
                {" "}— free tier is 3,000 emails/month.
              </p>
              {hasResendKey && (
                <p style={{ ...helpStyle, color: "var(--teal, #2DD4BF)", marginTop: 4 }}>
                  ✓ Resend key is configured — emails will be sent.
                </p>
              )}
              {!hasResendKey && (
                <p style={{ ...helpStyle, color: "var(--coral, #F87171)", marginTop: 4 }}>
                  No Resend key — notifications will be skipped until configured.
                </p>
              )}
            </div>

            {/* From email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>From Email Address</label>
              <input
                type="text"
                value={settings.resendFromEmail}
                onChange={(e) => setSettings({ ...settings, resendFromEmail: e.target.value })}
                placeholder="GWDP <notifications@yourdomain.com>"
                style={inputStyle}
              />
              <p style={helpStyle}>Must be a domain you have verified in Resend. Leave blank to use Resend&apos;s default.</p>
            </div>

            {/* Recipient emails */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Notification Emails</label>
              <input
                type="text"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                placeholder="mum@email.com, dad@email.com"
                style={inputStyle}
              />
              <p style={helpStyle}>Separate multiple addresses with a comma. All recipients receive every notification.</p>
            </div>

            {/* Test email button */}
            {settings.notificationEmail && (
              <div style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={async () => {
                    setTestingEmail(true);
                    setTestResult(null);
                    try {
                      const res = await fetch("/api/notify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "test" }),
                      });
                      const data = await res.json();
                      if (data.sent) {
                        setTestResult({ ok: true, msg: `Test email sent to ${settings.notificationEmail}` });
                      } else {
                        setTestResult({ ok: false, msg: data.reason || data.error || "Failed to send" });
                      }
                    } catch {
                      setTestResult({ ok: false, msg: "Network error" });
                    } finally {
                      setTestingEmail(false);
                    }
                  }}
                  disabled={testingEmail}
                  style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", color: "var(--text-primary)", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}
                >
                  {testingEmail ? "Sending..." : "Send Test Email"}
                </button>
                {testResult && (
                  <p style={{ ...helpStyle, marginTop: 6, color: testResult.ok ? "var(--teal, #2DD4BF)" : "var(--coral, #F87171)", fontWeight: 600 }}>
                    {testResult.ok ? "✓ " : "✗ "}{testResult.msg}
                  </p>
                )}
              </div>
            )}

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

          {/* Reset App Data */}
          <div className="card" style={{ marginTop: 24, border: "1px solid rgba(248,113,113,0.3)" }}>
            <div className="card-title" style={{ color: "var(--coral)" }}>Danger Zone</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              Use this before going live to clear all UAT / test practice data.
              This permanently deletes all practice history and resets the streak counter.
              Exercise content and settings are not affected.
            </p>
            <button
              className="btn btn-danger"
              style={{ fontSize: 14 }}
              onClick={async () => {
                if (!confirm("⚠️ This will permanently delete ALL practice history and reset the streak counter to zero.\n\nThis cannot be undone. Proceed?")) return;
                if (!confirm("Are you absolutely sure? All session data will be lost.")) return;
                try {
                  const res = await fetch("/api/admin/reset", { method: "DELETE" });
                  const data = await res.json();
                  if (res.ok) {
                    // Also clear local cached images so exercises regenerate fresh
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key?.startsWith("poster_img_")) keysToRemove.push(key);
                    }
                    keysToRemove.forEach((k) => localStorage.removeItem(k));
                    alert("App data reset successfully. The app is ready for live use.");
                    router.push("/parent");
                  } else {
                    alert(`Reset failed: ${data.error}`);
                  }
                } catch {
                  alert("Network error during reset. Please try again.");
                }
              }}
            >
              Reset All Practice Data
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
