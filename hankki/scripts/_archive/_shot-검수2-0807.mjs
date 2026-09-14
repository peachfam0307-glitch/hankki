// 🖼 2차 검수판 — 창업자 판정 다섯을 반영한 뒤 (2026-08-07)
//   ① 글자 기본색 검정 ② 긴 글 자동 줄이기 ③ 엔터 ④ 돌리기 화살표 ⑤ 글 상자 44컷 «번호판»
//   ⭐ ⑤ 는 창업자가 «뺄 것을 번호로 짚기» 위한 판이다 — 칸마다 번호를 크게 박는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수2'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4432, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const fresh = async (decor = []) => {
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
  await page.goto('http://127.0.0.1:4432/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1300)
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

// ─── ① 글자 기본색 검정 ＋ ④ 돌리기 화살표 (고른 채로 둬서 손잡이가 보이게)
{
  const page = await fresh()
  await page.getByRole('button', { name: '글자 넣기', exact: true }).click(); await page.waitForTimeout(700)
  const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
  if (await ta.count()) { await ta.fill('오늘도 해냈다'); await page.waitForTimeout(300) }
  await page.locator('.decor-stage').click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(300)
  await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(500)
  await cut(page, '1-글자검정-돌리기화살표', '.decor-stage', 4)
  await page.context().close()
}

// ─── ② 긴 글 자동 줄이기 — 짧은 글 · 중간 · 아주 긴 글
{
  const TXT = ['오늘 김치찌개', '오늘 김치찌개\n진짜 맛있었다', '오늘은 김치찌개를 끓였는데\n국물이 진하고 돼지고기가\n푹 익어서 아주 맛있었다\n다음에 또 해먹어야지']
  const decor = TXT.map((t, i) => ({ id: `n${i}`, type: 'note', key: ['butter', 'sage', 'lavender'][i], text: t, font: 'gaegu', x: 0.5, y: 0.2 + i * 0.3, s: 0.34, r: 0 }))
  const page = await fresh(decor)
  await page.mouse.click(8, 300); await page.waitForTimeout(500)
  await cut(page, '2-긴글-자동줄이기', '.decor-stage', 4)
  await page.context().close()
}

// ─── ⑤ 글 상자 44컷 «번호판» — 뺄 것을 번호로 짚기
{
  const page = await fresh()
  const n = await page.locator('.decor-drawer button[aria-label^="글 상자"]').count()
  console.log(`   ℹ️ 글 상자 ${n}컷`)
  // 서랍을 통째로 화면에 펼친다 — 칸마다 번호를 크게 박는다
  await page.evaluate(() => {
    const dr = document.querySelector('.decor-drawer')
    // 글 상자 묶음만 남기고 나머지 줄은 감춘다 — 한 판에 44컷이 다 들어가야 번호로 짚을 수 있다
    dr.querySelectorAll('.decor-sec').forEach((s) => {
      if (!s.querySelector('button[aria-label^="글 상자"]')) s.style.display = 'none'
    })
    dr.style.maxHeight = 'none'
    dr.querySelectorAll('div').forEach((d) => { if (d.style.overflowY) d.style.overflowY = 'visible' })
    let i = 0
    dr.querySelectorAll('button[aria-label^="글 상자"]').forEach((btn) => {
      i += 1
      btn.style.position = 'relative'
      const tag = document.createElement('span')
      tag.textContent = String(i)
      tag.style.cssText = 'position:absolute;top:1px;left:3px;font-size:9px;font-weight:800;color:#b0705a;background:rgba(255,255,255,.9);border-radius:4px;padding:0 3px;line-height:1.35;z-index:5'
      btn.appendChild(tag)
    })
  })
  await page.waitForTimeout(500)
  const box = await page.locator('.decor-drawer').boundingBox()
  writeFileSync(join(OUT, '3-글상자-44컷-번호판.png'), await page.screenshot({ clip: { x: 0, y: Math.max(0, Math.round(box.y)), width: 360, height: Math.round(box.height) } , scale: 'css' }))
  console.log('  📸 3-글상자-44컷-번호판', `360×${Math.round(box.height)}px`)
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
