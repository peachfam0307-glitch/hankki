// 📱📱 [2026-09-15] **지금 앱의 «진짜» 패드 화면** — 아무것도 안 심고·안 주입하고 찍는다.
//
// 📮 창업자 = *"패드 화면 보자"* (Play 콘솔 폼 팩터 표를 보고)
//
// 🔢 왜 = **태블릿이 유저의 7~9%** 다 (2026-09-12 기준 9명/122명).
//    하루 활성 43명이면 패드 3명쯤이 매일 쓴다 → 한 달이면 연 90회.
//
// ⛔⛔ **기존 패드 판 18개는 지금 화면이 아니다** —
//    `_shot-패드안-0826.mjs:11` = *"고친 CSS 는 «주입»만 한다"* ＝ 그건 «시안»이지 지금 모습이 아니다.
//    나머지도 2026-08-26~09-04 판이라 그 뒤 바뀐 것이 안 들어 있다.
//
// ⛔ 이 판은 **찍고 재기만 한다.** 무엇을 고칠지는 창업자가 보고 고른다(규칙 11).
//
// 📌 8/26 에 실측으로 나왔던 것 — 고쳐졌는지 이 판으로 확인한다:
//    · 홈 카드가 «패드에서 더 작았다» (폰 40.5% ↔ 패드 세로 13.7%)
//    · 장보기 오른쪽 아래가 49.4% 비었다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4493, r))

const OUT = process.env.SHOT_OUT || '/tmp/패드지금'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 📐 재는 폭 — ⛔패드는 «가로»로도 쓴다. 세로만 찍으면 반을 놓친다.
const 크기들전부 = [
  { 이름: '폰', w: 390, h: 844 },              // 견줄 잣대
  { 이름: '패드세로', w: 834, h: 1194 },        // 11인치 세로
  { 이름: '패드가로', w: 1194, h: 834 },        // 11인치 가로
  { 이름: '큰패드가로', w: 1366, h: 1024 },     // 12.9인치 가로
]
// 🔎 한 폭만 보고 싶을 때 = ONLY=패드세로
const 크기들 = process.env.ONLY ? 크기들전부.filter((k) => k.이름 === process.env.ONLY) : 크기들전부

// 🎯 찍을 화면 — «많이 쓰는 순서»로 고른다 (GA4 25일: home 68 · myrecipes 39 · detail 36 · import 27 · shop 13)
const 길 = [
  { 이름: '01-홈', 가기: async () => {} },
  { 이름: '02-레시피탭', 가기: async (p) => 눌러(p, '레시피') },
  // ⛔ 탭을 옮기면 코치마크가 «또» 뜬다 → 옮길 때마다 길을 치운다(`_shot-첫사람-0910.mjs:80` 과 같은 이유)
  { 이름: '03-레시피상세', 가기: async (p) => { await 눌러(p, '레시피'); await 길막치우기(p); await 첫카드(p) } },
  { 이름: '04-장보기', 가기: async (p) => 눌러(p, '장보기') },
  { 이름: '05-가져오기', 가기: async (p) => { await 눌러(p, '레시피'); await 길막치우기(p); await 눌러(p, '가져오기') } },
  // 🎴📔🍳🎨 [2026-09-15 두 번째 판] 창업자 = *"나머지 화면들 돌려봐"*
  { 이름: '06-레꾸자랑', 가기: async (p) => 눌러(p, '레꾸자랑') },
  { 이름: '07-일기', 가기: async (p) => 눌러(p, '일기') },
  { 이름: '08-요리모드', 가기: async (p) => { await 눌러(p, '레시피'); await 길막치우기(p); await 첫카드(p); await 길막치우기(p); await 글자눌러(p, '요리모드 시작') } },
  { 이름: '09-꾸미기서랍', 가기: async (p) => { await 눌러(p, '레시피'); await 길막치우기(p); await 첫카드(p); await 길막치우기(p); await 글자눌러(p, '레시피 꾸미기') } },
]

