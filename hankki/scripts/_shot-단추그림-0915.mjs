// 🎨 [2026-09-15] **「담기」·「타이머」 단추에 그림을 붙이면 어떤가 — 시안.**
//   📮 창업자 = *"타이머도 그림을 아래에 하나 붙이면 어떨까? 장보기 담기도 카트같은거 붙이고"*
//      ＋ *"만드는법을 아래로 살짝만 내리자 알약이랑 너무 붙어있으니까 답답해보여"*
//      ＋ *"체크가 안되어있으면 장보기 담기가 어떻게 보이는지도 보여줘"*
//   🔢 지금 = 담기엔 `cart` 아이콘 **13px** 뿐 · 타이머는 **글자만**(아이콘 0) · 만드는 법 `marginTop 26`
//   ⛔ 새로 그린 그림은 없다 — 이미 가진 컷이다(규칙 8).
//      · 담기 = `ui/wave/pn_shoplist`(장바구니 든 펭) — 재료 머리 곰(`gom_shop`)과 «안 겹치게» 다른 컷
//      · 타이머 = `ui/wave/gom_pot`(냄비 곰)
//   ⛔ 앱 소스를 한 글자도 안 고친다 — 주입으로 그려 보여줄 뿐이다(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const 그림 = (씨) => '/hankki/assets/' + readdirSync(join(DIST, 'assets')).find((f) => f.startsWith(씨 + '-'))
const 펭 = 그림('pn_shoplist'); const 냄비 = 그림('gom_pot')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4514, r))
const OUT = process.env.SHOT_OUT || '/tmp/단추그림'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
// ⚠️⚠️ 이 함수는 «브라우저 안»에서 돈다 — 바깥 함수를 부르면 `is not defined` 로 죽는다(이번에 한 번 죽였다).
//    그래서 A안 깔기·그림 붙이기를 «한 함수 안»에 다 넣고, 무엇을 할지는 옵션으로 받는다.
const 판 = (v) => {
  // ── A안 = 담기를 재료 목록 «끝»으로 · 채운 brown 넓은 단추 ──
  if (v.A) {
    const 옛 = document.querySelector('.mini-buy')
    if (옛) {
      const 새 = document.createElement('button')
      새.className = 'press hk-담기'
      // 🎨 📮 창업자 = *"담기 색이 너무 진해보이는데 조금 연하게"* — `--brown` 에 흰색을 섞는다.
      //    ⛔ 색값을 박지 않는다 — 테마마다 `--brown` 이 다르다(살구는 군고구마 #8a4a26).
      const 바탕 = v.연하게 ? `color-mix(in srgb, var(--brown) ${v.연하게}%, #fff)` : 'var(--brown)'
      새.setAttribute('style', 'display:flex;align-items:center;justify-content:center;gap:8px;width:100%;'
        + `margin-top:16px;padding:15px;border-radius:16px;background:${바탕};color:#fff;font-weight:800;font-size:17px;border:none`)
      새.innerHTML = 옛.innerHTML
      옛.remove()
      const 재료들 = [...document.querySelectorAll('.ing')]
      const 끝 = 재료들[재료들.length - 1]
      if (끝 && 끝.parentElement) 끝.parentElement.appendChild(새)
    }
  }
  // ── 그림 붙이기 ──
  if (v.그림) {
    const 담 = document.querySelector('.hk-담기')
    if (담) {
      const svg = 담.querySelector('svg'); if (svg) svg.remove()
      const i = document.createElement('img')
      i.src = v.펭; i.setAttribute('style', 'height:34px;width:auto;flex:0 0 auto')
      담.prepend(i)
    }
    const 타 = [...document.querySelectorAll('.mini-buy')].find((e) => e.textContent.trim() === '타이머')
    if (타 && v.타이머 === '옆') {
      타.setAttribute('style', 'display:inline-flex;align-items:center;gap:5px')
      const i = document.createElement('img')
      i.src = v.냄비; i.setAttribute('style', 'height:26px;width:auto;flex:0 0 auto')
      타.prepend(i)
    }
    if (타 && v.타이머 === '아래') {
      const 머리 = 타.closest('.sec-head')
      if (머리) {
        const 칸 = document.createElement('div')
        칸.setAttribute('style', 'display:flex;justify-content:flex-end;margin:-2px 0 6px')
        const i = document.createElement('img')
        i.src = v.냄비; i.setAttribute('style', 'height:52px;width:auto')
        칸.appendChild(i)
        머리.insertAdjacentElement('afterend', 칸)
      }
    }
  }
  // ── 체크 모양 ── 📮 창업자 = *"파란색 창말고 그냥 체크만 되는걸로 … 체크표시를 조금 진하게"*
  //   ⛔ 네모(채운 칸)를 지우고 **✓ 표시만** 남긴다. 끈 줄은 «빈 자리»다(자리는 그대로라 글이 안 흔들린다).
  if (v.체크만) {
    for (const 줄 of document.querySelectorAll('.ing')) {
      const 박스 = 줄.firstElementChild
      if (!박스) continue
      박스.setAttribute('style', 'flex:0 0 auto;width:21px;height:21px;margin-right:11px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none')
      const svg = 박스.querySelector('svg')
      if (svg) {
        svg.setAttribute('width', v.체크만); svg.setAttribute('height', v.체크만)
        svg.setAttribute('stroke-width', v.굵기 || 3)
        svg.style.color = 'var(--brown)'
        for (const e of svg.querySelectorAll('*')) { e.setAttribute('stroke', 'var(--brown)'); e.setAttribute('stroke-width', v.굵기 || 3) }
      }
    }
  }
  // ── 「만드는 법」 절을 «살짝 아래로» ── 📮 *"알약이랑 너무 붙어있으니까 답답해보여"*
  if (v.틈) {
    const 타 = [...document.querySelectorAll('.mini-buy')].find((e) => e.textContent.trim() === '타이머')
    const 머리 = 타 && 타.closest('.sec-head')
    if (머리) 머리.style.marginTop = v.틈 + 'px'
  }
}
const 시안 = {
  '1-지금': { },
  '2-A안-그림없음': { A: 1, 틈: 26 },
  '3-A＋그림-타이머옆': { A: 1, 그림: 1, 타이머: '옆', 틈: 26 },
  '4-A＋그림-타이머아래': { A: 1, 그림: 1, 타이머: '아래', 틈: 26 },
  '5-만드는법-틈40': { A: 1, 그림: 1, 타이머: '옆', 틈: 40 },
  '6-체크3개끔': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 끄기: 3 },
  '7-체크전부끔': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 끄기: '전부' },
  '8-체크만-17px': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 17, 굵기: 3 },
  '9-체크만-20px진하게': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 20, 굵기: 3.6 },
  '10-체크만-3개끔': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 20, 굵기: 3.6, 끄기: 3 },
  // 🎨 [창업자 2026-09-15] ②안 확정 뒤 — 담기 색을 «얼마나» 연하게 할지
  '11-연하게78': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 20, 굵기: 3.6, 연하게: 78 },
  '12-연하게64': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 20, 굵기: 3.6, 연하게: 64 },
  '13-연하게50': { A: 1, 그림: 1, 타이머: '옆', 틈: 40, 체크만: 20, 굵기: 3.6, 연하게: 50 },
}
for (const [이름, 옵션] of Object.entries(시안)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4514/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
  await p.locator('.grid-card').nth(1).click(); await p.waitForTimeout(1100); await 치우기(p)
  // ⚠️ 체크 끄기는 «먼저» 한다 — A안 단추는 주입한 DOM 이라 React 가 다시 안 그린다.
  //    순서를 바꾸면 「15개 담기」가 그대로 박혀 **끈 게 안 보인다**(이번에 한 번 그렇게 찍혔다).
  if (옵션.끄기) {
    await p.evaluate((몇) => {
      const 재료들 = [...document.querySelectorAll('.ing')]
      const n = 몇 === '전부' ? 재료들.length : 몇
      for (let i = 0; i < n && i < 재료들.length; i++) 재료들[i].click()
    }, 옵션.끄기)
    await p.waitForTimeout(700)
  }
  await p.evaluate(판, { ...옵션, 펭, 냄비 }); await p.waitForTimeout(600)
  // 📍 «재료 끝 ~ 만드는 법 머리»가 한 판에 같이 보이게 — 담기와 타이머를 한 번에 판정할 자리다
  await p.evaluate(() => {
    const 재료들 = [...document.querySelectorAll('.ing')]
    const 끝 = 재료들[재료들.length - 1]
    if (끝) { 끝.scrollIntoView({ block: 'center' }); window.scrollBy(0, 200) }
  })
  await p.waitForTimeout(600)
  await p.screenshot({ path: join(OUT, `${이름}.jpg`), type: 'jpeg', quality: 80 })
  const 글 = await p.evaluate(() => (document.querySelector('.hk-담기, .mini-buy') || {}).textContent || '')
  console.log(`  ${이름.padEnd(20)} 담기글="${글.trim()}"`)
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
