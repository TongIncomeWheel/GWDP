# GWDP PSLE Oral Practice — UAT Test Plan

**Version:** 1.0  
**Date:** June 2026  
**App:** GWDP PSLE Oral Practice (Cloud Run, progressive web app)  
**Platforms under test:** Android Chrome (primary), iOS Safari (secondary), desktop Chrome

---

## How to Use This Document

Each test case has:
- A numbered ID for tracking
- Step-by-step instructions
- An explicit **Expected Result** — what "pass" looks like
- A **Result** column to fill in: PASS / FAIL / BLOCKED (with notes)

Sign-off requires every case marked PASS or an accepted BLOCKED explanation.

---

## Section 1 — Environment Setup

Before testing, confirm:

| Check | How | Expected |
|---|---|---|
| App loads | Open the app URL in browser | Home screen with exercise list appears |
| No exercises yet | First-time device / cleared data | App shows empty state or seed exercises |
| At least 2 exercises exist | Home screen | Reading Aloud and SBC exercises visible |
| Gemini API key configured | Parent → Settings → AI Configuration | Key is set; "Using server environment variable" or key entered |
| Test on mobile | Use a real Android and iOS device | Not the browser's "mobile mode" emulation |

If exercises are missing, tap Generate New Practice on the home screen.

---

## Section 2 — UX & Visual Quality

### 2.1 Home Screen Layout

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| U-01 | Dark theme renders | Open app | Background is deep purple/navy, text is off-white. No white flashes. | |
| U-02 | Exercise cards readable | Scroll list | Title, topic, type badge (Reading/SBC), difficulty badge all visible. No clipped text. | |
| U-03 | Bottom nav is accessible | Any screen | Three tabs visible at bottom: Home, History, Parent. Active tab highlighted. | |
| U-04 | Filter pills work | Tap Reading, then SBC, then All | Card list updates instantly. Active pill has distinct styling. | |
| U-05 | Difficulty filter stacks | Set type = SBC, then difficulty = Advanced | Only Advanced SBC cards shown. Count updates. | |
| U-06 | Re-Practice badge appears | After parent sends for re-practice (see P-07) | Gold "↩ RE-PRACTICE" badge on affected exercise card | |
| U-07 | Streak dashboard shows | After completing at least 1 session | Ring chart, streak number, today's count, Avg Score all visible | |
| U-08 | ReRe mascot displays | Home screen | Mascot image visible with appropriate message based on streak | |
| U-09 | Generate panel opens | Tap "New" button | Topic picker and difficulty selector appear inline. Cancel closes it. | |
| U-10 | Scrolling smooth | Fast scroll on exercise list | No jank. Cards do not jump or flash. | |

### 2.2 Practice Screen Layout

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| U-11 | Reading passage readable | Open a Reading exercise | Passage text in scrollable card. Font size ≥ 13px, line height comfortable. | |
| U-12 | SBC question navigation | Open an SBC exercise | Q1 shown. "Next Question" advances to Q2, Q3. Progress indicator visible. | |
| U-13 | SBC stimulus image | Open SBC with generated image | Image fills width, not distorted. Falls back to text description if no image. | |
| U-14 | Record button clear | Before any recording | Prominent red/coral record button. Label "Start Recording". | |
| U-15 | Recording active state | Tap record | Button changes to "Stop Recording". Timer or live transcript visible. Pulsing indicator. | |
| U-16 | Live transcript appears | Speak while recording (desktop Chrome or iOS) | Text appears in real time below record button. | |
| U-17 | Speech diagnostics visible | During/after recording | Small monospace strip shows: event, error, restarts, results. Used for Android debugging. | |
| U-18 | Done state after stop | Tap stop | State changes to "done". Audio player appears. Submit enabled (if all recorded). | |
| U-19 | Submit button disabled until done | Fresh load | "Submit for Grading" disabled. Enabled only after all questions recorded. | |
| U-20 | Preamble / tips readable | Reading exercise preamble card | Tips text is readable, not truncated. Scrollable if long. | |

### 2.3 Results & History Layout

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| U-21 | Results page loads after submit | Submit a session | Redirected to /results/[id]. Score circle visible. | |
| U-22 | Score colour coding | Results page | Green ≥70%, yellow 50–69%, red <50% | |
| U-23 | AI feedback readable | Results page | General feedback, Strengths, Areas for Improvement all visible with clear headings. | |
| U-24 | Audio playback works | Results page, tap play | Audio plays. Controls visible. No broken audio element. | |
| U-25 | History page lists sessions | Tap History tab | Sessions listed newest first. Date, title, score, type visible per row. | |
| U-26 | History score colours | History list | Consistent colour coding (green/yellow/red) matching results page. | |
| U-27 | Rubric page readable | Tap History → Rubric link (or nav) | Band descriptors for Reading and SBC shown. Toggle between two tabs. | |

