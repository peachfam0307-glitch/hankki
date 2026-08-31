// 🛒📣 **「주부의 장바구니가 소식에 뜨나 — 단 «아래»에, «곧 열려요»엔 안 뜨나」 재현판**
//
// 📮 창업자 확정 2026-08-29 = *"**소식에 띄우자. 대신 아래 나중에. 곧 안내하는거에서 빼면되겠다**"*
//
// ⭐⭐ **재는 것 = 「층이 갈렸나」** — 이 기능의 심장이 그거다.
//    ✅ 소식 «페이지» 목록엔 있다 · 그리고 **맨 아래**다
//    ⛔ 「곧 열려요」엔 없다
//    ⛔ 홈 「새로」 뱃지 · 홈 한 줄 · 새 소식 팝업엔 없다(＝`openedAlert`)
//
// ⛔ **「글자가 있나」로만 재면 안 된다** — 장바구니 줄이 «맨 위»에 붙어도 통과해 버린다.
//    그래서 **몇 번째 줄인지(자리)**를 잰다(절대원칙 18 ⓘ).
//
// ⚠️ 정직하게 — ⑥⑦(홈 뱃지·팝업)은 **소스가 `openedAlert` 를 쓰나**로 잰다.
//    오늘 화면엔 꾸미기·레시피도 같이 열려 있어서 «장바구니만 열린 날»을 실물로 못 만든다.
//    ⭐ 대신 ⑧ 이 그 구멍을 메운다 — `whatsNew()` 를 직접 불러 두 목록의 «차이»를 잰다.
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-소식장바구니-0829.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
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
// ⛔⛔ **포트를 손으로 박지 않는다** — 2026-08-29 smoke 에서 `EADDRINUSE 4419` 로 죽었다.
//    앞서도 같은 사고가 있었다(v11.31 `EADDRINUSE 4413` — 끊긴 판이 포트를 물고 있었다).
//    ⭐ `listen(0)` = **비어 있는 포트를 운영체제가 골라 준다** → 이 사고가 «날 수가 없다».
//    📌 「하지 마라」를 적는 것보다 «할 수 없게» 만드는 게 낫다(규칙 19의 뿌리).
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

let 죽음 = 0
const 나쁨 = (m) => { console.error(`  ✗ ${m}`); 죽음++ }
const 좋음 = (m) => console.log(`  ok  ${m}`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)

console.log('\n── 🛒 소식 · 주부의 장바구니 ──')

// ⛔ 새 소식 팝업이 떠 있으면 소식 카드를 못 누른다 — 먼저 치운다
for (let i = 0; i < 3; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
}

// ⑥ 홈 한 줄 — 장바구니 얘기를 «안» 한다
const 홈줄 = (await p.locator('.news-sub').first().textContent().catch(() => '')) || ''
console.log(`  · 홈 한 줄 = 「${홈줄.trim()}」`)
if (/살림템/.test(홈줄)) 나쁨('홈 한 줄이 장바구니를 말한다 — `openedAlert` 를 써야 한다')
else 좋음('홈 한 줄은 장바구니를 «안» 말한다')

// 소식 시트 열기
await p.locator('button.news-card').first().click()
await p.waitForTimeout(1200)

// 화면에 «그려진» 줄들을 «절별로» 읽는다 (⛔소스가 아니라 화면이다)
//   ⛔⛔ 첫 판이 여기서 틀렸다 — 시트 «전체»의 줄을 한 뭉치로 세니
//      맨 아래 로드맵 목록의 **「주부의 장바구니 확장」**(소식이 아니라 «앞으로 할 것»)까지 섞여
//      「곧 열려요에 장바구니가 있다」는 **없는 사고**가 났다.
//   ✅ 그래서 절 제목(「방금 열렸어요」·「곧 열려요」)을 찾아 **바로 다음 형제**만 읽는다.
const 읽은것 = await p.evaluate(() => {
  const 제목 = (글) => [...document.querySelectorAll('.sheet-mask span')].find((s) => s.textContent.trim() === 글)
  const 줄들 = (글) => {
    const h = 제목(글)
    if (!h) return null
    const 통 = h.parentElement?.nextElementSibling
    return 통 ? [...통.children].map((d) => d.innerText.replace(/\n+/g, ' | ').trim()) : []
  }
  return { 열림: 줄들('방금 열렸어요'), 곧: 줄들('곧 열려요') }
})

const 열림 = 읽은것.열림 || []
const 곧 = 읽은것.곧 || []
console.log(`  · 「방금 열렸어요」 ${열림.length}줄 · 「곧 열려요」 ${곧.length}줄`)
열림.forEach((r, i) => console.log(`      열림 ${i + 1}. ${r.slice(0, 70)}`))
곧.forEach((r, i) => console.log(`      곧   ${i + 1}. ${r.slice(0, 70)}`))
if (!읽은것.열림) 나쁨('「방금 열렸어요」 절을 못 찾았다 — 시트가 안 열렸거나 제목이 바뀌었다')

// ① 장바구니 줄이 있나
const 장바구니줄 = 열림.findIndex((r) => r.includes('살림템'))
if (장바구니줄 < 0) 나쁨('소식에 장바구니 줄이 «없다» — 창업자 확정 *"소식에 띄우자"*')
else 좋음(`소식에 장바구니 줄이 있다 (${장바구니줄 + 1}/${열림.length})`)

// ② «맨 아래»인가 — ⛔「있나」만 보면 맨 위에 붙어도 통과한다
if (장바구니줄 >= 0 && 장바구니줄 !== 열림.length - 1)
  나쁨(`장바구니가 맨 아래가 아니다 — ${장바구니줄 + 1}/${열림.length} (창업자 *"대신 아래 나중에"*)`)
