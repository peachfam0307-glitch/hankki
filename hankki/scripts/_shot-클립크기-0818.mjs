// 🔖 클립 인덱스 **크기 갈래** — 창업자 판정용 (2026-08-18)
//
// 📮 창업자 *"다시뽑아??"* → **아니다.** 그림은 규격대로 나왔고 바뀐 건 «크기 값» 하나다.
//
// ⚠️⚠️ **「28px 적당」의 «전제»가 사라졌다** (규칙 18의 사촌 — 재기 전에 전제를 의심한다)
//    · 어제 요리소품 32컷 = 가로/세로 평균 **0.93**(거의 정사각) → 28px 이면 폭도 26px
//    · 오늘 클립 16컷    = 가로/세로 평균 **0.55**(세로로 길다) → 28px 이면 폭이 **15px**
//    🔢 「덩어리감」을 맞추면(면적 동등) 28×26=728 ↔ h×0.55h=728 → **h ≈ 36px**
//
// ⭐⭐ **위로 나가는 양은 «고정»으로 둔다** — 높이의 절반으로 두면 키워도 모양이 안 변한다.
//    고정해 두면 **키울수록 클립 다리가 카드 «안»으로 더 꽂힌다** = 진짜 인덱스에 가까워진다.
//    (16컷 전부 「위=장식 · 아래=다리」 구조라 이게 그대로 먹힌다)
//
// ✅ 자리는 **G3 확정값** 그대로 — 📮 *"오른쪽 완전끝말고 살짝 왼쪽으로."* → *"나도 3번이 제일 이쁜거 같아."*
//    G3 = `right: 12px` · `top: -14px` (카드 오른쪽 끝에서 12px 안쪽 · 위로 14px)
//    ⛔ 32컷 판의 옛 기본값(밖 14 = right −6px)은 **오른쪽 «밖»으로 나가는 자리**라 G3 가 아니다.
//
// ⛔ 판정용 표시를 앱 화면 «안»에 그리지 않는다 (2026-08-17 사고 — 창업자가 앱 디자인으로 오해했다).
//    크기 숫자는 **찍은 뒤 화면 «밖»(왼쪽 여백)에** 붙인다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-클립크기-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낱개 = join(ROOT, process.env.SHEET_DIR || 'docs/stickers/클립인덱스-창업자-2026-08-18/낱개')

// ⭐ 크기 다섯 — 지금(28) · 32 · **36(덩어리감 동등)** · 40 · 44
const 크기들 = (process.env.IDX_SIZES || '28,32,36,40,44').split(',').map(Number)
const 밖 = Number(process.env.IDX_SIDE || -4)    // G3 — right = 8 - (-4) = 12px
const 위밖 = Number(process.env.IDX_TOP || 22)   // G3 — top  = 8 - 22   = -14px
// ⭐ 폭이 제일 넓은 것 · 중간 · 제일 홀쭉한 것을 나란히 — 같은 높이인데 폭이 두 배 가까이 차이 난다
const 고른컷 = (process.env.IDX_PICKS || 'cl_05,cl_03,cl_15').split(',')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4379, r))

