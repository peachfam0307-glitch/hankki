// ⭐⭐ 별점 — 「안 매긴 사람에게 권하지 않는다」를 지키는 게이트 (2026-08-17 · **2026-08-20 갱신**)
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
//
// ✅✅✅ **[창업자 확정 2026-08-20 = ⓐ] 별점 입구는 «되살리지 않는다».**
//    📮 갈래 셋을 실물 캡처와 함께 물었다 — ⓐ그대로 둔다 / ⓑ「기록 고치기」를 되살린다 / ⓒ책갈피로 갈아탄다
//       → 창업자 되물음 *"기록고치기는뭐야?"* → 실물 시트를 찍어 보여줌 → 창업자 답 = **"a"**
//    ⛓ `decided.mjs "별점"` 이 근거를 찾아줬다 — 8/17 `dff6f3dc`(일기 별점 추가)를 같은 날
//       `36bb4736`(창업자 *"되돌리자"*)로 revert 했고, CLAUDE.md 에 *"좋았던 레시피는 **인덱스로 남겨요(별대신)**"*.
//       **별점은 「책갈피」로 대체되는 중**이라 입구를 되살리는 건 방향을 거스른다.
//
// ⛔⛔⛔ **2026-08-20에 이 검사가 죽었고, 죽은 게 «맞았다» — 잣대가 낡은 것이었다.**
//    같은 날 창업자 확정으로 **레시피 상세의 「내 요리 기록」 카드 자체가 사라졌다**
//    (*"그 자리는 아예 비운다"* · `RecipeDetailScreen.jsx` 499줄 주석).
//    그러자 이 검사의 **세 칸이 통째로 헛돌았다** — ①카드가 있다 ③카드 글자 ④카드를 누르면 시트가 뜬다.
//    ⭐⭐ **뿌리 = 잣대가 「카드 «안»」에 매여 있었다.** 물어야 할 것은 «카드에 별이 있나»가 아니라
//       **«화면 어디에도 별점을 권하지 않나»** 였다. 카드가 사라지고서야 그 차이가 드러났다.
//    📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나». **이제 화면 «전체»를 본다.**
//
// ⭐ 그래서 이 게이트가 지키는 것 =
//    ⑴ **레시피 상세 어디에도 별점을 «권하지 않는다»** ← 심장
//    ⑵ 옛 「내 요리 기록」 카드가 **되살아나지 않았다** (ⓐ 확정을 코드가 지키게)
//    ⑶ 매긴 별점은 앨범 배지로 오고, 그 별은 **우리 아이콘**이다(⛔유니코드 글자 `★` 아님)
//    ⑷ **안 매긴 기록엔 배지가 «없다»**
//    ⑸ 레시피 탭에 유니코드 별 0 · ⑹ pageerror 0
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
// ⚠️ `status: 'sorted'` 가 없으면 레시피 목록에 «아예 안 뜬다»(`MyRecipesScreen` 의 `sorted`).
//    이걸 몰라 처음에 「앱이 고장났나」로 30분 헤맸다 — 시드를 만들 땐 이 칸을 잊지 말 것.
const 레시피 = (id, title, icon) => ({
  id, title, category: '한식', time: 15, thumb: 'icon', icon,
  ingredients: ['시래기 200g', '들깨가루 2큰술'], steps: ['데친다.', '무친다.'], tags: [],
  savedAt: now, source: 'user', cooked: 1, status: 'sorted',
})
const state = {
  recipes: [레시피('r1', '들깨나물무침', 'fe_143'), 레시피('r2', '감자조림', 'fe_143')],
  // ⭐⭐ 기록을 «둘»로 나눈 이유 — 한 벌로는 ⑴과 ⑶을 같이 못 잰다.
  //    · c1 = 「만들었어요!」를 한 번 누른 «직후» (rating 0 · 메모 없음 · 사진 없음) → ⑴⑵를 잰다
  //    · c2 = 이미 별점을 «매긴» 기록 → ⑶ 앨범 배지를 잰다
  //    ⛔ 하나로 합치면 ⑶을 재려고 시트를 열어 별을 눌러야 하는데, **그 「매기는 길」이 지금은 없다**(ⓐ 확정).
  //       그래서 «시드에 넣어» 확인한다 — 검사가 앱에 없는 길을 요구하면 안 된다.
  //    ⛔ `note` 는 빈 채로 둔다 — 한 줄이 있으면 재료 옆에 메모지가 붙어 ⑴이 재려는 화면이 달라진다.
  diary: [
    { id: 'c1', recipeId: 'r1', title: '들깨나물무침', at: now, rating: 0, note: '', photo: null },
    { id: 'c2', recipeId: 'r2', title: '감자조림', at: now, rating: 4, note: '', photo: null },
  ],
  seedV: BASICS_VERSION,
}

