import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { seedRecipes } from './data/seed'
import { basicRecipes, BASICS_VERSION } from './data/basics'
import { guessFoodIcon } from './components/FoodIcon'
import { cleanMemo } from './parseRecipe'
import { politeSteps } from './polish'

const KEY = 'hankki:v1'
let lastFullWarn = 0 // 저장공간 초과 경고 throttle(모듈 스코프)
const PROFILE_DEFAULT = { name: '한끼러버', bio: '맛있는 한 끼로 행복한 하루 :)' }

// 장보기 쇼핑몰 바로가기 기본 목록. url = 홈, search = 재료 검색(‘{q}’에 재료명 치환).
// 나중에 제휴(어필리에이트) 태그를 이 url/search에 붙이면 그대로 수수료 링크가 됨.
// iconType: 'emoji' | 'label'(글자 타일). 재료 아이콘과 동일한 방식.
const DEFAULT_SHOPS = [
  { id: 'coupang', name: '쿠팡', icon: 'box', iconType: 'icon', url: 'https://www.coupang.com', search: 'https://www.coupang.com/np/search?q={q}' },
  { id: 'kurly', name: '마켓컬리', icon: 'bag', iconType: 'icon', url: 'https://www.kurly.com', search: 'https://www.kurly.com/search?sword={q}' },
  { id: 'ssg', name: '이마트몰', icon: 'cart', iconType: 'icon', url: 'https://emart.ssg.com', search: 'https://emart.ssg.com/search.ssg?query={q}' },
  { id: 'naver', name: '네이버쇼핑', icon: 'store', iconType: 'icon', url: 'https://shopping.naver.com', search: 'https://search.shopping.naver.com/search/all?query={q}' },
  { id: 'oasis', name: '오아시스', icon: 'basket', iconType: 'icon', url: 'https://www.oasis.co.kr', search: 'https://www.oasis.co.kr/product/search?keyword={q}' },
  // ⚠️ 한살림 온라인 장보기는 **조합원만** 산다 — 가입비 3천원 ＋ 출자금 3만원(탈퇴 때 돌려받음).
  //    비조합원은 «매장에서만» 살 수 있고 값이 10% 비싸다. (한살림 공식 안내 · 2026-08-03 확인)
  { id: 'hansalim', name: '한살림', icon: 'sprout', iconType: 'icon', note: '조합원 전용', url: 'https://shop.hansalim.or.kr/shopping/spMain.do', search: 'https://shop.hansalim.or.kr/shopping/spMain.do' },
  // ⭐ 자연드림(아이쿱)은 **조합원이 아니어도 온라인에서 산다**(일반가). 조합원이면 할인가.
  //    창업자 2026-08-03: *"자연드림은 일반소비자도 가능하다고 적어주고."*
  { id: 'naturedream', name: '자연드림', icon: 'basket', iconType: 'icon', url: 'https://www.icoop.or.kr', search: 'https://www.icoop.or.kr' },
]

function migrateShopping() {
  try {
    return JSON.parse(localStorage.getItem('hankki:shopping')) || []
  } catch {
    return []
  }
}

// 위시(사고 싶은 재료)를 장보기 리스트로 흡수 — 두 리스트가 사실상 같은 '살 것' 목록이라
// 하나로 합친다(1회성). 이름·사러가기 링크·완료여부는 보존, 이름 중복은 건너뛴다.
function foldWishIntoShopping(wishlist = [], shoppingList = []) {
  if (!Array.isArray(wishlist) || wishlist.length === 0) return shoppingList
  const names = new Set(shoppingList.map((i) => i.name))
  const folded = wishlist
    .filter((w) => w && w.name && !names.has(w.name))
    .map((w) => ({ id: w.id || newId(), name: w.name, done: !!w.bought, url: w.url || undefined }))
  return [...folded, ...shoppingList]
}

