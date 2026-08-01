// 배포 전 스모크 테스트 — 실제 헤드리스 브라우저로 앱을 열어 '저장' 등 핵심 흐름을
// 눌러보고, 런타임 크래시(pageerror)가 뜨면 프로세스를 실패(exit 1)시켜 배포를 막는다.
//
// 왜: v8.58~v8.66 동안 EditorScreen save()의 스코프 밖 변수 참조(ReferenceError)로
//     '저장'이 8판 내내 먹통이었는데, 배포 전 자동점검이 없어 그대로 나갔다.
//     이 테스트가 CI(build 잡)에서 돌아 같은 류의 크래시를 배포 전에 잡는다.
//
// 설계: 핵심 단정(must)은 실패 시 배포를 막고, 커버리지 투어(tour)는 셀렉터가 어긋나도
//       배포를 막지 않되(오탐 방지) 그 사이 발생한 pageerror 는 전역으로 잡아 하드 실패시킨다.
//
// 로컬:  SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/smoke.mjs
// CI:    npx playwright install --with-deps chromium && node scripts/smoke.mjs
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.SMOKE_PORT || 4173)
const HOST = '127.0.0.1'
const BASE = `http://${HOST}:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined // 샌드박스=직접경로, CI=기본

let previewOut = '' // preview 서버 stdout/stderr — 안 뜰 때 원인 진단용
// 실제 HTTP 응답이 올 때까지 대기(단순 포트 오픈보다 확실). node18+ 전역 fetch 사용.
async function waitHttp(url, timeout = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 안 뜸 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`preview 준비 안 됨(${timeout}ms)\n── preview 출력 ──\n${previewOut.slice(-1000) || '(출력 없음)'}`)
}

const log = (...a) => console.log('[smoke]', ...a)
let server, browser
async function cleanup() {
  try { if (browser) await browser.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
}

const pageErrors = []
const stepFails = []
const softNotes = []

async function must(name, fn) {
  try { await fn(); log('✓', name) }
  catch (e) { stepFails.push(`${name} — ${String(e.message || e).split('\n')[0]}`); log('✗', name) }
}
async function tour(name, fn) {
  try { await fn(); log('·', name) }
  catch (e) { softNotes.push(`${name} — ${String(e.message || e).split('\n')[0]}`) }
}

try {
  log('preview 서버 기동…')
  server = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(), env: process.env,
  })
  server.stdout?.on('data', (d) => { previewOut += d })
  server.stderr?.on('data', (d) => { previewOut += d })
  await waitHttp(BASE)
  log('preview 준비됨:', BASE)

  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
      'hankki:coach:profile'].forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e).split('\n')[0]))

  const openFirstRecipe = () => page.locator('.grid-card button, .grid2 button').first().click()
  const editorOpen = () => page.getByText('사진에서 채우기').first().isVisible().catch(() => false)

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1600)

  // ── 커버리지 B) 신규 작성 → 저장 (addRecipe 경로) · 앱 내에서만 이동 ──
  await tour('신규 레시피 작성 → 저장', async () => {
    await page.getByRole('button', { name: '가져오기' }).first().click(); await page.waitForTimeout(700)
    await page.getByText('직접 작성', { exact: false }).first().click(); await page.waitForTimeout(800)
    await page.getByPlaceholder('예) 명란 크림 파스타').fill('스모크 신규 레시피'); await page.waitForTimeout(200)
    await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1300)
    if (await editorOpen()) stepFails.push('신규 저장 — 저장 후에도 에디터가 안 닫힘(저장 실패)') // 하드 승격
  })

  // 홈 보장(신규 저장 후 popAll → 홈이지만, 실패했을 수도 있으니 명시적으로)
  await tour('홈 복귀', async () => {
    const back = page.getByRole('button', { name: '뒤로' }).first()
    if (await back.isVisible().catch(() => false)) { await back.click({ timeout: 2500 }).catch(() => {}); await page.waitForTimeout(500) }
  })

  // ── 핵심 A) 레시피 편집 → 저장  (v8.58 저장 먹통이 터지던 바로 그 경로) ──
  // 저장 버그(save() 282줄)는 제목 변경 여부와 무관하게 실행되므로, 저장만 눌러도 그 경로를 탄다.
  await must('레시피 편집 → 저장', async () => {
    await openFirstRecipe(); await page.waitForTimeout(700)
    await page.getByRole('button', { name: '편집' }).first().click(); await page.waitForTimeout(800)
    if (!(await editorOpen())) throw new Error('편집 화면이 안 열림')
    await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1300)
    if (await editorOpen()) throw new Error('저장 후에도 에디터가 안 닫힘 = 저장 실패')
  })

  // ── 커버리지 C) 꾸미기 에디터 열기 + 탭 렌더 (렌더 크래시 점검) ──
  // A(편집→저장) 직후엔 상세 화면이므로 곧바로 '레시피 꾸미기'를 연다.
  await tour('레시피 꾸미기 열기·탭 순회', async () => {
    if (!(await page.getByText('레시피 꾸미기').first().isVisible().catch(() => false))) {
      await openFirstRecipe(); await page.waitForTimeout(700)
    }
    await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1200)
    // 🎁 서랍을 처음 열면 «출시기념 팩 안내»가 먼저 뜬다(한 번만). 유저와 같은 순서로 먼저 닫는다.
    //    ⚠️ 안 닫으면 그 아래 탭·「취소」 클릭이 시트 마스크에 먹혀 에디터가 안 닫히고,
    //       그 여파가 다음 투어(하단 탭)까지 번진다. 2026-08-01에 실제로 그랬다.
    await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 2500 }).catch(() => {})
    await page.waitForTimeout(400)
    for (const t of ['데코', '글자', '친구들', '음식', '라이프']) {
      await page.getByText(t, { exact: true }).first().click({ timeout: 2500 }).catch(() => {}); await page.waitForTimeout(300)
    }
    await page.getByRole('button', { name: '취소' }).first().click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(500)
    // 취소 확인 시트가 뜨면 나가기
    await page.getByText('저장 안 함', { exact: false }).first().click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(500)
  })

  // ── 커버리지 D) 하단 탭 순회 (각 화면 렌더 크래시 점검) ──
  // ⚠️ 투어 안의 `back.click()` 두 곳은 원래 `.catch()` 가 없어서, 앞 단계가 조금만 어긋나도
  //    투어가 통째로 죽었다(2026-08-01 안내 시트 추가 때 실제로 터짐).
  //    투어는 «오탐으로 배포를 막지 않는 자리»다 — 다른 클릭들과 똑같이 흘려보낸다.
  await tour('하단 탭 순회', async () => {
    const back = page.getByRole('button', { name: '뒤로' }).first()
    if (await back.isVisible().catch(() => false)) { await back.click({ timeout: 2500 }).catch(() => {}); await page.waitForTimeout(500) }
    for (const t of ['장보기', '레시피', '자랑', '홈']) {
      await page.getByText(t, { exact: true }).last().click({ timeout: 2500 }).catch(() => {}); await page.waitForTimeout(600)
    }
  })
} catch (e) {
  stepFails.push(`실행오류 — ${String(e.message || e).split('\n')[0]}`)
} finally {
  await cleanup()
}

console.log('\n──────── SMOKE 결과 ────────')
if (softNotes.length) { console.log('참고(무시 · 셀렉터 못 찾음 등):'); softNotes.forEach((s) => console.log('  ·', s)) }
if (pageErrors.length || stepFails.length) {
  console.error('❌ SMOKE 실패 — 배포 차단')
  if (pageErrors.length) { console.error('런타임 크래시(pageerror):'); [...new Set(pageErrors)].forEach((e) => console.error('  ✗', e)) }
  if (stepFails.length) { console.error('핵심 단정 실패:'); stepFails.forEach((f) => console.error('  ✗', f)) }
  process.exit(1)
}
console.log('✅ SMOKE 통과 — 저장·핵심 흐름 런타임 에러 없음')
process.exit(0)
