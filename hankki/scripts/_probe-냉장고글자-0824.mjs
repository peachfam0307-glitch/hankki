// 🧊🔍 「냉장고 글자가 작다」 — **어느 글자인지** 화면에서 재서 고른다 (2026-08-24) 〔판정 대기〕
//
// 📮 창업자(2026-08-23 아침 할 일) = 「냉장고 글자·줄간격」
// ⛔⛔ 그런데 **어느 글자인지 원문이 없다.** 로드맵엔 `PantryView.jsx:281` 한 줄만 적혀 있는데
//    그건 «영수증 안내문» 하나다. 창업자가 그 한 줄만 말했는지 화면 전체를 말했는지 모른다.
//    📌 규칙 25 = 「어디의 무엇인지」를 «묻고» 시작한다. 이 판은 **묻기 «전»에 재는 것**이다.
//
// ⭐ 재는 방법 = 냉장고 탭과 장보기 탭의 «화면에 그려진» 글자를 전부 긁어 크기별로 센다.
//    ⛔ 소스 grep 이 아니다 — 인라인 스타일이 CSS 를 덮는 자리가 많다(절대원칙 18 ⓘ · 30).
//
// ＋ 겸사겸사 「레꾸자랑에도 말풍선」(로드맵 4순위 7번)이 «이미 있는지»도 화면으로 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-냉장고글자-0824.mjs
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
await new Promise((r) => srv.listen(4413, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const 탭가기 = async (첫글자) => {
  await page.evaluate((s) => {
    const t = [...document.querySelectorAll('button, a')]
      .find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith(s))
    t?.click()
  }, 첫글자)
  await page.waitForTimeout(1100)
}

// 📏 «화면에 그려진» 글자만 — 보이고, 글자가 있고, 자기 글자를 직접 든 요소
const 재기 = () => page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('body *')) {
    const 직접 = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!직접) continue
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > 3000) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue
    const t = (el.innerText || '').replace(/\s+/g, ' ').trim()
    if (!t) continue
    out.push({ 글: t.slice(0, 34), px: Math.round(parseFloat(cs.fontSize) * 10) / 10, 줄: cs.lineHeight })
  }
  return out
})

const 요약 = (rows, 이름) => {
  const 작은 = rows.filter((r) => r.px < 16).sort((a, b) => a.px - b.px)
  const nums = rows.map((r) => r.px).sort((a, b) => a - b)
  const 중앙 = nums.length ? nums[Math.floor(nums.length / 2)] : 0
  console.log(`\n🔎 ${이름} — 글자 든 칸 ${rows.length}개 · 중앙값 ${중앙}px · 16px 미만 ${작은.length}개`)
  for (const r of 작은.slice(0, 12)) console.log(`   ${String(r.px).padStart(5)}px  줄 ${r.줄.padEnd(7)}  ${r.글}`)
  return { 개수: rows.length, 중앙, 작은: 작은.length }
}

await 탭가기('장보기')
const 장보기 = 요약(await 재기(), '🛒 장보기 (비교 대상)')

// 🧊 냉장고 = 장보기 안의 세그먼트
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /냉장고/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(1100)
const 냉장고 = 요약(await 재기(), '🧊 냉장고')
await page.screenshot({ path: '/tmp/냉장고글자-0824.png', fullPage: true })

// 💬 레꾸자랑에 말풍선이 «이미» 있나 (로드맵 4순위 7번)
await 탭가기('레꾸자랑')
const 자랑 = await page.evaluate(() => {
  const el = document.querySelector('.tab-talk-b')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const 꼬리 = document.querySelector('.tab-talk-t')
  return { 글: (el.innerText || '').trim(), 위: Math.round(r.top), 꼬리: !!꼬리 }
})
await page.screenshot({ path: '/tmp/레꾸자랑말풍선-0824.png' })

console.log('\n💬 레꾸자랑 말풍선 =', 자랑 ? `✅ 있다 — 「${자랑.글}」 (위 ${자랑.위}px · 꼬리 ${자랑.꼬리 ? '있음' : '없음'})` : '⛔ 없다')
console.log('\n📊 견주면')
console.log(`   장보기  중앙 ${장보기.중앙}px · 16px 미만 ${장보기.작은}개`)
console.log(`   냉장고  중앙 ${냉장고.중앙}px · 16px 미만 ${냉장고.작은}개`)
console.log('\n📷 /tmp/냉장고글자-0824.png · /tmp/레꾸자랑말풍선-0824.png')
await b.close(); srv.close()
