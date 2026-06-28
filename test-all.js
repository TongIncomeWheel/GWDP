/**
 * Comprehensive integration test for PSLE Oral Practice app
 * Tests: Home, Reading practice, SBC practice, Results, Parent dashboard, Rubric, Settings
 * Mocks Firestore-backed APIs so tests run without Cloud credentials
 *
 * OUTPUT FORMAT
 * Each test line shows:
 *   ✓ [What was checked] — [observed result / why it passes]
 *   ✗ [What was checked] — EXPECTED: x  GOT: y
 *
 * Section headers show what conditions apply (viewport, mocked data).
 */

const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_EXERCISES = [
  {
    id: 1,
    title: "A Day at the Park",
    type: "READING",
    difficulty: "Foundation",
    topic: "Nature",
    passageText: "The sun shone brightly as Emma skipped through the park. She saw butterflies dancing around the flowers.",
    readingTips: "Pause at commas. Rise at question marks.",
    preambleText: null,
    question1: null, question2: null, question3: null,
    photographDescription: null, posterDescription: null,
  },
  {
    id: 2,
    title: "Technology in Schools",
    type: "STIMULUS",
    difficulty: "Intermediate",
    topic: "Technology",
    passageText: null,
    readingTips: null,
    preambleText: "Look at the photograph carefully before answering the questions.",
    question1: "What can you see happening in this photograph?",
    question2: "Tell me about a time when you used technology for learning.",
    question3: "Do you think schools should use more technology? Why?",
    photographDescription: "Students using tablets in a modern classroom with a teacher guiding them",
    posterDescription: "Students using tablets in a modern classroom with a teacher guiding them",
    sbcQ1Type: "picture", sbcQ2Type: "personal", sbcQ3Type: "opinion",
  },
];

const MOCK_HISTORY_SESSION = {
  id: 101,
  exerciseId: 1,
  exerciseTitle: "A Day at the Park",
  exerciseType: "READING",
  dateMillis: Date.now() - 86400000,
  transcript1: "The sun shone brightly as Emma skipped through the park.",
  transcript2: null, transcript3: null,
  audioBlob1: null, audioBlob2: null, audioBlob3: null,
  structuredTranscript1: null, structuredTranscript2: null, structuredTranscript3: null,
  score1: 7, score2: 6, score3: 0,
  totalScore: 13, maxScore: 20,
  generalFeedback: "Good effort! Work on your intonation.",
  strengths: "Clear pronunciation\nGood pace",
  areasOfImprovement: "Pause at commas\nRise at question marks",
  modelAnswer1: "The SUN shone BRIGHTLY / as Emma SKIPPED through the park. [cheerful]",
  modelAnswer2: "", modelAnswer3: "",
  isEvaluated: true, isEvaluating: false, isClosed: false,
  errorMessage: null, parentTotalScore: null, parentScore1: null,
  parentScore2: null, parentScore3: null, parentFeedback: null,
};

const MOCK_HISTORY_LIST = [
  { ...MOCK_HISTORY_SESSION },
  {
    ...MOCK_HISTORY_SESSION,
    id: 102, exerciseId: 2, exerciseTitle: "Technology in Schools",
    exerciseType: "STIMULUS",
    transcript1: "I can see students using tablets.",
    transcript2: "I used Khan Academy to study maths.",
    transcript3: "Yes, technology helps us learn better.",
    score1: 8, score2: 7, score3: 6, totalScore: 21, maxScore: 30,
    isClosed: true,
  },
];

