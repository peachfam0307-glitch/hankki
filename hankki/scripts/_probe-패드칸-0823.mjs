// 📐📐 패드에서 «칸이 안 늘어난다» — 재는 판 (창업자 캡처 2026-08-23)
//
// 📮 창업자 = *"패드에서 찾은버그야"* ＋ 캡처 넉 장
//    → 방향 판정 = *"자주해먹는요리는 **크기 더 키워야해.** 장보기역시 **가로로 너무길어서 세로로 나누면** 어떨까싶은데"*
//
// ⛔⛔ **고치기 «전»에 잰다** — 2026-08-14 에 여기서 하루를 태웠다(규칙 25).
//    그때 창업자가 「가로 막대」라고 했는데 내가 「세로」로 읽고 네 판을 헛으로 냈다.
//
// 🔎 이 판이 재는 것 둘 (성격이 «반대»라 따로 잰다)
//   ① 홈 「자주 해먹는 요리」 — 칸이 «커져야» 한다
//      · 실측 뿌리 = `styles.css` `.mini-card { width: 108px }` = **고정값**. 패드에서도 108px 이다.
//      · 그래서 ㉮(이름표 넘침)과 ㉯(왼쪽에 몰림)이 «같은 한 줄»에서 난다.
//   ② 장보기 — 칸을 «나눠야» 한다
//      · 왼쪽 칸(주부의 장바구니) 아래가 하단바에 먹히나
//
// ⛔ 소스 grep 아님 — **화면에 그려진 자리**로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-패드칸-0823.mjs
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
await new Promise((r) => srv.listen(4423, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// ⭐⭐ 「자주 해먹는 요리」는 `r.cooked > 0` 인 것만 뜬다(`HomeScreen.jsx:192`).
//   ⛔ 씨앗 데이터엔 `cooked` 가 0이라 **아무것도 안 뜨고 판이 늘 초록불**이 된다.
//      2026-08-23 「3장 보기 줄높이」에서 배운 그것 — **심어야 잰다.**
//   ⭐ 이름도 심는다 — 창업자 폰의 「목살돼지갈비구이」(8글자)가 넘치는데 씨앗엔 그런 이름이 없다.
const 심기 = () => {
  try {
    const K = 'hankki:v1'
    const s = JSON.parse(localStorage.getItem(K) || '{}')
    if (!s.recipes || !s.recipes.length) return
    const 이름 = ['목살돼지갈비구이', '떡갈비', '감바스']
    이름.forEach((t, i) => {
      const r = s.recipes[i]
      if (r) { r.title = t; r.cooked = 9 - i }
    })
    localStorage.setItem(K, JSON.stringify(s))
  } catch { /* noop */ }
}

const 열기 = async (w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  // ⭐ 씨앗이 깔린 «뒤»에 심고 다시 연다 — 열기 전에 심으면 앱이 씨앗으로 덮어쓴다
  await p.evaluate(심기)
  await p.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(700)
  return { ctx, p }
}

// ───────── ① 홈 「자주 해먹는 요리」 ─────────
console.log('\n📐 ① 홈 「자주 해먹는 요리」 — 칸 크기·이름표 (창업자: «크기 더 키워야해»)\n')
console.log('  폭     칸폭  그림   이름표줄  넘친이름  줄이쓴폭  화면폭  남는자리')
for (const [w, h] of [[390, 844], [820, 1180], [1024, 768], [1280, 800], [1600, 900]]) {
  const { ctx, p } = await 열기(w, h)
  const r = await p.evaluate(() => {
    const head = [...document.querySelectorAll('.h-section')].find((e) => e.textContent.includes('자주 해먹는'))
    if (!head) return null
    const row = head.closest('.sec-head')?.nextElementSibling
    const cards = [...(row?.querySelectorAll('.mini-card') || [])]
    if (!cards.length) return null
    const c0 = cards[0].getBoundingClientRect()
    const 그림 = cards[0].querySelector('div')?.getBoundingClientRect()
    const 이름들 = cards.map((c) => c.querySelector('.name')).filter(Boolean)
    const 줄수 = 이름들.map((n) => Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight)))
    const 넘침 = 이름들.filter((n) => n.scrollWidth > n.clientWidth + 1).length
    const last = cards[cards.length - 1].getBoundingClientRect()
    return {
      칸: cards.length,
      칸폭: Math.round(c0.width),
      그림: 그림 ? Math.round(그림.width) : 0,
      줄수: Math.max(...줄수),
      넘침,
      줄폭: Math.round(last.right - c0.left),
      화면: window.innerWidth,
    }
  })
  await ctx.close()
  if (!r) { console.log(`  ${String(w).padEnd(6)} (줄이 없다 — 자주 해먹는 요리가 안 떴다)`); continue }
  const 남음 = r.화면 - r.줄폭
  const 표 = 남음 > r.화면 * 0.3 ? '  ⛔휑하다' : ''
  console.log(`  ${String(w).padEnd(6)} ${String(r.칸폭).padEnd(5)} ${String(r.그림).padEnd(6)} ${String(r.줄수).padEnd(9)} ${String(r.넘침).padEnd(9)} ${String(r.줄폭).padEnd(9)} ${String(r.화면).padEnd(7)} ${남음}px${표}`)
}

// ───────── ② 장보기 — 왼쪽 칸이 하단바에 먹히나 ─────────
// ⛔ 첫 잣대는 「하단바에 먹히나」였는데 **틀렸다** — 화면보다 길어도 «스크롤되면» 정상이다.
//    창업자 말은 *"가로로 너무길어서"* = 두 칸의 «길이가 안 맞아» 오른쪽 아래가 휑하다는 것이다.
//    ✅ 그래서 «왼쪽 ↔ 오른쪽 높이 차»를 잰다.
console.log('\n📐 ② 장보기 — 두 칸 «길이가 맞나» (창업자: «가로로 너무길어서 세로로 나누면»)\n')
console.log('  폭     단   왼쪽높이  오른쪽높이  차이     휑한 정도')
for (const [w, h] of [[390, 844], [1024, 768], [1280, 800], [1600, 900]]) {
  const { ctx, p } = await 열기(w, h)
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').includes('장보기'))
    btn?.click()
  })
  await p.waitForTimeout(900)
  const r = await p.evaluate(() => {
    const pair = document.querySelector('.shop-pair')
    if (!pair) return { 단: 1, 왼: 0, 오: 0 }
    const cs = getComputedStyle(pair)
    const 단 = (cs.gridTemplateColumns || '').split(' ').filter(Boolean).length
    const kids = [...pair.children]
    return {
      단,
      왼: kids[0] ? Math.round(kids[0].getBoundingClientRect().height) : 0,
      오: kids[1] ? Math.round(kids[1].getBoundingClientRect().height) : 0,
    }
  })
  await ctx.close()
  const 차 = Math.abs(r.왼 - r.오)
  const 긴쪽 = Math.max(r.왼, r.오) || 1
  const 비율 = 차 / 긴쪽
  const 표 = r.단 < 2 ? '(한 단 — 폰)' : (비율 > 0.4 ? `⛔ 긴쪽의 ${Math.round(비율 * 100)}% 가 빈다` : `✅ ${Math.round(비율 * 100)}%`)
  console.log(`  ${String(w).padEnd(6)} ${String(r.단).padEnd(4)} ${String(r.왼).padEnd(9)} ${String(r.오).padEnd(11)} ${String(차).padEnd(8)} ${표}`)
}

await b.close(); srv.close()
console.log('\n📌 이 판은 «재기»만 한다 — 고침은 창업자 방향 판정(키운다 / 나눈다)대로 따로 간다.\n')
