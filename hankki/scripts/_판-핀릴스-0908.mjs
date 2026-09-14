// 🎬🎬 **사용법 릴스 「이번 주에 먹고 싶은 것, 같이 골라요」** — 짜임을 갖춘 판 (2026-09-08)
//
// 📮 창업자 = *"가족이 모여서 핀을 꼽고 주간식단표를 짜보라는 뜻이었어"*
//        ＋ *"이번주에 먹고 싶은 것 아이도 아빠도 엄마도 같이 골라요의 느낌"*
//        ＋ *"콩국수 빼고"* · *"가을이니까"* · *"저거 너무 작아서 하나도 안보이고"*
//        ＋ *"영상을 예쁘게 짜임도 넣고해야지"*
//
// ⛔⛔ **첫 판이 왜 곤란했나 — 내가 «화면 녹화»만 던졌다.**
//    앱 화면이 1080 폭에 그대로 들어가 글자가 손톱만 했고, 자막은 검은 알약 하나뿐이라
//    「짜임」이랄 게 없었다. 소소 릴스 셋(①②③)은 전부 «종이 위에 앉힌» 판이었는데 그걸 안 따랐다.
//
// ⭐⭐ **그래서 짜임을 셋으로 나눴다** (바탕 → 앱 → 앞면)
//    ⑴ **바탕** = 종이색 모눈 한 장 (1080×1920)
//    ⑵ **앱** = 실제 녹화를 760 폭 카드로 앉힌다 — 가운데에 크게, 그림자로 떠 보이게
//    ⑶ **앞면** = 장면마다 다른 한 장 — 위에 손글씨 제목, 아래에 자막, 곰펭 컷
//    📌 이렇게 하면 앱은 «작아지지 않고» 글자는 «커진다» — 첫 판과 정확히 반대다.
//
// 🍂 **레시피는 가을 것으로.** 콩국수는 «여름 샘플 표지»라 뺐다(창업자 *"콩국수 빼고"*).
//    ⏳ 창업자 = *"가을버전으로 하나 만들어서 올려두자"* → 샘플 표지 가을판은 «다음 일»이다.
//
// ⛔ 흉내내지 않는다 — 진짜 `dist` 를 띄우고 진짜 핀을 누른다(절대원칙 30).
// ⛔ 핀·칩을 못 찾으면 영상을 내지 않는다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-핀릴스-0908.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const S = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad'
const OUT = join(S, '핀릴스')
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })
const FF = process.env.FF || join(S, 'ff/node_modules/ffmpeg-static/ffmpeg')
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 스 = (k) => b64(join(ROOT, `src/assets/sharepool/${k}.png`))

// 📐 짜임 값 — 앱 카드는 «가운데 크게», 위아래로 글자 자리를 남긴다
const W = 1080, H = 1920
// ✂️ 창업자 = *"그림 아래쪽을 조금 잘라내고 설명을 위로 올리고 잘보이게 해줘"*
//    → 앱 영상에서 **아래 170px(하단 탭바 언저리)을 잘라낸다.** 카드가 짧아지니 자막이 그만큼 올라온다.
const 영상W = 810, 영상H = 1440
const 잘라 = 170
const 앱크롭H = 영상H - 잘라
const 앱W = 760, 앱H = Math.round(앱W * 앱크롭H / 영상W)
const 앱X = Math.round((W - 앱W) / 2), 앱Y = 268

// ── ① 진짜 앱을 녹화한다 (자막 없이 «깨끗하게») ─────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
// 🍂 가을 상 — 샘플 표지가 붙은 편은 «쓰지 않는다»(콩국수)
// 👨‍👩‍👧 누가 무엇을 고르나 — 창업자 *"아이랑 아빠랑 바뀐 듯 엄마는 미역국한다며"*
//    ⛔ 지난 판은 «화면에 먼저 뜬 카드»를 차례로 눌러서 **아이가 김치찌개, 아빠가 떡볶이**를 골랐고
//       자막은 엉뚱하게 「버섯전골」이라 했다. **자막과 화면이 어긋났다.**
//    ⭐ 이제 «누가 무엇을»을 여기서 못 박고, 자막은 **실제로 꽂힌 카드 제목을 읽어서** 만든다(아래 가르기).
//    📌 엄마 = 미역국 — 주간 식단표 시안(`_판-식단표시안-0908.mjs`)의 한 주 상과 같게 맞췄다.
const 가족 = [
  { 누구: '아이', 요리: '국물 떡볶이' },
  { 누구: '아빠', 요리: '돼지고기 김치찌개' },
  { 누구: '엄마', 요리: '소고기 미역국' },
]
// 🍂 화면에 남길 편 — 가족이 고르는 셋 ＋ 가을 상 셋. ⛔샘플 표지 편(콩국수)은 안 쓴다
//    📮 창업자 = *"가을이니까 꽃게조림이나 탕에 하면 더 좋고"* → **꽃게탕**(9/7 열림 · 검수 창업자)
//    ⛔ **고구마맛탕을 뺐다** — `from 2026-10-05` 라 **아직 안 열린 편**이다(실측 `recipe.mjs`).
//       유저 폰엔 없는 걸 홍보에 띄우면 거짓 약속이 된다. 아래 가르기가 이제 그걸 막는다.
//    📮 창업자 = *"꽃게조림 월요일에 탕, 게장이랑 같이 올라갔어"* → **꽃게간장조림도 9/7에 열렸다**(실측)
//    ⛔ 버섯 솥밥은 뺐다 — 「검수 창업자」 표시가 없다(실측 recipe.mjs). 홍보엔 검수된 편만 쓴다.
const 고를것 = [...가족.map((g) => g.요리), '꽃게간장조림', '꽃게탕', '두부 들깨 버섯전골']
const 샘플 = allBasicRecipes.filter((r) => r.sample).map((r) => r.title)
const 겹침 = 고를것.filter((t) => 샘플.includes(t))
if (겹침.length) throw new Error(`⛔ 샘플 표지 편이 섞였다 — ${겹침.join(', ')} (창업자 "콩국수 빼고")`)

