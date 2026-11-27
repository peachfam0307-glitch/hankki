// ❄️ 겨울 속지 7장 — 폰 화면 그대로 찍어 검수판 재료로 (2026-11-27 · _shot-속지6-0906.mjs 를 본떴다)
//   실행: SCRATCH=<폴더> [PROMO=1] SMOKE_CHROMIUM=… node scripts/_shot-겨울속지-1127.mjs
//   PROMO=1 = 사진칸에 겨울 스티커를 앉혀 «사진칸 자리»가 맞는지 눈으로 본다(사진은 지어내지 않는다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = process.env.SCRATCH + (process.env.PROMO ? '/겨울속지-홍보' : '/겨울속지'); mkdirSync(OUT, { recursive: true })
const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`
const { todayKST } = await import(new URL('../src/today.js', import.meta.url).pathname)
const { SEED_COACH_SEEN } = await import(new URL('../src/coach.js', import.meta.url).pathname)
const [Y, M, D] = todayKST().split('-').map(Number)
const 글 = '창밖에 눈이 와서 따끈한 걸 해 먹었다. 오늘도 잘했어.'
const 시안들 = [
  { 이름: '01-겨울창문', art: 'wwindow' },
  { 이름: '02-우표편지', art: 'wstamp', note2: '장 볼 것: 유부, 치즈, 김' },
  { 이름: '03-겨울뜨개', art: 'wknit' },
  { 이름: '04-스노우볼', art: 'wglobe' },
  { 이름: '05-오너먼트', art: 'wornament' },
  { 이름: '06-군고구마봉투', art: 'wgoguma' },
  { 이름: '07-붕어빵', art: 'wbungeo' },
]
// ⚠️ papers.js 는 webp 를 import 해서 node 로 못 연다 → 사진칸 값을 여기 옮겨 적었다(papers.js 와 같은 값 · 바뀌면 같이 고칠 것)
const 사진칸 = {
  wwindow: [{ top: 19, bottom: 26, left: 24, right: 24 }],
  wstamp: [{ top: 10, bottom: 56, left: 12, right: 51, rot: -5 }],
  wknit: [{ top: 20.5, bottom: 44, left: 19, right: 19 }],
  wglobe: [{ top: 20.5, bottom: 48.8, left: 29, right: 29.5 }],
  wornament: [{ top: 34.3, bottom: 47, left: 38, right: 37 }],
  wgoguma: [{ top: 23.5, bottom: 46, left: 25, right: 27 }],
  wbungeo: [{ top: 24, bottom: 51, left: 32, right: 30 }],
}
const 곰펭 = ['wg_02', 'xk_s01', 'wg_03', 'xk_n05_01', 'wg_04', 'xk_c02_02', 'xk_n012_02']
let 시안순 = 0
const 꾸밈 = (art) => {
  if (!process.env.PROMO) return []
  return (사진칸[art] || []).map((b, i) => { const w = (100 - b.left - b.right) / 100, h = (100 - b.top - b.bottom) / 100
    return { id: 'p' + i, type: 'sticker', key: 곰펭[(i + 시안순) % 곰펭.length], x: (b.left + (100 - b.right)) / 200, y: (b.top + (100 - b.bottom)) / 200, s: Math.max(0.2, Math.min(w, h) * 0.85), r: b.rot || 0 } })
}
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 시안 of 시안들) {
  const 담을것 = { recipes: [], diary: [{ id: 'shot-속지', kind: 'diary', at: Date.UTC(Y, M - 1, D, 3, 0, 0),
    paper: { rule: 'lined', skin: 'greige', art: 시안.art }, note: 글, title: '첫눈 오는 날',
    note2: 시안.note2, font: 'gaegu', size: 'md', decor: 꾸밈(시안.art) }] }
  시안순++
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.addInitScript((v) => { try { const 이미 = JSON.parse(localStorage.getItem('hankki:v1') || '{}'); localStorage.setItem('hankki:v1', JSON.stringify({ ...이미, ...v })) } catch {} }, 담을것)
  const p = await ctx.newPage(); p.setDefaultTimeout(15000)
  await p.goto(집 + '?크리스마스=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  for (const 글자 of ['나중에 볼게요', '확인', '닫기']) { const t = p.getByRole('button', { name: 글자 }).first(); if (await t.count()) { await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(400) } }
  const 탭 = p.locator('.tabbar button, nav button, [role="tab"]').filter({ hasText: /^일기$/ }).first()
  if (await 탭.count()) { await 탭.click(); await p.waitForTimeout(1200) }
  const 칸 = p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: new RegExp(`^${D}$`) }) }).first()
  if (await 칸.count()) { await 칸.click().catch(() => {}); await p.waitForTimeout(1800)
    await p.screenshot({ path: join(OUT, 시안.이름 + '.png') }); console.log('✅', 시안.이름)
  } else console.log('⛔', 시안.이름, '달력 칸 없음')
  await ctx.close()
}
await b.close(); srv.close(); console.log(OUT)
