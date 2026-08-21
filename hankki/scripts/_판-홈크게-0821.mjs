// 🏠📏 [판정대기 · 2026-08-21] 홈 음식 그림 크게 — 갈래 넷을 «실물로» 찍어 나란히
//
// 📮 창업자 = *"쟤네는 큼직큼직하게 딱딱보여 우리는 좀 다 작고 잘 안보이고"* → 「3번 ㄱㄱ」
// 📮 그리고 되물음 = *"음식그림이 그림자체가 커지는거야? 박스가 커지는거야?
//    (음식자체가 커지면 꾸미기가 기능을 좀 잃지않나해서)"*
//    ✅ 답 = **상자를 키운다**(`_probe-홈그림크기-0821.mjs` 로 실측 — 그림도 꾸미기도 상자 폭의 %)
//
// ⭐⭐ 그런데 재보니 «칸 수»가 진짜 잣대였다 —
//    `.weekly-row` = `repeat(auto-fit, minmax(94px, 1fr))` 라 **폰에서 이미 3칸을 꽉 채운다.**
//    상자를 키우려면 **한 줄에 몇 개를 놓느냐**를 바꿔야 한다. 그래서 갈래를 그걸로 잡았다.
//
// ⛔ 그림·꾸미기 비율은 «한 줄도» 안 건드린다 — 상자만 바꾼다(창업자 걱정 그대로).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈크게-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈크게'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4409, r))

// ───────── 갈래 넷 ─────────
// ⛔ 전부 «상자 크기»만 건드린다. `iconSize`(56%) · DecorLayer 의 `it.s` 는 한 글자도 안 바꾼다.
const 갈래 = [
  { key: '가', 이름: '지금 그대로', 설명: '한 줄에 3칸', css: '' },
  {
    key: '나', 이름: '한 줄에 2칸', 설명: '상자가 «1.6배» — 제일 큼직해진다',
    css: `.weekly-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; }`,
  },
  {
    key: '다', 이름: '3칸인데 여백을 줄여 크게', 설명: '칸 수는 그대로 · 카드 안쪽 여백과 사이 간격만',
    css: `
      .weekly-row { gap: 6px !important; }
      .weekly-box { padding-left: 10px !important; padding-right: 10px !important; }
    `,
  },
  {
    key: '라', 이름: '2칸 ＋ 여백도 줄이기', 설명: '제일 크다 — 「나」와 「다」를 같이',
    css: `
      .weekly-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; gap: 8px !important; }
      .weekly-box { padding-left: 10px !important; padding-right: 10px !important; }
    `,
  },
  {
    key: '마', 이름: '첫 장만 크게 ＋ 아래 둘', 설명: '3편일 때 «빈 자리»가 안 생긴다 (잡지식)',
    // ⭐⭐ 왜 이 갈래가 필요한가 = **19주 중 17주가 «3편»이다**(실측).
    //    「나·라」(2칸)로 가면 그 17주가 전부 **2＋1** 이 되어 셋째가 혼자 남는다.
    //    ⛔ 창업자가 예전에 정확히 그 그림을 짚었다 — *"위에는 레시피가 3개인데 아래는 2개라 이상해보여"*
    //    ✅ 첫 장을 가로 통째로 쓰면 빈 자리가 «구조적으로» 안 생긴다.
    // ⛔ 첫 판은 첫 장을 «정사각 그대로» 넓혔더니 322×322 로 화면을 통째로 먹고
    //    그림(180px)이 상자의 56% 라 위아래 여백이 휑했다(규칙 21 — 열어보고 잡았다).
    // ✅ 넓은 장은 «눕힌다»(2:1). 폭은 322 그대로인데 키가 절반이라 화면을 안 먹는다.
    css: `
      .weekly-row { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .weekly-row .mini-card:first-child:nth-last-child(3) { grid-column: 1 / -1; }
      .weekly-row .mini-card:first-child:nth-last-child(3) > div[style*="position"] { aspect-ratio: 2 / 1 !important; }
    `,
  },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

console.log('\n🏠 홈 음식 그림 크게 — 갈래 넷 (390×844 · 3배 화질)\n')

const 잰것 = []
for (const g of 갈래) {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4409/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)
  if (g.css) {
    await page.addStyleTag({ content: g.css })
    await page.waitForTimeout(400)
  }

  // ⛔ 「보인다」가 아니라 «재서» 말한다 — 상자 폭 · 그림 폭 · 이름표 글자 · 한 줄 칸 수 · 가로 넘침
  const m = await page.evaluate(() => {
    const row = document.querySelector('.weekly-row')
    if (!row) return null
    const cards = [...row.querySelectorAll('.mini-card')]
    const r0 = cards[0]?.getBoundingClientRect()
    // 한 줄에 몇 칸인가 = 같은 top 을 쓰는 카드 수
    const 한줄 = cards.filter((c) => Math.abs(c.getBoundingClientRect().top - (r0?.top ?? 0)) < 4).length
    // 표지 칸(1:1) — 그림 상자
    const 표지 = cards[0]?.querySelector('div[style*="position"]')
    const tr = 표지?.getBoundingClientRect()
    // 음식 그림 (img 또는 svg)
    const 그림 = cards[0]?.querySelector('img, svg')
    const gr = 그림?.getBoundingClientRect()
    // 이름표 «글자» 상자 — ⛔div 로 재면 카드 폭 전체라 빈칸까지 센다(2026-08-18 교훈) → Range
    const name = cards[0]?.querySelector('.name')
    let 글자폭 = 0
    if (name?.firstChild) {
      const rg = document.createRange(); rg.selectNodeContents(name)
      글자폭 = Math.round(rg.getBoundingClientRect().width)
    }
    return {
      칸수: cards.length,
      한줄,
      상자: tr ? Math.round(tr.width) : 0,
      그림: gr ? Math.round(gr.width) : 0,
      이름표: name ? Math.round(parseFloat(getComputedStyle(name).fontSize) * 10) / 10 : 0,
      글자폭: 글자폭,
      이름표폭: name ? Math.round(name.getBoundingClientRect().width) : 0,
      잘림: name ? name.scrollWidth > name.clientWidth + 1 : false,
      가로넘침: document.documentElement.scrollWidth > window.innerWidth + 1,
    }
  })
  잰것.push({ ...g, ...m })
  console.log(`${g.key}  ${g.이름}`)
  console.log(`     한 줄 ${m.한줄}칸 · 상자 ${m.상자}px · 그림 ${m.그림}px · 이름표 ${m.이름표}px(글자 ${m.글자폭}/${m.이름표폭}px)${m.잘림 ? ' ⛔말줄임' : ''}${m.가로넘침 ? ' ⛔가로넘침' : ''}`)

  const 상자 = await page.$('.weekly-box')
  await 상자?.screenshot({ path: join(OUT, `${g.key}-${g.이름}.png`) })
  await page.screenshot({ path: join(OUT, `${g.key}-전체.png`) })
  await page.close()
}

await b.close(); srv.close()

const 기준 = 잰것[0]
console.log('\n📐 「지금」 대비 그림이 몇 배 커지나')
잰것.slice(1).forEach((x) => {
  console.log(`   ${x.key}  ${x.상자}px / ${기준.상자}px = **${(x.상자 / 기준.상자).toFixed(2)}배**  (그림 ${기준.그림} → ${x.그림}px)`)
})
console.log(`\n🖼 캡처 → ${OUT}\n`)

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰것, null, 2))
