// 🎬🎨 꾸미기 릴스 «녹화» — 창업자 시안(JSON)대로 앱을 실제로 조작하며 찍고, 릴스까지 굽는다 (2026-09-19 확정)
//
// 📮 창업자 = *"아까 그 도구 폐기하고 이걸 만들어서 올려. 담에 쓰게 무슨말인지 알지??
//    아까 내가 지시한대로 꾸미기 릴스만들때 이 도구가 바로 쓰이도록"*
//   ＋ *"내가 아까 가을꺼 일부러 녹화해서 올려줬잖아 똑같은 방식으로 만들라고"* · *"생동감있게"*
//
// ⛔⛔ 폐기한 것 = _영상-꾸미기릴스-0919.mjs (완성 스샷 10장을 이어붙인 «슬라이드쇼») → scripts/_archive/
//    창업자 = *"붙이는 느낌이 없잖아 / 그릇은 갑자기 툭 끊어졌다가 나타나고"* — 접근 자체가 틀렸다.
//    가을 레꾸 릴스(창업자 인스타 녹화)를 프레임으로 뜯어 «눈으로» 봤다: ×·⟳ 손잡이가 뜨고, 서랍이
//    탭마다 바뀌고, 조각이 «끌려가서» 붙는다. 그건 «녹화»라야 나온다.
//
// ⭐ 이 한 줄이면 끝난다 (시안 JSON 만 새로 쓰면 된다 — ⛔ 이 파일의 숫자를 고치지 않는다)
//    SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/꾸미기릴스-녹화.mjs docs/꾸미기릴스-시안-<이름>-<날짜>.json
//    · 값검사(scripts/꾸미기-값검사.mjs)를 «통과해야» 돈다 — 조용히 틀리는 값(색 키·flipX·없는 fx)을 찍기 전에 잡는다
//    · 고화질이 기본(1080×2340). 빠르게 확인만 하려면 HQ=0 · 앞 n조각만은 ONLY=n · 굽기만 건너뛰려면 NOBAKE=1
//    · 끝나면 design/promo/인스타-<YYMM>/릴스-꾸미기-<이름>-<날짜>.mp4 로 «저장소에» 넣는다
//    📄 시안 JSON 만드는 법·확정값 = docs/꾸미기-시안-그대로-얹는법-2026-09-19.md
//
// 🧮 어떻게 붙이나 (전부 앱 코드에서 «읽은» 식이다 — 기억이 아니다)
//    · 탭 누르기 → 서랍 칸(aria-label=key) 누르기 → 기본 자리에 붙는다 (DecorEditor addSticker)
//    · 끌기 = 조각 중심 → 목표 중심, ease-out 22걸음 (녹화에 «움직임»이 보이게)
//    · 크기 = 손잡이를 «방사형으로» s0→s 배 거리까지 (DecorLayer onHandleMove: s = s0×끈거리/처음거리)
//    · 각도 = 붙을 때 ((n%5)-2)×4° 가 «저절로» 붙는다 → data-decor-item 의 rotate 를 읽어 «항상» 목표각으로.
//            6° 문턱(그 안은 안 돈다)이 있어 12° 지나갔다가 돌아온다 · 자석 ±5° 가 0° 근처를 0° 에 붙인다
//    · 편집바 갈래(색·순서·효과·글씨)는 «이미 열려 있으면 안 누른다» — 또 누르면 접힌다
//    · 고화질 = recordVideo 는 뷰포트 «그대로» 찍는다 → 뷰포트 1080×2340 ＋ CSS zoom 2.769 로 «앱을» 키운다
//
// 🔢 밟았던 함정 (2026-09-19 새벽 · 전부 실측) — 이 도구가 막는 것
//    ① 색 '#e8b9bd' 처럼 «앱에 없는 값» → 값검사가 exit 1 · ② s0 를 저장본에서 읽으면 undefined(편집 중엔 없다) → 화면 폭÷판폭
//    ③ 한계값 «딱»에 놓으면 소수점 오차로 잘린다 → 끝에 「판 밖으로 나간 그림」을 DOM 으로 재서 찍는다
//    ④ 배경(모눈)을 빼먹고 · 손잡이 뜬 채 끝냈다 → 첫 겹 배경, 끝에 빈 자리 눌러 고르기 풀기
//    ⑤ 환경변수 이름이 한글이면 bash 가 죽는다 → 전부 ASCII(HQ · ONLY · OUT · NOBAKE · SEC)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync, readdirSync, renameSync, existsSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { extname, join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const 여기 = dirname(fileURLToPath(import.meta.url))
const 앱 = join(여기, '..')
const DIST = join(앱, 'dist')

