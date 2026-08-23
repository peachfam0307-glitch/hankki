# 🕳🕳 「그릇이 파먹혔나」 전수 검사 — 창업자 2026-08-23
#   📮 창업자 = *"중간에 그릇잘린 컷들 좀 있었거든. (파먹힌 부분들) 검수해줘."*
#
# ⛔⛔ **`check-cutouts` 가 이걸 «못 잡는다» — 보는 것이 다르다.**
#    그 게이트는 「가장자리에 닿았나(잘림)」·「떨어진 조각」·「계단」을 본다.
#    파먹힘은 **여백 «안»에서 일어나고**, 흰 다이컷이 조각을 본체에 이어 붙여서
#    「떨어진 조각」으로도 안 잡힌다. 그래서 **초록불인 채로 지나간다.**
#    📌 규칙 18 ⓘ 그대로 — 「통과했나」가 아니라 «무엇을 보고 통과했나».
#
# ⭐⭐ 잣대 = **본체를 깎았다 다시 부풀리면(opening) «가는 것»만 사라진다.**
#    남은 것 = 접시 둘레에 호(弧)로 남은 얇은 띠 = 파먹힌 자국.
#    ⛔ 「떨어졌나」로 재지 않는다 — 흰 다이컷이 이어 붙여서 안 떨어져 있다.
#
# ＋ 「두 컷이 한 장에 붙었나」도 같이 본다 — 가로세로 비가 1.5 를 넘으면 의심.
#
# 쓰기:  python3 scripts/_검사-파먹힘-0823.py <낱개폴더>
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

folder = sys.argv[1] if len(sys.argv) > 1 else 'docs/stickers/음식아이콘-창업자-2026-08-23/낱개'
A = 60          # 이보다 진한 알파를 「그림」으로 본다
R = 7           # 깎았다 부풀리는 반지름 — 이보다 가는 것은 «가는 것»이다
경보 = 0.012    # 가는 조각이 본체의 1.2% 를 넘으면 파먹힘으로 본다
붙음 = 1.5      # 가로세로 비가 이보다 크면 두 컷이 붙었다

ball = np.zeros((2 * R + 1, 2 * R + 1), bool)
yy, xx = np.ogrid[-R:R + 1, -R:R + 1]
ball[yy * yy + xx * xx <= R * R] = True

rows = []
for f in sorted(glob.glob(os.path.join(folder, '*.png'))):
    im = Image.open(f).convert('RGBA')
    a = np.asarray(im)[:, :, 3]
    m = a > A
    if not m.any():
        continue
    core = ndimage.binary_opening(m, structure=ball)      # 가는 것이 사라진 «본체»
    thin = m & ~ndimage.binary_dilation(core, structure=ball)
    tot = int(m.sum())
    r = int(thin.sum()) / max(tot, 1)
    ar = im.width / im.height
    rows.append((os.path.basename(f)[:-4], r, ar, im.size))

rows.sort(key=lambda t: -t[1])
파 = [t for t in rows if t[1] >= 경보]
붙 = [t for t in rows if t[2] >= 붙음 or t[2] <= 1 / 붙음]

print(f'📐 {len(rows)}컷 검사 (알파>{A} · 반지름 {R} · 경보 {경보:.1%})\n')
print(f'🕳 파먹힘 의심 — {len(파)}컷')
for n, r, ar, sz in 파:
    print(f'   {n}  가는조각 {r:.1%}  ({sz[0]}x{sz[1]})')
if not 파:
    print('   없다')
print(f'\n🔗 두 컷이 붙은 것 — {len(붙)}컷')
for n, r, ar, sz in 붙:
    print(f'   {n}  가로/세로 {ar:.2f}  ({sz[0]}x{sz[1]})')
if not 붙:
    print('   없다')
print('\n📊 가는조각 비율 상위 12')
for n, r, ar, sz in rows[:12]:
    print(f'   {n}  {r:.2%}')
sys.exit(1 if 파 or 붙 else 0)
