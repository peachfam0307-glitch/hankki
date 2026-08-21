// 🏠 [판정 대기 · 2026-08-21] 홈 «윗부분»이 정신없다 — 하나씩 걷어내며 실물로 찍는다
//
// 📮 창업자 셋 —
//    ⑴ *"**임시보관함은 저기에 있으면 좀 지저분해보영..**"*
//    ⑵ *"**말풍선까지 들어가니까 홈 윗부분이 정신없긴하네**"*
//    ⑶ *"**가져오기 위에 버튼이 꼭 필요한가?**"*
//
// ⭐⭐ **⑶ 이 제일 세다 — 「＋ 가져오기」는 «두 곳»에 있다(실측).**
//    · 홈 상단바 오른쪽 = 파란 «알약»  (홈에서만)
//    · 하단바 두 번째   = 파란 «원»    (모든 탭에서)  ← `BottomNav.jsx:29`
//    둘 다 같은 곳(`{name:'import'}`)으로 간다.
//    ⛔⛔ 그리고 우리는 **중복인 걸 알면서 뒀다** — `BottomNav.jsx:17` 에 내가 이렇게 적어놨다:
//       *"B 안이면 홈으로 갔다 와야 한다(**홈 맨 위에 「＋ 가져오기」가 있긴 하다**)"*
//       → 그때 판단은 「하단바가 있으면 어느 탭에서든 눌린다」였고 그게 채택됐다.
//         **그러면 홈 위의 것은 «남은 것»이지 «필요한 것»이 아니다.**
//
// 🔢 지금 홈 윗부분에 «쌓인 것» 다섯 겹 —
//    ① 상단바(아바타 · 한끼 · ⓘ · ＋가져오기 · ⚙)  ② 말풍선  ③ 검색바  ④ 임시보관함  ⑤ 한끼 소식
//    ⭐ 유저가 홈에 온 «이유»는 대개 ⑤ 아래(오늘 뭐 해먹지 · 이번 주)인데 그 앞에 넷이 있다.
//
// ⛔ 갈래에 「임시보관함 도로 숨기기」는 «안» 넣는다 —
//    그건 창업자가 제보한 *"INBOX 나도 어딨는지 모르는데"* 로 되돌아가는 것이다(2026-08-21).
//    ✅ 대신 **자리를 옮기거나 작게** 한다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈윗부분-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈윗부분'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4435, r))

// ── 손보기 조각들 — «진짜 홈 DOM»을 옮긴다(흉내로 그리지 않는다 · 절대원칙 30) ──
const 조각 = {
  가져오기빼기: `(() => {
    const b = [...document.querySelectorAll('.topbar button')].find((x) => /가져오기/.test(x.getAttribute('aria-label') || x.innerText || ''))
    if (!b) return '못 찾음'; b.remove(); return '뺌'
  })()`,
  말풍선빼기: `(() => {
    const t = document.querySelector('.tab-talk,[class*="talk"]')
    if (!t) return '못 찾음'; t.remove(); return '뺌'
  })()`,
  보관함을검색바로: `(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /임시보관함|정리 안 한 레시피/.test(x.innerText || ''))
    const s = document.querySelector('.searchbar')
    if (!b || !s) return '못 찾음'
    const ic = b.querySelector('svg,img'); b.remove()
    const w = document.createElement('span')
    w.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:999px;background:var(--cream);flex:0 0 auto'
    if (ic) w.appendChild(ic)
    s.appendChild(w); return '검색바 안으로'
  })()`,
  // 🔍 창업자 안 = *"가져오기 버튼 없애고 **검색 아이콘을 넣어도** 될 것 같은데"*
  //    ⭐⭐ 이러면 **검색바 줄이 통째로 없어진다** — 상단바 아이콘 하나로 대신하니까.
  //    ⭐ 그리고 **다른 탭과 말이 맞는다** — 일기·레시피 탭은 이미 상단바에 «돋보기»를 쓴다.
  //       홈만 큰 검색바를 써서 혼자 달랐다.
  검색아이콘으로: `(() => {
    const 바 = document.querySelector('.searchbar')
    const 상단 = document.querySelector('.topbar')
    if (!바 || !상단) return '못 찾음'
    const 오른 = 상단.lastElementChild
    const 돋보기 = 바.querySelector('svg')
    const 단추 = document.createElement('button')
    단추.className = 'icon-btn press'
    단추.setAttribute('aria-label', '검색')
    if (돋보기) { 돋보기.setAttribute('width', 22); 돋보기.setAttribute('height', 22); 단추.appendChild(돋보기) }
    오른.insertBefore(단추, 오른.firstElementChild)
    바.remove()
    return '검색바 → 상단 아이콘'
  })()`,
  // 🗃 창업자 안 ② = *"**그옆에 임시보관함 아이콘을 넣던가**"*
  //    ⭐⭐ 검색 아이콘과 «같이» 하면 홈 윗부분에서 **줄이 둘 통째로** 사라진다(검색바 ＋ 보관함 카드).
  //    ⛔ 잃는 것 하나 = **숫자가 주던 재촉**(「정리 안 한 레시피 3개」).
  //       아이콘만 두면 «몇 개 남았는지»를 못 본다 → **작은 숫자 뱃지**로 되살린다.
  //       (2026-08-13 AI 스캔 잔량에서 정한 것과 같은 생각 — *"유저가 몇 장 남았는지 스스로 알아야 한다"*)
  보관함아이콘으로: `(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /임시보관함|정리 안 한 레시피/.test(x.innerText || ''))
    const 상단 = document.querySelector('.topbar')
    if (!b || !상단) return '못 찾음'
    const 오른 = 상단.lastElementChild
    const ic = b.querySelector('svg')
    const 수 = (b.innerText.match(/(\\d+)개/) || [])[1]
    const 단추 = document.createElement('button')
    단추.className = 'icon-btn press'
    단추.setAttribute('aria-label', '임시보관함')
    단추.style.position = 'relative'
    if (ic) { ic.setAttribute('width', 22); ic.setAttribute('height', 22); 단추.appendChild(ic) }
    if (수) {
      const 뱃지 = document.createElement('span')
      뱃지.textContent = 수
      뱃지.style.cssText = 'position:absolute;top:2px;right:0;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--brown);color:#fff;font-size:11px;font-weight:800;line-height:16px;text-align:center'
      단추.appendChild(뱃지)
    }
    오른.insertBefore(단추, 오른.lastElementChild)
    b.remove()
    return 수 ? \`아이콘＋뱃지 \${수}\` : '아이콘만'
  })()`,
  보관함맨아래로: `(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /임시보관함|정리 안 한 레시피/.test(x.innerText || ''))
    const p = document.querySelector('.pad')
    if (!b || !p) return '못 찾음'
    p.appendChild(b); b.style.marginTop = '18px'; return '맨 아래로'
  })()`,
}

