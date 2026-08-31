// 🍳 「오늘 뭐 해먹지」가 «몇 편 안에서» 도나 (2026-08-28)
//
// 📮 창업자 = *"이제 오늘 뭐해먹지 우리 기본레시피 50개 넘는게 계속 도는거지?"*
//
// ⛔⛔ **「57편이 다 돈다」가 «항상» 참이 아니다** — 고르는 순서가 세 갈래다
//    (`HomeScreen.jsx` `today` useMemo):
//    ① **냉장고 재료로 만들 수 있는 게 하나라도 있으면** → **그것들만** 돈다
//    ② 아니고 **만든 적 있는 게 하나라도 있으면** → **만든 것만** 돈다  ← ⚠️여기가 제일 좁아진다
//    ③ 둘 다 아니면 → **전체**가 돈다
//    📌 즉 「몇 편이 도나」는 **유저 상태에 따라 갈린다.** 그래서 재서 답한다.
//
// ⭐ 재는 것 = 그 상태에서 **실제 목록의 길이**(= 회전 주기). 날짜가 하루 늘 때마다 한 칸씩 미니
//    목록 길이가 곧 «며칠 만에 한 바퀴 도나»다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-오늘추천풀-0828.mjs
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
await new Promise((r) => srv.listen(4397, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🍚 그 상태에서 «며칠에 걸쳐» 몇 가지가 뜨나 — 날짜를 하루씩 밀며 화면 글자를 읽는다
//    ⛔ 코드를 흉내 내 세지 않는다. 앱이 실제로 그린 이름만 센다(절대원칙 30).
const 며칠돌려보기 = async (날수, 준비) => {
  const 본것 = []
  for (let i = 0; i < 날수; i++) {
    const d = new Date(시작 + 'T03:00:00Z'); d.setUTCDate(d.getUTCDate() + i)
    const ymd = d.toISOString().slice(0, 10)
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
    await ctx.addInitScript(SEED_COACH_SEEN)
    await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
    await ctx.addInitScript((고정) => {
      const 진짜 = Date, 밀리 = 진짜.parse(고정)
      // eslint-disable-next-line no-global-assign
      Date = class extends 진짜 {
        constructor (...a) { if (a.length === 0) super(밀리); else super(...a) }
        static now () { return 밀리 }
      }
      Date.parse = 진짜.parse; Date.UTC = 진짜.UTC
    }, `${ymd}T03:00:00Z`)
    const p = await ctx.newPage()
    await p.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(700)
    if (준비) { await 준비(p); await p.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(900) }
    본것.push(await p.evaluate(() => document.querySelector('.today-title')?.textContent.trim() || null))
    await ctx.close()
  }
  return 본것
}

const 날수 = Number(process.argv[2] || 60)
// ⭐ 시작날짜를 받는다 — **레시피가 새로 열리는 구간이면 목록이 커져서 빈도가 희석된다.**
//    「내 식이 틀린 것」과 「풀이 커지는 것」을 갈라 재려면 «안 열리는 구간»으로도 돌려야 한다.
//    (2026-12-08 ~ 2027-02-14 사이엔 새로 열리는 레시피가 없다)
const 시작 = process.argv[3] || '2026-09-01'

console.log(`\n① 갓 깔았을 때 (냉장고 비었고 만든 것 0) — ${날수}일`)
const A = await 며칠돌려보기(날수)
console.log(`   서로 다른 요리 = ${new Set(A.filter(Boolean)).size}가지 / ${날수}일`)
console.log(`   앞 7일 = ${A.slice(0, 7).join(' · ')}`)

console.log(`\n② 세 편만 «만들었어요» 를 누른 사람 — ${날수}일`)
// ⛔⛔ **`cooked` 를 직접 심으면 «지워진다»** — 불러올 때 «일기 수»로 다시 맞춘다(store.jsx:461).
//    처음엔 그걸 모르고 심었다가 ②가 ①과 «똑같이» 나왔고, 그걸 「갈래가 안 좁힌다」로 읽을 뻔했다.
//    ✅ 「만들었어요」가 진짜로 만드는 것 = **일기 기록**이다. 그걸 심는다.
const 만들기 = async (p) => p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const rs = (s.recipes || []).slice(5, 8)
  s.diary = [...rs.map((r, i) => ({ id: 'ck' + i, recipeId: r.id, title: r.title, source: r.source, at: Date.now() - (i + 1) * 3600000, rating: 0, note: '', photo: null })), ...(s.diary || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
const B = await 며칠돌려보기(날수, 만들기)
const B가지 = new Set(B.filter(Boolean)).size
console.log(`   서로 다른 요리 = ${B가지}가지 / ${날수}일`)
console.log(`   앞 7일 = ${B.slice(0, 7).join(' · ')}`)
// ⭐ 「만든 것이 «두 배쯤 자주» 오나」 — 한 바퀴를 다 돌려야 보인다(나머지 54 ＋ 끼운 6 = 60칸)
const 셈 = {}
B.filter(Boolean).forEach((n) => { 셈[n] = (셈[n] || 0) + 1 })
const 만든이름 = ['국물 떡볶이', '잡채', '김치볶음밥']   // 위 만들기() 가 심는 셋(recipes 5~7번)
const 만든횟수 = 만든이름.map((n) => 셈[n] || 0)
const 나머지평균 = (() => {
  const v = Object.entries(셈).filter(([n]) => !만든이름.includes(n)).map(([, c]) => c)
  return v.length ? (v.reduce((a, c) => a + c, 0) / v.length).toFixed(2) : '0'
})()
console.log(`   만든 것이 뜬 횟수 = ${만든이름.map((n, i) => `${n} ${만든횟수[i]}번`).join(' · ')}`)
console.log(`   나머지 평균 = ${나머지평균}번  → 만든 것이 ${(만든횟수.reduce((a, c) => a + c, 0) / 3 / Number(나머지평균)).toFixed(1)}배 자주`)

await b.close(); srv.close()
console.log(`\n📌 ①이 크고 ②가 작으면 = 「만든 적 있는 것만 돈다」는 갈래가 실제로 좁힌다는 뜻이다.`)
