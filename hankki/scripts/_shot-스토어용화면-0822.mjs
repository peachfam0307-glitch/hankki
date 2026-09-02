// 📸 스토어 스샷 v5 에 쓸 «앱 화면» 캡처 (2026-08-22)
//
// ⛔⛔ 왜 또 찍나 — `_shot-홍보용앱화면-0820` 이 찍은 「레시피 상세」는 **맨 위(표지)**라
//    화면에 «파란 물결 그림»만 크게 보인다. 그걸 스토어 첫 장에 쓰면
//    **「그림 그리는 앱」으로 읽히고 «레시피 앱»이라는 게 안 보인다.**
//    📮 창업자 = *"우리 감성은 살리면서 **우리가 뭐하는 앱인지 잘보이게.**"*
//
// ⭐⭐ 오늘 배운 한 줄 = **「앱 화면을 크게」만으로는 모자라다. «무엇이 보이는 자리»까지 골라야 한다.**
//    창업자가 화면마다 콕 집어 줬고, 넷 다 «자리»가 문제였다:
//    · *"불앞에서도 편하게는 «요리모드»가 좋지않을까"* ＋ *"끓이는거 없엉?? 보통 타이머는 뭐 끓을때 맞춰"*
//    · *"레꾸꾸미기에서 «더 귀여운 스티커들» 있는 부분으로"*
//    · *"일기에는 «음식아이콘 몇개» 넣어서"*
//    · *"장보기 «사러가기»가 아니라 큐레이션 설명만있어."*
//
// ⭐ 규칙 21 — 찍고 나서 «열어 보고» 판정한다. 숫자로는 「무슨 앱으로 보이나」를 못 잰다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-스토어용화면-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
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
await new Promise((r) => srv.listen(4382, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// ⛔ `SEED_COACH_SEEN` 은 «함수»다 — JSON 으로 넘기면 안내 딱지가 그대로 떠서
//    클릭을 가로챈다(2026-08-22 실제로 그랬다 · 규칙 18 ⓘ). 0820 판과 «같은 방식»으로 넘긴다.
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 찍은것 = []
const 찍자 = async (p, 이름, 설명) => {
  await p.waitForTimeout(700)
  // 🔎 규칙 21 — 화면 한가운데를 «덮은 것»이 있으면 알린다
  const 덮개 = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    const s = el?.closest('[class*="coach"],[class*="onboard"],[role="dialog"]')
    return s ? s.className || s.getAttribute('role') : null
  })
  if (덮개) console.log(`  ⚠️ ${이름} — 한가운데를 「${덮개}」가 덮고 있다`)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  찍은것.push(이름)
  console.log(`  ✅ ${이름} — ${설명}`)
}

// ⛔⛔ `scrollHeight > clientHeight` 로 «찾은 첫 요소»에 scrollTop 을 넣었더니 **한 픽셀도 안 굴렀다**
//    (2026-08-22 · 찍힌 그림이 표지 그대로였다 — 규칙 21 이 잡았다).
//    ✅ 바퀴를 «실제로» 굴린다 — 어느 요소가 스크롤을 먹든 브라우저가 알아서 고른다.
const 굴리기 = async (page, 픽셀) => {
  await page.mouse.move(195, 500)
  await page.mouse.wheel(0, 픽셀)
  await page.waitForTimeout(700)
}
// 🎯🎯 [2026-08-28] 「굴리는 픽셀」을 손으로 맞추지 «않는다» — 머리 줄을 «집어» 그 자리로 굴린다.
//    ⛔ 뿌리 = `굴리기(p, 650)` 은 «콩국수»에 맞춘 값이었다. 홍보용 편을 「엄마표 김밥」으로 바꾸자
//       재료가 더 많아 **「재료」 머리 줄이 상단바에 반쯤 가렸다**(찍어서 눈으로 잡았다 · 규칙 21).
//    ⭐ 값을 다시 찍어 맞추면 **레시피를 바꿀 때마다 또 낡는다.** 그래서 «재서» 굴린다.
//    🔁 한 번에 안 맞을 수 있어(관성 스크롤·레이아웃) 두 번까지 다듬는다. 8px 안이면 그만둔다.
const 머리로굴리기 = async (page, 글자, 목표y = 150) => {
  for (let i = 0; i < 3; i++) {
    const 지금 = await page.evaluate((t) => {
      const 것 = [...document.querySelectorAll('div,span,h2,h3,b')]
        .find((e) => e.children.length === 0 && (e.innerText || '').trim() === t)
      return 것 ? Math.round(것.getBoundingClientRect().top) : null
    }, 글자)
    if (지금 == null) { console.log(`  ⛔ 「${글자}」 머리를 못 찾았다 — 굴리기를 건너뛴다`); return false }
    const 차이 = 지금 - 목표y
    if (Math.abs(차이) <= 8) return true
    await page.mouse.move(195, 500)
    await page.mouse.wheel(0, 차이)
    await page.waitForTimeout(650)
  }
  return true
}
const 홈으로 = async (page) => {
  await page.goto('http://127.0.0.1:4382/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
}
const 탭 = async (page, 글자) => {
  const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) return false
  await t.click(); await page.waitForTimeout(1300)
  return true
}
const 시트닫기 = async (page) => {
  for (const 글자 of ['나중에 볼게요', '닫기']) {
    const b2 = page.getByRole('button', { name: 글자 }).first()
    if (await b2.count()) { await b2.click(); await page.waitForTimeout(900); return }
  }
}

