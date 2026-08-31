#!/usr/bin/env python3
"""잡조각 찾기 — 자를 때 옆 그림이 딸려 들어온 조각을 잡아낸다.

왜 만들었나 (창업자 폰 제보 2026-07-30):
  *"온보드 꼬르곰펭펭 잘린면에 빨강선보여 큰일날뻔.. 수박먹는것도 조각 있어. 하트곰도 조각..
    스티커 자를때 꼼꼼히 검수하면 좋겠다."*
  → **맞는 지적이고, 눈으로 하는 검사는 언젠가 놓친다.** 그래서 픽셀로 못 박는다.

⭐ 가르는 기준 두 가지 — 둘 중 하나면 잡조각.
   ① **가장자리에 닿았다** — 자를 때 잘려 테두리에 붙어 있다.
   ② **가늘고 길다** — 옆 그림이 세로로 쪼개져 들어오면 폭이 5~6px짜리 **얇은 띠**가 된다.
   ⚠️ 반짝이·하트처럼 **일부러 떨어뜨려 놓은 장식**은 통통하다(20px 이상). 그래서 안 걸린다.
      (그냥 "본체에서 떨어져 있으면 잡조각" 으로 잡으면 **장식까지 지워버린다** — 실제로 그럴 뻔했다.
       `gom_heart` 에서 반짝이·하트 3개가 그 규칙에 걸렸었다.)

쓰기:  python3 tools/find-fragments.py            (찾기만)
       python3 tools/find-fragments.py --fix      (찾아서 지우기)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'src/assets')
FIX = '--fix' in sys.argv

MIN_PX = 12          # 이보다 작으면 먼지 — 무시(안티에일리어싱 찌꺼기)
MAX_RATIO = 0.10     # 본체의 10% 넘으면 조각이 아니라 그림의 일부일 수 있다


def scan(fp):
    im = Image.open(fp).convert('RGBA')
    a = np.array(im)
    al = a[..., 3] > 40
    if not al.any():
        return None, []
    lab, n = ndimage.label(al)
    if n < 2:
        return im, []
    sizes = ndimage.sum(al, lab, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    h, w = al.shape
    bad = []
    for i in range(1, n + 1):
        if i == main or sizes[i - 1] < MIN_PX or sizes[i - 1] > sizes.max() * MAX_RATIO:
            continue
        m = lab == i
        ys, xs = np.where(m)
        touches = m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()
        thin = min(xs.max() - xs.min(), ys.max() - ys.min()) + 1 <= max(4, round(min(h, w) * 0.03))
        if not (touches or thin):
            continue
        bad.append((i, int(sizes[i - 1]), int(xs.mean()), int(ys.mean())))
    return im, bad


found = 0
for dirpath, _, files in os.walk(ASSETS):
    for f in sorted(files):
        if not f.endswith('.png'):
            continue
        fp = os.path.join(dirpath, f)
        im, bad = scan(fp)
        if not bad:
            continue
        found += 1
        rel = os.path.relpath(fp, ROOT)
        print(f"⚠️ {rel} — 잡조각 {len(bad)}개 " + ' '.join(f'({s}px @{x},{y})' for _, s, x, y in bad))
        if FIX:
            a = np.array(im)
            lab, _ = ndimage.label(a[..., 3] > 40)
            for i, *_ in bad:
                a[..., 3][lab == i] = 0
            Image.fromarray(a).save(fp)

print(f"\n{'지운' if FIX else '찾은'} 파일 {found}개" + ('' if FIX else ' — 지우려면 --fix'))
