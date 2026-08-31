/**
 * 🏷 「창업자가 붙인 이름」 ↔ 「앱 이름표」가 어긋난 컷을 찾는다 (2026-08-27)
 *
 * 📮 창업자 = *"이름이 왜 바뀐건지모르겠지만 옛컷이랑 이름이 바뀐게 좀 있는것 같아. 나도 헷갈리더라고"*
 *
 * ⭐⭐ **잣대 = 파일 내용(sha1)** — 이름표도 키도 못 속인다.
 *    창업자가 준 낱개 파일은 **파일 이름이 곧 창업자가 붙인 이름**이다(`고구마누룽지.png`).
 *    같은 그림이 앱에 어떤 키로 들어갔는지 해시로 맞춰, **앱 이름표와 다르면** 뽑는다.
 *
 * ⛔ **이건 「틀렸다」 목록이 아니다** — 줄임말·띄어쓰기·같은 뜻 다른 말이 섞인다.
 *    **판정은 창업자가 한다**(규칙 11). 이 도구는 «어디를 볼지»만 정해 준다.
 *
 * ⛔ 앱 이름표는 `FOOD_NAMES` 와 «같은 순서»로 만든다 —
 *    `EXTRA_NAMES` 를 먼저 깔고 `ICON_RULES` 의 첫 낱말이 덮는다(`FoodIcon.jsx` 그대로).
 *    ⚠️ 한 키에 규칙이 «둘» 붙으면 **뒤 규칙이 이긴다** — 그래서 `gr_343` 이름표가 「현미」다(버섯솥밥 줄이 위에 있는데도).
 *
 * 쓰기: node scripts/_대조-이름표어긋남-0827.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 사진 = path.join(ROOT, 'src/assets/stickers/photo')
const 스티커 = path.join(ROOT, 'docs/stickers')

const sha = (p) => createHash('sha1').update(readFileSync(p)).digest('hex')

// ── 앱 이름표 (FoodIcon.jsx 와 같은 순서로 만든다)
const SRC = readFileSync(path.join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const ri = SRC.indexOf('const ICON_RULES = [')
const 몸통 = SRC.slice(ri, SRC.indexOf('\n]', ri))
const 규칙 = [...몸통.matchAll(/\[\[([^\]]*)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/g)]
  .map((m) => [m[1].split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean), m[2]])
if (규칙.length < 400) { console.error(`⛔ 규칙을 ${규칙.length}개밖에 못 읽었다`); process.exit(1) }
const 앱이름 = {}
const ex = SRC.match(/const EXTRA_NAMES = \{([\s\S]*?)\n\}/)
if (ex) for (const m of ex[1].matchAll(/'?([A-Za-z0-9_]+)'?\s*:\s*'([^']+)'/g)) 앱이름[m[1]] = m[2]
// ⭐ 한 키에 규칙이 여럿이면 «몇 개인지»도 남긴다 — 이름표가 뒤 규칙으로 덮이는 자리다
const 규칙수 = {}
for (const [ks, k] of 규칙) { 앱이름[k] = ks[0]; 규칙수[k] = (규칙수[k] || 0) + 1 }

// ── 앱 컷 해시
const 앱해시 = {}
for (const f of readdirSync(사진)) {
  if (!f.endsWith('.png')) continue
  ;(앱해시[sha(path.join(사진, f))] ??= []).push(f.replace(/\.png$/, ''))
}

// ── 창업자 낱개 파일 (파일 이름 = 창업자가 붙인 이름)
const 창업자 = []
const 훑기 = (d, 깊이 = 0) => {
  if (깊이 > 4) return
  for (const f of readdirSync(d)) {
    const p = path.join(d, f)
    if (f.startsWith('_') || f.includes('archive') || f.includes('제외')) continue
    if (statSync(p).isDirectory()) { 훑기(p, 깊이 + 1); continue }
    if (!f.endsWith('.png')) continue
    // ⛔ 「07-01-매운오징어볶음」처럼 앞에 번호가 붙은 것은 번호를 뗀다
    const 이름 = f.replace(/\.png$/, '').replace(/^[\d-]+/, '').trim()
    if (!이름 || /^[a-z_0-9]+$/i.test(이름)) continue   // 키 이름 그대로인 파일은 뜻이 없다
    창업자.push({ 이름, 해시: sha(p), 어디: path.relative(스티커, p) })
  }
}
훑기(스티커)

// ── 맞대보기
const 같음 = (a, b) => a.replace(/[\s()]/g, '') === b.replace(/[\s()]/g, '')
const 어긋남 = []; let 맞음 = 0; let 못찾음 = 0
const 본키 = new Set()
for (const c of 창업자) {
  const 키들 = 앱해시[c.해시]
  if (!키들) { 못찾음++; continue }
  for (const k of 키들) {
    if (본키.has(k + c.이름)) continue
    본키.add(k + c.이름)
    if (앱이름[k] === undefined) continue
    if (같음(앱이름[k], c.이름)) { 맞음++; continue }
    어긋남.push({ 키: k, 창업자: c.이름, 앱: 앱이름[k], 규칙수: 규칙수[k] || 0, 어디: c.어디 })
  }
}

console.log(`🏷 창업자 낱개 ${창업자.length}장 · 앱 컷 ${Object.keys(앱해시).length}종`)
console.log(`   ✅ 이름이 같다 ${맞음} · ⚠️ 다르다 ${어긋남.length} · (앱에 없는 그림 ${못찾음}장)\n`)
console.log('⚠️ 「창업자가 붙인 이름」 ↔ 「앱 이름표」가 다른 곳 — ⛔틀렸다는 뜻이 아니다. 볼 자리다\n')
어긋남.sort((a, b) => b.규칙수 - a.규칙수 || a.키.localeCompare(b.키))
for (const x of 어긋남) {
  console.log(`   ${x.키.padEnd(9)} 창업자「${x.창업자}」  ↔  앱「${x.앱}」${x.규칙수 > 1 ? `   ⛔규칙 ${x.규칙수}줄 — 뒤 줄이 이름표를 덮는다` : ''}`)
}

// ⭐ 규칙이 둘 이상 붙어 «이름표가 덮이는» 키 — 창업자가 헷갈린다고 한 자리다
const 겹친규칙 = Object.entries(규칙수).filter(([, n]) => n > 1)
console.log(`\n⛔ 한 키에 규칙이 «둘 이상» — ${겹친규칙.length}개 (뒤 줄의 첫 낱말이 이름표가 된다)`)
for (const [k, n] of 겹친규칙.sort((a, b) => b[1] - a[1])) {
  const 낱말 = 규칙.filter(([, kk]) => kk === k).map(([ks]) => ks[0])
  console.log(`   ${k.padEnd(9)} ${n}줄 — ${낱말.join(' / ')}  → 이름표 「${앱이름[k]}」`)
}
