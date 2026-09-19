#!/usr/bin/env node
// 🔔🧊 유통기한 «얹기» 재현판 — 2026-09-20 (창업자 확정 2026-09-19 "ㄱㄱ 얹기로 가 내일 붙여" · 설계 관문 통과)
//
// 재는 것
//   ① 거울엔 «이름·유통기한»만 — 사진(base64)·메모·수량·id 가 «없다» (잠금 화면에 뜨는 글이다)
//   ② 같은 냉장고면 캐시에 «안 쓴다» · 바뀌면 쓴다 (규모 검토 — store 는 모든 변화마다 저장한다)
//   ③ 문장 = 임박 0이면 null · 지난 것이 먼저 · 1개/2개 이상 꼴 · D-3 잣대 그대로
//   ④ ⭐ 낡지 않는다 — 금요일에 적은 「D-2」를 월요일에 읽으면 «지났어요» (그리는 순간 다시 센다)
//   ⑤ 캐시가 없거나 터지면 null — 원래 알림 그대로
//   ⑥ 소스 = store 저장 자리 «하나»에 거울쓰기 · sw 가 거울읽어문장 을 «그리는 순간» 부르고 본문 뒤에 얹는다 · 캐시 이름이 sw 와 같다 · 머리 주석 ② 가 「얹기」로 바뀌었다
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }
console.log('\n🔔🧊 유통기한 얹기\n')

// 가짜 캐시
let 쓴횟수 = 0
const 통 = new Map()
globalThis.caches = { open: async () => ({ put: async (k, r) => { 쓴횟수++; 통.set(k, await r.text()) }, match: async (k) => (통.has(k) ? new Response(통.get(k)) : undefined) }) }

const P = await import('../src/pantryExpiry.js')
// 📅 금요일(2026-09-18) 기준 ±n일 — ⛔「오늘」을 만드는 게 아니다(고정된 시험 날짜) · toISOString 없이 UTC 산수로 적는다(check-kst 규칙)
const 날 = (n) => { const t = new Date(Date.UTC(2026, 8, 18 + n)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}` }
const 금 = new Date('2026-09-18T12:00:00+09:00'), 월 = new Date('2026-09-21T15:30:00+09:00')
const 냉장고 = [
  { id: 'a', name: '두부', expiry: 날(2), memo: '비밀 메모', photo: 'data:image/jpeg;base64,AAAA', qty: 1 },
  { id: 'b', name: '우유', expiry: null },
  { id: 'c', name: '계란', expiry: 날(10) },
]

// ① 이름·유통기한만
{
  const g = P.거울고르기(냉장고)
  잰다(g.length === 2 && g.every((x) => Object.keys(x).sort().join(',') === 'expiry,name'), '① 거울 = 이름·유통기한 두 칸만 (유통기한 없는 우유는 뺀다)', JSON.stringify(g))
  잰다(!JSON.stringify(g).includes('base64') && !JSON.stringify(g).includes('비밀'), '① 사진·메모가 «안» 들어간다')
}
// ② 같으면 안 쓴다
{
  쓴횟수 = 0
  const a = await P.거울쓰기(냉장고); const b = await P.거울쓰기(냉장고)
  잰다(a === true && b === false && 쓴횟수 === 1, '② 같은 냉장고를 두 번 저장해도 캐시엔 «한 번»만 쓴다')
  const c = await P.거울쓰기([...냉장고, { id: 'd', name: '상추', expiry: 날(1) }])
  잰다(c === true && 쓴횟수 === 2, '② 바뀌면 다시 쓴다')
}
// ③ 문장
{
  잰다(P.거울문장([{ name: '계란', expiry: 날(10) }], 금) === null, '③ 임박 없음 = null (원래 알림 그대로)')
  잰다(P.거울문장([{ name: '두부', expiry: 날(2) }], 금) === '냉장고에 두부 2일 남았어요', '③ 1개 = 「두부 2일 남았어요」', P.거울문장([{ name: '두부', expiry: 날(2) }], 금))
  잰다(P.거울문장([{ name: '두부', expiry: 날(2) }, { name: '상추', expiry: 날(-1) }, { name: '햄', expiry: 날(0) }], 금) === '냉장고의 상추 외 2개 지났어요', '③ 지난 것이 «먼저» · 나머지는 「외 n개」', P.거울문장([{ name: '두부', expiry: 날(2) }, { name: '상추', expiry: 날(-1) }, { name: '햄', expiry: 날(0) }], 금))
  잰다(P.거울문장([{ name: '햄', expiry: 날(0) }], 금) === '냉장고의 햄 오늘까지예요', '③ D-0 = 「오늘까지예요」')
  잰다(P.거울문장([{ name: '계란', expiry: 날(3) }], 금) !== null && P.거울문장([{ name: '계란', expiry: 날(4) }], 금) === null, '③ D-3 은 임박 · D-4 는 아직 (EXPIRY_SOON_DAYS 그대로)')
}
// ④ 낡지 않는다
{
  통.clear(); await P.거울쓰기([{ id: 'x', name: '두부', expiry: 날(2), photo: 'p' }])   // 금요일에 D-2 로 적었다
  const 월요일 = await P.거울읽어문장(월)
  잰다(월요일 === '냉장고의 두부 지났어요', '④ 금요일 「D-2」 거울을 월요일에 읽으면 «지났어요» (그리는 순간 다시 센다)', 월요일)
}
// ⑤ 캐시 없음·터짐
{
  통.clear()
  잰다((await P.거울읽어문장(월)) === null, '⑤ 거울이 없으면 null')
  const 원래 = globalThis.caches
  globalThis.caches = { open: async () => { throw new Error('boom') } }
  잰다((await P.거울읽어문장(월)) === null && (await P.거울쓰기(냉장고)) === false, '⑤ 캐시가 터져도 null/false — 앱·알림 안 멎는다')
  globalThis.caches = 원래
}
// ⑥ 소스
{
  const store = 읽기('src/store.jsx'), sw = 읽기('src/sw.js'), pe = 읽기('src/pantryExpiry.js')
  잰다(/localStorage\.setItem\(KEY, 글\)[\s\S]{0,400}거울쓰기\(저장할판\.pantry\)/.test(store) && (store.match(/거울쓰기\(/g) || []).length === 1, '⑥ store = 저장 자리 «하나»(setItem 직후)에서 거울쓰기 — 어느 길로 와도 지난다')
  잰다(/거울읽어문장\(new Date\(\)\)/.test(sw) && /\(얹을줄 \? ' · ' \+ 얹을줄 : ''\)/.test(sw), '⑥ sw = 그리는 순간 거울을 읽어 본문 «뒤»에 얹는다 (없으면 그대로)')
  잰다(new RegExp(`const SHARE_CACHE = '${P.거울캐시}'`).test(sw), `⑥ 캐시 이름이 sw 와 같다 (${P.거울캐시})`)
  잰다(/② 폰 푸시[\s\S]*얹기/.test(pe) && !/명의 이전 뒤 판정/.test(pe), '⑥ 머리 주석 ② = 「명의 이전 뒤 판정」→「얹기」로 바뀌었다')
}
console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 유통기한 얹기 — 서버 0바이트 · 낡지 않는다')
process.exit(나쁨 ? 1 : 0)
