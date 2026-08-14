// 🔬 창업자 폰 제보 둘 — 고친 뒤 «진짜 되는지» 재현 (2026-08-12)
//
// 📮 ① *"일꾸 글자는 크기 조절이 없어"* · *"레꾸도 마찬가지.. 글자크기조절되는거 넣어야 할 듯"*
//    ② *"색을 넣고 모션하니까 안되던데"*
//
// ⭐ 규칙 12 — 고치기 «전» 판에서 ①이 ⛔ 로 잡히는 것을 먼저 봤다(`_repro-글상자리컬러-0812`).
//    ②는 코드가 증거다: `StickerArt` 의 벡터 분기에만 `motionClass` 가 없었다.
import './_fresh.mjs'
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
await new Promise((r) => srv.listen(4392, r))

let 통과 = 0, 실패 = 0
const ok = (m) => { 통과 += 1; console.log('  ✅', m) }
const bad = (m) => { 실패 += 1; console.log('  ⛔', m) }

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await br.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
  for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
    localStorage.setItem(`hankki:coach:${k}`, '1')
})
const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 110)))
await pg.goto('http://127.0.0.1:4392/', { waitUntil: 'networkidle' })
const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(200) }
  }
}
const 탭 = async (이름) => { const b = pg.getByRole('button', { name: 이름, exact: true }).first(); if (await b.count()) { await b.click(); await pg.waitForTimeout(400); return true } return false }
const 갈래들 = () => pg.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => ['순서', '색', '크기', '굵기', '글씨', '무늬', '모양', '움직임', '효과', '사진'].includes(t)))

await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 시트닫기()
await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 시트닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(800); await 시트닫기()

console.log('\n① 글 상자 — 「상자는 그대로, 글자만」 커지나')
// ⛔ 첫 판은 「데코」 탭에서 찾아 **0개**였다 — 글 상자는 «글자» 탭이다(규칙 18: 내 잣대가 틀렸다)
await 탭('일꾸'); await 탭('글자')
const 글상자칸 = pg.locator('button[aria-label^="글 상자"]').first()
if (!(await 글상자칸.count())) bad('서랍에서 글 상자 칸을 못 찾았다 — 검사가 죽었다')
else {
  await 글상자칸.click(); await pg.waitForTimeout(600)
  const g = await 갈래들()
  console.log('   갈래 :', g.join(' · ') || '(없음)')
  g.includes('크기') ? ok('글 상자에 「크기」 갈래가 생겼다') : bad('「크기」 갈래가 «없다»')

  // 📏 글자 크기·상자 크기를 «둘 다» 잰다 — 상자가 같이 커지면 고친 게 아니다
  // ⛔ 첫 판은 `containerType: size` 인 첫 div 를 「글 상자」로 봤는데 **198.9px** 이 나왔다 —
  //   글 상자는 종이(371px)의 0.34 쯤이라 126px 이어야 한다. **엉뚱한 걸 재고 있었다**(규칙 18 ⓘ).
  //   ✅ 「꾸미기 층의 자식」 중에서 찾고, 글자는 **clamp 가 걸린 실제 글칸**을 집는다.
  const 재기 = () => pg.evaluate(() => {
    const 판 = document.querySelector('.decor-stage') || document.body
    let 층 = null
    for (const el of 판.querySelectorAll('div')) {
      const s = getComputedStyle(el)
      if (s.position === 'absolute' && s.pointerEvents === 'none' && s.zIndex === '2' && s.overflow === 'hidden') { 층 = el; break }
    }
    if (!층) return null
    for (const it of 층.children) {
      const 글 = [...it.querySelectorAll('div')].find((d) => (d.getAttribute('style') || '').includes('clamp('))
      if (!글) continue
      const r = it.getBoundingClientRect()
      return { 상자: Math.round(r.width * 10) / 10, 글자: parseFloat(getComputedStyle(글).fontSize) }
    }
    return null
  })
  // ✍️ 창업자가 쓴 「돌밥돌밥ㅠ」 같은 짧은 글을 넣는다 — 빈 상자로는 크기 차이가 안 보인다
  const ta = pg.locator('textarea[data-box], textarea').last()
  if (await ta.count()) { await ta.fill('돌밥돌밥ㅠ').catch(() => {}); await pg.waitForTimeout(400) }
  const 종이클립 = async () => {
    const r = await pg.evaluate(() => {
      const b = (document.querySelector('.decor-stage') || document.body).getBoundingClientRect()
      return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(b.width, 420), height: Math.min(b.height, 420) }
    })
    return r
  }
  const 전 = await 재기()
  if (!전) bad('글 상자를 못 찾았다')
  else {
    await pg.screenshot({ path: `${OUT}/size-before.png`, clip: await 종이클립() })
    if (await 탭('크기')) {
      const 크게 = pg.getByRole('button', { name: '아주 크게', exact: true }).first()
      if (!(await 크게.count())) bad('「아주 크게」 칸이 없다')
      else {
        await 크게.click(); await pg.waitForTimeout(500)
        const 후 = await 재기()
        await pg.screenshot({ path: `${OUT}/size-after.png`, clip: await 종이클립() })
        console.log(`   상자 ${전.상자} → ${후.상자} · 글자 ${전.글자.toFixed(1)}px → ${후.글자.toFixed(1)}px`)
        후.글자 > 전.글자 * 1.3 ? ok(`글자가 ${(후.글자 / 전.글자).toFixed(2)}배 커졌다`) : bad('글자가 안 커졌다')
        Math.abs(후.상자 - 전.상자) < 1 ? ok('상자 크기는 그대로 (그림이 안 커진다)') : bad(`상자도 같이 커졌다 (${전.상자} → ${후.상자})`)
      }
    } else bad('「크기」 갈래를 못 눌렀다')
  }
}

