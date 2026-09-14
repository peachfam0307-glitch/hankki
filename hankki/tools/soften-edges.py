#!/usr/bin/env python3
"""가장자리 계단(각짐) 없애기 — 잘라낸 스티커의 테두리를 부드럽게 되살린다.

왜 만들었나 (창업자 폰 제보 2026-07-30):
  *"프레임뚫린게 지저분하게 잘려서 못쓴다는 의미였어"*
  → 재보니 **알파가 0 아니면 255뿐**이었다. 중간값이 하나도 없어 모든 테두리가 계단이다.
     프레임은 캔버스에서 626px로 크게 쓰는데 원본이 400~500px이라 그 계단이 그대로 보인다.

⚠️ **그냥 흐리게 하면 흰 테가 생긴다.** 잘라낸 PNG는 투명한 곳에도 **흰 배경색(254,254,254)이
   그대로 남아** 있어서, 알파만 부드럽게 하면 그 흰색이 비쳐 나온다.
   → ① 먼저 **색을 바깥으로 번지게** 한다(투명한 픽셀을 가장 가까운 불투명 픽셀 색으로 채움)
     ② 그다음 알파를 흐린 뒤, **50% 등고선이 제자리에 오도록** 커브를 세운다(모양이 굵어지거나 얇아지지 않게)

⚠️ 캔버스 크기는 건드리지 않는다 — `PHOTO_RATIO`(비율)가 그대로여야 저장된 표지가 안 틀어진다.

쓰기:  python3 tools/soften-edges.py            (등록된 스티커 전부 검사·수정)
       python3 tools/soften-edges.py --dry      (고칠 것만 세어보기)
"""
import os
import re
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO = os.path.join(ROOT, 'src/assets/stickers/photo')
DRY = '--dry' in sys.argv

# 등록된 것만 손댄다(재고까지 건드리면 되돌리기 어렵다)
src = open(os.path.join(ROOT, 'src/components/Stickers.jsx'), encoding='utf-8').read()
ids = set()
for m in re.finditer(r'items: \[([^\]]*)\]', src.replace('\n', ' ')):
    ids |= {x.strip().strip("'") for x in m.group(1).split(',') if x.strip()}

SIGMA = 0.9      # 흐림 정도 — 2px 안팎의 부드러운 띠가 생긴다
CONTRAST = 2.3   # 등고선 세우기 — 낮으면 뿌옇고, 높으면 다시 계단이 된다
fixed, skipped = [], 0

for key in sorted(ids):
    fp = os.path.join(PHOTO, f'{key}.png')
    if not os.path.exists(fp):
        continue
    im = Image.open(fp).convert('RGBA')
    a = np.array(im)
    al = a[..., 3]
    # 이미 부드러우면 건너뛴다(두 번 흐리면 뭉갠다)
    if ((al > 15) & (al < 235)).sum() >= al.size * 0.0008:
        skipped += 1
        continue
    op = al > 127
    if not op.any():
        continue
    # ① 색 번지기 — 투명한 곳을 가장 가까운 불투명 픽셀 색으로
    _, idx = ndimage.distance_transform_edt(~op, return_indices=True)
    rgb = a[..., :3][idx[0], idx[1]]
    # ② 알파 안티에일리어싱 — 흐린 뒤 50% 등고선을 제자리에
    soft = ndimage.gaussian_filter(op.astype(float), SIGMA)
    soft = np.clip((soft - 0.5) * CONTRAST + 0.5, 0, 1)
    if not DRY:
        Image.fromarray(np.dstack([rgb, (soft * 255).astype(np.uint8)])).save(fp)
    fixed.append(key)

print(f"{'[미리보기] ' if DRY else ''}각진 테두리 {len(fixed)}컷 부드럽게 · 이미 부드러운 것 {skipped}컷 건너뜀")
if fixed:
    print('  ' + ' '.join(fixed[:20]) + (' …' if len(fixed) > 20 else ''))
