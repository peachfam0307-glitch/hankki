// 📅 「언제 뭐가 나가나」 날짜별 일지 — 창업자용 (2026-08-11)
//
// 📮 창업자 *"언제 언제 나가게 되는지 날짜별 업데이트 일지 전체검수해서 보여줘"*
//
// ⛔⛔ 손으로 적지 않는다 — 손으로 적은 목록은 «반드시» 낡는다(2026-08-01 에 배운 것).
//    ⭐ 주간 레시피·잠금 해제 편수·스티커/카드 공개일은 전부 **코드에서 읽는다.**
//    ⚠️ 「손으로 할 일」(마감·검수)만 아래 표에 적는다 — 그건 코드에 없기 때문이다.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const 뿌리 = new URL('../', import.meta.url).pathname
const 오늘 = execSync("TZ='Asia/Seoul' date +%Y-%m-%d").toString().trim()

// ── ① 주간 레시피 (weekly.js) ──
const wk = readFileSync(`${뿌리}src/data/weekly.js`, 'utf8')
const WEEKLY = [...wk.slice(0, wk.indexOf('export const HOMEMADE')).matchAll(
  /from:\s*'([\d-]+)',\s*title:\s*'([^']+)'(?:,\s*kicker:\s*([A-Za-z_]+|'[^']+'))?[\s\S]{0,400}?ids:\s*\[([^\]]*)\]/g,
)].map((m) => ({
  날: m[1], 제목: m[2],
  이름표: !m[3] ? '이번 주 제철' : (m[3].startsWith("'") ? m[3].slice(1, -1) : '이번 주 특별한 한끼'),
  ids: [...m[4].matchAll(/'([^']+)'/g)].map((x) => x[1]),
}))
if (WEEKLY.length < 10) throw new Error(`⛔ 주간 레시피를 ${WEEKLY.length}줄밖에 못 읽었다 — weekly.js 모양이 바뀌었다`)

// ── ② 잠긴 레시피가 열리는 날 (basics.js) ──
const bs = readFileSync(`${뿌리}src/data/basics.js`, 'utf8')
const 잠금 = {}
for (const 덩 of bs.split(/\n  \{/)) {
  const f = 덩.match(/from:\s*'([\d-]+)'/); const t = 덩.match(/title:\s*'([^']+)'/)
  if (f && t) (잠금[f[1]] = 잠금[f[1]] || []).push(t[1])
}
if (!Object.keys(잠금).length) throw new Error('⛔ basics.js 의 `from` 을 하나도 못 읽었다')

// ── ②-b 우리집레시피 (HOMEMADE) — 창업자가 직접 쓴 레시피 줄 ──
const HOMEMADE = [...wk.slice(wk.indexOf('export const HOMEMADE')).matchAll(
  /from:\s*'([\d-]+)',\s*title:\s*'([^']+)'[\s\S]{0,400}?ids:\s*\[([^\]]*)\]/g,
)].map((m) => ({ 날: m[1], 제목: m[2], ids: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]) }))

