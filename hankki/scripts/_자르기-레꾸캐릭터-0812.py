# -*- coding: utf-8 -*-
"""🐻🐧 레꾸 캐릭터 시트 — **칸을 하나씩** 잘라 「칸 = 컷 16개」를 못 박는다 (2026-08-12)

⛔⛔ 왜 이렇게 하나 — 통째로 `cut.py` 에 넣었더니 **15컷**이 나왔다.
   「별점 높음」과 「별점 최고」가 **서로 닿아 한 덩어리**로 잡혔기 때문이다.
   `--grid 4x4` 로도 안 된다 — 격자 모드는 «덩어리를 칸에 배정»할 뿐이라
   **이미 한 덩어리가 된 둘을 못 가른다.** 창업자 확인 = *"둘다 16컷이야"*.
   📌 CLAUDE.md 핀 그대로 — *"칸을 하나씩 잘라야 「칸 = 컷」이 보장된다"*.
   ⭐ **칸을 «먼저» 크롭하면 칼이 아니라 «칸 경계»가 둘을 가른다.**

⭐ 그리고 이 방식이 **글자(캡션)까지 같이 가져온다** — 칸 안엔 「그림 ＋ 그 아래 캡션」만 있다.
   창업자 *"직관적이지 않는 것도 있어서 글자를 넣어도 될 것 같긴한데.."*
   → **두 판을 «둘 다» 만든다.** `글자있음/`(칸 통째) · `글자없음/`(캡션 띠 위만)

⚠️⚠️ **격자는 «균일하지 않다». 재서 넣었다** (규칙 18 — 짐작 말고 잰다)
   1024×1536 을 4로 나누면 384 인데, 시트A 1줄 그림이 **58~385** 라 경계를 넘는다.
   그대로 4×4 로 자르면 **1줄 캡션이 2줄 칸으로 넘어간다.**
   실측(잉크 없는 가로 띠) →
     시트A 줄 경계 = 449 · 815 · 1152   (⭐3줄은 캡션이 그림에 «붙어» 빈 띠가 없다)
     시트B 줄 경계 = 432 · 780 · 1121   (⭐4줄이 붙어 있다)

⭐ 알파 만드는 법은 **`tools/cut.py` 표준을 그대로** 쓴다 — 새로 짜지 않는다.
   ⚠️⚠️ 특히 **「흰색 되돌리기는 바깥 테두리 띠에서만」** 이 핵심이다.
      그림 전체에 적용하면 **셰프모자·흰 앞치마가 통째로 비친다**(흰 그림도 흰색이다).
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

WHITE = 246          # cut.py 와 같은 값
CORE_ERODE = 7       # cut.py 와 같은 값 — 속살은 이만큼 안쪽에서
PAD = 14
JOIN = 9             # 칸 안에서 떨어진 조각(김·하트·별)을 한 컷으로 묶는다

# 📐 실측값 (위 주석 참조). 줄 경계 y — 맨 위 0, 맨 아래는 높이.
줄경계 = {
    '시트A': [0, 449, 815, 1152, 1536],
    '시트B': [0, 432, 780, 1121, 1536],
}


def 칸경계(a, y0, y1, 칸수=4):
    """줄 안에서 «잉크가 가장 적은 x」를 찾아 칸을 나눈다.
       ⛔ 1024/4 = 256 으로 못 박으면 팔·냄비가 옆 칸에 걸린 곳에서 잘린다."""
    prof = (a[y0:y1] < WHITE).sum(axis=0)
    W = a.shape[1]
    out = [0]
    for k in range(1, 칸수):
        nom = round(W * k / 칸수)
        lo, hi = max(0, nom - 46), min(W, nom + 46)
        out.append(lo + int(np.argmin(prof[lo:hi])))
    out.append(W)
    return out


def 캡션y(a, y0, y1):
    """줄 «맨 아래»의 글자 띠가 시작되기 «전» y 를 돌려준다(글자없음 판의 자를 자리).

    ⛔⛔ **한 줄씩 「비었나」로 훑으면 안 된다** — 2026-08-12 실제로 틀렸다.
       시트A 1줄 캡션 안에 **잉크 15 이하인 줄이 «한 줄»**(y=429) 끼어 있어서
       거기서 캡션이 끊긴 것으로 읽혀 **「띠 1px」** 이 나왔다(캡션을 통째로 놓쳤다).
       ⭐ **글자는 획이라 가로줄 하나쯤은 얼마든지 비어 있다.**
       → **5px 미만의 빈 줄은 «빈 줄이 아니다»** 로 보고 메운 뒤 띠를 나눈다.
    """
    prof = (a[y0:y1] < WHITE).sum(axis=1).astype(float)
    thr = max(3.0, prof.max() * 0.02)      # ⚠️ 0 이 아니다 — 붙은 줄은 잉크가 2~7 남는다
    있음 = ndimage.binary_closing(prof > thr, np.ones(7))
    lab, n = ndimage.label(있음)
    if n < 2:
        return None, 0
    띠 = [np.where(lab == i)[0] for i in range(1, n + 1)]
    캡션, 그림 = 띠[-1], 띠[-2]
    높이 = 캡션[-1] - 캡션[0] + 1
    if not (18 <= 높이 <= 70):             # 캡션이 아니면 자르지 않는다(그림을 깎으면 안 된다)
        return None, 높이
    return y0 + (그림[-1] + 캡션[0]) // 2, 높이


def 알파로(sub, capY=None):
    """cut.py 표준 ②③ — 알파를 «판정»이 아니라 «계산»으로 되돌린다.

    ⚠️⚠️ **흰색 되돌리기도, 속살 색도 «바깥 테두리 7px 띠»에서만.**
       2026-08-12 실제로 틀렸다 — 속살 색(`base`)을 **그림 전체**에 칠했더니
       진갈색 외곽선·볼터치·눈이 통째로 뭉개져 **납작한 색면**이 됐다(진한 판이 잡았다).
       cut.py 303~304줄 = `out_rgb = sub.copy()` ＋ `out_rgb[band] = base[band]`.

    ⭐ **글자(캡션) 자리는 「묶지도 채우지도」 않는다** — 획 사이 흰 종이가 판이 되면 안 된다.
       `capY` 아래는 잉크를 1px 부풀린 것만 쓴다. 그러면 획이 통째로 «띠»가 되어
       알파가 계산으로 나오고, 속살도 **글자 자신의 색**이라 글자색이 안 바뀐다.
    """
    h = sub.shape[0]
    mn = sub.min(axis=2)
    art = mn < WHITE
    if art.sum() < 300:
        return None
    cy = h if capY is None else max(0, min(h, capY))
    reg = np.zeros_like(art)
    reg[:cy] = ndimage.binary_fill_holes(ndimage.binary_closing(art[:cy], np.ones((JOIN, JOIN))))
    if cy < h:
        reg[cy:] = ndimage.binary_dilation(art[cy:], np.ones((3, 3)))
    # 먼지(옆 칸에서 넘어온 부스러기) 털기 — ⚠️캡션 획이 안 털리게 문턱을 낮게
    lab, n = ndimage.label(reg)
    if n > 1:
        sz = ndimage.sum(reg, lab, range(1, n + 1))
        reg = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 40])
    ys, xs = np.where(reg)
    if len(ys) == 0:
        return None
    y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, h)
    x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, reg.shape[1])
    reg, sub, cy = reg[y0:y1, x0:x1], sub[y0:y1, x0:x1], cy - y0

    솔리드 = reg & (sub.min(axis=2) < WHITE - 12)
    core = ndimage.binary_erosion(솔리드, np.ones((CORE_ERODE, CORE_ERODE)))
    if 0 <= cy < core.shape[0]:
        core[cy:] = 솔리드[cy:]          # ⭐글자는 침식하면 통째로 사라진다 — 획 자체가 속살
    if core.sum() < 20:
        core = 솔리드
    if core.sum() < 5:
        return None
    _, ci = ndimage.distance_transform_edt(~core, return_indices=True)
    base = sub[ci[0], ci[1]]
    gap = 255.0 - base
    ch = np.argmax(gap, axis=2)
    ii, jj = np.indices(ch.shape)
    mix = np.clip((255.0 - sub[ii, jj, ch]) / np.maximum(gap[ii, jj, ch], 1), 0, 1)

    band = reg & ~ndimage.binary_erosion(reg, np.ones((7, 7)))
    alpha = np.where(reg, 1.0, 0.0)
    alpha[band] = np.minimum(alpha[band], mix[band])
    alpha[~reg] = 0

    out_rgb = sub.copy()
    out_rgb[band] = base[band]           # 띠에 남은 흰 기운만 속살 색으로 (cut.py 304줄)

    # ✂️✂️ **띠부씰 흰 테두리** — `cut.py --diecut` 표준을 그대로 옮겼다(306~401줄).
    #   ⛔⛔ **2026-08-12 에 이 단계를 통째로 빠뜨렸다.** 창업자가 폰에서 잡았다 —
    #      *"꼬르곰 펭펭 테두리가 잘렸어. 우리이거 띠부실스타일로 얇게 자르기로하지 않았어?"*
    #      CLAUDE.md 핀에 **「자를 때 최우선 = `--diecut`」** 이라고 박혀 있는데 내 자체 스크립트에 안 넣었다.
    #   ⭐ 흰 테는 «스타일»이 아니라 **보호막**이다 — 흰 배경에서 자를 때 진갈색 외곽선이 파먹히는 걸 막는다.
    #      그래서 증상이 「테두리가 잘렸다」로 나온다.
    #   🔢 두께 = **기존 99컷(`rs_*`)을 재서 맞췄다** — 흰 테 중앙값 **2.0px · 긴변 328px = 0.61%**.
    #      같은 서랍에 나란히 놓이니 «같은 마감»이라야 한다. 새 컷 긴변 ~348px → 2px.
    #   ⭐ 칼선은 「부풀리기」가 아니라 **거리밭 등고선** — 부풀리면 요철을 따라가 너덜너덜해진다.
    #   ⚠️⚠️ **`d` 는 「원하는 두께」가 아니다** — 거리밭을 흐리면 등고선이 안으로 밀려 «1px 얇게» 나온다.
    #      실측(2026-08-12) d 2→1.0px · **d 3→2.0px** · d 4→3.0px · d 5→4.1px.
    #      → 목표 2.0px 이니 **d = 3**. 컷마다 긴변이 230~397 로 다르지만 «두께는 고정»한다 —
    #        서랍에 나란히 놓이니 두께가 들쭉날쭉하면 한 세트로 안 보인다(기존 99컷도 전부 2.0px).
    d = 3
    ink = ndimage.binary_fill_holes(ndimage.binary_closing(sub.min(axis=2) < 200, np.ones((7, 7))))
    solid = (ink | (sub.min(axis=2) < WHITE - 10)) & reg
    solid = ndimage.binary_fill_holes(ndimage.binary_closing(solid, np.ones((5, 5))))
    if solid.sum() < 50:
        solid = reg                       # 못 찾으면 원래대로(안전) — cut.py 353줄과 같은 이유
    dist = ndimage.distance_transform_edt(~solid)
    # ⚠️ 부드러움은 «두께»가 아니라 «그림 크기»를 따른다 — 얇게 한다고 흐림까지 약해지면 실루엣이 너덜해진다.
    dist = ndimage.gaussian_filter(dist, sigma=max(1.8, max(reg.shape) * 0.007))
    cut_a = np.clip((d + 0.6 - dist) / 1.4, 0.0, 1.0)
    # ⭐ 발밑 그림자는 살린다 — 흰색은 «원래 아무것도 없던 자리»에만 칠한다(cut.py 393~401줄).
    soft = (~solid) & (alpha > 0.06)
    alpha = np.where(solid, 1.0, np.maximum(cut_a, alpha))
    out_rgb[(~solid) & (cut_a > 0) & (~soft)] = 255.0

    # ⚠️ 가장자리에 닿으면 투명 여백을 덧댄다 — 테를 두르면 그만큼 밖으로 나간다(cut.py 438줄).
    out = np.dstack([out_rgb, alpha * 255]).astype(np.uint8)
    if max(out[0, :, 3].max(), out[-1, :, 3].max(), out[:, 0, 3].max(), out[:, -1, 3].max()) > 25:
        out = np.pad(out, ((PAD, PAD), (PAD, PAD), (0, 0)), constant_values=0)
    return Image.fromarray(out, 'RGBA')


# ⛔⛔ **「캡션만 키우기」 안은 «실측으로» 죽었다 (2026-08-12) — 되살리지 말 것.**
#   🔢 왜 만들려 했나 = 새 컷 캡션이 이미 앱에 있는 99컷보다 «작다» (실측):
#        기존 `rs_g01` 컷 309×326 · 글자 48px → 폰에서 **11.1px**
#        새   `rv01`   컷 275×348 · 글자 35px → 폰에서 **7.6px**   ← 32% 작다
#   ⛔ 그런데 캡션을 1.33배로 키우니 **컷 자체가 348 → 372 로 커졌고**,
#      앱은 «긴변»을 238px 에 맞추므로 결국 **폰에서 6.5px 로 더 작아졌다.**
#   📌 **한 컷 안에서 글자를 키우면 그림 몫이 줄 뿐, 총량은 안 는다** — 공짜가 없다.
#      진짜 손잡이는 두 개뿐: ⒜시트를 뽑을 때 글자를 크게 ⒝앱에서 이 키들의 기본 크기(s)를 키우기.
#   (＋ 35px 글자를 늘리면 흐려진다 — 해상도 규칙에도 어긋난다)


def main():
    시트, 낼폴더, 접두 = sys.argv[1], sys.argv[2], sys.argv[3]
    이름 = os.path.splitext(os.path.basename(시트))[0]
    im = Image.open(시트).convert('RGB')
    rgb = np.asarray(im).astype(float)
    a = rgb.min(2)
    rows = 줄경계[이름]
    for d in ('글자있음', '글자없음'):
        os.makedirs(os.path.join(낼폴더, d), exist_ok=True)

    n, 만든것 = 0, []
    for r in range(4):
        y0, y1 = rows[r], rows[r + 1]
        cols = 칸경계(a, y0, y1)
        cy, capH = 캡션y(a, y0, y1)
        print(f'  ▦ {r+1}줄  y {y0}~{y1}  칸 {cols}  캡션위 {cy} (띠 {capH}px)')
        for c in range(4):
            n += 1
            키 = f'{접두}{n:02d}'
            x0, x1 = cols[c], cols[c + 1]
            a1 = 알파로(rgb[y0:y1, x0:x1].copy(), capY=(cy - y0) if cy else None)
            if a1 is None:
                print(f'   ⚠️ {키} — 칸이 비었다')
                continue
            a1.save(os.path.join(낼폴더, '글자있음', f'{키}.png'))
            a2 = 알파로(rgb[y0:cy, x0:x1].copy()) if cy else None
            if a2 is not None:
                a2.save(os.path.join(낼폴더, '글자없음', f'{키}.png'))
            만든것.append(키)
            print(f'   ✅ {키}  글자있음 {a1.size}  글자없음 {a2.size if a2 else "-"}')
    print(f'\n📦 {이름} → {len(만든것)}컷 (칸 {n}개)')
    if len(만든것) != 16:
        print(f'⛔⛔ 16컷이 아니다 — 창업자 확인값과 다르다. 격자를 다시 재라.')
        sys.exit(1)


main()
