// 🎨📏 **「패드는 스티커가 좀 더 커도 되겠다 자리가 많이 남네」를 «재서» 답한다** (2026-09-01)
//
// 📮 창업자 = *"패드는 스티커가 좀 더 커도 되겠다 자리가 많이 남네"*
//
// 🔢 재는 것 = ⑴서랍 폭 ⑵한 줄 칸 수 ⑶칸 «크기»(＝스티커가 실제로 그려지는 px)
//              ⑷한 화면에 보이는 스티커 수 — 칸을 키우면 이게 줄어드는데 «얼마나» 줄어드나
//
// ⭐⭐ 후보값을 **살아 있는 앱에 갈아끼워** 잰다(절대원칙 30) — 흉내가 아니다.
//    `.decor-grid` 의 `minmax(52px, …)` 를 바꿔 보며 네 화면에서 값을 뽑는다.
//
// ⛔ 폰(390×844)도 «같이» 잰다 — 창업자가 말한 건 패드다. **폰이 나빠지면 그 값은 못 쓴다.**
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-패드스티커크기-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드스티커'
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

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

const 화면들 = [
  { 이름: '폰 세로', w: 390, h: 844 },
  { 이름: '패드 세로', w: 800, h: 1280 },
  { 이름: '패드 가로', w: 1280, h: 800 },
]
const 후보 = [52, 64, 72, 84, 96]

// 🚪 레꾸(레시피 꾸미기)까지 들어간다
async function 레꾸로(p) {
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(900)
  // 레시피 한 편 열기
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, a')].find((x) => x.querySelector('img') && (x.innerText || '').trim().length > 1)
    c?.click()
  })
  await p.waitForTimeout(1100)
  // ⛔ 「꾸미기」 입구 이름을 짐작하지 않는다 — 화면 글자에서 찾는다(레꾸는 「레시피 꾸미기」다)
  const 문 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, [role="button"]')]
      .find((x) => /^(꾸미기|레시피 꾸미기|일기 꾸미기)$/.test((x.innerText || '').trim()))
    if (!c) return null
    c.click(); return (c.innerText || '').trim()
  })
  await p.waitForTimeout(1500)
  // 안내 시트(선물·팩)가 서랍 위에 뜬다 — 걷어낸다
  for (let i = 0; i < 5; i++) {
    const 닫음 = await p.evaluate(() => {
      const c = [...document.querySelectorAll('button')].find((x) => /나중에 볼게요|닫기/.test((x.innerText || '').trim()))
      if (!c) return false; c.click(); return true
    })
    if (!닫음) break
    await p.waitForTimeout(450)
  }
  // ⛔⛔ 레꾸 서랍의 «첫 탭»은 「배경」이라 `.decor-grid` 가 0개다 — 첫 판이 그래서
  //    「서랍을 못 찾았다」를 다섯 번 찍었다(규칙 18 = 「없다」가 아니라 «내가 안 간 것»이었다).
  //    → 스티커 격자가 있는 「데코」 탭으로 옮긴다.
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('.decor-drawer button, .decor-editor button')]
      .find((x) => (x.innerText || '').trim() === '데코')
    c?.click()
  })
  await p.waitForTimeout(900)
  return 문
}

// 📏 지금 화면의 서랍 값을 잰다
const 재기 = (p) => p.evaluate(() => {
  const g = document.querySelector('.decor-grid:not(.wordy)')
  if (!g) return null
  const r = g.getBoundingClientRect()
  const 칸 = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean)
  const 셀 = g.querySelector('.decor-cell')
  const 굴칸 = g.closest('.decor-drawer') || g.parentElement
  const gr = 굴칸.getBoundingClientRect()
  // 화면에 «실제로 보이는» 스티커 = 굴칸 안에 들어와 있는 칸
  const 보임 = [...document.querySelectorAll('.decor-cell')].filter((c) => {
    const b = c.getBoundingClientRect()
    return b.bottom > gr.top + 1 && b.top < gr.bottom - 1 && b.width > 0
  }).length
  return { 서랍폭: Math.round(r.width), 칸수: 칸.length, 칸크기: 셀 ? +셀.getBoundingClientRect().width.toFixed(1) : 0, 굴칸높이: Math.round(gr.height), 보임 }
})

for (const v of 화면들) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  const 문 = await 레꾸로(p)
  if (!문) { console.error(`✗ ${v.이름} — 꾸미기 입구를 못 찾았다 ⛔여기서 판정하지 않는다`); await ctx.close(); continue }

  // ⛔ 「못 찾았다」를 만나면 «내 확인 방식»부터 의심한다(규칙 18) → 늘 찍고, 무엇이 있는지 찍는다
  await p.screenshot({ path: join(OUT, `${v.이름.replace(/\s/g, '')}-들어간직후.png`) })
  const 있는것 = await p.evaluate(() => ({
    grid: document.querySelectorAll('.decor-grid').length,
    cell: document.querySelectorAll('.decor-cell').length,
    drawer: document.querySelectorAll('.decor-drawer').length,
    편집기: document.querySelectorAll('.decor-editor').length,
    글자: (document.body.innerText || '').replace(/\n+/g, ' / ').slice(0, 160),
  }))
  console.log(`\n📱 ${v.이름} (${v.w}×${v.h}) — 들어간 문 「${문}」`)
  console.log(`   🔎 grid ${있는것.grid} · cell ${있는것.cell} · drawer ${있는것.drawer} · editor ${있는것.편집기}`)
  console.log(`   📄 ${있는것.글자}`)
  console.log('   최소칸 │ 서랍폭 │ 줄칸수 │ 칸크기 │ 보이는 스티커')
  // ⭐ 맨 먼저 «지금 앱 그대로» — 고친 값이 진짜 먹었는지는 이 줄이 답한다(주입 전에 잰다)
  {
    const r = await 재기(p)
    if (r) console.log(`   ⭐지금 │ ${String(r.서랍폭).padStart(5)}px │ ${String(r.칸수).padStart(5)} │ ${String(r.칸크기).padStart(5)}px │ ${String(r.보임).padStart(3)}개  (굴칸 ${r.굴칸높이}px)`)
    await p.screenshot({ path: join(OUT, `${v.이름.replace(/\s/g, '')}-지금.png`) })
  }
  for (const m of 후보) {
    await p.addStyleTag({ content: `.decor-grid:not(.wordy){grid-template-columns:repeat(auto-fill,minmax(${m}px,1fr))!important}` })
    await p.waitForTimeout(260)
    const r = await 재기(p)
    if (!r) { console.log(`   ${String(m).padStart(5)}px │ ⛔ 서랍을 못 찾았다`); continue }
    console.log(`   ${String(m).padStart(5)}px │ ${String(r.서랍폭).padStart(5)}px │ ${String(r.칸수).padStart(5)} │ ${String(r.칸크기).padStart(5)}px │ ${String(r.보임).padStart(3)}개  (굴칸 ${r.굴칸높이}px)`)
    await p.screenshot({ path: join(OUT, `${v.이름.replace(/\s/g, '')}-${m}.png`) })
  }
  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n🖼 캡처 = ${OUT}`)
