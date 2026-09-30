// 📉 백업에서 «손 안 댄 기본 레시피»를 빼도 잃는 게 없나 — 복사 → 새 폰에 붙여넣기 → 전부 돌아오나 (2026-09-30)
//   📮 창업자 = *"C는 땜빵하는거 아냐? 계속 반복될 문제면 다시 설계해야할 것 같은데"* → 설계 ①「ㄱㄱ」
//   ⭐ 재는 것 = ①막 깐 폰 백업이 작아졌나 ②즐겨찾기한 기본 편은 «통째로» 담기나 ③지운 기본 편은 번호에도 없나
//      ④새 폰에 붙여 넣으면 편 수·즐겨찾기가 그대로 돌아오나 ⑤확인 창이 «전체 편 수»를 말하나 ⑥옛(통짜) 백업도 되나
//      ⑦클라우드는 안 건드렸나(CloudSheet 에 buildBackup 그대로)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
// 🍎 OLD_DIST = 옛 판(예: 아이폰 1.1.1 에 구운 v14.24)을 띄운 서버 — 「새 백업을 옛 앱이 받으면」을 잰다(⑧)
const OLD_DIST = process.env.OLD_DIST
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4392, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push(통과); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

const HOOKS = () => {
  window.__clipText = ''
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__clipText = t } } })
}
const 새폰 = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.addInitScript(HOOKS)
  await p.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  return { ctx, p }
}
const 백업시트 = async (p) => {
  const 설정 = p.getByLabel('설정').first()
  if (await 설정.count()) { await 설정.click().catch(() => {}); await p.waitForTimeout(900) }
  await p.getByText('백업 · 내보내기', { exact: true }).first().click()
  await p.waitForTimeout(800)
}
const 판 = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1')))

// ── 폰 A: 기본 편 하나 즐겨찾기 · 하나 지우기 → 다시 열어서 복사
const A = await 새폰()
const 처음 = await 판(A.p)
const 즐찾 = 처음.recipes.find((r) => String(r.id).startsWith('basic-')).id
const 지울 = 처음.recipes.filter((r) => String(r.id).startsWith('basic-'))[5].id
await A.p.evaluate(([f, d]) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  s.recipes = s.recipes.map((r) => (r.id === f ? { ...r, favorite: true } : r)).filter((r) => r.id !== d)
  s.removedSeedIds = [...(s.removedSeedIds || []), d]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, [즐찾, 지울])
const A2 = await A.ctx.newPage()
await A2.addInitScript(SEED_COACH_SEEN); await A2.addInitScript(HOOKS)
await A2.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' }); await A2.waitForTimeout(1200)
await A.p.close()
const A판 = await 판(A2)
const 통짜 = JSON.stringify(A판).length
await 백업시트(A2)
await A2.getByText(/백업 코드 복사/).first().click()
await A2.waitForTimeout(700)
// 🔒 작은백업켬 = false(1단계 · 아이폰 1.1.2 승인 전)면 앱은 통짜를 만들어 복사를 안 부른다 →
//    «읽는 쪽»을 재려고 같은 함수(기본빼기)로 작은 백업을 여기서 만든다. 켜지면 앱이 만든 것을 그대로 쓴다.
const { 작은백업켬, 기본빼기 } = await import('../src/backupSlim.js')
const { allBasicRecipes } = await import('../src/data/basics.js')
const 앱코드 = await A2.evaluate(() => window.__clipText)
if (!작은백업켬) 재('⓪ (작은 백업 꺼짐) 앱은 복사를 안 부르나 — 통짜라 크다', !앱코드, 앱코드 ? '⛔ 복사했다' : '안 불렀다 — 스위치가 꺼져 있다')
const 코드 = 작은백업켬 ? 앱코드 : JSON.stringify(기본빼기({ ...A판, _app: 'hankki', _v: 2 }, allBasicRecipes))
const 백업 = 코드 ? JSON.parse(코드) : {}
재('① 작은 백업이 작나', 코드.length > 0 && 코드.length < 20 * 1024,
  `${(코드.length / 1024).toFixed(1)}KB (폰 저장본 ${(통짜 / 1024).toFixed(1)}KB) · 담긴 편 ${백업.recipes?.length} · 번호만 ${백업._빠진기본?.length}`)
const 담긴즐찾 = (백업.recipes || []).find((r) => r.id === 즐찾)
재('② 즐겨찾기한 기본 편은 통째로 담기나', !!담긴즐찾 && 담긴즐찾.favorite === true && !(백업._빠진기본 || []).includes(즐찾), 즐찾)
재('③ 지운 기본 편은 어디에도 없고 «지운 목록»에 있나',
  !(백업._빠진기본 || []).includes(지울) && !(백업.recipes || []).some((r) => r.id === 지울) && (백업.removedSeedIds || []).includes(지울), 지울)
