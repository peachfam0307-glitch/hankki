// 🏠🎨 홈 「아직 안 해봤어요」 4판 — **「오늘 뭐 해먹지」와 한 벌로** (2026-08-20 밤)
//
// 📮 창업자 3판 판정 = 좋다 «라·나» / 버린다 «가·다»
//    ＋ *"**라는 색이 한끼소식이랑 반대라서 지저분해보이고**, 나는 **너무 안읽히려나** 싶고"*
//    ＋ *"보니까 **1줄이라 오늘뭐해먹지랑 같은 색 구성인데 반대로 보여**"*  ← ⭐이 한 줄이 답을 줬다
//
// 🔢 **실측이 창업자 말을 그대로 확인했다** (`.today-card`·`.news-card` computed style)
//    | | 바탕 | 라벨 | 제목 |
//    |---|---|---|---|
//    | 오늘 뭐 해먹지 | **베이지** `#efe9dc → #e6ddc8` | **파랑 `#5878a0`** | 진남색 `#2d3f56` |
//    | 한끼 소식 | 민트블루 `#e6eef0 → #d9e8ea` | — | 진갈색 `#3a352e` |
//    | 라(3판) | **파랑**(소식 색) | **파랑** | 진갈색 |
//    ⭐⭐ 「오늘 뭐 해먹지」와 **구성이 똑같은데 바탕만 뒤집혔다** — 그게 「반대로 보여」다.
//       ⛔ 나는 「소식과 한 벌」을 노렸는데, 정작 «구성이 닮은 쪽»은 소식이 아니라 **오늘 뭐 해먹지**였다.
//          (소식 = 그림＋제목＋화살표 / 오늘 = 작은 파란 라벨 ＋ 진한 제목 = 우리 카드와 같은 뼈대)
//
// ✅ 그래서 넷 다 **「오늘 뭐 해먹지」의 베이지 계열**로 맞춘다. 갈리는 건 «경계를 어떻게 주나»뿐이다.
// 🔢 그리고 창업자 걱정(*"너무 안읽히려나"*)에 **대비율(WCAG)로 답한다** — 미감이 아니라 숫자다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈카드-4판-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드4'
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

// 📐 넷이 공통 = 1장만 · 한 줄 · 안내 줄 접기 · 펭펭 · **「오늘 뭐 해먹지」와 같은 글자색**
const 공통 = `
      .next-row{overflow:visible;display:block}
      .next-card:not(:first-child){display:none}
      .next-card:first-child{width:100%}
      /* ⛔ 왼쪽 막대가 둥근 모서리 밖으로 삐져나와 각져 보였다(실물로 잡았다 · 절대원칙 21) */
      .next-card{overflow:hidden}
      .next-reason,.next-eg{display:none}
      .next-open{display:flex;align-items:center;gap:9px;width:100%;text-align:left}
      .next-head{flex:0 0 auto;display:flex;align-items:center;gap:8px;margin:0}
      .next-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0;
        color:#2d3f56;font-size:15.5px;font-weight:800}
      .next-label{color:#5878a0;opacity:1;font-weight:800;font-size:12.5px}
      .next-peng{flex:0 0 auto;display:block;width:30px;height:auto;object-fit:contain;margin:-8px 0 -6px 0}`

// 🎨 「오늘 뭐 해먹지」가 실제로 쓰는 그라데이션 (실측값)
const 베이지 = 'linear-gradient(135deg,#efe9dc,#e6ddc8)'

const 시안 = [
  {
    이름: '가-똑같이', 설명: '「오늘 뭐 해먹지」와 «완전히 같은» 베이지 · 경계 없음',
    css: `${공통}
      .next-card{background:${베이지};border:0;padding:10px 13px;border-radius:14px}`,
    왜: '둘이 완전한 한 벌이 된다. 다만 카드 경계가 옅어 「안 읽힌다」 느낌이 남을 수 있다.',
  },
  {
    이름: '나-왼쪽막대', 설명: '같은 베이지 ＋ 왼쪽에 파란 막대 4px',
    css: `${공통}
      .next-card{background:${베이지};border:0;border-left:4px solid #5878a0;padding:10px 13px;border-radius:14px}`,
    왜: '바탕은 한 벌인데 막대 하나로 「이건 다른 줄」이 바로 읽힌다. 글자를 안 건드려서 안 시끄럽다.',
  },
  {
    이름: '다-한톤진하게', 설명: '같은 계열인데 한 톤 진한 베이지',
    css: `${공통}
      .next-card{background:linear-gradient(135deg,#e8dfcc,#ddd2b8);border:0;padding:10px 13px;border-radius:14px}`,
    왜: '막대 없이 색만으로 갈린다. 「오늘 뭐 해먹지」와 형제인데 살짝 앞에 있는 느낌.',
  },
  {
    이름: '라-라벨강조', 설명: '같은 베이지 ＋ 라벨을 알약으로',
    css: `${공통}
      .next-card{background:${베이지};border:0;padding:10px 13px;border-radius:14px}
      .next-label{background:#5878a0;color:#f7f3ec;border-radius:999px;padding:3px 9px;font-size:11.5px}`,
    왜: '라벨이 알약이 되어 시선이 먼저 붙는다. 「새로」 뱃지와 같은 문법이라 앱 안에서 낯설지 않다.',
  },
]

