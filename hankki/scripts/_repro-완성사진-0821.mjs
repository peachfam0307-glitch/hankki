// 📷📷 「완성 사진」 재현판 — 창업자 확정 갈래 ⓒ (2026-08-21)
//
// 📮 창업자 = *"음식앱인데 생동감이 부족하달까.. 음식사진이나 영상이 하나도 없으니까"*
//    🔢 그날 실측 = 앱이 쓰는 기본 레시피 **145편 · 진짜 사진 0편**
//    ⭐ 사진이 «없는» 게 아니라 «버리고» 있었다 — `CookScreen.jsx` 가 `photo: null` 로 담았다
//
// ⛔⛔ **이 판의 심장 = 「막지 않는다」** — 그게 이 기능이 살아남는 조건이다.
//    「끝난 뒤 기록 시트 띄우기」는 **이미 접은 길**이다(`RecipeDetailScreen.jsx:170`
//    *"폼이 앞을 막아서 … 요리 기록 탭이 죽은 이유 중 하나"*).
//    그래서 ①**안 누르면 지금과 한 글자도 안 다르다**를 «먼저» 재고,
//    그다음에 ②눌렀을 때 진짜로 저장되나를 잰다.
//
// ⛔ 소스 grep 아님 — **화면에 그려진 것 ＋ 저장된 값**으로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-완성사진-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
// 🗄 [2026-09-02] 사진은 「큰 창고」(IndexedDB)로 간다 — 서랍엔 쪽지만 남아서 그것만 보면 «늘 빨간불»이 된다
import { 사진있나 } from './_창고사진.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4405, r))

// 🖼 8×8 빨강 PNG — 「사진을 골랐다」를 흉내내는 최소 파일
const 빨강PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2P8z8Dwn4GBgYERxsAmAFOEISjLBAAj8gX9Ol5b0AAAAABJRU5ErkJggg==',
  'base64',
)

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
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

// ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(`check-mistakes` ⑧ 옛 함정 사전). 새 탭으로 연다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto('http://127.0.0.1:4405/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}
const 저장값 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))

// ⏳⏳ **[2026-09-02] 「다 만들었어요」 뒤 저장은 «비동기»다 — 시계가 아니라 «상태»를 기다린다.**
//   ⛔ 전엔 `waitForTimeout(900)` 으로 시계만 보고 «한 번» 읽었다. 사진 이사(v12.24) 뒤로
//      사진이 창고(IndexedDB)로 가면서 저장이 한 박자 늦어졌고, 스모크에서 브라우저 넷이
//      «동시에» 돌 때 900ms 안에 못 끝나 **「사진은 일기에 담겼다」가 false** 로 났다.
//      🔢 실측 = 이 판을 «혼자» 돌리면 4/4 통과다. 앱이 아니라 **판이 성급했다.**
//   ⛔ 창고 읽기에 기다림을 넣는 것만으론 «안 풀렸다» — `d?.photo` 가 아직 `undefined` 면
//      꺼낼 쪽지 자체가 없어 폴링이 아예 안 돈다. **기다려야 할 것은 「일기 줄」이었다.**
//   ⭐ 찾으면 그 자리에서 끝난다 — 멀쩡할 땐 예전과 같은 속도다.
//   ⭐ 못 찾으면 «무엇이 없었는지»를 들고 온다(줄이 없나 / 줄은 있는데 사진이 비었나) —
//      그래야 다음에 이 칸이 빨간불일 때 「앱이 안 썼다」와 「판이 성급했다」를 가른다(규칙 18 ⓘ).
const 일기줄기다리기 = async (page, 레시피id, 제한 = 12000) => {
  const 끝 = Date.now() + 제한
  let 본것 = { st: {}, d: undefined }
  for (;;) {
    const st = await 저장값(page)
    const d = (st.diary || []).find((x) => x.recipeId === 레시피id)
    본것 = { st, d }
    if (d && d.photo) return 본것
    if (Date.now() >= 끝) return 본것
    await new Promise((r) => setTimeout(r, 250))
  }
}
const 왜없나 = (본것) => !본것.d ? '(일기 줄 자체가 없다 — 앱이 아직 안 썼다)'
  : !본것.d.photo ? '(일기 줄은 있는데 photo 가 비었다)' : '(쪽지는 있는데 창고에서 못 꺼냈다)'

