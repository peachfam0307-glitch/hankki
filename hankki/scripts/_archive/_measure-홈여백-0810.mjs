// 📏 홈 오른쪽이 휑한 것 — «지금 상태»를 먼저 잰다 (창업자 2026-08-09 *"홈에사 한끼소식이랑 오징어가 너무 오른쪽이 휑해보인다"*)
//    ⭐ 고치기 «전»에 숫자를 남긴다 — 나중에 「좋아졌나」를 눈이 아니라 숫자로 판정하려고.
//    ⛔ 캡처만 보면 「휑하다」가 몇 px 인지 모른다. 창업자 말이 맞는지 틀리는지도 못 가른다.
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
await new Promise((r) => srv.listen(4437, r))

// ⭐ 「휑함」을 숫자로 = 그 줄에서 «내용이 끝나는 자리» 부터 «칸 오른쪽 끝» 까지.
//    ⛔ 요소 폭만 재면 안 된다 — 버튼은 width:100% 라 늘 꽉 차 보인다. «안의 글자»가 어디서 끝나는지를 봐야 한다.
const 재기 = () => {
  const px = (n) => Math.round(n)
  const out = {}
  const 화면 = document.querySelector('.app-frame')
  out.앱폭 = 화면 ? px(화면.getBoundingClientRect().width) : 0

  // ⭐ 글자가 «진짜로» 끝나는 자리 = Range 로 텍스트 노드를 잰다.
  //    ⛔ `scrollWidth` 는 못 쓴다 — `flex:1` 인 칸은 글이 짧아도 칸 폭만큼 나온다(2026-08-10 첫 판이 그래서 전 판 13px 로 똑같이 나왔다).
  const 글끝재기 = (el) => {
    if (!el) return null
    const rng = document.createRange()
    rng.selectNodeContents(el)
    const r = rng.getBoundingClientRect()
    rng.detach?.()
    return r.width ? r.right : null
  }

  // ① 한끼 소식 — 아이콘 · 글 · 화살표가 양끝으로 벌어진다
  const news = document.querySelector('[data-coach="preview"]')
  if (news) {
    const r = news.getBoundingClientRect()
    const 글 = news.querySelector('.t-sub')
    // ⛔ `svg:last-of-type` 은 «부모마다» 마지막을 찾아 맨 앞 선물 아이콘이 잡혔다(x=34 · 빈 폭이 음수로 나온 이유).
    //    화살표는 버튼의 «마지막 자식» 이다.
    const 화살 = news.lastElementChild
    const 글끝 = 글끝재기(글) ?? r.left
    const 화살좌 = 화살 ? 화살.getBoundingClientRect().left : r.right
    out.소식 = { 폭: px(r.width), 글끝: px(글끝), 화살표: px(화살좌), 가운데빈폭: px(화살좌 - 글끝) }
  }

  // ② 이번 주 제철 — 격자가 auto-fill 이라 «칸은 만들어지는데 아이템이 모자란다»
  const wk = document.querySelector('.weekly-row')
  if (wk) {
    const r = wk.getBoundingClientRect()
    const 열 = getComputedStyle(wk).gridTemplateColumns.split(' ').filter(Boolean).length
    const 끝 = [...wk.children].reduce((m, c) => Math.max(m, c.getBoundingClientRect().right), r.left)
    out.제철 = { 폭: px(r.width), 만들어진칸: 열, 아이템: wk.children.length, 마지막끝: px(끝), 오른쪽빈폭: px(r.right - 끝) }
  }

  // ③ 오늘 뭐 해먹지 — flex 라 글이 왼쪽에 붙고 오른쪽이 통째로 빈다
  const td = document.querySelector('.today-card')
  if (td) {
    const r = td.getBoundingClientRect()
    const 제목 = td.querySelector('.today-title')
    const 새로 = td.querySelector('.today-refresh')
    const 글끝 = 글끝재기(제목) ?? r.left
    const 오른쪽 = 새로 ? 새로.getBoundingClientRect().left : r.right
    out.오늘 = { 폭: px(r.width), 글끝: px(글끝), 오른쪽칸: px(오른쪽), 가운데빈폭: px(오른쪽 - 글끝) }
  }
  return out
}

const 판 = [
  ['패드-1600', 1600, 900],
  ['패드-1280', 1280, 800],
  ['폴드-765', 765, 689],
  ['폰세로-411', 411, 891],
]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
console.log('📏 홈 오른쪽 여백 — «지금» 상태\n')
for (const [이름, w, h] of 판) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.log('   ⛔ pageerror', e.message))
  await page.addInitScript(() => {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  })
  await page.goto('http://127.0.0.1:4437/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1300)
  const v = await page.evaluate(재기)
  console.log(`  ${이름} (${w}×${h}) — 앱폭 ${v.앱폭}`)
  if (v.소식) console.log(`     한끼 소식   폭 ${v.소식.폭}  ·  글이 ${v.소식.글끝} 에서 끝나고 화살표가 ${v.소식.화살표}  →  ⬜ 빈 폭 ${v.소식.가운데빈폭}`)
  if (v.제철) console.log(`     이번 주 제철 폭 ${v.제철.폭}  ·  칸 ${v.제철.만들어진칸}개 만들었는데 아이템 ${v.제철.아이템}개  →  ⬜ 오른쪽 빈 폭 ${v.제철.오른쪽빈폭}`)
  if (v.오늘) console.log(`     오늘 뭐 해먹지 폭 ${v.오늘.폭}  ·  글이 ${v.오늘.글끝} 에서 끝  →  ⬜ 빈 폭 ${v.오늘.가운데빈폭}`)
  await page.screenshot({ path: join(OUT, `지금-${이름}.png`), fullPage: false })
  await page.close()
}
await b.close(); srv.close()
console.log(`\n📷 캡처 → ${OUT}`)
