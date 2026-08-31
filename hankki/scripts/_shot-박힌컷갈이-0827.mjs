/**
 * 📸 레시피 목록을 찍는다 — 창업자가 본 그 자리(김치찌개 아래 제육볶음)를 눈으로 확인한다 (2026-08-27)
 *
 * 📮 창업자 = *"아직 레시피 김치찌개 아래있는 음식아이콘 안바뀌었어.."*
 * ⭐ 규칙 21 — 「고쳤다」고 말하기 «전»에 실물을 열어서 본다.
 */
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let body; let type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4437, r))

const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4437/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700)
await p.evaluate(() => { [...document.querySelectorAll('nav button, .tabbar button, footer button')].find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click() })
await p.waitForTimeout(900)

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
// ⭐ 「김치찌개」 카드로 굴려서 그 «아래»가 같이 보이게 찍는다 — 창업자가 본 자리다
const 찾음 = await p.evaluate(() => {
  const c = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /김치찌개/.test(e.textContent || ''))
  if (!c) return false
  c.scrollIntoView({ block: 'start' }); return true
})
await p.waitForTimeout(600)
await p.screenshot({ path: `${OUT}/레시피-김치찌개자리.png` })
console.log(찾음 ? '✅ 김치찌개 자리로 굴렸다' : '⚠️ 김치찌개를 못 찾아 맨 위를 찍었다')

// 화면에 실제로 그려진 그림 파일 이름 — 「고쳤다」의 근거는 이것이다
const 그림 = await p.evaluate(() => [...document.querySelectorAll('img')]
  .map((i) => ({ src: (i.currentSrc || i.src).split('/').pop().split('?')[0], alt: i.alt || '', ok: i.naturalWidth > 0 }))
  .filter((x) => /^(fe|fh|fy|fj|fi|fb|gr)_/.test(x.src)))
console.log(`🖼 화면에 그려진 음식 컷 ${그림.length}개 · 깨진 것 ${그림.filter((x) => !x.ok).length}개`)
for (const g of 그림.slice(0, 14)) console.log('   ', g.src.padEnd(24), g.alt)

await b.close(); srv.close()
