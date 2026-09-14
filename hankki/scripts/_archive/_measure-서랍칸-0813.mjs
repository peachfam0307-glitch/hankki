// 📏 서랍 「스티커 보이는 칸」이 왜 작아졌나 — 실측
//    📮 창업자 2026-08-13 *"갑자기 스티커보이는칸이 작아졌어 위에 속지 글쓰기탭이 커진것같기도하고"*
//    ⭐ 재는 것 = 서랍 안 «고정 줄» 하나하나 ＋ 굴러가는 칸 ＋ **온전히 보이는 스티커 칸 개수**
//    ⛔ 「몇 줄」이 아니라 «보이는 칸 개수»를 센다 (2026-08-09 작은폰 사고 — 계산은 2.37줄이었는데 실제론 한 줄)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST = join('/home/user/hankki/hankki', 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4419, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// 📱 창업자 폰 캡처는 923×2049 «물리 픽셀»이라 CSS 뷰포트를 모른다 → 짐작 말고 둘 다 잰다(규칙 15)
const 판들 = [{ 이름: '411×891', w: 411, h: 891 }, { 이름: '360×800', w: 360, h: 800 }]

const 잰다 = `(() => {
  const R = (el) => el ? Math.round(el.getBoundingClientRect().height) : 0
  const dr = document.querySelector('.decor-drawer')
  if (!dr) return { 오류: '서랍 없음' }
  const box = dr.getBoundingClientRect()
  const 줄 = []
  for (const ch of dr.children) {
    const r = ch.getBoundingClientRect()
    if (r.height < 1) continue
    const cls = ch.className && ch.className.baseVal === undefined ? String(ch.className) : ''
    let 이름 = cls.split(' ')[0] || ch.tagName.toLowerCase()
    if (cls.includes('decor-grab')) 이름 = '손잡이'
    else if (cls.includes('segment')) 이름 = '탭줄(속지·글쓰기·일꾸·레꾸)'
    else if (cls.includes('decor-cats')) 이름 = '갈래칩줄'
    else if (cls.includes('decor-scroll') || ch === dr.lastElementChild) 이름 = '굴칸'
    else if (ch.textContent && ch.textContent.startsWith('글씨')) 이름 = '⚠️글씨줄'
    else if (ch.textContent && ch.textContent.startsWith('크기')) 이름 = '⚠️크기줄'
    줄.push({ 이름, h: R(ch) })
  }
  // 굴러가는 칸 = 서랍에서 스크롤되는 놈
  let 굴 = null
  for (const ch of dr.querySelectorAll('*')) {
    if (ch.scrollHeight > ch.clientHeight + 8 && ch.clientHeight > 40 && getComputedStyle(ch).overflowY !== 'visible') { 굴 = ch; break }
  }
  const 굴박 = 굴 ? 굴.getBoundingClientRect() : null
  // 온전히 보이는 스티커 칸 = .decor-cell 중 굴칸 안에 «통째로» 들어온 것
  let 온전 = 0, 전체 = 0
  for (const c of dr.querySelectorAll('.decor-cell')) {
    전체++
    const r = c.getBoundingClientRect()
    const 위 = 굴박 ? 굴박.top : box.top, 아래 = 굴박 ? 굴박.bottom : box.bottom
    if (r.top >= 위 - 0.5 && r.bottom <= 아래 + 0.5) 온전++
  }
  return {
    서랍: Math.round(box.height),
    고정줄: 줄.filter(x => x.이름 !== '굴칸'),
    굴칸: 굴박 ? Math.round(굴박.height) : 0,
    첫칸까지: (() => { const c = dr.querySelector('.decor-cell'); return c ? Math.round(c.getBoundingClientRect().top - box.top) : -1 })(),
    온전히보이는칸: 온전, 그린칸: 전체,
    글씨줄있나: !!줄.find(x => x.이름 === '⚠️글씨줄'),
    크기줄있나: !!줄.find(x => x.이름 === '⚠️크기줄'),
  }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 판 of 판들) {
  const ctx = await b.newContext({ viewport: { width: 판.w, height: 판.h }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:giftSheetSeen', '1') })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const pg = await ctx.newPage()
  const 닫기 = async () => { for (const t of ['나중에', '닫기']) { const x = pg.getByRole('button', { name: t }).first(); if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => { }); await pg.waitForTimeout(180) } } }
  await pg.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900); await 닫기()
  await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 닫기()
  await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 닫기()
  await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(900); await 닫기()

  const 레꾸 = pg.getByRole('button', { name: '레꾸', exact: true }).first()
  if (await 레꾸.count()) { await 레꾸.click(); await pg.waitForTimeout(400) }
  const 글자칩 = pg.locator('.decor-cats').getByRole('button', { name: '글자', exact: true }).first()
  if (await 글자칩.count()) { await 글자칩.click(); await pg.waitForTimeout(400) }

  console.log(`\n━━━━━ ${판.이름} ━━━━━`)
  console.log('Ⓐ 레꾸 탭 · 커서 없음 :', JSON.stringify(await pg.evaluate(잰다), null, 1))
  await pg.screenshot({ path: join(OUT, `서랍칸-${판.이름}-A.png`) })

  // Ⓑ 창업자 화면 = 종이 본문에 커서가 들어간 상태 (자판이 내려가도 커서가 남는다 = 폰 뒤로가기)
  const 글칸 = pg.locator('.decor-stage textarea').first()
  if (await 글칸.count()) { await 글칸.click({ force: true }).catch(() => { }); await pg.waitForTimeout(500) }
  console.log('Ⓑ 본문 커서 있음      :', JSON.stringify(await pg.evaluate(잰다), null, 1))
  await pg.screenshot({ path: join(OUT, `서랍칸-${판.이름}-B.png`) })

  // Ⓒ 고침 확인 — 서랍을 «누르고 나면» 본문 커서가 풀려 97px 이 돌아와야 한다
  const 데코칩 = pg.locator('.decor-cats').getByRole('button', { name: '데코', exact: true }).first()
  if (await 데코칩.count()) { await 데코칩.click(); await pg.waitForTimeout(400) }
  console.log('Ⓒ 서랍 한 번 누른 뒤  :', JSON.stringify(await pg.evaluate(잰다), null, 1))
  await pg.screenshot({ path: join(OUT, `서랍칸-${판.이름}-C.png`) })

  // Ⓔ 「고르는 줄」 접기 — 탭줄·글씨·크기가 사라지고 갈래칩 줄만 남아야 한다
  const 접기 = pg.locator('.decor-pickfold').first()
  if (await 접기.count()) { await 접기.click(); await pg.waitForTimeout(400) } else console.log('  ⛔ 접기 단추를 못 찾았다')
  console.log('Ⓔ 고르는 줄 접은 뒤   :', JSON.stringify(await pg.evaluate(잰다), null, 1))
  await pg.screenshot({ path: join(OUT, `서랍칸-${판.이름}-E.png`) })
  // Ⓕ 다시 펴진다 — ⛔접었다 못 펴면 막다른 길이다. 반드시 «접기 바로 다음»에 잰다
  await 접기.click(); await pg.waitForTimeout(400)
  const f = await pg.evaluate(잰다)
  console.log('Ⓕ 다시 편 뒤          :', JSON.stringify({ 굴칸: f.굴칸, 탭줄있나: !!f.고정줄.find(x => x.이름.startsWith('탭줄')) }))
  // Ⓔ-2 접힌 채로 본문에 커서가 들어가도 두 줄이 안 뜬다
  await 접기.click(); await pg.waitForTimeout(300)
  const 글칸E = pg.locator('.decor-stage textarea').first()
  if (await 글칸E.count()) { await 글칸E.click({ force: true }).catch(() => { }); await pg.waitForTimeout(400) }
  const e2 = await pg.evaluate(잰다)
  console.log('Ⓔ-2 접힌 채 커서 들어감:', JSON.stringify({ 굴칸: e2.굴칸, 글씨줄있나: e2.글씨줄있나, 크기줄있나: e2.크기줄있나 }))
  await 접기.click(); await pg.waitForTimeout(300)  // 다음 칸을 위해 펴 둔다

  // Ⓓ 글 상자를 붙이면 «그 상자» 커서는 살아 있어야 한다 (본문만 놓는지 확인)
  const 글자칩2 = pg.locator('.decor-cats').getByRole('button', { name: '글자', exact: true }).first()
  if (await 글자칩2.count()) { await 글자칩2.click(); await pg.waitForTimeout(300) }
  const 글칸2 = pg.locator('.decor-stage textarea').first()
  if (await 글칸2.count()) { await 글칸2.click({ force: true }).catch(() => { }); await pg.waitForTimeout(400) }
  // ⛔ 「글자 직접 쓰기」는 «접기 이름표»다 — 이걸 누르면 블록이 접힐 뿐 글 상자가 안 붙는다(첫 판이 그랬다)
  const 글자넣기 = pg.getByRole('button', { name: '글자 넣기', exact: true }).first()
  if (await 글자넣기.count()) { await 글자넣기.scrollIntoViewIfNeeded().catch(() => { }); await 글자넣기.click().catch(() => { }); await pg.waitForTimeout(600) }
  else console.log('  ⛔ 「글자 넣기」 단추를 못 찾았다 — 판이 틀린 것이다(규칙 18)')
  console.log('Ⓓ 글 상자 붙인 뒤 커서:', await pg.evaluate(() => {
    const el = document.activeElement
    return el && el.tagName === 'TEXTAREA' ? (el.dataset.paperBody ? '⛔본문(틀렸다)' : '✅글 상자') : '⛔커서 없음'
  }))
  await ctx.close()
}
await b.close(); srv.close(); process.exit(0)
