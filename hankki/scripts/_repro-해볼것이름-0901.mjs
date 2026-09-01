// 🔖🔖 **「책갈피」 → 「해볼 것」 이름이 «여덟 곳 전부»에 갔나** (창업자 확정 2026-09-01)
//
// 📮 창업자 = *"해먹을 것 아니면 **해볼 것** 둘중에 하나."* · *"책갈피는 해볼 것 좋은게 같아 직관적이고."*
//
// ⭐⭐ **심장 = 「화면에 «그려진» 글자에 옛 이름이 한 글자도 안 남았나」**
//    ⛔ 소스를 grep 하면 «주석에 적어둔 옛 이름»까지 걸려 다 고쳐놓고도 실패로 나온다(규칙 18 ⓘ).
//       그래서 `innerText` 와 `aria-label` 만 본다.
//
// ⭐ **이름을 여기 박지 않는다** — `src/favName.js` 에서 읽어 온다.
//    v11.30 「레시피열쇠」 때 게이트 넷이 이름을 박아 뒀다가 이름이 바뀌자 «맞게» 죽었다.
//    여기서 읽으면 다음에 또 바뀌어도 이 판은 안 죽는다.
//
// ⛔⛔ **「도착했나」를 «먼저» 잰다** — 안 간 화면엔 옛 이름도 당연히 없어서
//    **아무것도 안 쟀는데 초록불**이 된다(v11.30 냉장고 화면에서 실제로 그랬다 · 규칙 18 ⓘ).
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-해볼것이름-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { FAV_NAME, FAV_ADD, FAV_REMOVE } from '../src/favName.js'

const 옛이름 = '책갈피'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

