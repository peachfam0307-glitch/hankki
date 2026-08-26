# 🍽 「8/24 접시 깨짐 68컷 — 다시 자르니 살았나」 검수판 (2026-08-26)
#
# 📮 창업자 = *"72개는 접시 자름이 넘어갈수가 없어."*
#            ＋ 253장 전수검수 = 좋아 181 · 이름틀림 0 · **접시깨짐 72**(그중 68컷이 8/24 시트)
#
# ⭐⭐ **다시 뽑기 «전»에 다시 잘라 봤다**(규칙 8 — 노가다는 클로드가).
#   원본 시트 32장이 그대로 있고, 「접시굽 눌러주기」를 이 시트엔 한 번도 안 써 봤다.
#   → 14시트 84컷 전부 자르기 성공 · 세로 355 → 363px (＋2.1%)
#
# ⛔⛔ **내 숫자는 못 믿는다 — 이 건에서 다섯 번 헛짚었다.**
#   「꺾임」·「흐린 띠 비율」·「가장자리 밝기」·「세로 손실」·「바닥 들쭉날쭉」이 전부 헛돌았다.
#   눈으로는 명백히 나은데 숫자가 안 움직인다. **판정은 창업자 눈으로 받는다**(규칙 11).
#
# ⭐ 판 구성 = 「옛컷 ↔ 새컷」을 «나란히» ＋ **접시 아래를 4배 확대**해서 한 줄 더.
#   ⛔ 원본 크기로는 톱니가 «안 보인다» — 오늘 내가 그걸로 한 번 헛짚었다
#     (560px 로 보고 *"접시가 멀쩡해 보인다"* 고 했는데 4배로 키우니 톱니가 드러났다).
#
# ☑️ 절대원칙 = 검수판은 «무조건» 체크 ＋ 복사 (clipboard 실패 대비 Range 폴백까지)
#
# 씀:  python3 scripts/_판-8월24굽-0826.py <낼html>
import base64, io, json, os, sys

import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-24'
낼 = sys.argv[1]
행, 열 = 2, 3

판정 = json.load(open(f'{APP}/docs/stickers/판정-이름표전수-2026-08-26.json'))
깨 = sorted(k for k in 판정['접시깨짐'] if not k.startswith('gr_'))
이름표 = json.load(open(f'{뿌리}/이름표.json'))

진한 = (26, 24, 22)


def 얹기(im, 배 = 1):
    """⛔⛔ 흰 접시를 «밝은» 판에 얹으면 가장자리가 안 보인다 — 창업자 = *"어두운판에서 잘보여"*."""
    if 배 > 1:
        im = im.resize((im.size[0] * 배, im.size[1] * 배), Image.NEAREST)
    bg = Image.new('RGB', im.size, 진한)
    bg.paste(im, (0, 0), im)
    return bg


