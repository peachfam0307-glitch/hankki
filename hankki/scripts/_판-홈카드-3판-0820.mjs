// 🏠🎨 홈 「아직 안 해봤어요」 — 3판. **색이 아니라 «모양»을 낮춘다** (2026-08-20 저녁)
//
// 📮 창업자 2판 판정 = *"**다 별로같아 ㅠㅠ 높이도 줄이면 좋겠어**"* ＋ 가로 장수 = **「1장만」**
//    ＋ *"디자인이랑 색이 조잡하고 정신이 없어 **안내박스랑 콩국수랑**.."*
//    ＋ *"**해상도가 떨어져서 잘모녀..**"* → ⛔나란히 붙이며 절반으로 줄인 내 잘못. **낱장 원본 해상도로 낸다.**
//
// ⭐⭐ 1·2판이 «색»만 바꿨는데 넷 다 별로였다 → **문제는 색이 아니라 「덩치」다.**
//    🔢 실측 = 카드 한 장 97~102px × **가로 3장** · 그 위 소식 60px · 아래 「오늘 뭐 해먹지」 100px
//       → 첫 화면 위쪽이 «서로 다른 결의 덩어리 셋»으로 꽉 찬다. 그게 창업자가 본 「정신없음」이다.
//    ✅ 그래서 이번엔 **줄 수를 줄인다** — 「이유」와 「보기」를 접고, 라벨·제목을 한 줄로.
//       ⛔ 글자를 «지우는» 게 아니라 갈래가 「한줄」일 때만 쓰는 안내라 이 갈래(안해본것)엔 없어도 뜻이 산다.
//
// ⭐ 「라-소식과 한 벌」이 이번 판의 핵심 안이다 —
//    창업자가 짚은 「정신없음」의 뿌리가 **결이 다 다른 것**이라면, 소식과 «같은 모양»으로 만들면
//    둘이 형제로 보여 덩어리가 셋 → 둘로 준다. 새로 그릴 것도 0이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈카드-3판-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드3'
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
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 📐 넷이 «공통»으로 = ①1장만 ②이유·보기 접기 ③펭펭
// ⛔⛔ 1장만 남기면 «폭»이 따라오지 않는다 — `.next-row` 가 가로로 미는 줄이라
//    카드가 «내용 폭»에 맞춰져서 오른쪽 끝이 소식·오늘 뭐 해먹지와 «어긋난다».
//    실물로 보고서야 잡았다(절대원칙 21) — 창업자가 말한 「지저분」에 이게 한몫한다.
//    ✅ 1장이면 미는 줄일 이유가 없다 → `display:block` 으로 되돌려 폭이 꽉 차게.
const 공통 = `
      .next-row{overflow:visible;display:block}
      .next-card:not(:first-child){display:none}
      .next-card:first-child{width:100%}
      .next-reason,.next-eg{display:none}
      .next-peng{flex:0 0 auto;display:block;width:30px;height:auto;object-fit:contain;margin:-8px 0 -6px 0}`

// 🔗 한 줄로 눕히는 판 — 라벨·제목이 나란히 서고 화살표가 오른쪽 끝
const 한줄 = `
      .next-open{display:flex;align-items:center;gap:9px;width:100%;text-align:left}
      .next-head{flex:0 0 auto;display:flex;align-items:center;gap:8px;margin:0}
      .next-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0}`

