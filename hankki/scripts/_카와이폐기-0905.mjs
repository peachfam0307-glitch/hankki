// 🍜🗑 음식사진 카와이컷 431장 «폐기» — 파일 ＋ 비율표 ＋ 이름표를 «한 번에» 걷는다 (2026-09-05)
//
// 📮 창업자 = *"우리 레시피꾸미기에 들어가는 음식사진 카와이컷도 모두 폐기 삭제."* → *"음식사진카와이컷만이야. 레꾸에 들어가는"*
//    → 판 4장을 보고 *"비슷한 걸로 네가 골라서 스샷 보여줘"* (온보딩·프로필 7컷 대체는 창업자가 맡겼다)
// ⭐ 지울 목록 = `docs/stickers/카와이-전수판정-2026-08-31.json` 431장 — 창업자가 8/31 에 직접 골랐다. ⛔손으로 안 고른다.
//
// ⛔⛔ 순서가 중요하다 (docs/카와이-음식사진-폐기-실측-2026-09-05.md §3) — 하나만 하면 더 나빠진다
//    ① 파일 431장 삭제(git rm)   ② `Stickers.jsx` `PHOTO_RATIO` 에서 그 키 431개 제거   ③ `FoodIcon.jsx` `EXTRA_NAMES` 이름표 제거
//    ②를 안 하면 PHOTO_FAMILY 가 «없는 파일»을 가리킨다. ③은 이름표만이라 안 해도 안 깨지지만 죽은 줄이다.
//    ⛔ `store.jsx` 의 옛→새 대응표·`카와이_V96` 은 «안» 건드린다 — 이미 깔린 폰의 옛 아이콘을 새 컷에 태우는 이사표다.
//    ⛔ 온보딩 6·프로필 1 «살아 있는 자리»는 이 스크립트가 아니라 subst 로 따로 갈아끼운다(창업자 판정 자리라 눈에 보이게).
//
// 🔒 스스로 검증한다 — 「뺀 키 == 431」「남은 키 == 전과 같다」「카와이 키가 0」 아니면 아무것도 안 쓴다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const APP = resolve(new URL('..', import.meta.url).pathname)
const 목록 = JSON.parse(readFileSync(join(APP, 'docs/stickers/카와이-전수판정-2026-08-31.json'), 'utf8'))['카와이']
const K = new Set(목록)
if (K.size !== 431) { console.error('⛔ 목록이 431 이 아니다:', K.size); process.exit(1) }
const 실행 = process.argv.includes('--실행')

// ── 표에서 `key: value,` 조각을 걷어내는 함수 — 주석은 안 건드린다, 빈 줄이 되면 줄을 뺀다
function 표걷기(src, 시작표시, 이름) {
  const 줄 = src.split('\n')
  const s = 줄.findIndex((l) => l.startsWith(시작표시))
  if (s < 0) throw new Error(`${이름}: 시작 못 찾음`)
  let e = s + 1; while (e < 줄.length && !/^}/.test(줄[e])) e++
  const 키정규 = /(^|[\s,{])([A-Za-z0-9_]+)\s*:\s*/g
  const 세기 = (a, b) => { const c = new Set(); for (let i = a; i < b; i++) { const code = 줄[i].replace(/\/\/.*$/, ''); for (const m of code.matchAll(키정규)) c.add(m[2]) } return c }
  const 전 = 세기(s + 1, e)
  const 뺄 = [...전].filter((k) => K.has(k))
  const 새줄 = []
  for (let i = 0; i < 줄.length; i++) {
    if (i <= s || i >= e) { 새줄.push(줄[i]); continue }
    const l = 줄[i]
    const 주석자리 = l.indexOf('//')
    let code = 주석자리 >= 0 ? l.slice(0, 주석자리) : l
    const 주석 = 주석자리 >= 0 ? l.slice(주석자리) : ''
    // 조각 = `key: 값,` (값 = 숫자 또는 '문자열')  — 카와이 키면 조각째 지운다
    // ⚠️ 앞 조각을 지우면 다음 조각 앞의 공백도 같이 사라진다 — 그래서 «앞 글자»가 아니라 «낱말 경계»로 본다(첫 판이 207개를 흘렸다)
    code = code.replace(/(?<![A-Za-z0-9_])([A-Za-z0-9_]+)\s*:\s*(?:'[^']*'|[-\d.]+)\s*,?\s*/g, (m, k) => (K.has(k) ? '' : m))
    if (code.trim() === '' && 주석 === '') continue          // 통째로 비면 줄을 뺀다
    if (code.trim() === '' && 주석 && !l.trim().startsWith('//')) continue // 조각 뒤에 붙은 곁말만 남으면 그 줄도 뺀다
    새줄.push(code.replace(/\s+$/, '') + (주석 ? (code.trim() ? '  ' : '') + 주석 : ''))
  }
  const 새 = 새줄.join('\n')
  // 검증 — 새 표에서 다시 센다
  const 줄2 = 새.split('\n'); const s2 = 줄2.findIndex((l) => l.startsWith(시작표시)); let e2 = s2 + 1; while (!/^}/.test(줄2[e2])) e2++
  const 후 = new Set(); for (let i = s2 + 1; i < e2; i++) { const code = 줄2[i].replace(/\/\/.*$/, ''); for (const m of code.matchAll(키정규)) 후.add(m[2]) }
  const 남은카와이 = [...후].filter((k) => K.has(k))
  const 잃은비카와이 = [...전].filter((k) => !K.has(k) && !후.has(k))
  console.log(`\n📋 ${이름}: 키 ${전.size} → ${후.size} · 뺀 것 ${뺄.length} · 남은 카와이 ${남은카와이.length} · 잘못 잃은 것 ${잃은비카와이.length}`)
  if (남은카와이.length || 잃은비카와이.length) { console.error('⛔ 검증 실패', { 남은카와이: 남은카와이.slice(0, 5), 잃은비카와이: 잃은비카와이.slice(0, 5) }); process.exit(1) }
  return { 새, 뺄: 뺄.length }
}

const st = join(APP, 'src/components/Stickers.jsx'), fi = join(APP, 'src/components/FoodIcon.jsx')
const a = 표걷기(readFileSync(st, 'utf8'), 'const PHOTO_RATIO = {', 'Stickers.jsx PHOTO_RATIO')
const b = 표걷기(readFileSync(fi, 'utf8'), 'const EXTRA_NAMES = {', 'FoodIcon.jsx EXTRA_NAMES')
if (a.뺄 !== 431) { console.error('⛔ PHOTO_RATIO 에서 뺀 게 431 이 아니다:', a.뺄); process.exit(1) }

const 파일 = 목록.map((id) => join(APP, 'src/assets/stickers/photo', id + '.png'))
const 없는파일 = 파일.filter((p) => !existsSync(p))
console.log(`\n🗑 파일: ${파일.length}장 · 없는 것 ${없는파일.length}`)
if (없는파일.length) { console.error('⛔ 파일이 안 맞는다', 없는파일.slice(0, 3)); process.exit(1) }

if (!실행) { console.log('\n👀 «보여만» 줬다. 실제로 하려면 → node hankki/scripts/_카와이폐기-0905.mjs --실행'); process.exit(0) }
writeFileSync(st, a.새); writeFileSync(fi, b.새)
execFileSync('git', ['-C', APP, 'rm', '-q', '--', ...파일], { stdio: 'inherit', maxBuffer: 1 << 26 })
console.log('\n✅ 파일 431 git rm · PHOTO_RATIO 431 · EXTRA_NAMES', b.뺄, '걷었다. ⏳ 온보딩 6·프로필 1 은 subst 로 따로.')
