"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OralExercise, PracticeHistory } from "@/lib/types";
import AudioPlayer from "../../../../AudioPlayer";
import { ScoreRow } from "@/components/ScoreRow";
import { StructuredTranscriptView } from "@/components/StructuredTranscriptView";
import { resolveAudioSrc, hasAudio } from "@/lib/audio";
import ReRe from "../../../../ReRe";

export default function ZhParentSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const [history, setHistory] = useState<PracticeHistory | null>(null);
  const [exercise, setExercise] = useState<OralExercise | null>(null);
  const [loading, setLoading] = useState(true);

  // Parent grading state
  const [parentScore1, setParentScore1] = useState(5);
  const [parentScore2, setParentScore2] = useState(5);
  const [parentScore3, setParentScore3] = useState(5);
  const [parentFeedback, setParentFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [repracticing, setRepracticing] = useState(false);
  const [repracticeRequested, setRepracticeRequested] = useState(false);

  // Collapsible section state
  const [showPassage, setShowPassage] = useState(true);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [showModelAnswers, setShowModelAnswers] = useState(false);

  useEffect(() => {
    fetch(`/api/zh/practice?id=${sessionId}`)
      .then((r) => r.json())
      .then((historyData: PracticeHistory) => {
        setHistory(historyData);
        if (historyData.parentScore1 != null) setParentScore1(historyData.parentScore1);
        if (historyData.parentScore2 != null) setParentScore2(historyData.parentScore2);
        if (historyData.parentScore3 != null) setParentScore3(historyData.parentScore3);
        if (historyData.parentFeedback) setParentFeedback(historyData.parentFeedback);
        return fetch(`/api/exercises/${historyData.exerciseId}`).then((r) => r.json());
      })
      .then((ex: OralExercise & { error?: string }) => {
        if (ex && !ex.error) {
          setExercise(ex);
          setRepracticeRequested(!!ex.repracticeRequested);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h1>加载中...</h1>
        </header>
        <main>
          <div className="container">
            <div className="loading">
              <div className="spinner" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!history) {
    return (
      <>
        <header className="page-header">
          <h1>未找到</h1>
        </header>
        <main>
          <div className="container" style={{ paddingTop: 20 }}>
            <div className="empty-state">
              <p>未找到该练习记录。</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => router.push("/zh/parent")}
              >
                返回主页
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const isReading = history.exerciseType === "READING";
  const percentage =
    history.maxScore > 0
      ? Math.round((history.totalScore / history.maxScore) * 100)
      : 0;
  const scoreClass =
    percentage >= 70 ? "score-high" : percentage >= 50 ? "score-mid" : "score-low";

  const sliderLabels = isReading
    ? ["发音与咬字 (Pronunciation)", "朗读流利度与表达 (Fluency)"]
    : ["问题 1", "问题 2", "问题 3"];

  const parentTotal = isReading
    ? parentScore1 + parentScore2
    : parentScore1 + parentScore2 + parentScore3;

  const handleSaveGrade = async () => {
    if (!history) return;
    setSaving(true);
    setSaveMsg("");

    const payload = {
      id: history.id,
      parentScore1,
      parentScore2,
      parentScore3: isReading ? 0 : parentScore3,
      parentFeedback,
      parentTotalScore: parentTotal,
    };

    try {
      const res = await fetch("/api/zh/practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveMsg("已保存！");
        setHistory({
          ...history,
          parentScore1: payload.parentScore1,
          parentScore2: payload.parentScore2,
          parentScore3: payload.parentScore3,
          parentFeedback: payload.parentFeedback,
          parentTotalScore: payload.parentTotalScore,
        });
      } else {
        setSaveMsg("保存失败，请重试。");
      }
    } catch {
      setSaveMsg("保存失败，请重试。");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleCloseExercise = async () => {
    if (!confirm("关闭此练习？它将被归档并从学生的活跃列表中移除。"))
      return;
    setClosing(true);
    try {
      await fetch(`/api/zh/practice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, isClosed: true }),
      });
      setHistory((prev) => prev ? { ...prev, isClosed: true } : prev);
    } catch {
      alert("关闭练习失败。");
    }
    setClosing(false);
  };

  const handleReopenExercise = async () => {
    try {
      await fetch(`/api/zh/practice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, isClosed: false }),
      });
      setHistory((prev) => prev ? { ...prev, isClosed: false } : prev);
    } catch {
      alert("重新开放练习失败。");
    }
  };

  const handleToggleRepractice = async (request: boolean) => {
    if (!exercise) return;
    setRepracticing(true);
    try {
      await fetch("/api/exercises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exercise.id, repracticeRequested: request }),
      });
      setRepracticeRequested(request);
    } catch {
      alert("更新失败，请重试。");
    }
    setRepracticing(false);
  };

  const handleDeleteRecordings = async () => {
    if (!confirm("删除此次练习的所有录音？此操作无法撤销。"))
      return;
    setDeleting(true);
    try {
      await fetch(`/api/zh/practice/recordings?id=${sessionId}`, {
        method: "DELETE",
      });
      setHistory({
        ...history,
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
    } catch {
      // ignore
    }
    setDeleting(false);
  };

  const SectionHeader = ({
    title,
    open,
    onToggle,
  }: {
    title: string;
    open: boolean;
    onToggle: () => void;
  }) => (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div className="card-title" style={{ margin: 0 }}>{title}</div>
      <span style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1 }}>
        {open ? "▾" : "▸"}
      </span>
    </div>
  );

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/zh/parent")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              padding: 0,
            }}
          >
            &larr;
          </button>
          <div>
            <h1>练习详情</h1>
            <div className="subtitle">{history.exerciseTitle}</div>
          </div>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16 }}>

          {/* Score Overview */}
          <div className="card" style={{ textAlign: "center" }}>
            <div
              className={`score-circle ${scoreClass}`}
              style={{ marginBottom: 12 }}
            >
              <span className="score-value">{history.totalScore}</span>
              <span className="score-max">/ {history.maxScore}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              AI 评分：{percentage}%
            </div>
            {history.parentTotalScore != null && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--purple-soft)",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                家长评分：{history.parentTotalScore}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <span className={`badge ${isReading ? "badge-reading" : "badge-stimulus"}`}>
                {isReading ? "📖 朗读" : "🖼️ 看图说话"}
              </span>
              {exercise && <span className="badge badge-difficulty">{exercise.difficulty}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
              <a
                href={`/zh/results/${sessionId}`}
                style={{ fontSize: 13, color: "var(--purple-soft)", textDecoration: "underline" }}
              >
                查看学生成绩
              </a>
              {exercise && (
                <a
                  href={`/zh/practice/${exercise.id}`}
                  style={{ fontSize: 13, color: "var(--purple-soft)", textDecoration: "underline" }}
                >
                  重新练习
                </a>
              )}
            </div>
          </div>

          {/* Passage / Questions — collapsible */}
          {(exercise || history.exerciseType) && (
            <div className="card">
              <SectionHeader
                title={isReading ? "朗读段落" : "看图说话题目"}
                open={showPassage}
                onToggle={() => setShowPassage((v) => !v)}
              />
              {showPassage && (
                <div style={{ marginTop: 12 }}>
                  {exercise ? (
                    <>
                      {isReading && exercise.passageText && (
                        <div className="passage-text" style={{ fontSize: 13, lineHeight: 1.7 }}>
                          {exercise.passageText}
                        </div>
                      )}
                      {!isReading && (
                        <>
                          {exercise.generatedImageUrl && (
                            <div className="poster-image-area" style={{ marginBottom: 12 }}>
                              <img src={exercise.generatedImageUrl} alt="视觉刺激图片" />
                            </div>
                          )}
                          {!exercise.generatedImageUrl && exercise.photographDescription && (
                            <div className="poster-desc" style={{ marginBottom: 12 }}>
                              <strong>视觉材料</strong>
                              {exercise.photographDescription}
                            </div>
                          )}
                          {exercise.question1 && (
                            <div className="question-block">
                              <div className="q-label">问题 1</div>
                              <div style={{ fontSize: 14 }}>{exercise.question1}</div>
                            </div>
                          )}
                          {exercise.question2 && (
                            <div className="question-block">
                              <div className="q-label">问题 2</div>
                              <div style={{ fontSize: 14 }}>{exercise.question2}</div>
                            </div>
                          )}
                          {exercise.question3 && (
                            <div className="question-block">
                              <div className="q-label">问题 3</div>
                              <div style={{ fontSize: 14 }}>{exercise.question3}</div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      练习内容不可用。
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transcripts */}
          {(history.transcript1 || history.transcript2 || history.transcript3) && (
            <div className="card feedback-section">
              <h3 style={{ marginBottom: 10 }}>转录文字</h3>
              {history.transcript1 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                    {isReading ? "朗读：" : "回答 1："}
                  </div>
                  <div className="transcript-box has-text">{history.transcript1}</div>
                </div>
              )}
              {!isReading && history.transcript2 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>回答 2：</div>
                  <div className="transcript-box has-text">{history.transcript2}</div>
                </div>
              )}
              {!isReading && history.transcript3 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>回答 3：</div>
                  <div className="transcript-box has-text">{history.transcript3}</div>
                </div>
              )}
            </div>
          )}

          {/* AI Score Breakdown */}
          <div className="card">
            <div className="card-title">AI 评分细则</div>
            <div style={{ marginTop: 8 }}>
              <ScoreRow
                label={isReading ? "发音与咬字 (Pronunciation)" : "个人回应"}
                score={history.score1}
              />
              <ScoreRow
                label={isReading ? "朗读流利度与表达 (Fluency)" : "表达清晰度"}
                score={history.score2}
              />
              {!isReading && (
                <ScoreRow label="对话互动能力" score={history.score3} />
              )}
            </div>
          </div>

          {/* AI Detailed Feedback — collapsible */}
          {(history.generalFeedback || history.strengths || history.areasOfImprovement) && (
            <div className="card feedback-section">
              <SectionHeader
                title="AI 详细反馈"
                open={showAIFeedback}
                onToggle={() => setShowAIFeedback((v) => !v)}
              />
              {showAIFeedback && (
                <div style={{ marginTop: 12 }}>
                  {history.generalFeedback && (
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ marginBottom: 6, fontSize: 13 }}>综合反馈</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>{history.generalFeedback}</p>
                    </div>
                  )}
                  {history.strengths && (
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ color: "var(--success)", marginBottom: 6, fontSize: 13 }}>优点</h3>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {history.strengths.split("\n").filter(Boolean).map((s, i) => (
                          <li key={i}>{s.replace(/^-\s*/, "")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {history.areasOfImprovement && (
                    <div>
                      <h3 style={{ color: "var(--warning)", marginBottom: 6, fontSize: 13 }}>待改进之处</h3>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {history.areasOfImprovement.split("\n").filter(Boolean).map((s, i) => (
                          <li key={i}>{s.replace(/^-\s*/, "")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Structured Transcripts */}
                  {(history.structuredTranscript1 || history.structuredTranscript2 || history.structuredTranscript3) && (
                    <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <h3 style={{ marginBottom: 8, fontSize: 13 }}>结构化分析</h3>
                      <StructuredTranscriptView raw={history.structuredTranscript1} label={isReading ? "朗读" : "回答 1"} />
                      {!isReading && <StructuredTranscriptView raw={history.structuredTranscript2} label="回答 2" />}
                      {!isReading && <StructuredTranscriptView raw={history.structuredTranscript3} label="回答 3" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Answers — collapsible */}
          {(history.modelAnswer1 || history.modelAnswer2 || history.modelAnswer3) && (
            <div className="card feedback-section">
              <SectionHeader
                title="参考答案"
                open={showModelAnswers}
                onToggle={() => setShowModelAnswers((v) => !v)}
              />
              {showModelAnswers && (
                <div style={{ marginTop: 12 }}>
                  {history.modelAnswer1 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        {isReading ? "参考朗读" : "问题 1 参考答案"}
                      </div>
                      <div className="model-answer">{history.modelAnswer1}</div>
                    </div>
                  )}
                  {!isReading && history.modelAnswer2 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        问题 2 参考答案
                      </div>
                      <div className="model-answer">{history.modelAnswer2}</div>
                    </div>
                  )}
                  {!isReading && history.modelAnswer3 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        问题 3 参考答案
                      </div>
                      <div className="model-answer">{history.modelAnswer3}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parent Grading Section */}
          <div
            className="card"
            style={{
              border: "2px solid rgba(139, 92, 246, 0.3)",
              background: "rgba(139, 92, 246, 0.06)",
            }}
          >
            <div className="card-title" style={{ color: "var(--purple-soft)" }}>
              家长评分
            </div>

            {/* For Reading: single player before sliders */}
            {isReading && (
              <div style={{ marginTop: 12 }}>
                {resolveAudioSrc(history.audioPath1, null) ? (
                  <AudioPlayer src={resolveAudioSrc(history.audioPath1, null)!} label="收听录音" />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 8 }}>
                    本次练习暂无录音。
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {sliderLabels.map((label, idx) => {
                const paths = [history.audioPath1, history.audioPath2, history.audioPath3];
                const src = resolveAudioSrc(paths[idx], null);
                const value = idx === 0 ? parentScore1 : idx === 1 ? parentScore2 : parentScore3;
                const setter = idx === 0 ? setParentScore1 : idx === 1 ? setParentScore2 : setParentScore3;

                return (
                  <div key={idx} style={{ marginBottom: 20 }}>
                    {/* For SBC: player per question above its slider */}
                    {!isReading && src && (
                      <AudioPlayer src={src} label={`收听 — 问题 ${idx + 1}`} />
                    )}
                    {!isReading && !src && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 6 }}>
                        问题 {idx + 1} 暂无录音
                      </div>
                    )}
                    <div className="grading-row">
                      <label>{label}</label>
                      <div className="grade-value">{value}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="grading-slider"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
                      <span>0</span>
                      <span>10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--purple-soft)",
                margin: "8px 0 16px",
              }}
            >
              家长总分：{parentTotal}
            </div>

            <textarea
              className="parent-note-input"
              placeholder="为孩子添加反馈或备注..."
              value={parentFeedback}
              onChange={(e) => setParentFeedback(e.target.value)}
            />

            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              disabled={saving}
              onClick={handleSaveGrade}
            >
              {saving ? "保存中..." : "保存家长评分"}
            </button>

            {saveMsg && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: saveMsg === "已保存！" ? "var(--success)" : "var(--danger)",
                }}
              >
                {saveMsg}
              </div>
            )}
          </div>

          {/* Send for Re-Practice */}
          <div className="card" style={{ padding: "14px 16px", border: repracticeRequested ? "1px solid rgba(251,191,36,0.4)" : undefined }}>
            <div className="card-title" style={{ marginBottom: 8 }}>重新练习</div>
            {repracticeRequested ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    background: "rgba(251,191,36,0.15)", color: "var(--gold)",
                    padding: "2px 8px", borderRadius: 4,
                    border: "1px solid rgba(251,191,36,0.3)",
                  }}>
                    已请求重新练习
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  学生将看到重新完成此练习的提示。点击下方取消请求。
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: "auto" }}
                  disabled={repracticing}
                  onClick={() => handleToggleRepractice(false)}
                >
                  {repracticing ? "取消中..." : "取消重新练习"}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  将此练习发回给学生再次尝试。
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: "auto", background: "var(--gold)", borderColor: "var(--gold)" }}
                  disabled={repracticing || !exercise}
                  onClick={() => handleToggleRepractice(true)}
                >
                  {repracticing ? "发送中..." : "发送重新练习"}
                </button>
              </>
            )}
          </div>

          {/* Close / Reopen Exercise */}
          <div className="card" style={{ padding: "14px 16px" }}>
            {!history.isClosed ? (
              <>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  关闭此练习以将其归档。它将从学生的活跃练习列表中移除，但保留在历史记录中。
                </div>
                <button
                  className="btn btn-outline"
                  style={{ borderColor: "var(--coral)", color: "var(--coral)" }}
                  disabled={closing}
                  onClick={handleCloseExercise}
                >
                  {closing ? "关闭中..." : "关闭并归档"}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    background: "var(--bg-elevated)", color: "var(--text-muted)",
                    padding: "2px 8px", borderRadius: 4,
                  }}>
                    已归档
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    此练习已关闭。
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: "auto" }}
                  onClick={handleReopenExercise}
                >
                  重新开放练习
                </button>
              </>
            )}
          </div>

          {/* Delete Recordings */}
          {history.isClosed &&
            hasAudio(history.audioPath1, history.audioPath2, history.audioPath3, history.audioBlob1, history.audioBlob2, history.audioBlob3) && (
              <div className="card" style={{ borderColor: "var(--danger)" }}>
                <div className="card-title" style={{ color: "var(--danger)" }}>
                  存储管理
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                  此练习已关闭。您可以删除音频录音以释放存储空间。转录文字和评分将被保留。
                </p>
                <button
                  className="btn btn-danger"
                  disabled={deleting}
                  onClick={handleDeleteRecordings}
                >
                  {deleting ? "删除中..." : "删除录音"}
                </button>
              </div>
            )}

          <div style={{ paddingBottom: 24 }} />
        </div>
      </main>
    </>
  );
}
