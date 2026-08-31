// 🔖 클립 인덱스가 **꾸민 표지(레꾸)를 해치나** — 창업자 판정용 (2026-08-18)
//
// 📮 창업자 *"너무크면 **꾸미기한거에 간섭되지않아?** 지저분해보일수도있고
//            **앱에서 어떻게보이는지를 모르겠다 실제로 안봐서**"*
//
// ⛔⛔ **맞는 지적이다 — 앞선 판(`_shot-클립크기-0818.mjs`)이 반쪽이었다.**
//    전부 **꾸미기 «안» 한 기본 표지**였다. 그런데 창업자가 이 기능을 시작할 때 한 말이
//    📮 *"바깥에 걸쳐서 넣는게 더 예쁜거 같아 **레꾸도 안해치고**"* 였다.
//    **정작 「레꾸를 해치나」를 한 장도 안 보여줬다.** 규칙 21·30 의 사촌 —
//    「내가 본 것」이 「유저가 볼 것」의 절반이면 판정이 틀린다.
//
// ⭐ 재료 = **앱에 «진짜로 들어 있는» 콩국수 샘플 표지**(`basics.js` `sample: true`).
//    ⛔ 꾸미기를 내가 지어내지 않는다 — 지어내면 그건 또 「실물이 아닌 것」이다(규칙 30).
//    🎯 게다가 이 표지는 **오른쪽 위(x 0.78 · y 0.26)에 무지개 스티커**가 있어
//       인덱스 자리와 정면으로 부딪힌다 = 판정하기 딱 좋은 표본이다.
//
// ⭐⭐ **z-index 3 때문에 인덱스가 «위»에 그려진다** — 2026-08-18 에 내가 넣은 값이다.
//    안 넣으면 꾸미기 스티커가 인덱스를 덮어 **단추가 안 눌렸다**(그때는 누르는 단추였다).
//    지금은 «표시용»으로 확정됐으니 **보여야 하고 = 위에 있어야 한다.**
//    📌 그래서 「덮는 것」은 버그가 아니라 **고른 값의 대가**다. 얼마나 덮는지를 재서 고른다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-클립꾸미기-0818.mjs
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

const 크기들 = (process.env.IDX_SIZES || '28,32,36,40,44').split(',').map(Number)
const 밖 = Number(process.env.IDX_SIDE || -4)    // G3 — right = 12px
const 위밖 = Number(process.env.IDX_TOP || 22)   // G3 — top  = -14px
// ✅✅ [창업자 2026-08-18] *"요리사모자 계란 일기장 숟가락이 괜찮을거같애"*
//     ＋ *"**요리사모자하트없는판 아까꺼도** 넣어줘"* → 어제 32컷의 `ck_27`(요리사모자＋클립 · 하트 없음)
//     ⭐ 「숟가락」이 셋이라(나무 `cl_15` · 계량 `cl_16` · 체크마테 `ck_30`) **다 넣는다** —
//        되물으면 한 번 더 왔다 갔다 하게 된다(규칙 31: 물어보는 횟수를 내가 줄인다).
const 고른컷 = (process.env.IDX_PICKS || 'cl_13,ck_27,cl_03,cl_01,cl_15,cl_16,ck_30').split(',')
// 크기 갈래 판은 3열이라 3컷만 들어간다 — **폭이 다른 셋**을 고른다(같은 높이인데 폭이 두 배 차이 난다)
const 크기컷 = (process.env.IDX_SIZEPICKS || 'cl_13,cl_03,cl_15').split(',')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

// ⭐ 폴더가 «둘»이다 — 클립 `cl_`(2026-08-18) ＋ 요리소품 `ck_`(2026-08-17).
//    창업자가 두 세트에서 섞어 골랐으므로 접두어로 폴더를 고른다.
const 폴더 = {
  cl: join(ROOT, 'docs/stickers/클립인덱스-창업자-2026-08-18/낱개'),
  ck: join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개'),
}
const 어디 = (k) => 폴더[k.slice(0, 2)] || 낱개
const url = (k) => 'data:image/png;base64,' + readFileSync(join(어디(k), `${k}.png`)).toString('base64')
for (const k of [...고른컷, ...크기컷]) if (!readdirSync(어디(k)).includes(`${k}.png`)) throw new Error(`⛔ ${k}.png 없다 — ${어디(k)}`)
const 그림 = Object.fromEntries([...new Set([...고른컷, ...크기컷])].map((k) => [k, url(k)]))

