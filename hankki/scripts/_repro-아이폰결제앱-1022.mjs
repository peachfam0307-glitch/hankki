#!/usr/bin/env node
// 🍎 재현판 — 아이폰 앱 쪽 결제 길(`src/billing.js` 애플 갈래) · 「서버가 넣었다고 한 «뒤»에만 끝낸다」 (2026-10-22)
// ⭐ billing.js 를 «직접 import» 해서 부른다. 가짜 = 앱 부품(HankkiStore)과 워커 답 둘뿐.
// ⛔ 이 판이 증명 못 하는 것 = Swift 부품이 진짜로 StoreKit 과 이렇게 말하나 → TestFlight 시험 결제로.
let 통과 = 0, 실패 = 0
const 잰다 = (c, m, v) => { if (c) { 통과++; console.log('  ✅ ' + m) } else { 실패++; console.log('  ⛔ ' + m + (v !== undefined ? '   나온 값: ' + JSON.stringify(v) : '')) } }

const 부품 = { 끝냄: [], 안끝난: [], 사기답: null, 듣기: [] }
globalThis.window = {
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'ios',
    Plugins: {
      HankkiStore: {
        products: async ({ ids }) => ({ products: ids.map((id) => ({ id, price: '₩990', title: '레시피열쇠 20개' })) }),
        purchase: async () => 부품.사기답,
        unfinished: async () => ({ ids: 부품.안끝난 }),
        finish: async ({ id }) => { 부품.끝냄.push(id); return { finished: true } },
        addListener: (이름, fn) => { 부품.듣기.push([이름, fn]) },
      },
    },
  },
}
const b = await import('../src/billing.js')
let 워커답 = null, 보낸것 = []
b._애플보내기바꾸기(async (ids) => { 보낸것.push(ids); return typeof 워커답 === 'function' ? 워커답(ids) : 워커답 })
const 새판 = () => { 부품.끝냄 = []; 부품.안끝난 = []; 보낸것 = [] }

console.log('\n🍎 아이폰 앱 결제 길\n')
잰다(await b.canBuy(), '아이폰 앱이면 살 수 있다(구글 없이도)')
잰다(b.아이폰인가(), '아이폰인가 = true')
const d = await b.details([b.SKU.ocr20])
잰다(d[0] && d[0].price === '₩990' && d[0].sku === 'ocr_pack_20', '가격은 애플이 준 글자 그대로', d)

새판(); 부품.사기답 = { status: 'success', id: '111' }; 워커답 = { ok: true, results: [{ id: '111', ok: true }] }
let r = await b.buy('ocr_pack_20')
잰다(r.ok && 보낸것[0][0] === '111' && 부품.끝냄.join() === '111', '사기 → 서버로 보내고 «넣었다» 답 뒤에 끝낸다', { r, 보낸것, 끝냄: 부품.끝냄 })

새판(); 부품.사기답 = { status: 'success', id: '222' }; 워커답 = null   // 망이 끊겼다
r = await b.buy('ocr_pack_20')
잰다(r.ok && 부품.끝냄.length === 0, '서버 답을 못 받으면 «안 끝낸다» — 다음에 켤 때 또 나온다', 부품.끝냄)

새판(); 부품.사기답 = { status: 'success', id: '333' }; 워커답 = { ok: true, results: [{ id: '333', ok: false, reason: 'net' }] }
await b.buy('ocr_pack_20')
잰다(부품.끝냄.length === 0, '서버가 일시 실패(net)라고 하면 안 끝낸다', 부품.끝냄)

새판(); 부품.사기답 = { status: 'success', id: '444' }; 워커답 = { ok: true, results: [{ id: '444', ok: false, reason: 'revoked' }] }
await b.buy('ocr_pack_20')
잰다(부품.끝냄.join() === '444', '이미 취소된 거래는 끝낸다(안 끝내면 매번 다시 나온다)', 부품.끝냄)

새판(); 부품.사기답 = { status: 'success', id: '555' }; 워커답 = { ok: false, error: 'login_required' }
await b.buy('ocr_pack_20')
잰다(부품.끝냄.length === 0, '로그인 안 됨 → 안 끝낸다(로그인 뒤 들어오게)', 부품.끝냄)

새판(); 부품.사기답 = { status: 'cancel' }
r = await b.buy('ocr_pack_20')
잰다(!r.ok && r.reason === 'cancel' && 보낸것.length === 0, '닫으면 cancel · 서버에 안 보낸다', r)
새판(); 부품.사기답 = { status: 'pending' }
r = await b.buy('ocr_pack_20')
잰다(!r.ok && r.reason === 'pending', '가족 승인 대기 → pending', r)
새판(); 부품.사기답 = { status: 'unverified', id: '666' }; 워커답 = { ok: true, results: [{ id: '666', ok: true }] }
r = await b.buy('ocr_pack_20')
잰다(r.ok && 보낸것[0][0] === '666', 'unverified 도 서버로 보낸다(판단은 애플 서버가)', 보낸것)

새판(); 부품.안끝난 = ['7', '8', '9']; 워커답 = (ids) => ({ ok: true, results: ids.map((id) => ({ id, ok: id !== '8', reason: id === '8' ? 'apple_500' : undefined })) })
await b.syncPurchases()
잰다(보낸것[0].join() === '7,8,9' && 부품.끝냄.join() === '7,9', '켤 때 안 끝난 거래를 다시 보내고 «된 것만» 끝낸다', { 보낸것, 끝냄: 부품.끝냄 })
새판(); 부품.안끝난 = Array.from({ length: 25 }, (_, i) => String(i)); 워커답 = { ok: true, results: [] }
await b.syncPurchases()
잰다(보낸것[0].length === 10, '한 번에 10개까지(워커 상한과 같다)', 보낸것[0].length)
새판()
await b.syncPurchases()
잰다(보낸것.length === 0, '안 끝난 게 없으면 아무것도 안 보낸다')

console.log(`\n${실패 === 0 ? '✅' : '⛔'} ${통과}/${통과 + 실패} 통과\n`)
process.exit(실패 === 0 ? 0 : 1)
