// 🎴📱 **「레꾸자랑에서 «다시» 공유하면 카톡에 간 그림이 비어 있다」 재현판** (2026-09-03)
//
// 📮 창업자 폰 제보 = *"레꾸자랑에서 뽑은 카드로 레꾸한거+스티커붙인거. **다시공유하려고하면 카드 안보임.**"*
//    → 되물으니 = *"**카톡에 간 그림이 비었다/이상하다**"*
//
// ⭐⭐ **이 판의 심장 = 「두 번째 공유가 «빈 그림»을 보내나」.**
//    ⛔ 「공유가 불렸나」만 재면 안 된다 — 불리기는 한다. 나간 «그림 속»이 문제다.
//    ✅ 그래서 흉내낸 `navigator.share` 가 받은 파일을 **캔버스에 그려 표준편차를 잰다.**
//       흰 종이 한 장이면 표준편차가 0 에 가깝다 — 「비었다」를 숫자로 잡는 유일한 길이다.
//    📌 절대원칙 21·30 과 같은 결이다 — 「불렸다」와 「제대로 갔다」는 다른 말이다.
//
// ⛔ **못 재는 것 — 정직하게**: 카톡이 그걸 어떻게 그리는지는 여기서 못 본다.
//    우리가 잴 수 있는 것은 **「우리가 무엇을 넘겼나」**뿐이다. 최종 판정은 창업자 폰이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-재공유빈카드-0903.mjs
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
const PORT = await new Promise((r) => { srv.listen(0, () => r(srv.address().port)) })

let 통과 = 0, 실패 = 0
const chk = (이름, ok, 덧말 = '') => {
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? `   ${덧말}` : ''}`)
  ok ? 통과++ : 실패++
}

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

// 🎨 창업자와 «같은 모양»으로 심는다 — 뽑은 카드에 스티커를 붙인 레시피 하나
//    ⛔ 안 꾸민 레시피면 `sendCover` 가 상세로 밀어내 이 길을 아예 안 탄다(isDecorated 검사)
const 밑 = basicRecipes.find((r) => r.title.includes('짬뽕')) || basicRecipes[0]
const 꾸민 = {
  ...밑,
  status: 'sorted',
  savedAt: Date.now(),
  decorBg: 'clay',
  decor: [
    { id: 'd1', type: 'sticker', key: 'au_i29', x: 0.28, y: 0.72, s: 0.26, r: -6 },
    { id: 'd2', type: 'sticker', key: 'au_b28', x: 0.74, y: 0.70, s: 0.28, r: 5 },
  ],
}
const state = { recipes: [꾸민, ...basicRecipes.slice(0, 5).map((r, i) => ({ ...r, status: 'sorted', savedAt: Date.now() - (i + 2) * 60000 }))], seedV: BASICS_VERSION }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
// ⛔ 「새 소식」 팝업이 sheet-mask 로 화면을 덮어 아래바가 안 눌린다(9/3 에 30초 타임아웃으로 배웠다)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
p.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
await p.goto(`http://127.0.0.1:${PORT}/hankki/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)) }, state)
await p.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

// 🎭 `navigator.share` 흉내 — ⭐받은 파일을 «그려서» 비었나까지 잰다
await p.evaluate(() => {
  window.__보낸것 = []
  navigator.canShare = () => true
  navigator.share = async (opt) => {
    const fs = (opt && opt.files) || []
    const 잰것 = []
    for (const f of fs) {
      const url = URL.createObjectURL(f)
      let 폭 = 0, 높이 = 0, 평균 = -1, 편차 = -1
      try {
        const img = new Image()
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })
        폭 = img.naturalWidth; 높이 = img.naturalHeight
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.min(폭, 200)); c.height = Math.max(1, Math.min(높이, 200))
        const g = c.getContext('2d')
        g.drawImage(img, 0, 0, c.width, c.height)
        const d = g.getImageData(0, 0, c.width, c.height).data
        let n = 0, s = 0, ss = 0
        for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; n++; s += v; ss += v * v }
        평균 = Math.round(s / n)
        편차 = Math.round(Math.sqrt(Math.max(0, ss / n - (s / n) * (s / n))))
      } catch { /* 못 그리면 -1 로 남는다 = 그것도 답이다 */ }
      URL.revokeObjectURL(url)
      잰것.push({ 이름: f.name, 바이트: f.size, 폭, 높이, 평균, 편차 })
    }
    window.__보낸것.push({ 장수: fs.length, 파일: 잰것 })
  }
})

