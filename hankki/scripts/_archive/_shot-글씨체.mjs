// 📸 글씨체 여섯 나란히 — 창업자 판정용 (2026-08-07)
//   ⭐ 실제 앱의 «글자 스티커» 그대로 그린다(모양·굵기 보정까지 같은 값).
//   ⛔ 바깥 인터넷을 끊고 찍는다 — 그래야 「우리 파일로 뜬 것」만 보인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글씨체'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4397, r))

const FONTS = [
  { key: 'gaegu', label: '귀염체', family: "'Gaegu'", weight: 700, local: '전부터 있던 것' },
  { key: 'nanumpen', label: '펜글씨', family: "'Nanum Pen Script'", weight: 400, local: '전부터 있던 것' },
  { key: 'jua', label: '통통체', family: "'Jua'", weight: 400, local: '전부터 있던 것' },
  { key: 'gowun', label: '또박체', family: "'Gowun Dodum'", weight: 800, local: '전부터 있던 것' },
  { key: 'blackhan', label: '임팩트', family: "'Black Han Sans'", weight: 400, local: '⭐ 오늘 내려받았다' },
  { key: 'dohyeon', label: '라운드', family: "'Do Hyeon'", weight: 400, local: '⭐ 오늘 내려받았다' },
]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 720, height: 1180 }, deviceScaleFactor: 2 })
await page.route('**/*', (r) => (r.request().url().startsWith('http://127.0.0.1:4397') || r.request().url().startsWith('data:') ? r.continue() : r.abort()))
await page.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

await page.evaluate(async (fonts) => {
  for (const f of fonts) await document.fonts.load(`40px ${f.family}`, '한끼 가나다').catch(() => {})
  await document.fonts.ready
  document.body.innerHTML = ''
  document.body.style.cssText = 'margin:0;background:#f4f1ea;font-family:Pretendard,sans-serif'
  const wrap = document.createElement('div')
  wrap.style.cssText = 'padding:26px 30px'
  wrap.innerHTML = `<div style="font-size:21px;font-weight:800;color:#5b4436;margin-bottom:4px">꾸미기 「글자」 글씨체 여섯</div>
    <div style="font-size:13.5px;color:#8b7f6e;margin-bottom:20px">인터넷을 끊고 찍었어요 · 여기 보이는 건 전부 «우리 파일»이에요</div>`
  for (const f of fonts) {
    const row = document.createElement('div')
    row.style.cssText = 'background:#fffdf8;border-radius:16px;padding:15px 18px;margin-bottom:11px;box-shadow:0 1px 4px rgba(90,75,55,.08)'
    row.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:7px">
        <span style="font-size:15px;font-weight:800;color:#5878a0">${f.label}</span>
        <span style="font-size:11.5px;color:#a3968a">${f.local}</span>
      </div>
      <div style="font-family:${f.family},sans-serif;font-weight:${f.weight};font-size:36px;color:#5b4436;line-height:1.35">
        오늘도 한 끼 해냈어요
      </div>
      <div style="font-family:${f.family},sans-serif;font-weight:${f.weight};font-size:21px;color:#8b7f6e;margin-top:3px">
        콩국수 · 15분 · 꼬르곰과 펭펭 · Hankki 2026
      </div>`
    wrap.appendChild(row)
  }
  document.body.appendChild(wrap)
}, FONTS)
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, 'f1.png'), fullPage: true })
console.log('  📸 글씨체 여섯')
await b.close(); srv.close()
console.log('📁', OUT)
