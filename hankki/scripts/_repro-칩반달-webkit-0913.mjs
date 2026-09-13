// 🧪 카드 칩(150분·4인분·한식) 오른쪽 «흰 반달» — 사파리 엔진(WebKit) 재현판 (2026-09-13)
//
// 📮 실물 = 2026-09-13 12:12 딸 아이폰14 · 빌드 12 · 추석 카드(보쌈 무김치)를 문자로 공유한 그림:
//    칩 셋의 «오른쪽 끝»마다 흰 반달 조각이 튀어나와 있다. 같은 카드가 안드로이드(크롬)에선 멀쩡.
// 🌲 뿌리 후보 = 칩이 «inline span» ＋ borderRadius 999 ＋ inset box-shadow(테두리 대용).
//    WebKit 이 foreignObject 안의 inline 상자 그림자·둥근 모서리를 어긋나게 그린다는 의심.
// 재는 것 = 네 가지 칩 판을 한 장에 굽고 PNG 로 남긴다(러너 결과물) — 눈으로 판정(규칙 21).
//   A = 지금 코드 그대로(inline span · inset shadow)
//   B = display:inline-block
//   C = inset shadow → border 2px
//   D = B ＋ C
// ＋ 숫자 = 각 칩 «오른쪽 바깥 12px 띠»에서 «배경(보라)이 아닌» 픽셀 비율 — 반달이 있으면 커진다.
// 사용: node scripts/_repro-칩반달-webkit-0913.mjs [chromium|webkit]  → scripts/_out/칩반달-<엔진>.png
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENGINE = process.argv[2] || 'chromium'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' }

const chip = (m, t) => {
  const base = `padding:11px 24px;border-radius:999px;background:#fffdf8;font:28px Jua,sans-serif;color:#8a5f3c;`
  const shadow = `box-shadow:0 8px 20px -12px rgba(120,80,50,.5), inset 0 0 0 2px rgba(216,150,110,.25);`
  const border = `box-shadow:0 8px 20px -12px rgba(120,80,50,.5);border:2px solid rgba(216,150,110,.25);`
  const disp = (m === 'B' || m === 'D') ? 'display:inline-block;' : ''
  const ring = (m === 'C' || m === 'D') ? border : shadow
  return `<span class="chip" style="${base}${disp}${ring}">${t}</span>`
}
const row = (m) => `<div class="row" data-m="${m}"><b>${m}</b><div style="display:flex;gap:12px;flex-wrap:wrap">${['150분', '4인분', '한식'].map((t) => chip(m, t)).join('')}</div></div>`
const page = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;background:#fff} #card{width:720px;padding:24px;background:linear-gradient(160deg,#6a3fa0,#2a1a5a)}
.row{display:flex;align-items:center;gap:16px;margin:0 0 26px} .row b{color:#fff;font:20px sans-serif;width:20px}</style>
<div id="card">${['A', 'B', 'C', 'D'].map(row).join('')}</div>
<script src="/node_modules/html-to-image/dist/html-to-image.js"></script>
<script type="module">
const { toCanvas } = window.htmlToImage
const el = document.getElementById('card')
const opt = { pixelRatio: 1, backgroundColor: '#ffffff' }
await toCanvas(el, opt)                 // 예열(앱과 같은 길 · 그림 누락 대비)
const c = await toCanvas(el, opt)
const ctx = c.getContext('2d')
const R = el.getBoundingClientRect()
const out = {}
for (const r of el.querySelectorAll('.row')) {
  let n = 0, hit = 0
  for (const s of r.querySelectorAll('.chip')) {
    const b = s.getBoundingClientRect()
    const x0 = Math.round(b.right - R.left) + 1, y0 = Math.round(b.top - R.top), h = Math.round(b.height)
    const d = ctx.getImageData(x0, y0, 12, h).data
    for (let i = 0; i < d.length; i += 4) { n++; const rr = d[i], g = d[i+1], bb = d[i+2]; if (!(bb > rr && bb > g && rr < 170)) hit++ }
  }
  out[r.dataset.m] = hit / n
}
window.__png = c.toDataURL('image/png'); window.__result = out
</script>`

const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/repro.html') { res.setHeader('content-type', 'text/html'); return res.end(page) }
  const f = path.join(ROOT, decodeURIComponent(u.pathname))
  try { await stat(f); res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) } catch { res.statusCode = 404; res.end('nope') }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const pw = await import('playwright')
const browser = await pw[ENGINE].launch(ENGINE === 'chromium' && process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await browser.newPage({ viewport: { width: 800, height: 600 } })
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(`http://127.0.0.1:${port}/repro.html`)
await p.waitForFunction(() => window.__result, null, { timeout: 15000 })
const { r, png } = await p.evaluate(() => ({ r: window.__result, png: window.__png }))
await mkdir(path.join(__dirname, '_out'), { recursive: true })
const file = path.join(__dirname, '_out', `칩반달-${ENGINE}.png`)
await writeFile(file, Buffer.from(png.split(',')[1], 'base64'))
await browser.close(); server.close()
console.table(Object.entries(r).map(([m, v]) => ({ engine: ENGINE, method: m, '오른쪽 띠 비배경 비율': v.toFixed(3), 판정: v > 0.02 ? '⛔ 반달 의심' : '✅' })))
if (errs.length) console.log('page errors:', errs.join(' | '))
console.log('🖼', file, '— 눈으로 본다(규칙 21)')