// 🍳 홍보물에 찍힐 레시피 — ⭐목록·상세·요리모드가 «같은 편»이라야 흐름이 이어진다
//    (창업자 = *"왼쪽은 공심채인데 오른쪽이 다른메뉴면 안되지"*)
const 스샷레시피 = process.env.SHOT_RECIPE || '엄마표 김밥'

const p = await ctx.newPage()
await 홈으로(p)

// ① 레시피 목록 — ⭐「요리책」이 한눈에. 표지가 깔린 격자라 «레시피 앱»이 바로 읽힌다
// ⛔ `getByRole('레시피')` 는 «검색 화면의 딴 버튼»이 먼저 걸린다 → 하단바를 콕 집는다(0820 교훈)
await 탭(p, '레시피')
// ⛔⛔ [2026-08-28] **여기가 맨 위라 「공심채 볶음」이 안 보였다.**
//    📮 창업자 = *"레시피가 담겼어요는 없어;; 콩국수가 있는데??"* · *"레시피가 저장되었어요에 공심채가 없어"*
//    ⭐ 홍보물은 «흐름»이다 — 인스타에서 공심채를 공유했는데 담긴 목록에 콩국수가 뜨면 말이 끊긴다.
//       어제 스토어 01장에서 창업자가 잡은 것과 «같은 자리»다(*"왼쪽은 공심채인데 오른쪽이 다른메뉴면 안되지"*).
//    👉 그래서 그 편이 «보이는 자리»까지 굴린다. ⛔픽셀로 굴리면 목록이 바뀔 때 또 어긋난다.
await 머리로굴리기(p, 스샷레시피, 430)
await 찍자(p, '20-레시피목록', '레시피 목록 — 꾸민 표지 격자')

// ② 레시피 상세를 «재료가 보이는 자리»까지 굴린다
//
// ⛔⛔ [2026-08-28] **여기가 콩국수였는데 재료에 브랜드가 떡하니 떴다** —
//    「풀무원 특등급 국산콩물」·「오월햇살 우리밀 유기농국수」. 📮창업자가 잡았다: *"이거 괜찮아??"*
//    ⭐ 앱 «안»은 그대로 맞다(「브랜드 ＋ (대체품)」은 창업자 규칙이고 유저에겐 값어치다).
//       **홍보물이 다르다** — 스토어 스샷·인스타는 «광고»라 남의 상표가 우리 광고에 뜬다.
//       구글 IP 정책 판정 기준 = *"likely to cause confusion as to the source"* 라 혼동 가능성은 낮지만,
//       **얻는 게 0인데 잃을 게 크다**(IP 신고 한 건이면 앱이 내려갈 수 있고 우리는 앱이 하나뿐이다).
//    ✅ 그래서 **홍보물에 찍히는 레시피만** 브랜드 0 인 편으로 바꿨다 = **「엄마표 김밥」**
//       (11줄 · 전부 일반명사 · 이미 열린 편 · 이름이 우리 결과 맞다)
//    🛠 다시 고를 땐 `node scripts/_probe-브랜드없는레시피-0828.mjs`
//       ⛔ 「이건 브랜드다」 목록으로 찾지 말 것 — 오늘 「아우노슈가」를 그렇게 놓쳤다.
//       ⛔ ＋ **아직 «안 열린» 편은 못 쓴다**(「국물 닭볶음탕」은 `from` 이 2026-12-14 였다)
// ⛔⛔ [창업자 2026-08-28] *"잠깐만 **공심채볶음이되어야지 오른쪽도**"* ·
//    *"왼쪽은 공심채인데 **오른쪽이 다른메뉴면 안되지**"* — 맞는 지적이다.
//    ⭐ 스토어 01장은 「이 인스타 글을 캡처했더니 → 이렇게 정리됐다」라는 **한 흐름**이다.
//       왼쪽(인스타 공심채볶음)과 오른쪽(앱)이 다른 요리면 **그 문장이 거짓이 된다.**
//    📌 나는 「브랜드 0」만 보다가 **앞뒤가 안 맞는 걸 놓쳤다.**
//    ⚠️ 그런데 공심채볶음엔 「아우노슈가」가 있고 **인스타 원본 글에도 그대로 떠 있다** →
//       오른쪽만 바꿔도 왼쪽에 이미 브랜드가 있어 의미가 없었다. ⏳창업자 판정 대기.
await p.locator(`text=${스샷레시피}`).first().click()
await p.waitForTimeout(800)
// 🎯 「재료」 머리를 상단바 «아래»로 데려온다 — ⛔픽셀을 손으로 맞추지 않는다(위 `머리로굴리기` 주석)
//    ⭐ 목표 150px = 상단바(≈96) 아래로 여유 한 줄. 여기가 「재료」 머리부터 화면에 다 담기는 자리다.
await 머리로굴리기(p, '재료', 150)
await 찍자(p, '21-상세-재료순서', '레시피 상세 — 재료가 통째로 보이는 자리')

