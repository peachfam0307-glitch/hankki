// 🍳 창업자 36편을 앱에 넣기 «전» 조사 — 무엇이 자동으로 정해지고 무엇을 «내가 지어야» 하나
//
// 📮 창업자 2026-08-12 *"내레시피는 c로가자. 매주 2개씩 넣되, 우리집레시피(큰제목) 작은제목 이번주 한끼"*
//
// ⭐ 목적 = **「지어낸 값」을 눈에 보이게 가른다.** 36편 × 여러 칸을 손으로 채우면
//    어느 게 창업자 값이고 어느 게 내 짐작인지 섞여서 구별이 안 된다(닭곰탕 때 겪었다).
// ⛔ 이 판은 «조사»다. 여기서 basics.js 를 고치지 않는다.
import { readFileSync, existsSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const 편 = JSON.parse(readFileSync(new URL('docs/_대기/레시피-정리-초안-2026-08-10.json', 뿌리), 'utf8'))
const src = readFileSync(new URL('src/components/FoodIcon.jsx', 뿌리), 'utf8')
const basics = readFileSync(new URL('src/data/basics.js', 뿌리), 'utf8')

// ── 아이콘: 앱과 «같은 규칙»으로 (ICON_RULES 를 순서대로 읽어 첫 매칭) ──
const 본문 = src.slice(src.indexOf('const ICON_RULES = ['))
const 규칙 = [...본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 100) { console.error(`⛔ ICON_RULES 를 ${규칙.length}개밖에 못 읽었다`); process.exit(1) }
const 고르기 = (제목) => 규칙.find((r) => r.keys.some((k) => 제목.includes(k)))?.key || 'default'
const 사진있나 = (키) => existsSync(new URL(`src/assets/stickers/photo/${키}.png`, 뿌리))

// ── 이미 앱에 있는 제목 (겹치면 두 번 뜬다) ──
const 있는제목 = new Set([...basics.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]))

// ── 인분: `serve` 에서 «사람 수»만 뽑는다. 「돼지고기 600g 기준」 같은 건 사람 수가 아니다 ──
const 인분 = (s = '') => {
  const m = s.match(/(\d+)\s*~\s*(\d+)\s*인분/) || s.match(/(\d+)\s*인분/)
  if (!m) return null                       // ⛔ 못 읽으면 «내가 지어야 하는 칸»
  return m[2] ? Math.round((+m[1] + +m[2]) / 2) : +m[1]
}

console.log(`\n🍳 창업자 36편 — 앱에 넣기 전 조사\n${'─'.repeat(74)}`)
const 몫 = { 인분없음: [], 사진없음: [], 겹침: [], 아이콘같음: {} }
편.forEach((r, i) => {
  const k = 고르기(r.title)
  const 사진 = 사진있나(k)
  const p = 인분(r.serve)
  ;(몫.아이콘같음[k] = 몫.아이콘같음[k] || []).push(r.title)
  if (!p) 몫.인분없음.push(`${r.title} (serve=「${r.serve}」)`)
  if (!사진) 몫.사진없음.push(`${r.title} → ${k}`)
  if (있는제목.has(r.title)) 몫.겹침.push(r.title)
  console.log(`${String(i + 1).padStart(2)} ${r.title.padEnd(18)} ${k.padEnd(10)} ${사진 ? '📷' : '⛔도형'} ` +
    `인분 ${p ? String(p).padStart(2) : ' ?'}  재료${String(r.ingredients.length).padStart(2)} 순서${r.steps.length}`)
})

console.log(`\n${'─'.repeat(74)}`)
console.log(`⛔ 사람 수를 못 읽은 편 ${몫.인분없음.length} — «내가 지어야 하는 칸»`)
몫.인분없음.forEach((x) => console.log('   ·', x))
console.log(`\n⛔ 음식 사진이 아니라 «범용 도형»이 붙는 편 ${몫.사진없음.length}`)
몫.사진없음.forEach((x) => console.log('   ·', x))
const 둘이상 = Object.entries(몫.아이콘같음).filter(([, v]) => v.length > 1)
console.log(`\n🔁 같은 아이콘을 나눠 쓰는 자리 ${둘이상.length}`)
둘이상.forEach(([k, v]) => console.log(`   · ${k} ← ${v.join(' / ')}`))
console.log(`\n⛔ 앱에 «이미 같은 제목»이 있는 편 ${몫.겹침.length}`, 몫.겹침.join(', ') || '(없음)')
console.log(`\n📌 순서·재료·메모·인분(읽힌 것) = 창업자 값 · 시간·난이도 = «내가 지어야 한다»`)
