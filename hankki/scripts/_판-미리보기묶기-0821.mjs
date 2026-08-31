// 🔗📦 미리보기 판 «묶기» — 실제로 부르는 그림만 담는다 (2026-08-21)
//
// ⛔⛔ 왜 = 통째로는 **2,212개 · 366MB** 다. 창업자가 대시보드에 끌어 올릴 크기가 아니다.
//    🔢 실측 = PNG 2,139개 356MB · **그 밖 전부 8.1MB**. 즉 무게는 전부 스티커 그림이다.
// ⛔ 그렇다고 그림을 몽땅 빼면 «깨진 앱»을 판정하게 된다 — 그건 판정이 아니다.
// ✅ 그래서 **앱을 실제로 걸어 다니며 «부른 것»을 받아 적는다.** 짐작이 아니라 실측이다(절대원칙 21·30).
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync, copyFileSync, rmSync, existsSync, writeFileSync, readdirSync } from 'node:fs'
import { extname, join, dirname, relative } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = '/home/user/hankki/hankki/dist-preview'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(DIST, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4611, r))

const 부른것 = new Set()
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
ctx.on('request', (r) => {
  const u = r.url()
  if (u.startsWith('http://localhost:4611/')) 부른것.add(decodeURIComponent(new URL(u).pathname).replace(/^\//, ''))
})

const pg = await ctx.newPage()
await pg.addInitScript(SEED_COACH_SEEN)
await pg.goto('http://localhost:4611/', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(2500)

const 눌러 = async (이름) => {
  try { await pg.getByRole('button', { name: 이름, exact: true }).first().click({ timeout: 2500 }); await pg.waitForTimeout(1400) }
  catch { /* 없으면 지나간다 */ }
}
// ① 첫 화면(클라우드 문)을 지나간다
await 눌러('나중에 하기'); await 눌러('그냥 시작하기')
// ② 소개를 지나간다
for (let i = 0; i < 12; i++) { await 눌러('다음'); }
await 눌러('한끼 시작하기'); await 눌러('건너뛰기')
await pg.waitForTimeout(1500)
// ③ 탭을 다 걸어 다닌다 — ⛔⛔ «굴려야» 뜨는 그림이 있다(lazy)
//    첫 판에서 이걸 안 해서 레시피 38 · 장보기 12 · 설정 12 개가 깨졌다(재현판이 잡았다).
const 끝까지굴리기 = async () => {
  let 전 = -1
  for (let i = 0; i < 30; i++) {
    const 지금 = await pg.evaluate(() => { const el = document.scrollingElement; el.scrollTop += 700; return el.scrollTop })
    await pg.waitForTimeout(420)
    if (지금 === 전) break
    전 = 지금
  }
  await pg.evaluate(() => { document.scrollingElement.scrollTop = 0 })
  await pg.waitForTimeout(400)
}
const 셈 = () => [...부른것].filter((p) => /\.(png|webp)$/i.test(p)).length
console.log('  · 소개 지난 뒤 png=', 셈())
// ⛔⛔ 「가져오기」를 «맨 뒤로» 뺐다 — 그 탭을 밟으면 «그 뒤 걸음이 통째로 죽는다».
//    🔢 실측 = 가져오기를 중간에 두면 탭 여섯을 다 지나도 그림이 58 에서 «한 장도» 안 는다.
//       빼면 58 → 107 로 는다. (진단판 `_diag-0821.mjs` 이 갈랐다)
//    ⚠️ 「왜 죽는지」는 못 밝혔다 — 파일 고르는 창이 뜨는 것으로 짐작할 뿐이다. ⛔짐작을 사실로 적지 말 것.
//    📌 이 판의 목적은 «그림 목록»이라, 원인을 파느니 순서를 바꾸는 게 싸다.
for (const t of ['홈', '레시피', '일기', '장보기', '레꾸자랑']) {
  await 눌러(t); await pg.waitForTimeout(1600); await 끝까지굴리기()
  console.log(`  · ${t} 뒤 png=`, 셈())
}
// ④ 레시피 몇 개를 열어 본다 (음식 그림이 거기서 뜬다)
await 눌러('레시피'); await pg.waitForTimeout(1200)
for (let i = 0; i < 6; i++) {
  try {
    const cards = pg.locator('.rc-card, .recipe-card, [class*="card"]')
    await cards.nth(i).click({ timeout: 2000 }); await pg.waitForTimeout(1200)
    await pg.goBack({ timeout: 2000 }); await pg.waitForTimeout(900)
  } catch { /* noop */ }
}
// ⑤ 설정 — 클라우드 카드·시트
await 눌러('설정'); await pg.waitForTimeout(1500); await 끝까지굴리기()

await ctx.close(); await b.close(); srv.close()

// 📦 묶는다 — «부른 것» ＋ «그림이 아닌 것 전부»(8.1MB 라 통째로 담아도 싸다)
if (existsSync(OUT)) rmSync(OUT, { recursive: true })
const 모든파일 = []
;(function 훑기 (d) { for (const n of readdirSync(d, { withFileTypes: true })) { const f = join(d, n.name); n.isDirectory() ? 훑기(f) : 모든파일.push(relative(DIST, f)) } })(DIST)

let 담음 = 0, 뺀것 = 0, 담은바이트 = 0
for (const rel of 모든파일) {
  const 그림 = /\.(png|webp)$/i.test(rel)
  const 담을까 = !그림 || 부른것.has(rel)
  if (!담을까) { 뺀것++; continue }
  const dst = join(OUT, rel)
  mkdirSync(dirname(dst), { recursive: true })
  copyFileSync(join(DIST, rel), dst)
  담음++; 담은바이트 += statSync(dst).size
}

// ⛔⛔⛔ [2026-08-27] `_redirects` 를 «쓰지 않는다». 여기 있던 한 줄이 화면을 하얗게 만들었다.
//   옛 줄 = `/assets/* → peachfam0307-glitch.github.io/hankki/assets/:splat 302`
//   그때 나는 *"해시가 어긋나면 «그 그림만» 안 뜬다 — 앱이 죽지는 않는다"* 고 적었다. **틀렸다.**
//   🔢 `/assets/` 안에는 그림만 있는 게 아니라 **앱의 심장**이 같은 폴더에 있다 —
//      index-*.js(1.5MB) · index-*.css · firebase-*.js
//   👉 규칙이 `/assets/*` 를 통째로 옛 주소로 넘기는데 그 사이 판이 여럿 나가 해시가 다 바뀌어
//      **JS 가 404 → 앱이 아예 안 그려진다.** 창업자 = *"암것도안떠"* → (10초 확인) *"404나왔어"*
//   📌 배운 것 = 「이건 X 에만 영향」이라고 적을 때 그 자리에 **X «만»** 있는지 세어봤어야 했다.
//   ⛔ 빼도 잃는 게 0 이다 — 그 fallback 은 해시가 바뀐 뒤엔 어차피 전부 404 다.
//      못 담은 그림이 필요하면 «여기서 더 담는다»(걸어 다니는 길을 늘린다). 옛 배포를 가리키지 않는다.
//   ⛔⛔ 2026-08-27 에 이 판을 다시 열었을 때 이 줄이 «그대로» 있었다 —
//      그날은 zip 에서 손으로만 뺐고 «판을 안 고쳤다». 규칙만 적고 장치를 안 고치면 반드시 되풀이된다.
if (existsSync(join(OUT, '_redirects'))) rmSync(join(OUT, '_redirects'))

console.log(`📦 담음 ${담음}개 · ${(담은바이트 / 1048576).toFixed(1)}MB   ⛔뺀 그림 ${뺀것}개`)
console.log(`   부른 그림 = ${[...부른것].filter((p) => /\.(png|webp)$/i.test(p)).length}개`)
console.log(`   → ${OUT}`)