// 🍳 요리 모드를 «마지막 단계»까지 연다 — 앱을 실제로 눌러서(흉내 아님)
const 요리끝까지 = async (page, 제목) => {
  await page.evaluate((T) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  }, 제목)
  await page.waitForTimeout(600)
  // ⛔ `.card` 라는 «클래스»를 누르면 안 열린다 — 목록의 레시피는 **`<button>` 자체**다(규칙 18 ⓘ).
  //    ⚠️ 필터 칩(「한식 32」)도 버튼이라 «제목으로 시작하는» 것만 고른다.
  const 열림 = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return false; t.click(); return true
  }, 제목)
  if (!열림) { console.log('     ↳ 카드를 못 눌렀다'); return false }
  await page.waitForTimeout(700)
  // ⛔⛔ [2026-08-29] 옛 판은 «글자»(「요리 시작」)로 찾았다 → 창업자가 「요리모드 시작」으로
  //    이름을 바꾸자 여기서 못 들어가 **뒤 칸이 통째로 죽었다**(게이트가 «맞게» 걸린 것).
  // ✅ `data-coach="cook"` 을 콕 집는다 — 이름이 또 바뀌어도 안 죽는다.
  const 시작 = await page.evaluate(() => {
    const t = document.querySelector('[data-coach="cook"]')
    if (!t) return false; t.click(); return true
  })
  if (!시작) {
    // ⛔ 「없다」의 «이유»를 내가 정하지 않는다(규칙 18) — 그 화면에 무엇이 있었는지 찍는다
    console.log('     ↳ 요리모드 시작 버튼을 못 찾았다 · 그 화면 단추 =',
      await page.evaluate(() => [...document.querySelectorAll('button')].map((x) => (x.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 14).join(' / ')))
    return false
  }
  await page.waitForTimeout(600)
  // 재료 준비 → 조리 단계 → … → 마지막
  for (let n = 0; n < 40; n++) {
    const 다음 = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('.cook-navbtn')]
      const t = bs.find((x) => /시작 →|다음 →/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    if (!다음) break
    await page.waitForTimeout(180)
  }
  return page.evaluate(() => !!document.querySelector('.cook-navbtn.primary') && /다 만들었어요/.test(document.querySelector('.cook-nav')?.innerText || ''))
}

console.log('\n📷 완성 사진 — 요리 모드 (390×844)\n')

// ───────────────────────────────────────────────────────────
console.log('① ⭐⭐ «막지 않는다» — 사진을 안 찍으면 지금과 똑같이 끝난다')
{
  const page = await 새탭()
  const 제목 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes?.find((r) => (r.steps || []).length >= 2)?.title || '')
  chk('  요리할 레시피를 찾았다', !!제목)
  const 끝 = await 요리끝까지(page, 제목)
  chk('  마지막 단계까지 걸어왔다 (「다 만들었어요」가 보인다)', 끝)

  const 화면 = await page.evaluate(() => {
    const b = document.querySelector('.cook-shot-add')
    const r = b?.getBoundingClientRect()
    const cs = b && getComputedStyle(b)
    return {
      사진줄: !!document.querySelector('.cook-shot'),
      // ⭐ 잣대를 «보이는 글자» → «이름표»로 옮겼다 — 2026-08-23 에 동그라미가 되며 글자가 버튼 밖으로 나갔다.
      //    지키려는 것은 「그 글자」가 아니라 **「입구가 있고 눌린다」**이다(규칙 18 ⓘ).
      이름표: b?.getAttribute('aria-label') || '',
      곁글자: document.querySelector('.cook-shot-label')?.innerText.trim() || '',
      // ⭕ 창업자 확정(시안 ㉤) — 동그라미 · 손가락 44px · 색이 있다(흰색이면 안 보인다)
      동그란가: cs ? parseFloat(cs.borderRadius) >= (r.width / 2) - 1 : false,
      크기: r ? Math.round(Math.min(r.width, r.height)) : 0,
      바탕있나: cs ? !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) : false,
      미리보기: !!document.querySelector('.cook-shot-thumb'),
      표지칸: !!document.querySelector('.cook-shot-cover'),
      유니코드이모지: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(document.querySelector('.cook-shot')?.innerText || ''),
    }
  })
  chk('  「완성 사진 남기기」 입구가 있다', 화면.이름표, '완성 사진 남기기')
  chk('  ⭕ 동그라미다 (창업자 확정 시안 ㉤)', 화면.동그란가)
  chk('  ⭕ 색이 있다 (⛔흰색·투명이면 안 보인다)', 화면.바탕있나)
  chk('  ⭕ 곁에 「완성 사진」 글자 (눌러봐야 아는 것을 막는다)', 화면.곁글자, '완성 사진')
  chk('  손가락 44px 이상', 화면.크기 >= 44)
  chk('  아직 미리보기·표지칸은 «없다» (안 찍었으니까)', !화면.미리보기 && !화면.표지칸)
  chk('  ⛔유니코드 이모지 0개 (우리 아이콘만 · CLAUDE.md 핀)', !화면.유니코드이모지)

  // 그냥 「다 만들었어요」 — 아무것도 안 막고 끝나야 한다
  await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /다 만들었어요/.test(x.innerText))?.click())
  await page.waitForTimeout(800)
  const st = await 저장값(page)
  const d = (st.diary || [])[0]
  chk('  ⭐ 눌렀더니 «막는 창 없이» 바로 끝났다', await page.evaluate(() => !document.querySelector('.cook-nav') && !document.querySelector('.sheet-mask')))
  chk('  일기에 담겼다', !!d && d.title === 제목)
  chk('  사진은 없다 (안 찍었으니 null)', d?.photo ?? 'null', 'null')
  await page.close()
}

