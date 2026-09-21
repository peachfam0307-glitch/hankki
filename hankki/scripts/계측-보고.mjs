// 📊📊 «보고서를 손으로 쓰지 않는다» — 계측 보고 만들기 (2026-09-17)
//
// 📮 창업자 = *"매일 누적되어야 해"* · *"제대로 설계 다시 해"* · *"진짜 땜빵할 거야? 뿌리부터 제대로 재고 분석해"*
// 📮 창업자 = *"각 날짜에 도구가 비는 이유. 새로 도구 잰 날 다 기록해놔. 그래야 보고서만 보고도 다 알지"*
//
// ⛔⛔ 왜 만들었나 — 2026-09-17 에 내가 다섯 번 틀렸고 뿌리가 «하나»였다:
//    값이 Markdown «글»로만 있어서 ①옮기는 걸 잊어도 아무도 모르고(표가 사흘 멈췄다)
//    ②갈라 보려면 손으로 표를 다시 만들어야 하고 ③「몇 시 기준인지」·「그날 그 눈이 있었나」를
//    적을 칸이 없었다. 게다가 Markdown 표는 깨져도 «조용하다».
//
// 무엇을 하나 = docs/계측-일별-YYYY-MM.json 을 읽어 **보고서를 만든다.**
//    · 검산 — 화면+행동+기타 합 ≠ 개요 조회수면 «죽는다» (캡처가 잘린 것이다)
//    · 계측 연표 — `계측-잣대.mjs --전부` 를 «불러» 심은 날을 받아 날짜별로 묶는다 (⛔로직을 두 벌로 안 만든다)
//    · 날마다 — 그날 «새로 생긴 눈» ＋ 그날 «아직 없던 눈»을 도구가 스스로 적는다
//    · ⬜ = 그때 그 눈이 없었다 (⛔0 이 아니다)
//
// 쓰는 법:  node scripts/계측-보고.mjs --달 2026-09            # 보고서를 찍는다
//           node scripts/계측-보고.mjs --달 2026-09 --쓰기      # docs/유저보고서-2026-09.md 로 저장
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const 앱뿌리 = new URL('../', import.meta.url)
const git뿌리 = new URL('../../', import.meta.url).pathname
const a = process.argv.slice(2)
const 값 = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null }
const 죽는다 = (why) => { console.error(`\n⛔⛔ 계측 보고 — ${why}\n`); process.exit(1) }

const 달 = 값('--달')
if (!달 || !/^\d{4}-\d{2}$/.test(달)) 죽는다('--달 YYYY-MM 이 없다')

// ── 값 읽기
let 장부
try { 장부 = JSON.parse(readFileSync(new URL(`docs/계측-일별-${달}.json`, 앱뿌리), 'utf8')) }
catch (e) { 죽는다(`docs/계측-일별-${달}.json 을 못 읽었다 — ${e.message}`) }
const 날들 = Object.keys(장부.날).sort()
if (날들.length === 0) 죽는다('날이 하나도 없다')

// ── 검산 (⛔여기서 죽어야 캡처가 잘린 걸 안다)
const 칸합 = (v) => ['화면', '행동', '기타'].reduce((s, k) => s + Object.values(v[k] || {}).reduce((t, x) => t + (x[0] || 0), 0), 0)
for (const d of 날들) {
  const v = 장부.날[d]
  if (!v.검산) 죽는다(`${d} 에 검산 칸이 없다`)
  const s = 칸합(v)
  if (s !== v.검산.개요조회) 죽는다(`${d} 검산이 안 맞는다 — 칸 합 ${s} ≠ 개요 조회수 ${v.검산.개요조회}. 캡처가 잘렸을 수 있다`)
}

