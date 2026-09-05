// 🛒 **「쿠팡 주소는 안드로이드에서 크롬으로 나가나」 재현판** (smoke · 2026-09-05)
//
// 📮 창업자 실물 — 17:22 사골스틱 → 「요청하신 페이지의 사용권한이 없습니다」 · 17:35 *"하바티 간장 다 안되네 갑자기그래"*
//   17:50 같은 폰 크롬에선 열림 · 18:32 검사 페이지 7가지 중 *"4번만 돼"*(intent · package=com.android.chrome)
//
// ⛔ 왜 필요한가 = 이 갈래는 «조용히» 되돌아간다. `쿠팡문` 을 빼도 화면은 멀쩡하고 링크는 열리는 «척» 한다.
//    막힌 건 쿠팡 쪽 화면이라 우리 어디서도 안 터진다. 창업자가 폰에서 눌러야 드러난다.
// 🧪 규칙 12 = `openExternal` 에서 `쿠팡문(...)` 을 빼면 ①②가, 안드로이드 검사를 빼면 ④가 죽는다.
import { 쿠팡문 } from '../src/utils.js'

let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36'
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'

const 검색 = 'https://www.coupang.com/np/search?q=' + encodeURIComponent('설성목장 한우 사골 곰탕 스틱')
const 직접 = 'https://www.coupang.com/vp/products/184626081?itemId=528358851&vendorItemId=95181086574'
const a = 쿠팡문(검색, AND), b = 쿠팡문(직접, AND)
적기(a.startsWith('intent://www.coupang.com/np/search?q=') && a.includes('package=com.android.chrome'), `① 검색 길 → 크롬 intent (${a.slice(0, 60)}…)`)
적기(b.startsWith('intent://www.coupang.com/vp/products/184626081') && b.includes('scheme=https'), `② 직접 상품 → 크롬 intent`)
적기(b.includes('S.browser_fallback_url=' + encodeURIComponent(직접)), `③ 크롬 없으면 원래 주소로 폴백`)
적기(쿠팡문(검색, IOS) === 검색, `④ 아이폰은 그대로 (intent 스킴 모름)`)
적기(쿠팡문('https://www.kurly.com/search?sword=x', AND) === 'https://www.kurly.com/search?sword=x', `⑤ 컬리는 안 건드림`)
적기(쿠팡문('https://smartstore.naver.com/x', AND).startsWith('https://'), `⑥ 네이버도 그대로`)
적기(쿠팡문('https://m.coupang.com/nm/search?q=a', AND).startsWith('intent://m.coupang.com/'), `⑦ m.coupang 도 크롬으로`)

console.log(bad ? `\n⛔ ${bad}개 틀림` : '\n✅ 쿠팡문 7칸 통과')
process.exit(bad ? 1 : 0)
