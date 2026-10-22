// 🔐 재현판 — 워커 `토큰확인`(Firebase ID 토큰 RS256 검증)이 «가짜를 막고 진짜만 통과»시키나
// 📄 docs/결제-여는-순서-2026-09-19.md §2-끝 ④ · 워커 = ocr-proxy/worker.js
// ⭐ 진짜 구글 키는 못 쓰니, 우리가 만든 RSA 키로 서명하고 그 공개키를 워커 키통에 «넣어» 잰다(`_공개키넣기`).
import { 토큰확인, _공개키넣기 } from '../ocr-proxy/worker.js'

const b64u = (b) => Buffer.from(b).toString('base64url')
const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
const { privateKey: 남의키 } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }
_공개키넣기({ k1: jwk })

const 지금 = Math.floor(Date.now() / 1000)
const 기본몸 = (고칠 = {}) => ({
  iss: 'https://securetoken.google.com/hankki-6a768', aud: 'hankki-6a768',
  auth_time: 지금 - 60, iat: 지금 - 60, exp: 지금 + 3000, sub: 'FirebaseUid123',
  firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['1098765432101234'] } }, ...고칠,
})
async function 서명 (몸, { 머리 = {}, 키 = privateKey } = {}) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT', ...머리 }))
  const p = b64u(JSON.stringify(몸))
  const s = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', 키, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64u(new Uint8Array(s))
}

const 칸 = [
  ['① 진짜 구글 토큰 → 구글 번호', await 서명(기본몸()), '1098765432101234'],
  ['② 애플 토큰 → apple_ 접두', await 서명(기본몸({ firebase: { sign_in_provider: 'apple.com', identities: { 'apple.com': ['001234.abcd.5678'] } } })), 'apple_001234.abcd.5678'],
  ['③ 남의 키로 서명 → 막힘', await 서명(기본몸(), { 키: 남의키 }), null],
  ['④ 만료 → 막힘', await 서명(기본몸({ exp: 지금 - 600 })), null],
  ['⑤ 다른 프로젝트 aud → 막힘', await 서명(기본몸({ aud: 'other-proj' })), null],
  ['⑥ 다른 iss → 막힘', await 서명(기본몸({ iss: 'https://securetoken.google.com/other' })), null],
  ['⑦ alg none → 막힘', await 서명(기본몸(), { 머리: { alg: 'none' } }), null],
  ['⑧ 모르는 kid → 막힘', await 서명(기본몸(), { 머리: { kid: 'zz' } }), null],
  ['⑨ 빈 sub → 막힘', await 서명(기본몸({ sub: '' })), null],
  ['⑩ 미래 iat → 막힘', await 서명(기본몸({ iat: 지금 + 3600 })), null],
  ['⑪ 익명 로그인 → 번호 없음', await 서명(기본몸({ firebase: { sign_in_provider: 'anonymous', identities: {} } })), null],
  ['⑫ 쓰레기 글 → 막힘', 'abc.def', null],
]
// ⑬ 몸통을 바꿔치기(서명은 옛것) → 막힘
{ const [h, , s] = 칸[0][1].split('.'); 칸.push(['⑬ 몸통 바꿔치기 → 막힘', h + '.' + b64u(JSON.stringify(기본몸({ firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['남의번호'] } } }))) + '.' + s, null]) }

// ⑧ 은 모르는 kid 면 키를 «새로 받으러» 간다 — 여기선 네트워크를 막고 null 인지만 본다
globalThis.fetch = async () => { throw new Error('오프라인 재현') }

let 틀림 = 0
for (const [이름, 토큰, 기대] of 칸) {
  const 답 = await 토큰확인(토큰)
  const 맞 = 답 === 기대
  if (!맞) 틀림++
  console.log(`${맞 ? '✅' : '❌'} ${이름} = ${JSON.stringify(답)}`)
}
console.log(틀림 ? `❌ ${틀림}칸 틀림` : `✅ ${칸.length}칸 전부 맞음`)
process.exit(틀림 ? 1 : 0)
