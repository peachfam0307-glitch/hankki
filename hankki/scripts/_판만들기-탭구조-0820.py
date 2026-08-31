#!/usr/bin/env python3
# 🧭 탭 구조 판 만들기 — 「냉장고에 닿는 길」 갈래 셋 (2026-08-20)
#
# 📮 창업자 = *"네가 냉장고가 약하다고 해서.. 탭 개선 말한거였거든"*
#    ⭐⭐ 이 한 마디가 방향을 바로잡았다 — 내가 「탭을 어떻게 배치하나」로 넓히고 있었는데
#       진짜 목적은 **「영수증 찍으면 냉장고에 자동으로」에 닿는 길을 짧게** 하는 것이다.
#
# ☑️ 절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사
#
# 실행: cd /home/user/hankki/hankki && python3 scripts/_판만들기-탭구조-0820.py
import base64, pathlib, html

SHOT = pathlib.Path('/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/탭구조')
OUT = pathlib.Path('/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/탭구조판.html')

def b64(p):
    f = SHOT / p
    if not f.exists():
        raise SystemExit(f'⛔ 없다: {f}')
    return 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode()

# 갈래 — ⛔「목적을 안 푸는」 갈래(일기 빼기·레꾸자랑만 빼기)는 뺐다. 이유는 판 아래에 적는다.
CASES = [
    dict(id='now', 기호='지금', 이름='그대로 둔다',
         한줄='장보기 탭 → 냉장고 토글 → 영수증',
         단계='3단계', 폭390='65px', 폭320='53.3px',
         좋=['바꿀 게 0', '이미 창업자가 OK 한 화면'],
         나=['영수증까지 <b>세 번</b> 눌러야 한다', '홈 어디에도 냉장고 입구가 <b>없다</b>'],
         바390='390-0-지금-바.png', 바320='320-0-지금-바.png'),
    dict(id='ga', 기호='㉠', 이름='레꾸자랑 자리에 냉장고',
         한줄='레꾸자랑을 레시피 탭 안 세그먼트로 내리고, 그 칸을 냉장고가 쓴다',
         단계='2단계', 폭390='65px', 폭320='53.3px',
         좋=['칸 수가 <b>안 늘어난다</b>(여섯 그대로)', '레꾸자랑도 「내 레시피 고르기」로 시작해서 <b>레시피 탭과 재료가 같다</b> — 창업자 직관이 코드로도 맞았다',
             '레시피 탭이 이미 [모아보기｜한끼 일기] 세그먼트라 <b>셋째를 얹기만</b> 하면 된다'],
         나=['레꾸자랑은 <b>바이럴 진입점</b>인데 세그먼트로 내려가면 묻힐 수 있다',
             '「일기」가 하단바에도 있고 레시피 탭 안에도 있어서 <b>이미 헷갈리는데</b> 하나 더 얹힌다'],
         바390='390-가-레꾸자랑을-레시피안으로-바.png', 바320='320-가-레꾸자랑을-레시피안으로-바.png'),
    dict(id='ma', 기호='㉤', 이름='아무것도 안 빼고 일곱째로',
         한줄='지금 여섯 그대로 두고 냉장고를 하나 더 붙인다',
         단계='2단계', 폭390='55.7px', 폭320='45.7px',
         좋=['<b>잃는 게 0</b> — 아무 화면도 안 옮긴다', '제일 적게 건드린다'],
         나=['320px 폰에서 한 칸 <b>45.7px</b> — 손가락 기준(44px)은 넘지만 <b>아슬아슬</b>하다',
             '실물로 보면 글자가 <b>빽빽</b>하다(안 깨지지만 붙어 보인다)',
             '탭이 일곱이면 「뭐가 중요한지」가 흐려진다'],
         바390='390-마-일곱째로-냉장고-바.png', 바320='320-마-일곱째로-냉장고-바.png'),
]

