// 🐻🐧 「우리 애들이 화면마다 있나」 — 배치 실물 확인
//    📮 창업자 2026-08-13 *"홈(메인화면)인데 꼬르곰이 한마리도 없어. 레시피, 한끼일기탭은 «같은 모양» 꼬르곰이.
//       장보기 레꾸자랑에는 없어…(글씨옆에)"* ＋ *"펭펭이든 친구들이든 우리애들 넣었으면 좋겠어"*
//       ＋ *"한끼소식 옆에 캐릭터 하나 넣으면 되겠다"* ＋ *"귀여운 걸로 해줘. 움직이게"*
//
// ⭐ 규칙 21 — **보여주기 전에 내가 열어서 본다.** 그래서 숫자만 재는 게 아니라 «캡처»까지 남긴다.
//    숫자(있나·크기)는 «가려진 것»을 모른다 — 2026-08-11 에 온보딩에 덮인 화면을 초록불로 보고했다.
//
// 확인하는 것
//   ① 화면마다 우리 애가 «한 마리 이상» 있다
//   ② 그 애가 «다 다르다»(같은 컷이 두 탭에 겹치면 창업자가 말한 「같은 모양」이 또 된다)
//   ③ 움직인다(`hk-m-` 클래스가 붙어 있다)
//   ④ 가로가 안 넘친다(상단바에 그림이 끼어들어 제목이 밀리면 안 된다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST = join('/home/user/hankki/hankki', 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4431, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// 화면 안의 «우리 애 그림»을 전부 센다.
//   ⛔ `<img>` 를 다 세면 레시피 표지 사진까지 걸린다 → **주소에 우리 캐릭터 파일 이름이 든 것만.**
const 센다 = `(() => {
  // ⚠️ 계절 곰펭(sm_ · au_b)과 UI 물결컷(wave/)도 «우리 애»다 — 접두어가 달라 첫 판이 장보기 펭펭을 통째로 놓쳤다
  //    (📌 CLAUDE.md 분류 원칙 — 이름 규칙으로 분류하면 반드시 샌다)
  //    ⛔ 이 블록은 «템플릿 문자열 안»이다 → 주석에도 백틱을 쓰면 문자열이 거기서 끊긴다(오늘 실제로 깨졌다)
  const 우리애 = /(gom[-_]|gom_wow|gp_peng|gp_duo|gp_gom|hand_point|sm_(gom|peng|duo)_|au_b\d|pn_|peng_|duo_)/i
  const out = []
  for (const im of document.querySelectorAll('img')) {
    const src = im.currentSrc || im.src || ''
    if (!우리애.test(src)) continue
    const r = im.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) continue          // 안 보이는 것 제외
    if (r.bottom < 0 || r.top > innerHeight) continue  // 화면 밖(스크롤 아래) 제외
    // 가려졌나 — 그림 한가운데를 짚어 본다(온보딩·코치가 덮으면 여기서 걸린다)
    const 짚 = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2))
    out.push({
      컷: src.split('/').pop().replace(/-[A-Za-z0-9_]{6,}\\.png$/, '.png'),
      크기: Math.round(r.width) + '×' + Math.round(r.height),
      y: Math.round(r.top),
      모션: (im.className.match(/hk-m-[a-z]+/) || ['⛔없음'])[0],
      가려짐: 짚 !== im && !im.contains(짚) ? '⛔' : '',
    })
  }
  return { 애들: out, 가로넘침: document.documentElement.scrollWidth > innerWidth + 1 }
})()`

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
// ⛔ 「닫기」를 화면 전체에서 찾으면 **가져오기 화면의 X 를 눌러 방금 연 화면이 닫힌다** — 시트 안에서만 찾는다
const 닫기 = async () => {
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) { await a.click().catch(() => {}); await pg.waitForTimeout(180) }
  const b2 = pg.locator('.sheet').getByRole('button', { name: '닫기' }).first()
  if (await b2.count() && await b2.isVisible().catch(() => false)) { await b2.click().catch(() => {}); await pg.waitForTimeout(180) }
}
await pg.goto('http://127.0.0.1:4431/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(900); await 닫기()

const 판들 = [
  { 이름: '홈', 가기: async () => { await pg.getByRole('button', { name: /^홈/ }).last().click() } },
  { 이름: '레시피', 가기: async () => { await pg.getByRole('button', { name: /^레시피/ }).last().click() } },
  { 이름: '한끼일기', 가기: async () => { await pg.getByRole('button', { name: /일기/ }).last().click() } },
  { 이름: '장보기', 가기: async () => { await pg.getByRole('button', { name: /^장보기/ }).last().click() } },
  { 이름: '레꾸자랑', 가기: async () => { await pg.getByRole('button', { name: /레꾸자랑/ }).last().click() } },
  // ⛔ 이름으로 찾으면 홈 상단바 단추가 걸려 «화면이 안 바뀐다» → 클래스로 콕 집는다
  { 이름: '가져오기', 가기: async () => { await pg.locator('nav.bottom-nav .nav-item-import').click() } },
]

const 본컷 = new Map()
for (const 판 of 판들) {
  await 판.가기(); await pg.waitForTimeout(700); await 닫기()
  const r = await pg.evaluate(센다)
  console.log(`\n━━━ ${판.이름} ━━━`)
  if (!r.애들.length) console.log('  ⛔⛔ 우리 애가 «한 마리도» 없다')
  for (const a of r.애들) {
    console.log(`  ${a.가려짐 || '·'} ${a.컷}  ${a.크기}  y=${a.y}  ${a.모션}`)
    본컷.set(a.컷, [...(본컷.get(a.컷) || []), 판.이름])
  }
  if (r.가로넘침) console.log('  ⛔ 가로로 넘친다')
  await pg.screenshot({ path: join(OUT, `캐릭터-${판.이름}.png`) })
  // 가져오기는 뒤로 나와야 다음 탭으로 간다
  if (판.이름 === '가져오기') { await pg.goBack().catch(() => {}); await pg.waitForTimeout(400) }
}

console.log('\n━━━ 겹치는 컷 (같은 애가 두 탭에 있으면 「같은 모양」이 또 된다) ━━━')
let 겹침 = 0
for (const [컷, 탭] of 본컷) if (탭.length > 1) { console.log(`  ⚠️ ${컷} → ${탭.join(' · ')}`); 겹침++ }
if (!겹침) console.log('  ✅ 없다')
console.log(오류.length ? `\n⛔ pageerror ${오류.length}건: ${오류[0]}` : '\n✅ pageerror 0')

await b.close(); srv.close()
