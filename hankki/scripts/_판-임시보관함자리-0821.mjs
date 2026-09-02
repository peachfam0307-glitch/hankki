// 🗃 [판정 대기 · 2026-08-21] 「임시보관함」을 홈 어디에 둘까 — 갈래 넷을 실물로 찍는다
//
// 📮 창업자 = *"**임시보관함은 저기에 있으면 좀 지저분해보영..**"*
//
// ⭐⭐ **먼저 짚을 것 — 이 자리는 «내가» 만들었다.**
//    2026-08-21 창업자 제보 *"INBOX 나도 어딨는지 모르는데"* 를 풀려고
//    **0개일 때도 늘 보이게** 바꿨다(전엔 `unsortedN > 0` 이라 정리를 끝내면 사라졌다).
//    ⛔ 그 대가가 지금 이것 — **할 일이 0개인데도 홈 맨 위에 줄이 하나 는다.**
//    📌 「못 찾는다」를 풀었더니 「지저분하다」가 생겼다. **둘 다 참이라 «자리»로 푼다.**
//
// ⛔ 그래서 갈래에 「도로 숨기기」는 «안» 넣는다 — 그건 창업자가 제보한 문제로 되돌아가는 것이다.
//
// 🔢 지금 자리 = 검색바 «바로 아래» · 카드 한 줄을 통째로 먹는다(홈에서 두 번째로 눈에 걸리는 자리)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-임시보관함자리-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/보관함자리'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4434, r))

// ⭐ 갈래는 «진짜 홈 화면»의 DOM 을 옮겨서 만든다 — 흉내로 그리지 않는다(절대원칙 30)
const 갈래 = [
  { key: 'ㄱ', 이름: '지금 그대로', 설명: '검색바 바로 아래 · 카드 한 줄', 손보기: null },
  {
    key: 'ㄴ', 이름: '검색바 «안»에 아이콘만', 설명: '⭐줄을 하나도 안 먹는다 — 0개일 땐 조용하고 입구는 남는다',
    손보기: () => {
      const 보관함 = [...document.querySelectorAll('button')].find((b) => /임시보관함|정리 안 한 레시피/.test(b.innerText || ''))
      const 검색 = document.querySelector('.searchbar')
      if (!보관함 || !검색) return '못 찾음'
      const 아이콘 = 보관함.querySelector('svg,img')
      보관함.remove()
      const 칸 = document.createElement('span')
      칸.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:999px;background:var(--cream);flex:0 0 auto'
      if (아이콘) 칸.appendChild(아이콘)
      검색.appendChild(칸)
      return '됨'
    },
  },
  {
    key: 'ㄷ', 이름: '홈 «맨 아래»로', 설명: '조용한 서랍처럼 — 찾으면 있고 먼저 안 나선다',
    손보기: () => {
      const 보관함 = [...document.querySelectorAll('button')].find((b) => /임시보관함|정리 안 한 레시피/.test(b.innerText || ''))
      const 판 = document.querySelector('.pad')
      if (!보관함 || !판) return '못 찾음'
      판.appendChild(보관함)
      보관함.style.marginTop = '18px'
      보관함.style.marginBottom = '10px'
      return '됨'
    },
  },
  {
    key: 'ㄹ', 이름: '「한끼 소식」 아래로', 설명: '알림 성격끼리 모은다 — 검색 바로 밑 «첫 자리»는 비운다',
    손보기: () => {
      const 보관함 = [...document.querySelectorAll('button')].find((b) => /임시보관함|정리 안 한 레시피/.test(b.innerText || ''))
      const 소식 = document.querySelector('.news-card') || [...document.querySelectorAll('*')].find((e) => /한끼 소식/.test(e.innerText || '') && e.className)
      if (!보관함 || !소식) return '못 찾음'
      소식.after(보관함)
      return '됨'
    },
  },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

console.log('\n🗃 임시보관함 자리 — 갈래 넷 (390×844)\n')
for (const g of 갈래) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4434/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  const 결과 = g.손보기 ? await p.evaluate(g.손보기) : '그대로'
  await p.waitForTimeout(250)
  // 🔢 「위쪽 알짜가 몇 px 위로 올라왔나」 — 지저분함은 «자리»가 만든다
  const 잰값 = await p.evaluate(() => {
    const 찾기 = (말) => [...document.querySelectorAll('*')].find((e) => (e.innerText || '').trim().startsWith(말))
    const 주간 = document.querySelector('.weekly-box')
    const 소식 = 찾기('한끼 소식')
    return {
      소식y: 소식 ? Math.round(소식.getBoundingClientRect().top) : null,
      주간y: 주간 ? Math.round(주간.getBoundingClientRect().top) : null,
    }
  })
  const 파일 = join(OUT, `${g.key}-${g.이름.replace(/[«»\s·]/g, '')}.png`)
  await p.screenshot({ path: 파일 })
  console.log(`  ${g.key} ${g.이름.padEnd(20, ' ')} ${결과.padEnd(4, ' ')} · 「한끼 소식」 y=${잰값.소식y} · 주간 카드 y=${잰값.주간y}`)
  console.log(`     ${g.설명}`)
  console.log(`     ${파일}`)
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n⭐ ⛔찍고 끝내지 말 것 — 창업자에게 보내기 «전»에 네 장을 «열어서» 본다(절대원칙 21).')
console.log('⛔ 「도로 숨기기」는 갈래에 없다 — 그건 창업자가 제보한 「못 찾겠다」로 되돌아가는 것이다.')
