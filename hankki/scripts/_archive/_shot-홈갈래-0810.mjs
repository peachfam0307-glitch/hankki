// 🏠 홈 오른쪽 휑함 — 갈래 시안 (창업자 판정용 · 2026-08-10)
//    📮 창업자 *"홈에사 한끼소식이랑 오징어가 너무 오른쪽이 휑해보인다.."*
//
//    🔢 손대기 전 실측(패드 1600) — 한끼 소식 빈 폭 1364 · 이번 주 제철 오른쪽 빈 폭 1212 · 오늘 뭐 해먹지 빈 폭 1358
//       ⭐ 뿌리가 둘이다:
//         ⑴ 소식·오늘 = flex 라 「글 왼쪽 · 화살표 오른쪽」 → 넓어지면 «가운데만» 늘어난다
//         ⑵ 이번 주 제철 = auto-fill 이라 «아이템이 없어도 빈 칸을 만든다»(1600px 에서 14칸 만들고 3개만 참)
//
//    ⛔ 앱 코드는 한 줄도 안 건드린다 — CSS 만 얹어 찍는다(규칙 13 · 검수 전엔 커밋도 안 한다).
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = join(R, 'docs/검수-2026-08-10-홈여백')
mkdirSync(OUT, { recursive: true })

const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4438, r))

// ⛔⛔ 아래 CSS 문자열 «안»에 백틱을 쓰지 말 것 — 템플릿 리터럴이 거기서 끊긴다(2026-08-09 에 실제로 당했다).
const 갈래 = {
  // ⓐ 폭 상한 — 달력에 이미 쓴 처방(760px 가운데). 제일 안전하고 손대는 곳이 적다.
  A: {
    이름: 'A-폭상한',
    설명: '넓어도 760px 까지만 · 가운데로',
    css: `
@media (min-width: 820px) {
  .screen > .pad > *, .screen > .pad { }
  .home-wide { max-width: 760px; margin-left: auto; margin-right: auto; }
}`,
    준비: () => {
      // 홈 본문 묶음에 표시를 붙인다(앱엔 이런 클래스가 없어서 시안에서만 얹는다)
      const pad = document.querySelector('.screen .pad')
      if (pad) pad.classList.add('home-wide')
    },
  },

  // ⓑ 두 칸 — 어제 레시피 상세에서 성공한 문법을 홈에도.
  B: {
    이름: 'B-두칸',
    설명: '왼쪽 = 소식·오늘 · 오른쪽 = 이번 주 제철·최근 저장',
    css: `
@media (min-width: 820px) {
  .home-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
  .home-two > .home-L, .home-two > .home-R { min-width: 0; }
}`,
    준비: () => {
      const pad = document.querySelector('.screen .pad')
      if (!pad) return
      const kids = [...pad.children]
      const L = document.createElement('div'); L.className = 'home-L'
      const R2 = document.createElement('div'); R2.className = 'home-R'
      // 「한끼 소식」·「오늘 뭐 해먹지」 = 왼쪽 · 나머지 = 오른쪽
      for (const k of kids) {
        const 왼쪽감 = k.matches?.('[data-coach="preview"]') || k.classList?.contains('today-card')
        ;(왼쪽감 ? L : R2).appendChild(k)
      }
      pad.classList.add('home-two')
      pad.appendChild(L); pad.appendChild(R2)
    },
  },

  // ⓒ 칸을 채운다 — auto-fill → auto-fit 하나로 「빈 칸」이 사라진다. ＋ 소식·오늘을 나란히.
  C: {
    이름: 'C-칸채우기',
    설명: '제철 칸이 늘어나 꽉 참 ＋ 소식·오늘을 좌우로 나란히',
    css: `
@media (min-width: 820px) {
  .weekly-row { grid-template-columns: repeat(auto-fit, minmax(94px, 1fr)); }
  .home-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; }
  .home-pair > * { margin-top: 0 !important; }
}`,
    준비: () => {
      const pad = document.querySelector('.screen .pad')
      const news = pad?.querySelector('[data-coach="preview"]')
      const today = pad?.querySelector('.today-card')
      if (!pad || !news || !today) return
      const wrap = document.createElement('div'); wrap.className = 'home-pair'
      pad.insertBefore(wrap, news)
      wrap.appendChild(news); wrap.appendChild(today)
    },
  },

  // ⓓ 제철만 손대기 — 제일 작게 고친다. 칸에 상한(200px)을 줘 3개가 너무 커지지 않게 하고 가운데로.
  D: {
    이름: 'D-제철만',
    설명: '이번 주 제철 세 칸을 키우되 200px 상한 · 가운데',
    css: `
@media (min-width: 700px) {
  .weekly-row { grid-template-columns: repeat(auto-fit, minmax(94px, 200px)); justify-content: center; }
}`,
    준비: () => {},
  },

  // ⓔ ⭐ 빈 자리를 «진짜로» 쓴다 — 줄마다 안을 좌우로 벌린다(폭 상한을 안 쓴다).
  //    창업자 확정 안 D(2026-08-09 v10.07) = 「가로에선 앱이 화면 폭을 꽉 쓴다」 와 안 부딪힌다.
  E: {
    이름: 'E-줄안에서벌리기',
    설명: '소식·오늘을 좌우로 · 제철은 글 왼쪽 카드 오른쪽',
    css: `
@media (min-width: 700px) {
  .home-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; }
  .home-pair > * { margin-top: 0 !important; }
  .weekly-box { display: grid; grid-template-columns: minmax(200px, 1fr) auto; gap: 22px; align-items: center; }
  .weekly-box > .weekly-row { margin-top: 0 !important; grid-template-columns: repeat(3, 150px); }
}`,
    준비: () => {
      const pad = document.querySelector('.screen .pad')
      const news = pad?.querySelector('[data-coach="preview"]')
      const today = pad?.querySelector('.today-card')
      if (pad && news && today) {
        const wrap = document.createElement('div'); wrap.className = 'home-pair'
        pad.insertBefore(wrap, news); wrap.appendChild(news); wrap.appendChild(today)
      }
      // 「이번 주 제철」 상자엔 클래스가 없어서 시안에서만 붙인다(앱 코드는 안 건드린다)
      const row = pad?.querySelector('.weekly-row')
      const box = row?.parentElement
      if (box) {
        box.classList.add('weekly-box')
        // 글 세 줄(제철 라벨·재료명·설명)을 한 덩어리로 묶어 왼쪽 칸에 넣는다
        const 글 = document.createElement('div')
        while (box.firstChild && box.firstChild !== row) 글.appendChild(box.firstChild)
        box.insertBefore(글, row)
      }
    },
  },

  // ⓕ E2 — E 와 같되 제철 «가운데»가 덜 비게. 글 칸과 카드 칸을 비율로 나눠 카드가 남는 폭을 먹는다.
  //    ⛔ E 는 카드 칸이 `auto`(내용 크기)라 1600px 에서 글과 카드 사이가 넓게 벌어졌다.
  F: {
    이름: 'E2-카드가더크게',
    설명: 'E 와 같은데 제철 카드가 남는 폭을 먹어 가운데가 덜 빈다',
    css: `
@media (min-width: 700px) {
  .home-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; }
  .home-pair > * { margin-top: 0 !important; }
  .weekly-box { display: grid; grid-template-columns: minmax(200px, 0.9fr) minmax(0, 1.4fr); gap: 22px; align-items: center; }
  .weekly-box > .weekly-row { margin-top: 0 !important; grid-template-columns: repeat(3, minmax(0, 1fr)); }
}`,
    준비: () => {
      const pad = document.querySelector('.screen .pad')
      const news = pad?.querySelector('[data-coach="preview"]')
      const today = pad?.querySelector('.today-card')
      if (pad && news && today) {
        const wrap = document.createElement('div'); wrap.className = 'home-pair'
        pad.insertBefore(wrap, news); wrap.appendChild(news); wrap.appendChild(today)
      }
      const row = pad?.querySelector('.weekly-row')
      const box = row?.parentElement
      if (box) {
        box.classList.add('weekly-box')
        const 글 = document.createElement('div')
        while (box.firstChild && box.firstChild !== row) 글.appendChild(box.firstChild)
        box.insertBefore(글, row)
      }
    },
  },
}

