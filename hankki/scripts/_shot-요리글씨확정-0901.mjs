// 📸 **넣은 뒤 «눈으로» 본다** — 요리모드 귀염체 ＋ 획 ＋ 패드 가로 글줄 폭 ＋ 곰·타이머 크기 (2026-09-01)
//
// ⛔ 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 열어서 본다. 숫자만 보고 보내지 않는다.
// ⚠️ 스스로 검사도 같이 — 크기(24/28/38) · 획(0.7/0.85/1.6) · 글줄 폭 · **곰 키** · **타이머 글자** · 스크롤 0
//
// 🐻 곰·타이머가 여기 들어온 까닭 = 창업자 *"꼬르곰 크기 조금 키우고, 스탭 타이머도 … 자리많으니까"*(2026-09-01).
//    ⭐ **패드에서만** 커진다(160px·20px) — 폰은 그대로(104px·16px). 「패드면 다 같이 커진다」가 한 규칙이다.
//    ⛔ 이 칸이 없던 사이에 실제로 사고가 났다 — media query 를 `.buddy img` «앞»에 둬서
//       타이머만 커지고 곰은 104px 그대로였는데 **아무 검사도 안 걸렸다.** 그래서 여기에 못 박는다.
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-요리글씨확정-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/확정판'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

const 기기 = [
  { id: 'small', 이름: '작은 폰 360×640', 폭: 360, 높이: 640, 바람: { 크기: '24px', 획: '0.7px', 폭최대: null, 곰: 104, 타이머: '16px' } },
  { id: 'phone', 이름: '폰 390×844', 폭: 390, 높이: 844, 바람: { 크기: '28px', 획: '0.85px', 폭최대: null, 곰: 104, 타이머: '16px' } },
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180, 바람: { 크기: '38px', 획: '1.6px', 폭최대: null, 곰: 190, 타이머: '22px' } },
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820, 바람: { 크기: '38px', 획: '1.6px', 폭최대: 860, 곰: 190, 타이머: '22px' } },
]

