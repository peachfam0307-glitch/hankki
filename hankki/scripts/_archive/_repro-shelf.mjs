// 📔 「일꾸 / 레꾸」 두 칸 — 창업자 2026-08-06 (*"일꾸 레꾸로 적을까 ㅋㅋㅋ"* → 확정)
//   *"다이어리 쓰기 버튼을 누르면 버튼이 2개 나오게 … 두가지를 다쓰되, 각각 탭에서 쓸수있는거지"*
//   *"두번에 걸쳐서 들어가게 하는게 아니라 **버튼한번만 눌러서** 되게끔"*
//   *"두 버튼은 **속지는 공유**해야해(일기탭안에서는)"*
//   ⛔ 이 검사가 지켜야 하는 것은 **넷**이다:
//      ① 일기 칸엔 일기 세트«만» ② 레꾸 칸엔 나머지 전부(＋일기 세트는 없다)
//      ③ 속지 칸은 «하나»(두 꾸미기 칸이 같은 속지를 쓴다) ④ 표지 꾸미기는 안 갈라지고 «전부» 보인다
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
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
await new Promise((r) => srv.listen(4356, r))

// ⛔ 라벨을 베껴 적지 않는다 — 이름이 바뀌면 검사가 죽는다. 소스에서 읽는다.
//   ⚠️ `Stickers.jsx` 는 JSX 라 node 가 import 못 한다 → 글자로 뽑는다.
//   ⚠️ 아직 공개일(`from`)이 안 된 세트는 서랍에 «안 뜨는 게 정상»이라 뺀다.
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const today = new Date().toISOString().slice(0, 10)
//   ⚠️ 그룹에 `only: 'diary'` 가 낄 수 있다 — 순서를 못 박지 말고 «있으면 건너뛴다»
const DIARY = [...SRC.matchAll(/\{ key: '[a-z0-9_]+', tab: '([a-z]+)', diary: true,(?: only: '[a-z]+',)?(?: from: '([\d-]+)',)? label: '([^']+)'/g)]
  .map((m) => ({ tab: m[1], from: m[2], label: m[3] }))
const OPEN = DIARY.filter((d) => !d.from || d.from <= today)
const LATER = DIARY.filter((d) => d.from && d.from > today)

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = {
  recipes: [{ id: 'r1', title: '김치볶음밥', ing: ['김치 1컵'], steps: ['볶는다'], thumb: 'icon', at: Date.now() }],
  diary: [], seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4356/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const segs = () => page.$$eval('.decor-editor .segment .seg', (ns) => ns.map((n) => n.textContent.trim()))
const labels = () => page.$$eval('.decor-editor .decor-sec-label', (ns) => ns.map((n) => n.textContent.trim()))
const tabs = () => page.$$eval('.decor-editor .decor-cats button, .decor-editor .cat-row button', (ns) => ns.map((n) => n.textContent.trim()))
const tap = async (name) => { await page.getByRole('button', { name, exact: true }).last().click(); await page.waitForTimeout(500) }

// ── 일기로 들어간다 ─────────────────────────────────────
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

// ── ① 큰 칸이 넷인가 · 속지는 «하나»인가 ─────────────────
const S = await segs()
console.log('   🧭 큰 칸:', S.join(' / '))
for (const want of ['속지', '글쓰기', '일꾸', '레꾸']) {
  if (S.includes(want)) ok(`큰 칸에 「${want}」 있다`); else no(`큰 칸에 「${want}」 없다`)
}
if (S.filter((x) => x === '속지').length === 1) ok('속지 칸은 «하나» — 두 꾸미기 칸이 같은 속지를 쓴다')
else no(`속지 칸이 ${S.filter((x) => x === '속지').length}개다 — 하나여야 한다`)
// ⭐ 「한 번만 눌러서」 = 네 칸이 전부 같은 줄에 있고 겹겹이 안 들어간다
if (S.length === 4) ok('큰 칸 넷이 한 줄 — 두 번 안 거치고 한 번에 간다')
else no(`큰 칸이 ${S.length}개다 — 넷이라야 한다 (${S.join(' / ')})`)

// ── ② 일기 칸 = 일기 세트«만» ────────────────────────────
await tap('일꾸')
const dTabs = await tabs()
console.log('   📑 일기 칸 탭:', dTabs.join(' · '))
let seen = []
for (const t of dTabs) { await tap(t); seen = seen.concat(await labels()) }
const wantOpen = OPEN.map((d) => d.label)
for (const l of wantOpen) {
  if (seen.includes(l)) ok(`일기 칸에 「${l}」 있다`); else no(`일기 칸에 「${l}」 없다`)
}
// 🛠 **「도구」는 세트가 아니다** (2026-08-06 형광펜 넣으며 갈라냈다)
//   「글자 넣기 · 형광펜 · 포스트잇」은 «스티커 세트»가 아니라 **글을 다루는 도구**다.
//   ⭐ 일기는 «글 쓰는 화면»이라 이 셋은 일꾸에도 있어야 한다 — 일꾸/레꾸 가르기의 대상이 아니다.
//   ⛔ 그래서 이 셋만 빼고 «세트»를 센다. 목록을 늘릴 땐 «정말 도구인가»를 먼저 물을 것 —
//      여기에 스티커 세트 이름을 넣기 시작하면 이 검사는 그날로 죽는다.
//   ➕ 2026-08-07(v9.96) — 「글 쓸 수 있는 라벨지」 26컷이 붙었다. 이것도 **글을 다루는 도구**다
//      (붙이면 그 자리에서 바로 글이 쳐진다) → 포스트잇과 같은 부류라 일꾸·레꾸 둘 다에 있어야 한다.
//      ⚠️ 실제로 `_repro-글상자-0807` 이 「레꾸에서도 26개가 뜬다」를 못 박고 있다 — 두 검사가 어긋나면 안 된다.
// ⛔⛔ **손으로 적어둔 목록이 낡았다** (2026-08-09) — 「말풍선 · 판」을 새로 만들자 바로 걸렸다.
//    바로 윗줄에 *"여기에 이름을 넣기 시작하면 이 검사는 그날로 죽는다"* 고 적혀 있었는데
//    **적어둔 대로 죽고 있었다.** 이름을 하나 더 적는 대신 **코드에서 읽는다.**
//    ⭐ 글 상자 그룹(`BOX_GROUPS`)은 «전부» 글 다루는 도구다 — 새 그룹이 늘어도 안 낡는다.
//    ⚠️ Node 는 JSX 를 못 읽는다 → 파일을 «글자로» 읽어 라벨만 뽑는다(check-paperphoto 와 같은 방식).
const BOX_LABELS = (() => {
  const src = readFileSync(new URL('../src/components/Stickers.jsx', import.meta.url), 'utf8')
  const blk = src.slice(src.indexOf('export const BOX_GROUPS'))
  return [...blk.slice(0, blk.indexOf('\n]')).matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1])
})()
if (BOX_LABELS.length < 4) { console.log('   ⛔ BOX_GROUPS 라벨을 못 읽었다 — 검사가 못 도는 상태다'); process.exit(1) }
const TOOLS = ['글자', '형광펜', '포스트잇', ...BOX_LABELS]
const strays = seen.filter((l) => !wantOpen.includes(l) && !TOOLS.includes(l))
if (!strays.length) ok(`일기 칸엔 일기 세트«만» 있다 (세트 ${seen.length - seen.filter((l) => TOOLS.includes(l)).length}그룹 ＋ 도구 ${TOOLS.length})`)
else no(`일기 칸에 남의 그룹 ${strays.length}개가 섞였다 — ${strays.slice(0, 6).join(' / ')}`)
// ⭐ 도구 셋이 «빠지지도» 않았나 — 있으면 안 되는 것만 보면 없어진 걸 못 잡는다(규칙 18 ⓘ)
const lostTools = TOOLS.filter((t) => !seen.includes(t))
if (!lostTools.length) ok('일기 칸에 글 도구 셋(글자·형광펜·포스트잇)이 다 있다 — 일기는 글 쓰는 화면이다')
else no(`일기 칸에서 글 도구가 빠졌다 — ${lostTools.join(' / ')}`)
if (LATER.length) console.log(`   ⏳ 아직 안 열린 일기 세트 ${LATER.length}그룹 (${LATER[0].from}~) — 지금 안 보이는 게 정상`)
await page.screenshot({ path: join(OUT, 'shelf-1-일기칸.png') })

// ── ③ 레꾸 칸 = 나머지 전부 · 일기 세트는 없다 ─────────────
await tap('레꾸')
const aTabs = await tabs()
console.log('   📑 레꾸 칸 탭:', aTabs.join(' · '))
let seen2 = []
for (const t of aTabs) { await tap(t); seen2 = seen2.concat(await labels()) }
const leaked = seen2.filter((l) => wantOpen.includes(l))
if (!leaked.length) ok(`레꾸 칸엔 일기 세트가 없다 (${seen2.length}그룹)`)
else no(`레꾸 칸에 일기 세트가 샜다 — ${leaked.join(' / ')}`)
if (seen2.length > seen.length) ok(`레꾸 칸이 더 크다 (${seen2.length} > ${seen.length})`)
else no(`레꾸 칸이 ${seen2.length}그룹뿐 — 일기 칸(${seen.length})보다 커야 한다`)
await page.screenshot({ path: join(OUT, 'shelf-2-레꾸칸.png') })

// ── ④ 표지 꾸미기는 «안 갈라진다» — 일기 세트도 그대로 쓴다 ──
await page.getByRole('button', { name: '취소', exact: true }).first().click(); await page.waitForTimeout(600)
const ask = page.getByRole('button', { name: /나가기|안 하고|버리기/ })
if (await ask.count()) { await ask.first().click(); await page.waitForTimeout(500) }
await page.getByRole('button', { name: '뒤로', exact: true }).first().click(); await page.waitForTimeout(700)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(0).click(); await page.waitForTimeout(600)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1100)
const cS = await segs()
if (!cS.includes('일꾸') && !cS.includes('레꾸')) ok('표지 꾸미기엔 두 칸이 «안» 생긴다')
else no(`표지 꾸미기에 일기 칸이 생겼다 — ${cS.join(' / ')}`)
await page.getByRole('button', { name: '데코', exact: true }).first().click(); await page.waitForTimeout(700)
const cover = await labels()
const both = wantOpen.filter((l) => cover.includes(l))
if (both.length) ok(`표지 꾸미기에서도 일기 세트를 쓴다 (${both.length}그룹) — 한 번 준 건 안 빼앗는다`)
else no('표지 꾸미기에서 일기 세트가 사라졌다 — 나누는 것이지 빼앗는 게 아니다')
await page.screenshot({ path: join(OUT, 'shelf-3-표지꾸미기.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