// ⭐ 폰 세로를 «반드시» 넣는다 — 창업자가 이미 OK 한 화면이라 안 건드리는 게 확인돼야 한다(문턱 700px).
const 판 = [['패드-1600', 1600, 900], ['폴드-765', 765, 689], ['폰세로-411', 411, 891]]

const 재기 = () => {
  const px = (n) => Math.round(n)
  const 글끝재기 = (el) => { if (!el) return null; const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return b.width ? b.right : null }
  const out = {}
  const news = document.querySelector('[data-coach="preview"]')
  if (news) { const r = news.getBoundingClientRect(); const 끝 = 글끝재기(news.querySelector('.t-sub')) ?? r.left; out.소식빈폭 = px((news.lastElementChild?.getBoundingClientRect().left ?? r.right) - 끝) }
  const wk = document.querySelector('.weekly-row')
  if (wk) { const r = wk.getBoundingClientRect(); const 끝 = [...wk.children].reduce((m, c) => Math.max(m, c.getBoundingClientRect().right), r.left); out.제철빈폭 = px(r.right - 끝); out.제철칸 = getComputedStyle(wk).gridTemplateColumns.split(' ').filter(Boolean).length }
  const td = document.querySelector('.today-card')
  if (td) { const r = td.getBoundingClientRect(); const 끝 = 글끝재기(td.querySelector('.today-title')) ?? r.left; out.오늘빈폭 = px((td.querySelector('.today-refresh')?.getBoundingClientRect().left ?? r.right) - 끝) }
  // 넘침 = 가로로 삐져나간 게 없나(고치다 새로 깨뜨리는 걸 잡는다)
  out.가로넘침 = px(Math.max(0, document.querySelector('.app-frame')?.scrollWidth - innerWidth || 0))
  return out
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
console.log('🏠 홈 갈래 시안\n')
for (const [판이름, w, h] of 판) {
  console.log(`  ── ${판이름} (${w}×${h})`)
  for (const key of ['지금', 'A', 'D', 'E', 'F']) {
    const g = 갈래[key]
    const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
    page.on('pageerror', (e) => console.log('     ⛔ pageerror', e.message))
    await page.addInitScript(() => {
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:nudge:giftpack', '1')
      const gi = Storage.prototype.getItem
      Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : gi.call(this, k) }
    })
    await page.goto('http://127.0.0.1:4438/hankki/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1300)
    if (g) { await page.addStyleTag({ content: g.css }); await page.evaluate(g.준비); await page.waitForTimeout(500) }
    const v = await page.evaluate(재기)
    const 라벨 = g ? g.이름 : '지금'
    console.log(`     ${라벨.padEnd(12)} 소식빈폭 ${String(v.소식빈폭).padStart(5)} · 제철빈폭 ${String(v.제철빈폭).padStart(5)}(칸 ${v.제철칸}) · 오늘빈폭 ${String(v.오늘빈폭).padStart(5)} · 넘침 ${v.가로넘침}`)
    await page.screenshot({ path: join(OUT, `${판이름}-${라벨}.png`) })
    await page.close()
  }
}
await b.close(); srv.close()
console.log(`\n📷 시안 → ${OUT}`)
