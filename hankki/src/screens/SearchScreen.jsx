import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
// 🥕 [2026-08-23 창업자 제보 「홈에서 검색하면 아래 음식아이콘 옛날꺼」]
//   ⛔ 뿌리 = 「재료로 찾기」 칩인데 «요리» 규칙(`guessFoodIcon`)을 불렀다.
//      재료 이름이 요리 규칙에 안 걸리면 옛 SVG 도형으로 떨어진다.
//   ✅ 재료는 «재료» 규칙(`guessIngredientIcon`)을 본다 — 그게 못 찾으면 스스로 요리 규칙으로 넘긴다.
import FoodIcon, { guessIngredientIcon } from '../components/FoodIcon'
import { POPULAR_SEARCHES, TAG_LIST, INGREDIENT_CHIPS } from '../data/seed'
import { 검색빈손, 기본레시피표시 } from '../stats'
// 🔖🔤 [창업자 2026-10-29 「홈에서 검색시에 꽂이를 못써」 · 「ㄱㄴㄷ로 검색도 열어주면 좋겠어」]
//   홈 검색을 레시피 탭 검색과 같게 = ① 결과 카드에 꽂이 ② 초성(matchKo)으로도 찾기
//   🔑 열쇠 뒤 = `?검색=새`(이 기기 켬) · `?검색=옛`(끔) — 아이폰 승인 날 같이 연다
import { matchKo } from '../utils'
import { 아이폰앱인가 } from '../pushConsent'
import { pinName, pinOf, nextPin } from '../favPin'
import idxChef from '../assets/ui/idx_chef.png'
import idxChefFaint from '../assets/ui/idx_chef_faint.png'
import idxHeart from '../assets/ui/idx_heart.png'
import FounderMark from '../components/FounderMark'
// 🍽 테마로 찾기 ＋ 한식 집밥 (창업자 2026-11-21 시안 C 확정 · 🔑 열쇠 뒤 = 아이폰과 같이 연다)
import { THEMES, 한식낱말, 한식에드나, 테마에드나, 테마열쇠, 한식그림 } from '../data/themes'

