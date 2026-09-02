#!/usr/bin/env python3
"""자른 스티커의 사고 2종을 찾아 지운다 — 잡조각 · 테두리 색 번짐.

왜 (창업자 폰 제보 2026-07-30):
  *"온보드 꼬르곰펭펭 잘린면에 빨강선보여 큰일날뻔.. 수박먹는것도 조각 있어. 하트곰도 조각.."*

두 가지 사고가 섞여 있었다:
  ① **잡조각** — 옆 그림이 딸려 들어와 **본체와 떨어진 작은 덩어리**로 남는다.
  ② **테두리 색 번짐** — 다이컷 흰 테두리 **안쪽에 옆 그림 색이 묻어** 들어온다.
     ⚠️ 이건 본체와 **이어져 있어서 덩어리 검사로는 절대 안 잡힌다.**
     `gp_duoht`(온보딩 첫 화면)이 그 경우였다 — 흰 테두리에 빨간 줄 4개.
     → **알파 경계 안쪽 띠에서 채도가 튀는 픽셀**을 찾아 흰색으로 되돌린다.

⛔ 지우면 안 되는 것 = 반짝이·하트처럼 **일부러 떨어뜨린 장식**. 통통해서(20px+) 잡조각 기준에 안 걸린다.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = '--fix' in sys.argv
TARGETS = [a for a in sys.argv[1:] if not a.startswith('--')]


def clean(fp):
    im = Image.open(fp).convert('RGBA')
    a = np.array(im).astype(int)
    al = a[..., 3] > 40
    if not al.any():
        return None
    rgb = a[..., :3]
    notes = []

    # ② 테두리 색 번짐 — **다이컷 흰 테두리가 있는 그림에서만.**
    #    ⚠️ 처음엔 띠를 22px로 넓게 잡고 조건 없이 지웠다가 **곰 몸통·장바구니를 흰색으로 덮어버렸다**
    #    (`gom_shop`에서 21,381px, `ob_naeng`에서 35,963px). → 두 겹으로 좁혔다:
    #      · 띠를 얇게(짧은 변의 3%, 최대 12px)
    #      · **그 띠의 80% 이상이 거의 흰색일 때만** 다이컷으로 보고 손댄다.
    #        색이 테두리까지 꽉 찬 그림(장바구니·냉면)은 여기서 걸러져 아예 안 건드린다.
    k = max(3, min(12, round(min(al.shape) * 0.03)))
    band = al & ~ndimage.binary_erosion(al, np.ones((k * 2 + 1, k * 2 + 1)))
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    whiteish = band & (sat < 0.12) & (mx > 200)
    is_diecut = band.sum() > 0 and whiteish.sum() / band.sum() >= 0.80
    bleed = (band & (sat > 0.30) & (mx > 120)) if is_diecut else np.zeros_like(band)
    lab, n = ndimage.label(bleed)
    if n:
        sizes = ndimage.sum(bleed, lab, range(1, n + 1))
        keep = np.zeros_like(bleed)
        for i in range(1, n + 1):
            if sizes[i - 1] >= 15:
                keep |= (lab == i)
        if keep.any():
            # 주변 흰 테두리 색으로 되돌린다(가장 가까운 '띠 안의 흰 픽셀')
            white = whiteish & ~keep
            if white.any():
                _, idx = ndimage.distance_transform_edt(~white, return_indices=True)
                a[..., :3][keep] = a[..., :3][idx[0], idx[1]][keep]
                notes.append(f'테두리 색번짐 {int(keep.sum())}px')

    # ① 잡조각 — 본체와 떨어진 작은 덩어리 중 '가장자리에 닿았거나 가늘고 긴 것'
    lab2, n2 = ndimage.label(al)
    if n2 > 1:
        sizes = ndimage.sum(al, lab2, range(1, n2 + 1))
        main = int(np.argmax(sizes)) + 1
        h, w = al.shape
        drop = np.zeros_like(al)
        for i in range(1, n2 + 1):
            if i == main or sizes[i - 1] < 12 or sizes[i - 1] > sizes.max() * 0.10:
                continue
            m = lab2 == i
            ys, xs = np.where(m)
            touches = m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()
            thin = min(xs.max() - xs.min(), ys.max() - ys.min()) + 1 <= max(4, round(min(h, w) * 0.03))
            if touches or thin:
                drop |= m
        if drop.any():
            a[..., 3][drop] = 0
            notes.append(f'잡조각 {int(drop.sum())}px')

    if notes and FIX:
        Image.fromarray(a.astype(np.uint8)).save(fp)
    return notes


files = [os.path.join(ROOT, t) for t in TARGETS] if TARGETS else [
    os.path.join(dp, f) for dp, _, fs in os.walk(os.path.join(ROOT, 'src/assets'))
    for f in sorted(fs) if f.endswith('.png')
]
hit = 0
for fp in files:
    notes = clean(fp)
    if notes:
        hit += 1
        print(f"{'✂️' if FIX else '⚠️'} {os.path.relpath(fp, ROOT)} — {' · '.join(notes)}")
print(f"\n{'고친' if FIX else '찾은'} 파일 {hit}개" + ('' if FIX else ' — 고치려면 --fix'))
