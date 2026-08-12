// 🔬 샘플 일기 — 「놓이고 · 샘플이라 적히고 · 지우면 다시 안 생긴다」 (2026-08-12)
//
// 📮 창업자 *"샘플레시피는 지울 수 있게도 해줘 자기 일기가 아니니까 지워도 되게(샘플이라고 적어주고)"*
//    ＋ *"네가 넣을래? 위치랑 꼬르곰 잘 선택해서 넣어봐."* · *"꼬르곰 움직이게 해야해"*
//
// ⛔ `page.reload()` 금지(옛 함정 사전) — 다시 켜는 것은 **새 탭**으로 흉내낸다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4393, r))

let 통과 = 0, 실패 = 0
const ok = (m) => { 통과 += 1; console.log('  ✅', m) }
const bad = (m) => { 실패 += 1; console.log('  ⛔', m) }

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 새폰 = async (dsf = 2) => {
  const ctx = await br.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: dsf, timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript(() => {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:giftSheetSeen', '1')
    for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
      localStorage.setItem(`hankki:coach:${k}`, '1')
  })
  return ctx
}
const 시트닫기 = async (pg) => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(200) }
  }
}
const 일기열기 = async (pg) => {
  await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 시트닫기(pg)
}
const 샘플수 = (pg) => pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.diary || []).filter((d) => d.sample).length
})

console.log('\n① 처음 켠 사람 — 샘플이 한 장 놓여 있나')
const c1 = await 새폰(3)
const p1 = await c1.newPage()
p1.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 110)))
await p1.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
await 일기열기(p1)
const n1 = await 샘플수(p1)
n1 === 1 ? ok('샘플 한 장이 놓였다') : bad(`샘플이 ${n1}장 (1이라야 한다)`)

// 어제 칸을 눌러 샘플을 연다 — 달력에서 「전날」
// ⛔ 첫 판은 폴백으로 「모아보기」를 눌러 **레시피 목록**으로 갔다(스샷을 열어보고 잡았다 · 규칙 21).
//   ✅ 「한끼 일기」 칸으로 들어간 «뒤» 달력의 어제 칸을 누른다. 못 찾으면 «폴백 없이» 실패시킨다 —
//      엉뚱한 화면을 보고 ⛔ 를 내면 원인이 딴 데로 간다.
const 어제열기 = async (pg) => {
  const 일기칸 = pg.getByRole('button', { name: '한끼 일기', exact: true }).first()
  if (await 일기칸.count()) { await 일기칸.click(); await pg.waitForTimeout(700) }
  const 어제 = new Date(); 어제.setDate(어제.getDate() - 1)
  const 칸 = pg.getByRole('button', { name: new RegExp(`${어제.getDate()}일`) }).first()
  if (await 칸.count()) { await 칸.click(); await pg.waitForTimeout(900); return true }
  return false
}
if (!(await 어제열기(p1))) bad('샘플 일기를 여는 길을 못 찾았다')
else {
  await 시트닫기(p1)
  const 글 = await p1.evaluate(() => document.body.innerText)
  글.includes('샘플') ? ok('화면에 「샘플」이라고 적혀 있다') : bad('「샘플」 표시가 없다')
  // 🐻 꼬르곰이 «움직이나» — 모션 클래스가 실제로 붙었나 (창업자 *"꼬르곰 움직이게 해야해"*)
  const 움직 = await p1.evaluate(() => {
    const box = document.querySelector('.paper-box') || document.body
    return [...box.querySelectorAll('[class*="hk-m-"]')].length
  })
  움직 > 0 ? ok(`움직이는 것 ${움직}개 (꼬르곰 통통·글자 갸웃)`) : bad('모션이 하나도 안 붙었다')
  await p1.screenshot({ path: `${OUT}/sample-live.png` })
}

console.log('\n② 지우면 — 다시 안 생기나')
const 지우기 = p1.getByRole('button', { name: '일기 삭제' }).first()
if (!(await 지우기.count())) bad('삭제 단추를 못 찾았다')
else {
  await 지우기.click(); await p1.waitForTimeout(700)
  const n2 = await 샘플수(p1)
  n2 === 0 ? ok('지워졌다') : bad(`지웠는데 ${n2}장 남았다`)
  const 표식 = await p1.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').sampleGone === true)
  표식 ? ok('「지웠음」 표식이 남았다') : bad('표식이 없다 — 다시 켜면 또 생긴다')
  // ⭐ 다시 켜기 = **새 탭**(reload 는 시드가 저장값을 덮어 거짓 결과를 낸다)
  const p2 = await c1.newPage()
  await p2.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
  await p2.waitForTimeout(600)
  const n3 = await 샘플수(p2)
  n3 === 0 ? ok('앱을 다시 켜도 안 돌아온다') : bad(`다시 켜니 ${n3}장 생겼다 — 창업자가 「지웠는데 또 뜬다」를 겪는다`)
}

console.log('\n③ 이미 일기를 쓰던 사람 — 남의 일기가 끼어들지 않나')
const c2 = await 새폰()
const q0 = await c2.newPage()
await q0.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
await q0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const d = new Date(); d.setHours(12, 0, 0, 0)
  s.diary = [{ id: 'mine', kind: 'diary', at: d.getTime(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '내 일기', decor: [] }]
  s.sampleGone = false
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await q0.close()
const q1 = await c2.newPage()
await q1.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
await q1.waitForTimeout(600)
const n4 = await 샘플수(q1)
n4 === 0 ? ok('이미 쓰던 사람에겐 안 넣는다') : bad(`남의 일기가 ${n4}장 끼어들었다`)

console.log(`\n📊 ${통과} ✅ / ${실패} ⛔`)
await br.close(); srv.close(); process.exit(실패 ? 1 : 0)
