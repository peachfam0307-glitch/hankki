import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { seedRecipes } from './data/seed'

const KEY = 'hankki:v1'
const PROFILE_DEFAULT = { name: '한끼러버', bio: '맛있는 한 끼로 행복한 하루 :)' }

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

function initialState() {
  const saved = load()
  if (saved) {
    return {
      recipes: saved.recipes,
      folders: saved.folders || defaultFolders(saved.recipes),
      profile: { ...PROFILE_DEFAULT, ...(saved.profile || {}) },
    }
  }
  return {
    recipes: seedRecipes,
    folders: ['한식', '양식', '일식', '간식'],
    profile: PROFILE_DEFAULT,
  }
}

function defaultFolders(recipes) {
  const set = new Set(['한식', '양식', '일식', '간식'])
  recipes.forEach((r) => r.folder && set.add(r.folder))
  return [...set]
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      return { ...state, recipes: [action.recipe, ...state.recipes] }
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
      return { ...state, recipes: state.recipes.filter((r) => r.id !== action.id) }
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
    case 'setProfile': {
      return { ...state, profile: { ...state.profile, ...action.patch } }
    }
    case 'clear': {
      // 예시(시드) 포함 모든 레시피를 비우고 빈 아카이브로.
      return { ...state, recipes: [] }
    }
    case 'reset': {
      return {
        recipes: seedRecipes,
        folders: ['한식', '양식', '일식', '간식'],
        profile: PROFILE_DEFAULT,
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
    setProfile: useCallback((patch) => dispatch({ type: 'setProfile', patch }), []),
    clearAll: useCallback(() => dispatch({ type: 'clear' }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
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
