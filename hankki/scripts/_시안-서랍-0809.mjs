// 🎨 서랍 시안 — 「종이를 얼마나 줄이면 서랍이 얼마나 커지나」를 실물로 찍는다
//
// 📮 창업자 2026-08-09 — *"서랍시안하자"* · *"레꾸 서랍도 높이가 좀 더 높았으면 좋겠어."*
//    ＋ *"가로모드로 사용할 수 있으면 꾸미기서랍은 오른쪽에 종이는 왼쪽에 넣어도 괜찮을 것 같거든."*
//
// ⛔ 어제(08-08) 결론 = **여백을 다 깎아도 ＋6px 뿐.** 서랍은 「남는 공간」을 쓰는데 남는 공간이 없다.
//    → **종이를 줄여야 서랍이 커진다.** 얼마나 줄일지는 «미감 판정»이라 창업자 몫(규칙 11).
//    ⭐ 그래서 이 판은 **고르라고 만드는 것**이지 내가 정하려는 게 아니다.
//
// 🔎 겸사겸사 **「종이 크기를 «누가» 정하나」를 브라우저에서 직접 찾는다** —
//    어제 `.decor-stage` 여백을 26/34/42px 로 키워도 종이가 242px 고정이었다. 이유를 코드로만 봐선 못 찾았다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/시안'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4382, r))
const { mkdirSync } = await import('node:fs'); mkdirSync(OUT, { recursive: true })

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

// 🔎 종이의 «크기를 정하는 조상»을 찾는다 — 종이부터 위로 타고 올라가며 폭 제약을 적는다
const 진단 = () => {
  const stage = document.querySelector('.decor-stage')
  if (!stage) return { 못찾음: '.decor-stage' }
  const paper = stage.querySelector('div [style*="aspect-ratio"], div[style*="aspect-ratio"]') || stage.querySelector(':scope > div')
  if (!paper) return { 못찾음: '종이' }
  const chain = []
  let el = paper
  for (let i = 0; i < 5 && el && el !== document.body; i++) {
    const cs = getComputedStyle(el)
    chain.push({
      태그: el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase(),
      폭: Math.round(el.getBoundingClientRect().width),
      높이: Math.round(el.getBoundingClientRect().height),
      최대폭: cs.maxWidth, 최대높이: cs.maxHeight, flex: cs.flex, 여백: cs.padding,
    })
    el = el.parentElement
  }
  return chain
}

// 🔘 서랍 맨 위 버튼 셋의 «진짜» 높이 — 창업자 2026-08-09
//    *"선물 네가지랑 사진스티커로 꾸미기 높이를 배경음식아이콘되돌리기랑 같게하자. (종이를 조금 늘리고)"*
//    ⛔ 「같게」가 «키움»인지 «줄임»인지는 어느 쪽이 큰지 재봐야 안다. 짐작으로 고치지 않는다.
const 버튼 = () => {
  const find = (t) => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes(t))
  const h = (t) => { const e = find(t); if (!e) return null; const cs = getComputedStyle(e)
    return { 높이: Math.round(e.getBoundingClientRect().height), padding: cs.padding, minHeight: cs.minHeight, 아래여백: cs.marginBottom } }
  return { 선물: h('선물 네 가지'), 사진: h('사진 스티커'), 배경: h('배경 음식 아이콘') }
}

const 잰다 = () => {
  const drawer = document.querySelector('.decor-drawer')
  const scroll = document.querySelector('.decor-scroll')
  const stage = document.querySelector('.decor-stage')
  const paper = stage ? stage.querySelector(':scope > div') : null
  const rr = (e) => (e ? Math.round(e.getBoundingClientRect().height) : null)
  const rw = (e) => (e ? Math.round(e.getBoundingClientRect().width) : null)
  return {
    종이: paper ? `${rw(paper)}×${rr(paper)}` : null,
    서랍: rr(drawer),
    굴릴칸: scroll ? Math.round(scroll.clientHeight) : null,
    넘치는양: scroll ? Math.max(0, scroll.scrollHeight - scroll.clientHeight) : null,
  }
}

async function open(page, kind) {
  await page.goto('http://127.0.0.1:4382/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  if (kind === 'diary') {
    await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
    await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)
    await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
  } else {
    await page.locator('.grid-card').first().click(); await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1300)
  }
  // ⛔ 갈래를 눌러야 서랍에 스티커가 뜬다(안 누르면 굴릴 게 없어 「서랍이 없다」로 오해한다)
  for (const n of ['데코', '마테']) {
    const t = page.getByRole('button', { name: n, exact: true }).last()
    if (await t.count().catch(() => 0)) { await t.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(800); break }
  }
}