// ③ 한 번 더 굴려 「만드는 법」 걸음
await 굴리기(p, 800)
await 찍자(p, '22-상세-만드는법', '레시피 상세 — 만드는 법 걸음')

// ④ 🔥 요리 모드 — 📮 *"불앞에서도 편하게는 «요리모드»가 좋지않을까"* ＋ *"끓이는거 없엉??"*
//    ⛔ 콩국수는 «끓이는 걸음»이 없다(면 삶기뿐) → **끓이는 레시피**(돼지고기 김치찌개)로 찍는다
await 홈으로(p); await 탭(p, '레시피')
await p.locator('text=돼지고기 김치찌개').first().click()
await p.waitForTimeout(1000)
await 굴리기(p, 900)
// ⛔⛔ [2026-09-02 고침] 여기가 «조용히» 죽어 있었다 — 단추 이름이 「요리 시작」 → **「요리모드 시작」**으로
//    바뀌었는데 정규식이 `/요리 시작/` 이라 «모드» 두 글자에 걸려 못 찾았다.
//    그런데도 판은 «6장 완료»라고 말하며 exit 0 을 냈다 → 스토어에 넣을 8장 중 **둘이 영영 안 찍혔다**(규칙 18 ⓘ).
// ✅ 그래서 둘을 고쳤다 —
//    ⑴ 글자가 아니라 **`data-coach="cook"`** 를 먼저 본다(이름이 또 바뀌어도 안 죽는다) · 글자는 예비로
//    ⑵ 못 찾으면 **죽는다**(아래 exit 1) — 「조용히 6장」이 다시는 안 나오게
const 요리시작 = (await p.locator('[data-coach="cook"]').count())
  ? p.locator('[data-coach="cook"]').first()
  : p.getByRole('button', { name: /요리\s*(모드\s*)?시작/ }).first()
