// 🔍 **요리모드 «아래»에 상단바가 한 번 더 보인다** — 진짜인가 (2026-09-01)
//
// 📸 패드 세로 820×1180 판을 눈으로 보다가 「아래쪽에 제목이 한 번 더 있다」고 여겼다(절대원칙 21).
//
// ✅✅ **답 = 아니다. 내가 잘못 봤다.** 판 아래띠를 잘라서 보니 「이전 / 다음 →」 둘뿐이고 깨끗했다.
//    📌 **큰 판을 줄여서 훑으면 없는 것을 본다.** 의심스러우면 «그 자리만 잘라» 본다(글자 검수 ③과 같은 결).
//
// ⛔⛔ **＋ 이 판의 첫 판정도 «헛경보»였다** — 「보이는 상단바가 둘」이라며 세 화면 다 빨간불을 냈는데,
//    둘째는 **요리모드가 통째로 덮고 있는 홈 상단바**였다. `visibility`·`opacity` 로는 «가려진 것»을 못 본다.
//    ✅ 그래서 판정을 **`elementFromPoint`(그 자리에 «진짜로» 뭐가 있나)** 로 바꿨다 — 규칙 18 ⓘ 그대로다.
//
// ⭐ 그래도 남겨 둔다 — 「요리모드가 뒤 화면을 «빈틈없이» 덮나」는 진짜로 지킬 값이라서다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-요리모드밑겹침-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/겹침'
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

let 죽음 = 0
for (const g of [
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180 },
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820 },
  { id: 'phone', 이름: '폰 390×844', 폭: 390, 높이: 844 },
]) {
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
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1400)

  const m = await p.evaluate(() => {
    const H = window.innerHeight
    // 🔎 화면에 «그려진» 상단바를 다 찾는다 — 요리모드 것 하나만 보여야 한다
    const bars = [...document.querySelectorAll('.topbar, [class*="topbar"], .cook-top, .cook-head')]
    const 보이는것 = bars.map((el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
      const 그려짐 = cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.01 && r.height > 0
      // ⛔ 여기까지는 «상자가 있나»일 뿐이다 — 요리모드가 통째로 덮은 홈 상단바도 이걸 통과한다.
      // ⭐ 진짜 「보이나」 = 그 자리를 손가락으로 찍었을 때 «이 요소가 나오나»(자기 자신 또는 자기 안쪽).
      let 눈에보임 = false
      if (그려짐) {
        const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2)
        const 맨위 = document.elementFromPoint(x, y)
        눈에보임 = !!맨위 && (el === 맨위 || el.contains(맨위) || 맨위.contains(el))
      }
      return {
        글: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30),
        위: Math.round(r.top), 아래: Math.round(r.bottom), 키: Math.round(r.height),
        보임: 눈에보임, 클래스: el.className,
      }
    }).filter((x) => x.보임)
    // ⭐ 진짜 판정 = **화면 아래쪽 한 지점에서 「거기 실제로 뭐가 있나」**(elementFromPoint)
    const 아래점 = document.elementFromPoint(Math.round(window.innerWidth / 2), H - 130)
    const 요리덮개 = document.querySelector('.cook-wrap, .cook, [class*="cook-"]')?.closest('div')
    return {
      화면키: H, 뷰포트키: Math.round(document.documentElement.clientHeight),
      본문키: Math.round(document.body.getBoundingClientRect().height),
      굴릴것: Math.max(0, document.documentElement.scrollHeight - H),
      상단바들: 보이는것,
      아래점이누구: 아래점 ? `${아래점.tagName}.${아래점.className}`.slice(0, 60) : '(없음)',
      요리덮개키: 요리덮개 ? Math.round(요리덮개.getBoundingClientRect().height) : 0,
    }
  })
  console.log(`\n── ${g.이름} ── 화면 ${m.화면키}px · body ${m.본문키}px · 문서에서 굴릴 것 ${m.굴릴것}px`)
  console.log(`   화면 아래(가운데, 밑에서 130px)에 실제로 있는 것 = ${m.아래점이누구}`)
  console.log(`   «보이는» 상단바 ${m.상단바들.length}개:`)
  for (const t of m.상단바들) console.log(`     · y ${String(t.위).padStart(5)}~${String(t.아래).padStart(5)} (키 ${t.키}) "${t.글}"  [${t.클래스}]`)
  if (m.상단바들.length > 1) { 죽음++; console.log(`   ⛔ 상단바가 «둘 이상» 보인다 — 뒤 화면이 삐져나온 것이다`) }
  else console.log(`   ✅ 상단바는 하나뿐이다`)
  await p.screenshot({ path: join(OUT, `${g.id}-전체.png`), fullPage: false })
  await ctx.close()
}
await b.close(); srv.close()
console.log(죽음 ? `\n⛔ ${죽음}칸이 걸렸다` : `\n✅ 세 화면 다 상단바 하나 — 판에서 본 건 «허깨비»가 아니라면 딴 것이다`)
