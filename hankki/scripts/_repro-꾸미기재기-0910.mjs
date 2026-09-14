// 🎨 「꾸미기를 열었나·붙였나」가 «실제로 나가는지» — 재현판.
// 📮 창업자 2026-09-10 = "꾸미기를 해본사람있어?" → 잴 눈이 없어서 못 답했다. 그래서 붙였다.
//
// ⭐ 두 갈래로 «따로» 본다. 하나만 보면 반쪽이다.
//    ① 통계 쪽 = `꾸미기열림()`·`꾸미기저장()` 이 «진짜로» page_view 를 그 이름으로 뱉나
//       ⛔ 2026-09-08 에 `screen_view` 가 코드엔 있는데 «안 잡힌» 적이 있다 — 그래서 뱉는 값을 눈으로 본다.
//    ② 화면 쪽 = 꾸미기 편집기가 그 둘을 «부르게» 되어 있나 (뜰 때 / 저장할 때)
// ⛔ UI 를 눌러 들어가는 길로는 안 잰다 — 홈에도 같은 코치 표식이 있어 «안 옮겨졌는데 옮겨진 줄» 알았다(오늘 실제로).
import { readFileSync } from 'node:fs'

let 나간것 = []
// 📌 브라우저인 척 최소한만 세운다 — stats.js 는 window·localStorage·gtag 만 본다.
globalThis.window = {
  gtag: (...a) => 나간것.push(a),
  addEventListener() {}, matchMedia: () => ({ matches: false }),
  location: { origin: 'https://x.test', pathname: '/' },
}
globalThis.location = window.location
globalThis.document = { createElement: () => ({ style: {} }), head: { appendChild() {} } }
const 통 = new Map()
globalThis.localStorage = {
  getItem: (k) => (통.has(k) ? 통.get(k) : null),
  setItem: (k, v) => 통.set(k, String(v)), removeItem: (k) => 통.delete(k),
}

const s = await import('../src/stats.js')
let 탈 = 0

// ① 통계 쪽
나간것 = []
s.꾸미기열림()
s.꾸미기저장()
const 제목 = 나간것.filter((a) => a[1] === 'page_view').map((a) => a[2] && a[2].page_title)
const 칸1 = 제목.includes('decor') && 제목.includes('decor_saved')
console.log(`  ${칸1 ? '✅' : '❌'} ① 통계 — 나간 이름 = ${JSON.stringify(제목)}`)
if (!칸1) 탈++

// ⛔ 통계를 «끈» 사람에겐 아무것도 안 나가야 한다 (방침에 그렇게 적어 놨다)
s.통계끄기설정(true)
나간것 = []
s.꾸미기열림(); s.꾸미기저장()
const 칸2 = 나간것.length === 0
console.log(`  ${칸2 ? '✅' : '❌'} ② 통계 끈 사람에겐 안 나간다 — ${나간것.length}건`)
if (!칸2) 탈++
s.통계끄기설정(false)

// ② 화면 쪽 — 편집기가 그 둘을 부르나
const 편 = readFileSync(new URL('../src/components/DecorEditor.jsx', import.meta.url), 'utf8')
const 칸3 = /useEffect\(\(\) => \{ try \{ 꾸미기열림\(\)/.test(편)
const 칸4 = /꾸몄나\) \{ try \{ 꾸미기저장\(\)/.test(편)
console.log(`  ${칸3 ? '✅' : '❌'} ③ 편집기가 뜰 때 「열었다」를 부른다`)
console.log(`  ${칸4 ? '✅' : '❌'} ④ 저장할 때 「붙였다」를 부른다 (⛔빈 채로 나가면 «안» 센다)`)
if (!칸3) 탈++
if (!칸4) 탈++

console.log(탈 === 0 ? '\n✅ 꾸미기 재기 — 네 칸 다 통과' : `\n❌ ${탈}칸이 어긋났다`)
process.exit(탈 === 0 ? 0 : 1)
