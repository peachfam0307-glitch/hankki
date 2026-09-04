// 📥📥 「사진에서 읽은 원문 보기·복사」 단추 — 재현판 (창업자 확정 2026-08-28 「A가자」)
//
// 📮 창업자 = *"근데 그럼 나머지는 어떻게 잡아? 다른 케이스 테스트해서 계속 보내?"*
//    → 내 답 = 스크린샷은 «느린 길»이다. 결과 화면을 보고 OCR 원문을 «추측»해서 다시 쳐야 하고,
//      추측이 빗나가면 못 고친다(2026-08-28 콩나물 걸음 1 「jangnamcook 21시간 작성자」가 그랬다).
//    → 창업자 판정 = **「A가자 테스트를 해봐야하니까」**
//
// ⭐⭐ 원문(`rawText`)은 **이미 저장되고 있다**(2026-08-22 창업자 확정 · `parseRecipe.js` keepRaw).
//    창업자 폰 안에 진짜 OCR 글자가 이미 들어 있는데 **꺼낼 입구가 없었다.**
//    로드맵 7순위 「다시 읽기 단추 — 자리는 창업자 판정」이 이것이고, 자리가 이제 정해졌다(편집 화면).
//
// ⭐ 용량은 «한 글자도» 안 는다 — 저장은 이미 하고 있고, 이건 «보여주기»만 한다.
//
// ⛔⛔ 복사는 **성공을 단정하지 않는다** — 2026-08-16 사고(ProfileScreen.jsx:195):
//    `clipboard.writeText()` 가 **성공으로 resolve 되고도 실제 복사는 실패**한다.
//    ✅ 그래서 ⑴ 글자를 «화면에 그대로 띄워» 손으로도 긁을 수 있게 하고
//       ⑵ 토스트는 「붙여넣어 확인하세요」로 끝낸다.
//    (원문 상한 4,000자 ≈ 8KB 로 백업 100KB 상한 근처도 아니라 실패할 일은 거의 없다)
//
// 🧪 규칙 12 = 단추를 지우면 ②③④가, 「원문 없으면 안 보인다」를 지우면 ⑤가 죽는다.
//
// 실행: node scripts/_repro-원문보기-0828.mjs
// 🏷 이름표 = 판정대기 (⏳창업자 「배포해」 전 · hold/원문보기-0828)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4462, r))

