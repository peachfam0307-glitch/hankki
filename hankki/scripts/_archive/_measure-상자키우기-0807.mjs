// 📏 「글 상자를 키우면 글자도 커지나?」 (창업자 2026-08-07)
//   ⛔ 기억으로 답하지 않는다 — 자동 줄이기(`autoCqw`)를 넣은 «뒤»라 예전 답이 그대로일지 모른다.
//   ⭐ 같은 «긴 글»을 크기만 다르게 놓고 글씨 px 을 잰다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4433, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const SENT = '오늘은 김치찌개를 끓였는데\n국물이 진하고 돼지고기가\n푹 익어서 아주 맛있었다\n다음에 또 해먹어야지'
const S = [0.34, 0.5, 0.7, 0.9]
const decor = S.map((s, i) => ({ id: `n${i}`, type: 'note', key: 'lavender', text: SENT, font: 'gaegu', x: 0.5, y: 0.5, s, r: 0 }))

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage()
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
await page.goto('http://127.0.0.1:4433/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1500)
await page.mouse.click(8, 300); await page.waitForTimeout(500)

const rows = await page.evaluate((sizes) => {
  const notes = [...document.querySelectorAll('.decor-stage [style*="rotate"]')]
  return notes.map((n, i) => {
    const t = [...n.querySelectorAll('div')].find((d) => getComputedStyle(d).whiteSpace === 'pre-wrap')
    const r = n.getBoundingClientRect()
    const rg = document.createRange(); rg.selectNodeContents(t)
    const rects = [...rg.getClientRects()]
    const box = t.getBoundingClientRect()
    const over = Math.round(Math.max(0, box.top - Math.min(...rects.map((x) => x.top))) + Math.max(0, Math.max(...rects.map((x) => x.bottom)) - box.bottom))
    return `s=${sizes[i]} · 상자 ${Math.round(r.width)}px · 글씨 ${getComputedStyle(t).fontSize} · ${new Set(rects.map((x) => Math.round(x.top))).size}줄 · 넘침 ${over}px`
  })
}, S)
console.log('📐 같은 긴 글을 «크기만» 다르게')
rows.forEach((r) => console.log('  ', r))
await b.close(); srv.close()
