// 🔐 로그인 막힘 팝업 눈검사 (2026-10-19 · 창업자 「팝업 어떻게 열리는지 실물 먼저 보자」) — 아이폰 앱 안을 흉내 내고 로그인 부품이 실패하게 한다
// 🎴📊 [2026-09-24] 레꾸자랑 «재기»를 눈으로 — 실제로 눌러서 ①나가는 카드 그림 ②글·주소 ③찍힌 계측 이름을 뽑는다.
//   폰 공유창은 가짜로 바꿔 끼운다(보낸 파일·글을 그대로 붙잡는다). 「닫기」도 흉내 낸다(AbortError).
//   ⛔ 찍고 재기만 한다. 앱 소스는 안 고친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4517, r))
const OUT = process.env.SHOT_OUT || '/tmp/로그인팝업'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 경우 = [
  ['사파리', 'google', 'Unable to open Safari.'],
  ['애플1000', 'apple', '작업을 완료할 수 없습니다. (com.apple.AuthenticationServices.AuthorizationError 오류 1000.)'],
]
for (const [이름, 쪽, 글] of 경우) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  await ctx.addInitScript(([쪽, 글]) => {
    const 실패 = () => Promise.reject(new Error(글))
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { FirebaseAuthentication: { signInWithGoogle: 쪽 === 'google' ? 실패 : 실패, signInWithApple: 실패, signOut: async () => {} } } }
  }, [쪽, 글])
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4517/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(3000)
  for (let i = 0; i < 14; i++) {
    const g = p.locator('button', { hasText: 쪽 === 'google' ? /Google/ : /Apple/ }).first()
    if (await g.count() && await g.isVisible().catch(() => false)) break
    const n = p.locator('button:has-text("다음"), button:has-text("시작하기"), button:has-text("건너뛰기"), [aria-label="다음 안내 보기"]').first()
    if (!(await n.count())) break
    await n.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500)
  }
  await p.screenshot({ path: join(OUT, `${이름}-0로그인화면.png`) })
  await p.locator('button', { hasText: 쪽 === 'google' ? /Google/ : /Apple/ }).first().click()
  await p.waitForTimeout(1500)
  await p.screenshot({ path: join(OUT, `${이름}-1팝업.png`) })
  // ↻ 닫고 다시 눌러 본다(창업자 「닫았어 다시 했는데 안돼 그럼 팝업이 안열려서」)
  await p.locator('.sheet button', { hasText: '알겠어요' }).first().click().catch(() => {}); await p.waitForTimeout(700)
  const 닫힘 = await p.locator('.sheet').count()
  await p.screenshot({ path: join(OUT, `${이름}-1b닫은뒤.png`) })
  console.log(이름, '닫은 뒤 「한끼에 알리기」 링크', await p.locator('button', { hasText: '한끼에 알리기' }).count())
  await p.locator('button', { hasText: 쪽 === 'google' ? /Google/ : /Apple/ }).first().click(); await p.waitForTimeout(1500)
  const 다시 = await p.locator('.sheet').count()
  await p.screenshot({ path: join(OUT, `${이름}-2다시.png`) })
  console.log(이름, '닫은 뒤 시트', 닫힘, '→ 다시 누른 뒤 시트', 다시)
  console.log(이름, '팝업 글 =', (await p.locator('.sheet').last().innerText().catch(() => '없음')).replace(/\n+/g, ' / '))
  await ctx.close()
}
await b.close(); srv.close()