let 통과 = 0, 실패 = 0
const 실패목록 = []
const 남의탓 = (m) => /tesseract|importScripts|cdn\.jsdelivr|Failed to fetch|NetworkError/i.test(m)
function chk(이름, 조건, 덧말 = '') {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}${덧말 ? '  ' + 덧말 : ''}`)
  return !!조건
}

// 📮 창업자 실물에 가까운 원문 — 인스타 캡처 OCR 이 낸 모양(공심채볶음)
const 원문 = `KT 2:49 9 나였으면 다
게시물
annyeong_hankki 공심채볶음
재료 (2인분)
* 공심채 150g
* 마늘 1큰술 (대충 으깬 것)
만드는 법
* 공심채 150g을 줄기와 잎을 나눠 씻어 손질해요.`

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
// 🍞 토스트는 떴다 사라진다 — 감시자로 전부 적어둔다
await ctx.addInitScript(() => {
  window.__토스트기록 = []
  const 본다 = () => {
    const t = document.body ? document.body.innerText || '' : ''
    for (const 줄 of t.split('\n')) if (줄.includes('원문을 복사') || 줄.includes('복사가 막힌')) window.__토스트기록.push(줄.trim())
  }
  const 붙이기 = () => {
    if (!document.documentElement) return setTimeout(붙이기, 0)
    new MutationObserver(본다).observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  }
  붙이기()
})

console.log('\n📥 「사진에서 읽은 원문」 단추 — 재현판\n')

// 🧭🧭 **「도착했나」를 먼저 잰다** — 2026-08-29 CI 에서 이 판 하나가 죽어 배포가 막혔다.
//    `getByText('공심채볶음').click()` 이 30초 타임아웃을 냈는데 **«왜 안 떴는지»가 로그에 한 줄도 안 남았다.**
//    ⛔ 로컬에선 부하까지 걸어 네 번 돌렸는데 전부 통과 — **원인을 못 찾았다.** 그래서 「고쳤다」가 아니라
//       **「다음에 또 죽으면 원인이 보이게」** 만든 것이다. 정직하게 적어 둔다.
//    ⭐⭐ 심장(②③④⑤)은 **한 글자도 안 건드렸다.** 느슨하게 한 게 아니라 «못 갔는데 통과»를 막는 칸을 **더했다**
//       (2026-08-24 교훈 = *"안 간 화면엔 당연히 옛 이름도 없다 — 통과했는데 아무것도 안 쟀다"*).
//    ⛔ 앞을 막는 시트도 치운다 — 다른 판들은 이미 하는데 이 판만 빠져 있었다.
const 시트치우기 = async (p) => {
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    const 닫기 = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await p.locator('.sheet-mask').first().click({ position: { x: 8, y: 8 }, timeout: 4000 }).catch(() => {})
    await p.waitForTimeout(400)
  }
}
// ⏳⏳ **앱이 «떴는지»부터 본다** — 2026-09-04 CI 실측으로 더한 칸.
//   🔎 그날 빨간불의 알맹이 = `화면 = ` **(빈 글자)** 인데 저장된 레시피 6편은 멀쩡히 있었다.
//      즉 「레시피가 없다」가 아니라 **화면이 통째로 안 그려진 채 20초를 기다렸다**.
//      스모크 4개가 동시에 도는 자리라 CI 가 느릴 때 첫 그리기가 늦는다.
//   ⛔ 20000 을 60000 으로 «넓히지» 않는다 — 그러면 다음엔 60초짜리 빈 화면이 온다(절대원칙 34).
//   ✅ 대신 **기다리는 «대상»을 바꾼다**: 「제목이 보이나」 하나로 두 가지(앱이 떴나 · 그 레시피가 있나)를
//      한꺼번에 재던 것을 둘로 가른다. 그러면 늦게 떠도 통과하고, 진짜로 없으면 그 말이 나온다.
const 앱떴나 = async (p) => {
  try {
    await p.waitForFunction(() => (document.body.innerText || '').trim().length > 0, null, { timeout: 25000 })
    return true
  } catch { return false }
}
const 레시피열기 = async (p, 제목) => {
  await 앱떴나(p)
  await 시트치우기(p)
  const 칸 = p.getByText(제목, { exact: false }).first()
  try {
    await 칸.waitFor({ state: 'visible', timeout: 20000 })
  } catch {
    // ⛔ 그냥 죽으면 다음에도 원인을 모른다 — 화면·저장값·캡처를 남긴다
    const 글 = await p.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => '(못 읽음)')
    const 담긴 = await p.evaluate(() => {
      try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).slice(0, 6).map((r) => r.title).join(' · ') } catch { return '(못 읽음)' }
    }).catch(() => '(못 읽음)')
    await p.screenshot({ path: `/tmp/원문보기-못찾음-${제목}.png` }).catch(() => {})
    chk(`①-b 「${제목}」이 화면에 떴다`, false,
      `화면 = ${String(글).replace(/\n+/g, ' / ').slice(0, 160)} ／ 저장된 레시피 = ${담긴}`)
    return false
  }
  await 칸.click()
  await p.waitForTimeout(400)
  return true
}

// ⛔⛔ **`reload()` 로 다시 열지 않는다** — `addInitScript` 는 reload 때도 «다시» 돌아서
//    방금 심은 저장값을 시드로 덮어쓴다(check-mistakes.mjs 가 잡는 옛 함정이다).
//    ✅ 심은 탭은 닫고 **새 탭**으로 연다 — 저장값은 남고 시드는 다시 안 덮는다.
const seed = await ctx.newPage()
seed.on('pageerror', (e) => { if (!남의탓(e.message)) { 실패++; 실패목록.push('pageerror(심기): ' + e.message) } })
await seed.goto('http://127.0.0.1:4462/hankki/', { waitUntil: 'networkidle' })

// ① 원문이 «있는» 레시피와 «없는» 레시피를 심는다
//
// ⛔⛔ **[2026-08-31 CI 죽음] 심어놓고 «앱이 덮었다».** 배포 #1972 가 이걸로 막혔다.
//    화면에 찍힌 증거 = `저장된 레시피 = 콩국수 · 돼지고기 김치찌개 …` — **우리가 심은 둘이 아예 없다.**
//    ⭐ 뿌리 = 앱이 첫 화면을 그리며 «자기 씨앗»을 저장하는데 그게 «비동기»라,
//       느린 CI 러너에선 **우리 글씨 뒤에 앱 글씨가 늦게 도착해** 통째로 덮인다.
//       (내 컴퓨터에선 앱이 먼저 끝나서 안 겪는다 — 그래서 로컬 111/111 이고 CI 만 죽었다)
//    ⛔ 「기다리는 시간을 늘린다」로 풀지 않는다 — 그건 느린 날 또 진다.
//    ✅ **남았나를 «확인»하고, 덮였으면 다시 심는다.** 두 번 연달아 남아 있어야 넘어간다.
const 심기 = (raw) => {
  const cur = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  cur.recipes = [
    { id: 'r-raw', title: '공심채볶음', ingredients: ['공심채 150g'], steps: ['손질해요.'], tags: [], folder: '전체', savedAt: Date.now(), rawText: raw },
    { id: 'r-noraw', title: '옛날레시피', ingredients: ['두부 1모'], steps: ['부쳐요.'], tags: [], folder: '전체', savedAt: Date.now() },
    ...(cur.recipes || []).filter((r) => r.id !== 'r-raw' && r.id !== 'r-noraw'),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(cur))
}
const 남았나 = () => {
  try {
    const ids = (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).map((r) => r.id)
    return ids.includes('r-raw') && ids.includes('r-noraw')
  } catch { return false }
}
let 굳었나 = false
for (let i = 0; i < 8 && !굳었나; i++) {
  await seed.evaluate(심기, 원문)
  await seed.waitForTimeout(400)
  if (!(await seed.evaluate(남았나))) continue      // 앱이 덮었다 → 다시 심는다
  await seed.waitForTimeout(600)
  굳었나 = await seed.evaluate(남았나)              // 두 번 연달아 남아 있어야 «굳은» 것이다
}
await seed.close()
if (!굳었나) { chk('① 심은 레시피가 «굳었다»', false, '앱 씨앗이 계속 덮는다 — 여기서 멈춘다'); }
console.log('① 원문 있는 레시피 · 없는 레시피를 심었다' + (굳었나 ? '' : ' ⛔(못 굳혔다)'))

// ② 편집 화면에 「사진에서 읽은 원문」 입구가 있나
const page = await ctx.newPage()
page.on('pageerror', (e) => { if (!남의탓(e.message)) { 실패++; 실패목록.push('pageerror: ' + e.message) } })
await page.goto('http://127.0.0.1:4462/hankki/', { waitUntil: 'networkidle' })
const 열렸나 = await 레시피열기(page, '공심채볶음')
if (열렸나) {
  await page.locator('[aria-label="편집"]').first().click()
  await page.waitForTimeout(500)
}
const 입구 = page.getByRole('button', { name: /사진에서 읽은 원문/ })
chk('② 편집 화면에 「사진에서 읽은 원문」 입구가 있다', 열렸나 && await 입구.count() > 0)

// ③ 펼치면 «진짜 원문 글자»가 화면에 나온다 (손으로 긁을 수 있게)
if (await 입구.count() > 0) {
  await 입구.first().click()
  await page.waitForTimeout(300)
}
const 글칸 = page.locator('textarea[data-raw="1"]')
const 나온글 = await 글칸.count() > 0 ? await 글칸.first().inputValue() : ''
chk('③ 펼치면 원문이 «그대로» 나온다', 나온글.includes('annyeong_hankki 공심채볶음') && 나온글.includes('KT 2:49'),
    나온글 ? `${나온글.length}자` : '(안 나옴)')

// ④ 복사 단추가 있고, 눌러도 «성공을 단정하지 않는다»
const 복사 = page.getByRole('button', { name: /복사/ })
const 복사있나 = chk('④ 「복사」 단추가 있다', await 복사.count() > 0)
if (복사있나) {
  await 복사.first().click()
  await page.waitForTimeout(400)
  const 토스트 = await page.evaluate(() => (window.__토스트기록 || []).join(' | '))
  chk('④-b 토스트가 「붙여넣어 확인」을 말한다 (성공 단정 금지 · 2026-08-16 사고)',
      /원문을 복사했어요.*붙여넣어.*확인/.test(토스트), 토스트 || '(토스트 없음)')
}

// ⑤ 원문이 «없는» 레시피에는 입구를 안 그린다 (없는 걸 있는 척하지 않는다)
await page.goto('http://127.0.0.1:4462/hankki/', { waitUntil: 'networkidle' })
const 열렸나2 = await 레시피열기(page, '옛날레시피')
if (열렸나2) {
  await page.locator('[aria-label="편집"]').first().click()
  await page.waitForTimeout(500)
}
// ⛔ 도착 못 했으면 「입구가 없다」가 «저절로» 참이 된다 — 그건 «안 잰» 것이라 통과로 세지 않는다
chk('⑤ 원문이 없는 레시피엔 입구가 «안» 보인다',
    열렸나2 && await page.getByRole('button', { name: /사진에서 읽은 원문/ }).count() === 0)

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}칸 통과 · ${실패}칸 실패`)
if (실패) console.log('   ' + 실패목록.join('\n   '))
process.exit(실패 ? 1 : 0)