// 📄 시안 JSON — 첫 인자. 없으면 죽는다(⛔ 이 파일 안에 숫자를 두지 않는다)
const 시안인자 = process.argv[2]
const 시안경로 = 시안인자 && (existsSync(시안인자) ? 시안인자 : existsSync(join(앱, 시안인자)) ? join(앱, 시안인자) : null)
if (!시안경로) {
  console.error('⛔ 시안 JSON 을 달라\n   예) node scripts/꾸미기릴스-녹화.mjs docs/꾸미기릴스-시안-새우관자전-2026-09-19.json\n   📄 만드는 법 = docs/꾸미기-시안-그대로-얹는법-2026-09-19.md')
  process.exit(2)
}
const 시안 = JSON.parse(readFileSync(시안경로, 'utf8'))
const 조각 = 시안.조각
const 레시피 = 시안.레시피
const 테마 = 시안.테마 || 'apricot'
const 배경 = 시안.배경 || '모눈'
const 목표초 = Number(process.env.SEC || 시안.초 || 17.5)
const 이름 = (basename(시안경로).match(/시안-(.+?)-\d{4}-\d{2}-\d{2}/) || [, 'untitled'])[1]
const { todayKST } = await import('../src/today.js')   // ⏰ 절대원칙 27 — 「오늘」은 today.js 한 곳에서만
const 날짜 = (basename(시안경로).match(/(\d{4}-\d{2}-\d{2})/) || [, todayKST()])[1]
if (!레시피 || !Array.isArray(조각) || !조각.length) { console.error('⛔ 시안 JSON 에 「레시피」와 「조각」이 있어야 한다'); process.exit(2) }

// 🔒 값검사를 «통과해야» 돈다 — 조용히 틀리는 값은 찍고 나면 눈으로 볼 때까지 모른다
{
  const 검사값 = 조각.map((c) => c.text
    ? { type: 'text', color: c.color, font: c.font }
    : { type: 'sticker', key: c.key, ...(c.fx ? { fx: c.fx } : {}), ...(c.flipX !== undefined ? { flipX: c.flipX } : {}) })
  try { execFileSync(process.execPath, [join(여기, '꾸미기-값검사.mjs'), '--값', JSON.stringify(검사값)], { stdio: 'inherit' }) }
  catch { console.error('\n⛔ 값검사에서 막혔다 — 시안 JSON 을 고치고 다시. 📄 docs/꾸미기-시안-그대로-얹는법-2026-09-19.md'); process.exit(1) }
  // 🎨 colorKey 는 STICKER_COLORS 의 «키»여야 한다 — 앱 소스에서 읽는다(손으로 적으면 낡는다)
  const 소스 = readFileSync(join(앱, 'src/components/Stickers.jsx'), 'utf8')
  const 색키 = new Set([...소스.matchAll(/\{\s*key:\s*'([a-z]+)',\s*color:\s*'#[0-9a-f]{6}'/g)].map((m) => m[1]))
  for (const c of 조각) if (c.colorKey && !색키.has(c.colorKey)) {
    console.error(`⛔ ${c.이름}: colorKey «${c.colorKey}» 는 STICKER_COLORS 에 없다 — 있는 것 = ${[...색키].join(' · ')}`); process.exit(1)
  }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4621, r))
