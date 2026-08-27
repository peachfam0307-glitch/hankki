// 🔎 `_repro-레꾸겹침-0823` ①-b 가 왜 죽나 — 저장 «직후»부터 시간을 두고 여러 번 읽는다
//    ⭐ 재는 것 = 「카드표지로()의 decor: [] 가 저장됐다가 «되살아나나»」
//    ⛔ 짐작 금지 — 값이 언제 바뀌는지 눈으로 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}
const PORT = Number(process.env.PORT || 4433)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage()
page.setDefaultTimeout(20000)
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await page.goto(url); await page.waitForTimeout(1600)

const 대상 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => (x.decorBg || '') === 'sea') || s.recipes[0]
  r.decor = [{ id: 'z1', key: 'gp_gomhi', x: 40, y: 40, s: 1, r: 0 }, { id: 'z2', key: 'gp_pengv', x: 60, y: 60, s: 1, r: 0 }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { id: r.id, title: r.title, seed: String(r.id).startsWith('basic-') }
})
console.log(`대상 = 「${대상.title}」 id=${대상.id} 시드=${대상.seed}`)

await page.goto(url); await page.waitForTimeout(1600)
await page.getByText('레꾸자랑', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 대상.title }).first().locator('button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click(); await page.waitForTimeout(2500)
await page.getByText('이 카드를 내 레시피 표지로').click()

const 읽기 = () => page.evaluate((id) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => x.id === id)
  return { decor: (r.decor || []).length, thumb: r.thumb, img: !!r.image }
}, 대상.id)

for (const ms of [200, 500, 1000, 2000, 4000, 8000]) {
  await page.waitForTimeout(ms === 200 ? 200 : ms / 2)
  const v = await 읽기()
  console.log(`  +${ms}ms  decor=${v.decor}  thumb=${v.thumb}  img=${v.img}`)
}
await b.close()
