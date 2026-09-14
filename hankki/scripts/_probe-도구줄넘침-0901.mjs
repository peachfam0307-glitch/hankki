// 🧰📏 **「꾸미기 도구 아이콘 일곱이 작은 폰에서 넘치나」** — 폭 넷을 실제로 재서 (2026-09-01)
//
// 📮 창업자 = *"작은 폰에서 안 넘치게 만들어"* (8/07 시안 안 C 캡처에서 「움직임」이 잘려 보였다)
//
// ⭐ 이 갈래는 **이미 앱에 있다** — `DecorEditor.jsx:1333` 「도구 바 = 화면 맨 아래 고정(창업자 2026-08-07 안 D 확정)」.
//    그래서 새로 만들 게 아니라 **넘치는지만** 재고 고친다(규칙 17 — 이미 한 일을 다시 하지 않는다).
//
// ⛔⛔ 도구 줄은 «스티커를 골라야» 나온다(`hasCtx`). 안 고르면 「붙인 걸 누르면 여기서 꾸며요」 안내뿐이다.
//    2026-09-01 에 그걸 모르고 «빈 상태»를 재서 「6층·21칸」이라 잘못 말할 뻔했다(규칙 18 ⓘ).
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-도구줄넘침-0901.mjs
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 🔢 창업자 폰은 390 — 320·360 은 «더 작은 유저»다. 412 는 큰 폰.
const 폭들 = [320, 360, 390, 412]
let 죽음 = 0
const 결과 = []

