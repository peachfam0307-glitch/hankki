import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import PaperNote from '../components/PaperNote'
import { PAPER_RULES, PAPER_SKINS, PAPER_ARTS, paperStyle } from '../data/papers'
import { useLayerBack } from '../useBackHandler'

// 📔📔 다이어리 — 「그날」 한 장. (창업자 확정 2026-08-06)
//
// ⭐ 창업자 원문 = *"따로 아이콘을 하나 파서 다이어리 쓰기(날짜 넣고 쓰면 달력에 저장되도록)"*
//    → 다이어리는 **레시피가 아니라 «날짜»에 묶인다.** 요리를 안 한 날에도 쓸 수 있다.
//
// ⭐⭐ 우리가 이미 가진 걸로 만든다 — 새로 발명한 게 거의 없다
//    · 판 모양 3:4 = `DecorEditor` 가 `ratio` 를 받게 고친 것(2026-08-06)
//    · 종이 = `data/papers.js` 세 층(선 CSS · 스킨 CSS · 틀 그림)
//    · 꾸미기 = 표지와 **똑같은 에디터**. 서랍 394컷·모션 15·효과 14가 통째로 따라온다
//
// ⛔ 양식을 정하지 않는다(2026-08-06 확정) — 빈 종이에서 시작하고, 속지는 «고르는» 것이다.
//    시안의 「폴라로이드·두 칸·스티커 줄」은 그래서 죽었다. 그것도 양식이다.

