#!/usr/bin/env node
// 🍎🔐 아이폰 「로그인 필수」 재현판 — 2026-09-10 (창업자 확정 «필수» · docs/로그인-필수로-2026-09-07.md §8·§9·§10)
//
// 가짜 firebase/auth ＋ 가짜 localStorage ＋ 가짜 Capacitor 로 노드에서 돈다(아이폰 없이).
// 재는 것 (설계 §8 결론 4 의 7칸 ＋ §9·§10 에서 더한 것)
//   ① 첫 실행 = 아이폰은 «표식 없음»이면 문 · 웹은 옛 조건(needsCloudGate && needsOnboarding) 그대로 — App.jsx 글자
//   ② 로그아웃 뒤 = onAuthStateChanged(null) → 알림(null, {확정:true}) ＋ 아이폰이면 표식도 꺼진다
//   ③ 확정 null → 문 = App.jsx 가 `m.확정` 을 보고서만 setCloudGate(true)
//   ④ 붙기 실패(인터넷 없음) = 알림(null, {확정:false}) → 문을 «안» 띄운다 · 사람지켜보기엔 타임아웃 길이 없다
//   ⑤ 실패 2번에도 아이폰은 탈출구 없음(«안내»만) · 웹은 탈출구 그대로 — CloudGate 글자
//   ⑥ 다른 번호로 로그인 = 로그인() 이 «주인을 안 바꾸고» 이전주인을 돌려준다 · 같은/없는 주인이면 바로 정한다
//      ＋ CloudGate 가 요약 «전»에 묻고, 「넣기」는 합치기(더하기)로 받는다 · 로그아웃·계정삭제는 주인을 안 지운다
//   ⑦ 웹은 변화 0 = 웹 조건 글자 · 탈출구 · 앱안인가() 스위치 하나
//   ⑧ 요약이 늦으면 8초 제한(영영 도는 바퀴 금지) · store reset(전부)가 일기·재료함·장보기까지 비운다 · CloudSheet 는 아이폰 로그아웃 뒤 시트를 닫는다
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

// 가짜 localStorage
const 서랍 = new Map()
globalThis.localStorage = {
  getItem: (k) => (서랍.has(k) ? 서랍.get(k) : null),
  setItem: (k, v) => { 서랍.set(k, String(v)) },
  removeItem: (k) => { 서랍.delete(k) },
  key: (i) => [...서랍.keys()][i] ?? null,
  get length () { return 서랍.size },
}
globalThis.window = globalThis.window || {}
const 아이폰으로 = (켬) => { globalThis.window.Capacitor = 켬 ? { isNativePlatform: () => true, Plugins: {} } : undefined }

const C = await import('../src/cloud.js')
const 번호A = '110688000000000006208'
const 번호B = '999999999999999999999'
const 구글사람 = (n) => ({ uid: 'FUID_' + n, displayName: '사람' + n, providerData: [{ providerId: 'google.com', uid: n }] })

/** 가짜 A(인증) — 구독자를 잡아 두고 시험이 «직접» 값을 쏜다 */
function 판만들기 ({ 처음사람 = null, 팝업사람 = null } = {}) {
  const auth = { currentUser: 처음사람 }
  let 구독 = null
  const A = {
    onAuthStateChanged: (a, f) => { 구독 = f; return () => { 구독 = null } },
    GoogleAuthProvider: Object.assign(function () {}, { credential: (t) => ({ t }) }),
    signInWithPopup: async () => { auth.currentUser = 팝업사람; return { user: 팝업사람 } },
    signOut: async () => { auth.currentUser = null },
  }
  C._가짜창고물리기({ F: {}, db: {}, auth, A })
  return { auth, 쏘기: (u) => 구독 && 구독(u), 구독중: () => !!구독 }
}
const 다음틱 = () => new Promise((r) => setTimeout(r, 0))

const 앱 = 읽기('src/App.jsx')
const 문 = 읽기('src/components/CloudGate.jsx')
const 시트 = 읽기('src/components/CloudSheet.jsx')
const 창고 = 읽기('src/store.jsx')
const 구름 = 읽기('src/cloud.js')

console.log('\n🍎🔐 아이폰 「로그인 필수」\n')

// ① 첫 실행 조건
잰다(/useState\(\(\) => 클라우드보임\(\) && \(앱안인가\(\) \? !로그인해뒀나\(\) : \(needsCloudGate\(\) && needsOnboarding\(\)\)\)\)/.test(앱),
  '① App 문 조건 = 아이폰이면 「표식 없으면 문」 · 웹은 옛 조건 그대로')
