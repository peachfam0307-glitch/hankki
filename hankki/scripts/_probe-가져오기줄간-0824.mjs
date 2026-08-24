// 📏 가져오기 화면 «줄 간격»이 균일한가 (창업자 제보 2026-08-24)
//
// 📮 창업자 = *"a대로 하되 줄간을 맞춰줘 지금은 다 다닥다닥 붙어있고 균일하지 않은 느낌이야."*
//           ＋ *"빨간글씨는 조금 작게하자. 전체적으로 정신이 없어보이네.."*
//
// ⭐ 「균일하지 않다」를 숫자로 바꾼다 — 카드마다 «제목 아랫변 ↔ 설명 윗변» 틈을 재서
//    그 값들이 서로 얼마나 벌어지는지(최대−최소) 본다. 눈으로는 「느낌」이지만 이건 잴 수 있다.
// ⭐ ＋ 「다닥다닥」 = 줄 높이(line-height)와 카드 사이 틈. 셋 다 같이 잰다.
//
// ⛔ 「보기 좋다」는 내가 정하지 않는다(규칙 11) — 나는 «어긋난 곳»만 찾아서 창업자에게 준다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-가져오기줄간-0824.mjs
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
await new Promise((r) => srv.listen(4425, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4425/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
  t?.click()
})
await page.waitForTimeout(1300)

const 값 = await page.evaluate(() => {
  const 줄 = (el) => {
    const cs = getComputedStyle(el)
    return { 글자: parseFloat(cs.fontSize), 줄높이: parseFloat(cs.lineHeight) || null, 굵기: cs.fontWeight, 색: cs.color }
  }
  // 목록 카드 넷 — `.opt-row` 안의 제목(.a)과 설명(.b)
  const 카드 = [...document.querySelectorAll('.opt-row')].map((row) => {
    const 제목 = row.querySelector('.a') || row.querySelector('.t > div:first-child')
    const 설명 = row.querySelector('.b') || row.querySelector('.t > div:last-child')
    if (!제목 || !설명) return null
    const r1 = 제목.getBoundingClientRect(), r2 = 설명.getBoundingClientRect()
    return {
      이름: (제목.textContent || '').trim().slice(0, 12),
      틈: Math.round((r2.top - r1.bottom) * 10) / 10,
      제목: 줄(제목), 설명: 줄(설명),
      카드키: Math.round(row.getBoundingClientRect().height),
    }
  }).filter(Boolean)

  // 빨간 글씨 — `var(--danger)` 로 칠해진 꼬리
  const 빨강 = [...document.querySelectorAll('b, span')]
    .filter((x) => /열쇠\s*\d/.test(x.textContent || ''))
    .map((x) => {
      const cs = getComputedStyle(x)
      return { 글: (x.textContent || '').trim().slice(0, 14), 글자: parseFloat(cs.fontSize), 색: cs.color, 굵기: cs.fontWeight }
    })

  // 카드 사이 틈
  const 상자 = [...document.querySelectorAll('.opt-row')].map((x) => x.getBoundingClientRect())
  const 사이 = []
  for (let i = 1; i < 상자.length; i++) 사이.push(Math.round((상자[i].top - 상자[i - 1].bottom) * 10) / 10)

  return { 카드, 빨강, 사이 }
})

console.log('══ 목록 카드 — 제목↔설명 틈 ══')
console.table(값.카드.map((c) => ({
  이름: c.이름, 틈: c.틈, 카드키: c.카드키,
  제목: `${c.제목.글자}/${c.제목.줄높이}`, 설명: `${c.설명.글자}/${c.설명.줄높이}`,
})))
const 틈들 = 값.카드.map((c) => c.틈)
if (틈들.length) {
  const 차 = Math.max(...틈들) - Math.min(...틈들)
  console.log(`  틈 = ${틈들.join(' · ')}  →  ${차 === 0 ? '✅ 전부 같다' : `⛔ 최대 ${차}px 어긋난다`}`)
}
console.log(`  카드 사이 틈 = ${값.사이.join(' · ') || '(없음)'}`)

console.log('\n══ 빨간 글씨(값 꼬리) ══')
console.table(값.빨강)

await b.close(); srv.close()
