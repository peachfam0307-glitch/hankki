# 🔄 「무엇이 무엇으로 갈렸나」 1:1 표 — 8/23(새 컷 넣기 «전») ↔ 지금
#
# 📮 창업자 2026-08-26 = *"24일 이전에 반영된것들 아이콘+이름짝이랑 24일 이후에 뽑은 것들
#    아이콘+이름짝을 1:1로 매칭해서 갈아끼면 되는데 너는 니 멋대로 다 갈아끼워서
#    어디부터 잘못되었는지 못찾는다는게 내가 짜증이나는거야."*
#
# ⭐ 이 표가 없어서 검수가 헛돌았다 — 창업자는 「지금 상태」만 보고 「무엇이 바뀌었나」를 못 봤다.
# ⭐ 옛 상태는 git 에 그대로 있다(8/23 = 8fbf15b5). 흉내가 아니라 «그때 그 파일»을 읽는다(절대원칙 30).
#
# 실행 = python3 scripts/_판-갈아낀표-0826.py [옛커밋]
# 🏷 이름표 = 판정대기
import sys, os, re, json, base64, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _이름표읽기 import 이름표, 픽커

앱 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
옛커밋 = sys.argv[1] if len(sys.argv) > 1 else '8fbf15b5'
옛 = subprocess.run(['git','show',f'{옛커밋}:hankki/src/components/FoodIcon.jsx'],
                    cwd=os.path.dirname(앱), capture_output=True, text=True).stdout
새 = open(f'{앱}/src/components/FoodIcon.jsx', encoding='utf-8').read()
사진 = re.compile(r'^(fe|fh|fy|fj|fi|fb|gr)_')
def 짝(src):
    nm, pk = 이름표(src), 픽커(src)
    return {nm[k]: (k, pk[k]) for k in pk if 사진.match(k) and nm.get(k)}
A, B = 짝(옛), 짝(새)

def png(k):
    p = f'{앱}/src/assets/stickers/photo/{k}.png'
    if not os.path.exists(p): return ''
    return 'data:image/png;base64,' + base64.b64encode(open(p,'rb').read()).decode()

갈림 = [(n, A[n][0], B[n][0], B[n][1]) for n in A if n in B and A[n][0] != B[n][0]]
사라 = [(n, A[n][0], A[n][1]) for n in A if n not in B]
생김 = [(n, B[n][0], B[n][1]) for n in B if n not in A]
그대로 = [n for n in A if n in B and A[n][0] == B[n][0]]
갈림.sort(key=lambda x: (x[3], x[0]))
print(f'그대로 {len(그대로)} · 갈림 {len(갈림)} · 사라짐 {len(사라)} · 새로 {len(생김)}')

def 칸(n, a, b, g):
    return f'''<div class="row" data-n="{n}">
  <div class="nm"><b>{n}</b><span class="g">{g}</span></div>
  <div class="pair">
    <figure><img src="{png(a)}" loading="lazy"><figcaption>옛 · {a}</figcaption></figure>
    <div class="ar">→</div>
    <figure><img src="{png(b)}" loading="lazy"><figcaption>새 · {b}</figcaption></figure>
  </div>
  <div class="pick">
    <label><input type="radio" name="v_{n}" value="맞다">맞다</label>
    <label><input type="radio" name="v_{n}" value="틀린짝">틀린 짝</label>
    <label><input type="radio" name="v_{n}" value="옛것이낫다">옛 것이 낫다</label>
  </div>
</div>'''

def 한칸(n, k, g, tag):
    return f'''<div class="row one" data-n="{n}">
  <div class="nm"><b>{n}</b><span class="g">{g}</span></div>
  <div class="pair"><figure><img src="{png(k)}" loading="lazy"><figcaption>{tag} · {k}</figcaption></figure></div>
  <div class="pick">
    <label><input type="radio" name="v_{n}" value="괜찮다">괜찮다</label>
    <label><input type="radio" name="v_{n}" value="문제있다">문제 있다</label>
  </div>
</div>'''

