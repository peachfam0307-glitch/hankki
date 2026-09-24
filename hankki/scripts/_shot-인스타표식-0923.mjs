// 📸 홈 「한끼 인스타그램」 칸에 «새 글 표식»을 다는 시안 셋 — 2026-09-23
//
// 📮 창업자 = *"인스타에 새로운 글이 올라오면 우리 홈 인스타에도 표식을 달자 사람들 들어가보게"*
//            ＋ *"별표같은거 하나 달까"*
// ⛔ 유니코드 이모지 금지(절대원칙 2026-07-26) — 별은 «인라인 SVG» 로 그린다.
// ⭐ ③번은 «우리가 이미 쓰는» 모양이다 — 한끼 소식 곰 머리 위의 `.news-new` 알약(HomeScreen.jsx:574).
//    창업자가 이미 승인한 꼴이라 새로 지어낸 것이 아니다.
// 📌 시안이라 실제 코드엔 아직 없다 — «도는 앱»에 표식만 얹어 찍는다(모양·자리를 실물 크기로 보려고).
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const R = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(R, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/인스타표식'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, '')
  let f = join(DIST, p === '/' || p === '' ? 'index.html' : p)
  if (!existsSync(f) || !extname(f)) f = join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => srv.listen(4382, r))

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0]))
await page.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const _g = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
})
await page.goto('http://127.0.0.1:4382/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)

const card = page.locator('.insta-card')
if (!(await card.count())) { console.error('⛔ .insta-card 를 못 찾았다'); process.exit(1) }

// 갈래 넷 — ⓞ 지금(표식 없음) · ① 점 · ② 별 · ③ 「새 글」 알약
const 갈래 = {
  '0-지금': '',
  '1-점': `<span style="position:absolute;top:9px;right:11px;width:10px;height:10px;border-radius:50%;background:var(--gift);box-shadow:0 0 0 2.5px var(--surface)"></span>`,
  '2-별': `<span style="position:absolute;top:6px;right:8px;display:inline-flex"><svg viewBox="0 0 24 24" width="16" height="16" fill="var(--gift)" stroke="var(--surface)" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"/></svg></span>`,
  '3-알약': `<span class="news-new" style="position:absolute;top:7px;right:8px;color:var(--surface);background:var(--gift)">새 글</span>`,
}
for (const [이름, html] of Object.entries(갈래)) {
  await page.evaluate(({ html }) => {
    const el = document.querySelector('.insta-card')
    el.querySelectorAll('[data-시안]').forEach((n) => n.remove())
    el.style.position = 'relative'
    if (!html) return
    const wrap = document.createElement('span')
    wrap.setAttribute('data-시안', '1'); wrap.innerHTML = html
    el.appendChild(wrap.firstElementChild)
    el.querySelector('[style*="position:absolute"]')?.setAttribute('data-시안', '1')
  }, { html })
  await page.waitForTimeout(150)
  await card.screenshot({ path: join(OUT, `${이름}.png`) })
}
console.log('pageerror', errs.length, errs.slice(0, 2)); console.log('저장 →', OUT)
await b.close(); srv.close()
