// 🗓 「오늘 뭐 해먹지」가 «날짜로» 바뀌나 (창업자 확정 2026-08-28 = *"날짜로 돌리자"*)
//
// 📮 경위 = 창업자 = *"월요일로 맞추면 **일주일간 너무 암것도 없이 조용하지 않아?**"*
//    → 재보니 저절로 바뀌는 건 **월(제철·우리집레시피) · 목(장바구니)** 둘뿐인데
//       **「오늘」이라는 이름을 단 카드가 정작 날짜로 안 바뀌고 있었다**(`useState(0)`).
//    📮 그리고 = *"2번의 경우 냉장고에 암것도 없으면 똑같은거만 보니까.."*
//       → 「상위 몇 개 안에서만 돌리기」를 접은 근거. 냉장고가 비면 목록이 «전체»가 되는데
//         그 상위 N개는 고정이라 그게 그거다. **전체로 돌린다.**
//
// ⭐⭐ 재는 것 = **날짜를 바꿔 열면 «화면에 뜬 요리 이름»이 달라지나.**
//    ⛔ 「코드에 날짜가 들어갔나」를 grep 하지 않는다 — 그건 아무것도 안 잰다(절대원칙 18 ⓘ · 30).
//    ⛔ 「다른 추천」 단추를 눌러서 재지 않는다 — 그건 «전부터» 되던 것이다.
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-오늘추천-0828.mjs
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
await new Promise((r) => srv.listen(4396, r))

let 통과 = 0, 실패 = 0
const chk = (이름, ok, 값) => { console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← ${값}`}`); ok ? 통과++ : 실패++ }

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🕰 그 날짜에 앱을 «연» 것처럼 — `Date.now()` 와 `new Date()` 를 통째로 그날 정오로 옮긴다.
//    ⛔ localStorage 를 건드리지 않는다 — 우리가 재려는 건 «날짜»뿐이다.
const 그날에열기 = async (ymd) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.addInitScript((고정) => {
    const 진짜 = Date
    const 밀리 = 진짜.parse(고정)
    // eslint-disable-next-line no-global-assign
    Date = class extends 진짜 {
      constructor (...a) { if (a.length === 0) super(밀리); else super(...a) }
      static now () { return 밀리 }
    }
    Date.parse = 진짜.parse
    Date.UTC = 진짜.UTC
  }, `${ymd}T03:00:00Z`)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1100)
  const 이름 = await p.evaluate(() => {
    const t = document.querySelector('.today-title')
    return t ? t.textContent.trim() : null
  })
  await ctx.close()
  return 이름
}

console.log('\n🗓 이레 동안 「오늘 뭐 해먹지」에 뜨는 요리')
const 날들 = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06']
const 본것 = []
for (const d of 날들) {
  const 이름 = await 그날에열기(d)
  본것.push(이름)
  console.log(`   ${d}  ${이름 ?? '(못 찾음)'}`)
}

chk('카드를 찾았다 (이레 전부)', 본것.every(Boolean), 본것.join(' / '))
const 서로다른 = new Set(본것.filter(Boolean)).size
chk(`이레가 «다 같지» 않다 — 서로 다른 요리 ${서로다른}가지`, 서로다른 > 1, `${서로다른}가지`)
// ⭐ 하루만 달라도 「돈다」고 말하면 안 된다 — 이레 중 «절반 이상»이 서로 달라야 한다
chk('이레의 절반 이상이 서로 다르다', 서로다른 >= 4, `${서로다른}가지`)
// ⛔ 같은 날 두 번 열면 «같아야» 한다 — 날짜가 도는 것이지 무작위가 아니다
const 다시 = await 그날에열기('2026-08-31')
chk('같은 날 다시 열면 «같은» 요리다 (무작위가 아니다)', 다시 === 본것[0], `${다시} ↔ ${본것[0]}`)

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