// 📅📅 **아직 «안 열린» 편은 홍보에 못 쓴다** — 날짜가 오면 저절로 열리는 편이 있다(`from`).
//    ⛔ 지난 판에 고구마맛탕(`from 2026-10-05`)이 들어 있었다 — 유저 폰엔 «없는» 요리다.
//    ⭐ 기억으로 고르지 않게 «파일을 읽어» 막는다(절대원칙 29).
const { todayKST } = await import('../src/today.js')
const 오늘 = todayKST()
const 안열림 = 고를것.filter((t) => {
  const r = allBasicRecipes.find((x) => x.title === t)
  return r?.from && /^\d{4}-\d{2}-\d{2}$/.test(r.from) && r.from > 오늘
})
if (안열림.length) throw new Error(`⛔ 아직 안 열린 편이다 (오늘 ${오늘}) — ${안열림.join(', ')}`)

const now = Date.now()
const state = {
  recipes: 고를것.map((t, i) => {
    const r = allBasicRecipes.find((x) => x.title === t)
    if (!r) throw new Error(`⛔ 없는 레시피다 — ${t}`)
    return { id: 'r' + i, title: t, category: r.category, time: r.time, thumb: 'icon', icon: r.icon,
      ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000,
      source: 'user', status: 'sorted', favorite: false, cooked: 0 }
  }),
  diary: [], seedV: BASICS_VERSION,
  // 🏷🏷 **콩국수(여름 샘플 표지)를 «앱의 정식 통로»로 뺀다** — 창업자 *"콩국수 빼고"*
  //   ⛔ DOM 을 손으로 감추지 않는다(그건 흉내다 · 절대원칙 30).
  //   ⭐ 앱엔 이미 「유저가 지운 기본 레시피는 되살리지 않는다」가 있다(store.jsx:124 removedSeedIds).
  //      그 자리에 넣으면 «진짜 유저가 지운 것»과 같은 상태로 돈다.
  //   ⭐ 이제 «고를것 여섯 편만» 남긴다 — 그래야 아이·아빠·엄마가 고를 카드가 첫 화면에 다 보인다
  //      (지난 판은 기본 75편이 섞여 들어와 «맨 앞에 뜬 카드»를 눌렀고, 그래서 아이가 김치찌개를 골랐다).
  //   ⛔ «고를것만 남기기»로는 모자란다 — 같은 제목이 «기본 편 ＋ 내가 심은 편» 둘이 되어
  //      제목으로 카드를 집을 때 둘이 잡힌다(실측: strict mode violation, 국물 떡볶이 2개).
  //      그래서 **기본 편은 통째로 빼고** 위 여섯 편만 남긴다.
  removedSeedIds: allBasicRecipes.map((r) => r.id),
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// ⭐ 폭 405 = `.app-frame { max-width: 440px }`(styles.css:292) 안쪽 — 540 이면 양옆이 프레임 배경이 된다
// ⛔⛔ **playwright 는 뷰포트를 영상 크기에 «늘려 주지 않는다» — 남는 데를 회색으로 채운다.**
//    첫 판이 그래서 카드 왼쪽 위 사분면에만 앱이 들어가고 나머지가 회색이었다(실측).
// ✅ 그래서 «뷰포트를 810×1440 으로 크게 잡고 페이지를 2배 확대»한다 —
//    확대하면 레이아웃 폭이 405 로 잡혀(.app-frame max-width 440 안쪽) 폰 그대로 그려지고,
//    실제 픽셀은 두 배라 카드에 크게 앉혀도 안 뭉갠다.
const ctx = await b.newContext({ viewport: { width: 810, height: 1440 }, deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 810, height: 1440 } } })
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:gridSize', 'small')   // ⭐ 3열이라야 가족 셋이 고른 것이 한 화면에 같이 보인다
}, state)
const p = await ctx.newPage()
// ⏱⛔⛔ **녹화는 «이 순간»부터 돈다 — 장면 시각도 여기서 잰다.**
//   지난 판은 준비(불러오기·확대·탭 옮기기)가 끝난 뒤에 0초를 잡았다.
//   그래서 잘라 붙일 때 «5초쯤 앞»의 화면이 실려 첫 장면에 **홈 화면(로그인 띠·소식 카드)**이 나왔다
//   — 창업자 *"첫 화면 이상한 것도 수정하고"* 가 정확히 이 사고다(실측 검수_1.2.jpg).
const t녹화 = Date.now()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
// ⛔ addInitScript 로는 못 넣는다 — 그때는 document.documentElement 가 «아직 없다»(null 에 appendChild 했다).
//    문서가 선 «뒤에» 넣는다. 앱은 높이를 JS 로 재므로 확대 뒤 한 박자 기다린다.
// ⛔⛔ 확대만 하면 «키가 두 배»가 된다 — 앱이 화면 높이를 JS 로 재서 --app-height:1440px 를 넣는데
//    확대된 눈금에서 그 값이 2880 으로 읽혀 카드가 화면 밖으로 밀린다(실측: .app-frame 높이 2880).
//    그래서 확대 배수만큼 나눈 높이를 «못 박는다».
await p.addStyleTag({ content: 'html{zoom:2} .app-frame{height:720px !important}' })
await p.waitForTimeout(1500)
await p.getByText('레시피', { exact: true }).last().click()
await p.waitForTimeout(1200)