// 🔘 하단 탭이 아니라 «화면 안 단추»를 누른다 — 요리모드·꾸미기가 그렇다
async function 글자눌러(p, 글) {
  const 것 = p.locator('button', { hasText: 글 }).first()
  if (await 것.count() === 0) { console.log(`   ⛔ 「${글}」 단추를 못 찾았다`); return false }
  try { await 것.click({ timeout: 3000 }); await p.waitForTimeout(1400); return true }
  catch (e) { console.log(`   ⛔ 「${글}」 누르기 실패 — ${String(e).split('\n')[0].slice(0, 110)}`); return false }
}

// 🧭 ⛔ `text=레시피` 로 찾으면 «홈 본문 글자»가 먼저 잡혀 화면이 안 옮겨진다.
//    📌 2026-09-15 첫 판이 정확히 그랬다 — 다섯 장이 다 홈으로 찍혔다(글 수가 59~63으로 거의 같아 들켰다).
//    ✅ 하단 탭은 `BottomNav.jsx:63,79` 의 **`.bottom-nav .nav-item`** 이다. 거기서만 찾는다.
async function 눌러(p, 글) {
  // 📥 「가져오기」만 생김새가 다르다 — `BottomNav.jsx:63` 의 `.nav-item-import`(파란 원).
  //    ⛔ 글자로 거르면 코치마크가 짚는 원 때문에 3초 만에 죽는다(2026-09-15 실측).
  const 것 = 글 === '가져오기'
    ? p.locator('.bottom-nav .nav-item-import').first()
    : p.locator('.bottom-nav .nav-item').filter({ hasText: 글 }).first()
  if (await 것.count() === 0) { console.log(`   ⛔ 하단 탭에서 「${글}」을 못 찾았다`); return false }
  try { await 것.click({ timeout: 3000 }); await p.waitForTimeout(900); return true }
  catch (e) { console.log(`   ⛔ 「${글}」 누르기 실패 — ${String(e).split('\n')[0].slice(0, 110)}`); return false }
}
// 🚪🚪 «길 막는 것 치우기» — `_shot-첫사람-가져오기-0910.mjs:85` 와 같은 방법.
//    ⛔ 2026-09-15 에 이걸 안 쓰고 「단추 한 번 누르기」로 줄였다가 **다섯 화면이 다 홈으로 찍혔다**.
//       뿌리 = 온보딩 시트·코치마크가 화면을 통째로 덮어 **탭 누르기가 3초 만에 죽었다**(TimeoutError).
//    📌 종류가 하나가 아니다 — 온보딩 단추 · 시트(`sheet-mask`) · 코치마크. 셋 다 치운다.
async function 길막치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) {
      try { await 시트.click({ timeout: 2500 }); await p.waitForTimeout(700); continue } catch { /* 다음 갈래로 */ }
    }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) {
      try { await 코치.click({ timeout: 2500 }); await p.waitForTimeout(700); continue } catch { /* 다음 갈래로 */ }
    }
    const 다음 = p.locator('button', { hasText: /^(시작|다음|시작하기|확인|알겠어요|닫기|건너뛰기)/ }).first()
    if (await 다음.count() > 0 && await 다음.isVisible().catch(() => false)) {
      try { await 다음.click({ timeout: 2500 }); await p.waitForTimeout(700); continue } catch { /* 더는 못 치운다 */ }
    }
    break
  }
}

// 🍱 레시피 탭의 낱장 = `MyRecipesScreen.jsx:936` 의 `.grid-card`
async function 첫카드(p) {
  const n = await p.locator('.grid-card').count()
  if (n === 0) { console.log('   ⛔ 레시피 탭에 낱장(.grid-card)이 0개 — 상세로 들어갈 것이 없다'); return }
  try { await p.locator('.grid-card').first().click({ timeout: 3000 }); await p.waitForTimeout(1000) }
  catch (e) { console.log(`   ⛔ 낱장 누르기 실패 — ${String(e).split('\n')[0].slice(0, 110)}`) }
}

