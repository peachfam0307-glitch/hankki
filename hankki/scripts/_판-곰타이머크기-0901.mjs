// 🐻⏱ **패드 가로 — 꼬르곰과 「단계 타이머」를 얼마나 키울까** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"그리고 꼬르곰 크기 조금 키우고, 스탭 타이머도 조금 키워도 될듯 **자리많으니까.**"*
//    (760px 판을 보고 한 말 — 패드 «가로»에 세로 빈자리가 크게 남는 걸 보고 나온 것이다)
//
// 🔢 **네 단계를 «살아 있는 화면»에 얹어 재고 찍는다**(절대원칙 30 — 흉내가 아니다)
//    · 곰 104(지금) → 132 → 160 → 190px   · 타이머 글자 16 → 18 → 20 → 22px
//    ⛔ **제일 «키 큰» 걸음으로 같이 잰다** — 3줄짜리가 들어가야 진짜로 자리가 남는 것이다.
//       (부엌에선 「굴려야 보이는 것」과 「잘린 것」이 같다 · styles.css 요리모드 절)
//
// 🖼 원본 그림 키 = 546~599px 이라 190px 로 키워도 **여전히 «축소»다**(검수 절대원칙 ③ 해상도).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-곰타이머크기-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/곰타이머'
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

// 🍳 제일 «키 큰» 걸음 = 760px 에서 줄이 제일 많이 나는 것. 앱과 같은 모듈에서 꺼낸다
const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const 첫줄 = String(s).split('\n')[0].trim()
  if (첫줄) 걸음들.push(첫줄)
}
const 대표 = [...걸음들].sort((a, b) => a.length - b.length)[Math.floor(걸음들.length / 2)]
const 제일긴 = [...걸음들].sort((a, b) => b.length - a.length)[0]

const 단계 = [
  { id: 'ㄱ', 이름: '지금',  곰: 104, 글: 16, 아이콘: 19, 위: 12, 옆: 18, 둥글: 14, 틈: 7 },
  { id: 'ㄴ', 이름: '조금',  곰: 132, 글: 18, 아이콘: 21, 위: 14, 옆: 21, 둥글: 16, 틈: 8 },
  { id: 'ㄷ', 이름: '좀더',  곰: 160, 글: 20, 아이콘: 23, 위: 16, 옆: 24, 둥글: 18, 틈: 9 },
  { id: 'ㄹ', 이름: '많이',  곰: 190, 글: 22, 아이콘: 25, 위: 18, 옆: 27, 둥글: 20, 틈: 10 },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
}
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
const n = Math.min(await 카드.count(), 14)
for (let i = 0; i < n; i++) {
  await 카드.nth(i).click().catch(() => {})
  await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) break
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
await p.locator('[data-coach="cook"]').first().click()
await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {})
  await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드 글자를 못 찾았다 — 아무것도 못 쟀다'); await b.close(); srv.close(); process.exit(1) }
if (!(await p.locator('.cook-timer').count())) { console.error('⛔ 타이머 단추를 못 찾았다 — 아무것도 못 쟀다'); await b.close(); srv.close(); process.exit(1) }

// ⚠️ 먼저 지금 값이 내가 아는 그 값인가(아니면 딴 것을 재고 있는 것이다 · 규칙 18 ⓘ)
const 처음 = await p.evaluate(() => {
  const img = document.querySelector('.buddy img'), t = document.querySelector('.cook-timer')
  const body = document.querySelector('.cook-body')
  return {
    곰: Math.round(parseFloat(getComputedStyle(img).height)),
    곰원본: img.naturalHeight,
    타이머글: getComputedStyle(t).fontSize,
    본문키: Math.round(body.clientHeight),
  }
})
console.log(`\n── 패드 가로 1180×820 ──`)
console.log(`   지금 곰 ${처음.곰}px (원본 ${처음.곰원본}px) · 타이머 글자 ${처음.타이머글} · 본문이 쓸 수 있는 키 ${처음.본문키}px`)
// ⚠️ 「지금 값」을 못 박지 않는다 — 창업자가 고른 값이 바뀌면 이 판이 그때마다 죽는다.
//    ⭐ 대신 **지금 앱이 어느 단계에 서 있나**를 찍는다. 목록에 없으면 그것부터 알린다.
const 지금단계 = 단계.find((s) => Math.abs(처음.곰 - s.곰) <= 2)
console.log(`   지금 앱은 ${지금단계 ? `**${지금단계.id} ${지금단계.이름}**` : '⚠️ 목록에 없는'} 단계다`)
if (!Number.isFinite(처음.곰) || 처음.곰 < 40) { console.error(`⛔ 곰 키를 못 쟀다(${처음.곰}) — 판정 금지`); await b.close(); srv.close(); process.exit(1) }