const 보낸것 = () => p.evaluate(() => window.__보낸것 || [])
// 🎴 레꾸자랑 → 그 레시피 → 「내가 꾸민 표지 그대로」
const 한바퀴 = async (몇번째) => {
  await p.getByRole('button', { name: /레꾸자랑/ }).first().click()
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: new RegExp(`${꾸민.title} 자랑하기`) }).first().click()
  await p.waitForTimeout(500)
  await p.getByText('내가 꾸민 표지 그대로', { exact: false }).first().click()
  // ⏳ 표지 캡처는 몇 초 걸린다 — 「나간 것이 늘었나」로 기다린다(⛔고정 대기 금지)
  const 전 = (await 보낸것()).length
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(500)
    if ((await 보낸것()).length > 전) break
  }
  // 뒤에 뜨는 시트(「레시피도 보내기」·리뷰 청하기)를 닫아 다음 바퀴를 막지 않게
  //   ⛔ 처음엔 「나중에 볼게요」만 찾다가 실제 단추가 **「나중에」** 라서 30초 타임아웃으로 죽었다.
  //      📌 시트 단추 글자를 «짐작하지» 말 것 — 남아 있는 sheet-mask 가 아래바를 통째로 먹는다.
  //   ✅ 그래서 ⑴아는 글자들을 훑고 ⑵그래도 mask 가 남아 있으면 «그 안의 단추 아무거나» 누른다
  for (const 글 of ['나중에', '나중에 볼게요', '닫기', '괜찮아요', '다음에', '확인']) {
    const t = p.getByRole('button', { name: new RegExp(`^${글}$`) }).first()
    if (await t.count()) { await t.click().catch(() => {}); await p.waitForTimeout(400) }
  }
  for (let i = 0; i < 4 && (await p.locator('.sheet-mask').count()); i++) {
    const 남은 = p.locator('.sheet-mask button').last()
    if (await 남은.count()) {
      console.log('     ⚠️ 시트가 남아 있다 — 단추', JSON.stringify((await 남은.innerText().catch(() => '')).trim()))
      await 남은.click().catch(() => {})
    } else await p.keyboard.press('Escape').catch(() => {})
    await p.waitForTimeout(450)
  }
  const 이제 = await 보낸것()
  console.log(`     ${몇번째}번째 공유 → ${JSON.stringify(이제[이제.length - 1] || null)}`)
  return 이제
}

console.log('\n── 레꾸자랑 「꾸민 표지 그대로」 두 번 보내기 ──')
const 판1 = await 한바퀴('첫')
chk('첫 번째 공유가 나갔다', 판1.length >= 1, `보낸 횟수 ${판1.length}`)
const 판2 = await 한바퀴('두')
chk('두 번째 공유가 나갔다', 판2.length >= 2, `보낸 횟수 ${판2.length}`)

// ⭐⭐ 심장 — 두 번 다 «내용이 있는» 그림이어야 한다
//    🔢 잣대 = 표준편차 12 이상. 흰 종이·단색은 0~3 이 나온다(꾸민 표지는 30 넘는다).
const 첫장 = (판2[0] && 판2[0].파일[0]) || null
const 둘장 = (판2[1] && 판2[1].파일[0]) || null
chk('첫 번째로 나간 그림에 «내용»이 있다', !!첫장 && 첫장.편차 >= 12, 첫장 ? `표준편차 ${첫장.편차} · ${첫장.폭}x${첫장.높이} · ${첫장.바이트}B` : '(없다)')
chk('⭐두 번째로 나간 그림에 «내용»이 있다', !!둘장 && 둘장.편차 >= 12, 둘장 ? `표준편차 ${둘장.편차} · ${둘장.폭}x${둘장.높이} · ${둘장.바이트}B` : '(없다)')
if (첫장 && 둘장) {
  chk('두 번째 그림 크기가 첫 번째와 같다(찌그러지지 않았다)',
    첫장.폭 === 둘장.폭 && 첫장.높이 === 둘장.높이, `${첫장.폭}x${첫장.높이} → ${둘장.폭}x${둘장.높이}`)
}

