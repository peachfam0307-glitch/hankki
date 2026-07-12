/*
  오답 끝 ✗ — 소이(Soi) 전용 오답노트 (Claude 안 실행판 · API 키 없이 AI 작동)
  © 2026 소이(Soi). 개인 학습용. 무단 복제·배포·판매 금지.
  탭: 기록 / 플래시카드(풀이 패드) / 변형문제(풀이 패드) / 실수 패턴 / 설정
*/
import { useState, useEffect, useRef } from "react";

/*
  오답노트 트래커 — 소이님 전용 v3 (최종)
  탭: 기록 / 플래시카드 / 변형문제 / 실수 패턴 / 설정
  기능:
  - 오답 기록(사진 최대 5장, 푼 시간, 별표, 과목별 틀린 이유 태그 + 기타 직접 추가)
  - 풀이 기록 · AI 풀이 도우미(모드 선택) · 발상 카드(메모 아래 접힘)
  - 플래시카드(과목별 · 랜덤 · 스톱워치/3분 타이머 · 다시 풀기 · 삭제)
  - 변형문제 탭(포항제철고 20년차 극악 출제 교사 페르소나 · 문제 기반/실수 패턴 종합 · 기준 교재 반영)
  - 인쇄용 파일 내보내기 · 설정(과목/교재/태그 자체 수정, 선별 삭제, 전체 초기화)
  컨셉: 모눈 연습장 + 빨간펜 첨삭
*/

const DEFAULT_SUBJECTS = [
  { name: "대수", color: "#2B57C6", book: "고쟁이 대수 2022 · 쎈B 대수" },
  { name: "미적분1", color: "#1F7A8C" },
  { name: "미적분2", color: "#5B4FC9" },
  { name: "확통", color: "#B0641E" },
  { name: "생명과학", color: "#2E7D4F" },
  { name: "물리", color: "#6B3FA0" },
  { name: "한국사", color: "#8B5E3C" },
  { name: "영어", color: "#C2185B" },
  { name: "국어", color: "#4A6572" },
  { name: "통합사회", color: "#00838F" },
];

const COLOR_PALETTE = [
  "#2B57C6", "#1F7A8C", "#5B4FC9", "#B0641E", "#2E7D4F",
  "#6B3FA0", "#8B5E3C", "#C2185B", "#4A6572", "#00838F",
  "#AD1457", "#00695C", "#4527A0", "#BF360C", "#33691E",
];

const MATH_TAGS = ["부호 실수", "대입 순서 혼동", "경우 나누기 누락", "개념 부족", "문제 해석 오류", "계산 실수", "시간 부족"];

// 과목 특성에 맞는 기본 틀린 이유 태그 세트
const SUBJECT_TAG_SETS = {
  "대수": MATH_TAGS,
  "미적분1": MATH_TAGS,
  "미적분2": MATH_TAGS,
  "확통": MATH_TAGS,
  "생명과학": ["개념 부족", "자료·그래프 해석 오류", "실험 설계·변인 혼동", "암기 부족", "선지 함정", "문제 해석 오류", "시간 부족"],
  "물리": ["개념 부족", "공식 적용 오류", "단위·환산 실수", "부호·방향 실수", "그래프 해석 오류", "계산 실수", "시간 부족"],
  "한국사": ["시대 순서 혼동", "인물·사건 혼동", "사료 해석 오류", "암기 부족", "선지 함정", "시간 부족"],
  "영어": ["어휘 부족", "구문 분석 오류", "지문 흐름 파악 실패", "문법 개념 부족", "선지 함정", "시간 부족"],
  "국어": ["지문 이해 부족", "근거 찾기 실패", "문학 개념·용어 부족", "문법 개념 부족", "선지 함정", "시간 부족"],
  "통합사회": ["개념 부족", "자료·통계 해석 오류", "관점·입장 혼동", "암기 부족", "선지 함정", "시간 부족"],
};

// 사용자가 새로 추가한 과목의 기본 태그
const GENERIC_TAGS = ["개념 부족", "문제 해석 오류", "암기 부족", "선지 함정", "계산 실수", "시간 부족"];

function tagsForSubject(name) {
  return SUBJECT_TAG_SETS[name] || GENERIC_TAGS;
}

const STATUS = [
  { label: "미복습", short: "미복습" },
  { label: "1차 복습", short: "1차" },
  { label: "2차 복습", short: "2차" },
  { label: "완전 정복", short: "정복" },
];

const STORAGE_KEY = "wrongnote:data:v1";

const TEACHER_PERSONA =
  "너는 포항제철고등학교에서 20년째 내신 문제를 극악하게 어렵게 내기로 악명 높은 베테랑 교사야. " +
  "평범한 유형 문제는 절대 내지 않고, 조건을 비틀고, 여러 개념을 융합하고, 학생들이 습관적으로 빠지는 함정을 정확히 찌르는 킬러 문항이 특기야.\n" +
  "[출제 기준]\n" +
  "- 반드시 대한민국 2022 개정 교육과정 범위 안에서만 출제하고, 교육과정을 벗어나는 대학 수준 내용은 절대 쓰지 마.\n" +
  "- 자사고 내신 스타일을 따라: 수능·평가원 모의고사 기출의 고난도 유형과 그 변형을 적극 반영해 (내신에도 수능형이 많이 나온다).\n" +
  "- 특히 수학은 해당 학년 부교재 수준의 고난도 문항을 기준으로 삼아 (기준 교재가 주어지면 그 교재의 난이도·스타일을 최우선으로).\n" +
  "- 문제·정답·풀이는 스스로 한 번 더 검산해서 오류가 없게 해.";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---- 간격 반복 복습(뇌과학 망각곡선): 복습 단계가 오를수록 다음 복습일이 멀어짐 ----
const REVIEW_GAPS = [1, 3, 7, 14]; // 미복습→1일, 1차→3일, 2차→7일, (그 이상 14일)

function parseYmd(s) {
  const p = String(s || "").split(".").map((x) => parseInt(x, 10));
  if (p.length < 3 || p.some((n) => isNaN(n))) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}

function daysFromToday(dateObj) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateObj); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// 날짜 문자열('2026-07-02' 또는 '2026.07.02')을 Date로
function parseDate(s) {
  const p = String(s || "").split(/[.\-/]/).map((x) => parseInt(x, 10));
  if (p.length < 3 || p.some((n) => isNaN(n))) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
// 시험 D-day: 오늘 포함 이후 가장 가까운 시험일까지 남은 일수 (0=오늘, null=없음/지남)
function examDday(exam) {
  if (!exam || !Array.isArray(exam.days) || !exam.days.length) return null;
  const ds = exam.days.map((d) => parseDate(d.date)).filter(Boolean).map(daysFromToday).filter((n) => n >= 0).sort((a, b) => a - b);
  return ds.length ? ds[0] : null;
}
function fmtDate(s) {
  const d = parseDate(s);
  if (!d) return s || "";
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${wd})`;
}
// 가장 가까운 다가오는 시험일 {date, subjects, n} (없으면 null)
function examNext(exam) {
  if (!exam || !Array.isArray(exam.days)) return null;
  const up = exam.days.filter((d) => d.date).map((d) => ({ ...d, n: daysFromToday(parseDate(d.date)) })).filter((d) => d.n >= 0).sort((a, b) => a.n - b.n);
  return up.length ? up[0] : null;
}

// 다음 복습 예정 정보 (정복(status 3)은 안내 없음)
function nextReviewInfo(entry) {
  if (!entry || entry.status >= 3) return null;
  const log = entry.reviewLog || [];
  const base = parseYmd(log.length ? log[log.length - 1] : entry.createdAt);
  if (!base) return null;
  const gap = REVIEW_GAPS[Math.min(entry.status, REVIEW_GAPS.length - 1)];
  const next = new Date(base); next.setDate(next.getDate() + gap);
  const days = daysFromToday(next);
  return { days, due: days <= 0, dateStr: `${next.getMonth() + 1}.${next.getDate()}` };
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// messages 배열을 window.claude.complete 용 단일 텍스트 프롬프트로 펼침 (사진은 못 실으므로 개수만 표시)
function messagesToText(messages) {
  const parts = [];
  let imageCount = 0;
  (messages || []).forEach((m) => {
    const tag = m.role === "assistant" ? "[이전 답변]\n" : "";
    const c = m.content;
    if (typeof c === "string") {
      if (c.trim()) parts.push(tag + c);
    } else if (Array.isArray(c)) {
      c.forEach((b) => {
        if (b.type === "text" && b.text) parts.push(tag + b.text);
        else if (b.type === "image") imageCount++;
      });
    }
  });
  return { text: parts.join("\n\n"), imageCount };
}

// AI 호출: ① Claude 앱 안 채널(window.claude.complete)을 우선 사용 — API 키·추가요금 없이
//          아이패드·공유 링크에서도 작동하고 fetch를 아예 하지 않음.
//        ② 사진 인식이 꼭 필요하거나(발상카드·필기채점) 위 채널이 없을 때만 직접 API 호출을 시도.
// opts.needsVision === true 이면 사진을 반드시 읽어야 하는 기능 → 채널로는 불가, fetch 실패 시 visionRequired 신호.
async function callClaude(messages, opts) {
  const needsVision = !!(opts && opts.needsVision);
  const canComplete =
    typeof window !== "undefined" && window.claude && typeof window.claude.complete === "function";

  // ① 텍스트 기반 요청은 Claude 앱 채널로 (사진 없이도 되는 기능은 여기서 인라인 처리)
  if (!needsVision && canComplete) {
    const { text, imageCount } = messagesToText(messages);
    const prompt =
      text + (imageCount ? "\n\n(참고: 첨부 사진은 이 채널로 전달되지 않으니 위 텍스트 정보만으로 최대한 답해줘.)" : "");
    try {
      const reply = await window.claude.complete(prompt);
      if (reply && String(reply).trim()) return String(reply);
    } catch (e) {
      // 채널 실패 시 아래 직접 호출로 폴백
    }
  }

  // ② 직접 API 호출 (claude.ai 편집 미리보기에서는 사진 포함 작동)
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages }),
    });
  } catch (e) {
    if (needsVision) {
      const err = new Error("사진 인식 필요");
      err.visionRequired = true;
      throw err;
    }
    const err = new Error("네트워크 차단");
    err.detail = "네트워크 차단 (fetch 실패: " + ((e && e.message) || "원인 미상") + ")";
    throw err;
  }
  let data = null;
  try { data = await response.json(); } catch (e) {}
  if (!response.ok || (data && data.error)) {
    if (needsVision) {
      const err = new Error("사진 인식 필요");
      err.visionRequired = true;
      throw err;
    }
    const emsg = data && data.error && data.error.message ? data.error.message : "";
    const err = new Error(emsg || "HTTP " + response.status);
    err.detail = "HTTP " + response.status + (emsg ? " · " + emsg.slice(0, 120) : "");
    throw err;
  }
  return ((data && data.content) || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .filter(Boolean)
    .join("\n");
}

// 연결 실패 시 질문을 복사해 새 채팅에 붙여넣을 수 있게 하는 안전장치
function copyText(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t); return true; }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

// 정복 축하 마스코트 — 왕관 쓴 호두 킹 (실제 사진)
const HODU_KING = "data:image/jpeg;base64,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";

// 사용자가 설정한 '오답 질문방' 링크 (없으면 새 채팅). 컴포넌트가 setClaudeRoom으로 갱신.
let CLAUDE_ROOM = "";
function setClaudeRoom(u) { CLAUDE_ROOM = (u || "").trim(); }

// 처음 한 번만 질문방에 붙여넣을 세팅 문구
const ROOM_SETUP_TEXT =
  "이 방은 내 오답을 도와주는 방이야. 앞으로 내가 문제 사진을 올리면, 먼저 힌트로 방향을 잡아주고 내가 '풀이 보여줘'라고 하면 그때 단계별로 풀어줘. 대한민국 자사고 고등학생 수준으로, 수식은 일반 텍스트로 알려줘.";

// 사진이 꼭 필요한 기능용: 질문을 복사하고 Claude 앱을 연다 (질문방이 설정돼 있으면 그 방으로).
// 버튼 클릭(사용자 제스처)에서 호출해야 새 창이 안 막힌다.
function openInClaudeApp(text) {
  const ok = copyText(text);
  const url = /^https?:\/\/(claude\.ai|www\.anthropic\.com)/.test(CLAUDE_ROOM) ? CLAUDE_ROOM : "https://claude.ai/new";
  try { window.open(url, "_blank"); } catch (e) {}
  return ok;
}

function parseJsonReply(text) {
  let s = String(text || "").replace(/```json|```/g, "").trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch (e) {}
  // 문자열 안의 실제 줄바꿈 등 제어문자 정리 후 재시도
  const cleaned = s.replace(/[\u0000-\u001F]+/g, " ");
  try { return JSON.parse(cleaned); } catch (e) {}
  // 응답이 길어 중간에 잘린 경우: 마지막 완전한 객체까지 살리고 괄호를 닫아 복구
  let tries = 0;
  for (let i = cleaned.length - 1; i > 0 && tries < 30; i--) {
    if (cleaned[i] !== "}") continue;
    tries++;
    const cut = cleaned.slice(0, i + 1);
    let dC = 0, dS = 0, inStr = false, bad = false;
    for (let j = 0; j < cut.length; j++) {
      const c = cut[j];
      if (inStr) {
        if (c === "\\") j++;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") dC++;
      else if (c === "}") dC--;
      else if (c === "[") dS++;
      else if (c === "]") dS--;
      if (dC < 0 || dS < 0) { bad = true; break; }
    }
    if (bad || inStr) continue;
    const fixed = cut + "]".repeat(Math.max(dS, 0)) + "}".repeat(Math.max(dC, 0));
    try { return JSON.parse(fixed); } catch (e) {}
  }
  throw new Error("응답 형식 복구 실패");
}

// 이스케이프된 응답(\\", \\n)을 사람이 읽는 형태로 복원
function jsonUnescapeLite(t) {
  return String(t || "")
    .replace(/\\\\/g, "\u0000")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\u0000/g, "\\");
}

function pickField(o, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = o ? o[keys[i]] : null;
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

// AI가 키 이름을 다르게 써도(문제/난이도 등) 표준 형태로 정규화 — 빈 문제(백지)는 걸러냄
function normalizeProblemList(parsed) {
  let list = null;
  if (parsed && Array.isArray(parsed.problems)) list = parsed.problems;
  else if (Array.isArray(parsed)) list = parsed;
  if (!list) return [];
  return list
    .map((p) => ({
      level: pickField(p, ["level", "난이도"]) || "상",
      question: pickField(p, ["question", "문제", "problem", "q"]),
      hint: pickField(p, ["hint", "힌트", "tip"]),
      answer: pickField(p, ["answer", "정답", "solution", "풀이"]),
    }))
    .filter((p) => p.question);
}

// 최후의 폴백: 어떤 응답이든 사람이 읽을 수 있는 텍스트로 변환
function humanizeReply(t) {
  return jsonUnescapeLite(String(t || ""))
    .replace(/```json|```/g, "")
    .replace(/"(problems|level|question|hint|answer|난이도|문제|힌트|정답)"\s*:/g, "\n[$1] ")
    .replace(/[{}\[\]"]+/g, " ")
    .replace(/\s*,\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// 변형문제 응답에서 어떤 형식 변주가 와도 문제 목록을 건져내는 통합 추출기
function extractProblems(reply) {
  let parsed = null;
  try { parsed = parseJsonReply(reply); } catch (e) {}
  if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; } }
  let out = normalizeProblemList(parsed);
  if (out.length) return out;
  // 따옴표가 이스케이프된 응답: 한 겹 벗겨서 재시도
  if (/\\"/.test(String(reply || ""))) {
    try { out = normalizeProblemList(parseJsonReply(jsonUnescapeLite(reply))); } catch (e) {}
    if (out.length) return out;
  }
  // 정규식으로 구조를 직접 건지기 (깨진 JSON에서도 question/hint/answer 회수)
  const txt = jsonUnescapeLite(String(reply || "").replace(/```json|```/g, ""));
  function grab(names) {
    const re = new RegExp('"(?:' + names + ')"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,|\\})', "g");
    const arr = [];
    let m;
    while ((m = re.exec(txt))) arr.push(m[1].trim());
    return arr;
  }
  const qs = grab("question|문제");
  if (qs.length) {
    const lv = grab("level|난이도");
    const hs = grab("hint|힌트");
    const ans = grab("answer|정답");
    return qs.map((q, i) => ({ level: lv[i] || "상", question: q, hint: hs[i] || "", answer: ans[i] || "" })).filter((p) => p.question);
  }
  return [];
}

function imgBlocks(dataUrls) {
  return (dataUrls || []).slice(0, 3).map((src) => ({
    type: "image",
    source: { type: "base64", media_type: src.startsWith("data:image/png") ? "image/png" : "image/jpeg", data: src.split(",")[1] },
  }));
}

// ---- ❓ 기능 옆 도움말 버튼 ----
function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="help-wrap">
      <button className="help-btn" onClick={() => setOpen(!open)} aria-label="사용법">?</button>
      {open && <span className="help-pop" onClick={() => setOpen(false)}>{text}</span>}
    </span>
  );
}

// ---- ✍️ 풀이 패드 (펜슬 필기: 모눈·색깔펜·지우개·직선자·포스트잇·AI 채점) ----
function SolvePad({ gradeFn, bridge, solveFn, problem }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1E2A3A");
  const [penWidth, setPenWidth] = useState(2.5); // 펜 두께
  const [notes, setNotes] = useState([]);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState("");
  const [bridgeText, setBridgeText] = useState(""); // Claude 앱으로 보낼 채점 질문 (사진 인식 불가 시)
  const [solving, setSolving] = useState(false);
  const [solveResult, setSolveResult] = useState(""); // 📖 간략 풀이 결과
  const [bgGrid, setBgGrid] = useState(true);    // 모눈 배경 on/off (기본=모눈)
  const [penOnly, setPenOnly] = useState(false); // 손바닥 터치 방지 (애플펜슬만 인식)
  const [leftPct, setLeftPct] = useState(48); // 좌우분할 시 문제(왼쪽) 너비 %
  const splitRef = useRef(null);
  const drawing = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const snapshot = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const PAD_H = 400;

  function ctx() { return canvasRef.current.getContext("2d"); }

  // 캔버스는 투명하게 비운다 (배경·모눈은 CSS가 그려서, 배경을 켜고 꺼도 필기가 지워지지 않음)
  function clearCanvas() {
    const c = canvasRef.current;
    const g = ctx();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.restore();
  }

  // 캔버스를 부모 너비에 맞춰 다시 크기 잡기 (좌우분할 비율 조정·회전 시). 필기는 늘려서 보존.
  function fitCanvas(initial) {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(c.parentElement.clientWidth, 40);
    if (!initial && Math.abs(c.style.width ? parseFloat(c.style.width) - w : w) < 1) return;
    let prev = null, pw = c.width, ph = c.height;
    if (!initial) { try { prev = c.toDataURL(); } catch (e) {} }
    c.width = w * dpr;
    c.height = PAD_H * dpr;
    c.style.width = w + "px";
    c.style.height = PAD_H + "px";
    const g = ctx();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.scale(dpr, dpr);
    clearCanvas();
    if (prev) {
      const img = new Image();
      img.onload = () => {
        const gg = ctx();
        gg.save(); gg.setTransform(1, 0, 0, 1, 0, 0);
        gg.globalCompositeOperation = "source-over";
        gg.drawImage(img, 0, 0, pw, ph, 0, 0, c.width, c.height);
        gg.restore();
      };
      img.src = prev;
    }
  }

  useEffect(() => {
    fitCanvas(true);
    const wrap = canvasRef.current && canvasRef.current.parentElement;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    let t = null;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => fitCanvas(false), 120); });
    ro.observe(wrap);
    return () => { clearTimeout(t); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 좌우분할 경계선 드래그로 비율 조정 (25%~75%)
  function dividerDown(e) {
    e.preventDefault();
    const rect = splitRef.current.getBoundingClientRect();
    const move = (ev) => {
      let pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(75, Math.max(25, pct)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // 새 획 직전의 상태를 undo 스택에 저장하고 redo는 비운다
  function pushUndo() {
    try {
      undoStack.current.push(canvasRef.current.toDataURL());
      if (undoStack.current.length > 25) undoStack.current.shift();
      redoStack.current = [];
    } catch (e) {}
  }

  function hexA(hex, a) {
    const h = String(hex).replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), gg = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${gg},${b},${a})`;
  }
  function applyStroke(g) {
    g.lineCap = "round"; g.lineJoin = "round";
    if (tool === "eraser") {
      g.globalCompositeOperation = "destination-out"; // 투명하게 지움
      g.strokeStyle = "rgba(0,0,0,1)";
      g.lineWidth = 18;
    } else if (tool === "highlighter") {
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = hexA(color, 0.32); // 반투명 형광펜
      g.lineWidth = penWidth * 6 + 6;
    } else {
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = color;
      g.lineWidth = penWidth;
    }
  }

  // dataURL 이미지를 캔버스에 복원 (composite를 정상으로 되돌려 그린다)
  function restoreFrom(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const g = ctx(); const c = canvasRef.current;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0);
      g.restore();
    };
    img.src = dataUrl;
  }

  function onDown(e) {
    if (e.target !== canvasRef.current) return;
    if (penOnly && e.pointerType && e.pointerType !== "pen") return; // 손바닥·손가락 무시
    e.preventDefault();
    if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    start.current = getPos(e);
    pushUndo();
    const g = ctx();
    if (tool === "line") {
      snapshot.current = g.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    } else {
      g.beginPath();
      g.moveTo(start.current.x, start.current.y);
    }
  }

  function onMove(e) {
    if (!drawing.current) return;
    if (penOnly && e.pointerType && e.pointerType !== "pen") return;
    e.preventDefault();
    const p = getPos(e);
    const g = ctx();
    if (tool === "line") {
      g.putImageData(snapshot.current, 0, 0);
      g.beginPath(); applyStroke(g);
      g.moveTo(start.current.x, start.current.y);
      g.lineTo(p.x, p.y); g.stroke();
    } else {
      applyStroke(g);
      g.lineTo(p.x, p.y); g.stroke();
      g.beginPath(); g.moveTo(p.x, p.y);
    }
  }

  function onUp() {
    drawing.current = false;
    snapshot.current = null;
    try { ctx().globalCompositeOperation = "source-over"; } catch (e) {}
  }

  function undo() {
    if (!undoStack.current.length) return;
    try { redoStack.current.push(canvasRef.current.toDataURL()); } catch (e) {}
    restoreFrom(undoStack.current.pop());
  }

  function redo() {
    if (!redoStack.current.length) return;
    try { undoStack.current.push(canvasRef.current.toDataURL()); } catch (e) {}
    restoreFrom(redoStack.current.pop());
  }

  function clearPad() {
    try { undoStack.current.push(canvasRef.current.toDataURL()); redoStack.current = []; } catch (e) {}
    clearCanvas();
    setGradeResult("");
    setBridgeText("");
  }

  // 채점용 내보내기: 투명 캔버스를 흰 종이 위에 합성해야 어두운 글씨가 안 사라짐 (JPEG는 투명→검정)
  function exportForGrade() {
    const c = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = c.width; tmp.height = c.height;
    const tg = tmp.getContext("2d");
    tg.fillStyle = "#FBFCF9";
    tg.fillRect(0, 0, tmp.width, tmp.height);
    tg.drawImage(c, 0, 0);
    return tmp.toDataURL("image/jpeg", 0.82);
  }

  function addNote() { setNotes((n) => [...n, { id: makeId(), x: 16 + n.length * 14, y: 16 + n.length * 14, text: "" }]); }
  function delNote(id) { setNotes((n) => n.filter((x) => x.id !== id)); }
  function noteDragStart(e, id) {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const note = notes.find((n) => n.id === id);
    const dx = e.clientX - rect.left - note.x, dy = e.clientY - rect.top - note.y;
    const move = (ev) => {
      const r = wrapRef.current.getBoundingClientRect();
      const nx = Math.min(Math.max(ev.clientX - r.left - dx, 0), r.width - 130);
      const ny = Math.min(Math.max(ev.clientY - r.top - dy, 0), PAD_H - 80);
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, x: nx, y: ny } : n)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function grade() {
    if (grading) return;
    setGrading(true);
    setGradeResult("");
    setBridgeText("");
    try {
      const drawUrl = exportForGrade();
      const noteText = notes.filter((n) => n.text.trim()).map((n, i) => `메모${i + 1}: ${n.text.trim()}`).join("\n");
      const result = await gradeFn(drawUrl, noteText);
      setGradeResult(result || "채점 결과를 받지 못했어요.");
    } catch (e) {
      const bp = bridge ? bridge() : "첨부한 손글씨 풀이를 읽고 채점해줘. 정답 여부와 잘한 점·틀린 부분을 알려줘.";
      copyText(bp);
      setBridgeText(bp);
      setGradeResult(
        (e && e.visionRequired)
          ? "필기 채점은 손글씨 사진을 읽어야 해서 이 화면에선 바로 못 해요. 채점 질문을 복사해뒀어요 — 아래 버튼으로 Claude 앱을 열고, 붙여넣은 뒤 이 풀이 패드 화면을 캡처해 첨부하면 채점받을 수 있어요."
          : "연결이 잠시 원활하지 않아 채점 질문을 복사해뒀어요. 아래 버튼으로 Claude 앱에 붙여넣고 이 패드 화면을 캡처해 첨부하세요." + ((e && (e.detail || e.message)) ? "\n\n[진단] " + (e.detail || e.message) : "")
      );
    } finally {
      setGrading(false);
    }
  }

  async function solve() {
    if (solving || !solveFn) return;
    setSolving(true);
    setSolveResult("");
    try {
      const result = await solveFn();
      setSolveResult(result || "풀이를 받지 못했어요.");
    } catch (e) {
      setSolveResult(
        (e && e.visionRequired)
          ? "이 문제의 간략 풀이는 문제 사진을 읽어야 해서 이 화면에선 안 나와요. 위 채점을 Claude 앱에서 받을 때 '풀이도 짧게 알려줘'라고 함께 물어보세요."
          : "풀이를 가져오지 못했어요. 잠시 후 다시 눌러주세요." + ((e && (e.detail || e.message)) ? "\n\n[진단] " + (e.detail || e.message) : "")
      );
    } finally {
      setSolving(false);
    }
  }

  const COLORS = ["#1E2A3A", "#D6453D", "#2B57C6", "#2E7D4F", "#E8B21E"];
  const WIDTHS = [1.6, 2.5, 4]; // 얇게 · 보통 · 굵게

  return (
    <div className="pad">
      <div className="pad-bar">
        {/* 색 */}
        <div className="pad-group">
          {COLORS.map((c) => (
            <button key={c} className={color === c && tool !== "eraser" ? "pad-color on" : "pad-color"}
              style={{ background: c }} onClick={() => { setColor(c); if (tool === "eraser") setTool("pen"); }} aria-label="펜 색" title="펜 색" />
          ))}
        </div>
        <span className="pad-div" />
        {/* 도구 */}
        <div className="pad-group">
          <button className={tool === "pen" ? "pad-tool on" : "pad-tool"} onClick={() => setTool("pen")} title="펜">✏️</button>
          <button className={tool === "highlighter" ? "pad-tool on" : "pad-tool"} onClick={() => setTool("highlighter")} title="형광펜">🖍</button>
          <button className={tool === "line" ? "pad-tool on" : "pad-tool"} onClick={() => setTool("line")} title="직선(축·점근선)">📏</button>
          <button className={tool === "eraser" ? "pad-tool on" : "pad-tool"} onClick={() => setTool("eraser")} title="지우개">🧽</button>
        </div>
        <span className="pad-div" />
        {/* 두께 */}
        <div className="pad-group">
          {WIDTHS.map((w, i) => (
            <button key={w} className={penWidth === w ? "pad-w on" : "pad-w"} onClick={() => setPenWidth(w)} title={["얇게", "보통", "굵게"][i]} aria-label={["얇게", "보통", "굵게"][i]}>
              <span className="pad-w-dot" style={{ width: 4 + i * 4, height: 4 + i * 4 }} />
            </button>
          ))}
        </div>
        <span className="pad-div" />
        {/* 실행 */}
        <div className="pad-group">
          <button className="pad-tool" onClick={undo} title="되돌리기">↩️</button>
          <button className="pad-tool" onClick={redo} title="다시하기">↪️</button>
          <button className="pad-tool" onClick={clearPad} title="전체 지우기">🗑</button>
        </div>
        <span className="pad-div" />
        {/* 옵션 */}
        <div className="pad-group">
          <button className={bgGrid ? "pad-tool on" : "pad-tool"} onClick={() => setBgGrid(!bgGrid)} title="모눈/기본 배경">▦</button>
          <button className={penOnly ? "pad-tool on" : "pad-tool"} onClick={() => setPenOnly(!penOnly)} title="손바닥 방지(펜슬만)">✋</button>
          <button className="pad-tool" onClick={addNote} title="포스트잇">🗒</button>
        </div>
        <HelpTip text="🖍 형광펜은 반투명하게 칠해져요. 색·두께를 고르고 애플펜슬이나 손가락으로 쓰세요. ↩️↪️로 획을 오가고, ▦로 모눈/기본 배경을 바꿔요(필기 유지). ✋ 손바닥 방지를 켜면 펜슬로만 그려져요. 📏 직선은 축·점근선에 좋아요." />
      </div>
      {(() => {
        const padWrap = (
          <div className={bgGrid ? "pad-wrap grid" : "pad-wrap"} ref={wrapRef}>
            <canvas ref={canvasRef} className="pad-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            {notes.map((n) => (
              <div key={n.id} className="pad-note" style={{ left: n.x, top: n.y }}>
                <div className="pad-note-bar" onPointerDown={(e) => noteDragStart(e, n.id)}>
                  <span>≡</span>
                  <button onClick={() => delNote(n.id)} aria-label="포스트잇 삭제">✕</button>
                </div>
                <textarea value={n.text} placeholder="메모…" onChange={(e) => setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)))} />
              </div>
            ))}
          </div>
        );
        if (!problem) return padWrap;
        return (
          <div className="pad-split" ref={splitRef}>
            <div className="pad-problem" style={{ width: leftPct + "%" }}>
              <div className="pad-problem-label">문제</div>
              {problem}
            </div>
            <div className="pad-divider" onPointerDown={dividerDown} role="separator" aria-label="문제·풀이 비율 조정" title="드래그해서 좌우 비율 조정">⋮</div>
            <div className="pad-main" style={{ width: (100 - leftPct) + "%" }}>{padWrap}</div>
          </div>
        );
      })()}
      <div className="pad-actions">
        {solveFn && (
          <button className="wnt-mini" onClick={solve} disabled={solving} style={{ marginRight: "auto" }}>
            {solving ? "풀이 가져오는 중…" : "📖 간략 풀이"}
          </button>
        )}
        <button className="wnt-btn-primary" onClick={grade} disabled={grading}>{grading ? "채점 중… 🔍" : "✅ AI 채점 받기"}</button>
      </div>
      {gradeResult && <div className="pad-result">{gradeResult}</div>}
      {bridgeText && (
        <div className="pad-actions">
          <button className="wnt-mini idea" onClick={() => openInClaudeApp(bridgeText)}>📲 Claude 앱에서 채점받기</button>
        </div>
      )}
      {solveResult && <div className="pad-result">📖 {solveResult}</div>}
    </div>
  );
}

