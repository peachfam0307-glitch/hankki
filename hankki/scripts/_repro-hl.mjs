// 🖍 형광펜 — 창업자 2026-08-06. 대조표 「무료 기본 12」 중 우리에게 없던 것.
//
// ⭐⭐ **이 기능의 핵심은 「색띠가 붙나」가 아니라 「글자가 비치나」다.**
//   덮어버리면 그건 형광펜이 아니라 그냥 색종이다. `multiply` 가 진짜 도는지를 **픽셀로 잰다.**
//   ⛔ 「형광펜이 보인다」로 통과시키면 안 된다 — 불투명해도 보이긴 한다(규칙 18 ⓘ).
//
// ⛔ 지켜야 하는 것 여섯:
//   ① 「글자」 탭에 형광펜 칸이 있다
//   ② 누르면 붙는다
//   ③ ⭐ **글자 위에 얹어도 글자가 비친다** — 얹기 «전·후» 명암 대비를 재서 판정
//   ④ 색·굵기·진하기를 바꿀 수 있다
//   ⑤ 되돌리기 한 칸으로 무른다
//   ⑥ 저장에 남는다
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
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

const { BASICS_VERSION } = await import('../src/data/basics.js')
// 🔤 글자를 미리 하나 써 둔다 — 형광펜이 «그 위»에 얹혀야 하니까
const WORD = { id: 'w1', type: 'text', color: 'ink', font: 'gaegu', w: 'mid', text: '오늘도 해냈다', x: 0.5, y: 0.4, s: 0.5, r: 0 }
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [WORD], note: '' }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// 📏📏 **「글자가 비치나」를 재는 자.**
//   ⭐ 형광펜 «칠한 자리 안»에서 세 값을 뽑는다 —
//      `dark`   = 하위 2% (글자 획). 글자가 비치면 여전히 어둡다
//      `mid`    = 가운데값 (형광펜이 칠해진 종이)
//      `bright` = 상위 2%
//   판정 = **`mid - dark` 가 크면 획이 살아 있다.** 덮이면 한 색으로 평평해져 이 값이 0 에 가까워진다.
//   ⛔ 「전체 퍼짐(std)」으로 재면 안 된다 — 형광펜 «테두리»만으로도 퍼짐이 커져 거짓 통과한다
//      (2026-08-06 첫 판이 실제로 194% 라고 거짓 통과했다 · 규칙 18 ⓘ).
const tones = (png, tag) => {
  const f = join(OUT, `_hl-${tag}.png`)
  writeFileSync(f, png)
  const out = execFileSync('python3', ['-c', `
from PIL import Image
import numpy as np, sys
a = np.asarray(Image.open(sys.argv[1]).convert('L'), dtype=float).ravel()
print(round(float(np.percentile(a, 2)), 1), round(float(np.median(a)), 1), round(float(np.percentile(a, 98)), 1))
`, f]).toString().trim().split(/\s+/).map(Number)
  return { dark: out[0], mid: out[1], bright: out[2] }
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

// ── ① ⭐ **일꾸·레꾸 «둘 다»** 「글자」 탭에 형광펜이 있다 ──────
//   창업자 2026-08-06 *"일꾸 레꾸다되는거지?"* → 처음엔 **일꾸에 「글자」 탭이 아예 없었다.**
//   탭은 「그 탭에 스티커 그룹이 있나」로 띄우는데 일기 세트는 데코·프레임·마테뿐이라
//   글자 탭이 통째로 사라졌고, 그 안의 «글자 넣기·형광펜·포스트잇»까지 같이 없어졌다.
//   ⛔ 한쪽만 재고 넘어가면 또 샌다 — 여기서 «양쪽»을 못 박는다.
const openWord = async (shelf) => {
  await page.getByRole('button', { name: shelf, exact: true }).last().click(); await page.waitForTimeout(600)
  const tabs = (await page.locator('.decor-cats button').allInnerTexts()).map((t) => t.trim())
  if (!tabs.includes('글자')) { no(`${shelf} 에 「글자」 탭이 없다 (탭: ${tabs.join('·')})`); return 0 }
  await page.getByRole('button', { name: '글자', exact: true }).first().click(); await page.waitForTimeout(700)
  return await page.locator('.decor-scroll button[aria-label^="형광펜 "]').count()
}
for (const shelf of ['일꾸', '레꾸']) {
  const n = await openWord(shelf)
  if (n >= 6) ok(`${shelf} 「글자」 탭에 형광펜 ${n}색이 있다`)
  else if (n > 0) no(`${shelf} 형광펜 칸이 모자라다 (${n}색)`)
}
// 아래 검사는 레꾸에서 이어 간다(방금 연 자리 그대로)
const pens = page.locator('.decor-scroll button[aria-label^="형광펜 "]')

const stage = await page.locator('.decor-stage').first().boundingBox()
// 🔖 판 위의 형광펜을 «표식»으로 찾는다 — 자리와 blend 선언을 같이 돌려준다
const hlAt = () => page.evaluate(() => {
  const el = document.querySelector('.decor-stage [data-hl]')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height, blend: getComputedStyle(el).mixBlendMode }
})

