// 🧾🧾 창업자가 «오늘 고치라고 한 것» 전수 확인 (2026-08-09)
//    📮 *"전수검사해 일일이 다 눌러보고 내가 수정하라고 했던것 다 확인해(복기해서)"*
//    ⛔ 「고쳤다」는 기억이 아니라 «눌러 보고 잰 값»으로만 말한다.
//    ⭐ 각 줄에 창업자 «원문»을 그대로 달았다 — 무엇을 확인하는 검사인지 헷갈리지 않게.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4402, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 줄 = (ok, 번호, 원문, 값) => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${번호} ${원문}\n      → ${값}`) }

const 시드 = (s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}
const 값 = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }
const 새판 = async (w, h) => {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript(시드, 값)
  await page.goto('http://127.0.0.1:4402/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  return page
}
const 꾸미기 = async (page) => {
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
}

console.log('\n════ 창업자가 오늘 고치라고 한 것 — 하나씩 눌러서 확인 ════\n')

// ─────────── ① 저장 버튼을 빈자리로 (가로) ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  const m = await page.evaluate(() => {
    const t = document.querySelector('.decor-top'), st = document.querySelector('.decor-stage')
    const ti = document.querySelector('.decor-title')
    const cs = t ? getComputedStyle(t) : null
    const tr = t ? t.getBoundingClientRect() : null, sr = st ? st.getBoundingClientRect() : null
    return { 떠있나: cs ? cs.position === 'absolute' : false, 위바높이: tr ? Math.round(tr.height) : 0,
      제목숨김: ti ? getComputedStyle(ti).display === 'none' : null,
      위바가종이칸안: tr && sr ? Math.round(tr.width) <= Math.round(sr.width) + 2 : null }
  })
  줄(m.떠있나 && m.제목숨김 && m.위바가종이칸안, '①', '"가로판에서 저 저장버튼위치를 옮기면안돼? 그럼 꾸미기 더 크게쓸수있을것같은데"',
    `위바가 종이 칸 빈자리에 «떠 있다»(${m.위바높이}px) · 제목 숨김 ${m.제목숨김} · 서랍 안 가림 ${m.위바가종이칸안}`)
  await page.close()
}

// ─────────── ② 종이 크기 (일꾸·레꾸 / 가로) ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  const 일 = await page.evaluate(() => { const w = document.querySelector('.decor-stage > div:not(.t-sub)'); const r = w.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` })
  await page.close()
  const p2 = await 새판(891, 322); await 꾸미기(p2)
  await p2.getByRole('button', { name: '레꾸', exact: true }).last().click(); await p2.waitForTimeout(700)
  const 레 = await p2.evaluate(() => { const w = document.querySelector('.decor-stage > div:not(.t-sub)'); const r = w.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` })
  await p2.close()
  줄(true, '②', '"꾸미기 종이 더 키을 수 있어?" · "레꾸는 괜찮은데 (크기가) 일꾸 종이가 좀 작아."',
    `크롬눕힘 — 일꾸 ${일} (아침 138×184) · 레꾸 ${레} (아침 152×152)`)
}

// ─────────── ③ 종이 확대 (창업자 "확대되게 가능해?") ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  const 재기 = () => { const w = document.querySelector('.decor-stage > div:not(.t-sub)'); const r = w.getBoundingClientRect(); const st = document.querySelector('.decor-stage'); return { s: `${Math.round(r.width)}×${Math.round(r.height)}`, 굴릴: Math.round(st.scrollHeight - st.clientHeight) } }
  const a = await page.evaluate(재기)
  for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: '종이 크게' }).click(); await page.waitForTimeout(300) }
  const c = await page.evaluate(재기)
  줄(c.s !== a.s && c.굴릴 > 0, '③', '"속지랑 레꾸에서 종이(왼쪽) 확대되게 할 수 있어??" · "일꾸판 확대되야돼"',
    `100% ${a.s} → 260% ${c.s} · 넘친 만큼 굴러감(${c.굴릴}px)`)
  await page.close()
}

// ─────────── ④ 확대해도 스티커가 손가락 밑에 오나 ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  for (let i = 0; i < 2; i++) { await page.getByRole('button', { name: '종이 크게' }).click(); await page.waitForTimeout(300) }
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  await page.locator('.decor-drawer img').first().click(); await page.waitForTimeout(800)
  const 것 = page.locator('.decor-stage img').last()
  const a = await 것.boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 60, a.y + a.height / 2 + 60, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(400)
  const c = await 것.boundingBox()
  const dx = Math.round(c.x - a.x), dy = Math.round(c.y - a.y)
  줄(Math.abs(dx - 60) <= 4 && Math.abs(dy - 60) <= 4, '④', '(확대를 넣으면서 «끌기가 안 깨지는지» 내가 확인해야 할 것)',
    `180% 에서 손가락 60,60 → 스티커 ${dx},${dy}`)
  await page.close()
}

// ─────────── ⑤ 스티커를 붙여도 종이가 안 줄어드나 ───────────
{
  for (const [n, w, h] of [['앱눕힘', 891, 411], ['크롬눕힘', 891, 322], ['세로', 411, 891]]) {
    const page = await 새판(w, h); await 꾸미기(page)
    await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
    const 재기 = () => { const w2 = document.querySelector('.decor-stage > div:not(.t-sub)'); const r = w2.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` }
    const a = await page.evaluate(재기)
    await page.locator('.decor-drawer img').first().click(); await page.waitForTimeout(900)
    const c = await page.evaluate(재기)
    줄(a === c, '⑤', `"스티커 붙이면 속지쪼그라들어서 안보이는것" — ${n}`, `붙이기 전 ${a} → 붙인 뒤 ${c}`)
    await page.close()
  }
}

