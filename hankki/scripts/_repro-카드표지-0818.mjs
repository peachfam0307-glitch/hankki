// 🐛 재현 — 「레꾸자랑 카드를 표지로 바꾸면 동그랗게 잘린다」 (창업자 제보 2026-08-18)
//   📮 창업자 원문 = *"레꾸자랑카드를 표지로바꾼거 이렇게돼"* →
//      *"아니 원래 자랑카드전체가 표지여야하는데 동그랗게됐다고"*
//
// ⭐ 재는 것 = **자랑카드가 표지 칸을 얼마나 채우나**. 「전체가 표지」면 100% 여야 한다.
//   · 카드 원본 = 1080×1350 (4:5 세로 · ShareDrawCard.jsx `shell`)
//   · 표지 칸  = 1:1 정사각 (RecipeDetailScreen `ratio="1/1"`)
//
// 🔎 왜 이렇게 됐나 = 2026-08-17 커밋 `5d1a5bb` 「표지 사진을 아이콘처럼 동그랗게」.
//   그 전엔 `objectFit: cover` 로 **네모를 꽉 채웠다**(= 창업자가 말한 「원래」).
//   지금은 `iconSize`(56%) 원 안에 들어가서 ⑴작아지고 ⑵동그랗게 잘리고 ⑶좌우까지 잘린다.
//   ⛔ 8/17 결정(*"사진을 이모지랑 똑같이 동그랗게"*)은 **내 사진**을 두고 한 말이다 —
//      자랑카드는 «사진»이 아니라 **이미 완성된 표지 한 장**이라 잘리면 안 된다.
//
// ⚠️ 이 판은 **진짜로 카드를 만들어 저장한다**(흉내가 아니다 · 규칙 30).
//    레꾸자랑 → 카드 → 「이 카드를 내 레시피 표지로」 를 실제로 누른다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
// 🧭 안내코치가 클릭을 가로챈다(규칙 18 · 「0편」의 진짜 이유가 이것이었던 적이 있다).
//    ⛔ 키를 이름으로 적지 않는다 — `COACH` 에서 «읽어» 심어야 키를 올려도 안 낡는다(src/coach.js 주석).
const { COACH } = await import('../src/coach.js')
const 코치키들 = Object.values(COACH)
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4327)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))   // 안내코치 전부 「본 적 있다」로
}, { s: state, keys: 코치키들 })
await page.goto(url)
await page.waitForTimeout(2200)

// ── 레꾸자랑 탭 → 첫 레시피 → 랜덤 카드 ──
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
const cards = await page.locator('.grid-card').count()
if (!cards) { console.log('⛔ 레꾸자랑 목록이 비었다'); await browser.close(); stop(); process.exit(1) }

const 제목 = await page.locator('.grid-card').first().innerText().catch(() => '')
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/카드표지-1-카드.png` })

// ── 「이 카드를 내 레시피 표지로」 ──
const 표지버튼 = page.getByText('이 카드를 내 레시피 표지로')
if (!(await 표지버튼.count())) { console.log('⛔ 「이 카드를 내 레시피 표지로」 버튼이 없다'); await browser.close(); stop(); process.exit(1) }
await 표지버튼.click()

// 저장될 때까지 기다린다 — 저장되면 모달이 닫힌다
let saved = false
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  const 이미지 = await page.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image/jpeg'))
      return r ? { id: r.id, title: r.title, thumb: r.thumb, kb: Math.round(r.image.length / 1024) } : null
    } catch { return null }
  })
  if (이미지) { saved = true; console.log(`\n💾 표지로 저장됐다 — 「${이미지.title}」 · thumb=${이미지.thumb} · ${이미지.kb}KB`); break }
}
if (!saved) { console.log('⛔ 표지 저장이 안 끝났다'); await browser.close(); stop(); process.exit(1) }
await page.waitForTimeout(900)

// ── 그 레시피 상세로 들어가 표지를 잰다 ──
await page.getByText('레시피', { exact: true }).last().click()   // ⚠️ 하단바 라벨은 「레시피」다(「내 레시피」 아님)
await page.waitForTimeout(1200)
// 저장된 그 레시피 카드를 찾아 연다
const 열림 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image/jpeg'))
  return r ? r.title : null
})
await page.locator('.grid-card').filter({ hasText: 열림 }).first().click()
await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/카드표지-2-상세.png` })

