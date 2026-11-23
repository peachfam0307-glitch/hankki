// 🍽 테마 — 「쉽고 직관적으로 찾기」 (창업자 2026-11-20 · 시안 A+C 확정 2026-11-21)
//   📄 전문 = docs/금요일-테마레시피-2026-11-20.md (맨 아래가 현행)
//   ⭐ 레시피가 «어느 테마인가»는 두 길로 정한다
//      ① 새 편 = basics.js 레시피에 `theme: ['해장']` (수·금 테마 편)
//      ② 이미 있는 편 = 아래 `편` 목록(제목 그대로 · 2026-11-20 클로드 초안 → ⏳ 창업자 검수)
//   ⛔ 열린 편이 0인 테마는 화면에 안 띄운다 — 빈 테마 칩은 «고장»처럼 보인다
//   🖼 그림 = 실제 음식 사진처럼(그림 원칙 ⑤ · 창업자 2026-11-21 확정 21장)
import haejang from '../assets/theme/th_haejang.webp'
import breakfast from '../assets/theme/th_breakfast.webp'
import anju from '../assets/theme/th_anju.webp'
import diet from '../assets/theme/th_diet.webp'
import kidsnack from '../assets/theme/th_kidsnack.webp'
import kidbowl from '../assets/theme/th_kidbowl.webp'
import kidside from '../assets/theme/th_kidside.webp'
import guest from '../assets/theme/th_guest.webp'
import gimbap from '../assets/theme/th_gimbap.webp'
import riceball from '../assets/theme/th_riceball.webp'
import dosirak from '../assets/theme/th_dosirak.webp'
import mealprep from '../assets/theme/th_mealprep.webp'
import tteokbokki from '../assets/theme/th_tteokbokki.webp'
import donburi from '../assets/theme/th_donburi.webp'
import sandwich from '../assets/theme/th_sandwich.webp'
import speed from '../assets/theme/th_speed.webp'
import soup from '../assets/theme/th_soup.webp'
import juk from '../assets/theme/th_juk.webp'
import world from '../assets/theme/th_world.webp'
import xmas from '../assets/theme/th_xmas.webp'
import { todayKST } from '../today.js'