if (await 요리시작.count()) {
  await 요리시작.click(); await p.waitForTimeout(1500)
  await 찍자(p, '24-요리모드', '요리 모드 — 재료 준비')
  // ⛔ 첫 화면은 «재료 준비»(체크리스트)다 — 「재료 준비 완료」를 눌러야 큰 글씨 걸음이 나온다
  const 시작 = p.getByRole('button', { name: /재료 준비 완료/ }).first()
  if (await 시작.count()) { await 시작.click(); await p.waitForTimeout(1300) }
  // ⭐ 「끓」이 든 걸음에서 멈춘다 — 타이머를 맞추는 «진짜» 장면이다(⛔몇 번째인지 박지 않는다)
  // ⛔ `document.body.innerText` 로 보면 **앞 화면이 DOM 에 남아** 엉뚱한 「분」에 걸린다.
  //    ⛔ `.pop()`(제일 안쪽)은 **「STEP 5 / 7」 숫자만** 든 칸이라 걸음 글이 통째로 빠진다.
  //    ✅ 300자 미만 중 **제일 긴 것** = 「STEP ＋ 걸음 글」이 다 든 칸.
  for (let n = 0; n < 6; n++) {
    const 글 = await p.evaluate(() => {
      const 후보 = [...document.querySelectorAll('div,section')]
        .filter((e) => /STEP\s*\d+\s*\/\s*\d+/.test(e.innerText || '') && e.innerText.length < 300)
      if (!후보.length) return ''
      return 후보.reduce((a, c) => (c.innerText.length > a.innerText.length ? c : a)).innerText
    })
    if (/끓/.test(글) && /\d+\s*분/.test(글)) break
    if (n >= 4 && /\d+\s*분/.test(글)) break
    const 다음 = p.getByRole('button', { name: /다음/ }).first()
    if (!(await 다음.count())) break
    await 다음.click(); await p.waitForTimeout(800)
  }
  await 찍자(p, '25-요리모드-걸음', '요리 모드 — 끓이는 걸음 ＋ 타이머')

  // 🕐 [2026-09-02 창업자] *"요리모드에 타이머도 «펼친거» 넣어주면 좋겠다"*
  //    ⭐ 위 25 장은 「타이머 맞추기」가 **단추 한 줄**로만 보인다 — 눌렀을 때 뭐가 나오는지는 안 보인다.
  //       스토어에서 「걸음마다 타이머」라고 써 놓고 정작 «타이머 생김새»가 한 장도 없었다.
  //    ⛔ 글자로 찾지 않는다 — 25 장을 죽였던 그 사고(단추 이름이 바뀌면 조용히 못 찾는다)를 되풀이하지 않는다.
  //       `.cook-timer` 는 CookScreen 이 이 단추에만 쓰는 클래스라 이름이 바뀌어도 안 죽는다.
  //    ⛔ 못 찾으면 **죽는다** — 「조용히 8장」이 다시 나오지 않게(규칙 18 ⓘ)
  const 타이머단추 = p.locator('.cook-timer').first()
  if (!(await 타이머단추.count())) {
    console.error('⛔ 요리 모드에 「이 단계 타이머 맞추기」 단추가 없다 — CookScreen 의 .cook-timer 를 확인할 것')
    process.exit(1)
  }
  // ⭐ 그 걸음이 말하는 «분»을 먼저 읽어 둔다 — 시트 기본값은 늘 5분이라
  //    걸음이 「15분 끓여요」인데 단추가 「5분 시작」이면 **한 화면 안에서 말이 어긋난다.**
  //    ⛔ 숫자를 박지 않는다 — 걸음이 바뀌면 그대로 낡는다.
  const 걸음분 = await p.evaluate(() => {
    const 후보 = [...document.querySelectorAll('div,section')]
      .filter((e) => /STEP\s*\d+\s*\/\s*\d+/.test(e.innerText || '') && e.innerText.length < 300)
    if (!후보.length) return 0
    const 글 = 후보.reduce((a, c) => (c.innerText.length > a.innerText.length ? c : a)).innerText
    const m = 글.match(/(\d+)\s*분/)
    return m ? Number(m[1]) : 0
  })
  await 타이머단추.click()
  // ⭐ 시트가 «다 올라온 뒤»에 찍는다 — 올라오는 중에 찍으면 아래가 잘린 채로 나온다.
  //   ⛔ 「보이나」로 재면 반쯤 올라온 것도 보인다 → 시트 «높이»가 두 번 연달아 같을 때까지 기다린다.
  await p.waitForSelector('.sheet-mask .sheet', { timeout: 5000 })
  let 앞키 = -1
  for (let n = 0; n < 20; n++) {
    const 키 = await p.evaluate(() => {
      const s = document.querySelector('.sheet-mask .sheet')
      return s ? Math.round(s.getBoundingClientRect().height) : -1
    })
    if (키 > 0 && 키 === 앞키) break
    앞키 = 키
    await p.waitForTimeout(150)
  }
  // 🕐 걸음이 말한 분으로 «손으로 누르듯» 맞춘다(기본 5분)
  //   ⛔ 프리셋(「15분」)을 누르면 «타이머가 시작되고 시트가 닫힌다»(`go()` → `start()` ＋ `onClose()`).
  //      그래서 프리셋이 아니라 **＋/－ 를 누른다** — 실제 유저가 하는 그대로다.
  //   ⛔ 60번 넘게 누를 일이면 그냥 둔다(걸음 글에서 엉뚱한 숫자를 읽었을 수 있다)
  if (걸음분 > 0 && Math.abs(걸음분 - 5) <= 60) {
    const 늘 = p.locator('.timer-custom [aria-label="늘리기"]').first()
    const 줄 = p.locator('.timer-custom [aria-label="줄이기"]').first()
    for (let n = 5; n < 걸음분; n++) await 늘.click()
    for (let n = 5; n > 걸음분; n--) await 줄.click()
    await p.waitForTimeout(250)
  }
  await 찍자(p, '25b-요리모드-타이머', `요리 모드 — 타이머 펼친 화면 (${걸음분 || 5}분 · 프리셋·알림음)`)
} else {
  // ⛔ 예전엔 여기서 console.log 만 하고 지나갔다 — 그래서 «모자란 채로 끝났다».
  //    스토어에 나갈 8장은 하나라도 빠지면 안 된다. 못 찍으면 판이 죽는다.
  console.error('⛔ 요리모드 입구를 못 찾았다 — 단추 이름이 또 바뀌었는지 상세 화면을 열어 확인할 것')
  process.exit(1)
}

// ⑤ 🎨 꾸미기 — 📮 *"레꾸꾸미기에서 «더 귀여운 스티커들» 있는 부분으로"*
//    ⛔ 요리 모드에서 «뒤로»가 상세로 안 돌아올 때가 있다 → 앱을 다시 열고 처음부터 들어간다
await 홈으로(p); await 탭(p, '레시피')
// ⭐ 여기만 **콩국수 그대로 둔다** — 창업자가 «직접 꾸민» 샘플이라 스티커가 얹힌 표지가 나온다.
//   ⛔ 이 화면은 스티커 서랍을 덮어서 **재료가 한 줄도 안 보인다** → 브랜드 걱정이 없다(2026-08-28 확인).
await p.locator('text=콩국수').first().click()
await p.waitForTimeout(1000)
await 굴리기(p, -2000)
const 꾸미기 = p.getByRole('button', { name: /레시피 꾸미기/ }).first()
if (await 꾸미기.count()) {
  await 꾸미기.click(); await p.waitForTimeout(1600)
  await 시트닫기(p) // ⛔ 「출시 기념 선물」 시트가 저절로 떠서 탭 클릭을 가로챈다
  // ⛔⛔ `getByRole('button', {name:/친구/})` 는 **상세의 「친구와 레시피 공유하기」**를 잡는다(규칙 18 ⓘ)
  //    → 서랍(`.decor-editor`) «안»에서 콕 집는다. 「친구들」 = 꼬르곰·펭펭 = 제일 귀엽다
  for (const 이름 of ['친구들', '데코']) {
    const t = p.locator('.decor-editor button').filter({ hasText: 이름 }).first()
    if (await t.count()) { await t.click(); await p.waitForTimeout(1000); break }
  }
  // ⛔ 탭만 눌러선 스티커가 안 보인다 — 서랍 맨 위엔 단추 셋이고 격자는 그 «아래»다
  await p.mouse.move(195, 790); await p.mouse.wheel(0, 260); await p.waitForTimeout(700)
  await 찍자(p, '23-꾸미기-스티커서랍', '레꾸 — 꼬르곰·펭펭 스티커가 깔린 서랍')
} else console.log('  ⛔ 「레시피 꾸미기」 단추를 못 찾았다')