// 기존 사용자의 기본 쇼핑몰(예전 알록달록 이모지)을 새 커스텀 아이콘으로 업그레이드.
// 예전 데이터는 iconType 필드가 아예 없고 emoji 만 있었다({id,name,emoji}). 그래서
// iconType 이 없거나('emoji' 이하) 인 경우 모두 아이콘으로 올린다. 사용자가 직접
// '아이콘'/'글자'로 바꾼 것(iconType==='icon'|'label')은 존중해 건드리지 않는다.
const SHOP_ICON_UPGRADE = { coupang: 'box', kurly: 'bag', ssg: 'cart', naver: 'store', oasis: 'basket' }
function migrateShops(shops) {
  if (!Array.isArray(shops) || shops.length === 0) return DEFAULT_SHOPS
  const up = shops.map((s) =>
    SHOP_ICON_UPGRADE[s.id] && s.iconType !== 'icon' && s.iconType !== 'label'
      ? { ...s, iconType: 'icon', icon: SHOP_ICON_UPGRADE[s.id] }
      : s
  )
  // ⭐ 「자연드림」을 «한 번만» 뒤에 붙인다 (2026-08-03 신설).
  //    ⚠️ 기존 유저는 자기 목록이 저장돼 있어서 `DEFAULT_SHOPS` 를 안 읽는다 — 안 붙이면 **새 유저만** 본다.
  //    ⛔ 유저가 지웠으면 다시 안 붙인다 → 그래서 「붙인 적 있음」 표시를 남긴다(한 번만 시도).
  const ADDED = 'hankki:shops:naturedream'
  try {
    if (!up.some((s) => s.id === 'naturedream') && !localStorage.getItem(ADDED)) {
      localStorage.setItem(ADDED, '1')
      return [...up, DEFAULT_SHOPS.find((s) => s.id === 'naturedream')]
    }
  } catch { /* 저장 못 하면 그냥 넘어간다 — 다음에 또 시도해도 해롭지 않다 */ }
  return up
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.recipes)) return null
    return data
  } catch {
    return null
  }
}

