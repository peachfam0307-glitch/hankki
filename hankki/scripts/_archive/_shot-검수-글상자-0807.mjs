// 🖼 검수판 — 「글 상자」 판 전체를 창업자 폰 판정용으로 찍는다 (규칙 13)
//   ⛔ 줄여서 찍지 않는다 — deviceScaleFactor 3 으로 «크게» 찍어 그대로 붙인다.
//   ⭐ 판마다 «새 판»으로 시작한다 — 앞 판의 고른 표시·치던 칸이 다음 판을 더럽힌다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-글상자'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4423, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const shots = []

// 꾸미기 판을 새로 연다 — 「글자」 탭까지
const fresh = async () => {
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })
  await page.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
  return page
}

// 화면 «안»으로 잘라 찍는다 — 스크롤 칸은 화면 밖까지 뻗어 있어 clip 이 통째로 죽는다
const cut = async (page, name, sel, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox()
  if (!box) { console.log('   ⛔ 못 찾음 —', name); return }
  const vp = page.viewportSize()
  const x = Math.max(0, Math.round(box.x - pad)), y = Math.max(0, Math.round(box.y - pad))
  const w = Math.min(vp.width - x, Math.round(box.width + pad * 2))
  const h = Math.min(vp.height - y, Math.round(box.height + pad * 2))
  writeFileSync(join(OUT, `${name}.png`), await page.screenshot({ clip: { x, y, width: w, height: h } }))
  shots.push(name)
  console.log('  📸', name, `${w}×${h}px`)
}

// 컨텍스트 바엔 클래스가 없다(인라인 스타일) → 표식을 «달아» 찍는다
const markCtx = (page) => page.evaluate(() => {
  document.querySelectorAll('[data-shot]').forEach((n) => n.removeAttribute('data-shot'))
  const bar = [...document.querySelectorAll('div')].find((d) =>
    d.parentElement && getComputedStyle(d).flexDirection === 'column' && d.querySelector('button') &&
    /맨 뒤로/.test(d.textContent || ''))
  if (bar) bar.dataset.shot = 'ctx'
  return !!bar
})

// ─────────────────────────────────────────────────────────────
// ① 서랍 — 「글 상자」 묶음 다섯이 보이나
{
  const page = await fresh()
  const cells = page.locator('.decor-drawer button[aria-label^="글 상자"]')
  const n = await cells.count()
  console.log(`   ℹ️ 서랍 글 상자 칸 ${n}개`)
  // ⛔ 그냥 찍으면 서랍 «맨 위»(선물·표지 그림·글씨체)만 나온다 — 글 상자 묶음은 한참 아래다.
  //    → 묶음이 화면에 오게 굴린 뒤 찍는다. 44컷 5묶음이라 두 판으로 나눠 담는다.
  await cells.nth(0).scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
  await cut(page, '1a-서랍-글상자-앞', '.decor-drawer')
  await cells.nth(Math.min(24, n - 1)).scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
  await cut(page, '1b-서랍-글상자-뒤', '.decor-drawer')
  await page.context().close()
}

// ② 실물 — 라벨지 · 찢은 종이 · 메모지 · 프레임에 글이 얹히나
{
  const page = await fresh()
  const cells = page.locator('.decor-drawer button[aria-label^="글 상자"]')
  const picks = [[0, '오늘 김치찌개'], [12, '국물이 진해'], [17, '8월 7일 금요일\n오늘도 해냈다'], [36, '우리집 최고']]
  for (let k = 0; k < picks.length; k++) {
    const [i, t] = picks[k]
    await page.mouse.click(8, 300); await page.waitForTimeout(300)   // 앞 상자의 치는 칸을 닫는다
    await cells.nth(i).click(); await page.waitForTimeout(800)
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (await ta.count()) { await ta.fill(t); await page.waitForTimeout(350) }
    await page.mouse.click(8, 300); await page.waitForTimeout(350)
    await page.evaluate(([j]) => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      if (el) { el.style.top = `${18 + j * 22}%`; el.style.left = '50%' }
    }, [k])
    await page.waitForTimeout(200)
  }
  await page.mouse.click(8, 300); await page.waitForTimeout(500)
  await cut(page, '2-글상자-실물', '.decor-stage', 4)
  await page.context().close()
}

