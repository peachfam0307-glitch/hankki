// 💳 인앱결제 게이트 — `npm run smoke` 에 물린다. 어기면 배포가 막힌다.
//
// ⭐⭐ 무엇을 지키나 (둘 다 «돈이 걸린» 실패다)
//   ① **API 가 없는 곳에서 앱이 안 죽는다** — 웹(PWA)·구버전 크롬엔 Digital Goods API 가 아예 없다.
//      결제가 «안 되는 것»과 앱이 «깨지는 것»은 다르다.
//   ② **이름 세 벌이 서로 맞는다** — 팩 키(`chuseok`) · 상품 ID(`deco_chuseok`) · 잠금 키(`chuseok2026`).
//      어긋나면 **돈을 냈는데 안 열린다.** 화면으로는 안 보이고 조용히 틀린다.
//
// 📌 규칙 7 — 고치기 전에 재현한다. 여기선 «가짜 Play» 를 심어 구매 흐름을 그대로 돌려본다.
//    (헤드리스엔 진짜 Play 가 없다. 실기기 확인은 Play Console 「라이선스 테스트」로 따로 한다.)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, '..', 'src')

let fail = 0
const ok = (cond, what) => {
  if (cond) console.log(`  ✅ ${what}`)
  else { console.log(`  ❌ ${what}`); fail++ }
}

// ── 가짜 Play 를 심는다 ────────────────────────────────────
// `window` 를 먼저 만들어야 billing.js 가 `'getDigitalGoodsService' in window` 를 볼 수 있다.
globalThis.window = globalThis
// ⚠️ Node 22 엔 `navigator` 가 **읽기전용으로 이미 있고**, Node 20(＝CI) 엔 아예 없다.
//   그냥 대입하면 22 에서 TypeError 로 죽는다(실제로 죽었다) → 없을 때만 심는다.
//   ⛔ 로컬(22)만 보고 통과시키면 배포(20)에서 터진다 — v9.48 `globSync` 사고와 같은 함정.
if (!('navigator' in globalThis)) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: 'ko-KR' }, configurable: true,
  })
}

function fakePlay({ owned = [], buyResult = 'ok' } = {}) {
  const consumed = []
  globalThis.getDigitalGoodsService = async (url) => {
    if (url !== 'https://play.google.com/billing') throw new Error('unsupported')
    return {
      getDetails: async (ids) =>
        ids.map((id) => ({
          itemId: id, title: `상품 ${id}`, description: '설명',
          price: { currency: 'KRW', value: '990' },
        })),
      listPurchases: async () => owned.map((sku) => ({ itemId: sku, purchaseToken: `tok_${sku}` })),
      consume: async (t) => { consumed.push(t) },
    }
  }
  globalThis.PaymentRequest = class {
    constructor(methods) { this.sku = methods[0].data.sku }
    async show() {
      if (buyResult === 'cancel') { const e = new Error('cancel'); e.name = 'AbortError'; throw e }
      if (buyResult === 'throw') throw new Error('boom')
      return {
        details: buyResult === 'notoken' ? {} : { purchaseToken: `tok_${this.sku}` },
        complete: async (s) => { globalThis.__completed = s },
      }
    }
  }
  return { consumed }
}

function clearPlay() {
  delete globalThis.getDigitalGoodsService
  delete globalThis.PaymentRequest
}

// billing.js 는 모듈 캐시를 타므로 캐시(`_reset`)만 비우고 재사용한다.
const B = await import(join(SRC, 'billing.js'))

// ── ① API 가 없을 때 — 조용히 꺼져야 한다 ──────────────────
console.log('\n① Play 가 없는 곳(웹·구버전 크롬)')
clearPlay(); B._reset()
ok((await B.canBuy()) === false, 'canBuy() 가 false')
ok((await B.purchases()).length === 0, 'purchases() 가 빈 배열 (예외 아님)')
ok((await B.details([B.SKU.chuseok])).length === 0, 'details() 가 빈 배열')
ok((await B.ownedPackKeys()).length === 0, 'ownedPackKeys() 가 빈 배열')
ok((await B.buy(B.SKU.chuseok)).reason === 'unavailable', "buy() 가 reason:'unavailable'")
ok((await B.consume('tok')) === false, 'consume() 이 false')

// ── ② 있을 때 — 값을 제대로 읽는다 ────────────────────────
console.log('\n② Play 가 있을 때')
fakePlay({ owned: [B.SKU.chuseok, B.SKU.autumn] }); B._reset()
ok((await B.canBuy()) === true, 'canBuy() 가 true')
const d = await B.details([B.SKU.chuseok])
ok(d.length === 1 && d[0].sku === B.SKU.chuseok, 'details() 가 상품을 돌려준다')
ok(/990/.test(d[0].price), `가격에 990 이 들어간다 (실제: ${d[0].price})`)
const keys = (await B.ownedPackKeys()).sort()
ok(keys.join(',') === 'autumn,chuseok', `산 팩 두 개를 정확히 집는다 (실제: ${keys.join(',')})`)