// 🎯 핀은 «자리»가 아니라 «제목»으로 찾는다 — 창업자 *"아이랑 아빠랑 바뀐 듯"*
//    ⛔ nth(0)·nth(1) 로 누르면 목록 차례가 바뀌는 순간 «누가 무엇을 골랐는지»가 조용히 뒤집힌다.
const 핀 = (제목) => p.locator('.grid-card')
  .filter({ has: p.locator('.name', { hasText: 제목 }) }).locator('.fav-dot').first()
for (const g of 가족) {
  if (!(await 핀(g.요리).count())) throw new Error(`⛔ ${g.누구}가 고를 카드가 화면에 없다 — ${g.요리}`)
}
if (!(await p.locator('.fav-dot').count())) throw new Error('⛔ 핀 단추(.fav-dot)를 못 찾았다 — 영상을 내지 않는다')
// ⚠️ 확대(zoom)를 쓰면 «자와 눈금이 갈린다» — getBoundingClientRect 는 확대된 레이아웃 값(0~720)을 주는데
//    window.innerHeight 는 확대 «전» 값(1440)이다. 그대로 견주면 늘 통과하거나 늘 막힌다(실제로 막혔다).
//    그래서 화면 높이를 확대 배수로 나눠 같은 자로 맞춘다.
const 보이나 = await p.evaluate(() => {
  const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1
  const 화면 = window.innerHeight / z
  return [...document.querySelectorAll('.fav-dot')].slice(0, 3)
    .map((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= 화면 })
})
if (보이나.length < 3 || 보이나.some((v) => !v)) throw new Error(`⛔ 핀 셋이 한 화면에 안 들어온다 — ${JSON.stringify(보이나)}`)

// 🔍🔍 **창업자 = *"골라요에서 그 부분을 클로즈업 하고 표시를 해야할 것 같아"***
//    → 「고르는」 장면(②③④⑥)은 앱을 통째로 두지 않고 **핀 언저리만 잘라 확대**하고,
//      그 위에 **동그라미 표시**를 얹는다. 어디를 누르는지가 이 릴스의 전부다.
//    ⛔ 좌표를 어림하지 않는다 — 진짜 단추를 재서 그 자리에 그린다.
//    ⛔⛔ **`zoom` 을 곱하지 않는다** — 첫 판이 그렇게 짰다가 핀 자리가 **x=1451**(영상 폭 810 밖!)로 나와
//       동그라미가 앱 카드 «오른쪽 바깥»에 그려졌다(실측 로그). 확대를 쓰면 rect 가 확대 «전»인지 «후»인지
//       브라우저마다·속성마다 갈린다. **그래서 눈금을 아예 안 믿는다.**
//    ✅ 대신 «화면 폭에 대한 비율»로 잰다 — 영상은 이 화면을 그대로 810×1440 으로 담으므로
//       `rect / clientWidth × 810` 이면 확대가 몇 배든 «반드시» 맞는다.
const 자리재기 = (골라) => p.evaluate((골라) => {
  const d = document.documentElement
  const kx = 810 / d.clientWidth, ky = 1440 / d.clientHeight
  const 잰다 = (e) => {
    const r = e.getBoundingClientRect()
    return { x: (r.left + r.width / 2) * kx, y: (r.top + r.height / 2) * ky,
      w: r.width * kx, h: r.height * ky }
  }
  if (골라.종 === '핀') {
    const 카드 = [...document.querySelectorAll('.grid-card')]
      .find((c) => c.querySelector('.name')?.textContent.trim() === 골라.제목)
    const e = 카드?.querySelector('.fav-dot')
    return e ? 잰다(e) : null
  }
  const e = [...document.querySelectorAll('.pill')].find((x) => x.innerText.trim().startsWith(골라.글))
  return e ? 잰다(e) : null
}, 골라)
const 핀중심 = {}
for (const g of 가족) {
  const c = await 자리재기({ 종: '핀', 제목: g.요리 })
  if (!c) throw new Error(`⛔ ${g.요리} 핀 자리를 못 쟀다`)
  if (c.x < 0 || c.x > 810 || c.y < 0 || c.y > 1440)
    throw new Error(`⛔ ${g.요리} 핀이 영상 밖이다 — ${JSON.stringify(c)}`)
  핀중심[g.요리] = c
}
const 칩중심 = (글) => 자리재기({ 종: '칩', 글 })

// 잘라낼 칸은 영상과 «같은 비»(810:1440)라야 앱 카드에 넣을 때 안 늘어난다
const 확대배 = 1.9
const 확대칸 = (c) => {
  // 잘라낸 «뒤» 카드 비(810 : 앱크롭H)와 같아야 안 늘어난다
  const cw = Math.round(영상W / 확대배 / 2) * 2, ch = Math.round(cw * 앱크롭H / 영상W / 2) * 2
  const cx = Math.max(0, Math.min(영상W - cw, Math.round(c.x - cw / 2)))
  const cy = Math.max(0, Math.min(앱크롭H - ch, Math.round(c.y - ch / 2)))
  return { cw, ch, cx, cy }
}

