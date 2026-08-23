// ☑️ 검수판을 «열어서 눌러본다» — 어느 검수판이든 (2026-08-20)
//
// 📮 창업자 절대원칙 = *"복사되게(무조건 검수판은 체크+복사되게 만들어줘) **앞으로 모든 검수판에**"*
//
// ⛔⛔ 왜 도구로 만드나 = 2026-08-19 에 **세미콜론 하나로 체크가 통째로 안 눌렸다.**
//    창업자가 판을 열고서야 *"일단 검수판에체크가 안눌려"* 로 알려줬다.
//    판을 만들 때마다 검사를 새로 짜면 **언젠가 안 짠다.** 그래서 «하나»로 만든다.
//
// 쓰는 법
//   node scripts/_눌러보기-검수판.mjs <판.html>
//
// 보는 것 (판마다 다른 것은 없다 — 검수판이면 다 있어야 하는 것들이다)
//   ① 사진이 다 뜬다 (naturalWidth 0 이면 깨진 것)
//   ② 고르기가 눌린다 · 다시 누르면 풀린다
//   ③ 고른 셈이 오른다
//   ④ 새로고침해도 남는다 (localStorage)
//   ⑤ 복사가 «막힌» 폰에서 거짓말을 안 한다  → 「길게 눌러」
//   ⑥ 복사가 «되는» 폰에서 붙임판에 진짜로 들어간다
//   ⑦ 콘솔 오류 0
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const 판 = resolve(process.argv[2] || '')
if (!process.argv[2] || !existsSync(판)) {
  console.error('쓰는 법: node scripts/_눌러보기-검수판.mjs <판.html>')
  process.exit(2)
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') 오류.push('console: ' + m.text()) })
await p.goto('file://' + 판, { waitUntil: 'load' })
await p.waitForTimeout(600)

const 칸 = []
const 재기 = async (이름, fn) => {
  try { 칸.push([이름, (await fn()) ? '✅' : '⛔']) } catch (e) { 칸.push([이름, '⛔ ' + e.message]) }
}

const 그룹수 = (await p.$$('.opts')).length
console.log(`📋 ${판.split('/').pop()} · 물음 ${그룹수}개`)

await 재기('검수판 꼴을 갖췄다 (고르기 · 복사 · 셈)', async () =>
  그룹수 > 0 && !!(await p.$('#copy')) && !!(await p.$('#done')))

await 재기('사진이 다 뜬다', async () => {
  const r = await p.evaluate(() => {
    const im = [...document.querySelectorAll('img')]
    return { 총: im.length, 깨짐: im.filter((i) => !i.naturalWidth).length }
  })
  console.log(`   사진 ${r.총}장 · 깨짐 ${r.깨짐}`)
  return r.총 > 0 && r.깨짐 === 0
})

await 재기('물음마다 눌린다', async () => {
  for (let i = 0; i < 그룹수; i++) {
    await p.evaluate((k) => document.querySelectorAll('.opts')[k].querySelector('.opt').click(), i)
    await p.waitForTimeout(90)
    const on = await p.evaluate((k) => document.querySelectorAll('.opts')[k].querySelector('.opt').getAttribute('aria-pressed'), i)
    if (on !== 'true') return false
  }
  return true
})

await 재기('셈이 다 찬다', async () => (await p.textContent('#done')).includes(`${그룹수} / ${그룹수}`))

await 재기('다시 누르면 풀린다', async () => {
  await p.evaluate(() => document.querySelector('.opts').querySelector('.opt').click())
  await p.waitForTimeout(90)
  const off = await p.evaluate(() => document.querySelector('.opts').querySelector('.opt').getAttribute('aria-pressed')) === 'false'
  await p.evaluate(() => document.querySelector('.opts').querySelector('.opt').click())
  await p.waitForTimeout(90)
  return off
})

await 재기('새로고침해도 남는다', async () => {
  await p.reload({ waitUntil: 'load' })
  await p.waitForTimeout(500)
  return (await p.textContent('#done')).includes(`${그룹수} / ${그룹수}`)
})

await 재기('복사 버튼이 글을 만든다', async () => {
  await p.click('#copy')
  await p.waitForTimeout(300)
  const t = await p.textContent('#out')
  console.log('   ─ 복사된 글 ─\n' + t.split('\n').map((l) => '   ' + l).join('\n'))
  return t.length > 10 && !t.includes('(안 고름)')
})

await 재기('복사 뒤 글자가 골라진다', async () =>
  (await p.evaluate(() => String(window.getSelection()))).length > 10)

// ⭐⭐ 복사는 «두 폰»에서 본다 — 막힌 폰과 되는 폰
//    ⛔⛔ 처음엔 막힌 폰에서 「길게」가 있나만 봤는데 «못 잡았다» —
//       거짓말 문구 *"복사했어 (안 되면 아래 글자를 «길게» 눌러)"* 에도 「길게」가 들어 있다.
//       📌 규칙 18 ⓘ 그대로 — 「통과했나」가 아니라 «무엇을 보고 통과했나».
//    ✅ 그래서 **문구 내용이 아니라 「두 경우를 구분하나」**를 본다. 문구가 바뀌어도 안 낡는다.
const 막힌폰말 = await p.textContent('#done')
let 되는폰말 = ''
await 재기('복사가 되면 붙임판에 진짜로 들어간다', async () => {
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-write', 'clipboard-read'] })
  const q = await ctx2.newPage()
  await q.goto('file://' + 판, { waitUntil: 'load' })
  await q.waitForTimeout(500)
  await q.evaluate(() => document.querySelector('.opts').querySelector('.opt').click())
  await q.click('#copy')
  await q.waitForTimeout(400)
  되는폰말 = await q.textContent('#done')
  const 든것 = await q.evaluate(() => navigator.clipboard.readText())
  console.log('   붙임판 첫 줄 =', JSON.stringify(든것.split('\n')[0]))
  await ctx2.close()
  return 든것.length > 10
})
await 재기('복사가 막힌 폰에 «거짓말»을 안 한다', async () => {
  console.log(`   막힌 폰 → ${JSON.stringify(막힌폰말)}`)
  console.log(`   되는 폰 → ${JSON.stringify(되는폰말)}`)
  return 막힌폰말 !== 되는폰말 && 막힌폰말.length > 3
})

console.log('\n' + 칸.map(([n, r]) => `${r} ${n}`).join('\n'))
console.log(오류.length ? `\n⛔ 오류 ${오류.length}건\n` + 오류.join('\n') : '\n✅ 오류 0')
await b.close()
process.exit(칸.some(([, r]) => r.startsWith('⛔')) || 오류.length ? 1 : 0)
