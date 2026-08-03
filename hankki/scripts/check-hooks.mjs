// 🪝 훅이 «일찍 빠져나가는 길» 아래에 있으면 잡는다.
//
// 왜 있나 (2026-08-03 · 창업자 제보 *"홍콩식가지볶음 지웠더니 먹통됨"*):
//   `RecipeDetailScreen` 이 이렇게 생겨 있었다.
//     const r = recipes.find(...)
//     if (!r) { return <레시피를 찾을 수 없어요 /> }   ← 일찍 빠져나감
//     …
//     const [picksOpen, setPicksOpen] = useState(false)  ← ⛔ 그 «아래»의 훅
//   평소엔 아무 일 없다. 그런데 **레시피를 지우는 순간** `r` 이 사라져 위에서 빠져나가고,
//   React 는 「방금 전보다 훅이 하나 적다」며 **트리를 통째로 죽인다**(error #300).
//   → 화면이 하얗게 빈다. 창업자가 본 게 그 화면이다.
//
// ⭐ 왜 못 잡았나 = 이 저장소엔 **eslint 가 없다.** 리액트 공식 규칙(`rules-of-hooks`)이
//    바로 이걸 잡는데 그게 안 돌고 있었다. 규칙을 통째로 들이는 대신 **이 한 가지만** 본다.
//
// ⚠️ 조인 곳 (처음 판은 시끄러웠다 — 시끄러운 게이트는 죽은 게이트):
//   ⒜ **함수 경계를 지킨다** — 파일 맨 위 `try { … if (_f) { … } }` 를 「빠져나가는 길」로 세서
//      `App.jsx` 훅 27개가 통째로 걸렸다. 들여쓰기 0의 함수 선언에서 다시 센다.
//   ⒝ **컴포넌트만 본다** — 이름이 대문자로 시작하는 것(＋`use` 로 시작하는 커스텀 훅).
//   ⒞ **맨 끝 `return (` 은 「일찍」이 아니다** — 그 아래엔 코드가 없다.
//
// ⛔ 실패하면 배포가 막힌다(`npm run smoke` 체인) — 화면이 통째로 죽는 버그라서.
import { readFileSync, globSync } from 'node:fs'

const HOOK = /(?:^|[\s=({[,])(use[A-Z]\w*)\s*\(/            // useState( · useMemo( · useBackHandler( …
// 들여쓰기 0에서 시작하는 «컴포넌트 or 커스텀 훅» 선언
const FN_TOP = /^(?:export\s+)?(?:default\s+)?(?:function\s+([A-Z]\w*|use[A-Z]\w*)|const\s+([A-Z]\w*|use[A-Z]\w*)\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/

const bad = []
const files = globSync('src/**/*.jsx').sort()

for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  let inFn = null       // 지금 보고 있는 컴포넌트 이름 (없으면 파일 최상단 = 검사 안 함)
  let earlyAt = 0       // 「일찍 빠져나가는 길」이 처음 나온 줄

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const t = l.trim()
    if (!t || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue

    // ── 함수 경계 — 들여쓰기 0의 선언에서 다시 센다 ──
    const fn = l.match(FN_TOP)
    if (fn) { inFn = fn[1] || fn[2]; earlyAt = 0; continue }
    if (/^\S/.test(l) && !fn) { inFn = null; earlyAt = 0; continue }  // 최상단 코드는 안 본다
    if (!inFn) continue

    // ── 「일찍 빠져나가는 길」 = 컴포넌트 최상위(들여쓰기 2)의 조건부 return ──
    if (!earlyAt && /^ {2}if\s*\(/.test(l)) {
      // 한 줄 return · 또는 블록을 열고 그 안에서 return
      if (/\breturn\b/.test(l)) earlyAt = i + 1
      else if (/\{\s*$/.test(l)) {
        for (let j = i + 1; j < lines.length && !/^ {2}\}/.test(lines[j]); j++) {
          if (/^ {4,}return\b/.test(lines[j])) { earlyAt = i + 1; break }
        }
      }
      continue
    }

    // ── 그 아래에서 컴포넌트 최상위 훅을 부르면 ⛔ ──
    if (!earlyAt) continue
    const m = l.match(HOOK)
    if (m && /^ {2}\S/.test(l)) bad.push({ f, line: i + 1, hook: m[1], fn: inFn, earlyAt })
  }
}

if (bad.length) {
  console.error('\n⛔ 훅이 «일찍 빠져나가는 길» 아래에 있다 — 그 조건이 걸리는 순간 화면이 통째로 죽는다.\n')
  for (const b of bad) console.error(`   ${b.f}:${b.line}  ${b.fn}() 안의 ${b.hook}()   ← ${b.earlyAt}줄에서 이미 빠져나갈 수 있다`)
  console.error('\n   👉 고치는 법 = 그 훅을 «맨 위»(빠져나가는 줄보다 위)로 올린다.\n')
  process.exit(1)
}
console.log(`✅ 훅 위치 — 화면 ${files.length}개 전부 「빠져나가는 길」보다 위에 있다`)
