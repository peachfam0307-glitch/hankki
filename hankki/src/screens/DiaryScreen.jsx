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

  // 📄📄 **처음 열면 전부 「맨 왼쪽」** (창업자 2026-08-06
  //   *"처음에 일기쓰기 클릭하면 다 왼쪽껄로 고르게 해줘. 없음이랑 아이보리.."*)
  //   틀 = 없음 · 종이 = 아이보리 · 선 = **무지**. 서랍에 보이는 순서 그대로 첫 칸이다.
  //   ⛔ 전엔 선만 「줄」이었다 — 내가 *"쓰는 판이라 줄이 있어야 정돈된다"* 며 «둘째»를 기본으로 뒀다.
  //      창업자가 *"줄눈을 그어주는게 좋을까...? 그건 잘 모르겠네"* 라 했을 때 **우리가 정하지 않기로** 해놓고
  //      내 판단으로 정해버린 것이다. 골라 쓰는 건 한 번 누르면 된다.
  const FIRST = { rule: 'plain', skin: 'ivory', art: 'none' }
  const [pick, setPick] = useState(() => entry?.paper || FIRST)
  // ⚠️⚠️ **날이 바뀌면 고른 속지도 따라가야 한다** — 이게 창업자가 본 *"막 중구난방으로 골라져있어"* 다.
  //   `useState` 초기값은 **한 번만** 읽는다. 화면이 안 갈리고 `day` 만 바뀌면(달력에서 옆날로)
  //   `pick` 이 **앞 날의 속지 그대로** 남아, 아무것도 안 쓴 날을 열었는데 도트·크라프트가 골라져 있다.
  //   ⭐ 바로 아래 `text` 는 이미 같은 이유로 `day` 마다 되돌리고 있었다 — **`pick` 만 빠져 있었다.**
  useEffect(() => { setPick(entry?.paper || FIRST) }, [day]) // eslint-disable-line react-hooks/exhaustive-deps
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
  //   🔀 `picks` = 「인쇄된 아이콘 중 고른 것」 여러 축(기분·장소·동행·시간대…). **객체**다.
  //      ⚠️ 그래서 «바뀌었나»를 `!==` 로 재면 안 된다 — 객체는 참조 비교라 늘 다르다고 나와
  //         매 렌더마다 저장이 돌게 된다. 아래 `same()` 이 그걸 막는다.
  // ✍️ `font` = **본문 글씨체** (창업자 2026-08-07 *"글쓰기 글자체도 추가했으면"*)
  //    ⛔ 빈 값이 «귀염체»다 — 이미 쓴 일기는 이 칸이 없으니 예전 모습 그대로 남는다
  const blank = { title: '', note: '', line: '', weather: '', photo: '', photo2: '', photo3: '', note2: '', note3: '', note4: '', picks: {}, font: '', size: '' }
  const of = (e) => ({ title: e?.title || '', note: e?.note || '', line: e?.line || '', weather: e?.weather || '', photo: e?.photo || '', photo2: e?.photo2 || '', photo3: e?.photo3 || '', note2: e?.note2 || '', note3: e?.note3 || '', note4: e?.note4 || '', picks: e?.picks || {}, font: e?.font || '', size: e?.size || '' })
  const same = (a, b) => (a && typeof a === 'object') || (b && typeof b === 'object')
    ? JSON.stringify(a || {}) === JSON.stringify(b || {})
    : a === b
  const [text, setText] = useState(() => of(entry))
  useEffect(() => { setText(of(entry)) }, [day]) // eslint-disable-line react-hooks/exhaustive-deps
  const saved = of(entry)
  const dirty = Object.keys(blank).some((k) => !same(text[k], saved[k]))
  useEffect(() => {
    if (!dirty) return // 처음 열었을 때 «빈 다이어리»를 만들어 버리지 않게
    const t = setTimeout(() => save({ title: text.title, note: text.note, line: text.line, weather: text.weather, photo: text.photo, photo2: text.photo2, photo3: text.photo3, note2: text.note2, note3: text.note3, note4: text.note4, picks: text.picks, font: text.font, size: text.size }), 350)
    return () => clearTimeout(t)
  }, [text.title, text.note, text.line, text.weather, text.photo, text.photo2, text.photo3, text.note2, text.note3, text.note4, text.font, text.size, JSON.stringify(text.picks)]) // eslint-disable-line react-hooks/exhaustive-deps

  // 📷 사진 — 틀에 그려진 «창»에 끼운다 (창업자 2026-08-06 *"사진틀에 사진올리기가없어"*)
  //   ⭐ `cropSquare` 를 그대로 쓴다 — 레시피 표지·요리 기록·아바타가 다 쓰는, 이미 검증된 길이다
  //      (검정 썸네일·세로 반토막 두 사고를 이미 여기서 다 잡았다).
  //   ⚠️ 창은 정사각이 아니라 가로로 길다 → `object-fit: cover` 가 화면에서 맞춰 자른다.
  const photoRef = useRef(null)
  // 🗂 사진칸이 여럿인 속지(「기록 3칸」)는 «어느 칸을 눌렀는지»를 기억해야 한다 —
  //    파일 고르기는 비동기라, 키를 안 잡아두면 셋 다 첫 칸(photo)으로 들어간다.
  const photoKeyRef = useRef('photo')
  const pickPhotoFor = (pk) => { photoKeyRef.current = pk || 'photo'; photoRef.current?.click() }
  const onPhotoFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const src = await cropSquare(reader.result, 900)
      const pk = photoKeyRef.current || 'photo'
      setText((t) => ({ ...t, [pk]: src }))
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
          <button className="bar-btn" aria-label="일기 삭제" onClick={() => { removeDiary(entry.id); nav.showToast('일기를 지웠어요') }}>
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
            onPickPhoto={pickPhotoFor}
            dateLabel={dateLabel}
            font={text.font}
            size={text.size}
          />
          <DecorLayer items={decor} />
        </PaperBox>
        <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />

        <button
          className="press"
          onClick={() => setOpen(true)}
          aria-label="꾸미기 열기"
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
          // ⭐ `onPick` = **고르는 칸만** 살린다(창업자 폰 제보 2026-08-07). 글칸은 그대로 읽기 전용이라
          //    그 위에서 스티커를 끌 수 있고, 함께·장소·날씨·기분·시간·만족도는 **꾸미는 중에도 눌린다.**
          //    ⛔ 전엔 `onChange` 하나가 전부를 갈라서 이 칸들이 **만든 날부터 한 번도 안 눌렸다.**
          //    📷 `onPickPhoto` 도 같이 — 틀의 사진칸은 «고르는 일»이지 «쓰는 일»이 아니다.
          //       전엔 글쓰기 탭에서만 눌려서 사진 넣으러 갔다 꾸미러 오는 왕복이 생겼다.
          paperOverlay={<PaperSheet fields={skin.fields} rule={skin.rule} value={text} onPick={setText} onPickPhoto={pickPhotoFor} dateLabel={dateLabel} font={text.font} size={text.size} />}
          // ✍️✍️ **꾸미기 안에서 «바로 쓴다»** (창업자 2026-08-06
          //    *"속지고르고 꾸미고 저장해야 글을 쓸수있어서 불편한데.. 속지 고른상태에서
          //      속지 화면 줄 클릭하면 글쓰고(꾸미기칸자동내려감) … 다시 꾸미기버튼 누르면 꾸미고"*)
          //    ⭐ 위 `paperOverlay` 와 **같은 조각에 `onChange` 만 붙인 것**이다 — 자리가 어긋날 수 없다.
          //    ⚠️ 사진 고르기(`photoRef`)는 이 화면에 그대로 살아 있다 — 에디터는 Portal 이라 형제다.
          paperEdit={(
            <PaperSheet
              fields={skin.fields}
              rule={skin.rule}
              value={text}
              onChange={setText}
              onPickPhoto={pickPhotoFor}
              dateLabel={dateLabel}
              font={text.font}
              size={text.size}
            />
          )}
          // 📔 속지 고르기 = 꾸미기 첫 탭. 고르면 «그 자리에서» 판이 바뀐다(저장을 눌러야 보이는 게 아니다)
          paperPick={pick}
          onPaperPick={choose}
          // ✍️ 본문 글씨체 — 「글쓰기」 탭 서랍에서 고른다. 값은 여기(부모)가 쥔다
          writeFont={text.font}
          onWriteFont={(k) => setText((t) => ({ ...t, font: k }))}
          writeSize={text.size}
          onWriteSize={(k) => setText((t) => ({ ...t, size: k }))}
          // ⭐ 에디터에 들어가면 날짜가 안 보인다 → 머리글이 «지금 어느 날을 꾸미는 중인지»를 말한다
          title={`${date.getMonth() + 1}월 ${date.getDate()}일 일기`}
          recipe={{ id: `diary-${day}`, title: '', decor, decorBg: 'none', thumb: 'none' }}
          onSave={(items) => {
            // ⚠️ 「비웠어요」는 **꾸민 게 있다가 없어졌을 때만** — 속지만 고르고 저장해도
            //    「비웠어요」가 뜨면 방금 고른 종이가 지워진 줄 안다.
            const had = (entry?.decor || []).length
            save({ decor: items, paper: pick })
            setOpen(false)
            nav.showToast(!items.length && had ? '꾸민 걸 비웠어요' : '일기에 저장했어요')
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
