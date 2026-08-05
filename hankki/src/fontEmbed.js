// 🔤 캡처용 «글꼴 꾸러미» — 한 번만 만들어 두고 계속 쓴다.
//
// ⛔⛔ 2026-08-05 「자랑카드 먹통」의 진짜 뿌리가 여기였다.
//   `html-to-image` 는 화면을 그림으로 뽑을 때 **글꼴 파일을 통째로 카드 안에 밀어 넣는다**
//   (SVG 안에서는 바깥 글꼴을 못 쓰기 때문이다). 우리 글꼴은 **8개·1.7MB** 라
//   그 준비만으로 캡처 한 장이 **15~24초** 걸렸다. 그런데 그걸 **캡처할 때마다 다시** 했다.
//   ⭐ 실측(2026-08-05 · 중급 폰 흉내):
//        글꼴 포함 15.3초  →  글꼴 빼면 1.4초   (11배)
//   ⭐ 글꼴을 뺄 수는 없다(카드 글씨가 죽는다) → **한 번만 만들고 돌려쓴다.**
//
// 📌 쓰는 법
//   ① 화면에 들어갈 때 `warmFontCSS()` — 조용히 미리 만들어 둔다
//   ② 캡처할 때 `await fontCSS()` 를 `toJpeg/toPng` 의 `fontEmbedCSS` 로 넘긴다
import { getFontEmbedCSS } from 'html-to-image'

let pending = null // 만드는 중인 약속
let done = null // 다 만든 결과(문자열). 실패해도 '' 로 채워 다시 안 돈다.

// 준비돼 있으면 «기다림 없이» 곧바로 준다 — 공유는 누른 «직후»에만 허용되므로
// 여기서 await 하면 그 허가가 깨진다.
export const fontCSSNow = () => done

// ⛔⛔⛔ 2026-08-05 — **여기서 회귀를 냈다.** 창업자 캡처: 카드 글씨가 통째로 기본 고딕이 되고
//   「15분」이 「15 / 분」으로 쪼개졌다(*"꾸미기 글씨체바뀌고 레시피깨짐"*).
//   뿌리 둘 —
//   ⓐ 실패하면 `done = ''` 로 **빈 값을 «영구» 캐시**했다.
//   ⓑ 그 빈 값을 `fontEmbedCSS` 로 넘겼는데, `html-to-image` 는 그걸
//      **「글꼴을 심지 말라」**는 뜻으로 읽는다 → 손글씨가 전부 기본 글꼴로 떨어지고
//      글자 폭이 달라져 **레이아웃이 통째로 깨진다.**
//   ⭐ 그래서 이제 **「덜 만들어졌으면 아예 안 쓴다」** — 안 넘기면 원래대로
//      `html-to-image` 가 스스로 심는다(느리지만 «정확»하다). 느린 건 고칠 수 있어도
//      친구한테 깨진 카드가 나가는 건 못 되돌린다.
//
// 「쓸 수 있는 꾸러미인가」 — ⛔**눈대중으로 짜지 말 것.**
//   처음엔 `url(data:` 를 셌는데 html-to-image 는 `url("data:` 로 넣는다 → 늘 «못 쓴다»가 나와
//   캡처가 다시 27초로 늦어졌다. 📌 **글꼴이 실제로 담겼으면 CSS 가 «수백 KB»다** — 길이가 제일 튼튼하다.
const isUsable = (css) => !!css && css.length > 50000 && /url\(\s*["']?data:/.test(css)

export function fontCSS() {
  if (done) return Promise.resolve(done) // ⚠️ 빈 값은 캐시로 안 친다 — 다음에 다시 만든다
  if (!pending) {
    // ⭐ 글꼴이 «다 뜬 뒤에» 만든다. 로드 전에 만들면 반쪽짜리가 나온다.
    pending = (document.fonts ? document.fonts.ready : Promise.resolve())
      .then(() => getFontEmbedCSS(document.body))
      .then((css) => {
        pending = null
        done = isUsable(css) ? css : null // 덜 만들어졌으면 «안 쓴다»
        return done || ''
      })
      .catch(() => { pending = null; return '' })
  }
  return pending
}

// 미리 데워두기 — 결과를 안 기다린다. 화면 열 때 한 번 부르면 된다.
export function warmFontCSS() {
  if (!done) fontCSS()
}
