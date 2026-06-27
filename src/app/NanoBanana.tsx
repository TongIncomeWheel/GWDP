"use client";

import { useEffect, useState } from "react";

type Mood = "smiling" | "thinking" | "cheering" | "encouraging" | "confused";

const SPEECH_BUBBLES: Record<Mood, string[]> = {
  smiling: [
    "Ready to practise? Let's go!",
    "Hi there! Pick an exercise to start!",
    "Welcome back! Let's do great today!",
  ],
  thinking: [
    "Hmm, let me evaluate your response...",
    "Analysing your answer carefully...",
    "Thinking... give me a moment!",
  ],
  cheering: [
    "Amazing work! You're a star!",
    "Wow, that was brilliant!",
    "Fantastic! Keep it up!",
    "AL1 material right here!",
  ],
  encouraging: [
    "Good try! Let's practise more!",
    "Don't give up — every practice counts!",
    "You're getting better each time!",
    "Keep going, you've got this!",
  ],
  confused: [
    "Hmm, I didn't quite catch that...",
    "Could you try speaking more clearly?",
    "Let's try that again!",
  ],
};

const FACE: Record<Mood, string> = {
  smiling: "😊",
  thinking: "🤔",
  cheering: "🎉",
  encouraging: "💪",
  confused: "😅",
};

export default function NanoBanana({
  mood = "smiling",
  message,
  compact = false,
}: {
  mood?: Mood;
  message?: string;
  compact?: boolean;
}) {
  const [bubbleText, setBubbleText] = useState(message || "");

  useEffect(() => {
    if (message) {
      setBubbleText(message);
      return;
    }
    const options = SPEECH_BUBBLES[mood];
    setBubbleText(options[Math.floor(Math.random() * options.length)]);
  }, [mood, message]);

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className={`nano-banana nano-${mood}`} style={{ width: 36, height: 36, fontSize: 20 }}>
          <span className="nano-face">{FACE[mood]}</span>
        </div>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{bubbleText}</span>
      </div>
    );
  }

  return (
    <div className="nano-container">
      <div className="nano-speech-bubble">{bubbleText}</div>
      <div className={`nano-banana nano-${mood}`}>
        <div className="nano-body">🍌</div>
        <span className="nano-face">{FACE[mood]}</span>
      </div>
    </div>
  );
}
