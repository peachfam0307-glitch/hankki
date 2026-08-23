// 🗑📷 창업자 폰 제보 2026-08-07 (세 번째) — *"하나추가 사진지우는게 없어."*
//   캡처 = 「레시피 기록」 틀의 사진칸에 카피바라 사진.
//
// ⛔⛔ 이건 «사진 스티커»가 아니라 **틀의 사진칸**(`PaperSheet` 의 `value.photo`)이다.
//    `DecorLayer` 의 지우기 단추(오늘 아침에 고친 것)와 **아무 상관이 없다** —
//    그래서 창업자 눈엔 「하나 더 있다」로 보였고, 실제로 «비울 길이 아예 없었다».
//
// ⛔ 「DOM 에 단추가 있나」로 판정하지 않는다 — 오늘만 세 번 그렇게 속았다
//    (만족도 `aria-pressed` · 세로 사진 비율 · `document.fonts.check()`).
//    ⭐ 그래서 넷을 다 잰다 — ①있나 ②사진칸 «안»에 온전히 있나 ③그 자리를 «진짜 그놈»이 받나
//       ④눌러서 **저장된 값이 실제로 비나**(화면만 비면 다시 열었을 때 되살아난다)
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

const { BASICS_VERSION } = await import('../src/data/basics.js')
// 📷 사진칸이 있는 틀 «전부» — 하나만 보면 나머지 둘이 조용히 빠진다
//   ⚠️ `papers.js` 는 `.webp` 를 import 해서 **노드가 못 읽는다**(빌드 도구가 붙는 자리다)
//      → 글자로 읽는다. 틀 하나는 «4칸 들여쓴 key» 로 시작하니 그걸 경계로 자른다.
const WITH_PHOTO = (() => {
  const src = readFileSync(join(ROOT, 'src/data/papers.js'), 'utf8')
  const arts = [...src.matchAll(/^ {4}key: '([\w]+)', label: '([^']*)'/gm)]
  return arts.map((m, i) => {
    const body = src.slice(m.index, i + 1 < arts.length ? arts[i + 1].index : src.length)
    return { key: m[1], label: m[2], has: /^ {6}photo: \{/m.test(body) }
  }).filter((a) => a.has)
})()
if (!WITH_PHOTO.length) { console.log('⛔ 사진칸이 있는 틀을 하나도 못 찾았다 — 읽는 방식부터 의심할 것'); process.exit(1) }

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// 시험용 사진 — 세로로 긴 «폰 사진»(9:16). 귀퉁이에 표식을 넣어 잘림도 같이 보인다
const SHOT = (() => {
  const w = 540, h = 960
  return { w, h }
})()

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []

// 🔎 단추 하나의 «진짜» 상태 — 있나 · 사진칸 안인가 · 그 자리를 그놈이 받나
//   ⚠️⚠️ **`scope` 를 반드시 준다.** 꾸미기를 열면 화면에 `.paper` 가 **16개**가 된다
//      (뒤에 깔린 일기 화면 1 ＋ 속지 고르기 미리보기 14 ＋ 꾸미는 판 1).
//      그냥 `.paper` 로 찾으면 **뒤에 깔린 판**을 집어서 «가려졌다»는 엉뚱한 답이 나온다.
//      실제로 첫 판에서 그렇게 틀렸다 — 규칙 18 그대로, 「없다」가 아니라 «내가 딴 걸 봤다».
const probe = (page, label, scope = '.paper') => page.evaluate(([lb, sc]) => {
  const el = document.querySelector(`${sc} [aria-label="${lb}"]`)
  if (!el) return { there: false }
  const paper = el.closest('.paper')
  const cell = el.parentElement // 사진칸(overflow:hidden) — 여기서 넘치면 잘린다
  const r = el.getBoundingClientRect(), c = cell.getBoundingClientRect(), p = paper.getBoundingClientRect()
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const top = document.elementFromPoint(cx, cy)
  return {
    there: true, w: Math.round(r.width), h: Math.round(r.height),
    inCell: r.left >= c.left - 0.5 && r.top >= c.top - 0.5 && r.right <= c.right + 0.5 && r.bottom <= c.bottom + 0.5,
    inPaper: r.left >= p.left - 0.5 && r.top >= p.top - 0.5 && r.right <= p.right + 0.5 && r.bottom <= p.bottom + 0.5,
    over: !!(top && (top === el || el.contains(top) || top.closest?.(`[aria-label="${lb}"]`))),
    x: Math.round(r.left - p.left), y: Math.round(r.top - p.top),
    // 「누가 먹었나」까지 알려준다 — 「가렸다」만으로는 어디를 고칠지 모른다
    ate: top ? `${top.tagName.toLowerCase()}${top.getAttribute?.('aria-label') ? `[${top.getAttribute('aria-label')}]` : ''}` : '(없음)',
  }
}, [label, scope])

// 🗃 «저장된» 값 — 화면이 아니라 localStorage 를 본다(다시 열면 되살아나는 걸 잡는다)
const savedPhoto = (page) => page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const d = (s.diary || []).find((x) => x.kind === 'diary')
    return d ? (d.photo || '') : '(일기 없음)'
  } catch { return '(못 읽음)' }
})

