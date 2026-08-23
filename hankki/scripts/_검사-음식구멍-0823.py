# 🕳🕳 「음식 «안»에 구멍이 뚫렸나」 전수 검사 — 창업자 2026-08-23
#   📮 창업자 = *"너무 심각하다 ㅠㅠ"* — 음식 한가운데가 흰색으로 파인 컷들
#
# ⛔⛔ **`check-cutouts` 도 `_검사-파먹힘` 도 이걸 못 잡는다**
#    · `check-cutouts` = 가장자리 잘림·떨어진 조각·계단을 본다 → 안쪽 구멍은 안 본다
#    · `_검사-파먹힘`   = 밖으로 «삐져나온 가는 것»을 본다 → 안쪽으로 «파인 것»은 반대다
#    📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나».
#
# ⭐⭐ 잣대 = **알파 마스크의 «구멍»**(fill_holes 로 채운 것 − 원래 마스크).
#    접시 안에 알파 0 인 자리가 있으면 그게 파먹힌 구멍이다.
#
# 🔢 왜 생겼나 = 크림·흰밥·하이라이트는 밝기 250 이상이라 「그림이 아닌 것」으로 잡힌다.
#    그래서 접시 한가운데인데도 배경 취급이 됐다.
#
# 쓰기:  python3 scripts/_검사-음식구멍-0823.py <낱개폴더>
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

folder = sys.argv[1] if len(sys.argv) > 1 else 'docs/stickers/음식아이콘-창업자-2026-08-23/낱개'
A = 60
경보 = 0.005      # 구멍이 컷 넓이의 0.5% 를 넘으면 눈에 띈다
작은구멍 = 40     # 이보다 작은 구멍은 티끌(안티에일리어싱)

rows = []
for f in sorted(glob.glob(os.path.join(folder, '*.png'))):
    a = np.asarray(Image.open(f).convert('RGBA'))[:, :, 3]
    m = a > A
    if not m.any():
        continue
    filled = ndimage.binary_fill_holes(m)
    hole = filled & ~m
    if hole.any():
        lab, k = ndimage.label(hole)
        if k:
            sz = ndimage.sum(hole, lab, range(1, k + 1))
            hole = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 작은구멍])
    r = hole.sum() / max(m.sum(), 1)
    rows.append((os.path.basename(f)[:-4], r, int(hole.sum())))

rows.sort(key=lambda t: -t[1])
나쁜 = [t for t in rows if t[1] >= 경보]
print(f'📐 {len(rows)}컷 검사 (구멍이 {경보:.1%} 넘으면 경보)\n')
print(f'🕳 음식이 파인 컷 — {len(나쁜)}컷')
for n, r, px in 나쁜:
    print(f'   {n}  구멍 {r:.2%}  ({px}px)')
if not 나쁜:
    print('   없다')
print('\n📊 상위 10')
for n, r, px in rows[:10]:
    print(f'   {n}  {r:.3%}')
sys.exit(1 if 나쁜 else 0)
