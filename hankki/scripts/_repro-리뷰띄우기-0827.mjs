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
//
// ⛔⛔ **탭이 달라도 저장소는 «하나»다** — 앞 칸이 심어둔 「물어봤음」이 뒤 칸까지 살아남아
//    리뷰창이 처음부터 안 뜨고, 그러고도 **아무것도 안 잰 채 초록불**이 된다(규칙 18 ⓘ).
//    → 열 때마다 지운다. ⭐일부러 심어야 하는 칸(⑤)은 «연 뒤에» 심는다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.removeItem('hankki:nudge:review') } catch {} })
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

// ⭐ 「뜰 것」을 잴 땐 «기다린다» — 고정 대기로 재면 흔들린다(오늘 이걸로 한 번 헛돌았다).
//    ⛔ 「안 뜰 것」에는 쓰지 않는다 — 없는 걸 기다리면 그냥 늦어질 뿐이다.
const 리뷰창기다리기 = async (page, ms = 4000) => {
  await page.waitForFunction(
    () => /한마디 남겨주실래요|스토어에 한마디/.test(document.body.innerText || ''),
    null, { timeout: ms },
  ).catch(() => {})
  return 리뷰창떴나(page)
}

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
  // ⛔⛔ [2026-08-28] 여기가 «고정 대기»라 스모크에서 흔들렸다 — 세 번 중 두 번 죽었다.
  //    93개가 동시에 도는 스모크에선 카드 그리는 데 1.5초를 넘긴다.
  //    📌 이 파일 «안»에 이미 *"고정 대기(2.5초)로는 캡처가 안 끝나…"* 라고 적어놓고
  //       바로 아랫자리(공유누르기)만 고치고 «이 자리»를 남겼다.
  //    ✅ 잣대는 시간이 아니라 «그려졌나» 다 — 단추가 나타날 때까지 기다린다.
  //    🧪 규칙 12 = 1500 → 150 으로 줄이면 32/33 으로 죽는다(스모크에서 죽은 그 칸과 같다).
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('랜덤 카드로 뽑기')),
    null, { timeout: 20000 },
  ).catch(() => {})
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('랜덤 카드로 뽑기'))
    t?.click()
  })
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => /공유하기|만드는 중/.test(x.innerText || '')),
    null, { timeout: 45000 },
  ).catch(() => {})
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
// ⛔⛔ [2026-08-28] 여기가 **타이밍이 아니라 «진짜 논리 버그»** 였다 — 스모크에서 계속 흔들렸다.
//   옛 코드 = `waitForFunction(() => (window.__부름 || 0) > 0)` = **「부른 적이 «있나»」**.
//   ⭐ 그런데 ⑥칸은 «두 번» 공유한다. 두 번째엔 첫 번째 때문에 이미 1이라
//      **조건이 «처음부터 참»이라 기다리지 않고 바로 돌아왔다** — 공유가 나가기도 전에.
//   📌 평소엔 빨라서 우연히 맞았고, 스모크(93개 동시)에서 느려지면 드러났다.
//      증상 = 「두 번째 공유도 나갔다 (보냄 1)」 ⛔ (2가 나와야 한다)
//   ✅ 「있나」가 아니라 **「눌렀을 때보다 «늘었나»」**를 기다린다.
//   🧪 규칙 12 = CPU 에 부하를 걸고 돌리면 옛 코드는 32/33 · 이 코드는 33/33.
const 공유누르기 = async (page) => {
  const 전 = await page.evaluate(() => window.__부름 || 0)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('공유하기'))
    t?.click()
  })
  await page.waitForFunction((n) => (window.__부름 || 0) > n, 전, { timeout: 45000 }).catch(() => {})
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
    chk('⭐ 카드를 닫자 리뷰창이 뜬다 — 창업자가 말한 「쓰다가 뜬다」', await 리뷰창기다리기(page))
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
  const p2 = await 새탭()
  // ⭐ 「이미 물어본 사람」을 여기서 심는다 — 새탭() 이 열 때 지우므로 «연 뒤에» 심어야 한다
  await p2.evaluate(() => { try { localStorage.setItem('hankki:nudge:review', '1') } catch {} })
  await 공유흉내(p2, true)
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(p2))
  chk('자랑 카드가 떴다', await 자랑카드열기(p2))
  const { 보냄 } = await 공유누르기(p2)
  chk(`이번엔 «진짜로 보냈다» (보냄 ${보냄})`, 보냄 > 0)   // ⛔ 안 보냈으면 아래가 헛방이다
  await 카드닫기(p2)
  chk('⛔ 이미 물어본 사람에겐 «안» 뜬다 — 재촉하지 않는다(설계원칙)', !(await 리뷰창떴나(p2)))
  await page.close(); await p2.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n⑥ ⭐ 「1회만」이 «진짜인가» — 어떻게 닫아도 두 번째 공유엔 안 뜬다')
