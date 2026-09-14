#!/usr/bin/env node
/**
 * 📒 「성공해도 띠가 안 뜬다 · 계속 남게 해줘」 재현판 — 2026-09-10
 *
 * 📮 창업자 = "갈색띠가 안떠 성공해도" ＋ "계속남게할순없어?" ＋ "나만보이게해줘"
 *
 * ⛔ 왜 안 보였나 = 띠는 최대 4.8초(App 의 toastMs)다. 게다가 성공이 «나가 있는 동안» 나면
 *    떴다 사라져 **볼 수가 없다.** 오늘 아침 창업자가 겪은 게 그것이다.
 *
 * ⭐ 이 판이 재는 것 = ⑴모든 길이 기록에 걸리나 ⑵창업자 폰에만 쌓이고 보이나
 *    ⑶개인정보(레시피 글자)가 안 새나 ⑷다섯 줄만 남나
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 읽기 = (...p) => readFileSync(join(여기, '..', 'src', ...p), 'utf8')
const tidy = 읽기('tidy.js')
const prof = 읽기('screens', 'ProfileScreen.jsx')
const app = 읽기('App.jsx')
const 말 = 읽기('안내말.js')

let 틀림 = 0
const 잰다 = (ok, 이름) => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}`) }

console.log('\n📒 AI 다듬기 기록 — 재현판\n')

console.log('  ⑴ ⭐모든 길이 기록에 걸리나 (한 겹 감싸기)')
잰다(/export async function tidyRecipe[\s\S]{0,300}await 다듬기속\(text, 사진\)/.test(tidy),
  '⭐tidyRecipe 가 «감싸는 겹»이다 — 어느 길로 끝나든 지나간다')
잰다(/기록하기\(\{ \.\.\.\(_마지막 \|\| \{\}\), ms:/.test(tidy), '끝나면 무조건 기록한다')
잰다(/async function 다듬기속/.test(tidy), '속살은 그대로 둔다(열 군데를 손대지 않았다)')

console.log('\n  ⑵ ⛔창업자 폰에만')
잰다(/if \(!tidyFounder\(\)\) return\s/.test(tidy), '⭐창업자가 아니면 «쌓지도» 않는다')
잰다(/\{tidyFounder\(\) && 다듬기기록\(\)\.length > 0 &&/.test(prof), '설정 칸도 창업자에게만 보인다')
잰다(/나만 보여요/.test(prof), '화면에 「나만 보여요」라고 적혀 있다')

console.log('\n  ⑶ ⛔개인정보가 안 샌다')
잰다(!/rawText|title|ingredients|steps/.test(tidy.slice(tidy.indexOf('function 기록하기'), tidy.indexOf('export function 다듬기기록'))),
  '⭐기록에 레시피 «글자»를 한 자도 안 담는다')
잰다(/때: Date\.now\(\), ok:[^\n]*why:[^\n]*model:[^\n]*ms:/.test(tidy), '담는 건 때·성패·까닭·모델·걸린시간뿐이다')

console.log('\n  ⑷ 다섯 줄만 · 안 터진다')
잰다(/const 기록수 = 5/.test(tidy) && /\.slice\(0, 기록수\)/.test(tidy), '다섯 줄만 남는다(서랍을 안 먹는다)')
잰다(/catch \{ \/\* 기록이 말썽이어도 다듬기는 계속 \*\/ \}/.test(tidy), '⭐기록이 터져도 다듬기는 계속된다')
잰다(/catch \{ return \[\] \}/.test(tidy), '읽다 터져도 빈 목록을 준다')

console.log('\n  ⑸ 하얀 창 끝말에도 꼬리가 붙는다 (창업자만)')
잰다(/다듬기끝말\(됐나, 꼬리 = ''\)/.test(말), '끝말이 꼬리를 받는다')
잰다(/끝알림\(다듬기끝말\(true, tidyFounder\(\) \? tidyTail\(\) : ''\)\)/.test(app), '성공 창에 붙는다')
잰다(/끝알림\(다듬기끝말\(false, tidyFounder\(\) \? tidyTail\(\) : ''\)\)/.test(app), '실패 창에도 붙는다')

if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 창업자 폰에만 쌓이고, 설정에서 언제든 다시 본다.\n')