// ⑥ 📔 일기 — 📮 *"일기에는 «음식아이콘 몇개» 넣어서"*
//    ⛔ 갓 깐 앱의 달력은 **텅 비어 있다**. 그 화면을 스토어에 얹으면 「아무것도 없는 앱」이 첫인상이 된다.
//    ⭐ 요리 기록 = `kind` 없는 diary 항목. 아이콘은 `recipe.icon || guessFoodIcon(title)` 이라
//       **제목만 있어도 음식 그림이 붙는다**(`DiaryScreen.jsx:52`).
//    ⚠️ 날짜는 «이번 달»로 만든다 — 달력은 늘 이번 달을 연다(고정 날짜를 박으면 다음 달에 텅 빈다).
//
// ⛔⛔ [2026-09-02 고침] 그 「이번 달만 남긴다」 필터가 **달 초에 달력을 텅 비웠다.**
//    🔢 오늘이 9/2 라 1·3·5·8·11·14·17일 «전» 중 살아남는 게 **1일 하나뿐** →
//       스토어에 「기록 한 개짜리 달력」이 얹혔다. 헤드라인은 「달력에 하나씩 쌓여요」인데 **말과 그림이 어긋난다.**
//    ⭐⭐ 이 판 머리주석에 *"갓 깐 앱의 달력은 텅 비어 있다 … 「아무것도 없는 앱」이 첫인상이 된다"* 라고
//       **내가 적어두고**, 그걸 막으려던 필터가 정확히 그 일을 했다. 매달 1~5일이면 늘 이랬다.
// ✅ 고침 둘 —
//    ⑴ 필터를 없앤다(지난달까지 자연스럽게 걸친다 — 진짜 유저의 기록이 그렇다)
//    ⑵ **이번 달이 허전하면 달력을 «지난달»로 넘긴다** — ‹ 단추는 앱에 이미 있다(흉내 아님 · 절대원칙 30)
await 홈으로(p)
const 이번달기록 = await p.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
  const 달첫날 = new Date(오늘.getFullYear(), 오늘.getMonth(), 1).getTime()
  const 날 = (d) => { const x = new Date(오늘); x.setDate(x.getDate() - d); return x.getTime() }
  const 기록 = [['콩국수', 1], ['돼지고기 김치찌개', 3], ['제육볶음', 5], ['된장찌개', 8],
    ['소고기 미역국', 11], ['국물 떡볶이', 14], ['비빔국수', 17]]
    .map(([t, d], i) => ({ id: `cz${i}`, title: t, at: 날(d) }))
  st.diary = [...(st.diary || []), ...기록]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return 기록.filter((r) => r.at >= 달첫날).length
})
await 홈으로(p)
if (await 탭(p, '일기')) {
  // ⭐ 넷은 있어야 「쌓인다」로 읽힌다 — 그 아래면 지난달을 연다
  if (이번달기록 < 4) {
    const 앞달 = p.getByRole('button', { name: /지난달|이전 달|앞달/ }).first()
    if (await 앞달.count()) { await 앞달.click(); await p.waitForTimeout(700) }
    else {
      // ⛔ 이름을 못 찾으면 «달 제목 왼쪽» 단추를 누른다(달력 머리에 ‹ › 둘뿐이다)
      const 눌렸나 = await p.evaluate(() => {
        const 머리 = [...document.querySelectorAll('div')]
          .filter((e) => /\d{4}년\s*\d{1,2}월/.test(e.innerText || '') && e.querySelectorAll('button').length === 2)
        if (!머리.length) return false
        const b = 머리[머리.length - 1].querySelectorAll('button')[0]
        b.click(); return true
      })
      if (!눌렸나) console.log('  ⚠️ 달력에서 「지난달」 단추를 못 찾았다 — 달력이 허전할 수 있다')
      await p.waitForTimeout(700)
    }
  }
  await 찍자(p, '26-일기-채운달력', '한끼 일기 — 음식 아이콘이 쌓인 달력')
}

