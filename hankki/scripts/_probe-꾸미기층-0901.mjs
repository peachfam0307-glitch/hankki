// 🎨📏 **「지금 꾸미기 화면이 얼마나 복잡한가」를 숫자로 잰다** (2026-09-01)
//
// 📮 창업자 = *"이게 지금보다 덜 복잡할 것 같지 않아?"* (8/07 시안 «안 C» 를 고르며)
//    ⭐ 그건 «느낌»으로 답할 게 아니라 **재서** 답할 것이다(규칙 15·29).
//
// ⛔ 8/07 판 주석이 가리키는 `_measure-꾸미기구조-0807.mjs` 는 **실물이 없다**(그때 커밋이 안 됐다).
//    그래서 그 판에 적힌 값(줄 6개 · 누르는 칸 20개 전부 44px 미달)은 **지금 값이 아니다** —
//    그 뒤 v11.21 「글자2」가 470곳을 키웠다. **다시 잰다.**
//
// 🔢 재는 것 = ⑴조작부가 화면의 몇 %를 먹나 ⑵가로 「층」이 몇 개인가
//              ⑶한 화면에 누를 수 있는 칸이 몇 개인가 ⑷그중 44px 미만이 몇 개인가
//              ⑸알약 «높이»가 몇 가지인가(＝생김새가 몇 갈래로 갈리나)
//
// ⭐ 살아 있는 앱을 띄워 잰다 — 흉내가 아니다(절대원칙 30).
// 실행: node /home/user/hankki/hankki/scripts/_probe-꾸미기층-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

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
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }

// ── 일기 → 한 장 열기 → 꾸미기 ───────────────────────────────
await p.locator('.nav-item', { hasText: '일기' }).first().click()
await p.waitForTimeout(1000)
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.querySelector('svg') && /^\d+$/.test((x.innerText || '').trim()))
  b?.click()
})
await p.waitForTimeout(900)

// ⛔ 「꾸미기」 입구 이름을 짐작하지 않는다 — 화면에 그려진 글자에서 찾는다
const 들어감 = await p.evaluate(() => {
  const cand = [...document.querySelectorAll('button, [role="button"]')]
    .filter((x) => /꾸미|일꾸|레꾸/.test(x.innerText || x.getAttribute('aria-label') || ''))
  if (!cand.length) return null
  const t = cand[0]
  t.click()
  return (t.innerText || t.getAttribute('aria-label') || '').trim().slice(0, 20)
})
await p.waitForTimeout(1400)
if (!들어감) { console.error('✗ 꾸미기 입구를 못 찾았다 — ⛔여기서 판정하지 않는다'); await b.close(); srv.close(); process.exit(2) }
console.log(`\n🚪 들어간 문 = 「${들어감}」`)

// ⛔⛔ 「출시기념 여름팩」 같은 «안내 시트»가 꾸미기 위에 뜬다 — 그걸 재면 엉뚱한 값이 나온다.
//    (두 번째 판이 실제로 그걸 쟀다: 「여름 프레임 12개…」·「나중에 볼게요」)
for (let i = 0; i < 5; i++) {
  const 닫음 = await p.evaluate(() => {
    const sh = [...document.querySelectorAll('.sheet, [role="dialog"]')].filter((e) => e.getBoundingClientRect().height > 40)
    const top = sh[sh.length - 1]
    if (!top) return null
    const t = (top.innerText || '')
    if (!/나중에|볼게요|알겠|확인했|닫기/.test(t)) return null          // 꾸미기 판이면 안 건드린다
    const btn = [...top.querySelectorAll('button')].find((x) => /나중에|볼게요|알겠|확인했|닫기/.test(x.innerText || ''))
    if (!btn) return null
    btn.click(); return (btn.innerText || '').trim().slice(0, 14)
  })
  if (!닫음) break
  console.log(`  🧹 안내 시트 닫음 — 「${닫음}」`)
  await p.waitForTimeout(700)
}

// ⛔ 그 시트가 «첫 클릭을 삼켰다» — 닫은 뒤 「꾸미기」가 아직 화면에 있으면 다시 누른다.
for (let i = 0; i < 3; i++) {
  const 눌렀나 = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button, [role="button"]')]
      .filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^꾸미기$|일꾸|레꾸/.test((x.innerText || '').trim()))
    if (!b) return false
    b.click(); return true
  })
  if (!눌렀나) break
  console.log(`  👉 「꾸미기」 다시 누름`)
  await p.waitForTimeout(1400)
}

// 👀 숫자로 헤매지 말고 «눈으로» 본다 — 절대원칙 21. 잰 자리가 맞는지는 그림이 말해준다.
const SHOT = process.env.SHOT || '/tmp/hankki-꾸미기층.png'
await p.screenshot({ path: SHOT })
console.log(`  🖼 ${SHOT}`)

