// 🎣 명절 컷을 «철일 때만» 받아 온다.
//   ⛔ 철이 아니면 `import()` 를 아예 안 부른다 → 그 유저는 0 바이트.
//   ⚠️ 자정에 철이 바뀌어도 켜둔 앱은 안 바뀐다 → 화면이 다시 보일 때 다시 잰다.
import { useEffect, useState } from 'react'
import { 이번명절 } from '../data/seasonDecor.js'

export function useSeasonCuts() {
  const [철, set철] = useState(() => 이번명절())
  const [컷, set컷] = useState(null)

  useEffect(() => {
    // 📅 앱을 며칠씩 켜 두는 사람이 있다 — 다시 볼 때마다 오늘을 다시 잰다.
    const 다시재기 = () => set철(이번명절())
    document.addEventListener('visibilitychange', 다시재기)
    return () => document.removeEventListener('visibilitychange', 다시재기)
  }, [])

  useEffect(() => {
    if (!철) { set컷(null); return }
    let 살아있나 = true
    import('./cuts.js').then((m) => { if (살아있나) set컷(m.default) })
      // ⛔ 못 받아도 앱은 그냥 돈다 — 장식은 없어도 되는 것이다.
      .catch(() => {})
    return () => { 살아있나 = false }
  }, [철])

  return { 철, 컷 }
}