export const THEMES = [
  { id: 'breakfast', name: '간단 아침', img: breakfast, 편: ['간장버터 달걀밥', '마늘간장계란밥', '치즈 샌드위치', '아보카도 바나나 스무디', '전복죽', '토마토달걀볶음', '가지 오믈렛', '원팬 또띠아 토스트', '출근 전 10분 계란샐러드', '감자 치즈 오믈렛', '참치 양배추 오믈렛', '참치마요 김가루 주먹밥', '양배추 치즈전', '비프페퍼브리또', '무스비맛브리또'] },
  { id: 'haejang', name: '해장', img: haejang, 편: ['황태국', '황태해장국', '엄마표 황태 해장국', '해장 파스타', '새우 해장 파스타', '순두부찌개', '초간단 육개장', '어묵탕', '부대찌개', '얼큰 샤브 칼국수', '돼지고기 김치찌개', '꽃게탕', '두부참치찌개', '차돌짬뽕', '포장마차 홍합탕', '굴 배춧국', '닭곰탕', '돼지고기 고추장찌개', '우렁 순두부 된장찌개', '애호박 국밥', '10분 홍합 미역국', '차돌된장찌개', '해물누룽지탕'] },
  { id: 'diet', name: '다이어트', img: diet, 편: ['닭가슴살 오이 샐러드', '닭가슴살 피자 브리또', '토마토샐러드', '연근샐러드', '연근사과샐러드', '야채 포케볼', '연어 포케볼', '치킨 레터스랩', '오이탕탕이', '문어미역샐러드', '새송이버섯 들깨무침', '브로콜리 구이', '매콤숙주두부찜', '출근 전 10분 계란샐러드', '시원한 묵채', '상추겉절이', '가지 오믈렛', '아보카도 바나나 스무디'] },
  { id: 'kidbowl', name: '아이 한그릇', img: kidbowl, 편: ['참치마요 덮밥', '뚝딱 버섯 볶음밥', '소고기 규동', '가지 소고기 덮밥', '버섯 솥밥', '소고기 솥밥', '간장버터 달걀밥', '마늘간장계란밥', '비프페퍼라이스', '토마토달걀볶음', '치즈 유부주먹밥', '참치마요 김가루 주먹밥', '소고기무솥밥', '닭구이덮밥', '층층이 유부 사각주먹밥'] },
  { id: 'kidside', name: '아이 반찬', img: kidside, 편: ['계란후라이조림', '장조림', '소고기메추리알조림', '어묵볶음', '꽈리고추 멸치볶음', '견과류 멸치볶음', '연근조림', '우엉조림', '두부참치조림', '어남선생 두부조림', '순두부조림', '목살조림', '버섯볶음', '미역줄기볶음', '양배추나물', '깻잎고기전', '버섯전', '알배추전', '양배추 치즈전', '수제 떡갈비', '한판 탕수육', '진미채볶음', '니쿠자가', '삼치 간장조림', '우삼겹 두부조림'] },
  { id: 'kidsnack', name: '아이 간식', img: kidsnack, 편: ['요거트 아이스크림', '크루키', '고구마맛탕', '고구마크룽지', '구움찰떡', '슬러시', '15분컷 약밥', '고구마 그라탕', '감자타코', '치즈 유부주먹밥', '참치마요 김가루 주먹밥', '아보카도 바나나 스무디'] },
  { id: 'anju', name: '술안주', img: anju, 편: ['오징어숙회', '대하소금구이', '항정삼합', '수육', '양지수육', '집에서 하는 족발', '꼬치 없는 꼬치전', '바삭한 대패 김치전', '오징어감자전', '감바스 알 아히요', '오이크래미냉채', '시오콘부 치킨', '한판 탕수육', '간장 조림닭', '허니 간장 치킨', '어남선생 갈비치킨', '오징어볶음', '어남선생 오징어볶음', '새우튀김', '굴전', '부추 홍합전', '포장마차 홍합탕', '새우관자전', '오징어 새우전', '깻잎고기전', '육회 깻잎무침', '대구뭉티기', '삼겹살 꽈리고추', '미나리 오징어무침', '꼬막무침', '정호영 셰프 굴무침', '간장 야키니쿠', '알배추전', '초간단 육전', '제육볶음', '치킨 레터스랩', '닭목살 불고기', '문어미역샐러드', '가지강정'] },
  { id: 'guest', name: '손님상', img: guest, 편: ['매운 소갈비찜', 'LA갈비', '샤브샤브', '스키야키', '해물찜', '보쌈 무김치', '수제 떡갈비', '대파듬뿍 불고기전골', '잡채', '전복솥밥', '랍스터 볶음', '갈비탕', '간장게장', '양념게장', '순살찜닭', '정호영 셰프 닭볶음탕', '가지 라자냐', '간장 목살스테이크', '차돌 불고기', '새우 콩나물찜', '고등어김치찜', '감바스 알 아히요', '베이컨 크림 파스타', '로제 파스타', '해물오일파스타', '양지수육', '항정삼합', '간편갈비조림', '닭볶음탕', '초간단 순살 갈비찜', '꼬치 없는 꼬치전', '새우관자전'] },
  { id: 'speed', name: '초스피드', img: speed, 편: ['간장버터 달걀밥', '마늘간장계란밥', '10분 쌀수제비', '파기름 간장국수', '비빔김국수', '오이탕탕이', '원팬 또띠아 토스트', '출근 전 10분 계란샐러드', '참치마요 김가루 주먹밥', '비빔국수', '물비빔국수', '토마토달걀볶음', '초간단 육전', '상추겉절이', '오이크래미냉채'] },
  { id: 'donburi', name: '덮밥', img: donburi, 편: ['참치마요 덮밥', '닭구이덮밥', '명란 아보카도 덮밥', '매콤 콩나물덮밥', '오징어 애호박 덮밥', '가지덮밥', '대패삼겹 달래덮밥', '소고기 규동', '데리야끼장어덮밥', '가지 소고기 덮밥', '대파 소스 목살 덮밥', '달래 대패삼겹 덮밥', '비프페퍼라이스'] },
  { id: 'gimbap', name: '김밥', img: gimbap, 편: ['엄마표 김밥', '충무김밥 오징어무침'] },
  { id: 'riceball', name: '주먹밥·유부초밥', img: riceball, 편: ['치즈 유부주먹밥', '층층이 유부 사각주먹밥', '유부주먹 비빔밥', '참치마요 김가루 주먹밥'] },
  { id: 'dosirak', name: '도시락', img: dosirak, 편: ['엄마표 김밥', '무스비맛브리또', '치즈 유부주먹밥', '층층이 유부 사각주먹밥', '참치마요 김가루 주먹밥', '닭가슴살 피자 브리또', '비프페퍼브리또', '장조림', '계란후라이조림', '유부주먹 비빔밥', '수제 떡갈비', '어묵볶음', '진미채볶음', '소고기메추리알조림'] },
  { id: 'mealprep', name: '밀프렙', img: mealprep, 편: ['닭가슴살 피자 브리또', '비프페퍼브리또', '무스비맛브리또', '장조림', '만능양념간장', '수제 떡갈비'] },
  { id: 'tteokbokki', name: '떡볶이', img: tteokbokki, 편: ['국물 떡볶이', '오리지날 떡볶이'] },
  { id: 'sandwich', name: '샌드위치', img: sandwich, 편: ['치즈 샌드위치', '감자타코', '비프페퍼브리또', '무스비맛브리또', '원팬 또띠아 토스트', '치킨 레터스랩', '닭가슴살 피자 브리또'] },
  { id: 'soup', name: '수프', img: soup, 편: ['통단호박 크림스프'] },
  { id: 'juk', name: '죽', img: juk, 편: ['전복죽'] },
  { id: 'world', name: '나라 요리', img: world, 편: ['팟타이', '나시고랭', '팟카카오무쌉', '마파두부', '한국식 마파두부', '감바스 알 아히요', '니쿠자가', '스키야키', '지도리우동', '야끼우동', '소고기 규동', '차돌짬뽕', '공심채 볶음', '토마토달걀볶음', '가지 라자냐', '로제 파스타', '베이컨 크림 파스타', '연어 포케볼', '야채 포케볼', '감자타코', '시오콘부 치킨', '해물누룽지탕', '한판 탕수육', '간장 야키니쿠', '데리야끼장어덮밥', '새우 크림 파스타'] },
  { id: 'xmas', name: '크리스마스', img: xmas, 편: ['어묵탕', '스키야키', '해물오일파스타', '원팬 크림 파스타', '뚝배기 파스타', '감바스 알 아히요'] },
]