const 잰값 = await page.evaluate(() => {
  const box = document.querySelector('.cover-box')
  if (!box) return { err: '표지 상자(.cover-box)를 못 찾았다' }
  const img = box.querySelector('img')
  if (!img) return { err: '표지 안에 <img> 가 없다' }
  const b = box.getBoundingClientRect()
  const i = img.getBoundingClientRect()
  const 감싼것 = img.parentElement
  const cs = getComputedStyle(감싼것)
  const ics = getComputedStyle(img)
  const w = 감싼것.getBoundingClientRect()
  return {
    표지: { w: Math.round(b.width), h: Math.round(b.height) },
    감싼상자: { w: Math.round(w.width), h: Math.round(w.height), radius: cs.borderRadius, overflow: cs.overflow },
    img: { w: Math.round(i.width), h: Math.round(i.height), fit: ics.objectFit, pos: ics.objectPosition },
    원본: { w: img.naturalWidth, h: img.naturalHeight, 비율: +(img.naturalWidth / img.naturalHeight).toFixed(3) },
  }
})
if (잰값.err) { console.log(`⛔ ${잰값.err}`); await browser.close(); stop(); process.exit(1) }

// ── 계산 ──
const 표지넓이 = 잰값.표지.w * 잰값.표지.h
const r = 잰값.감싼상자
const 동그란가 = /(%|9999px)/.test(r.radius) || parseFloat(r.radius) >= r.w / 2 - 1
// 보이는 넓이 = 감싼 상자 넓이 (동그라미면 π/4 만큼만)
const 보이는넓이 = 동그란가 ? Math.PI / 4 * r.w * r.h : r.w * r.h
const 채움 = +(보이는넓이 / 표지넓이 * 100).toFixed(1)

// 카드 원본 중 얼마나 살아남았나
//   ⭐ `contain` 이면 한 군데도 안 자른다(＝100%) · `cover` 는 넘치는 쪽을 자른다
const 칸비 = r.w / r.h
const 원비 = 잰값.원본.비율
const 잘린뒤보이는원본 = 잰값.img.fit === 'contain' ? 1 : (원비 > 칸비 ? 칸비 / 원비 : 원비 / 칸비)
const 원본생존 = +((동그란가 ? Math.PI / 4 : 1) * 잘린뒤보이는원본 * 100).toFixed(1)

console.log(`\n📐 잰 값 — 「${열림}」 상세 표지`)
console.log(`   표지 칸      ${잰값.표지.w}×${잰값.표지.h}`)
console.log(`   그림 담은 칸 ${r.w}×${r.h} · radius ${r.radius} · ${동그란가 ? '⭕ 동그라미' : '⬜ 네모'}`)
console.log(`   그림         ${잰값.img.w}×${잰값.img.h} · object-fit ${잰값.img.fit}`)
console.log(`   원본         ${잰값.원본.w}×${잰값.원본.h} (가로/세로 ${잰값.원본.비율})`)
console.log(`\n🔢 표지 칸을 채우는 넓이   ${채움}%`)
console.log(`🔢 카드 원본이 살아남은 넓이 ${원본생존}%`)

const 통과 = 채움 >= 99 && 원본생존 >= 99 && !동그란가
console.log(`\n${통과 ? '✅' : '⛔'} 「자랑카드 전체가 표지」 — ${통과 ? '맞다' : '아니다 (잘리거나 작아졌다)'}`)
if (errs.length) console.log(`⚠️ pageerror ${errs.length}건: ${errs.slice(0, 2).join(' / ')}`)
console.log(`\n🖼 스샷 = ${OUT}/카드표지-{1-카드,2-상세}.png`)

await browser.close()
stop()
process.exit(통과 ? 0 : 1)