// ⑦ 🛒🛒 장보기 — [2026-08-27 다시 씀] 📮 창업자 = *"장보기는 재료 담긴 걸로 다시 찍어줘"*
//    ⛔⛔ **내가 이 탭의 순서를 거꾸로 알고 있었다** — 맨 위가 «장보기 리스트»이고
//       주부의 장바구니가 그 «아래»다(실측). 옛 코드는 「소개글이 사라질 때까지」 굴려서
//       **담긴 리스트를 지나쳐** 버렸다. 그래서 아래 절반이 «빈 화면»으로 찍혔다.
//    ✅ 맨 위 그대로 찍는다 — 「장보기」 제목·펭펭 ＋ 담긴 재료 ＋ 줄마다 「사러가기」가 한 화면에.
//    ⛔ `localStorage` 에 손으로 심지 «않는다» — **앱이 실제로 담는 길로** 담는다(절대원칙 30).
//       심으면 `addShopItem` 이 필드를 골라 만드는 그 모양과 어긋날 수 있다(v11.00 사고 자리).
//    ⭐ 두 갈래로 담는다 = 이 장의 부제가 **「레시피 재료 그대로 톡 · 18년차 주부의 추천템까지」**다.
await 홈으로(p)
await 탭(p, '레시피')
// ⛔ 여기도 콩국수였다 — 담기면 장보기 리스트에 「풀무원 특등급」이 그대로 뜬다(위 ② 참조)
await p.locator(`text=${스샷레시피}`).first().click()
await p.waitForTimeout(800)
{
  const 담기 = p.getByRole('button', { name: /장보기 담기/ }).first()
  if (await 담기.count()) { await 담기.click(); await p.waitForTimeout(1200); await 시트닫기(p) }
  else console.log('  ⚠️ 상세에서 「장보기 담기」를 못 찾았다 — 리스트가 빌 수 있다')
}

await 홈으로(p)
if (await 탭(p, '장보기')) {
  // 🛍 ＋ 주부의 장바구니 제품도 한 줄 담는다(「추천템까지」)
  //    ⛔ `.cur-card` 로는 «못 잡는다»(실측 0개) — 「담기」 글자를 콕 집는다
  {
    const 카드담기 = p.getByRole('button', { name: /^담기$/ }).first()
    if (await 카드담기.count()) { await 카드담기.click(); await p.waitForTimeout(900) }
    else console.log('  ⚠️ 제품 카드의 「담기」를 못 찾았다')
  }
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('*')) { if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 }
    scrollTo(0, 0)
  })
  // 🧹🧹 📮 창업자 = *"전체비우기랑 x 안보이게 다시 찍어줘"*
  //   ⛔ **앱에서 없애는 게 아니다** — 유저가 지울 방법이 사라진다. **스샷에서만** 가린다.
  //   ⛔ 「진짜로 안 보이는 상태」는 없다(실측 · `ShopScreen.jsx:143`) —
  //      「전체 비우기」는 `shoppingList.length > 0` 이면 뜨고 「×」는 줄마다 «항상» 뜬다.
  //      즉 재료를 담은 채로는 어떤 상태로도 안 사라진다 → 가리는 것 말고 길이 없다.
  //   ⭐ `display:none` 이 아니라 **`visibility:hidden`** — 자리를 지켜야 「사러가기」가 안 밀린다.
  //   📌 기능을 «더» 있는 척 하는 게 아니라 «지우는 단추»만 조용히 하는 것이다.
  //      ⚠️ 그래도 **앱을 열면 그 단추들은 그대로 있다** — 창업자에게 밝히고 찍었다.
  await p.evaluate(() => {
    const s = document.createElement('style')
    s.id = '_스샷용-지우기단추가리기'
    s.textContent = '.shop-row [aria-label="삭제"], .shop-list .sec-head .t-more { visibility: hidden !important; }'
    document.head.appendChild(s)
  })
  await p.waitForTimeout(300)
  // ⏳ 「장보기 리스트에 담았어요」 토스트가 «사라질 때까지» 기다린다 — 안 그러면 화면에 박힌다
  for (let n = 0; n < 20; n++) {
    const 떴나 = await p.evaluate(() => [...document.querySelectorAll('div,span')]
      .some((e) => /담았어요/.test(e.textContent || '') && (e.textContent || '').length < 30
        && e.getBoundingClientRect().height > 10))
    if (!떴나) break
    await p.waitForTimeout(500)
  }
  await 찍자(p, '27-장보기-사러가기', '장보기 — 담긴 재료 ＋ 줄마다 사러가기 (지우기 단추는 가림)')
}

