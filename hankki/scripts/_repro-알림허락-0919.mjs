#!/usr/bin/env node
// 🔔🔐 폰 알림 «허락» 재현판 — 2026-09-19 (설계 = docs/알림-설계-2026-09-19.md)
//
// 재는 것
//   ① 🍎 푸시가 «안 되는» 기기(WKWebView 등) = 시트가 «아예 안 뜬다» · 권한창도 안 뜬다 (거짓 약속 금지)
//   ② 브라우저가 이미 「차단」이면 = 안 묻는다 (화살을 이미 썼다)
//   ③ 시트가 없는 자리 = 못 물었다 → false · 저장 안 함 · 권한창 «안 띄움» · 다음에 다시 물을 수 있다(2026-09-08 aiConsent 사고 재발 방지)
//   ④ 시트에서 「괜찮아요」 = 권한창 «안 띄움» · no 저장 · 다시 안 묻는다
//   ⑤ 시트에서 「알림 받을게요」 → 그때서야 권한창 · granted 면 yes · 유저가 거기서 차단하면 no
//   ⑥ 묻는 중에 또 부르면 시트는 «한 번»만 (같은 약속)
//   ⑦ 소스 = 시트가 App 에 마운트 · 담기 네 자리(장바구니 둘·냉장고 둘)에 «담은 뒤» 붙어 있다 · 시트 문구에 「하루에 한 번」
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

// 가짜 폰 — localStorage · window(이벤트) · navigator · PushManager · Notification
const 서랍 = new Map()
globalThis.localStorage = { getItem: (k) => (서랍.has(k) ? 서랍.get(k) : null), setItem: (k, v) => { 서랍.set(k, String(v)) }, removeItem: (k) => { 서랍.delete(k) } }
const 듣는이 = new Map()
let 권한창횟수 = 0, 권한창답 = 'granted'
const 폰 = (푸시되나, 지금권한 = 'default') => {
  globalThis.window = {
    navigator: 푸시되나 ? { serviceWorker: {} } : {},
    ...(푸시되나 ? { PushManager: function () {}, Notification: { permission: 지금권한, requestPermission: async () => { 권한창횟수++; return 권한창답 } } } : {}),
    addEventListener: (n, f) => { 듣는이.set(n, [...(듣는이.get(n) || []), f]) },
    removeEventListener: (n, f) => { 듣는이.set(n, (듣는이.get(n) || []).filter((g) => g !== f)) },
    dispatchEvent: (e) => { (듣는이.get(e.type) || []).forEach((f) => f(e)); return true },
  }
}
globalThis.CustomEvent = class { constructor (type, o) { this.type = type; this.detail = o?.detail } }

폰(false)
const P = await import('../src/pushConsent.js')

console.log('\n🔔🔐 폰 알림 허락\n')

// ① 🍎 푸시 안 되는 기기 = 시트도 권한창도 «없다»
{
  서랍.clear(); 권한창횟수 = 0; 듣는이.clear()
  let 뜸 = 0
  window.addEventListener(P.알림이벤트, () => { 뜸++ })
  const r = await P.알림허락받기()
  잰다(r === false && 뜸 === 0 && 권한창횟수 === 0 && P.알림동의상태() === null, '① 🍎 푸시 안 되는 기기 = 시트 0 · 권한창 0 · 저장 0', `뜸 ${뜸} · 권한창 ${권한창횟수}`)
  잰다(P.푸시가능() === false && P.물어도되나() === false, '  ①-b 푸시가능=false · 물어도되나=false')
}

