// 🔓🔓 「운영자는 «무제한»이라고 말한다」 — 표시 자리 셋이 «한 잣대»를 본다 (2026-09-02) 〔smoke〕
//
// 📮 창업자 폰 실물 = 토스트 「무료 레시피열쇠 **0개** 남았어요」 ＋ 임시보관함 🔒**0**
//    그런데 같은 폰의 설정은 「운영자 · **∞**」. **같은 것을 두 곳이 다르게 말했다.**
// 📮 창업자 확정 = **ⓐ** (서버가 「무제한」을 실어 보내고 앱이 그걸 그린다)
//
// ⛔⛔ 뿌리는 «둘»이었다 — 하나만 고치면 반쪽이다
//   ⑴ 워커가 «막을 때»만 운영자를 안다(`!founder`). «알려줄 때»(`left`)엔 없어서
//      실제로 쓴 만큼 깎인 0 을 보낸다 → 한도는 안 걸리는데 숫자만 0.
//   ⑵ 앱에서도 `KeyBadge` 만 운영자를 알았다. 토스트(App.jsx)·임시보관함(InboxScreen)은 몰랐다.
//      **표시 자리 셋이 잣대 «둘»을 봤다.**
//
// ⭐ 그래서 이 판은 «양쪽»을 잰다 — 워커가 말하나(소스) ＋ 앱이 한 곳만 보나(소스) ＋ 잣대가 진짜 도나(실행).
//
// 실행: node scripts/_repro-운영자무제한-0902.mjs   (exit 0 = 통과)
// 🏷 이름표 = 반영됨
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

const 뿌리 = new URL('..', import.meta.url)
const 읽기 = (p) => readFileSync(new URL(p, 뿌리), 'utf8')

