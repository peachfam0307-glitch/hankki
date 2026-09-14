#!/usr/bin/env python3
"""🖼 한 장짜리 그림에서 «바깥 흰 배경»만 빼서 투명하게 만든다.

⛔⛔ 이건 `tools/cut.py`(스티커 자르기 표준)와 «다른 일»이다 — 헷갈리지 말 것.
   · `cut.py`   = 시트를 **낱개 스티커로 «쪼갠다»** ＋ 흰 다이컷 테를 두른다(절대원칙 3개가 걸려 있다)
   · 이 도구     = 한 장을 **안 쪼개고** 배경만 뺀다. 홍보 카드·판에 얹으려고.
   ⭐ 5인 라인업처럼 «한 덩어리로 써야 하는» 그림은 cut.py 로 자르면 다섯으로 흩어진다.

⭐⭐ 심장 = **가장자리에서 «연결된» 흰색만 뺀다.**
   ⛔ 「흰색이면 다 뺀다」로 하면 **펭펭 얼굴 · 꼬르곰 앞치마 · 셰프모자에 구멍이 뚫린다.**
      (2026-07-30 자르기 표준이 「돛·갈매기 배·밀짚모자의 흰 부분이 통째로 비친다」로 겪은 그것)
   ✅ 그래서 flood 로 «바깥과 이어진» 덩어리만 고른다.

⭐ 가장자리는 «판정»하지 않고 «계산»한다 — 자르기 표준과 같은 생각.
   보이는색 = 원래색×α + 255×(1−α)  →  반투명 가장자리가 계단이 안 진다.

쓰기:
  python3 tools/배경빼기-한장.py <들어올그림> <내보낼PNG> [--문턱 246]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

args = [a for a in sys.argv[1:] if not a.startswith('--')]
if len(args) < 2:
    print(__doc__)
    sys.exit(1)
src, dst = args[0], args[1]
문턱 = 246
if '--문턱' in sys.argv:
    문턱 = int(sys.argv[sys.argv.index('--문턱') + 1])

im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
h, w = a.shape[:2]

# ① 「밝고 색기 없는」 픽셀 = 배경 후보
밝기 = a.max(axis=2)
채도 = a.max(axis=2) - a.min(axis=2)
후보 = (밝기 >= 문턱) & (채도 <= 12)

# ② 그중 «가장자리와 이어진» 덩어리만 진짜 배경
라벨, 개수 = ndimage.label(후보)
가장자리라벨 = set(라벨[0, :]) | set(라벨[-1, :]) | set(라벨[:, 0]) | set(라벨[:, -1])
가장자리라벨.discard(0)
배경 = np.isin(라벨, list(가장자리라벨))

# ③ 알파를 «계산»한다 — 배경 가장자리 2px 띠에서 부드럽게
#    (딱 잘라 0/255 로 하면 계단이 진다 — 자르기 표준이 겪은 그것)
알파 = np.where(배경, 0, 255).astype(np.uint8)
띠 = ndimage.binary_dilation(배경, iterations=2) & ~배경
if 띠.any():
    보이는 = 밝기[띠].astype(np.float32)
    # 255 에 가까울수록 투명. 문턱~255 구간을 알파 255~0 으로 편다.
    비율 = np.clip((255.0 - 보이는) / max(1.0, 255.0 - 문턱), 0.0, 1.0)
    알파[띠] = (비율 * 255).astype(np.uint8)

out = np.dstack([np.asarray(im).astype(np.uint8), 알파])
Image.fromarray(out, 'RGBA').save(dst)

뺀비율 = 배경.sum() / (h * w) * 100
print(f'✅ {dst}')
print(f'   크기 {w}×{h} · 뺀 배경 {뺀비율:.1f}% · 부드럽게 처리한 띠 {int(띠.sum())}px')
if 뺀비율 > 85:
    print('   ⚠️ 너무 많이 뺐다 — 그림까지 먹었을 수 있다. 열어서 확인할 것.')
if 뺀비율 < 5:
    print('   ⚠️ 거의 안 뺐다 — 배경이 흰색이 아닐 수 있다. --문턱 을 낮춰 볼 것.')
