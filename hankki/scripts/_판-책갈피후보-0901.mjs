// 🔖✏️ **「책갈피」 다른 이름 후보 — 실제 화면에 얹어서 견준다** (창업자 2026-09-01 *"다른이름을 더 보고 싶다."*)
//
// ⛔ 소스를 안 고친다 — 화면에 그려진 글자만 갈아끼워 찍는다(절대원칙 30).
//
// 🔢 **후보를 고른 잣대 넷** (전부 실측으로 걸렀다)
//   ⑴ **앱이 이미 쓰는 말과 안 겹칠 것** — 겹치면 유저가 다른 기능으로 읽는다
//      ⛔ 죽은 후보 = **「찜」**(갈비찜·계란찜·찜닭… 요리 이름으로 **104곳**) ·
//         **「나중에」**(「한 줄 남기기」·리뷰 시트의 **버튼 글자**) · **「픽」**(장보기 「이번 주 픽」)
//   ⑵ **영어 금지** — 화면에 보이는 영어 낱말이 0개다(2026-08-18 에 `my pick` 이 이 잣대로 죽었다)
//   ⑶ **뜻을 안 좁힐 것** — 창업자가 2026-08-18 에 콕 집은 조건
//   ⑷ **짧을 것** — 칩이 「이름 N」이라 길면 옆 칩을 밀어낸다 → 그래서 **칩 폭을 px 로 재서** 같이 보여준다
//
// ⭐ 「해먹을 것」은 **창업자 본인 아이디어**다 — 2026-08-18 *"해먹을 것, 맛있었던 것 이런식으로 유저가 정해서 쓰고"*
//
// 실행: node /home/user/hankki/hankki/scripts/_판-책갈피후보-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/이름후보'
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

const 후보 = [
  { id: 'now', 이름: '책갈피', 왜: '지금 이름. 2026-08-18 에 후보 넷을 견줘 정했고 **요리사모자 그림과 한 몸**이다' },
  { id: 'week', 이름: '이번주', 왜: '창업자 안. ⚠️홈의 「이번 주 제철」과 말이 겹치고 설정 통계에서 «시간»으로 읽힌다' },
  { id: 'eat', 이름: '해먹을 것', 왜: '⭐창업자 본인 아이디어(2026-08-18). 뜻이 제일 곧다 — 꽂는 «이유»가 그대로 이름이다' },
  { id: 'try', 이름: '해볼 것', 왜: '위와 같은 뜻인데 두 글자 짧다. 요리 말고 다른 것에도 걸쳐 쓸 수 있다' },
  { id: 'pick', 이름: '골라둔 것', 왜: '「내가 골랐다」가 드러난다. ⚠️다만 «무엇을» 골랐는지는 안 말한다' },
  { id: 'keep', 이름: '챙긴 것', 왜: '짧고 앱 어디와도 안 겹친다(실측 0건). ⚠️뜻이 조금 넓다' },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

const 갈아끼우기 = (새이름) => {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const 바꿀것 = []
  while (walk.nextNode()) if (walk.currentNode.nodeValue.includes('책갈피')) 바꿀것.push(walk.currentNode)
  바꿀것.forEach((n) => { n.nodeValue = n.nodeValue.replaceAll('책갈피', 새이름) })
  document.querySelectorAll('[aria-label*="책갈피"]').forEach((el) => {
    el.setAttribute('aria-label', el.getAttribute('aria-label').replaceAll('책갈피', 새이름))
  })
  return 바꿀것.length
}

async function 앱열기() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  }
  return { ctx, p }
}
const 탭으로 = async (p, 이름) => {
  await p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first().click().catch(() => {})
  await p.waitForTimeout(900)
}
async function 책갈피꽂기(p, 개수 = 3) {
  await 탭으로(p, '레시피')
  const 단추 = p.locator('[aria-label*="책갈피 꽂기"]')
  const n = Math.min(await 단추.count(), 개수)
  for (let i = 0; i < n; i++) { await 단추.nth(0).click().catch(() => {}); await p.waitForTimeout(350) }
  return n
}

const 잰값 = []
for (const c of 후보) {
  // ① 레시피 칩 — 제일 자주 보는 자리 ＋ 칩 «폭»을 잰다
  {
    const { ctx, p } = await 앱열기()
    await 책갈피꽂기(p)
    if (c.id !== 'now') await p.evaluate(갈아끼우기, c.이름)
    await p.waitForTimeout(300)
    // 🔢 칩 폭 — 길면 옆 칩을 밀어낸다(v11.31 「제일 많이 써요」가 칸을 벗어난 그 자리)
    const 폭 = await p.evaluate((nm) => {
      const el = [...document.querySelectorAll('.pill')].find((x) => (x.innerText || '').includes(nm))
      return el ? Math.round(el.getBoundingClientRect().width) : null
    }, c.이름)
    const 파일 = `chip-${c.id}.png`
    await p.screenshot({ path: join(OUT, 파일) })
    잰값.push({ 후보: c.id, 이름: c.이름, 왜: c.왜, 자리: 'chip', 파일, 칩폭: 폭 })
    console.log(`  · ${c.이름.padEnd(6)} 칩 폭 ${String(폭).padStart(3)}px`)
    await ctx.close()
  }
  // ② 설정 — 통계 줄에서 «시간으로 읽히나»가 드러나는 자리
  {
    const { ctx, p } = await 앱열기()
    await 책갈피꽂기(p)
    await 탭으로(p, '홈')
    await p.locator('[aria-label*="설정"]').first().click().catch(() => {})
    await p.waitForTimeout(1000)
    if (c.id !== 'now') await p.evaluate(갈아끼우기, c.이름)
    await p.waitForTimeout(250)
    const 파일 = `set-${c.id}.png`
    await p.screenshot({ path: join(OUT, 파일) })
    잰값.push({ 후보: c.id, 이름: c.이름, 자리: 'set', 파일 })
    await ctx.close()
  }
}
await b.close(); srv.close()

// ⚠️ 스스로 검사 — 칩을 «못 찾았으면» 아무것도 못 잰 것이다(규칙 18 ⓘ)
const 못잼 = 잰값.filter((v) => v.자리 === 'chip' && !v.칩폭)
if (못잼.length) console.error(`\n⛔ 칩을 못 찾은 후보 ${못잼.length}개 — ${못잼.map((v) => v.이름).join(', ')}`)
else console.log('\n✅ 여섯 후보 모두 칩을 찾아 폭을 쟀다')

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰값, null, 2))
console.log(`\n📁 ${OUT}`)
