# 🏷 「그림 ↔ 이름표」 전수 검수판 — 8/26 그릇 74컷 ＋ 8/24 새 컷 179장 (2026-08-26)
#
# 📮 창업자 = *"나머지 전수검사하면서 «이름라벨도 같이» 볼게 (올린74컷까지)"*
#
# ⭐ 이 판이 묻는 것 = **「이 그림이 이 이름이 맞나」** ＋ 「그림이 쓸 만한가」
#   ⛔ 8/24 낱개 192장은 **창업자 검수를 한 번도 안 받았다** — 그래서 앱에 «아직 안 넣었다».
#      이 판을 통과한 것만 넣는다(절대원칙 13).
#
# ⭐⭐ 왜 이름표가 중요한가 = 179장 중 **169장이 「이름이 이미 규칙에 있는」 요리**다.
#   넣으면 그 169개 요리의 그림이 통째로 바뀐다. **이름표가 틀리면 엉뚱한 요리에 붙는다.**
#
# 🔢 크기 = 진한 판 위 **250px** — 「이 그림이 이 이름이 맞나」는 이 크기로 판정된다.
#   ⛔ 원본 100% 로 253장을 담으면 판이 16MB 를 넘어 폰에서 안 열린다.
#      자르기 품질(잔재·잘림)은 자를 때 3단계 검수가 이미 봤다 — 여기선 «무엇이 그려졌나»를 본다.
#
# ☑️ 절대원칙 = 검수판은 «무조건» 체크 ＋ 복사 (clipboard 실패 대비 Range 폴백까지)
#
# 씀:  python3 scripts/_판-이름표전수-0826.py <낼html>
import base64, io, json, os, sys

import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
낼 = sys.argv[1]
진한 = (26, 24, 22)