const 덮였나 = (page) => page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"],[class*="sheet"]'
  for (const y of [200, 420, 700]) {
    const el = document.elementFromPoint(195, y)
    const c = el?.closest(판정)
    if (c) return `y=${y} · ${c.className}`
  }
  return ''
})

const 결과 = []
for (const s of 시안) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  const 펭URL = 'data:image/png;base64,' + readFileSync(join(ROOT, 'src/assets/ui/wave/pn_search.png')).toString('base64')
  await page.evaluate(({ css, 펭 }) => {
    const 줄 = document.querySelector('.next-row')
    const 소식 = document.querySelector('.news-card')
    if (줄 && 소식 && 줄.parentNode) 줄.parentNode.insertBefore(소식, 줄)
    document.querySelectorAll('.next-gom').forEach((g) => g.remove())
    const h = document.querySelector('.next-card .next-head')
    if (h) { const im = document.createElement('img'); im.src = 펭; im.alt = ''; im.className = 'next-peng hk-m-tongtong'; h.insertBefore(im, h.firstChild) }
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st)
  }, { css: s.css, 펭: 펭URL })
  await page.waitForTimeout(500)

  const 덮개 = await 덮였나(page)
  if (덮개) { console.log(`  ⛔ ${s.이름} — 덮개: ${덮개}`); await page.close(); continue }

  // 🔢 「안 읽히나」를 «재서» 답한다 — WCAG 대비율. 본문 4.5:1 · 큰 글자 3:1 이 기준.
  //    ⛔ 눈으로 「읽히는 것 같다」로 넘기지 않는다. 창업자 걱정에 숫자로 답하는 자리다.
  const 잰값 = await page.evaluate(() => {
    const 밝기 = (rgb) => {
      const [r, g, bl] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl
    }
    const 대비 = (a, b) => { const [x, y] = [밝기(a), 밝기(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100 }
    // 실제로 칠해진 바탕 픽셀을 쓴다 — 그라데이션이라 «가운데» 색을 잡는다
    const 카드 = document.querySelector('.next-card')
    const r = 카드.getBoundingClientRect()
    const 제목 = getComputedStyle(document.querySelector('.next-title')).color
    const 라벨el = document.querySelector('.next-label')
    const 라벨 = getComputedStyle(라벨el).color
    const 라벨바탕 = getComputedStyle(라벨el).backgroundColor
    // 그라데이션 가운데를 근사 — 두 끝 색의 평균(문자열에서 뽑는다)
    const bi = getComputedStyle(카드).backgroundImage
    const 색들 = bi.match(/rgba?\([^)]+\)/g) || []
    const 평균 = 색들.length >= 2
      ? 'rgb(' + [0, 1, 2].map((i) => Math.round(색들.reduce((s, c) => s + Number(c.match(/\d+/g)[i]), 0) / 색들.length)).join(',') + ')'
      : getComputedStyle(카드).backgroundColor
    const 라벨뒤 = 라벨바탕 && 라벨바탕 !== 'rgba(0, 0, 0, 0)' ? 라벨바탕 : 평균
    return {
      카드높이: Math.round(r.height), 바탕: 평균,
      제목대비: 대비(제목, 평균), 라벨대비: 대비(라벨, 라벨뒤),
    }
  })

  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  await page.screenshot({ path: join(OUT, `zoom-${s.이름}.png`), clip: { x: 0, y: 95, width: 390, height: 290 } })
  결과.push({ ...s, ...잰값 })
  const 판정 = (v, 큰글자) => (v >= (큰글자 ? 3 : 4.5) ? '✅' : v >= 3 ? '△' : '⛔')
  console.log(`  ✅ ${s.이름.padEnd(12)} ${String(잰값.카드높이).padStart(3)}px · 바탕 ${잰값.바탕.padEnd(18)} 제목대비 ${String(잰값.제목대비).padStart(5)} ${판정(잰값.제목대비)} · 라벨대비 ${String(잰값.라벨대비).padStart(5)} ${판정(잰값.라벨대비)}`)
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📸 ${결과.length}장 → ${OUT}`)
console.log('   기준 = WCAG 본문 4.5:1 이상이면 ✅ · 3.0~4.5 는 △(큰 글자만 통과) · 3 미만 ⛔')
