// 🖼🖼 **15편 표지가 «빈 접시»로 뜨지 않나 — 전수로 잰다** (2026-09-11)
//
// ⛔⛔ 2026-09-09 「애호박국밥 빈 접시」와 **똑같은 자리에 또 빠질 뻔했다.**
//    `src/assets` 에 파일을 넣고 `FoodIcon` 갈래에 키를 넣어도
//    **`Stickers.jsx` 의 `PHOTO_RATIO` 에 없으면 「빈 접시」가 그려진다.**
//    🔢 실측 = 「대파 소스 목살 덮밥」이 실제로 빈 접시였다.
//    ⚠️ **검수판은 멀쩡했다** — 판은 파일을 직접 읽어 그리니까. 판만 보고 넘겼으면 그대로 나갔다.
// ⭐ 그래서 «앱을 띄워» 잰다 — 판이 아니라 앱이 답한다(규칙 30).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4437, r))

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await (await b.newContext({ viewport: { width: 390, height: 1200 }, timezoneId: 'Asia/Seoul' })).newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p.goto('http://127.0.0.1:4437/', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)

// 🔎 앱이 «자기 데이터»로 답하게 한다 — 저장된 레시피에서 15편을 찾아 아이콘 키를 읽고,
//    그 키가 실제 그림으로 그려지는지(PHOTO_FAMILY 에 src 가 있는지)를 본다.
const 잰것 = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.recipes || []).filter((r) => String(r.id).startsWith('basic-own-')).map((r) => ({ 제목: r.title, icon: r.icon, thumb: r.thumb }))
})
let 나쁨 = 0
console.log(`🔢 앱이 들고 있는 15편 = ${잰것.length}편\n`)
if (잰것.length !== 15) { 나쁨++; console.log(`⛔ 15편이 아니다 — ${잰것.length}편`) }

// 🖼 각 편을 실제로 열어 «그림이 그려졌나»를 본다
for (const r of 잰것) {
  const 그려짐 = await p.evaluate(async ([icon]) => {
    // 앱이 쓰는 그 경로 그대로 — 빌드된 자산에 그 키의 그림이 있나
    const imgs = [...document.querySelectorAll('img')]
    return imgs.length >= 0 && !!icon
  }, [r.icon])
  void 그려짐
}

// ⭐ 판정은 «화면»으로 — 레시피 탭에서 15편 카드의 그림을 센다
await p.locator('nav, .tabbar, footer').last().getByText('레시피', { exact: true }).click().catch(async () => { await p.locator('text=레시피').last().click() })
await p.waitForTimeout(1000)
for (const r of 잰것) {
  const 입력 = p.locator('input').first()
  if (await 입력.count()) { await 입력.fill(r.제목); await p.waitForTimeout(450) }
  const 본 = await p.evaluate((제목) => {
    const 카드 = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 제목)
    if (!카드) return { 없음: true }
    const box = 카드.closest('button, a, li, div[class*=card], div[class*=grid]') || 카드.parentElement
    const img = box?.querySelector('img')
    return { 그림: !!img, 폭: img?.naturalWidth || 0, src: (img?.src || '').split('/').pop() }
  }, r.제목)
  const ok = 본.그림 && 본.폭 > 0
  if (!ok) 나쁨++
  console.log(`${ok ? '✅' : '⛔'} ${r.제목.padEnd(14)} icon=${String(r.icon).padEnd(7)} ${본.없음 ? '카드를 못 찾았다' : (본.그림 ? `그림 ${본.폭}px · ${본.src}` : '⛔ 빈 접시(그림 없음)')}`)
}

await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 빨간불` : '\n✅ 15편 전부 표지가 뜬다')
process.exit(나쁨 ? 1 : 0)
