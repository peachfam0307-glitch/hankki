// 🔑🎃 할로윈 접시 열쇠 재현판 (2026-09-20)
//   ⛔ 이게 깨지면 «유저에게 할로윈이 미리 보인다» — 10/16 에 열기로 한 것이 새어 나간다.
//   ⭐ 브라우저를 안 띄운다 — DecorEditor 의 열쇠 판정과 «같은 식»을 여기서 그대로 돌린다.
//      (브라우저 판 `_probe-할로윈열쇠-0920.mjs` 는 느리고 포트를 타서 두 번 헛돌았다)
//   ⛔ 그래서 이 판은 「식이 맞나」를 잰다. 「서랍에 진짜 뜨나」는 창업자가 폰에서 본다.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
let 통과 = 0; const 실패 = []
const 잰다 = (참, 이름, 본것) => { if (참) { 통과++; console.log('  ✅', 이름) } else { 실패.push(이름); console.log('  ⛔', 이름, 본것 !== undefined ? `— ${본것}` : '') } }

console.log('\n🔑🎃 할로윈 접시 열쇠\n')

// ① 묶음이 등록됐고 열쇠가 붙어 있나
const st = readFileSync(join(뿌리, 'src/components/Stickers.jsx'), 'utf8')
const 줄 = st.split('\n').find((l) => l.includes("key: 'deco_dish_halloween'")) || ''
잰다(!!줄, '① 「할로윈 접시」 묶음이 Stickers.jsx 에 있다')
잰다(/key열쇠:\s*'할로윈'/.test(줄), '② 그 묶음에 key열쇠: 할로윈 이 붙어 있다')
const 컷 = (줄.match(/'pf_hw\d+'/g) || []).map((s) => s.replace(/'/g, ''))
잰다(컷.length === 6, `③ 컷이 여섯이다`, `지금 ${컷.length}개`)
잰다(!컷.includes('pf_hw02') && !컷.includes('pf_hw06'), '④ 가로로 긴 둘(02·06)은 «안» 들어 있다 — 창업자 「가로로 긴건 빼자」')

// ⑤ 비율 표에 여섯이 다 있나 — 없으면 화면에서 찌그러진다
const 비율 = Object.fromEntries([...st.matchAll(/(pf_hw\d+):\s*([\d.]+)/g)].map((m) => [m[1], Number(m[2])]))
잰다(컷.every((k) => 비율[k] > 0), '⑤ 여섯 다 비율 표에 있다', JSON.stringify(비율))
잰다(Math.max(...컷.map((k) => 비율[k])) <= 1.46, '⑥ 제일 긴 것이 1.46 이하다 (가을 접시 1.24~1.34 에서 크게 안 벗어난다)')

// ⑦⑧⑨⑩ 열쇠 «식»을 그대로 돌린다 — DecorEditor 의 열쇠켬() 과 같은 모양
const de = readFileSync(join(뿌리, 'src/components/DecorEditor.jsx'), 'utf8')
잰다(/열쇠켬\(x\)/.test(de) && /isReleased\(x\.from\)\s*&&\s*열쇠켬\(x\)/.test(de), '⑦ 서랍 거르는 줄에 열쇠켬 이 끼어 있다')

const 가짜저장 = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) } }
function 열쇠켬(이름, 주소검색, 저장) {
  if (!이름) return true
  try {
    const v = new URLSearchParams(주소검색).get(이름)
    if (v === '1') 저장.setItem('hankki:열쇠:' + 이름, '1')
    if (v === '0') 저장.removeItem('hankki:열쇠:' + 이름)
    return 저장.getItem('hankki:열쇠:' + 이름) === '1'
  } catch { return false }
}
const s = 가짜저장()
잰다(열쇠켬('할로윈', '', s) === false, '⑧ 그냥 열면 «안 보인다» — 유저가 보는 그림')
잰다(열쇠켬('할로윈', '?할로윈=1', s) === true, '⑨ ?할로윈=1 을 한 번 열면 보인다')
잰다(열쇠켬('할로윈', '', s) === true, '⑩ 그 뒤엔 주소 없이 열어도 «계속» 보인다 (그 폰에 남는다)')
잰다(열쇠켬('할로윈', '?할로윈=0', s) === false, '⑪ ?할로윈=0 으로 다시 끌 수 있다')
const 막힌저장 = { getItem: () => { throw new Error('막힘') }, setItem: () => { throw new Error('막힘') }, removeItem: () => {} }
잰다(열쇠켬('할로윈', '?할로윈=1', 막힌저장) === false, '⑫ 저장소를 못 읽는 폰에선 «안 보인다» — 못 읽는다고 새어 나가면 안 된다')
잰다(열쇠켬(undefined, '', 가짜저장()) === true, '⑬ 열쇠가 «없는» 묶음은 그대로 보인다 (다른 서랍이 안 다친다)')

console.log('')
if (실패.length) { console.log(`⛔ ${실패.length}개 틀렸다 —`, 실패.join(' · ')); process.exit(1) }
console.log(`✅ 할로윈 접시 열쇠 — ${통과}칸 다 제자리 (유저에겐 안 보이고, 창업자만 열 수 있다)`)