// 사진 자르기(크롭) 모달 — 문제만 남기고 잘라서 풀 때 크게 보이게
function CropModal({ src, onApply, onClose }) {
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const disp = useRef({ w: 0, h: 0 });

  function initRect() {
    const im = imgRef.current;
    if (!im) return;
    const w = im.clientWidth, h = im.clientHeight;
    disp.current = { w, h };
    setRect({ x: w * 0.08, y: h * 0.08, w: w * 0.84, h: h * 0.84 });
    setReady(true);
  }
  function clampRect(r) {
    const { w: W, h: H } = disp.current;
    let w = Math.max(36, Math.min(r.w, W));
    let h = Math.max(36, Math.min(r.h, H));
    let x = Math.max(0, Math.min(r.x, W - w));
    let y = Math.max(0, Math.min(r.y, H - h));
    return { x, y, w, h };
  }
  function dragBody(e) {
    if (e.target !== e.currentTarget) return; // 핸들은 제외
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, r0 = { ...rect };
    const move = (ev) => setRect(clampRect({ ...r0, x: r0.x + (ev.clientX - sx), y: r0.y + (ev.clientY - sy) }));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }
  function dragCorner(e, cx, cy) {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, r0 = { ...rect };
    const move = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let nr = { ...r0 };
      if (cx < 0) { nr.x = r0.x + dx; nr.w = r0.w - dx; } else { nr.w = r0.w + dx; }
      if (cy < 0) { nr.y = r0.y + dy; nr.h = r0.h - dy; } else { nr.h = r0.h + dy; }
      if (nr.w < 36) { nr.w = 36; if (cx < 0) nr.x = r0.x + r0.w - 36; }
      if (nr.h < 36) { nr.h = 36; if (cy < 0) nr.y = r0.y + r0.h - 36; }
      setRect(clampRect(nr));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }
  function apply() {
    const im = imgRef.current;
    const { w: W, h: H } = disp.current;
    const natW = im.naturalWidth, natH = im.naturalHeight;
    const sx = rect.x / W * natW, sy = rect.y / H * natH;
    const sw = rect.w / W * natW, sh = rect.h / H * natH;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(Math.round(sw), 1);
    canvas.height = Math.max(Math.round(sh), 1);
    const im2 = new Image();
    im2.onload = () => {
      canvas.getContext("2d").drawImage(im2, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      onApply(canvas.toDataURL("image/jpeg", 0.85));
    };
    im2.src = src;
  }
  const handles = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <div className="wnt-crop-backdrop" onClick={onClose}>
      <div className="wnt-crop" onClick={(e) => e.stopPropagation()}>
        <div className="wnt-crop-title">✂️ 문제만 남기고 잘라요 <span>모서리를 끌어 크기 조절</span></div>
        <div className="wnt-crop-stage">
          <img ref={imgRef} src={src} alt="자를 사진" className="wnt-crop-img" onLoad={initRect} draggable={false} />
          {ready && (
            <div className="wnt-crop-box" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} onPointerDown={dragBody}>
              {handles.map(([cx, cy], i) => (
                <span key={i} className="wnt-crop-handle"
                  style={{ left: cx < 0 ? -9 : "auto", right: cx > 0 ? -9 : "auto", top: cy < 0 ? -9 : "auto", bottom: cy > 0 ? -9 : "auto" }}
                  onPointerDown={(e) => dragCorner(e, cx, cy)} />
              ))}
            </div>
          )}
        </div>
        <div className="wnt-crop-btns">
          <button className="wnt-btn-ghost" onClick={onClose}>취소</button>
          <button className="wnt-btn-primary" onClick={apply}>✂️ 자르기 적용</button>
        </div>
      </div>
    </div>
  );
}

// 사진 확대(줌) 모달 — 풀 때 문제를 크게 보기
function ZoomModal({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="wnt-zoom-backdrop" onClick={onClose}>
      <div className="wnt-zoom-bar" onClick={(e) => e.stopPropagation()}>
        <button className="wnt-mini" onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}>➖</button>
        <span className="wnt-zoom-pct">{Math.round(zoom * 100)}%</span>
        <button className="wnt-mini" onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}>➕</button>
        <button className="wnt-mini strong" onClick={onClose}>✕ 닫기</button>
      </div>
      <div className="wnt-zoom-scroll" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="확대한 문제 사진" className="wnt-zoom-img" style={{ width: zoom * 100 + "%" }} />
      </div>
    </div>
  );
}

