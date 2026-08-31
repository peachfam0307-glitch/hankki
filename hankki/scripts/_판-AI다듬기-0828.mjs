// 🤖🤖 「AI로 다듬으면 정말 나아지나」 판정판 — 창업자 2026-08-28 *"해봐"*
//
// 📮 창업자 = *"어떻게 해야 다른 것들 가져오기할때 오류가 안나"* → *"이거 ai돌리게 할수있어?"*
//    → *"조사좀 해볼래? 돈이 얼마나 드는지 등등.."* → *"해봐"*
//
// ⭐⭐ **재는 것 = 「품질」 하나다.** 돈은 이미 닫혔다(하루 243편 무료 · 넘어도 1,000편에 620원).
//
// ⛔⛔ **이 컨테이너는 AI 를 못 부른다** — api.cloudflare.com · api.groq.com · openrouter.ai
//    전부 `000`(연결 자체가 안 됨 · 2026-08-28 실측). 그래서 «창업자가 화면에서» 돌린다.
//    📌 콘솔 캡처를 받는 것과 같은 구조다(규칙 15 — 나는 못 열고 창업자는 열려 있다).
//
// ⭐ **정답을 내가 안다** — 창업자가 원본 캡션을 그대로 줬기 때문이다.
//    그래서 「좋아 보인다」가 아니라 **「정답과 몇 개나 맞나」**로 잰다.
//
// ⛔ 앱 코드는 한 줄도 안 건드린다(옆 세션과 충돌 0 · 갈래 규칙).
//
// 실행: node scripts/_판-AI다듬기-0828.mjs   →   scratchpad 에 HTML
import { writeFileSync } from 'node:fs'
import { parseRecipeText } from '../src/parseRecipe.js'

