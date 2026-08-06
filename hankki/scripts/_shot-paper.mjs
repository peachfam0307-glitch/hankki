// 📔 다이어리 속지 넷 — 창업자 판정용 (2026-08-06 *"속지 예쁜걸로 하자"*)
//
// ⭐ 앱의 `src/styles.css` 를 «그대로» 물려서 찍는다 — 따로 그린 시안이 아니다.
//    글꼴도 앱 것(귀염체·펜글씨·또박체)이라 실제로 쓸 때와 같은 그림이 나온다.
// ⛔ 「예쁜가」는 빈 종이로는 판정이 안 된다 — **글씨가 얹힌 모습**을 같이 본다.
//    (줄이 진하면 «글씨보다 줄이 먼저» 보인다 — 그게 투박함의 정체다)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-paper.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4344, r))
const cssHref = (readFileSync(join(DIST, 'index.html'), 'utf8').match(/href="[^"]*?(assets\/[^"]+\.css)"/) || [])[1]

const PAPERS = [
  { cls: '', name: '무지', note: '아무것도 없는 종이 · 기본' },
  { cls: 'lined', name: '줄', note: '손글씨 한 줄 28px · 종이 다이어리 8mm' },
  { cls: 'grid', name: '모눈', note: '22px · 가로세로라 톤을 한 단계 낮췄다' },
  { cls: 'dots', name: '도트', note: '20px · 점은 작고 촘촘해야 종이로 읽힌다' },
]
// 실제로 쓸 때 어떻게 보이나 — 우리 글꼴로
const WRITE = `
  <div style="font-family:'Nanum Pen Script','Gowun Dodum',sans-serif;font-size:25px;line-height:28px;color:#5b4436;letter-spacing:.02em">
    8월 6일 목요일<br>오늘은 들깨나물무침<br>들기름 조금 더 넣으니<br>훨씬 고소했다<br>아이가 두 그릇 먹음
  </div>`

const card = (p) => `
  <div class="v">
    <div class="vh"><b>${p.name}</b><span>${p.note}</span></div>
    <div class="pair">
      <div class="paper ${p.cls}"></div>
      <div class="paper ${p.cls}"><div class="w">${WRITE}</div></div>
    </div>
  </div>`

const html = `<meta charset="utf-8"><link rel="stylesheet" href="/hankki/${cssHref}">
<style>
  body{margin:0;background:#e9e5dd;font-family:'Pretendard',system-ui,sans-serif;padding:22px}
  h2{font-size:19px;margin:0 0 4px;color:#3a322a}
  .sub{font-size:13px;color:#7b7168;margin:0 0 20px;line-height:1.6}
  .row{display:flex;gap:18px;flex-wrap:wrap}
  .v{width:400px}
  .vh{margin-bottom:8px}
  .vh b{display:block;font-size:15px;color:#3a322a}
  .vh span{font-size:11.5px;color:#8b8177}
  .pair{display:flex;gap:10px}
  .pair .paper{width:190px;height:250px;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,.13)}
  .w{padding:14px 16px}
</style>
<h2>📔 다이어리 속지 넷 — 앱 CSS 그대로</h2>
<p class="sub">왼쪽 = 빈 종이 · 오른쪽 = <b>실제로 썼을 때</b>(우리 펜글씨).<br>
⛔ 빈 종이로는 판정이 안 돼 — 줄이 진하면 «글씨보다 줄이 먼저» 보이고, 그게 투박함의 정체야.</p>
<div class="row">${PAPERS.map(card).join('')}</div>`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://127.0.0.1:4344/hankki/')
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.screenshot({ path: join(OUT, '다이어리-속지-넷.png'), fullPage: true })
console.log('→ /다이어리-속지-넷.png')
await b.close(); srv.close()
