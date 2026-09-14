// 📏 「선물 ＋ 사진」 한 줄 — 글자가 «잘리나» 를 폰 두 크기에서 잰다 (2026-08-07)
//   ⛔ 눈으로 「들어가 보인다」로 판단하지 않는다. `…` 로 잘리는 건 스크린샷에서 놓치기 쉽다.
//   ⭐ 판정 = 글자 칸의 scrollWidth 가 clientWidth 를 넘으면 «잘린 것».
//   📌 창업자가 승인한 이름(v9.88 「사진 스티커로 붙이기」 ↔ 「프레임에 사진 넣기」)을 그대로 쓰는 게 목표라,
//      「들어가나」를 먼저 재고 안 들어가면 그때 줄인다.
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
await new Promise((r) => srv.listen(4461, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const { FRAME_WINDOW } = await import('../src/data/frameWindows.js')
const KEY = Object.keys(FRAME_WINDOW).find((k) => /^pf_(0|1)/.test(k)) || Object.keys(FRAME_WINDOW)[0]

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

// 📱 320 = 우리가 지원하는 제일 좁은 폰 · 360 = 창업자 폰 · 412 = 흔한 큰 폰
for (const W of [320, 360, 412]) {
  const page = await b.newPage({ viewport: { width: W, height: 780 } })
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [{ id: 'fr1', type: 'sticker', key: KEY, x: 0.5, y: 0.42, s: 0.58, r: 0 }] }] })
  await page.goto(`http://127.0.0.1:4461/hankki/`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400)

  const m = async (label) => await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.decor-drawer button')]
      .filter((x) => /선물|사진/.test(x.textContent) && x.querySelector('span'))
      .slice(0, 2)
    return btns.map((x) => {
      const s = x.querySelector('span')
      return { 글: s.textContent.trim(), 필요: Math.round(s.scrollWidth), 있는칸: Math.round(s.clientWidth), 버튼: Math.round(x.getBoundingClientRect().width), 높이: Math.round(x.getBoundingClientRect().height) }
    })
  })

  console.log(`\n📱 ${W}px 폰`)
  for (const 상태 of ['프레임 안 고름', '프레임 고름']) {
    if (상태 === '프레임 고름') {
      const img = page.locator(`.decor-stage img[src*="${KEY}"]`).first()
      if (await img.count()) { const bb = await img.boundingBox(); if (bb) await page.mouse.click(bb.x + 6, bb.y + 6) }
      await page.waitForTimeout(500)
    }
    const rows = await m()
    if (!rows.length) { no(`${상태} — 줄을 못 찾았다`); continue }
    for (const r of rows) {
      const 잘림 = r.필요 - r.있는칸
      console.log(`   [${상태}] "${r.글}" — 글자 ${r.필요}px / 칸 ${r.있는칸}px · 버튼 ${r.버튼}×${r.높이}`)
      if (잘림 > 0) no(`"${r.글}" 가 ${잘림}px 잘린다 (… 로 끊긴다)`)
      else ok(`"${r.글}" 한 줄에 다 들어간다 (${-잘림}px 여유)`)
      if (r.높이 < 44) no(`버튼 높이 ${r.높이}px — 손가락 최소 44px 미달`)
    }
  }
  await page.close()
}

await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 세 폰 다 안 잘린다\n')
process.exit(bad ? 1 : 0)
