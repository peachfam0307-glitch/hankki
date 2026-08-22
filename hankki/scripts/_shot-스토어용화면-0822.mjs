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
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

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

const p = await ctx.newPage()
await 홈으로(p)

// ① 레시피 목록 — ⭐「요리책」이 한눈에. 표지가 깔린 격자라 «레시피 앱»이 바로 읽힌다
// ⛔ `getByRole('레시피')` 는 «검색 화면의 딴 버튼»이 먼저 걸린다 → 하단바를 콕 집는다(0820 교훈)
await 탭(p, '레시피')
await 찍자(p, '20-레시피목록', '레시피 목록 — 꾸민 표지 격자')

// ② 레시피 상세를 «재료가 보이는 자리»까지 굴린다
await p.locator('text=콩국수').first().click()
await p.waitForTimeout(800)
await 굴리기(p, 700)
await 찍자(p, '21-상세-재료순서', '레시피 상세 — 재료·사러가기가 보이는 자리')

// ③ 한 번 더 굴려 「만드는 법」 걸음
await 굴리기(p, 800)
await 찍자(p, '22-상세-만드는법', '레시피 상세 — 만드는 법 걸음')

// ④ 🔥 요리 모드 — 📮 *"불앞에서도 편하게는 «요리모드»가 좋지않을까"* ＋ *"끓이는거 없엉??"*
//    ⛔ 콩국수는 «끓이는 걸음»이 없다(면 삶기뿐) → **끓이는 레시피**(돼지고기 김치찌개)로 찍는다
await 홈으로(p); await 탭(p, '레시피')
await p.locator('text=돼지고기 김치찌개').first().click()
await p.waitForTimeout(1000)
await 굴리기(p, 900)
const 요리시작 = p.getByRole('button', { name: /요리 시작/ }).first()
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
} else console.log('  ⛔ 「요리 시작」 단추를 못 찾았다')

// ⑤ 🎨 꾸미기 — 📮 *"레꾸꾸미기에서 «더 귀여운 스티커들» 있는 부분으로"*
//    ⛔ 요리 모드에서 «뒤로»가 상세로 안 돌아올 때가 있다 → 앱을 다시 열고 처음부터 들어간다
await 홈으로(p); await 탭(p, '레시피')
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
await 홈으로(p)
await p.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
  const 달첫날 = new Date(오늘.getFullYear(), 오늘.getMonth(), 1).getTime()
  const 날 = (d) => { const x = new Date(오늘); x.setDate(x.getDate() - d); return x.getTime() }
  const 기록 = [['콩국수', 1], ['돼지고기 김치찌개', 3], ['제육볶음', 5], ['된장찌개', 8],
    ['소고기 미역국', 11], ['국물 떡볶이', 14], ['비빔국수', 17]]
    .filter(([, d]) => 날(d) >= 달첫날)
    .map(([t, d], i) => ({ id: `cz${i}`, title: t, at: 날(d) }))
  st.diary = [...(st.diary || []), ...기록]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
})
await 홈으로(p)
if (await 탭(p, '일기')) await 찍자(p, '26-일기-채운달력', '한끼 일기 — 음식 아이콘이 쌓인 달력')

// ⑦ 🛒 장보기 — 📮 *"장보기 «사러가기»가 아니라 큐레이션 설명만있어."* ＋ *"사러가기에 설명부분은 빼자"*
//    ⛔ 화면 맨 위는 소개글 ＋ 검색칸이다. 「담기 · 사러가기」는 그 아래라 위에서 자르면 통째로 안 보인다.
//    ⭐ 소개글이 «한 줄도» 안 걸리게 — 첫 제품 카드가 화면 «위쪽»에 올 때까지 굴린다.
await 홈으로(p)
if (await 탭(p, '장보기')) {
  for (let n = 0; n < 10; n++) {
    const 됐나 = await p.evaluate(() => {
      const 사 = [...document.querySelectorAll('button,a')].filter((e) => /사러가기/.test(e.innerText || ''))
      if (사.length < 2) return false
      const r = 사[0].getBoundingClientRect()
      // 첫 「사러가기」가 화면 위쪽 절반에 오면 소개글은 이미 다 지나간 것이다
      return r.top > 100 && r.top < innerHeight * 0.5
    })
    if (됐나) break
    await 굴리기(p, 240)
  }
  await 찍자(p, '27-장보기-사러가기', '장보기 — 담기·사러가기가 보이는 자리')
}

console.log(`\n📸 ${찍은것.length}장 → ${OUT}`)
await b.close(); srv.close()
