// 📅📅 「한끼 일기」 — 날짜를 골라도 «그 달»이 안 사라진다 (2026-08-17 창업자 제보)
//
// 📮 창업자 원문 ①  *"일기에서 날짜를 누르면 그날에 만든 음식이 보이잖아. **근데 그 달에 만든 음식 전체도 보였으면 좋겠어.**"*
// 📮 창업자 원문 ②  *"처음들어가면 그달에만든게 보이는데 **일기쓰고 나면 날짜꺼만 보여.** 다른탭에 나갔다가 다시오면 다 보이고."*
//
// ⭐⭐ 원인 = 달력 칸이 `onSelect(k)`(거르기 켜기)와 `onOpenDay(k)`(일기로 이동)를 **한 번에** 한다.
//    그래서 일기를 쓰고 돌아오면 거르기가 «살아 있어» 그날 것만 남는다. 탭을 나갔다 오면 화면이
//    다시 마운트돼 거르기가 풀린다 → «갔다 오면 다 보인다». 오락가락한 게 아니라 이 구조였다.
//
// ⭐ 그래서 이 재현판의 심장 = **「일기 화면을 다녀온 «뒤»에 그 달이 보이나」** 하나다.
//    ⛔ 「달 묶음 코드가 있나」를 보면 안 된다 — 창업자가 겪은 건 «다녀온 뒤»의 화면이다(규칙 18 ⓘ).
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
await new Promise((r) => srv.listen(4361, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')

// 🗓 날짜는 «지금 달»을 기준으로 만든다 — 달력이 늘 이번 달을 열기 때문(`CookCalendar` 의 `ym` 초기값).
//    ⚠️ 앞날은 달력이 막으므로 오늘보다 뒤로만 잡는다. 달 초에 돌려도 안 깨지게 1 로 눌러 담는다.
const N = new Date(), Y = N.getFullYear(), M = N.getMonth(), T = N.getDate()
const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).getTime()
const dA = T                       // 요리 2개 (겹치는 날)
const dB = Math.max(1, T - 2)      // 요리 1개
const dC = Math.max(1, T - 4)      // 요리 1개
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
const ym = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}` }
const 전체 = cooks.length
const 이번달 = cooks.filter((e) => ym(e.at) === `${Y}-${M}`).length
const 그날 = cooks.filter((e) => dk(e.at) === `${Y}-${M}-${dA}`).length

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '한끼 일기' }).first().click(); await page.waitForTimeout(800)

const 타일 = () => page.locator('.album-tile').count()
const 그리드 = () => page.locator('.album-grid').count()
const 달소제목 = () => page.getByText(/월에 만든 요리 \d+개/).count()
const 날알약 = () => page.getByText(/월 \d+일의 요리 \d+개/).count()
const 칸 = (d) => page.locator('.cal-day').filter({ has: page.locator('.cal-num', { hasText: new RegExp(`^${d}$`) }) }).first()
const 뒤로 = async () => { await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(800) }

// ① 처음 = 거르기 없음 → 앨범에 전체
await page.screenshot({ path: join(OUT, '일기그달-A-처음.png'), fullPage: true })
let n = await 타일()
if (n === 전체) ok(`처음 열면 앨범에 전체 ${전체}개`)
else no(`처음 앨범이 ${n}개 (기대 ${전체})`)
if (await 달소제목() === 0 && await 날알약() === 0) ok('거르기 전엔 묶음 머리글이 없다 (지금 모습 그대로)')
else no('거르기 전인데 묶음 머리글이 떴다')

// ② 달력 날짜를 누르면 «일기 화면으로 간다» — 기존 동작이 안 깨졌나
await 칸(dA).click(); await page.waitForTimeout(900)
const 일기화면 = await page.locator('.paper').count()
if (일기화면 > 0) ok(`${dA}일을 누르면 그날 일기로 간다 (기존 동작 유지)`)
else no(`${dA}일을 눌렀는데 일기 화면이 아니다`)

// ③⭐⭐ **심장** — 일기를 다녀온 뒤에도 「그 달」이 보이나
await 뒤로()
await page.screenshot({ path: join(OUT, '일기그달-B-일기다녀온뒤.png'), fullPage: true })
if (await 날알약() > 0) ok(`「${M + 1}월 ${dA}일의 요리」 묶음이 있다`)
else no('그날 묶음이 없다')
const 소제목 = await page.getByText(/월에 만든 요리 \d+개/).first().innerText().catch(() => '')
if (소제목) ok(`「그 달」 묶음이 살아 있다 — "${소제목.trim()}"  ⭐이게 창업자가 없다고 한 그것`)
else no('일기를 다녀오니 「그 달」이 사라졌다 — 창업자 제보 그대로 재현됨')
if (new RegExp(`${이번달}개`).test(소제목)) ok(`그 달 개수 = ${이번달}개 (지난달 2개는 안 섞였다)`)
else no(`그 달 개수가 "${소제목.trim()}" — 기대 ${이번달}개`)
n = await 타일()
if (n === 그날 + 이번달) ok(`타일 합 = 그날 ${그날} ＋ 그 달 ${이번달} = ${n}개`)
else no(`타일이 ${n}개 (기대 ${그날 + 이번달})`)
if (await 그리드() === 2) ok('그리드가 둘 (그날 · 그 달)')
else no(`그리드가 ${await 그리드()}개 (기대 2)`)

// ④ 요리를 «안» 한 날(일기만) — 아래가 통째로 비면 「고장」으로 읽힌다
await 칸(dJ).click(); await page.waitForTimeout(900); await 뒤로()
await page.screenshot({ path: join(OUT, '일기그달-C-요리없는날.png'), fullPage: true })
if (await page.getByText('이 날 만든 요리는 없어요').count() > 0) ok('요리 안 한 날 = 「이 날 만든 요리는 없어요」')
else no('요리 안 한 날 안내가 없다')
n = await 타일()
if (n === 이번달) ok(`그래도 그 달 ${이번달}개는 그대로 보인다 (전엔 화면이 텅 비었다)`)
else no(`요리 없는 날 타일이 ${n}개 (기대 ${이번달})`)

// ⑤ 알약을 누르면 거르기가 풀려 전체로 돌아온다
await page.getByText(/월 \d+일의 요리 \d+개/).first().click(); await page.waitForTimeout(600)
n = await 타일()
if (n === 전체 && await 달소제목() === 0) ok(`알약을 누르면 전체 ${전체}개로 (거르기 풀림)`)
else no(`알약을 눌렀는데 ${n}개 · 머리글 ${await 달소제목()}개`)

// ⑥ 편집 모드 「전체 선택」 — 옛 `shown` 이 남아 있으면 여기서 ReferenceError 가 난다
await 칸(dA).click(); await page.waitForTimeout(900); await 뒤로()
await page.getByRole('button', { name: '편집' }).first().click(); await page.waitForTimeout(500)
await page.getByText('전체 선택').first().click(); await page.waitForTimeout(500)
const 뽑힘 = await page.locator('.album-tile [aria-hidden] svg').count()
if (뽑힘 >= 이번달) ok(`「전체 선택」이 돈다 (체크 ${뽑힘}개)`)
else no(`「전체 선택」 뒤 체크가 ${뽑힘}개 (기대 ${이번달} 이상)`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