// ⏱ 장면마다 «녹화 시각»을 적어 둔다 — 나중에 이 시각으로 잘라 붙인다
const 장면 = []
// 표시 = { 점, 확대, 말 } — 점은 «영상 픽셀» 자리
const 찍자 = async (이름, 초, 할일, 표시) => {
  const 시작 = (Date.now() - t녹화) / 1000
  if (할일) await 할일()
  await p.waitForTimeout(Math.round(초 * 1000))
  장면.push({ 이름, 시작: +시작.toFixed(2), 길이: +(((Date.now() - t녹화) / 1000) - 시작).toFixed(2), 표시 })
}

await 찍자('①물음', 2.6)
// ⭐ 「누가 무엇을」이 화면과 자막에서 «같은 곳»에서 나온다 — 어긋날 수가 없다
const 이름 = { 아이: '②아이', 아빠: '③아빠', 엄마: '④엄마' }
for (const g of 가족) {
  await 찍자(이름[g.누구], 3.2, () => 핀(g.요리).click(),
    { 점: 핀중심[g.요리], 확대: true, 말: '톡', 요리: g.요리, 누구: g.누구 })
}

const 칩글 = await p.evaluate(() => [...document.querySelectorAll('.pill')].map((e) => e.innerText.trim()))
if (!칩글.some((t) => t.startsWith('해볼 것'))) throw new Error(`⛔ 「해볼 것」 칩이 안 섰다 (칩 줄 = ${칩글.join(' / ')})`)
const 해볼것칩 = await 칩중심('해볼 것')
if (!해볼것칩) throw new Error('⛔ 「해볼 것」 칩 자리를 못 쟀다')
await 찍자('⑤서랍', 3.0, null, { 점: 해볼것칩, 확대: false, 말: '여기!' })
// ♥ 최애는 «아이가 고른 것»을 한 번 더 누른다 — 같은 카드라야 「모자 → 하트」가 눈에 보인다
const 최애요리 = 가족[0].요리
await 찍자('⑥최애', 3.4, () => 핀(최애요리).click(),
  { 점: 핀중심[최애요리], 확대: true, 말: '한 번 더', 요리: 최애요리 })

const 칩글2 = await p.evaluate(() => [...document.querySelectorAll('.pill')].map((e) => e.innerText.trim()))
if (!칩글2.some((t) => t.startsWith('최애'))) throw new Error(`⛔ 「최애」 칩이 안 섰다 (칩 줄 = ${칩글2.join(' / ')})`)
const 최애칩 = await 칩중심('최애')
await 찍자('⑦다음주', 3.2, () => p.locator('.pill').filter({ hasText: '최애' }).first().click(),
  최애칩 ? { 점: 최애칩, 확대: false, 말: '여기!' } : undefined)
// 🔚 마무리는 «전체»로 되돌린다 — 최애 하나만 남은 휑한 화면으로 끝나면
//    「한 주가 이렇게 짜여요」라는 말과 화면이 어긋난다(실측 v_21.5.jpg).
await 찍자('⑧마무리', 3.2, () => p.locator('.pill').filter({ hasText: '전체' }).first().click())

await ctx.close(); await b.close(); srv.close()
if (오류.length) { console.log('⛔ 화면 오류'); 오류.forEach((e) => console.log('  ' + e)); process.exit(1) }
const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
if (!webm) throw new Error('⛔ 녹화 파일이 안 생겼다')
console.log('🎥 녹화 · 장면', 장면.map((s) => `${s.이름}(${s.길이}s)`).join(' '))

