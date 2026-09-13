// 🚪 [2026-09-13 · 창업자 제보] *"쓰던내용버리기 안되거든?? 나가지질않아"*
//   ✕(닫기) → 「쓰던 내용, 어떻게 할까요?」 → 「버리기」 를 눌러도 편집 화면이 «안 닫힌다».
//   ⛔ 짐작으로 고치지 않는다 — 먼저 그 자리를 그대로 밟아 본다(규칙 7).
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const R = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(R, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

let 나쁨 = 0
const 잰다 = (ok, 말, 값) => { console.log(`  ${ok ? '✅' : '⛔'} ${말}${값 === undefined ? '' : ' — ' + String(값).slice(0, 70)}`); if (!ok) 나쁨++ }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 393, height: 852 } })).newPage()
p.on('pageerror', (e) => console.log('  💥 pageerror:', String(e).slice(0, 120)))
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await p.goto(`http://localhost:${port}/hankki/`)
await p.waitForTimeout(2200)

// ① 가져오기 → 직접 입력하기
await p.getByText('가져오기', { exact: true }).first().click()
await p.waitForTimeout(900)
await p.getByText('직접 입력하기', { exact: true }).first().click()
await p.waitForTimeout(1000)
// ⛔ 안내 화면이 한 겹 더 있다 — 「빈 종이 열기」를 눌러야 편집으로 간다(눈으로 찾았다)
await p.getByText('빈 종이 열기', { exact: true }).first().click()
await p.waitForTimeout(1200)
잰다(await p.getByText('직접 작성하기').first().isVisible().catch(() => false), '① 편집 화면이 열렸다')
if (!(await p.getByText('직접 작성하기').first().isVisible().catch(() => false))) {
  await p.screenshot({ path: '/tmp/claude-0/버리기-어디서막힘.png' })
  console.log('  📸 /tmp/claude-0/버리기-어디서막힘.png 를 열어 볼 것')
  await b.close(); srv.close(); process.exit(1)
}

// ② 제목에 글자를 넣는다(= 초안이 생긴다)
// ⛔ `input` 첫 번째가 «안 보이는» 파일 고르개였다(사진 가져오기) → 보이는 칸만 고른다
const 제목 = p.locator('input:visible').first()
await 제목.fill('버리기 시험')
await p.waitForTimeout(700)
const 초안있나 = await p.evaluate(() => !!localStorage.getItem('hankki:editorDraft'))
잰다(초안있나, '② 임시저장(초안)이 생겼다')

// ③ ✕ 를 누른다 → 물음이 떠야 한다
// ⛔ ✕ 가 여러 겹이다 — «맨 위» 화면(편집)의 것을 눌러야 한다
await p.getByLabel('닫기').last().click()
await p.waitForTimeout(800)
잰다(await p.getByText('쓰던 내용, 어떻게 할까요?').first().isVisible().catch(() => false), '③ 「어떻게 할까요?」 물음이 떴다')
// 🔎 가설 = 시트가 «자기 히스토리 칸»을 쓴다 → nav.pop()(history.back)이 그 칸만 먹는다
const 칸수 = await p.evaluate(() => history.length)
console.log('  🔢 시트가 뜬 뒤 history.length =', 칸수)

// ④ 「버리기」 → 화면이 «나가야» 한다
await p.getByText('버리기', { exact: true }).first().click()
await p.waitForTimeout(1500)
const 아직편집 = await p.getByText('직접 작성하기').first().isVisible().catch(() => false)
잰다(!아직편집, '④ 편집 화면에서 «나갔다»', 아직편집 ? '⛔ 아직 「직접 작성하기」가 보인다' : '나갔다')
const 초안남았나 = await p.evaluate(() => !!localStorage.getItem('hankki:editorDraft'))
잰다(!초안남았나, '⑤ 초안이 지워졌다', 초안남았나 ? '⛔ 아직 남아 있다' : '지워졌다')

await p.screenshot({ path: '/tmp/claude-0/버리기-끝화면.png' })
await b.close(); srv.close()
console.log(나쁨 ? `⛔ ${나쁨}칸 실패 → /tmp/claude-0/버리기-끝화면.png 을 열어 볼 것` : '✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
