# 📋 [2026-08-29] `hold/가져오기-0828` 검수판 — 창업자 *"다른거 하느라 저장만 한것같은데 검수판보자."*
#
# ⚠️⚠️ [같은 날 · 만든 뒤 바뀌었다] 창업자가 화면을 «이미 알고» 문구 안을 직접 줬다 —
#    📮 *"초록박스-레시피열쇠를 다쓰면 기본인식으로. 다음줄 그래도 무료로 계속 쓸 수 있어요."*
#    📮 *"한끼앱에서 사진가져오기 / 무료 사용시 추천. 사진을 보면서 수정할 수 있어요. 이렇게 고치는거 어때"*
#    📮 *"갤러리에서 바로 한끼로랑 한끼에서 가져오기는 아직 안만들었어."* · *"내가 다른세션이랑 만들어서 올릴게."*
#    → 그래서 아래 4·5·6번 칸은 «낡았다». 다시 뽑을 땐 그 셋을 고치고 뽑을 것.
#    ⛔ 그리고 갤러리·한끼앱 두 길은 «다른 세션 몫»이다(세션 영역 분담) — 그 칸을 이 세션이 고치지 않는다.
#
# ⛔⛔ 이 판의 바닥은 **v11.70** 이다(배포 브랜치 = v11.89). 19판 낡은 바닥 위에 새 가져오기가 얹혀 있다.
#    → 화면에 보이는 «다른 부분»(문체·글자 크기 등)은 지금 앱과 다를 수 있다. 판 맨 위에 그렇게 적었다.
#
# ☑️ 절대원칙(창업자 2026-08-19) = **모든 검수판은 체크 ＋ 복사**가 된다.
#    ⑴ 칸마다 고르기(좋다/고칠 것/모르겠다) — localStorage 저장
#    ⑵ 맨 아래 「복사하기」
#    ⑶ clipboard 가 실패하는 폰이 있다(v10.97) → Range 로 글자를 골라 준다
#
# 쓰는 법 = python3 scripts/_판-가져오기검수-0829.py <컷폴더> <낼 html>
import base64, sys, pathlib

컷폴더 = pathlib.Path(sys.argv[1])
낼것 = pathlib.Path(sys.argv[2])

def 박기(이름):
    p = 컷폴더 / 이름
    return 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode()

컷 = {k: 박기(f'w_가져오기-{v}.webp') for k, v in {
    '목록390': '목록-390', '목록320': '목록-320',
    'sns390': '안내1-SNS-390', 'sns320': '안내1-SNS-320',
    '갤390': '안내2-갤러리-390', '갤320': '안내2-갤러리-320',
}.items()}

# 🗂 칸 = (번호, 제목, 설명 HTML, [(딱지, 이미지키)…])
칸들 = [
    ('1', '가져오기 첫 화면 — 길 넷',
     '<p>길이 <b>넷</b>이야: SNS 캡처 · 갤러리 사진 · 한끼 앱에서 고르기 · 직접 입력. '
     'SNS 칸에만 「제일 많이 써요」 알약을 달아 눈이 먼저 가게 했어.</p>'
     '<p class=n>잰 값 — 가로 넘침 <b>0</b>(390·320 둘 다) · 상자 틈 12px · 제목 18.5px · 설명 16.5px</p>',
     [('폰 390px', '목록390'), ('작은 폰 320px', '목록320')]),

    ('2', '안내 ① — SNS 보다가 캡처해서',
     '<p>1·2·3 글 아래에 <b>창업자 폰 실물 캡처</b> 석 장을 이어 붙였어. '
     '공유 버튼과 「더보기」에 빨간 동그라미, 앱 목록은 한끼만 또렷하고 나머지는 살짝 흐리게(창업자 지시).</p>'
     '<p class=n>맨 아래 = 인스타·유튜브에서 담는 다른 방법 ＋ 링크 주소만 담아두기</p>',
     [('폰 390px', 'sns390'), ('작은 폰 320px', 'sns320')]),

    ('3', '안내 ② — 갤러리에 있는 사진',
     '<p>2·3번 칸은 SNS 안내와 <b>일부러 같게</b> 뒀어. 인스타든 갤러리든 그 뒤 손놀림이 똑같거든 '
     '— 「한 손놀림이 두 곳에서 통한다」를 보여주려고.</p>'
     '<p class=n>맨 아래 파란 단추 = 「앱을 안 나가고 여기서 고르기」</p>',
     [('폰 390px', '갤390'), ('작은 폰 320px', '갤320')]),
]

