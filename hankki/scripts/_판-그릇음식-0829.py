#!/usr/bin/env python3
"""🍲 그릇 프레임에 «진짜 음식 사진» 끼운 판 (창업자 2026-08-23)

📮 창업자 = *"일단이거로 음식넣어봐"* · *"프레임안에 음식이 꽉 차야지"*

⭐⭐ 심장 = **창 위치를 손으로 안 적는다.** 뚫린 PNG 에서 «그 구멍»을 직접 잰다.
   ⛔ 값을 옮겨 적으면 컷을 다시 뚫는 순간 낡는다 — 오늘만 세 번 다시 뚫었다.

⭐ 「꽉 차게」 = 창 크기의 «구멍»을 만들어 가두고(overflow) 사진은 그 «안»에서 당긴다.
   ⛔ 사진 자체를 키우면 꽉 차긴 하는데 **그릇 «밖»으로 삐져나온다**(오늘 실제로 그랬다).

⭐ 오버스캔 = 사진을 창보다 3% 크게. 안쪽 테가 사진 위로 «물리게» 한다.
   📮 창업자 = *"그릇 안쪽 테두리가 살짝 위에 겹쳐져야… 스티커처럼 안 보여"*

실행: cd /home/user/hankki/hankki && python3 scripts/_판-그릇음식-0823.py
"""
import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parent.parent
그릇 = ROOT / 'docs/stickers/그릇-창업자-2026-08-29'
음식방 = ROOT / 'docs/stickers/그릇-창업자-2026-08-23'
아이콘방 = ROOT / 'src/assets/stickers/photo'
낼곳 = ROOT / 'docs/시안/그릇음식-0829'
낼곳.mkdir(parents=True, exist_ok=True)

# 쓸 컷 = 오늘 «깨끗하게» 잘리고 뚫린 것만 (깨진 컷은 안 쓴다)
#   ⭐ 바깥 윤곽선 넣은 새 시트를 «맨 앞»에 둔다 — 창업자가 방금 자른 것부터 본다
컷들 = [
    ('🍂 가을 · 접시', [
        ('낱개-가을접시/au_d01.png', '물결 테'),
        ('낱개-가을접시/au_d02.png', '넓은 테'),
        ('낱개-가을접시/au_d03.png', '초록 선'),
        ('낱개-가을접시/au_d04.png', '주름 테'),
    ]),
    ('🍂 가을 · 손잡이 그릇', [
        ('낱개-가을그릇/au_h01.png', '둥근 그라탕'),
        ('낱개-가을그릇/au_h02.png', '오벌 플래터'),
        ('낱개-가을그릇/au_h03.png', '얕은 오벌'),
        ('낱개-가을그릇/au_h04.png', '깊은 오벌'),
    ]),
    ('🎀 프렌치 · 접시', [
        ('낱개-프렌치접시/fr_d01.png', '크림 리본'),
        ('낱개-프렌치접시/fr_d02.png', '핑크'),
        ('낱개-프렌치접시/fr_d03.png', '노랑 장미'),
        ('낱개-프렌치접시/fr_d04.png', '하늘 진주'),
    ]),
    ('🎀 프렌치 · 손잡이 그릇', [
        ('낱개-프렌치그릇/fr_h01.png', '핑크 손잡이'),
        ('낱개-프렌치그릇/fr_h02.png', '노랑 손잡이'),
        ('낱개-프렌치그릇/fr_h03.png', '하늘 손잡이'),
        ('낱개-프렌치그릇/fr_h04.png', '크림 주름'),
    ]),
]

음식들 = [
    # zoom = 사진 «속»의 그릇을 잘라내고 음식만 남기는 배율(눈으로 맞췄다)
    ('음식샘플/제육볶음.jpg', '제육볶음', 1.55),  # 팬 테두리가 창 안에 비쳐서 더 당겼다
    ('음식샘플/파스타.jpg', '새우 파스타', 1.90),
]

