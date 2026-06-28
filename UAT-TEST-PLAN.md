# PSLE Oral Practice App — UAT Test Plan

**Version:** Pre-Launch  
**Testers:** 3 (roles assigned below)  
**Device:** Chrome on Android/iOS phone (primary), desktop Chrome (secondary)  
**Prerequisites:** App deployed and accessible at the Cloud Run URL. Parent PIN not yet set.

---

## Tester Roles

| Tester | Role | Focus |
|--------|------|-------|
| **Tester A** | Student (child) | Recording, SBC flow, Reading flow, UX, daily usage |
| **Tester B** | Parent | Parent dashboard, grading, settings, history readability |
| **Tester C** | Content reviewer | Exercise content accuracy, question quality, AI evaluation quality, scoring |

---

## PRE-TEST: Reset to Clean State

**Run before any testing begins.**

1. Tester B logs into Parent dashboard (set new PIN)
2. Go to **Settings → Danger Zone → Reset All Practice Data**
3. Confirm twice
4. Verify: redirected to parent dashboard, history is empty, streak = 0
5. Sign out (navigate back to student view)

---

## Module 1 — Onboarding & Navigation (Tester A)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 1.1 | Open app on phone | Home screen loads with exercise list | | |
| 1.2 | Scroll exercise list | Exercises display with title, type badge (Reading/SBC), difficulty | | |
| 1.3 | Tap bottom nav: Home, Progress, Parent | Each tab navigates correctly | | |
| 1.4 | Tap Parent tab | PIN gate appears | | |
| 1.5 | Enter wrong PIN 3 times | Error shown, not locked out | | |
| 1.6 | Close app, reopen | App returns to Home, PIN not required for student view | | |

---

## Module 2 — Reading Aloud Exercise (Tester A + C)

**Select any "Reading Aloud" exercise.**

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 2.1 | Tap a Reading exercise | Practice screen loads with passage text | | |
| 2.2 | Read passage text | Text is legible, appropriate length (~3-4 sentences) | | |
| 2.3 | Tap record button (🎤) | Microphone permission prompt appears | | |
| 2.4 | Grant permission and speak | Button pulses red (recording animation plays) | | |
| 2.5 | Live transcript appears while speaking | Words appear in real-time below the button | | |
| 2.6 | Tap stop button (⏹) | Recording stops; transcript shown; audio playback appears | | |
| 2.7 | Play back the recording | Audio plays clearly | | |
| 2.8 | Tap 🎤 again to re-record | Old transcript cleared; new recording begins | | |
| 2.9 | Submit with no recording | Button disabled / error shown | | |
| 2.10 | Submit a recording | "Evaluating…" spinner shown | | |
| 2.11 | Wait for evaluation (10-30s) | Results appear OR error message if API issue | | |
| 2.12 | Score shown: X/20 | Score circle visible (teal/gold/red by range) | | |
| 2.13 | View feedback sections | Pronunciation score, Fluency score, Strengths, Areas to improve all shown | | |
| 2.14 | Model answer visible | At least one model answer paragraph shown | | |
| 2.15 | Back arrow on results | Returns to home, not re-submits | | |

---

## Module 3 — SBC Exercise: Image & Questions (Tester A + C)

**Select any "Stimulus-Based Conversation" exercise.**

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 3.1 | Tap an SBC exercise | Practice screen loads; image generation begins or pre-loaded image shown | | |
| 3.2 | Image loads (first time) | Realistic photograph appropriate for age 11-12; no text overlaid | | |
| 3.3 | **Close and reopen same SBC** | Same image shown — NOT regenerated | | **Critical: image persistence** |
| 3.4 | Tap "Regenerate" | New image generated and saved (old one replaced) | | |
| 3.5 | **Close and reopen after regenerate** | New regenerated image persists | | |
| 3.6 | Image content relevance | Image matches the exercise topic/description | | Tester C assess |
| 3.7 | Question 1 shown | "Picture Inference" type question displayed | | |
| 3.8 | Navigate Q1 → Q2 → Q3 | "Next Question" button advances; dots at top update | | |
| 3.9 | Q2 type | "Personal Experience" question | | |
| 3.10 | Q3 type | "Opinion" question | | |
| 3.11 | Dot navigation (tap dots) | Can jump between questions by tapping dots | | |
| 3.12 | Navigate back to Q1 via dots | Q1 content shown, previous recording preserved | | |