// 🍚 한식 집밥 — 낱말로 찾는다(제목·태그에 그 말이 있으면) · 창업자 2026-11-21 「C에 한식도(반찬·국·찌개·조림)」
//   ⛔ 「전」은 「전복」·「전골」도 걸린다 → 낱말 끝이 「전」이거나 태그가 「전」인 것만
export const 한식낱말 = ['국', '찌개', '탕', '조림', '찜', '볶음', '나물', '무침', '전', '김치']
// 🖼 한식 그림 — 창업자 2026-11-21 「한식류 반찬·국·찌개 이런 건 그림으로 안 만들어?」(탕 = 감자탕 · 국과 안 헷갈리게)
const 한식그림파일 = import.meta.glob('../assets/theme/hs_*.webp', { eager: true, query: '?url', import: 'default' })
const 한식영문 = { 국: 'guk', 찌개: 'jjigae', 탕: 'tang', 조림: 'jorim', 찜: 'jjim', 볶음: 'bokkeum', 나물: 'namul', 무침: 'muchim', 전: 'jeon', 김치: 'kimchi' }
export const 한식그림 = (말) => 한식그림파일[`../assets/theme/hs_${한식영문[말]}.webp`]

export function 한식에드나(r, 말) {
  const 제목 = r.title || ''
  const 태그 = r.tags || []
  if (태그.includes(말)) return true
  if (말 === '전') return /전$/.test(제목) || /전\s/.test(제목)
  if (말 === '국') return /국$/.test(제목) || /국\s|국밥/.test(제목)
  return 제목.includes(말)
}

// 레시피가 이 테마에 드나 — ① 레시피의 theme 칸 ② 목록의 제목
export function 테마에드나(r, t) {
  if (Array.isArray(r.theme) && r.theme.includes(t.name)) return true
  // ⏱ [창업자 2026-11-22 「조리가 10분이내 걸리는건 초간단메뉴로」] 조리 10분 이하는 초스피드에 저절로
  if (t.id === 'speed' && Number(r.time) > 0 && Number(r.time) <= 10) return true
  return t.편.includes(r.title)
}

// 🔑 열쇠 — 아이폰과 «같은 날» 연다(절대원칙 2026-09-18) · `?테마=1` 이 기기에서 켬 · `?테마=0` 끔
export function 테마열쇠() {
  try {
    const v = new URLSearchParams(location.search).get('테마')
    if (v === '1') localStorage.setItem('hankki:테마', '1')
    if (v === '0') localStorage.removeItem('hankki:테마')
    // 📅 [창업자 2026-11-22] 11/30 부터는 모두에게 열린다 — 아이폰 판(오늘 굽기)과 같은 날(절대원칙 2026-09-18)
    if (todayKST() >= '2026-11-30') return true
    return localStorage.getItem('hankki:테마') === '1'
  } catch { return false }
}
