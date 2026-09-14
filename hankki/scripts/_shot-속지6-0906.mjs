// 📔 새 속지 6장 — 폰 화면 그대로 찍어 검수판 재료로
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = process.env.SCRATCH + (process.env.PROMO ? '/속지6-홍보' : '/속지6'); mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`
const { todayKST } = await import('/home/user/hankki/hankki/src/today.js')
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const [Y, M, D] = todayKST().split('-').map(Number)
const 글 = '선선해져서 국물이 자꾸 생각나는 날. 들깨탕 끓였다.'
const 시안들 = [
  { 이름: '01-폴라로이드스크랩', art: 'pinkscrap', skin: 'ivory', rule: 'lined' },
  { 이름: '02-가을사진메모', art: 'auphoto', skin: 'ivory', rule: 'lined' },
  { 이름: '03-가을스크랩', art: 'auscrap', skin: 'ivory', rule: 'lined', note2: '장 볼 것: 들깨, 무, 대파' },
  { 이름: '04-가을두칸', art: 'autwo', skin: 'ivory', rule: 'lined', note2: '저녁은 남은 국에 밥 말아서.' },
  { 이름: '05-가을기록3칸', art: 'authree', skin: 'ivory', rule: 'lined', note2: '점심 — 김밥', note3: '저녁 — 들깨탕' },
  { 이름: '06-핑크레이스', art: 'pinklace', skin: 'ivory', rule: 'lined', line: '뜨끈한 게 최고' },
]
// 📣 PROMO=1 — 홍보용: 사진칸에 «가을 곰펭 스티커»를 앉혀 「사진 넣기」 안내를 덮는다(0904 판 전례 · 유저도 실제로 그렇게 쓴다 · 사진은 지어내지 않는다)
//    자리 = papers.js 의 사진칸 좌표에서 «계산»(짐작 아님). 검수판(PROMO 없음)은 빈 칸 그대로.
//    ⚠️ papers.js 는 webp 를 import 해서 node 로 못 연다 → 사진칸 값을 여기 옮겨 적었다(papers.js 와 같은 값 · 바뀌면 같이 고칠 것)
const 사진칸 = {
  pinkscrap: [{ top: 16.2, bottom: 57.4, left: 9.8, right: 54.6, rot: -6.9 }, { top: 27.9, bottom: 47.7, left: 57.6, right: 9.7, rot: 6.2 }],
  auphoto: [{ top: 10.3, bottom: 38, left: 11.2, right: 11.3 }],
  auscrap: [{ top: 8, bottom: 48, left: 14.7, right: 43.3, rot: -4.6 }, { top: 24.9, bottom: 54.7, left: 64.3, right: 10.1, rot: 7.6 }],
  autwo: [], pinklace: [],
  authree: [{ top: 12.3, bottom: 65.4, left: 5, right: 66 }, { top: 41.8, bottom: 35.7, left: 66, right: 4.9 }, { top: 70.6, bottom: 7.3, left: 5, right: 66 }],
}
const 곰펭 = ['au_b09', 'au_b27', 'au_b28', 'au_b24', 'au_b16', 'au_b20']
const 잎 = ['au_i24', 'au_i38', 'au_i42', 'au_i28']
const 꾸밈 = (art) => {
  if (!process.env.PROMO) return []
  const boxes = 사진칸[art] || []
  const out = boxes.map((b, i) => { const w = (100 - b.left - b.right) / 100, h = (100 - b.top - b.bottom) / 100
    return { id: 'p' + i, type: 'sticker', key: 곰펭[(i + 시안순) % 곰펭.length], x: (b.left + (100 - b.right)) / 200, y: (b.top + (100 - b.bottom)) / 200, s: Math.max(0.26, Math.min(w, h) * 0.8), r: b.rot || 0 } })
  out.push({ id: 'l1', type: 'sticker', key: 잎[시안순 % 잎.length], x: 0.9, y: 0.06, s: 0.09, r: -12 })
  return out
}
let 시안순 = 0
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 시안 of 시안들) {
  시안순++
  const 담을것 = { recipes: [], diary: [{ id: 'shot-속지', kind: 'diary', at: Date.UTC(Y, M - 1, D, 3, 0, 0),
    paper: { rule: 시안.rule, skin: 시안.skin, art: 시안.art }, note: 글, title: '가을 첫 들깨탕',
    note2: 시안.note2, note3: 시안.note3, line: 시안.line, font: 'gaegu', size: 'md', decor: 꾸밈(시안.art) }] }
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.addInitScript((v) => { try { const 이미 = JSON.parse(localStorage.getItem('hankki:v1') || '{}'); localStorage.setItem('hankki:v1', JSON.stringify({ ...이미, ...v })) } catch {} }, 담을것)
  const p = await ctx.newPage(); p.setDefaultTimeout(15000)
  await p.goto(집, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
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