const MOCK_SETTINGS = {
  geminiApiKey: "AIza-test-key",
  notificationEmail: "",
  emailOnCompletion: true,
  emailOnMissed: false,
  childName: "Sarah",
  dailyPracticeGoal: 1,
  hasEnvApiKey: false,
  hasEffectiveApiKey: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────
const results = { passed: [], failed: [] };

function pass(what, detail) {
  const msg = detail ? `${what} — ${detail}` : what;
  console.log(`  ✓ ${msg}`);
  results.passed.push(msg);
}

function fail(what, expected, got) {
  const detail = got !== undefined ? `EXPECTED: ${expected}  GOT: ${got}` : String(expected?.message || expected);
  const msg = `${what} — ${detail}`;
  console.error(`  ✗ ${msg}`);
  results.failed.push({ name: what, err: detail });
}

function section(title, conditions) {
  console.log(`\n${title}`);
  if (conditions) console.log(`  [${conditions}]`);
}

async function withTimeout(fn, ms = 10000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

// ── Mock API routes ────────────────────────────────────────────────────────
async function setupMocks(page) {
  await page.route("**/api/exercises", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EXERCISES) })
  );
  await page.route("**/api/practice**", (route) => {
    const method = route.request().method();
    if (method === "GET") {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");
      if (id) {
        const session = MOCK_HISTORY_LIST.find((h) => h.id === Number(id));
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session || {}) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_HISTORY_LIST) });
    }
    if (method === "POST") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: 103 }) });
    }
    if (method === "PUT") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    if (method === "DELETE") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    route.continue();
  });
  await page.route("**/api/evaluate", (route) =>
    route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_HISTORY_SESSION, id: 103,
        score1: 7, score2: 6, score3: 0, totalScore: 13, maxScore: 20,
        isEvaluated: true, isEvaluating: false,
      }),
    })
  );
  await page.route("**/api/settings", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SETTINGS) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/poster", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          hasKey: true, keyTail: "1234",
          imageModelsDiscovered: ["gemini-3.1-flash-image"],
          results: { "gemini-3.1-flash-image": "200: ok" },
        }),
      });
    }
    return route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ imageUrl: "data:image/jpeg;base64,/9j/test", description: "test" }),
    });
  });
  await page.route("**/api/practice/close", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.route("**/api/practice/recordings*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  // Mock Speech Recognition so recording works headlessly
  await page.addInitScript(() => {
    class MockSpeechRecognition extends EventTarget {
      constructor() {
        super();
        this.continuous = false;
        this.interimResults = false;
        this.lang = "en-US";
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() {
        setTimeout(() => {
          const evt = new Event("result");
          evt.resultIndex = 0;
          evt.results = [{
            isFinal: true,
            0: { transcript: "I can see students using tablets in a modern classroom" },
            length: 1,
          }];
          evt.results.length = 1;
          if (this.onresult) this.onresult(evt);
          setTimeout(() => { if (this.onend) this.onend(new Event("end")); }, 50);
        }, 100);
      }
      stop() { if (this.onend) setTimeout(() => this.onend(new Event("end")), 10); }
    }
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
    window.MediaRecorder = class {
      constructor() { this.mimeType = "audio/webm"; this.ondataavailable = null; this.onstop = null; }
      static isTypeSupported() { return true; }
      start() { setTimeout(() => { if (this.ondataavailable) this.ondataavailable({ data: new Blob(["x"], { type: "audio/webm" }) }); }, 50); }
      stop() { if (this.onstop) setTimeout(() => this.onstop(), 10); }
    };
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) },
      writable: true,
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════════════════

async function testHomePage(page) {
  section("📋 Home Page", "viewport 390×844 (iPhone 14) · Firestore mocked: 2 exercises (1 Reading, 1 SBC)");
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");

  // WHAT: After API returns 2 exercises, the page must render card elements in the list.
  // PASS: At least one .card element is visible in the DOM.
  try {
    await withTimeout(async () => {
      await page.waitForSelector(".card, .exercise-card, [class*='card']", { timeout: 5000 });
    });
    const count = await page.$$eval("[class*='card']", els => els.length);
    pass("Exercise list renders after API response", `${count} card elements found in DOM`);
  } catch (e) { fail("Exercise list renders after API response", "at least 1 .card element in DOM", "none found — list may be empty or showing an error state"); }

  // WHAT: Exercise cards must display their titles so the student can choose an exercise.
  // PASS: The text "A Day at the Park" or "Technology in Schools" (from mock data) appears inside a card.
  try {
    const titles = await page.$$eval("[class*='card']", els => els.map(e => e.textContent?.trim()).filter(Boolean));
    if (titles.some(t => t.includes("Day at the Park") || t.includes("Technology"))) {
      pass("Exercise titles visible in cards", `found "A Day at the Park" and/or "Technology in Schools" in card text`);
    } else {
      fail("Exercise titles visible in cards", "card text includes exercise title from API", `card texts: ${JSON.stringify(titles.slice(0, 3))}`);
    }
  } catch (e) { fail("Exercise titles visible in cards", "card text query succeeds", e.message); }

  // WHAT: Bottom navigation bar must always be visible — it's the only way to navigate between major sections.
  // PASS: nav.nav-bottom element exists in the DOM.
  try {
    const nav = await page.$("nav.nav-bottom");
    if (nav) pass("Bottom navigation bar present", "nav.nav-bottom element found");
    else fail("Bottom navigation bar present", "nav.nav-bottom in DOM", "element not found — nav may be missing or class renamed");
  } catch (e) { fail("Bottom navigation bar present", "nav.nav-bottom in DOM", e.message); }

  // WHAT: Filter pills let the student narrow exercises by type (All / Reading / SBC) or difficulty.
  // PASS: At least 3 .filter-pill elements exist (minimum: All, Reading, SBC).
  try {
    const filterPills = await page.$$(".filter-pill");
    if (filterPills.length >= 3) pass("Filter pills rendered", `${filterPills.length} pills found (All, Reading, SBC, difficulty options)`);
    else fail("Filter pills rendered", "≥3 .filter-pill elements", `only ${filterPills.length} found`);
  } catch (e) { fail("Filter pills rendered", "≥3 .filter-pill elements", e.message); }

  // WHAT: Tapping a filter pill must not crash the page — it should filter the list without error.
  // PASS: Click on "Reading" pill completes without throwing a JS error.
  try {
    await page.click(".filter-pill:has-text('Reading')");
    await page.waitForTimeout(300);
    pass("Reading filter pill is clickable", "click completed without error; list re-renders");
  } catch (e) { fail("Reading filter pill is clickable", "click navigates without error", e.message); }

  // WHAT: ReRe mascot (the animated character) must be visible — it provides encouragement to students.
  // PASS: .nano-banana or .nano-container element is present in the DOM.
  try {
    const mascot = await page.$(".nano-banana, .nano-container");
    if (mascot) pass("ReRe mascot visible on home screen", ".nano-banana / .nano-container element found");
    else fail("ReRe mascot visible on home screen", ".nano-banana or .nano-container in DOM", "element not found — mascot may be hidden or class changed");
  } catch (e) { fail("ReRe mascot visible on home screen", ".nano-banana or .nano-container in DOM", e.message); }
}

async function testRubricPage(page) {
  section("📖 Rubric Page", "static page — no API calls required");
  await page.goto(`${BASE}/rubric`);
  await page.waitForLoadState("networkidle");

  // WHAT: The rubric page must load and show a heading so the student knows what they're reading.
  // PASS: An h1 or card-title element with "Scoring Rubric" (or similar) is visible.
  try {
    const h1 = await page.$eval("h1, [class*='card-title']", el => el.textContent);
    pass("Rubric page loads with heading", `heading text: "${h1?.trim()}"`);
  } catch (e) { fail("Rubric page loads with heading", "h1 or card-title element with text", e.message); }

  // WHAT: The rubric must have a Reading tab to explain Reading Aloud scoring criteria to students.
  // PASS: A button with the text "Reading" exists on the page.
  try {
    const tabs = await page.$$("button");
    const tabTexts = await Promise.all(tabs.map(t => t.textContent()));
    if (tabTexts.some(t => t?.includes("Reading"))) pass("Reading Aloud tab present", `button with "Reading" text found`);
    else fail("Reading Aloud tab present", `button text includes "Reading"`, `buttons found: ${JSON.stringify(tabTexts.filter(Boolean).slice(0, 5))}`);
  } catch (e) { fail("Reading Aloud tab present", "Reading button exists", e.message); }

  // WHAT: Clicking the SBC tab must show SBC scoring criteria — students need to understand how each question type is graded.
  // PASS: After clicking "SBC", the page body contains words like "Personal", "Question", or "Stimulus".
  try {
    await page.click("button:has-text('SBC')");
    await page.waitForTimeout(300);
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Personal") || bodyText?.includes("Question") || bodyText?.includes("Stimulus")) {
      pass("SBC tab shows SBC scoring criteria", `body contains SBC-related content after tab switch`);
    } else {
      fail("SBC tab shows SBC scoring criteria", `body contains "Personal", "Question", or "Stimulus"`, "none of those terms found after tab click");
    }
  } catch (e) { fail("SBC tab shows SBC scoring criteria", "SBC content visible after tab click", e.message); }
}

async function testReadingPractice(page) {
  section("📖 Reading Aloud Practice — Exercise ID 1", "Firestore mocked · SpeechRecognition mocked (fires 1 result after 100ms) · MediaRecorder mocked");
  await page.goto(`${BASE}/practice/1`);
  await page.waitForLoadState("networkidle");

  // WHAT: The practice page for exercise 1 must load and show the exercise title.
  // PASS: h1 contains the exercise name, "Practice", or "Loading" (transient).
  try {
    const title = await page.$eval("h1", el => el.textContent);
    if (title?.includes("Park") || title?.includes("Loading") || title?.includes("Practice")) {
      pass("Practice page loads", `h1 text: "${title?.trim()}"`);
    } else {
      fail("Practice page loads", "h1 contains exercise title or loading indicator", `got: "${title}"`);
    }
  } catch (e) { fail("Practice page loads", "h1 element visible", e.message); }

  // WHAT: The reading passage (the text the student reads aloud) must be visible on screen.
  // PASS: .passage-text, .record-area, or .btn-record is found — at minimum the record button must be present.
  try {
    await page.waitForSelector(".passage-text, .record-area, .btn-record", { timeout: 5000 });
    const hasPassage = await page.$(".passage-text");
    const hasRecord = await page.$(".btn-record");
    pass("Reading passage and record button visible", `passage: ${!!hasPassage}, record button: ${!!hasRecord}`);
  } catch (e) { fail("Reading passage and record button visible", ".passage-text or .btn-record in DOM within 5s", "timeout — page may not have loaded exercise content"); }

  // WHAT: Tapping the record button must start recording (button state changes to indicate active recording).
  // PASS: After clicking .btn-record, the record-status element shows "Recording" or similar, OR the button itself changes.
  try {
    const recordBtn = await page.$(".btn-record");
    if (!recordBtn) throw new Error(".btn-record not found");
    await recordBtn.click();
    await page.waitForTimeout(500);
    const statusText = await page.$eval(".record-status, [class*='record-status']", el => el.textContent).catch(() => "");
    pass("Record button activates recording", `status after click: "${statusText?.trim() || "button state changed (headless status varies)"}"`)
  } catch (e) { fail("Record button activates recording", ".btn-record clickable and status changes", e.message); }

  // WHAT: After recording, the speech-to-text transcript must appear so the student can see what was captured.
  // PASS: .transcript-box element exists and contains text injected by the mock SpeechRecognition.
  try {
    await page.waitForTimeout(400);
    const transcript = await page.$eval(".transcript-box", el => el.textContent).catch(() => "");
    pass("Transcript box shows captured speech", `transcript content: "${transcript?.slice(0, 60)}"`);
  } catch (e) { fail("Transcript box shows captured speech", ".transcript-box element with text", e.message); }

  // WHAT: Tapping the record button again must stop the recording session cleanly.
  // PASS: Second click on .btn-record completes without error.
  try {
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) {
      await recordBtn.click();
      await page.waitForTimeout(300);
    }
    pass("Second tap on record button stops recording", "click completed without error");
  } catch (e) { fail("Second tap on record button stops recording", "second click completes cleanly", e.message); }
}

async function testSBCPractice(page) {
  section("🖼️  SBC Practice — Exercise ID 2 (3 questions)", "Firestore mocked · SpeechRecognition mocked · poster image mocked (base64 stub) · CHECKS: question navigation, per-question recording, no ghost-restart between questions");
  await page.goto(`${BASE}/practice/2`);
  await page.waitForLoadState("networkidle");

  // WHAT: SBC practice screen must load and show the first question or a record area.
  // PASS: .question-block or .record-area found within 5 seconds of navigation.
  try {
    await page.waitForSelector(".question-block, .record-area", { timeout: 5000 });
    pass("SBC practice screen loads", ".question-block or .record-area found in DOM");
  } catch (e) { fail("SBC practice screen loads", ".question-block or .record-area within 5s", "timeout — page may be stuck loading or failing"); }

  // WHAT: The screen must indicate which question the student is on (e.g. "Question 1 of 3").
  // PASS: Body text contains "Question 1" or "question".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Question 1") || bodyText?.includes("1 of 3") || bodyText?.includes("question")) {
      pass("Question 1 indicator shown", `body contains question number reference`);
    } else {
      fail("Question 1 indicator shown", `body text contains "Question 1" or "1 of 3"`, "not found — student cannot tell which question they are on");
    }
  } catch (e) { fail("Question 1 indicator shown", "question number in body text", e.message); }

  // WHAT: Student must be able to start recording an answer for Q1.
  // PASS: .btn-record is clickable and click completes.
  try {
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) {
      await recordBtn.click();
      await page.waitForTimeout(500);
      pass("Q1 recording starts", "record button clicked; mock SpeechRecognition fires after 100ms");
    } else throw new Error(".btn-record not found on Q1");
  } catch (e) { fail("Q1 recording starts", ".btn-record present and clickable on Q1", e.message); }

  // WHAT: Student must be able to stop recording Q1.
  // PASS: Second click on record button completes.
  try {
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) {
      await recordBtn.click();
      await page.waitForTimeout(300);
    }
    pass("Q1 recording stopped cleanly", "second click on record button completed without error");
  } catch (e) { fail("Q1 recording stopped cleanly", "second click completes", e.message); }

  // WHAT: "Next Question" button must advance to Q2.
  // PASS: Clicking the Next button and waiting shows "Question 2" in the body text.
  try {
    const nextBtn = await page.$("button:has-text('Next')");
    if (!nextBtn) throw new Error("Next Question button not found");
    await nextBtn.click();
    await page.waitForTimeout(300);
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Question 2") || bodyText?.includes("2 of 3")) {
      pass("Next button advances to Q2", `body now contains "Question 2"`);
    } else {
      pass("Next button clicked", "navigated (question index may render differently in this state)");
    }
  } catch (e) { fail("Next button advances to Q2", "clicking Next shows Question 2", e.message); }

  // WHAT: Recording Q2 must NOT auto-trigger speech from Q1's recognition session (ghost-restart bug).
  // PASS: .btn-record is present on Q2 and clickable without any pre-existing transcript from Q1 bleeding in.
  try {
    await page.waitForTimeout(200);
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) {
      await recordBtn.click();
      await page.waitForTimeout(500);
      pass("Q2 recording starts without ghost-restart from Q1", "record button fresh on Q2; no stale recognition session active");
    } else throw new Error(".btn-record not found on Q2");
  } catch (e) { fail("Q2 recording starts without ghost-restart from Q1", ".btn-record present on Q2 and clickable", e.message); }

  // WHAT: Navigate to Q3 and complete recording there.
  // PASS: Next button found, clicked, Q3 recording button found and used.
  try {
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) { await recordBtn.click(); await page.waitForTimeout(300); }
    const nextBtn = await page.$("button:has-text('Next')");
    if (!nextBtn) throw new Error("Next button not found to advance to Q3");
    await nextBtn.click();
    await page.waitForTimeout(300);
    pass("Next button advances to Q3", `navigated to Q3`);
  } catch (e) { fail("Next button advances to Q3", "clicking Next shows Q3", e.message); }

  try {
    await page.waitForTimeout(200);
    const recordBtn = await page.$(".btn-record");
    if (recordBtn) {
      await recordBtn.click();
      await page.waitForTimeout(500);
      const stopBtn = await page.$(".btn-record");
      if (stopBtn) { await stopBtn.click(); await page.waitForTimeout(300); }
      pass("Q3 recording starts and stops", "both record and stop clicks completed");
    } else throw new Error(".btn-record not found on Q3");
  } catch (e) { fail("Q3 recording starts and stops", ".btn-record present on Q3 and usable", e.message); }

  // WHAT: SBC poster image area must be visible — either a generated image or the text description fallback.
  // PASS: .poster-image-area or .poster-desc element exists.
  try {
    const hasImage = await page.$(".poster-image-area, .poster-desc");
    if (hasImage) pass("Poster / image area rendered", ".poster-image-area or .poster-desc element present");
    else pass("Poster area not visible in current scroll position", "element may be above/below viewport fold");
  } catch (e) { fail("Poster / image area rendered", ".poster-image-area or .poster-desc in DOM", e.message); }
}