// ── ② 짜임 — 바탕 한 장 ＋ 장면마다 앞면 한 장 ────────────────────────────
// 🎨🎨 **창업자 = *"짜임색이랑 스타일 바꾸자"***
//   ⭐ 우리 릴스의 «이미 정해진 결»로 맞춘다 — 소소 릴스 셋이 쓴 색·글씨체다
//      (scripts/_릴스-레꾸자랑시안-0905.mjs:42 — 크림 #fbf5e8 → 살구 #f3dcc4 · 표장 갈색 #5d3410 · Jua)
//   ⛔ 모눈 종이(회녹색 #efe9dd ＋ Gaegu)는 우리 어디에도 없던 결이었다. 버린다.
//   ⚠️ 글씨체 이름은 «'GowunDodum'»(붙여 쓴다) — 'Gowun Dodum' 으로 적으면 조용히 딴 글씨가 된다
//      (design/promo/fonts-embed.css 실측).
// 🌸 창업자 = *"색은 살구 그만쓰고 핑크계열이나 연보라?"* → **연핑크 → 연보라** 그러데이션으로 간다.
//    ⭐ 글자는 표장 갈색(#5d3410) 그대로 둔다 — 그게 우리 브랜드 색이고, 연보라 위에서도 잘 읽힌다.
//    ⭐ 표시(동그라미·말풍선)는 주황 대신 **자두빛**으로 — 핑크 바탕에서 주황은 탁해 보인다.
// 🎨🎨 **왜 촌스러웠나 — 창업자 *"하.. 왜 뭔가 촌스럽지.. 이유를 찾아봐줄래??"***
//   실제 판을 열어 세어 보고 찾은 것 다섯. (전부 «장식이 모자라서»가 아니라 «많고 안 맞아서»였다)
//   ⑴ **색이 계열째 부딪혔다** — 바탕은 찬 라일락인데 글자는 따뜻한 표장 갈색(#5d3410)이었다.
//      게다가 앱 화면 속 파란 「모아보기」 단추까지 들어와 **웜 갈색·쿨 보라·파랑 셋**이 한 화면에 섰다.
//      ✅ 글자를 바탕과 «같은 계열»의 진한 자두먹(#43263f)으로 옮긴다. 강조는 하나(#c2417e)만.
//   ⑵ **이모지를 썼다**(👧🧔👩) — 우리 앱은 유니코드 이모지를 «금지»한다(CLAUDE.md).
//      기기마다 그림이 달라 우리 그림체와 절대 안 맞는다. ✅ 글자만 남긴다.
//   ⑶ **장식이 겹겹이** — 실선 링 ＋ 점선 링 ＋ 별 넷 ＋ 말풍선 ＋ 그림자 넷. ✅ 링 하나 ＋ 반짝임 셋로 줄인다.
//   ⑷ **글자 크기가 넷**(84·74·54·40) ＋ 자막에 흰 그림자까지. ✅ 두 종(제목 82 · 자막 52)으로.
//   ⑸ **자리가 장면마다 흔들렸다** — 제목이 한 줄/두 줄이라 아래로 자라고, 곰펭 컷이 장면마다
//      왼아래·오른아래·오른위로 옮겨 다녔다. ✅ 제목·꼬리표·자막·컷 «자리를 못 박고» 아래서 잰다.
//   📌 창업자 물음 *"짜임에 색+무늬를 넣고 글자색을 바꾸면 덜 촌스러울까"* →
//      **글자색은 맞다(⑴). 무늬는 더 넣으면 반대로 간다** — 이미 물방울 무늬 ＋ 그러데이션 ＋ 그림자가
//      겹쳐 있었다. 무늬는 «거의 안 보이게» 한 겹만 남긴다.
const 크림 = '#fdf5f9', 살구 = '#e9e0f7', 먹 = '#43263f', 팥 = '#c2417e'
const 갈 = 먹   // 옛 이름을 쓰는 자리가 남아 있어 같은 값으로 잇는다
const 바탕HTML = `<style>${폰트}
*{margin:0;padding:0}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;
  /* 🧵 무늬는 «거의 안 보이게» 한 겹만 — 아주 연한 사선. 물방울(진하기 .055)은 빼서 배경이 조용해졌다 */
  background:
    repeating-linear-gradient(135deg, rgba(67,38,63,.028) 0 2px, transparent 2px 26px),
    linear-gradient(180deg,${크림} 0%,#f4ecfa 55%,${살구} 100%)}
.hole{position:absolute;left:${앱X}px;top:${앱Y}px;width:${앱W}px;height:${앱H}px;border-radius:44px;
  background:#fff;box-shadow:0 30px 66px rgba(60,35,10,.26)}
/* ⛔ 로고를 여기(모든 장면 배경)에 깔았다가 뺐다 — 창업자 *"아니아니ㅠ 마지막 페이지에 해달라는거였오"*
      ＋ *"따로 페이지 하나 만들어서…"* → 로고는 **맨 끝 «끝장» 한 페이지**에만 든다(아래 끝장HTML). */
</style><div class="hole"></div>`

// 🐻🐻 **끝장(마지막 페이지)** — 앱 화면 없이 «로고 한 장»으로 닫는다.
//    ⭐ 광고는 마지막에 이름을 남기는 것이라, 여기선 앱을 안 보여주고 로고·한 줄만 크게 둔다.
const 끝장HTML = `<style>${폰트}
*{margin:0;padding:0}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;display:flex;
  flex-direction:column;align-items:center;justify-content:center;gap:44px;
  background:
    repeating-linear-gradient(135deg, rgba(67,38,63,.028) 0 2px, transparent 2px 26px),
    linear-gradient(180deg,${크림} 0%,#f4ecfa 55%,${살구} 100%)}
img.mark{width:520px;filter:drop-shadow(0 14px 30px rgba(93,52,16,.2))}
.line{font-family:'Jua';color:${갈};font-size:64px;letter-spacing:-.02em;text-align:center;line-height:1.3}
.line b{color:${팥}}
.store{font-family:'Jua';color:rgba(93,52,16,.72);font-size:40px}
.cut{position:absolute;filter:drop-shadow(0 14px 22px rgba(60,35,10,.22))}
</style>
<img class="mark" src="${b64(join(ROOT, 'design/promo/logo/한끼로고-곰ㅎ-투명-2507.png'))}">
<div class="line">이번 주 밥상,<br><b>가족이 같이 골라요</b></div>
<div class="store">플레이스토어에서 「한끼」</div>
<img class="cut" src="${스('gp_duotb')}" style="right:40px;bottom:40px;height:250px">`