# 🍚🍚 [창업자 2026-08-29] *"우리 아이콘도 저기에 넣을 수 있어?"* → 넣어서 보여준다.
#   ⭐⭐ 이게 진짜 관건이다 — **사진을 안 찍는 유저가 훨씬 많고**, 그 사람들 표지엔
#      제목에서 자동으로 붙는 «음식 아이콘»만 있다. 거기서도 그릇이 살아야 팩이 값을 한다.
#   ⛔ 사진과 다른 점 = 아이콘은 **투명 PNG 에 그림이 가운데만** 있다.
#      `object-fit: cover` 로 꽉 채우면 잘리므로 `contain` 으로 «담기게» 하고 배율을 줄인다.
아이콘들 = [
    ('fh_k07.png', '김치찌개', 0.78),
    ('fe_282.png', '떡볶이', 0.78),
]


def 창재기(경로):
    """뚫린 PNG 에서 «그릇 안의 구멍»을 찾아 프레임 대비 비율로 돌려준다."""
    a = np.array(Image.open(경로).convert('RGBA'))
    alpha = a[..., 3]
    보임 = alpha > 128
    if not 보임.any():
        return None
    ys, xs = np.nonzero(보임)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    W, H = x1 - x0 + 1, y1 - y0 + 1

    # 투명한 곳 중 «바깥과 안 이어진» 덩어리 = 창
    빈곳 = alpha <= 128
    덩어리, n = label(빈곳)
    if n == 0:
        return None
    바깥 = {덩어리[0, 0], 덩어리[0, -1], 덩어리[-1, 0], 덩어리[-1, -1]} - {0}
    안쪽 = [i for i in range(1, n + 1) if i not in 바깥]
    if not 안쪽:
        return None
    창번호 = max(안쪽, key=lambda i: (덩어리 == i).sum())
    창 = 덩어리 == 창번호
    if 창.sum() < 보임.sum() * 0.05:
        return None
    # ⭐⭐ 창 «모양» 그대로 마스크를 만든다 — 사각·삼각 접시는 창이 동그라미가 아니다.
    #    ⛔ border-radius:50% 로 잘라내면 네 귀퉁이가 비어 페이지 바탕이 비친다.
    마스크 = np.zeros((*창.shape, 4), np.uint8)
    마스크[창] = (255, 255, 255, 255)
    마스크im = Image.fromarray(마스크)
    # ⭐ 판이 41MB 로 터져서 줄였다 — 마스크는 «모양»만 쓰니 520px 이면 충분하다
    if max(마스크im.size) > 520:
        r = 520 / max(마스크im.size)
        마스크im = 마스크im.resize((round(마스크im.width * r), round(마스크im.height * r)), Image.LANCZOS)
    buf = io.BytesIO()
    마스크im.save(buf, 'PNG', optimize=True)
    마스크uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

    wy, wx = np.nonzero(창)
    return {
        '마스크': 마스크uri,
        'w': round((wx.max() - wx.min() + 1) / W, 4),
        'h': round((wy.max() - wy.min() + 1) / H, 4),
        'cx': round((wx.min() + wx.max()) / 2 - x0, 1) / W,
        'cy': round((wy.min() + wy.max()) / 2 - y0, 1) / H,
        'W': int(W), 'H': int(H),
        '컷': f'{W}×{H}',
    }


def uri(p, 긴변=None):
    """⛔⛔ 같은 그림을 <img src> 로 여러 번 심으면 판이 «터진다» —
    16컷 × 4묶음 = 64번 심어 41MB 가 나왔다(아티팩트 상한 16MB).
    ✅ 그래서 uri 는 «한 번»만 만들고 CSS 클래스로 재사용한다(아래 배경틀).
    ⭐ 판정은 폰에서 360px 로 하므로 원본을 그대로 실을 이유도 없다 → 긴변을 줄인다."""
    if 긴변:
        im = Image.open(p).convert('RGBA')
        if max(im.size) > 긴변:
            r = 긴변 / max(im.size)
            im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, 'PNG', optimize=True)
        return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    ext = 'jpeg' if str(p).lower().endswith(('.jpg', '.jpeg')) else 'png'
    return f'data:image/{ext};base64,' + base64.b64encode(Path(p).read_bytes()).decode()


