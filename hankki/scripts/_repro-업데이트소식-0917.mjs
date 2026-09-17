// 📣 「앱이 달라졌어요」 카드가 한끼 소식에 뜨나 — 재현판 (2026-09-17)
//
// 📮 창업자 = *"우리 업데이트 일지 유저들에게 알려줘야하는거 아닐까?"* → ②(changelog ＋ 게이트) 확정.
//
// 무엇을 재나 (셋)
//   ① 홈 → 「한끼 소식」 → 「방금 열렸어요」에 「앱이 달라졌어요 · 업데이트 N종」 카드가 «실제로» 그려진다
//   ② 그 안에 changelog 의 «user 있는» 줄이 날짜순(최신 위)으로 다 들어 있다 — 21일 창 안의 것만
//   ③ 그 카드는 장바구니 «위», 살구 배경 «아래» — 「장바구니가 맨 아래」(창업자 확정 2026-08-29)를 안 깬다
//   ⛔ 「홈 «새로» 알약이 이것만으로 켜지나」는 여기서 안 잰다 — 그건 openedAlert 필터를 check-changelog 가 정적으로 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-업데이트소식-0917.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const PORT = 4498
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(PORT, r))

const { updateLines } = await import('../src/data/changelog.js')
const { todayKST } = await import('../src/today.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}\n       기대   = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}

const 기대줄 = updateLines(todayKST(), 21)
console.log(`\n📣 「앱이 달라졌어요」 카드 — 오늘 ${todayKST()} · 21일 창 안의 줄 ${기대줄.length}개\n`)

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const c = await b.newContext({ viewport: { width: 390, height: 844 } })
await c.addInitScript(SEED_COACH_SEEN)
await c.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await c.newPage()
await p.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) { const x = p.locator('button:has-text("닫기")').first(); if (await x.count()) { await x.click().catch(() => {}); await p.waitForTimeout(250) } }
await p.locator('text=한끼 소식').first().click()
// ⛔ [CI 2026-09-17 run 2597] 로컬은 통과했는데 CI 에서 ①③이 죽었다 — 페이지 innerText 를 「한끼 소식」 글자로
//    잘라 쓰니 느린 러너에선 자르는 자리가 달랐다(같은 글자가 다른 데도 있다). «시트 요소»를 직접 읽는다.
await p.waitForSelector('.sheet', { timeout: 15000 })
await p.waitForTimeout(600)
const 소식 = await p.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? s.innerText : '' })

console.log('① 카드가 그려진다')
chk('「앱이 달라졌어요」 제목이 있다', 소식.includes('앱이 달라졌어요'), 'true')
chk(`배지가 「업데이트 ${기대줄.length}종」이다`, 소식.includes(`업데이트 ${기대줄.length}종`), 'true')

// 📌 [창업자 2026-09-17] 소식엔 «최신 한 줄만» — 나머지는 설정 「업데이트 내역」이 전부 보여준다
console.log('② 소식엔 최신 한 줄만 · 설정 → 업데이트 내역엔 전부')
chk('최신 줄이 있다', 소식.includes(기대줄[0].user), 'true')
chk('둘째 줄은 소식에 «없다»', 기대줄.length < 2 || !소식.includes(기대줄[1].user), 'true')
chk('「설정 → 업데이트 내역」 안내가 있다', 소식.includes('업데이트 내역'), 'true')

console.log('③ 자리 — 살구 아래 · 장바구니 위')
const i살구 = 소식.indexOf('배경 1종'), i업 = 소식.indexOf('앱이 달라졌어요'), i장 = 소식.indexOf('장바구니')
chk('살구(배경) 다음이다', i살구 < 0 || i살구 < i업, 'true')   // 살구는 21일이 지나면 사라지므로 없으면 통과
chk('장바구니보다 앞이다', i업 < i장, 'true')

// ④ 설정 → 업데이트 내역 — 전부 · 날짜별
console.log('④ 설정 → 업데이트 내역')
await p.locator('button:has-text("닫기")').first().click().catch(() => {})
await p.waitForTimeout(300)
await p.locator('button[aria-label="설정"]').first().click()
await p.waitForTimeout(700)
const 내역줄 = p.locator('text=업데이트 내역').first()
chk('설정에 「업데이트 내역」 줄이 있다', (await 내역줄.count()) > 0, 'true')
if (await 내역줄.count()) { await 내역줄.click(); await p.waitForTimeout(700) }
const 내역 = await p.evaluate(() => document.body.innerText)
const { allUserLines } = await import('../src/data/changelog.js')
const 전부 = allUserLines()
const 빠짐 = 전부.filter((l) => !내역.includes(l.user)).map((l) => l.v)
chk(`업데이트 내역에 ${전부.length}줄이 다 있다`, 빠짐.join(',') || '0', '0')
chk('날짜 머리(「9월 17일」)가 있다', 내역.includes('9월 17일'), 'true')
await p.screenshot({ path: '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/업뎃내역.png' })

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패}`)
if (실패) { console.log('   ' + 실패목록.join('\n   ')); process.exit(1) }
