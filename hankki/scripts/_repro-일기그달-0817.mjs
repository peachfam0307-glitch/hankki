// 📅📅 「한끼 일기」 — 날짜를 골라도 «그 달»이 보이고, «겹치지 않는다» (2026-08-17 창업자 제보·판정)
//
// 📮 창업자 ①  *"일기에서 날짜를 누르면 그날에 만든 음식이 보이잖아. **근데 그 달에 만든 음식 전체도 보였으면 좋겠어.**"*
// 📮 창업자 ②  *"처음들어가면 그달에만든게 보이는데 **일기쓰고 나면 날짜꺼만 보여.** 다른탭에 나갔다가 다시오면 다 보이고."*
// 📮 창업자 ③  *"한달치니까 **겹치지 않게** 하자. **3번 같은 걸 만들면 3번 보이게 되잖아**"*
//
// ⭐⭐ ①②의 원인 = 달력 칸이 `onSelect(k)`(거르기 켜기)와 `onOpenDay(k)`(일기로 이동)를 **한 번에** 한다.
//    그래서 일기를 쓰고 돌아오면 거르기가 «살아 있어» 그날 것만 남는다. 탭을 나갔다 오면 화면이
//    다시 마운트돼 거르기가 풀린다 → «갔다 오면 다 보인다». 오락가락한 게 아니라 이 구조였다.
//
// ⭐ 이 재현판의 심장 둘 =
//    ⑴ **일기 화면을 다녀온 «뒤»에 그 달이 보이나** (①②)
//    ⑵ **한 달에 세 번 만든 요리가 «한 번»만 뜨나** (③)
//    ⛔ 「코드가 있나」를 보면 안 된다 — 창업자가 겪은 건 «다녀온 뒤»의 화면이다(규칙 18 ⓘ).
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-일기그달-0817.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
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
// 🔀 2026-08-27 — 고정 포트 4361 → **OS 가 빈 포트를 준다**(`listen(0)`).
//    ⛔ `_repro-감정컷-0815` 도 4361 을 쓰고 있었다 → 병렬로 돌리면 «둘이 다툰다».
//    ⭐ `_repro-백업일기샘-0819` 가 이미 이 방식이다(그 판을 따랐다).
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port
const BASE = `http://127.0.0.1:${PORT}/hankki/`

const { BASICS_VERSION } = await import('../src/data/basics.js')

