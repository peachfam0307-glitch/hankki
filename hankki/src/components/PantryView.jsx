import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { pantryKey, pantryUrgent, rankPantryRecipes, 급하다, 남은날수, 기한말 } from '../pantryMatch'
import { 열쇠받기, EARN, KEY_NAME, KEY_UNIT } from '../ocr'
// 🔑 열쇠 그림 — `KeyBadge`(가져오기·설정)가 쓰는 «바로 그 파일»이다.
//    ⭐ 새로 만들지 않는다: 같은 것이 앱 안에서 두 모양이면 유저가 다른 것으로 읽는다.
import uiKeyOne from '../assets/ui/key_one.png'

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

// 🗓 [2026-09-11] 여기 있던 `daysLeft`·`expiryChip` 을 `src/pantryMatch.js` 로 «옮겼다».
//   ⛔ 홈에도 같은 게 필요해져서 복사하려다 멈췄다 — 두 벌이 되면 언젠가 갈린다(오늘 두 번 겪었다).
//   ⚠️ 옛 `daysLeft` 는 날짜가 이상하면 `NaN` 을 그대로 내보내 「D-NaN」이 뜰 수 있었다.
//      공용 `남은날수` 는 그걸 `null` 로 막는다 — 이름만 바꾼 게 아니라 구멍도 하나 메운다.
const daysLeft = 남은날수
const expiryChip = 기한말

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
        // 🎁 냉장고를 처음 채웠다 — 평생 1회(서버가 판정)
        //   ⛔ 전엔 여기서 토스트를 안 띄웠다(*"장보기 흐름 한가운데다"*) — 그 판단이 틀렸다.
        //      받고도 모르면 「안 받았다」가 된다(창업자 2026-09-01).
        열쇠받기(EARN.냉장고).then((받음) => {
          if (받음) nav.showToast(`냉장고를 처음 채웠어요 · ${KEY_NAME} 1${KEY_UNIT}를 더 받았어요`, 5200)
        })
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
  // 🚨 임박도를 점수에 싣는다 — 「오늘내일 상하는 것」을 먼저 쓰게 (창업자 2026-09-08 제보)
  const 남은날 = (p) => daysLeft(p?.expiry)
  const 추천상한 = 12
  // 🏁 한 편당 «딱 한 번» 재고 그 값으로 줄 세운다.
  //    ⛔ 비교마다 다시 재면 1680편에서 283ms — 재료를 담을 때마다 그만큼 버벅인다(실측).
  //    ⭐ 급함 꼬리표는 «상한을 자른 뒤» 12편에만 만든다 — 안 보일 100편까지 만들 값이 없다.
  // 🥇 [창업자 확정 2026-09-10] 「임박하는게 1순위 그다음 할게 많은 레시피가 2순위로 하자」
  //    ⛔ 점수 하나(`pantryScore`)로 세우던 것을 «잣대 넷»으로 바꿨다 — 무게로 섞으면
  //       「D-3 하나(2점)」가 「보통 셋(3점)」에 져서 급한 두부가 여전히 안 떴다.
  //
  // ⛔⛔ **[2026-09-11 창업자 제보] 「재료를 담아도 맨 위가 그대로다」**
  //    📸 창업자 폰 실측 = 냉장고 11칸 중 유통기한이 적힌 건 **두부 하나(1일 지남)**.
  //       그 두부를 쓰는 4편이 «급함=1» 이라 맨 앞 4장을 통째로 잡고 있었다.
  //       해물모듬·오징어·소고기·닭고기를 담아도 그걸 쓰는 편은 **5·8·14번째**로 밀렸고
  //       14번째는 상한 12장 «밖»이라 아예 안 보였다. 가로줄엔 2.5장만 보이니 **변화가 0**이다.
  //    ⭐⭐ 앱은 시킨 대로 했는데 창업자 눈엔 «고장»으로 보였다 — 규칙이 너무 세서 앞자리를 다 먹은 것이다.
  //    ⛔ 상한을 늘리거나 무게를 만지는 건 숫자 땜빵이다(절대원칙 34). 순서를 더 섞어도 급한 게 밀린다.
  //
  // ✅✅ **[창업자 확정 2026-09-11] 줄을 «둘»로 가른다** — 📮 *"윗줄은 임박재료들로 아랫줄은 냉장고재료들로"*
  //    ⭐ 한 줄에서 다투게 두지 않고 **역할을 나눈다**: 윗줄은 「급한 것부터」, 아랫줄은 「많이 쓰는 것」.
  //       그러면 담는 대로 아랫줄이 «즉시» 반응하고, 급한 것도 여전히 맨 위에 남는다.
  //    ⛔ 처음엔 「제일 급한 «날짜»의 재료만 윗줄」로 짰다가 창업자가 잡았다 —
  //       📮 *"유통기한급한게 2.3개면? 보통 장은 한꺼번에보자나"*
  //       장을 한 번 보면 두부 D-1 · 애호박 D-2 처럼 **날짜가 조금씩 다르다.** 날짜 하나만 보면
  //       애호박이 급한데도 윗줄에서 빠진다. ✅그래서 **임박한 건 전부 윗줄**, 대신 12장에서 자른다.
  //    ⭐ 그 덕에 「급한 재료를 «여러 개» 한 번에 쓰는 편」이 맨 앞에 온다 — 장 한꺼번에 본 사람에게 딱 맞다.
  //
  // 🔢 실측 (scratchpad `_fin.mjs` · 창업자 냉장고 11칸 기준 · 아랫줄은 윗줄과 겹치는 것을 뺀 값)
  //    임박 0개 → 윗 «안 뜸» · 아랫 29  |  1개 → 4 / 27  |  2개 → 8 / 25  |  3개 → 11 / 25
  //    6개(영수증 한 장) → 12 / 44  |  11칸 «전부» 임박 → 12 / 53
  //    ⭐ 아랫줄이 **어떤 경우에도 25장 밑으로 안 내려간다** — 겹치는 것을 빼도 안 마른다.
  //    ⭐ 겹침을 빼는 근거 = 창업자 걱정이 맞았다. 안 빼면 «보이는 3장 중 2장»이 두 줄에 똑같이 떴다
  //       (두부 요리는 냉장고 재료도 많이 써서 아랫줄에서도 상위권이라 그렇다 · `_overlap.mjs`).
  //
  // 🏁 한 편당 «딱 한 번» 재고 그 값으로 줄 세운다.
  //    ⛔ 비교마다 다시 재면 1680편에서 283ms — 재료를 담을 때마다 그만큼 버벅인다(실측).
  //    ⛔⛔ 그리고 이게 render 몸통에 있어서 **재료 이름을 한 글자 칠 때마다 통째로 다시 쟀다.**
  //       🔢 실측 = 168편×10칸 7.0ms · 400편×100칸 36.3ms · 2000편×300칸 494.4ms.
  //       ⭐ 지금은 안 느리지만 레시피가 늘면 «타이핑이» 버벅인다 → `useMemo` 로 묶는다(절대원칙 32 ④).
  const { 급한줄, 보통줄 } = useMemo(() => {
    const all = rankPantryRecipes(recipes, pantry, 남은날)
    const 윗 = all.filter((m) => m.급함 > 0).slice(0, 추천상한)
    const 윗id = new Set(윗.map((m) => m.r.id))
    // ⭐ 급함 꼬리표는 «상한을 자른 뒤»에만 만든다 — 안 보일 100편까지 만들 값이 없다.
    return {
      급한줄: 윗.map((m) => ({ ...m, 급함표: pantryUrgent(m.r, pantry, 남은날) })),
      보통줄: all.filter((m) => !윗id.has(m.r.id)),
    }
  }, [recipes, pantry])
  const matches = 급한줄.length ? 급한줄 : 보통줄   // 「아무것도 안 걸렸나」 판정용

  // 🚨 윗줄 제목에 «급한 재료 이름»을 박는다 — 왜 이 줄이 떴는지가 제목 한 줄로 전해진다.
  //    ⛔ 셋을 넘으면 「외 N개」로 줄인다(제목이 줄바꿈되면 카드가 아래로 밀린다 · 2026-08-12 사고).
  const 급한재료 = useMemo(() => {
    const 이름 = []
    for (const p of pantry || []) {
      const k = pantryKey(p?.name)
      if (k && 급하다(남은날(p)) && !이름.includes(k)) 이름.push(k)
    }
    return 이름
  }, [pantry])
  // 📐📐 **제목은 «글자 예산»으로 짓는다 — ⛔개수로 짓지 않는다.**
  //    ⛔⛔ 첫 판은 「이름 둘까지 붙이고 셋부터는 외 N개」였다. 재보니 **두 줄로 접혔다** —
  //       「두부·애호박 외 4개부터 쓰세요」(16자) · 「돼지고기 외 12개부터 쓰세요」(15자) 둘 다 ⛔.
  //       📌 **개수가 아니라 «글자 수»가 접히게 만든다.** 이름이 길면 하나만 넣어도 넘친다
  //          (앱에 실제로 「크러쉬드레드페퍼」·「홀그레인머스터드」가 있다 — 8자짜리).
  //    🔢 실측(360px ·  글꼴) = 쓸 수 있는 폭 **280px** · 글자당 약 **21px**
  //       → 제목은 **13자**가 한계다. 「부터 쓰세요」 6자를 빼면 **이름에 쓸 수 있는 건 7자.**
  //       ✅ 「두부부터 쓰세요」 167px · 「두부·애호박부터 쓰세요」 244px → 둘 다 한 줄
  //       ⛔ 「크러쉬드레드페퍼부터 쓰세요」 · 「돼지고기 외 12개부터 쓰세요」 → 두 줄
  //    ⭐ 그래서 **예산이 허락하는 만큼만 이름을 넣고**, 하나도 못 넣으면 이름을 뺀다.
  //       ⛔ 「외 N개」를 붙이지 않는다 — 그게 바로 길이를 다시 밀어 올리는 말이다.
  //       ⭐ **이름을 못 써도 잃는 게 없다** — 카드마다 「1일 지남 두부 · 재료 3개」가 이미 붙는다.
  //    ✅✅ **[창업자 확정 2026-09-11] 제목은 「임박재료부터 쓰기」로 «고정»한다.**
  //       📮 창업자 = *"제목을 바꾸는건? 임박재료부터 쓰기로"*
  //       ⭐⭐ 이게 «글자 수» 문제를 통째로 없앤다 — 재료 이름이 안 들어가니 **길이가 변할 일이 없다.**
  //          위 예산 계산도 필요 없어진다. 📌 **재료 이름을 제목에서 빼도 잃는 게 없다** —
  //          카드마다 「D-1 두부 · 재료 3개」가 이미 붙어서 «무엇이 급한지»를 카드가 말한다.
  //       ⛔ 그래서 「두부부터 쓰세요」식 «바뀌는 제목»은 버린다(이름이 길면 접혔다).
  const 급한줄제목 = '임박재료부터 쓰기'

  // 🔁🔁 [창업자 확정 2026-09-11] **줄마다 「돌리기」 — 뒤에 있던 편을 앞으로 데려온다.**
  //    📮 창업자 = *"순위뒤에있는것도 돌리기버튼? 만들어서 앞에오는거랑 섞어서 볼수있게해주면?
  //                  각줄에 후순위들도 있을거자나. **각줄끼리만**"*
  //    ⭐ 줄마다 «따로» 돈다 — 윗줄을 돌려도 아랫줄은 그대로다(창업자가 「각줄끼리만」이라고 못 박았다).
  //    📐 한 번에 **3장**씩 — 가로줄에 2.5장이 보이므로 «한 화면치»가 통째로 바뀐다.
  //       ⛔ 12장씩 넘기면 「섞어서 본다」가 아니라 「책장 넘기기」가 된다(창업자 말은 «섞어서»였다).
  //    ⛔⛔ **재료가 바뀌면 0으로 되돌린다** — 목록 길이가 바뀌면 `자리 % 길이` 가 통째로 튄다.
  //       📌 2026-08-28 에 홈에서 «똑같이» 당했다(`pick % 목록.length` — 매주 레시피가 열려 길이가
  //          바뀌자 끼워 둔 순서가 흩어졌다). 같은 함정을 두 번 밟지 않는다.
  const [윗돌림, set윗돌림] = useState(0)
  const [아랫돌림, set아랫돌림] = useState(0)
  const 냉장고키 = pantry.map((p) => p.id).join(',')
  useEffect(() => { set윗돌림(0); set아랫돌림(0) }, [냉장고키])

  const 돌린다 = (목록, 자리) => (자리 % (목록.length || 1) === 0 ? 목록 : [...목록.slice(자리 % 목록.length), ...목록.slice(0, 자리 % 목록.length)])

  // ⛔⛔⛔ **[2026-09-11 · 캡처를 눈으로 봐서 잡았다] 돌려도 «화면»이 안 바뀌던 진짜 이유**
  //    🔢 실측 = 돌린 «뒤» DOM 첫 카드는 「엄마표 김밥」인데 화면 그 자리엔 「떡국」이 있었다.
  //       그 줄의 `scrollLeft` 를 재니 **4976px** — 첫 카드가 x = −4956 으로 화면 왼쪽 밖이었다.
  //    ⭐⭐ 범인 = **크롬의 「스크롤 앵커링」**. 앞 3장을 맨 뒤로 보내면 브라우저가
  //       «보던 카드를 그 자리에 그대로 두려고» 가로 스크롤을 스스로 밀어준다.
  //       → 목록은 바뀌었는데 **눈에는 똑같은 카드가 계속 보인다.** 창업자 폰에서도 똑같았을 것이다.
  //    ⛔ 내 재현판도 이걸 못 잡았다 — **«DOM 순서»만 보고 «보이는 것»을 안 봤다**(규칙 18 ⓘ).
  //    ✅ 그래서 돌릴 때 **그 줄을 맨 앞으로 되돌린다.** 땜빵이 아니라 뜻이 맞는 동작이다 —
  //       「다른 걸 보여줘」를 눌렀으면 **처음부터** 보여주는 게 맞다.
  //    ⛔ `.hscroll` 에 `overflow-anchor: none` 을 거는 길도 있지만 **안 쓴다** —
  //       홈·장보기·레시피의 모든 가로 줄에 같이 걸려서 무엇이 흔들릴지 모른다(절대원칙 35 ②).
  //    ⛔ 누를 때 바로 `scrollLeft = 0` 을 하면 «소용없다» — 그 순간엔 아직 옛 카드가 그려져 있고,
  //       리액트가 다시 그린 «뒤»에 크롬이 앵커링으로 또 민다. 재현판이 실제로 그걸 잡았다.
  //    ✅ `useLayoutEffect` 로 **다시 그린 직후·화면에 칠하기 «전»** 에 되돌린다(깜빡임 없음).
  const 윗줄칸 = useRef(null)
  const 아랫줄칸 = useRef(null)
  useLayoutEffect(() => { if (윗줄칸.current) 윗줄칸.current.scrollLeft = 0 }, [윗돌림])
  useLayoutEffect(() => { if (아랫줄칸.current) 아랫줄칸.current.scrollLeft = 0 }, [아랫돌림])
  const 돌리기 = (set) => () => set((v) => v + 3)

  // 🃏 가로 카드 한 줄 — 두 줄이 «같은 모양»이라야 유저가 같은 것으로 읽는다.
  //    ⛔ 새 클래스를 안 만든다 — `.hscroll` 이 이미 홈·장보기에서 쓰는 가로 줄이다.
  //    ⛔⛔ `inset` 이 «반드시» 있어야 한다 — 맨 `.hscroll` 은 `margin: 0 -20px` 로 화면 padding 을
  //       되돌려 카드를 화면 끝까지 흘린다. 그러면 **첫 카드가 왼쪽 끝에 붙어 제목 글자가 깎인다**
  //       (캡처로 봤다 — 「돼지고기 김치찌개」의 첫 글자가 잘렸다 · 규칙 21).
  //    📐 폭 41% — 48%(＝격자와 같은 157px)면 두 장이 칸을 꽉 채워 세 번째가 2px 만 남는다.
  //       41% 면 세 번째가 ~36px 걸쳐서 **글자 없이도 「더 있다」가 전해진다.**
  //    📐📐 **[2026-09-11 창업자] 「이거 자리를 많이차지하는데 조금 줄이고」**
  //       ⛔⛔ **처음에 폭을 41% → 34% 로 줄였다가 «찍어서 눈으로 보고» 되돌렸다**(규칙 21).
  //          카드가 좁아지니 **이름이 두 줄로 접혔다**(「돼지고기 김치찌개」) — 아낀 만큼 도로 늘었다.
  //          🔢 실측 = 41% **415px** → 34% **407px**. **8px.** 자리를 줄인 게 아니라 글자만 망가뜨렸다.
  //       ✅ **답은 폭이 아니라 «썸네일 비율»이었다** — 폭은 그대로라 이름이 안 접힌다.
  //          🔢 실측(390폰 · 두 줄 합) = 1/1 **415px** → **5/4 357px(-58)** → 4/3 343 → 3/2 319
  //          ⭐ 5/4 를 골랐다 — 4/3·3/2 는 더 줄지만 요리 그림이 납작한 띠로 읽히기 시작한다.
  //          ⭐ 그림 자체는 안 잘린다 — `Thumb` 의 `ratio` 는 «칸»의 비율만 바꾸고 그림은 가운데 정사각이다.
  //       ⛔ 더 줄이려고 폭을 건드리지 말 것. 다음으로 자리를 먹는 건 **윗줄 꼬리말 두 줄 접힘**(38px)이다.
  // 🏷🏷 **[2026-09-11 창업자] 「2줄인거 간격맞춰서 2줄하거나 글자크기를 조금 줄이자」**
  //   ⛔ 「글자만 줄여 한 줄로」는 **못 푼다** — 숫자 땜빵이 된다(절대원칙 34).
  //      🔢 실측 = 「1일 지남 두부 · 재료 3개」 한 줄에 필요한 폭 : 15px **163** · 13px **141** · 12px **130**
  //         쓸 수 있는 카드 폭 = 360폰 **131** · 390폰 **144**.
  //         → 12px 까지 내려야 360폰에서 1px 차로 겨우 들어가는데, **재료 이름이 조금만 길면 또 접힌다**
  //           (「오늘까지 크러쉬드레드페퍼 · 재료 4개」는 12px 에서도 **202px**).
  //   ✅ **둘 다 조금씩** — 13px 로 줄이고 «가지런한 두 줄»로 고정한다.
  //      · 390폰에서는 흔한 경우 **한 줄로 떨어진다**(141 < 144) — 자리가 더 준다
  //      · 360폰·긴 이름은 **두 줄로 가지런히** 선다(줄간격을 정해서 어중간함을 없앤다)
  //      · `line-clamp: 2` = **세 줄로는 절대 안 터진다** — 카드마다 키가 들쭉날쭉해지는 걸 막는다
  //   ⛔ `.grid-card .date` 를 전역으로 고치지 않는다 — 홈·레시피가 같은 클래스를 쓴다(절대원칙 35 ②).
  //   ⛔⛔ **[같은 날 창업자] 「설명 2줄이 끊어지자나」 — 두 줄로 만든 것까지는 맞았는데 «아무 데서나» 끊겼다.**
  //      🔢 실제로 이렇게 갈라졌다 = 「1일 지남 두부 · 재료」 / **「3개」**. 「재료 3개」가 두 동강 났다.
  //      📌 줄이 두 개인 게 문제가 아니라 **말이 끊어진 게 문제**였다. 글자 크기로는 영영 못 고친다 —
  //         재료 이름 길이에 따라 «끊기는 자리»가 매번 달라지기 때문이다.
  //      ✅ **뜻 덩이마다 한 줄**로 못 박는다 — 「1일 지남 두부」 / 「재료 3개」.
  //         각 덩이는 `nowrap` 이라 «안에서는» 절대 안 끊기고, 덩이가 칸보다 길면 그 줄만 「…」로 준다.
  //         ⭐ 줄 수를 내가 정하지 않는다 — 짧으면 한 줄, 길면 두 줄. **끊기는 자리만 정한다.**
  const 꼬리말 = { fontSize: 13, lineHeight: 1.35 }
  const 한덩이 = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  const 카드줄 = (목록, 칸) => (
    <div className="hscroll inset" ref={칸} style={{ marginBottom: 4 }}>
      {목록.map(({ r, n, 급함표 }) => (
        <button key={r.id} className="grid-card press" style={{ flex: '0 0 41%', textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
          <Thumb recipe={r} ratio="5/4" radius={16} showDecor />
          <div className="name">{r.title}</div>
          {/* 🚨 왜 이게 떴는지 «한 줄 안에서» 보이게 — ⛔줄을 새로 늘리지 않는다
              (2026-08-12 창업자 *"재료 하나만 담아도 큰 이미지가 생겨서 재료가 안보였어"*) */}
          <div className="date" style={꼬리말}>
            {급함표?.length ? (
              <>
                {/* 📮 [창업자 확정 2026-09-11] 「1일 지남 두부가 아니라 두부 1일 지남으로하자」
                    ⭐ 재료가 «주어»다 — 유저가 찾는 건 「무엇을 써야 하나」이고 날짜는 그 다음이다. */}
                <span style={한덩이}>{급함표[0].이름} {expiryChip(급함표[0].남은날).text}</span>
                <span style={한덩이}>재료 {n}개</span>
              </>
            ) : (
              <span style={한덩이}>가진 재료 {n}개</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )

  // 🏷 줄 머리 — 제목 ＋ (돌릴 게 있을 때만) 돌리기 단추
  //    ⛔ 목록이 «보이는 장수»(3) 이하면 단추를 아예 안 그린다 —
  //       눌러도 아무 일이 없는 단추는 「고장」으로 읽힌다(규칙 19 「막다른 길」과 같은 생각).
  //    📐 `.sec-head` 가 이미 `flex ＋ space-between` 이라 자리는 그대로 쓴다 — 새 클래스를 안 만든다.
  //    ⛔⛔ **단추에 「돌리기」 글자를 넣었더니 제목이 두 줄로 접혔다**(캡처를 열어 보고 잡았다 · 규칙 21).
  //       🔢 실측 = 「가진 재료로 만들 수 있어요」를 한 줄로 넣으려면 **352px** 이 필요한데
  //          390px 폰은 **350px** 뿐이다(양옆 padding 20씩). **2px 이 모자라서** 접힌다.
  //          360px 폰은 320px 뿐이라 더 모자라고, 412px 에서만 한 줄이 됐다.
  //       ⛔ 「틈을 8px 로 줄이자」는 숫자 땜빵이다(절대원칙 34) — 360px 에선 어차피 안 된다.
  //       ⛔ 제목을 줄이는 것도 안 한다 — 창업자가 보는 글자를 내 맘대로 바꾸지 않는다.
  //       ✅ **단추에서 글자를 뺀다(60px → 22px)** — 그러면 «모든 폭»에서 제목이 한 줄이다.
  //          ⭐ 그림만으로도 「돌린다」가 전해지게 **테두리 있는 동그란 단추**로 만든다(누르는 것으로 읽히게).
  //          ⭐ 눈으로 못 읽는 사람에겐 `aria-label` 이 「다른 요리 보기」를 읽어 준다.
  //    🎨🎨 **[2026-09-11 창업자] 「섞기를 색알약으로 바꿔줄래?」 → 글자가 돌아왔다.**
  //       ⛔ 위 실측(352px)은 **옛 긴 제목**(「가진 재료로 만들 수 있어요」) ＋ 「돌리기」 때의 값이다.
  //          그날 창업자가 제목을 「가진 재료로 만들기」로 줄여서 **전제가 달라졌다** — 다시 쟀다.
  //       🔢 실측(2026-09-11) = 제목 208.7 ＋ 틈 10 ＋ 알약 60 = **278.7px** · 360폰 쓸 폭 **320px**
  //          → **41px 남는다.** 360·390·412 세 폭 모두 한 줄.
  //       ⭐ 새 클래스를 안 만들었다 — `.pill.active`(크림 바탕 ＋ 갈색 글자)가 이미 우리 색 알약이다.
  //       ⭐ 아이콘은 남긴다 — 글자 없이도 「다시 섞는다」가 읽히던 그림이라 둘이 같이 있으면 더 분명하다.
  //    ⚠️ 단추는 «안 줄인다»(`flex: 0 0 auto`) — 줄어들면 동그라미가 찌그러진다.
  //    ⛔⛔ **[2026-09-11 창업자] 「가진재료로 만들기가 두부레시피쪽으로 너무 붙어있어」**
  //       뿌리 = `marginTop: 2` 를 «두 줄에 똑같이» 줬다. 그 2px 는 원래 «화면 맨 위» 줄을 위한 값이라
  //       (제목이 안내문에 붙어야 한다) 아랫줄에 그대로 쓰니 윗줄 카드에 딱 붙었다.
  //       ✅ 맨 위 줄만 2px, 그 아래 줄은 `.sec-head` 본래 값(26px)을 쓴다.
  const 줄머리 = (제목, 목록, 돌리기, 맨위 = false) => (
    <div className="sec-head" style={{ marginTop: 맨위 ? 2 : undefined, gap: 10 }}>
      <div className="h-section">{제목}</div>
      {목록.length > 3 && (
        <button className="pill active press" onClick={돌리기} aria-label={`${제목} — 다른 요리 보기`}
          style={{ flex: '0 0 auto', padding: '6px 13px', fontSize: 15 }}>
          <Icon name="refresh" size={14} color="var(--brown)" stroke={2} />
          섞기
        </button>
      )}
    </div>
  )

  // 🍳 추천 칸 — **화면 맨 위**에 놓으려고 여기서 만든다.
  //    ⚠️ JSX 로 미리 만들어 두는 이유 = 아래 재료 목록보다 «먼저» 그려야 하는데,
  //       계산이 목록보다 아래에 있던 코드라 자리를 옮기기만 하면 순서가 꼬인다.
  //    ⭐ 윗줄은 «급한 게 없으면 아예 안 그린다» — 제목만 덩그러니 뜨는 빈 줄을 만들지 않는다.
  const 추천칸 = matches.length > 0 ? (
    <>
      {급한줄.length > 0 && (
        <>
          {줄머리(급한줄제목, 급한줄, 돌리기(set윗돌림), true)}
          {카드줄(돌린다(급한줄, 윗돌림), 윗줄칸)}
        </>
      )}
      {보통줄.length > 0 && (
        <>
          {/* 📝 [창업자 확정 2026-09-11 ⓐ] 「가진 재료로 만들 수 있어요」 → 「가진 재료로 만들기」
              ⛔ 긴 제목은 360px 폰에서 «한 줄에 안 들어간다» — 실측 322px 필요 · 쓸 수 있는 폭 320px.
                 틈을 2px 줄이는 건 숫자 땜빵이고(절대원칙 34) 폰마다 글꼴이 달라 또 터진다.
              ✅ 창업자가 «글자를 줄이는 쪽»으로 정했다 — 뜻은 그대로고 모든 폭에서 한 줄이 된다. */}
          {줄머리('가진 재료로 만들기', 보통줄, 돌리기(set아랫돌림), 급한줄.length === 0)}
          {카드줄(돌린다(보통줄, 아랫돌림), 아랫줄칸)}
        </>
      )}
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
      {/* 🔑🔑 [창업자 2026-09-04] **빨간 경고 두 줄 → 열쇠 그림 한 칸**
          📮 창업자 = *"냉장고 재료함에 **빨간글씨 열쇠를 수정**했으면 좋겠어.
             거기 **설명도 너무 구구절절**이라 심플하게 바꾸면 좋겠고 **우리 열쇠이모티콘있으니까**"*

          ⛔⛔ **지우면 안 되는 것 하나** — 「깎인다」는 사실. 창업자 확정(2026-08-13) =
             *"유저가 몇장남았는지 스스로 알아야해"* · 분쟁·환불 1순위가 «샀는데 어디 갔지» 다.
             ✅ 그래서 **없애는 게 아니라 «짧게 ＋ 그림으로»** 바꾼다. 뜻은 그대로 남는다.

          ⛔⛔ **[2026-09-04 정정] 여기 「빨간색을 걷었다」고 적혀 있었다 — 그건 틀린 판단이었다.**
             ⭐ 창업자가 고쳐달라고 한 건 **「빨간 «글씨»로 쓴 열쇠」**이고, 바로 이어서 답까지 줬다
                — *"우리 열쇠이모티콘있으니까"*. 즉 **「글씨 대신 그림」**이지 «색을 빼라»가 아니다.
             🔒 `_repro-장수안내-0821` 이 그걸 잡았다(⑬⑮⑯ 실패) — 그 판은 창업자 2026-08-21
                *"**빨강색으로** 안내해줘야할 것 같아. **1장 스캔하면 1장 까인다는걸**"* 로 만든 것이다.
                📌 **미감이 아니라 «돈» 얘기라 색이 곧 뜻이다.** 겁주려는 게 아니라 값을 표시하는 것.
             ✅ 그래서 셋을 다 지킨다 — **열쇠 그림(창업자 지시) ＋ 한 줄(구구절절 금지) ＋ 위험색(돈)**.

          🔢 두 줄 → 한 줄 (54자 → 38자)
             전 = 「영수증 1장에 열쇠 1개를 써요」 ＋ 「영수증은 사진에 따라 인식률이 달라요 ·
                   안 되면 ＋재료 담기로 직접 넣어도 돼요.」
             후 = 「영수증 1장에 열쇠 1개를 써요 · 안 되면 ＋재료 담기로 직접 넣어도 돼요」
             후후(2026-09-06) = 「영수증 1장에 열쇠 1개를 써요」 ／ 「＋재료 담기로 직접 넣어도 돼요」 — 「안 되면」 뺌 · 두 줄
             ⛔ **「를 써요」를 빼지 않는다** — 편집 화면이 「사진 1장에 열쇠 1개를 써요」라서
                꼬리를 자르면 **자리마다 말이 갈린다**(⑯ 이 그걸 본다).
             ⛔ 「사진에 따라 인식률이 달라요」를 뺐다 — 바로 옆 「베타」 딱지가 이미 그 말이고,
                안 될 때 할 일(＋재료 담기)이 같은 줄에 있으면 «미리» 알 필요가 없다. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14,
        padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--cream)',
        wordBreak: 'keep-all',
      }}>
        {/* ⚠️ 열쇠 원본은 107×220 — 높이만 주고 폭은 비율대로(KeyBadge 와 같은 셈법) */}
        <img src={uiKeyOne} alt="" aria-hidden="true" draggable={false}
          style={{ height: 30, width: 'auto', flex: '0 0 auto' }} />
        <div style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.5 }}>
          {/* 🔽 [창업자 2026-09-06] *"안되면을 빼고 +재료담기를 아랫줄에 넣자"* — 한 줄 「… · 안 되면 ＋재료 담기로 …」가
              폰에서 「안 되면 ＋」 / 「재료 담기로」 로 어정쩡하게 꺾였다. 둘째 줄을 «일부러» 갈라 ＋재료 담기가 줄 머리에 오게. */}
          <b style={{ color: 'var(--danger)', fontWeight: 800 }}>영수증 1장에 {keyCount(1)}를 써요</b>
          <br /><b style={{ color: 'var(--brown)' }}>＋재료 담기</b>{'로 직접 넣어도 돼요'}
        </div>
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
          {/* ✂️ [창업자 2026-09-04] *"거기 **설명도 너무 구구절절**이라 심플하게 바꾸면 좋겠고"*
              🔢 두 줄 62자 → 한 줄 40자.
              ⭐ **뜻은 둘 다 남겼다** — 이 상자를 만든 이유가 그 둘이기 때문이다(위 주석):
                 ⑴ 무엇을 해주나(「대신 세어 드려요」＋D-3 표) ⑵ 내가 뭘 하나(「누르면」).
              ⛔ 「유통기한을 대신 세어 드려요」는 «안» 뺐다 — 맨 위 띠에도 같은 말이 있지만
                 창업자가 *"꼬리로 붙은 말은 안 읽힌다"* 며 이 상자를 만들게 한 그 문장이다.
              ✂️ 뺀 것 = 「재료 옆에」·「처럼」·「유통기한·수량·보관 메모를 적을 수 있어요」의 늘어진 부분.
                 누르면 무엇이 나오는지는 «눌러 보면» 안다 — 미리 다 적으면 그게 구구절절이다. */}
          <span style={{ fontSize: 15.5, lineHeight: 1.55, color: 'var(--text)' }}>
            <b style={{ color: 'var(--brown)', fontWeight: 700 }}>유통기한을 대신 세어 드려요</b> — 가까우면 <span className="exp-chip exp-soon" style={{ fontSize: 15, padding: '1px 6px' }}>D-3</span> 표시 · 재료를 <b style={{ color: 'var(--brown)', fontWeight: 700 }}>누르면</b> 고쳐요
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
      //   ⛔⛔ 2026-09-01 창업자 제보 ① = *"냉장고에 재료 넣어도 열쇠 안차. 다른거 4개는 다 되고"*
      //      영수증 스캔 길(saveFound)에만 붙이고 **여기(직접 넣기)를 빠뜨렸다.**
      //      📌 유저가 쓰는 길이 «둘»인데 한쪽만 봤다. 넣는 자리는 `addPantry` 를 «전수»로 찾는다.
      //   ⛔⛔ 창업자 제보 ② = *"냉장고 안받았었는데 안내사라졌어"* — **받은 게 맞았는데 몰랐다.**
      //      내가 *"장보기 흐름 한가운데라"*며 토스트를 일부러 뺐는데, 마침 이게 다섯째라
      //      **안내 카드까지 소리 없이 사라져** 「없어졌다」로만 보였다.
      //      📌 **받은 것은 반드시 «받았다»고 말한다** — 특히 그게 마지막 하나일 때.
      열쇠받기(EARN.냉장고).then((받음) => {
        if (받음) nav.showToast(`냉장고를 처음 채웠어요 · ${KEY_NAME} 1${KEY_UNIT}를 더 받았어요`, 5200)
      })
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
