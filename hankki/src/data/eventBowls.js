// 🎄 이벤트 그릇 — 레시피 표지를 «시즌 그릇에 담긴 그림»으로 바꿔 보는 것 (창업자 2026-11-26)
//   📮 「그릇바꾸기 좋은 것 같아. 고를수있는 레시피에만」 · 「크리스마스 끝나도 계속 둬」
//   📮 「앞으로도 계속 이런 이벤트 그릇할텐데 용량 고려해봐야해 유지가능한지」 → 「2번으로 ㄱㄱ」(인터넷에서 받기)
//
// ⭐⭐ 그림은 «앱 안에 넣지 않는다» — public/ev/<이벤트>/<레시피id>.webp 로 웹에만 올리고 보일 때 받는다.
//   · 이벤트 한 번 ≈ 44장 · 2.7MB(실측) · 1년 5번이면 13MB — 앱 그림 폴더에 넣으면 아이폰 앱이 해마다 그만큼 커진다
//   · 아이폰 빌드는 ev/ 를 빼고 굽는다(.github/workflows 의 cap sync 앞) → 아이폰은 아래 «절대 주소»로 받는다
//   · 못 받으면(인터넷 끊김) 흰 그릇 아이콘으로 저절로 돌아간다(Thumb.jsx) — 표지가 깨지지 않는다
//   · 웹·안드로이드는 처음 켤 때 미리 받지 않는다(precache 잣대 밖) → 보는 한 장만 받는다
//
// 🔑 열쇠 = ?크리스마스그릇=1 — 아이폰과 같은 날 연다(절대원칙 2026-09-18 · 유저에게 보이는 시점 맞추기)
import { 열쇠있나 } from '../components/Stickers'

const 웹주소 = 'https://peachfam0307-glitch.github.io/hankki/'
const 앱안인가 = () => { try { return !!window.Capacitor?.isNativePlatform?.() } catch { return false } }

export const 이벤트그릇 = {
  xmas: {
    이름: '크리스마스 그릇',
    열쇠: '크리스마스그릇',
    레시피: {
      'basic-gamja-cheese-omelet': 1, // 감자 치즈 오믈렛
      'basic-goguma-sun-bokkeum': 1, // 고구마순볶음
      'basic-manneung-yangnyeom-ganjang': 1, // 만능양념간장
      'basic-oi-crami-naengchae': 1, // 오이크래미냉채
      'basic-onepan-tortilla-toast': 1, // 원팬 또띠아 토스트
      'basic-chamchi-yangbaechu-omelet': 1, // 참치 양배추 오믈렛
      'basic-gyeran-salad-10min': 1, // 출근 전 10분 계란샐러드
      'basic-kodari-jorim': 1, // 코다리조림
      'basic-yubu-jumeok-bibimbap': 1, // 유부주먹 비빔밥
      'basic-chamchimayo-gimgaru-jumeokbap': 1, // 참치마요 김가루 주먹밥
      'basic-yubu-sagak-jumeokbap': 1, // 층층이 유부 사각주먹밥
      'basic-cheese-yubu-jumeokbap': 1, // 치즈 유부주먹밥
      'basic-ttukbaegi-pasta': 1, // 뚝배기 파스타
      'basic-onepan-cream-pasta': 1, // 원팬 크림 파스타
      'basic-haemul-oil-pasta': 1, // 해물오일파스타
      'basic-bibim-gim-guksu': 1, // 비빔김국수
      'basic-samchi-ganjang-jorim': 1, // 삼치 간장조림
      'basic-sogogi-mechurial-jorim': 1, // 소고기메추리알조림
      'basic-chadol-yukgaejang': 1, // 초간단 육개장
      'basic-gul-baechu-guk': 1, // 굴 배춧국
      'basic-gul-sotbap': 1, // 굴솥밥
      'basic-gul-jeon': 1, // 굴전
      'basic-gul-muchim-jhy': 1, // 정호영 셰프 굴무침
      'basic-hanguksik-mapa-dubu': 1, // 한국식 마파두부
      'basic-honghap-miyeokguk': 1, // 10분 홍합 미역국
      'basic-kkomak-muchim': 1, // 꼬막무침
      'basic-honghap-jeon': 1, // 부추 홍합전
      'basic-honghap-tang': 1, // 포장마차 홍합탕
      'basic-albaechu-geotjeori': 1, // 알배추 겉절이
      'basic-mu-namul': 1, // 양파 무나물
      'basic-musaengchae-jhy': 1, // 정호영 셰프 무생채
      'basic-chadol-eolgali-doenjangguk': 1, // 차돌 얼갈이 된장국
      'basic-dwaeji-kimchi-duruchigi': 1, // 돼지고기김치두루치기
      'basic-godeungeo-mugeunji-jorim': 1, // 고등어 묵은지조림
      'basic-spam-ttaengcho-gimbap': 1, // 스팸 땡초 김밥
      'basic-paik-sijang-tteokbokki': 1, // 백종원 시장 떡볶이
      'basic-yangsongi-gamja-soup': 1, // 양송이감자스프
      'basic-dak-juk': 1, // 영양 닭죽
      'basic-bibim-galbijjim': 1, // 간편갈비조림
      'basic-yeongeun-salad': 1, // 연근사과샐러드
      'basic-daepae-kimchi-sotbap': 1, // 대패삼겹살 김치 솥밥
      'basic-dakgomtang': 1, // 닭곰탕
      'basic-eomuk-tang': 1, // 어묵탕
      'basic-sukiyaki': 1, // 스키야키
    },
  },
}

// 이 레시피에 고를 수 있는 이벤트 그릇(열쇠가 열린 것만) — 없으면 []
export const 고를그릇 = (id) => Object.entries(이벤트그릇)
  .filter(([, e]) => e.레시피[id] && 열쇠있나(e.열쇠))
  .map(([키, e]) => ({ 키, 이름: e.이름 }))

// 그림 주소 — 표에 없으면 null(그러면 원래 아이콘)
export const 이벤트그릇주소 = (키, id) => {
  const e = 이벤트그릇[키]
  if (!e || !e.레시피[id]) return null
  return (앱안인가() ? 웹주소 : './') + `ev/${키}/${id}.webp`
}
