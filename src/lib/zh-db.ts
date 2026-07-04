import type { OralExercise, PracticeHistory } from "./types";
import { getSeedZhExercises } from "./zh-seed-data";
import { getFirestore } from "firebase-admin/firestore";
import {
  getBucket,
  uploadAudioToGCS,
  downloadAudioFromGCS,
  deleteAudioFromGCS,
  getEffectiveApiKey,
} from "./db";

// Reuse the Firebase app already initialised by db.ts
function getDb() {
  return getFirestore();
}

export { getEffectiveApiKey, getBucket, uploadAudioToGCS, downloadAudioFromGCS, deleteAudioFromGCS };

// ── Zh Exercises ──

export async function getAllZhExercises(): Promise<OralExercise[]> {
  const db = getDb();
  const snap = await db.collection("zh_exercises").orderBy("id").get();
  return snap.docs.map((d: import("firebase-admin/firestore").QueryDocumentSnapshot) => d.data() as OralExercise);
}

export async function getZhExerciseById(id: number): Promise<OralExercise | undefined> {
  const db = getDb();
  const snap = await db.collection("zh_exercises").doc(String(id)).get();
  if (!snap.exists) return undefined;
  return snap.data() as OralExercise;
}

export async function getZhExerciseCount(): Promise<number> {
  const db = getDb();
  const snap = await db.collection("zh_exercises").count().get();
  return snap.data().count;
}

export async function insertZhExercises(exercises: Omit<OralExercise, "id">[]): Promise<void> {
  const db = getDb();
  const batch = db.batch();
  const counterRef = db.collection("counters").doc("zh_exercises");
  const counterSnap = await counterRef.get();
  let nextId = (counterSnap.exists ? (counterSnap.data()?.next as number) : 0) || 1;

  for (const e of exercises) {
    const id = nextId++;
    const docRef = db.collection("zh_exercises").doc(String(id));
    batch.set(docRef, { ...e, id });
  }
  batch.set(counterRef, { next: nextId }, { merge: true });
  await batch.commit();
}

export async function setZhExerciseRepractice(id: number, requested: boolean): Promise<void> {
  const db = getDb();
  const snap = await db.collection("zh_exercises").where("id", "==", id).limit(1).get();
  if (!snap.empty) {
    await snap.docs[0].ref.update({ repracticeRequested: requested });
  }
}

export async function updateZhExerciseImage(id: number, imageUrl: string): Promise<void> {
  const db = getDb();
  const snap = await db.collection("zh_exercises").where("id", "==", id).limit(1).get();
  if (!snap.empty) {
    await snap.docs[0].ref.update({ generatedImageUrl: imageUrl });
  }
}

// Returns the existing URL, "generating" (another device is in progress), or "claimed" (this caller may generate).
// Uses a Firestore transaction to prevent concurrent image generation across devices.
export async function claimZhImageGeneration(id: number): Promise<string | "generating" | "claimed"> {
  const db = getDb();
  const docRef = db.collection("zh_exercises").doc(String(id));
  return db.runTransaction(async (tx: import("firebase-admin/firestore").Transaction) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return "claimed";
    const data = snap.data()!;
    if (data.generatedImageUrl) return data.generatedImageUrl as string;
    if (data.imageGenerating) {
      // Treat locks older than 2 minutes as stale — generation must have crashed
      const lockedAt = data.imageGeneratingAt as number | undefined;
      const stale = !lockedAt || Date.now() - lockedAt > 2 * 60 * 1000;
      if (!stale) return "generating";
    }
    tx.update(docRef, { imageGenerating: true, imageGeneratingAt: Date.now() });
    return "claimed";
  });
}

export async function finishZhImageGeneration(id: number, imageUrl: string): Promise<void> {
  const db = getDb();
  await db.collection("zh_exercises").doc(String(id)).update({
    generatedImageUrl: imageUrl,
    imageGenerating: false,
  });
}

export async function clearZhImageGenerating(id: number): Promise<void> {
  const db = getDb();
  await db.collection("zh_exercises").doc(String(id)).update({ imageGenerating: false });
}

export async function prepopulateZhExercisesIfNeeded(): Promise<void> {
  const count = await getZhExerciseCount();
  if (count > 0) return;
  const seeds = getSeedZhExercises();
  await insertZhExercises(seeds);
}

// ── Zh Practice History ──

