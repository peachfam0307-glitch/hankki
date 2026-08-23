# 🍱🍱 새 음식 컷 검수판 — 「새 컷 ↔ 지금 앱 컷」 나란히 (창업자 2026-08-23)
#   📮 창업자 = *"우리 음식아이콘중에 너무 징그러운게 있어서 다시뽑았거든.
#      기존꺼는 폐기하고 이거 컷해서 갈아끼우고 싶은데 가능해?"*
#      → *"표준도구로 정확하고 빠르게해줘 / 이름없는건 자른후 검수할때 알려줌"*
#
# ⭐⭐ 심장 = **나란히 놓는다.** 새 컷만 보면 「예쁘다」밖에 안 나온다.
#    바꿀지 말지는 «지금 것과 견줘야» 정해진다.
#
# ☑️ 절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사
#    ⛔ `clipboard.writeText()` 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97)
#       → 실패하면 글자를 골라 준다(Range)
#
# ⛔ 짝짓기(새 컷 ↔ 앱 키)는 **손으로 적었다** — 시트에 박힌 이름표를 읽어서 짝지었고
#    컷 순서가 읽는 순서(왼→오·위→아래)인 것을 컨택트시트로 «눈으로» 확인했다(규칙 21).
#
# 쓰기:  python3 scripts/_판-새음식컷-0823.py <낼 html>
import base64
import io
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW = os.path.join(ROOT, 'docs/stickers/음식아이콘-창업자-2026-08-23/낱개')
PHOTO = os.path.join(ROOT, 'src/assets/stickers/photo')
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/새음식컷.html'