const 시안 = [
  {
    이름: '가-한줄-흰카드', 설명: '한 줄로 눕힘 ＋ 흰 카드', 펭: 'pn_search',
    css: `${공통}${한줄}
      .next-card{background:#fff;border:1.5px solid color-mix(in srgb,var(--brown) 32%,transparent);padding:9px 13px;border-radius:14px}
      .next-label{color:var(--brown);opacity:1;font-weight:800;font-size:12.5px}
      .next-title{color:var(--text);font-size:15.5px;font-weight:800}`,
  },
  {
    이름: '나-한줄-크림', 설명: '한 줄 ＋ 크림 채움 (제일 조용하다)', 펭: 'pn_search',
    css: `${공통}${한줄}
      .next-card{background:var(--cream);border:0;padding:10px 13px;border-radius:14px}
      .next-label{color:var(--brown);opacity:1;font-weight:800;font-size:12.5px}
      .next-title{color:var(--text);font-size:15.5px;font-weight:800}`,
  },
  {
    이름: '다-두줄-낮은카드', 설명: '두 줄(라벨/제목)로 낮춘 카드 ＋ 옅은 파랑', 펭: 'pn_search',
    css: `${공통}
      .next-card{background:color-mix(in srgb,var(--brown) 12%,var(--surface));border-left:5px solid var(--brown);padding:9px 12px;border-radius:14px}
      .next-label{color:var(--brown);opacity:1;font-weight:800;font-size:12.5px}
      .next-title{color:var(--text);font-size:16px;margin-top:1px}
      .next-head{margin:0}
      .next-peng{margin-left:auto}`,
  },
  {
    이름: '라-소식과한벌', 설명: '「한끼 소식」과 «똑같은 모양·색» — 둘이 형제로 보인다', 펭: 'pn_search',
    css: `${공통}${한줄}
      .next-card{background:var(--tease,#e3eef7);border:0;padding:10px 13px;border-radius:14px}
      .next-label{color:var(--brown);opacity:1;font-weight:800;font-size:12.5px}
      .next-title{color:var(--text);font-size:15.5px;font-weight:800}`,
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
for (const s of [{ 이름: '0-지금', 설명: '손대기 전', css: null, 펭: null }, ...시안]) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  if (s.css) {
    const 펭URL = s.펭 ? 'data:image/png;base64,' + readFileSync(join(ROOT, `src/assets/ui/wave/${s.펭}.png`)).toString('base64') : null
    await page.evaluate(({ css, 펭 }) => {
      // ① 「한끼 소식」만 꺼내 맨 위로 (⛔묶음째 옮기면 「오늘 뭐 해먹지」가 딸려 온다 — 1판의 실패)
      const 줄 = document.querySelector('.next-row')
      const 소식 = document.querySelector('.news-card')
      if (줄 && 소식 && 줄.parentNode) 줄.parentNode.insertBefore(소식, 줄)
      document.querySelectorAll('.next-gom').forEach((g) => g.remove())
      if (펭) {
        const h = document.querySelector('.next-card .next-head')
        if (h) { const im = document.createElement('img'); im.src = 펭; im.alt = ''; im.className = 'next-peng hk-m-tongtong'; h.insertBefore(im, h.firstChild) }
      }
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st)
    }, { css: s.css, 펭: 펭URL })
    await page.waitForTimeout(500)
  }

  const 덮개 = await 덮였나(page)
  if (덮개) { console.log(`  ⛔ ${s.이름} — 덮개: ${덮개}`); await page.close(); continue }

  const 잰값 = await page.evaluate(() => {
    const 상자 = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null }
    const c = 상자('.next-card'), n = 상자('.news-card'), w = 상자('.home-pair')
    const 보임 = [...document.querySelectorAll('.next-card')].filter((e) => e.getBoundingClientRect().width > 10).length
    return {
      카드높이: c ? Math.round(c.height) : null,
      소식높이: n ? Math.round(n.height) : null,
      보이는카드: 보임,
      순서맞나: !!(n && c && w) && n.top < c.top && c.top < w.top,
      // 🔢 「첫 화면이 얼마나 찼나」 = 위쪽 덩어리 셋의 높이 합
      위쪽합: [n, c, w].every(Boolean) ? Math.round(n.height + c.height + w.height) : null,
    }
  })

  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  // ⭐ 카드 언저리만 «원본 해상도로» 따로 — 창업자가 폰에서 크게 본다(*"해상도가 떨어져서 잘모녀"*)
  await page.screenshot({ path: join(OUT, `zoom-${s.이름}.png`), clip: { x: 0, y: 95, width: 390, height: 290 } })
  결과.push({ ...s, ...잰값 })
  console.log(`  ✅ ${s.이름.padEnd(14)} 카드 ${String(잰값.카드높이).padStart(3)}px · 보이는 카드 ${잰값.보이는카드}장 · 순서 ${잰값.순서맞나 ? '○' : '✗'} · 위쪽 덩어리 합 ${잰값.위쪽합}px`)
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📸 ${결과.length}장 → ${OUT}`)
const 지금 = 결과.find((r) => r.이름 === '0-지금')
if (지금) for (const r of 결과.filter((x) => x !== 지금)) {
  console.log(`   ${r.이름.padEnd(14)} 카드 ${지금.카드높이}→${r.카드높이}px (${Math.round((r.카드높이 / 지금.카드높이 - 1) * 100)}%) · 위쪽 ${지금.위쪽합}→${r.위쪽합}px`)
}
