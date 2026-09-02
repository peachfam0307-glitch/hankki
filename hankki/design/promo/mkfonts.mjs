// fonts-embed.css 재생성기
// 사용법:  node mkfonts.mjs   (이 폴더에서 실행)
// ./fonts 안의 woff2 를 base64 로 인라인해서 fonts-embed.css 를 만든다.
// HTML 에서 <link href="fonts-embed.css"> 한 줄이면 끝. (오프라인·프록시 환경 OK)
//
// ⚠️ unicode-range 를 쓰지 않는다 (중요!)
//   과거 한글/라틴 서브셋을 unicode-range 로 나눴더니, 로고 생성기의 canvas fillText 가
//   range 붙은 @font-face 를 못 골라 엉뚱한 폰트(고운돋움)로 폴백되는 버그가 있었다.
//   base64 인라인이라 다운로드 최적화가 필요없으니 range 는 빼고, '글리프 커버리지'로 매칭한다:
//   한글 서브셋 woff2 엔 라틴 글리프가 없으므로 라틴 글자는 자동으로 라틴 face 로 넘어간다.
//   → DOM/canvas 어디서든 '한끼'는 주아 한글, 'HANKKI'는 주아 라틴으로 정확히 렌더된다.
//
// ※ 폰트는 모두 npm @fontsource 오픈라이선스(OFL) 패키지에서 받아 ./fonts 에 보관해 둠.
//   다시 받을 필요 없음. 새 굵기/폰트가 필요하면 @fontsource 에서 woff2 만 ./fonts 에 추가하고 defs 에 등록.
import fs from 'fs'
const defs = [
  { fam: 'Jua',        k: 'jua-korean-400.woff2',         l: 'jua-latin-400.woff2' },
  { fam: 'Gaegu',      k: 'gaegu-korean-400.woff2',       l: 'gaegu-latin-400.woff2' },
  { fam: 'GowunDodum', k: 'gowun-dodum-korean-400.woff2', l: 'gowun-dodum-latin-400.woff2' },
  { fam: 'NanumPen',   k: 'nanumpen-korean-400.woff2',    l: 'nanumpen-latin-400.woff2' },
]
const b = (p) => fs.readFileSync(new URL('./fonts/' + p, import.meta.url)).toString('base64')
let css = ''
for (const d of defs) {
  // 라틴 face 를 먼저(라틴 글자 우선), 한글 face 를 뒤에 — 둘 다 range 없이 글리프 커버리지로 매칭.
  try { css += `@font-face{font-family:'${d.fam}';src:url(data:font/woff2;base64,${b(d.l)}) format('woff2')}\n` } catch (e) {}
  css += `@font-face{font-family:'${d.fam}';src:url(data:font/woff2;base64,${b(d.k)}) format('woff2')}\n`
}
fs.writeFileSync(new URL('./fonts-embed.css', import.meta.url), css)
console.log('fonts-embed.css 생성 완료:', css.length, 'bytes')
