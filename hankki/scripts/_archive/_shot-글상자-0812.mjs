// 🔬 글 상자 두 가지 제보 (창업자 2026-08-12)
//   ① *"스티커(글상자)에 글씨크게하는거 없다했는데 반영안됐어."*
//   ② *"글상자 글씨체 이상하다. 글씨체가 뭔가 바뀐거 같아"*
//
// ⛔ 코드만 보고 답하지 않는다 — 붙이고 · 쳐 보고 · 재고 · **찍어서 눈으로 본다**(규칙 7·21).
// 📏 재는 것 = ⑴컨텍스트바 갈래 ⑵실제 그려진 글꼴 이름 ⑶글자 크기 ⑷글꼴이 «진짜 떴나»
//    ⚠️ ⑷가 핵심 — 글꼴 파일이 안 뜨면 **조용히 딴 글씨로** 나온다. 이름만 봐선 모른다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4403, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3 })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 110)))
await pg.goto('http://127.0.0.1:4403/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(1100)

const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = pg.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await pg.waitForTimeout(220) }
  }
}
const 탭 = async (이름) => { const x = pg.getByRole('button', { name: 이름, exact: true }).first(); if (await x.count()) { await x.click(); await pg.waitForTimeout(400); return true } return false }
const 갈래들 = () => pg.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent.trim())
  .filter((t) => ['순서', '색', '크기', '굵기', '글씨', '무늬', '모양', '움직임', '효과', '사진'].includes(t)))

await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 시트닫기()
await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 시트닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(900); await 시트닫기()
await 탭('일꾸'); await 탭('글자')

// 🐛 창업자 «순서»를 그대로 밟는다 — 먼저 «종이 본문»에 커서를 두고, 그 다음 글 상자를 고른다.
//   ⛔ 폰은 뒤로가기로 자판만 닫혀 **blur 가 안 온다** → 본문 커서가 남는다(v10.18 에 겪은 그것).
//   그러면 `typing` 이 참인데 `typingId` 는 없어서 **본문용 「글씨·크기」 줄이 유령처럼 떠 있는다.**
{
  const 본문 = pg.locator('.decor-stage textarea').first()
  if (await 본문.count()) { await 본문.click(); await pg.waitForTimeout(400); await 본문.type('불고기', { delay: 30 }); await pg.waitForTimeout(400) }
}
const 칸 = pg.locator('button[aria-label^="글 상자"]').first()
if (!(await 칸.count())) { console.log('⛔ 글 상자 칸을 못 찾았다'); await b.close(); srv.close(); process.exit(1) }
console.log('붙인 칸 :', await 칸.getAttribute('aria-label'))
const 셈 = () => pg.locator('.decor-stage [class*="hk-"], .decor-stage textarea').count()
console.log('  누르기 «전» 종이 위 글칸 :', await pg.locator('.decor-stage textarea').count())
await 칸.click(); await pg.waitForTimeout(700)
console.log('  누르기 «뒤» 종이 위 글칸 :', await pg.locator('.decor-stage textarea').count(), '← 안 늘면 «붙지 않은 것»')

console.log('갈래 :', (await 갈래들()).join(' · '))

// 글을 친다
const ta = pg.locator('.decor-stage textarea').last()
if (await ta.count()) { await ta.click(); await pg.waitForTimeout(300); await ta.type('돌밥돌밥ㅠ', { delay: 40 }); await pg.waitForTimeout(600) }

// 📏 실제로 그려진 글꼴·크기 ＋ **그 글꼴이 진짜 떴나**(document.fonts.check)
const 잰값 = await pg.evaluate(() => {
  const 상자 = [...document.querySelectorAll('.decor-stage div')]
    .find((d) => (d.textContent || '').trim() === '돌밥돌밥ㅠ' && getComputedStyle(d).fontFamily)
  if (!상자) return null
  const cs = getComputedStyle(상자)
  const fam = cs.fontFamily
  const 첫벌 = fam.split(',')[0].replace(/["']/g, '').trim()
  return {
    글꼴: fam, 첫벌, 크기: cs.fontSize, 두께: cs.fontWeight,
    떴나: document.fonts.check(`${cs.fontStyle} ${cs.fontWeight} 16px "${첫벌}"`),
    로드된벌: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  }
})
console.log('잰 값 :', JSON.stringify(잰값?.글꼴 ? { ...잰값, 로드된벌: [...new Set(잰값.로드된벌)].join('/') } : 잰값, null, 1))

// 🐛🐛 창업자 캡처 그대로 — **글 상자를 골라 글을 친 «그때» 서랍에 뭐가 떠 있나**
//    ⛔ 「글씨」·「크기」는 «종이 본문»용 줄이다. 글 상자를 만지는 중엔 뜨면 안 된다
//       (누르면 엉뚱하게 «본문» 글씨체가 바뀐다 = 창업자 *"글씨체가 뭔가 바뀐거 같아"*).
const 서랍줄 = await pg.evaluate(() => {
  const d = document.querySelector('.decor-drawer')
  if (!d) return null
  const 줄 = [...d.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && ['글씨', '크기'].includes((e.textContent || '').trim()))
    .map((e) => (e.textContent || '').trim())
  const 굴 = d.querySelector('.decor-scroll')
  return { 본문줄: [...new Set(줄)], 서랍: d.clientHeight, 굴칸: 굴 ? 굴.clientHeight : null }
})
console.log('서랍 상태 :', JSON.stringify(서랍줄))
console.log(서랍줄?.본문줄.length ? `  ⛔ 본문용 줄이 떠 있다 → ${서랍줄.본문줄.join('·')} (창업자가 본 그 화면)` : '  ✅ 본문용 줄 안 뜸')
{ const bb = await pg.locator('.decor-drawer').first().boundingBox(); if (bb) await pg.screenshot({ path: join(OUT, '글상자-서랍.png'), clip: bb }) }

// 「크기」 갈래로 키워 본다
const 크기갈래 = pg.getByRole('button', { name: '크기', exact: true }).first()
if (await 크기갈래.count()) {
  await 크기갈래.click(); await pg.waitForTimeout(400)
  const 아주 = pg.getByRole('button', { name: '아주 크게', exact: true }).first()
  if (await 아주.count()) { await 아주.click(); await pg.waitForTimeout(600); console.log('✅ 「아주 크게」 눌렀다') }
  else console.log('⛔ 「아주 크게」 칸이 없다')
} else console.log('⛔ 「크기」 갈래가 없다')

const 뒤 = await pg.evaluate(() => {
  const 상자 = [...document.querySelectorAll('.decor-stage div')].find((d) => (d.textContent || '').trim() === '돌밥돌밥ㅠ')
  return 상자 ? getComputedStyle(상자).fontSize : null
})
console.log('크게 한 뒤 글자 :', 뒤)

const 종이 = await pg.locator('.decor-stage .paper-box, .decor-stage .paper').first().boundingBox()
if (종이) await pg.screenshot({ path: join(OUT, '글상자-실물.png'), clip: 종이 })
await b.close(); srv.close(); process.exit(0)
