// 📸 가져오기 잔량 띠 캐릭터 ＋ 「사진 읽는 중」 안심 안내 — 실물 확인
//    📮 창업자 2026-08-13
//       *"가져오기에 무료스캔 알림에 캐릭터 하나 넣자(오른쪽 비어있는 칸에)"* · *"귀여운 걸로 해줘. 움직이게"*
//       *"레시피2장올릴때 로딩이 좀 걸려. **못기다리고 이상하다 하고 끌수도 있을 듯.**"*
//
// ⭐ 로딩은 «진짜로» 읽혀야 나온다 — 그림 두 장을 실제로 넣고 tesseract 가 도는 동안 찍는다.
//    (⛔ 상태만 손으로 바꿔 찍으면 「내가 만든 화면」이지 앱 화면이 아니다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { execSync } from 'node:child_process'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST = join('/home/user/hankki/hankki', 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.traineddata': 'application/octet-stream', '.gz': 'application/gzip' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4433, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// 읽을 사진 두 장 — 글자가 든 흰 종이(레시피 캡처 흉내).
//   ⛔ 여기서 만들지 않는다 — `python3 -c "…"` 큰따옴표 안은 셸이 먼저 씹어서 여러 번 깨졌다(CLAUDE.md 함정).
//      `scratchpad/읽을사진-*.png` 를 미리 만들어 두고 읽기만 한다.
const 사진 = [join(OUT, '읽을사진-1.png'), join(OUT, '읽을사진-2.png')]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
const 오류 = []
pg.on('pageerror', (e) => 오류.push(String(e)))
// ⛔ 프록시 밖으로 못 나간다 — AI 스캔(프록시)은 실패시키고 «기본 인식»으로 가게 둔다(폰에서도 같은 길이다)
await pg.route('**/ocr**', (r) => r.abort())
// ⛔⛔ 첫 판은 「닫기」를 «화면 전체»에서 찾아 눌렀다 → **가져오기 화면의 X 를 눌러 방금 연 화면을 닫았다.**
//    그래놓고 「잔량 띠를 못 찾았다」로 나와서 «띠가 없다»고 오해할 뻔했다(규칙 18 — 「없다」의 이유를 내가 정하지 말 것).
//    ✅ 닫는 건 «시트(.sheet) 안»과 선물 넛지(나중에)뿐이다.
const 닫기 = async () => {
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) { await a.click().catch(() => {}); await pg.waitForTimeout(180) }
  const b2 = pg.locator('.sheet').getByRole('button', { name: '닫기' }).first()
  if (await b2.count() && await b2.isVisible().catch(() => false)) { await b2.click().catch(() => {}); await pg.waitForTimeout(180) }
}
await pg.goto('http://127.0.0.1:4433/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(900); await 닫기()

// ── ① 가져오기 화면 (잔량 띠) ────────────────────────────────
// ⛔ `getByRole('button', {name:/가져오기/})` 로는 «안 눌린다» — 홈 상단바에도 같은 이름 단추가 있어
//    `.last()` 가 엉뚱한 걸 잡았고, 화면이 그대로인데 나는 「가져오기」를 찍은 줄 알았다(규칙 18).
//    ✅ 클래스로 콕 집는다.
await pg.locator('nav.bottom-nav .nav-item-import').click()
await pg.waitForTimeout(700); await 닫기()
// ⛔ 첫 판은 「'무료 AI 스캔' 글자가 든 div」를 찾았는데 **화면 전체(411×891)와 홈의 곰**이 잡혔다 —
//    ⑴ 바깥 div 부터 찾아지고 ⑵ 밀어 올린 화면 «뒤»에 홈이 그대로 살아 있다.
//    ✅ 그림에서 거꾸로 올라간다 — 띠에 실린 컷(pn_search·duo_hearthand)의 부모가 곧 띠다.
const 띠 = await pg.evaluate(`(() => {
  const im = [...document.querySelectorAll('img')].find(x => /pn_search|duo_hearthand/.test(x.currentSrc || x.src || ''))
  if (!im) return { 오류: '잔량 띠 캐릭터를 못 찾았다' }
  const t = im.parentElement
  const r = im.getBoundingClientRect(), tr = t.getBoundingClientRect()
  const 짚 = document.elementFromPoint(Math.round(r.left + r.width/2), Math.round(r.top + r.height/2))
  return {
    띠: Math.round(tr.width) + '×' + Math.round(tr.height),
    컷: (im.currentSrc||im.src).split('/').pop(),
    크기: Math.round(r.width) + '×' + Math.round(r.height),
    모션: (im.className.match(/hk-m-[a-z]+/)||['⛔없음'])[0],
    오른쪽끝까지: Math.round(tr.right - r.right),   // 0 에 가까울수록 「빈 칸」을 채운 것
    가려짐: 짚 !== im ? '⛔' : '',
  }
})()`)
console.log('\n━━━ ① 가져오기 잔량 띠 ━━━'); console.log(' ', JSON.stringify(띠))
await pg.screenshot({ path: join(OUT, '가져오기-잔량띠.png') })

// ── ② 사진 2장 → 읽는 중 ────────────────────────────────────
await pg.getByRole('button', { name: /사진 · 직접 작성하기|직접 작성/ }).first().click()
await pg.waitForTimeout(700); await 닫기()
// ⚠️ 화면엔 파일칸이 둘이다 — 표지 사진(한 장)과 **AI 스캔(여러 장)**.
//    ⛔ 숨은 칸에 `setInputFiles` 를 꽂았더니 **아무 일도 안 났다**(토스트도 자르기 시트도 안 뜸).
//    ✅ 유저가 하는 그대로 — 단추를 누르고 «파일 고르기 창»을 받아 넣는다.
const [chooser] = await Promise.all([
  pg.waitForEvent('filechooser'),
  pg.getByRole('button', { name: /캡처 사진으로 재료·만드는 법 채우기/ }).first().click(),
])
await chooser.setFiles(사진)
await pg.waitForTimeout(2500)
// 자르기 시트가 뜨면 지나간다 — 첫 장은 «크롭 → 인식» 순서라 여기서 안 넘기면 읽기가 시작조차 안 된다
{
  const 시트 = pg.locator('.sheet-mask, .crop-sheet').first()
  if (await 시트.count()) {
    console.log('  자르기 시트 단추 =', JSON.stringify(await 시트.getByRole('button').allInnerTexts()))
    for (const 이름 of ['이대로', '다 됐어요', '완료', '확인', '적용', '자르기']) {
      const x = 시트.getByRole('button', { name: new RegExp(이름) }).first()
      if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); break }
    }
  } else console.log('  ⚠️ 자르기 시트가 안 떴다')
}
// ⛔ 「자르기 시트」의 단추 이름을 «짐작»해서 넣었다가 하나도 안 맞아 읽기가 시작조차 안 됐다(규칙 18).
//    ✅ 화면에 실제로 있는 단추를 찍어 보고 고른다.
await pg.screenshot({ path: join(OUT, '읽는중-0-사진고른직후.png') })
console.log('  사진 고른 직후 단추 =', JSON.stringify(await pg.getByRole('button').allInnerTexts()))