잰다(/사람지켜보기\(\(사람, m\) => \{ if \(사람 === null && m && m\.확정\) setCloudGate\(true\) \}\)/.test(앱) && /if \(!앱안인가\(\)\) return undefined/.test(앱),
  '  ①-b App 이 «확정 null» 에만 문을 다시 띄운다 · 아이폰 밖에선 구독 자체를 안 한다')

// ② 로그아웃 뒤 — 확정 null ＋ 아이폰 표식 꺼짐
{
  아이폰으로(true); 서랍.clear(); 서랍.set('hankki:cloud:on', '1')
  const 판 = 판만들기({ 처음사람: 구글사람(번호A) })
  const 받은 = []
  const 그만 = C.사람지켜보기((사람, m) => 받은.push([사람 ? 사람.번호 : null, m]))
  await 다음틱()
  판.쏘기(구글사람(번호A)); 판.쏘기(null)
  잰다(받은.length === 2 && 받은[0][0] === 번호A && 받은[0][1]?.확정 === true, '② 파이어베이스가 준 값엔 확정 true 가 붙는다', JSON.stringify(받은[0]))
  잰다(받은[1][0] === null && 받은[1][1]?.확정 === true, '  ②-b 로그아웃(null)도 확정 true — 문이 다시 뜬다')
  잰다(서랍.get('hankki:cloud:on') == null, '  ②-c 아이폰 «확정 null» 이면 표식도 꺼진다(표식이 진짜 상태를 따라간다)')
  그만()
}
// ③ 웹은 표식을 안 건드린다
{
  아이폰으로(false); 서랍.clear(); 서랍.set('hankki:cloud:on', '1')
  const 판 = 판만들기()
  const 그만 = C.사람지켜보기(() => {})
  await 다음틱(); 판.쏘기(null)
  잰다(서랍.get('hankki:cloud:on') === '1', '③ 웹·안드로이드에선 확정 null 이어도 표식을 안 끈다(변화 0)')
  그만()
}
// ④ 붙기 실패 = 확정 false · 타임아웃 없음
{
  아이폰으로(true); 서랍.clear(); 서랍.set('hankki:cloud:on', '1')
  C._가짜창고물리기({ F: {}, db: {}, auth: {}, A: { onAuthStateChanged: () => { throw new Error('부품 없음') } } })
  const 받은 = []
  C.사람지켜보기((사람, m) => 받은.push([사람, m]))
  await 다음틱(); await 다음틱()
  잰다(받은.length === 1 && 받은[0][0] === null && 받은[0][1]?.확정 === false, '④ 붙기 실패 = 확정 false → App 은 문을 «안» 띄운다', JSON.stringify(받은))
  잰다(서랍.get('hankki:cloud:on') === '1', '  ④-b 그때 표식도 그대로(모르는 것으로 쫓아내지 않는다)')
  const 지켜보기본문 = 구름.slice(구름.indexOf('export function 사람지켜보기'), 구름.indexOf('export function 사람지켜보기') + 1200)
  잰다(!/setTimeout/.test(지켜보기본문), '  ④-c 사람지켜보기엔 타임아웃 길이 없다 — 8초 타임아웃(사람기다리기)은 문과 무관')
}
// ⑤ 탈출구
잰다(/\{!앱안인가\(\) && 실패수 >= 2 && \(/.test(문) && /로그인이 안 되나요\? 그냥 시작하기/.test(문), '⑤ 웹 탈출구(2번 실패)는 그대로 · 아이폰에선 안 그린다')
잰다(/\{앱안인가\(\) && 실패수 >= 2 && \(/.test(문) && /인터넷 연결을 확인한 뒤 위 단추를 다시 눌러 주세요/.test(문), '  ⑤-b 아이폰은 2번 실패에 «안내»(인터넷 확인·다시)만')
잰다(!/if \(앱안인가\(\)\) [^\n]*set물음\(true\)/.test(문), '  ⑤-c 아이폰에서 물음(탈출구 확인)으로 가는 길이 없다')

// ⑥ 다른 번호 — 로그인() 이 주인을 안 바꾼다
{
  아이폰으로(false); 서랍.clear()
  판만들기({ 팝업사람: 구글사람(번호A) })
  const a = await C.로그인('google.com')
  잰다(a.번호 === 번호A && a.이전주인 === '' && C.기기주인() === 번호A, '⑥ 주인이 없을 때 로그인 = 주인이 곧 정해진다 · 이전주인 없음')
  await C.로그아웃()
  잰다(C.기기주인() === 번호A && 서랍.get('hankki:cloud:on') == null, '  ⑥-b 로그아웃해도 주인은 남는다(표식만 꺼진다)')
  판만들기({ 팝업사람: 구글사람(번호B) })
  const b = await C.로그인('google.com')
  잰다(b.번호 === 번호B && b.이전주인 === 번호A && C.기기주인() === 번호A, '  ⑥-c 다른 번호로 로그인 = 이전주인 A 를 돌려주고 주인은 «안» 바꾼다', `이전주인=${b.이전주인}`)
  C.기기주인정하기(번호B)
  판만들기({ 팝업사람: 구글사람(번호B) })
  const b2 = await C.로그인('google.com')
  잰다(b2.이전주인 === '' && C.기기주인() === 번호B, '  ⑥-d 고른 뒤(기기주인정하기) 같은 사람이 다시 로그인하면 안 묻는다')
  잰다(/\(앱안인가\(\) && 사람\.이전주인 && \(레 \+ 일\) > 0\)/.test(문) && 문.indexOf('set계정물음(') < 문.indexOf('await 로그인뒤()'), '  ⑥-e CloudGate 는 «내 기록이 있을 때만» 요약·올리기 «전»에 묻는다(아이폰 먼저)')
  잰다(/합치기\(\{ 내것: \{ recipes, diary, folders, profile, shoppingList, pantry, wishlist \}, 받은것 \}\)/.test(문) && /from '\.\.\/syncMerge'/.test(문), '  ⑥-f 「이 계정에 넣기」 뒤 가져오기 = 합치기(더하기) · 덮지 않는다')
  잰다(/if \(비울까\) reset\(true\)/.test(문) && /confirmLabel="비우고 시작하기" danger/.test(문), '  ⑥-g 「비우고 시작」 = reset(전부) ＋ 한 번 더 확인(danger)')
  잰다(/set계정물음\(\(q\) => \(q \? \{ \.\.\.q, 단계: 2 \} : null\)\)/.test(문) && /set계정물음\(\(q\) => \(q && q\.단계 === 2 \? q : null\)\)/.test(문), '  ⑥-h 물음 상태는 «하나»(단계) ＋ 함수형 갱신 — onSecondary 뒤 onClose 가 같은 틱이어도 둘째 시트가 뜬다')
  const 삭제본문 = 구름.slice(구름.indexOf('export async function 계정삭제'), 구름.indexOf('export async function 계정삭제') + 2500)
  잰다(!/기기주인정하기\(''\)|주인칸/.test(삭제본문) && !/기기주인정하기\(''\)/.test(구름.slice(구름.indexOf('export async function 로그아웃'), 구름.indexOf('export async function 로그아웃') + 600)), '  ⑥-i 로그아웃·계정삭제 코드가 주인을 지우지 않는다')
}
// ⑦ 웹 변화 0 — 스위치 하나
{
  const 스위치수 = 앱.split('\n').filter((줄) => !/^\s*\/\//.test(줄) && /앱안인가\(\)/.test(줄)).length   // 주석 줄은 안 센다
  잰다(스위치수 === 2, '⑦ App.jsx 의 스위치는 문 조건 ＋ 구독 두 자리뿐(코드 두 벌 없음)', `${스위치수}자리`)
  잰다(/needsCloudGate\(\) && needsOnboarding\(\)/.test(앱), '  ⑦-b 웹 조건 글자가 그대로 살아 있다')
}
// ⑧ 8초 제한 · reset 전부 · 시트 닫기
잰다(/const 제한 = \(약속, ms = 8000\)/.test(문) && /await 제한\(요약\(\)\)/.test(문) && /hankki\/timeout/.test(문), '⑧ 로그인 뒤 요약은 8초 제한 ＋ 고운말(늦어지고 있어요)')
잰다(/action\.전부 \? \{ diary: \[\], pantry: \[\], shoppingList: \[\], wishlist: \[\]/.test(창고) && /reset: useCallback\(\(전부 = false\) => dispatch\(\{ type: 'reset', 전부: 전부 === true \}\)/.test(창고), '  ⑧-b store reset(전부) = 일기·재료함·장보기·위시까지 처음으로 · 설정 「초기화」(인수 없음)는 그대로')
잰다(/await 로그아웃\(\); 받았다지우기\(\); set구름\(null\); if \(앱안인가\(\)\) onClose\(\)/.test(시트), '  ⑧-c CloudSheet 아이폰 로그아웃 뒤 시트를 닫는다(시트 z300 이 문 z210 을 가리므로)')

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 아이폰은 로그인해 두지 않으면 언제나 문 · 확정 null 에만 반응 · 다른 계정은 묻고 · 웹은 변화 0\n')
process.exit(나쁨 ? 1 : 0)