const 밖 = process.env.OUT || `/tmp/claude-0/꾸미기릴스-${이름}`
mkdirSync(밖, { recursive: true })
const 몇 = process.env.ONLY ? Number(process.env.ONLY) : 조각.length

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 🎥 고화질(기본) = 뷰포트를 1080×2340 으로 키우고 문서를 CSS zoom 2.769 로 확대한다.
//    ⛔ recordVideo 는 «뷰포트 크기 그대로» 찍는다 — deviceScaleFactor 를 올려도 영상은 안 커진다
//       (2026-09-19 식비 릴스에서 4번 지적받고 알았다). 그래서 «앱 자체를» 키운다.
//    📐 1080/390 = 2.769 · 2340/844 = 2.772 — 비율이 같아 레이아웃이 안 깨진다.
//    ⚠️ 렌더가 느려 녹화가 길어진다(실측 64초 → 84초) — 굽기에서 «재서» 배속한다.
const HQ = process.env.HQ !== '0'
const 배율 = HQ ? 1080 / 390 : 1
const ctx = await b.newContext({
  viewport: HQ ? { width: 1080, height: 2340 } : { width: 390, height: 844 }, deviceScaleFactor: HQ ? 1 : 2, locale: 'ko-KR', hasTouch: false,
  recordVideo: { dir: 밖, size: HQ ? { width: 1080, height: 2340 } : { width: 390, height: 844 } },
})
if (HQ) await ctx.addInitScript((z) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = String(z) }) }, 배율)
await ctx.addInitScript((테마키) => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki-theme', 테마키)   // 🍑 테마 = 시안 JSON (키 = src/theme.js THEME_KEY)
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
}, 테마)
const p = await ctx.newPage()
const 자막 = []   // (초, 무엇) — 굽기가 자를 지점을 여기서 읽는다 · 창업자가 자막 달 때도 쓴다
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
const 레시피이름 = await p.evaluate((id) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
  const r = s?.recipes?.find((x) => x.id === id)
  if (r) { r.decor = []; r.decorBg = 'none'; localStorage.setItem('hankki:v1', JSON.stringify(s)) }
  return r?.title || null
}, 레시피)
if (!레시피이름) { console.error(`⛔ 저장본에 레시피 «${레시피}» 가 없다 — src/data 의 id 를 확인할 것`); await b.close(); srv.close(); process.exit(1) }
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); await 안내치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1000); await 안내치우기()
const 그것 = p.locator(`text=${레시피이름}`).first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
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
  // 🔖 회전이 걸린 요소 = data-decor-item (DecorLayer). ⛔ 손잡이 parentElement 로 읽으면 rotate 가 없어 늘 0 이 나온다(실측).
  const box = h.closest('[data-decor-item]') || h.parentElement
  const b = box.getBoundingClientRect(); const hb = h.getBoundingClientRect()
  const m = /rotate\(([-\d.]+)deg\)/.exec(box.style.transform || '')
  return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, w: b.width, hx: hb.x + hb.width / 2, hy: hb.y + hb.height / 2, r: m ? Number(m[1]) : 0 }
})
const 돌리기 = async (지금, 목표각) => {
  const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy, d = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx)
  const 차 = 목표각 - 지금.r
  // ⛔ 6° 안은 «안 돌린 것»으로 본다(문턱). 그래서 먼저 12° 를 넘겨 갔다가 목표로 돌아온다.
  //    ＋ 자석 ±5°(0·90·180·270) 이 있어 0° 근처는 저절로 0° 에 붙는다.
  const 지나감 = 차 + (차 >= 0 ? 12 : -12)
  const 점 = (deg) => ({ x: 지금.cx + d * Math.cos(a0 + (deg * Math.PI) / 180), y: 지금.cy + d * Math.sin(a0 + (deg * Math.PI) / 180) })
  await p.mouse.move(지금.hx, 지금.hy); await p.mouse.down(); await p.waitForTimeout(80)
  for (let k = 1; k <= 10; k++) { const t = k / 10; await p.mouse.move(점(지나감 * t).x, 점(지나감 * t).y); await p.waitForTimeout(16) }
  for (let k = 1; k <= 6; k++) { const t = k / 6; const deg = 지나감 + (차 - 지나감) * t; await p.mouse.move(점(deg).x, 점(deg).y); await p.waitForTimeout(16) }
  await p.waitForTimeout(90); await p.mouse.up(); await p.waitForTimeout(300)
}

