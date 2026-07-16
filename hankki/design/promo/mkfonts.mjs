// fonts-embed.css 재생성기
// 사용법:  node mkfonts.mjs   (이 폴더에서 실행)
// ./fonts 안의 woff2 를 base64 로 인라인해서 fonts-embed.css 를 만든다.
// unicode-range 로 한글/라틴 서브셋을 분리 → HTML 에서 <link href="fonts-embed.css"> 한 줄이면 끝.
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
const kor = 'U+1100-11FF,U+3130-318F,U+A960-A97F,U+AC00-D7A3,U+D7B0-D7FF'
const lat = 'U+0000-00FF,U+2010-2027,U+2030-205E'
let css = ''
for (const d of defs) {
  css += `@font-face{font-family:'${d.fam}';src:url(data:font/woff2;base64,${b(d.k)}) format('woff2');unicode-range:${kor}}\n`
  try { css += `@font-face{font-family:'${d.fam}';src:url(data:font/woff2;base64,${b(d.l)}) format('woff2');unicode-range:${lat}}\n` } catch (e) {}
}
fs.writeFileSync(new URL('./fonts-embed.css', import.meta.url), css)
console.log('fonts-embed.css 생성 완료:', css.length, 'bytes')