async function 판(kind, w, h, 이름, css) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, SEED)
  await open(page, kind)
  if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(600) }
  const m = await page.evaluate(잰다)
  await page.screenshot({ path: `${OUT}/${이름}.png` })
  const chain = css ? null : await page.evaluate(진단)
  const btn = css ? null : await page.evaluate(버튼)
  await page.close()
  return { m, chain, btn }
}

console.log('\n🎨 서랍 시안 (2026-08-09)\n')

// ── 0. 진단 — 종이 크기를 «누가» 정하나 ─────────────────────────
const d1 = await 판('recipe', 360, 780, '00-진단-레꾸')
console.log('🔎 레꾸 세로 — 종이부터 위로 타고 올라간 사슬')
;(d1.chain || []).forEach((c) => console.log('   ', JSON.stringify(c)))
console.log('🔘 서랍 맨 위 버튼 셋 — 「같게」가 키움인가 줄임인가')
Object.entries(d1.btn || {}).forEach(([k, v]) => console.log('   ', k.padEnd(3), JSON.stringify(v)))
const d2 = await 판('diary', 360, 780, '00-진단-일꾸')
console.log('🔎 일꾸 세로')
;(d2.chain || []).forEach((c) => console.log('   ', JSON.stringify(c)))

// ── 1. 세로 시안 — 종이를 단계별로 줄인다 ─────────────────────────
// ⭐ 손잡이 = `.decor-stage > div` 의 **최대 폭**. 종이는 `width:100% + aspect-ratio` 라
//    폭을 줄이면 높이가 따라 줄고, 그만큼이 그대로 서랍으로 간다.
// 🔘 창업자 2026-08-09 — *"선물 네가지랑 사진스티커로 꾸미기 높이를 배경음식아이콘되돌리기랑 같게하자. (종이를 조금 늘리고)"*
//    ✅ **실측 = 선물 44 · 사진 44 · 배경 38** → 창업자 말이 맞았다(*"줄이라는거야. 선물네가지버튼이 더 커서"*).
//    ⚠️ 코드 주석엔 *"44px 아래로는 못 내린다(손가락 최소)"* 라고 내가 박아뒀는데
//       **배경 버튼이 이미 38 로 돌고 있다** — 그 기준은 이미 안 지켜지고 있었다. 가지런함을 택한다.
const 버튼통일 = `
  .decor-drawer button:has(> span) { min-height: 38px !important; }
`
const 세로 = [
  ['A-지금', ''],
  ['B-살짝(92%)', '.decor-stage > div { max-width: 92% !important; margin: 0 auto !important; }'],
  ['C-보통(84%)', '.decor-stage > div { max-width: 84% !important; margin: 0 auto !important; }'],
  ['D-많이(74%)', '.decor-stage > div { max-width: 74% !important; margin: 0 auto !important; }'],
  // ⭐⭐ 창업자 지시판 (2026-08-09) — *"줄이라는거야"* ＋ *"레꾸화면을 좀 더 키울 수 있잖아"*
  //    버튼을 38 로 줄여 자리를 벌고, 그 자리를 **종이에게 준다**(여백을 깎아 종이를 최대로).
  //    ⭐ 종이 폭 = 화면 − `.decor-stage` 좌우 여백. 16→8 이면 328 → 344 로 커진다.
  ['E-버튼38+종이키움', 버튼통일 + '.decor-stage { padding-left: 8px !important; padding-right: 8px !important; }'],
  ['F-버튼38+종이최대', 버튼통일 + '.decor-stage { padding-left: 4px !important; padding-right: 4px !important; }'],
  // ⛔ 서랍을 «더» 원하면 종이를 줄이는 쪽 — 둘은 한 화면을 나눠 쓴다(같이 커질 수 없다)
  ['G-버튼38+종이84%', 버튼통일 + '.decor-stage > div { max-width: 84% !important; margin: 0 auto !important; }'],
]
for (const kind of ['recipe', 'diary']) {
  console.log(`\n📐 세로 시안 — ${kind === 'recipe' ? '레꾸(레시피)' : '일꾸(일기)'} 360×780`)
  for (const [이름, css] of 세로) {
    const { m } = await 판(kind, 360, 780, `${kind === 'recipe' ? '레꾸' : '일꾸'}-${이름}`, css)
    console.log(`   ${이름.padEnd(12)} 종이 ${String(m.종이).padEnd(9)} · 서랍 ${String(m.서랍).padStart(3)}px · 굴릴칸 ${String(m.굴릴칸).padStart(3)}px`)
  }
}