for (const W of 폭들) {
  const ctx = await b.newContext({ viewport: { width: W, height: 780 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }

  await p.locator('.nav-item', { hasText: '일기' }).first().click()
  await p.waitForTimeout(900)
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('button')].find((x) => x.querySelector('svg') && /^\d+$/.test((x.innerText || '').trim()))
    b2?.click()
  })
  await p.waitForTimeout(800)
  // 🧹 「출시기념 여름팩」 같은 안내 시트가 첫 클릭을 삼킨다
  for (let i = 0; i < 4; i++) {
    const 닫음 = await p.evaluate(() => {
      const sh = [...document.querySelectorAll('.sheet, [role="dialog"]')].filter((e) => e.getBoundingClientRect().height > 40)
      const top = sh[sh.length - 1]; if (!top) return null
      const btn = [...top.querySelectorAll('button')].find((x) => /나중에|볼게요|알겠|확인했|닫기/.test(x.innerText || ''))
      if (!btn) return null; btn.click(); return true
    })
    if (!닫음) break
    await p.waitForTimeout(500)
  }
  for (let i = 0; i < 3; i++) {
    const 눌렀나 = await p.evaluate(() => {
      const b2 = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^꾸미기$/.test((x.innerText || '').trim()))
      if (!b2) return false; b2.click(); return true
    })
    if (!눌렀나) break
    await p.waitForTimeout(1100)
  }

  // ⛔⛔ 「출시 기념 선물」 시트는 꾸미기에 들어간 «뒤»에 뜬다 — 앞에서만 닫으면 소용이 없다.
  //    2026-09-01 에 이걸 몰라서 네 폭 전부 「스티커가 안 골라졌다」로 죽었다(그림을 찍어 보고 알았다 · 절대원칙 21).
  for (let i = 0; i < 4; i++) {
    const 닫음 = await p.evaluate(() => {
      const sh = [...document.querySelectorAll('.sheet, [role="dialog"]')].filter((e) => e.getBoundingClientRect().height > 40)
      const top = sh[sh.length - 1]; if (!top) return null
      const btn = [...top.querySelectorAll('button')].find((x) => /나중에|볼게요|알겠|확인했|닫기/.test(x.innerText || ''))
      if (!btn) return null; btn.click(); return true
    })
    if (!닫음) break
    await p.waitForTimeout(600)
  }

  // ⭐ 스티커를 «골라야» 도구 줄이 나온다 — 종이에 붙어 있는 것 하나를 «진짜 마우스»로 누른다
  //   ⛔ dispatchEvent 로 만든 가짜 PointerEvent 는 React 의 onPointerDown 을 제대로 안 태운다.
  //      Playwright 의 click 은 진짜 pointer 이벤트를 낸다(흉내가 아니다 · 절대원칙 30).
  //   ⭐⭐ 붙은 것마다 «갈래 수»가 다르다 — 평범한 스티커는 셋(순서·움직임·효과)뿐이고
  //      일곱(＋색·글씨·무늬·모양)은 «포스트잇·글자»에서 나온다. 창업자 캡처가 바로 「✦ 포스트잇 꾸미기」다.
  //      ⛔ 아무거나 고르면 «제일 좁은 줄»을 재고 「안 넘친다」고 잘못 말하게 된다(규칙 18 ⓘ).
  //      → 붙은 것을 «전부» 눌러 보고 **갈래가 제일 많은 것**으로 잰다(그게 넘침의 최악이다).
  //   ⛔⛔ 좁은 폰에선 포스트잇이 «다른 스티커에 덮여» 좌표 클릭이 엉뚱한 데 맞는다
  //      (320·360 에서 note 가 붙어 있는데도 계속 3갈래만 나왔다).
  //      → 좌표가 아니라 **그 요소에 곧바로** pointerdown 을 보낸다. 덮여 있어도 그것이 골라진다.
  //      ⭐ 그래도 «흉내»가 아니다 — 진짜 앱의 진짜 요소가 진짜 핸들러로 받는다(절대원칙 30).
  const 스티커 = p.locator('[data-decor-item="note"], [data-decor-item]')
  const 개수 = await 스티커.count()
  let 최다 = -1, 최다종류 = ''
  for (let i = 0; i < 개수; i++) {
    await 스티커.nth(i).dispatchEvent('pointerdown', { bubbles: true, isPrimary: true, pointerId: 1, pointerType: 'touch', button: 0 }).catch(() => {})
    await 스티커.nth(i).dispatchEvent('pointerup', { bubbles: true, isPrimary: true, pointerId: 1, pointerType: 'touch', button: 0 }).catch(() => {})
    await p.waitForTimeout(320)
    const n = await p.evaluate(() => document.querySelectorAll('.decor-tools [data-ctxtab]').length)
    if (n > 최다) { 최다 = n; 최다종류 = (await 스티커.nth(i).getAttribute('data-decor-item')) || '' }
    if (n >= 7) break                                   // 일곱이면 최악이라 더 볼 것 없다
  }
  if (최다 < 7 && 개수) {                                 // 일곱짜리를 못 만났으면 그 중 제일 많은 것으로 다시
    for (let i = 0; i < 개수; i++) {
      await 스티커.nth(i).click({ force: true }).catch(() => {})
      await p.waitForTimeout(300)
      const n = await p.evaluate(() => document.querySelectorAll('.decor-tools [data-ctxtab]').length)
      if (n === 최다) break
    }
  }
  await p.waitForTimeout(500)
  // 📐 창업자 물음 = "D 를 하면 서랍이 차지하는 양이 너무 커서 아이콘들이 잘 안 보일까봐"
  const 서랍 = await p.evaluate(() => {
    const dr = document.querySelector('.decor-drawer')
    const bar = document.querySelector('.decor-tools')
    const H = window.innerHeight
    const 보임 = (e) => { const r = e.getBoundingClientRect(); return r.height > 8 && r.top < H && r.bottom > 0 }
    // 🍰 서랍 «안»을 층층이 쪼갠다 — 무엇이 스티커 자리를 먹나
    const 층 = dr ? [...dr.children].map((c) => ({ h: Math.round(c.getBoundingClientRect().height),
        글: (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 22) || '(그림)' })).filter((x) => x.h > 2) : []
    return { 층, 서랍키: dr ? Math.round(dr.getBoundingClientRect().height) : 0,
             바키: bar ? Math.round(bar.getBoundingClientRect().height) : 0,
             보이는칸: dr ? [...dr.querySelectorAll('img')].filter(보임).length : 0, 화면: H }
  })
  console.log(`  📐 서랍 ${서랍.서랍키}px · 도구 바 ${서랍.바키}px · 보이는 스티커 ${서랍.보이는칸}칸 (화면 ${서랍.화면}px)`)
  서랍.층.forEach((L) => console.log(`      ${String(L.h).padStart(4)}px  ${L.글}`))
  const 종류들 = await p.evaluate(() => [...document.querySelectorAll('[data-decor-item]')].map((e) => e.dataset.decorItem).join(','))
  console.log(`  🔎 붙은 것 = ${종류들 || '(없다)'} · 최다갈래 ${최다}(${최다종류})`)

  const m = await p.evaluate(() => {
    const bar = document.querySelector('.decor-tools')
    if (!bar) return { 못잼: '.decor-tools 가 없다' }
    const ic = [...bar.querySelectorAll('[data-ctxtab]')]
    if (!ic.length) return { 못잼: '아이콘 갈래가 안 떴다 — 스티커가 안 골라진 것이다' }
    const r0 = ic[0].getBoundingClientRect()
    const ys = [...new Set(ic.map((e) => Math.round(e.getBoundingClientRect().top)))]
    const 폭합 = ic.reduce((s, e) => s + e.getBoundingClientRect().width, 0)
    const barW = bar.getBoundingClientRect().width
    const 속폭 = barW - parseFloat(getComputedStyle(bar).paddingLeft) - parseFloat(getComputedStyle(bar).paddingRight)
    const 잘림 = ic.filter((e) => e.getBoundingClientRect().right > barW + 0.5).length
    return {
      갈래수: ic.length, 한칸: Math.round(r0.width), 키: Math.round(r0.height),
      줄수: ys.length, 폭합: Math.round(폭합), 속폭: Math.round(속폭), 바폭: Math.round(barW), 잘림,
      작은칸: ic.filter((e) => e.getBoundingClientRect().width < 44).length,
      이름: ic.map((e) => (e.innerText || '').trim()).join('·'),
    }
  })
  결과.push({ W, 최다종류, ...m })
  await p.screenshot({ path: `/tmp/hankki-도구줄-${W}.png` })
  await ctx.close()
}
await b.close(); srv.close()

