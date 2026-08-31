# 🧽🧽 자른 «뒤» 길잡이 선을 흰색으로 지운다 — 마지막 단계 (2026-08-23)
#
# 📮 창업자 = *"쥐가 파먹고갔나봐"* · *"선이 심하게 삐뚤한거 아냐?"* · *"왼손으로 그린 것 같은데"*
#
# ⭐⭐ 왜 이 단계가 필요한가 = **선은 진해야 하고, 진하면 보인다.**
#    · 선을 «거의 흰색»(248)으로 그려 봤더니 `cut.py` 가 반쯤 배경으로 봐서 **접시를 11.1% 다시 먹었다**
#    · 선을 진하게(210) 그리면 **잃음 0.0%** 인데 회색 테가 눈에 남는다
#    ✅ 그래서 «진하게 그려서 자르고, 다 자른 뒤에 색만 흰색으로» 되돌린다.
#      알파(모양)는 이미 정해졌으므로 색을 바꿔도 **접시가 다시 뜯기지 않는다.**
#
# ⛔ 음식 «속»의 회색은 절대 안 건드린다 — 컷 «바깥 가장자리 띠» 안에서만 지운다.
#
# 쓰기:  python3 tools/컷-길잡이선-지우기.py <컷폴더> [선색=210] [띠=14]
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

폴더 = sys.argv[1]
선색 = int(sys.argv[2]) if len(sys.argv) > 2 else 210
띠폭 = int(sys.argv[3]) if len(sys.argv) > 3 else 14
너그럽게 = 34          # 안티에일리어싱으로 선색 언저리가 번진다
무채 = 26              # R·G·B 가 이만큼 안쪽이면 「회색」 = 우리가 그린 선

바뀜 = 0
for f in sorted(glob.glob(os.path.join(폴더, '*.png'))):
    im = Image.open(f).convert('RGBA')
    a = np.asarray(im).copy()
    알파 = a[:, :, 3]
    보임 = 알파 > 0
    if not 보임.any():
        continue
    안쪽 = ndimage.binary_erosion(보임, np.ones((3, 3), bool), iterations=띠폭)
    띠 = 보임 & ~안쪽
    rgb = a[:, :, :3].astype(int)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    선 = 띠 & (mx - mn <= 무채) & (np.abs(mx - 선색) <= 너그럽게)
    if not 선.any():
        continue
    a[선, 0:3] = 255
    Image.fromarray(a).save(f)
    바뀜 += 1
    print(f'   {os.path.basename(f)} — 선 {int(선.sum())}px 지움')
print(f'✅ {바뀜}컷에서 길잡이 선 지움 (알파는 안 건드림 = 접시 그대로)')
