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
