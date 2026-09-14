// 🍽 홈 음식 아이콘이 접시 프레임(가을의 정원) 밖으로 나온다 — 실제 px 로 잰다 (창업자 2026-09-01)
//
// 📮 창업자 = *"음식아이콘을 레꾸에서 정확하게 가을의 정원으로 딱 덮었는데 **홈에서는 아이콘이 더 크네**.."*
//
// ⭐ 재는 법 = 화면에 «실제로 그려진 px»(절대원칙 30). 코드의 % 가 아니라 결과를 본다.
//   ⛔ 「70% 라서 그렇다」는 소스를 읽은 «짐작»이다 — 접시와 그림이 몇 px 인지, 몇 % 삐져나오는지를 잰다.
//
// 🔢 재는 자리 셋 — 같은 레시피·같은 꾸미기를 세 화면에 올려놓고 잰다
//   ① 홈 「자주 해먹는」(`.mini-card`)  ② 홈 「최근 저장」(`.grid-card`)  ③ 레시피 모아보기(`.rc-card`)
//   ⭐ ③ 이 «레꾸 캔버스와 같은 값»이다 — 레꾸(`DecorEditor`)·검색·즐겨찾기·장보기가 전부 Thumb 기본값 56% 다.
//      홈 둘만 70% 를 손으로 넘긴다(`HomeScreen.jsx:81·585`).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-접시아이콘-0901.mjs
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
const PORT = 4396
await new Promise((r) => srv.listen(PORT, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const URL0 = `http://127.0.0.1:${PORT}/hankki/`
await page.goto(URL0, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// 🍽 모든 레시피에 「가을의 정원」 접시 하나를 «가운데·판 전체»로 얹는다.
//   ⭐ s:1 = 판 폭 100% — 창업자가 레꾸에서 그림을 딱 덮게 맞춘 그 상태를 가장 크게 잡은 것.
//      접시를 «키워도» 홈에서 그림이 더 크면 그건 접시 탓이 아니라 그림 탓이라는 게 드러난다.
const 씌웠나 = await page.evaluate(() => {
  const raw = localStorage.getItem('hankki:v1'); if (!raw) return 0
  const st = JSON.parse(raw); let n = 0
  for (const r of st.recipes || []) {
    r.thumb = 'icon'
    r.image = null
    r.decor = [{ id: 'probe-dish', type: 'sticker', key: 'pf_ad01', x: 0.5, y: 0.5, s: 1, r: 0 }]
    n++
  }
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return n
})
await page.goto(URL0, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1200)

// 📐 판 상자는 클래스로 못 집는다(화면마다 다르다) → «접시 img 의 부모 사슬»에서 정사각 상자를 찾는다(절대원칙 18 ⓘ).
const 재기 = async (sel, 이름) => {
  const v = await page.evaluate((sel) => {
    const card = document.querySelector(sel); if (!card) return null
    const 접시 = [...card.querySelectorAll('img')].find((i) => (i.src || '').includes('pf_ad01'))
    if (!접시) return { 못찾음: { 접시: false } }
    // 판 = 접시가 놓인 꾸미기 층의 부모 = 정사각(비율 0.98~1.02) 인 가장 가까운 조상
    //   ⛔ 첫 정사각 조상은 «꾸미기 층»이라 접시밖에 없다 — 음식 그림까지 «품는» 가장 작은 정사각까지 올라간다
    let el = 접시.parentElement, 판el = null, 그림 = null
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect()
      if (r.width > 20 && Math.abs(r.width / r.height - 1) < 0.02) {
        // ⛔ 그림은 «그 판 안»에서만 찾는다 — 화면 전체에서 고르면 상단바 캐릭터를 잰다(절대원칙 18 ⓘ)
        const f = [...el.querySelectorAll('img')].find((i) => i !== 접시 && Math.min(i.getBoundingClientRect().width, i.getBoundingClientRect().height) > 8)
        if (f) { 판el = el; 그림 = f; break }
      }
      el = el.parentElement
    }
    if (!판el) return { 못찾음: { 판: false, 그림: false } }
    const 판 = 판el.getBoundingClientRect(), D = 접시.getBoundingClientRect(), F = 그림.getBoundingClientRect()
    const f = Math.min(F.width, F.height)
    return {
      판: +판.width.toFixed(1), 접시: +D.width.toFixed(1), 그림: +f.toFixed(1),
      그림비: +(f / 판.width).toFixed(3), 접시비: +(D.width / 판.width).toFixed(3),
      그림대접시: +(f / D.width).toFixed(3),
    }
  }, sel)
  return [이름, v]
}

const 결과 = []
결과.push(await 재기('.mini-card', '홈 자주해먹는'))
결과.push(await 재기('.grid-card', '홈 최근저장'))

// 레시피 탭으로 간다 (＝레꾸 캔버스와 «같은» 56%)
//   ⛔ 「레시피」 글자로 찾으면 홈 카드 제목이 먼저 걸린다 → 하단바를 콕 집는다(절대원칙 18 ⓘ)
await page.locator('.bottom-nav button, nav button').filter({ hasText: '레시피' }).first().click().catch(() => {})
await page.waitForTimeout(1500)
const 도착 = await page.evaluate(() => !!document.querySelector('img[src*="pf_ad01"]'))
결과.push(도착 ? await 재기('body', '레시피 모아보기') : ['레시피 모아보기', null])

console.log(`\n🍽 접시(가을의 정원 pf_ad01) ↔ 음식 아이콘 — 실제 그려진 px  (390×844 · 레시피 ${씌웠나}편에 씌움)\n`)
for (const [이름, v] of 결과) {
  if (!v) { console.log(`  ⛔ ${이름} — 카드를 못 찾았다`); continue }
  if (v.못찾음) { console.log(`  ⛔ ${이름} — ${JSON.stringify(v.못찾음)}`); continue }
  const 삐짐 = v.그림대접시 > 1 ? `  🚨 접시보다 ${((v.그림대접시 - 1) * 100).toFixed(0)}% 크다` : ''
  console.log(`  ${이름.padEnd(14)} 판 ${String(v.판).padStart(6)}px · 접시 ${String(v.접시).padStart(6)}px · 그림 ${String(v.그림).padStart(6)}px   그림÷판 ${v.그림비}   그림÷접시 ${v.그림대접시}${삐짐}`)
}
console.log()

await b.close(); srv.close()
