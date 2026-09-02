// 🔖 「즐겨찾기 칩」에 요리사모자를 넣는 갈래들 — 창업자 판정용 (2026-08-18)
//
// 📮 창업자 *"아니면 **즐겨찾기 버튼 앞에 요리사모자를 넣어봐.**"* → *"웅 여러가지 안을 만들어줘"*
//
// ⭐⭐ **왜 좋은 생각인가** —
//    ⑴ 별점을 접고 인덱스로 갔는데 **칩엔 아직 별(★)이 남아 있었다**(`MyRecipesScreen.jsx:684`)
//    ⑵ **칩의 모자 = 카드의 모자** 가 되면 「이 모자가 인덱스구나」를 유저가 저절로 배운다.
//       ⭐ 「모아보기 단추」를 새로 만들 필요가 없다 — 이미 그 자리에 있다.
//    ⑶ 새로 그릴 그림 0장
//
// ⛔ 앱 코드를 갈래마다 만들 순 없으니 **찍을 때 칩만 갈아끼운다.**
//    ⚠️ 카드 쪽 인덱스는 «지금 코드 그대로»다(연한 모자 ＋ 진한 모자 · 26px).
//
// 실행: node scripts/_판-인덱스칩-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 모자 = 'data:image/png;base64,' + readFileSync(join(ROOT, 'src/assets/ui/idx_chef.png')).toString('base64')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4389, r))

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
const now = Date.now()
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04']
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이']
const 꾸민것 = new Set(['들깨나물무침', '어묵탕'])
const 걸린것 = new Set(['들깨나물무침', '된장찌개', '어묵탕', '계란말이'])
const R = (t, i) => 꾸민것.has(t)
  ? { ...샘플, id: 'x'.repeat(i + 1), title: t, savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: 걸린것.has(t), cooked: 0, sample: false }
  : { id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 9], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: 걸린것.has(t), cooked: 0 }
const state = { recipes: 요리.map(R), diary: [], seedV: BASICS_VERSION }

// ✅ [2026-08-18 창업자] 칩 모양 = **② 모자 ＋ 글자** 확정 (*"2번이 좋고"*)
//    ⏳ 남은 건 «글자» — *"인덱스이름은 좋았던것이 조금 애매해서 다른표현없을까?"*
// ⭐⭐ 이름을 고르는 잣대 = **바로 옆 「자주 N」 칩과 안 겹칠 것.**
//    실물로 확인하니 「자주」는 사실 «만든 적 있는 것»이다(cooked > 0 · MyRecipesScreen:244).
//    · 자주 = **만들어 봤다**(행동 기록)   · 인덱스 = **좋았다**(내 판단)
//    ⛔ 그래서 「또 할 것」·「단골」·「또 만들기」는 못 쓴다 — 「자주」와 뜻이 겹친다.
// ⚠️ 「좋았던 것」이 애매한 뿌리 = **뭐가 좋았는지 모호하다**(맛? 쉬움? 사진?).
// 📮 창업자 *"my pick? 혼자영어인가ㅋ"* ＋ *"my pick을 쓰면 좋았던것도 해먹을것도 다해당되긴해"*
// ⭐ 창업자가 짚은 조건 = **뜻을 안 좁힌다.** 그 성질을 가진 말들로 다시 뽑는다.
// ⛔⛔ 실물 확인 둘 —
//    ⑴ **「픽」은 이미 다른 뜻이다** — 장보기의 「이번 주 픽」(제품 큐레이션) ＋
//       기본 레시피 메모 여러 편에 「주부의 장바구니 픽에서 담을 수 있어요」가 박혀 있다.
//       → 레시피 표시에 쓰면 **같은 말이 두 뜻**이 된다.
//    ⑵ **화면에 보이는 영어 낱말 = 0개** (scripts/_잰다-UI영어-0818.mjs · 다섯 탭 첫 화면 실측)
//       → 넣으면 **앱에서 유일한 영어**가 된다. 창업자 걱정이 맞았다.
const 갈래 = [
  { 이름: '1-mypick', 글: 'my pick', px: 17 },
  { 이름: '2-MyPick', 글: 'My Pick', px: 17 },
  { 이름: '3-책갈피', 글: '책갈피', px: 17 },
  { 이름: '4-내책갈피', 글: '내 책갈피', px: 17 },
  { 이름: '5-꽂아둔것', 글: '꽂아둔 것', px: 17 },
  { 이름: '6-골라둔것', 글: '골라둔 것', px: 17 },
]

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const errors = []
for (const g of 갈래) {
  const page = await b.newPage({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, state)
  await page.goto('http://127.0.0.1:4389/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1100)
  const 됐나 = await page.evaluate(({ 요리, 모자, 글, px }) => {
    const 남길 = new Set(요리); const 본것 = new Set()
    for (const c of document.querySelectorAll('.grid-card')) {
      const t = c.querySelector('.name')?.textContent
      if (!남길.has(t) || 본것.has(t)) { c.style.display = 'none'; continue }
      본것.add(t)
    }
    if (px === 0) return true
    // 「즐겨찾기」 칩 = 별 svg 를 품은 pill
    const 칩 = [...document.querySelectorAll('.pill')].find((p) => /즐겨찾기/.test(p.textContent))
    if (!칩) return false
    const n = (칩.textContent.match(/\d+/) || ['0'])[0]
    칩.innerHTML = `<img src="${모자}" style="display:block;height:${px}px;width:auto;margin-right:${글 ? 2 : 0}px" alt="">${글 ? 글 + ' ' : ''}${n}`
    return true
  }, { 요리, 모자, 글: g.글, px: g.px })
  if (!됐나) throw new Error(`⛔ ${g.이름} — 즐겨찾기 칩을 못 찾았다. 「0개」로 넘어가지 말 것`)
  await page.waitForTimeout(400)
  // ⛔ 첫 판에서 «비율»로 잘랐다가 칩이 아니라 토글 줄을 잘랐다(규칙 21 이 잡았다).
  //    ⭐ 자리를 «재서» 자른다 — 칩 줄 ＋ 그 아래 첫 카드 줄까지(인덱스가 같이 보여야 판정이 된다).
  const 칩자리 = await page.evaluate(() => {
    const 줄 = [...document.querySelectorAll('.hscroll')].find((e) => /즐겨찾기|전체/.test(e.textContent))
    const 카드 = document.querySelector('.grid-card')
    if (!줄) return null
    const r = 줄.getBoundingClientRect(), c = 카드?.getBoundingClientRect()
    // ⛔ 첫 판이 「height 가 0 이하」로 죽었다.
    //    뿌리 = **clip 은 «페이지» 좌표인데 getBoundingClientRect 는 «뷰포트» 좌표**다.
    //    목록이 안에서 굴러가면 둘이 어긋난다 → 스크롤량을 더해 페이지 좌표로 맞춘다.
    //    ＋ 카드가 칩 줄보다 위에 잡히는 경우가 있어 **아래쪽을 둘 중 큰 값**으로 고른다.
    const sx = window.scrollX, sy = window.scrollY
    const top = Math.max(0, r.top + sy - 12)
    const bottom = (c && c.bottom > r.bottom ? c.bottom : r.bottom) + sy + 8
    return { x: sx, y: top, width: 360, height: Math.max(60, bottom - top) }
  })
  if (!칩자리) throw new Error('⛔ 칩 줄을 못 찾았다')
  await page.screenshot({ path: join(OUT, `칩줄-${g.이름}.png`), clip: 칩자리 })
  console.log(`   ✅ ${g.이름}`)
  await page.close()
}
if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
