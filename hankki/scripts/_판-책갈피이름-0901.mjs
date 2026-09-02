// 🔖🔖 **「책갈피」 → 「이번주」 이름 판** — 실제 앱 화면에 «이름만» 갈아끼워 찍는다 (창업자 제안 2026-09-01)
//
// 📮 창업자 = *"자주해먹는 것은 자주니까 **책갈피는 이번주로 이름바꾸는 거 어떨지..**"*
//
// ⭐ 창업자가 짚은 게 정확하다 — 「자주 해먹는 것」이 이미 **「자주」**를 쓰고 있어 뜻이 겹친다.
//
// ⛔⛔ **소스를 고치지 않는다** — 화면에 그려진 «글자만» 바꿔 찍는다(절대원칙 30).
//    그래서 지금 앱 그대로에 얹히고, 판정이 끝나기 «전»에 앱이 바뀌는 일이 없다(규칙 9·13).
//    ⭐ 2026-08-24 「열쇠 이름」 판(`_판-열쇠이름-0824`)과 같은 방식이다.
//
// 🔢 이름이 «화면에» 뜨는 자리 = 여덟 (실측 · 주석 뺀 것)
//    ① 레시피 탭 칩 「책갈피 N」          `MyRecipesScreen:728`
//    ② 카드 단추 읽어주기(aria)           `MyRecipesScreen:791`
//    ③ 모아보기 제목                      `FavoritesScreen:19`
//    ④ 모아보기 빈칸 문구                 `FavoritesScreen:22`
//    ⑤ 설정 메뉴 줄                       `ProfileScreen:321`
//    ⑥ 설정 통계 이름표                   `ProfileScreen:467`
//    ⑦ 사용법 항목 제목·설명              `TabTips:42`
//    ⑧ 상세 단추 읽어주기(aria)           `RecipeDetailScreen:391`
//    📌 v11.02 에 **한 곳만 바꿨다가 말이 갈라진** 자리다 — 바꾸면 여덟을 «같이» 바꾼다.
//
// 실행: node /home/user/hankki/hankki/scripts/_판-책갈피이름-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/책갈피'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// ⭐ 이름을 갈아끼우는 «단 하나»의 함수 — 화면에 그려진 글자 마디만 바꾼다.
//    ⛔ `innerHTML` 을 건드리면 리액트가 다시 그릴 때 되돌아가고 그림도 날아간다 → «글자 마디»만.
const 갈아끼우기 = (새이름) => {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const 바꿀것 = []
  while (walk.nextNode()) if (walk.currentNode.nodeValue.includes('책갈피')) 바꿀것.push(walk.currentNode)
  바꿀것.forEach((n) => { n.nodeValue = n.nodeValue.replaceAll('책갈피', 새이름) })
  // 읽어주기(aria)도 같이 — 눈엔 안 보여도 «이름»이다
  document.querySelectorAll('[aria-label*="책갈피"]').forEach((el) => {
    el.setAttribute('aria-label', el.getAttribute('aria-label').replaceAll('책갈피', 새이름))
  })
  return 바꿀것.length
}

async function 앱열기(폭 = 390, 높이 = 844) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  }
  return { ctx, p }
}

const 탭으로 = async (p, 이름) => {
  await p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first().click().catch(() => {})
  await p.waitForTimeout(900)
}

// 🔖🔖 **먼저 «꽂아야» 이름이 화면에 뜬다** — 칩은 `favCount > 0` 일 때만 그려진다
//    (`MyRecipesScreen:728`). 씨앗엔 꽂은 게 0이라 첫 판이 **여덟 화면 전부 「책갈피」 0개**로 나왔고,
//    그런데도 자기검사는 **초록불**이었다 — 「바꾼 판에 옛 이름이 안 남았나」만 봤으니까.
//    ⛔⛔ **통과했는데 아무것도 안 쟀다**(절대원칙 18 ⓘ). 그래서 검사에 「지금 판엔 있어야 한다」를 넣었다.
async function 책갈피꽂기(p, 개수 = 3) {
  await 탭으로(p, '레시피')
  const 단추 = p.locator('[aria-label*="책갈피 꽂기"]')
  const n = Math.min(await 단추.count(), 개수)
  for (let i = 0; i < n; i++) { await 단추.nth(0).click().catch(() => {}); await p.waitForTimeout(350) }
  return n
}

