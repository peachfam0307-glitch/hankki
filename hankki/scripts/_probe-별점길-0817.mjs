// ⭐ 「별점을 «매길» 자리가 앱에 있나」 — 창업자 물음 (2026-08-17)
//
// 📮 창업자 *"음식 아이콘에 별은 뭐야?"* → 내가 *"레시피 상세 「내 요리 기록」에서 매긴다"* 라고 답했다.
// 📮 창업자 *"**평점 매기는데가 없으니까 안뜨는거 아닌가**"*
//
// ⛔⛔ 나는 **코드만 읽고** 「길이 있다」고 말했다. 규칙 21 = 실물을 눌러 봐야 안다.
//    ⭐ 물어야 할 것은 「코드에 있나」가 아니라 **「별점을 한 번도 안 매긴 사람이 매길 자리를 찾을 수 있나」**다.
//       ⚠️ 그래서 씨앗의 `rating` 을 **0** 으로 둔다 — 5로 두면 「이미 매긴 사람」 화면이라 물음이 안 풀린다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_probe-별점길-0817.mjs
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
    savedAt: now, source: 'user', cooked: 1, status: 'sorted',
  }],
  // ⭐ 「만들었어요!」를 한 번 누른 «직후»의 모습 — rating 0 · note 없음 · 사진 없음
  diary: [{ id: 'c1', recipeId: 'r1', title: '들깨나물무침', at: now, rating: 0, note: '', photo: null }],
  seedV: BASICS_VERSION,
}

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
await page.goto('http://127.0.0.1:4363/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// ① 레시피 상세로
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, '별점길-0-레시피탭.png') })
const 있나 = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}'); const r = (s.recipes || []).filter((x) => x.title === '들깨나물무침'); return { 전체: (s.recipes || []).length, 내것: r.length, id: r[0] && r[0].id } })
console.log('   🔎 저장된 레시피', JSON.stringify(있나), '· DOM 에 제목:', await page.getByText('들깨나물무침').count())
await page.getByText('들깨나물무침').first().click({ timeout: 8000 }); await page.waitForTimeout(900)

// ② 「내 요리 기록」 카드가 있나 — 그리고 «거기에 별점을 매기라는 말이 있나»
const 카드 = page.locator('.card').filter({ hasText: '내 요리 기록' }).first()
if (await 카드.count() > 0) {
  const 글 = (await 카드.innerText()).replace(/\s+/g, ' ').trim()
  ok(`「내 요리 기록」 카드가 있다 — "${글}"`)
  // ⭐⭐ 심장 ① — **별점을 «안 매긴» 사람 눈에 「여기서 매긴다」가 보이나**
  //   ⛔ 첫 판은 «글자»만 봤다(「별점」이라는 낱말). 그런데 답은 글자가 아니라 **빈 별 다섯**으로 냈다.
  //      → 검사가 고침을 못 보고 계속 ⛔ 를 냈다. **규칙 18 ⓘ — 검사가 «무엇을» 보는지.**
  //   ✅ 잣대 = 카드 «안»의 「N점」 버튼 개수(`Stars` 가 그것으로 그려진다). 글자든 그림이든 둘 중 하나면 통과.
  const 카드별 = await 카드.getByRole('button', { name: /^\d점$/ }).count()
  const 별말 = /별점|평점|점수/.test(글)
  if (카드별 === 5 || 별말) ok(`안 매긴 사람 눈에도 매길 자리가 보인다 — 카드 안 별 ${카드별}개${별말 ? ' ＋ 「별점」 글자' : ''}`)
  else no(`카드에 별점 신호가 «없다» — 별 ${카드별}개 · 보이는 글자는 "${글}" 뿐이다`)
  await page.screenshot({ path: join(OUT, '별점길-1-상세카드.png') })

  // ③ 눌러 보면 별점 시트가 뜨나
  await 카드.click(); await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, '별점길-2-시트.png') })
  // ⚠️ 카드에도 별이 생겨서 **화면 전체로 세면 10개**가 나온다 → 시트(`.sheet`) 안으로 좁힌다.
  const 시트 = page.locator('.sheet').filter({ hasText: '요리 기록 남기기' }).first()
  const 점버튼 = await 시트.getByRole('button', { name: /^\d점$/ }).count()
  if (점버튼 === 5) ok('카드를 누르면 「요리 기록 남기기」 시트에 별 5개가 뜬다')
  else no(`시트의 별 버튼이 ${점버튼}개 (기대 5)`)

  // ④ 실제로 매기고 저장하면 앨범 배지로 오나
  if (점버튼 === 5) {
    await 시트.getByRole('button', { name: '4점' }).first().click(); await page.waitForTimeout(300)
    const 저장 = 시트.getByRole('button', { name: /저장|완료/ }).first()
    if (await 저장.count() > 0) { await 저장.click(); await page.waitForTimeout(800) }
    else no('시트에 저장 버튼을 못 찾았다')
    // 일기 탭 앨범으로 — ⚠️ 상세는 «스택 화면»이라 하단바가 없다. 먼저 뒤로 나온다.
    await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(800)
    await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1200)
    // ⚠️ 배지의 별이 «글자 ★» 에서 «우리 SVG 아이콘» 으로 바뀌었다 → innerText 엔 숫자만 남는다.
    //    그래서 «숫자»와 «별 그림»을 따로 본다(규칙 18 ⓘ — 낡은 잣대로 재면 멀쩡한 걸 ⛔ 라 한다).
    const 배지 = (await page.locator('.album-star').allInnerTexts()).map((s) => s.trim())
    const 배지별 = await page.locator('.album-star svg').count()
    const 유니코드 = 배지.some((t) => t.includes('★'))
    if (배지.includes('4') && 배지별 > 0 && !유니코드) ok(`매긴 별점이 앨범 배지로 온다 — 별 그림 ${배지별}개 ＋ 숫자 ${배지.join(' · ')}`)
    else no(`앨범 배지 = 글자 ${배지.length ? 배지.join(' · ') : '없다'} · 별 그림 ${배지별}개 · 유니코드 ${유니코드}`)
    await page.screenshot({ path: join(OUT, '별점길-3-매긴뒤.png') })
  }
} else {
  no('「내 요리 기록」 카드가 아예 없다 — 별점을 매길 길이 없다')
  await page.screenshot({ path: join(OUT, '별점길-1-상세카드.png'), fullPage: false })
}

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 — 위를 창업자에게 그대로 보고한다\n` : '\n✅ 전부 통과\n')
