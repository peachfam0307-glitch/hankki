// 📸📸 [2026-09-10] **첫 사람이 «진짜 처음» 켜서 가져오기까지 가는 길** — 아무것도 안 심고 찍는다.
//
// 📮 창업자 = *"내가 그래서 너한테 가져오기를 그렇게 중요하다했는데 땜빵하다가 이렇게 되어버렸네"*
//    ＋ *"이렇게 하면 내가 아무리 광고하고 시간갈아서 인스타 넣어도 오면 뭐해 불편하니까 다 떠나지"*
//
// 🔢 잰 것 (2026-09-10 아침 · 창업자가 준 캡처)
//    · GA4 「페이지 및 화면」 = import 조회 19 · 활성 9명 || editor 조회 6 · 활성 4명
//      → 가져오기에 온 9명 중 편집까지 간 건 4명
//    ⚠️ n=9 다. 이 판은 «숫자를 늘리려고» 도는 게 아니라 «눈으로 보려고» 도는 것이다.
//
// ⛔⛔ **왜 새 판이 필요했나** = 우리 캡처판은 전부 `hankki:onboarded=1` 과 `SEED_COACH_SEEN` 을
//    «심고» 찍었다(`_shot-가져오기-0828.mjs:19-20`).
//    그래서 **첫 사람이 실제로 만나는 화면을 한 번도 눈으로 본 적이 없다.**
//    광고로 온 사람은 정확히 그 «안 심은» 상태로 들어온다.
//
// ⛔ 이 판은 **아무것도 안 고친다.** 찍고 재기만 한다. 뭘 고칠지는 창업자가 고른다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4489, r))

const OUT = process.env.SHOT_OUT || '/tmp/시안'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 👀 지금 «보이는» 것만 사람 말로 읽어온다
async function 훑기(p) {
  return p.evaluate(() => {
    const 보임 = (e) => {
      const r = e.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return false
      const st = getComputedStyle(e)
      return st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05
    }
    const 단추 = [...document.querySelectorAll('button,[role="button"],.nav-item,a')]
      .filter(보임).map((e) => (e.innerText || '').trim().replace(/\s+/g, ' ')).filter(Boolean)
    const 글 = (document.body.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)
    const doc = document.documentElement
    return {
      가로넘침: doc.scrollWidth - doc.clientWidth,
      세로: doc.scrollHeight, 화면높이: doc.clientHeight,
      단추: [...new Set(단추)].slice(0, 16),
      글줄수: 글.length, 글: 글.slice(0, 24),
    }
  })
}

let 누름 = 0
const 발자국 = []
async function 찍기(p, 순번, 이름, 폭) {
  await p.waitForTimeout(900)
  const m = await 훑기(p)
  // ⛔ jpg 로 작게 — png 는 한 장이 160,000B 라 bigout-guard(60,000B)를 넘어 «내가 못 연다».
  //    눈으로 열어보지 못하는 캡처는 찍으나 마나다(절대원칙 21).
  const 파일 = `${OUT}/${폭}-${String(순번).padStart(2, '0')}-${이름}.jpg`
  await p.screenshot({ path: 파일, quality: 38, type: 'jpeg' })  // ⛔ fullPage 도 안 쓴다 — 보이는 만큼만
  발자국.push({ 폭, 순번, 이름, 누름, ...m })
  console.log(`\n📸 [${폭}px] ${순번}. ${이름}   (여기까지 누른 횟수 = ${누름})`)
  console.log(`   가로넘침 ${m.가로넘침}px · 세로 ${m.세로}px / 화면 ${m.화면높이}px${m.세로 > m.화면높이 + 4 ? '  ⚠️스크롤해야 다 보임' : ''}`)
  console.log(`   단추 = ${JSON.stringify(m.단추)}`)
  console.log(`   글 ${m.글줄수}줄 = ${JSON.stringify(m.글.slice(0, 14))}`)
  return m
}

