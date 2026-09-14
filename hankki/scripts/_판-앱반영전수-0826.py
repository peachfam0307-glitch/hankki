# 📋 「창업자가 준 컷인데 앱에 «안» 들어간 것」 전수 판 — 2026-08-26
#
# 📮 창업자 = *"앱에 지금까지 몇컷 반영되었는데 전수검사해. 내가 보기에 많이 반영안 된 것 같고,
#            소스그릇도 그대로야."* → *"정확하지 않을 것 같으면 내가 볼게 **검수판만들어**"*
#
# ⭐ 칸마다 «지금 앱에 뜨는 그림» ↔ «창업자 컷» 을 나란히 놓는다.
#    ⛔ 「무엇이 있나」가 아니라 **「그 요리를 앱에서 열면 무엇이 뜨나」**를 보여준다 —
#       앱 키는 흉내내지 않고 **`guessFoodIcon` 을 그대로 불러서** 얻었다(절대원칙 30).
#
# 👀 ＋ 접시 아래를 **4배로** 붙인다. 8/26 에 560px 판을 보고 「멀쩡하다」고 잘못 판단했다(절대원칙 21).
#    ⛔ 4배로 «키운 뒤» 좁은 칸에 밀어 넣으면 도로 줄어든다 → **크롭해서 한 줄 전체로.**
#
# ☑️ 절대원칙 = 검수판은 무조건 **체크 ＋ 복사**(창업자 2026-08-19)
#
# 씀:  python3 scripts/_판-앱반영전수-0826.py   → /tmp/…/판-앱반영전수.html
import base64, glob, hashlib, html, io, json, os, re, sys
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
스티커 = f'{APP}/docs/stickers'
앱컷 = f'{APP}/src/assets/stickers/photo'
낼곳 = sys.argv[1] if len(sys.argv) > 1 else '/tmp/판-앱반영전수.html'

# ⭐⭐ 진한 판 색 = tools/cut-check.py 의 DARK_PANEL 과 «같은 값».
#    📮 창업자 = *"판을 어둡게 뽑아야 내가 알지"* — 흰 접시를 흰 바탕에 얹으면 잘린 게 안 보인다.
DARK = (0x22, 0x26, 0x3A, 255)
버릴것 = re.compile(r'(-진한판|-빨간판|-실제크기|-크게|^_판-|^_|-원본$)')
앱키표 = json.load(open('/tmp/앱키.json'))


def 해시(p):
    return hashlib.sha1(open(p, 'rb').read()).hexdigest()


앱해시 = {해시(p) for p in glob.glob(f'{앱컷}/*.png')}


