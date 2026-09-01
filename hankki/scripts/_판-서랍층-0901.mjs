// 🗄📐 **서랍 층 줄이기 — 갈래 셋을 «살아 있는 앱 화면»에 얹어 찍는다** (창업자 판정용 · 2026-09-01)
//
// 📮 창업자 = *"지금 폰에서 우리 꾸미기가 서랍버튼이(알약)이 차지하는 공간이 너무 커서
//    아이콘이 잘 안보여. 답답하게 느껴지거든"* → (제안을 보고) *"좋아"*
//
// 🔢 잰 값이 창업자 말을 그대로 뒷받침했다 (390px · 스티커 고른 상태)
//    서랍 263px 인데 스티커가 나오기 «전»에 167px(63%)이 깔린다:
//      38 손잡이 · 38 모드탭 · **56 갈래 알약** · 35 섹션 제목
//
// ⛔⛔ **흉내로 그리지 않는다**(절대원칙 30) — 진짜 앱을 띄워서 «그 화면의 요소»를 옮긴다.
//    `_판-열쇠이름-0824.mjs` 가 쓴 방식과 같다(소스를 안 고치므로 지금 앱 그대로에 얹힌다).
//
// ⭐ 갈래 셋
//    ㉠ 지금        — 그대로
//    ㉡ 세로 레일    — 갈래 알약을 «왼쪽 세로 띠»로 (Gboard 2024 가 바꾼 방식)
//    ㉢ 레일＋정리   — ㉡ ＋ 손잡이를 얇은 선으로 ＋ 섹션 제목을 격자에 붙인다
//
// 실행: node /home/user/hankki/hankki/scripts/_판-서랍층-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.OUT || '/tmp/hankki-서랍층'
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

// 🔢 창업자 폰(390)과 «제일 좁은 유저»(320) 둘 다 — 답답함은 좁은 데서 제일 크다
const 폭들 = [390, 320]
const 갈래 = [
  { id: '가-지금', 이름: '㉠ 지금' },
  // ⛔⛔ 옛 ㉡「세로 레일만」을 «뺐다» — 창업자 = *"ㄴ ㄷ의 다른점이 뭔지 모르겠다"*. 맞는 말이다.
  //    ㉡↔㉢ 차이는 «손잡이 38→4px ＋ 섹션 제목 줄 없애기» 뿐이라 34px 이다.
  //    ⭐ 그건 «갈래»가 아니라 어느 쪽을 골라도 같이 하는 «덤»이다 → 갈래에서 빼고 둘 다에 넣는다.
  { id: '다-레일정리', 이름: '㉡ 세로 레일' },
  // ⛔⛔ ㉣「격자 5칸」은 «뺐다» — 얹어 봤더니 **스티커가 통째로 비었다**(그림으로 잡았다 · 절대원칙 21).
  //    칸 구조를 밖에서 display:grid 로 덮으면 안쪽 그림이 죽는다.
  //    ⭐ 그래도 알아낸 건 남는다 = **머리를 90px 줄여도 3→5칸뿐**이라 다음 지렛대는 «격자 밀도»다.
  //       그건 얹기(injection)로는 못 보여준다 — 진짜 코드에서 고쳐야 한다.
  // { id: '라-격자5', 이름: '㉣ ＋ 격자 5칸' },
  //    ⛔⛔ ＋ 「격자가 3칸이라 좁다」는 내 말도 «틀렸다» — 잘라 보니 **원래 6칸**이다.
  //       3칸으로 보인 건 씨앗 일기의 첫 갈래(마테)에 스티커가 3개뿐이었기 때문이다.
  { id: '마-줄만줄임', 이름: '㉢ 레일 없이 줄만 줄임' },
]
const 잰값 = []

// 🗂 「데코」= 스티커 격자 · 「글자」= 글씨체 목록 — 생김새가 달라서 레일이 어떻게 보이는지도 갈린다
const 탭들 = ['데코', '글자']