const 있는것 = readdirSync(낱개).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))
for (const k of 고른컷) if (!있는것.includes(k)) throw new Error(`⛔ ${k} 없다 — 있는 것: ${있는것.join(',')}`)
const url = (k) => 'data:image/png;base64,' + readFileSync(join(낱개, `${k}.png`)).toString('base64')
const 그림 = Object.fromEntries(고른컷.map((k) => [k, url(k)]))
const 전체 = Object.fromEntries(있는것.map((k) => [k, url(k)]))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이', '미역국', '갈치조림', '고등어구이', '잡채', '비빔밥', '카레', '오므라이스', '떡볶이', '순두부찌개', '동태전', '호박전']
const R = (i) => ({ id: 'x'.repeat(i + 1), title: 요리[i], category: '한식', time: 15, thumb: 'icon', icon: ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04', 'fh_k12'][i % 10], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0 })
const state = { recipes: 요리.map((_, i) => R(i)), diary: [], seedV: BASICS_VERSION }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []

// ⛔ `fullPage` 로는 다 안 담긴다 — 목록이 «내부 스크롤»(`.screen`)이라 페이지 자체는 안 길어진다.
//    첫 판에서 큰 격자 5줄 중 3.5줄만 찍혔다. → 격자마다 «화면 높이»를 늘려 잡는다.
const 열기 = async (격자, 높이 = 880) => {
  const page = await b.newPage({ viewport: { width: 360, height: 높이 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4379/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
  return page
}

// 📏 줄마다 크기를 바꿔 얹는다. 줄 y 를 돌려받아 «화면 밖»에 숫자를 붙인다.
const 얹기 = (page, 열) => page.evaluate(({ 그림, 크기들, 밖, 위밖, 제목들, 열, 고른컷 }) => {
  const 남길 = new Set(제목들)
  const 카드들 = [...document.querySelectorAll('.grid-card')]
  카드들.forEach((c) => { if (!남길.has(c.querySelector('.name')?.textContent)) c.style.display = 'none' })
  const 보이는 = 카드들.filter((c) => c.style.display !== 'none')
  const 줄y = []
  let i = 0
  for (const c of 보이는) {
    const 줄 = Math.floor(i / 열)
    if (줄 >= 크기들.length) { c.style.display = 'none'; continue }
    const PX = 크기들[줄]
    const 키 = 고른컷[i % 열 % 고른컷.length]
    const d = c.querySelector('.fav-dot')
    if (d) {
      d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
      d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
      d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
      d.innerHTML = `<img src="${그림[키]}" style="display:block;height:${PX}px;width:auto" alt="">`
    }
    if (i % 열 === 0) 줄y.push({ px: PX, y: c.getBoundingClientRect().top + window.scrollY })
    i++
  }
  document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
  return 줄y
}, { 그림, 크기들, 밖, 위밖, 제목들: 요리, 열, 고른컷 })

// 📏 「기능이 깨지나」 — 클립이 «위 카드의 이름표·날짜»를 덮는지 픽셀로 잰다.
//    ⭐ 눈으로는 「닿을락 말락」이 제일 못 잡는다. 카드가 위아래로 붙어 있어 위 칸을 침범하기 쉽다.
const 겹침재기 = (page) => page.evaluate(() => {
  const 결과 = []
  for (const c of [...document.querySelectorAll('.grid-card')].filter((c) => c.style.display !== 'none')) {
    const img = c.querySelector('.fav-dot img')
    if (!img) continue
    const r = img.getBoundingClientRect()
    // 이 클립이 덮고 있는 «다른 카드»의 글자
    for (const 글자 of document.querySelectorAll('.grid-card .name, .grid-card .date, .grid-card .meta')) {
      if (c.contains(글자)) continue
      const g = 글자.getBoundingClientRect()
      if (g.width === 0) continue
      const w = Math.min(r.right, g.right) - Math.max(r.left, g.left)
      const h = Math.min(r.bottom, g.bottom) - Math.max(r.top, g.top)
      if (w > 0 && h > 0) 결과.push({ 글자: 글자.textContent.slice(0, 12), 겹친폭: Math.round(w), 겹친높이: Math.round(h) })
    }
  }
  return 결과
})

const 찍기 = async (격자, 열, 이름, 높이) => {
  const page = await 열기(격자, 높이)
  const 줄y = await 얹기(page, 열)
  await page.waitForTimeout(500)
  const 겹침 = await 겹침재기(page)
  const p = join(OUT, `${이름}.png`)
  await page.screenshot({ path: p, fullPage: true })
  writeFileSync(join(OUT, `${이름}.json`), JSON.stringify(줄y))
  console.log(`   ✅ ${이름} — 줄 ${줄y.length}개 (${줄y.map((r) => r.px + 'px').join(' · ')})`)
  if (겹침.length) 겹침.forEach((x) => console.log(`      ⚠️ 「${x.글자}」를 덮는다 — ${x.겹친폭}×${x.겹친높이}px`))
  else console.log('      ✅ 위 카드 글자를 덮는 것 0')
  await page.close()
}

await 찍기('small', 3, '클립크기-작은격자', 880)
await 찍기('big', 2, '클립크기-큰격자', 1720)

// 📐 ＋ 16컷 «전부»를 한 크기로 — 크기가 정해지면 이 판으로 그림을 고른다
const 전부 = async (PX) => {
  // ⛔ 880px 로 찍었더니 16컷 중 15컷만 담기고 마지막이 하단바에 잘렸다 — 6줄이 필요하다
  const page = await 열기('small', 1180)
  await page.evaluate(({ 전체, PX, 밖, 위밖, 제목들 }) => {
    const 남길 = new Set(제목들)
    const 카드들 = [...document.querySelectorAll('.grid-card')]
    카드들.forEach((c) => { if (!남길.has(c.querySelector('.name')?.textContent)) c.style.display = 'none' })
    const 키들 = Object.keys(전체).sort()
    let i = 0
    for (const c of 카드들.filter((c) => c.style.display !== 'none')) {
      if (i >= 키들.length) { c.style.display = 'none'; continue }
      const d = c.querySelector('.fav-dot')
      if (d) {
        d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
        d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
        d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
        d.innerHTML = `<img src="${전체[키들[i]]}" style="display:block;height:${PX}px;width:auto" alt="">`
      }
      i++
    }
    document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
  }, { 전체, PX, 밖, 위밖, 제목들: 요리 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(OUT, `클립16컷-${PX}px.png`), fullPage: true })
  console.log(`   ✅ 클립16컷-${PX}px`)
  await page.close()
}
for (const px of (process.env.IDX_ALL || '36').split(',').map(Number)) await 전부(px)

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
