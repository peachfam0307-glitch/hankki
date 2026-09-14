// 💾 백업 강조 + 기기 이전 안내 — 앱 화면 실물 (창업자 검수용 · 2026-08-16)
//   📮 창업자 *"백업하는 걸 좀 강조해서 알려줘야 할 것 같아. 패드에 깔아서 핸드폰에 내가 저장한 것들 살리는 법도 안내하고."*
//   📮 *"카톡나에게 보내기보다 파일이 편해."* · *"설정에 백업 내보내기는 … 눈에 확띄게"*
//   ⛔ 검수 절대원칙 ⑤ = 실제 앱 렌더. 데이터가 맞아도 화면에서 이상할 수 있다.
//   ⭐ 심장 = 「온보딩 마지막 장의 새 링크를 «눌렀을 때» 백업 시트가 진짜 열리나」.
//      링크가 보이는 것만 확인하면 «죽은 버튼»을 초록불로 통과시킨다(규칙 18 ⓘ).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4373, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
// ⛔ `/opt/pw-browsers/chromium` 를 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다
//    (2026-08-15 에 실제로 배포를 죽였다 · `check-mistakes` 가 지금은 막는다)
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []
const 죽자 = async (why, page) => { console.log(`  ⛔ ${why}`); if (page) await page.screenshot({ path: join(OUT, '백업-실패.png'), fullPage: true }); await b.close(); srv.close(); process.exit(1) }

// ── ① 온보딩 마지막 장 — 새 링크 ──────────────────────────────
// ⛔ `hankki:onboarded` 를 «안» 넣는다 — 새 기기에 갓 깐 사람과 같은 상태라야 한다
const p1 = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
p1.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await p1.addInitScript(SEED_COACH_SEEN)
await p1.goto('http://127.0.0.1:4373/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(1200)

const 링크글 = '이미 다른 기기에서 쓰고 있었어요'
// 마지막 장까지 「다음」으로 간다 — 장수를 숫자로 박지 않는다(장이 늘면 낡는다)
for (let i = 0; i < 20; i++) {
  if (await p1.getByText(링크글, { exact: false }).count()) break
  const 다음 = p1.getByRole('button', { name: /^다음$/ })
  if (!(await 다음.count())) break
  await 다음.click(); await p1.waitForTimeout(650)
}
if (!(await p1.getByText(링크글, { exact: false }).count())) await 죽자('온보딩 마지막 장에 링크가 없다', p1)
console.log('  ✅ 온보딩 마지막 장에 「이미 다른 기기…」 링크 있음')
await p1.screenshot({ path: join(OUT, '백업-1-온보딩끝.png') })

// ── ② 그 링크를 «눌러» 백업 시트가 열리나 ────────────────────
await p1.getByText(링크글, { exact: false }).click()
await p1.waitForTimeout(1400)
if (!(await p1.getByText('새 폰·패드로 옮기기', { exact: false }).count())) await 죽자('링크를 눌렀는데 백업 시트가 안 열린다 (죽은 링크)', p1)
console.log('  ✅ 링크 → 백업 시트가 실제로 열렸다')
await p1.close()

// ── ③ 설정 화면 — 백업 카드가 눈에 띄나 ──────────────────────
const p2 = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
p2.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await p2.addInitScript(SEED_COACH_SEEN)
await p2.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'))
await p2.goto('http://127.0.0.1:4373/hankki/', { waitUntil: 'networkidle' })
await p2.waitForTimeout(1100)
// ⛔ 설정은 하단 탭에 «없다» — 홈 오른쪽 위 아이콘이다(2026-08-16 실측)
await p2.getByLabel('설정').first().click(); await p2.waitForTimeout(900)
await p2.screenshot({ path: join(OUT, '백업-2-설정화면.png') })

// ── ④ 백업 시트 — 위 / 굴려서 아래 ───────────────────────────
await p2.getByText('백업 · 내보내기', { exact: true }).first().click(); await p2.waitForTimeout(900)
await p2.screenshot({ path: join(OUT, '백업-3-시트-위.png') })
await p2.getByText('코드 붙여넣기로 불러오기', { exact: false }).scrollIntoViewIfNeeded()
await p2.waitForTimeout(500)
await p2.screenshot({ path: join(OUT, '백업-4-시트-아래.png') })

console.log(errors.length ? `  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '  ✅ pageerror 0')
await b.close(); srv.close()
if (errors.length) process.exit(1)
