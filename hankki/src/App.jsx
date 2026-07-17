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
  const backHandlers = useRef([]) // 화면들이 등록한 '뒤로가기 먼저 처리' 핸들러(비모달 상태·필터용)
  const modalLayers = useRef([]) // 열려 있는 모달·오버레이(각자 진짜 히스토리 칸 1개 소유)
  const pendingBack = useRef(0) // 같은 틱에 버튼으로 동시에 닫힌 모달 칸 수(한 번에 go(-n))
  const backScheduled = useRef(false)
  const suppressPop = useRef(0) // popAll·모달버튼닫기 가 만든 popstate 무시용
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
    // 열려 있던 모달도 함께 정리(각자 히스토리 칸 소유) — 정리자가 back() 을 또 부르지 않게 표시.
    const modals = modalLayers.current
    modals.forEach((l) => { l.consumed = true })
    const n = stackRef.current.length + modals.length
    modalLayers.current = []
    setStack([])
    // history.go(-n) 은 여러 칸을 한 번에 되돌려도 popstate 를 '딱 한 번'만 쏜다 → 항상 1만 억제.
    if (n > 0) { suppressPop.current += 1; try { history.go(-n) } catch { /* noop */ } }
  }, [])
  // 화면이 '뒤로가기'를 먼저 가로채도록 등록. 최근 등록(=가장 위 레이어)만 물어본다.
  const registerBack = useCallback((fn, opts) => {
    // tabLevel 핸들러(탭 화면의 내부 상태)는 위에 스택 화면이 있으면 잠재운다 — 아래 onPop 참고.
    const entry = { fn, tab: !!(opts && opts.tabLevel) }
    backHandlers.current.push(entry)
    return () => { backHandlers.current = backHandlers.current.filter((h) => h !== entry) }
  }, [])
  // 모달·오버레이 전용: 열 때(사용자 터치 시점) 진짜 히스토리 칸을 쌓는다 → gesture-backed 라
  // 크롬의 history intervention(터치 없이 만든 pushState 칸을 뒤로가기 때 건너뜀)에 안 걸린다.
  // 뒤로가기(popstate)는 이 칸을 소비만 하고 '다시 채우지 않는' 게 핵심(재종료 버그 근본 해결).
  const openModal = useCallback((close) => {
    const layer = { close, consumed: false }
    try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
    modalLayers.current.push(layer)
    return () => {
      const i = modalLayers.current.indexOf(layer)
      if (i >= 0) modalLayers.current.splice(i, 1)
      // 뒤로가기가 아니라 닫기 버튼·선택으로 닫혔으면, 쌓아둔 히스토리 칸을 되돌려 소비.
      // 겹친 모달이 같은 틱에 여러 개 닫히면(예: 아바타 시트 안 픽커 선택 → 둘 다 닫힘)
      // history.back() 을 동기로 여러 번 부르면 어긋나므로, 한 틱에 모아 go(-n) 한 번으로 처리.
      if (!layer.consumed) {
        pendingBack.current += 1
        if (!backScheduled.current) {
          backScheduled.current = true
          queueMicrotask(() => {
            const n = pendingBack.current
            pendingBack.current = 0
            backScheduled.current = false
            if (n > 0) { suppressPop.current += 1; try { history.go(-n) } catch { /* noop */ } }
          })
        }
      }
    }
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
      // 0) popAll·모달버튼닫기 가 history.go/back 으로 만든 이벤트는 무시(화면은 이미 닫힘)
      //    마지막 하나를 소비한 뒤 홈 바닥에 트랩이 없으면 보충(홈 뒤로가기 종료 방지).
      if (suppressPop.current > 0) { suppressPop.current -= 1; return }
      // 1) 온보딩(첫 실행 소개)이 떠 있으면 뒤로가기로 종료팝업이 뜨지 않게 가둔다.
      if (onboardRef.current) { trap(); return }
      // 1.5) 모달·오버레이(꾸미기·미리보기·시트·픽커 등)가 열려 있으면 최상위 하나만 닫는다.
      //      이 칸은 열 때 gesture-backed 로 쌓였고 방금 popstate 로 소비됐으니 '다시 채우지 않는다'.
      //      (popstate 안 gesture-less pushState 가 사라져 크롬 intervention 재종료 버그를 근본 제거)
      if (modalLayers.current.length > 0) {
        const layer = modalLayers.current.pop()
        layer.consumed = true
        try { layer.close() } catch { /* noop */ }
        return
      }
      // 2) 그 밖의 화면 내부 상태(필터·세그먼트 등)를 위에서부터 처리한다.
      //    하나라도 소비하면 버퍼를 다시 채워 다음 뒤로가기가 종료로 새지 않게.
      //    (겹친 시트·픽커가 각자 핸들러를 등록해도 순서대로 조합되도록 전체를 훑는다)
      const hs = backHandlers.current
      const underStack = stackRef.current.length > 0
      for (let k = hs.length - 1; k >= 0; k -= 1) {
        // 탭 화면 핸들러는 위에 스택 화면(상세·요리 등)이 있으면 건너뛴다.
        // (그 뒤로가기는 스택 화면 것 → 안 그러면 밑에 깔린 탭이 back 을 가로채 상세가 안 닫힘)
        if (hs[k].tab && underStack) continue
        try { if (hs[k].fn()) { trap(); return } } catch { /* noop */ }
      }
      // 3) 열린 스택 화면 닫기. (그 화면이 쌓아둔 gesture-backed 칸을 방금 소비함)
      if (stackRef.current.length > 0) { setStack((s) => s.slice(0, -1)); return }
      // 4) 다른 탭이면 홈으로. (루트 종료 방지는 아래 pointerdown 가드가 담당)
      if (tabRef.current !== 'home') { setTab('home'); return }
      // 5) 홈에서 뒤로 → 종료 확인.
      setExitAsk(true)
    }
    // 앱으로 되돌아왔을 때(다른 앱 갔다 오기 등) 트랩이 사라졌으면 다시 깐다
    const onShow = () => { if (stackRef.current.length === 0 && !hasTrap()) trap() }
    // ⭐ 핵심: 루트(홈/탭, 열린 화면·모달 없음)에서 사용자가 화면을 터치할 때마다
    // '가드' 히스토리 칸을 하나 유지한다. 터치와 함께 만들어져 gesture-backed 라,
    // 깐깐한 크롬(intervention)도 이 칸을 건너뛰지 않는다 → 홈 뒤로가기가 앱을 바로
    // 종료시키지 않고 종료 확인/홈 이동으로 이어진다. (터치 없이 심는 트랩의 한계 극복)
    const ensureGuard = () => {
      if (stackRef.current.length === 0 && modalLayers.current.length === 0 &&
          !(history.state && history.state.guard)) {
        try { history.pushState({ hankki: 1, guard: 1 }, '') } catch { /* noop */ }
      }
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('pageshow', onShow)
    window.addEventListener('pointerdown', ensureGuard, true)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('pageshow', onShow)
      window.removeEventListener('pointerdown', ensureGuard, true)
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

  // 저장 공간이 가득 차서 저장이 실패하면(특히 iOS ~5MB) 조용히 사라지지 않게 알린다.
  useEffect(() => {
    const onFull = () => showToast('⚠️ 저장 공간이 가득 찼어요 · 설정에서 백업 후 오래된 사진을 정리해 주세요', 5000)
    window.addEventListener('hankki:storagefull', onFull)
    return () => window.removeEventListener('hankki:storagefull', onFull)
  }, [showToast])

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
      // inbox 레이어에 해당하는 히스토리 칸(트랩)을 보충 — 없으면 뒤로가기가 base 트랩을 대신
      // 소비해 다음 back 이 앱 종료로 샜다. (공유로 앱을 처음 열었을 때 경로)
      try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
      showToast(
        data.imageDataUrl ? '사진을 담았어요 · 글자 읽는 중…' : '공유한 레시피를 Inbox에 담았어요'
      )
      if (typeof history !== 'undefined' && location.search) {
        history.replaceState({ hankki: 1 }, '', location.pathname) // URL 만 정리, 트랩 표식은 유지
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
  const nav = { push, pop, popAll, go, showToast, tab, setTab, registerBack, openModal, showOnboarding }

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