### 2.4 Parent Dashboard Layout

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| U-28 | Parent loads without PIN | Tap Parent tab | Dashboard loads directly. No PIN prompt. | |
| U-29 | Overview stats visible | Parent dashboard with sessions | Total Sessions, Average Score, Best Score, Current Streak all show numbers. | |
| U-30 | Session list readable | Parent dashboard | Each card: title, date, type, score fraction, AI score. | |
| U-31 | Archived toggle works | Tap "Show Archived" | List switches to closed sessions. Badge "Archived" visible on cards. | |
| U-32 | Parent session detail loads | Tap any session card | /parent/session/[id] loads. Title in header. Score circle visible. | |
| U-33 | Passage visible on detail | Parent session detail | Reading Passage or Stimulus Questions section expanded and readable. | |
| U-34 | Sections collapse and expand | Tap section headers | Passage, Recordings, AI Feedback, Model Answers each toggle open/closed independently. | |
| U-35 | Grading sliders work | Drag sliders | Value label updates in real time. Total recalculates. Range 0–10. | |
| U-36 | Parent settings load | Parent → Settings | Child Profile, AI Config, Notifications, Danger Zone all visible. No PIN section. | |

---

## Section 3 — Functional Testing

### 3.1 Exercise Loading

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| F-01 | Exercises load on home | Open app, wait | Exercise cards render within 3s on a normal connection. | |
| F-02 | Exercise ID in URL | Tap any exercise | URL becomes /practice/[id] matching the exercise. | |
| F-03 | Correct exercise content | Open exercise ID 1 | Passage/questions shown match that specific exercise. Not generic. | |
| F-04 | Exercise type routing | Open Reading vs SBC | Reading shows passage only. SBC shows 3 questions with navigation. | |
| F-05 | Image generates for SBC | First open of a new SBC | Spinner while image generates. Image appears within ~10s. Persists on revisit. | |

### 3.2 Recording — Audio Capture (MediaRecorder)

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| F-06 | Mic permission prompt | First tap of Record | Browser shows microphone permission dialog. | |
| F-07 | Permission denied handling | Deny mic → tap Record | Error message shown: "Microphone permission denied". Record button not stuck. | |
| F-08 | Audio captured | Record 5 seconds, stop | Audio player appears with playable recording. | |
| F-09 | Audio plays back | Tap play on recording | Audio plays. Duration shown. Volume audible. | |
| F-10 | Audio format | Record on Android, iOS, desktop | Playback works cross-device (webm/mp4 fallback handled). | |
| F-11 | Re-record clears previous | Record, stop, tap Re-record | Previous audio player disappears. Fresh recording starts. | |
| F-12 | SBC multi-question recording | Record Q1, stop, next Q, record Q2, stop | Each question has its own audio player. Q1 audio not overwritten by Q2. | |

### 3.3 Recording — Speech Recognition (Transcript)

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| F-13 | Live transcript on iOS Safari | Record on iPhone, speak clearly | Words appear in real time as spoken. | |
| F-14 | Live transcript on desktop Chrome | Record on desktop, speak clearly | Words appear in real time. | |
| F-15 | Android transcript (diagnose) | Record on Android, check speech diag strip | **Report the values**: event, error, restarts, results. Do NOT mark FAIL yet — record values for engineering. | |
| F-16 | Empty transcript still submittable | Record without speaking (silence) | Submit button becomes enabled. Transcript shows empty or "(no transcript)". | |
| F-17 | Transcript persists to server | Submit session, open parent detail | Transcript text visible in Transcripts section. | |
| F-18 | Transcript warning shown | Network error during speech | Gold warning banner: "Transcript capture failed (network). Audio is still recording." | |

