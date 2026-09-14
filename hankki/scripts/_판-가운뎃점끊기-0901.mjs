// ✂️· **줄은 «가운뎃점(·)에서» 바뀌어야 한다 — 항목 한가운데가 아니라** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"**3큰술 · 다진마늘이잖아. 그럼 다진마늘부터 줄이 바뀌어야지. ·를 기준으로**"*
//    (그 앞 = *"2줄이 좋은데 **다진/ 마늘이네..**"*)
//
// ⭐⭐ **창업자가 나보다 훨씬 나은 규칙을 줬다.**
//    나는 「다진·잘게·얇게 …」 꾸미는 말 목록을 만들려고 했다(⛔목록은 반드시 빠진다).
//    창업자 규칙은 **구조**다 — `·` 가 «항목 구분자»니 **한 항목은 통째로**, 끊을 거면 `·` 자리에서.
//    ⭐ 덤으로 `styles.css` 요리모드 절에 *"가운뎃점이 줄 «머리»에 오는 걸음이 2 → 19개로 는다"* 고
//       적어 둔 **남은 흠도 같이 풀린다** — `·` 를 앞 줄 «끝»에 붙여 두면 줄 머리에 올 수가 없다.
//
// 🔢 **어떻게 해야 그렇게 되나 = 실물로 잰다**(짐작 금지). 갈래 넷을 같은 글월에 얹어 «줄이 갈린 자리»를 본다.
//    ⓐ 지금 그대로
//    ⓑ 항목 «안»의 빈칸을 안 끊기는 빈칸(U+00A0)으로
//    ⓒ ⓑ ＋ `·` 뒤에 폭 0 빈칸(U+200B)
//    ⓓ 항목마다 `<span>` ＋ `white-space: nowrap`, `·` 를 그 span «끝»에 붙이고 사이에 `<wbr>`
//
// 실행: node /home/user/hankki/hankki/scripts/_판-가운뎃점끊기-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/가운뎃점'
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

const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const 첫줄 = String(s).split('\n')[0].trim()
  if (첫줄) 걸음들.push(첫줄)
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
const n = Math.min(await 카드.count(), 14)
for (let i = 0; i < n; i++) {
  await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) break
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드 글자를 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

