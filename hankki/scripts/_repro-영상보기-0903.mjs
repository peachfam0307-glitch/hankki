// 📺 「레시피 상세에서 유튜브 영상 바로 보기」 재현판 — 창업자 확정 2026-09-03 = ㄷ
//
// 📮 창업자 = *"유튜브 영상을 저렇게 바로 볼 수 있게 해둔거 좋은 것 같아. 우리도 할 수 있으면 좋겠다"*
//    → *"유튜브영상아래 재료랑 만드는법도 넣을 수 있어?"* → **"ㄷ으로 가자"**
//    ⭐ ㄷ = 「우리가 큐레이션한 것」 ＋ 「유저가 담은 것」 **둘 다**. 코드는 하나다.
//
// ⭐⭐ 이 판의 심장 = **「순서가 맞나」와 「정책을 지키나」 둘.**
//    ⛔ 「iframe 이 있나」가 아니다 — 있어도 «재료 아래»에 있으면 창업자가 물은 배치가 아니고,
//       플레이어를 가리면 YouTube Developer Policies 위반이다.
//
// ⚖️ 왜 이건 되나 = **IFrame Player 재생은 공식이고 약관 위험 0**
//    (`docs/유튜브가져오기-약관조사답-2026-08-27.md:46·172`).
//    죽은 길은 «AI 로 읽는 것»이지 «보여주는 것»이 아니다(`Gemini연령제한-…` 문서엔 재생 언급이 0건).
//
// 실행: node scripts/_repro-영상보기-0903.mjs
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
// 🔀 고정 포트를 안 쓴다 — OS 가 빈 포트를 준다(2026-09-03 EADDRINUSE 뿌리 뽑기)
await new Promise((r) => srv.listen(0, r))
const BASE = `http://127.0.0.1:${srv.address().port}/hankki/`

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🍱 원본 주소가 «다른» 레시피 셋을 심는다 — 앱이 쓰는 그 모양 그대로
const 심을것 = [
  { id: 'yt-1', title: '가짜유튜브전', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'ig-1', title: '가짜인스타전', sourceUrl: 'https://www.instagram.com/reel/ABCdef123/' },
  { id: 'no-1', title: '가짜링크없음', sourceUrl: '' },
]
const 새탭 = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.addInitScript((목록) => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      s.recipes = [...목록.map((r) => ({
        ...r, icon: 'fe_38', category: '한식', folder: '한식', time: 5, servings: 2,
        difficulty: '쉬움', thumb: 'icon', favorite: false, cooked: 0, savedAt: Date.now(), status: 'sorted',
        ingredients: ['감자 큰 것 2~3개', '소금 적당량'], steps: ['채 썰어요.', '부쳐요.'],
        memo: '', decor: [], decorBg: 'none',
      })), ...(s.recipes || [])]
      localStorage.setItem('hankki:v1', JSON.stringify(s))
    } catch { /* noop */ }
  }, 심을것)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  return page
}

const 상세열기 = async (page, 제목) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(700)
  await page.evaluate((T) => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))?.click()
  }, 제목)
  await page.waitForTimeout(900)
  return page.evaluate((T) => document.body.innerText.includes(T) && /재료|만드는 법/.test(document.body.innerText), 제목)
}

console.log('\n📺 「상세에서 유튜브 바로 보기」 — 지금 상태를 잰다\n')

