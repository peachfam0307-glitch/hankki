// 📏 소진 카드 문구가 «몇 줄»로 그려지나 — 낱말 하나가 혼자 넘어가는 것을 잡는다 (2026-08-24)
//
// ⛔ 2026-08-24 「무료 5개」→「무료열쇠 5개」로 늘리자 **「채워져요」가 혼자 셋째 줄**로 밀렸다.
//    제목도 「…레시피열쇠를 **다 / 썼어요**」로 갈렸다. 눈으로 보고 알았다(절대원칙 21).
// ⭐ 그래서 «줄 수»를 실제로 잰다 — `innerText` 로는 절대 안 보인다(줄바꿈을 안 알려준다).
//    ✅ Range 로 그려진 줄 상자(client rects) 개수를 센다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-소진카드폭-0824.mjs
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
await new Promise((r) => srv.listen(4423, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const 잰값 = []

// ⛔ 좁은 폰(320)도 본다 — 여기서 깨지면 실제 유저가 겪는다
for (const 폭 of [320, 360, 390, 412]) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 0, month: 0 }))
    } catch { /* noop */ }
  })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
    t?.click()
  })
  await page.waitForTimeout(1300)

  const 값 = await page.evaluate(() => {
    // ⭐ 「줄 수」는 Range 로만 정확히 나온다 — 요소 높이 ÷ 줄높이는 반올림에서 틀린다
    const 줄수 = (el) => {
      if (!el) return null
      const r = document.createRange(); r.selectNodeContents(el)
      const 상자 = [...r.getClientRects()].filter((x) => x.height > 4 && x.width > 1)
      const y = [...new Set(상자.map((x) => Math.round(x.top)))]
      return y.length
    }
    const 찾기 = (re) => [...document.querySelectorAll('div, span, b')]
      .find((x) => re.test(x.innerText || '') && ![...x.children].some((c) => re.test(c.innerText || '')))
    const 제목 = 찾기(/다 썼어요/)
    const 안내 = 찾기(/채워져요/)
    // 마지막 줄에 «몇 글자»가 남나 — 낱말 하나만 덩그러니면 그게 문제다
    const 끝줄글자 = (el) => {
      if (!el) return null
      const t = (el.innerText || '').replace(/\n/g, ' ')
      const r = document.createRange(); r.selectNodeContents(el)
      const 상자 = [...r.getClientRects()].filter((x) => x.height > 4 && x.width > 1)
      if (!상자.length) return null
      const 끝 = Math.max(...상자.map((x) => Math.round(x.top)))
      const 폭합 = 상자.filter((x) => Math.round(x.top) === 끝).reduce((a, x) => a + x.width, 0)
      return { 마지막줄폭: Math.round(폭합), 전체: t.length }
    }
    return {
      제목줄: 줄수(제목), 제목글: (제목?.innerText || '').replace(/\s+/g, ' ').trim(),
      안내줄: 줄수(안내), 안내글: (안내?.innerText || '').replace(/\s+/g, ' ').trim(),
      안내끝: 끝줄글자(안내),
      칸폭: Math.round(안내?.getBoundingClientRect().width || 0),
    }
  })
  잰값.push({ 폭, 칸폭: 값.칸폭, 제목줄: 값.제목줄, 안내줄: 값.안내줄, 끝줄폭: 값.안내끝?.마지막줄폭 ?? 0 })
  if (폭 === 390) console.log(`  제목 = 「${값.제목글}」\n  안내 = 「${값.안내글}」`)
  await ctx.close()
}
console.table(잰값)
// ⛔ 마지막 줄이 아주 짧으면 낱말 하나가 혼자 넘어간 것이다
const 나쁨 = 잰값.filter((v) => v.끝줄폭 > 0 && v.끝줄폭 < 90)
console.log(나쁨.length ? `⛔ 낱말 하나가 혼자 넘어간 폭 ${나쁨.length}개 — ${나쁨.map((v) => v.폭).join(',')}` : '✅ 마지막 줄에 낱말이 혼자 남는 폭 없음')
await b.close(); srv.close()
