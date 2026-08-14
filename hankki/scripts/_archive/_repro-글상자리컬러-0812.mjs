// 🔬 창업자 폰 제보 둘을 «재현»한다 (2026-08-12)
//
// 📮 ① *"글에 비해 글자상자가 너무 작아(스티커-돌밥돌밥쓴거) 스티커를 줄이면 글자가 너무 작아져."*
//    ② *"리컬러도 모션 효과 붙었던데 리컬러는 적용안되더라고. (수정해야할 듯)"*
//
// ⛔ 짐작으로 고치지 않는다(규칙 7) — 눌러서 재고, 그 값으로 원인을 가른다.
// ⛔ `page.reload()` 금지(옛 함정 사전) — 새 탭으로 연다.
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
await new Promise((r) => srv.listen(4391, r))

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
await pg.goto('http://127.0.0.1:4391/', { waitUntil: 'networkidle' })
const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(200) }
  }
}
// 일기 → 오늘 일기 쓰기 → 꾸미기
await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 시트닫기()
await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 시트닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(800); await 시트닫기()

// 지금 어느 층이 꾸미기 판인지 — 이름 대신 «모양»으로 찾는다(`.decor-layer` 는 없다)
const 층 = () => pg.evaluate(() => {
  const box = document.querySelector('.decor-editor') || document.body
  for (const el of box.querySelectorAll('div')) {
    const s = getComputedStyle(el)
    if (s.position === 'absolute' && s.pointerEvents === 'none' && s.zIndex === '2' && s.overflow === 'hidden') return el.children.length
  }
  return -1
})
console.log('\n① 글 상자 — 「글에 비해 글자가 작다」')
// 「일꾸」 탭 → 메모지 갈래에서 글 상자 하나 붙인다
const 탭 = async (이름) => { const b = pg.getByRole('button', { name: 이름, exact: true }).first(); if (await b.count()) { await b.click(); await pg.waitForTimeout(400) } }
await 탭('일꾸'); await 탭('데코')
const 칸들 = pg.locator('.decor-cell')
const n0 = await 층()
// 메모지(글 상자) 를 찾는다 — aria-label 이 「글 상자 …」 인 칸
const 글상자칸 = pg.locator('button[aria-label^="글 상자"]').first()
if (await 글상자칸.count()) { await 글상자칸.click() } else if (await 칸들.count()) { await 칸들.nth(0).click() }
await pg.waitForTimeout(500)
const n1 = await 층()
n1 > n0 ? ok(`붙었다 (${n0} → ${n1})`) : bad(`안 붙었다 (${n0} → ${n1})`)

// 글을 «길게» 넣고 글자 크기가 어떻게 되나 잰다
const 잰글 = await pg.evaluate(async () => {
  const ta = [...document.querySelectorAll('textarea')].find((t) => t.closest('[style*="max-content"]') || true)
  return { textarea수: document.querySelectorAll('textarea').length }
})
console.log('   textarea', 잰글.textarea수, '개')

// 📏 글 상자 안 글자 크기를 «상자 크기별로» 재서, 글자만 따로 못 키우는지 확인
const 크기표 = await pg.evaluate(() => {
  const 결과 = []
  const 상자 = [...document.querySelectorAll('div')].filter((d) => {
    const s = d.getAttribute('style') || ''
    return s.includes('containerType: size') || s.includes('container-type: size')
  })
  for (const el of 상자.slice(0, 3)) {
    const 글 = el.querySelector('div[style*="font-size"], div[style*="fontSize"]')
    const r = el.getBoundingClientRect()
    결과.push({ 상자: `${Math.round(r.width)}×${Math.round(r.height)}`, 글자px: 글 ? getComputedStyle(글).fontSize : '(못 찾음)' })
  }
  return 결과
})
크기표.forEach((r) => console.log('   상자', r.상자, '· 글자', r.글자px))
// ⭐ 「글자만 키우는 길」이 컨텍스트바에 있나 — 글 상자를 골랐을 때 「크기」 갈래가 뜨나
const 갈래 = await pg.evaluate(() => [...document.querySelectorAll('.decor-ctx button, [class*=ctx] button')].map((b) => b.textContent.trim()).filter(Boolean))
console.log('   고른 것의 갈래 :', 갈래.join(' · ') || '(못 찾음)')
갈래.some((g) => /크기/.test(g)) ? ok('글 상자에 「크기」 갈래가 있다') : bad('글 상자에 「크기」 갈래가 «없다» — 글자만 키울 길이 없다')

console.log('\n② 리컬러 — 「색을 골라도 안 바뀐다」')
// 리컬러 되는 스티커(하트·별·반짝이·리본·브이손)를 붙이고 색을 바꿔 «픽셀»을 잰다
// ⛔ 첫 판은 「일꾸」 탭에서 찾아 **0개**였다 — 리컬러 23컷은 «레꾸» 쪽 데코에 있다.
//   📌 창업자 캡처도 「레꾸」 탭이었다. 화면을 안 보고 탭을 골랐던 것(규칙 18).
await 탭('레꾸'); await 탭('데코')
const 리컬러칸 = pg.locator('button[aria-label*="색 바꾸기 가능"]').first()
if (!(await 리컬러칸.count())) { bad('서랍에서 「색 바꾸기 가능」 칸을 못 찾았다 — 검사가 죽었다') }
else {
  const 키 = (await 리컬러칸.getAttribute('aria-label')) || ''
  console.log('   고른 칸 :', 키)
  await 리컬러칸.click(); await pg.waitForTimeout(500)
  const 전 = await pg.screenshot({ clip: await pg.evaluate(() => {
    const box = document.querySelector('.decor-stage') || document.body
    const r = box.getBoundingClientRect()
    return { x: r.x, y: r.y, width: Math.min(r.width, 400), height: Math.min(r.height, 400) }
  }) })
  // 컨텍스트바에서 「색」 누르고 색 하나 고르기
  const 색갈래 = pg.getByRole('button', { name: '색', exact: true }).first()
  if (!(await 색갈래.count())) bad('컨텍스트바에 「색」 갈래가 안 뜬다')
  else {
    await 색갈래.click(); await pg.waitForTimeout(400)
    const 색칸 = pg.locator('[aria-label*="색"], .decor-color, button[title*="색"]')
    const 색버튼 = pg.locator('.decor-sec button').filter({ hasNotText: /.+/ })
    const 개수 = await 색버튼.count()
    console.log('   색 칸', 개수, '개')
    if (개수 < 2) bad('색 칸을 못 찾았다')
    else {
      await 색버튼.nth(Math.min(5, 개수 - 1)).click(); await pg.waitForTimeout(600)
      const 후 = await pg.screenshot({ clip: await pg.evaluate(() => {
        const box = document.querySelector('.decor-stage') || document.body
        const r = box.getBoundingClientRect()
        return { x: r.x, y: r.y, width: Math.min(r.width, 400), height: Math.min(r.height, 400) }
      }) })
      const 다름 = Buffer.compare(전, 후) !== 0
      다름 ? ok('색을 고르니 화면이 바뀌었다') : bad('색을 골라도 화면이 «그대로»다 — 창업자 제보 재현됨')
      const { writeFileSync } = await import('node:fs')
      writeFileSync(`${OUT}/recolor-before.png`, 전); writeFileSync(`${OUT}/recolor-after.png`, 후)
    }
  }
}

console.log(`\n📊 ${통과} ✅ / ${실패} ⛔`)
await br.close(); srv.close(); process.exit(0)