// 기존 사용자에게 기본 제공 레시피를 '한 번만' 넣어준다.
// seedV(버전)와 removedSeedIds(지운 것 기록) 덕분에, 사용자가 지운 기본 레시피는
// 앞으로 버전이 올라가도 절대 되살아나지 않는다.
// 기본 레시피에 새로 생긴 표지 사진(id → image URL)
const BASIC_PHOTOS = Object.fromEntries(
  basicRecipes.filter((r) => r.thumb === 'photo' && r.image).map((r) => [r.id, r.image])
)
function migrateBasics(saved) {
  const v = saved.seedV || 0
  const have = new Set(saved.recipes.map((r) => r.id))
  const haveTitles = new Set(saved.recipes.map((r) => (r.title || '').trim()))
  const dead = new Set(saved.removedSeedIds || [])
  // 📅📅 «날짜가 돼서 새로 열린» 주간 레시피는 seedV 가 최신이어도 들어와야 한다.
  //   `basics.js` 가 `from` 이 지난 것만 내주므로, 그 주가 오면 여기 목록이 늘어난다.
  //   ⛔ 이 줄이 없으면 8/10 이 돼도 깻잎 세 편이 «영영» 안 들어온다 —
  //      아래 early return 이 그 전에 걸리기 때문이다. (2026-08-03 주차 잠금 넣으며 잡은 함정)
  const opened = basicRecipes.filter((r) => !have.has(r.id) && !dead.has(r.id) && !haveTitles.has(r.title))
  if (v >= BASICS_VERSION) {
    return opened.length
      ? { recipes: [...saved.recipes, ...opened.map((r, i) => ({ ...r, savedAt: Date.now() - i * 60000 }))], seedV: v }
      : { recipes: saved.recipes, seedV: v }
  }
  const add = basicRecipes
    // 같은 제목의 레시피가 이미 있으면 넣지 않는다 (예전 예시의 김치볶음밥 등과 중복 방지)
    .filter((r) => !have.has(r.id) && !dead.has(r.id) && !haveTitles.has(r.title))
    .map((r, i) => ({ ...r, savedAt: Date.now() - i * 60000 }))
  // 기존 기본 레시피에 새 표지 사진 입히기 — 아직 사진이 없는(기본 아이콘) 것만.
  // (사용자가 직접 넣은 사진/커스텀은 건드리지 않는다)
  const withPhotos = saved.recipes.map((r) =>
    r && BASIC_PHOTOS[r.id] && r.thumb !== 'photo' && r.thumb !== 'none' && !r.image
      ? { ...r, thumb: 'photo', image: BASIC_PHOTOS[r.id] }
      : r
  )
  // v7: 기본 레시피 만드는 법 문체를 '~요'체로 통일(사용자 수정 내용은 어미만 다듬어져 보존)
  const polished = withPhotos.map((r) =>
    r && String(r.id).startsWith('basic-') && Array.isArray(r.steps)
      ? { ...r, steps: politeSteps(r.steps) }
      : r
  )
  // v10: '윤남노 스파게티'를 '알리오 올리오'로 이름 변경하고,
  // 겹치는 예전 기본 알리오올리오는 사용자가 안 건드린 경우에만 정리한다.
  let fixed = polished.map((r) =>
    r && r.id === 'basic-yunnamno-spaghetti' && (r.title || '').trim() === '윤남노 스파게티'
      ? { ...r, title: '알리오 올리오' }
      : r
  )
  const hasAlioReplacement = fixed.some((r) => r && r.id === 'basic-yunnamno-spaghetti')
  if (hasAlioReplacement) {
    fixed = fixed.filter(
      (r) => !(r && r.id === 'basic-aglioolio' && r.source === 'hankki' && !r.favorite && !(r.cooked > 0))
    )
  }
  // v11: 팟타이를 '아시안' 카테고리로 이동 (사용자가 안 바꾼 경우에만)
  fixed = fixed.map((r) =>
    r && r.id === 'basic-padthai' && r.category === '양식'
      ? { ...r, category: '아시안', folder: r.folder === '양식' ? '아시안' : r.folder }
      : r
  )
  // v12: 기본 레시피의 '한 그릇'/'한그릇' 태그 정리 + 로제파스타 표지사진을 아이콘으로 되돌리기
  fixed = fixed.map((r) => {
    if (!r || !String(r.id).startsWith('basic-')) return r
    let nr = r
    if (Array.isArray(r.tags) && r.tags.some((t) => t === '한 그릇' || t === '한그릇')) {
      nr = { ...nr, tags: r.tags.filter((t) => t !== '한 그릇' && t !== '한그릇') }
    }
    // 사용자가 직접 넣은 사진이 아니라, 우리가 깔아둔 로제파스타 표지사진만 제거
    if (r.id === 'basic-rosepasta' && r.thumb === 'photo' && String(r.image || '').includes('rosepasta')) {
      nr = { ...nr, thumb: 'icon', image: null }
    }
    return nr
  })
  // v13: 기본 제공 레시피의 '내용'(제목·재료·순서·메모·태그·아이콘·카테고리·표지 등)을
  // 최신 큐레이션으로 다시 맞춘다. 단, 사용자가 직접 편집한 레시피(touched)와
  // 개인 상태(즐겨찾기·요리횟수·꾸미기·직접 넣은 표지사진)는 그대로 보존한다.
  const seedById = new Map(basicRecipes.map((s) => [s.id, s]))
  fixed = fixed.map((r) => {
    if (!r || r.touched || !seedById.has(r.id)) return r
    const s = seedById.get(r.id)
    // 사용자가 직접 넣은 표지사진(우리 recipe-photos 폴더가 아닌 것)은 유지
    const userPhoto = r.thumb === 'photo' && r.image && !String(r.image).includes('/recipe-photos/')
    // 사용자가 꾸민 표지(배경 지우고 꾸미기 얹은 것 = thumb:'none' 또는 스티커·배경 있음)는
    // 시드로 되돌리지 않는다. 안 그러면 BASICS_VERSION 올릴 때마다 꾸민 표지가 날아가고
    // 시드 아이콘이 다시 나타난다. (공심채볶음 등 — 창업자 2026-07-25 제보)
    const decorated =
      r.thumb === 'none' ||
      (Array.isArray(r.decor) && r.decor.length > 0) ||
      (r.decorBg && r.decorBg !== 'none')
    const merged = {
      ...s,
      favorite: r.favorite,
      cooked: r.cooked,
      cookedAt: r.cookedAt,
      savedAt: r.savedAt,
      // 🐛🐛 2026-08-04 — 여기서 «빈 표지» 사고가 났다 (창업자 폰 캡처).
      //   예전엔 `decor: r.decor` 로 **무조건** 유저 값을 얹었다. 유저가 안 꾸민 레시피는
      //   `r.decor` 가 없으니 시드가 들고 온 꾸미기가 **덮여서 사라지고**,
      //   `thumb` 은 시드의 `'none'`(표지 안 그림)이 그대로 남아 **아무것도 없는 칸**이 됐다.
      //   → 레꾸 샘플을 콩국수로 옮긴 v9.59 에서 기존 사용자 전원이 빈 표지를 봤다.
      //   ✅ 유저가 «꾸민 흔적이 있을 때만» 유저 것을 지킨다. 없으면 시드가 들고 온 걸 그대로 쓴다.
      //   ⛔ 「보존」과 「덮어쓰기」는 다르다 — 없는 값으로 덮으면 그건 지우는 것이다.
      decor: decorated ? r.decor : s.decor,
      decorBg: decorated ? r.decorBg : s.decorBg,
      status: r.status || s.status,
    }
    if (userPhoto) { merged.thumb = r.thumb; merged.image = r.image }
    if (decorated && !userPhoto) { merged.thumb = r.thumb }
    return merged
  })
  // v14: '마늘종' → '마늘쫑' 순수 철자 수정 — 사용자가 편집한(touched) 레시피까지 모두 고친다.
  const fixTypo = (str) => (typeof str === 'string' ? str.replace(/마늘종/g, '마늘쫑') : str)
  fixed = fixed.map((r) => {
    if (!r) return r
    const changed =
      fixTypo(r.title) !== r.title ||
      (Array.isArray(r.ingredients) && r.ingredients.some((x) => fixTypo(x) !== x)) ||
      (Array.isArray(r.steps) && r.steps.some((x) => fixTypo(x) !== x)) ||
      fixTypo(r.memo) !== r.memo
    if (!changed) return r
    return {
      ...r,
      title: fixTypo(r.title),
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(fixTypo) : r.ingredients,
      steps: Array.isArray(r.steps) ? r.steps.map(fixTypo) : r.steps,
      memo: fixTypo(r.memo),
    }
  })
  // v31: 편집(touched)한 '기본 레시피'도 양념 표기 재정리(제품명→일반명 + 내 제품은 메모)만큼은
  //      최신 시드에 맞춘다. 재료·메모만 교체(제목·순서·꾸미기·개인상태는 그대로) → 픽카드도 정상 작동.
  //      ※ 재료·메모를 직접 고친 경우엔 그 편집이 시드본으로 덮이지만, 전역 양념 표기 통일을 우선한다.
  fixed = fixed.map((r) => {
    if (!r || !r.touched || !seedById.has(r.id)) return r
    const s = seedById.get(r.id)
    return { ...r, ingredients: s.ingredients, memo: s.memo }
  })
  // v34: 사용자가 직접 만든 레시피(시드 아님)의 아이콘을 새 완성요리 PNG로 업그레이드.
  //      제목에 딱 맞는 PNG가 생긴 경우에만 교체(없으면 기존 아이콘 유지 → 회귀 없음).
  //      사진·이모지·글자 표지, 이미 PNG로 고른 것, 시드(위 v13에서 큐레이션됨)는 건드리지 않는다.
  const isFoodPng = (k) => /^(fh_k|fy_y|fj_c|fi_j|fb_b|fe_)/.test(k || '')
  fixed = fixed.map((r) => {
    if (!r || seedById.has(r.id)) return r
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    if (isFoodPng(r.icon)) return r
    const g = guessFoodIcon(r.title || '')
    return isFoodPng(g) ? { ...r, icon: g } : r
  })
  // v38: 예시 요리 4종을 전용 아이콘으로 '강제' 반영 — 제목으로 매칭, 시드/내레시피/편집(touched) 무관.
  //      (v37에서 basics.js 아이콘을 바꿨지만, 편집했거나 이미 다른 PNG였던 레시피는
  //       위 v13/v34 패스가 건너뛰어 반영이 안 됐다. 표지가 '아이콘'일 때만 교체 — 사진 표지는 보존.)
  // (v39 추가: 로제파스타·치즈샌드위치·새우크림파스타도 전용 아이콘으로. 예전 fy_ 양식 아이콘에서 교체.)
  const ICON_FORCE_V38 = {
    '김치볶음밥': 'fe_20', '요거트 아이스크림': 'fe_19', '크루키': 'fe_17', '불닭냉면': 'fe_18',
    '로제 파스타': 'fe_27', '치즈 샌드위치': 'fe_26', '새우 크림 파스타': 'fe_24',
    '대구뭉티기': 'fe_22', // v41: 기존 레시피였는데 아이콘 교체를 놓쳐 사시미(fi_j09)로 떠 있던 것
    '베이컨 크림 파스타': 'fe_53', '묵은지 들기름 파스타': 'fe_52', // v41: 얼굴 있는 새 파스타 아이콘(옛 faceless fy_y03 대체)
  }
  fixed = fixed.map((r) => {
    if (!r) return r
    const want = ICON_FORCE_V38[(r.title || '').trim()]
    if (!want) return r
    if (r.thumb && r.thumb !== 'icon') return r // 직접 넣은 사진/글자 표지는 안 건드림
    if (r.image && r.thumb !== 'icon') return r
    return r.icon === want ? r : { ...r, icon: want }
  })
  return { recipes: [...fixed, ...add], seedV: BASICS_VERSION }
}

