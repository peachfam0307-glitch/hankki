#!/usr/bin/env node
// 🔗 창업자가 준 「이름 ＋ 파트너스 주소」를 `ingLinks.js` 표에 «대신» 넣는다 (2026-09-12)
//
// 📮 창업자 = *"최대한 내가 두번일안하게 잘 설계해줄래 부탁해"*
//
// ⭐⭐ **이 도구가 막는 「두 번 일」 넷**
//   ⓐ **이름이 조금 달라 조용히 안 붙는 것** — 「다진마늘」로 적었는데 재료는 「다진 마늘」(공백).
//      → 재료 목록과 대조해서 **비슷한 이름을 그 자리에 보여준다.** ⛔짐작으로 고쳐 넣지 않는다.
//   ⓑ **이미 만든 걸 또 만드는 것** — 표에 있으면 「이미 있다」고 알린다.
//   ⓒ **짝이 밀리는 것** — 이름이 열쇠라 순서가 섞여도 괜찮다. 이름 없는 줄은 **안 받는다.**
//   ⓓ **내가 손으로 옮겨 적다 틀리는 것** — 파일에 직접 쓴다.
//
// ⭐ 넣고 나서 **「이 링크가 덮는 재료 줄이 몇 개인지」**를 찍어 준다 — 값이 보인다.
//
// 쓰는 법 (창업자가 준 글을 그대로 파일에 붙여넣고)
//   node scripts/_판-재료링크넣기.mjs /tmp/받은것.txt          # 👀 뭐가 들어갈지 보여만 준다
//   node scripts/_판-재료링크넣기.mjs /tmp/받은것.txt --넣음   # ✍️ 실제로 표에 쓴다
//
// 받는 모양 — 한 줄에 하나. 이름과 주소 사이는 탭이든 공백이든 상관없다.
//   대파   https://link.coupang.com/a/xxxx
//   양파,https://link.coupang.com/a/yyyy
//   계란 / 달걀    https://link.coupang.com/a/zzzz      ← ⭐ 같은 링크를 여러 이름에
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => { try { return readFileSync(join(뿌리, p), 'utf8') } catch { return '' } }
const { ingredientName } = await import(join(뿌리, 'src/utils.js'))

const 받은파일 = process.argv[2]
const 진짜넣나 = process.argv.includes('--넣음')
if (!받은파일) { console.error('👉 node scripts/_판-재료링크넣기.mjs <창업자가 준 글 파일> [--넣음]'); process.exit(1) }

