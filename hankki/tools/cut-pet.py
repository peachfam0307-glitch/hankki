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
# 🫧 PET 스티커 컷 — **반투명 필름 테두리를 살린다.** (창업자 2026-07-30 *"PET스타일이라 투명하고 반딱거려, 꼭 살려야 해"*)
#
# ⚠️⚠️ 왜 보통 방식이 안 되나: 배경이 252~254, **필름 테두리도 250~254**라 밝기로 못 가른다.
#    그래서 흰 배경을 지우면 **필름까지 통째로 지워진다**(실제로 그렇게 돼서 PET 느낌이 다 날아갔다).
# ⭐ 그래서 반대로 간다: **그림을 찾아 바깥으로 필름 두께만큼 넓힌다(dilation).**
#    ① 진한 색(외곽선·채색) = 확실한 그림 ② 구멍 메우기 → 흰 유령 몸통처럼 **외곽선으로 닫힌 흰색**도 포함
#    ③ 넓히기 → 그림을 두른 필름 띠가 들어온다 ④ 그 영역만 남긴다
import numpy as np
from PIL import Image
from scipy import ndimage
import os, glob, sys

def cut_pet(path, outdir, pre, film=34, art_thr=232, min_area=12000, start=0):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    mn = a.min(axis=2)
    art = mn < art_thr                                  # ① 진한 색 = 그림
    art = ndimage.binary_closing(art, np.ones((5, 5)))
    art = ndimage.binary_fill_holes(art)                # ② 외곽선 안쪽(흰 유령 몸통 등)
    lbl, n = ndimage.label(art)
    sizes = ndimage.sum(art, lbl, range(1, n + 1))
    os.makedirs(outdir, exist_ok=True)
    k = start
    for i in np.argsort(-sizes) + 1:
        if sizes[i - 1] < min_area: continue
        m = (lbl == i)
        m = ndimage.binary_dilation(m, ndimage.generate_binary_structure(2, 2), iterations=film)  # ③ 필름 띠
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        mm = m[y0:y1, x0:x1]
        rgb = np.asarray(im)[y0:y1, x0:x1]
        k += 1
        Image.fromarray(np.dstack([rgb, np.where(mm, 255, 0).astype(np.uint8)])).save('%s/%s_%02d.png' % (outdir, pre, k))
    print('%-24s → %d컷' % (os.path.basename(path), k - start))
    return k

B = 'docs/stickers/신규-2607-핼러윈유료팩/'
os.system('rm -f %s낱개-씰/*.png' % B)
k = cut_pet(B + '원본시트/핼러윈-2-띠부씰.png', B + '낱개-씰', 'hs')
cut_pet(B + '원본시트/핼러윈-6-띠부씰.png', B + '낱개-씰', 'hs', start=k)

# 마테·종이·프레임도 같은 PET 처리 — 이 팩은 전부 PET 스타일이다
os.system('rm -f %s낱개-마테/*.png %s낱개-종이/*.png' % (B, B))
k = cut_pet(B + '원본시트/핼러윈-3-마테.png', B + '낱개-마테', 'ht', film=22, min_area=20000)
cut_pet(B + '원본시트/핼러윈-4-마테.png', B + '낱개-마테', 'ht', film=22, min_area=20000, start=k)
cut_pet(B + '원본시트/핼러윈-1-종이라벨.png', B + '낱개-종이', 'hp', film=10, min_area=4000)
