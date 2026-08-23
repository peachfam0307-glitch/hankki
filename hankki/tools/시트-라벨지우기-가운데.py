# 🏷 라벨 지우개 ② — 「글자가 접시 그림자와 «이어져» 있을 때」 (2026-08-23 신설)
#
# ⛔ 표준 도구(`시트-라벨지우기.py`)는 «빈 줄로 끊어» 띠를 찾는다.
#    사진 톤 시트는 접시 아래 드롭섀도가 라벨까지 «끊기지 않고» 이어져서
#    그림+라벨이 한 띠가 되고, 그 띠는 두꺼워서(>MAXH) 「그림」으로 판정돼 통과한다.
#    🔢 실측(s12 칸1) = y380~468 사이 잉크가 한 번도 0이 안 된다.
#
# ⭐⭐ 그래서 «다른 잣대»를 쓴다 — **글자는 칸 «가운데»에 좁게 모이고 접시는 칸 폭을 넓게 쓴다.**
#    한 줄의 잉크가 «거의 전부» 가운데 64% 안에 있고 양도 적으면 그 줄은 글자다.
#    📌 새 잣대를 발명한 게 아니라 «보는 축»을 세로 → 가로로 바꿨다.
#
# 🔒 안전장치 = 라벨 위로 «그림이 0인 줄»까지만 물러난다. 그림을 한 픽셀도 안 먹는다(찍어서 보여준다).
#
# 쓰기:  python3 tools/시트-라벨지우기-가운데.py <시트> <낼파일> <행수> <열수>
import sys

import numpy as np
from PIL import Image

BG_MAX = 250     # 여기까지가 «그림» — 흰 테·옅은 그림자까지(칼과 같은 눈)
INK_MAX = 235    # 여기까지가 «잉크» — 글자를 찾을 때만
MID = 0.18       # 양옆 18% 를 뺀 «가운데 64%»
PURE = 0.97      # 잉크가 이 비율 이상 가운데에 있으면 글자다
MAXINK = 120     # 한 줄 잉크가 이보다 많으면 그림이다

src, dst = sys.argv[1], sys.argv[2]
rowsN = int(sys.argv[3]) if len(sys.argv) > 3 else 2
colsN = int(sys.argv[4]) if len(sys.argv) > 4 else 3

im = Image.open(src).convert('RGB')
a = np.asarray(im).copy()
H, W = a.shape[:2]
art0 = (a.max(axis=2) < BG_MAX)
ink = (a.max(axis=2) < INK_MAX)
rs, cs = H // rowsN, W // colsN
찾음 = 0
for r in range(rowsN):
    for c in range(colsN):
        y0, y1 = r * rs, (H if r == rowsN - 1 else (r + 1) * rs)
        x0, x1 = c * cs, (W if c == colsN - 1 else (c + 1) * cs)
        h = y1 - y0
        m0, m1 = x0 + int((x1 - x0) * MID), x1 - int((x1 - x0) * MID)
        cw = ink[y0:y1, x0:x1].sum(axis=1)
        cm = ink[y0:y1, m0:m1].sum(axis=1)
        후보 = [y for y in range(int(h * 0.6), h)
                if cw[y] > 8 and cm[y] >= cw[y] * PURE and cw[y] < MAXINK]
        if not 후보:
            print(f'   칸({r+1},{c+1}) 라벨 없음')
            continue
        top = min(후보)
        artrow = art0[y0:y1, x0:x1].sum(axis=1)
        cut = top
        for y in range(top, max(int(h * 0.5), top - 80), -1):
            if artrow[y] == 0:
                cut = y
                break
        먹 = int(artrow[cut:top].sum())
        a[y0 + cut:y1, x0:x1] = 255
        찾음 += 1
        print(f'   칸({r+1},{c+1}) 라벨 {top}~{max(후보)} → {cut}부터 지움 · 그 사이 그림 {먹}px')

after = (a.max(axis=2) < BG_MAX)
# ⭐ 「지운 픽셀」이 아니라 «라벨 위 그림을 먹었나»를 본다 — 라벨 아래는 원래 빈 자리다
print(f'✅ {dst} — 라벨 {찾음}개 지움 ({rowsN}행 × {colsN}열)')
Image.fromarray(a).save(dst)
