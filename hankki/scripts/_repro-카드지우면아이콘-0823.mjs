// 🐛 재현 — 「레꾸자랑카드를 지우면 자동 음식 아이콘이 없어진다」 (창업자 제보 2026-08-23)
//   📮 창업자 = *"레꾸자랑카드 지우면 자동입력되는 음식아이콘 없어져.. 확인해봐"*
//   📮 그 앞 확정 = *"대신 자동등록된 음식아이콘은 «살아있어야해»."*
//
// ⭐ 재는 것 = 카드 표지에서 「배경 음식 아이콘 지우기」를 누른 «뒤» 표지에 무엇이 남나.
//   창업자 기대 = 🍚**자동 음식 아이콘**   /   지금 = ??
// ⛔ DOM 이 아니라 «표지 칸에 실제로 그려진 것»을 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4396)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage()
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await page.goto(url); await page.waitForTimeout(2000)

let 죽음 = 0
const 칸 = (ok, 말) => { if (!ok) 죽음++; console.log(`  ${ok ? '✅' : '⛔'} ${말}`) }

// ── 진짜로 카드를 표지에 올린다
await page.getByText('레꾸자랑', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card button').first().click(); await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click(); await page.waitForTimeout(2500)
await page.getByText('이 카드를 내 레시피 표지로').click()
let 주인 = null
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  주인 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image'))
    return r ? { id: r.id, title: r.title, icon: r.icon, thumb: r.thumb } : null
  })
  if (주인) break
}
console.log(`\n카드를 올렸다 — 「${주인.title}」 icon=${주인.icon} thumb=${주인.thumb}`)

// ── 레꾸 열고 「지우기」 누르고 저장
await page.goto(url); await page.waitForTimeout(1600)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 주인.title }).first().click(); await page.waitForTimeout(1400)
await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1600)
// ⚠️ 이름이 셋이다 — 카드일 땐 「표지 그림 지우기」다(2026-08-23 신설)
const 버튼 = page.getByText(/(배경 음식 아이콘|표지 그림) (지우기|되돌리기)/).first()
console.log(`  단추 = 「${(await 버튼.innerText()).trim()}」 → 누른다`)
await 버튼.click(); await page.waitForTimeout(700)
await page.getByText('저장', { exact: true }).first().click(); await page.waitForTimeout(2000)

// ── 표지에 «무엇이» 남았나 (그려진 것으로)
const 결과 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image'))
  const box = document.querySelector('.cover-box')
  const 그려진 = box ? [...box.querySelectorAll('img')].map((i) => {
    const src = i.currentSrc || i.src || ''
    const b = i.getBoundingClientRect()
    return { 무엇: src.startsWith('data:') ? '카드(저장한 그림)' : src.split('/').pop(), 크기: `${Math.round(b.width)}x${Math.round(b.height)}` }
  }) : null
  return { 저장값: { thumb: r.thumb, icon: r.icon, image있나: !!r.image, decor: (r.decor || []).length }, 표지에그려진것: 그려진 }
})
console.log(`\n  저장값        = ${JSON.stringify(결과.저장값)}`)
console.log(`  표지에 그려진 것 = ${JSON.stringify(결과.표지에그려진것)}`)

const 그림수 = (결과.표지에그려진것 || []).length
칸(!!결과.저장값.icon, `데이터의 icon 은 «남아 있다» (icon=${결과.저장값.icon})`)
칸(결과.저장값.thumb === 'icon', `⭐ 카드를 지우면 «자동 음식 아이콘»으로 간다 (thumb=${결과.저장값.thumb} · 옛 판은 'none' 이었다)`)
칸(그림수 > 0, `⭐ 표지에 자동 음식 아이콘이 «그려진다» (지금 ${그림수}장 — ${JSON.stringify((결과.표지에그려진것 || [])[0] || null)})`)
칸(결과.저장값.image있나, '카드 그림은 «안 지운다» — 세 번째 누르면 다시 온다')

// ── 세 상태가 «한 바퀴» 도나 (카드 → 아이콘 → 빈칸 → 카드)
console.log('\n세 상태 순환 — 잃는 게 없나')
await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1500)
const 돌기 = []
for (let i = 0; i < 3; i++) {
  const b = page.getByText(/(배경 음식 아이콘|표지 그림) (지우기|되돌리기)/).first()
  돌기.push((await b.innerText()).trim())
  await b.click(); await page.waitForTimeout(700)
  돌기.push('→ ' + await page.evaluate(() => {
    const st = document.querySelector('.decor-stage') || document.querySelector('[style*="aspect-ratio"]')
    if (!st) return '?'
    const im = [...st.querySelectorAll('img')]
    if (!im.length) return '⬜빈칸'
    return (im[0].currentSrc || im[0].src || '').startsWith('data:') ? '🎴카드' : '🍚아이콘'
  }))
}
console.log(`  ${돌기.join('  ')}`)
const 본것 = 돌기.filter((x) => x.startsWith('→')).join(' ')
칸(본것.includes('🍚아이콘') && 본것.includes('⬜빈칸') && 본것.includes('🎴카드'),
  '⭐ 세 번 누르면 🎴카드·🍚아이콘·⬜빈칸을 «전부» 만난다 (잃는 것 0)')

console.log(`\n${죽음 ? `⛔ ${죽음}칸 실패 — 창업자 제보가 재현됐다` : '✅ 전부 통과'}`)
await browser.close(); stop(); process.exit(죽음 ? 1 : 0)
