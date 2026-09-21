// 🔬🔬 [2026-09-21] **「안 세어진다」가 «어디서» 끊기는지 한 칸씩 재현한다.**
//
// 📮 창업자 = *"왜 지금 안되고 있는지 원인파악하고 어떻게 고치면 되는지 재현, 시뮬레이션 직!접! 돌려보고 보고해 (확실하면 그때 말해)"*
//
// ⛔ 코드를 «읽어서» 「멀쩡해 보인다」고 말하지 않는다 — BragScreen 버그가 정확히 그렇게 숨어 있었다.
//    ⭐ 여기서는 `stats.js` 를 «진짜로 불러서» 무엇이 나가는지 잡는다.
//
// 재는 칸 = ① 로그인/가입 ② 레꾸자랑(버그 자리) ③ 자물쇠(안 보내는 화면)
//          ④ gtag 가 아직 없을 때(앱 켜자마자) ⑤ 통계를 끈 사람 ⑥ 우리 기기
import './_fresh.mjs'

// 🧪 브라우저 흉내 — stats.js 가 쓰는 것만 최소로 세운다.
const 통 = []
const 저장 = new Map()
globalThis.window = globalThis
globalThis.localStorage = {
  getItem: (k) => (저장.has(k) ? 저장.get(k) : null),
  setItem: (k, v) => 저장.set(k, String(v)),
  removeItem: (k) => 저장.delete(k),
}
// ⛔ Node 22 는 navigator 가 «읽기 전용»이라 그냥 대입하면 죽는다 — 덮어쓰기로 세운다.
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node', language: 'ko-kr', sendBeacon: () => true }, configurable: true, writable: true })
globalThis.screen = { width: 390, height: 844 }
globalThis.document = { createElement: () => ({ set onload(v) {}, set onerror(v) {} }), head: { appendChild() {} } }
globalThis.location = { href: 'https://peachfam0307-glitch.github.io/hankki/', search: '' }

const S = await import('../src/stats.js')

let 칸 = 0, 틀림 = 0
const 본다 = (이름, 나온것, 바란것) => {
  칸 += 1
  const 같나 = JSON.stringify(나온것) === JSON.stringify(바란것)
  if (!같나) 틀림 += 1
  console.log(`  ${같나 ? '✅' : '⛔'} ${이름}`)
  if (!같나) console.log(`       나온 값 ${JSON.stringify(나온것)} · 바란 값 ${JSON.stringify(바란것)}`)
}
const 비움 = () => { 통.length = 0 }
const 켬 = () => { globalThis.gtag = (a, b, c) => { if (a === 'event' && c && c.page_title) 통.push(c.page_title) } }
const 끔 = () => { delete globalThis.gtag }

console.log('\n🔬 관문이 «어디서» 끊기나 — 한 칸씩 재현\n')

console.log('① 로그인·가입 — 성공한 순간 무엇이 나가나')
켬(); 비움()
S.로그인됨('google.com', true); 본다('새 계정이면 signup_google', 통.slice(), ['signup_google'])
비움(); S.로그인됨('google.com', false); 본다('기존 계정이면 login_google', 통.slice(), ['login_google'])
비움(); S.로그인됨('apple.com', true); 본다('애플 새 계정이면 signup_apple', 통.slice(), ['signup_apple'])
비움(); S.로그인됨('facebook.com', true); 본다('모르는 공급자는 «안» 보낸다', 통.slice(), [])

console.log('\n② 레꾸자랑 — 계측 함수 자체는 멀쩡한가')
비움(); S.자랑보냄(); 본다('자랑보냄() 은 brag_shared 를 보낸다', 통.slice(), ['brag_shared'])
console.log('     📌 함수는 멀쩡하다 — 그래서 BragScreen 의 «이름 겹침»이 진짜 범인이다')

console.log('\n③ 자물쇠 — 목록에 없는 화면은 안 나간다')
비움(); S.화면봄('home'); 본다('home 은 나간다', 통.slice(), ['home'])
비움(); S.화면봄('cloudgate'); 본다('cloudgate 는 «막힌다»(자물쇠에 없다)', 통.slice(), [])
비움(); S.화면봄('onboarding'); 본다('onboarding 도 «막힌다»', 통.slice(), [])
비움(); S.화면봄('pantry'); 본다('pantry 도 «막힌다»', 통.slice(), [])

console.log('\n④ 앱 켜자마자 — gtag 가 «아직 없을» 때 (⏳ 2026-09-21 한 칸 → 줄로 고친 자리)')
// 🔢 2026-09-21 실물 = Firebase 에 오늘 가입 1명(seohwi0117 · 09-21 생성)이 «있는데» GA4 엔 signup_google 이 0건.
//    가입은 앱 켜자마자 첫 화면에서 나서 gtag 가 붙기 «전»이었다 → 옛 코드는 여기서 «버렸다».
끔(); 비움()
S.로그인됨('google.com', true)
본다('gtag 가 없으면 «버리지 않고» 줄에 담는다', S.대기상태().줄, ['signup_google'])
본다('아직 밖으로는 안 나갔다', 통.slice(), [])
켬(); S.줄비우기()
본다('gtag 가 붙은 뒤 줄을 비우면 «그때» 나간다', 통.slice(), ['signup_google'])
본다('비운 뒤 줄은 빈다', S.대기상태().줄, [])
console.log('     ⭐ 옛 코드였으면 위 첫 칸이 [] 였다 — Firebase 의 그 1명이 GA4 에서 «사라진» 자리다')

