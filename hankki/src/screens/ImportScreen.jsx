import { useState, useRef } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useBackHandler, useLayerBack } from '../useBackHandler'
import { guessCategory, openExternal } from '../utils'
import { parseRecipeText, keepRaw } from '../parseRecipe'
// ⏳ `fetchLinkRecipe` import 는 뺐다 — 「⏳ 서버 되면 되살릴 것 ①」 참조.
//    ⛔ `src/linkReader.js` 파일은 «안 지웠다» — 공유받기가 쓰고, 되살릴 때 그대로 쓴다.
import { guessFoodIcon } from '../components/FoodIcon'
import { getOcrLeft, KEY_NAME, KEY_SHORT, KEY_UNIT, keyCount } from '../ocr'
import Icon from '../components/Icon'
import Portal from '../components/Portal'
// 🐻 [2026-08-28] 잔량 띠의 캐릭터(펭펭 돋보기 · 둘이 하트)를 **뺐다** — 창업자 *"그림 박스하나 없어져"*.
//    ⛔ 그림이 나빠서가 아니다 — 잔량이 «상단바»로 올라가면서 그 그림이 앉을 띠 자체가 없어졌다.
//    ⭐ 파일(`assets/ui/wave/pn_search.png` · `duo_hearthand.png`)은 그대로 살아 있다.
//       다른 화면(홈 「다음에 뭐 할까」 등)이 쓰고, 되살릴 일이 있으면 import 두 줄이면 된다.
// 🔑🔑 「레시피열쇠」의 «그림» (창업자 컷 2026-08-24 · `docs/stickers/창업자-2026-08-24/열쇠/`)
//    ⭐ v11.30 에서 이름만 「레시피열쇠」로 갈았는데 **그림은 여전히 ✨반짝이**였다.
//       v11.02 「책갈피」에서 배운 것과 같은 자리 — *"모양이 같아야 누르고 싶다"* ·
//       이름과 그림이 다르면 유저는 **다른 것**으로 읽는다.
//    ⭐ 두 컷을 «상태»로 갈랐다 = 남았으면 🔑열쇠 · 다 썼으면 🔒열쇠구멍(잠긴 것).
//       ⛔ 글자 없이도 「끝났다」가 읽히는 게 목적이다(빈 열쇠구멍 = 꽂을 게 없다).
import uiKeyOne from '../assets/ui/key_one.png'
import uiKeyHole from '../assets/ui/key_hole.png'
// 📸📸 안내 사진 — [창업자 2026-08-28] *"1.2.3아래에 한장짜리 사진 넣자. 이게 제일 직관적이야."*
//    ⭐ 창업자 «폰 실물» 캡처를 짜깁은 것이다(만든 판 = `scripts/_판-가져오기안내컷-0828.py`).
//       ⛔ 흉내로 그린 그림이 아니다 — 유저가 진짜로 만나는 화면이라야 알아본다(절대원칙 30).
//    🚨 개인정보 = 공유 시트 가운데 「카톡 친구」 띠는 **도려냈다**(창업자 지인 이름·사진이다).
//    ✅ 저작권 = 인스타 게시물이 **우리 계정(annyeong_hankki)** 이라 남의 것이 아니다.
import 안내컷Share from '../assets/guide/share-flow.webp'
import 안내컷Gallery from '../assets/guide/gallery-flow.webp'

// '사진으로 가져오기'와 '직접 작성하기'는 결국 같은 작성 화면 — 하나로 합쳤다.
// 캡처는 작성 화면에서 재료/만드는 법 칸별로 읽어 채운다(인식이 훨씬 정확).
// 🔗🔗 [2026-08-21 창업자 확정 = ⓑ] 링크는 「되는 척」을 걷어내고 «이름이 하는 일과 같게» 바꿨다.
//   📮 창업자 = *"우리 링크는 아예 안돼 원래"* → *"AI가져오기처럼 링크 넣으면 자동으로 레시피가 작성되는게
//      아니라 그냥 보관함에 담기고 직접입력해야하잖아. **그건 내가 말한 저장이 아니야 그걸 누가써**"*
//   ⛔ 옛 설명 = 「블로그 글 읽어오기」 — **안 되는 걸 약속했다.** 그래서 눌러 본 사람에겐 «고장»으로 읽혔다.
//      실제로 되는 건 「주소를 담아두는 것」 하나뿐인데 그 말이 뒤에 작게 붙어 있었다.
//   ⏳ 「읽어오기」는 죽은 게 아니라 «미뤄둔» 것 — 창업자 *"C는 되면 좋으니까 **서버되면 꼭 하자**"*.
//      지금은 남의 서버(jina·allorigins) 에 얹혀 있어 우리가 못 고친다. 우리 서버가 서면 되살린다.
//      🔖 되살릴 자리 = 이 파일의 「⏳ 서버 되면 되살릴 것」 주석 셋 ＋ `src/linkReader.js`(그대로 살아 있다)
// 💰💰 [2026-08-21 창업자 확정] *"어 다 안내해"* — **다섯 줄 «전부»에 장수를 붙인다.**
//    ⛔ 처음엔 사진·텍스트 둘에만 붙였는데, 그러면 나머지 셋이 «빈칸»이라
//       「얘넨 공짜인가?」로 읽힌다. 빈칸은 «0장»으로 읽히지 «모름»으로 안 읽힌다.
//    ⭐ `costText` 를 «데이터»로 둔다 — 히어로 카드도 이 값을 읽는다.
//       손으로 두 곳에 적으면 반드시 한쪽이 낡는다(우리가 여러 번 겪은 것).
//    ⭐ `paid` 가 색을 정한다 — 빨강은 «깎인다»를 말하는 색이다. 안 깎이는 길에 빨강을 쓰면
//       색이 뜻을 잃고, 그러면 정작 깎이는 줄도 안 보인다.
//    🔢 실측 = 돈 드는 `ocrImage()` 를 부르는 곳은 셋뿐(EditorScreen·PantryView·App.jsx).
//       ImportScreen 은 `getOcrLeft`(읽기)만 가져온다 → 텍스트·링크가 «0장»인 것은 짐작이 아니다.
//    ⚠️ 인스타·유튜브는 «조건부»다 — 흐름 안에서 캡처를 고르면 1장, 붙여넣기를 고르면 0장.
//       그래서 「캡처는」을 앞에 붙여 조건을 밝힌다. ⛔그냥 「1장」이라 적으면 붙여넣기도 깎이는 줄 안다.
//       ＋ 흐름 화면의 단추 «셋»에도 각각 정확한 값을 적는다(아래 `방법들`).
// 📋📋 [창업자 확정 2026-08-28] **목록은 네 갈래.** 창업자가 «구성까지» 줬다.
//
// 📮 창업자 원문 = *"가져오기 화면 깔끔하게 정리하기.
//    (인스타나 유튜브보다가 캡쳐 한끼로 공유/ 이미 저장되어있는 사진(갤러리) 한끼로 공유/
//     한끼앱에 가져오기에서 사진 가져오기/ 직접입력하기) **이렇게 4개만 남겨도 좋을 것 같아.**
//    **각각의 화면을 누르면 안내+가져오기가 되면 좋겠고.**"*
// 📮 그 앞(같은 날) = *"우리는 다 비슷비슷하게 적어놓고 **구별이 안가서** 직관적으로 쓰기엔 좀 불편해"*
//    ＋ 많이 쓰는 순서 = *"**오늘 발견한 것? 그거 제일 많이 쓸거고** … 그다음 **저장된 사진 우리앱에서 올리기**/
//    3번은 거의 안쓸 듯.. **4번.5번은 없애고** 각각 케이스별로 안내해주는게 나을 것 같아"*
//
// ⭐⭐ **뿌리 = 축이 섞여 있었다.** 옛 다섯 줄은 「방법 축」(사진·글·주소)과 「출처 축」(Instagram·YouTube)이
//    한 줄에 나란히 있었다. 그래서 다섯 줄이 서로 «다른 것을 재는 자»가 되어 구별이 안 됐다
//    (CLAUDE.md 「분류 원칙 ②」와 같은 병 — 축이 섞이면 중복은 필연이다).
// ✅ 이제 축이 하나다 — **「그 사진이 «어디서 오나»」** ①보다가 캡처 ②갤러리에 이미 있음 ③앱에서 고름 ④없음(직접).
//
// ⛔⛔ **「기능을 지운다」가 아니다** — Instagram·YouTube·텍스트·링크 흐름은 **그대로 살아 있고**
//    목록에서만 내렸다(v11.00 한살림과 «같은 방식»). 아래 `HIDDEN` 참고.
//    ⭐ 그럴 수밖에 없다 — 인스타·유튜브 흐름 «안»의 「붙여넣기」 단추가 `setFlow('text')` 로 가고,
//       2026-08-21 확정(*"C는 되면 좋으니까 서버되면 꼭 하자"*)이 아직 살아 있다.
// 🏷 [창업자 2026-08-28] 네 줄의 «제목·설명을 창업자가 직접 써 줬다» — 그대로 쓴다.
//    ⭐ 앞판과 견줘 달라진 결 = 제목이 **「어디서 → 어디로」를 통째로** 말한다.
//       옛 「보다가 캡처해서 담기」는 «담는 곳»이 안 적혀 있어서 「어디에 담기지?」가 남았다.
//       새 「SNS 보다가 캡처해서 바로 한끼로」는 읽으면 끝난다.
//    ✍️ 창업자 원문은 「캡쳐」인데 **「캡처」**로 적는다 — 앱 전체가 캡처로 통일돼 있다
//       (같은 기능은 같은 이름 원칙 · 여기만 다르면 검사·안내문과 말이 갈린다).
const OPTIONS = [
  // ⭐ 창업자가 콕 집은 1순위 — *"그거 제일 많이 쓸거고. 진짜편하더라고 ㅎㅎ"*
  { key: 'share', icon: 'instagram', title: 'SNS 보다가 캡처해서 바로 한끼로', desc: '인스타·유튜브 보다 캡처 후 바로 한끼로 공유해요', color: '#C13584', costText: `캡처하면 ${keyCount(1)}`, paid: true, pill: '제일 많이 써요' },
  { key: 'gallery', icon: 'photo', title: '갤러리에 있는 사진 바로 한끼로', desc: '이미 저장된 사진들 갤러리에서 바로 한끼로 공유해요', color: '#8AA07A', costText: `사진 1장에 ${keyCount(1)}`, paid: true },
  // 🆓🆓 [창업자 확정 2026-08-29] **이 길만 「열쇠 안 쓰고 읽기」를 고를 수 있다.**
  //   📮 *"한끼앱에서 사진가져오기 / **무료 사용시 추천. 사진을 보면서 수정할 수 있어요.**"*
  //   📮 *"3번은 열쇠다썼지만 **무료로 쓰고싶은 사용자들이 거의 쓰겠네** 안내도 잘해줘야 할 듯."*
  //   ⭐ 왜 이 길만인가 = ①② 는 카톡·인스타에서 사진이 «바로 날아 들어와» 물어볼 화면이 없다.
  //      ③ 만 앱 «안»이라 고르는 자리를 둘 수 있다.
  //   ⭐ 그리고 이 길만 **사진이 저절로 떠 있다**(`EditorScreen` 이 `setPin('photo')`) —
  //      기본 인식이 덜 읽어도 «그 자리에서» 보고 고친다. 그래서 무료 유저의 집이 될 자리다.
  //   ⛔ `costText` 는 «열쇠로 읽을 때»의 값이라 그대로 둔다(안내 화면의 AI 단추가 이 값을 쓴다).
  { key: 'photo', icon: 'camera', title: '한끼 앱에서 사진 가져오기', desc: '사진을 보면서 고칠 수 있어요', color: '#B0895E', costText: keyCount(1), paid: true, pill: `${KEY_SHORT}가 없어도` },
  // ⛔⛔ 첫 판은 「앱을 안 나가고 골라요 · 사진 보면서 고쳐요」였는데 **찍어 보니 줄이 갈리며
  //    가운뎃점이 다음 줄 «맨 앞»에 섰다**(규칙 21 — 숫자는 「가로넘침 0」이라 통과시켰다).
  //    📌 우리가 이미 적어둔 함정이다: *"「 · 」는 앞 문장에 이어 붙일 때의 이음표다.
  //       줄 맨 앞에 남으면 글머리표처럼 보인다"*(위 `장수꼬리` 주석).
  //    ⭐ 그리고 「앱을 안 나가고」는 **제목이 이미 말한다**(「한끼 앱에서」) — 겹쳐서 뺐다.
  //       제목이 «어디서», 알약이 «값», 설명이 «뭐가 좋은지». 셋이 다른 말을 한다.
  { key: 'write', icon: 'edit', title: '직접 입력하기', desc: '빈 종이에 내가 적어요', color: '#9B8B79', costText: keyCount(0), paid: false, pill: `${KEY_SHORT}가 없어도` },
]

