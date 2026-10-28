#!/usr/bin/env node
// 📸 계정 · 데이터 삭제 시트 — 실물 렌더 캡처 (2026-09-08 · 규칙 21 「보여주기 전에 내가 연다」)
//   ⓐ 설정 → 「계정 · 데이터 삭제」 줄을 «눌러서» 시트가 뜨나 (로그인 안 한 사람 = 단추 없이 한 줄)
//   ⓑ 자바스크립트 오류 0
//   ⛔ 로그인 상태 화면은 파이어베이스(막힘)가 필요해 여기선 못 찍는다 → 글자 검사(재현판 ⑥)로 대신
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { COACH } from '../src/coach.js'

const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad'
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
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
const pg = await ctx.newPage()
const errs = []
pg.on('pageerror', (e) => errs.push(e.message))
await pg.addInitScript((ks) => { ks.forEach((k) => localStorage.setItem(k, '1')) }, Object.values(COACH))
await pg.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  sessionStorage.setItem('hankki:tab', 'profile')
})
await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'domcontentloaded' })
await pg.waitForFunction(() => (document.body?.innerText || '').includes('계정 · 데이터 삭제'), null, { timeout: 30000 }).catch(() => {})
const 줄 = pg.getByText('계정 · 데이터 삭제', { exact: false }).first()
await 줄.scrollIntoViewIfNeeded().catch(() => {})
await 줄.click({ timeout: 5000 })
await pg.waitForSelector('.sheet-mask .sheet', { timeout: 5000 })
await pg.waitForTimeout(900)
const 글 = await pg.evaluate(() => document.querySelector('.sheet-mask .sheet')?.innerText || '')
await pg.screenshot({ path: join(OUT, '계정삭제시트-비로그인.png') })
console.log('시트 글 =\n' + 글)
console.log(errs.length ? `⛔ JS 오류 ${errs.length}: ${errs[0]}` : '✅ JS 오류 0')
console.log('저장 = ' + join(OUT, '계정삭제시트-비로그인.png'))
await b.close(); srv.close()
process.exit(errs.length ? 1 : 0)