// ── 창업자가 v11.70 「원문 복사」로 준 «진짜» OCR 글자 셋 ───────────────
const 사례 = [
  {
    이름: '콩나물무침',
    쪽지: '줄글형 · 재료 목록이 원본에 없다 · 릴스 화면 글자(「항상 / 건강하세요」)가 섞여 있다',
    글: `KT 1:54 O F
항상
건강하세요
jangnamcook 9시간 • 작성자
$7
콩나물의 시원함을 최대한 살린 콩나물무침
4
깨끗히 씻은 콩나물 300g을
냄비에 넣고
물은 딱 1/3컵만 넣어주세요.
적게 넣어야 이 물을 버리지 않고 다 사용할
수 있어요.
중불로 불을 올린 뒤 끓어 김이
올라오는순간부터
3분동안 찌듯이 삶아주시고
익은 콩나물은 꺼내 김을 날려주세요.
김을 날려야 콩나물에 양념이 쏙 배어들어요.
양념은 콩나물삶은물에
맛소금 1/5스푼 (짠맛은 취향에 따라
가감해주세요!)
들기름 1스푼 넣고 마구 섞어주시면
유장이 만들어지는데
콩나물을 여기에 넣고
으깬 통깨, 그리고 마늘은 빼고 얇게썬
대파를 넣어주시면
구수하면서 시원한 콩나물무침 완성입니다!
도움이 되셨다면 좋아요 한번씩
눌러주시구요 ㅎㅎ
행복한 하루 보내세요!
답글 달기
dow00929 8시간
새로운 방법이네요 시도해볼게요
답글 달기
대화 참여하기...
GIF
1`,
    정답: {
      제목: '콩나물의 시원함을 최대한 살린 콩나물무침',
      재료: ['콩나물 300g', '물 1/3컵', '맛소금 1/5스푼', '들기름 1스푼', '통깨', '대파'],
      걸음수: '6 안팎',
      꼭없어야: ['항상', '건강하세요', 'jangnamcook', '새로운 방법이네요', '대화 참여하기'],
    },
  },
  {
    이름: '진미채볶음',
    쪽지: '요리 이름 줄이 «아예 없다» — 이름이 맨 마지막 문장에만 나온다',
    글: `KT 1:51 FO
ll (7
[재료]
- 진미채 300g (컬리 건어물상회 페루산 진미채
사용했어요)
- 혼미림 3큰술 (타카라 혼미림 준마이 사용했어요)
맛술,미림 대체 가능합니다
- 현미유 2큰술
- 양조간장 2큰술
- 고추장 3큰술 (청정원 순창 우리쌀 100%고추장
- 황설탕 2큰술
- 고춧가루 1큰술
- 조청쌀엿 1큰술 (물엿,알룰로스,올리고당 대체가능)
꿀도 가능! 꿀은 열을 가하지 말고, 마지막에 넣고
버무려주세요
- 한국인 마무리는 통깨
[만드는 방법]
1.진미채 300g을 먹기 좋은 크기로 자른뒤
혼미림 3큰술을 넣고 골고루 버무려줍니다.
2. 물이 끓어오른 찜기에 면보나 종이호일을 깔고
진미채를 올려 3분 정도만 쪄주세요.
쪄낸 진미채는 꺼내 한김 식혀줍니다.
3.웍에 식용유 2큰술, 양조간장 2큰술, 고추장 3큰술,
황설탕 2큰술, 고춧가루 1큰술을 넣고 잘 섞어줍니다.
4.중불에서 양념이 바글바글 끓어오를 정도로 볶은뒤
불을 꺼주세요. 한김 식힌 진미채를 넣어
양념이 골고루 묻도록 잘 버무려줍니다.
5.조청쌀엿 1큰술을 넣어
윤기와 은은한 단맛을 더해주세요.
6.다시 약불을 켜고 양념과 진미채가 잘 어우러질 정도로
짧게 한 번만 볶아준 뒤 불을 끕니다.
7. 마지막으로 통깨 솔솔 뿌리면 오늘도 반찬 하나 완성!
찬밥에 올려 먹어도 맛있고,
김에 밥과 함께 싸 먹으면 더 맛있는 진미채볶음!
an_yeosa.mom님에게 댓글 추가
GIF`,
    정답: {
      제목: '진미채볶음',
      재료: ['진미채 300g', '혼미림 3큰술', '현미유 2큰술', '양조간장 2큰술', '고추장 3큰술', '황설탕 2큰술', '고춧가루 1큰술', '조청쌀엿 1큰술', '통깨'],
      걸음수: '7',
      꼭없어야: ['재료', '만드는 방법', 'an_yeosa.mom', 'GIF'],
    },
  },
  {
    이름: '고당추 꼬마김밥',
    쪽지: '한 캡션에 «레시피가 둘» 들어 있다(꼬마김밥 ＋ 비빔면) · 대괄호 소제목',
    글: `KT 7:45
HD Doll 59
1,228 56 46 86
☑
lifestyle_writer_ 개학기념 특식 고당추 꼬마김밥
레시피
[재료] 4~5인분
ㅁ
풋고추 5개
당근 1개
양배추 한줌
사각어묵 2장
밥 3공기
참깨, 참기름
[고당추 조림소스]
간장 2큰술
굴소스 2큰술
맛술 4큰술
다진마늘 1큰술
1) 풋고추, 당근, 양배추,사각 어묵을 작게 다져서 기름에 볶기
2) 조림 소스 넣고 수분 날리기 (고슬고슬하게)
3) 밥과 섞어서 반으로 자른 김밥김에 돌돌 말기
(김 끝에는 물 살짝)
같이 먹으면 맛있는 꼬기 비빔면
[재료]
채썬 양배추
채썬 오이
두부면
데친 차돌박이
[비빔양념장] 2~3인분`,
    정답: {
      제목: '개학기념 특식 고당추 꼬마김밥',
      재료: ['풋고추 5개', '당근 1개', '양배추 한줌', '사각어묵 2장', '밥 3공기', '참깨', '참기름', '간장 2큰술', '굴소스 2큰술', '맛술 4큰술', '다진마늘 1큰술'],
      걸음수: '3',
      꼭없어야: ['고당추 조림소스', '비빔양념장', '같이 먹으면 맛있는 꼬기 비빔면', 'HD Doll'],
    },
  },
]