const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
const fromDayKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m, d, 12, 0, 0) }
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export default function DiaryScreen({ day }) {
  const { diary, recipes, addDiary, updateDiary, removeDiary } = useStore()
  const nav = useNav()
  const date = useMemo(() => fromDayKey(day), [day])

  // 그날 «다이어리» 한 장. 요리 기록(kind 없음)과 섞이지 않게 kind 로 가른다.
  // ⚠️ kind 가 없는 옛 항목은 전부 요리 기록이다 — 그래야 이미 깔린 폰이 안 깨진다.
  const entry = useMemo(
    () => diary.find((d) => d.kind === 'diary' && dayKey(d.at) === day) || null,
    [diary, day],
  )
  // 그날 만든 요리 — 다이어리 위에 «붙일지»는 본인이 정한다(자동으로 안 얹는다).
  const cooked = useMemo(
    () => diary.filter((d) => d.kind !== 'diary' && dayKey(d.at) === day),
    [diary, day],
  )
  const iconOf = (e) => (recipes.find((r) => r.id === e.recipeId) || {}).icon || guessFoodIcon(e.title)

  const [pick, setPick] = useState(() => entry?.paper || { rule: 'plain', skin: 'ivory', art: 'none' })
  const [tab, setTab] = useState('rule') // rule | skin | art
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)
  useLayerBack(open, () => { if (closeRef.current) closeRef.current(); else setOpen(false) })

  const decor = entry?.decor || []
  const skin = paperStyle(pick)

  const save = (patch) => {
    if (entry) { updateDiary(entry.id, patch); return }
    addDiary({ id: newId(), kind: 'diary', at: date.getTime(), paper: pick, decor: [], note: '', ...patch })
  }
  const choose = (next) => { setPick(next); save({ paper: next }) }

  // 📝 「오늘의 한 줄」 — 치는 대로 종이에 얹히고, 잠깐 멈추면 저장된다.
  //   ⛔ 한 글자마다 저장하면 localStorage 를 매 타건마다 쓴다 → 꾸미기 자동저장과 같은 350ms 뜸.
  //   ⚠️ 저장한 뒤 다시 열면 `entry.note` 로 시작해야 한다 — 날짜를 옮겨도 그 날 것이 뜨게.
  const [note, setNote] = useState(() => entry?.note || '')
  useEffect(() => { setNote(entry?.note || '') }, [day]) // eslint-disable-line react-hooks/exhaustive-deps
  const savedNote = entry?.note || ''
  useEffect(() => {
    if (note === savedNote) return // 처음 열었을 때 «빈 다이어리»를 만들어 버리지 않게
    const t = setTimeout(() => save({ note }), 350)
    return () => clearTimeout(t)
  }, [note]) // eslint-disable-line react-hooks/exhaustive-deps

  const TABS = [['rule', '선'], ['skin', '종이'], ['art', '틀']]
  const LIST = tab === 'rule' ? PAPER_RULES : tab === 'skin' ? PAPER_SKINS : PAPER_ARTS

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      <div className="detail-bar">
        <button className="bar-btn" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ fontSize: 15, fontWeight: 800 }}>
          {date.getMonth() + 1}월 {date.getDate()}일 <span className="t-sub" style={{ fontSize: 13, fontWeight: 700 }}>{WEEK[date.getDay()]}요일</span>
        </div>
        {entry ? (
          <button className="bar-btn" aria-label="다이어리 삭제" onClick={() => { removeDiary(entry.id); nav.showToast('다이어리를 지웠어요') }}>
            <Icon name="trash" size={19} />
          </button>
        ) : <span style={{ width: 36 }} />}
      </div>

      <div className="pad" style={{ paddingTop: 14, paddingBottom: 40 }}>
        {/* 종이 — 3:4. 누르면 바로 꾸미기로 들어간다(버튼을 따로 두면 한 번 더 눌러야 한다) */}
        <button
          className="press"
          onClick={() => setOpen(true)}
          aria-label="다이어리 꾸미기"
          style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none' }}
        >
          <div className={skin.className} style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', boxShadow: '0 3px 14px rgba(70,60,45,.14)', ...(skin.style || {}) }}>
            <DecorLayer items={decor} />
            <PaperNote text={note} />
            {!decor.length && !note && (
              <span className="t-sub" style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', fontSize: 12.5 }}>
                눌러서 꾸며요
              </span>
            )}
          </div>
        </button>

        {/* 📝 오늘의 한 줄 — 종이 «바로 밑». 열고 → 쓰고 → 끝.
            ⭐ 창업자 2026-08-06 *"평가빼고 오늘의 한 줄 정도로?"* — 별점 자리를 이게 물려받았다.
            ⛔ 꾸미기 서랍의 「글자」로도 쓸 수 있지만 그건 서랍 열고·탭 찾고·넣고·끌어야 한다.
               **매일 쓰게 하려면 길이 짧아야 한다.** 여긴 칸 하나뿐이다. */}
        <div style={{ marginTop: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <Icon name="pen" size={13} color="var(--text-sub)" />
            <span className="t-sub" style={{ fontSize: 12, fontWeight: 700 }}>오늘의 한 줄</span>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="오늘 어땠어요? 한 줄이면 충분해요"
            maxLength={40}
            aria-label="오늘의 한 줄"
            style={{ width: '100%' }}
          />
        </div>

        {/* 속지 고르기 — 선·종이·틀을 «각각 혹은 같이» (창업자 2026-08-06 *"각각 혹은 같이 사용하는거 아이디어야"*) */}
        <div className="segment" style={{ marginTop: 16 }}>
          {TABS.map(([k, label]) => (
            <button key={k} className={`seg ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 0 2px' }}>
          {LIST.map((o) => {
            const next = { ...pick, [tab]: o.key }
            const on = pick[tab] === o.key
            const mini = paperStyle(next)
            return (
              <button
                key={o.key}
                className="press"
                onClick={() => choose(next)}
                aria-label={o.label}
                style={{ flex: '0 0 auto', border: 'none', background: 'none', padding: 0, width: 54 }}
              >
                <div
                  className={mini.className}
                  style={{ width: 54, aspectRatio: '3/4', borderRadius: 8, boxShadow: on ? '0 0 0 2.5px var(--brown)' : '0 1px 4px rgba(70,60,45,.18)', ...(mini.style || {}) }}
                />
                <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4, color: on ? 'var(--brown)' : 'var(--text-sub)', textAlign: 'center' }}>{o.label}</div>
              </button>
            )
          })}
        </div>

        {/* 그날 만든 요리 — ⛔자동으로 안 얹는다. 「있다」만 알려주고 붙일지는 본인이 정한다 */}
        {cooked.length > 0 && (
          <div className="card" style={{ marginTop: 16, padding: '11px 13px', background: 'var(--cream)', border: 'none' }}>
            <div className="t-sub" style={{ fontSize: 12, fontWeight: 700, marginBottom: 7 }}>이 날 만든 요리</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {cooked.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  <FoodIcon name={iconOf(e)} size={22} />
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <DecorEditor
          closeRef={closeRef}
          ratio="3/4"
          paper={skin}
          // 📝 꾸미는 동안에도 한 줄이 «같은 자리»에 보여야 한다 — 안 보이면 그 위에 스티커를 놓는다
          paperNote={note}
          // ⭐ 에디터에 들어가면 날짜가 안 보인다 → 머리글이 «지금 어느 날을 꾸미는 중인지»를 말한다
          title={`${date.getMonth() + 1}월 ${date.getDate()}일 다이어리`}
          recipe={{ id: `diary-${day}`, title: '', decor, decorBg: 'none', thumb: 'none' }}
          onSave={(items) => {
            save({ decor: items, paper: pick })
            setOpen(false)
            nav.showToast(items.length ? '다이어리에 저장했어요' : '다이어리를 비웠어요')
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
