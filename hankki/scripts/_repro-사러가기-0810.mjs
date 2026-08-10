// 🛒 재현판 — 장보기 리스트의 「사러가기」 한 버튼
//
// 📮 테스터 제보(창업자 전달 2026-08-10): *"검색이랑 사러가기랑 뭐가 다르냐"*
//    → 같은 자리·같은 모양인데 이름만 둘이라 «다른 기능인 줄» 안다.
//    ＋ 「검색」은 우리 앱에서 이미 «앱 안에서 찾기»로 쓰는 낱말이다(뜻이 둘이 됐다).
//
// ⭐ 파다가 같이 나온 것 둘 — 이름만 고치면 반쪽이다:
//    ⒜ 「검색」이 «첫 번째 쇼핑몰»에 달려 있었다. 한살림·자연드림은 `search` 가 검색이 아니라 «홈 주소»라
//       맨 앞에 두면 찾던 재료가 아니라 홈이 열린다.
//    ⒝ 쇼핑몰을 다 지우면 `{url:''}` 이라 **아무 데도 안 가는 죽은 버튼**이 된다.
//
// ⛔ 규칙 12 — 만들자마자 «옛 코드로 되돌려» ①③⑤⑥ 이 실제로 걸리는 것까지 확인했다.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const BASE = 'http://127.0.0.1:4173'
const srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2600)

const DEF = [
  { id: 'coupang', name: '쿠팡', url: 'https://www.coupang.com', search: 'https://www.coupang.com/np/search?q={q}' },
  { id: 'kurly', name: '마켓컬리', url: 'https://www.kurly.com', search: 'https://www.kurly.com/search?sword={q}' },
]
// ⚠️ 한살림·자연드림은 `search` 가 «홈 주소»다(= {q} 가 없다). 그게 첫째면 재료를 못 찾는다.
const 홈만 = [
  { id: 'hansalim', name: '한살림', url: 'https://shop.hansalim.or.kr/shopping/spMain.do', search: 'https://shop.hansalim.or.kr/shopping/spMain.do' },
  ...DEF,
]
const 리스트 = [
  { id: 's1', name: '한살림 무농약콩으로 만든 콩국물 500ml', url: 'https://shop.hansalim.or.kr/shopping/spGoodsView.do?goods_no=123', done: false },
  { id: 's2', name: '오이 1/2개', done: false },
  { id: 's3', name: '통깨 1큰술', done: false },
]

const 씨 = (shops) => ({ shoppingList: 리스트, shops, recipes: [], folders: [], profile: {}, wishlist: [] })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const R = []
const 재기 = async (shops, 이름) => {
  const p = await b.newPage({ viewport: { width: 411, height: 891 } })
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.addInitScript((seed) => {
    localStorage.setItem('hankki:v1', JSON.stringify(seed))
    localStorage.setItem('hankki:onboarded', '1')
    // 코치 오버레이가 클릭을 가로챈다 → 접두어로 통째 처리
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return String(k).startsWith('hankki:coach:') ? '1' : g.call(this, k) }
    // 외부 열기는 <a>.click() 이라 그걸 가로챈다 (window.open 아님)
    window.__opened = []
    HTMLAnchorElement.prototype.click = function () { window.__opened.push(this.href) }
  }, 씨(shops))
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: '장보기', exact: true }).click()
  await p.waitForTimeout(500)
  const 글 = await p.evaluate(() => document.body.innerText)
  // ⛔⛔ 첫 판이 여기서 «거짓 실패»했다 — `getByRole('사러가기')` 로 화면 전체를 세니 **7개**가 나왔다.
  //    「주부의 장바구니」 큐레이션 카드에도 같은 이름의 버튼이 있어서다(`ShopScreen.jsx:377`).
  //    **앱은 멀쩡했고 내가 잘못 셌다.** → 장보기 리스트 한 줄(`.shop-row`) «안»에서만 센다. (규칙 18)
  const 버튼 = await p.locator('.shop-row button.mini-buy').all()
  const 검색버튼 = await p.locator('.shop-row button.mini-buy', { hasText: '검색' }).count()
  const 눌러 = async (i) => {
    await 버튼[i].click(); await p.waitForTimeout(120)
    return (await p.evaluate(() => window.__opened.pop())) || ''
  }
  const out = { 이름, 글, 사러가기: 버튼.length, 검색: 검색버튼, errs, 눌러 , p}
  return out
}

// ── 판 ①  기본(쿠팡이 첫째)
{
  const t = await 재기(DEF, '기본')
  R.push(['① 「검색」 글자가 0개인가', t.검색 === 0, `검색 버튼 ${t.검색}개`])
  R.push(['② 「사러가기」가 담은 수(3)만큼인가', t.사러가기 === 3, `${t.사러가기}개`])
  const a = await t.눌러(0)
  R.push(['③ 주소 있는 것 → 그 제품으로', a.includes('spGoodsView'), a.slice(0, 58)])
  const c = await t.눌러(1)
  R.push(['④ 주소 없는 것 → 쿠팡에서 이름으로 찾기', c.includes('coupang.com/np/search') && c.includes(encodeURIComponent('오이')), c.slice(0, 58)])
  R.push(['⑤ pageerror 0', t.errs.length === 0, t.errs.join(' / ') || '없음'])
  await t.p.close()
}
// ── 판 ②  한살림이 첫째 (search 에 {q} 가 없다)
{
  const t = await 재기(홈만, '한살림 먼저')
  const c = await t.눌러(1)
  R.push(['⑥ 한살림이 첫째여도 «홈»이 아니라 찾기로', !c.includes('spMain.do') && c.includes(encodeURIComponent('오이')), c.slice(0, 58)])
  await t.p.close()
}
// ── 판 ③  「찾기」가 안 되는 몰만 가진 사람
// ⛔⛔ 첫 판은 `[]`(쇼핑몰 0개)를 시드했는데 **절대 안 걸리는 칸**이었다 —
//    `store.jsx` 의 `migrateShops` 가 *"빈 배열이면 DEFAULT_SHOPS"* 라 기본 몰이 다시 들어온다.
//    📌 **「실패할 줄 모르는 검사」는 없느니만 못하다.** 그래서 «검색 주소가 없는 몰»만 남긴다 —
//       그건 store 가 안 막아주고, 옛 코드에선 재료 이름 없이 그 몰 «홈»으로만 간다.
{
  const t = await 재기([{ id: 'x', name: '동네가게', url: 'https://example.com' }], '찾기 안 되는 몰만')
  const c = await t.눌러(1)
  R.push(['⑦ 찾기 안 되는 몰만 있어도 이름으로 찾아주나', c.includes(encodeURIComponent('오이')), c.slice(0, 58)])
  await t.p.close()
}

await b.close()
srv.kill()
let 실패 = 0
for (const [k, ok, v] of R) { if (!ok) 실패++; console.log(`${ok ? '✅' : '⛔'} ${k}  —  ${v}`) }
console.log(실패 ? `\n⛔ ${실패}칸 실패` : `\n✅ ${R.length}/${R.length} 통과`)
process.exit(실패 ? 1 : 0)
