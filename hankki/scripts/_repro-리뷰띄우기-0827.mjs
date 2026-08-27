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

// 📌 메모지(포스트잇) — 고치기 «전» 리뷰창으로 가는 유일한 문이었다
const 메모지있나 = (page) => page.evaluate(() => !!document.querySelector('.memo-note'))

// ─── ㉠ 레꾸자랑 길 ──────────────────────────────────────────
const 자랑탭열기 = async (page) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레꾸자랑'))?.click()
  })
  await page.waitForTimeout(700)
  return page.evaluate(() => /레꾸자랑/.test(document.body.innerText || ''))
}

// 레시피 하나 → 선택 시트 → 「랜덤 카드로 뽑기」 → 자랑 카드
const 자랑카드열기 = async (page) => {
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button[aria-label$="자랑하기"]')][0]
    t?.click()
  })
  await page.waitForTimeout(600)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('랜덤 카드로 뽑기'))
    t?.click()
  })
  await page.waitForTimeout(1500)   // 카드를 그린다
  return page.evaluate(() => [...document.querySelectorAll('button')].some((x) => /공유하기|만드는 중/.test(x.innerText || '')))
}

// 🎭 `navigator.share` 흉내 — 헤드리스엔 공유창이 없다.
//    ⛔ 흉내는 «브라우저가 하는 일»까지다. 앱이 그 뒤에 무엇을 하는지는 앱 코드가 그대로 판정한다.
//    ⭐ 부른 «횟수»와 «보낸» 횟수를 갈라 센다 — 안 그러면 「부르지도 않았는데 안 떴다」를
//       「안 보냈으니 안 떴다」로 잘못 읽는다(④⑤가 아무것도 안 재고 초록불이 된다).
const 공유흉내 = (page, 보내지나) => page.evaluate((ok) => {
  navigator.canShare = () => true
  navigator.share = () => {
    window.__부름 = (window.__부름 || 0) + 1
    if (!ok) return Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }))
    window.__보냄 = (window.__보냄 || 0) + 1
    return Promise.resolve()
  }
}, 보내지나)

// 「공유하기」 → 카드 캡처(최대 35초)를 «기다린다»
//    ⛔ 고정 대기(2.5초)로는 캡처가 안 끝나 한 번도 안 불렸다 — 그러고도 뒤 칸이 초록불이었다.
const 공유누르기 = async (page) => {
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('공유하기'))
    t?.click()
  })
  await page.waitForFunction(() => (window.__부름 || 0) > 0, null, { timeout: 45000 }).catch(() => {})
  await page.waitForTimeout(500)
  return page.evaluate(() => ({ 부름: window.__부름 || 0, 보냄: window.__보냄 || 0 }))
}

const 카드닫기 = async (page) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('button')].filter((x) => (x.innerText || '').trim() === '닫기')
    bs[bs.length - 1]?.click()
  })
  await page.waitForTimeout(900)
}

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

// ─────────────────────────────────────────────────────────────
console.log('\n③ ㉠ 레꾸자랑을 «보낸» 사람 — 카드를 닫으면 뜬다 (창업자 확정 2026-08-27)')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()

  await 공유흉내(page, true)

  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  chk('자랑 카드가 떴다', await 자랑카드열기(page))
  chk('⛔ 카드가 떠 있는 «동안»엔 리뷰창이 안 뜬다 — 시트 위에 시트 금지', !(await 리뷰창떴나(page)))

  const { 부름, 보냄 } = await 공유누르기(page)
  chk(`공유가 실제로 나갔다 (부름 ${부름} · 보냄 ${보냄})`, 보냄 > 0)
  if (!보냄) { console.log('  ⛔⛔ 공유가 안 불렸다 — 아래는 «재지 않은 것»이므로 판정하지 않는다'); 실패 += 2 }
  else {
    chk('⛔ 보낸 «직후»에도 아직 안 뜬다 — 카드를 안 뺏는다(표지로 저장이 남아 있다)', !(await 리뷰창떴나(page)))

    await 카드닫기(page)
    chk('⭐ 카드를 닫자 리뷰창이 뜬다 — 창업자가 말한 「쓰다가 뜬다」', await 리뷰창떴나(page))
    chk('머리글이 그 자리에서 «참»이다 — 「레꾸 자랑 보냈어요」', await page.evaluate(() =>
      document.body.innerText.includes('레꾸 자랑 보냈어요') && !document.body.innerText.includes('번째 한 끼예요')))
  }

  await page.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n④ 안 보낸 사람에겐 «안» 뜬다 — 공유창을 그냥 닫은 경우')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  await 공유흉내(page, false)   // 유저가 공유창을 닫음 → AbortError
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  chk('자랑 카드가 떴다', await 자랑카드열기(page))
  const { 부름, 보냄 } = await 공유누르기(page)
  // ⛔ 「부르지도 않았는데 안 떴다」를 「안 보냈으니 안 떴다」로 읽지 않는다
  chk(`공유창까지는 갔다 (부름 ${부름} · 보냄 ${보냄})`, 부름 > 0 && 보냄 === 0)
  await 카드닫기(page)
  chk('⛔ 안 보냈으니 리뷰창도 «안» 뜬다', !(await 리뷰창떴나(page)))
  await page.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n⑤ 한 번 물었으면 두 번 안 묻는다 — 거절해도 마찬가지')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  await page.evaluate(() => { try { localStorage.setItem('hankki:nudge:review', '1') } catch {} })
  const p2 = await 새탭()
  await 공유흉내(p2, true)
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(p2))
  chk('자랑 카드가 떴다', await 자랑카드열기(p2))
  const { 보냄 } = await 공유누르기(p2)
  chk(`이번엔 «진짜로 보냈다» (보냄 ${보냄})`, 보냄 > 0)   // ⛔ 안 보냈으면 아래가 헛방이다
  await 카드닫기(p2)
  chk('⛔ 이미 물어본 사람에겐 «안» 뜬다 — 재촉하지 않는다(설계원칙)', !(await 리뷰창떴나(p2)))
  await page.close(); await p2.close()
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
console.log('📌 ①② = 고치기 «전» 상태(문이 사실상 닫혀 있다) · ③④⑤ = ㉠ 으로 연 문.')
console.log('   ③이 죽으면 리뷰창이 다시 0명에게 뜬다. ④가 죽으면 «안 보낸 사람»에게 조른다.\n')

await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