css = """
:root{--bg:#F6F2EA;--card:#fff;--ink:#33261A;--dim:#8B7B69;--line:#E7DFD2;--brown:#5D3410;
--blue:#5878A0;--bluebg:#EAF1F6;--olive:#7A8B5A;--olivebg:#EFF2E7;--warn:#A8734A;--warnbg:#F6EDE3;--ghost:#F0EBE1}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1F1913;--card:#2B231B;--ink:#EFE6D9;--dim:#A3937F;
--line:#413428;--brown:#D9B892;--blue:#9CBBD1;--bluebg:#2A3843;--olive:#A8BC84;--olivebg:#2E3626;--warn:#D3A277;--warnbg:#3A2E23;--ghost:#332920}}
:root[data-theme="dark"]{--bg:#1F1913;--card:#2B231B;--ink:#EFE6D9;--dim:#A3937F;--line:#413428;--brown:#D9B892;
--blue:#9CBBD1;--bluebg:#2A3843;--olive:#A8BC84;--olivebg:#2E3626;--warn:#D3A277;--warnbg:#3A2E23;--ghost:#332920}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.65;-webkit-text-size-adjust:100%;
font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:22px 15px 90px}
h1{font-size:25px;margin:0 0 5px;letter-spacing:-.02em;text-wrap:balance}
.sub{color:var(--dim);font-size:14px;margin:0 0 20px}
.why{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:17px 17px;margin:0 0 12px}
.why .q{background:var(--ghost);border-radius:11px;padding:10px 13px;font-size:13.5px;color:var(--dim);margin:0 0 10px;line-height:1.6}
.why p{margin:0;font-size:14.5px}
.why b{color:var(--brown)}
.tbl{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0 0}
.tbl th,.tbl td{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left;vertical-align:top}
.tbl th{color:var(--dim);font-weight:700;font-size:11.5px;white-space:nowrap}
.tbl code{font-size:11.5px;color:var(--blue)}
h2{font-size:15px;margin:26px 0 10px;color:var(--dim)}
.case{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 16px 14px;margin:11px 0}
.case.sel{border-color:var(--brown);border-width:2px}
.hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 3px}
.hd .sym{font-size:19px;font-weight:800;color:var(--brown)}
.hd .nm{font-size:17px;font-weight:800}
.hd .step{margin-left:auto;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:20px;background:var(--bluebg);color:var(--blue);white-space:nowrap}
.line{font-size:13.5px;color:var(--dim);margin:0 0 11px}
.shot{margin:9px 0 0}
.shot img{width:100%;display:block;border:1px solid var(--line);border-radius:10px;background:var(--ghost)}
.shot .cap{font-size:11px;color:var(--dim);margin:4px 0 0;font-variant-numeric:tabular-nums}
.two{display:grid;grid-template-columns:1fr;gap:10px}
@media(min-width:560px){.two{grid-template-columns:1fr 1fr}}
ul{margin:8px 0 0;padding-left:17px;font-size:13.5px}
li{margin:3px 0}
.good li::marker{color:var(--olive)}
.bad li::marker{color:var(--warn)}
.lbl{font-size:11.5px;font-weight:800;margin:11px 0 0}
.lbl.g{color:var(--olive)}
.lbl.b{color:var(--warn)}
.pick{display:flex;gap:7px;margin:13px 0 0;flex-wrap:wrap}
.pick button{flex:1;min-width:88px;padding:9px 6px;border-radius:11px;border:1.5px solid var(--line);
background:transparent;color:var(--dim);font-size:13px;font-weight:800;font-family:inherit;cursor:pointer}
.pick button[aria-pressed="true"]{background:var(--brown);border-color:var(--brown);color:var(--bg)}
.note{margin:24px 0 0;background:var(--warnbg);border-radius:14px;padding:15px 16px;font-size:13.5px;color:var(--warn);line-height:1.65}
.note b{color:var(--warn)}
.note h3{margin:0 0 7px;font-size:14px;color:var(--warn)}
.out{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
padding:11px 14px calc(11px + env(safe-area-inset-bottom));display:flex;gap:9px;align-items:center}
.out .n{font-size:12.5px;color:var(--dim);flex:1}
.out button{padding:10px 17px;border-radius:11px;border:none;background:var(--brown);color:var(--bg);
font-size:13.5px;font-weight:800;font-family:inherit;cursor:pointer}
#copied{position:fixed;left:50%;transform:translateX(-50%);bottom:78px;background:var(--ink);color:var(--bg);
padding:9px 16px;border-radius:20px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none}
#copied.on{opacity:1}
#area{position:fixed;left:-9999px;white-space:pre-wrap}
"""

