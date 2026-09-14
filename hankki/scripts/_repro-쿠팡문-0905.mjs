// 🛒 **「쿠팡 주소는 안드로이드에서 쿠팡 앱으로 나가나」 재현판** (smoke · 2026-09-05)
//
// 📮 창업자 실물 — 17:22 사골스틱 → 「사용권한이 없습니다」 · 17:35 *"하바티 간장 다 안되네"* · 17:50 크롬에선 열림
//   · 18:32 검사 1 *"4번만 돼"*(⛔카톡 브라우저에서 한 검사였다 — v12.60·61 크롬 강제는 앱에서 실패)
//   · 20:55 검사 2(크롬) = Ⓔ `coupang://search?q=` 가 쿠팡 앱 검색 결과까지 열었다 · Ⓒ(intent https)는 스토어 화면
//   · 23:17 검사 3 = 상품 딥링크 후보 ①~⑤ «홈/검색» · **⑥ intent(scheme=coupang · 폴백 웹) 만 열렸다** → 직접 상품 4개는 «이름으로 앱 검색»
//
// ⛔ 왜 필요한가 = 이 갈래는 «조용히» 되돌아간다. `쿠팡문` 을 빼도 화면은 멀쩡하고 링크는 열리는 «척» 한다.
// 🧪 규칙 12 = `쿠팡문` 에서 intent 변환을 빼면 ①②③⑦이, 안드로이드 검사를 빼면 ④가, 이름 갈래를 빼면 ③이 죽는다.
import { 쿠팡문 } from '../src/utils.js'

let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36'
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'

const q = encodeURIComponent('설성목장 한우 사골 곰탕 스틱')
const 검색 = 'https://www.coupang.com/np/search?q=' + q
const 직접 = 'https://www.coupang.com/vp/products/184626081?itemId=528358851&vendorItemId=95181086574'
const 앱 = (qq) => `intent://search?q=${qq}#Intent;scheme=coupang;package=com.coupang.mobile;S.browser_fallback_url=${encodeURIComponent('https://www.coupang.com/np/search?q=' + qq)};end`
적기(쿠팡문(검색, AND) === 앱(q), `① 검색 길 → 쿠팡 앱 검색 intent (검사 3 ⑥ 모양 · 앱 없으면 웹 검색 폴백)`)
적기(쿠팡문('https://www.coupang.com/np/search?channel=user&q=' + q, AND) === 앱(q), `② q 가 뒤에 있어도 집는다`)
const 하바티 = encodeURIComponent('알라 하바티치즈')
적기(쿠팡문(직접, AND, '알라 하바티치즈') === 앱(하바티), `③ 직접 상품 링크 + 이름 → 이름으로 앱 검색 (상품 딥링크는 쿠팡 앱이 안 받았다)`)
적기(쿠팡문(직접, AND) === 직접, `③-2 이름이 없으면 그대로 https — 모르면 안 바꾼다`)
적기(쿠팡문(검색, IOS) === 검색, `④ 아이폰은 그대로`)
적기(쿠팡문('https://www.kurly.com/search?sword=x', AND) === 'https://www.kurly.com/search?sword=x', `⑤ 컬리는 안 건드림`)
적기(쿠팡문('https://smartstore.naver.com/x', AND).startsWith('https://'), `⑥ 네이버도 그대로`)
적기(쿠팡문('https://m.coupang.com/nm/search?q=a', AND) === 앱('a'), `⑦ m.coupang 검색도 앱으로`)
적기(!쿠팡문(검색, AND).startsWith('coupang://'), `⑧ 맨 coupang:// 은 안 쓴다 — 앱 없는 폰에 폴백이 없다`)

console.log(bad ? `\n⛔ ${bad}개 틀림` : '\n✅ 쿠팡문 9칸 통과')
process.exit(bad ? 1 : 0)
