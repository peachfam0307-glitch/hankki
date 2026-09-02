// 📸 서랍 자물쇠 실물 스샷 (임시 · 창업자 판정용)
//   ⚠️ `sellable` 을 «임시로» true 로 켠 빌드에서만 의미가 있다. 찍고 나면 되돌린다.
import { spawn } from 'node:child_process'
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'

const HOST = '127.0.0.1', PORT = 4183, BASE = `http://${HOST}:${PORT}/`
const OUT = process.argv[2]
const s = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'], { cwd: process.cwd() })
const wait = async (u) => { for (let i = 0; i < 120; i++) { try { const r = await fetch(u); if (r.status < 500) return } catch { /* */ } await new Promise((r) => setTimeout(r, 400)) } }
await wait(BASE)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
    'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:giftpack:seen',
    'hankki:news:off'].forEach((k) => {   // 📰 [2026-09-01] 소식 팝업이 화면을 덮는다
    try { localStorage.setItem(k, '1') } catch { /* */ }
  })
})
const p = await ctx.newPage()
p.setDefaultTimeout(15000)
await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
await p.waitForTimeout(2000)

await p.locator('.grid-card button, .grid2 button').first().click()
await p.waitForTimeout(900)
await p.getByText('레시피 꾸미기').first().click()
await p.waitForTimeout(1500)
await p.getByRole('button', { name: '나중에' }).first().click({ timeout: 2500 }).catch(() => {})
await p.waitForTimeout(400)
await p.getByText('데코', { exact: true }).first().click()
await p.waitForTimeout(1500)

// ① 서랍 — 자물쇠 그룹이 맨 위에 오나
await p.screenshot({ path: `${OUT}/lock-1-서랍.png` })

// ② 팩 창 — 배너를 누르면 열린다
await p.locator('button', { hasText: '꾸미기 팩' }).first().click({ timeout: 6000 })
await p.waitForTimeout(1400)
await p.screenshot({ path: `${OUT}/lock-2-팩창.png` })

// ③ 팩 창 안에서 아래로 — 62컷 격자
await p.locator('.sheet div[style*="overflow-y: auto"], .sheet div[style*="overflowY"]').first()
  .evaluate((el) => el.scrollTo({ top: 400 })).catch(() => {})
await p.waitForTimeout(700)
await p.screenshot({ path: `${OUT}/lock-3-격자스크롤.png` })

// ④ 못 사는 상황(웹브라우저) 안내 — 실제로 눌러 본다
await p.locator('button', { hasText: '전부 열기' }).last().click({ timeout: 6000 }).catch(() => {})
await p.waitForTimeout(1600)
await p.screenshot({ path: `${OUT}/lock-4-못삼안내.png` })

console.log('✅ 5장')
await b.close(); s.kill('SIGTERM')