let 통과 = 0
let 실패 = 0
const 칸 = (이름, 조건, 실물) => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}`) } else { 실패++; console.log(`  ❌ ${이름}${실물 ? ` — ${실물}` : ''}`) }
}

console.log('① 워커 — 「무제한」을 «말하나»')
const w = 읽기('ocr-proxy/worker.js')
// ⭐ `left` 를 만드는 자리가 «셋»이다(조회·행동열쇠·OCR). 하나만 고치면 그 길로 들어온 사람은 옛 답을 본다.
const left칸수 = (w.match(/left: \{/g) || []).length
const 무제한칸수 = (w.match(/무제한: founder/g) || []).length
칸(`left 를 만드는 자리 ${left칸수} 곳에 «전부» 무제한이 있다`,
  left칸수 > 0 && 무제한칸수 === left칸수, `left ${left칸수}곳 · 무제한 ${무제한칸수}곳`)
// ⛔ 심장 — 「막을 때」와 「알려줄 때」가 «같은» founder 를 본다
칸('막는 자리는 그대로 founder 를 본다(우회는 안 건드렸다)',
  /!founder && ipC >=/.test(w) && /!founder && welcomeLeft <= 0/.test(w))
// ⛔ 차감·한도를 건드리지 않았나 — 이건 «보여 주는 값»에만 붙는 고침이다
칸('전역 상한은 운영자도 존중한다(그대로)',
  /monC >= LIMITS\.MONTHLY_GLOBAL/.test(w) && /dayC >= LIMITS\.DAILY_GLOBAL/.test(w))

console.log('② 앱 — 표시 자리 셋이 «한 곳»만 보나')
const ocr = 읽기('src/ocr.js')
칸('getOcrLeft 가 무제한을 내준다', /무제한: !!v\.무제한 \|\| tidyFounder\(\)/.test(ocr))
칸('서버 답이 «아직 없을 때»도 무제한을 내준다(첫 화면)', /무제한: tidyFounder\(\)/.test(ocr))

// ⭐⭐ 심장 = **표시 자리가 저마다 운영자를 판정하지 않는다.**
//    ⛔ 각자 `tidyFounder()` 를 부르기 시작하면 오늘 사고가 그대로 되돌아온다.
// ⛔⛔ **잣대는 「무제한이라는 «글자»가 파일에 있나」가 아니다** — 규칙 12 로 걸렸다:
//    임시보관함의 «숫자 그리는 줄»을 되돌렸는데도 aria-label 에 남은 글자 때문에 **17/17 초록불**이었다.
//    📌 오늘 네 번째다. 소스를 잴 땐 «지키려는 그 자리»를 콕 집어야 한다(규칙 18 ⓘ).
// ✅ 그래서 **「화면에 그리는 «숫자» 자체가 무제한으로 갈리나」**를 본다.
for (const [이름, 길, 숫자잣대] of [
  ['설정·가져오기 알약', 'src/components/KeyBadge.jsx', /운영자 \? '∞' : left\.total/],
  ['임시보관함 뱃지', 'src/screens/InboxScreen.jsx', /ocrLeft\.무제한 \? '∞' : ocrLeft\.total/],
]) {
  const s = 읽기(길)
  칸(`${이름} 의 «숫자»가 무제한이면 ∞ 로 갈린다`, 숫자잣대.test(s), '(숫자를 그리는 줄이 무제한을 안 본다)')
  // ⛔⛔ 「`tidyFounder(` 가 글자로 있나」로 재면 **주석에 적어둔 경위까지 걸린다**(실제로 걸렸다).
  //    📌 오늘만 세 번째다 — 소스 «글자»를 재면 거짓 빨간불이 난다(규칙 18 ⓘ).
  //    ✅ 지키려는 것은 「이 파일이 운영자를 «스스로» 판정하나」 = **불러왔나(import)** 로 본다.
  칸(`${이름} 가 «따로» 운영자를 판정하지 않는다`,
    !/^\s*import[^\n]*tidyFounder[^\n]*from/m.test(s),
    '(tidyFounder 를 직접 import 하면 잣대가 또 갈린다)')
}
const app = 읽기('src/App.jsx')
칸('사진 읽기 토스트가 운영자에겐 숫자를 안 붙인다', /left\.unknown \|\| left\.무제한/.test(app))

console.log('③ 잣대가 «진짜로» 도나 — getOcrLeft 를 불러서')
// ⛔ 소스만 보면 「부르기만 하고 안 도는」 것을 못 잡는다(오늘 ⑥-c 가 그 병이었다).
//    그래서 브라우저 없이 localStorage 를 흉내 내 실제로 부른다.
const 저장소 = new Map()
globalThis.localStorage = {
  getItem: (k) => (저장소.has(k) ? 저장소.get(k) : null),
  setItem: (k, v) => 저장소.set(k, String(v)),
  removeItem: (k) => 저장소.delete(k),
}
globalThis.window = globalThis.window || { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }
// ⭐ **앱이 진짜 쓰는 `src/ocr.js` 를 그대로 부른다**(절대원칙 30 — 흉내 낸 함수를 두지 않는다).
//   ⛔ Node 로 곧장 import 하면 죽는다 — 앱은 `./ocrCorrect` 처럼 «확장자 없이» 적고 그건 Vite 가 푼다.
//      그래서 빌드할 때 쓰는 그 도구(esbuild)로 한 번 묶어서 부른다.
const { execFileSync } = await import('node:child_process')
const { fileURLToPath } = await import('node:url')
// ⛔ `URL.pathname` 은 한글을 퍼센트 인코딩한다(%EB%AC%B4…) → Node 가 그 파일을 못 찾는다.
//    그래서 ⑴이름을 ASCII 로 두고 ⑵경로는 `fileURLToPath` 로 푼다.
const 길 = (p) => fileURLToPath(new URL(p, import.meta.url))
const 묶은것 = 길('../node_modules/.cache-ocr-founder.mjs')
execFileSync(길('../node_modules/.bin/esbuild'), [
  길('../src/ocr.js'),
  '--bundle', '--format=esm', '--log-level=error',
  '--loader:.png=text', '--loader:.webp=text', '--loader:.svg=text',
  `--outfile=${묶은것}`,
])
const { getOcrLeft } = await import(묶은것)

저장소.set('hankki:ocrLeft', JSON.stringify({ welcome: 0, month: 0 }))
칸('보통 유저 = 0 이면 무제한이 아니다', getOcrLeft().무제한 === false, JSON.stringify(getOcrLeft().무제한))
칸('  그때 숫자는 0 그대로', getOcrLeft().total === 0, String(getOcrLeft().total))

// ⓐ 서버가 말해 주는 길 — 창업자 확정
저장소.set('hankki:ocrLeft', JSON.stringify({ welcome: 0, month: 0, 무제한: true }))
칸('서버가 «무제한»이라 하면 무제한이다 (창업자 확정 ⓐ)', getOcrLeft().무제한 === true)
칸('  그래도 숫자는 «지우지 않는다» — 창업자가 유저 눈을 재려면 필요하다',
  getOcrLeft().total === 0, String(getOcrLeft().total))

// ⭐ 받침 — 워커는 창업자가 손으로 복붙해야 돈다. 그 전까지 폰 표식이 받쳐 준다.
저장소.set('hankki:ocrLeft', JSON.stringify({ welcome: 0, month: 0 }))
저장소.set('hankki:founder', '1')
칸('워커가 아직 낡아도 폰의 운영자 표식이 받쳐 준다', getOcrLeft().무제한 === true)

저장소.delete('hankki:ocrLeft')
칸('서버 답을 «한 번도» 못 받았어도 운영자는 무제한', getOcrLeft().무제한 === true)
저장소.delete('hankki:founder')
칸('  운영자가 아니면 첫 화면에서도 무제한이 아니다', getOcrLeft().무제한 === false)

console.log(`\n${통과}/${통과 + 실패} 통과`)
assert.equal(실패, 0, `${실패}칸 실패`)