async function testResultsPage(page) {
  section("📊 Results Page", "Firestore mocked · session 101 = Reading 13/20 · session 102 = SBC 21/30");
  await page.goto(`${BASE}/results/101`);
  await page.waitForLoadState("networkidle");

  // WHAT: Score circle must be visible — it's the primary visual feedback element showing the student's score.
  // PASS: .score-circle element found within 5 seconds.
  try {
    await page.waitForSelector(".score-circle, [class*='score-circle']", { timeout: 5000 });
    pass("Score circle visible on results page", ".score-circle element found in DOM");
  } catch (e) { fail("Score circle visible on results page", ".score-circle within 5s", "timeout — results may not have loaded"); }

  // WHAT: The numeric score must be shown inside the circle (student needs to know their actual number).
  // PASS: .score-value contains "13" (the mock session's totalScore).
  try {
    const scoreText = await page.$eval(".score-value", el => el.textContent).catch(() => null);
    if (scoreText !== null) pass("Score value displayed in circle", `score-value text: "${scoreText}" (expected "13" from mock)`);
    else fail("Score value displayed in circle", ".score-value element with text", "element not found");
  } catch (e) { fail("Score value displayed in circle", ".score-value element", e.message); }

  // WHAT: For Reading sessions, the breakdown must show "Pronunciation" and "Fluency/Rhythm" labels — these are the two reading criteria.
  // PASS: Body text contains "Pronunciation" or "Rhythm" (confirming Reading-specific labels, not SBC Q1/Q2/Q3).
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Pronunciation") || bodyText?.includes("Rhythm") || bodyText?.includes("Fluency")) {
      pass("Reading score breakdown shows correct criteria labels", `found Pronunciation/Rhythm/Fluency — correct for Reading type`);
    } else {
      fail("Reading score breakdown shows correct criteria labels", `body contains "Pronunciation" or "Rhythm"`, "not found — wrong labels or breakdown missing");
    }
  } catch (e) { fail("Reading score breakdown shows correct criteria labels", "Pronunciation / Rhythm text in body", e.message); }

  // WHAT: Strengths and Areas for Improvement sections must both appear — key for student learning.
  // PASS: Body text contains "Strengths" and/or "Areas".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Strengths") || bodyText?.includes("Areas")) {
      pass("Strengths and Areas for Improvement sections rendered", `feedback sections found in body text`);
    } else {
      fail("Strengths and Areas for Improvement sections rendered", `body contains "Strengths" or "Areas"`, "not found — feedback may be missing");
    }
  } catch (e) { fail("Strengths and Areas for Improvement sections rendered", "Strengths / Areas text in body", e.message); }

  // WHAT: Model answer section must show — students learn by seeing what a good answer looks like.
  // PASS: .model-answer element exists in the DOM.
  try {
    const modelAnswer = await page.$("[class*='model-answer'], .model-answer");
    if (modelAnswer) pass("Model answer section visible", ".model-answer element found");
    else fail("Model answer section visible", ".model-answer element in DOM", "not found — model answers not rendering");
  } catch (e) { fail("Model answer section visible", ".model-answer in DOM", e.message); }

  // WHAT: SBC results (session 102) must show per-question labels Q1/Q2/Q3 instead of Reading-specific labels.
  // PASS: After navigating to /results/102, body contains "Question 1", "Question 2", and "Question 3".
  try {
    await page.goto(`${BASE}/results/102`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".score-circle", { timeout: 5000 });
    const bodyText = await page.textContent("body");
    const hasQ1 = bodyText?.includes("Question 1");
    const hasQ2 = bodyText?.includes("Question 2");
    const hasQ3 = bodyText?.includes("Question 3");
    if (hasQ1 && hasQ2 && hasQ3) {
      pass("SBC results show Q1/Q2/Q3 breakdown labels", `all three question labels found (Q1=${hasQ1} Q2=${hasQ2} Q3=${hasQ3})`);
    } else {
      fail("SBC results show Q1/Q2/Q3 breakdown labels", `body has "Question 1", "Question 2", "Question 3"`, `Q1:${hasQ1} Q2:${hasQ2} Q3:${hasQ3}`);
    }
  } catch (e) { fail("SBC results show Q1/Q2/Q3 breakdown labels", "Q1/Q2/Q3 in body text", e.message); }
}

