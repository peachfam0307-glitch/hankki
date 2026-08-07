// 📱🐛 창업자 폰 제보 2026-08-07 (네 번째 묶음)
//   ⓐ *"스티커 하나 붙이면 바로 글쓰기로 넘어가. 다른거 붙이려면 다시 일꾸 눌러야함."*
//   ⓑ *"스티커 늘리기하면 길게 누르면서 늘리면 구글검색? 이런게 켜져."*
//
// ⛔ 코드를 읽고 「이게 원인일 것」이라 짐작한 상태다. **먼저 재현해서 확인**한다(규칙 7).
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
await new Promise((r) => srv.listen(4403, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  // ⚠️ 창업자 화면과 같은 「없음」 틀 — 여기선 쓰는 칸이 종이 «거의 전체»다
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
await page.goto('http://127.0.0.1:4403/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)

const segOn = () => page.evaluate(() => [...document.querySelectorAll('.decor-drawer .seg.on')].map((s) => s.textContent.trim()).join(','))

// ═══ ⓐ 일꾸에서 스티커를 붙이고 빈 자리를 탭하면? ═══════
console.log('\n── ⓐ 일꾸에서 붙이고 → 빈 종이 탭 ──')
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
console.log('   ℹ️ 시작 탭 =', await segOn())
const chip = page.locator('.decor-drawer .decor-sec img').first()
if (!(await chip.count())) { no('서랍에서 스티커를 못 찾았다'); }
else {
  await chip.click(); await page.waitForTimeout(700)
  console.log('   ℹ️ 스티커 붙인 «직후» 탭 =', await segOn())
  // 이어서 «빈 종이»를 탭한다 — 고른 걸 풀거나 다음 걸 놓으려는 자연스러운 동작
  const st = await page.locator('.decor-stage .paper').first().boundingBox()
  await page.mouse.click(st.x + st.width * 0.25, st.y + st.height * 0.62)
  await page.waitForTimeout(700)
  const after = await segOn()
  console.log('   ℹ️ 빈 종이 탭한 «뒤» 탭 =', after)
  if (after.includes('글쓰기')) no('⭐ 일꾸에서 빈 종이를 탭하니 «글쓰기»로 넘어간다 — 창업자 제보 그대로')
  else ok('일꾸에서 빈 종이를 탭해도 일꾸에 남는다')
}

// ═══ ⓑ 길게 누르면 글자가 «선택»되나 (안드로이드 텍스트 메뉴) ═══
console.log('\n── ⓑ 길게 눌러 끌 때 글자가 선택되나 ──')
const sel = await page.evaluate(() => {
  const bad = []
  const seen = new Set()
  for (const el of document.querySelectorAll('.decor-editor *')) {
    const t = el.tagName.toLowerCase()
    if (t === 'textarea' || t === 'input') continue
    if (!el.textContent || !el.textContent.trim()) continue
    const us = getComputedStyle(el).userSelect || getComputedStyle(el).webkitUserSelect
    if (us !== 'none') { const k = el.textContent.trim().slice(0, 18); if (!seen.has(k)) { seen.add(k); bad.push(`${t}: ${k}`) } }
  }
  return bad
})
if (sel.length) {
  no(`⭐ 글자를 «선택할 수 있는» 자리가 ${sel.length}곳 — 길게 누르면 구글 검색 메뉴가 뜬다`)
  sel.slice(0, 8).forEach((s) => console.log(`        ${s}`))
} else ok('꾸미기 화면의 글자는 선택되지 않는다 (길게 눌러도 메뉴가 안 뜬다)')

// ═══ ⓒ 글쓰기 탭에서 «본문» 글씨체를 고를 수 있나 ═════
//   창업자 *"글쓰기 글자체도 추가했으면 좋겠다는 뜻이었는데 스티커 글자체만 추가 되었단 뜻"*
console.log('\n── ⓒ 글쓰기 탭에서 본문 글씨체 고르기 ──')
await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(800)
// 종이에 글을 한 줄 써 둔다 — 글씨체가 바뀌는 걸 «폭»으로 재려면 글자가 있어야 한다
const ta = page.locator('.decor-stage textarea').first()
if (!(await ta.count())) no('글쓰기 탭인데 종이에 쓰는 칸이 없다')
else {
  await ta.fill('맛있겠다 오늘도 한 끼'); await page.waitForTimeout(600)
  const widthNow = () => page.evaluate(() => {
    const t = document.querySelector('.decor-stage textarea')
    const m = document.createElement('span')
    m.style.cssText = 'position:fixed;left:-9999px;white-space:pre'
    const cs = getComputedStyle(t)
    m.style.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    m.style.letterSpacing = cs.letterSpacing
    m.textContent = t.value
    document.body.appendChild(m)
    const w = Math.round(m.getBoundingClientRect().width * 10) / 10
    m.remove()
    return { w, fam: cs.fontFamily.split(',')[0] }
  })
  const a0 = await widthNow()
  console.log(`   ℹ️ 지금 본문 글씨체 = ${a0.fam} (폭 ${a0.w}px)`)
  const row = page.locator('.decor-drawer button').filter({ hasText: /^(삐뚤체|납작체|임팩트)$/ })
  if (!(await row.count())) no('⭐ 글쓰기 탭에 본문 글씨체 고르는 칸이 «없다» — 창업자 제보 그대로')
  else {
    await row.first().click(); await page.waitForTimeout(900)
    const a1 = await widthNow()
    console.log(`   ℹ️ 고른 뒤 = ${a1.fam} (폭 ${a1.w}px)`)
    if (a1.fam === a0.fam || a1.w === a0.w) no('글씨체를 골랐는데 종이 글씨가 «안 바뀐다»')
    else ok('⭐ 글쓰기 탭에서 고르면 종이의 본문 글씨가 바뀐다')
    // 저장까지 되나 — 다시 열었을 때 되살아나야 한다
    await page.waitForTimeout(700)
    const saved = await page.evaluate(() => {
      try { const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}'); return (s.diary || []).find((d) => d.kind === 'diary')?.font || '' } catch { return '(못 읽음)' }
    })
    if (saved) ok(`저장값에도 남는다 (font = ${saved}) — 다시 열어도 그 글씨체다`)
    else no('화면만 바뀌고 저장값엔 안 남는다 — 다시 열면 되돌아간다')
  }
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남 — 창업자 제보가 재현됐다\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
