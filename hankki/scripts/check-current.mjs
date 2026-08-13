// 🧭 「현행이다」가 «한 곳»에만 있고 «맨 아래»에 있는지 — 어기면 배포를 막는다.
//
// 📮 창업자 2026-08-13: *"로드맵 우선순위 현행부터 읽기 규칙만들어. **낡게하지말고**"*
//
// ⛔⛔ 무슨 일이 있었나 —
//   `docs/로드맵-우선순위.md` 는 오래 **«머리는 최신, 몸통은 7/29 판»** 이었다.
//   게다가 문서 «가운데»(178줄)에 `⭐여기가 현행이다`(8/02)가 박혀 있어서
//   **「현행」이 두 곳**이었다 — 맨 위 블록(8/13)과 가운데(8/02).
//
// ⭐⭐ **현행이 둘이면 하나는 «반드시» 틀린 값이 된다.**
//   그리고 우리 도구(`doc-guard --gen`)와 훅은 **「맨 아래가 현행」** 으로 읽는다.
//   사람이 읽는 곳과 기계가 가리키는 곳이 다르면, 둘 중 하나를 보고 틀린 판단을 한다.
//   📌 그래서 «선언은 한 번, 자리는 맨 아래» 로 못 박는다.
//
// ⛔ 「규칙」이 아니라 「장치」인 이유 = 창업자 2026-07-31 *"규칙만 만들면 뭐해 안지키는데."*
//
// ── 무엇을 보나 ─────────────────────────────────────────────
//   ⓐ 「현행이다」 선언은 **제목 줄(#)** 에서만 센다 — 본문·인용의 «설명»까지 세면 헛방이 된다
//      (지금 로드맵엔 그 낱말이 4번 나오는데 진짜 선언은 «하나»다).
//   ⓑ 선언이 2개 이상 → ⛔ 실패
//   ⓒ 선언이 «맨 아래 세대»가 아닌 곳에 있으면 → ⛔ 실패
//   ⓓ 선언한 세대가 STALE_DAYS 넘게 안 바뀌었으면 → ⚠️ 경고(실패 아님)
//      ⛔ 실패로 안 만든다 — 날짜가 찼다고 배포를 막으면 **급할 때 게이트를 꺼버린다.**
//         꺼진 게이트는 없는 게이트다.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { generations } from './doc-guard.mjs'

const APP = existsSync('hankki/docs') ? 'hankki' : '.'
const STALE_DAYS = 21

// 「현행이다」라고 «선언»하는 제목 줄. ⚠️ 인용(>)·본문은 안 본다.
const DECLARE = /^#{1,3}\s.*현행이다/

// 이 검사가 도는 문서 = **스스로 「현행이다」를 선언한 문서**만.
// ⭐ 목록을 손으로 관리하지 않는다 — 선언한 문서가 곧 대상이다(늘어나도 저절로 따라온다).
const DOCS = ['docs/로드맵-우선순위.md', 'docs/할일-전체정리-2026-08-13.md']
  .map((p) => join(APP, p)).filter(existsSync)

const 오늘 = new Date()
let 죽음 = 0
let 조용 = true

for (const f of DOCS) {
  const lines = readFileSync(f, 'utf8').split('\n')
  const 선언 = []
  lines.forEach((l, i) => { if (DECLARE.test(l)) 선언.push({ line: i + 1, text: l.trim().slice(0, 90) }) })
  if (!선언.length) continue
  조용 = false
  const short = f.replace(APP + '/', '')

  // ⓑ 두 번 이상 선언
  if (선언.length > 1) {
    죽음++
    console.error(`\n⛔ ${short} — 「현행이다」 선언이 ${선언.length}개다. 하나만 둔다.`)
    선언.forEach((d) => console.error(`     ${d.line}줄  ${d.text}`))
    console.error(`   👉 옛 것은 「⛔지나간 판단이다」로 바꾸고, 선언은 «맨 아래»에만 남긴다.`)
    continue
  }

  // ⓒ 맨 아래 세대인가
  const g = generations(f)
  const 현행 = g[g.length - 1]
  const d = 선언[0]
  if (현행 && d.line < 현행.line) {
    죽음++
    console.error(`\n⛔ ${short} — 「현행이다」가 ${d.line}줄인데 맨 아래 세대는 ${현행.line}줄이다.`)
    console.error(`     사람은 ${d.line}줄을, 도구(doc-guard·훅)는 ${현행.line}줄을 「현행」이라 부른다 — 둘이 갈린다.`)
    console.error(`   👉 새 세대를 «맨 아래»에 얹고 선언을 거기로 옮긴다.`)
    continue
  }

  // ⓓ 낡음 — 경고만
  const 날 = (현행?.date || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (날) {
    const 지난 = Math.floor((오늘 - new Date(+날[1], +날[2] - 1, +날[3])) / 86400000)
    if (지난 > STALE_DAYS) {
      console.log(`⚠️  ${short} 의 현행 세대가 ${지난}일 됐다(${현행.date}) — 큰 그림이 그동안 안 바뀌었나 한 번 볼 것`)
    } else {
      console.log(`   · ${short} — 현행 = ${현행.line}줄 (${현행.date} · ${지난}일 전)`)
    }
  }
}

if (죽음) {
  console.error(`\n📌 「현행이다」는 «한 곳»에만, «맨 아래»에. 그래야 사람과 기계가 같은 데를 본다.\n`)
  process.exit(1)
}
if (조용) console.log('✅ 「현행이다」를 선언한 문서 없음 — 볼 것 없다')
else console.log('✅ 「현행이다」 선언 = 문서마다 하나 · 전부 맨 아래')