const 앞면 = (제목, 자막, 컷, 옵션 = {}) => `<style>${폰트}
*{margin:0;padding:0}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:transparent}
/* 🔲 앱 카드 «모서리»를 종이색으로 덮어 둥글게 보이게 한다 (영상은 네모라서) */
/* 🔲 앱 카드 모서리 — 바탕 그러데이션과 «같은 색»이라야 안 뜬다 → 종이 대신 조각을 덮지 않고
   테두리 링으로 둥글려 준다 (색을 못 맞추면 네모 자국이 남는다) */
.frame{position:absolute;left:${앱X - 6}px;top:${앱Y - 6}px;width:${앱W + 12}px;height:${앱H + 12}px;
  border:6px solid rgba(93,52,16,.16);border-radius:50px;box-sizing:border-box;
  box-shadow:inset 0 0 0 8px ${크림}}
/* 📐📐 창업자 = *"재목이 위치가 다달라.. 눈으로 다 재보고 검수해서"*
   ⛔ 옛 판은 제목이 «위에서부터» 자라서 한 줄이냐 두 줄이냐에 따라 아래 여백이 달라졌다.
   ✅ 이제 제목·꼬리표·자막 모두 **높이를 못 박은 칸 안에서 가운데**로 선다 —
      글자가 길어져도 칸이 안 움직인다. 아래 검수 가르기가 장면마다 실제로 재서 확인한다. */
.head{position:absolute;left:60px;right:60px;top:60px;height:176px;display:flex;
  align-items:center;justify-content:center;text-align:center;font-family:'Jua';
  color:${먹};font-size:82px;line-height:1.14;letter-spacing:-.02em}
.head b{color:${팥}}
/* 🏷 꼬리표 — ⛔이모지를 뺐다(⑵). 자리는 늘 같은 곳, 없는 장면은 그냥 비워 둔다 */
.tag{position:absolute;left:50%;top:${앱Y - 86}px;transform:translateX(-50%);font-family:'Jua';
  background:${먹};color:${크림};font-size:33px;padding:9px 30px;border-radius:999px;letter-spacing:.01em}
/* 📝 창업자 = *"아래 설명문구가 너무 연하고 작아"* → **크게(52px) · 진하게(표장 갈색) · 굵게**
   ⛔ 흐린 회갈색(rgba .62)은 폰에서 자막으로 안 읽힌다. 강조만 진하게 두면 나머지가 배경이 된다. */
.sub{position:absolute;left:60px;right:60px;top:${앱Y + 앱H + 26}px;height:170px;display:flex;
  align-items:center;justify-content:center;text-align:center;
  /* 📮 창업자 = *"아래 글씨체가 좀 별론데.."* → 고운돋움(얇고 밋밋)에서 **제목과 같은 Jua** 로.
     ⭐ 한 영상에 글씨체는 하나가 깔끔하고, Jua 는 획이 굵어 폰에서 자막으로 잘 읽힌다. */
  font-family:'Jua';color:${먹};font-size:52px;line-height:1.34;letter-spacing:-.01em}
.sub b{color:${팥}}
.cut{position:absolute;filter:drop-shadow(0 14px 22px rgba(60,35,10,.22))}
/* 🔴 «여기를 누른다» 표시 — 링 하나 ＋ «퍼지는 물결»(진짜 누른 느낌) ＋ 반짝임 셋
   📮 창업자 = *"효과도 톡이아니라 진짜 효과가 들어가야하지 않을까"*
   ⭐ 그래서 말풍선 「톡」을 **없앴다**. 대신 손가락이 눌렀을 때처럼 **물결이 퍼져 나간다** —
      앞면을 «여러 장» 그려서(아래 물결칸) 영상으로 돌리므로 «진짜 움직인다». */
.ring{position:absolute;border:8px solid ${팥};border-radius:999px;box-sizing:border-box;
  box-shadow:0 0 0 6px rgba(255,255,255,.85)}
.wave{position:absolute;border-radius:999px;box-sizing:border-box;border:6px solid ${팥}}
/* ✨ 창업자 = *"골랐어요에 클립들에 반짝반짝효과같은거 넣어주고"*
   → 꽂는 순간 «반짝임» 넷을 동그라미 둘레에 뿌린다(그림 한 장이라 크기·각도로 리듬을 준다) */
.spark{position:absolute;width:var(--s);height:var(--s);transform:translate(-50%,-50%) rotate(var(--rot));
  background:${팥};opacity:.92;
  clip-path:polygon(50% 0%,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0% 50%,42% 42%);
  filter:drop-shadow(0 0 10px rgba(184,71,126,.55))}

</style>
<div class="frame"></div>
<div class="head"><span>${제목}</span></div>
${옵션.꼬리표 ? `<div class="tag">${옵션.꼬리표}</div>` : ''}
<!-- ⛔ flex 칸 안에 글자를 «그냥» 넣으면 <br> 이 안 먹는다(익명 flex 아이템으로 뭉친다) —
     실측: 「가족이 모여 앉아먹고 싶은 걸…」 처럼 두 줄이 한 줄로 붙었다. span 으로 감싼다. -->
<div class="sub"><span>${자막}</span></div>
${컷 || ''}`

// 표시 자리 셈 — 잘라 확대한 장면은 «자른 칸» 기준으로 다시 잰다
// 🌊 물결칸 t(0~1) — 0에서 링에 딱 붙어 있다가 커지며 사라진다. 앞면을 여러 장 그려 «움직이게» 한다.
const 표시HTML = (표시, t = 0) => {
  if (!표시) return ''
  const { 점, 확대 } = 표시
  const 칸 = 확대 ? 확대칸(점) : { cw: 영상W, ch: 앱크롭H, cx: 0, cy: 0 }
  const 배 = 앱W / 칸.cw
  const x = 앱X + (점.x - 칸.cx) * 배
  const y = 앱Y + (점.y - 칸.cy) * 배
  // ⭕ 핀은 동그라미, 칩은 알약 — «그 물건 크기»에 맞춘다(원으로 그리면 칩이 화면 반을 덮는다)
  const 여유 = 26
  const w = Math.max(96, Math.round(점.w * 배)) + 여유 * 2
  const h = Math.max(96, Math.round(점.h * 배)) + 여유 * 2
  const 상자 = (dx, cls, style = '') =>
    `<div class="${cls}" style="left:${Math.round(x - w / 2 - dx)}px;top:${Math.round(y - h / 2 - dx)}px;` +
    `width:${Math.round(w + dx * 2)}px;height:${Math.round(h + dx * 2)}px;${style}"></div>`
  // 🌊 물결 두 개 — 위상을 반 칸 어긋내 «계속 퍼지는» 것처럼 보이게
  const 물결 = [t, (t + 0.5) % 1].map((u) =>
    상자(10 + u * 130, 'wave', `opacity:${(0.55 * (1 - u)).toFixed(3)};border-width:${(7 - 4 * u).toFixed(1)}px`)).join('')
  // ✨ 반짝임 셋 — 크기가 t 에 따라 커졌다 작아진다(깜빡임)
  const 반짝 = 확대 ? [[0.78, -0.74, 44, 0, 0], [-0.8, -0.46, 30, 25, 0.33], [0.74, 0.7, 26, -15, 0.66]]
    .map(([dx, dy, s, rot, ph]) => {
      const u = (t + ph) % 1
      const k = 0.45 + 0.55 * Math.sin(u * Math.PI)      // 0.45 → 1 → 0.45
      return `<div class="spark" style="left:${Math.round(x + dx * (w / 2 + 34))}px;` +
        `top:${Math.round(y + dy * (h / 2 + 34))}px;--s:${Math.round(s * k)}px;--rot:${rot}deg;` +
        `opacity:${(0.35 + 0.6 * k).toFixed(2)}"></div>`
    }).join('') : ''
  return 물결 + 상자(0, 'ring') + 반짝
}