def 아이디(경로):
    """'낱개-가을접시/au_d01.png' → 'au_d01' · 클래스 이름으로 쓴다"""
    return Path(경로).stem


OVER = 1.03  # 오버스캔 — 사진을 창보다 3% 크게 깔아 테 «밑»으로 민다
크기 = 360  # 창업자가 폰에서 판정한다 — 작으면 「합성 티」가 안 보인다

프레임uri, 창값 = {}, {}
못잰것 = []
for _, 목록 in 컷들:
    for 경로, _이름 in 목록:
        f = 그릇 / 경로
        c = 창재기(f)
        if c is None:
            못잰것.append(경로)
            continue
        창값[경로] = c
        프레임uri[경로] = uri(f, 긴변=520)
if 못잰것:
    print('⛔ 창을 못 잰 컷:', ', '.join(못잰것))

음식uri = {p: uri(음식방 / p) for p, _, _ in 음식들}
음식uri.update({p: uri(아이콘방 / p) for p, _, _ in 아이콘들})


def 칸(경로, 음식경로, zoom, px=크기, 아이콘=False):
    c = 창값[경로]
    # ⛔⛔ **칸을 «정사각»으로 두면 프레임이 눌려 늘어난다** (창업자 2026-08-23
    #    *"바깥접시라인이 고르게선명하지않아 파먹힌느낌나는데"*).
    #    🔢 pb_o03 은 566×418 인데 360×360 에 넣으면 세로로 1.35배 늘어난다 —
    #       1~2px 짜리 진갈색 선이 «방향마다 다른 두께»가 되어 파먹힌 것처럼 보인다.
    # ✅ 칸을 컷의 «가로세로 그대로» 만든다. 늘리지 않는다.
    ph_cell = px * c['H'] / c['W']
    pw, ph = px * c['w'] * OVER, ph_cell * c['h'] * OVER
    left, top = px * c['cx'] - pw / 2, ph_cell * c['cy'] - ph / 2
    갈래 = 'icon' if 아이콘 else 'food'
    # ⛔ 아이콘엔 «닿는 그림자»를 안 얹는다 — 투명 PNG 라 그림자가 그림이 아니라 창 전체에 진다
    그늘 = '' if 아이콘 else '<div class="shade"></div>'
    # ⛔ 그림을 여기서 «심지» 않는다 — 클래스 이름만 쓴다(맨 아래 배경틀에 한 번만 실린다)
    이름 = 아이디(경로)
    먹 = 아이디(음식경로)
    return (
        f'<div class="cell" style="width:{px}px;height:{ph_cell:.1f}px">'
        f'<div class="hole m-{이름}" style="left:0;top:0;width:{px}px;height:{ph_cell:.1f}px">'
        f'<div class="inner" style="left:{left:.1f}px;top:{top:.1f}px;width:{pw:.1f}px;height:{ph:.1f}px">'
        f'<div class="{갈래} p-{먹}" style="transform:scale({zoom})"></div>'
        f'{그늘}</div></div>'
        f'<div class="frame f-{이름}"></div></div>'
    )


줄들 = []
for 음식경로, 음식이름, zoom in 음식들:
    묶음 = []
    for 갈래, 목록 in 컷들:
        칸들 = ''.join(
            f'<figure>{칸(p, 음식경로, zoom)}<figcaption>{n}</figcaption></figure>'
            for p, n in 목록 if p in 창값
        )
        묶음.append(f'<h3>{갈래}</h3><div class="strip">{칸들}</div>')
    줄들.append(
        f'<section><span class="badge">🍽 {음식이름}</span>' + ''.join(묶음) + '</section>'
    )