// ⭐ 앱이 «실제로» 쓰는 값을 그대로 가져온다 (규칙 30)
const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
// ⚠️ `allBasicRecipes` 는 «함수가 아니라 배열»이다(`basics.js:4339`). 첫 판에서 `()` 를 붙여 죽었다.
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
if (!샘플) throw new Error('⛔ 꾸민 표지 샘플을 못 찾았다 — basics.js 에 decor 가 있는 편이 없다')
console.log(`   🎨 표본 = 「${샘플.title}」 · 꾸미기 ${샘플.decor.length}컷 · 배경 ${샘플.decorBg}`)
// 인덱스 자리(오른쪽 위)에 뭐가 있나 — 미리 알고 찍는다
for (const it of 샘플.decor) if (it.x > 0.55 && it.y < 0.45) console.log(`      · 오른쪽 위에 ${it.type} ${it.key || it.text || ''} (x ${it.x.toFixed(2)} · y ${it.y.toFixed(2)} · s ${it.s})`)

const now = Date.now()
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이', '미역국', '갈치조림', '고등어구이', '잡채', '비빔밥', '카레']
// ⛔ 제목·id 만 갈아 끼우고 «꾸미기는 샘플 그대로» — 그래야 크기 차이만 남는다
const R = (i) => ({ ...샘플, id: 'x'.repeat(i + 1), title: 요리[i], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0, sample: false })
const state = { recipes: 요리.map((_, i) => R(i)), diary: [], seedV: BASICS_VERSION }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []

const 열기 = async (격자, 높이) => {
  const page = await b.newPage({ viewport: { width: 360, height: 높이 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1100)
  return page
}

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
    const d = c.querySelector('.fav-dot')
    if (d) {
      d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
      d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
      d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
      d.innerHTML = `<img src="${그림[고른컷[i % 열 % 고른컷.length]]}" style="display:block;height:${PX}px;width:auto" alt="">`
    }
    if (i % 열 === 0) 줄y.push({ px: PX, y: c.getBoundingClientRect().top + window.scrollY })
    i++
  }
  document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
  return 줄y
}, { 그림, 크기들, 밖, 위밖, 제목들: 요리, 열, 고른컷: 크기컷 })

// 📏 「레꾸를 얼마나 해치나」 — 인덱스가 꾸미기 조각을 덮은 «넓이»를 픽셀로.
//    ⭐ 상자 겹침이 아니라 **표지 넓이 대비 몇 %** 로도 낸다 — 사람이 읽을 수 있는 값이라야 판정이 된다.
// ⛔⛔ **첫 판이 「조각 0개」라고 «거짓말»했다** — `.decor-item`·`.decor-layer` 로 찾았는데
//    **`DecorLayer` 는 그 클래스를 안 쓴다**(아이템 div 에 class 가 «아예 없다» · DOM 을 덤프해 확인).
//    그러면 `querySelectorAll` 이 빈 배열을 주고, 그게 **「안 닿았다」로 읽힌다.**
//    📌 규칙 18 ⓘ 그대로 — 「검사가 통과했나」가 아니라 «무엇을 보고 통과했나».
//       하마터면 창업자에게 *"꾸미기를 하나도 안 건드린다"* 고 틀린 값을 줄 뻔했다.
// ✅ 진짜 표식 = **인라인 `style.left` 가 `%` 인 div** (`DecorLayer:218` = `left: ${it.x * 100}%`).
//    그 부모가 곧 «표지 영역»이다(`inset: 0`) — 이름표를 뺀 진짜 표지라 비율도 정확해진다.
const 해치기재기 = (page) => page.evaluate(() => {
  const 결과 = []
  for (const c of [...document.querySelectorAll('.grid-card')].filter((c) => c.style.display !== 'none')) {
    const img = c.querySelector('.fav-dot img')
    if (!img) continue
    const r = img.getBoundingClientRect()
    const 조각목록 = [...c.querySelectorAll('div')].filter((d) => /%$/.test(d.style.left || '') && d.getBoundingClientRect().width > 0)
    if (!조각목록.length) throw new Error('⛔ 꾸미기 조각을 못 찾았다 — 셀렉터가 또 낡았다. 「0개」로 넘어가지 말 것')
    const 표지 = 조각목록[0].parentElement
    const t = 표지.getBoundingClientRect()
    const iw = Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left))
    const ih = Math.max(0, Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top))
    const 덮은넓이 = iw * ih
    const 조각들 = []
    for (const s of 조각목록) {
      const g = s.getBoundingClientRect()
      const w = Math.min(r.right, g.right) - Math.max(r.left, g.left)
      const h = Math.min(r.bottom, g.bottom) - Math.max(r.top, g.top)
      if (w > 0 && h > 0) 조각들.push({ 가린비율: +(w * h / (g.width * g.height) * 100).toFixed(0) })
    }
    결과.push({
      높이: Math.round(r.height),
      표지: `${Math.round(t.width)}×${Math.round(t.height)}`,
      꾸미기: 조각목록.length,
      덮은비율: +(덮은넓이 / (t.width * t.height) * 100).toFixed(1),
      건드린조각: 조각들.length,
      제일많이가린조각: 조각들.length ? Math.max(...조각들.map((x) => x.가린비율)) : 0,
    })
  }
  return 결과
})

