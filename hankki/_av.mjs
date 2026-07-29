// 아바타 5인 실제 앱 렌더 검증 — 설정 화면에서 '우리 애들' 그룹이 뜨고, 골랐을 때 상단바까지 바뀌는지
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4198/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4198', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:profile'].forEach((x) => { try { localStorage.setItem(x, '1') } catch { /* noop */ } })
})
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(BASE, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2000)

await p.getByLabel('설정·프로필').or(p.locator('[aria-label*="프로필"]')).first().click()
await p.waitForTimeout(900)
await p.getByLabel('프로필 아이콘 바꾸기').click()
await p.waitForTimeout(700)

const label = await p.getByText('⭐ 우리 애들').isVisible().catch(() => false)
const names = ['꼬르곰', '펭펭', '카롱', '모아', '꼬비']
const shown = []
for (const n of names) shown.push([n, await p.getByRole('button', { name: n, exact: true }).first().isVisible().catch(() => false)])
// 깨진 이미지 확인
const broken = await p.evaluate(() => [...document.images].filter((i) => i.currentSrc.includes('/avatars/') && i.naturalWidth === 0).length)
const found = await p.evaluate(() => [...document.images].filter((i) => i.currentSrc.includes('/avatars/')).length)
console.log(`그룹 라벨 노출 = ${label}`)
console.log(`이름표: ${shown.map(([n, v]) => `${n}=${v ? 'O' : 'X'}`).join(' ')}`)
console.log(`아바타 이미지 ${found}개 · 깨짐 ${broken}개`)
await p.screenshot({ path: '/tmp/av_picker.png', clip: { x: 0, y: 120, width: 430, height: 400 } })

// 꼬르곰 고르기 → 상단바 아바타 반영
await p.getByRole('button', { name: '꼬르곰', exact: true }).first().click()
await p.waitForTimeout(800)
const saved = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('hankki:profile') || '{}')?.avatar } catch { return null } })
console.log('저장된 아바타 =', JSON.stringify(saved))
await p.getByRole('button', { name: /홈/ }).last().click().catch(() => {})
await p.waitForTimeout(900)
const top = await p.evaluate(() => [...document.images].some((i) => i.currentSrc.includes('av_gom')))
console.log('홈 상단바에 꼬르곰 =', top)
await p.screenshot({ path: '/tmp/av_home.png', clip: { x: 0, y: 0, width: 430, height: 160 } })
console.log('pageerror =', errs.length, errs.slice(0, 2))
await b.close(); srv.kill()
