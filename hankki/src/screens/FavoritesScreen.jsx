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
      {/* 🔖 [2026-08-18] 「즐겨찾기」 → **「책갈피」** (창업자 확정 · 유저에게 보이는 일곱 곳을 같이 바꿨다)
          ⛔ 빈 칸 안내도 낡아 있었다 — *"레시피에서 북마크를 눌러보세요"* 는 «상세로 들어가라»는 말인데,
             2026-08-17 에 창업자 *"북마크를 밖으로 빼면 되겠다"* 로 **목록에서 바로 누르게** 바꿨다.
          ⚠️ 이 주석을 아래 `favs.length === 0 ? (` **안**에 넣었다가 빌드를 죽였다 —
             삼항연산자 괄호 안은 «표현식» 자리라 JSX 주석이 객체 리터럴로 파싱된다(CLAUDE.md 함정). */}
      <TopBar title="책갈피" onBack={() => nav.pop()} />
      <div className="pad">
        {favs.length === 0 ? (
          <div className="empty">{'아직 책갈피를 꽂은 레시피가 없어요.\n레시피 카드 오른쪽 위를 눌러보세요.'}</div>
        ) : (
          <div className="grid2" style={{ marginTop: 8 }}>
            {favs.map((r) => (
              <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
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
