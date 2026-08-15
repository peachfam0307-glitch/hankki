// 📸 통계 칸 실물 캡처 — 규칙 21(보여주기 «전»에 내가 열어서 본다)
//   ⛔ 숫자가 초록불이어도 «가려져 있으면» 모른다 — 2026-08-11 에 온보딩 화면을 홈이라고 보냈다.
//   ✅ 그래서 ①온보딩 끄기 ②코치마크 끄기 ③화면 한가운데를 덮은 게 있나 를 찍기 «전»에 본다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4199
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 140)))

await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
  const now = new Date()
  const 이번달 = (d) => new Date(now.getFullYear(), now.getMonth(), d, 12).getTime()
  const 지난달 = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12).getTime()
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  s.diary = [
    { id: 'd1', at: 지난달, title: '된장찌개', recipeId: 'r1' },
    { id: 'd2', at: 이번달(3), title: '된장찌개', recipeId: 'r1' },
    { id: 'd3', at: 이번달(5), title: '김치찌개', recipeId: 'r2' },
    { id: 'd4', at: 이번달(7), title: '제육볶음', recipeId: 'r3' },
    { id: 'd5', at: 이번달(9), title: '크림파스타', recipeId: 'r4' },
    { id: 'd6', at: 이번달(11), title: '소고기 미역국', recipeId: 'r6' },
  ]
  s.recipes = [
    { id: 'r1', title: '된장찌개', icon: 'fh_k02' },
    { id: 'r2', title: '김치찌개', icon: 'fh_k02' },
    { id: 'r3', title: '제육볶음', icon: 'fh_k11' },
    { id: 'r4', title: '크림파스타', icon: 'fy_y02' },
    { id: 'r6', title: '소고기 미역국', icon: 'fh_k04' },
  ].map((r) => ({ ...r, ingredients: ['재료 1'], steps: ['한 걸음'], category: '한식', folder: '한식', createdAt: Date.now(), updatedAt: Date.now() }))
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.locator('.bottom-nav button', { hasText: '일기' }).first().click()
await p.waitForTimeout(800)

// ⛔ 찍기 «전»에 — 화면 한가운데를 덮은 것이 있나(온보딩·코치마크가 덮으면 엉뚱한 걸 찍는다)
const 덮임 = await p.evaluate(() => {
  const el = document.elementFromPoint(206, 300)
  const 덮개 = el && el.closest('.coach-overlay, .onboarding, .sheet-backdrop')
  return 덮개 ? 덮개.className : null
})
console.log(덮임 ? `⛔ 화면이 덮여 있다 — ${덮임}` : '✅ 덮은 것 없음')

const 띠 = p.locator('.card').filter({ hasText: /이번 달\s*\d+번/ }).first()
await 띠.screenshot({ path: '/tmp/통계-띠.png' })
const 처음 = p.locator('.card').filter({ hasText: '이번 달 처음 만든 요리' }).first()
await 처음.screenshot({ path: '/tmp/통계-처음.png' })
await p.screenshot({ path: '/tmp/통계-화면.png' })

console.log('  띠 =', (await 띠.innerText()).replace(/\s+/g, ' '))
console.log('  처음 =', (await 처음.innerText()).replace(/\s+/g, ' '))
console.log('📸 /tmp/통계-띠.png · /tmp/통계-처음.png · /tmp/통계-화면.png')
await b.close(); srv.kill(); process.exit(0)
