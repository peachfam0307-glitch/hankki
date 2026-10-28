#!/usr/bin/env node
// 🔔🍎 아이폰 앱 알림 재현판 — 2026-09-20 · 가짜 Capacitor·localStorage·fetch 로 «실제로 돌린다»
//
// ⛔⛔ 왜 필요한가 — 2026-09-20 에 아이폰 시트가 키보드 뒤에 깔린 채 심사까지 통과했다(관문 전부 초록).
//   관문이 «코드»를 보고 «화면»을 안 봤기 때문이다. 알림은 더 나쁘다 — **안 와도 화면에 아무 일도 안 난다.**
//   조용한 실패라서 «돌려보지» 않으면 영영 모른다. 그래서 가짜 아이폰을 세워 «끝까지» 굴린다.
//
// 재는 것
//   ① 아이폰 앱이면 푸시가능()=true (⛔옛 잣대는 serviceWorker 를 봐서 아이폰이 영원히 false 였다)
//   ② 아이폰엔 Notification 이 없다 → 브라우저권한() 은 «우리가 적어 둔 답»을 읽는다
//   ③ 켜기 = 애플 권한창 → 토큰 → 워커에 { platform:'ios', endpoint:16진64 }
//   ④ 같은 토큰이면 워커에 «다시 안 보낸다»(KV 쓰기 아낌)
//   ⑤ 거절하면 아무것도 안 보낸다 · 토큰이 이상하면 안 보낸다
//   ⑥ 토큰이 «영영 안 오면» 12초에 포기한다(비행기 모드) — 앱이 멈추지 않는다
//   ⑦ 끄기 = unregister ＋ 토큰 잊기 ＋ 우리 답 'no'
//   ⑧ ⭐아이폰이 «아닌» 기기에선 이 길이 아예 안 돈다(갤럭시·웹은 한 글자도 안 바뀐다)

let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }
console.log('\n🔔🍎 아이폰 앱 알림\n')

// ── 가짜 폰 ───────────────────────────────────────────────────────────────
const 서랍 = new Map()
globalThis.localStorage = {
  getItem: (k) => (서랍.has(k) ? 서랍.get(k) : null),
  setItem: (k, v) => 서랍.set(k, String(v)),
  removeItem: (k) => 서랍.delete(k),
}
const 토큰 = 'ab'.repeat(32)   // 16진 64자
let 권한답 = 'prompt'
let 물어본횟수 = 0
let 등록횟수 = 0
let unregister횟수 = 0
let 토큰보냄 = null            // 'registration' | 'error' | 'never'
const 보낸것 = []

function 가짜부품() {
  const 듣는이 = {}
  return {
    checkPermissions: async () => ({ receive: 권한답 }),
    requestPermissions: async () => { 물어본횟수++; 권한답 = 가짜부품.대답 || 'granted'; return { receive: 권한답 } },
    addListener: (이름, fn) => { 듣는이[이름] = fn },
    register: async () => {
      등록횟수++
      // 애플은 «사건»으로 토큰을 준다 — 곧바로가 아니라 한 박자 뒤에
      setTimeout(() => {
        if (토큰보냄 === 'registration') 듣는이.registration?.({ value: 가짜부품.토큰 ?? 토큰 })
        else if (토큰보냄 === 'error') 듣는이.registrationError?.({ error: 'no' })
        // 'never' = 아무 일도 안 일어난다(비행기 모드)
      }, 5)
    },
    unregister: async () => { unregister횟수++ },
  }
}

