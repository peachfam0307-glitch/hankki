import { createContext, useCallback, useContext, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import MyRecipesScreen from './screens/MyRecipesScreen'
import DiaryScreen from './screens/DiaryScreen'
import ProfileScreen from './screens/ProfileScreen'
import ImportScreen from './screens/ImportScreen'
import RecipeDetailScreen from './screens/RecipeDetailScreen'
import EditorScreen from './screens/EditorScreen'
import InboxScreen from './screens/InboxScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import CookedScreen from './screens/CookedScreen'
import ShoppingScreen from './screens/ShoppingScreen'

const TABS = { home: HomeScreen, search: SearchScreen, myrecipes: MyRecipesScreen, diary: DiaryScreen, profile: ProfileScreen }

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
    default:
      return null
  }
}
