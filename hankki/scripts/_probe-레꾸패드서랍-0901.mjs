// 🔍 서랍(꾸미기) 세로 레일이 «레꾸»와 «패드»에도 붙나 — 진짜 앱으로 잰다
//    이름표: 판정대기 (창업자 = 「이거 레꾸에도 적용되지? 패드랑.」 2026-09-01)
//
// ⛔ 코드로만 「같은 컴포넌트니까 된다」고 말하지 않는다(규칙 29·30) — 화면에서 잰다.
//    ⚠️ styles.css 에 서랍을 다시 잡는 «미디어쿼리 둘»이 있다:
//       @media (orientation: landscape) and (min-width:500px)  → .decor-editor …  .seg { padding: 6px }
//       @media (max-width:500px) and (max-height:700px)        → .seg { padding: 5px } · 갈래칸 32px
//    둘 다 «내 규칙보다 더 세다»(0,3,0 > 0,2,0) → 그 조건에선 여백 트림이 «덜» 먹는다. 그걸 재는 판이다.
//
// 쓰는 법 = node scripts/_probe-레꾸패드서랍-0901.mjs
import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' })
  res.end(fs.readFileSync(f))
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 🔢 창업자 기기 = 갤럭시 폰 ＋ 갤럭시 패드(둘 다 안드로이드 · CLAUDE.md 「자주 쓰는 사실」)
const 화면들 = [
  { 이름: '폰 세로 390×780', w: 390, h: 780 },
  { 이름: '패드 세로 800×1280', w: 800, h: 1280 },
  { 이름: '패드 가로 1280×800', w: 1280, h: 800 },
]
const 길들 = ['레꾸', '일꾸']
const OUT = process.env.OUT || '/tmp/hankki-레꾸패드'
fs.mkdirSync(OUT, { recursive: true })

const 시트닫기 = async (p) => {
  for (let i = 0; i < 5; i++) {
    const 닫음 = await p.evaluate(() => {
      const sh = [...document.querySelectorAll('.sheet, [role="dialog"]')].filter((e) => e.getBoundingClientRect().height > 40)
      const top = sh[sh.length - 1]; if (!top) return null
      const btn = [...top.querySelectorAll('button')].find((x) => /나중에|볼게요|알겠|확인했|닫기/.test(x.innerText || ''))
      if (!btn) return null; btn.click(); return true
    })
    if (!닫음) break
    await p.waitForTimeout(450)
  }
}