for (const W of 폭들) {
  for (const 탭이름 of 탭들) {
  for (const g of 갈래) {
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
    const 시트닫기 = async () => {
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
    }
    await 시트닫기()
    for (let i = 0; i < 3; i++) {
      const 눌렀나 = await p.evaluate(() => {
        const b2 = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
          .find((x) => /^꾸미기$/.test((x.innerText || '').trim()))
        if (!b2) return false; b2.click(); return true
      })
      if (!눌렀나) break
      await p.waitForTimeout(1100)
    }
    await 시트닫기()

    // ⛔⛔ 첫 판은 창업자가 «차이를 못 봤다» — 이유가 둘이었다.
    //    ① 씨앗 일기의 첫 갈래(마테)에 스티커가 5개뿐이라 어느 갈래든 서랍이 텅 비어 보였다
    //    ② 폰 «전체»를 찍어서 화면 3분의 2가 안 바뀌는 일기 종이였다
    //    → ①은 «스티커가 제일 많은 갈래»를 눌러서, ②는 «서랍만 잘라서» 푼다.
    // 📮 창업자 = *"글자 탭 열면 어떻게 되는지 보여줄수있어?"*
    //    ⭐ 「글자」는 스티커 격자가 아니라 «글씨체 목록»이라 생김새가 다르다 — 레일이 거기서
    //       어떻게 보이는지가 진짜 판정 거리다. 그래서 갈래마다 «데코»와 «글자»를 둘 다 찍는다.
    await p.evaluate((탭) => {
      const 알약 = [...document.querySelectorAll('.decor-drawer button')]
        .filter((x) => /^(마테|데코|글자|기록|친구들|프레임|배경)$/.test((x.innerText || '').trim()))
      const 고를것 = 알약.find((x) => (x.innerText || '').trim() === 탭) || 알약[1]
      고를것?.click()
    }, 탭이름)
    await p.waitForTimeout(900)

    // ⭐ 갈래를 «얹는다» — 소스를 안 고치고 그 화면의 요소를 옮긴다
    const m = await p.evaluate((어느) => {
      const dr = document.querySelector('.decor-drawer')
      if (!dr) return { 못잼: '서랍을 못 찾았다' }
      const 줄 = [...dr.children].filter((c) => c.getBoundingClientRect().height > 2)
      // 갈래 알약 줄 = 「마테·데코·글자」 같은 알약이 셋 이상 든 줄
      const 알약줄 = 줄.find((c) => [...c.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().height > 20).length >= 3
        && /마테|데코|글자|기록|친구들|프레임|배경/.test(c.innerText || ''))
      const 손잡이 = 줄[0]
      const 내용 = 줄[줄.length - 1]

      // ⛔ 조건이 「지금이 아니면 전부」였다 — 그러면 ㉢(레일 없이)에도 레일이 붙는다. 콕 집는다.
      if (어느 === '다-레일정리' && 알약줄) {
        // ㉡ 갈래 알약 → 왼쪽 «세로 레일»
        const 이름들 = [...알약줄.querySelectorAll('button')].map((x) => (x.innerText || '').trim()).filter(Boolean)
        const 켜진 = [...알약줄.querySelectorAll('button')].findIndex((x) => x.getAttribute('aria-pressed') === 'true' || /rgb\(88, 120, 160\)|var\(--brown\)/.test(x.style.background || ''))
        알약줄.style.display = 'none'
        const rail = document.createElement('div')
        rail.setAttribute('data-rail', '1')
        rail.style.cssText = 'position:absolute;left:0;width:54px;display:flex;flex-direction:column;gap:2px;padding:4px 3px;box-sizing:border-box;z-index:2'
        이름들.forEach((n, i) => {
          const el = document.createElement('div')
          const on = i === (켜진 < 0 ? 0 : 켜진)
          el.textContent = n
          el.style.cssText = `min-height:46px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:11px;font-weight:700;text-align:center;`
            + (on ? 'background:var(--cream-deep);color:var(--brown);' : 'color:var(--text-sub);')
          rail.appendChild(el)
        })
        // ⛔ 첫 판은 rail 을 내용 «안»에 absolute 로 넣었는데 «화면에 안 나왔다»(그림으로 잡았다).
        //    → 짐작으로 좌표를 만지지 말고 «나란히 서는 상자»로 구조를 만든다.
        rail.style.position = 'static'
        const wrap = document.createElement('div')
        wrap.style.cssText = 'display:flex;align-items:flex-start;flex:1;min-height:0;overflow:hidden'
        내용.parentNode.insertBefore(wrap, 내용)
        wrap.appendChild(rail)
        wrap.appendChild(내용)
        내용.style.flex = '1'
        내용.style.minWidth = '0'
      }
      if (어느 === '라-격자5') {
        // 🔍 머리를 90px 줄여도 3→5칸뿐이었다 — «격자가 한 줄에 3칸»이라 그렇다.
        //    한 칸이 106px 인데 마테는 그렇게 클 이유가 없다 → 5칸으로 좁혀 본다.
        //    ⛔ 1fr 이 아니라 minmax(0, 1fr) — 안 끊기는 이름이 칸을 벌린다(v11.24 교훈)
        // ⛔ 첫 판은 「display 가 grid 인 것」을 찾았는데 «하나도 안 걸렸다»(칸이 grid 가 아니었다).
        //    → 짐작하지 말고 «스티커 그림의 부모»를 직접 집는다.
        const 칸부모 = new Set()
        내용.querySelectorAll('img').forEach((im) => { if (im.parentElement?.parentElement) 칸부모.add(im.parentElement.parentElement) })
        칸부모.forEach((box) => {
          box.style.display = 'grid'
          box.style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))'
          box.style.gap = '6px'
        })
      }
      if (어느 === '마-줄만줄임') {
        // ㉢ 레일을 «안» 쓴다 — 레일은 54px 을 먹어 한 줄이 6칸 → 5칸으로 준다(가로를 깎는다).
        //    대신 «줄 키»만 줄인다: 갈래 알약 56→42 · 선물·사진 줄 62→46
        //    ⭐ 그러면 격자가 6칸 그대로다.
        if (알약줄) {
          알약줄.style.paddingTop = '2px'; 알약줄.style.paddingBottom = '2px'
          알약줄.querySelectorAll('button').forEach((x) => { x.style.minHeight = '38px'; x.style.paddingTop = '0'; x.style.paddingBottom = '0' })
        }
        // 선물·사진 같은 «큰 단추 줄» — 스티커가 아니라 매번 자리를 먹는다
        내용.querySelectorAll(':scope > *').forEach((c) => {
          const bs = [...c.querySelectorAll('button')]
          if (bs.length >= 1 && bs.length <= 3 && /선물|사진/.test(c.innerText || '')) {
            bs.forEach((x) => { x.style.minHeight = '40px'; x.style.paddingTop = '0'; x.style.paddingBottom = '0'; x.style.fontSize = '13px' })
          }
        })
      }
      if (어느 === '다-레일정리' || 어느 === '라-격자5' || 어느 === '마-줄만줄임') {
        // ㉢ ＋ 손잡이를 얇은 선으로 · 섹션 제목을 격자에 붙인다
        if (손잡이) { 손잡이.style.height = '4px'; 손잡이.style.minHeight = '4px'; 손잡이.style.padding = '0'; 손잡이.style.overflow = 'hidden' }
        줄.forEach((c) => {
          if (c === 손잡이 || c === 내용) return
          const t = (c.innerText || '').trim()
          if (t && t.length < 14 && !c.querySelector('button')) { c.style.height = '0'; c.style.padding = '0'; c.style.overflow = 'hidden' }
        })
      }

      // 📏 얹은 «뒤» 다시 잰다 — 스티커가 몇 칸 보이나
      const H = window.innerHeight
      // ⛔⛔ 첫 판은 «화면 안이면» 보인다고 셌다 → 서랍이 잘라낸 것까지 세서 5칸을 10칸이라 했다.
      //    그림을 보고서야 알았다(절대원칙 21). → «서랍 상자 «안»에 들어와 있나»로 센다.
      const dRect = dr.getBoundingClientRect()
      const 보임 = (e) => { const r = e.getBoundingClientRect()
        return r.height > 8 && r.top >= dRect.top - 1 && r.bottom <= dRect.bottom + 1 && r.top < H && r.bottom > 0 }
      // 📐 「한 칸이 작아지나」 — 창업자가 ㉡을 고르려는 참이라 여기가 갈린다.
      //    레일이 폭을 먹어도 «칸 수»가 같이 줄면 한 칸 크기는 그대로일 수 있다. 짐작 말고 잰다.
      const 첫칸 = [...dr.querySelectorAll('img')].map((e) => e.parentElement).find((e) => e && e.getBoundingClientRect().width > 20)
      // 🚏 레일 — 갈래가 «다» 보이나. 마지막 갈래가 잘리면 유저는 그게 있는 줄 모른다.
      const 레일 = dr.querySelector('.decor-catsrow')
      const 레일칸 = 레일 ? [...레일.querySelectorAll('button')] : []
      const 레일r = 레일 ? 레일.getBoundingClientRect() : null
      const 레일보임 = 레일r ? 레일칸.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 레일r.top - 1 && r.bottom <= 레일r.bottom + 1 }).length : 0
      return {
        레일칸수: 레일칸.length, 레일보임, 레일한칸: 레일칸[0] ? Math.round(레일칸[0].getBoundingClientRect().height) : 0,
        레일키: 레일r ? Math.round(레일r.height) : 0,
        칸폭: 첫칸 ? Math.round(첫칸.getBoundingClientRect().width) : 0,
        서랍키: Math.round(dr.getBoundingClientRect().height),
        보이는칸: [...dr.querySelectorAll('img')].filter(보임).length,
        머리: 줄.filter((c) => c !== 내용).reduce((s, c) => s + Math.round(c.getBoundingClientRect().height), 0),
      }
    }, g.id)

    await p.waitForTimeout(400)
    // ✂️ 서랍만 잘라 찍는다 — 안 바뀌는 일기 종이가 화면을 다 먹으면 «차이가 안 보인다»
    const 상자 = await p.evaluate(() => {
      const dr = document.querySelector('.decor-drawer'); if (!dr) return null
      const r = dr.getBoundingClientRect()
      return { x: 0, y: Math.max(0, Math.round(r.top) - 8), width: window.innerWidth,
               height: Math.min(window.innerHeight - Math.round(r.top) + 8, Math.round(r.height) + 16) }
    })
    await p.screenshot({ path: join(OUT, `${W}-${탭이름}-${g.id}.png`), ...(상자 ? { clip: 상자 } : {}) })
    잰값.push({ W, 탭: 탭이름, 이름: g.이름, ...m })
    await ctx.close()
  }
  }
}
await b.close(); srv.close()

console.log('\n🗄 서랍 층 — 갈래 셋을 실제 화면에 얹어 재고 찍었다')
for (const W of 폭들) {
 for (const T of 탭들) {
  console.log(`\n── ${W}px · 「${T}」 ──`)
  잰값.filter((x) => x.W === W && x.탭 === T).forEach((x) => {
    if (x.못잼) return console.log(`  ${x.이름}  ⚠️ ${x.못잼}`)
    console.log(`  ${x.이름.padEnd(14, ' ')} 머리 ${String(x.머리).padStart(3)}px · 한 칸 ${String(x.칸폭).padStart(3)}px · 스티커 ${x.보이는칸}칸 · 레일 ${x.레일보임}/${x.레일칸수}갈래(칸 ${x.레일한칸}px · 띠 ${x.레일키}px)`)
  })
 }
}
console.log(`\n🖼 ${OUT}`)
