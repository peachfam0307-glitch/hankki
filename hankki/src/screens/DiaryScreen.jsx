import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import PaperSheet, { PaperBox } from '../components/PaperSheet'
import { paperStyle } from '../data/papers'
import { useLayerBack } from '../useBackHandler'
import { cropSquare } from '../utils'

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

  // ⭐ 기본이 «줄»이다 (2026-08-06) — 종이 위에 바로 쓰는 판이라 줄이 있어야 글씨가 정돈된다.
  //   창업자 *"줄눈을 그어주는게 좋을까...? 그건 잘 모르겠네"* → **우리가 정하지 않는다.**
  //   기본을 줄로 두고, 「선」 탭에서 무지·모눈·도트로 언제든 바꾼다. 판정은 실물로.
  const [pick, setPick] = useState(() => entry?.paper || { rule: 'lined', skin: 'ivory', art: 'none' })
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

  // ✍️ 글 — **종이 위에서 바로 쓴다.** 치는 대로 보이고, 잠깐 멈추면 저장된다.
  //   ⛔ 종이 밖에 입력칸을 두면 안 쓴다 (창업자 2026-08-06 *"불편해서 안써"*).
  //   ⛔ 한 글자마다 저장하면 localStorage 를 매 타건마다 쓴다 → 꾸미기 자동저장과 같은 350ms 뜸.
  //   `note` = 본문 · `line` = 오늘의 한 줄(레시피 기록 속지의 맨 아래 칸)
  const blank = { title: '', note: '', line: '', weather: '', photo: '' }
  const of = (e) => ({ title: e?.title || '', note: e?.note || '', line: e?.line || '', weather: e?.weather || '', photo: e?.photo || '' })
  const [text, setText] = useState(() => of(entry))
  useEffect(() => { setText(of(entry)) }, [day]) // eslint-disable-line react-hooks/exhaustive-deps
  const saved = of(entry)
  const dirty = Object.keys(blank).some((k) => text[k] !== saved[k])
  useEffect(() => {
    if (!dirty) return // 처음 열었을 때 «빈 다이어리»를 만들어 버리지 않게
    const t = setTimeout(() => save({ title: text.title, note: text.note, line: text.line, weather: text.weather, photo: text.photo }), 350)
    return () => clearTimeout(t)
  }, [text.title, text.note, text.line, text.weather, text.photo]) // eslint-disable-line react-hooks/exhaustive-deps

  // 📷 사진 — 틀에 그려진 «창»에 끼운다 (창업자 2026-08-06 *"사진틀에 사진올리기가없어"*)
  //   ⭐ `cropSquare` 를 그대로 쓴다 — 레시피 표지·요리 기록·아바타가 다 쓰는, 이미 검증된 길이다
  //      (검정 썸네일·세로 반토막 두 사고를 이미 여기서 다 잡았다).
  //   ⚠️ 창은 정사각이 아니라 가로로 길다 → `object-fit: cover` 가 화면에서 맞춰 자른다.
  const photoRef = useRef(null)
  const onPhotoFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const src = await cropSquare(reader.result, 900)
      setText((t) => ({ ...t, photo: src }))
    }
    reader.readAsDataURL(file)
  }

  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEK[date.getDay()]}요일`

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
        {/* 📄 종이 — 3:4. **여기다 바로 쓴다.** 줄 위에 손글씨로 얹힌다.
            ⛔ 예전엔 종이 전체가 「꾸미기」 버튼이었는데, 이제 종이는 «쓰는 곳»이라
               꾸미기는 아래 버튼으로 갈랐다. */}
        <PaperBox skin={skin} style={{ borderRadius: 14, boxShadow: '0 3px 14px rgba(70,60,45,.14)' }}>
          {/* ⚠️ 순서가 뜻을 갖는다 — 사진이 «먼저» 칠해져야 스티커가 그 위에 얹힌다.
              (글자는 zIndex 1 이라 늘 맨 위다) */}
          <PaperSheet
            fields={skin.fields}
            rule={skin.rule}
            value={text}
            onChange={setText}
            onPickPhoto={() => photoRef.current?.click()}
            dateLabel={dateLabel}
          />
          <DecorLayer items={decor} />
        </PaperBox>
        <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />

        <button
          className="press"
          onClick={() => setOpen(true)}
          aria-label="다이어리 꾸미기"
          style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: '10px 0', borderRadius: 12, background: 'var(--cream)', color: 'var(--brown)', fontSize: 13, fontWeight: 800, border: 'none' }}
        >
          <Icon name="palette" size={15} />
          꾸미기
        </button>
        {/* 📔 속지가 꾸미기 «안»으로 들어갔다 → 어디로 갔는지 한 줄로 알려준다.
            ⛔ 아무 말 없이 옮기면 「없어졌다」로 읽힌다 — 있던 자리에서 사라진 기능이라 더 그렇다. */}
        <div className="t-sub" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
          속지(선·종이·틀)도 꾸미기 안에서 골라요
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
          // ✍️ 꾸미는 동안에도 쓴 글이 «같은 자리»에 보여야 한다 — 안 보이면 그 위에 스티커를 놓는다.
          //    ⭐ 에디터가 글을 «모르게» 조각째 넘긴다 — 두 곳에서 그리면 자리가 어긋난다.
          paperOverlay={<PaperSheet fields={skin.fields} rule={skin.rule} value={text} dateLabel={dateLabel} />}
          // 📔 속지 고르기 = 꾸미기 첫 탭. 고르면 «그 자리에서» 판이 바뀐다(저장을 눌러야 보이는 게 아니다)
          paperPick={pick}
          onPaperPick={choose}
          // ⭐ 에디터에 들어가면 날짜가 안 보인다 → 머리글이 «지금 어느 날을 꾸미는 중인지»를 말한다
          title={`${date.getMonth() + 1}월 ${date.getDate()}일 다이어리`}
          recipe={{ id: `diary-${day}`, title: '', decor, decorBg: 'none', thumb: 'none' }}
          onSave={(items) => {
            // ⚠️ 「비웠어요」는 **꾸민 게 있다가 없어졌을 때만** — 속지만 고르고 저장해도
            //    「비웠어요」가 뜨면 방금 고른 종이가 지워진 줄 안다.
            const had = (entry?.decor || []).length
            save({ decor: items, paper: pick })
            setOpen(false)
            nav.showToast(!items.length && had ? '꾸민 걸 비웠어요' : '다이어리에 저장했어요')
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
