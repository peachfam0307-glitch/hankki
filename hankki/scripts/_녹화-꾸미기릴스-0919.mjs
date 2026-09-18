// 🎬🎨 꾸미기 릴스 — «앱을 실제로 조작하면서» 화면 녹화 (2026-09-19)
//
// 📮 창업자 = *"내가 아까 가을꺼 일부러 녹화해서 올려줬잖아 똑같은 방식으로 만들라고"*
//   ＋ *"그릇은 갑자기 툭 끊어졌다가 그릇이 나타나고 / 끌어다 붙이고 애들도 움직이고 있고 해야하는데"*
//   ＋ *"생동감있게 만들라고"* · *"그릇 하나 먼저 해봐"*
//
// ⛔⛔ 앞 판(_영상-꾸미기릴스-0919.mjs)은 «완성 스샷 10장을 이어붙인 슬라이드쇼»였다 — 접근이 틀렸다.
//    가을 레꾸 릴스(창업자 인스타 녹화 17.3초)를 눈으로 보니: 조각에 ×·⟳ 손잡이가 떠 있고,
//    서랍이 탭마다 바뀌고, 조각이 «끌려가서» 붙는다. 그건 녹화라야 나온다.
//
// ⭐ 방식 = 추석 장식 릴스(_영상-추석장식릴스-0909.mjs)와 같다 — recordVideo · 크기는 뷰포트 그대로.
//    ⛔ 틀을 키워도 페이지는 안 커진다(2026-09-19 식비 릴스에서 4번 지적받고 알았다). 편집에서 키운다.
//
// 🧮 값은 전부 «확정값»이다 — docs/꾸미기-시안-그대로-얹는법-2026-09-19.md 7️⃣ 표.
//    끌기 = 조각 중심을 목표 중심으로 (onItemDown → pointer move)
//    크기 = 손잡이를 «방사형으로» 끈다: s = s0 × (끈 거리 / 처음 거리)  (DecorLayer.jsx onHandleMove)
//           6° 안에서 끌면 각도는 안 돌아간다(문턱). 돌릴 땐 6° 넘겨 «일부러» 돈다.
//
// 쓰는 법: SMOKE_CHROMIUM=… ONLY=1 node scripts/_녹화-꾸미기릴스-0919.mjs   (ONLY=n → 앞 n조각만)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4621, r))
const 밖 = process.env.OUT || '/tmp/claude-0/꾸미기녹화판'
mkdirSync(밖, { recursive: true })

