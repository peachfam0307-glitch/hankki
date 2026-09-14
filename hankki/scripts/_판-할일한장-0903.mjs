// 🗒 **한끼 할 일 한 장** — 「끝난 것 ↔ 남은 것 ↔ 누구 몫」을 한 화면에 (2026-09-03)
//
// 📮 창업자 = *"복기 할일 정리하자. **너무 할일이 많고 끝낸거 해야할거 정리가 안되니까 정신이 없어**"*
//
// 🔎 **왜 정신없나 = 할 일이 «세 곳»에 흩어져 있다**(실측)
//    · `docs/할일앱-YYYY-MM-DD.md`(126줄 · 세대 2) · `docs/할일바깥-…`(130줄 · 세대 4)
//    · `HANDOVER.md` **3,443줄** 안에 「바로 다음 행동」 절이 **여섯 군데**
//    📌 「바로 다음 행동」이 여섯이면 그건 «없는 것»과 같다 — 매번 어느 게 진짜인지 골라야 한다.
//
// ⛔⛔ **손으로 적은 목록은 반드시 낡는다 — 오늘 그 실물이 나왔다.**
//    이 파일 첫 판에 「11월 카드 뼈대 — **배포 신호 대기**」라고 창업자 몫으로 적혀 있었다.
//    실제로는 **09-02 19:46 에 이미 나갔다**(`hold/갈라세기-0902` 가 배포 브랜치에 통째로 들어가 있고,
//    `merge-base --is-ancestor` ✅ · 그 가지에만 있는 커밋 0개 · 엽서/티켓 스킨이 `ShareDrawCard.jsx` 에 살아 있다).
//    ⛔ 하마터면 **7,524줄이 지워지는 낡은 가지를 다시 합칠 뻔했다.**
//    ✅ 그래서 **숫자는 «읽어서» 찍는다** — 앱 버전 · 오늘 커밋 · 검수 대기 편수는 전부 도구에서 가져온다.
//       사람 판단이 필요한 줄만 아래 `일감` 에 적는다.
//
// ⛔ 아티팩트로 올릴 것이라 `<!doctype>`·`<html>`·`<head>`·`<body>` 를 «쓰지 않는다».
// ⛔ 레시피 «내용»은 안 적는다 — 이 저장소는 공개다. **제목·편 수·갈래만.**
//
// 실행: node scripts/_판-할일한장-0903.mjs
//   → 낸 파일을 «이 주소로» 다시 올린다. ⛔새 주소를 만들지 않는다(창업자가 즐겨찾기에 둔다).
//   🔗 https://claude.ai/code/artifact/18670305-05a1-4103-9fac-21ecf2ef3427
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
// ⏰ 「오늘(KST)」은 «한 곳»에서만 만든다(절대원칙 27)
import { todayKST } from '../src/today.js'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 낼곳 = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/할일한장.html'

// ── 읽어 오는 값 ────────────────────────────────────────────
// 🔢 ⛔손으로 적지 않는다 — 적는 순간 낡는다(위 「11월 카드」 사고의 뿌리)
const 버전 = (readFileSync(join(뿌리, 'src/version.js'), 'utf8').match(/APP_VERSION = '([^']+)'/) || [])[1] || '?'

const 돌리기 = (명령, 인자) => {
  try { return execFileSync(명령, 인자, { cwd: 뿌리, encoding: 'utf8', timeout: 60000 }) } catch (e) { return String(e.stdout || '') }
}

// 오늘 커밋 = 「끝난 것」. ⛔기억으로 적지 않는다
const 오늘커밋 = 돌리기('git', ['log', '--since', `${todayKST()} 00:00`, '--date=format-local:%H:%M', '--pretty=%ad\t%h\t%s'])
  .split('\n').map((l) => l.split('\t')).filter((a) => a.length === 3 && !/^Merge /.test(a[2]))
  .map(([때, sha, 글]) => ({ 때, sha, 글 }))

// 검수 안 받았는데 «저절로» 열리는 것 (절대원칙 28)
const 검수대기 = 돌리기('node', ['scripts/release-calendar.mjs', '--pending'])
const 대기편수 = Number((검수대기.match(/(\d+)편 열린다/) || [])[1] || 0)
const 대기횟수 = Number((검수대기.match(/«앞으로» (\d+)번/) || [])[1] || 0)
const 첫날 = (검수대기.match(/^\s{3}(\d{4}-\d{2}-\d{2}) \(D-(\d+)\)/m) || []).slice(1)

