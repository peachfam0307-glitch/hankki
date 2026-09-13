// 🥬🔗 「레시피 재료를 장보기에 담으면 파트너스 링크가 붙나」 — 배포 게이트 (2026-09-12)
//
// 📮 창업자 = *"거의 쿠팡에서 살수있던데 이렇게 사는 것도 우리 수수료받아?"* → **안 받고 있었다.**
//    ＋ *"다 붙여야지.. 그리고 장보기에 들어가는 것도 다 붙이자"*
//    ＋ *"최대한 내가 두번일안하게 잘 설계해줄래 부탁해"*
//
// ⛔⛔ 왜 게이트가 필요한가 — 이건 **조용히 새는 종류**다.
//    화면은 똑같이 「사러가기」가 뜨고 쿠팡도 열린다. 다른 건 «수수료가 붙나»뿐이라
//    **눈으로는 영영 못 잡는다.** 실제로 그렇게 몇 달을 샜다.
//    ⭐ 그래서 「이어주는 줄이 살아 있나」를 앱을 띄워서 본다(⛓절대원칙 34 — 실패의 모양을 바꾼다).
//
// 보는 것 넷 — ⛔ 표가 «비어 있어도» 통과해야 한다(링크는 창업자가 하나씩 만든다)
//   ① 큐레이션이 덮는 재료는 표가 비어도 파트너스가 붙나 (＝창업자 손 0으로 붙는 몫)
//   ② 표에 넣으면 실제로 그 링크가 나오나
//   ③ 꼬리표 변형(「참기름 한 바퀴」)이 같은 링크로 이어지나 (＝창업자가 두 번 안 만들게)
//   ④ ⛔ 낱말 «한가운데»에서 걸리지 않나 — 「노두유」가 「두유」로 걸리면 유저가 엉뚱한 걸 산다
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const pg = await b.newPage()
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1200)

// ⭐⭐ **「담아 보고 저장된 것을 읽는다」** — 유저가 겪는 그대로다.
//   ⛔ 처음엔 번들에서 `ingLink` 를 꺼내려 했는데 **안 나온다** — 그 함수는 `store.jsx` 에서만 쓰여
//      번들러가 안쪽으로 «인라인»해 버린다(export 로 안 남는다). 못 꺼내는 건 코드가 멀쩡해도 그렇다.
//   ✅ 그래서 «담는 길»을 그대로 태운다 — 앱의 `addShopItems` 를 부르고 저장된 줄을 읽는다.
//      ⭐ 이 길이 오히려 진짜다: 레시피 「장보기 담기」와 장보기 자유 입력이 **둘 다** 이 자리를 지난다.
const KEY = 'hankki:v1'
const 답 = await pg.evaluate(async (열쇠) => {
  const 볼것 = ['진간장', '성가정 진간장', '요리맛샘 맛술', '물', '물 500ml', '밥',
    '노두유', '간장게장', '참치액', '대파', '참기름', '참기름 한 바퀴']
  // 앱이 담는 길 = React 안이라 화면을 거쳐야 한다. 「장보기 담기」 단추를 찾기보다
  // 저장된 상태를 직접 만들고 앱을 다시 띄우는 쪽이 안정적이지만, 그러면 `ingLink` 를 안 탄다.
  // → 화면의 장보기 «직접 입력»을 쓴다(같은 `addShopItems` 를 부른다).
  return { 볼것, 열쇠 }
}, KEY)