const m = await p.evaluate(() => {
  const H = window.innerHeight, W = window.innerWidth
  const 보임 = (e) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
    return r.width > 8 && r.height > 8 && r.top < H && r.bottom > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05
  }
  // ⛔⛔ 화면을 옮겨도 «앞 화면 DOM 이 남는다» — 첫 판이 일기 «달력»(이전 달·1·2·3…)까지 같이 셌다.
  //    그래서 «맨 위에 뜬 화면» 안에서만 잰다. 못 고르면 판정하지 않는다(초록불로 속이지 않는다).
  // ⭐ 「서랍」을 콕 집는다 = 모드 탭(속지·글쓰기·일꾸·레꾸)을 품은 상자.
  //   ⛔ `.screen` 을 집으면 밑에 깔린 «앞 화면»(일기 달력)까지 세고,
  //      마지막 `.sheet` 를 집으면 «안내 시트»를 센다. 둘 다 실제로 겪었다(규칙 18 ⓘ).
  const 모드 = [...document.querySelectorAll('button')].filter(보임)
    .filter((x) => /^(속지|글쓰기|일꾸|레꾸)$/.test((x.innerText || '').trim()))
  if (모드.length < 3) return { 못잼: `모드 탭을 못 찾았다(${모드.length}개) — 꾸미기 화면이 아니다` }
  let 뿌리 = 모드[0]
  while (뿌리.parentElement && 뿌리.getBoundingClientRect().height < 200) 뿌리 = 뿌리.parentElement
  const 뿌리이름 = 뿌리.className ? String(뿌리.className).slice(0, 40) : 뿌리.tagName
  const 칸 = [...뿌리.querySelectorAll('button, [role="button"], input, select')].filter(보임)
    .map((e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), 글: (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 12) } })

  // 「층」 = 세로로 8px 안에 모인 것끼리 한 줄
  const 층 = []
  칸.slice().sort((a, x) => a.y - x.y).forEach((c) => {
    const last = 층[층.length - 1]
    if (last && Math.abs(last.y - c.y) <= 8) { last.n++; last.h = Math.max(last.h, c.h) }
    else 층.push({ y: c.y, h: c.h, n: 1 })
  })
  // 조작부 = 「종이(캔버스)」 아래에 깔린 것들. 캔버스를 못 찾으면 화면 아래 절반 기준
  const 종이 = document.querySelector('.decor-stage, .paper, .deco-canvas, .thumb-stage')
  const 종이바닥 = 종이 ? Math.round(종이.getBoundingClientRect().bottom) : Math.round(H * 0.45)
  const 아래층 = 층.filter((L) => L.y >= 종이바닥 - 4)
  const 높이종류 = [...new Set(칸.map((c) => c.h))].sort((a, x) => a - x)

  return {
    뿌리이름,
    화면: H, 폭: W, 종이바닥,
    조작부높이: Math.max(0, H - 종이바닥),
    조작부비율: Math.round((H - 종이바닥) / H * 100),
    층수: 아래층.length,
    층: 아래층.map((L) => ({ y: L.y, 키: L.h, 칸: L.n })),
    칸수: 칸.length,
    작은칸: 칸.filter((c) => c.h < 44).length,
    높이종류,
    보기: 칸.filter((c) => c.글).slice(0, 10).map((c) => `${c.글}(${c.h})`),
  }
})

const 줄 = (a, b2) => console.log(`  ${a.padEnd(26, ' ')} ${b2}`)
if (m.못잼) { console.error(`✗ ${m.못잼} — ⛔여기서 판정하지 않는다`); await b.close(); srv.close(); process.exit(2) }
console.log(`\n── 📏 지금 (일꾸 · 390×844) · 잰 자리 = «${m.뿌리이름}» ──`)
줄('조작부가 먹는 높이', `${m.조작부높이}px = 화면의 ${m.조작부비율}%`)
줄('가로 「층」', `${m.층수}개  ${m.층.map((L) => `[${L.칸}칸/${L.키}px]`).join(' ')}`)
줄('한 화면에 누를 칸', `${m.칸수}개`)
줄('그중 44px 미만', `${m.작은칸}개  ${m.작은칸 ? '⛔ 손가락 기준 미달' : '✅'}`)
줄('칸 «높이» 가짓수', `${m.높이종류.length}가지  ${m.높이종류.join('·')}px`)
console.log(`  보기 = ${m.보기.join(' ')}`)

// ── 안 C 가 되면 어떻게 되나 (시안 실측값 · docs/demo/꾸미기-재설계-시안-2026-08-07.html) ──
console.log(`\n── 🎯 안 C 로 가면 ──`)
줄('가로 「층」', `2개  [아이콘 7칸/52px] [값 알약 n칸/46px]  ⭐서랍은 «덮인다»`)
줄('그중 44px 미만', `0개`)
줄('칸 «높이» 가짓수', `2가지  52·46px`)
console.log(`\n⭐ 이 판은 «지금»만 잰다 — 안 C 줄은 시안 실측값이고, 만든 뒤 다시 재서 대조한다.`)

await b.close(); srv.close()
