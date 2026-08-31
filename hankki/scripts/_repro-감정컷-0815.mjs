// 🐻😢 꼬르곰·펭펭 «감정» 36컷 — 일꾸에 «뜨고» 레꾸에 «안 뜨는지» 실제 화면으로 (2026-08-15)
//
//   📮 창업자 *"일꾸에 넣자. 레꾸에는 이미 많지 않아?"* → *"레시피에 들어갈 컷은 아닌 것 같아"*
//
//   ⛔ 검수 절대원칙 ⑤ = **실제 앱 렌더.** 파일이 멀쩡하고 빌드가 통과해도
//      서랍에 안 뜨거나 엉뚱한 칸에 뜰 수 있다.
//   ⭐⭐ 이 검사의 «심장» = **레꾸에서 0개인 것**이다.
//      「일꾸에 떴나」만 보면 `only: 'diary'` 가 통째로 빠져도 초록불이 된다(그럼 레꾸에도 다 뜬다).
//      📌 규칙 18 ⓘ — 「있으면 안 되는 것이 없나」를 봐야 한다.
//
//   ⛔ 라벨을 여기 베껴 적지 않는다 — 창업자가 이름을 바꾸면 검사가 죽는다.
//      `Stickers.jsx` 에서 `ge_` 그룹의 키를 «읽어서» 쓴다.
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
await new Promise((r) => srv.listen(4361, r))

// ── 코드에서 ge_ 컷 키를 읽는다(손으로 적지 않는다) ──
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const GE = [...SRC.matchAll(/\{ key: '(ge_[a-z]+)'[^}]*items: \[([^\]]*)\]/g)]
  .map((m) => ({ key: m[1], items: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) }))
const ALL = GE.flatMap((g) => g.items)

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }
console.log(`🐻😢 곰펭 감정 컷 — 코드에서 ${GE.length}그룹 ${ALL.length}컷 읽음`)
if (ALL.length < 30) no(`컷이 ${ALL.length}개밖에 안 읽혔다 — 이 검사를 고칠 것`)

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [{ id: 'r1', title: '테스트 레시피', at: now, ingredients: ['소금 조금'], steps: ['끓인다'], cover: {} }],
  diary: [{ id: 'dd', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }],
  seedV: BASICS_VERSION,
}

// ⛔⛔ 경로를 «박지 말 것» — `/opt/pw-browsers/chromium` 은 이 컨테이너에만 있고 **CI 러너엔 없다.**
//   2026-08-15 에 이걸 하드코딩해서 배포가 죽었다(run #1416).
//   ⭐ 체인의 다른 재현판처럼 플레이라이트가 «알아서 찾게» 둔다(smoke.mjs 와 같은 꼴).
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
// ⛔ 코치마크가 클릭을 «가로챈다» — 2026-08-11 에도 같은 자리에서 헛돌았다(규칙 19).
//   ⚠️ 키를 손으로 적지 않는다 — 코치가 늘면 그 목록이 조용히 낡고 검사가 다시 죽는다.
//      `src/coach.js` 의 `SEED_COACH_SEEN`(접두어로 막는 조각)을 그대로 쓴다.
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
}, state)
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 서랍에 실제로 그려진 ge_ 컷 세기
const 세기 = async () => page.evaluate((keys) => {
  const imgs = [...document.querySelectorAll('img')]
  const found = new Set(); const broken = []
  for (const k of keys) for (const i of imgs) {
    const src = i.currentSrc || i.src || ''
    if (src.includes(`/${k}.`) || src.includes(`${k}-`)) {
      found.add(k)
      if (i.complete && i.naturalWidth === 0) broken.push(k)
    }
  }
  return { found: [...found], broken }
}, ALL)

// ── ① 📔 일꾸 — 「친구들」 탭에 떠야 한다 ──
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '일꾸', exact: true }).first().click(); await page.waitForTimeout(500)
const 친구들탭 = page.getByRole('button', { name: '친구들', exact: true }).first()
if (!(await 친구들탭.count())) no('일꾸에 「친구들」 탭이 아예 없다 — tab: buddies 가 안 먹었다')
else {
  await 친구들탭.click(); await page.waitForTimeout(900)
  // 서랍을 끝까지 굴려서 다 그리게 한다(늦게 그리는 것 때문에 «없다»고 오판하지 않게)
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(160) }
  const r = await 세기()
  await page.screenshot({ path: join(OUT, '감정컷-1-일꾸서랍.png') })
  if (r.found.length >= ALL.length * 0.8) ok(`일꾸 「친구들」 탭에 ${r.found.length}/${ALL.length}컷 떴다`)
  else no(`일꾸에 ${r.found.length}/${ALL.length}컷밖에 안 떴다 — ${ALL.filter((k) => !r.found.includes(k)).slice(0, 8).join(' ')}`)
  if (!r.broken.length) ok('깨진 그림 0')
  else no(`깨진 그림 ${r.broken.length}개 — ${r.broken.join(' ')}`)
}

// ── ② 🍳 레꾸 — «하나도» 뜨면 안 된다 (이게 이 검사의 심장) ──
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
// ⛔ 내가 심은 레시피를 «이름으로» 찾지 않는다 — store 가 형식이 모자란 값을 시드로 덮어써서
//    그 이름이 사라진다(CLAUDE.md 에 박힌 함정). **목록에 실제로 있는 첫 레시피**를 연다.
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
// ⚠️ 선택자를 짐작하지 말 것 — 실제 DOM 을 찍어보고 `grid-card` 인 걸 확인했다(2026-08-15).
const 카드 = page.locator('.grid-card').first()
if (!(await 카드.count())) { no('레시피 목록에 카드가 하나도 없다 — 이 검사를 고칠 것') }
else { await 카드.click(); await page.waitForTimeout(1000) }
const 꾸미기 = page.getByRole('button', { name: /꾸미기/ }).first()
if (!(await 꾸미기.count())) no('레시피 상세에서 꾸미기 버튼을 못 찾았다 — 이 검사를 고칠 것')
else {
  await 꾸미기.click(); await page.waitForTimeout(1200)
  const 탭 = page.getByRole('button', { name: '친구들', exact: true }).first()
  if (await 탭.count()) { await 탭.click(); await page.waitForTimeout(900) }
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(160) }
  const r = await 세기()
  await page.screenshot({ path: join(OUT, '감정컷-2-레꾸서랍.png') })
  if (r.found.length === 0) ok('레꾸 서랍엔 0컷 — only: diary 가 살아 있다')
  else no(`⛔⛔ 레꾸에 ${r.found.length}컷이 샜다 — ${r.found.slice(0, 8).join(' ')}`)
}

if (errors.length) no(`pageerror ${errors.length}건 — ${errors[0]}`)
else ok('pageerror 0')

await b.close(); srv.close()
if (bad) { console.log(`\n⛔ 감정컷 검사 실패 ${bad}건\n`); process.exit(1) }
console.log('✅ 곰펭 감정 컷 — 일꾸에 뜨고 레꾸엔 안 샌다')
