// 🍎📊 [2026-09-14] 아이폰 껍데기의 «직접 전송» 주소가 맞게 만들어지나 — 재현판
//
// 🔢 왜 = 2026-09-14 14:02 실측(창업자 GA4 실시간 캡처 3장) — 딸 폰 22판으로 2분 돌아다녔는데 앱 화면이 0.
//    gtag 스크립트·쿠키·capacitor:// 주소 셋 다 안 기대고 g/collect 로 직접 보내기로 했다(설계 관문 통과 14:1x).
// ⛔ 여기선 «안 보낸다» — 주소를 만들기만 하고 칸을 잰다(샌드박스는 google-analytics.com 이 막혀 있다).
//    진짜 검증 = TestFlight 딸 폰 → 창업자 GA4 실시간에 home 이 뜨는 캡처.
import { 수집주소만들기, 새계정인가, IOS_PAGE, MEASUREMENT_ID } from '../src/stats.js'

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }
const 저장소 = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m } }
const 칸 = (url) => Object.fromEntries(new URL(url).searchParams)

console.log('🍎 첫 신호(처음 연 사람)')
const s = 저장소()
const t0 = 1_800_000_000_000
const a = 칸(수집주소만들기({ 이름: 'home', 저장소: s, 지금: t0, 화면크기: '390x844', 언어: 'ko-kr' }))
잰다(a.v === '2' && a.tid === MEASUREMENT_ID, 'v=2 · tid 는 우리 측정 ID', a.tid)
잰다(a._fv === '1' && a._ss === '1' && a.sct === '1' && a._s === '1', '첫 방문 _fv=1 · 세션 시작 _ss=1 · sct=1 · _s=1')
잰다(a.en === 'page_view' && a.dt === 'home', 'page_view 에 화면 이름을 dt 로', a.dt)
잰다(a.dl === `${IOS_PAGE}#home` && new URL(a.dl).pathname === '/hankki/ios', '주소 = https · 경로 /hankki/ios (콘솔에서 아이폰만 가르는 칸)', a.dl)
잰다(a.seg === '1' && Number(a._et) > 0, '참여 seg=1 · _et>0 (활성 사용자로 세게)', a._et)
잰다(a.sr === '390x844' && a.ul === 'ko-kr' && !('ep.traffic_type' in a), '화면·언어 실림 · 보통 유저는 internal 딱지 없음')
잰다(/^\d+\.\d+$/.test(a.cid), 'cid 모양 = 숫자.숫자', a.cid)

console.log('🍎 같은 세션 두 번째 신호(5분 뒤)')
const b = 칸(수집주소만들기({ 이름: 'myrecipes', 저장소: s, 지금: t0 + 5 * 60 * 1000 }))
잰다(b.cid === a.cid, '같은 사람(cid 그대로) — 켤 때마다 새 사람으로 안 센다')
잰다(b.sid === a.sid && !('_fv' in b) && !('_ss' in b) && b._s === '2' && b.sct === '1', '같은 세션 · _fv/_ss 없음 · _s=2')
잰다(b._et === String(5 * 60 * 1000), '_et = 지난 신호부터 5분', b._et)

console.log('🍎 31분 뒤 = 새 세션')
const c = 칸(수집주소만들기({ 이름: 'home', 저장소: s, 지금: t0 + 36 * 60 * 1000 }))
잰다(c.cid === a.cid && c.sid !== a.sid && c._ss === '1' && c.sct === '2' && c._s === '1' && !('_fv' in c), '사람 같고 세션 새로 · sct=2 · _fv 없음')

console.log('🍎 시계 거꾸로')
const d = 수집주소만들기({ 이름: 'home', 저장소: s, 지금: t0 - 1000 })
잰다(!!d && 칸(d)._ss === '1', '음수 간격 → 던지지 않고 새 세션으로')

console.log('🍎 우리 기기 · 저장소 고장')
const e = 칸(수집주소만들기({ 이름: 'home', 저장소: 저장소(), 지금: t0, 내부: true }))
잰다(e['ep.traffic_type'] === 'internal', '운영자 기기는 traffic_type=internal (콘솔 필터가 거른다)')
const 고장 = { getItem: () => { throw new Error('x') }, setItem: () => {} }
잰다(수집주소만들기({ 이름: 'home', 저장소: 고장, 지금: t0 }) === null, '저장소 못 읽으면 null = 안 보낸다(매번 새 사람으로 세지 않는다)')

console.log('🔑 새 계정 판정')
잰다(새계정인가({ creationTime: 'Mon, 14 Sep 2026 05:00:00 GMT', lastSignInTime: 'Mon, 14 Sep 2026 05:00:30 GMT' }) === true, '30초 안 = 새 계정(signup)')
잰다(새계정인가({ creationTime: 'Mon, 01 Sep 2026 05:00:00 GMT', lastSignInTime: 'Mon, 14 Sep 2026 05:00:00 GMT' }) === false, '13일 뒤 = 재로그인(login)')
잰다(새계정인가(undefined) === false && 새계정인가({}) === false, '못 읽으면 login 으로(부풀리지 않는다)')

console.log(나쁨 ? `\n⛔ ${나쁨}칸 틀렸다` : '\n✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
