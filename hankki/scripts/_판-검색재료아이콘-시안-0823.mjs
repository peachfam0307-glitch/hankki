// 🥕 시안판 — 검색 「재료로 찾기」 8칸 (창업자 할일 4번 · 2026-08-23)
//
// 📮 *"확정전에 시안줘 다고치고"*
//
// ⭐ 심장 = 「6칸은 고쳤고 «2칸이 남았다»」를 창업자가 «눈으로» 판정하게 한다.
//   ⛔ 글로 「김치·닭고기가 안 붙어요」라고 적으면 «어떤 그림이 붙을 수 있는지»를 모른다.
//      → **후보 컷을 실제 크기로 나란히** 놓고 고르게 한다.
//
// ⛔⛔ 절대원칙(창업자 2026-08-19) = **검수판은 무조건 체크 ＋ 복사**
//   ⑴ 칸마다 고르기 → localStorage (새로고침해도 안 날아간다)
//   ⑵ 맨 아래 「복사하기」
//   ⑶ clipboard 가 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97)
//      → 실패하면 Range 로 글자를 골라 준다
//
// ⭐ 그림은 **data URI 로 박는다** — 아티팩트는 바깥 주소를 못 부른다(CSP).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-검색재료아이콘-시안-0823.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const ING = join(ROOT, 'src/assets/stickers/ing')
const OUT = join(ROOT, 'docs/시안/검색재료아이콘-0823')
mkdirSync(OUT, { recursive: true })

const 그림 = (키) => `data:image/png;base64,${readFileSync(join(ING, `${키}.png`)).toString('base64')}`

// 지금 붙는 것 — 재현판이 실제로 읽은 값(2026-08-23)
const 고친것 = [
  { 이름: '계란', 키: 'ig_s9_01' },
  { 이름: '두부', 키: 'ig_s9_02' },
  { 이름: '양파', 키: 'ig_s3_07' },
  { 이름: '대파', 키: 'ig_s3_01' },
  { 이름: '소고기', 키: 'ig_s6_09' },
  { 이름: '돼지고기', 키: 'ig_s6_08' },
]

// 아직 옛 SVG 도형인 둘 — 재료표(ingIcons.js)에 그 이름이 없다
const 남은것 = [
  {
    이름: '닭고기',
    왜: '재료표에 「닭고기」가 없다. 「닭다리」·「영계」는 있다.',
    후보: [
      { 키: 'ig_s6_11', 라벨: '영계 (통닭)', 추천: true, 말: '「닭고기」라는 넓은 말에 제일 가깝다' },
      { 키: 'ig_s6_10', 라벨: '닭다리', 추천: false, 말: '부위 하나라 「닭고기」보다 좁다' },
    ],
  },
  {
    이름: '김치',
    왜: '재료표에 김치 그림이 «한 컷도 없다». 김치는 재료가 아니라 반찬이라 시트에서 빠졌다.',
    후보: [
      { 키: 'ig_s3_04', 라벨: '배추', 추천: false, 말: '배추는 김치 «재료»지 김치가 아니다' },
    ],
    새컷필요: true,
  },
]

const 칸 = (c) => `
  <label class="pick">
    <input type="radio" name="${c.이름}" value="${c.값}">
    <span class="dot"></span><span>${c.글}</span>
  </label>`

