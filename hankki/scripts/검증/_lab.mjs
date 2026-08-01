// 한끼연구소 재현 — 설정에서 열리는지, 주소 없는 칸은 안 나오는지, 유니코드 이모지 0인지 확인
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4208/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4208', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:profile', 'hankki:coach:detail']
    .forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
})
const errs = []
const p = await ctx.newPage()
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)))
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 140)) })
// 폼은 바깥으로 나가는 링크 — 새 탭이 열리는지만 보고 실제로는 안 띄운다
const opened = []
ctx.on('page', async (np) => { opened.push(np.url()); await np.close().catch(() => {}) })

await p.goto(BASE, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1900)

console.log('── ① 설정에 한끼연구소 줄이 있나 ──')
await p.getByRole('button', { name: '설정' }).first().click()
await p.waitForTimeout(800)
const txt1 = await p.evaluate(() => document.body.innerText)
console.log(`  '한끼연구소' 줄  = ${txt1.includes('한끼연구소')}`)
console.log(`  옛 '의견 보내기' = ${txt1.includes('의견 보내기')}  (false 여야 맞다)`)

console.log('\n── ② 눌러서 시트가 열리나 ──')
await p.getByRole('button', { name: /한끼연구소/ }).first().click()
await p.waitForTimeout(700)
const s = await p.evaluate(() => {
  const t = document.body.innerText
  const sheet = document.querySelector('.sheet-mask')
  const imgs = sheet ? [...sheet.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc.split('/').pop(), w: i.naturalWidth, h: i.naturalHeight,
    dw: Math.round(i.getBoundingClientRect().width), dh: Math.round(i.getBoundingClientRect().height),
  })) : []
  return {
    open: !!sheet,
    head: t.includes('한끼연구소'),
    peng: imgs,
    rowIdea: t.includes('의견 남기기'),
    rowSurvey: t.includes('다음엔 뭘 먼저 만들까요'),
    rowBug: t.includes('안 되는 것 알려주기'),
    fixedHead: t.includes('이렇게 고쳐가고 있어요'),
    fixedN: (t.match(/에요\n|어요\n/g) || []).length,
    // ⛔ UI 유니코드 이모지 금지 — 우리 커스텀 스티커만 쓴다
    emoji: (t.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu) || []),
    body: t.slice(0, 620),
  }
})
console.log(`  시트 열림 = ${s.open} · 제목 = ${s.head}`)
console.log(`  펭펭 컷 =`, s.peng)
console.log(`  ① 설문 칸 = ${s.rowSurvey}  ② 의견 칸 = ${s.rowIdea}  ③ 오류 칸 = ${s.rowBug}`)
console.log(`  '이렇게 고쳐가고 있어요' = ${s.fixedHead}`)
console.log(`  유니코드 이모지 = ${s.emoji.length}개`, s.emoji.slice(0, 6))
console.log('  ── 화면 글자 ──\n' + s.body.split('\n').map((l) => '    ' + l).join('\n'))

await p.screenshot({ path: '/tmp/lab.png' })

console.log('\n── ③ 의견 칸 누르면 폼으로 나가나 ──')
await p.getByRole('button', { name: /의견 남기기/ }).click()
await p.waitForTimeout(900)
console.log(`  새 탭 = ${opened.length}개`, opened.map((u) => u.slice(0, 46)))
console.log(`  누른 뒤 시트 닫힘 = ${await p.evaluate(() => !document.querySelector('.sheet-mask'))}`)

console.log('\n── ④ 뒤로가기로 닫히나 ──')
await p.getByRole('button', { name: /한끼연구소/ }).first().click(); await p.waitForTimeout(600)
await p.goBack().catch(() => {}); await p.waitForTimeout(600)
console.log(`  뒤로가기 후 닫힘 = ${await p.evaluate(() => !document.querySelector('.sheet-mask'))}`)

console.log(`\npageerror/console = ${errs.length}`, errs.slice(0, 3))
await b.close(); srv.kill()
