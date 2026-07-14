import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { seedRecipes } from './data/seed'
import { basicRecipes, BASICS_VERSION } from './data/basics'
import { cleanMemo } from './parseRecipe'
import { politeSteps } from './polish'

const KEY = 'hankki:v1'
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
  { id: 'hansalim', name: '한살림', icon: 'sprout', iconType: 'icon', url: 'https://shop.hansalim.or.kr/shopping/spMain.do', search: 'https://shop.hansalim.or.kr/shopping/spMain.do' },
]

function migrateShopping() {
  try {
    return JSON.parse(localStorage.getItem('hankki:shopping')) || []
  } catch {
    return []
  }
}

// 기존 사용자의 기본 쇼핑몰(예전 알록달록 이모지)을 새 커스텀 아이콘으로 업그레이드.
// 예전 데이터는 iconType 필드가 아예 없고 emoji 만 있었다({id,name,emoji}). 그래서
// iconType 이 없거나('emoji' 이하) 인 경우 모두 아이콘으로 올린다. 사용자가 직접
// '아이콘'/'글자'로 바꾼 것(iconType==='icon'|'label')은 존중해 건드리지 않는다.
const SHOP_ICON_UPGRADE = { coupang: 'box', kurly: 'bag', ssg: 'cart', naver: 'store', oasis: 'basket' }
function migrateShops(shops) {
  if (!Array.isArray(shops) || shops.length === 0) return DEFAULT_SHOPS
  return shops.map((s) =>
    SHOP_ICON_UPGRADE[s.id] && s.iconType !== 'icon' && s.iconType !== 'label'
      ? { ...s, iconType: 'icon', icon: SHOP_ICON_UPGRADE[s.id] }
      : s
  )
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
  if (v >= BASICS_VERSION) return { recipes: saved.recipes, seedV: v }
  const have = new Set(saved.recipes.map((r) => r.id))
  const haveTitles = new Set(saved.recipes.map((r) => (r.title || '').trim()))
  const dead = new Set(saved.removedSeedIds || [])
  const add = basicRecipes
    // 같은 제목의 레시피가 이미 있으면 넣지 않는다 (예전 예시의 김치볶음밥 등과 중복 방지)
    .filter((r) => !have.has(r.id) && !dead.has(r.id) && !haveTitles.has(r.title))
    .map((r, i) => ({ ...r, savedAt: Date.now() - i * 60000 }))
  // 기존 기본 레시피에 새 표지 사진 입히기 — 아직 사진이 없는(기본 아이콘) 것만.
  // (사용자가 직접 넣은 사진/커스텀은 건드리지 않는다)
  const withPhotos = saved.recipes.map((r) =>
    r && BASIC_PHOTOS[r.id] && r.thumb !== 'photo' && !r.image
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
    const merged = {
      ...s,
      favorite: r.favorite,
      cooked: r.cooked,
      cookedAt: r.cookedAt,
      savedAt: r.savedAt,
      decor: r.decor,
      status: r.status || s.status,
    }
    if (userPhoto) { merged.thumb = r.thumb; merged.image = r.image }
    return merged
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

function initialState() {
  const saved = load()
  if (saved) {
    const mig = migrateBasics(saved)
    const memoMig = migrateMemos(mig.recipes, saved)
    return {
      recipes: memoMig.recipes,
      seedV: mig.seedV,
      memoCleanV: memoMig.memoCleanV,
      removedSeedIds: saved.removedSeedIds || [],
      folders: saved.folders
        ? (saved.folders.includes('아시안') ? saved.folders : [...saved.folders, '아시안'])
        : defaultFolders(mig.recipes),
      profile: { ...PROFILE_DEFAULT, ...(saved.profile || {}) },
      shops: migrateShops(saved.shops),
      wishlist: saved.wishlist || [],
      shoppingList: saved.shoppingList || migrateShopping(),
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
      return { ...state, diary: state.diary.filter((d) => d.id !== action.id) }
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
        wishlist: d.wishlist || [],
        shoppingList: d.shoppingList || [],
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
      /* 저장 공간 초과 등은 조용히 무시 */
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
