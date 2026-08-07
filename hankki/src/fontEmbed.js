// 🔤 캡처용 «글꼴 꾸러미» — 한 번만 만들어 두고 계속 쓴다.
//
// ⛔⛔ 이 파일은 v9.63 에 들어왔다가 v9.66 에 **쓰기를 그만뒀다**(카드 글자가 깨져서).
//    2026-08-05 에 «왜 깨졌는지»를 코드와 실측으로 잡고 다시 켠다. 아래 두 문단이 그 기록이다.
//
// ⓐ **옛 실패** — 실패하면 `done = ''` 로 **빈 값을 «영구» 캐시**했고, 빈 값을 `fontEmbedCSS` 로
//    넘기면 `html-to-image` 는 **「글꼴을 심지 말라」**로 읽는다 → 손글씨가 기본 고딕으로 떨어지고
//    글자 폭이 달라져 레이아웃이 통째로 깨진다(창업자 캡처 *"꾸미기 글씨체바뀌고 레시피깨짐"*).
//
// ⓑ **빈 값을 막아도 여전히 깨졌다 — 그 뿌리를 이제 찾았다.**
//    📖 `html-to-image/lib/embed-webfonts.js`
//       · 238~253줄 `getUsedFonts(node)` = 그 노드와 자식들이 «지금 쓰는» font-family 만 모은다
//       · 263~266줄 = @font-face 를 그 목록에 있는 것만 남기고 **나머지는 버린다**
//       → 꾸러미 내용은 «어떤 조각으로 만들었나»에 통째로 달려 있다.
//    🔬 실측 (`scripts/_measure-fontembed.mjs`) — 앱이 선언한 것 = @font-face 8줄 · 글꼴 4종
//       · 앱 켠 직후 `document.body` → **2종만**(Jua 빠짐)   ← 옛 코드가 한 방식
//       · 꾸민 표지 하나로  → Gowun Dodum · Gaegu
//       · 레시피카드 하나로 → Jua
//    ⭐⭐ **두 장이 서로 다른 글꼴을 쓴다.** 한쪽으로 만든 꾸러미로 둘 다 덮으면 반드시 한쪽이 깨진다.
//    ⭐⭐ 그리고 옛 코드는 **Jua 가 빠진** 꾸러미를 만들었다 — 「한끼」·「15분」·「레시피 보러가기」가
//         전부 Jua 다. 창업자 캡처에서 깨진 글자 셋과 정확히 일치한다.
//
// ⭐ 답 = **4종을 «전부» 쓰는 표본 조각**으로 만든다. 그러면 라이브러리 자기 코드가 4종을 다 담는다.
// 🔒 안전장치 = 4종이 다 안 들어 있으면 **아예 안 쓴다**(느려도 정확한 옛 길로 돌아간다).
//    느린 건 고칠 수 있어도 친구한테 깨진 카드가 나가는 건 못 되돌린다.
//
// 📌 쓰는 법 = ①공유가 있는 화면에 들어갈 때 `warmFontCSS()` ②캡처할 때 `fontOptFrom(await fontCSS())`
import { getFontEmbedCSS } from 'html-to-image'

// ⚠️ `styles.css` 의 @font-face 와 «같아야» 한다. 글꼴을 더하면 여기도 더할 것.
//    (안 더하면 그 글꼴이 빠진 꾸러미가 되고, 안전장치가 통째로 버려 예전 속도로 돌아간다)
//    ⭐ 2026-08-07 — 「임팩트」·「라운드」를 더했다. 꾸미기 글씨체는 여섯인데 여긴 넷뿐이라
//       **그 둘로 쓴 글자가 공유 카드에서 다른 글씨로 나갔다**(2026-08-05 「한끼」 깨짐과 같은 종류).
const FAMILIES = ['Jua', 'Gowun Dodum', 'Gaegu', 'Nanum Pen Script', 'Black Han Sans', 'Do Hyeon']

let done = null // 다 만든 꾸러미. ⛔ 못 만들었으면 계속 null — '' 로 굳히지 말 것(위 ⓐ)
let pending = null

// 준비돼 있으면 «기다림 없이» 곧바로 준다 — 공유는 누른 «직후»에만 열리므로 거기서 await 하면 허가가 깨진다.
export const fontCSSNow = () => done

// 4종을 «전부» 쓰는 표본 조각. 화면 밖에 잠깐 붙였다 뗀다.
function makeProbe() {
  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none'
  for (const f of FAMILIES) {
    const s = document.createElement('span')
    s.style.fontFamily = `'${f}'`
    s.textContent = '한끼' // 글자가 있어야 그 글꼴을 «쓴다»고 잡힌다
    box.appendChild(s)
  }
  document.body.appendChild(box)
  return box
}

// 쓸 수 있는 꾸러미인가 — ⛔**눈대중으로 짜지 말 것.**
//   처음엔 `url(data:` 를 셌는데 라이브러리는 `url("data:` 로 넣는다 → 늘 «못 쓴다»가 나왔다.
//   ⭐ 이제는 **4종이 다 있나**를 본다(진짜 문제였던 것) ＋ 글꼴이 실렸으면 CSS 가 수백 KB다.
const isUsable = (css) =>
  !!css && css.length > 50000 && /url\(\s*["']?data:/.test(css) && FAMILIES.every((f) => css.includes(f))

export function fontCSS() {
  if (done) return Promise.resolve(done)
  if (!pending) {
    // ⭐ 글꼴이 «다 뜬 뒤에» 만든다. 로드 전에 만들면 반쪽짜리가 나온다.
    pending = (document.fonts ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const box = makeProbe()
        return getFontEmbedCSS(box).finally(() => box.remove())
      })
      .then((css) => {
        pending = null
        done = isUsable(css) ? css : null
        return done
      })
      .catch(() => { pending = null; return null })
  }
  return pending
}

// 캡처 옵션에 그대로 펼쳐 넣는 꼴. 꾸러미가 없으면 «빈 객체» — 옵션 자체를 안 넘겨야 한다(위 ⓐ).
export const fontOptFrom = (css) => (css ? { fontEmbedCSS: css } : {})

// 미리 데워두기 — 결과를 안 기다린다. 공유가 있는 화면에 들어갈 때 한 번 부른다.
export function warmFontCSS() {
  if (!done) fontCSS()
}
