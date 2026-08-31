# 🎴☑️ 「레꾸자랑 9월 카드」 검수판 — 창업자가 폰에서 «고르는» 판 (2026-08-30)
#
# 📮 창업자 = *"레꾸자랑카드 여름한정만 9월1일에빼고 나머지 뼈대는 넣자. 다양하게.
#    캐릭터는 가을컷+기본만 넣고. 여름은 빼고. 이해했어?"* ＋ *"검수판주면 고를게 여름 뼈대랑 캐릭터"*
#
# ⭐⭐ 절대원칙(2026-08-19) = **검수판은 무조건 체크 ＋ 복사.**
#    → 절 셋 «전부»에 고르기를 단다. 창업자가 *"고를게 여름 «뼈대»랑 «캐릭터»"* 라고 둘을 콕 집었다.
#    ⛔ 「보여주기만」 하는 절을 두지 않는다 — 그러면 그 절은 판정을 못 받는다.
#
# ⭐ 값은 앱과 «같은 곳»에서 온다(절대원칙 30) —
#    · 여름 컷 명단 = `src/components/ShareDrawCard.jsx` 의 **`SUMMER` 정규식을 읽어서** 고른다(⛔손으로 안 적는다)
#    · 카드 그림 = `_shot-자랑카드-0901.mjs` 가 **진짜 앱을 찍은 것**
#
# 📸 카드 컷 만드는 법 (다시 뽑을 때)
#      ON=2026-09-01 KEYS=warm,panel,pola,mag,arch,night,chuseok node scripts/_shot-자랑카드-0901.mjs
#      ON=2026-08-31 KEYS=summer                                  node scripts/_shot-자랑카드-0901.mjs
#    → 나온 화면에서 카드만 잘라 `<판방>/컷/<키>.png` 로 둔다(이 판은 그 폴더를 읽는다)
#    ⛔ 여름은 **8/31 로 찍는다** — 9/1 엔 `isPeakSeason('summer')` 가 거짓이라 그 뼈대가 아예 안 나온다
#
# 🖨  돌리기 = python3 scripts/_판-자랑카드9월-0830.py
import base64
import io
import json
import os
import re
import sys

from PIL import Image

여기 = os.path.dirname(os.path.abspath(__file__))
앱 = os.path.dirname(여기)
판방 = os.environ.get(
    "PAN", "/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad"
)
컷방 = os.path.join(판방, "자랑카드-0901", "컷")
낼것 = os.path.join(판방, "카드9월.html")

# ── 여름 컷 명단 = 앱 소스에서 «읽는다» ─────────────────────────────
src = open(os.path.join(앱, "src/components/ShareDrawCard.jsx"), encoding="utf-8").read()
m = re.search(r"const SUMMER = /(.*?)/\n", src)
if not m:
    sys.exit("⛔ ShareDrawCard.jsx 에서 SUMMER 정규식을 못 찾았다 — 이름이 바뀌었나 확인할 것")
여름틀 = re.compile(m.group(1))
풀방 = os.path.join(앱, "src/assets/sharepool")
여름컷 = sorted(n[:-4] for n in os.listdir(풀방) if n.endswith(".png") and 여름틀.match(n[:-4]))
if not 여름컷:
    sys.exit("⛔ 여름 컷이 0개다 — sharepool 경로를 확인할 것")

# 이름표 (⛔그림을 보고 붙인 것 — 키만 보고 짐작하지 않는다)
이름표 = {
    "duo_bingsu": "빙수 · 콤비", "duo_naengmyeon": "냉면 · 콤비", "duo_watermelon": "수박 · 콤비",
    "sm_duo_icecream": "아이스크림 · 콤비", "sm_duo_tube": "튜브 · 콤비", "sm_duo_watermelon": "수박 · 콤비",
    "sm_gom_bbq": "바비큐 · 꼬르곰", "sm_gom_beach": "해변 · 꼬르곰", "sm_gom_chair": "비치체어 · 꼬르곰",
    "sm_gom_tube": "튜브 · 꼬르곰", "sm_peng_beach": "해변 · 펭펭", "sm_peng_night": "여름밤 · 펭펭",
    "sm_peng_shop": "여름장보기 · 펭펭",
}
뼈대들 = [
    ("warm", "웜"), ("panel", "패널"), ("pola", "폴라로이드"), ("mag", "매거진"),
    ("arch", "아치"), ("night", "나이트"), ("chuseok", "추석 한정"),
]


