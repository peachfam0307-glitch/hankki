// 📏 포스트잇이 «얼마나 큰가» — 창업자 2026-08-07 *"개별 포스트잇크기 줄일까? 저렇게 클필요 없을 것 같아."*
//   ⛔⛔ 앞 판(`_shot-포스트잇색`)은 **색만 견주려고 내가 27%×18% 로 강제해서** 찍은 것이라
//      «실제 크기»가 아니다. 그 판을 근거로 크기를 정하면 안 된다(규칙 18 — 무엇을 보고 말하는지부터).
//   ⭐ 그래서 ⑴서랍 칸 미리보기 ⑵종이에 붙였을 때 실제 크기 ⑶후보 넷 을 «실물»로 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/포스트잇크기'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4425, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const fresh = async () => {
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })
  await page.goto('http://127.0.0.1:4425/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
  return page
}
const cut = async (page, name, sel, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox()
  if (!box) { console.log('   ⛔ 못 찾음 —', name); return }
  const vp = page.viewportSize()
  const x = Math.max(0, Math.round(box.x - pad)), y = Math.max(0, Math.round(box.y - pad))
  const w = Math.min(vp.width - x, Math.round(box.width + pad * 2)), h = Math.min(vp.height - y, Math.round(box.height + pad * 2))
  writeFileSync(join(OUT, `${name}.png`), await page.screenshot({ clip: { x, y, width: w, height: h } }))
  console.log('  📸', name, `${w}×${h}px`)
}

// ⑴ 서랍 칸 — 포스트잇 미리보기가 «다른 칸보다» 큰가
{
  const page = await fresh()
  const m = await page.evaluate(() => {
    const one = (sel) => { const el = document.querySelector(sel); if (!el) return null; const in0 = el.firstElementChild; const r = (in0 || el).getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` }
    return {
      칸: one('.decor-drawer button[aria-label*="포스트잇"]'),
      포스트잇_미리보기: (() => { const el = document.querySelector('.decor-drawer button[aria-label*="포스트잇"]'); const r = el?.firstElementChild?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null })(),
      글상자_미리보기: (() => { const el = document.querySelector('.decor-drawer button[aria-label^="글 상자"]'); const r = el?.firstElementChild?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null })(),
    }
  })
  console.log('   ℹ️ 서랍', JSON.stringify(m))
  await page.locator('.decor-drawer button[aria-label*="포스트잇"]').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
  await cut(page, '0-서랍-포스트잇칸', '.decor-drawer')
  await page.context().close()
}

// ⑵⑶ 종이에 붙였을 때 — 지금(0.34) 과 후보 셋
{
  const page = await fresh()
  const SIZES = [[0.34, '지금'], [0.28, 'A'], [0.24, 'B'], [0.20, 'C']]
  const cells = page.locator('.decor-drawer button[aria-label*="포스트잇"]')
  for (let i = 0; i < SIZES.length; i++) {
    const [s, label] = SIZES[i]
    await page.mouse.click(8, 300); await page.waitForTimeout(220)
    await cells.nth(i * 2).click(); await page.waitForTimeout(600)
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (await ta.count()) { await ta.fill(`${label}\n${Math.round(s * 100)}%`); await page.waitForTimeout(280) }
    await page.mouse.click(8, 300); await page.waitForTimeout(260)
    // ⭐ 지금 크기(0.34)에서 «비율 그대로» 줄인다 — px 로 재서 곱하니 세로 비율이 안 틀어진다
    await page.evaluate(([k, mul]) => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.width = `${r.width * mul}px`; el.style.height = `${r.height * mul}px`
      el.style.left = `${26 + (k % 2) * 48}%`; el.style.top = `${28 + Math.floor(k / 2) * 34}%`
      el.style.transform = 'translate(-50%,-50%) rotate(0deg)'
    }, [i, s / 0.34])
    await page.waitForTimeout(180)
  }
  await page.mouse.click(8, 300); await page.waitForTimeout(500)
  const sizes = await page.evaluate(() => {
    const stage = document.querySelector('.decor-stage').getBoundingClientRect()
    return {
      종이: `${Math.round(stage.width)}×${Math.round(stage.height)}`,
      각각: [...document.querySelectorAll('.decor-stage [style*="rotate"]')].map((n) => {
        const r = n.getBoundingClientRect()
        return `${Math.round(r.width)}×${Math.round(r.height)}px (폭 ${Math.round(r.width / stage.width * 100)}%)`
      }),
    }
  })
  console.log('   📐', JSON.stringify(sizes, null, 1))
  await cut(page, '1-크기-후보넷', '.decor-stage', 4)
  await page.context().close()
}

// ⑷ ⭐ 크기만 보면 «작을수록 예쁘다» — 포스트잇은 «글을 쓰는 것»이라 글이 들어가야 한다.
//    그래서 네 크기에 «같은 문장»을 넣어 「몇 자나 들어가나」를 같이 본다.
{
  const page = await fresh()
  const SIZES = [[0.34, '지금 34%'], [0.28, 'A 28%'], [0.24, 'B 24%'], [0.20, 'C 20%']]
  const SENT = '오늘 김치찌개\n진짜 맛있었다'
  const cells = page.locator('.decor-drawer button[aria-label*="포스트잇"]')
  for (let i = 0; i < SIZES.length; i++) {
    await page.mouse.click(8, 300); await page.waitForTimeout(220)
    await cells.nth(i * 2).click(); await page.waitForTimeout(600)
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (await ta.count()) { await ta.fill(SENT); await page.waitForTimeout(280) }
    await page.mouse.click(8, 300); await page.waitForTimeout(260)
    await page.evaluate(([k, mul]) => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.width = `${r.width * mul}px`; el.style.height = `${r.height * mul}px`
      el.style.left = `${26 + (k % 2) * 48}%`; el.style.top = `${28 + Math.floor(k / 2) * 34}%`
      el.style.transform = 'translate(-50%,-50%) rotate(0deg)'
    }, [i, SIZES[i][0] / 0.34])
    await page.waitForTimeout(180)
  }
  await page.mouse.click(8, 300); await page.waitForTimeout(500)
  await cut(page, '2-같은글-네크기', '.decor-stage', 4)
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
