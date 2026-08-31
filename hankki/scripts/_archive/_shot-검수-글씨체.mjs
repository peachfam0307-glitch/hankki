// 📸 2026-08-07 네 번째 검수판 — 귀여운 글씨체 여섯 추가 (규칙 13 · 고화질)
//   ⭐ **앱 실물 화면**으로 찍는다 — 판정판(HTML)은 「글씨 모양」을 보는 것이고,
//      이건 「진짜 앱에서 그렇게 보이나 · 고르는 칸이 어떻게 생겼나」를 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-글씨체'
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
await new Promise((r) => srv.listen(4402, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

// 📖 코드에서 읽는다 — 손으로 적으면 낡는다
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const TBL = SRC.slice(SRC.indexOf('export const TEXT_FONTS = ['))
const FONTS = [...TBL.slice(0, TBL.indexOf('\n]')).matchAll(/key: '([\w]+)', label: '([^']+)'/g)].map((m) => ({ key: m[1], label: m[2] }))
console.log(`📖 글씨체 ${FONTS.length}개 — ${FONTS.map((f) => f.label).join(' · ')}`)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })
const page = await ctx.newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))

// 📝 열두 글씨체로 «한 줄씩» 써 둔 일기를 만들어 둔다 — 진짜 판 위에서 견줘야 한다
const decor = FONTS.map((f, i) => ({
  id: `t${i}`, type: 'text', text: f.label, font: f.key, color: 'charcoal', w: 'mid',
  x: 0.5, y: 0.075 + i * 0.0755, s: 0.115, r: 0,
}))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }],
})
await page.goto('http://127.0.0.1:4402/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1600)
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200)
await page.screenshot({ path: join(OUT, '1-종이위-열둘.png') })
console.log('  📸 1-종이위-열둘')

// 🎛 고르는 칸 — 「글자」 탭
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(800)
const tab = page.getByRole('button', { name: '글자', exact: true })
if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(1800) }
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, '2-고르는칸.png') })
console.log('  📸 2-고르는칸')

// 🔎 「고르는 칸이 진짜 그 글씨체로 보이나」 — 폭으로 잰다(대체 글꼴이면 폭이 같다)
const same = await page.evaluate((LABELS) => {
  // ⚠️ 「글쓰기」 같은 «탭» 단추가 섞이면 «대체 글꼴로 나온다»는 거짓 경고가 뜬다(첫 판에서 실제로 그랬다)
  //    → 글씨체 이름표와 «정확히 같은» 단추만 본다
  const want = new Set(LABELS)
  const btns = [...document.querySelectorAll('.decor-drawer button')].filter((b) => want.has(b.textContent.trim()))
  const m = document.createElement('span')
  m.style.cssText = 'position:fixed;left:-9999px;font-size:40px;white-space:pre'
  document.body.appendChild(m)
  const out = []
  for (const btn of btns) {
    const ff = getComputedStyle(btn).fontFamily
    m.textContent = btn.textContent.trim()
    m.style.fontFamily = 'serif'; const base = m.getBoundingClientRect().width
    m.style.fontFamily = ff; const w = m.getBoundingClientRect().width
    out.push({ label: btn.textContent.trim(), same: Math.abs(w - base) < 0.5 })
  }
  m.remove(); return out
}, FONTS.map((f) => f.label))
const dead = same.filter((x) => x.same).map((x) => x.label)
console.log(dead.length ? `  ⛔ 고르는 칸에서 «대체 글꼴»로 나오는 것 — ${dead.join(', ')}` : `  ✅ 고르는 칸 ${same.length}개가 다 제 글씨체로 나온다`)

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