// ③ 포스트잇 열두 색 — 밝은 여섯(위) ＋ 진한 여섯(아래)
{
  const page = await fresh()
  const names = ['크림', '피치', '세이지', '하늘', '라벤더', '클레이', '민트', '올리브', '모카', '더스티', '데님', '그레이프']
  const cells = page.locator('.decor-drawer button[aria-label*="포스트잇"]')
  const n = await cells.count()
  console.log(`   ℹ️ 서랍 포스트잇 칸 ${n}개`)
  for (let i = 0; i < Math.min(12, n); i++) {
    await page.mouse.click(8, 300); await page.waitForTimeout(220)
    await cells.nth(i).click(); await page.waitForTimeout(560)
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (await ta.count()) { await ta.fill(names[i]); await page.waitForTimeout(260) }
    await page.mouse.click(8, 300); await page.waitForTimeout(260)
    await page.evaluate(([k]) => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      if (!el) return
      el.style.left = `${19 + (k % 3) * 31}%`; el.style.top = `${16 + Math.floor(k / 3) * 23}%`
      el.style.width = '27%'; el.style.height = '18%'
      el.style.transform = 'translate(-50%,-50%) rotate(0deg)'
    }, [i])
    await page.waitForTimeout(160)
  }
  await page.mouse.click(8, 300); await page.waitForTimeout(500)
  await cut(page, '3-포스트잇-열두색', '.decor-stage', 4)
  await page.context().close()
}

// ④ 붙인 뒤에도 색 바꾸기 ＋ ⑤ 글자색 두 줄 ＋ ⑥ 움직임／효과 갈래 단추
{
  const page = await fresh()
  // 포스트잇 하나를 붙여 고른 채로 둔다 → 색 줄이 뜬다
  await page.locator('.decor-drawer button[aria-label*="포스트잇"]').first().click(); await page.waitForTimeout(700)
  const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
  if (await ta.count()) { await ta.fill('색 바꾸기'); await page.waitForTimeout(300) }
  await page.locator('.decor-stage').click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(250)
  // 다시 탭해 고른다(치는 칸은 닫고 고른 상태만)
  await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(400)
  await page.keyboard.press('Escape').catch(() => {})
  if (await markCtx(page)) await cut(page, '4-포스트잇-붙인뒤-색바꾸기-전체화면', '[data-shot="ctx"]')
  else console.log('   ⛔ 컨텍스트 바를 못 찾았다 — 검사 방식부터 볼 것')
  await page.context().close()
}
{
  const page = await fresh()
  await page.getByRole('button', { name: '글자 넣기', exact: true }).click(); await page.waitForTimeout(700)
  const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
  if (await ta.count()) { await ta.fill('오늘도 해냈다'); await page.waitForTimeout(300) }
  if (await markCtx(page)) await cut(page, '5-글자색-두줄-전체화면', '[data-shot="ctx"]')
  // 🔀 갈래 단추 — 두 쪽 다 찍는다
  if (await page.getByRole('button', { name: '움직임', exact: true }).count()) {
    await page.getByRole('button', { name: '움직임', exact: true }).click(); await page.waitForTimeout(300)
    if (await markCtx(page)) await cut(page, '6-움직임쪽-전체화면', '[data-shot="ctx"]')
    await page.getByRole('button', { name: '효과', exact: true }).click(); await page.waitForTimeout(300)
    if (await markCtx(page)) await cut(page, '7-효과쪽-전체화면', '[data-shot="ctx"]')
  } else console.log('   ⛔ 갈래 단추를 못 찾았다')
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT, `· 컷 ${shots.length}장`)
process.exit(errs.length === 0 && shots.length >= 6 ? 0 : 1)
