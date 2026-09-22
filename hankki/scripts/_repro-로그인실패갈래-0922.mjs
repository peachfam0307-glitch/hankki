#!/usr/bin/env node
// 🔐🧪 로그인 실패를 «왜»로 가르는 판 — 2026-09-22
//
// 📮 창업자 = *"이거는 본인 계정 비번 까먹어서 못들어온거 아냐?"*
// 🔢 그 물음이 나온 자리 = 2026-09-22 GA4 표 `gate_fail` **14번**(사람 4명).
//    ⛔ 그때 우리는 «그냥 닫은 사람»과 «진짜 막힌 사람»을 가를 수가 없었다 — 이름이 하나뿐이었다.
//
// ✅ 이 판이 지키는 것 = 오류 코드 → 갈래 넷(closed·blocked·net·other)이 «틀리지 않는다».
// ⛔ 되돌리면(갈래고르기를 지우거나 잣대를 바꾸면) 여기서 죽는다.
// 📌 `.js` 확장자를 붙여 읽는다(이 저장소 규칙 · favPin.js 주석).
import { 로그인실패갈래고르기 } from '../src/stats.js'

let 죽음 = 0
const 재다 = (이름, 받은, 바란) => {
  const ok = 받은 === 바란
  if (!ok) 죽음++
  console.log(`${ok ? '✅' : '⛔'} ${이름} — 받은 ${받은} · 바란 ${바란}`)
}
const 칸 = (code) => 로그인실패갈래고르기(code ? { code } : null)

console.log('🔐 로그인 실패 갈래 — 11칸\n')

// ① 스스로 닫았다 = 마음 바꿈. ⭐제일 흔하고, «문제가 아닌» 쪽이다.
재다('팝업 닫음', 칸('auth/popup-closed-by-user'), 'closed')
재다('팝업 취소', 칸('auth/cancelled-popup-request'), 'closed')

// ② 브라우저가 막았다 — 우리가 안내로 풀 수 있는 쪽이다.
재다('팝업 막힘', 칸('auth/popup-blocked'), 'blocked')

// ③ 인터넷 — 우리 탓도 유저 탓도 아니다.
재다('네트워크', 칸('auth/network-request-failed'), 'net')
재다('늦음', 칸('hankki/timeout'), 'net')

// ④ 그 밖 — ⛔여기가 「비번 탓」이라는 뜻은 «아니다». 저쪽에서 막힌 것이 섞여 든다.
재다('계정 막힘', 칸('auth/user-disabled'), 'other')
재다('모르는 코드', 칸('auth/weird-new-code'), 'other')
재다('코드 없음', 칸(''), 'other')
재다('오류 자체가 없음', 로그인실패갈래고르기(undefined), 'other')

// ⑤ ⛔ 이름이 새지 않는다 — 넷 말고는 나올 수 없다
const 넷 = new Set(['closed', 'blocked', 'net', 'other'])
const 아무거나 = ['', 'auth/x', 'hankki/timeout', 'auth/popup-blocked', 'auth/network-request-failed', 'zzz']
재다('갈래는 넷뿐', 아무거나.every((c) => 넷.has(칸(c))), true)

// ⑥ 🔒 잣대가 «고운말»과 같은 글자를 본다 — 두 곳이 어긋나면 안내와 숫자가 따로 논다
import { readFileSync } from 'node:fs'
const 문 = readFileSync(new URL('../src/components/CloudGate.jsx', import.meta.url), 'utf8')
const 같이본다 = ['popup-blocked', 'popup-closed', 'cancelled-popup', 'network', 'hankki/timeout']
재다('고운말과 같은 잣대', 같이본다.every((g) => 문.includes(g)), true)

console.log(죽음 ? `\n⛔ ${죽음}칸 죽었다` : '\n✅ 11칸 통과')
process.exit(죽음 ? 1 : 0)
