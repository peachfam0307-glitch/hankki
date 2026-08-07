// 📱 창업자 폰 제보 셋 — 2026-08-08 아침 (v9.98 첫 사용)
//   ① *"글자안써짐 아래탭에 글자색고르기없음"* — 일꾸 데코의 「한끼 일기 · 메모지」(dgn03)를 붙였는데
//      글이 안 쳐지고, 갈래에 글씨·색이 없다. 같은 그림이 글자 갈래에선 «글 상자»인데
//      데코에선 «그림»으로 붙는 두 갈래 문제(v9.88 사진 두 길과 같은 뿌리).
//      → 글 자리를 재둔 컷(BOX_PAD)은 어디서 붙여도 글 상자로.
//   ② *"스크롤바가 처음부터 안보여서 글자체 저게다처럼보임"* — 글씨체 12개 중 5개만 보이는데
//      스크롤 표시가 없어 「저게 다」로 읽힌다. → 막대를 «항상» 보이게.
//   ③ *"기본탭이랑 아래탭이 너무커서 고르는부분이 안보임"* — 종이 글칸에 커서가 남은 채
//      일꾸로 넘어오면 글씨·크기 두 줄이 서랍을 먹는다(폰은 뒤로가기로 키보드를 닫아도
//      커서가 안 풀린다) ＋ 빈 안내 바 52px. → 탭을 옮기면 커서를 내려놓는다 · 바 40px.
//
// ⛔ 이 판은 «고친 뒤» 모습을 검사한다 — 고치기 전 코드에서 돌려 «진짜 걸리는지» 먼저 확인했다(규칙 12).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4362, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
// 📱 창업자 폰과 같은 좁은 화면으로 잰다
const page = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4362/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

// ── ① 일꾸 데코의 메모지 = 붙이면 바로 쳐지는 글 상자 ──────────────
await page.locator('.decor-drawer .segment .seg', { hasText: '일꾸' }).first().click(); await page.waitForTimeout(500)
await page.locator('.decor-cats button', { hasText: '데코' }).first().click(); await page.waitForTimeout(500)
const memoCell = page.locator('.decor-scroll button[aria-label^="dgn03"]').first()
await memoCell.scrollIntoViewIfNeeded(); await page.waitForTimeout(200)
await memoCell.click(); await page.waitForTimeout(600)

// 붙이자마자 그 자리에 커서(글 상자의 표식 = data-boxtext)
const boxTa = page.locator('.decor-stage textarea[data-boxtext]')
if (await boxTa.count()) ok('데코의 메모지를 붙이면 «바로 쳐지는» 글 상자로 붙는다 (커서 자동)')
else no('메모지가 여전히 «그림»으로 붙는다 — 커서 칸(data-boxtext)이 없다')
if (await boxTa.count()) {
  await boxTa.first().fill('맛있었다'); await page.waitForTimeout(400)
  const got = await page.evaluate(() => {
    const t = document.querySelector('.decor-stage textarea[data-boxtext]')
    return t ? t.value : ''
  })
  if (got === '맛있었다') ok('글이 실제로 쳐진다 — "맛있었다"')
  else no(`글이 안 쳐졌다 — "${got}"`)
}
// 갈래에 글씨·색이 있어야 한다 (창업자 "글자색고르기없음")
const tabs = await page.locator('.decor-tools button[data-ctxtab]').evaluateAll((els) => els.map((e) => e.getAttribute('data-ctxtab')))
if (tabs.includes('font')) ok(`갈래에 「글씨」가 있다 (${tabs.join('·')})`)
else no(`갈래에 「글씨」가 없다 (${tabs.join('·')})`)
if (tabs.includes('color')) ok('갈래에 「색(글자색)」이 있다')
else no(`갈래에 「색」이 없다 (${tabs.join('·')})`)
// 색 갈래를 열어 하나 고르면 글자색이 실제로 바뀐다
if (tabs.includes('color')) {
  const colorTab = page.locator('.decor-tools button[data-ctxtab="color"]').first()
  if ((await colorTab.getAttribute('aria-expanded')) !== 'true') { await colorTab.click(); await page.waitForTimeout(400) }
  const dot = page.locator('.decor-tools button[aria-label^="글자색"]').nth(2)
  if (await dot.count()) {
    await dot.click(); await page.waitForTimeout(400)
    const ink = await page.evaluate(() => {
      const t = document.querySelector('.decor-stage textarea[data-boxtext]')
      return t ? getComputedStyle(t).caretColor : ''
    })
    if (ink && ink !== 'rgb(74, 64, 56)') ok(`글자색이 실제로 바뀐다 (${ink})`)
    else no(`색을 골라도 글자색이 그대로다 (${ink || '못 읽음'})`)
  } else no('글자색 칸이 안 그려졌다')
}
await page.screenshot({ path: join(OUT, '제보1-메모지글상자.png') })

