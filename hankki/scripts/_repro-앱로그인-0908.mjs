#!/usr/bin/env node
// 🔐🍎 앱 안 로그인 부품 다리 재현판 — 2026-09-08 (큰 틀 4 · 열쇠 갈래 ⓑ)
//
// 가짜 부품(FirebaseAuthentication)·가짜 firebase/auth 로 노드에서 돈다(아이폰 없이).
// 재는 것
//   ① 열쇠() = 구글 → 구글번호 그대로 · 애플 → apple_번호 · 둘 다면 구글 · 없으면 null · ⛔Firebase UID 는 절대 안 쓴다
//   ② 구글 = 부품 signInWithGoogle → GoogleAuthProvider.credential(idToken) → signInWithCredential
//   ③ 애플 = 부품 signInWithApple({ skipNativeAuth: true }) → OAuthProvider('apple.com').credential({ idToken, rawNonce })
//   ④ 웹 층 로그인이 죽으면 부품 signOut 으로 «반쪽 상태»를 되돌린다
//   ⑤ 부품이 없으면(옛 껍데기) 팝업으로 «안» 떨어지고 안내 에러를 던진다
//   ⑥ 규칙(firestore.rules)이 앱과 «같은 열쇠»를 만든다 — 규칙열쇠(token) 와 열쇠(user) 대조 ＋ 규칙 원문에 apple_ · owns()
//   ⑦ cloud.js 가 다리를 «진짜로» 쓴다(import·로그인(공급자)·앱안인가 분기) — 글자로 확인
//   ⑧ 애플 단추는 «앱 안에서만» — 세 자리(CloudGate·CloudSheet·LoginNudge) 모두 `앱안인가() &&`
//   ⑨ 애플 로고 원본 파일이 있나(HIG = 직접 그리지 말 것) — 없으면 ⏳로 «알린다»(막지는 않는다 · 창업자 할 일)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as N from '../src/nativeAuth.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

console.log('\n🔐🍎 앱 안 로그인 부품 다리\n')

// ① 열쇠
const 구글사람 = { uid: 'FIREBASE_UID_X', providerData: [{ providerId: 'google.com', uid: '110688000000000006208' }] }
const 애플사람 = { uid: 'FIREBASE_UID_Y', providerData: [{ providerId: 'apple.com', uid: '001234.abcdef.5678' }] }
const 둘다 = { uid: 'Z', providerData: [{ providerId: 'apple.com', uid: 'A1' }, { providerId: 'google.com', uid: 'G1' }] }
잰다(N.열쇠(구글사람)?.번호 === '110688000000000006208' && N.열쇠(구글사람)?.공급자 === 'google.com', '① 구글 = 구글번호 «그대로»(이미 있는 칸을 지킨다)')
잰다(N.열쇠(애플사람)?.번호 === 'apple_001234.abcdef.5678' && N.열쇠(애플사람)?.공급자 === 'apple.com', '  ①-b 애플 = apple_애플번호')
잰다(N.열쇠(둘다)?.번호 === 'G1', '  ①-c 둘 다 붙어 있으면 구글이 이긴다')
잰다(N.열쇠({ uid: 'ONLY_UID', providerData: [] }) === null && N.열쇠(null) === null, '  ①-d 공급자 없으면 null — ⛔Firebase UID 로 대신 안 한다')

// 가짜 firebase/auth
function 가짜A () {
  const 기록 = { credential: [], oauth: [], signIn: [] }
  return {
    기록,
    GoogleAuthProvider: { credential: (t) => { 기록.credential.push(t); return { 종류: 'google', t } } },
    OAuthProvider: class { constructor (id) { this.id = id } credential (o) { 기록.oauth.push([this.id, o]); return { 종류: this.id, ...o } } },
    signInWithCredential: async (auth, 자격) => { 기록.signIn.push(자격); if (auth.죽어라) throw new Error('web-layer-fail'); return { user: auth.줄사람 } },
  }
}
function 가짜부품 () {
  const 기록 = { google: 0, apple: [], signOut: 0, del: 0 }
  return {
    기록,
    signInWithGoogle: async () => { 기록.google++; return { credential: { idToken: 'GTOKEN' } } },
    signInWithApple: async (o) => { 기록.apple.push(o); return { credential: { idToken: 'ATOKEN', nonce: 'NONCE1' } } },
    signOut: async () => { 기록.signOut++ },
    deleteUser: async () => { 기록.del++ },
  }
}

