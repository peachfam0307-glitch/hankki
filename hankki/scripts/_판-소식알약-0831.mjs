// 💊 「한끼 소식 알약 — 층이 구분되나」 시안판
//
// 📮 창업자 2026-08-31 = *"한끼소식에 **알약은 색을 다르게 하거나, 새로 올라온게 있으면 표시가 있으면** 좋겠어."*
//
// 🔢 **실측이 창업자 말과 맞았다** — 알약이 전부 «흰 바탕 ＋ 파란 글자»다:
//    · 방금 열렸어요 = rgb(88,120,160)
//    · 곧 열려요     = rgb(95,146,152)   ← 눈으로 거의 안 갈린다
//    · 나중에        = rgb(88,120,160)   ← ⛔「방금 열렸어요」와 **완전히 같은 색**
//    📌 그래서 «지금 열린 것»과 «나중에 나올 것»이 색으로 구분이 안 된다.
//
// ⛔ **판정은 창업자가 한다**(규칙 11) — 나는 갈래만 만든다.
// ⭐ 소스를 안 고친다 — **앱을 그대로 띄워** 화면에서 스타일만 갈아끼워 찍는다(절대원칙 30).
//    그래야 「판에선 예뻤는데 앱에선 다르다」가 안 생긴다.
//
// 실행: node /home/user/hankki/hankki/scripts/_판-소식알약-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/알약'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

// 화면에서 «절»을 찾아 준다 — 제목 글자로 찾고 바로 다음 형제가 그 절의 줄 통이다.
const 절찾기 = () => {
  const w = window
  w.__절 = (글) => {
    const h = [...document.querySelectorAll('.sheet-mask span')].find((s) => s.textContent.trim() === 글)
    return h ? h.parentElement.nextElementSibling : null
  }
  w.__알약 = (통) => (통 ? [...통.querySelectorAll('span')].filter((s) => /^(.+ \d+(종|편)|나중에)$/.test(s.innerText.trim())) : [])
}

const 갈래 = {
  '㉠지금': () => {},
  // ㉡ 층마다 «채우기»를 다르게 — 진한 채움 → 선 → 회색. 눈이 위에서부터 세게 읽는다.
  '㉡채우기': () => {
    for (const s of window.__알약(window.__절('방금 열렸어요'))) {
      s.style.background = 'var(--brown)'; s.style.color = '#fff'
    }
    for (const s of window.__알약(window.__절('곧 열려요'))) {
      s.style.background = 'transparent'; s.style.border = '1.4px solid var(--tease-ic)'
    }
    for (const s of document.querySelectorAll('.sheet-mask span')) {
      if (s.innerText.trim() === '나중에') { s.style.color = 'var(--sand)'; s.style.background = 'transparent'; s.style.border = '1.4px solid var(--line)' }
    }
  },
  // ㉢ 「새로 올라왔다」 표시 — 방금 열린 줄에 «점». ⛔글자를 더 안 넣는다(줄이 길어진다)
  '㉢새표시': () => {
    const 통 = window.__절('방금 열렸어요'); if (!통) return
    for (const 줄 of 통.children) {
      const d = document.createElement('span')
      d.style.cssText = 'position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:999px;background:var(--gift)'
      줄.style.position = 'relative'
      줄.appendChild(d)
    }
  },
  '㉣둘다': () => { 갈래['㉡채우기'](); 갈래['㉢새표시']() },
}

for (const [이름, 손대기] of Object.entries(갈래)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* 화면은 돈다 */ } })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  if (await p.locator('.sheet-mask').count()) {
    await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click(); await p.waitForTimeout(500)
  }
  await p.locator('button.news-card').first().click()
  await p.waitForTimeout(1300)
  await p.evaluate(절찾기)
  await p.evaluate(`(${손대기.toString()})()`).catch((e) => console.log('  ⚠️', 이름, e.message))
  await p.waitForTimeout(300)
  await p.locator('.sheet-mask .sheet').screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  📸 ${이름}`)
  await ctx.close()
}
console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
