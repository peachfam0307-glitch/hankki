#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✂️➡️🩹 자른 «뒤»에 손보는 도구 — `tools/cut.py` 가 낸 낱개 PNG 를 받아서 두 가지를 고친다.

⛔⛔ **`tools/cut.py` 는 손대지 않는다** (창업자 확정 2026-08-18 — *"자르기도구는 건드리지마."*)
   그래서 자르기가 못 푸는 것은 **자른 «뒤»에** 여기서 푼다. 자르기 규칙·게이트는 그대로 산다.

━━━━━━━━━━━━ ① --fill : 속이 뚫린 컷 되살리기 ━━━━━━━━━━━━

📮 창업자 2026-08-20 = *"302는 투명이네 글자쓰는 내부가. 확인해줘."* — **맞았다.**
   실측 = 새 메모지 16컷 중 `pn302` **하나만** 안쪽이 **99.9% 투명**. 원본 시트엔 크림색이 꽉 차 있다.

⭐ 왜 그 컷만 뚫렸나 = 테두리가 **물결(scallop) 「선」**이고 그 선이 가늘다.
   자르기는 「배경 = 밝음」으로 덩어리를 잡는데, 선의 골에서 안팎이 이어져 **속까지 배경으로 봤다.**
   ⛔ `--diecut` 을 바꿔도 안 풀린다(5 로 다시 잘라도 100% 투명). 판정 자체가 그렇게 난다.

✅ 푸는 법 = **닫힘(closing) → 구멍 채우기**로 「선으로 둘러싸인 안쪽」을 잡고,
   거기에 **원본 시트의 «깨끗한 종이 조각»을 타일로** 깐다.
   ⛔ 원본 사분면을 통째로 겹치면 **원본 테두리 선이 안쪽에 옅게 비친다**(2026-08-20 에 실제로 그랬다).
      → 반드시 «장식이 없는 한가운데» 조각만 뗀다.
   ⛔ 단색으로 채우면 다른 컷은 종이 질감(표준편차 4~9)이 있는데 이것만 매끈해 튄다.

━━━━━━━━━━━━ ② --tint : 흰 테를 「종이색」으로 ━━━━━━━━━━━━

📮 창업자 2026-08-20 = *"빨간색 마테 위에 가로로 긴 흰색선이생겼잖아."* · *"16장이 다그래 똑같은 위치에"*
   실측 = 16장 **전부** 위 3~9% · 아래 91~96% 에 가로 흰 줄. **원본 시트엔 없다.**
   정체 = 우리가 두른 **다이컷 흰 테**. 종이·마테 윗변이 수평이라 «가로로 긴 직선»으로 보인다.

⛔⛔ **흰 테를 빼는 건 «못 한다»** — `--diecut 0` 으로 자르면 자르기 게이트가 죽인다:
      🚫 절대원칙 위반 — 진갈색 외곽선을 파먹었다.  12935px → 10849px (83.9%)
   **흰 테는 장식이 아니라 「외곽선이 파먹히는 걸 막는 보호막」이다**(창업자 절대원칙 ⓪).
   `--diecut 2` 도 규칙 하한(0.35%) 밖이라 한 컷도 안 나온다. **지금 3~4px 이 이미 최소다.**

✅ 그래서 **두께가 아니라 «색»을 바꾼다** — 흰 테를 그 컷의 종이색으로.
   · 종이 윤곽에선 종이와 이어져 안 보인다
   · 마테 위에선 크림 선이 되어 **흰색보다 훨씬 덜 튄다**(마테가 «떠 있는 조각»으로 안 보인다)
   · **외곽선 보호는 그대로다** — 테는 그 자리에 있고 색만 바뀐다

⛔ 바꿀 자리를 «가장자리 6px 이내»로 묶는다 — 안 그러면 **종이 «안쪽»의 흰 부분까지 물든다**
   (흰 그림도 흰색이다 — `docs/스티커-자르기-표준-2026-07-30.md` 가 같은 함정을 이미 적어뒀다).

━━━━━━━━━━━━ 쓰는 법 ━━━━━━━━━━━━

  python3 tools/자른뒤-다듬기.py <낱개폴더> <낼폴더> [--fill 시트.png:사분면] [--tint]

  --fill 시트.png:tl|tr|bl|br   속이 뚫린 컷을 그 시트 사분면의 종이 질감으로 채운다
                                (여러 번 줄 수 있다 · 뚫린 컷에만 적용된다)
  --tint                        흰 테를 종이색으로 바꾼다
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

