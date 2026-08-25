# 🍽 「접시 굽이 살았나 · 매끈해졌나」 검수판 (2026-08-26 · 4판)
#
# 📮 창업자 = *"근데 접시를 많이 잘라먹은 듯..."* ·
#            *"좋다고 한것도 아랫부분없이 윗부분만 잘라놓은것들이 많아 찰떡이랑 쿠키같은."*
#
# ⭐⭐ **판 구성이 지난 판과 다르다 — 「배포판 ↔ 새판」을 «나란히» 놓는다.**
#   지난 판은 새 컷만 보여줘서 창업자가 «나아졌는지»를 기억에 기대 판단해야 했다.
#   ＋ 굽 아래를 **3배로 확대**해 같이 놓는다 — 계단은 원본 크기로는 안 보인다(글자 검수 원칙과 같다).
#
# ⛔ 108컷을 통째로 다시 보게 하지 않는다(규칙 8) — 창업자가 「깨짐·애매」로 고른 것만.
#   같은 방식으로 잘랐으니 그게 나으면 나머지도 낫다.
#
# ☑️ 절대원칙 = 검수판은 «무조건» 체크 ＋ 복사 (clipboard 실패 대비 Range 폴백까지)
#
# 씀:  python3 scripts/_판-그릇굽-0826.py <판정json> <낼html>
import base64, io, json, os, subprocess, sys

from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-26'
배포 = 'claude/chatgpt-conversation-link-kvn5ph'
판정 = json.load(open(sys.argv[1]))
낼 = sys.argv[2]
볼것 = 판정['깨짐'] + 판정['애매']
컷 = {c['key']: c for c in json.load(open(f'{뿌리}/컷목록.json'))}


