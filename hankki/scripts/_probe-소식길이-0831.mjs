// 📏 「한끼 소식이 얼마나 긴가 — 어디가 길게 만드나」 실측판
//
// 📮 창업자 2026-08-31 = *"장바구니는 소식에 띄워야지. 근데 **지금 너무 길어서(가을팩안내땜에)**"*
//
// ⭐⭐ **줄 수가 아니라 «높이»를 잰다** — 「가을팩 안내」는 줄 하나인데 그 안에 컷이 12개 펴져 있다.
//    줄만 세면 「12줄뿐인데?」가 되고, 진짜 범인(그림 띠)을 못 찾는다.
// ⛔ 소스를 읽어서 세지 않는다 — **화면에 그려진 상자**를 잰다(규칙 30·21).
// ⏰ 날짜를 갈아끼워 «내일(9/1)»도 같이 잰다 — 팝업이 뜨는 날이 그날이다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-소식길이-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
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

// 하루치를 잰다. `iso` = 그날 12:00 KST 를 UTC 로.
async function 재기(라벨, iso) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.clock.setFixedTime(new Date(iso))
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  // ⛔ 새 소식 팝업이 떠 있으면 소식 카드를 못 누른다 — «닫기 단추»로 닫는다
  //    ⛔ Escape 로는 안 닫힌다(`useModalBack` 은 뒤로가기를 쓴다) — 첫 판이 여기서 타임아웃으로 죽었다
  if (await p.locator('.sheet-mask').count()) {
    await p.locator('.sheet-mask .sheet').screenshot({ path: join(OUT, `팝업-${라벨}.png`) }).catch(() => {})
    await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click()
    await p.waitForTimeout(600)
  }
  await p.locator('button.news-card').first().click()
  await p.waitForTimeout(1400)

  const 값 = await p.evaluate(() => {
    const sheet = document.querySelector('.sheet-mask .sheet')
    if (!sheet) return null
    const 속 = sheet.querySelector('div[style*="padding: 2px 16px"]') || sheet.children[1]
    const 제목 = (글) => [...sheet.querySelectorAll('span')].find((s) => s.textContent.trim() === 글)
    const 절 = (글) => {
      const h = 제목(글); if (!h) return null
      const 머리 = h.parentElement, 통 = 머리?.nextElementSibling
      const 줄 = 통 ? [...통.children].map((d) => ({
        글: d.innerText.replace(/\n+/g, ' | ').trim().slice(0, 54),
        키: Math.round(d.getBoundingClientRect().height),
      })) : []
      return { 머리키: Math.round(머리.getBoundingClientRect().height), 줄 }
    }
    return {
      전체: Math.round(sheet.scrollHeight),
      보이는키: Math.round(sheet.clientHeight),
      속키: 속 ? Math.round(속.scrollHeight) : 0,
      패드안내: (() => { const e = [...sheet.querySelectorAll('div')].find((d) => d.innerText?.startsWith('패드·폴드에서도')); return e ? Math.round(e.closest('div[style*="border-radius"]')?.getBoundingClientRect().height || 0) : 0 })(),
      열림: 절('방금 열렸어요'),
      곧: 절('곧 열려요'),
      그다음: (() => {
        const p2 = [...sheet.querySelectorAll('p')].find((x) => /준비하고 있어요/.test(x.innerText))
        if (!p2) return 0
        let h = Math.round(p2.getBoundingClientRect().height)
        let n = p2.nextElementSibling
        while (n) { h += Math.round(n.getBoundingClientRect().height); n = n.nextElementSibling }
        return h
      })(),
    }
  })
  await p.locator('.sheet-mask .sheet').screenshot({ path: join(OUT, `소식-${라벨}.png`) }).catch(() => {})
  await ctx.close()
  return 값
}

for (const [라벨, iso] of [['0831', '2026-08-31T03:00:00Z'], ['0901', '2026-09-01T03:00:00Z']]) {
  const v = await 재기(라벨, iso)
  console.log(`\n══ ${라벨} ══`)
  if (!v) { console.log('  ⛔ 시트를 못 찾았다'); continue }
  console.log(`  전체 높이 ${v.전체}px · 화면 ${v.보이는키}px  → ${(v.전체 / v.보이는키).toFixed(1)}화면치`)
  console.log(`  · 패드 안내      ${String(v.패드안내).padStart(5)}px`)
  const 절찍기 = (이름, s) => {
    if (!s) { console.log(`  · ${이름} — 없음`); return 0 }
    const 합 = s.줄.reduce((a, r) => a + r.키, 0) + s.머리키
    console.log(`  · ${이름} ${String(합).padStart(5)}px (${s.줄.length}줄)`)
    s.줄.forEach((r) => console.log(`      ${String(r.키).padStart(4)}px  ${r.글}`))
    return 합
  }
  const a = 절찍기('방금 열렸어요', v.열림)
  const c = 절찍기('곧 열려요   ', v.곧)
  console.log(`  · 그다음엔       ${String(v.그다음).padStart(5)}px`)
  console.log(`  ▶ 방금 ${a} · 곧 ${c} · 그다음 ${v.그다음} · 패드 ${v.패드안내}`)
}
console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