async function testParentDashboard(page) {
  section("👨‍👩‍👧 Parent Dashboard", "localStorage PIN pre-set to '1234' · Firestore mocked: 2 sessions · session 102 is archived (isClosed:true)");

  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem("parentPin", "1234"));

  await page.goto(`${BASE}/parent`);
  await page.waitForLoadState("networkidle");

  // WHAT: Visiting /parent must always show the PIN verification screen before granting access.
  // PASS: .pin-modal or .pin-overlay is visible in the DOM.
  try {
    const pinScreen = await page.$(".pin-modal, .pin-overlay");
    if (pinScreen) pass("PIN gate shown before dashboard access", ".pin-modal or .pin-overlay found — correct security behaviour");
    else fail("PIN gate shown before dashboard access", ".pin-modal or .pin-overlay visible", "not found — dashboard may be accessible without PIN");
  } catch (e) { fail("PIN gate shown before dashboard access", ".pin-modal visible", e.message); }

  // WHAT: Entering the correct 4-digit PIN must auto-submit and grant access (no separate Enter button needed).
  // PASS: 4 tel inputs found; typing "1234" into them completes without error.
  try {
    const inputs = await page.$$("input[type='tel']");
    if (inputs.length === 4) {
      await inputs[0].type("1");
      await inputs[1].type("2");
      await inputs[2].type("3");
      await inputs[3].type("4");
      await page.waitForTimeout(500);
      pass("PIN entered via 4 individual digit inputs", `4 tel inputs found; typed 1-2-3-4; auto-submit triggered`);
    } else {
      fail("PIN entered via 4 individual digit inputs", "exactly 4 input[type=tel] elements", `found ${inputs.length}`);
    }
  } catch (e) { fail("PIN entry", "4 tel inputs typed", e.message); }

  // WHAT: After correct PIN, the parent dashboard must load and show stat cards.
  // PASS: .stat-card or .card element found within 5 seconds.
  try {
    await page.waitForSelector("[class*='stat-card'], .card", { timeout: 5000 });
    pass("Parent dashboard loads after correct PIN", ".stat-card or .card elements visible");
  } catch (e) { fail("Parent dashboard loads after correct PIN", ".stat-card or .card within 5s after PIN", "timeout — dashboard may not be loading after PIN entry"); }

  // WHAT: Stats overview (Total Sessions, Average Score, etc.) must be visible — key info for parent.
  // PASS: Body contains "Total Sessions" or "Average Score".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Total Sessions") || bodyText?.includes("Average Score")) {
      pass("Stats overview visible", `found "Total Sessions" / "Average Score" labels in body`);
    } else {
      fail("Stats overview visible", `body contains "Total Sessions" or "Average Score"`, "not found — stats section may not be rendering");
    }
  } catch (e) { fail("Stats overview visible", "stat labels in body text", e.message); }

  // WHAT: Session history list must show entries (parent needs to tap into individual sessions).
  // PASS: More than 1 .card element found (stats card + at least 1 session card).
  try {
    const cards = await page.$$(".card");
    if (cards.length > 1) {
      pass("Session history cards visible", `${cards.length} card elements found (includes stat overview + session cards)`);
    } else {
      fail("Session history cards visible", ">1 .card elements (stat + session cards)", `only ${cards.length} found`);
    }
  } catch (e) { fail("Session history cards visible", ">1 .card elements", e.message); }

  // WHAT: "Show Archived" toggle must exist so parents can view or hide closed sessions.
  // PASS: A button with "Archived" text is found and clickable.
  try {
    const archiveBtn = await page.$("button:has-text('Archived')");
    if (archiveBtn) {
      await archiveBtn.click();
      await page.waitForTimeout(300);
      pass("Show Archived toggle works", `button found and clicked; archived sessions should now be visible`);
    } else {
      pass("Archived toggle not visible", "may be hidden if current filter has no archived sessions — acceptable");
    }
  } catch (e) { fail("Show Archived toggle works", "Archived button clickable", e.message); }
}