console.log('\n② 벡터 스티커 — 색을 넣고 모션을 걸면 움직이나')
await 탭('레꾸'); await 탭('데코')
const 리컬러칸 = pg.locator('button[aria-label*="색 바꾸기 가능"]').first()
if (!(await 리컬러칸.count())) bad('「색 바꾸기 가능」 칸을 못 찾았다')
else {
  console.log('   고른 칸 :', (await 리컬러칸.getAttribute('aria-label')) || '')
  await 리컬러칸.click(); await pg.waitForTimeout(500)
  // ⭐ 창업자가 겪은 «순서» 그대로 — 색 먼저, 모션 나중
  if (await 탭('색')) {
    const 색버튼 = pg.locator('.decor-sec button').filter({ hasNotText: /.+/ })
    if (await 색버튼.count() > 3) { await 색버튼.nth(3).click(); await pg.waitForTimeout(400); ok('색을 넣었다') }
  }
  if (await 탭('움직임')) {
    const 통통 = pg.getByRole('button', { name: '통통', exact: true }).first()
    if (!(await 통통.count())) bad('「통통」 칸이 없다')
    else {
      await 통통.click(); await pg.waitForTimeout(500)
      // 🎬 모션 클래스가 «실제로» 붙었나 + 화면이 프레임마다 다른가
      const 붙음 = await pg.evaluate(() => {
        const 판 = document.querySelector('.decor-stage') || document.body
        return [...판.querySelectorAll('[class*="hk-m-"]')].length
      })
      붙음 > 0 ? ok(`모션 클래스가 붙었다 (${붙음}개)`) : bad('모션 클래스가 «안» 붙었다 — 제보 그대로')
      // 색도 살아 있나 — 리컬러는 SVG hex 치환이라 화면에 그 색이 있어야 한다
      const 색살음 = await pg.evaluate(() => {
        const 판 = document.querySelector('.decor-stage') || document.body
        return [...판.querySelectorAll('svg')].some((s) => /#[0-9a-f]{6}/i.test(s.innerHTML))
      })
      색살음 ? ok('색도 그대로 살아 있다') : bad('색이 사라졌다')
    }
  } else bad('「움직임」 갈래를 못 눌렀다')
}

console.log(`\n📊 ${통과} ✅ / ${실패} ⛔`)
await br.close(); srv.close(); process.exit(실패 ? 1 : 0)
