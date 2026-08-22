// 📏 [2026-08-22] 레시피 «상세» 화면 글자를 잰다 — 재료·만드는 법이 얼마나 작나
//
// 📮 창업자 = *"폰에 글자를 좀더 키울 수 있어? **특히 레시피상세부분 재료, 만드는법이 아직도 좀 작게 느껴져**"*
//
// ⛔ 어제 「글자2」는 «탭 다섯 화면»으로 재고 정했다 — **상세 화면은 그 잣대에 없었다.**
//    그래서 상세가 그대로 남았는지, 아니면 올랐는데도 모자란지 «재보고» 정한다(규칙 29).
//
// ⭐ 이 판이 재는 것 = **재료 줄 · 만드는 법 줄의 «실제 px»** ＋ 그 둘이 화면에서 차지하는 비중
//    ⛔ CSS 파일에 적힌 값이 아니라 «화면에 그려진 값»이다(둘은 다르다 — 2026-08-21 에 실제로 갈렸다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-상세글자-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4438, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const W = Number(process.env.W || 390), H = Number(process.env.H || 844)
const ctx = await b.newContext({ viewport: { width: W, height: H } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4438/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

// 레시피 탭 → 첫 레시피 열기
// ⛔⛔ 첫 판은 `document.querySelector('.grid-card').click()` 로 눌렀는데 **상세가 안 열렸다** —
//    목록 화면을 재놓고 「재료 절 없음」이 나왔다. 화면이 안 바뀐 걸 «숫자»는 모른다(규칙 18).
//    ✅ 이미 있는 도구(`_shot-옛곰상세-0814`)가 쓰는 방식을 그대로 쓴다 — Playwright 로 «진짜» 누른다.
await p.getByRole('button', { name: /^레시피/ }).last().click()
await p.waitForTimeout(800)
await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click()
await p.waitForTimeout(1000)
// 🔒 진짜 열렸나 — 안 열렸으면 «재지 않고 죽는다»(헛것을 재고 보고하는 게 제일 나쁘다)
const 제목 = await p.evaluate(() => (document.querySelector('.ing, .step') ? (document.querySelector('h1,.d-title,.detail-title')?.innerText || '열림') : null))
if (!제목) { console.log('\n⛔ 상세가 «안 열렸다» — 재지 않는다.\n'); // 📸 절대원칙 21 — 숫자만 보고 끝내지 않는다. 찍어서 «열어» 본다.
// ⛔ 재료·만드는 법은 «첫 화면 아래»에 있다 — 안 굴리고 찍으면 표지만 찍힌다(실제로 그랬다)
// ⛔ `.app-frame .screen` 에 scrollTop 을 주는 방식은 «안 먹었다»(굴리는 상자가 그게 아니다).
//    ✅ 마우스 휠로 «진짜» 굴린다 — 어느 상자가 굴러가든 상관없다.
await p.mouse.move(195, 500)
await p.mouse.wheel(0, 760)
await p.waitForTimeout(700)
const 사진 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/상세글자.png'
await p.screenshot({ path: 사진 })
console.log(`\n📸 ${사진}`)

await b.close(); srv.close(); process.exit(1) }

const 잰것 = await p.evaluate(() => {
  const 것 = []
  for (const el of document.querySelectorAll('*')) {
    const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ')
    if (!t) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    // ⛔ 꾸미기(레꾸) 글자는 창업자 확정 규격이라 이 판정 밖이다
    if (el.closest('.decor-layer,.memo-note,.cover,[class*="decor"]')) continue
    const cs = getComputedStyle(el)
    것.push({
      px: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      굵기: cs.fontWeight,
      글: t.slice(0, 26),
      길: (el.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 2).join(' '),
      // 어느 절에 속하나 — 「재료」·「만드는 법」 제목을 위로 타고 올라가며 찾는다
      절: (() => {
        let n = el
        while (n && n !== document.body) {
          const h = (n.previousElementSibling?.innerText || '') + ' ' + (n.innerText || '').slice(0, 12)
          if (/재료/.test(h)) return '재료'
          if (/만드는\s*법|만들기/.test(h)) return '만드는 법'
          n = n.parentElement
        }
        return ''
      })(),
    })
  }
  return 것
})

const 통계 = (목록) => {
  if (!목록.length) return '없음'
  const v = 목록.map((x) => x.px).sort((a, b) => a - b)
  const 작은 = 목록.filter((x) => x.px < 15).length
  return `${목록.length}덩이 · 제일 작은 ${v[0]}px · 가운데 ${v[Math.floor(v.length / 2)]}px · 15px 미만 ${작은}개(${Math.round(작은 / 목록.length * 100)}%)`
}

console.log(`\n📏 레시피 상세 «${제목 || '?'}» — ${W}×${H}\n`)
console.log(`  전체        ${통계(잰것)}`)
// ⛔⛔ 「절」을 DOM 을 타고 올라가 찾았더니 **앞 화면(목록) 글자까지 섞였다** —
//    화면을 옮겨도 앞 화면 DOM 은 «남는다»(2026-08-21 링크정직에서 이미 밟은 함정).
//    ✅ 잣대를 «그 클래스»로 콕 집는다. 흔들릴 자리가 없다.
const 콕 = await p.evaluate(() => {
  const 재기 = (sel) => [...document.querySelectorAll(sel)].map((e) => ({
    px: Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10,
    글: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30),
  }))
  return { 재료: 재기('.ing'), 소제목: 재기('.ing-head'), 만드는법: 재기('.step .txt') }
})
const 콕통계 = (목록) => (목록.length ? `${목록.length}줄 · ${[...new Set(목록.map((x) => x.px))].join('/')}px` : '⛔ 0줄 — 상세가 안 열렸다')
console.log(`  🥕 재료(.ing)          ${콕통계(콕.재료)}`)
console.log(`  🏷 소제목(.ing-head)   ${콕통계(콕.소제목)}`)
console.log(`  🍳 만드는 법(.step .txt) ${콕통계(콕.만드는법)}`)
console.log('\n  ── 실제 줄 (앞 3개씩) ──')
;['재료', '소제목', '만드는법'].forEach((k) => 콕[k].slice(0, 3).forEach((x) => console.log(`   ${String(x.px).padStart(5)}px  [${k}] ${x.글}`)))

console.log('\n  ── 제일 작은 글자 12개 ──')
;[...잰것].sort((a, b) => a.px - b.px).slice(0, 12).forEach((x) => {
  console.log(`   ${String(x.px).padStart(5)}px  w${x.굵기}  [${(x.길 || '-').padEnd(20, ' ')}] ${x.절 ? `(${x.절}) ` : ''}${x.글}`)
})

console.log('\n⭐ 읽는 법')
console.log('   · 재료·만드는 법은 «부엌에서 흘깃» 보는 글이라 다른 화면보다 커야 한다')
console.log('   · 어제 「글자2」는 탭 다섯 화면으로 정했다 — 상세는 그 잣대에 «없었다»')

// 📸 절대원칙 21 — 숫자만 보고 끝내지 않는다. 찍어서 «열어» 본다.
// ⛔ 재료·만드는 법은 «첫 화면 아래»에 있다 — 안 굴리고 찍으면 표지만 찍힌다(실제로 그랬다)
// ⛔ `.app-frame .screen` 에 scrollTop 을 주는 방식은 «안 먹었다»(굴리는 상자가 그게 아니다).
//    ✅ 마우스 휠로 «진짜» 굴린다 — 어느 상자가 굴러가든 상관없다.
await p.mouse.move(195, 500)
await p.mouse.wheel(0, 760)
await p.waitForTimeout(700)
const 사진 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/상세글자.png'
await p.screenshot({ path: 사진 })
console.log(`\n📸 ${사진}`)

await b.close(); srv.close()
