// 🏠🎨 홈 「아직 안 해봤어요」 카드 — 순서·색·높이 시안 «2판» (2026-08-20 저녁)
//
// 📮 창업자 = *"홈에 아직안해봤어요 색이 너무 직하고 꼬르곰이 한끼소식도 꼬르곰 얘도 꼬르곰이라 좀 정신이없어.
//    높이도 조금 줄였으면 좋겠어."* · *"한끼소식이 제일 위로 그 아래 아직안해봤어요가 오는게 좋을 것 같아.
//    색배치는 어떻게할지네가 고민해봐"*
// 📮 1판을 보고 = *"별로였던 것 같았는데.."* → **맞았다.** 아래 셋이 실물에서 드러났다.
//
// ⛔⛔ **1판이 창업자 요구를 «못 지켰다» — 순서가 그대로였다.**
//    `.home-pair` 는 **「한끼 소식」＋「오늘 뭐 해먹지」 묶음**이다(패드 2단 배치용).
//    통째로 위로 옮기니 **「오늘 뭐 해먹지」가 딸려 올라가** 소식과 카드 «사이»에 꼈다.
//    → 창업자가 말한 「소식 바로 아래 아직 안 해봤어요」가 안 됐다.
//    ✅ **소식(`.news-card`) 만 꺼내서** 맨 위로 옮긴다. 「오늘 뭐 해먹지」는 제자리(카드 아래).
//
// ⛔ 1판의 나머지 둘 = ⑵**너무 연해서 「한끼 소식」과 구분이 안 됐다**(둘 다 옅은 채움 → 뭐가 중요한지 모른다)
//                    ⑶**펭펭 24px 이 너무 작아** 있는지도 몰랐다 → **34px** ＋ 오른쪽으로 옮긴다
//
// ⭐ 왜 «앱 소스를 안 고치고» 찍나 = 고르기 «전»이라 그렇다. 브라우저에서 style·DOM 만 덮어씌운다.
//    ⛔ 그러니 이건 «시안»이다. 고르면 그때 진짜 CSS·JSX 로 옮긴다.
//
// 🔢 지금 값(실측) = `.next-card` 배경 `var(--brown)` = **#5878a0**(더스티 블루) ＋ 흰 글자 · 높이 102px
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈카드-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드2'
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

// 📐 넷이 «공통»으로 갖는 것 — 높이 줄이기 ＋ 펭펭 자리
//    🐧 [창업자] *"펭펭을 작게 넣거나 이모지를 넣어도 좋아. 밋밋하면.."*
//       ⭐ 꼬르곰이 「한끼 소식」에 있으니 이 카드엔 **펭펭** (창업자가 짚은 「정신없다」의 답)
//       ⛔ 유니코드 이모지 금지 — 우리 스티커만(CLAUDE.md)
const 공통 = `
      .next-card{padding:9px 12px 10px}
      .next-title{font-size:16px}
      .next-reason{font-size:13px;margin-top:3px}
      .next-cta{margin-top:8px;padding:9px 12px}
      .next-peng{flex:0 0 auto;display:block;width:34px;height:auto;object-fit:contain;margin:-10px 0 -4px auto}`

