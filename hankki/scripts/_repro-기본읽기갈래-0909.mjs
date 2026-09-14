// 🧪 「고름」과 「없음」이 실제로 갈리나 — 줄이 다섯 곳 이어져 있어야 한다
import fs from 'node:fs'
const R = (p) => fs.readFileSync(p, 'utf8')
const imp = R('src/screens/ImportScreen.jsx')
const edi = R('src/screens/EditorScreen.jsx')
const ocr = R('src/ocr.js')
const wor = R('ocr-proxy/worker.js')
let 나쁨 = 0
const 본다 = (이름, 참) => { console.log((참 ? '  ✅ ' : '  ⛔ ') + 이름); if (!참) 나쁨++ }

console.log('🔗 줄이 이어졌나 — 화면 → 편집 → ocr → 워커')
본다('① 열쇠 0 단추가 「없음」을 실는다', /사진고르기\(true, '없음'\)/.test(imp))
본다('② 「그냥 읽기」 단추가 「고름」을 실는다', /사진고르기\(true, '고름'\)/.test(imp))
본다('③ 편집 화면으로 noVisionWhy 가 넘어간다', /noVisionWhy: noVisionWhyRef\.current/.test(imp))
본다('④ 편집 화면이 그걸 받는다', /prefill\?\.noVisionWhy/.test(edi))
본다('⑤ 편집 화면이 ocrImage 에 실어 보낸다', /noVisionWhy: ocrNoVisionWhy\.current/.test(edi))
본다('⑥ ocr 이 「없음」을 갈라 알린다', /noVisionWhy === '없음' \? '없음' : '고름'/.test(ocr))
본다('⑦ 워커가 「없음」을 받는다', /'막힘', '고름', '실패', '없음'/.test(wor))
본다('⑧ 워커가 「없음」을 세어 보여준다', /없음: 기본없음/.test(wor))

console.log('\n🚫 옛 셈법이 남아 있나')
본다('⑨ noVision 을 통째로 「고름」으로 세는 줄이 없다', !/noVision \? '고름'/.test(ocr))

console.log('\n⚠️ 안 건드린 것 (열쇠는 여전히 안 깎인다)')
본다('⑩ noVision 이면 Vision 을 안 부른다', /if \(typeof image === 'string' && !opts\.noVision\)/.test(ocr))

process.exit(나쁨 ? 1 : 0)