def esc(s): return html.escape(s, quote=False)

cards = []
for c in CASES:
    good = ''.join(f'<li>{g}</li>' for g in c['좋'])
    bad = ''.join(f'<li>{b}</li>' for b in c['나'])
    cards.append(f"""
<div class="case" data-id="{c['id']}" data-name="{esc(c['기호'])} {esc(c['이름'])}">
  <div class="hd"><span class="sym">{esc(c['기호'])}</span><span class="nm">{esc(c['이름'])}</span>
    <span class="step">영수증까지 {esc(c['단계'])}</span></div>
  <p class="line">{esc(c['한줄'])}</p>
  <div class="two">
    <div class="shot"><img src="{b64(c['바390'])}" alt=""><p class="cap">보통 폰 390px — 한 칸 {esc(c['폭390'])}</p></div>
    <div class="shot"><img src="{b64(c['바320'])}" alt=""><p class="cap">제일 작은 폰 320px — 한 칸 {esc(c['폭320'])}</p></div>
  </div>
  <p class="lbl g">좋은 점</p><ul class="good">{good}</ul>
  <p class="lbl b">걸리는 점</p><ul class="bad">{bad}</ul>
  <div class="pick" role="group">
    <button type="button" data-v="좋다">좋다</button>
    <button type="button" data-v="버린다">버린다</button>
    <button type="button" data-v="모르겠다">모르겠다</button>
  </div>
</div>""")

