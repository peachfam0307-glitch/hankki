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

console.log('\n④ 앱 켜자마자 — gtag 가 «아직 없을» 때')
끔(); 비움()
S.로그인됨('google.com', true)
켬()
본다('gtag 가 없으면 행동은 «버려진다»', 통.slice(), [])
console.log('     ⛔ 소개·로그인 화면은 «앱 켜자마자»라 바로 이 자리다 — 그냥 넣으면 샌다')

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