// ─────────────────────────────────────────────────────────────
//   📮 창업자 물음 = *"레꾸자랑을 하면 «1회만» 리뷰써달라는 안내가뜨는거지?"*
//   ⛔⛔ 처음엔 «아니었다» — `useModalBack(onClose)` 라 **뒤로가기로 닫으면 표시가 안 남았다.**
//      그러면 공유할 때마다 또 떠서 **조르는 앱**이 된다. 이 칸이 그걸 지킨다.
{
  const page = await 새탭()
  // ⛔⛔ 앞 칸 ⑤ 가 심어둔 「물어봤음」이 **여기까지 살아 있다** — 탭이 달라도 저장소는 하나다.
  //    지우지 않으면 리뷰창이 처음부터 안 떠서 **아무것도 안 재고 초록불**이 된다(규칙 18 ⓘ · 오늘 세 번째).
  await page.evaluate(() => { try { localStorage.removeItem('hankki:nudge:review') } catch {} })
  await 공유흉내(page, true)
  chk('시작할 때 「물어봤음」이 «없다» — 앞 칸이 남긴 게 없나', await page.evaluate(() => {
    try { return localStorage.getItem('hankki:nudge:review') !== '1' } catch { return false }
  }))
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  chk('자랑 카드가 떴다', await 자랑카드열기(page))
  const 첫판 = await 공유누르기(page)
  chk(`첫 공유가 나갔다 (보냄 ${첫판.보냄})`, 첫판.보냄 > 0)
  await 카드닫기(page)
  chk('첫 공유엔 리뷰창이 뜬다', await 리뷰창기다리기(page))

  // ⭐ 「닫기」·「나중에」가 아니라 **뒤로가기**로 닫는다 — 새던 자리가 여기다
  await page.goBack().catch(() => {})
  await page.waitForTimeout(900)
  chk('뒤로가기로 리뷰창이 닫혔다', !(await 리뷰창떴나(page)))
  chk('⭐ 뒤로가기로 닫아도 「물어봤음」이 남는다', await page.evaluate(() => {
    try { return localStorage.getItem('hankki:nudge:review') === '1' } catch { return false }
  }))

  // 두 번째 공유 — 이번엔 안 떠야 한다
  chk('레꾸자랑 탭으로 돌아왔다', await 자랑탭열기(page))
  chk('자랑 카드를 다시 열었다', await 자랑카드열기(page))
  const 둘째 = await 공유누르기(page)
  chk(`두 번째 공유도 나갔다 (보냄 ${둘째.보냄})`, 둘째.보냄 > 첫판.보냄)
  await 카드닫기(page)
  chk('⛔⛔ 두 번째 공유엔 «안» 뜬다 — 조르지 않는다', !(await 리뷰창떴나(page)))
  await page.close()
}

// ─── ⑦ 🚨 「내가 꾸민 표지 그대로」 — 창업자가 «아예 못 본» 그 길 ────────────
//
// 📮 창업자 폰 제보 2026-08-28 = *"레꾸자랑은 내가 **아예** 못봤어..ㅠ"*
//
// ⛔⛔ **③~⑥은 전부 「랜덤 카드로 뽑기」만 밟았다.** 그런데 선택 시트의 «주인공»은
//    맨 위 갈색 단추 **「내가 꾸민 표지 그대로」**(`sendCover`)다. 랜덤 카드는 그 아래 «옵션»이다.
//    → **보통 유저가 누르는 길에서는 리뷰창이 영영 안 떴다.**
// 📌 앞 판 주석은 *"공유 성공 자리가 셋인데 셋 다 그 약속을 쓴다"* 였는데
//    그 「셋」은 `ShareDrawCard` «안»의 셋이었고 `sendCover` 는 그 컴포넌트를 «안 거친다».
//    ⭐ 「한 곳만 감쌌다」가 참이려면 **모든 길이 그 한 곳을 지나가야** 한다 — 안 지나갔다.
console.log('\n⑦ 🚨 「내가 꾸민 표지 그대로」로 보내도 뜨나 — 창업자가 못 본 그 길')
{
  const page = await 새탭()
  await 공유흉내(page, true)
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  // 레시피 하나 → 선택 시트
  await page.evaluate(() => { [...document.querySelectorAll('button[aria-label$="자랑하기"]')][0]?.click() })
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')),
    null, { timeout: 20000 },
  ).catch(() => {})
  const 주인공있나 = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')))
  chk('선택 시트에 «주인공» 단추가 있다', 주인공있나)

  const 전 = await page.evaluate(() => window.__보냄 || 0)
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로'))?.click()
  })
  // ⛔ 고정 대기로 재지 않는다 — 표지 캡처가 오래 걸린다. «보냈나»가 늘 때까지 기다린다
  await page.waitForFunction((n) => (window.__보냄 || 0) > n, 전, { timeout: 45000 }).catch(() => {})
  const 보냄 = await page.evaluate(() => window.__보냄 || 0)
  chk(`꾸민 표지가 «나갔다» (보냄 ${보냄})`, 보냄 > 전)
  chk('⭐⭐ 그 길에서도 리뷰창이 뜬다', await 리뷰창기다리기(page))
  await page.close()
}

