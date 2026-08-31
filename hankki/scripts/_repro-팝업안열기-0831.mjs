// 🚫📣 **「앞으로 열지 않기 — 켜면 «다음 달 새 소식»에도 안 뜨나」 재현판**
//
// 📮 창업자 2026-08-31 = *"가을팩 안내는 선물이니까 팝업으로 띄우고(저대로)
//    **앞으로 열지않기 하면 안열리게.** 할 수 있어?"*
//
// ⭐⭐ **심장 = 「앞으로」다.** 「이번 것 안 보기」는 원래도 됐다(`hankki:news:seen`).
//    새로 만든 것은 **소식이 «바뀌어도» 안 뜨는 것**이라, 그걸 재려면
//    **달을 넘겨서** 봐야 한다(9/1 켜고 → 10/1 에도 안 뜨나).
//    ⛔ 9/1 에서 새로고침만 해보면 «옛 장치»로도 통과한다 = 아무것도 안 재는 판(규칙 18 ⓘ).
//
// ⭐ 대조군을 같이 잰다 — **안 켠 사람은 10/1 에 뜬다.** 둘 다 나와야 증명이다
//    (보안 규칙을 「내 칸 ✅ ＋ 남의 칸 ⛔」로 재는 것과 같은 생각).
//
// ⛔ 끄고 나서 **잃는 게 없어야 한다** — 소식 페이지는 그대로 열리고 가을팩이 거기 있다.
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-팝업안열기-0831.mjs
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

let 죽음 = 0
const 나쁨 = (m) => { console.error(`  ✗ ${m}`); 죽음++ }
const 좋음 = (m) => console.log(`  ok  ${m}`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 한 사람(브라우저 칸) — 날짜를 갈아끼우며 계속 쓴다
const 사람 = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  return { ctx, p }
}
const 열기 = async ({ ctx, p }, iso) => {
  await ctx.clock.setFixedTime(new Date(iso))
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1300)
  // 팝업인지 아닌지 = 「구경하기」 단추가 있나 (소식 시트엔 없다)
  return await p.locator('.sheet-mask button', { hasText: '구경하기' }).count() > 0
}

console.log('\n── 🚫 앞으로 열지 않기 ──')

// ① 9/1 — 팝업이 뜬다 (안 뜨면 이 판이 아무것도 못 잰다)
const A = await 사람()
if (await 열기(A, '2026-09-01T03:00:00Z')) 좋음('9/1 에 팝업이 뜬다')
else 나쁨('9/1 에 팝업이 «안» 뜬다 — 이 판이 아무것도 못 잰다')

// 팝업 «맨 아래»를 찍는다 — 체크 줄이 화면 밖이라 통째 캡처에는 안 나온다
await A.p.locator('.sheet-mask .sheet').evaluate((el) => { el.scrollTop = el.scrollHeight })
await A.p.waitForTimeout(300)
await A.p.locator('.sheet-mask .sheet').screenshot({ path: join(OUT, '팝업-아래.png') }).catch(() => {})

// ② 체크 줄이 «있나»
const 체크 = A.p.locator('.sheet-mask button', { hasText: '앞으로 열지 않기' })
if (await 체크.count()) 좋음('「앞으로 열지 않기」 줄이 있다')
else 나쁨('「앞으로 열지 않기」 줄이 «없다»')

// ③ 눌러서 켜고 닫는다
await 체크.first().click(); await A.p.waitForTimeout(300)
const 켜짐 = await A.p.evaluate(() => { try { return localStorage.getItem('hankki:news:off') } catch { return null } })
if (켜짐 === '1') 좋음('누르니 저장됐다 (hankki:news:off = 1)')
else 나쁨(`누르니 저장이 «안» 됐다 (값 = ${켜짐})`)
await A.p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click()
await A.p.waitForTimeout(400)

// ④ 같은 날 새로고침 — 안 뜬다 (⚠️ 옛 장치로도 통과한다. 그래서 ⑤ 가 필요하다)
if (await 열기(A, '2026-09-01T03:00:00Z')) 나쁨('껐는데 같은 날 또 뜬다')
else 좋음('같은 날 새로고침해도 «안» 뜬다')

// ⑤⭐ **심장** — 달을 넘겨 «새 소식»이 열려도 안 뜬다
if (await 열기(A, '2026-10-01T03:00:00Z')) 나쁨('껐는데 10/1 새 소식에 «또» 뜬다 — 「앞으로」가 아니다')
else 좋음('10/1 새 소식에도 «안» 뜬다 — 「앞으로」가 지켜진다')

// ⑥ 껐어도 소식 페이지는 그대로 — 가을팩을 거기서 본다(잃는 게 없다)
await 열기(A, '2026-09-01T03:00:00Z')
await A.p.locator('button.news-card').first().click()
await A.p.waitForTimeout(1200)
const 소식글 = (await A.p.locator('.sheet-mask .sheet').innerText().catch(() => '')) || ''
if (/꾸미기\s*51종|가을이 왔어요/.test(소식글)) 좋음('껐어도 소식 페이지에 가을팩이 있다')
else 나쁨('껐더니 가을팩을 어디서도 못 본다')
if (/살림템/.test(소식글)) 좋음('장바구니 줄도 그대로 있다')
else 나쁨('장바구니 줄이 없다')

// ⑦⭐ 대조군 — **안 켠 사람은 10/1 에 뜬다.** 둘 다 나와야 증명이다
const B = await 사람()
await 열기(B, '2026-09-01T03:00:00Z')
await B.p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click()
await B.p.waitForTimeout(400)
if (await 열기(B, '2026-10-01T03:00:00Z')) 좋음('안 켠 사람은 10/1 에 «뜬다» (대조군)')
else 나쁨('안 켠 사람도 10/1 에 안 뜬다 — 새 소식 알림이 죽었다')

await B.ctx.close(); await A.ctx.close()
await b.close(); srv.close()
console.log(죽음 ? `\n⛔ ${죽음}칸 실패` : '\n✅ 전부 통과')
process.exit(죽음 ? 1 : 0)
