#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
곰곰이/펭펭이 스티커 시트 → 낱개 투명 PNG 자동 오리기.

배경: GPT가 준 시트 17장은 "투명"처럼 보여도 사실 흰색/연회색 배경(RGB)이다.
      rembg(AI) 배경제거는 이 환경 프록시가 막아서 못 씀.
방법: 캐릭터는 진한 외곽선으로 닫혀 있고 배경은 흰색이라,
      "테두리에서 시작하는 흰색 영역만" 투명 처리하면(플러드필)
      흰 셰프모자·앞치마 같은 안쪽 흰색은 외곽선이 막아줘서 그대로 남는다.
      → AI 없이도 깔끔하게 오려짐. 셀별로 제일 큰 덩어리(=캐릭터)만 잘라 저장(번호·글자 자동 제외).

사용법:
    python3 tools/cutout-stickers.py <시트.png> <행수> <열수> <출력폴더>
예:
    python3 tools/cutout-stickers.py docs/stickers/곰/곰-최종-무안테나.png 5 5 out/
    python3 tools/cutout-stickers.py docs/stickers/친구들-전신-2번.png 2 4 out/
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage


def remove_bg(path, thr=234, sat=14):
    """테두리에 붙은 흰/연회색 영역만 투명으로. 안쪽 흰색(모자·옷)은 보존."""
    im = Image.open(path).convert('RGB')
    arr = np.asarray(im).astype(np.int16)
    mn = arr.min(axis=2)
    mx = arr.max(axis=2)
    cand = ((mx - mn) <= sat) & (mn >= thr)      # 저채도 + 밝음 = 배경 후보
    lbl, n = ndimage.label(cand)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) \
           | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    bg = np.isin(lbl, list(border))              # 테두리와 연결된 것만 진짜 배경
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    return np.dstack([arr.astype(np.uint8), alpha])


def slice_grid(rgba, rows, cols, pad=10, min_area=1500):
    """격자로 나누고 셀마다 가장 큰 덩어리(캐릭터)만 크롭. 번호·자막은 자동 제외."""
    H, W, _ = rgba.shape
    ch, cw = H / rows, W / cols
    fg = rgba[:, :, 3] > 40
    out = []
    for r in range(rows):
        for c in range(cols):
            y0, y1, x0, x1 = int(r*ch), int((r+1)*ch), int(c*cw), int((c+1)*cw)
            lbl, n = ndimage.label(fg[y0:y1, x0:x1])
            if n == 0:
                out.append(None); continue
            sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n+1))
            big = int(np.argmax(sizes)) + 1
            if sizes[big-1] < min_area:
                out.append(None); continue
            mask = (lbl == big)
            ys, xs = np.where(mask)
            cell = rgba[y0:y1, x0:x1].copy()
            cell[~mask, 3] = 0                    # 캐릭터 외 나머지 덩어리 투명 처리
            crop = cell[max(0, ys.min()-pad):ys.max()+pad,
                        max(0, xs.min()-pad):xs.max()+pad]
            out.append(crop)
    return out


if __name__ == '__main__':
    path, rows, cols, outdir = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    os.makedirs(outdir, exist_ok=True)
    rgba = remove_bg(path)
    cells = slice_grid(rgba, rows, cols)
    k = 0
    for i, cell in enumerate(cells, 1):
        if cell is None:
            continue
        Image.fromarray(cell).save(os.path.join(outdir, f'{i:02d}.png'))
        k += 1
    print(f'saved {k} stickers to {outdir}')
