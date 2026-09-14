// 🔵 「홈 한끼 소식의 «새로» 알약」 시안판
//
// 📮 창업자 2026-08-31 = *"한끼소식에 알약은 **색을 다르게** 하거나, **새로 올라온게 있으면 표시**가 있으면 좋겠어."*
//    자리 되물음 = *"내가 말한건 **홈화면세 한끼소식 (새로)알약**"*
//
// 🔢 실측이 창업자 말 «둘 다»를 뒷받침했다 (`_probe-새로알약-0831.mjs`)
//    ⓐ **색** — 「새로」와 바로 아래 「아직 안 해봤어요」가 **똑같은 rgb(88,120,160) ＋ 흰 글자**다.
//       한 화면에 판박이 알약이 둘이라 「새로」가 «알림»이 아니라 «이름표»로 읽힌다.
//    ⓑ **표시** — 8/29~9/8 **일곱 날 전부** 「새로」가 떠 있었다. 우리집레시피가 주마다 열려서
//       `openedAlert` 가 21일 안에 늘 차 있기 때문이다. **늘 켜져 있으면 「새로」가 아니다.**
//       ⛔ 이건 코드 주석에 우리가 «직접 적어둔» 원칙이 깨진 것이다 —
//          `HomeScreen.jsx` = *"뱃지는 «새로 열린 게 있을 때만» 뜬다 — 늘 떠 있으면 아무도 안 본다."*
//
// ⛔ **판정은 창업자가 한다**(규칙 11) — 나는 갈래만 만든다.
// ⭐ 소스를 안 고친다 — **앱을 그대로 띄워** 화면에서 갈아끼워 찍는다(절대원칙 30).
//
// ✅✅ **판정 끝 = ㉣ 둘 다** (창업자 2026-08-31 *"ㄹ하자"*) → 앱에 들어갔다.
//    ⚠️ 그래서 **이 판은 이제 「전」을 못 찍는다** — 맨 위에서 팝업을 「닫기」로 치우는 순간
//       그게 «봤음»으로 쳐져 알약이 꺼진다(그게 고친 동작이다). 기록용으로만 남긴다.
//    👉 지금 모습을 다시 찍고 싶으면 `hankki:news:off` 를 켜서 팝업을 아예 안 띄우면 된다.
//    🔒 살아 있는 검사 = `_repro-새로알약-0831.mjs`(smoke · 14칸)
//
// 실행: node /home/user/hankki/hankki/scripts/_판-새로알약-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/새로알약'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 홈에서 「새로」 알약을 찾아 준다 — ⛔글자로만 찾으면 다른 화면의 잔재를 집는다.
const 찾기 = () => {
  window.__새로 = () => {
    const card = document.querySelector('button.news-card')
    return card ? [...card.querySelectorAll('span')].find((s) => s.innerText.trim() === '새로') : null
  }
}

const 갈래 = {
  // ㉠ 지금 그대로 — 파란 「새로」. 아래 「아직 안 해봤어요」와 같은 색이다.
  '㉠지금': () => {},
  // ㉡ 색만 다르게 — `--gift` 오렌지. ⭐새로 만든 색이 아니라 **이미 재둔 선물 색**이다
  //    (`styles.css:96` = *"앱 포인트가 전부 파랑이라 오렌지 알약 하나만 «유일하게 튄다»"*).
  //    ⛔ 그래서 소식 팝업·선물 줄과 «한 벌»이 된다 — 새 색을 늘리지 않는다.
  '㉡색만': () => { const s = window.__새로(); if (s) s.style.background = 'var(--gift)' },
  // ㉢ 읽으면 꺼진다 — 색은 그대로 두고 «동작»만. 소식을 열어 보면 사라지고, 새것이 오면 다시 뜬다.
  //    (화면에서는 «읽은 뒤» 모습 = 알약이 없는 모습)
  '㉢읽으면꺼짐': () => { const s = window.__새로(); if (s) s.remove() },
  // ㉣ 둘 다 — 주황이고, 읽으면 꺼진다. (여기 찍히는 건 «아직 안 읽은» 모습)
  '㉣둘다': () => { const s = window.__새로(); if (s) s.style.background = 'var(--gift)' },
}

for (const 테마 of [null, 'dark']) {
  for (const [이름, 손대기] of Object.entries(갈래)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    await ctx.addInitScript(SEED_COACH_SEEN)
    await ctx.addInitScript((t) => {
      try { localStorage.setItem('hankki:onboarded', '1') } catch { /* 화면은 돈다 */ }
      try { if (t) localStorage.setItem('hankki-theme', t) } catch { /* 기본 테마 */ }
    }, 테마)
    await ctx.clock.setFixedTime(new Date('2026-09-01T03:00:00Z'))
    const p = await ctx.newPage()
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(1200)
    if (await p.locator('.sheet-mask').count()) {
      await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click().catch(() => {})
      await p.waitForTimeout(500)
    }
    await p.evaluate(찾기)
    await p.evaluate(`(${손대기.toString()})()`).catch((e) => console.log('  ⚠️', 이름, e.message))
    await p.waitForTimeout(250)

    // ⭐ 소식 카드«만» 찍지 않는다 — 창업자가 말한 「색을 다르게」는 **아래 알약과 견주는 말**이다.
    //    그래서 「아직 안 해봤어요」까지 한 컷에 담는다.
    const 틀 = await p.evaluate(() => {
      const card = document.querySelector('button.news-card')
      const 아래 = [...document.querySelectorAll('.screen span, .screen div')]
        .find((e) => e.innerText && e.innerText.trim() === '아직 안 해봤어요')
      if (!card) return null
      const a = card.getBoundingClientRect()
      const c = 아래 ? 아래.getBoundingClientRect() : null
      const bottom = c ? c.bottom : a.bottom
      return { x: Math.max(0, a.left - 10), y: Math.max(0, a.top - 10), width: Math.min(390, a.width + 20), height: bottom - a.top + 22 }
    })
    const 이름표 = `${테마 || 'greige'}-${이름}`
    if (틀) await p.screenshot({ path: join(OUT, `${이름표}.png`), clip: 틀 })
    else await p.screenshot({ path: join(OUT, `${이름표}.png`) })
    console.log(`  📸 ${이름표}`)
    await ctx.close()
  }
}
console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