def 담기(im, 폭=300):
    im = im.convert('RGBA')
    if im.size[0] > 폭:
        im = im.resize((폭, max(1, round(im.size[1] * 폭 / im.size[0]))), Image.LANCZOS)
    바탕 = Image.new('RGBA', im.size, DARK)
    바탕.alpha_composite(im)
    b = io.BytesIO()
    바탕.convert('RGB').save(b, 'JPEG', quality=78, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def 아래4배(경로, 폭=140):
    """접시 아래 22% 를 «크롭해서» 4배로 — 키운 뒤 좁은 칸에 넣으면 도로 줄어든다."""
    im = Image.open(경로).convert('RGBA')
    w, h = im.size
    조각 = im.crop((0, int(h * 0.72), w, h))
    if 조각.size[0] > 폭:
        x = (조각.size[0] - 폭) // 2
        조각 = 조각.crop((x, 0, x + 폭, 조각.size[1]))
    조각 = 조각.resize((조각.size[0] * 4, 조각.size[1] * 4), Image.NEAREST)
    바탕 = Image.new('RGBA', 조각.size, DARK)
    바탕.alpha_composite(조각)
    b = io.BytesIO()
    바탕.convert('RGB').save(b, 'JPEG', quality=80, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


묶음 = [
    ('유지70', '8/24 「그대로 쓴다」고 판정한 70컷', f'{스티커}/창업자-2026-08-24/음식-유지70'),
    ('8월25일', '분식·간식 시트 — 6컷 중 토스트만 들어갔다', f'{스티커}/음식-창업자-2026-08-25/낱개'),
    ('2608', '옛 시트에서 남은 13컷', f'{스티커}/음식-창업자-2608/낱개'),
]

칸들 = []
for 묶음키, 묶음설명, 폴더 in 묶음:
    for p in sorted(glob.glob(f'{폴더}/**/*.png', recursive=True)):
        b = os.path.basename(p)[:-4]
        if 버릴것.search(b):
            continue
        if 해시(p) in 앱해시:
            continue                                   # 이미 들어간 것은 판정할 게 없다
        이름 = re.sub(r'^\d\d-\d\d-', '', b)
        앱키 = 앱키표.get(이름, 'default')
        앱길 = f'{앱컷}/{앱키}.png'
        칸들.append({
            'k': f'{묶음키}:{이름}',
            '이름': 이름,
            '묶음': 묶음키,
            '앱키': 앱키,
            '앱그림': 담기(Image.open(앱길)) if os.path.exists(앱길) else '',
            '새그림': 담기(Image.open(p)),
            '확대': 아래4배(p),
        })

print(f'📋 판정할 칸 {len(칸들)}개')

셀 = []
for c in 칸들:
    왼 = (f'<img src="{c["앱그림"]}" alt="">' if c['앱그림']
          else '<div class="none">그림 없음<br><b>도형</b>이 뜬다</div>')
    셀.append(f'''<article class="cell" data-k="{html.escape(c['k'])}" data-g="{c['묶음']}">
  <h3>{html.escape(c['이름'])}<span class="tag">{c['묶음']}</span></h3>
  <div class="pair">
    <figure><figcaption>지금 앱 <b>{html.escape(c['앱키'])}</b></figcaption>{왼}</figure>
    <figure class="new"><figcaption>창업자 컷 <b>안 들어감</b></figcaption><img src="{c['새그림']}" alt=""></figure>
  </div>
  <div class="zoom"><span>창업자 컷 접시 아래 · 4배</span><img src="{c['확대']}" alt=""></div>
  <div class="pick">
    <label><input type="radio" name="p_{html.escape(c['k'])}" value="갈아끼자"><span>갈아끼자</span></label>
    <label><input type="radio" name="p_{html.escape(c['k'])}" value="다시뽑자"><span>다시뽑자</span></label>
    <label><input type="radio" name="p_{html.escape(c['k'])}" value="모르겠다"><span>모르겠다</span></label>
  </div>
</article>''')

묶음수 = {k: sum(1 for c in 칸들 if c['묶음'] == k) for k, _, _ in 묶음}

HTML = f'''<title>앱에 안 들어간 컷</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
:root{{--bg:#fff;--card:#fff;--line:#5d3410;--hair:#e2d8ca;--ink:#2b1c10;--dim:#7a6552;
  --brown:#5d3410;--bad:#a33b2a;--good:#3f6b4f;--chip:#f6f1e9;--sel:#eef4ee}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#16120e;--card:#1e1913;
  --line:#c9a882;--hair:#3a3129;--ink:#f2eae0;--dim:#a2917f;--brown:#e0bd94;--bad:#e08a76;
  --good:#8fc0a1;--chip:#272019;--sel:#1d251f}}}}
:root[data-theme="dark"]{{--bg:#16120e;--card:#1e1913;--line:#c9a882;--hair:#3a3129;--ink:#f2eae0;
  --dim:#a2917f;--brown:#e0bd94;--bad:#e08a76;--good:#8fc0a1;--chip:#272019;--sel:#1d251f}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans KR',system-ui,sans-serif;
  font-size:15.5px;line-height:1.65;-webkit-text-size-adjust:100%}}
.wrap{{max-width:760px;margin:0 auto;padding:26px 14px 80px;display:flex;flex-direction:column;gap:18px}}
h1{{font-family:'Gowun Batang',serif;font-size:29px;margin:0;line-height:1.25;text-wrap:balance}}
h2{{font-family:'Gowun Batang',serif;font-size:20px;margin:0 0 8px}}
.eyebrow{{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:700;margin:0 0 8px}}
.sub{{color:var(--dim);font-size:14px;margin:6px 0 0}}
.plate{{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:16px 14px}}
p{{margin:0 0 10px}} p:last-child{{margin-bottom:0}}
b{{font-weight:700}} .bad{{color:var(--bad);font-weight:700}} .good{{color:var(--good);font-weight:700}}
table{{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 0}}
th,td{{text-align:left;padding:7px 6px;border-bottom:1px solid var(--hair)}}
td.n{{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}}
.cell{{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:12px 12px 10px}}
.cell.did{{background:var(--sel)}}
.cell h3{{font-family:'Gowun Batang',serif;font-size:17px;margin:0 0 9px;display:flex;
  align-items:center;gap:8px;flex-wrap:wrap}}
.tag{{font-family:'Noto Sans KR';font-size:11px;font-weight:700;background:var(--chip);
  color:var(--dim);border-radius:99px;padding:2px 9px}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}
figure{{margin:0}}
figcaption{{font-size:11.5px;color:var(--dim);margin-bottom:4px}}
figure img{{width:100%;border-radius:9px;border:1px solid var(--hair);display:block}}
figure.new img{{border:1.5px solid var(--line)}}
.none{{border:1px dashed var(--hair);border-radius:9px;padding:26px 6px;text-align:center;
  font-size:12.5px;color:var(--dim);line-height:1.5}}
.zoom{{margin-top:9px}}
.zoom span{{display:block;font-size:11.5px;color:var(--dim);margin-bottom:4px}}
.zoom img{{width:100%;border-radius:9px;border:1px solid var(--hair);display:block;
  image-rendering:pixelated}}
.pick{{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}}
.pick label{{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:5px;
  min-height:44px;border:1.5px solid var(--hair);border-radius:99px;cursor:pointer;font-size:13.5px;font-weight:700;white-space:nowrap}}
.pick input{{accent-color:var(--brown);width:16px;height:16px}}
.pick label:has(input:checked){{border-color:var(--line);background:var(--chip)}}
button{{font-family:inherit;font-size:14.5px;font-weight:700;cursor:pointer;border:1.5px solid var(--line);
  background:var(--brown);color:var(--bg);border-radius:999px;padding:10px 18px;min-height:44px}}
button.ghost{{background:var(--card);color:var(--ink)}}
button:focus-visible{{outline:2px solid var(--brown);outline-offset:2px}}
.row{{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}}
.bar{{flex:1;min-width:130px;height:8px;border-radius:99px;background:var(--chip);overflow:hidden}}
.bar i{{display:block;height:100%;background:var(--brown);width:0;transition:width .25s}}
.cnt{{font-variant-numeric:tabular-nums;font-weight:700}}
pre{{margin:10px 0 0;padding:12px;background:var(--chip);border-radius:10px;font-size:12.5px;
  white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Menlo,'Noto Sans KR',monospace}}
.sticky{{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0 8px;border-bottom:1px solid var(--hair)}}
.toast{{position:fixed;left:50%;bottom:20px;transform:translateX(-50%) translateY(12px);
  background:var(--brown);color:var(--bg);padding:11px 18px;border-radius:999px;font-weight:700;
  opacity:0;pointer-events:none;transition:.2s;z-index:9}}
.toast.on{{opacity:1;transform:translateX(-50%) translateY(0)}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important}}}}
</style>
<div class="wrap">
<header>
  <p class="eyebrow">2026-08-26 · 전수검사</p>
  <h1>앱에 안 들어간 컷</h1>
  <p class="sub">네 말이 맞았어 — 준 컷 467개 중 <b>252개(54%)만</b> 들어가 있어</p>
</header>

<section class="plate">
  <h2>전수로 센 결과</h2>
  <p style="font-size:14px;color:var(--dim)">파일 내용(해시)으로 맞췄어. 이름표도 키도 못 속인다.</p>
  <table>
    <tr><th>준 것</th><th class="n">반영</th><th>왜</th></tr>
    <tr><td>8/24 사진시트</td><td class="n">124 / 192</td><td>68컷은 접시 깨짐 → 다시 뽑기로</td></tr>
    <tr><td><b class="bad">8/24 유지70</b></td><td class="n bad">0 / 70</td><td><b>통째로 안 들어갔다</b> ← 소스 7종이 여기 있다</td></tr>
    <tr><td>8/24 다시뽑을것26</td><td class="n">0 / 26</td><td>손잡이 냄비 — 다시 뽑기로 했던 것</td></tr>
    <tr><td>8/25 분식·간식</td><td class="n bad">1 / 6</td><td>토스트만 들어갔다</td></tr>
    <tr><td>8/26 그릇</td><td class="n">75 / 108</td><td>33컷은 접시 깨짐 → 다시 뽑기로</td></tr>
    <tr><td>2608</td><td class="n">50 / 63</td><td>13컷이 남았다</td></tr>
  </table>
  <p style="margin-top:12px"><b>「소스그릇도 그대로야」 — 맞아.</b>
     앱은 아직 <b>8/14에 넣은 소스 컷</b>(fe_291~304)을 쓰고 있고,
     네가 8/24에 준 소스 7종(간장양념·땅콩버터·분짜·샐러드·범용종지 셋)은 <span class="bad">한 개도 안 들어갔어.</span></p>
</section>

<section class="plate">
  <h2>⚠️ 프롬프트 — 아까 준 두 줄에 반례가 있다</h2>
  <p>판을 만들다 <b>8/25 문서</b>를 봤는데 이렇게 적혀 있어 —
     <b>시트 17은 진갈색 테두리가 «있는데도» 파먹혔다.</b> 흰 여백이 25.9~31.9%였어.</p>
  <p>그 문서 결론은 <b>「테두리가 아니라 흰 여백이 성패를 가른다」</b>(상관 −0.796)이고,
     실제로 네가 <b>「음식이 그릇을 꽉 채우게」</b> 한 줄을 넣고 뽑은 8/25 시트는 <span class="good">6/6 깨끗</span>했어.</p>
  <p><b>내가 아까 그 문서를 안 읽고 프롬프트를 만들었어.</b> 내 잘못이야.
     오늘 잰 것(굽에 선 없는 칸 66/108)도 사실이지만, <b>그거 하나로는 부족해.</b></p>
  <p><b>그래서 프롬프트에 이 줄을 하나 더 붙여야 해</b> — 아래 복사 단추로 세 줄짜리를 받아 가.</p>
  <pre id="three">⛔ 그릇 「바깥 윤곽선」을 진갈색으로 1~2px, 두께 일정하게 그릴 것.
   위 테두리만 말고 굽(바닥)·손잡이·옆구리까지 끊김 없이 한 바퀴 — 선이 흐려지거나 사라지는 구간이 없게.
⛔ 그릇 가장자리를 흐리게(페이드) 번지지 말 것 — 진갈색 선 바깥은 바로 순백 배경.
⛔ 음식이 그릇을 꽉 채우게. 넓은 빈 접시 여백이 안 보이게.</pre>
  <div class="row"><button data-copy="three">세 줄 복사</button></div>
</section>

<section class="plate">
  <h2>여기부터 골라 줘 — {len(칸들)}칸</h2>
  <p style="font-size:14.5px">왼쪽 = <b>지금 앱에 뜨는 그림</b> · 오른쪽 = <b>네가 준 컷</b>.
     아래 4배 확대는 <b>접시가 깨졌는지</b> 보라고 붙였어.</p>
  <p style="font-size:14.5px"><b>「갈아끼자」 = 오른쪽(네 컷)으로 앱 그림을 바꾼다</b>는 뜻이야.<br>
     <b>「다시뽑자」</b>는 접시가 깨졌거나 마음에 안 들어서 <b>90개 목록에 더한다</b>는 뜻.</p>
  <p style="font-size:14px;color:var(--dim)">유지70 {묶음수.get('유지70', 0)} · 8월25일 {묶음수.get('8월25일', 0)} · 2608 {묶음수.get('2608', 0)}</p>
  <div class="row">
    <div class="bar"><i id="bar"></i></div><span class="cnt" id="cnt">0 / {len(칸들)}</span>
  </div>
</section>

<div class="sticky row" style="justify-content:space-between">
  <span class="cnt" id="cnt2">0 / {len(칸들)}</span>
  <span style="display:flex;gap:8px">
    <button id="copy">결과 복사</button>
    <button class="ghost" id="reset" style="font-size:13px;padding:7px 13px;min-height:38px">지우기</button>
  </span>
</div>

<div style="display:flex;flex-direction:column;gap:12px">
{''.join(셀)}
</div>

<section class="plate">
  <h2>다 고르면</h2>
  <p>맨 위 <b>결과 복사</b>를 눌러서 붙여 줘. 「넣자」는 내가 바로 앱에 넣고,
     「다시뽑자」는 아까 그 90개 목록에 더할게.</p>
  <pre id="out">아직 고른 게 없어</pre>
  <div class="row"><button data-copy="out">결과 복사</button></div>
</section>
</div>
<div class="toast" id="toast">복사했어</div>
<script>
const KEY = 'hankki:앱반영전수0826';
let 고른것 = {{}};
try {{ 고른것 = JSON.parse(localStorage.getItem(KEY) || '{{}}') || {{}}; }} catch (e) {{ 고른것 = {{}}; }}
const 저장 = () => {{ try {{ localStorage.setItem(KEY, JSON.stringify(고른것)); }} catch (e) {{}} }};

const toast = document.getElementById('toast');
let 타이머;
function 알림(글) {{
  toast.textContent = 글; toast.classList.add('on');
  clearTimeout(타이머); 타이머 = setTimeout(() => toast.classList.remove('on'), 1700);
}}
// ⛔ clipboard 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다 → 실패하면 글자를 골라 준다
async function 복사(글, 엘) {{
  try {{ await navigator.clipboard.writeText(글); 알림('복사했어'); return; }} catch (e) {{}}
  try {{
    const r = document.createRange(); r.selectNodeContents(엘);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    알림('글자를 골라 뒀어 · 길게 눌러 복사');
  }} catch (e) {{ 알림('복사가 안 돼 · 직접 골라 줘'); }}
}}

document.querySelectorAll('.cell').forEach(cell => {{
  const k = cell.dataset.k;
  cell.querySelectorAll('input[type=radio]').forEach(r => {{
    if (고른것[k] === r.value) r.checked = true;
    r.addEventListener('change', () => {{ 고른것[k] = r.value; 저장(); 그리기(); }});
  }});
  if (고른것[k]) cell.classList.add('did');
}});

function 결과글() {{
  const 통 = {{ '갈아끼자': [], '다시뽑자': [], '모르겠다': [] }};
  document.querySelectorAll('.cell').forEach(c => {{
    const v = 고른것[c.dataset.k];
    if (v) 통[v].push(c.dataset.k.split(':')[1]);
  }});
  let s = '';
  for (const [k, v] of Object.entries(통)) {{
    if (v.length) s += '[' + k + ' ' + v.length + '개]\\n' + v.join(' · ') + '\\n\\n';
  }}
  return s.trim() || '아직 고른 게 없어';
}}

function 그리기() {{
  const n = Object.keys(고른것).filter(k => 고른것[k]).length;
  const 총 = document.querySelectorAll('.cell').length;
  document.getElementById('cnt').textContent = n + ' / ' + 총;
  document.getElementById('cnt2').textContent = n + ' / ' + 총;
  document.getElementById('bar').style.width = (n / 총 * 100) + '%';
  document.getElementById('out').textContent = 결과글();
  document.querySelectorAll('.cell').forEach(c => c.classList.toggle('did', !!고른것[c.dataset.k]));
}}
그리기();

document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {{
  const el = document.getElementById(b.dataset.copy); 복사(el.textContent, el);
}}));
document.getElementById('copy').addEventListener('click', () => {{
  const el = document.getElementById('out'); 복사(el.textContent, el);
}});
document.getElementById('reset').addEventListener('click', () => {{
  고른것 = {{}}; 저장();
  document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
  그리기(); 알림('지웠어');
}});
</script>'''

os.makedirs(os.path.dirname(os.path.abspath(낼곳)), exist_ok=True)
open(낼곳, 'w', encoding='utf-8').write(HTML)
print(f'✅ {낼곳} · {os.path.getsize(낼곳) / 1e6:.1f}MB')
