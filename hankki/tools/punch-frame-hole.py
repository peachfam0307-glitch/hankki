#!/usr/bin/env python3
# ⛔⛔ 이 도구는 **더 이상 쓰지 않는다** (2026-07-30 표준화)
#   창업자: *"자르기할때 이 규칙을 최우선으로 적용해."*
#   → 표준 도구 하나로 합쳤다: **`python3 tools/cut.py`**
#   이 파일은 **과거 기록용**으로만 남긴다. 실수로 실행하면 여기서 멈춘다.
#   전문 = `docs/스티커-자르기-표준-2026-07-30.md`
import sys as _sys
if '--force-legacy' not in _sys.argv:
    print('⛔ 옛 컷 도구입니다. 표준 도구를 쓰세요:')
    print('   python3 tools/cut.py <시트.png> <폴더> <접두어> [--frame]')
    print('   (왜 바꿨는지 = docs/스티커-자르기-표준-2026-07-30.md)')
    print('   정말 이걸 써야 하면 --force-legacy 를 붙이세요.')
    _sys.exit(2)


# -*- coding: utf-8 -*-
# 🪟 프레임 안쪽(창) 뚫기 — 창업자 2026-07-30 *"프레임도 꼭 내부도 투명하게"*
#
# ⚠️⚠️ v9.00 사고 방지: 그때 "흰색을 지우는 2차 패스"가 과해서 **돛단배 돛·갈매기 몸통·데이지 꽃잎**
#    같은 **흰 그림**까지 지웠다. 그래서 여기선 **가운데 한 점에서만 번지게**(flood fill) 한다.
#    → 프레임 선에 막혀서 창 밖으로 못 나간다. 그림 속 흰색은 창과 안 이어져 있으니 안 지워진다.
# ⚠️ 안전장치 3개: ①가운데가 흰색·불투명일 때만 시작 ②번진 영역이 전체의 6~92% 일 때만 적용
#    (너무 작으면 창이 아니고, 너무 크면 프레임을 통째로 지우는 것) ③가장자리 1px엔 안 닿아야 함
import numpy as np
from PIL import Image
from scipy import ndimage
import glob, sys

def punch(path, thr=232, sat=18):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int16)
    rgb, al = a[:, :, :3], a[:, :, 3]
    H, W = al.shape
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    whiteish = ((mx - mn) <= sat) & (mn >= thr) & (al > 200)
    cy, cx = H // 2, W // 2
    if not whiteish[cy, cx]:
        # 가운데가 그림이면(예: 창 안에 장식) 조금씩 옮겨 흰 점을 찾는다
        found = False
        for dy in (0, -H // 8, H // 8):
            for dx in (0, -W // 8, W // 8):
                if whiteish[cy + dy, cx + dx]: cy, cx, found = cy + dy, cx + dx, True; break
            if found: break
        if not found: return None
    lbl, _ = ndimage.label(whiteish)
    win = lbl[cy, cx]
    if win == 0: return None
    mask = (lbl == win)
    frac = mask.mean()
    if frac < 0.06 or frac > 0.92: return None                 # 창이 아니다
    if mask[0, :].any() or mask[-1, :].any() or mask[:, 0].any() or mask[:, -1].any(): return None
    out = np.asarray(im).copy()
    out[:, :, 3] = np.where(mask, 0, out[:, :, 3])
    Image.fromarray(out).save(path)
    return round(frac, 3)

pats = sys.argv[1:] or ['docs/stickers/신규-2607-*/낱개-프레임/*.png', 'docs/stickers/신규-2607-여름프레임/낱개/*.png']
done, skip = 0, []
for pat in pats:
    for p in sorted(glob.glob(pat)):
        r = punch(p)
        if r: done += 1
        else: skip.append(p.split('/')[-1])
print('뚫음 %d컷 · 건너뜀 %d컷' % (done, len(skip)))
if skip: print('  건너뛴 것:', ', '.join(skip[:12]))
