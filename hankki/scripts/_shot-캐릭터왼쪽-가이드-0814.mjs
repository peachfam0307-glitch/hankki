// 🧍‍♀️📖 캐릭터 왼쪽 통일 ＋ 「계량·손질」 버튼 — 화면에서 «실제로» 확인한다
//
// 📮 창업자 2026-08-14 *"캐릭터는 같은방향에넣자.왼쪽으로"* · *"b가 좋겠어"*(글자 = 계량·손질)
//    ＋ 🧪테스터 *"재료손질 화면에서도 요리가이드 있었으면"*
//
// ⛔ 숫자만 보고 「됐다」 하지 않는다 — 규칙 21(보여주기 전에 내가 열어본다).
//    그래서 ⑴자리를 «재고» ⑵캡처를 «남긴다».
//
// 재는 것
//   ① 상단바에서 캐릭터가 제목 «왼쪽»인가 (x 비교) — 다섯 탭 전부
//   ② 레시피 상세 「재료」 줄이 «가로로 넘치지» 않나 (글자 버튼으로 늘어난 만큼)
//   ③ 요리 시작 → 재료 준비 화면에 「계량·손질」 버튼이 있고 «눌리면 시트가 뜨나»
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4463, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// ① 캐릭터가 제목 왼쪽인가 — 상단바 안에서 그림과 제목의 x 를 견준다
const 캐릭터자리 = `(() => {
  const bar = document.querySelector('.app-frame .topbar') || document.querySelector('.app-frame .screen')
  if (!bar) return { 오류: '상단바 없음' }
  const 제목 = bar.querySelector('.h-title')
  if (!제목) return { 오류: '제목(.h-title) 없음' }
  // 제목과 «같은 줄»에 있는 그림만 본다
  const tr = 제목.getBoundingClientRect()
  let 그림 = null
  for (const im of bar.querySelectorAll('img')) {
    const r = im.getBoundingClientRect()
    if (r.height < 12) continue
    if (r.bottom < tr.top - 6 || r.top > tr.bottom + 6) continue
    그림 = { x: Math.round(r.left), 이름: (im.src || '').split('/').pop().split('?')[0] }
    break
  }
  if (!그림) return { 없음: true, 제목: 제목.textContent.trim() }
  return { 제목: 제목.textContent.trim(), 그림: 그림.이름, 그림x: 그림.x, 제목x: Math.round(tr.left), 왼쪽인가: 그림.x < tr.left }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:giftSheetSeen', '1') })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
const 터짐 = []
pg.on('pageerror', (e) => 터짐.push(String(e).slice(0, 120)))
await pg.goto('http://127.0.0.1:4463/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900)
const a = pg.getByRole('button', { name: '나중에' }).first()
if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})

let 죽음 = 0
console.log('\n🧍‍♀️ ① 상단바 캐릭터가 «글자 왼쪽»인가\n')
for (const 이름 of ['홈', '레시피', '한끼 일기', '장보기', '레꾸자랑']) {
  const btn = pg.getByRole('button', { name: new RegExp('^' + 이름.replace(' ', '\\s*')) }).last()
  if (!(await btn.count())) { console.log(`   ⚠️ ${이름} — 탭 단추를 못 찾았다`); continue }
  await btn.click(); await pg.waitForTimeout(800)
  const r = await pg.evaluate(캐릭터자리)
  if (r.오류) { console.log(`   ⚠️ ${이름} — ${r.오류}`); continue }
  if (r.없음) { console.log(`   ・ ${이름} — 상단바에 캐릭터 없음(제목 「${r.제목}」)`); continue }
  const ok = r.왼쪽인가
  if (!ok) 죽음++
  console.log(`   ${ok ? '✅' : '⛔'} ${r.제목.padEnd(6)} 그림 x=${r.그림x} · 제목 x=${r.제목x}  (${r.그림})`)
}

console.log('\n📖 ② 레시피 상세 「재료」 줄이 가로로 넘치나 (글자 버튼으로 늘어난 만큼)\n')
await pg.getByRole('button', { name: /^레시피/ }).last().click(); await pg.waitForTimeout(700)
const 카드 = pg.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first()
if (await 카드.count()) {
  await 카드.click(); await pg.waitForTimeout(1000)
  const r2 = await pg.evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /계량·손질/.test(x.textContent || ''))
    if (!b) return { 없음: true }
    const 줄 = b.closest('.sec-head') || b.parentElement
    const rr = 줄.getBoundingClientRect()
    return { 버튼: Math.round(b.getBoundingClientRect().width), 줄넘침: Math.round(줄.scrollWidth - 줄.clientWidth), 줄폭: Math.round(rr.width) }
  })()`)
  if (r2.없음) { console.log('   ⛔ 「계량·손질」 버튼을 못 찾았다'); 죽음++ }
  else {
    const ok = r2.줄넘침 <= 1
    if (!ok) 죽음++
    console.log(`   ${ok ? '✅' : '⛔'} 버튼 폭 ${r2.버튼}px · 그 줄 폭 ${r2.줄폭}px · 가로 넘침 ${r2.줄넘침}px`)
  }
  await pg.screenshot({ path: `${OUT}/재료줄.png`, clip: { x: 0, y: 0, width: 411, height: 500 } }).catch(() => {})
} else console.log('   ⚠️ 레시피 카드를 못 찾았다')

console.log('\n🍳 ③ 요리 시작 → 재료 준비 화면에 「계량·손질」 이 있고 눌리면 뜨나\n')
const 요리 = pg.getByRole('button', { name: /요리 시작|요리시작/ }).first()
if (await 요리.count()) {
  await 요리.click(); await pg.waitForTimeout(900)
  const 버튼 = pg.locator('.cook button', { hasText: '계량·손질' }).first()
  const 있나 = await 버튼.count()
  console.log(`   ${있나 ? '✅' : '⛔'} 재료 준비 화면에 「계량·손질」 버튼 ${있나 ? '있다' : '없다'}`)
  if (!있나) 죽음++
  else {
    await 버튼.click(); await pg.waitForTimeout(700)
    const 떴나 = await pg.locator('.sheet', { hasText: '요리 가이드' }).count()
    console.log(`   ${떴나 ? '✅' : '⛔'} 누르니 요리 가이드 시트가 ${떴나 ? '뜬다' : '안 뜬다'}`)
    if (!떴나) 죽음++
    await pg.screenshot({ path: `${OUT}/가이드.png` }).catch(() => {})
  }
} else { console.log('   ⚠️ 「요리 시작」 단추를 못 찾았다'); 죽음++ }

console.log(`\n💥 pageerror ${터짐.length}건`)
터짐.slice(0, 3).forEach((e) => console.log('   ', e))
console.log('')
if (죽음 || 터짐.length) { console.error(`⛔ ${죽음}칸 실패`); await b.close(); srv.close(); process.exit(1) }
console.log('✅ 캐릭터 전부 왼쪽 · 「계량·손질」 두 자리 다 작동 · 줄 안 넘침')
await b.close(); srv.close()