doc = f"""<title>냉장고에 닿는 길</title>
<style>{css}</style>
<div class="wrap">
<h1>냉장고에 닿는 길</h1>
<p class="sub">탭 구조 갈래 셋 — 실물 하단바로 찍었어</p>

<div class="why">
  <div class="q">“네가 냉장고가 약하다고 해서.. <b>탭 개선</b> 말한거였거든”</div>
  <p>맞아. 그래서 <b>「탭을 어떻게 배치하나」가 아니라 「영수증 찍으면 냉장고에 자동으로 들어간다에
  닿는 길을 짧게」</b>로 좁혔어.</p>
  <table class="tbl">
    <tr><th>지금 어디에</th><td>영수증 버튼은 <b>냉장고 화면 안</b>에만 있어 (<code>PantryView.jsx</code>)</td></tr>
    <tr><th>몇 단계</th><td>장보기 탭 → 냉장고 토글 → 영수증 = <b>3단계</b></td></tr>
    <tr><th>홈에는</th><td>냉장고·영수증 입구가 <b>하나도 없다</b></td></tr>
  </table>
</div>

<div class="note">
  <h3>⛔ 네가 전에 정한 것 둘 — 이것부터 안 부딪히게 했어</h3>
  <p style="margin:0 0 6px"><b>①</b> <code style="color:inherit">ShopScreen.jsx</code> — “냉장고 기능은 유지하되 <b>앞으로 안 내세운다</b>”</p>
  <p style="margin:0 0 9px"><b>②</b> <code style="color:inherit">PantryView.jsx</code> — 네 말 그대로:
  “영수증스캔이 버튼이 더 커서. <b>영수증 스캔하는 탭이라고 생각할 것 같아.</b>”</p>
  <p style="margin:0"><b>그래서 「홈에 영수증 카드를 크게 넣는 안」은 뺐어.</b> ②와 정면으로 부딪히고,
  오늘 네가 <i>“몰려있어서 산만해보이고 지저분”</i> 이라고 해서 홈을 줄인 것과도 반대야.<br>
  <b>「내세우지 않는다」와 「알린다」는 다른 말</b>이라, 크게 만들지 않되 <b>닿는 길만 짧게</b> 하는 갈래만 남겼어.</p>
</div>

<h2>갈래 셋 — 하나 골라줘</h2>
{''.join(cards)}

<div class="note" style="background:var(--ghost);color:var(--dim)">
  <h3 style="color:var(--dim)">뺀 갈래 둘 — 왜 안 넣었나</h3>
  <p style="margin:0 0 6px"><b>일기 탭을 빼고 냉장고를</b> — 일기 탭은 네가
  <i>“일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까”</i> 라고 <b>일부러 넣은 탭</b>이야(v9.94). 되돌리면 안 돼.</p>
  <p style="margin:0"><b>레꾸자랑만 빼고 다섯 칸으로</b> — 칸은 넓어지는데(64→78px)
  <b>냉장고 문제를 하나도 안 푼다.</b> 목적에서 벗어나.</p>
</div>

<div class="out">
  <span class="n" id="cnt">0 / {len(CASES)} 골랐어</span>
  <button type="button" id="copy">복사하기</button>
</div>
<div id="copied">복사했어</div>
<textarea id="area" readonly></textarea>
</div>
<script>
var KEY='hankki:판정:탭구조0820';
var saved={{}};
try{{saved=JSON.parse(localStorage.getItem(KEY)||'{{}}')}}catch(e){{saved={{}}}}
var cases=[].slice.call(document.querySelectorAll('.case'));
function paint(){{
  var n=0;
  cases.forEach(function(el){{
    var id=el.dataset.id,v=saved[id];
    if(v)n++;
    el.classList.toggle('sel',v==='좋다');
    [].slice.call(el.querySelectorAll('.pick button')).forEach(function(b){{
      b.setAttribute('aria-pressed', b.dataset.v===v ? 'true':'false');
    }});
  }});
  document.getElementById('cnt').textContent=n+' / '+cases.length+' 골랐어';
}}
cases.forEach(function(el){{
  [].slice.call(el.querySelectorAll('.pick button')).forEach(function(b){{
    b.addEventListener('click',function(){{
      var id=el.dataset.id;
      saved[id] = (saved[id]===b.dataset.v) ? null : b.dataset.v;
      if(!saved[id])delete saved[id];
      try{{localStorage.setItem(KEY,JSON.stringify(saved))}}catch(e){{}}
      paint();
    }});
  }});
}});
paint();
document.getElementById('copy').addEventListener('click',function(){{
  var out=['[탭 구조 — 냉장고에 닿는 길] 판정'];
  cases.forEach(function(el){{
    var v=saved[el.dataset.id];
    out.push('· '+el.dataset.name+' — '+(v||'(안 고름)'));
  }});
  var t=out.join('\\n');
  var ta=document.getElementById('area');
  ta.value=t;
  var ok=false;
  // ⛔ clipboard.writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
  try{{ ta.select(); ta.setSelectionRange(0,t.length); ok=document.execCommand('copy'); }}catch(e){{ ok=false }}
  if(ok){{
    var c=document.getElementById('copied');
    c.classList.add('on'); setTimeout(function(){{c.classList.remove('on')}},1400);
  }} else {{
    // 못 복사하면 «글자를 골라 준다» — 길게 눌러 복사하게
    ta.style.position='static';ta.style.left='auto';ta.style.width='100%';ta.style.height='120px';
    ta.style.marginTop='10px';ta.style.fontSize='13px';ta.select();
  }}
}});
</script>"""

OUT.write_text(doc, encoding='utf-8')
print(f'✅ {OUT}  ({len(doc)//1024}KB)')