// 🧩 확정값 (창업자 판정 2026-09-19) — ⛔ 여기 숫자를 눈대중으로 고치지 않는다.
//    탭 = 서랍에서 누를 탭 라벨 · key = 서랍 칸의 aria-label(앞부분)
const 조각 = [
  { 이름: '그릇 접시',        탭: '프레임', key: 'pf_ad08', x: 0.5094, y: 0.46, s: 0.78, r: 0 },
  { 이름: '포토코너(왼위)',   탭: '데코',   key: 'pc3_02', x: 0.13, y: 0.145, s: 0.24, r: 0 },   // 한계(0.12/0.1331)+0.01 — 딱 놓으면 소수점 오차로 잘린다
  { 이름: '포토코너(오른아래)', 탭: '데코', key: 'pc3_02', x: 0.86, y: 0.81, s: 0.24, r: 0, flip: true, flipY: true },
  { 이름: '카롱＋펭펭',       탭: '친구들', key: 'kp_shoulder', x: 0.195, y: 0.75, s: 0.24, r: 0, fxLabel: '하트' },   // 통통은 친구들이면 저절로(DecorEditor 763),
  { 이름: '제목 글자',        탭: '글자',   text: '새우관자전', color: 't_lilac', font: 'gaegu', x: 0.46, y: 0.15, s: 0.52, r: 0 },
  { 이름: '큰 하트',          탭: '데코',   key: 'dc_dhb04', colorKey: 'coral', x: 0.69, y: 0.15, s: 0.115, r: 0 },
  { 이름: '아래 마테',        탭: '마테',   key: 'wt_dy06', x: 0.60, y: 0.72, s: 0.32, r: -8 },
  { 이름: '아이 원픽',        탭: '글자',   key: 'tw_kidpick', x: 0.79, y: 0.29, s: 0.22, r: -10 },
]
const 몇 = process.env.ONLY ? Number(process.env.ONLY) : 조각.length

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR', hasTouch: false,
  recordVideo: { dir: 밖, size: { width: 390, height: 844 } },
})
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki-theme', 'apricot')   // 🍑 살구 테마 — 창업자 2026-09-19 *"살구테마에서해줘"* (키 = src/theme.js THEME_KEY)
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
const p = await ctx.newPage()
const 자막 = []   // (초, 무엇) — 편집판이 자르거나 창업자가 자막 달 때 쓴다
const 시작 = Date.now(); const 초 = () => ((Date.now() - 시작) / 1000).toFixed(2)
const 적기 = (무엇) => { 자막.push([초(), 무엇]); console.log('  ⏱', 초(), 무엇) }
const 안내치우기 = async () => {
  let 맑음 = 0
  for (let i = 0; i < 20; i++) {
    const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() > 0 && await 것.isVisible().catch(() => false)) {
      try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(250); continue } catch { /* 다시 */ }
    }
    if (await p.locator('.sheet-mask, button:has-text("건너뛰기")').count() === 0) { 맑음++; if (맑음 >= 2) return }
    else 맑음 = 0
    await p.waitForTimeout(500)
  }
}
await p.goto('http://127.0.0.1:4621/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200); await 안내치우기()
// 🧹 그 레시피의 꾸미기를 «비운다» — 민 카드에서 시작해야 쌓이는 게 보인다
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
  const r = s?.recipes?.find((x) => x.id === 'basic-saeu-gwanja-jeon')
  if (r) { r.decor = []; r.decorBg = 'none'; localStorage.setItem('hankki:v1', JSON.stringify(s)) }
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); await 안내치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1000); await 안내치우기()
const 그것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
await 그것.scrollIntoViewIfNeeded(); await 그것.click({ force: true }); await p.waitForTimeout(1400); await 안내치우기()
await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(1500); await 안내치우기()
적기('꾸미기 열림 (여기서부터 쓴다)')

// 📐 판 자리 — 비율 → 화면 px
const 판 = await p.evaluate(() => { const b = document.querySelector('.decor-stage').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })
const 화면 = (x, y) => ({ x: 판.x + x * 판.w, y: 판.y + y * 판.h })
// 🖱 «사람 손처럼» 끈다 — 한 번에 점프하지 않고 여러 걸음으로(녹화에 움직임이 보이게)
const 끌기 = async (from, to, 걸음 = 22, 쉼 = 14) => {
  await p.mouse.move(from.x, from.y); await p.mouse.down(); await p.waitForTimeout(80)
  for (let i = 1; i <= 걸음; i++) {
    const t = i / 걸음; const e = 1 - Math.pow(1 - t, 3)   // ease-out — 시작은 빠르고 끝은 천천히
    await p.mouse.move(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e); await p.waitForTimeout(쉼)
  }
  await p.waitForTimeout(90); await p.mouse.up()
}
// 🗂 편집바 갈래 — ⛔같은 갈래를 또 누르면 «접힌다»(DecorEditor: ctxCur===k && ctxOpen → 닫기).
//    2026-09-19 실측: 붙자마자 「순서」가 열려 있어서 내가 누르니 닫혔고 뒤집기 단추가 사라졌다.
const 갈래열기 = async (k) => {
  const t = p.locator(`[data-ctxtab="${k}"]`)
  if ((await t.getAttribute('aria-pressed')) !== 'true') { await t.click(); await p.waitForTimeout(400) }
}
const 탭누르기 = async (라벨) => {
  const t = p.locator('.decor-tabs button, [role="tablist"] button, button').filter({ hasText: new RegExp(`^${라벨}$`) }).first()
  await t.click({ timeout: 3000 }); await p.waitForTimeout(500)
}
// 🎯 지금 «고른» 조각의 자리 — 저장본이 아니라 «화면»에서 읽는다(손잡이가 붙은 것)
const 고른조각 = async () => p.evaluate(() => {
  const h = document.querySelector('.decor-stage [aria-label="크기·회전"]'); if (!h) return null
  // 🔖 회전이 걸린 요소 = data-decor-item (DecorLayer 267줄). ⛔ 손잡이 parentElement 로 읽으면 rotate 가 없어 늘 0 이 나온다(2026-09-19 실측).
  const box = h.closest('[data-decor-item]') || h.parentElement
  const b = box.getBoundingClientRect(); const hb = h.getBoundingClientRect()
  // 🔄 지금 각도 — 붙을 때 ((n%5)-2)×4° 가 «저절로» 붙는다(DecorEditor addSticker). 0° 가 아니다.
  //    ⛔ 2026-09-19: r:0 이면 안 돌렸더니 코너 -4°·카롱 +4° 로 삐딱하게 붙어 잘렸다.
  const m = /rotate\(([-\d.]+)deg\)/.exec(box.style.transform || '')
  return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, w: b.width, hx: hb.x + hb.width / 2, hy: hb.y + hb.height / 2, r: m ? Number(m[1]) : 0 }
})