// 읽는 중 상자가 뜰 때까지 기다렸다가, 막대가 «앞으로만» 가는지 세 번 재서 확인
const 잰다 = `(() => {
  const box = [...document.querySelectorAll('div')].find(d => /글자 읽는 중/.test(d.textContent||''))
  if (!box) return null
  const bar = box.querySelector('div[style*="width"] , div')
  const bars = [...box.querySelectorAll('div')].filter(d => /^\\d+(\\.\\d+)?%$/.test(d.style.width))
  const im = box.querySelector('img')
  return {
    글: box.innerText.replace(/\\n/g, ' | '),
    막대: bars.length ? bars[0].style.width : '⛔없음',
    캐릭터: im ? (im.currentSrc||im.src).split('/').pop() : '⛔없음',
    모션: im ? (im.className.match(/hk-m-[a-z]+/)||['⛔없음'])[0] : '-',
  }
})()`
console.log('\n━━━ ② 사진 2장 읽는 중 ━━━')
// ⚠️ 이 컨테이너는 tesseract 가 CDN 에서 엔진을 못 받아온다(프록시) → 읽기가 «곧바로» 끝난다.
//    그래서 700ms 마다 보면 상자가 뜬 걸 통째로 놓친다 → **120ms 로 촘촘히** 본다.
//    📌 폰에선 이 상자가 몇 초~수십 초 떠 있다(창업자가 말한 그 기다림).
let 찍음 = 0, 이전 = -1, 뒤로간적 = false
for (let i = 0; i < 400; i++) {
  const r = await pg.evaluate(잰다)
  if (r) {
    const now = parseFloat(r.막대) || 0
    if (이전 >= 0 && now < 이전 - 0.5) 뒤로간적 = true
    이전 = now
    if (찍음 < 3) { console.log('  ', JSON.stringify(r)); await pg.screenshot({ path: join(OUT, `읽는중-${++찍음}.png`) }) }
  }
  await pg.waitForTimeout(120)
  if (찍음 >= 3 && !r) break
}
console.log(뒤로간적 ? '  ⛔ 막대가 «뒤로» 갔다' : '  ✅ 막대가 뒤로 안 갔다')
// ⚠️⚠️ 「못 봤다」의 «이유»를 내가 정하지 말 것(규칙 18).
//    실측 = 파일 고르기(숨은 input · filechooser 둘 다)로 넣어도 **React `onChange` 가 안 불린다** —
//    자르기 시트도 토스트도 안 뜬다. 즉 **앱이 아니라 이 헤드리스 판에서 사진이 안 들어간다.**
//    ⛔ 그러니 이 줄이 ⛔여도 「로딩 안내가 안 뜬다」는 뜻이 «아니다». 그건 폰에서 확인해야 한다.
console.log(찍음 ? `  ✅ 읽는 중 상자를 ${찍음}번 찍었다` : '  ⚠️ 읽는 중 상자를 못 봤다 — 사진이 앱에 안 들어갔다(헤드리스 한계) · 판정은 폰에서')
console.log(오류.length ? `\n⛔ pageerror: ${오류[0]}` : '\n✅ pageerror 0')

await b.close(); srv.close()
