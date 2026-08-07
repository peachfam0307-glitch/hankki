// ❓ 창업자 2026-08-07 — *"기존에 속지에 그냥 글써지는 것도 되는거야? 꼭 글상자를 넣어야 써져?"*
//   ⛔ 규칙 15·17 — 기억으로 답하지 않는다. **네 자리를 실제로 눌러 보고 답한다.**
//   재는 자리 넷 =
//     ⑴ 일기 화면(꾸미기 «전») 속지 글칸        ⑵ 일기 화면 제목칸
//     ⑶ 꾸미기 «안»에서 속지 글칸 (v9.93 「어디서든 글씨 수정」)
//     ⑷ 레시피 꾸미기(레꾸) 에도 글칸이 있나
//   ⭐ 판정 = **글자를 실제로 치고 화면에 그 글자가 남았나**(칸이 «있다»가 아니라 «써진다»)
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
await new Promise((r) => srv.listen(4418, r))
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
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'line', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

// 📝 「써진다」의 판정 — 칸에 치고, 그 글자가 화면에 남았나
const type = async (sel, text, nth = 0) => {
  const el = page.locator(sel).nth(nth)
  if (!(await el.count())) return { 있나: false }
  await el.click({ force: true }); await page.waitForTimeout(250)
  await el.fill(text); await page.waitForTimeout(400)
  const v = await el.inputValue().catch(() => null)
  const ro = await el.evaluate((e) => e.readOnly === true || e.disabled === true).catch(() => null)
  return { 있나: true, 값: v, 읽기전용: ro }
}

const openDiary = async () => {
  await page.goto('http://127.0.0.1:4418/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
}

// ═══ ⑴ 일기 화면 — 꾸미기 «전» 속지에 그냥 글이 써지나 ═══════════
console.log('\n── ⑴ 일기 화면 속지 (꾸미기 «전») ──')
await openDiary()
{
  const n = await page.locator('textarea').count()
  console.log(`   ℹ️ 글칸(textarea) ${n}개`)
  const r = await type('textarea', '오늘 김치찌개를 끓였다.')
  if (!r.있나) no('속지에 글칸이 아예 없다')
  else if (r.읽기전용) no('글칸이 읽기 전용이다 — 못 쓴다')
  else if (r.값 && r.값.includes('김치찌개')) ok('⭐ 속지에 «그냥» 글이 써진다 — 글 상자 없이도 된다')
  else no(`글이 안 남았다 (값="${r.값}")`)
}

// ═══ ⑵ 제목칸 ═══════════════════════════════════════════════
console.log('\n── ⑵ 제목칸 ──')
{
  const r = await type('input[type="text"], input:not([type])', '오늘의 한끼')
  if (!r.있나) console.log('   ℹ️ 이 속지엔 제목칸이 없다(틀마다 다르다)')
  else if (r.읽기전용) no('제목칸이 읽기 전용이다')
  else if (r.값 && r.값.includes('한끼')) ok('제목칸도 그냥 써진다')
  else no(`제목이 안 남았다 (값="${r.값}")`)
}

// ═══ ⑶ 꾸미기 «안»에서도 속지에 써지나 (v9.93 「어디서든 글씨 수정」) ═
console.log('\n── ⑶ 꾸미기 «안»에서 속지 글칸 ──')
{
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1300)
  const n = await page.locator('.decor-stage textarea').count()
  console.log(`   ℹ️ 꾸미기 판 안의 글칸 ${n}개`)
  const r = await type('.decor-stage textarea', '꾸미면서도 글이 써진다')
  if (!r.있나) no('꾸미기 안엔 글칸이 없다 — 탭을 옮겨야 쓴다')
  else if (r.읽기전용) no('꾸미기 안에선 글칸이 읽기 전용이다')
  else if (r.값 && r.값.includes('써진다')) ok('⭐ 꾸미는 «동안»에도 속지에 바로 써진다 (v9.93)')
  else no(`꾸미기 안에서 글이 안 남았다 (값="${r.값}")`)
}

// ═══ ⑷ 레꾸(레시피 꾸미기)에도 글칸이 있나 ═══════════════════════
console.log('\n── ⑷ 레꾸(레시피 표지 꾸미기) ──')
{
  await page.goto('http://127.0.0.1:4418/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1200)
  const btn = page.getByRole('button', { name: /레시피 꾸미기/ }).first()
  if (!(await btn.count())) { no('레꾸 버튼을 못 찾았다 — 검사 방식부터 볼 것') }
  else {
    await btn.click(); await page.waitForTimeout(1500)
    const n = await page.locator('.decor-stage textarea').count()
    console.log(`   ℹ️ 레꾸 판 안의 글칸 ${n}개`)
    // ⭐ 레꾸는 «레시피 표지»다 — 속지(줄 있는 종이)가 아니라 사진·아이콘 판이다.
    //    그래서 글칸이 «없는 게 정상»일 수 있다. 판정하지 말고 사실만 적는다.
    if (n === 0) console.log('   ℹ️ 레꾸엔 속지 글칸이 없다 — 표지라서 «쓰는 칸» 자체가 없다(글은 글자 스티커로 얹는다)')
    else ok(`레꾸에도 글칸이 ${n}개 있다`)
  }
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
