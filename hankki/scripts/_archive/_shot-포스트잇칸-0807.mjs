// 📏 ⑴서랍에서 «고르는 칸»이 큰가 ⑵글씨가 몇 자까지 한 줄에 들어가나
//   창업자 2026-08-07 *"일꾸안에 고르라고 들어가는게 너무 큰거 아닌가 하는 말이었어."*
//                    *"여섯자가 한줄에 들어가게 예쁜크기 네가 정해줘."*
//   ⭐ 판정은 눈이 한다. 숫자는 «어디를 볼지»만 정한다(v9.16 교훈).
//   ⭐ 「크기를 줄이면 글자도 같은 비율로」는 v1.5 부터의 «의도된 설계»(기능-아카이브) — 비례는 그대로 두고 값만 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/포스트잇칸'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4428, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const SENT = '오늘 김치찌개\n진짜 맛있었다'
const FONTS = [15, 14, 13.5, 13]   // cqw — 지금이 15. 「여섯 자 한 줄」이 되는 «가장 큰» 값을 찾는다
const seed = FONTS.map((f, i) => ({
  id: `n${i}`, type: 'note', key: ['butter', 'sage', 'lavender', 'mint'][i], text: SENT, font: 'gaegu',
  x: 0.28 + (i % 2) * 0.44, y: 0.26 + Math.floor(i / 2) * 0.36, s: 0.34, r: 0,
}))

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const mk = async (decor) => {
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
  await page.goto('http://127.0.0.1:4428/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
  await page.mouse.click(8, 300); await page.waitForTimeout(400)
  return page
}
const shot = async (page, name, sel, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox()
  if (!box) { console.log('   ⛔ 못 찾음 —', name); return }
  const vp = page.viewportSize()
  const x = Math.max(0, Math.round(box.x - pad)), y = Math.max(0, Math.round(box.y - pad))
  const w = Math.min(vp.width - x, Math.round(box.width + pad * 2)), h = Math.min(vp.height - y, Math.round(box.height + pad * 2))
  writeFileSync(join(OUT, `${name}.png`), await page.screenshot({ clip: { x, y, width: w, height: h } }))
  console.log('  📸', name, `${w}×${h}px`)
}

// ─── ⑴ 서랍 칸 미리보기 크기 — 지금 80% 와 후보 셋
{
  const page = await mk([])
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
  const cmp = await page.evaluate(() => {
    const one = (sel) => { const el = document.querySelector(sel)?.firstElementChild; const r = el?.getBoundingClientRect(); return r ? Math.round(r.width) : null }
    return { 포스트잇: one('.decor-drawer button[aria-label*="포스트잇"]'), 칸: Math.round(document.querySelector('.decor-drawer .decor-cell').getBoundingClientRect().width) }
  })
  console.log('   ℹ️ 지금', JSON.stringify(cmp))
  for (const w of [80, 68, 62, 56]) {
    await page.evaluate((pct) => {
      document.querySelectorAll('.decor-drawer button[aria-label*="포스트잇"]').forEach((btn) => {
        const s = btn.firstElementChild; if (s) s.style.width = `${pct}%`
      })
    }, w)
    await page.waitForTimeout(300)
    await page.locator('.decor-drawer button[aria-label*="포스트잇"]').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(350)
    await shot(page, `칸-${w}`, '.decor-drawer')
  }
  await page.context().close()
}

// ─── ⑵ 글씨 비율 — 「오늘 김치찌개」 여섯 자가 한 줄에 들어가나
{
  const page = await mk(seed)
  const lines = await page.evaluate((fonts) => {
    const notes = [...document.querySelectorAll('.decor-stage [style*="rotate"]')]
    const out = []
    notes.forEach((n, i) => {
      // 글자 칸 = `whiteSpace: pre-wrap` 이 걸린 div (종이 판이 아니라)
      const t = [...n.querySelectorAll('div')].find((d) => getComputedStyle(d).whiteSpace === 'pre-wrap')
      if (!t) { out.push(`${fonts[i]}cqw — 글자 칸 못 찾음`); return }
      t.style.fontSize = `clamp(7px, ${fonts[i]}cqw, 72px)`
      out.push(t)
    })
    return out.map((t) => (typeof t === 'string' ? t : null))
  }, FONTS)
  await page.waitForTimeout(400)
  const measured = await page.evaluate((fonts) => {
    const notes = [...document.querySelectorAll('.decor-stage [style*="rotate"]')]
    return notes.map((n, i) => {
      const t = [...n.querySelectorAll('div')].find((d) => getComputedStyle(d).whiteSpace === 'pre-wrap')
      if (!t) return `${fonts[i]}cqw — ?`
      const cs = getComputedStyle(t)
      const lh = parseFloat(cs.lineHeight)
      // 「오늘 김치찌개」 한 줄 = 전체 두 줄. 실제 줄 수를 글자 높이로 센다.
      const rng = document.createRange(); rng.selectNodeContents(t)
      const rows = new Set([...rng.getClientRects()].map((r) => Math.round(r.top)))
      return `${fonts[i]}cqw · 글씨 ${cs.fontSize} · 줄 ${rows.size}줄`
    })
  }, FONTS)
  console.log('   📐', JSON.stringify(measured, null, 1))
  await shot(page, '글씨-비율-넷', '.decor-stage', 4)
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
