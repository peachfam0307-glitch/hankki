// 📔 다이어리 속지 판 — 창업자 판정용 (2026-08-06)
//
// ⭐ 앱의 `src/styles.css` 와 `src/data/papers.js` 를 «그대로» 물려서 찍는다.
//    따로 그린 시안이 아니다 — 글꼴도 앱 것이라 실제로 쓸 때와 같은 그림이 나온다.
// ⛔ 「예쁜가」는 빈 종이로 판정이 안 된다 → **글씨가 얹힌 모습**을 같이 본다.
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
  // ⚠️ 속지 그림은 아직 앱 코드가 안 부른다 → 빌드에 안 실린다. 소스에서 바로 내준다.
  //    (판정용 판이라 그러면 되고, ⛔없는 파일을 '있다'고 꾸며내는 게 아니다)
  if (p.startsWith('/paper/')) { body = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/assets', p)); type = 'image/webp' }
  else { try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' } }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4344, r))
const cssHref = (readFileSync(join(DIST, 'index.html'), 'utf8').match(/href="[^"]*?(assets\/[^"]+\.css)"/) || [])[1]

const artUrl = (stem) => `/hankki/paper/${stem}.webp`

const RULES = [['', '무지'], ['lined', '줄'], ['grid', '모눈'], ['dots', '도트']]
const SKINS = [['', '아이보리'], ['linen', '리넨'], ['greige', '그레이지'], ['kraft', '크라프트']]
const ARTS = [['dp_photo', '사진일기'], ['dp_card', '사진 한 칸'], ['dp_dot_blue', '도트 · 파랑'], ['dp_dot_warm', '도트 · 갈색']]

const WRITE = `<div class="w"><div style="font-family:'Nanum Pen Script','Gowun Dodum',sans-serif;font-size:22px;line-height:26px;color:#5b4436;letter-spacing:.02em">
  8월 6일 목요일<br>오늘은 들깨나물무침<br>들기름 조금 더 넣으니<br>훨씬 고소했다</div></div>`

const paper = (cls, art, write) =>
  `<div class="paper ${cls}${art ? ' art' : ''}"${art ? ` style="--art:url(${artUrl(art)})"` : ''}>${write ? WRITE : ''}</div>`

const html = `<meta charset="utf-8"><link rel="stylesheet" href="/hankki/${cssHref}">
<style>
  body{margin:0;background:#e9e5dd;font-family:'Pretendard',system-ui,sans-serif;padding:22px}
  h2{font-size:19px;margin:22px 0 4px;color:#3a322a}
  h2:first-of-type{margin-top:0}
  .sub{font-size:12.5px;color:#7b7168;margin:0 0 14px;line-height:1.6}
  .row{display:flex;gap:14px;flex-wrap:wrap}
  .v{width:200px}
  .vh{font-size:12.5px;font-weight:800;color:#3a322a;margin-bottom:6px}
  .paper{width:200px;aspect-ratio:3/4;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,.13)}
  .w{padding:13px 15px}
</style>

<h2>⑴ 선 — 무지 · 줄 · 모눈 · 도트 <span class="sub">(전부 CSS · 파일 0KB)</span></h2>
<p class="sub">실제로 썼을 때. 빈 종이로는 판정이 안 돼 — 줄이 진하면 «글씨보다 줄이 먼저» 보이거든.</p>
<div class="row">${RULES.map(([c, n]) => `<div class="v"><div class="vh">${n}</div>${paper(c, null, true)}</div>`).join('')}</div>

<h2>⑵ 스킨 — 종이색·선색만 바뀐다 <span class="sub">(CSS 변수 두 줄 · 그림 0장)</span></h2>
<p class="sub">⭐ 네 조사의 「구조 12개 × 감성 스킨」이 이 층에서 공짜로 돼. 전부 「줄」 속지에 스킨만 갈아끼운 것.</p>
<div class="row">${SKINS.map(([c, n]) => `<div class="v"><div class="vh">${n}</div>${paper('lined ' + c, null, true)}</div>`).join('')}</div>

<h2>⑶ 틀 — 네가 뽑아 온 그림 <span class="sub">(2,148KB → 117KB · WebP)</span></h2>
<p class="sub">글자·별 0개로 왔어. 제목·라벨은 나중에 코드로 얹으면 돼.</p>
<div class="row">${ARTS.map(([a, n]) => `<div class="v"><div class="vh">${n}</div>${paper('', a, false)}</div>`).join('')}</div>

<h2>⑷ 겹쳐 쓰면 <span class="sub">(틀 ＋ 선 ＋ 스킨 ＋ 글씨)</span></h2>
<p class="sub">⚠️ 도트 틀에는 CSS 도트를 자동으로 끈다 — 안 그러면 점이 두 겹으로 찍혀.</p>
<div class="row">
  <div class="v"><div class="vh">사진일기 ＋ 크라프트</div>${paper('kraft', 'dp_photo', false)}</div>
  <div class="v"><div class="vh">사진 한 칸 ＋ 줄 ＋ 글씨</div>${paper('lined', 'dp_card', true)}</div>
  <div class="v"><div class="vh">사진 한 칸 ＋ 모눈 ＋ 그레이지</div>${paper('grid greige', 'dp_card', false)}</div>
  <div class="v"><div class="vh">도트 · 파랑 ＋ 글씨</div>${paper('dots', 'dp_dot_blue', true)}</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 940, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://127.0.0.1:4344/hankki/')
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: join(OUT, '다이어리-속지-판.png'), fullPage: true })
console.log('→ /다이어리-속지-판.png')
await b.close(); srv.close()