# 🍚 아이콘 판 — 사진 없이 «자동 음식 아이콘»만 있는 표지에서도 그릇이 사나
for 아이콘경로, 아이콘이름, zoom in 아이콘들:
    묶음 = []
    for 갈래, 목록 in 컷들:
        칸모음 = ''.join(
            f'<figure>{칸(p, 아이콘경로, zoom, 아이콘=True)}<figcaption>{n}</figcaption></figure>'
            for p, n in 목록 if p in 창값
        )
        묶음.append(f'<h3>{갈래}</h3><div class="strip">{칸모음}</div>')
    줄들.append(
        f'<section><span class="badge">🍚 {아이콘이름} — 우리 아이콘</span>'
        '<p class="note" style="margin:0 0 12px">사진을 안 찍은 유저는 이 화면을 본다. '
        '<b>사진이 없어도 그릇이 값을 하나</b>가 여기서 갈린다.</p>'
        + ''.join(묶음) + '</section>'
    )

# 🖼🖼 배경틀 — 그림을 «여기 한 번만» 싣는다(위 uri 주석 참조)
배경틀 = '<style>' + ''.join(
    f'.m-{아이디(p)}{{-webkit-mask-image:url({창값[p]["마스크"]});mask-image:url({창값[p]["마스크"]})}}'
    f'.f-{아이디(p)}{{background-image:url({프레임uri[p]})}}'
    for p in 창값
) + ''.join(
    f'.p-{아이디(p)}{{background-image:url({음식uri[p]})}}'
    for p in 음식uri
) + '</style>'

첫컷 = 컷들[0][1][0][0]
오버스캔 = (
    f'<figure>{칸(첫컷, 음식들[0][0], 음식들[0][2], 260)}'
    '<figcaption>지금 (3% 크게)</figcaption></figure>'
)

표 = ''.join(
    f'<tr><td>{n}</td><td>{창값[p]["컷"]}</td>'
    f'<td>{창값[p]["w"]:.2f}</td><td>{창값[p]["h"]:.2f}</td></tr>'
    for _, 목록 in 컷들 for p, n in 목록 if p in 창값
)

