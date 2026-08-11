import { pickRotate } from './weeklypick.js'

// 주부의 장바구니 — 18년차 주부가 엄선한 건강 식재료 큐레이션.
// name + benefit(왜 좋은지 + 실제 쓰는 팁, 담백한 친구 추천 톤). '사러가기' 연결 규칙:
//   url 이 있으면 그 직접 링크로, mall 이 있으면 그 쇼핑몰 검색으로, 없으면 네이버쇼핑 통합검색.
//   mall: 'coupang' | 'oasis' (검색 지원). 한살림은 로그인 검색 URL이 없어 앱 열기 링크(HANSALIM_APP)를 url 로 사용.
//   tag: 카드에 붙는 작은 태그(예: '진간장'/'맛간장'). 없으면 표시 안 함.
// 나중에 url/mall 을 제휴(어필리에이트) 링크로 바꾸면 그대로 수수료 링크가 됨.
// 문구 원본·톤 원칙: docs/주부의장바구니-큐레이션.md

// 한살림은 로그인 때문에 웹 검색 URL이 없어, 로그인이 유지되는 '한살림 앱'을 바로 연다(안드로이드).
// 주소 기반 intent(intent://host…)는 앱이 딥링크를 등록해야 작동해서 웹 홈으로 폴백됐다.
// → 패키지로 앱 런처를 직접 실행하는 형식(intent:#Intent;package=…)으로 변경.
const HANSALIM_APP = 'intent:#Intent;package=kr.or.hansalim.shop;S.browser_fallback_url=https%3A%2F%2Fshop.hansalim.or.kr%2Fshopping%2FspMain.do;end'

// 큐레이션 카테고리/상품 아이콘 — 얼굴 없는 제품 일러스트(수채톤·창업자 생성).
// 이모지 대신 ShopScreen에서 렌더. key = assets/curation/<key>.png. 없으면 이모지로 폴백.
const CUR_ICONS = import.meta.glob('../assets/curation/*.png', { eager: true, query: '?url', import: 'default' })
export const curIcon = (key) => (key ? CUR_ICONS[`../assets/curation/${key}.png`] || null : null)

