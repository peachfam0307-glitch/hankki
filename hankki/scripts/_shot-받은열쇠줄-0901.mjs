// 📸 [2026-09-01] 「받은 열쇠에 줄이 그어졌나」를 «눈으로» 본다
// ⛔ 재현판이 아니라 «보는» 판이다(절대원칙 21) — 숫자만 보고 「된다」고 말하지 않는다.
//
// 📮 창업자 = *"받은건 줄이 그어지면 좋겠어"* · *"5개 다 받으면 창이 사라지면 제일 좋고"*
//    ＋ *"확실히 되는거 맞지? 내가 테스트 못해도?"* → 그래서 내가 대신 눈으로 본다.
//
// ⭐ 서버 답을 가로채 «받은 목록»을 심는다 — 실제 워커가 주는 것과 «같은 모양»이다.
//    (`{ ok: true, left: { …, earned: [...] } }` · ocr-proxy/worker.js 의 조회 길)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4479, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const OUT = process.env.SHOT_OUT || '/tmp'

const 경우 = [
  ['0개', []],
  ['3개', ['레꾸', '일기', '냉장고']],
  ['5개', ['레꾸', '자랑', '일기', '요리', '냉장고']],
]

for (const [이름, 받은] of 경우) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  // 🕸 워커의 «조회» 답을 흉내낸다 — 모양은 worker.js 가 실제로 내보내는 그대로
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        left: {
          welcome: 10 + 받은.length, month: 5, cap: 10 + 받은.length, bonus: 받은.length,
          earned: 받은, anon: 10, acct: 30, monthly: 5, signed: false,
        },
      }),
    })
  })
  await p.goto('http://127.0.0.1:4479/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(1400)   // 조회 답이 오고 다시 그려질 틈
  await p.screenshot({ path: `${OUT}/열쇠줄-${이름}.png`, fullPage: true })
  const m = await p.evaluate(() => {
    const 카드 = document.querySelector('.earn-list')
    if (!카드) return { 카드: '없다' }
    const li = [...카드.querySelectorAll('li')]
    return {
      카드: '있다',
      줄그은것: li.filter((e) => getComputedStyle(e).textDecorationLine.includes('line-through')).map((e) => e.innerText.trim()),
      안그은것: li.filter((e) => !getComputedStyle(e).textDecorationLine.includes('line-through')).map((e) => e.innerText.trim()),
      꼬리: 카드.querySelector('.earn-foot')?.innerText,
      알약: document.querySelector('.imp-key')?.innerText.replace(/\n/g, ' '),
    }
  })
  console.log(`\n[${이름}]`, JSON.stringify(m, null, 1))
}
await b.close(); srv.close()