console.log('\n④-2 앱 켜자마자 «여럿»이 나도 순서대로 «다» 나간다 (옛 코드 = 마지막 하나만)')
끔(); 비움()
S.화면봄('home'); S.로그인화면봄(); S.로그인실패(); S.로그인됨('google.com', true)
본다('화면·관문·행동이 «섞여도» 순서대로 담긴다', S.대기상태().줄, ['home', 'gate_seen', 'gate_fail', 'signup_google'])
켬(); S.줄비우기()
본다('넷 다 나간다 — 하나도 안 덮인다', 통.slice(), ['home', 'gate_seen', 'gate_fail', 'signup_google'])

console.log('\n④-3 넘치면 «오래된 것부터» 버리고 «몇 개 버렸는지» 센다 (상한 20)')
끔(); 비움()
for (let i = 0; i < 25; i++) S.냉장고열림()
본다('줄은 20 을 안 넘는다', S.대기상태().줄.length, 20)
본다('버린 수를 조용히 넘기지 않는다', S.대기상태().넘쳐버린수 >= 5, true)
켬(); S.줄비우기()

console.log('\n⑦ 새 관문 17개 — 이름이 «고정»이고 값이 안 섞인다')
켬(); 비움()
S.소개봄(); S.소개건너뜀(); S.소개끝냄(); S.로그인화면봄(); S.로그인실패(); S.로그인탈출()
S.알림시트봄(); S.알림허락(); S.알림거절(); S.알림으로들어옴(); S.리뷰시트봄(); S.리뷰하러감()
S.냉장고열림(); S.장바구니펼침(); S.자랑고름(); S.자랑사진저장(); S.열쇠받음(); S.열쇠막힘(); S.선물시트봄(); S.선물보러감()
본다('20개 이름이 그대로 나간다', 통.slice(), ['onboard_seen', 'onboard_skip', 'onboard_done', 'gate_seen', 'gate_fail', 'gate_escape',
  'push_seen', 'push_ok', 'push_no', 'push_open', 'review_seen', 'review_go',
  'pantry_open', 'pick_open_shop', 'brag_pick', 'brag_saved_fallback', 'key_earn', 'key_block', 'gift_seen', 'gift_go'])
본다('전부 40자 아래(GA4 상한)', 통.every((n) => n.length <= 40), true)
본다('이름에 숫자·값이 안 섞였다', 통.every((n) => /^[a-z_]+$/.test(n)), true)

console.log('\n⑧ 「뜬 사람」 관문은 «한 번 뜨는 컴포넌트»에 걸려 있다 — 장마다 뜨는 틀에 걸면 사람당 N번 나간다')
// ⛔⛔ [2026-09-21 15:1x GA4 실측] onboard_seen 50건 / 5명 = 사람당 10번. Stage(장마다 마운트)에 걸어서다.
//    눌러 잰 판은 「나갔나」만 봐서(≥1) 못 잡았다 — «몇 번»인지도 봐야 한다.
{
  const { readFileSync } = await import('node:fs')
  const 소스 = readFileSync(new URL('../src/components/Onboarding.jsx', import.meta.url), 'utf8')
  const 부름 = 소스.indexOf('소개봄()')
  const 온보딩 = 소스.indexOf('export default function Onboarding')
  const 틀 = 소스.indexOf('function Stage')
  본다('소개봄() 이 Onboarding 본체 «안»에 있다(Stage 가 아니라)', 부름 > 온보딩 && 온보딩 > 틀, true)
  본다('Stage 안에는 소개봄() 이 없다', 소스.slice(틀, 온보딩).includes('소개봄()'), false)
}

console.log('\n⑤ 통계를 끈 사람 — 아무것도 안 나가야 한다')
켬(); S.통계끄기설정(true); 비움()
S.화면봄('search'); S.자랑보냄()
본다('끈 사람에겐 0건', 통.slice(), [])
S.통계끄기설정(false)

console.log('\n⑥ 우리 기기(점검 아님) — 안 나가야 한다')
켬(); S.내부기기설정('0VRNDSjHBhwniTzIDAbnRaJygyfGJ2K2'); 비움()
// ⛔ 모듈 안 지난화면 은 밖에서 못 건드린다 — 그래서 «직전과 다른» 이름을 쓴다.
S.화면봄('shop'); S.자랑보냄()
본다('우리 기기에선 0건', 통.slice(), [])
S.내부기기설정('')

console.log(`\n${틀림 ? '⛔' : '✅'} ${칸}칸 중 ${칸 - 틀림}칸 맞았다`)
process.exit(틀림 ? 1 : 0)
