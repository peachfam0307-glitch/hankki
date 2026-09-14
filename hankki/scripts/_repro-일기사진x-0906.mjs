// 🗑📷 **「일기 사진 ✕ 가 어디서 뜨나」** 재현판 (2026-09-06)
//
// 📮 창업자 폰 제보 00:25 *"나갔다 들어와도 x가 보여 수정해야겠다"* · 00:28 *"데코스티커를 추가하면 x표시 뜨는 바로 옆에 붙어
//    스티커를 움직이면 사진이 움직이거나 스티커가 사라져서 불편해"* → 00:30 *"고쳐"*
// ⭐ 심장 = 「목록을 고쳤나」가 아니라 **「화면에 뜨나」**(규칙 18 ⓘ). 세 화면을 진짜 앱에서 연다:
//    ① 일기 날짜 화면 = ✕ 0개   ② 꾸미기 · 스티커 탭 = ✕ 0개   ③ 꾸미기 · 속지 탭 = ✕ 1개(지우는 길은 살아 있어야 한다)
// 🧪 규칙 12 = PaperSheet 의 `photoClear &&` 를 빼면 ①②가, DecorEditor 의 cloneElement 를 빼면 ③이 죽는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`
const { SEED_COACH_SEEN } = await import('../src/coach.js')

// 1×1 png — 사진칸에 «무언가» 들어 있어야 ✕ 후보가 생긴다
const 점 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((사진) => {
  try {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
    st.diary = [{ id: 'x-repro', kind: 'diary', at: 오늘.getTime(), paper: { rule: 'plain', skin: 'kraft', art: 'today' }, ph_today: 사진, title: '갈비탕', note: 'x', decor: [] }]
    localStorage.setItem('hankki:v1', JSON.stringify(st))
  } catch {}
}, 점)
const p = await ctx.newPage(); p.setDefaultTimeout(8000)
await p.goto(집, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
for (const 글자 of ['나중에 볼게요', '닫기']) { const t = p.getByRole('button', { name: 글자 }).first(); if (await t.count()) await t.click().catch(() => {}) }

let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }
const 엑스수 = () => p.getByRole('button', { name: '사진 지우기' }).count()

await p.locator('.bottom-nav .nav-item').filter({ hasText: '일기' }).first().click(); await p.waitForTimeout(1200)
// ⭐ 심은 일기는 앱 초기화가 덮어썼다(저장된 diary = 샘플 하나) → «샘플 일기»(어제 · 불고기 사진 ph_snap)를 그대로 쓴다. 사진이 있는 진짜 일기라 더 맞다.
const 어제 = new Date(); 어제.setDate(어제.getDate() - 1); const D = 어제.getDate()
await p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: new RegExp(`^${D}$`) }) }).first().click(); await p.waitForTimeout(1200)
const 사진있나 = await p.locator('img[alt=""]').count()
적기(사진있나 > 0, `사진칸에 사진이 들어 있다(img ${사진있나})`)
적기((await 엑스수()) === 0, `① 날짜 화면 — 사진 ✕ 0개 (전엔 늘 떴다)`)

await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1500)
// ⛔ 「출시 기념 선물」 시트가 저절로 떠서 탭 클릭을 가로챈다(_shot-스토어용화면 과 같은 자리) → 시트 안의 단추로 닫는다
for (let i = 0; i < 3 && await p.locator('.sheet-mask').count(); i++) {
  const b2 = p.locator('.sheet-mask').getByRole('button', { name: /나중에 볼게요|닫기|확인/ }).first()
  if (!(await b2.count())) break
  await b2.click(); await p.waitForTimeout(700)
}
const 스티커탭 = p.locator('.seg').filter({ hasText: /^(일꾸|꾸미기)$/ }).first()
if (await 스티커탭.count()) { await 스티커탭.click(); await p.waitForTimeout(600) }
적기((await 엑스수()) === 0, `② 꾸미기 · 스티커 탭 — 사진 ✕ 0개 (스티커 ✕와 안 붙는다)`)

// ⛔ 「속지」 탭은 사진칸 «없이» 미리보기만 그린다(실측 · 에디터 안 사진 0 · 사진 넣기 0) → 지우는 길은 「글쓰기」 탭에 산다
const 속지탭 = p.locator('.seg').filter({ hasText: /^글쓰기$/ }).first()
적기(await 속지탭.count() > 0, `글쓰기 탭이 있다`)
if (await 속지탭.count()) { await 속지탭.click(); await p.waitForTimeout(600) }
적기((await 엑스수()) === 1, `③ 꾸미기 · 글쓰기 탭 — 사진 ✕ 1개 (지우는 길은 여기 산다)`)

await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}개 틀림` : '\n✅ 일기 사진 ✕ 5칸 통과')
process.exit(bad ? 1 : 0)