// ── 2. 가로 시안 — 종이 왼쪽 · 서랍 오른쪽 (창업자 제안) ───────────
// ⭐ 지금은 세로로 쌓여서(`flex-direction: column`) 가로에선 종이가 화면 밖으로 나간다.
//    가로에서만 «좌우»로 눕히면 놀던 양옆이 그대로 서랍이 된다.
// ⭐⭐ **진짜 범인 = `.decor-editor { max-width: 440px }`** — 진단으로 찾았다.
//    가로에서도 앱이 440px 폭에 갇혀서 폴드 1104px 중 660px 이 그냥 놀고 있었다.
//    ⛔ 첫 판은 `.decor-body` 라는 **내가 지어낸 클래스**를 썼다(그런 건 없다) — 진단이 잡았다.
const 가로CSS = `
@media (orientation: landscape) {
  .decor-editor {
    max-width: none !important;          /* ⭐ 이 한 줄이 놀던 좌우를 되찾는다 */
    flex-direction: row !important; flex-wrap: wrap !important; align-content: flex-start !important;
  }
  .decor-top   { width: 100% !important; order: 0 !important; }
  /* 📮 창업자 2026-08-09 — *"가로모드일때 종이 크기를 더 크게 하자. 가운데에 배치하고(종이를)"*
     ⛔ 첫 판은 종이가 375px 이고 «왼쪽 끝»에 붙어 있었다 — 안내문이 옆에 나란히 서서 종이를 밀었다.
     ⭐ 그래서 stage 를 «세로로 쌓고»(column) 가운데 정렬 → 종이가 제 칸 한가운데에 온다.
        ＋ 종이 상한을 74vh → **92vh** 로 올려 «더 크게». */
  .decor-stage { flex: 1 1 56% !important; order: 1 !important; min-width: 0 !important;
                 display: flex !important; flex-direction: column !important;
                 align-items: center !important; justify-content: center !important;
                 padding: 10px 16px !important; }
  /* ⛔ 「width: 100%」 를 «강제»하면 종이의 aspect-ratio 가 깨진다 — 첫 판에서 정사각이 586×490 이 됐다.
     ⛔⛔ 여기는 CSS 템플릿 «안»이다 — 백틱 금지(오늘 이걸로 두 번 죽였다).
     ⭐ 상한만 올린다. 폭은 종이가 제 비율로 알아서 정한다. */
  .decor-stage > div { max-width: min(100%, 92vh) !important; }
  /* ⛔ 「max-height: none」 만 주면 서랍이 «내용만큼» 늘어나 화면을 넘긴다(폴드에서 3063px 나왔다).
     ⛔⛔ 이 주석은 CSS 템플릿 «안»이다 — 백틱을 쓰면 문자열이 끊겨 스크립트가 죽는다(실제로 죽였다).
     ⭐ 화면에서 제목·도구바를 뺀 만큼으로 «가둬야» 그 안에 스크롤이 생긴다. */
  .decor-drawer { flex: 1 1 44% !important; order: 2 !important; min-width: 0 !important;
                  max-height: calc(100dvh - 152px) !important; height: calc(100dvh - 152px) !important;
                  overflow: hidden !important;
                  border-radius: 22px 0 0 22px !important; box-shadow: -8px 0 24px rgba(0,0,0,.06) !important; }
  .decor-stage { max-height: calc(100dvh - 152px) !important; }
  .decor-tools { width: 100% !important; order: 3 !important; }
}`
console.log('\n📐 가로 시안 — 종이 왼쪽 · 서랍 오른쪽')
for (const [이름, w, h] of [['가로-폰눕힘', 780, 360], ['가로-폴드', 1104, 690]]) {
  const before = await 판('recipe', w, h, `${이름}-A지금`)
  const after = await 판('recipe', w, h, `${이름}-B좌우배치`, 가로CSS)
  console.log(`   ${이름} (${w}×${h})`)
  console.log(`      지금   종이 ${String(before.m.종이).padEnd(9)} · 서랍 ${String(before.m.서랍).padStart(4)}px · 굴릴칸 ${String(before.m.굴릴칸).padStart(4)}px`)
  console.log(`      좌우   종이 ${String(after.m.종이).padEnd(9)} · 서랍 ${String(after.m.서랍).padStart(4)}px · 굴릴칸 ${String(after.m.굴릴칸).padStart(4)}px`)
}

await b.close(); srv.close()
console.log('\n📸 ' + OUT + '\n')