---

## Module 4 — SBC Recording & Submission (Tester A)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 4.1 | Record Q1 | Transcript appears, dot turns green | | |
| 4.2 | Record Q2 | Transcript appears, dot turns green | | |
| 4.3 | Record Q3 | Transcript appears, dot turns green | | |
| 4.4 | Submit Attempt 1 | "Evaluating…" shown; attempt card appears with score | | |
| 4.5 | **"Confirm & Finish" with 1 attempt** | Goes directly to results page (no extra click needed) | | **Critical fix** |
| 4.6 | Results page: 3 question scores | Q1/Q2/Q3 each show X/10 | | |
| 4.7 | Total score shown | Sum of Q1+Q2+Q3 out of 30 | | |
| 4.8 | Attempt 2: record new answers | New recording over different questions possible | | |
| 4.9 | Submit Attempt 2 | Two attempt cards shown | | |
| 4.10 | "Confirm & Finish" with 2 attempts | Selection UI shown: "Confirm This" on each card | | |
| 4.11 | Confirm one of the two attempts | Navigates to that attempt's results; other deleted | | |
| 4.12 | Attempt 3 (3rd submit) | Automatically enters confirm mode | | |
| 4.13 | Back button with unsaved recording | Confirmation dialog "leave without submitting?" | | |

---

## Module 5 — Results Page (Tester A + C)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 5.1 | Score circle colour | Teal ≥70%, Gold 50-69%, Red <50% | | |
| 5.2 | General feedback | Paragraph of overall feedback shown | | Tester C: assess relevance |
| 5.3 | Strengths list | 2-4 bullet points on what the student did well | | |
| 5.4 | Areas to improve | 2-4 actionable improvement points | | |
| 5.5 | Model answer Q1 | Suggested response shown for Q1 | | |
| 5.6 | Model answer Q2 | Suggested response shown for Q2 | | |
| 5.7 | Model answer Q3 (SBC only) | Suggested response shown for Q3 | | |
| 5.8 | Reading model answer | At least one model passage reading shown | | |
| 5.9 | Back to Home | Bottom nav or back button works | | |

---

## Module 6 — AI Evaluation Quality (Tester C)

**Evaluate the quality and accuracy of the AI grading. Test with controlled inputs.**

### Reading Aloud
| # | Scenario | Expected Score Range | Pass/Fail | Notes |
|---|----------|---------------------|-----------|-------|
| 6.1 | Good clear reading — read the passage naturally | 14-20/20 (≥70%) | | |
| 6.2 | Poor reading — mumble/rush through | 6-12/20 (30-60%) | | |
| 6.3 | Submit blank / single word | ≤4/20 | | |
| 6.4 | Pronunciation score (criterion 1) | 0-10, reflects clarity | | |
| 6.5 | Fluency score (criterion 2) | 0-10, reflects flow/pace | | |

### SBC Scoring
| # | Scenario | Expected | Pass/Fail | Notes |
|---|----------|---------|-----------|-------|
| 6.6 | All 3 questions answered well (PEEL structure) | ≥7/10 each, total ≥21/30 | | |
| 6.7 | Only Q1 answered, Q2 & Q3 blank | Q1 scored; Q2=0, Q3=0 | | **Per-question independence** |
| 6.8 | All blank / "I don't know" | Total ≤3/30 | | |
| 6.9 | Q2 has personal experience content | Q2 score reflects personal experience quality | | |
| 6.10 | Q3 has opinion with reasons | Q3 score reflects opinion depth | | |
| 6.11 | Model answers are in English, appropriate for P6 | No adult vocabulary; relevant to question | | |
| 6.12 | Feedback is specific, not generic | Feedback references actual content of the response | | |

