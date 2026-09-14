#!/usr/bin/env node
/**
 * ✂️ 「한글 낱말이 가운데서 잘린다」 재현판 — 2026-09-09
 *
 * 📮 창업자 = "줄바꿈도 체크해서 마지막 검수"
 *
 * ⛔ 한글은 브라우저 기본이 «글자» 단위라 낱말 한가운데서 잘린다 —
 *    창업자 캡처(8:34)에 「· AI 다듬기가 안 됐어요 · 아래 / 단추로 한 번 더」로 갈라져 있었다.
 *    📌 v11.19 「안 담겨/요」와 «같은 병»이다. **새 문장을 넣을 때마다 다시 난다.**
 *
 * ⭐ 이 판이 재는 것 = 오늘 새로 넣은 안내가 나가는 자리마다 keep-all 이 있나.
 *    ⛔ 칸마다 붙일 필요는 없다 — «감싸는 칸»에 있으면 물려받는다. 그래서 «파일 단위»로 본다.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 읽기 = (...p) => readFileSync(join(여기, '..', 'src', ...p), 'utf8')

let 틀림 = 0
const 잰다 = (ok, 이름) => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}`) }

console.log('\n✂️ 줄바꿈(keep-all) — 재현판\n')

// ⭐ 「이 문장이 있는 파일엔 keep-all 이 있어야 한다」 — 문장과 파일을 짝지어 잰다
const 짝 = [
  ['components/TidyWaiting.jsx', 'AI가 레시피를 다듬고 있어요', '하얀 안내창'],
  ['screens/InboxScreen.jsx', '남은까닭(r)', '임시보관함 까닭 줄'],
  ['screens/EditorScreen.jsx', 'AI가 더 다듬는 중이에요', '레시피 정리 진행 줄'],
]
for (const [파일, 문장, 이름] of 짝) {
  const s = 읽기(...파일.split('/'))
  잰다(s.includes(문장), `${이름} — 그 문장이 아직 있다`)
  잰다(/wordBreak: 'keep-all'/.test(s), `${이름} — keep-all 이 있다`)
}

// ⭐⭐ 창 안에서는 «감싸는 칸»에 붙였다 — 하나만 붙이고 나머지를 잊는 일이 없게
{
  const 창 = 읽기('components', 'TidyWaiting.jsx')
  const 감싼칸 = [...창.matchAll(/padding: '6px 22px 0'[^}]*/g)]
  잰다(감싼칸.length === 2, `창의 감싸는 칸이 둘이다 (지금 ${감싼칸.length})`)
  잰다(감싼칸.every((m) => /keep-all/.test(m[0])), '⭐그 둘 «모두»에 keep-all 이 있다(도는 중·끝말)')
}

// ⛔ 줄을 «손으로» 끊지 않았나 — 폰 폭이 제각각이라 손으로 끊으면 다른 폰에서 더 이상하게 갈린다
//   ⛔ 파일 전체로 세면 «틀린다** — 자동/직접 갈래는 «동시에 안 뜬다»(화면엔 언제나 하나뿐).
//   ⭐ 그래서 «한 덩어리(<>…</>) 안에 몇 개인가»를 센다. 한 덩어리에 둘이면 그건 진짜 과하다.
{
  const 창 = 읽기('components', 'TidyWaiting.jsx')
  const 덩어리들 = [...창.matchAll(/<>[\s\S]*?<\/>/g)].map((m) => (m[0].match(/<br \/>/g) || []).length)
  잰다(덩어리들.length > 0, `갈래를 찾았다 (${덩어리들.length}개)`)
  잰다(덩어리들.every((n) => n <= 1), `한 갈래에 손줄이 1개 이하다 (${덩어리들.join(',')})`)
}

if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다 — 한글 낱말이 가운데서 잘린다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 낱말이 통째로 넘어간다.\n')
