// 🧑‍🍳 프로필 아이콘 시트에 「우리 애들 · 옷 입은 컷」 5개가 실제로 보이나 — 규칙 21(보여주기 전에 내가 열어본다)
//
// 📮 창업자 2026-09-12 = *"프로필설정에 친구들 컷 추가해주고"* ＋ *"기존꺼에 추가하라는거야"*
// 보는 것 = ①프로필 화면이 맞나 ②시트가 열렸나 ③새 5개 이름이 다 있나 ④깨진 그림(naturalWidth 0)이 없나
// 쓰는 법: node scripts/_shot-프로필친구들-0912.mjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = join(여기, '../../_shots')
if (!existsSync(낼곳)) mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const pg = await b.newPage({ viewport: { width: 390, height: 2400 }, deviceScaleFactor: 2 })
await pg.addInitScript(SEED_COACH_SEEN)
await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1500)
await pg.getByRole('button', { name: /^닫기$/ }).first().click().catch(() => {})
await pg.waitForTimeout(500)

// ⛔ 엉뚱한 화면을 찍고 초록불을 켜지 않는다(규칙 18ⓕ) — 프로필 탭인지 «확인»하고 아니면 죽는다.
await pg.getByRole('button', { name: '프로필' }).first().click({ force: true }).catch(() => {})
await pg.waitForTimeout(900)
await pg.getByRole('button', { name: '프로필 아이콘 바꾸기' }).first().click({ force: true })
await pg.waitForTimeout(900)

const 제목 = await pg.getByText('프로필 아이콘', { exact: true }).count()
if (!제목) { console.log('⛔ 프로필 아이콘 시트가 아니다 — 찍지 않는다'); await b.close(); srv.close(); process.exit(1) }

const 라벨 = await pg.getByText('한끼 친구들 · 옷 입은 컷', { exact: true }).count()
// ⛔ 「우리 애들」은 창업자가 «두 번» 빼라고 한 말이다(2026-09-12) — 한 글자라도 남으면 죽는다.
const 옛말 = await pg.getByText('우리 애들', { exact: false }).count()
const 깨진것 = await pg.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)
// ✂️ 이름표 «겹침» — 📮 창업자 *"오리지널 글씨겹치는거 확인해줘"*
//    칸은 60px 고정인데 이름표가 nowrap 이라, 긴 이름은 칸 밖으로 삐져나와 옆 이름과 붙어 보였다.
//    ⛔ 「눈으로 안 겹쳐 보인다」로 넘기지 않는다 — 글자 폭을 실제로 잰다.
const 넘친것 = await pg.evaluate(() => {
  const out = []
  for (const b of document.querySelectorAll('button[aria-label]')) {
    const s = b.querySelector('span')
    if (!s || !b.style.width) continue
    const 칸 = b.getBoundingClientRect().width
    const 글자 = s.getBoundingClientRect().width
    if (글자 > 칸 + 0.5) out.push(`${s.textContent} 글자 ${Math.round(글자)}px > 칸 ${Math.round(칸)}px`)
  }
  return out
})
const 이름들 = ['꼬르곰', '펭펭', '카롱', '뾰미', '꼬비']
const 개수 = {}
for (const n of 이름들) 개수[n] = await pg.getByRole('button', { name: n, exact: true }).count()

await pg.screenshot({ path: join(낼곳, '프로필친구들-0912.png'), fullPage: true })
console.log('라벨 있나 =', 라벨, '· 깨진 그림 =', 깨진것, '· 「우리 애들」 남은 것 =', 옛말)
console.log('이름별 단추 수(얼굴＋옷 = 2 여야 한다) =', JSON.stringify(개수))
console.log('칸을 넘친 이름표 =', 넘친것.length, 넘친것.length ? JSON.stringify(넘친것, null, 1) : '')
await b.close(); srv.close()

const 나쁨 = !라벨 || 옛말 > 0 || 깨진것 > 0 || 넘친것.length > 0 || 이름들.some((n) => 개수[n] < 2)
console.log(나쁨 ? '⛔ 실패' : '✅ 통과 — _shots/프로필친구들-0912.png')
process.exit(나쁨 ? 1 : 0)