const 잰값 = []
for (const s of 단계) {
  for (const [글쓰임, 글] of [['보통걸음', 대표], ['제일긴걸음', 제일긴]]) {
    const m = await p.evaluate(({ s, 글 }) => {
      const img = document.querySelector('.buddy img')
      const t = document.querySelector('.cook-timer')
      const svg = t.querySelector('svg')
      const el = document.querySelector('.cook-steptext')
      const body = document.querySelector('.cook-body')
      img.style.height = `${s.곰}px`
      t.style.fontSize = `${s.글}px`; t.style.padding = `${s.위}px ${s.옆}px`
      t.style.borderRadius = `${s.둥글}px`; t.style.gap = `${s.틈}px`
      if (svg) { svg.setAttribute('width', s.아이콘); svg.setAttribute('height', s.아이콘) }
      el.textContent = 글
      // ⭐ 「자리가 남나」 = 굴릴 것이 있나. 1px 은 반올림 오차라 봐준다
      const 굴릴것 = Math.max(0, body.scrollHeight - body.clientHeight)
      const tr = t.getBoundingClientRect()
      return {
        // ⛔ `getBoundingClientRect()` 로 재면 «틀린다» — 곰에 모션 클래스(`hk-m-*`)가 붙어 있어
        //    그 순간의 scale 까지 같이 잰다(132 를 줬는데 153 으로 나왔다). 레이아웃 키를 본다.
        곰: Math.round(parseFloat(getComputedStyle(img).height)),
        타이머키: Math.round(tr.height), 타이머폭: Math.round(tr.width),
        속내용키: Math.round(body.scrollHeight), 그릇키: Math.round(body.clientHeight),
        굴릴것,
      }
    }, { s, 글 })
    잰값.push({ ...s, 글쓰임, ...m })
  }
  // 📸 눈으로도 (절대원칙 21) — 보통 걸음으로 한 판씩
  await p.evaluate((t) => { document.querySelector('.cook-steptext').textContent = t }, 대표)
  await p.waitForTimeout(250)
  await p.screenshot({ path: join(OUT, `${s.id}-${s.이름}-곰${s.곰}-타이머${s.글}.png`) })
}

console.log(`\n   보통 걸음(중앙값 ${대표.length}자) = "${대표}"`)
console.log(`   제일 긴 걸음(${제일긴.length}자) = "${제일긴}"\n`)
for (const r of 잰값) {
  console.log(`  · ${r.id} ${r.이름.padEnd(3)} 곰 ${String(r.곰).padStart(3)}px · 타이머 ${r.글}px(${r.타이머키}×${r.타이머폭})` +
    ` │ ${r.글쓰임.padEnd(6)} 내용 ${String(r.속내용키).padStart(3)} / 그릇 ${r.그릇키}px` +
    ` │ ${r.굴릴것 <= 1 ? '✅ 스크롤 0' : `⛔ 굴릴 것 ${r.굴릴것}px`}`)
}

// 📸 ＋ 제일 긴 걸음도 «제일 큰» 단계로 한 판 (최악을 본다)
const 끝 = 단계[단계.length - 1]
await p.evaluate(({ s, 글 }) => {
  const img = document.querySelector('.buddy img'), t = document.querySelector('.cook-timer')
  const svg = t.querySelector('svg'), el = document.querySelector('.cook-steptext')
  img.style.height = `${s.곰}px`
  t.style.fontSize = `${s.글}px`; t.style.padding = `${s.위}px ${s.옆}px`
  t.style.borderRadius = `${s.둥글}px`; t.style.gap = `${s.틈}px`
  if (svg) { svg.setAttribute('width', s.아이콘); svg.setAttribute('height', s.아이콘) }
  el.textContent = 글
}, { s: 끝, 글: 제일긴 })
await p.waitForTimeout(250)
await p.screenshot({ path: join(OUT, `최악-${끝.id}-제일긴걸음.png`) })

await ctx.close(); await b.close(); srv.close()

// ⚠️ 스스로 검사 — 「자리가 많다」가 사실이어야 이 판이 뜻이 있다
const 넘친것 = 잰값.filter((r) => r.굴릴것 > 1)
console.log(넘친것.length === 0
  ? `\n✅ 네 단계 × 두 걸음 = ${잰값.length}칸 전부 스크롤 0 — 창업자 말대로 «자리가 많다»`
  : `\n⛔ ${넘친것.length}칸이 넘쳤다: ${넘친것.map((r) => `${r.id}/${r.글쓰임}(${r.굴릴것}px)`).join(' · ')}`)
console.log(`\n📁 ${OUT}`)
process.exit(넘친것.length ? 1 : 0)