// ② 구글
{
  const A = 가짜A(); const 부품 = 가짜부품(); const auth = { 줄사람: 구글사람 }
  const u = await N.앱으로로그인({ A, auth, 공급자: 'google.com', 부품 })
  잰다(부품.기록.google === 1 && A.기록.credential[0] === 'GTOKEN' && A.기록.signIn[0]?.종류 === 'google' && u === 구글사람, '② 구글 = 부품 → credential(idToken) → 웹 층 signInWithCredential')
}
// ③ 애플
{
  const A = 가짜A(); const 부품 = 가짜부품(); const auth = { 줄사람: 애플사람 }
  const u = await N.앱으로로그인({ A, auth, 공급자: 'apple.com', 부품 })
  const [id, o] = A.기록.oauth[0] || []
  잰다(부품.기록.apple[0]?.skipNativeAuth === true && id === 'apple.com' && o?.idToken === 'ATOKEN' && o?.rawNonce === 'NONCE1' && u === 애플사람, '③ 애플 = skipNativeAuth ＋ OAuthProvider(apple.com).credential({ idToken, rawNonce })')
  const 부품2 = { ...가짜부품(), signInWithApple: async () => ({ credential: { idToken: 'X' } }) }   // nonce 없음
  let 던짐 = ''; try { await N.앱으로로그인({ A: 가짜A(), auth: {}, 공급자: 'apple.com', 부품: 부품2 }) } catch (e) { 던짐 = e.message }
  잰다(/Apple/.test(던짐), '  ③-b nonce 가 없으면 웹 층으로 안 넘기고 던진다', 던짐)
}
// ④ 웹 층 실패 → 부품 signOut
{
  const A = 가짜A(); const 부품 = 가짜부품()
  let 던짐 = ''; try { await N.앱으로로그인({ A, auth: { 죽어라: true }, 부품 }) } catch (e) { 던짐 = e.message }
  잰다(던짐 === 'web-layer-fail' && 부품.기록.signOut === 1, '④ 웹 층이 죽으면 부품도 로그아웃(반쪽 상태 없음) ＋ 에러는 위로', `signOut ${부품.기록.signOut}`)
}
// ⑤ 부품 없음
{
  let 던짐 = ''; try { await N.앱으로로그인({ A: 가짜A(), auth: {}, 부품: null }) } catch (e) { 던짐 = e.message }
  잰다(/업데이트/.test(던짐), '⑤ 부품 없는 옛 껍데기 = 팝업으로 안 떨어지고 「업데이트」 안내', 던짐)
  잰다(N.앱안인가({}) === false && N.로그인부품({}) === null && N.앱안인가({ Capacitor: { isNativePlatform: () => true } }) === true, '  ⑤-b 앱안인가/로그인부품 판정')
}
// ⑥ 규칙과 같은 열쇠
{
  const 구글토큰 = { firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['110688000000000006208'] } } }
  const 애플토큰 = { firebase: { sign_in_provider: 'apple.com', identities: { 'apple.com': ['001234.abcdef.5678'] } } }
  잰다(N.규칙열쇠(구글토큰) === N.열쇠(구글사람).번호 && N.규칙열쇠(애플토큰) === N.열쇠(애플사람).번호, '⑥ 규칙이 만드는 열쇠 = 앱이 만드는 열쇠 (구글·애플 둘 다)')
  const 규칙 = 읽기('firebase/firestore.rules')
  잰다(/'apple_' \+ request\.auth\.token\.firebase\.identities\['apple\.com'\]\[0\]/.test(규칙) && /sign_in_provider == 'apple\.com'/.test(규칙), '  ⑥-b firestore.rules 에 apple_ 열쇠 줄이 있다')
  잰다((규칙.match(/allow read, write: if owns\(gid\);/g) || []).length === 2 && /googleId\(\) == gid/.test(규칙), '  ⑥-c 두 match 가 owns() 를 쓰고 구글 줄은 그대로다')
}
// ⑦ cloud.js 가 다리를 쓴다
{
  const c = 읽기('src/cloud.js')
  잰다(/from '\.\/nativeAuth\.js'/.test(c) && /export async function 로그인\(공급자 = 'google\.com'\)/.test(c) && /if \(앱안인가\(\)\) \{\s*user = await 앱으로로그인/.test(c), '⑦ cloud.js = import ＋ 로그인(공급자) ＋ 앱 안이면 부품 길')
  잰다(/initializeAuth\(application, \{ persistence: 인증\.indexedDBLocalPersistence \}\)/.test(c), '  ⑦-b 앱 안에선 initializeAuth(indexedDBLocalPersistence) — 다음 켤 때 로그인이 남는다')
  잰다(/const k = 열쇠\(user\)/.test(c) && !/const 번호 = 구글번호\(user\)/.test(c), '  ⑦-c 사람으로() 가 열쇠() 한 곳을 쓴다')
  잰다(/if \(앱안인가\(\)\) await 앱로그아웃\(\)/.test(c), '  ⑦-d 로그아웃 때 앱 층도 같이')
}
// ⑧ 단추 세 자리
{
  let 좋다 = true; const 덧 = []
  for (const f of ['CloudGate', 'CloudSheet', 'LoginNudge']) {
    const s = 읽기(`src/components/${f}.jsx`)
    const ok = /import AppleButton from '\.\/AppleButton'/.test(s) && /\{앱안인가\(\) && <AppleButton/.test(s) && /눌러로그인\('google\.com'\)/.test(s) && /눌러로그인\('apple\.com'\)/.test(s)
    if (!ok) 좋다 = false
    덧.push(`${f}:${ok ? '✓' : '✗'}`)
    // 구글이 애플보다 «먼저»
    const g = s.indexOf('<GoogleButton'); const a = s.indexOf('<AppleButton')
    if (!(g > -1 && a > g)) { 좋다 = false; 덧.push(`${f}:순서✗`) }
  }
  잰다(좋다, '⑧ 세 자리 모두 «앱 안에서만» 애플 단추 · 구글이 먼저', 덧.join(' '))
  const b = 읽기('src/components/AppleButton.jsx')
  잰다(!/<path/.test(b) && /apple-logo-white\.svg/.test(b) && /#000/.test(b), '  ⑧-b 애플 로고를 직접 그리지 않는다(HIG) · 검정 스타일')
}
// ⑨ 로고 파일
{
  const 있다 = fs.existsSync(path.join(여기, '..', 'public', 'apple-logo-white.svg'))
  console.log(`  ${있다 ? '✅' : '⏳'} ⑨ public/apple-logo-white.svg ${있다 ? '있음' : '«아직 없음» — 창업자가 Apple Design Resources 에서 받아 넣는다(제출 전 필수 · 지금은 막지 않는다)'}`)
}

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 앱 안에선 부품으로, 열쇠는 구글 그대로·애플은 apple_ — 규칙과 같은 식\n')
process.exit(나쁨 ? 1 : 0)
