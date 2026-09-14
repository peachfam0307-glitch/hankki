#!/usr/bin/env node
/**
 * 📔🎀 도움말 「?」 실물 확인 — 2026-08-18
 *
 * 📮 창업자 = *"레꾸자랑은 도움말이 없네?"* · *"한끼일기에 도움말에도 책갈피가 있어 잘못쓴것 같은데"*
 *
 * ⭐ 무엇을 보나 — 「있나」가 아니라 **「눌렀을 때 «맞는 것»이 뜨나」**(규칙 18 ⓘ)
 *    ① 레꾸자랑 「?」가 있고 · 누르면 「레꾸자랑 사용법」이 뜬다
 *    ② 한끼 일기 「?」를 누르면 **「한끼 일기 사용법」**이 뜬다(⛔「내 레시피 사용법」이면 실패)
 *    ③ 한끼 일기 도움말에 **「책갈피」가 없다** ← 창업자가 짚은 그것
 *    ④ 레시피(모아보기) 「?」는 그대로 「내 레시피 사용법」이다 — 고치다 반대로 깨뜨리지 않게
 *
 * 돌리는 법: node scripts/_shot-도움말-0818.mjs   (⚠️ npm run build 를 먼저)
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 앱뿌리 = path.join(여기, '..')
const 낼곳 = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const PORT = 4391
// ⛔ `/opt/pw-browsers/chromium` 를 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다
const CHROMIUM = process.env.CHROMIUM_PATH

const { SEED_COACH_SEEN } = await import('../src/coach.js')

const sv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: 앱뿌리, stdio: 'ignore' })
const 기다려 = (ms) => new Promise((r) => setTimeout(r, ms))
await 기다려(3500)

const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
// ⭐ 온보딩·코치마크를 꺼야 화면이 안 가려진다(규칙 21 — 「가려진 것을 숫자는 모른다」)
await p.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await p.addInitScript(SEED_COACH_SEEN)
// ⛔ 첫 판이 `/hankki/` 를 붙여 **JS 가 404** 였다(index.html 만 SPA 폴백으로 와서 화면이 텅 빔).
//    `scripts/smoke.mjs` 가 쓰는 주소는 `http://127.0.0.1:<PORT>/` 다 — 그게 「지금 도는 것」이라 그걸 따른다.
//    📌 규칙 18 — 「앱이 안 뜬다」가 아니라 «내 주소»가 틀렸다.
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await 기다려(900)

const 결과 = []
const 제목읽기 = async () => {
  const t = await p.locator('.sheet, [role="dialog"]').first().locator('h1,h2,h3,.h-title,.sheet-title').first().textContent().catch(() => null)
  return (t || '').trim()
}
const 시트글 = async () => (await p.locator('.sheet, [role="dialog"]').first().textContent().catch(() => '')) || ''
const 시트닫기 = async () => { await p.keyboard.press('Escape').catch(() => {}); await 기다려(400) }

async function 도움말열기(어디) {
  const btn = p.locator('button[aria-label="사용법"]').first()
  const 있나 = await btn.count()
  if (!있나) return { 있나: false }
  await btn.click()
  await 기다려(600)
  const 글 = await 시트글()
  await p.screenshot({ path: path.join(낼곳, `도움말-${어디}.png`) })
  await 시트닫기()
  return { 있나: true, 제목: await 제목읽기(), 글 }
}

// ── ① 레꾸자랑 ─────────────────────────────────────────────
// ⛔ 첫 판이 `button:has-text` 로 못 잡았다 — 하단 탭은 `.nav-item` 안에 <span> 글자다(규칙 18)
await p.locator('.nav-item:has-text("레꾸자랑")').first().click()
await 기다려(800)
const 자랑 = await 도움말열기('레꾸자랑')
결과.push(['레꾸자랑 「?」가 있나', 자랑.있나 ? '✅ 있다' : '⛔ 없다', 자랑.있나])
결과.push(['레꾸자랑 도움말 내용', 자랑.글?.includes('랜덤 카드') ? '✅ 「랜덤 카드」 있음' : '⛔ 못 찾음', !!자랑.글?.includes('랜덤 카드')])

// ── ② 레시피 탭(모아보기) — 그대로여야 한다 ────────────────
await p.locator('.nav-item:has-text("레시피")').first().click()
await 기다려(800)
const 레시피 = await 도움말열기('레시피')
결과.push(['레시피 도움말 = 내 레시피', 레시피.글?.includes('책갈피') ? '✅ 「책갈피」 있음(맞다)' : '⛔ 없다', !!레시피.글?.includes('책갈피')])

// ── ③ 한끼 일기 ────────────────────────────────────────────
// ⭐ 하단 「일기」 탭 = MyRecipesScreen 을 initView="log" 로 연다
await p.locator('.nav-item:has-text("일기")').first().click()
await 기다려(800)
const 일기 = await 도움말열기('한끼일기')
결과.push(['일기 도움말에 「요리 달력」', 일기.글?.includes('요리 달력') ? '✅ 있다' : '⛔ 없다', !!일기.글?.includes('요리 달력')])
결과.push(['일기 도움말에 「책갈피」 없나', 일기.글?.includes('책갈피') ? '⛔ 아직 있다' : '✅ 없다', !일기.글?.includes('책갈피')])
결과.push(['일기 도움말에 「일기 잠금」', 일기.글?.includes('일기 잠금') ? '✅ 있다' : '⛔ 없다', !!일기.글?.includes('일기 잠금')])

console.log('\n──── 도움말 실물 검사 ────')
let 실패 = 0
for (const [무엇, 결, ok] of 결과) { console.log(`  ${ok ? '✅' : '⛔'} ${무엇.padEnd(26)} ${결}`); if (!ok) 실패++ }
console.log(`\n  캡처 = ${낼곳}/도움말-*.png`)
console.log(실패 ? `\n⛔ ${실패}칸 실패` : `\n✅ ${결과.length}/${결과.length} 통과`)

await b.close()
sv.kill()
process.exit(실패 ? 1 : 0)
