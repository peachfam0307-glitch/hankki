// 🎴🎴 [2026-09-15] **레꾸자랑 길 — 어디서 끊기나** 를 눌러서 찍는다.
//
// 📮 창업자 = *"근본적인 의문이 생기네"* — 후크가 없는 건가, 길이 막힌 건가.
//
// 🔢 왜 재나 (09-15 GA4 실측)
//    · `brag` = 3명 · **17초**  ← 들어와서 17초 만에 나간다
//    · `brag_shared` = **0건**  ← 9/14 에 심은 계측인데 오늘 아무도 안 보냈다
//    ⛔ **「후크가 없다」인지 「길이 막혔다」인지 아직 모른다.** 그래서 «고치기 전에» 잰다(규칙 7·25).
//
// ⛔ 이 판은 **찍고 재기만 한다.** 앱 소스는 한 글자도 안 고친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4507, r))
const OUT = process.env.SHOT_OUT || '/tmp/자랑길'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

let 순번 = 0
const 발자국 = []
async function 찍기(p, 이름, 누름) {
  순번 += 1
  await p.waitForTimeout(700)
  const m = await p.evaluate(() => {
    const 보임 = (e) => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false
      const st = getComputedStyle(e); return st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05 }
    const 단추 = [...document.querySelectorAll('button,[role="button"]')].filter(보임)
      .map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean)
    return { 단추: [...new Set(단추)].slice(0, 14), 글줄: (document.body.innerText || '').split('\n').filter((s) => s.trim()).length }
  })
  await p.screenshot({ path: join(OUT, `${String(순번).padStart(2, '0')}-${이름}.jpg`), type: 'jpeg', quality: 74 })
  발자국.push({ 순번, 이름, 누름, ...m })
  console.log(`\n📸 ${순번}. ${이름}  (여기까지 누른 횟수 = ${누름})`)
  console.log(`   단추 = ${JSON.stringify(m.단추)}`)
  return m
}

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4507/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600); await 치우기(p)

let 누름 = 0
await 찍기(p, '홈', 누름)

// ① 레꾸자랑 탭
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레꾸자랑' }).first().click(); 누름 += 1
await p.waitForTimeout(1000); await 치우기(p)
await 찍기(p, '레꾸자랑-탭', 누름)

// ② 카드 하나 고르기
const 카드 = p.locator('.grid-card').first()
if (await 카드.count()) {
  await 카드.click(); 누름 += 1
  await p.waitForTimeout(1200); await 치우기(p)
  await 찍기(p, '카드-골랐다', 누름)
} else { console.log('   ⛔ 자랑할 카드가 없다') }

// ③ 화면에 「공유·자랑·보내기」 단추가 있나 — 있으면 누른다
for (let i = 0; i < 3; i++) {
  const 것 = p.locator('button', { hasText: /공유|자랑|보내기|저장/ }).first()
  if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
  const 글자 = (await 것.innerText()).trim().slice(0, 12)
  try { await 것.click({ timeout: 3000 }); 누름 += 1; await p.waitForTimeout(1400) } catch { break }
  await 치우기(p)
  await 찍기(p, `눌렀다-${글자}`, 누름)
}

console.log(`\n${'='.repeat(60)}\n  📋 몇 번 눌러야 자랑이 나가나 = ${누름}번\n${'='.repeat(60)}`)
for (const f of 발자국) console.log(`  ${String(f.순번).padStart(2)} ${f.이름.padEnd(18)} 누름 ${f.누름} · 글 ${f.글줄}줄`)
console.log(`\n📂 ${OUT}`)
await ctx.close(); await b.close(); srv.close()
