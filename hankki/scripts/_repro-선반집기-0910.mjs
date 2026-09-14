#!/usr/bin/env node
/**
 * 🧺 「나갔다 오면 다 만든 답을 버린다」 재현판 — 2026-09-10
 *
 * 📮 창업자 실물 녹화(07:33) = 0~3초 「AI가 다듬는 중」 → **20초에 다른 앱으로 나감**
 *    → **42초에 돌아오니 「AI 다듬기가 안 됐어요」**
 *
 * ⛔⛔ 뿌리 = 번호표가 tidy.js 의 const 로 «메모리에만» 있었다.
 *    폰이 앱을 얼리면 물어보는 루프가 죽고, 깨어나도 **물어볼 번호가 없어서**
 *    워커가 선반에 놓아둔 답을 통째로 버렸다.
 *    📌 실패까지 35초 = 「2분이 모자라서」가 «아니다». 시간을 늘리는 건 땜빵이다(절대원칙 34).
 *
 * ⭐ 이 판이 재는 것 = ⑴번호를 레시피에 «적나» ⑵깨어날 때 «다시 물어보나»
 *    ⑶받으면 얹고 번호를 버리나 ⑷1시간 지난 번호는 버리나 ⑸없을 때 나빠지지 않나
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 읽기 = (...p) => readFileSync(join(여기, '..', 'src', ...p), 'utf8')
const app = 읽기('App.jsx')
const tidy = 읽기('tidy.js')

let 틀림 = 0
const 잰다 = (ok, 이름) => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}`) }

console.log('\n🧺 선반 집기 — 재현판\n')

console.log('  ⑴ 번호를 «밖»에 적나 (메모리에만 두면 얼 때 잃는다)')
잰다(/export function 번호알림받기/.test(tidy), 'tidy 가 번호를 밖으로 알려준다')
잰다(/if \(_번호알림\) _번호알림\(r\.data\.job\)/.test(tidy), '⭐워커가 «맡았을 때» 알려준다(가짜 번호 아님)')
잰다(/번호알림받기\(\(번호\) => store\.updateRecipe\(rec\.id, \{ tidyJob: 번호, tidyJobAt: Date\.now\(\) \}\)\)/.test(app),
  '⭐App 이 그 번호를 «그 레시피»에 적는다')

console.log('\n  ⑵ 깨어나면 다시 물어보나')
잰다(/export async function 선반집기/.test(tidy), '선반을 집어오는 길이 있다')
잰다(/document\.addEventListener\('visibilitychange', 깨면\)/.test(app), '⭐앱이 깨어날 때 부른다')
잰다(/document\.removeEventListener\('visibilitychange', 깨면\)/.test(app), '떠날 때 치운다(귀 두 개가 안 생긴다)')

console.log('\n  ⑶ 받으면 얹고 번호를 버리나')
잰다(/만회값\(r, String\(r\.rawText \|\| ''\), 답\)/.test(app), '⭐얹는 규칙이 «한 곳»(retidy 의 만회값)이다')
잰다(/tidyFail: 0, tidying: 0, tidyJob: '' \}\)\s*\n\s*showToastRef/.test(app), '얹은 뒤 번호를 버린다')
잰다(/tidyFail: 0, tidying: 0, tidyJob: '' \}\)   \/\/ 🧺/.test(app), '평소 성공에서도 번호를 버린다')

console.log('\n  ⑷ ⏳ 만료 — 영영 물어보지 않는다')
잰다(/Date\.now\(\) - r\.tidyJobAt > 한시간/.test(app), '1시간 지난 번호는 버린다')
잰다(/const 한시간 = 60 \* 60 \* 1000/.test(app), '⭐그 값이 워커 선반(1시간)과 같다')

console.log('\n  ⑸ ⛔ 없을 때 나빠지지 않나')
잰다(/if \(답 === '아직'\) continue/.test(app), '워커가 일하는 중이면 «아무 말도 안 한다»')
잰다(/catch \{ return '아직' \}/.test(tidy), '⭐인터넷이 끊겨도 「없다」로 단정하지 않는다')
잰다(/if \(!resp\.ok\) return '아직'/.test(tidy), '한 번 실패해도 번호를 안 버린다')
잰다(/store\.updateRecipe\(rec\.id, \{ tidyFail: 1, tidying: 0 \}\)   \/\/ ⭐ 번호는 «안» 지운다/.test(app),
  '⭐실패로 떨어져도 번호는 남긴다 — 선반에 답이 놓일 수 있다')

console.log('\n  ⑹ 뉴런 0 — 집어오는 길이 AI 를 안 부른다')
잰다(/선반집기[\s\S]{0,600}method: 'GET'/.test(tidy), 'GET 으로만 물어본다(POST 로 새로 걸지 않는다)')

if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다 — 나갔다 오면 답을 또 버린다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 나갔다 와도 선반에서 집어온다.\n')
