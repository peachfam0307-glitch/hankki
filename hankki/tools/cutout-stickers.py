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
    fg = ~bg
    # 가장자리 옅은 흰 테 제거(디프린지): 바깥 2px 깎고 살짝 부드럽게 → 어두운 배경서도 깔끔.
    fg = ndimage.binary_erosion(fg, iterations=2)
    alpha = ndimage.gaussian_filter(np.where(fg, 255.0, 0.0), 0.8)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
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


def cut_lineart(path, rows=None, cols=None, pad=16, min_frac=0.004):
    """선화(라인아트) 전용: 속이 흰색이라 색채움 방식이 깨짐.
    ① 선을 두껍게(dilate) '벽'으로 세워 흰 배경이 안쪽으로 못 새게 막고
    ② 새어든 속은 구멍 메우기(fill_holes)로 채우고 (펭귄 얼굴 등 투명방지)
    ③ 격자 대신 '캐릭터 덩어리(연결요소)'별로 크롭 → 칸 경계에서 소품 잘림 방지.
    rows/cols는 무시(덩어리 자동 검출). 반환 순서 = 위→아래, 왼→오른."""
    im = Image.open(path).convert('RGB')
    arr = np.asarray(im).astype(np.int16)
    mn = arr.min(axis=2)
    barrier = ndimage.binary_dilation(mn < 205, iterations=8)
    cand = (mn >= 232) & ~barrier
    lbl, n = ndimage.label(cand)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) \
           | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    fg = ndimage.binary_fill_holes(~np.isin(lbl, list(border)))
    fg = ndimage.binary_erosion(fg, iterations=1)
    alpha = np.clip(ndimage.gaussian_filter(np.where(fg, 255.0, 0.0), 0.8), 0, 255).astype(np.uint8)
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    H, W = fg.shape
    clbl, cn = ndimage.label(ndimage.binary_dilation(fg, iterations=4))
    boxes = []
    for i in range(1, cn + 1):
        ys, xs = np.where(clbl == i)
        if len(ys) < min_frac * H * W:
            continue
        boxes.append((ys.min(), ys.max(), xs.min(), xs.max()))
    boxes.sort(key=lambda b: b[0] + b[1])
    rowsg, cur, last = [], [], None
    for b in boxes:
        cy = (b[0] + b[1]) // 2
        if last is None or cy - last < 0.18 * H:
            cur.append(b)
        else:
            rowsg.append(cur); cur = [b]
        last = cy
    if cur:
        rowsg.append(cur)
    out = []
    for row in rowsg:
        for (y0, y1, x0, x1) in sorted(row, key=lambda b: b[2] + b[3]):
            out.append(rgba[max(0, y0-pad):min(H, y1+pad), max(0, x0-pad):min(W, x1+pad)])
    return out


if __name__ == '__main__':
    # 사용법: ... <시트> <행> <열> <출력폴더> [--line]
    #   --line = 선화(속 흰색) 시트일 때. 기본은 색채움 시트.
    args = [a for a in sys.argv[1:] if a != '--line']
    lineart = '--line' in sys.argv
    path, rows, cols, outdir = args[0], int(args[1]), int(args[2]), args[3]
    os.makedirs(outdir, exist_ok=True)
    if lineart:
        cells = cut_lineart(path, rows, cols)
    else:
        rgba = remove_bg(path)
        cells = slice_grid(rgba, rows, cols)
    k = 0
    for i, cell in enumerate(cells, 1):
        if cell is None:
            continue
        Image.fromarray(cell).save(os.path.join(outdir, f'{i:02d}.png'))
        k += 1
    print(f'saved {k} stickers to {outdir}')