// ───────────────────────────────────────────────────────────
console.log('\n② 사진을 찍으면 — 미리보기 ＋ 「표지로도 쓰기」')
{
  const page = await 새탭()
  const 골라둔 = await page.evaluate(() => {
    // 꾸민 흔적이 «없는» 레시피를 고른다 (기본값 판정을 보려고)
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2 && !(x.decor?.length > 0))
    return r ? { id: r.id, title: r.title, 옛표지: r.thumb || 'icon' } : null
  })
  chk('  안 꾸민 레시피를 찾았다', !!골라둔)
  await 요리끝까지(page, 골라둔.title)

  await page.setInputFiles('.cook-shot input[type=file]', { name: '완성.png', mimeType: 'image/png', buffer: 빨강PNG })
  await page.waitForTimeout(700)
  chk('  자르기 시트가 떴다', await page.evaluate(() => /자르기/.test(document.body.innerText)))
  // 🏷 창업자 확정 2026-08-21 = *"일기도 담기로 바꾸고"*
  //    사진은 «읽는» 게 아니라 «담는» 것이다 — 「읽기」는 글자(OCR) 자리 말이다
  //    ⛔ 소스 grep 이면 주석에 적어둔 옛 문구까지 걸린다 → 화면 글자로 본다(규칙 18 ⓘ)
  {
    const 글 = await page.evaluate(() => document.body.innerText)
    chk('  ⭐ 확인 단추 = 「이 부분만 담기」', /이 부분만 담기/.test(글))
    chk('  ⛔ 「이 부분만 읽기」는 «없다»', !/이 부분만 읽기/.test(글))
  }
  // 「그대로 쓰기」(자르기 건너뛰기)
  await page.evaluate(() => {
    // ⛔ 「그대로 쓰기」가 아니다 — 실제 글자는 **「전체 사용」**이다(소스로 확인 · 규칙 18 ⓘ)
    document.querySelectorAll('button').forEach(() => {})
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '전체 사용')
    if (t) t.click()
  })
  await page.waitForTimeout(900)

  const 후 = await page.evaluate(() => ({
    미리보기: !!document.querySelector('.cook-shot-thumb'),
    표지글: document.querySelector('.cook-shot-cover')?.innerText.replace(/\s+/g, ' ').trim() || '',
    켜짐: document.querySelector('.cook-shot-cover')?.getAttribute('aria-pressed'),
    지우기: !!document.querySelector('.cook-shot-x'),
    단추아직: !!document.querySelector('.cook-shot-add'),
    손가락: Math.round(document.querySelector('.cook-shot-cover')?.getBoundingClientRect().height || 0),
  }))
  chk('  미리보기 사진이 떴다', 후.미리보기)
  chk('  「레시피 표지로도 쓰기」가 떴다', 후.표지글, '레시피 표지로도 쓰기')
  chk('  ⭐ 안 꾸민 레시피 → 기본 «켜짐»', 후.켜짐, 'true')
  chk('  지우기(✕)가 있다', 후.지우기)
  chk('  「남기기」 단추는 사라졌다', !후.단추아직)
  chk('  손가락 닿는 높이 ≥44px', 후.손가락 >= 44, 'true')

  await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /다 만들었어요/.test(x.innerText))?.click())
  const 본것 = await 일기줄기다리기(page, 골라둔.id)
  const st = 본것.st
  const d = 본것.d
  const r = (st.recipes || []).find((x) => x.id === 골라둔.id)
  chk(`  ⭐⭐ 일기에 «사진»이 저장됐다 ${(await 사진있나(page, d?.photo)) ? '' : 왜없나(본것)}`,
    await 사진있나(page, d?.photo))
  chk('  ⭐⭐ 레시피 표지가 사진이 됐다', r?.thumb, 'photo')
  chk('  표지 그림도 들어갔다', await 사진있나(page, r?.image))
  chk('  ⛔ imageFit 은 «안» 붙었다 (자랑카드용이라 · 창업자 2026-08-18)', r?.imageFit ?? '없음', '없음')
  await page.close()
}

