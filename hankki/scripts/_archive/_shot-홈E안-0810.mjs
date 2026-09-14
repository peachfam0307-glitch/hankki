// 🏠 홈 E안 반영 결과 — 실측 ＋ 캡처 (창업자 확정 2026-08-10)
//
// ⭐ 재는 것 = **①오른쪽이 안 휑한가 ②제철 요리 셋이 「오늘 뭐 해먹지」와 x 가 맞나
//    ③글자가 커졌나 ④폰 세로는 안 변했나 ⑤넘침 0**
//
// ⛔⛔ ②가 이번 판의 핵심이다 — 창업자 *"(윗줄 콩국수랑 같은 위치로)"*.
//    「반반으로 나눴다」와 「x 가 맞는다」는 다른 말이다. **눈으로 보면 몇 px 어긋난 걸 못 잡는다.**
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(`${OUT}/홈E`, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const 판 = [['패드-1600', 1600, 900], ['패드-1280', 1280, 800], ['폴드-765', 765, 689], ['폰세로-411', 411, 891]]

const PORT = Number(process.env.PORT || 4341)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const 재기 = () => {
  const px = (n) => Math.round(n)
  const 글끝 = (el) => { if (!el) return null; const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return b.width ? b.right : null }
  const out = {}
  const news = document.querySelector('.news-card')
  if (news) {
    const r = news.getBoundingClientRect()
    const 끝 = 글끝(news.querySelector('.news-sub')) ?? r.left
    out.소식빈폭 = px((news.lastElementChild?.getBoundingClientRect().left ?? r.right) - 끝)
    out.소식글 = px(parseFloat(getComputedStyle(news.querySelector('.news-title')).fontSize) * 10) / 10
  }
  const td = document.querySelector('.today-card')
  if (td) {
    const r = td.getBoundingClientRect()
    const 끝 = 글끝(td.querySelector('.today-title')) ?? r.left
    out.오늘빈폭 = px((td.querySelector('.today-refresh')?.getBoundingClientRect().left ?? r.right) - 끝)
    out.오늘글 = px(parseFloat(getComputedStyle(td.querySelector('.today-title')).fontSize) * 10) / 10
    out.오늘칸 = [px(r.left), px(r.right)]
    // ⛔⛔ 2026-08-10 — 「숫자는 다 초록불인데 화면이 깨진」 자리가 여기다.
    //   `Thumb` 이 `width:100%` 를 «인라인»으로 넣어서 클래스로 준 크기가 안 먹었고,
    //   썸네일이 카드 전폭을 먹어 글자가 «세로로 한 글자씩» 쌓였다.
    //   📌 그때 이 검사는 「어긋남 0px · 글자 커졌다」로 **전부 통과**시켰다.
    //   ⭐ 그래서 «모양»을 잰다 — 썸네일이 정사각인가, 제목이 한 줄인가.
    const th = td.querySelector('.today-main > div:first-child, .today-main > div')
    if (th) { const b = th.getBoundingClientRect(); out.썸네일 = [px(b.width), px(b.height)] }
    const t2 = td.querySelector('.today-title')
    if (t2) { const b = t2.getBoundingClientRect(); out.제목높이 = px(b.height) }
  }
  const wk = document.querySelector('.weekly-row')
  if (wk) {
    const r = wk.getBoundingClientRect()
    const 끝 = [...wk.children].reduce((m, c) => Math.max(m, c.getBoundingClientRect().right), r.left)
    out.제철빈폭 = px(r.right - 끝)
    out.제철칸 = [px(r.left), px(r.right)]
    out.제철칸수 = getComputedStyle(wk).gridTemplateColumns.split(' ').filter(Boolean).length
    out.제철글 = px(parseFloat(getComputedStyle(document.querySelector('.weekly-title')).fontSize) * 10) / 10
  }
  const nm = document.querySelector('.grid-card .name')
  if (nm) out.레시피이름 = px(parseFloat(getComputedStyle(nm).fontSize) * 10) / 10
  out.가로넘침 = px(Math.max(0, (document.querySelector('.app-frame')?.scrollWidth || 0) - innerWidth))
  return out
}

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const url = `http://127.0.0.1:${PORT}/`
let fail = 0
console.log('')
for (const [이름, w, h] of 판) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(url)
  await page.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1') }, state)
  await page.goto(url)
  await page.waitForTimeout(1500)
  const v = await page.evaluate(재기)
  await page.screenshot({ path: `${OUT}/홈E/${이름}.png` })

  const 큰화면 = w >= 700
  // ⭐ 핵심 — 제철 요리 셋의 왼쪽 끝이 「오늘 뭐 해먹지」 칸의 왼쪽 끝과 맞나 (2px 안이면 같은 자리)
  const 어긋남 = (v.오늘칸 && v.제철칸) ? Math.abs(v.오늘칸[0] - v.제철칸[0]) : null
  const ok = (t, c) => { console.log(`     ${c ? '✅' : '⛔'} ${t}`); if (!c) fail++ }
  console.log(`  ── ${이름} (${w}×${h})`)
  console.log(`     소식빈폭 ${v.소식빈폭} · 오늘빈폭 ${v.오늘빈폭} · 제철빈폭 ${v.제철빈폭}(칸 ${v.제철칸수}) · 넘침 ${v.가로넘침}`)
  console.log(`     글자 = 소식 ${v.소식글} · 오늘 ${v.오늘글} · 제철 ${v.제철글} · 레시피이름 ${v.레시피이름}`)
  // 🧿 모양 검사 — 숫자만 보면 못 잡는 「통째로 깨짐」을 여기서 잡는다
  const 정사각 = v.썸네일 && Math.abs(v.썸네일[0] - v.썸네일[1]) <= 2
  ok(`오늘 썸네일이 정사각 (${v.썸네일})`, !!정사각)
  ok(`오늘 제목이 한 줄 (높이 ${v.제목높이}px)`, v.제목높이 != null && v.제목높이 < v.오늘글 * 2)
  if (큰화면) {
    console.log(`     칸 x = 오늘 [${v.오늘칸}] · 제철요리 [${v.제철칸}] → 어긋남 ${어긋남}px`)
    ok('제철 요리 셋이 「오늘」 칸과 같은 자리 (≤2px)', 어긋남 !== null && 어긋남 <= 2)
    ok('소식 빈 폭이 절반 아래로 (예전 1364px)', v.소식빈폭 < w * 0.5)
    ok('글자가 커졌다 (소식 ≥16 · 오늘 ≥20 · 레시피이름 ≥16)', v.소식글 >= 16 && v.오늘글 >= 20 && v.레시피이름 >= 16)
  } else {
    ok('폰은 안 바뀐다 — 소식 13.5 · 오늘 16.5 · 레시피이름 14', v.소식글 === 13.5 && v.오늘글 === 16.5 && v.레시피이름 === 14)
    ok('폰은 제철이 아래로 (칸 x 가 다르다)', 어긋남 === null || 어긋남 > 2 || v.제철칸[0] < 40)
  }
  ok('가로 넘침 0', v.가로넘침 === 0)
  ok('pageerror 0', errs.length === 0)
  await ctx.close()
}
await browser.close(); stop()
console.log(fail ? `\n⛔ ${fail}칸 실패\n` : `\n✅ 전부 통과 → ${OUT}/홈E/\n`)
process.exit(fail ? 1 : 0)