HTML = f"""<title>그릇에 음식 넣기</title>
<style>
  :root{{--ink:#2b2724;--sub:#6f6862;--line:#ddd5c8;--paper:#faf7f1;
    --card:#fff;--cream:#f2ede3;--brown:#5878a0;--bad:#b3453a;}}
  @media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{
    --ink:#ece7e0;--sub:#a49c93;--line:#3a3730;--paper:#1c1b19;
    --card:#252320;--cream:#2f2c27;--brown:#7093c0;--bad:#e08277;}}}}
  :root[data-theme="dark"]{{--ink:#ece7e0;--sub:#a49c93;--line:#3a3730;--paper:#1c1b19;
    --card:#252320;--cream:#2f2c27;--brown:#7093c0;--bad:#e08277;}}
  body{{background:var(--paper);color:var(--ink);margin:0;padding:22px 16px 90px;
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",system-ui,sans-serif;
    line-height:1.65;word-break:keep-all;}}
  .wrap{{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:26px}}
  h1{{font-size:23px;margin:0;letter-spacing:-.02em}}
  h2{{font-size:18px;margin:0 0 4px}}
  h3{{font-size:15px;margin:18px 0 10px;color:var(--sub);font-weight:700}}
  .lead{{color:var(--sub);font-size:14.5px;margin:6px 0 0}}
  .quote{{border-left:3px solid var(--brown);padding:8px 0 8px 13px;color:var(--sub);font-size:14px;margin:0}}
  section{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 16px}}
  .badge{{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;
    border-radius:999px;background:var(--cream);color:var(--brown);margin-bottom:10px}}
  .strip{{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px}}
  figure{{margin:0;flex:0 0 auto;text-align:center}}
  figcaption{{font-size:12.5px;color:var(--sub);margin-top:6px}}
  .cell{{position:relative;overflow:hidden}}
  /* 창 «모양» 그대로 오려낸다 — 사각·삼각 접시는 동그라미가 아니다 */
  .hole{{position:absolute;-webkit-mask-size:100% 100%;mask-size:100% 100%;
    -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}}
  .inner{{position:absolute;overflow:hidden}}
  .food{{width:100%;height:100%;display:block;background-size:cover;background-position:center;background-repeat:no-repeat}}
  /* 🍚 우리 아이콘은 투명 PNG 에 그림이 «가운데만» 있다 — cover 로 채우면 잘린다 */
  .icon{{width:100%;height:100%;display:block;background-size:contain;background-position:center;background-repeat:no-repeat}}
  /* 닿는 그림자 — 안쪽 벽이 사진 위로 드리운다.
     없으면 사진이 «위에 붙인 것»으로 보인다(창업자 "합성한티가 너무 나").
     창업자가 요구한 «안쪽 림 바로 아래 아주 약한 음영»을 지피티는 그림에 그려 넣었는데
     그 음영이 회색 창 «위»에 있어 창 뚫기가 통째로 지웠다.
     그래서 그림에 굽지 않고 여기서 얹는다 — 프레임마다 다시 안 그려도 되고 세기도 조절된다. */
  .shade{{position:absolute;inset:0;border-radius:50%;pointer-events:none;
    box-shadow:inset 0 6px 14px rgba(60,42,28,.34), inset 0 -3px 9px rgba(60,42,28,.16)}}
  .frame{{position:absolute;left:0;top:0;width:100%;height:100%;display:block;
    background-size:100% 100%;background-repeat:no-repeat}}
  .note{{background:var(--cream);border-radius:11px;padding:12px 14px;font-size:13.5px;color:var(--sub)}}
  table{{border-collapse:collapse;width:100%;font-size:13.5px;margin-top:10px}}
  th,td{{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left}}
  th{{color:var(--sub);font-weight:700}}
  td:nth-child(n+2){{font-variant-numeric:tabular-nums}}
  .pick{{display:flex;align-items:center;gap:9px;padding:9px 2px;cursor:pointer;font-size:15px}}
  .pick input{{position:absolute;opacity:0;width:0;height:0}}
  .dot{{width:19px;height:19px;border-radius:50%;border:2px solid var(--line);flex:0 0 auto}}
  .pick input:checked + .dot{{border-color:var(--brown);background:var(--brown);box-shadow:inset 0 0 0 3.5px var(--card)}}
  textarea{{width:100%;box-sizing:border-box;min-height:110px;font:inherit;font-size:13.5px;
    background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:11px;padding:11px}}
  button{{font:inherit;font-size:15px;font-weight:700;padding:13px 20px;border:none;
    border-radius:11px;background:var(--brown);color:#fff;width:100%;cursor:pointer;margin-top:10px}}
  .said{{font-size:13px;color:var(--brown);min-height:19px;margin-top:8px;text-align:center}}
</style>

{배경틀}
<div class="wrap">
  <header>
    <h1>새 그릇 네 세트 — 음식 넣어보기</h1>
    <p class="lead">네가 보낸 제육볶음·새우 파스타 사진을 오늘 깨끗하게 잘린 <b>9컷</b>에 끼웠어.
      창 위치는 손으로 안 적고 <b>뚫린 컷에서 직접 쟀다.</b></p>
  </header>

  {''.join(줄들)}

  <section>
    <span class="badge">🔬 오버스캔</span>
    <h2>안쪽 테가 사진 위로 물린다</h2>
    <p class="quote">📮 “원형 음식 사진의 가장자리보다 그릇 안쪽 테두리가 살짝 위에 겹쳐져야 해.”</p>
    <div class="strip" style="margin-top:12px">{오버스캔}</div>
    <p class="note" style="margin-top:12px">
      사진을 창보다 <b>3% 크게</b> 깔아서 테 «밑»으로 밀어 넣었어.
      딱 맞게 깔면 머리카락 같은 흰 틈이 생겨.
      앱에 넣을 땐 <code>DecorEditor.jsx</code> 의 <code>win.w</code> → <code>win.w * 1.03</code> 한 줄이야.
    </p>
  </section>

  <section>
    <span class="badge">📐 실측</span>
    <h2>창 크기 (프레임 대비)</h2>
    <table><tr><th>컷</th><th>크기</th><th>창 폭</th><th>창 높이</th></tr>{표}</table>
    <p class="note" style="margin-top:12px">
      우리 기존 프레임 54개 평균이 <b>0.694</b> — GPT가 말한 62~70%와 같은 자리야.
    </p>
  </section>

  <section>
    <h2>골라줘</h2>
    <label class="pick"><input type="radio" name="갈래" value="높이"><span class="dot"></span><span>높이 있는 그릇이 낫다</span></label>
    <label class="pick"><input type="radio" name="갈래" value="접시"><span class="dot"></span><span>위에서 본 접시가 낫다</span></label>
    <label class="pick"><input type="radio" name="갈래" value="둘다"><span class="dot"></span><span>둘 다 넣는다 (골라 쓰게)</span></label>
    <h3>사진을 얼마나 당길까</h3>
    <label class="pick"><input type="radio" name="당김" value="지금"><span class="dot"></span><span>지금이 좋다</span></label>
    <label class="pick"><input type="radio" name="당김" value="더"><span class="dot"></span><span>더 당겨서 음식만 (그릇 안 보이게)</span></label>
    <label class="pick"><input type="radio" name="당김" value="덜"><span class="dot"></span><span>덜 당겨서 사진을 더 넓게</span></label>
    <textarea id="out" readonly placeholder="고르면 여기에 정리돼요"></textarea>
    <button id="cp" type="button">복사하기</button>
    <div class="said" id="said"></div>
  </section>
</div>

<script>
  var KEY='hankki:그릇음식0823'
  var box=document.getElementById('out'), said=document.getElementById('said')
  function 값(){{ try{{ return JSON.parse(localStorage.getItem(KEY)||'{{}}') }}catch(e){{ return {{}} }} }}
  function 그린다(){{
    var v=값(), 줄=[]
    document.querySelectorAll('input[type=radio]').forEach(function(el){{ if(v[el.name]===el.value) el.checked=true }})
    Object.keys(v).forEach(function(k){{
      var el=document.querySelector('input[name="'+CSS.escape(k)+'"][value="'+CSS.escape(v[k])+'"]')
      var g=el?el.parentNode.querySelector('span:last-child').textContent.trim():v[k]
      줄.push('· '+k+' → '+g)
    }})
    box.value=줄.length?('[그릇 프레임 판정 · 2026-08-23]\\n'+줄.join('\\n')):''
  }}
  document.addEventListener('change',function(e){{
    if(e.target.type!=='radio') return
    var v=값(); v[e.target.name]=e.target.value
    try{{ localStorage.setItem(KEY,JSON.stringify(v)) }}catch(err){{}}
    그린다()
  }})
  document.getElementById('cp').addEventListener('click',function(){{
    if(!box.value){{ said.textContent='아직 고른 게 없어요'; return }}
    var 골라주기=function(){{
      box.removeAttribute('readonly'); box.focus(); box.select()
      box.setSelectionRange(0,box.value.length)
      said.textContent='글자를 골라뒀어요 — 길게 눌러 복사해주세요'
    }}
    try{{ navigator.clipboard.writeText(box.value).then(function(){{ said.textContent='복사했어요' }},골라주기) }}
    catch(e){{ 골라주기() }}
  }})
  그린다()
</script>
"""

파일 = 낼곳 / '판.html'
파일.write_text(HTML, encoding='utf-8')
print(f'\n🍲 {파일}  ({len(HTML)/1024/1024:.1f}MB · 컷 {len(창값)}개)\n')
for p, c in 창값.items():
    print(f"  {p.split('/')[-1]:14s} {c['컷']:>9s}  창 {c['w']:.3f}×{c['h']:.3f}  중심 {c['cx']:.3f}/{c['cy']:.3f}")
print()