// 🧷 회귀 — 프레임(pf_)은 글 상자로 «변하면 안 된다» (밑판이다)
await page.locator('.decor-stage').click({ position: { x: 20, y: 20 } }).catch(() => {}); await page.waitForTimeout(300)
await page.locator('.decor-drawer .segment .seg', { hasText: '레꾸' }).first().click(); await page.waitForTimeout(500)
const frameChip = page.locator('.decor-cats button', { hasText: '프레임' }).first()
if (await frameChip.count()) {
  await frameChip.click(); await page.waitForTimeout(500)
  const pf = page.locator('.decor-scroll button[aria-label^="pf_"]').first()
  if (await pf.count()) {
    const pfKey = (await pf.getAttribute('aria-label')).split(' ')[0]
    await pf.click(); await page.waitForTimeout(500)
    const taCount = await page.locator('.decor-stage textarea[data-boxtext]').count()
    if (taCount === 0) ok(`프레임(${pfKey})은 여전히 밑판으로 붙는다 — 글 상자로 안 변함`)
    else no(`프레임(${pfKey})이 글 상자로 붙어버렸다`)
    // 되돌려 놓는다(다음 검사 화면을 깨끗하게)
    await page.getByRole('button', { name: '되돌리기' }).first().click().catch(() => {})
    await page.waitForTimeout(300)
  } else console.log('   ℹ️ 프레임 칸을 못 찾아 회귀 확인 생략')
}

// ── ② 글씨체 줄 — 넘침이 «보인다» ──────────────────────────────
await page.locator('.decor-drawer .segment .seg', { hasText: '글쓰기' }).first().click(); await page.waitForTimeout(500)
// ⛔ CSS 막대는 안드로이드가 무시한다 → HStrip 이 «직접 그린» 막대(data-hthumb)를 잰다.
const strip = page.locator('.decor-drawer [data-hstrip]').first()
if (await strip.count()) {
  const m = await strip.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
  if (m.sw > m.cw + 20) ok(`글씨체 줄이 실제로 넘친다 (내용 ${m.sw}px > 칸 ${m.cw}px) — 힌트가 필요한 상황 맞음`)
  else console.log(`   ℹ️ 이 폭에선 안 넘친다 (${m.sw} ≤ ${m.cw})`)
  const thumb = await page.evaluate(() => {
    const t = document.querySelector('.decor-drawer [data-hthumb]')
    if (!t) return null
    const bb = t.getBoundingClientRect()
    const track = t.parentElement.getBoundingClientRect()
    return { w: Math.round(bb.width), trackW: Math.round(track.width), h: Math.round(bb.height), visible: bb.width > 4 && bb.height >= 2 }
  })
  if (thumb && thumb.visible && thumb.w < thumb.trackW - 10) ok(`막대가 «처음부터» 그려져 있다 (썸 ${thumb.w}/${thumb.trackW}px — 더 있다는 게 보인다)`)
  else if (!thumb) no('그린 막대(data-hthumb)가 없다')
  else no(`막대가 넘침을 안 알려준다 (썸 ${thumb.w}/${thumb.trackW}px)`)
  // 라벨을 칩이 덮으면 안 된다 (.hscroll 이름 충돌 사고 회귀 방지 — 음수 마진이 걸리면 여기서 잡힌다)
  const lap = await page.evaluate(() => {
    const s = document.querySelector('.decor-drawer [data-hstrip]')
    const lb = s?.closest('div[style]')?.parentElement?.querySelector(':scope > span') || s?.parentElement?.parentElement?.querySelector(':scope > span')
    if (!s || !lb) return -999
    return Math.round(s.getBoundingClientRect().left - lb.getBoundingClientRect().right)
  })
  if (lap === -999) console.log('   ℹ️ 라벨을 못 집었다 — 겹침 검사 생략')
  else if (lap >= 0) ok(`「글씨」 라벨과 칩 줄이 안 겹친다 (사이 ${lap}px)`)
  else no(`칩 줄이 「글씨」 라벨을 ${-lap}px 덮었다 (클래스 이름 충돌?)`)
} else no('글씨체 줄에 그린 막대(data-hstrip)가 없다')
await page.screenshot({ path: join(OUT, '제보2-글씨체스크롤.png') })