// ─────────────────────────────────────────────────────────────
// 🎴 갈래 ⓑ — **「뽑은 카드」(랜덤 카드)** 길. 창업자 말이 *"레꾸자랑에서 «뽑은 카드»"* 였다.
//    ⭐ 여기가 위와 «다른 코드»다 — 표지는 `shareCover.js`, 뽑은 카드는 `ShareDrawCard.jsx` 가 그린다.
//    ⛔ 위 갈래가 통과했다고 이 갈래도 된다고 말하지 않는다(규칙 18 — 「없다」가 아니라 «아직 안 봤다»).
console.log('\n── 레꾸자랑 「랜덤 카드로 뽑기」 두 번 보내기 ──')
// ⛔⛔ 처음엔 여기서 「화면에 카드가 남아 있나」도 재려 했는데 **내 선택자가 아무것도 못 찾아**
//    늘 0 이 나왔다. 그걸 「카드가 사라졌다」로 적으면 «없는 버그»를 만드는 것이다(규칙 18).
//    ✅ 못 재는 것은 안 재고, 못 잰다고 적어 둔다. 화면에 남아 있나는 창업자 폰 판정이다.
// 🚪 시트 닫기 — 위 갈래와 «같은 처리». ⛔이걸 빼먹어서 두 번째 클릭이 통째로 삼켜졌고
//    하마터면 「두 번째 공유가 안 나간다」를 앱 버그로 보고할 뻔했다.
const 시트닫기 = async () => {
  for (const 글 of ['나중에', '나중에 볼게요', '닫기', '괜찮아요', '다음에', '확인']) {
    const t = p.getByRole('button', { name: new RegExp('^' + 글 + '$') }).first()
    if (await t.count()) { await t.click().catch(() => {}); await p.waitForTimeout(400) }
  }
  for (let i = 0; i < 4 && (await p.locator('.sheet-mask').count()); i++) {
    const 남은 = p.locator('.sheet-mask button').last()
    if (await 남은.count()) await 남은.click().catch(() => {})
    else await p.keyboard.press('Escape').catch(() => {})
    await p.waitForTimeout(450)
  }
}
const 카드한바퀴 = async (몇번째) => {
  const 전 = (await 보낸것()).length
  const 공유단추 = p.getByRole('button', { name: /^공유하기$/ }).first()
  if (!(await 공유단추.count())) {
    // 아직 카드 화면이 아니면 들어간다
    await p.getByRole('button', { name: /레꾸자랑/ }).first().click().catch(() => {})
    await p.waitForTimeout(700)
    await p.getByRole('button', { name: new RegExp(`${꾸민.title} 자랑하기`) }).first().click().catch(() => {})
    await p.waitForTimeout(500)
    await p.getByText('랜덤 카드로 뽑기', { exact: false }).first().click().catch(() => {})
    await p.waitForTimeout(1500)
  }
  // ⛔ 눌리지 않으면 «조용히 넘기지 않는다» — 그게 「안 나간다」로 잘못 읽힌 이유였다
  let 눌렸나 = true
  await p.getByRole('button', { name: /^공유하기$/ }).first().click({ timeout: 8000 }).catch((e) => {
    눌렸나 = false
    console.log('     ⚠️ 「공유하기」가 안 눌렸다 —', String(e.message || e).split('\n')[0].slice(0, 70))
  })
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if ((await 보낸것()).length > 전) break }
  await 시트닫기()
  const 이제 = await 보낸것()
  console.log(`     ${몇번째}번째 → ${JSON.stringify(이제[이제.length - 1] || null)}`)
  return { 판: 이제, 눌렸나 }
}
// ⛔ 변수 이름에 ⓑ 같은 동그라미 글자를 쓰면 자바스크립트가 못 읽는다(SyntaxError). 주석에만 쓴다.
const 카드1 = await 카드한바퀴('첫')
chk('뽑은 카드 첫 공유가 나갔다', 카드1.판.length >= 3, `보낸 횟수 ${카드1.판.length}`)
const 카드2 = await 카드한바퀴('두')
chk('뽑은 카드 두 번째 공유가 나갔다', 카드2.판.length >= 4, `보낸 횟수 ${카드2.판.length}`)
const 카첫장 = (카드1.판[카드1.판.length - 1] || {}).파일?.[0] || null
const 카둘장 = (카드2.판[카드2.판.length - 1] || {}).파일?.[0] || null
chk('뽑은 카드 — 첫 그림에 내용이 있다', !!카첫장 && 카첫장.편차 >= 12, 카첫장 ? `표준편차 ${카첫장.편차} · ${카첫장.폭}x${카첫장.높이}` : '(없다)')
chk('⭐뽑은 카드 — 두 번째 그림에 내용이 있다', !!카둘장 && 카둘장.편차 >= 12, 카둘장 ? `표준편차 ${카둘장.편차} · ${카둘장.폭}x${카둘장.높이}` : '(없다)')
chk('두 번째 「공유하기」가 실제로 눌렸다', 카드2.눌렸나, 카드2.눌렸나 ? '' : '⛔시트가 덮고 있었다')
chk('두 번째 그림이 첫 번째와 같은 규격이다', !!카첫장 && !!카둘장 && 카첫장.폭 === 카둘장.폭, 카첫장 && 카둘장 ? `${카첫장.폭}x${카첫장.높이} → ${카둘장.폭}x${카둘장.높이}` : '(못 잼)')

await p.screenshot({ path: '/tmp/재공유-마지막화면.png' }).catch(() => {})
await ctx.close()
await b.close()
srv.close()
console.log(실패 === 0 ? `\n✅ ${통과}칸 전부 통과\n` : `\n⛔ ${실패}칸 실패 (통과 ${통과})\n`)
process.exit(실패 === 0 ? 0 : 1)
