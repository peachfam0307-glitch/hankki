import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { ocrImage, keyCount } from '../ocr'
import { extractReceiptItems } from '../receipt'
import Icon from './Icon'
import Thumb from './Thumb'
import FoodIcon, { guessIngredientIcon } from './FoodIcon'
import FoodIconPicker from './FoodIconPicker'
import EmojiPicker from './EmojiPicker'
import CropSheet from './CropSheet'
import Portal from './Portal'
import { useLayerBack } from '../useBackHandler'
import { guessEmoji } from '../emoji'
import { pantryScore, countPantryHits } from '../pantryMatch'
import { 열쇠받기, EARN, KEY_NAME, KEY_UNIT } from '../ocr'

// 🥕 냉장고 한 줄에 붙일 그림. 창업자 제보 *"재료 하나만 담아도 큰 이미지가 생겨서 재료가 안보였어."*
//   ⛔⛔ **이미 담아둔 재료도 같이 고쳐져야 한다**(규칙 18 ⓙ) — 담을 때 `icon` 이 굳어 저장되기 때문에
//      새로 담는 길만 고치면 창업자 폰의 애호박은 「완성 접시」 그대로다.
//   ✅ 그래서 «저장된 키»가 요리 사진이면 버리고 다시 고른다.
//   ⭐ 단 **직접 고른 것(`iconPicked`)은 건드리지 않는다** — 픽커에서 일부러 골랐으면 그게 맞다(v9.77 과 같은 문법).
function 재료그림(p) {
  if (p.iconPicked && p.icon) return p.icon      // 직접 고른 것 = 그대로
  return guessIngredientIcon(p.name || '')       // 자동으로 붙은 것 = «지금» 규칙으로 다시 고른다
}

function toYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysLeft(expiry) {
  if (!expiry) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(expiry + 'T00:00:00'); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function expiryChip(n) {
  if (n === null) return null
  if (n < 0) return { text: `${-n}일 지남`, cls: 'exp-over' }
  if (n === 0) return { text: '오늘까지', cls: 'exp-soon' }
  if (n <= 3) return { text: `D-${n}`, cls: 'exp-soon' }
  if (n <= 7) return { text: `D-${n}`, cls: 'exp-mid' }
  return { text: `D-${n}`, cls: 'exp-ok' }
}

export default function PantryView() {
  const store = useStore()
  const { pantry, recipes } = store
  const nav = useNav()
  const [form, setForm] = useState(null) // null | {} (새로 담기) | item (편집)
  const [scanPct, setScanPct] = useState(null) // null | 0~100 — 영수증 읽는 중
  const [found, setFound] = useState(null) // null | [{name, on}] — 영수증에서 찾은 재료 확인
  const [receiptCrop, setReceiptCrop] = useState(null) // 자르기 단계(품목 부분만)
  // 열린 팝업(영수증 확인·담기 폼) — 뒤로가기로 닫기(크롭은 자체 처리)
  useLayerBack(!!found, () => setFound(null))
  useLayerBack(!!form, () => setForm(null))
  const receiptRef = useRef(null) // 앨범·캡처(저장된 사진)
  const receiptCamRef = useRef(null) // 바로 촬영(카메라)

  // 영수증 캡처/사진 → 품목 부분만 잘라 → 식재료만 골라 확인 후 냉장고에 담기
  const onReceipt = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setReceiptCrop(reader.result)
    reader.readAsDataURL(file)
  }

  const scanReceipt = async (img) => {
    setReceiptCrop(null)
    setScanPct(0)
    // noCrop: 영수증은 폰 캡처가 아니니 상태바 자르기(위·아래 5%)를 하지 않는다
    // receipt: 신뢰도 필터로 품목 줄을 버리지 않게 원문을 쓴다(파서가 노이즈를 거른다)
    const text = await ocrImage(img, (pct) => setScanPct(pct), { noCrop: true, receipt: true })
    setScanPct(null)
    const items = extractReceiptItems(text)
    if (!items.length) {
      nav.showToast('영수증에서 식재료를 찾지 못했어요 · 품목 부분만 잘라서 다시 해보세요')
      return
    }
    setFound(items.map((name) => ({ name, on: true })))
  }

  const saveFound = () => {
    const names = [...new Set((found || []).filter((f) => f.on).map((f) => f.name.trim()).filter(Boolean))]
    let added = 0
    names.forEach((nm) => {
      if (!pantry.some((p) => p.name === nm)) {
        store.addPantry({ id: newId(), name: nm, icon: guessIngredientIcon(nm), expiry: null, addedAt: Date.now() })
        // 🎁 냉장고를 처음 채웠다 — 평생 1회(서버가 판정) · ⛔여기선 토스트를 안 띄운다(장보기 흐름 한가운데다)
        열쇠받기(EARN.냉장고)
        added++
      }
    })
    setFound(null)
    nav.showToast(added ? `재료 ${added}개를 냉장고에 넣었어요` : '이미 냉장고에 다 있어요')
  }

  const sorted = [...pantry].sort((a, b) => {
    const da = daysLeft(a.expiry)
    const db = daysLeft(b.expiry)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  // 냉장고 파먹기 — 보유 재료가 들어가는 레시피를 «가진 만큼» 순으로.
  // ⛔⛔ 예전엔 `ings.includes(p.name)` 로 **풀네임을 글자 그대로** 찾았다 →
  //    「돼지고기 앞다리살」이 「돼지고기 300g」에 **영영 안 걸렸다.** 영수증·손입력은 뒤에
  //    부위·용량이 붙는데 그걸 통째로 맞추려 한 것이다(2026-08-10에 찾았다).
  // ⭐ 이제 「오늘 뭐 해먹지」와 **같은 판단**을 쓴다(`src/pantryMatch.js`) —
  //    두 화면이 같은 냉장고를 보고 딴 요리를 말하면 안 된다.
  // ⚠️⚠️ **세우는 값과 보여주는 값을 갈라야 한다** — 카드에 「가진 재료 N개」가 찍힌다.
  //    `pantryScore` 는 «같은 개수면 재료 적은 쪽이 이기게» 소수를 얹은 값이라 그대로 쓰면
  //    화면에 **「가진 재료 1.0833333개」**가 뜬다(재현판이 잡았다 · 2026-08-10).
  // ⛔⛔ [2026-08-12] 창업자 제보 *"재료 하나만 담아도 큰 이미지가 생겨서 재료가 안보였어."*
  //   📌📌 **내가 이걸 「재료 타일 아이콘이 크다」로 읽고 타일을 46→38 로 줄였다. 그게 아니었다.**
  //      실측(368×818 · 두부 하나만 담음) — 추천 카드 4장이 **414px** 을 먹어
  //      **두부 줄이 y=847 로 화면(818) «밖»** 이었다. 타일을 8px 줄여도 소용이 없다.
  //      📌 규칙 18 — 증상의 «이유»를 내가 정하면 처방이 통째로 빗나간다. 재서 알았다.
  //   ⭐ 재료 하나로 네 개를 미는 건 «추천»이 아니라 «나열»이다 — 넷 다 「가진 재료 1개」다.
  //      담은 재료가 적으면 추천도 한 줄만. 그러면 담은 재료가 화면 안으로 들어온다.
  //   ⛔ 「냉장고 재료함을 위로」는 안 한다 — 2026-08-10 창업자 지시가 *"재료를 넣으면 레시피를
  //      추천해주는게 주가 되어야 할 듯"* 이라 추천이 맨 위인 것은 «맞다».
  //   ⭐⭐ [2026-08-12] 창업자 *"냉장고-가진재료로 만들기(지금은 2개 추천 여러개 추천되면 옆으로 넘기게)"*
  //      → **개수를 줄이는 대신 «가로 한 줄»로 바꿨다.**
  //      ⭐ 이게 바로 위 8/12 사고(두부 y=847)의 «진짜» 해법이다 — 세로로 쌓으면 추천이 늘 때마다
  //         담은 재료가 아래로 밀리는데, 가로 한 줄이면 **추천이 몇 개든 높이가 안 변한다.**
  //         그래서 「재료가 하나면 2장만」이라는 임시 처방을 걷어냈다.
  //      ⛔ 새 클래스를 안 만들었다 — `.hscroll` 이 이미 홈·장보기에서 쓰는 가로 줄이다.
  //         (v9.99 에 새 이름 `.hscroll` 을 지었다가 «같은 이름의 기존 클래스»와 부딪혀
  //          칩이 라벨을 12px 덮은 적이 있다 → 이름을 새로 짓기 전에 grep 부터.)
  //      ⚠️ 상한은 남긴다 — 레시피가 100편이면 카드도 100장이라 그리는 값이 아깝다.
  const 추천상한 = 12
  const matches = recipes
    .map((r) => ({ r, n: countPantryHits(r, pantry), score: pantryScore(r, pantry) }))
    .filter((m) => m.n > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 추천상한)

  // 🍳 「가진 재료로 만들 수 있는 것」 칸 — **화면 맨 위**에 놓으려고 여기서 만든다.
  //    ⚠️ JSX 로 미리 만들어 두는 이유 = 아래 재료 목록보다 «먼저» 그려야 하는데,
  //       `matches` 는 목록보다 아래에서 계산되던 코드라 자리를 옮기기만 하면 순서가 꼬인다.
  const 추천칸 = matches.length > 0 ? (
    <>
      <div className="sec-head" style={{ marginTop: 2 }}><div className="h-section">가진 재료로 만들 수 있어요</div></div>
      {/* ⭐ 가로 한 줄 — 다음 카드가 «살짝 걸치게» 폭을 잡아 「옆으로 넘긴다」가 글자 없이 전해진다.
          ⚠️ `.hscroll > *` 는 `flex: 0 0 auto` 라 폭을 «안 주면» 카드가 내용 크기로 쪼그라든다.
          📜 가로 스크롤 막대는 `App.jsx` 의 `ScrollHint` 가 알아서 그린다(화면에서 넘치는 줄을 찾는다).
          ⛔⛔ `inset` 이 «반드시» 있어야 한다 — 맨 `.hscroll` 은 `margin: 0 -20px` 로 화면 padding 을
             되돌려 카드를 화면 끝까지 흘린다. 그러면 **첫 카드가 왼쪽 끝에 붙어 제목 글자가 깎인다**
             (캡처로 봤다 — 「돼지고기 김치찌개」의 첫 글자가 잘렸다 · 규칙 21).
             창업자가 v10.21 에 *"왼쪽이 잘린 것 같아"* 로 잡은 것과 같은 모양이다.
          📐 폭 41% — ⛔48%(＝격자와 같은 157px)로 뒀더니 **두 장이 칸을 꽉 채워 세 번째가 2px** 만
             남았다. 그러면 「옆으로 넘긴다」가 아무에게도 안 보인다(캡처로 봤다).
             41% 면 세 번째가 ~36px 걸쳐서 **글자 없이도 「더 있다」가 전해진다.**
             ⭐ 좁혀도 제목은 안 잘린다 — `.grid-card .name` 에 `nowrap` 이 없어 두 줄로 접힌다. */}
      <div className="hscroll inset" style={{ marginBottom: 4 }}>
        {matches.map(({ r, n }) => (
          <button key={r.id} className="grid-card press" style={{ flex: '0 0 41%', textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
            <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
            <div className="name">{r.title}</div>
            <div className="date">가진 재료 {n}개</div>
          </button>
        ))}
      </div>
    </>
  ) : pantry.length > 0 ? (
    // 재료는 있는데 딱 맞는 게 없을 때 — 빈 자리를 두지 않는다
    <>
      <div className="sec-head" style={{ marginTop: 2 }}><div className="h-section">한끼 추천</div></div>
      <div className="t-sub" style={{ fontSize: 15.5, marginTop: -2, marginBottom: 12 }}>
        가진 재료로 딱 맞는 레시피가 없네요. 실패 없는 기본 메뉴는 어때요?
      </div>
      <div className="grid2" style={{ marginBottom: 4 }}>
        {recipes
          .filter((r) => String(r.id).startsWith('basic-'))
          .slice(0, 4)
          .map((r) => (
            <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
              <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
              <div className="name">{r.title}</div>
              <div className="date">기본 제공</div>
            </button>
          ))}
      </div>
    </>
  ) : null

  return (
    <div className="fade">
      {/* 📣📣 **이 화면이 무엇을 하는 곳인지 맨 위에 한 줄** (창업자 2026-08-10
          *"재료를 넣으면 레시피를 추천해주는게 주가 되어야 할 듯. 안내도 해야하고."*)
          ⛔⛔ 예전엔 이 화면이 **「영수증 스캔」으로 시작**했다 — 15.5px 굵은 제목 ＋ 채움색 큰 버튼(그림자까지).
             정작 «왜 넣는가»(추천이 온다)는 **빈 냉장고일 때 안내문에만** 있었다.
             창업자: *"영수증스캔이 버튼이 더 커서. 영수증 스캔하는 탭이라고 생각할 것 같아."* — 맞다.
          ⭐ 영수증은 **재료를 넣는 여러 길 중 하나**지 이 화면의 목적이 아니다. */}
      <div className="pantry-lead">
        <Icon name="sparkle" size={16} color="var(--brown)" stroke={2} />
        <span>재료를 넣어두면 <b>그걸로 만들 요리</b>를 골라줘요 · 유통기한도 챙겨주고요</span>
      </div>

      {/* ⭐⭐ **결과를 «먼저» 보여준다** — 그래야 「왜 넣는지」가 설명 없이 전해진다.
          예전엔 파먹기가 재료 목록 «아래»라, 재료가 쌓일수록 화면 밖으로 밀려나 아무도 못 봤다
          (창업자도 오늘 처음 봤다 — *"아.. 아래 있구나"*). */}
      {/* 🧊📐 [창업자 2026-08-26] *"패드 냉장고쪽이 지금 가로야. **장보기처럼 이분할로 만들어야해.**"*
          ⭐ 짜임을 «장보기와 같게» 맞춘다 — 왼쪽 = 추천(파먹기) · 오른쪽 = 재료함.
             둘은 성격이 다르다(보는 것 ↔ 넣고 지우는 것)라 나란히 두면 오가지 않아도 된다.
          ⛔ DOM 순서는 «추천 먼저»로 둔다 — 폰에선 1열이라 그대로 위아래가 되고,
             「결과를 먼저 보여준다」(창업자 2026-08-10)가 폰에서 안 깨진다.
             📌 장보기()가 쓴 방법과 같다. */}
      <div className="pantry-pair">
      <div className="pantry-reco">{추천칸}</div>
      <div className="pantry-box">

      {/* ⚠️ 추천 카드 바로 밑이라 여백이 없으면 «카드에 붙은 글»처럼 읽힌다(검수판에서 보였다) */}
      <div className="sec-head" style={{ marginTop: 18 }}>
        <div className="h-section">냉장고 재료함</div>
      </div>
      {/* 🔘 **＋재료 담기가 «주» · 영수증은 «보조»** — 버튼 크기가 곧 「이 화면이 뭐 하는 곳인가」를 말한다. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className="press"
          onClick={() => setForm({})}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '13px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--brown)', color: '#fff', fontSize: 17, fontWeight: 700,
            boxShadow: '0 3px 10px rgba(90,70,45,0.18)',
          }}
        >
          <Icon name="plus" size={17} stroke={2.4} /> 재료 담기
        </button>
        <button
          className="press"
          onClick={() => receiptCamRef.current?.click()}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '13px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 16.5, fontWeight: 700,
          }}
        >
          <Icon name="camera" size={16} color="var(--brown)" />
          영수증
          {/* 베타 = 영수증«만» 베타다. 화면 전체가 베타로 읽히면 안 된다 */}
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', background: '#c79553', borderRadius: 999, padding: '2px 6px' }}>베타</span>
        </button>
      </div>
      {/* 📮📮 2026-08-15 창업자 *"갤러리에 저장된 영수증을 불러올 수 있는 기능이없음. 매번 새로 찍어야함."*
          ⭐⭐ **기능은 «있었다».** 바로 이 자리에 있었는데 **12.5px 회색 글자**라
             큰 「영수증 📷」 단추 옆에서 안 보였다.
          📌 「없다」가 아니라 **「우리가 숨겨 놨다」** — 그래서 «찍기»와 «불러오기»를 나란히 같은 크기로 놓는다.
          ⛔ 옛 판처럼 작은 글자 링크로 되돌리지 말 것. */}
      <button
        className="press"
        onClick={() => receiptRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '13px 14px', borderRadius: 'var(--r-md)', marginBottom: 9,
          background: 'var(--cream)', color: 'var(--brown)', fontSize: 16.5, fontWeight: 700,
        }}
      >
        <Icon name="photo" size={16} color="var(--brown)" />
        갤러리에서 영수증 고르기
      </button>
      {/* 💰💰 [2026-08-21] 여기가 «조용히 깎이던» 자리다 — 이 화면에 장수 얘기가 **한 줄도 없었다.**
          🔢 실측 = `ocrImage()`(돈 드는 AI 스캔)를 부르는 곳은 셋이고 이 화면이 그중 하나다(79줄).
             그런데 안내는 편집 화면 하나에만 있었다.
          ⛔⛔ **모르게 깎이는 게 제일 나쁘다** — 창업자 확정(2026-08-13) =
             *"유저가 몇장남았는지 스스로 알아야해"* · 분쟁·환불 1순위가 «샀는데 어디 갔지» 다.
             영수증은 여러 장 찍기 쉬운 자리라(장 볼 때마다) 모르면 더 빨리 준다.
          ⭐ 편집 화면과 «같은 문장 틀»로 쓴다 — 「N장에 AI 스캔 N장」.
             자리마다 말이 다르면 유저가 «다른 규칙»으로 읽는다(같은 기능은 같은 이름 원칙). */}
      <div style={{
        paddingLeft: 10, marginBottom: 10,
        borderLeft: '3px solid var(--danger)', wordBreak: 'keep-all',
      }}>
        {/* ⛔ 둘째 줄(「다 써도 기본 인식으로 계속」)을 뺐다 — 창업자 *"다 구구절절이야 헷갈린다고"*.
               «다 썼을 때» 할 말을 쓰기도 전에 깔아 두면 한 번에 둘을 읽어야 한다.
               ⭐ 소진 안내는 그때 이미 나간다(`ocr.js` note → 편집 화면 꼬리). */}
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-.3px' }}>
          영수증 1장에 {keyCount(1)}를 써요
        </div>
      </div>
      {/* 🔠 [창업자 확정 2026-08-26] 15.3/1.55 → 16/1.7.
          📮 창업자 = *"냉장고 한 줄은 올려줘"*
          ⛔ 로드맵이 이 «한 줄»을 「냉장고 글자」로 적어 놔서 계속 미해결로 남아 있었다 —
             진짜 재료 글자는 이미 18px 다(`styles.css:1237` · 창업자 2026-08-22 확정). */}
      <div style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 14 }}>
        영수증은 사진에 따라 인식률이 달라요 · 안 되면 <b style={{ color: 'var(--brown)' }}>＋재료 담기</b>로 직접 넣어도 돼요.
      </div>

      <input ref={receiptCamRef} type="file" accept="image/*" capture="environment" onChange={onReceipt} style={{ display: 'none' }} />
      <input ref={receiptRef} type="file" accept="image/*" onChange={onReceipt} style={{ display: 'none' }} />

      {receiptCrop && (
        <CropSheet
          image={receiptCrop}
          title="영수증에서 품목만 남기기"
          hint={
            <>
              {/* ⚠️⚠️ **베타 안내는 «스캔하는 순간»에 · «잘 보이는 색»으로** (창업자 2026-08-10
                  *"영수증은 스캔할때 베타버전으로 인식률떨어질 수 있다고 적어놓으면 좋을 것 같아
                  (대신 잘보이는 색상으로)"*)
                  ⛔ 예전엔 이 말이 **냉장고 화면의 작은 회색 글씨**로만 있었다 — 정작 찍는 사람은 못 본다.
                  ⭐ 여기 배경이 어두워서 회색(`#8f8b83`)은 묻힌다 → 베타 뱃지와 같은 계열의 **밝은 살구색**. */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                background: 'rgba(240,180,90,0.18)', border: '1px solid rgba(240,180,90,0.55)',
                color: '#f6c886', borderRadius: 999, padding: '5px 12px', fontSize: 15.5, fontWeight: 800,
              }}>
                베타 · 영수증에 따라 잘못 읽을 수 있어요
              </span>
              <br />
              위·아래 매장 정보·합계는 빼고 <b style={{ color: '#f0ede7' }}>상품명·가격이 적힌 부분만</b> 남겨주세요.
              <br />
              <span style={{ color: '#8f8b83', fontSize: 15 }}>딱 맞게 자를수록 · 반듯하고 밝을수록 정확해요 · 담기 전에 한 번 더 확인해요</span>
            </>
          }
          onDone={scanReceipt}
          onSkip={() => scanReceipt(receiptCrop)}
          onCancel={() => setReceiptCrop(null)}
        />
      )}

      {form && <PantryForm item={form} onClose={() => setForm(null)} />}

      {scanPct !== null && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ocr-spin" style={{ width: 26, height: 26, borderWidth: 3, margin: 0 }} />
          <div style={{ fontSize: 16.5, fontWeight: 600 }}>영수증에서 식재료 찾는 중… {scanPct}%</div>
        </div>
      )}

      {found && (
       <Portal>
        <div className="sheet-mask" onClick={() => setFound(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>영수증에서 찾은 재료</span>
              <button className="press" onClick={() => setFound(null)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0', maxHeight: '48vh', overflowY: 'auto' }}>
              <div className="t-sub" style={{ fontSize: 15.5, marginBottom: 10 }}>
                아닌 것은 체크를 풀고, 이름은 눌러서 고칠 수 있어요.
              </div>
              {found.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <button
                    className="press"
                    onClick={() => setFound(found.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                    aria-label="선택"
                    style={{
                      width: 26, height: 26, borderRadius: 8, flex: '0 0 auto',
                      background: f.on ? 'var(--brown)' : 'var(--cream)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {f.on && <Icon name="check" size={15} color="#fff" stroke={2.6} />}
                  </button>
                  <div className="emoji-tile" style={{ width: 38, height: 38, flex: '0 0 auto' }}>
                    <FoodIcon name={guessIngredientIcon(f.name)} size={24} />
                  </div>
                  <input
                    className="wa-inp"
                    style={{ flex: 1, opacity: f.on ? 1 : 0.45 }}
                    value={f.name}
                    onChange={(e) => setFound(found.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px 0' }}>
              <button className="btn-primary press" style={{ width: '100%' }} onClick={saveFound} disabled={!found.some((f) => f.on)}>
                선택한 {found.filter((f) => f.on).length}개 냉장고에 담기
              </button>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {pantry.length === 0 && !form && (
        <div className="empty" style={{ padding: '30px 24px' }}>
          {'집에 있는 재료를 넣어두세요.\n유통기한도 챙겨주고, 그 재료로 만들 요리도 추천해줘요.'}
        </div>
      )}

      {/* 📅📅 **[2026-08-16] 「유통기한을 챙겨준다」를 «보이는 상자»로** — 창업자 두 번 짚음
          📮 *"눌러야 유통기한이랑 관리 안내가 뜨는데. **나도 몰랐었거든.**"*
          📮 *"**유통기한 관리를 해준다는 것도 모를 것 같아. 나도 그랬으니까.**"*
          ⛔⛔ 만든 사람이 두 번 다 몰랐다 = 화면이 그 말을 «안 하고 있었다»는 뜻이다.
             맨 위 한 줄(`pantry-lead`)에 「유통기한도 챙겨주고요」가 꼬리처럼 붙어 있긴 했는데,
             **꼬리로 붙은 말은 안 읽힌다.** 그리고 「그래서 내가 뭘 해야 하나」가 없었다.
          ⭐ 그래서 **재료 목록 «바로 위»**에 상자로 둔다 — ⑴무엇을 해주는지 ⑵내가 뭘 눌러야 하는지 둘 다.
             ⛔ 처음엔 「냉장고 재료함」 제목 밑에 뒀는데, 그 사이에 «재료 담기·영수증» 버튼 셋이 끼어
                **말하는 것(재료 줄)에서 한 화면 멀어졌다.** 안내는 가리키는 것 옆에 있어야 한다.
          ⚠️ 재료가 없을 땐 안 띄운다 — 빈 화면 안내가 이미 말하고 있어서 잔소리가 된다.
          ⚠️ 「기한이 되면 알림이 온다」고는 쓰지 않는다 — 우리는 **줄 옆에 D-3 같은 표를 붙일 뿐**이다.
             ⛔ 못 하는 걸 한다고 쓰면 그게 다음 제보가 된다. */}
      {pantry.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', marginBottom: 9, borderRadius: 'var(--r-md)', background: 'var(--cream)' }}>
          <span style={{ flex: '0 0 auto', marginTop: 1 }}><Icon name="clock" size={15} color="var(--brown)" stroke={2.2} /></span>
          <span style={{ fontSize: 15.5, lineHeight: 1.55, color: 'var(--text)' }}>
            <b style={{ color: 'var(--brown)', fontWeight: 700 }}>유통기한을 대신 세어 드려요</b> — 기한이 가까우면 재료 옆에 <span className="exp-chip exp-soon" style={{ fontSize: 15, padding: '1px 6px' }}>D-3</span> 처럼 표시돼요.
            <br />재료를 <b style={{ color: 'var(--brown)', fontWeight: 700 }}>누르면</b> 유통기한 · 수량 · 보관 메모를 적을 수 있어요.
          </span>
        </div>
      )}
      {sorted.map((p) => {
        const chip = expiryChip(daysLeft(p.expiry))
        // 🧊 [2026-08-23] 옛 판은 둘을 « · »로 «한 덩어리 글자»로 이어 붙였다 → 갈라 둔다(아래 참조)
        const 기한글 = p.expiry ? `유통기한 ${p.expiry.replace(/-/g, '.')}` : ''
        const 메모글 = String(p.memo || '').trim()
        return (
          <div key={p.id} className="wish-row">
            {/* 재료를 탭하면 편집(수량·유통기한·이모지·메모) */}
            <button className="press" onClick={() => setForm(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textAlign: 'left' }}>
              {/* 🔽 [2026-08-12] 창업자 *"장보기에 재료담으면 음식아이콘이 너무 커서 장보기 재료가 안보임"*
                  🔢 옛 값 = 타일 46×46 ＋ 아이콘 28. 한 줄이 [타일 46] ＋ gap 12 ＋ [이름] ＋ [유통기한 칩] ＋ [✕]
                     이라, 좁은 폰(360px)에서 이름 칸이 눌려 «말줄임(…)»으로 잘렸다.
                  ✅ 타일 46→**38** · 아이콘 28→**24** · gap 12→**10** → 이름 칸이 **10px** 넓어진다.
                  ⛔ 더 줄이지 않는다 — 38 은 영수증 확인 시트(`:284`)와 같은 값이라 앱 안에서 결이 맞는다. */}
              <div className="emoji-tile" style={{ width: 38, height: 38, flex: '0 0 auto', fontSize: 23 }}>
                {p.thumb === 'emoji' && p.emoji ? p.emoji : <FoodIcon name={재료그림(p)} size={24} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}{p.qty ? <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}> · {p.qty}</span> : null}
                </div>
                {/* 👆👆 **[2026-08-16] 「누르면 열린다」를 «줄 안»에서 보여준다** — 창업자 제보
                    📮 *"냉장고에서 재료 누르는 것 모르는 경우가 있을 것 같아. 눌러야 유통기한이랑
                       관리 안내가 뜨는데. **나도 몰랐었거든.**"*
                    ⛔⛔ 만든 사람도 몰랐다 = **화면에 그런 표시가 없었다**는 뜻이다.
                       유통기한이 «없는» 재료는 아랫줄이 통째로 비어서, 줄 전체가 그냥 «읽는 것»처럼 보였다.
                    ⭐ 그래서 빈 자리에 **할 일을 적어 둔다** — 누를 자리와 «눌러서 얻는 것»이 한 곳에 있다.
                    ⭐ 회색이 아니라 포인트색으로 — 회색이면 「설명」으로 읽히고, 색이 있어야 「누르는 것」이 된다. */}
                {/* 🧊🧊 **[2026-08-23 창업자] 유통기한·메모가 잘려서 «한눈에» 안 보였다**
                    📮 *"냉장고재료 유통기한 메모 한눈에보이게수정"*
                    🔢 실물 = 「유통기한 2026.09.06 · 냉…」 — 보관 메모가 첫 글자만 남고 잘렸다.
                    ⛔ 뿌리 = 둘을 « · »로 이어 붙여 **한 덩어리 글자**로 만들고 `nowrap` ＋ 말줄임을 걸었다.
                       칩(D-14)·✕까지 같은 줄에 있어 남는 폭이 좁은데 거기에 둘을 욱여넣었다.
                    ⛔⛔ **처음 고침(두 줄 흐르게)도 모자랐다** — 실측 「유통기한 2026.09.06 · 냉동실 문쪽 ·
                       봉지 열었음」이 두 줄에서도 잘렸다. 이어 붙인 채로는 **메모가 길수록 날짜까지 같이 밀린다.**
                       📌 급한 건 «날짜»인데 덜 급한 메모가 날짜를 밀어내는 구조였다.
                    ✅ **둘을 갈라 둔다** — 날짜는 «자기 줄»에서 절대 안 잘리고(`nowrap`),
                       메모만 아래에서 두 줄까지 흐른다. 그래서 날짜는 «언제나» 다 보인다.
                    ⭐ 높이는 있는 만큼만 는다 — 날짜만 있으면 한 줄(옛 판과 같다), 짧은 메모면 두 줄. */}
                {기한글 && (
                  <div className="t-sub" style={{
                    marginTop: 2, fontWeight: 600, color: 'var(--brown)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{기한글}</div>
                )}
                {메모글 && (
                  <div className="t-sub" style={{
                    marginTop: 기한글 ? 1 : 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.35,
                  }}>{메모글}</div>
                )}
                {!기한글 && !메모글 && (
                    <div style={{ marginTop: 2, fontSize: 15, fontWeight: 600, color: 'var(--brown)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      눌러서 유통기한 · 보관 메모 넣기
                      <Icon name="chevron-right" size={13} stroke={2.4} />
                    </div>
                  )}
              </div>
            </button>
            {chip && <span className={`exp-chip ${chip.cls}`}>{chip.text}</span>}
            <button className="icon-btn press" onClick={() => store.removePantry(p.id)} aria-label="삭제">
              <Icon name="x" size={17} color="var(--sand)" />
            </button>
          </div>
        )
      })}

      {/* ⛔ 「가진 재료로 만들 수 있어요」·「한끼 추천」은 **맨 위로 옮겼다**(위 `추천칸`).
          여기 아래에 두면 재료가 쌓일수록 화면 밖으로 밀려 아무도 못 본다. */}
      </div>{/* .pantry-box */}
      </div>{/* .pantry-pair */}
    </div>
  )
}

// 냉장고 재료 담기·편집 — 아이콘/이모지(식재료만) · 이름 · 수량 · 유통기한 · 메모.
// item 에 id 가 있으면 편집, 없으면 새로 담기.
const FOOD_EMOJI_GROUPS = ['밥·면', '고기·해산물', '채소', '유제품·빵', '양념', '과일', '음료', '디저트']

function PantryForm({ item, onClose }) {
  const { addPantry, updatePantry, removePantry } = useStore()
  const nav = useNav()
  const editing = !!item.id
  const [name, setName] = useState(item.name || '')
  const [thumb, setThumb] = useState(item.thumb || 'icon') // 'icon' | 'emoji'
  const [icon, setIcon] = useState(item.icon || 'default')
  const [emoji, setEmoji] = useState(item.emoji || '🥬')
  const [iconPicked, setIconPicked] = useState(!!item.icon)
  const [qty, setQty] = useState(item.qty || '')
  const [expiry, setExpiry] = useState(item.expiry || '')
  const [memo, setMemo] = useState(item.memo || '')

  const setNm = (v) => {
    setName(v)
    if (!iconPicked) { setIcon(guessIngredientIcon(v)); setEmoji(guessEmoji(v)) }
  }
  const quick = (days) => { const d = new Date(); d.setDate(d.getDate() + days); setExpiry(toYMD(d)) }

  const save = () => {
    const nm = name.trim()
    if (!nm) return
    const data = {
      name: nm,
      thumb,
      icon: iconPicked ? icon : guessIngredientIcon(nm),
      // ⭐ 「직접 골랐다」를 저장한다 — 안 남기면 목록에서 자동 추천과 구분이 안 돼 골라둔 그림이 지워진다
      iconPicked: iconPicked || undefined,
      emoji: thumb === 'emoji' ? emoji : (item.emoji || null),
      qty: qty.trim(),
      expiry: expiry || null,
      memo: memo.trim(),
    }
    if (editing) { updatePantry(item.id, data); nav.showToast('재료를 수정했어요') }
    else {
      addPantry({ id: newId(), addedAt: Date.now(), ...data })
      nav.showToast('냉장고에 넣었어요')
      // 🎁 냉장고를 처음 채웠다 — 평생 1회(서버가 판정)
      //   ⛔⛔ 2026-09-01 창업자 제보 = *"냉장고에 재료 넣어도 열쇠 안차. 다른거 4개는 다 되고"*
      //      영수증 스캔 길(saveFound)에만 붙이고 **여기(직접 넣기)를 빠뜨렸다.**
      //      📌 유저가 쓰는 길이 «둘»인데 한쪽만 봤다. 넣는 자리는 `addPantry` 를 «전수»로 찾는다.
      열쇠받기(EARN.냉장고)
    }
    onClose()
  }

  return (
   <Portal>
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 0 }}>
        <div className="emoji-sheet-head">
          <span>{editing ? '재료 편집' : '재료 담기'}</span>
          <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
        </div>
        <div style={{ padding: '2px 16px 0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            {thumb === 'emoji' ? (
              <EmojiPicker value={emoji} size={64} only={FOOD_EMOJI_GROUPS} onChange={(e) => { setEmoji(e); setIconPicked(true) }} />
            ) : (
              <FoodIconPicker value={icon} size={64} mode="ing" onChange={(k) => { setIcon(k); setIconPicked(true) }} />
            )}
            <div style={{ flex: 1 }}>
              <input className="wa-inp" value={name} onChange={(e) => setNm(e.target.value)} placeholder="재료 이름 (예: 두부)" autoFocus={!editing} />
              <input className="wa-inp" style={{ marginTop: 8 }} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="수량 (예: 2팩, 500g) · 선택" />
            </div>
          </div>

          {/* 썸네일 방식 — 아이콘(재료 그림) / 이모지(식재료만) */}
          <div className="segment" style={{ margin: '0 0 10px' }}>
            <button type="button" className={`seg ${thumb === 'icon' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 15.5 }} onClick={() => setThumb('icon')}>아이콘</button>
            <button type="button" className={`seg ${thumb === 'emoji' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 15.5 }} onClick={() => setThumb('emoji')}>이모지</button>
          </div>

          <div className="t-sub" style={{ fontSize: 15, marginBottom: 6 }}>유통기한</div>
          <input className="wa-inp" style={{ color: expiry ? 'var(--text)' : 'var(--text-sub)' }} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, margin: '8px 0 10px' }}>
            {[['+3일', 3], ['+7일', 7], ['+2주', 14]].map(([label, d]) => (
              <button key={label} className="chip-quick press" onClick={() => quick(d)}>{label}</button>
            ))}
            <button className="chip-quick press" onClick={() => setExpiry('')}>없음</button>
          </div>

          <input className="wa-inp" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (예: 냉동실 · 개봉함) · 선택" />
        </div>
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', display: 'flex', gap: 8, padding: '10px 16px calc(6px + var(--safe-bottom))' }}>
          {editing && (
            <button className="press" onClick={() => { removePantry(item.id); nav.showToast('냉장고에서 뺐어요'); onClose() }} style={{ padding: '13px 15px', borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 600, fontSize: 16 }}>삭제</button>
          )}
          <button className="press" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 16 }}>취소</button>
          <button className="press" onClick={save} style={{ flex: 1.4, padding: 13, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 700, fontSize: 16.5 }}>{editing ? '저장' : '넣기'}</button>
        </div>
      </div>
    </div>
   </Portal>
  )
}
