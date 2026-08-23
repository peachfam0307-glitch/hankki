// 📏 요리 모드 재료 준비 화면에서도 「메모지를 옆에 붙이기」가 되나 — 재보기만 (2026-08-20)
//
// ⭐ 왜 = 상세에선 재료줄이 그냥 `div.ing` 라 `float` 가 통했다(글이 옆으로 흐른다).
//    그런데 요리 모드 재료 준비는 **체크박스 «버튼» 줄**이라 구조가 다르다 —
//    `display:flex` 인 버튼은 float 를 «감싸지 않고» 통째로 아래로 밀린다.
//    📌 그러면 「필기하다 포스트잇 붙인」 그림이 안 나온다.
//
// ⛔ 앱 코드는 안 고친다 — 창업자 판정 전이다(규칙 13·25). 여기선 «재기만» 한다.
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
await new Promise((r) => srv.listen(4405, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul' })

const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
await p0.goto('http://127.0.0.1:4405/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 제목 = await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes[0]
  r.cooked = 1; r.cookedAt = Date.now() - 864e5
  s.diary = [{ id: 'd1', recipeId: r.id, title: r.title, at: Date.now() - 864e5, rating: 4, note: '간장 반만 · 마지막에 참기름', photo: null }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return r.title
})
await p0.close()

const 재기 = async (어디) => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4405/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  if (어디 === '요리') {
    await p.click('text=요리 시작')
    await p.waitForSelector('.memo-note', { timeout: 10000 })
  }
  const r = await p.evaluate(() => {
    // ⛔⛔ 첫 판에서 «14줄»이 나왔다 — 상세 7 ＋ 요리 준비 7. 화면을 쌓으면 이전 화면이 DOM 에 남는다.
    //    그래서 `줄[0]` 은 «화면 밖» 상세 것을 잡았고 「요리 준비도 된다」는 «거짓 통과»가 나왔다.
    //    ✅ 지금 보이는 화면 것만 본다 — 마지막 줄에서 거슬러 올라간다.
    const 모두 = [...document.querySelectorAll('.ing')]
    if (!모두.length) return null
    const 끝 = 모두[모두.length - 1]
    // 그 줄이 속한 «목록»만 다시 센다
    const 부모 = 끝.parentElement
    const 목록통 = 부모.parentElement || 부모
    const 줄 = [...목록통.querySelectorAll('.ing')]
    return {
      전체DOM줄: 모두.length,        // 쌓인 화면까지 합친 수(참고용)
      이화면줄: 줄.length,
      한줄태그: 부모.tagName,        // DIV 면 float 가 통하고 BUTTON 이면 안 통한다
      한줄display: getComputedStyle(부모).display,
      목록통폭: Math.round(목록통.getBoundingClientRect().width),
    }
  })
  await p.close()
  return r
}

const 상세 = await 재기('상세')
const 요리 = await 재기('요리')
console.log('상세      =', JSON.stringify(상세))
console.log('요리 준비 =', JSON.stringify(요리))
const 통하나 = (x) => x && x.한줄태그 === 'DIV' && !x.한줄display.includes('flex')
console.log(`\n📌 float 로 「옆에 붙이기」가 통하나 — 상세 ${통하나(상세) ? '✅ 된다' : '⛔ 안 된다'} · 요리 준비 ${통하나(요리) ? '✅ 된다' : '⛔ 안 된다'}`)
if (!통하나(요리)) {
  console.log('   ⛔ 요리 준비 화면은 재료 한 줄이 «flex 버튼»이라 float 를 감싸지 않는다.')
  console.log('   → 거기선 다른 방법이 필요하다(예: 목록을 2단으로 나누거나, 메모지를 목록 «위»에).')
}
await b.close(); srv.close()
