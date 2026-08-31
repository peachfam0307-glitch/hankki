// 🎨 「새 소식 팝업이 테마 셋에서 다 읽히나」 — 실물 캡처
//
// 📮 창업자 2026-08-31 = *"이대로 앱에도 넣으면 좋겠어 팝업으로 띄워서"*
// ⛔⛔ **인스타 안내판은 «한 테마»짜리다**(주황 배경에 주황 숫자). 앱은 테마가 셋이라
//    그 색을 그대로 박으면 다크에서 뜬다 → 그래서 토큰(`--gift`)만 쓴다.
//    ⭐ 그러면 «진짜로 읽히는지»를 눈으로 봐야 한다(규칙 21) — 이 판이 그걸 찍는다.
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-팝업테마-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { THEME_KEY } = await import('../src/theme.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 🔢 대비를 «화면에서 재서» 찍는다 — 색 이름만 보고 「괜찮겠지」 하지 않는다.
const 밝기 = (c) => { const [r, g, bl] = c.match(/\d+/g).map(Number).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl }
const 대비 = (a, c) => { const [x, y] = [밝기(a), 밝기(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

for (const theme of ['greige', 'apricot', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(([k, t]) => {
    try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem(k, t) } catch { /* 저장 못 해도 화면은 돈다 */ }
  }, [THEME_KEY, theme])
  await ctx.clock.setFixedTime(new Date('2026-09-01T03:00:00Z'))
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1400)

  const 잰것 = await p.evaluate(() => {
    const sheet = document.querySelector('.sheet-mask .sheet'); if (!sheet) return null
    const 숫자 = [...sheet.querySelectorAll('span')].find((s) => /^\d+종$/.test(s.innerText.replace(/\s/g, '')))
    const 알약 = [...sheet.querySelectorAll('span')].find((s) => s.innerText.trim() === '전부 무료')
    const 판 = 숫자?.closest('div[style*="overflow"]')
    const cs = (e) => e && getComputedStyle(e)
    return {
      테마: document.documentElement.getAttribute('data-theme'),
      숫자색: cs(숫자)?.color, 판배경: cs(판)?.backgroundColor,
      알약글자: cs(알약)?.color, 알약배경: cs(알약)?.backgroundColor,
      제목색: cs(sheet.querySelector('div[style*="font-size: 21px"]'))?.color,
    }
  })
  if (잰것) {
    // ⚠️ 판 배경이 gradient 면 backgroundColor 가 투명으로 나온다 → 그때는 시트 배경으로 잰다
    const 바탕 = 잰것.판배경 && !/rgba\(0, 0, 0, 0\)/.test(잰것.판배경) ? 잰것.판배경 : await p.evaluate(() => getComputedStyle(document.querySelector('.sheet-mask .sheet')).backgroundColor)
    console.log(`\n── ${theme} (data-theme=${잰것.테마}) ──`)
    console.log(`  숫자 ${잰것.숫자색} on ${바탕}  → 대비 ${대비(잰것.숫자색, 바탕).toFixed(2)} (큰 글자 3.0 이상)`)
    console.log(`  알약 ${잰것.알약글자} on ${잰것.알약배경} → 대비 ${대비(잰것.알약글자, 잰것.알약배경).toFixed(2)} (작은 글자 4.5 이상)`)
  }
  await p.locator('.sheet-mask .sheet').screenshot({ path: join(OUT, `팝업-${theme}.png`) }).catch(() => {})
  await ctx.close()
}
console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