// ── ③ 구매 흐름 ────────────────────────────────────────────
console.log('\n③ 구매')
fakePlay({ buyResult: 'ok' }); B._reset()
const r1 = await B.buy(B.SKU.halloween)
ok(r1.ok === true && r1.token === `tok_${B.SKU.halloween}`, '성공하면 토큰을 돌려준다')
ok(globalThis.__completed === 'success', "complete('success') 를 부른다")

fakePlay({ buyResult: 'cancel' }); B._reset()
const r2 = await B.buy(B.SKU.halloween)
ok(r2.ok === false && r2.reason === 'cancel', "유저가 닫으면 reason:'cancel' (⛔오류 아님)")

fakePlay({ buyResult: 'notoken' }); B._reset()
globalThis.__completed = null
const r3 = await B.buy(B.SKU.halloween)
ok(r3.ok === false && r3.reason === 'fail', "토큰이 없으면 reason:'fail'")
ok(globalThis.__completed === 'fail', "그때 complete('fail') 을 부른다")

fakePlay({ buyResult: 'throw' }); B._reset()
const r4 = await B.buy(B.SKU.halloween)
ok(r4.ok === false && r4.reason === 'fail', '알 수 없는 오류도 예외를 안 던진다')

// ── ④ ⭐ 이름 세 벌이 맞나 (제일 중요) ─────────────────────
console.log('\n④ 팩 키 ↔ 상품 ID ↔ 모션 잠금 키')
const paid = await import(join(SRC, 'data', 'paidPacks.js'))
const packKeys = paid.PAID_PACKS.map((p) => p.key).sort()
const skuKeys = Object.keys(B.PACK_SKU).sort()
const unlockKeys = Object.keys(B.PACK_UNLOCK).sort()
ok(skuKeys.join(',') === packKeys.join(','),
  `PACK_SKU 가 유료팩 전부를 덮는다 (팩 ${packKeys.join(',')} / 표 ${skuKeys.join(',')})`)
ok(unlockKeys.join(',') === packKeys.join(','),
  `PACK_UNLOCK 이 유료팩 전부를 덮는다 (표 ${unlockKeys.join(',')})`)

// 상품 ID 가 서로 겹치면 한 상품을 사고 두 팩이 열린다.
const skuVals = Object.values(B.SKU)
ok(new Set(skuVals).size === skuVals.length, '상품 ID 에 중복이 없다')

// ⭐ 잠금 키가 «실제로 존재하는» 모션·효과를 가리키나 — 오타 하나면 영영 안 열린다.
//   `Stickers.jsx` 는 JSX 라 import 가 안 되므로 글자로 뽑는다(파서 대신 정규식 — 값만 필요하다).
// ⚠️ 주석 줄은 뺀다 — `// pack: '키' = 설명…` 같은 «설명문»이 값으로 잡혔다(실제로 잡혔다).
//    📌 v9.16 교훈과 같다: 시끄러운 게이트는 아무도 안 본다.
const stickers = readFileSync(join(SRC, 'components', 'Stickers.jsx'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
const packsInCode = new Set([...stickers.matchAll(/pack:\s*'([^']+)'/g)].map((m) => m[1]))
for (const [k, unlock] of Object.entries(B.PACK_UNLOCK)) {
  ok(packsInCode.has(unlock), `'${k}' 의 잠금 키 '${unlock}' 이 Stickers.jsx 에 실제로 있다`)
}

// ⚠️ 반대쪽도 본다 — 코드엔 있는데 표에 없는 잠금 키(＝영영 못 파는 모션)
const unlockVals = new Set(Object.values(B.PACK_UNLOCK))
const orphan = [...packsInCode].filter((p) => p !== 'bg' && !unlockVals.has(p))
if (orphan.length) {
  console.log(`  ⚠️ 표에 없는 잠금 키 ${orphan.length}개 — 아직 팩이 없는 것들이라 «경고만» 한다`)
  console.log(`     ${orphan.join(' · ')}`)
}

// ── ⑤ 아직 팔지 않는다 ────────────────────────────────────
console.log('\n⑤ 안전장치')
ok(paid.PAID_PACKS.every((p) => p.sellable === false),
  '아직 sellable 이 전부 false — ⛔재심사(8/16) 전엔 결제를 안 켠다')

clearPlay()
console.log(fail ? `\n❌ 인앱결제 검사 실패 ${fail}건\n` : '\n✅ 인앱결제 검사 통과\n')
process.exit(fail ? 1 : 0)
