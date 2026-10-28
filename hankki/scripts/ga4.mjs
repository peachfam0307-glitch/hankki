#!/usr/bin/env node
// 📊 GA4 숫자를 «캡처 없이» 받는다 — Google Analytics Data API (runReport)
//
// 📮 창업자 2026-10-28 「1.2.3번 조사하고 되는 건 바로 해줘」 → ② = GA4 캡처(2~3일에 한 번 세 장)를 없앤다
//    열쇠 = 서비스 계정 hankki-ga4@hankki-6a768 (GA4 속성 «뷰어») · 속성 ID 553169378
//    키는 환경 변수 GA4_SA_KEY(JSON) · GA4_PROPERTY_ID — ⛔저장소·채팅에 키를 두지 않는다
//    실측(2026-10-28 · 새 세션) = 토큰 OK · 10/21~27 activeUsers 36·34·44·59·3·13·10
//
// ⚠️ 환경 변수에 키가 «<…>»처럼 감싸져 들어가 있었다(창업자가 붙여넣을 때) → 맨 앞 「{」 ~ 맨 뒤 「}」만 읽는다.
//    다시 고치라고 하지 않는다 — 감싸는 글자가 바뀌어도 이 한 줄이 받아낸다.
// ⚠️ node fetch 는 HTTPS_PROXY 를 안 따라간다(yt.mjs 와 같은 이유) → curl 로 부른다.
//
// 쓰기:
//   node hankki/scripts/ga4.mjs daily [--from 7daysAgo] [--to yesterday]        # 날짜별 사용자·새 사용자·세션
//   node hankki/scripts/ga4.mjs report --dims pageTitle --metrics screenPageViews [--from …] [--to …] [--limit 50]
//   ＋ --filter "pagePath=~/hankki/(app|ios)"   ← 앱만(CLAUDE.md 알림 계측 줄과 같은 필터)
import { createSign } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const 원문 = process.env.GA4_SA_KEY || ''
const 속성 = process.env.GA4_PROPERTY_ID || '553169378'
if (!원문) { console.error('⛔ GA4_SA_KEY 가 없다 — 이 세션 환경(두 번째 Default)에 넣었나? 환경 변수는 «새 세션»부터 읽힌다'); process.exit(1) }
const 키 = JSON.parse(원문.slice(원문.indexOf('{'), 원문.lastIndexOf('}') + 1))

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
const curl = (args) => execFileSync('curl', ['-s', '-m', '30', ...args], { encoding: 'utf8', maxBuffer: 50e6 })

function 토큰() {
  const 지금 = Math.floor(Date.now() / 1000)
  const 머리 = b64({ alg: 'RS256', typ: 'JWT' })
  const 몸 = b64({ iss: 키.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: 지금, exp: 지금 + 3600 })
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(키.private_key, 'base64url')
  const j = JSON.parse(curl(['-X', 'POST', 'https://oauth2.googleapis.com/token', '-d', `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${머리}.${몸}.${서명}`]))
  if (!j.access_token) { console.error('⛔ 토큰 실패:', j.error, j.error_description); process.exit(1) }
  return j.access_token
}

function 보고서(요청) {
  const j = JSON.parse(curl(['-X', 'POST', `https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`,
    '-H', `Authorization: Bearer ${토큰()}`, '-H', 'Content-Type: application/json', '-d', JSON.stringify(요청)]))
  if (j.error) { console.error(`⛔ GA4 오류 ${j.error.code}: ${j.error.message}`); process.exit(1) }
  return j
}

const [, , 명령, ...나머지] = process.argv
const 옵션 = (k, 기본) => { const i = 나머지.indexOf(k); return i >= 0 ? 나머지[i + 1] : 기본 }
const 기간 = [{ startDate: 옵션('--from', '7daysAgo'), endDate: 옵션('--to', 'yesterday') }]
function 거르기() {
  const f = 옵션('--filter'); if (!f) return undefined
  const m = f.match(/^(\w+)(=~|=)(.+)$/); if (!m) { console.error('⛔ --filter 꼴 = 이름=값 또는 이름=~정규식'); process.exit(1) }
  return { filter: { fieldName: m[1], stringFilter: { matchType: m[2] === '=~' ? 'FULL_REGEXP' : 'EXACT', value: m[2] === '=~' ? `.*${m[3]}.*` : m[3] } } }
}
function 표(j) {
  const 칸 = [...(j.dimensionHeaders || []), ...(j.metricHeaders || [])].map((h) => h.name)
  console.log(칸.join('\t'))
  for (const r of j.rows || []) console.log([...(r.dimensionValues || []), ...(r.metricValues || [])].map((v) => v.value).join('\t'))
  if (!j.rows?.length) console.log('(줄 없음)')
}

if (명령 === 'daily') {
  표(보고서({ dateRanges: 기간, dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }], dimensionFilter: 거르기() }))
} else if (명령 === 'report') {
  const dims = (옵션('--dims', '') || '').split(',').filter(Boolean).map((name) => ({ name }))
  const metrics = (옵션('--metrics', 'activeUsers')).split(',').map((name) => ({ name }))
  표(보고서({ dateRanges: 기간, dimensions: dims, metrics, limit: Number(옵션('--limit', 50)), dimensionFilter: 거르기(),
    orderBys: [{ metric: { metricName: metrics[0].name }, desc: true }] }))
} else {
  console.error('쓰기: ga4.mjs daily | report --dims a,b --metrics x,y [--from] [--to] [--limit] [--filter 이름=~값]'); process.exit(1)
}
