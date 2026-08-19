// ✅✅ 「내 레시피 1·2차 — 전수검사판」 (2026-08-19)
//
// 📮 창업자 = *"1차 검수끝. 나가기전에 다 전수검사 할거야 저장해둬. 그냥 내보지말고."*
//    ＋ *"모든 레시피나 유료, 무료팩은 나가기전에 내가 전수검사해서 승인해야 내보낼 수 있어."*
//    ＋ *"해놓자 오늘 3개다."*
//
// ⭐⭐ **이 판이 보여주는 것 = 「네가 준 것 ↔ 내가 한 것」** 이다.
//    창업자가 판정할 것은 「예쁜가」가 아니라 **「내가 말한 대로 됐나」**다(36편 판에서 배운 것).
//    ⛔ 그래서 창업자 원문은 «한 글자도» 안 고치고 그대로 왼쪽에 둔다.
//
// 🔒 검수판 게이트 둘을 지킨다 (2026-08-18 창업자가 두 번 지적한 자리)
//    · `check-pancopy` = 「결과 복사」 ＋ 새로고침 뒤에도 남기기 ＋ 복사 실패 폴백
//    · `check-panmemo` = 고른 것을 «기억»한다(localStorage)
//    ⛔ 둘 다 **판이 «만들어내는» HTML 안**에 있어야 한다 — 도구 파일 주석에 있으면 안 센다.
//
// 쓰기: node scripts/_판-내레시피최종-0819.mjs <낼 HTML 경로>
// ⛔ 결과 HTML 은 scratchpad 에 만든다 — 저장소가 public 이라서.
import { writeFileSync } from 'node:fs'

const 낼곳 = process.argv[2]
if (!낼곳) { console.error('쓰기: node scripts/_판-내레시피최종-0819.mjs <낼 HTML>'); process.exit(1) }

