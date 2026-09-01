// 【⏳ 판정대기 · hold/글자3-0822 · smoke 게이트】 ⛔이 판이 죽으면 배포가 막힌다 — 원문이 안 담기고 있다.
// 📥📥 「담을 때 «원문»도 같이 저장되나」 — 창업자 확정 ⓒ 검증 (2026-08-22)
//
// 📮 창업자 = *"내꺼에는 이런식으로보이거든 순살찜닭"*(폰 캡처 3장) →
//    *"나는 내가 직접한거라 엉망인데 유저꺼에서는 어떻게 보이는지 모르겠어.. 이제 문제네.. 테스트가 안돼"* →
//    *"**네가 고쳐도 나한테 반영이 안되니까..**"* → 갈래 셋에 *"좋아 이런 디테일이 중요해"* · *"네 추천대로할게"*
//    → 확정 = **ⓑ 다시 담기 ＋ ⓒ 앞으로는 원문도 저장**. 이 판은 **ⓒ** 를 잰다.
//
// ⭐⭐⭐ **이 판의 심장 = 「저장됐나」다. ⛔「넘겼나」가 아니다.**
//    v11.00 에서 정확히 이 자리에서 당했다 — `store.jsx` 의 `addShopItem` 이 **필드를 골라** 새 객체를 만들어서,
//    `noBuy` 를 담는 코드를 «써 놓고도» 모르는 필드라 **말없이 버려졌다.**
//    그때 배포 게이트 50개가 전부 초록불이었고 **화면을 열어보고서야** 잡았다.
//    📌 그래서 이 판은 소스를 안 본다 — **`localStorage` 에 진짜로 들어갔나**를 본다.
//
// 🔢 재는 것 다섯
//    ① 붙여넣기로 담으면 `rawText` 가 «저장된다»          — 없으면 ⓒ 가 아예 안 도는 것
//    ② 원문이 «글자 그대로» 들어간다                       — 다듬어서 담으면 다시 읽어도 같은 결과가 나온다
//    ③ 다시 편집해 저장해도 원문이 «안 지워진다»           — 빈 값으로 덮으면 그건 지우는 것이다(규칙 18 ⓙ)
//    ④ 상한(RAW_MAX)을 넘으면 «아예 안 담는다»            — ⛔잘라서 담으면 뒷걸음이 통째로 사라진 «더 나쁜» 판이 된다
//    ⑤ ⭐**담긴 원문으로 «다시 읽을 수 있다»**             — ⓒ 를 만든 «이유» 자체다. 이게 안 되면 그냥 쓰레기 필드다
//
// 🧪 규칙 12 = `EditorScreen.jsx` 의 `if (rawText) patch.rawText = rawText` 를 지우면 ①②③⑤ 가 죽는다.
//    `parseRecipe.js` 의 `keepRaw` 상한을 없애면 ④ 가 죽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-원문저장-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/원문저장'
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
await new Promise((r) => srv.listen(4443, r))

