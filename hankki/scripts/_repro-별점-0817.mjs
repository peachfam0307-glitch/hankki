// ⭐⭐ 별점 — 「안 매긴 사람에게 권하지 않는다」를 지키는 게이트 (2026-08-17)
//
// 📮 창업자 ①  *"음식 아이콘에 별은 뭐야?"*
// 📮 창업자 ②  *"평점 매기는데가 없으니까 안뜨는거 아닌가"*
// 📮 창업자 ③  *"**요리기록 남기기 안하기로 하지 않았어???????????????????**"*
// 📮 창업자 ④  *"**누를 시간 없어서 안하기로 했잖아**"*
//
// ⛔⛔ **내가 ②를 「안 보이니 보이게 하자」로 읽고 「내 요리 기록」 카드에 빈 별 다섯을 띄웠다. 틀렸다.**
//    창업자는 «없는 걸 지적»한 게 아니라 **«없는 게 맞는데 왜 별이 뜨냐»**를 물은 것이었다.
//    ⭐ 확정 = **2026-08-06 「만들었어요 → 토스트만, 시트 안 뜬다」**
//       (`docs/요리기록-다이어리-방향-2026-08-05.md` 9️⃣ ① · 게이트 `_repro-cook-toast.mjs`)
//    📌 뿌리는 «마찰»이다 — 요리하느라 바쁜 사람을 붙잡아 별점을 물으면 그 자리에서 앱을 닫는다.
//       **문패를 키우는 것도 같은 결정을 거스른다.**
//
// ⭐ 그래서 이 게이트가 지키는 것 =
//    ⑴ **안 매긴 사람 화면엔 별이 «없다»** (권유 금지) ← 내가 어긴 자리
//    ⑵ 그래도 **매길 길은 살아 있다** (원하면 카드를 눌러 시트로)
//    ⑶ 매긴 별점은 앨범 배지로 오고, 그 별은 **우리 아이콘**이다(⛔유니코드 글자 `★` 아님)
//
// ⛔ 「만들었어요 뒤에 시트가 자동으로 뜨나」는 여기서 안 본다 — `_repro-cook-toast.mjs` 가 이미 본다.
//    같은 것을 두 곳에서 재면 한쪽을 고칠 때 다른 쪽이 낡는다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-별점-0817.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4363, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [{
    id: 'r1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g', '들깨가루 2큰술'], steps: ['데친다.', '무친다.'], tags: [],
    // ⚠️ `status: 'sorted'` 가 없으면 레시피 목록에 «아예 안 뜬다**(`MyRecipesScreen` 의 `sorted`).
    //    이걸 몰라 처음에 「앱이 고장났나」로 30분 헤맸다 — 시드를 만들 땐 이 칸을 잊지 말 것.
    savedAt: now, source: 'user', cooked: 1, status: 'sorted',
  }],
  // ⭐ 「만들었어요!」를 한 번 누른 «직후»의 모습 — rating 0 · 메모 없음 · 사진 없음
  diary: [{ id: 'c1', recipeId: 'r1', title: '들깨나물무침', at: now, rating: 0, note: '', photo: null }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// ⚠️ 경로를 «박지» 않는다 — /opt/pw-browsers 는 이 컨테이너에만 있고 CI 엔 없다(run #1416 을 그렇게 죽였다).
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4363/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 레시피 상세로
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByText('들깨나물무침').first().click({ timeout: 15000 }); await page.waitForTimeout(900)

const 카드 = page.locator('.card').filter({ hasText: '내 요리 기록' }).first()
if (await 카드.count() === 0) {
  no('「내 요리 기록」 카드가 아예 없다 — 원하는 사람이 매길 길까지 사라졌다')
} else {
  const 글 = (await 카드.innerText()).replace(/\s+/g, ' ').trim()
  ok(`「내 요리 기록」 카드가 있다 — "${글}"`)

  // ⑴⭐⭐ **심장** — 안 매긴 사람에게 별을 «권하지 않는다**
  //    잣대 = 카드 «안»의 「N점」 버튼(`Stars` 가 그것으로 그려진다). 0개라야 한다.
  const 카드별 = await 카드.getByRole('button', { name: /^\d점$/ }).count()
  if (카드별 === 0) ok('안 매긴 사람 화면엔 별이 «없다» ⭐창업자 확정 — 요리 중에 붙잡지 않는다')
  else no(`안 매긴 사람 카드에 별이 ${카드별}개 떴다 — 2026-08-06 확정(마찰 제거)을 거스른다`)
  if (/별점|평점|점수/.test(글)) no(`카드에 「별점」을 권하는 글자가 있다 — "${글}"`)
  else ok('카드에 별점을 권하는 글자도 없다')
  await page.screenshot({ path: join(OUT, '별점-1-안매긴카드.png') })

  // ⑵ 그래도 «원하면» 매길 길은 살아 있다
  await 카드.click(); await page.waitForTimeout(800)
  const 시트 = page.locator('.sheet').filter({ hasText: '요리 기록 남기기' }).first()
  const 점버튼 = await 시트.getByRole('button', { name: /^\d점$/ }).count()
  if (점버튼 === 5) ok('원하면 카드를 눌러 매길 수 있다 — 시트에 별 5개')
  else no(`카드를 눌렀는데 시트의 별이 ${점버튼}개 (기대 5) — 매길 길이 끊겼다`)
  await page.screenshot({ path: join(OUT, '별점-2-시트.png') })

  // ⑶ 매긴 별점은 앨범 배지로 오고, 그 별은 «우리 아이콘»이다
  if (점버튼 === 5) {
    await 시트.getByRole('button', { name: '4점' }).first().click(); await page.waitForTimeout(300)
    const 저장 = 시트.getByRole('button', { name: /저장|완료/ }).first()
    if (await 저장.count() > 0) { await 저장.click(); await page.waitForTimeout(800) }
    else no('시트에 저장 버튼을 못 찾았다')
    // ⚠️ 상세는 «스택 화면»이라 하단바가 없다 — 먼저 뒤로 나온다.
    await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(800)
    await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1200)
    // ⚠️ 배지의 별이 «글자 ★» 에서 «SVG» 로 바뀌었다 → innerText 엔 숫자만 남는다.
    //    그래서 «숫자»와 «별 그림»을 따로 본다(규칙 18 ⓘ — 낡은 잣대로 재면 멀쩡한 걸 ⛔ 라 한다).
    const 배지 = (await page.locator('.album-star').allInnerTexts()).map((s) => s.trim())
    const 배지별 = await page.locator('.album-star svg').count()
    const 유니코드 = 배지.some((t) => t.includes('★'))
    if (배지.includes('4') && 배지별 > 0 && !유니코드) ok(`매긴 별점이 앨범 배지로 온다 — 우리 별 그림 ${배지별}개 ＋ 숫자 ${배지.join(' · ')}`)
    else no(`앨범 배지 = 글자 ${배지.length ? 배지.join(' · ') : '없다'} · 별 그림 ${배지별}개 · 유니코드 ${유니코드}`)
    await page.screenshot({ path: join(OUT, '별점-3-매긴뒤.png') })
  }
}

// ⑷ 앱 어디에도 «유니코드 별 글자»가 남아 있지 않다 (레시피 탭 「즐겨찾기」 칩까지)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
const 화면글 = await page.locator('.screen').first().innerText().catch(() => '')
if (!화면글.includes('★')) ok('레시피 탭에 유니코드 별 글자 0 (즐겨찾기 칩도 우리 아이콘)')
else no('레시피 탭에 유니코드 `★` 가 남아 있다 — 우리 규칙은 「UI엔 우리 아이콘만」')

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
