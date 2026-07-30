#!/usr/bin/env python3
"""창업자에게 보여줄 '움직임·효과 표본집' 한 장 만들기 (자기완결 HTML).

⭐ 모션·효과 CSS 는 **`src/styles.css` 에서 그대로 떠 온다.** 손으로 옮겨 적으면
   언젠가 앱과 어긋나서 "데모에선 예뻤는데 앱에선 다르다"가 된다.
"""
import base64, io, os, re, subprocess, sys
from PIL import Image

ROOT = '/home/user/hankki/hankki'
OUT = f'{ROOT}/docs/demo/motion-catalog.html'

def img_uri(path, w=190):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((w, w), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

NAMES = ['gp_gomhi', 'gp_penghi', 'gp_gomv', 'gp_pengv', 'sm_gom_tube', 'sm_duo_watermelon', 'au_b01']
CH, RATIO = {}, {}
for k in NAMES:
    p = f'{ROOT}/src/assets/stickers/photo/{k}.png'
    CH[k] = img_uri(p)
    _im = Image.open(p); RATIO[k] = round(_im.width / _im.height, 3)
FOOD = [img_uri(f'{ROOT}/src/assets/stickers/fx/{n}.png', 90) for n in ['strawberry', 'cupcake', 'icecream', 'cake']]

SVG = {
 'spark': '<svg viewBox="0 0 24 24"><path d="M12 1.5c.85 6.9 3.6 9.65 10.5 10.5C15.6 12.85 12.85 15.6 12 22.5 11.15 15.6 8.4 12.85 1.5 12 8.4 11.15 11.15 8.4 12 1.5Z" fill="#d8b673"/></svg>',
 'heart': '<svg viewBox="0 0 24 24"><path d="M12 20.3C4.7 14.4 4.9 8.9 8 7.3c2.1-1.05 3.6.95 4 1.55.4-.6 1.9-2.6 4-1.55 3.1 1.6 3.3 7.1-4 13Z" fill="#dc9aa1"/></svg>',
 'bubble': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="rgba(255,255,255,.5)" stroke="#f1e8d6" stroke-width="2.4"/><circle cx="9" cy="9" r="2" fill="#fff"/></svg>',
 'water': '<svg viewBox="0 0 24 24"><path d="M12 2.5c4.2 5.4 6.5 8.5 6.5 11.4A6.5 6.5 0 0 1 5.5 13.9C5.5 11 7.8 7.9 12 2.5Z" fill="#a9c6d4" opacity=".9"/><ellipse cx="9.6" cy="13.4" rx="1.5" ry="2.1" fill="#fff" opacity=".75"/></svg>',
 'leaf': '<svg viewBox="0 0 24 24"><path d="M20 4c0 8.8-5.2 15-11 16-2.6-6 1.4-14.2 11-16Z" fill="#d69a63"/><path d="M19 5C14 9 11 13.5 9.4 19.4" stroke="#b57c49" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
 'snow': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="#fff" stroke="#d8e3ea" stroke-width="2"/></svg>',
 'petal': '<svg viewBox="0 0 24 24"><path d="M12 2.5c6 3.4 8 8.6 5.4 13.2-2.6 4.6-8 5.4-11.4 2.6C2.6 15.4 5 6.6 12 2.5Z" fill="#f0c3ce"/></svg>',
 'confetti': '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="9" rx="3" fill="#dc9aa1" transform="rotate(-14 12 12)"/><rect x="7" y="9" width="11" height="6" rx="2.4" fill="#e8bfa2" transform="rotate(10 12 12)" opacity=".9"/></svg>',
}
V = lambda d: ''.join(f'{k}:{v};' for k, v in d.items())

# ⚠️ 이동 거리 계산은 **앱(`Stickers.jsx` rel())과 같은 식**이어야 한다.
#    transform 의 % 는 '조각 제 몸 크기' 기준이라, 스티커 기준 X% 를 주려면 X ÷ (조각/238) 을 쓴다.
STICKER_PX = 238
rel = lambda size, pct: f'{round(pct / (size / STICKER_PX))}%'
RISE = lambda size, pct: {'--rise': rel(size, -pct)}
FALL = lambda size, down, side: {'--fy': rel(size, down), '--sx': rel(size, side)}

# (조각 크기, 도형키 | None=음식PNG | ''=CSS로 그림, [(x%, y%, 딜레이, 조각별 CSS변수)])
FX_DEF = {
 'spark':  (23, 'spark',    [(15,-2,0,{}),(50,-12,.5,{}),(85,0,.9,{}),(28,16,1.3,{}),(72,14,.7,{})]),
 'heart':  (23, 'heart',    [(25,0,0,RISE(23,70)),(63,-12,.8,RISE(23,70)),(45,12,1.5,RISE(23,70))]),
 'bubble': (22, 'bubble',   [(15,2,0,RISE(22,78)),(48,-12,.9,RISE(22,78)),(80,-1,.5,RISE(22,78)),
                             (32,15,1.7,RISE(22,78)),(66,12,1.2,RISE(22,78))]),
 'water':  (19, 'water',    [(22,-16,0,FALL(19,120,4)),(58,-26,.8,FALL(19,120,4)),
                             (80,-12,1.6,FALL(19,120,4)),(40,-8,2.2,FALL(19,120,4))]),
 'leaf':   (26, 'leaf',     [(18,-22,0,FALL(26,118,16)),(55,-32,1.1,FALL(26,118,16)),(82,-18,2.1,FALL(26,118,16))]),
 'snow':   (18, 'snow',     [(14,-20,0,FALL(18,120,10)),(42,-30,.7,FALL(18,120,10)),
                             (68,-16,1.4,FALL(18,120,10)),(88,-28,2.1,FALL(18,120,10))]),
 'petal':  (22, 'petal',    [(20,-20,0,FALL(22,118,18)),(52,-30,.9,FALL(22,118,18)),(78,-14,1.8,FALL(22,118,18))]),
 'food':   (32, None,       [(12,-10,0,RISE(32,55)),(84,-16,.9,RISE(32,55)),
                             (30,-26,1.6,RISE(32,55)),(66,-24,2.3,RISE(32,55))]),
 'steam':  (17, '',         [(42,6,0,RISE(17,85)),(52,2,.9,RISE(17,85)),(47,10,1.7,RISE(17,85))]),
 'pop':    (21, 'confetti', [(50,34,i*0.03,{'--dx':rel(21,x),'--dy':rel(21,y),'--spin':f'{sp}deg'})
                             for i,(x,y,sp) in enumerate(
                               [(-58,-48,-140),(55,-53,160),(-71,9,-80),(69,5,110),(-16,-76,60),(23,-72,-120)])]),
 'orbit':  (19, 'spark',    [(50,34,d,{'--r':rel(19,55)}) for d in (0,-1.47,-2.93)]),
 'zoom':   (22, 'spark',    [(0,12,0,{'--go':rel(22,140)}),(0,40,.9,{'--go':rel(22,140)}),(0,-12,1.7,{'--go':rel(22,140)})]),
 'halo':   (340, '',        [(50,46,0,{})]),
}
def fx_html(kind):
    size, node, items = FX_DEF[kind]
    out = []
    for i, (x, y, d, extra) in enumerate(items):
        pct = round(size / 238 * 100, 2)          # 앱 기준 스티커 폭 238px 대비 비율
        st = f'left:{x}%;top:{y}%;width:{pct}%;animation-delay:{d}s;{V(extra)}'
        cls = f' f{i % len(FOOD)}' if node is None else ''
        inner = SVG[node] if node else ''
        out.append(f'<span class="hk-fx hk-fx-{kind}{cls}" style="{st}">{inner}</span>')
    return ''.join(out)

def stage(char, motion='', fx=''):
    inner = f'<div class="ch c-{char}{f" hk-m-{motion}" if motion else ""}"></div>'
    return (f'<div class="stage"><div class="pic">'
            f'<div class="holder" style="aspect-ratio:{RATIO[char]}">'
            f'{inner}{fx_html(fx) if fx else ""}</div></div></div>')

TAGTXT = {'free': '무료', 'pack': '팩', 'spare': '비슷해서 뺌'}
def card(name, desc, char, motion='', fx='', state='free'):
    return (f'<figure class="spec s-{state}">{stage(char, motion, fx)}'
            f'<figcaption><b>{name}</b><span class="chip t-{state}">{TAGTXT[state]}</span>'
            f'<span>{desc}</span></figcaption></figure>')

# ══ 모션 = **축(무엇이 변하는가)** 으로 묶는다 ══
MOTION_AXES = [
 ('위아래로 튄다', '제일 흔한 축. <b>여기에만 5개</b>가 몰려 있었다.', [
   ('통통','tongtong','gp_gomhi','눌렸다 튀어오름 · 2.4초','free'),
   ('콩콩','kong','gp_pengv','제자리에서 뜀 · 1.15초','spare'),
   ('냠냠','nyam','sm_duo_watermelon','오물오물 · 1.6초','spare'),
   ('둥실','float','gp_penghi','떠 있는 듯 · 3.4초','spare'),
   ('쿵착지','drop','gp_gomv','위에서 쿵 · 1.9초','spare')]),
 ('기울어진다', '둘이 거의 같다.', [
   ('갸웃','tilt','gp_penghi','고개를 갸웃 · 2.8초','free'),
   ('살랑','sway','au_b01','좌우로 흔들 · 2.6초','spare')]),
 ('물 위에 떠 있다', '기울기 축이 <b>허리</b>라 "떠 있다"로 읽힌다. 발이 축이면 미끄러지는 느낌이 난다.', [
   ('찰랑','wave','sm_gom_tube','물 위에 부유 · 2.8초','free')]),
 ('좌우로 걸어간다 🆕', '<b>자리를 옮긴다.</b> 위아래로 뛰는 애들과 인상이 완전히 다르다.', [
   ('아장아장','ajang','sm_duo_watermelon','걸어갔다 온다 · 3.2초','pack')]),
 ('한 바퀴 돈다 🆕', '처음엔 <b>가끔만</b> 돌게 했더니 보고 있어도 아무 일이 안 일어났다. 자주 돌게 고쳤다.', [
   ('빙글','bingle','gp_pengv','휙 한 바퀴 · 2.4초','pack')]),
 ('부르르 떤다 🆕', '<b>빠르고 작다.</b> 통통(느리고 큼)과 정반대라 절대 안 겹친다.', [
   ('부르르','bureu','gp_gomhi','짧게 떨림 · 2.8초','pack')]),
 ('크기만 변한다 🆕', '자리 이동이 <b>0</b>이라 통통과 확실히 갈린다. 두 박자라야 심장으로 읽힌다.', [
   ('콩닥','kongdak','gp_penghi','쿵-닥 두 박자 · 1.9초','pack')]),
 ('좌우로 돌아본다 🆕', '그림 한 장으로 "돌아본다"를 만드는 유일한 방법(좌우 반전). 이것도 더 자주 뒤집게 고쳤다.', [
   ('두리번','durib','gp_gomv','뒤집으며 살핌 · 2.8초','pack')]),
 ('종이가 들린다', '왼쪽 끝이 붙어 있고 오른쪽이 들린다.', [
   ('펄럭','flutter','gp_gomhi','바람에 들림 · 2.2초','pack')]),
]

# ══ 효과 = **방향(어디로 가는가)** 으로 묶는다 ══
FX_DIRS = [
 ('제자리에서 깜빡', '', [('반짝이','spark','gp_gomhi','제자리 트윙클 · 1.7초','free')]),
 ('위로 뜬다', '<b>넷이 다 같은 방향.</b> 그림만 다르다.', [
   ('하트','heart','gp_penghi','하트가 떠오름 · 2.6초','free'),
   ('뽀글','bubble','gp_gomv','방울이 몽글 · 2.9초','free'),
   ('김모락','steam','gp_gomhi','하얀 김 · 2.6초','spare'),
   ('맛있는것들','food','sm_duo_watermelon','음식이 둥둥 · 3초','spare')]),
 ('아래로 떨어진다', '<b>계절 효과는 떨어져야 계절이다.</b> 서로 닮는 걸 피할 수 없다 → 배경으로 옮기는 게 낫다.', [
   ('물방울','water','sm_gom_tube','또르르 · 2.2초','pack'),
   ('눈','snow','gp_penghi','흩날려 내림 · 4.6초','spare'),
   ('낙엽','leaf','au_b01','돌며 떨어짐 · 3.2초','spare'),
   ('꽃잎','petal','gp_pengv','흩날림 · 3.8초','spare')]),
 ('바깥으로 터진다 🆕', '뜨지도 떨어지지도 않는 유일한 방향. 조각마다 날아가는 쪽이 다르다.', [
   ('팡!','pop','gp_gomv','색종이가 팡 · 1.5초','pack')]),
 ('머리 둘레를 돈다 🆕', '제자리도 아니고 지나가지도 않는다. 그림 자체는 안 돌게 되돌려 놨다.', [
   ('빙빙','orbit','gp_gomhi','별이 궤도를 돎 · 4.4초','pack')]),
 ('가로로 지나간다 🆕', '세로로만 오가던 것들과 축이 90도 다르다.', [
   ('슝','zoom','gp_penghi','왼쪽에서 오른쪽으로 · 2.4초','pack')]),
 ('뒤에 깔려서 숨쉰다 🆕', '앞에 뜨는 조각이 아니라 <b>뒤</b>. 그래서 인상이 완전히 다르다.', [
   ('후광','halo','gp_gomhi','뒤에서 부풀었다 줄었다 · 3.2초','pack')]),
]

def block(title, why, rows, is_fx):
    w = f'<p class="why">{why}</p>' if why else ''
    # 하나뿐인 축은 **가로 한 줄**로 — 넓은 칸에 작은 카드 하나만 있으면 휑하다.
    if len(rows) == 1:
        n, k, c, d, st = rows[0]
        sg = stage(c, fx=k) if is_fx else stage(c, motion=k)
        return (f'<div class="axis one"><div class="onestage s-{st}">{sg}</div>'
                f'<div class="onetxt"><h3>{title}</h3>{w}'
                f'<p class="oneline"><b>{n}</b><span class="chip t-{st}">{TAGTXT[st]}</span>'
                f'<span class="desc">{d}</span></p></div></div>')
    cards = ''.join(card(n, d, c, fx=k, state=s) if is_fx else card(n, d, c, motion=k, state=s)
                    for n, k, c, d, s in rows)
    return f'<div class="axis"><h3>{title} <span class="n">{len(rows)}개</span></h3>{w}<div class="grid">{cards}</div></div>'

SCHED = [
 ('지금','출시기념 여름','무료 선물','모션','찰랑','물 위 부유'),
 ('26년 9월','추석','유료','모션','아장아장','좌우 이동'),
 ('26년 10월','가을 다꾸','유료','효과','슝','가로지름'),
 ('26년 10월','가을 수채화','유료','모션','두리번','좌우 반전'),
 ('26년 10월','핼러윈','유료','모션','빙글','한 바퀴'),
 ('26년 12월','크리스마스','유료','효과','팡!','바깥 터짐'),
 ('27년 1월','겨울','유료','모션','부르르','미세 진동'),
 ('27년 2월','카페','유료','효과','후광','뒤에 깔림'),
 ('27년 3월','봄','유료','모션','콩닥','크기만'),
 ('27년 4월','심플 다꾸','유료','모션','펄럭','종이 3D'),
 ('27년 5월','소풍','유료','효과','빙빙','궤도'),
 ('27년 6월','여름','유료','효과','물방울','낙하'),
]
srows = ''.join(
  f'<tr><td class="mon">{m}</td><td><b>{p}</b></td><td class="pay">{pay}</td>'
  f'<td><span class="chip {"t-pack" if k=="모션" else "t-fx"}">{k}</span> {n}</td><td class="ax">{ax}</td></tr>'
  for m, p, pay, k, n, ax in SCHED)

body = f'''<title>한끼 · 움직임과 효과 표본집</title>
<div class="wrap">
<header class="top">
  <p class="eyebrow">한끼 꾸미기 · 2026-07-30</p>
  <h1>다 비슷해 보였던 이유</h1>
  <p class="lede">세어 보니 맞는 말이었어요. 모션 9개 중 <b>5개가 "위아래로 움직인다"</b>였고
  (통통·콩콩·냠냠·둥실·쿵착지), 2개가 "기울어진다"(갸웃·살랑)였어요.
  <b>축이 3가지</b>인데 속도만 달랐던 거예요. 효과도 위로 뜨는 게 4개, 아래로 떨어지는 게 4개.</p>
  <p class="lede">그래서 <b>속도 말고 축을 바꾼</b> 것들을 새로 만들었어요. 아래는 <b>축별로</b> 묶어 놨어요 —
  같은 칸 안에 있는 건 서로 닮은 게 맞고, <b>칸이 다르면 진짜로 다르게</b> 움직여요.</p>
  <button id="pause" class="pausebtn" type="button">멈춰서 보기</button>
</header>

<section>
  <h2>움직임 <span class="cnt">축 9가지 · 14개</span></h2>
  <p class="note">⚠️ <b>새로고침해서 보세요.</b> 「들썩·끄덕」은 뺐고(허리 무늬가 어긋나서), 「빙글·두리번」은 <b>더 자주 움직이게</b> 고쳤어요.</p>
  {''.join(block(t, w, r, False) for t, w, r in MOTION_AXES)}
</section>

<section>
  <h2>효과 <span class="cnt">방향 7가지 · 13개</span></h2>
  {''.join(block(t, w, r, True) for t, w, r in FX_DIRS)}
</section>

<section>
  <h2>그래서 팩엔 이렇게 <span class="cnt">축이 안 겹치게 · 12개월</span></h2>
  <p class="note">팩 하나에 <b>모션이거나 효과이거나 딱 하나.</b> 매달 나오는데 두 개씩 주면 반년이면 바닥나요.
  그리고 <b>축이 겹치는 건 안 넣어요</b> — 넣어도 "또 비슷한 거"가 되니까요.</p>
  <div class="tw"><table>
    <thead><tr><th>시기</th><th>팩</th><th></th><th>딸려가는 것</th><th>움직이는 축</th></tr></thead>
    <tbody>{srows}</tbody>
  </table></div>
  <p class="note">위에서 <b>「비슷해서 뺌」</b>이 붙은 10개는 <b>지우지 않았어요.</b>
  코드에 그대로 있고 이미 저장한 표지도 계속 잘 움직여요. 팩에만 안 넣는 거예요.</p>
</section>

<section>
  <h2>남은 문제 하나 <span class="cnt">계절 효과</span></h2>
  <p class="note">눈·낙엽·꽃잎은 <b>떨어져야 눈이고 낙엽이에요.</b> 이건 아무리 해도 서로 닮아요.
  그래서 이 셋은 <b>스티커 효과 말고 배경 한 겹</b>으로 옮기는 게 나아요 —
  표지 <b>전체</b>에 눈이 내리면 스티커 하나 위에 내리는 것보다 훨씬 예쁘고,
  스티커 효과 자리는 <b>축이 다른 것</b>들로 채울 수 있어요.
  마침 세 번째로 준 시안(배경 효과 60종)이 통째로 그 얘기예요.</p>
  <ul class="cant">
    <li><b>눈 깜빡</b> — 꼬르곰·펭펭이 <b>그림 한 장</b>이라 눈만 따로 못 움직여요. 눈을 따로 그려서 다시 뽑아야 해요.</li>
    <li><b>저장한 사진엔 움직임이 안 담겨요</b> — 한 장으로 찍는 거라 어느 한 순간으로 굳어요.
    그래서 새 움직임은 전부 <b>진폭을 작게</b> 잡았어요(찰랑 ±4도). 어느 순간에 멈춰도 안 이상하게요.</li>
  </ul>
</section>
</div>
'''

# ── 모션·효과 CSS 는 앱에서 그대로 떠 온다 (손으로 옮기면 언젠가 어긋난다) ──
app_css = open(f'{ROOT}/src/styles.css').read()
i = app_css.index('/* 🎁 부엌 식구들 움직임(모션)')
j = app_css.index('@media (prefers-reduced-motion: reduce) { [class*="hk-m-"]')
MOTION_CSS = app_css[i:j]

CSS = '''
:root{
  --paper:#faf6ee; --card:#fff; --ink:#33302a; --sub:#7f7768;
  --accent:#5878a0; --line:#ebe2d3; --stage:#f5f1e8; --chipbg:#eef2f7;
  --fxbg:rgba(220,154,161,.18); --fxfg:#b06d75; --spbg:#f0ece3; --spfg:#98907f;
}
@media (prefers-color-scheme: dark){:root{
  --paper:#211f1c; --card:#2a2723; --ink:#f0eae0; --sub:#a49b8c;
  --accent:#93b4d9; --line:#3a3630; --stage:#332f2a; --chipbg:#333d49;
  --fxbg:rgba(220,154,161,.2); --fxfg:#e2aab0; --spbg:#333029; --spfg:#8d8578;
}}
:root[data-theme="dark"]{
  --paper:#211f1c; --card:#2a2723; --ink:#f0eae0; --sub:#a49b8c;
  --accent:#93b4d9; --line:#3a3630; --stage:#332f2a; --chipbg:#333d49;
  --fxbg:rgba(220,154,161,.2); --fxfg:#e2aab0; --spbg:#333029; --spfg:#8d8578;
}
:root[data-theme="light"]{
  --paper:#faf6ee; --card:#fff; --ink:#33302a; --sub:#7f7768;
  --accent:#5878a0; --line:#ebe2d3; --stage:#f5f1e8; --chipbg:#eef2f7;
  --fxbg:rgba(220,154,161,.18); --fxfg:#b06d75; --spbg:#f0ece3; --spfg:#98907f;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:'HankkiBody',system-ui,-apple-system,sans-serif;line-height:1.75;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:960px;margin:0 auto;padding:clamp(28px,5vw,64px) clamp(18px,4vw,32px) 90px;
  display:flex;flex-direction:column;gap:clamp(38px,6vw,60px)}
h1,h2,h3,b{font-family:'HankkiDisp','HankkiBody',sans-serif;font-weight:400}
.eyebrow{margin:0 0 6px;font-size:12.5px;letter-spacing:.14em;color:var(--accent)}
h1{margin:0;font-size:clamp(28px,5.4vw,42px);line-height:1.28;text-wrap:balance;letter-spacing:-.01em}
.lede{margin:14px 0 0;max-width:62ch;color:var(--sub);font-size:15.5px}
.lede b,.note b,.why b,.cant b{color:var(--ink)}
.top{border-bottom:2px solid var(--line);padding-bottom:26px}
.pausebtn{margin-top:18px;padding:9px 20px;border:1.5px solid var(--line);border-radius:999px;
  background:var(--card);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}
.pausebtn:hover{border-color:var(--accent);color:var(--accent)}
.pausebtn:focus-visible{outline:2.5px solid var(--accent);outline-offset:3px}
section{display:flex;flex-direction:column;gap:20px}
h2{margin:0;font-size:clamp(20px,3.4vw,26px);display:flex;flex-wrap:wrap;align-items:baseline;gap:12px}
.cnt{font-family:'HankkiBody',sans-serif;font-size:12.5px;color:var(--sub);letter-spacing:.04em}
.note{margin:0;max-width:66ch;color:var(--sub);font-size:14.5px}
.axis{background:var(--card);border:1px solid var(--line);border-radius:18px;
  padding:clamp(14px,2.6vw,20px);display:flex;flex-direction:column;gap:12px}
.axis h3{margin:0;font-size:18px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.axis .n{font-family:'HankkiBody',sans-serif;font-size:12px;color:var(--sub)}
.why{margin:-4px 0 0;color:var(--sub);font-size:13.5px;max-width:64ch}
.stage{background:var(--stage);border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}
.pic{position:relative;aspect-ratio:1;display:flex;align-items:flex-end;justify-content:center;
  padding:20% 14% 10%}
.holder{position:relative;height:100%;width:auto;max-width:100%;isolation:isolate}
.ch{position:absolute;inset:0;background-repeat:no-repeat;background-position:center;
  background-size:contain;filter:drop-shadow(0 3px 4px rgba(60,50,35,.2))}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:14px}
.spec{margin:0;display:flex;flex-direction:column;gap:8px}
.spec.s-spare .stage,.onestage.s-spare .stage{opacity:.6}
.axis.one{flex-direction:row;align-items:center;gap:clamp(14px,3vw,26px)}
.onestage{flex:0 0 clamp(110px,17vw,148px)}
.onetxt{flex:1 1 auto;display:flex;flex-direction:column;gap:6px;min-width:0}
.oneline{margin:2px 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:14px}
.oneline b{font-size:17px}
.oneline .desc{color:var(--sub);font-size:12.5px}
.axis.one .why{margin:0}
figcaption{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:14px}
figcaption span:last-child{flex:1 0 100%;color:var(--sub);font-size:12px;line-height:1.5}
.chip{padding:2px 8px;border-radius:999px;background:var(--chipbg);color:var(--accent);
  font-family:'HankkiBody',sans-serif;font-size:10.5px;letter-spacing:.02em;white-space:nowrap}
.chip.t-spare{background:var(--spbg);color:var(--spfg)}
.chip.t-fx{background:var(--fxbg);color:var(--fxfg)}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:var(--card)}
table{border-collapse:collapse;width:100%;min-width:540px;font-size:14px}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
th{font-size:11.5px;letter-spacing:.06em;color:var(--sub);font-weight:400}
tbody tr:last-child td{border-bottom:0}
.mon{color:var(--sub);font-size:13px;font-variant-numeric:tabular-nums}
.pay{color:var(--sub);font-size:12.5px}
.ax{color:var(--sub);font-size:13px}
.cant{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:11px;
  font-size:14.5px;color:var(--sub);max-width:68ch}
.cant li{padding-left:16px;position:relative}
.cant li::before{content:"";position:absolute;left:0;top:.72em;width:6px;height:6px;
  border-radius:50%;background:var(--accent);opacity:.5}
.hk-fx{position:absolute;line-height:1;pointer-events:none;aspect-ratio:1}
.hk-fx svg{width:100%;height:100%;display:block}
.hk-fx-food{background-repeat:no-repeat;background-position:center;background-size:contain}
body.still [class*="hk-m-"],body.still .hk-fx{animation-play-state:paused}
@media (prefers-reduced-motion: reduce){[class*="hk-m-"],.hk-fx{animation:none !important}}
'''

JS = '''
const btn=document.getElementById('pause');
btn.addEventListener('click',()=>{
  const on=document.body.classList.toggle('still');
  btn.textContent=on?'다시 움직이기':'멈춰서 보기';
});
'''

IMGCSS = ''.join(f'.c-{k}{{background-image:url({v})}}' for k, v in CH.items()) + \
         ''.join(f'.hk-fx-food.f{i}{{background-image:url({v})}}' for i, v in enumerate(FOOD))

chars = ''.join(sorted(set(re.sub(r'<[^>]+>', ' ', body) + ''.join(CH))))
def subset(src, out):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--text={chars}',
                    '--flavor=woff2', f'--output-file={out}', '--layout-features=*', '--no-hinting'],
                   check=True, cwd='/tmp')
    return 'data:font/woff2;base64,' + base64.b64encode(open(out, 'rb').read()).decode()
FONTS = (f"@font-face{{font-family:'HankkiDisp';src:url({subset(ROOT+'/src/assets/fonts/jua-korean-400.woff2','/tmp/_d.woff2')}) format('woff2');font-display:swap}}"
         f"@font-face{{font-family:'HankkiBody';src:url({subset(ROOT+'/src/assets/fonts/gowun-dodum-korean-400.woff2','/tmp/_b.woff2')}) format('woff2');font-display:swap}}")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write(f'<style>{FONTS}{CSS}{MOTION_CSS}{IMGCSS}</style>\n{body}\n<script>{JS}</script>\n')
print(f'{OUT}  {os.path.getsize(OUT)//1024} KB · 앱 CSS {len(MOTION_CSS)}자 그대로 사용')