// ── 찍을 자리 넷 ─────────────────────────────────────────
const 자리 = [
  {
    id: 'chip', 이름: '레시피 탭 — 칩',
    설명: '제일 자주 보는 자리. 요리사모자 그림이 «이름 옆에» 붙어 있다',
    가기: async (p) => { await 책갈피꽂기(p) },
  },
  {
    id: 'list', 이름: '모아보기 화면 — 제목',
    설명: '칩을 누르면 열리는 화면. 제목과 빈칸 문구에 이름이 두 번 나온다',
    가기: async (p) => {
      await 책갈피꽂기(p)
      await p.locator('button, [role="button"]').filter({ hasText: /책갈피/ }).first().click().catch(() => {})
      await p.waitForTimeout(900)
    },
  },
  {
    id: 'settings', 이름: '설정 — 메뉴 ＋ 통계',
    설명: '메뉴 줄과 통계 이름표 두 곳에 나온다',
    가기: async (p) => {
      await 책갈피꽂기(p)                     // 통계가 0이면 이름표만 있고 값이 안 산다
      await 탭으로(p, '홈')
      await p.locator('[aria-label*="설정"]').first().click().catch(() => {})
      await p.waitForTimeout(1000)
    },
  },
  {
    id: 'home', 이름: '홈 — 말이 겹치나',
    설명: '⚠️ 홈엔 이미 「이번 주 제철」·「자주 해먹는 것」이 있다. 이름을 「이번주」로 바꾸면 여기서 말이 겹친다',
    가기: async (p) => { await 탭으로(p, '홈') },
  },
]

const 잰값 = []
for (const s of 자리) {
  for (const 판 of [{ id: 'now', 이름: '지금 (책갈피)', 새이름: null }, { id: 'new', 이름: '바꾸면 (이번주)', 새이름: '이번주' }]) {
    const { ctx, p } = await 앱열기()
    await s.가기(p)
    const 바뀐개수 = 판.새이름 ? await p.evaluate(갈아끼우기, 판.새이름) : 0
    await p.waitForTimeout(300)
    const 파일 = `${s.id}-${판.id}.png`
    await p.screenshot({ path: join(OUT, 파일) })
    // 🔢 「이 화면에 이름이 몇 번 뜨나」를 같이 찍는다 — 안 재면 «아무것도 안 바꾸고» 통과한다(규칙 18 ⓘ)
    const 남은 = await p.evaluate(() => (document.body.innerText.match(/책갈피/g) || []).length)
    잰값.push({ 자리: s.id, 자리이름: s.이름, 설명: s.설명, 판: 판.id, 판이름: 판.이름, 파일, 바뀐개수, 남은 })
    console.log(`  · ${s.이름.padEnd(22)} ${판.이름.padEnd(16)} 갈아끼운 마디 ${바뀐개수} · 화면에 남은 「책갈피」 ${남은}`)
    await ctx.close()
  }
}
await b.close(); srv.close()

// ⚠️⚠️ **스스로 검사 — 두 쪽을 «다» 본다**
//    ⛔ 첫 판은 「바꾼 판에 옛 이름이 안 남았나」만 봐서 **화면이 텅 비어도 초록불**이었다.
//       안 간 화면엔 당연히 옛 이름도 없다 — 2026-08-24 열쇠 판에서 밟은 것과 «같은» 함정이다.
//    ✅ 그래서 ①지금 판엔 이름이 «있어야» 하고 ②바꾼 판엔 «없어야» 한다. 둘 다 봐야 재는 것이 된다.
let 죽음 = 0
const 빈곳 = 잰값.filter((v) => v.판 === 'now' && v.남은 === 0 && v.자리 !== 'home')
if (빈곳.length) { console.error(`\n⛔ 「지금」 판인데 「책갈피」가 한 번도 안 뜬 화면 ${빈곳.length}곳 — ${빈곳.map((v) => v.자리).join(', ')} (그 화면엔 못 갔다는 뜻이다)`); 죽음++ }
const 샌곳 = 잰값.filter((v) => v.판 === 'new' && v.남은 > 0)
if (샌곳.length) { console.error(`⛔ 바꾼 판인데 「책갈피」가 남은 화면 ${샌곳.length}곳 — ${샌곳.map((v) => v.자리).join(', ')}`); 죽음++ }
if (!죽음) console.log('\n✅ 지금 판엔 이름이 뜨고 · 바꾼 판엔 한 글자도 안 남았다')

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰값, null, 2))
console.log(`\n📁 ${OUT}`)