// 🗓 날짜는 «지금 달»을 기준으로 — 달력이 늘 이번 달을 연다(`CookCalendar` 의 `ym` 초기값).
//    ⚠️ 앞날은 달력이 막으므로 오늘보다 뒤로만. 달 초에 돌려도 안 깨지게 1 로 눌러 담는다.
const N = new Date(), Y = N.getFullYear(), M = N.getMonth()
// 🗓 시계를 「이번 달 15일」로 고정하므로 T 는 «그 15일»이다 (아래 clock.install 참조)
const T = 15
const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).getTime()
const dA = T                       // 요리 2개 (겹치는 날)
const dB = Math.max(1, T - 2)      // 제육볶음 ①
const dC = Math.max(1, T - 4)      // 된장찌개
const dD = Math.max(1, T - 8)      // 제육볶음 ②
const dE = Math.max(1, T - 10)     // 제육볶음 ③  ← 창업자가 말한 「3번 같은 걸 만들면」
const dJ = Math.max(1, T - 6)      // 요리 0 · 일기만 쓴 날
const rec = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: Date.now(), source: 'user' })
const cook = (id, d, title) => ({ id, recipeId: 'r1', title, at: at(Y, M, d), rating: 5, note: '', photo: null })
const state = {
  recipes: [rec('r1', '들깨나물무침', 'fe_143')],
  diary: [
    cook('c1', dA, '들깨나물무침'),
    cook('c2', dA, '콩나물국'),
    cook('c3', dB, '제육볶음'),
    cook('c4', dC, '된장찌개'),
    cook('c5', dD, '제육볶음'),
    cook('c6', dE, '제육볶음'),
    // 🗓 지난달 것 둘 — 「그 달」이 진짜로 이번 달만 담는지 재는 «대조군»
    { id: 'p1', recipeId: 'r1', title: '김치찌개', at: at(Y, M - 1, 20), rating: 4, note: '', photo: null },
    { id: 'p2', recipeId: 'r1', title: '어묵탕', at: at(Y, M - 1, 22), rating: 4, note: '', photo: null },
    // 📔 요리는 안 하고 일기만 쓴 날
    { id: 'j1', kind: 'diary', at: at(Y, M, dJ), paper: { rule: 'plain', skin: 'kraft', art: 'none' }, decor: [], note: '' },
  ],
  seedV: BASICS_VERSION,
}
// 기대값은 «손으로 적지 않고» 씨앗에서 센다 — 날짜가 눌려 담기면(달 초) 개수가 달라진다.
const cooks = state.diary.filter((d) => d.kind !== 'diary')
const dk = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
const ymk = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}` }
const 종류 = (list) => new Set(list.map((e) => e.title)).size
const 전체 = cooks.length
const 이번달 = cooks.filter((e) => ymk(e.at) === `${Y}-${M}`)
const 그날 = cooks.filter((e) => dk(e.at) === `${Y}-${M}-${dA}`).length
// ⭐ 그 달 묶음 = 이번 달에서 «그날 것을 빼고» «같은 요리는 한 번만»
const 그달 = 종류(이번달.filter((e) => dk(e.at) !== `${Y}-${M}-${dA}`))
// 일기만 쓴 날(뺄 것이 없다) = 이번 달 종류 전부
const 그달_요리없는날 = 종류(이번달.filter((e) => dk(e.at) !== `${Y}-${M}-${dJ}`))

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// ⚠️ 경로를 «박지» 않는다 — /opt/pw-browsers 는 이 컨테이너에만 있고 CI 엔 없다(run #1416 을 그렇게 죽였다).
//    플레이라이트가 알아서 찾게 두고, 이 컨테이너에서만 env 로 알려준다.
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const _ctx = await b.newContext({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })

// 🗓🗓 **시계를 「이번 달 15일 낮」으로 고정한다** (2026-09-01 · 달이 바뀌는 날 셋이 한꺼번에 죽었다)
//   ⛔ 뿌리 = 씨앗 날짜를 `Date.now()` 에서 «며칠 빼서» 만드는데, **달 초에 돌리면 지난달로 떨어진다.**
//      일기·달력 화면은 «이번 달»을 열므로 화면이 텅 비고, 찾던 것이 영영 안 나온다.
//      🔢 실측(2026-09-01 = 1일) — `_repro-일기그달`·`_repro-접기세모먹통`·`_repro-일기포스트잇` **셋 다 실패**.
//         손 안 댄 배포 갈래에서도 똑같이 죽었다 = **앱이 아니라 검사가 낡은 것**이다(절대원칙 18 ⓘ).
//   ⛔ 「1 로 눌러 담기」(`Math.max(1, T-10)`)는 답이 아니었다 — 1일엔 **엿새가 한 날로 뭉쳐**
//      「제육볶음이 3번 뜬다」·「요리 안 한 날이 없다」처럼 **재려던 상황 자체가 사라진다.**
//   ✅ 15일이면 앞뒤로 열흘씩 여유가 있어 **어느 달, 어느 날에 돌려도 같은 그림**이 나온다.
await _ctx.clock.install({ time: new Date(Y, M, 15, 12, 0, 0) })
const page = await _ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '한끼 일기' }).first().click(); await page.waitForTimeout(800)

const 타일 = () => page.locator('.album-tile').count()
const 그리드 = () => page.locator('.album-grid').count()
const 달소제목 = () => page.getByText(/월에 만든 (다른 )?요리 \d+개/).count()
const 날알약 = () => page.getByText(/월 \d+일의 요리 \d+개/).count()
const 칸 = (d) => page.locator('.cal-day').filter({ has: page.locator('.cal-num', { hasText: new RegExp(`^${d}$`) }) }).first()
const 뒤로 = async () => { await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(800) }
const 이름들 = async () => (await page.locator('.album-cap').allInnerTexts()).map((s) => s.trim())

// ① 처음 = 거르기 없음 → 앨범에 전체(지금 모습 그대로 · 앨범은 한 장씩 쌓이는 자리라 안 묶는다)
let n = await 타일()
if (n === 전체) ok(`처음 열면 앨범에 전체 ${전체}개 (안 묶는다 — 여긴 「쌓이는」 자리)`)
else no(`처음 앨범이 ${n}개 (기대 ${전체})`)
if (await 달소제목() === 0 && await 날알약() === 0) ok('거르기 전엔 묶음 머리글이 없다')
else no('거르기 전인데 묶음 머리글이 떴다')

// ② 달력 날짜를 누르면 «일기 화면으로 간다» — 기존 동작이 안 깨졌나
await 칸(dA).click(); await page.waitForTimeout(900)
if (await page.locator('.paper').count() > 0) ok(`${dA}일을 누르면 그날 일기로 간다 (기존 동작 유지)`)
else no(`${dA}일을 눌렀는데 일기 화면이 아니다`)

// ③⭐⭐ **심장 ⑴** — 일기를 다녀온 뒤에도 「그 달」이 보이나
await 뒤로()
if (await 날알약() > 0) ok(`「${M + 1}월 ${dA}일의 요리」 묶음이 있다`)
else no('그날 묶음이 없다')
const 소제목 = await page.getByText(/월에 만든 (다른 )?요리 \d+개/).first().innerText().catch(() => '')
if (소제목) ok(`「그 달」 묶음이 살아 있다 — "${소제목.trim()}"  ⭐창업자가 없다고 한 그것`)
else no('일기를 다녀오니 「그 달」이 사라졌다 — 창업자 제보 그대로 재현됨')
if (/다른 요리/.test(소제목)) ok('머리글에 「다른」이 붙었다 (그날 것을 뺐으니 그게 사실이다)')
else no(`머리글이 "${소제목.trim()}" — 그날 것을 뺐으면 「다른」이라야 한다`)
if (new RegExp(`${그달}개`).test(소제목)) ok(`그 달 개수 = ${그달}개 (지난달 2개 안 섞임 · 겹침 제거됨)`)
else no(`그 달 개수가 "${소제목.trim()}" — 기대 ${그달}개`)

// ④⭐⭐ **심장 ⑵** — 세 번 만든 「제육볶음」이 딱 한 번만
const caps = await 이름들()
const 제육 = caps.filter((t) => t === '제육볶음').length
if (제육 === 1) ok('세 번 만든 「제육볶음」이 딱 한 번만 뜬다 ⭐창업자 판정')
else no(`「제육볶음」이 ${제육}번 뜬다 (기대 1) — 화면: ${caps.join(' · ')}`)
// 그날 것이 아래에 또 있으면 안 된다
const 겹침 = caps.filter((t, i) => caps.indexOf(t) !== i)
if (겹침.length === 0) ok(`화면에 겹치는 이름이 하나도 없다 — ${caps.join(' · ')}`)
else no(`겹치는 이름이 있다 — ${겹침.join(' · ')}`)
n = await 타일()
if (n === 그날 + 그달) ok(`타일 합 = 그날 ${그날} ＋ 그 달 ${그달} = ${n}개`)
else no(`타일이 ${n}개 (기대 ${그날 + 그달}) — 화면: ${caps.join(' · ')}`)
if (await 그리드() === 2) ok('그리드가 둘 (그날 · 그 달)')
else no(`그리드가 ${await 그리드()}개 (기대 2)`)

// ⑤ 요리를 «안» 한 날(일기만) — 아래가 통째로 비면 「고장」으로 읽힌다
await 칸(dJ).click(); await page.waitForTimeout(900); await 뒤로()
if (await page.getByText('이 날 만든 요리는 없어요').count() > 0) ok('요리 안 한 날 = 「이 날 만든 요리는 없어요」')
else no('요리 안 한 날 안내가 없다')
const 소제목2 = await page.getByText(/월에 만든 (다른 )?요리 \d+개/).first().innerText().catch(() => '')
if (!/다른/.test(소제목2)) ok(`뺀 게 없는 날엔 「다른」을 안 붙인다 — "${소제목2.trim()}"`)
else no(`"${소제목2.trim()}" — 뺀 게 없는데 「다른」이 붙었다`)
n = await 타일()
if (n === 그달_요리없는날) ok(`그래도 그 달 ${그달_요리없는날}개는 그대로 보인다 (전엔 화면이 텅 비었다)`)
else no(`요리 없는 날 타일이 ${n}개 (기대 ${그달_요리없는날})`)

// ⑥ 알약을 누르면 거르기가 풀려 전체로 돌아온다
await page.getByText(/월 \d+일의 요리 \d+개/).first().click(); await page.waitForTimeout(600)
n = await 타일()
if (n === 전체 && await 달소제목() === 0) ok(`알약을 누르면 전체 ${전체}개로 (거르기 풀림)`)
else no(`알약을 눌렀는데 ${n}개 · 머리글 ${await 달소제목()}개`)

// ⑦ 편집 「전체 선택」 = **화면에 있는 것 전부**(그날 ＋ 그 달). 한쪽만 세면 나머지가 빠진다.
await 칸(dA).click(); await page.waitForTimeout(900); await 뒤로()
await page.getByRole('button', { name: '편집' }).first().click(); await page.waitForTimeout(500)
await page.getByText('전체 선택').first().click(); await page.waitForTimeout(500)
const 뽑힘 = await page.locator('.album-tile [aria-hidden] svg').count()
if (뽑힘 === 그날 + 그달) ok(`「전체 선택」이 화면의 ${뽑힘}개를 다 잡는다`)
else no(`「전체 선택」 뒤 체크가 ${뽑힘}개 (기대 ${그날 + 그달})`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
