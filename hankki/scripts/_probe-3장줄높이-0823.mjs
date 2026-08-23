// 📐 「전체 레시피 3장 보기」 줄 높이가 무너지는 자리 — 픽셀로 잰다 (2026-08-23)
//
// 📮 창업자 = *"전체레시피 3장보기하면 줄높이 무너짐수정추가"* (＋폰 캡처)
//    캡처에서 보이는 것 = 한 줄 안에서 **카드마다 그림 아랫변이 다르다**.
//    왼쪽 「초간단 샤브샤브」가 가운데 「들기름 막국수」보다 그림이 짧다.
//
// ⛔ 짐작 금지 — 눈으로 본 것을 원인으로 바꿔 읽지 않는다(규칙 18·25).
//    그래서 **카드·그림·이름표 세 상자를 다 재서** 어디서 어긋나는지 «숫자로» 고른다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-3장줄높이-0823.mjs
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
await new Promise((r) => srv.listen(4394, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:gridSize', 'small') } catch {} })
await page.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

await page.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await page.waitForTimeout(900)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

// 🧪🧪 **재현 조건 = 「안 끊기는 긴 이름」** — 이게 없으면 이 판은 «늘 초록불»이다.
//   ⛔ 처음엔 씨앗 데이터 그대로 쟀고 52칸이 전부 나란해서 「멀쩡하다」고 볼 뻔했다.
//      창업자 폰엔 「돼지고기김치두루치기」처럼 **띄어쓰기가 없는 열 글자**가 있다.
//   ⭐ 왜 그게 조건인가 = 2026-08-22 에 `word-break: keep-all` 을 **body 뿌리**에 걸었다.
//      한글은 원래 아무 데서나 끊기는데 `keep-all` 은 **띄어쓰기에서만** 끊는다
//      → 띄어쓰기 없는 낱말은 «통째»가 그 칸의 최소 너비가 된다
//      → `1fr`(＝`minmax(auto, 1fr)`)은 그 최소를 못 줄여서 **그 칸만 넓어지고 옆 칸이 눌린다.**
//   🔢 따로 재본 값 = 기본 [111,111,111] / keep-all + 1fr **[79,150,105]** / minmax(0,1fr) [111,111,111]
await page.evaluate(() => {
  const names = [...document.querySelectorAll('.grid3 .grid-card .name')]
  // 첫 줄 가운데 칸에 «띄어쓰기 없는 긴 이름»을 심는다 (앱에 실제로 있는 제목이다)
  if (names[1]) names[1].textContent = '돼지고기김치두루치기'
})
await page.waitForTimeout(400)

const 격자 = await page.evaluate(() => {
  const g = document.querySelector('.grid3')
  if (!g) return { 없다: true }
  const cs = getComputedStyle(g)
  // ⛔ 처음엔 앞 12칸만 쟀다 → **전부 초록불**이었다. 창업자 폰과 다른 건 «이름 길이»다 —
  //    「돼지고기김치두루치기」처럼 **안 끊기는 긴 낱말**이 목록 한참 아래에 있어 앞 12칸엔 없었다.
  //    📌 규칙 18 — 「없다」가 아니라 «내가 안 본 것»이었다. 그래서 «전부» 잰다.
  const cards = [...g.querySelectorAll('.grid-card')].map((c) => {
    const r = c.getBoundingClientRect()
    // 그림 칸 = 버튼 안 «첫 번째» div (Thumb 를 감싼 것). 이름표 = .name
    const thumb = c.querySelector('button > div > div') || c.querySelector('button > div')
    const name = c.querySelector('.name')
    const tr = thumb?.getBoundingClientRect()
    const nr = name?.getBoundingClientRect()
    return {
      제목: name?.textContent || '?',
      카드: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      그림: tr ? { y: Math.round(tr.y), w: Math.round(tr.width), h: Math.round(tr.height), 바닥: Math.round(tr.bottom) } : null,
      이름: nr ? { y: Math.round(nr.y), h: Math.round(nr.height), 줄수: Math.round(nr.height / parseFloat(getComputedStyle(name).lineHeight || 20)) } : null,
      그림비: tr ? +(tr.width / tr.height).toFixed(3) : null,
    }
  })
  return { gap: cs.gap, rowGap: cs.rowGap, alignItems: cs.alignItems, cards }
})

if (격자.없다) { console.log('⛔ .grid3 를 못 찾았다 — 3장 보기로 안 갔다'); await b.close(); srv.close(); process.exit(1) }

console.log(`\n📐 .grid3  gap=${격자.gap}  rowGap=${격자.rowGap}  alignItems=${격자.alignItems}\n`)
console.log(`   잰 칸 = ${격자.cards.length}개`)
console.log('   제목                 카드y  카드h │ 그림y 그림w×h  그림비  바닥 │ 이름y 줄수')
for (const c of 격자.cards.slice(0, 6)) {
  console.log(
    `   ${c.제목.slice(0, 16).padEnd(18)} ${String(c.카드.y).padStart(5)} ${String(c.카드.h).padStart(6)} │`
    + ` ${String(c.그림?.y).padStart(5)} ${String(c.그림?.w).padStart(3)}×${String(c.그림?.h).padEnd(4)}`
    + ` ${String(c.그림비).padStart(6)} ${String(c.그림?.바닥).padStart(5)} │`
    + ` ${String(c.이름?.y).padStart(5)} ${String(c.이름?.줄수).padStart(3)}`,
  )
}

// ⭐ 판정 = **한 줄 안에서** 어긋나나. 카드 y 가 같으면 같은 줄이다.
const 줄들 = new Map()
for (const c of 격자.cards) {
  const k = c.카드.y
  if (!줄들.has(k)) 줄들.set(k, [])
  줄들.get(k).push(c)
}
console.log('\n🔎 한 줄 안에서 어긋나나 (같은 줄 = 카드 y 가 같다)')
let 깨짐 = 0
for (const [y, 줄] of 줄들) {
  if (줄.length < 2) continue
  const 그림바닥 = 줄.map((c) => c.그림?.바닥)
  const 그림높이 = 줄.map((c) => c.그림?.h)
  const 이름y = 줄.map((c) => c.이름?.y)
  const 벌어짐 = Math.max(...그림바닥) - Math.min(...그림바닥)
  const 이름벌어짐 = Math.max(...이름y) - Math.min(...이름y)
  const 나쁨 = 벌어짐 > 1 || 이름벌어짐 > 1
  if (나쁨) 깨짐++
  console.log(`   ${나쁨 ? '⛔' : '✅'} y=${y}  그림높이 ${그림높이.join(' · ')}  → 바닥 벌어짐 ${벌어짐}px · 이름 벌어짐 ${이름벌어짐}px`)
}
console.log(`\n${깨짐 ? `⛔ 무너진 줄 ${깨짐}개` : '✅ 모든 줄이 나란하다'}\n`)

await b.close(); srv.close()
process.exit(깨짐 ? 1 : 0)