export async function getAllZhPracticeHistory(): Promise<PracticeHistory[]> {
  const db = getDb();
  const snap = await db.collection("zh_practice_history").orderBy("dateMillis", "desc").get();
  return snap.docs.map((d: import("firebase-admin/firestore").QueryDocumentSnapshot) => d.data() as PracticeHistory);
}

// List view — excludes audio blobs and large transcript fields to keep payloads small
export async function getAllZhPracticeHistoryMeta(): Promise<Partial<PracticeHistory>[]> {
  const db = getDb();
  const snap = await db
    .collection("zh_practice_history")
    .orderBy("dateMillis", "desc")
    .select(
      "id", "exerciseId", "exerciseTitle", "exerciseType", "exerciseTopic",
      "dateMillis", "totalScore", "maxScore", "isEvaluated", "isEvaluating",
      "parentScore1", "parentScore2", "parentScore3", "parentTotalScore",
      "isClosed", "errorMessage",
      "strengths", "areasOfImprovement"
    )
    .get();
  return snap.docs.map((d) => d.data() as Partial<PracticeHistory>);
}

export async function getZhPracticeHistoryById(id: number): Promise<PracticeHistory | undefined> {
  const db = getDb();
  const doc = await db.collection("zh_practice_history").doc(String(id)).get();
  if (!doc.exists) return undefined;
  return doc.data() as PracticeHistory;
}

export async function insertZhPracticeHistory(history: Omit<PracticeHistory, "id">): Promise<number> {
  const db = getDb();
  const counterRef = db.collection("counters").doc("zh_practice_history");

  const id = await db.runTransaction(async (tx: import("firebase-admin/firestore").Transaction) => {
    const counterSnap = await tx.get(counterRef);
    const nextId = (counterSnap.exists ? (counterSnap.data()?.next as number) : 0) || 1;
    tx.set(counterRef, { next: nextId + 1 }, { merge: true });
    const docRef = db.collection("zh_practice_history").doc(String(nextId));
    tx.set(docRef, { ...history, id: nextId });
    return nextId;
  });

  return id;
}

export async function updateZhPracticeHistory(history: PracticeHistory): Promise<void> {
  const db = getDb();
  await db.collection("zh_practice_history").doc(String(history.id)).set(history);
}

export async function updateZhParentGrading(
  id: number,
  parentScore1: number,
  parentScore2: number,
  parentScore3: number,
  parentFeedback: string
): Promise<void> {
  const db = getDb();
  const parentTotalScore = parentScore1 + parentScore2 + parentScore3;
  await db.collection("zh_practice_history").doc(String(id)).update({
    parentScore1,
    parentScore2,
    parentScore3,
    parentTotalScore,
    parentFeedback,
  });
}

export async function updateZhEvaluationResult(
  id: number,
  fields: {
    score1: number; score2: number; score3: number;
    totalScore: number; maxScore: number;
    generalFeedback: string | null; strengths: string | null; areasOfImprovement: string | null;
    modelAnswer1: string | null; modelAnswer2: string | null; modelAnswer3: string | null;
    isEvaluated: boolean; isEvaluating: boolean; errorMessage: string | null;
  }
): Promise<void> {
  const db = getDb();
  await db.collection("zh_practice_history").doc(String(id)).update(fields);
}

export async function setZhEvaluating(id: number, isEvaluating: boolean, errorMessage: string | null = null): Promise<void> {
  const db = getDb();
  await db.collection("zh_practice_history").doc(String(id)).update({ isEvaluating, errorMessage });
}

export async function closeZhExercise(id: number): Promise<void> {
  const db = getDb();
  await db.collection("zh_practice_history").doc(String(id)).update({ isClosed: true });
}

export async function deleteZhRecordings(id: number): Promise<void> {
  const db = getDb();
  const history = await getZhPracticeHistoryById(id);
  if (history) {
    const { deleteAudio } = await import("./audio-service");
    for (const path of [history.audioPath1, history.audioPath2, history.audioPath3]) {
      if (path) await deleteAudio(path);
    }
  }
  await db.collection("zh_practice_history").doc(String(id)).update({
    audioPath1: null,
    audioPath2: null,
    audioPath3: null,
    audioBlob1: null,
    audioBlob2: null,
    audioBlob3: null,
    structuredTranscript1: null,
    structuredTranscript2: null,
    structuredTranscript3: null,
  });
}

export async function deleteZhPracticeHistoryById(id: number): Promise<void> {
  const db = getDb();
  await db.collection("zh_practice_history").doc(String(id)).delete();
}