console.log('\n🧰 꾸미기 도구 아이콘 줄 — 폭별 실측 (일꾸 · 스티커 고른 상태)')
for (const r of 결과) {
  if (r.못잼) { console.log(`\n── ${r.W}px ──\n  ⚠️ ${r.못잼} (⛔통과로 세지 않는다)`); 죽음++; continue }
  const 두줄 = r.줄수 > 1
  console.log(`\n── ${r.W}px ──`)
  // ⛔⛔ 갈래가 셋뿐인 «평범한 스티커»를 재고 「안 넘친다」고 하면 그건 초록불 거짓말이다.
  //    넘침은 «일곱일 때» 난다 → 일곱을 못 만났으면 판정하지 않는다(규칙 18 ⓘ).
  if (r.갈래수 < 7) { console.log(`  ⚠️ 갈래가 ${r.갈래수}개뿐 — «일곱짜리(글자·포스트잇)»를 못 만나 못 쟀다 (⛔통과로 세지 않는다)`); 죽음++ }
  console.log(`  갈래 ${r.갈래수}개 · 한 칸 ${r.한칸}×${r.키}px · 합 ${r.폭합}px / 쓸 폭 ${r.속폭}px`)
  console.log(`  줄 ${r.줄수}개 ${두줄 ? (죽음++, '⛔ 갈라졌다') : '✅ 한 줄'} · 잘림 ${r.잘림}개 ${r.잘림 ? (죽음++, '⛔') : '✅'} · 44px 미만 ${r.작은칸}개 ${r.작은칸 ? (죽음++, '⛔') : '✅'}`)
  console.log(`  ${r.이름}`)
}
console.log(죽음 ? `\n⛔ 어긋난 칸 ${죽음}개 — 🖼 /tmp/hankki-도구줄-*.png` : `\n✅ 네 폭 전부 한 줄 · 안 잘림 · 전부 44px 이상`)
process.exit(죽음 ? 1 : 0)
