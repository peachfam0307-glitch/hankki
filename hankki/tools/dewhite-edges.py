#!/usr/bin/env python3
"""흰 테 없애기 — 흰 배경에서 자른 그림의 **가장자리 흰 기운**을 걷어낸다.

왜 (창업자 폰 제보 2026-07-30):
  *"프레임은 아직 지저분해 흰선이 보임. 어떻할까 투명으로 자르는게 생각보다 어렵네.."*

원인 (실측):
  흰 시트에서 자를 때 **가장자리 픽셀은 이미 흰색과 섞여 있다**(안티에일리어싱).
  옛 컷은 그걸 **불투명으로 통째로 굳혀** 놨고(알파 0/255), 내가 그 밝은 색을 바깥으로
  퍼뜨려 부드럽게 만들었더니 **밝은 테가 더 넓어졌다.**
  `pf_f05` 실측 — 반투명 띠 (219,205,223) vs 속살 (195,170,201). 확실히 밝다.

고치는 원리 — **흰색과 섞인 걸 되돌린다(unpremultiply from white).**
  보이는색 = 원래색 × α + 255 × (1−α)  →  α = (255 − 보이는색) / (255 − 원래색)
  '원래색' 은 **속살(안쪽으로 몇 px 들어간 진짜 그림 색)** 에서 가져온다.
  결과: 색은 속살 색으로, 알파는 흰색에 섞인 만큼만 → **흰 테가 사라지고 테두리가 매끈해진다.**

⚠️ 원래 색이 흰색에 가까우면 나눗셈이 폭발한다(흰 다이컷 테두리·흰 판) → 그런 픽셀은 손대지 않는다.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = '--fix' in sys.argv
TARGETS = [a for a in sys.argv[1:] if not a.startswith('--')]


def dewhite(fp):
    im = Image.open(fp).convert('RGBA')
    a = np.array(im).astype(float)
    al = a[..., 3]
    vis = al > 8
    if not vis.any():
        return None
    rgb = a[..., :3]

    # 속살 = 안쪽으로 3px 들어간 곳 = 흰색이 안 섞인 진짜 그림 색
    core = ndimage.binary_erosion(al > 200, np.ones((7, 7)))
    if core.sum() < 30:
        return None
    _, idx = ndimage.distance_transform_edt(~core, return_indices=True)
    art = rgb[idx[0], idx[1]]                      # 각 픽셀의 '원래색' 추정

    gap = 255.0 - art
    solid = gap.max(axis=2) >= 25                  # 원래색이 흰색에 가까우면 손대지 않는다
    # α = (255 − 보이는색) / (255 − 원래색) — 채널 중 가장 신뢰도 높은(간격 큰) 채널로
    ch = np.argmax(gap, axis=2)
    ii, jj = np.indices(ch.shape)
    newa = np.clip((255.0 - rgb[ii, jj, ch]) / np.maximum(gap[ii, jj, ch], 1), 0, 1) * 255.0

    out = a.copy()
    touch = solid & vis
    out[..., :3][touch] = art[touch]
    # 원래 알파보다 커지지는 않게(모양이 굵어지면 안 된다)
    out[..., 3][touch] = np.minimum(newa[touch], al[touch])
    changed = float(np.abs(out[..., 3][touch] - al[touch]).mean()) if touch.any() else 0.0
    if FIX:
        Image.fromarray(out.astype(np.uint8)).save(fp)
    return changed


files = [os.path.join(ROOT, t) for t in TARGETS] if TARGETS else []
if not files:
    print('대상 파일을 지정하세요 (예: src/assets/stickers/photo/pf_f01.png)')
    sys.exit(1)
for fp in files:
    d = dewhite(fp)
    if d is None:
        print(f'– {os.path.relpath(fp, ROOT)} 건너뜀(속살 부족)')
    else:
        print(f"{'✂️' if FIX else '⚠️'} {os.path.relpath(fp, ROOT)} — 알파 평균 {d:.1f} 변화")