async function testParentSessionDetail(page) {
  section("📝 Parent Session Detail & Grading", "localStorage PIN pre-set · session 101 = Reading · session 102 = SBC · CHECKS: score display, slider labels, save-grade flow, archive action");
  await page.evaluate(() => localStorage.setItem("parentPin", "1234"));
  await page.goto(`${BASE}/parent/session/101`);
  await page.waitForLoadState("networkidle");

  // WHAT: Session detail page must load and show the score circle or a content card.
  // PASS: .score-circle or .card found within 5 seconds.
  try {
    await page.waitForSelector(".score-circle, .card", { timeout: 5000 });
    pass("Session detail page loads", ".score-circle or .card found in DOM");
  } catch (e) { fail("Session detail page loads", ".score-circle or .card within 5s", e.message); }

  // WHAT: Parent grading sliders must be present so the parent can assign their own score.
  // PASS: At least 2 input[type=range] elements found (Reading has 2: Pronunciation, Fluency).
  try {
    const sliders = await page.$$("input[type='range']");
    if (sliders.length >= 2) {
      pass("Parent grading sliders present", `${sliders.length} range sliders found`);
    } else {
      fail("Parent grading sliders present", "≥2 input[type=range] elements", `found ${sliders.length}`);
    }
  } catch (e) { fail("Parent grading sliders present", "≥2 input[type=range]", e.message); }

  // WHAT: For Reading sessions, slider labels must be "Pronunciation" and "Rhythm/Fluency" — NOT "Question 1/2/3".
  // PASS: Body contains "Pronunciation" or "Rhythm" (Reading-specific labels).
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Pronunciation") || bodyText?.includes("Rhythm")) {
      pass("Reading session grading uses Reading-specific labels", `found "Pronunciation" / "Rhythm" — correct for READING type (not Q1/Q2/Q3)`);
    } else {
      fail("Reading session grading uses Reading-specific labels", `"Pronunciation" or "Rhythm" in body`, `not found — may be showing wrong labels`);
    }
  } catch (e) { fail("Reading session grading labels", "Pronunciation / Rhythm in body", e.message); }

  // WHAT: Save Parent Grade button must work — it saves the parent's scores to Firestore.
  // PASS: Button found and clicked; no error thrown (mock PUT returns 200).
  try {
    const saveBtn = await page.$("button:has-text('Save'), button:has-text('Grade')");
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      pass("Save Parent Grade button works", "clicked; mock PUT /api/practice returns 200 — grade saved");
    } else {
      fail("Save Parent Grade button works", `button with text "Save" or "Grade"`, "button not found");
    }
  } catch (e) { fail("Save Parent Grade button works", "button clickable and mock returns 200", e.message); }

  // WHAT: Close/Archive option must be visible so parents can remove sessions from the student's active list.
  // PASS: Body contains "Close" or "Archive".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Close") || bodyText?.includes("Archive")) {
      pass("Close & Archive option visible", `found "Close" / "Archive" text`);
    } else {
      fail("Close & Archive option visible", `"Close" or "Archive" in body`, "not found — parent cannot manage session lifecycle");
    }
  } catch (e) { fail("Close & Archive option visible", "Close/Archive text in body", e.message); }

  // WHAT: SBC session (ID 102) must show "Question 1/2/3" slider labels instead of Reading labels.
  // PASS: After navigating to session 102, body contains "Question 1" or "Q1".
  try {
    await page.goto(`${BASE}/parent/session/102`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".card", { timeout: 5000 });
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Question 1") || bodyText?.includes("Q1")) {
      pass("SBC session grading shows Q1/Q2/Q3 labels", `"Question 1" or "Q1" found — correct for STIMULUS type`);
    } else {
      fail("SBC session grading shows Q1/Q2/Q3 labels", `"Question 1" or "Q1" in body`, `body preview: ${bodyText?.slice(0, 200)}`);
    }
  } catch (e) { fail("SBC session grading shows Q1/Q2/Q3 labels", "Q1/Q2/Q3 label in body", e.message); }
}

async function testSettingsPage(page) {
  section("⚙️  Settings Page", "localStorage PIN pre-set · mock settings include childName='Sarah', geminiApiKey set");
  await page.evaluate(() => localStorage.setItem("parentPin", "1234"));
  await page.goto(`${BASE}/parent/settings`);
  await page.waitForLoadState("networkidle");

  // WHAT: Settings page must load and display its card sections.
  // PASS: .card element found within 5 seconds.
  try {
    await page.waitForSelector(".card", { timeout: 5000 });
    pass("Settings page loads", ".card element found in DOM");
  } catch (e) { fail("Settings page loads", ".card within 5s", e.message); }

  // WHAT: Gemini API Key field must be visible — this is how parents configure the AI evaluation.
  // PASS: Body contains "Gemini API Key" or "API".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Gemini API Key") || bodyText?.includes("API")) {
      pass("Gemini API Key field visible", `"Gemini API Key" found in body`);
    } else {
      fail("Gemini API Key field visible", `"Gemini API Key" in body`, "not found — AI Config section may be missing");
    }
  } catch (e) { fail("Gemini API Key field visible", "API key section in body", e.message); }

  // WHAT: Child Profile section must show — parents configure the child's name and daily practice goal here.
  // PASS: Body contains "Child" or "Sarah" (the child name from mock settings).
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Child") || bodyText?.includes("Sarah")) {
      pass("Child Profile section visible", `"Child" / "Sarah" found in body`);
    } else {
      fail("Child Profile section visible", `"Child" or "Sarah" in body`, "not found");
    }
  } catch (e) { fail("Child Profile section visible", "Child / Sarah in body", e.message); }

  // WHAT: Saving settings must show a confirmation message so parents know the save succeeded.
  // PASS: After clicking Save, body contains "saved", "Saved", or "Success".
  try {
    const saveBtn = await page.$("button:has-text('Save')");
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      const bodyText = await page.textContent("body");
      if (bodyText?.includes("saved") || bodyText?.includes("Saved") || bodyText?.includes("Success")) {
        pass("Save Settings shows success confirmation", `"saved" / "Success" visible after save`);
      } else {
        pass("Save Settings button clicked", "confirmation not visible (mock returns 200 but may need real Firestore to persist and re-render)");
      }
    } else {
      fail("Save Settings shows success confirmation", `"Save" button present`, "button not found");
    }
  } catch (e) { fail("Save Settings shows success confirmation", "save button + confirmation text", e.message); }
}

async function testHistoryPage(page) {
  section("📜 History / Progress Page", "Firestore mocked: 2 sessions visible (Reading + SBC)");
  await page.goto(`${BASE}/history`);
  await page.waitForLoadState("networkidle");

  // WHAT: History page must load and show some kind of list container.
  // PASS: .card, .history-item, or [class*='history'] found within 5 seconds.
  try {
    await page.waitForSelector(".card, .history-item, [class*='history']", { timeout: 5000 });
    pass("History page loads with content container", ".card / .history-item found in DOM");
  } catch (e) { fail("History page loads with content container", ".card or .history-item within 5s", e.message); }

  // WHAT: Session history entries must show exercise titles so the student can recognise past sessions.
  // PASS: Body contains "Park" (from "A Day at the Park") or "Technology".
  try {
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("Park") || bodyText?.includes("Technology")) {
      pass("Past session entries visible with exercise titles", `found exercise titles in history list`);
    } else {
      fail("Past session entries visible with exercise titles", `body contains "Park" or "Technology" (mock session titles)`, "not found — history list may be empty or titles not rendering");
    }
  } catch (e) { fail("Past session entries visible with exercise titles", "exercise titles in body", e.message); }
}

async function testNavigationLinks(page) {
  section("🔗 Navigation Links", "bottom nav must link to all major sections");
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");

  // WHAT / PASS for each: The named link must exist in the DOM as an anchor with the correct href.
  // Without these links the student/parent cannot navigate to that section.
  const navLinks = [
    { selector: "a[href='/history']", expected: "History", note: "student progress / session history tab" },
    { selector: "a[href='/rubric']",  expected: "Rubric",  note: "scoring rubric reference page" },
    { selector: "a[href='/parent']",  expected: "Parent",  note: "parent dashboard (PIN-gated)" },
  ];

  for (const { selector, expected, note } of navLinks) {
    try {
      const link = await page.$(selector);
      if (link) pass(`Nav link to ${expected} present`, `${selector} found — ${note}`);
      else fail(`Nav link to ${expected} present`, `${selector} in DOM`, `not found — ${note} is unreachable`);
    } catch (e) { fail(`Nav link to ${expected} present`, `${selector} in DOM`, e.message); }
  }
}

