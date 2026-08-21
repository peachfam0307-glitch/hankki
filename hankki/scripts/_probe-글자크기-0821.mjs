// 🔠🔠 「우리 앱은 다 작고 잘 안 보인다」 — 창업자 2026-08-21
//
// 📮 창업자 원문 = *"쟤네는 큼직큼직하게 딱딱보여 우리는 좀 다 작고 잘 안보이고"*
//    ＋ *"우리앱이 좀 너무 작고 잘 안보인다는 생각은 했었거든"* (해먹으리와 무관하게 «전부터» 있던 생각)
//
// ⛔⛔ 이 판이 «절대» 하면 안 되는 것 = 소스에서 fontSize 를 grep 하는 것.
//    글자 크기는 ⑴인라인 style ⑵CSS 클래스 ⑶부모의 상속 ⑷clamp()·cqw 가 겹쳐 정해진다.
//    그래서 **화면에 그려진 뒤 computed style 로 재야** 진짜 값이다(절대원칙 18 ⓘ).
//
// ⭐ 무엇을 재나 — 「제일 큰 글자」가 아니라 **「유저가 실제로 읽는 글자」의 분포**다.
//    화면에 «보이는»(폭·높이 > 0 · visibility 정상) 텍스트 노드만 골라
//    ⑴ 글자 크기 ⑵ 굵기 ⑶ 대비율 ⑷ 그 글자가 몇 자인지 를 같이 찍는다.
//
// 🔢 판정 잣대 셋 (숫자로 못 박는다 — 「작아 보인다」는 사람마다 다르다)
//    ⓐ **본문 14px 미만이 몇 %인가** — 안드로이드 기본 본문이 14sp 이고, 그 아래는 「작은 글씨」다
//    ⓑ **그 화면에서 제일 큰 글자가 몇 px 인가** — 「큼직큼직」은 사실상 이 값이다
//    ⓒ **12px 이하가 있나** — 이건 「안 보인다」 소리를 듣는 구간
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-글자크기-0821.mjs
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
await new Promise((r) => srv.listen(4397, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
await page.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

// 📸 절대원칙 21 의 장치 — 화면 한가운데가 덮여 있으면 잰 값이 거짓이다
const 덮개 = await page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"]'
  for (const y of [200, 420, 700]) { const c = document.elementFromPoint(195, y)?.closest(판정); if (c) return `y=${y} · ${c.className}` }
  return ''
})
if (덮개) { console.log(`⛔ 덮개가 있다 — ${덮개}`); process.exit(1) }

// 🔠 «보이는 글자»만 골라 computed style 로 잰다
const 재기 = () => page.evaluate(() => {
  const L = (c) => { const m = (c || '').match(/\d+(\.\d+)?/g); if (!m) return 1; const [r, g, bl] = m.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl }
  const 바탕색 = (el) => { let e = el; while (e) { const s = getComputedStyle(e); const bg = s.backgroundColor; if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg; e = e.parentElement } return 'rgb(255,255,255)' }
  const 비 = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2) }

  const 결과 = []
  const 걷기 = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.trim()
        if (!t) continue
        const p = n.parentElement
        if (!p) continue
        const r = p.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) continue
        // 화면 «안»에 있는 것만 (아래로 스크롤해야 보이는 건 그 탭에서 따로 잰다)
        if (r.bottom < 0 || r.top > window.innerHeight) continue
        const s = getComputedStyle(p)
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.15) continue
        결과.push({
          글: t.slice(0, 24),
          px: +parseFloat(s.fontSize).toFixed(1),
          굵기: +s.fontWeight,
          대비: 비(s.color, 바탕색(p)),
          자수: t.length,
        })
      } else if (n.nodeType === 1) {
        const s = getComputedStyle(n)
        if (s.display === 'none' || s.visibility === 'hidden') continue
        걷기(n)
      }
    }
  }
  걷기(document.body)
  return 결과
})

