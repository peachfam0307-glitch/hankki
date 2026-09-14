// 🔎 「꾸미기 탭이 정신없다」를 «숫자»로 바꾼다 (창업자 2026-08-07 밤
//    *"뭔가 정신이 없어. 쓰기 편하지 않고 뭐가 뭔지 모르겠는 느낌."* · *"대수술이 필요해"*)
//   ⛔ 감으로 고치면 또 감으로 틀린다. **층이 몇 개인지 · 크기가 얼마나 겹치는지**를 잰다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/구조'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4442, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 })).newPage()
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [{ id: 'n1', type: 'note', key: 'kraft', text: '맛있는\n김치찌개', font: 'tongtong', shape: 'star', x: 0.5, y: 0.5, s: 0.4, r: 3 }] }] })
await page.goto('http://127.0.0.1:4442/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)

// ── ① 종이와 «첫 스티커» 사이에 가로줄이 몇 개인가 ────────────
const layers = await page.evaluate(() => {
  const ed = document.querySelector('.decor-editor')
  const stage = document.querySelector('.decor-stage')
  const y0 = stage.getBoundingClientRect().bottom
  // 서랍 안 «첫 스티커 그림»
  const firstArt = [...document.querySelectorAll('.decor-scroll button img')][0]
  const y1 = firstArt ? firstArt.getBoundingClientRect().top : 9999
  // 그 사이에 있는 «가로로 긴 줄»을 센다 (폭이 화면의 60% 이상이고 높이 18~90px)
  const rows = []
  const seen = new Set()
  ed.querySelectorAll('div').forEach((d) => {
    const r = d.getBoundingClientRect()
    if (r.top < y0 - 2 || r.bottom > y1 + 2) return
    if (r.width < 200 || r.height < 18 || r.height > 90) return
    const key = `${Math.round(r.top)}-${Math.round(r.height)}`
    if (seen.has(key)) return
    seen.add(key)
    rows.push({ y: Math.round(r.top), h: Math.round(r.height), 글: (d.innerText || '').replace(/\n+/g, ' ').trim().slice(0, 28) })
  })
  rows.sort((a, b) => a.y - b.y)
  return { 종이바닥: Math.round(y0), 첫스티커: Math.round(y1), 사이: Math.round(y1 - y0), 줄: rows }
})
console.log(`\n📏 종이 바닥 ${layers.종이바닥}px → 첫 스티커 그림 ${layers.첫스티커}px · 사이 **${layers.사이}px**`)
console.log(`🧱 그 사이 «가로줄» = ${layers.줄.length}개`)
layers.줄.forEach((r, i) => console.log(`   ${String(i + 1).padStart(2)}. y${String(r.y).padStart(3)} · ${String(r.h).padStart(2)}px · ${r.글}`))

// ── ② 「누르는 것」들의 크기가 얼마나 겹치나 ──────────────────
const btns = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('.decor-editor button').forEach((x) => {
    const r = x.getBoundingClientRect()
    if (r.height < 6 || r.width < 6) return
    const t = (x.textContent || '').trim().slice(0, 10)
    if (!t) return
    out.push({ t, h: Math.round(r.height), w: Math.round(r.width) })
  })
  return out
})
const 묶음 = {}
btns.forEach((x) => { (묶음[x.h] ||= []).push(x.t) })
console.log('\n🔘 「글자 있는 누르는 칸」을 높이로 묶으면')
Object.keys(묶음).map(Number).sort((a, b) => a - b).forEach((h) => {
  const 표 = [...new Set(묶음[h])].slice(0, 8).join(' · ')
  console.log(`   ${String(h).padStart(3)}px × ${묶음[h].length}개 ${h >= 44 ? '  ' : ' ⛔'} ${표}`)
})
const 미달 = btns.filter((x) => x.h < 44).length
console.log(`\n   ⛔ 손가락 최소 44px 미달 = ${미달}/${btns.length}개`)

// ── ③ 「알약(둥근 칸)」이 몇 종류인가 — 다 비슷하면 구분이 안 된다
const pills = await page.evaluate(() => {
  const m = {}
  document.querySelectorAll('.decor-editor button').forEach((x) => {
    const cs = getComputedStyle(x); const r = x.getBoundingClientRect()
    if (r.height < 18 || !(x.textContent || '').trim()) return
    const rad = parseFloat(cs.borderRadius)
    if (!(rad > 900 || rad > r.height / 2 - 2)) return
    const k = `${Math.round(r.height)}px`
    m[k] = (m[k] || 0) + 1
  })
  return m
})
console.log('\n💊 「알약 모양」 칸 =', JSON.stringify(pills), '→ 종류가 적을수록 구분이 안 된다')

writeFileSync(join(OUT, '지금-일꾸.png'), await page.screenshot())
console.log('\n📸 지금-일꾸.png')
await b.close(); srv.close()
console.log('📁', OUT)
