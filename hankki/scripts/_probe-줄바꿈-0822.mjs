// ↩️↩️ [2026-08-22] 줄바꿈 «전수» 검사 — 글자를 키우면 «어디가 이상해지나»
//
// 📮 창업자 = *"상세 주부의 장바구니랑 그아래 설명도 **줄바꿈이상** 그냥 **전반적으로 줄바꿈다체크**"*
//
// ⭐⭐ **왜 도구인가** — 글자를 키울 때마다 줄바꿈이 «조용히» 나빠진다.
//    오늘 실제로 그랬다: ＋1px 을 줬더니 「아보카도 바나나 스…」가 잘렸고,
//    **숫자(크기·대비)는 전부 초록불**이었다. 눈으로 훑으면 화면이 여섯이라 반드시 놓친다.
//
// 🔍 잡는 것 넷 — 전부 «화면에 그려진 것»으로 잰다(CSS 값이 아니다)
//    ⓐ **잘림**       = 글이 상자보다 넓은데 `…` 로 잘렸다 (ellipsis)
//    ⓑ **외톨이 줄**  = 마지막 줄에 글자가 «몇 개만» 남았다 (「…어울려 / 요」)
//    ⓒ **낱말 쪼개짐** = 한글이 든 글인데 `word-break` 가 `keep-all` 이 아니다
//       → 낱말 «가운데»가 잘릴 수 있다 (우리 앱 공통 규칙이 keep-all 이다)
//    ⓓ **가로 넘침**   = 한 낱말이 칸보다 넓어 밖으로 삐져나온다
//
// ⛔ 꾸미기(레꾸·일꾸)는 «창업자 확정 규격»이라 이 검사 밖이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-줄바꿈-0822.mjs
//      W=820 H=1180 node scripts/_probe-줄바꿈-0822.mjs   ← 패드로
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4439, r))

const W = Number(process.env.W || 390), H = Number(process.env.H || 844)
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: W, height: H } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4439/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

