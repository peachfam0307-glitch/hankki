// 🛒 **「쿠팡 검색 주소는 안드로이드에서 쿠팡 앱으로 나가나」 재현판** (smoke · 2026-09-05)
//
// 📮 창업자 실물 — 17:22 사골스틱 → 「사용권한이 없습니다」 · 17:35 *"하바티 간장 다 안되네"* · 17:50 크롬에선 열림
//   · 18:32 검사 1 *"4번만 돼"*(⛔카톡 브라우저에서 한 검사였다 — v12.60·61 크롬 강제는 앱에서 실패)
//   · 20:55 검사 2(크롬) = **Ⓔ `coupang://search?q=` 가 쿠팡 앱 검색 결과까지 열었다** · Ⓒ(intent https)는 스토어 화면
//
// ⛔ 왜 필요한가 = 이 갈래는 «조용히» 되돌아간다. `쿠팡문` 을 빼도 화면은 멀쩡하고 링크는 열리는 «척» 한다.
// 🧪 규칙 12 = `쿠팡문` 에서 coupang:// 변환을 빼면 ①②⑦이, 안드로이드 검사를 빼면 ④가 죽는다.
import { 쿠팡문 } from '../src/utils.js'

let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36'
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'

const q = encodeURIComponent('설성목장 한우 사골 곰탕 스틱')
const 검색 = 'https://www.coupang.com/np/search?q=' + q
const 직접 = 'https://www.coupang.com/vp/products/184626081?itemId=528358851&vendorItemId=95181086574'
적기(쿠팡문(검색, AND) === 'coupang://search?q=' + q, `① 검색 길 → coupang://search?q= (쿠팡 앱 · 검사 2 Ⓔ)`)
적기(쿠팡문('https://www.coupang.com/np/search?channel=user&q=' + q, AND) === 'coupang://search?q=' + q, `② q 가 뒤에 있어도 집는다`)
적기(쿠팡문(직접, AND) === 직접, `③ 직접 상품 링크는 아직 그대로(https) — 앱 딥링크 모양을 모른다(검사 3 대기)`)
적기(쿠팡문(검색, IOS) === 검색, `④ 아이폰은 그대로`)
적기(쿠팡문('https://www.kurly.com/search?sword=x', AND) === 'https://www.kurly.com/search?sword=x', `⑤ 컬리는 안 건드림`)
적기(쿠팡문('https://smartstore.naver.com/x', AND).startsWith('https://'), `⑥ 네이버도 그대로`)
적기(쿠팡문('https://m.coupang.com/nm/search?q=a', AND) === 'coupang://search?q=a', `⑦ m.coupang 검색도 앱으로`)

console.log(bad ? `\n⛔ ${bad}개 틀림` : '\n✅ 쿠팡문 7칸 통과')
process.exit(bad ? 1 : 0)