// ─────────────────────────────────────────────────────────────────────────
// 📄 자료 — 창업자 검수 원문(왼쪽) ↔ 내가 반영한 결과(오른쪽)
//    ⛔ 원문은 `docs/_대기/내레시피-{1,2}차-창업자검수-*.md` 에 있는 그대로다.
const 편들 = [
  // ── 1차 (소스·양념) ──────────────────────────────────────────────
  { 차: 1, 원제목: '달래장', 새제목: '달래장', 자리: '2027-01-18',
    바뀜: ['제목 그대로 — 이미 요리 이름이다(씻고·껍질 벗기고·자르는 손질이 다 있다)'] },
  { 차: 1, 원제목: '막국수 양념', 새제목: '새콤달콤막국수', 자리: '2027-01-11',
    바뀜: ['제목 — 창업자 *"새콤달콤막국수로 할까."*', '⭐앱의 「들기름 막국수」와 갈린다(그건 들기름, 이건 빨간 양념)'] },
  { 차: 1, 원제목: '비빔밥 소스', 새제목: '비빔밥 소스', 자리: '2027-01-18',
    바뀜: ['제목 그대로 — 이미 쓰임새가 제목에 있다', '⭐**나물비빔밥·돌솥비빔밥에만** 연결(창업자 *"고추장베이스니까"*) ⛔마늘쫑 비빔밥 제외'] },
  { 차: 1, 원제목: '쯔유국수 소스', 새제목: '쯔유 메밀국수', 자리: '2027-01-11',
    바뀜: ['제목 — 원문에 *"메밀국수 삻아 시원하게 먹는다"* 가 이미 있어 «요리»로 바꿨다'] },
  { 차: 1, 원제목: '참깨 소스', 새제목: '⛔독립 편 안 만듦 → 샤브샤브 편 «안»으로', 자리: '—',
    바뀜: ['창업자 *"1번은 샤브샤브 레시피 안에 붙여(**메모말고 레시피쪽에**)"*',
      '✅ 이미 반영했다 — 샤브샤브 재료에 `[참깨 소스 — 골라 먹어요]` 절이 붙었다',
      '⭐ 양지수육엔 **이미** 같은 소스가 있었다(값까지 일치)', '시간·인분 = **5분 · 2인분**(창업자)'] },
  { 차: 1, 원제목: '파절이 소스', 새제목: '파절이', 자리: '2027-01-04',
    바뀜: ['제목 — 창업자가 판에서 직접 *"파절이로 바꾸고.(제목)"*'] },
  { 차: 1, 원제목: '비냉 양념장', 새제목: '고기를 곁들인 비빔냉면', 자리: '2027-01-18',
    바뀜: ['제목 — 창업자 안 *"고기를 곁들인 비빔냉면??"*',
      '⭐ 내 안(「대패삼겹 비빔냉면」)보다 이게 낫다 — 고기가 «곁들임»이라는 게 그대로 드러난다',
      '⛔ 원문에서 고기는 괄호 안 «선택»이다(*"대패삼겹살을 구워 함께 먹으면 꿀맛"*)'] },
  { 차: 1, 원제목: '마늘간장 계란장', 새제목: '마늘간장계란밥', 자리: '2026-12-28',
    바뀜: ['⛔ **이건 「계란장」이 아니었다** — 창업자 *"계란장은 뭐야??"* 가 잡았다',
      '백업 원본이 **만드는 법 0걸음 ＋ 재료 칸에 메모**(「팬 돌려가며 바삭하게」)였다',
      '제목 = 창업자 *"마늘간장계란밥하자."*',
      '계란 = *"푼거 아니고 그냥 깨서 부치는거야 반숙으로."*',
      '간장 = **팬 바닥에 둘러 지지듯이**(창업자 「b」)', '10분 · 1인분'] },
  { 차: 1, 원제목: '차돌된장', 새제목: '차돌된장', 자리: '2026-12-21',
    바뀜: ['국간장 1큰술 → **초피액젓**(창업자 *"국간장-초피로"*)', '꿀 0.5큰술 → **꿀 1작은술**(창업자)'] },
  { 차: 1, 원제목: '장조림', 새제목: '장조림', 자리: '2026-12-28',
    바뀜: ['제목·내용 그대로'] },
  { 차: 1, 원제목: '초무침 소스', 새제목: '⏸ 나중에', 자리: '—', 바뀜: ['창업자가 1차 때 「나중에」로 뺐다 — 다음 판에 다시 올린다'] },
  { 차: 1, 원제목: '마요간장 (웨지감자/샐러드 소스)', 새제목: '⏸ 나중에', 자리: '—', 바뀜: ['창업자가 1차 때 「나중에」로 뺐다'] },

  // ── 2차 (밥·국·면) ──────────────────────────────────────────────
  { 차: 2, 원제목: '갈비탕', 새제목: '갈비탕', 자리: '2026-12-14',
    바뀜: ['검수본에 **「물2l」**로 제대로 적혀 있다', '⛔ 1차 판의 「물 1큰술.5L」는 옛 흔적 — 고칠 코드 없다'] },
  { 차: 2, 원제목: '국물 닭볶음탕', 새제목: '국물 닭볶음탕', 자리: '2026-12-14', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '순두부찌개', 새제목: '순두부찌개', 자리: '2026-12-14', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '해물누룽지탕', 새제목: '해물누룽지탕', 자리: '2026-12-21', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '전복죽', 새제목: '전복죽', 자리: '2027-01-04', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '약밥', 새제목: '⏸ 나중에', 자리: '—', 바뀜: ['창업자가 「나중에」로 뺐다'] },
  { 차: 2, 원제목: '김치비빔국수', 새제목: '김치비빔국수', 자리: '2027-01-11', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '봉골레 파스타', 새제목: '⏸ 나중에', 자리: '—', 바뀜: ['창업자가 「나중에」로 뺐다'] },
  { 차: 2, 원제목: '오이샌드위치', 새제목: '오이샌드위치', 자리: '2027-01-04', 바뀜: ['그대로'] },
  { 차: 2, 원제목: '스키야키', 새제목: '스키야키', 자리: '2026-12-21',
    바뀜: ['재료 「버섯」 → **「표고버섯 등」**(창업자 *"스키야키에 버섯에 표고버섯등이라고 써줘."*)',
      '⭐ **고마다래 소스를 「편 참고」로 잇는다**(창업자 *"고마다래소스를 샤브샤브랑 스키야키에 넣고"* ＋ 「a로가자」)'] },
  { 차: 2, 원제목: '테리야끼 장어덮밥', 새제목: '데리야끼장어덮밥', 자리: '2026-12-28',
    바뀜: ['제목 — 창업자 *"데리야끼장어덮밥이야(제목변경)"*'] },
]

