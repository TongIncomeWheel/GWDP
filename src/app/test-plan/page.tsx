"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Status = "untested" | "pass" | "fail" | "blocked";

interface TestResult {
  status: Status;
  notes: string;
  tester: string;
  updatedAt: number;
}

interface TestCase {
  id: string;
  name: string;
  expected: string;
  steps?: string[];
}

interface Section {
  id: string;
  title: string;
  tests: TestCase[];
}

// ── All test cases ────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "setup",
    title: "1 — Environment Setup",
    tests: [
      { id: "S-01", name: "App loads", expected: "Home screen with exercise list appears within 3s." },
      { id: "S-02", name: "Exercises exist", expected: "At least one Reading and one SBC exercise visible on home screen." },
      { id: "S-03", name: "Gemini API key set", expected: "Parent → Settings → AI Config: key present or 'Using server environment variable' shown." },
      { id: "S-04", name: "Testing on real device", expected: "Not browser emulation — use a real Android phone and a real iPhone." },
      { id: "S-05", name: "No leftover UAT data", expected: "If starting fresh: Danger Zone → Reset All Practice Data confirmed. Exercise content intact." },
    ],
  },
  {
    id: "ux-home",
    title: "2.1 — UX: Home Screen",
    tests: [
      { id: "U-01", name: "Dark theme", expected: "Background is deep purple/navy. Text is off-white. No white flash on load." },
      { id: "U-02", name: "Exercise cards readable", expected: "Title, topic, type badge (Reading/SBC), difficulty badge all visible. No clipped text." },
      { id: "U-03", name: "Bottom nav present", expected: "Home, History, Parent tabs visible at bottom. Active tab highlighted." },
      { id: "U-04", name: "Type filter pills", expected: "Tapping Reading/SBC/All/Daily updates the card list instantly." },
      { id: "U-05", name: "Difficulty filter stacks", expected: "Setting type=SBC + difficulty=Advanced shows only Advanced SBC cards." },
      { id: "U-06", name: "Re-Practice badge", expected: "After parent sends for re-practice, exercise card shows gold '↩ RE-PRACTICE' badge." },
      { id: "U-07", name: "Streak dashboard", expected: "After 1+ session: ring chart, streak count, today's count, Avg Score all visible." },
      { id: "U-08", name: "ReRe mascot", expected: "Mascot image visible with mood-appropriate message." },
      { id: "U-09", name: "Generate panel", expected: "Tap 'New': topic picker and difficulty selector appear. Cancel closes." },
      { id: "U-10", name: "Smooth scrolling", expected: "Fast scroll on exercise list is smooth. Cards do not jump or flash." },
    ],
  },
  {
    id: "ux-practice",
    title: "2.2 — UX: Practice Screen",
    tests: [
      { id: "U-11", name: "Reading passage readable", expected: "Passage text scrollable. Font ≥13px, comfortable line height." },
      { id: "U-12", name: "SBC question navigation", expected: "Q1 shown first. Next Question advances to Q2, Q3. Progress indicator visible." },
      { id: "U-13", name: "SBC stimulus image", expected: "Image fills width without distortion. Falls back to text description if no image." },
      { id: "U-14", name: "Record button clear", expected: "Before recording: prominent red/coral button labelled 'Start Recording'." },
      { id: "U-15", name: "Recording active state", expected: "While recording: button says 'Stop Recording'. Timer or live transcript area visible." },
      { id: "U-16", name: "Live transcript appears", expected: "On desktop Chrome or iOS: words appear in real time while speaking." },
      { id: "U-17", name: "Speech diag strip visible", expected: "During/after recording: small strip shows event, error, restarts, results values." },
      { id: "U-18", name: "Done state after stop", expected: "After stopping: state shows 'done'. Audio player appears. Submit enabled if all done." },
      { id: "U-19", name: "Submit disabled until all done", expected: "On fresh load: Submit button is disabled. Becomes enabled only after all questions recorded." },
      { id: "U-20", name: "Preamble/tips readable", expected: "Reading tips card is readable and scrollable if long." },
    ],
  },
  {
    id: "ux-results",
    title: "2.3 — UX: Results & History",
    tests: [
      { id: "U-21", name: "Results page loads after submit", expected: "Redirected to /results/[id]. Score circle visible." },
      { id: "U-22", name: "Score colour coding", expected: "Green ≥70%, yellow 50–69%, red <50%. Consistent across all screens." },
      { id: "U-23", name: "AI feedback readable", expected: "General Feedback, Strengths, Areas for Improvement all visible with clear headings." },
      { id: "U-24", name: "Audio playback on results", expected: "Audio player visible and plays recorded audio." },
      { id: "U-25", name: "History lists sessions", expected: "Sessions listed newest first. Date, title, score, type shown per row." },
      { id: "U-26", name: "History score colours", expected: "Colour coding matches results page (green/yellow/red)." },
      { id: "U-27", name: "Rubric page readable", expected: "Band descriptors shown for Reading and SBC. Toggle between two tabs works." },
    ],
  },
  {
    id: "ux-parent",
    title: "2.4 — UX: Parent Dashboard",
    tests: [
      { id: "U-28", name: "Parent loads without PIN", expected: "Tapping Parent tab opens dashboard directly. No PIN prompt." },
      { id: "U-29", name: "Overview stats visible", expected: "Total Sessions, Average Score, Best Score, Current Streak all show numbers." },
      { id: "U-30", name: "Session list readable", expected: "Each card: title, date, type, score fraction, AI score." },
      { id: "U-31", name: "Archived toggle works", expected: "Tap 'Show Archived' → list switches to closed sessions with 'Archived' badge." },
      { id: "U-32", name: "Parent session detail loads", expected: "Tapping a session opens /parent/session/[id] with title in header and score circle." },
      { id: "U-33", name: "Passage visible on detail", expected: "Reading Passage or Stimulus Questions section is expanded and readable." },
      { id: "U-34", name: "Sections collapse and expand", expected: "Passage, Recordings, AI Feedback, Model Answers each toggle independently." },
      { id: "U-35", name: "Grading sliders work", expected: "Dragging sliders updates value label in real time. Total recalculates. Range 0–10." },
      { id: "U-36", name: "Settings load (no PIN section)", expected: "Child Profile, AI Config, Notifications, Danger Zone all visible. No 'Reset Parent PIN' button." },
    ],
  },
  {
    id: "func-exercises",
    title: "3.1 — Functional: Exercise Loading",
    tests: [
      { id: "F-01", name: "Exercises load on home", expected: "Exercise cards render within 3s on normal connection." },
      { id: "F-02", name: "Exercise ID in URL", expected: "Tapping exercise: URL becomes /practice/[id] matching that exercise." },
      { id: "F-03", name: "Correct content per ID", expected: "Opening exercise ID 1 shows that specific passage/questions, not generic content." },
      { id: "F-04", name: "Type routing", expected: "Reading shows passage. SBC shows 3 questions with navigation between them." },
      { id: "F-05", name: "SBC image generates", expected: "First open of new SBC: spinner shown, image appears within ~10s, persists on revisit." },
    ],
  },
  {
    id: "func-audio",
    title: "3.2 — Functional: Audio Capture (MediaRecorder)",
    tests: [
      { id: "F-06", name: "Mic permission prompt", expected: "First tap of Record: browser shows microphone permission dialog." },
      { id: "F-07", name: "Permission denied handled", expected: "Deny mic → error message shown. Record button not stuck in recording state." },
      { id: "F-08", name: "Audio captured", expected: "Record 5 seconds, stop → audio player appears with playable recording." },
      { id: "F-09", name: "Audio plays back", expected: "Tap play → audio plays. Duration shown. Volume audible." },
      { id: "F-10", name: "Audio cross-device", expected: "Audio recorded on Android plays back on iOS and desktop (webm/mp4 fallback)." },
      { id: "F-11", name: "Re-record clears previous", expected: "Record, stop, tap Re-record → previous audio disappears. Fresh recording starts." },
      { id: "F-12", name: "SBC multi-question audio", expected: "Record Q1 and Q2 → each has its own player. Q1 audio is not overwritten by Q2." },
    ],
  },
  {
    id: "func-speech",
    title: "3.3 — Functional: Speech Recognition (Transcript)",
    tests: [
      { id: "F-13", name: "Live transcript on iOS Safari", expected: "Record on iPhone, speak clearly → words appear in real time." },
      { id: "F-14", name: "Live transcript on desktop Chrome", expected: "Record on desktop, speak → words appear in real time." },
      { id: "F-15", name: "Android transcript diagnosis", expected: "Record on Android → note speech diag strip values (event/error/restarts/results). Record in Notes field — do not mark FAIL without engineering sign-off." },
      { id: "F-16", name: "Empty transcript submittable", expected: "Record silence → Submit button becomes enabled. Session can be submitted." },
      { id: "F-17", name: "Transcript persists to server", expected: "Submit session → open parent session detail → transcript text visible." },
      { id: "F-18", name: "Network error warning shown", expected: "Speech network error → gold warning banner appears. Submit is still enabled." },
    ],
  },
  {
    id: "func-ai",
    title: "3.4 — Functional: Submit & AI Evaluation",
    tests: [
      { id: "F-19", name: "Submit sends to server", expected: "Tap Submit → new session appears in parent list within 30s." },
      { id: "F-20", name: "Evaluating state shown", expected: "Immediately after submit: results page shows evaluating/pending state." },
      { id: "F-21", name: "AI evaluation completes", expected: "Scores, feedback, strengths, improvements all appear within 60s." },
      { id: "F-22", name: "Scores in valid range", expected: "Score1, Score2, Score3 each 0–10. Total = sum of applicable scores." },
      { id: "F-23", name: "Model answers present", expected: "Model answer for each question shown below AI feedback." },
      { id: "F-24", name: "No double evaluation", expected: "Reload results page → scores unchanged. No second API call." },
      { id: "F-25", name: "Evaluating flag clears", expected: "After evaluation: spinner gone, scores visible, no 'Evaluating…' state stuck." },
    ],
  },
  {
    id: "func-nav",
    title: "3.5 — Functional: Navigation",
    tests: [
      { id: "F-26", name: "Back from results", expected: "Practice → Submit → Results → tap Back → goes to home, not back to practice." },
      { id: "F-27", name: "Home tab", expected: "Tap Home from any page → home screen with exercise list." },
      { id: "F-28", name: "History tab", expected: "Tap History → session list with scores and dates." },
      { id: "F-29", name: "Parent tab", expected: "Tap Parent → parent dashboard loads directly." },
      { id: "F-30", name: "Direct URL access", expected: "Navigate to /parent/session/[id] directly → page loads without redirect." },
      { id: "F-31", name: "404 session", expected: "Navigate to /parent/session/99999 → 'Session not found' message with Back button." },
    ],
  },
  {
    id: "e2e",
    title: "4 — Practice Scenarios (End-to-End)",
    tests: [
      {
        id: "TC-01",
        name: "First Reading Aloud session",
        expected: "Audio records and plays back ✓  Submit transitions to results ✓  AI scores appear within 60s ✓  Strengths and improvements present ✓  Session appears in History ✓",
        steps: [
          "Open app on a fresh state. Home screen loads with exercises.",
          "Tap a Reading Aloud exercise card.",
          "Read the preamble. Tap Start Recording.",
          "Read the passage aloud for 30–60 seconds. Tap Stop.",
          "Confirm audio plays back correctly.",
          "Tap Submit for Grading.",
          "Wait on results page — scores appear within 60 seconds.",
          "Verify score circle, feedback paragraphs, model answer all present.",
          "Open History tab — session appears there too.",
        ],
      },
      {
        id: "TC-02",
        name: "First SBC session (3 questions)",
        expected: "Each question has independent audio ✓  Navigation doesn't erase recordings ✓  All 3 transcripts on results ✓  3 separate AI scores ✓  Total = Score1+Score2+Score3 ✓",
        steps: [
          "Tap an SBC exercise. View stimulus image (or description).",
          "Read Q1. Tap Start Recording. Speak 20–30 seconds. Tap Stop.",
          "Tap Next Question. Record Q2. Tap Stop.",
          "Tap Next Question. Record Q3. Tap Stop.",
          "Verify three separate audio players shown.",
          "Tap Submit for Grading. Wait for AI evaluation.",
        ],
      },
      {
        id: "TC-03",
        name: "Re-record before submit",
        expected: "Re-record clears previous audio ✓  New recording captured ✓  Submitted session uses re-recorded audio ✓",
        steps: [
          "On practice page, complete recording #1.",
          "Tap Re-record. Confirm previous audio player disappears.",
          "Record a new response. Confirm new audio player appears.",
          "Submit. Open parent detail — new audio plays.",
        ],
      },
      {
        id: "TC-04",
        name: "Session persists after browser close",
        expected: "Session still listed after full browser close and reopen ✓  Score unchanged ✓  Detail opens correctly ✓",
        steps: [
          "Open History tab. Note the top session's score.",
          "Close the browser completely.",
          "Reopen the app. Open History tab.",
          "Confirm session is still there with the same score.",
        ],
      },
      {
        id: "TC-05",
        name: "Multiple sessions for same exercise",
        expected: "Two separate sessions in History ✓  Scores may differ — expected ✓  Both visible in parent dashboard ✓",
        steps: [
          "Tap the same exercise again (one session already exists).",
          "Record and submit a second time.",
          "Open History — confirm two entries for the same exercise title.",
        ],
      },
      {
        id: "TC-06",
        name: "Low-score session (short/silent recording)",
        expected: "Submit succeeds ✓  AI evaluates (low scores expected) ✓  Feedback still present ✓  No infinite spinner ✓",
        steps: [
          "Open any exercise. Tap Record. Wait 2 seconds. Tap Stop.",
          "Submit.",
          "Confirm results page shows scores (likely low) and feedback.",
          "Confirm no infinite 'Evaluating…' state.",
        ],
      },
    ],
  },
  {
    id: "parent",
    title: "5 — Parent Use Cases",
    tests: [
      {
        id: "PC-01",
        name: "View session and grade it",
        expected: "Passage visible after saving ✓  Saved scores pre-populate on revisit ✓  Saved feedback pre-fills on revisit ✓  Parent Total shown ✓",
        steps: [
          "Tap Parent tab. Dashboard loads immediately.",
          "Tap any session card.",
          "Tap the Passage section header — confirm it collapses and expands.",
          "Listen to a recording via the audio player.",
          "Scroll to Parent Grading. Drag sliders to set scores. Enter feedback.",
          "Tap Save Parent Grade. Confirm 'Saved!' message.",
          "Go back to dashboard and re-open the same session.",
          "Confirm sliders show saved values and feedback text is pre-filled.",
        ],
      },
      {
        id: "PC-02",
        name: "Send for Re-Practice",
        expected: "Gold ↩ RE-PRACTICE badge on exercise card ✓  Cancel removes badge ✓",
        steps: [
          "Open any parent session detail.",
          "Scroll to Re-Practice section. Tap Send for Re-Practice.",
          "Confirm button changes to 'Cancel Re-Practice' with gold badge.",
          "Navigate to Home screen (student view).",
          "Find the exercise card — confirm gold ↩ RE-PRACTICE badge.",
          "Return to parent session. Tap Cancel Re-Practice.",
          "Go back to Home — badge is gone from exercise card.",
        ],
      },
      {
        id: "PC-03",
        name: "Archive (Close) a session",
        expected: "Session leaves Active list ✓  Appears under Archived ✓  Exercise still on student Home ✓  Reopen returns to Active ✓",
        steps: [
          "Open parent session detail.",
          "Scroll to the close section. Tap Close & Archive. Confirm prompt.",
          "Go back to Parent Dashboard — session not in Active list.",
          "Tap 'Show Archived' — session appears with Archived badge.",
          "Go to Home — exercise card still visible for student.",
          "Reopen the archived session. Tap Reopen Exercise — returns to Active list.",
        ],
      },
      {
        id: "PC-04",
        name: "Overview statistics accuracy",
        expected: "Total, Average, Best, Streak all match manual calculation ✓",
        steps: [
          "Ensure at least 3 evaluated sessions exist.",
          "Open Parent Dashboard. Note all four stats.",
          "Manually verify: Total = count of evaluated sessions.",
          "Average = mean of (totalScore/maxScore×100) across sessions, rounded.",
          "Best = highest single-session percentage.",
          "Streak = consecutive days with at least one session.",
        ],
      },
      {
        id: "PC-05",
        name: "Parent settings save and persist",
        expected: "Name, goal, toggles all preserved after browser close ✓  No Reset PIN button visible ✓",
        steps: [
          "Parent → Settings. Set Child's Name = 'Test Child'. Goal = 2. Toggle completion alerts off.",
          "Tap Save Settings.",
          "Close browser. Reopen. Go to Settings.",
          "Confirm name, goal, and toggle match what was saved.",
          "Confirm there is no 'Reset Parent PIN' button anywhere on the page.",
        ],
      },
      {
        id: "PC-06",
        name: "Collapsible sections on session detail",
        expected: "All 4 sections toggle correctly ✓  Passage and Recordings start expanded ✓  AI Feedback and Model Answers start collapsed ✓",
        steps: [
          "Open any graded session in parent view.",
          "Confirm Passage section (▾) is expanded by default. Tap to collapse (▸).",
          "Confirm Recordings section is expanded. Tap to collapse.",
          "Confirm AI Detailed Feedback starts collapsed (▸). Tap to expand.",
          "Confirm Model Answers starts collapsed. Tap to expand.",
        ],
      },
    ],
  },
  {
    id: "data",
    title: "6 — Data Management",
    tests: [
      {
        id: "DM-01",
        name: "Generate new exercise",
        expected: "Two new exercise titles shown ✓  Cards appear on Home ✓  One Reading + one SBC ✓  Counter decrements ✓",
        steps: [
          "Tap New on Home screen. Optionally select topic and difficulty.",
          "Tap Generate (1 Reading + 1 SBC). Wait up to 30 seconds.",
          "Confirm success message with two exercise titles.",
          "Confirm both cards appear on Home screen.",
          "Confirm generation limit counter decrements.",
        ],
      },
      { id: "DM-02", name: "Daily generation limit", expected: "After 2 pairs generated: button shows 'Limit Reached' and is disabled ✓" },
      {
        id: "DM-03",
        name: "Reset all practice data (Danger Zone)",
        expected: "All sessions removed ✓  History empty ✓  Exercise content intact ✓  Streak = 0 ✓",
        steps: [
          "WARNING: destructive. Run only in UAT, never on live data.",
          "Parent → Settings → Danger Zone → Reset All Practice Data.",
          "Confirm both prompts.",
          "Verify: Parent Dashboard empty. History tab empty. Home screen exercises still present. Streak = 0.",
        ],
      },
      {
        id: "DM-04",
        name: "Session data integrity after grading",
        expected: "AI scores identical in student and parent views ✓  Audio plays in both ✓  Transcripts match ✓",
        steps: [
          "Open a graded session in parent detail. Note all scores and feedback.",
          "Open the same session from History tab (student view).",
          "Confirm AI scores, transcripts, audio all match between both views.",
        ],
      },
      {
        id: "DM-05",
        name: "Large audio recording saves correctly",
        expected: "Submit completes ✓  Audio plays back ✓  Parent grade save completes with 'Saved!' ✓",
        steps: [
          "Open an SBC exercise. Record each of Q1, Q2, Q3 for ~2 minutes each.",
          "Submit. Confirm results page loads with scores.",
          "Open in parent detail. Play audio. Confirm it plays.",
          "Set parent scores. Tap Save Parent Grade. Confirm 'Saved!' (not error).",
        ],
      },
      { id: "DM-06", name: "Settings without API key", expected: "If env var set: evaluation works ✓  If no env var: clear error shown on results page, not blank/stuck ✓" },
    ],
  },
  {
    id: "devices",
    title: "7 — Cross-Device Matrix (run TC-01 on each)",
    tests: [
      { id: "DV-01", name: "iPhone — Safari", expected: "TC-01 completes end-to-end. Transcript appears live." },
      { id: "DV-02", name: "iPhone — Chrome", expected: "TC-01 completes end-to-end. Record values from speech diag strip." },
      { id: "DV-03", name: "Android — Chrome", expected: "TC-01 completes. Audio submits correctly. Record speech diag strip values in Notes." },
      { id: "DV-04", name: "iPad — Safari", expected: "TC-01 completes. Layout not broken on larger screen." },
      { id: "DV-05", name: "Windows — Chrome", expected: "TC-01 completes end-to-end. Transcript appears live." },
      { id: "DV-06", name: "Windows — Edge", expected: "TC-01 completes. No layout regressions." },
      { id: "DV-07", name: "macOS — Chrome", expected: "TC-01 completes end-to-end." },
      { id: "DV-08", name: "macOS — Safari", expected: "TC-01 completes. Audio plays back correctly." },
    ],
  },
  {
    id: "ios",
    title: "8 — iOS Safari (iPhone/iPad)",
    tests: [
      {
        id: "IOS-01",
        name: "Add to Home Screen (PWA install)",
        expected: "App installs via Share → Add to Home Screen. Opens full-screen with no Safari address bar. Icon appears on home screen.",
        steps: [
          "Open app URL in Safari on iPhone.",
          "Tap Share button (box with arrow). Tap 'Add to Home Screen'.",
          "Confirm icon name and tap Add.",
          "Tap the new icon on the iOS home screen.",
          "App opens full-screen — no Safari chrome/address bar visible.",
        ],
      },
      {
        id: "IOS-02",
        name: "Microphone permission prompt",
        expected: "First tap of Record shows iOS system dialog asking for microphone access. Tapping Allow proceeds to recording.",
        steps: [
          "Open any exercise on Safari (first time or after clearing permissions).",
          "Tap Start Recording.",
          "Confirm iOS system dialog appears: '[App] Would Like to Access the Microphone'.",
          "Tap Allow. Confirm recording starts.",
        ],
      },
      {
        id: "IOS-03",
        name: "Mic permission persists on reload",
        expected: "After granting mic once, reload the page and tap Record — no second permission prompt appears.",
      },
      {
        id: "IOS-04",
        name: "Audio playback after recording",
        expected: "After stopping recording, audio player appears and plays back audio when tapped. Audio is audible through device speaker/earpiece.",
        steps: [
          "Record for 10 seconds. Tap Stop.",
          "Tap the play button on the audio player.",
          "Confirm audio plays. Confirm duration shown is approximately 10 seconds.",
        ],
      },
      {
        id: "IOS-05",
        name: "Live transcript on iOS Safari",
        expected: "While recording and speaking clearly, words appear in the transcript area in real time. Transcript is not empty when speech is detected.",
      },
      {
        id: "IOS-06",
        name: "Recording survives screen dim",
        expected: "While recording, let the screen auto-dim (do not lock). Tap to wake. Recording is still active — timer/state unchanged. Stop produces valid audio.",
        steps: [
          "Start recording. Set phone down and wait for screen to dim (do not press power).",
          "Tap screen to wake — recording should still be active.",
          "Tap Stop. Confirm audio player appears and plays back.",
        ],
      },
      {
        id: "IOS-07",
        name: "App backgrounded during recording",
        expected: "Press Home button mid-recording. Return to app. App shows an appropriate state — either recording was gracefully stopped with a message, or (if the OS allows) still recording.",
        steps: [
          "Start recording on an exercise.",
          "Press the Home button to background the app.",
          "Wait 5 seconds. Return to the app.",
          "Note the recording state. Try to stop and submit.",
          "Confirm no crash and audio (however long) is captured.",
        ],
      },
      {
        id: "IOS-08",
        name: "Virtual keyboard doesn't obscure record button",
        expected: "When a notes or text field is focused (keyboard appears), the Record button and key controls are still accessible — not hidden behind the keyboard.",
        steps: [
          "On the practice page, if there's any text input, tap it to open keyboard.",
          "Confirm the Record button is still visible or reachable by scrolling.",
          "Dismiss keyboard. Confirm layout returns to normal.",
        ],
      },
      {
        id: "IOS-09",
        name: "No font auto-zoom on input fields",
        expected: "Tapping any input field (notes, tester name) does NOT cause the page to zoom in. Text stays at normal size.",
      },
      {
        id: "IOS-10",
        name: "Touch targets are large enough",
        expected: "Record, Stop, Next Question, Submit, tab bar items — all easily tappable with a thumb. No accidental mis-taps on adjacent elements.",
      },
      {
        id: "IOS-11",
        name: "Bottom nav above home indicator",
        expected: "On iPhone with home indicator (no home button), the bottom nav tabs are not obscured by the iOS home indicator bar.",
      },
      {
        id: "IOS-12",
        name: "Portrait and landscape usable",
        expected: "App is usable in both portrait and landscape. No content clipped in either orientation. Record button reachable in landscape.",
        steps: [
          "Use app in portrait — confirm normal layout.",
          "Rotate to landscape — confirm content reflows. Key buttons still visible.",
          "Rotate back to portrait — layout returns correctly.",
        ],
      },
      {
        id: "IOS-13",
        name: "Full TC-01 end-to-end on iOS Safari",
        expected: "Reading session: record → stop → submit → results with AI scores — all steps complete without error on iOS Safari.",
        steps: [
          "Open a Reading Aloud exercise in Safari on iPhone.",
          "Tap Start Recording. Read aloud for 30 seconds. Tap Stop.",
          "Confirm audio player and transcript.",
          "Tap Submit for Grading.",
          "Confirm results page loads with score and AI feedback within 60s.",
          "Check History tab — session listed.",
        ],
      },
      {
        id: "IOS-14",
        name: "Full TC-02 SBC end-to-end on iOS Safari",
        expected: "SBC session: all 3 questions recorded independently, submitted, AI evaluates with 3 scores on iOS Safari.",
        steps: [
          "Open an SBC exercise in Safari on iPhone.",
          "Record Q1, tap Next, record Q2, tap Next, record Q3.",
          "Confirm 3 separate audio players.",
          "Submit. Confirm results show 3 individual scores.",
        ],
      },
    ],
  },
  {
    id: "android",
    title: "9 — Android Chrome",
    tests: [
      {
        id: "AND-01",
        name: "Add to Home Screen (PWA install)",
        expected: "Chrome shows 'Add to Home Screen' banner or it appears via Chrome menu. App opens full-screen after install with no browser chrome.",
        steps: [
          "Open app URL in Chrome on Android.",
          "Tap the three-dot menu → 'Add to Home screen' (or tap the install banner if it appears).",
          "Confirm icon added to Android home screen.",
          "Tap the icon — app opens without Chrome address bar.",
        ],
      },
      {
        id: "AND-02",
        name: "Microphone permission prompt",
        expected: "First tap of Record shows Android system dialog asking for microphone access. Tapping Allow proceeds to recording.",
        steps: [
          "Open any exercise in Chrome on Android (first time or cleared permissions).",
          "Tap Start Recording.",
          "Confirm Android system dialog: 'Allow [app] to record audio?'.",
          "Tap Allow. Confirm recording starts.",
        ],
      },
      {
        id: "AND-03",
        name: "Mic permission persists on reload",
        expected: "After granting mic once, reload and tap Record — no second Android permission dialog appears.",
      },
      {
        id: "AND-04",
        name: "Audio captured (MediaRecorder webm/opus)",
        expected: "Record 10 seconds. Stop. Audio player appears. Tapping play produces audible audio.",
        steps: [
          "Record 10 seconds. Tap Stop.",
          "Tap play on the audio player.",
          "Confirm audio plays and sounds like what was recorded.",
        ],
      },
      {
        id: "AND-05",
        name: "Speech recognition diagnostic strip",
        expected: "During/after recording, the monospace diagnostic strip is visible. Record the exact values (event / error / restarts / results) in the Notes field. This is the primary diagnostic for Android transcript issues.",
        steps: [
          "Open a Reading exercise. Tap Start Recording. Speak for 10 seconds. Tap Stop.",
          "Look at the small monospace strip below the recording area.",
          "Copy the values: event=? error=? restarts=? results=?",
          "Paste those values into the Notes field for this test case.",
          "Do NOT mark FAIL based on missing transcript alone — log the values first.",
        ],
      },
      {
        id: "AND-06",
        name: "No ghost-restart when switching SBC questions",
        expected: "After stopping recording on Q1 and tapping Next Question, no second recording session starts automatically. The speech diag 'restarts' count should not increment after question switch.",
        steps: [
          "Open an SBC exercise. Record Q1. Tap Stop.",
          "Note the speech diag strip values.",
          "Tap Next Question.",
          "Confirm recording does NOT auto-start. Record button is in idle state.",
          "Confirm speech diag 'restarts' count did not increase after question switch.",
        ],
      },
      {
        id: "AND-07",
        name: "Android back button behaviour",
        expected: "Pressing the Android back button on the practice page goes back to Home (not exit the app or navigate incorrectly).",
        steps: [
          "Open any exercise. Do not record.",
          "Tap the Android hardware/gesture back button.",
          "Confirm app navigates to home screen (not exits or crashes).",
        ],
      },
      {
        id: "AND-08",
        name: "App backgrounded mid-recording",
        expected: "Press Home mid-recording. Return to app. App shows an appropriate state. No crash. Submit completes.",
        steps: [
          "Start recording an exercise.",
          "Press the Android Home button. Wait 5 seconds. Return to app.",
          "Note the recording state — try to stop and submit.",
          "Confirm no crash and some audio is captured.",
        ],
      },
      {
        id: "AND-09",
        name: "Virtual keyboard doesn't obscure record button",
        expected: "When a text field is focused and the Android keyboard is open, the Record button is still reachable by scrolling. Layout does not break.",
      },
      {
        id: "AND-10",
        name: "Bottom nav above Android navigation bar",
        expected: "On Android with gesture navigation or 3-button nav bar, the bottom tab bar is not hidden behind system navigation.",
      },
      {
        id: "AND-11",
        name: "Touch targets large enough",
        expected: "Record, Stop, Next Question, Submit, bottom nav tabs — all tappable without mis-tapping adjacent items on a typical Android phone screen.",
      },
      {
        id: "AND-12",
        name: "SBC multi-question independent audio",
        expected: "Record Q1, switch to Q2, record Q2, switch to Q3, record Q3. Each question retains its own audio player. Q1 audio is not replaced by Q2 or Q3.",
        steps: [
          "Open SBC exercise. Record Q1 (10 seconds). Stop. Note audio player present.",
          "Tap Next Question. Record Q2. Stop.",
          "Tap Next Question. Record Q3. Stop.",
          "Go back through questions — confirm Q1 audio player still present and plays Q1 recording.",
        ],
      },
      {
        id: "AND-13",
        name: "Full TC-01 end-to-end on Android Chrome",
        expected: "Reading session: record → stop → submit → results with AI scores — all steps complete without error on Android Chrome.",
        steps: [
          "Open a Reading Aloud exercise in Chrome on Android.",
          "Tap Start Recording. Read aloud for 30 seconds. Tap Stop.",
          "Note speech diag values. Confirm audio player present.",
          "Tap Submit for Grading.",
          "Confirm results page loads with score and AI feedback within 60s.",
          "Check History tab — session listed.",
        ],
      },
      {
        id: "AND-14",
        name: "Full TC-02 SBC end-to-end on Android Chrome",
        expected: "SBC session: all 3 questions recorded, submitted, AI evaluates with 3 scores on Android Chrome.",
        steps: [
          "Open SBC exercise in Chrome on Android.",
          "Record Q1, Next, record Q2, Next, record Q3.",
          "Submit. Confirm results show 3 individual scores.",
        ],
      },
    ],
  },
  {
    id: "mobile-shared",
    title: "10 — Mobile Shared (iOS + Android)",
    tests: [
      {
        id: "MOB-01",
        name: "Submit over mobile data (not Wi-Fi)",
        expected: "Turn off Wi-Fi, use mobile data only. Record and submit a session. Results page loads and AI evaluation completes within 90s.",
        steps: [
          "Turn off Wi-Fi on the phone. Confirm mobile data is active.",
          "Open app. Record a Reading session. Submit.",
          "Confirm results page loads and scores appear.",
        ],
      },
      {
        id: "MOB-02",
        name: "Network drop during recording (graceful handling)",
        expected: "If network is lost during recording (audio capture is local), recording still completes. Submitting while offline shows a clear error — not a blank page or infinite spinner.",
        steps: [
          "Start recording. Enable Airplane Mode mid-recording.",
          "Stop recording. Attempt to Submit.",
          "Confirm a visible error message appears (not blank/frozen).",
          "Re-enable network. Retry submit — confirm it completes.",
        ],
      },
      {
        id: "MOB-03",
        name: "Page reload on practice screen",
        expected: "Reloading the practice page mid-session (before submit) returns to the practice screen with the exercise loaded. No crash or blank page.",
        steps: [
          "Open any exercise. Do not record yet.",
          "Reload the browser tab (pull-to-refresh or browser reload).",
          "Confirm exercise reloads correctly. Record and submit normally.",
        ],
      },
      {
        id: "MOB-04",
        name: "Screen lock during recording",
        expected: "Lock the screen mid-recording. Unlock. App is in a defined state — either recording was stopped (with message) or is still active. No crash.",
        steps: [
          "Start recording. Press the power/lock button to lock the screen.",
          "Unlock immediately.",
          "Note the recording state. Complete and submit the session.",
        ],
      },
      {
        id: "MOB-05",
        name: "Audio file size reasonable",
        expected: "A 2-minute recording results in an audio file ≤ 10 MB. Submit completes without payload error.",
        steps: [
          "Open an exercise. Record for approximately 2 minutes. Stop.",
          "Submit the session. Confirm submit completes (no 413 or payload error).",
          "Open parent session detail. Parent grade save also completes with 'Saved!'.",
        ],
      },
      {
        id: "MOB-06",
        name: "Parent dashboard usable on mobile",
        expected: "Parent dashboard, session detail, grading sliders, and collapsible sections all work correctly on a phone screen in portrait mode.",
        steps: [
          "On the phone, tap the Parent tab.",
          "Open any session. Confirm passage, recordings, AI feedback sections all visible and expandable.",
          "Drag a grading slider. Confirm it responds to touch.",
          "Tap Save Parent Grade. Confirm 'Saved!'.",
        ],
      },
      {
        id: "MOB-07",
        name: "UAT tracker usable on mobile",
        expected: "This /test-plan page is readable and usable on a phone. Status chips tappable. Notes field editable. No horizontal scroll overflow.",
      },
      {
        id: "MOB-08",
        name: "Consistent dark theme on mobile browsers",
        expected: "Dark theme renders correctly on both iOS Safari and Android Chrome. No white flash on load. No forced light-mode override from the browser.",
      },
    ],
  },
];

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  untested: { label: "Untested", bg: "rgba(110,106,142,0.15)", color: "var(--text-muted)" },
  pass: { label: "PASS", bg: "rgba(45,212,191,0.18)", color: "var(--teal)" },
  fail: { label: "FAIL", bg: "rgba(248,113,113,0.18)", color: "var(--coral)" },
  blocked: { label: "BLOCKED", bg: "rgba(251,191,36,0.18)", color: "var(--gold)" },
};