// 🎨 첫 겹 = 배경 «모눈» (창업자 순서: 배경 → 그릇 → …) — ⛔ 1차 녹화에서 이걸 빼먹어 흰 바탕이었다
await 탭누르기('배경'); await p.locator('[aria-label^="배경 모눈"]').first().click(); await p.waitForTimeout(700); 적기('배경 모눈')
for (let i = 0; i < 몇; i++) {
  const c = 조각[i]
  적기(`▶ ${c.이름} — 탭 «${c.탭}»`)
  await 탭누르기(c.탭)
  if (c.text) {
    // ✍️ 글자 = 「글자 넣기」 → 바로 치는 상태(textarea) → 한 글자씩 → 빈 판을 눌러 치기 끝 → 다시 눌러 고르기
    //    → 「색」·「글씨」 갈래에서 t_lilac · 귀염체 → 끌기·크기
    await p.locator('button:has-text("글자 넣기")').first().click(); await p.waitForTimeout(500)
    await p.keyboard.type(c.text, { delay: 140 }); await p.waitForTimeout(400); 적기(`   글자 침 «${c.text}»`)
    await p.mouse.click(판.x + 판.w * 0.5, 판.y + 판.h * 0.95); await p.waitForTimeout(400)   // 치기 끝(빈 자리)
    const 글 = p.locator('.decor-stage').getByText(c.text, { exact: true }).first()
    await 글.click({ force: true }); await p.waitForTimeout(450)
    await 갈래열기("color")
    await p.locator(`[aria-label="글자색 ${c.color}"]`).click(); await p.waitForTimeout(350)
    await 갈래열기("font")
    await p.locator('button').filter({ hasText: /^귀염체$/ }).last().click(); await p.waitForTimeout(400); 적기(`   색 ${c.color} · 귀염체`)
    let 지금 = await 고른조각()
    if (!지금) { console.log('  ⛔ 글자 손잡이를 못 찾았다'); continue }
    await 끌기({ x: 지금.cx, y: 지금.cy }, 화면(c.x, c.y)); await p.waitForTimeout(300); 적기(`   끌어다 놓음`)
    지금 = await 고른조각()
    // 글자 s 는 폭 기준이 아니다(fontPx = s×0.15×폭). 손잡이 비율은 같으니 s0 를 기본값 0.5 로 본다(addText).
    const 배 = c.s / 0.5; const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy
    await 끌기({ x: 지금.hx, y: 지금.hy }, { x: 지금.cx + dx * 배, y: 지금.cy + dy * 배 }, 14, 16); await p.waitForTimeout(400); 적기(`   크기 0.5 → ${c.s}`)
    continue
  }
  const 칸 = p.locator(`.decor-cell[aria-label^="${c.key}"]`).first()
  await 칸.scrollIntoViewIfNeeded(); await p.waitForTimeout(250)
  await 칸.click(); await p.waitForTimeout(600)
  적기(`   붙음 (기본 자리)`)
  // 🎨 색 — 편집바 「색」 갈래 → aria-label "색 <키>" (⛔hex 를 지어내지 않는다 · STICKER_COLORS 의 키만)
  if (c.colorKey) { await 갈래열기("color"); await p.locator(`[aria-label="색 ${c.colorKey}"]`).click(); await p.waitForTimeout(400); 적기(`   색 ${c.colorKey}`) }
  // 🔄 뒤집기 — 「순서」 갈래 안의 단추 둘
  if (c.flip || c.flipY) {
    await 갈래열기("order")
    if (c.flip) { await p.locator('button:has-text("좌우 뒤집기")').click(); await p.waitForTimeout(350) }
    if (c.flipY) { await p.locator('button:has-text("상하 뒤집기")').click(); await p.waitForTimeout(350) }
    적기(`   뒤집음`)
  }
  // ✨ 효과 — 「효과」 갈래 → 라벨 글자(하트)
  if (c.fxLabel) { await 갈래열기("fx"); await p.locator('button').filter({ hasText: new RegExp(`^${c.fxLabel}$`) }).last().click(); await p.waitForTimeout(500); 적기(`   효과 ${c.fxLabel}`) }
  // 📐 프레임을 얹은 «뒤» 음식 사진이 어디에 얼마나 그려지나 — 낱장 판과 «다르다»(2026-09-19 실측: 폭 0.50 → 0.69)
  if (process.env.PROBE) console.log('     📐 커버 =', JSON.stringify(await p.evaluate(() => { const st = document.querySelector('.decor-stage'); const sb = st.getBoundingClientRect(); return [...st.querySelectorAll('img')].map((i) => { const b = i.getBoundingClientRect(); return { src: i.currentSrc.split('/').pop().slice(0, 12), nw: i.naturalWidth, nh: i.naturalHeight, fit: getComputedStyle(i).objectFit, x: +(b.x - sb.x).toFixed(2), y: +(b.y - sb.y).toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) } }) })))
  let 지금 = await 고른조각()
  if (!지금) { console.log('  ⛔ 손잡이를 못 찾았다 — 조각이 «고른» 상태가 아니다'); break }
  // ① 끌어다 놓기
  const 목표 = 화면(c.x, c.y)
  await 끌기({ x: 지금.cx, y: 지금.cy }, 목표)
  await p.waitForTimeout(300); 적기(`   끌어다 놓음 → (${c.x}, ${c.y})`)
  // ② 크기 — 손잡이를 방사형으로. s0 는 저장본에서 읽는다(기본값이 조각마다 다르다)
  지금 = await 고른조각()
  // ⛔ 편집 중엔 저장본(localStorage)에 아직 없다 — 1차 시도에서 undefined 였다.
  //    ✅ s 는 «폭 ÷ 판 폭»이다(DecorLayer 225줄 width: s×100%) → 화면에서 잰다.
  const s0 = 지금 ? 지금.w / 판.w : null
  if (지금 && s0) {
    const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy, d0 = Math.hypot(dx, dy)
    const 배 = c.s / s0
    const to = { x: 지금.cx + dx * 배, y: 지금.cy + dy * 배 }
    await 끌기({ x: 지금.hx, y: 지금.hy }, to, 18, 16)
    await p.waitForTimeout(300); 적기(`   크기 ${s0} → ${c.s} (손잡이 ${d0.toFixed(0)}px → ${(d0 * 배).toFixed(0)}px)`)
  }
  // ③ 돌리기 — 6° 문턱을 «넘겨» 원하는 각으로(0° 면 안 돌린다)
  지금 = await 고른조각()
  const 목표각 = c.r || 0
  if (지금 && Math.abs(지금.r - 목표각) > 0.5) {
    const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy, d = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx)
    const 차 = 목표각 - 지금.r
    // ⛔ 6° 안은 «안 돌린 것»으로 본다(문턱). 그래서 먼저 12° 를 넘겨 갔다가 목표로 돌아온다.
    //    ＋ 자석 ±5°(0·90·180·270) 이 있어 0° 근처는 저절로 0° 에 붙는다.
    const 지나감 = 차 + (차 >= 0 ? 12 : -12)
    const 점 = (deg) => ({ x: 지금.cx + d * Math.cos(a0 + (deg * Math.PI) / 180), y: 지금.cy + d * Math.sin(a0 + (deg * Math.PI) / 180) })
    await p.mouse.move(지금.hx, 지금.hy); await p.mouse.down(); await p.waitForTimeout(80)
    for (let k = 1; k <= 10; k++) { const t = k / 10; await p.mouse.move(점(지나감 * t).x, 점(지나감 * t).y); await p.waitForTimeout(16) }
    for (let k = 1; k <= 6; k++) { const t = k / 6; const deg = 지나감 + (차 - 지나감) * t; await p.mouse.move(점(deg).x, 점(deg).y); await p.waitForTimeout(16) }
    await p.waitForTimeout(90); await p.mouse.up()
    await p.waitForTimeout(300); 적기(`   각도 ${지금.r}° → ${목표각}°`)
  }
  // 🔎 저장본에 «실제로» 어떤 값이 들어갔나 — 눈으로 보기 전에 숫자로 먼저 본다
  const 끝 = await 고른조각()
  const 실제 = 끝 && { x: +((끝.cx - 판.x) / 판.w).toFixed(4), y: +((끝.cy - 판.y) / 판.h).toFixed(4), s: +(끝.w / 판.w).toFixed(3) }
  console.log('     🔎 화면에서 잰 값 =', JSON.stringify(실제), ' 목표 =', JSON.stringify({ x: c.x, y: c.y, s: c.s, r: c.r }))
  // 🖼 손잡이 wrapper 말고 «그림 자체»의 자리 — wrapper 는 여백이 있어 어긋날 수 있다
  if (c.key) console.log('     🖼 그림 자체 =', JSON.stringify(await p.evaluate((k) => { const st = document.querySelector('.decor-stage'); const sb = st.getBoundingClientRect(); const i = [...st.querySelectorAll('img')].reverse().find((i) => i.currentSrc.includes(k)); if (!i) return null; const b = i.getBoundingClientRect(); return { x: +((b.x + b.width / 2 - sb.x) / sb.width).toFixed(4), y: +((b.y + b.height / 2 - sb.y) / sb.height).toFixed(4), s: +(b.width / sb.width).toFixed(3) } }, c.key)))
  await p.waitForTimeout(500)
}
// 🖐 빈 자리를 눌러 고르기를 푼다 — 손잡이가 뜬 채로 끝나면 완성이 아니다(대조에서 잡힘)
await p.mouse.click(판.x + 판.w * 0.5, 판.y + 판.h * 0.995); await p.waitForTimeout(1800)
// 📏 «잘리나»를 눈이 아니라 DOM 으로 잰다 — 그림 rect 가 판 rect 를 넘으면 그만큼 잘린 것이다
console.log('  📏 판 밖으로 나간 그림 =', JSON.stringify(await p.evaluate(() => { const st = document.querySelector('.decor-stage'); const s = st.getBoundingClientRect(); return [...st.querySelectorAll('img')].map((i) => { const b = i.getBoundingClientRect(); const o = { 왼: +(s.x - b.x).toFixed(1), 위: +(s.y - b.y).toFixed(1), 오: +((b.x + b.width) - (s.x + s.width)).toFixed(1), 아래: +((b.y + b.height) - (s.y + s.height)).toFixed(1) }; const 넘침 = Object.fromEntries(Object.entries(o).filter(([, v]) => v > 0.5)); return Object.keys(넘침).length ? { src: i.currentSrc.split('/').pop().slice(0, 10), ...넘침 } : null }).filter(Boolean) })))
적기('끝')
await p.screenshot({ path: join(밖, '마지막.png') })
writeFileSync(join(밖, '자막.json'), JSON.stringify({ 판, 자막 }, null, 2))
await ctx.close(); await b.close(); srv.close()
const v = readdirSync(밖).find((f) => f.endsWith('.webm'))
if (v) { renameSync(join(밖, v), join(밖, '녹화.webm')); console.log('✅ 녹화 →', join(밖, '녹화.webm')) }
