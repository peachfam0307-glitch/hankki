// 【✅ 반영됨 · smoke 게이트】 ⛔이 판이 죽으면 배포가 막힌다 — 장수 안내를 되돌린 것이다.
// 💰 「AI 스캔 1장이 깎인다는 걸 «쓰기 전»에 아는가」 — 창업자 지시 검증 (2026-08-21)
//
// 📮 창업자 = *"빨강색으로 안내해줘야할 것 같아. **1장 스캔하면 1장 까인다는걸.**"*
//    ＋ *"가져오기에 안내도 명확하고 잘보이게 다시 적어야 할 것 같아. 색이나 문체등등"*
//    ＋ *"**처음보는 사람도 이해하게 써야해** / 예시를 적어도 좋고"*
//    ＋ (2026-08-13) *"유저가 몇장남았는지 **스스로 알아야해**"* — 미감이 아니라 «돈» 문제다.
//
// ⭐⭐ **이 판의 심장 = 「값이 «권유보다 먼저» 나오나」.**
//    ⛔ 「빨간 글자가 있나」를 재는 판이 아니다. 옛 판에도 글자는 «있었다» —
//       「긴 레시피는 여러 장을 한꺼번에 골라도 돼요 — 사진 1장에 AI 스캔 1장씩 써요」
//       한 줄인데 **권유가 앞이고 값이 뒤**였다. 거기에 색만 입히면 「골라도 돼요」가 빨개진다.
//    📌 그래서 «순서»를 잰다 — 값 줄의 y 좌표가 안내 목록보다 «위»에 있어야 한다.
//
// 🔢 그리고 **깎이는 자리 «전부»**를 잰다. 이게 이 판을 만든 진짜 이유다 —
//    실측하니 `ocrImage()`(돈 드는 AI 스캔)를 부르는 곳이 **셋**인데 안내는 **하나**에만 있었다.
//      ① 캡처   `EditorScreen.jsx`  ← 안내 있었다(순서가 거꾸로)
//      ② 영수증 `PantryView.jsx`    ← ⛔**안내 0줄** · 조용히 깎였다
//      ③ 공유받기 `App.jsx`          ← ⛔**안내 0줄** · 유저가 «가져오기를 누른 적도 없다»
//    ⛔⛔ 검사가 ①만 보면 ②③이 언제든 다시 조용해진다(규칙 18 ⓘ — 검사가 «무엇을» 보는지).
//
// ⛔ 규칙 18 ⓘ — 이 판은 **화면에 «그려진 글자»**(innerText)와 **computed color** 를 본다.
//    소스를 grep 하면 주석에 적어둔 옛 문구까지 걸려 고쳐놓고도 실패로 나온다.
//
// ⛔ 색을 «숫자로» 비교하지 않는다 — `--danger` 는 테마마다 다르다.
//    그 자리에서 CSS 변수를 읽어 «같은 색인가»만 본다. 값을 박으면 테마를 바꾸는 날 이 판이 죽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-장수안내-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/장수안내'
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
await new Promise((r) => srv.listen(4409, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(이름, 조건) {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}`)
  return !!조건
}

const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const 에러 = []
page.on('pageerror', (e) => 에러.push(String(e.message).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
await page.goto('http://127.0.0.1:4409/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const 글자 = () => page.evaluate(() => document.body.innerText || '')

// 🎨 그 화면에서 «지금 테마의» --danger 를 읽어 온다 — 숫자를 박지 않는다.
const 위험색 = () => page.evaluate(() => {
  const d = document.createElement('span')
  d.style.color = 'var(--danger)'
  document.body.appendChild(d)
  const c = getComputedStyle(d).color
  d.remove()
  return c
})

// 「그 글자를 담은 제일 안쪽 요소」의 색과 y 를 잰다.
//    ⛔ 조상 상자로 재면 «카드 전체»가 잡혀 색이 부모 색으로 나온다(규칙 18 ⓘ).
const 글자자리 = (말) => page.evaluate((m) => {
  const els = [...document.querySelectorAll('body *')].filter(
    (e) => (e.textContent || '').includes(m) && ![...e.children].some((c) => (c.textContent || '').includes(m)),
  )
  if (!els.length) return null
  const e = els[0], r = e.getBoundingClientRect()
  return { y: r.top + window.scrollY, color: getComputedStyle(e).color, 글: (e.textContent || '').trim().slice(0, 40) }
}, 말)

console.log('\n💰 장수 카운트 안내 — 「쓰기 전에 아는가」\n')

// ── ① 가져오기 첫 화면 : 돈 드는 길 ↔ 공짜 길이 갈렸나 ──
console.log('── ① 가져오기 · 돈 드는 길 ↔ 공짜 길 ──')
await page.getByRole('button', { name: '가져오기' }).first().click()
await page.waitForTimeout(900)
const t가져오기 = await 글자()
// ⭐ 「1장씩」과 「0장」이 «같은 줄»에 나란히 있어야 뜻이 선다.
//    한쪽만 적으면 유저는 비교할 게 없어 그냥 지나친다.
chk('① 캡처가 「AI 스캔 1장씩」을 쓴다고 적혀 있다', t가져오기.includes('AI 스캔 1장씩'))
chk('② 글 붙여넣기는 「0장」이라고 «나란히» 적혀 있다', t가져오기.includes('0장'))
const 캡처값 = await 글자자리('AI 스캔 1장씩')
const 위험 = await 위험색()
chk(`③ 그 값이 위험색(--danger = ${위험})으로 칠해졌다`, !!캡처값 && 캡처값.color === 위험)
// ⛔ 잔량 띠는 v10.56 부터 있던 것이다 — 이 판이 그걸 «깨뜨리지 않았나»도 같이 본다.
chk('④ 맨 위 잔량 띠가 그대로 살아 있다', /무료 AI 스캔.*남았어요|다 썼어요/.test(t가져오기))
// ⭐⭐ 값을 «고르는 그 줄»에도 — 창업자가 결제에 대해 정한 「쓰려는 순간 그 자리에서」와 같은 원칙.
//    ⛔ 맨 위 잔량 띠로는 못 대신한다 — 그건 「몇 장 남았나」고 이건 「이 길이 몇 장을 쓰나」다.
chk('④-b 제일 많이 누르는 길(사진·직접 작성)에 「AI 스캔 1장」이 붙어 있다', /직접 작성[\s\S]{0,80}AI 스캔 1장/.test(t가져오기))
chk('④-c 공짜 길(텍스트 붙여넣기)에 「AI 스캔 0장」이 나란히 붙어 있다', /텍스트 붙여넣기[\s\S]{0,80}AI 스캔 0장/.test(t가져오기))
// ⛔ 히어로 카드 설명은 `.opt-row .t .b` 가 «아니라» 인라인 style 이라 v11.19 의 keep-all 이 안 걸렸다.
//    실물에서 「읽어 채워 / 요」로 잘려 있었다. 클래스로 고친 것은 클래스를 쓰는 줄만 낫는다.
const 가져오기잘림 = await page.evaluate(() => {
  const 값 = [...document.querySelectorAll('body *')]
    .filter((e) => /캡처는 재료·만드는 법|캡처는 AI 스캔/.test(e.textContent || '')
      && ![...e.children].some((c) => /캡처는 재료·만드는 법|캡처는 AI 스캔/.test(c.textContent || '')))
  return { n: 값.length, 나쁨: 값.filter((e) => getComputedStyle(e).wordBreak !== 'keep-all').length }
})
chk(`④-d ⛔가져오기 안내도 낱말 가운데서 안 잘린다 (${가져오기잘림.n}줄 중 어긴 것 ${가져오기잘림.나쁨})`,
  가져오기잘림.n >= 2 && 가져오기잘림.나쁨 === 0)

// ⭐⭐⭐ 창업자 = *"어 다 안내해"* — 이 칸이 그 말을 «장치»로 만든다.
//    ⛔ 「어느 줄에 있나」를 손으로 세지 않는다. 그러면 나중에 옵션을 하나 더 넣을 때
//       그 줄만 조용히 빠지고 아무도 모른다(빈칸은 «0장»으로 읽힌다).
//    ✅ 그래서 **줄 수와 꼬리표 수를 대조**한다 — 하나라도 모자라면 배포가 막힌다.
//       📌 「검사가 있다」와 「검사가 «전부»를 본다」는 다른 말이다(2026-08-05 packleak 교훈).
const 목록 = await page.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.opt-row')]
  return {
    n: 줄.length,
    안내: 줄.filter((e) => /AI 스캔 \d장/.test(e.textContent || '')).length,
    빠진것: 줄.filter((e) => !/AI 스캔 \d장/.test(e.textContent || ''))
      .map((e) => (e.querySelector('.a')?.textContent || '?').trim()),
  }
})
chk(`⑤-a ⭐목록 «네 줄 전부»가 장수를 말한다 (${목록.안내}/${목록.n}${목록.빠진것.length ? ' · 빠진 것: ' + 목록.빠진것.join(',') : ''})`,
  목록.n >= 4 && 목록.안내 === 목록.n)
// ⭐ 히어로(사진·직접 작성)는 `.opt-row` 밖이라 위에서 따로 봤다(④-b). 합치면 다섯이다.
// ⚠️ 조건부인 둘(인스타·유튜브)은 「캡처는」을 앞에 붙여야 한다 —
//    그냥 「1장」이라 적으면 «붙여넣기»로 담는 사람도 깎이는 줄 안다.
chk('⑤-b ⚠️조건부인 줄은 조건을 밝힌다 (「캡처는 AI 스캔 1장」)',
  (t가져오기.match(/캡처는 AI 스캔 1장/g) || []).length >= 2)
writeFileSync(join(OUT, '1-가져오기.png'), await page.screenshot({ fullPage: true }))

// ── ② 편집 화면 : ⭐값이 «권유보다 먼저» 나오나 ──
console.log('\n── ② 편집 화면 · 값이 먼저인가 ──')
await page.getByText('사진 · 직접 작성하기', { exact: false }).first().click()
await page.waitForTimeout(1000)
const t편집 = await 글자()
chk('⑤ 「사진 1장에 AI 스캔 1장을 써요」가 있다', t편집.includes('사진 1장에 AI 스캔 1장을 써요'))
// ⭐⭐ 예시 — 창업자 *"처음보는 사람도 이해하게 · 예시를 적어도 좋고"*
//    「1장에 1장」은 규칙이고 「3장 고르면 3장」은 그림이다. 처음 보는 사람은 그림으로 이해한다.
chk('⑥ ⭐예시가 같이 있다 (「3장 고르면 3장」)', t편집.includes('3장 고르면 3장'))
// ⭐ 겁만 주면 안 된다 — 우리는 진짜로 안 끊긴다(tesseract 무제한).
chk('⑦ 「다 써도 기본 인식으로 계속」이 «같은 자리»에 있다', /다 써도.*기본 인식/.test(t편집))
const 값줄 = await 글자자리('사진 1장에 AI 스캔 1장을 써요')
const 초안줄 = await 글자자리('사진 보며 다듬어')
chk(`⑧ ⭐⭐값 줄이 안내 목록보다 «위»에 있다 (값 y=${값줄?.y} · 목록 y=${초안줄?.y})`,
  !!값줄 && !!초안줄 && 값줄.y < 초안줄.y)
chk(`⑨ 값 줄이 위험색이다 (${값줄?.color})`, !!값줄 && 값줄.color === 위험)
// ⛔⛔ 옛 문구가 남아 있으면 권유가 다시 앞에 선다 — 창업자가 잡은 그 자리다.
chk('⑩ ⛔옛 문구 「여러 장을 한꺼번에 골라도 돼요」가 사라졌다', !t편집.includes('한꺼번에 골라도 돼요'))
// ⛔ 창업자 = *"재료 순서가 섞이면 이게 무슨말이지"* — 앱 만든 사람이 못 읽는 문장이었다.
chk('⑪ ⛔못 읽던 문구 「재료·순서가 섞이면」이 사라졌다', !t편집.includes('재료·순서가 섞이면'))
chk('⑫ ✅쉬운 말로 바뀌었다 (「재료 칸에 만드는 법이 섞여 들어왔다면」)', t편집.includes('재료 칸에 만드는 법이 섞여 들어왔다면'))
// ⛔⛔ 한글 낱말 잘림 — 실물을 열어보고서야 잡았다(규칙 21). 「그 칸의 사 / 진에서 채우기」로 갈라져 있었다.
//    ⭐ 「글자가 있나」로는 «절대» 안 잡힌다 — innerText 는 줄바꿈을 안 알려준다.
//       그래서 computed style 을 본다. 문장을 새로 넣을 때마다 다시 나는 병이라 못 박는다.
const 안잘림 = await page.evaluate(() => {
  const 값 = [...document.querySelectorAll('body *')]
    .filter((e) => /사진 1장에 AI 스캔|재료 칸에 만드는 법|읽은 글은/.test(e.textContent || '')
      && ![...e.children].some((c) => /사진 1장에 AI 스캔|재료 칸에 만드는 법|읽은 글은/.test(c.textContent || '')))
  return { n: 값.length, 나쁨: 값.filter((e) => getComputedStyle(e).wordBreak !== 'keep-all').length }
})
chk(`⑫-b ⛔안내 줄이 «낱말 가운데»서 안 잘린다 (keep-all · ${안잘림.n}줄 중 어긴 것 ${안잘림.나쁨})`,
  안잘림.n >= 3 && 안잘림.나쁨 === 0)
writeFileSync(join(OUT, '2-편집.png'), await page.screenshot({ fullPage: true }))

// ── ③ 냉장고 영수증 : ⛔안내가 «0줄»이던 자리 ──
console.log('\n── ③ 냉장고 영수증 · 조용히 깎이던 자리 ──')
await page.goto('http://127.0.0.1:4409/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.getByRole('button', { name: '장보기' }).first().click()
await page.waitForTimeout(800)
await page.getByText('냉장고', { exact: false }).first().click().catch(() => {})
await page.waitForTimeout(800)
const t냉장고 = await 글자()
chk('⑬ ⭐영수증 화면에 「영수증 1장에 AI 스캔 1장을 써요」가 있다', t냉장고.includes('영수증 1장에 AI 스캔 1장을 써요'))
chk('⑭ 「다 써도 기본 인식으로 계속」이 같이 있다', /다 써도.*기본 인식/.test(t냉장고))
const 영수증값 = await 글자자리('영수증 1장에 AI 스캔 1장을 써요')
chk(`⑮ 위험색이다 (${영수증값?.color})`, !!영수증값 && 영수증값.color === 위험)
// ⭐ 셋이 «같은 문장 틀»이라야 유저가 같은 규칙으로 읽는다(같은 기능은 같은 이름 원칙).
chk('⑯ ⭐편집·영수증이 «같은 문장 틀»이다 (「N장에 AI 스캔 N장을 써요」)',
  t편집.includes('에 AI 스캔 1장을 써요') && t냉장고.includes('에 AI 스캔 1장을 써요'))
writeFileSync(join(OUT, '3-냉장고.png'), await page.screenshot({ fullPage: true }))

// ── ④ 공유받기 : 토스트에 잔량이 실리나 (소스로 «불렀나»만 본다) ──
//    ⛔ 이 자리는 화면으로 못 잰다 — 공유 인텐트(`share-target`)가 있어야 도는 길이라
//       브라우저에서 흉내내면 «앱이 실제로 하는 일»과 달라진다.
//    ✅ 그래서 잰 것은 하나뿐 = **잔량을 읽는 함수를 그 자리에서 «부르는가»**.
//       ⚠️ 정직하게 — 이건 「토스트가 예쁘게 뜨나」의 답이 아니다. 「깎였다는 걸 알리려 하는가」의 답이다.
console.log('\n── ④ 공유받기 · 잔량을 알리나 (소스) ──')
const app = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8')
chk('⑰ App.jsx 가 잔량(getOcrLeft)을 읽어 온다', /import\s*\{[^}]*getOcrLeft/.test(app))
chk('⑱ 사진을 읽은 뒤 토스트에 「남았어요」를 싣는다', /읽어 채웠어요[^\n]*남았어요/.test(app))
// ⛔ 서버가 한 번도 답한 적 없으면(unknown) 숫자를 적으면 안 된다 —
//    그때 숫자를 적으면 «안 써 봤을 때의 기본값 20»을 사실처럼 말하게 된다(규칙 15).
chk('⑲ ⛔unknown 이면 숫자를 «안» 적는다', /left\.unknown/.test(app))

// ── ⑤ 인스타·유튜브 흐름 : «진짜 갈림길»에도 값이 있나 ──
//    ⭐ 목록 줄은 「캡처는 1장」이라고 «조건»만 말한다. 셋 중 무엇을 고를지는 이 화면에서 정해진다.
//       여기가 비면 유저는 목록에서 본 조건을 «다시» 못 맞춘다.
console.log('\n── ⑤ 인스타·유튜브 흐름 · 갈림길 셋 ──')
for (const 이름 of ['YouTube', 'Instagram']) {
  await page.goto('http://127.0.0.1:4409/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  await page.getByText(이름, { exact: true }).first().click()
  await page.waitForTimeout(700)
  const 단추 = await page.evaluate(() => {
    const 것 = [...document.querySelectorAll('button.card')]
      .filter((e) => /캡처해서 올리기|붙여넣기|적기/.test(e.textContent || ''))
    return {
      n: 것.length,
      안내: 것.filter((e) => /AI 스캔 \d장/.test(e.textContent || '')).length,
      빠진것: 것.filter((e) => !/AI 스캔 \d장/.test(e.textContent || ''))
        .map((e) => (e.textContent || '').trim().slice(0, 14)),
    }
  })
  chk(`㉠ ${이름} 흐름 · 단추 «셋 전부»가 장수를 말한다 (${단추.안내}/${단추.n}${단추.빠진것.length ? ' · 빠진 것: ' + 단추.빠진것.join(',') : ''})`,
    단추.n === 3 && 단추.안내 === 3)
  const t흐름 = await 글자()
  // ⭐ 갈림길이라 «둘 다» 보여야 값이 값으로 읽힌다 — 1장짜리 하나, 0장짜리 둘.
  chk(`㉡ ${이름} 흐름에 「1장」과 「0장」이 «나란히» 있다`, /AI 스캔 1장/.test(t흐름) && /AI 스캔 0장/.test(t흐름))
  writeFileSync(join(OUT, `4-흐름-${이름}.png`), await page.screenshot({ fullPage: true }))
}

chk(`⑳ pageerror 0 (${에러.length})`, 에러.length === 0)

await b.close(); srv.close()
console.log(`\n${실패 ? '❌' : '✅'} 장수 안내 — 통과 ${통과} · 실패 ${실패}`)
if (실패) { console.log('   ' + 실패목록.join('\n   ')); process.exit(1) }
console.log(`📸 ${OUT}`)
