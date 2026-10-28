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

// ⑥-② [2026-09-21 창업자 녹화 «안켜져»] 브라우저는 이미 «허용»인데 우리 답이 yes 가 아닌 폰 —
//    설정 「알림 받기」를 누르면 «시트도 권한창도 없이» 곧장 「켜지 못했어요」가 떴다(허용이라 다시묻기도 물어도되나도 둘 다 false).
//    ✅ 허용이면 물을 게 없다 → 그 자리에서 yes 로 켜진다(권한창 0 · 시트 0).
{
  폰(true, 'granted'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 시트붙이기()
  서랍.set('hankki:push:consent', 'no')
  const r = await P.알림허락받기({ 다시묻기: true })
  잰다(r === true && 뜬횟수 === 0 && 권한창횟수 === 0 && P.알림동의상태() === 'yes', '⑥-② 브라우저 «허용» ＋ 우리 답 no → 설정 켜기 = true · 시트 0 · 권한창 0 · yes 저장')
  서랍.set('hankki:push:consent', 'no')
  잰다((await P.알림허락받기()) === false, '  ⑥-②b 다시묻기 «없이»(담기 자리)는 여전히 안 묻는다(②-b 그대로)')
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
  잰다((shop.match(/알림켜기\(\)/g) || []).length === 2, '⑦ 장바구니 담는 두 길에 붙어 있다', `${(shop.match(/알림켜기\(\)/g) || []).length}곳`)
  잰다(/장보기담음\(\)[\s\S]{0,200}알림켜기\(\)/.test(shop), '⑦ 장바구니 = 담기(장보기담음) «뒤»에 묻는다')
  잰다((pantry.match(/알림켜기\(\)/g) || []).length === 2, '⑦ 냉장고 넣는 두 길에 붙어 있다')
  잰다(/냉장고담음\(\); 알림켜기\(\)/.test(pantry), '⑦ 냉장고 = 넣기(냉장고담음) «뒤»에 묻는다')
  // ── ⑧ 구독(pushSubscribe) — 허락 «뒤»에만, 이미 도는 서비스워커를 «찾아» 쓴다
  const subs = 읽기('src/pushSubscribe.js')
  잰다(/export async function 알림켜기[\s\S]*?알림허락받기\(\{ 다시묻기 \}\)[\s\S]*?if \(!됐나\) return false[\s\S]*?return 구독맞추기\(\)/.test(subs), '⑧ 알림켜기 = 허락 → 안 됐으면 끝 → 됐으면 구독맞추기')
  잰다(/navigator\.serviceWorker\.ready/.test(subs) && !/serviceWorker\.register\(/.test(subs), '⑧ 서비스워커를 «새로 등록하지 않고» ready 로 찾는다 (sw.js 가 이미 돈다)')
  잰다(/getSubscription\(\)[\s\S]*?if \(!sub\)[\s\S]*?\/vapid[\s\S]*?pushManager\.subscribe\(\{ userVisibleOnly: true/.test(subs), '⑧ 구독이 없을 때만 /vapid 를 받아 새로 만든다 (userVisibleOnly)')
  잰다(/'x-hankki-token': OCR_APP_TOKEN/.test(subs) && /export const OCR_APP_TOKEN/.test(읽기('src/ocr.js')), '⑧ 구독 넣기에 앱 토큰을 붙인다 (KV 쓰기 1,000/일을 남이 못 쓰게)')
  잰다(/보낸표[\s\S]*?이미 === sub\.endpoint\) return true/.test(subs), '⑧ 같은 주소는 워커에 «다시 안 보낸다» (KV 쓰기 아끼기)')
  잰다(/알림동의상태\(\) !== 'yes' \|\| 브라우저권한\(\) !== 'granted'\) return false/.test(subs), '⑧ 우리 답 yes ＋ 브라우저 granted 둘 다일 때만 구독한다')
  잰다(/구독맞추기\(\)/.test(시트) && /import \{ 구독맞추기(, 알림켜기)? \} from '\.\.\/pushSubscribe'/.test(시트), '⑧ 앱을 켤 때 구독맞추기 한 번 (시트 마운트에서 · 서비스워커가 바뀌어도 살아남게)')
  잰다(/하루에 한 번/.test(시트), '⑦ 시트 문구에 「하루에 한 번」 — 잦지 않다고 «먼저» 말한다')
  잰다(/새 레시피/.test(시트) && /토요일/.test(시트) && /꾸미기/.test(시트), '⑦ 시트 문구에 «언제 오는지» 셋')
  // 🔔 [2026-09-24] 요일·시각을 글자로 박지 않는다 — 「월·수」「15:30」이 이미 어긋나 있었다(진짜 17:00 · 10/1 은 목요일 꾸미기)
  잰다(!/월·수/.test(시트), '⑦ ⛔시트에 「월·수」가 없다 (요일 고정이 아니다)')
  잰다(!/showToast\([^)]*(15:30|월·수)/.test(읽기('src/screens/ProfileScreen.jsx')), '⑦ ⛔설정 토스트에 「월·수 15:30」이 없다')
  // 🔔 [2026-09-24 · 창업자 갤럭시 실측] 크롬 창을 «닫기만» 한 것(default)을 거절(no)로 적으면 다음부터 시트가 영영 안 뜬다
  const 동의 = 읽기('src/pushConsent.js')
  잰다(!/알림동의쓰기\(결과 === 'granted' \? 'yes' : 'no'\)/.test(동의) && /else if \(결과 === 'denied'\) 알림동의쓰기\('no'\)/.test(동의), '⑦ ⛔닫기(default)는 거절로 안 적는다 — no 는 denied 일 때만')
  잰다(/name="clock"/.test(시트), '⑦ 아이콘 = clock (Icon.jsx 에 bell 이 없다 · alert 는 경고처럼 보인다)')
}

// ⑨ ⚙️ 설정 줄 — 「설정에서 끌 수 있어요」라는 «약속»의 실물 ＋ 다시묻기·끄기
{
  const prof = 읽기('src/screens/ProfileScreen.jsx'), subs = 읽기('src/pushSubscribe.js')
  잰다(/label: '알림 받기'/.test(prof) && /알림끄기\(\)/.test(prof) && /알림켜기\(\{ 다시묻기: true \}\)/.test(prof), '⑨ 설정에 「알림 받기」 줄 — 끄기 ＋ 켜기(다시묻기)')
  잰다(/이 기기는 안 돼요/.test(prof) && /폰 설정에서 차단됨/.test(prof), '⑨ 아이폰·차단 폰엔 «못 켠다»고 정직하게 보인다')
  잰다(/export async function 알림끄기[\s\S]*?unsubscribe\(\)[\s\S]*?알림동의쓰기\('no'\)/.test(subs), '⑨ 알림끄기 = 폰 구독 지우기 ＋ 우리 답 no')
  폰(true, 'default'); 서랍.clear(); 권한창횟수 = 0; 듣는이.clear(); 뜬횟수 = 0; 다음답 = 'no'; 시트붙이기()
  await P.알림허락받기()
  다음답 = 'yes'; 권한창답 = 'granted'
  const r = await P.알림허락받기({ 다시묻기: true })
  잰다(r === true && 뜬횟수 === 2 && P.알림동의상태() === 'yes', '⑨ 「괜찮아요」 뒤에도 설정 켜기(다시묻기)면 «다시 묻고» 켜진다')
  폰(true, 'denied'); 듣는이.clear(); 뜬횟수 = 0; 시트붙이기()
  잰다((await P.알림허락받기({ 다시묻기: true })) === false && 뜬횟수 === 0, '⑨ 브라우저가 차단이면 다시묻기여도 «안 묻는다»(폰 설정에서만 풀린다)')
}

// ⑩ 📅 D-2 날짜 보내기(pushSubscribe.유통기한날짜보내기) — ⛔ 이 파일은 ocr.js(tesseract)를 끌어와 Node 에서 못 돌린다 → ⑧ 처럼 «소스»를 잰다. 실제 동작은 워커 재현판 ⑨ ＋ 얹기 재현판 ⑦ 이 잰다.
{
  const subs = 읽기('src/pushSubscribe.js')
  const f = subs.slice(subs.indexOf('export async function 유통기한날짜보내기'))
  잰다(/if \(!푸시가능\(\) \|\| 알림동의상태\(\) !== 'yes'\) return false/.test(f), '⑩ 허락(yes) 전엔 안 보낸다')
  잰다(/endpoint = localStorage\.getItem\(보낸표\)[\s\S]{0,80}if \(!endpoint\) return false/.test(f), '⑩ 구독이 워커에 간 뒤(보낸표)에만 — 워커가 이 폰을 알아야 한다')
  잰다(/알림날짜들\(pantry, todayKST\(\)\)/.test(f) && /if \(이미 === 글\) return '같다'/.test(f), '⑩ 날짜만 세고, 지난번과 같으면 요청 0')
  잰다(/body: JSON\.stringify\(\{ endpoint, dates: 날짜들 \}\)/.test(f) && !/name|memo|photo/.test(f), '⑩ 보내는 몸통 = { endpoint, dates } — 이름·메모·사진 «없음»')
  잰다(/if \(!v \|\| !v\.ok \|\| v\.partial\) return false/.test(f) && /localStorage\.setItem\(날짜표, 글\)/.test(f), '⑩ 워커가 partial 이면 «안 적는다» → 다음 저장 때 또 보낸다 · ok 면 적는다')
  잰다(/localStorage\.removeItem\(보낸표\); localStorage\.removeItem\(날짜표\)/.test(subs) && /localStorage\.setItem\(보낸표, sub\.endpoint\); localStorage\.removeItem\(날짜표\)/.test(subs), '⑩ 끄면 날짜표도 지운다 · 새 구독 주소면 날짜표를 지워 다시 보낸다')
  잰다(/const 모으는초 = 30/.test(subs) && /setTimeout\(\(\) => \{ 모으기 = null; 유통기한날짜보내기\(마지막냉장고\)/.test(subs), '⑩ 저장 자리에선 30초 모아 «한 번» (재료 셋 잇달아 넣어도 요청 하나)')
}

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 알림 허락 — 화살을 아낀다 · D-2 날짜만')
process.exit(나쁨 ? 1 : 0)
