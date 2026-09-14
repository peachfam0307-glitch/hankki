// 🔙 꾸미기에서 뒤로가기 — «닫히나»
//    📮 창업자 2026-08-12 밤 *"뒤로가기 안됨(꾸미기 닫힘안돼) 저장하고 나가기 그거 선택하는거 눌림.. 급짜증난다ㅠ"*
//    ⛔ 짐작 금지 — ⒜시트가 뜨는 것 자체가 문제인지 ⒝시트에서 골라도 안 닫히는지 ⒞뒤로가기가 두 번 안 먹는지
//       셋은 처방이 다르다. 하나씩 눌러 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4413, r))

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
pg.on('pageerror', (e) => no('pageerror ' + String(e).slice(0, 90)))
const 닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = pg.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await pg.waitForTimeout(180) }
  }
}
const 판열림 = () => pg.evaluate(() => !!document.querySelector('.decor-editor'))
// ⛔ 첫 판은 «화면 전체 글자»를 잡아 늘 「떴다」가 나왔다 — 무엇을 보는지가 틀렸다(규칙 18).
//    ✅ 시트의 «제목 글자»가 그대로 있는 노드만 본다.
const 시트글 = () => pg.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => (d.textContent || '').trim() === '저장하지 않고 나갈까요?')
  return el ? '저장하지 않고 나갈까요?' : null
})

const 판열기 = async (어디) => {
  await pg.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900); await 닫기()
  if (어디 === '일기') {
    await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 닫기()
    await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 닫기()
  } else {
    await pg.locator('.grid-card').first().click(); await pg.waitForTimeout(800); await 닫기()
  }
  await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(900); await 닫기()
}
// 뭔가 하나 붙여서 «저장 안 한 변경»을 만든다 — 그래야 확인 시트가 뜬다
// ⛔ 첫 판은 그냥 `.decor-cell` 첫 칸을 눌렀는데 **레시피 꾸미기 첫 탭이 「배경」이라 칸이 0개**다.
//    그래서 아무것도 안 붙었고 → 시트가 안 떴고 → 뒤 항목이 통째로 헛돌았다(규칙 18).
const 붙이기 = async () => {
  // ⚠️ 일기 꾸미기는 첫 화면이 「속지」다 — 「일꾸」를 먼저 눌러야 스티커 칸이 나온다.
  const 일꾸 = pg.getByRole('button', { name: '일꾸', exact: true }).first()
  if (await 일꾸.count() && await 일꾸.isVisible().catch(() => false)) { await 일꾸.click(); await pg.waitForTimeout(400) }
  const t = pg.getByRole('button', { name: '데코', exact: true }).first()
  if (await t.count()) { await t.click(); await pg.waitForTimeout(500) }
  const c = pg.locator('.decor-cell').first()
  if (!(await c.count())) { no('붙일 칸을 못 찾았다'); return }
  await c.click(); await pg.waitForTimeout(700)
}

for (const 어디 of ['레시피', '일기']) {
  console.log(`\n════ ${어디} 꾸미기 ════`)
  await 판열기(어디)
  if (!(await 판열림())) { no(`${어디} — 꾸미기 판이 안 열렸다`); continue }

  console.log('\n① 아무것도 «안» 바꾸고 뒤로가기 — 바로 닫혀야 한다')
  await pg.goBack(); await pg.waitForTimeout(700)
  const 시트1 = await 시트글()
  if (await 판열림()) 시트1 ? no(`안 바꿨는데 확인 시트가 떴다 — "${시트1}"`) : no('안 바꿨는데 안 닫힌다')
  else ok('바로 닫힌다')

  console.log('\n② ⭐ 스티커 붙이고 뒤로가기 — «묻지 말고 저장하고» 닫혀야 한다')
  await 판열기(어디); await 붙이기()
  await pg.goBack(); await pg.waitForTimeout(900)
  const 시트2 = await 시트글(), 판2 = await 판열림()
  if (시트2) no('확인 시트가 떴다 — 뒤로가기는 묻지 않기로 했다')
  else if (판2) no('⭐ 뒤로가기가 «먹통» — 판이 안 닫힌다 (창업자가 겪은 자리)')
  else ok('한 번에 닫혔다')

  console.log('\n③ ⭐⭐ 꾸민 게 «저장»됐나 (날아가면 안 된다)')
  const 남음 = await pg.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const all = [...(s.recipes || []), ...(s.diary || [])]
      return all.some((r) => (r.decor || []).length > 0)
    } catch { return false }
  })
  남음 ? ok('꾸민 게 저장돼 있다') : no('⛔ 꾸민 게 사라졌다')

  console.log('\n④ 「취소」 단추는 그대로 «물어야» 한다 (버리고 나가기니까)')
  await 판열기(어디); await 붙이기()
  const 취소 = pg.getByRole('button', { name: '취소', exact: true }).first()
  if (await 취소.count()) {
    await 취소.click(); await pg.waitForTimeout(600)
    await 시트글() ? ok('취소 → 확인 시트가 뜬다') : no('취소인데 안 묻는다')
    const 나가기 = pg.getByRole('button', { name: /저장 안 하고 나가기/ }).first()
    if (await 나가기.count()) {
      await 나가기.click(); await pg.waitForTimeout(800)
      await 판열림() ? no('「저장 안 하고 나가기」인데 안 닫힌다') : ok('「저장 안 하고 나가기」로 닫힌다')
    } else no('나가기 단추를 못 찾았다')
  } else no('「취소」 단추를 못 찾았다')
  await pg.screenshot({ path: join(OUT, `뒤로가기-${어디}.png`) })
}

console.log(bad ? `\n⛔ 어긋난 것 ${bad}건` : '\n✅ 전부 통과')
await b.close(); srv.close(); process.exit(bad ? 1 : 0)
