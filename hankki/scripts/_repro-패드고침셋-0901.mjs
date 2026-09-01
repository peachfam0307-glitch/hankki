// 📱📐 **패드에서 고칠 것 셋 — 창업자 제보 (2026-09-01)**
//
// 📮 창업자 = *"그리고 패드에서 고칠거. 글자겨겹치는 부분이랑(폰, 패드 전부 수정)
//    사진올리는게 너무 오른쪽끝이라 안보여. 패드 배경고르는거 이미지 커지면 좋겠어."*
//
// ⑴ 🔤 **글씨체 칩이 «두 벌»이었다** — 서랍(글자 직접 쓰기)에도, 아래 편집바에도 똑같은 게 있었다.
//    ⛔ 갈래를 물었고 창업자 답이 **「b」** = 두 벌인 것. → **서랍 쪽을 없앴다.**
//    🎯 잣대의 심장 = **«양쪽»을 잰다.** 「0개가 됐나」만 보면 **둘 다 지워도 통과한다** —
//       그러면 글씨체를 바꿀 길이 아예 없어진다. 그래서 「고르기 전 0 · 넣은 뒤 1」로 못 박는다.
//
// ⑵ 📷 **완성 사진 동그라미가 화면 오른쪽 «끝»에 붙어 안 보인다** (패드만)
//    ⛔ 뿌리 = `.cook-shot-empty { align-items: flex-end }` — 폰(390px)에선 손이 닿는 자리인데
//       패드는 2000px 라 눈이 가는 자리 밖이다. → 패드에서만 가운데로.
//
// ⑶ 🎨 **배경지 견본이 작다** (패드만) — 42 → 64px.
//    ⛔ 인라인 style 42px 이라 CSS 는 `!important` 라야 이긴다.
//
// 🧪 규칙 12 = 고친 것을 되돌리면 이 판이 «죽어야» 한다. 셋 다 되돌려 확인했다.
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-패드고침셋-0901.mjs
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

// ⛔ 「패드」의 잣대 = `styles.css` 미디어쿼리와 «같은 조건»(min-width 700 ＋ min-height 700).
//    폭만 보면 폰 가로·폴드가 같이 걸린다(그 함정은 CSS 주석에 이미 적혀 있다).
const 화면들 = [
  { 이름: '폰 세로', w: 390, h: 844, 패드: false },
  { 이름: '패드 세로', w: 800, h: 1280, 패드: true },
  { 이름: '패드 가로', w: 1280, h: 800, 패드: true },
]

const 칸 = []
const 적기 = (ok, 무엇) => { 칸.push(ok); console.log(`   ${ok ? '✅' : '⛔'} ${무엇}`) }

async function 새창(v) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(900)
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, a')].find((x) => x.querySelector('img') && (x.innerText || '').trim().length > 1)
    c?.click()
  })
  await p.waitForTimeout(1100)
  return { ctx, p }
}

// 🎨 레시피 꾸미기(레꾸) 서랍 열기 → 원하는 탭으로
async function 레꾸로(p, 탭) {
  const 문 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, [role="button"]')]
      .find((x) => /^(꾸미기|레시피 꾸미기)$/.test((x.innerText || '').trim()))
    if (!c) return null; c.click(); return true
  })
  await p.waitForTimeout(1500)
  for (let i = 0; i < 5; i++) {
    const 닫음 = await p.evaluate(() => {
      const c = [...document.querySelectorAll('button')].find((x) => /나중에 볼게요|닫기/.test((x.innerText || '').trim()))
      if (!c) return false; c.click(); return true
    })
    if (!닫음) break
    await p.waitForTimeout(450)
  }
  if (!문) return false
  const 눌림 = await p.evaluate((t) => {
    const c = [...document.querySelectorAll('.decor-drawer button, .decor-editor button')]
      .find((x) => (x.innerText || '').trim() === t)
    if (!c) return false; c.click(); return true
  }, 탭)
  await p.waitForTimeout(900)
  return 눌림
}

// 화면에 «그려진» 글씨체 칩 세기 — ⛔소스를 grep 하지 않는다(주석에 적어둔 옛 글자까지 걸린다 · 규칙 18 ⓘ)
const 칩수 = (p) => p.evaluate(() =>
  [...document.querySelectorAll('button')].filter((x) => (x.innerText || '').trim() === '귀염체').length)

