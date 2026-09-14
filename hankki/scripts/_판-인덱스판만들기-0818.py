#!/usr/bin/env python3
# 🔖 「인덱스 만져보기」 판 만들기 (2026-08-18)
#
# 📮 창업자 *"내가 앱에서 안써봐서 모르겠어."* · *"클립종류도 앱에서 좀 붙여봐야 예쁜게 뭔지 알 것 같아"*
#
# ⭐⭐ 판에 얹는 것은 **진짜 앱 스크린샷**이다(`_판-인덱스만져보기-0818.mjs` 가 찍는다).
#    ⛔ CSS 로 앱을 흉내 내지 않는다 — 그러면 창업자가 «내가 만든 것»을 판정하게 된다(규칙 30).
#
# ⛔ 결과 HTML 은 **scratchpad** 에 만든다 — 저장소가 public 이라서.
#    ⭐ 만드는 «도구»는 저장소에 둔다 — scratchpad 에 두면 세션과 함께 날아가고 다음에 또 새로 짠다.
#
# 실행: python3 hankki/scripts/_판-인덱스판만들기-0818.py
import base64, json, os

SCRATCH = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
SHOTS = f'{SCRATCH}/인덱스판'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{SCRATCH}/인덱스-만져보기.html'

메타 = json.load(open(f'{SHOTS}/목록.json'))
크기들 = 메타['크기들']
컷목록 = 메타['컷목록']

def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()

샷 = {f'{g}-{px}': b64(f'{SHOTS}/{g}-{px}.webp', 'image/webp') for g in ('small', 'big') for px in 크기들}
폴더 = {'cl': f'{ROOT}/docs/stickers/클립인덱스-창업자-2026-08-18/낱개',
        'ck': f'{ROOT}/docs/stickers/요리소품-창업자-2026-08-17/낱개'}
클립 = [{**c, '그림': b64(f"{폴더[c['k'][:2]]}/{c['k']}.png", 'image/png')} for c in 컷목록]

# 실측값 — 「제일 많이 가린 꾸미기 조각 %」(작은 격자 · 콩국수 표지). 26·30 은 사이값을 보간하지 않고 잰 값만.
가림 = {26: None, 28: 4, 30: None, 32: 8, 34: None, 36: 17}

단추 = '\n'.join(
    f'<button class="sz{" on" if px == 30 else ""}" data-px="{px}" type="button">'
    f'<span class="n">{px}</span><span class="u">px</span></button>' for px in 크기들)

샷태그 = '\n'.join(
    f'<img class="shot" data-key="{k}" src="{v}" alt="인덱스 {k.split("-")[1]}px 를 얹은 레시피 목록 화면" loading="eager">'
    for k, v in 샷.items())

클립칸 = '\n'.join(
    f'<figure class="clip"><img src="{c["그림"]}" alt="{c["이름"]}"><figcaption>'
    f'<b>{i+1}</b> {c["이름"]}<small>{c["k"]}</small></figcaption></figure>'
    for i, c in enumerate(클립))

가림줄 = ' · '.join(f'{px}px {v}%' for px, v in 가림.items() if v is not None)

