#!/usr/bin/env node
// 📱🔔 알림 «시안» — 안드로이드 알림창에 «실제 값»으로 그려 본다 (2026-09-20 · 창업자 *"알림 시안을 보여줘 실제 폰에서 어떻게 뜨는지"*)
//
// ⭐ 글자는 지어내지 않는다 — `push-schedule.mjs` 가 «실제로» 굽는 문구 ＋ `pantryExpiry.거울문장` 이 «실제로» 만드는 얹기 줄 ＋ 매니페스트가 쓰는 «그» 아이콘.
// ⚠️ 이건 «그림»이다 — 폰 제조사(삼성 One UI 등)마다 알림창 생김새가 조금 다르다. 글자·아이콘·순서만 믿을 것.
//    SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_시안-알림-0920.mjs
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { 일정만들기 } from './push-schedule.mjs'
import { 거울문장 } from '../src/pantryExpiry.js'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 아이콘 = 'data:image/png;base64,' + readFileSync(join(뿌리, 'public/icons/icon-192-v7.png')).toString('base64')
const 일정 = 일정만들기('2026-09-19').날
const 월 = 일정['2026-09-21'], 토 = 일정['2026-09-26'], 핼 = 일정['2026-10-01']
// 🧊 얹기 = 월요일 15:30 에 «그리는 순간» — 냉장고에 두부(9/23까지)·우유(9/20까지)가 있다고 치면
// 두부 9/23(D-2) · 우유 9/20(지남 → ⛔안 뜬다) · 상추 9/22(D-1)
const 얹음 = 거울문장([{ name: '두부', expiry: '2026-09-23' }, { name: '우유', expiry: '2026-09-20' }, { name: '상추', expiry: '2026-09-22' }], new Date('2026-09-21T15:30:00+09:00'))
// 🅰🅱🅲 [창업자 2026-09-20 00:16 *"너무 정신없고 길어"*] 월요일 카드 «짧은 후보 셋» — --후보 로 찍는다. ⛔고르면 push-schedule.mjs 한 곳만 바꾼다.
const 후보 = process.argv.includes('--후보')
const 냉장고줄 = 얹음 ? '\n' + 얹음 : ''
const 알림들 = 후보 ? [
  { 때: '🅰 갈래 이름은 빼고 · 냉장고는 «둘째 줄»', 제목: '한끼', 본문: '이번 주 레시피가 열렸어요 — 버섯' + 냉장고줄, 언제: '지금' },
  { 때: '🅱 재료를 «앞»으로 · 냉장고는 둘째 줄', 제목: '한끼', 본문: '버섯 레시피가 열렸어요' + 냉장고줄, 언제: '지금' },
  { 때: '🅲 갈래를 «제목»으로 올린다 · 본문은 재료뿐', 제목: '이번 주 레시피', 본문: '버섯' + 냉장고줄, 언제: '지금' },
] : [
  { 때: '월 15:30', 제목: '한끼', 본문: 월.본문 + 냉장고줄, 언제: '지금' },
  { 때: '토 09:00', 제목: '한끼', 본문: 토.본문, 언제: '토' },
  { 때: '10/1(목) 20:00', 제목: '한끼', 본문: 핼.본문, 언제: '10월 1일' },
]
const 카드 = (n) => `
  <div class="card">
    <div class="head"><img src="${아이콘}"><span class="app">한끼</span><span class="dot">·</span><span class="when">${n.언제}</span><span class="chev">⌄</span></div>
    <div class="title">${n.제목}</div>
    <div class="body" style="white-space:pre-line">${n.본문}</div>
    <div class="tag">보내는 때 = ${n.때}</div>
  </div>`
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box } body { margin:0; width:1080px; background:#0d0f14; font-family: -apple-system, 'Pretendard', 'Noto Sans KR', sans-serif; color:#e8eaf0; }
  .phone { padding: 70px 40px 60px; background: radial-gradient(1200px 700px at 50% -200px, #2a3550 0%, #0d0f14 60%); min-height: 1400px }
  .clock { text-align:center; font-size:150px; font-weight:300; letter-spacing:-2px; color:#f2f4f8; line-height:1 }
  .date { text-align:center; font-size:34px; color:#b7bdcc; margin: 10px 0 60px }
  .card { background:#1f2330; border-radius:36px; padding: 30px 36px 28px; margin: 0 0 22px; box-shadow: 0 8px 30px rgba(0,0,0,.35) }
  .head { display:flex; align-items:center; gap:14px; font-size:30px; color:#b7bdcc; margin-bottom:14px }
  .head img { width:44px; height:44px; border-radius:12px }
  .app { color:#e8eaf0; font-weight:600 } .dot { opacity:.5 } .chev { margin-left:auto; opacity:.6; font-size:36px }
  .title { font-size:40px; font-weight:700; color:#f6f7fb; margin-bottom:8px }
  .body { font-size:36px; line-height:1.4; color:#dfe3ee }
  .tag { margin-top:18px; font-size:26px; color:#8d94a8 }
  .note { margin: 30px 8px 0; font-size:26px; color:#8d94a8; line-height:1.5 }
  .note b { color:#c9d0e0 }
</style></head><body><div class="phone">
  <div class="clock">15:30</div><div class="date">9월 21일 월요일</div>
  ${알림들.map(카드).join('')}
  <div class="note"><b>실제 값</b>으로 그렸다 — 문구 = push-schedule.mjs 가 굽는 그대로 · 「냉장고에 …」 = pantryExpiry.거울문장 · 아이콘 = 매니페스트의 icon-192-v7.png<br>⚠️ 알림창 «생김새»는 폰마다 조금 다르다(삼성 One UI 등). 글자·아이콘·순서만 믿을 것.</div>
</div></body></html>`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'load' })
const 길 = join(뿌리, 'docs', 후보 ? '알림-시안-후보-2026-09-20.png' : '알림-시안-2026-09-20.png')
await p.screenshot({ path: 길, fullPage: true })
await b.close()
console.log(`📱 ${길}`)
console.log(알림들.map((n) => `   ${n.때}  [${n.제목}] ${n.본문.replace(/\n/g, ' ⏎ ')}`).join('\n'))
