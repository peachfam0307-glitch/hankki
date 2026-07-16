import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import FoodIcon from '../components/FoodIcon'
import Buddy from '../components/Buddies'
import SourceBadge from '../components/SourceBadge'
import TabTips from '../components/TabTips'
import { timeAgo } from '../utils'

export default function HomeScreen() {
  const { recipes, profile, pantry } = useStore()
  const nav = useNav()
  const [pick, setPick] = useState(0)

  // 오늘의 추천 — 냉장고 재료로 만들 수 있는 요리 우선, 없으면 자주 해먹는/전체
  const today = useMemo(() => {
    const pool = recipes.filter((r) => r.status !== 'unsorted')
    const withPantry = pool
      .map((r) => {
        const ings = (r.ingredients || []).join(' ')
        const n = (pantry || []).filter((p) => {
          const k = (p.name || '').trim().split(/\s+/)[0]
          return k && ings.includes(k)
        }).length
        return { r, n }
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (withPantry.length) return { list: withPantry.map((x) => x.r), fromFridge: true }
    const cooked = pool.filter((r) => (r.cooked || 0) > 0)
    return { list: cooked.length ? cooked : pool, fromFridge: false }
  }, [recipes, pantry])
  const todayPick = today.list.length ? today.list[pick % today.list.length] : null

  const often = useMemo(
    () => [...recipes].filter((r) => (r.cooked || 0) > 0).sort((a, b) => b.cooked - a.cooked).slice(0, 8),
    [recipes]
  )
  const recent = useMemo(
    () => [...recipes].sort((a, b) => b.savedAt - a.savedAt).slice(0, 5),
    [recipes]
  )

  const open = (id) => nav.push({ name: 'detail', id })

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">한끼</div>
          <TabTips tab="home" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 가져오기 — 제일 자주 쓰는 기능이라 맨 위에 */}
          <button
            className="press"
            onClick={() => nav.push({ name: 'import' })}
            aria-label="가져오기"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brown)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 13px', borderRadius: 999 }}
          >
            <Icon name="plus" size={16} color="#fff" stroke={2.4} /> 가져오기
          </button>
          <button className="icon-btn press" onClick={() => nav.push({ name: 'inbox' })} aria-label="Inbox">
            <Icon name="inbox" size={22} />
          </button>
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="프로필">
            <Avatar name={profile.name} avatar={profile.avatar} />
          </button>
        </div>
      </div>

      <div className="pad">
        {/* 1. 검색 */}
        <button
          className="searchbar press"
          style={{ width: '100%', marginTop: 4 }}
          onClick={() => nav.go('search')}
        >
          <Icon name="search" size={19} color="var(--text-sub)" />
          <span style={{ fontSize: 14.5 }}>레시피, 재료, 태그를 검색해 보세요.</span>
        </button>

        {/* 오늘 뭐 해먹지? */}
        {todayPick && (
          <div className="today-card">
            <button className="today-main press" onClick={() => open(todayPick.id)}>
              <Thumb recipe={todayPick} style={{ width: 72, height: 72, flex: '0 0 auto' }} radius={16} showDecor />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="today-label">오늘 뭐 해먹지?</div>
                <div className="today-title">{todayPick.title}</div>
                <div className="today-reason">{today.fromFridge ? '🧊 냉장고 재료로 만들 수 있어요' : '이건 어때요?'}</div>
              </div>
            </button>
            {today.list.length > 1 && (
              <button className="today-refresh press" onClick={() => setPick((p) => p + 1)}>다른<br />추천</button>
            )}
          </div>
        )}

        {/* 2. 자주 해먹는 요리 */}
        {often.length > 0 && (
          <>
            <div className="sec-head">
              <div className="h-section">자주 해먹는 요리</div>
              <button className="t-more press" onClick={() => nav.push({ name: 'cooked' })}>
                더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
              </button>
            </div>
            <div className="hscroll">
              {often.map((r) => (
                <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2rem" showDecor />
                  <div className="name">{r.title}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3. 최근 저장 */}
        <div className="sec-head">
          <div className="h-section">최근 저장</div>
          <button className="t-more press" onClick={() => nav.go('myrecipes')}>
            더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
          </button>
        </div>
        <div>
          {recent.map((r, i) => (
            <div key={r.id}>
              <button className="list-row press" style={{ width: '100%', textAlign: 'left' }} onClick={() => open(r.id)}>
                <Thumb recipe={r} style={{ width: 62, height: 62, flex: '0 0 auto' }} radius={14} emojiSize="1.5rem" showDecor />
                <div className="meta">
                  <div className="name">{r.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <SourceBadge source={r.source} showLabel={false} size={14} />
                    <span className="t-sub">{r.source === 'hankki' ? '한끼 기본 레시피' : `${sourceLabel(r.source)}에서 가져옴`} · {timeAgo(r.savedAt)}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size={18} color="var(--sand)" />
              </button>
              {i < recent.length - 1 && <hr className="divider" />}
            </div>
          ))}
        </div>

        {/* 내 레시피 전체 보기 — 전체 목록은 '레시피' 탭이 담당(홈은 대시보드).
            예전엔 홈에 전체 그리드를 통째로 얹어 '남의 요리책'처럼 어수선했다. */}
        <button
          className="press"
          onClick={() => nav.go('myrecipes')}
          style={{
            width: '100%', marginTop: 22, padding: 15, borderRadius: 'var(--r-md)',
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 14.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Icon name="bookmark" size={17} color="var(--brown)" stroke={2.2} />
          내 레시피 전체 보기
        </button>
        <div style={{ height: 12 }} />
      </div>
    </>
  )
}

function sourceLabel(s) {
  return { instagram: 'Instagram', youtube: 'YouTube', link: '링크', photo: '사진', manual: '직접 작성' }[s] || '링크'
}

// 아바타 — 요리사 친구·사진·이모지·브랜드 아이콘을 고를 수 있고, 없으면 이름 첫 글자.
export function Avatar({ name, avatar, size = 32 }) {
  if (avatar?.type === 'buddy' && avatar.value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(160deg,#f8f6f1,#f1eee7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
          overflow: 'hidden',
        }}
      >
        <Buddy id={avatar.value} size={size} />
      </div>
    )
  }
  if (avatar?.type === 'icon' && avatar.value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#eef0ec,#dfe2da)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
        }}
      >
        <FoodIcon name={avatar.value} size={size * 0.62} />
      </div>
    )
  }
  if (avatar?.type === 'photo' && avatar.value) {
    return (
      <img
        src={avatar.value}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto' }}
      />
    )
  }
  const isEmoji = avatar?.type === 'emoji' && avatar.value
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#dcdcd3,#c9c8bd)',
        color: '#6b4f3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * (isEmoji ? 0.54 : 0.42),
        flex: '0 0 auto',
      }}
    >
      {isEmoji ? avatar.value : (name || '한')[0]}
    </div>
  )
}
