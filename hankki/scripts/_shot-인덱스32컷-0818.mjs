// 🔖 요리소품 **32컷 전부**를 「인덱스 자리」에 28px 로 얹어 본다 — 창업자 그림 고르기용 (2026-08-18)
//
// ✅ 창업자 확정 = **표시용 · 흰 동그라미 없음 · 28px · 안 걸린 칸은 텅**
//    📮 *"28이 적당해보여. 흐림은 네말대로 지저분해보여."*
// ✅ 자리도 확정 = **G — 오른쪽 위 · 위로 반반 · 그림이 오른쪽 끝까지**
//    📮 *"나는 위치가 **사각박스 오른쪽 상단 위**도 하나있었으면 좋겠는데. **(반은 안에 반은 밖에)**"*
//    📮 → G 확대판을 보고 *"**이걸로** 몇개넣어서 보여줘 **글자빼고**"*
//    ⭐ 「그림이 오른쪽 끝까지」 = 상자를 그림 크기로 줄인다(`width/height: auto`).
//       ⛔ 안 그러면 `.fav-dot`(34px)이 28px 그림을 «가운데» 놓아 3px 안쪽에 서고,
//          ＋스티커 PNG 자체의 투명 여백까지 겹쳐 「오른쪽 끝인데 안 붙어 보이는」 착시가 난다.
// ⛔ **이름표를 안 붙인다** (창업자 *"글자빼고"*) — 대신 순서가 `ck_01`→`ck_32` 라 자리로 짚을 수 있다.
//
// ⭐⭐ **왜 32컷을 «카드 위»에서 고르나** — 19px 실측판(`_판-인덱스19px-0817.py`)은 «흰 칸» 위에서 잰다.
//    앱에선 **크림색 카드 위 · 28px · 모서리에 걸친 채**로 보인다. 조건이 다르면 답도 다르다.
//    📌 어제 실제로 그랬다 — 19px·흰 칸에서 「죽는다」던 컷이 조건이 바뀌자 다 살아났다.
//
// 🖼 두 장을 만든다
//    ① **카드 위 32컷** (작은 격자 · fullPage) — 진짜로 어떻게 보이나
//    ② **28px 실물 띠** (32컷을 진짜 28px 로 한 줄에 ＋ 4배 확대) — 그림끼리 견주기
//
// ⛔ 판정용 표시(테두리·화살표)를 그리지 않는다 — 창업자가 앱 디자인으로 오해한다(2026-08-17 사고).
//    ⭐ 이름표는 **카드 아래**에 두되 «흰 딱지»로 — 앱엔 없다는 게 한눈에 보이게.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-인덱스32컷-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
// ⭐ 폴더를 갈아끼울 수 있게 — 창업자가 새 시안을 줄 때마다 스크립트를 안 고치게 한다
//    예: SHEET_DIR=docs/stickers/클립인덱스-창업자-2026-08-18/낱개 node scripts/_shot-인덱스32컷-0818.mjs
const 낱개 = join(ROOT, process.env.SHEET_DIR || 'docs/stickers/요리소품-창업자-2026-08-17/낱개')

// ⚠️ [2026-08-18] **「28px 확정」의 전제가 바뀌었다** — 창업자가 클립 시안을 새로 뽑았는데
//    가로/세로 평균이 **0.55**(어제 요리소품 32컷은 0.93). 28px 높이면 **폭이 15px** 밖에 안 된다.
//    ⭐ 그래서 크기·나가는 양을 «환경변수»로 바꿔가며 찍는다.
//    ⭐⭐ 그리고 위로 나가는 양을 «높이의 절반」이 아니라 «고정값»으로 두면 —
//       키울수록 **클립 다리가 카드 안으로 더 꽂힌다.** 진짜 인덱스에 가까워진다.
// ⛔⛔ [2026-08-18 고침] 기본값이 **밖 14 = `right: -6px`** 이었다 = 카드 오른쪽 «밖»으로 6px.
//    그건 창업자가 «명시적으로 거부한» 방향이다 — 📮 *"오른쪽 완전끝말고 살짝 왼쪽으로."*
//    ✅ 확정은 **G3 = 밖 −4 → `right: 12px`**(📮 *"나도 3번이 붙였을때 제일 이쁜거 같아."*)
//    📌 확정한 값을 «기본값»으로 옮기지 않으면 다음 판이 또 옛 자리로 나간다.
const PX = Number(process.env.IDX_PX || 28)      // 그림 높이
const 밖 = Number(process.env.IDX_SIDE || -4)    // 옆 — 카드 오른쪽에서 (8 - 값)px
const 위밖 = Number(process.env.IDX_TOP || 22)   // 위 — 카드 위로 (값 - 8)px 나간다

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4378, r))

