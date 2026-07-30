#!/usr/bin/env python3
"""🍂 유료팩 배경 1차 조정 — 추석(9월) · 가을 다꾸(10월) 각 3안.

창업자 2026-07-30: *"배경은 2개만 일단 조정해보자 우리 유료레꾸팩에 어울려야 하니까"*

⭐ 원칙: **스티커가 쨍하면 배경은 차분해야 한다.**
   추석·가을다꾸 팩 스티커 톤 = "쨍한 굵은 선"(창업자 확정) → 배경까지 세면 둘이 싸운다.
   배경은 **받쳐주는 판**이지 주인공이 아니다.
"""
import base64, io, os, re, subprocess, sys
from PIL import Image

ROOT = '/home/user/hankki/hankki'
OUT = f'{ROOT}/docs/demo/bgpack-catalog.html'

def uri(k, w=260):
    im = Image.open(f'{ROOT}/src/assets/stickers/photo/{k}.png').convert('RGBA')
    im.thumbnail((w, w), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

# ⭐ 캐릭터 하나만 얹으면 판단이 안 된다 — **실제로 꾸민 표지처럼** 마테·소품까지 얹어야
#    "이 배경이 우리 팩과 어울리나"를 볼 수 있다 (창업자: *"우리레꾸팩을 배경에 얹어봐 / 가을애들이랑"*)
KEYS = ['au_b01', 'au_b05', 'au_b13', 'au_i03', 'au_i04', 'au_i12', 'au_i15', 'au_i16', 'au_t06', 'au_t02', 'au_s02']
CH = {k: uri(k) for k in KEYS}
RAT = {}
for k in KEYS:
    im = Image.open(f'{ROOT}/src/assets/stickers/photo/{k}.png'); RAT[k] = round(im.width / im.height, 3)

MAPLE = ('<svg viewBox="0 0 32 32">'
  '<path d="M16 2.6 18.9 8l3.4-1-1 3.5 5.6-2.3-2 4.2 4.7-.6-3.4 3.4 3.8 1.7-4.6 1.9 2.4 3.1-5.3-.6.5 4.9-4.3-3.2-1.2 3.4h-1.1l-1.2-3.4-4.3 3.2.5-4.9-5.3.6 2.4-3.1L1 17.9l3.8-1.7-3.4-3.4 4.7.6-2-4.2 5.6 2.3-1-3.5 3.4 1Z" fill="#cf8248"/>'
  '<path d="M16 29.4V14.6" stroke="#a75f2e" stroke-width="1.3" stroke-linecap="round"/></svg>')
GINKGO = ('<svg viewBox="0 0 32 32">'
  '<path d="M16 26.5c-6.6 0-11-3.4-11-7.6C5 13.4 9.6 7 16 3.5 22.4 7 27 13.4 27 18.9c0 4.2-4.4 7.6-11 7.6Z'
  'M16 26.5c1.4-2.6 1.5-5.2.3-7.9-1.4 2.7-1.5 5.3-.3 7.9Z" fill="#dcae55" fill-rule="evenodd"/>'
  '<path d="M16 26.5v3.6" stroke="#bd8f30" stroke-width="1.4" stroke-linecap="round"/></svg>')
SPOTS = [(9, -18, 0, .95), (31, -32, 1.4, .72), (55, -12, 2.6, 1.1), (78, -28, .8, .82), (93, -16, 3.3, .68)]

def leaves(on):
    if not on: return ''
    return ''.join(f'<span class="lf" style="left:{x}%;top:{y}%;width:{round(10*s,1)}%;animation-delay:{d}s">'
                   f'{MAPLE if i % 2 == 0 else GINKGO}</span>' for i, (x, y, d, s) in enumerate(SPOTS))

# ── 추석 3안 — 한지·보름달·달빛. 쨍한 스티커를 받치려면 **낮은 채도 + 넓은 여백** ──
CHUSEOK = [
 ('① 한지', '닥나무 결이 은은하게. <b>제일 조용한 안</b> — 쨍한 스티커가 다 살아난다.',
  "radial-gradient(rgba(150,120,80,.09) 1px,transparent 1.6px) 0 0/13px 13px,"
  "repeating-linear-gradient(92deg,rgba(150,120,80,.05) 0 1px,transparent 1px 7px),"
  "linear-gradient(165deg,#faf2e3,#f0e3ca)", 0),
 ('② 보름달', '오른쪽 위에 달 하나. <b>가운데를 비워</b> 스티커 놓을 자리를 남겼다.',
  "radial-gradient(circle at 78% 20%,#fdf3d8 0 11%,rgba(253,243,216,.55) 11% 15%,rgba(253,243,216,0) 26%),"
  "radial-gradient(120% 80% at 50% 120%,rgba(190,160,110,.16),transparent 60%),"
  "linear-gradient(170deg,#f6ead4,#eadcbe)", 0),
 ('③ 달빛 밤', '어두운 안. <b>쨍한 스티커가 제일 튄다</b> — 다만 글자는 밝은 색을 써야 한다.',
  "radial-gradient(circle at 74% 18%,#fbf0cf 0 9%,rgba(251,240,207,.4) 9% 14%,rgba(251,240,207,0) 24%),"
  "radial-gradient(90% 60% at 50% 108%,rgba(120,100,70,.35),transparent 62%),"
  "linear-gradient(170deg,#4a4535,#37342a)", 0),
]
# ── 가을 다꾸 3안 — 웜 베이지·창문빛·낙엽 ──
AUTUMN = [
 ('① 크라프트', '누런 종이결. 낙엽·단풍 스티커랑 <b>같은 계열</b>이라 자연스럽게 붙는다.',
  "radial-gradient(rgba(140,100,55,.13) 1px,transparent 1.5px) 0 0/10px 10px,"
  "linear-gradient(165deg,#f2e2c6,#e4cfa9)", 0),
 ('② 창문 가을빛', '오후 창빛이 비스듬히. <b>사진을 올려도 예쁘다</b>(빛이 사진과 겹쳐 보임).',
  "linear-gradient(102deg,transparent 0 20%,rgba(150,110,60,.13) 20% 22.5%,transparent 22.5% 49%,"
  "rgba(150,110,60,.13) 49% 51.5%,transparent 51.5%),"
  "radial-gradient(95% 65% at 82% 4%,rgba(255,214,150,.6),transparent 62%),"
  "linear-gradient(168deg,#fdf2df,#f2e0c4)", 0),
 ('③ 낙엽 내림', '단풍·은행이 천천히. <b>이 팩의 얼굴</b>이 될 안 — 대신 배경색은 더 죽였다.',
  "radial-gradient(90% 60% at 76% 6%,rgba(255,226,183,.55),transparent 62%),"
  "linear-gradient(170deg,#fbf1e2,#efdfc6)", 1),
]

# ── 실제로 꾸민 것처럼 얹는 배치 3종 ──
#    ⚠️ 셋을 같은 배치로 두면 배경 차이가 안 보인다. 배치를 달리해 **여러 상황**에서 본다.
LAY = {
 'a': [('au_t06', 50, 9, 66, -2.5), ('au_b01', 37, 52, 40, 0), ('au_i03', 79, 40, 27, 7),
       ('au_i16', 17, 34, 22, -9)],
 'b': [('au_s02', 50, 33, 54, 0), ('au_t02', 50, 8, 58, 2), ('au_b05', 74, 66, 31, 0),
       ('au_b13', 26, 68, 33, 0)],
 'c': [('au_t06', 50, 8, 62, 1.5), ('au_i12', 50, 55, 50, 0), ('au_b01', 18, 62, 32, -3),
       ('au_b05', 83, 60, 28, 3), ('au_i15', 76, 27, 21, 10), ('au_i04', 20, 28, 22, -12)],
}
def deco(key):
    return ''.join(
      f'<span class="st" style="left:{x}%;top:{y}%;width:{w}%;'
      f'transform:translate(-50%,-50%) rotate({r}deg);aspect-ratio:{RAT[i]}">'
      f'<span class="si c-{i}"></span></span>' for i, x, y, w, r in LAY[key])

def card(name, why, bg, mv, ch):
    tag = '<span class="mv">움직임</span>' if mv else ''
    return (f'<figure class="cv"><div class="sheet" style="background:{bg}">{leaves(mv)}{deco(ch)}</div>'
            f'<figcaption><b>{name}</b> {tag}<span>{why}</span></figcaption></figure>')

def group(title, sub, rows):
    cards = ''.join(card(n, w, bg, mv, 'abc'[i % 3]) for i, (n, w, bg, mv) in enumerate(rows))
    return f'<section class="grp"><h2>{title}</h2><p class="why">{sub}</p><div class="grid">{cards}</div></section>'

body = f'''<title>한끼 · 유료팩 배경 1차안</title>
<div class="wrap">
<header class="top">
  <p class="eyebrow">한끼 꾸미기 · 유료팩 배경</p>
  <h1>제일 급한 두 팩부터</h1>
  <p class="lede"><b>추석(9월)</b>과 <b>가을 다꾸(10월)</b> — 가장 먼저 나갈 두 팩이야. 각각 3안 만들었어. <b>실제 가을 스티커로 꾸민 표지</b>를 그대로 얹었어(마테·곰펭·소품). ⚠️ 추석 스티커는 아직 없어서 <b>가을 애들로 대신</b> 얹었어 — 색감만 봐줘.</p>
  <p class="lede rule">⭐ <b>스티커가 쨍하면 배경은 차분해야 해.</b> 이 두 팩 스티커 톤이
  "쨍한 굵은 선"이라, 배경까지 세면 둘이 싸워. <b>배경은 받쳐주는 판</b>이지 주인공이 아니야.
  그래서 셋 다 일부러 <b>채도를 낮추고 가운데를 비웠어</b>.</p>
  <button id="pause" class="pausebtn" type="button">멈춰서 보기</button>
</header>
{group('추석 · 9월', '한가위 = 달·한지·따뜻한 종이. 캐릭터는 실제로 그 팩에 들어갈 가을 꼬르곰·펭펭으로 얹었어.', CHUSEOK)}
{group('가을 다꾸 · 10월', '낙엽·단풍 스티커가 잔뜩 올라갈 팩이라, 배경은 그 색과 같은 계열로 낮게 깔았어.', AUTUMN)}
<section class="grp">
  <h2>고르는 법</h2>
  <ul class="tips">
    <li><b>표지에 사진을 넣는 사람</b>이 많으면 → 빛이 있는 안(추석②·가을②)이 사진과 잘 겹쳐.</li>
    <li><b>스티커를 잔뜩 붙이는 사람</b>이면 → 제일 조용한 안(추석①·가을①)이 안 싸워.</li>
    <li><b>스크린샷에서 제일 눈에 띄는 건</b> 추석③(어두운 안)이야. 다만 <b>글자를 밝은 색으로</b> 써야 해.</li>
    <li>움직이는 건 가을③ 하나뿐이야. <b>저장 사진엔 안 담기니까</b> 멈춘 상태로도 예쁜지 봐줘.</li>
  </ul>
</section>
</div>
'''

CSS = '''
:root{--paper:#faf6ee;--card:#fff;--ink:#33302a;--sub:#7f7768;--accent:#5878a0;--line:#ebe2d3}
@media (prefers-color-scheme: dark){:root{--paper:#211f1c;--card:#2a2723;--ink:#f0eae0;--sub:#a49b8c;--accent:#93b4d9;--line:#3a3630}}
:root[data-theme="dark"]{--paper:#211f1c;--card:#2a2723;--ink:#f0eae0;--sub:#a49b8c;--accent:#93b4d9;--line:#3a3630}
:root[data-theme="light"]{--paper:#faf6ee;--card:#fff;--ink:#33302a;--sub:#7f7768;--accent:#5878a0;--line:#ebe2d3}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'HankkiBody',system-ui,sans-serif;line-height:1.75;-webkit-font-smoothing:antialiased}
.wrap{max-width:900px;margin:0 auto;padding:clamp(28px,5vw,60px) clamp(18px,4vw,32px) 90px;display:flex;flex-direction:column;gap:clamp(32px,5vw,48px)}
h1,h2,b{font-family:'HankkiDisp','HankkiBody',sans-serif;font-weight:400}
.eyebrow{margin:0 0 6px;font-size:12.5px;letter-spacing:.14em;color:var(--accent)}
h1{margin:0;font-size:clamp(27px,5vw,40px);line-height:1.28;text-wrap:balance}
.top{border-bottom:2px solid var(--line);padding-bottom:24px}
.lede{margin:13px 0 0;max-width:62ch;color:var(--sub);font-size:15px}
.lede b{color:var(--ink)}
.rule{padding:14px 16px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.pausebtn{margin-top:16px;padding:9px 20px;border:1.5px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}
.pausebtn:hover{border-color:var(--accent);color:var(--accent)}
.pausebtn:focus-visible{outline:2.5px solid var(--accent);outline-offset:3px}
.grp{display:flex;flex-direction:column;gap:11px}
h2{margin:0;font-size:clamp(19px,3.2vw,24px)}
.why{margin:0;max-width:64ch;color:var(--sub);font-size:14.5px}
.why b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:4px}
.cv{margin:0;display:flex;flex-direction:column;gap:9px}
.sheet::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 95% at 50% 38%,transparent 55%,rgba(90,72,50,.08))}
.sheet{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(80,65,45,.13),inset 0 0 0 1px rgba(120,100,70,.09)}
.st{position:absolute;display:block}
.si{display:block;width:100%;height:100%;background-repeat:no-repeat;background-position:center;background-size:contain;filter:drop-shadow(0 3px 5px rgba(50,40,28,.26))}
figcaption{font-size:14px;display:flex;flex-wrap:wrap;align-items:center;gap:7px}
figcaption span:last-child{flex:1 0 100%;color:var(--sub);font-size:12.5px;line-height:1.55}
.mv{padding:1.5px 8px;border-radius:999px;background:rgba(88,120,160,.14);color:var(--accent);font-size:10.5px}
.lf{position:absolute;aspect-ratio:1;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(80,60,40,.18))}
.lf svg{width:100%;height:100%;display:block}
@keyframes lfall{0%{opacity:0;transform:translate(0,-30%) rotate(-16deg)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(24%,1180%) rotate(40deg)}}
.lf{animation:lfall 7.5s ease-in-out infinite}
.tips{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;color:var(--sub);font-size:14.5px;max-width:66ch}
.tips li{padding-left:16px;position:relative}
.tips b{color:var(--ink)}
.tips li::before{content:"";position:absolute;left:0;top:.72em;width:6px;height:6px;border-radius:50%;background:var(--accent);opacity:.5}
body.still *{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
'''
JS = '''const b=document.getElementById('pause');b.addEventListener('click',()=>{const o=document.body.classList.toggle('still');b.textContent=o?'다시 움직이기':'멈춰서 보기'})'''
IMGCSS = ''.join(f'.c-{k}{{background-image:url({v})}}' for k, v in CH.items())

chars = ''.join(sorted(set(re.sub(r'<[^>]+>', ' ', body) + ''.join(CH))))
def sub(src, out):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--text={chars}', '--flavor=woff2',
                    f'--output-file={out}', '--layout-features=*', '--no-hinting'], check=True, cwd='/tmp')
    return 'data:font/woff2;base64,' + base64.b64encode(open(out, 'rb').read()).decode()
FONTS = (f"@font-face{{font-family:'HankkiDisp';src:url({sub(ROOT+'/src/assets/fonts/jua-korean-400.woff2','/tmp/_pd.woff2')}) format('woff2');font-display:swap}}"
         f"@font-face{{font-family:'HankkiBody';src:url({sub(ROOT+'/src/assets/fonts/gowun-dodum-korean-400.woff2','/tmp/_pb.woff2')}) format('woff2');font-display:swap}}")

open(OUT, 'w').write(f'<style>{FONTS}{CSS}{IMGCSS}</style>\n{body}\n<script>{JS}</script>\n')
print(f'{OUT}  {os.path.getsize(OUT)//1024} KB · 추석 3안 + 가을다꾸 3안')
