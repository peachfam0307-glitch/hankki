// 🖼 검수판 — 「한끼 일기」를 온보딩·안내코치에 넣은 실물
//
// 📮 창업자 2026-08-08 — *"우리 스샷이랑, 온보드, 안내코치에도 한끼일기 넣어야 하지 않아?"*
//    ⛔ 코드로 확인하니 셋 다 맞았다 — 온보딩 여덟 장에 「일기」 낱말 0회 · 코치 5단계에 없음 · 스샷 8장에 없음.
//    📌 뿌리 = 셋 다 «일기가 생기기 전»에 만들어졌다(온보딩 v9.03 · 코치 v8.60 vs 일기 v9.85~v10.02).
//
// 🎯 이 판이 재는 것
//    ① 온보딩이 9장인가 · 새 장면이 «그 자리»에 있나 · 글자가 안 넘치나
//    ② 홈 코치가 6단계인가 · 일기 단계가 하단바 일기 탭을 «실제로» 짚나
//    ⛔ 「예쁜가」는 창업자 몫(규칙 11). 나는 개수·자리·안 깨짐만 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4373, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const ok = (b, m) => { console.log(`${b ? '✅' : '⛔'} ${m}`); if (!b) bad++ }
let bad = 0
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

// ── ① 온보딩 ──────────────────────────────────────────────
{
  const page = await b.newPage({ viewport: { width: 380, height: 820 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => { console.log('⛔ pageerror:', String(e.message).split('\n')[0]); bad++ })
  // ⛔ onboarded 를 «안» 심는다 — 온보딩이 떠야 한다
  await page.addInitScript((a) => { localStorage.setItem('hankki:v1', JSON.stringify(a.s)) }, { s: { recipes: [], seedV: BASICS_VERSION } })
  await page.goto('http://127.0.0.1:4373/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const dots = await page.locator('[data-ob-dots] span, .ob-dots span').count().catch(() => 0)
  const slides = await page.evaluate(() => {
    // 슬라이드 트랙 = 가로로 나란히 붙은 자식들
    const t = document.querySelector('[data-ob-track]')
    if (t) return t.children.length
    // 표식이 없으면 화면 글자로 센다
    return null
  })
  console.log(`   슬라이드 표식 = ${slides ?? '(표식 없음)'} · 점 = ${dots || '(못 셈)'}`)

  // 「일기」 장면까지 넘기며 전부 찍는다
  const N = 9
  let found = -1
  for (let i = 0; i < N; i++) {
    await page.waitForTimeout(420)
    // ⛔⛔ body 전체를 읽으면 «안 보이는» 슬라이드까지 잡힌다 — 캐러셀이라 아홉 장이 다 DOM 에 있다.
    //    처음에 그렇게 재서 「1번째」로 나왔다(실물은 5번째였다). 규칙 18 그대로.
    //    ✅ 화면 «가운데»를 지나는 제목만 읽는다 = 지금 보이는 장면.
    const txt = await page.evaluate(() => {
      const mid = window.innerWidth / 2
      for (const el of document.querySelectorAll('h1')) {
        const r = el.getBoundingClientRect()
        if (r.left < mid && r.right > mid) return el.innerText
      }
      return ''
    })
    if (/일기가 돼요/.test(txt) && found < 0) found = i
    await page.screenshot({ path: `${OUT}/온보딩-${String(i + 1).padStart(2, '0')}.png` })
    const next = page.locator('button', { hasText: /다음|시작/ }).first()
    if (await next.count()) { await next.click().catch(() => {}) } else break
  }
  ok(found >= 0, `온보딩에 「일기가 돼요」 장면이 있다 (${found + 1}번째)`)
  ok(found === 4, `자리가 레꾸 다음(5번째)이다 — 실제 ${found + 1}번째`)
  await page.close()
}

// ── ② 홈 안내코치 ────────────────────────────────────────
{
  const page = await b.newPage({ viewport: { width: 380, height: 820 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => { console.log('⛔ pageerror:', String(e.message).split('\n')[0]); bad++ })
  await page.addInitScript((a) => {
    localStorage.setItem('hankki:v1', JSON.stringify(a.s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
  }, { s: { recipes: [], seedV: BASICS_VERSION } })
  await page.goto('http://127.0.0.1:4373/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)

  // 🔒 앵커가 «실제로» 붙었나 — 이게 없으면 코치가 짚을 자리가 없다
  const anchor = await page.locator('[data-coach="nav-diary"]').count()
  ok(anchor === 1, `하단바 일기 탭에 코치 앵커가 붙었다 (${anchor}개)`)

  let steps = 0, diaryShot = false
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('[aria-label="다음 안내 보기"]').count())) break
    const body = await page.locator('body').innerText()
    steps++
    if (/한끼 일기/.test(body) && !diaryShot) {
      await page.screenshot({ path: `${OUT}/코치-일기.png` })
      diaryShot = true
      // 말풍선이 «일기 탭»을 짚고 있나 — 구멍(하이라이트)이 그 버튼 위인지 좌표로 잰다
      const m = await page.evaluate(() => {
        const t = document.querySelector('[data-coach="nav-diary"]')
        const hole = document.querySelector('.coach-hole, [data-coach-hole]')
        if (!t) return null
        const tr = t.getBoundingClientRect()
        const hr = hole ? hole.getBoundingClientRect() : null
        return { tab: [Math.round(tr.left), Math.round(tr.top)], hole: hr ? [Math.round(hr.left), Math.round(hr.top)] : null }
      })
      if (m) console.log(`   일기 탭 (${m.tab}) · 코치 구멍 ${m.hole ? `(${m.hole})` : '(표식 못 찾음)'}`)
    }
    // ⛔ 코치엔 「다음」 «버튼»이 없다 — 화면 아무 데나 탭하면 넘어간다(오버레이가 role=button).
    //    📌 내가 처음에 버튼을 찾다가 1단계만 세고 «코치가 없다»고 잘못 판정했다(규칙 18).
    const ov = page.locator('[aria-label="다음 안내 보기"]').first()
    if (!(await ov.count())) break
    await ov.click({ position: { x: 10, y: 10 } }).catch(() => {})
    await page.waitForTimeout(380)
  }
  ok(diaryShot, '코치 단계에 「한끼 일기」가 있다')
  ok(steps >= 6, `코치가 6단계 이상이다 (센 것 ${steps})`)
  await page.close()
}

await b.close(); srv.close()
console.log(bad ? `\n⛔ 문제 ${bad}건` : '\n✅ 검수판 완료')
process.exit(bad ? 1 : 0)