# 시트 = (제목, 설명, [(컷파일, 이름, 앱키 or '' or '🆕')])
시트 = [
    ('① 이름 모름 · 일러스트 톤', '⛔ 이름표가 없다 — 창업자가 알려주면 짝짓는다', [
        ('n01_01', '', '?'), ('n01_02', '', '?'), ('n01_03', '', '?'),
        ('n01_04', '', '?'), ('n01_05', '', '?'), ('n01_06', '', '?')]),
    ('② 이름 모름 · 흰 냄비', '⛔ 이름표 없음 ＋ 시트가 «잘려» 왔다(1045×1024)', [
        ('n02_01', '', '?'), ('n02_02', '', '?'), ('n02_03', '', '?'), ('n02_04', '', '?')]),
    ('③ 이름 모름 · 세로', '⛔ 이름표 없음 ＋ 시트가 «잘려» 왔다(507×1024)', [
        ('n03_01', '', '?'), ('n03_02', '', '?')]),
    ('④ 파스타 · 흰 접시', '', [
        ('n04_01', '원팬 크림 파스타', 'fe_321'), ('n04_02', '뚝배기 파스타', 'fe_327'),
        ('n04_03', '봉골레파스타', 'fe_188'), ('n04_04', '새우크림파스타', 'fe_24'),
        ('n04_05', '로제파스타', 'fe_27')]),
    ('⑤ 밥 · 흰 그릇', '', [
        ('n05_01', '버섯볶음밥', 'fe_315'), ('n05_02', '소고기솥밥', 'fe_290'),
        ('n05_03', '나물비빔밥', 'fe_307'), ('n05_04', '마늘쫑비빔밥', 'fe_289'),
        ('n05_05', '카레라이스', 'fe_217'), ('n05_06', '유부초밥', 'fe_229')]),
    ('⑥ 면 · 흰 바탕 파란 꽃무늬', '⚠️ ⑨와 «같은 여섯 요리»다 — 그릇만 다르다. 한 쪽을 고른다', [
        ('n06_01', '골뱅이소면무침', 'fe_204'), ('n06_02', '냉우동', 'fe_218'),
        ('n06_03', '해물볶음우동', 'fe_219'), ('n06_04', '볶음우동', 'fe_155'),
        ('n06_05', '굴당면 ＋ 소바 (두 컷이 붙었다)', '')]),
    ('⑦ 파스타 · 크림색 접시', '', [
        ('n07_01', '알리오올리오', 'fe_43'), ('n07_02', '묵은지파스타', 'fe_52'),
        ('n07_03', '베이컨크림파스타', 'fe_53'), ('n07_04', '토마토파스타', 'fy_yng02'),
        ('n07_05', '크림파스타', 'fy_y03'), ('n07_06', '바질치킨스테이크파스타', '🆕')]),
    ('⑧ 밥 · 면', '', [
        ('n08_01', '미나리볶음밥', 'fe_169'), ('n08_02', '매운콩나물덮밥', 'fe_189'),
        ('n08_03', '콩나물밥(간장양념)', 'fe_97'), ('n08_04', '간장국수', 'fe_297'),
        ('n08_05', '비빔국수', 'fe_298'), ('n08_06', '라면', 'fe_265')]),
    ('⑨ 면 · 회색 꽃무늬', '⚠️ ⑥과 «같은 여섯 요리»다 — 그릇만 다르다. 한 쪽을 고른다', [
        ('n09_01', '골뱅이소면무침', 'fe_204'), ('n09_02', '냉우동', 'fe_218'),
        ('n09_03', '해물볶음우동', 'fe_219'), ('n09_04', '볶음우동', 'fe_155'),
        ('n09_05', '굴당면', 'fe_122'), ('n09_06', '소바', 'fe_277')]),
    ('⑩ 면 · 흰 접시', '', [
        ('n10_01', '쌀국수', 'fe_231'), ('n10_02', '분보싸오', 'fe_58'),
        ('n10_03', '쫄면', 'fb_b04'), ('n10_04', '냉면', 'fh_k25'),
        ('n10_05', '들기름 막국수', '🆕'), ('n10_06', '매운 막국수', '🆕')]),
    ('⑪ 고기 · 크림색 접시', '⚠️ 제육볶음이 «둘»로 왔는데 앱엔 「제육볶음」 하나뿐이다', [
        ('n11_01', '고추장제육볶음', 'fh_k13'), ('n11_02', '간장제육볶음', 'fh_k13'),
        ('n11_03', '양배추돼지고기볶음', 'fe_25'), ('n11_04', '장조림', 'fe_34'),
        ('n11_05', '소불고기볶음', 'fe_10')]),
    ('⑫ 고기 · 흰 접시', '', [
        ('n12_01', '항정살간장조림', 'fe_308'), ('n12_02', '몽골리안비프', 'fe_268'),
        ('n12_03', '매운콩나물불고기', 'fe_191'), ('n12_04', '마늘쫑볶음', 'fe_192'),
        ('n12_05', '간장불고기', 'fe_197'), ('n12_06', '고추장두루치기', 'fe_129')]),
    ('⑬ 면 · 연회색 그릇', '', [
        ('n13_01', '자장면', 'fe_90'), ('n13_02', '볶음면', 'fj_c09'),
        ('n13_03', '우육면', 'fj_c12'), ('n13_04', '우동', 'fi_j02'),
        ('n13_05', '라멘', 'fi_j04'), ('n13_06', '분짜', 'fe_278')]),
    ('⑭ 면 · 파란 꽃무늬', '', [
        ('n14_01', '물냉면', 'fh_k25'), ('n14_02', '칼국수', 'fh_k26'),
        ('n14_03', '불닭냉면', 'fe_18'), ('n14_04', '잔치국수', 'fe_37'),
        ('n14_05', '콩국수', 'fe_38'), ('n14_06', '잡채', 'fh_k16')]),
]


def thumb(path, px=300):
    """흰 바탕에 얹어 줄인다 — 투명 PNG 는 어두운 테마에서 안 보인다."""
    if not os.path.exists(path):
        return ''
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    s = min(px / im.width, px / im.height, 1.0)
    bg = bg.convert('RGB').resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    b = io.BytesIO()
    bg.save(b, 'WEBP', quality=80, method=4)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


