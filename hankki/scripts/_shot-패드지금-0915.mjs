// 📱📱 [2026-09-15] **지금 앱의 «진짜» 패드 화면** — 아무것도 안 심고·안 주입하고 찍는다.
//
// 📮 창업자 = *"패드 화면 보자"* (Play 콘솔 폼 팩터 표를 보고)
//
// 🔢 왜 = **태블릿이 유저의 7~9%** 다 (2026-09-12 기준 9명/122명).
//    하루 활성 43명이면 패드 3명쯤이 매일 쓴다 → 한 달이면 연 90회.
//
// ⛔⛔ **기존 패드 판 18개는 지금 화면이 아니다** —
//    `_shot-패드안-0826.mjs:11` = *"고친 CSS 는 «주입»만 한다"* ＝ 그건 «시안»이지 지금 모습이 아니다.
//    나머지도 2026-08-26~09-04 판이라 그 뒤 바뀐 것이 안 들어 있다.
//
// ⛔ 이 판은 **찍고 재기만 한다.** 무엇을 고칠지는 창업자가 보고 고른다(규칙 11).
//
// 📌 8/26 에 실측으로 나왔던 것 — 고쳐졌는지 이 판으로 확인한다:
//    · 홈 카드가 «패드에서 더 작았다» (폰 40.5% ↔ 패드 세로 13.7%)
//    · 장보기 오른쪽 아래가 49.4% 비었다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4493, r))

const OUT = process.env.SHOT_OUT || '/tmp/패드지금'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 📐 재는 폭 — ⛔패드는 «가로»로도 쓴다. 세로만 찍으면 반을 놓친다.
const 크기들 = [
  { 이름: '폰', w: 390, h: 844 },              // 견줄 잣대
  { 이름: '패드세로', w: 834, h: 1194 },        // 11인치 세로
  { 이름: '패드가로', w: 1194, h: 834 },        // 11인치 가로
  { 이름: '큰패드가로', w: 1366, h: 1024 },     // 12.9인치 가로
]

// 🎯 찍을 화면 — «많이 쓰는 순서»로 고른다 (GA4 25일: home 68 · myrecipes 39 · detail 36 · import 27 · shop 13)
const 길 = [
  { 이름: '01-홈', 가기: async () => {} },
  { 이름: '02-레시피탭', 가기: async (p) => 눌러(p, '레시피') },
  { 이름: '03-레시피상세', 가기: async (p) => { await 눌러(p, '레시피'); await p.waitForTimeout(500); await 첫카드(p) } },
  { 이름: '04-장보기', 가기: async (p) => 눌러(p, '장보기') },
  { 이름: '05-가져오기', 가기: async (p) => { await 눌러(p, '레시피'); await p.waitForTimeout(400); await 눌러(p, '가져오기') } },
]

async function 눌러(p, 글) {
  const 것 = p.locator(`text=${글}`).first()
  try { if (await 것.count()) { await 것.click({ timeout: 3000 }); await p.waitForTimeout(700) } } catch { /* 없으면 넘어간다 */ }
}
async function 첫카드(p) {
  try { await p.locator('.mini-card, .recipe-card, [data-recipe]').first().click({ timeout: 3000 }); await p.waitForTimeout(800) } catch { /* noop */ }
}

// 📏 «숫자로» 남긴다 — 그림만 보면 「좀 커 보인다」로 끝난다
async function 재기(p, w) {
  return p.evaluate((폭) => {
    const 몸 = document.body
    const 카드 = document.querySelector('.mini-card')
    const 글수 = (document.body.innerText || '').split('\n').filter((l) => l.trim()).length
    const 빈오른쪽 = (() => {
      // 화면 오른쪽 절반에 «무엇이든» 그려져 있나 — 비면 패드에서 반이 논다
      const 것들 = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 20 && r.height > 20 && r.left > 폭 * 0.55 && r.top < window.innerHeight
      })
      return 것들.length
    })()
    return {
      가로넘침: Math.max(0, 몸.scrollWidth - 폭),
      카드폭: 카드 ? Math.round(카드.getBoundingClientRect().width) : null,
      카드비율: 카드 ? +(카드.getBoundingClientRect().width / 폭 * 100).toFixed(1) : null,
      글수,
      오른쪽것: 빈오른쪽,
    }
  }, w)
}

console.log('\n📱 지금 앱의 패드 화면 — 찍고 잰다\n')
const 표 = []

for (const { 이름: 크기이름, w, h } of 크기들) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'ko-KR' })
  for (const { 이름, 가기 } of 길) {
    const p = await ctx.newPage()
    await p.goto('http://127.0.0.1:4493/hankki/', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2200)          // 첫 화면이 다 그려질 때까지
    try { await 가기(p) } catch { /* 길이 막히면 거기까지 찍는다 */ }
    await p.waitForTimeout(900)
    const 잰값 = await 재기(p, w)
    await p.screenshot({ path: join(OUT, `${크기이름}-${이름}.jpg`), type: 'jpeg', quality: 72 })
    표.push({ 크기: 크기이름, 화면: 이름, ...잰값 })
    await p.close()
  }
  await ctx.close()
}
await b.close(); srv.close()

console.log('='.repeat(72))
console.log('  📋 잰 것 — ⛔가로넘침 0 이어야 한다 · 카드비율이 폰보다 «작으면» 패드에서 쪼그라든 것이다')
console.log('='.repeat(72))
for (const r of 표) {
  console.log(`[${r.크기.padEnd(5)}] ${r.화면.padEnd(14)} 넘침 ${String(r.가로넘침).padStart(3)}px · 카드 ${String(r.카드폭 ?? '-').padStart(4)}px(${r.카드비율 ?? '-'}%) · 글 ${String(r.글수).padStart(3)}줄 · 오른쪽 ${r.오른쪽것}개`)
}
console.log(`\n📂 캡처 = ${OUT}`)
