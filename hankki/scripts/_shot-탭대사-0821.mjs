// 【✅ 반영됨 · v11.18】 넣은 뒤 확인까지 끝났다.
// 💬✅ 탭 상단 「캐릭터 한마디」를 **앱 소스에 넣은 뒤** 실물로 확인한다.
//
// ⭐⭐ 시안(`_판-탭대사-0821.mjs`)은 브라우저에서 DOM 을 «덮어씌운» 것이라
//    「진짜 JSX·CSS 로 옮겼을 때도 같은가」는 별개 문제다. 이 판이 그걸 본다.
//    (2026-08-20 홈카드 때와 같은 순서 — 시안 → 앱 → 실물 확인)
//
// 📸 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 실물을 열어서 본다.
// 🔢 그리고 «숫자로도» 잰다 — 눈으로는 「몇 px 어긋난 것」을 못 잡는다.
//
// ⛔⛔ 이 판이 «반드시» 봐야 하는 것 다섯 —
//    ⑴ **아래로 갔나** — 말풍선 위가 상단바 «아래»인가.
//       시안 첫 판이 `.topbar`(가로 flex) «안»에 들어가 제목이 「레/시/피」로 쪼개졌다.
//    ⑵ **꼬리가 캐릭터를 가리키나** — 꼬리 한가운데 ↔ 상단바 캐릭터 한가운데 (창업자 요구)
//    ⑶ **탭마다 다른 대사** — 특히 레시피/일기는 «한 화면»이라 `view` 로 갈린다
//    ⑷ **말풍선이 화면 밖으로 안 나갔나** — ⛔「화면 가로넘침」으로 재면 헛방이다.
//       레시피 탭은 칩 줄이 원래 굴러가서 말풍선이 없어도 20px 넘친다(실측 대조).
//    ⑸ **다크 테마** — 색을 변수로만 썼나. 박아 넣었으면 여기서 글자가 사라진다(v11.17 교훈)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-탭대사-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/탭대사실물'
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
await new Promise((r) => srv.listen(4397, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 탭들 = [
  { 이름: '1-홈', 하단: '홈', 기대: '오늘 또 뭐 먹지?' },
  { 이름: '2-레시피', 하단: '레시피', 기대: '여기에 다 모았어.' },
  { 이름: '3-일기', 하단: '일기', 기대: '오늘도 한 끼 해냈다.' },
  { 이름: '4-장보기', 하단: '장보기', 기대: '또 두부 샀네.' },
]

// ⛔ 찍기 «전»에 화면을 덮은 게 있나 본다 (절대원칙 21 의 장치)
const 덮였나 = (page) => page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"],[class*="sheet"]'
  for (const y of [200, 420, 700]) {
    const c = document.elementFromPoint(195, y)?.closest(판정)
    if (c) return `y=${y} · ${c.className}`
  }
  return ''
})

// 🎨 WCAG 대비율 — 「안 읽히려나」는 눈이 아니라 숫자가 답한다
const 대비율 = (앞, 뒤) => {
  const L = (c) => { const [r, g, bb] = c.match(/\d+/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb }
  const [x, y] = [L(앞), L(뒤)].sort((p, q) => q - p)
  return +((x + 0.05) / (y + 0.05)).toFixed(2)
}

const 재기 = (page) => page.evaluate(() => {
  const 줄 = document.querySelector('.tab-talk')
  const 말 = document.querySelector('.tab-talk-b')
  const 꼬리 = document.querySelector('.tab-talk-t')
  const 바 = document.querySelector('.topbar')
  const 화면 = document.querySelector('.screen')
  if (!줄 || !말 || !꼬리 || !바) return { 오류: `말풍선(${!!말})·꼬리(${!!꼬리})·상단바(${!!바})` }

  // 🧍‍♀️ 상단바 캐릭터 = 왼쪽 첫 그림(꼬르곰·펭펭) 또는 아바타 단추(홈).
  //    ⛔ 「캐릭터는 무조건 글자 왼쪽」이 확정이라(2026-08-14 · check-charside) 늘 첫 번째다.
  // ⛔ 2026-08-30 — 홈은 상단바에  가 «없고»(아바타는 글자 배지 div) 그래서 옛 잣대가
  //    44px 손가락 «칸»을 쟀다. 칸은 아바타를 키워도 그대로라 **변화를 아예 못 본다**(규칙 18 ⓘ).
  //    ✅ 칸이 아니라 «칸 안의 그림»을 잰다.
  const 캐 = 바.querySelector('img') || 바.querySelector('button[aria-label="프로필"]')?.firstElementChild
  const cr = 캐?.getBoundingClientRect()
  const mr = 말.getBoundingClientRect()
  const tr = 꼬리.getBoundingClientRect()
  const br = 바.getBoundingClientRect()
  const cs = getComputedStyle(말)

  // 바탕색은 «투명이 아닌 조상»까지 올라가 찾는다(말풍선 뒤에 실제로 깔린 색)
  let 뒤 = null, e = 말.parentElement
  while (e && !뒤) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) 뒤 = c; e = e.parentElement }

  return {
    대사: 말.textContent.trim(),
    아래로갔나: +(mr.top - br.bottom).toFixed(1),      // 참고값 — 판정엔 안 쓴다(아래 「캐릭터아래」)
    // ⭐ 2026-08-30 — 진짜 잣대는 **「캐릭터 아래에 있고 안 겹치나」**다.
    //    ⛔ 옛 잣대(상단바 아래 0 이상)는 **상단바 하단이 캐릭터보다 아래라서**
    //       0 을 지키면 말풍선이 캐릭터에서 반드시 12px 넘게 떨어진다 → 꼬리가 안 닿는다.
    //       창업자가 *"넘 아래로 내려와있어"* 라고 한 게 바로 그 상태였다(2026-08-30).
    캐릭터아래: cr ? +(mr.top - cr.bottom).toFixed(1) : null,
    말풍선왼쪽: +mr.left.toFixed(1),
    말풍선키: +mr.height.toFixed(1),
    캐릭터중심: cr ? +(cr.left + cr.width / 2).toFixed(1) : null,
    꼬리중심: +(tr.left + tr.width / 2).toFixed(1),
    꼬리가위로: +(mr.top - tr.top).toFixed(1),          // 0 보다 커야 «위»로 솟은 것
    // ⛔⛔ 「화면 가로넘침」으로 재면 «안 된다» — 레시피 탭은 원래 칩 줄(`.hscroll`)이
    //    가로로 굴러가는 화면이라 **말풍선이 없어도 20px 넘친다**(실측으로 대조 확인).
    //    ✅ 물어야 할 건 「**말풍선이** 화면 밖으로 나갔나」다(규칙 18 ⓘ — 검사가 무엇을 보는지).
    말풍선넘침: 화면 ? +Math.max(0, mr.right - 화면.clientWidth).toFixed(1) : 0,
    글자색: cs.color, 말풍선색: cs.backgroundColor, 바탕색: 뒤,
    상단바키: +br.height.toFixed(1),
    줄높이: +줄.getBoundingClientRect().height.toFixed(1),
  }
})

