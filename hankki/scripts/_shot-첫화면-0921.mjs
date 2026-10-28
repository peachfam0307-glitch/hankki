// 📸 [2026-09-21] **새로 깐 사람이 앱을 켜면 «맨 처음» 보는 화면** — 눈으로 본다.
//
// 📮 창업자 2026-09-21 08:0x = *"앱을 깔고 로그인 안하고 그냥 입구에서 보다가 갔다는거네"*
//
// 🔢 그날 아침 실측 (GA4) — 받기 8명 → 스토어 6명 → 깔고 켬 2명 → **로그인 0명**
//    이벤트 표에 `login_google`·`signup_google` 이 한 줄도 없었다(9/20 엔 4명이 찍혔으니 계측은 멀쩡하다).
//    ＝ **깐 사람이 이 화면에서 돌아섰다.** 그래서 이 화면을 실물로 봐야 한다(절대원칙 21).
//
// ⛔ `_shot-로그인선물-0901.mjs` 는 이 화면을 «못» 본다 — 거긴 `hankki:onboarded='1'` 을 심어서
//    게이트를 일부러 건너뛰고 «설정» 안의 로그인 안내를 찍는 판이다. 여기는 그 반대다.
// ⭐ 그래서 저장소를 «비운 채로» 연다 = 새로 깐 폰과 같은 자리
//    (`App.jsx:113` = 클라우드보임() && needsCloudGate() && needsOnboarding() — 셋 다 참이어야 뜬다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4489, r))

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const OUT = process.env.SHOT_OUT || '/tmp'
// 📐 390×844 = 아이폰 13/14 · 갤럭시도 이 언저리다(창업자 기기 = 갤럭시)
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
p.on('pageerror', () => { /* noop */ })

await p.goto('http://127.0.0.1:4489/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2600)

// ⛔ 「무엇이 떴나」를 «숫자»가 아니라 «글자»로 남긴다 — 숫자는 가려진 것을 모른다(절대원칙 21).
const 본것 = await p.evaluate(() => {
  const t = (document.body.innerText || '').trim()
  const 단추 = [...document.querySelectorAll('button, [role="button"]')]
    .map((e) => (e.innerText || '').trim()).filter(Boolean)
  return { 글: t, 단추 }
})
await p.screenshot({ path: join(OUT, '첫화면-0921.png') })

console.log(JSON.stringify({
  찍은곳: join(OUT, '첫화면-0921.png'),
  단추: 본것.단추,
  화면글: 본것.글,
}, null, 1))

await b.close()
srv.close()