// ── ②-c 🛒 주부의 장바구니 「이번 주 픽」 — 주차로 저절로 돈다. **앱과 같은 계산을 그대로 한다** ──
//    ⛔ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 연다 → 글자로 읽는다.
//       (`check-picks.mjs` 가 쓰는 방법 그대로다 — 새로 만들지 않는다)
const cur = readFileSync(`${뿌리}src/data/curation.js`, 'utf8')
const 제품 = [...cur.slice(cur.indexOf('export const CURATION'), cur.indexOf('export const PRODUCTS'))
  .matchAll(/\{\s*name:\s*'([^']+)'(?:\s*,\s*matches:\s*\[([^\]]*)\])?/g)]
  .map((m) => ({ name: m[1], matches: m[2] ? [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [] }))
if (제품.length < 20) throw new Error(`⛔ 큐레이션 제품을 ${제품.length}개밖에 못 읽었다 — curation.js 모양이 바뀌었다`)

// 레시피 id → 재료·메모 (basics.js)
const 재료표 = {}
for (const 덩 of bs.split(/\n  \{/)) {
  const id = 덩.match(/id:\s*'([^']+)'/)
  if (!id) continue
  const ing = [...(덩.match(/ingredients:\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1])
  const memo = 덩.match(/memo:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || ''
  재료표[id[1]] = [...ing, memo]
}

// ⭐ 앱의 `picksForIngredients` 를 그대로 옮긴다 — ⛔「낱말 «시작»」으로만 맞는다(노두유↔두유 사고).
const 맞는제품 = (줄들) => {
  const text = 줄들.join('  ')
  const tokens = 줄들.flatMap((i) => String(i).split(/[\s,()·/]+/)).filter(Boolean)
  const 시작으로 = (w) => tokens.some((t) => t.startsWith(w))
  const 직접 = [], 낱말 = []
  for (const p of 제품) {
    if (p.name && text.includes(p.name)) 직접.push(p)
    else if (p.matches.some((w) => w && 시작으로(w))) 낱말.push(p)
  }
  return [...직접, ...낱말]
}
// ⭐ `weeklypick.js` 의 규칙을 그대로 — 한 주에 n칸씩 민다(한 칸씩이면 4개 중 3개가 다음 주에도 남는다)
const 주차 = (ymd) => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 604800000)
const 이번주픽 = (날, ids, n = 4) => {
  const matched = 맞는제품(ids.flatMap((id) => 재료표[id] || []))
  const 담김 = new Set(matched.map((p) => p.name))
  const 나머지 = 제품.filter((p) => !담김.has(p.name))
  if (!나머지.length) return matched.slice(0, n)
  const off = ((((주차(날) * n) % 나머지.length) + 나머지.length) % 나머지.length)
  return [...matched, ...나머지.slice(off), ...나머지.slice(0, off)].slice(0, n)
}

// ⚠️⚠️ 주마다 픽을 미리 다 계산해 «앞 주와 겹치는지»까지 본다.
//    2026-08-11 에 이 표를 만들다가 **진짜 문제가 드러났다** — 창업자 *"주부장바구니픽도 매주 꼭 바꿔줘"* 인데
//    ⛔ `pickRotate` 는 matched(레시피가 쓰는 제품)를 «항상 앞»에 붙이고 n칸에서 자른다.
//       그래서 **matched 가 4개 이상인 주는 회전분이 한 칸도 안 들어간다.**
//    🔢 실측 = 8/03 ↔ 8/10 이 **4개 전부 같다** · 13주 통틀어 앞뒤 겹침 **26/48**.
//    📌 매칭되는 게 진간장·맛술·초피액젓·아우노슈가처럼 «거의 모든 레시피에 있는 양념»이라 매주 같은 넷이다.
const 픽표 = {}
{
  let 앞 = null
  for (const w of WEEKLY) {
    const 목록 = 이번주픽(w.날, w.ids)
    픽표[w.날] = { 목록, 겹침: 앞 ? 목록.filter((p) => 앞.includes(p.name)).map((p) => p.name) : [] }
    앞 = 목록.map((p) => p.name)
  }
}

// ── ③ 스티커·카드 자동 공개 (release-calendar 를 그대로 쓴다 — 두 벌 만들지 않는다) ──
const cal = execSync(`node ${뿌리}scripts/release-calendar.mjs`, { encoding: 'utf8' })
const 자동 = {}
let 현재 = null
for (const 줄 of cal.split('\n')) {
  const d = 줄.match(/^(\d{4}-\d{2}-\d{2})\s+D-/)
  if (d) { 현재 = d[1]; 자동[현재] = { 서랍: 0, 카드: 0, 볼것: [], 줄: [] }; continue }
  if (!현재 || !줄.trim()) continue
  const c = 줄.match(/—\s*(\d+)컷/)
  if (줄.includes('꾸미기 서랍')) { 자동[현재].서랍 += Number(c?.[1] || 0); 자동[현재].줄.push(줄.trim()) }
  else if (줄.includes('카드 뽑기')) { 자동[현재].카드 += Number(c?.[1] || 0); 자동[현재].줄.push(줄.trim()) }
  else if (줄.includes('같이 볼 것')) 자동[현재].볼것.push(줄.replace(/.*같이 볼 것\s*/, '').trim())
}

// ── ④ 손으로 해야 하는 것 — ⚠️ 코드에 없어서 «여기»에만 있다. 바뀌면 이 표를 고친다 ──
const 손 = [
  ['2026-08-13', 'AAB versionCode 13 굽고 올리기', '⛔BILLING 안 넣는다(재심사 전) · 트랙 = 「비공개 테스트-베타테스트」(Alpha 아님)', '창업자'],
  ['2026-08-15', '콘솔 「데이터 표」 다시 캡처', '재신청 답변에 그 숫자가 그대로 들어간다 · 「월간 재사용자」를 본다(7일 지연)', '창업자'],
  ['2026-08-16', '⭐프로덕션 재신청', '2026-08-02 반려 뒤 14일 · ⚠️날짜 말고 «콘솔이 표시하는 남은 일수»를 볼 것', '창업자'],
  ['2026-08-24', '9월 레시피 재고 채우기', '지금 11주치 있음 · 진짜 마감은 10/12', '클로드'],
  ['2026-08-31', '⛔9/1 공개분 78컷 고화질 전수 검수', '「자동 공개 전날 검수」 = 절대원칙', '둘 다'],
  ['2026-08-31', '⛔targetSdk 36 기한', '이미 36으로 맞춰 뒀다(2026-08-01 빌드 로그 실측) — 새 AAB 를 그 전에 올리면 끝', '창업자'],
  ['2026-09-30', '🚨Android 개발자 인증 등록', '⛔안 하면 Play 에서 앱이 삭제된다 · Play 로만 배포하면 «자동 등록»일 가능성이 크다 → 콘솔 첫 화면 캡처부터', '창업자'],
  ['2026-09-30', '핼러윈 효과 정하기', '안개 ↔ 등불(호박 불) 둘 중 하나', '둘 다'],
  ['2026-10-11', '⛔주간 레시피 11월치 다섯 주 채우기', '10/13 부터 남은 주가 2주 = 기준(3주) 밑 → 배포가 통째로 막힌다', '클로드'],
  ['2026-10-31', '11/1 공개분 43컷 검수', '전날 검수 절대원칙', '둘 다'],
  ['2026-11-01', '겨울·크리스마스 검수 넷', '82컷＋37컷 검수 · 한 팩 vs 두 팩 · 캐릭터 67컷 무료/유료 · 뾰미를 카드에서 뭘로 셀지', '둘 다'],
  ['2026-11-30', '12/1 공개분 검수', '크리스마스 카드 2컷', '둘 다'],
  ['2026-12-01', '🦊뾰미 데뷔', '겨울 캐릭터 12컷 — 아직 앱에 «안» 들어가 있다', '클로드'],
]

// ── 표 만들기 ──
const 날들 = [...new Set([...WEEKLY.map((w) => w.날), ...HOMEMADE.map((h) => h.날), ...Object.keys(잠금), ...Object.keys(자동), ...손.map((x) => x[0])])].sort()
const D = (d) => Math.round((new Date(d + 'T00:00:00+09:00') - new Date(오늘 + 'T00:00:00+09:00')) / 86400000)
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

let 칸 = ''
let 지난수 = 0, 앞수 = 0
for (const d of 날들) {
  const 지남 = D(d) < 0
  지남 ? 지난수++ : 앞수++
  const w = WEEKLY.find((x) => x.날 === d)
  const 새편 = 잠금[d] || []
  const a = 자동[d]
  const 할 = 손.filter((x) => x[0] === d)
  const 급 = 할.some((x) => /⛔|🚨|⭐/.test(x[1]))
  const 갈래 = 지남 ? 'past' : 할.length ? (급 ? 'urgent' : 'todo') : 'auto'
  // ⛔ `new Date(d+'T00:00:00+09:00').getUTCDay()` 는 **하루 앞선다** — KST 자정은 UTC 로 «전날 15시»다.
  //    2026-08-11 에 8/3(월요일)을 「(일)」로 찍었다. 요일은 **UTC 자정**으로 재야 달력과 같다.
  const 요일 = ['일', '월', '화', '수', '목', '금', '토'][new Date(d + 'T00:00:00Z').getUTCDay()]

  let 안 = ''
  if (w) {
    안 += `<div class="row"><span class="tag auto">저절로</span><div><b>홈 「이번 주」 박스</b>
      <div class="kick">${esc(w.이름표)}</div><div class="ttl">${esc(w.제목)}</div>
      <div class="sub">레시피 ${w.ids.length}편</div></div></div>`
  }
  if (새편.length) {
    안 += `<div class="row"><span class="tag auto">저절로</span><div><b>레시피 ${새편.length}편이 열린다</b>
      <div class="sub">${새편.map(esc).join(' · ')}</div></div></div>`
  }
  // 🛒 그 주에 장보기 「이번 주 픽」으로 뜰 제품 — 주차로 저절로 돈다
  if (w) {
    const { 목록: 픽, 겹침 } = 픽표[w.날]
    const 레시피것 = new Set(맞는제품(w.ids.flatMap((id) => 재료표[id] || [])).map((p) => p.name))
    안 += `<div class="row"><span class="tag ${겹침.length >= 3 ? 'urgent' : 'auto'}">${겹침.length >= 3 ? '⚠️같음' : '저절로'}</span><div><b>주부의 장바구니 「이번 주 픽」</b>
      <div class="sub">${픽.map((p) => (겹침.includes(p.name)
        ? `<span class="same">${esc(p.name)}</span>`
        : 레시피것.has(p.name) ? `<b class="lk">${esc(p.name)}</b>` : esc(p.name))).join(' · ')}</div>
      ${겹침.length ? `<div class="hint">⚠️ 지난주와 <b>똑같은 것 ${겹침.length}개</b></div>` : ''}</div></div>`
  }
  // 🍳 우리집레시피 — 창업자가 직접 쓴 레시피 줄
  const h = HOMEMADE.find((x) => x.날 === d)
  if (h) {
    const 있는것 = h.ids.filter((id) => 재료표[id])
    const 뜨나 = 있는것.length > 0
    안 += `<div class="row"><span class="tag ${뜨나 ? 'auto' : 'todo'}">${뜨나 ? '저절로' : '아직 안 뜸'}</span>
      <div><b>우리집레시피 — ${esc(h.제목)}</b>
      <div class="sub">${뜨나
        ? `창업자 레시피 ${있는것.length}편`
        : `창업자 레시피 ${h.ids.length}편이 여기 붙을 자리 — <b>아직 <code>basics.js</code> 에 안 들어가서 박스가 안 뜬다.</b> 36편 넣는 판에서 살아난다`}</div>
      <div class="hint">홈에서 「이번 주 제철」 <b>옆</b>의 다른 박스 · 이름표 = 「우리집레시피」</div></div></div>`
  }
  if (a && (a.서랍 || a.카드)) {
    안 += `<div class="row"><span class="tag auto">저절로</span><div><b>꾸미기·카드 ${a.서랍 + a.카드}컷</b>
      <div class="sub">${[a.서랍 && `꾸미기 서랍 ${a.서랍}컷`, a.카드 && `레꾸자랑 카드 ${a.카드}컷`].filter(Boolean).join(' · ')}</div>
      <details><summary>어느 탭에 뭐가</summary><ul>${a.줄.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details></div></div>`
  }
  if (a && a.볼것.length) {
    안 += a.볼것.map((v) => `<div class="row"><span class="tag todo">같이 볼 것</span><div>${esc(v)}</div></div>`).join('')
  }
  for (const [, 무엇, 왜, 누가] of 할) {
    안 += `<div class="row"><span class="tag ${/⛔|🚨|⭐/.test(무엇) ? 'urgent' : 'todo'}">손으로</span>
      <div><b>${esc(무엇)}</b><div class="sub">${esc(왜)}</div><div class="who">${esc(누가)}</div></div></div>`
  }

  칸 += `<article class="day ${갈래}" data-d="${d}">
    <div class="head"><time>${d.slice(0, 4) !== 오늘.slice(0, 4) ? `<i>${d.slice(0, 4)}년</i> ` : ''}${d.slice(5).replace('-', '월 ')}일 <em>(${요일})</em></time>
      <span class="dd">${지남 ? '지남' : D(d) === 0 ? '오늘' : `D-${D(d)}`}</span></div>
    ${안}</article>`
}

const html = `<title>한끼 — 날짜별 업데이트 일지</title>
<style>
:root{--bg:#F7F4EC;--card:#FFFDF8;--ink:#3A2A1C;--muted:#8A7660;--line:#E5DCCB;
 --auto:#5F7A5A;--auto-bg:#E9F0E6;--todo:#8A5A18;--todo-bg:#F6E7C9;--urgent:#A05A5A;--urgent-bg:#F4E6E3;
 --past:#B3A48F;--shadow:0 1px 2px rgba(58,42,28,.06),0 8px 22px rgba(58,42,28,.05)}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191510;--card:#231E17;--ink:#EFE6D8;--muted:#A5927A;--line:#392F23;
 --auto:#93B58B;--auto-bg:#22301F;--todo:#E7BF7A;--todo-bg:#3A2C13;--urgent:#D28E8E;--urgent-bg:#331E1E;--past:#6B5C49;
 --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 22px rgba(0,0,0,.3)}}
:root[data-theme="dark"]{--bg:#191510;--card:#231E17;--ink:#EFE6D8;--muted:#A5927A;--line:#392F23;
 --auto:#93B58B;--auto-bg:#22301F;--todo:#E7BF7A;--todo-bg:#3A2C13;--urgent:#D28E8E;--urgent-bg:#331E1E;--past:#6B5C49;
 --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 22px rgba(0,0,0,.3)}
*{box-sizing:border-box;word-break:keep-all;overflow-wrap:anywhere}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.62;-webkit-text-size-adjust:100%;
 font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:0 14px 64px}
header{padding:26px 0 6px}
.kicker{font-size:12px;letter-spacing:.15em;color:var(--muted);font-weight:800;margin:0 0 7px}
h1{margin:0 0 9px;font-size:25px;line-height:1.28;letter-spacing:-.02em}
.lead{margin:0;color:var(--muted);font-size:14.5px}
.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:17px 0 4px}
.sum div{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px;box-shadow:var(--shadow)}
.sum b{display:block;font-size:21px;font-variant-numeric:tabular-nums;line-height:1.1}
.sum span{font-size:11.5px;color:var(--muted)}
.legend{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0 20px}
.tag{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:7px;white-space:nowrap;flex:0 0 auto}
.tag.auto{color:var(--auto);background:var(--auto-bg)}
.tag.todo{color:var(--todo);background:var(--todo-bg)}
.tag.urgent{color:var(--urgent);background:var(--urgent-bg)}
.day{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--auto);
 border-radius:13px;padding:13px 14px;margin:0 0 11px;box-shadow:var(--shadow)}
.day.todo{border-left-color:var(--todo)} .day.urgent{border-left-color:var(--urgent)}
.day.past{border-left-color:var(--past);opacity:.55}
.head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 9px}
time{font-size:17px;font-weight:800;letter-spacing:-.01em}
time em{font-style:normal;font-weight:600;color:var(--muted);font-size:13px}
/* ⛔ 해가 바뀌면 「03월 01일」이 올해로 읽힌다 — 연도를 앞에 붙여 못 박는다 */
time i{font-style:normal;font-weight:800;font-size:13px;color:var(--urgent)}
.dd{font-size:12px;font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}
.row{display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-top:1px dashed var(--line)}
.row:first-of-type{border-top:0;padding-top:0}
.row>div{min-width:0;flex:1}
.row b{font-size:14.5px}
.kick{font-size:11.5px;font-weight:800;color:var(--auto);margin-top:3px}
.ttl{font-size:17px;font-weight:800;letter-spacing:-.01em}
.sub{font-size:12.8px;color:var(--muted);margin-top:2px}
.who{display:inline-block;margin-top:5px;font-size:11px;font-weight:800;color:var(--muted);
 border:1px solid var(--line);border-radius:6px;padding:1px 7px}
.hint{font-size:11.5px;color:var(--muted);opacity:.82;margin-top:3px}
.lk{color:var(--auto)}
.same{color:var(--urgent);text-decoration:line-through;text-decoration-color:var(--urgent);opacity:.85}
details{margin-top:6px} summary{font-size:12px;color:var(--muted);cursor:pointer}
details ul{margin:6px 0 0;padding-left:17px} details li{font-size:12px;color:var(--muted)}
.note{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:14px;margin:22px 0 0;
 font-size:13.2px;color:var(--muted);line-height:1.72;box-shadow:var(--shadow)}
.note b{color:var(--ink)}
</style>
<div class="wrap">
<header>
  <p class="kicker">한끼 · 2026-08-11 기준</p>
  <h1>언제 뭐가 나가나</h1>
  <p class="lead">코드에서 직접 읽어 만든 표야. <b>초록 = 내가 아무것도 안 해도 그날 저절로 열리는 것</b>,
  <b>주황·빨강 = 사람이 해야 하는 것.</b> 손으로 센 숫자는 하나도 없어.</p>
  <div class="sum">
    <div><b>${앞수}</b><span>앞으로 남은 날</span></div>
    <div><b>${WEEKLY.filter((w) => D(w.날) > 0).length}</b><span>남은 주간 레시피</span></div>
    <div><b>${손.filter((x) => D(x[0]) >= 0).length}</b><span>손으로 할 일</span></div>
  </div>
  <div class="legend">
    <span class="tag auto">저절로 열림</span>
    <span class="tag todo">손으로 · 여유 있음</span>
    <span class="tag urgent">손으로 · 놓치면 큰일</span>
  </div>
  <p class="lead" style="font-size:12.8px;margin:-8px 0 0">장바구니 픽 읽는 법 —
  <b class="lk">굵은 초록</b> = 그 주 레시피가 실제로 쓰는 제품이라 붙은 것 ·
  <span class="same">회색 취소선</span> = 지난주와 똑같은 것.</p>
</header>
${칸}
<div class="note">
  <b>⛔ 절대 놓치면 안 되는 셋</b><br>
  ① <b>8/16 프로덕션 재신청</b> — 8/02 반려 뒤 14일. 날짜가 아니라 <b>콘솔이 표시하는 남은 일수</b>를 본다.<br>
  ② <b>8/31 · 78컷 전날 검수</b> — 「자동 공개 전날에 고화질 전수 검수하고 내보낸다」는 절대원칙. 그날은 내가 아무것도 안 해도 열린다.<br>
  ③ <b>9/30 Android 개발자 인증</b> — 등록 안 된 Play 앱은 <b>삭제된다.</b> Play 로만 배포하면 자동 등록일 가능성이 크지만 <b>확인은 해야 한다.</b><br><br>
  <b>⏰ 조용히 다가오는 마감</b> — 주간 레시피 재고. 지금 11주치인데 <b>10/13 부터 3주 밑</b>이 되어 <b>배포 자체가 막힌다.</b>
  11월치 다섯 주를 <b>10/12 전에</b> 채워야 한다.<br><br>
  <b>이 표를 만들다 나온 것 — 장바구니 픽이 «매주 안 바뀐다»</b><br>
  네가 <b>"주부장바구니픽도 매주 꼭 바꿔줘"</b> 라고 했는데 실제로는
  <b>8/03 ↔ 8/10 이 네 개 전부 같고</b>, 13주 통틀어 앞뒤 주 겹침이 <b>26/48</b> 이야.<br>
  ⭐ 뿌리 = 「그 주 레시피가 쓰는 제품」을 <b>항상 앞에</b> 붙이고 4칸에서 자르는데,
  걸리는 게 <b>진간장·맛술·초피액젓·아우노슈가</b>처럼 거의 모든 레시피에 있는 양념이라
  <b>매주 같은 넷이 자리를 다 먹는다.</b> 회전분이 한 칸도 못 들어와.<br>
  ⛔ <b>아직 안 고쳤어</b> — 어떻게 고칠지는 네가 정할 문제라서(레시피와 이어진 걸 살릴지, 매주 새 걸 보여줄지).<br><br>
  <b>우리집레시피(네 레시피 36편)</b> — 자리는 만들어져 있는데 <b>아직 안 뜬다.</b>
  <code>basics.js</code> 에 36편이 안 들어가서 붙일 레시피가 없어. <b>날짜는 아직 안 정했다.</b><br><br>
  <b>📌 이 표에 «없는» 것</b> — 결제(#54)·구매 복원(#63)은 날짜가 안 정해졌다.
  창업자 확정 = <b>「8월엔 안 켠다 · 9월 유저 보고 정한다」.</b>
</div>
</div>
`
const out = `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/일지-날짜별.html`
writeFileSync(out, html)
console.log(`OK ${out}`)
console.log(`   날짜 ${날들.length}개 (지난 ${지난수} · 앞으로 ${앞수}) · 주간 레시피 ${WEEKLY.length}주 · 잠금 해제 ${Object.values(잠금).flat().length}편`)
console.log(`   자동 공개 ${Object.keys(자동).length}날 · 손으로 할 일 ${손.length}건`)