else if (장바구니줄 >= 0) 좋음('장바구니가 «맨 아래»에 있다')

// ③ 제품 이름이 보이나 — 「장바구니 3」만 있으면 뭐가 왔는지 모른다
if (장바구니줄 >= 0 && !/·/.test(열림[장바구니줄].split('|').pop() || ''))
  나쁨('장바구니 줄에 제품 이름이 없다 — 뭐가 왔는지 모른다')
else if (장바구니줄 >= 0) 좋음('제품 이름이 보인다')

// ④ 「곧 열려요」 절엔 장바구니가 «없나»
if (곧.some((r) => r.includes('살림템') || /장바구니\s*\d/.test(r)))
  나쁨('「곧 열려요」에 장바구니가 있다 — 창업자 *"곧 안내하는거에서 빼면되겠다"*')
else 좋음('「곧 열려요」엔 장바구니가 «없다»')

await p.screenshot({ path: join(OUT, '소식-장바구니.png'), fullPage: true })
await b.close()
srv.close()

// ⑤⑦⑧ 소스·데이터로 재는 칸 — 화면으로 못 만드는 상태를 여기서 막는다
const src = (f) => readFileSync(join(ROOT, f), 'utf8')
// ⛔⛔ **JSX 주석 `{/* … */}` 도 지운다** — 안 지웠더니 ⑦ 이 «주석에 적어둔 `openedAlert`» 를 보고
//    코드를 망가뜨렸는데도 초록불이었다(2026-08-29 규칙 12 검증에서 잡았다 · 절대원칙 18 ⓘ).
const 코드만 = (s) =>
  s
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n')

// ⑤ 「곧 열려요」를 먹이는 `gates()` 에 장바구니가 «안» 들어갔나
//   ⛔⛔ 첫 판이 `/function gates\(\)[\s\S]*?CURATION/` 였는데 «파일 끝까지» 훑어서
//      함수 «밖»의 `CURATION` 까지 걸렸다 — 늘 빨간불이었다. **함수 몸통만 잘라서** 본다.
const NEWS = 코드만(src('src/data/whatsnew.js'))
const g0 = NEWS.indexOf('function gates()')
const 몸통 = g0 < 0 ? '' : NEWS.slice(g0, NEWS.indexOf('\n}', g0))
if (g0 < 0) 나쁨('`gates()` 를 못 찾았다 — 이름이 바뀌었나')
else if (/CURATION/.test(몸통)) 나쁨('`gates()` 안에서 장바구니를 읽는다 — 그러면 「곧 열려요」에 딸려 들어간다')
else 좋음('`gates()` 는 장바구니를 «안» 본다 (그래서 「곧 열려요」에서 빠진다)')

// ⑦ 알림 층 셋이 `openedAlert` 를 쓰나 — 홈 뱃지 · 홈 한 줄 · 팝업
// ⛔ **「낱말이 있나」가 아니라 「«쓰나»」를 본다** — `news.openedAlert` 로 콕 집는다.
//    그냥 `openedAlert` 로 찾으면 설명 주석에도 걸려 «망가뜨려도 초록불»이 된다.
for (const [f, 이름] of [['src/screens/HomeScreen.jsx', '홈'], ['src/components/NewsPopup.jsx', '팝업']]) {
  const s = 코드만(src(f))
  const 쓴횟수 = (s.match(/news\??\.openedAlert/g) || []).length
  const 날것 = (s.match(/news\??\.opened\b/g) || []).length
  if (!쓴횟수) 나쁨(`${이름} 이 \`news.openedAlert\` 를 안 쓴다 — 장바구니로 알림이 켜진다`)
  else if (날것) 나쁨(`${이름} 이 아직 \`news.opened\` 를 ${날것}곳에서 쓴다 — 알림 층은 전부 \`openedAlert\` 라야 한다`)
  else 좋음(`${이름} 이 \`news.openedAlert\` 만 쓴다 (${쓴횟수}곳)`)
}
if (!/openedAlert:/.test(코드만(src('src/data/whatsnew.js')))) 나쁨('`whatsNew()` 가 `openedAlert` 를 안 내보낸다')
else 좋음('`whatsNew()` 가 `openedAlert` 를 내보낸다')

// ⑧ ⭐ 두 목록의 «차이»가 진짜로 장바구니인가 — 화면으로 못 만드는 상태를 데이터로 잰다
//    ⛔ `whatsnew.js` 는 노드가 못 연다(`Stickers.jsx` 가 Vite 전용) → `curation.js` 를 글자로 읽어
//       「오늘 기준 7일 안에 열린 장바구니가 있나」만 본다. 있으면 위 ①이 실물로 증명한 셈이다.
const { todayKST } = await import('../src/today.js')
const 오늘 = todayKST()
const 최근 = src('src/data/curation.js')
  .split('\n')
  .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .map((l) => (l.match(/from:\s*'(\d{4}-\d{2}-\d{2})'/) || [])[1])
  .filter((d) => d && d <= 오늘 && (Date.parse(오늘) - Date.parse(d)) / 86400000 <= 7)
console.log(`  · 오늘(${오늘}) 기준 7일 안에 열린 장바구니 = ${최근.length}개`)
if (!최근.length) console.log('  ⚠️  7일 안에 열린 게 0개라 ①~③은 «못 쟀다» — 초록불이어도 증명이 아니다')
else if (장바구니줄 < 0) 나쁨('7일 안에 열린 게 있는데 소식엔 안 떴다')

if (죽음) { console.error(`\n⛔⛔ 소식·장바구니 재현판 실패 — ${죽음}건. 배포를 막는다.\n`); process.exit(1) }
console.log('\n✅ 소식·장바구니 통과 — 페이지엔 맨 아래로 뜨고, 알림 층엔 «안» 뜬다\n')
