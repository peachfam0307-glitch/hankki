// 🔁 재현판 — 원본 교체한 편이 «이미 깔린 폰»에서도 새 글로 바뀌나 (규칙 18ⓙ · 2026-11-22)
//   진미채 = 제목까지 바뀐다(간장진미채볶음 → 진미채볶음) · 야끼우동 = 재료·출처가 바뀐다
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
const 옛 = [
  { id: 'basic-jinmichae-bokkeum', title: '간장진미채볶음', source: 'hankki', icon: 'n3050', sourceName: '윤반찬', ingredients: ['진미채 200g'], steps: ['볶아요.'] },
  { id: 'basic-yaki-udon', title: '야끼우동', source: 'hankki', icon: 'fe_400', sourceName: '@Ohtodaymenu', ingredients: ['우동면 2개'], steps: ['볶아요.'] },
]
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 412, height: 915 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((상태) => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); if (!sessionStorage.getItem('심음')) { localStorage.setItem('hankki:v1', 상태); sessionStorage.setItem('심음', '1') } } catch { /* noop */ } },
  JSON.stringify({ recipes: 옛, seedV: 190, removedSeedIds: [] }))
const page = await ctx.newPage()
await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500)
const 저장 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))
const 찾 = (id) => (저장.recipes || []).find((r) => r.id === id) || {}
const 진 = 찾('basic-jinmichae-bokkeum'), 우 = 찾('basic-yaki-udon')
console.log('\n🔁 원본 교체 — 이미 깔린 폰\n')
칸(진.title === '진미채볶음', '진미채 제목이 바뀐다', 진.title)
칸((진.ingredients || [])[0] === '오징어채 200g', '진미채 재료가 새 원문', (진.ingredients || [])[0])
칸(진.sourceName === '백종원 PAIK JONG WON', '진미채 출처가 새 영상', 진.sourceName)
칸(진.icon === 'n3049', '진미채 그림이 고추장 컷(n3049)으로', 진.icon)
칸((우.ingredients || []).includes('우동면 1개 (200g)'), '야끼우동 재료가 새 원문', (우.ingredients || []).slice(0, 2).join(' · '))
칸(우.sourceName === '백종원 PAIK JONG WON', '야끼우동 출처가 새 영상', 우.sourceName)
await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패` : '\n✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
