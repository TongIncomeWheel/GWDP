import Database from "better-sqlite3";
import path from "path";
import type { OralExercise, PracticeHistory } from "./types";

const DB_PATH = path.join(process.cwd(), "oral_practice.db");

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
        isDaily INTEGER NOT NULL DEFAULT 0
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
        FOREIGN KEY (exerciseId) REFERENCES exercises(id)
      );
    `);
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
      posterImageResName, posterDescription, question1, question2, question3, isDaily)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: Omit<OralExercise, "id">[]) => {
    for (const e of items) {
      stmt.run(
        e.type, e.title, e.topic, e.difficulty, e.preambleText, e.passageText,
        e.posterImageResName, e.posterDescription, e.question1, e.question2, e.question3,
        e.isDaily ? 1 : 0
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
      isEvaluated, isEvaluating, errorMessage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    history.exerciseId, history.exerciseTitle, history.exerciseType, history.exerciseTopic,
    history.dateMillis, history.audioPath1, history.audioPath2, history.audioPath3,
    history.transcript1, history.transcript2, history.transcript3,
    history.score1, history.score2, history.score3, history.totalScore, history.maxScore,
    history.generalFeedback, history.strengths, history.areasOfImprovement,
    history.modelAnswer1, history.modelAnswer2, history.modelAnswer3,
    history.isEvaluated ? 1 : 0, history.isEvaluating ? 1 : 0, history.errorMessage
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
      isEvaluated=?, isEvaluating=?, errorMessage=?
    WHERE id=?
  `).run(
    history.exerciseId, history.exerciseTitle, history.exerciseType, history.exerciseTopic,
    history.dateMillis, history.audioPath1, history.audioPath2, history.audioPath3,
    history.transcript1, history.transcript2, history.transcript3,
    history.score1, history.score2, history.score3, history.totalScore, history.maxScore,
    history.generalFeedback, history.strengths, history.areasOfImprovement,
    history.modelAnswer1, history.modelAnswer2, history.modelAnswer3,
    history.isEvaluated ? 1 : 0, history.isEvaluating ? 1 : 0, history.errorMessage,
    history.id
  );
}

export function deletePracticeHistoryById(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM practice_history WHERE id = ?").run(id);
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
  };
}

function getDefaultExercises(): Omit<OralExercise, "id">[] {
  return [
    {
      type: "READING",
      title: "The Campfire Adventure",
      topic: "Adventure & Nature",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText: "The crackle of the campfire was the only sound that broke the silence of the night. Sparks leaped up into the starry sky like miniature shooting stars. Sitting closely in a circle, we wrapped our blankets tightly around our shoulders to keep out the chilly mountain air.\n\n\"Did you hear that?\" whispered Mei Ling, her eyes wide with alarm. Everyone froze. From somewhere in the dense forest, a twig snapped. My heart was hammering so loudly that I was sure the others could hear it.\n\nMr. Tan, our scout leader, chuckled softly. \"It is probably just a deer,\" he said reassuringly. \"There is nothing to be afraid of.\" Despite his calm words, I noticed he kept his torchlight aimed steadily at the tree line.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: true,
    },
    {
      type: "READING",
      title: "The School Library",
      topic: "School Life",
      difficulty: "Easy",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText: "The school library was my favourite place in the whole school. Every recess, while my classmates rushed to the canteen, I would slip away quietly to the second floor where rows upon rows of books awaited me.\n\nMrs. Lim, the librarian, always greeted me with a warm smile. \"Back again, Arun?\" she would say, adjusting her spectacles. She knew exactly which shelf I would head to — the adventure section at the far corner near the window.\n\nThere, bathed in the golden afternoon sunlight, I would lose myself in tales of brave explorers and distant lands. The noise from the field below seemed to fade away as I turned each page, transported to a world far beyond the boundaries of our little school.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
    },
    {
      type: "STIMULUS",
      title: "Wellness Week Campaign",
      topic: "Health & Wellness",
      difficulty: "Intermediate",
      preambleText: "Look at the poster below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "poster_wellness",
      posterDescription: "A colourful school poster advertising 'Wellness Week'. It features: (1) A '10,000 Steps Challenge' section with a cartoon steps tracker showing students walking, (2) A 'Healthy Eating Corner' with discounted fruit packs at 50 cents, (3) A prize section offering a reusable water bottle for top participants, (4) The school motto 'Healthy Body, Healthy Mind' at the bottom, (5) Dates shown as 'March 10-14' with the school logo.",
      question1: "Would you like to take part in the activities shown in the poster? Why or why not?",
      question2: "What do you do to keep healthy in school and at home?",
      question3: "Some people say that school canteens should ban all fried food. Do you agree? Why or why not?",
      isDaily: true,
    },
    {
      type: "STIMULUS",
      title: "Community Clean-Up Day",
      topic: "Environment & Community",
      difficulty: "Advanced",
      preambleText: "Look at the poster below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "poster_cleanup",
      posterDescription: "A vibrant community poster for 'Community Clean-Up Day'. It shows: (1) Volunteers of all ages picking up litter at a park and beach, (2) Recycling stations with bins labelled 'Paper', 'Plastic', 'Glass', (3) A scoreboard showing 'Cleanest Block Competition' with prizes, (4) Date: 'Saturday, 15 June, 8am-12pm', (5) A slogan 'Our Neighbourhood, Our Responsibility' with the town council logo.",
      question1: "Would you encourage your family to join this event? Why or why not?",
      question2: "What are some things you and your neighbours can do to keep your neighbourhood clean?",
      question3: "Do you think giving prizes is the best way to encourage people to care for the environment? Why or why not?",
      isDaily: false,
    },
  ];
}
