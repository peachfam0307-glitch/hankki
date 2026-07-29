#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""프레임 시트(4×2=8종) → 낱개 투명 PNG.

⚠️ 스티커 컷 도구(`cutout-stickers.py`)와 다른 점 두 가지:
  ① **이미 투명한 RGBA 시트**가 섞여 있다(창업자가 투명배경으로 재생성해 줌).
     그런 시트에 flood-fill 을 다시 돌리면 멀쩡한 알파를 망가뜨린다 → 알파를 그대로 쓴다.
  ② 프레임은 **속이 비어 있어** 안쪽까지 배경으로 판정되기 쉽다.
     테두리에서 연결된 것만 배경으로 보므로(플러드필) 속 크림색·흰 종이는 살아남는다.

사용법: python3 tools/cut-frames.py <시트.png> <출력폴더> [행] [열]
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage


def to_rgba(path, thr=234, sat=14):
    """RGBA(투명 있음)면 알파 그대로, RGB면 테두리 흰색만 투명 처리."""
    im = Image.open(path)
    if im.mode == 'RGBA':
        a = np.asarray(im)
        if a[:, :, 3].min() < 250:          # 진짜 투명이 있다
            return a.copy()
    arr = np.asarray(im.convert('RGB')).astype(np.int16)
    mn, mx = arr.min(axis=2), arr.max(axis=2)
    cand = ((mx - mn) <= sat) & (mn >= thr)
    lbl, _ = ndimage.label(cand)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) \
        | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    fg = ~np.isin(lbl, list(border))
    alpha = np.where(fg, 255, 0).astype(np.uint8)
    return np.dstack([arr.astype(np.uint8), alpha])


def cut(path, outdir, rows=2, cols=4, pad=16, min_frac=0.004):
    rgba = to_rgba(path)
    H, W, _ = rgba.shape
    ch, cw = H / rows, W / cols
    fg = rgba[:, :, 3] > 40
    # 프레임은 얇은 선이라 조각날 수 있다 → 살짝 부풀려 한 덩어리로 묶고, 크롭은 원본 마스크로.
    lbl, n = ndimage.label(ndimage.binary_dilation(fg, iterations=6))
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    cy, cx = np.array(ndimage.center_of_mass(fg, lbl, range(1, n + 1))).T
    keep = [i for i in range(n) if sizes[i] >= min_frac * H * W]

    cells = {}
    for i in keep:
        k = min(rows - 1, max(0, int(cy[i] // ch))) * cols + min(cols - 1, max(0, int(cx[i] // cw)))
        cells.setdefault(k, []).append(i)

    os.makedirs(outdir, exist_ok=True)
    saved, bad = 0, 0
    for k in sorted(cells):
        mask = np.isin(lbl, [i + 1 for i in cells[k]]) & fg
        ys, xs = np.where(mask)
        if len(ys) == 0:
            continue
        cutimg = rgba.copy()
        cutimg[~mask, 3] = 0
        y0 = max(0, ys.min() - pad); y1 = min(H, ys.max() + 1 + pad)
        x0 = max(0, xs.min() - pad); x1 = min(W, xs.max() + 1 + pad)
        saved += 1
        p = os.path.join(outdir, f'{saved:02d}.png')
        Image.fromarray(cutimg[y0:y1, x0:x1]).save(p)
        a = np.array(Image.open(p).convert('RGBA'))[:, :, 3]
        if (a[0, :] >= 200).any() or (a[-1, :] >= 200).any() or (a[:, 0] >= 200).any() or (a[:, -1] >= 200).any():
            bad += 1
            print(f'   ! 잘림 {os.path.basename(p)}')
    print(f'{os.path.basename(path)}: {saved}컷 / 잘림 {bad}')
    return saved


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    r = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    c = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    cut(src, out, r, c)