// 하단 탭으로 화면을 옮긴다 — 라벨 글자로 찾는다(클래스는 바뀌어도 라벨은 유저가 보는 것)
const 탭이동 = async (라벨) => {
  const ok = await page.evaluate((L) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    const t = bs.find((b) => (b.innerText || '').replace(/\s+/g, '').includes(L))
    if (!t) return false
    t.click(); return true
  }, 라벨)
  if (ok) await page.waitForTimeout(700)
  return ok
}

const 화면들 = [null, '레시피', '장보기', '일기', '레꾸']
const 이름 = ['홈', '레시피', '장보기', '일기', '레꾸자랑']
const 모음 = []

console.log('\n🔠🔠 한끼 — 화면에 «실제로 그려진» 글자 크기 (폰 390×844 · 첫 화면)\n')
console.log('  ⛔ 소스 grep 아님 — computed style 실측\n')

for (let i = 0; i < 화면들.length; i++) {
  if (화면들[i]) { const ok = await 탭이동(화면들[i]); if (!ok) { console.log(`  ⚠️ 「${화면들[i]}」 탭을 못 찾았다 — 건너뜀`); continue } }
  const v = await 재기()
  if (!v.length) { console.log(`  ⚠️ ${이름[i]} — 글자를 못 찾았다`); continue }

  // 하단 탭 라벨(5개)은 어느 화면에나 있어 분포를 흐린다 → 따로 뺀다
  const 탭라벨 = new Set(['홈', '레시피', '장보기', '일기', '레꾸자랑', '냉장고', '가져오기'])
  const 본문 = v.filter((x) => !(탭라벨.has(x.글) && x.px < 13))

  const px = 본문.map((x) => x.px)
  const 큰것 = [...본문].sort((a, b) => b.px - a.px)[0]
  const 작은것 = [...본문].filter((x) => x.자수 >= 4).sort((a, b) => a.px - b.px).slice(0, 3)
  const 미만14 = 본문.filter((x) => x.px < 14).length
  const 이하12 = 본문.filter((x) => x.px <= 12)
  const 저대비 = 본문.filter((x) => x.대비 < 4.5 && x.px < 18)

  모음.push({ 화면: 이름[i], 개수: 본문.length, 최대: 큰것.px, 미만14: Math.round((미만14 / 본문.length) * 100), 이하12: 이하12.length, 중앙: px.sort((a, c) => a - c)[Math.floor(px.length / 2)] })

  console.log(`━━ ${이름[i]} ━━ (보이는 글자 ${본문.length}덩이)`)
  console.log(`   제일 큰 글자  = ${큰것.px}px (w${큰것.굵기})  「${큰것.글}」`)
  console.log(`   가운데값      = ${px[Math.floor(px.length / 2)]}px`)
  console.log(`   14px 미만     = ${미만14}덩이 (${Math.round((미만14 / 본문.length) * 100)}%)`)
  console.log(`   12px 이하     = ${이하12.length}덩이${이하12.length ? '  ⛔ ' + 이하12.slice(0, 4).map((x) => `${x.px}「${x.글}」`).join(' · ') : ''}`)
  if (작은것.length) console.log(`   제일 작은 글  = ${작은것.map((x) => `${x.px}「${x.글}」`).join(' · ')}`)
  if (저대비.length) console.log(`   ⚠️ 작고 흐린 것 = ${저대비.slice(0, 3).map((x) => `${x.px}px 대비${x.대비}「${x.글}」`).join(' · ')}`)
  console.log('')
}

console.log('━━━━━ 한 장 요약 ━━━━━')
console.log('  화면        제일큰   가운데   14px미만   12px이하')
for (const m of 모음) {
  console.log(`  ${m.화면.padEnd(10, ' ')}  ${String(m.최대).padStart(5)}   ${String(m.중앙).padStart(5)}   ${String(m.미만14 + '%').padStart(7)}   ${String(m.이하12).padStart(6)}`)
}
console.log('')

await b.close(); srv.close()