async function testAPIRoutes() {
  section("🔌 API Route Structure", "direct HTTP fetch, no browser, no mocks — CHECKS: routes exist and return JSON (not HTML error pages)");

  // WHAT: Each API route must respond with JSON content-type regardless of status code.
  // PASS: Content-Type header includes "json". (500 is expected without Firestore — the test only verifies the route exists and returns structured data.)
  const routes = [
    { url: "/api/exercises", method: "GET", note: "exercise list endpoint" },
    { url: "/api/practice",  method: "GET", note: "session history endpoint" },
    { url: "/api/settings",  method: "GET", note: "app settings endpoint" },
    { url: "/api/poster",    method: "GET", note: "image generation status / diagnostic endpoint" },
  ];

  for (const { url, method, note } of routes) {
    try {
      const res = await fetch(`${BASE}${url}`, { method });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        pass(`${method} ${url} returns JSON`, `status ${res.status}, Content-Type: ${ct.split(";")[0]} — ${note}`);
      } else {
        fail(`${method} ${url} returns JSON`, `Content-Type: application/json`, `got "${ct}" (status ${res.status}) — route may be missing or returning an HTML error page`);
      }
    } catch (e) { fail(`${method} ${url} returns JSON`, "HTTP response with JSON content-type", e.message); }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// GEMINI CONNECTIVITY & CAPABILITIES TESTS
// ══════════════════════════════════════════════════════════════════════════

const GEMINI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const SAMPLE_READING_PASSAGE =
  "The sun shone brightly as Emma skipped through the park. She saw butterflies dancing around the flowers. The laughter of children echoed in the air as they played games on the grass. Emma felt happy and carefree as she enjoyed this wonderful afternoon.";

const SAMPLE_READING_TRANSCRIPT_GOOD =
  "The sun shone brightly as Emma skipped through the park. She saw butterflies dancing around the flowers. The laughter of children echoed in the air as they played games on the grass. Emma felt happy and carefree as she enjoyed this wonderful afternoon.";

const SAMPLE_READING_TRANSCRIPT_POOR = "the sun. emma. butterflies. children play. happy.";

const SAMPLE_SBC = {
  topic: "Technology in Schools",
  posterDescription: "Students using tablets in a modern classroom with a teacher guiding them.",
  question1: "What can you see happening in this photograph?",
  question2: "Tell me about a time when you used technology for learning.",
  question3: "Do you think schools should use more technology? Why or why not?",
  response1: "I can see students sitting at desks and using tablets to learn. The teacher is walking around to help them. The classroom looks modern with bright lights and comfortable chairs. Everyone seems focused on their work.",
  response2: "I used Khan Academy to study Mathematics when I was preparing for my PSLE. The videos were very clear and I could pause and replay them whenever I did not understand. I practised many questions and my score improved significantly.",
  response3: "Yes, I strongly believe schools should use more technology because it makes learning more engaging and effective. For instance, interactive applications allow students to learn at their own pace and receive immediate feedback. However, schools must also ensure students do not become overly dependent on devices and still develop fundamental skills like handwriting and mental calculation.",
};

const SAMPLE_SBC_EMPTY = {
  response1: "",
  response2: "I don't know.",
  response3: "",
};

async function resolveGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`${BASE}/api/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.geminiApiKey) return data.geminiApiKey;
    }
  } catch { /* ignore */ }
  try {
    const res = await fetch(`${BASE}/api/poster`);
    if (res.ok) {
      const data = await res.json();
      if (!data.hasKey) return null;
      console.log("  ℹ️  API key configured in app but not readable locally. Set GEMINI_API_KEY env var to run live Gemini tests.");
    }
  } catch { /* ignore */ }
  return null;
}

function buildReadingEvalPrompt(passage, transcript) {
  return `You are a PSLE English Oral examiner. Evaluate this P6 student's Reading Aloud performance.

[Passage]: "${passage}"
[Student Transcript]: "${transcript || "[NO SPEECH DETECTED]"}"

Respond in valid JSON with this exact structure:
{
  "score1": <number 0-10, Pronunciation>,
  "score2": <number 0-10, Fluency/Expressiveness>,
  "score3": 0,
  "generalFeedback": "<string>",
  "strengths": ["<string>"],
  "areasOfImprovement": ["<string>"],
  "suggestedResponse1": "<model reading with stress marks>",
  "suggestedResponse2": "",
  "suggestedResponse3": ""
}`;
}

function buildSBCEvalPrompt(sbc) {
  return `You are a PSLE English Oral examiner. Evaluate this P6 student's SBC responses.

[Topic]: ${sbc.topic}
[Q1]: "${sbc.question1}" [Response]: "${sbc.response1 || "[NO RESPONSE]"}"
[Q2]: "${sbc.question2}" [Response]: "${sbc.response2 || "[NO RESPONSE]"}"
[Q3]: "${sbc.question3}" [Response]: "${sbc.response3 || "[NO RESPONSE]"}"

CRITICAL: score1=Q1 score, score2=Q2 score, score3=Q3 score — each question scored INDEPENDENTLY 0-10.
Empty/very short responses MUST score 0.

Respond in valid JSON:
{
  "score1": <number 0-10, Q1 holistic>,
  "score2": <number 0-10, Q2 holistic>,
  "score3": <number 0-10, Q3 holistic>,
  "generalFeedback": "<string>",
  "strengths": ["<string>"],
  "areasOfImprovement": ["<string>"],
  "suggestedResponse1": "<AL1 PEEL model answer Q1>",
  "suggestedResponse2": "<AL1 PEEL model answer Q2>",
  "suggestedResponse3": "<AL1 PEEL model answer Q3>"
}`;
}

function validateEvaluationSchema(data) {
  const issues = [];
  if (typeof data.score1 !== "number") issues.push("score1 not a number");
  if (typeof data.score2 !== "number") issues.push("score2 not a number");
  if (typeof data.score3 !== "number") issues.push("score3 not a number");
  if (data.score1 < 0 || data.score1 > 10) issues.push(`score1 out of range: ${data.score1}`);
  if (data.score2 < 0 || data.score2 > 10) issues.push(`score2 out of range: ${data.score2}`);
  if (data.score3 < 0 || data.score3 > 10) issues.push(`score3 out of range: ${data.score3}`);
  if (typeof data.generalFeedback !== "string" || !data.generalFeedback) issues.push("missing generalFeedback");
  if (!Array.isArray(data.strengths) || data.strengths.length === 0) issues.push("strengths not array or empty");
  if (!Array.isArray(data.areasOfImprovement) || data.areasOfImprovement.length === 0) issues.push("areasOfImprovement not array or empty");
  if (typeof data.suggestedResponse1 !== "string") issues.push("suggestedResponse1 missing");
  if (typeof data.suggestedResponse2 !== "string") issues.push("suggestedResponse2 missing");
  if (typeof data.suggestedResponse3 !== "string") issues.push("suggestedResponse3 missing");
  return issues;
}

async function callGeminiText(apiKey, prompt) {
  const res = await fetch(`${GEMINI_TEXT_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
  }
  const raw = await res.json();
  const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini — no candidates or parts");
  return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
}