for (const v of 화면들) {
  console.log(`\n📱 ${v.이름} (${v.w}×${v.h})${v.패드 ? ' — 패드' : ''}`)
  const { ctx, p } = await 새창(v)

  // ── ⑴ 글씨체 칩 «한 벌» ────────────────────────────────
  if (!(await 레꾸로(p, '글자'))) {
    적기(false, '글자 탭에 못 갔다 — ⛔여기서 판정하지 않는다(규칙 18)')
  } else {
    const 전 = await 칩수(p)
    적기(전 === 0, `고르기 전 글씨체 칩 = ${전}개 (0이라야 한다 · 서랍 쪽은 없앴다)`)
    // 「글자 넣기」를 누르면 글자가 그 자리에서 뽑히고 «바로 선택»된다 → 아래 편집바가 뜬다
    await p.evaluate(() => {
      const c = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '글자 넣기')
      c?.click()
    })
    await p.waitForTimeout(1200)
    // ⛔⛔ **첫 판이 여기서 «틀린 걸 쟀다»** — 넣자마자 세니 0개가 나와 「고침이 반쪽」인 줄 알았다.
    //    편집바는 «떠 있었고»(순서·색·크기·굵기·글씨·움직임·효과) **「글씨」 칸을 눌러야** 칩이 펼쳐진다.
    //    📸 창업자 패드 캡처에선 그 칸이 이미 눌려 있어서 두 벌이 같이 보였던 것이다.
    //    📌 규칙 18 ⓘ — 「보이나」가 아니라 «닿을 수 있나»를 재야 한다.
    const 편집바 = await p.evaluate(() =>
      [...document.querySelectorAll('button')].filter((x) => ['순서', '색', '크기', '굵기', '글씨', '움직임', '효과'].includes((x.innerText || '').trim())).length)
    적기(편집바 >= 5, `글자 넣은 뒤 편집바 칸 = ${편집바}개 (순서·색·크기·굵기·글씨…가 떠야 한다)`)
    await p.evaluate(() => {
      const c = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '글씨')
      c?.click()
    })
    await p.waitForTimeout(900)
    const 후 = await 칩수(p)
    적기(후 >= 1, `편집바 「글씨」를 누른 뒤 글씨체 칩 = ${후}개 (1벌은 «남아야» 한다 — 안 그러면 바꿀 길이 없다)`)
  }

  // ── ⑶ 배경지 견본 크기 ────────────────────────────────
  const 견본 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('.decor-drawer button, .decor-editor button')]
      .find((x) => (x.innerText || '').trim() === '배경')
    c?.click()
    return null
  })
  await p.waitForTimeout(900)
  const sw = await p.evaluate(() => {
    const e = document.querySelector('.decor-bgsw')
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height), 개수: document.querySelectorAll('.decor-bgsw').length }
  })
  if (!sw) 적기(false, '배경지 견본을 못 찾았다 — ⛔판정 안 함')
  else 적기(v.패드 ? sw.w >= 60 : sw.w <= 46, `배경지 견본 ${sw.w}×${sw.h}px (${sw.개수}칸) — ${v.패드 ? '패드는 60px 넘어야' : '폰은 46px 이하라야'}`)
  await ctx.close()

  // ── ⑵ 완성 사진 동그라미 자리 ──────────────────────────
  const { ctx: c2, p: p2 } = await 새창(v)
  const 시작 = await p2.evaluate(() => {
    const c = [...document.querySelectorAll('button')].find((x) => /요리모드 시작/.test((x.innerText || '').trim()))
    if (!c) return false; c.click(); return true
  })
  await p2.waitForTimeout(1300)
  if (!시작) { 적기(false, '요리모드를 못 열었다 — ⛔판정 안 함'); await c2.close(); continue }
  await p2.evaluate(() => { const s = [...document.querySelectorAll('.cp-seg')]; s[s.length - 1]?.click() })
  await p2.waitForTimeout(900)
  const 자리 = await p2.evaluate(() => {
    const btn = document.querySelector('.cook-shot-add')
    if (!btn) return null
    const r = btn.getBoundingClientRect()
    return { 가운데: Math.round(r.left + r.width / 2), 오른끝틈: Math.round(innerWidth - r.right), w: Math.round(r.width), 화면가운데: Math.round(innerWidth / 2) }
  })
  if (!자리) 적기(false, '완성 사진 단추를 못 찾았다 — ⛔판정 안 함')
  else {
    const 어긋남 = Math.abs(자리.가운데 - 자리.화면가운데)
    // 폰 = 오른쪽에 붙는 게 «맞다»(창업자가 폰은 안 짚었다) · 패드 = 가운데라야 한다
    적기(v.패드 ? 어긋남 <= 40 : 자리.오른끝틈 <= 40,
      `동그라미 ${자리.w}px · 가운데 x ${자리.가운데} (화면 가운데 ${자리.화면가운데}) · 오른끝 틈 ${자리.오른끝틈}px`
      + ` — ${v.패드 ? '패드는 가운데(±40)라야' : '폰은 오른쪽에 붙어 있어야(≤40)'}`)
  }
  await c2.close()
}

const 죽음 = 칸.filter((x) => !x).length
console.log(`\n${죽음 ? '⛔' : '✅'} ${칸.length - 죽음}/${칸.length}`)
await b.close(); srv.close()
process.exit(죽음 ? 1 : 0)
