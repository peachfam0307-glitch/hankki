// 👁 소개(온보딩) 화면 — 계측을 심은 뒤 «화면이 그대로인가»를 눈으로 본다 (2026-09-23)
// ⛔ 계측만 더했으니 화면은 한 픽셀도 안 바뀌어야 한다. 그걸 «믿지 않고» 찍어서 본다(절대원칙 2026-09-20).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/온보딩눈'; mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4393, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 📱 갤럭시(360x800) · 아이폰(390x844) 둘 다 — 소개는 두 폰에 똑같이 뜬다
for (const [이름, w, h] of [['갤럭시', 360, 800], ['아이폰', 390, 844]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0]))
  await page.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  // 소개 덮개가 진짜 떠 있나 — 가운데를 덮은 것이 무엇인지 본다(규칙 21 장치)
  const 덮개 = await page.evaluate(() => { const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return el ? (el.className || el.tagName) + '' : '(없음)' })
  const 단추 = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => /건너뛰기|다음|시작하기/.test(t)))
  await page.screenshot({ path: join(OUT, `${이름}-소개1장.png`) })
  console.log(`${이름} ${w}x${h} · 가운데 덮은 것 = ${덮개} · 소개 단추 = ${JSON.stringify(단추)} · pageerror ${errs.length}`)
  await page.close()
}
await b.close(); srv.close(); console.log('저장 →', OUT)