// ⭐ 「지금 보이는 화면」만 잰다 — 앞 화면 DOM 이 남아 섞이는 걸 막는다
//    (2026-08-21 링크정직·오늘 상세 판에서 «두 번» 밟은 함정)
// ⛔⛔⛔ **이 아래는 통째로 «템플릿 문자열»이다 — 주석에도 백틱을 쓰지 말 것.**
//    2026-08-22 에 여기서 «세 번» 죽었다. 백틱 하나가 문자열을 끊어 문법 오류가 난다.
//    ✅ 코드 이름은 낫표「」로 감싼다.
const 재기 = `(() => {
  const 결과 = []
  const 보이나 = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) return false
    if (r.bottom < 0 || r.top > innerHeight * 3) return false
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false
    return true
  }
  for (const el of document.querySelectorAll('*')) {
    // 글자를 «직접» 담은 잎만 (부모까지 세면 같은 글을 여러 번 센다)
    const 글 = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ')
    if (!글 || 글.length < 2) continue
    if (el.closest('.decor-layer,.memo-note,.cover,[class*="decor"]')) continue  // 꾸미기는 확정 규격
    // ⛔ 형광펜(.hl-mark)은 «일부러» 글자보다 넓다 — 「::after」 가 left/right 를 −6px 씩 뺀다.
    //    그래서 늘 「가로넘침」으로 잡힌다. 넘치는 게 «맞는» 자리라 뺀다(시끄러운 검사는 죽은 검사다).
    if (el.classList.contains('hl-mark')) continue
    if (!보이나(el)) continue
    const cs = getComputedStyle(el)
    const px = parseFloat(cs.fontSize)
    const 한글 = /[가-힣]/.test(글)

    // 줄마다의 상자 — Range 로 «그려진 줄»을 직접 읽는다
    // ⛔⛔ 두 번째 헛것 — 「selectNodeContents」 는 «자식 요소»(아이콘 img·svg)까지 담는다.
    //    그래서 아이콘 붙은 제목(「주부의 장바구니에서 고른 재료」)이 «2줄 · 끝줄 1자»로 나왔다.
    //    실물 캡처에선 한 줄이었다(절대원칙 21 이 잡았다).
    //    ✅ **그 요소가 «직접» 가진 글자 마디만** 잰다.
    const 마디들 = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    const rg = document.createRange()
    rg.setStartBefore(마디들[0])
    rg.setEndAfter(마디들[마디들.length - 1])
    // ⛔⛔ 첫 판이 «인라인 요소»를 여러 줄로 잘못 셌다 — 「b」 태그 하나가 상자 둘로 잡혀
    //    한 줄인 말풍선(「오늘 또 뭐 먹지?」)이 「2줄 · 끝줄 1자」로 나왔다.
    //    ✅ **같은 줄(윗변이 같은 것)은 하나로 묶는다.** 「줄」은 «윗변»이 정한다.
    const 날것 = [...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
    const 줄지도 = new Map()
    for (const r of 날것) {
      const 키 = Math.round(r.top)
      const 옛 = 줄지도.get(키)
      if (!옛) 줄지도.set(키, { top: r.top, left: r.left, right: r.right })
      else { 옛.left = Math.min(옛.left, r.left); 옛.right = Math.max(옛.right, r.right) }
    }
    const 줄들 = [...줄지도.values()].sort((a, b) => a.top - b.top).map((x) => ({ width: x.right - x.left }))
    const 줄수 = 줄들.length
    const 최대폭 = 줄수 ? Math.max(...줄들.map((r) => r.width)) : 0
    const 끝줄폭 = 줄수 ? 줄들[줄수 - 1].width : 0

    const 잘림 = cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1
    const 클램프 = cs.webkitLineClamp && cs.webkitLineClamp !== 'none' ? Number(cs.webkitLineClamp) : 0
    const 클램프잘림 = 클램프 > 0 && el.scrollHeight > el.clientHeight + 1
    const 넘침 = el.scrollWidth > el.clientWidth + 1 && !잘림
    // ⭐ 외톨이 = 두 줄 이상인데 마지막 줄이 «아주 짧다»(전체 폭의 12% 미만 · 글자 2개 이하)
    const 끝글자수 = Math.round(끝줄폭 / (px * 0.95))
    const 외톨이 = 줄수 >= 2 && 끝글자수 <= 2 && 끝줄폭 < 최대폭 * 0.14
    // ⭐ 한글인데 keep-all 이 아니면 낱말 «가운데»가 잘릴 수 있다
    const 쪼개짐 = 한글 && 줄수 >= 2 && !/keep-all/.test(cs.wordBreak) && !/keep-all/.test(cs.overflowWrap)

    if (잘림 || 클램프잘림 || 넘침 || 외톨이 || 쪼개짐) {
      결과.push({
        글: 글.slice(0, 34), px: Math.round(px * 10) / 10, 줄수, 끝글자수,
        길: (el.className || '').toString().split(/\\s+/).filter(Boolean).slice(0, 2).join('.') || el.tagName.toLowerCase(),
        탈: [잘림 && '잘림', 클램프잘림 && '두줄넘어잘림', 넘침 && '가로넘침', 외톨이 && '외톨이', 쪼개짐 && '낱말쪼개짐'].filter(Boolean).join('·'),
      })
    }
  }
  return 결과
})()`

const 탭가기 = async (이름) => {
  await p.evaluate((T) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
  }, 이름)
  await p.waitForTimeout(800)
}

const 모음 = []
const 재고담기 = async (화면) => {
  const r = await p.evaluate(재기)
  r.forEach((x) => 모음.push({ 화면, ...x }))
  console.log(`  ${화면.padEnd(16, ' ')} ${r.length ? `⚠️ ${r.length}곳` : '✅ 깨끗'}`)
}

console.log(`\n↩️ 줄바꿈 전수 — ${W}×${H}\n`)
await 재고담기('홈')
for (const t of ['레시피', '일기', '장보기', '레꾸자랑']) { await 탭가기(t); await 재고담기(t) }