def 담기(im, 최대 = 0):
    """⛔ 판이 무거우면 폰에서 안 열린다(한계 16MB). 판정할 건 «실루엣»이라 색 수는 무관하다."""
    if 최대 and max(im.size) > 최대:
        s = 최대 / max(im.size)
        im = im.resize((max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s))), Image.LANCZOS)
    b = io.BytesIO()
    im.convert('RGB').quantize(colors = 96, method = Image.FASTOCTREE).save(b, 'PNG', optimize = True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def 굽확대(im, 배 = 4):
    """접시 «아래 테두리»만 잘라 확대 — 톱니는 원본 크기로는 안 보인다."""
    a = np.asarray(im)[..., 3]
    ys = np.where(a.max(axis = 1) > 32)[0]
    xs = np.where(a.max(axis = 0) > 32)[0]
    y1, x0, x1 = int(ys[-1]), int(xs[0]), int(xs[-1])
    h, w = int(ys[-1] - ys[0] + 1), int(x1 - x0 + 1)
    # ⭐ 판정할 것은 «접시 아래 테두리»다 — 음식을 많이 잡으면 정작 볼 곳이 좁아진다
    조각 = im.crop((x0 + int(w * 0.18), max(0, y1 - int(h * 0.13)), x1 - int(w * 0.18), y1 + 1))
    # ⛔⛔ 「4배로 키웠다」와 「폰에서 4배로 보인다」는 다른 말이다.
    #   첫 판은 폭 300px 을 4배(1200px) 로 키워 놓고 **폰 칸 190px** 에 밀어넣어
    #   실질 0.6배로 «줄어들었다». 확대가 통째로 사라진 것이다(규칙 21 로 잡았다).
    #   ✅ 크롭을 좁히고(140px) 확대 칸을 «한 줄 전체»로 놓는다 → 폰에서 실질 3배 가까이 된다.
    if 조각.size[0] > 140:
        조각 = 조각.crop(((조각.size[0] - 140) // 2, 0, (조각.size[0] + 140) // 2, 조각.size[1]))
    return 얹기(조각, 배)


칸들, 못읽음 = [], []
for k in 깨:
    s, i = k.split('_')
    옛길 = f'{뿌리}/낱개/{k}.png'
    새길 = f'{뿌리}/낱개-다시-0826/{s}/{s}{i}.png'
    if not (os.path.exists(옛길) and os.path.exists(새길)):
        못읽음.append(k)
        continue
    옛 = Image.open(옛길).convert('RGBA')
    새 = Image.open(새길).convert('RGBA')
    이름 = 이름표.get(s, [])
    이름 = 이름[int(i) - 1] if len(이름) >= int(i) else k
    칸들.append(dict(
        key = k, name = 이름,
        옛크기 = f'{옛.size[0]}×{옛.size[1]}', 새크기 = f'{새.size[0]}×{새.size[1]}',
        옛 = 담기(얹기(옛), 320), 새 = 담기(얹기(새), 320),
        옛굽 = 담기(굽확대(옛)), 새굽 = 담기(굽확대(새)),
    ))

# ⛔ 못 읽은 것을 조용히 빼지 않는다 — 「전부 봤다」로 오해하게 된다
머리못 = (f'<p class="warn">⚠️ 못 읽어서 판에 못 실은 컷 {len(못읽음)}개: {", ".join(못읽음)}</p>'
          if 못읽음 else '')

html = '''<title>8월 24일 접시 다시 자르기</title>
<style>
:root{--bg:#faf8f5;--ink:#241c14;--sub:#6b5d4e;--line:#e2d8ca;--card:#fff;--acc:#8a5a2b;--bad:#b4451f}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066;--bad:#e08a5c}}
:root[data-theme=dark]{--bg:#17130f;--ink:#f0e8dd;--sub:#a8988a;--line:#332b23;--card:#211a14;--acc:#d9a066;--bad:#e08a5c}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;word-break:keep-all}
.wrap{max-width:920px;margin:0 auto;padding:22px 14px 130px}
h1{font-size:24px;margin:0 0 6px;letter-spacing:-.02em;text-wrap:balance}
.lead{color:var(--sub);margin:0 0 18px}
.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 16px}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
.box b{color:var(--acc)}
.warn{color:var(--bad)}
.cut{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:0 0 14px}
.cut h2{font-size:19px;margin:0 0 2px;letter-spacing:-.01em}
.cut .k{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 0}
.pane{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#1a1816}
.pane .cap{font-size:12px;padding:5px 8px;color:var(--sub);border-bottom:1px solid var(--line);background:var(--card);font-variant-numeric:tabular-nums}
.pane img{display:block;width:100%;height:auto}
/* ⭐ 확대는 «한 줄 전체»로 — 반 칸에 넣으면 4배로 키운 것이 도로 줄어든다 */
.zoom{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0 0}
.zoom .cap{color:var(--bad)}
.zoom img{image-rendering:pixelated}
.btns{display:flex;gap:8px;margin:10px 0 0;flex-wrap:wrap}
.btns button{flex:1;min-width:88px;min-height:46px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-size:15px;cursor:pointer}
.btns button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.btns button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc);font-weight:700}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bar .n{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.bar button{min-height:46px;padding:0 16px;border-radius:10px;border:1px solid var(--acc);background:var(--acc);color:#fff;font-size:15px;font-weight:700;cursor:pointer}
#out{width:100%;max-width:920px;margin:8px auto 0;white-space:pre-wrap;font-size:13px;display:none;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;max-height:34vh;overflow:auto}
</style>
<div class="wrap">
<h1>8/24 접시 다시 자르기</h1>
<p class="lead">왼쪽이 <b>네가 「접시 깨짐」이라고 한 컷</b>, 오른쪽이 <b>오늘 다시 자른 것</b>.
아래 줄은 <b>접시 아래 테두리를 4배로 확대</b>한 거야 — 톱니는 원본 크기로는 안 보여.</p>
<div class="box">
<p><b>무슨 일이었나</b> — 흰 접시의 아래 테두리가 <b>250~253</b>인데 자르는 칼은 <b>246보다 밝으면 배경</b>으로 봐.
그래서 접시 아래가 배경과 같은 눈에 잡혀 <b>들쭉날쭉 뜯겼어</b>. 시트마다 얼룩이 달라서 갈렸고.</p>
<p><b>고침</b> — 자르기 <b>전</b>에 접시 아래 테두리만 아주 살짝 눌러서 칼이 「그림」으로 보게 했어.
누르는 자리는 <b>실루엣 경계에서 안쪽 14px</b>뿐이라 접시 안쪽은 안 건드려.</p>
<p>14시트 <b>84컷 전부</b> 잘렸고 세로가 <b>355 → 363px</b> 로 늘었어(굽이 8px 더 살아난 거야).</p>
<p class="warn">⚠️ 정직하게 — 내 「매끈함」 숫자는 <b>이 건에서 다섯 번 헛짚었어</b>.
눈으론 확실히 나은데 숫자가 안 움직여. <b>판정은 네 눈으로 해줘.</b></p>
<p class="warn">⛔ 자르기로 안 되면 다시 뽑아야 해. 「깨짐」으로 남는 건 <b>다시 뽑을 리스트</b>로 넘길게.</p>
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
const KEY = 'hankki-8월24굽-0826';
let 답 = {};
try { 답 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 답 = {} }
const 종류 = [['좋아', '✅ 좋아졌어'], ['애매', '🟡 애매'], ['깨짐', '⛔ 아직 깨짐']];
const box = document.getElementById('cuts');
DATA.forEach(c => {
  const el = document.createElement('div');
  el.className = 'cut';
  el.innerHTML = `<h2>${c.name}</h2><div class="k">${c.key} · ${c.옛크기} → ${c.새크기}</div>
    <div class="pair">
      <div class="pane"><div class="cap">옛컷 (깨짐이라 한 것)</div><img alt="${c.name} 옛 컷" src="${c.옛}"></div>
      <div class="pane"><div class="cap">새로 자른 것</div><img alt="${c.name} 새 컷" src="${c.새}"></div>
    </div>
    <div class="zoom">
      <div class="pane"><div class="cap">접시 아래 4배 — 옛것</div><img alt="옛 접시 아래 확대" src="${c.옛굽}"></div>
      <div class="pane"><div class="cap">접시 아래 4배 — 새것</div><img alt="새 접시 아래 확대" src="${c.새굽}"></div>
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