// 예전 버전(OCR 필터 이전)에 저장된 레시피의 '외계어 메모'를 한 번만 청소한다.
// 재료·순서와 겹치는 줄 + 잡음 줄을 걷어낸다. (사용자가 쓴 짧은 메모는 건드리지 않음)
const MEMO_CLEAN_V = 1
function migrateMemos(recipes, saved) {
  if ((saved.memoCleanV || 0) >= MEMO_CLEAN_V) return { recipes, memoCleanV: saved.memoCleanV }
  const cleaned = recipes.map((r) => {
    if (!r || !r.memo) return r
    let memo = cleanMemo(r.memo, r.ingredients || [], r.steps || [])
    // 사진·인스타에서 온 레시피의 메모는 OCR 잡음일 가능성이 높다 —
    // 온전한 한글 단어도, 소문자 영어 단어("overcook")도, 이모지도 없는 줄
    // ("Ta mg TERCERA" 같은 대문자 조각)은 지운다.
    if (r.source === 'photo' || r.source === 'instagram') {
      memo = memo
        .split('\n')
        .filter(
          (l) =>
            !l.trim() ||
            /[가-힣]{2,}/.test(l) ||
            /[a-z]{4,}/.test(l) ||
            /[☀-➿⭐❤\u{1F000}-\u{1FAFF}]/u.test(l) ||
            l.replace(/\s/g, '').length < 4
        )
        .join('\n')
        .trim()
    }
    return memo === r.memo ? r : { ...r, memo }
  })
  return { recipes: cleaned, memoCleanV: MEMO_CLEAN_V }
}