// ── ② 누르면 붙는다 ───────────────────────────────────
await pens.first().click(); await page.waitForTimeout(700)
const put = await hlAt()
if (put) ok(`형광펜이 붙었다 (${Math.round(put.w)}×${Math.round(put.h)}px)`)
else no('형광펜이 안 붙었다')

// ── ③ ⭐ 글자 위에 얹어도 글자가 비친다 ──────────────────
if (!put) no('형광펜이 없어 「글자가 비치나」를 못 쟀다')
else {
  if (put.blend === 'multiply') ok('겹침 방식이 multiply 로 «선언»돼 있다')
  else no(`겹침 방식이 multiply 가 아니다 (${put.blend}) — 덮어버린다`)
  // 형광펜을 글자 자리로 끌어다 겹친다
  await page.mouse.move(put.x + put.w / 2, put.y + put.h / 2)
  await page.mouse.down()
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height * 0.4, { steps: 12 })
  await page.mouse.up(); await page.waitForTimeout(600)
  // 손잡이·점선이 값을 흐리니 선택을 풀고 잰다
  await page.mouse.click(stage.x + stage.width * 0.06, stage.y + stage.height * 0.93); await page.waitForTimeout(500)
  const now = await hlAt()
  // ⭐ 형광펜 «안쪽»만 잰다 — 테두리를 물면 종이 흰색이 섞여 판정이 흐려진다
  const clip = { x: now.x + now.w * 0.1, y: now.y + now.h * 0.18, width: now.w * 0.8, height: now.h * 0.64 }
  const t = tones(await page.screenshot({ clip }), 'on')
  await page.screenshot({ path: join(OUT, 'hl-글자위.png') })
  const gap = t.mid - t.dark
  if (gap > 45) ok(`⭐ 글자가 «비친다» — 칠한 자리 안 획 ${t.dark} vs 종이 ${t.mid} (차이 ${Math.round(gap)})`)
  else no(`글자가 덮였다 — 획 ${t.dark} vs 종이 ${t.mid} (차이 ${Math.round(gap)}) · multiply 가 실제로는 안 도는 것`)
  // 🖍 형광펜이 «칠해지긴 했나» — 순백이면 아무것도 안 칠해진 것이다
  if (t.mid < 246) ok(`색이 실제로 칠해졌다 (종이 밝기 ${t.mid} < 246)`)
  else no(`색이 안 칠해졌다 (종이 밝기 ${t.mid}) — 띠가 안 보인다`)
}

