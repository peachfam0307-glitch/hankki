# 🪝 자른 컷에서 «흰 갈고리»를 뗀다 — 창업자 2026-08-23
#   📮 창업자 = *"중간에 그릇잘린 컷들 좀 있었거든. (파먹힌 부분들) 검수해줘."*
#
# ⛔⛔ **무엇이었나 (실측으로 닫았다)**
#    ⑴ 원본 칸을 확대해 보니 **갈고리가 «없다»** — 접시가 깨끗한 원이다
#    ⑵ 자른 뒤에 «생긴다» → **자르기가 만든 것**이다
#    ⑶ 뿌리 = 접시 옆 «아주 옅은 그림자»가 알파에 살짝 살아남고,
#       그 위에 **흰 다이컷이 둘러져** 흰 호(弧)가 됐다
#    ⛔ 옆 컷 탓이 아니다 — **칸별로 갈라 잘라도 값이 한 자리도 안 바뀌었다**(1.25% 그대로)
#
# ⛔ 못 쓰는 길 둘 (실측으로 죽었다)
#    · `--drop` = 갈고리가 다이컷으로 본체와 «이어져» 덩어리가 1개다 → 구조적으로 못 뗀다
#    · `--grid` = 격자는 «묶는» 데 쓰여서 칸 안 딴 덩어리까지 한 컷으로 묶는다
#
# ⭐⭐ 그래서 «자른 뒤»에 뗀다 — **깎았다 부풀리면(opening) 가는 것만 사라진다.**
#    본체 ＋ 본체에 붙은 다이컷 테는 살리고, 그보다 멀리 떨어진 가는 호만 지운다.
#    ⛔ `tools/cut.py` 는 한 글자도 안 건드렸다(창업자 절대원칙 2026-08-18).
#
# 쓰기:  python3 tools/컷-가는조각-떼기.py <폴더> [--r 7] [--dry]
import argparse
import glob
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('folder')
ap.add_argument('--r', type=int, default=14, help='이보다 가는 것은 «가는 것»이다')
# 🔢 왜 14 인가 (n10_03 실측) — R 을 키우며 core 덩어리 수를 셌다
#    R=7·10 → 1덩어리(접시와 갈고리가 아직 붙어 있다)
#    R=14   → **2덩어리** = 접시(98,560px) ＋ 갈고리  ← 여기서 갈린다
#    R=22   → 다시 1덩어리(접시 테까지 깎여 6.2% 가 «가는 것»이 된다 = 너무 깎았다)
#    ⭐ 그래서 «갈리는 가장 작은 값»을 쓴다.
ap.add_argument('--pad', type=int, default=6, help='본체 둘레 이만큼은 살린다(다이컷 흰 테)')
ap.add_argument('--min', type=float, default=0.001, help='이 비율 미만이면 손대지 않는다')
ap.add_argument('--dry', action='store_true')
a = ap.parse_args()


def ball(r):
    m = np.zeros((2 * r + 1, 2 * r + 1), bool)
    yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
    m[yy * yy + xx * xx <= r * r] = True
    return m


B, K = ball(a.r), ball(a.r + a.pad)
고침 = 0
for f in sorted(glob.glob(os.path.join(a.folder, '*.png'))):
    im = Image.open(f).convert('RGBA')
    arr = np.asarray(im).copy()
    al = arr[:, :, 3]
    m = al > 60
    if not m.any():
        continue
    core = ndimage.binary_opening(m, structure=B)
    if not core.any():
        continue
    # ⭐⭐ 깎고 나면 접시와 갈고리가 «따로» 떨어진다 → **가장 큰 것만** 본체로 삼는다.
    #    ⛔ 이걸 안 하면 갈고리도 core 에 남아 그대로 살아난다(첫 판이 그랬다 · R=7).
    lab, k = ndimage.label(core)
    if k > 1:
        sz = ndimage.sum(core, lab, range(1, k + 1))
        core = lab == (int(np.argmax(sz)) + 1)
    keep = ndimage.binary_dilation(core, structure=K)
    thin = m & ~keep
    r = thin.sum() / max(m.sum(), 1)
    if r < a.min:
        continue
    # ⭐ 알파만 0 으로 — 색은 안 건드린다(다시 살릴 여지를 남긴다)
    지울 = ndimage.binary_dilation(thin, structure=ball(2)) & ~keep
    n = os.path.basename(f)[:-4]
    print(f'   {n}  가는조각 {r:.2%} → {int(지울.sum())}px 뗀다')
    if not a.dry:
        arr[:, :, 3] = np.where(지울, 0, al)
        Image.fromarray(arr).save(f)
    고침 += 1
print(f'✅ {고침}컷 {"찾았다(--dry)" if a.dry else "고쳤다"}')
