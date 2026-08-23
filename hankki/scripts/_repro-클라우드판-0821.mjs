#!/usr/bin/env node
// ☁️🔬 클라우드 판정판(`public/fbtest.html`) 재현판 — 2026-08-21
//
// ⭐ 이 판이 재는 것 = **「창업자 폰에 보내기 «전»에, 이 페이지가 스스로 서 있나」**
//   ⛔ 실제 구글 로그인은 여기서 못 잰다(사람이 계정을 골라야 한다). 그건 창업자 폰 몫이다.
//   ✅ 여기서 재는 것 = ①파이어베이스 SDK 가 «주소대로» 불러와지나 ②단추가 살아나나
//      ③앱 밖/앱 안을 제대로 가려 말하나 ④자바스크립트 오류가 0인가
//
// 🌐 이 환경은 `www.gstatic.com` 을 못 연다(프록시 403) — 그래서 **npm 으로 받은 «같은 파일»**을
//    그 주소인 척 물려 준다. ⭐`node_modules/firebase/firebase-app.js` 는 자기가 바로 그 주소를
//    import 하고 있어서(실측), 주소 모양이 맞다는 근거도 «같은 파일»에서 나온다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', 'public')
const FBDIR = join(HERE, '..', 'node_modules', 'firebase')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4601, r))

const CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36'
const 판 = [
  { 이름: '📱 한끼 앱(TWA) 안', 앱에서: true, 기대: /앱 안이에요/ },
  { 이름: '🌐 앱 밖 크롬 탭', 앱에서: false, 기대: /«앱 밖»이에요/ },
]

let ok = 0, bad = 0
const b = await chromium.launch()
for (const t of 판) {
  const ctx = await b.newContext({ userAgent: CHROME, viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })
  // 🔁 gstatic 주소 → npm 으로 받은 같은 파일
  await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const 이름 = route.request().url().split('/').pop()
    try {
      route.fulfill({ status: 200, contentType: 'text/javascript', body: readFileSync(join(FBDIR, 이름), 'utf8') })
    } catch { route.fulfill({ status: 404, body: 'no such file: ' + 이름 }) }
  })
  const pg = await ctx.newPage()
  const errs = []
  pg.on('pageerror', (e) => errs.push(String(e)))
  if (t.앱에서) await pg.addInitScript(() => Object.defineProperty(document, 'referrer', { get: () => 'android-app://io.github.peachfam0307_glitch.twa' }))
  await pg.goto('http://localhost:4601/hankki/fbtest.html', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1500)

  const v = (await pg.textContent('#verdict')).trim()
  const dump = await pg.textContent('#dump')
  const 팝업살았나 = !(await pg.getAttribute('#popup', 'disabled') !== null)
  const SDK붙었나 = /SDK = 불러옴 ✅/.test(dump)
  const pass = t.기대.test(v) && SDK붙었나 && 팝업살았나 && errs.length === 0

  console.log((pass ? '✅' : '⛔') + ' ' + t.이름)
  console.log('   한 줄 = ' + v)
  console.log('   SDK = ' + (SDK붙었나 ? '불러옴 ✅' : '⛔ 못 불러옴') + ' · 로그인 단추 = ' + (팝업살았나 ? '살아남 ✅' : '⛔ 죽어 있음'))
  if (errs.length) console.log('   ⛔ 자바스크립트 오류 = ' + errs.join(' / '))
  if (!pass) { bad++; console.log('   ── dump ──\n' + dump.split('\n').map((l) => '   ' + l).join('\n')) } else ok++
  await ctx.close()
}

// ── 파이어베이스를 «못» 받았을 때도 곱게 말하나 ──────────────
{
  const ctx = await b.newContext({ userAgent: CHROME, viewport: { width: 412, height: 915 } })
  await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => route.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript(() => Object.defineProperty(document, 'referrer', { get: () => 'android-app://x' }))
  await pg.goto('http://localhost:4601/hankki/fbtest.html', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1200)
  const v = (await pg.textContent('#verdict')).trim()
  const pass = /못 받았어요/.test(v)
  console.log((pass ? '✅' : '⛔') + ' 🚫 인터넷이 막혔을 때 — 빈 화면 대신 «이유»를 말하나')
  console.log('   한 줄 = ' + v)
  pass ? ok++ : bad++
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n' + (bad === 0 ? '✅ 다 통과 ' + ok + '건' : '⛔ ' + bad + '건 실패'))
process.exit(bad === 0 ? 0 : 1)
