import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { consumeSharedIntake, detectSource, firstUrl, captionFrom, firstLine } from './shareIntake'
import { makeInboxRecipe } from './screens/ImportScreen'
import { ocrImage } from './ocr'
import { parseRecipeText } from './parseRecipe'
import { guessCategory } from './utils'
import BottomNav from './components/BottomNav'
import TimerBar from './components/TimerBar'
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
import ShoppingScreen from './screens/ShoppingScreen'
import CookScreen from './screens/CookScreen'

const TABS = { home: HomeScreen, search: SearchScreen, myrecipes: MyRecipesScreen, shop: ShopScreen, profile: ProfileScreen }

// --- 아주 가벼운 내비게이션 스택 + 토스트 ---
const NavCtx = createContext(null)
export const useNav = () => useContext(NavCtx)

export default function App() {
  const [tab, setTab] = useState('home')
  const [stack, setStack] = useState([]) // 위로 쌓이는 화면들
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const push = useCallback((screen) => setStack((s) => [...s, screen]), [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  const popAll = useCallback(() => setStack([]), [])
  const go = useCallback((t) => {
    setStack([])
    setTab(t)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  // '공유받기' — 인스타/갤러리에서 한끼로 공유된 링크·사진을 앱 시작 시 받아 Inbox 로.
  const store = useStore()
  useEffect(() => {
    let cancelled = false
    consumeSharedIntake().then(async (data) => {
      if (cancelled || !data) return
      const link = firstUrl(data.url, data.text)
      const caption = captionFrom(data.text)
      const source = data.imageDataUrl ? 'photo' : detectSource(link, data.text)
      const title =
        (data.title || '').trim() ||
        firstLine(caption) ||
        (data.imageDataUrl ? '사진 레시피' : '공유된 레시피')
      const rec = makeInboxRecipe({
        source,
        title,
        sourceUrl: link,
        image: data.imageDataUrl || null,
        memo: caption && caption !== title ? caption : '',
      })
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
        const r = parseRecipeText(text)
        store.updateRecipe(rec.id, {
          title: rec.title && rec.title !== '사진 레시피' ? rec.title : r.title || rec.title,
          ingredients: r.ingredients,
          steps: r.steps,
          memo: r.memo,
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

  const nav = { push, pop, popAll, go, showToast, tab, setTab }

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

        {!top && <BottomNav active={tab} onChange={go} />}
        <TimerBar bottom={top ? 'calc(84px + var(--safe-bottom))' : 'calc(66px + var(--safe-bottom))'} />
        {toast && <div className="toast">{toast}</div>}
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
    case 'shopping':
      return <ShoppingScreen />
    case 'cook':
      return <CookScreen id={s.id} />
    default:
      return null
  }
}
