// ⏰⏰ «그 날이 되면 저절로 뜬다» — 예약 알림 (2026-09-17)
//
// 📮 창업자 = *"9/20에 다시 돌려서 표 갈아끼우게 알림 걸어놔"*
//
// ⛔ 왜 만들었나 = 날짜를 문서에 적어두기만 하면 «아무 일도 안 일어난다».
//    실제로 「수요일은 9/30에 재확인」이 그렇게 적혀 있었고 아무 장치가 없었다.
//    HANDOVER 한 줄은 다음 정리 때 밀려나고, 저장소를 같이 보는 «다른 세션»은 아예 안 읽는다.
//
// 무엇을 하나 = docs/예약-알림.md 의 「## 알림」 표를 읽어 **오늘(KST) 이거나 지난** 줄을 찍는다.
//    · 「끝」 칸이 차 있으면 조용하다 (⛔줄을 지우지 않는다 — 왜 했는지가 남아야 한다)
//    · 지나도 안 사라진다 → 「N일 늦었다」 로 계속 뜬다
//    · 오래된 순 · 최대 다섯 (⛔시끄러운 게이트는 죽은 게이트다)
//    · 표 꼴이 깨지면 «죽는다» — 조용히 아무것도 안 뜨는 게 제일 나쁜 실패다
//
// ⛔ 날짜는 TZ=Asia/Seoul 로 만든다 — UTC 로 읽으면 하루 어긋난다(2026-08-17 KST 사고).
// ⛔ 훅에서 부르므로 무슨 일이 나도 exit 0 (세션 시작을 막지 않는다).
//
// 쓰는 법:  node scripts/알림.mjs          # 오늘 기준
//           node scripts/알림.mjs --전부   # 안 끝난 것 전부 (앞날 것까지)
import { readFileSync } from 'node:fs'

const 앱뿌리 = new URL('../', import.meta.url)
const 오늘 = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })   // YYYY-MM-DD
const 전부 = process.argv.includes('--전부')

let 글
try { 글 = readFileSync(new URL('docs/예약-알림.md', 앱뿌리), 'utf8') } catch { process.exit(0) }

const 줄들 = 글.split('\n')
const 시작 = 줄들.findIndex((l) => /^## 알림/.test(l))
if (시작 < 0) { console.error('\n⛔ 예약 알림 — docs/예약-알림.md 에 「## 알림」 절이 없다\n'); process.exit(0) }

const 날짜꼴 = /^\d{4}-\d{2}-\d{2}$/
const 줄 = []
for (const l of 줄들.slice(시작 + 1)) {
  if (/^## /.test(l)) break
  if (!/^\|/.test(l)) continue
  const 칸 = l.split('|').slice(1, -1).map((s) => s.trim())
  if (칸.length === 5 && 칸[0] === '날짜') continue      // 머리
  if (칸.every((c) => /^-*$/.test(c))) continue          // 구분선
  if (칸.length !== 5) { console.error(`\n⛔ 예약 알림 — 칸이 5개가 아니다(${칸.length}) → ${l}\n`); process.exit(0) }
  if (!날짜꼴.test(칸[0])) { console.error(`\n⛔ 예약 알림 — 날짜가 「YYYY-MM-DD」 가 아니다 → ${칸[0]}\n`); process.exit(0) }
  줄.push({ 날: 칸[0], 누가: 칸[1], 무엇: 칸[2], 어떻게: 칸[3], 끝: 칸[4] })
}

const 안끝난 = 줄.filter((r) => !r.끝)
const 뜰것 = (전부 ? 안끝난 : 안끝난.filter((r) => r.날 <= 오늘)).sort((a, b) => a.날 < b.날 ? -1 : 1)
if (뜰것.length === 0) process.exit(0)

const 며칠 = (날) => Math.round((Date.parse(`${오늘}T00:00:00Z`) - Date.parse(`${날}T00:00:00Z`)) / 86400000)
console.log(`\n⏰⏰ **예약 알림 — 오늘(${오늘}) 할 것** · 전문 = hankki/docs/예약-알림.md`)
for (const r of 뜰것.slice(0, 5)) {
  const n = 며칠(r.날)
  const 딱지 = n > 0 ? `🔴 ${n}일 늦었다` : n === 0 ? '⭐ 오늘이다' : `D-${-n}`
  console.log(`   ${딱지}  [${r.누가}] ${r.무엇}`)
  console.log(`      👉 ${r.어떻게}`)
}
if (뜰것.length > 5) console.log(`   … ${뜰것.length - 5}개 더 — node scripts/알림.mjs --전부`)
console.log(`   ✅ 끝내면 그 줄 「끝」 칸에 날짜를 적는다 (⛔줄을 지우지 않는다)\n`)
process.exit(0)
