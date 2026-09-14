#!/usr/bin/env node
/**
 * 🤖 「AI 가 다듬는 동안 화면이 죽은 것처럼 보인다」 재현판 — 2026-09-09
 *
 * 📮 창업자(실물) = "ai가 읽는다 안내가 끝나고 어느순간 아무일도 없다가 갑자기돼" (30초쯤)
 *
 * ⛔ 그날 잰 것 — EditorScreen 의 토스트가 «20초»(20000)인데 tidy.js 문구는 «20~60초»다.
 *    안내가 스스로 모순이라 20초 뒤 화면에 «아무 표시도» 안 남았다.
 *
 * ⭐ 이 판이 재는 것 = 시간이 정해진 토스트가 아니라 «끝날 때까지 남는 표시»인가
 *    ⛔ 그리고 그 표시가 «영영 굳지» 않는가 — 성공·실패·터짐 세 갈래 모두에서 꺼지는가
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const ed = readFileSync(join(여기, '..', 'src', 'screens', 'EditorScreen.jsx'), 'utf8')

let 틀림 = 0
const 잰다 = (ok, 이름) => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}`) }

console.log('\n🤖 AI 다듬는 중 표시 — 재현판\n')

// ⑴ 표시가 «있다»
잰다(/\{다듬는중 && !ocr\.busy && \(/.test(ed), '끝날 때까지 남는 줄이 화면에 있다')
잰다(/AI가 더 다듬는 중이에요/.test(ed), '무슨 일이 일어나는지 적혀 있다')
잰다(/20~60초 걸려요/.test(ed), '얼마나 걸리는지 «미리» 말한다')
잰다(/그동안 아래 칸을 고쳐도 돼요/.test(ed), '기다리는 동안 할 일을 준다')

// ⑵ ⭐ 켜고 «끄는» 자리 — 한 갈래라도 빠지면 영영 도는 것처럼 보인다
const 켬 = ed.indexOf('set다듬는중(true)\n    tidyRecipe(')
잰다(켬 > 0, '사진 읽기 뒤 다듬기를 «시작할 때» 켠다')
const 뒤 = ed.slice(켬)
const 끔들 = [...뒤.matchAll(/set다듬는중\(false\)/g)]
잰다(끔들.length >= 2, `그 뒤에서 끄는 자리가 둘 이상이다 (성공·실패 · 지금 ${끔들.length})`)
잰다(/\}\)\.catch\(\(\) => \{\s*\n[^\n]*\n\s*set다듬는중\(false\)/.test(뒤), '⭐터져도 끈다(catch) — 표시가 굳지 않는다')

// ⑶ ⛔ 옛 병이 안 돌아왔나 — 「시간이 정해진 토스트」에만 기대면 안 된다
잰다(!/AI다듬는중,\s*\n\s*20000,/.test(ed) || /set다듬는중\(true\)/.test(ed),
  '토스트 하나에만 기대지 않는다')

// ⑸ ⭐⭐ **자리** — 폰 첫 화면에 들어오나. 떠 있는데 «못 보면» 안 뜬 것과 같다.
// ⛔ 2026-09-09 밤에 «맨 위»로 올렸다가 되돌렸다 — 그 자리는 캡처 단추에서 멀어서
//    「누르고도 안 보인다」가 된다(_probe-부가정보자리-0819 이 그 자리를 지킨다).
//    ⭐ 유저는 방금 누른 단추를 보고 있다. 표시는 «그 아래»가 맞다.
잰다(ed.indexOf("pickOcr('all')") < ed.indexOf('사진 읽는 중 — 칸 채우기 진행 표시'),
  '⭐진행 표시가 캡처 단추 «바로 아래»에 있다')
잰다(ed.indexOf('AI가 더 다듬는 중이에요') < ed.indexOf('<label>제목</label>'),
  '⭐다듬는 중 표시도 제목 칸 «위»에 있다')

// ⑷ 「AI 로 다시 다듬기」 단추도 «같은» 표시를 쓴다 (토스트는 6초인데 실제는 20~60초)
잰다(/const 다시다듬기 = async \(\) => \{[\s\S]{0,200}set다듬는중\(true\)/.test(ed),
  '다시 다듬기 단추도 같은 표시를 켠다')
잰다(/set다듬는중\(false\)/.test(ed.slice(ed.indexOf('const 다시다듬기'))),
  '다시 다듬기도 끝나면 끈다')

if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다 — 다듬는 동안 화면이 죽어 보인다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 다듬는 동안 «살아 있다»가 보이고, 끝나면 사라진다.\n')