// 🎯🎯 **하단 탭을 «콕» 집는다** — 2026-08-20 에 이것 때문에 smoke 가 죽었다.
//   ⛔ 옛 잣대 = `getByText('레시피', { exact: true }).last()`
//      죽은 로그가 원인을 그대로 말해 줬다:
//        locator resolved to <div class="h-title">레시피</div>
//        <div class="detail-bar">…</div> … intercepts pointer events
//      「레시피」라는 글자는 **하단 탭에도 있고 화면 «제목»에도 있다.**
//      `.last()` 는 «DOM 순서상 마지막»을 집는데, 그게 화면 상태에 따라 달라진다 →
//      제목을 집으면 그 자리는 하단 고정 바(`.detail-bar`)에 가려 «영영» 못 누른다.
//   ⭐ 혼자 돌리면 6/6 통과하고 smoke 안에서만 죽어서 「불안정한 검사」로 보였는데,
//      진짜 원인은 타이밍이 아니라 **잣대가 무엇을 잡는지**였다(규칙 18 ⓘ).
//      ⚠️ 실제로 CPU 를 12배 느리게 해도 재현이 «안 됐다» — 시간 문제였다면 거기서 죽었어야 한다.
//   🔎 실물로 확인 — **상세를 연 채**로 재보니:
//        옛 잣대  → 「레시피」 글자 1개, 그 정체가 `h-title`(화면 제목)
//        `.nav-item` → **0개** (상세 화면엔 하단 탭이 «아예 없다»)
//   ⭐⭐ 그래서 진짜 뿌리는 **「뒤로」가 아직 안 끝난 것**이다. 옛 잣대는 그때 «제목»을 집어
//      30초를 헤매다 죽고, 새 잣대만으로도 「못 찾음」으로 죽는다.
//   ✅ 그래서 **하단 탭이 «보일 때까지» 기다린 뒤 누른다** — 고정 시간이 아니라 «상태»를 기다린다.
//      `waitForTimeout(800)` 은 바쁜 컴퓨터에서 언젠가 모자란다.
const 탭 = async (이름) => {
  await page.waitForSelector('.nav-item', { state: 'visible', timeout: 10000 })
  await page.locator('.nav-item').filter({ hasText: new RegExp('^' + 이름 + '$') }).first().click()
}

// ⛔⛔ **셈을 «먼저» 못 박는다** — 「넷을 본다」고 적어놓고 셋만 돌아도 통과하던 사고를 막는다.
//    (`every()` 는 빈 배열에도 참이다. 「검사가 돌았나」와 「검사가 통과했나」는 다른 말이다.)
const 칸수 = 6
let bad = 0, 돈칸 = 0
const ok = (m) => { 돈칸++; console.log('   ✅', m) }
const no = (m) => { bad++; 돈칸++; console.log('   ⛔', m) }

// ⚠️ 경로를 «박지» 않는다 — /opt/pw-browsers 는 이 컨테이너에만 있고 CI 엔 없다(run #1416 을 그렇게 죽였다).
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4363/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 레시피 상세로 — 별점을 «안» 매긴 편(r1)
await 탭('레시피'); await page.waitForTimeout(700)
await page.getByText('들깨나물무침').first().click({ timeout: 15000 }); await page.waitForTimeout(900)
// ⚠️ 상세가 정말 열렸나부터 — 안 열린 채로 「별 0개」를 재면 «언제나» 통과하는 검사가 된다(규칙 18 ⓘ)
await page.getByRole('button', { name: '뒤로' }).first().waitFor({ state: 'visible', timeout: 10000 })

// ⑴⭐⭐ **심장** — 안 매긴 사람에게 별을 «권하지 않는다»
//    잣대 = 「N점」 버튼(`Stars` 가 그것으로 그려진다). 화면 «전체»에서 0개라야 한다.
//    ⛔ 옛 판은 이걸 「내 요리 기록」 카드 «안»에서만 셌다 — 카드가 사라지자 검사도 같이 사라졌다.
const 점버튼 = await page.getByRole('button', { name: /^\d점$/ }).count()
if (점버튼 === 0) ok('레시피 상세 어디에도 별점을 권하지 않는다 ⭐창업자 확정 — 요리 중에 붙잡지 않는다')
else no(`레시피 상세에 별점 매기는 자리가 ${점버튼}개 떴다 — 2026-08-06·08-20 확정(마찰 제거)을 거스른다`)

