#!/usr/bin/env python3
# ⛔⛔ 이 도구는 **더 이상 쓰지 않는다** (2026-07-30 표준화)
#   창업자: *"자르기할때 이 규칙을 최우선으로 적용해."*
#   → 표준 도구 하나로 합쳤다: **`python3 tools/cut.py`**
#   이 파일은 **과거 기록용**으로만 남긴다. 실수로 실행하면 여기서 멈춘다.
#   전문 = `docs/스티커-자르기-표준-2026-07-30.md`
import sys as _sys
if '--force-legacy' not in _sys.argv:
    print('⛔ 옛 컷 도구입니다. 표준 도구를 쓰세요:')
    print('   python3 tools/cut.py <시트.png> <폴더> <접두어> [--frame]')
    print('   (왜 바꿨는지 = docs/스티커-자르기-표준-2026-07-30.md)')
    print('   정말 이걸 써야 하면 --force-legacy 를 붙이세요.')
    _sys.exit(2)


# -*- coding: utf-8 -*-
# 스트립형 시트 — 격자가 아니라 **덩어리(blob)별**로 자른다.
# ⚠️ 스트립의 연회색 배경 판이 아이템을 잇는다 → 문턱(thr)을 낮춰 그 판까지 배경으로 잡는다.
import numpy as np
from PIL import Image
from scipy import ndimage
import os, sys

def cut(path, outdir, pre, thr=224, sat=26, min_area=2600, start=0):
    im = Image.open(path).convert('RGB')
    arr = np.asarray(im).astype(np.int16)
    mn, mx = arr.min(axis=2), arr.max(axis=2)
    cand = ((mx - mn) <= sat) & (mn >= thr)          # 흰~연회색 = 배경 후보
    lbl, _ = ndimage.label(cand)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    fg = ~np.isin(lbl, list(border))
    # 아이템 덩어리 찾기
    l2, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, l2, range(1, n + 1))
    os.makedirs(outdir, exist_ok=True)
    k = start
    kept, drop = 0, 0
    for i in range(1, n + 1):
        if sizes[i - 1] < min_area: drop += 1; continue
        ys, xs = np.where(l2 == i)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        if (y1 - y0) < 40 or (x1 - x0) < 40: drop += 1; continue
        m = (l2[y0:y1, x0:x1] == i)
        rgb = np.asarray(im)[y0:y1, x0:x1]
        a = np.where(m, 255, 0).astype(np.uint8)
        k += 1
        Image.fromarray(np.dstack([rgb, a])).save('%s/%s_%02d.png' % (outdir, pre, k))
        kept += 1
    print('%-26s → %2d컷 (작은 조각 %d개 버림)' % (os.path.basename(path), kept, drop))
    return k

B = 'docs/stickers/신규-2607-핼러윈유료팩/'
os.system('rm -f %s낱개-종이/*.png' % B)
cut(B + '원본시트/핼러윈-1-종이라벨.png', B + '낱개-종이', 'hp')
