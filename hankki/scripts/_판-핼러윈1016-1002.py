#!/usr/bin/env python3
# 🎃 10/16 «저절로 열리는 것» 전수 검수판 — 창업자 2026-10-02 「16일꺼 다 볼게」
#    3일 전 관문(release-calendar --gate · 10/13 부터 막는다)과 굽기 관문(--bake)이 «검수장부 없음»으로 잡은 것 전부.
#    ⛔ 조각 목록은 손으로 안 적는다 — Stickers.jsx 의 `열쇠까지: '2026-10-16'` 줄에서 읽는다(규칙 22).
#    ⛔ 레시피 글은 recipe.mjs(앱과 같은 모듈)로 받는다(규칙 30).
#    ☑️ 칸마다 좋다/버린다/모르겠다 ＋ 복사(검수판 절대원칙 2026-08-19).
# 쓰는 법: python3 scripts/_판-핼러윈1016-1002.py <찍은폴더(_shot-핼러윈검수-0929 결과)> <낼파일.html>
import sys, re, io, base64, html, json, subprocess, os
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
shots, out = sys.argv[1], sys.argv[2]
src = open(os.path.join(APP, 'src/components/Stickers.jsx'), encoding='utf8').read()

def thumb(path, w):
    im = Image.open(path).convert('RGBA'); im.thumbnail((w, w * 3))
    b = io.BytesIO(); im.save(b, 'WEBP', quality=82)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()

sec = []   # (id, 제목, html)
# ① 그날 화면 (시계를 돌려 찍은 실제 앱)
names = sorted(f for f in os.listdir(shots) if f.endswith('.png'))
sec.append(('screens', '① 그날 앱 화면 (10/15 · 10/16 · 10/30 · 10/31)',
            ''.join(f'<figure><img src="{thumb(os.path.join(shots, f), 360)}"><figcaption>{html.escape(f[:-4])}</figcaption></figure>' for f in names)))
# ② 꾸미기 서랍 묶음 — 열쇠까지 2026-10-16
for line in src.split('\n'):
    if "열쇠까지: '2026-10-16'" not in line or 'items:' not in line: continue
    lb = re.search(r"label: '([^']*)'", line).group(1)
    items = re.findall(r"'([a-z_0-9]+)'", re.search(r"items: \[([^\]]*)\]", line).group(1))
    cells = ''.join(f'<figure class="s"><img src="{thumb(os.path.join(APP, "src/assets/stickers/photo", k + ".png"), 200)}"><figcaption>{k}</figcaption></figure>'
                    for k in items if os.path.exists(os.path.join(APP, 'src/assets/stickers/photo', k + '.png')))
    sec.append(('drawer-' + lb, f'② 꾸미기 서랍 · {lb} ({len(items)})', cells))
# ②-b 레꾸자랑 카드 뽑기 — cardSeasons.js 핼러윈 세트(gom·peng·duo) 에서 읽는다
cs = open(os.path.join(APP, 'src/data/cardSeasons.js'), encoding='utf8').read()
m = re.search(r"gom: \[([^\]]*)\], peng: \[([^\]]*)\], duo: \[([^\]]*)\] \},", cs[cs.find("hw_13") - 400:])
ck = re.findall(r"'([a-z_0-9]+)'", ','.join(m.groups())) if m else []
sec.append(('cards', f'②-b 레꾸자랑 카드 뽑기 · 핼러윈 세트 ({len(ck)})', ''.join(f'<figure class="s"><img src="{thumb(os.path.join(APP, "src/assets/stickers/photo", k + ".png"), 200)}"><figcaption>{k}</figcaption></figure>' for k in ck)))
# ③ 배경 둘
for k, lb, f in [('hwnight', '핼러윈 밤', 'halloween-night.webp'), ('hwfelt', '핼러윈 펠트', 'halloween-felt.webp')]:
    sec.append(('bg-' + k, f'③ 꾸미기 배경 · {lb}', f'<figure><img src="{thumb(os.path.join(APP, "src/assets/decorbg", f), 360)}"></figure>'))
# ④ 레시피 — 앱과 같은 값
txt = subprocess.run(['node', os.path.join(APP, 'scripts/recipe.mjs'), '통단호박'], capture_output=True, text=True).stdout
sec.append(('recipe', '④ 레시피 · 통단호박 크림스프 (SNS · 검수 표시 없음)', f'<pre>{html.escape(txt)}</pre>'))

