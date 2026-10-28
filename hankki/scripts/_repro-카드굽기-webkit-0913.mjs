// 🧪 카드 굽기(html-to-image) 에서 «그림이 빠지나» — 사파리 엔진(WebKit) 재현판 (2026-09-13)
//
// 📮 실물 = 2026-09-12 딸 아이폰14 · 빌드 4: 레꾸자랑 카드를 「표지로 저장」·문자 공유·사진첩 저장 셋 다
//    배경·글자·테두리는 구워졌는데 «캐릭터 그림»만 빈칸(캡처 17:55 · 17:59 · 18:00). 화면 미리보기는 정상.
// 🌲 뿌리 후보 = html-to-image 는 DOM 을 SVG foreignObject 로 싸서 <img> 에 넣고 canvas 에 그린다.
//    WebKit 은 그 안의 그림을 «아직 안 읽은 채» 그려 버리는 일이 있다(같은 판이 크롬에선 멀쩡).
//    ＋ 아이폰 판은 그림이 WebP(vite-webp.js) 라 «WebP + foreignObject» 조합도 의심.
// ⛔ 이 컨테이너엔 WebKit 이 없다(/opt/pw-browsers = chromium 뿐 · playwright CDN 막힘) →
//    크롬으로는 「자」가 맞는지만 확인하고, 진짜 판정은 **맥 러너**(.github/workflows/repro-webkit.yml)에서 한다.
//
// 재는 것 (엔진 × 그림 형식 × 방법) — 각 칸에서 «그림이 있는 자리»의 불투명 픽셀 비율을 잰다
//   방법 A = 지금 코드 그대로(toCanvas 한 번)
//   방법 B = 고침 후보 ① — 찍기 «전»에 카드 안 <img> 를 data URL 로 미리 바꿔 둔다(fetch → blob → dataURL)
//   방법 C = 고침 후보 ② — toCanvas 두 번(첫 번은 버림 · WebKit 첫 호출 그림 누락 대비)
//   방법 D = ① ＋ ②
// 사용: node scripts/_repro-카드굽기-webkit-0913.mjs [chromium|webkit]   (기본 chromium)
//   exit 0 = 모든 칸에서 그림이 구워짐 · exit 1 = 어느 칸이든 빈칸(＝사고 재현) — 표를 보고 고침을 고른다

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENGINE = process.argv[2] || 'chromium'
const PNG = 'src/assets/stickers/photo/gp_duohi.png'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' }

// WebP 판도 같이 재려고 sharp 로 즉석 변환(아이폰 판과 같은 q85)
let webpBuf = null
try { const sharp = (await import('sharp')).default; webpBuf = await sharp(path.join(ROOT, PNG)).webp({ quality: 85 }).toBuffer() } catch { /* sharp 없으면 PNG 만 */ }

const page = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;background:#fff} .card{position:relative;width:360px;height:480px;background:linear-gradient(160deg,#6a3fa0,#2a1a5a);border-radius:24px;overflow:hidden}
.ring{position:absolute;left:60px;top:60px;width:240px;height:240px;border-radius:50%;border:6px solid #fff;overflow:hidden;background:rgba(255,255,255,.08)}
.ring img{width:100%;height:100%;object-fit:contain;display:block} .t{position:absolute;left:0;right:0;bottom:60px;text-align:center;color:#ffd7f0;font:800 40px sans-serif}</style>
<div id="card" class="card"><div class="ring"><img id="pic" src=""></div><div class="t">꽃게탕</div></div>
<script src="/node_modules/html-to-image/dist/html-to-image.js"></script>
<script type="module">
const { toCanvas } = window.htmlToImage   // UMD 판 — es/ 판은 확장자 없는 import 라 브라우저가 못 푼다
const q = new URLSearchParams(location.search)
const src = q.get('img'); document.getElementById('pic').src = src
await new Promise(r => { const i = document.getElementById('pic'); if (i.complete) r(); else i.onload = r })
async function inlineImgs (el) {
  for (const im of el.querySelectorAll('img')) {
    if (im.src.startsWith('data:')) continue
    const b = await (await fetch(im.src)).blob()
    im.src = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b) })
    await im.decode().catch(() => {})
  }
}
const card = document.getElementById('card')
const method = q.get('m')
if (method === 'B' || method === 'D') await inlineImgs(card)
const opt = { pixelRatio: 1, backgroundColor: '#ffffff' }
if (method === 'C' || method === 'D') await toCanvas(card, opt)
const c = await toCanvas(card, opt)
// 테두리 «안쪽» 200×200 에서 «배경(보라 계열)이 아닌» 픽셀 비율 = 그림이 있으면 크다
const ctx = c.getContext('2d'); const d = ctx.getImageData(80, 80, 200, 200).data
let n = 0, hit = 0
for (let i = 0; i < d.length; i += 4) { n++; const r = d[i], g = d[i+1], b = d[i+2]; const purple = b > r && b > g && r < 170; if (!purple) hit++ }
window.__result = { ratio: hit / n, w: c.width, h: c.height }
</script>`

const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/repro.html') { res.setHeader('content-type', 'text/html'); return res.end(page) }
  if (u.pathname === '/pic.webp' && webpBuf) { res.setHeader('content-type', 'image/webp'); return res.end(webpBuf) }
  const f = path.join(ROOT, decodeURIComponent(u.pathname))
  try { await stat(f); res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) } catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const pw = await import('playwright')
// 이 컨테이너의 크롬은 직접 경로로(smoke.mjs 와 같은 SMOKE_CHROMIUM) · 러너에선 기본 설치본
const browser = await pw[ENGINE].launch(ENGINE === 'chromium' && process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await browser.newContext({ viewport: { width: 420, height: 560 } })
const rows = []
const imgs = [['png', `/${PNG}`], ...(webpBuf ? [['webp', '/pic.webp']] : [])]
let bad = 0
for (const [kind, src] of imgs) {
  for (const m of ['A', 'B', 'C', 'D']) {
    const p = await ctx.newPage()
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', c => { if (c.type() === 'error') errs.push(c.text()) })
    let r
    try {
      await p.goto(`http://127.0.0.1:${port}/repro.html?img=${encodeURIComponent(src)}&m=${m}`)
      await p.waitForFunction(() => window.__result, null, { timeout: 8000 })
      r = await p.evaluate(() => window.__result)
    } catch (e) { r = { ratio: -1, err: String(e).slice(0, 80) }; console.log('   ', m, kind, 'page errors:', errs.join(' | ').slice(0, 200)) }
    await p.close()
    const ok = r.ratio >= 0.05   // 캐릭터가 있으면 20~50% · 빈칸이면 ≈0
    if (!ok) bad++
    rows.push({ engine: ENGINE, img: kind, method: m, ratio: r.ratio.toFixed ? r.ratio.toFixed(3) : r.ratio, ok: ok ? '✅' : '⛔', err: r.err || '' })
  }
}
await browser.close(); server.close()
console.table(rows)
console.log(bad ? `⛔ ${ENGINE}: 빈칸 ${bad}칸 — 그림이 안 구워지는 조합이 있다(위 표)` : `✅ ${ENGINE}: 모든 칸에서 그림이 구워졌다`)
process.exit(bad ? 1 : 0)