# ⚠️ 내가 «눈으로 열어 보고» 걸린 것 — 숫자로는 안 잡힌다(절대원칙 21)
걸린것 = [
    ('4', '갤러리 안내인데 말풍선이 「캡처하면 여기 떠요」',
     '<p>갤러리 안내 ①번 그림에도 <b>「캡처하면 여기 떠요」</b> 말풍선이 그대로 붙어 있어. '
     '그런데 갤러리는 <b>이미 저장해 둔 사진을 여는 것</b>이라 캡처를 하는 게 아니야. 말과 그림이 어긋나.</p>'
     '<p class=n>고치면 — 갤러리 쪽만 「사진 열면 여기 떠요」로 (SNS 쪽은 그대로 둔다)</p>'),

    ('5', '갤러리 안내 ①번 그림이 «인스타 게시물» 화면',
     '<p>갤러리 안내인데 첫 칸 그림이 인스타 게시물이야. 아래 도구 띠(휴지통·공유)만 갤러리 것으로 갈아 끼웠어. '
     '창업자 갤러리 캡처는 위쪽에 작은 미리보기 띠가 겹쳐 있어서 그렇게 절충한 건데, '
     '보는 사람은 <b>「갤러리라면서 왜 인스타지?」</b> 할 수 있어.</p>'
     '<p class=n>갈래 — ㉠ 그대로 둔다(띠만 맞으면 뜻은 통한다) ／ ㉡ 갤러리 캡처를 다시 받아 갈아 끼운다</p>'),

    ('6', '열쇠 소진 안내가 «반쪽»이야',
     '<p>초록 칸에 지금 이렇게 적혀 있어 — <b>「레시피열쇠를 다 쓰면 기본 인식으로 바뀌어요 · 그때도 계속 무료로 쓸 수 있어요」</b></p>'
     '<p>그런데 어제 창업자가 말한 건 둘이 더 있었어:</p>'
     '<p class=q>“열쇠가 소진되면, 갤러리·사진 가져오기에서 담고 수정하라고”<br>'
     '“사진을 보면서 수정할 수가 있다. 기본인식이라 인식률의 차이가 있으니까 이 부분을 집어줘야해 그래야 무료유저도 안떠나”</p>'
     '<p>지금 문구엔 <b>①어디서 고치나</b> <b>②인식률이 다르다</b> 둘 다 없어. '
     '「계속 무료」까지만 있어서, 무료 유저가 「덜 정리된 결과」를 만났을 때 <b>고칠 방법을 못 찾아</b>.</p>'
     '<p class=n>내 안 — 초록 칸에 한 줄 더: 「기본 인식은 덜 읽힐 수 있어요 · <b>갤러리·사진 가져오기</b>로 담으면 사진을 보면서 고칠 수 있어요」</p>'),

    ('7', '이 브랜치엔 가져오기 «말고도» 들어 있어',
     '<p>같이 담긴 것 — <b>스토어 01장</b>(㉢ 확정) · <b>인스타 홍보 릴스</b> · <b>홍보 시안 24장</b> · '
     '<b>AAB 워크플로 기본값 17→18</b> · 안내 원본 캡처 4장.</p>'
     '<p>내보낼 때 통째로 옮기면 <b>넷이 같이 나가</b>. 가져오기 화면만 먼저 낼지, 넷 다 볼지 정해 줘.</p>'
     '<p class=n>내 추천 — 가져오기 화면부터. 나머지는 각각 검수판을 따로 뽑는 게 낫다(스토어 01장·릴스는 성격이 다르다)</p>'),
]