### 3.4 Submission & AI Evaluation

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| F-19 | Submit sends to server | Tap Submit, check parent dashboard | New session appears in parent list within 30 seconds. | |
| F-20 | Evaluating state | Immediately after submit | Results page shows "Evaluating…" spinner or pending state. | |
| F-21 | AI evaluation completes | Wait after submit (up to 60s) | Scores, feedback, strengths, areas for improvement appear. | |
| F-22 | Scores are in valid range | Check results page | Score1, Score2, Score3 each 0–10. Total = sum of applicable scores. | |
| F-23 | Model answers present | Check results page | Model answer for each question shown below AI feedback. | |
| F-24 | Re-evaluate not triggered | Reload results page | Scores don't change. No second API call fired. | |
| F-25 | Evaluating flag clears | Reload after evaluation completes | Spinner gone. Scores visible. isEvaluating = false in data. | |

### 3.5 Navigation & Routing

| ID | Test | Steps | Expected Result | Result |
|---|---|---|---|---|
| F-26 | Back navigation works | Practice → Submit → Results → tap Back | Goes to home, not practice page. | |
| F-27 | Bottom nav Home tab | On any page, tap Home | Returns to home screen. Exercise list visible. | |
| F-28 | Bottom nav History tab | Tap History | Session list with scores and dates. | |
| F-29 | Bottom nav Parent tab | Tap Parent | Parent dashboard loads directly. | |
| F-30 | Direct URL access | Navigate to /parent/session/[id] directly | Page loads without redirect. | |
| F-31 | 404 session | Navigate to /parent/session/99999 | "Session not found" empty state. Back button visible. | |

---

## Section 4 — Practice Flow: End-to-End Test Cases

These are complete flows, not isolated checks. Run each from scratch.

### TC-01: First Reading Aloud Session (New User)

**Precondition:** No previous sessions. At least one Reading exercise exists.

1. Open app. Home screen loads with exercises.
2. Tap a Reading Aloud exercise card.
3. Read the preamble and tips. Tap "I'm Ready" or proceed.
4. Read the passage silently. Tap **Start Recording**.
5. Read the passage aloud for 30–60 seconds.
6. Tap **Stop Recording**.
7. Confirm audio plays back correctly. Transcript shows (desktop/iOS).
8. Tap **Submit for Grading**.
9. Wait on results page. Scores appear within 60 seconds.
10. Verify: score circle shows numeric score, feedback paragraphs present, model answer present.

**Pass criteria:**
- Audio records and plays back ✓
- Submit transitions to results ✓
- AI scores appear within 60s ✓
- Strengths and Areas for Improvement both present ✓
- Session appears in History tab ✓

---

### TC-02: First SBC Session (New User)

**Precondition:** At least one SBC exercise exists.

1. Open app. Tap an SBC (Stimulus-Based Conversation) exercise card.
2. View the stimulus image (or description if no image).
3. Read Question 1. Tap **Start Recording**. Speak your answer (20–30 seconds). Tap **Stop**.
4. Tap **Next Question**. Record Q2.
5. Tap **Next Question**. Record Q3.
6. Verify three separate audio players are shown.
7. Tap **Submit for Grading**.
8. Wait for AI evaluation on results page.

**Pass criteria:**
- Each question has independent audio ✓
- Navigating questions does not erase previous recordings ✓
- All 3 transcripts visible on results page ✓
- 3 separate AI scores shown ✓
- Total = Score1 + Score2 + Score3 ✓

---

### TC-03: Re-Record Before Submit

**Precondition:** On practice page, Recording #1 complete.

1. After stopping a recording, tap **Re-record**.
2. Confirm previous audio player disappears and recording state resets.
3. Record a new response.
4. Confirm new audio player appears.
5. Submit.

**Pass criteria:**
- Re-record clears previous audio ✓
- New recording successfully captured ✓
- Submitted session uses the re-recorded audio ✓

---

### TC-04: Session Persists Across Browser Reload

**Precondition:** A session has been submitted and evaluated.

1. Open History tab. Note the top session's score.
2. Close the browser completely.
3. Reopen the app.
4. Open History tab.

**Pass criteria:**
- Session is still listed ✓
- Score matches what was shown before closing ✓
- Tapping the session opens detail correctly ✓

---

### TC-05: Multiple Sessions Same Exercise

**Precondition:** At least one evaluated session for an exercise exists.

1. Go to Home. Tap the same exercise again.
2. Record and submit a second time.
3. Open History.

**Pass criteria:**
- Two separate sessions appear in History for the same exercise title ✓
- Scores may differ — that is expected ✓
- Parent dashboard shows both sessions ✓

---

### TC-06: Low-Score Session (Functional Validation)

**Precondition:** Can submit silence or very short recording.