let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(이름, 조건, 덧말 = '') {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}${덧말 ? '  ' + 덧말 : ''}`)
  return !!조건
}

// 🍲 창업자 폰에 실제로 있던 모양 — 「점 없는 번호」로 걸음이 적힌 글.
//    ⭐ 이 글을 고른 이유 = 파서가 «바뀐» 그 모양이라, 원문이 남아야 다시 읽을 값이 있다.
const 원문 = [
  '순살찜닭',
  '닭다리살 600g',
  '감자 2개',
  '당근 1개',
  '양파 1개',
  '대파 1대',
  '간장 5큰술',
  '설탕 2큰술',
  '1 닭다리살을 한입 크기로 썰어요',
  '2 야채를 큼직하게 썰어요',
  '3 물100m,손질한 야채, 양념을 모두 넣고 뚜껑 닫아 10분 끓어요',
  '4 대파를 넣고 한소끔 더 끓여요',
].join('\n')

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { RAW_MAX } = await import('../src/parseRecipe.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const page = await ctx.newPage()
page.on('pageerror', (e) => { 실패++; 실패목록.push('pageerror: ' + e.message) })

// ⛔ `page.reload()` 를 쓰지 않는다 — `addInitScript` 가 다시 돌아 저장값이 시드로 덮인다
//    (`check-mistakes` ⑧ 「옛 함정 사전」 첫 항목). 화면 이동은 앱 안에서만 한다.
await page.goto('http://127.0.0.1:4443/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 저장소를 «직접» 읽는다 — 화면 글자가 아니라 «진짜 담긴 값»을 봐야 한다
const 저장소 = () => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('hankki:v1') || '{}') } catch { return {} }
})
const 찾기 = async (제목) => {
  const s = await 저장소()
  return (s.recipes || []).find((r) => (r.title || '').includes(제목)) || null
}

async function 붙여넣어담기(글, 제목표시) {
  // 상세 화면엔 하단바가 없다 — 「가져오기」가 보일 때까지 뒤로 나온다(⛔reload 금지 · check-mistakes ⑧)
  for (let i = 0; i < 4; i++) {
    if (await page.getByRole('button', { name: '가져오기' }).count()) break
    await page.goBack(); await page.waitForTimeout(600)
  }
  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  // 🗓 [2026-08-28] 목록이 «네 갈래»로 줄면서 「텍스트 붙여넣기」가 목록에서 내려갔다(⛔기능은 살아 있다).
  //    가는 길 = SNS 보다가 캡처해서 바로 한끼로 → Instagram 에서 담는 다른 방법 → 글을 복사했다면 붙여넣기
  await page.getByText('SNS 보다가 캡처해서 바로 한끼로', { exact: true }).first().click()
  await page.waitForTimeout(600)
  await page.getByText('Instagram 에서 담는 다른 방법', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.getByText('글을 복사했다면 붙여넣기', { exact: false }).first().click()
  await page.waitForTimeout(700)
  await page.locator('textarea').first().fill(글)
  await page.waitForTimeout(200)
  await page.getByText('자동 정리하기', { exact: false }).first().click()
  await page.waitForTimeout(900)
  // 제목이 비면 저장이 막히므로 확실히 채운다
  // ⛔ 「첫 input」은 «숨은 파일 고르기 칸»이다 — 잣대는 «그 칸»을 콕 집어야 한다(규칙 18)
  const 제목칸 = page.locator('input[placeholder^="예) 명란"]')
  await 제목칸.fill(제목표시)
  await page.waitForTimeout(200)
  // 🏷 [2026-09-02] 큰 단추 이름이 「레시피 저장」·「정리 완료」 → **「저장」 하나**로 통일됐다.
  //   ⛔ `getByText('저장')` 으로 잡으면 **상단바 「저장」까지** 걸려 어느 걸 눌렀는지 모른다 →
  //      «맨 아래 큰 단추»를 콕 집는다(`button.btn-primary`).
  await page.locator('button.btn-primary', { hasText: '저장' }).first().click()
  await page.waitForTimeout(1100)
}

console.log('\n📥 담을 때 원문도 저장되나 — 창업자 확정 ⓒ 검증\n')

// ── ① 붙여넣기로 담으면 rawText 가 «저장되나» ──
console.log('── ① 붙여넣기 → 저장 ──')
await 붙여넣어담기(원문, '순살찜닭 검사판')
const 담긴것 = await 찾기('순살찜닭 검사판')
chk('① 레시피가 저장됐다', !!담긴것)
chk('② ⭐`rawText` 가 «저장소에» 들어 있다', !!(담긴것 && 담긴것.rawText), 담긴것 ? `(${(담긴것.rawText || '').length}자)` : '')
chk('③ 원문이 «글자 그대로» 들어갔다', 담긴것?.rawText === 원문)
writeFileSync(join(OUT, '1-담긴뒤.png'), await page.screenshot())

// ── ② 다시 편집해 저장해도 원문이 «살아 있나» ──
//    ⛔ 여기가 규칙 18 ⓙ 자리다 — 빈 값으로 덮으면 편집 한 번에 원문이 사라진다.
console.log('\n── ② 다시 편집 → 저장 ──')
await page.getByRole('button', { name: /^레시피/ }).last().click()
await page.waitForTimeout(800)
const 열림 = await page.getByText('순살찜닭 검사판', { exact: false }).first().click().then(() => true).catch(() => false)
await page.waitForTimeout(900)
if (열림) {
  // 상세 → 편집. ⛔글자로 찾지 않는다 — 상단바에 「책갈피」 단추가 겹쳐 클릭을 가로챈다(규칙 18).
  //    `aria-label="편집"` 하나만 콕 집는다(`RecipeDetailScreen.jsx:316`).
  const 편집 = page.locator('button[aria-label="편집"]').last()
  if (await 편집.count()) { await 편집.click(); await page.waitForTimeout(900) }
  const 제목칸 = page.locator('input[placeholder^="예) 명란"]')
  if (await 제목칸.count()) {
    await 제목칸.fill('순살찜닭 검사판2')
    await page.waitForTimeout(200)
    // 🏷 [2026-09-02] 편집 중에도 이름이 「저장」 하나다(옛 「정리 완료」). 위와 같은 잣대를 쓴다.
    await page.locator('button.btn-primary', { hasText: '저장' }).first().click().catch(() => {})
    await page.waitForTimeout(1100)
  }
}
const 편집뒤 = (await 찾기('순살찜닭 검사판2')) || (await 찾기('순살찜닭 검사판'))
chk('④ ⭐편집해 저장해도 원문이 «안 지워졌다»', 편집뒤?.rawText === 원문,
  편집뒤 ? `(제목 ${편집뒤.title} · ${(편집뒤.rawText || '').length}자)` : '(레시피를 못 찾음)')

// ── ③ 너무 긴 원문은 «아예 안 담기나» ──
//    ⛔ 잘라서 담으면 뒷걸음이 사라진 «더 나쁜» 원문이 된다 — 없는 편이 낫다.
console.log('\n── ③ 상한 넘는 원문 ──')
const 긴글 = ['긴레시피', ...Array.from({ length: 400 }, (_, i) => `${i + 1} 아주 긴 걸음 설명을 여기에 적어요`)].join('\n')
console.log(`  · 넣은 글 ${긴글.length}자 (상한 ${RAW_MAX}자)`)
await 붙여넣어담기(긴글, '긴레시피 검사판')
const 긴것 = await 찾기('긴레시피 검사판')
chk('⑤ 긴 레시피도 «저장은» 된다', !!긴것)
chk('⑥ ⭐상한을 넘으면 원문을 «안 담는다»(자르지 않는다)', !!긴것 && !긴것.rawText)

// ── ④ 백업에 실리나 — 폰을 바꿔도 원문이 따라간다 ──
console.log('\n── ④ 백업 ──')
const 백업에 = await page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    // 백업은 store 를 통째로 담는다(`ProfileScreen.buildBackup`) → 저장소에 있으면 백업에도 있다
    return JSON.stringify(s).includes('rawText')
  } catch { return false }
})
chk('⑦ 저장소 JSON 에 `rawText` 가 실린다(＝백업에도 실린다)', 백업에)

// ── ⑤ ⭐담긴 원문으로 «다시 읽을 수 있나» — 이게 ⓒ 를 만든 이유다 ──
console.log('\n── ⑤ 다시 읽기 ──')
const { parseRecipeText } = await import('../src/parseRecipe.js')
const 다시 = 담긴것?.rawText ? parseRecipeText(담긴것.rawText) : null
chk('⑧ ⭐원문을 지금 파서에 다시 넣으면 걸음이 «네 개»로 나온다', 다시?.steps.length === 4,
  다시 ? `(${다시.steps.length}걸음)` : '(원문이 없어 못 읽는다)')
chk('⑨ ⭐다시 읽은 걸음 본문에 번호가 «안 남는다»', !!다시 && !/^\s*\d+\s/.test(다시.steps[2] || ''),
  다시 ? `「${(다시.steps[2] || '').slice(0, 22)}…」` : '')

await b.close(); srv.close()
console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패} 통과`)
if (실패) { console.log('   못 지킨 것: ' + 실패목록.join(' / ')); process.exit(1) }