// ⭐ 겹쳐 쌓는다 — 「하나씩 걷어내면 얼마나 조용해지나」를 보려는 판이라
//    갈래를 따로따로 두면 «합쳐졌을 때»가 안 보인다(창업자가 말한 건 «윗부분 전체»다).
const 갈래 = [
  { key: 'ㄱ', 이름: '지금 그대로', 설명: '다섯 겹 그대로', 손: [] },
  { key: 'ㄴ', 이름: '⭐창업자 안 — 🔍 ＋ 🗃 ＋ ⚙', 설명: '검색바 줄 ＋ 보관함 줄이 «둘 다» 사라진다 · 일기·레시피 탭과 말이 맞는다', 손: ['가져오기빼기', '보관함아이콘으로', '검색아이콘으로'] },
  { key: 'ㄷ', 이름: 'ㄴ ＋ 말풍선까지 뺌', 설명: '⚠️ 말풍선은 우리 «말투»다 — 조용해지지만 색도 빠진다', 손: ['가져오기빼기', '보관함아이콘으로', '검색아이콘으로', '말풍선빼기'] },
  { key: 'ㄹ', 이름: '🔍 만 올리고 보관함은 «맨 아래»로', 설명: '상단바를 셋까지 안 늘린다 — 보관함은 조용한 서랍처럼', 손: ['가져오기빼기', '검색아이콘으로', '보관함맨아래로'] },
  { key: 'ㅁ', 이름: '「＋가져오기」만 뺌 (제일 적게)', 설명: '중복만 없앤다 — 검색바·보관함은 그대로', 손: ['가져오기빼기'] },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

console.log('\n🏠 홈 윗부분 — 갈래 다섯 (390×844)')
console.log('   🔢 「첫 알짜」 = 「오늘 뭐 해먹지」 카드가 화면 위에서 몇 px 아래 있나 (작을수록 빨리 보인다)\n')
for (const g of 갈래) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4435/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  const 한것 = []
  for (const 이름 of g.손) 한것.push(`${이름}=${await p.evaluate(조각[이름])}`)
  await p.waitForTimeout(250)
  const 잰값 = await p.evaluate(() => {
    const 오늘 = [...document.querySelectorAll('*')].find((e) => /오늘 뭐 해먹지/.test(e.innerText || '') && e.getBoundingClientRect().width > 100)
    const 주간 = document.querySelector('.weekly-box')
    return {
      오늘y: 오늘 ? Math.round(오늘.getBoundingClientRect().top) : null,
      주간y: 주간 ? Math.round(주간.getBoundingClientRect().top) : null,
    }
  })
  const 파일 = join(OUT, `${g.key}.png`)
  await p.screenshot({ path: 파일 })
  console.log(`  ${g.key} ${g.이름.padEnd(30, ' ')} 「오늘 뭐 해먹지」 y=${String(잰값.오늘y).padStart(4)} · 주간 y=${String(잰값.주간y).padStart(4)}`)
  console.log(`     ${g.설명}`)
  if (한것.length) console.log(`     (${한것.join(' · ')})`)
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n⭐ ⛔찍고 끝내지 말 것 — 보내기 «전»에 다섯 장을 «열어서» 본다(절대원칙 21).')