const 찍기 = async (격자, 열, 이름, 높이) => {
  const page = await 열기(격자, 높이)
  const 줄y = await 얹기(page, 열)
  await page.waitForTimeout(600)
  const 잰것 = await 해치기재기(page)
  await page.screenshot({ path: join(OUT, `${이름}.png`), fullPage: true })
  writeFileSync(join(OUT, `${이름}.json`), JSON.stringify(줄y))
  console.log(`   ✅ ${이름}`)
  const 묶음 = {}
  for (const x of 잰것) (묶음[x.높이] ||= []).push(x)
  for (const [h, xs] of Object.entries(묶음).sort((a, b) => a[0] - b[0])) {
    const a = xs[0]
    console.log(`      ${String(h).padStart(2)}px — 표지 ${a.표지} 중 **${a.덮은비율}%** 를 덮는다 · 꾸미기 조각 ${a.건드린조각}개에 닿음 (제일 많이 가린 조각 ${a.제일많이가린조각}%)`)
  }
  await page.close()
}

// 📋 ② 창업자가 고른 컷 «전부»를 한 크기로 — 「어떤 그림이 예쁜가」를 꾸민 표지 위에서 고른다
//    ⭐ 크기 갈래 판은 3열이라 3컷만 들어간다. 고르는 판은 «따로» 있어야 한다.
const 그림판 = async (PX, 격자 = 'small', 높이 = 1180) => {
  const page = await 열기(격자, 높이)
  await page.evaluate(({ 그림, PX, 밖, 위밖, 제목들, 고른컷 }) => {
    const 남길 = new Set(제목들)
    const 카드들 = [...document.querySelectorAll('.grid-card')]
    카드들.forEach((c) => { if (!남길.has(c.querySelector('.name')?.textContent)) c.style.display = 'none' })
    let i = 0
    for (const c of 카드들.filter((c) => c.style.display !== 'none')) {
      if (i >= 고른컷.length) { c.style.display = 'none'; continue }
      const d = c.querySelector('.fav-dot')
      if (d) {
        d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
        d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
        d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
        d.innerHTML = `<img src="${그림[고른컷[i]]}" style="display:block;height:${PX}px;width:auto" alt="">`
      }
      i++
    }
    document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
  }, { 그림, PX, 밖, 위밖, 제목들: 요리, 고른컷 })
  await page.waitForTimeout(600)
  const 이름 = `클립고른것-${격자 === 'big' ? '큰격자' : '작은격자'}-${PX}px`
  await page.screenshot({ path: join(OUT, `${이름}.png`), fullPage: true })
  console.log(`   ✅ ${이름} — ${고른컷.join(' · ')}`)
  await page.close()
}

await 찍기('small', 3, '클립꾸미기-작은격자', 880)
await 찍기('big', 2, '클립꾸미기-큰격자', 1720)
for (const px of (process.env.IDX_ALL || '36').split(',').map(Number)) {
  await 그림판(px, 'small', 1180)
  await 그림판(px, 'big', 1720)
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