// 🐻 곰펭 컷은 «한 자리·한 크기»로 고정 — 창업자 *"재목이 위치가 다달라"*
//    ⛔ 옛 판은 장면마다 왼아래·오른아래·오른위로 옮겨 다녀서 화면이 들썩였다.
const 컷1 = `<img class="cut" src="${스('duos_03')}" style="left:34px;bottom:26px;height:236px">`
const 컷2 = `<img class="cut" src="${스('gp_duotb')}" style="left:34px;bottom:26px;height:236px">`
const 컷3 = 컷1

// 🔗 자막이 화면을 «읽는다» — 장면마다 그때 꽂은 카드 제목
const 장면들 = Object.fromEntries(장면.filter((s) => s.표시?.요리).map((s) => [s.이름, s.표시.요리]))
for (const k of ['②아이', '③아빠', '④엄마']) {
  if (!장면들[k]) throw new Error(`⛔ ${k} 장면에 «무엇을 꽂았는지»가 없다 — 자막을 지어내지 않는다`)
}
const 앞면들 = {
  '①물음': 앞면('이번 주에 뭐 먹지?', '가족이 모여 앉아<br><b>먹고 싶은 걸 하나씩 꽂아요</b>', 컷1),
  // ⭐⭐ 자막의 요리 이름은 «장면에 적힌 실제 카드 제목»에서 온다 — 손으로 적지 않는다.
  //    지난 판이 「엄마 = 버섯전골」이라 해놓고 화면에선 제육볶음을 꽂았다(창업자 *"엄마는 미역국한다며"*).
  '②아이': 앞면('아이가 골라요', `${장면들['②아이']}, <b>요리사 모자</b>를 톡`, 컷1, { 꼬리표: '아이 차례' }),
  '③아빠': 앞면('아빠가 골라요', `${장면들['③아빠']}, 누르면 <b>모자가 진해져요</b>`, 컷1, { 꼬리표: '아빠 차례' }),
  '④엄마': 앞면('엄마가 골라요', `이번 주엔 <b>${장면들['④엄마']}</b>`, 컷1, { 꼬리표: '엄마 차례' }),
  '⑤서랍': 앞면('고른 게 한 서랍에', '위 칩에 <b>‘해볼 것 3’</b> 이 저절로 서요', 컷3),
  '⑥최애': 앞면('맛있었으면 한 번 더', '모자를 다시 누르면 <b>하트 = 최애</b>', 컷3, { 꼬리표: '한 번 더' }),
  '⑦다음주': 앞면('다음 주엔 최애만', '하트만 모아서 <b>또 해먹어요</b>', 컷2),
  '⑧마무리': 앞면('한 주가 이렇게 짜여요', '<b>해볼 것</b> = 이번 주에 할 것<br><b>최애</b> = 다음에 또 할 것', 컷2),
}

