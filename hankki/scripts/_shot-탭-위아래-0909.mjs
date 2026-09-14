// 🗂 레시피·일기·장보기(냉장고)·레꾸자랑 «맨 위»와 «맨 아래»를 찍는다 — 캐릭터 놓아보는 판의 배경.
// 📮 창업자 2026-09-09 = "레시피, 일기, 냉장고 레꾸자랑에도 애들 넣어야 하니까 홈에는 이정도만 붙였어"
// ⛔ 앱 소스는 한 줄도 안 고친다. 홈 배경 찍던 _shot-홈-위아래-0909.mjs 를 그대로 따른다.
// ⚠️ 탭이 «비어 있으면» 붙일 자리를 못 정한다 → 화면마다 「글자 몇 개인가」를 같이 찍어 콘솔에 남긴다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) }
  catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)

// 안내 시트가 떠 있으면 닫는다 (홈 배경 찍을 때와 같은 절차)
async function 시트닫기() {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(500); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  }
}
// ⛔ document 가 안 굴러간다 — 앱은 «안쪽 통»이 구른다 (홈에서 실측한 것과 같다).
const 굴리기 = (끝까지) => p.evaluate((끝) => {
  const 통 = [...document.querySelectorAll('*')].map((e) => [e, e.scrollHeight - e.clientHeight])
    .filter(([e, d]) => d > 40 && e.clientHeight > 200).sort((a, b) => b[1] - a[1])[0]
  if (!통) return 0
  통[0].scrollTop = 끝 ? 통[0].scrollHeight : 0
  return 통[1]
}, 끝까지)

const 탭 = [
  { 이름: '레시피', 찾기: '레시피' },
  { 이름: '일기', 찾기: '일기' },
  { 이름: '장보기', 찾기: '장보기' },
  { 이름: '레꾸자랑', 찾기: '레꾸자랑' },
  // 🧊 냉장고는 «탭»이 아니라 장보기 탭 «안»에서 갈린다 (App.jsx:1293 = "장보기 ↔ 냉장고는 한 화면 안에서 갈린다")
  { 이름: '냉장고', 찾기: '장보기', 안에서: '냉장고' },
]
for (const t of 탭) {
  await p.evaluate((이름) => {
    const b = [...document.querySelectorAll('button, [role="button"], a')]
      .find((x) => (x.innerText || '').trim() === 이름)
    b?.click()
  }, t.찾기)
  await p.waitForTimeout(1600)
  if (t.안에서) {
    await p.evaluate((이름) => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .find((x) => (x.innerText || '').trim() === 이름)
      b?.click()
    }, t.안에서)
    await p.waitForTimeout(1200)
  }
  await 시트닫기()
  const 굴림 = await 굴리기(false)
  await p.waitForTimeout(600)
  await p.screenshot({ path: `/tmp/tab_${t.이름}_위.png` })
  await 굴리기(true)
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `/tmp/tab_${t.이름}_아래.png` })
  const 글자수 = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, '').length)
  console.log(t.이름, '굴릴수있는높이', 굴림, 'px · 글자', 글자수)
}
await b.close(); srv.close()