// ── ④ 색·굵기·진하기를 바꾼다 ──────────────────────────
await page.mouse.click(stage.x + stage.width / 2, stage.y + stage.height * 0.4); await page.waitForTimeout(500)
// 🔀 2026-08-07 — 컨텍스트 바가 «갈래»로 바뀌었다(색·굵기·진하기가 한 번에 한 줄만 뜬다).
//   ⛔ 그래서 갈래를 «먼저» 눌러야 그 칩이 그려진다. 안 누르면 화면에 없다.
//   ⛔⛔ 갈래를 «글자»로 찾으면 안 된다 — 서랍에도 「색·굵기」가 있어 엉뚱한 걸 누른다.
//      (이 검사가 실제로 서랍 형광펜을 눌러 「색이 반영 안 됐다」로 거짓 실패했다) → `data-ctxtab` 로.
const tab = async (key) => {
  const t = page.locator(`button[data-ctxtab="${key}"]`)
  if (await t.count() === 0) return false
  await t.first().click(); await page.waitForTimeout(300)
  return true
}
const tap = async (label, key, name) => {
  if (!(await tab(key))) { no(`${label} — 갈래 단추가 없다`); return false }
  // 칩은 컨텍스트 바(`.decor-ctx`) «안»에서만 찾는다 — 서랍의 같은 이름표를 안 물게.
  const use = page.locator('.decor-ctx').getByRole('button', { name, exact: true })
  if (await use.count() === 0) { no(`${label} — 「${name}」 단추가 없다`); return false }
  await use.first().click(); await page.waitForTimeout(400)
  ok(`${label} 바꿨다 (${name})`)
  return true
}
// ⭐ 색 «이름»을 박아두지 않는다 — 창업자가 팔레트를 갈면 검사가 통째로 깨진다.
//    서랍의 세 번째 칸이 무엇이든 그 이름표를 읽어서 누른다.
const before3 = await page.evaluate(() => document.querySelector('.decor-stage [data-hl]')?.getAttribute('data-hl'))
const third = await pens.nth(2).getAttribute('aria-label')
await tap('색', 'color', third)
await tap('굵기', 'width', '굵게')
await tap('진하기', 'opacity', '진하게')
const changed = await page.evaluate(() => {
  const el = document.querySelector('.decor-stage [data-hl]')
  return el ? { key: el.getAttribute('data-hl'), o: getComputedStyle(el).opacity } : null
})
if (changed?.key && changed.key !== before3) ok(`바꾼 색이 판에 반영됐다 (${before3} → ${changed.key})`)
else no(`색이 판에 반영이 안 됐다 (${before3} → ${changed?.key})`)

// ── ⑤ 되돌리기 한 칸 ──────────────────────────────────
// 방금 「진하게(0.72)」로 바꿨으니, 한 번 무르면 그 «앞» 값(0.5)으로 돌아와야 한다
const undo = page.getByRole('button', { name: '되돌리기', exact: true })
if (await undo.count() === 0) no('되돌리기가 없다 — 형광펜이 기록을 안 남겼다')
else {
  await undo.first().click(); await page.waitForTimeout(600)
  const o = await page.evaluate(() => {
    const el = document.querySelector('.decor-stage [data-hl]')
    return el ? Number(getComputedStyle(el).opacity) : null
  })
  if (o !== null && Math.abs(o - 0.5) < 0.02) ok(`⭐ 한 번 눌러 진하기가 되돌아왔다 (0.72 → ${o})`)
  else no(`되돌렸는데 진하기가 그대로다 (${o}, 기대 0.5)`)
}

// ── ⑥ 저장에 남는다 ───────────────────────────────────
await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1200)
const dec = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary?.[0]?.decor || [])
const pen = dec.find((x) => x.type === 'hl')
if (pen) ok(`저장에 남았다 — 색 ${pen.key} · 굵기 ${pen.ratio ?? 6} · 진하기 ${pen.o ?? 0.5}`)
else no(`저장에 형광펜이 없다 (${dec.length}칸: ${dec.map((x) => x.type).join('·')})`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
