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
"""🖼 프레임 시트 전용 컷 — **칸을 통째로** 자른다.

⚠️⚠️ 왜 덩어리(blob) 컷이 프레임엔 안 되나 (2026-07-30 실제 사고):
   원형 화환은 **선이 구슬로 끊겨 있어** 위쪽 반원과 아래쪽이 **별개 덩어리**로 잡힌다.
   그러면 큰 덩어리만 남고 **원의 위쪽 절반이 통째로 사라진다**(`af_04` 스카프 화환에서 실제 발생).
   떨어져 있는 낙엽·잔가지 장식도 같은 이유로 날아간다(`af_07`·`af_11`·`pf_03`·`pf_04`·`pf_11`).

⭐ 프레임 시트는 **한 칸 = 한 프레임**이 확실하다 → 칸으로 나누고 **그 칸 안의 모든 것**을 살린다.
   조각이 몇 개로 나뉘든 상관없다.

사용법: python3 tools/cut-frames-quad.py <시트.png> <행> <열> <출력폴더> <접두어> [시작번호] [thr]
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage


def cut(path, rows, cols, outdir, pre, start=0, thr=238, sat=16, pad=6):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    H, W, _ = a.shape
    mn, mx = a.min(axis=2), a.max(axis=2)
    bg = ((mx - mn) <= sat) & (mn >= thr)
    lbl, _ = ndimage.label(bg)
    border = set(np.unique(lbl[0, :])) | set(np.unique(lbl[-1, :])) | set(np.unique(lbl[:, 0])) | set(np.unique(lbl[:, -1]))
    border.discard(0)
    fg = ~np.isin(lbl, list(border))          # 배경(테두리에서 이어진 흰색)만 뺀 나머지 = 그림
    os.makedirs(outdir, exist_ok=True)
    k = start
    ch, cw = H // rows, W // cols
    for r in range(rows):
        for c in range(cols):
            cell = fg[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
            if cell.sum() < 3000: continue
            ys, xs = np.where(cell)
            y0, y1 = max(0, ys.min() - pad), min(ch, ys.max() + 1 + pad)
            x0, x1 = max(0, xs.min() - pad), min(cw, xs.max() + 1 + pad)
            rgb = np.asarray(im)[r * ch + y0:r * ch + y1, c * cw + x0:c * cw + x1]
            al = np.where(cell[y0:y1, x0:x1], 255, 0).astype(np.uint8)
            k += 1
            Image.fromarray(np.dstack([rgb, al])).save('%s/%s_%02d.png' % (outdir, pre, k))
    print('%-24s %d행%d열 → %d컷' % (os.path.basename(path), rows, cols, k - start))
    return k


if __name__ == '__main__':
    p, r, c, o, pre = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
    s = int(sys.argv[6]) if len(sys.argv) > 6 else 0
    t = int(sys.argv[7]) if len(sys.argv) > 7 else 238
    cut(p, r, c, o, pre, s, t)
