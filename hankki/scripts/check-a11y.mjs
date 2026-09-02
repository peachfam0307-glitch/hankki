// ♿ 접근성 자가검사 — 구글 「사전 출시 보고서」가 보는 것을 «우리가 먼저» 본다.
//
// 왜 있나 (2026-08-03):
//   창업자가 콘솔을 열어보니 **사전 출시 보고서가 아예 없었다** — 지금까지 구글이 우리 앱을
//   자동 검사한 기록이 하나도 없다. 그리고 8/02 반려 사유 ②가 *"테스트 권장사항을 따르지 않았습니다"* 였다.
//   ⛔ 「그것 때문에 반려됐다」고 단정하진 않는다(구글이 그렇게 말한 적 없다).
//   ✅ 다만 **보고서가 뜨기 전에 우리가 먼저 고칠 수 있다.**
//
// 구글 접근성 검사 항목(공식 문서 기준) = ①콘텐츠 라벨 ②터치 대상 크기 ③구현 ④낮은 대비
//   → 여기선 ①②④를 «실제 렌더된 화면»에서 잰다.
//
// ⭐⭐ 왜 «소스»가 아니라 «화면»인가
//   소스를 정규식으로 훑었더니 버튼 270개 중 1개가 「이름 없음」으로 걸렸는데 **오탐이었다** —
//   버튼 글자가 변수(`{t}`)라 정규식이 못 읽었을 뿐 화면엔 글자가 뜬다.
//   📌 **유저도 구글 로봇도 소스를 안 본다. 화면을 본다.**
//
// ⛔ 시끄러운 게이트는 죽은 게이트 → **실패로 막지 않고 «보고»만 한다.**
//    접근성은 「고치면 좋은 것」이라 배포를 막으면 곧 꺼버리게 된다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.SMOKE_PORT || 4199)
const BASE = `http://127.0.0.1:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined
const MIN_TAP = 44      // 안드로이드 48dp ≈ CSS 44~48px. 우리는 넉넉히 44 로 본다
const MIN_RATIO = 4.5   // WCAG AA 본문 기준. 큰 글자(18.66px+ bold 또는 24px+)는 3.0

const waitHttp = async (url, timeout = 45000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('preview 안 뜸')
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
await waitHttp(BASE)

const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] })
// 폰 크기로 본다 — 터치 영역은 화면 폭에 따라 달라진다
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(1600)
// 온보딩·코치마크 걷어내기 (그 위에선 아래 화면을 못 잰다)
for (const t of ['건너뛰기', '시작하기', '알겠어요', '닫기', '나중에']) {
  await page.getByRole('button', { name: t }).first().click({ timeout: 1200 }).catch(() => {})
  await page.waitForTimeout(180)
}
for (let i = 0; i < 10; i++) {
  const on = await page.evaluate(() => /탭해서 (다음|시작)/.test(document.body.innerText))
  if (!on) break
  await page.mouse.click(206, 800)
  await page.waitForTimeout(300)
}

const TABS = ['홈', '가져오기', '레시피', '장보기', '레꾸자랑']
const report = []

for (const tab of TABS) {
  // ⚠️ 하단 탭은 «nav 안에서» 찾는다 — 그냥 이름으로 찾으면 본문의 같은 글자 버튼이 잡혀
  //    탭이 안 바뀌고 홈만 반복해서 재게 된다(2026-08-03 실제로 그랬다).
  await page.locator('.bottom-nav .nav-item').filter({ hasText: tab }).first().click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(900)
  for (let i = 0; i < 8; i++) {   // 탭마다 코치마크가 또 뜬다
    const on = await page.evaluate(() => /탭해서 (다음|시작)/.test(document.body.innerText))
    if (!on) break
    await page.mouse.click(206, 800)
    await page.waitForTimeout(280)
  }

  const found = await page.evaluate(({ MIN_TAP, MIN_RATIO }) => {
    // ── 색 대비 계산 (WCAG) ──
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    // 배경은 «투명»인 경우가 많아 부모를 타고 올라가며 처음 만나는 불투명 색을 쓴다
    const bgOf = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor
        const a = (c.match(/[\d.]+/g) || [])[3]
        if (c && c !== 'transparent' && a !== '0') return rgb(c)
      }
      return [255, 255, 255]
    }
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
      return (x + 0.05) / (y + 0.05)
    }

    const out = { noName: [], smallTap: [], lowContrast: [] }
    const seen = new Set()
    // ⭐⭐ 「진짜 보이는 것」만 잰다 — 우리 앱은 화면이 «위로 쌓이는» 구조라
    //    탭을 옮겨도 앞 화면이 DOM 에 남는다. 그냥 훑으면 안 보이는 화면까지 재서
    //    「이번 주 제철」(홈에만 있는 것)이 모든 탭에 뜬다(2026-08-03 실제로 그랬다).
    //    → 그 지점을 손가락으로 찍었을 때 «맨 위에 잡히는 게 나 자신인가»로 판정한다.
    const onTop = (el, r) => {
      const x = Math.min(innerWidth - 2, Math.max(2, r.left + r.width / 2))
      const y = Math.min(innerHeight - 2, Math.max(2, r.top + r.height / 2))
      if (r.bottom < 0 || r.top > innerHeight) return false      // 스크롤 밖
      const hit = document.elementFromPoint(x, y)
      return !!hit && (hit === el || el.contains(hit) || hit.contains(el))
    }

    // ① 이름 없는 조작 요소 + ② 터치 영역
    for (const el of document.querySelectorAll('button, a[href], [role="button"], input, select')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue                       // 안 보이는 건 검사 대상 아님
      if (getComputedStyle(el).visibility === 'hidden') continue
      if (!onTop(el, r)) continue
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim()
      const key = (el.className || '') + '|' + Math.round(r.x) + ',' + Math.round(r.y)
      if (seen.has(key)) continue
      seen.add(key)
      const tag = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')
      if (!name) out.noName.push(tag)
      // ⚠️ 부모가 패딩으로 터치 영역을 넓혀주는 경우가 있어 «부모까지» 본다
      const pr = el.parentElement?.getBoundingClientRect()
      const w = Math.max(r.width, pr && pr.width < r.width * 2.5 ? pr.width : 0)
      const h = Math.max(r.height, pr && pr.height < r.height * 2.5 ? pr.height : 0)
      if (w < MIN_TAP || h < MIN_TAP) out.smallTap.push(`${tag} ${Math.round(w)}×${Math.round(h)}${name ? ` 「${name.slice(0, 12)}」` : ''}`)
    }

    // ④ 낮은 대비 — 글자가 «직접» 든 요소만
    for (const el of document.querySelectorAll('body *')) {
      const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('')
      if (txt.length < 2) continue
      const st = getComputedStyle(el)
      if (st.visibility === 'hidden' || st.opacity === '0') continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (!onTop(el, r)) continue
      const size = parseFloat(st.fontSize)
      const bold = Number(st.fontWeight) >= 700
      const need = (size >= 24 || (size >= 18.66 && bold)) ? 3.0 : MIN_RATIO   // 큰 글자는 기준이 낮다
      const cr = ratio(rgb(st.color), bgOf(el))
      if (cr < need) out.lowContrast.push(`"${txt.slice(0, 16)}" ${cr.toFixed(2)}:1 (필요 ${need}) ${Math.round(size)}px`)
    }
    return out
  }, { MIN_TAP, MIN_RATIO })

  report.push({ tab, ...found })
}

await browser.close()
server.kill('SIGTERM')

// ── 보고 ──
const sum = (k) => report.reduce((n, r) => n + r[k].length, 0)
console.log(`\n♿ 접근성 자가검사 — 탭 ${TABS.length}개 (폰 412×915)\n`)
for (const r of report) {
  const n = r.noName.length + r.smallTap.length + r.lowContrast.length
  console.log(`  ${n === 0 ? '✅' : '⚠️'} ${r.tab}  이름없음 ${r.noName.length} · 작은터치 ${r.smallTap.length} · 낮은대비 ${r.lowContrast.length}`)
  for (const x of [...new Set(r.noName)].slice(0, 4)) console.log(`       [이름없음] ${x}`)
  for (const x of [...new Set(r.smallTap)].slice(0, 6)) console.log(`       [작은터치] ${x}`)
  for (const x of [...new Set(r.lowContrast)].slice(0, 6)) console.log(`       [낮은대비] ${x}`)
}
console.log(`\n  합계 — 이름없음 ${sum('noName')} · 작은터치 ${sum('smallTap')} · 낮은대비 ${sum('lowContrast')}`)
if (errs.length) console.log(`  ⛔ 런타임 에러 ${errs.length}건: ${errs[0]}`)
console.log(`\n  📌 이건 «보고»다 — 배포를 막지 않는다. 구글 사전 출시 보고서와 «같은 항목»을 미리 보는 것.`)
console.log(`     터치 44px·대비 4.5:1 은 우리가 잡은 기준이고, 구글의 정확한 기준선은 공개돼 있지 않다.`)
console.log(`  ⚠️ 한계 — 「가져오기」는 위로 «쌓이는» 화면이라 뒤 탭에서도 안 닫힌다.`)
console.log(`     지금 믿을 수 있는 건 «홈»과 «가져오기» 두 화면 결과다. 나머지는 가져오기를 다시 잰 값.\n`)