body = ''.join(f'''<section data-id="{html.escape(i)}"><h2>{html.escape(t)}</h2><div class="grid">{h}</div>
<div class="pick"><label><input type="radio" name="{html.escape(i)}" value="좋다">좋다</label><label><input type="radio" name="{html.escape(i)}" value="버린다">버린다</label><label><input type="radio" name="{html.escape(i)}" value="모르겠다">모르겠다</label>
<input class="memo" placeholder="메모" data-memo="{html.escape(i)}"></div></section>''' for i, t, h in sec)
titles = json.dumps({i: t for i, t, _ in sec}, ensure_ascii=False)
page = f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>핼러윈 10/16 검수</title>
<style>body{{font-family:system-ui,sans-serif;background:#faf6ee;color:#3a2e26;margin:0;padding:16px 16px 120px}}h1{{font-size:22px}}section{{background:#fff;border-radius:14px;padding:14px;margin:14px 0}}h2{{font-size:16px;margin:0 0 10px}}
.grid{{display:flex;flex-wrap:wrap;gap:8px}}figure{{margin:0;width:47%}}figure img{{width:100%;border-radius:8px;background:#eee}}figure.s{{width:22%}}figure.s img{{background:#2b2333}}figcaption{{font-size:11px;color:#8a7a6a;word-break:break-all}}
pre{{white-space:pre-wrap;overflow-wrap:anywhere;width:100%;font-size:13px;margin:0}}.pick{{margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}}.memo{{flex:1;min-width:140px;padding:6px;border:1px solid #ddd;border-radius:6px}}
#bar{{position:fixed;left:0;right:0;bottom:0;background:#fff;padding:12px 16px;box-shadow:0 -2px 10px #0002;display:flex;gap:10px;align-items:center}}#bar button{{background:#5a3b22;color:#fff;border:0;border-radius:10px;padding:12px 16px;font-size:15px}}#out{{font-size:12px;white-space:pre-wrap}}</style>
<h1>🎃 10/16 저절로 열리는 것 — 전수 검수</h1><p>열쇠 없이 모두에게 열린다. 3일 전 마감 = 10/12. 칸마다 골라 주고 맨 아래 「결과 복사」.</p>{body}
<div id="bar"><button id="cp">📋 결과 복사</button><span id="st">아직 고른 게 없어</span></div><pre id="out"></pre>
<script>const T={titles};const K='hw1016-v1';let S={{}};try{{S=JSON.parse(localStorage.getItem(K)||'{{}}')}}catch(e){{}}
function save(){{try{{localStorage.setItem(K,JSON.stringify(S))}}catch(e){{}};const n=Object.values(S).filter(v=>v.p).length;document.getElementById('st').textContent=n+'/'+Object.keys(T).length+' 골랐어'}}
document.querySelectorAll('input[type=radio]').forEach(r=>{{if(S[r.name]&&S[r.name].p===r.value)r.checked=true;r.onchange=()=>{{S[r.name]=S[r.name]||{{}};S[r.name].p=r.value;save()}}}});
document.querySelectorAll('.memo').forEach(m=>{{const i=m.dataset.memo;if(S[i]&&S[i].m)m.value=S[i].m;m.oninput=()=>{{S[i]=S[i]||{{}};S[i].m=m.value;save()}}}});save();
function text(){{return '[핼러윈 10/16 검수]\\n'+Object.keys(T).map(i=>'· '+T[i]+' — '+((S[i]&&S[i].p)||'안 고름')+((S[i]&&S[i].m)?' : '+S[i].m:'')).join('\\n')}}
document.getElementById('cp').onclick=async()=>{{const t=text();const o=document.getElementById('out');o.textContent=t;let ok=false;try{{await navigator.clipboard.writeText(t);ok=true}}catch(e){{}}
const r=document.createRange();r.selectNodeContents(o);const s=getSelection();s.removeAllRanges();s.addRange(r);document.getElementById('st').textContent=ok?'복사했어 (안 되면 아래 글자를 길게 눌러 복사)':'아래 글자를 길게 눌러 복사해줘'}}</script>'''
open(out, 'w', encoding='utf8').write(page)
print(f'✅ {out} · {len(page)//1024}KB · 칸 {len(sec)}')
