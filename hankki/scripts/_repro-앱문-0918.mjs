// 📱🔬 「앱으로 열리나」 재현판 (2026-09-18) — 창업자 *"쿠팡이츠 눌러봤는데 그냥 대표홈페이지였어. 배민도 그렇고"*
//   ⭐ 안드로이드면 intent:// 로 앱을 열고, 아이폰·컴퓨터면 그대로 웹이라야 한다.
//   ⛔ 꾸러미 이름이 틀리면 앱이 있어도 안 열린다 — 그래서 «적힌 그대로» 나오는지 글자로 잰다.
import { 앱문 } from '../src/utils.js'
const 안드 = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
const 아이폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1'
let 통과 = 0; const 실패 = []
const 본다 = (n, 참) => { if (참) { 통과++; console.log('  ✓', n) } else { 실패.push(n); console.log('  ✗', n) } }
const 쿠팡이츠 = 앱문('https://www.coupangeats.com', 안드)
본다('쿠팡이츠 = intent 로 바뀐다', 쿠팡이츠.startsWith('intent://'))
본다('쿠팡이츠 꾸러미 = com.coupang.mobile.eats', 쿠팡이츠.includes('package=com.coupang.mobile.eats'))
본다('앱이 없으면 웹으로 떨어진다', 쿠팡이츠.includes('browser_fallback_url=' + encodeURIComponent('https://www.coupangeats.com')))
// ⭐⭐ [2026-09-18 창업자 실물 = "C d 다돼"] **앱 «전용 스킴»이라야 열린다** — scheme=https 는 안 열렸다.
//    ⛔ 이 칸이 깨지면 그때로 되돌아간 것이다(그날 유저는 대표 홈페이지만 봤다).
본다('⭐ 쿠팡이츠는 scheme=coupangeats (⛔https 아님)', 쿠팡이츠.includes('scheme=coupangeats;') && !쿠팡이츠.includes('scheme=https;'))
const 배민 = 앱문('https://baemin.com', 안드)
본다('배민 꾸러미 = com.sampleapp', 배민.includes('package=com.sampleapp'))
본다('⭐ 배민은 scheme=baemin', 배민.includes('scheme=baemin;') && !배민.includes('scheme=https;'))
const 컬리 = 앱문('https://www.kurly.com', 안드)
본다('컬리 꾸러미 = com.dbs.kurly.m2', 컬리.includes('package=com.dbs.kurly.m2'))
본다('⭐ 컬리는 scheme=kurly', 컬리.includes('scheme=kurly;') && !컬리.includes('scheme=https;'))
본다('⭐ 컬리도 앱 없으면 웹으로 떨어진다', 컬리.includes('browser_fallback_url=' + encodeURIComponent('https://www.kurly.com')))
// ⭐⭐ [2026-09-18 저녁 창업자 갤럭시 실물] 스킴 «없이» 꾸러미만으로 열리는 셋 — 주소가 «그대로» 넘어가야 한다
{
  const 제타 = 앱문('https://lottemartzetta.com', 안드)
  본다('⭐ 롯데마트 제타 = 꾸러미만 (스킴 없음)', 제타.includes('package=com.osp.lotte.mobile') && !제타.includes('scheme='))
  본다('⭐ 제타는 «그 주소 그대로» 넘어간다 (홈이 아니다)', 제타.startsWith('intent://lottemartzetta.com#Intent;'))
  const 이마트 = 앱문('https://emart.ssg.com', 안드)
  본다('⭐ 이마트몰 = kr.co.emart.emartmall', 이마트.includes('package=kr.co.emart.emartmall') && !이마트.includes('scheme='))
  // ⭐ 창업자가 준 «장보기몰» 주소 — 대표(icoop.or.kr)로 가면 안 된다(창업자 2026-09-18 «지금은 대표로 들어사져»)
  const 자연 = 앱문('https://icoop.or.kr/coopmall/shopMain.phtm', 안드)
  본다('⭐ 자연드림 = com.naturaldream.app', 자연.includes('package=com.naturaldream.app') && !자연.includes('scheme='))
  본다('⭐ 자연드림은 «장보기몰»로 간다 (대표가 아니다)', 자연.startsWith('intent://icoop.or.kr/coopmall/shopMain.phtm#'))
  본다('⭐ 셋 다 앱 없으면 웹으로 떨어진다', [제타, 이마트, 자연].every((x) => x.includes('browser_fallback_url=')))
}
// ⛔ 요기요는 ⓐ=ⓒ=ⓓ 가 «전부 같은 화면»이었다(＝앱이 그 주소를 안 받는다) → 웹 그대로. 꾸러미는 찾았지만 안 쓴다.
본다('⛔ 요기요는 그대로 웹 (실물로 안 열렸다)', 앱문('https://www.yogiyo.co.kr/mobile/', 안드) === 'https://www.yogiyo.co.kr/mobile/')
본다('아이폰은 그대로 웹', 앱문('https://www.coupangeats.com', 아이폰) === 'https://www.coupangeats.com')
본다('모르는 곳은 그대로 웹', 앱문('https://shopping.naver.com', 안드) === 'https://shopping.naver.com')
본다('요기요에 붙은 게 «하나도 없다» — 꾸러미를 찾았어도 안 쓴다', !앱문('https://www.yogiyo.co.kr/mobile/', 안드).includes('fineapp'))
본다('주소가 이상해도 안 죽는다', 앱문('그냥글자', 안드) === '그냥글자')
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) process.exit(1)