await A.ctx.close()

// ── 폰 B: 막 깐 새 폰에 붙여 넣기
const B = await 새폰()
await 백업시트(B.p)
await B.p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).click()
await B.p.waitForTimeout(500)
await B.p.locator('textarea').first().fill(코드)
await B.p.getByRole('button', { name: '불러오기', exact: true }).last().click()
await B.p.waitForTimeout(600)
const 확인글 = await B.p.locator('text=/레시피 \\d+개가 담긴 백업/').first().textContent().catch(() => '')
if (process.env.SHOT) await B.p.screenshot({ path: process.env.SHOT })
재('⑤ 확인 창이 «전체 편 수»를 말하나', 확인글.includes(`레시피 ${A판.recipes.length}개`), 확인글 || '(창 못 찾음)')
await B.p.getByRole('button', { name: '불러오기', exact: true }).last().click()
await B.p.waitForTimeout(900)
const B판 = await 판(B.p)
const 같은편 = A판.recipes.map((r) => r.id).sort().join() === B판.recipes.map((r) => r.id).sort().join()
재('④ 새 폰에서 편이 «그대로» 돌아오나', 같은편, `A ${A판.recipes.length}편 → B ${B판.recipes.length}편`)
재('④ 즐겨찾기도 그대로인가', B판.recipes.find((r) => r.id === 즐찾)?.favorite === true, 즐찾)
재('④ 지운 편은 안 되살아났나', !B판.recipes.some((r) => r.id === 지울), 지울)
await B.ctx.close()

// ── 폰 C: 옛(통짜) 백업도 되나
const C = await 새폰()
const 옛백업 = JSON.stringify({ ...A판, _app: 'hankki', _v: 2 })
await 백업시트(C.p)
await C.p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).click()
await C.p.waitForTimeout(500)
await C.p.locator('textarea').first().fill(옛백업)
await C.p.getByRole('button', { name: '불러오기', exact: true }).last().click()
await C.p.waitForTimeout(600)
await C.p.getByRole('button', { name: '불러오기', exact: true }).last().click()
await C.p.waitForTimeout(900)
const C판 = await 판(C.p)
재('⑥ 옛(통짜) 백업도 그대로 되나', C판.recipes.length === A판.recipes.length, `${C판.recipes.length}편`)
await C.ctx.close()

// ── ⑧ 옛 앱(OLD_DIST)이 새 백업을 받으면 — 바로 / 다시 켠 뒤 편 수
if (OLD_DIST) {
  const 옛srv = createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
    let body, type = MIME[extname(p)] || 'application/octet-stream'
    try { body = readFileSync(join(OLD_DIST, p)) } catch { body = readFileSync(join(OLD_DIST, 'index.html')); type = 'text/html' }
    s.writeHead(200, { 'content-type': type }); s.end(body)
  })
  await new Promise((r) => 옛srv.listen(4393, r))
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  await 백업시트(p)
  await p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).click(); await p.waitForTimeout(500)
  await p.locator('textarea').first().fill(코드)
  await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await p.waitForTimeout(600)
  const 옛확인 = await p.locator('text=/레시피 \\d+개가 담긴 백업/').first().textContent().catch(() => '')
  await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await p.waitForTimeout(900)
  const 바로 = (await 판(p)).recipes.length
  const p2 = await ctx.newPage(); await p2.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' }); await p2.waitForTimeout(1200)
  const 다시 = (await 판(p2)).recipes.length
  console.log(`   🍎 옛 앱: 확인 창 「${(옛확인 || '').split('\\n')[0]}」 · 불러온 직후 ${바로}편 · 다시 켠 뒤 ${다시}편 (원래 ${A판.recipes.length}편)`)
  await ctx.close(); 옛srv.close()
}

// ── ⑦ 클라우드는 안 건드렸나 (정적)
const src = readFileSync(join(ROOT, 'src/screens/ProfileScreen.jsx'), 'utf8')
재('⑦ 클라우드엔 «뺀 판»이 안 가나', /백업만들기=\{buildBackup\}/.test(src) && !/백업만들기=\{buildExport\}/.test(src), 'CloudSheet 백업만들기={buildBackup}')

await b.close(); srv.close()
const 통과 = 결과.filter(Boolean).length
console.log(`\n${'─'.repeat(46)}\n통과 ${통과} / ${결과.length}`)
process.exit(통과 === 결과.length ? 0 : 1)