// 📂 접었다 펴는 제목 — 창업자 2026-11-21 「테마별 / 집밥 이런 제목 붙이고 아래 그림 아이콘 · 주제 옆엔 접었다 펼 수 있게」
//   ⭐ 접힘 상태는 이 기기에 기억(다시 와도 그대로)
function 접는칸({ 열쇠, 제목, 개수, children }) {
  const 칸 = 'hankki:접음:' + 열쇠
  const [열림, set열림] = useState(() => { try { return localStorage.getItem(칸) !== '0' } catch { return true } })
  const 바꾸기 = () => { const v = !열림; set열림(v); try { localStorage.setItem(칸, v ? '1' : '0') } catch { /* noop */ } }
  return (
    <>
      <button className="press" onClick={바꾸기} aria-expanded={열림} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginTop: 26, marginBottom: 13, textAlign: 'left' }}>
        <span className="h-section" style={{ margin: 0 }}>{제목}</span>
        <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{개수}</span>
        <Icon name="chevron-down" size={18} color="var(--text-sub)" style={{ marginLeft: 'auto', transform: 열림 ? 'none' : 'rotate(-90deg)', transition: 'transform .2s' }} />
      </button>
      {열림 && children}
    </>
  )
}
function 그림칸({ img, 이름, n, onClick }) {
  return (
    <button className="press" onClick={onClick} style={{ background: 'var(--card, #fff)', borderRadius: 16, padding: '8px 6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <img src={img} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
      <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{이름}</span>
      <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{n}편</span>
    </button>
  )
}
// 🍎 아이폰 앱은 «열쇠 없이» 켠다 — 창업자 2026-10-29 「아이폰 판은 열쇠 떼고 굽기」
function 새검색열쇠() {
  try {
    if (아이폰앱인가()) return true
    const v = new URLSearchParams(location.search).get('검색')
    // 🔓 [2026-10-30 아이폰 승인 · 창업자 「승인났어 바로넣어줘」] 모두 «켬»이 기본 — ?검색=옛 만 이 기기에서 끈다(사고 대비)
    if (v === '옛') localStorage.setItem('hankki:검색새', '0')
    if (v === '새') localStorage.removeItem('hankki:검색새')
    return localStorage.getItem('hankki:검색새') !== '0'
  } catch { return true }
}

export default function SearchScreen() {
  const { recipes, setFavPin } = useStore()
  const [새검색] = useState(() => 새검색열쇠())
  const [테마켬] = useState(() => 테마열쇠())
  const nav = useNav()
  // 다른 화면(내 레시피의 태그 등)에서 넘겨준 검색어가 있으면 그걸로 시작
  const [q, setQ] = useState(() => {
    try {
      const t = sessionStorage.getItem('hankki:searchQ') || ''
      sessionStorage.removeItem('hankki:searchQ')
      return t
    } catch { return '' }
  })

  const query = q.trim()
  const results = useMemo(() => {
    if (!query) return []
    // 🍽 테마 이름·한식 낱말을 «그대로» 누른 것이면 그 묶음을 보여 준다(글자 겹침으로 찾지 않는다)
    if (테마켬) {
      const 테마 = THEMES.find((t) => t.name === query)
      if (테마) return recipes.filter((r) => 테마에드나(r, 테마))
      if (한식낱말.includes(query)) return recipes.filter((r) => 한식에드나(r, query))
    }
    const k = query.toLowerCase()
    return recipes.filter((r) => {
      const hay = [r.title, r.category, ...(r.tags || []), ...(r.ingredients || [])].join(' ').toLowerCase()
      return 새검색 ? matchKo(hay, k) : hay.includes(k)
    })
  }, [query, recipes, 새검색, 테마켬])
  // 🍽 열린 편이 있는 테마만 · 편수 같이
  const 테마칸 = useMemo(() => 테마켬 ? THEMES.map((t) => ({ ...t, n: recipes.filter((r) => 테마에드나(r, t)).length })).filter((t) => t.n > 0) : [], [recipes, 테마켬])
  const 한식칸 = useMemo(() => 테마켬 ? 한식낱말.map((w) => ({ w, n: recipes.filter((r) => 한식에드나(r, w)).length })).filter((x) => x.n > 0) : [], [recipes, 테마켬])

  // 📊 [2026-09-14] 🔍 「찾았는데 «0건»이었다」
  //   ⭐ 왜 재나 = 「뭘 찾다 못 찾고 나가나」는 «레시피를 더 만들 근거»가 된다. 지금은 통째로 깜깜하다.
  //   ⛔⛔ 검색어는 «한 자도» 안 보낸다 — 나가는 건 「0건이었다」는 사실뿐이다(개인정보 규칙 그대로).
  //   ⛔ 막은 함정 둘 (설계 게이트 2026-09-14)
  //     ⓐ 글자를 칠 때마다 0건이라 «글자마다» 나간다 → 입력이 멎고 800ms 뒤 한 번만
  //     ⓑ 한 방문에서 계속 고쳐 치면 수십 건이 된다 → «3회» 상한
  const 빈손보낸수 = useRef(0)
  useEffect(() => {
    if (!query || results.length > 0) return
    if (빈손보낸수.current >= 3) return
    const t = setTimeout(() => {
      빈손보낸수.current += 1
      try { 검색빈손() } catch { /* 통계가 죽어도 검색은 된다 */ }
    }, 800)
    return () => clearTimeout(t)
  }, [query, results.length])

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="icon-btn press" onClick={() => nav.go('home')} aria-label="뒤로" style={{ marginLeft: -6 }}>
            <Icon name="chevron-left" size={24} />
          </button>
          <div className="h-title">검색</div>
          <TabTips tab="search" />
        </div>
      </div>
      <div className="pad">
        <div className="searchbar" style={{ marginTop: 2 }}>
          <Icon name="search" size={19} color="var(--text-sub)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={새검색 ? "요리 이름·재료로 찾기 · 초성(ㄷㅂ)도 돼요" : "검색어를 입력하세요"} autoComplete="off" />
          {q && (
            <button className="press" onClick={() => setQ('')} aria-label="지우기">
              <Icon name="x" size={18} color="var(--text-sub)" />
            </button>
          )}
        </div>

        {query ? (
          <div className="fade">
            <div className="t-sub" style={{ margin: '18px 0 12px' }}>
              '{query}' 검색 결과 {results.length}개
            </div>
            {results.length === 0 ? (
              <div className="empty">{'검색 결과가 없어요.\n다른 키워드로 찾아보세요.'}</div>
            ) : (
              <div className="grid2" style={새검색 ? { paddingTop: 14, rowGap: 24 } : undefined}>
                {results.map((r) => 새검색 ? (
                  // 🔖 레시피 탭 카드와 «같은» 꽂이 — 단추를 카드 «밖»에 둔다(카드가 button 이라 안에 넣으면 중첩 단추)
                  <div key={r.id} style={{ position: 'relative', minWidth: 0 }}>
                    <button className="grid-card press" style={{ textAlign: 'left', width: '100%' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                      <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                      <div className="name">{r.title}<FounderMark recipe={r} /></div>
                      <div className="date">{r.category} · {r.time}분</div>
                    </button>
                    <button
                      className={`fav-dot press${r.favorite ? ' on' : ''}`}
                      aria-label={nextPin(r) ? `${r.title} ${pinName(nextPin(r))}에 꽂기` : `${r.title} ${pinName(pinOf(r))}에서 빼기`}
                      aria-pressed={!!r.favorite}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        const 다음 = nextPin(r)
                        setFavPin(r.id, 다음)
                        if (다음) 기본레시피표시(r.id, 다음)
                        nav.showToast?.(다음 ? `${pinName(다음)}에 넣었어요` : `${pinName(pinOf(r))}에서 뺐어요`)
                      }}
                    >
                      <img src={!r.favorite ? idxChefFaint : pinOf(r) === 'heart' ? idxHeart : idxChef} alt="" className={`idx-clip${r.favorite && pinOf(r) === 'heart' ? ' heart' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                    <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                    <div className="name">{r.title}<FounderMark recipe={r} /></div>
                    <div className="date">{r.category} · {r.time}분</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {테마칸.length > 0 && (
              <접는칸 열쇠="테마" 제목="테마별" 개수={`${테마칸.length}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {테마칸.map((t) => <그림칸 key={t.id} img={t.img} 이름={t.name} n={t.n} onClick={() => setQ(t.name)} />)}
                </div>
              </접는칸>
            )}
            {한식칸.length > 0 && (
              <접는칸 열쇠="집밥" 제목="집밥" 개수={`${한식칸.length}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {한식칸.map((x) => <그림칸 key={x.w} img={한식그림(x.w)} 이름={x.w} n={x.n} onClick={() => setQ(x.w)} />)}
                </div>
              </접는칸>
            )}
            {/* 인기 검색어 */}
            <div className="h-section" style={{ marginTop: 26, marginBottom: 13 }}>인기 검색어</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_SEARCHES.map((t) => (
                <button key={t} className="pill press" onClick={() => setQ(t)}>{t}</button>
              ))}
            </div>

            {/* 태그로 찾기 */}
            <div className="h-section" style={{ marginTop: 28, marginBottom: 13 }}>태그로 찾기</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAG_LIST.slice(0, 6).map((t) => (
                <button key={t} className="tag press" onClick={() => setQ(t)}># {t}</button>
              ))}
            </div>

            {/* 재료로 찾기 */}
            <div className="h-section" style={{ marginTop: 28, marginBottom: 15 }}>재료로 찾기</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px 8px' }}>
              {INGREDIENT_CHIPS.map((c) => (
                <button key={c.name} className="press" onClick={() => setQ(c.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div className="emoji-tile" style={{ width: 56, height: 56, borderRadius: '50%' }}>
                    <FoodIcon name={c.icon || guessIngredientIcon(c.name)} size={34} />
                  </div>
                  <span style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--text)' }}>{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