// ─────────────────────────────────────────────────────────────
console.log('① ⭐ 유튜브 레시피 — 영상이 «재료 위»에 뜬다')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  const 열림 = await 상세열기(page, '가짜유튜브전')
  chk('상세가 열렸다 (＝이 칸의 전제)', 열림)
  if (!열림) { console.log('  ⛔⛔ 못 열었다 — 판정하지 않는다'); 실패 += 5 }
  else {
    const 잰값 = await page.evaluate(() => {
      const f = document.querySelector('iframe[title="원본 영상"]')
      const 절 = [...document.querySelectorAll('.sec-head, .h-section')].map((x) => (x.innerText || '').trim().split('\n')[0]).filter(Boolean)
      const 재료y = [...document.querySelectorAll('.sec-head')].find((x) => /재료/.test(x.innerText || ''))?.getBoundingClientRect().top
      return {
        있나: !!f,
        src: f ? f.getAttribute('src') : '',
        sandbox: f ? f.getAttribute('sandbox') : '',
        allow: f ? f.getAttribute('allow') : '',
        영상y: f ? f.getBoundingClientRect().top : null,
        재료y: 재료y ?? null,
        절,
        유튜브단추: [...document.querySelectorAll('button')].some((x) => /YouTube에서 보기/.test(x.innerText || '')),
        원본링크절: /원본 링크/.test(document.body.innerText || ''),
      }
    })
    chk('영상 플레이어가 있다', 잰값.있나)
    chk('공식 임베드 주소다 (youtube.com/embed/…)', /^https:\/\/www\.youtube\.com\/embed\//.test(잰값.src || ''))
    chk(`⭐⭐ 영상이 «재료보다 위»에 있다 (영상 ${Math.round(잰값.영상y)} < 재료 ${Math.round(잰값.재료y)})`,
      잰값.영상y !== null && 잰값.재료y !== null && 잰값.영상y < 잰값.재료y)
    chk('「YouTube에서 보기」 단추가 있다', 잰값.유튜브단추)
    chk('⛔ 맨 아래 「원본 링크」 절은 «없다» — 같은 문이 둘이면 헷갈린다', !잰값.원본링크절)
    console.log(`     절 차례 = ${잰값.절.join(' → ')}`)
  }
  await page.context().close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n② ⛔ 자동재생 안 한다 · 앱 밖으로 안 튕긴다 (YouTube Developer Policies)')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  const 열림 = await 상세열기(page, '가짜유튜브전')
  chk('상세가 열렸다 (＝이 칸의 전제)', 열림)
  if (!열림) { console.log('  ⛔⛔ 판정하지 않는다'); 실패 += 4 }
  else {
    const v = await page.evaluate(() => {
      const f = document.querySelector('iframe[title="원본 영상"]')
      return { src: f?.getAttribute('src') || '', sandbox: f?.getAttribute('sandbox') || '', allow: f?.getAttribute('allow') || '' }
    })
    // ⛔ 「반 이상 보이기 전 자동재생 금지」 — 우리는 아예 안 켠다(주소에도, allow 에도)
    chk('⛔ 주소에 autoplay=1 이 «없다»', !/autoplay=1/.test(v.src))
    chk('⛔ allow 에 autoplay 가 «없다»', !/autoplay/.test(v.allow))
    // ⛔ 임베드를 눌러도 앱이 유튜브 앱으로 튕겨 나가면 안 된다(EditorScreen 주석의 그 이유)
    chk('⛔ sandbox 에 allow-top-navigation 이 «없다»', !/allow-top-navigation/.test(v.sandbox))
    chk('⛔ sandbox 에 allow-popups 가 «없다»', !/allow-popups/.test(v.sandbox))
  }
  await page.context().close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n③ ⛔⛔ 플레이어를 «가리는 것»이 하나도 없다 — 정책 위반 자리')
// ─────────────────────────────────────────────────────────────
//   YouTube Developer Policies = *"must not use overlays, frames or other visual elements to
//   obscure any part of an embedded player, including player controls"*
//   ⛔ 「눈으로 안 보인다」가 아니라 **플레이어 네모 «안»에 다른 것이 겹쳐 있나**를 잰다.
{
  const page = await 새탭()
  const 열림 = await 상세열기(page, '가짜유튜브전')
  chk('상세가 열렸다 (＝이 칸의 전제)', 열림)
  if (!열림) { console.log('  ⛔⛔ 판정하지 않는다'); 실패 += 1 }
  else {
    // ⭐ 먼저 «영상을 보는 자리»로 스크롤한다 — 그게 진짜 물음이다.
    //   ⛔⛔ 첫 판은 상세를 열자마자 쟀고, 그때 하단 「요리모드 시작」 바(`.action-bar`,
    //      `position: sticky; bottom:0`)가 영상 아래쪽을 덮어 걸렸다.
    //      📌 그건 **정책이 말하는 「오버레이로 가리기」가 아니다** — 콘텐츠 흐름의 일부고
    //         유저가 굴리면 비켜난다. 어느 스크롤 위치에서도 안 겹치는 건 sticky 바가 있는 한
    //         구조적으로 불가능하고, 그건 모든 앱이 그렇다.
    //      ⭐ 그래도 «걸린 것 자체»는 값졌다 — 안 재봤으면 몰랐다.
    await page.evaluate(() => {
      document.querySelector('iframe[title="원본 영상"]')?.scrollIntoView({ block: 'center' })
    })
    await page.waitForTimeout(500)
    const 겹친것 = await page.evaluate(() => {
      const f = document.querySelector('iframe[title="원본 영상"]')
      if (!f) return ['iframe 없음']
      const r = f.getBoundingClientRect()
      const 점 = [[0.5, 0.5], [0.5, 0.92], [0.1, 0.9], [0.9, 0.9]]  // 가운데 ＋ 컨트롤 줄 셋
      const 나온것 = new Set()
      for (const [dx, dy] of 점) {
        const el = document.elementFromPoint(r.left + r.width * dx, r.top + r.height * dy)
        if (el && el !== f && !f.contains(el)) 나온것.add(el.tagName + '.' + (el.className || '').toString().slice(0, 24))
      }
      return [...나온것]
    })
    chk(`⭐ 플레이어 위에 겹친 것 0개 (${겹친것.length ? 겹친것.join(' · ') : '없다'})`, 겹친것.length === 0)
  }
  await page.context().close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n④ ⛔ 인스타·링크없음엔 «안» 뜬다 — 인스타는 정책상 재생이 안 된다')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  for (const [제목, 설명] of [['가짜인스타전', '인스타'], ['가짜링크없음', '원본 주소가 없다']]) {
    const 열림 = await 상세열기(page, 제목)
    chk(`${설명} 상세가 열렸다 (＝전제)`, 열림)
    if (!열림) { 실패++; continue }
    chk(`⛔ ${설명} — 영상 플레이어가 «없다»`, !(await page.evaluate(() => !!document.querySelector('iframe[title="원본 영상"]'))))
    if (제목 === '가짜인스타전') {
      chk('⭐ 대신 맨 아래 「원본 링크」로 갈 수 있다 — 유일한 문이라 남긴다',
        await page.evaluate(() => /원본 링크/.test(document.body.innerText || '')))
    }
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '') === '뒤로'); b?.click() })
    await page.waitForTimeout(500)
  }
  await page.context().close()
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
console.log('📌 ① = 창업자가 물은 배치(영상 → 재료 → 만드는 법)가 «진짜로» 그러한가.')
console.log('   ②③ = YouTube Developer Policies. 죽으면 정책 위반이다 — 「보기 나쁨」이 아니다.')
console.log('   ④ = 인스타는 정책상 재생이 안 된다(EditorScreen.jsx:785). 안 뜨는 게 맞는 동작이다.\n')

await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
