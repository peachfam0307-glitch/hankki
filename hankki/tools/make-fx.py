#!/usr/bin/env python3
"""✨ 배경 효과 부품 창고 — 코드로 만드는 「움직이는 것」.

왜 (창업자 2026-08-01)
  *"이런식이면 팩마다 효과 하나씩은 넣을수이겠다"*
  *"효과는 겹쳐도 괜찮아 배경이 다르고 양념느낌만 추가하는거니까"*
  → 효과는 **팩 전용이 아니라 재사용 부품**이다. 하나 만들면 여러 배경이 나눠 쓴다.
  ⭐ **효과는 창업자 손이 하나도 안 간다** — 그림만 주면 움직임은 코드가 붙인다.

⛔ 기준 하나 = **배경 하나에 효과 하나.** 한 배경에 여러 개 겹치면 무겁고 지저분하다.

⚠️ 이 파일은 **미리보기(GIF)** 를 만든다. 앱엔 GIF를 넣지 않는다 —
   실제로는 CSS 애니메이션(가벼움). 넣는 법은 각 함수 주석 참고.

쓰기:  python3 tools/make-fx.py <배경.png> <낼폴더>
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


# ═══════════════════════════════════════════ 🌧 비
# 물결에서 배운 걸 그대로 — **한 겹이면 벽지가 된다.**
#   ⒜세 겹(뒤 가늘고 연하고 느리게 / 앞 굵고 진하고 빠르게) → 앞뒤 깊이
#   ⒝**타일 크기만큼 정확히** 움직여야 이음매가 안 보인다
#   ⒞줄기 기울기 0.17 → **타일 가로 = 세로 × 0.17** 이라야 «자기 방향»으로 흐른다
RAIN_LAYERS = [(34, 200, 26, .8, 1.6, .16, .34, 1),
               (51, 300, 30, 1.2, 2.4, .24, .46, 2),
               (68, 400, 22, 2.0, 3.6, .34, .62, 3)]
RAIN_SPEED = [1, 2, 3]   # 앞에 있을수록 빨리


# ═══════════════════════════════════════════ ⭐ 별 반짝임
# 창업자 확정값 (2026-08-01, *"넘 은은하면 잘 안보니까 보이게"* → 확실한 판)
STAR = dict(count=78, big_ratio=.22, size=(1.8, 4.2), speed=(.8, 2.2),
            bright=(.75, 1.0), sky_max=150, ray=(3.4, 5.2), gamma=1.35)
# ⭐ 진짜처럼 보이는 핵심 넷
#   ① **하늘이 어두운 자리에만** 놓는다(밝은 데 뜨면 어색 + 스티커 자리를 뺏는다)
#   ② 별마다 **크기·주기·시작 시점이 다 다르다** → 다같이 깜빡이는 「전구」가 안 된다
#   ③ 밝아질 때 **살짝 커지고 빛살이 길어진다** ← 이게 반짝임의 핵심
#   ④ gamma 1.35 (2.2 아님) — 켜져 있는 시간이 길어야 «보인다»
# 🛠 앱: background-image 는 겹마다 투명도를 못 준다 → **`::before`/`::after` 두 겹**에
#    각각 다른 배치·주기·지연. 늘 켜진 옅은 별 한 겹은 background-image 에.


# ═══════════════════════════════════════════ 🎆 폭죽
# 창업자 확정값 (2026-08-01, *"좀 빨라"* · *"글로우는 빼자"* 반영)
FIRE = dict(shots=5, cycle_sec=6.8, life=.52, rise=.18,
            particles=(72, 112), radius=(.28, .40), glow=False,
            flash=(.05, .20))   # 섬광 반지름 = 퍼짐 반지름의 5%→20% (⛔아래 사고 참고)
# ⛔⛔ 2026-08-03 사고 — 섬광이 **화면 절반짜리 회색 원반**이 돼서 달을 덮었다.
#    옛값 `(.18, .68)` × 퍼짐반지름(.40) × 화면 = 지름 336/620px. 게다가 밝기를 1.5배
#    더하니 전부 흰색으로 뭉개져 «구멍»처럼 보였다. 창업자: *"안보여."*
#    ⭐ 배운 것 = **섬광은 «작고 짧아야» 팡 하고 보인다.** 크면 빛이 아니라 판때기가 된다.
#    ⛔ 값을 다시 키우지 말 것. 키우려면 먼저 정지컷으로 «터지는 프레임»을 보고 판단한다.
FIRE_COLS = [(255, 214, 120), (255, 158, 128), (150, 224, 208),
             (255, 246, 214), (240, 170, 205), (196, 206, 255)]
# ⭐ 「팡!」이 되는 순서 — 하나라도 빠지면 그냥 점이 퍼지는 걸로 보인다
#   ① 올라가는 불꽃 → ② **터지는 순간 섬광** → ③ 퍼짐(처음 빠르고 점점 느리게)
#   → ④ **중력에 처짐** + 꼬리 → ⑤ **잔불이 반짝반짝** 하며 꺼짐
# ⚠️ **섬광은 빼면 안 된다** — 창업자가 글로우를 뺐을 때도 이건 남겼다(작게 줄이기만).
# ⚠️ 색은 **우리 톤 뮤트.** 쨍하면 스티커와 싸운다.
# ⚠️ **밤 배경에서만 예쁘다** — 밝은 배경(크라프트·조각보)에선 빛이 안 보여 점만 뜬다.


def _grain_free_blur(img, r):
    return img.filter(ImageFilter.GaussianBlur(r))


def rain(bg, F=24):
    """비 — 배경 위에 세 겹으로 흐른다."""
    SZ = bg.size[0]
    tiles = []
    for (W, H, n, wmin, wmax, amin, amax, seed) in RAIN_LAYERS:
        t = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(t)
        rng = np.random.default_rng(seed)
        for _ in range(n):
            sx, sy = int(rng.integers(0, W)), int(rng.integers(0, H))
            L = int(rng.integers(H // 3, H))
            w = int(rng.integers(max(1, int(wmin)), max(2, int(wmax) + 1)))
            a = int(rng.uniform(amin, amax) * 255)
            for ox in (-W, 0, W):
                for oy in (-H, 0, H):
                    d.line([(sx + ox, sy + oy), (sx + ox + int(L * .17), sy + oy + L)], fill=a, width=w)
        tiles.append(_grain_free_blur(t, .6))
    out = []
    for f in range(F):
        fr = bg.copy()
        for (W, H, *_), tile, sp in zip(RAIN_LAYERS, tiles, RAIN_SPEED):
            dx, dy = int(W * sp * f / F), int(H * sp * f / F)
            lay = Image.new('L', (SZ + W * 2, SZ + H * 2), 0)
            for ix in range(0, SZ + W * 2, W):
                for iy in range(0, SZ + H * 2, H):
                    lay.paste(tile, (ix, iy))
            m = lay.crop((dx % W, dy % H, dx % W + SZ, dy % H + SZ))
            fr = Image.composite(Image.new('RGB', (SZ, SZ), (255, 255, 252)), fr, m.point(lambda v: int(v * .55)))
        out.append(fr)
    return out


def stars(bg, F=30, seed=11):
    """별 반짝임 — 하늘이 어두운 자리에만."""
    SZ = bg.size[0]
    lum = np.asarray(_grain_free_blur(bg.convert('L'), 14)).astype(float)
    rng = np.random.default_rng(seed)
    st, tries = [], 0
    while len(st) < STAR['count'] and tries < 9000:
        tries += 1
        x, y = int(rng.integers(10, SZ - 10)), int(rng.integers(8, int(SZ * .68)))
        if lum[y, x] > STAR['sky_max']:
            continue
        st.append((x, y, float(rng.uniform(*STAR['size'])), float(rng.uniform(0, 2 * np.pi)),
                   float(rng.uniform(*STAR['speed'])), float(rng.uniform(*STAR['bright']))))
    big = {i for i in range(len(st)) if rng.random() < STAR['big_ratio']}
    out = []
    for f in range(F):
        t = f / F
        lay = Image.new('L', (SZ, SZ), 0)
        d = ImageDraw.Draw(lay)
        for i, (x, y, r, ph, sp, mx) in enumerate(st):
            a = (np.sin(t * 2 * np.pi * sp + ph) * .5 + .5) ** STAR['gamma']
            v = int(255 * mx * a)
            if v < 10:
                continue
            rr = r * (.7 + .7 * a)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=v)
            L = rr * (STAR['ray'][1] if i in big else STAR['ray'][0])
            w = 2 if i in big else 1
            d.line([(x - L, y), (x + L, y)], fill=int(v * .6), width=w)
            d.line([(x, y - L), (x, y + L)], fill=int(v * .6), width=w)
            if i in big:
                D = L * .62
                d.line([(x - D, y - D), (x + D, y + D)], fill=int(v * .34), width=1)
                d.line([(x - D, y + D), (x + D, y - D)], fill=int(v * .34), width=1)
        out.append(Image.composite(Image.new('RGB', (SZ, SZ), (255, 254, 246)), bg, _grain_free_blur(lay, .5)))
    return out


def fireworks(bg, F=72, seed=5):
    """폭죽 — 올라감 → 섬광 → 퍼짐 → 처짐 → 잔불."""
    SZ = bg.size[0]
    rng = np.random.default_rng(seed)
    fw = []
    for i in range(FIRE['shots']):
        n = int(rng.integers(*FIRE['particles']))
        fw.append(dict(t0=i / FIRE['shots'] + rng.uniform(-.03, .03),
                       cx=rng.uniform(.14, .86) * SZ, cy=rng.uniform(.10, .40) * SZ,
                       sx=0, col=FIRE_COLS[i % len(FIRE_COLS)],
                       ang=rng.uniform(0, 2 * np.pi, n), spd=rng.uniform(.45, 1.0, n) ** .5,
                       R=rng.uniform(*FIRE['radius']) * SZ, ph=rng.uniform(0, 2 * np.pi, n)))
        fw[-1]['sx'] = fw[-1]['cx'] + rng.uniform(-40, 40)
    base = np.asarray(bg).astype(float)
    out = []
    for f in range(F):
        t = f / F
        lay = Image.new('RGB', (SZ, SZ), (0, 0, 0))
        d = ImageDraw.Draw(lay)
        for k_ in fw:
            u = (t - k_['t0']) % 1.0
            if u > 1 - FIRE['rise']:
                k = (u - (1 - FIRE['rise'])) / FIRE['rise']
                y = SZ * .99 + (k_['cy'] - SZ * .99) * k
                x = k_['sx'] + (k_['cx'] - k_['sx']) * k
                a = 1 - abs(k - .5) * 1.3
                if a > 0:
                    c = tuple(int(v * a) for v in k_['col'])
                    d.line([(x, y), (x, y + 22)], fill=c, width=3)
                    d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=c)
                continue
            if u > FIRE['life']:
                continue
            k = u / FIRE['life']
            if k < .08:                                        # 💥 섬광 — 빼면 안 된다
                fl = (1 - k / .08) ** 1.8
                f0, f1 = FIRE['flash']
                r = k_['R'] * (f0 + (f1 - f0) * k / .08)
                # ⭐ 한 겹으로 채우면 «판때기»가 된다 → 가운데만 밝은 세 겹으로 쌓는다
                for step, w in ((1.0, .30), (.62, .34), (.30, .40)):
                    rr = r * step
                    d.ellipse([k_['cx'] - rr, k_['cy'] - rr, k_['cx'] + rr, k_['cy'] + rr],
                              fill=tuple(int(v * fl * w) for v in k_['col']))
            rad = k_['R'] * (1 - np.exp(-3.0 * k))
            fade = (1 - k) ** 1.4
            drop = k_['R'] * .6 * k * k
            for a_, s_, p_ in zip(k_['ang'], k_['spd'], k_['ph']):
                x = k_['cx'] + np.cos(a_) * rad * s_
                y = k_['cy'] + np.sin(a_) * rad * s_ + drop
                cr = (np.sin(k * 26 + p_) * .5 + .5) * .75 + .25 if k > .32 else 1.0
                v = fade * (.6 + .4 * s_) * cr
                if v < .04:
                    continue
                r = 3.2 * v + .9
                c = tuple(min(255, int(vv * v * 1.35)) for vv in k_['col'])
                d.ellipse([x - r, y - r, x + r, y + r], fill=c)
                tx, ty = np.cos(a_) * r * 3.2, np.sin(a_) * r * 3.2
                d.line([(x, y), (x - tx, y - ty - drop * .14)], fill=tuple(int(vv * .55) for vv in c), width=2)
        sharp = np.asarray(lay).astype(float)
        soft = np.asarray(_grain_free_blur(lay, 1.6)).astype(float)   # 톱니만 막을 만큼
        out.append(Image.fromarray(np.clip(base + sharp * 1.5 + soft * .45, 0, 255).astype('uint8')))
    return out


# ═══════════════════════════════════════════ 🌫 안개 (핼러윈 후보 ⓐ)
# ⭐ **방향으로 고른 것이다.** 이미 쓰는 효과가 터짐(폭죽)·낙하(비)·깜빡(별)·가로출렁(물결) 넷이라
#    핼러윈이 그중 하나를 또 쓰면 *"효과들은 다 거기서 거기"*(창업자 2026-07-30) 로 돌아간다.
#    안개는 **옆으로 천천히 흐르는** 유일한 방향이다.
# ⚠️ 물결에서 배운 것 그대로 — **한 겹이면 벽지가 된다.** 세 겹이 서로 다른 속도로 흘러야 깊이가 산다.
# ⚠️ **위로 갈수록 사라지게** 한다. 안개는 땅에 깔리는 것이라 하늘까지 뿌예지면 배경이 죽는다.
# ⚠️ 색은 순백이 아니라 **연보라 섞은 흰색** — 순백이면 보라 밤과 싸우고 김(steam)처럼 보인다.
#
# ⛔⛔ **처음 만든 건 폭죽 사고와 같은 모양이었다** (2026-08-03, 보내기 전에 잡음).
#    진하기 .22~.30 으로 얹었더니 **호박·집이 뿌옇게 덮여 색이 죽고 배경이 통째로 회색**이 됐다.
#    📌 배경은 창업자가 골라 뽑은 그림이다 — **효과가 그림을 덮으면 그 효과는 틀린 것이다.**
#    → 진하기를 절반 아래로(.10~.13) · 띠를 더 아래로(0.62) · **덩어리를 가로로 늘렸다**
#      (안개는 가로로 퍼진다. 동그란 덩어리는 안개가 아니라 얼룩으로 보인다).
FOG_LAYERS = [(3.0, .10, 1.0), (2.0, .13, 1.7), (1.3, .11, 2.6)]   # (덩어리 크기, 진하기, 속도)
FOG_COL = (226, 220, 236)


def fog(bg, F=30, seed=7):
    """안개 — 아래쪽에 깔려 옆으로 흐른다."""
    SZ = bg.size[0]
    rng = np.random.default_rng(seed)
    # 위로 갈수록 0 이 되는 띠 — 아래 38% 만 쓴다(하늘까지 뿌예지면 배경이 죽는다)
    yy = np.linspace(0, 1, SZ)[:, None]
    band = np.clip((yy - .62) / .38, 0, 1) ** 1.4

    tiles = []
    for (scale, amp, _sp) in FOG_LAYERS:
        n = max(6, int(SZ / (28 * scale)))
        small = rng.random((max(3, n // 3), n))     # ⭐세로를 성기게 = 가로로 늘어난 덩어리
        t = Image.fromarray((small * 255).astype('uint8')).resize((SZ, SZ), Image.BICUBIC)
        t = _grain_free_blur(t, SZ / (n * 2.2))
        a = np.asarray(t).astype(float) / 255
        a = np.clip((a - .48) / .34, 0, 1)          # 성긴 덩어리만 남긴다(고르면 뿌연 막이 된다)
        tiles.append(a * band * amp)

    base = np.asarray(bg).astype(float)
    col = np.array(FOG_COL, dtype=float)
    out = []
    for f in range(F):
        acc = np.zeros((SZ, SZ))
        for a, (_s, _am, sp) in zip(tiles, FOG_LAYERS):
            acc = acc + np.roll(a, int(SZ * sp * f / F), axis=1)
        m = np.clip(acc, 0, 1)[:, :, None]
        out.append(Image.fromarray(np.clip(base * (1 - m) + col * m, 0, 255).astype('uint8')))
    return out


# ═══════════════════════════════════════════ 🕯 등불 (핼러윈 후보 ⓑ)
# ⭐ **배경 위에 뭘 얹지 않는다 — 배경에 «이미 그려진» 불에 빛을 붙인다.**
#    클레이 핼러윈밤엔 집 창문·호박 얼굴·달·별이 이미 노랗게 칠해져 있다. 거기만 밝아졌다 어두워진다.
#    그래서 이 효과는 **이 배경에서만 성립한다** — 다른 배경에 붙이면 아무 데도 안 밝아진다.
# ⚠️ 「깜빡이」(stars)와 방향이 같아 보이지만 **인상이 다르다** — 별은 «점이 켜졌다 꺼지고»
#    이건 «면이 은은하게 숨 쉰다». 방향 규칙의 취지(다 비슷해 보이지 않게)엔 맞는다.
# ⚠️⚠️ **크게 얹지 말 것** — 2026-08-03 폭죽 사고가 정확히 이거였다(섬광이 화면 절반 회색 원반이 돼 달을 덮었다).
#    번짐은 짧게(긴변의 1.4%), 세기는 원래 밝기에 «곱해서» 얹는다(더하면 하얗게 타버린다).
# ⚠️ 촛불은 서로 안 맞춰 흔들린다 — 자리마다 **위상을 어긋나게** 준다. 다 같이 깜빡이면 기계 같다.
LANTERN = dict(warm=42, bright=118, blur=.014, gain=.55, cycle=2)


def lantern(bg, F=30, seed=3):
    """등불 — 배경에 그려진 노란·주황 불빛이 은은하게 숨 쉰다."""
    SZ = bg.size[0]
    a = np.asarray(bg).astype(float)
    # 「따뜻하고 밝은 곳」 = 빨강이 파랑보다 충분히 크고, 자체가 밝은 곳
    warm = np.clip((a[:, :, 0] - a[:, :, 2] - LANTERN['warm']) / 60, 0, 1)
    lit = np.clip((a[:, :, 0] - LANTERN['bright']) / 90, 0, 1)
    m = warm * lit
    # 자리마다 다른 위상 — 가로세로로 느리게 도는 무늬를 곱해 «같이» 안 깜빡이게
    ph = np.stack(np.meshgrid(np.linspace(0, 1, SZ), np.linspace(0, 1, SZ)), -1)
    phase = (np.sin(ph[:, :, 0] * 7.3 + seed) + np.cos(ph[:, :, 1] * 5.1)) * .5

    halo = np.asarray(_grain_free_blur(
        Image.fromarray((m * 255).astype('uint8')), SZ * LANTERN['blur'])).astype(float) / 255
    out = []
    for f in range(F):
        t = 2 * np.pi * LANTERN['cycle'] * f / F
        puls = (np.sin(t + phase * np.pi) * .5 + .5)          # 0~1, 자리마다 어긋남
        k = 1 + halo * puls * LANTERN['gain']                 # ⭐더하지 말고 «곱한다»
        out.append(Image.fromarray(np.clip(a * k[:, :, None], 0, 255).astype('uint8')))
    return out


FX = {'rain': (rain, 24, 95), 'stars': (stars, 30, 95), 'fireworks': (fireworks, 72, 95),
      'fog': (fog, 30, 95), 'lantern': (lantern, 30, 95)}

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else 'docs/stickers/배경-창업자-2026-07-31/원본/달밤억새.png'
    out = sys.argv[2] if len(sys.argv) > 2 else 'design/promo/배경효과-미리보기'
    os.makedirs(out, exist_ok=True)
    bg = Image.open(src).convert('RGB').resize((560, 560), Image.LANCZOS)
    for name, (fn, F, dur) in FX.items():
        fs = [f.convert('P', palette=Image.ADAPTIVE, colors=128) for f in fn(bg, F)]
        p = os.path.join(out, f'{name}.gif')
        fs[0].save(p, save_all=True, append_images=fs[1:], duration=dur, loop=0, optimize=True)
        print(f'  ✅ {p}  {os.path.getsize(p)//1024}KB  {F}프레임')
    print('\n📌 앱엔 GIF 를 넣지 않는다 — CSS 애니메이션으로 (각 함수 주석 참고)')