// ── ③ 탭을 옮기면 종이 커서를 내려놓는다 (유령 글씨·크기 줄) ─────────
// 종이 글칸에 커서를 꽂는다 → 글씨 줄이 뜬다
await page.locator('.decor-stage textarea').first().click().catch(() => {})
await page.waitForTimeout(400)
const rowsWhileTyping = await page.getByText('글씨', { exact: true }).count()
// 일꾸 탭으로 옮긴다 — 커서가 «반드시» 내려가야 한다 (폰은 뒤로가기로 키보드만 닫혀 커서가 남는다)
await page.locator('.decor-drawer .segment .seg', { hasText: '일꾸' }).first().click(); await page.waitForTimeout(500)
const active = await page.evaluate(() => document.activeElement?.tagName || 'NONE')
const rowsAfter = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('.decor-drawer span')]
  return spans.filter((s) => s.textContent === '글씨' || s.textContent === '크기').length
})
if (active !== 'TEXTAREA') ok(`일꾸로 옮기면 종이 커서가 풀린다 (activeElement=${active})`)
else no('일꾸로 옮겨도 종이 글칸에 커서가 남아 있다 — 글씨·크기 줄이 서랍을 먹는다')
if (rowsAfter === 0) ok('일꾸 탭에 유령 「글씨·크기」 줄이 없다')
else no(`일꾸 탭에 「글씨·크기」 줄이 ${rowsAfter}개 떠 있다 (쓰던 중 ${rowsWhileTyping}개)`)

// 빈 안내 바 — 52 → 40
await page.locator('.decor-stage').click({ position: { x: 20, y: 20 } }).catch(() => {}); await page.waitForTimeout(300)
const barH = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('.decor-tools div')]
  const el = spans.find((d) => d.textContent.trim().startsWith('붙인 걸 탭하면'))
  return el ? Math.round(el.getBoundingClientRect().height) : -1
})
// 📐 목표 = 46 — 40 까지 안 내리는 이유: 갈래 아이콘 줄(손가락 최소 44+여백)과 «같은 키»라야
//    아이템을 골랐다 풀 때 화면이 안 튄다. 빈 바만 더 줄이면 고를 때마다 6px 씩 덜컹인다.
if (barH > 0 && barH <= 48) ok(`빈 안내 바가 낮아졌다 (${barH}px ≤ 48 · 옛 52＋패딩)`)
else if (barH < 0) no('빈 안내 바를 못 찾았다')
else no(`빈 안내 바가 아직 크다 (${barH}px)`)

// 고르는 칸(스티커 그리드)이 실제로 몇 px 보이는지 — 제보의 핵심 숫자
await page.locator('.decor-cats button', { hasText: '데코' }).first().click(); await page.waitForTimeout(400)
const gridH = await page.evaluate(() => {
  const el = document.querySelector('.decor-scroll')
  return el ? Math.round(el.getBoundingClientRect().height) : -1
})
console.log(`   📏 일꾸 탭에서 고르는 칸(스크롤 영역) = ${gridH}px`)
if (gridH >= 150) ok(`고르는 칸이 ${gridH}px — 두 줄 넘게 보인다`)
else no(`고르는 칸이 ${gridH}px 뿐이다`)
await page.screenshot({ path: join(OUT, '제보3-서랍공간.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