// 앱에 «이미» 반영한 것 (hold 브랜치)
const 이미한것 = [
  { 편: '샤브샤브', 무엇: '`[참깨 소스]` 재료로 직접 ＋ `[고마다래 소스]` 는 「편 참고」 ＋ 7걸음 문구를 「소스 세 가지 중 좋아하는 걸로」' },
  { 편: '고마다래 소스', 무엇: '메모에 **양배추 채 샐러드 · 스키야키** 추가 — 샤브샤브가 이 편을 부르므로 «양쪽»을 이었다' },
  { 편: '초간단 순살 갈비찜', 무엇: '메모에서 **에어프라이어 문장을 뺐다**(창업자 *"소갈비찜에 익힌고기를 그부분은 뺴는게 좋겠어."*) · 「냄비로 40분」은 남겼다' },
  { 편: '양지수육', 무엇: '⛔ **고칠 게 없었다** — 창업자가 준 소스 셋(참깨·간장·땅콩버터)이 «값까지» 전부 일치했다' },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>')

const 나감 = 편들.filter((p) => !p.새제목.startsWith('⏸') && !p.새제목.startsWith('⛔'))
const 미룸 = 편들.filter((p) => p.새제목.startsWith('⏸'))
const 안으로 = 편들.filter((p) => p.새제목.startsWith('⛔'))

const 카드 = (p, i) => `
    <article class="card" data-i="${i}">
      <header>
        <span class="tag t${p.차}">${p.차}차</span>
        <label class="pick">
          <input type="checkbox" class="ok" data-k="${esc(p.원제목)}">
          <span>확인함</span>
        </label>
      </header>
      <div class="names">
        <div class="was"><em>네가 준 이름</em>${esc(p.원제목)}</div>
        <div class="arrow">→</div>
        <div class="now"><em>내가 한 것</em>${esc(p.새제목)}</div>
      </div>
      ${p.자리 !== '—' ? `<div class="when"><em>열릴 날</em> ${esc(p.자리)}</div>` : ''}
      <ul class="diff">${p.바뀜.map((b) => `<li>${md(b)}</li>`).join('')}</ul>
      <label class="say">
        <span>고칠 게 있으면 여기</span>
        <textarea class="memo" data-k="${esc(p.원제목)}" rows="2" placeholder="예) 이 제목 말고 ○○로"></textarea>
      </label>
    </article>`

const HTML = `<title>내 레시피 전수검사</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{--paper:#FAF6EF;--card:#fff;--ink:#2E1C0C;--dim:#7A6852;--faint:#9C8B76;--line:#E7DCCB;--brand:#5D3410;--bg2:#F3E7D8;--ok:#1E7A5A;--okbg:#E9F4EF;--warn:#B4472F;--warnbg:#FBEAE5}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B}}
  :root[data-theme="dark"]{--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B}
  *{box-sizing:border-box}
  body{margin:0;padding:0 14px 120px;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif;line-height:1.6;-webkit-text-size-adjust:100%}
  .wrap{max-width:660px;margin:0 auto}
  header.top{padding:24px 0 6px}
  .kicker{margin:0;font-size:12.5px;font-weight:800;letter-spacing:.08em;color:var(--brand)}
  h1{margin:6px 0 8px;font-size:24px;line-height:1.3;letter-spacing:-.02em}
  .lead{margin:0;font-size:14.5px;color:var(--dim)}
  .lead b{color:var(--ink)}
  .how{margin:14px 0 0;padding:13px 15px;background:var(--bg2);border-radius:13px;font-size:14px;line-height:1.7}
  .how b{color:var(--brand)}
  h2{margin:26px 0 4px;font-size:16px;letter-spacing:-.01em}
  .sub{margin:0 0 10px;font-size:13.5px;color:var(--faint)}
  .card{margin:10px 0 0;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:14px}
  .card.done{border-color:var(--ok);background:var(--okbg)}
  .card header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px}
  .tag{font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--bg2);color:var(--brand)}
  .pick{display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--dim);cursor:pointer;-webkit-tap-highlight-color:transparent}
  .pick input{width:19px;height:19px;accent-color:var(--brand)}
  .names{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:0 0 9px}
  .names em{display:block;font-size:11px;font-style:normal;color:var(--faint);margin:0 0 2px}
  .was{font-size:14.5px;color:var(--dim);text-decoration:line-through;text-decoration-color:var(--faint)}
  .now{font-size:15px;font-weight:700}
  .arrow{color:var(--faint);font-size:15px}
  .when{margin:0 0 8px;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums}
  .when em{font-style:normal;color:var(--faint);font-size:11px;margin-right:5px}
  .diff{margin:0;padding:0 0 0 17px;font-size:13.5px;color:var(--dim)}
  .diff li{margin:0 0 3px}
  .diff b{color:var(--ink)}
  .diff code{font-size:12px;background:var(--bg2);padding:1px 4px;border-radius:4px}
  .say{display:block;margin:10px 0 0}
  .say span{display:block;font-size:12px;color:var(--faint);margin:0 0 4px}
  .say textarea{width:100%;font:inherit;font-size:14px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:9px;padding:7px 9px;resize:vertical}
  .bar{position:fixed;left:0;right:0;bottom:0;padding:11px 14px calc(11px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
  .bar .in{max-width:660px;margin:0 auto;display:flex;gap:9px;align-items:center}
  .count{flex:1;font-size:13.5px;color:var(--dim);font-variant-numeric:tabular-nums}
  .count b{color:var(--brand)}
  .bar button{font:inherit;font-size:15px;font-weight:800;padding:12px 16px;border:0;border-radius:11px;background:var(--brand);color:var(--paper);cursor:pointer}
  .bar button:active{opacity:.85}
  #fb{position:fixed;left:14px;right:14px;bottom:78px;max-width:632px;margin:0 auto;padding:11px 14px;border-radius:11px;background:var(--ok);color:#fff;font-size:14px;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
  #fb.on{opacity:1}
  #out{position:fixed;left:-9999px;top:0;width:10px;height:10px}
</style>
<div class="wrap">
<header class="top">
  <p class="kicker">전수검사 · 2026-08-19</p>
  <h1>내 레시피 1·2차<br>나가기 전에 마지막으로</h1>
  <p class="lead"><b>네가 준 것</b>이 <b>내가 한 것</b>으로 제대로 됐는지만 봐줘.</p>
</header>

<div class="how">
  <b>보는 법</b><br>
  왼쪽 = 네가 준 이름 · 오른쪽 = 내가 바꾼 것.<br>
  맞으면 <b>［확인함］</b>만 누르고, 아니면 <b>아래 칸에 적어</b>줘.<br>
  다 보면 맨 아래 <b>［결과 복사］</b> 눌러서 나한테 보내줘.
</div>

<h2>나갈 것 — ${나감.length}편</h2>
<p class="sub">앱에 새로 들어갈 편이야</p>
${나감.map(카드).join('')}

<h2>다른 편 «안»으로 — ${안으로.length}편</h2>
<p class="sub">독립 편을 안 만들고 기존 레시피에 붙였어</p>
${안으로.map(카드).join('')}

<h2>미룬 것 — ${미룸.length}편</h2>
<p class="sub">네가 「나중에」라고 한 것들이야. 안 잃어버렸어</p>
${미룸.map(카드).join('')}

<h2>앱에 «이미» 반영한 것</h2>
<p class="sub">이건 오늘 네 지시로 벌써 고쳤어 (아직 안 나갔어)</p>
${이미한것.map((x) => `<article class="card"><div class="now" style="font-size:15px;font-weight:700;margin:0 0 6px">${esc(x.편)}</div><ul class="diff"><li>${md(x.무엇)}</li></ul></article>`).join('')}
</div>

<div id="fb"></div>
<div class="bar"><div class="in">
  <div class="count" id="cnt"></div>
  <button id="copy" type="button">결과 복사</button>
</div></div>
<textarea id="out" readonly></textarea>

<script>
(function(){
  var KEY = 'hankki-내레시피최종-0819'
  var boxes = [].slice.call(document.querySelectorAll('.ok'))
  var memos = [].slice.call(document.querySelectorAll('.memo'))
  var cnt = document.getElementById('cnt')
  var fb = document.getElementById('fb')

  /* 새로고침해도 남게 — 창업자가 폰에서 나눠 보다가 앱을 껐다 켜도 안 잃는다.
     ⛔ 이게 없어서 두 번 삽질했다(2026-08-18 창업자 지적) */
  function 읽기(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch(e){ return {} } }
  function 쓰기(o){ try { localStorage.setItem(KEY, JSON.stringify(o)) } catch(e){} }

  var 저장 = 읽기()
  boxes.forEach(function(b){
    if (저장['ok:'+b.dataset.k]) b.checked = true
    칠하기(b)
    b.addEventListener('change', function(){
      var o = 읽기(); o['ok:'+b.dataset.k] = b.checked; 쓰기(o); 칠하기(b); 세기()
    })
  })
  memos.forEach(function(t){
    if (저장['memo:'+t.dataset.k]) t.value = 저장['memo:'+t.dataset.k]
    t.addEventListener('input', function(){
      var o = 읽기(); o['memo:'+t.dataset.k] = t.value; 쓰기(o); 세기()
    })
  })

  function 칠하기(b){
    var c = b.closest('.card')
    if (c) c.classList.toggle('done', b.checked)
  }
  function 세기(){
    var n = boxes.filter(function(b){ return b.checked }).length
    var m = memos.filter(function(t){ return t.value.trim() }).length
    cnt.innerHTML = '확인 <b>' + n + '</b> / ' + boxes.length + (m ? ' · 적은 것 <b>' + m + '</b>' : '')
  }
  세기()

  function 말하기(s){ fb.textContent = s; fb.classList.add('on'); setTimeout(function(){ fb.classList.remove('on') }, 2200) }

  document.getElementById('copy').addEventListener('click', function(){
    var 줄 = ['[내 레시피 1·2차 전수검사 결과]', '']
    boxes.forEach(function(b){
      var k = b.dataset.k
      var m = (저장 = 읽기())['memo:'+k] || ''
      var t = document.querySelector('.memo[data-k="' + k.replace(/"/g,'\\\\"') + '"]')
      if (t) m = t.value
      줄.push((b.checked ? '✅ ' : '⬜ ') + k + (m.trim() ? '  → ' + m.trim() : ''))
    })
    var text = 줄.join('\\n')

    /* 복사 실패 폴백 — 클립보드가 막힌 폰이 있다(창업자 폰에서 실제로 겪었다).
       그때는 아래 숨은 textarea 를 골라서 유저가 직접 복사할 수 있게 한다. */
    var out = document.getElementById('out')
    out.value = text
    function 폴백(){
      out.style.left = '14px'; out.style.top = '50%'; out.style.width = 'calc(100% - 28px)'; out.style.height = '40vh'
      out.select()
      try { document.execCommand('copy'); 말하기('복사했어 · 안 되면 화면의 글을 길게 눌러 복사해'); }
      catch(e){ 말하기('길게 눌러서 복사해줘') }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ 말하기('결과를 복사했어 · 클로드한테 붙여넣기') }, 폴백)
    } else 폴백()
  })
})()
</script>`

writeFileSync(낼곳, HTML)
console.log(`\n✅ 전수검사판 — 나갈 것 ${나감.length}편 · 안으로 ${안으로.length}편 · 미룸 ${미룸.length}편`)
console.log(`   ＋ 앱에 이미 반영한 것 ${이미한것.length}편`)
console.log(`💾 ${낼곳}`)