def 담기(길, 긴변, 화질=82):
    """PNG 를 webp data URI 로 — 판 하나가 16MB 를 넘으면 안 된다"""
    im = Image.open(길).convert("RGBA")
    if max(im.size) > 긴변:
        비 = 긴변 / max(im.size)
        im = im.resize((round(im.size[0] * 비), round(im.size[1] * 비)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=화질, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


D = {}
빠진것 = []
for k, _ in [("summer", "")] + 뼈대들:
    길 = os.path.join(컷방, k + ".png")
    if os.path.exists(길):
        D["뼈대_" + k] = 담기(길, 520 if k == "summer" else 380)
    else:
        빠진것.append(k)
for k in 여름컷:
    D["여름_" + k] = 담기(os.path.join(풀방, k + ".png"), 300)
if 빠진것:
    sys.exit(f"⛔ 카드 컷이 없다: {' '.join(빠진것)} — 위 머리주석의 「카드 컷 만드는 법」대로 찍을 것")

SUM = json.dumps([[k, 이름표.get(k, k)] for k in 여름컷], ensure_ascii=False)
SK = json.dumps(뼈대들, ensure_ascii=False)
DJ = json.dumps(D, ensure_ascii=False)

HTML = """<title>레꾸자랑 9월 카드</title>
<style>
:root{--ink:#241d17;--ink2:#5f5449;--line:#e5ded4;--bg:#faf7f2;--card:#fff;--plate:#fff;
 --out:#c0492c;--out-bg:#fdefe9;--keep:#4a7c59;--keep-bg:#eef4ef;
 --sh:0 1px 2px rgba(60,46,32,.06),0 6px 18px rgba(60,46,32,.05)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --ink:#efe8df;--ink2:#a89c90;--line:#3a332c;--bg:#191512;--card:#221d19;--plate:#f4efe8;
 --out:#f08d6e;--out-bg:#3a221a;--keep:#8fc0a0;--keep-bg:#1e2a22;
 --sh:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.25)}}
:root[data-theme="dark"]{--ink:#efe8df;--ink2:#a89c90;--line:#3a332c;--bg:#191512;--card:#221d19;--plate:#f4efe8;
 --out:#f08d6e;--out-bg:#3a221a;--keep:#8fc0a0;--keep-bg:#1e2a22;
 --sh:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.25)}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);padding:0 0 132px;
 font:16px/1.65 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;-webkit-text-size-adjust:100%}
.wrap{max-width:1000px;margin:0 auto;padding:0 18px}
header{padding:26px 0 6px}
h1{margin:0 0 6px;font-size:25px;letter-spacing:-.02em;text-wrap:balance}
.sub{color:var(--ink2);font-size:14.5px;margin:0;word-break:keep-all}
h2{font-size:18.5px;margin:34px 0 4px;letter-spacing:-.01em}
.lead{color:var(--ink2);font-size:14px;margin:0 0 14px;word-break:keep-all}
.big{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--sh);
 display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
.big img{width:min(100%,300px);border-radius:12px;display:block}
.big .txt{flex:1;min-width:220px}
.tag{display:inline-block;font-size:12px;padding:3px 9px;border-radius:999px;background:var(--out-bg);color:var(--out);font-weight:700}
ul.pts{margin:10px 0 0;padding-left:18px;font-size:14px;color:var(--ink2)}
ul.pts li{margin:3px 0;word-break:keep-all}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(158px,1fr))}
.grid.sk{grid-template-columns:repeat(auto-fill,minmax(178px,1fr))}
.c{background:var(--card);border:1px solid var(--line);border-radius:13px;overflow:hidden;box-shadow:var(--sh);
 display:flex;flex-direction:column}
.c.o{border-color:color-mix(in srgb,var(--out) 45%,var(--line))}
.th{aspect-ratio:1;overflow:hidden;padding:8px;background:var(--plate)}
.th.sk{aspect-ratio:4/5;padding:0}
.th img{width:100%;height:100%;object-fit:contain;display:block}
.th.sk img{object-fit:cover}
.m{padding:8px 10px;border-top:1px solid var(--line);flex:1}
.k{font:600 11.5px/1.3 ui-monospace,Menlo,monospace;color:var(--ink2)}
.n{font-size:13px;margin:2px 0 0;word-break:keep-all}
.pick{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:0 10px 10px}
.big .pick{padding:12px 0 0;max-width:320px}
.pick button{border:1px solid var(--line);background:transparent;color:var(--ink2);border-radius:8px;
 padding:8px 2px;font-size:12.5px;cursor:pointer;font-family:inherit;white-space:nowrap;letter-spacing:-.02em}
.pick .a[aria-pressed="true"]{background:var(--out-bg);color:var(--out);border-color:var(--out);font-weight:700}
.pick .b[aria-pressed="true"]{background:var(--keep-bg);color:var(--keep);border-color:var(--keep);font-weight:700}
.pick button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.foot{position:fixed;left:0;right:0;bottom:0;background:color-mix(in srgb,var(--bg) 94%,transparent);
 backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:12px 18px}
.fi{max-width:1000px;margin:0 auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cnt{font-size:13.5px;color:var(--ink2);font-variant-numeric:tabular-nums;word-break:keep-all}
.copy{margin-left:auto;background:var(--ink);color:var(--bg);border:0;border-radius:10px;padding:11px 20px;
 font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
textarea{width:100%;min-height:140px;margin-top:12px;background:var(--card);color:var(--ink);
 border:1px solid var(--line);border-radius:10px;padding:12px;font:13px/1.6 ui-monospace,Menlo,monospace}
.note{background:var(--keep-bg);border:1px solid color-mix(in srgb,var(--keep) 30%,var(--line));
 border-radius:12px;padding:13px 15px;font-size:14px;color:var(--ink);margin:14px 0 0;word-break:keep-all}
</style>
<div class="wrap">
<header>
<h1>레꾸자랑 9월 카드</h1>
<p class="sub">9월 1일에 <b>여름만</b> 빠지고 나머지 뼈대는 다 돕니다. 캐릭터는 <b>가을 ＋ 기본</b>만.
 아래 세 군데 다 골라주시면 그대로 반영할게요.</p>
</header>

<h2>1. 빠지는 것 — 여름 뼈대</h2>
<p class="lead">9/1 0시에 뽑기에서 자동으로 내려갑니다. 이게 맞는지만 봐주세요.</p>
<div class="big">
  <img id="bigimg" alt="여름 뼈대">
  <div class="txt">
    <span class="tag">9/1 에 빠짐</span>
    <ul class="pts">
      <li>하늘색 그라데이션 ＋ 오른쪽 위 <b>해</b> ＋ 아래 <b>물결</b></li>
      <li>분홍 「여름 한정」 배지</li>
      <li>문구 = 「시원하게, 여름 한 끼」</li>
      <li>이 뼈대는 <b>구조가 여름 전용</b>이라 옷만 갈아입힐 수가 없어요</li>
    </ul>
    <div class="pick" id="bigpick"></div>
  </div>
</div>

<h2>2. 남는 것 — 뼈대 7종</h2>
<p class="lead">9월 내내 이 일곱이 돌아갑니다. 추석(9/1~10/15)이 여름 자리를 대신 채워요.
 빼고 싶은 게 있으면 눌러주세요.</p>
<div class="grid sk" id="skins"></div>

<h2>3. 빠지는 것 — 여름 캐릭터 13컷</h2>
<p class="lead">여름 뼈대에서만 쓰던 컷이라 뼈대가 빠지면 같이 사라집니다. 여름이 아닌 게 섞여 있으면 짚어주세요.</p>
<div class="grid" id="chars"></div>

<div class="note">
<b>실측으로 확인한 것</b><br>
기본 캐릭터 풀(곰 11 · 펭 9 · 콤비 12)은 「요리하는 컷」 명단으로만 뽑아서 <b>여름이 애초에 안 섞입니다</b>.
9/1이 되면 가을 컷 15장이 들어와 <b>곰 18 · 펭 11 · 콤비 14</b>가 됩니다.
</div>
</div>

<div class="foot"><div class="fi">
  <span class="cnt" id="cnt"></span>
  <button class="copy" id="copy">결과 복사하기</button>
</div></div>
<div class="wrap"><textarea id="out" readonly placeholder="복사하기를 누르면 여기에 결과가 나옵니다"></textarea></div>
<script>
const D=__D__;
const SUM=__SUM__;
const SK=__SK__;

const KEY='hankki:card-0901';
let p={}; try{p=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(p))}catch(e){}};
// ⛔ 단추 «두 개»만 낸다 — 감싸는 .pick 은 그대로 두고 innerHTML 만 갈아끼운다.
//    (outerHTML 로 갈면 id 가 사라져 «두 번째 그리기»부터 죽는다)
const 고르기=(k,v,낱,둘)=>
  '<button class="a" data-k="'+k+'" data-v="out" aria-pressed="'+(v==='out')+'">'+낱+'</button>'+
  '<button class="b" data-k="'+k+'" data-v="keep" aria-pressed="'+(v==='keep')+'">'+둘+'</button>';
const 칸=(k,v,낱,둘)=>'<div class="pick">'+고르기(k,v,낱,둘)+'</div>';

function render(){
  document.getElementById('bigimg').src=D['뼈대_summer'];
  const bv=p['skin:summer']||'out';
  document.getElementById('bigpick').innerHTML=고르기('skin:summer',bv,'여름 맞다 · 뺀다','여름 아니다');
  document.getElementById('skins').innerHTML = SK.map(([k,n])=>{
    const v=p['skin:'+k]||'keep';
    return '<div class="c'+(v==='out'?' o':'')+'"><div class="th sk"><img src="'+D['뼈대_'+k]+'" alt="'+k+'"></div>'+
    '<div class="m"><div class="k">'+k+'</div><div class="n">'+n+'</div></div>'+
    칸('skin:'+k,v,'이건 뺀다','9월에 넣는다')+'</div>';
  }).join('');
  document.getElementById('chars').innerHTML = SUM.map(([k,n])=>{
    const v=p[k]||'out';
    return '<div class="c'+(v==='out'?' o':'')+'"><div class="th"><img src="'+D['여름_'+k]+'" alt="'+k+'"></div>'+
    '<div class="m"><div class="k">'+k+'</div><div class="n">'+n+'</div></div>'+
    칸(k,v,'여름 맞다','여름 아니다')+'</div>';
  }).join('');
  const 남길캐=SUM.filter(([k])=>p[k]==='keep').length;
  const 뺄뼈대=SK.filter(([k])=>p['skin:'+k]==='out').length;
  const 여름뼈대=(p['skin:summer']||'out')==='out'?'뺀다':'남긴다';
  document.getElementById('cnt').textContent=
    '여름 뼈대 '+여름뼈대+' · 뼈대 '+(SK.length-뺄뼈대)+'종 남김 · 여름 캐릭터 '+(SUM.length-남길캐)+'컷 뺌';
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;
  p[b.dataset.k]=b.dataset.v;save();render();});
document.getElementById('copy').addEventListener('click',async()=>{
  const 남길캐=SUM.filter(([k])=>p[k]==='keep');
  const 뺄뼈대=SK.filter(([k])=>p['skin:'+k]==='out');
  let t='[레꾸자랑 9월 카드 검수]\\n';
  t+='1. 여름 뼈대 = '+((p['skin:summer']||'out')==='out'?'9/1 에 뺀다':'⛔ 남긴다 (다시 보자)')+'\\n';
  t+='2. 남기는 뼈대 = '+(SK.length-뺄뼈대.length)+'종'+(뺄뼈대.length?' · 뺄 것 → '+뺄뼈대.map(([k,n])=>k+' '+n).join(', '):'')+'\\n';
  t+='3. 여름 캐릭터 '+(SUM.length-남길캐.length)+'컷 = 같이 뺀다\\n\\n';
  t+='■ 여름이 «아니라고» 고른 것 ('+남길캐.length+')\\n'+(남길캐.length?남길캐.map(([k,n])=>k+' '+n).join('\\n'):'없음');
  const ta=document.getElementById('out'); ta.value=t;
  try{await navigator.clipboard.writeText(t);document.getElementById('copy').textContent='복사됐어요';}
  catch(e){ta.focus();ta.select();document.getElementById('copy').textContent='길게 눌러 복사하세요';}
  setTimeout(()=>{document.getElementById('copy').textContent='결과 복사하기'},2600);
});
render();
</script>
"""

HTML = HTML.replace("__D__", DJ).replace("__SUM__", SUM).replace("__SK__", SK)
open(낼것, "w", encoding="utf-8").write(HTML)
print(f"☑️  {낼것}  ({len(HTML) // 1024}KB)")
print(f"   뼈대 {len(뼈대들)}종 ＋ 여름 뼈대 1 · 여름 캐릭터 {len(여름컷)}컷 (SUMMER 정규식에서 뽑음)")
