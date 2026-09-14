#!/usr/bin/env node
// 📸🍎 아이폰 「로그인 필수」 첫 화면 캡처 — 2026-09-10 (규칙 21 · 보여주기 전에 내가 연다)
//   가짜 Capacitor(isNativePlatform=true · 부품 없음)로 «아이폰 앱 안»을 흉내낸다.
//   ① 아이폰 첫 실행(표식 없음) → 문 · Apple 단추 · 탈출구 없음
//   ② 아이폰 로그인 2번 실패 → 탈출구 대신 «안내»
//   ③ 아이폰 표식 있음 ＋ 파이어베이스엔 사람 없음(다른 기기에서 지운 계정) → 홈 위에 문이 «덮어» 뜬다(확정 null · §8 ⑤)
//   ④ 웹 첫 실행 → 옛 그대로 · ⑤ 웹 2번 실패 → 탈출구 단추 그대로
//   로컬: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-아이폰로그인문-0910.mjs [낼폴더]
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'

const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.argv[2] || '/tmp/아이폰로그인문'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 결과 = []
async function 찍기 (이름, { 아이폰, 표식 = false, 실패 = 0 }) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const pg = await ctx.newPage()
  const 오류 = []
  pg.on('pageerror', (e) => 오류.push(String(e)))
  await pg.addInitScript(({ 아이폰, 표식 }) => {
    if (아이폰) window.Capacitor = { isNativePlatform: () => true, Plugins: {} }
    if (표식) { localStorage.setItem('hankki:cloud:on', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:coach:home', '1'); localStorage.setItem('hankki:news:off', '1') }
  }, { 아이폰, 표식 })
  await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1500)
  for (let i = 0; i < 실패; i++) {
    await pg.getByText('Google 계정으로 시작하기').first().click()
    await pg.waitForTimeout(2500)   // 붙기(파이어베이스 받기)가 실패하거나 부품 없음 오류가 날 때까지
  }
  await pg.waitForTimeout(400)
  const 글 = await pg.evaluate(() => document.body.innerText)
  const 문있나 = /한끼\n/.test(글) && /Google/.test(글)
  const 애플 = /Apple/.test(글)
  const 탈출구 = /그냥 시작하기/.test(글)
  const 안내 = /인터넷 연결을 확인한 뒤/.test(글)
  const f = join(OUT, 이름 + '.png')
  await pg.screenshot({ path: f })
  결과.push({ 이름, 문있나, 애플, 탈출구, 안내, 오류: 오류.length })
  console.log(`  📸 ${이름} → 문=${문있나 ? 'O' : 'X'} Apple=${애플 ? 'O' : 'X'} 탈출구=${탈출구 ? 'O' : 'X'} 안내=${안내 ? 'O' : 'X'} 오류=${오류.length}${오류.length ? ' ' + 오류[0].slice(0, 120) : ''}`)
  await ctx.close()
}

console.log('\n📸🍎 아이폰 로그인 문\n')
await 찍기('01-아이폰-첫실행', { 아이폰: true })
await 찍기('02-아이폰-2번실패', { 아이폰: true, 실패: 2 })
// ③ 표식은 있는데 파이어베이스엔 로그인이 없다(＝다른 기기에서 지운 계정 · 이 샌드박스가 정확히 그 상태) → 홈이 먼저 그려졌다가 «확정 null» 로 문이 «덮어» 뜬다(§8 ⑤)
await 찍기('03-아이폰-표식있음-확정null-문', { 아이폰: true, 표식: true })
await 찍기('04-웹-첫실행', { 아이폰: false })
await 찍기('05-웹-2번실패', { 아이폰: false, 실패: 2 })
await b.close(); srv.close()

const 기대 = {
  '01-아이폰-첫실행': { 문있나: true, 애플: true, 탈출구: false, 안내: false },
  '02-아이폰-2번실패': { 문있나: true, 애플: true, 탈출구: false, 안내: true },
  '03-아이폰-표식있음-확정null-문': { 문있나: true, 애플: true, 탈출구: false },
  '04-웹-첫실행': { 문있나: true, 애플: false, 탈출구: false },
  '05-웹-2번실패': { 문있나: true, 애플: false, 탈출구: true, 안내: false },
}
let 나쁨 = 0
for (const r of 결과) {
  const k = 기대[r.이름]
  const 좋나 = Object.entries(k).every(([a, v]) => r[a] === v) && r.오류 === 0
  if (!좋나) 나쁨++
  console.log(`  ${좋나 ? '✅' : '⛔'} ${r.이름}`)
}
console.log(나쁨 ? `\n⛔ ${나쁨}장 기대와 다르다 → ${OUT}\n` : `\n✅ 5장 기대대로 → ${OUT}\n`)
process.exit(나쁨 ? 1 : 0)
