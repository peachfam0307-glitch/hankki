#!/usr/bin/env node
// 🎥 유튜브 데이터 창구(YouTube Data API) — **모든 호출은 여기 한 곳으로만** 나간다.
//
// 📮 [절대원칙 · 창업자 2026-10-28] *"이 금액은 네가 체크하지 않으면 내가 몰라. 중요하니까 절대원칙으로 규칙넣고 검색할때마다 체크해줘."*
//
// ⭐ 하는 일 = 부를 때마다 «쓴 양»을 장부(docs/유튜브-사용량.json)에 적고, 매번 남은 양을 찍는다.
//   · 하루 기본 할당량(공식 · developers.google.com/youtube/data/determine_quota_cost · 2026-10-28 열람)
//     = search.list 100번(1번 = 1단위, 따로 센다) · 그 밖 전부 합쳐 10,000단위 · 미국 서부 자정에 다시 찬다
//   · ⛔ 넘으면 돈이 나가는지 «공식으로 확인 못 했다» → 그래서 **상한의 절반에서 스스로 멈춘다**(검색 50 · 그 밖 5,000)
//   · 키는 저장소에 없다 — 환경의 Network secrets 가 www.googleapis.com/youtube/v3/ 요청에 헤더로 붙인다
//
// 쓰는 법
//   node hankki/scripts/yt.mjs video <id,id,…>                       # 제목·채널·설명란·조회수 (1단위/번)
//   node hankki/scripts/yt.mjs search "<검색어>" [--after 2026-04-28] [--n 10]   # 조회수 순 (검색 1번 + 영상정보 1단위)
//   node hankki/scripts/yt.mjs usage                                  # 오늘 쓴 양
//
// 🛡 짝 장치 = .claude/hooks/yt-guard.sh — 이 파일을 «안 거치고» youtube/v3 를 부르면 막는다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 장부경로 = join(dirname(fileURLToPath(import.meta.url)), '../docs/유튜브-사용량.json')
const 상한 = { search: 100, other: 10000 }
const 멈춤 = { search: 50, other: 5000 }   // 절반에서 멈춘다(돈이 나가는지 모르니까)

// 할당량이 다시 차는 날 = 미국 서부(America/Los_Angeles) 날짜
const 오늘PT = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
const 장부 = () => { try { return JSON.parse(readFileSync(장부경로, 'utf8')) } catch { return {} } }
const 오늘값 = (j) => j[오늘PT()] || { search: 0, other: 0, 기록: [] }

function 쓰기(종류, 단위, 무엇) {
  const j = 장부(); const d = 오늘값(j)
  d[종류] += 단위
  d.기록.push(`${new Date().toISOString().slice(11, 16)}Z ${종류}+${단위} ${무엇}`.slice(0, 120))
  j[오늘PT()] = d
  writeFileSync(장부경로, JSON.stringify(j, null, 1) + '\n')
  return d
}
function 찍기(d) {
  console.error(`💰 오늘(PT ${오늘PT()}) 유튜브 사용량 = 검색 ${d.search}/${상한.search} · 그 밖 ${d.other}/${상한.other}단위` +
    `  (스스로 멈추는 선 = 검색 ${멈춤.search} · 그 밖 ${멈춤.other})`)
}
function 미리막기(종류, 단위) {
  const d = 오늘값(장부())
  if (d[종류] + 단위 > 멈춤[종류]) {
    찍기(d)
    console.error(`⛔ 멈춘다 — 이 호출로 «절반 선»을 넘는다. 창업자에게 알리고 내일(PT 자정 뒤) 다시 한다.`)
    process.exit(2)
  }
}
// ⚠️ node 의 fetch 는 HTTPS_PROXY 를 안 따라가서 Network secrets 키가 안 붙는다(2026-10-28 실측 = 403 unregistered callers)
//    → curl 로 부른다(curl 은 프록시를 거쳐 키가 붙는다 · 같은 날 실측 200)
async function 부르기(경로) {
  const { execFileSync } = await import('node:child_process')
  const 글 = execFileSync('curl', ['-s', '-m', '20', `https://www.googleapis.com/youtube/v3/${경로}`], { encoding: 'utf8', maxBuffer: 20e6 })
  const j = JSON.parse(글)
  if (j.error) { console.error(`⛔ 유튜브 오류 ${j.error.code}: ${j.error.message}`); process.exit(1) }
  return j
}

const [, , 명령, 인자, ...나머지] = process.argv
const 옵션 = (k, 기본) => { const i = 나머지.indexOf(k); return i >= 0 ? 나머지[i + 1] : 기본 }

if (명령 === 'usage') { 찍기(오늘값(장부())); process.exit(0) }

if (명령 === 'video') {
  const ids = String(인자 || '').split(',').filter(Boolean)
  if (!ids.length) { console.error('쓰는 법: yt.mjs video <id,id>'); process.exit(1) }
  미리막기('other', 1)
  const j = await 부르기(`videos?part=snippet,statistics&id=${ids.join(',')}`)
  찍기(쓰기('other', 1, `videos ${ids.join(',')}`))
  console.log(JSON.stringify(j.items.map((v) => ({ id: v.id, 제목: v.snippet.title, 채널: v.snippet.channelTitle,
    올린날: v.snippet.publishedAt.slice(0, 10), 조회수: Number(v.statistics?.viewCount || 0), 설명란: v.snippet.description })), null, 1))
  process.exit(0)
}

if (명령 === 'search') {
  const q = 인자; const n = Math.min(50, Number(옵션('--n', 10))); const after = 옵션('--after', '')
  if (!q) { console.error('쓰는 법: yt.mjs search "<검색어>" [--after YYYY-MM-DD] [--n 10]'); process.exit(1) }
  미리막기('search', 1); 미리막기('other', 1)
  const p = new URLSearchParams({ part: 'id', q, type: 'video', order: 'viewCount', regionCode: 'KR', relevanceLanguage: 'ko', maxResults: String(n) })
  if (after) p.set('publishedAfter', `${after}T00:00:00Z`)
  const s = await 부르기(`search?${p}`)
  쓰기('search', 1, `search ${q} ${after}`)
  const ids = s.items.map((i) => i.id.videoId).join(',')
  const v = ids ? await 부르기(`videos?part=snippet,statistics&id=${ids}`) : { items: [] }
  찍기(쓰기('other', ids ? 1 : 0, `videos(검색 결과 ${s.items.length})`))
  const 결과 = v.items.map((x) => ({ id: x.id, 제목: x.snippet.title, 채널: x.snippet.channelTitle, 올린날: x.snippet.publishedAt.slice(0, 10),
    조회수: Number(x.statistics?.viewCount || 0), 분량있음: /\d+\s*(g|ml|큰술|작은술|스푼|숟갈|T|컵|개|대)/.test(x.snippet.description) }))
    .sort((a, b) => b.조회수 - a.조회수)
  console.log(JSON.stringify(결과, null, 1))
  process.exit(0)
}

console.error('쓰는 법: yt.mjs video <id> · search "<검색어>" [--after] [--n] · usage'); process.exit(1)
