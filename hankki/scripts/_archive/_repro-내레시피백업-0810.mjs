// 창업자 개인 레시피 90편 백업 파일을 «앱에 실제로 불러와» 확인한다 (규칙 7).
// ⛔ JSON 을 눈으로 보는 것은 검증이 아니다 — 앱이 읽고 화면에 그려야 확인이다.
//    쓰는 법: node scripts/_repro-내레시피백업-0810.mjs <백업.json>
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { SEED_COACH_SEEN } from '../src/coach.js'

const 파일 = process.argv[2]
if (!파일) { console.error('백업 파일 경로를 주세요'); process.exit(1) }
const 백업 = JSON.parse(readFileSync(파일, 'utf-8'))
const 새것 = 백업.recipes.filter((r) => String(r.id || '').startsWith('my-'))

const PORT = 4181
// ⛔ `/hankki/` 가 아니다 — `vite.config.js` 는 `base: './'` 라 preview 는 «루트»로 서빙한다.
//    주소를 잘못 넣으면 HTML 은 SPA fallback 으로 오는데 asset 만 404 라 «화면이 텅 빈» 채 뜬다(2026-08-10 30분 헤맴).
const BASE = `http://127.0.0.1:${PORT}/`
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: process.cwd(), env: process.env, stdio: 'ignore' })
const 기다려 = (ms) => new Promise((r) => setTimeout(r, ms))
// ⛔ 「2.5초 자고 시작」은 안 된다 — 서버가 늦으면 «옛 서버»나 404 를 보고 「화면이 비었다」로 잘못 판단한다
for (let i = 0; i < 40; i++) {
  try { const r = await fetch(BASE); if (r.ok) break } catch { /* 아직 */ }
  await 기다려(300)
}

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })
// ⛔ 안내 코치 오버레이가 화면을 덮어 클릭이 통째로 막힌다 — smoke.mjs 와 같은 처방
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`localStorage.setItem('hankki:onboarded','1')`)
const page = await ctx.newPage()
const 오류 = []
page.on('pageerror', (e) => 오류.push(String(e)))

const 칸 = []
const 재라 = (이름, 통과, 값) => { 칸.push({ 이름, 통과, 값 }); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${값}`) }

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1800)
  const 전 = await page.evaluate(() => (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).length)

  // 설정 → 백업 → 파일 불러오기
  await page.locator('[aria-label*="설정"]').first().click()
  await page.waitForTimeout(500)
  await page.getByText('백업 · 내보내기', { exact: false }).first().click()
  await page.waitForTimeout(700)
  // ⛔⛔ `setInputFiles` 를 쓰지 말 것 — `display:none` 인 input 에선 React 의 onChange 가 «안 깨어난다».
  //    files 는 채워지는데 핸들러가 안 돌아 「시트가 안 뜬다」로 보이고, 앱 버그로 오해하게 된다(2026-08-10 30분 헤맴).
  //    갈라 본 방법 = DataTransfer 로 넣으니 바로 떴다 → 앱은 멀쩡하고 도구 궁합 문제였다.
  await page.evaluate((txt) => {
    const i = [...document.querySelectorAll('input[type=file]')].find((x) => (x.accept || '').includes('json'))
    const dt = new DataTransfer()
    dt.items.add(new File([txt], 'backup.json', { type: 'application/json' }))
    i.files = dt.files
    i.dispatchEvent(new Event('change', { bubbles: true }))
  }, readFileSync(파일, 'utf-8'))
  // ⚠️ 2MB JSON 을 FileReader 로 읽고 파싱한다 — 「확인 시트가 뜰 때까지」 기다린다(고정 대기는 짧으면 그냥 실패한다)
  await page.getByText('백업 불러오기', { exact: false }).first().waitFor({ timeout: 20000 })
  await page.waitForTimeout(400)
  console.log('   시트 글자:', (await page.evaluate(() => document.querySelector('.sheet-mask')?.innerText || '')).replace(/\n+/g, ' / ').slice(0, 120))
  await page.getByRole('button', { name: '불러오기', exact: true }).first().click()
  await page.waitForTimeout(2000)

  const 후 = await page.evaluate(() => (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).length)
  재라('불러오기 — 레시피 수', 후 === 백업.recipes.length, `${전} → ${후} (파일 ${백업.recipes.length})`)

  const 폴더 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').folders || [])
  재라('폴더', 폴더.length === 백업.folders.length, 폴더.join(' · '))

  // ⚠️ 저장만 됐나가 아니라 «화면에 그려지나» 를 본다 — 목록에서 실제로 찾아 연다
  const 볼것 = ['제육볶음(a, 간장)', '닭볶음탕', '전 반죽', '양지수육']
  for (const 제목 of 볼것) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: '레시피', exact: true }).first().click()
    await page.waitForTimeout(500)
    const 찾기 = page.locator('input[placeholder*="찾"], input[type="search"]').first()
    if (await 찾기.count()) { await 찾기.fill(제목.split('(')[0]); await page.waitForTimeout(500) }
    const 카드 = page.locator('.grid-card, .mini-card').filter({ hasText: 제목.split('(')[0] }).first()
    if (!(await 카드.count())) { 재라(`목록 · ${제목}`, false, '목록에 안 보인다'); continue }
    await 카드.click()
    await page.waitForTimeout(700)
    const 글 = await page.evaluate(() => document.body.innerText)
    const 원본 = 새것.find((r) => r.title === 제목)
    const 재료있나 = 원본.ingredients.length === 0 || 글.includes(원본.ingredients[0].slice(0, 8))
    const 메모있나 = 글.includes('내가 적어둔 그대로')
    재라(`상세 · ${제목}`, 재료있나 && 메모있나, `재료 ${재료있나 ? 'O' : 'X'} · 메모 ${메모있나 ? 'O' : 'X'}`)
  }

  // 분수가 안 쪼개졌나 — 90편 전체를 «저장된 값»에서 다시 잰다
  const 쪼개짐 = await page.evaluate(() => {
    const rs = (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).filter((r) => String(r.id || '').startsWith('my-'))
    const 나쁜 = []
    for (const r of rs) for (const i of r.ingredients || []) if (/\d큰술\s*\/\s*\d/.test(i)) 나쁜.push(`${r.title}: ${i}`)
    return 나쁜
  })
  재라('분수 안 쪼개짐', 쪼개짐.length === 0, 쪼개짐.length ? 쪼개짐.join(' / ') : '0건')

  const 빈편 = 새것.filter((r) => !r.ingredients.length && !r.steps.length)
  재라('재료·순서 둘 다 빈 편', 빈편.length === 0, 빈편.length ? 빈편.map((r) => r.title).join(' · ') : '0편')

  재라('pageerror', 오류.length === 0, 오류.length ? 오류[0] : '0건')
} catch (e) {
  재라('돌리는 중', false, String(e).slice(0, 200))
} finally {
  await browser.close()
  srv.kill()  // ⛔ spawn 한 자식이 이벤트 루프를 붙잡는다 — 안 죽이면 스크립트가 안 끝난다
}

const 진 = 칸.filter((c) => !c.통과)
console.log(`\n${진.length ? '⛔' : '✅'} ${칸.length - 진.length}/${칸.length} 통과`)
process.exit(진.length ? 1 : 0)
