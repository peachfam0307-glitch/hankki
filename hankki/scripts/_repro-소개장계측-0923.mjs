// 📖 소개(온보딩) 장 계측이 «구멍 없이» 붙어 있나 (2026-09-23)
//
// 📮 창업자 = "온보딩 계측 심어줘"
// ⛔⛔ 제일 무서운 것 = **장을 늘렸는데 계측을 안 늘리는 것.** 그러면 새 장이 «조용히» 안 세어지고,
//    깔때기는 멀쩡해 보인다(숫자가 0 이 아니라 «아예 없다»). 그래서 이 재현판이 둘을 대조한다.
import { readFileSync } from 'node:fs'
import { 소개장수 } from '../src/stats.js'

let 통과 = 0, 실패 = 0
const 잰다 = (ok, 이름, 값 = '') => { ok ? 통과++ : 실패++; console.log(`${ok ? '✅' : '❌'} ${이름}${값 ? ` — ${값}` : ''}`) }

const 온 = readFileSync(new URL('../src/components/Onboarding.jsx', import.meta.url), 'utf8')
const m = 온.match(/const SLIDES = \[([^\]]+)\]/)
const 장수 = m ? m[1].split(',').filter((s) => s.trim()).length : -1

잰다(장수 > 0, '①-1 Onboarding.jsx 에서 SLIDES 를 읽었다', `장 ${장수}개`)
잰다(장수 === 소개장수, '①-2 소개 장수와 계측 이름 수가 «같다» (장을 늘리면 stats.js 의 소개장수도 늘린다)', `SLIDES ${장수} · 소개장수 ${소개장수}`)

// ② 이름이 정말 onboard_step_1..N 으로 나가나 — 관문을 가로채서 본 이름을 모은다
const 본이름 = []
const st = readFileSync(new URL('../src/stats.js', import.meta.url), 'utf8')
잰다(/onboard_step_\$\{k \+ 1\}/.test(st), '②-1 이름 꼴이 onboard_step_<번호> 다')
잰다(!/onboard_step_0/.test(st), '②-2 0번 장이 없다 — 창업자가 읽는 숫자(1부터)와 같다')

const { 소개장도달 } = await import('../src/stats.js')
잰다(typeof 소개장도달 === 'function', '②-3 소개장도달 을 밖에서 부를 수 있다')
let 터짐 = null
try { 소개장도달(1); 소개장도달(소개장수); 소개장도달(0); 소개장도달(999) } catch (e) { 터짐 = e.message }
잰다(!터짐, '②-4 범위 밖 번호(0·999)를 넣어도 «안 터진다»', 터짐 || '')

// ③ 부르는 쪽 — 「처음 도달한 장만」 보내는 막음이 있나
잰다(/밟은장/.test(온) && /has\(i\)/.test(온), '③-1 뒤로 갔다 와도 두 번 안 센다 (밟은장 Set)')
잰다(/소개장도달\(i \+ 1\)/.test(온), '③-2 1부터 센다 (i + 1)')
잰다(/try \{ 소개장도달/.test(온), '③-3 계측이 죽어도 소개는 뜬다 (try/catch)')
// ⛔ Stage 가 아니라 컴포넌트에 걸렸나 — Stage 에 걸면 장마다 열 번 나간다(2026-09-21 사고)
const 쓴자리 = 온.indexOf('소개장도달(i + 1)')
const 스테이지 = 온.indexOf('function Stage')
잰다(쓴자리 > 0 && (스테이지 < 0 || 쓴자리 > 온.indexOf('export default function Onboarding')), '③-4 Stage 가 아니라 Onboarding 안에 걸렸다 (2026-09-21 사고 되풀이 금지)')

console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패} 통과`)
process.exit(실패 ? 1 : 0)