globalThis.window = {
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { PushNotifications: 가짜부품() } },
  dispatchEvent: () => {},
  navigator: {},
}
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; Object.assign(this, o) } }
globalThis.fetch = async (url, opt = {}) => {
  보낸것.push({ url: String(url), body: JSON.parse(opt.body || '{}') })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

const 설정 = { 주소: "https://hankki-push.example", 토큰: "tok" }
const C = await import('../src/pushConsent.js')
const N = await import('../src/pushNative.js')

// ① ②
잰다(C.아이폰앱인가() === true, '① 아이폰 앱인 걸 알아본다')
잰다(C.푸시가능() === true, '① ⭐아이폰 앱이면 푸시가능()=true (옛 잣대로는 영원히 false 였다 — 시트를 아예 안 띄웠다)')
잰다(C.브라우저권한() === 'default', '② Notification 이 없어도 «아직 안 물음」을 돌려준다 (옛 코드는 denied 라 길이 막혔다)')

// ③ 켜기
{
  토큰보냄 = 'registration'; 가짜부품.대답 = 'granted'
  const 됐나 = await N.아이폰알림켜기(설정)
  const 마지막 = 보낸것[보낸것.length - 1]
  잰다(됐나 === true, '③ 켜기 = 애플 권한창 → 토큰 → 워커까지 한 번에')
  잰다(물어본횟수 === 1 && 등록횟수 === 1, '③ 권한창은 «한 번»만 (아이폰은 거절하면 다시 못 묻는다 — 화살이 하나다)')
  잰다(마지막?.url.endsWith('/subscribe') && 마지막.body.platform === 'ios', '③ 워커에 platform:"ios" 로 간다 (웹 묶음과 안 섞인다)')
  잰다(/^[0-9a-f]{64}$/.test(마지막?.body?.sub?.endpoint || ''), '③ 주소가 아니라 «기기 토큰»(16진 64자)을 보낸다')
  잰다(C.브라우저권한() === 'granted', '③ 권한 답이 폰에 적힌다 — 다음에 켤 때 다시 안 묻는다')
}
// ④ 같은 토큰 다시
{
  const 전 = 보낸것.length
  await N.아이폰구독맞추기(설정)
  잰다(보낸것.length === 전, '④ 같은 토큰이면 워커에 «다시 안 보낸다» (KV 쓰기 1,000/일 · 규모 검토)')
}
// ⑤ 거절 · 이상한 토큰
{
  서랍.clear(); 권한답 = 'denied'
  const 전 = 보낸것.length
  잰다((await N.아이폰알림켜기(설정)) === false && 보낸것.length === 전, '⑤ 거절하면 아무것도 안 보낸다')

  서랍.clear(); 권한답 = 'granted'; 가짜부품.토큰 = '이건토큰이아니다'
  const 전2 = 보낸것.length
  잰다((await N.아이폰구독맞추기(설정)) === false && 보낸것.length === 전2, '⑤ 토큰 꼴이 아니면 안 보낸다 (잣대를 좁게 — 쓰레기가 KV 에 안 쌓인다)')
  가짜부품.토큰 = undefined
}
// ⑥ 토큰이 영영 안 올 때 — 12초를 기다리지 않게 가짜 시계로
{
  서랍.clear(); 권한답 = 'granted'; 토큰보냄 = 'never'
  const 진짜setTimeout = globalThis.setTimeout
  globalThis.setTimeout = (fn, ms) => 진짜setTimeout(fn, ms > 1000 ? 20 : ms)   // 12초 → 20ms
  const 전 = 보낸것.length
  const r = await N.아이폰구독맞추기(설정)
  globalThis.setTimeout = 진짜setTimeout
  잰다(r === false && 보낸것.length === 전, '⑥ ⭐토큰이 영영 안 와도 «포기하고 돌아온다» (비행기 모드 — 앱이 안 멈춘다)')
  토큰보냄 = 'registration'
}
// ⑦ 끄기
{
  서랍.clear(); 권한답 = 'granted'
  await N.아이폰구독맞추기(설정)
  const 전unreg = unregister횟수
  await N.아이폰알림끄기()
  잰다(unregister횟수 === 전unreg + 1, '⑦ 끄면 애플 등록을 푼다')
  잰다(서랍.get('hankki:push:consent') === 'no' && !서랍.has('hankki:push:iostoken'), '⑦ 우리 답 no ＋ 토큰 잊기 (다시 켜면 처음부터)')
}
// ⑧ ⭐아이폰이 «아니면» 이 길이 아예 안 돈다
{
  globalThis.window.Capacitor = { isNativePlatform: () => false, getPlatform: () => 'web', Plugins: {} }
  잰다(C.아이폰앱인가() === false, '⑧ 갤럭시·웹에선 아이폰 길을 안 탄다')
  const 전 = 보낸것.length
  잰다((await N.아이폰구독맞추기(설정)) === false && 보낸것.length === 전, '⑧ ⭐아이폰이 아니면 아무것도 안 한다 — 갤럭시·웹은 한 글자도 안 바뀐다')
}

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 아이폰 앱 알림 — 권한 한 번 · 토큰 · 조용한 실패 없음 · 갤럭시 영향 0')
process.exit(나쁨 ? 1 : 0)
