// 🗓🎨 달력 칸에 «레꾸 표지»를 얹으면 어떻게 보이나 — 지금 ↔ 시안 ⓐ 나란히 (2026-08-24) 〔판정 대기〕
//
// 📮 창업자 = *"레꾸이미지 달력반영은 된거야?"*
//    → 실측 답 = **안 된다.** `DecorEditor.onSave` 는 `decor`·`decorBg` 만 저장하고 `image` 를 안 만든다.
//      달력 칸은 `top.photo` 한 장만 그리므로 레꾸가 붙을 자리가 없다.
//
// ⭐ 시안 ⓐ = 달력 칸에서도 `Thumb` 을 쓴다(스티커·배경을 얹어 그린다).
//    · 새로 저장할 게 **0** — 이미 꾸민 사람도 그대로 반영된다
//    · ⚠️ 걱정 = **24px 칸에서 뭉갤 수 있다.** 그래서 찍어서 보고 정한다(절대원칙 21).
//
// ⛔ 시안 스위치(`window.__CAL_DECOR`)는 **기본이 꺼짐**이라 지금 앱은 하나도 안 바뀐다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-달력레꾸-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4417, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()

async function 찍기(켬, 파일) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  if (켬) await ctx.addInitScript(() => { window.__CAL_DECOR = true })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4417/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 🎨 «꾸민 레시피»로 이번 달 일기를 만든다 — 콩국수 샘플이 스티커 7개로 꾸며져 있다
  const 심음 = await page.evaluate(() => {
    const K = 'hankki:v1'
    const s = JSON.parse(localStorage.getItem(K) || '{}')
    if (!s.recipes) return null
    const 꾸민 = s.recipes.find((r) => (r.decor || []).length > 0) || s.recipes[0]
    const 민 = s.recipes.find((r) => !(r.decor || []).length) || s.recipes[1]
    const 오늘 = new Date()
    const 날 = (d) => new Date(오늘.getFullYear(), 오늘.getMonth(), d, 12).getTime()
    s.diary = [
      { id: 'demo1', recipeId: 꾸민.id, title: 꾸민.title, at: 날(5), rating: 0, note: '', photo: null },
      { id: 'demo2', recipeId: 민.id, title: 민.title, at: 날(12), rating: 0, note: '', photo: null },
      { id: 'demo3', recipeId: 꾸민.id, title: 꾸민.title, at: 날(19), rating: 0, note: '', photo: null },
      ...(s.diary || []).filter((d) => new Date(d.at).getMonth() !== 오늘.getMonth()),
    ]
    localStorage.setItem(K, JSON.stringify(s))
    return { 꾸민: 꾸민.title, 스티커: (꾸민.decor || []).length, 배경: 꾸민.decorBg || 'none', 민: 민.title }
  })

  await page.goto('http://127.0.0.1:4417/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  // 일기 탭 → 「한끼 일기」(달력)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim() === '일기')
    t?.click()
  })
  await page.waitForTimeout(1300)
  // ⛔ `.cal-grid` 는 «둘»이다 — 첫째는 요일 머리줄(`.cal-week`), 둘째가 날짜 격자다.
  //    (2026-08-24 실측 — 첫 판에서 요일 줄만 찍혀 아무것도 못 봤다 · 절대원칙 21)
  const 칸들 = await page.$$('.cal-grid:not(.cal-week)')
  const 칸 = 칸들[칸들.length - 1]
  if (칸) await 칸.screenshot({ path: `/tmp/달력레꾸-${파일}.png` })
  await ctx.close()
  return 심음
}

const 정보 = await 찍기(false, '지금')
await 찍기(true, '시안')
console.log('🎨 꾸민 레시피 =', 정보?.꾸민, `(스티커 ${정보?.스티커}개 · 배경 ${정보?.배경})`)
console.log('⬜ 안 꾸민 것 =', 정보?.민)
console.log('📷 /tmp/달력레꾸-지금.png · /tmp/달력레꾸-시안.png')
await b.close(); srv.close()