let 실패 = 0
const 표 = []
// 🎨 테마는 «셋 다» 본다 — greige(기본) · dark · cream.
//    ⛔ 「크림」은 배경이 거의 흰색(#fdfbf7)이라 흰 말풍선(--surface #ffffff)과 색이 거의 같다.
//       ⓔ 를 고른 «이유»가 그림자인데, 그림자가 없으면 이 테마에서 말풍선이 통째로 사라진다.
//    📌 v11.17 교훈 = 「시안은 «한 테마»에서 찍은 것이다」. 셋을 안 보면 하나가 조용히 깨진다.
for (const 테마 of ['greige', 'dark', 'cream']) {
  for (const 탭 of 탭들) {
    // 🌙 다크·크림은 「색·그림자가 테마를 타나」를 보는 게 목적이라 «한 탭»(레시피)만 찍으면 충분하다
    if (테마 !== 'greige' && 탭.이름 !== '2-레시피') continue

    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
    await page.addInitScript(SEED_COACH_SEEN)
    await page.addInitScript((t) => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki-theme', t) } catch {} }, 테마)
    const 오류 = []
    page.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
    await page.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)

    if (탭.하단 !== '홈') {
      await page.evaluate((이름) => {
        const 칸 = [...document.querySelectorAll('.bottom-nav .nav-item')]
          .find((e) => ([...e.querySelectorAll('span')].pop()?.textContent || '').trim() === 이름)
        if (칸) 칸.click()
      }, 탭.하단)
      await page.waitForTimeout(600)
    }

    const 덮 = await 덮였나(page)
    const v = await 재기(page)
    const 이름 = `${테마 === 'greige' ? '' : 테마 === 'dark' ? '다크-' : '크림-'}${탭.이름}`

    if (v.오류) { console.log(`⛔ ${이름} — ${v.오류}`); 실패++; await page.close(); continue }

    const 어긋 = v.캐릭터중심 == null ? null : +(v.꼬리중심 - v.캐릭터중심).toFixed(1)
    const 대비 = v.바탕색 ? 대비율(v.글자색, v.말풍선색) : null
    const 판정 = []
    if (v.대사 !== 탭.기대) { 판정.push(`대사가 다르다(${v.대사})`); 실패++ }
    // ⛔ 옛 잣대 `v.아래로갔나 < 0` 은 **창업자 확정(2026-08-30 시안 B = −2px)을 죽인다** → 갈아탔다.
    //    ✅ 지키려는 것 = 「말풍선이 캐릭터 «아래»에 있고 캐릭터를 «안 가린다»」.
    //       0 미만이면 캐릭터를 파고들어 곰 발이 가려진다(시안 C·D 를 실물로 견줘서 접은 이유).
    if (v.캐릭터아래 != null && v.캐릭터아래 < 0) { 판정.push(`캐릭터를 가린다(${v.캐릭터아래})`); 실패++ }
    if (v.꼬리가위로 <= 0) { 판정.push('꼬리가 위로 안 솟았다'); 실패++ }
    if (어긋 != null && Math.abs(어긋) > 12) { 판정.push(`꼬리가 캐릭터를 안 가리킨다(${어긋}px)`); 실패++ }
    if (v.말풍선넘침 > 0) { 판정.push(`말풍선이 화면 밖으로 ${v.말풍선넘침}px`); 실패++ }
    if (대비 != null && 대비 < 3) { 판정.push(`대비 ${대비} (3 미만)`); 실패++ }
    if (오류.length) { 판정.push(`pageerror ${오류.length}`); 실패++ }

    표.push({ 이름, 대사: v.대사, 아래로: v.아래로갔나, 캐아래: v.캐릭터아래, 꼬리어긋: 어긋, 줄높이: v.줄높이, 대비, 덮: 덮 || '-', 판정: 판정.length ? '⛔ ' + 판정.join(' · ') : '✅' })

    await page.screenshot({ path: join(OUT, `${이름}.png`) })
    // 🔍 꼬리·캐릭터를 눈으로도 볼 수 있게 위쪽만 크게 (숫자만 믿지 않는다)
    await page.screenshot({ path: join(OUT, `${이름}-위.png`), clip: { x: 0, y: 0, width: 390, height: 190 } })
    await page.close()
  }
}

console.table(표)
console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