// ─── ⑧ 🚨🚨 「지금 보내기」 — 창업자 폰이 실제로 지나가는 길 ─────────────
//
// 📮 창업자 2026-08-28 = *"리뷰 안떠..ㅠㅠ"* — **⑦을 고쳐 배포한 «뒤»에도.**
//
// ⛔⛔ **⑦은 공유가 «바로» 성공하는 길만 밟는다.** 그런데 창업자 폰은 표지 캡처가 십수 초 걸려
//    **누른 순간의 허가(user activation)가 끊긴다** — 그때 앱은 「지금 보내기」 시트를 띄운다
//    (창업자가 08-03「먹통」·08-04「다운로드」·08-05「내가만든표지는안돼」 로 세 번 제보한 그 증상).
//    → 그 단추로 공유는 **진짜로 나가는데**, `sendCover` 의 `finally` 는 이미 지나가서
//      `자랑보냄` 이 false 로 되돌려진 뒤였다. **보냈는데 아무도 안 물어본다.**
// 📌 어제 내가 적은 *"「한 곳만 감쌌다」가 참이려면 모든 길이 그 한 곳을 지나가야 한다"* 를
//    **바로 다음 길에서 또 어겼다.** `ShareDrawCard` 는 「지금 보내기」까지 `go()` 를 지나가 멀쩡한데,
//    `sendCover` 쪽은 `SendNowSheet` 가 `sharePendingNow` 를 «직접» 불러 빠져나갔다.
//
// 🎭 흉내 = **첫 번째 share 만 `NotAllowedError`** (＝허가 끊김) · 두 번째부터 성공.
//    ⛔ `AbortError`(＝유저가 닫음)와 다른 이름이라야 한다 — 코드가 그 둘을 갈라 처리한다.
console.log('\n⑧ 🚨 허가가 끊겨 「지금 보내기」로 나간 경우에도 뜨나 — 창업자 폰이 가는 길')
{
  const page = await 새탭()
  await page.evaluate(() => {
    navigator.canShare = () => true
    let 첫번 = true
    navigator.share = () => {
      window.__부름 = (window.__부름 || 0) + 1
      if (첫번) { 첫번 = false; return Promise.reject(Object.assign(new Error('user activation'), { name: 'NotAllowedError' })) }
      window.__보냄 = (window.__보냄 || 0) + 1
      return Promise.resolve()
    }
  })
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  await page.evaluate(() => { [...document.querySelectorAll('button[aria-label$="자랑하기"]')][0]?.click() })
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')),
    null, { timeout: 20000 },
  ).catch(() => {})
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로'))?.click()
  })
  // ⭐ 여기가 이 칸의 «전제» — 허가가 끊겨 「지금 보내기」 시트가 떠야 한다.
  //   ⛔ 안 뜨면 아래 두 칸은 아무것도 안 재고 초록불이 된다(규칙 18 ⓘ) → 전제부터 잰다.
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('지금 보내기')),
    null, { timeout: 45000 },
  ).catch(() => {})
  const 시트떴나 = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('지금 보내기')))
  chk('허가가 끊겨 「지금 보내기」 시트가 떴다 (＝이 칸의 전제)', 시트떴나)

  const 전보냄 = await page.evaluate(() => window.__보냄 || 0)
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('지금 보내기'))?.click()
  })
  await page.waitForFunction((n) => (window.__보냄 || 0) > n, 전보냄, { timeout: 20000 }).catch(() => {})
  const 보냄8 = await page.evaluate(() => window.__보냄 || 0)
  chk(`「지금 보내기」로 «진짜» 나갔다 (보냄 ${보냄8})`, 보냄8 > 전보냄)
  chk('⭐⭐ 그 길에서도 리뷰창이 뜬다', await 리뷰창기다리기(page, 6000))
  await page.close()
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
console.log('📌 ①② = 고치기 «전» 상태(문이 사실상 닫혀 있다) · ③④⑤ = ㉠ 으로 연 문.')
console.log('   ③이 죽으면 리뷰창이 다시 0명에게 뜬다. ④가 죽으면 «안 보낸 사람»에게 조른다.\n')

await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