function statusBg(s: Status) { return STATUS_CONFIG[s].bg; }
function statusColor(s: Status) { return STATUS_CONFIG[s].color; }

const ALL_TESTS = SECTIONS.flatMap((s) => s.tests);
const TOTAL = ALL_TESTS.length;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TestPlanPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testerName, setTesterName] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const stored = localStorage.getItem("testPlanTesterName");
    if (stored) setTesterName(stored);
    fetch("/api/test-results")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) setResults(data);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(
    (id: string, patch: Partial<TestResult>) => {
      const current = results[id] ?? { status: "untested", notes: "", tester: "", updatedAt: 0 };
      const updated = { ...current, ...patch, tester: testerName, updatedAt: Date.now() };
      setResults((prev) => ({ ...prev, [id]: updated }));
      setSaving((prev) => ({ ...prev, [id]: true }));
      fetch("/api/test-results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updated }),
      }).finally(() => {
        setSaving((prev) => ({ ...prev, [id]: false }));
      });
    },
    [results, testerName]
  );

  const setStatus = (id: string, status: Status) => {
    persist(id, { status });
  };

  const notesChange = (id: string, value: string) => {
    setEditingNotes((prev) => ({ ...prev, [id]: value }));
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      persist(id, { notes: value });
    }, 800);
  };

  const counts = ALL_TESTS.reduce(
    (acc, t) => {
      const s = (results[t.id]?.status ?? "untested") as Status;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<Status, number>
  );
  const passed = counts.pass ?? 0;
  const failed = counts.fail ?? 0;
  const blocked = counts.blocked ?? 0;
  const untested = TOTAL - passed - failed - blocked;
  const pct = Math.round((passed / TOTAL) * 100);

  const toggleSection = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 18 }}>UAT Test Tracker</h1>
            <div className="subtitle">GWDP PSLE Oral Practice</div>
          </div>
          <a
            href="/parent"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Parent
          </a>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>

          {/* Progress summary */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {passed}/{TOTAL} Passed
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: pct >= 90 ? "var(--teal)" : pct >= 60 ? "var(--gold)" : "var(--coral)" }}>
                {pct}%
              </div>
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "var(--teal)" : pct >= 60 ? "var(--gold)" : "var(--coral)", borderRadius: 4, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([["pass", passed, "var(--teal)"], ["fail", failed, "var(--coral)"], ["blocked", blocked, "var(--gold)"], ["untested", untested, "var(--text-muted)"]] as const).map(([label, n, color]) => (
                <div key={label} style={{ fontSize: 12, fontWeight: 600, color }}>
                  {String(n)} {label === "pass" ? "passed" : label === "fail" ? "failed" : label === "blocked" ? "blocked" : "untested"}
                </div>
              ))}
            </div>
          </div>

          {/* Tester name */}
          <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Your name (saved with each result)
            </label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => {
                setTesterName(e.target.value);
                localStorage.setItem("testPlanTesterName", e.target.value);
              }}
              placeholder="e.g. Sarah"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sections */}
          {SECTIONS.map((section) => {
            const sTests = section.tests;
            const sPassed = sTests.filter((t) => results[t.id]?.status === "pass").length;
            const sFailed = sTests.filter((t) => results[t.id]?.status === "fail").length;
            const sBlocked = sTests.filter((t) => results[t.id]?.status === "blocked").length;
            const isOpen = !collapsed[section.id];

            return (
              <div key={section.id} style={{ marginBottom: 8 }}>
                {/* Section header */}
                <div
                  onClick={() => toggleSection(section.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--bg-card)",
                    borderRadius: isOpen ? "12px 12px 0 0" : 12,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      {section.title}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      ({sTests.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {sPassed > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)" }}>{sPassed}✓</span>}
                    {sFailed > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--coral)" }}>{sFailed}✗</span>}
                    {sBlocked > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>{sBlocked}!</span>}
                    <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{isOpen ? "▾" : "▸"}</span>
                  </div>
                </div>

                {/* Tests */}
                {isOpen && (
                  <div style={{
                    border: "1px solid var(--border)",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    overflow: "hidden",
                  }}>
                    {sTests.map((test, idx) => {
                      const r = results[test.id];
                      const status: Status = r?.status ?? "untested";
                      const isExpanded = expandedTest === test.id;
                      const notesVal = editingNotes[test.id] ?? r?.notes ?? "";

                      return (
                        <div
                          key={test.id}
                          style={{
                            borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                            background: status === "fail"
                              ? "rgba(248,113,113,0.04)"
                              : status === "pass"
                              ? "rgba(45,212,191,0.04)"
                              : "var(--bg-card)",
                          }}
                        >
                          {/* Test row */}
                          <div style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              {/* ID badge */}
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 6,
                                background: statusBg(status),
                                color: statusColor(status),
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                marginTop: 2,
                              }}>
                                {test.id}
                              </span>

                              {/* Name + expand */}
                              <div
                                style={{ flex: 1, cursor: "pointer" }}
                                onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                              >
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                                  {test.name}
                                </div>
                                {!isExpanded && (
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.3 }}>
                                    {test.expected.length > 80 ? test.expected.slice(0, 80) + "…" : test.expected}
                                  </div>
                                )}
                              </div>

                              {/* Saving indicator */}
                              {saving[test.id] && (
                                <div style={{ width: 12, height: 12, flexShrink: 0, marginTop: 4 }}>
                                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                                </div>
                              )}
                            </div>

                            {/* Status chips */}
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                              {(["pass", "fail", "blocked", "untested"] as Status[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setStatus(test.id, s)}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    border: `1.5px solid ${status === s ? statusColor(s) : "transparent"}`,
                                    background: status === s ? statusBg(s) : "rgba(110,106,142,0.1)",
                                    color: status === s ? statusColor(s) : "var(--text-muted)",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {STATUS_CONFIG[s].label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--border)" }}>
                              {/* Pass criteria */}
                              <div style={{ marginTop: 10, marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                                  Pass Criteria
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                  {test.expected}
                                </div>
                              </div>

                              {/* Steps */}
                              {test.steps && test.steps.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                                    Steps
                                  </div>
                                  <ol style={{ paddingLeft: 18, margin: 0 }}>
                                    {test.steps.map((step, i) => (
                                      <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.5 }}>
                                        {step}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Notes */}
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                                  Notes / Observations
                                </div>
                                <textarea
                                  value={notesVal}
                                  onChange={(e) => notesChange(test.id, e.target.value)}
                                  placeholder="Device used, what you saw, any failure details..."
                                  rows={3}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1.5px solid var(--border)",
                                    background: "var(--bg-elevated)",
                                    color: "var(--text-primary)",
                                    fontSize: 12,
                                    fontFamily: "inherit",
                                    resize: "vertical",
                                    boxSizing: "border-box",
                                  }}
                                />
                              </div>

                              {/* Tester + date */}
                              {r?.tester && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                  Last updated by <b>{r.tester}</b>
                                  {r.updatedAt ? ` · ${new Date(r.updatedAt).toLocaleString("en-SG", { dateStyle: "short", timeStyle: "short" })}` : ""}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sign-off */}
          <div className="card" style={{ marginTop: 24, border: "2px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)" }}>
            <div className="card-title" style={{ color: "var(--purple-soft)", marginBottom: 12 }}>Sign-Off</div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatChip label="Total" value={TOTAL} color="var(--text-primary)" />
              <StatChip label="Passed" value={passed} color="var(--teal)" />
              <StatChip label="Failed" value={failed} color="var(--coral)" />
              <StatChip label="Blocked" value={blocked} color="var(--gold)" />
              <StatChip label="Untested" value={untested} color="var(--text-muted)" />
            </div>

            {failed === 0 && untested === 0 ? (
              <div style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal)" }}>Ready for Sign-Off</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  All tests passed or accepted as BLOCKED.
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--coral)", marginBottom: 6 }}>
                  Not ready for sign-off
                </div>
                {failed > 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                    • {failed} test{failed !== 1 ? "s" : ""} FAILED — must be fixed or accepted with justification
                  </div>
                )}
                {untested > 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    • {untested} test{untested !== 1 ? "s" : ""} still untested
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
              <strong>Known accepted exceptions:</strong><br />
              KI-01 — Android live transcript: under diagnosis (speech diag strip captures data)<br />
              KI-02 — SBC image generation ~10s on first open: by design<br />
              KI-03 — Generation limit resets daily: by design<br />
              KI-04 — Very long SBC responses may slow submission: accepted for v1
            </div>
          </div>

        </div>
      </main>
    </>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 52 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