const openDiary = async (page) => {
  await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
}

const makePage = async (art, photo) => {
  const ctx = await b.newContext({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, {
    recipes: [], seedV: BASICS_VERSION,
    diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'lined', skin: 'ivory', art }, note: '', photo, decor: [] }],
  })
  await openDiary(page)
  return page
}

// 🖼 시험 사진을 브라우저 안에서 만든다 — 귀퉁이 표식이 있어 잘림도 같이 보인다
const draw = (page) => page.evaluate(([w, h]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d')
  x.fillStyle = '#b4784f'; x.fillRect(0, 0, w, h)
  x.fillStyle = '#fff'
  for (const [px, py] of [[0, 0], [w - 90, 0], [0, h - 90], [w - 90, h - 90]]) x.fillRect(px, py, 90, 90)
  return c.toDataURL('image/png')
}, [SHOT.w, SHOT.h])

// ═══ ① 사진칸이 있는 틀 «전부» ══════════════════════════
console.log(`\n📷 사진칸이 있는 틀 = ${WITH_PHOTO.length}개 — ${WITH_PHOTO.map((a) => a.label).join(' · ')}`)

for (const art of WITH_PHOTO) {
  console.log(`\n── 「${art.label}」 (${art.key}) ──`)
  // ⛔ 사진이 «없을» 때 지우기가 뜨면 안 된다 — 빈 칸에 ✕ 는 고장으로 읽힌다
  let page = await makePage(art.key, '')
  const empty = await probe(page, '사진 지우기')
  if (empty.there) no('사진이 없는데 지우기 단추가 떠 있다')
  else ok('사진이 없을 땐 지우기 단추가 없다')
  if (!(await page.locator('.paper [aria-label="사진 넣기"]').count())) no('「사진 넣기」가 없다 — 사진칸 자체가 안 산다')
  await page.context().close()

  // 사진이 «있을» 때
  page = await makePage(art.key, '')
  const src = await draw(page)
  await page.context().close()

  page = await makePage(art.key, src)
  const s = await probe(page, '사진 지우기')
  if (!s.there) { no('⭐ 사진을 넣었는데 «지우기 단추가 없다» — 창업자 제보 그대로'); await page.context().close(); continue }
  if (!s.inCell) no(`지우기 단추가 사진칸 «밖»이라 잘린다 — 종이 기준 (${s.x}, ${s.y})`)
  else if (!s.over) no('지우기 단추 자리를 «다른 것»이 받는다 — 눌러도 안 지워진다(틀 그림이 덮었을 수 있다)')
  else ok(`지우기 단추가 보이고 눌린다 — ${s.w}×${s.h}px · 종이 기준 (${s.x}, ${s.y})`)
  if (s.w < 26) no(`⚠️ 단추가 ${s.w}px 밖에 안 된다 — 손가락에 안 잡힌다`)
  // 사진 바꾸기도 그대로 살아 있어야 한다(둘 다 있어야 «갈아끼우기»와 «비우기»가 갈린다)
  if (await page.locator('.paper [aria-label="사진 바꾸기"]').count()) ok('「사진 바꾸기」도 그대로 있다')
  else no('지우기를 넣으면서 「사진 바꾸기」가 사라졌다')

  await page.screenshot({ path: join(OUT, `사진지우기-${art.key}-1.png`) })

  // ② 눌러서 진짜 비나 — 화면 ＋ 저장값 «둘 다»
  await page.locator('.paper [aria-label="사진 지우기"]').first().click()
  await page.waitForTimeout(900) // 자동저장 350ms 보다 넉넉히
  const backToAdd = await page.locator('.paper [aria-label="사진 넣기"]').count()
  const stillThere = await page.locator('.paper [aria-label="사진 지우기"]').count()
  if (backToAdd && !stillThere) ok('누르니 사진이 비고 「사진 넣기」로 돌아간다')
  else no(`눌렀는데 ${stillThere ? '사진이 그대로다' : '「사진 넣기」가 안 돌아온다'}`)
  const kept = await savedPhoto(page)
  if (kept === '') ok('저장값도 비었다 — 다시 열어도 안 되살아난다')
  else no(`⭐ 화면만 비고 «저장값은 남았다»(${String(kept).slice(0, 24)}…) — 다시 열면 사진이 되살아난다`)
  await page.screenshot({ path: join(OUT, `사진지우기-${art.key}-2.png`) })
  await page.context().close()
}