// 내일 저절로 열리는 것
const 내일 = 돌리기('node', ['scripts/release-calendar.mjs', '--tomorrow'])
const 내일열림 = !/아무것도 안 열린다|열리는 것이 없다/.test(내일) && /열린다/.test(내일)

// 📄 대화 창이 자꾸 차던 뿌리 — 시작할 때마다 통째로 읽히는 두 파일의 «지금» 크기
const 잰다 = (경로) => { try { return readFileSync(경로, 'utf8') } catch { return '' } }
const 문서크기 = [join(뿌리, 'CLAUDE.md'), join(뿌리, '..', 'HANDOVER.md')].map((p) => {
  const 글 = 잰다(p)
  return { 줄: 글 ? 글.split('\n').length : 0, KB: Math.round(Buffer.byteLength(글) / 1024) }
})
const 시작읽기KB = 문서크기.reduce((a, b) => a + b.KB, 0)

// ── 사람 판단이 필요한 줄 (여기만 손으로) ────────────────────
// 🏷 급함 = now(오늘·내일) · soon(이번 주) · 없음 · done(끝)
const 일감 = {
  창업자: [
    ['📸', '콘솔 캡처 한 장', 'now',
      '「사용자 늘리기 → <b>기기 노출수</b>」를 눌러 <b>어디서 왔는지 쪼갠 화면</b>. 스토어 노출이 <b>+999%</b> 로 뛴 이유를 알면 <b>또 할 수 있어요.</b> 콘솔은 제가 못 봐요.'],
  ],
  확인만: [
    ['📱', '11월 카드 뼈대 — 이미 나갔어요', 'done',
      '창업자 몫으로 적혀 있었지만 <b>09-02 19:46 에 벌써 나갔어요.</b> 엽서·티켓 스킨이 앱에 살아 있어요. <b>제 목록이 낡았던 거예요</b> — 정신없던 이유의 실물입니다.'],
    ['🥄', '단위 통일 — 오늘 실물로 닫혔어요', 'done',
      '<b>「12T」→「12큰술」</b> 로 나온 걸 폰에서 확인했어요. 워커 붙여넣기까지 먹었다는 뜻이에요.'],
    ['🏷', '제목이 광고 문구로 들어오던 것 — 오늘 고쳤어요', 'done',
      '<b>「에뚜알퓨터 초특가로 진행 중이니」</b> 같은 줄은 건너뛰고 <b>다음 줄에서 요리 이름</b>을 찾아요. 끝내 못 찾으면 <b>「제목없음」</b>으로 저장돼요(창업자 확정).'],
    ['📄', '검수 41편 백업, 앱에 불러왔나요?', '',
      '보내드리기만 하고 <b>불러오셨는지는 확인 못 했어요.</b> 「줄어든 편 8」이 보이면 제대로 들어간 거예요.'],
  ],
  날짜: [
    ['🛒', '9/4 (내일) — 주부의 장바구니 3개 전날 검수판', 'now',
      '양념낙지젓 · 설성목장 한우 사골 곰탕 스틱 · 국내산 베이비 브로콜리 — <b>9/5 에 저절로 열려요</b>(절대원칙 28).'],
    ['🍳', '10월 안 — 검수 안 받은 레시피', '',
      '몰아서 미리 받아요. 전날에 몰리면 그날 밤이 급해져요.'],
    ['📰', '9/7 — 새 소식 2건', '', '안내 페이지와 실제 날짜 게이트가 같은지 확인 끝났어요.'],
  ],
  레시피: [
    ['🅱', '41편 채우기 — 오늘 시작한 것', 'soon',
      '㉠ 걸음은 있는데 <b>재료가 0</b> = 4편(제일 쌈) · ㉡ 재료는 있는데 <b>1~2걸음</b> = 31편 · ㉢ 둘 다 거의 없음 = 6편(<b>앱에 이미 좋은 판이 있나부터</b>).'],
    ['🅰', '32편', '', '거의 다 찬 편들. 마지막 손질만.'],
    ['🅲', '20편', '', '대부분 「양념 황금비율 메모」 — <b>어떻게 다룰지 창업자 판단이 필요해요.</b>'],
    ['🍖', '3차 검수판 (반찬·고기 11편)', '', '1차 소스·양념 12 · 2차 밥·국·면 11 은 끝났고 <b>이것만 안 만들었어요.</b>'],
  ],
  코드: [
    ['🐛', '분량이 통째로 사라지는 자리', 'soon',
      '「설탕 27」처럼 <b>단위 없는 숫자</b>가 붙으면 분량이 사라져요. 오늘 지나가다 찾았고 <b>제 되돌이가 아닌 걸</b> 확인했어요.'],
    ['🧭', '계기판 문구 흠', '',
      '장바구니 제품을 「<b>다시 보기로 한 것</b>」이라 불러요 — 안 봐도 그만인 것처럼 읽혀요. 안 보면 그대로 유저 앞에 나가는데요.'],
    ['📜', '붙여넣기로 담은 편은 원문이 맨 아래', '', '사진 있는 편은 9/2 에 고쳤고 <b>글자만 있는 편</b>이 남았어요.'],
    ['🗓', '오픈 요일 나누기', '', '월=레시피 / 수=제철 / 금=장바구니. 지금은 <b>월요일에 다 바뀌어요.</b>'],
    ['📦', 'AAB 20판', '', '구울 때 출시 노트를 <b>현행 문서에서 그대로 복사</b>해요 — 콘솔에서 새로 쓰지 않아요(거짓 한 줄의 뿌리였어요).'],
    ['🧾', '기본 인식 사용량 세기', '', '유료를 켤 때 가격·장수를 정할 근거예요.'],
  ],
  바깥: [
    ['📊', 'AI 표본 쌓기', '',
      '담을 때마다 <b>어느 모델이 몇 초 먹고 멈췄나</b>가 토스트 꼬리에 떠요. <b>몇 번 쌓이기 전엔 워커를 안 건드려요</b>(짐작으로 고치다 한 번 틀렸어요).'],
    ['🏪', '스토어 전환율', '',
      '노출 1,220 중 <b>한국이 15%</b>뿐이에요. 한국만 보면 설치율 약 10% — 나쁘지 않아요. <b>제목·설명은 안 뜯어고쳐요</b>(이미 닫은 결론).'],
  ],
  안함: [
    ['🔑', '열쇠 환급 수준', '창업자 보류 — <i>"고민좀해보자"</i>. 제가 먼저 안 꺼내요.'],
    ['💰', '꾸미기팩 가격', '창업자 보류 — <i>"좀더 고민해보다"</i>. 값은 990 그대로 박혀 있어요.'],
    ['🔁', '자동 받기 되살리기', '재현 전엔 금지. 9/1 밤에 <b>방금 담은 레시피를 덮은</b> 자리예요.'],
    ['🏠', '홈 「최근 저장」에서 임시보관함 빼기', '창업자 판정 = <i>"홈화면에 계속 표시되니까"</i>.'],
    ['🏷', '스토어 제목·설명 뜯어고치기', '반영에 7~9일 걸려 비교 대상이 사라져요. 이미 닫은 결론이에요.'],
  ],
}

