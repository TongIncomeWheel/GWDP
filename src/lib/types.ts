export interface OralExercise {
  id: number;
  type: "READING" | "STIMULUS";
  title: string;
  topic: string;
  difficulty: string;
  preambleText: string;
  passageText: string;
  posterImageResName: string;
  posterDescription: string;
  question1: string;
  question2: string;
  question3: string;
  isDaily: boolean;
  preamblePact: string;
  readingTips: string;
  photographDescription: string;
  imageSearchSuggestion: string;
  sbcQ1Type: string;
  sbcQ2Type: string;
  sbcQ3Type: string;
  generatedImageUrl: string | null;
  repracticeRequested?: boolean;
}

export interface PracticeHistory {
  id: number;
  exerciseId: number;
  exerciseTitle: string;
  exerciseType: string;
  exerciseTopic: string;
  dateMillis: number;
  audioPath1: string | null;
  audioPath2: string | null;
  audioPath3: string | null;
  transcript1: string | null;
  transcript2: string | null;
  transcript3: string | null;
  score1: number;
  score2: number;
  score3: number;
  totalScore: number;
  maxScore: number;
  generalFeedback: string | null;
  strengths: string | null;
  areasOfImprovement: string | null;
  modelAnswer1: string | null;
  modelAnswer2: string | null;
  modelAnswer3: string | null;
  isEvaluated: boolean;
  isEvaluating: boolean;
  errorMessage: string | null;
  parentScore1: number | null;
  parentScore2: number | null;
  parentScore3: number | null;
  parentFeedback: string | null;
  parentTotalScore: number | null;
  audioBlob1: string | null;
  audioBlob2: string | null;
  audioBlob3: string | null;
  structuredTranscript1: string | null;
  structuredTranscript2: string | null;
  structuredTranscript3: string | null;
  isClosed: boolean;
}

export interface PSLEEvaluationResult {
  score1: number;
  score2: number;
  score3: number;
  generalFeedback: string;
  strengths: string[];
  areasOfImprovement: string[];
  suggestedResponse1: string;
  suggestedResponse2: string;
  suggestedResponse3: string;
}

export interface StructuredTranscript {
  rawText: string;
  framework: "PEEL" | "TREES" | "PEERS";
  point: string;
  evidence: string;
  explanation: string;
  link: string;
  overallCoherence: "strong" | "moderate" | "weak";
  vocabularyHighlights: string[];
  grammarNotes: string[];
}

export interface ParentGrading {
  score1: number;
  score2: number;
  score3: number;
  totalScore: number;
  feedback: string;
}

export interface AppSettings {
  geminiApiKey: string;
  notificationEmail: string;
  emailOnCompletion: boolean;
  emailOnMissed: boolean;
  childName: string;
  dailyPracticeGoal: number;
  resendApiKey: string;
  resendFromEmail: string;
}