def 칸HTML(번호, 제목, 설명, 그림들=None):
    샷 = ''
    if 그림들:
        샷 = '<div class=shots>' + ''.join(
            f'<figure><img src="{컷[k]}" alt="{d}" loading="lazy"><figcaption>{d}</figcaption></figure>'
            for d, k in 그림들) + '</div>'
    return f'''<section class=card data-id="{번호}">
  <header><span class=num>{번호}</span><h2>{제목}</h2></header>
  <div class=body>{설명}</div>
  {샷}
  <div class=pick role=group aria-label="{번호}번 판정">
    <button type=button data-v="좋다">좋다</button>
    <button type=button data-v="고칠 것">고칠 것</button>
    <button type=button data-v="모르겠다">모르겠다</button>
  </div>
  <textarea class=memo rows=2 placeholder="한 줄 남기기 (어디가 어떻게)"></textarea>
</section>'''

본문 = '\n'.join([칸HTML(*c) for c in 칸들] + [칸HTML(*c) for c in 걸린것])

HTML = f'''<title>가져오기 검수판</title>
<style>
:root {{
  --ink:#33261a; --ink2:#6b5a49; --ink3:#95836f;
  --bg:#f2efe9; --card:#fffdf8; --line:#e3dbcd;
  --brand:#5d3410; --brand2:#8a5a2a;
  --ok:#3f7a4a; --ok-bg:#e7f2e6;
  --fix:#a8442c; --fix-bg:#fbe9e3;
  --hm:#7a6a55; --hm-bg:#efe9dd;
  --warn-bg:#fdf3e0; --warn-line:#e8cf9c; --warn-ink:#7a5310;
  --shadow:0 1px 2px rgba(80,60,35,.06), 0 8px 22px rgba(80,60,35,.05);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --ink:#efe7db; --ink2:#bcae9c; --ink3:#8d8172;
    --bg:#1c1917; --card:#26221e; --line:#3a342d;
    --brand:#e7c9a4; --brand2:#d3ab7d;
    --ok:#8fd09b; --ok-bg:#26362a;
    --fix:#f0a48c; --fix-bg:#3a251f;
    --hm:#b6a68f; --hm-bg:#332e27;
    --warn-bg:#332a18; --warn-line:#5c4a26; --warn-ink:#e8cb95;
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 22px rgba(0,0,0,.25);
  }}
}}
:root[data-theme="dark"] {{
  --ink:#efe7db; --ink2:#bcae9c; --ink3:#8d8172;
  --bg:#1c1917; --card:#26221e; --line:#3a342d;
  --brand:#e7c9a4; --brand2:#d3ab7d;
  --ok:#8fd09b; --ok-bg:#26362a;
  --fix:#f0a48c; --fix-bg:#3a251f;
  --hm:#b6a68f; --hm-bg:#332e27;
  --warn-bg:#332a18; --warn-line:#5c4a26; --warn-ink:#e8cb95;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 22px rgba(0,0,0,.25);
}}
* {{ box-sizing:border-box }}
body {{
  margin:0; background:var(--bg); color:var(--ink);
  font:16px/1.7 -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
  -webkit-text-size-adjust:100%;
}}
.wrap {{ max-width:680px; margin:0 auto; padding:22px 16px 120px; display:flex; flex-direction:column; gap:18px }}

h1 {{ font-size:27px; line-height:1.25; margin:0; letter-spacing:-.02em; text-wrap:balance }}
.lead {{ margin:6px 0 0; color:var(--ink2); font-size:15px }}
.stamp {{ display:inline-block; margin-top:10px; font-size:12.5px; color:var(--ink3);
  border:1px solid var(--line); border-radius:999px; padding:3px 11px; background:var(--card) }}

.warn {{ background:var(--warn-bg); border:1px solid var(--warn-line); border-left-width:4px;
  border-radius:12px; padding:14px 16px; color:var(--warn-ink); font-size:14.5px }}
.warn b {{ color:var(--warn-ink) }}
.warn p {{ margin:0 }}
.warn p + p {{ margin-top:7px }}

.card {{ background:var(--card); border:1px solid var(--line); border-radius:16px;
  padding:18px 16px 16px; box-shadow:var(--shadow); scroll-margin-top:14px }}
.card header {{ display:flex; align-items:baseline; gap:10px; margin-bottom:8px }}
.num {{ flex:0 0 auto; width:26px; height:26px; border-radius:50%; background:var(--brand); color:var(--card);
  font-size:13.5px; font-weight:700; display:grid; place-items:center; transform:translateY(3px);
  font-variant-numeric:tabular-nums }}
.card h2 {{ font-size:18.5px; line-height:1.4; margin:0; letter-spacing:-.01em; text-wrap:balance }}
.body p {{ margin:0 0 8px; font-size:15px; color:var(--ink2) }}
.body p:last-child {{ margin-bottom:0 }}
.body b {{ color:var(--ink); font-weight:700 }}
.body .n {{ font-size:13.5px; color:var(--ink3) }}
.body .n b {{ color:var(--ink2) }}
.body .q {{ border-left:3px solid var(--line); padding-left:12px; font-size:14.5px; color:var(--ink2); font-style:normal }}

.shots {{ display:flex; gap:12px; margin:14px 0 4px; overflow-x:auto; padding-bottom:6px;
  scroll-snap-type:x mandatory }}
.shots figure {{ margin:0; flex:0 0 auto; scroll-snap-align:start }}
.shots img {{ display:block; width:min(300px, 74vw); height:auto; border:1px solid var(--line);
  border-radius:12px; background:var(--bg) }}
.shots figcaption {{ margin-top:6px; font-size:12.5px; color:var(--ink3); text-align:center }}

.pick {{ display:flex; gap:8px; margin-top:14px }}
.pick button {{ flex:1; font:inherit; font-size:14.5px; font-weight:600; padding:11px 6px;
  border:1px solid var(--line); border-radius:11px; background:transparent; color:var(--ink2);
  cursor:pointer; -webkit-tap-highlight-color:transparent }}
.pick button:focus-visible {{ outline:2px solid var(--brand); outline-offset:2px }}
.pick button[aria-pressed="true"][data-v="좋다"] {{ background:var(--ok-bg); border-color:var(--ok); color:var(--ok) }}
.pick button[aria-pressed="true"][data-v="고칠 것"] {{ background:var(--fix-bg); border-color:var(--fix); color:var(--fix) }}
.pick button[aria-pressed="true"][data-v="모르겠다"] {{ background:var(--hm-bg); border-color:var(--hm); color:var(--hm) }}

.memo {{ width:100%; margin-top:9px; font:inherit; font-size:14.5px; color:var(--ink);
  background:var(--bg); border:1px solid var(--line); border-radius:11px; padding:9px 11px; resize:vertical }}
.memo::placeholder {{ color:var(--ink3) }}

.foot {{ position:sticky; bottom:0; margin-top:4px; background:var(--card);
  border:1px solid var(--line); border-radius:16px; padding:14px 16px; box-shadow:var(--shadow) }}
.count {{ font-size:14px; color:var(--ink2); font-variant-numeric:tabular-nums }}
.foot button {{ width:100%; margin-top:10px; font:inherit; font-size:16px; font-weight:700;
  padding:14px; border:0; border-radius:12px; background:var(--brand); color:var(--card); cursor:pointer }}
.foot button:active {{ transform:translateY(1px) }}
#out {{ width:100%; margin-top:10px; font:inherit; font-size:13.5px; line-height:1.6; color:var(--ink);
  background:var(--bg); border:1px solid var(--line); border-radius:11px; padding:11px;
  white-space:pre-wrap; -webkit-user-select:all; user-select:all }}
.hint {{ margin:8px 0 0; font-size:13px; color:var(--ink3) }}
@media (prefers-reduced-motion: reduce) {{ * {{ transition:none !important }} }}
</style>

<div class=wrap>
<header>
  <h1>가져오기 검수판</h1>
  <p class=lead>다시 만든 가져오기 화면이랑, 내가 눈으로 열어 보고 걸린 것 넷.</p>
  <span class=stamp>hold/가져오기-0828 · 2026-08-29</span>
</header>

<div class=warn>
  <p><b>먼저 알아 둘 것 — 이 판의 바닥은 v11.70 이야.</b></p>
  <p>지금 나가 있는 앱은 <b>v11.89</b>. 이 브랜치는 8/28에 갈라져서 <b>19판 낡은 바닥</b> 위에 새 가져오기가 얹혀 있어.
  그래서 화면에 보이는 <b>다른 부분</b>(문체·글자 크기 같은 것)은 지금 앱과 다를 수 있어 — 거긴 판정 안 해도 돼.
  <b>가져오기 화면만</b> 봐 줘. 내보낼 땐 지금 앱 위로 다시 얹을 거야.</p>
</div>

{본문}

<div class=foot>
  <div class=count id=count>0 / 7 골랐어</div>
  <button type=button id=copy>복사하기</button>
  <div id=out hidden></div>
  <p class=hint id=hint hidden>복사가 안 되면 위 글자를 길게 눌러서 복사해 줘.</p>
</div>
</div>

<script>
const KEY = 'hankki:검수:가져오기-0828';
const cards = [...document.querySelectorAll('.card')];
let 저장 = {{}};
try {{ 저장 = JSON.parse(localStorage.getItem(KEY) || '{{}}') }} catch {{ 저장 = {{}} }}

function 쓰기() {{
  try {{ localStorage.setItem(KEY, JSON.stringify(저장)) }} catch {{ /* 사생활 모드 */ }}
  const n = cards.filter(c => 저장[c.dataset.id]?.v).length;
  document.getElementById('count').textContent = n + ' / ' + cards.length + ' 골랐어';
}}

for (const c of cards) {{
  const id = c.dataset.id;
  const 값 = 저장[id] || {{}};
  const memo = c.querySelector('.memo');
  memo.value = 값.m || '';
  for (const b of c.querySelectorAll('.pick button')) {{
    b.setAttribute('aria-pressed', String(값.v === b.dataset.v));
    b.addEventListener('click', () => {{
      const 켬 = b.getAttribute('aria-pressed') === 'true';
      for (const x of c.querySelectorAll('.pick button')) x.setAttribute('aria-pressed', 'false');
      if (!켬) b.setAttribute('aria-pressed', 'true');
      저장[id] = {{ ...(저장[id] || {{}}), v: 켬 ? '' : b.dataset.v }};
      쓰기();
    }});
  }}
  memo.addEventListener('input', () => {{ 저장[id] = {{ ...(저장[id] || {{}}), m: memo.value }}; 쓰기() }});
}}
쓰기();

document.getElementById('copy').addEventListener('click', async () => {{
  const 줄 = ['[가져오기 검수판 · hold/가져오기-0828]'];
  for (const c of cards) {{
    const id = c.dataset.id, 값 = 저장[id] || {{}};
    const 제목 = c.querySelector('h2').textContent.trim();
    줄.push(id + '. ' + 제목 + ' → ' + (값.v || '(안 고름)') + (값.m ? ' / ' + 값.m : ''));
  }}
  const 글 = 줄.join('\\n');
  const out = document.getElementById('out');
  out.textContent = 글; out.hidden = false;
  // ⛔ writeText 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97) → 늘 글자를 남겨 둔다
  let 됐다 = false;
  try {{ await navigator.clipboard.writeText(글); 됐다 = true }} catch {{ 됐다 = false }}
  document.getElementById('hint').hidden = false;
  if (됐다) document.getElementById('hint').textContent = '복사했어. 안 됐으면 위 글자를 길게 눌러서 복사해 줘.';
  else {{
    const r = document.createRange(); r.selectNodeContents(out);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.getElementById('hint').textContent = '자동 복사가 막혔어 — 위 글자를 길게 눌러서 복사해 줘.';
  }}
  out.scrollIntoView({{ block: 'nearest' }});
}});
</script>'''

낼것.write_text(HTML, encoding='utf-8')
print('냈다:', 낼것, f'{낼것.stat().st_size/1024:.0f}KB')