const b2 = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const pg = await b2.newPage({ viewport: { width: W, height: H } })
await pg.setContent(바탕HTML, { waitUntil: 'networkidle' })
await pg.waitForTimeout(250)
const 바탕판 = join(OUT, '_바탕.png')
await pg.screenshot({ path: 바탕판 })
// 🌊 표시가 있는 장면은 «여러 장»(물결이 퍼지는 단계)을 그려서 영상처럼 돌린다 — 진짜 움직이는 효과
const 물결장수 = 20, 물결fps = 20
// 📐 검수 가르기 — 제목·꼬리표·자막 칸이 장면마다 «같은 자리»인가를 실제로 잰다
const 잰자리 = []
for (const s of 장면) {
  const 장수 = s.표시 ? 물결장수 : 1
  s.앞면들 = []
  for (let i = 0; i < 장수; i++) {
    await pg.setContent(앞면들[s.이름] + 표시HTML(s.표시, i / 장수), { waitUntil: 'networkidle' })
    await pg.waitForTimeout(장수 === 1 ? 250 : 60)
    if (i === 0) {
      잰자리.push({
        이름: s.이름,
        자리: await pg.evaluate(() => {
          const 재 = (sel) => { const e = document.querySelector(sel); if (!e) return null
            const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)] }
          return { 제목: 재('.head'), 꼬리표: 재('.tag'), 자막: 재('.sub'), 컷: 재('.cut') }
        }),
      })
    }
    const 판 = join(OUT, `_앞_${s.이름}_${String(i).padStart(2, '0')}.png`)
    await pg.screenshot({ path: 판, omitBackground: true })
    s.앞면들.push(판)
  }
  s.앞면 = s.앞면들[0]
}
// ⛔ 자리가 하나라도 어긋나면 «영상을 내지 않는다» — 창업자가 눈으로 잡던 것을 기계가 먼저 잡는다
{
  const 기준 = 잰자리[0].자리
  const 어긋남 = []
  for (const { 이름, 자리 } of 잰자리) {
    for (const 칸 of ['제목', '꼬리표', '자막', '컷']) {
      const a = 기준[칸], c = 자리[칸]
      if (!a || !c) continue                       // 꼬리표는 없는 장면이 있다(자리는 늘 같은 곳)
      if (a[0] !== c[0] || a[1] !== c[1]) 어긋남.push(`${이름} ${칸} ${JSON.stringify(c)} ≠ ${JSON.stringify(a)}`)
    }
  }
  console.log('📐 자리 실측', JSON.stringify(잰자리[0].자리))
  if (어긋남.length) throw new Error(`⛔ 칸 자리가 장면마다 다르다\n   ${어긋남.join('\n   ')}`)
}
// 🐻 끝장 한 장 — 앱 없이 로고만(창업자 *"따로 페이지 하나 만들어서"*)
await pg.setContent(끝장HTML, { waitUntil: 'networkidle' })
await pg.waitForTimeout(300)
const 끝장판 = join(OUT, '_끝장.png')
await pg.screenshot({ path: 끝장판 })
await b2.close()

// ── ③ 붙이기 — 바탕 위에 앱 영상, 그 위에 앞면 ───────────────────────────
const 조각들 = []
for (const s of 장면) {
  const 조각 = join(OUT, `_조각_${s.이름}.mp4`)
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error',
    '-loop', '1', '-i', 바탕판,
    '-ss', String(s.시작), '-t', String(s.길이), '-i', join(OUT, webm),
    // 🌊 앞면이 여러 장이면 «그림 차례»로 넣어 돌린다 — 물결이 실제로 퍼진다
    ...(s.앞면들.length > 1
      ? ['-stream_loop', '-1', '-framerate', String(물결fps), '-i', join(OUT, `_앞_${s.이름}_%02d.png`)]
      : ['-loop', '1', '-i', s.앞면]),
    '-filter_complex',
    // 🔍 고르는 장면은 «핀 언저리만» 잘라 키운다 — 창업자 *"그 부분을 클로즈업"*
    (() => {
      // ✂️ 확대 장면은 핀 언저리를, 보통 장면은 «아래를 잘라낸» 위쪽을 쓴다
      const 칸 = s.표시?.확대 ? 확대칸(s.표시.점) : { cw: 영상W, ch: 앱크롭H, cx: 0, cy: 0 }
      const 자름 = `crop=${칸.cw}:${칸.ch}:${칸.cx}:${칸.cy},`
      return `[1:v]${자름}scale=${앱W}:${앱H}:flags=lanczos[app];[0:v][app]overlay=${앱X}:${앱Y}[bg];[bg][2:v]overlay=0:0,fps=60,format=yuv420p,setsar=1[v]`
    })(),
    '-map', '[v]', '-t', String(s.길이),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-y', 조각], { stdio: 'inherit' })
  조각들.push(조각)
}

// 🐻 끝장을 «한 조각»으로 만들어 뒤에 붙인다 (앱 영상이 없으니 그림 한 장을 늘여 쓴다)
const 끝길이 = 2.8
const 끝조각 = join(OUT, '_조각_⑨끝장.mp4')
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-loop', '1', '-i', 끝장판,
  '-t', String(끝길이), '-vf', 'fps=60,format=yuv420p,setsar=1',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-y', 끝조각], { stdio: 'inherit' })
조각들.push(끝조각)
장면.push({ 이름: '⑨끝장', 길이: 끝길이 })

// 장면 사이는 부드럽게 — 앞 장이 위로 밀리고 다음 장이 아래에서 올라온다(소소 릴스와 같은 결)
const TR = 0.35
const IN = []; 조각들.forEach((c) => IN.push('-i', c))
let G = '', PREV = '[0:v]', ACC = 0
for (let i = 1; i < 조각들.length; i++) {
  ACC = +(ACC + 장면[i - 1].길이 - TR).toFixed(3)
  const NEXT = i === 조각들.length - 1 ? '[v]' : `[x${i}]`
  G += `${PREV}[${i}:v]xfade=transition=slideup:duration=${TR}:offset=${ACC}${NEXT};`
  PREV = NEXT
}
const mp4 = join(OUT, '핀릴스-가족이같이골라요.mp4')
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', ...IN, '-filter_complex', G.slice(0, -1), '-map', '[v]', '-r', '60',
  '-c:v', 'libx264', '-preset', 'medium', '-b:v', '6800k', '-maxrate', '7800k', '-bufsize', '14000k',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', '-y', mp4], { stdio: 'inherit' })

const 길이 = (() => {
  try { execFileSync(FF, ['-i', mp4], { stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) {
    const m = String(e.stderr || '').match(/Duration: ([0-9:.]+)/); return m ? m[1] : '?'
  }
  return '?'
})()
console.log(`\n✅ 오류 0 · 길이 ${길이} ·`, mp4)
execFileSync('bash', ['-c', `ls -la "${mp4}"`], { stdio: 'inherit' })