// ═══ ③ 꾸미기 판(서랍이 열린 상태)에서도 지워지나 ═══════
//   ⭐ 창업자는 «꾸미다가» 사진이 거슬려 지운다 — 꾸미기를 닫고 다시 들어가라고 하면 그게 왕복이다
//   ⚠️ 여기선 판이 「속지 · 글쓰기 · 일꾸 · 레꾸」 네 탭을 오간다. **탭마다 층이 다르다** →
//      한 탭만 보고 「된다/안 된다」로 말하지 않는다.
const STAGE = '.decor-stage .paper'
console.log('\n── 꾸미기 판(서랍 열림) ──')
{
  const art = WITH_PHOTO.find((a) => a.key === 'card') || WITH_PHOTO[0]
  let page = await makePage(art.key, '')
  const src = await draw(page)
  await page.context().close()

  page = await makePage(art.key, src)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)

  for (const tab of ['속지', '글쓰기', '일꾸']) {
    const t = page.getByRole('button', { name: tab, exact: true })
    if (!(await t.count())) { console.log(`   ℹ️ 「${tab}」 탭이 없어 건너뜀`); continue }
    await t.last().click(); await page.waitForTimeout(700)
    const s = await probe(page, '사진 지우기', STAGE)
    if (!s.there) no(`「${tab}」 탭 — 지우기 단추가 판에 없다`)
    else if (!s.inCell) no(`「${tab}」 탭 — 지우기 단추가 사진칸 밖이라 잘린다`)
    else if (!s.over) {
      // 🧷 「일꾸·레꾸」는 **스티커 층이 판 전체를 먹는 게 «설계»다**(드래그·빈 자리 탭이 거기서 돈다).
      //    속지 축·글칸도 똑같이 안 눌린다 → 이 탭에서 못 누르는 건 이 단추만의 문제가 아니다.
      if (tab === '일꾸') console.log(`   ℹ️ 「일꾸」 탭에선 스티커 층이 먹는다(${s.ate}) — 속지 축·글칸과 «같은» 규칙이라 정상`)
      else no(`「${tab}」 탭 — 지우기 자리를 «${s.ate}» 가 가로챈다`)
    } else ok(`「${tab}」 탭 — 보이고 눌린다 (${s.w}×${s.h}px)`)
    await page.screenshot({ path: join(OUT, `사진지우기-꾸미기-${tab}.png`) })
  }

  // 실제로 눌러서 비우기 — 속지 탭에서(창업자가 사진칸을 만지는 자리)
  // ⚠️ **없으면 «죽지 말고» 한 줄 적고 넘어간다** — 2026-08-06 `_repro-undo` 가 정확히 이걸로
  //    30초 타임아웃 크래시를 내서 뒤 항목이 한 줄도 안 찍혔다. 검사는 끝까지 재야 한다.
  await page.getByRole('button', { name: '속지', exact: true }).last().click(); await page.waitForTimeout(700)
  const del = page.locator(`${STAGE} [aria-label="사진 지우기"]`)
  if (!(await del.count())) no('꾸미기 판에 지우기 단추가 없어 «눌러보는 검사»를 못 했다')
  else {
    await del.first().click(); await page.waitForTimeout(900)
    const kept = await savedPhoto(page)
    if (kept === '') ok('⭐ 꾸미는 중에 눌러도 저장값까지 비운다')
    else no('꾸미기 판에서 눌렀는데 저장값이 안 비었다')
    if (await page.locator(`${STAGE} [aria-label="사진 넣기"]`).count()) ok('그 자리가 바로 「사진 넣기」로 바뀐다 — 다시 넣을 수 있다')
    else no('지우고 나니 「사진 넣기」가 없다 — 다시 넣을 길이 막힌다')
    await page.screenshot({ path: join(OUT, '사진지우기-꾸미기-지운뒤.png') })
  }
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남 — 창업자 제보가 재현됐다\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