const 키들 = readdirSync(낱개).filter((f) => f.endsWith('.png')).sort().map((f) => f.slice(0, -4))
const 컷 = 키들.map((k) => [k, 'data:image/png;base64,' + readFileSync(join(낱개, `${k}.png`)).toString('base64')])
console.log(`   🖼 ${컷.length}컷`)

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// ⚠️ `status: 'sorted'` 가 없으면 목록에 아예 안 뜬다(MyRecipesScreen:227)
// ⭐ 32컷을 한 화면에서 견주려면 카드 32개가 «전부» 걸려 있어야 한다.
//   ⛔ 이 판은 「어떤 그림이 읽히나」를 보는 판이지 「목록이 시끄럽나」를 보는 판이 아니다(그건 앞 판에서 봤다).
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이', '미역국', '갈치조림', '고등어구이', '잡채', '비빔밥', '카레', '오므라이스', '떡볶이', '순두부찌개', '동태전', '호박전', '콩자반', '멸치볶음', '감자조림', '어묵볶음', '시금치나물', '숙주나물', '가지볶음', '애호박볶음', '부추전', '김치전', '수제비', '칼국수']
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04', 'fh_k12']
const R = (i) => ({ id: 'x'.repeat(i + 1), title: 요리[i] || `요리 ${i + 1}`, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 아이콘.length], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0 })
const state = { recipes: 컷.map((_, i) => R(i)), diary: [], seedV: BASICS_VERSION }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4378/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

// ① 카드 위 — 내가 심은 32개만 남기고 기본 레시피는 감춘다(안 그러면 섞여서 못 센다)
const 얹기 = async (page) => page.evaluate(({ 컷, PX, 밖, 위밖, 제목들 }) => {
  const 남길 = new Set(제목들)
  const 카드들 = [...document.querySelectorAll('.grid-card')]
  카드들.forEach((c) => {
    const t = c.querySelector('.name')?.textContent
    if (!남길.has(t)) c.style.display = 'none'
  })
  const 보이는 = 카드들.filter((c) => c.style.display !== 'none')
  let i = 0
  for (const c of 보이는) {
    const d = c.querySelector('.fav-dot')
    if (!d) continue
    // ⛔ 제목으로 걸렀더니 **같은 이름의 기본 레시피가 같이 남아 35개**가 됐다(된장찌개·제육볶음…).
    //    컷은 32개니 33번째부터는 «두 번째로» 나오게 된다 → 아예 감춘다. 창업자가 세는 판이다.
    if (i >= 컷.length) { c.style.display = 'none'; continue }
    const [, url] = 컷[i]; i++
    d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
    // ⭐ 상자를 그림 크기로 — 좌표와 그림이 어긋나지 않게(G 자리의 핵심)
    d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
    d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
    d.innerHTML = `<img src="${url}" style="display:block;height:${PX}px;width:auto" alt="">`
    // ⛔ 이름표를 안 붙인다 — 창업자 *"글자빼고"*
  }
  document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
  return i
}, { 컷, PX, 밖, 위밖, 제목들: 요리.slice(0, 컷.length) })

const n = await 얹기(page)
console.log(`   ✅ 작은 격자 — 카드 ${n}개에 얹었다`)
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, '인덱스32컷-카드위-작은격자.png'), fullPage: true })

// 🔁 큰 격자(2열)로도 — 카드가 커서 그림이 어떻게 보이는지 다르다
const page2 = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
page2.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page2.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'big')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page2.goto('http://127.0.0.1:4378/hankki/', { waitUntil: 'networkidle' })
await page2.waitForTimeout(1200)
await page2.getByText('레시피', { exact: true }).last().click(); await page2.waitForTimeout(900)
const n2 = await 얹기(page2)
console.log(`   ✅ 큰 격자 — 카드 ${n2}개에 얹었다`)
await page2.waitForTimeout(500)
await page2.screenshot({ path: join(OUT, '인덱스32컷-카드위-큰격자.png'), fullPage: true })
await page2.close()

// ② 28px 실물 띠 — 그림끼리 견주기. ⛔줄이거나 키워서 눈속임하지 않는다(1배 ＋ 4배 나란히)
await page.evaluate(({ 컷, PX }) => {
  document.body.innerHTML = ''
  document.documentElement.style.background = '#faf6ee'
  document.body.style.cssText = 'margin:0;padding:18px 14px 26px;background:#faf6ee;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo",sans-serif'
  const h = document.createElement('div')
  h.innerHTML = `<b style="font-size:15px;color:#4a3f33">28px 실물 — 왼쪽이 진짜 크기, 오른쪽이 4배</b>
    <div style="font-size:11.5px;color:#8a7c6c;margin-top:3px">카드 크림색(#faf6ee) 위에 얹은 그대로</div>`
  h.style.cssText = 'margin-bottom:14px'
  document.body.appendChild(h)
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px 16px'
  for (const [키, url] of 컷) {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:9px'
    row.innerHTML = `<img src="${url}" width="${PX}" height="${PX}" style="display:block;object-fit:contain;flex:0 0 auto">
      <img src="${url}" width="${PX * 4}" height="${PX * 4}" style="display:block;object-fit:contain;image-rendering:pixelated;flex:0 0 auto">
      <span style="font-size:11px;font-weight:800;color:#5d3410">${키}</span>`
    wrap.appendChild(row)
  }
  document.body.appendChild(wrap)
}, { 컷, PX })
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '인덱스32컷-28px실물.png'), fullPage: true })

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ 두 장 → ${OUT}\n`)