1. Open any exercise.
2. Tap Record. Wait 2 seconds. Tap Stop.
3. Submit.

**Pass criteria:**
- Submit succeeds (no crash) ✓
- AI evaluates with low scores (0–3 range expected) ✓
- Feedback still present (may comment on insufficient content) ✓
- No infinite "Evaluating…" spinner ✓

---

## Section 5 — Parent Use Cases

### PC-01: View Session and Grade It

**Precondition:** At least one evaluated session exists.

1. Tap **Parent** tab. Dashboard loads immediately.
2. Tap any session card.
3. Tap the **Passage** section header — it should expand/collapse.
4. Listen to at least one recording via the audio player.
5. Scroll to **Parent Grading**. Drag sliders to set scores.
6. Enter feedback text in the notes field.
7. Tap **Save Parent Grade**.
8. Verify "Saved!" message appears.
9. Navigate back to dashboard and re-open the same session.

**Pass criteria:**
- Passage / questions still visible after saving ✓
- Saved scores pre-populate sliders on revisit ✓
- Saved feedback pre-fills notes field on revisit ✓
- Parent Total shown in score overview ✓

---

### PC-02: Send for Re-Practice

**Precondition:** A session exists for an exercise the parent wants the student to redo.

1. Open parent session detail for that session.
2. Scroll to **Re-Practice** section.
3. Tap **Send for Re-Practice**.
4. Verify button changes to "Cancel Re-Practice" with gold badge "Re-Practice Requested".
5. Navigate to Home screen (Student view).
6. Find the exercise card for that exercise.

**Pass criteria:**
- Gold **↩ RE-PRACTICE** badge appears on the exercise card ✓
- Parent can cancel: tap "Cancel Re-Practice" → badge disappears from home screen ✓

---

### PC-03: Archive (Close) a Session

**Precondition:** An active (non-archived) session exists.

1. Open parent session detail.
2. Scroll to the close section. Tap **Close & Archive**.
3. Confirm the dialog prompt.
4. Navigate back to Parent Dashboard.

**Pass criteria:**
- Session no longer visible in "Active Sessions" list ✓
- Tap "Show Archived" → session appears with "Archived" badge ✓
- Exercise card still visible on student Home screen ✓ (closing a session does not remove the exercise)
- Tap "Reopen Exercise" on the archived session → returns to Active list ✓

---

### PC-04: Overview Statistics Accuracy

**Precondition:** At least 3 evaluated sessions exist with known scores.

1. Open Parent Dashboard.
2. Note: Total Sessions, Average Score, Best Score, Current Streak.
3. Manually verify:
   - Total Sessions = count of evaluated sessions
   - Average Score = mean of (totalScore / maxScore × 100) across sessions, rounded
   - Best Score = highest single session percentage
   - Streak = consecutive calendar days with at least one session (resets if a day is skipped)

**Pass criteria:**
- All four values match manual calculation ✓

---

### PC-05: Parent Settings Save and Persist

1. Tap Parent → Settings (⚙ button).
2. Change Child's Name to "Test Child".
3. Change Daily Practice Goal to 2.
4. Toggle "Completion alerts" off.
5. Tap **Save Settings**.
6. Close browser. Reopen. Go to Settings.

**Pass criteria:**
- Name "Test Child" preserved ✓
- Daily goal shows 2 ✓
- Toggle state matches what was saved ✓
- No Reset Parent PIN button visible ✓

---

### PC-06: AI Detailed Feedback Collapsible

1. Open any graded session in Parent view.
2. Locate "AI Detailed Feedback" section header.
3. Confirm it starts collapsed (▸).
4. Tap header — expands to show General Feedback, Strengths, Areas for Improvement.
5. Tap again — collapses.
6. Do the same for "Model Answers".

**Pass criteria:**
- All collapsible sections toggle correctly ✓
- Content is complete when expanded ✓
- Passage and Recordings sections start expanded ✓

---

## Section 6 — Data Management

### DM-01: Generate New Exercise

1. On Home screen, tap **New** in the Generate panel.
2. Optionally select a topic and difficulty.
3. Tap **Generate (1 Reading + 1 SBC)**.
4. Wait for generation (up to 30 seconds).

**Pass criteria:**
- Success message shows two new exercise titles ✓
- Both cards appear on Home screen ✓
- One is "Reading Aloud", one is "Stimulus-Based" ✓
- Limit counter decrements (e.g. "1/2 left today") ✓

---

### DM-02: Daily Generation Limit

