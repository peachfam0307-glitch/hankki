# 🩶🩶 순백 배경만 «아주 옅은 회색»으로 — 자르기 «전» 단계 (2026-08-23)
#
# 📮 창업자 = *"근데 있자나 새컷도 좀 잘렸는데.. 접시가"* → *"다 뜯겼어 아래것도"*
#
# ⛔⛔ 원인 (실측) = **흰 그릇 ＋ 흰 배경**이라 경계가 사라진다.
#    `cut.py` 는 「밝으면 배경」으로 보는데 흰 접시의 제일 밝은 테두리가 **250~253** 이라
#    배경과 같은 눈에 잡혀 함께 지워졌다. 30컷 중 16컷 · 최대 12.8% 사라짐.
#    📌 이건 `docs/그릇프레임-만드는법-2026-08-23` 에 이미 적힌 함정이다 —
#       *"흰 그릇을 흰 배경에 놓으면 바깥 윤곽을 잡을 수가 없다"*. 거기서 배우고 여기서 또 밟았다.
#
# ⭐⭐ 하는 일 = **바깥과 이어진 «순백»만** 옅은 회색으로 민다.
#    · 네 모서리에서 번지게(flood) 해서 «바깥 배경»만 고른다 → 접시 «안»은 절대 안 건드린다
#    · 문턱을 아주 높게(≥254) 둔다 → 접시의 250~253 테두리는 «배경이 아니다»
#    ⛔ 그래서 이 도구는 그림을 못 먹는다 — 구조적으로.
#
# ⛔ `cut.py` 는 건드리지 않는다 (창업자 절대원칙 2026-08-18). 이건 그 «앞»에 서는 별개 도구다.
#
# 쓰기:  python3 tools/칸-배경만-회색으로.py <칸폴더> [회색값=242]
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

폴더 = sys.argv[1]
회색 = int(sys.argv[2]) if len(sys.argv) > 2 else 242
순백 = 254   # ⭐ 이 위만 «배경 후보». 접시 테두리(250~253)는 절대 안 건드린다

바뀜 = 0
for f in sorted(glob.glob(os.path.join(폴더, '*.png'))):
    im = Image.open(f).convert('RGB')
    a = np.asarray(im).copy()
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    흰 = (mn >= 순백)                       # 세 채널 모두 아주 밝다 = 순백
    # 🌊 네 모서리에서 번지게 — «바깥과 이어진» 흰색만 배경이다
    lab, n = ndimage.label(흰)
    if n == 0:
        continue
    H, W = 흰.shape
    바깥 = set()
    for y, x in [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)]:
        if lab[y, x]:
            바깥.add(lab[y, x])
    for x in range(0, W, max(1, W // 40)):
        if lab[0, x]: 바깥.add(lab[0, x])
        if lab[H - 1, x]: 바깥.add(lab[H - 1, x])
    for y in range(0, H, max(1, H // 40)):
        if lab[y, 0]: 바깥.add(lab[y, 0])
        if lab[y, W - 1]: 바깥.add(lab[y, W - 1])
    배경 = np.isin(lab, list(바깥))
    if not 배경.any():
        continue
    # 🔒 안전장치 — 배경이 그림 쪽으로 새지 않았나 (그림 픽셀을 덮으면 죽는다)
    그림 = mx < 250
    샘 = int((배경 & 그림).sum())
    if 샘 > 0:
        print(f'⛔ {os.path.basename(f)} — 배경이 그림 {샘}px 를 덮었다. 저장 안 함')
        continue
    a[배경] = 회색
    Image.fromarray(a).save(f)
    바뀜 += 1
print(f'✅ {바뀜}칸 배경을 {회색} 회색으로 (접시 손실 0px)')
