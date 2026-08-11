// 🔎 글 상자(붙이면 바로 커서)를 «왜» 못 끄는지 이벤트로 직접 찍는다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4413, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
page.on('console', m => { const t = m.text(); if (t.startsWith('▶')) console.log('  ', t) })
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
await page.locator('.seg', { hasText: /^레꾸$/ }).first().click(); await page.waitForTimeout(700)
const 탭 = page.locator('.decor-cats button').filter({ hasText: /^글자$/ })
console.log('글자 탭 개수', await 탭.count())
if (await 탭.count()) { await 탭.first().click(); await page.waitForTimeout(700) }
console.log('서랍 단추 수', await page.locator('.decor-drawer button').count())
await page.evaluate(() => { const btns = [...document.querySelectorAll('.decor-grid button')]; if (btns[0]) btns[0].click() })
await page.waitForTimeout(900)

const 정보 = await page.evaluate(() => {
  // ⭐ 아이템은 «커서가 들어간 textarea 에서 거슬러 올라가» 찾는다 — 목록에서 고르면 또 엉뚱한 겹을 잡는다.
  const ta = document.querySelector('.decor-stage textarea[data-boxtext]')
  let t = ta ? ta.parentElement : null
  while (t && !(t.style && t.style.left.endsWith('%') && t.style.top.endsWith('%'))) t = t.parentElement
  if (!t) return { 없음: true, textarea있나: !!ta }
  const r = t.getBoundingClientRect()
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const el = document.elementFromPoint(cx, cy)
  // 어떤 겹들이 이벤트를 받나 — 그 점의 쌓임 순서
  const path = document.elementsFromPoint(cx, cy).slice(0, 6).map(e => `${e.tagName}${e.className ? '.' + String(e.className).split(' ')[0] : ''}`)
  window.__t = t
  // 실제로 pointerdown 이 아이템까지 «올라오는지» 찍는다
  t.addEventListener('pointerdown', () => console.log('▶ 아이템이 pointerdown 을 받았다'), { once: true })
  t.addEventListener('pointermove', () => console.log('▶ 아이템이 pointermove 를 받았다'), { once: true })
  document.querySelector('.decor-stage').addEventListener('pointerdown', () => console.log('▶ 판(.decor-stage)까지 올라왔다'), { once: true })
  return { 자리: `${t.style.left}/${t.style.top}`, 크기: `${Math.round(r.width)}×${Math.round(r.height)}`, 가운데: `${Math.round(cx)},${Math.round(cy)}`, 그자리: el ? el.tagName + '.' + String(el.className).split(' ')[0] : null, 쌓임: path, 커서: document.activeElement.tagName }
})
console.log(JSON.stringify(정보, null, 1))
if (!정보.없음) {
  const [cx, cy] = 정보.가운데.split(',').map(Number)
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(80)
  await page.mouse.move(cx + 45, cy + 35, { steps: 10 }); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(400)
  const 후 = await page.evaluate(() => ({ 자리: `${window.__t.style.left}/${window.__t.style.top}`, 커서: document.activeElement.tagName }))
  console.log('끈 뒤', JSON.stringify(후), 후.자리 !== 정보.자리 ? '✅ 움직였다' : '⛔ 안 움직였다')
}
await b.close(); srv.close()