// '만든 횟수(cooked)'는 '만들었어요'가 diary 기록과 항상 짝으로 올린다 → 정상 상태에서 cooked == 그 레시피의 diary 수.
// 예전 버전에서 기록을 지워도 cooked가 안 줄던 버그로 둘이 어긋난 데이터가 남을 수 있어, 로드할 때 diary 수 기준으로 맞춘다.
function reconcileCooked(recipes, diary) {
  const counts = {}
  ;(diary || []).forEach((d) => { if (d && d.recipeId) counts[d.recipeId] = (counts[d.recipeId] || 0) + 1 })
  return recipes.map((r) => {
    const n = counts[r.id] || 0
    return (r.cooked || 0) === n ? r : { ...r, cooked: n }
  })
}

function initialState() {
  const saved = load()
  if (saved) {
    const mig = migrateBasics(saved)
    const memoMig = migrateMemos(mig.recipes, saved)
    const diary = saved.diary || []
    return {
      recipes: reconcileCooked(memoMig.recipes, diary),
      seedV: mig.seedV,
      memoCleanV: memoMig.memoCleanV,
      removedSeedIds: saved.removedSeedIds || [],
      folders: saved.folders
        ? (saved.folders.includes('아시안') ? saved.folders : [...saved.folders, '아시안'])
        : defaultFolders(mig.recipes),
      profile: { ...PROFILE_DEFAULT, ...(saved.profile || {}) },
      shops: migrateShops(saved.shops),
      wishlist: [], // 위시는 장보기로 흡수됨 — 더 이상 별도 목록으로 쓰지 않는다
      shoppingList: foldWishIntoShopping(saved.wishlist, saved.shoppingList || migrateShopping()),
      pantry: saved.pantry || [],
      diary: saved.diary || [],
    }
  }
  return {
    recipes: seedRecipes,
    seedV: BASICS_VERSION,
    memoCleanV: MEMO_CLEAN_V,
    removedSeedIds: [],
    folders: ['한식', '양식', '일식', '간식', '아시안'],
    profile: PROFILE_DEFAULT,
    shops: DEFAULT_SHOPS,
    wishlist: [],
    shoppingList: [],
    pantry: [],
    diary: [],
  }
}