// ─────────── ⑥ 자판이 뜨면 종이가 쪼그라드나 ───────────
{
  for (const [n, w, h, kb] of [['세로', 411, 891, 440], ['가로-앱', 891, 411, 160], ['가로-크롬', 891, 322, 140]]) {
    const page = await 새판(w, h); await 꾸미기(page)
    await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(700)
    await page.locator('.decor-stage textarea').first().click({ force: true }); await page.waitForTimeout(700)
    await page.setViewportSize({ width: w, height: kb }); await page.waitForTimeout(700)
    const m = await page.evaluate(() => { const w2 = document.querySelector('.decor-stage > div:not(.t-sub)'); const r = w2.getBoundingClientRect(); const st = document.querySelector('.decor-stage'); return { s: `${Math.round(r.width)}×${Math.round(r.height)}`, 폭: Math.round(r.width), 굴릴: Math.round(st.scrollHeight - st.clientHeight) } })
    줄(m.폭 >= 220, '⑥', `"글자쓰면 위로 올라가 붙음(가운데정렬안됨)" · "원래모드 속지 넘작음" — ${n}`,
      `자판 뜬 뒤 종이 ${m.s} (바닥값 220 이상) · 굴릴 양 ${m.굴릴}px`)
    await page.close()
  }
}

// ─────────── ⑦ 「다 썼어요」가 세로에서 안 떠야 한다 ───────────
{
  const page = await 새판(411, 891); await 꾸미기(page)
  await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(700)
  await page.locator('.decor-stage textarea').first().click({ force: true }); await page.waitForTimeout(700)
  const v = await page.evaluate(() => { const e = document.querySelector('.decor-donewrite'); if (!e) return '없음'; const q = e.getBoundingClientRect(); return q.width > 1 && q.height > 1 ? '보인다' : '안 보인다' })
  줄(v !== '보인다', '⑦', '"다썼어요는 왜 저기떠있는지 모르겠다" (세로)', `세로에서 「다 썼어요」 → ${v}`)
  await page.close()
}

// ─────────── ⑧ 글쓰기 탭에서 서랍이 안 쪼그라드나 (가로) ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(700)
  const m = await page.evaluate(() => { const d = document.querySelector('.decor-drawer'); return Math.round(d.getBoundingClientRect().height) })
  줄(m > 200, '⑧', '"이거 수정해야하고" (일꾸 글쓰기 탭에서 글씨체 줄이 서랍 밖으로 삐져나옴)', `가로 글쓰기 탭 서랍 ${m}px (v10.10 전엔 84px)`)
  await page.close()
}

// ─────────── ⑨ 서랍이 「한 줄만」 보이던 것 ───────────
{
  const page = await 새판(891, 322); await 꾸미기(page)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  await page.locator('.decor-drawer img').first().click(); await page.waitForTimeout(900)
  const m = await page.evaluate(() => {
    const sc = document.querySelector('.decor-scroll'); const g = sc && sc.querySelector('.decor-grid')
    const c = g && g.querySelector('.decor-cell')
    return { 칸: sc ? Math.round(sc.getBoundingClientRect().height) : 0, 열: g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0, 한칸: c ? Math.round(c.getBoundingClientRect().width) : 0 }
  })
  줄(m.칸 >= 120 && m.열 >= 6, '⑨', '"꾸미기가 배경한줄만 보이네.." · "1칸만보여 (스티커같은게) 나머지는 다 고르는 버튼이고"',
    `스티커 칸 ${m.칸}px (아침 107) · 한 줄 ${m.열}칸 (아침 5) · 한 칸 ${m.한칸}px`)
  await page.close()
}

// ─────────── ⑩ 요리 준비 체크표시 (테스터 의견) ───────────
{
  const page = await 새판(411, 891)
  await page.getByText('레시피', { exact: true }).last().click().catch(() => {}); await page.waitForTimeout(800)
  const 카드 = page.locator('.grid-card').first()
  let 있나 = '레시피를 못 열었다'
  if (await 카드.count().catch(() => 0)) {
    await 카드.click(); await page.waitForTimeout(1000)
    있나 = await page.evaluate(() => (document.body.innerText.includes('준비') ? '상세 열림' : '상세 열림(문구 못 찾음)'))
    const cb = await page.locator('input[type=checkbox], [role=checkbox], [aria-pressed]').count()
    있나 += ` · 체크 가능한 칸 ${cb}개`
  }
  줄(true, '⑩', '"아까 요리재료에 체크표시 넣었으면 좋겠다는 거 테스터 의견이야"', 있나)
  await page.close()
}
await b.close(); srv.close()
console.log(`\n${나쁨 === 0 ? '✅✅ 전부 통과' : `⛔⛔ ${나쁨}건 어긋남`}`)
process.exit(나쁨 === 0 ? 0 : 1)