// 🫥 **목록에서 내렸을 뿐, 흐름은 살아 있다** (⛔지우지 않는다)
//    · `instagram`·`youtube` = 위 ①의 안내 화면에서 「인스타 열기 / 유튜브 열기」로 들어간다
//    · `text` = 인스타·유튜브 흐름 «안»의 「붙여넣기」 단추가 여기로 온다
//    · `link` = 그 흐름 안 「링크만 저장해두기」가 여기로 온다
const HIDDEN = [
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '캡처해서 담기 (제일 정확)', color: '#C13584', costText: `캡처하면 ${keyCount(1)}`, paid: true },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '캡처·설명 붙여넣기로 담기', color: '#E33', costText: `캡처하면 ${keyCount(1)}`, paid: true },
  { key: 'text', icon: 'edit', title: '텍스트 붙여넣기', desc: '레시피 글을 붙여넣으면 재료·순서까지 자동 정리', color: '#B0895E', costText: keyCount(0), paid: false },
  { key: 'link', icon: 'link', title: '링크 주소만 담아두기', desc: '주소만 저장해요 · 재료·순서는 안 담겨요', color: '#9B8B79', costText: keyCount(0), paid: false },
]
const ALL_FLOWS = [...OPTIONS, ...HIDDEN]

// 💰 장수 꼬리표 — 다섯 줄·히어로·흐름 단추가 «같은 함수»로 그린다.
//    ⛔ 자리마다 따로 적으면 말이 갈라진다(같은 기능은 같은 이름 원칙).
// 🔀 `홀로` = 자기 줄에 혼자 설 때(가운뎃점을 안 붙인다).
//    ⛔ 「 · 」는 «앞 문장에 이어 붙일 때»의 이음표다. 줄 맨 앞에 남으면 글머리표처럼 보인다.
function 장수꼬리(costText, paid, 홀로 = false) {
  if (홀로) {
    return <b style={{ fontWeight: 800, fontSize: '0.88em', color: paid ? 'var(--danger)' : 'var(--text-sub)', whiteSpace: 'nowrap' }}>{costText}</b>
  }
  return (
    // ⛔ `nowrap` — 실물에서 「캡처는 AI / 스캔 1장」으로 갈렸다(규칙 21).
    //    낱말 잘림은 아니지만 «값»이 두 줄로 흩어지면 한눈에 안 읽힌다. 값은 한 덩어리로 넘어가야 한다.
    //    🔢 제일 긴 꼬리(「받아적으면 AI 스캔 0장」)도 12.3px 에서 ~150px — 칸 226px 안이라 안 넘친다.
    // 🔠 [창업자 2026-08-24] *"빨간색 열쇠1개 이런 글자 조금 작게 하자. 페이지가 정신이 없게 느껴져."*
    //    ⭐ `em` 으로 준다 — 이 꼬리는 «다섯 자리»(히어로·목록 넷·흐름 단추)에 붙는데
    //       부모 글자 크기가 15 · 15.3 · 15.5 로 제각각이다. px 로 박으면 자리마다 비율이 갈린다.
    //    🔢 0.88em → 13.2 ~ 13.6px. 설명글보다 «한 단» 작아 값이 조용히 따라붙는다.
    //    ⛔ 색은 안 건드린다 — 「돈이 든다」를 알리는 자리다(v11.21 에 1↔0 대비를 일부러 살렸다).
    <> · <b style={{ fontWeight: 800, fontSize: '0.88em', color: paid ? 'var(--danger)' : 'var(--text-sub)', whiteSpace: 'nowrap' }}>{costText}</b></>
  )
}

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link | text
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [help, setHelp] = useState(false)
  const [aiPreview, setAiPreview] = useState(false) // AI 자동정리 '이렇게 돼요' 안내 시트
  // 📢 AI 스캔 남은 장수 — localStorage 를 읽을 뿐이라 가볍다. 화면에 들어올 때마다 최신값이 나온다.
  const ocrLeft = getOcrLeft()
  const [linkOpen, setLinkOpen] = useState(false) // '링크만 저장'은 접어둔다(화면을 조용하게)

  // 시트(AI 미리보기·도움말)는 히스토리 칸을 쌓아 뒤로가기로 닫는다.
  useLayerBack(aiPreview, () => setAiPreview(false))
  useLayerBack(help, () => setHelp(false))
  // 하위 흐름(링크·사진 등 선택 단계)은 모달이 아니라 화면 내 단계라 상태만 되돌린다.
  useBackHandler(() => {
    if (flow) { setFlow(null); return true }
    return false
  })

  const saveText = () => {
    const t = text.trim()
    if (!t) return
    const r = parseRecipeText(t)
    // pop 하지 않고 push → 뒤로가기 시 '가져오기'로 복귀. (저장하면 편집기가 popAll로 홈)
    // 메모는 직접 입력 전용 — 분류 안 된 찌꺼기를 메모에 붙이지 않는다
    // 📥 원문도 같이 넘긴다 — 파서를 고친 날 「다시 읽기」로 되살릴 재료(→ parseRecipe.js `keepRaw`)
    nav.push({ name: 'editor', prefill: { source: 'manual', title: r.title, ingredients: r.ingredients, steps: r.steps, rawText: keepRaw(t) } })
  }

  // 📷 「여기서 사진 고르기」 — 앱을 안 나가고 바로 고른다 (창업자 ③)
  //   ⭐⭐ **파일 고르기는 «누른 그 손짓»으로 열어야 한다.** 다음 화면에 가서 저절로 열려고 하면
  //      브라우저가 「손짓 없이 연 창」으로 보고 막을 수 있다. 그래서 여기서 «먼저» 고르고,
  //      고른 사진을 편집 화면에 들려 보낸다.
  //   ⛔ 실패해도 유저는 안 막힌다 — 안 고르면 아무 일도 안 일어나고, 편집 화면의 큰 단추가 그대로 있다.
  const photoInRef = useRef(null)
  // 🆓🆓 [창업자 확정 2026-08-29] **어느 단추로 열었나** — 「그냥 읽기」면 열쇠를 안 쓴다.
  //   ⛔ state 가 아니라 ref 다 — 사진 고르기 창은 «다시 그리기» 없이 바로 열리고,
  //      `onPickedPhotos` 는 그 창이 닫힌 «뒤»에 불린다. state 면 그 사이에 낡은 값을 읽을 수 있다.
  const noVisionRef = useRef(false)
  const onPickedPhotos = (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    Promise.all(files.map((f) => new Promise((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.readAsDataURL(f)
    }))).then((urls) => {
      // ⛔ 여기서 읽지 «않는다» — 자르기·인식·합치기는 편집 화면이 이미 다 갖고 있다.
      //    두 곳에 적으면 한쪽만 고치는 사고가 난다(우리가 여러 번 겪은 것).
      // 🆓 `noVision` 이면 편집 화면이 구글 AI 를 건너뛰고 기본 인식으로만 읽는다(`ocr.js`)
      nav.push({ name: 'editor', prefill: { source: 'photo', ocrImages: urls, noVision: noVisionRef.current } })
    })
  }
  // 🆓 사진 고르기 창을 «누른 손짓 그대로» 연다 — 갈래만 먼저 적어 둔다.
  const 사진고르기 = (무료) => { noVisionRef.current = !!무료; photoInRef.current?.click() }

  // ⭐ [창업자 2026-08-28] **네 갈래 «전부» 안내 화면을 거친다** — *"각각의 화면을 누르면 안내+가져오기"*.
  //    ⛔ 예전엔 「사진·직접 작성하기」가 목록에서 곧장 편집 화면으로 갔다. 그러면
  //       «어떻게 쓰는지»를 말할 자리가 없어서, 안내가 전부 편집 화면 안으로 밀려 들어가 있었다.
  //    ⚠️ 직접 입력도 예외로 두지 않는다 — 한 갈래만 다르게 굴면 「이건 왜 바로 열리지」가 된다.
  const choose = (key) => {
    setFlow(key)
    setUrl('')
    setTitle('')
    setLinkOpen(false)
  }

  const saveLink = () => {
    const t = title.trim() || `${flowMeta?.title || '새'} 레시피`
    addRecipe(makeInboxRecipe({ source: flow, title: t, sourceUrl: url.trim() }))
    nav.pop()
    nav.push({ name: 'inbox' })
    nav.showToast('임시보관함에 담았어요 · 나중에 정리해요')
  }

  // ⏳ 서버 되면 되살릴 것 ① — 여기 `readLink()`(링크 본문 자동 읽기)가 있었다.
  //    ⛔ 지금 뺀 이유 = 남의 서버 두 곳(`r.jina.ai`·`api.allorigins.win`)에 얹혀 있어서
  //       **되고 안 되고가 우리 손 밖**이고, 창업자 폰에선 «아예» 안 됐다.
  //    ✅ 되살리는 법 = ⑴우리 Worker 에 본문 읽기 길을 낸다 ⑵`fetchLinkRecipe` 를 그 길로 바꾼다
  //       ⑶이 함수와 버튼(②)·기다림 화면(③)을 되돌린다. **`src/linkReader.js` 는 안 지웠다** —
  //       공유받기(`App.jsx`)가 아직 쓰고 있고, 그쪽은 «백그라운드»라 실패해도 유저를 안 붙잡는다.

  const flowMeta = ALL_FLOWS.find((o) => o.key === flow)

  // 📖 네 갈래의 안내 내용 — «데이터»로 둔다. 화면 마크업은 한 벌뿐이라 한쪽만 예뻐질 일이 없다.
  //   ⛔ 「」 안이 **누르는 것**이다(창업자 = *"눌러야하는 것 강조"*). 굵게는 `강조()` 가 붙인다.
  //   🗓 [창업자 2026-08-28] *"**줄바꿈도 이상**"* — 실물로 보니 **「한끼」／를 찾아요** 로 갈려 있었다.
  //   ⭐ 뿌리 = `word-break: keep-all` 은 «낱말 안»만 지킨다. **닫는 따옴표 「」 «뒤»는 줄바꿈이 허용된다** —
  //      그래서 조사(를·이·가·에서)만 다음 줄로 떨어져 「한끼」가 문장에서 잘려 보였다.
  //   ✅ 「」 와 **바로 뒤에 붙은 글자**(다음 띄어쓰기 전까지)를 한 덩어리(`nowrap`)로 묶는다.
  //   ⛔ 뒤 글자를 `[^\s]*` 로 잡으면 안 된다 — 「재료」·「만드는 법」 처럼 «따옴표가 이어질 때»
  //      다음 「 까지 삼켜 **괄호 «안»의 띄어쓰기에서 끊긴다**(실측). 그래서 `「` 도 멈춤 글자에 넣는다.
  const 강조 = (s) => {
    const 조각 = []
    //   ＋ **괄호 «묶음»도 한 덩어리**로 — 320px 에서 「눌러요 (휴지통／바로 옆이에요)」로 갈렸다(실물).
    //     괄호는 «덧붙이는 말»이라 통째로 넘어가야 읽힌다. 굵게는 안 한다(누르는 것이 아니다).
    //     ⛔ 그래서 「」 뒤 글자를 잡을 때 `(` 도 멈춤 글자다 — 안 그러면 괄호를 삼킨다.
    const re = /「[^」]+」[^\s「(]*|\([^)]+\)/g
    let 앞 = 0, m
    while ((m = re.exec(s))) {
      if (m.index > 앞) 조각.push(<span key={조각.length}>{s.slice(앞, m.index)}</span>)
      const 끝 = m[0].indexOf('」') + 1
      조각.push(
        <span key={조각.length} style={{ whiteSpace: 'nowrap' }}>
          <b style={{ fontWeight: 900, color: 'var(--brown)' }}>{m[0].slice(0, 끝)}</b>{m[0].slice(끝)}
        </span>,
      )
      앞 = m.index + m[0].length
    }
    if (앞 < s.length) 조각.push(<span key={조각.length}>{s.slice(앞)}</span>)
    return 조각
  }
  // 📮📮 [창업자 2026-08-28] *"갤러리에서 처음에 한끼앱 고르면 **이미지랑 뭐랑 뭐랑 3개**가 뜨는데
  //    거기서 선택을 해야 한끼앱으로 넘어가거든 **이게 안보여 나는 설정이끝나서 그런가봐**"*
  //    → *"넣어야하는데 **정확한 내용을 모르겠다는거야.**"* → *"**이미지를 골라야해.**"*
  //    → *"이따 남편오면 한번 해보고 다시 말해줄게 **일단 안내로가자**"*
  // ⭐⭐ 그 화면은 **우리 게 아니다**(코드로 확인 · 규칙 29) —
  //    `vite.config.js` share_target 1개 · shortcuts·file_handlers 0개 ·
  //    `android/twa-manifest.json:25 "shortcuts": []` · `:39 shareTarget` 1개.
  //    **안드로이드(갤러리)가 띄우는 화면**이라 우리가 만들 수도 없앨 수도 없다.
  // ⛔ **처음 쓰는 사람만 본다** — 한 번 고르면 기본값이 잡혀 안 뜬다(창업자 폰이 그 상태다).
  //    그래서 «걸음 4번»으로 번호를 주지 않는다 — 번호를 주면 «늘 나오는 단계»로 읽힌다.
  // ⛔ **세 칸의 «정확한 이름»은 아직 모른다** — 창업자도 「이미지랑 뭐랑 뭐랑」이라 나머지 둘을 모르고,
  //    검색으로 나온 3개짜리(링크 복사·앱으로 링크 공유·QR)는 **다른 화면**이라 안 썼다.
  //    ✅ 확실한 것만 적는다 = **「이미지」를 고른다**(창업자가 콕 집었다).
  // ⛓ 우리 share_target 은 `image/*` 를 받는다 → 이미지가 아니면 **사진이 안 와서 글자 읽기를 못 한다**
  //    (앱은 안 죽고 링크·글만 담긴다 = 「고장」이 아니라 «반쪽»). 그래서 안내할 값어치가 있다.
  // ⏳ **남편 폰 캡처가 오면** 안내컷에 넷째 칸을 붙이고 이 줄은 그대로 둔다(글·그림 둘 다 있는 게 낫다).
  // 🔁🔁 **갤러리에만 붙인다** — 창업자 실물 확인 = *"sns에는 안떠."* · *"갤러리에만 떴어."*
  //    ⛔ 내 첫 판은 「둘 다 더보기 → 한끼 니까 같은 화면이 뜬다」는 «추측»이었고 **틀렸다**(규칙 25).
  //    ⚠️ **왜 갈리는지는 모른다** — 갤러리는 사진을 여러 형식(이미지·링크 등)으로 낼 수 있어서일 «수» 있는데
  //       확인한 적이 없다. ⛔짐작을 주석에 사실처럼 적지 않는다. **실물이 「갤러리만」이라고 했다.**
  // ⛔ 줄표(—)로 잇지 않는다 — 줄이 넘어가면 **다음 줄 «맨 앞»에 선다**(실물로 봤다 · 갤러리 `·` 와 같은 자리).
  //    **마침표로 끊으면** 줄이 어디서 갈려도 두 문장이 각각 읽힌다.
  const NOTE_이미지고르기 = '처음 한 번은 무엇을 보낼지 고르는 화면이 떠요. 「이미지」를 고르면 돼요.'

  const 안내들 = {
    share: {
      lead: '인스타·유튜브를 보다가 캡처하면, 그 자리에서 한끼로 보낼 수 있어요.',
      steps: [
        강조('레시피가 보이는 화면을 「캡처」해요'),
        // 📮 [창업자 2026-08-28] *"인스타 아래 공유버튼 여기도있었어"* — 갤러리와 «같은 자리»다.
        //    ⛔ 「캡처한 사진에서」로만 적으면 어디를 봐야 하는지 모른다. **화면 «아래»**를 짚어 준다.
        강조('화면 아래 「공유」를 눌러요'),
        // 📸📸 [창업자 실물 2026-08-28 · «두 번» 캡처를 받아 고쳤다]
        //    ⛔ 처음엔 *"더보기 점세개 누르면 앱들 보이고 한끼 찾으면 돼"* 만 적었는데,
        //       그날 오후 창업자 캡처에선 **「한끼」가 앱 줄 첫 줄(퀵셰어 다음)에 그냥 있었다.**
        //    ⭐⭐ 둘 다 사실이다 — 안드로이드 공유 시트의 앱 줄은 «어디서 공유했나»와
        //       «얼마나 자주 썼나»로 바뀐다. 처음 쓰는 사람은 안 보이고, 몇 번 쓰면 올라온다.
        //    📌 그래서 «한쪽만» 적으면 나머지 절반이 막힌다 — 되는 길을 먼저, 못 찾을 때를 뒤에.
        강조('「더보기」를 누르고 「한끼」를 찾아요'),
      ],
      // ⛔⛔ [창업자 실물 2026-08-28] 여기엔 «안» 붙인다 — *"**sns에는 안떠.**"* · *"**갤러리에만 떴어.**"*
      //    📌 내가 「둘 다 더보기 → 한끼 로 가니 같은 화면이 뜬다」고 «추측»했고 틀렸다(규칙 25).
      //    ⭐ 안 뜨는 사람에게 「뜬다」고 적으면 **없는 걸 찾다가 멈춘다** — 안내가 방해가 된다.
      shot: 안내컷Share,
      shotAlt: '인스타 게시물을 캡처하고, 공유에서 한끼를 누르면 재료까지 담기는 흐름',
      result: '임시보관함에 담기고, 제목·재료를 자동으로 읽어 드려요.',
      buttons: [
        // ⛔ 「열러 가기」라고 쓰지 않는다 — **앱을 여는 게 아니라 «우리 안내 화면»으로 간다.**
        //    이름이 하는 일과 달라지면 그게 곧 「되는 척」이다(v11.19 링크 정직과 같은 자리).
        //    ⭐ 그 화면 안에 「글 붙여넣기」·「보면서 적기」·「링크만 저장」이 있고, 진짜 앱 열기 단추도 맨 아래 있다.
        { label: 'Instagram 에서 담는 다른 방법', ghost: true, onClick: () => setFlow('instagram') },
        { label: 'YouTube 에서 담는 다른 방법', ghost: true, onClick: () => setFlow('youtube') },
        // 🔗 목록에서 내렸을 뿐 «죽이지 않았다» — 여기로 들어간다.
        //    ⛔ 어디서도 못 들어가면 그건 「목록에서 내린 것」이 아니라 «지운 것»이다.
        //       그 화면(v11.19 링크 정직)이 「주소만 담아둬요 · 재료·순서는 안 담겨요」를 말하는 자리다.
        { label: '링크 주소만 담아두기', ghost: true, onClick: () => setFlow('link') },
      ],
    },
    gallery: {
      lead: '이미 갤러리에 저장해 둔 레시피 사진도 똑같이 보내면 돼요.',
      steps: [
        강조('「갤러리」에서 레시피 사진을 열어요'),
        // 📮📮 [창업자 2026-08-28] *"갤러리 캡쳐 중요한건 **레시피 아래 공유하기 버튼 있다는거!!**
        //    그거 강조해야해. **휴지통 옆에 있는거**"*
        //    ⭐ 여기가 이 갈래에서 제일 많이 막히는 자리다 — 도구 띠(♡ ✏️ ✨ 공유 🗑)가
        //       화면 «아래»에 뜨는데, 유저는 사진만 보고 그 띠를 지나친다.
        //    ⛔ 그냥 「공유를 눌러요」로 두면 «어디의» 공유인지 모른다. 이웃(휴지통)으로 짚어 준다.
        //    🗓 [창업자 2026-08-28] 가운뎃점(·) → **괄호**. 창업자 = *"괄호로 바꿔"*
        //       ⛔ 「· 휴지통 바로 옆이에요」는 줄이 넘어가면 **`·` 가 다음 줄 «맨 앞»**에 선다(실물로 봤다).
        //       ⭐ 괄호는 「덧붙이는 말」이라 줄이 갈려도 통째로 넘어가 자연스럽게 읽힌다.
        //    🗓 [같은 날 · 창업자] *"**휴지통 옆이에요빼고 (빨간동그라미)가 낫겠다**"*
        //       ⭐⭐ 바로 아래 안내컷에 **그 공유 버튼을 빨간 동그라미로 쳐 뒀다**(창업자 지시로 그렇게 그렸다).
        //          글로 이웃(휴지통)을 설명하는 것보다 **「그림의 그 표시」를 가리키는 게 짧고 안 헷갈린다.**
        //          ⛔ 글이 짧아진 게 아니라 **글과 그림이 같은 것을 가리키게** 된 것이다.
        //       ⛔ 안내컷에서 빨간 동그라미를 빼면 이 문구가 **허공을 가리킨다** — 둘은 한 몸이다.
        강조('화면 아래 「공유」를 눌러요 (빨간 동그라미)'),
        강조('「더보기」를 누르고 「한끼」를 찾아요'),
      ],
      note: NOTE_이미지고르기,
      shot: 안내컷Gallery,
      shotAlt: '갤러리 사진에서 휴지통 옆 공유를 누르고, 더보기에서 한끼를 찾는 흐름',
      result: '임시보관함에 담기고, 제목·재료를 자동으로 읽어 드려요.',
      buttons: [
        // ⭐ 갤러리를 여는 길은 폰마다 달라 우리가 못 연다 → 대신 «앱 안에서 고르는 길»을 준다.
        //    ⛔ 「갤러리 앱을 여세요」라고만 하고 끝내면 막다른 길이 된다.
        { label: '앱을 안 나가고 여기서 고르기', onClick: () => setFlow('photo') },
      ],
    },
    photo: {
      lead: '앱을 나가지 않고 여기서 바로 사진을 고를 수 있어요.',
      steps: [
        // ⛔⛔ 옛 글 = 「아래 «사진 고르기»를 눌러요」. **단추 이름이 둘로 갈리면서 허공을 가리켰다**
        //    (열쇠가 있으면 단추가 「AI로 정확하게 읽기」·「그냥 읽기」다 · 규칙 21 로 찍어 보고 잡았다).
        //    ⭐ 그래서 «어느 갈래에서도 맞는 말»로 바꿨다 — 잔량에 따라 글까지 갈면 관리가 두 배가 된다.
        //    📌 우리 원칙 그대로 = **글과 그림이 같은 것을 가리켜야 한다**(갤러리 안내의 빨간 동그라미와 같은 결).
        강조('아래 단추를 눌러요'),
        강조('레시피 캡처를 골라요 (여러 장도 돼요)'),
        강조('보일 부분을 정하면 「재료」·「만드는 법」이 채워져요'),
      ],
      // ⭐⭐ [창업자 지시 2026-08-28] **「덜 읽힌다」를 «반드시» 집어 준다.**
      //   📮 *"**기본인식이라 인식률의 차이가 잇으니까 이부분을 집어줘야해 그래야 무료유저도 안떠나**"*
      //   ⛔ 「공짜」만 말하면 유저는 다 공짜를 고르고, 결과가 나쁘면 **앱이 나쁘다고 읽는다.**
      //   ⭐ 그래서 「덜 읽혀요」 다음에 **곧바로 「그래서 괜찮다」**를 붙인다 —
      //      이 길은 사진이 «저절로 떠 있어서» 그 자리에서 고친다. 나쁜 소식으로 끝내지 않는다.
      //   ⛔ 「열쇠를 «안 쓰면»」이라고 썼다가 고쳤다 — 열쇠가 0개인 사람에겐 **선택처럼 들린다**
      //      (그 사람은 «안 쓰는» 게 아니라 «없는» 것이다 · 실물로 두 화면을 나란히 찍어 보고 잡았다).
      //      ⭐ 「기본 인식」은 초록 박스가 이미 쓴 말이라 **어느 쪽 유저에게도 그대로 맞는다.**
      result: '기본 인식은 덜 읽혀요. 대신 사진이 위에 떠서 보면서 고칠 수 있어요.',
      // 🆓🆓🆓 [창업자 확정 2026-08-29] **이 길만 「열쇠를 쓸지」 고를 수 있다.**
      //   📮 창업자 = *"한끼에서 가져오기를 무료ocr로 읽게하면 안돼??"* →
      //      갈래 둘(ⓐ무조건 공짜 / ⓑ고르게)을 대고 **ⓑ** — *"열쇠가능하면 그렇게 하면 좋지"*
      //
      //   ⭐⭐ **왜 ⓐ(무조건 공짜)가 아닌가** — ③ 은 우리 앱에서 **제일 편한 길**이다
      //      (앱을 안 나가고 고르고, 사진이 저절로 떠 있다). 그걸 무조건 기본 인식으로 만들면
      //      **열쇠를 산 사람이 좋은 걸 쓰려고 앱을 나갔다 와야 한다.**
      //      📮 창업자 확정(2026-08-29) = *"**열쇠는 무조건 둘다 잘되어야해 돈이니까.**"*
      //
      //   ⛔⛔ **열쇠가 0개면 위 단추를 «아예 안 그린다».** 흐리게 두지 않는다 —
      //      0개면 어느 단추를 눌러도 기본 인식이라, 고르라고 두면 그게 «거짓 선택지»다.
      //      (「disabled 금지」 원칙과도 같은 결 — 눌러도 같은 일이 나면 먹통으로 읽힌다.)
      //   ⚠️ `unknown` = 서버가 아직 답한 적이 없다는 뜻이라 «있다» 쪽으로 본다
      //      (안 써 본 사람은 웰컴 20개가 있다). ⛔여기서 0으로 넘겨짚으면 열쇠 있는 사람이 길을 잃는다.
      buttons: (ocrLeft.unknown || ocrLeft.total > 0
        ? [
            { label: `AI로 정확하게 읽기 · ${keyCount(1)}`, onClick: () => 사진고르기(false) },
            { label: `그냥 읽기 · ${KEY_SHORT} 안 써요`, ghost: true, onClick: () => 사진고르기(true) },
          ]
        // ⭐⭐ **여기서 «누른 손짓»으로 고르기 창을 연다** — 다음 화면에서 저절로 열려고 하면
        //    브라우저가 「손짓 없이 연 창」으로 보고 막을 수 있다.
        : [{ label: '사진 고르기', onClick: () => 사진고르기(true) }]),
    },
    write: {
      lead: '가져올 게 없어도 괜찮아요. 빈 종이에 그냥 적으면 돼요.',
      steps: [
        강조('「빈 종이 열기」를 눌러요'),
        강조('제목·「재료」·「만드는 법」을 적어요'),
        강조('중간에 사진에서 읽어오고 싶으면 칸 옆 「카메라」를 눌러요'),
      ],
      result: '적는 도중에도 저장돼요. 나가도 안 날아가요.',
      buttons: [
        { label: '빈 종이 열기', onClick: () => nav.push({ name: 'editor' }) },
      ],
    },
  }

  return (
    /* 📏 `imp` = 가져오기 화면 «전용» 표식 — 상자 안 줄간을 한 값으로 묶는 데 쓴다(styles.css).
       ⛔ `.opt-row` 는 설정 화면도 쓴다 → 클래스만 고치면 남의 화면까지 바뀐다.
          창업자 말의 «범위»를 넓히지 않는다. */
    <div className="screen fade imp" style={{ paddingBottom: 24 }}>
      {/* 📷 「여기서 사진 고르기」가 쓰는 숨은 칸 — 화면 어디에 있든 손짓이 살아 있을 때 열린다 */}
      <input
        ref={photoInRef} type="file" accept="image/*" multiple
        onChange={onPickedPhotos}
        style={{ display: 'none' }}
      />
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => (flow ? setFlow(null) : nav.pop())} aria-label="닫기">
          <Icon name={flow ? 'chevron-left' : 'x'} size={24} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }} />
        {/* 🔑🔑 [창업자 2026-08-28] *"무료레시피열쇠 몇개 남았어요. **오른쪽 상단에 크게!**
            설명 필요없이 열쇠그림 옆에 남은 숫자 (알약으로 매달 무료5개)적으면 될 듯."*
            ⭐⭐ 이게 앞판의 「정신없다」를 푸는 핵심이다 — 옛 판은 이 정보를 «본문 박스»로 말해서
               네 갈래와 «같은 무게»로 읽혔다. 상태 표시는 상태 표시 자리(상단바)에 둔다.
            ⭐ 알약이 오해를 «대신 막는다» — 웰컴 20개일 때 숫자만 크게 두면 「매달 20개」로 읽히는데
               (그러면 5개가 되는 달에 「속았다」가 된다) 옆에 「매달 무료 5개」가 붙어 있어 저절로 갈린다.
               그래서 옛 「처음 한 번만 드리는 20개예요」 문장을 뺄 수 있었다.
            ⛔ 안내 화면(flow)에선 안 띄운다 — 거기선 「무엇을 누르나」가 주인공이다. */}
        {!flow ? (
          <div
            className="imp-key"
            role="img"
            aria-label={`무료 ${KEY_NAME} ${ocrLeft.total}${KEY_UNIT} 남았어요 · 매달 무료 5${KEY_UNIT}`}
          >
            {/* 🔑🔑 [창업자 2026-08-29] **알약을 «위»로 올리고 그 아래 열쇠를 크게.**
                📮 *"그리고 위에 열쇠그림 좀 더 크게 만들어줘."* · *"매달무료 5개 아래에 열쇠크게 숫자 넣으면?"*
                ⭐ 한 줄로 나란히 두면 열쇠를 키우는 순간 알약이 밀려 320px 에서 넘친다.
                   두 줄로 쪼개면 **가로가 오히려 좁아져서** 열쇠를 마음껏 키울 수 있다.
                ⛔ 알약이 «위»다 — 창업자가 그 순서로 말했고, 뜻으로도 「매달 얼마」가 조건이고
                   「지금 몇 개」가 결과라 위→아래로 읽힌다. */}
            <span aria-hidden="true">매달 무료 5{KEY_UNIT}</span>
            <div className="imp-key-now">
              {/* ⚠️ 높이만 고정하고 폭은 비율대로 — 열쇠 107×220 · 열쇠구멍 213×220 으로 가로세로가 다르다 */}
              <img src={ocrLeft.total > 0 ? uiKeyOne : uiKeyHole} alt="" aria-hidden="true" draggable={false} />
              <b aria-hidden="true">{ocrLeft.total}</b>
            </div>
          </div>
        ) : <div style={{ width: 40 }} />}
      </div>

      {/* ⏳ 서버 되면 되살릴 것 ③ — 여기 「링크에서 내용을 읽는 중…」 기다림 화면이 있었다.
          위 ②를 뺐으니 이 화면을 띄울 사람이 없어져서 같이 뺐다. */}

      {!flow ? (
        <div className="pad">
          <div className="h-title" style={{ marginTop: 6 }}>가져오기</div>
          <div className="t-sub" style={{ marginTop: 8, marginBottom: 14, fontSize: 16 }}>
            레시피를 가져오는 방법을 선택해 주세요.
          </div>

          {/* 🔔🔔 젤 윗단 알림 — [창업자 2026-08-28] *"(젤 윗단 박스하나 만들어서 —
              **열쇠를 다 사용하면 기본인식으로 전환 — 계속 무료로 사용할 수 있어요** 알림.)"*
              ⭐⭐ 이 박스는 **한 가지만** 말한다: 「끊기지 않는다」.
                 옛 판은 같은 자리에서 «남은 숫자 ＋ 웰컴 안내 ＋ 소진 안내»를 한꺼번에 했고,
                 그게 창업자가 말한 *"페이지가 정신이 없게 느껴져"* 의 뿌리였다. 숫자는 상단바로 갔다.
              ⭐ 그리고 이건 결제에서 제일 중요한 안내다 — 우리는 다 써도 **기본 인식이 무제한**이라
                 진짜로 안 끊긴다. 그걸 «다 쓰기 전»에 말해야 불안이 결제 압박으로 안 바뀐다
                 (창업자 2026-08-13 *"다쓰면 무료인식되는건 어디서 안내받아?"*).
              ⛔ 「사세요」는 안 붙인다 — 정보지 재촉이 아니다.
              ⛔ 그림(펭펭)을 뺐다 — 창업자 *"그림 박스하나 없어져"*. */}
          <div className="imp-notice">
            <Icon name="sparkles" size={20} color="#4f7d48" stroke={1.8} />
            <div>
              {/* ✍️ [창업자 2026-08-29] 문구를 창업자가 «직접» 줄여 줬다 — 그대로 쓴다.
                  📮 *"초록박스-레시피열쇠를 다쓰면 기본인식으로. 다음줄 그래도 무료로 계속 쓸 수 있어요."*
                  ⭐ 앞판(「바뀌어요」/「그때도 계속 무료로 쓸 수 있어요」)보다 짧다 —
                     「바뀌어요」를 빼니 «상태»가 되고, 「그래도」가 앞줄을 곧장 받는다. */}
              <b>{KEY_NAME}를 다 쓰면 기본 인식으로</b>
              <span>그래도 <b>무료로 계속</b> 쓸 수 있어요</span>
            </div>
          </div>


          {/* 📦📦 네 갈래 — [창업자 2026-08-28] «각각 박스» ＋ 넉넉한 간격
              📮 *"박스에 글자가 좀 작고 줄바꿈도 어색해서 바로 안 읽혀.
                 제목. 설명 박스와 박스 사이 간격을 넉넉하게 하자."*
              ⭐⭐ 옛 판은 ①만 박스고 ②③④는 «한 카드 안의 줄»이었다 — 선으로만 갈려서
                 셋이 서로 붙어 보였고, ①과 나머지가 다른 무게로 읽혔다.
                 이제 넷이 대등한 박스다(축이 하나면 무게도 같아야 한다).
              ⭐ ①만 바탕색으로 도드라진다 — 창업자가 「제일 많이 써요」를 남겼다.
              ⛔ 값(열쇠 몇 개)은 여전히 «고르는 그 줄»에 붙는다 — 창업자가 결제에서 정한 원칙과 같다:
                 *"구매 탭은 안 만든다 — 「쓰려는 순간」 그 자리에서"*. 알리는 것도 같은 자리다. */}
          <div className="imp-opts">
            {OPTIONS.map((o, i) => (
              <button
                key={o.key}
                className={`imp-opt press${i === 0 ? ' is-top' : ''}`}
                onClick={() => choose(o.key)}
              >
                <div className="imp-opt-ico">
                  <Icon name={o.icon} size={i === 0 ? 25 : 24} color={i === 0 ? '#8a5a37' : o.color} stroke={1.7} />
                </div>
                <div className="imp-opt-t">
                  {/* 🏅 알약은 제목 «위»에 눈썹으로 올린다 (⛔제목 옆이 아니다)
                      ⛔ 옆에 두면 제목이 두 줄이 되는 순간 알약이 «제목과 설명 사이»로 끼어든다 —
                         실물로 찍어 보고서야 보였다(규칙 21 · 숫자는 「가로넘침 0」이라 통과시켰다).
                      ⭐ 눈썹 자리는 제목 길이와 무관해서 어느 폭에서도 안 흔들린다.
                         v11.31 의 「칸을 벗어남」도 여기선 구조적으로 못 난다. */}
                  {/* 🏅 [2026-08-29] 알약을 «데이터»로 뺐다 — 전엔 `i === 0` 이 하드코딩이라
                      ③ 「무료로도 돼요」를 붙일 수가 없었다. 줄 순서를 바꿔도 안 흔들린다. */}
                  {o.pill && <div className="imp-opt-pill">{o.pill}</div>}
                  <div className="imp-opt-a">{o.title}</div>
                  <div className="imp-opt-b">{o.desc}</div>
                  {/* 💰💰 [창업자 2026-08-28] 값 꼬리(「캡처하면 열쇠 1개」)를 **목록에서 뺐다**
                      📮 *"캡쳐하면 열쇠1개 **다 빼자. 초록박스에 설명했으니까.**"*
                      ⭐⭐ 창업자 판단이 맞다 — 목록의 일은 **「어느 길로 갈까」를 고르게 하는 것**이다.
                         네 줄에 빨간 값이 나란히 붙으면 고르기 «전»에 돈 걱정부터 하게 된다.
                         값은 위 초록 박스가 «한 번에» 말한다: 다 써도 기본 인식으로 계속 된다.
                      ⛔ 2026-08-21 확정(*"어 다 안내해"* — 다섯 줄 전부에 장수)을 «뒤집는» 게 아니다.
                         그때는 이 화면에 초록 박스가 «없어서» 빈칸이 「공짜인가?」로 읽혔다.
                         이제 그 말을 하는 자리가 생겼으니 같은 말을 다섯 번 안 한다.
                      ⭐ `costText`·`paid` 는 «데이터로 그대로 살아 있다** — 안내 화면 단추가 계속 쓴다.
                         거기선 「캡처 = 열쇠 1개 ↔ 붙여넣기 = 열쇠 0개」로 **길이 갈리는 자리**라
                         값이 빠지면 유저가 공짜 길을 못 고른다. */}
                </div>
                <Icon name="chevron-right" size={18} color={i === 0 ? '#c0a986' : 'var(--sand)'} />
              </button>
            ))}
          </div>


          {/* AI 자동정리 — 이미 되는 기능(캡처 OCR·링크 읽기·텍스트). '이렇게 돼요' 안내로. */}
          <button
            className="press"
            onClick={() => setAiPreview(true)}
            style={{
              width: '100%', textAlign: 'left', marginTop: 14, padding: '11px 13px',
              borderRadius: 14, border: '1px solid #d6e5cd',
              background: 'linear-gradient(135deg, #f2f8ed, #e8f1df)',
              display: 'flex', alignItems: 'center', gap: 11,
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(90,120,70,.16)',
            }}><Icon name="sparkle" size={19} color="#7fa06a" stroke={1.6} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15.5, fontWeight: 800, color: '#4a7a45', lineHeight: 1.5 }}>AI 자동 정리</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', background: '#7fa06a', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>이미 돼요</span>
              </div>
              {/* ⛔ 「캡처·링크 올리면」이었다 — **링크는 자동으로 안 채워진다.**
                     돈 드는 길(사진)과 안 되는 길(링크)이 한 줄에 묶여 있었다(창업자 확정 ⓑ · 2026-08-21).
                  ⛔⛔ 그걸 「캡처·글」로 고쳤는데 **아직 반쪽이었다** — 이번엔 «돈 드는 길»과 «공짜 길»이 묶였다.
                     🔢 코드로 갈랐다 = `ocrImage()`(돈 드는 AI 스캔)를 부르는 곳은 **셋뿐**이다 —
                        캡처(EditorScreen) · 영수증(PantryView) · 공유받기(App.jsx).
                        **글 붙여넣기·링크 담기는 `ocr.js` 를 아예 import 하지 않는다**(ImportScreen 은 `getOcrLeft` 만 읽는다).
                     ⭐ 그래서 「0장」은 짐작이 아니라 실측이다.
                  ⭐ 값을 «숫자 대 숫자»로 놓는다 — 「공짜」라고 쓰면 「되는데 돈만 안 든다」로 읽혀
                     정작 무엇이 깎이는지가 안 보인다. 1 ↔ 0 이 제일 빠르게 읽힌다. */}
              <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text-sub)', marginTop: 2, wordBreak: 'keep-all' }}>
                캡처는 <b style={{ fontWeight: 800, color: 'var(--danger)' }}>{keyCount(1)}</b> · 글 붙여넣기는 <b style={{ fontWeight: 800, color: '#4a7a45' }}>{keyCount(0)}</b>
              </div>
              {/* ⛔ 남은 장수는 여기 «두지 않는다» — 창업자 *"너무 안보여"* (2026-08-13).
                  스크롤해야 나오는 자리라 「잘 보이게」가 안 된다. → 화면 «맨 위»로 올렸다. */}
            </div>
            <Icon name="chevron-right" size={16} color="#8aa07a" />
          </button>

          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', marginTop: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', border: 'none' }}
            onClick={() => setHelp(true)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>가져오기가 어렵다면?</div>
              <div className="t-sub" style={{ marginTop: 3 }}>인스타·유튜브 레시피를 한끼로 옮기는 법 보기</div>
            </div>
            <div className="opt-ico" style={{ background: '#fff' }}>
              <Icon name="help" size={22} color="var(--sand)" />
            </div>
          </button>
        </div>
      ) : 안내들[flow] ? (
        // 📖📖 [창업자 2026-08-28] **네 갈래의 「안내 ＋ 가져오기」 화면** — *"각각의 화면을 누르면 안내+가져오기"*
        //   ✍️ 문체 = 창업자 규칙 그대로 = *"알아듣기 쉽고 간단하게 설명(**구구절절금지**) 딱딱 포인트만 집어서.
        //      **눌러야하는 것 강조.**"* → 한 단계 = 한 줄 · 누르는 것은 「」 로 감싸 굵게.
        //   ⏳ 그림(5컷)은 아직 «창업자 캡처 대기»다 — 글로 먼저 세워 두고, 컷이 오면 단계마다 끼운다
        //      (📄 `docs/캡처공유-안내-2026-08-28.md`). ⛔남의 인스타 게시물 캡처는 안 쓴다.
        <div className="pad fade">
          {/* 🗓 [창업자 2026-08-28] *"제목 줄바꿈, 줄간격 조절하자. **제목이랑 설명사이는 조금 띄우고**"*
              ⭐ 제목은 «두 줄»이 되는 게 정상이다(「SNS 보다가 캡처해서 바로 한끼로」) — 줄이지 않고
                 `text-wrap: balance` 로 **두 줄 길이를 비슷하게** 나눈다. ⛔`keep-all` 만으론 낱말이 한쪽에 몰린다. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23, wordBreak: 'keep-all', textWrap: 'balance', lineHeight: 1.35 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 12, marginBottom: 18, fontSize: 16, lineHeight: 1.6, wordBreak: 'keep-all', textWrap: 'pretty' }}>
            {안내들[flow].lead}
          </div>

          {/* 1·2·3 — ⛔ 번호는 «진짜 순서»일 때만 쓴다. 여기는 실제로 차례대로 해야 하는 일이다. */}
          {/* 🗓 [창업자 2026-08-28] *"**1.2.3번은 너무 띄웠어 (글자가 작은데 줄간이 넓음)** 줄바꿈도 이상"*
              🔢 전 = 줄 사이 `padding 11px` ＋ 글줄 `lineHeight 1.55` → 한 줄짜리 걸음도 키가 49px 이라
                 셋이 서면 «목록»이 아니라 «따로 떨어진 세 덩어리»로 보인다.
              ✅ 줄 사이를 8px, 글줄을 1.42 로. **글자 크기(16.5)는 안 건드린다** — 창업자가 지적한 건
                 「글자가 작은데」가 아니라 «작은 글자에 비해 줄간이 넓다»이므로 좁히는 쪽이 맞다.
              ⛔ v11.31 의 「가져오기 상자 줄간 1.5 통일」과 부딪히지 않는다 — 그건 `.imp` 안(목록 화면)이고
                 여기는 «안내 화면»이라 그 CSS 가 안 걸린다(실측 = 이 값은 인라인이 정한다).
              ✍️ 줄바꿈 = `text-wrap: pretty` — 마지막 줄에 한 낱말만 떨어지는 것(외톨이)을 없앤다. */}
          <div className="card" style={{ padding: '4px 0', marginBottom: 16 }}>
            {안내들[flow].steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '8px 16px' }}>
                <span style={{
                  flex: '0 0 auto', width: 25, height: 25, borderRadius: '50%',
                  background: 'var(--cream)', color: 'var(--brown)',
                  fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                {/* ✍️ 줄바꿈 = `balance`(⛔`pretty` 아님) — 실측으로 갈렸다.
                    `pretty` 는 마지막 줄에 낱말 «하나»만 남을 때만 손대서 「…사진을／열어요」·「…「한끼」를／찾아요」를
                    그대로 뒀다. `balance` 는 **두 줄 길이를 비슷하게** 잘라 걸음이 「반 줄 ＋ 꼬리」로 안 보인다. */}
                <span style={{ fontSize: 16.5, lineHeight: 1.42, wordBreak: 'keep-all', textWrap: 'balance', flex: 1, minWidth: 0 }}>{s}</span>
              </div>
            ))}
          </div>

          {/* 💬 처음 쓰는 사람만 만나는 화면 — 걸음 «번호»를 안 준다(위 NOTE_이미지고르기 주석 참조).
              ⭐ 왼쪽 세로선 ＋ 흐린 글자 = 「덧붙이는 말」로 읽히게. 걸음 셋의 무게를 안 흔든다. */}
          {안내들[flow].note && (
            <div style={{
              margin: '-4px 0 16px', paddingLeft: 11, borderLeft: '3px solid var(--cream)',
              fontSize: 15, lineHeight: 1.5, color: 'var(--muted)',
              wordBreak: 'keep-all', textWrap: 'pretty',
            }}>{강조(안내들[flow].note)}</div>
          )}

          {/* 📸📸 [창업자 2026-08-28] 단계 «바로 아래»에 실제 화면 사진 한 장
              📮 *"1.2.3아래에 한장짜리 사진 넣자. **이게 제일 직관적이야.**"* ·
                 *"역시 설명아래 사진 한장 붙임"*
              ⭐⭐ 글로 「더보기(점 세 개)를 누르세요」라고 백 번 적는 것보다 **그 화면 한 장**이 빠르다.
                 여기가 유저가 제일 많이 막히는 자리다(갤럭시 공유 시트에서 「한끼」가 첫 줄에 안 뜬다).
              ⛔ 여러 컷을 잇지 «않는다» — 창업자가 콕 집어 「한장짜리」라고 했다.
                 컷이 늘면 그걸 또 순서대로 읽어야 해서 «직관»이 사라진다.
              ⏳ 사진은 창업자가 찍는 중(*"나는 인스타에 사진 찍는거 해볼게"*) →
                 오면 `src/assets/guide/` 에 넣고 위 `안내들` 의 `shot` 한 줄만 채우면 붙는다.
                 ⛔ 없으면 «아무것도 안 그린다» — 빈 자리·「준비 중」 딱지를 두지 않는다(그게 고장으로 읽힌다). */}
          {안내들[flow].shot && (
            <figure className="imp-shot">
              <img src={안내들[flow].shot} alt={안내들[flow].shotAlt || ''} draggable={false} />
            </figure>
          )}

          {/* ✅ 결과 — 「그래서 어떻게 되나」. ⛔없으면 유저가 «담긴 뒤»를 못 그린다. */}
          <div style={{
            padding: '12px 15px', borderRadius: 14, marginBottom: 18,
            background: 'linear-gradient(135deg, #eef7e7, #e2eed7)', border: '1px solid #cfe3c4',
            fontSize: 16, fontWeight: 700, color: '#3d6b38', lineHeight: 1.55, wordBreak: 'keep-all',
          }}>{안내들[flow].result}</div>

          {안내들[flow].buttons.map((b) => (
            <button key={b.label} className={b.ghost ? 'btn-ghost press' : 'btn-primary press'}
              style={{ width: '100%', marginBottom: 10 }} onClick={b.onClick}>
              {b.label}
            </button>
          ))}
        </div>
      ) : flow === 'text' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name="edit" size={24} color="#B0895E" stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>텍스트 붙여넣기</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 16 }}>
            인스타 캡션·블로그·메모의 레시피 글을 그대로 붙여넣으면 제목·재료·순서로 자동 정리해요.
          </div>
          <textarea
            className="diary-note"
            style={{ minHeight: 220 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'여기에 레시피 글을 붙여넣어 주세요.\n\n예)\n된장크림파스타\n스파게티 200g\n된장 1큰술\n생크림 200ml\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다'}
            autoFocus
          />
          <button className="btn-primary press" style={{ marginTop: 18 }} onClick={saveText}>
            자동 정리하기 →
          </button>
        </div>
      ) : flow === 'instagram' || flow === 'youtube' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 16.5 }}>
            {flow === 'instagram' ? '인스타 레시피를 한끼로 옮기는 방법이에요.' : '영상 레시피를 한끼로 옮기는 방법이에요.'}
          </div>

          {/* 방법을 카드 몇 장으로 길게 설명하던 걸 '한 줄짜리 선택지'로 바꿨다.
              (창업자 2026-07-29 "설명이 너무 복잡하고 정신없어") 고를 것만 보이게 한다. */}
          {/* 💰💰 [2026-08-21 창업자 *"어 다 안내해"*] 여기가 «진짜 갈림길»이다 —
                 목록 줄은 「캡처는 1장」이라고 조건만 말하고, 셋 중 무엇을 고르는지는 이 화면에서 정해진다.
              ⭐ 그래서 단추마다 «정확한» 값을 적는다. 목록에만 적으면 유저는 여기서 다시 모른다.
              ⚠️ 「보면서 적기」는 «받아적으면» 0장이다 — 그 화면(editor)에서 캡처를 누르면 1장을 쓴다.
                 그래서 그냥 「0장」이라 안 적고 조건을 밝힌다. ⛔안 밝히면 캡처를 누른 사람이 «속았다»고 느낀다. */}
          {(flow === 'youtube'
            ? [
                ['camera', '캡처해서 올리기', '캡처만 하면 재료·순서 자동으로', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } }), keyCount(1), true],
                ['pen', '설명(더보기) 붙여넣기', '글 복사해 오면 알아서 정리해요', false, () => { setFlow('text'); setText('') }, keyCount(0), false],
                ['play', '영상 보면서 적기', '영상 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } }), `받아적으면 ${keyCount(0)}`, false],
              ]
            : [
                ['camera', '캡처해서 올리기', '인스타는 글자 복사가 안 돼요', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } }), keyCount(1), true],
                ['pen', '글을 복사했다면 붙여넣기', '복사한 글을 넣으면 알아서 정리해요', false, () => { setFlow('text'); setText('') }, keyCount(0), false],
                ['photo', '미리보기 띄우고 적기', '게시물 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } }), `받아적으면 ${keyCount(0)}`, false],
              ]
          ).map(([ic, t, d, best, go, costText, paid]) => (
            <button key={t} className="card press" onClick={go}
              style={{ width: '100%', textAlign: 'left', padding: '14px 15px', marginBottom: 10, border: 'none', background: best ? 'var(--cream)' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="opt-ico" style={{ flexShrink: 0, background: best ? '#fff' : 'var(--cream)' }}>
                <Icon name={ic} size={21} color="var(--brown)" stroke={1.8} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 800 }}>{t}</span>
                  {best && <span style={{ fontSize: 15, fontWeight: 800, color: '#8a5a37', background: '#f0dcc7', borderRadius: 999, padding: '2px 7px' }}>추천</span>}
                </span>
                {/* ⛔ `keep-all` — 꼬리가 붙어 두 줄이 되면 한글 낱말이 가운데서 잘린다(오늘 두 번 겪었다) */}
                <span className="t-sub" style={{ display: 'block', fontSize: 15.3, lineHeight: 1.5, marginTop: 3, wordBreak: 'keep-all' }}>{d}{장수꼬리(costText, paid)}</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--sand)" />
            </button>
          ))}

          {/* 링크는 '바로가기 저장'뿐이라 접어둔다 — 펼쳐야 보이게. */}
          <button className="press" onClick={() => setLinkOpen((v) => !v)}
            style={{ width: '100%', marginTop: 6, padding: '11px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: 'var(--text-sub)', background: 'transparent', border: 'none' }}>
            <Icon name="link" size={15} color="var(--text-sub)" stroke={1.8} /> 링크만 저장해두기
            {/* 위/아래 화살표 아이콘이 없어서 오른쪽 꺾쇠를 돌려 쓴다 */}
            <Icon name="chevron-right" size={15} color="var(--sand)" style={{ transform: linkOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
          </button>
          {linkOpen && (
            <div className="card fade" style={{ padding: 14, border: 'none' }}>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" style={{ width: '100%', marginBottom: 10 }} />
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={saveLink} disabled={!url.trim()}>
                바로가기로 저장
              </button>
              <div className="t-sub" style={{ fontSize: 15, marginTop: 9, lineHeight: 1.55 }}>
                링크에서 <b>재료·순서를 자동으로 가져오는 기능은 준비 중</b>이에요. 지금은 주소만 담아둬요.
              </div>
            </div>
          )}

          <button className="press" onClick={() => openExternal(flow === 'instagram' ? 'https://www.instagram.com/' : 'https://www.youtube.com/')}
            style={{ width: '100%', marginTop: 14, padding: '10px 4px', fontSize: 16, fontWeight: 700, color: flowMeta.color, background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name={flowMeta.icon} size={16} color={flowMeta.color} stroke={2} /> {flowMeta.title} 열러 가기 ↗
          </button>
        </div>
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>{flowMeta.title}</div>
          </div>
          {/* ⭐ 제일 먼저 «안 되는 것»을 말한다 — 옛 문장은 「바로가기로 저장하는 기능」이라 맞는 말이었지만
                 「그래서 내용은 안 담긴다」를 유저가 스스로 알아채야 했다. 그 한 걸음이 오해를 만든다. */}
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--brown)' }}>주소만 담아둬요.</b> 재료·만드는 법은 <b>안 담겨요.</b><br />
            내용까지 옮기고 싶다면 아래 방법이 확실해요.
          </div>

          {/* 블로그 정직 안내 — 사진이 많아 캡처가 번거로우니 '글 복사 → 텍스트 붙여넣기'를 권한다 */}
          <button
            className="press"
            onClick={() => { setFlow('text'); setText('') }}
            style={{ width: '100%', textAlign: 'left', marginBottom: 16, padding: '13px 15px', borderRadius: 'var(--r-md)', background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11 }}
          >
            <div className="opt-ico" style={{ background: '#fff', flexShrink: 0 }}><Icon name="edit" size={20} color="var(--brown)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--brown)', marginBottom: 2 }}>블로그는 글 복사 → 텍스트 붙여넣기 추천</div>
              <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.5 }}>블로그는 사진이 많아 캡처가 번거로워요. 레시피 글을 <b>복사</b>해서 붙여넣으면 제일 깔끔해요.</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>

          <div className="field">
            <label>링크 주소</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" autoFocus />
          </div>
          <div className="field">
            <label>제목 (선택)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이모네 갈비찜" />
          </div>

          <button className="btn-primary press" style={{ marginBottom: 10, opacity: url.trim() ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={saveLink} disabled={!url.trim()}>
            <Icon name="link" size={16} color="#fff" /> 주소만 담아두기
          </button>
          {/* ⏳ 서버 되면 되살릴 것 ② — 여기 「본문 자동 읽기 시도 (베타)」 버튼이 있었다.
              ⛔ 뺀 이유 = **거의 언제나 실패했다.** 눌러서 25초를 기다린 끝에 못 읽었다는 말을 듣는 건
                 「안 되는 기능」이 아니라 «고장난 앱»으로 읽힌다. 그 사이 유저는 아무것도 못 한다.
              ✅ 되살리는 법 = 우리 서버(Worker)에 본문 읽기 길을 낸 뒤 이 자리에 버튼을 되돌리고
                 `readLink()`(git 히스토리 · 이 커밋의 부모에 있다)와 `fetchLinkRecipe` import 를 되살린다. */}
          <div className="card" style={{ padding: 14, background: 'var(--cream)', border: 'none', display: 'flex', gap: 10 }}>
            <Icon name="inbox" size={20} color="var(--brown)" />
            <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.5, color: 'var(--brown)' }}>
              담아두면 <b>임시보관함</b>에 들어가요. 나중에 열어 <b>캡처</b>나 <b>텍스트 붙여넣기</b>로 내용을 채워 주세요.
            </div>
          </div>
        </div>
      )}

      {aiPreview && (
       <Portal>
        <div className="sheet-mask" onClick={() => setAiPreview(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 26 }}>
            <div className="emoji-sheet-head">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="sparkle" size={18} color="var(--brown)" /> AI 자동정리</span>
              <button className="press" onClick={() => setAiPreview(false)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '4px 18px 0' }}>
              {/* 이미 되는 기능 · 헤드라인 */}
              <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12, padding: '4px 12px', borderRadius: 999, background: '#eef5ea', color: '#4a7a45', fontSize: 15, fontWeight: 800 }}>이미 돼요 <Icon name="sparkle" size={12} color="#4a7a45" /></span>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--brown)', lineHeight: 1.3, letterSpacing: '-0.02em' }}>사진 찍으면<br />레시피가 돼요</div>
                <div className="t-sub" style={{ fontSize: 16, marginTop: 9, lineHeight: 1.6 }}>캡처만 올리면 재료·순서를<br />칸칸이 알아서 정리해드려요.</div>
              </div>

              {/* 장점 */}
              <div className="card" style={{ padding: '4px 2px', background: 'var(--cream)', border: 'none' }}>
                {[
                  ['camera', '캡처 사진 인식', '레시피 화면을 캡처만 하면 재료·순서를 칸칸이 자동으로 채워요.'],
                  // ⛔ 「블로그 링크 (베타)」였다 — **여기가 제일 세게 약속하던 자리**다(창업자 확정 ⓑ · 2026-08-21).
                  //    ⏳ 서버 되면 이 줄을 되살린다.
                  ['pen', '글 붙여넣기', '블로그·유튜브 설명 글을 복사해 붙여넣으면 재료·순서로 정리해요.'],
                  ['clock', '옮겨적기 끝', '손으로 하나하나 타이핑할 필요 없이 몇 초면 완성.'],
                  ['pen', '언제든 손보기', 'AI가 정리한 결과는 마음대로 고치고 다듬을 수 있어요.'],
                ].map(([ic, t, b]) => (
                  <div key={t} style={{ display: 'flex', gap: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 24, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}>
                      <Icon name={ic} size={19} color="var(--brown)" stroke={1.7} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t}</div>
                      <div className="t-sub" style={{ fontSize: 15.3, lineHeight: 1.5 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.65, marginTop: 16, textAlign: 'center', color: 'var(--brown)' }}>
                지금 바로 돼요 — <b>캡처</b>와 <b>붙여넣은 글</b>에서<br />재료·순서를 채워 드려요.
              </div>
              <button
                className="btn-primary press"
                onClick={() => { setAiPreview(false); choose('write') }}
                style={{ width: '100%', marginTop: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name="camera" size={17} color="#fff" /> 사진으로 시작하기
              </button>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {help && (
       <Portal>
        <div className="sheet-mask" onClick={() => setHelp(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24 }}>
            <div className="emoji-sheet-head">
              <span>레시피 가져오는 법</span>
              <button className="press" onClick={() => setHelp(false)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="camera" size={16} color="var(--brown)" stroke={1.8} /> 인스타그램 — 캡처해서 올리기 (제일 정확)</div>
                <div className="imp-tip-b">
                  인스타는 캡션 글자를 복사할 수 없어요.<br />
                  1. 레시피가 보이는 화면을 <b>캡처(스크린샷)</b><br />
                  2. 한끼 → 가져오기 → <b>사진·직접 작성하기</b><br />
                  → 작성 화면에서 <b>재료 사진·만드는 법 사진</b>을 각각 올리면 정확하게 채워져요. <span className="t-sub" style={{ fontSize: 15 }}>길면 2~3장 나눠서 이어 붙여도 돼요!</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pen" size={16} color="var(--brown)" stroke={1.8} /> 유튜브·블로그 — 글자 복사되면 붙여넣기</div>
                <div className="imp-tip-b">
                  유튜브 <b>설명(더보기)</b>이나 블로그 글은 대개 복사돼요.<br />
                  복사 → 가져오기 → <b>텍스트 붙여넣기</b> → 자동 정리! <span className="t-sub" style={{ fontSize: 15 }}>복사가 안 되면 캡처해서 사진으로.</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="share" size={16} color="var(--brown)" stroke={1.8} /> 앱 설치하면 — 공유로 바로 담기</div>
                <div className="imp-tip-b">
                  앱을 설치하면 인스타·유튜브 <b>공유(↗)</b> 목록에 <b>‘한끼’</b>가 떠요.<br />
                  <span className="t-sub" style={{ fontSize: 15 }}>단, 인스타 공유는 ‘링크’만 보내져요(캡션은 안 와요). 내용까지 담으려면 캡처가 확실해요.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
       </Portal>
      )}
    </div>
  )
}

function placeholderFor(flow) {
  if (flow === 'instagram') return 'https://instagram.com/p/...'
  if (flow === 'youtube') return 'https://youtube.com/watch?v=...'
  return 'https://...'
}

export function makeInboxRecipe({ source, title, sourceUrl = '', image = null, category, memo = '' }) {
  return {
    id: newId(),
    title,
    // 가져온 레시피도 기본 썸네일은 브랜드 아이콘(통일감). 사진은 원하면 편집에서 고른다.
    thumb: 'icon',
    icon: guessFoodIcon(title),
    emoji: '🍽️',
    image,
    source,
    category: category || guessCategory(title + ' ' + memo),
    tags: [],
    time: 0,
    servings: 0,
    difficulty: '',
    ingredients: [],
    steps: [],
    memo,
    sourceUrl,
    status: 'unsorted',
    folder: null,
    favorite: false,
    cooked: 0,
    savedAt: Date.now(),
  }
}
