// ☁️📸 클라우드 저장 시트를 «진짜 앱에서» 열어 찍는다 — 2026-08-21
//   ⛔ 손으로 그린 그림이 아니다. 빌드한 앱을 띄워서 설정 → 클라우드 저장을 실제로 누른다(절대원칙 30).
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4602, r))

const 색 = process.argv[2] === 'dark' ? 'dark' : 'light'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 색 })
const pg = await ctx.newPage()
const errs = []
pg.on('pageerror', (e) => errs.push(String(e)))
pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })

// 🌐 파이어베이스로 나가는 길을 «막는다» — 이 환경은 gstatic·googleapis 를 못 연다.
//   ⭐ 그래서 「로그인 안 한 화면」을 재는 것이다. 로그인한 화면은 창업자 폰에서 본다.
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())

await pg.goto('http://localhost:4602/hankki/', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(1500)
// 소개(온보딩)가 뜨면 지나간다
for (const 말 of ['시작하기', '바로 시작', '건너뛰기', '다음']) {
  const 단추 = pg.getByRole('button', { name: 말 })
  for (let i = 0; i < 4; i++) {
    if (await 단추.count() && await 단추.first().isVisible()) { await 단추.first().click(); await pg.waitForTimeout(400) } else break
  }
}
// ⛔ 「건너뛰기」가 화면을 덮고 있으면 설정 단추가 «있어도» 안 눌린다(2026-08-21 실측).
//   📌 그때 화면이 「화면을 그리다 멈췄어요」로 나와서 «앱이 깨진 줄» 알았다 — 규칙 18.
const 스킵 = pg.getByRole('button', { name: '건너뛰기' })
for (let i = 0; i < 6; i++) {
  if (await 스킵.count() && await 스킵.first().isVisible()) { await 스킵.first().click(); await pg.waitForTimeout(500) } else break
}
await pg.waitForTimeout(400)
// 설정 탭 — 아이콘 단추라 이름이 아니라 aria-label 로 집는다
await pg.locator('button[aria-label="설정"]').first().click()
await pg.waitForTimeout(900)
// 코치마크가 뜨면 닫는다
for (let i = 0; i < 6; i++) {
  const 확 = pg.getByRole('button', { name: /알겠어요|다음|넘어가기|그만보기|닫기/ })
  if (await 확.count() && await 확.first().isVisible()) { await 확.first().click(); await pg.waitForTimeout(350) } else break
}
await pg.screenshot({ path: `/tmp/설정-${색}.png`, fullPage: true })

// ☁️ 클라우드 저장 카드
await pg.getByText('클라우드 저장', { exact: true }).first().click()
await pg.waitForTimeout(1200)
await pg.screenshot({ path: `/tmp/클라우드시트-${색}.png` })

const 글 = await pg.textContent('.sheet')
console.log('── 시트 글자 ──\n' + (글 || '(못 읽음)').slice(0, 400))
console.log('\n오류 = ' + (errs.length ? errs.join(' / ') : '0'))
await b.close(); srv.close()