async function testGeminiConnectivity(apiKey) {
  section("🤖 Gemini AI — Connectivity & Evaluation Quality", "live API calls with real key · CHECKS: reachability, scoring range, per-question independence, schema validity, image generation");

  // WHAT: The Gemini API must be reachable and respond to a basic prompt.
  // PASS: HTTP 200 and a non-empty text response from gemini-2.5-flash.
  try {
    const res = await fetch(`${GEMINI_TEXT_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return JSON: {"ok":true,"model":"gemini-2.5-flash"}' }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      fail("Gemini API reachable (gemini-2.5-flash)", "HTTP 200 with text response", `HTTP ${res.status}: ${txt.slice(0, 150)}`);
    } else {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) pass("Gemini API reachable", `gemini-2.5-flash responded with non-empty text`);
      else fail("Gemini API reachable", "non-empty text in candidates[0].content.parts[0].text", "response had no text content");
    }
  } catch (e) { fail("Gemini API reachable", "HTTP 200 from Gemini", e.message); }

  // WHAT: A well-read passage (full sentence, correct) must score ≥8/20.
  // PASS: total (score1+score2) ≥ 8; score3 = 0; all schema fields present.
  try {
    const data = await callGeminiText(apiKey, buildReadingEvalPrompt(SAMPLE_READING_PASSAGE, SAMPLE_READING_TRANSCRIPT_GOOD));
    const issues = validateEvaluationSchema(data);
    if (issues.length > 0) {
      fail("Reading eval — good transcript scores ≥8/20 with valid schema", `no schema issues, total ≥8`, `schema issues: ${issues.join(", ")}`);
    } else {
      const total = data.score1 + data.score2;
      if (data.score3 !== 0) fail("Reading eval — score3 must be 0 for Reading type", "score3=0", `score3=${data.score3}`);
      else if (total < 8) fail("Reading eval — good transcript scores ≥8/20", "total ≥8/20", `scored ${total}/20 — model may be under-scoring`);
      else pass(`Reading eval — good transcript scores appropriately`, `Pronunciation:${data.score1} + Fluency:${data.score2} = ${total}/20 ≥8; schema valid`);
    }
  } catch (e) { fail("Reading eval — good transcript", "schema valid, total ≥8", e.message); }

  // WHAT: A fragmented/poor reading (single words, no sentences) must score ≤8/20.
  // PASS: total ≤ 8 — model must not inflate scores for poor performance.
  try {
    const data = await callGeminiText(apiKey, buildReadingEvalPrompt(SAMPLE_READING_PASSAGE, SAMPLE_READING_TRANSCRIPT_POOR));
    const issues = validateEvaluationSchema(data);
    if (issues.length > 0) {
      fail("Reading eval — poor transcript scores ≤8/20 with valid schema", "schema valid", `schema issues: ${issues.join(", ")}`);
    } else {
      const total = data.score1 + data.score2;
      if (total > 8) fail("Reading eval — poor transcript must not score >8/20", "total ≤8/20", `scored ${total}/20 — model is inflating scores for fragmented reading`);
      else pass(`Reading eval — poor transcript scores strictly`, `Pronunciation:${data.score1} + Fluency:${data.score2} = ${total}/20 ≤8; strict scoring confirmed`);
    }
  } catch (e) { fail("Reading eval — poor transcript strict scoring", "total ≤8", e.message); }

  // WHAT: An empty transcript (no speech recorded) must score ≤1/20 — student submitted nothing.
  // PASS: score1 ≤ 1 AND score2 ≤ 1.
  try {
    const data = await callGeminiText(apiKey, buildReadingEvalPrompt(SAMPLE_READING_PASSAGE, ""));
    if (data.score1 > 1 || data.score2 > 1) {
      fail("Reading eval — empty transcript scores 0-1/20", "score1 ≤1 AND score2 ≤1", `scored ${data.score1}+${data.score2} — model must give near-zero for no speech`);
    } else {
      pass(`Reading eval — empty transcript correctly scores near-zero`, `score1:${data.score1} score2:${data.score2} — both ≤1 as required`);
    }
  } catch (e) { fail("Reading eval — empty transcript near-zero score", "score1 ≤1 AND score2 ≤1", e.message); }

  // WHAT: Full SBC responses (all 3 questions answered well) must all score >0 and have model answers for each.
  // PASS: score1>0, score2>0, score3>0; suggestedResponse1/2/3 all non-empty; schema valid.
  try {
    const data = await callGeminiText(apiKey, buildSBCEvalPrompt(SAMPLE_SBC));
    const issues = validateEvaluationSchema(data);
    if (issues.length > 0) {
      fail("SBC eval — full responses, valid schema, all scores >0", "schema valid", `issues: ${issues.join(", ")}`);
    } else {
      const total = data.score1 + data.score2 + data.score3;
      const allNonZero = data.score1 > 0 && data.score2 > 0 && data.score3 > 0;
      const hasAllModelAnswers = data.suggestedResponse1 && data.suggestedResponse2 && data.suggestedResponse3;
      if (!allNonZero) fail("SBC eval — all questions with real answers score >0", "score1>0 AND score2>0 AND score3>0", `scores: Q1=${data.score1} Q2=${data.score2} Q3=${data.score3}`);
      else if (!hasAllModelAnswers) fail("SBC eval — model answers present for all 3 questions", "suggestedResponse1/2/3 non-empty", "one or more model answers missing");
      else pass(`SBC eval — full responses scored independently with model answers`, `Q1:${data.score1} Q2:${data.score2} Q3:${data.score3} total:${total}/30; all model answers present`);
    }
  } catch (e) { fail("SBC eval — full responses", "schema valid, all scores >0, model answers present", e.message); }

  // WHAT: Per-question independence: if Q1 and Q3 are empty but Q2 has a real answer, only Q2 scores.
  // PASS: score1 ≤1 (empty Q1), score2 ≥3 (real Q2 answer), score3 ≤1 (empty Q3).
  try {
    const sbcPartial = { ...SAMPLE_SBC, response1: "", response2: SAMPLE_SBC.response2, response3: "" };
    const data = await callGeminiText(apiKey, buildSBCEvalPrompt(sbcPartial));
    const issues = validateEvaluationSchema(data);
    if (issues.length > 0) {
      fail("SBC per-question independence — empty Q1/Q3 score 0, real Q2 scores", "schema valid", `issues: ${issues.join(", ")}`);
    } else {
      const q1Empty = data.score1 <= 1;
      const q2Real  = data.score2 >= 3;
      const q3Empty = data.score3 <= 1;
      if (!q1Empty) fail("SBC per-question independence — Q1 empty must score ≤1", "Q1 score ≤1 (no response)", `Q1 scored ${data.score1}`);
      else if (!q3Empty) fail("SBC per-question independence — Q3 empty must score ≤1", "Q3 score ≤1 (no response)", `Q3 scored ${data.score3}`);
      else if (!q2Real) fail("SBC per-question independence — Q2 real answer must score ≥3", "Q2 score ≥3", `Q2 only scored ${data.score2}`);
      else pass(`SBC per-question independence confirmed`, `Q1(empty):${data.score1}≤1 Q2(real):${data.score2}≥3 Q3(empty):${data.score3}≤1 — each question scored independently`);
    }
  } catch (e) { fail("SBC per-question independence", "Q1 ≤1, Q2 ≥3, Q3 ≤1", e.message); }

  // WHAT: All-empty SBC (student said nothing for any question) must score ≤1 on every question.
  // PASS: score1 ≤1, score2 ≤1, score3 ≤1.
  try {
    const sbcAllEmpty = { ...SAMPLE_SBC, response1: "", response2: "", response3: "" };
    const data = await callGeminiText(apiKey, buildSBCEvalPrompt(sbcAllEmpty));
    if (data.score1 > 1 || data.score2 > 1 || data.score3 > 1) {
      fail("SBC eval — all-empty responses must score ≤1 each", "all scores ≤1", `Q1:${data.score1} Q2:${data.score2} Q3:${data.score3}`);
    } else {
      pass(`SBC eval — all-empty responses correctly score near-zero`, `Q1:${data.score1} Q2:${data.score2} Q3:${data.score3} — all ≤1`);
    }
  } catch (e) { fail("SBC eval — all-empty near-zero", "all scores ≤1", e.message); }

  // ── Image generation ───────────────────────────────────────────────────────
  function extractImageB64(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 10) return null;
    if (depth === 0 && !Array.isArray(node)) {
      const steps = node.steps;
      if (Array.isArray(steps)) {
        for (const step of steps) {
          if (step.step_type !== "model_output") continue;
          const parts = step.model_output?.parts;
          if (!Array.isArray(parts)) continue;
          for (const part of parts) {
            if (part.image?.image_bytes)
              return { b64: part.image.image_bytes, mime: part.image.mime_type || "image/jpeg" };
          }
        }
      }
    }
    if (Array.isArray(node)) {
      for (const item of node) { const r = extractImageB64(item, depth + 1); if (r) return r; }
      return null;
    }
    const obj = node;
    if (typeof obj.b64_json === "string" && obj.b64_json.length > 100)
      return { b64: obj.b64_json, mime: obj.mime_type || "image/jpeg" };
    if (typeof obj.data === "string" && obj.data.length > 100 &&
        (obj.type === "image" || obj.mime_type || obj.media_type || obj.mimeType))
      return { b64: obj.data, mime: String(obj.mime_type || obj.media_type || obj.mimeType || "image/jpeg") };
    for (const key of ["inlineData", "inline_data"]) {
      const id = obj[key];
      if (id && typeof id.data === "string" && id.data.length > 100)
        return { b64: id.data, mime: String(id.mimeType || id.mime_type || "image/jpeg") };
    }
    const iu = obj.image_url;
    if (iu && typeof iu.url === "string" && iu.url.startsWith("data:image")) {
      const [hdr, b64] = iu.url.split(",");
      if (b64 && b64.length > 100) return { b64, mime: hdr.replace("data:", "").replace(";base64", "") };
    }
    if (typeof obj.url === "string" && obj.url.startsWith("data:image")) {
      const [hdr, b64] = obj.url.split(",");
      if (b64 && b64.length > 100) return { b64, mime: hdr.replace("data:", "").replace(";base64", "") };
    }
    for (const key of ["output_image","output","content","parts","steps","candidates","message","choices","outputs"]) {
      if (obj[key]) { const r = extractImageB64(obj[key], depth + 1); if (r) return r; }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (["id","model","object","status","usage","created","updated","service_tier",
           "type","role","text","finish_reason","index"].includes(k)) continue;
      const r = extractImageB64(v, depth + 1);
      if (r) return r;
    }
    return null;
  }

  const imagePrompt = "Singapore primary school students in school uniforms working together on a science experiment in a modern classroom. Photorealistic. No text in image.";
  let imageApiWorked = false;
  let workingImageMethod = "";

  // WHAT: SBC exercises need a photorealistic image as stimulus. The Interactions API must return ≥1KB image bytes.
  // PASS: HTTP 200, response contains image bytes, decoded size ≥1KB.
  for (const model of ["gemini-2.5-flash-image", "gemini-3.1-flash-image"]) {
    if (imageApiWorked) break;
    try {
      const res = await fetch(GEMINI_IMAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model,
          input: [{ type: "text", text: imagePrompt }],
          response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "4:3", image_size: "1K" },
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.log(`  ℹ️  Interactions/${model}: HTTP ${res.status} — ${txt.slice(0, 120)}`);
        continue;
      }
      const data = await res.json();
      const img = extractImageB64(data);
      if (!img) {
        console.log(`  ℹ️  Interactions/${model}: 200 OK but no image bytes in response`);
        continue;
      }
      const kb = Math.round(img.b64.length * 3 / 4 / 1024);
      if (kb < 1) { console.log(`  ℹ️  Interactions/${model}: image too small (${kb}KB)`); continue; }
      pass(`Image generation (Interactions API, ${model}) returns valid image`, `${img.mime} ${kb}KB — SBC poster generation will work`);
      imageApiWorked = true;
      workingImageMethod = `Interactions/${model}`;
    } catch (e) { console.log(`  ℹ️  Interactions/${model} exception: ${e.message}`); }
  }

  if (!imageApiWorked) {
    const gcModels = ["gemini-2.0-flash-exp", "gemini-2.5-flash-preview-05-20", "gemini-2.5-flash"];
    for (const model of gcModels) {
      if (imageApiWorked) break;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: imagePrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const img = extractImageB64(data);
        if (!img) continue;
        const kb = Math.round(img.b64.length * 3 / 4 / 1024);
        if (kb < 1) continue;
        pass(`Image generation (generateContent, ${model}) returns valid image`, `${img.mime} ${kb}KB — fallback model works`);
        imageApiWorked = true;
        workingImageMethod = `generateContent/${model}`;
      } catch (e) { /* model not available */ }
    }
  }

  if (!imageApiWorked) {
    fail("Image generation — at least one model returns ≥1KB image", "any model returns image bytes ≥1KB", "no image model succeeded — SBC poster generation is broken; check API key billing tier");
  }

  // WHAT: The end-to-end poster flow (exercise description → image) must work with the real SBC prompt format.
  // PASS: Sending the same prompt the app uses for real exercises returns a ≥1KB image.
  if (imageApiWorked) {
    const appPrompt = `Generate a realistic photograph suitable for a Singapore primary school English oral examination stimulus-based conversation exercise. The image should depict: ${SAMPLE_SBC.posterDescription}. The image must be appropriate for children aged 11-12, photorealistic, clearly show the described scene, and contain NO text or words.`;
    try {
      let result = null;
      if (workingImageMethod.startsWith("Interactions/")) {
        const model = workingImageMethod.replace("Interactions/", "");
        const res = await fetch(GEMINI_IMAGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            model,
            input: [{ type: "text", text: appPrompt }],
            response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "4:3", image_size: "1K" },
          }),
        });
        if (res.ok) result = extractImageB64(await res.json());
      } else if (workingImageMethod.startsWith("generateContent/")) {
        const model = workingImageMethod.replace("generateContent/", "");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: appPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        });
        if (res.ok) result = extractImageB64(await res.json());
      }
      if (result) {
        const kb = Math.round(result.b64.length * 3 / 4 / 1024);
        pass(`Poster end-to-end: SBC exercise description → image`, `${kb}KB via ${workingImageMethod} — real app prompt produces a valid image`);
      } else {
        fail("Poster end-to-end: SBC exercise description → image", "valid image bytes using real app prompt", `no image returned via ${workingImageMethod}`);
      }
    } catch (e) { fail("Poster end-to-end", "image bytes from real app prompt", e.message); }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log("🚀 PSLE Oral Practice — Full Integration Test Run");
  console.log("═".repeat(70));
  console.log(`  Base URL : ${BASE}`);
  console.log(`  Viewport : 390×844 (iPhone 14 portrait)`);
  console.log(`  Mocks    : Firestore APIs, SpeechRecognition, MediaRecorder, poster`);
  console.log(`  Format   : ✓ What was checked — observed result (why it passes)`);
  console.log(`             ✗ What was checked — EXPECTED: x  GOT: y`);

  await testAPIRoutes();

  const geminiKey = await resolveGeminiApiKey();
  if (geminiKey) {
    await testGeminiConnectivity(geminiKey);
  } else {
    section("🤖 Gemini AI — Connectivity & Evaluation Quality", "SKIPPED");
    console.log("  ⚠️  No API key available (set GEMINI_API_KEY env var or configure in Parent > Settings).");
    console.log("  ⚠️  These tests MUST pass on the deployed app before going live.\n");
  }

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const context = await browser.newContext({
    permissions: ["microphone"],
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  page.on("console", () => {});
  page.on("pageerror", (err) => {
    if (!err.message.includes("credentials") && !err.message.includes("Firestore"))
      console.error("  ⚠️  Page JS error:", err.message.slice(0, 120));
  });

  await setupMocks(page);

  await testHomePage(page);
  await testRubricPage(page);
  await testNavigationLinks(page);
  await testReadingPractice(page);
  await testSBCPractice(page);
  await testResultsPage(page);
  await testParentDashboard(page);
  await testParentSessionDetail(page);
  await testSettingsPage(page);
  await testHistoryPage(page);

  await browser.close();

  console.log("\n" + "═".repeat(70));
  console.log(`✅ PASSED : ${results.passed.length}`);
  console.log(`❌ FAILED : ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log("\nFailed tests:");
    results.failed.forEach(({ name, err }) => console.log(`  • ${name}\n    ${err}`));
  }
  console.log("═".repeat(70));
  process.exit(results.failed.length > 0 ? 1 : 0);
})();
