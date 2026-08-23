// 🏠✅ 홈 「다음에 뭐 할까」 확정본(「라 — 라벨 알약」)을 **앱 소스에 넣은 뒤** 실물로 확인한다.
//
// ⭐⭐ 시안(`_판-홈카드-4판-0820.mjs`)은 브라우저에서 style·DOM 을 «덮어씌운» 것이라
//    「진짜 CSS·JSX 로 옮겼을 때도 같은가」는 별개 문제다. 이 판이 그걸 본다.
//
// 📸 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 실물을 열어서 본다.
// 🔢 그리고 «숫자로도» 잰다 — 눈으로는 「폭이 어긋난 것」을 놓친다(3판에서 실제로 그랬다).
//
// ⛔⛔ 이 판이 «반드시» 봐야 하는 것 넷 —
//    ⑴ **순서** 소식 → 다음에 뭐 할까 → 오늘 뭐 해먹지 (창업자 확정)
//    ⑵ **폭** 카드 오른쪽 끝이 소식·오늘과 «딱» 맞나 (3판에서 어긋났던 그 자리)
//    ⑶ **패드(2단)** 소식이 전폭이고 아래가 좌우로 갈리나 — 오른쪽이 휑하지 않나
//    ⑷ **갈래 둘** 「안해본것」(단추 없음) ／ 「한줄」(「한 줄 남기기」 단추 있음)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-홈카드확정-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드확정'
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
await new Promise((r) => srv.listen(4393, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// ⛔ 찍기 «전»에 화면 한가운데를 덮은 게 있나 본다 (절대원칙 21 의 장치)
const 덮였나 = (page, x) => page.evaluate((cx) => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"],[class*="sheet"]'
  for (const y of [200, 420, 700]) {
    const c = document.elementFromPoint(cx, y)?.closest(판정)
    if (c) return `y=${y} · ${c.className}`
  }
  return ''
}, x)

// 🎨 WCAG 대비율 — 「안 읽히려나」는 눈이 아니라 숫자가 답한다
const 대비 = (page) => page.evaluate(() => {
  const L = (c) => { const [r, g, b] = c.match(/\d+/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const 비 = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
  const 바탕 = (el) => { let e = el; while (e) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none') return getComputedStyle(document.querySelector('.today-card')).backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(239,233,220)' : 'rgb(239,233,220)'; if (s.backgroundColor && !/rgba\(0, 0, 0, 0\)/.test(s.backgroundColor)) return s.backgroundColor; e = e.parentElement } return 'rgb(255,255,255)' }
  const t = document.querySelector('.next-title'); const l = document.querySelector('.next-label')
  if (!t || !l) return null
  return { 제목: 비(getComputedStyle(t).color, 바탕(t)), 라벨: 비(getComputedStyle(l).color, getComputedStyle(l).backgroundColor) }
})

// 📔 갈래 「한줄」을 띄우려면 «어제~사흘 전에 만들고 한 줄을 안 쓴» 일기가 있어야 한다
const 어제일기 = async (page, base) => {
  const id = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || [])[3] || (st.recipes || [])[0]
    if (!r) return null
    const 어제 = new Date(); 어제.setDate(어제.getDate() - 1); 어제.setHours(19, 20, 0, 0)
    st.diary = [{ id: 'shot1', recipeId: r.id, title: r.title, at: 어제.getTime(), rating: 0, note: '', photo: null }, ...(st.diary || [])]
    st.recipes = st.recipes.map((x) => (x.id === r.id ? { ...x, cooked: (x.cooked || 0) + 1, cookedAt: 어제.getTime() } : x))
    localStorage.setItem('hankki:v1', JSON.stringify(st))
    return r.title
  })
  // ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(check-mistakes ⑧ 「옛 함정 사전」). 새 탭으로 연다.
  return id
}

const 판들 = [
  { 이름: 'phone-안해본것', w: 390, h: 844, 한줄: false },
  { 이름: 'phone-한줄', w: 390, h: 844, 한줄: true },
  { 이름: 'pad-안해본것', w: 1024, h: 1366, 한줄: false },
]