function defaultFolders(recipes) {
  const set = new Set(['한식', '양식', '일식', '간식', '아시안'])
  recipes.forEach((r) => r.folder && set.add(r.folder))
  return [...set]
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      // 저장 날짜 자동 기록 — 상세 화면에 'N월 N일 저장'으로 표시된다.
      const rec = { savedAt: Date.now(), ...action.recipe }
      return { ...state, recipes: [rec, ...state.recipes] }
    }
    case 'update': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      }
    }
    case 'remove': {
      // 기본 제공 레시피를 지우면 기록해 둔다 — 이후 업데이트에서 되살아나지 않게.
      const removedSeedIds = String(action.id).startsWith('basic-')
        ? [...(state.removedSeedIds || []), action.id]
        : state.removedSeedIds || []
      return { ...state, removedSeedIds, recipes: state.recipes.filter((r) => r.id !== action.id) }
    }
    case 'toggleFav': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, favorite: !r.favorite } : r
        ),
      }
    }
    case 'cook': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, cooked: (r.cooked || 0) + 1 } : r
        ),
      }
    }
    case 'addFolder': {
      if (!action.name || state.folders.includes(action.name)) return state
      return { ...state, folders: [...state.folders, action.name] }
    }
    case 'removeFolder': {
      // 폴더만 지운다 — 그 안에 있던 레시피는 카테고리 폴더로 되돌려 유지한다.
      return {
        ...state,
        folders: state.folders.filter((f) => f !== action.name),
        recipes: state.recipes.map((r) =>
          r.folder === action.name ? { ...r, folder: r.category || '' } : r
        ),
      }
    }
    case 'setProfile': {
      return { ...state, profile: { ...state.profile, ...action.patch } }
    }
    case 'clear': {
      // 기본 제공 포함 모든 레시피를 비우고 빈 아카이브로. (장보기·재료함은 유지)
      // 기본 레시피도 '지운 것'으로 기록해 이후 업데이트에서 되살아나지 않게 한다.
      const dead = new Set([...(state.removedSeedIds || []), ...basicRecipes.map((b) => b.id)])
      return { ...state, recipes: [], removedSeedIds: [...dead] }
    }
    case 'reset': {
      // 처음 상태로 — 기본 레시피를 다시 채우므로 삭제 기록도 초기화한다.
      return {
        ...state,
        recipes: seedRecipes,
        seedV: BASICS_VERSION,
        removedSeedIds: [],
        folders: ['한식', '양식', '일식', '간식'],
        profile: PROFILE_DEFAULT,
      }
    }

    // 쇼핑몰 바로가기
    case 'addShop': {
      if (!action.shop?.name || !action.shop?.url) return state
      return { ...state, shops: [...state.shops, action.shop] }
    }
    case 'updateShop': {
      return {
        ...state,
        shops: state.shops.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }
    }
    case 'removeShop': {
      return { ...state, shops: state.shops.filter((s) => s.id !== action.id) }
    }

    // 사고 싶은 재료(위시리스트)
    case 'addWish': {
      return { ...state, wishlist: [action.item, ...state.wishlist] }
    }
    case 'updateWish': {
      return {
        ...state,
        wishlist: state.wishlist.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      }
    }
    case 'toggleWishBought': {
      return {
        ...state,
        wishlist: state.wishlist.map((w) => (w.id === action.id ? { ...w, bought: !w.bought } : w)),
      }
    }
    case 'removeWish': {
      return { ...state, wishlist: state.wishlist.filter((w) => w.id !== action.id) }
    }

    // 장보기 체크리스트
    case 'addShopItems': {
      const existing = new Set(state.shoppingList.map((i) => i.name))
      const add = action.names
        .map((n) => n.trim())
        .filter((n) => n && !existing.has(n))
        .map((n) => ({ id: newId(), name: n, done: false }))
      return { ...state, shoppingList: [...add, ...state.shoppingList] }
    }
    // 단건 담기 — 사러가기 링크(url)를 함께 저장(주부의 장바구니 '담기' 등). 이름 중복은 무시.
    case 'addShopItem': {
      const name = (action.item?.name || '').trim()
      if (!name || state.shoppingList.some((i) => i.name === name)) return state
      const item = { id: newId(), name, done: false, url: action.item.url || undefined }
      return { ...state, shoppingList: [item, ...state.shoppingList] }
    }
    case 'toggleShopItem': {
      // 체크(=샀어요)하면 냉장고 재료함에 자동으로 넣어준다. (중복 이름은 제외)
      const item = state.shoppingList.find((i) => i.id === action.id)
      const nowDone = item && !item.done
      let pantry = state.pantry
      if (nowDone && item && !pantry.some((p) => p.name === item.name)) {
        pantry = [{ id: newId(), name: item.name, icon: null, expiry: null, addedAt: Date.now() }, ...pantry]
      }
      return {
        ...state,
        shoppingList: state.shoppingList.map((i) =>
          i.id === action.id ? { ...i, done: !i.done } : i
        ),
        pantry,
      }
    }
    case 'removeShopItem': {
      return { ...state, shoppingList: state.shoppingList.filter((i) => i.id !== action.id) }
    }
    case 'clearDoneShopItems': {
      return { ...state, shoppingList: state.shoppingList.filter((i) => !i.done) }
    }
    case 'clearShopItemsAll': {
      return { ...state, shoppingList: [] }
    }

    // 냉장고 재료함(재고)
    case 'addPantry': {
      return { ...state, pantry: [action.item, ...state.pantry] }
    }
    case 'updatePantry': {
      return {
        ...state,
        pantry: state.pantry.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      }
    }
    case 'removePantry': {
      return { ...state, pantry: state.pantry.filter((p) => p.id !== action.id) }
    }

    // 요리 일지 — 저장한 레시피에 연결된 기록(별점·팁·사진). '만들었어요'가 항목을 만든다.
    case 'addDiary': {
      return { ...state, diary: [action.entry, ...state.diary] }
    }
    case 'updateDiary': {
      return {
        ...state,
        diary: state.diary.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      }
    }
    case 'removeDiary': {
      // 기록을 지우면 그 레시피의 '만든 횟수'도 함께 1 줄인다.
      // (cooked는 '만들었어요'가 diary 항목과 항상 짝으로 올리므로, 지울 때도 짝으로 내려 어긋나지 않게 한다)
      const gone = state.diary.find((d) => d.id === action.id)
      return {
        ...state,
        diary: state.diary.filter((d) => d.id !== action.id),
        recipes: gone
          ? state.recipes.map((r) =>
              r.id === gone.recipeId ? { ...r, cooked: Math.max(0, (r.cooked || 0) - 1) } : r
            )
          : state.recipes,
      }
    }

    // 백업 불러오기 — 저장된 데이터로 전체 교체(기본값과 병합해 누락 방지)
    case 'importAll': {
      const d = action.data || {}
      if (!Array.isArray(d.recipes)) return state
      return {
        seedV: Math.max(state.seedV || 0, d.seedV || 0, BASICS_VERSION),
        memoCleanV: Math.max(state.memoCleanV || 0, d.memoCleanV || 0),
        removedSeedIds: d.removedSeedIds || state.removedSeedIds || [],
        recipes: d.recipes,
        folders: d.folders || defaultFolders(d.recipes),
        profile: { ...PROFILE_DEFAULT, ...(d.profile || {}) },
        shops: d.shops || DEFAULT_SHOPS,
        wishlist: [], // 위시는 장보기로 흡수 — 백업 복원 시에도 합쳐서 불러온다
        shoppingList: foldWishIntoShopping(d.wishlist, d.shoppingList || []),
        pantry: d.pantry || [],
        diary: d.diary || [],
      }
    }

    default:
      return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // 저장 공간 초과(특히 iOS ~5MB) — 조용히 사라지면 안 되므로(핵심 약속: 레시피 보관)
      // 사용자에게 알린다. 매 변경마다 반복되지 않게 60초에 한 번만.
      const now = Date.now()
      if (now - lastFullWarn > 60000) {
        lastFullWarn = now
        try { window.dispatchEvent(new CustomEvent('hankki:storagefull')) } catch { /* noop */ }
      }
    }
  }, [state])

  const api = {
    ...state,
    addRecipe: useCallback((recipe) => dispatch({ type: 'add', recipe }), []),
    updateRecipe: useCallback((id, patch) => dispatch({ type: 'update', id, patch }), []),
    removeRecipe: useCallback((id) => dispatch({ type: 'remove', id }), []),
    toggleFavorite: useCallback((id) => dispatch({ type: 'toggleFav', id }), []),
    cook: useCallback((id) => dispatch({ type: 'cook', id }), []),
    addFolder: useCallback((name) => dispatch({ type: 'addFolder', name }), []),
    removeFolder: useCallback((name) => dispatch({ type: 'removeFolder', name }), []),
    setProfile: useCallback((patch) => dispatch({ type: 'setProfile', patch }), []),
    clearAll: useCallback(() => dispatch({ type: 'clear' }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
    addShop: useCallback((shop) => dispatch({ type: 'addShop', shop }), []),
    updateShop: useCallback((id, patch) => dispatch({ type: 'updateShop', id, patch }), []),
    removeShop: useCallback((id) => dispatch({ type: 'removeShop', id }), []),
    addWish: useCallback((item) => dispatch({ type: 'addWish', item }), []),
    updateWish: useCallback((id, patch) => dispatch({ type: 'updateWish', id, patch }), []),
    toggleWishBought: useCallback((id) => dispatch({ type: 'toggleWishBought', id }), []),
    removeWish: useCallback((id) => dispatch({ type: 'removeWish', id }), []),
    addShopItems: useCallback((names) => dispatch({ type: 'addShopItems', names }), []),
    addShopItem: useCallback((item) => dispatch({ type: 'addShopItem', item }), []),
    toggleShopItem: useCallback((id) => dispatch({ type: 'toggleShopItem', id }), []),
    removeShopItem: useCallback((id) => dispatch({ type: 'removeShopItem', id }), []),
    clearDoneShopItems: useCallback(() => dispatch({ type: 'clearDoneShopItems' }), []),
    clearShopItemsAll: useCallback(() => dispatch({ type: 'clearShopItemsAll' }), []),
    addPantry: useCallback((item) => dispatch({ type: 'addPantry', item }), []),
    updatePantry: useCallback((id, patch) => dispatch({ type: 'updatePantry', id, patch }), []),
    removePantry: useCallback((id) => dispatch({ type: 'removePantry', id }), []),
    addDiary: useCallback((entry) => dispatch({ type: 'addDiary', entry }), []),
    updateDiary: useCallback((id, patch) => dispatch({ type: 'updateDiary', id, patch }), []),
    removeDiary: useCallback((id) => dispatch({ type: 'removeDiary', id }), []),
    importAll: useCallback((data) => dispatch({ type: 'importAll', data }), []),
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// 새 레시피 id 생성 — Date.now 는 브라우저 런타임에서 사용 가능
export function newId() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