export const CURATION = [
  {
    cat: '간장', group: '양념', emoji: '🫗', icon: 'cu_soy',
    items: [
      { name: '성가정 우리콩 진간장', matches: ['진간장'], tag: '진간장', benefit: '국산 우리콩으로 담가 뒷맛이 깔끔해요. 색과 맛이 진해 조림·볶음·불고기처럼 오래 끓이거나 색 내는 요리에 두루 좋아요', q: '성가정 우리콩 진간장', mall: 'coupang' },
      { name: '쌀누룩 맛간장', matches: ['맛간장'], tag: '맛간장', benefit: '100% 국산콩에 무방부제·무첨가물, 원당과 과일로 건강한 단맛과 감칠맛을 냈어요. 무침·비빔·계란간장밥처럼 바로 먹는 요리에 딱. 통째로 구비해두는 저의 주문템이에요', q: '쌀누룩 맛간장', url: 'https://smartstore.naver.com/thebat/products/5788851801' },
      { name: '홍영의 붉은대게 백간장', matches: ['백간장'], tag: '백간장', benefit: '붉은대게즙으로 만들어 깔끔하고 깊은 감칠맛이 나요. 국간장보다 색이 옅어 국물색을 해치지 않으면서 간을 맞춰줘서, 맑은국·나물무침·계란찜, 김치찌개 간 맞출 때 살짝 둘러요', q: '홍영의 붉은대게 백간장', mall: 'coupang' },
    ],
  },
  {
    cat: '된장', group: '양념', emoji: '🥣', icon: 'cu_doenjang',
    items: [
      { name: '죽장연 전통된장', benefit: '국산콩과 천일염만으로 담가 깊고 진한 맛이 나요. 맛이 조금 진한 편이에요', q: '죽장연 전통된장', mall: 'coupang' },
      { name: '맥된장', benefit: '국산콩 메주 96%, 천일염 4%로만 만들어 성분이 좋아요. 가격도 합리적이라 손이 자주 가요. 특히 백합된장과 궁합이 좋아 섞어 쓰면 더 맛있어요', q: '맥된장', mall: 'coupang', url: 'https://www.coupang.com/vp/products/160227399?itemId=15032545519&vendorItemId=82255154528' },
      { name: '백합된장', benefit: '수녀님들이 메주·물·소금만으로 정성껏 만들었어요. 찌개도 좋지만 국을 끓이면 구수한 맛이 확 살아나요. 맥된장과 섞어 쓰면 궁합이 좋아요', q: '백합된장', url: 'http://www.spcfood.co.kr/product/product_view.php?ProductSeqNo=8' },
      { name: '미소된장', matches: [], q: '미소된장', tag: '미소된장', mall: 'naver', neu: true },
    ],
  },
  {
    // 🌯 2026-08-11 창업자 자료. `cu_burrito` 는 이미 있었는데 아무 갈래도 안 쓰고 있었다.
    cat: '또띠아', group: '면·밥', emoji: '🌯', icon: 'cu_burrito',
    items: [
      { name: '자연드림 담백한우리밀또띠아', matches: ['또띠아', '또띠야', '토르티야'], tag: '또띠아', benefit: '우리밀이라 담백하고 부드러워요. 남은 반찬 올려 랩으로 싸먹거나 피자도우로도 써요.', q: '자연드림 담백한 우리밀 또띠아', neu: true },
    ],
  },
  {
    cat: '낫또', group: '두부·콩', emoji: '🫘', icon: 'cu_tofu',
    items: [
      { name: '자연드림 낫또', matches: ['낫또', '낫토'], tag: '낫또', benefit: '낫또를 썩 좋아하진 않는데 몸에 좋다고 해서 브랜드별로 거의 먹어봤어요. 그중에 자연드림 낫또가 제 입맛에는 제일 괜찮았어요. 저같은 낫또 초심자추천.', q: '자연드림 낫또', neu: true },
    ],
  },
  {
    cat: '밥친구', group: '면·밥', emoji: '🍚', icon: 'cu_maesaengi',
    items: [
      { name: '자연드림 밥꾸러기 해물', matches: [], tag: '밥친구', benefit: '아침밥 해줄거 없을 때 계란 스크램블해서 요거 뿌려 참기름 통깨 주먹밥 만들어 해결했었어요. 구비해두면 좋을 추천템', q: '자연드림 밥꾸러기 해물', neu: true },
    ],
  },
  {
    cat: '반찬', group: '반찬', emoji: '🥬', icon: 'cu_gochujang',
    items: [
      { name: '자연드림 꼬들단무지', matches: ['단무지'], tag: '단무지', benefit: '저희가족은 꼬들 쫀득한 식감을 좋아하는데 이 단무지 식감이 꼬들꼬들해서 좋아해요. 고춧가루 살짝 참기름 통깨만 넣으면 간단한 반찬으로 좋아요.', q: '자연드림 꼬들단무지', neu: true },
      { name: '한살림 황태채무침', matches: [], tag: '반찬', benefit: '제가 좋아하는데 혼자 먹자고 집에서 하기 좀 그래서 가끔 구입해서 먹는 아이템. 간간하지만 양념이 맛있어서 좋아해요', q: '한살림 황태채무침', url: HANSALIM_APP, neu: true },
      { name: '한살림 옥수수병조림', matches: ['옥수수'], tag: '병조림', benefit: 'GMO는 가급적이면 피하고 싶어서 찾은 정착템. 그냥 먹어도 맛있어요. 페퍼런치할 때나 볶아서 밥에 뿌려도 주고, 콘치즈로도 먹고 추천해요.', q: '한살림 옥수수병조림', url: HANSALIM_APP, neu: true },
    ],
  },
  {
    cat: '간편식', group: '간편식·간식', emoji: '🍲', icon: 'cu_curry',
    items: [
      { name: '한살림 곤드레나물밥', matches: [], tag: '즉석밥', benefit: '곤드레나물부터 양념까지 다 국산재료라 건강한 한끼 먹고 싶을 때 구입해요.', q: '한살림 곤드레나물밥', url: HANSALIM_APP, neu: true },
      { name: '한살림 섬진강재첩국', matches: ['재첩'], tag: '재첩국', benefit: '재첩은 쉽게 구하기 어려우니까 시원한 국물이 먹고싶을 때 구비해놓고 먹어요 냉동이라 보관도편하고 아이도 잘 먹어서 좋아요', q: '한살림 섬진강 재첩국', url: HANSALIM_APP, neu: true },
      { name: '한살림 물만두', matches: ['물만두'], tag: '만두', benefit: '떡국에도 넣고 만둣국 끓일 때도 좋고, 물만두로 간단히 조리해 먹기도 좋아요. 첨가물거의 없고 전재료 국산이라 자극적인 맛은 아니지만 냉동실에 꾸준히 있는 아이템.', q: '한살림 물만두', url: HANSALIM_APP, neu: true },
      { name: '자연드림 꼬꼬너겟', matches: [], tag: '냉동', benefit: '아이가 좋아해서 사두는 템. 에어프라이어에 돌리면 바삭하고, 반찬 없을 때 한 접시 나와요.', q: '자연드림 꼬꼬너겟', neu: true },
    ],
  },
  {
    cat: '떡', group: '면·밥', emoji: '🍡', icon: 'cu_nurungji',
    items: [
      { name: '칠갑농산 우리쌀 떡국떡', matches: [], q: '칠갑농산 우리쌀 떡국떡', mall: 'kurly', neu: true },
      { name: '창억떡', matches: [], q: '창억떡', mall: 'kurly', neu: true },
      { name: '더바른 삼색꿀떡 (냉동)', matches: [], q: '더바른 삼색꿀떡', mall: 'coupang', neu: true },
      { name: '홍블랑푸드 밤·옥수수설기 · 증편', matches: [], q: '홍블랑푸드 밤 옥수수설기 증편', neu: true },
    ],
  },
  {
    cat: '즉석밥', group: '면·밥', emoji: '🍚', icon: 'cu_nurungji',
    items: [
      { name: '치밀 유기농 골드퀸 현미밥 간편 건강 즉석밥', matches: [], q: '치밀 유기농 골드퀸 현미밥 즉석밥', mall: 'coupang', neu: true },
      { name: '빅마마 이혜정의 꽉찬 수제 영양밥 · 전복 바다 영양밥', matches: [], q: '빅마마 이혜정의 꽉찬 수제 영양밥', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '빵', group: '베이커리', emoji: '🍞', icon: 'cu_pizza',
    items: [
      { name: '아우어베이커리 오리지널 치아바타', matches: [], q: '아우어베이커리 오리지널 치아바타', mall: 'kurly', neu: true },
      { name: '아르토스베이커리 통밀식빵', matches: [], q: '아르토스베이커리 통밀식빵', mall: 'kurly', neu: true },
      { name: '타르틴베이커리 슬랩 · 올리브푸가스', matches: [], q: '타르틴베이커리 슬랩', mall: 'kurly', neu: true },
      { name: '리치몬드 밤밤식빵', matches: [], q: '리치몬드 밤밤식빵', mall: 'kurly', neu: true },
      { name: '바비브레드 까만쫀득크런치', matches: [], q: '바비브레드 까만쫀득크런치', mall: 'kurly', neu: true },
      { name: '포비베이글 호두크림치즈', matches: [], q: '포비베이글 호두크림치즈', tag: '베이글', mall: 'coupang', neu: true },
      { name: '연세우유 생크림 우유롤', matches: [], q: '연세우유 생크림 우유롤', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '디저트', group: '베이커리', emoji: '🍰', icon: 'cu_pizza',
    items: [
      { name: '페이브 레드블랜드', matches: [], q: '페이브 레드블랜드', mall: 'kurly', neu: true },
      { name: '나폴레옹 쇼콜라비스큐슈니탱', matches: [], q: '나폴레옹 쇼콜라비스큐슈니탱', mall: 'kurly', neu: true },
    ],
  },
  {
    // ⭐ 「데본 클로티드크림」은 빵에 발라 먹는 것 → 잼과 같은 칸
    cat: '잼·스프레드', group: '양념', emoji: '🍯', icon: 'cu_sauce',
    items: [
      { name: '데본 클로티드크림', matches: [], q: '데본 클로티드크림', mall: 'kurly', neu: true },
      { name: '딸기 간편 파우치 무설탕 저당 저칼로리 알룰로스 딸기잼', matches: [], q: '딸기 알룰로스 딸기잼', tag: '딸기잼', mall: 'coupang', neu: true },
      { name: '포비 무화과 스프레드', matches: [], q: '포비 무화과 스프레드', tag: '무화과잼', mall: 'coupang', neu: true },
      { name: '마야항아리 기버터', matches: [], q: '마야항아리 기버터', tag: '기버터', neu: true },
    ],
  },
  {
    cat: '시즈닝', group: '양념', emoji: '🧂', icon: 'cu_gochugaru',
    items: [
      { name: '밍글 바비큐시즈닝', matches: [], q: '밍글 바비큐시즈닝', tag: '시즈닝', mall: 'kurly', neu: true },
    ],
  },
  {
    cat: '유제품', group: '유제품·간식', emoji: '🧀', icon: 'cu_soymilk',
    items: [
      { name: '알라 하바티치즈', matches: [], q: '알라 하바티치즈', tag: '치즈', mall: 'kurly', neu: true },
      { name: '연세우유 소화가잘되는 우유', matches: [], q: '연세우유 소화가잘되는 우유', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '요거트', group: '유제품·간식', emoji: '🥛', icon: 'cu_soymilk',
    items: [
      { name: '강훈목장 수제요거트 딸기', matches: [], q: '강훈목장 수제요거트 딸기', mall: 'coupang', neu: true },
      { name: '또요 또먹는 플레인 요거트', matches: [], q: '또요 또먹는 플레인 요거트', mall: 'coupang', neu: true },
      { name: '임실치즈마을 요거트 더 달콤 스트로베리', matches: [], q: '임실치즈마을 요거트 스트로베리', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '커피·차', group: '유제품·간식', emoji: '☕', icon: 'cu_soymilk',
    items: [
      { name: '매일 마이카페라떼 마일드', matches: [], q: '매일 마이카페라떼 마일드', mall: 'coupang', neu: true },
      { name: '콜롬비아 디카페인 싱글 원두커피', matches: [], q: '콜롬비아 디카페인 싱글 원두커피', mall: 'coupang', neu: true },
      { name: '평창다원 유기농 타타리메밀차', matches: [], q: '평창다원 유기농 타타리메밀차', tag: '메밀차', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '즉석식품', group: '간편식·간식', emoji: '🍱', icon: 'cu_curry',
    items: [
      { name: '빠르게한끼 오리엔탈연두부', matches: [], q: '빠르게한끼 오리엔탈연두부', mall: 'kurly', neu: true },
      { name: '차돌듬뿍묵은지볶음밥', matches: [], q: '차돌듬뿍묵은지볶음밥', mall: 'kurly', neu: true },
      { name: 'cj주부 초밥왕', matches: [], q: 'cj주부 초밥왕', mall: 'kurly', neu: true },
      { name: '비비고 남도떡갈비', matches: [], q: '비비고 남도떡갈비', mall: 'coupang', neu: true },
      { name: '심플잇 김치볶음밥 포켓누룽지', matches: [], q: '심플잇 김치볶음밥 포켓누룽지', mall: 'coupang', neu: true },
      { name: '누들핏 어묵탕맛', matches: [], q: '누들핏 어묵탕맛', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '국·탕', group: '간편식·간식', emoji: '🍲', icon: 'cu_stock_seafood',
    items: [
      { name: '신선설농탕 고기설렁탕', matches: [], q: '신선설농탕 고기설렁탕', tag: '설렁탕', mall: 'kurly', neu: true },
      { name: '더오담 김치콩비지찌개', matches: [], q: '더오담 김치콩비지찌개', mall: 'coupang', neu: true },
      { name: '오모가리 수제 김치찌개', matches: [], q: '오모가리 수제 김치찌개', mall: 'coupang', neu: true },
      { name: '설성목장 한우 사골 곰탕 스틱', matches: [], q: '설성목장 한우 사골 곰탕 스틱', tag: '곰탕', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '만두', group: '간편식·간식', emoji: '🥟', icon: 'cu_curry',
    items: [
      { name: '굽네 닭가슴살 만두', matches: [], q: '굽네 닭가슴살 만두', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '전·부침', group: '간편식·간식', emoji: '🥞', icon: 'cu_gochujang',
    items: [
      { name: '부침명장 해물파전 · 김치전', matches: [], q: '부침명장 해물파전', mall: 'kurly', neu: true },
    ],
  },
  {
    cat: '피자·냉동간편식', group: '간편식·간식', emoji: '🍕', icon: 'cu_pizza',
    items: [
      { name: '톰볼라 버섯피자', matches: [], q: '톰볼라 버섯피자', mall: 'kurly', neu: true },
      { name: '우리별피자 작은사이즈 · 고르곤졸라·불고기', matches: [], q: '우리별피자 작은사이즈', neu: true },
    ],
  },
  {
    cat: '조미김·해조', group: '간편식·간식', emoji: '🌿', icon: 'cu_maesaengi',
    items: [
      { name: '포프리 100% 엑스트라버진으로 구운 올리브 김', matches: [], q: '포프리 엑스트라버진 올리브 김', tag: '조미김', mall: 'coupang', neu: true },
      { name: '바다숲뿌려먹는 감태랑 해물이랑', matches: [], q: '바다숲 뿌려먹는 감태랑 해물이랑', tag: '후리카케', mall: 'kurly', neu: true },
    ],
  },
  {
    cat: '김치', group: '반찬', emoji: '🥬', icon: 'cu_gochujang',
    items: [
      { name: '풀무원 들기름 볶음김치', matches: [], q: '풀무원 들기름 볶음김치', mall: 'coupang', neu: true },
      { name: '종가 석박지', matches: [], q: '종가 석박지', mall: 'coupang', neu: true },
      { name: '대복 포기김치 5kg', matches: [], q: '대복 포기김치', mall: 'coupang', neu: true },
      { name: '맘쏙김치 (100%국산) 경상도 국밥집 겉절이', matches: [], q: '맘쏙김치 경상도 국밥집 겉절이', tag: '겉절이', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '채소', group: '채소·과일', emoji: '🥦', icon: 'cu_oliveoil',
    items: [
      { name: '국내산 베이비 브로콜리', matches: [], q: '국내산 베이비 브로콜리', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '버섯', group: '채소·과일', emoji: '🍄', icon: 'cu_maesaengi',
    items: [
      { name: '국내산 무농약인증 생목이버섯 · 건목이버섯 · 건백목이버섯', matches: [], q: '국내산 무농약 목이버섯', tag: '목이버섯', mall: 'coupang', neu: true },
      { name: '하진이네버섯뜰에 건조 흰목이버섯', matches: [], q: '하진이네버섯뜰에 건조 흰목이버섯', tag: '흰목이버섯', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '샐러드', group: '채소·과일', emoji: '🥗', icon: 'cu_oliveoil',
    items: [
      { name: '샐러딩 야키토리 샐러드', matches: [], q: '샐러딩 야키토리 샐러드', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '참치', group: '정육·수산', emoji: '🐟', icon: 'cu_eomuk',
    items: [
      { name: '리오마레 일반 · 올리브 · 샐러드', matches: [], q: '리오마레 참치', neu: true },
      { name: '퍼시피카나튜나(워터참치)', matches: [], q: '퍼시피카나튜나 워터참치', neu: true },
      { name: '동원 참치인 워터', matches: [], q: '동원 참치인 워터', neu: true },
    ],
  },
  {
    cat: '수산물', group: '정육·수산', emoji: '🐙', icon: 'cu_eomuk',
    items: [
      { name: '하남쭈꾸미', matches: [], q: '하남쭈꾸미', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '소고기', group: '정육·수산', emoji: '🥩', icon: 'cu_pork',
    items: [
      { name: '설성목장 무항생제 한우 1등급 이상 목심 샤브샤브용 (냉동)', matches: [], q: '설성목장 무항생제 한우 목심 샤브샤브용', tag: '샤브샤브', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '닭가슴살', group: '정육·수산', emoji: '🍗', icon: 'cu_pork',
    items: [
      { name: '청정원 그레인보우 닭가슴살', matches: [], q: '청정원 그레인보우 닭가슴살', mall: 'kurly', neu: true },
    ],
  },
  {
    cat: '달걀', group: '정육·수산', emoji: '🥚', icon: 'cu_pork',
    items: [
      { name: '요리란 난백', matches: [], q: '요리란 난백', tag: '난백', mall: 'kurly', neu: true },
      { name: '자연애찬 반숙이, 6구', matches: [], q: '자연애찬 반숙이', tag: '반숙란', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '맛술', group: '양념', emoji: '🍶', icon: 'cu_matsul',
    items: [
      { name: '요리맛샘 맛술', matches: ['맛술'], benefit: '성분이 깔끔한 맛술이에요. 살짝 산미가 있지만 잡내를 잡고 감칠맛을 더하는 데 어느 요리에나 잘 맞아요', q: '요리맛샘 맛술', mall: 'coupang' },
    ],
  },
  {
    cat: '굴소스', group: '양념', emoji: '🦪', icon: 'cu_gulsauce',
    items: [
      { name: '요리맛샘 굴소스', matches: ['굴소스'], benefit: '첨가물 없이 국산 재료로 만들었어요. 감칠맛이 깔끔하고 짜지 않아 아이들 볶음요리에도 좋아요. 저는 떨어지면 바로 다시 주문해요', q: '요리맛샘 굴소스', mall: 'coupang' },
    ],
  },
  {
    cat: '액젓', group: '양념', emoji: '🐟', icon: 'cu_aekjeot',
    items: [
      { name: '와촌식품 초피액젓', benefit: '국물요리 간은 거의 이걸로 해요. 수도 없이 사서 쓰는 템이에요. 감칠맛이 좋아 국·찌개·나물무침 어디에나 잘 맞아요', q: '와촌식품 초피액젓', url: 'https://wachonfood.co.kr/' },
      { name: '자연드림 참새우젓', matches: ['새우젓'], tag: '새우젓', benefit: '새우젓을 쓸일이 많이 없는데 가끔 필요할 때 있잖아요. 작은용량이라 냉동실 넣어두고, 필요할 때 요긴하게 사용하고 있어요.', q: '자연드림 참새우젓', neu: true },
      { name: '한살림 양념낙지젓', matches: ['낙지젓'], tag: '낙지젓', benefit: '낙지젓은 사실 호불호가 있는데 이건 비리지 않고 양념이 맛있어서 밥반찬으로 자주 사요.', q: '한살림 양념낙지젓', url: HANSALIM_APP, neu: true },
    ],
  },
  {
    cat: '소금', group: '양념', emoji: '🧂', icon: 'cu_salt',
    items: [
      { name: '모에솔트 대파소금', matches: ['대파소금'], benefit: '대파소금이 유행이라지만 직접 갈아 섞는 건 엄두가 안 났는데 딱 나와줬어요. 국내산 대파 50%에 염도 낮은 소금만으로 만들어 열자마자 대파향이 솔솔. 고기구이·계란후라이·국에 살짝 감칠맛 낼 때 좋아요', q: '모에솔트 대파소금', mall: 'coupang' },
    ],
  },
  {
    cat: '설탕', group: '양념', emoji: '🍬', icon: 'cu_sugar',
    items: [
      { name: '아우노슈가', benefit: '성분 좋은 설탕이에요. 많이 달지 않아서 일반 설탕보다 조금 넉넉히 넣어도 부담 없어요. 저는 요리에 두루 이걸 써요', q: '아우노슈가', mall: 'coupang' },
      { name: '자연드림 우리밀 올리고당', matches: ['올리고당'], tag: '올리고당', benefit: '자연드림 올리고당은 어느요리나 무난하게 잘 어울려요. 꽤 오래사용했던 템.', q: '자연드림 우리밀 올리고당', neu: true },
      { name: '아우노슈가 올리고당', matches: [], q: '아우노슈가 올리고당', tag: '올리고당', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '스톡·육수', group: '기름·육수', emoji: '🍲', icon: 'cu_stock_seafood',
    items: [
      { name: '위드잇 쯔유스톡', matches: ['쯔유'], icon: 'cu_stock_tsuyu', benefit: '성분 좋은 육수 베이스예요. 한 포씩 개별포장이라 필요한 만큼만 쓰기 편하고 유통기한도 넉넉해 구비해두기 좋아요', q: '위드잇 쯔유스톡', mall: 'coupang' },
      { name: '위드잇 치킨스톡', matches: ['치킨스톡'], icon: 'cu_stock_chicken', benefit: '한 포씩 톡 넣으면 국물요리가 간편해져요. 성분 좋고 유통기한도 넉넉해 구비해두기 좋아요', q: '위드잇 치킨스톡', mall: 'coupang' },
      // ⭐⭐ `matches` 가 «없어서» 재료에 「해물가루육수 1봉」 이라고만 쓴 레시피엔 안 붙고 있었다.
      //    📮 창업자 2026-08-10 밤: *"그럼 우리 레시피에 해물가루육수 광고도 넣어야 하는데 있어?"* ·
      //       *"쿠팡을 1순위로 광고에 넣어야 수익이 생기니까"*
      //    🔢 실측 — 「가루육수」가 든 레시피 4편 중 **3편만** 붙고 있었다.
      //       붙던 셋은 «메모에 풀네임을 손으로 박아둔» 것이고, 소고기 미역국은 아무것도 안 붙었다.
      //    ⛔ 그대로 두면 「전부 해물가루육수로」 지시대로 38편을 넣을 때 **손으로 38번 풀네임을 박아야** 한다(규칙 8 위반).
      //    ⚠️ 「가루육수」·「해물가루육수」 **둘 다** 넣는다 — `matches` 는 «낱말 시작»으로만 맞아서
      //       「해물가루육수」는 「가루육수」로 시작하지 않는다(노두유↔두유 사고 이후의 규칙).
      { name: '올바른가 요리의정수 해물맛', matches: ['해물가루육수', '가루육수'], icon: 'cu_stock_seafood', tag: '가루육수', benefit: '고체(큐브)형 육수는 모양·질감을 잡으려고 변성 성분을 넣어요. 굳이 안 먹어도 되는 첨가물이죠. 이건 가루라 성분이 깨끗하고 육수가 깔끔해요. 꽃게·새우·멸치·다시마로 낸 해물맛이라 김치찌개·국·전골에 한두 봉이면 감칠맛이 딱', q: '올바른가 요리의정수 분말육수 해물맛', mall: 'coupang' },
      { name: '해통령 육수명장 분말', matches: ['해물가루육수', '가루육수'], icon: 'cu_stock_seafood', tag: '가루육수', benefit: '올바른가보다 진한 가루육수예요. 올바른가엔 꽃게가, 이건 황태가 들어 국물맛이 깔끔해요. 맛이 달라서 저는 두 가지 구비해두고 국·탕에 두루 써요. 성분도 깔끔한 편이에요', q: '해통령 육수명장 분말', mall: 'coupang' },
    ],
  },
  {
    cat: '소스', group: '양념', emoji: '🍯', icon: 'cu_sauce',
    items: [
      { name: '이로운 데리야끼소스', matches: ['데리야끼'], benefit: '첨가물 없이 점도가 좋아 요리에 착 감겨요. 맛이 깔끔해서 덮밥·조림에 두루 좋아요. (유리병이 불편하면 소스용기에 덜어 쓰면 편해요)', q: '이로운 데리야끼소스', mall: 'oasis' },
    ],
  },
  {
    cat: '고춧가루', group: '양념', emoji: '🌶️', icon: 'cu_gochugaru',
    items: [
      { name: '복이네먹거리 고춧가루', matches: ['고춧가루'], benefit: '국내산 고추로 만들어요. 순한맛·보통매운맛에 용량·입자 크기까지 골라 살 수 있어 내 요리에 딱 맞춰 쓰기 좋아요', q: '복이네먹거리 고춧가루', mall: 'coupang' },
    ],
  },
  {
    cat: '올리브오일', group: '기름·육수', emoji: '🫒', icon: 'cu_oliveoil',
    items: [
      { name: '아이레스 데 크리스탈 하엔 1L', matches: ['올리브유', '올리브오일'], benefit: '산도가 낮고 가성비가 괜찮아요. 볶음요리할 때 넉넉히 써도 아깝지 않은 만만한 제품이에요', q: '아이레스 데 크리스탈 하엔 올리브오일', mall: 'coupang' },
      // ⛔ `matches` 를 뺐다 — 창업자 2026-08-03 *"광고에 올리브유는 1리터짜리만 넣어"*.
      //    재료에 「올리브유」라고만 쓰면 «넉넉히 쓰는» 1L 가 맞다. 250ml 는 샐러드·마무리용이라
      //    자동으로 딸려 붙으면 엉뚱하다. ✅장보기 탭 큐레이션엔 그대로 남는다(목록에서 안 지운다).
      { name: '이리아다 칼라마타 엑스트라버진 실버틴 250ml', benefit: '밥 지을 때나 샐러드·발사믹 소스처럼 신선한 올리브오일을 그대로 더할 때 써요. 250ml 작은 용량에 틴케이스라 변질 우려도 적고 맛이 깔끔해 재구매템이에요', q: '이리아다 칼라마타 엑스트라버진 올리브유 실버틴', mall: 'coupang' },
    ],
  },
  {
    cat: '햄·소시지', group: '고기·해산물', emoji: '🌭', icon: 'cu_ham_slice',
    items: [
      { name: '문어 비엔나', matches: ['비엔나', '소시지'], icon: 'cu_ham_vienna', benefit: '햄·소시지는 첨가물이 많아 쉽게 손이 안 가는데, 이건 성분이 괜찮아 오아시스 장볼 때마다 하나씩 꼭 담는 단골템이에요. 살짝 데쳐 그냥 먹어도 맛있고 모양도 귀여워 아이들이 좋아해요', q: '문어 비엔나', mall: 'oasis' },
      { name: '위드잇 슬라이스햄 슬림', matches: ['슬라이스햄'], icon: 'cu_ham_slice', benefit: "첨가물 없는 '착한 스팸' 컨셉이에요. (스팸의 찐한 맛을 기대하면 조금 아쉬울 수 있어요) 데리야끼소스에 살짝 구워 무스비에 넣으면 아이 간편식으로 좋아요. 저희 애는 2주 동안 하루 한 개씩 무스비로 먹었어요", q: '위드잇 슬라이스햄 슬림', mall: 'coupang' },
      { name: '베이컨리얼리즘 무설탕 삼겹 베이컨', matches: [], q: '베이컨리얼리즘 무설탕 삼겹 베이컨', tag: '베이컨', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '훈제오리', group: '고기·해산물', emoji: '🦆', icon: 'cu_duck',
    items: [
      { name: '자연누리 훈제오리', matches: ['훈제오리'], benefit: '저는 수년째 먹는 재료예요. 소분해 냉동해두면 바쁜 아침에 깻잎이랑 휘리릭 볶아 반찬으로 딱. 처음엔 생소해도 한번 사면 계속 사게 될 거예요', q: '자연누리 훈제오리', mall: 'coupang' },
      { name: '무무덕 훈제오리', matches: ['훈제오리'], benefit: '나온 지 얼마 안 된 신상이에요. 첨가물 없이 깔끔하고 샤브 야채 위에 올려 찜해 먹으면 고소한 다이어트 건강식이 돼요. 자연누리와 또 다른 느낌이라 번갈아 구비해둬요', q: '무무덕 훈제오리', url: 'https://sanjitalk.com/article/161' },
    ],
  },
  {
    cat: '돼지고기', group: '고기·해산물', emoji: '🥩', icon: 'cu_pork',
    items: [
      { name: '선진포크 한돈 생 대패목심', matches: ['대패목심'], benefit: '대패삼겹살보다 기름이 적어 깔끔해요. 소분해 냉동해두면 바쁜 아침에도 금방 구워 낼 수 있어요. 고기 좋아해서 아침에도 고기 찾는 아이 있는 집에 좋아요', q: '선진포크 한돈 생 대패목심', mall: 'coupang' },
    ],
  },
  {
    cat: '국수·면', group: '면·밥', emoji: '🍜', icon: 'cu_noodle',
    items: [
      { name: '오월햇살 우리밀 유기농국수', matches: ['소면', '국수'], benefit: '성분 좋고 쫄깃해서 잔치국수·비빔국수 어디든 편하게 써요. 급할 땐 삶아서 냉면육수만 부어도 시원한 한 그릇 완성!', q: '오월햇살 우리밀 유기농 국수', mall: 'coupang' },
      { name: '보보리쿡시 보리면', matches: ['보리면'], benefit: '밀가루 0%라 속이 편해요. 삶지 않고 익혀내는 방식이라 쫄깃하고 씹을수록 향이 올라와요. 쯔유와 특히 잘 어울려요', q: '보보리쿡시 보리면' },
      { name: '자연드림 건자른당면', matches: ['당면'], tag: '당면', benefit: '잡채할 때 자른당면이 훨씬 편해요. 삶는시간도 짧고 아이들 먹기도 좋아요.', q: '자연드림 건자른당면', neu: true },
      { name: '한살림 납작당면', matches: ['납작당면', '당면'], tag: '납작당면', benefit: '납작당면은 국물요리에 넣으면 쫄깃하고 잘 붇지않아서 좋아요. 부대찌개나 밀푀유나베에 넣어요.', q: '한살림 납작당면', url: HANSALIM_APP, neu: true },
      { name: '샐러드판다 들기름막국수', matches: [], q: '샐러드판다 들기름막국수', tag: '막국수', mall: 'kurly', neu: true },
      { name: '세끼판다 메밀면 샐러드', matches: [], q: '세끼판다 메밀면 샐러드', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '누룽지', group: '면·밥', emoji: '🍚', icon: 'cu_nurungji',
    items: [
      { name: '자연다음 현미누룽지', matches: ['누룽지'], benefit: '쌀눈 살아있는 국내산 현미누룽지예요. 개별 소포장이라 눅눅해질 걱정 없이 쓰기 편하고, 얇아서 금방 익어 밥하기 귀찮은 날·아침에 밥 없을 때 구원템이에요', q: '자연다음 현미누룽지', mall: 'coupang' },
    ],
  },
  {
    cat: '두유', group: '두부·콩', emoji: '🥛', icon: 'cu_soymilk',
    items: [
      { name: '연세 국산콩두유 약콩', matches: ['두유'], benefit: '국산콩으로 만들어 적당한 단맛에 고소하고 느끼하지 않아요. 출출할 때나 아이 간식으로 챙겨주기 좋은, 제 최애 두유예요', q: '연세 국산콩두유 약콩', url: 'https://brand.naver.com/yonseidairy/products/8785157847' },
    ],
  },
  {
    // 🫘 콩국물 — 창업자가 직접 쓴 카피(2026-08-02). 여름 콩국수의 바닥이라 두유와 따로 둔다
    //    (두유는 마시는 것, 콩국물은 요리 재료다).
    cat: '콩국물', group: '두부·콩', emoji: '🫘', icon: 'cu_soymilk',
    items: [
      { name: '무농약콩으로 만든 콩국물', matches: ['콩국물'], benefit: '남편이 콩국수를 좋아해서 여름에 자주 사는 아이템이에요. 국산 대두＋정제수가 끝이에요. 가격도 저렴하고 양도 적어서 한 끼에 딱 끝나요. 간이 안 되어 있어서 소금은 먹기 직전에 취향껏 넣으면 돼요', q: '한살림 무농약콩으로 만든 콩국물', url: HANSALIM_APP },
      { name: '풀무원 특등급 국산콩물', matches: ['콩국물'], benefit: '한살림이 근처에 없을 때 쿠팡에서 바로 받을 수 있어요. 이건 소금간이 되어 있어서 그냥 부어 먹어도 되고, 맛을 보고 싱거우면 소금만 조금 더하면 돼요', q: '풀무원 특등급 국산콩물', mall: 'coupang',
        // ⚠️ 창업자가 콕 집어준 상품이라 «검색어»가 아니라 직접 링크로 건다(검색은 다른 풀무원 콩물이 먼저 뜬다).
        //    ⛔ 원본 주소에 붙어 있던 `searchId`·`traceId`·`rank` 등은 **창업자 검색 세션 식별자**라 떼어냈다.
        //    ⭐ `itemId`·`vendorItemId` 도 뗐다 — 그건 «1개들이/2개들이» 같은 «옵션»까지 박아버린다.
        //       상품 페이지로만 보내면 사는 사람이 개수를 직접 고른다.
        url: 'https://www.coupang.com/vp/products/8769400021' },
    ],
  },
  {
    cat: '두부', group: '두부·콩', emoji: '🧈', icon: 'cu_tofu',
    items: [
      { name: '한살림 마른두부', matches: ['마른두부', '포두부'], benefit: '"두부는 한살림"이라는 말, 써보면 알아요. 물기를 쫙 빼 쫄깃해서 구이·조림에 좋아요. (부드러운 두부 좋아하면 이건 비추)', q: '한살림 마른두부', url: HANSALIM_APP },
      { name: '한살림 몽글이 순두부', matches: ['순두부'], benefit: '작은 냄비에 파르르 끓여 양념장만 넣으면 3분 컷. 바쁜 아침 남편 식사대용으로, 저녁에 출출할 때 야식으로도 좋아요', q: '한살림 몽글이 순두부', url: HANSALIM_APP },
      // ⭐ 창업자 2026-08-03 제공. **쿠팡이라 조합원 아니어도 산다** — 도토리묵 자리에 한살림밖에 없던 걸 메운다.
      { name: '친정엄마 국내산 도토리로 만든 도토리묵', matches: ['도토리묵'], benefit: '국산 도토리앙금·천일염, 성분이 심플해요. 작은 사이즈로 소분돼 있어 하나 까서 혼자 먹기 딱이에요', q: '친정엄마 국내산 도토리묵', mall: 'coupang' },
      { name: '농협식품 우리콩 두부면 넓은면', matches: [], q: '농협식품 우리콩 두부면 넓은면', tag: '두부면', mall: 'coupang', neu: true },
    ],
  },
  {
    cat: '카레', group: '간편식·간식', emoji: '🍛', icon: 'cu_curry',
    items: [
      { name: '채담카레', matches: ['카레'], benefit: '건더기가 없어서 야채 싫어하는 아이도 잘 먹어요. 알고 보면 새싹채소·양파로 만든 건데 말이죠. 몰래 건강 챙기기 좋은 순한 카레예요', q: '채담카레', mall: 'coupang' },
      { name: '상하농원 버터치킨카레', matches: ['카레'], benefit: '대기업 맛인데 성분이 착해요. 풍미가 부드럽고, 급할 땐 중탕해서 돈까스랑 곁들이면 든든한 한 끼가 돼요. 저는 구비해두는 카레예요', q: '상하농원 버터치킨카레', mall: 'coupang' },
    ],
  },
  {
    cat: '어묵', group: '고기·해산물', emoji: '🍢', icon: 'cu_eomuk',
    items: [
      { name: '명태살 가득 참 어묵', matches: ['어묵'], benefit: '명태살이 가득해 성분 좋은 어묵이에요. 종류별로 사서 오븐에 구운 뒤 냉동해두면, 가루육수 넣어 남편이 좋아하는 어묵탕 5분 컷', q: '한살림 명태살가득참어묵', url: HANSALIM_APP },
      { name: '새로미 바른어묵', matches: ['어묵'], benefit: '성분 좋고 맛있는 어묵이에요. 짜지 않아 아이 반찬으로도 안심. 한살림이 집 근처에 없다면 이걸로 대용해도 좋아요. 구우면 겉이 쫄깃해져 더 맛있어요', q: '새로미 바른어묵', mall: 'coupang' },
    ],
  },
  {
    cat: '매생이·해조', group: '고기·해산물', emoji: '🍃', icon: 'cu_maesaengi',
    items: [
      { name: '갯푸른 간편 매생이 블럭', matches: ['매생이'], benefit: '하나씩 개별포장이라 필요한 만큼 쏙 꺼내 쓰기 편해요. 국·전으로 겨울 제철 맛을 간편하게 즐겨요', q: '갯푸른 간편 매생이 블럭', mall: 'coupang' },
    ],
  },
  {
    cat: '간식', group: '간편식·간식', emoji: '🍡', icon: 'cu_pizza',
    items: [
      { name: '초당옥수수피자', icon: 'cu_pizza', benefit: '아이 방학 간식 구원템이에요. 달달 고소한 옥수수랑 피자치즈로 재료가 심플하고 성분도 괜찮아요. 스팀오븐에 조리하면 도우가 말랑해서 간식으로 딱. 사이즈가 크지 않아 한 끼 대용으로도 좋아요', q: '한살림 초당옥수수피자', url: HANSALIM_APP },
      { name: '고구마부리또', icon: 'cu_burrito', benefit: '달달하고 고소해서 제가 아끼는 간식템이에요. 또띠아에 고구마·모짜렐라 치즈로 재료가 심플하고 전자레인지로 데우기만 하면 돼 편해요. 어르신 간식으로도 좋고 저희 집 냉동실에도 구비해두는 거예요', q: '한살림 고구마부리또', url: HANSALIM_APP },
      { name: '자연드림 초코크림파이', matches: [], tag: '간식', benefit: '크림이 부드럽고 많이 달지않아 냉장고에 넣어두고 아이간식, 커피랑도 참 잘어울려요.', q: '자연드림 초코크림파이', neu: true },
      { name: '자연드림 기리쉬케이크', matches: [], tag: '간식', benefit: '한 조각씩 포장돼 있어 먹기 편해요. 냉동실에 두고 손님 오면 꺼내기도 좋아요.', q: '자연드림 기리쉬케이크', neu: true },
      { name: '자연드림 젤리스틱', matches: [], tag: '간식', benefit: '아이 간식으로 사두는 젤리. 스틱이라 하나씩 꺼내주기 좋아요.', q: '자연드림 젤리스틱', neu: true },
      { name: '한살림 인절미', matches: [], tag: '떡', benefit: '콩고물이 고소해요. 냉동해뒀다 살짝 구우면 겉은 바삭 속은 쫀득해서 간식으로 좋아요.', q: '한살림 인절미', url: HANSALIM_APP, neu: true },
      { name: '아우노슈가 아우노너띠', matches: [], q: '아우노슈가 아우노너띠', mall: 'coupang', neu: true },
      { name: '농심 누룽지팝', matches: [], q: '농심 누룽지팝', mall: 'coupang', neu: true },
      { name: '먼투썬 하루견과블랙', matches: [], q: '먼투썬 하루견과블랙', tag: '견과', mall: 'kurly', neu: true },
      { name: '그라놀로지 시그니쳐크런치코코넛', matches: [], q: '그라놀로지 시그니쳐크런치코코넛', tag: '그라놀라', mall: 'coupang', neu: true },
      { name: '크놀라 크런치 코코넛', matches: [], q: '크놀라 크런치 코코넛', tag: '그라놀라', mall: 'coupang', neu: true },
      { name: '매홍 국내산 촉촉한 군고구마 말랭이', matches: [], q: '매홍 국내산 촉촉한 군고구마 말랭이', mall: 'coupang', neu: true },
    ],
  },
]

// ── 공용 헬퍼 (ShopScreen · 레시피 상세가 함께 사용) ─────────────────
// 카테고리 평면화된 전체 제품 목록.
export const PRODUCTS = CURATION.flatMap((g) => g.items.map((it) => ({ ...it, cat: g.cat, emoji: g.emoji })))

const MALL_SEARCH = {
  coupang: 'https://www.coupang.com/np/search?q={q}',
  oasis: 'https://www.oasis.co.kr/product/search?keyword={q}',
  naver: 'https://search.shopping.naver.com/search/all?query={q}',
  // 🛒 2026-08-11 창업자 자료(컬리 23개)로 처음 등장. ⚠️정확한 검색 주소를 확인할 방법이 없어
  //    (이 환경은 쇼핑몰을 못 연다) «가장 흔히 알려진 꼴»로 넣었다 — 창업자 검수 때 살아 있는지 같이 본다.
  kurly: 'https://www.kurly.com/search?sword={q}',
}
// '사러가기' 링크: url 이 있으면 직접 링크, mall 이 있으면 그 쇼핑몰 검색, 없으면 네이버쇼핑.
export const productLink = (it) =>
  it.url || (MALL_SEARCH[it.mall] || MALL_SEARCH.naver).replace('{q}', encodeURIComponent(it.q))

// 구매처 배지 라벨.
export const productMall = (it) => {
  if (it.mall === 'coupang') return '쿠팡'
  if (it.mall === 'oasis') return '오아시스'
  if (it.mall === 'kurly') return '컬리'
  const u = it.url || ''
  if (u.includes('hansalim')) return '한살림'
  if (u.includes('sanjitalk')) return '산지톡'
  if (u.includes('smartstore.naver') || u.includes('brand.naver')) return '네이버'
  return ''
}

// 문자열들(재료 + 메모)에서 '주부의 장바구니' 제품이 쓰였는지 찾는다.
// 재료에 제품명을 그대로 적으면 픽 카드에 뜬다. 특화 제품만 재료에 이름을 남기고
// 나머지 내 제품은 메모로 옮겼으므로, 호출부에서 메모도 함께 넣어 스캔한다(RecipeDetailScreen).
export const picksForIngredients = (ingredients = []) => {
  const text = (ingredients || []).join('  ')
  // ⭐ 두 갈래로 찾는다.
  //   ① 제품 «풀네임» 이 글에 그대로 있으면 = 창업자가 "이거 쓴다"고 직접 적은 것 → 항상 «앞»에 온다.
  //   ② `matches` 의 낱말이 있으면 = 재료 이름만 적어도 붙는 안전망(`순두부 1팩` → 한살림 몽글이 순두부).
  // ⚠️ `matches` 는 «좁게» 준다. '간장'·'설탕'처럼 거의 모든 레시피에 있는 말을 넣으면
  //    모든 레시피에 광고가 도배된다. 재료 줄에 실제로 쓰는 «그 재료 이름»만.
  // ⛔⛔ `matches` 는 «낱말 시작»으로만 맞춘다 — 낱말 한가운데서 걸리면 안 된다.
  //   2026-08-03 창업자 제보: 재료가 `노두유 1/2작은술` 인데 「연세 국산콩두유」가 붙었다.
  //   **노두유(老抽)는 중국 진간장이지 두유가 아니다.** 「노두유」 속에 「두유」가 들어 있어서 걸렸다.
  //   같은 꼴이 얼마든지 있다 — 「간장게장」↔간장 · 「참치액」↔참치 · 「고추장아찌」↔고추장.
  //   ⭐ 한국어는 조사가 «뒤»에 붙으니 «앞»을 기준으로 본다: `두유를`·`두유 200ml` ✅ / `노두유` ⛔
  const tokens = (ingredients || []).flatMap((i) => String(i).split(/[\s,()·/]+/)).filter(Boolean)
  const startsWithAny = (w) => tokens.some((t) => t.startsWith(w))
  const direct = [], byWord = []
  for (const p of PRODUCTS) {
    if (p.name && text.includes(p.name)) direct.push(p)
    else if ((p.matches || []).some((w) => w && startsWithAny(w))) byWord.push(p)
  }
  return [...direct, ...byWord]
}

// 🗓🗓 **「이번 주 픽」은 «저절로» 돈다** (창업자 2026-08-10 *"주부장바구니픽도 매주 꼭 바꿔줘"*)
//
// ⛔⛔ **예전엔 `pick: true` 가 박힌 «두 개»를 그대로 보여줬다 — 매주는커녕 영영 안 바뀌었다.**
//    이름만 「이번 주 픽」이고 실제로는 「고정 둘」이었다. 창업자 확인 = *"예시야 된장."*
//
// ⭐⭐ **왜 「매주 손으로 바꾸기」로 안 만들었나** — 사람이 매주 하는 일은 반드시 빠진다.
//    2026-08-10 아침에 배포가 세 번 막힌 것도 같은 뿌리다(주간 레시피 재고를 미리 안 채웠다).
//    주간 레시피가 `from` 날짜로 저절로 열리듯, 픽도 **날짜가 돌린다.**
//
// ⭐ 고르는 순서
//   ① **이번 주 레시피가 실제로 쓰는 제품** — 홈의 「이번 주 제철」과 장보기의 「이번 주 픽」이
//      **한 이야기가 된다.** 깻잎 주에는 깻잎 요리에 들어가는 양념이 뜬다.
//   ② 모자라면 **주차 번호로 밀어가며** 나머지를 채운다 → 어느 주에도 픽이 비지 않는다.
//
// ⚠️ 돌리는 «규칙»은 `weeklypick.js` 에 있다 — 이 파일은 `import.meta.glob`(Vite 전용) 때문에
//    노드가 못 읽어서, 배포 게이트가 검사할 수 있게 순수 계산만 갈라 뒀다.
export const weeklyPicks = (weekly = null, today = '', n = 3) => pickRotate({
  products: PRODUCTS,
  matched: weekly
    ? picksForIngredients((weekly.items || []).flatMap((r) => [...(r.ingredients || []), r.memo || '']))
    : [],
  today,
  n,
})
