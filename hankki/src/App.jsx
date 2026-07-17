import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { consumeSharedIntake, detectSource, firstUrl, captionFrom, firstLine } from './shareIntake'
import { makeInboxRecipe } from './screens/ImportScreen'
import { ocrImage } from './ocr'
import { parseRecipeText } from './parseRecipe'
import { guessCategory } from './utils'
import BottomNav from './components/BottomNav'
import TimerBar from './components/TimerBar'
import ConfirmSheet from './components/ConfirmSheet'
import Onboarding, { needsOnboarding } from './components/Onboarding'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import MyRecipesScreen from './screens/MyRecipesScreen'
import ShopScreen from './screens/ShopScreen'
import ProfileScreen from './screens/ProfileScreen'
import ImportScreen from './screens/ImportScreen'
import RecipeDetailScreen from './screens/RecipeDetailScreen'
import EditorScreen from './screens/EditorScreen'
import InboxScreen from './screens/InboxScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import CookedScreen from './screens/CookedScreen'
import CookScreen from './screens/CookScreen'

// '일지'는 레시피 탭의 '요리 기록' 세그먼트로 합쳐졌다.
const TABS = { home: HomeScreen, search: SearchScreen, myrecipes: MyRecipesScreen, shop: ShopScreen, profile: ProfileScreen }

// --- 아주 가벼운 내비게이션 스택 + 토스트 ---
const NavCtx = createContext(null)
export const useNav = () => useContext(NavCtx)