// ② 이미 「차단」 = 안 묻는다
{
  폰(true, 'denied'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear()
  let 뜸 = 0
  window.addEventListener(P.알림이벤트, () => { 뜸++ })
  const r = await P.알림허락받기()
  잰다(r === false && 뜸 === 0 && 권한창횟수 === 0, '② 브라우저가 이미 차단 = 시트 0 · 권한창 0 (화살을 이미 썼다)')
  폰(true, 'granted'); 듣는이.clear(); 뜸 = 0
  window.addEventListener(P.알림이벤트, () => { 뜸++ })
  잰다((await P.알림허락받기()) === false && 뜸 === 0, '  ②-b 이미 켜져 있어도 안 묻는다')
}

// ③ 시트가 없는 자리 = 못 물었다 → 다음에 다시 물을 수 있다
{
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear()
  const r = await P.알림허락받기()
  잰다(r === false && 권한창횟수 === 0 && P.알림동의상태() === null, '③ 시트 없음 = false · 권한창 0 · 저장 0')
  잰다(P.물어도되나() === true, '  ③-b 그 뒤에도 «다시 물을 수 있다» (2026-09-08 aiConsent 사고 재발 방지)')
}

// 가짜 시트를 붙인다
let 다음답 = null, 뜬횟수 = 0
const 시트붙이기 = () => window.addEventListener(P.알림이벤트, (e) => { 뜬횟수++; e.detail.받았다(); setTimeout(() => e.detail.답(다음답), 0) })

// ④ 「괜찮아요」 = 권한창 안 띄움 · no · 다시 안 묻는다
{
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 다음답 = 'no'; 시트붙이기()
  const r = await P.알림허락받기()
  잰다(r === false && 뜬횟수 === 1 && 권한창횟수 === 0 && P.알림동의상태() === 'no', '④ 「괜찮아요」 = 시트 1 · 권한창 0 · no 저장', `권한창 ${권한창횟수}`)
  잰다((await P.알림허락받기()) === false && 뜬횟수 === 1, '  ④-b 다음에 또 담아도 «안 묻는다» (성가시게 안 한다)')
}

// ⑤ 「알림 받을게요」 → 그때서야 권한창
{
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 다음답 = 'yes'; 시트붙이기()
  권한창답 = 'granted'
  const r = await P.알림허락받기()
  잰다(r === true && 뜬횟수 === 1 && 권한창횟수 === 1 && P.알림동의상태() === 'yes', '⑤ 「받을게요」 → 권한창 1 → granted = true · yes 저장')
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 시트붙이기()
  권한창답 = 'denied'
  const r2 = await P.알림허락받기()
  잰다(r2 === false && 권한창횟수 === 1 && P.알림동의상태() === 'no', '  ⑤-b 권한창에서 유저가 차단하면 = false · no 저장 (다시 안 묻는다)')
}

// ⑥ 묻는 중에 또 부르면 «한 번»만
{
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 다음답 = 'yes'; 권한창답 = 'granted'; 시트붙이기()
  const [a, b] = await Promise.all([P.알림허락받기(), P.알림허락받기()])
  잰다(a === true && b === true && 뜬횟수 === 1 && 권한창횟수 === 1, '⑥ 두 번 불러도 시트 1 · 권한창 1 (같은 약속)')
}

// ⑦ 소스
{
  const app = 읽기('src/App.jsx'), shop = 읽기('src/screens/ShopScreen.jsx'), pantry = 읽기('src/components/PantryView.jsx'), 시트 = 읽기('src/components/PushConsentSheet.jsx')
  잰다(/<PushConsentSheet \/>/.test(app) && /import PushConsentSheet/.test(app), '⑦ App 에 시트 마운트')
  잰다((shop.match(/알림허락받기\(\)/g) || []).length === 2, '⑦ 장바구니 담는 두 길에 붙어 있다', `${(shop.match(/알림허락받기\(\)/g) || []).length}곳`)
  잰다(/장보기담음\(\)[\s\S]{0,200}알림허락받기\(\)/.test(shop), '⑦ 장바구니 = 담기(장보기담음) «뒤»에 묻는다')
  잰다((pantry.match(/알림허락받기\(\)/g) || []).length === 2, '⑦ 냉장고 넣는 두 길에 붙어 있다')
  잰다(/냉장고담음\(\); 알림허락받기\(\)/.test(pantry), '⑦ 냉장고 = 넣기(냉장고담음) «뒤»에 묻는다')
  잰다(/하루에 한 번/.test(시트), '⑦ 시트 문구에 「하루에 한 번」 — 잦지 않다고 «먼저» 말한다')
  잰다(/월·수/.test(시트) && /토요일/.test(시트) && /꾸미기/.test(시트), '⑦ 시트 문구에 «언제 오는지» 셋')
  잰다(/name="clock"/.test(시트), '⑦ 아이콘 = clock (Icon.jsx 에 bell 이 없다 · alert 는 경고처럼 보인다)')
}

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 알림 허락 — 화살을 아낀다')
process.exit(나쁨 ? 1 : 0)