// 🛒 장보기 화면으로 가서 «직접 입력»으로 하나씩 담는다 (＝`addShopItems` 를 탄다)
const 담아보기 = async (이름) => {
  await pg.evaluate(() => { try { localStorage.removeItem('hankki:v1') } catch { /* noop */ } })
  await pg.goto(`http://localhost:${port}/hankki/`)
  await pg.waitForTimeout(700)
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((x) => /장보기/.test(x.textContent || '')); if (b) b.click() })
  await pg.waitForTimeout(400)
  const 칸 = await pg.$('input[placeholder*="살 재료"]')
  if (!칸) { await pg.screenshot({ path: '/tmp/장보기화면.png' }); return null }
  await 칸.fill(이름)
  await 칸.press('Enter')
  await pg.waitForTimeout(250)
  return await pg.evaluate((이) => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const 줄 = (s.shoppingList || []).find((x) => x.name === 이)
      return 줄 ? (줄.url || '') : null
    } catch { return null }
  }, 이름)
}
const 답2 = { ok: false }
const 첫 = await 담아보기('진간장')
if (첫 !== null) {
  답2.ok = true
  for (const [키, 이름] of [['진간장', '진간장'], ['성가정진간장', '성가정 진간장'], ['맛술', '요리맛샘 맛술'],
    ['물', '물'], ['물500', '물 500ml'], ['밥', '밥'], ['노두유', '노두유'], ['간장게장', '간장게장'],
    ['참치액', '참치액'], ['참기름', '참기름'], ['참기름변형', '참기름 한 바퀴']])
    답2[키] = 키 === '진간장' ? 첫 : await 담아보기(이름)
}
답2.표크기 = (readFileSync(join(여기, '../src/data/ingLinks.js'), 'utf8').match(/^\s*'[^']+':\s*'https:/gm) || []).length
Object.assign(답, 답2)
await b.close(); srv.close()

const 탈 = []
// ⛔ 못 꺼내면 «조용히 통과»시키지 않는다 — 무엇을 보는지 모르는 초록불은 가짜다(규칙 18ⓘ)
if (!답.ok) { console.error('\n⛔ 번들에서 `ingLink` 를 못 꺼냈다 — 이어주는 줄이 끊겼거나 이 검사가 낡았다.\n'); process.exit(1) }

const 파트너스 = (v) => typeof v === 'string' && v.startsWith('https://link.coupang.com/')
// ── ① 큐레이션이 덮는 재료 = 표가 비어도 파트너스가 붙어야 한다
for (const [이름, v] of [['진간장', 답.진간장], ['성가정 진간장', 답.성가정진간장], ['요리맛샘 맛술', 답.맛술]])
  if (!파트너스(v)) 탈.push(`⛔ 「${이름}」 은 주부의 장바구니 제품이 덮는 재료인데 파트너스 링크가 «안» 나온다 → ${JSON.stringify(v)}\n   👉 \`ingLink()\` 가 \`picksForIngredients\`/\`productLink\` 를 부르는지 확인할 것.`)

// ── ④ 낱말 한가운데에서 걸리면 유저가 엉뚱한 걸 산다 (2026-08-03 「노두유」 사고)
for (const [이름, v] of [['노두유', 답.노두유], ['간장게장', 답.간장게장], ['참치액', 답.참치액]])
  if (v) 탈.push(`⛔⛔ 「${이름}」 에 링크가 붙었다 — 낱말 «한가운데»에서 걸린 것이다 → ${String(v).slice(0, 60)}\n   📌 2026-08-03: 「노두유(중국 진간장)」가 「두유」로 걸렸다. 안 붙는 것보다 «엉뚱한 게 붙는 것»이 나쁘다.`)

// ── 안 사는 것에 링크가 붙으면 안 된다
for (const [이름, v] of [['물', 답.물], ['물 500ml', 답.물500], ['밥', 답.밥]])
  if (v) 탈.push(`⛔ 「${이름}」 은 «안 사는 것»인데 링크가 붙었다 → ${String(v).slice(0, 60)}\n   📮 창업자 2026-09-12 = *"밥면수이런건 말고"*`)

// ── ②③ 표에 값이 있을 때만 잴 수 있다 (비어 있으면 건너뛴다 — 그게 정상 상태다)
if (답.표크기 > 0 && 답.참기름) {
  if (!답.참기름변형) 탈.push('⛔ 「참기름 한 바퀴」 가 「참기름」 링크로 안 이어진다 — 꼬리표 변형 잇기가 끊겼다.\n   👉 그러면 창업자가 같은 제품 링크를 몇 번씩 만들게 된다.')
  else if (답.참기름변형 !== 답.참기름) 탈.push(`⛔ 「참기름 한 바퀴」 가 「참기름」 과 «다른» 링크로 간다 — 엉뚱한 것이 걸렸다.\n   참기름=${String(답.참기름).slice(0,50)}\n   변형  =${String(답.참기름변형).slice(0,50)}`)
}

if (탈.length) { console.error('\n' + 탈.join('\n\n') + '\n'); process.exit(1) }
console.log(`✅ 재료 링크 — 큐레이션 잇기 O · 낱말 한가운데 안 걸림(노두유·간장게장·참치액) · 안 사는 것 안 붙음 · 표 ${답.표크기}개`)