let 죽음 = 0
for (const g of 기기) {
  const ctx = await b.newContext({ viewport: { width: g.폭, height: g.높이 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  if (!(await p.locator('[data-coach="cook"]').count())) { console.error(`✗ ${g.이름} — 요리모드 입구를 못 찾았다`); 죽음++; await ctx.close(); continue }
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
  }
  if (!(await p.locator('.cook-steptext').count())) { console.error(`✗ ${g.이름} — 걸음 글자를 못 찾았다`); 죽음++; await ctx.close(); continue }
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400)

  const m = await p.evaluate(() => {
    const e = document.querySelector('.cook-steptext'), no = document.querySelector('.cook-stepno'), body = document.querySelector('.cook-body')
    const img = document.querySelector('.buddy img'), t = document.querySelector('.cook-timer')
    const cs = getComputedStyle(e), cn = getComputedStyle(no)
    return {
      크기: cs.fontSize, 획: cs.webkitTextStrokeWidth, 글씨체: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
      폭최대: cs.maxWidth, 고르게: cs.textWrap || cs.textWrapStyle || '',
      쓸폭: Math.round(e.getBoundingClientRect().width),
      번호글씨체: cn.fontFamily.split(',')[0].replace(/['"]/g, ''), 번호굵기: cn.fontWeight,
      // ⛔ 곰은 `getBoundingClientRect()` 로 재면 «모션의 scale 까지» 같이 잰다(132 → 153). 레이아웃 키를 본다.
      곰: img ? Math.round(parseFloat(getComputedStyle(img).height)) : 0,
      곰원본: img ? img.naturalHeight : 0,
      타이머: t ? getComputedStyle(t).fontSize : '',
      스크롤: body.scrollHeight > body.clientHeight + 1,
    }
  })
  const ok = (a, b) => (a === b ? '✅' : (죽음++, '⛔'))
  console.log(`\n── ${g.이름} ──`)
  console.log(`  글자 ${m.크기} ${ok(m.크기, g.바람.크기)} · 획 ${m.획} ${ok(m.획, g.바람.획)} · 글씨체 ${m.글씨체} ${ok(m.글씨체, 'Gaegu')}`)
  console.log(`  글줄 폭 ${m.쓸폭}px (max-width ${m.폭최대}) ${g.바람.폭최대 ? ok(m.폭최대, `${g.바람.폭최대}px`) : (m.폭최대 === 'none' ? '✅ 안 걸림' : (죽음++, '⛔ 걸리면 안 되는데 걸렸다'))}`)
  console.log(`  고르게 나누기 ${m.고르게 || '(없음)'} · STEP 줄 ${m.번호글씨체}/${m.번호굵기} ${m.번호글씨체 !== 'Gaegu' ? '✅ 원래 글씨체(60% 얇아져서 접었다)' : (죽음++, '⛔ 귀염체가 남았다')}`)
  // 🖼 ＋ 원본보다 크게 그리면 뭉갠다(검수 절대원칙 ③ 해상도) — 값이 바뀌어도 이 줄이 잡는다
  const 뭉갬 = m.곰원본 && m.곰 > m.곰원본
  console.log(`  꼬르곰 ${m.곰}px ${ok(m.곰, g.바람.곰)} (원본 ${m.곰원본}px${뭉갬 ? (죽음++, ' ⛔ 원본보다 크게 그린다') : ' · 축소라 선명'}) · 타이머 글자 ${m.타이머} ${ok(m.타이머, g.바람.타이머)}`)
  console.log(`  스크롤 ${m.스크롤 ? (죽음++, '⛔ 생겼다') : '✅ 없다'}`)

  // ✂️· ＋ 「항목이 통째로 묶였나」 — **살아 있는 DOM 으로** 본다(흉내가 아니다 · 절대원칙 30)
  //    ⭐ `·` 가 있는 걸음이 나올 때까지 「다음」을 눌러 본다. 못 만나면 «판정하지 않는다»(초록불로 속이지 않는다)
  let 점걸음 = null
  for (let i = 0; i < 12; i++) {
    점걸음 = await p.evaluate(() => {
      const el = document.querySelector('.cook-steptext')
      if (!el || !el.innerText.includes('·')) return null
      const spans = [...el.querySelectorAll('span')].filter((s) => getComputedStyle(s).whiteSpace === 'nowrap')
      return { 글: el.innerText.replace(/\s+/g, ' ').slice(0, 40), 묶인항목: spans.length, wbr: el.querySelectorAll('wbr').length }
    })
    if (점걸음) break
    const 다음 = p.locator('button, [role="button"]').filter({ hasText: /^다음/ }).last()
    if (!(await 다음.count())) break
    await 다음.click().catch(() => {}); await p.waitForTimeout(300)
  }
  if (!점걸음) console.log(`  가운뎃점 묶기 ⚠️ 이 레시피엔 «·가 든 걸음»이 없어 못 쟀다(⛔통과로 세지 않는다)`)
  else if (점걸음.묶인항목 > 0 && 점걸음.wbr > 0) console.log(`  가운뎃점 묶기 ✅ 항목 ${점걸음.묶인항목}개가 nowrap · 끊을 자리(wbr) ${점걸음.wbr}개 — "${점걸음.글}…"`)
  else { 죽음++; console.log(`  가운뎃점 묶기 ⛔ 안 붙었다 (nowrap ${점걸음.묶인항목} · wbr ${점걸음.wbr}) — "${점걸음.글}…"`) }

  await p.screenshot({ path: join(OUT, `${g.id}.png`) })
  await ctx.close()
}
await b.close(); srv.close()
console.log(죽음 ? `\n⛔ 어긋난 칸 ${죽음}개` : `\n✅ 네 화면 전부 바라던 값 그대로다`)
process.exit(죽음 ? 1 : 0)
