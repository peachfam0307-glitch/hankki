import { useStore } from '../store'
import { useNav } from '../App'
import TopBar from '../components/TopBar'
import Thumb from '../components/Thumb'
import Icon from '../components/Icon'

export default function FavoritesScreen() {
  const { recipes } = useStore()
  const nav = useNav()
  const favs = recipes.filter((r) => r.favorite).sort((a, b) => b.savedAt - a.savedAt)

  return (
    <div className="screen fade">
      <TopBar title="즐겨찾기" onBack={() => nav.pop()} />
      <div className="pad">
        {favs.length === 0 ? (
          <div className="empty">{'즐겨찾기한 레시피가 없어요.\n레시피에서 북마크를 눌러보세요.'}</div>
        ) : (
          <div className="grid2" style={{ marginTop: 8 }}>
            {favs.map((r) => (
              <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} ratio="1/1" radius={16} />
                <div className="fav-dot"><Icon name="bookmark" size={16} color="var(--brown)" style={{ fill: 'var(--brown)' }} /></div>
                <div className="name">{r.title}</div>
                <div className="date">{r.category} · {r.time}분</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