H = ['<title>갈아낀 아이콘 1:1 표</title>', '''<style>
:root{--bg:#fbf9f5;--ink:#2b2118;--sub:#7a6a58;--line:#e5ddd0;--card:#fff;--ac:#8c5a2b}
:root:not([data-theme=light]){}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#191512;--ink:#efe7dc;--sub:#a79684;--line:#332b23;--card:#221d18;--ac:#d9a066}}
:root[data-theme=dark]{--bg:#191512;--ink:#efe7dc;--sub:#a79684;--line:#332b23;--card:#221d18;--ac:#d9a066}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding:16px}
h1{font-size:20px;margin:0 0 4px}
.lead{color:var(--sub);font-size:14px;margin:0 0 16px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:9;border-bottom:1px solid var(--line)}
.tabs button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 13px;font-size:13px;cursor:pointer}
.tabs button[aria-pressed=true]{background:var(--ac);color:#fff;border-color:var(--ac)}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0}
.nm{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}
.nm b{font-size:16px}.g{color:var(--sub);font-size:12px}
.pair{display:flex;align-items:center;gap:10px;justify-content:center}
figure{margin:0;text-align:center;flex:0 0 auto}
figure img{width:118px;height:118px;object-fit:contain;background:#fff;border-radius:10px;border:1px solid var(--line)}
figcaption{font-size:11px;color:var(--sub);margin-top:4px;font-variant-numeric:tabular-nums}
.ar{font-size:22px;color:var(--ac)}
.one figure img{width:130px;height:130px}
.pick{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;justify-content:center}
.pick label{border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer}
.pick input{margin-right:5px}
.pick label:has(input:checked){background:var(--ac);color:#fff;border-color:var(--ac)}
#bar{position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:10px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#bar button{background:var(--ac);color:#fff;border:0;border-radius:10px;padding:11px 16px;font-size:15px;cursor:pointer}
#cnt{color:var(--sub);font-size:13px}
#out{width:100%;min-height:120px;margin-top:8px;font:12px/1.5 ui-monospace,monospace;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--card);color:var(--ink);display:none}
section{display:none}section.on{display:block}
</style>''']
H.append(f'<h1>갈아낀 아이콘 1:1 표</h1><p class="lead">8/23(새 컷 넣기 전) ↔ 오늘. '
         f'그대로 {len(그대로)} · <b>갈림 {len(갈림)}</b> · 사라짐 {len(사라)} · 새로 {len(생김)}</p>')
H.append(f'<div class="tabs">'
         f'<button data-t="a" aria-pressed="true">🔄 갈림 {len(갈림)}</button>'
         f'<button data-t="b" aria-pressed="false">⬇️ 사라짐 {len(사라)}</button>'
         f'<button data-t="c" aria-pressed="false">🆕 새로 {len(생김)}</button></div>')
H.append('<section id="a" class="on">' + ''.join(칸(*x) for x in 갈림) + '</section>')
H.append('<section id="b">' + ''.join(한칸(n,k,g,'옛') for n,k,g in 사라) + '</section>')
H.append('<section id="c">' + ''.join(한칸(n,k,g,'새') for n,k,g in 생김) + '</section>')
H.append('''<div id="bar"><button id="cp">결과 복사하기</button><span id="cnt"></span></div><textarea id="out" readonly></textarea>
<script>
const K='hankki:갈아낀표:0826';
let S={};try{S=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
document.querySelectorAll('input[type=radio]').forEach(r=>{
  if(S[r.name]===r.value)r.checked=true;
  r.addEventListener('change',()=>{S[r.name]=r.value;save();cnt()});
});
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
function cnt(){const t=document.querySelectorAll('.row').length;
  document.getElementById('cnt').textContent=Object.keys(S).length+' / '+t+' 골랐어요';}
cnt();
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id===b.dataset.t));
  scrollTo(0,0);
});
document.getElementById('cp').onclick=async()=>{
  const g={};document.querySelectorAll('.row').forEach(r=>{
    const n=r.dataset.n,v=S['v_'+n];if(v)(g[v]=g[v]||[]).push(n);});
  let t='[갈아낀 표 판정 2026-08-26]\\n';
  for(const k in g)t+='\\n['+k+' '+g[k].length+']\\n'+g[k].join(', ')+'\\n';
  const o=document.getElementById('out');o.style.display='block';o.value=t;
  try{await navigator.clipboard.writeText(t);document.getElementById('cp').textContent='복사됐어요 ✓';}
  catch(e){o.focus();o.select();document.getElementById('cp').textContent='길게 눌러 복사해요';}
};
</script>''')
out = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/갈아낀표.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out,'w',encoding='utf-8').write('\n'.join(H))
json.dump({'갈림':갈림,'사라짐':사라,'새로':생김,'그대로':len(그대로)},
          open(f'{앱}/scripts/_갈아낀표-0826.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('판 =', out, f'({os.path.getsize(out)//1024}KB)')
