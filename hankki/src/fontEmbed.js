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

export function fontCSS() {
  if (done !== null) return Promise.resolve(done)
  if (!pending) {
    pending = getFontEmbedCSS(document.body)
      .then((css) => { done = css; return css })
      .catch(() => { done = ''; return '' }) // 못 만들어도 캡처는 되게(글씨만 기본 글꼴)
  }
  return pending
}

// 미리 데워두기 — 결과를 안 기다린다. 화면 열 때 한 번 부르면 된다.
export function warmFontCSS() {
  if (done === null) fontCSS()
}