가장자리띠 = 6      # 흰 테를 물들일 범위 — 이보다 안쪽은 안 건드린다(그림의 흰색 보호)
뚫림기준 = 0.5      # 안쪽 40% 영역이 이 비율 넘게 투명하면 「뚫렸다」
닫힘 = 6            # 선 사이 틈을 메우는 크기


def 안쪽뚫렸나(a):
    h, w, _ = a.shape
    inner = a[int(h * .3):int(h * .7), int(w * .3):int(w * .7), 3]
    return (inner < 128).mean() > 뚫림기준


def 속채우기(a, 타일):
    """선으로 둘러싸인 안쪽을 원본 종이 질감으로."""
    h, w, _ = a.shape
    op = a[:, :, 3] > 128
    m = ndimage.binary_fill_holes(ndimage.binary_closing(op, structure=np.ones((닫힘, 닫힘))))
    fill = m & ~op
    if not fill.any():
        return a, 0
    th, tw, _ = 타일.shape
    ys, xs = np.mgrid[0:h, 0:w]
    src = 타일[ys % th, xs % tw]
    for c in range(3):
        a[:, :, c] = np.where(fill, src[:, :, c], a[:, :, c])
    a[:, :, 3] = np.where(fill, 255, a[:, :, 3])
    return a, int(fill.sum())


def 테색바꾸기(a):
    """바깥 가장자리의 흰 테만 그 컷의 종이색으로."""
    h, w, _ = a.shape
    op = a[:, :, 3] > 200
    inner = a[int(h * .35):int(h * .65), int(w * .35):int(w * .65)]
    m = inner[:, :, 3] > 200
    if m.sum() < 50:
        return a, 0
    paper = np.median(inner[:, :, :3][m], axis=0)
    ring = ndimage.binary_dilation(~op, iterations=가장자리띠) & op
    white = (a[:, :, 0] > 244) & (a[:, :, 1] > 244) & (a[:, :, 2] > 244)
    tgt = ring & white
    for c in range(3):
        a[:, :, c] = np.where(tgt, paper[c], a[:, :, c])
    return a, int(tgt.sum())


def 타일뽑기(스펙):
    """'시트.png:tr' → 그 사분면 «한가운데»의 깨끗한 종이 조각."""
    경로, _, 사분면 = 스펙.rpartition(':')
    sh = Image.open(경로).convert('RGB')
    W, H = sh.size
    x0 = W // 2 if 사분면 in ('tr', 'br') else 0
    y0 = H // 2 if 사분면 in ('bl', 'br') else 0
    q = sh.crop((x0, y0, x0 + W // 2, y0 + H // 2))
    # ⛔ 사분면을 통째로 쓰면 테두리 선이 비친다 — 한가운데 200px 만
    cw, ch = q.size
    return np.array(q.crop((cw // 2 - 100, ch // 2 - 100, cw // 2 + 100, ch // 2 + 100))).astype(int)


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)
    src, dst = args[0], args[1]
    타일들, tint = [], False
    i = 2
    while i < len(args):
        if args[i] == '--fill':
            타일들.append(타일뽑기(args[i + 1])); i += 2
        elif args[i] == '--tint':
            tint = True; i += 1
        else:
            i += 1
    os.makedirs(dst, exist_ok=True)
    채움 = 물듦 = 0
    for f in sorted(os.listdir(src)):
        if not f.endswith('.png'):
            continue
        a = np.array(Image.open(os.path.join(src, f)).convert('RGBA')).astype(int)
        if 타일들 and 안쪽뚫렸나(a):
            for t in 타일들:
                a, n = 속채우기(a, t)
                if n:
                    채움 += 1
                    print(f'  🩹 {f} — 속 {n:,}px 채움')
                    break
        if tint:
            a, n = 테색바꾸기(a)
            if n:
                물듦 += 1
        Image.fromarray(a.astype('uint8')).save(os.path.join(dst, f))
    print(f'✅ {dst} — 속 채운 컷 {채움} · 테색 바꾼 컷 {물듦}')


if __name__ == '__main__':
    main()
