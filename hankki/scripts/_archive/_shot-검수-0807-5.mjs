// 📸 2026-08-07 여섯 번째 검수판 — 창업자 폰 제보 다섯 ＋ 「탭 안 옮기고 쓰기」 (규칙 13 · 고화질)
//   ① 상하 뒤집기   ② 어디서든 글씨 수정(1순위)   ③ 글자색 15   ④ 글자에 모션·효과
//   ⑤ 글씨체 칩 높이   ⑥ 글 치는 «동안» 글씨·크기 줄이 따라온다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0807-5'
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
await new Promise((r) => srv.listen(4410, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
const openDecor = async () => {
  await page.goto('http://127.0.0.1:4410/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
}
const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log('  📸', n) }

// ② ＋ ⑥ — 일꾸 탭인데 글이 써지고, 글씨·크기 줄이 «따라온다»
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
await shot('1-일꾸탭-글쓰기전')
{
  const st = await page.locator('.decor-stage .paper').first().boundingBox()
  await page.mouse.click(st.x + st.width * 0.4, st.y + st.height * 0.28); await page.waitForTimeout(700)
  await page.keyboard.type('일꾸 탭인데 여기서 바로 써져')
  await page.waitForTimeout(900)
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500)
  await shot('2-일꾸탭에서-바로-쓰는중-글씨크기줄')
  // 글씨체를 바꿔도 커서가 살아 있다 → 이어서 계속 쓴다
  const chip = page.locator('.decor-drawer button').filter({ hasText: /^삐뚤체$/ }).first()
  if (await chip.count()) {
    await chip.click(); await page.waitForTimeout(700)
    await page.keyboard.type(' 이어서도 써져')
    await page.waitForTimeout(800)
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500)
    await shot('3-글씨체-바꿔도-커서유지')
  }
}

// ② 스티커도 글칸 위에 그대로 — 글칸을 살린 대가를 막았다
{
  await page.evaluate(() => document.activeElement?.blur?.()); await page.waitForTimeout(500)
  const chips = page.locator('.decor-drawer .decor-sec img')
  for (let i = 0; i < Math.min(2, await chips.count()); i++) { await chips.nth(i).click(); await page.waitForTimeout(500) }
  const st = await page.locator('.decor-stage .paper').first().boundingBox()
  const it = await page.locator('.decor-stage [style*="rotate"]').first().boundingBox()
  await page.mouse.move(it.x + it.width / 2, it.y + it.height / 2); await page.mouse.down()
  for (let i = 1; i <= 8; i++) { await page.mouse.move(it.x + it.width / 2, it.y + it.height / 2 - i * 9); await page.waitForTimeout(35) }
  await page.mouse.up(); await page.waitForTimeout(700)
  await shot('4-스티커를-글칸-위로-끌었다')
}

// ① 상하 뒤집기 — 좌우만 · 상하만 · 둘 다
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: '데코', exact: true }).last().click().catch(() => {}); await page.waitForTimeout(700)
{
  const sec = page.locator('.decor-sec').filter({ hasText: '코너' }).first()
  const chip = (await sec.count()) ? sec.locator('img').first() : page.locator('.decor-drawer .decor-sec img').first()
  await chip.click(); await page.waitForTimeout(900)
  await shot('5-코너-그대로')
  const lr = page.locator('.decor-editor button').filter({ hasText: /^좌우 뒤집기$/ }).first()
  const ud = page.locator('.decor-editor button').filter({ hasText: /^상하 뒤집기$/ }).first()
  if (await lr.count()) { await lr.click(); await page.waitForTimeout(600); await shot('6-코너-좌우뒤집기') }
  if (await ud.count()) { await ud.click(); await page.waitForTimeout(600); await shot('7-코너-좌우＋상하') }
  if (await lr.count()) { await lr.click(); await page.waitForTimeout(600); await shot('8-코너-상하만') }
}

// ③④ 글자 색 15 · 모션·효과
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
{
  await page.locator('.decor-drawer button').filter({ hasText: /^글자 넣기$/ }).first().click(); await page.waitForTimeout(800)
  const ta = page.locator('.sheet textarea, .sheet input').first()
  if (await ta.count()) { await ta.fill('맛있겠다'); await page.waitForTimeout(300) }
  const save = page.locator('.sheet button').filter({ hasText: /저장|확인|넣기|완료|붙이기/ }).first()
  if (await save.count()) { await save.click(); await page.waitForTimeout(900) }
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600)
  await shot('9-글자-편집바-색15과-모션효과')
  // 🐛 창업자 제보(v9.93 회귀) — 효과가 «맨 앞 한 글자» 위에만 뜨던 것. 하트를 걸어 «전체»에 뜨는지 본다.
  const fxb = page.locator('.decor-editor button').filter({ hasText: /^하트$/ }).first()
  if (await fxb.count()) {
    await fxb.click(); await page.waitForTimeout(900)
    await shot('9b-글자에-하트효과-전체에-뜬다')
  }
}

// ⑦ 서랍 맨 위 배치 — 레시피 꾸미기라야 「배경 음식 아이콘 지우기」가 뜬다(일기엔 표지가 없다)
{
  await page.goto('http://127.0.0.1:4410/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  const card = page.locator('.grid-card').first()
  if (await card.count()) {
    await card.click(); await page.waitForTimeout(1100)
    const deco = page.getByRole('button', { name: /레시피 꾸미기/ }).first()
    if (await deco.count()) {
      await deco.click(); await page.waitForTimeout(1400)
      await shot('10-레시피꾸미기-선물→배경음식아이콘지우기→사진')
    }
  }
}

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