// 📏 «숫자로» 남긴다 — 그림만 보면 「좀 커 보인다」로 끝난다
async function 재기(p, w) {
  return p.evaluate((폭) => {
    const 몸 = document.body
    const 카드 = document.querySelector('.mini-card')
    const 글수 = (document.body.innerText || '').split('\n').filter((l) => l.trim()).length
    const 빈오른쪽 = (() => {
      // 화면 오른쪽 절반에 «무엇이든» 그려져 있나 — 비면 패드에서 반이 논다
      const 것들 = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 20 && r.height > 20 && r.left > 폭 * 0.55 && r.top < window.innerHeight
      })
      return 것들.length
    })()
    // 🧭 «지금 어느 탭인가» — 이게 없으면 「옮겨졌다」를 글 수로 짐작하게 된다(2026-09-15 실제 사고)
    const 켜진탭 = (() => {
      const e = document.querySelector('.bottom-nav .nav-item[aria-current="page"]')
      return e ? (e.innerText || '').trim().replace(/\s+/g, ' ') : '(없음)'
    })()
    return {
      켜진탭,
      가로넘침: Math.max(0, 몸.scrollWidth - 폭),
      카드폭: 카드 ? Math.round(카드.getBoundingClientRect().width) : null,
      카드비율: 카드 ? +(카드.getBoundingClientRect().width / 폭 * 100).toFixed(1) : null,
      글수,
      오른쪽것: 빈오른쪽,
    }
  }, w)
}

console.log('\n📱 지금 앱의 패드 화면 — 찍고 잰다\n')
const 표 = []

for (const { 이름: 크기이름, w, h } of 크기들) {
  // 🔐 딱 하나만 심는다 = 「로그인 관문을 지났다」 — `_shot-첫사람-가져오기-0910.mjs:118` 과 «같은 방법».
  //    ⛔ 까닭 = 로그인 벽은 «확정 설계»다(v12.73). 구글 로그인은 자동으로 못 지난다.
  //    ⛔ 온보딩·코치는 여전히 «안» 심는다 — 패드 유저도 그걸 그대로 본다.
  //    📌 2026-09-15 첫 판이 이걸 빠뜨려 «다섯 화면이 다 로그인 화면»으로 찍혔다(글 수가 다 같아 들켰다).
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  for (const { 이름, 가기 } of 길) {
    const p = await ctx.newPage()
    await p.goto('http://127.0.0.1:4493/hankki/', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2600)          // 첫 화면이 다 그려질 때까지
    await 길막치우기(p)
    try { await 가기(p) } catch { /* 길이 막히면 거기까지 찍는다 */ }
    // ⛔ 찍기 «직전»에 한 번 더 치운다 — 코치마크가 화면을 덮으면 «레이아웃을 못 본다»(규칙 21).
    //    📌 2026-09-15 첫 성공 판이 그랬다: 장보기 왼쪽 칸이 코치 그늘에 가려 비어 보였다.
    await 길막치우기(p)
    await p.waitForTimeout(900)
    const 잰값 = await 재기(p, w)
    await p.screenshot({ path: join(OUT, `${크기이름}-${이름}.jpg`), type: 'jpeg', quality: 72 })
    표.push({ 크기: 크기이름, 화면: 이름, ...잰값 })
    await p.close()
  }
  await ctx.close()
}
await b.close(); srv.close()

console.log('='.repeat(72))
console.log('  📋 잰 것 — ⛔가로넘침 0 이어야 한다 · 카드비율이 폰보다 «작으면» 패드에서 쪼그라든 것이다')
console.log('='.repeat(72))
for (const r of 표) {
  console.log(`[${r.크기.padEnd(5)}] ${r.화면.padEnd(14)} 탭 ${String(r.켜진탭).padEnd(6)} 넘침 ${String(r.가로넘침).padStart(3)}px · 카드 ${String(r.카드폭 ?? '-').padStart(4)}px(${r.카드비율 ?? '-'}%) · 글 ${String(r.글수).padStart(3)}줄 · 오른쪽 ${r.오른쪽것}개`)
}
console.log(`\n📂 캡처 = ${OUT}`)