export default function WrongNoteTracker() {
  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [customTags, setCustomTags] = useState([]);
  const [motto, setMotto] = useState(""); // 상단 명언·공부 자극 문구
  const [claudeRoom, setClaudeRoomState] = useState(""); // 오답 질문방 Claude 링크
  const [study, setStudy] = useState({ lastDate: "", streak: 0, bestStreak: 0 }); // 연속 학습 불꽃
  const [dailyGoal, setDailyGoal] = useState(3); // 오늘의 목표 개수
  const [exam, setExam] = useState({ name: "", days: [] }); // 시험 D-day 시간표
  const [examOpen, setExamOpen] = useState(false); // 시험 팝오버 열기
  const [dueDismiss, setDueDismiss] = useState(false); // 오늘 복습 안내 배너 닫기
  const [dueModalClosed, setDueModalClosed] = useState(false); // 오늘 복습 팝업 닫기
  const [crownShow, setCrownShow] = useState(false); // 정복 왕관 축하 연출
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [tab, setTab] = useState("list"); // list | flash | variant | stats | settings
  const [formOpen, setFormOpen] = useState(false);

  // ---- 필터 상태 ----
  const [fSubject, setFSubject] = useState("전체");
  const [fTag, setFTag] = useState("전체");
  const [fStatus, setFStatus] = useState("전체");
  const [fStarOnly, setFStarOnly] = useState(false);
  const [fDueOnly, setFDueOnly] = useState(false); // 오늘 복습할 오답만
  const [listView, setListView] = useState("active"); // active=복습 중, done=맞은 문제
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // ---- 선택 삭제 모드 ----
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState({}); // id → bool

  // ---- 입력 폼 상태 ----
  const emptyForm = { subject: "대수", unit: "", source: "", tags: [], memo: "", photos: [], timeSpent: "" };
  const [form, setForm] = useState(emptyForm);
  const [newTagInput, setNewTagInput] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);

  // ---- 문제 사진 상태 ----
  const MAX_PHOTOS = 5;
  const MAX_SOL_PHOTOS = 2;
  const [imageCache, setImageCache] = useState({});
  const [openImages, setOpenImages] = useState({});
  const [openCard, setOpenCard] = useState(null); // 펼쳐진(풀이 모드) 카드 id — 한 번에 하나
  const [cardPadOpen, setCardPadOpen] = useState({}); // 기록 카드 내 풀이 패드 열림 여부
  const [cropTarget, setCropTarget] = useState(null); // 자르기 대상 폼 사진 index
  const [zoomSrc, setZoomSrc] = useState(null); // 확대해서 볼 사진 (라이트박스)

  // ---- 풀이 기록 상태 ----
  const [solFormOpen, setSolFormOpen] = useState({});
  const [solForm, setSolForm] = useState({ text: "", photos: [], solved: false });
  const [solOpen, setSolOpen] = useState({});
  const [solPhotoCache, setSolPhotoCache] = useState({});

  // ---- AI 풀이 도우미 상태 ----
  const [aiOpen, setAiOpen] = useState({});
  const [aiMode, setAiMode] = useState({});
  const [aiChats, setAiChats] = useState({});
  const [aiInput, setAiInput] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  // ---- 발상 카드 상태 ----
  const [insightLoading, setInsightLoading] = useState({});
  const [insightOpen, setInsightOpen] = useState({});
  const [insightMsg, setInsightMsg] = useState({});
  const [insightBridge, setInsightBridge] = useState({}); // id → Claude 앱으로 보낼 발상 요약 질문

  // ---- 문제 풀이(AI 해설) 상태 ----
  const [explainLoading, setExplainLoading] = useState({});
  const [explainResult, setExplainResult] = useState({});
  const [explainBridge, setExplainBridge] = useState({});

  // ---- 내 풀이 채점 상태 (풀이 기록별) ----
  const [solGradeLoading, setSolGradeLoading] = useState({});
  const [solGrade, setSolGrade] = useState({});
  const [solGradeBridge, setSolGradeBridge] = useState({});

  // ---- 카드 내 변형문제 상태 ----
  const [variantOpen, setVariantOpen] = useState({});
  const [variants, setVariants] = useState({});
  const [variantLoading, setVariantLoading] = useState({});
  const [variantReveal, setVariantReveal] = useState({});

  // ---- 변형문제 탭 상태 ----
  const [vtSubject, setVtSubject] = useState("전체");
  const [vtEntryId, setVtEntryId] = useState("sum"); // "sum" = 실수 패턴 종합
  const [vtProblems, setVtProblems] = useState([]);
  const [vtLoading, setVtLoading] = useState(false);
  const [vtReveal, setVtReveal] = useState({});
  const [vtPadOpen, setVtPadOpen] = useState({});
  const [vtLevels, setVtLevels] = useState(["쌍둥이", "상", "최상"]); // 출제할 난이도 선택
  const [vtCollapsed, setVtCollapsed] = useState({}); // 변형문제 개별 접기
  const [vtPadNonce, setVtPadNonce] = useState({}); // '다시 풀기' 시 풀이 패드 초기화용
  const [vtTimerSec, setVtTimerSec] = useState(0);
  const [vtTimerOn, setVtTimerOn] = useState(false);
  const [vtExtends, setVtExtends] = useState(0);

  // ---- 플래시카드 상태 ----
  const [flashSubject, setFlashSubject] = useState("전체");
  const [flashDeck, setFlashDeck] = useState([]);
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashHint, setFlashHint] = useState(false);
  const [flashMemo, setFlashMemo] = useState(false);
  const [flashDelAsk, setFlashDelAsk] = useState(false);
  const [flashRetryOnly, setFlashRetryOnly] = useState(false);
  const [flashStarOnly, setFlashStarOnly] = useState(false);
  const [flashPadOpen, setFlashPadOpen] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [timerMode, setTimerMode] = useState("stop"); // stop=스톱워치, count=3분 타이머
  const [extendsUsed, setExtendsUsed] = useState(0); // +1분 추가 사용 횟수 (최대 2회)
  const [flashTimeout, setFlashTimeout] = useState(false);
  const [gradMsg, setGradMsg] = useState(""); // 졸업 안내 문구

  // ---- 설정 상태 ----
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [bookSubject, setBookSubject] = useState("대수");
  const [bookInput, setBookInput] = useState("");
  const [tagPreviewSubject, setTagPreviewSubject] = useState("대수");
  const [settingMsg, setSettingMsg] = useState("");
  const [aiChecking, setAiChecking] = useState(false);
  const [aiCheckMsg, setAiCheckMsg] = useState("");
  const [resetAsk, setResetAsk] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ---- 저장소 ----
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
          if (Array.isArray(parsed.subjects) && parsed.subjects.length && parsed.subjects[0].name) {
            // 이전 버전 데이터에는 book 필드가 없으므로 기본값에서 병합
            const merged = parsed.subjects.map((s) => {
              if (s.book !== undefined) return s;
              const def = DEFAULT_SUBJECTS.find((d) => d.name === s.name);
              return def && def.book ? { ...s, book: def.book } : s;
            });
            setSubjects(merged);
          }
          if (Array.isArray(parsed.customTags)) setCustomTags(parsed.customTags);
          if (typeof parsed.motto === "string") setMotto(parsed.motto);
          if (typeof parsed.claudeRoom === "string") { setClaudeRoomState(parsed.claudeRoom); setClaudeRoom(parsed.claudeRoom); }
          if (parsed.study && typeof parsed.study === "object") setStudy(parsed.study);
          if (typeof parsed.dailyGoal === "number" || parsed.dailyGoal === "all") setDailyGoal(parsed.dailyGoal);
          if (parsed.exam && typeof parsed.exam === "object") setExam(parsed.exam);
        }
      } catch (e) {
        // 저장된 데이터가 아직 없는 경우 — 빈 상태로 시작
      }
      try {
        const d = await window.storage.get("wrongnote:draft");
        if (d && d.value) {
          const df = JSON.parse(d.value);
          if (df && (df.unit || (df.photos || []).length > 0 || df.memo)) {
            setForm((f) => ({ ...f, ...df }));
            setFormOpen(true);
            setDraftNotice(true);
          }
        }
      } catch (e) {
        // 임시 저장된 초안이 없는 경우
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 작성 중이던 오답 기록 자동 임시저장 — 사진 첨부 중 앱이 새로고침돼도 복구돼요
  useEffect(() => {
    if (loading || !formOpen) return;
    const t = setTimeout(() => {
      // 사진은 용량이 커서 임시저장에서 제외 (본저장은 사진 포함). 글·태그만 자동 복구.
      const light = { ...form, photos: [] };
      window.storage.set("wrongnote:draft", JSON.stringify(light)).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, formOpen, loading]);

  function clearDraft() {
    setDraftNotice(false);
    setPhotoMsg("");
    window.storage.delete("wrongnote:draft").catch(() => {});
  }

  // 저장공간 비우기 — 임시저장 + 어떤 오답에도 연결되지 않은 사진·풀이 데이터(찌꺼기)를 삭제
  const [cleaning, setCleaning] = useState(false);
  async function cleanupStorage() {
    if (cleaning) return;
    setCleaning(true);
    try {
      const validImg = new Set(entries.filter((e) => e.hasImage).map((e) => `wrongnote:img:${e.id}`));
      const validSol = new Set(entries.flatMap((e) => (e.solutions || []).filter((s) => s.hasPhotos).map((s) => `wrongnote:sol:${s.id}`)));
      let keys = [];
      try { const r = await window.storage.list("wrongnote:"); keys = (r && r.keys) || []; } catch (e) {}
      let freed = 0;
      for (const k of keys) {
        if (k === STORAGE_KEY) continue;
        if (k === "wrongnote:draft"
          || (k.indexOf("wrongnote:img:") === 0 && !validImg.has(k))
          || (k.indexOf("wrongnote:sol:") === 0 && !validSol.has(k))) {
          try { await window.storage.delete(k); freed++; } catch (e) {}
        }
      }
      setSaveError(false);
      setSettingMsg(freed > 0 ? `저장공간을 비웠어요! 안 쓰는 데이터 ${freed}개 삭제 완료. 이제 다시 저장해 보세요.` : "지울 찌꺼기 데이터가 없었어요. 사진이 큰 경우일 수 있어요 — 사진을 1~2장만 넣어보세요.");
    } finally {
      setCleaning(false);
    }
  }

  async function saveData(patch) {
    const data = {
      entries: patch.entries !== undefined ? patch.entries : entries,
      subjects: patch.subjects !== undefined ? patch.subjects : subjects,
      customTags: patch.customTags !== undefined ? patch.customTags : customTags,
      motto: patch.motto !== undefined ? patch.motto : motto,
      claudeRoom: patch.claudeRoom !== undefined ? patch.claudeRoom : claudeRoom,
      study: patch.study !== undefined ? patch.study : study,
      dailyGoal: patch.dailyGoal !== undefined ? patch.dailyGoal : dailyGoal,
      exam: patch.exam !== undefined ? patch.exam : exam,
    };
    if (patch.entries !== undefined) setEntries(data.entries);
    if (patch.subjects !== undefined) setSubjects(data.subjects);
    if (patch.customTags !== undefined) setCustomTags(data.customTags);
    if (patch.motto !== undefined) setMotto(data.motto);
    if (patch.claudeRoom !== undefined) { setClaudeRoomState(data.claudeRoom); setClaudeRoom(data.claudeRoom); }
    if (patch.study !== undefined) setStudy(data.study);
    if (patch.dailyGoal !== undefined) setDailyGoal(data.dailyGoal);
    if (patch.exam !== undefined) setExam(data.exam);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(data));
      setSaveError(!res);
    } catch (e) {
      setSaveError(true);
    }
  }

  const subjectNames = subjects.map((s) => s.name);
  const goalIsAll = dailyGoal === "all";
  function goalCount(total) {
    const n = typeof dailyGoal === "number" ? dailyGoal : 3;
    return goalIsAll ? total : Math.min(n, total);
  }
  function subjColor(name) {
    const s = subjects.find((x) => x.name === name);
    return s ? s.color : "#7B8698";
  }
  function subjBook(name) {
    const s = subjects.find((x) => x.name === name);
    return s && s.book ? s.book : "";
  }
  // 태그: 폼에는 현재 과목의 기본 세트 + 사용자 추가 태그, 필터/통계는 실제 기록된 태그 기준
  const usedTags = [...new Set(entries.flatMap((e) => e.tags || []))];
  const formTags = [...new Set([...tagsForSubject(form.subject), ...customTags])];

  // ---- 이미지 유틸 ----
  async function compressFile(file) {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error("read failed"));
      r.readAsDataURL(file);
    });
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = dataUrl;
    });
    // 앱 저장소 한도에 맞게 사진을 목표 용량(~200KB) 이하로 줄인다. 글씨는 읽히게 유지.
    function render(maxDim, quality) {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(Math.round(img.width * scale), 1);
      canvas.height = Math.max(Math.round(img.height * scale), 1);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", quality);
    }
    const TARGET = 200000; // base64 문자 길이 기준 (~150KB 정도)
    let maxDim = 1000, quality = 0.6;
    let out = render(maxDim, quality);
    while (out.length > TARGET && (maxDim > 560 || quality > 0.4)) {
      if (quality > 0.42) quality -= 0.1;
      else { maxDim -= 140; quality = 0.55; }
      out = render(maxDim, quality);
    }
    return out;
  }

  // 크롭 결과(dataURL)를 저장소 한도에 맞게 다시 줄인다
  async function shrinkDataUrl(dataUrl) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    function render(maxDim, quality) {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(Math.round(img.width * scale), 1);
      c.height = Math.max(Math.round(img.height * scale), 1);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", quality);
    }
    const TARGET = 200000;
    let maxDim = 1000, quality = 0.6;
    let out = render(maxDim, quality);
    while (out.length > TARGET && (maxDim > 560 || quality > 0.4)) {
      if (quality > 0.42) quality -= 0.1;
      else { maxDim -= 140; quality = 0.55; }
      out = render(maxDim, quality);
    }
    return out;
  }

  async function applyCropped(index, croppedDataUrl) {
    let out = croppedDataUrl;
    try { out = await shrinkDataUrl(croppedDataUrl); } catch (e) {}
    setForm((f) => ({ ...f, photos: f.photos.map((p, i) => (i === index ? out : p)) }));
    setCropTarget(null);
  }

  async function loadEntryImages(id) {
    if (imageCache[id]) return imageCache[id];
    try {
      const res = await window.storage.get(`wrongnote:img:${id}`);
      if (res && res.value) {
        const arr = res.value.startsWith("data:") ? [res.value] : JSON.parse(res.value);
        if (Array.isArray(arr) && arr.length) {
          setImageCache((c) => ({ ...c, [id]: arr }));
          return arr;
        }
      }
    } catch (e) {}
    return [];
  }

  async function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setPhotoMsg("");
    const picked = files.slice(0, MAX_PHOTOS - form.photos.length);
    const list = [];
    let failed = 0;
    for (const f of picked) {
      try {
        list.push(await compressFile(f));
      } catch (err) {
        failed += 1;
      }
    }
    if (list.length > 0) {
      setForm((f) => ({ ...f, photos: [...f.photos, ...list].slice(0, MAX_PHOTOS) }));
    }
    if (failed > 0) {
      setPhotoMsg(`사진 ${failed}장을 읽지 못했어요 (HEIC 등 형식 문제일 수 있어요). 문제를 스크린샷으로 캡처해서 올리면 확실해요. 작성 중인 내용은 그대로 남아 있어요!`);
    }
  }

  async function handleSolPhotoSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const picked = files.slice(0, MAX_SOL_PHOTOS - solForm.photos.length);
    try {
      const list = [];
      for (const f of picked) list.push(await compressFile(f));
      setSolForm((f) => ({ ...f, photos: [...f.photos, ...list].slice(0, MAX_SOL_PHOTOS) }));
    } catch (err) {
      setSaveError(true);
    }
  }

  function removePhoto(idx) {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  }

  // ---- 기록 CRUD ----
  function toggleFormTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function addCustomTag() {
    const t = newTagInput.trim();
    if (!t) return;
    if (!formTags.includes(t)) saveData({ customTags: [...customTags, t] });
    setForm((f) => (f.tags.includes(t) ? f : { ...f, tags: [...f.tags, t] }));
    setNewTagInput("");
  }

  async function addEntry() {
    if (!form.unit.trim()) return;
    const id = makeId();
    let hasImage = false;
    if (form.photos.length > 0) {
      try {
        const r = await window.storage.set(`wrongnote:img:${id}`, JSON.stringify(form.photos));
        hasImage = !!r;
        if (hasImage) setImageCache((c) => ({ ...c, [id]: form.photos }));
        else setSaveError(true);
      } catch (e) {
        setSaveError(true);
      }
    }
    const entry = {
      id,
      subject: form.subject,
      unit: form.unit.trim(),
      source: form.source.trim(),
      tags: form.tags,
      memo: form.memo.trim(),
      timeSpent: form.timeSpent.trim(),
      status: 0,
      createdAt: todayStr(),
      reviewLog: [],
      solveTimes: [],
      hasImage,
      photoCount: hasImage ? form.photos.length : 0,
      solutions: [],
      insight: null,
      starred: false,
      retry: false,
      wrongCount: 1,      // 기록 시점에 1번 틀린 상태
      correctStreak: 0,   // 플래시카드 연속 정답 수
      graduated: false,   // 2회 연속 정답 → 졸업(플래시카드에서 숨김)
    };
    const sp = studyPatchToday();
    saveData({ entries: [entry, ...entries], ...(sp ? { study: sp } : {}) });
    setForm({ ...emptyForm, subject: form.subject });
    setFormOpen(false);
    clearDraft();
  }

  // 오늘 공부(복습·기록)했음을 표시 → 연속 학습 불꽃 갱신용 patch 반환 (이미 오늘이면 null)
  function studyPatchToday() {
    const today = todayStr();
    if (study.lastDate === today) return null;
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const yStr = `${yd.getFullYear()}.${String(yd.getMonth() + 1).padStart(2, "0")}.${String(yd.getDate()).padStart(2, "0")}`;
    const s = study.lastDate === yStr ? (study.streak || 0) + 1 : 1;
    return { lastDate: today, streak: s, bestStreak: Math.max(study.bestStreak || 0, s) };
  }

  function advanceStatus(id) {
    const target = entries.find((e) => e.id === id);
    const conquering = target && target.status === 2; // 2→3 = 완전 정복!
    const sp = studyPatchToday();
    saveData({
      entries: entries.map((e) =>
        e.id === id && e.status < 3
          ? { ...e, status: e.status + 1, reviewLog: [...(e.reviewLog || []), todayStr()] }
          : e
      ),
      ...(sp ? { study: sp } : {}),
    });
    if (conquering) celebrateCrown();
  }

  function celebrateCrown() {
    setCrownShow(true);
    setTimeout(() => setCrownShow(false), 2400);
  }

  function revertStatus(id) {
    saveData({
      entries: entries.map((e) =>
        e.id === id && e.status > 0
          ? { ...e, status: e.status - 1, reviewLog: (e.reviewLog || []).slice(0, -1) }
          : e
      ),
    });
  }

  function toggleStar(id) {
    saveData({ entries: entries.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)) });
  }

  function markRetry(id, val) {
    saveData({ entries: entries.map((e) => (e.id === id ? { ...e, retry: val } : e)) });
  }

  async function purgeEntryStorage(target) {
    if (!target) return;
    if (target.hasImage) {
      try {
        await window.storage.delete(`wrongnote:img:${target.id}`);
      } catch (e) {}
    }
    for (const s of target.solutions || []) {
      if (s.hasPhotos) {
        try {
          await window.storage.delete(`wrongnote:sol:${s.id}`);
        } catch (e) {}
      }
    }
  }

  async function deleteEntry(id) {
    const target = entries.find((e) => e.id === id);
    saveData({ entries: entries.filter((e) => e.id !== id) });
    setFlashDeck((d) => {
      const nd = d.filter((x) => x !== id);
      setFlashIdx((i) => Math.min(i, Math.max(nd.length - 1, 0)));
      return nd;
    });
    setFlashDelAsk(false);
    setTimerOn(false);
    setTimerSec(0);
    await purgeEntryStorage(target);
  }

  async function deleteSelected() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    const targets = entries.filter((e) => ids.includes(e.id));
    saveData({ entries: entries.filter((e) => !ids.includes(e.id)) });
    setSelected({});
    setSelectMode(false);
    for (const t of targets) await purgeEntryStorage(t);
  }

  async function resetAll() {
    if (resetting) return;
    setResetting(true);
    try {
      // wrongnote: 접두사 키 전부 삭제 (혹시 남은 고아 데이터까지 정리)
      try {
        const listed = await window.storage.list("wrongnote:");
        if (listed && Array.isArray(listed.keys)) {
          for (const k of listed.keys) {
            try {
              await window.storage.delete(k);
            } catch (e) {}
          }
        }
      } catch (e) {}
      await window.storage.set(STORAGE_KEY, JSON.stringify({ entries: [], subjects, customTags, motto }));
      setEntries([]);
      setImageCache({});
      setSolPhotoCache({});
      setVariants({});
      setAiChats({});
      setFlashDeck([]);
      setFlashIdx(0);
      setSettingMsg("모든 기록이 초기화됐어요. 과목·태그 설정은 유지돼요.");
    } catch (e) {
      setSaveError(true);
    } finally {
      setResetAsk(false);
      setResetting(false);
    }
  }

  async function toggleImage(id) {
    if (openImages[id]) {
      setOpenImages((o) => ({ ...o, [id]: false }));
      return;
    }
    const arr = await loadEntryImages(id);
    if (arr.length) setOpenImages((o) => ({ ...o, [id]: true }));
  }

  // ---- 풀이 기록 ----
  function openSolutionForm(id) {
    setSolForm({ text: "", photos: [], solved: false });
    setSolFormOpen((o) => ({ [id]: !o[id] }));
  }

  async function saveSolution(entryId) {
    const text = solForm.text.trim();
    if (!text && solForm.photos.length === 0) return;
    const sid = makeId();
    let hasPhotos = false;
    if (solForm.photos.length > 0) {
      try {
        const r = await window.storage.set(`wrongnote:sol:${sid}`, JSON.stringify(solForm.photos));
        hasPhotos = !!r;
        if (hasPhotos) setSolPhotoCache((c) => ({ ...c, [sid]: solForm.photos }));
        else setSaveError(true);
      } catch (e) {
        setSaveError(true);
      }
    }
    const rec = { id: sid, date: todayStr(), text, hasPhotos };
    saveData({
      entries: entries.map((e) => {
        if (e.id !== entryId) return e;
        const updated = { ...e, solutions: [...(e.solutions || []), rec] };
        if (solForm.solved && e.status < 3) {
          updated.status = e.status + 1;
          updated.reviewLog = [...(e.reviewLog || []), todayStr()];
        }
        return updated;
      }),
    });
    setSolFormOpen((o) => ({ ...o, [entryId]: false }));
    setSolForm({ text: "", photos: [], solved: false });
    setSolOpen((o) => ({ ...o, [entryId]: true }));
  }

  async function toggleSolutions(id) {
    if (solOpen[id]) {
      setSolOpen((o) => ({ ...o, [id]: false }));
      return;
    }
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      for (const s of entry.solutions || []) {
        if (s.hasPhotos && !solPhotoCache[s.id]) {
          try {
            const res = await window.storage.get(`wrongnote:sol:${s.id}`);
            if (res && res.value) {
              const arr = JSON.parse(res.value);
              if (Array.isArray(arr)) setSolPhotoCache((c) => ({ ...c, [s.id]: arr }));
            }
          } catch (e) {}
        }
      }
    }
    setSolOpen((o) => ({ ...o, [id]: true }));
  }

  // ---- AI 풀이 도우미 ----
  async function toggleAi(id) {
    if (aiOpen[id]) {
      setAiOpen((o) => ({ ...o, [id]: false }));
      return;
    }
    await loadEntryImages(id);
    setAiOpen((o) => ({ ...o, [id]: true }));
  }

  // 저장된 문제 사진을 기기(사진첩)로 내려받기 — 클로드 앱에서 첨부해 정확히 물어볼 수 있게
  async function savePhoto(id) {
    const imgs = imageCache[id] || [];
    if (!imgs.length) return;
    // iOS: 공유 시트로 열어 '사진에 추가'로 사진첩에 바로 저장 (다운로드는 사진첩에 안 감)
    try {
      const files = [];
      for (let i = 0; i < imgs.length; i++) {
        const blob = await (await fetch(imgs[i])).blob();
        files.push(new File([blob], `오답_문제_${i + 1}.jpg`, { type: blob.type || "image/jpeg" }));
      }
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: "오답 문제 사진" });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return; // 사용자가 공유 취소
    }
    // 폴백: 다운로드 (공유 미지원 환경)
    imgs.forEach((src, i) => {
      const a = document.createElement("a");
      a.href = src;
      a.download = `오답_문제_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  function buildContext(entry, imgCount, mode) {
    const base =
      "너는 대한민국 자사고 수준 고등학생의 오답 복습을 돕는 과외 선생님이야. 아래는 학생이 기록한 오답 정보야.\n\n" +
      `[과목] ${entry.subject}\n` +
      `[단원·주제] ${entry.unit}\n` +
      `[출처] ${entry.source || "미기재"}\n` +
      `[학생이 기록한 틀린 이유] ${(entry.tags || []).join(", ") || "미기재"}\n` +
      `[학생 메모] ${entry.memo || "없음"}\n` +
      "\n중요: 문제 원문(사진)은 여기 없어. 위 단원·유형·학생이 적은 실수 정보만으로 도와줘. 문제를 못 봤다며 사진을 요구하지 말고, 이 단원에서 그 실수가 나오는 전형적인 상황을 가정해 접근법·핵심 개념·자주 걸리는 함정을 알려줘. 특정 숫자·조건이 꼭 필요하면 학생에게 짧게 되물어봐.\n" +
      "공통 규칙: 친근한 존댓말로 간결하게. 확실하지 않은 내용은 추측하지 말고 그렇다고 말해. 수식은 LaTeX 없이 일반 텍스트로 읽기 쉽게 써. 학생이 기록한 틀린 이유와 관련된 함정을 특히 짚어줘.\n\n";
    if (mode === "direct") {
      return base + "모드: 학생이 풀이 방향을 먼저 보길 원했어. 이 유형의 표준 풀이 흐름을 단계별로 명확하게 보여주고, 각 단계의 근거를 함께 써. 이후 학생의 추가 질문에 답해.";
    }
    return base + "모드: 소크라테스식. 정답이나 전체 풀이를 바로 알려주지 마. 힌트는 한 번에 하나씩만 주고, 학생이 다음 단계를 스스로 생각하도록 짧은 질문으로 유도해. 학생이 '전체 풀이'를 명확히 요청한 경우에만 단계별 풀이를 전부 보여줘.";
  }

  function chooseAiMode(entry, mode) {
    setAiMode((m) => ({ ...m, [entry.id]: mode }));
    // 두 모드 모두 즉시 첫 응답을 보내 '아무 반응 없음'을 없앰
    if (mode === "direct") sendAi(entry, "이 문제의 전체 풀이를 단계별로 보여주세요", mode);
    else sendAi(entry, "이 문제를 어디서부터 접근하면 좋을지 힌트 하나만 주세요", mode);
  }

  // AI 도우미: 사진 문제를 Claude 앱에서 제대로 물어보기 위한 프롬프트
  function aiBridgePrompt(entry) {
    return (
      "이 문제 풀이를 도와줘 (이 채팅에 문제 사진을 첨부할게).\n" +
      `[과목] ${entry.subject} / [단원] ${entry.unit}\n` +
      `[내가 기록한 실수] ${(entry.tags || []).join(", ") || "미기재"}\n` +
      (entry.memo ? `[메모] ${entry.memo}\n` : "") +
      "먼저 힌트로 방향을 잡아주고, 내가 '전체 풀이 보여줘'라고 하면 단계별 풀이를 알려줘."
    );
  }

  function resetAiMode(id) {
    setAiMode((m) => ({ ...m, [id]: null }));
    setAiChats((c) => ({ ...c, [id]: [] }));
  }

  async function sendAi(entry, presetText, modeOverride) {
    const id = entry.id;
    const mode = modeOverride || aiMode[id] || "socratic";
    const text = (presetText != null ? presetText : aiInput[id] || "").trim();
    if (!text || aiLoading[id]) return;

    const newHistory = [...(aiChats[id] || []), { role: "user", text }];
    setAiChats((c) => ({ ...c, [id]: newHistory }));
    setAiInput((v) => ({ ...v, [id]: "" }));
    setAiLoading((l) => ({ ...l, [id]: true }));

    try {
      const imgs = (imageCache[id] || []).slice(0, 3);
      const messages = newHistory.map((m, idx) => {
        if (idx === 0 && m.role === "user") {
          const blocks = imgBlocks(imgs);
          blocks.push({ type: "text", text: buildContext(entry, imgs.length, mode) + "\n\n학생: " + m.text });
          return { role: "user", content: blocks };
        }
        return { role: m.role, content: m.text };
      });
      const reply = await callClaude(messages);
      setAiChats((c) => ({
        ...c,
        [id]: [...newHistory, { role: "assistant", text: reply || "응답을 받지 못했어요. 다시 시도해 주세요." }],
      }));
    } catch (err) {
      const ok = copyText(buildContext(entry, 0, mode) + "\n\n학생: " + text);
      setAiChats((c) => ({
        ...c,
        [id]: [...newHistory, { role: "assistant", text: (ok
          ? "연결이 잠시 원활하지 않아 질문을 복사해뒀어요. 한 번 더 전송해 보고, 계속 안 되면 새 채팅에 붙여넣기 하면 (문제 사진도 함께 첨부) 답을 받을 수 있어요."
          : "연결에 실패했어요. 잠시 후 다시 시도해 주세요.") + ((err && (err.detail || err.message)) ? "\n\n[진단] " + (err.detail || err.message) : "") }],
      }));
    } finally {
      setAiLoading((l) => ({ ...l, [id]: false }));
    }
  }

  // ---- 발상 카드 ----
  async function makeInsight(entry, e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || insightLoading[entry.id]) return;
    setInsightLoading((l) => ({ ...l, [entry.id]: true }));
    setInsightMsg((m) => ({ ...m, [entry.id]: "" }));
    setInsightBridge((m) => ({ ...m, [entry.id]: "" }));
    try {
      const photo = await compressFile(file);
      const prompt =
        "이 사진은 고등학생이 문제를 풀며 손으로 정리한 발상(아이디어) 노트야. 사진 내용을 바탕으로, 나중에 플래시카드 힌트로 쓸 수 있는 발상 카드를 만들어줘.\n" +
        `참고 정보 — 과목: ${entry.subject}, 단원: ${entry.unit}\n\n` +
        "반드시 아래 JSON 형식으로만 응답해. 마크다운 코드블록이나 다른 텍스트 없이:\n" +
        '{"title": "핵심 발상 한 줄 (25자 이내)", "points": ["짧은 포인트 1", "짧은 포인트 2"]}\n' +
        'points는 2~4개, 각각 40자 이내. 글씨를 알아볼 수 없으면 {"error": "이유"} 형태로 응답해.';
      const reply = await callClaude([
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: photo.split(",")[1] } },
            { type: "text", text: prompt },
          ],
        },
      ], { needsVision: true });
      const parsed = parseJsonReply(reply);
      if (parsed.error || !parsed.title) {
        setInsightMsg((m) => ({ ...m, [entry.id]: "사진 속 글씨를 알아보기 어려웠어요. 조금 더 가까이 찍어 다시 올려주세요." }));
      } else {
        saveData({
          entries: entries.map((x) =>
            x.id === entry.id
              ? { ...x, insight: { title: parsed.title, points: Array.isArray(parsed.points) ? parsed.points.slice(0, 4) : [], date: todayStr() } }
              : x
          ),
        });
        setInsightOpen((o) => ({ ...o, [entry.id]: true }));
      }
    } catch (err) {
      const bridgePrompt =
        "이 사진은 내가 손으로 정리한 문제 발상 노트야. 핵심 발상 한 줄 제목과 2~4개의 짧은 포인트로 요약해줘.\n과목: " +
        entry.subject + " / 단원: " + entry.unit + "\n(이 채팅에 발상 사진을 첨부해줘)";
      copyText(bridgePrompt);
      setInsightBridge((m) => ({ ...m, [entry.id]: bridgePrompt }));
      setInsightMsg((m) => ({ ...m, [entry.id]: (err && err.visionRequired)
        ? "발상 카드는 손글씨 사진을 읽어야 해서 이 화면에선 바로 못 만들어요. 요약 질문을 복사해뒀어요 — 아래 버튼으로 Claude 앱을 열고, 붙여넣은 뒤 발상 사진을 첨부하면 카드 내용을 받을 수 있어요."
        : "연결이 잠시 원활하지 않아 요약 질문을 복사해뒀어요. 한 번 더 시도해 보고, 계속 안 되면 아래 버튼으로 Claude 앱에 붙여넣고 발상 사진을 첨부하세요." }));
    } finally {
      setInsightLoading((l) => ({ ...l, [entry.id]: false }));
    }
  }

  function removeInsight(id) {
    saveData({ entries: entries.map((x) => (x.id === id ? { ...x, insight: null } : x)) });
  }

  // ---- 내가 남긴 풀이 채점: 문제 사진 + 내 풀이(글·사진)를 보고 맞았는지 짧게 피드백 ----
  async function gradeSolution(entry, sol) {
    const key = sol.id;
    if (solGradeLoading[key]) return;
    setSolGradeLoading((l) => ({ ...l, [key]: true }));
    setSolGrade((m) => ({ ...m, [key]: "" }));
    setSolGradeBridge((m) => ({ ...m, [key]: "" }));
    const prompt =
      "앞의 이미지는 '문제 사진'이고, (있다면) 그다음 이미지와 아래 글은 '학생이 쓴 풀이'야. 학생 풀이가 맞았는지 짧게 채점해줘.\n" +
      `[과목] ${entry.subject} / [단원] ${entry.unit}\n` +
      (sol.text ? `[학생 풀이 글]\n${sol.text}\n` : "") +
      "형식: 첫 줄에 ⭕ 또는 ❌만, 그다음 잘한 점·틀린 부분을 1~2줄. 수식은 일반 텍스트.";
    const bridge = prompt + "\n(이 채팅에 문제 사진과 내 풀이를 첨부할게)";
    try {
      const probImgs = (await loadEntryImages(entry.id)).slice(0, 2);
      const solImgs = (solPhotoCache[key] || []).slice(0, 2);
      const reply = await callClaude(
        [{ role: "user", content: [...imgBlocks(probImgs), ...imgBlocks(solImgs), { type: "text", text: prompt }] }],
        { needsVision: true }
      );
      setSolGrade((m) => ({ ...m, [key]: reply || "채점 결과를 받지 못했어요." }));
    } catch (err) {
      copyText(bridge);
      setSolGradeBridge((m) => ({ ...m, [key]: bridge }));
      setSolGrade((m) => ({ ...m, [key]: (err && err.visionRequired)
        ? "이 화면에선 사진을 못 읽어서 채점을 바로 못 해요. 질문을 복사해뒀어요 — 아래 버튼으로 Claude 앱을 열고 문제·풀이 사진을 첨부하면 채점받을 수 있어요."
        : "연결이 잠시 원활하지 않아 질문을 복사해뒀어요. 아래 버튼으로 Claude 앱에 붙여넣고 사진을 첨부하세요." }));
    } finally {
      setSolGradeLoading((l) => ({ ...l, [key]: false }));
    }
  }

  // ---- 문제 풀이(AI 해설): 문제 사진을 분석해 정답 해설지처럼 풀이를 알려줌 ----
  async function explainProblem(entry) {
    const id = entry.id;
    if (explainLoading[id]) return;
    setExplainLoading((l) => ({ ...l, [id]: true }));
    setExplainResult((m) => ({ ...m, [id]: "" }));
    setExplainBridge((m) => ({ ...m, [id]: "" }));
    const tagTxt = (entry.tags || []).join(", ") || "미기재";
    const prompt =
      "첨부한 문제 사진을 분석해서 정답 해설지처럼 풀이를 알려줘.\n" +
      `[과목] ${entry.subject} / [단원] ${entry.unit}\n[학생이 기록한 실수] ${tagTxt}\n` +
      "형식: 1) 핵심 개념 한 줄 2) 단계별 풀이 3) 최종 답. 학생이 기록한 실수를 특히 조심하라고 짚어줘. 수식은 LaTeX 없이 일반 텍스트로.";
    const bridge = prompt + "\n(이 채팅에 문제 사진을 첨부해줘)";
    try {
      const imgs = await loadEntryImages(id);
      const reply = await callClaude(
        [{ role: "user", content: [...imgBlocks(imgs), { type: "text", text: prompt }] }],
        { needsVision: true }
      );
      setExplainResult((m) => ({ ...m, [id]: reply || "풀이를 받지 못했어요. 다시 시도해 주세요." }));
    } catch (err) {
      copyText(bridge);
      setExplainBridge((m) => ({ ...m, [id]: bridge }));
      setExplainResult((m) => ({ ...m, [id]: (err && err.visionRequired)
        ? "이 화면에선 문제 사진을 못 읽어서 풀이를 바로 못 만들어요. 질문을 복사해뒀어요 — 아래 버튼으로 Claude 앱을 열고 문제 사진을 첨부하면 풀이를 받을 수 있어요."
        : "연결이 잠시 원활하지 않아 질문을 복사해뒀어요. 아래 버튼으로 Claude 앱에 붙여넣고 문제 사진을 첨부하세요." }));
    } finally {
      setExplainLoading((l) => ({ ...l, [id]: false }));
    }
  }

  // ---- 변형문제 (공통 프롬프트) ----
  function variantJsonRule() {
    return (
      "\n반드시 아래 JSON 형식으로만 응답해. 마크다운 코드블록이나 다른 텍스트 없이:\n" +
      '{"problems": [{"level": "쌍둥이", "question": "문제 전문", "hint": "발상 힌트 한두 문장", "answer": "풀이 요약과 최종 답"}, {"level": "상", "question": "...", "hint": "...", "answer": "..."}, {"level": "최상", "question": "...", "hint": "...", "answer": "..."}]}\n' +
      "수식은 LaTeX 없이 일반 텍스트로 읽기 쉽게. answer는 핵심 풀이 3~4문장으로 간결하게. JSON 문자열 안에서 줄바꿈이 필요하면 \\n 을 쓰고, JSON 앞뒤에 다른 말은 절대 붙이지 마. 키 이름은 반드시 영어 그대로(problems, level, question, hint, answer)만 사용하고, level 값은 반드시 '쌍둥이'/'상'/'최상' 중 하나만 써."
    );
  }

  // 선택된 난이도(쌍둥이/상/최상)만 출제하도록 조건 문구를 만든다
  const LEVEL_DESC = {
    "쌍둥이": "원 문제와 거의 같은 유형·같은 난이도. 숫자·상황만 바꾼 연습용 문제.",
    "상": "같은 핵심 개념이되, 학생의 실수 패턴을 정확히 찌르는 함정 포함.",
    "최상": "조건을 비틀거나 교육과정 내 다른 개념과 융합한 킬러 문항.",
  };
  function levelSpec(levels) {
    const chosen = (levels && levels.length ? levels : ["쌍둥이", "상", "최상"]).filter((l) => LEVEL_DESC[l]);
    const list = chosen.length ? chosen : ["쌍둥이", "상", "최상"];
    const lines = list.map((l, i) => `${i + 1}. [${l}] 1문제 — ${LEVEL_DESC[l]}`).join("\n");
    return { count: list.length, lines, list };
  }

  function entryVariantPrompt(entry, imgCount, prevQs, levels) {
    const spec = levelSpec(levels);
    return (
      TEACHER_PERSONA + "\n\n아래 오답 정보를 바탕으로 변형문제를 출제해.\n\n" +
      `[과목] ${entry.subject}\n[단원·주제] ${entry.unit}\n[학생의 실수 패턴] ${(entry.tags || []).join(", ") || "미기재"}\n[학생 메모] ${entry.memo || "없음"}\n` +
      (subjBook(entry.subject) ? `[출제 기준 교재] ${subjBook(entry.subject)} — 이 교재의 난이도와 출제 스타일을 기준으로 변형해.\n` : "") +
      (imgCount ? `[첨부] 원 문제 사진 ${imgCount}장. 사진 속 문제를 변형의 기준으로 삼아.\n` : "") +
      `\n출제 조건 (총 ${spec.count}문제, 아래 난이도만 정확히 출제):\n` + spec.lines + "\n" +
      (prevQs ? `그리고 아래 이전 출제 문제와 겹치지 않는 새로운 문제로:\n${prevQs}\n` : "") +
      variantJsonRule()
    );
  }

  function summaryVariantPrompt(subjectName, pool, prevQs, levels) {
    const spec = levelSpec(levels);
    const lines = pool
      .slice(0, 8)
      .map((e) => `- [${e.subject}/${e.unit}] 틀린 이유: ${(e.tags || []).join(", ") || "미기재"}${e.memo ? ` / 메모: ${e.memo.slice(0, 60)}` : ""}`)
      .join("\n");
    const freq = {};
    pool.forEach((e) => (e.tags || []).forEach((t) => (freq[t] = (freq[t] || 0) + 1)));
    const topTags = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, c]) => `${t}(${c}회)`).join(", ");
    return (
      TEACHER_PERSONA + "\n\n아래는 학생의 오답 데이터 요약이야. 이 학생의 약점을 정확히 겨냥한 변형문제를 출제해.\n\n" +
      `[대상 과목] ${subjectName}\n` +
      (subjBook(subjectName) ? `[출제 기준 교재] ${subjBook(subjectName)} — 이 교재의 난이도와 출제 스타일을 기준으로 출제해.\n` : "") +
      `[자주 걸리는 실수 패턴] ${topTags || "데이터 부족"}\n[최근 오답 목록]\n${lines}\n` +
      `\n출제 조건 (총 ${spec.count}문제, 아래 난이도만 정확히 출제):\n` + spec.lines + "\n" +
      (prevQs ? `그리고 아래 이전 출제 문제와 겹치지 않는 새로운 문제로:\n${prevQs}\n` : "") +
      variantJsonRule()
    );
  }

  // 카드 내 변형문제
  async function makeVariants(entry, more) {
    const id = entry.id;
    if (variantLoading[id]) return;
    setVariantLoading((l) => ({ ...l, [id]: true }));
    try {
      const imgs = await loadEntryImages(id);
      const prev = more ? (variants[id] || []).map((v) => v.question).join("\n---\n") : "";
      const reply = await callClaude([
        { role: "user", content: [...imgBlocks(imgs), { type: "text", text: entryVariantPrompt(entry, imgs.length, prev) }] },
      ]);
      const probs = extractProblems(reply);
      if (probs.length) {
        setVariants((v) => ({ ...v, [id]: more ? [...(v[id] || []), ...probs] : probs }));
      } else {
        const rawText = humanizeReply(reply) || "응답이 비어 있었어요. 한 번 더 눌러주세요.";
        setVariants((v) => ({ ...v, [id]: [...(v[id] || []), { level: "상", question: rawText, hint: "", answer: "" }] }));
      }
    } catch (err) {
      const bp = entryVariantPrompt(entry, 0, "").replace(variantJsonRule(), "\n각 문제에 [상]/[최상] 난이도를 표시하고, 힌트와 정답은 문제 아래에 구분해서 보기 좋게 정리해줘.");
      const ok = copyText(bp);
      setVariants((v) => ({
        ...v,
        [id]: [...(v[id] || []), { level: "!", question: (ok
          ? "연결이 잠시 원활하지 않아 출제 질문을 복사해뒀어요. 🔁 버튼을 한 번 더 눌러보고, 계속 안 되면 새 채팅에 붙여넣기 (문제 사진 첨부) 하면 문제가 나와요."
          : "변형문제 생성에 실패했어요. 잠시 후 다시 시도해 주세요.") + ((err && (err.detail || err.message)) ? "\n\n[진단] " + (err.detail || err.message) : ""), hint: "", answer: "" }],
      }));
    } finally {
      setVariantLoading((l) => ({ ...l, [id]: false }));
    }
  }

  function toggleVariants(entry) {
    const id = entry.id;
    if (variantOpen[id]) {
      setVariantOpen((o) => ({ ...o, [id]: false }));
      return;
    }
    setVariantOpen((o) => ({ ...o, [id]: true }));
    if (!(variants[id] || []).length) makeVariants(entry, false);
  }

  // 변형문제 탭
  const vtPool = entries.filter((e) => vtSubject === "전체" || e.subject === vtSubject);

  async function vtGenerate(more) {
    if (vtLoading) return;
    setVtLoading(true);
    try {
      const prev = more ? vtProblems.map((v) => v.question).join("\n---\n") : "";
      let reply;
      if (vtEntryId !== "sum") {
        const entry = entries.find((e) => e.id === vtEntryId);
        if (!entry) return;
        const imgs = await loadEntryImages(entry.id);
        reply = await callClaude([
          { role: "user", content: [...imgBlocks(imgs), { type: "text", text: entryVariantPrompt(entry, imgs.length, prev, vtLevels) }] },
        ]);
      } else {
        reply = await callClaude([
          { role: "user", content: [{ type: "text", text: summaryVariantPrompt(vtSubject, vtPool, prev, vtLevels) }] },
        ]);
      }
      const probs = extractProblems(reply);
      if (probs.length) {
        setVtProblems(more ? [...vtProblems, ...probs] : probs);
      } else {
        const rawText = humanizeReply(reply) || "응답이 비어 있었어요. 🎯 출제하기를 한 번 더 눌러주세요.";
        setVtProblems(more ? [...vtProblems, { level: "상", question: rawText, hint: "", answer: "" }] : [{ level: "상", question: rawText, hint: "", answer: "" }]);
      }
      if (!more) { setVtReveal({}); setVtPadOpen({}); }
    } catch (err) {
      let bp = "";
      if (vtEntryId !== "sum") {
        const en = entries.find((x) => x.id === vtEntryId);
        if (en) bp = entryVariantPrompt(en, 0, "");
      } else {
        bp = summaryVariantPrompt(vtSubject, vtPool, "");
      }
      const ok = bp ? copyText(bp.replace(variantJsonRule(), "\n각 문제에 [상]/[최상] 난이도를 표시하고, 힌트와 정답은 문제 아래에 구분해서 보기 좋게 정리해줘.")) : false;
      setVtProblems((p) => [...p, { level: "!", question: (ok
        ? "연결이 잠시 원활하지 않아 출제 질문(실수 패턴·기준 교재 포함)을 복사해뒀어요. 🎯 출제하기를 한 번 더 눌러보고, 계속 안 되면 새 채팅에 붙여넣기 하면 문제가 나와요."
        : "출제에 실패했어요. 잠시 후 다시 시도해 주세요.") + ((err && (err.detail || err.message)) ? "\n\n[진단] " + (err.detail || err.message) : ""), hint: "", answer: "" }]);
    } finally {
      setVtLoading(false);
    }
  }

  // 변형문제: 다시 풀기(풀이 패드 초기화, 정답 숨김) / 치우기(목록에서 제거)
  function retryVariant(i) {
    setVtPadNonce((n) => ({ ...n, [i]: (n[i] || 0) + 1 }));
    setVtReveal((r) => ({ ...r, [`${i}-a`]: false }));
    setVtPadOpen((o) => ({ ...o, [i]: true }));
  }
  function hideVariant(i) {
    setVtProblems((ps) => ps.filter((_, idx) => idx !== i));
    setVtPadOpen({}); setVtReveal({}); setVtCollapsed({}); setVtPadNonce({});
  }

  // 변형문제 필기 채점 (짧게: ⭕/❌ + 1~2줄)
  function vtGradeFn(v) {
    return async (drawUrl, noteText) => {
      const prompt =
        "너는 채점 선생님이야. 아래 문제에 대한 학생의 손글씨 풀이(첨부 이미지)를 채점해줘.\n\n" +
        `[문제] ${v.question}\n[모범 풀이·정답] ${v.answer || "미제공 — 직접 풀어서 비교해"}\n` +
        (noteText ? `[학생 포스트잇 메모]\n${noteText}\n` : "") +
        "\n아주 짧게: 첫 줄에 ⭕ 또는 ❌만, 그다음 잘한 점·틀린 부분을 딱 1~2줄. 전체 풀이·해설은 절대 쓰지 마 (학생이 '풀이 보기'로 따로 요청할 거야). 글씨를 못 읽겠으면 그것만 말해. 친근한 존댓말, 수식은 일반 텍스트.";
      return await callClaude([{ role: "user", content: [...imgBlocks([drawUrl]), { type: "text", text: prompt }] }], { needsVision: true });
    };
  }

  // 변형문제 간략 풀이 (사진 불필요 → 아이패드에서도 인라인 작동)
  function vtSolveFn(v) {
    return async () => {
      const prompt =
        "아래 문제의 핵심 풀이를 정답 해설지처럼 아주 간략히 알려줘. 3~4줄 이내, '핵심 아이디어 → 최종 답' 위주로. 잡담·장황한 설명 없이.\n\n" +
        `[문제] ${v.question}\n` + (v.answer ? `[정답·풀이 요약] ${v.answer}\n` : "");
      return await callClaude([{ role: "user", content: prompt }]);
    };
  }

  // 플래시카드 필기 채점 (짧게: ⭕/❌ + 1~2줄)
  function flashGradeFn(entry) {
    return async (drawUrl, noteText) => {
      const probImgs = (imageCache[entry.id] || []).slice(0, 2);
      const prompt =
        "너는 채점 선생님이야. 앞의 이미지들은 문제 사진이고, 마지막 이미지는 학생의 손글씨 풀이야.\n\n" +
        `[과목] ${entry.subject} / [단원] ${entry.unit}\n[학생 메모] ${entry.memo || "없음"}\n` +
        (noteText ? `[학생 포스트잇 메모]\n${noteText}\n` : "") +
        "\n먼저 문제를 직접 풀고 학생 풀이와 비교해서 아주 짧게: 첫 줄에 ⭕ 또는 ❌만, 그다음 잘한 점·틀린 부분을 딱 1~2줄. 전체 풀이·해설은 절대 쓰지 마 (학생이 '풀이 보기'로 따로 요청할 거야). 글씨를 못 읽겠으면 그것만 말해. 친근한 존댓말, 수식은 일반 텍스트.";
      return await callClaude([{ role: "user", content: [...imgBlocks(probImgs), ...imgBlocks([drawUrl]), { type: "text", text: prompt }] }], { needsVision: true });
    };
  }

  // 플래시카드 간략 풀이 (문제 사진 필요 → 아이패드에선 Claude 앱 안내)
  function flashSolveFn(entry) {
    return async () => {
      const probImgs = (imageCache[entry.id] || []).slice(0, 2);
      const prompt =
        "첨부한 문제 사진을 보고, 핵심 풀이를 정답 해설지처럼 아주 간략히 알려줘. 3~4줄 이내, '핵심 아이디어 → 최종 답' 위주로. 장황한 설명 없이.\n" +
        `[과목] ${entry.subject} / [단원] ${entry.unit}`;
      return await callClaude([{ role: "user", content: [...imgBlocks(probImgs), { type: "text", text: prompt }] }], { needsVision: true });
    };
  }

  // ---- 플래시카드 ----
  const flashPool = entries.filter(
    (e) =>
      e.hasImage &&
      !e.graduated && // 졸업한 문제는 플래시카드에서 숨김 (기록엔 남음)
      (flashSubject === "전체" || e.subject === flashSubject) &&
      (!flashRetryOnly || e.retry) &&
      (!flashStarOnly || e.starred)
  );

  function buildDeck() {
    setFlashDeck(shuffleArr(flashPool.map((e) => e.id)));
    setFlashIdx(0);
    setFlashHint(false);
    setFlashMemo(false);
    setFlashDelAsk(false);
    setTimerOn(false);
    setTimerSec(0);
    setExtendsUsed(0);
    setFlashTimeout(false);
    setGradMsg("");
  }

  useEffect(() => {
    if (tab === "flash") buildDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, flashSubject, flashRetryOnly, flashStarOnly]);

  const flashEntry = entries.find((e) => e.id === flashDeck[flashIdx]);

  useEffect(() => {
    if (tab === "flash" && flashEntry && !imageCache[flashEntry.id]) {
      loadEntryImages(flashEntry.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, flashDeck, flashIdx]);

  // 스톱워치
  useEffect(() => {
    if (!timerOn) return;
    const t = setInterval(() => setTimerSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  // 3분 타이머 모드: 제한 시간(3분 + 1분×연장) 초과 시 자동으로 '다시 풀기' 표시
  useEffect(() => {
    if (timerMode !== "count" || !timerOn) return;
    const limit = 180 + 60 * extendsUsed;
    if (timerSec >= limit) {
      setTimerOn(false);
      setFlashTimeout(true);
      if (flashEntry) flashWrong(flashEntry.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSec, timerMode, timerOn, extendsUsed]);

  // 변형문제 탭 타이머 (3분 + 1분×2)
  useEffect(() => {
    if (!vtTimerOn) return;
    const t = setInterval(() => setVtTimerSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [vtTimerOn]);

  useEffect(() => {
    if (vtTimerOn && vtTimerSec >= 180 + 60 * vtExtends) setVtTimerOn(false);
  }, [vtTimerSec, vtTimerOn, vtExtends]);

  function flashMove(dir) {
    setFlashHint(false);
    setFlashMemo(false);
    setFlashDelAsk(false);
    setFlashPadOpen(false);
    setTimerOn(false);
    setTimerSec(0);
    setExtendsUsed(0);
    setFlashTimeout(false);
    setGradMsg("");
    setFlashIdx((i) => Math.min(Math.max(i + dir, 0), Math.max(flashDeck.length - 1, 0)));
  }

  // 개인화 피드백: 이 문제의 실수 태그 중 지금까지 가장 자주 나온 것을 짚어줌
  function mistakeNote(entry) {
    const tags = (entry && entry.tags) || [];
    if (!tags.length) return "";
    let best = null, bestN = 0;
    tags.forEach((t) => {
      const n = entries.filter((e) => (e.tags || []).includes(t)).length;
      if (n > bestN) { bestN = n; best = t; }
    });
    if (best && bestN >= 2) return `⚠️ '${best}'(으)로 틀린 게 지금까지 ${bestN}번째야. 이번엔 특히 조심!`;
    return "";
  }

  // 못 풀었을 때(❌·시간초과): 틀린 횟수 +1, 연속 정답 초기화, 다시 풀기 표시
  function flashWrong(id) {
    saveData({
      entries: entries.map((e) =>
        e.id === id
          ? { ...e, retry: true, correctStreak: 0, wrongCount: (e.wrongCount || 0) + 1 }
          : e
      ),
    });
  }

  function flashCorrect(entry) {
    setTimerOn(false);
    let graduatedNow = false;
    let conqueringNow = false;
    const sp = studyPatchToday();
    saveData({
      ...(sp ? { study: sp } : {}),
      entries: entries.map((e) => {
        if (e.id !== entry.id) return e;
        const streak = (e.correctStreak || 0) + 1;
        const updated = { ...e, retry: false, correctStreak: streak };
        if (streak >= 2) { updated.graduated = true; graduatedNow = !e.graduated; }
        if (e.status < 3) {
          updated.status = e.status + 1;
          updated.reviewLog = [...(e.reviewLog || []), todayStr()];
          if (e.status === 2) conqueringNow = true;
        }
        if (timerSec > 0) {
          updated.solveTimes = [...(e.solveTimes || []), { date: todayStr(), sec: timerSec }];
        }
        return updated;
      }),
    });
    setTimerSec(0);
    if (graduatedNow) setGradMsg("🎓 2회 연속 정답! 이 문제는 졸업했어요 — 플래시카드에서는 이제 안 보여요 (기록엔 남아요).");
    else setGradMsg("");
    if (conqueringNow || graduatedNow) celebrateCrown();
  }

  // ---- 설정: 과목 관리 ----
  function addSubject() {
    const name = newSubjectInput.trim();
    if (!name) return;
    if (subjectNames.includes(name)) {
      setSettingMsg(`'${name}' 과목이 이미 있어요.`);
      return;
    }
    const color = COLOR_PALETTE[subjects.length % COLOR_PALETTE.length];
    saveData({ subjects: [...subjects, { name, color }] });
    setNewSubjectInput("");
    setSettingMsg(`'${name}' 과목을 추가했어요.`);
  }

  function removeSubject(name) {
    const used = entries.filter((e) => e.subject === name).length;
    if (used > 0) {
      setSettingMsg(`'${name}' 과목에 기록 ${used}개가 있어 삭제할 수 없어요. 해당 기록을 먼저 삭제하거나 그대로 두세요.`);
      return;
    }
    const next = subjects.filter((s) => s.name !== name);
    if (next.length === 0) {
      setSettingMsg("과목은 최소 1개는 있어야 해요.");
      return;
    }
    saveData({ subjects: next });
    if (form.subject === name) setForm((f) => ({ ...f, subject: next[0].name }));
    setSettingMsg(`'${name}' 과목을 삭제했어요.`);
  }

  function removeCustomTag(tag) {
    saveData({ customTags: customTags.filter((t) => t !== tag) });
    setSettingMsg(`'${tag}' 태그를 목록에서 뺐어요. 이미 기록된 오답의 태그는 그대로 남아요.`);
  }

  // 과목 순서 변경 (↑/↓) — 폼 칩·필터·통계 순서가 함께 바뀜
  function moveSubject(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= subjects.length) return;
    const next = subjects.slice();
    const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
    saveData({ subjects: next });
  }

  function saveBook() {
    const b = bookInput.trim();
    saveData({ subjects: subjects.map((s) => (s.name === bookSubject ? { ...s, book: b } : s)) });
    setSettingMsg(
      b
        ? `'${bookSubject}' 변형문제 기준 교재를 '${b}'(으)로 설정했어요.`
        : `'${bookSubject}'의 기준 교재를 해제했어요.`
    );
  }

  // ---- AI 연결 점검 ----
  async function checkAiConnection() {
    if (aiChecking) return;
    setAiChecking(true);
    setAiCheckMsg("");
    const canComplete = typeof window !== "undefined" && window.claude && typeof window.claude.complete === "function";
    try {
      const reply = await callClaude([{ role: "user", content: "연결 테스트야. '연결 성공'이라고만 짧게 답해줘." }]);
      setAiCheckMsg(
        "✅ AI 연결 정상! 응답: " + (reply || "(빈 응답)").slice(0, 60) +
        (canComplete
          ? "\n변형문제·도우미(텍스트)는 이 화면에서 바로 작동해요. 발상카드·필기채점처럼 사진을 읽어야 하는 기능은 '📲 Claude 앱에서 열기' 버튼으로 넘어가서 사진을 첨부해 쓰면 돼요. (추가 요금 없이 Claude 계정으로 처리됨)"
          : "\n변형문제·도우미·채점 모두 쓸 수 있어요.")
      );
    } catch (e) {
      const d = e.detail || e.message || "원인 미상";
      if (d.indexOf("네트워크 차단") !== -1) {
        setAiCheckMsg(
          "❌ 이 화면에선 AI 채널을 찾지 못했어요.\n\n" +
          "✅ 지금 바로 쓰는 법: AI 버튼(변형문제·도우미·채점)을 누르면 질문이 자동 복사돼요 → '📲 Claude 앱에서 열기' 버튼으로 앱을 열고 붙여넣으면 답을 받아요 (사진 기능은 사진도 함께 첨부).\n\n" +
          "이 오답노트는 Claude 앱/웹 아티팩트로 열면 텍스트 AI가 바로 작동해요."
        );
      } else {
        setAiCheckMsg("❌ 연결 실패\n[진단] " + d + "\n\n이 [진단] 문구를 그대로 Claude 채팅에 알려주면 원인을 바로 잡을 수 있어요.");
      }
    } finally {
      setAiChecking(false);
    }
  }

  // ---- 인쇄용 파일 내보내기 ----
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function buildPrintHtml(list, imgMap) {
    const items = list
      .map((e, idx) => {
        const tags = (e.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");
        const photos = (imgMap[e.id] || []).map((src) => `<img src="${src}" alt="" />`).join("");
        const idea = e.insight
          ? `<div class="idea"><strong>💡 ${esc(e.insight.title)}</strong><ul>${(e.insight.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`
          : "";
        return (
          `<article>` +
          `<header><span class="num">${idx + 1}</span>${e.starred ? " ⭐" : ""} <strong>[${esc(e.subject)}] ${esc(e.unit)}</strong>` +
          `<span class="meta">${esc(e.source)}${e.source ? " · " : ""}${e.createdAt}${e.retry ? " · 🔁 다시 풀기" : ""}</span></header>` +
          (tags ? `<div class="tags">${tags}</div>` : "") +
          photos +
          (e.memo ? `<p class="memo">${esc(e.memo)}</p>` : "") +
          idea +
          `<div class="space">풀이 공간</div>` +
          `</article>`
        );
      })
      .join("\n");
    return (
      `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" />` +
      `<title>오답노트 인쇄용 · ${todayStr()}</title><style>` +
      `body{font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1E2A3A;max-width:800px;margin:0 auto;padding:24px;}` +
      `h1{font-size:22px;border-bottom:3px solid #D6453D;padding-bottom:8px;}` +
      `article{border:1px solid #DDE3EC;border-left:4px solid #D6453D;border-radius:8px;padding:14px 16px;margin:14px 0;page-break-inside:avoid;}` +
      `header{font-size:15px;} .num{display:inline-block;background:#1E2A3A;color:#fff;border-radius:4px;padding:1px 7px;font-size:12px;margin-right:6px;}` +
      `.meta{color:#7B8698;font-size:12px;margin-left:8px;}` +
      `.tags{margin:6px 0;} .tag{color:#D6453D;font-size:12px;border-bottom:2px solid rgba(214,69,61,.5);margin-right:8px;}` +
      `img{max-width:100%;border:1px solid #DDE3EC;border-radius:6px;margin:6px 0;}` +
      `.memo{background:#FBFCF9;border-radius:6px;padding:8px 10px;font-size:13px;white-space:pre-wrap;}` +
      `.idea{background:#FFF9EC;border:1px solid #EBD9AE;border-radius:8px;padding:8px 12px;font-size:13px;} .idea ul{margin:4px 0 0;padding-left:18px;}` +
      `.space{border:1px dashed #B9C2D0;border-radius:6px;height:120px;margin-top:10px;color:#B9C2D0;font-size:11px;padding:6px 8px;}` +
      `@media print{body{padding:0;} .space{height:150px;}}` +
      `</style></head><body>` +
      `<h1>오답노트 ✗ <small style="font-size:13px;color:#7B8698;">${todayStr()} · ${list.length}문제 · 인쇄: Ctrl/⌘+P</small></h1>` +
      items +
      `</body></html>`
    );
  }

  async function exportPrint() {
    if (exporting || filtered.length === 0) return;
    setExporting(true);
    try {
      const imgMap = {};
      for (const e of filtered) {
        if (e.hasImage) imgMap[e.id] = await loadEntryImages(e.id);
      }
      const html = buildPrintHtml(filtered, imgMap);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `오답노트_인쇄용_${todayStr()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) {
      setSaveError(true);
    } finally {
      setExporting(false);
    }
  }

  // ---- 필터링 ----
  const filtered = entries.filter((e) => {
    if (fSubject !== "전체" && e.subject !== fSubject) return false;
    if (fTag !== "전체" && !(e.tags || []).includes(fTag)) return false;
    if (fStatus !== "전체" && STATUS[e.status].label !== fStatus) return false;
    const isDone = e.status === 3 || e.graduated;
    if (listView === "active" && isDone) return false; // 복습 중 탭: 맞은(정복·졸업) 문제 숨김
    if (listView === "done" && !isDone) return false;  // 맞은 문제 탭: 맞은 것만
    if (fStarOnly && !e.starred) return false;
    if (fDueOnly) {
      const r = nextReviewInfo(e);
      if (!r || !r.due) return false;
    }
    if (search.trim()) {
      const hay = `${e.unit} ${e.source} ${e.memo}`;
      if (!hay.includes(search.trim())) return false;
    }
    return true;
  });

  const selectedCount = Object.keys(selected).filter((k) => selected[k]).length;

  // ---- 통계 ----
  const total = entries.length;
  const mastered = entries.filter((e) => e.status === 3).length;
  const tagCounts = usedTags
    .map((t) => ({ tag: t, count: entries.filter((e) => (e.tags || []).includes(t)).length }))
    .sort((a, b) => b.count - a.count);
  const maxTag = Math.max(1, ...tagCounts.map((t) => t.count));
  const subjCounts = subjectNames.map((s) => {
    const list = entries.filter((e) => e.subject === s);
    return { subject: s, count: list.length, done: list.filter((e) => e.status === 3).length };
  });
  const maxSubj = Math.max(1, ...subjCounts.map((s) => s.count));
  const topTag = tagCounts[0] && tagCounts[0].count > 0 ? tagCounts[0] : null;

  const lastSolve = (e) => {
    const st = e.solveTimes || [];
    return st.length ? st[st.length - 1] : null;
  };

  return (
    <div className="wnt-root">
      <style>{css}</style>

      {/* 헤더 */}
      <header className="wnt-header">
        <div className="wnt-title-row">
          <h1 className="wnt-title">
            오답 끝<span className="wnt-title-mark">✗</span>
          </h1>
          <span className="wnt-subtitle">틀린 문제는 두 번 안 틀린다</span>
          {(() => {
            const dd = examDday(exam);
            const nx = examNext(exam);
            return (
              <div className="wnt-dday-wrap">
                <button className={examOpen ? "wnt-header-dday on" : "wnt-header-dday"} onClick={() => setExamOpen((o) => !o)}
                  title="시험 일정·시간표">
                  📅 {dd != null
                    ? <>
                        <span className="wnt-header-dday-num">D-{dd === 0 ? "DAY" : dd}</span>
                        {nx && nx.subjects && <span className="wnt-header-dday-subj">{nx.subjects}</span>}
                      </>
                    : "시험 일정"}
                </button>
                {examOpen && (
                  <>
                    <div className="wnt-dday-overlay" onClick={() => setExamOpen(false)} />
                    <div className="wnt-exam-pop">
                      <div className="wnt-exam-pop-head">
                        📅 {exam.name || "시험 일정"}
                        {dd != null && <span className="wnt-dday">{dd === 0 ? "D-DAY!" : "D-" + dd}</span>}
                        <button className="wnt-due-x" onClick={() => setExamOpen(false)} aria-label="닫기">✕</button>
                      </div>
                      <input
                        className="wnt-input"
                        placeholder="시험 이름 (예: 1학기 기말고사)"
                        value={exam.name}
                        onChange={(e) => setExam({ ...exam, name: e.target.value })}
                        onBlur={() => saveData({ exam })}
                      />
                      <div className="wnt-exam-rows">
                        {(exam.days || []).map((d, i) => {
                          const n = d.date ? daysFromToday(parseDate(d.date)) : null;
                          return (
                            <div key={i} className="wnt-exam-row">
                              <input
                                className="wnt-input wnt-exam-date"
                                type="date"
                                value={d.date || ""}
                                onChange={(e) => { const next = { ...exam, days: exam.days.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)) }; saveData({ exam: next }); }}
                              />
                              <input
                                className="wnt-input"
                                placeholder="과목 (예: 통합사회1, 한국사1)"
                                value={d.subjects || ""}
                                onChange={(e) => setExam({ ...exam, days: exam.days.map((x, idx) => (idx === i ? { ...x, subjects: e.target.value } : x)) })}
                                onBlur={() => saveData({ exam })}
                              />
                              {n != null && (n >= 0
                                ? <span className="wnt-dday sm">{n === 0 ? "오늘" : "D-" + n}</span>
                                : <span className="wnt-dday sm past">지남</span>)}
                              <button className="wnt-exam-x" onClick={() => saveData({ exam: { ...exam, days: exam.days.filter((_, idx) => idx !== i) } })} aria-label="삭제">✕</button>
                            </div>
                          );
                        })}
                      </div>
                      <button className="wnt-mini strong" onClick={() => saveData({ exam: { ...exam, days: [...(exam.days || []), { date: "", subjects: "" }] } })}>＋ 시험일 추가</button>
                      <p className="wnt-exam-tip">시험 4일을 다 넣어두면, 위 <b>D-day</b>는 가장 가까운 시험 하나만 떠요. 그 날이 지나면 자동으로 다음 시험으로 넘어가요. 🗓️</p>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
        <div className="wnt-motto-row">
          <input
            className="wnt-motto"
            placeholder="✍️ 여기에 나만의 명언·공부 자극 문구를 적어보세요 (자동 저장)"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            onBlur={() => saveData({ motto })}
            maxLength={80}
          />
          {study.streak > 0 && (
            <span className="wnt-streak" title={`최고 기록 ${study.bestStreak || study.streak}일`}>
              🔥 {study.streak}일째{(study.bestStreak || 0) > study.streak ? ` · 최고 ${study.bestStreak}` : ""}
            </span>
          )}
        </div>
        <div className="wnt-tabs">
          <button className={tab === "list" ? "wnt-tab on" : "wnt-tab"} onClick={() => setTab("list")}>
            기록 <em>{total}</em>
          </button>
          <button className={tab === "flash" ? "wnt-tab on" : "wnt-tab"} onClick={() => setTab("flash")}>
            플래시카드
          </button>
          <button className={tab === "variant" ? "wnt-tab on" : "wnt-tab"} onClick={() => setTab("variant")}>
            변형문제
          </button>
          <button className={tab === "stats" ? "wnt-tab on" : "wnt-tab"} onClick={() => setTab("stats")}>
            실수 패턴
          </button>
          <button className={tab === "settings" ? "wnt-tab on" : "wnt-tab"} onClick={() => { setTab("settings"); setSettingMsg(""); }}>
            ⚙️ 설정
          </button>
        </div>
      </header>

      {/* 오늘 복습 팝업 — 앱 열면 눈에 띄게 (복습할 문제가 있을 때) */}
      {!loading && !dueModalClosed && (() => {
        const dueList = entries.filter((e) => {
          if (e.status === 3 || e.graduated) return false;
          const r = nextReviewInfo(e);
          return r && r.due;
        });
        if (dueList.length === 0) return null;
        return (
          <div className="wnt-due-modal-backdrop" onClick={() => setDueModalClosed(true)}>
            <div className="wnt-due-modal" onClick={(ev) => ev.stopPropagation()}>
              <div className="wnt-due-modal-bell">🔔</div>
              {study.streak > 0 && <div className="wnt-due-modal-streak">🔥 {study.streak}일째 연속 · 오늘도 이어가자!</div>}
              <div className="wnt-due-modal-count">오늘 복습할 오답 <b>{dueList.length}개</b></div>
              <p className="wnt-due-modal-sub">
                {goalIsAll
                  ? <>오늘은 <b>전부</b> 풀어볼까? 하나씩 차근차근! ✍️</>
                  : <>부담 갖지 말고 <b>우선 {goalCount(dueList.length)}개</b>부터 시작하자! 다 풀고 싶으면 쭉 풀어도 돼 ✍️</>}
              </p>
              <ul className="wnt-due-modal-list">
                {dueList.slice(0, goalCount(dueList.length)).map((e) => (
                  <li key={e.id}><span className="wnt-subj sm" style={{ background: subjColor(e.subject) }}>{e.subject}</span> {e.unit}</li>
                ))}
                {dueList.length > goalCount(dueList.length) && <li className="wnt-due-modal-more">그 외 {dueList.length - goalCount(dueList.length)}개 더 있어요</li>}
              </ul>
              <div className="wnt-due-modal-btns">
                <button className="wnt-btn-primary" onClick={() => { setTab("list"); setListView("active"); setFDueOnly(true); setDueModalClosed(true); }}>지금 풀기 →</button>
                <button className="wnt-mini" onClick={() => setDueModalClosed(true)}>나중에</button>
              </div>
            </div>
          </div>
        );
      })()}

      {crownShow && (
        <div className="wnt-crown-celebrate" onClick={() => setCrownShow(false)}>
          <div className="wnt-crown-burst">
            <img className="wnt-crown-hodu" src={HODU_KING} alt="왕관 쓴 호두 킹" />
            <div className="wnt-crown-text">완전 정복! 👑</div>
            <div className="wnt-crown-sub">호두 킹이 인정했어 — 이제 네 거야 ✨</div>
            {["✨", "🎉", "⭐", "✨", "🎊", "⭐"].map((s, i) => (
              <span key={i} className={"wnt-crown-spark s" + i}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {cropTarget != null && form.photos[cropTarget] && (
        <CropModal src={form.photos[cropTarget]} onClose={() => setCropTarget(null)} onApply={(d) => applyCropped(cropTarget, d)} />
      )}
      {zoomSrc && <ZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />}

      {saveError && (
        <div className="wnt-warn">저장에 실패했어요. 저장 공간이 가득 찼을 수 있어요 — 오래된 기록이나 사진을 정리해 보세요.</div>
      )}

      {loading ? (
        <div className="wnt-empty">불러오는 중…</div>
      ) : tab === "list" ? (
        <>
          {/* 새 오답 기록 */}
          {!formOpen && !selectMode && (
            <button className="wnt-add-btn" onClick={() => setFormOpen(true)}>
              ＋ 오답 기록하기
            </button>
          )}
          {formOpen && (
            <section className="wnt-form">
              {draftNotice && <div className="wnt-setting-msg" style={{ marginBottom: 12 }}>✍️ 작성 중이던 기록을 복구했어요 — 이어서 작성하면 돼요!</div>}
              <div className="wnt-form-row">
                <label className="wnt-label">과목</label>
                <div className="wnt-chip-row">
                  {subjectNames.map((s) => (
                    <button
                      key={s}
                      className={form.subject === s ? "wnt-chip on" : "wnt-chip"}
                      style={form.subject === s ? { background: subjColor(s), borderColor: subjColor(s) } : {}}
                      onClick={() => setForm({ ...form, subject: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wnt-form-row">
                <label className="wnt-label">단원 · 주제 *</label>
                <input
                  className="wnt-input"
                  placeholder="예: 유리함수 그래프의 점근선"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>

              <div className="wnt-form-row wnt-two-col">
                <div>
                  <label className="wnt-label">출처 · 번호</label>
                  <input
                    className="wnt-input"
                    placeholder="예: 수학의 신 p.87 12번"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  />
                </div>
                <div>
                  <label className="wnt-label">⏱ 푼 시간</label>
                  <input
                    className="wnt-input"
                    placeholder="예: 12분 30초"
                    value={form.timeSpent}
                    onChange={(e) => setForm({ ...form, timeSpent: e.target.value })}
                  />
                </div>
              </div>

              <div className="wnt-form-row">
                <label className="wnt-label">틀린 이유 (과목별 · 복수 선택 · 기타는 직접 추가)</label>
                <div className="wnt-chip-row">
                  {formTags.map((t) => (
                    <button
                      key={t}
                      className={form.tags.includes(t) ? "wnt-tag-chip on" : "wnt-tag-chip"}
                      onClick={() => toggleFormTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="wnt-newtag-row">
                  <input
                    className="wnt-input"
                    placeholder="기타 실수 직접 입력 (예: 그래프 개형 착각)"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) addCustomTag();
                    }}
                  />
                  <button className="wnt-mini strong" onClick={addCustomTag} disabled={!newTagInput.trim()}>＋ 추가</button>
                </div>
              </div>

              <div className="wnt-form-row">
                <label className="wnt-label">메모 — 왜 틀렸고, 어떻게 풀어야 했나</label>
                <textarea
                  className="wnt-input wnt-textarea"
                  placeholder="예: 분모 ≠ 0 조건을 빼먹음. 정의역 확인부터 할 것."
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                />
              </div>

              <div className="wnt-form-row">
                <label className="wnt-label">문제 사진 (선택 · 최대 {MAX_PHOTOS}장)</label>
                {photoMsg && <div className="wnt-note-msg">{photoMsg}</div>}
                {form.photos.length > 0 && (
                  <div className="wnt-photo-thumbs">
                    {form.photos.map((p, i) => (
                      <div key={i} className="wnt-photo-thumb">
                        <img src={p} alt={`문제 사진 ${i + 1}`} onClick={() => setCropTarget(i)} />
                        <button className="wnt-thumb-crop" onClick={() => setCropTarget(i)} aria-label={`사진 ${i + 1} 자르기`}>✂️</button>
                        <button className="wnt-thumb-x" onClick={() => removePhoto(i)} aria-label={`사진 ${i + 1} 제거`}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {form.photos.length < MAX_PHOTOS && (
                  <div className="wnt-photo-btnrow">
                    <label className="wnt-photo-btn">
                      📷 촬영
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: "none" }} />
                    </label>
                    <label className="wnt-photo-btn">
                      🖼 앨범에서 선택
                      <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: "none" }} />
                    </label>
                    <HelpTip text="📷 촬영은 카메라가 바로 열리고, 🖼 앨범은 갤러리에서 골라요. 올린 사진을 눌러(또는 ✂️) 문제만 남게 자를 수 있어요. 사진은 자동 압축돼 저장되고, 풀 때 사진을 탭하면 크게 볼 수 있어요." />
                  </div>
                )}
              </div>

              <div className="wnt-form-actions">
                <button className="wnt-btn-ghost" onClick={() => { setFormOpen(false); setForm(emptyForm); clearDraft(); }}>취소</button>
                <button className="wnt-btn-primary" onClick={addEntry} disabled={!form.unit.trim()}>기록 저장</button>
              </div>
            </section>
          )}

          {/* 오늘 복습할 문제 자동 안내 — 앱 켜면 뜸 */}
          {(() => {
            if (dueDismiss || fDueOnly) return null;
            const dueCount = entries.filter((e) => {
              if (e.status === 3 || e.graduated) return false;
              const r = nextReviewInfo(e);
              return r && r.due;
            }).length;
            if (dueCount === 0) return null;
            const goal = goalCount(dueCount);
            return (
              <div className="wnt-due-banner">
                <span>📅 오늘 복습할 오답 <b>{dueCount}개</b> — {goalIsAll ? <>오늘 <b>전부</b> 풀어보자! 🔥</> : <>우선 <b>{goal}개</b>부터 줄게! 🔥</>}</span>
                <div className="wnt-due-banner-btns">
                  <button className="wnt-mini strong" onClick={() => { setListView("active"); setFDueOnly(true); }}>지금 풀기 →</button>
                  <button className="wnt-due-x" onClick={() => setDueDismiss(true)} aria-label="닫기">✕</button>
                </div>
              </div>
            );
          })()}

          {/* 복습 중 / 맞은 문제 전환 */}
          <div className="wnt-viewtabs">
            <button className={listView === "active" ? "wnt-viewtab on" : "wnt-viewtab"} onClick={() => setListView("active")}>
              📚 복습 중 <em>{entries.filter((e) => !(e.status === 3 || e.graduated)).length}</em>
            </button>
            <button className={listView === "done" ? "wnt-viewtab on" : "wnt-viewtab"} onClick={() => setListView("done")}>
              ✅ 맞은 문제 <em>{entries.filter((e) => e.status === 3 || e.graduated).length}</em>
            </button>
          </div>

          {/* 필터 + 선택 모드 */}
          <section className="wnt-filters">
            <select className="wnt-select" value={fSubject} onChange={(e) => setFSubject(e.target.value)}>
              <option>전체</option>
              {subjectNames.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="wnt-select" value={fTag} onChange={(e) => setFTag(e.target.value)}>
              <option>전체</option>
              {usedTags.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="wnt-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option>전체</option>
              {STATUS.map((s) => <option key={s.label}>{s.label}</option>)}
            </select>
            <input className="wnt-input wnt-search" placeholder="검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className={fStarOnly ? "wnt-mini strong" : "wnt-mini"} onClick={() => setFStarOnly(!fStarOnly)}>⭐ 중요만</button>
            <button className={fDueOnly ? "wnt-mini strong" : "wnt-mini"} onClick={() => setFDueOnly(!fDueOnly)}>📅 오늘 복습</button>
            <button className="wnt-mini" onClick={exportPrint} disabled={exporting || filtered.length === 0}>
              {exporting ? "만드는 중…" : "🖨 인쇄용 저장"}
            </button>
            {entries.length > 0 && (
              <button
                className={selectMode ? "wnt-mini strong" : "wnt-mini"}
                onClick={() => { setSelectMode(!selectMode); setSelected({}); setOpenCard(null); }}
              >
                {selectMode ? "선택 취소" : "☑ 선택 삭제"}
              </button>
            )}
          </section>

          {selectMode && (
            <div className="wnt-selectbar">
              <span>{selectedCount}개 선택됨</span>
              <div className="wnt-selectbar-btns">
                <button className="wnt-mini" onClick={() => {
                  const all = {};
                  filtered.forEach((e) => (all[e.id] = true));
                  setSelected(all);
                }}>표시된 전체 선택</button>
                <button className="wnt-mini danger" onClick={deleteSelected} disabled={selectedCount === 0}>
                  🗑 선택 삭제 ({selectedCount})
                </button>
              </div>
            </div>
          )}

          {/* 목록 */}
          {filtered.length === 0 ? (
            <div className="wnt-empty">
              {total === 0
                ? "아직 기록이 없어요. 첫 오답을 기록해 보세요 — 틀린 문제가 곧 점수예요."
                : "조건에 맞는 오답이 없어요. 필터를 조정해 보세요."}
            </div>
          ) : (
            <ul className="wnt-list">
              {filtered.map((e) => (
                <li key={e.id} className={(e.status === 3 ? "wnt-card done" : "wnt-card") + (selectMode && selected[e.id] ? " picked" : "")}>
                  <div className="wnt-card-top">
                    {selectMode && (
                      <input
                        type="checkbox"
                        className="wnt-checkbox"
                        checked={!!selected[e.id]}
                        onChange={() => setSelected((s) => ({ ...s, [e.id]: !s[e.id] }))}
                        aria-label={`${e.unit} 선택`}
                      />
                    )}
                    <button className="wnt-star" onClick={() => toggleStar(e.id)} aria-label={e.starred ? "중요 해제" : "중요 표시"}>
                      {e.starred ? "⭐" : "☆"}
                    </button>
                    <span className="wnt-subj" style={{ background: subjColor(e.subject) }}>{e.subject}</span>
                    <span className="wnt-unit">{e.unit}</span>
                    {e.retry && <span className="wnt-retry-badge">🔁 다시</span>}
                    {(e.wrongCount || 0) > 1 && <span className="wnt-wrong-badge">❌ {e.wrongCount}회</span>}
                    {e.graduated && <span className="wnt-grad-badge">🎓 졸업</span>}
                    {e.status === 3 && <span className="wnt-stamp">👑 정복</span>}
                    {!selectMode && (
                      <button className="wnt-card-toggle" onClick={() => setOpenCard(openCard === e.id ? null : e.id)}>
                        {openCard === e.id ? "▴ 접기" : "▾ 풀기"}
                      </button>
                    )}
                  </div>
                  <div className="wnt-source">
                    {e.source ? `${e.source} · ` : ""}{e.createdAt}
                    {e.timeSpent ? ` · ⏱ ${e.timeSpent}` : ""}
                    {lastSolve(e) ? ` · 최근 복습 ⏱ ${fmtSec(lastSolve(e).sec)}` : ""}
                    {(() => {
                      const st = e.solveTimes || [];
                      if (st.length < 2) return "";
                      const prev = st[st.length - 2].sec, last = st[st.length - 1].sec;
                      if (last < prev) return ` · ⚡ ${fmtSec(prev)}→${fmtSec(last)} 단축`;
                      return "";
                    })()}
                    {(() => {
                      const r = nextReviewInfo(e);
                      if (!r) return "";
                      return r.due
                        ? <span className="wnt-due"> · 📅 복습할 때!</span>
                        : ` · 📅 복습 ${r.days}일 뒤(${r.dateStr})`;
                    })()}
                  </div>
                  {(e.tags || []).length > 0 && (
                    <div className="wnt-card-tags">
                      {e.tags.map((t) => <span key={t} className="wnt-red-tag">{t}</span>)}
                    </div>
                  )}

                  {openCard === e.id && (<>
                  {e.memo && <p className="wnt-memo">{e.memo}</p>}

                  {/* 발상 노트 — 메모 아래, 접혀 있다가 클릭하면 표시 */}
                  {e.insight && (
                    <div className="wnt-idea-inline">
                      <button className="wnt-mini idea" onClick={() => setInsightOpen((o) => ({ ...o, [e.id]: !o[e.id] }))}>
                        {insightOpen[e.id] ? "💡 발상 노트 접기 ▲" : "💡 발상 노트 보기"}
                      </button>
                      {insightOpen[e.id] && (
                        <div className="wnt-idea">
                          <div className="wnt-idea-head">
                            💡 발상 카드
                            <button className="wnt-mini danger" onClick={() => removeInsight(e.id)}>삭제</button>
                          </div>
                          <strong className="wnt-idea-title">{e.insight.title}</strong>
                          <ul className="wnt-idea-points">
                            {e.insight.points.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {insightMsg[e.id] && <div className="wnt-note-msg">{insightMsg[e.id]}</div>}
                  {insightBridge[e.id] && (
                    <button className="wnt-mini idea" style={{ marginTop: 6 }} onClick={() => openInClaudeApp(insightBridge[e.id])}>
                      📲 Claude 앱에서 발상 정리하기
                    </button>
                  )}

                  {/* 문제 사진 */}
                  {e.hasImage && (
                    <div className="wnt-photo-area">
                      <div className="wnt-photo-btns">
                        <button className="wnt-mini" onClick={() => toggleImage(e.id)}>
                          {openImages[e.id] ? "사진 접기 ▲" : `📷 문제 사진 보기${e.photoCount > 1 ? ` (${e.photoCount}장)` : ""}`}
                        </button>
                        <button className="wnt-mini" onClick={() => savePhoto(e.id)} disabled={!imageCache[e.id]}>📥 사진첩에 저장</button>
                      </div>
                      {openImages[e.id] && imageCache[e.id] &&
                        imageCache[e.id].map((src, i) => (
                          <img key={i} className="wnt-photo" src={src} alt={`${e.unit} 문제 사진 ${i + 1}`} style={{ cursor: "zoom-in" }} onClick={() => setZoomSrc(src)} />
                        ))}
                    </div>
                  )}

                  {/* 도구 버튼 줄 */}
                  {!selectMode && (
                    <div className="wnt-tools">
                      <button className={cardPadOpen[e.id] ? "wnt-mini strong" : "wnt-mini"} onClick={() => setCardPadOpen((o) => ({ ...o, [e.id]: !o[e.id] }))}>
                        {cardPadOpen[e.id] ? "✍️ 풀이 패드 접기 ▲" : "✍️ 풀이 패드 (펜슬로 풀기)"}
                      </button>
                      <button className="wnt-mini" onClick={() => openSolutionForm(e.id)}>✏️ 풀이 남기기</button>
                      {(e.solutions || []).length > 0 && (
                        <button className="wnt-mini" onClick={() => toggleSolutions(e.id)}>
                          풀이 기록 {(e.solutions || []).length}{solOpen[e.id] ? " ▲" : ""}
                        </button>
                      )}
                      {!e.insight && (
                        <label className={insightLoading[e.id] ? "wnt-mini idea disabled" : "wnt-mini idea"}>
                          {insightLoading[e.id] ? "발상 정리 중…" : "💡 발상 올리기"}
                          {!insightLoading[e.id] && (
                            <input type="file" accept="image/*" onChange={(ev) => makeInsight(e, ev)} style={{ display: "none" }} />
                          )}
                        </label>
                      )}
                      {e.hasImage && (
                        <button className="wnt-mini variant" onClick={() => explainProblem(e)} disabled={explainLoading[e.id]}>
                          {explainLoading[e.id] ? "풀이 분석 중…" : "📖 문제 풀이"}
                        </button>
                      )}
                      <button className="wnt-mini ai" onClick={() => toggleAi(e.id)}>
                        🤖 AI 도우미{aiOpen[e.id] ? " ▲" : ""}
                      </button>
                      <HelpTip text="📖 문제 풀이: 문제 사진을 분석해 정답 해설지처럼 풀이를 알려줘요. ✏️ 풀이 남기기: 다시 푼 풀이를 글·사진으로 기록 + 채점. 💡 발상 올리기: 손으로 정리한 발상 사진을 AI가 카드로 요약. 🤖 AI 도우미: 힌트 유도 또는 대화. (변형문제는 위 '변형문제' 탭에서 만들어요.)" />
                    </div>
                  )}

                  {/* 기록 카드에서 바로 풀기 — 좌우분할 풀이 패드 */}
                  {!selectMode && cardPadOpen[e.id] && (
                    <SolvePad key={"cardpad-" + e.id} gradeFn={flashGradeFn(e)} solveFn={e.hasImage ? flashSolveFn(e) : null}
                      problem={e.hasImage ? (
                        <div className="wnt-flash-imgs in-pad">
                          {imageCache[e.id]
                            ? imageCache[e.id].map((src, i) => (
                                <img key={i} className="wnt-photo" src={src} alt={`${e.unit} 문제 ${i + 1}`} style={{ cursor: "zoom-in" }} onClick={() => setZoomSrc(src)} />
                              ))
                            : <div className="wnt-loading">사진 불러오는 중…</div>}
                        </div>
                      ) : null}
                      bridge={() => "너는 채점 선생님이야. 첨부한 이미지 중 손글씨가 내 풀이고, 나머지는 문제 사진이야.\n과목: " + e.subject + " / 단원: " + e.unit + "\n먼저 짧게 채점만 해줘: ⭕/❌ + 잘한 점·틀린 부분 1~2줄. 그다음 내가 '풀이도 짧게 알려줘'라고 하면 3~4줄 간략 풀이를 줘."} />
                  )}

                  {/* 문제 풀이(AI 해설) 결과 */}
                  {!selectMode && explainResult[e.id] && (
                    <div className="wnt-solve-box">
                      <div className="wnt-panel-head">📖 문제 풀이</div>
                      <p className="wnt-solve-text">{explainResult[e.id]}</p>
                      {explainBridge[e.id] && (
                        <button className="wnt-mini idea" onClick={() => openInClaudeApp(explainBridge[e.id])}>📲 Claude 앱에서 풀이 받기</button>
                      )}
                    </div>
                  )}

                  {/* 풀이 남기기 폼 */}
                  {!selectMode && solFormOpen[e.id] && (
                    <div className="wnt-sol-form">
                      <textarea
                        className="wnt-input wnt-textarea"
                        placeholder="다시 푼 풀이나 새로 깨달은 점을 적어보세요"
                        value={solForm.text}
                        onChange={(ev) => setSolForm({ ...solForm, text: ev.target.value })}
                      />
                      {solForm.photos.length > 0 && (
                        <div className="wnt-photo-thumbs">
                          {solForm.photos.map((p, i) => (
                            <div key={i} className="wnt-photo-thumb">
                              <img src={p} alt={`풀이 사진 ${i + 1}`} />
                              <button
                                className="wnt-thumb-x"
                                onClick={() => setSolForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                                aria-label="사진 제거"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="wnt-sol-form-row">
                        {solForm.photos.length < MAX_SOL_PHOTOS && (
                          <label className="wnt-photo-btn small">
                            📷 풀이 사진
                            <input type="file" accept="image/*" multiple onChange={handleSolPhotoSelect} style={{ display: "none" }} />
                          </label>
                        )}
                        <label className="wnt-check">
                          <input
                            type="checkbox"
                            checked={solForm.solved}
                            onChange={(ev) => setSolForm({ ...solForm, solved: ev.target.checked })}
                          />
                          이번엔 맞았어요 (복습 단계 올리기)
                        </label>
                      </div>
                      <div className="wnt-form-actions">
                        <button className="wnt-btn-ghost" onClick={() => setSolFormOpen((o) => ({ ...o, [e.id]: false }))}>취소</button>
                        <button
                          className="wnt-btn-primary"
                          onClick={() => saveSolution(e.id)}
                          disabled={!solForm.text.trim() && solForm.photos.length === 0}
                        >풀이 저장</button>
                      </div>
                    </div>
                  )}

                  {/* 풀이 기록 목록 */}
                  {!selectMode && solOpen[e.id] && (e.solutions || []).length > 0 && (
                    <div className="wnt-sol-list">
                      {e.solutions.map((s, i) => (
                        <div key={s.id} className="wnt-sol-item">
                          <div className="wnt-sol-head">{i + 1}번째 풀이 · {s.date}</div>
                          {s.text && <p className="wnt-sol-text">{s.text}</p>}
                          {s.hasPhotos && solPhotoCache[s.id] &&
                            solPhotoCache[s.id].map((src, j) => (
                              <img key={j} className="wnt-photo" src={src} alt={`풀이 사진 ${j + 1}`} />
                            ))}
                          <button className="wnt-mini strong" style={{ marginTop: 6 }} onClick={() => gradeSolution(e, s)} disabled={solGradeLoading[s.id]}>
                            {solGradeLoading[s.id] ? "채점 중…" : "✅ 이 풀이 채점받기"}
                          </button>
                          {solGrade[s.id] && <p className="wnt-sol-grade">{solGrade[s.id]}</p>}
                          {solGradeBridge[s.id] && (
                            <button className="wnt-mini idea" style={{ marginTop: 4 }} onClick={() => openInClaudeApp(solGradeBridge[s.id])}>📲 Claude 앱에서 채점받기</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI 풀이 도우미 */}
                  {!selectMode && aiOpen[e.id] && (
                    <div className="wnt-ai">
                      <div className="wnt-panel-head">🤖 AI 풀이 도우미 <span>대화는 앱을 닫으면 사라져요</span></div>
                      {e.hasImage ? (
                        <div className="wnt-ai-accurate">
                          <p className="wnt-ai-q">📷 이 문제는 사진을 봐야 정확히 도와줄 수 있어요.</p>
                          <ol className="wnt-ai-steps">
                            <li>아래 <b>📥 문제 사진 저장</b>으로 사진첩에 저장해요.</li>
                            <li><b>📲 Claude 앱에서 물어보기</b>를 눌러 새 채팅을 열어요 (질문은 자동 복사돼요).</li>
                            <li>클로드 앱 입력창의 <b>＋</b>(사진 첨부)로 방금 저장한 문제 사진을 붙이고 전송해요.</li>
                          </ol>
                          <div className="wnt-ai-accurate-btns">
                            <button className="wnt-mini" onClick={() => savePhoto(e.id)} disabled={!imageCache[e.id]}>📥 문제 사진 저장</button>
                            <button className="wnt-mini idea" onClick={() => openInClaudeApp(aiBridgePrompt(e))}>📲 Claude 앱에서 물어보기</button>
                          </div>
                        </div>
                      ) : !aiMode[e.id] ? (
                        <div className="wnt-ai-modes">
                          <p className="wnt-ai-q">어떤 방식으로 도와드릴까요?</p>
                          <button className="wnt-mode-btn" onClick={() => chooseAiMode(e, "socratic")}>
                            🧭 방향만 잡아줘
                            <span>힌트로 사고를 확장하면서 내가 직접 풀어나갈래</span>
                          </button>
                          <button className="wnt-mode-btn" onClick={() => chooseAiMode(e, "direct")}>
                            📖 풀이 먼저 보여줘
                            <span>풀이 과정을 먼저 보고, 궁금한 걸 물어볼래</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="wnt-ai-msgs">
                            {(aiChats[e.id] || []).length === 0 && aiMode[e.id] === "socratic" && (
                              <div className="wnt-ai-starters">
                                <button className="wnt-mini" onClick={() => sendAi(e, "이 문제를 어디서부터 접근하면 좋을지 힌트 하나만 주세요")}>첫 힌트</button>
                                <button className="wnt-mini" onClick={() => sendAi(e, "제가 기록한 틀린 이유를 참고해서, 이 문제에서 조심할 함정을 짚어주세요")}>함정 짚어줘</button>
                              </div>
                            )}
                            {(aiChats[e.id] || []).map((m, i) => (
                              <div key={i} className={m.role === "user" ? "wnt-msg me" : "wnt-msg ai"}>{m.text}</div>
                            ))}
                            {aiLoading[e.id] && <div className="wnt-msg ai">생각 중…</div>}
                          </div>
                          <div className="wnt-ai-inputrow">
                            <input
                              className="wnt-input"
                              placeholder="질문이나 내 풀이를 입력…"
                              value={aiInput[e.id] || ""}
                              onChange={(ev) => setAiInput((v) => ({ ...v, [e.id]: ev.target.value }))}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" && !ev.nativeEvent.isComposing) sendAi(e);
                              }}
                            />
                            <button className="wnt-btn-primary" onClick={() => sendAi(e)} disabled={aiLoading[e.id]}>전송</button>
                          </div>
                          <button className="wnt-modeswitch" onClick={() => resetAiMode(e.id)}>모드 다시 선택 (대화 초기화)</button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="wnt-card-bottom">
                    <div className="wnt-steps">
                      {STATUS.map((s, i) => (
                        <span key={s.label} className={i <= e.status ? "wnt-step on" : "wnt-step"}>{s.short}</span>
                      ))}
                    </div>
                    {!selectMode && (
                      <div className="wnt-card-actions">
                        {e.status > 0 && <button className="wnt-mini" onClick={() => revertStatus(e.id)}>되돌리기</button>}
                        {e.status < 3 && (
                          <button className="wnt-mini strong" onClick={() => advanceStatus(e.id)}>다시 풀어서 맞음 ✓</button>
                        )}
                        <button className="wnt-mini danger" onClick={() => deleteEntry(e.id)}>삭제</button>
                      </div>
                    )}
                  </div>
                  </>)}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : tab === "flash" ? (
        /* ---- 플래시카드 탭 ---- */
        <section className="wnt-flash">
          <div className="wnt-flash-bar">
            <select className="wnt-select" value={flashSubject} onChange={(e) => setFlashSubject(e.target.value)}>
              <option>전체</option>
              {subjectNames.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="wnt-mini strong" onClick={buildDeck}>🔀 다시 섞기</button>
            <button className={flashRetryOnly ? "wnt-mini strong" : "wnt-mini"} onClick={() => setFlashRetryOnly(!flashRetryOnly)}>🔁 다시 풀기만</button>
            <button className={flashStarOnly ? "wnt-mini strong" : "wnt-mini"} onClick={() => setFlashStarOnly(!flashStarOnly)}>⭐ 중요만</button>
            <HelpTip text="사진이 있는 오답이 과목별·랜덤으로 나와요. 스톱워치 또는 3분 타이머(+1분 최대 2회)로 실전처럼 풀고, 시간 초과나 ❌를 누르면 '다시 풀기' 목록에 담겨요. ✍️ 풀이 패드에서 펜슬로 바로 풀고 AI 채점도 받을 수 있어요." />
            {flashDeck.length > 0 && (
              <span className="wnt-flash-count">{flashIdx + 1} / {flashDeck.length}</span>
            )}
          </div>

          {flashDeck.length === 0 || !flashEntry ? (
            <div className="wnt-empty">
              {flashSubject === "전체"
                ? "조건에 맞는 사진 오답이 없어요. 기록 탭에서 문제 사진과 함께 오답을 남기면 플래시카드로 볼 수 있어요."
                : `${flashSubject} 과목에 조건에 맞는 사진 오답이 없어요.`}
            </div>
          ) : (
            <div className="wnt-flash-card">
              <div className="wnt-flash-top">
                <button className="wnt-star" onClick={() => toggleStar(flashEntry.id)} aria-label={flashEntry.starred ? "중요 해제" : "중요 표시"}>
                  {flashEntry.starred ? "⭐" : "☆"}
                </button>
                <span className="wnt-subj" style={{ background: subjColor(flashEntry.subject) }}>{flashEntry.subject}</span>
                <span className="wnt-unit">{flashEntry.unit}</span>
                {flashEntry.retry && <span className="wnt-retry-badge">🔁 다시 풀기</span>}
                {(flashEntry.wrongCount || 0) > 1 && <span className="wnt-wrong-badge">❌ {flashEntry.wrongCount}회</span>}
                {flashEntry.source && <span className="wnt-flash-src">{flashEntry.source}</span>}
              </div>

              {mistakeNote(flashEntry) && <div className="wnt-mistake-note">{mistakeNote(flashEntry)}</div>}

              {/* 타이머: 스톱워치 / 3분 타이머 (+1분 최대 2회) */}
              <div className="wnt-timer">
                <div className="wnt-timer-modes">
                  <button
                    className={timerMode === "stop" ? "wnt-mini strong" : "wnt-mini"}
                    onClick={() => { setTimerMode("stop"); setTimerOn(false); setTimerSec(0); setExtendsUsed(0); setFlashTimeout(false); }}
                  >스톱워치</button>
                  <button
                    className={timerMode === "count" ? "wnt-mini strong" : "wnt-mini"}
                    onClick={() => { setTimerMode("count"); setTimerOn(false); setTimerSec(0); setExtendsUsed(0); setFlashTimeout(false); }}
                  >3분 타이머</button>
                </div>
                <span className={timerOn ? "wnt-timer-num running" : "wnt-timer-num"}>
                  ⏱ {timerMode === "count" ? fmtSec(Math.max(180 + 60 * extendsUsed - timerSec, 0)) : fmtSec(timerSec)}
                </span>
                <button className="wnt-mini strong" onClick={() => setTimerOn(!timerOn)} disabled={flashTimeout && extendsUsed >= 2}>
                  {timerOn ? "⏸ 일시정지" : timerSec > 0 ? "▶ 계속" : timerMode === "count" ? "▶ 3분 시작" : "▶ 풀기 시작"}
                </button>
                {timerMode === "count" && extendsUsed < 2 && (timerOn || flashTimeout) && (
                  <button
                    className="wnt-mini"
                    onClick={() => {
                      setExtendsUsed((x) => x + 1);
                      if (flashTimeout) { setFlashTimeout(false); setTimerOn(true); }
                    }}
                  >＋1분 ({2 - extendsUsed}회 남음)</button>
                )}
                {timerSec > 0 && !timerOn && (
                  <button className="wnt-mini" onClick={() => { setTimerSec(0); setExtendsUsed(0); setFlashTimeout(false); }}>리셋</button>
                )}
                {flashEntry.timeSpent && <span className="wnt-timer-ref">처음엔 {flashEntry.timeSpent} 걸렸어요</span>}
              </div>
              {flashTimeout && (
                <div className="wnt-timeout">
                  ⏰ 시간 초과 — '다시 풀기' 목록에 담았어요.{extendsUsed < 2 ? " ＋1분으로 이어서 풀 수도 있어요." : " 다음에 다시 도전해요!"}
                </div>
              )}
              {gradMsg && <div className="wnt-grad">{gradMsg}</div>}

              {!flashPadOpen && (
                <div className="wnt-flash-imgs">
                  {imageCache[flashEntry.id]
                    ? imageCache[flashEntry.id].map((src, i) => (
                        <img key={i} className="wnt-photo" src={src} alt={`${flashEntry.unit} 문제 ${i + 1}`} style={{ cursor: "zoom-in" }} onClick={() => setZoomSrc(src)} />
                      ))
                    : <div className="wnt-loading">사진 불러오는 중…</div>}
                </div>
              )}

              <div className="wnt-flash-reveals">
                <button className={flashPadOpen ? "wnt-mini strong" : "wnt-mini"} onClick={() => setFlashPadOpen(!flashPadOpen)}>
                  {flashPadOpen ? "✍️ 풀이 패드 접기 ▲" : "✍️ 풀이 패드 (펜슬로 풀기)"}
                </button>
                {flashEntry.insight ? (
                  <button className="wnt-mini idea" onClick={() => setFlashHint(!flashHint)}>
                    {flashHint ? "발상 힌트 접기 ▲" : "💡 발상 힌트 보기"}
                  </button>
                ) : (
                  <span className="wnt-flash-nohint">발상 카드 없음 (기록 탭에서 추가)</span>
                )}
                {flashEntry.memo && (
                  <button className="wnt-mini" onClick={() => setFlashMemo(!flashMemo)}>
                    {flashMemo ? "메모 접기 ▲" : "📝 오답 메모 보기"}
                  </button>
                )}
                {flashDelAsk ? (
                  <span className="wnt-flash-del-confirm">
                    이 기록을 삭제할까요?
                    <button className="wnt-mini danger" onClick={() => deleteEntry(flashEntry.id)}>네, 삭제</button>
                    <button className="wnt-mini" onClick={() => setFlashDelAsk(false)}>아니요</button>
                  </span>
                ) : (
                  <button className="wnt-mini danger" onClick={() => setFlashDelAsk(true)}>🗑 삭제</button>
                )}
              </div>

              {flashPadOpen && <SolvePad key={"pad-" + flashEntry.id} gradeFn={flashGradeFn(flashEntry)} solveFn={flashSolveFn(flashEntry)}
                problem={
                  <div className="wnt-flash-imgs in-pad">
                    {imageCache[flashEntry.id]
                      ? imageCache[flashEntry.id].map((src, i) => (
                          <img key={i} className="wnt-photo" src={src} alt={`${flashEntry.unit} 문제 ${i + 1}`} style={{ cursor: "zoom-in" }} onClick={() => setZoomSrc(src)} />
                        ))
                      : <div className="wnt-loading">사진 불러오는 중…</div>}
                  </div>
                }
                bridge={() => "너는 채점 선생님이야. 첨부한 이미지 중 손글씨가 내 풀이고, 나머지는 문제 사진이야.\n과목: " + flashEntry.subject + " / 단원: " + flashEntry.unit + "\n먼저 짧게 채점만 해줘: ⭕/❌ + 잘한 점·틀린 부분 1~2줄. 그다음 내가 '풀이도 짧게 알려줘'라고 하면 3~4줄 간략 풀이를 줘."} />}

              {flashHint && flashEntry.insight && (
                <div className="wnt-idea">
                  <strong className="wnt-idea-title">{flashEntry.insight.title}</strong>
                  <ul className="wnt-idea-points">
                    {flashEntry.insight.points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {flashMemo && flashEntry.memo && <p className="wnt-memo">{flashEntry.memo}</p>}

              <div className="wnt-flash-nav">
                <button className="wnt-mini" onClick={() => flashMove(-1)} disabled={flashIdx === 0}>◀ 이전</button>
                <div className="wnt-flash-mid">
                  {flashEntry.status < 3 ? (
                    <button className="wnt-mini strong" onClick={() => flashCorrect(flashEntry)}>
                      이번엔 맞음 ✓{timerSec > 0 ? ` (${fmtSec(timerSec)} 기록)` : ""}
                    </button>
                  ) : (
                    <span className="wnt-stamp">👑 정복</span>
                  )}
                  <button
                    className="wnt-mini danger"
                    onClick={() => {
                      flashWrong(flashEntry.id);
                      setTimerOn(false);
                      if (flashIdx < flashDeck.length - 1) flashMove(1);
                    }}
                  >❌ 못 풀었어요</button>
                </div>
                <button className="wnt-mini" onClick={() => flashMove(1)} disabled={flashIdx >= flashDeck.length - 1}>다음 ▶</button>
              </div>
            </div>
          )}
        </section>
      ) : tab === "variant" ? (
        /* ---- 변형문제 탭 ---- */
        <section className="wnt-vt">
          <div className="wnt-vt-intro">
            🔥 <strong>포항제철고 내신을 극악하게 내는 20년차 교사</strong>가 소이님의 오답과 실수 패턴을 노려 출제해요.
            특정 문제를 고르거나, 과목의 실수 패턴을 종합해 출제할 수 있어요.
            <strong> ⚠️ 출제된 문제는 앱을 닫으면 사라져요 — 남기고 싶은 문제는 화면을 캡처해 두세요 📸</strong>
            <HelpTip text="출제 후 각 문제의 ✍️ 풀이 패드를 열면 펜슬로 바로 풀고 AI 채점까지 받을 수 있어요. 3분 타이머(+1분×2)로 실전처럼 시간을 재보세요. 기준 교재는 ⚙️ 설정에서 과목별로 바꿀 수 있어요." />
          </div>

          {entries.length === 0 ? (
            <div className="wnt-empty">기록된 오답이 있어야 변형문제를 만들 수 있어요. 기록 탭에서 먼저 오답을 남겨주세요.</div>
          ) : (
            <>
              <div className="wnt-vt-bar">
                <select
                  className="wnt-select"
                  value={vtSubject}
                  onChange={(e) => { setVtSubject(e.target.value); setVtEntryId("sum"); }}
                >
                  <option>전체</option>
                  {subjectNames.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select className="wnt-select wnt-vt-entry" value={vtEntryId} onChange={(e) => setVtEntryId(e.target.value)}>
                  <option value="sum">📊 실수 패턴 종합 기반</option>
                  {vtPool.map((e) => (
                    <option key={e.id} value={e.id}>{e.subject} · {e.unit}</option>
                  ))}
                </select>
                <button className="wnt-btn-primary" onClick={() => vtGenerate(false)} disabled={vtLoading || vtPool.length === 0}>
                  🎯 출제하기
                </button>
              </div>

              <div className="wnt-vt-levels">
                <span className="wnt-vt-levels-label">난이도 선택:</span>
                {["쌍둥이", "상", "최상"].map((lv) => (
                  <button
                    key={lv}
                    className={vtLevels.includes(lv) ? "wnt-mini strong" : "wnt-mini"}
                    onClick={() => setVtLevels((ls) =>
                      ls.includes(lv)
                        ? (ls.length > 1 ? ls.filter((x) => x !== lv) : ls)
                        : ["쌍둥이", "상", "최상"].filter((x) => x === lv || ls.includes(x))
                    )}
                  >{vtLevels.includes(lv) ? "✓ " : ""}{lv}</button>
                ))}
                <HelpTip text="출제할 난이도를 골라요. 쌍둥이=원 문제와 같은 난이도 연습용, 상=실수를 찌르는 함정, 최상=킬러 문항. 여러 개 켜면 각각 1문제씩 나와요." />
              </div>

              {vtSubject !== "전체" && subjBook(vtSubject) && (
                <div className="wnt-vt-book">📚 출제 기준 교재: <strong>{subjBook(vtSubject)}</strong> — 이 교재의 난이도·스타일로 변형해요 (설정 탭에서 변경 가능)</div>
              )}

              {vtPool.length === 0 && (
                <div className="wnt-empty">{vtSubject} 과목의 오답 기록이 없어요.</div>
              )}

              {vtProblems.length > 0 && (
                <div className="wnt-timer">
                  <span className={vtTimerOn ? "wnt-timer-num running" : "wnt-timer-num"}>
                    ⏱ {fmtSec(Math.max(180 + 60 * vtExtends - vtTimerSec, 0))}
                  </span>
                  <button className="wnt-mini strong" onClick={() => setVtTimerOn(!vtTimerOn)} disabled={!vtTimerOn && vtTimerSec >= 180 + 60 * vtExtends && vtExtends >= 2}>
                    {vtTimerOn ? "⏸ 일시정지" : vtTimerSec > 0 ? "▶ 계속" : "▶ 3분 타이머 시작"}
                  </button>
                  {vtExtends < 2 && vtTimerSec > 0 && (
                    <button className="wnt-mini" onClick={() => setVtExtends((x) => x + 1)}>＋1분 ({2 - vtExtends}회 남음)</button>
                  )}
                  {vtTimerSec > 0 && !vtTimerOn && (
                    <button className="wnt-mini" onClick={() => { setVtTimerSec(0); setVtExtends(0); }}>리셋</button>
                  )}
                  {!vtTimerOn && vtTimerSec >= 180 + 60 * vtExtends && vtTimerSec > 0 && (
                    <span className="wnt-timer-ref timeout-ref">⏰ 시간 종료!</span>
                  )}
                </div>
              )}

              {vtProblems.map((v, i) => {
                const collapsed = vtCollapsed[i];
                return (
                <div key={i} className="wnt-variant-item big">
                  <div className="wnt-variant-head">
                    <span className={v.level === "최상" ? "wnt-level top" : v.level === "쌍둥이" ? "wnt-level twin" : "wnt-level"}>{v.level}</span>
                    {collapsed && <span className="wnt-variant-peek">{(v.question || "").slice(0, 24)}…</span>}
                    <div className="wnt-variant-head-btns">
                      <button className="wnt-card-toggle" onClick={() => setVtCollapsed((c) => ({ ...c, [i]: !c[i] }))}>
                        {collapsed ? "▾ 펼치기" : "▴ 접기"}
                      </button>
                      <button className="wnt-variant-x" onClick={() => hideVariant(i)} aria-label="이 문제 치우기" title="치우기">✕</button>
                    </div>
                  </div>
                  {!collapsed && (<>
                  <p className="wnt-variant-q">{v.question}</p>
                  {(v.hint || v.answer) && (
                    <div className="wnt-variant-btns">
                      <button className={vtPadOpen[i] ? "wnt-mini strong" : "wnt-mini"} onClick={() => setVtPadOpen((o) => ({ ...o, [i]: !o[i] }))}>
                        {vtPadOpen[i] ? "✍️ 풀이 패드 접기" : "✍️ 풀이 패드"}
                      </button>
                      <button className="wnt-mini" onClick={() => retryVariant(i)}>🔁 다시 풀기</button>
                      {v.hint && (
                        <button className="wnt-mini" onClick={() => setVtReveal((r) => ({ ...r, [`${i}-h`]: !r[`${i}-h`] }))}>
                          {vtReveal[`${i}-h`] ? "힌트 접기" : "💡 힌트 보기"}
                        </button>
                      )}
                      {v.answer && (
                        <button className="wnt-mini" onClick={() => setVtReveal((r) => ({ ...r, [`${i}-a`]: !r[`${i}-a`] }))}>
                          {vtReveal[`${i}-a`] ? "정답 접기" : "✅ 정답 바로 보기"}
                        </button>
                      )}
                    </div>
                  )}
                  {vtPadOpen[i] && <SolvePad key={"vtpad-" + i + "-" + (vtPadNonce[i] || 0)} gradeFn={vtGradeFn(v)} solveFn={vtSolveFn(v)}
                    problem={<p className="wnt-variant-q in-pad">{v.question}</p>}
                    bridge={() => "너는 채점 선생님이야. 아래 문제에 대한 첨부 이미지(손글씨)가 내 풀이야.\n[문제] " + v.question + (v.answer ? "\n[모범 풀이·정답] " + v.answer : "") + "\n먼저 짧게 채점만: ⭕/❌ + 잘한 점·틀린 부분 1~2줄. 그다음 '풀이도 짧게'라고 하면 3~4줄 간략 풀이."} />}
                  {vtReveal[`${i}-h`] && v.hint && <p className="wnt-variant-reveal">💡 {v.hint}</p>}
                  {vtReveal[`${i}-a`] && v.answer && <p className="wnt-variant-reveal ans">{v.answer}</p>}
                  </>)}
                </div>
                );
              })}

              {vtLoading ? (
                <div className="wnt-loading">출제 중… 함정을 파는 중이에요 ✍️</div>
              ) : (
                vtProblems.length > 0 && (
                  <button className="wnt-mini strong" onClick={() => vtGenerate(true)}>➕ 더 만들어줘 (선택한 난이도로)</button>
                )
              )}
            </>
          )}
        </section>
      ) : tab === "stats" ? (
        /* ---- 통계 탭 ---- */
        <section className="wnt-stats">
          <div className="wnt-stat-cards">
            <div className="wnt-stat-card">
              <span className="wnt-stat-num">{total}</span>
              <span className="wnt-stat-label">누적 오답</span>
            </div>
            <div className="wnt-stat-card">
              <span className="wnt-stat-num">{mastered}</span>
              <span className="wnt-stat-label">완전 정복</span>
            </div>
            <div className="wnt-stat-card">
              <span className="wnt-stat-num">{total ? Math.round((mastered / total) * 100) : 0}%</span>
              <span className="wnt-stat-label">정복률</span>
            </div>
          </div>

          {topTag && (
            <div className="wnt-insight-banner">
              가장 자주 걸리는 함정: <strong>{topTag.tag}</strong> ({topTag.count}회) — 이 유형만 필터로 모아서 다시 풀어보세요.
            </div>
          )}

          <h2 className="wnt-h2">틀린 이유별 분포</h2>
          <div className="wnt-bars">
            {tagCounts.map((t) => (
              <div key={t.tag} className="wnt-bar-row">
                <span className="wnt-bar-label">{t.tag}</span>
                <div className="wnt-bar-track">
                  <div className="wnt-bar-fill red" style={{ width: `${(t.count / maxTag) * 100}%` }} />
                </div>
                <span className="wnt-bar-num">{t.count}</span>
              </div>
            ))}
          </div>

          <h2 className="wnt-h2">과목별 오답 · 정복 현황</h2>
          <div className="wnt-bars">
            {subjCounts.map((s) => (
              <div key={s.subject} className="wnt-bar-row">
                <span className="wnt-bar-label">{s.subject}</span>
                <div className="wnt-bar-track">
                  <div className="wnt-bar-fill" style={{ width: `${(s.count / maxSubj) * 100}%`, background: subjColor(s.subject) }} />
                </div>
                <span className="wnt-bar-num">{s.done}/{s.count}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* ---- 설정 탭 ---- */
        <section className="wnt-settings">
          {settingMsg && <div className="wnt-setting-msg">{settingMsg}</div>}

          <div className="wnt-set-section">
            <h2 className="wnt-h2">🧹 저장공간 <HelpTip text="저장에 실패하거나 '공간 부족'이 뜰 때 눌러요. 어떤 오답에도 연결되지 않은 옛 사진·임시저장 찌꺼기를 지워 공간을 되찾아요. 실제 오답 기록은 지우지 않아요." /></h2>
            <p className="wnt-set-desc">저장이 안 되거나 '공간 부족'이 뜨면 눌러요. 안 쓰는 찌꺼기 데이터만 비워요 (오답 기록은 안 지워져요).</p>
            <button className="wnt-btn-primary" onClick={cleanupStorage} disabled={cleaning}>{cleaning ? "비우는 중…" : "🧹 저장공간 비우기"}</button>
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">🔥 오늘의 목표 <HelpTip text="복습 팝업에서 '우선 몇 개부터' 안내할 개수예요. 상한선이 아니라 부담을 줄이는 추천 개수라, 실제로는 얼마든지 더 풀 수 있어요." /></h2>
            <p className="wnt-set-desc">복습 팝업에서 "우선 N개부터 줄게"라고 안내할 개수예요 (상한선 아님, 더 풀어도 돼요).</p>
            <div className="wnt-goal-row">
              {[3, 5, 10].map((n) => (
                <button key={n} className={dailyGoal === n ? "wnt-mini strong" : "wnt-mini"} onClick={() => saveData({ dailyGoal: n })}>{n}개</button>
              ))}
              <button className={goalIsAll ? "wnt-mini strong" : "wnt-mini"} onClick={() => saveData({ dailyGoal: "all" })}>전부 다</button>
              <input className="wnt-input wnt-goal-input" type="number" min="1" max="99" value={typeof dailyGoal === "number" ? dailyGoal : ""}
                placeholder="직접"
                onChange={(e) => { const v = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 3)); setDailyGoal(v); }}
                onBlur={() => { if (typeof dailyGoal === "number") saveData({ dailyGoal }); }} />
              <span className="wnt-set-desc" style={{ margin: 0 }}>개</span>
            </div>
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">🤖 AI 연결 점검</h2>
            <p className="wnt-set-desc">변형문제·도우미·채점이 안 될 때 이 버튼을 눌러보세요. 성공/실패와 정확한 원인이 표시돼요.</p>
            <button className="wnt-btn-primary" onClick={checkAiConnection} disabled={aiChecking}>{aiChecking ? "점검 중…" : "🔍 지금 점검하기"}</button>
            {aiCheckMsg && (
              <p className="wnt-set-desc" style={{ marginTop: 10, whiteSpace: "pre-wrap", color: aiCheckMsg.indexOf("✅") === 0 ? "#1E5A2C" : "#8C2B27", fontWeight: 700 }}>{aiCheckMsg}</p>
            )}
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">📲 오답 질문방 <HelpTip text="사진을 봐야 하는 AI(도우미·채점·풀이)는 클로드 앱에서 정확히 도와줘요. 오답 전용 채팅방을 하나 만들어 그 링크를 여기 넣으면, 앱의 📲 버튼이 항상 그 방을 열어요. 방이 지저분해지지 않고 대화 맥락도 이어져요." /></h2>
            <p className="wnt-set-desc">
              클로드 앱/사이트에서 <b>오답 질문 전용 채팅방</b>을 하나 만들고, 그 방의 <b>링크(주소)</b>를 아래에 붙여넣으세요.
              그러면 📲 버튼이 매번 새 채팅이 아니라 <b>그 방</b>을 열어요.
            </p>
            <div className="wnt-newtag-row">
              <input
                className="wnt-input"
                placeholder="예: https://claude.ai/chat/xxxxxxxx"
                value={claudeRoom}
                onChange={(e) => setClaudeRoomState(e.target.value)}
                onBlur={() => saveData({ claudeRoom: claudeRoom.trim() })}
              />
              {claudeRoom && (
                <button className="wnt-mini" onClick={() => saveData({ claudeRoom: "" })}>지우기</button>
              )}
            </div>
            <p className="wnt-set-desc" style={{ marginTop: 8 }}>
              <b>딱 한 번</b> 그 방에 아래 문구를 붙여넣어 두면, 이후엔 <b>사진만 첨부</b>해도 알아서 도와줘요.
            </p>
            <button className="wnt-mini idea" onClick={() => { copyText(ROOM_SETUP_TEXT); setSettingMsg("세팅 문구를 복사했어요! 질문방에 붙여넣어 두세요."); }}>📋 세팅 문구 복사</button>
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">과목 관리 <HelpTip text="과목이 바뀌면 여기서 추가·삭제하세요. 기록이 남아 있는 과목은 삭제할 수 없어요. ◀▶로 순서를 바꾸면 폼·필터에 나오는 과목 순서가 함께 바뀌어요." /></h2>
            <p className="wnt-set-desc">과목을 추가·삭제하고, ◀▶로 순서를 바꿀 수 있어요 (기록 있는 과목은 삭제만 불가).</p>
            <div className="wnt-subj-list">
              {subjects.map((s, i) => (
                <span key={s.name} className="wnt-subj-manage" style={{ borderColor: s.color, color: s.color }}>
                  <button className="wnt-subj-move" onClick={() => moveSubject(i, -1)} disabled={i === 0} aria-label={`${s.name} 앞으로`}>◀</button>
                  {s.name}
                  <button className="wnt-subj-move" onClick={() => moveSubject(i, 1)} disabled={i === subjects.length - 1} aria-label={`${s.name} 뒤로`}>▶</button>
                  <button className="wnt-subj-x" onClick={() => removeSubject(s.name)} aria-label={`${s.name} 삭제`}>✕</button>
                </span>
              ))}
            </div>
            <div className="wnt-newtag-row">
              <input
                className="wnt-input"
                placeholder="새 과목 이름 (예: 기하, 화학, 지구과학)"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) addSubject();
                }}
              />
              <button className="wnt-mini strong" onClick={addSubject} disabled={!newSubjectInput.trim()}>＋ 과목 추가</button>
            </div>

            <h3 className="wnt-h3">변형문제 기준 교재</h3>
            <p className="wnt-set-desc">과목별 부교재를 등록하면 변형문제가 그 교재의 난이도·스타일을 기준으로 출제돼요. 부교재가 정해지면 여기서 직접 추가하세요.</p>
            <div className="wnt-newtag-row">
              <select
                className="wnt-select"
                value={bookSubject}
                onChange={(e) => { setBookSubject(e.target.value); setBookInput(subjBook(e.target.value)); }}
              >
                {subjectNames.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input
                className="wnt-input"
                placeholder="예: 고쟁이 2022 (비우고 저장하면 해제)"
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) saveBook();
                }}
              />
              <button className="wnt-mini strong" onClick={saveBook}>저장</button>
            </div>
            {subjects.filter((s) => s.book).length > 0 && (
              <p className="wnt-set-desc wnt-book-list">
                설정된 교재: {subjects.filter((s) => s.book).map((s) => `${s.name} → ${s.book}`).join("  ·  ")}
              </p>
            )}
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">실수 태그 관리</h2>
            <p className="wnt-set-desc">기본 태그는 과목 특성에 맞게 자동으로 달라져요 (수학은 부호 실수·경우 나누기, 영어는 구문 분석·어휘, 한국사는 시대 순서 등). 과목을 선택해 기본 태그를 확인하고, 직접 추가한 태그를 관리하세요. 새 태그는 오답 기록 화면에서 추가할 수 있어요.</p>
            <div className="wnt-newtag-row">
              <select className="wnt-select" value={tagPreviewSubject} onChange={(e) => setTagPreviewSubject(e.target.value)}>
                {subjectNames.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="wnt-chip-row wnt-tagpreview">
              {tagsForSubject(tagPreviewSubject).map((t) => (
                <span key={t} className="wnt-tag-fixed">{t}</span>
              ))}
              {customTags.map((t) => (
                <span key={t} className="wnt-tag-custom">
                  {t}
                  <button className="wnt-subj-x" onClick={() => removeCustomTag(t)} aria-label={`${t} 삭제`}>✕</button>
                </span>
              ))}
            </div>
            {customTags.length === 0 && <p className="wnt-set-desc">아직 직접 추가한 태그가 없어요.</p>}
          </div>

          <div className="wnt-set-section danger">
            <h2 className="wnt-h2">데이터 관리</h2>
            <p className="wnt-set-desc">
              기록을 골라서 지우려면 <strong>기록 탭 → ☑ 선택 삭제</strong>를 이용하세요.
              아래 버튼은 모든 기록·사진·발상 카드를 한 번에 지워요 (과목·태그·잠금·API 키 설정은 유지).
            </p>
            {!resetAsk ? (
              <button className="wnt-danger-btn" onClick={() => setResetAsk(true)}>🗑 전체 초기화</button>
            ) : (
              <div className="wnt-reset-confirm">
                <p>정말 초기화할까요? <strong>모든 오답 기록과 사진이 삭제되고 되돌릴 수 없어요.</strong></p>
                <div className="wnt-selectbar-btns">
                  <button className="wnt-danger-btn" onClick={resetAll} disabled={resetting}>
                    {resetting ? "삭제 중…" : "네, 전부 삭제할게요"}
                  </button>
                  <button className="wnt-btn-ghost" onClick={() => setResetAsk(false)}>취소</button>
                </div>
              </div>
            )}
          </div>

          <div className="wnt-set-section">
            <h2 className="wnt-h2">📲 AI 기능 사용 안내 (아이패드 포함)</h2>
            <p className="wnt-set-desc">
              이 앱은 <strong>API 키 없이</strong>, 소이님의 Claude 계정으로 AI가 작동해요. <strong>추가 요금은 없어요</strong> (기존 Claude 요금제 사용량으로 처리).<br />
              • <strong>변형문제·AI 도우미(텍스트)</strong>: 아이패드·공유 링크에서도 화면 안에서 바로 작동해요.<br />
              • <strong>발상 카드·필기 채점</strong>: 손글씨 <em>사진</em>을 읽어야 하는데, 이 방식은 사진을 못 실어요. 그래서 질문이 자동 복사되고 <strong>「📲 Claude 앱에서 열기」</strong> 버튼이 떠요 — 눌러서 앱에 붙여넣고 사진(또는 풀이 패드 캡처)을 첨부하면 바로 받을 수 있어요.<br />
              기록·사진은 이 기기에 자동 저장돼요.
            </p>
          </div>
        </section>
      )}

      <footer className="wnt-footer">
        기록·사진·발상 카드는 이 기기에 자동 저장돼요
        <br />오답 끝 ✗ © 2026 소이(Soi) · 개인 학습용 · 무단 복제·배포 금지
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap');

.wnt-root {
  --paper: #FBFCF9;
  --grid: rgba(63, 94, 145, 0.10);
  --ink: #1E2A3A;
  --muted: #7B8698;
  --red: #D6453D;
  --blue: #2B57C6;
  --line: #DDE3EC;
  --green: #2E7D4F;
  --gold: #B0641E;
  min-height: 100vh;
  font-family: 'IBM Plex Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: var(--ink);
  background:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px),
    var(--paper);
  background-size: 24px 24px, 24px 24px, auto;
  padding: 28px 16px 40px;
  max-width: 760px;
  margin: 0 auto;
}

.wnt-header { margin-bottom: 18px; }
.wnt-title-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.wnt-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
.wnt-title-mark { color: var(--red); font-size: 20px; margin-left: 4px; vertical-align: super; }
.wnt-subtitle { color: var(--muted); font-size: 13px; }
.wnt-header-dday {
  margin-left: auto; align-self: center; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  background: #fff; color: var(--muted);
  border: 1px solid var(--line); border-radius: 9px; padding: 5px 12px;
  font-size: 11.5px; font-weight: 600; font-family: inherit; letter-spacing: 0.02em;
  transition: border-color .15s, box-shadow .15s;
}
.wnt-header-dday:hover { border-color: var(--ink); box-shadow: 0 2px 8px rgba(30,42,58,0.07); }
.wnt-header-dday-num { font-weight: 800; color: var(--ink); font-size: 13px; letter-spacing: 0.03em; font-variant-numeric: tabular-nums; }
.wnt-header-dday-subj {
  color: var(--muted); font-weight: 600; font-size: 11px; max-width: 140px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-left: 1px solid var(--line); padding-left: 7px;
}
.wnt-motto {
  width: 100%; box-sizing: border-box; margin-top: 12px; padding: 9px 13px;
  font-family: inherit; font-size: 13.5px; color: var(--ink); font-style: italic;
  border: 1px solid var(--line); border-left: 4px solid var(--gold);
  border-radius: 8px; background: #FFF9EC;
}
.wnt-motto::placeholder { font-style: normal; color: var(--muted); }
.wnt-motto:focus { outline: 2px solid var(--gold); outline-offset: 0; }

.wnt-tabs { display: flex; gap: 2px; margin-top: 16px; border-bottom: 2px solid var(--line); overflow-x: auto; }
.wnt-tab {
  background: none; border: none; padding: 8px 10px; font-size: 14px; font-weight: 500;
  color: var(--muted); cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent;
  margin-bottom: -2px; white-space: nowrap;
}
.wnt-tab.on { color: var(--ink); border-bottom-color: var(--red); font-weight: 700; }
.wnt-tab em { font-style: normal; color: var(--red); font-size: 13px; margin-left: 2px; }
.wnt-tab:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }

.wnt-warn {
  background: #FDECEA; border: 1px solid #F2B8B5; color: #8C2B27;
  border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px;
}

.wnt-add-btn {
  width: 100%; padding: 13px; font-size: 15px; font-weight: 700; font-family: inherit;
  background: var(--red); color: #fff; border: none; border-radius: 10px; cursor: pointer;
  box-shadow: 0 2px 0 #A83530; margin-bottom: 18px;
}
.wnt-add-btn:hover { background: #C23C34; }
.wnt-add-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

.wnt-form {
  background: #fff; border: 1px solid var(--line); border-radius: 12px;
  padding: 18px; margin-bottom: 18px; box-shadow: 0 3px 10px rgba(30,42,58,0.05);
}
.wnt-form-row { margin-bottom: 14px; }
.wnt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.wnt-label { display: block; font-size: 12.5px; font-weight: 700; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.02em; }
.wnt-input {
  width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 14px; font-family: inherit;
  border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink);
}
.wnt-input:focus { outline: 2px solid var(--red); outline-offset: 0; border-color: transparent; }
.wnt-textarea { min-height: 72px; resize: vertical; }

.wnt-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.wnt-chip {
  padding: 6px 12px; font-size: 13px; font-family: inherit; font-weight: 500;
  border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink); cursor: pointer;
}
.wnt-chip.on { color: #fff; font-weight: 700; }
.wnt-tag-chip {
  padding: 6px 12px; font-size: 13px; font-family: inherit; font-weight: 500;
  border: 1px dashed #E3B5B2; border-radius: 4px; background: #fff; color: var(--red); cursor: pointer;
}
.wnt-tag-chip.on { background: var(--red); border-style: solid; border-color: var(--red); color: #fff; font-weight: 700; }
.wnt-chip:focus-visible, .wnt-tag-chip:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.wnt-newtag-row { display: flex; gap: 8px; margin-top: 8px; align-items: stretch; }
.wnt-newtag-row .wnt-input { flex: 1; width: auto; }
.wnt-newtag-row .wnt-mini { flex-shrink: 0; }

.wnt-form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.wnt-btn-primary {
  padding: 10px 20px; font-size: 14px; font-weight: 700; font-family: inherit;
  background: var(--ink); color: #fff; border: none; border-radius: 8px; cursor: pointer;
}
.wnt-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.wnt-btn-ghost {
  padding: 10px 16px; font-size: 14px; font-family: inherit;
  background: none; color: var(--muted); border: 1px solid var(--line); border-radius: 8px; cursor: pointer;
}

.wnt-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
.wnt-select {
  padding: 8px 10px; font-size: 13px; font-family: inherit; border: 1px solid var(--line);
  border-radius: 8px; background: #fff; color: var(--ink);
}
.wnt-search { flex: 1; min-width: 110px; width: auto; }

.wnt-selectbar {
  display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
  background: #FFF6F5; border: 1px solid #F2C9C6; border-radius: 8px;
  padding: 8px 12px; margin-bottom: 12px; font-size: 13px; font-weight: 700;
}
.wnt-selectbar-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.wnt-checkbox { width: 18px; height: 18px; accent-color: var(--red); flex-shrink: 0; }

.wnt-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.wnt-card {
  background: #fff; border: 1px solid var(--line); border-left: 4px solid var(--red);
  border-radius: 10px; padding: 14px 16px; box-shadow: 0 2px 6px rgba(30,42,58,0.04);
}
.wnt-card.done { border-left-color: var(--green); }
.wnt-card.picked { outline: 2px solid var(--red); }

.wnt-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wnt-subj { color: #fff; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.wnt-unit { font-size: 15.5px; font-weight: 700; }
.wnt-stamp {
  margin-left: auto; color: var(--gold); border: 2px solid var(--gold); border-radius: 6px;
  font-size: 12px; font-weight: 700; padding: 2px 8px; transform: rotate(-6deg);
  background: #FFF8EC;
}
/* 정복 왕관 축하 연출 */
.wnt-crown-celebrate {
  position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
  background: rgba(30,42,58,0.35); animation: wnt-fade 0.2s ease;
}
.wnt-crown-burst { position: relative; text-align: center; }
.wnt-crown-hodu {
  width: 210px; max-width: 62vw; height: auto; border-radius: 22px;
  border: 4px solid #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  animation: wnt-crown-pop 0.6s cubic-bezier(.2,1.5,.4,1);
}
.wnt-crown-emoji { font-size: 120px; animation: wnt-crown-pop 0.6s cubic-bezier(.2,1.5,.4,1); }
@keyframes wnt-crown-pop {
  0% { transform: scale(0) rotate(-40deg); opacity: 0; }
  60% { transform: scale(1.25) rotate(8deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
.wnt-crown-text { font-size: 34px; font-weight: 800; color: #fff; margin-top: 4px; text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
.wnt-crown-sub { font-size: 15px; color: #FFE9B8; margin-top: 6px; }
.wnt-crown-spark { position: absolute; font-size: 34px; opacity: 0; animation: wnt-spark 1.4s ease-out forwards; }
.wnt-crown-spark.s0 { top: -10px; left: -60px; animation-delay: .1s; }
.wnt-crown-spark.s1 { top: 20px; right: -70px; animation-delay: .25s; }
.wnt-crown-spark.s2 { top: 80px; left: -80px; animation-delay: .18s; }
.wnt-crown-spark.s3 { top: -30px; right: -30px; animation-delay: .32s; }
.wnt-crown-spark.s4 { top: 110px; right: -40px; animation-delay: .12s; }
.wnt-crown-spark.s5 { top: 60px; left: -30px; animation-delay: .28s; }
@keyframes wnt-spark {
  0% { opacity: 0; transform: scale(0.3) translateY(0); }
  40% { opacity: 1; transform: scale(1.2) translateY(-14px); }
  100% { opacity: 0; transform: scale(0.8) translateY(-40px); }
}
@media (prefers-reduced-motion: reduce) {
  .wnt-crown-emoji, .wnt-crown-spark { animation: none; opacity: 1; }
}
.wnt-source { font-size: 12.5px; color: var(--muted); margin-top: 4px; }

.wnt-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.wnt-red-tag {
  font-size: 12px; color: var(--red); font-weight: 500;
  border-bottom: 2px solid rgba(214,69,61,0.5); padding-bottom: 1px;
}
.wnt-memo {
  margin: 10px 0 0; font-size: 13.5px; line-height: 1.6; color: #3A4657;
  background: var(--paper); border-radius: 6px; padding: 8px 10px; white-space: pre-wrap;
}

/* 문제 사진 */
.wnt-photo-btn {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 9px 14px; font-size: 13.5px; font-weight: 500;
  border: 1px dashed var(--line); border-radius: 8px; background: var(--paper); color: var(--ink);
}
.wnt-photo-btn:hover { border-color: var(--red); color: var(--red); }
.wnt-photo-btn.small { padding: 7px 11px; font-size: 12.5px; background: #fff; }
.wnt-photo-thumbs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.wnt-photo-thumb { position: relative; }
.wnt-photo-thumb img { width: 86px; height: 86px; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); }
.wnt-thumb-x {
  position: absolute; top: -6px; right: -6px; width: 22px; height: 22px;
  border-radius: 50%; border: none; background: var(--ink); color: #fff;
  font-size: 11px; cursor: pointer; line-height: 1;
}
.wnt-thumb-x:hover { background: var(--red); }
.wnt-photo-thumb img { cursor: zoom-in; }
.wnt-thumb-crop {
  position: absolute; bottom: -6px; right: -6px; width: 22px; height: 22px;
  border-radius: 50%; border: none; background: var(--gold); color: #fff;
  font-size: 10px; cursor: pointer; line-height: 1;
}
.wnt-thumb-crop:hover { filter: brightness(1.1); }
/* 사진 자르기 모달 */
.wnt-crop-backdrop, .wnt-zoom-backdrop {
  position: fixed; inset: 0; background: rgba(20,26,34,0.72); z-index: 120;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  animation: wnt-fade 0.18s ease;
}
.wnt-crop { background: var(--paper); border-radius: 16px; padding: 16px; max-width: 92vw; }
.wnt-crop-title { font-weight: 800; font-size: 15px; margin-bottom: 10px; }
.wnt-crop-title span { font-weight: 500; font-size: 12px; color: var(--muted); margin-left: 6px; }
.wnt-crop-stage { position: relative; display: inline-block; line-height: 0; max-width: 84vw; }
.wnt-crop-img { display: block; max-width: 84vw; max-height: 56vh; user-select: none; -webkit-user-select: none; }
.wnt-crop-box {
  position: absolute; border: 2px solid var(--gold); box-shadow: 0 0 0 9999px rgba(20,26,34,0.45);
  cursor: move; touch-action: none;
}
.wnt-crop-handle {
  position: absolute; width: 18px; height: 18px; background: var(--gold); border: 2px solid #fff;
  border-radius: 50%; touch-action: none;
}
.wnt-crop-btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
/* 사진 확대(줌) 모달 */
.wnt-zoom-backdrop { flex-direction: column; padding: 0; }
.wnt-zoom-bar {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 10px; background: rgba(20,26,34,0.9); color: #fff;
}
.wnt-zoom-pct { color: #fff; font-size: 13px; min-width: 46px; text-align: center; font-variant-numeric: tabular-nums; }
.wnt-zoom-scroll { flex: 1; width: 100%; overflow: auto; -webkit-overflow-scrolling: touch; display: flex; align-items: flex-start; justify-content: center; }
.wnt-zoom-img { display: block; height: auto; max-width: none; }
.wnt-photo-area { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.wnt-photo {
  max-width: 100%; border-radius: 8px; border: 1px solid var(--line);
  box-shadow: 0 2px 8px rgba(30,42,58,0.08);
}

/* 도구 버튼 줄 */
.wnt-tools {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;
  padding-top: 10px; border-top: 1px dashed var(--line);
}
.wnt-mini {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-family: inherit; padding: 5px 10px; border-radius: 6px;
  border: 1px solid var(--line); background: #fff; color: var(--muted); cursor: pointer;
}
.wnt-mini.strong { border-color: var(--ink); color: var(--ink); font-weight: 700; }
.wnt-mini.strong:hover { background: var(--ink); color: #fff; }
.wnt-mini.danger:hover { border-color: var(--red); color: var(--red); }
.wnt-mini.ai { border-color: var(--blue); color: var(--blue); font-weight: 700; }
.wnt-mini.ai:hover { background: var(--blue); color: #fff; }
.wnt-mini.idea { border-color: var(--gold); color: var(--gold); font-weight: 700; }
.wnt-mini.idea:hover { background: var(--gold); color: #fff; }
.wnt-mini.idea.disabled { opacity: 0.6; cursor: wait; }
.wnt-mini.variant { border-color: #5B4FC9; color: #5B4FC9; font-weight: 700; }
.wnt-mini.variant:hover { background: #5B4FC9; color: #fff; }
.wnt-mini:disabled { opacity: 0.35; cursor: not-allowed; }
.wnt-mini:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }

.wnt-note-msg { margin-top: 8px; font-size: 12.5px; color: var(--red); }

.wnt-star { background: none; border: none; font-size: 23px; cursor: pointer; padding: 0 3px; line-height: 1; filter: saturate(1.2); }
.wnt-star:hover { transform: scale(1.12); }
.wnt-due-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  background: linear-gradient(90deg, #FFF6E9, #FEFBF3); border: 1.5px solid var(--gold);
  border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; font-size: 14px; color: var(--ink);
}
.wnt-due-banner b { color: var(--gold); }
/* 🔥 연속 학습 불꽃 */
.wnt-motto-row { display: flex; align-items: center; gap: 8px; }
.wnt-motto-row .wnt-motto { flex: 1; }
.wnt-streak {
  flex: 0 0 auto; white-space: nowrap; font-size: 12px; font-weight: 700; color: var(--ink);
  background: #fff; border: 1px solid var(--line);
  border-radius: 9px; padding: 5px 11px; letter-spacing: 0.01em;
}
.wnt-due-modal-streak { font-size: 13px; font-weight: 800; color: #C0491E; margin-top: 2px; }
/* 📅 시험 D-day 팝오버 (헤더 오른쪽에서 펼쳐짐) */
.wnt-dday-wrap { margin-left: auto; align-self: center; position: relative; }
.wnt-dday-wrap .wnt-header-dday { margin-left: 0; }
.wnt-header-dday.on { border-color: var(--ink); }
.wnt-dday { background: var(--red); color: #fff; font-size: 12px; font-weight: 800; border-radius: 6px; padding: 2px 8px; }
.wnt-dday.sm { font-size: 11px; padding: 1px 6px; margin-left: 0; flex: 0 0 auto; }
.wnt-dday.sm.past { background: var(--muted); }
.wnt-exam-rows { display: flex; flex-direction: column; gap: 8px; }
.wnt-exam-tip { font-size: 11.5px; color: var(--muted); line-height: 1.5; margin: 2px 0 0; }
.wnt-exam-tip b { color: var(--red); }
.wnt-dday-overlay { position: fixed; inset: 0; z-index: 40; }
.wnt-exam-pop {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 50;
  width: 340px; max-width: 88vw; max-height: 70vh; overflow-y: auto;
  background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 16px 40px rgba(30,42,58,0.18); padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.wnt-exam-pop-head { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 800; }
.wnt-exam-sec { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: #fff; }
.wnt-exam-sec-head {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  background: none; border: none; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 700; color: var(--ink);
}
.wnt-exam-sec-arrow { margin-left: auto; color: var(--muted); font-size: 12px; }
.wnt-exam-sec-body { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
.wnt-exam-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.wnt-exam-row .wnt-input { min-width: 0; flex: 1; }
.wnt-exam-date { flex: 0 0 132px; }
.wnt-exam-x { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 4px 6px; }
.wnt-exam-x:hover { color: var(--red); }
.wnt-exam-listrow { font-size: 12.5px; color: var(--ink); line-height: 1.6; }
.wnt-exam-listrow b { color: var(--blue); margin-right: 4px; }
.wnt-exam-empty { font-size: 12px; color: var(--muted); }
.wnt-goal-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wnt-goal-input { width: 64px; }
.wnt-due-banner-btns { display: flex; align-items: center; gap: 6px; }
.wnt-due-x { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 14px; padding: 2px 4px; }
.wnt-due-modal-backdrop {
  position: fixed; inset: 0; background: rgba(30,42,58,0.45); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: wnt-fade 0.2s ease;
}
@keyframes wnt-fade { from { opacity: 0; } to { opacity: 1; } }
.wnt-due-modal {
  background: var(--paper); border-radius: 18px; max-width: 380px; width: 100%;
  padding: 24px 22px 20px; text-align: center; box-shadow: 0 18px 50px rgba(30,42,58,0.35);
  border: 2px solid var(--gold); animation: wnt-pop 0.28s cubic-bezier(.2,1.3,.5,1);
}
@keyframes wnt-pop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.wnt-due-modal-bell { font-size: 44px; animation: wnt-swing 1.2s ease-in-out infinite; transform-origin: 50% 8%; }
@keyframes wnt-swing { 0%,100% { transform: rotate(0); } 20% { transform: rotate(16deg); } 40% { transform: rotate(-12deg); } 60% { transform: rotate(7deg); } 80% { transform: rotate(-4deg); } }
.wnt-due-modal-count { font-size: 21px; font-weight: 800; margin-top: 6px; }
.wnt-due-modal-count b { color: var(--gold); }
.wnt-due-modal-sub { font-size: 13px; color: var(--muted); margin: 6px 0 14px; line-height: 1.5; }
.wnt-due-modal-list { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 6px; text-align: left; }
.wnt-due-modal-list li { font-size: 13.5px; display: flex; align-items: center; gap: 7px; }
.wnt-due-modal-more { color: var(--muted); font-size: 12.5px; padding-left: 2px; }
.wnt-subj.sm { font-size: 11px; padding: 1px 7px; }
.wnt-due-modal-btns { display: flex; gap: 8px; justify-content: center; align-items: center; }
@media (prefers-reduced-motion: reduce) {
  .wnt-due-modal-bell { animation: none; }
  .wnt-due-modal, .wnt-due-modal-backdrop { animation: none; }
}
.wnt-star:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 4px; }
.wnt-retry-badge {
  font-size: 11.5px; font-weight: 700; color: var(--gold);
  border: 1px solid #EBD9AE; background: #FFF9EC; border-radius: 4px; padding: 2px 7px;
}
.wnt-wrong-badge {
  font-size: 11.5px; font-weight: 700; color: var(--red);
  border: 1px solid #F2C9C6; background: #FFF6F5; border-radius: 4px; padding: 2px 7px;
}
.wnt-grad-badge {
  font-size: 11.5px; font-weight: 700; color: var(--green);
  border: 1px solid #BFDCC4; background: #EDF5EE; border-radius: 4px; padding: 2px 7px;
}
.wnt-grad {
  background: #EDF5EE; border: 1px solid #BFDCC4; color: #1E5A2C;
  border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; font-weight: 700;
}
.wnt-mistake-note {
  background: #FFF6F5; border: 1px solid #F2C9C6; color: #8C2B27;
  border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; font-weight: 700;
}
.wnt-due { color: var(--red); font-weight: 700; }
.wnt-card-toggle {
  margin-left: auto; font-size: 12px; font-weight: 700; font-family: inherit;
  border: 1px solid var(--ink); border-radius: 6px; background: var(--ink); color: #fff;
  padding: 4px 10px; cursor: pointer; white-space: nowrap;
}
.wnt-solve-box {
  margin-top: 10px; border: 1px solid #D8D3F2; border-radius: 10px; background: #F8F7FE; padding: 12px;
}
.wnt-solve-text { margin: 4px 0 8px; font-size: 13.5px; line-height: 1.7; white-space: pre-wrap; color: #3A4657; }
.wnt-sol-grade {
  margin: 6px 0 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap;
  background: #F6F8FE; border: 1px solid #C9D4F0; border-radius: 6px; padding: 8px 10px;
}
.wnt-ai-tip {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  background: #FFF9EC; border: 1px solid #EBD9AE; border-radius: 8px;
  padding: 8px 10px; font-size: 12px; color: #4A4433; margin-bottom: 10px; line-height: 1.5;
}
.wnt-photo-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.wnt-ai-accurate {
  background: #F6F8FE; border: 1px solid #C9D4F0; border-radius: 10px;
  padding: 12px 14px; font-size: 13px; color: var(--ink); line-height: 1.6;
}
.wnt-ai-steps { margin: 6px 0 10px; padding-left: 20px; }
.wnt-ai-steps li { margin: 4px 0; }
.wnt-ai-accurate-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.wnt-vt-levels { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.wnt-vt-levels-label { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.wnt-variant-head { display: flex; align-items: center; gap: 8px; }
.wnt-variant-head-btns { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.wnt-variant-peek { font-size: 12.5px; color: var(--muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1; }
.wnt-variant-x { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 5px; }
.wnt-variant-x:hover { background: #F2D9D6; color: var(--red); }
.wnt-viewtabs { display: flex; gap: 6px; margin-bottom: 12px; }
.wnt-viewtab {
  flex: 1; padding: 9px 10px; font-size: 13.5px; font-weight: 700; font-family: inherit;
  border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--muted); cursor: pointer;
}
.wnt-viewtab.on { border-color: var(--ink); color: var(--ink); background: var(--paper); }
.wnt-viewtab em { font-style: normal; color: var(--red); margin-left: 3px; }
.wnt-idea-inline { margin-top: 8px; display: flex; flex-direction: column; gap: 0; align-items: flex-start; }
.wnt-idea-inline .wnt-idea { width: 100%; box-sizing: border-box; }
.wnt-timer-modes { display: flex; gap: 4px; }
.wnt-timeout {
  background: #FDECEA; border: 1px solid #F2B8B5; color: #8C2B27;
  border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; font-weight: 700;
}
.wnt-flash-mid { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }
.timeout-ref { color: var(--red); font-weight: 700; }
.wnt-tagpreview { margin-top: 8px; }

/* 발상 카드 */
.wnt-idea {
  margin-top: 10px; background: #FFF9EC; border: 1px solid #EBD9AE; border-radius: 10px;
  padding: 12px 14px;
}
.wnt-idea-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12.5px; font-weight: 700; color: var(--gold); margin-bottom: 6px;
}
.wnt-idea-title { display: block; font-size: 14.5px; margin-bottom: 6px; }
.wnt-idea-points { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #4A4433; }

/* 풀이 기록 */
.wnt-sol-form { margin-top: 12px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
.wnt-sol-form .wnt-textarea { background: #fff; margin-bottom: 10px; }
.wnt-sol-form-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.wnt-check { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
.wnt-sol-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.wnt-sol-item { background: var(--paper); border: 1px solid var(--line); border-left: 3px solid var(--ink); border-radius: 8px; padding: 10px 12px; }
.wnt-sol-head { font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; }
.wnt-sol-text { margin: 0 0 6px; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; }
.wnt-sol-item .wnt-photo { margin-top: 4px; }

/* 패널 공통 */
.wnt-panel-head { font-size: 13px; font-weight: 700; margin-bottom: 10px; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.wnt-panel-head span { font-size: 11.5px; color: var(--muted); font-weight: 400; }
.wnt-loading { font-size: 13px; color: var(--muted); padding: 8px 0; }

/* 변형문제 */
.wnt-variants { margin-top: 12px; border: 1px solid #D8D3F2; border-radius: 10px; background: #F8F7FE; padding: 12px; }
.wnt-variant-item { background: #fff; border: 1px solid #E2DEF5; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.wnt-variant-item.big { padding: 14px 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(30,42,58,0.05); }
.wnt-level {
  display: inline-block; font-size: 11.5px; font-weight: 700; color: #fff; background: #5B4FC9;
  border-radius: 4px; padding: 2px 8px; margin-bottom: 6px;
}
.wnt-level.top { background: var(--red); }
.wnt-level.twin { background: var(--green); }
.wnt-variant-q { margin: 0 0 8px; font-size: 13.5px; line-height: 1.7; white-space: pre-wrap; }
.wnt-variant-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.wnt-variant-reveal {
  margin: 8px 0 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap;
  background: var(--paper); border-radius: 6px; padding: 8px 10px;
}
.wnt-variant-reveal.ans { border-left: 3px solid var(--green); }

/* 변형문제 탭 */
.wnt-vt-intro {
  background: #fff; border: 1px solid var(--line); border-left: 4px solid #5B4FC9;
  border-radius: 10px; padding: 12px 14px; font-size: 13.5px; line-height: 1.7; margin-bottom: 14px;
}
.wnt-vt-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: stretch; }
.wnt-vt-entry { flex: 1; min-width: 160px; max-width: 100%; }
.wnt-vt-bar .wnt-btn-primary { flex-shrink: 0; }

/* AI 도우미 */
.wnt-ai { margin-top: 12px; border: 1px solid #C9D4F0; border-radius: 10px; background: #F6F8FE; padding: 12px; }
.wnt-ai-modes { display: flex; flex-direction: column; gap: 8px; }
.wnt-ai-q { margin: 0 0 2px; font-size: 13.5px; font-weight: 700; }
.wnt-mode-btn {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left;
  padding: 11px 14px; font-size: 14px; font-weight: 700; font-family: inherit;
  border: 1.5px solid #C9D4F0; border-radius: 10px; background: #fff; color: var(--ink); cursor: pointer;
}
.wnt-mode-btn span { font-size: 12px; font-weight: 400; color: var(--muted); }
.wnt-mode-btn:hover { border-color: var(--blue); }
.wnt-mode-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.wnt-ai-msgs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; max-height: 340px; overflow-y: auto; }
.wnt-ai-starters { display: flex; gap: 6px; flex-wrap: wrap; }
.wnt-msg {
  font-size: 13.5px; line-height: 1.6; padding: 8px 12px; border-radius: 10px;
  white-space: pre-wrap; max-width: 92%;
}
.wnt-msg.me { background: var(--ink); color: #fff; align-self: flex-end; }
.wnt-msg.ai { background: #fff; border: 1px solid #DCE3F5; align-self: flex-start; }
.wnt-ai-inputrow { display: flex; gap: 8px; }
.wnt-ai-inputrow .wnt-input { flex: 1; background: #fff; width: auto; }
.wnt-ai-inputrow .wnt-btn-primary { padding: 10px 14px; flex-shrink: 0; }
.wnt-modeswitch {
  margin-top: 8px; background: none; border: none; font-family: inherit;
  font-size: 11.5px; color: var(--muted); text-decoration: underline; cursor: pointer; padding: 0;
}

.wnt-card-bottom {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 12px; flex-wrap: wrap;
}
.wnt-steps { display: flex; gap: 4px; }
.wnt-step {
  font-size: 11.5px; color: var(--muted); border: 1px solid var(--line);
  border-radius: 4px; padding: 2px 7px; background: #fff;
}
.wnt-step.on { background: var(--ink); border-color: var(--ink); color: #fff; font-weight: 700; }
.wnt-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.wnt-empty {
  text-align: center; color: var(--muted); font-size: 14px; padding: 44px 16px;
  background: #fff; border: 1px dashed var(--line); border-radius: 12px; line-height: 1.7;
}

/* 플래시카드 */
.wnt-flash-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.wnt-flash-count { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--muted); }
.wnt-flash-card {
  background: #fff; border: 1px solid var(--line); border-top: 4px solid var(--red);
  border-radius: 14px; padding: 18px; box-shadow: 0 4px 14px rgba(30,42,58,0.07);
}
.wnt-flash-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.wnt-flash-src { font-size: 12px; color: var(--muted); }
.wnt-timer {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--paper); border: 1px solid var(--line); border-radius: 8px;
  padding: 8px 12px; margin-bottom: 12px;
}
.wnt-timer-num { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.wnt-timer-num.running { color: var(--red); }
.wnt-timer-ref { font-size: 12px; color: var(--muted); }
.wnt-flash-imgs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.wnt-flash-reveals { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
.wnt-flash-nohint { font-size: 12px; color: var(--muted); }
.wnt-flash-del-confirm { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--red); font-weight: 700; flex-wrap: wrap; }
.wnt-flash-nav {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line);
}

/* 통계 */
.wnt-stats { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
.wnt-stat-cards { display: flex; gap: 10px; margin-bottom: 16px; }
.wnt-stat-card {
  flex: 1; text-align: center; background: var(--paper); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px 6px;
}
.wnt-stat-num { display: block; font-size: 26px; font-weight: 700; color: var(--red); }
.wnt-stat-card:nth-child(2) .wnt-stat-num { color: var(--green); }
.wnt-stat-card:nth-child(3) .wnt-stat-num { color: var(--ink); }
.wnt-stat-label { font-size: 12px; color: var(--muted); }

.wnt-insight-banner {
  background: #FFF6F5; border: 1px solid #F2C9C6; border-radius: 8px;
  padding: 10px 14px; font-size: 13.5px; margin-bottom: 18px; line-height: 1.5;
}
.wnt-insight-banner strong { color: var(--red); }

.wnt-h2 { font-size: 15px; font-weight: 700; margin: 18px 0 10px; }
.wnt-h3 { font-size: 13.5px; font-weight: 700; margin: 16px 0 6px; padding-top: 12px; border-top: 1px dashed var(--line); }
.wnt-book-list { margin-top: 8px !important; margin-bottom: 0 !important; }
.wnt-vt-book {
  background: #FFF9EC; border: 1px solid #EBD9AE; border-radius: 8px;
  padding: 8px 12px; font-size: 12.5px; margin-bottom: 14px; line-height: 1.6; color: #4A4433;
}
.wnt-bars { display: flex; flex-direction: column; gap: 8px; }
.wnt-bar-row { display: flex; align-items: center; gap: 10px; }
.wnt-bar-label { width: 96px; font-size: 12.5px; flex-shrink: 0; text-align: right; }
.wnt-bar-track { flex: 1; height: 14px; background: var(--paper); border-radius: 4px; overflow: hidden; border: 1px solid var(--line); }
.wnt-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.wnt-bar-fill.red { background: var(--red); }
.wnt-bar-num { width: 42px; font-size: 12px; color: var(--muted); flex-shrink: 0; }

/* 설정 */
.wnt-settings { display: flex; flex-direction: column; gap: 14px; }
.wnt-set-section { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
.wnt-set-section.danger { border-color: #F2C9C6; }
.wnt-set-section .wnt-h2 { margin-top: 0; }
.wnt-set-desc { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0 0 10px; }
.wnt-setting-msg {
  background: #EDF5EE; border: 1px solid #BFDCC4; color: #1E5A2C;
  border-radius: 8px; padding: 9px 13px; font-size: 13px;
}
.wnt-subj-list { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.wnt-subj-manage {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 8px 5px 8px; font-size: 13px; font-weight: 700;
  border: 1.5px solid; border-radius: 999px; background: #fff;
}
.wnt-subj-move {
  width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--line);
  background: #fff; color: var(--muted); font-size: 10px; cursor: pointer; line-height: 1;
}
.wnt-subj-move:disabled { opacity: 0.3; cursor: default; }
.wnt-subj-x {
  width: 18px; height: 18px; border-radius: 50%; border: none;
  background: var(--line); color: var(--ink); font-size: 10px; cursor: pointer; line-height: 1;
}
.wnt-subj-x:hover { background: var(--red); color: #fff; }
.wnt-tag-fixed {
  padding: 5px 12px; font-size: 12.5px; border: 1px solid var(--line); border-radius: 4px;
  background: var(--paper); color: var(--muted);
}
.wnt-tag-custom {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 8px 5px 12px; font-size: 12.5px; font-weight: 500;
  border: 1px dashed #E3B5B2; border-radius: 4px; background: #fff; color: var(--red);
}
.wnt-danger-btn {
  padding: 10px 18px; font-size: 14px; font-weight: 700; font-family: inherit;
  background: #fff; color: var(--red); border: 1.5px solid var(--red); border-radius: 8px; cursor: pointer;
}
.wnt-danger-btn:hover { background: var(--red); color: #fff; }
.wnt-danger-btn:disabled { opacity: 0.5; cursor: wait; }
.wnt-reset-confirm { font-size: 13.5px; line-height: 1.7; }
.wnt-reset-confirm p { margin: 0 0 10px; }

.wnt-footer { text-align: center; color: var(--muted); font-size: 11.5px; margin-top: 28px; }

/* 안내 배너 */
.wnt-keynote {
  background: #F6F8FE; border: 1px solid #C9D4F0; color: #2B4A8C;
  border-radius: 8px; padding: 9px 13px; font-size: 12.5px; margin-bottom: 14px; line-height: 1.6;
}

/* ❓ 도움말 */
.help-wrap { position: relative; display: inline-block; }
.help-btn {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--muted);
  background: #fff; color: var(--muted); font-size: 11px; font-weight: 700;
  cursor: pointer; line-height: 1; padding: 0; vertical-align: middle;
}
.help-btn:hover { border-color: var(--blue); color: var(--blue); }
.help-pop {
  position: absolute; z-index: 40; left: 50%; transform: translateX(-50%); top: 24px;
  width: 240px; max-width: 74vw; background: var(--ink); color: #fff; font-size: 12px; font-weight: 400;
  line-height: 1.6; padding: 10px 12px; border-radius: 8px;
  box-shadow: 0 6px 18px rgba(30,42,58,0.3); text-align: left; white-space: normal;
}

/* ✍️ 풀이 패드 */
.pad { margin: 10px 0; width: 100%; }
.pad-bar {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px;
  background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 7px 9px;
}
.pad-group { display: flex; align-items: center; gap: 4px; }
.pad-div { width: 1px; align-self: stretch; min-height: 22px; background: var(--line); margin: 0 1px; }
.pad-color {
  width: 21px; height: 21px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
  box-shadow: 0 0 0 1px var(--line); padding: 0; transition: transform .12s;
}
.pad-color:hover { transform: scale(1.08); }
.pad-color.on { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--ink); }
.pad-tool {
  width: 34px; height: 32px; border-radius: 8px; border: 1px solid var(--line);
  background: #fff; cursor: pointer; font-size: 15px; line-height: 1; padding: 0;
  display: inline-flex; align-items: center; justify-content: center; transition: border-color .12s, background .12s;
}
.pad-tool:hover { border-color: var(--ink); }
.pad-tool.on { background: var(--ink); border-color: var(--ink); box-shadow: 0 2px 6px rgba(30,42,58,0.18); }
.pad-w {
  width: 30px; height: 32px; border-radius: 8px; border: 1px solid var(--line);
  background: #fff; cursor: pointer; padding: 0; display: inline-flex; align-items: center; justify-content: center;
}
.pad-w:hover { border-color: var(--ink); }
.pad-w.on { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.pad-w-dot { display: block; border-radius: 50%; background: var(--ink); }
.pad-wrap { position: relative; border: 1.5px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--paper); }
.pad-wrap.grid {
  background-image:
    linear-gradient(rgba(63,94,145,0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(63,94,145,0.14) 1px, transparent 1px);
  background-size: 24px 24px;
}
.pad-canvas { display: block; touch-action: none; cursor: crosshair; background: transparent; }
/* 좌우분할: 문제(왼쪽) | 풀이 패드(오른쪽) */
.pad-split { display: flex; align-items: stretch; gap: 0; width: 100%; }
.pad-problem {
  flex: 0 0 auto; min-width: 0; overflow: auto; max-height: 400px;
  border: 1.5px solid var(--line); border-radius: 10px; background: var(--paper);
  padding: 8px; box-sizing: border-box;
}
.pad-problem-label {
  font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: .04em;
  margin-bottom: 6px;
}
.pad-problem .wnt-photo { width: 100%; margin: 0 0 6px; }
.pad-problem .wnt-variant-q.in-pad { margin: 0; font-size: 15px; line-height: 1.6; }
.pad-divider {
  flex: 0 0 16px; align-self: stretch; display: flex; align-items: center; justify-content: center;
  cursor: col-resize; touch-action: none; color: var(--muted); user-select: none;
  font-size: 15px;
}
.pad-divider:hover { color: var(--red); }
.pad-main { flex: 0 0 auto; min-width: 0; }
@media (max-width: 560px) {
  .pad-split { flex-direction: column; }
  .pad-problem, .pad-main { width: 100% !important; }
  .pad-divider { display: none; }
}
.pad-note {
  position: absolute; width: 130px; background: #FFF3B0; border: 1px solid #E8D26B;
  border-radius: 6px; box-shadow: 0 3px 8px rgba(30,42,58,0.18); z-index: 10;
}
.pad-note-bar {
  display: flex; justify-content: space-between; align-items: center;
  background: #F5E48A; padding: 2px 6px; cursor: grab; font-size: 12px;
  touch-action: none; border-radius: 6px 6px 0 0;
}
.pad-note-bar button { border: none; background: none; cursor: pointer; font-size: 11px; color: #6B5D1E; padding: 0 2px; }
.pad-note textarea {
  width: 100%; box-sizing: border-box; border: none; background: transparent; resize: none;
  font-family: inherit; font-size: 12px; padding: 6px; min-height: 56px; color: #4A4433;
}
.pad-note textarea:focus { outline: none; }
.pad-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
.pad-result {
  margin-top: 8px; background: #F6F8FE; border: 1px solid #C9D4F0; border-radius: 8px;
  padding: 10px 12px; font-size: 13px; line-height: 1.7; white-space: pre-wrap;
}

/* 촬영/앨범 버튼 줄 */
.wnt-photo-btnrow { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

/* 잠금 화면 */
.wnt-lock { display: flex; align-items: center; justify-content: center; }
.lock-box {
  background: #fff; border: 1px solid var(--line); border-top: 4px solid var(--red);
  border-radius: 14px; padding: 32px 28px; text-align: center; max-width: 320px; width: 100%;
  box-shadow: 0 6px 20px rgba(30,42,58,0.1);
}
.lock-desc { color: var(--muted); font-size: 13.5px; margin: 14px 0 10px; }
.lock-input { text-align: center; font-size: 17px; letter-spacing: 4px; margin-bottom: 10px; }
.lock-msg { color: var(--red); font-size: 12.5px; font-weight: 700; margin: 10px 0 0; }
.lock-copy { color: var(--muted); font-size: 11px; margin: 18px 0 0; }

@media (max-width: 480px) {
  .wnt-title { font-size: 24px; }
  .wnt-bar-label { width: 78px; font-size: 11.5px; }
  .wnt-stat-num { font-size: 21px; }
  .wnt-two-col { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .wnt-bar-fill { transition: none; }
}
`;
