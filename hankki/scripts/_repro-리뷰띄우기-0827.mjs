// 🗣 「리뷰 자동으로 띄우기」 재현판 — 창업자 2026-08-27
//
// 📮 창업자 = *"우리 리뷰자동으로띄우는거 만들어야해. **사람들이 쓰다가 리뷰쓰게끔.**"*
//    → *"해먹으리에서 갑자기 리뷰가 뜨더라고"* · *"우리도 **쓰다가 띄우면 자연스럽게 리뷰쓰게 되잖아.**"*
//
// ⭐⭐ **이 판의 심장 = 「보통으로 쓰는 사람에게 리뷰창이 «뜨나»」.**
//    ⛔ 「코드가 있나」가 아니다 — `ReviewAskSheet.jsx` 는 2026-07-30 부터 있었다.
//       그런데 **부르는 자리가 하나뿐**이고 그 자리가 거의 안 닿는다.
//       📌 규칙 18 ⓘ — 「있나」와 「닿나」는 다른 말이다.
//
// 🔢 「보통으로 쓰는 사람」의 정의 = **「만들었어요」만 누른 사람.**
//    그게 만드는 기록은 `note: ''` · `rating: 0` 이다
//    (`CookScreen.jsx:96` · `RecipeDetailScreen.jsx:201` — 둘 다 빈 메모).
//
// ⛔ 소스 grep 아님 — **화면에 그려진 것**으로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-리뷰띄우기-0827.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4419, r))

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

// ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(`check-mistakes` ⑧). 새 탭으로 연다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}

// 📔 「만들었어요」가 만드는 것과 «똑같은» 기록을 N장 심는다 — 빈 메모·별점 0
//    ⭐ 여기가 이 판의 전제다. 흉내가 아니라 앱이 실제로 저장하는 모양 그대로다.
//    ⛔ 씨앗 일기(「방학언제끝나냐..」)가 «다시 살아난다» — 새 탭에서 마이그레이션이 도로 넣는다(규칙 18 ⓙ).
//       그래서 개수를 «==» 로 재지 않고, 노릴 레시피 제목을 «직접 돌려받는다».
const 만들었어요심기 = async (page, N, { note = '', rating = 0 } = {}) =>
  page.evaluate(({ N, note, rating }) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const rs = (s.recipes || []).slice(0, N)
    const 새것 = rs.map((r, i) => ({
      id: `dz${i}`, recipeId: r.id, title: r.title, source: r.source,
      at: Date.now() - (i + 1) * 3600000, rating, note, photo: null,
    }))
    s.diary = [...새것, ...(s.diary || [])]
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return rs[0]?.title || ''
  }, { N, note, rating })

// 🗣 리뷰창이 «화면에» 떠 있나 — 글자로 본다(소스가 아니라 그려진 것)
const 리뷰창떴나 = (page) => page.evaluate(() =>
  /한마디 남겨주실래요|스토어에 한마디/.test(document.body.innerText || ''))

// 🍱 레시피 탭 → 그 레시피 상세. ⛔「열렸다」를 «제목이 화면에 떴나»로 확인한다(눌렀나가 아니다)
const 상세열기 = async (page, 제목) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(600)
  await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    t?.click()
  }, 제목)
  await page.waitForTimeout(900)
  // 상세에만 있는 것으로 확인 — 재료/만드는 법 절이 떠 있고 제목이 보인다
  return page.evaluate((T) => document.body.innerText.includes(T) && /재료|만드는 법/.test(document.body.innerText), 제목)
}

// 📌 메모지(포스트잇) — 리뷰창으로 가는 «유일한» 문이다
const 메모지있나 = (page) => page.evaluate(() => !!document.querySelector('.memo-note'))

console.log('\n🗣 「리뷰 자동으로 띄우기」 — 지금 상태를 잰다\n')

// ─────────────────────────────────────────────────────────────
console.log('① 보통으로 쓰는 사람 — 「만들었어요」만 세 번 (빈 메모)')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  const 제목 = await 만들었어요심기(page, 3)
  const p2 = await 새탭()   // 저장값을 읽은 채로 새로 연다

  const 기록수 = await p2.evaluate(() => (JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary || []).length)
  chk('기록이 3장 넘게 쌓였다 — 리뷰 문턱(3)을 넘었다', 기록수 >= 3)

  // ⛔ 여기부터가 «진짜 잣대»다 — 상세가 «안 열리면» 뒤 칸을 초록불로 만들지 않는다(규칙 18 ⓘ)
  const 열림 = await 상세열기(p2, 제목)
  chk(`레시피 상세가 열렸다 (${제목})`, 열림)
  if (!열림) { console.log('  ⛔⛔ 상세를 못 열었다 — 아래는 «재지 않은 것»이므로 판정하지 않는다'); 실패++ }
  else {
    chk('⛔ 메모지(포스트잇)가 «없다» — 리뷰창으로 가는 유일한 문이 안 생긴다', !(await 메모지있나(p2)))
    chk('⛔ 리뷰창이 «안 뜬다» — 창업자가 말한 바로 그 문제', !(await 리뷰창떴나(p2)))
  }

  await page.close(); await p2.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n② 한 줄까지 «직접 써넣은» 사람 — 그제서야 문이 생긴다')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  const 제목 = await 만들었어요심기(page, 3, { note: '간장 반만', rating: 4 })
  const p2 = await 새탭()

  const 열림 = await 상세열기(p2, 제목)
  chk(`레시피 상세가 열렸다 (${제목})`, 열림)
  if (!열림) { console.log('  ⛔⛔ 상세를 못 열었다 — 판정하지 않는다'); 실패++ }
  else {
    chk('메모지가 생겼다 — 한 줄이 «있어야만» 뜬다', await 메모지있나(p2))

    // 메모지를 눌러 기록 시트를 열고 → 닫는다 (지금 유일한 리뷰 경로)
    await p2.evaluate(() => document.querySelector('.memo-note')?.click())
    await p2.waitForTimeout(700)
    await p2.evaluate(() => {
      const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '닫기')
      t?.click()
    })
    await p2.waitForTimeout(800)
    chk('그때서야 리뷰창이 뜬다 — 다섯을 다 밟아야 열린다', await 리뷰창떴나(p2))
  }

  await page.close(); await p2.close()
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
console.log('📌 ①이 전부 통과 = 「코드는 있는데 보통 유저에겐 영영 안 뜬다」가 사실이다.')
console.log('   리뷰창으로 가려면 ⑴기록 3장 ⑵그 레시피에 «한 줄을 직접 써넣기»')
console.log('   ⑶그 상세로 가기 ⑷포스트잇을 «누르기» ⑸시트를 «닫기» — 다섯을 다 밟아야 한다.\n')

await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