rows = []
for 제목, 설명, 컷들 in 시트:
    items = []
    for f, name, key in 컷들:
        items.append({
            'id': f,
            'name': name,
            'key': key,
            'new': thumb(os.path.join(NEW, f + '.png')),
            'old': thumb(os.path.join(PHOTO, key + '.png')) if key and key not in ('?', '🆕') else '',
        })
    rows.append({'title': 제목, 'note': 설명, 'items': items})

DATA = json.dumps(rows, ensure_ascii=False)
총 = sum(len(r['items']) for r in rows)

HTML = """<title>새 음식 컷 갈아끼우기</title>
<style>
:root{--bg:#faf8f4;--card:#fff;--ink:#2b2118;--sub:#7a6a58;--line:#e6ddd0;--accent:#8c5a2b;--ok:#2f7d4f;--no:#b0442f;--hm:#9a7b28}
:root:not([data-theme=light]){}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#191614;--card:#221e1b;--ink:#f0e8dd;--sub:#a89684;--line:#3a332c;--accent:#d9a66b;--ok:#6fbf8d;--no:#e08a72;--hm:#d8bd6a}}
:root[data-theme=dark]{--bg:#191614;--card:#221e1b;--ink:#f0e8dd;--sub:#a89684;--line:#3a332c;--accent:#d9a66b;--ok:#6fbf8d;--no:#e08a72;--hm:#d8bd6a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;padding:16px 12px 120px}
h1{font-size:22px;margin:0 0 4px;letter-spacing:-.02em}
.lead{color:var(--sub);font-size:14px;margin:0 0 18px}
.sec{margin:26px 0 10px;padding-top:14px;border-top:2px solid var(--line)}
.sec h2{font-size:17px;margin:0}
.sec p{margin:4px 0 0;font-size:13px;color:var(--sub)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:12px 0}
.hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.nm{font-weight:700;font-size:16px}
.ky{font-size:12px;color:var(--sub);font-variant-numeric:tabular-nums}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cell{text-align:center}
.cell img{width:100%;max-width:210px;height:auto;border-radius:10px;background:#fff}
.cell .t{font-size:12px;color:var(--sub);margin-bottom:5px;letter-spacing:.04em}
.none{display:flex;align-items:center;justify-content:center;min-height:110px;border:1px dashed var(--line);border-radius:10px;color:var(--sub);font-size:13px;padding:8px}
.pick{display:flex;gap:6px;margin-top:11px}
.pick button{flex:1;padding:9px 4px;border-radius:9px;border:1.5px solid var(--line);background:transparent;color:var(--sub);font:inherit;font-size:13px;cursor:pointer}
.pick button.on[data-v=y]{border-color:var(--ok);color:var(--ok);font-weight:700}
.pick button.on[data-v=n]{border-color:var(--no);color:var(--no);font-weight:700}
.pick button.on[data-v=m]{border-color:var(--hm);color:var(--hm);font-weight:700}
input.nmin{width:100%;margin-top:9px;padding:8px 10px;border-radius:9px;border:1.5px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-size:14px}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 12px;display:flex;gap:8px;align-items:center}
.bar .cnt{font-size:13px;color:var(--sub);flex:1}
.bar button{padding:11px 16px;border-radius:10px;border:0;background:var(--accent);color:#fff;font:inherit;font-weight:700;cursor:pointer}
#out{white-space:pre-wrap;font-size:12px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:10px;display:none;user-select:all}
</style>
<h1>🍱 새 음식 컷 __N__장 — 갈아끼울까?</h1>
<p class="lead">왼쪽 = <b>새 컷</b> · 오른쪽 = <b>지금 앱에 있는 것</b>. 같은 키에 덮어씌우면 <b>이미 저장된 레시피도 저절로 바뀐다.</b><br>
⚠️ 톤이 갈리는지 봐줘 — 새 컷은 사진 느낌, 지금 앱 것은 일러스트다.</p>
<div id="app"></div>
<div class="bar"><span class="cnt" id="cnt"></span><button id="cp">복사하기</button></div>
<pre id="out"></pre>
<script>
const DATA=__DATA__, KEY='hankki-새음식컷-0823';
let st={}; try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){st={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const app=document.getElementById('app');
DATA.forEach(sec=>{
  const s=document.createElement('div'); s.className='sec';
  s.innerHTML='<h2>'+sec.title+'</h2>'+(sec.note?'<p>'+sec.note+'</p>':'');
  app.appendChild(s);
  sec.items.forEach(it=>{
    const c=document.createElement('div'); c.className='card';
    const unnamed = it.key==='?';
    const oldCell = it.old
      ? '<div class="cell"><div class="t">지금 앱</div><img src="'+it.old+'" alt=""></div>'
      : '<div class="cell"><div class="t">지금 앱</div><div class="none">'+(it.key==='🆕'?'앱에 없다 — 새로 넣는 컷':(unnamed?'이름을 알려주면 짝짓는다':'짝이 없다'))+'</div></div>';
    c.innerHTML='<div class="hd"><span class="nm">'+(it.name||'이름 ?')+'</span><span class="ky">'+it.id+(it.key&&it.key!=='?'?' → '+it.key:'')+'</span></div>'
      +'<div class="pair"><div class="cell"><div class="t">새 컷</div><img src="'+it.new+'" alt=""></div>'+oldCell+'</div>'
      +'<div class="pick"><button data-v="y">갈아끼운다</button><button data-v="n">안 쓴다</button><button data-v="m">모르겠다</button></div>'
      +(unnamed?'<input class="nmin" placeholder="이 음식 이름을 적어줘">':'');
    app.appendChild(c);
    const bs=c.querySelectorAll('.pick button');
    const paint=()=>bs.forEach(b=>b.classList.toggle('on', (st[it.id]||{}).v===b.dataset.v));
    bs.forEach(b=>b.onclick=()=>{const o=st[it.id]||{}; o.v=(o.v===b.dataset.v?'':b.dataset.v); st[it.id]=o; save(); paint(); cnt()});
    paint();
    const inp=c.querySelector('.nmin');
    if(inp){ inp.value=(st[it.id]||{}).n||''; inp.oninput=()=>{const o=st[it.id]||{}; o.n=inp.value; st[it.id]=o; save(); cnt()} }
  });
});
const total=DATA.reduce((a,s)=>a+s.items.length,0);
function cnt(){
  const done=Object.values(st).filter(o=>o&&o.v).length;
  const named=Object.values(st).filter(o=>o&&o.n&&o.n.trim()).length;
  document.getElementById('cnt').textContent=done+' / '+total+' 고름'+(named?' · 이름 '+named+'개':'');
}
cnt();
document.getElementById('cp').onclick=async()=>{
  const L=['🍱 새 음식 컷 판정 (2026-08-23)'];
  DATA.forEach(sec=>{
    const ls=sec.items.filter(it=>{const o=st[it.id]||{}; return o.v||(o.n&&o.n.trim())});
    if(!ls.length) return;
    L.push('','【'+sec.title+'】');
    ls.forEach(it=>{const o=st[it.id]||{};
      const v={y:'✅갈아끼운다',n:'⛔안 쓴다',m:'❓모르겠다'}[o.v]||'—';
      L.push('  '+it.id+' '+(o.n&&o.n.trim()?'「'+o.n.trim()+'」':(it.name||''))+(it.key&&it.key!=='?'?' → '+it.key:'')+' : '+v);
    });
  });
  const t=L.join('\\n');
  const out=document.getElementById('out');
  try{ await navigator.clipboard.writeText(t); out.style.display='block'; out.textContent='복사했어 ✅\\n\\n'+t; }
  catch(e){ out.style.display='block'; out.textContent=t;
    const r=document.createRange(); r.selectNodeContents(out); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
  out.scrollIntoView({behavior:'smooth',block:'center'});
};
</script>"""

html = HTML.replace('__DATA__', DATA).replace('__N__', str(총))
with open(OUT, 'w', encoding='utf-8') as fp:
    fp.write(html)
print(f'✅ {OUT}  ({총}컷 · {os.path.getsize(OUT)//1024}KB)')