export default function App() {
  // 새로고침(앱 업데이트·실수로 당겨서 새로고침 등)이 나도 보던 탭으로 돌아오도록 기억해 둔다.
  const [tab, setTab] = useState(() => {
    try {
      const t = sessionStorage.getItem('hankki:tab') || 'home'
      if (t === 'diary') return 'myrecipes' // 일지 탭 통합 이전에 저장된 값 호환
      return TABS[t] ? t : 'home'
    } catch { return 'home' }
  })
  const [stack, setStack] = useState([]) // 위로 쌓이는 화면들
  const [toast, setToast] = useState(null)
  const [exitAsk, setExitAsk] = useState(false) // 홈에서 뒤로가기 → 종료 확인 팝업
  const [onboard, setOnboard] = useState(() => needsOnboarding()) // 첫 실행 앱 소개
  const backHandlers = useRef([]) // 화면들이 등록한 '뒤로가기 먼저 처리' 핸들러
  const suppressPop = useRef(0) // popAll 이 history.go(-n) 로 만든 popstate 무시용
  const toastTimer = useRef(null)
  const tabRef = useRef(tab)
  const stackRef = useRef(stack)
  const onboardRef = useRef(onboard)
  tabRef.current = tab
  stackRef.current = stack
  onboardRef.current = onboard

  useEffect(() => {
    try { sessionStorage.setItem('hankki:tab', tab) } catch { /* noop */ }
  }, [tab])

  // 화면을 열 때마다 브라우저 히스토리에도 한 칸 쌓는다 → 제스처(스와이프) 뒤로가기가
  // 트랩 한 칸을 넘어 '앱 종료'로 새는 걸 막는다. (버튼·스와이프 모두 popstate 한 곳에서 처리)
  const push = useCallback((screen) => {
    setStack((s) => [...s, screen])
    try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
  }, [])
  // 화면 안 화살표(뒤로) 버튼도 브라우저 뒤로가기로 통일 → 버튼/스와이프 동작 일치.
  const pop = useCallback(() => {
    try { history.back() } catch { setStack((s) => s.slice(0, -1)) }
  }, [])
  // 스택 전체 닫기: 쌓아둔 히스토리 칸 수만큼 한 번에 되돌린다(그 popstate 들은 무시).
  const popAll = useCallback(() => {
    const n = stackRef.current.length
    setStack([])
    if (n > 0) { suppressPop.current += n; try { history.go(-n) } catch { /* noop */ } }
  }, [])
  // 화면이 '뒤로가기'를 먼저 가로채도록 등록. 최근 등록(=가장 위 레이어)만 물어본다.
  const registerBack = useCallback((fn) => {
    backHandlers.current.push(fn)
    return () => { backHandlers.current = backHandlers.current.filter((h) => h !== fn) }
  }, [])
  const go = useCallback((t) => {
    setStack([])
    setTab(t)
  }, [])

  // 안드로이드 '뒤로가기'가 앱을 바로 종료시키지 않도록: 열린 화면을 닫고,
  // 탭이면 홈으로. (히스토리 트랩을 유지해 갑작스런 종료 방지)
  useEffect(() => {
    const hasTrap = () => !!(history.state && history.state.hankki)
    const trap = () => { try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ } }
    if (!hasTrap()) trap() // index.html 이 이미 깔았으면 중복 안 함
    const onPop = () => {
      // 0) popAll 이 history.go(-n) 로 만든 이벤트는 무시(화면은 이미 닫힘)
      if (suppressPop.current > 0) { suppressPop.current -= 1; return }
      // 1) 온보딩(첫 실행 소개)이 떠 있으면 뒤로가기로 종료팝업이 뜨지 않게 가둔다.
      if (onboardRef.current) { trap(); return }
      // 2) 가장 위 화면이 내부 상태(하위 패널·필터 등)를 먼저 닫는다.
      //    소비했으면 버퍼를 다시 채워 다음 뒤로가기가 종료로 새지 않게.
      const hs = backHandlers.current
      if (hs.length) {
        try { if (hs[hs.length - 1]()) { trap(); return } } catch { /* noop */ }
      }
      // 3) 열린 화면 닫기(그 화면이 쌓아둔 히스토리 한 칸을 방금 소비함 → 재보충 불필요)
      if (stackRef.current.length > 0) { setStack((s) => s.slice(0, -1)); return }
      // 4) 다른 탭이면 홈으로(탭은 트랩 1칸 기반) → 트랩 다시 채움
      if (tabRef.current !== 'home') { setTab('home'); trap(); return }
      // 5) 홈에서 뒤로 → 종료 확인(트랩 다시 채워 실제 종료 방지)
      trap()
      setExitAsk(true)
    }
    // 앱으로 되돌아왔을 때(다른 앱 갔다 오기 등) 트랩이 사라졌으면 다시 깐다
    const onShow = () => { if (stackRef.current.length === 0 && !hasTrap()) trap() }
    window.addEventListener('popstate', onPop)
    window.addEventListener('pageshow', onShow)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])

  // 새 버전으로 업데이트돼 새로고침된 직후 — 최신임을 한 번 알려준다(캐시 혼란 방지).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('hankki:updated')) {
        sessionStorage.removeItem('hankki:updated')
        setTimeout(() => showToast('✨ 최신 버전으로 업데이트됐어요'), 600)
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = useCallback((msg, ms = 1900) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }, [])

  // '공유받기' — 인스타/갤러리에서 한끼로 공유된 링크·사진을 앱 시작 시 받아 Inbox 로.
  const store = useStore()
  useEffect(() => {
    let cancelled = false
    consumeSharedIntake().then(async (data) => {
      if (cancelled || !data) return
      const link = firstUrl(data.url, data.text)
      const caption = captionFrom(data.text)
      // 공유된 텍스트(캡션)에 레시피 내용이 있으면 파싱해 재료·순서까지 채운다.
      const parsed = caption && caption.replace(/\s/g, '').length > 15 ? parseRecipeText(caption) : null
      const source = data.imageDataUrl ? 'photo' : detectSource(link, data.text)
      const title =
        (data.title || '').trim() ||
        (parsed && parsed.title) ||
        firstLine(caption) ||
        (data.imageDataUrl ? '사진 레시피' : '공유된 레시피')
      // 메모는 직접 입력 전용 — 캡션 찌꺼기를 자동으로 붙이지 않는다
      const rec = makeInboxRecipe({
        source,
        title,
        sourceUrl: link,
        image: data.imageDataUrl || null,
      })
      if (parsed && (parsed.ingredients.length || parsed.steps.length)) {
        rec.ingredients = parsed.ingredients
        rec.steps = parsed.steps
      }
      store.addRecipe(rec)
      setStack([{ name: 'inbox' }])
      showToast(
        data.imageDataUrl ? '사진을 담았어요 · 글자 읽는 중…' : '공유한 레시피를 Inbox에 담았어요'
      )
      if (typeof history !== 'undefined' && location.search) {
        history.replaceState(null, '', location.pathname)
      }
      // 공유된 사진이면 글자를 읽어 재료·순서를 자동으로 채운다.
      if (data.imageDataUrl) {
        const text = await ocrImage(data.imageDataUrl)
        if (cancelled || !text.trim()) return
        const r = parseRecipeText(text, { fromOcr: true })
        store.updateRecipe(rec.id, {
          title: rec.title && rec.title !== '사진 레시피' ? rec.title : r.title || rec.title,
          ingredients: r.ingredients,
          steps: r.steps, // 메모는 건드리지 않는다 — 직접 입력 전용
          category: guessCategory((r.title || '') + ' ' + r.memo),
        })
        showToast('사진에서 글자를 읽어 채웠어요 ✨')
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showOnboarding = useCallback(() => setOnboard(true), [])
  const nav = { push, pop, popAll, go, showToast, tab, setTab, registerBack, showOnboarding }

  const TabScreen = TABS[tab]
  const top = stack[stack.length - 1]

  return (
    <NavCtx.Provider value={nav}>
      <div className="app-frame">
        <div key={tab} className="screen fade">
          <TabScreen />
        </div>

        {stack.map((s, i) => (
          <StackLayer key={i}>{renderScreen(s)}</StackLayer>
        ))}

        {!top && <BottomNav active={tab} onChange={go} onImport={() => push({ name: 'import' })} />}
        <TimerBar bottom={top ? 'calc(84px + var(--safe-bottom))' : 'calc(66px + var(--safe-bottom))'} />
        {toast && <div className="toast">{toast}</div>}

        {exitAsk && (
          <ConfirmSheet
            title="한끼 나가기"
            message="한끼를 나갈까요?"
            confirmLabel="나가기"
            onConfirm={() => {
              setExitAsk(false)
              // 브라우저로 열었으면 창을 닫아준다. 설치형 PWA는 브라우저 정책상
              // 스스로 못 닫으니(안드로이드), 홈 버튼으로 나가면 된다고 솔직히 알려준다.
              try { window.close() } catch { /* noop */ }
              showToast('나가려면 폰 홈 버튼을 눌러주세요 🙂 (앱은 스스로 못 닫아요)')
            }}
            onClose={() => setExitAsk(false)}
          />
        )}

        {onboard && <Onboarding onDone={() => setOnboard(false)} />}
      </div>
    </NavCtx.Provider>
  )
}

function StackLayer({ children }) {
  return (
    <div
      className="stack-layer"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.26s cubic-bezier(0.22,0.61,0.36,1) both',
      }}
    >
      {children}
    </div>
  )
}

function renderScreen(s) {
  switch (s.name) {
    case 'import':
      return <ImportScreen />
    case 'detail':
      return <RecipeDetailScreen id={s.id} />
    case 'editor':
      return <EditorScreen id={s.id} prefill={s.prefill} />
    case 'inbox':
      return <InboxScreen />
    case 'favorites':
      return <FavoritesScreen />
    case 'cooked':
      return <CookedScreen />
    case 'cook':
      return <CookScreen id={s.id} />
    default:
      return null
  }
}