let 통과 = 0, 실패 = 0
const 칸 = (이름, ok, 덧 = '') => {
  if (ok) { 통과 += 1; console.log(`  ✅ ${이름}${덧 ? ` — ${덧}` : ''}`) }
  else { 실패 += 1; console.log(`  ⛔ ${이름}${덧 ? ` — ${덧}` : ''}`) }
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

async function 앱열기() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
  return { ctx, p }
}
const 탭으로 = async (p, 이름) => {
  await p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first().click().catch(() => {})
  await p.waitForTimeout(900)
}
// 화면에 «그려진» 글자 전부 + 읽어주는 이름표 전부
const 화면글 = (p) => p.evaluate(() => {
  const t = document.body.innerText || ''
  const a = [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join('\n')
  return `${t}\n${a}`
})

console.log(`🔖 이름 = 「${FAV_NAME}」 (src/favName.js 에서 읽었다) · 옛 이름 = 「${옛이름}」\n`)

// ── ① 꽂은 것이 «있을 때» — 칩 · 카드 이름표 · 도움말 · 상세 ─────────────
{
  const { ctx, p } = await 앱열기()
  await 탭으로(p, '레시피')

  // 꽂기 — 이름표로 찾는다(글자가 아니라). 못 찾으면 아래 칸들이 아무것도 못 잰다
  const 꽂기 = p.locator(`[aria-label*="${FAV_ADD}"]`)
  const 꽂을수 = await 꽂기.count()
  칸('① 카드 「꽂기」 이름표가 새 이름이다', 꽂을수 > 0, `${꽂을수}개 찾음 («${FAV_ADD}»)`)
  for (let i = 0; i < Math.min(꽂을수, 2); i++) { await 꽂기.nth(0).click().catch(() => {}); await p.waitForTimeout(350) }

  const 뺀이름표 = await p.locator(`[aria-label*="${FAV_REMOVE}"]`).count()
  칸('② 꽂힌 카드 「빼기」 이름표가 새 이름이다', 뺀이름표 > 0, `${뺀이름표}개 («${FAV_REMOVE}»)`)

  // 칩 — favCount>0 이라야 뜬다. 먼저 «있나»를 재고 그 다음 «이름»을 본다
  const 칩글 = await p.evaluate(() => [...document.querySelectorAll('.pill')].map((e) => e.innerText.trim()))
  const 칩 = 칩글.find((t) => t.startsWith(FAV_NAME))
  칸('③ 레시피 필터 칩이 새 이름이다', !!칩, 칩 ? `「${칩}」 · 줄 전체 = ${칩글.join(' / ')}` : `칩 줄 = ${칩글.join(' / ')}`)
  // ⭐ 이 이름을 고른 «이유» 자체가 여기 있다 — 옆 칩 「자주」와 낱말이 안 겹쳐야 한다
  칸('④ 옆 칩 「자주」와 낱말이 안 겹친다', !FAV_NAME.includes('해먹'), `「${FAV_NAME}」 ↔ 「자주(＝자주 해먹는 요리)」`)

  // 도움말 시트
  await p.locator('[aria-label*="사용법"], [aria-label*="도움말"]').first().click().catch(() => {})
  await p.waitForTimeout(800)
  const 도움말 = await 화면글(p)
  칸('⑤ 레시피 도움말에 새 이름이 있다', 도움말.includes(FAV_NAME))
  칸('⑥ 레시피 도움말에 옛 이름이 «없다»', !도움말.includes(옛이름))
  // ⛔⛔ 도움말 시트는 **Escape 로 안 닫힌다** — `TabTips` 는 「닫기」 단추·덮개 클릭·뒤로가기만 받는다.
  //    Escape 만 누르고 넘어가면 덮개(.sheet-mask)가 남아 **다음 클릭을 통째로 삼킨다** →
  //    상세로 못 가고, 그런데 「옛 이름 없다」 칸은 초록불이 된다(안 간 화면엔 옛 이름도 없으니까 · 규칙 18 ⓘ).
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.locator('.sheet button').filter({ hasText: '닫기' }).first().click().catch(() => {})
    await p.waitForTimeout(450)
  }
  칸('⑦ 도움말 시트가 닫혔다(다음 칸이 헛돌지 않게)', (await p.locator('.sheet-mask').count()) === 0)

  // 레시피 상세 하단 단추
  // ⛔ `.screen button` 으로 찾으면 «필터 칩(.pill)»이 먼저 걸려 상세로 못 간다 —
  //    그러면 ⑧⑨ 가 «아무것도 안 재고» ⑨만 초록불이 된다(규칙 18 ⓘ). 카드를 콕 집는다.
  await p.locator('.grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 상세이름표 = await p.evaluate(() => [...document.querySelectorAll('.bar-btn[aria-label]')].map((e) => e.getAttribute('aria-label')))
  칸('⑧ 레시피 상세에 «도착했다»', 상세이름표.length >= 4, `아래 단추 ${상세이름표.length}개`)
  칸('⑨ 레시피 상세 단추 이름표가 새 이름이다', 상세이름표.includes(FAV_NAME), `= ${상세이름표.join(' / ')}`)

  const 전부 = await 화면글(p)
  칸('⑩ 레시피 상세 어디에도 옛 이름이 «없다»', !전부.includes(옛이름))
  await ctx.close()
}

// ── ② 꽂은 것이 «없을 때» — 설정 메뉴 · 통계 · 모아보기 화면 · 빈 칸 ──────
{
  const { ctx, p } = await 앱열기()
  await 탭으로(p, '홈')
  await p.locator('[aria-label*="설정"]').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 설정글 = await 화면글(p)
  칸('⑪ 설정에 새 이름이 있다(메뉴 ＋ 통계)', 설정글.includes(FAV_NAME))
  칸('⑫ 설정 어디에도 옛 이름이 «없다»', !설정글.includes(옛이름))

  // 설정 → 그 메뉴를 눌러 모아보기 화면으로
  // ⛔ 설정엔 이 이름이 «둘»이다 — 메뉴 줄(.opt-row)과 통계 칸. 통계 칸은 눌러도 안 열린다.
  await p.locator('.opt-row').filter({ hasText: FAV_NAME }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 제목 = await p.evaluate(() => document.querySelector('.topbar-title, .topbar h1, header')?.innerText?.trim() || '')
  const 모아보기 = await 화면글(p)
  // ⛔ 「도착했나」부터 — 화면이 안 바뀌었으면 아래 칸은 헛것이다
  const 도착 = 모아보기.includes('레시피 카드 오른쪽 위를 눌러보세요') || 제목.includes(FAV_NAME)
  칸('⑬ 모아보기 화면에 «도착했다»', 도착, `제목 = 「${제목}」`)
  칸('⑭ 빈 칸 안내가 새 이름이다', 모아보기.includes(`아직 ${FAV_NAME}에 꽂은 레시피가 없어요`))
  칸('⑮ 모아보기 화면 어디에도 옛 이름이 «없다»', !모아보기.includes(옛이름))
  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