const 시안 = [
  {
    이름: '가-크림에파랑막대', 설명: '크림 채움 ＋ 왼쪽 굵은 파랑 막대', 펭: 'pn_search',
    css: `${공통}
      .next-card{background:var(--cream);border-left:5px solid var(--brown)}
      .next-card.sub{background:color-mix(in srgb,var(--cream) 60%,var(--surface))}
      .next-label{color:var(--brown);opacity:1;font-weight:800}
      .next-title{color:var(--text)}
      .next-reason{color:var(--text-sub)}
      .next-cta{background:var(--brown);color:#fff}`,
  },
  {
    이름: '나-옅은파랑막대굵게', 설명: '옅은 파랑 ＋ 왼쪽 굵은 막대 (1판 A안을 굵게)', 펭: 'pn_search',
    css: `${공통}
      .next-card{background:color-mix(in srgb,var(--brown) 13%,var(--surface));border-left:5px solid var(--brown)}
      .next-card.sub{background:color-mix(in srgb,var(--brown) 7%,var(--surface))}
      .next-label{color:var(--brown);opacity:1;font-weight:800}
      .next-title{color:var(--text)}
      .next-reason{color:var(--text-sub)}
      .next-cta{background:var(--brown);color:#fff}`,
  },
  {
    이름: '다-흰카드테두리', 설명: '흰 카드 ＋ 파랑 테두리 (홈에 흰 카드가 없어서 오히려 튄다)', 펭: 'pn_search',
    css: `${공통}
      .next-card{background:#fff;border:1.5px solid color-mix(in srgb,var(--brown) 45%,transparent);
        box-shadow:0 2px 10px color-mix(in srgb,var(--brown) 12%,transparent)}
      .next-card.sub{background:#fff;border-color:color-mix(in srgb,var(--brown) 22%,transparent);box-shadow:none}
      .next-label{color:var(--brown);opacity:1;font-weight:800}
      .next-title{color:var(--text)}
      .next-reason{color:var(--text-sub)}
      .next-cta{background:var(--brown);color:#fff}`,
  },
  {
    이름: '라-지금색높이만', 설명: '지금 진한 파랑 그대로 · 높이만 줄이고 펭펭 (견줄 것)', 펭: 'pn_search',
    css: 공통,
  },
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
for (const s of [{ 이름: '0-지금', 설명: '손대기 전', css: null, 펭: null }, ...시안]) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  if (s.css) {
    // 🐧 펭펭은 «base64 로» 넘긴다 — 빌드된 dist 는 파일 이름에 해시가 붙어 경로를 못 맞춘다
    const 펭URL = s.펭 ? 'data:image/png;base64,' + readFileSync(join(ROOT, `src/assets/ui/wave/${s.펭}.png`)).toString('base64') : null
    await page.evaluate(({ css, 펭 }) => {
      // ① 순서 = **「한끼 소식」만** 꺼내 맨 위로 (⛔묶음째 옮기면 「오늘 뭐 해먹지」가 딸려 온다 — 1판의 실패)
      const 줄 = document.querySelector('.next-row')
      const 소식 = document.querySelector('.news-card')
      if (줄 && 소식 && 줄.parentNode) 줄.parentNode.insertBefore(소식, 줄)
      // ② 곰 빼기 = 홈의 우리 애 자리는 「한끼 소식」 하나 (창업자 *"정신이없어"*)
      document.querySelectorAll('.next-gom').forEach((g) => g.remove())
      // ③ 펭펭 넣기 — 34px, 오른쪽 끝
      if (펭) {
        document.querySelectorAll('.next-head').forEach((h) => {
          const im = document.createElement('img')
          im.src = 펭; im.alt = ''; im.className = 'next-peng hk-m-tongtong'
          h.appendChild(im)
        })
      }
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st)
    }, { css: s.css, 펭: 펭URL })
    await page.waitForTimeout(500)
  }

  const 덮개 = await 덮였나(page)
  if (덮개) { console.log(`  ⛔ ${s.이름} — 덮개가 있다: ${덮개}`); await page.close(); continue }

  // 🔢 «재서» 같이 찍는다 — 「줄었나·순서가 맞나」는 눈이 아니라 숫자가 답한다
  const 잰값 = await page.evaluate(() => {
    const 자리 = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : null }
    const c = document.querySelector('.next-card')
    return {
      카드높이: c ? Math.round(c.getBoundingClientRect().height) : null,
      소식y: 자리('.news-card'), 카드y: 자리('.next-row'), 오늘y: 자리('.home-pair'),
      곰개수: document.querySelectorAll('.next-gom').length,
    }
  })
  // ⭐ 「소식 → 아직 안 해봤어요 → 오늘 뭐 해먹지」 순서가 실제로 됐나
  잰값.순서맞나 = 잰값.소식y != null && 잰값.카드y != null && 잰값.오늘y != null
    && 잰값.소식y < 잰값.카드y && 잰값.카드y < 잰값.오늘y

  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  결과.push({ ...s, ...잰값 })
  console.log(`  ✅ ${s.이름.padEnd(16)} 높이 ${String(잰값.카드높이).padStart(3)}px · 순서 ${잰값.순서맞나 ? '○' : '✗'} (소식 ${잰값.소식y} → 카드 ${잰값.카드y} → 오늘 ${잰값.오늘y}) · 카드 속 곰 ${잰값.곰개수}`)
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📸 ${결과.length}장 → ${OUT}`)