---

## Module 7 — Progress Tab (Tester A)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 7.1 | Tap Progress tab | Progress screen loads | | |
| 7.2 | Streak shown after 1 session today | Streak = 1 day | | |
| 7.3 | Sessions count | Matches number of evaluated sessions | | |
| 7.4 | Average score | Correct percentage across all sessions | | |
| 7.5 | Recent history list | Sessions shown with score, date, type | | |
| 7.6 | Tap a session in progress | Opens results view | | |

---

## Module 8 — Parent Dashboard (Tester B)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 8.1 | Tap Parent tab | PIN entry screen shown | | |
| 8.2 | First time: set a 4-digit PIN | Confirm PIN step; then access granted | | |
| 8.3 | Second visit: enter existing PIN | Access granted immediately | | |
| 8.4 | Auto-submit when 4th digit typed | No "Enter" button needed | | |
| 8.5 | Wrong PIN | Error shown, fields clear, retry | | |
| 8.6 | Overview card visible | Total Sessions, Average Score, Best Score, Streak all shown | | |
| 8.7 | Stats are readable | Numbers and labels clearly visible (not washed out) | | **Contrast fix** |
| 8.8 | Session list readable | Title visible (bold), meta text (date/score) readable | | |
| 8.9 | Score circle colour coding | Teal/Gold/Red matches score range | | |
| 8.10 | Tap a session | Opens session detail | | |
| 8.11 | Sessions sorted newest first | Most recent session at top | | |
| 8.12 | Show Archived toggle | Archived sessions appear/hide on toggle | | |

---

## Module 9 — Parent Session Detail & Grading (Tester B + C)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 9.1 | Open a completed session | All AI scores, feedback, transcripts shown | | |
| 9.2 | AI score displayed | Score circle with X/20 or X/30 | | |
| 9.3 | Transcripts shown | Student's recorded words shown per question | | |
| 9.4 | AI feedback shown | General feedback, strengths, improvements | | |
| 9.5 | Parent grading sliders | Q1/Q2/Q3 sliders (0-10 each) present | | |
| 9.6 | Adjust sliders and save | Parent scores saved; total calculated | | |
| 9.7 | Refresh page | Parent scores persisted (not reset) | | |
| 9.8 | Parent notes field | Can type and save notes | | |
| 9.9 | Archive session | Session moves to "Archived" in parent list | | |
| 9.10 | Delete session | Session removed from all history | | |
| 9.11 | Back button | Returns to parent dashboard | | |

---

## Module 10 — Settings (Tester B)

| # | Step | Expected Result | Pass/Fail | Notes |
|---|------|----------------|-----------|-------|
| 10.1 | Open Settings | Child Profile, AI Config, Notifications sections shown | | |
| 10.2 | Enter child name | Saved successfully | | |
| 10.3 | Set daily practice goal | Dropdown 1-5, saves correctly | | |
| 10.4 | Enter Gemini API key | Masked input; Show/Hide toggle works | | |
| 10.5 | Save settings | "Settings saved successfully!" confirmation | | |
| 10.6 | Notification email field | Can enter email address | | |
| 10.7 | Toggle completion alerts | Toggles on/off; persists after save | | |
| 10.8 | Reset Parent PIN | Clears PIN; redirects to set new one | | |
| 10.9 | Reset All Practice Data (pre-launch) | Double confirmation; data cleared; redirect to dashboard | | |
| 10.10 | Post-reset: parent dashboard empty | No sessions, streak = 0 | | |

---

## Module 11 — Content Quality (Tester C)

**Review exercise content for PSLE appropriateness.**

