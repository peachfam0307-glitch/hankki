// 🔍 종이 확대 — 창업자 *"일꾸판 확대되야돼. 스티커 붙이고 글쓰기가 너무 불편해."* (2026-08-09)
//    재는 것 = ⑴배율마다 종이가 실제로 커지나 ⑵굴러가나 ⑶⭐확대해도 스티커가 «손가락 밑»에 오나
//              ⑷자판이 뜬 것처럼 판이 낮아져도 종이가 안 쪼그라드나
//    ⛔ ⑶이 핵심이다 — 확대해서 좌표가 어긋나면 확대 기능 자체가 못 쓸 것이 된다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4393, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'

const 종이 = () => {
  const st = document.querySelector('.decor-stage')
  const w = st && st.querySelector(':scope > div:not(.t-sub)')
  const r = w ? w.getBoundingClientRect() : null
  return {
    종이: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null,
    칸: st ? `${Math.round(st.clientWidth)}×${Math.round(st.clientHeight)}` : null,
    굴릴수있나: st ? Math.max(0, Math.round(st.scrollHeight - st.clientHeight)) : null,
    가로로넘쳤나: st ? Math.max(0, Math.round(st.scrollWidth - st.clientWidth)) : null,
  }
}

async function 열기(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  const t = page.getByRole('button', { name: '일꾸', exact: true }).last()
  if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await page.waitForTimeout(600) }
}
const 시드 = (s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}
const 값 = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

// ── ① 배율마다 종이 크기 ────────────────────────────────
for (const [n, w, h] of [['크롬눕힘', 891, 322], ['폰눕힘', 780, 360]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript(시드, 값)
  await 열기(page, 'http://127.0.0.1:4393/hankki/')
  console.log(`\n▣ ${n} (${w}×${h})`)
  console.log('  100%', JSON.stringify(await page.evaluate(종이)))
  const 크게 = page.getByRole('button', { name: '종이 크게' })
  for (const p of ['140%', '180%', '220%', '260%']) {
    await 크게.click(); await page.waitForTimeout(350)
    console.log(`  ${p}`, JSON.stringify(await page.evaluate(종이)))
  }
  await page.screenshot({ path: `${OUT}/확대-${n}-260.png` })
  await page.close()
}

// ── ② ⭐확대해도 스티커가 «손가락 밑»에 오나 ─────────────
{
  const page = await b.newPage({ viewport: { width: 891, height: 322 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript(시드, 값)
  await 열기(page, 'http://127.0.0.1:4393/hankki/')
  await page.getByRole('button', { name: '종이 크게' }).click(); await page.waitForTimeout(300)
  await page.getByRole('button', { name: '종이 크게' }).click(); await page.waitForTimeout(300)   // 180%
  const 데코 = page.getByRole('button', { name: '데코', exact: true }).last()
  if (await 데코.count().catch(() => 0)) { await 데코.click().catch(() => {}); await page.waitForTimeout(600) }
  const 컷 = page.locator('.decor-drawer img').first()
  await 컷.click(); await page.waitForTimeout(700)
  const 붙은것 = page.locator('.decor-layer [data-item], .decor-stage [data-item]').first()
  const 잡을것 = (await 붙은것.count()) ? 붙은것 : page.locator('.decor-stage img').last()
  const a = await 잡을것.boundingBox()
  // 손가락으로 오른쪽·아래로 60px 씩 끈다 → 스티커도 «정확히» 60px 씩 따라와야 한다
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 60, a.y + a.height / 2 + 60, { steps: 12 })
  await page.mouse.up(); await page.waitForTimeout(400)
  const c = await 잡을것.boundingBox()
  const dx = Math.round(c.x - a.x), dy = Math.round(c.y - a.y)
  console.log(`\n▣ 확대(180%)에서 끌기 — 손가락 60,60 → 스티커 ${dx},${dy}`,
    Math.abs(dx - 60) <= 4 && Math.abs(dy - 60) <= 4 ? '✅ 손가락 밑에 온다' : '⛔ 어긋난다')
  await page.screenshot({ path: `${OUT}/확대-끌기-180.png` })
  await page.close()
}

// ── ③ 자판이 뜬 것처럼 판이 낮아졌을 때 ────────────────
for (const [n, w, h] of [['자판뜸(글쓰기)', 891, 140], ['자판뜸-조금', 891, 200]]) {
  const page = await b.newPage({ viewport: { width: w, height: 322 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript(시드, 값)
  await 열기(page, 'http://127.0.0.1:4393/hankki/')
  const 글쓰기 = page.getByRole('button', { name: '글쓰기', exact: true }).last()
  if (await 글쓰기.count().catch(() => 0)) { await 글쓰기.click().catch(() => {}); await page.waitForTimeout(700) }
  await page.setViewportSize({ width: w, height: h })   // ⌨️ 자판이 올라온 셈
  await page.waitForTimeout(600)
  console.log(`\n▣ ${n} (${w}×${h})`, JSON.stringify(await page.evaluate(종이)))
  await page.screenshot({ path: `${OUT}/확대-${n}.png` })
  await page.close()
}
await b.close(); srv.close()
