// 🖼 「주부의 장바구니 설명」 갈래 셋 — **앱을 진짜로 띄워** 찍는다 (2026-08-23)
//
// 📮 창업자 = *"장바구니 설명줄바꿈없이 크기작게"* → 물었더니 *"시안보자"*
//
// ⛔ CSS 흉내로 그리지 않는다(절대원칙 30) — **앱 화면 그대로** 띄우고 그 자리만 바꿔 찍는다.
//    그래야 「판에선 예쁜데 앱에선 다르다」가 안 난다.
//
// 🔢 재본 것 = 칸 350px · 지금 글자 16px · 한 줄로 펴면 **507px / 456px**
//    → 한 줄에 담으려면 **11px / 12.2px**. 앱에서 제일 작은 글자가 14px 이라 그대로는 못 한다.
//    그래서 «글을 줄이는 갈래»를 같이 뽑는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-장바구니설명-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'docs/시안/장바구니설명-0823')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4397, r))

// ⭐ 갈래 넷 — 「지금」을 맨 앞에 둔다. 견줄 바닥이 없으면 판정이 안 된다.
//   ⛔ 글을 줄이는 갈래는 «무엇이 없어지는지»를 판에 같이 적는다 — 모르고 고르면 안 된다.
const 갈래 = [
  {
    키: '0-지금', 이름: '지금 (그대로)', 글자: 16, balance: false,
    한줄: null, 둘줄: null,
    설명: '글자 16px · 두 줄. 굵은 말이 두 줄로 쪼개진다.',
    잃는것: null,
  },
  {
    키: 'ㄱ-줄여서한줄', 이름: 'ㄱ · 글을 줄여서 «한 줄»', 글자: 15, balance: false,
    한줄: ['18년차 주부의 추천 아이템', ' · 계속 올라와요'],
    둘줄: ['제휴 수수료를 받아도', ' 값은 그대로예요'],
    설명: '글자 15px ＋ 앞말을 뺀다 → 두 줄 다 «한 줄»에 들어간다.',
    잃는것: '「써보고 좋은 건 나누고 싶은」 · 「외부 쇼핑몰로 이어져요」',
  },
  {
    // ⛔ 처음엔 `balance` 만 걸었는데 **굵은 말이 그대로 갈렸다**(「…싶은 18년차」/「주부의 추천 아이템…」).
    //    balance 는 «줄 길이»를 고르게 할 뿐 «뜻»을 모른다 → 굵은 덩어리에 `nowrap` 을 같이 건다.
    키: 'ㄴ-글그대로', 이름: 'ㄴ · 글은 그대로 · 끊는 자리만', 글자: 15, balance: true, 굵은거안끊기: true,
    한줄: null, 둘줄: null,
    설명: '글자 15px ＋ 굵은 말은 안 끊기게 ＋ 줄 길이를 고르게. 글은 한 글자도 안 없어진다.',
    잃는것: null,
  },
  {
    키: 'ㄷ-반반', 이름: 'ㄷ · 첫 줄만 줄이기', 글자: 15, balance: true, 굵은거안끊기: true,
    한줄: ['18년차 주부의 추천 아이템', ' · 계속 올라와요'],
    둘줄: null,
    설명: '첫 줄은 줄여 «한 줄»로, 제휴 고지 줄은 글을 그대로 두고 끊는 자리만 고친다.',
    잃는것: '「써보고 좋은 건 나누고 싶은」',
  },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await page.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await page.waitForTimeout(900)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

const 잰것 = []
for (const g of 갈래) {
  const r = await page.evaluate((g) => {
    const 찾기 = (조각) => [...document.querySelectorAll('.t-sub')].find((e) => e.textContent.includes(조각))
    const a = 찾기('계속 올라와요'); const c = 찾기('제휴 수수료를 받아도')
    if (!a || !c) return { 없다: true }
    // 원본을 한 번만 담아 둔다 — 갈래를 갈아끼울 때마다 여기서 되돌린다
    if (!window.__원본) window.__원본 = { a: a.innerHTML, c: c.innerHTML }
    a.innerHTML = window.__원본.a; c.innerHTML = window.__원본.c
    for (const e of [a, c]) {
      e.style.fontSize = `${g.글자}px`
      e.style.textWrap = g.balance ? 'balance' : ''
    }
    if (g.한줄) a.innerHTML = `<b style="color:var(--brown)">${g.한줄[0]}</b>${g.한줄[1]}`
    if (g.둘줄) c.innerHTML = `<b style="color:var(--brown)">${g.둘줄[0]}</b>${g.둘줄[1]}`
    // ⭐ 굵은 말 = 「18년차 주부의 추천 아이템」·「제휴 수수료를 받아도」 — 한 덩어리로 읽히는 말이다.
    //    `nowrap` 이면 그 안에서 절대 안 넘어간다(넘칠 땐 통째로 다음 줄로 간다).
    if (g.굵은거안끊기) for (const e of [a, c]) for (const bb of e.querySelectorAll('b')) bb.style.whiteSpace = 'nowrap'
    const 재기 = (e) => {
      const cs = getComputedStyle(e); const rr = e.getBoundingClientRect()
      return { 줄수: Math.round(rr.height / parseFloat(cs.lineHeight)), 높이: Math.round(rr.height), 글자: Math.round(parseFloat(cs.fontSize) * 10) / 10 }
    }
    return { 첫줄: 재기(a), 둘째: 재기(c), 상자: (() => { const x = a.parentElement.getBoundingClientRect(); return { y: Math.round(x.y) } })() }
  }, g)
  await page.waitForTimeout(350)
  // 설명 두 줄이 든 자리만 잘라 찍는다 — 화면 전체를 주면 견주기 어렵다
  // ⛔ 처음 190px 으로 잘랐다가 **두 줄짜리 갈래의 둘째 줄이 사진에서 잘렸다** — 견줄 수가 없다.
  //    📌 갈래마다 높이가 다르면 «제일 높은 갈래»에 맞춰 자른다(절대원칙 21).
  await page.screenshot({ path: join(OUT, `${g.키}.png`), clip: { x: 0, y: 96, width: 390, height: 250 } })
  잰것.push({ ...g, 잰: r })
  console.log(`  ${g.이름.padEnd(26)} 글자 ${r.첫줄?.글자}px · ${r.첫줄?.줄수}줄 / ${r.둘째?.줄수}줄  → ${g.키}.png`)
}

writeFileSync(join(OUT, '잰것.json'), JSON.stringify(잰것, null, 2))
console.log(`\n📁 ${OUT}\n`)
await b.close(); srv.close()
