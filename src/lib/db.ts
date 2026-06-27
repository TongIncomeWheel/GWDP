import Database from "better-sqlite3";
import path from "path";
import type { OralExercise, PracticeHistory, AppSettings } from "./types";
import { getSeedExercises } from "./seed-data";

const DB_PATH = process.env.DB_PATH || (
  process.env.NODE_ENV === "production"
    ? "/tmp/oral_practice.db"
    : path.join(process.cwd(), "oral_practice.db")
);

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT '',
        preambleText TEXT NOT NULL DEFAULT '',
        passageText TEXT NOT NULL DEFAULT '',
        posterImageResName TEXT NOT NULL DEFAULT '',
        posterDescription TEXT NOT NULL DEFAULT '',
        question1 TEXT NOT NULL DEFAULT '',
        question2 TEXT NOT NULL DEFAULT '',
        question3 TEXT NOT NULL DEFAULT '',
        isDaily INTEGER NOT NULL DEFAULT 0,
        preamblePact TEXT DEFAULT '',
        readingTips TEXT DEFAULT '',
        photographDescription TEXT DEFAULT '',
        imageSearchSuggestion TEXT DEFAULT '',
        sbcQ1Type TEXT DEFAULT '',
        sbcQ2Type TEXT DEFAULT '',
        sbcQ3Type TEXT DEFAULT '',
        generatedImageUrl TEXT
      );

      CREATE TABLE IF NOT EXISTS practice_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exerciseId INTEGER NOT NULL,
        exerciseTitle TEXT NOT NULL DEFAULT '',
        exerciseType TEXT NOT NULL DEFAULT 'READING',
        exerciseTopic TEXT NOT NULL DEFAULT '',
        dateMillis INTEGER NOT NULL DEFAULT 0,
        audioPath1 TEXT,
        audioPath2 TEXT,
        audioPath3 TEXT,
        transcript1 TEXT,
        transcript2 TEXT,
        transcript3 TEXT,
        score1 INTEGER NOT NULL DEFAULT 0,
        score2 INTEGER NOT NULL DEFAULT 0,
        score3 INTEGER NOT NULL DEFAULT 0,
        totalScore INTEGER NOT NULL DEFAULT 0,
        maxScore INTEGER NOT NULL DEFAULT 0,
        generalFeedback TEXT,
        strengths TEXT,
        areasOfImprovement TEXT,
        modelAnswer1 TEXT,
        modelAnswer2 TEXT,
        modelAnswer3 TEXT,
        isEvaluated INTEGER NOT NULL DEFAULT 0,
        isEvaluating INTEGER NOT NULL DEFAULT 0,
        errorMessage TEXT,
        parentScore1 INTEGER,
        parentScore2 INTEGER,
        parentScore3 INTEGER,
        parentFeedback TEXT,
        parentTotalScore INTEGER,
        audioBlob1 TEXT,
        audioBlob2 TEXT,
        audioBlob3 TEXT,
        structuredTranscript1 TEXT,
        structuredTranscript2 TEXT,
        structuredTranscript3 TEXT,
        isClosed INTEGER DEFAULT 0,
        FOREIGN KEY (exerciseId) REFERENCES exercises(id)
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      );
    `);

    // Add new exercise columns (for existing databases)
    const exerciseColumnsToAdd = [
      { name: "preamblePact", def: "TEXT DEFAULT ''" },
      { name: "readingTips", def: "TEXT DEFAULT ''" },
      { name: "photographDescription", def: "TEXT DEFAULT ''" },
      { name: "imageSearchSuggestion", def: "TEXT DEFAULT ''" },
      { name: "sbcQ1Type", def: "TEXT DEFAULT ''" },
      { name: "sbcQ2Type", def: "TEXT DEFAULT ''" },
      { name: "sbcQ3Type", def: "TEXT DEFAULT ''" },
      { name: "generatedImageUrl", def: "TEXT" },
    ];
    for (const col of exerciseColumnsToAdd) {
      try {
        _db.exec(`ALTER TABLE exercises ADD COLUMN ${col.name} ${col.def}`);
      } catch {
        // Column already exists, ignore
      }
    }

    // Add new practice_history columns (for existing databases)
    const historyColumnsToAdd = [
      { name: "parentScore1", def: "INTEGER" },
      { name: "parentScore2", def: "INTEGER" },
      { name: "parentScore3", def: "INTEGER" },
      { name: "parentFeedback", def: "TEXT" },
      { name: "parentTotalScore", def: "INTEGER" },
      { name: "audioBlob1", def: "TEXT" },
      { name: "audioBlob2", def: "TEXT" },
      { name: "audioBlob3", def: "TEXT" },
      { name: "structuredTranscript1", def: "TEXT" },
      { name: "structuredTranscript2", def: "TEXT" },
      { name: "structuredTranscript3", def: "TEXT" },
      { name: "isClosed", def: "INTEGER DEFAULT 0" },
    ];
    for (const col of historyColumnsToAdd) {
      try {
        _db.exec(`ALTER TABLE practice_history ADD COLUMN ${col.name} ${col.def}`);
      } catch {
        // Column already exists, ignore
      }
    }
  }
  return _db;
}

export function getAllExercises(): OralExercise[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM exercises").all() as Array<Record<string, unknown>>;
  return rows.map(mapExerciseRow);
}

export function getExerciseById(id: number): OralExercise | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapExerciseRow(row) : undefined;
}

export function getExerciseCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM exercises").get() as { cnt: number };
  return row.cnt;
}

export function insertExercises(exercises: Omit<OralExercise, "id">[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO exercises (type, title, topic, difficulty, preambleText, passageText,
      posterImageResName, posterDescription, question1, question2, question3, isDaily,
      preamblePact, readingTips, photographDescription, imageSearchSuggestion,
      sbcQ1Type, sbcQ2Type, sbcQ3Type, generatedImageUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: Omit<OralExercise, "id">[]) => {
    for (const e of items) {
      stmt.run(
        e.type, e.title, e.topic, e.difficulty, e.preambleText, e.passageText,
        e.posterImageResName, e.posterDescription, e.question1, e.question2, e.question3,
        e.isDaily ? 1 : 0,
        e.preamblePact, e.readingTips, e.photographDescription, e.imageSearchSuggestion,
        e.sbcQ1Type, e.sbcQ2Type, e.sbcQ3Type, e.generatedImageUrl
      );
    }
  });
  tx(exercises);
}

export function getAllPracticeHistory(): PracticeHistory[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM practice_history ORDER BY dateMillis DESC").all() as Array<Record<string, unknown>>;
  return rows.map(mapHistoryRow);
}

export function getPracticeHistoryById(id: number): PracticeHistory | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM practice_history WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapHistoryRow(row) : undefined;
}

export function insertPracticeHistory(history: Omit<PracticeHistory, "id">): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO practice_history (exerciseId, exerciseTitle, exerciseType, exerciseTopic,
      dateMillis, audioPath1, audioPath2, audioPath3, transcript1, transcript2, transcript3,
      score1, score2, score3, totalScore, maxScore, generalFeedback, strengths,
      areasOfImprovement, modelAnswer1, modelAnswer2, modelAnswer3,
      isEvaluated, isEvaluating, errorMessage,
      parentScore1, parentScore2, parentScore3, parentFeedback, parentTotalScore,
      audioBlob1, audioBlob2, audioBlob3,
      structuredTranscript1, structuredTranscript2, structuredTranscript3, isClosed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    history.exerciseId, history.exerciseTitle, history.exerciseType, history.exerciseTopic,
    history.dateMillis, history.audioPath1, history.audioPath2, history.audioPath3,
    history.transcript1, history.transcript2, history.transcript3,
    history.score1, history.score2, history.score3, history.totalScore, history.maxScore,
    history.generalFeedback, history.strengths, history.areasOfImprovement,
    history.modelAnswer1, history.modelAnswer2, history.modelAnswer3,
    history.isEvaluated ? 1 : 0, history.isEvaluating ? 1 : 0, history.errorMessage,
    history.parentScore1 ?? null, history.parentScore2 ?? null, history.parentScore3 ?? null,
    history.parentFeedback ?? null, history.parentTotalScore ?? null,
    history.audioBlob1 ?? null, history.audioBlob2 ?? null, history.audioBlob3 ?? null,
    history.structuredTranscript1 ?? null, history.structuredTranscript2 ?? null,
    history.structuredTranscript3 ?? null,
    history.isClosed ? 1 : 0
  );
  return Number(result.lastInsertRowid);
}

export function updatePracticeHistory(history: PracticeHistory): void {
  const db = getDb();
  db.prepare(`
    UPDATE practice_history SET
      exerciseId=?, exerciseTitle=?, exerciseType=?, exerciseTopic=?,
      dateMillis=?, audioPath1=?, audioPath2=?, audioPath3=?,
      transcript1=?, transcript2=?, transcript3=?,
      score1=?, score2=?, score3=?, totalScore=?, maxScore=?,
      generalFeedback=?, strengths=?, areasOfImprovement=?,
      modelAnswer1=?, modelAnswer2=?, modelAnswer3=?,
      isEvaluated=?, isEvaluating=?, errorMessage=?,
      parentScore1=?, parentScore2=?, parentScore3=?,
      parentFeedback=?, parentTotalScore=?,
      audioBlob1=?, audioBlob2=?, audioBlob3=?,
      structuredTranscript1=?, structuredTranscript2=?, structuredTranscript3=?,
      isClosed=?
    WHERE id=?
  `).run(
    history.exerciseId, history.exerciseTitle, history.exerciseType, history.exerciseTopic,
    history.dateMillis, history.audioPath1, history.audioPath2, history.audioPath3,
    history.transcript1, history.transcript2, history.transcript3,
    history.score1, history.score2, history.score3, history.totalScore, history.maxScore,
    history.generalFeedback, history.strengths, history.areasOfImprovement,
    history.modelAnswer1, history.modelAnswer2, history.modelAnswer3,
    history.isEvaluated ? 1 : 0, history.isEvaluating ? 1 : 0, history.errorMessage,
    history.parentScore1 ?? null, history.parentScore2 ?? null, history.parentScore3 ?? null,
    history.parentFeedback ?? null, history.parentTotalScore ?? null,
    history.audioBlob1 ?? null, history.audioBlob2 ?? null, history.audioBlob3 ?? null,
    history.structuredTranscript1 ?? null, history.structuredTranscript2 ?? null,
    history.structuredTranscript3 ?? null,
    history.isClosed ? 1 : 0,
    history.id
  );
}

export function updateParentGrading(
  id: number,
  parentScore1: number,
  parentScore2: number,
  parentScore3: number,
  parentFeedback: string
): void {
  const db = getDb();
  const parentTotalScore = parentScore1 + parentScore2 + parentScore3;
  db.prepare(`
    UPDATE practice_history SET
      parentScore1=?, parentScore2=?, parentScore3=?,
      parentTotalScore=?, parentFeedback=?
    WHERE id=?
  `).run(parentScore1, parentScore2, parentScore3, parentTotalScore, parentFeedback, id);
}

export function closeExercise(id: number): void {
  const db = getDb();
  db.prepare("UPDATE practice_history SET isClosed = 1 WHERE id = ?").run(id);
}

export function deleteRecordings(id: number): void {
  const db = getDb();
  db.prepare(`
    UPDATE practice_history SET
      audioBlob1 = NULL, audioBlob2 = NULL, audioBlob3 = NULL,
      structuredTranscript1 = NULL, structuredTranscript2 = NULL, structuredTranscript3 = NULL
    WHERE id = ?
  `).run(id);
}

export function updateExerciseImage(id: number, imageUrl: string): void {
  const db = getDb();
  db.prepare("UPDATE exercises SET generatedImageUrl = ? WHERE id = ?").run(imageUrl, id);
}

export function deletePracticeHistoryById(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM practice_history WHERE id = ?").run(id);
}

export function clearRecordings(id: number): void {
  const db = getDb();
  db.prepare(`
    UPDATE practice_history SET
      audioBlob1 = NULL, audioBlob2 = NULL, audioBlob3 = NULL,
      structuredTranscript1 = NULL, structuredTranscript2 = NULL, structuredTranscript3 = NULL
    WHERE id = ?
  `).run(id);
}

export function prepopulateExercisesIfNeeded(): void {
  if (getExerciseCount() > 0) return;
  const defaultExercises = getDefaultExercises();
  insertExercises(defaultExercises);
}

function mapExerciseRow(row: Record<string, unknown>): OralExercise {
  return {
    id: row.id as number,
    type: row.type as "READING" | "STIMULUS",
    title: row.title as string,
    topic: row.topic as string,
    difficulty: (row.difficulty as string) || "",
    preambleText: (row.preambleText as string) || "",
    passageText: (row.passageText as string) || "",
    posterImageResName: (row.posterImageResName as string) || "",
    posterDescription: (row.posterDescription as string) || "",
    question1: (row.question1 as string) || "",
    question2: (row.question2 as string) || "",
    question3: (row.question3 as string) || "",
    isDaily: Boolean(row.isDaily),
    preamblePact: (row.preamblePact as string) || "",
    readingTips: (row.readingTips as string) || "",
    photographDescription: (row.photographDescription as string) || "",
    imageSearchSuggestion: (row.imageSearchSuggestion as string) || "",
    sbcQ1Type: (row.sbcQ1Type as string) || "",
    sbcQ2Type: (row.sbcQ2Type as string) || "",
    sbcQ3Type: (row.sbcQ3Type as string) || "",
    generatedImageUrl: (row.generatedImageUrl as string) ?? null,
  };
}

function mapHistoryRow(row: Record<string, unknown>): PracticeHistory {
  return {
    id: row.id as number,
    exerciseId: row.exerciseId as number,
    exerciseTitle: (row.exerciseTitle as string) || "",
    exerciseType: (row.exerciseType as string) || "READING",
    exerciseTopic: (row.exerciseTopic as string) || "",
    dateMillis: (row.dateMillis as number) || 0,
    audioPath1: row.audioPath1 as string | null,
    audioPath2: row.audioPath2 as string | null,
    audioPath3: row.audioPath3 as string | null,
    transcript1: row.transcript1 as string | null,
    transcript2: row.transcript2 as string | null,
    transcript3: row.transcript3 as string | null,
    score1: (row.score1 as number) || 0,
    score2: (row.score2 as number) || 0,
    score3: (row.score3 as number) || 0,
    totalScore: (row.totalScore as number) || 0,
    maxScore: (row.maxScore as number) || 0,
    generalFeedback: row.generalFeedback as string | null,
    strengths: row.strengths as string | null,
    areasOfImprovement: row.areasOfImprovement as string | null,
    modelAnswer1: row.modelAnswer1 as string | null,
    modelAnswer2: row.modelAnswer2 as string | null,
    modelAnswer3: row.modelAnswer3 as string | null,
    isEvaluated: Boolean(row.isEvaluated),
    isEvaluating: Boolean(row.isEvaluating),
    errorMessage: row.errorMessage as string | null,
    parentScore1: (row.parentScore1 as number | null) ?? null,
    parentScore2: (row.parentScore2 as number | null) ?? null,
    parentScore3: (row.parentScore3 as number | null) ?? null,
    parentFeedback: (row.parentFeedback as string | null) ?? null,
    parentTotalScore: (row.parentTotalScore as number | null) ?? null,
    audioBlob1: (row.audioBlob1 as string | null) ?? null,
    audioBlob2: (row.audioBlob2 as string | null) ?? null,
    audioBlob3: (row.audioBlob3 as string | null) ?? null,
    structuredTranscript1: (row.structuredTranscript1 as string | null) ?? null,
    structuredTranscript2: (row.structuredTranscript2 as string | null) ?? null,
    structuredTranscript3: (row.structuredTranscript3 as string | null) ?? null,
    isClosed: Boolean(row.isClosed),
  };
}

function getDefaultExercises(): Omit<OralExercise, "id">[] {
  return getSeedExercises();
}

// --- Settings CRUD ---

const SETTINGS_KEYS = [
  "geminiApiKey",
  "notificationEmail",
  "emailOnCompletion",
  "emailOnMissed",
  "childName",
  "dailyPracticeGoal",
] as const;

export function getSetting(key: string): string {
  const db = getDb();
  const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? "";
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

export function getAllSettings(): AppSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM app_settings").all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    geminiApiKey: map.geminiApiKey ?? "",
    notificationEmail: map.notificationEmail ?? "",
    emailOnCompletion: map.emailOnCompletion === "true",
    emailOnMissed: map.emailOnMissed === "true",
    childName: map.childName ?? "",
    dailyPracticeGoal: parseInt(map.dailyPracticeGoal || "1", 10),
  };
}

export function saveAllSettings(settings: AppSettings): void {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const tx = db.transaction(() => {
    stmt.run("geminiApiKey", settings.geminiApiKey);
    stmt.run("notificationEmail", settings.notificationEmail);
    stmt.run("emailOnCompletion", settings.emailOnCompletion ? "true" : "false");
    stmt.run("emailOnMissed", settings.emailOnMissed ? "true" : "false");
    stmt.run("childName", settings.childName);
    stmt.run("dailyPracticeGoal", String(settings.dailyPracticeGoal));
  });
  tx();
}

export function getEffectiveApiKey(): string {
  const dbKey = getSetting("geminiApiKey");
  return dbKey || process.env.GEMINI_API_KEY || "";
}
