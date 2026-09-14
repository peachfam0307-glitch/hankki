#!/usr/bin/env python3
"""🎨 유료팩 배경 만들기 — **질감을 코드로 계산해서** PNG로 뽑는다.

왜 만들었나 (창업자 2026-07-31)
  *"이거 돈주고 사는건데 이정도 퀄이면 안살듯 ㅠㅠ"* — 맞는 판단이었다.
  CSS 그라데이션은 **색만 섞는다.** 종이 결·물감 번짐·유리 물방울 같은
  «알갱이»가 없어서 유료팩 값어치가 안 난다.
  → 픽셀을 직접 계산하면 그 알갱이를 만들 수 있다. 이 파일이 그걸 한다.

⭐⭐ 무엇을 코드로 하고 무엇을 그림으로 받나 (창업자와 확정 2026-07-31)
  | 소재 | 누가 | 왜 |
  |---|---|---|
  | **질감·패턴·빛·물** (종이결·천 올·빗줄기·물방울·보케·안개) | **코드(클로드)** | 규칙이 있어 계산으로 만들어진다 |
  | **색 조합·풍경·그림** (조각보 색천·단풍길·창밖 풍경) | **그림(창업자)** | 「어울리나」는 눈이 정한다 — 코드가 약하다 |
  📌 실제로 그랬다: **비 오는 창은 코드가 잘 나왔고(빗줄기·물방울=계산 가능),
     조각보는 「격자무늬 종이」처럼 보였다**(색천의 «감»이 안 나온다).

규격 (앱에서 확인한 값)
  · 표지는 **정사각 1:1** (`Thumb.jsx` `aspectRatio:'1/1'`)
  · **1254×1254** 면 충분 — 표지 최대 표시가 폰 폭 390 CSS px × DPR3 = 1170px
  · **가운데는 비운다** — 스티커·글자가 거기 올라간다
  · 채도는 낮게 — 우리 스티커가 쨍해서 배경까지 세면 둘이 싸운다

쓰기:  python3 tools/make-bg.py <낼폴더>
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy.ndimage import gaussian_filter

N = 1254
Y, X = np.mgrid[0:N, 0:N].astype(float)
R = np.hypot((X - N / 2) / (N / 2), (Y - N / 2) / (N / 2))


def grain(sig, amp, seed):
    """부드러운 잡티 — 종이 결·보풀의 재료."""
    g = gaussian_filter(np.random.default_rng(seed).normal(0, 1, (N, N)), sig)
    return g / (np.abs(g).max() + 1e-9) * amp


def center_lift(a, amt=10):
    """가운데를 살짝 밝혀 스티커가 뜨게 한다."""
    return a + (np.clip(1 - R * 1.15, 0, 1) ** 1.6 * amt)[..., None]


# ─────────────────────────────────────────── 🌧 비 오는 창
def rain_window(seed=21):
    """창밖 가을빛 + 유리 김서림 + 빗줄기 + 물방울.

    ⭐ 물방울은 **위가 어둡고 아래가 밝다** — 빛이 굴절해서 그렇다.
       이 한 가지만 지켜도 «유리에 맺힌 것»으로 읽힌다.
    ⚠️ 빗줄기는 굵기·길이·투명도를 **전부 다르게** — 한 겹으로 고르게 그으면 벽지가 된다.
    """
    rng = np.random.default_rng(seed)
    top, bot = np.array([232, 231, 224.]), np.array([206, 209, 201.])
    sky = top + (bot - top) * (Y / N)[..., None]

    bo = Image.new('RGB', (N, N), (0, 0, 0))
    bd = ImageDraw.Draw(bo)
    for _ in range(46):                       # 창밖 보케 — 가을빛 덩어리
        cx, cy = rng.integers(0, N, 2)
        rr = int(rng.integers(38, 150))
        c = [(214, 158, 92), (198, 132, 78), (186, 158, 96), (224, 186, 118)][int(rng.integers(0, 4))]
        bd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=c)
    sky = sky * .78 + np.asarray(bo.filter(ImageFilter.GaussianBlur(58))).astype(float) * .42
    sky = gaussian_filter(sky, (9, 9, 0)) * .94 + np.array([252, 252, 250.]) * .06   # 김서림

    rain = Image.new('L', (N, N), 0)
    rd = ImageDraw.Draw(rain)
    for _ in range(340):
        sx, sy = rng.integers(-120, N), rng.integers(-120, N)
        L, w = int(rng.integers(60, 230)), int(rng.integers(1, 3))
        rd.line([(sx, sy), (sx + int(L * .17), sy + L)], fill=int(rng.integers(40, 130)), width=w)
    rm = np.asarray(rain.filter(ImageFilter.GaussianBlur(.7))).astype(float) / 255
    sky = sky * (1 - rm[..., None] * .5) + np.array([255, 255, 253.]) * (rm[..., None] * .5)

    dr = Image.fromarray(np.clip(sky, 0, 255).astype('uint8'))
    dd = ImageDraw.Draw(dr, 'RGBA')
    for _ in range(70):
        cx, cy = rng.integers(0, N, 2)
        rr = int(rng.integers(4, 15))
        dd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(120, 126, 120, 42))          # 아래 그늘
        dd.ellipse([cx - rr + 2, cy - rr + 2, cx + rr - 1, cy + rr - 1], fill=(255, 255, 252, 70))
        dd.ellipse([cx - rr // 2, cy - rr // 2, cx - rr // 4, cy - rr // 4], fill=(255, 255, 255, 150))  # 하이라이트
    a = np.asarray(dr.filter(ImageFilter.GaussianBlur(.5))).astype(float) + grain(.8, 2.0, seed + 3)[..., None]
    return Image.fromarray(np.clip(center_lift(a, 12), 0, 255).astype('uint8'))


# ─────────────────────────────────────────── 📜 한지
def hanji(seed=5):
    """닥나무 결 — **긴 섬유**가 결을 따라 누워 있는 게 한지의 특징이다.
    (짧은 잡티만 뿌리면 «모래»가 되고 한지가 안 된다)
    """
    rng = np.random.default_rng(seed)
    base = np.zeros((N, N, 3))
    base[:] = np.array([250, 244, 231.]) + (np.array([241, 231, 210.]) - np.array([250, 244, 231.])) * (Y / N)[..., None]
    fib = Image.new('L', (N, N), 0)
    fd = ImageDraw.Draw(fib)
    for _ in range(2600):                     # 섬유 — 길고 가늘게, 방향은 살짝만 흔들리게
        sx, sy = rng.integers(0, N, 2)
        L = int(rng.integers(30, 190))
        ang = rng.normal(0, .28)
        fd.line([(sx, sy), (sx + int(L * np.cos(ang)), sy + int(L * np.sin(ang)))],
                fill=int(rng.integers(18, 62)), width=1)
    f = np.asarray(fib.filter(ImageFilter.GaussianBlur(.6))).astype(float) / 255
    a = base - (f * 16)[..., None] + grain(1.6, 3.2, seed + 1)[..., None] + grain(.5, 1.4, seed + 2)[..., None]
    return Image.fromarray(np.clip(center_lift(a, 8), 0, 255).astype('uint8'))


MAKERS = {'rain-window': rain_window, 'hanji': hanji}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'design/promo/배경-코드생성'
    os.makedirs(out, exist_ok=True)
    for name, fn in MAKERS.items():
        p = os.path.join(out, f'{name}.png')
        fn().save(p)
        print(f'  ✅ {p}  {N}×{N}  {os.path.getsize(p)//1024}KB')
    print(f'\n📌 색천 조합·풍경(조각보·단풍길)은 **창업자가 그림으로** — 위 주석의 역할 표 참고')
