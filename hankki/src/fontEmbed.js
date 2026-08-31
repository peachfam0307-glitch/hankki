// 🔤 캡처용 «글꼴 꾸러미» — 그 장이 «실제로 쓰는» 글꼴만 담아 만들고, 글꼴 조합별로 쟁여 둔다.
//
// ⛔⛔ 이 파일은 v9.63 에 들어왔다가 v9.66 에 **쓰기를 그만뒀다**(카드 글자가 깨져서).
//    2026-08-05 에 «왜 깨졌는지»를 코드와 실측으로 잡고 다시 켰다. 아래 두 문단이 그 기록이다.
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
//
// ⛔⛔ **2026-08-07 — 「전부 담기」가 더는 안 통한다.**
//    v9.73 의 답은 «우리 글꼴을 전부 쓰는 표본 조각»으로 만드는 것이었다. 그땐 넷이라 1.7MB 였다.
//    오늘 글씨체가 **열둘**이 됐다 → 전부 담으면 **4.7MB**(base64 로 ~6MB).
//    그러면 ⑴캡처가 다시 하염없이 느려지고 ⑵**글씨체 하나만 쓴 사람도 열두 벌을 다 내려받는다.**
//    📌 「글꼴을 더하면 여기 목록에도 더할 것」이라던 방식이 **개수가 늘자 스스로 무너졌다.**
//
// ⭐⭐ **새 답 = 「그 장이 쓰는 것만」.** 캡처할 노드를 받아 거기서 쓰는 글꼴만 골라 담는다.
//    · 우리가 고르는 게 아니라 **화면이 정한다** — 라이브러리가 하는 계산과 같은 계산이라 어긋날 수 없다.
//    · 조합별로 쟁여 둔다(`Map`) — 같은 글씨체로 여러 장 보내면 두 번째부터 곧바로 나온다.
//    · 액자 글꼴(Jua·Gowun Dodum)은 «항상» 넣는다 — 카드 틀이 늘 쓰는데, 아직 안 붙은 상태로
//      데워둘 수도 있어서 노드에서 안 잡힐 수 있다.
// 🔒 안전장치 = **부르기로 한 글꼴이 다 안 들어 있으면 아예 안 쓴다**(느려도 정확한 옛 길로).
//    느린 건 고칠 수 있어도 친구한테 깨진 카드가 나가는 건 못 되돌린다.
//
// 📌 쓰는 법 = ①공유가 있는 화면에 들어갈 때 `warmFontCSS()` ②캡처할 때 `fontOptFrom(await fontCSS(노드들))`
import { getFontEmbedCSS } from 'html-to-image'

// ⚠️ `styles.css` 의 @font-face 와 «같아야» 한다. 글씨체를 더하면 여기도 더할 것.
//    (여기 없는 글꼴은 노드에서 잡혀도 안 담는다 — Pretendard 같은 바깥 글꼴이 섞이는 걸 막는다)
export const OUR_FONTS = [
  'Jua', 'Gowun Dodum', 'Gaegu', 'Nanum Pen Script', 'Black Han Sans', 'Do Hyeon',
  'Single Day', 'Cute Font', 'Dongle', 'Poor Story', 'Hi Melody', 'Gamja Flower',
]
// 액자(카드 틀)가 늘 쓰는 둘 — 노드에서 안 잡혀도 넣는다
const ALWAYS = ['Jua', 'Gowun Dodum']

const cache = new Map() // '글꼴|글꼴' → CSS
const pending = new Map()

// 준비돼 있으면 «기다림 없이» 곧바로 준다 — 공유는 누른 «직후»에만 열리므로 거기서 await 하면 허가가 깨진다.
export const fontCSSNow = (node) => cache.get(keyOf(familiesIn(node))) || null

const norm = (f) => f.trim().replace(/["']/g, '')
const keyOf = (fams) => fams.slice().sort().join('|')

// 🔎 이 노드가 «실제로 쓰는» 우리 글꼴 — 라이브러리의 `getUsedFonts` 와 같은 계산이다.
//    ⛔ 우리가 짐작하지 않는다. 화면에 있는 것을 읽는다.
export function familiesIn(nodes) {
  const list = [].concat(nodes || []).filter(Boolean)
  const found = new Set(ALWAYS)
  const walk = (n) => {
    if (!(n instanceof HTMLElement)) return
    const ff = n.style.fontFamily || getComputedStyle(n).fontFamily || ''
    for (const raw of ff.split(',')) {
      const f = norm(raw)
      if (OUR_FONTS.includes(f)) found.add(f)
    }
    for (const c of n.children) walk(c)
  }
  for (const n of list) walk(n)
  return [...found]
}

// 부를 글꼴을 «전부» 쓰는 표본 조각. 화면 밖에 잠깐 붙였다 뗀다.
function makeProbe(fams) {
  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none'
  for (const f of fams) {
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
//   ⭐ 이제는 **부르기로 한 것이 다 있나**를 본다(진짜 문제였던 것) ＋ 글꼴이 실렸으면 CSS 가 수십 KB 는 된다.
//   ⚠️ 옛 문턱 50000 은 «넷을 다 담던» 시절 값이다. 지금은 한두 종만 담을 수 있어 그대로 두면
//      멀쩡한 꾸러미를 버린다 → 제일 작은 글꼴(가는체 라틴 16KB)도 통과하게 20000 으로.
const isUsable = (css, fams) =>
  !!css && css.length > 20000 && /url\(\s*["']?data:/.test(css) && fams.every((f) => css.includes(f))

export function fontCSS(node) {
  const fams = familiesIn(node)
  const key = keyOf(fams)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (!pending.has(key)) {
    // ⭐ 글꼴이 «다 뜬 뒤에» 만든다. 로드 전에 만들면 반쪽짜리가 나온다.
    const p = (document.fonts ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const box = makeProbe(fams)
        return getFontEmbedCSS(box).finally(() => box.remove())
      })
      .then((css) => {
        pending.delete(key)
        const ok = isUsable(css, fams) ? css : null
        // ⛔ 못 만들었으면 «쟁이지 않는다» — '' 로 굳히면 위 ⓐ 사고가 그대로 재현된다.
        //    다음에 다시 시도할 수 있게 둔다(글꼴이 늦게 떴을 수 있다).
        if (ok) cache.set(key, ok)
        return ok
      })
      .catch(() => { pending.delete(key); return null })
    pending.set(key, p)
  }
  return pending.get(key)
}

// 캡처 옵션에 그대로 펼쳐 넣는 꼴. 꾸러미가 없으면 «빈 객체» — 옵션 자체를 안 넘겨야 한다(위 ⓐ).
export const fontOptFrom = (css) => (css ? { fontEmbedCSS: css } : {})

// 미리 데워두기 — 결과를 안 기다린다. 공유가 있는 화면에 들어갈 때 한 번 부른다.
//   ⚠️ 노드를 안 주면 **액자 글꼴 둘만** 데운다. 유저가 딴 글씨체를 썼으면 캡처할 때 한 번 더 만든다
//      — 그래도 글꼴 파일 자체는 이미 브라우저에 있어서 그 한 번이 느리지 않다.
export function warmFontCSS(node) {
  const key = keyOf(familiesIn(node))
  if (!cache.has(key)) fontCSS(node)
}
