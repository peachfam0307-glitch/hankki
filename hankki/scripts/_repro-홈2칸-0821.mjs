// 📐 [반영됨 · 2026-08-21] 홈 주간 격자 = 폰 «2칸» · 패드·가로는 «3칸» 그대로
//
// 📮 창업자 확정 = 갈래 넷 중 *"ㄴ가고"* (2칸) ＋ *"일단 비워두고 추후에 넣자"*
// 📮 진짜 이유 = *"이거키우는게 좋은게 **레꾸화면이 더 잘보이겠다**"*
//
// ⭐⭐ 이 판이 지키는 것 셋
//   ① **폰은 2칸** — 카드가 1.54배 커져 레꾸가 보인다
//   ② ⛔**320px 좁은 폰에서 «1칸»으로 무너지면 안 된다** — minmax 를 키운 대가가 거기서 난다
//   ③ ⛔**패드·가로는 3칸 그대로** — 창업자 제보(*"패드에서 레시피두개 높이 안맞아"*)로
//      두 박스 높이를 맞추려고 못 박은 것이다. 이번 변경이 그걸 흔들면 안 된다.
//
// ⛔ 소스 grep 아님 — **화면에 그려진 자리**로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-홈2칸-0821.mjs
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
await new Promise((r) => srv.listen(4417, r))

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 재기 = async (w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4417/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(700)
  const r = await p.evaluate(() => {
    const 잰다 = (row) => {
      if (!row) return null
      const cards = [...row.querySelectorAll('.mini-card')]
      if (!cards.length) return null
      const top0 = cards[0].getBoundingClientRect().top
      const 한줄 = cards.filter((c) => Math.abs(c.getBoundingClientRect().top - top0) < 4).length
      const 표지 = cards[0].querySelector('div[style*="position"]')
      return { 칸: cards.length, 한줄, 폭: 표지 ? Math.round(표지.getBoundingClientRect().width) : 0 }
    }
    const rows = [...document.querySelectorAll('.weekly-row')]
    return {
      줄: rows.map(잰다).filter(Boolean),
      가로넘침: document.documentElement.scrollWidth > window.innerWidth + 1,
      // 이름표가 말줄임으로 잘리나
      잘린이름: [...document.querySelectorAll('.weekly-row .name')].filter((n) => n.scrollWidth > n.clientWidth + 1).length,
    }
  })
  await ctx.close()
  return r
}

console.log('\n📐 홈 주간 격자 — 폰 2칸 · 패드·가로 3칸\n')

// ───────── ① 폰 세로 — 2칸이고, 좁아도 «1칸으로 안 무너진다» ─────────
console.log('① 폰 세로 — 한 줄에 2칸 (⛔1칸으로 무너지면 실패)')
for (const w of [320, 360, 390, 412]) {
  const r = await 재기(w, 844)
  const 셋편 = r.줄.find((x) => x.칸 === 3)   // 「이번 주 특별한 한끼」 = 3편
  const 두편 = r.줄.find((x) => x.칸 === 2)   // 「우리집레시피」 = 2편
  chk(`  ${w}px · 3편 줄이 «2칸»이다 (1칸이면 카드가 화면을 통째로 먹는다)`, 셋편?.한줄, 2)
  chk(`  ${w}px · 2편 줄도 2칸 = 두 상자 크기가 «같다»`, 두편?.한줄, 2)
  chk(`  ${w}px · 두 상자 카드 폭이 같다 (${셋편?.폭} = ${두편?.폭})`, 셋편?.폭 === 두편?.폭, 'true')
  chk(`  ${w}px · 가로 넘침 0`, !r.가로넘침, 'true')
}

// ───────── ② 커진 게 «진짜»인가 ─────────
console.log('\n② 진짜로 커졌나 (390px 기준 · 옛 값 101px)')
{
  const r = await 재기(390, 844)
  const 셋편 = r.줄.find((x) => x.칸 === 3)
  chk(`  카드 폭이 140px 이상이다 (옛 101px)`, (셋편?.폭 || 0) >= 140, 'true')
  chk(`  ⭐ 이름표가 «안 잘린다» (3칸 101px 에선 「아보카도 바나…」로 잘렸다)`, r.잘린이름, 0)
}

// ───────── ③ ⛔패드·가로는 «3칸» 그대로 ─────────
// 창업자 제보 *"패드에서 레시피두개 높이 안맞아"* 로 못 박은 것이다 — 이번 변경이 흔들면 안 된다.
console.log('\n③ ⛔패드·가로는 «3칸» 그대로 (창업자 제보로 못 박은 자리)')
for (const [w, h, 이름] of [[820, 1180, '패드 세로'], [1194, 834, '패드 가로'], [900, 500, '폰 가로']]) {
  const r = await 재기(w, h)
  const 셋편 = r.줄.find((x) => x.칸 === 3)
  chk(`  ${이름} ${w}×${h} · 3편 줄이 «3칸»이다`, 셋편?.한줄, 3)
  chk(`  ${이름} · 가로 넘침 0`, !r.가로넘침, 'true')
}

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
