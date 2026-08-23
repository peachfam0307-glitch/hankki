# 🌫 칸에서 «접시 바깥의 옅은 그림자»를 민다 — 자르기 «전» 단계 (창업자 2026-08-23)
#   📮 창업자 = *"중간에 그릇잘린 컷들 좀 있었거든. (파먹힌 부분들) 검수해줘."*
#
# ⛔⛔ **무엇이 갈고리를 만들었나 — 실측으로 닫았다**
#    ⑴ 원본 칸을 확대하니 갈고리가 **없다**(접시가 깨끗한 원) → 자르기가 만든 것
#    ⑵ 칸 밝기 분포(c10_03) = **245~250 이 17,129px** — 접시 옆에 아주 옅은 그림자가 퍼져 있다
#    ⑶ `cut.py` 는 밝기 <250 을 «그림»으로 본다 → 그 그림자가 알파로 살아남고
#       가장자리 «색 되돌리기»가 그걸 **흰색**으로 만들고 그 위에 다이컷이 둘러져 → **흰 갈고리**
#
# ⛔ 못 쓰는 길 셋 (전부 실측으로 죽었다)
#    · `--drop`  = 갈고리가 다이컷으로 본체와 이어져 덩어리가 1개다
#    · `--grid`  = 격자는 «묶는» 데 쓰여 칸 안 딴 덩어리까지 한 컷으로 묶는다
#    · 자른 «뒤» 떼기 = 갈고리가 반쯤 남고 **접시까지 먹었다**(n10_03 오른쪽이 잘렸다)
#
# ⭐⭐ 그래서 **자르기 «전»에** 민다 — 이때는 다이컷이 아직 없어 접시와 그림자가 깨끗이 갈린다.
#    ⛔ `tools/cut.py` 는 한 글자도 안 건드렸다(창업자 절대원칙 2026-08-18).
#
# 🔒 안전장치 = **접시는 «가장 큰 덩어리»라 절대 안 지운다.** 미는 건 그 바깥뿐이고,
#    지운 넓이를 컷마다 찍어서 사람이 볼 수 있게 한다.
#
# 쓰기:  python3 tools/칸-바깥그림자-지우기.py <칸폴더> [--r 14] [--pad 6] [--dry]
import argparse
import glob
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('folder')
ap.add_argument('--bg', type=int, default=250, help='여기까지가 «그림» — cut.py 와 같은 눈')
ap.add_argument('--r', type=int, default=14, help='이보다 가늘게 이어진 것은 «딴 것»이다')
ap.add_argument('--pad', type=int, default=6, help='본체 둘레 이만큼은 남긴다')
ap.add_argument('--keep-ratio', type=float, default=0.12,
                help='가장 큰 것의 이 비율 이상이면 «그것도 그릇»이다 (cut.py --drop 과 같은 잣대)')
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
    im = Image.open(f).convert('RGB')
    arr = np.asarray(im).copy()
    m = arr.max(axis=2) < a.bg
    if not m.any():
        continue
    core = ndimage.binary_opening(m, structure=B)
    if not core.any():
        continue
    # ⛔⛔ **「가장 큰 것 하나만」이면 안 된다** — 한 칸에 그릇이 둘이면 작은 쪽을 통째로 지운다.
    #    🔢 2026-08-23 실측 = 그렇게 했다가 76 → 71컷으로 **5컷이 사라졌다.**
    # ✅ `--drop` 과 «같은 잣대» = 가장 큰 것의 12% 이상이면 그것도 그릇이다.
    lab, k = ndimage.label(core)
    if k > 1:
        sz = ndimage.sum(core, lab, range(1, k + 1))
        큰 = max(sz)
        살릴 = [i + 1 for i, s in enumerate(sz) if s >= 큰 * a.keep_ratio]
        core = np.isin(lab, 살릴)
    keep = ndimage.binary_dilation(core, structure=K)
    지울 = m & ~keep
    if not 지울.any():
        continue
    n = os.path.basename(f)[:-4]
    print(f'   {n}  바깥 그림자 {int(지울.sum())}px ({지울.sum()/m.sum():.2%})')
    if not a.dry:
        arr[지울] = 255
        Image.fromarray(arr).save(f)
    고침 += 1
print(f'✅ {고침}칸 {"찾았다(--dry)" if a.dry else "밀었다"}')
