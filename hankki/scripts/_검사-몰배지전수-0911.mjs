// 🏷🏷 **쇼핑몰 배지가 «하나도 안 빠지나» — 전수로 잰다** (2026-09-11)
// 📮 창업자 = *"뱃지 다 붙여줘. 컬리랑 다.전수해서"*
// ⛔ 2026-08-23 에 「하바티치즈는 왜 딱지없어?」로 한 번 겪었는데 **27개가 다시 빠져 있었다.**
//    그때 「표식이 빠져도 링크로」만 넣고 «링크가 빠지면 표식으로»를 안 넣어서다.
// ⭐ 그래서 눈이 아니라 **자로 잰다** — 앱을 띄워 갈래를 다 돌며 카드마다 배지를 읽는다.
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
await new Promise((r) => srv.listen(4431, r))

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul' })

// 🗓 «먼 미래»로 시계를 옮겨 **85개를 전부 연다** — 지금 열린 것만 재면 뒤에 숨은 게 안 잡힌다.
//    ⛔ 2026-08-23 사고가 그랬다: 그때 열린 것만 보고 「다 붙었다」 했다.
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  const 진짜 = Date
  const 옮김 = new 진짜('2028-01-01T10:00:00+09:00').getTime() - 진짜.now()
  window.Date = class extends 진짜 {
    constructor(...a) { if (a.length === 0) super(진짜.now() + 옮김); else super(...a) }
    static now() { return 진짜.now() + 옮김 }
  }
})
await p.goto('http://127.0.0.1:4431/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(1000)
// ⛔⛔ 「전체」 한 판만 읽으면 **22장밖에 안 잡힌다**(실측) — 갈래마다 접혀 있어 일부만 그려진다.
//    그 22장만 보고 「다 붙었다」 하면 2026-08-23 사고의 재판이다. **갈래를 하나씩 다 돌며 센다.**
const 칩들 = await p.evaluate(() => [...document.querySelectorAll('.cur-chips button, .cur-chips .pill')]
  .map((b) => b.textContent.trim()).filter((t) => t !== '이번 주 픽' && t !== '전체'))
console.log('🏷 갈래', 칩들.length, '칸을 돈다 —', 칩들.join(' · '))

const 본것 = new Map()
for (const 칩 of 칩들) {
  const 단추 = p.locator('.cur-chips').getByText(칩, { exact: true }).first()
  if (!(await 단추.count())) continue
  await 단추.click(); await p.waitForTimeout(600)
  // 📖 「더보기」를 펼쳐야 아래 카드까지 그려진다
  for (let i = 0; i < 30; i++) {
    const 더 = p.locator('text=더보기').first()
    if (!(await 더.count())) break
    try { await 더.click({ timeout: 700 }) } catch { break }
    await p.waitForTimeout(90)
  }
  // ⬇️ 끝까지 훑는다 — 화면 밖 카드는 DOM 에 없을 수 있다
  for (let i = 0; i < 12; i++) {
    await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollHeight > el.clientHeight + 50) el.scrollTop += 1200 })
    await p.waitForTimeout(180)
  }
  const 판 = await 읽기(p)
  판.forEach((x) => 본것.set(x.이름, x))
}
const 읽은것 = [...본것.values()]

function 읽기(p) { return p.evaluate(() => [...document.querySelectorAll('.cur-card')].map((c) => {
  const 이름 = c.querySelector('h3,b,strong')?.textContent?.trim() || c.innerText.split('\n')[0]
  // 🏷 배지 = 이름 밑에 붙는 작은 딱지들. 「쿠팡·컬리·자연드림·오아시스·네이버·산지톡·한살림」 중 하나여야 한다
  const 딱지 = [...c.querySelectorAll('span')].map((s) => s.textContent.trim())
  const 몰 = ['쿠팡', '컬리', '자연드림', '오아시스', '네이버', '산지톡', '공식몰'].find((m) => 딱지.includes(m))
    || (딱지.some((t) => t.includes('조합원 전용')) ? '한살림' : null)
  return { 이름, 몰 }
})) }

const 빠진것 = 읽은것.filter((x) => !x.몰)
console.log(`🔢 카드 ${읽은것.length}장을 읽었다`)
const 셈 = {}
읽은것.forEach((x) => { if (x.몰) 셈[x.몰] = (셈[x.몰] || 0) + 1 })
console.log('   ' + Object.entries(셈).map(([k, v]) => `${k} ${v}`).join(' · '))
if (빠진것.length) {
  console.log(`\n⛔ 배지가 «없는» 카드 ${빠진것.length}장`)
  빠진것.forEach((x) => console.log('   ', x.이름))
} else {
  console.log('\n✅ 배지가 빠진 카드가 하나도 없다')
}

await b.close(); srv.close()
process.exit(빠진것.length ? 1 : 0)
