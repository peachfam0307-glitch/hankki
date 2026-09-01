// 🍂🔝 **「가을 무료팩이 꾸미기에서 다 젤 위에 있나」를 «재서» 답한다** (2026-09-01)
//
// 📮 창업자 = *"가을무료팩 꾸미기에서 다 젤 위에 있지??"*
//
// ⛔⛔ **코드를 읽고 답하지 않는다.** 서랍 정렬은 조건이 다섯 겹이고(선물 → 자물쇠 → 제철 → 리컬러),
//    `seasonsNow()` 가 **9/1~9/14 는 여름도 «제철»로 친다**(전환기 14일). 머리로 풀면 틀린다.
//    → **살아 있는 앱을 띄워 탭마다 «그려진 순서»를 읽는다**(절대원칙 30).
//
// 🔢 재는 것 = 탭마다 그룹 이름을 «위에서부터» 늘어놓고, 가을 그룹이 «연달아 맨 위»인가.
//    ⭐ 「맨 위」의 뜻을 좁힌다 = **가을보다 위에 «가을이 아닌 것»이 있으면 아니다.**
//       단 «선물»은 예외로 센다 — 선물이 맨 위인 건 창업자가 2026-08-03 에 확정한 규칙이다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-가을맨위인가-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/가을맨위'
mkdirSync(OUT, { recursive: true })
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

// 🍂 «가을 그룹»이 무엇인지는 짐작하지 않고 소스에서 읽는다
const { STICKER_GROUPS } = await import('../src/components/Stickers.jsx')
const 가을라벨 = new Set(STICKER_GROUPS.filter((g) => g.season === 'autumn').map((g) => g.label))
const 선물라벨 = new Set(STICKER_GROUPS.filter((g) => g.gift).map((g) => g.label))
const 계절 = new Map(STICKER_GROUPS.map((g) => [g.label, g.season || '—']))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }

await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(900)
await p.evaluate(() => {
  const c = [...document.querySelectorAll('button, a')].find((x) => x.querySelector('img') && (x.innerText || '').trim().length > 1)
  c?.click()
})
await p.waitForTimeout(1100)
const 문 = await p.evaluate(() => {
  const c = [...document.querySelectorAll('button, [role="button"]')]
    .find((x) => /^(꾸미기|레시피 꾸미기|일기 꾸미기)$/.test((x.innerText || '').trim()))
  if (!c) return null; c.click(); return (c.innerText || '').trim()
})
await p.waitForTimeout(1500)
if (!문) { console.error('✗ 꾸미기 입구를 못 찾았다 — ⛔여기서 판정하지 않는다'); await b.close(); srv.close(); process.exit(2) }
for (let i = 0; i < 5; i++) {
  const 닫음 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('button')].find((x) => /나중에 볼게요|닫기/.test((x.innerText || '').trim()))
    if (!c) return false; c.click(); return true
  })
  if (!닫음) break
  await p.waitForTimeout(400)
}

// 🧭 서랍 탭 이름을 «화면에서» 읽는다 — 손으로 적으면 낡는다
const 탭들 = await p.evaluate(() => [...document.querySelectorAll('.decor-drawer .decor-cats button, .decor-editor .decor-cats button')]
  .map((x) => (x.innerText || '').trim()).filter(Boolean))
console.log(`\n🚪 들어간 문 「${문}」 · 탭 = ${탭들.join(' · ')}`)

let 모두맨위 = true
for (const t of 탭들) {
  const 갔다 = await p.evaluate((name) => {
    const c = [...document.querySelectorAll('.decor-drawer button, .decor-editor button')].find((x) => (x.innerText || '').trim() === name)
    if (!c) return false; c.click(); return true
  }, t)
  if (!갔다) { console.log(`\n📁 ${t} — ⛔ 탭을 못 눌렀다`); continue }
  await p.waitForTimeout(700)
  // ⭐ 그룹 이름표(`decor-sec-label`)를 «그려진 순서»대로 읽는다.
  //    ⛔ 「선물」 택 글자가 이름표 «안»에 있어서 그대로 읽으면 이름이 「가을의 정원 세트출시기념 선물」이 된다
  //       → `decor-gift-tag` 를 떼고 읽는다(그러라고 붙여둔 클래스다).
  const 줄 = await p.evaluate(() => [...document.querySelectorAll('.decor-sec-label')].map((e) => {
    const c = e.cloneNode(true)
    c.querySelectorAll('.decor-gift-tag, .decor-sec-n').forEach((x) => x.remove())
    return (c.innerText || '').trim()
  }).filter(Boolean))
  if (!줄.length) { console.log(`\n📁 ${t} — (그룹 없음)`); continue }

  const 가을 = 줄.filter((n) => 가을라벨.has(n))
  if (!가을.length) { console.log(`\n📁 ${t} — 가을 그룹 없음 (${줄.length}묶음)`); continue }

  // 🔝 가을보다 «위»에 있는 것 중 선물이 아닌 것 = 「맨 위가 아니다」의 증거
  const 첫가을 = 줄.findIndex((n) => 가을라벨.has(n))
  const 위에낀것 = 줄.slice(0, 첫가을).filter((n) => !선물라벨.has(n))
  // 🔗 가을끼리 «붙어» 있나 — 사이에 딴 게 끼면 그것도 「다 맨 위」가 아니다
  const 마지막가을 = 줄.length - 1 - [...줄].reverse().findIndex((n) => 가을라벨.has(n))
  const 사이에낀것 = 줄.slice(첫가을, 마지막가을 + 1).filter((n) => !가을라벨.has(n))

  const ok = !위에낀것.length && !사이에낀것.length
  if (!ok) 모두맨위 = false
  console.log(`\n📁 ${t} — 가을 ${가을.length}묶음 ${ok ? '✅ 맨 위' : '⛔ 맨 위가 아니다'}`)
  줄.forEach((n, i) => {
    const 표 = 가을라벨.has(n) ? '🍂' : 선물라벨.has(n) ? '🎁' : '  '
    console.log(`   ${String(i + 1).padStart(2)}. ${표} ${n}   (${계절.get(n) || '—'})`)
  })
  if (위에낀것.length) console.log(`   ⛔ 가을 «위»에 낀 것 = ${위에낀것.join(' · ')}`)
  if (사이에낀것.length) console.log(`   ⛔ 가을 «사이»에 낀 것 = ${사이에낀것.join(' · ')}`)
  await p.screenshot({ path: join(OUT, `${t}.png`) })
}

console.log(`\n${모두맨위 ? '✅' : '⛔'} 판정 = 가을이 ${모두맨위 ? '탭마다 맨 위에 «연달아» 있다(선물만 그 위)' : '어떤 탭에선 맨 위가 아니다'}`)
console.log(`🖼 캡처 = ${OUT}`)
await b.close(); srv.close()
