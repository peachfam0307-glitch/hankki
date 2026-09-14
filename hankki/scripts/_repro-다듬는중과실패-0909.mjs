#!/usr/bin/env node
/**
 * 🔵 「도는 중인데 «안 됐어요»라고 한다」 재현판 — 2026-09-09
 *
 * 📮 창업자(실물 캡처 8:34) = 임시보관함 줄에 「· AI 다듬기가 안 됐어요 · 아래 단추로 한 번 더」
 *    그런데 그때 AI 는 «아직 도는 중»이었다. 1분 뒤 순서가 채워졌다(＝성공).
 * 📮 창업자 = "1분넘었지.. 변화없음. ai가 읽었는지 안읽었는지 얘기도 없어"
 *
 * ⛔ 뿌리 = App.jsx 가 시작할 때 남기는 tidyFail 1 («다음에 만회한다»는 약속)을
 *    InboxScreen 이 «실패»로 읽었다. 한 값에 두 뜻을 담아서 난 일이다.
 *
 * ⭐ 이 판이 재는 것 = 「도는 중(tidying)」과 「실패(tidyFail)」가 갈려 있는가,
 *    그리고 도는 표시가 «굳지» 않는가(성공·실패·끊김·터짐·앱재시작 다섯 갈래).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 읽기 = (...p) => readFileSync(join(여기, '..', 'src', ...p), 'utf8')
const app = 읽기('App.jsx')
const inbox = 읽기('screens', 'InboxScreen.jsx')

let 틀림 = 0
const 잰다 = (ok, 이름) => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}`) }

console.log('\n🔵 도는 중 vs 실패 — 재현판\n')

console.log('  ⑴ 두 뜻을 갈랐나')
잰다(/tidyFail: 1, tidying: 1/.test(app), '시작할 때 «도는 중»을 따로 남긴다')
잰다(/if \(r\?\.tidying\) return 'AI가 다듬는 중이에요/.test(inbox), '⭐임시보관함이 «도는 중»을 먼저 본다')
잰다(inbox.indexOf('r?.tidying') < inbox.indexOf("tidyFail === 1 || r?.tidyFail === 2"),
  '⭐그 판정이 「안 됐어요」보다 «위»에 있다(아래면 영영 안 읽힌다)')

console.log('\n  ⑵ 표시가 굳지 않나 — 다섯 갈래 모두에서 꺼진다')
잰다(/tidyFail: 0, tidying: 0/.test(app), '성공하면 끈다')
잰다(/tidyFail: 1, tidying: 0/.test(app), '못 했으면 끈다')
잰다(/if \(cancelled\) \{ store\.updateRecipe\(rec\.id, \{ tidying: 0 \}\); return \}/.test(app), '중간에 끊겨도 끈다')
잰다(/\}\)\.catch\(\(\) => \{[\s\S]{0,200}tidying: 0/.test(app), '터져도 끈다')
잰다(/if \(r\?\.tidying\) store\.updateRecipe\(r\.id, \{ tidying: 0 \}\)/.test(app), '⭐앱을 껐다 켜면 묵은 표시를 턴다')

console.log('\n  ⑶ ⛔ tidyFail 은 살아 있다 — 「다음에 열면 만회한다」는 약속이다')
잰다(/tidyFail === 1/.test(읽기('screens', 'RecipeDetailScreen.jsx')), '상세 화면의 만회 길이 그대로다')

console.log('\n  ⑷ 두 판이 안 겹친다')
잰다(/disabled=\{!!다듬는중 \|\| !!r\.tidying\}/.test(inbox), '저절로 도는 동안엔 단추를 못 누른다')
잰다(/다듬는중 === r\.id \|\| r\.tidying \? '다듬는 중…'/.test(inbox), '단추도 «다듬는 중…»이라고 말한다')

if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다 — 도는 중을 「안 됐다」고 말한다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 도는 중엔 「다듬는 중」, 끝나야 「됐다/안 됐다」.\n')