// ── 우리 재료 이름을 다 모은다 (대괄호를 세면서 — 짧은 정규식은 소제목에서 멈춘다)
const 덩어리 = (src) => {
  const out = []
  for (const m of src.matchAll(/ingredients:\s*\[/g)) {
    let i = m.index + m[0].length, d = 1; const s = i
    while (i < src.length && d > 0) {
      const c = src[i]
      if (c === "'") { i++; while (i < src.length && src[i] !== "'") i += src[i] === '\\' ? 2 : 1 }
      else if (c === '[') d++; else if (c === ']') d--
      i++
    }
    out.push(src.slice(s, i - 1))
  }
  return out
}
const 셈 = new Map()
for (const f of ['weekly', 'seed', 'basics', 'paidPacks'])
  for (const d of 덩어리(읽기(`src/data/${f}.js`)))
    for (const s of d.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      const l = s[1].replace(/\\'/g, "'")
      if (/^[-—=]|^\[|:$/.test(l.trim())) continue
      const n = ingredientName(l)
      if (n) 셈.set(n, (셈.get(n) || 0) + 1)
    }
if (셈.size < 50) { console.error('⛔ 재료를 50개도 못 읽었다 — 파일 모양이 바뀌었다. 이 도구를 고칠 것.'); process.exit(1) }

// ── 이 이름이 덮는 줄 수 (완전일치 ＋ 낱말 경계 잇기 — `ingLinks.js` 와 «같은» 규칙)
const 낱말경계 = /[\s,()·/+—-]/
const 덮는줄 = (키) => {
  let n = 0
  for (const [이름, v] of 셈) {
    if (이름 === 키) { n += v; continue }
    let i = 이름.indexOf(키)
    while (i >= 0) {
      const 앞 = i === 0 || 낱말경계.test(이름[i - 1])
      const 끝 = i + 키.length
      if (앞 && (끝 === 이름.length || 낱말경계.test(이름[끝]))) { n += v; break }
      i = 이름.indexOf(키, i + 1)
    }
  }
  return n
}
// 비슷한 이름 찾기 (공백·가운뎃점을 지우고 맞춰 본다 — 「다진마늘」↔「다진 마늘」)
const 납작 = (s) => s.replace(/[\s·]/g, '')
const 비슷한것 = (키) => [...셈.keys()].filter((x) => 납작(x) === 납작(키) || (납작(x).includes(납작(키)) && 납작(키).length >= 2)).slice(0, 5)

const il = readFileSync(join(뿌리, 'src/data/ingLinks.js'), 'utf8')
const 이미 = new Set([...il.matchAll(/^\s*'([^']+)':\s*'https:/gm)].map((m) => m[1]))

// ── 창업자가 준 글을 읽는다
const 넣을것 = [], 물어볼것 = [], 버린것 = []
for (const 줄 of readFileSync(받은파일, 'utf8').split('\n')) {
  const t = 줄.trim()
  if (!t || t.startsWith('#') || t.startsWith('//')) continue
  const m = t.match(/^(.*?)[\s,\t]+(https?:\/\/\S+)\s*$/)
  if (!m) {
    if (/^https?:\/\//.test(t)) 버린것.push({ 줄: t, 왜: '이름이 없다 — 주소만 있으면 어느 재료인지 알 수 없다(짝이 밀린다)' })
    else 버린것.push({ 줄: t, 왜: '주소가 없다' })
    continue
  }
  const 주소 = m[2]
  // 🛒 [창업자 확정 2026-09-12] **쿠팡에 없는 것은 다른 몰 주소도 받는다.**
  //   📮 창업자 = *"4번은 꼭 넣어줘. 쿠팡에 없어서 넣은거야."*
  //   ⭐ 수수료는 0원이지만 **유저는 살 수 있다** — 못 사는 링크보다 낫다.
  //   ⚠️ 그래서 «막지 않고 알린다» — 나중에 쿠팡에 들어오면 바꾸라는 뜻이다.
  if (!주소.startsWith('https://link.coupang.com/')) console.log(`   ⚠️ ${m[1].trim()} — 파트너스가 아니라 수수료 0원 (쿠팡에 없어서 받은 주소)`)
  // ⭐ 「계란 / 달걀」처럼 한 링크를 여러 이름에 달 수 있다
  const 한줄이름들 = m[1].split(/\s*[/|]\s*/).map((x) => x.trim()).filter(Boolean)
  for (const 이름 of 한줄이름들) {
    if (이미.has(이름)) { 버린것.push({ 줄: 이름, 왜: '표에 «이미» 있다 — 다시 만들 필요 없었다' }); continue }
    if (셈.has(이름)) {
      // ⚠️⚠️ **재료에 있어도 안심하면 안 된다** — 「다진마늘」은 실제로 재료에 «1줄» 있다.
      //    그런데 정작 많이 쓰는 건 「다진 마늘」(공백 있음)로 **86줄**이다.
      //    그대로 넣으면 1줄에만 붙고 창업자는 «다 붙은 줄» 안다 → 나중에 또 만들게 된다.
      //    ⭐ 그래서 「납작하게 보면 같은데 훨씬 많이 쓰는 이름」이 있으면 «그것도» 같이 알린다.
      const 형제 = [...셈.entries()].filter(([x]) => x !== 이름 && 납작(x) === 납작(이름) && 셈.get(x) > 셈.get(이름))
      넣을것.push({ 이름, 주소, 줄수: 덮는줄(이름), 형제: 형제.sort((a, b) => b[1] - a[1]), 묶음: 한줄이름들 })
    } else 물어볼것.push({ 이름, 주소, 후보: 비슷한것(이름) })
  }
}

console.log(`\n🔗 받은 것 — 넣을 것 ${넣을것.length} · 물어볼 것 ${물어볼것.length} · 버린 것 ${버린것.length}`)
if (넣을것.length) {
  console.log('\n✅ 넣을 것 (이 줄 수만큼 파트너스가 붙는다)')
  넣을것.sort((a, b) => b.줄수 - a.줄수)
  for (const x of 넣을것) {
    console.log(`   ${x.이름}\t${x.줄수}줄`)
    // ⚠️ 거의 같은 이름인데 «훨씬 많이» 쓰는 것이 따로 있으면 그 자리에서 말한다
    for (const [형, v] of (x.형제 || []))
      console.log(`      ⚠️ 「${형}」 가 ${v}줄로 훨씬 많다 — 같은 링크를 「${x.이름} / ${형}」 로 주면 둘 다 붙는다`)
  }
  console.log(`   ── 합쳐서 ${넣을것.reduce((s, x) => s + x.줄수, 0)}줄`)
}
if (물어볼것.length) {
  console.log('\n❓ 우리 재료에 «그 이름»이 없다 — ⛔짐작으로 안 넣는다')
  for (const x of 물어볼것)
    console.log(`   「${x.이름}」 ${x.후보.length ? `→ 혹시 이것? ${x.후보.map((c) => `「${c}」`).join(' · ')}` : '— 비슷한 것도 없다 (레시피에 안 쓰는 재료거나 철자가 다르다)'}`)
}
if (버린것.length) {
  console.log('\n⛔ 안 받은 줄')
  for (const x of 버린것) console.log(`   ${x.줄.slice(0, 60)}\n      ↳ ${x.왜}`)
}

if (!진짜넣나) { console.log('\n👀 아직 «안» 넣었다 — 위가 맞으면 `--넣음` 을 붙여 다시 돌린다.\n'); process.exit(0) }
if (!넣을것.length) { console.log('\n넣을 것이 없다.\n'); process.exit(0) }

// ── 표에 쓴다 (⛔ 있는 줄을 건드리지 않고 «맨 뒤»에 더한다)
const 표시작 = il.indexOf('export const ING_LINKS = {')
const 표끝 = il.indexOf('\n}', 표시작)
if (표시작 < 0 || 표끝 < 0) { console.error('⛔ 표를 못 찾았다 — `ingLinks.js` 모양이 바뀌었다. 이 도구를 고칠 것.'); process.exit(1) }
// ⭐⭐ **일부러 묶은 것은 «표시»를 남긴다** — 안 그러면 게이트가 「짝 밀림」으로 오해한다.
//    📮 창업자 2026-09-12 = *"링크 같은거 몇개 있거든,"* (계란/달걀·대파/다진 파는 같은 게 맞다)
//    ⛔ 그렇다고 「같은 주소」 검사를 없애면 안 된다 — 2026-09-08 에 붙여넣다 한 칸 밀려
//       죽장연 된장과 건목이버섯이 뒤바뀐 그 사고를 잡는 그물이다.
//    ✅ 그래서 **「창업자가 «한 줄로» 준 것」만** 표시를 달고, 게이트는 그 표시를 보고 봐준다.
const 묶임 = new Map()
for (const x of 넣을것) if (x.묶음 && x.묶음.length > 1) 묶임.set(x.이름, x.묶음.join(' / '))
const 새줄 = 넣을것.map((x) => `  '${x.이름}': '${x.주소}',${묶임.has(x.이름) ? ` // ⛇묶음: ${묶임.get(x.이름)}` : ''}`).join('\n')
const 새판 = il.slice(0, 표끝) + '\n' + 새줄 + il.slice(표끝)
writeFileSync(join(뿌리, 'src/data/ingLinks.js'), 새판)
console.log(`\n✍️ 표에 ${넣을것.length}개 넣었다 — src/data/ingLinks.js`)
console.log('   👉 이제 `node scripts/check-inglinks.mjs` 로 확인하고, `_판-재료링크목록.mjs` 로 남은 것을 본다.\n')
