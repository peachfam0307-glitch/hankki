// 📒 「최근 AI 다듬기 5번」 칸을 눈으로 본다 — 2026-09-10 (⭐절대원칙 21)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { COACH } from '../src/coach.js'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-다듬기기록-0910'; mkdirSync(OUT, { recursive: true })
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (!p || p === '/') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4497, r))
const URL0 = 'http://127.0.0.1:4497/hankki/'
const 기록 = [
  { 때: Date.now() - 60000, ok: true, model: 'gemini-2.5', ms: 38400 },
  { 때: Date.now() - 300000, ok: false, why: '안옴', model: '', ms: 120300 },
  { 때: Date.now() - 900000, ok: true, model: 'gemini-2.5', ms: 21900 },
]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 찍기(이름, 창업자냐) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript((ks) => ks.forEach((k) => localStorage.setItem(k, '1')), Object.values(COACH))
  await ctx.addInitScript(([로그, 운영자]) => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:tidylog', 로그)
    if (운영자) localStorage.setItem('hankki:founder', '시험')
  }, [JSON.stringify(기록), 창업자냐])
  const p = await ctx.newPage()
  await p.goto(URL0, { waitUntil: 'load' }); await p.waitForTimeout(2500)
  // ⭐ 입구 = 홈 오른쪽 위 «프로필 아이콘»(HomeScreen.jsx:375) — 아래 탭이 아니다
  await p.getByRole('button', { name: '프로필' }).first().click()
  await p.waitForTimeout(1200)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await p.waitForTimeout(600)
  const 화면 = await p.evaluate(() => document.body.innerText.replace(/\n/g, ' | ').slice(0, 160))
  console.log('   화면=', 화면)
  const 보이나 = await p.evaluate(() => /최근 AI 다듬기 5번/.test(document.body.innerText))
  await p.screenshot({ path: join(OUT, 이름 + '.png'), fullPage: false })
  console.log(`📸 ${이름} — 기록 칸 보이나 = ${보이나}`)
  await ctx.close()
  return 보이나
}

const 창업자 = await 찍기('1-창업자폰', true)
const 유저 = await 찍기('2-유저폰', false)
await b.close(); srv.close()
console.log(`\n${창업자 && !유저 ? '✅' : '❌'} 창업자에게만 보인다 (창업자 ${창업자} · 유저 ${유저})`)
console.log('📂', OUT)
if (!(창업자 && !유저)) process.exit(1)
