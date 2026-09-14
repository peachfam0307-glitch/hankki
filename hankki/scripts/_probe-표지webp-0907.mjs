#!/usr/bin/env node
// 📏 자랑카드 표지 JPEG → WebP «실측» — 2026-09-07 (큰 틀 2 · 계획 §3-b ②)
//
// ⭐ 왜 = 계획엔 「표지도 WebP 면 1/8」이라 적혀 있는데, 그 1/8 은 **PNG→WebP** 실측이다.
//    표지는 이미 **JPEG(q0.86)** 이라 JPEG→WebP 는 그만큼 못 줄 수 있다. 짐작 말고 «진짜 카드»로 잰다.
// ⭐ 재는 길 = 폰에서 할 그대로 — `_repro-카드표지-0818` 처럼 실제로 카드를 만들어 표지로 저장한 뒤,
//    그 JPEG 을 캔버스에 다시 그려 `toDataURL('image/webp', q)` 로 굽는다(폰에서 돌 코드와 같은 길).
// ⛔ 사파리는 `image/webp` 를 못 구우면 «조용히 PNG» 를 준다 → 그래서 머리글자를 같이 찍는다.
//
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_probe-표지webp-0907.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 코치키들 = Object.values(COACH)
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4329)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: 코치키들 })
await page.goto(url)
await page.waitForTimeout(2200)

await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
if (!(await page.locator('.grid-card').count())) { console.log('⛔ 레꾸자랑 목록이 비었다'); await browser.close(); stop(); process.exit(1) }
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click()
await page.waitForTimeout(2500)
// ⚠️ 이 환경에선 「표지로 저장」(html-to-image) 판(0818)이 스모크 목록에도 없고 돌지도 않는다(실측 2026-09-07) →
//    같은 «그림»·같은 «인코더»(크롬 141)로 잰다: 화면의 카드를 그대로 찍어 1620×2025(pixelRatio 1.5 와 같은 크기)로 캔버스에 올린 뒤
//    JPEG q0.86(지금 저장 그대로) 과 WebP q 를 각각 굽는다. 캡처 방법만 다르고 «크기 비교»엔 같은 잣대다.
const 카드 = await page.evaluateHandle(() => {
  const 후보 = [...document.querySelectorAll('div')].filter((el) => {
    const r = el.getBoundingClientRect(); return r.width > 200 && r.height > 200 && Math.abs(r.width / r.height - 0.8) < 0.06
  })
  return 후보.sort((x, y) => y.getBoundingClientRect().width - x.getBoundingClientRect().width)[0] || null
})
if (!(await 카드.evaluate((el) => !!el))) { console.log('⛔ 카드(4:5) 요소를 못 찾았다'); await browser.close(); stop(); process.exit(1) }
const png = await 카드.asElement().screenshot({ type: 'png' })
const 잰것 = await page.evaluate(async (b64) => {
  try {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = 1620; c.height = 2025
    c.getContext('2d').drawImage(img, 0, 0, 1620, 2025)
    const bytes = (u) => Math.round((u.length - u.indexOf(',') - 1) * 3 / 4)
    const jpeg = c.toDataURL('image/jpeg', 0.86)
    const out = { 제목: '랜덤 카드', w: 1620, h: 2025, 'jpeg(저장된 그대로)': bytes(jpeg) }
    for (const q of [0.7, 0.75, 0.8, 0.85, 0.9]) {
      const u = c.toDataURL('image/webp', q)
      out['webp q' + q] = u.startsWith('data:image/webp') ? bytes(u) : '⛔PNG 로 떨어짐'
    }
    // 📌 「폰에서 할 일」 그대로 = 저장된 JPEG 을 «다시 풀어» WebP 로 (한 번 더 풀리는 값이 있나)
    const j = new Image(); j.src = jpeg; await j.decode()
    const c2 = document.createElement('canvas'); c2.width = 1620; c2.height = 2025
    c2.getContext('2d').drawImage(j, 0, 0)
    out['jpeg→webp q0.8 (폰 길)'] = bytes(c2.toDataURL('image/webp', 0.8))
    out._jpeg = jpeg; out._webp80 = c2.toDataURL('image/webp', 0.8); out._webp85 = c2.toDataURL('image/webp', 0.85)
    return out
  } catch (e) { return { 오류: String(e && e.stack || e) } }
}, png.toString('base64'))
if (!잰것 || 잰것.오류) { console.log('⛔ 못 쟀다', 잰것 && 잰것.오류); await browser.close(); stop(); process.exit(1) }
// 👀 눈으로 볼 실물(규칙 21) — OUT 에 셋을 남긴다
{ const fs = await import('node:fs'); const OUT = process.env.OUT || '/tmp'
  for (const [k, u] of [['jpeg086', 잰것._jpeg], ['webp80', 잰것._webp80], ['webp85', 잰것._webp85]]) fs.writeFileSync(OUT + '/표지-' + k + (k.startsWith('jpeg') ? '.jpg' : '.webp'), Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'))
  delete 잰것._jpeg; delete 잰것._webp80; delete 잰것._webp85 }
console.log('\n📏 자랑카드 표지 실측 (' + 잰것.w + '×' + 잰것.h + ' · 「' + 잰것.제목 + '」)')
for (const [k, v] of Object.entries(잰것)) if (typeof v === 'number' && k !== 'w' && k !== 'h') console.log(`   ${k.padEnd(20)} ${Math.round(v / 1024)} KB  (${Math.round(v / 잰것['jpeg(저장된 그대로)'] * 100)}%)`)
for (const [k, v] of Object.entries(잰것)) if (typeof v === 'string' && v.startsWith('⛔')) console.log(`   ${k} ${v}`)
await browser.close(); stop(); process.exit(0)
