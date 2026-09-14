// 🔎 「일꾸에서도 다 되나」 — 창업자 2026-08-06 *"일꾸 레꾸다되는거지? 취소랑 반전도?"*
//   ⛔ 기억으로 답하지 않는다. 일꾸·레꾸 양쪽을 실제로 열어서 «있나 없나»를 찍는다.
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
await new Promise((r) => srv.listen(4362, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const BEAR = { id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.35, y: 0.3, s: 0.3, r: 0 }
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [BEAR], note: '' }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
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

const look = async (shelf) => {
  await page.getByRole('button', { name: shelf, exact: true }).last().click(); await page.waitForTimeout(700)
  const tabs = await page.locator('.decor-cats button').allInnerTexts()
  // ⛔ 탭을 «누르지 않고» 세면 안 된다 — 서랍은 고른 탭의 내용만 그린다.
  //   (2026-08-06 실제로 이걸 안 눌러서 「레꾸에도 형광펜이 0」 이라는 거짓 결과가 나왔다 · 규칙 18)
  const hasWord = tabs.some((t) => t.trim() === '글자')
  if (hasWord) { await page.getByRole('button', { name: '글자', exact: true }).first().click(); await page.waitForTimeout(600) }
  const pens = hasWord ? await page.locator('.decor-scroll button[aria-label^="형광펜 "]').count() : 0
  // 스티커를 하나 골라 컨텍스트 바에 무엇이 뜨는지 본다
  const img = page.locator('.decor-stage img[src*="gp_gomhi"]').first()
  const bb = await img.boundingBox()
  if (bb) { await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(450) }
  const flip = await page.getByRole('button', { name: '좌우 뒤집기', exact: true }).count()
  const order = await page.getByRole('button', { name: '맨 뒤로', exact: true }).count()
  console.log(`\n【${shelf}】 탭 = ${tabs.join(' · ')}`)
  console.log(`   형광펜 칸 ${pens} · 좌우 뒤집기 ${flip ? '있음' : '⛔없음'} · 순서 바꾸기 ${order ? '있음' : '⛔없음'}`)
  // 되돌리기는 «무언가 한 뒤»에만 뜬다 — 뒤집어 보고 확인
  if (flip) { await page.getByRole('button', { name: '좌우 뒤집기', exact: true }).first().click(); await page.waitForTimeout(400) }
  const undo = await page.getByRole('button', { name: '되돌리기', exact: true }).count()
  console.log(`   무언가 한 뒤 되돌리기 ${undo ? '있음' : '⛔없음'}`)
  if (undo) { await page.getByRole('button', { name: '되돌리기', exact: true }).first().click(); await page.waitForTimeout(400) }
}
await look('일꾸')
await look('레꾸')
await b.close(); srv.close()
