// 🔤 계측 — 「미리 만든 글꼴 꾸러미가 왜 «반쪽»이었나」 (창업자 2026-08-05 카드 글자 깨짐의 뿌리)
//
// ⛔ 고치지 «않는다». 재는 것만 한다. 오늘 아침에 짐작으로 손댔다가 카드를 깨뜨렸다.
//
// 📖 라이브러리 코드가 답을 갖고 있었다 — `html-to-image/lib/embed-webfonts.js`
//    · 238~253줄 `getUsedFonts(node)` = 그 «노드와 자식들이 지금 쓰는» font-family 만 모은다
//    · 263~266줄 = @font-face 규칙을 **그 목록에 있는 것만** 남기고 버린다
//    → 즉 `getFontEmbedCSS(document.body)` 는 **그 순간 화면에 있는 글꼴만** 담는다.
//      v9.63 은 화면에 들어갈 때 이걸 만들어 뒀는데, 그때 손글씨(개구·나눔손글씨)를 쓰는
//      카드·표지는 **아직 안 붙어 있었다** → 손글씨가 꾸러미에서 빠짐 → 기본 고딕으로 떨어짐
//      → 글자 폭이 달라짐 → 「한끼」 두 줄 · 「15/분」.
//
// 🔬 이 스크립트는 그 «가설»을 브라우저에서 숫자로 확인한다(라이브러리 안 쓰고 같은 계산을 손으로).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4380)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const kong = basicRecipes.find((r) => r.title === '콩국수') // 손글씨가 들어간 꾸민 표지
const now = Date.now()
const state = {
  seedV: BASICS_VERSION, memoCleanV: 1, politeV: 2,
  recipes: [{ ...kong, status: 'sorted', savedAt: now }, ...basicRecipes.filter((r) => r.id !== kong.id).map((r, i) => ({ ...r, status: 'sorted', savedAt: now - (i + 1) * 60000 }))],
}

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

// 라이브러리와 «똑같은» 계산을 페이지 안에 심는다(embed-webfonts.js 235~253·263~266줄 그대로)
await page.addInitScript(() => {
  const norm = (f) => f.trim().replace(/["']/g, '')
  window.__usedFonts = (node) => {
    const s = new Set()
    const walk = (n) => {
      const ff = n.style.fontFamily || getComputedStyle(n).fontFamily
      ff.split(',').forEach((f) => s.add(norm(f)))
      Array.from(n.children).forEach((c) => { if (c instanceof HTMLElement) walk(c) })
    }
    walk(node)
    return s
  }
  window.__faces = () => {
    const out = []
    for (const sh of document.styleSheets) {
      let rules = []
      try { rules = Array.from(sh.cssRules || []) } catch (e) { continue }
      for (const r of rules) if (r.type === CSSRule.FONT_FACE_RULE) out.push(norm(r.style.fontFamily))
    }
    return out
  }
  // 「꾸러미에 실제로 담길 글꼴」 = @font-face 중 그 노드가 쓰는 것만
  window.__bundle = (sel) => {
    const node = sel ? document.querySelector(sel) : document.body
    if (!node) return null
    const used = window.__usedFonts(node)
    const all = [...new Set(window.__faces())]
    return { 전부: all, 담긴다: all.filter((f) => used.has(f)), 빠진다: all.filter((f) => !used.has(f)) }
  }
})

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  for (const k of ['hankki:coach:home2', 'hankki:coach:my', 'hankki:coach:search', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
}, state)
await page.goto(url)
await page.waitForTimeout(2500)

const show = (label, b) => {
  if (!b) { console.log(`  ${label} — 그 자리를 못 찾았다`); return }
  console.log(`  ${label}`)
  console.log(`     담긴다 ${b.담긴다.length}개 — ${b.담긴다.join(' · ') || '(없음)'}`)
  console.log(`     빠진다 ${b.빠진다.length}개 — ${b.빠진다.join(' · ') || '(없음)'}`)
}

console.log('\n🔤 @font-face 는 몇 개인가 · 그중 몇 개가 꾸러미에 담기나\n')
const all = await page.evaluate(() => [...new Set(window.__faces())])
console.log(`  앱이 선언한 글꼴 = ${all.length}개 — ${all.join(' · ')}\n`)

console.log('① 앱을 켠 «직후» · document.body 로 만들면 (= v9.63 이 한 방식)')
show('홈 화면', await page.evaluate(() => window.__bundle(null)))

await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1500)
console.log('\n② 레꾸자랑 탭에 들어간 뒤 · document.body')
show('레꾸자랑', await page.evaluate(() => window.__bundle(null)))

await page.locator('.grid-card button').first().click() // 콩국수 → 선택 시트 + 숨은 표지·레시피카드 마운트
await page.waitForTimeout(1200)
console.log('\n③ 선택 시트가 뜬 뒤(숨은 표지·레시피카드가 붙은 상태) · document.body')
show('시트 열림', await page.evaluate(() => window.__bundle(null)))

// ⛔ 여기서 한 번 틀릴 뻔했다 — `div[aria-hidden]` 은 화면에 여럿이라 querySelector 가
//    엉뚱한 걸 집는다(규칙 18: 「없다」·「이것이다」는 «확인 방식»부터 의심한다).
//    → 숨은 캡처 레이어를 «화면 밖(left: -99999)» 이라는 표시로 골라 «전부» 잰다.
console.log('\n④ 「캡처가 실제로 보는 자리」 하나하나 — 숨은 레이어의 자식 전부')
const each = await page.evaluate(() => {
  const box = [...document.querySelectorAll('div[aria-hidden]')].find((d) => (d.getAttribute('style') || '').includes('-99999'))
  if (!box) return null
  return [...box.children].map((el, i) => {
    const used = window.__usedFonts(el)
    const all = [...new Set(window.__faces())]
    return { 이름: `자식${i + 1} (${el.getBoundingClientRect().width | 0}px)`, 담긴다: all.filter((f) => used.has(f)), 빠진다: all.filter((f) => !used.has(f)) }
  })
})
if (!each) console.log('  숨은 캡처 레이어를 못 찾았다')
else for (const e of each) show(e.이름, e)

console.log('\n⑤ @font-face 규칙은 «몇 줄»인가 (한 글꼴에 굵기별로 여러 줄일 수 있다)')
const raw = await page.evaluate(() => window.__faces())
console.log(`  규칙 ${raw.length}줄 · 글꼴 ${new Set(raw).size}종`)

await browser.close()