// ── 그리기 ──────────────────────────────────────────────────
const 안전 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 칩 = (급함) => (급함 === 'now' ? '<span class="chip now">지금</span>'
  : 급함 === 'soon' ? '<span class="chip soon">이번 주</span>'
    : 급함 === 'done' ? '<span class="chip done">끝</span>' : '')

const 줄 = (a) => `<li><span class="ico">${a[0]}</span><div><p class="t">${a[1]}${칩(a[2])}</p><p class="d">${a[3]}</p></div></li>`
const 안함줄 = (a) => `<li><span class="ico">${a[0]}</span><div><p class="t">${a[1]}</p><p class="d">${a[2]}</p></div></li>`

const 남은수 = 일감.날짜.length + 일감.레시피.length + 일감.코드.length + 일감.바깥.length

const html = `<title>한끼 오늘 판</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
:root{
  --ground:#faf7f1; --card:#fffdf8; --ink:#3a2a1c; --sub:#7d6a58; --line:#e8ddcd;
  --brown:#5d3410; --blue:#4a6fa5; --sage:#5f8455; --flame:#c0522f; --gold:#b8862b;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#191512; --card:#221d18; --ink:#efe6d9; --sub:#a89680; --line:#362d24;
  --brown:#d9a86a; --blue:#8fb0d8; --sage:#93be86; --flame:#e8886a; --gold:#e0b45c;
}}
:root[data-theme="dark"]{
  --ground:#191512; --card:#221d18; --ink:#efe6d9; --sub:#a89680; --line:#362d24;
  --brown:#d9a86a; --blue:#8fb0d8; --sage:#93be86; --flame:#e8886a; --gold:#e0b45c;
}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);font-family:'Noto Sans KR',system-ui,sans-serif;
  font-size:16px;line-height:1.65;-webkit-text-size-adjust:100%}
.wrap{max-width:640px;margin:0 auto;padding:22px 16px 64px;display:flex;flex-direction:column;gap:22px}

header h1{font-family:'Gowun Dodum',serif;font-size:27px;line-height:1.3;margin:0 0 6px;
  color:var(--brown);text-wrap:balance}
header p{margin:0;color:var(--sub);font-size:14px}

.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.strip div{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px 8px;text-align:center}
.strip b{display:block;font-size:23px;font-family:'Gowun Dodum',serif;font-variant-numeric:tabular-nums;line-height:1.2}
.strip span{font-size:12px;color:var(--sub)}
.s1 b{color:var(--sage)} .s2 b{color:var(--flame)} .s3 b{color:var(--blue)}

section{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
section > h2{margin:0;padding:14px 16px 12px;font-family:'Gowun Dodum',serif;font-size:18px;
  border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
h2 em{font-style:normal;font-size:12.5px;color:var(--sub);font-family:'Noto Sans KR',sans-serif;font-weight:400}
.rail{border-left:4px solid var(--line)}
.r-you{border-left-color:var(--flame)} .r-date{border-left-color:var(--gold)}
.r-me{border-left-color:var(--blue)} .r-no{border-left-color:var(--line)} .r-ok{border-left-color:var(--sage)}

ul{list-style:none;margin:0;padding:6px 16px 14px}
li{display:flex;gap:11px;padding:11px 0;border-bottom:1px dashed var(--line)}
li:last-child{border-bottom:0}
.ico{font-size:19px;line-height:1.5;flex:0 0 24px;text-align:center}
.t{margin:0;font-weight:700;font-size:15.5px;line-height:1.45}
.d{margin:3px 0 0;font-size:14px;color:var(--sub);line-height:1.6}
.d b{color:var(--ink);font-weight:700}
code{font-size:12.5px;background:var(--ground);border:1px solid var(--line);border-radius:5px;padding:1px 5px}

.chip{display:inline-block;margin-left:7px;font-size:11.5px;font-weight:700;padding:1px 8px;
  border-radius:999px;vertical-align:2px;line-height:1.7}
.now{background:var(--flame);color:#fff} .soon{background:var(--gold);color:#241a0c}
.done{background:var(--sage);color:#fff}

details{border-top:1px solid var(--line)}
summary{padding:13px 16px;cursor:pointer;font-size:14.5px;color:var(--sub);font-weight:500}
summary::marker{color:var(--sub)}
details ul{padding-top:0}
.log{padding:2px 16px 14px;margin:0;list-style:none}
.log li{display:grid;grid-template-columns:46px 1fr;gap:10px;padding:7px 0;font-size:14px;border-bottom:0}
.log time{color:var(--sub);font-variant-numeric:tabular-nums;font-size:13px}

.note{font-size:13.5px;color:var(--sub);line-height:1.7;padding:0 2px;margin:0}
.note b{color:var(--ink)}
.note + .note{margin-top:-10px}
footer{font-size:12.5px;color:var(--sub);text-align:center;padding-top:6px}
</style>

<div class="wrap">
  <header>
    <h1>오늘 뭐가 끝났고<br>뭐가 남았나</h1>
    <p>${todayKST()} · 앱 ${버전} · 이 판은 <b>돌릴 때마다 다시 셉니다</b></p>
  </header>

  <div class="strip">
    <div class="s1"><b>${오늘커밋.length}</b><span>오늘 끝낸 것</span></div>
    <div class="s2"><b>${일감.창업자.length}</b><span>창업자 몫</span></div>
    <div class="s3"><b>${남은수}</b><span>제 몫</span></div>
  </div>

  <p class="note">📌 <b>왜 정신없었나</b> — 할 일이 세 곳에 흩어져 있었어요.
  <code>할일앱</code>·<code>할일바깥</code> 두 문서에 <b>세대가 6개</b> 쌓였고,
  인수인계 파일 3,443줄 안에 <b>「바로 다음 행동」 절이 여섯 군데</b>였어요.
  여섯이면 그건 <b>없는 것과 같아요</b> — 매번 어느 게 진짜인지 골라야 하니까요.</p>

  <p class="note">🪟 <b>대화 창이 자꾸 차던 것도 같은 뿌리예요</b> —
  대화를 열 때마다 <code>CLAUDE.md</code>(${문서크기[0].KB}KB)와
  <code>HANDOVER.md</code>(${문서크기[1].KB}KB), 합쳐서 <b>${시작읽기KB}KB</b> 가 통째로 읽혀요.
  그래서 <b>지우고 새로 시작해도 금방 다시 차요.</b> 창업자 잘못이 아니에요 — 제가 파일을 계속 키운 탓이에요.
  <b>지금 옆 세션이 줄이는 중이에요.</b></p>

  <section class="rail r-you">
    <h2>🙋 창업자 몫 <em>이것만 해주시면 돼요</em></h2>
    <ul>${일감.창업자.map(줄).join('')}</ul>
  </section>

  <section class="rail r-ok">
    <h2>❓ 확인만 하면 되는 것 <em>손은 안 가요</em></h2>
    <ul>${일감.확인만.map(줄).join('')}</ul>
  </section>

  <section class="rail r-date">
    <h2>⏰ 날짜가 정한 것 <em>안 하면 그대로 유저 앞에 나가요</em></h2>
    <ul>${일감.날짜.map((a, i) => 줄(i === 1
      ? [a[0], `${a[1]} — ${대기편수}편`, a[2],
        `${대기횟수}번에 걸쳐 열려요. 제일 가까운 게 <b>${첫날[0] || '?'} (D-${첫날[1] || '?'})</b> 이라 급하진 않아요. ${a[3]}`]
      : a)).join('')}</ul>
  </section>

  <section class="rail r-me">
    <h2>🍚 레시피 <em>오늘 시작한 것</em></h2>
    <ul>${일감.레시피.map(줄).join('')}</ul>
  </section>

  <section class="rail r-me">
    <h2>🔧 코드 · 판</h2>
    <ul>${일감.코드.map(줄).join('')}</ul>
  </section>

  <section class="rail r-me">
    <h2>🏛 바깥 <em>구글·스토어·AI</em></h2>
    <ul>${일감.바깥.map(줄).join('')}</ul>
  </section>

  <section class="rail r-no">
    <h2>⛔ 지금은 안 하는 것 <em>정해둔 것이니 다시 안 꺼내요</em></h2>
    <ul>${일감.안함.map(안함줄).join('')}</ul>
  </section>

  <section class="rail r-ok">
    <h2>✅ 오늘 끝낸 것 <em>${오늘커밋.length}개</em></h2>
    <details><summary>하나씩 펼쳐 보기</summary>
      <ul class="log">${오늘커밋.map((c) => `<li><time>${안전(c.때)}</time><span>${안전(c.글)}</span></li>`).join('')}</ul>
    </details>
  </section>

  <footer>손으로 적은 목록은 낡습니다 · 숫자는 전부 도구에서 읽어 왔어요</footer>
</div>
`

writeFileSync(낼곳, html)
console.log(`✅ 냈다 → ${낼곳}`)
console.log(`   앱 ${버전} · 오늘 커밋 ${오늘커밋.length} · 검수 대기 ${대기편수}편(${대기횟수}번) · 첫날 ${첫날.join(' D-')}`)
console.log(`   내일 저절로 열리는 것 = ${내일열림 ? '있다' : '없다'}`)
console.log(`   시작할 때 읽히는 문서 = ${문서크기[0].줄}줄/${문서크기[0].KB}KB ＋ ${문서크기[1].줄}줄/${문서크기[1].KB}KB = ${시작읽기KB}KB`)