const 결과 = await p.evaluate(({ 걸음들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML
  el.style.textWrap = 'balance'

  const NB = ' ', ZW = '​'
  // ⭐ 「항목」 = `·` 로 갈린 조각. 그 «안»의 빈칸만 안 끊기게 한다(항목 «사이»는 끊겨야 하니까)
  const 항목묶기 = (t) => t.split('·').map((조각) => 조각.replace(/ /g, NB)).join('·')
  const 항목묶기ZW = (t) => t.split('·').map((조각) => 조각.replace(/ /g, NB)).join('·' + ZW)

  function 줄나눔(넣기) {
    넣기()
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const 줄 = []
    let 현재top = null, 현재 = ''
    const r = document.createRange()
    let node
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.data.length; i++) {
        r.setStart(node, i); r.setEnd(node, i + 1)
        const rect = r.getClientRects()[0]
        if (!rect) { 현재 += node.data[i]; continue }
        if (현재top !== null && rect.top > 현재top + 2) { 줄.push(현재); 현재 = '' }
        현재top = rect.top
        현재 += node.data[i]
      }
    }
    if (현재) 줄.push(현재)
    return 줄.map((s) => s.replace(/ /g, ' ').replace(/​/g, ''))
  }

  // ⛔⛔ **첫 판이 틀렸다 — `·` 가 «없는» 걸음까지 문장 통째를 nowrap 으로 묶었다.**
  //    그래서 964걸음 중 919개가 「1줄」이 되고 251개가 가로로 넘쳤다(꺾일 자리가 아예 없으니까).
  // ✅ 규칙을 좁힌다 — ⑴`·` 가 «둘 이상 조각»을 만들 때만 ⑵그중 «짧은 항목»만 묶는다.
  //    ⭐ 긴 꼬리(「…을 섞어 소스를 만들어요.」)는 그대로 꺾이게 둔다 — 안 그러면 또 넘친다.
  const 항목최대 = 14
  const 이스케이프 = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const 항목span = (t) => {
    const 조각 = t.split('·')
    if (조각.length < 2) return 이스케이프(t)
    return 조각.map((c, i) => {
      const 점 = i < 조각.length - 1 ? '·' : ''
      const 몸 = 이스케이프(c) + 점
      return c.trim().length <= 항목최대 ? `<span style="white-space:nowrap">${몸}</span>` : 몸
    }).join('<wbr>')
  }

  const 잣대 = '물 500ml, 간장 4큰술·원당 3큰술·미림 3큰술·다진 마늘 2큰술·와사비 1작은술을 섞어 소스를 만들어요.'
  el.style.maxWidth = '820px'
  const 판 = [
    ['ⓐ 지금 그대로', () => { el.textContent = 잣대 }],
    ['ⓑ 항목 안 빈칸을 NBSP', () => { el.textContent = 항목묶기(잣대) }],
    ['ⓒ ⓑ ＋ · 뒤 ZWSP', () => { el.textContent = 항목묶기ZW(잣대) }],
    ['ⓓ 항목 nowrap · balance', () => { el.style.textWrap = 'balance'; el.innerHTML = 항목span(잣대) }],
    ['ⓔ 항목 nowrap · pretty', () => { el.style.textWrap = 'pretty'; el.innerHTML = 항목span(잣대) }],
    ['ⓕ 항목 nowrap · wrap(그냥)', () => { el.style.textWrap = 'wrap'; el.innerHTML = 항목span(잣대) }],
    ['ⓖ 지금 글자 · wrap(그냥)', () => { el.style.textWrap = 'wrap'; el.textContent = 잣대 }],
  ]
  const 판결과 = 판.map(([이름, 넣기]) => ({ 이름, 줄: 줄나눔(넣기) }))

  // ⭐ 폭을 같이 움직이면 «·에서 끊으면서도» 두 줄이 되나 — 창업자가 원한 그 모양이 되는 폭 찾기
  const 폭별 = []
  for (const w of [820, 860, 900, 940, 980]) {
    el.style.maxWidth = w + 'px'
    폭별.push({ 폭: w, 줄: 줄나눔(() => { el.style.textWrap = 'balance'; el.innerHTML = 항목span(잣대) }) })
  }
  el.style.maxWidth = '820px'

  // 🔢 ＋ 964걸음 전수 — 「줄 수」와 「외톨이」와 「· 가 줄 머리에 오나」를 «한꺼번에»
  //    ⭐ `balance` 를 끄고 켜서 «누가 3줄을 만드나»를 갈라 본다(위 넷이 다 3줄이 된 게 수상하다)
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const 전수 = []
  // ⛔ `textWrap = ''` 로는 «못 끈다» — 인라인 스타일만 지워져 CSS 의 `text-wrap: balance` 로 되돌아간다.
  //    실제로 그렇게 재서 「balance 켬/끔이 숫자가 똑같다」는 헛값이 나왔다(규칙 18 ⓘ). → 'wrap' 으로 덮는다.
  for (const bal of ['balance', 'pretty', 'wrap']) {
    for (const [이름, 넣기] of [
      ['ⓐ 지금', (t) => { el.textContent = t }],
      ['ⓓ 항목 nowrap', (t) => { el.innerHTML = 항목span(t) }],
    ]) {
      el.style.textWrap = bal
      let 한줄 = 0, 두줄 = 0, 세줄이상 = 0, 넘침 = 0, 외톨이 = 0, 여러줄 = 0, 점머리 = 0
      for (const t of 걸음들) {
        넣기(t)
        // ⛔ span 판을 Range 의 `getClientRects()` 로 세면 «줄»이 아니라 «조각»을 센다 —
        //    그래서 1줄이 0개, 가로넘침 251 같은 헛값이 나왔다. 줄 수는 «상자 키»로 센다.
        const 줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
        // 외톨이·점머리를 보려면 «줄마다» 폭이 필요하다 → 글자를 훑어 줄을 직접 모은다
        const rects = []
        {
          const w2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          const rr = document.createRange()
          let top = null, 왼 = 0, 오 = 0, nd
          while ((nd = w2.nextNode())) {
            for (let i = 0; i < nd.data.length; i++) {
              rr.setStart(nd, i); rr.setEnd(nd, i + 1)
              const rc = rr.getClientRects()[0]; if (!rc || rc.width < 0.1) continue
              if (top !== null && rc.top > top + 2) { rects.push({ width: 오 - 왼 }); 왼 = rc.left }
              else if (top === null) 왼 = rc.left
              오 = rc.right; top = rc.top
            }
          }
          if (top !== null) rects.push({ width: 오 - 왼 })
        }
        if (줄 === 1) 한줄 += 1; else if (줄 === 2) 두줄 += 1; else 세줄이상 += 1
        if (el.scrollWidth > el.clientWidth + 1) 넘침 += 1
        if (줄 >= 2 && rects.length) {
          여러줄 += 1
          const 제일긴 = Math.max(...rects.map((x) => x.width))
          if (rects[rects.length - 1].width / 제일긴 < 0.35) 외톨이 += 1
          // 「·」가 줄 머리에 오나 — 각 줄 첫 글자를 집는다
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let top = null, node
          const rr = document.createRange()
          while ((node = walker.nextNode())) {
            for (let i = 0; i < node.data.length; i++) {
              rr.setStart(node, i); rr.setEnd(node, i + 1)
              const rc = rr.getClientRects()[0]; if (!rc) continue
              if (top !== null && rc.top > top + 2 && node.data[i] === '·') 점머리 += 1
              top = rc.top
            }
          }
        }
      }
      전수.push({ 이름: `${이름} · ${bal}`, 한줄, 두줄, 세줄이상, 넘침, 외톨이, 여러줄, 점머리 })
    }
  }
  el.style.textWrap = 'balance'
  el.innerHTML = 원래글
  return { 판결과, 폭별, 전수, 걸음수: 걸음들.length }
}, { 걸음들 })

console.log(`\n── 패드 가로 · 글줄 820px · 잣대 글월로 «줄이 어떻게 갈리나» ──`)
for (const r of 결과.판결과) {
  console.log(`\n  ${r.이름}`)
  r.줄.forEach((l, i) => console.log(`     ${i + 1}줄 │ ${l}`))
}

console.log(`\n── 「항목 nowrap ＋ balance」로 «폭»을 움직이면 ──`)
for (const r of 결과.폭별) { console.log(`\n  ${r.폭}px → ${r.줄.length}줄`); r.줄.forEach((l, i) => console.log(`     ${i + 1}줄 │ ${l}`)) }
console.log(`\n── 964걸음 전수 — 줄 수가 늘어나지 않나 (창업자 잣대 = 세 줄 최소화) ──`)
for (const r of 결과.전수) {
  console.log(`   ${r.이름.padEnd(24)} │ 1줄 ${String(r.한줄).padStart(3)} · 2줄 ${String(r.두줄).padStart(3)} · **3줄+ ${String(r.세줄이상).padStart(2)}** │ 외톨이 ${String(r.외톨이).padStart(3)}/${r.여러줄} │ ·가 줄머리 ${String(r.점머리).padStart(3)} │ 가로넘침 ${r.넘침}`)
}
await ctx.close(); await b.close(); srv.close()
