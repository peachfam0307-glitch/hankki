#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
배경이 붙은 "씬 컷"을 **띠부씰**로 만든다.

왜 필요한가:
    캠핑·야시장·마트 같은 컷은 하늘·모래·간판이 통째로 그려져 있어서
    배경만 지우려 하면 그림이 부서진다. 그렇다고 그대로 쓰면
    카드 위에 **네모 판이 얹힌 것처럼 겉돈다**(2026-07-29 창업자 지적).

    창업자 해법 = "배경있는건 띠부씰처럼 배경 따라 대충 부드럽게 잘라 쓰면 되지."
    → 배경을 지우는 게 아니라, **배경째로 실루엣을 둥글게 다듬고 흰 테두리**를 두른다.
      그러면 '판'이 아니라 '스티커'로 읽혀서 카드 위에 올려도 자연스럽다.

방법:
    ① 테두리에 닿은 흰 배경만 플러드필로 날린다(그림 안쪽 흰색은 외곽선이 지켜줌).
    ② 남은 실루엣을 **닫기(closing) → 구멍 메우기 → 블러 후 임계값**으로 뭉갠다.
       = 삐죽삐죽한 윤곽(풀잎·반짝임)이 사라지고 손으로 자른 듯 둥글둥글해진다.
       ⚠️ 이 단계가 "대충 부드럽게"의 핵심. 세게 하면 그림이 먹히니 r 로 조절.
    ③ 그 실루엣을 `border`px 부풀려 **흰 테두리**를 만들고 원본을 그 위에 얹는다.

사용법:
    python3 tools/cut-diecut.py <입력.png> <출력.png> [--r 26] [--border 22]
    python3 tools/cut-diecut.py <입력폴더> <출력폴더> [--r 26] [--border 22]
"""
import sys
import os
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage


def silhouette(path, thr=234, sat=14):
    """테두리에 닿은 흰/연회색만 배경으로 본다. 안쪽 흰색(모자·구름)은 보존."""
    im = Image.open(path)
    rgb = np.asarray(im.convert('RGB')).astype(np.int16)
    if im.mode == 'RGBA':
        a = np.asarray(im)[:, :, 3]
        if a.min() < 250:                       # 이미 투명 컷이면 알파를 그대로 쓴다
            return rgb.astype(np.uint8), a > 40
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    cand = ((mx - mn) <= sat) & (mn >= thr)
    lbl, _ = ndimage.label(cand)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) \
        | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    return rgb.astype(np.uint8), ~np.isin(lbl, list(border))


def smooth_mask(mask, r):
    """실루엣을 둥글둥글하게. 작은 돌기·구멍을 없애 '손으로 오린 것'처럼."""
    m = ndimage.binary_closing(mask, ndimage.generate_binary_structure(2, 2), iterations=r)
    m = ndimage.binary_fill_holes(m)
    m = ndimage.gaussian_filter(m.astype(np.float32), r * 0.75) > 0.5   # 모서리 둥글리기
    lbl, n = ndimage.label(m)                                           # 제일 큰 덩어리만
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        m = lbl == (int(np.argmax(sizes)) + 1)
    return m


def diecut(path, out, r=26, border=22):
    rgb, mask = silhouette(path)
    inner = smooth_mask(mask, r)
    ring = ndimage.binary_dilation(inner, ndimage.generate_binary_structure(2, 2), iterations=border)

    h, w = inner.shape
    canvas = np.zeros((h, w, 4), np.uint8)
    canvas[ring] = (255, 253, 248, 255)                 # 흰 테두리(크림 화이트)
    canvas[inner, :3] = rgb[inner]                      # 그림은 안쪽에만
    canvas[inner, 3] = 255
    # 테두리 바깥 1px 계단 죽이기
    alpha = ndimage.gaussian_filter(canvas[:, :, 3].astype(np.float32), 0.7)
    canvas[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    ys, xs = np.where(canvas[:, :, 3] > 8)
    if len(ys) == 0:
        print('  ⚠️ 빈 컷:', path)
        return
    cut = canvas[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    Image.fromarray(cut, 'RGBA').save(out)
    print(f'  ✂️ {os.path.basename(out)}  {cut.shape[1]}×{cut.shape[0]}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--r', type=int, default=26, help='실루엣 뭉개는 정도(클수록 둥글)')
    ap.add_argument('--border', type=int, default=22, help='흰 테두리 두께 px')
    a = ap.parse_args()
    if os.path.isdir(a.src):
        for f in sorted(os.listdir(a.src)):
            if f.lower().endswith('.png'):
                diecut(os.path.join(a.src, f), os.path.join(a.dst, f), a.r, a.border)
    else:
        diecut(a.src, a.dst, a.r, a.border)
