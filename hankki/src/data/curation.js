// 주부의 장바구니 — 18년차 주부가 엄선한 건강 식재료 큐레이션.
// name + benefit(따뜻한 한 줄)이면 충분. '사러가기' 연결 규칙:
//   url 이 있으면 그 직접 링크로, mall 이 있으면 그 쇼핑몰 검색으로, 없으면 네이버쇼핑 통합검색.
//   mall: 'coupang' | 'oasis' (검색 지원). 한살림은 로그인 검색 URL이 없어 앱 열기 링크(HANSALIM_APP)를 url 로 사용.
// 나중에 url/mall 을 제휴(어필리에이트) 링크로 바꾸면 그대로 수수료 링크가 됨.

// 한살림은 로그인 때문에 웹 검색 URL이 없어, 로그인이 유지되는 '한살림 앱'을 바로 연다(안드로이드).
// 주소 기반 intent(intent://host…)는 앱이 딥링크를 등록해야 작동해서 웹 홈으로 폴백됐다.
// → 패키지로 앱 런처를 직접 실행하는 형식(intent:#Intent;package=…)으로 변경.
const HANSALIM_APP = 'intent:#Intent;package=kr.or.hansalim.shop;S.browser_fallback_url=https%3A%2F%2Fshop.hansalim.or.kr%2Fshopping%2FspMain.do;end'

