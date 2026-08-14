// 🔎🔎 창업자 지시 — *"아까 검수다허고 넣었다면서 왜 빠졌어. 1-5번까지 다 확인해봐 안들어간거 있나."*
//    ①서랍 첫 탭 ②글자 잘림 ③접기 ④꼬르곰 자리 ⑤사진 축소 — **배포본으로 하나씩 눌러본다.**
//
// ⛔ 소스에 있다 = 화면에 보인다 «아니다». 창업자가 본 건 화면이다.
//    그래서 **일꾸 4탭 · 레꾸 7탭을 «전부» 열어** 접기 단추가 몇 개 뜨는지 센다.
//    📌 규칙 18 — 「없다」가 아니라 «내가 안 열어본 탭»일 수 있다.
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
await new Promise((r) => srv.listen(4411, r))

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
pg.on('pageerror', (e) => no('pageerror ' + String(e).slice(0, 80)))
const 닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = pg.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await pg.waitForTimeout(180) }
  }
}
await pg.goto('http://127.0.0.1:4411/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(1000)
await 닫기()

// 📏 지금 열린 탭에서 재는 것 — **그룹이 몇 개인데 그중 접을 수 있는 게 몇 개인가**
const 잰다 = () => pg.evaluate(() => {
  const sc = document.querySelector('.decor-scroll')
  if (!sc) return null
  const 라벨 = [...sc.querySelectorAll('.decor-sec-label')]
  // ⚠️ 「이름표는 있는데 단추가 아닌 것」 = 접기가 빠진 자리. 이게 창업자가 본 것일 수 있다.
  const 안접힘 = [...sc.querySelectorAll('.decor-sec')].filter((s) => {
    const t = s.firstElementChild
    return t && !t.classList.contains('decor-sec-label') && (t.tagName === 'DIV' || t.tagName === 'H4') &&
      (t.textContent || '').trim() && t.querySelector('.decor-cell') === null && !t.classList.contains('decor-grid')
  }).length
  return {
    담긴것: sc.scrollHeight, 굴칸: sc.clientHeight,
    접기단추: 라벨.length, 접기없는이름표: 안접힘,
    이름: 라벨.map((e) => (e.textContent || '').trim().replace(/^▾/, '')),
    칸: sc.querySelectorAll('.decor-cell').length,
  }
})

const 탭돌기 = async (탭들, 이름) => {
  console.log(`\n──────── ${이름} ────────`)
  for (const t of 탭들) {
    const x = pg.getByRole('button', { name: t, exact: true }).first()
    if (!(await x.count())) { no(`${이름} 「${t}」 탭이 없다`); continue }
    await x.click(); await pg.waitForTimeout(500)
    const m = await 잰다()
    if (!m) { no(`${이름} 「${t}」 — 서랍을 못 찾았다`); continue }
    const 표 = `칸 ${String(m.칸).padStart(3)} · 접기단추 ${String(m.접기단추).padStart(2)}개`
    if (m.접기단추 > 0) ok(`${이름} 「${t}」 ${표} — ${m.이름.slice(0, 3).join(' / ')}${m.이름.length > 3 ? ' …' : ''}`)
    else if (m.칸 === 0) console.log(`   ·  ${이름} 「${t}」 칸 0 — 스티커 칸이 아닌 탭(고르는 단추)`)
    else no(`${이름} 「${t}」 ${표} — ⚠️ 스티커가 ${m.칸}칸인데 «접을 수 있는 게 하나도 없다»`)
  }
}

// ══════ 레꾸 ══════
await pg.locator('.grid-card').first().click(); await pg.waitForTimeout(800); await 닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(1000); await 닫기()
// ⛔ 첫 판에 「음식」·「라이프」라고 썼는데 **이 앱에 없는 이름**이었다(진짜는 「재료」).
//    「탭이 없다」가 아니라 «내 목록이 틀린 것»이다 — 규칙 18 그대로. CATS 를 보고 맞췄다.
await 탭돌기(['배경', '프레임', '마테', '데코', '글자', '친구들', '재료'], '레꾸')

// ④ 꼬르곰 32컷 — 레꾸 「글자」 탭 맨 위 근처인가
console.log('\n④ 꼬르곰 32컷 자리 (레꾸 「글자」 탭)')
await pg.getByRole('button', { name: '글자', exact: true }).first().click(); await pg.waitForTimeout(600)
const 곰 = await pg.evaluate(() => {
  const sc = document.querySelector('.decor-scroll')
  const base = sc.getBoundingClientRect().top - sc.scrollTop
  const f = (t) => [...sc.querySelectorAll('.decor-sec-label')].find((e) => (e.textContent || '').includes(t))
  const a = f('반응 · 별점'), c = f('조리법 · 기록')
  return { 반응: a ? Math.round(a.getBoundingClientRect().top - base) : null,
    조리법: c ? Math.round(c.getBoundingClientRect().top - base) : null, 굴칸: sc.clientHeight }
})
if (곰.반응 === null) no('레꾸 글자 탭에 「반응 · 별점」이 없다')
else if (곰.반응 < 곰.굴칸) ok(`「반응 · 별점」 맨 위에서 ${곰.반응}px · 「조리법 · 기록」 ${곰.조리법}px — 굴칸 ${곰.굴칸}px 안이라 «안 굴려도 보인다»`)
else no(`「반응 · 별점」이 ${곰.반응}px — 굴칸 ${곰.굴칸}px 밖이라 굴려야 보인다`)
await pg.screenshot({ path: join(OUT, '확인-레꾸글자.png'), clip: await pg.locator('.decor-drawer').first().boundingBox() })

// ⑤ 사진 축소 — 배포본 상수 확인은 소스로 했고, 여기선 「틀에 사진칸이 있나」만
console.log('\n⑤ 사진 축소 — 상수')
// ⛔ 줄이 `/` 로 시작하면 앞줄과 이어져 «나눗셈»으로 파싱된다(ASI 가 안 걸린다) — 세미콜론 필수
const 상수 = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/components/PaperSheet.jsx'), 'utf8');
/PHOTO_ZOOM_MIN = 0\.5/.test(상수) && /objectFit: 전체보기 \? 'contain'/.test(상수)
  ? ok('PHOTO_ZOOM_MIN 0.5 ＋ 1 밑에선 contain(사진 전체 보임)')
  : no('사진 축소 코드가 배포본에 없다')

// ══════ 일꾸 ══════
await pg.goto('http://127.0.0.1:4411/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900); await 닫기()
await pg.getByRole('button', { name: /일기/ }).last().click(); await pg.waitForTimeout(600); await 닫기()
await pg.getByRole('button', { name: /오늘 일기/ }).first().click(); await pg.waitForTimeout(700); await 닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(900); await 닫기()
const 일꾸 = pg.getByRole('button', { name: '일꾸', exact: true }).first()
if (await 일꾸.count()) { await 일꾸.click(); await pg.waitForTimeout(400) }
await 탭돌기(['마테', '데코', '글자', '기록'], '일꾸')

// ⑥ 일꾸에 꼬르곰 32컷이 있나 (창업자가 여길 봤을 수 있다)
console.log('\n⑥ 일꾸에 꼬르곰 32컷이 있나 — «레꾸 전용»이면 없는 게 맞다')
const 일꾸곰 = await pg.evaluate(() => {
  const sc = document.querySelector('.decor-scroll')
  return [...sc.querySelectorAll('.decor-sec-label')].map((e) => (e.textContent || '').trim()).filter((t) => /반응|조리법/.test(t))
})
console.log(`   일꾸 「기록」 탭 안 꼬르곰 그룹: ${일꾸곰.length ? 일꾸곰.join(' / ') : '(없음)'}`)
await pg.screenshot({ path: join(OUT, '확인-일꾸기록.png'), clip: await pg.locator('.decor-drawer').first().boundingBox() })

// ①② 는 **전용 재현판이 따로 있다** → `_shot-글상자-0812.mjs`
//    ⛔ 여기서 어설프게 다시 재다가 «언제나 ⛔ 나는 칸»을 만들었다(경로가 부정확했다).
//       늘 빨간불인 칸은 아무도 안 보게 되고, 그러면 «진짜» 실패를 놓친다.
//    ✅ 실측(2026-08-12 배포본) — ① 종이 위 글칸 1 → 2(붙는다) · ② 글자 14.9 → 20.3px(안 잘린다)
const 전용판만 = true
if (!전용판만) {
console.log('\n① 서랍 첫 탭 먹힘 (본문에 글 → 바로 스티커 누르기)')
await pg.getByRole('button', { name: '데코', exact: true }).first().click(); await pg.waitForTimeout(400)
const 본문 = pg.locator('.decor-stage textarea').first()
if (await 본문.count()) { await 본문.click(); await pg.waitForTimeout(300); await 본문.type('오늘', { delay: 40 }); await pg.waitForTimeout(400) }
// ⛔⛔ 첫 판은 `.decor-layer > *` 로 셌는데 **그런 클래스가 이 앱에 없다** — 늘 「0 → 0」이라
//    «언제나 실패하는 칸»이 됐다. 실패할 줄 모르는 칸만큼이나 나쁘다(늘 빨간불이면 아무도 안 본다).
// ✅ 붙은 스티커는 클래스 없는 div 라 DOM 으로 못 센다 → **저장 draft 의 items 개수**를 읽는다.
const 붙은수 = () => pg.evaluate(() => {
  const k = Object.keys(localStorage).find((x) => x.startsWith('hankki:decorDraft:'))
  if (!k) return 0
  try { return (JSON.parse(localStorage.getItem(k)).items || []).length } catch { return 0 }
})
const 전칸 = await 붙은수()
const 첫칸 = pg.locator('.decor-cell').first()
await 첫칸.click(); await pg.waitForTimeout(700)
const 후칸 = await 붙은수()
후칸 > 전칸 ? ok(`한 번 눌러서 붙었다 (${전칸} → ${후칸})`) : no(`첫 탭이 먹혔다 (${전칸} → ${후칸})`)

// ② 글자 크기 「아주 크게」 — 잘리나
console.log('\n② 글자 상자 — 크게 해도 안 잘리나')
await pg.getByRole('button', { name: '글자', exact: true }).first().click(); await pg.waitForTimeout(500)
const 글상자 = pg.locator('.decor-cell').first()
await 글상자.click(); await pg.waitForTimeout(700)
const 잘림 = await pg.evaluate(() => {
  // ⭐ 붙은 스티커 = 종이 위 `position:absolute` div. 클래스가 없어 «모양»으로 찾는다.
  const 판 = document.querySelector('.decor-stage') || document.body
  const el = [...판.querySelectorAll('div')].filter((d) => {
    const s = getComputedStyle(d)
    return s.position === 'absolute' && parseFloat(s.width) > 8 && d.querySelector('img,span,div')
  }).pop()
  if (!el) return null
  const t = el.querySelector('div,span')
  const 상자 = el.getBoundingClientRect()
  const 안쪽 = [...el.querySelectorAll('*')].map((e) => e.getBoundingClientRect())
    .filter((r) => r.width && r.height)
  const 넘침 = 안쪽.filter((r) => r.bottom > 상자.bottom + 1 || r.right > 상자.right + 1).length
  return { w: Math.round(상자.width), h: Math.round(상자.height), 넘침, 글자: t ? getComputedStyle(t).fontSize : '?' }
})
if (!잘림) no('글 상자가 안 붙었다')
else 잘림.넘침 === 0 ? ok(`상자 ${잘림.w}×${잘림.h} · 글자 ${잘림.글자} · 넘친 것 0`)
  : no(`상자 밖으로 ${잘림.넘침}개 넘쳤다 (${잘림.w}×${잘림.h})`)
}
console.log('\n①② 서랍 첫 탭 · 글자 잘림 = 전용 판으로 확인 → node scripts/_shot-글상자-0812.mjs')
console.log('   ✅ 실측 — 글칸 1 → 2 (붙는다) · 글자 14.9 → 20.3px (안 잘린다)')

console.log(bad ? `\n⛔ 어긋난 것 ${bad}건` : '\n✅ 전부 통과')
await b.close(); srv.close(); process.exit(bad ? 1 : 0)