// ⑵ 옛 「내 요리 기록」 카드가 되살아나지 않았다 (창업자 확정 ⓐ · *"그 자리는 아예 비운다"*)
//    ⛔ 되살리면 「같은 말이 두 번」이 다시 난다 — 재료 옆 메모지가 이미 그 한 줄을 보여준다.
const 옛카드 = await page.locator('.card').filter({ hasText: '내 요리 기록' }).count()
if (옛카드 === 0) ok('옛 「내 요리 기록」 카드가 없다 — 자리는 비워 둔 그대로')
else no(`옛 「내 요리 기록」 카드가 ${옛카드}개 되살아났다 — 2026-08-20 창업자 확정(ⓐ)을 거스른다`)
await page.screenshot({ path: join(OUT, '별점-1-상세-안매김.png'), fullPage: true })

// ⑶⑷ 매긴 별점은 앨범 배지로 오고, 그 별은 «우리 아이콘»이다 · 안 매긴 것엔 배지가 없다
// ⚠️ 상세는 «스택 화면»이라 하단바가 없다 — 먼저 뒤로 나온다.
await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(800)
await 탭('일기'); await page.waitForTimeout(1200)
// ⚠️ 배지의 별이 «글자 ★» 에서 «SVG» 로 바뀌었다 → innerText 엔 숫자만 남는다.
//    그래서 «숫자»와 «별 그림»을 따로 본다(규칙 18 ⓘ — 낡은 잣대로 재면 멀쩡한 걸 ⛔ 라 한다).
const 배지 = (await page.locator('.album-star').allInnerTexts()).map((s) => s.trim())
const 배지별 = await page.locator('.album-star svg').count()
const 유니코드 = 배지.some((t) => t.includes('★'))
if (배지.includes('4') && 배지별 > 0 && !유니코드) ok(`매긴 별점이 앨범 배지로 온다 — 우리 별 그림 ${배지별}개 ＋ 숫자 ${배지.join(' · ')}`)
else no(`앨범 배지 = 글자 ${배지.length ? 배지.join(' · ') : '없다'} · 별 그림 ${배지별}개 · 유니코드 ${유니코드}`)

// ⑷ 안 매긴 기록엔 배지가 «없다» — 앨범 칸은 둘인데 배지는 하나라야 한다
//    ⛔ 「배지가 있다」만 보면 «모든 칸에 0점 배지가 뜨는» 회귀를 못 잡는다.
const 칸 = await page.locator('.album-tile').count()
if (칸 >= 2 && 배지.length === 1) ok(`안 매긴 기록엔 배지가 없다 — 앨범 ${칸}칸 중 배지 ${배지.length}개`)
else no(`앨범 ${칸}칸에 배지가 ${배지.length}개 (기대: 칸 2 이상 · 배지 1) — 안 매긴 것에도 별이 뜬다`)
await page.screenshot({ path: join(OUT, '별점-2-앨범배지.png'), fullPage: true })

// ⑸ 앱 어디에도 «유니코드 별 글자»가 남아 있지 않다 (레시피 탭 「책갈피」 칩까지)
await 탭('레시피'); await page.waitForTimeout(900)
const 화면글 = await page.locator('.screen').first().innerText().catch(() => '')
if (!화면글.includes('★')) ok('레시피 탭에 유니코드 별 글자 0 (책갈피 칩도 우리 아이콘)')
else no('레시피 탭에 유니코드 `★` 가 남아 있다 — 우리 규칙은 「UI엔 우리 아이콘만」')

// ⑹ pageerror — ⛔한 건마다 no() 를 부르면 「돈 칸」 셈이 어긋난다. 한 칸으로 묶는다.
if (errors.length) no(`pageerror ${errors.length}건 — ${errors.join(' / ')}`)
else ok('pageerror 0')

await b.close(); srv.close()
if (돈칸 !== 칸수) { bad++; console.log(`   ⛔ 검사가 ${돈칸}칸만 돌았다 (기대 ${칸수}) — 중간에 건너뛴 자리가 있다`) }
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : `\n✅✅ ${칸수}칸 전부 통과\n`)
process.exit(bad ? 1 : 0)
