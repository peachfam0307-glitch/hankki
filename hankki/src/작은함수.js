// 📏 [2026-11-10 본체 나누기] 화면 파일 안에 있던 «작은 함수»를 여기로 뺐다.
//   ⛔ 왜 = App·홈이 이 함수 하나 때문에 화면 «통째로»(Onboarding 169KB · ImportScreen 55KB)를 본체로 끌고 왔다.
//   ✅ 화면은 lazy 로 열 때 받고, 첫 화면이 쓰는 작은 것만 여기서 본체에 남는다.
//   📄 docs/앱본체-크기벽-설계-2026-11-10.md
import { newId } from './store'
import { guessCategory } from './utils'
import { guessFoodIcon } from './components/FoodIcon'

// 처음 실행 안내(Onboarding) — 봤나
export const ONBOARD_KEY = 'hankki:onboarded'
export function needsOnboarding() {
  try { return localStorage.getItem(ONBOARD_KEY) !== '1' } catch { return false }
}
export function markOnboarded() {
  try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* noop */ }
}

// 받은편지함에 넣을 빈 레시피 한 장(가져오기·공유받기)
export function makeInboxRecipe({ source, title, sourceUrl = '', image = null, category, memo = '' }) {
  return {
    id: newId(), title, thumb: 'icon', icon: guessFoodIcon(title), emoji: '🍽️', image, source,
    category: category || guessCategory(title + ' ' + memo),
    tags: [], time: 0, servings: 0, difficulty: '', ingredients: [], steps: [], memo, sourceUrl,
    status: 'unsorted', folder: null, favorite: false, cooked: 0, savedAt: Date.now(),
  }
}