HTML = f'''<title>인덱스 크기 고르기</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Gowun+Dodum&display=swap">
<style>
:root {{
  --ink:      #3d2a18;
  --ink-sub:  #8a7863;
  --paper:    #faf6ee;
  --card:     #fffdf8;
  --brown:    #5d3410;
  --sage:     #6f8259;
  --sage-소프트: #e6ecdd;
  --line:     #e4dbc9;
  --shadow:   0 2px 10px rgba(93,52,16,.09);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --ink:     #f0e6d6;
    --ink-sub: #a1927e;
    --paper:   #241c14;
    --card:    #302519;
    --brown:   #e8c9a0;
    --sage:    #a9bd92;
    --sage-소프트: #37432c;
    --line:    #43331f;
    --shadow:  0 2px 12px rgba(0,0,0,.4);
  }}
}}
:root[data-theme="dark"] {{
  --ink: #f0e6d6; --ink-sub: #a1927e; --paper: #241c14; --card: #302519;
  --brown: #e8c9a0; --sage: #a9bd92; --sage-소프트: #37432c; --line: #43331f;
  --shadow: 0 2px 12px rgba(0,0,0,.4);
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: "Gowun Dodum", -apple-system, "Apple SD Gothic Neo", sans-serif;
  font-size: 15px; line-height: 1.65;
  -webkit-text-size-adjust: 100%;
}}
/* ⬇ 조종판이 화면 «아래»에 고정이라 그만큼 비워 둔다 */
.wrap {{ max-width: 460px; margin: 0 auto; padding: 22px 16px 178px; }}

h1 {{
  font-family: Gaegu, "Gowun Dodum", sans-serif; font-weight: 700;
  font-size: 34px; line-height: 1.2; margin: 0 0 4px; color: var(--brown);
  text-wrap: balance; letter-spacing: -.01em;
}}
.lede {{ margin: 0 0 20px; color: var(--ink-sub); font-size: 14px; }}

/* — 조종판: 화면 «아래»에 고정 —
   ⛔ 처음엔 위에 sticky 로 뒀는데, 스크롤을 내리면 「클립 일곱」 제목을 덮었다.
   ⭐ 아래로 내리니 두 가지가 같이 풀린다 — 내용을 안 가리고, **엄지가 닿는 자리**가 된다. */
.panel {{
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  background: var(--paper); border-top: 1px solid var(--line);
  padding: 11px 16px calc(13px + env(safe-area-inset-bottom));
  box-shadow: 0 -6px 18px rgba(61,42,24,.08);
}}
.panel > * {{ max-width: 428px; margin-inline: auto; }}
.label {{
  font-size: 11px; letter-spacing: .14em; color: var(--ink-sub);
  margin: 0 0 7px; text-transform: uppercase;
}}
.sizes {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }}
.sz {{
  appearance: none; border: 1.5px solid var(--line); background: var(--card);
  color: var(--ink); border-radius: 11px; padding: 9px 0 7px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  font-family: inherit; transition: background .13s, border-color .13s, color .13s;
}}
.sz .n {{ font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }}
.sz .u {{ font-size: 10px; color: var(--ink-sub); }}
.sz.on {{ background: var(--brown); border-color: var(--brown); color: var(--card); }}
.sz.on .u {{ color: var(--card); opacity: .75; }}
.sz:focus-visible {{ outline: 3px solid var(--sage); outline-offset: 2px; }}

.grids {{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 9px; }}
.gd {{
  appearance: none; border: 1.5px solid var(--line); background: var(--card);
  color: var(--ink-sub); border-radius: 11px; padding: 8px 0; cursor: pointer;
  font-family: inherit; font-size: 13px; transition: background .13s, color .13s, border-color .13s;
}}
.gd.on {{ background: var(--sage-소프트); border-color: var(--sage); color: var(--ink); font-weight: 700; }}
.gd:focus-visible {{ outline: 3px solid var(--sage); outline-offset: 2px; }}

/* — 앱 화면: 사진을 겹쳐두고 투명도만 바꾼다 → 보던 자리가 안 튄다 — */
.stage {{
  position: relative; border-radius: 16px; overflow: hidden;
  border: 1px solid var(--line); box-shadow: var(--shadow); background: var(--card);
}}
.stage::after {{
  content: ""; position: absolute; inset: 0; pointer-events: none;
  border-radius: 16px; box-shadow: inset 0 0 0 1px rgba(93,52,16,.05);
}}
.shot {{
  display: block; width: 100%; height: auto;
  position: absolute; inset: 0; opacity: 0; transition: opacity .1s linear;
}}
.shot.live {{ position: relative; opacity: 1; }}
@media (prefers-reduced-motion: reduce) {{ .shot {{ transition: none; }} }}

.note {{
  margin: 16px 0 0; padding: 13px 15px; background: var(--card);
  border: 1px solid var(--line); border-left: 3px solid var(--sage);
  border-radius: 4px 12px 12px 4px; font-size: 13.5px; color: var(--ink-sub);
}}
.note b {{ color: var(--ink); }}

h2 {{
  font-family: Gaegu, "Gowun Dodum", sans-serif; font-weight: 700;
  font-size: 25px; margin: 34px 0 3px; color: var(--brown);
}}
h2 + p {{ margin: 0 0 14px; color: var(--ink-sub); font-size: 13.5px; }}

.clips {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }}
.clip {{
  margin: 0; background: var(--card); border: 1px solid var(--line);
  border-radius: 13px; padding: 12px 6px 10px; text-align: center;
}}
.clip img {{ display: block; height: 74px; width: auto; margin: 0 auto 8px; }}
.clip figcaption {{ font-size: 11.5px; line-height: 1.45; color: var(--ink); }}
.clip b {{
  display: inline-flex; align-items: center; justify-content: center;
  width: 17px; height: 17px; border-radius: 50%; background: var(--sage-소프트);
  color: var(--ink); font-size: 10.5px; margin-right: 3px; vertical-align: 1px;
}}
.clip small {{ display: block; color: var(--ink-sub); font-size: 10px; margin-top: 2px; }}

.ask {{ margin: 30px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }}
.ask li {{
  background: var(--card); border: 1px solid var(--line); border-radius: 13px;
  padding: 13px 15px; font-size: 14px;
}}
/* ⛔ `.ask b` 로 잡았더니 **문장 «안»의 굵은 글씨까지 블록이 되어 줄이 뚝뚝 끊겼다.**
   ⭐ 제목 노릇을 하는 건 «첫 자식» 하나뿐이다. */
.ask > li > b:first-child {{ color: var(--brown); display: block; margin-bottom: 2px; }}
.ask b {{ color: var(--ink); }}
.foot {{ margin-top: 34px; padding-top: 16px; border-top: 1px solid var(--line);
        font-size: 12px; color: var(--ink-sub); }}
</style>

<div class="wrap">
  <h1>인덱스 크기 고르기</h1>
  <p class="lede">숫자를 눌러서 바꿔봐. 밑에 있는 건 <b>진짜 앱 화면</b>이야 — 크기만 갈아끼워서 찍었어.</p>

  <div class="panel">
    <p class="label">크기 — 눌러서 바꿔봐</p>
    <div class="sizes">{단추}</div>
    <div class="grids">
      <button class="gd on" data-grid="small" type="button">작은 격자 · 3줄</button>
      <button class="gd" data-grid="big" type="button">큰 격자 · 2줄</button>
    </div>
  </div>

  <div class="stage">{샷태그}</div>

  <p class="note">
    화면 <b>위 7개</b>는 꾸민 표지, <b>가운데 7개</b>는 기본 표지, <b>맨 아래 4개</b>는 인덱스를 안 건 칸이야.
    안 건 칸이 <b>텅 비는 게</b> 어떻게 보이는지도 같이 봐줘.
  </p>

  <h2>클립 일곱</h2>
  <p>화면에 나오는 순서 그대로. 이름은 내가 임의로 붙였어.</p>
  <div class="clips">{클립칸}</div>

  <h2>정할 것</h2>
  <ul class="ask">
    <li><b>크기 하나</b>작은 격자 기준으로 골라줘. 큰 격자는 같은 값으로 맞출 수도 있고 조금 키울 수도 있어.</li>
    <li><b>클립 몇 개를 쓸까</b>하나만 쓸지, 여러 개 중에 고르게 할지. <b>여러 개면 「고르는 화면」이 필요해</b> — 그게 「해먹을 것 / 맛있었던 것」이랑 같은 화면이 돼.</li>
    <li><b>붙이는 법</b>지금은 카드 오른쪽 위를 톡 누르면 걸려. 근데 안 건 칸이 텅 비면 누를 게 없어져서, <b>길게 누르기</b>나 <b>레시피 안</b>으로 옮겨야 해.</li>
  </ul>

  <p class="foot">
    꾸미기를 얼마나 가리나 (작은 격자 · 콩국수 표지 실측) — {가림줄} · 40px 48% · 44px 80%.<br>
    큰 격자는 44px 에서도 5%라 여유가 있어.
  </p>
</div>

<script>
(function () {{
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var px = 30, grid = 'small';

  function show() {{
    var key = grid + '-' + px;
    shots.forEach(function (s) {{ s.classList.toggle('live', s.dataset.key === key); }});
  }}
  document.querySelectorAll('.sz').forEach(function (b) {{
    b.addEventListener('click', function () {{
      px = +b.dataset.px;
      document.querySelectorAll('.sz').forEach(function (o) {{ o.classList.toggle('on', o === b); }});
      show();
    }});
  }});
  document.querySelectorAll('.gd').forEach(function (b) {{
    b.addEventListener('click', function () {{
      grid = b.dataset.grid;
      document.querySelectorAll('.gd').forEach(function (o) {{ o.classList.toggle('on', o === b); }});
      show();
    }});
  }});
  show();
}})();
</script>
'''

open(OUT, 'w').write(HTML)
print(f'✅ {OUT}  ({os.path.getsize(OUT) // 1024}KB · 사진 {len(샷)}장 · 클립 {len(클립)}컷)')