def 담기(길, 최대 = 250):
    im = Image.open(길).convert('RGBA')
    if max(im.size) > 최대:
        s = 최대 / max(im.size)
        im = im.resize((max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s))), Image.LANCZOS)
    bg = Image.new('RGB', im.size, 진한)
    bg.paste(im, (0, 0), im)
    b = io.BytesIO()
    bg.quantize(colors = 96, method = Image.FASTOCTREE).save(b, 'PNG', optimize = True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


절 = []

# ── ① 오늘 앱에 넣은 74컷 (그림은 판정 끝 · 이름표만 본다)
컷 = json.load(open(f'{APP}/docs/stickers/음식-창업자-2026-08-26/컷목록.json'))
판정 = json.load(open(f'{APP}/../.tmp-판정.json')) if os.path.exists(f'{APP}/../.tmp-판정.json') else None
깨 = set(json.load(open(sys.argv[2]))['깨짐']) if len(sys.argv) > 2 else set()
넣은것 = [c for c in 컷 if c['key'] not in 깨]
칸 = []
for c in 넣은것:
    길 = f'{APP}/{c["src"]}'
    if os.path.exists(길):
        칸.append(dict(id = c['key'], name = c['name'], img = 담기(길), 표 = '앱에 들어감'))
절.append(dict(제목 = '① 오늘 앱에 넣은 그릇 컷', 설명 = '그림은 판정 끝났어 — 이름표가 맞는지만 봐줘.', 칸 = 칸))

# ── ② 8/24 새 컷 179장 (그림·이름표 둘 다 · 갈래로 묶는다)
낱개 = f'{APP}/docs/stickers/음식-창업자-2026-08-24/낱개'
이름표 = json.load(open(f'{APP}/docs/stickers/음식-창업자-2026-08-24/이름표.json'))
새 = {r['file']: r['name'] for r in json.load(open('/tmp/새192.json'))}
묶음 = [('② 구이 · 전 · 튀김', ['01', '02', '03', '04']),
        ('③ 면 · 국수', ['05', '06', '07']),
        ('④ 무침 · 장아찌', ['08', '09', '10', '11']),
        ('⑤ 김치 · 샐러드', ['12', '13', '14', '21']),
        ('⑥ 밥 · 볶음 · 조림', ['15', '16', '17', '18', '19']),
        ('⑦ 양식 · 샌드위치', ['20', '22', '23', '24', '25']),
        ('⑧ 중식', ['26', '27']),
        ('⑨ 국 · 탕 · 덮밥', ['28', '29', '30', '31', '32'])]
for 제목, 시트들 in 묶음:
    칸 = []
    for s in 시트들:
        for i in range(1, 7):
            f = f'{s}_{i:02d}.png'
            if f not in 새:
                continue
            길 = f'{낱개}/{f}'
            if not os.path.exists(길):
                continue
            칸.append(dict(id = f[:-4], name = 새[f], img = 담기(길), 표 = ''))
    if 칸:
        절.append(dict(제목 = 제목, 설명 = '', 칸 = 칸))

전체 = sum(len(a['칸']) for a in 절)

html = '''<title>이름표 전수 검수</title>
<style>
:root{--bg:#faf8f5;--ink:#241c14;--sub:#6b5d4e;--line:#e2d8ca;--card:#fff;--acc:#8a5a2b}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066}}
:root[data-theme=dark]{--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;word-break:keep-all}
.wrap{max-width:1000px;margin:0 auto;padding:20px 12px 110px}
h1{font-size:23px;margin:0 0 6px;letter-spacing:-.02em}
.lead{color:var(--sub);margin:0 0 16px}
.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 15px;margin:0 0 16px}
.box b{color:var(--acc)}
h2{font-size:18px;margin:26px 0 4px;padding-top:12px;border-top:2px solid var(--line)}
h2 span{font-size:13px;color:var(--sub);font-weight:400;font-variant-numeric:tabular-nums}
.sec-desc{color:var(--sub);font-size:14px;margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.cut{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px}
.cut img{display:block;width:100%;height:auto;border-radius:8px;background:#1a1816}
.nm{font-size:15px;font-weight:700;text-align:center;line-height:1.3}
.id{font-size:11px;color:var(--sub);text-align:center;font-variant-numeric:tabular-nums;margin-top:-4px}
.btns{display:flex;gap:4px}
.btns button{flex:1;min-height:40px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font-size:13px;cursor:pointer;padding:0;white-space:nowrap}
.btns button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.btns button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:9px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bar .n{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.bar button{min-height:42px;padding:0 15px;border-radius:9px;border:1px solid var(--acc);background:var(--acc);color:#fff;font-size:15px;font-weight:700;cursor:pointer}
#out{width:100%;max-width:1000px;margin:8px auto 0;white-space:pre-wrap;font-size:12px;display:none;background:var(--card);border:1px solid var(--line);border-radius:9px;padding:9px;max-height:34vh;overflow:auto}
</style>
<div class="wrap">
<h1>이름표 전수 검수</h1>
<p class="lead">그림 아래 이름이 <b>그 그림과 맞는지</b> 봐줘. 그림 자체가 이상하면 그것도.</p>
<div class="box">
<p><b>①번 74컷</b> = 오늘 앱에 넣은 그릇 컷. 그림은 판정 끝났으니 <b>이름표만</b> 봐줘.<br>
<b>②~⑨번 179장</b> = 8/24 시트에서 자른 건데 <b>아직 앱에 한 장도 안 넣었어.</b> 이 판을 통과한 것만 넣을게.</p>
<p><b>⛔ 왜 이름표가 중요한가</b> — 179장 중 <b>169장이 「이름이 이미 규칙에 있는」 요리</b>야.
넣으면 그 요리의 그림이 통째로 바뀌어. 이름표가 틀리면 <b>엉뚱한 요리에 붙는다.</b></p>
<p><b>이름표는 내가 원본 시트 라벨을 눈으로 읽어 적은 거야</b> — 틀렸을 수 있어. 그래서 이 판을 만들었어.</p>
</div>
<div id="secs"></div>
</div>
<div class="bar">
<span class="n" id="n">0 / __N__</span>
<button id="copy" type="button">결과 복사하기</button>
<div id="out"></div>
</div>
<script>
const DATA = __DATA__;
const KEY = 'hankki-이름표전수-0826';
let 답 = {};
try { 답 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 답 = {} }
// ⛔ 이모지만 두면 «무슨 뜻인지» 안 읽힌다 — 글자를 같이 넣는다(실물로 보고 잡았다 · 절대원칙 21)
const 종류 = [['좋아', '좋아'], ['이름틀림', '이름✕'], ['그림별로', '그림✕']];
const box = document.getElementById('secs');
let 총 = 0;
DATA.forEach(sec => {
  const h = document.createElement('h2');
  h.innerHTML = `${sec.제목} <span>${sec.칸.length}장</span>`;
  box.appendChild(h);
  if (sec.설명) { const p = document.createElement('p'); p.className = 'sec-desc'; p.textContent = sec.설명; box.appendChild(p) }
  const g = document.createElement('div'); g.className = 'grid';
  sec.칸.forEach(c => {
    총++;
    const el = document.createElement('div'); el.className = 'cut';
    el.innerHTML = `<img alt="${c.name}" loading="lazy" src="${c.img}">
      <div class="nm">${c.name}</div><div class="id">${c.id}</div><div class="btns"></div>`;
    const btns = el.querySelector('.btns');
    종류.forEach(([v, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.title = v;
      b.setAttribute('aria-label', `${c.name} ${v}`);
      b.setAttribute('aria-pressed', String(답[c.id] === v));
      b.onclick = () => {
        답[c.id] = (답[c.id] === v) ? undefined : v;
        if (답[c.id] === undefined) delete 답[c.id];
        try { localStorage.setItem(KEY, JSON.stringify(답)) } catch (e) {}
        btns.querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', String(답[c.id] === 종류[i][0])));
        세기();
      };
      btns.appendChild(b);
    });
    g.appendChild(el);
  });
  box.appendChild(g);
});
function 세기() { document.getElementById('n').textContent = `${Object.keys(답).length} / ${총}` }
세기();
function 글자() {
  const g = { 좋아: [], 이름틀림: [], 그림별로: [] };
  DATA.forEach(s => s.칸.forEach(c => { if (답[c.id]) g[답[c.id]].push(`${c.id} ${c.name}`) }));
  return 종류.map(([v, e]) => `${e} ${v} ${g[v].length}개\\n` + g[v].map(s => '  ' + s).join('\\n')).join('\\n');
}
document.getElementById('copy').onclick = async () => {
  const t = 글자(); const out = document.getElementById('out');
  try {
    await navigator.clipboard.writeText(t);
    out.style.display = 'none';
    document.getElementById('copy').textContent = '복사했어 ✅';
    setTimeout(() => document.getElementById('copy').textContent = '결과 복사하기', 1800);
  } catch (e) {
    // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다 → 글자를 골라 준다
    out.textContent = t; out.style.display = 'block';
    const r = document.createRange(); r.selectNodeContents(out);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
};
</script>'''
html = html.replace('__DATA__', json.dumps(절, ensure_ascii = False)).replace('__N__', str(전체))
open(낼, 'w').write(html)
print(f'✅ {전체}장 · 절 {len(절)}개 · {os.path.getsize(낼) / 1e6:.1f}MB → {낼}')