**Precondition:** 2 pairs have already been generated today.

1. Tap **New** on Home.
2. Observe the button state.

**Pass criteria:**
- Button shows "Limit Reached" and is disabled ✓
- Attempting to generate shows appropriate message ✓

---

### DM-03: Reset All Practice Data (Danger Zone)

**Precondition:** There are existing practice sessions. This is a destructive test — run only in UAT, never on live data.

1. Parent → Settings → scroll to Danger Zone.
2. Tap **Reset All Practice Data**.
3. Confirm both prompts.

**Pass criteria:**
- All sessions removed from Parent Dashboard ✓
- History tab shows empty state ✓
- Exercise content still intact on Home screen ✓
- Streak resets to 0 ✓
- After performing TC-01 again, new session ID starts from 1 (or fresh) ✓

---

### DM-04: Session Data Integrity After Grading

**Precondition:** A session has been evaluated by AI and graded by parent.

1. Open parent session detail. Note all scores and feedback.
2. Open the same session from History tab (student view).
3. Compare.

**Pass criteria:**
- AI scores identical between both views ✓
- Parent score visible in both views ✓
- Audio recordings play in both views ✓
- Transcripts match in both views ✓

---

### DM-05: Large Audio Recording Saves Correctly

**Precondition:** Ready to record a long response.

1. Open an SBC exercise.
2. Record Q1 for approximately 2 minutes (speak continuously).
3. Record Q2 for approximately 2 minutes.
4. Record Q3 for approximately 2 minutes.
5. Submit.

**Pass criteria:**
- Submit completes without error ✓
- Audio plays back correctly in results ✓
- Parent grading save ("Save Parent Grade") completes with "Saved!" ✓ (critical: previously this could fail on large recordings)
- Session visible in parent dashboard ✓

---

### DM-06: Settings API Key Validation

1. Parent → Settings → AI Configuration.
2. Delete the existing key and leave empty. Save.
3. Go to Home, open any exercise, record and submit.

**Pass criteria:**
- If env var GEMINI_API_KEY is set: evaluation still works ✓
- If no env var: results page shows a clear error message, not blank/stuck ✓
- Settings page shows correct warning about missing key ✓

---

## Section 7 — Cross-Device & Browser Matrix

Run TC-01 (Reading session end-to-end) on each device below and record result:

| Device | Browser | TC-01 Result | Transcript? | Notes |
|---|---|---|---|---|
| iPhone (iOS 17+) | Safari | | Y/N | |
| iPhone (iOS 17+) | Chrome | | Y/N | |
| Android (Chrome) | Chrome | | Y/N | Record speech diag strip values |
| iPad (iOS) | Safari | | Y/N | |
| Windows desktop | Chrome | | Y/N | |
| Windows desktop | Edge | | Y/N | |
| macOS desktop | Chrome | | Y/N | |
| macOS desktop | Safari | | Y/N | |

**Minimum required to sign off:** iPhone Safari ✓, Android Chrome ✓ (audio + submit, transcript diagnosed), Desktop Chrome ✓

---

## Section 8 — Known Issues & Accepted Exceptions

| ID | Issue | Status | Accepted? |
|---|---|---|---|
| KI-01 | Android Chrome live transcript may not appear | Under diagnosis — speech diag strip added to gather data | Accepted for v1 — audio capture and grading work |
| KI-02 | Image generation takes ~10s on first open of SBC | By design — Gemini API call | Accepted |
| KI-03 | Generation limit resets daily (may show 0 remaining after midnight) | By design | Accepted |
| KI-04 | Very long SBC responses (>3 min each) may cause slow submission | Audio blob size — submit still works | Accepted |

---

## Sign-Off Checklist

| Area | Tester | Date | Sign-Off |
|---|---|---|---|
| UX & Visual (Sec 2) | | | |
| Functional — Recording (Sec 3.1–3.3) | | | |
| Functional — Submit & AI (Sec 3.4–3.5) | | | |
| Practice End-to-End TC-01 to TC-06 | | | |
| Parent Use Cases PC-01 to PC-06 | | | |
| Data Management DM-01 to DM-06 | | | |
| Cross-Device Matrix (Sec 7) | | | |
| Known Issues accepted (Sec 8) | | | |

**Overall sign-off:** _________________________ Date: _____________

---

*This document should be read alongside the app itself — test IDs map to specific screens and features as described. Any FAIL finding should include a screenshot, the device/browser, and the steps to reproduce.*
