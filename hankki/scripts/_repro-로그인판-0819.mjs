#!/usr/bin/env node
// 🔬 폰 확인판(`public/logintest.html`) 재현판 — 2026-08-19
// ⭐ 이 판이 재는 것 = **「어떤 브라우저로 열었을 때 뭐라고 말하나」**
//   ⛔ 헛알람이 제일 무섭다 — 카톡 자기 브라우저에서 열고 「우리 앱이 막혔다」로 읽으면 설계를 헛바꾼다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4598, r))

const CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36'
const 판 = [
  { 이름: '한끼 앱(TWA) 안', ua: CHROME, 앱에서: true, 기대: /진짜 크롬/, 결과에: '한끼 앱' },
  { 이름: '그냥 크롬 탭', ua: CHROME, 앱에서: false, 기대: /진짜 크롬/ },
  { 이름: '⛔ 카카오톡 자기 브라우저', ua: CHROME.replace('Mobile Safari/537.36', 'Mobile Safari/537.36 KAKAOTALK 10.5.0'), 앱에서: false, 기대: /카카오톡/ },
  { 이름: '⛔ 네이버 앱 브라우저', ua: CHROME + ' NAVER(inapp; search; 1234)', 앱에서: false, 기대: /네이버/ },
  { 이름: '⛔ 진짜 웹뷰(앱에 박은 것)', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S911N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.0.0 Mobile Safari/537.36', 앱에서: false, 기대: /막혀요/ },
]

let ok = 0, bad = 0
const b = await chromium.launch()
for (const t of 판) {
  const ctx = await b.newContext({ userAgent: t.ua, viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })
  const pg = await ctx.newPage()
  const errs = []
  pg.on('pageerror', (e) => errs.push(String(e)))
  // ⭐ TWA 는 `document.referrer` 가 `android-app://…` 로 온다 — 그것만 흉내낸다
  if (t.앱에서) await pg.addInitScript(() => Object.defineProperty(document, 'referrer', { get: () => 'android-app://io.github.peachfam0307_glitch.twa' }))
  await pg.goto('http://localhost:4598/hankki/logintest.html', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(400)
  const v = (await pg.textContent('#verdict')).trim()
  const dump = await pg.textContent('#dump')
  const pass = t.기대.test(v) && (!t.결과에 || dump.includes(t.결과에)) && errs.length === 0
  console.log(`  ${pass ? '✅' : '⛔'} ${t.이름}\n       → ${v}${errs.length ? '\n       ⛔ 오류: ' + errs.join(' | ') : ''}`)
  pass ? ok++ : bad++
  await ctx.close()
}

// 🔒 ③ 단추가 «구글로» 가나 — 우리 서버로 아무것도 안 보내는지도 같이 본다
{
  const ctx = await b.newContext({ userAgent: CHROME, viewport: { width: 412, height: 915 } })
  const pg = await ctx.newPage()
  const 나간곳 = []
  await pg.route('**', (r) => {
    const u = r.request().url()
    if (!u.startsWith('http://localhost:4598')) { 나간곳.push(u); return r.abort() }
    r.continue()
  })
  await pg.goto('http://localhost:4598/hankki/logintest.html', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(300)
  const 밖 = 나간곳.slice()
  const pass1 = 밖.length === 0
  console.log(`  ${pass1 ? '✅' : '⛔'} 그냥 열기만 하면 «밖으로 아무것도 안 나간다»${pass1 ? '' : ' → ' + 밖.join(', ')}`)
  pass1 ? ok++ : bad++
  await pg.click('#probe'); await pg.waitForTimeout(500)
  const g = 나간곳.filter((u) => u.startsWith('https://accounts.google.com/'))
  const pass2 = g.length === 1 && 나간곳.length === 1
  console.log(`  ${pass2 ? '✅' : '⛔'} 단추를 눌러야 «구글 한 곳»으로만 간다${pass2 ? '' : ' → ' + 나간곳.join(', ')}`)
  pass2 ? ok++ : bad++
  const pass3 = /redirect_uri=http%3A%2F%2Flocalhost%3A4598%2Fhankki%2Flogintest\.html/.test(g[0] || '')
  console.log(`  ${pass3 ? '✅' : '⛔'} 돌아올 주소가 «이 페이지»로 잡힌다(주소가 박혀 있지 않다)`)
  pass3 ? ok++ : bad++
}

await b.close(); srv.close()
console.log(`\n  ── ${ok}칸 통과 · ${bad}칸 어긋남 ──`)
if (bad) process.exit(1)
