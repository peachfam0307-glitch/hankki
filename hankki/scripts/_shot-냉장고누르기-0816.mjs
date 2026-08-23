// 📸 냉장고 — 「재료를 누르면 유통기한이 뜬다」가 «보이나» (창업자 제보 2026-08-16)
//   📮 *"냉장고에서 재료 누르는 것 모르는 경우가 있을 것 같아. 눌러야 유통기한이랑 관리 안내가 뜨는데.
//      **나도 몰랐었거든.** 유통기한이나 관리안내해준다는 안내와 그부분 누르는거 직관적으로 알게 안내해야할 듯."*
//   돌리기 = node hankki/scripts/_shot-냉장고누르기-0816.mjs <내보낼폴더>
//
// ⭐ 두 모양을 «둘 다» 본다 — 유통기한이 있는 재료와 «없는» 재료.
//    없는 쪽이 문제였다(아랫줄이 통째로 비어 그냥 읽는 줄처럼 보였다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.argv[2] || '/tmp/냉장고'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.wasm': 'application/wasm' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4438, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))

let bad = 0
const 칸 = (이름, ok, 덧말 = '') => { if (!ok) bad++; console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
pg.setDefaultTimeout(20000)
const 오류 = []
pg.on('pageerror', (e) => 오류.push(String(e)))

try {
  await pg.goto('http://127.0.0.1:4438/hankki/', { waitUntil: 'networkidle' })
  await 잠깐(900)
  const 나중에 = pg.getByRole('button', { name: '나중에' }).first()
  if (await 나중에.count() && await 나중에.isVisible().catch(() => false)) { await 나중에.click().catch(() => {}); await 잠깐(200) }

  // ⛔ 클래스를 짐작하지 않는다 — 하단바에서 «클래스가 따로 있는 건 가져오기뿐»이고
  //    나머지 탭은 `data-coach="nav-shop"` 로 짚는다(`BottomNav.jsx` COACH_ANCHOR).
  await pg.locator('nav.bottom-nav [data-coach="nav-shop"]').first().click()
  await 잠깐(700)
  // 냉장고 하위 화면으로 (장보기 화면 안의 세그먼트)
  await pg.locator('[data-coach="pantry"]').first().click()
  await 잠깐(600)

  // 재료 둘 담기 — ⑴ 유통기한 «없이» ⑵ 유통기한 «있게»
  const 담기 = async (이름, 기한칩) => {
    await pg.getByRole('button', { name: '재료 담기' }).first().click()
    await 잠깐(500)
    await pg.getByPlaceholder(/재료 이름/).fill(이름)
    if (기한칩) { await pg.getByRole('button', { name: 기한칩, exact: true }).first().click(); await 잠깐(200) }
    await pg.locator('.sheet').getByRole('button', { name: '넣기', exact: true }).click()
    await 잠깐(700)
  }
  await 담기('두부', null)      // ← 기한 없음. 옛 판에선 아랫줄이 통째로 비었다
  await 담기('애호박', '+3일')  // ← 기한 있음

  await 잠깐(500)
  const 글 = await pg.locator('body').innerText()
  칸('⭐ 기한 없는 재료에 「눌러서 …」가 뜬다', /눌러서 유통기한/.test(글))
  칸('⭐ 목록 위에도 「누르면」 안내가 있다', /누르면.*유통기한/.test(글))
  칸('기한 넣은 재료엔 D-표시가 붙는다', /D-\d|오늘까지/.test(글))
  await pg.screenshot({ path: join(OUT, '1-냉장고-누르는안내.png') })
  // 📸 재료 목록까지 내려서 한 장 더 — 안내 상자와 재료 줄이 «같이» 보여야 뜻이 통한다
  //    ⚠️ 토스트가 아직 떠 있으면 재료 줄을 가린다 — 사라질 때까지 기다린다(규칙 21: 내가 실물을 본다)
  await pg.locator('.toast, [class*=toast]').first().waitFor({ state: 'hidden', timeout: 9000 }).catch(() => {})
  await pg.locator('.wish-row').last().scrollIntoViewIfNeeded()
  await 잠깐(500)
  await pg.screenshot({ path: join(OUT, '1b-재료목록.png') })
  // 📸 두 줄을 «나란히» — 기한 없는 두부(눌러서 …) vs 기한 넣은 애호박(D-3). 이게 핵심 비교다.
  //    ⛔ 화면 좌표로 자르려다 실패했다 — 마지막 줄이 «접힌 자리»에 있어 화면 밖 좌표가 나왔다.
  //    ✅ 화면을 통째로(fullPage) 찍고, 그 안에서 «문서 좌표»로 자른다.
  const 자리 = await pg.evaluate(`(() => {
    const rows = [...document.querySelectorAll('.wish-row')]
    if (!rows.length) return null
    const ys = rows.map(r => r.getBoundingClientRect().top + window.scrollY)
    const bs = rows.map(r => r.getBoundingClientRect().bottom + window.scrollY)
    return { top: Math.min(...ys) - 8, bottom: Math.max(...bs) + 8, w: document.documentElement.clientWidth }
  })()`)
  if (자리) {
    await pg.screenshot({
      path: join(OUT, '1c-두줄-나란히.png'),
      fullPage: true,
      clip: { x: 0, y: Math.max(0, 자리.top), width: 자리.w, height: 자리.bottom - Math.max(0, 자리.top) },
    })
  }

  // 실제로 눌러서 편집 시트가 뜨나
  // ⛔ `getByRole('button',{name:/두부/})` 로는 **냉장고 파먹기 추천 카드**가 먼저 잡힌다
  //    (두부로 만들 레시피가 위에 떠 있다) → 레시피 상세로 날아가서 「시트가 없다」로 나왔다.
  //    ✅ 재료 «줄»(`.wish-row`) 안으로 좁힌다.
  await pg.locator('.wish-row').filter({ hasText: '두부' }).first().getByRole('button').first().click()
  await 잠깐(600)
  const 시트 = await pg.locator('.sheet').innerText().catch(() => '')
  칸('눌렀더니 「재료 편집」이 뜬다', /재료 편집/.test(시트))
  칸('그 안에 유통기한 칸이 있다', /유통기한/.test(시트))
  await pg.locator('.sheet').screenshot({ path: join(OUT, '2-눌렀을때-편집시트.png') })

  칸('런타임 오류 0', 오류.length === 0, 오류.slice(0, 2).join(' | '))
  await b.close()
} finally {
  srv.close()
}

console.log(bad ? `\n⛔ ${bad}칸 실패` : `\n✅ 「누르면 유통기한」이 화면에 보인다 · 그림 = ${OUT}`)
process.exit(bad ? 1 : 0)
