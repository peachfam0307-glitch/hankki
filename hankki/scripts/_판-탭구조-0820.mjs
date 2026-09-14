// 🧭🧭 하단 탭 구조 — 갈래 다섯을 «실물 하단바»로 찍는다 (2026-08-20)
//
// 📮 창업자 2026-08-19 = *"c는 개선방법을 찾았음 좋겠어. 지금 **전체레시피랑 레꾸자랑을 같은탭에 넣거나.**
//    그런식으로 **냉장고를 독립적으로 탭으로 살린다거나**.. 이건 고민해봐야 할 것 같아."*
// 📮 2026-08-20 = *"네가 정한대로 할게"* → 갈래를 내가 짜고 **고르는 건 창업자**(규칙 11).
//
// 🔢 실측 (이 판을 만들며 코드로 확인한 것)
//   · 하단바 = 여섯 (홈 · ＋가져오기 · 레시피 · 일기 · 장보기 · 레꾸자랑)
//     한 칸 = 390px 폰 **65px** · 320px 폰 **53.3px**
//   ⭐⭐ **「일곱은 안 된다」가 «틀렸다» — 이 판을 만들며 실측으로 뒤집었다.**
//     문서·`BottomNav.jsx` 주석 = *"일곱째는 한 칸 45.7px 라 「가져오기」가 안 들어간다"*
//     🔢 일곱째를 «진짜로 넣어» 재보니(scripts/_probe-일곱째탭-0820.mjs) —
//        320px **45.7** · 360px 51.4 · 390px **55.7** · 412px 58.9 → **네 폭 모두 44px 을 넘는다.**
//     📌 45.7px 이라는 숫자는 맞았다(320px 기준). 틀린 건 **「그래서 안 된다」**는 결론이다.
//        ⭐ 맞는 말 = 「아슬아슬하다」. 실물로 보면 글자는 «안 깨지고» 대신 **빽빽해 보인다.**
//     ⛔ 그래도 CLAUDE.md 의 「구매 탭 안 만든다」 확정은 «안 흔들린다» —
//        그 확정은 근거가 셋이고(자리·파는 창이 이미 있다·이미 그렇게 정했다) 뒤 둘이 그대로 산다.
//   · ⭐⭐ **「레시피」와 「일기」가 «같은 화면»이다** — `MyRecipesScreen` 을 `initView` 만 다르게 연다
//        레시피 탭 안 세그먼트 = [모아보기 | 한끼 일기] → **일기가 두 자리에 있다**
//   · ⭐ **레꾸자랑도 「내 레시피 고르기」로 시작한다**(`BragScreen`) — 레시피 탭과 재료가 같다
//        → 창업자가 「같은 탭에」라고 한 직관이 코드로도 맞는다
//   · 냉장고 = 장보기 탭 «안» 토글 · `ShopScreen.jsx:114` 주석 =
//        *"장보기가 주(첫인상), 냉장고는 옆 토글(부). **냉장고 기능은 유지하되 앞으로 안 내세운다.**"*
//   · 줄 수 = MyRecipes 925 · Shop 712 · Brag 282  (레꾸자랑이 제일 작다)
//
// ⛔ 이건 «시안»이다 — 앱 소스는 한 줄도 안 고친다. 브라우저에서 하단바 DOM 만 바꿔 찍는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-탭구조-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/탭구조'
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
await new Promise((r) => srv.listen(4394, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🧭 갈래 넷 — 라벨 배열로 표현한다(`null` = 그 자리를 없앤다)
//    ⭐ 아이콘은 «이미 앱에 있는 것»만 쓴다. 새로 그릴 게 0이다.
const 갈래 = [
  {
    이름: '0-지금', 제목: '지금',
    탭: ['홈', '가져오기', '레시피', '일기', '장보기', '레꾸자랑'],
  },
  {
    이름: '가-레꾸자랑을-레시피안으로', 제목: '㉠ 레꾸자랑을 레시피 탭 안으로 · 그 자리에 냉장고',
    탭: ['홈', '가져오기', '레시피', '일기', '장보기', '냉장고'],
    바꿈: { 레꾸자랑: '냉장고' },
  },
  {
    이름: '나-일기를-빼고-냉장고', 제목: '㉡ 일기 탭을 빼고 냉장고를 넣는다',
    탭: ['홈', '가져오기', '레시피', '냉장고', '장보기', '레꾸자랑'],
    바꿈: { 일기: '냉장고' },
  },
  {
    이름: '다-그대로-다섯칸', 제목: '㉢ 레꾸자랑만 레시피 안으로 — 다섯 칸(칸이 넓어진다)',
    탭: ['홈', '가져오기', '레시피', '일기', '장보기'],
    지움: ['레꾸자랑'],
  },
  {
    이름: '라-탭은-그대로', 제목: '㉣ 탭은 그대로 — 홈에서 「영수증」을 꺼낸다',
    탭: ['홈', '가져오기', '레시피', '일기', '장보기', '레꾸자랑'],
    홈줄: true,
  },
  {
    // ⭐⭐ 이 갈래는 «실측이 문서를 뒤집어서» 생겼다 (2026-08-20)
    //    문서·주석 = *"일곱째는 한 칸 45.7px 라 「가져오기」가 안 들어간다"*
    //    🔢 실제로 일곱째를 넣어 재보니 — 320px 폰에서 **45.7px 이 맞고, 44px 을 «넘는다»**.
    //       390px 55.7 · 412px 58.9. **네 화면 폭 모두 통과.**
    //    📌 「45.7px 이라 아슬아슬하다」는 맞는 말이고 「안 들어간다」는 틀린 말이었다.
    //    ⛔ 다만 «손가락»만 통과한 것이다 — 글자가 좁아 깨지는지는 눈으로 봐야 한다(절대원칙 21).
    이름: '마-일곱째로-냉장고', 제목: '㉤ 아무것도 안 빼고 냉장고를 «일곱째»로',
    탭: ['홈', '가져오기', '레시피', '일기', '장보기', '레꾸자랑', '냉장고'],
    더함: '냉장고',
  },
]

// ⛔ 폭을 «둘» 본다 — 390(보통 폰)에서 멀쩡해도 320(제일 작은 폰)에서 글자가 깨질 수 있다
const 폭 = Number(process.argv[2] || 390)
const 결과 = []
for (const g of 갈래) {
  const page = await b.newPage({ viewport: { width: 폭, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  const 잰값 = await page.evaluate(({ 바꿈, 지움, 홈줄, 더함 }) => {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) return { 오류: '하단바를 못 찾았다' }
    const 칸들 = [...nav.querySelectorAll('.nav-item')]

    // ① 라벨 바꾸기 — 아이콘은 그대로 두고 «글자»만 바꾼다(시안이라 그림은 나중에)
    for (const el of 칸들) {
      const 글 = [...el.querySelectorAll('span')].pop()
      if (!글) continue
      const 이름 = 글.textContent.trim()
      if (바꿈 && 바꿈[이름]) 글.textContent = 바꿈[이름]
      if (지움 && 지움.includes(이름)) el.remove()
    }

    // ①-b 일곱째 더하기 — «계산»이 아니라 브라우저가 진짜로 재게 한다
    if (더함) {
      const c = 칸들[2].cloneNode(true)   // 「레시피」 칸을 본떠 온다(아이콘은 시안이라 그대로)
      const 글 = [...c.querySelectorAll('span')].pop()
      if (글) 글.textContent = 더함
      c.classList.remove('on', 'active')
      nav.appendChild(c)
    }

    // ② 홈에 「영수증」 줄 (㉣ 전용) — 이미 있는 카드 결을 그대로 빌린다
    if (홈줄) {
      const 소식 = document.querySelector('.news-card')
      if (소식 && 소식.parentNode) {
        const d = document.createElement('div')
        d.className = 'hk-시안-영수증'
        d.style.cssText = 'width:100%;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:14px;background:var(--cream);margin-top:0'
        d.innerHTML = '<span style="font-size:22px">🧾</span>'
          + '<div style="flex:1;min-width:0;text-align:left">'
          + '<div style="font-size:14.5px;font-weight:800;color:var(--text)">영수증 찍으면 냉장고에 자동으로</div>'
          + '<div style="font-size:12px;color:var(--text-sub);margin-top:1px">손으로 안 적어도 돼요</div>'
          + '</div>'
        소식.parentNode.insertBefore(d, 소식.nextSibling)
      }
    }

    const 남은 = [...document.querySelectorAll('.bottom-nav .nav-item')]
    const 폭 = 남은.length ? Math.round(남은[0].getBoundingClientRect().width * 10) / 10 : null
    return {
      칸수: 남은.length,
      한칸폭: 폭,
      손가락OK: 폭 != null && 폭 >= 44,
      라벨: 남은.map((e) => ([...e.querySelectorAll('span')].pop()?.textContent || '').trim()).join(' · '),
    }
  }, { 바꿈: g.바꿈 || null, 지움: g.지움 || null, 홈줄: !!g.홈줄, 더함: g.더함 || null })

  await page.waitForTimeout(300)
  // 하단바만 크게 — 창업자가 폰에서 본다
  await page.screenshot({ path: join(OUT, `${폭}-${g.이름}-바.png`), clip: { x: 0, y: 844 - 92, width: 폭, height: 92 } })
  await page.screenshot({ path: join(OUT, `${폭}-${g.이름}-전체.png`) })

  결과.push({ ...g, ...잰값 })
  console.log(`  ${g.이름.padEnd(26)} ${잰값.칸수}칸 · 한 칸 ${잰값.한칸폭}px ${잰값.손가락OK ? '✅' : '⛔44px 미만'} · ${잰값.라벨}`)
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
