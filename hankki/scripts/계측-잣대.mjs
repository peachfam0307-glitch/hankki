// 🧪🧪 «이 캡처로 이 비율을 말해도 되나» — 계측 잣대 (2026-09-16)
//
// 📮 창업자 = *"이거 날짜가 중요해. 우리가 계속 수정을 했었고, 그 수정을 완료한 날 이후를 봐야하고
//    내가 테스트한 것도 섞여있나도 봐야해"*
//
// ⛔⛔ 사고 = 2026-09-16 「가져오기 43 넣어서 7 저장 (16%)」 — 셋이 겹쳐 있었다:
//    ① 이벤트마다 심은 날이 달랐다(화면 9/07 · recipe_saved 9/10 · cook_started 9/14)
//    ② 9/13 22:13 ~ 9/15 18:56 이 자르기 안내가 안 뜨던 «버그 기간»이었다
//    ⑤ 나는 둘 다 안 보고 나눴다
//
// 무엇을 하나 = --부터 --까지 --이벤트 를 받아
//    · 심은 날 = `git log -S"행동보내기('이름')"` / `보내기('이름')` 호출 줄로 «스스로» 센다 (주석은 안 센다)
//    · 오염 구간 = docs/계측-오염장부.md 를 읽어 그 이벤트가 걸린 흐름의 [깨진, 고친+17분] 을 뺀다
//    · 그래서 「공정한 공통 구간」을 찍는다. 그 밖의 값으로는 비율을 말하지 않는다.
// ⛔ 기간이 없으면 죽는다 — 기간 모르는 캡처는 09-15 쿠팡 캡처처럼 «며칠치인지» 모른다.
// ⛔ stats.js 에 없는 이벤트를 주면 죽는다 — 내가 이름을 틀리게 친 것이다.
// ⛔ git 이 못 세면 「모름」으로 찍고 죽는다 — 0 이나 오늘로 찍지 않는다.
//
// 쓰는 법:  node scripts/계측-잣대.mjs --부터 2026-09-10 --까지 2026-09-16 --이벤트 recipe_saved,import_photo
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const 앱뿌리 = new URL('../', import.meta.url)
const git뿌리 = new URL('../../', import.meta.url).pathname
const sh = (c) => execSync(c, { cwd: git뿌리, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
const 죽는다 = (why) => { console.error(`\n⛔ 계측 잣대 — ${why}\n   쓰는 법: node scripts/계측-잣대.mjs --부터 YYYY-MM-DD --까지 YYYY-MM-DD --이벤트 a,b,c\n`); process.exit(1) }

// ── 인자
const a = process.argv.slice(2)
const 값 = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null }
const 부터 = 값('--부터'), 까지 = 값('--까지'), 이벤트들 = (값('--이벤트') || '').split(',').map((s) => s.trim()).filter(Boolean)
const 날짜꼴 = /^\d{4}-\d{2}-\d{2}$/
if (!부터 || !까지 || !날짜꼴.test(부터) || !날짜꼴.test(까지)) 죽는다('--부터 --까지 가 없거나 YYYY-MM-DD 가 아니다. 기간 모르는 캡처로는 아무것도 못 나눈다')
if (이벤트들.length === 0) 죽는다('--이벤트 가 없다')
const 시작ms = Date.parse(`${부터}T00:00:00+09:00`), 끝ms = Date.parse(`${까지}T23:59:59+09:00`)
if (!(시작ms <= 끝ms)) 죽는다('--부터 가 --까지 보다 뒤다')

// ── 이벤트가 «어디서» 나가나 — 네 갈래. 갈래마다 심은 날을 세는 «무늬»와 «파일»이 다르다.
//    ① stats.js 에 글자 그대로   행동보내기('recipe_saved')
//    ② stats.js 에 «묶음»으로    행동보내기(`import_${갈래}`) → import_photo · import_share …  (묶음이 심긴 날이 하한)
//    ③ public/get.html 징검다리   갈래이름('bridge') / ('bridge_go')  → bridge · bridge_ios …
//    ④ 화면 이름                 App.jsx 의 화면봄(위 ? 위.name : tab) — 화면 전부가 «한 날»에 배선됐다
const stats = readFileSync(new URL('src/stats.js', 앱뿌리), 'utf8')
const 코드줄 = stats.split('\n').filter((l) => !/^\s*\/\//.test(l))
const 글자그대로 = (이름) => 코드줄.find((l) => new RegExp(`(행동보내기|보내기)\\('${이름}'\\)`).test(l))
const 묶음 = [
  [/^import_(share|gallery|photo|write)$/, '`import_${갈래}`'],
  [/^cook_long_/, '`cook_long_${자리}`'],
  [/^buy_/, '`buy_${자리}`'],
  [/^(signup|login)_/, "`${새계정 ? 'signup' : 'login'}_${이름}`"],
  [/^decor_have_/, "'decor_have_1'"],
  [/^return_/, "'return_d1'"],
]
const 화면들 = ['home', 'import', 'detail', 'myrecipes', 'shop', 'decor', 'cook', 'editor', 'log', 'profile', 'brag', 'inbox', 'search', 'diary', 'favorites', 'settings']
const 갈래 = (이름) => {
  const 직접 = 글자그대로(이름)
  if (직접) return { 무늬: 직접.trim(), 파일: 'hankki/src/stats.js', 꼴: '' }
  const m = 묶음.find(([re]) => re.test(이름))
  if (m) { const 줄 = 코드줄.find((l) => l.includes(m[1])); if (줄) return { 무늬: 줄.trim(), 파일: 'hankki/src/stats.js', 꼴: ' (묶음이 심긴 날 — 이 갈래는 그 뒤일 수 있다)' } }
  if (/^bridge/.test(이름)) return { 무늬: 이름, 파일: 'hankki/public/get.html', 꼴: ' (징검다리 get.html)' }
  if (화면들.includes(이름)) return { 무늬: '화면봄(', 파일: 'hankki/src/App.jsx', 꼴: ' (화면 배선 — 모든 화면이 같은 날)' }
  return null
}
for (const e of 이벤트들) if (!갈래(e)) 죽는다(`「${e}」 를 보내는 줄을 stats.js·get.html·화면 목록 어디서도 못 찾았다 — 이름을 틀리게 쳤나?`)

// ── 심은 날 = 그 무늬가 «처음 생긴» 커밋 (git log -S · 가장 오래된 것)
const KST = (h) => sh(`TZ=Asia/Seoul git show -s --date=format-local:'%Y-%m-%d %H:%M' --format=%cd ${h}`)
const 심은날 = (이름) => {
  const g = 갈래(이름)
  let 목록
  try { 목록 = sh(`git log --format=%H -S${JSON.stringify(g.무늬)} -- ${g.파일}`).split('\n').filter(Boolean) } catch { return null }
  if (목록.length === 0) return null
  // 가장 오래된 것이 «처음 심은» 커밋. -S 는 «개수가 바뀐» 커밋을 다 잡으므로 둘 이상이면 이름을 건드린 커밋이 여럿이다(뺐다 심었거나 갈래가 늘었거나).
  return { 날: KST(목록[목록.length - 1]), 끊긴적: 목록.length > 1, 꼴: g.꼴 }
}

// ── 오염 장부
const 장부 = readFileSync(new URL('docs/계측-오염장부.md', 앱뿌리), 'utf8').split('\n')
// 절 하나만 — 다음 「## 」 제목에서 멈춘다 (안 멈추면 아래 표까지 삼킨다 · 첫 판에서 실제로 삼켰다)
const 표 = (제목) => {
  const i = 장부.findIndex((l) => l.startsWith(제목))
  if (i < 0) 죽는다(`장부에 「${제목}」 절이 없다`)
  const 절 = []
  for (const l of 장부.slice(i + 1)) { if (/^## /.test(l)) break; if (/^\|/.test(l)) 절.push(l) }
  return 절.slice(2).map((l) => l.split('|').slice(1, -1).map((s) => s.trim()))
}
const 흐름이벤트 = Object.fromEntries(표('## 흐름 ↔ 이벤트').map(([흐, ev]) => [흐, ev.split(',').map((s) => s.trim())]))
const 배포지연ms = 17 * 60 * 1000
const 오염 = 표('## 장부').map(([흐, 깨, 고, 커, 무]) => ({ 흐름: 흐, 깨: 깨 === '모름' ? -Infinity : Date.parse(깨.replace(' ', 'T') + ':00+09:00'), 고: 고 === '모름' ? Infinity : Date.parse(고.replace(' ', 'T') + ':00+09:00') + 배포지연ms, 커밋: 커, 무엇: 무 }))
const 이벤트의흐름 = (e) => Object.entries(흐름이벤트).filter(([, evs]) => evs.includes(e)).map(([흐]) => 흐)

// ── 계산
const f = (ms) => ms === -Infinity ? '(모름)' : ms === Infinity ? '(아직)' : new Date(ms).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)
let 공통시작 = 시작ms, 막힘 = []
console.log(`\n🧪 계측 잣대 — ${부터} ~ ${까지} (KST)\n`)
for (const e of 이벤트들) {
  const 심 = 심은날(e)
  if (!심) { console.log(`   ${e.padEnd(18)} 심은 날 «모름» — git 이 못 셌다`); 막힘.push(e); continue }
  const 심ms = Date.parse(심.날.replace(' ', 'T') + ':00+09:00')
  if (심ms > 공통시작) 공통시작 = 심ms
  const 걸린오염 = 오염.filter((o) => 이벤트의흐름(e).includes(o.흐름) && o.고 > 시작ms && o.깨 < 끝ms)
  for (const o of 걸린오염) if (o.고 > 공통시작) 공통시작 = o.고
  console.log(`   ${e.padEnd(18)} 심은 날 ${심.날}${심.꼴}${심.끊긴적 ? ' ⚠️뺐다 다시 심은 적 있음' : ''}`)
  for (const o of 걸린오염) console.log(`   ${''.padEnd(18)} ⛔ 오염 ${f(o.깨)} ~ ${f(o.고)}  ${o.흐름} · ${o.무엇}`)
}
if (막힘.length) { console.error(`\n⛔ 심은 날을 못 센 이벤트가 있다(${막힘.join(', ')}) — 얕은 clone 이면 git fetch --unshallow`); process.exit(1) }

console.log(`\n   ⇒ 공정한 공통 구간 = ${f(공통시작)} ~ ${까지} 23:59`)
if (공통시작 > 끝ms) { console.log(`   ⛔⛔ 공통 구간이 «없다». 이 캡처로는 이 이벤트들의 비율을 말할 수 없다.\n`); process.exit(2) }
if (공통시작 > 시작ms) console.log(`   ⛔ 캡처 시작(${부터})보다 늦다 — 캡처를 ${f(공통시작).slice(0, 10)} 부터로 다시 받거나, 그 전 값은 «오염됐다»고 말한다.\n`)
else console.log(`   ✅ 캡처 전체가 공정하다.\n`)
process.exit(0)
