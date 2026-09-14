// 📸 AI 고지 시트를 «띄워서» 찍는다 — 눈으로 보고 판정하려고 (2026-09-13)
//
// 📮 창업자 = *"이구구절절멘트뭐야"* → 글자를 줄인 뒤 «정말 짧아졌나»를 화면으로 봐야 했다(절대원칙 21).
// ⛔ 이 시트는 단추로 못 연다 — `aiConsent.js` 가 «물어볼 때»만 이벤트로 뜬다.
//    ⭐ 그래서 그 이벤트(`hankki:aiconsent`)를 직접 쏴서 띄운다. 답 함수는 빈 것을 준다(눌러도 아무 일 없음).
// ⛔ scratchpad 에 두지 않는다 — 다음에 또 파서를 새로 짜게 된다(규칙 30).
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_shot-AI고지-0913.mjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
const dist = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 })).newPage()
await p.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:cloud:on', '1') } catch {} })
await p.goto(`http://localhost:${port}/hankki/`)
await p.waitForTimeout(2500)
await p.evaluate(() => {
  window.dispatchEvent(new CustomEvent('hankki:aiconsent', { detail: { 받았다: () => {}, 답: () => {} } }))
})
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/claude-0/AI고지-줄인판.png' })
await b.close(); srv.close()
console.log('📸 /tmp/claude-0/AI고지-줄인판.png')
