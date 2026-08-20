// 🏠🎨 홈 「다음에 뭐 할까」 카드 — 순서·색·높이 시안 (2026-08-20)
//
// 📮 창업자 = *"홈에 아직안해봤어요 색이 너무 직하고 꼬르곰이 한끼소식도 꼬르곰 얘도 꼬르곰이라 좀 정신이없어.
//    높이도 조금 줄였으면 좋겠어."* · *"한끼소식이 제일 위로 그 아래 아직안해봤어요가 오는게 좋을 것 같아.
//    색배치는 어떻게할지네가 고민해봐"*
//
// ⭐ 왜 «앱 소스를 안 고치고» 찍나 = 규칙 25 훅이 앱 소스를 막고 있다(창업자 확인 전).
//    ✅ 그래서 **브라우저에서 style 만 덮어씌워** 시안을 만든다 — 소스는 한 글자도 안 건드린다.
//    ⛔ 그러니 이건 «시안»이다. 고르면 그때 진짜 CSS 로 옮긴다.
//
// 🔢 지금 값(실측) = `.next-card` 배경 `var(--brown)` = **#5878a0**(더스티 블루) ＋ 흰 글자
//    「한끼 소식」 = `var(--tease)` ＋ 진한 글자 = **옅은 채움**
//    → 순서를 바꾸면 «옅은 채움» 바로 아래에 «진한 채움»이 온다. 그래서 진하기를 낮춘다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈카드-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드'
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
await new Promise((r) => srv.listen(4391, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 🎨 시안 — 전부 «순서 바꿈 ＋ 꼬르곰 뺌 ＋ 높이 줄임» 이 기본이다
//    🐧 [창업자 2026-08-20] *"펭펭을 작게 넣거나 이모지를 넣어도 좋아. 밋밋하면.."*
//       ⭐ 꼬르곰이 「한끼 소식」에 있으니 이 카드엔 **펭펭** — 둘이 안 겹친다(창업자가 짚은 「정신없다」의 답)
//       ⛔ 유니코드 이모지 금지 — 우리 스티커만(CLAUDE.md)
const A색 = `
      .next-card{background:color-mix(in srgb,var(--brown) 11%,var(--surface));
        border-left:4px solid var(--brown);padding:10px 12px 11px}
      .next-card.sub{background:color-mix(in srgb,var(--brown) 6%,var(--surface))}
      .next-label{color:var(--brown);opacity:.9}
      .next-title{color:var(--text);font-size:16px}
      .next-reason{color:var(--text);font-size:13px;margin-top:4px}
      .next-eg{color:var(--text-sub);opacity:1}
      .next-cta{background:var(--brown);color:#fff;margin-top:9px;padding:9px 12px}
      .next-peng{flex:0 0 auto;display:block;width:24px;height:auto;object-fit:contain;margin:-7px 0}`
const 시안 = [
  { 이름: 'A1-펭펭없음', 설명: '옅은 파랑 · 캐릭터 없음', css: A색, 펭: null },
  { 이름: 'A2-펭펭찾기', 설명: '옅은 파랑 ＋ 펭펭(두리번 찾는 컷)', css: A색, 펭: 'pn_search' },
  { 이름: 'A3-펭펭냠', 설명: '옅은 파랑 ＋ 펭펭(냠냠 컷)', css: A색, 펭: 'peng_nyam1' },
  { 이름: 'B-중간파랑', 설명: '진하기만 낮춘 파랑 채움 (흰 글자)', 펭: null, css: `
      .next-card{background:color-mix(in srgb,var(--brown) 62%,var(--surface));padding:10px 12px 11px}
      .next-card.sub{background:color-mix(in srgb,var(--brown) 46%,var(--surface))}
      .next-title{font-size:16px}
      .next-reason{margin-top:4px;font-size:13px}
      .next-cta{margin-top:9px;padding:9px 12px}` },
]

// ⛔ 찍기 «전»에 화면 한가운데를 덮은 게 있나 본다 (절대원칙 21 의 장치)
const 덮였나 = (page) => page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"],[class*="sheet"]'
  for (const y of [200, 420, 700]) {
    const el = document.elementFromPoint(195, y)
    const 덮개 = el?.closest(판정)
    if (덮개) return `y=${y} · ${덮개.className}`
  }
  return ''
})

const 결과 = []
for (const s of 시안) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  if (s.css) {
    // ① 순서 = 「한끼 소식」 묶음을 「다음에 뭐 할까」 «위»로 (창업자 확정)
    // ② 곰 빼기 = 홈의 우리 애 자리는 「한끼 소식」 하나 (CLAUDE.md 에 이미 있던 규칙)
    // 🐧 펭펭은 «base64 로» 넘긴다 — 빌드된 dist 는 파일 이름에 해시가 붙어 경로를 못 맞춘다
    const 펭URL = s.펭
      ? 'data:image/png;base64,' + readFileSync(join(ROOT, `src/assets/ui/wave/${s.펭}.png`)).toString('base64')
      : null
    await page.evaluate(({ css, 펭 }) => {
      const 줄 = document.querySelector('.next-row')
      const 짝 = document.querySelector('.home-pair')
      if (줄 && 짝 && 짝.parentNode) 짝.parentNode.insertBefore(짝, 줄)
      document.querySelectorAll('.next-gom').forEach((g) => g.remove())
      if (펭) {
        document.querySelectorAll('.next-head').forEach((h) => {
          const im = document.createElement('img')
          im.src = 펭; im.alt = ''; im.className = 'next-peng hk-m-tongtong'
          h.insertBefore(im, h.firstChild)
        })
      }
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st)
    }, { css: s.css, 펭: 펭URL })
    await page.waitForTimeout(500)
  }

  const 덮개 = await 덮였나(page)
  if (덮개) { console.log(`  ⛔ ${s.이름} — 덮개가 있다: ${덮개}`); await page.close(); continue }

  // 🔢 카드 높이를 «재서» 같이 찍는다 — 「줄었나」는 눈이 아니라 숫자가 답한다
  const 잰값 = await page.evaluate(() => {
    const c = document.querySelector('.next-card')
    const n = document.querySelector('.news-card')
    const 위 = document.querySelector('.home-pair')
    const 아래 = document.querySelector('.next-row')
    return {
      카드높이: c ? Math.round(c.getBoundingClientRect().height) : null,
      소식이위: !!(위 && 아래) && 위.getBoundingClientRect().top < 아래.getBoundingClientRect().top,
      곰개수: document.querySelectorAll('.next-gom').length,
    }
  })
  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  결과.push({ ...s, ...잰값 })
  console.log(`  ✅ ${s.이름}  높이 ${잰값.카드높이}px · 소식이 위 ${잰값.소식이위 ? '○' : '✗'} · 카드 속 곰 ${잰값.곰개수}`)
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📸 ${결과.length}장 → ${OUT}`)
for (const r of 결과) console.log(`   · ${r.이름} — ${r.설명}`)