// ⑧ 📚📚 [2026-09-02 창업자] *"요리책도 내가 어제꾸민거 예쁜거 많으니까 그걸로 하고"* ＋ *"내 레시피 꾸민거 필요하면 써"*
//
// ⭐⭐ 「요리책」 장의 값어치는 **표지가 «진짜로» 꾸며져 있는 것**이다.
//    씨앗 레시피는 음식 아이콘만 붙어서 「꾸몄다」가 안 보인다 — 창업자가 그걸 짚었다.
// ⛔⛔ **창업자 백업은 저장소에 «절대» 안 넣는다** — 진짜 개인 데이터이고 이 저장소는 공개다.
//    `BACKUP=<파일>` 로 «그때만» 읽어 쓰고, 저장소엔 **찍힌 그림만** 남는다.
// ⛔ 서랍(localStorage)은 **5MB 벽**이 있다 — 백업 전체가 4,976KB 라 그대로 넣으면 저장이 통째로 막힌다.
//    ✅ 그래서 **꾸민 편만 골라** 넣는다(스티커 ×2 ＋ 표지 3 ＋ 배경지 2 로 점수를 매겨 위에서부터).
// ⛔ 이 칸은 **맨 마지막**이다 — 서랍을 갈아엎으므로 앞 화면들이 영향을 받으면 안 된다.
if (process.env.BACKUP) {
  const 백업 = JSON.parse(readFileSync(process.env.BACKUP, 'utf8'))
  // ⛔⛔ [실물로 잡았다 ②] 「표지 사진이 있으면 뽑는다」로 골랐더니 **안 꾸민 편이 맨 윗줄에 왔다.**
  //    📮 창업자 = *"예쁘게 꾸민 부분 잘 찍어줘. **테스트한다고 레시피 몇개 추가해서 위쪽은 안꾸몄어.**"*
  //    ⭐ 이 장이 파는 것은 「사진이 예쁘다」가 아니라 **「내가 꾸몄다」**다 →
  //       **스티커나 배경지가 «실제로» 얹힌 편만** 남긴다(표지 사진만 있는 편은 뺀다).
  // ⛔⛔ [실물로 잡았다 ④ · 창업자가 세 번 잡아 줬다] *"내가꾸민거 그거 아니야"* → *"**가을 프레임으로 꾸민거** 있잖아.."*
  //    🔢 백업을 열어 보니 진짜 가을 프레임은 **`pf_au01`(돌솥비빔밥) · `pf_au04`(차돌짬뽕)** 둘이었다.
  //    ⛔ 내가 **스티커 «개수»로만** 점수를 매겨서 — 차돌짬뽕(스티커 3개)이 11번째로 밀려 **화면에 아예 안 나왔다.**
  //    📌 개수는 「얼마나 붙였나」를 재지 **「무엇으로 꾸몄나」를 못 잰다.** 창업자가 본 건 뒤쪽이다.
  // ✅ 그래서 **가을로 꾸민 편만** 남긴다 — 프레임 `pf_` 나 가을 컷 `au_` 가 실제로 얹힌 편.
  //    ⭐ 편 수가 줄어드는 게 «이득»이다 — 6편이면 첫 화면에 거의 다 들어와 굴릴 필요가 없다.
  // ⛔⛔⛔ [실물로 닫혔다 ⑤] 창업자가 **자기 폰 화면을 찍어 보내 줬다** — 그게 답이다.
  //    📌 나는 점수를 세 번 고쳐 가며(개수 → 꾸밈 여부 → 가을 요소) 창업자가 원한 걸 «맞히려» 했고 세 번 다 틀렸다.
  //    ⭐⭐ **고르는 건 창업자다(규칙 11).** 점수로 «맞히지» 말고 **고른 것을 그대로 받는다.**
  //       → `PICK="제목,제목,…"` 이 있으면 그 순서·그 편만 쓴다. 없을 때만 점수로 고른다(예비).
  const 키들 = (r) => (r.decor || []).map((d) => String(d.key || d.k || d.id || ''))
  const 점수 = (r) => 키들(r).reduce((s, k) => s + (k.startsWith('pf_') ? 5 : k.startsWith('au_') ? 3 : 2), 0)
    + (r.image ? 3 : 0) + (r.decorBg && r.decorBg !== 'none' ? 2 : 0)
  let 뽑힘
  if (process.env.PICK) {
    const 고른것 = process.env.PICK.split(',').map((s) => s.trim()).filter(Boolean)
    // ⛔⛔ [또 실물이 잡았다] `find` 로 첫 편을 집었더니 **「가지덮밥」이 «안 꾸민» 쪽으로 나왔다.**
    //    🔢 같은 제목이 백업에 «둘» 있었다 — 7/27(맨몸) · 8/30(배경지 ＋ 스티커 2).
    //    📌 **같은 이름이 하나뿐이라고 가정하지 않는다** — 유저는 같은 요리를 두 번 담는다.
    //    ✅ 이름이 겹치면 **제일 많이 꾸민 편**을 고른다.
    뽑힘 = 고른것.map((t) => (백업.recipes || []).filter((r) => (r.title || '').trim() === t)
      .sort((a, b) => 점수(b) - 점수(a))[0]).filter(Boolean)
    const 못찾음 = 고른것.filter((t) => !(백업.recipes || []).some((r) => (r.title || '').trim() === t))
    // ⛔ 조용히 빠뜨리지 않는다 — 「여섯을 골랐는데 넷만 나왔다」가 제일 나쁘다
    if (못찾음.length) console.log(`  ⚠️ 백업에서 못 찾은 편 ${못찾음.length} — ${못찾음.join(' · ')}`)
  } else {
    뽑힘 = (백업.recipes || []).filter((r) => 키들(r).length || (r.decorBg && r.decorBg !== 'none'))
      .sort((a, b) => 점수(b) - 점수(a)).slice(0, 12)
  }
  // ⛔ 격자는 «최근 저장순»으로 그린다 — 고른 편들끼리의 진짜 순서를 그대로 둔다(날짜를 지어내지 않는다)
  // ⛔⛔ [실물로 잡았다] 첫 판은 **창업자 것이 한 편도 안 보였다** — 씨앗이 다시 심겨 밀어냈다.
  //    🔢 「전체 70」에 돼지고기 김치찌개·된장찌개…가 **2026.09.02** 로 맨 위에 깔렸다.
  //    ⭐ 뿌리 둘 — ⑴백업의 `seedV` 가 낡아서 `store.jsx:162` 의 「다시 심지 않는다」에 못 걸린다
  //       ⑵ 걸리더라도 **날짜가 돼서 새로 열린 편**은 그래도 들어오고, 그때 `savedAt = 지금` 이라
  //          **격자 맨 위를 차지한다**(창업자 = *"위쪽은 안꾸몄어"* 가 정확히 이 자리다)
  //    ✅ 그래서 ⓐ`seedV` 를 앱의 «지금» 판으로 ⓑ기본 편 아이디를 전부 「지운 것」으로 적어 둔다
  const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
  const 고른것 = new Set(뽑힘.map((r) => r.id))
  const 상태 = {
    recipes: 뽑힘.map((r) => ({ ...r, status: 'sorted' })),
    folders: 백업.folders || [],
    seedV: BASICS_VERSION,
    removedSeedIds: [...new Set([...(백업.removedSeedIds || []),
      ...basicRecipes.map((r) => r.id).filter((id) => !고른것.has(id))])],
    sampleGone: true,
  }
  const KB = Math.round(Buffer.byteLength(JSON.stringify(상태)) / 1024)
  console.log(`  📚 창업자 요리책 ${뽑힘.length}편 (${KB}KB) — ${뽑힘.slice(0, 6).map((r) => r.title).join(' · ')} …`)
  if (KB > 4600) console.log('  ⚠️ 4.6MB 를 넘는다 — 서랍 벽(5MB)에 걸릴 수 있다')
  await 홈으로(p)
  await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)) }, 상태)
  await 홈으로(p)
  if (await 탭(p, '레시피')) {
    await p.waitForTimeout(1200)
    // ⛔ 「사진 N장을 정리해 …MB 를 비웠어요」 파란 띠가 맨 위를 덮는다(v12.24 공간 회수).
    //    ⭐ 고장이 아니라 «제 일을 한 것»이다 — 사라질 때까지 기다렸다 찍는다.
    for (let n = 0; n < 24; n++) {
      const 떴나 = await p.evaluate(() => [...document.querySelectorAll('div,span')]
        .some((e) => /비웠어요|정리해/.test(e.textContent || '') && (e.textContent || '').length < 40
          && e.getBoundingClientRect().height > 10))
      if (!떴나) break
      await p.waitForTimeout(500)
    }
    // ⛔⛔ [실물로 잡았다 ③] 「제일 많이 꾸민 편으로 굴린다」를 넣었더니 **상단바가 통째로 사라지고
    //    맨 윗줄 카드가 잘렸다.** 스토어 장에서 상단바가 없으면 「무슨 화면인지」가 안 읽힌다.
    // ✅ 안 굴린다 — 위 ②에서 «안 꾸민 편»을 걸러냈으므로 **맨 위가 이미 꾸민 표지**다.
    //    📌 문제를 «찍는 자리»로 풀려다 두 번 헛돌았다. 진짜 답은 «무엇을 담느냐»였다.
    await 찍자(p, '20b-요리책-창업자', '레시피 목록 — ⭐창업자가 «직접 꾸민» 표지들')
  }
}

