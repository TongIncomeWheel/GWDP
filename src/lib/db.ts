import { initializeApp, applicationDefault, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import type { OralExercise, PracticeHistory, AppSettings } from "./types";
import { getSeedExercises } from "./seed-data";

let _app: App;
let _db: Firestore;

function getDb(): Firestore {
  if (!_db) {
    if (getApps().length === 0) {
      const projectId = process.env.GCLOUD_PROJECT || "gen-lang-client-0684149502";
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        _app = initializeApp({
          credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)),
          projectId,
        });
      } else {
        _app = initializeApp({
          credential: applicationDefault(),
          projectId,
        });
      }
    } else {
      _app = getApps()[0];
    }
    _db = getFirestore(_app);
  }
  return _db;
}

// ── Exercises ──

export async function getAllExercises(): Promise<OralExercise[]> {
  const db = getDb();
  const snap = await db.collection("exercises").orderBy("id").get();
  return snap.docs.map((d) => d.data() as OralExercise);
}

export async function getExerciseById(id: number): Promise<OralExercise | undefined> {
  const db = getDb();
  const snap = await db.collection("exercises").where("id", "==", id).limit(1).get();
  if (snap.empty) return undefined;
  return snap.docs[0].data() as OralExercise;
}

export async function getExerciseCount(): Promise<number> {
  const db = getDb();
  const snap = await db.collection("exercises").count().get();
  return snap.data().count;
}

export async function insertExercises(exercises: Omit<OralExercise, "id">[]): Promise<void> {
  const db = getDb();
  const batch = db.batch();
  const counterRef = db.collection("counters").doc("exercises");
  const counterSnap = await counterRef.get();
  let nextId = (counterSnap.exists ? (counterSnap.data()?.next as number) : 0) || 1;

  for (const e of exercises) {
    const id = nextId++;
    const docRef = db.collection("exercises").doc(String(id));
    batch.set(docRef, { ...e, id });
  }
  batch.set(counterRef, { next: nextId }, { merge: true });
  await batch.commit();
}

export async function setExerciseRepractice(id: number, requested: boolean): Promise<void> {
  const db = getDb();
  const snap = await db.collection("exercises").where("id", "==", id).limit(1).get();
  if (!snap.empty) {
    await snap.docs[0].ref.update({ repracticeRequested: requested });
  }
}

export async function updateExerciseImage(id: number, imageUrl: string): Promise<void> {
  const db = getDb();
  const snap = await db.collection("exercises").where("id", "==", id).limit(1).get();
  if (!snap.empty) {
    await snap.docs[0].ref.update({ generatedImageUrl: imageUrl });
  }
}

export async function prepopulateExercisesIfNeeded(): Promise<void> {
  const count = await getExerciseCount();
  if (count > 0) return;
  const seeds = getSeedExercises();
  await insertExercises(seeds);
}

// ── Practice History ──

export async function getAllPracticeHistory(): Promise<PracticeHistory[]> {
  const db = getDb();
  const snap = await db.collection("practice_history").orderBy("dateMillis", "desc").get();
  return snap.docs.map((d) => d.data() as PracticeHistory);
}

export async function getPracticeHistoryById(id: number): Promise<PracticeHistory | undefined> {
  const db = getDb();
  const doc = await db.collection("practice_history").doc(String(id)).get();
  if (!doc.exists) return undefined;
  return doc.data() as PracticeHistory;
}

export async function insertPracticeHistory(history: Omit<PracticeHistory, "id">): Promise<number> {
  const db = getDb();
  const counterRef = db.collection("counters").doc("practice_history");

  const id = await db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextId = (counterSnap.exists ? (counterSnap.data()?.next as number) : 0) || 1;
    tx.set(counterRef, { next: nextId + 1 }, { merge: true });
    const docRef = db.collection("practice_history").doc(String(nextId));
    tx.set(docRef, { ...history, id: nextId });
    return nextId;
  });

  return id;
}

export async function updatePracticeHistory(history: PracticeHistory): Promise<void> {
  const db = getDb();
  await db.collection("practice_history").doc(String(history.id)).set(history);
}

