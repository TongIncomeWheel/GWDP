"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../BottomNav";

type Tab = "reading" | "stimulus";

interface BandRow {
  band: string;
  label: string;
  labelZh: string;
  description: string;
  descriptionZh: string;
  color: string;
}

function BandTable({ title, titleZh, bands }: { title: string; titleZh: string; bands: BandRow[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--purple-soft, #A78BFA)",
          marginBottom: 4,
        }}
      >
        {titleZh}
      </h3>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bands.map((b) => (
          <div
            key={b.band}
            className="card"
            style={{
              borderLeft: `4px solid ${b.color}`,
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: b.color,
                marginBottom: 4,
              }}
            >
              {b.band} 分段 — {b.labelZh}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>
                ({b.label})
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #A8A3C4)",
                lineHeight: 1.5,
                marginBottom: 4,
              }}
            >
              {b.descriptionZh}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.4,
                fontStyle: "italic",
              }}
            >
              {b.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEAL = "var(--teal, #2DD4BF)";
const BLUE = "var(--blue, #60A5FA)";
const GOLD = "var(--gold, #FBBF24)";
const CORAL = "var(--coral, #F87171)";
const CORAL_DIM = "rgba(248, 113, 113, 0.55)";
const MUTED = "var(--text-muted, #6E6A8E)";

// 朗读 Criterion 1: 发音与咬字 (Pronunciation & Articulation)
const readingPronunciation: BandRow[] = [
  {
    band: "9–10",
    label: "Excellent",
    labelZh: "优秀",
    description: "Near-native clarity. All tones correct, clear consonants (zh/ch/sh/r), accurate finals. Minimal or no errors.",
    descriptionZh: "声调准确，声母（zh/ch/sh/r等）与韵母发音清晰，几乎无误。接近母语水平。",
    color: TEAL,
  },
  {
    band: "7–8",
    label: "Good",
    labelZh: "良好",
    description: "Most tones and sounds correct. Minor errors on difficult characters only. Meaning always clear.",
    descriptionZh: "大部分声调和发音正确，仅少数难字出现小错。意思清晰。",
    color: BLUE,
  },
  {
    band: "5–6",
    label: "Adequate",
    labelZh: "尚可",
    description: "Several tone or sound errors. Some words unclear. Meaning mostly understood with effort.",
    descriptionZh: "有几处声调或发音错误，部分词语不够清晰，但总体意思仍可理解。",
    color: GOLD,
  },
  {
    band: "3–4",
    label: "Below Average",
    labelZh: "较弱",
    description: "Frequent errors on tones and sounds. Listener must guess meaning of many words.",
    descriptionZh: "声调和发音错误频繁，听者需努力猜测很多词语的意思。",
    color: CORAL,
  },
  {
    band: "1–2",
    label: "Poor",
    labelZh: "很弱",
    description: "Severe pronunciation issues. Most words unrecognizable or incomprehensible.",
    descriptionZh: "发音极不准确，大部分词语难以辨认。",
    color: CORAL_DIM,
  },
  {
    band: "0",
    label: "No attempt",
    labelZh: "未作答",
    description: "No attempt made.",
    descriptionZh: "未尝试朗读。",
    color: MUTED,
  },
];

// 朗读 Criterion 2: 朗读流利度与表达 (Fluency & Expressive Reading)
const readingFluency: BandRow[] = [
  {
    band: "9–10",
    label: "Excellent",
    labelZh: "优秀",
    description: "Natural rhythm, appropriate pausing at punctuation, varied intonation. Dialogue sounds different from narration. Expressive and engaging delivery.",
    descriptionZh: "节奏自然，标点处停顿恰当，语调富有变化。对话与叙述声调不同，朗读有感情、引人入胜。",
    color: TEAL,
  },
  {
    band: "7–8",
    label: "Good",
    labelZh: "良好",
    description: "Generally fluent with reasonable pausing. Some expressiveness. Occasional hesitation but does not disrupt flow.",
    descriptionZh: "整体流畅，停顿基本合理，有一定表情。偶有停顿但不影响整体。",
    color: BLUE,
  },
  {
    band: "5–6",
    label: "Adequate",
    labelZh: "尚可",
    description: "Noticeable hesitations. Mostly monotone with basic pausing at full stops only. Limited expression.",
    descriptionZh: "有明显停顿，语调较单调，仅在句号处停顿，表情有限。",
    color: GOLD,
  },
  {
    band: "3–4",
    label: "Below Average",
    labelZh: "较弱",
    description: "Frequent pauses and restarts. Choppy and monotone. Reading too fast or too slow.",
    descriptionZh: "频繁停顿和重读，断断续续，声调单一。语速过快或过慢。",
    color: CORAL,
  },
  {
    band: "1–2",
    label: "Poor",
    labelZh: "很弱",
    description: "Extremely halting. Word-by-word decoding. No expression or awareness of punctuation.",
    descriptionZh: "极为吞吞吐吐，逐字读出，无表情，不理会标点符号。",
    color: CORAL_DIM,
  },
  {
    band: "0",
    label: "No attempt",
    labelZh: "未作答",
    description: "No attempt made.",
    descriptionZh: "未尝试朗读。",
    color: MUTED,
  },
];

// 看图说话 Criterion 1: 内容与回应 (Content & Response)
const stimulusContent: BandRow[] = [
  {
    band: "9–10",
    label: "Excellent",
    labelZh: "优秀",
    description: "Directly addresses the question with clear, relevant ideas. Logical structure with supporting details or examples. Strong personal response.",
    descriptionZh: "直接回应问题，观点清晰、切题。有条理，配以具体说明或例子，个人回应充分。",
    color: TEAL,
  },
  {
    band: "7–8",
    label: "Good",
    labelZh: "良好",
    description: "Addresses the question with reasonable ideas and some supporting detail. Structure present but may lack depth.",
    descriptionZh: "能回应问题，有合理观点及一些说明，有结构但深度稍欠。",
    color: BLUE,
  },
  {
    band: "5–6",
    label: "Adequate",
    labelZh: "尚可",
    description: "Partially addresses the question. Limited ideas or examples. Weak structure.",
    descriptionZh: "部分回应问题，想法或例子有限，结构较弱。",
    color: GOLD,
  },
  {
    band: "3–4",
    label: "Below Average",
    labelZh: "较弱",
    description: "Vague or partially off-topic. No clear structure. Few or irrelevant examples.",
    descriptionZh: "回应模糊或部分离题，结构不清，例子少或不相关。",
    color: CORAL,
  },
  {
    band: "1–2",
    label: "Poor",
    labelZh: "很弱",
    description: "Barely addresses question. One or two disconnected words or sentences.",
    descriptionZh: "几乎未回应问题，仅说出一两个字词或短句。",
    color: CORAL_DIM,
  },
  {
    band: "0",
    label: "No response",
    labelZh: "未作答",
    description: "No response given.",
    descriptionZh: "没有回应。",
    color: MUTED,
  },
];

// 看图说话 Criterion 2: 语言表达 (Language Expression)
const stimulusLanguage: BandRow[] = [
  {
    band: "9–10",
    label: "Excellent",
    labelZh: "优秀",
    description: "Rich, varied vocabulary. Accurate grammar with complex sentence structures. Sophisticated and natural Chinese expression.",
    descriptionZh: "词汇丰富多样，语法准确，句式复杂。表达流畅自然，用语得体。",
    color: TEAL,
  },
  {
    band: "7–8",
    label: "Good",
    labelZh: "良好",
    description: "Good vocabulary range. Minor grammar errors. Generally clear and correct Chinese expression.",
    descriptionZh: "词汇范围较广，偶有小语法错误，整体表达清晰正确。",
    color: BLUE,
  },
  {
    band: "5–6",
    label: "Adequate",
    labelZh: "尚可",
    description: "Basic vocabulary (e.g. 好、不好、开心). Some grammar errors but meaning mostly conveyed.",
    descriptionZh: "词汇基础（如“好”“不好”“开心”），有些语法错误，但意思大致清楚。",
    color: GOLD,
  },
  {
    band: "3–4",
    label: "Below Average",
    labelZh: "较弱",
    description: "Very limited vocabulary. Frequent grammar errors that impede understanding.",
    descriptionZh: "词汇非常有限，频繁语法错误，影响理解。",
    color: CORAL,
  },
  {
    band: "1–2",
    label: "Poor",
    labelZh: "很弱",
    description: "Minimal language. Severe grammar issues. Meaning often lost.",
    descriptionZh: "语言极少，语法严重错误，意思常不清楚。",
    color: CORAL_DIM,
  },
  {
    band: "0",
    label: "No response",
    labelZh: "未作答",
    description: "No response given.",
    descriptionZh: "没有回应。",
    color: MUTED,
  },
];

// 看图说话 Criterion 3: 沟通能力 (Communication Skills)
const stimulusCommunication: BandRow[] = [
  {
    band: "9–10",
    label: "Excellent",
    labelZh: "优秀",
    description: "Confident and fluent delivery. Natural elaboration without prompting. Cohesive use of connectives (因为、所以、虽然、但是). Maintains conversational flow.",
    descriptionZh: "表达自信流畅，主动延伸作答，善用连接词（因为、所以、虽然、但是等），对话自然流畅。",
    color: TEAL,
  },
  {
    band: "7–8",
    label: "Good",
    labelZh: "良好",
    description: "Mostly fluent. Reasonable elaboration. Some use of connectives. Minimal prompting needed.",
    descriptionZh: "整体流畅，能适当延伸，有时使用连接词，需少量引导。",
    color: BLUE,
  },
  {
    band: "5–6",
    label: "Adequate",
    labelZh: "尚可",
    description: "Some hesitation. Limited elaboration. Few connectives. Requires prompting to continue.",
    descriptionZh: "有些犹豫，延伸有限，连接词少，需提示才继续作答。",
    color: GOLD,
  },
  {
    band: "3–4",
    label: "Below Average",
    labelZh: "较弱",
    description: "Frequent hesitation. Very short answers. Disjointed. Requires significant prompting.",
    descriptionZh: "频繁犹豫，答案非常简短，断断续续，需大量提示。",
    color: CORAL,
  },
  {
    band: "1–2",
    label: "Poor",
    labelZh: "很弱",
    description: "Extremely hesitant. One-word or one-phrase answers only. Cannot maintain conversation.",
    descriptionZh: "极度犹豫，只说单字或短语，无法维持对话。",
    color: CORAL_DIM,
  },
  {
    band: "0",
    label: "No response",
    labelZh: "未作答",
    description: "No response given.",
    descriptionZh: "没有回应。",
    color: MUTED,
  },
];

export default function ZhRubricPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reading");

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>评分标准</h1>
            <div className="subtitle">PSLE 华文口试评分准则</div>
          </div>
          <button
            onClick={() => router.push("/zh")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← 返回
          </button>
        </div>
      </header>

      <main>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              className={`filter-pill${tab === "reading" ? " active" : ""}`}
              onClick={() => setTab("reading")}
            >
              朗读 (Reading Aloud)
            </button>
            <button
              className={`filter-pill${tab === "stimulus" ? " active" : ""}`}
              onClick={() => setTab("stimulus")}
            >
              看图说话 (Picture)
            </button>
          </div>

          {/* 朗读 Section */}
          {tab === "reading" && (
            <>
              <BandTable
                titleZh="评分标准一：发音与咬字（0–10分）"
                title="Criterion 1: Pronunciation & Articulation (0–10)"
                bands={readingPronunciation}
              />
              <BandTable
                titleZh="评分标准二：朗读流利度与表达（0–10分）"
                title="Criterion 2: Fluency & Expressive Reading (0–10)"
                bands={readingFluency}
              />

              {/* Additional Reading Assessment Factors */}
              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--purple-soft, #A78BFA)",
                    marginBottom: 4,
                  }}
                >
                  朗读注意事项
                </h3>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                  Additional Reading Assessment Factors
                </div>
                <div className="card" style={{ padding: "14px 16px" }}>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      color: "var(--text-secondary, #A8A3C4)",
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        完整性（Completeness）：
                      </strong>{" "}
                      必须朗读整篇短文。未读完则最高得分上限为 4/10。
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        标点意识（Punctuation Awareness）：
                      </strong>{" "}
                      逗号＝短暂停顿；句号＝较长停顿；问号＝语调上扬；感叹号＝加重语气。
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        语气配合（Tone Matching）：
                      </strong>{" "}
                      对话语气与叙述语气应有区别，情感丰富的段落需配合相应语调。
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>
                        速度控制（Pace Control）：
                      </strong>{" "}
                      语速不宜过快或过慢，保持自然对话节奏，适当变化。
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* 看图说话 Section */}
          {tab === "stimulus" && (
            <>
              {/* Format overview */}
              <div className="card" style={{ marginBottom: 20, padding: "14px 16px", background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(45,212,191,0.06) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  看图说话题型说明
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  考生将就图片回答 <strong style={{ color: "var(--purple-soft)" }}>3道问题</strong>，每题满分 <strong style={{ color: "var(--purple-soft)" }}>10分</strong>，共 <strong style={{ color: "var(--purple-soft)" }}>30分</strong>。每题依据以下三个方面综合评分：内容与回应、语言表达、沟通能力。
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                  3 questions × 10 marks each = 30 marks total. Each question is assessed holistically across the three criteria below.
                </div>
              </div>

              <BandTable
                titleZh="评分方面一：内容与回应（Content & Response）"
                title="How well the student addresses the question with relevant ideas, examples, and structure"
                bands={stimulusContent}
              />
              <BandTable
                titleZh="评分方面二：语言表达（Language Expression）"
                title="Vocabulary range, grammatical accuracy, and quality of Chinese expression"
                bands={stimulusLanguage}
              />
              <BandTable
                titleZh="评分方面三：沟通能力（Communication Skills）"
                title="Fluency, confidence, elaboration, use of connectives, and conversational quality"
                bands={stimulusCommunication}
              />
            </>
          )}

          {/* Scoring Summary */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--purple-soft, #A78BFA)",
                marginBottom: 4,
              }}
            >
              评分总结
            </h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              Scoring Summary
            </div>
            <div className="card" style={{ padding: "14px 16px" }}>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  color: "var(--text-secondary, #A8A3C4)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <li>
                  <strong style={{ color: "var(--teal, #2DD4BF)" }}>朗读总分：</strong>
                  {" "}/20（发音与咬字 + 朗读流利度与表达，各10分）
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                    Reading Aloud Total: /20 (Pronunciation + Fluency & Expression, 10 each)
                  </span>
                </li>
                <li>
                  <strong style={{ color: "var(--teal, #2DD4BF)" }}>看图说话总分：</strong>
                  {" "}/30（3题 × 10分）
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                    Picture Conversation Total: /30 (3 questions × 10 marks)
                  </span>
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>口试总分：</strong>
                  {" "}/50（朗读20分 + 看图说话30分）
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                    Oral Examination Total: /50 (Reading 20 + Picture Conversation 30)
                  </span>
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary, #F1F0F7)" }}>成绩参考：</strong>
                  {" "}70%及以上＝优 · 50–69%＝良 · 50%以下＝需加强
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                    Score guide: 70%+ = Good · 50–69% = Adequate · Below 50% = Needs improvement
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <BottomNav active="rubric" />
    </>
  );
}
