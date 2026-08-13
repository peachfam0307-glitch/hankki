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
      // 🦴 2026-08-13 — 부대찌개 재료에 「설성목장 사골육수 2봉」을 넣으면서 같이 등록.
      //   ⛔ 재료에 브랜드만 쓰고 여기 안 넣으면 «사러가기가 안 붙는다»(창업자가 물어봐서 알았다).
      //   ⚠️ 그림이 아직 없다 — 「해물가루육수」·「치킨스톡」 컷은 봉지에 «글자가 박혀 있어» 못 쓴다.
      //      icon 을 안 주면 카테고리 그림(해물가루육수)이 붙어 글자가 틀리므로 «빈 채로» 둔다.
      //      ⏳ 창업자가 컷을 뽑으면 `cu_stock_sagol` 로 넣는다.
      { name: '설성목장 사골육수', matches: ['사골육수', '사골'], tag: '사골육수', benefit: '간이 안 되어 있고 소포장이라 쓰기 편해요. 성분도 깔끔해요', q: '설성목장 사골육수', mall: 'coupang' },
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
    ],
  },
  {
    cat: '카레', group: '간편식·간식', emoji: '🍛', icon: 'cu_curry',
    items: [
      { name: '채담카레', matches: ['카레'], benefit: '건더기가 없어서 야채 싫어하는 아이도 잘 먹어요. 알고 보면 새싹채소·양파로 만든 건데 말이죠. 몰래 건강 챙기기 좋은 순한 카레예요', q: '채담카레', mall: 'coupang' },
      { name: '상하농원 버터치킨카레', matches: ['카레'], benefit: '대기업 맛인데 성분이 착해요. 풍미가 부드럽고, 급할 땐 중탕해서 돈까스랑 곁들이면 든든한 한 끼가 돼요. 저는 구비해두는 카레예요', q: '상하농원 버터치킨카레', mall: 'coupang' },
    ],
  },
  // 🥕 2026-08-13 신설 — 「꼬들단무지 무침」 재료에 브랜드를 넣으면서 같이 등록.
  //   ⚠️ 그림이 아직 없다(단무지 컷 자체가 없다) — ⏳창업자가 뽑으면 `cu_danmuji` 로.
  //      ⭐ 그동안 유니코드 이모지가 뜨지 않게 `ShopScreen` 폴백을 우리 아이콘으로 고쳤다.
  {
    cat: '단무지·절임', group: '간편식·간식', emoji: '🥕',
    items: [
      // ✅ 창업자가 준 «상품 직접 링크» (2026-08-13). 검색이 아니라 그 상품으로 바로 간다.
      //    ⭐ 자연드림(아이쿱)은 실버회원 가입으로 누구나 온라인에서 산다 —
      //       한살림처럼 「조합원만」 배지를 붙이지 않는다(창업자 확인 2026-08-03).
      { name: '자연드림 꼬들단무지', matches: ['꼬들단무지', '단무지'], benefit: '꼬들한 식감이 좋아요. 물기가 다 빠져 나와서 뜯어서 바로 무치면 되니까 반찬 하나가 금방 나와요. 단무지 자체도 새콤달콤 맛있어요', q: '자연드림 꼬들단무지',
        url: 'https://icoop.or.kr/coopmall/goodsmall.phtm?key=%EA%BC%AC%EB%93%A4%EB%8B%A8%EB%AC%B4%EC%A7%80&act=detail&left_ca_name=&gc=26003GZ800&gg=N05&gg2=' },
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
    ],
  },
]

// ── 공용 헬퍼 (ShopScreen · 레시피 상세가 함께 사용) ─────────────────
// 카테고리 평면화된 전체 제품 목록.
// ⛔⛔ [2026-08-12] `icon` 을 안 얹고 있었다 — 창업자 폰 제보 *"장바구니 아이콘 바뀜"*
//    `icon` 은 «카테고리» 줄에 있는데(`{cat:'굴소스', icon:'cu_gulsauce'}`) 제품 줄엔 대개 없다.
//    그래서 「이번 주 픽」처럼 «제품 단위»로 그리는 자리는 `it.icon` 이 undefined 라
//    **이모지로 폴백**했다(🫗🍶🐟🍬). 카테고리 카드는 `c.icon` 을 직접 써서 멀쩡했고 —
//    그래서 «한 화면 안에서» 어떤 건 그림, 어떤 건 이모지가 됐다.
//    ⛔ 우리 규칙은 **UI에 유니코드 이모지 금지**(CLAUDE.md)라 이건 규칙 위반이기도 하다.
//    ✅ 제품이 자기 그림을 가졌으면 그걸, 없으면 카테고리 그림을 물려받는다.
export const PRODUCTS = CURATION.flatMap((g) => g.items.map((it) => ({ ...it, cat: g.cat, emoji: g.emoji, icon: it.icon || g.icon })))

const MALL_SEARCH = {
  coupang: 'https://www.coupang.com/np/search?q={q}',
  oasis: 'https://www.oasis.co.kr/product/search?keyword={q}',
  naver: 'https://search.shopping.naver.com/search/all?query={q}',
}
// '사러가기' 링크: url 이 있으면 직접 링크, mall 이 있으면 그 쇼핑몰 검색, 없으면 네이버쇼핑.
export const productLink = (it) =>
  it.url || (MALL_SEARCH[it.mall] || MALL_SEARCH.naver).replace('{q}', encodeURIComponent(it.q))

// 구매처 배지 라벨.
export const productMall = (it) => {
  if (it.mall === 'coupang') return '쿠팡'
  if (it.mall === 'oasis') return '오아시스'
  const u = it.url || ''
  if (u.includes('hansalim')) return '한살림'
  // 🛒 자연드림(아이쿱) — 2026-08-13 신설. 없으면 배지가 «빈칸»으로 떠서 어디서 사는지 안 보인다.
  //    ⭐ 「조합원만」 배지는 안 붙인다 — 실버회원 가입으로 누구나 산다(창업자 확인 2026-08-03).
  if (u.includes('icoop')) return '자연드림'
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
export const weeklyPicks = (weekly = null, today = '', n = 4) => pickRotate({
  products: PRODUCTS,
  matched: weekly
    ? picksForIngredients((weekly.items || []).flatMap((r) => [...(r.ingredients || []), r.memo || '']))
    : [],
  today,
  n,
})