// ── AI 에게 줄 지시 ──────────────────────────────────────────────
// ⭐ 짧고 단호하게 — 오픈 모델(8B급)은 긴 지시를 잘 못 따른다.
// ⛔ 「없는 걸 지어내지 말 것」을 «맨 앞»에 둔다. 이게 제일 위험하다.
const 프롬프트 = `너는 요리 레시피 정리기다. 아래는 인스타그램 캡처를 글자로 읽은 것이다.
화면 글자(통신사·시계·계정명·좋아요 수·댓글·GIF)와 인사말이 섞여 있다.

규칙:
1. 원문에 없는 재료나 순서를 절대 지어내지 마라. 없으면 비워라.
2. "재료"·"만드는 법"·"양념장" 같은 절 이름은 제목이 아니다.
3. 한 글에 요리가 둘이면 «맨 처음 요리»만 정리해라.
4. 재료는 "이름 분량" 한 줄씩. 분량이 없으면 이름만.
5. 순서는 조리 동작만. 인사말·후기·팁은 memo 로.

아래 JSON 만 출력해라. 설명하지 마라.
{"title":"요리 이름","ingredients":["..."],"steps":["..."],"memo":"..."}

--- 원문 ---
`

// ── 지금 파서 결과(비교용) ──────────────────────────────────────
const 지금 = 사례.map((c) => {
  const r = parseRecipeText(c.글, { fromOcr: true })
  return { 제목: r.title || '(없음)', 재료: r.ingredients, 걸음: r.steps, 메모: r.memo || '' }
})

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 칸 = 사례.map((c, i) => {
  const n = 지금[i]
  return `
<section class="case" id="c${i}">
  <header class="ch"><span class="num">${i + 1}</span><h2>${esc(c.이름)}</h2></header>
  <p class="note">${esc(c.쪽지)}</p>

  <div class="act">
    <button class="cp" data-t="p${i}">이 사례 통째로 복사</button>
    <span class="hint">→ Cloudflare 놀이터에 붙여넣고 실행</span>
  </div>
  <textarea class="hid" id="p${i}">${esc(프롬프트 + c.글)}</textarea>

  <div class="two">
    <div class="col">
      <h3 class="lab now">지금 파서</h3>
      <dl>
        <dt>제목</dt><dd class="${n.제목 === c.정답.제목 ? 'ok' : 'bad'}">${esc(n.제목)}</dd>
        <dt>재료 ${n.재료.length}개</dt><dd>${n.재료.length ? n.재료.map((x) => `<span class="pill">${esc(x)}</span>`).join('') : '<em>없음</em>'}</dd>
        <dt>걸음 ${n.걸음.length}개</dt><dd class="small">${n.걸음.map((s, k) => `${k + 1}. ${esc(s)}`).join('<br>')}</dd>
      </dl>
    </div>
    <div class="col">
      <h3 class="lab ans">정답 (원본 그대로)</h3>
      <dl>
        <dt>제목</dt><dd>${esc(c.정답.제목)}</dd>
        <dt>재료 ${c.정답.재료.length}개</dt><dd>${c.정답.재료.map((x) => `<span class="pill">${esc(x)}</span>`).join('')}</dd>
        <dt>걸음</dt><dd>${esc(c.정답.걸음수)}개</dd>
        <dt>이건 없어야</dt><dd>${c.정답.꼭없어야.map((x) => `<span class="pill no">${esc(x)}</span>`).join('')}</dd>
      </dl>
    </div>
  </div>

  <div class="judge">
    <h3 class="lab ai">AI 결과를 여기 붙여넣기</h3>
    <textarea class="paste" data-i="${i}" placeholder="Cloudflare 놀이터가 낸 JSON 을 그대로 붙여넣어"></textarea>
    <div class="pick" data-i="${i}">
      <button data-v="좋다">지금보다 좋다</button>
      <button data-v="비슷">비슷하다</button>
      <button data-v="나쁘다">지금이 낫다</button>
    </div>
  </div>
</section>`
}).join('')