const html = `<title>재료로 찾기 시안</title>
<style>
  :root{
    --ink:#2b2724; --sub:#6f6862; --line:#ddd5c8;
    --paper:#faf7f1; --card:#ffffff; --cream:#f2ede3;
    --brown:#5878a0; --good:#3f7a4e; --bad:#b3453a;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#ece7e0; --sub:#a49c93; --line:#3a3730;
    --paper:#1c1b19; --card:#252320; --cream:#2f2c27;
    --brown:#7093c0; --good:#7fb98c; --bad:#e08277;
  }}
  :root[data-theme="dark"]{
    --ink:#ece7e0; --sub:#a49c93; --line:#3a3730;
    --paper:#1c1b19; --card:#252320; --cream:#2f2c27;
    --brown:#7093c0; --good:#7fb98c; --bad:#e08277;
  }
  body{
    background:var(--paper); color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",system-ui,sans-serif;
    line-height:1.65; margin:0; padding:22px 16px 90px; word-break:keep-all;
  }
  .wrap{max-width:640px; margin:0 auto; display:flex; flex-direction:column; gap:26px}
  h1{font-size:23px; margin:0; letter-spacing:-.02em}
  h2{font-size:17px; margin:0 0 12px; letter-spacing:-.01em}
  .lead{color:var(--sub); font-size:14.5px; margin:6px 0 0}
  .quote{
    border-left:3px solid var(--brown); padding:8px 0 8px 13px;
    color:var(--sub); font-size:14px; margin:0;
  }
  section{background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 16px}
  .badge{
    display:inline-block; font-size:12px; font-weight:700; padding:3px 9px;
    border-radius:999px; background:var(--cream); color:var(--brown); margin-bottom:10px;
  }
  .grid{display:grid; grid-template-columns:repeat(3,1fr); gap:16px 8px}
  .cell{display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center}
  .tile{
    width:66px; height:66px; border-radius:50%; background:var(--cream);
    display:flex; align-items:center; justify-content:center;
  }
  .tile img{width:42px; height:42px; object-fit:contain}
  .nm{font-size:14.5px; font-weight:600}
  .file{font-size:10.5px; color:var(--good); font-variant-numeric:tabular-nums; word-break:break-all}
  .old{
    width:66px; height:66px; border-radius:50%; background:var(--cream);
    display:flex; align-items:center; justify-content:center;
    color:var(--bad); font-size:11px; font-weight:700; line-height:1.3;
  }
  .row{display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap}
  .why{font-size:13.5px; color:var(--sub); margin:2px 0 14px}
  .cands{display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px}
  .cand{
    border:1px solid var(--line); border-radius:12px; padding:12px 14px;
    display:flex; flex-direction:column; align-items:center; gap:6px; min-width:118px;
  }
  .cand .tip{font-size:11.5px; color:var(--sub); max-width:150px; text-align:center}
  .star{font-size:11px; font-weight:700; color:var(--brown)}
  .pick{display:flex; align-items:center; gap:9px; padding:9px 2px; cursor:pointer; font-size:15px}
  .pick input{position:absolute; opacity:0; width:0; height:0}
  .dot{
    width:19px; height:19px; border-radius:50%; border:2px solid var(--line);
    flex:0 0 auto; transition:.12s;
  }
  .pick input:checked + .dot{border-color:var(--brown); background:var(--brown); box-shadow:inset 0 0 0 3.5px var(--card)}
  .pick input:focus-visible + .dot{outline:2px solid var(--brown); outline-offset:2px}
  .note{
    background:var(--cream); border-radius:11px; padding:12px 14px; font-size:13.5px; color:var(--sub);
  }
  textarea{
    width:100%; box-sizing:border-box; min-height:120px; font:inherit; font-size:13.5px;
    background:var(--paper); color:var(--ink); border:1px solid var(--line);
    border-radius:11px; padding:11px; resize:vertical;
  }
  button{
    font:inherit; font-size:15px; font-weight:700; padding:13px 20px; border:none;
    border-radius:11px; background:var(--brown); color:#fff; cursor:pointer; width:100%;
  }
  .said{font-size:13px; color:var(--good); min-height:19px; margin-top:8px; text-align:center}
</style>

<div class="wrap">
  <header>
    <h1>재료로 찾기 — 고친 결과</h1>
    <p class="lead">홈 → 검색 → 맨 아래 「재료로 찾기」. 8칸 중 <b>6칸이 재료 그림으로 바뀌었고 2칸이 남았다.</b></p>
  </header>

  <p class="quote">📮 “홈에서 검색하면 아래 음식아이콘 옛날꺼.”</p>

  <section>
    <span class="badge">✅ 고쳐진 6칸</span>
    <h2>창업자가 뽑은 재료컷이 붙었다</h2>
    <div class="grid">
      ${고친것.map((c) => `
      <div class="cell">
        <div class="tile"><img src="${그림(c.키)}" alt="${c.이름}"></div>
        <div class="nm">${c.이름}</div>
        <div class="file">${c.키}.png</div>
      </div>`).join('')}
    </div>
    <p class="why" style="margin-top:16px; margin-bottom:0">
      뿌리 = 재료 칸인데 <b>「요리」 규칙</b>을 부르고 있었다. 「계란」을 요리 이름으로 판정하니
      재료컷이 붙을 리가 없었다. <b>「재료」 규칙</b>으로 바꿨다.
    </p>
  </section>

  ${남은것.map((r) => `
  <section>
    <span class="badge">⏳ 판정 필요</span>
    <h2>${r.이름}</h2>
    <div class="row" style="margin-bottom:10px">
      <div class="cell">
        <div class="old">옛 SVG<br>도형</div>
        <div class="nm" style="font-size:12.5px; color:var(--sub)">지금</div>
      </div>
      <div style="flex:1; min-width:200px">
        <p class="why" style="margin:4px 0 0">${r.왜}</p>
      </div>
    </div>
    <div class="cands">
      ${r.후보.map((h) => `
      <div class="cand">
        <div class="tile"><img src="${그림(h.키)}" alt="${h.라벨}"></div>
        <div class="nm">${h.라벨}</div>
        ${h.추천 ? '<div class="star">추천</div>' : ''}
        <div class="tip">${h.말}</div>
        <div class="file">${h.키}.png</div>
      </div>`).join('')}
    </div>
    ${r.후보.map((h) => 칸({ 이름: r.이름, 값: h.키, 글: `${h.라벨} 로 붙인다` })).join('')}
    ${r.새컷필요 ? 칸({ 이름: r.이름, 값: '새컷', 글: '새로 뽑아 줄게 (그때까지 지금 그대로)' }) : ''}
    ${칸({ 이름: r.이름, 값: '그대로', 글: '지금 도형이 괜찮다 (안 바꾼다)' })}
  </section>`).join('')}

  <section>
    <span class="badge">🐛 같이 고친 것</span>
    <h2>레꾸자랑 뒤로가기가 홈으로 새던 것</h2>
    <p class="quote" style="margin-bottom:12px">📮 “레꾸자랑에서 고르고하고 뒤로가면 홈으로 감.”</p>
    <div class="note">
      뿌리 = 레시피를 고르면 뜨는 <b>선택 시트</b>(꾸민 표지 / 랜덤 카드)가
      <b>뒤로가기 층에 아예 없었다.</b> 그래서 뒤로가기가 시트를 못 보고
      「다른 탭이면 홈으로」 갈래로 떨어졌다.<br><br>
      시트가 <b>닫히긴 했다</b> — 탭이 홈으로 갈아치워지며 통째로 사라진 것뿐이라
      눈으로는 「잘 닫혔는데 왜 홈이지?」로 보인다.<br><br>
      ✅ 다른 시트들과 같은 방식으로 바꿨다. <b>재현판에서 「자랑」 탭에 남는 것까지 확인.</b>
      <br>화면이 안 바뀌는 고침이라 시안으로 보여줄 그림이 없다 — <b>폰에서 눌러 보면 된다.</b>
    </div>
  </section>

  <section>
    <h2>고른 것 복사하기</h2>
    <textarea id="out" readonly placeholder="위에서 고르면 여기에 정리돼요"></textarea>
    <button id="cp" type="button" style="margin-top:10px">복사하기</button>
    <div class="said" id="said"></div>
  </section>
</div>

<script>
  var KEY = 'hankki:재료아이콘0823'
  var box = document.getElementById('out')
  var said = document.getElementById('said')

  function 저장된것(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} }
  }
  function 그린다(){
    var v = 저장된것()
    var 줄 = []
    document.querySelectorAll('input[type=radio]').forEach(function(el){
      if (v[el.name] === el.value) el.checked = true
    })
    Object.keys(v).forEach(function(k){
      var el = document.querySelector('input[name="' + CSS.escape(k) + '"][value="' + CSS.escape(v[k]) + '"]')
      var 글 = el ? el.parentNode.querySelector('span:last-child').textContent.trim() : v[k]
      줄.push('· ' + k + ' → ' + 글)
    })
    box.value = 줄.length ? ('[재료로 찾기 판정 · 2026-08-23]\\n' + 줄.join('\\n')) : ''
  }
  document.addEventListener('change', function(e){
    if (e.target.type !== 'radio') return
    var v = 저장된것()
    v[e.target.name] = e.target.value
    try { localStorage.setItem(KEY, JSON.stringify(v)) } catch (err) {}
    그린다()
  })
  document.getElementById('cp').addEventListener('click', function(){
    if (!box.value) { said.textContent = '아직 고른 게 없어요'; return }
    // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97)
    //    → 실패하면 글자를 골라 준다. 길게 눌러 복사하면 된다.
    var 골라주기 = function(){
      box.removeAttribute('readonly'); box.focus(); box.select()
      box.setSelectionRange(0, box.value.length)
      said.textContent = '글자를 골라뒀어요 — 길게 눌러 복사해주세요'
    }
    try {
      navigator.clipboard.writeText(box.value).then(function(){
        said.textContent = '복사했어요'
      }, 골라주기)
    } catch (e) { 골라주기() }
  })
  그린다()
</script>
`

const 낼곳 = join(OUT, '시안.html')
writeFileSync(낼곳, html)
console.log(`\n🥕 시안 → ${낼곳}  (${(html.length / 1024).toFixed(0)}KB)\n`)