for (const s of 판들) {
  const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.w > 700 ? 2 : 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  let page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)

  if (s.한줄) {
    await 어제일기(page)
    await page.close()
    page = await ctx.newPage()
    page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
    await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(800)
  }

  const 덮개 = await 덮였나(page, Math.round(s.w / 2))
  if (덮개) { console.log(`  ⛔ ${s.이름} — 덮개: ${덮개}`); await ctx.close(); continue }

  const 잰값 = await page.evaluate(() => {
    const box = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null }
    const c = box('.next-card'), n = box('.news-card'), t = box('.today-card')
    const 보임 = [...document.querySelectorAll('.next-card')].filter((e) => e.getBoundingClientRect().width > 10).length
    const r = (x) => (x == null ? null : Math.round(x))
    return {
      카드높이: c ? r(c.height) : null,
      소식높이: n ? r(n.height) : null,
      오늘높이: t ? r(t.height) : null,
      보이는카드: 보임,
      // ⑵ 폭 — 오른쪽 끝이 «딱» 맞나
      카드오른쪽: c ? r(c.right) : null, 소식오른쪽: n ? r(n.right) : null, 오늘오른쪽: t ? r(t.right) : null,
      카드왼쪽: c ? r(c.left) : null, 소식왼쪽: n ? r(n.left) : null,
      // ⑴ 순서 — y 로 판정(패드는 카드·오늘이 같은 줄이라 «소식이 위»만 본다)
      소식y: n ? r(n.top) : null, 카드y: c ? r(c.top) : null, 오늘y: t ? r(t.top) : null,
      펭펭: !!document.querySelector('.next-card .next-peng'),
      꼬르곰남았나: document.querySelectorAll('.next-card .next-gom').length,
      단추: !!document.querySelector('.next-cta'),
      이유보임: [...document.querySelectorAll('.next-reason')].some((e) => e.getBoundingClientRect().height > 0),
      제목: document.querySelector('.next-title')?.textContent || '',
      라벨: document.querySelector('.next-label')?.textContent || '',
      // ⑶ 패드 2단인가
      가로나란히: !!(c && t) && Math.abs(c.top - t.top) < 30 && Math.abs(c.left - t.left) > 50,
      가로넘침: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  })
  const cr = await 대비(page)

  await page.screenshot({ path: join(OUT, `${s.이름}-전체.png`) })
  await page.screenshot({ path: join(OUT, `${s.이름}-확대.png`), clip: { x: 0, y: 90, width: Math.min(s.w, 700), height: 300 } })

  const 폭맞나 = 잰값.카드오른쪽 != null && 잰값.소식오른쪽 != null
    && (s.w > 700 ? true : Math.abs(잰값.카드오른쪽 - 잰값.소식오른쪽) <= 1 && Math.abs(잰값.카드왼쪽 - 잰값.소식왼쪽) <= 1)
  const 순서맞나 = 잰값.소식y != null && 잰값.카드y != null && 잰값.소식y < 잰값.카드y
    && (s.w > 700 ? true : 잰값.카드y < 잰값.오늘y)

  console.log(`\n📸 ${s.이름}`)
  console.log(`   카드 ${잰값.카드높이}px · 보이는 카드 ${잰값.보이는카드}장 · 펭펭 ${잰값.펭펭 ? '○' : '✗'} · 꼬르곰 남음 ${잰값.꼬르곰남았나}`)
  console.log(`   순서 ${순서맞나 ? '○' : '✗'} (소식 ${잰값.소식y} → 카드 ${잰값.카드y} → 오늘 ${잰값.오늘y})`)
  console.log(`   폭   ${폭맞나 ? '○' : '✗'} (카드 ${잰값.카드왼쪽}~${잰값.카드오른쪽} · 소식 ${잰값.소식왼쪽}~${잰값.소식오른쪽} · 오늘 …${잰값.오늘오른쪽})`)
  console.log(`   글자 「${잰값.라벨}」 「${잰값.제목}」 · 이유줄 ${잰값.이유보임 ? '⛔보임' : '접힘'} · 단추 ${잰값.단추 ? '있음' : '없음'}`)
  if (cr) console.log(`   대비 제목 ${cr.제목} · 라벨 ${cr.라벨} (기준 4.5)`)
  if (s.w > 700) console.log(`   패드 2단 ${잰값.가로나란히 ? '○ 좌우로 갈림' : '✗ 세로로 쌓임'}`)
  if (잰값.가로넘침) console.log('   ⛔ 가로 넘침!')

  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