const html = `<title>AI 다듬기 판정</title>
<style>
:root{
  --bg:#f7f5f0; --panel:#fffdf9; --ink:#2b2723; --sub:#6f675e; --line:#e3ddd2;
  --now:#8c6a3f; --ans:#3f6b57; --ai:#4a5f86; --bad:#a4453a; --ok:#3f6b57;
  --pill:#efe9dd;
}
:root:not([data-theme="light"]){ @media (prefers-color-scheme:dark){
  --bg:#171614; --panel:#201e1b; --ink:#eee8de; --sub:#a49b8f; --line:#332f2a;
  --now:#d3ab73; --ans:#7fbb9c; --ai:#93aad6; --bad:#e08a7f; --ok:#7fbb9c; --pill:#2b2723;
}}
:root[data-theme="dark"]{
  --bg:#171614; --panel:#201e1b; --ink:#eee8de; --sub:#a49b8f; --line:#332f2a;
  --now:#d3ab73; --ans:#7fbb9c; --ai:#93aad6; --bad:#e08a7f; --ok:#7fbb9c; --pill:#2b2723;
}
body{background:var(--bg);color:var(--ink);font:16px/1.6 Pretendard,-apple-system,system-ui,sans-serif;margin:0;padding:20px 16px 60px}
.wrap{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.5px;text-wrap:balance}
.lead{color:var(--sub);font-size:15px;margin:0}
.box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px}
.box h2{font-size:17px;margin:0 0 8px}
ol{margin:0;padding-left:20px} ol li{margin:6px 0}
a{color:var(--ai)}
.case{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}
.ch{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.num{width:26px;height:26px;border-radius:50%;background:var(--now);color:#fff;font-size:14px;font-weight:800;display:grid;place-items:center;flex:0 0 auto}
.ch h2{font-size:19px;margin:0}
.note{color:var(--sub);font-size:14.5px;margin:0 0 12px}
.act{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
button{font:inherit;font-weight:700;cursor:pointer;border:1px solid var(--line);background:var(--pill);color:var(--ink);border-radius:999px;padding:9px 15px}
button:focus-visible{outline:2px solid var(--ai);outline-offset:2px}
.cp{background:var(--now);color:#fff;border-color:transparent}
.hint{color:var(--sub);font-size:14px}
.hid{position:absolute;left:-9999px;width:1px;height:1px}
.two{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-bottom:14px}
@media(min-width:660px){.two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.col{border:1px solid var(--line);border-radius:12px;padding:12px}
.lab{font-size:13px;font-weight:800;letter-spacing:.06em;margin:0 0 8px;text-transform:uppercase}
.lab.now{color:var(--now)} .lab.ans{color:var(--ans)} .lab.ai{color:var(--ai)}
dl{margin:0} dt{font-size:12.5px;color:var(--sub);font-weight:700;margin-top:8px}
dd{margin:3px 0 0}
dd.bad{color:var(--bad);font-weight:700} dd.ok{color:var(--ok);font-weight:700}
.small{font-size:14px;color:var(--sub)}
.pill{display:inline-block;background:var(--pill);border-radius:8px;padding:2px 8px;margin:2px 3px 2px 0;font-size:14px}
.pill.no{color:var(--bad)}
.judge{border-top:1px dashed var(--line);padding-top:14px}
.paste{width:100%;box-sizing:border-box;min-height:110px;font:14px/1.5 ui-monospace,monospace;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px}
.pick{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.pick button[aria-pressed=true]{background:var(--ai);color:#fff;border-color:transparent}
.foot{position:sticky;bottom:0;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.foot .cp{flex:0 0 auto}
#state{color:var(--sub);font-size:14px}
code{background:var(--pill);padding:1px 6px;border-radius:6px;font-size:14px}
</style>
<div class="wrap">
<div>
  <h1>AI 다듬기 판정</h1>
  <p class="lead">지금 규칙 파서 ↔ AI 를 나란히 놓고 «정답»과 견준다. 앱은 안 건드린다.</p>
</div>

<div class="box">
  <h2>어디서 돌리나</h2>
  <ol>
    <li>Cloudflare 대시보드 → <code>AI</code> → <code>Workers AI</code> → <b>Playground</b></li>
    <li>모델 = <code>@cf/meta/llama-3.1-8b-instruct-fp8</code> (없으면 <code>llama-3.1-8b-instruct</code>)</li>
    <li>아래 사례마다 <b>［이 사례 통째로 복사］</b> → 붙여넣고 실행</li>
    <li>나온 글을 <b>［AI 결과를 여기 붙여넣기］</b> 칸에 붙이고, 셋 중 하나 고르기</li>
    <li>맨 아래 <b>［전부 복사］</b> 눌러서 나한테 붙여넣기</li>
  </ol>
  <p class="lead" style="margin-top:10px">⚠️ 돈은 안 든다 — 하루 10,000 뉴런 무료고 한 편에 약 41 뉴런이다. 카드 등록도 필요 없다.</p>
</div>

${칸}

<div class="foot">
  <button class="cp" id="all">전부 복사</button>
  <span id="state">고른 것 0 / 3</span>
</div>
</div>
<script>
const K='hankki:ai판정-0828'
const 저장=()=>{try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}
let st={}
try{st=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){st={}}
document.querySelectorAll('.paste').forEach(t=>{
  const i=t.dataset.i
  if(st['t'+i])t.value=st['t'+i]
  t.addEventListener('input',()=>{st['t'+i]=t.value;저장()})
})
document.querySelectorAll('.pick').forEach(p=>{
  const i=p.dataset.i
  const 그리기=()=>p.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(st['v'+i]===b.dataset.v)))
  p.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{st['v'+i]=b.dataset.v;저장();그리기();상태()}))
  그리기()
})
function 상태(){
  const n=[0,1,2].filter(i=>st['v'+i]).length
  document.getElementById('state').textContent='고른 것 '+n+' / 3'
}
상태()
// ⛔ clipboard 는 «성공으로 resolve 되고도» 실패할 수 있다(2026-08-16 사고) → 실패하면 글자를 골라 준다
function 복사(txt,el){
  navigator.clipboard.writeText(txt).then(()=>{
    const o=el.textContent;el.textContent='복사됨 · 붙여넣어 확인하세요';setTimeout(()=>el.textContent=o,2200)
  }).catch(()=>{
    const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.left='0';ta.style.top='0'
    document.body.appendChild(ta);ta.select()
    el.textContent='길게 눌러 복사하세요'
  })
}
document.querySelectorAll('.cp[data-t]').forEach(b=>b.addEventListener('click',()=>복사(document.getElementById(b.dataset.t).value,b)))
document.getElementById('all').addEventListener('click',e=>{
  const 이름=${JSON.stringify(사례.map((c) => c.이름))}
  let s='# AI 다듬기 판정 결과\\n'
  이름.forEach((nm,i)=>{s+='\\n## '+(i+1)+'. '+nm+'\\n판정: '+(st['v'+i]||'(안 고름)')+'\\nAI 결과:\\n'+(st['t'+i]||'(안 붙임)')+'\\n'})
  복사(s,e.currentTarget)
})
</script>`

const 낼곳 = process.env.HANKKI_OUT || '/tmp/claude-0/-home-user-hankki/e2088a34-c5b0-589e-9511-a0d301f7bab0/scratchpad/ai판정-0828.html'
writeFileSync(낼곳, html)
console.log(`✅ ${낼곳}`)
console.log('\n── 지금 파서 결과(판에 실린 값) ──')
지금.forEach((n, i) => console.log(`${사례[i].이름.padEnd(14)} 제목="${n.제목}" 재료=${n.재료.length} 걸음=${n.걸음.length}`))