// 💬 코치마크 — 화면 «전체»가 「다음 안내 보기」 한 장이라, 그 아래 아무것도 못 누른다.
//    🔢 2026-09-10 실측 = 이것 때문에 가져오기 탭 누르기가 30초 만에 죽었다.
//    ⛔ 게다가 앱을 다시 열 때마다 «또» 뜬다 — 그래서 화면을 옮길 때마다 이걸 부른다.
//    ⏱ 코치는 자리를 «재고» 나서 뜬다(CoachMarks 가 measure 를 기다린다) → 먼저 좀 기다려 준다.
//    ＋ 코치만 막는 게 아니다 — 앱을 다시 열면 「한끼 소식」 같은 시트가 «또» 앞을 막는다.
//      🔢 2026-09-10 실측 = sheet-mask 안의 「닫기」가 아래 탭을 가로챘다(두 번째 벽).
//    📌 그래서 이름을 「코치 넘기기」가 아니라 «길 막는 것 치우기»로 둔다 — 종류가 하나가 아니다.
async function 길막치우기(p, 순번, 폭) {
  await p.waitForTimeout(1400)
  for (let i = 0; i < 12; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) {
      await 찍기(p, 순번++, `길막-시트-${i + 1}`, 폭)
      await 누르기(시트, `앞을 막는 시트 「${(await 시트.innerText()).trim()}」`)
      await p.waitForTimeout(800); continue
    }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) {
      await 찍기(p, 순번++, `길막-코치-${i + 1}`, 폭)
      await 누르기(코치, `코치마크`)
      await p.waitForTimeout(800); continue
    }
    break
  }
  return 순번
}

async function 누르기(loc, 무엇) {
  누름 += 1
  console.log(`   👆 ${누름}번째 누름 — ${무엇}`)
  await loc.click()
}


// ✏️✏️ 시안 — **앱 코드는 한 줄도 안 고쳤다.** 브라우저 안에서 «그 자리만» 옮겨 보고 찍는다.
//    ⛔ 「이렇게 하자」가 아니라 「이렇게 되면 이렇게 보인다」다. 판정은 창업자가 한다.
const 폭 = 390
const ctx = await b.newContext({ viewport: { width: 폭, height: 860 }, deviceScaleFactor: 1, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4489/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2600)
let 순번 = 1
const 건너 = p.locator('button', { hasText: /^건너뛰기/ }).first()
if (await 건너.count()) await 건너.click()
순번 = await 길막치우기(p, 순번, 폭)
await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
await p.waitForTimeout(1200)
순번 = await 길막치우기(p, 순번, 폭)

// ── ⓒ 안내 둘을 갈래 «아래»로
await 찍기(p, 순번++, 'C-지금', 폭)
await p.evaluate(() => {
  const opts = document.querySelector('.imp-opts')
  const notice = document.querySelector('.imp-notice')
  const earn = notice && notice.nextElementSibling
  if (opts && notice) opts.after(notice)
  if (opts && earn) opts.after(earn)
})
await 찍기(p, 순번++, 'C-시안', 폭)

// ── ⓓ 갈래① 에 「여기서 고르기」 단추
await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1800)
순번 = await 길막치우기(p, 순번, 폭)
await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
await p.waitForTimeout(1200)
순번 = await 길막치우기(p, 순번, 폭)
await p.locator('.imp-opt').first().click()
await p.waitForTimeout(1200)
await 찍기(p, 순번++, 'D-지금', 폭)
await p.evaluate(() => {
  const fig = document.querySelector('.imp-shot')
  if (!fig) return
  const 새단추 = document.createElement('button')
  새단추.className = 'btn-primary press'
  새단추.style.cssText = 'margin:18px 0 6px;width:100%'
  새단추.textContent = '이미 캡처해 뒀으면 여기서 고르기'
  fig.parentElement.insertBefore(새단추, fig.nextElementSibling)
})
await 찍기(p, 순번++, 'D-시안', 폭)

// ── ⓔ [창업자 2026-09-10] 「이거 해보면 열쇠 1개씩」 다섯 줄을 «접어» 제목만 보이게
await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1800)
순번 = await 길막치우기(p, 순번, 폭)
await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
await p.waitForTimeout(1200)
순번 = await 길막치우기(p, 순번, 폭)
await p.evaluate(() => {
  const el = document.querySelector('.earn-list')
  if (!el) return
  el.querySelector('ul')?.setAttribute('style', 'display:none')
  el.querySelector('.earn-foot')?.setAttribute('style', 'display:none')
  const head = el.querySelector('.earn-head')
  if (head) {
    head.style.cssText = 'display:flex;align-items:center;gap:8px'
    const 화살 = document.createElement('span')
    화살.textContent = '⌄'
    화살.style.cssText = 'margin-left:auto;font-size:20px;opacity:.55'
    head.appendChild(화살)
  }
})
await 찍기(p, 순번++, 'E-시안-접음', 폭)
// ＋ 1번(안내 내리기)까지 같이 걸면 어떻게 보이나
await p.evaluate(() => {
  const opts = document.querySelector('.imp-opts')
  const notice = document.querySelector('.imp-notice')
  const earn = document.querySelector('.earn-list')
  if (opts && notice) opts.after(notice)
  if (opts && earn) opts.after(earn)
})
await 찍기(p, 순번++, 'E-시안-접음+내림', 폭)
await ctx.close()
console.log(`\n📂 시안 = ${OUT}`)
await b.close(); srv.close()