const 줄 = []
for (const s of 화면들) {
  for (const 길 of 길들) {
    const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 })
    await ctx.addInitScript(SEED_COACH_SEEN)
    await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
    const p = await ctx.newPage()
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(2200)
    for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }

    if (길 === '일꾸') {
      await p.locator('.nav-item', { hasText: '일기' }).first().click()
      await p.waitForTimeout(900)
      await p.evaluate(() => {
        const b2 = [...document.querySelectorAll('button')].find((x) => x.querySelector('svg') && /^\d+$/.test((x.innerText || '').trim()))
        b2?.click()
      })
    } else {
      // 🍚 레꾸 = 레시피 탭 → 첫 레시피 → 상세에서 「꾸미기」
      await p.locator('.nav-item', { hasText: '레시피' }).first().click()
      await p.waitForTimeout(1000)
      await p.evaluate(() => {
        // ⛔ 「그림 든 단추」로 고르면 상단바 아이콘까지 걸린다 → 화면 «본문»에서 제일 큰 카드
        const 후보 = [...document.querySelectorAll('button, a, [role="button"]')]
          .map((e) => ({ e, r: e.getBoundingClientRect() }))
          .filter((x) => x.r.width > 90 && x.r.height > 90 && x.r.top > 80)
        후보.sort((a, c) => c.r.width * c.r.height - a.r.width * a.r.height)
        후보[0]?.e.click()
      })
    }
    await p.waitForTimeout(1100)
    await 시트닫기(p)
    for (let i = 0; i < 3; i++) {
      const 눌렀나 = await p.evaluate(() => {
        // ⛔⛔ 첫 판이 «/^꾸미기$/» 였다 — 레시피 상세의 단추는 **「레시피 꾸미기」**라 안 걸렸다.
        //    그래서 상세 화면에 그대로 서 있었는데 판은 그걸 「서랍」이라 재려 했다(규칙 18 ⓘ).
        //    ⭐ 그림을 열어봐서 잡았다(절대원칙 21) — 숫자만 봤으면 못 봤다.
        const b2 = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
          .find((x) => /^(꾸미기|레시피 꾸미기|일기 꾸미기)$/.test((x.innerText || '').trim()))
        if (!b2) return false; b2.click(); return true
      })
      if (!눌렀나) break
      await p.waitForTimeout(1100)
    }
    await 시트닫기(p)
    await p.waitForTimeout(600)

    const m = await p.evaluate(() => {
      const dr = document.querySelector('.decor-drawer')
      if (!dr) return { 못잼: '서랍을 못 찾았다' }
      const R = dr.getBoundingClientRect()
      const 몸 = dr.querySelector('.decor-body')
      const 레일 = dr.querySelector('.decor-catsrow')
      const 굴림 = dr.querySelector('.decor-scroll')
      // 머리 = 서랍 위 ~ 「몸(레일＋굴림)」 위
      const 머리 = 몸 ? Math.round(몸.getBoundingClientRect().top - R.top) : null
      // 레일이 «세로»로 섰나 = 폭이 좁고 키가 크다
      let 레일모양 = '없다', 갈래보임 = 0, 갈래전체 = 0, 칸키 = 0
      if (레일) {
        const rr = 레일.getBoundingClientRect()
        레일모양 = rr.height > rr.width * 1.5 ? `세로 ${Math.round(rr.width)}×${Math.round(rr.height)}` : `가로 ${Math.round(rr.width)}×${Math.round(rr.height)}`
        const 알약 = [...레일.querySelectorAll('button')]
        갈래전체 = 알약.length
        갈래보임 = 알약.filter((x) => {
          const q = x.getBoundingClientRect()
          return q.height > 4 && q.top >= rr.top - 1 && q.bottom <= rr.bottom + 1
        }).length
        칸키 = 알약[0] ? Math.round(알약[0].getBoundingClientRect().height) : 0
      }
      // 스티커 = 굴림칸 «안»에 실제로 보이는 그림
      let 스티커 = 0
      if (굴림) {
        const gr = 굴림.getBoundingClientRect()
        스티커 = [...굴림.querySelectorAll('img')].filter((im) => {
          const q = im.getBoundingClientRect()
          return q.width > 8 && q.top >= gr.top - 1 && q.bottom <= gr.bottom + 1 && q.top < R.bottom
        }).length
      }
      // 모드줄(속지·글쓰기·일꾸·레꾸)이 있나 — 일기에만 있다
      const 모드줄 = [...dr.querySelectorAll('.segment')].find((e) => /속지|글쓰기/.test(e.innerText || ''))
      return {
        서랍: `${Math.round(R.width)}×${Math.round(R.height)}`,
        머리, 몸있나: !!몸, 레일모양, 갈래보임, 갈래전체, 칸키, 스티커,
        모드줄: 모드줄 ? Math.round(모드줄.getBoundingClientRect().height) : 0,
      }
    })
    줄.push({ 화면: s.이름, 길, ...m })
    await p.screenshot({ path: `${OUT}/${s.w}x${s.h}-${길}.png`, clip: await p.evaluate(() => {
      const dr = document.querySelector('.decor-drawer'); if (!dr) return null
      const r = dr.getBoundingClientRect()
      return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.top)) }
    }) || undefined }).catch(() => {})
    await ctx.close()
  }
}
await b.close(); srv.close()

console.log('\n🗄 서랍 세로 레일 — 레꾸·패드에도 붙나 (진짜 앱)\n')
for (const r of 줄) {
  if (r.못잼) { console.log(`  ⛔ ${r.화면} · ${r.길} — ${r.못잼}`); continue }
  console.log(`  ${r.화면.padEnd(18)} ${r.길}  서랍 ${String(r.서랍).padStart(9)} · 머리 ${String(r.머리).padStart(3)}px · 모드줄 ${String(r.모드줄).padStart(2)}px`)
  console.log(`  ${''.padEnd(18)}      레일 ${r.레일모양} · 갈래 ${r.갈래보임}/${r.갈래전체}(칸 ${r.칸키}px) · 스티커 ${r.스티커}칸`)
}
console.log(`\n🖼 ${OUT}\n`)