// 🎨 첫 겹 = 배경 (창업자 순서: 배경 → 그릇 → …) — ⛔ 1차 녹화에서 이걸 빼먹어 흰 바탕이었다
await 탭누르기('배경'); await p.locator(`[aria-label^="배경 ${배경}"]`).first().click(); await p.waitForTimeout(700); 적기(`배경 ${배경}`)
for (let i = 0; i < 몇; i++) {
  const c = 조각[i]
  적기(`▶ ${c.이름} — 탭 «${c.탭}»`)
  await 탭누르기(c.탭)
  if (c.text) {
    // ✍️ 글자 = 「글자 넣기」 → 바로 치는 상태(textarea) → 한 글자씩 → 빈 판을 눌러 치기 끝 → 다시 눌러 고르기
    //    → 「색」·「글씨」 갈래 → 끌기·크기
    await p.locator('button:has-text("글자 넣기")').first().click(); await p.waitForTimeout(500)
    await p.keyboard.type(c.text, { delay: 140 }); await p.waitForTimeout(400); 적기(`   글자 침 «${c.text}»`)
    await p.mouse.click(판.x + 판.w * 0.5, 판.y + 판.h * 0.95); await p.waitForTimeout(400)   // 치기 끝(빈 자리)
    const 글 = p.locator('.decor-stage').getByText(c.text, { exact: true }).first()
    await 글.click({ force: true }); await p.waitForTimeout(450)
    if (c.color) { await 갈래열기('color'); await p.locator(`[aria-label="글자색 ${c.color}"]`).click(); await p.waitForTimeout(350) }
    if (c.fontLabel || c.font === 'gaegu') { await 갈래열기('font'); await p.locator('button').filter({ hasText: new RegExp(`^${c.fontLabel || '귀염체'}$`) }).last().click(); await p.waitForTimeout(400) }
    적기(`   색 ${c.color} · 글씨 ${c.fontLabel || c.font}`)
    let 지금 = await 고른조각()
    if (!지금) { console.log('  ⛔ 글자 손잡이를 못 찾았다'); continue }
    await 끌기({ x: 지금.cx, y: 지금.cy }, 화면(c.x, c.y)); await p.waitForTimeout(300); 적기('   끌어다 놓음')
    지금 = await 고른조각()
    // 글자 s 는 폭 기준이 아니다(fontPx = s×0.15×폭). 손잡이 비율은 같으니 s0 를 기본값 0.5 로 본다(addText).
    const 배 = c.s / 0.5; const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy
    await 끌기({ x: 지금.hx, y: 지금.hy }, { x: 지금.cx + dx * 배, y: 지금.cy + dy * 배 }, 14, 16); await p.waitForTimeout(400); 적기(`   크기 0.5 → ${c.s}`)
    지금 = await 고른조각()
    if (지금 && Math.abs(지금.r - (c.r || 0)) > 0.5) { await 돌리기(지금, c.r || 0); 적기(`   각도 ${지금.r}° → ${c.r || 0}°`) }
    continue
  }
  const 칸 = p.locator(`.decor-cell[aria-label^="${c.key}"]`).first()
  await 칸.scrollIntoViewIfNeeded(); await p.waitForTimeout(250)
  await 칸.click(); await p.waitForTimeout(600)
  적기('   붙음 (기본 자리)')
  // 🎨 색 — 편집바 「색」 갈래 → aria-label "색 <키>" (⛔hex 를 지어내지 않는다 · STICKER_COLORS 의 키만)
  if (c.colorKey) { await 갈래열기('color'); await p.locator(`[aria-label="색 ${c.colorKey}"]`).click(); await p.waitForTimeout(400); 적기(`   색 ${c.colorKey}`) }
  // 🔄 뒤집기 — 「순서」 갈래 안의 단추 둘
  if (c.flip || c.flipY) {
    await 갈래열기('order')
    if (c.flip) { await p.locator('button:has-text("좌우 뒤집기")').click(); await p.waitForTimeout(350) }
    if (c.flipY) { await p.locator('button:has-text("상하 뒤집기")').click(); await p.waitForTimeout(350) }
    적기('   뒤집음')
  }
  // ✨ 효과 — 「효과」 갈래 → 라벨 글자(하트·반짝이…). 통통 모션은 친구들이면 붙자마자 저절로(DecorEditor).
  if (c.fxLabel) { await 갈래열기('fx'); await p.locator('button').filter({ hasText: new RegExp(`^${c.fxLabel}$`) }).last().click(); await p.waitForTimeout(500); 적기(`   효과 ${c.fxLabel}`) }
  if (c.motionLabel) { await 갈래열기('motion'); await p.locator('button').filter({ hasText: new RegExp(`^${c.motionLabel}$`) }).last().click(); await p.waitForTimeout(500); 적기(`   움직임 ${c.motionLabel}`) }
  let 지금 = await 고른조각()
  if (!지금) { console.log('  ⛔ 손잡이를 못 찾았다 — 조각이 «고른» 상태가 아니다'); break }
  // ① 끌어다 놓기
  await 끌기({ x: 지금.cx, y: 지금.cy }, 화면(c.x, c.y))
  await p.waitForTimeout(300); 적기(`   끌어다 놓음 → (${c.x}, ${c.y})`)
  // ② 크기 — 손잡이를 방사형으로. ⛔ s0 를 저장본에서 읽으면 편집 중엔 undefined → «폭 ÷ 판 폭» 으로 화면에서 잰다
  지금 = await 고른조각()
  const s0 = 지금 ? 지금.w / 판.w : null
  if (지금 && s0) {
    const dx = 지금.hx - 지금.cx, dy = 지금.hy - 지금.cy, d0 = Math.hypot(dx, dy)
    const 배 = c.s / s0
    await 끌기({ x: 지금.hx, y: 지금.hy }, { x: 지금.cx + dx * 배, y: 지금.cy + dy * 배 }, 18, 16)
    await p.waitForTimeout(300); 적기(`   크기 ${s0.toFixed(3)} → ${c.s} (손잡이 ${d0.toFixed(0)}px → ${(d0 * 배).toFixed(0)}px)`)
  }
  // ③ 각도 — «항상» 목표각으로 (붙을 때 ((n%5)-2)×4° 가 저절로 붙어 있다)
  지금 = await 고른조각()
  const 목표각 = c.r || 0
  if (지금 && Math.abs(지금.r - 목표각) > 0.5) { await 돌리기(지금, 목표각); 적기(`   각도 ${지금.r}° → ${목표각}°`) }
  // 🔎 «그림 자체»의 자리를 재서 찍는다 — 눈으로 보기 전에 숫자로 먼저 본다
  if (c.key) console.log('     🖼 그림 자체 =', JSON.stringify(await p.evaluate((k) => { const st = document.querySelector('.decor-stage'); const sb = st.getBoundingClientRect(); const i = [...st.querySelectorAll('img')].reverse().find((i) => i.currentSrc.includes(k)); if (!i) return null; const b = i.getBoundingClientRect(); return { x: +((b.x + b.width / 2 - sb.x) / sb.width).toFixed(4), y: +((b.y + b.height / 2 - sb.y) / sb.height).toFixed(4), s: +(b.width / sb.width).toFixed(3) } }, c.key)), ' 목표 =', JSON.stringify({ x: c.x, y: c.y, s: c.s, r: c.r || 0 }))
  await p.waitForTimeout(500)
}
// 🖐 빈 자리를 눌러 고르기를 푼다 — 손잡이가 뜬 채로 끝나면 완성이 아니다(시안과 나란히 놓고서야 보였다)
await p.mouse.click(판.x + 판.w * 0.5, 판.y + 판.h * 0.995); await p.waitForTimeout(1800)
// 📏 «잘리나»를 눈이 아니라 DOM 으로 잰다 — 그림 rect 가 판 rect 를 넘으면 그만큼 잘린 것이다
const 넘친것 = await p.evaluate(() => { const st = document.querySelector('.decor-stage'); const s = st.getBoundingClientRect(); return [...st.querySelectorAll('img')].map((i) => { const b = i.getBoundingClientRect(); const o = { 왼: +(s.x - b.x).toFixed(1), 위: +(s.y - b.y).toFixed(1), 오: +((b.x + b.width) - (s.x + s.width)).toFixed(1), 아래: +((b.y + b.height) - (s.y + s.height)).toFixed(1) }; const 넘침 = Object.fromEntries(Object.entries(o).filter(([, v]) => v > 0.5)); return Object.keys(넘침).length ? { src: i.currentSrc.split('/').pop().slice(0, 10), ...넘침 } : null }).filter(Boolean) })
console.log('  📏 판 밖으로 나간 그림 =', JSON.stringify(넘친것), 넘친것.length ? ' ⚠️ 잘린다 — 시안의 x/y 를 안쪽으로' : ' ✅')
적기('끝')
await p.screenshot({ path: join(밖, '마지막.png') })
writeFileSync(join(밖, '자막.json'), JSON.stringify({ 판, 자막 }, null, 2))
await ctx.close(); await b.close(); srv.close()
const v = readdirSync(밖).find((f) => f.endsWith('.webm'))
if (!v) { console.log('⛔ 녹화 파일이 없다'); process.exit(1) }
renameSync(join(밖, v), join(밖, '녹화.webm')); console.log('✅ 녹화 →', join(밖, '녹화.webm'))