// 🛒 장보기 「주부의 장바구니」 펼친 상태 — 창업자가 콕 집은 자리
await 탭가기('장보기')
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /펼치기|접기/.test(x.innerText || ''))?.click())
await p.waitForTimeout(700)
await 재고담기('장보기(펼침)')

// 🍳 레시피 상세 — 창업자가 콕 집은 자리
await 탭가기('레시피')
await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click()
await p.waitForTimeout(1000)
const 열림 = await p.evaluate(() => !!document.querySelector('.ing, .step'))
if (!열림) console.log('  ⛔ 레시피 상세를 못 열었다 — 재지 않는다')
else { await 재고담기('레시피 상세(위)'); await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, 900); await p.waitForTimeout(600); await 재고담기('레시피 상세(아래)') }

await b.close(); srv.close()

// ───────── 표 ─────────
const 갈래 = ['잘림', '두줄넘어잘림', '가로넘침', '외톨이', '낱말쪼개짐']
console.log(`\n📊 모두 ${모음.length}곳`)
갈래.forEach((g) => {
  const n = 모음.filter((x) => x.탈.includes(g)).length
  if (n) console.log(`   · ${g.padEnd(8, ' ')} ${n}곳`)
})

for (const g of 갈래) {
  const 것 = 모음.filter((x) => x.탈.includes(g))
  if (!것.length) continue
  console.log(`\n── ${g} (${것.length}곳) ──`)
  것.slice(0, 12).forEach((x) => {
    console.log(`   [${x.화면}] ${x.px}px ${x.줄수}줄${x.탈.includes('외톨이') ? `(끝줄 ${x.끝글자수}자)` : ''}  .${x.길}`)
    console.log(`      ${x.글}`)
  })
  if (것.length > 12) console.log(`   … 외 ${것.length - 12}곳`)
}

console.log('\n⭐ 읽는 법')
console.log('   · 「외톨이」 = 마지막 줄에 한두 자만 남은 것 — 제일 지저분해 보이는 모양이다')
console.log('   · 「낱말쪼개짐」 = 한글인데 keep-all 이 아니다 → 낱말 «가운데»가 잘릴 수 있다')
console.log('   ⛔ 「잘림」이 늘 나쁜 건 아니다 — 한 줄로 못 박은 자리(칩·배지)는 잘리는 게 맞다')

// ───────── 🚦 게이트 ─────────
// ⭐⭐ **왜 게이트인가** — 줄바꿈은 «글자 크기를 만질 때마다» 조용히 나빠진다.
//    오늘만 해도 ＋1px 에 「아보카도 바나나 스…」가 잘렸고 숫자는 전부 초록불이었다.
//    이 검사가 있으면 **다음에 크기를 올릴 때 그 자리가 바로 빨간불**이 된다.
//
// ✅ «일부러 그런 것»만 봐준다 — 장보기 제품 설명은 한 줄로 접고 「더보기」를 붙였다(창업자 확정 2026-08-12).
//    ⛔ 목록을 넓게 잡지 않는다. 넓히면 진짜 사고를 통과시킨다.
const 봐줌 = (x) => x.화면.startsWith('장보기') && x.길.includes('t-sub') && /잘림/.test(x.탈)
const 진짜 = 모음.filter((x) => !봐줌(x))
console.log(`\n🚦 게이트 — 봐줄 것 ${모음.length - 진짜.length}곳(장보기 「더보기」) · **진짜 ${진짜.length}곳**`)
if (진짜.length) {
  진짜.slice(0, 10).forEach((x) => console.log(`  ⛔ [${x.화면}] ${x.탈} · .${x.길} — ${x.글}`))
  console.log(`\n⛔ 줄바꿈이 나빠졌다 ${진짜.length}곳\n`)
  process.exit(1)
}
console.log('\n✅ 줄바꿈 전수 통과\n')
