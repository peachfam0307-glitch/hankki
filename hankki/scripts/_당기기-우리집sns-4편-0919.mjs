#!/usr/bin/env node
// 📅📅 우리집레시피·SNS 를 «주 4편»으로 당긴다 — 2026-09-19 (창업자 「좋아 ㄱㄱ 하자」)
//
// 📮 창업자 = *"다른 앱에 비해 레시피가 너무 적어"* → *"제철은 그대로 두고 우리집만 늘리자"* ＋ SNS 4편
//    · 🌿 제철 = «안 건드린다» (주마다 그 시기 주제 — 김장날·연말 파스타를 당기면 철이 어긋난다)
//    · 🏠 우리집 = HOMEMADE 줄을 «둘씩 합쳐» 한 주 4편 · 그 편들의 from 도 같이 당긴다 (40편 → 10주 · 11/23 끝)
//    · 📱 SNS = 앞으로 열릴 20편을 수요일 4편씩 (9/23 ~ 10/21 · 그 뒤는 창업자가 계속 준다)
// ⛔ 안 바뀌면 «죽는다» — 자리를 못 찾거나 두 번 찾으면 아무것도 안 쓴다.
// 쓰는 법: node scripts/_당기기-우리집sns-4편-0919.mjs        (--dry 면 보여만 준다)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const R = new URL('..', import.meta.url).pathname
const DRY = process.argv.includes('--dry')
const 오늘 = '2026-09-19'
let basics = readFileSync(join(R, 'src/data/basics.js'), 'utf8')
let weekly = readFileSync(join(R, 'src/data/weekly.js'), 'utf8')
const { 레시피들 } = await import('./recipe.mjs')
const w = await import('../src/data/weekly.js')
const all = 레시피들(); const by = Object.fromEntries(all.map((r) => [r.id, r]))
const 더한날 = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }

// 레시피 한 편의 from 을 바꾼다 — 「title: '…', from: '옛날'」 줄이 «딱 하나»여야 한다
const 옮김 = []
const 편옮기기 = (r, 새날) => {
  if (r.from === 새날) return
  const 옛 = `title: '${r.title}', from: '${r.from}'`
  const n = basics.split(옛).length - 1
  if (n !== 1) { console.error(`⛔ ${r.title}: 「${옛}」 가 ${n}군데 (1이어야)`); process.exit(1) }
  basics = basics.replace(옛, `title: '${r.title}', from: '${새날}'`)
  옮김.push(`${r.title} ${r.from.slice(5)} → ${새날.slice(5)}`)
}

// ── 📱 SNS — 수요일 4편씩
const sns = all.filter((r) => r.source === 'hankki' && r.sourceUrl && r.from && r.from > 오늘).sort((a, b) => a.from.localeCompare(b.from))
if (sns.length !== 20) { console.error('⛔ SNS 예정이 20편이어야 하는데', sns.length); process.exit(1) }
sns.forEach((r, i) => 편옮기기(r, 더한날('2026-09-23', 7 * Math.floor(i / 4))))

// ── 🏠 우리집 — 줄 둘씩 합친다 (9/21 은 이미 4편 · 그 뒤부터)
// 📌 why 와 ids 사이에 주석 줄이 낀 줄이 셋 있다(뺀 편 기록) — 그 주석은 합친 줄에 «그대로» 들고 간다
const 줄정규 = /  \{ from: '(\d{4}-\d\d-\d\d)', title: '우리집레시피', kicker: '이번 주 한끼',\n    why: '일상에서 자주 해먹는 요리들이에요\.',\n((?:    \/\/[^\n]*\n)*)    ids: \[([^\]]*)\] \},([^\n]*)\n/g
const 줄들 = [...weekly.matchAll(줄정규)].map((m) => ({ 전체: m[0], from: m[1], 주석: m[2], ids: m[3], 꼬리: m[4].trim() }))
const 뒤 = 줄들.filter((x) => x.from > '2026-09-21')
if (뒤.length !== 18) { console.error('⛔ 9/21 뒤 우리집 줄이 18이어야 하는데', 뒤.length); process.exit(1) }
for (let i = 0; i < 뒤.length; i += 2) {
  const A = 뒤[i], B = 뒤[i + 1]
  const 새날 = 더한날('2026-09-28', 7 * (i / 2))
  const 새줄 = `  { from: '${새날}', title: '우리집레시피', kicker: '이번 주 한끼',\n    why: '일상에서 자주 해먹는 요리들이에요.',\n${A.주석}${B.주석}    ids: [${A.ids}, ${B.ids}] },   ${A.꼬리.replace(/^\/\/\s*/, '// ')} · ${B.꼬리.replace(/^\/\/\s*/, '')}\n`
  if (weekly.split(A.전체).length - 1 !== 1 || weekly.split(B.전체).length - 1 !== 1) { console.error('⛔ 우리집 줄을 딱 하나로 못 찾았다', A.from, B.from); process.exit(1) }
  weekly = weekly.replace(A.전체, 새줄).replace(B.전체, '')
  for (const id of `${A.ids}, ${B.ids}`.split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean)) {
    if (!by[id]) { console.error('⛔ 없는 id', id); process.exit(1) }
    편옮기기(by[id], 새날)
  }
}
// 📌 우리집 줄 주석 「18주」 → 실제 줄 수는 코드가 정한다 — 글자는 안 건드린다(손으로 고치지 말 것 표시가 있다)

// ── 📱 홈 SNS 상자 2 → 4 (2026-09-03 창업자 「할만하면 4편」 · 폰 두 줄 딱)
const 옛k = "export const snsNow = (recipes = [], now = new Date(), k = 2) => {"
if (weekly.split(옛k).length - 1 !== 1) { console.error('⛔ snsNow k=2 줄을 못 찾았다'); process.exit(1) }
weekly = weekly.replace(옛k, "export const snsNow = (recipes = [], now = new Date(), k = 4) => {   // ✅ 2026-09-19 창업자 「SNS 늘리자」 — 수요일 4편 · 폰 두 줄 딱")

console.log(`옮긴 편 ${옮김.length}개`); for (const s of 옮김) console.log('  ', s)
if (DRY) { console.log('👀 --dry 라 안 썼다'); process.exit(0) }
writeFileSync(join(R, 'src/data/basics.js'), basics); writeFileSync(join(R, 'src/data/weekly.js'), weekly)
console.log('✅ basics.js · weekly.js 썼다')
