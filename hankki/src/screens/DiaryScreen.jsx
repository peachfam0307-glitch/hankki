import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import PaperSheet, { PaperBox } from '../components/PaperSheet'
import { paperStyle, ALL_PHOTO_FIELDS, migratePhotoKeys } from '../data/papers'

// ✍️ 일기가 담는 «글자» 자리 — 속지가 바뀌어도 그대로 간다.
//    사진 자리는 속지마다 다르므로 papers.js 가 세어 준다(ALL_PHOTO_FIELDS).
const WORDS = ['title', 'note', 'line', 'weather', 'note2', 'note3', 'note4', 'font', 'size']
import { useLayerBack } from '../useBackHandler'
import { fitImage } from '../utils'

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
  // ⭐ 돌려주는 값을 «그대로» 넘긴다 — `false` 면 App 이 「아직 안 닫았다」로 보고 층을 남긴다.
  //    ⛔ 안 넘기면 undefined 라 「닫았다」로 읽혀 뒤로가기가 먹통이 된다(2026-08-12 창업자 제보).
  useLayerBack(open, () => { if (closeRef.current) return closeRef.current(); setOpen(false); return true })

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
  // ✍️ 글자 자리 — 속지가 바뀌어도 같이 간다(제목·본문·오늘의 한 줄·날씨·기록 2~4·글씨체·크기)
  //    ⛔ picks(고른 아이콘)는 «객체»라 여기 넣지 않는다 — 아래에서 따로 다룬다
  // 📦📦 담는 자리 목록 = **여기 한 곳** — ⛔손으로 나열하지 말 것.
  //   전엔 빈값·읽기·저장·의존성 «네 곳»에 똑같이 적어 뒀다. 속지마다 사진 자리를 가르는 순간
  //   네 곳을 다 고쳐야 했고, 한 곳만 빠뜨려도 «저장은 되는데 안 보이는» 사진이 생긴다.
  //   (오늘만 같은 병을 셋 봤다 — 코치 키 · 음식 아이콘 218종 · 이것.)
  //   ⭐ 사진 자리는 papers.js 가 속지 정의에서 «세어» 준다(ALL_PHOTO_FIELDS).
  const FIELDS = [...WORDS, ...ALL_PHOTO_FIELDS]
  const blank = { ...Object.fromEntries(FIELDS.map((k) => [k, ''])), picks: {} }
  //   🚚 읽을 때 옛 저장본을 «그 일기가 지금 쓰는 속지»의 자리로 한 번 옮긴다(이미 깔린 폰 · 규칙 18 ⓙ)
  const of = (e0) => {
    const e = migratePhotoKeys(e0)
    return { ...Object.fromEntries(FIELDS.map((k) => [k, e?.[k] || ''])), picks: e?.picks || {} }
  }
  const same = (a, b) => (a && typeof a === 'object') || (b && typeof b === 'object')
    ? JSON.stringify(a || {}) === JSON.stringify(b || {})
    : a === b
  const [text, setText] = useState(() => of(entry))
  useEffect(() => { setText(of(entry)) }, [day]) // eslint-disable-line react-hooks/exhaustive-deps
  // 🚚🚚 이관을 «저장»까지 한다 — 화면만 고치면 옛 자리가 남아서, 앱을 껐다 켜고
  //   다른 속지를 고른 상태면 **거기로 또 옮겨 간다**(＝딸려오기 재발). 재현판이 이걸 잡았다.
  useEffect(() => {
    if (!entry) return
    const m = migratePhotoKeys(entry)
    if (m !== entry) updateDiary(entry.id, m)   // 옮길 게 없으면 원본 그대로 돌아온다
  }, [entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const saved = of(entry)
  const dirty = Object.keys(blank).some((k) => !same(text[k], saved[k]))
  useEffect(() => {
    if (!dirty) return // 처음 열었을 때 «빈 다이어리»를 만들어 버리지 않게
    const t = setTimeout(() => save({ ...Object.fromEntries(FIELDS.map((k) => [k, text[k]])), picks: text.picks }), 350)
    return () => clearTimeout(t)
    // ⚠️ 의존성도 «같은 목록»에서 편다 — FIELDS 는 모듈 상수라 길이가 안 변한다(React 규칙 지킴)
  }, [...FIELDS.map((k) => text[k]), JSON.stringify(text.picks)]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // 📐 **자르지 않고 줄이기만** (창업자 2026-08-08 *"사진 위치조정이 안되네"*)
      //   ⛔ `cropSquare` 는 «고를 때» 가운데 정사각만 남겨서, 세로 사진의 위·아래가 그 자리에서 사라졌다.
      //      버린 건 나중에 아무리 끌어도 못 살린다 → 원본 비율을 통째로 들고 있어야 위치 조정이 된다.
      //   ⭐ 보일 부분은 `PaperSheet` 가 «볼 때»(objectPosition) 정한다.
      const src = await fitImage(reader.result, 1200)
      const pk = photoKeyRef.current || 'photo'
      // ⚠️ 새 사진을 넣으면 그 칸의 위치도 «가운데»로 되돌린다 — 옛 사진 기준 좌표는 뜻이 없다
      //   ⚠️ 확대 배율도 같이 되돌린다 — 옛 사진에 맞춰 3배로 당겨 뒀으면 새 사진이 통째로 확대돼 뜬다
      setText((t) => ({ ...t, [pk]: src, [`${pk}Pos`]: '', [`${pk}Zoom`]: '' }))
    }
    reader.readAsDataURL(file)
  }

  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEK[date.getDay()]}요일`

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      <div className="detail-bar">
        <button className="bar-btn" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>{date.getMonth() + 1}월 {date.getDate()}일 <span className="t-sub" style={{ fontSize: 13, fontWeight: 700 }}>{WEEK[date.getDay()]}요일</span></span>
          {/* 🏷 **「샘플」** (창업자 2026-08-12 *"자기 일기가 아니니까 지워도 되게(샘플이라고 적어주고)"*)
              ⭐ 제목 «옆»에 둔다 — 종이 위에 얹으면 꾸민 것과 섞여 「이것도 스티커인가」가 된다.
              ⛔⛔ 첫 판은 **연한 크림 바탕에 보조색 글자 11px** 이었다 → 창업자 *"샘플표시가 너무 작아 티도안나"*.
                 **맞다** — 크림(#f2ede3)은 화면 바탕(#faf8f4)과 거의 같아서 «칠한 티»가 안 난다.
              ⭐ 그래서 «채운 pill» 로 바꾼다 — 진한 잉크 바탕 ＋ 흰 글자 ＋ 12.5px.
                 ⛔ 포인트색(파랑)은 **안 쓴다** — 우리 앱에서 파랑은 「누르는 것」이라 단추로 읽힌다.
                    이건 눌러도 아무 일 없는 «이름표»다. 스티커 지우기 단추와 같은 잉크색을 쓴다. */}
          {entry?.sample && (
            <span style={{
              fontSize: 12.5, fontWeight: 800, letterSpacing: '.02em',
              padding: '4px 11px', borderRadius: 999,
              background: '#3f382e', color: '#fff', flex: '0 0 auto',
            }}>샘플</span>
          )}
        </div>
        {/* ⛔⛔ [2026-08-12] 지운 뒤 «화면을 떠난다». 안 그러면 지운 일기가 되살아난다.
            📮 창업자 *"일기 지워도 뜸. (아카이브+달력)"* — 재현으로 확정했다(`_repro-일기삭제-0812` ②-2).
            🔬 무슨 일이 났나 = 지워도 이 화면에 그대로 머무는데, `text` state 는 지운 글을 쥐고 있다.
               그 상태에서 한 글자만 쳐도 자동저장(350ms)이 돌고, `entry` 가 null 이라
               `save()` 가 `updateDiary` 가 아니라 **`addDiary` 로 «새 id»를 만든다**(74줄).
               → 달력 펜 표시가 다시 뜬다. 「지웠는데 또 있다」의 정체다.
            ✅ 고침 = 지우면 바로 `nav.pop()`. 머물 이유가 없다 — 볼 일기가 없어졌으니까.
            ⛔⛔ 이 주석을 `{entry ? (` **뒤로** 옮기지 말 것 — 거긴 «표현식 자리»라 JSX 주석이 못 온다.
               2026-08-12 에 그렇게 넣어 빌드를 깼다(`Expected ")" but found "className"`). CLAUDE.md 에도 있는 함정이다. */}
        {entry ? (
          <button className="bar-btn" aria-label="일기 삭제" onClick={() => { removeDiary(entry.id); nav.showToast('일기를 지웠어요'); nav.pop() }}>
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
