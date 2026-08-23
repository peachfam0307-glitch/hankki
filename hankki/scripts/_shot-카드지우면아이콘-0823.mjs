// 📸 눈으로 검수 — 「카드를 지우면 자동 음식 아이콘」 세 상태를 찍는다 (창업자 2026-08-23 *"눈으로 재현하고 검수해봐"*)
//   ⭐ 숫자 재현판(`_repro-카드지우면아이콘-0823`)이 초록불이어도 «보이는 것»은 따로 봐야 한다(절대원칙 21).
//   찍는 것 = 레꾸 판(단추 이름 ＋ 표지) 네 컷 ＋ 저장 뒤 상세 표지 한 컷.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/shot-0823'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4397)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage()
const url = 'http://127.0.0.1:' + PORT + '/'
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await page.goto(url); await page.waitForTimeout(2000)

// ⛔ 찍기 «전»에 화면 한가운데를 덮은 게 없나 본다(절대원칙 21의 장치)
const 덮였나 = async (이름) => {
  const t = await page.evaluate(() => {
    const e = document.elementFromPoint(195, 300)
    const c = e && e.closest('.coach-mask, .sheet-mask, .onboard')
    return c ? (c.className || 'unknown') : null
  })
  if (t) console.log('  ⚠️ ' + 이름 + ' — 화면이 «' + t + '» 로 덮여 있다')
}

// ── 카드를 표지로 올린다
await page.getByText('레꾸자랑', { exact: true }).last().click(); await page.waitForTimeout(1200)
// ⚠️ 어느 레시피로 재느냐가 «배경»을 가른다 — 콩국수는 창업자가 직접 꾸민 «샘플»이라
//    배경지 sea(여름 물결) ＋ 스티커 7개가 basics.js 에 박혀 있다(전 레시피 중 유일).
//    RECIPE 를 주면 그 편으로, 안 주면 첫 칸으로 잰다.
const 고를것 = process.env.RECIPE
  ? page.locator('.grid-card').filter({ hasText: process.env.RECIPE }).first().locator('button').first()
  : page.locator('.grid-card button').first()
await 고를것.click(); await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click(); await page.waitForTimeout(2500)
await page.getByText('이 카드를 내 레시피 표지로').click()
let 주인 = null
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  주인 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image'))
    return r ? { id: r.id, title: r.title, icon: r.icon } : null
  })
  if (주인) break
}
console.log('카드를 올렸다 — 「' + 주인.title + '」 icon=' + 주인.icon)

// ── 레꾸 판을 연다
await page.goto(url); await page.waitForTimeout(1600)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 주인.title }).first().click(); await page.waitForTimeout(1400)
await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1800)

const 판찍기 = async (n, 딱지) => {
  await 덮였나(딱지)
  const b = page.getByText(/(배경 음식 아이콘|표지 그림) (지우기|되돌리기)/).first()
  const 이름 = (await b.innerText()).trim()
  const 무엇 = await page.evaluate(() => {
    const st = document.querySelector('.decor-stage') || document.querySelector('[style*="aspect-ratio"]')
    if (!st) return '?'
    const im = [...st.querySelectorAll('img')]
    if (!im.length) return '⬜빈칸'
    return (im[0].currentSrc || im[0].src || '').startsWith('data:') ? '🎴카드' : '🍚아이콘(' + (im[0].currentSrc || im[0].src).split('/').pop() + ')'
  })
  const f = OUT + '/' + n + '-' + 딱지 + '.png'
  await page.screenshot({ path: f })
  console.log('  ' + n + ' ' + 딱지.padEnd(6) + ' 표지=' + 무엇.padEnd(28) + ' 단추=「' + 이름 + '」')
  return b
}

console.log('\n레꾸 판 — 세 번 누르며 찍는다')
let b = await 판찍기('1', '카드')
await b.click(); await page.waitForTimeout(800)
b = await 판찍기('2', '아이콘')
await b.click(); await page.waitForTimeout(800)
b = await 판찍기('3', '빈칸')
await b.click(); await page.waitForTimeout(800)
await 판찍기('4', '카드로')

// ── ②(아이콘)로 되돌려 «저장»하고 상세 표지를 찍는다 — 창업자 제보 그 자리
await b.click(); await page.waitForTimeout(800)  // 카드 → 아이콘
await page.getByText('저장', { exact: true }).first().click(); await page.waitForTimeout(2200)
await 덮였나('상세')
await page.screenshot({ path: OUT + '/5-저장뒤-상세.png' })
const 끝 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image'))
  const box = document.querySelector('.cover-box')
  return { 저장값: { thumb: r.thumb, icon: r.icon, image있나: !!r.image, decor: (r.decor || []).length },
    표지그림: box ? [...box.querySelectorAll('img')].map((i) => (i.currentSrc || i.src || '').split('/').pop()) : null }
})
console.log('\n  5 저장뒤 상세 = ' + JSON.stringify(끝))
console.log('\n📁 ' + OUT)
await browser.close(); stop()