// ── 심은 날 — ⛔여기서 다시 세지 않는다. 계측-잣대를 «불러» 받는다 (로직 두 벌 금지)
const 마지막 = 날들[날들.length - 1]
let 심은날 = {}
// ⛔⛔ [2026-09-19 고침] **나가는 값(exit code)이 아니라 «찍힌 글»을 본다.**
//    실측 = 오늘 식비 눈 넷이 20:36 에 심겼다 → 잣대가 「공통 구간이 없다」며 exit 2 로 나갔고,
//    그 순간 **보고서가 통째로 멎었다**(장부는 멀쩡한데 한 줄도 안 나왔다).
//    까닭 = 잣대의 exit 2 는 「비율을 견줄 수 없다」는 뜻이지 「심은 날을 모른다」가 아니다 — 목록은 다 찍혀 있었다.
//    ✅ 그래서 실패해도 stdout 을 받아 읽고, **한 줄도 못 읽었을 때만** 죽는다.
//    📌 새 눈을 심은 날마다 이 일이 난다 — 앞으로 계속 날 일이었다.
let 잣대글 = ''
try {
  잣대글 = execSync(`node hankki/scripts/계측-잣대.mjs --부터 ${달}-01 --까지 ${마지막} --전부`,
    { cwd: git뿌리, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
} catch (e) { 잣대글 = (e.stdout || '').toString() }   // ⛔ 죽지 않는다 — 글을 먼저 본다
for (const l of 잣대글.split('\n')) {
  const m = l.match(/^\s{3}(\S+)\s+심은 날 (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/)
  if (m) 심은날[m[1]] = `${m[2]} ${m[3]}`
}
if (Object.keys(심은날).length === 0) 죽는다('심은 날을 하나도 못 받았다')

// 🔎 이름 → 심은 날. 정확한 이름이 없으면 «묶음 접두»로 찾는다 (buy_pick_detail → buy_)
const 심은날찾기 = (이름) => {
  if (심은날[이름]) return 심은날[이름]
  const 접두 = Object.keys(심은날).filter((k) => k.endsWith('_') && 이름.startsWith(k))
  if (접두.length === 0) return null
  return 접두.sort((x, y) => y.length - x.length).map((k) => 심은날[k]).sort()[0]
}

// ⛔⛔ [2026-09-17] **실물이 도구를 이긴다.**
//    잣대의 「심은 날」은 «늦게» 나올 수 있다 — 코드를 다시 쓰면 git log -S 가 그 날을 잡는다.
//    실측 = `buy_pick_detail` 은 2026-09-10 15:59(ccd92914f)에 심겼는데 잣대는 09-12 15:09 로 읽었다.
//    ⛔ 그대로 두면 09-11 의 «진짜 값 2명»을 ⬜(눈이 없었다)로 지워 버린다. 그게 제일 나쁜 실패다.
//    ✅ 그래서 **값이 있으면 언제나 값을 찍고**, 심은 날이 그보다 늦으면 ⚠️ 로 «도구를 의심»한다.
const 의심 = []
const 있었나 = (이름, 날, 값있나) => {
  const s = 심은날찾기(이름)
  if (!s) return null                       // 모르는 이름 — 값이 있으면 그대로 찍는다
  const 심 = s.slice(0, 10)
  if (심 > 날) {
    if (값있나) { 의심.push(`${이름칸(이름)} — ${날} 에 숫자가 있는데 「세기 시작한 날」은 ${s} 로 적혀 있다`); return 'doubt' }
    return false
  }
  return 심 === 날 ? 'part' : true
}

// ── 찍기
const L = []
const P = (s = '') => L.push(s)
const 초 = (n) => n == null ? '—' : n >= 60 ? `${Math.floor(n / 60)}분 ${n % 60}초` : `${n}초`
const N = (x) => x == null ? '모름' : x

P(`# 📊 유저 보고서 ${달} — ⛔이 문서는 «만들어진다». 손으로 고치지 않는다`)
P()
P(`> 🔧 만든 명령 = \`node hankki/scripts/계측-보고.mjs --달 ${달} --쓰기\``)
P(`> 📒 값이 있는 곳 = \`docs/계측-일별-${달}.json\` — **캡처를 받으면 거기 넣고 이걸 다시 돌린다.**`)
P(`> ✔️ 검산 = ${날들.length}일 전부 통과 (화면＋행동＋기타 합 = 개요 조회수)`)
P(`> ⬜ = **그날은 아직 그걸 «세지 않고» 있었다** (⛔0 명이 아니다) · 🌱 = 그날부터 세기 시작했다 · ⚠️ = 숫자는 있는데 「세기 시작한 날」이 더 늦게 적혀 있다(도구를 의심한다)`)
P()
const 의심자리 = L.length
P()

// ── 📌 판단 — ⛔여기 손으로 쓰지 않는다. docs/계측-판단-YYYY-MM.md 를 «읽어» 붙인다.
//    왜 갈랐나 = 판단을 «생성 문서 안»에 쓰면 다음 생성 때 통째로 지워진다(2026-09-17 에 실제로 다섯 절이 사라졌다).
//    반대로 손으로 남겨두면 값이 새로 와도 낡은 채 버틴다(그날 취소한 「자랑 나흘 0」이 그대로 있었다).
//    ✅ 그래서 판단은 딴 파일에 두고, **낡으면 여기서 경보를 찍는다.**
let 판단글 = null, 판단날 = null
try {
  판단글 = readFileSync(new URL(`docs/계측-판단-${달}.md`, 앱뿌리), 'utf8')
  const m = 판단글.match(/^갱신일:\s*(\d{4}-\d{2}-\d{2})/)
  if (!m) 죽는다(`docs/계측-판단-${달}.md 첫 줄이 「갱신일: YYYY-MM-DD」 가 아니다 — 낡았는지 잴 수가 없다`)
  판단날 = m[1]
  판단글 = 판단글.slice(m[0].length).trim()
} catch (e) {
  if (판단날 === null && !/ENOENT/.test(e.message || '')) throw e
}
if (!판단글) {
  P(`> ⛔⛔ **판단이 없다** — \`docs/계측-판단-${달}.md\` 를 만들어라. 지금 이 문서는 «값만» 있다.`)
  P()
} else {
  if (판단날 < 마지막) {
    P(`> 🔴🔴 **판단이 낡았다** — 값은 **${마지막}** 까지인데 판단은 **${판단날}** 에 멈췄다.`)
    P(`> 　 \`docs/계측-판단-${달}.md\` 를 고치고 갱신일을 올린 뒤 이 명령을 다시 돌린다.`)
    P()
  }
  P(`# 🧭 판단 (갱신 ${판단날}) — ⛔값이 아니라 «사람이 쓴 것»이다`)
  P()
  P(`> ✍️ 여기를 고치려면 \`docs/계측-판단-${달}.md\` 를 고친다. **이 아래 값 표는 도구가 만든다.**`)
  P()
  P(판단글)
  P()
  P(`---`)
  P()
}

// §1 계측 연표
P(`## §1 🌱 «무엇을 언제부터 세기 시작했나»`)
P()
P(`> 📮 창업자 = *"각 날짜에 도구가 비는 이유. 새로 도구 잰 날 다 기록해놔. 그래야 보고서만 보고도 다 알지"*`)
P(`> ⛔ **이 표를 보기 전에 「0」·「며칠 내리 0」을 말하지 않는다.**`)
P()
const 묶음 = {}
for (const [이름, when] of Object.entries(심은날)) (묶음[when] ||= []).push(이름)
P(`| 세기 시작한 때 (한국시간) | 그날부터 세기 시작한 것 | 몇 개 |`)
P(`|---|---|---:|`)
for (const when of Object.keys(묶음).sort()) {
  const 목 = 묶음[when].sort()
  P(`| **${when}** | ${목.map((x) => `\`${x}\``).join(' · ')} | ${목.length} |`)
}
P()
P(`🔢 **세고 있는 것이 모두 ${Object.keys(심은날).length}가지** · 제일 오래 센 것도 **${Math.round((Date.parse(마지막) - Date.parse(Object.keys(묶음).sort()[0].slice(0, 10))) / 86400000)}일**뿐이다.`)
P()

// §2 누적 — 사람
P(`## §2 🔢 날마다 (누적 · 아래로 쌓인다)`)
P()
// ⭐⭐ [창업자 2026-09-20 *"안내페이지를 그럼 체크할 필요가 있나;; 의미없는 숫자인데"*]
//    GA4 「활성/새 사용자」에는 «앱에 안 들어온 사람»(「한끼 받기」 안내 페이지 방문자)이 섞인다 → **앱 안 숫자를 따로 세워 둔다.**
//    ⛔ 안내 페이지 숫자를 «버리지는» 않는다 — 광고가 일하는지 재는 자리는 거기뿐이다(§5 경로에 그대로 남는다).
const 앱홈 = (v) => (v.화면 || {}).home?.[1] ?? null
const 앱첫 = (v) => (v.행동 || {}).first_open?.[1] ?? null
const 로그인한사람 = (v) => {
  const h = v.행동 || {}
  const 칸 = Object.keys(h).filter((k) => /^(signup|login)_/.test(k))
  if (!칸.length) return null
  return 칸.reduce((s, k) => s + (h[k]?.[1] || 0), 0)   // ⚠️ 한 사람이 둘에 걸리면 겹쳐 셀 수 있다 — 대략치로만 읽는다
}
P(`| 날짜 | 활성<br>(안내 페이지 포함) | 새 사용자<br>(안내 페이지 포함) | ⭐앱 홈을<br>연 사람 | ⭐앱을<br>처음 켬 | ⭐로그인·가입<br>한 사람 | 로그인 누적 | 평균 참여 | 조회 | 캡처 |`)
P(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---|`)
for (const d of 날들) {
  const v = 장부.날[d], o = v.개요 || {}
  const 로 = v.로그인누적 ? `**${v.로그인누적.진짜}** (${v.로그인누적.원값}−${v.로그인누적.뺀수})` : '모름'
  P(`| ${d.slice(5)} | ${N(o.활성)} | ${N(o.새)} | **${N(앱홈(v))}** | **${N(앱첫(v))}** | **${N(로그인한사람(v))}** | ${로} | ${초(o.참여초)} | ${N(o.조회)} | ${v.미완사유 ? '⚠️미완' : '✅'} |`)
}
P()
for (const d of 날들) if (장부.날[d].미완사유) P(`⚠️ **${d}** — ${장부.날[d].미완사유}`)
P()

// §2.5 갤럭시 · 아이폰 — 창업자 2026-09-21 *"갤. 아이폰 사용자참여도 추이랑 로그인 … 빠짐없이 기록"*
//   값 = GA4 「사용자 → 기술 → 운영체제」 표(Android / iOS / 그 밖) ＋ Firebase 「로그인오늘.갈래」(google / apple).
//   ⛔ Android·iOS 에도 「한끼 받기」 안내 페이지 방문자가 섞인다(9/21 배포 전까지) — 앱 «안» 숫자는 §5 경로(/hankki/app · /hankki/ios)로 본다.
//   ⛔ 값이 없는 날은 「모름」이지 0 이 아니다. 캡처를 안 받은 것이다.
P(`## §2.5 📱 갤럭시(Android) · 아이폰(iOS) — 날마다`)
P()
P(`> 왼쪽 = GA4 운영체제 표 · 오른쪽 = 앱 «안» 경로(안내 페이지 뺀 값) · 로그인 갈래 = Firebase 새로 든 계정(구글 / 애플)`)
P()
P(`| 날짜 | 🤖 활성 | 🤖 새 | 🤖 참여 | 🍎 활성 | 🍎 새 | 🍎 참여 | 앱 안 🤖<br>\`/hankki/app\` | 앱 안 🍎<br>\`/hankki/ios\` | 로그인 구글 | 로그인 애플 |`)
P(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`)
let 운영체제있음 = false
for (const d of 날들) {
  const v = 장부.날[d], os = v.운영체제 || {}
  const A = os.Android || {}, I = os.iOS || {}
  if (v.운영체제) 운영체제있음 = true
  const 경 = v.경로 || {}
  const 앱안 = (k) => 경[k] ? `${경[k][1]}명·${초(경[k][2])}` : '모름'
  const 갈래 = (v.로그인오늘 && v.로그인오늘.갈래) || {}
  P(`| ${d.slice(5)} | ${N(A.활성)} | ${N(A.새)} | ${초(A.참여초)} | ${N(I.활성)} | ${N(I.새)} | ${초(I.참여초)} | ${앱안('/hankki/app')} | ${앱안('/hankki/ios')} | ${N(갈래.google)} | ${N(갈래.apple)} |`)
}
P()
if (!운영체제있음) P(`> ⬜ **운영체제 칸은 2026-09-21 부터 받는다** — 그 전 날짜는 「모름」(⛔0 이 아니다). 받는 곳 = GA4 보고서 → 사용자 → 기술 → 「운영체제」 표.`)
P()

// 🇰🇷🇰🇷 **이름표 — 창업자가 읽는 글자로** (창업자 2026-09-20 *"내가 알아볼수있게 한글로 바꿔서써. 레시피 로그 브릿지 그런거 뭔말인지 모르겠어"*)
//   ⭐ 탭 이름은 «앱에서 읽어온다»(`BottomNav.jsx`) — 손으로 적으면 탭 이름이 바뀔 때 낡는다(규칙 12).
//   ⛔ 사전에 «없는» 이름은 영어 그대로 두고 §끝에 「이름표 없는 것」으로 모아 찍는다 — 새 눈이 생겨도 조용히 영어로 남지 않게.
const 탭이름표 = (() => {
  try {
    const 글 = readFileSync(new URL('src/components/BottomNav.jsx', 앱뿌리), 'utf8')
    const 표 = {}
    for (const m of 글.matchAll(/\{\s*key:\s*'([a-z_]+)'\s*,\s*label:\s*'([^']+)'/g)) 표[m[1]] = m[2]
    return 표
  } catch { return {} }
})()
const 손이름표 = {
  // 화면 — 탭이 아닌 것만
  detail: '레시피 상세', editor: '레시피 편집', inbox: '받은 것', favorites: '최애', cook: '요리 모드',
  cooked: '만든 음식', diary: '일기 쓰기', search: '검색', profile: '설정', decor: '꾸미기 판',
  // 들어오는 길
  bridge: '「한끼 받기」 안내 페이지에 옴 (안드·PC)', bridge_go: '거기서 스토어로 감 (안드·PC)',
  bridge_ios: '「한끼 받기」에 옴 (아이폰)', bridge_go_ios: '거기서 앱스토어로 감 (아이폰)',
  first_open: '앱을 «처음» 켬', return_d1: '어제 왔던 사람이 또 옴', return_d2_7: '2~7일 만에 또 옴', return_d8plus: '8일 넘어 또 옴',
  // 꾸미기·자랑
  decor_saved: '꾸민 표지를 저장함', decor_have_1: '꾸민 표지 1개 가짐', decor_have_2_4: '꾸민 표지 2~4개 가짐',
  decor_have_5plus: '꾸민 표지 5개 넘게 가짐', brag_shared: '자랑 카드를 내보냄',
  // 레시피
  recipe_saved: '레시피를 저장함', import_read_ok: '사진·글에서 읽어냄', import_read_fail: '못 읽음',
  import_gallery: '가져오기 — 사진첩', import_photo: '가져오기 — 사진 찍기', import_share: '가져오기 — 공유받기',
  import_write: '가져오기 — 직접 씀', import_link: '가져오기 — 링크', import_text: '가져오기 — 글 붙여넣기',
  import_youtube: '가져오기 — 유튜브', import_instagram: '가져오기 — 인스타',
  // 요리·일기·냉장고
  cook_started: '요리를 시작함', cook_done: '요리를 끝냄', cook_long_detail: '레시피 상세에 오래 머묾',
  diary_new: '일기 한 장 씀', pantry_added: '냉장고에 재료 넣음', shop_added: '장보기에 담음',
  search_empty: '검색했는데 빈손', pick_open: '「이번 주 픽」 펼침',
  // 사러가기·로그인
  buy_cart: '사러가기 — 장보기에서', buy_pick_detail: '사러가기 — 레시피 상세에서', buy_pick_shop: '사러가기 — 주부의 장바구니에서',
  login_google: '구글로 로그인', login_apple: '애플로 로그인', signup_google: '구글로 «가입»', signup_apple: '애플로 «가입»',
  login_ok: '로그인 됨 (지금은 안 쓰는 옛 항목)',
  // 식비
  foodcost_open: '식비 화면을 엶', foodcost_added_shop: '식비 적음 — 장보기에서', foodcost_added_direct: '식비 적음 — 직접',
  foodcost_budget_set: '식비 예산을 정함',
  // 길
  '/hankki/': '웹 첫 화면', '/hankki/app': '앱 (안드로이드)', '/hankki/get.html': '「한끼 받기」 안내 페이지', '/hankki/ios': '아이폰 다리 화면',
}
const 이름표없는것 = new Set()
const 이름 = (k) => {
  if (/^foodcost_shop_open_/.test(k)) return `「가서 보고 올까요?」 가게 단추 — ${k.replace('foodcost_shop_open_', '')}`
  const v = 탭이름표[k] || 손이름표[k]
  if (v) return v
  if (/^[a-z][a-z0-9_/.]*$/i.test(k)) 이름표없는것.add(k)
  return k
}
/** 표에 찍는 꼴 = 「한글 이름 (영어)」 — 영어도 남긴다(콘솔에서 찾아야 하니까) */
const 이름칸 = (k) => { const v = 이름(k); return v === k ? `\`${k}\`` : `**${v}**<br>\`${k}\`` }

// §3 화면별 사람 수
const 화면목 = [...new Set(날들.flatMap((d) => Object.keys(장부.날[d].화면 || {})))]
  .sort((x, y) => 날들.reduce((s, d) => s + ((장부.날[d].화면 || {})[y]?.[1] || 0), 0) - 날들.reduce((s, d) => s + ((장부.날[d].화면 || {})[x]?.[1] || 0), 0))
P(`## §3 📺 화면마다 «몇 명이 열었나» (⛔누른 횟수가 아니라 사람 수다)`)
P()
P(`| 화면 | ${날들.map((d) => d.slice(5)).join(' | ')} |`)
P(`|---|${날들.map(() => '---:').join('|')}|`)
for (const s of 화면목) {
  P(`| ${이름칸(s)} | ${날들.map((d) => {
    const x = (장부.날[d].화면 || {})[s]
    const 이 = 있었나(s, d, !!x)
    if (!x) return 이 === false ? '⬜' : 이 === 'part' ? '🌱0' : '0'
    return 이 === 'part' ? `🌱${x[1]}` : 이 === 'doubt' ? `⚠️${x[1]}` : `${x[1] ?? '—'}`
  }).join(' | ')} |`)
}
P()

// §4 흐름 이벤트
const 행동목 = [...new Set(날들.flatMap((d) => Object.keys(장부.날[d].행동 || {})))].sort()
P(`## §4 🖐 앱에서 «무엇을 한 사람 수» — ⬜는 그날 아직 안 세던 것`)
P()
P(`| 무엇을 했나 | 세기 시작한 날 | ${날들.map((d) => d.slice(5)).join(' | ')} |`)
P(`|---|---|${날들.map(() => '---:').join('|')}|`)
for (const e of 행동목) {
  P(`| ${이름칸(e)} | ${심은날찾기(e) || '모름'} | ${날들.map((d) => {
    const x = (장부.날[d].행동 || {})[e]
    const 이 = 있었나(e, d, !!x)
    if (이 === false) return '⬜'
    if (!x) return 이 === 'part' ? '🌱0' : '0'
    return 이 === 'part' ? `🌱${x[1]}` : 이 === 'doubt' ? `⚠️${x[1]}` : `${x[1] ?? '—'}`
  }).join(' | ')} |`)
}
P()

// ⛔ 이름은 «실물»을 따른다 — 갈래를 이벤트 «이름 뒤»에 붙였다(stats.js:547~550, 2026-09-19 20:36).
//    그래서 갈래가 행동 칸에 그대로 들어간다 — 따로 가를 칸을 두지 않는다(두면 두 번 센다).
const 가게눈 = (d) => Object.keys(장부.날[d].행동 || {}).filter((k) => k.startsWith('foodcost_shop_open_'))
const 식비눈 = [...new Set(['foodcost_open', 'foodcost_added_shop', 'foodcost_added_direct', 'foodcost_budget_set',
  ...날들.flatMap((d) => 가게눈(d)).sort()])]
const 식비값 = (d, e) => (장부.날[d].행동 || {})[e]
const 사람 = (d, e) => 식비값(d, e)?.[1] ?? null
if (날들.some((d) => 식비눈.some((e) => 식비값(d, e)))) {
  P(`## §4.5 💰 식비 — 열어 보고 → 적고 → 가게로 나가기까지 몇 명이 남나`)
  P()
  P(`| 칸 | ${날들.map((d) => d.slice(5)).join(' | ')} |`)
  P(`|---|${날들.map(() => '---:').join('|')}|`)
  for (const e of 식비눈) {
    P(`| ${이름칸(e)} | ${날들.map((d) => {
      const x = 식비값(d, e), 이 = 있었나(e, d, !!x)
      if (이 === false) return '⬜'
      if (!x) return 이 === 'part' ? '🌱0' : '0'
      return 이 === 'part' ? `🌱${x[1]}` : 이 === 'doubt' ? `⚠️${x[1]}` : `${x[1] ?? '—'}`
    }).join(' | ')} |`)
  }
  P(`| **적은 비율** | ${날들.map((d) => {
    const 열 = 사람(d, 'foodcost_open')
    const 적들 = ['foodcost_added_shop', 'foodcost_added_direct'].map((e) => 사람(d, e)).filter((n) => n != null)
    if (열 == null || 열 === 0 || 적들.length === 0) return '—'
    // ⛔ 두 갈래의 «사람 수»를 더하면 둘 다 한 사람이 겹쳐 세질 수 있다 → 「이하」로 적는다(부풀리지 않는다).
    const 적 = 적들.reduce((s, n) => s + n, 0)
    return `≤${Math.round((적 / 열) * 100)}%${열 < 20 ? '⚠️' : ''}`
  }).join(' | ')} |`)
  P()
  P(`> 📌 숫자는 «연 사람 수»다. **적은 비율 = (\`_shop\`＋\`_direct\`) ÷ \`foodcost_open\`** — 열어는 봤는데 «안 적는» 사람을 잡는 칸이다.`)
  P(`> ⛔ **≤ 인 까닭** — 두 갈래를 다 한 사람이 한 번씩 세지니 더한 값은 «최대»다. 진짜는 그 이하다.`)
  P(`> ⛔ ⚠️ 가 붙은 날은 연 사람이 20명 아래다 — **비율을 믿지 않는다**(창업자 2026-09-19 *"20~30명 표본이면 볼 수 있어"*).`)
  P(`> 🙈 가게는 «이름»을 안 받는다 — 기본 목록은 \`cs_*\` 아이디, 유저가 더한 가게는 전부 \`custom\` 하나다(유저가 친 글자라서 · stats.js 규칙 ④).`)
  P()
}

// §5 날마다 상세 — 아래로 쌓는다 (규칙 12ⓐ: 도구는 맨 아래를 현행으로 읽는다)
P(`## §5 📅 날마다 상세 (⛔아래로 쌓는다 — 맨 아래가 제일 최근)`)
P()
for (const d of 날들) {
  const v = 장부.날[d]
  P(`#### ${d}${v.미완사유 ? ' ⚠️미완' : ''}`)   // ⛔#### 넷 — doc-guard 는 셋까지만 «세대»로 센다(오늘 latest-guard 가 이 문서 읽기를 막았다)
  const 새눈 = Object.entries(심은날).filter(([, w]) => w.slice(0, 10) === d).map(([n]) => n)
  if (새눈.length) P(`🌱 **이날부터 새로 세기 시작한 것 ${새눈.length}개** = ${새눈.sort().map((x) => `\`${x}\``).join(' · ')} — ⛔이날 값은 «하루치가 아니다».`)
  const 없던눈 = Object.entries(심은날).filter(([, w]) => w.slice(0, 10) > d).map(([n]) => n)
  if (없던눈.length) P(`⬜ **이날은 아직 안 세던 것 ${없던눈.length}개** = ${없던눈.sort().map((x) => `\`${x}\``).join(' · ')}`)
  if (v.캡처시각) P(`📸 캡처 ${v.캡처시각}${v.미완사유 ? ` — ${v.미완사유}` : ''}`)
  if (v.채널) P(`🚪 채널 = ${Object.entries(v.채널).map(([k, c]) => `**${k}** 총${c.총}·새${c.새}·재방문${c.재방문}·${초(c.참여초)}·이벤트${c.이벤트}`).join(' / ')}`)
  if (v.경로) P(`📱 경로 = ${Object.entries(v.경로).map(([k, x]) => `${이름(k)} ${x[0]}조회·${x[1]}명·${초(x[2])}`).join(' · ')}`)
  if (v.도시) P(`🗺 도시 = ${Object.entries(v.도시).map(([k, n]) => `${k} ${n}`).join(' · ')}`)
  if (v.이탈률) P(`📉 첫 화면만 보고 나간 비율 = ${Object.entries(v.이탈률).map(([k, n]) => `${이름(k)} ${n}%`).join(' · ')}`)
  if (v.첫사용자소스) P(`🔎 첫 사용자 소스 = ${Object.entries(v.첫사용자소스).map(([k, n]) => `${k} ${n}`).join(' · ')}`)
  for (const 고 of v.고침 || []) P(`⛔ **고침** — ${고}`)
  P()
}

// 🇰🇷 이름표가 «없는» 것을 모아 찍는다 — 새 눈이 생겨도 조용히 영어로 남지 않게 (창업자 2026-09-20)
if (이름표없는것.size) {
  P(`---`)
  P(`## 🇰🇷 아직 한글 이름표가 없는 것 ${이름표없는것.size}개`)
  P()
  P(`${[...이름표없는것].sort().map((x) => `\`${x}\``).join(' · ')}`)
  P()
  P(`👉 \`scripts/계측-보고.mjs\` 의 \`손이름표\` 에 한 줄 더한다. ⛔탭 이름은 적지 않는다 — \`BottomNav.jsx\` 에서 저절로 읽어온다.`)
  P()
}

P(`---`)
P(`⛔ **이 문서를 손으로 고치지 않는다.** 값은 \`docs/계측-일별-${달}.json\` 에 넣고 위 명령을 다시 돌린다.`)
P(`　 손으로 고치면 다음에 돌릴 때 그대로 지워진다.`)

// ⚠️ 「값은 있는데 심은 날이 더 늦다」 — 맨 위에 모아 박는다 (⛔조용히 넘기지 않는다)
if (의심.length) {
  const 줄 = ['> ⚠️⚠️ **「세기 시작한 날」이 이상한 곳 ' + [...new Set(의심)].length + '곳** — 그날 숫자는 있는데, 세기 시작한 날은 그보다 «뒤»로 적혀 있다.',
    '> 　 까닭 = 그 부분 코드를 나중에 다시 손대면 도구가 «다시 손댄 날»을 시작일로 읽는다. **숫자가 맞고 날짜가 틀린 것이니 숫자는 그대로 둔다.**']
  for (const m of [...new Set(의심)].slice(0, 8)) 줄.push('> 　 · ' + m.replace(/<br>/g, ' '))
  L.splice(의심자리, 0, ...줄)
}
const 글 = L.join('\n') + '\n'
if (a.includes('--쓰기')) {
  const 길 = new URL(`docs/유저보고서-${달}.md`, 앱뿌리)
  writeFileSync(길, 글)
  console.log(`✅ docs/유저보고서-${달}.md — ${글.length} B · ${날들.length}일 · 검산 전부 통과`)
} else console.log(글)
