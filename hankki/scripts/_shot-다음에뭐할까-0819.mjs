// 📸 「다음에 뭐 할까」 시안 둘 × 갈래 셋 — 창업자가 «눈으로» 고르게 (2026-08-19)
//
// 📮 창업자 = *"a로 가자 대신 눈에 잘띄게 만들어줘 홈에 비슷한 안내가 많아서 잘 안보고 넘길가능성이 높아."*
//
// ⭐ 왜 상태를 «심어» 찍나 = 갓 깐 앱은 `cooked` 가 전부 0 이라 **「안 해본 것」 갈래만 뜬다.**
//    「한 줄 안 쓴 것」·「지난번 그거」는 요리 기록이 쌓여야 나오는데, 그걸 손으로 만들면
//    한 판 찍는 데 몇 분씩 걸린다(규칙 8 — 반복은 코드가 한다).
//
// ⛔ `page.reload()` ＋ `addInitScript` 조합을 쓰지 않는다 — reload 때 시드가 심은 값을 덮는다
//    (`check-mistakes` ⑧ 「옛 함정 사전」 첫 항목). **같은 컨텍스트에서 새 탭**을 연다.
//
// ⛔ 앱 구조를 «짐작»해서 JSON 을 만들지 않는다 — 한 번 띄워 «진짜 저장값»을 읽고 그걸 고친다.
//    (모양이 바뀌어도 이 판은 안 낡는다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4392, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 갈래 셋을 만드는 법 — 「진짜 저장값」을 받아서 고쳐 돌려준다
// ⛔ 이 함수들은 «글자로 바뀌어 브라우저 안에서» 돈다 → 바깥 변수를 쓰면 안 된다(안에서 정의할 것)
const 갈래들 = {
  한줄: (s, now) => {
    const 하루 = 24 * 60 * 60 * 1000
    // 어제 만들었고 한 줄은 안 썼다
    const r = s.recipes[0]
    r.cooked = 1; r.cookedAt = now - 하루
    s.diary = [{ id: 'd1', recipeId: r.id, title: r.title, source: r.source, at: now - 하루, rating: 0, note: '', photo: null }]
    return s
  },
  안해본것: (s) => {
    // 아무것도 안 만들었다 = 갓 깐 앱 그대로
    s.recipes.forEach((r) => { r.cooked = 0; delete r.cookedAt })
    s.diary = []
    return s
  },
  지난번: (s, now) => {
    const 하루 = 24 * 60 * 60 * 1000
    // 만들었고 한 줄도 썼다 → 남는 건 「또 해볼까요」뿐
    s.recipes.forEach((r, i) => { r.cooked = i < 3 ? 2 : 1; r.cookedAt = now - (i + 1) * 하루 })
    s.diary = s.recipes.slice(0, 3).map((r, i) => ({
      id: 'd' + i, recipeId: r.id, title: r.title, source: r.source,
      at: now - (i + 1) * 하루, rating: 5, note: '다음엔 간장 반만', photo: null,
    }))
    return s
  },
}

const 결과 = []
for (const 시안 of ['A', 'B']) {
  for (const [갈래, 고치기] of Object.entries(갈래들)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1500 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
    const p = await ctx.newPage()
    await p.addInitScript(SEED_COACH_SEEN)
    await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e)))
    await p.goto('http://127.0.0.1:4392/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(700)

    // ⭐ 여기서 «진짜 저장값»을 읽어 고친다 — 구조를 짐작하지 않는다
    const 잰것 = await p.evaluate(({ 시안, 갈래, src }) => {
      const raw = localStorage.getItem('hankki:v1')
      if (!raw) return { 실패: '저장값이 아직 없다' }
      const s = JSON.parse(raw)
      // eslint-disable-next-line no-new-func
      const 고치기 = new Function('return ' + src)()
      const 새것 = 고치기(s, Date.now())
      localStorage.setItem('hankki:v1', JSON.stringify(새것))
      localStorage.setItem('hankki:시안-다음에', 시안)
      return { 레시피수: (새것.recipes || []).length, 일기수: (새것.diary || []).length, 갈래 }
    }, { 시안, 갈래, src: 고치기.toString() })

    // ⛔ reload 가 아니라 «새 탭» — 같은 컨텍스트라 localStorage 는 그대로 살아 있다
    const p2 = await ctx.newPage()
    await p2.addInitScript(SEED_COACH_SEEN)
    await p2.goto('http://127.0.0.1:4392/', { waitUntil: 'networkidle' })
    await p2.waitForTimeout(900)

    const 보임 = await p2.evaluate(() => {
      const 카드 = document.querySelector('.next-card')
      const 오늘 = document.querySelector('.today-card')
      const 읽기 = (el, sel) => (el && el.querySelector(sel) ? el.querySelector(sel).textContent.trim() : '')
      return {
        새카드: 카드 ? [읽기(카드, '.next-label'), 읽기(카드, '.next-title'), 읽기(카드, '.next-reason'), 읽기(카드, '.next-cta')].filter(Boolean).join(' / ') : '(없음)',
        오늘카드: 오늘 ? [읽기(오늘, '.today-label'), 읽기(오늘, '.today-title'), 읽기(오늘, '.today-reason')].filter(Boolean).join(' / ') : '(없음)',
        // 📐 카드가 첫 화면(844px) 안에 들어오나 — 「눈에 띄게」의 절반은 «자리»다
        새카드_y: 카드 ? Math.round(카드.getBoundingClientRect().top) : -1,
      }
    })

    const 낼곳 = `${OUT}/다음에-${시안}-${갈래}.png`
    await p2.screenshot({ path: 낼곳, fullPage: true })
    결과.push({ 시안, 갈래, ...잰것, ...보임, 오류: 오류.length, 낼곳 })
    await ctx.close()
  }
}

await b.close(); srv.close()

console.log('\n📸 「다음에 뭐 할까」 시안 둘 × 갈래 셋\n')
for (const r of 결과) {
  console.log(`[${r.시안 === 'A' ? '㉮ 있는 카드 다시 쓰기' : '㉯ 눈에 띄는 새 카드'}] ${r.갈래}`)
  console.log(`   새 카드 : ${r.새카드}${r.새카드_y >= 0 ? `  (y=${r.새카드_y}px)` : ''}`)
  console.log(`   오늘 카드: ${r.오늘카드}`)
  if (r.오류) console.log(`   ⛔ pageerror ${r.오류}건`)
  console.log(`   → ${r.낼곳}\n`)
}
const 나쁨 = 결과.filter((r) => r.오류 || (r.시안 === 'B' && r.새카드 === '(없음)') || (r.시안 === 'A' && r.오늘카드 === '(없음)'))
console.log(나쁨.length ? `⛔ ${나쁨.length}칸 이상 — 고치고 다시` : '✅ 여섯 판 다 그려졌다 — 이제 «눈으로» 본다(절대원칙 21)')
process.exit(나쁨.length ? 1 : 0)
