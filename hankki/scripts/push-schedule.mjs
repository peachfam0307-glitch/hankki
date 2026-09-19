#!/usr/bin/env node
// 🔔📅 알림 일정 굽기 — `dist/push/schedule.json`   (2026-09-19 · `npm run build` 뒤에 저절로 돈다 = postbuild)
//
// ⛔⛔ 왜 여기서 굽나 — 워커는 앱 코드를 못 읽는다. 그렇다고 워커에 날짜를 «또» 적으면 두 곳이 어긋난다.
//    ✅ 날짜가 «사는 곳»(weekly.js · basics.js · curation.js · seasonDecor.js)을 이미 읽는 `release-calendar.gates()` 를 «부른다».
//       로직을 두 벌로 만들지 않는다(절대원칙 30·35). 명절 꾸미기는 `seasonDecor.명절창` 을 그대로 읽는다.
// ⭐ 하루 = «한 줄» — 같은 날 여러 갈래가 열려도 문구를 «합친다»(창업자 확정 「당일 하루 1번만」).
//    시각 = 그날 갈래 중 «제일 이른» 것 (장바구니 09:00 < 레시피·SNS 15:30 < 꾸미기 20:00).
// ⏳ 문구는 «임시»다 — 창업자가 아직 문장을 안 정했다(2026-09-19). 여기 한 곳만 고치면 된다(워커는 안 만진다).
//
// 쓰는 법:  node scripts/push-schedule.mjs            → dist/push/schedule.json 굽기
//           node scripts/push-schedule.mjs --오늘      → 오늘 줄만 찍기(있으면)
//           node scripts/push-schedule.mjs --미리 14   → 앞으로 14일 줄 찍기
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gates, todayKST } from './release-calendar.mjs'
import { 명절창 } from '../src/data/seasonDecor.js'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
export const 시각표 = { cart: '09:00', recipe: '15:30', sns: '15:30', decor: '20:00' }   // 창업자 확정 2026-09-19
// 📅 'YYYY-MM-DD' 에 n일 더하기 — ⛔「오늘」은 여기서 안 만든다(todayKST 로 받는다). UTC 자정 기준 덧셈이라 시간대와 무관하다(check-kst 규칙).
const 며칠뒤 = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}` }
const 며칠 = 120

export function 일정만들기(부터 = todayKST()) {
  const 날 = {}
  const 더하기 = (date, kind, 조각) => { (날[date] ||= { kinds: new Set(), 조각: [] }); 날[date].kinds.add(kind); if (조각) 날[date].조각.push(조각) }
  for (const g of gates()) {
    if (g.date < 부터) continue
    if (g.kind === 'recipe') 더하기(g.date, 'recipe', `이번 주 레시피가 열렸어요 — ${String(g.what).split(' — ')[0].replace(/\s+⛔.*$/, '')}`)
    else if (g.kind === 'sns') 더하기(g.date, 'sns', '새 SNS 레시피가 열렸어요')
    else if (g.kind === 'cart') 더하기(g.date, 'cart', null)
    else if (/^꾸미기 서랍/.test(String(g.where || ''))) 더하기(g.date, 'decor', '새 꾸미기가 열렸어요')
  }
  for (const s of 명절창) if (s.from >= 부터) 더하기(s.from, 'decor', `${s.label} 꾸미기가 열렸어요`)
  const 끝날 = 며칠뒤(부터, 며칠)
  const out = {}
  for (const [date, v] of Object.entries(날).sort()) {
    if (date > 끝날) continue
    const 장바구니수 = gates().filter((g) => g.date === date && g.kind === 'cart').length
    let 조각 = [...new Set(v.조각)]
    // 🎃 명절 이름이 붙은 줄이 있으면 밋밋한 「새 꾸미기」 줄은 뺀다 — 같은 날 둘이 겹치면 한 말을 두 번 한다
    if (조각.some((c) => /^(?!새 )\S+ 꾸미기가 열렸어요$/.test(c))) 조각 = 조각.filter((c) => c !== '새 꾸미기가 열렸어요')
    if (v.kinds.has('cart')) 조각.push(`이번 주 장바구니 ${장바구니수}개가 열렸어요`)
    const 시각 = [...v.kinds].map((k) => 시각표[k]).sort()[0]
    out[date] = { 제목: '한끼', 본문: 조각.join(' · '), 길: './', 시각, 갈래: [...v.kinds].sort() }
  }
  return { 만든때: new Date().toISOString(), 부터, 며칠, 날: out }
}

const isMain = (process.argv[1] || '').endsWith('push-schedule.mjs')
if (isMain) {
  const mode = process.argv[2] || ''
  const 일정 = 일정만들기()
  if (mode === '--오늘') {
    const t = 일정.날[todayKST()]
    console.log(t ? `📨 오늘(${todayKST()}) ${t.시각} — ${t.본문}` : `(오늘 ${todayKST()} 보낼 것 없음)`)
  } else if (mode === '--미리') {
    const n = Number(process.argv[3] || 14)
    const 끝날 = 며칠뒤(todayKST(), n)
    for (const [d, v] of Object.entries(일정.날)) if (d <= 끝날) console.log(`   ${d} ${v.시각}  ${v.본문}`)
  } else {
    const dir = join(뿌리, 'dist', 'push')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'schedule.json'), JSON.stringify(일정, null, 1))
    console.log(`🔔 push/schedule.json — ${Object.keys(일정.날).length}일치 (${일정.부터} 부터 ${며칠}일)`)
  }
}