| # | Check | Criteria | Pass/Fail | Notes |
|---|-------|---------|-----------|-------|
| 11.1 | Reading passage length | 80-150 words; age-appropriate vocabulary | | |
| 11.2 | Reading passage topic | Relevant to Singapore context / P6 level | | |
| 11.3 | SBC image description | Clear, specific, child-safe | | |
| 11.4 | Q1 (Picture Inference) | Asks about what's happening in the image | | |
| 11.5 | Q2 (Personal Experience) | Asks student to relate topic to their life | | |
| 11.6 | Q3 (Opinion) | Asks for a view with reasoning | | |
| 11.7 | Question phrasing | Natural English, not ambiguous | | |
| 11.8 | Difficulty labels | Easy/Medium/Hard matches actual exercise difficulty | | |
| 11.9 | Daily exercise badge | At least 1 exercise marked as daily | | |
| 11.10 | Preamble text | Brief, helpful context for student | | |

---

## Module 12 — Error Handling & Edge Cases (All Testers)

| # | Scenario | Expected Result | Pass/Fail | Notes |
|---|----------|----------------|-----------|-------|
| 12.1 | Submit SBC with no API key configured | Clear error message shown; not a blank screen | | |
| 12.2 | Image generation fails | Error message shown; text description shown as fallback | | |
| 12.3 | Record then immediately submit | No crash; handles very short transcript | | |
| 12.4 | Open practice, go back immediately | No stale state on next open | | |
| 12.5 | Network goes offline mid-evaluation | Error message shown; not stuck in spinner | | |
| 12.6 | Very long answer (2+ minutes talking) | Transcript continues to accumulate | | |
| 12.7 | App in background mid-recording | Recording may stop; on return, state is consistent | | |

---

## Module 13 — UX & Responsiveness (Tester A)

| # | Check | Criteria | Pass/Fail | Notes |
|---|-------|---------|-----------|-------|
| 13.1 | Phone portrait mode | All content fits without horizontal scroll | | |
| 13.2 | Text size | Legible at default zoom, no squinting needed | | |
| 13.3 | Button tap targets | Easy to tap on phone; no mis-taps | | |
| 13.4 | Loading states | Spinner shown for all async operations | | |
| 13.5 | ReRe mascot visible | Mascot appears on practice screen; mood changes | | |
| 13.6 | Bottom nav always visible | Nav bar not obscured by keyboard | | |
| 13.7 | Record button size | Large enough to tap confidently | | |
| 13.8 | Score screen scrollable | All feedback visible by scrolling | | |
| 13.9 | Dark theme throughout | No white backgrounds, no washed-out text | | |
| 13.10 | Transitions | No jarring flickers between screens | | |

---

## Go/No-Go Criteria

### Blockers (must fix before launch)
- [ ] SBC submission completes successfully (Module 4.4–4.5)
- [ ] SBC image persists across reopens (Module 3.3)
- [ ] AI evaluation returns scores within expected ranges (Module 6)
- [ ] Parent can view and grade any session (Module 9)
- [ ] Reset All Practice Data works (Module 10.9)
- [ ] No blank screens or infinite spinners in any tested path (Module 12)

### Nice-to-have (can launch with)
- [ ] Notification emails actually send (currently logs only)
- [ ] Audio playback works on all devices
- [ ] Progress streak accurate after midnight

---

## Bug Report Template

```
Module: [e.g. 4 – SBC Submission]
Step #: [e.g. 4.5]
Device: [e.g. iPhone 15 / Chrome Android / Desktop Chrome]
Steps to reproduce:
  1.
  2.
  3.
Expected: 
Actual: 
Screenshot: [attach]
Severity: Blocker / Major / Minor
```

---

## Sign-Off

| Tester | Date | Signature | Result |
|--------|------|-----------|--------|
| Tester A (Student) | | | Pass / Fail |
| Tester B (Parent) | | | Pass / Fail |
| Tester C (Content) | | | Pass / Fail |