// 🎞 굽기 — 「꾸미기 열림」 시각부터 끝까지를 «목표 초»에 맞춰 배속하고 9:16 으로 굽는다
//    🔢 고화질은 렌더가 느려 녹화가 길다(실측 84초) → 배속을 «재서» 정한다. 창업자가 좋다고 한 호흡 = 17.5초.
if (!process.env.NOBAKE) {
  const FF = join(앱, 'node_modules/ffmpeg-static/ffmpeg')
  const 시작초 = Math.max(0, Number(자막.find(([, w]) => w.startsWith('꾸미기 열림'))?.[0] || 0) - 0.2)
  const 끝초 = Number(자막[자막.length - 1][0])
  const 배속 = (끝초 - 시작초) / 목표초
  const 낼 = join(밖, `릴스-꾸미기-${이름}-${날짜}.mp4`)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(시작초), '-i', join(밖, '녹화.webm'),
    '-filter_complex', `[0:v]setpts=PTS/${배속.toFixed(3)},scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:#FBF3E4,fps=30,setsar=1,format=yuv420p`,
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', 낼])
  // 📁 저장소에 넣는다 — /tmp 는 세션이 끝나면 사라진다
  //    ⛔ 폴더 이름을 날짜로 «지어내지» 않는다 — 1차에 2026-09 → 인스타-2609 로 만들었다가 틀렸다(실제는 인스타-2509).
  //    ✅ design/promo 의 인스타-* 중 «제일 최근 것»에 넣는다. 없으면 만들라고 말하고 /tmp 에만 둔다.
  const 폴더들 = readdirSync(join(앱, 'design/promo')).filter((f) => f.startsWith('인스타-')).sort()
  if (!폴더들.length) console.log('⚠️ design/promo/인스타-* 폴더가 없다 — 창업자에게 어느 달 폴더인지 물을 것. 지금은 /tmp 에만 있다')
  else { const 보관 = join(앱, 'design/promo', 폴더들[폴더들.length - 1]); copyFileSync(낼, join(보관, basename(낼))); console.log(`📁 저장소 → design/promo/${폴더들[폴더들.length - 1]}/${basename(낼)}`) }
  console.log(`✅ 릴스 → ${낼}  (${배속.toFixed(2)}배속 · ${목표초}초)`)
}