export async function updateParentGrading(
  id: number,
  parentScore1: number,
  parentScore2: number,
  parentScore3: number,
  parentFeedback: string
): Promise<void> {
  const db = getDb();
  const parentTotalScore = parentScore1 + parentScore2 + parentScore3;
  await db.collection("practice_history").doc(String(id)).update({
    parentScore1,
    parentScore2,
    parentScore3,
    parentTotalScore,
    parentFeedback,
  });
}

export async function closeExercise(id: number): Promise<void> {
  const db = getDb();
  await db.collection("practice_history").doc(String(id)).update({ isClosed: true });
}

export async function deleteRecordings(id: number): Promise<void> {
  const db = getDb();
  await db.collection("practice_history").doc(String(id)).update({
    audioBlob1: null,
    audioBlob2: null,
    audioBlob3: null,
    structuredTranscript1: null,
    structuredTranscript2: null,
    structuredTranscript3: null,
  });
}

export const clearRecordings = deleteRecordings;

export async function deletePracticeHistoryById(id: number): Promise<void> {
  const db = getDb();
  await db.collection("practice_history").doc(String(id)).delete();
}

export async function resetAllPracticeHistory(): Promise<void> {
  const db = getDb();
  const snap = await db.collection("practice_history").get();
  // Firestore batch limit is 500 writes
  const batchSize = 490;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch();
    snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  // Reset the auto-increment counter so IDs start fresh from 1
  await db.collection("counters").doc("practice_history").set({ next: 1 });
}

// ── Test Results ──

export interface TestResultEntry {
  status: "untested" | "pass" | "fail" | "blocked";
  notes: string;
  tester: string;
  updatedAt: number;
}

export async function getTestResults(): Promise<Record<string, TestResultEntry>> {
  const db = getDb();
  const doc = await db.collection("test_results").doc("all").get();
  return doc.exists ? (doc.data() as Record<string, TestResultEntry>) : {};
}

export async function saveTestResult(
  id: string,
  status: string,
  notes: string,
  tester: string
): Promise<void> {
  const db = getDb();
  await db.collection("test_results").doc("all").set(
    { [id]: { status, notes, tester, updatedAt: Date.now() } },
    { merge: true }
  );
}

// ── Settings ──

export async function getSetting(key: string): Promise<string> {
  const db = getDb();
  const doc = await db.collection("app_settings").doc(key).get();
  return doc.exists ? (doc.data()?.value as string) ?? "" : "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.collection("app_settings").doc(key).set({ value });
}

export async function getAllSettings(): Promise<AppSettings> {
  const db = getDb();
  const snap = await db.collection("app_settings").get();
  const map: Record<string, string> = {};
  for (const doc of snap.docs) {
    map[doc.id] = (doc.data().value as string) ?? "";
  }
  return {
    geminiApiKey: map.geminiApiKey ?? "",
    notificationEmail: map.notificationEmail ?? "",
    emailOnCompletion: map.emailOnCompletion === "true",
    emailOnMissed: map.emailOnMissed === "true",
    childName: map.childName ?? "",
    dailyPracticeGoal: parseInt(map.dailyPracticeGoal || "1", 10),
  };
}

export async function saveAllSettings(settings: AppSettings): Promise<void> {
  const db = getDb();
  const batch = db.batch();
  const col = db.collection("app_settings");
  batch.set(col.doc("geminiApiKey"), { value: settings.geminiApiKey });
  batch.set(col.doc("notificationEmail"), { value: settings.notificationEmail });
  batch.set(col.doc("emailOnCompletion"), { value: settings.emailOnCompletion ? "true" : "false" });
  batch.set(col.doc("emailOnMissed"), { value: settings.emailOnMissed ? "true" : "false" });
  batch.set(col.doc("childName"), { value: settings.childName });
  batch.set(col.doc("dailyPracticeGoal"), { value: String(settings.dailyPracticeGoal) });
  await batch.commit();
}

export async function getEffectiveApiKey(): Promise<string> {
  const dbKey = await getSetting("geminiApiKey");
  return dbKey || process.env.GEMINI_API_KEY || "";
}
