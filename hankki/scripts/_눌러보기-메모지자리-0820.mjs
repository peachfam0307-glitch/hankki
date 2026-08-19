// 판을 «열어서 눌러본다» — 2026-08-19 에 세미콜론 하나로 체크가 통째로 안 눌렸다
import { chromium } from 'playwright'
const 판 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/메모지자리.html'
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') 오류.push('console: ' + m.text()) })
await p.goto('file://' + 판, { waitUntil: 'load' })
await p.waitForTimeout(500)

const 칸 = []
const 재기 = async (이름, fn) => { try { 칸.push([이름, await fn() ? '✅' : '⛔']) } catch (e) { 칸.push([이름, '⛔ ' + e.message]) } }

await 재기('사진이 다 뜬다', async () => {
  const r = await p.evaluate(() => {
    const im = [...document.querySelectorAll('.shot img')]
    return { 총: im.length, 깨짐: im.filter((i) => !i.naturalWidth).length }
  })
  console.log('   사진', r.총, '장 · 깨짐', r.깨짐)
  return r.총 === 9 && r.깨짐 === 0
})
await 재기('물음이 셋', async () => (await p.$$('.opts')).length === 3)
await 재기('고르기가 눌린다', async () => {
  await p.click('.opts[data-q="자리"] .opt:nth-child(2)')
  await p.waitForTimeout(120)
  return await p.getAttribute('.opts[data-q="자리"] .opt:nth-child(2)', 'aria-pressed') === 'true'
})
await 재기('셈이 오른다', async () => (await p.textContent('#done')).includes('1 / 3'))
await 재기('셋 다 고를 수 있다', async () => {
  await p.click('.opts[data-q="종이"] .opt:nth-child(2)')
  await p.click('.opts[data-q="꼬르곰"] .opt:nth-child(2)')
  await p.waitForTimeout(150)
  return (await p.textContent('#done')).includes('3 / 3')
})
await 재기('다시 누르면 풀린다', async () => {
  await p.click('.opts[data-q="꼬르곰"] .opt:nth-child(2)')
  await p.waitForTimeout(120)
  const off = await p.getAttribute('.opts[data-q="꼬르곰"] .opt:nth-child(2)', 'aria-pressed') === 'false'
  await p.click('.opts[data-q="꼬르곰"] .opt:nth-child(2)')
  return off
})
await 재기('새로고침해도 남는다', async () => {
  await p.reload({ waitUntil: 'load' })
  await p.waitForTimeout(400)
  return (await p.textContent('#done')).includes('3 / 3')
})
await 재기('복사 버튼이 돈다', async () => {
  await p.click('#copy')
  await p.waitForTimeout(250)
  const t = await p.textContent('#out')
  console.log('   ─ 복사된 글 ─\n' + t.split('\n').map((l) => '   ' + l).join('\n'))
  return t.includes('어디에 띄울까') && t.includes('종이') && t.includes('꼬르곰') && !t.includes('(안 고름)')
})
await 재기('복사 뒤 글자가 골라진다', async () => (await p.evaluate(() => String(window.getSelection()))).length > 10)
// ⭐ 복사가 «막힌» 폰에서 거짓말을 안 하는지 — 여기 크로미움은 권한이 없어 실제로 막힌다
await 재기('복사가 막히면 「길게 눌러」라고 한다', async () => (await p.textContent('#done')).includes('길게'))
// ⭐ 복사가 «되는» 폰에서는 됐다고 하는지
await 재기('복사가 되면 「복사했어」라고 한다', async () => {
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-write', 'clipboard-read'] })
  const q = await ctx2.newPage()
  await q.goto('file://' + 판, { waitUntil: 'load' })
  await q.waitForTimeout(400)
  await q.click('.opts[data-q="자리"] .opt:nth-child(1)')
  await q.click('#copy')
  await q.waitForTimeout(400)
  const 말 = await q.textContent('#done')
  const 판에든것 = await q.evaluate(() => navigator.clipboard.readText())
  console.log('   붙임판에 실제로 든 글 =', JSON.stringify(판에든것.split('\n')[0]))
  await ctx2.close()
  return 말.includes('복사했어') && 판에든것.includes('어디에 띄울까')
})

console.log('\n' + 칸.map(([n, r]) => `${r} ${n}`).join('\n'))
console.log(오류.length ? '\n⛔ 오류 ' + 오류.length + '건\n' + 오류.join('\n') : '\n✅ 오류 0')
await b.close()
process.exit(칸.some(([, r]) => r.startsWith('⛔')) || 오류.length ? 1 : 0)