def 체커(im, 배 = 1):
    if 배 > 1:
        im = im.resize((im.size[0] * 배, im.size[1] * 배), Image.NEAREST)
    w, h = im.size
    bg = Image.new('RGB', (w, h), (255, 255, 255))
    p = bg.load()
    칸 = 9 * max(1, 배)
    for y in range(h):
        for x in range(w):
            if ((x // 칸) + (y // 칸)) % 2:
                p[x, y] = (208, 208, 208)
    bg.paste(im, (0, 0), im)
    return bg


def 담기(im, 최대 = 0):
    """⛔ 판이 무거우면 폰에서 안 열린다 — 첫 판이 14.5MB 였다(한계 16MB).
    ⭐ 사진이라 색이 많아 «팔레트»로 줄인다. 판정할 것은 «실루엣 경계»라 색 수는 판정과 무관하다."""
    if 최대 and max(im.size) > 최대:
        s = 최대 / max(im.size)
        im = im.resize((max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s))), Image.LANCZOS)
    b = io.BytesIO()
    im.convert('RGB').quantize(colors = 128, method = Image.FASTOCTREE).save(b, 'PNG', optimize = True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def 굽확대(im, 배 = 3):
    """굽 «아래»만 잘라 확대한다 — 계단은 원본 크기로는 안 보인다."""
    import numpy as np
    a = np.array(im)[..., 3]
    ys = np.where(a.max(axis = 1) > 32)[0]
    xs = np.where(a.max(axis = 0) > 32)[0]
    아래, cx = int(ys[-1]), (int(xs[0]) + int(xs[-1])) // 2
    x0, x1 = max(0, cx - 62), min(im.size[0], cx + 62)
    y0, y1 = max(0, 아래 - 46), min(im.size[1], 아래 + 5)
    return 체커(im.crop((x0, y0, x1, y1)), 배)


칸들 = []
못읽음 = []
for k in 볼것:
    c = 컷.get(k)
    if not c or not os.path.exists(f'{APP}/{c["src"]}'):
        못읽음.append(k)
        continue
    새 = Image.open(f'{APP}/{c["src"]}').convert('RGBA')
    r = subprocess.run(['git', '-C', APP, 'show',
                        f'{배포}:hankki/src/assets/stickers/photo/{k}.png'], capture_output = True)
    if r.returncode or not r.stdout:
        못읽음.append(k)
        continue
    옛 = Image.open(io.BytesIO(r.stdout)).convert('RGBA')
    칸들.append(dict(
        key = k, name = c['name'],
        옛크기 = f'{옛.size[0]}×{옛.size[1]}', 새크기 = f'{새.size[0]}×{새.size[1]}',
        옛 = 담기(체커(옛), 330), 새 = 담기(체커(새), 330),
        옛굽 = 담기(굽확대(옛)), 새굽 = 담기(굽확대(새)),
    ))

# ⛔ 못 읽은 것을 조용히 빼지 않는다 — 「전부 봤다」로 오해하게 된다
머리못 = (f'<p class="warn">⚠️ 못 읽어서 판에 못 실은 컷 {len(못읽음)}개: {", ".join(못읽음)}</p>'
          if 못읽음 else '')

html = '''<title>접시 굽 검수</title>
<style>
:root{--bg:#faf8f5;--ink:#241c14;--sub:#6b5d4e;--line:#e2d8ca;--card:#fff;--acc:#8a5a2b}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066}}
:root[data-theme=dark]{--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;word-break:keep-all}
.wrap{max-width:920px;margin:0 auto;padding:22px 14px 120px}
h1{font-size:24px;margin:0 0 6px;letter-spacing:-.02em}
.lead{color:var(--sub);margin:0 0 18px}
.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 16px}
.box b{color:var(--acc)}
.warn{color:#b4451f}
.cut{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:0 0 14px}
.cut h2{font-size:17px;margin:0 0 2px}
.cut .k{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 0}
.pane{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.pane .cap{font-size:12px;padding:5px 8px;color:var(--sub);border-bottom:1px solid var(--line);background:var(--card);font-variant-numeric:tabular-nums}
.pane img{display:block;width:100%;height:auto}
.zoom .cap{color:#b4451f}
.btns{display:flex;gap:8px;margin:10px 0 0;flex-wrap:wrap}
.btns button{flex:1;min-width:88px;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-size:15px;cursor:pointer}
.btns button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.btns button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc);font-weight:700}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bar .n{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.bar button{min-height:44px;padding:0 16px;border-radius:10px;border:1px solid var(--acc);background:var(--acc);color:#fff;font-size:15px;font-weight:700;cursor:pointer}
#out{width:100%;max-width:920px;margin:8px auto 0;white-space:pre-wrap;font-size:13px;display:none;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px}
</style>
<div class="wrap">
<h1>접시 굽이 살았나</h1>
<p class="lead">왼쪽이 <b>지금 폰에 깔린 것</b>, 오른쪽이 <b>새로 자른 것</b>. 아래 줄은 <b>굽 아래를 3배로 확대</b>한 것.</p>
<div class="box">
<p><b>⛔ 내가 저지른 것</b> — 지난 판이 접시 «굽(발)»을 통째로 지웠어. 창업자가 짚은 그대로야.<br>
실측 = 108컷 중 <b>세로 10% 이상 잘린 것 30컷</b>. 찰떡·쿠키·호떡·티라미수·팥빙수가 다 여기.</p>
<p><b>뿌리</b> = 진갈색 윤곽선이 <b>굽까지 안 내려간 칸이 66/108(61%)</b>인데,
내 도구가 그 선을 「접시 끝」으로 믿고 그 아래를 배경으로 지웠어.</p>
<p><b>고침</b> = 선을 안 쓰고 밝기 <b>&lt;246</b>(자르기 도구가 배경이라 보는 바로 그 값)으로 몸통을 잡아.
굽은 236이라 안에 들어와 살고, 굽 아래 흐린 빛무리(248~254)만 지워져.</p>
<p><b>＋ 다시는 안 그러게</b> — 이제 자를 때마다 <b>「지금 배포된 컷보다 짧으면 죽는다」</b>는 검사가 돌아.
오늘 실제로 구이 시트 하나를 잡아서 멈췄어.</p>
<p class="warn">⚠️ 정직하게 — 내 「매끈함」 숫자는 이번에도 헛짚었어(눈으론 확실히 나은데 숫자는 반반이라 나와).
<b>판단은 창업자 눈으로 해줘.</b></p>
</div>
__못읽음__
<div id="cuts"></div>
</div>
<div class="bar">
<span class="n" id="n">0 / 0</span>
<button id="copy" type="button">결과 복사하기</button>
<div id="out"></div>
</div>
<script>
const DATA = __DATA__;
const KEY = 'hankki-그릇굽-0826';
let 답 = {};
try { 답 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 답 = {} }
const 종류 = [['좋아', '✅ 좋아'], ['애매', '🟡 애매'], ['깨짐', '⛔ 깨짐']];
const box = document.getElementById('cuts');
DATA.forEach(c => {
  const el = document.createElement('div');
  el.className = 'cut';
  el.innerHTML = `<h2>${c.name}</h2><div class="k">${c.key} · ${c.옛크기} → ${c.새크기}</div>
    <div class="pair">
      <div class="pane"><div class="cap">지금 폰에 깔린 것</div><img alt="${c.name} 지금 컷" src="${c.옛}"></div>
      <div class="pane"><div class="cap">새로 자른 것</div><img alt="${c.name} 새 컷" src="${c.새}"></div>
    </div>
    <div class="pair zoom">
      <div class="pane"><div class="cap">굽 아래 3배 — 지금</div><img alt="지금 굽 확대" src="${c.옛굽}"></div>
      <div class="pane"><div class="cap">굽 아래 3배 — 새것</div><img alt="새 굽 확대" src="${c.새굽}"></div>
    </div>
    <div class="btns"></div>`;
  const btns = el.querySelector('.btns');
  종류.forEach(([v, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.setAttribute('aria-pressed', String(답[c.key] === v));
    b.onclick = () => {
      답[c.key] = (답[c.key] === v) ? undefined : v;
      if (답[c.key] === undefined) delete 답[c.key];
      try { localStorage.setItem(KEY, JSON.stringify(답)) } catch (e) {}
      btns.querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', String(답[c.key] === 종류[i][0])));
      세기();
    };
    btns.appendChild(b);
  });
  box.appendChild(el);
});
function 세기() { document.getElementById('n').textContent = `${Object.keys(답).length} / ${DATA.length}`; }
세기();
function 글자() {
  const g = { 좋아: [], 애매: [], 깨짐: [] };
  DATA.forEach(c => { if (답[c.key]) g[답[c.key]].push(`${c.key} ${c.name}`) });
  return 종류.map(([v, label]) => `${label} ${g[v].length}개\\n` + g[v].map(s => '  ' + s).join('\\n')).join('\\n');
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
html = html.replace('__DATA__', json.dumps(칸들, ensure_ascii = False)).replace('__못읽음__', 머리못)
open(낼, 'w').write(html)
print(f'✅ {len(칸들)}컷 · {os.path.getsize(낼) / 1e6:.1f}MB → {낼}')
if 못읽음:
    print(f'⚠️ 못 읽은 컷 {len(못읽음)}개: {못읽음}')