// ───────────────────────────────────────────────────────────
console.log('\n③ ⭐ 꾸민 레시피 — 「표지로도 쓰기」가 기본 «꺼짐»이다')
{
  const page = await 새탭()
  const 꾸민것 = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2)
    if (!r) return null
    st.recipes = st.recipes.map((x) => (x.id === r.id ? { ...x, decor: [{ k: 'gp_gomhi', x: 0.5, y: 0.5, s: 0.3 }] } : x))
    localStorage.setItem('hankki:v1', JSON.stringify(st))
    return { id: r.id, title: r.title }
  })
  await page.close()

  const p2 = await 새탭()
  chk('  꾸민 흔적을 심었다', await p2.evaluate((id) => !!JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes?.find((r) => r.id === id)?.decor?.length, 꾸민것.id))
  await 요리끝까지(p2, 꾸민것.title)
  await p2.setInputFiles('.cook-shot input[type=file]', { name: '완성.png', mimeType: 'image/png', buffer: 빨강PNG })
  await p2.waitForTimeout(700)
  await p2.evaluate(() => {
    // ⛔ 「그대로 쓰기」가 아니다 — 실제 글자는 **「전체 사용」**이다(소스로 확인 · 규칙 18 ⓘ)
    document.querySelectorAll('button').forEach(() => {})
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '전체 사용')
    if (t) t.click()
  })
  await p2.waitForTimeout(900)
  chk('  ⭐⭐ 꾸민 레시피 → 기본 «꺼짐» (내가 말없이 안 덮는다)', await p2.evaluate(() => document.querySelector('.cook-shot-cover')?.getAttribute('aria-pressed')), 'false')

  await p2.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /다 만들었어요/.test(x.innerText))?.click())
  const 본것2 = await 일기줄기다리기(p2, 꾸민것.id)
  const st = 본것2.st
  const r = (st.recipes || []).find((x) => x.id === 꾸민것.id)
  const d = 본것2.d
  chk(`  사진은 일기에 담겼다 ${(await 사진있나(p2, d?.photo)) ? '' : 왜없나(본것2)}`,
    await 사진있나(p2, d?.photo))
  chk('  ⭐ 표지는 «안» 바뀌었다', r?.thumb !== 'photo', 'true')
  chk('  ⭐ 꾸민 것(decor)이 그대로 살아 있다', r?.decor?.length >= 1, 'true')
  await p2.close()
}

// ───────────────────────────────────────────────────────────
// 🏷 창업자 확정 2026-08-21 = *"일기도 담기로 바꾸고"* — 요리 모드만 바꾸면 «말이 갈린다».
//    ⛓ 같은 기능은 탭이 달라도 같은 이름(CLAUDE.md 「UI 문구」 핀).
console.log('\n④ 🏷 일기 사진도 «같은 말» — 「이 부분만 담기」')
{
  // ⛔ 일기 탭은 «달력»이라 거기선 이 시트가 안 열린다(규칙 18 — 「없다」의 이유를 내가 정하지 않는다).
  //    실제 입구 = **레시피 상세의 메모지**(`RecipeDetailScreen.jsx:575`) → 그건 «한 줄이 있는» 일기에만 뜬다.
  const p0 = await 새탭()
  const 대상 = await p0.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || [])[0]
    if (!r) return null
    st.diary = [{ id: '검사용', recipeId: r.id, title: r.title, at: Date.now(), rating: 4, note: '검사용 한 줄' }]
    localStorage.setItem('hankki:v1', JSON.stringify(st))
    return { id: r.id, title: r.title }
  })
  await p0.close()
  chk('  일기 한 장을 심었다', !!대상)

  const p3 = await 새탭()
  await p3.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await p3.waitForTimeout(600)
  await p3.evaluate((T) => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))?.click()
  }, 대상.title)
  await p3.waitForTimeout(800)
  const 열림 = await p3.evaluate(() => {
    const t = document.querySelector('.memo-note') || [...document.querySelectorAll('button')].find((x) => /검사용 한 줄/.test(x.innerText || ''))
    if (!t) return false; t.click(); return true
  })
  await p3.waitForTimeout(600)
  chk('  요리 기록 시트가 열렸다', 열림 && /요리 기록 남기기/.test(await p3.evaluate(() => document.body.innerText)))
  await p3.setInputFiles('.diary-photo input[type=file]', { name: '일기.png', mimeType: 'image/png', buffer: 빨강PNG })
  await p3.waitForTimeout(800)
  {
    const 글 = await p3.evaluate(() => document.body.innerText)
    chk('  자르기 시트가 떴다', /사진 자르기/.test(글))
    chk('  ⭐ 확인 단추 = 「이 부분만 담기」', /이 부분만 담기/.test(글))
    chk('  ⛔ 「이 부분만 읽기」는 «없다»', !/이 부분만 읽기/.test(글))
  }
  await p3.close()
}

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
