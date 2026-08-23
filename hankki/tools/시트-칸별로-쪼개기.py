# ✂️🔲 시트를 «칸별 낱장»으로 먼저 쪼갠다 — 창업자 2026-08-23
#   📮 창업자 = *"중간에 그릇잘린 컷들 좀 있었거든. (파먹힌 부분들) 검수해줘."*
#
# ⛔⛔ **무슨 일이 났나** — 자른 컷 여럿에 «흰 갈고리»가 붙어 있었다.
#    접시가 파먹힌 게 아니라 **옆 접시의 테두리 조각이 딸려 온 것**이다.
#    🔢 실측 = 그 조각이 흰 다이컷으로 본체와 «이어져» 덩어리가 **1개**로 잡힌다
#       → `--drop`(떨어진 조각 떼기)이 **구조적으로 못 뗀다.**
#    ⛔ `--grid` 도 못 막았다 — 격자는 «묶는» 데 쓰여서 칸 안의 딴 덩어리까지 한 컷으로 묶는다.
#
# ⭐⭐ 그래서 **자르기 «전»에 옆 컷을 물리적으로 없앤다.**
#    ⛔ 격자로 기계적으로 나누면 접시를 자른다(2026-07-30 「격자 금지」와 같은 함정).
#    ✅ **«빈 줄·빈 열»에서만 나눈다** — 그림이 한 픽셀도 없는 자리라 칼이 그림을 못 자른다.
#
# ⛔ `tools/cut.py` 는 한 글자도 안 건드렸다 (창업자 절대원칙 2026-08-18).
#    이건 그 «앞»에 서는 별개 도구다.
#
# 쓰기:  python3 tools/시트-칸별로-쪼개기.py <시트> <낼폴더> <접두어> [행수] [열수]
#
# ⛔⛔ 행·열을 «주는» 이유 — 빈 띠를 전부 칼자리로 쓰면 **접시 «안»의 빈 곳에서도 자른다**
#    (실측 2026-08-23: s14 가 6칸이어야 하는데 9칸으로 쪼개졌다).
#    행·열을 주면 **가장 «넓은» 빈 띠 (n−1)개만** 골라 쓴다 — 칸 사이가 제일 넓기 때문이다.
import os
import sys

import numpy as np
from PIL import Image

BG = 250      # 여기까지가 «그림» (칼과 같은 눈 — 흰 테·옅은 그림자까지)
MINGAP = 6    # 이보다 좁은 빈 띠는 «칸 사이»로 안 본다
MINSIDE = 60  # 이보다 작은 조각은 티끌

src, out, pre = sys.argv[1], sys.argv[2], sys.argv[3]
ROWS = int(sys.argv[4]) if len(sys.argv) > 4 else 0
COLS = int(sys.argv[5]) if len(sys.argv) > 5 else 0
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
a = np.asarray(im)
art = (a.max(axis=2) < BG)


def 빈띠(mask1d):
    """True=그림 있음. 그림이 없는 «연속 구간»(빈 띠)을 [start,end] 로 돌려준다."""
    gaps, s = [], None
    for i, v in enumerate(mask1d):
        if not v and s is None:
            s = i
        elif v and s is not None:
            if i - s >= MINGAP:
                gaps.append((s, i - 1))
            s = None
    if s is not None and len(mask1d) - s >= MINGAP:
        gaps.append((s, len(mask1d) - 1))
    return gaps


def 자르는자리(mask1d, want=0, 두께=None):
    """빈 띠의 «가운데»를 칼자리로 — 양쪽 그림에서 최대한 멀다.
    want>0 이면 **넓은 순으로 want 개만** 고른다(칸 사이가 제일 넓다).

    ⛔ 빈 띠가 모자라면(그릇이 닿아 있다) **그림이 «가장 옅은» 자리**에서 가른다.
       📌 접시를 조금 스칠 수 있지만, 안 가르면 옆 접시가 통째로 딸려 온다 — 그게 더 나쁘다.
       ⚠️ 이 자리는 결과에 찍어서 사람이 볼 수 있게 한다."""
    gs = [(s, e) for s, e in 빈띠(mask1d) if s > 0 and e < len(mask1d) - 1]
    if want > 0:
        gs = sorted(sorted(gs, key=lambda g: -(g[1] - g[0]))[:want])
    자리 = [(s + e) // 2 for s, e in gs]
    if want > 0 and len(자리) < want and 두께 is not None:
        n = len(mask1d)
        칸 = n // (want + 1)
        for k in range(1, want + 1):
            중심 = k * 칸
            if any(abs(중심 - z) < 칸 * 0.5 for z in 자리):
                continue
            lo, hi = max(1, 중심 - int(칸 * 0.35)), min(n - 1, 중심 + int(칸 * 0.35))
            best = lo + int(np.argmin(두께[lo:hi]))
            자리.append(best)
            print(f'   ⚠️ 빈 자리가 없어 «가장 옅은 곳»에서 갈랐다 — {best} (그림 {int(두께[best])}px)')
    return sorted(자리)


rowart = art.any(axis=1)
ys = [0] + 자르는자리(rowart, ROWS - 1 if ROWS else 0, art.sum(axis=1)) + [art.shape[0]]
n = 0
for yi in range(len(ys) - 1):
    y0, y1 = ys[yi], ys[yi + 1]
    band = art[y0:y1]
    if not band.any() or y1 - y0 < MINSIDE:
        continue
    colart = band.any(axis=0)
    xs = [0] + 자르는자리(colart, COLS - 1 if COLS else 0, band.sum(axis=0)) + [art.shape[1]]
    for xi in range(len(xs) - 1):
        x0, x1 = xs[xi], xs[xi + 1]
        cell = art[y0:y1, x0:x1]
        if not cell.any() or x1 - x0 < MINSIDE:
            continue
        n += 1
        Image.fromarray(a[y0:y1, x0:x1]).save(os.path.join(out, f'{pre}{n:02d}.png'))
        print(f'   {pre}{n:02d}  y{y0}~{y1} x{x0}~{x1}  ({x1-x0}x{y1-y0})')
print(f'✅ {os.path.basename(src)} → 칸 {n}개')
