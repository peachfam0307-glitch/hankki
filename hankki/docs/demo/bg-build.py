#!/usr/bin/env python3
"""🖼 배경 표본집 — 창업자 질문 *"배경1개는 어떤거야? 내가 뽑아야 하는건지 아님 움직이는 배경인건지
   이건 무한한건지 안봐서 모르겠어"* 에 답하는 한 장.

핵심: **전부 CSS다. 그림 파일이 0장이다.** 창업자가 시트를 안 뽑아도 된다.
"""
import base64, io, os, re, subprocess, sys
from PIL import Image

ROOT = '/home/user/hankki/hankki'
OUT = f'{ROOT}/docs/demo/background-catalog.html'

def img_uri(path, w=170):
    im = Image.open(path).convert('RGBA'); im.thumbnail((w, w), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

CH = {k: img_uri(f'{ROOT}/src/assets/stickers/photo/{k}.png') for k in ['gp_gomhi', 'gp_penghi']}
RAT = {}
for k in CH:
    im = Image.open(f'{ROOT}/src/assets/stickers/photo/{k}.png'); RAT[k] = round(im.width / im.height, 3)

# ══ 배경 = 전부 CSS 한 줄. 그림 파일 0장. ══
# (이름, CSS background, 설명, 움직임클래스)
GROUPS = [
 ('종이 질감', '스캔한 종이가 아니라 <b>선을 촘촘히 그은 것</b>이다. 색만 바꾸면 결이 같은 종이가 무한히 나온다.', [
  ('부드러운 종이', 'repeating-linear-gradient(0deg,rgba(90,75,50,.03) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(90,75,50,.025) 0 1px,transparent 1px 4px),#f8f3e9', ''),
  ('린넨', 'repeating-linear-gradient(45deg,rgba(120,105,80,.055) 0 2px,transparent 2px 5px),repeating-linear-gradient(-45deg,rgba(120,105,80,.05) 0 2px,transparent 2px 5px),#f3ede1', ''),
  ('크라프트', 'radial-gradient(rgba(120,88,48,.16) 1px,transparent 1.5px) 0 0/9px 9px,#e2cda9', ''),
  ('수채 번짐', 'radial-gradient(60% 50% at 25% 28%,rgba(168,200,196,.55),transparent 70%),radial-gradient(55% 45% at 76% 60%,rgba(232,198,204,.5),transparent 70%),radial-gradient(52% 42% at 52% 88%,rgba(219,208,168,.45),transparent 70%),#fcf9f3', ''),
 ]),
 ('노트 패턴', '<b>선 간격·색만 바꾸면</b> 계속 새로 나온다. 마스킹테이프에 이미 쓰고 있는 방식이다.', [
  ('모눈', 'repeating-linear-gradient(0deg,rgba(110,135,160,.17) 0 1px,transparent 1px 17px),repeating-linear-gradient(90deg,rgba(110,135,160,.17) 0 1px,transparent 1px 17px),#fcfbf7', ''),
  ('도트', 'radial-gradient(rgba(150,130,100,.3) 1.6px,transparent 2px) 0 0/16px 16px,#fbf7ee', ''),
  ('줄노트', 'linear-gradient(90deg,transparent 0 13%,rgba(210,140,130,.5) 13% 13.6%,transparent 13.6%),repeating-linear-gradient(0deg,transparent 0 20px,rgba(110,135,160,.22) 20px 21px),#fdfbf5', ''),
  ('체크', 'repeating-linear-gradient(0deg,rgba(190,160,120,.22) 0 13px,transparent 13px 26px),repeating-linear-gradient(90deg,rgba(190,160,120,.22) 0 13px,transparent 13px 26px),#faf4e8', ''),
 ]),
 ('색 · 그라데이션', '<b>여기가 진짜 화수분이다.</b> 색 두세 개만 고르면 끝이라, 하루에 스무 개도 만든다.', [
  ('웜 크림', 'linear-gradient(160deg,#fcf2e3,#f2e0cb)', ''),
  ('파스텔 무지개', 'linear-gradient(135deg,#fde3e6,#fdf0d9,#ddf0e4,#dde7f5,#e9dff3)', ''),
  ('민트 아쿠아', 'linear-gradient(150deg,#e6f5f0,#cbe7ee)', ''),
  ('라벤더', 'linear-gradient(150deg,#f1e8f6,#ded9f0)', ''),
 ]),
 ('빛', '<b>빛 띠를 비스듬히 얹는 것</b>이다. 각도·색만 바꿔도 완전히 다른 시간처럼 보인다.', [
  ('햇살 내리쬠', 'linear-gradient(105deg,rgba(255,231,177,.6) 0 11%,transparent 11% 19%,rgba(255,231,177,.42) 19% 26%,transparent 26% 39%,rgba(255,236,195,.3) 39% 45%,transparent 45%),linear-gradient(160deg,#fdf7ea,#f8eddc)', ''),
  ('창문 그림자', 'linear-gradient(100deg,transparent 0 21%,rgba(120,102,74,.17) 21% 23.5%,transparent 23.5% 51%,rgba(120,102,74,.17) 51% 53.5%,transparent 53.5%),linear-gradient(190deg,transparent 0 39%,rgba(120,102,74,.11) 39% 41.5%,transparent 41.5%),linear-gradient(160deg,#fcf4e8,#f3e8d7)', ''),
  ('보케', 'radial-gradient(circle at 22% 26%,rgba(255,240,205,.75),transparent 26%),radial-gradient(circle at 68% 18%,rgba(255,232,220,.6),transparent 20%),radial-gradient(circle at 82% 62%,rgba(255,243,214,.65),transparent 24%),radial-gradient(circle at 38% 74%,rgba(248,232,240,.55),transparent 22%),linear-gradient(160deg,#f7efe2,#efe3d2)', ''),
  ('빛샘', 'radial-gradient(120% 90% at 108% -8%,rgba(255,196,140,.7),transparent 58%),radial-gradient(90% 70% at -10% 108%,rgba(255,222,190,.45),transparent 60%),linear-gradient(160deg,#fbf3e8,#f4e9da)', ''),
 ]),
 ('시간대 🕘', '<b>시안 5번째 장에만 있던 아이디어.</b> 아침에 열면 아침빛, 밤에 열면 밤빛. '
              '이건 팔 게 아니라 <b>앱 전체에 무료로</b> 깔면 좋겠다 — 저녁에 노을빛이 도는 앱은 "정성 들인 앱"으로 읽힌다.', [
  ('아침 8시', 'radial-gradient(90% 60% at 15% 0%,rgba(255,240,205,.8),transparent 60%),linear-gradient(170deg,#fdf8ee,#eaf1f1)', ''),
  ('낮 12시', 'radial-gradient(80% 50% at 50% -10%,rgba(255,255,255,.9),transparent 60%),linear-gradient(170deg,#f6fbff,#e7f0f8)', ''),
  ('노을 6시', 'radial-gradient(100% 65% at 80% 8%,rgba(255,196,150,.85),transparent 62%),linear-gradient(170deg,#ffe9d6,#f2c6b8 55%,#e5b2bb)', ''),
  ('밤 10시', 'radial-gradient(70% 45% at 78% 12%,rgba(255,246,214,.35),transparent 55%),linear-gradient(170deg,#2e3552,#3d4162)', 'stars'),
 ]),
 ('계절 · 움직이는 것 ❄️', '여기만 <b>실제로 움직인다.</b> ⚠️ 저장한 사진엔 움직임이 안 담기니까 '
                          '<b>멈춰도 예쁘게</b> 색·빛을 먼저 깔고 그 위에 조금만 뿌린다.', [
  ('봄 · 벚꽃', 'radial-gradient(90% 60% at 20% 0%,rgba(255,236,240,.9),transparent 62%),linear-gradient(170deg,#fdf2f4,#f7e6ea)', 'spring'),
  ('여름 · 물결', 'radial-gradient(70% 24% at 32% 34%,rgba(255,255,255,.5),transparent 70%),radial-gradient(60% 20% at 72% 62%,rgba(255,255,255,.42),transparent 72%),repeating-linear-gradient(176deg,rgba(255,255,255,0) 0 12px,rgba(255,255,255,.26) 17px 21px,rgba(255,255,255,0) 27px 40px),linear-gradient(170deg,#e8f5f7,#bfdfec)', 'ripple'),
  ('가을 · 낙엽', 'radial-gradient(90% 60% at 78% 4%,rgba(255,224,178,.8),transparent 60%),linear-gradient(170deg,#fdf1de,#f0dcc0)', 'autumn'),
  ('겨울 · 눈', 'radial-gradient(85% 55% at 50% 0%,rgba(255,255,255,.85),transparent 62%),linear-gradient(170deg,#eef4fa,#dbe6f0)', 'winter'),
 ]),
]

# 🌸 끝이 살짝 파인 꽃잎(그냥 타원이면 물방울로 보인다) + 안쪽에 결 한 줄
# ── 조각 그림 — 알아볼 수 있는 진짜 모양으로. (창업자: "단풍이나 은행잎이나", "꽃잎두..이쁜걸루")
# 🌸 벚꽃 한 송이 — 다섯 장, 끝이 파인 꽃잎. 가운데 수술까지 있어야 '벚꽃'으로 읽힌다.
BLOSSOM = ('<svg viewBox="0 0 32 32">'
  '<g fill="#f5bcca">'
  '<path d="M16 3.2c2.6 0 4.6 2.3 4.6 5.2 0 2.4-1.7 4.3-4.6 6.4-2.9-2.1-4.6-4-4.6-6.4 0-2.9 2-5.2 4.6-5.2Z"/>'
  '<path d="M28.2 12.1c.8 2.5-.6 5.1-3.3 6-2.3.7-4.7-.2-7.5-2.3 1-3.4 2.2-5.6 4.5-6.4 2.7-.9 5.5.2 6.3 2.7Z"/>'
  '<path d="M23.5 26.5c-2.1 1.6-5 1-6.7-1.3-1.4-1.9-1.5-4.5-.6-7.9 3.5-.3 6 .2 7.4 2.1 1.7 2.3 2 5.5-.1 7.1Z"/>'
  '<path d="M8.5 26.5c-2.1-1.6-1.8-4.8-.1-7.1 1.4-1.9 3.9-2.4 7.4-2.1.9 3.4.8 6-.6 7.9-1.7 2.3-4.6 2.9-6.7 1.3Z"/>'
  '<path d="M3.8 12.1c.8-2.5 3.6-3.6 6.3-2.7 2.3.8 3.5 3 4.5 6.4-2.8 2.1-5.2 3-7.5 2.3-2.7-.9-4.1-3.5-3.3-6Z"/>'
  '</g>'
  '<g stroke="#eda4b7" stroke-width=".9" stroke-linecap="round" opacity=".55" fill="none">'
  '<path d="M16 14.2V6.6M22.5 17.1l6.4-3.4M20.1 24.3l3.6 5.2M11.9 24.3l-3.6 5.2M9.5 17.1 3.1 13.7"/></g>'
  '<circle cx="16" cy="16" r="2.6" fill="#f7dca8"/>'
  '<g stroke="#f0c473" stroke-width=".8" stroke-linecap="round">'
  '<path d="M16 16 14 12.6M16 16l3.3-2.2M16 16l2 3.6M16 16l-3.4 1.8"/></g>'
  '</svg>')
# 🌸 낱장 꽃잎 — 송이만 있으면 심심해서 섞는다
PETAL = ('<svg viewBox="0 0 24 24">'
  '<path d="M12 22c-5.2-2.6-7.4-7.6-5.5-12.2C7.6 6.2 9.6 3.6 12 2c2.4 1.6 4.4 4.2 5.5 7.8C19.4 14.4 17.2 19.4 12 22Z'
  'M12 22c1-1.6.9-3 0-4.4-.9 1.4-1 2.8 0 4.4Z" fill="#f5bcca" fill-rule="evenodd"/>'
  '<path d="M9.8 19.6C8.6 16 9 11.8 10.9 7.6" stroke="#eda4b7" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".5"/>'
  '</svg>')
# 🍁 단풍잎 — 다섯 갈래. 잎자루가 있어야 잎으로 보인다.
MAPLE = ('<svg viewBox="0 0 32 32">'
  '<path d="M16 2.6 18.9 8l3.4-1-1 3.5 5.6-2.3-2 4.2 4.7-.6-3.4 3.4 3.8 1.7-4.6 1.9 2.4 3.1-5.3-.6.5 4.9-4.3-3.2-1.2 3.4h-1.1l-1.2-3.4-4.3 3.2.5-4.9-5.3.6 2.4-3.1L1 17.9l3.8-1.7-3.4-3.4 4.7.6-2-4.2 5.6 2.3-1-3.5 3.4 1Z" fill="#d4834a"/>'
  '<path d="M16 29.4V14.6" stroke="#a75f2e" stroke-width="1.3" stroke-linecap="round"/>'
  '<g stroke="#a75f2e" stroke-width="1" stroke-linecap="round" opacity=".7" fill="none">'
  '<path d="M16 17.5 9.8 12.9M16 17.5l6.2-4.6M16 21.4l-5 2.2M16 21.4l5 2.2"/></g>'
  '</svg>')
# 🌼 은행잎 — 부채꼴, 아래 가운데가 갈라진다. 노랑이라 단풍과 확실히 갈린다.
GINKGO = ('<svg viewBox="0 0 32 32">'
  '<path d="M16 26.5c-6.6 0-11-3.4-11-7.6C5 13.4 9.6 7 16 3.5 22.4 7 27 13.4 27 18.9c0 4.2-4.4 7.6-11 7.6Z'
  'M16 26.5c1.4-2.6 1.5-5.2.3-7.9-1.4 2.7-1.5 5.3-.3 7.9Z" fill="#e0b455" fill-rule="evenodd"/>'
  '<g stroke="#bd8f30" stroke-width=".85" stroke-linecap="round" opacity=".6" fill="none">'
  '<path d="M16 24.6C13.4 18.5 12.6 12.6 13.6 7M16 24.6c2.6-6.1 3.4-12 2.4-17.6M9.6 22.4C8.4 17.4 8.6 12.6 10.2 8.4M22.4 22.4c1.2-5 1-9.8-.6-14"/></g>'
  '<path d="M16 26.5v3.6" stroke="#bd8f30" stroke-width="1.4" stroke-linecap="round"/>'
  '</svg>')
# ❄️ 눈 — 가장자리가 흐린 부드러운 점(테두리 있는 동그라미는 비눗방울로 보인다)
SNOW = ('<svg viewBox="0 0 24 24">'
  '<defs><radialGradient id="sg"><stop offset="0%" stop-color="#fff" stop-opacity="1"/>'
  '<stop offset="52%" stop-color="#fff" stop-opacity=".82"/>'
  '<stop offset="100%" stop-color="#eaf1f7" stop-opacity="0"/></radialGradient></defs>'
  '<circle cx="12" cy="12" r="11" fill="url(#sg)"/></svg>')
# 💧 물방울 — **음영**(창업자 요청). 위는 밝고 아래로 갈수록 짙게 + 흰 하이라이트 + 바닥 반사.
DROPLET = ('<svg viewBox="0 0 24 24">'
  '<defs><linearGradient id="wg" x1="0" y1="0" x2=".35" y2="1">'
  '<stop offset="0%" stop-color="#dcecf3"/><stop offset="55%" stop-color="#a9c9d9"/>'
  '<stop offset="100%" stop-color="#7ba7bd"/></linearGradient></defs>'
  '<path d="M12 2.2c4.3 5.6 6.6 8.8 6.6 11.8A6.6 6.6 0 0 1 5.4 14c0-3 2.3-6.2 6.6-11.8Z" fill="url(#wg)"/>'
  '<ellipse cx="9.4" cy="12.6" rx="1.7" ry="2.6" fill="#fff" opacity=".8" transform="rotate(-18 9.4 12.6)"/>'
  '<ellipse cx="14.4" cy="17.4" rx="2.4" ry="1.2" fill="#fff" opacity=".38"/>'
  '</svg>')
NODE = {'blossom': BLOSSOM, 'petal': PETAL, 'maple': MAPLE, 'ginkgo': GINKGO, 'snow': SNOW, 'drop': DROPLET}
# 배경 위 조각은 **표지 전체**에 흩어진다(스티커 위 효과와 다른 점)
# (x%, y%, 딜레이, 크기배율) — 크기가 다 같으면 도장 찍은 것처럼 보인다
# (x%, y%, 딜레이, 크기배율) — 크기가 다 같으면 도장 찍은 것처럼 보인다
SPOTS = [(6, -16, 0, 1.0), (20, -30, .9, .72), (34, -10, 1.8, 1.15), (48, -34, 2.7, .82),
         (61, -18, .4, .95), (74, -28, 3.5, 1.22), (86, -12, 1.3, .68), (95, -32, 2.2, 1.05)]
# 계절마다 두 모양을 번갈아 뿌린다(단풍＋은행, 벚꽃송이＋낱장꽃잎)
MIX = {'spring': ('blossom', 'petal'), 'autumn': ('maple', 'ginkgo'),
       'winter': ('snow', 'snow'), 'summerdrop': ('drop', 'drop')}

def anim(kind):
    if not kind: return ''
    if kind == 'stars':
        pts = [(12, 18, 0), (28, 9, .7), (44, 24, 1.4), (61, 12, .4), (74, 27, 1.9), (88, 15, 1.1), (36, 38, 2.3), (67, 41, .9)]
        return ''.join(f'<span class="star" style="left:{x}%;top:{y}%;animation-delay:{d}s"></span>' for x, y, d in pts)
    if kind == 'ripple':
        return ''.join(f'<span class="ripple" style="top:{t}%;animation-delay:{d}s"></span>' for t, d in [(28, 0), (48, 1.1), (68, 2.2), (85, .6)])
    a, b2 = MIX[kind]
    cls = 'snow' if kind == 'winter' else 'fall'
    return ''.join(f'<span class="drop d-{cls}" style="left:{x}%;top:{y}%;width:{round(11 * sc, 1)}%;animation-delay:{d}s">'
                   f'{NODE[a if i % 2 == 0 else b2]}</span>'
                   for i, (x, y, d, sc) in enumerate(SPOTS))

def cover(name, bg, kind, ch):
    tag = '<span class="mv">움직임</span>' if kind else ''
    return (f'<figure class="cv"><div class="sheet" style="background:{bg}">{anim(kind)}'
            f'<div class="ch c-{ch}" style="aspect-ratio:{RAT[ch]}"></div></div>'
            f'<figcaption>{name} {tag}</figcaption></figure>')

secs = []
for i, (title, why, rows) in enumerate(GROUPS):
    cards = ''.join(cover(n, bg, k, 'gp_penghi' if j % 3 == 1 else 'gp_gomhi') for j, (n, bg, k) in enumerate(rows))
    secs.append(f'<section class="grp"><h2>{title} <span class="cnt">{len(rows)}종</span></h2>'
                f'<p class="why">{why}</p><div class="grid">{cards}</div></section>')

body = f'''<title>한끼 · 배경 표본집</title>
<div class="wrap">
<header class="top">
  <p class="eyebrow">한끼 꾸미기 · 배경</p>
  <h1>배경 1개가 뭔지, 보고 정하자</h1>
  <div class="qa">
    <p><b>내가 뽑아야 해?</b> — <b>아니.</b> 여기 <b>24개 전부 그림 파일이 0장</b>이야.
    색·선·빛을 코드로 그린 거라, 시트를 뽑을 필요가 없어. 내가 혼자 만들어.</p>
    <p><b>움직이는 거야?</b> — <b>대부분은 안 움직여.</b> 맨 아래 「계절」 넷만 움직여.
    ⚠️ <b>저장한 사진엔 움직임이 안 담기니까</b>, 멈춰도 예쁜 색·빛을 먼저 깔고 그 위에 조금만 뿌렸어.</p>
    <p><b>무한해?</b> — 정확히 말하면 무한은 아닌데, <b>바닥날 일이 없어.</b>
    색 조합만 바꿔도 새 배경이라 하루에 스무 개도 만들어. 모션은 축이 8~10개에서 끝나는데 이건 안 그래.</p>
  </div>
  <button id="pause" class="pausebtn" type="button">멈춰서 보기</button>
</header>
{''.join(secs)}
<section class="grp">
  <h2>그래서 <span class="cnt">내 생각</span></h2>
  <p class="why">팩마다 배경을 하나씩 얹으면 <b>팩이 완성된 한 세트로 보여.</b>
  스티커만 주는 것보다 표지가 통째로 그 계절이 되니까.
  그리고 <b>네 손이 아예 안 가</b> — 스티커 시트만 뽑아 주면 배경은 내가 붙여.</p>
  <p class="why">⚠️ 하나만 — <b>배경은 한 번에 하나만 쓴다.</b> 스티커는 스무 장 사면 스무 장 다 붙이는데
  배경은 사도 표지 하나에 하나만 깔려. 그래서 <b>단독으로 팔면 값어치 체감이 낮아.</b>
  팩에 얹는 게 맞아.</p>
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
.wrap{max-width:980px;margin:0 auto;padding:clamp(28px,5vw,64px) clamp(18px,4vw,32px) 90px;display:flex;flex-direction:column;gap:clamp(34px,5vw,52px)}
h1,h2,b{font-family:'HankkiDisp','HankkiBody',sans-serif;font-weight:400}
.eyebrow{margin:0 0 6px;font-size:12.5px;letter-spacing:.14em;color:var(--accent)}
h1{margin:0;font-size:clamp(28px,5.4vw,42px);line-height:1.28;text-wrap:balance}
.top{border-bottom:2px solid var(--line);padding-bottom:26px}
.qa{margin-top:16px;display:flex;flex-direction:column;gap:11px}
.qa p{margin:0;max-width:64ch;color:var(--sub);font-size:15px}
.qa b{color:var(--ink)}
.pausebtn{margin-top:18px;padding:9px 20px;border:1.5px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}
.pausebtn:hover{border-color:var(--accent);color:var(--accent)}
.pausebtn:focus-visible{outline:2.5px solid var(--accent);outline-offset:3px}
.grp{display:flex;flex-direction:column;gap:12px}
h2{margin:0;font-size:clamp(19px,3.2vw,25px);display:flex;align-items:baseline;gap:11px;flex-wrap:wrap}
.cnt{font-family:'HankkiBody',sans-serif;font-size:12.5px;color:var(--sub)}
.why{margin:0;max-width:66ch;color:var(--sub);font-size:14.5px}
.why b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:16px;margin-top:4px}
.cv{margin:0;display:flex;flex-direction:column;gap:8px}
.sheet::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 95% at 50% 38%,transparent 55%,rgba(90,72,50,.09))}
.sheet{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(80,65,45,.13),inset 0 0 0 1px rgba(120,100,70,.09);display:flex;align-items:flex-end;justify-content:center;padding-bottom:9%}
.ch{position:relative;height:52%;width:auto;background-repeat:no-repeat;background-position:center bottom;background-size:contain;filter:drop-shadow(0 3px 5px rgba(50,40,28,.28))}
figcaption{font-size:13.5px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.mv{padding:1.5px 8px;border-radius:999px;background:rgba(88,120,160,.14);color:var(--accent);font-size:10.5px}
/* 움직이는 것들 — 표지 전체에 흩어진다(스티커 위 효과와 다른 점) */
.drop{position:absolute;width:11%;aspect-ratio:1;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(80,60,40,.18))}
.drop svg{width:100%;height:100%;display:block}
@keyframes bg-fall{0%{opacity:0;transform:translate(0,-30%) rotate(-14deg)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(26%,1180%) rotate(38deg)}}
.d-fall{animation:bg-fall 7s ease-in-out infinite}
@keyframes bg-snow{0%{opacity:0;transform:translate(0,-30%)}12%{opacity:.95}50%{transform:translate(-20%,560%)}100%{opacity:0;transform:translate(14%,1180%)}}
.d-snow{animation:bg-snow 9s linear infinite}
.star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff8dd;box-shadow:0 0 5px rgba(255,248,221,.9)}
@keyframes twinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
.star{animation:twinkle 2.6s ease-in-out infinite}
.ripple{position:absolute;left:-12%;width:124%;height:9px;border-radius:50%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),rgba(255,255,255,.35),transparent);filter:blur(2.5px)}
@keyframes drift{0%{transform:translateX(-14%)}50%{transform:translateX(14%)}100%{transform:translateX(-14%)}}
.ripple{animation:drift 5.5s ease-in-out infinite}
body.still *{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
'''
JS = '''const b=document.getElementById('pause');b.addEventListener('click',()=>{const o=document.body.classList.toggle('still');b.textContent=o?'다시 움직이기':'멈춰서 보기'})'''
IMGCSS = ''.join(f'.c-{k}{{background-image:url({v})}}' for k, v in CH.items())

chars = ''.join(sorted(set(re.sub(r'<[^>]+>', ' ', body) + ''.join(CH))))
def subset(src, out):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--text={chars}', '--flavor=woff2',
                    f'--output-file={out}', '--layout-features=*', '--no-hinting'], check=True, cwd='/tmp')
    return 'data:font/woff2;base64,' + base64.b64encode(open(out, 'rb').read()).decode()
FONTS = (f"@font-face{{font-family:'HankkiDisp';src:url({subset(ROOT+'/src/assets/fonts/jua-korean-400.woff2','/tmp/_bd.woff2')}) format('woff2');font-display:swap}}"
         f"@font-face{{font-family:'HankkiBody';src:url({subset(ROOT+'/src/assets/fonts/gowun-dodum-korean-400.woff2','/tmp/_bb.woff2')}) format('woff2');font-display:swap}}")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write(f'<style>{FONTS}{CSS}{IMGCSS}</style>\n{body}\n<script>{JS}</script>\n')
n = sum(len(r) for _, _, r in GROUPS)
print(f'{OUT}  {os.path.getsize(OUT)//1024} KB · 배경 {n}종 · 그림파일 0장')
