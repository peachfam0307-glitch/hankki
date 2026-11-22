// ➖ 재현판 — 「내린 편」이 «이미 깔린 폰»에서 정말 빠지나 (규칙 18ⓙ · 창업자 2026-11-22 「무단은 내리자」)
//   ① 안 건드린 깍두기 → 빠져야 한다
//   ② 꽂은(favorite) 깍두기 → 유저 것이라 남아야 한다
//   ③ 다른 기본 편(옛 seedV) → 그대로 남아야 한다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const BASE = `http://127.0.0.1:${srv.address().port}/`

let 나쁨 = 0
const 칸 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ` — ${덧}` : ''}`) }
const 깍 = { id: 'basic-eonam-15min-kkakdugi', title: '어남선생 15분 깍두기', source: 'hankki', ingredients: ['무 1개'], steps: ['섞어요.'] }
const 남 = { id: 'basic-aehobak-gukbap', title: '애호박 국밥', source: 'hankki', ingredients: ['애호박 2개'], steps: ['끓여요.'] }

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
async function 폰(깍두기) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((상태) => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); if (!sessionStorage.getItem('심음')) { localStorage.setItem('hankki:v1', 상태); sessionStorage.setItem('심음', '1') } } catch { /* noop */ } },
    JSON.stringify({ recipes: [깍두기, 남], seedV: 190, removedSeedIds: [] }))
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500)
  const 저장 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))
  await ctx.close()
  return (저장.recipes || []).map((r) => r.id)
}
console.log('\n➖ 내린 편 — 이미 깔린 폰\n')
const a = await 폰({ ...깍 })
칸(!a.includes(깍.id), '① 안 건드린 깍두기는 빠진다')
칸(a.includes(남.id), '③ 다른 편은 그대로', `${a.length}편`)
const c = await 폰({ ...깍, favorite: true })
칸(c.includes(깍.id), '② 꽂아 둔 깍두기는 유저 것이라 남는다')
await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패` : '\n✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