export const CURATION = [
  {
    cat: '간장', emoji: '🫗',
    items: [
      { name: '성가정 우리콩 진간장', benefit: '우리콩으로 만들어 성분이 깔끔해요. 짜지 않아 어디에나 두루 쓰기 좋아요', q: '성가정 우리콩 진간장' },
      { name: '올가 우리콩 진간장', benefit: '우리콩으로 깔끔하게 담았어요. 부담 없이 매일 쓰기 좋아요', q: '올가 우리콩 진간장' },
    ],
  },
  {
    cat: '된장', emoji: '🥣',
    items: [
      { name: '죽장연 전통된장', benefit: '국산콩과 천일염만으로 담아 깊고 진한 맛이 나요', q: '죽장연 전통된장' },
      { name: '백합된장', benefit: '수녀원에서 메주·물·소금만으로 정성껏. 구수해서 찌개나 국에 잘 어울려요', q: '백합된장', url: 'http://www.spcfood.co.kr/product/product_view.php?ProductSeqNo=8' },
    ],
  },
  {
    cat: '맛술', emoji: '🍶',
    items: [
      { name: '요리맛샘', benefit: '맛술 대신 쓰기 좋아요. 성분이 깔끔하고 살짝 새콤해 어떤 요리에나 잘 어울려요', q: '요리맛샘' },
    ],
  },
  {
    cat: '굴소스', emoji: '🦪',
    items: [
      { name: '요리맛샘 굴소스', benefit: '첨가물 없이 국산 재료로. 감칠맛이 좋아 아이 요리에도 안심이에요', q: '요리맛샘 굴소스' },
    ],
  },
  {
    cat: '소금', emoji: '🧂',
    items: [
      { name: '모에솔트 대파소금', benefit: '국산 대파가 절반이나. 염도가 낮아 간 맞추기 좋고 대파향이 은은해요', q: '모에솔트 대파소금' },
    ],
  },
  {
    cat: '스톡·육수', emoji: '🍲',
    items: [
      { name: '위드잇 쯔유스톡', benefit: '성분이 좋고 한 포씩 쓸 수 있어 간편해요. 유통기한도 넉넉하답니다', q: '위드잇 쯔유스톡' },
      { name: '위드잇 치킨스톡', benefit: '한 포씩 톡 넣으면 끝. 국물요리가 간편해지고 유통기한도 넉넉해요', q: '위드잇 치킨스톡' },
    ],
  },
  {
    cat: '소스', emoji: '🍯',
    items: [
      { name: '이로운 데리야끼소스', benefit: '첨가물 없이 점도가 좋아 요리하기 편하고, 맛도 깔끔해요', q: '이로운 데리야끼소스', mall: 'oasis' },
    ],
  },
  {
    cat: '고춧가루', emoji: '🌶️',
    items: [
      { name: '복이네먹거리 고춧가루', benefit: '국내산 고추예요. 순한맛·보통맛에 입자 크기까지 골라 쓸 수 있어 편해요', q: '복이네먹거리 고춧가루', mall: 'coupang' },
    ],
  },
  {
    cat: '올리브오일', emoji: '🫒',
    items: [
      { name: '아이레스 데 크리스탈 하엔 1L', benefit: '산도가 낮고 가성비가 좋아요. 넉넉한 대용량이라 부담 없이 써요', q: '아이레스 데 크리스탈 하엔 올리브오일', mall: 'coupang' },
      { name: '이리아다 칼라마타 엑스트라버진 올리브유 실버틴', benefit: '작은 실버틴 캔이라 빛을 막아 산패가 덜하고 선물용으로도 예뻐요. 샐러드·밥 지을 때 딱, 풍미가 참 좋아요', q: '이리아다 칼라마타 엑스트라버진 올리브유 실버틴', mall: 'coupang' },
    ],
  },
  {
    cat: '햄·소시지', emoji: '🌭',
    items: [
      { name: '문어 비엔나', benefit: '성분도 괜찮고 모양이 귀여워요. 맛도 좋아 아이들이 잘 먹어요', q: '문어 비엔나', mall: 'oasis' },
      { name: '위드잇 슬라이스햄 슬림', benefit: '성분이 깔끔하고 짜지 않아요. 작아서 구이나 무스비에 딱이에요', q: '위드잇 슬라이스햄 슬림' },
    ],
  },
  {
    cat: '훈제오리', emoji: '🦆',
    items: [
      { name: '자연누리 훈제오리', benefit: '첨가물 없이 훈연으로 맛냈어요. 마지막에 깻잎을 듬뿍 찢어 함께 살짝 볶으면 훨씬 맛있어요!', q: '자연누리 훈제오리' },
      { name: '무무덕 훈제오리', benefit: '첨가물 없이 깔끔한 맛이에요', q: '무무덕 훈제오리', url: 'https://sanjitalk.com/article/161' },
    ],
  },
  {
    cat: '돼지고기', emoji: '🥩',
    items: [
      { name: '선진포크 한돈 대패목심', benefit: '한돈이고 적당히 얇아 기름이 안 튀고 깔끔하게 구워져요', q: '선진포크 한돈 대패목심' },
    ],
  },
  {
    cat: '국수·면', emoji: '🍜',
    items: [
      { name: '오월햇살 우리밀 유기농국수', benefit: '우리밀로 만들어 이래저래 활용도가 좋은 국수예요', q: '오월햇살 우리밀 유기농 국수' },
      { name: '보보리쿡시 보리면', benefit: '밀가루 없이 보리로만 만들어 쫄깃하고 풍미가 좋아요', q: '보보리쿡시 보리면' },
    ],
  },
  {
    cat: '누룽지', emoji: '🍚',
    items: [
      { name: '자연다음 현미누룽지', benefit: '쌀눈이 살아있는 국내산. 한 봉지씩 끓이면 금세 구수하게 완성돼요', q: '자연다음 현미누룽지' },
    ],
  },
  {
    cat: '두유', emoji: '🥛',
    items: [
      { name: '연세 국산콩두유 약콩', benefit: '당류가 적어(5g) 달지 않은데도 고소하고 맛있어요', q: '연세 국산콩두유 약콩' },
    ],
  },
  {
    cat: '카레', emoji: '🍛',
    items: [
      { name: '채담카레', benefit: '성분이 좋고 건더기가 없어 깔끔하게 즐겨요', q: '채담카레', mall: 'coupang' },
      { name: '상하키친 버터치킨카레', benefit: '성분도 괜찮고 맛있어서 손이 자주 가요', q: '상하키친 버터치킨카레', mall: 'coupang' },
    ],
  },
  {
    cat: '어묵', emoji: '🍢',
    items: [
      { name: '명태살 가득 참 어묵', benefit: '명태살이 가득 들어 든든해요', q: '한살림 명태살가득참어묵', url: HANSALIM_APP },
      { name: '새로미 바른어묵', benefit: '성분이 좋고 짜지 않아요. 오븐이나 에어프라이어에 구우면 쫄깃해요', q: '새로미 바른어묵', mall: 'coupang' },
    ],
  },
  {
    cat: '매생이·해조', emoji: '🍃',
    items: [
      { name: '갯푸른 간편 매생이 블럭', benefit: '하나씩 개별포장이라 필요한 만큼 쏙 꺼내 쓰기 편해요', q: '갯푸른 간편 매생이 블럭', mall: 'coupang' },
    ],
  },
  {
    cat: '간식', emoji: '🍡',
    items: [
      { name: '초당옥수수피자', benefit: '스팀오븐에 촉촉하게 데우면 간식으로 딱. 성분도 깔끔해요', q: '한살림 초당옥수수피자', url: HANSALIM_APP },
      { name: '고구마부리또', benefit: '달달하고 고소해서 아이들 간식으로 최고예요', q: '한살림 고구마부리또', url: HANSALIM_APP },
    ],
  },
]