// ⑨ 🎴🍂 [2026-09-02 창업자] *"레꾸자랑도 가을꺼로하자 예쁜걸로"*
//
// ⛔⛔ **이 화면은 이 판이 «한 번도» 안 찍고 있었다** — 스토어 07장이 쓰던 `10-랜덤카드.png` 는
//    **2026-08-22 파일**이라 여름 카드였다. 앱이 바뀌어도 안 따라오는 그 함정 그대로다(2026-07-31).
// ⭐ 스킨은 `?card=<키>` 로 «지정»한다 — 뽑기 운에 맡기면 매번 다른 게 나와 판정을 못 한다.
//    🍂 가을 컷(`au`)은 09-01 에 열렸으므로 **어느 스킨을 골라도 캐릭터가 가을 옷을 입는다.**
// ⛔ 카드만 오려내지 «않는다» — 스토어 장에 필요한 건 「다시 뽑기 · 공유하기」까지 든 «화면»이다.
for (const 카드키 of (process.env.CARDS || 'warm,mag,arch,night,post,ticket').split(',')) {
  await p.goto(`http://127.0.0.1:4382/?card=${카드키}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  await 시트닫기(p)
  if (!(await 탭(p, '레꾸자랑'))) { console.log('  ⛔ 레꾸자랑 탭을 못 찾았다'); break }
  await 시트닫기(p)
  // ⛔ 레꾸자랑은 「자랑할 레시피를 눌러주세요」가 먼저다 — 안 고르면 카드가 아예 안 뜬다
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1200)
  const 뽑기 = p.getByRole('button', { name: /랜덤|뽑/ }).first()
  if (await 뽑기.count()) { await 뽑기.click().catch(() => {}); await p.waitForTimeout(1700) }
  await 찍자(p, `40-자랑-${카드키}`, `레꾸자랑 — 가을 카드 (${카드키})`)
}

console.log(`\n📸 ${찍은것.length}장 → ${OUT}`)
await b.close(); srv.close()
