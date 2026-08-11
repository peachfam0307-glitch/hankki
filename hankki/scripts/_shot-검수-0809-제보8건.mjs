// 🖼 창업자 검수판 — v10.17 고친 화면을 «실물 그대로» 찍는다 (규칙 13)
//    ⛔ 줄이지 않는다 — 줄이면 「가려졌나·잘렸나」 판정 자체가 안 된다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = '/home/user/hankki/hankki/docs/검수-2026-08-09-제보8건'
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4417, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

async function 연다(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 3 })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4417/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  return page
}
const 스티커고름 = async (page) => {
  await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(700)
  // ⚠️ 기본 갈래(마테)는 그룹이 3컷뿐이라 무엇을 고쳐도 3칸으로 보인다 — 컷이 많은 「데코」로 찍는다.
  const 데코 = page.locator('.decor-cats button').filter({ hasText: /^데코$/ })
  if (await 데코.count()) { await 데코.first().click(); await page.waitForTimeout(700) }
  await page.evaluate(() => { const b2 = [...document.querySelectorAll('.decor-grid button')]; if (b2[0]) b2[0].click() })
  await page.waitForTimeout(900)
}

// ① 작은 폰 세로 — 서랍이 몇 줄 보이나 (창업자 "1칸도 채 안보임")
{
  const page = await 연다(360, 640); await 스티커고름(page)
  await page.screenshot({ path: join(OUT, '1-작은폰360x640-서랍.png') })
  await page.close()
}
// ② 보통 폰 세로 — 안 건드린 것 확인 ＋ 확대 단추가 위바에 생겼다
{
  const page = await 연다(411, 891); await 스티커고름(page)
  await page.screenshot({ path: join(OUT, '2-폰411x891-서랍과확대단추.png') })
  await page.close()
}
// ③ 가로 — 확대 단추가 종이를 안 가린다(왼쪽 아래)
{
  const page = await 연다(891, 411)
  await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
  const 속지 = page.locator('.decor-drawer button').filter({ hasText: /사진|기록|한끼|무지|줄/ })
  if (await 속지.count() > 0) { await 속지.first().click(); await page.waitForTimeout(800) }
  await page.screenshot({ path: join(OUT, '3-가로891x411-확대단추자리.png') })
  // ③-2 확대해서 위쪽까지 굴러가나
  for (let i = 0; i < 3; i++) { const p = page.locator('.decor-zoom button').last(); if (await p.count()) { await p.click({ force: true }); await page.waitForTimeout(250) } }
  await page.evaluate(() => { document.querySelector('.decor-stage').scrollTop = -9999 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(OUT, '4-가로-확대220퍼센트-맨위.png') })
  await page.close()
}
// ⑤ 세로에서 자판 뜬 상태 — 「가로로 둔갑」 안 하고 종이도 안 쪼그라든다
{
  const page = await 연다(411, 891)
  await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
  const 속지 = page.locator('.decor-drawer button').filter({ hasText: /사진|기록|한끼|무지|줄/ })
  if (await 속지.count() > 0) { await 속지.first().click(); await page.waitForTimeout(800) }
  await page.evaluate(() => { const t = document.querySelector('.decor-stage textarea'); if (t) t.focus() })
  await page.keyboard.type('오늘도 한 끼', { delay: 25 })
  await page.setViewportSize({ width: 411, height: 410 }); await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT, '5-세로-자판뜸-가로로안바뀜.png') })
  await page.close()
}
await b.close(); srv.close()
console.log('✅ 검수판 5장 →', OUT)
