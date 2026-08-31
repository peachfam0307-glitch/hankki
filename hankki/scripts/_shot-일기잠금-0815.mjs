// 📸 일기 잠금 UI 캡처 — 창업자에게 보내기 «전»에 내가 열어보려고 (규칙 21)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const PORT = 4187
const URL = `http://127.0.0.1:${PORT}/`
const OUT = process.argv[2] || '/tmp/shot'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 서버 = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(URL); if (r.ok) break } catch { /* */ } await 잠깐(500) }
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(`${SEED_COACH_SEEN}\ntry { localStorage.setItem('hankki:onboarded','1') } catch(e){}`)
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(600)
  await p.getByRole('button', { name: '일기' }).first().click(); await 잠깐(600)
  await p.getByRole('button', { name: /^오늘 일기 (보기|쓰기)$/ }).click(); await 잠깐(800)
  await p.getByPlaceholder('여기에 써요').fill('오늘은 비가 왔다'); await 잠깐(700)
  await p.locator('.detail-bar').screenshot({ path: `${OUT}-1-상단바.png` })
  await p.getByRole('button', { name: '일기 잠그기' }).click(); await 잠깐(600)
  await p.locator('.sheet').screenshot({ path: `${OUT}-2-비번안내.png` })
  // 잠근 뒤 상단바(잠긴 자물쇠)
  const 시트 = p.locator('.sheet')
  for (const c of '1234') { await 시트.getByRole('button', { name: c, exact: true }).click(); await 잠깐(60) }
  await 잠깐(300)
  for (const c of '1234') { await 시트.getByRole('button', { name: c, exact: true }).click(); await 잠깐(60) }
  await 잠깐(400)
  await p.locator('.sheet').screenshot({ path: `${OUT}-3-힌트.png` })
  await 시트.getByRole('button', { name: '잠그기', exact: true }).click(); await 잠깐(700)
  await p.locator('.detail-bar').screenshot({ path: `${OUT}-4-잠긴상단바.png` })
  console.log('찍음:', OUT)
  await b.close()
} finally { 서버.kill() }
