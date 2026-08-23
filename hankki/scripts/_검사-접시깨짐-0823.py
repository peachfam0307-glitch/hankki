# 🍽🍽 「접시가 깨졌나」 — **원본 칸과 대조해서** 잰다 (창업자 2026-08-23)
#   📮 창업자 = *"접시가 멀쩡하다고?"* → *"1.6.9빼고 다깨짐."* → *"새컷도 좀 잘렸는데.. 접시가"* → *"다 뜯겼어 아래것도"*
#
# ⛔⛔ **내가 눈으로 두 번 놓쳤다.** 280px 로 봐서 「거의 멀쩡」이라 했고, 2차에서도 못 봤다.
#    창업자가 두 번 다 잡았다. **눈을 믿은 게 잘못이다.**
#
# ⭐⭐ 그래서 «숫자»로 잡는다 — **원본 칸이 손에 있으니 대조가 가능하다.**
#    원본에서 「그림」이던 픽셀이 자른 뒤 «사라졌으면» 그게 깨짐이다.
#    ⛔ 기존 검사 셋이 전부 이걸 못 본다 — 셋 다 «원본을 안 본다»:
#       · `check-cutouts`   = 가장자리에 «닿았나»·떨어진 조각·계단
#       · `_검사-파먹힘`     = 밖으로 «삐져나온» 가는 것
#       · `_검사-음식구멍`   = 안쪽에 «뚫린» 구멍
#
# ⛔ 이 파일은 2026-08-23 하루에 «네 번» 컨테이너 되감김으로 날아갔다. 반드시 커밋한다.
#
# 쓰기:  python3 scripts/_검사-접시깨짐-0823.py <칸폴더> <낱개폴더>
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

칸폴더 = sys.argv[1]
컷폴더 = sys.argv[2]
BG = 250      # 원본에서 「그림」의 문턱 — cut.py 와 같은 눈
A = 40        # 자른 컷에서 「보이는」 문턱 (반투명 가장자리도 보인다)
경보 = 0.03   # 원본 그림의 3% 이상 사라지면 깨짐

rows = []
for cf in sorted(glob.glob(os.path.join(칸폴더, '*.png'))):
    b = os.path.basename(cf)[:-4]                 # c05_01
    n = ('w' if b.startswith('c0') and os.path.exists(os.path.join(컷폴더, 'w' + b[1:] + '.png')) else 'n') + b[1:]
    후보 = [os.path.join(컷폴더, n + '.png')] + sorted(glob.glob(os.path.join(컷폴더, n + '_*.png')))
    후보 = [p for p in 후보 if os.path.exists(p)]
    if not 후보:
        continue
    src = np.asarray(Image.open(cf).convert('RGB'))
    m0 = src.max(axis=2) < BG
    if not m0.any():
        continue
    orig = int(ndimage.binary_fill_holes(m0).sum())
    got = 0
    for p in 후보:
        a = np.asarray(Image.open(p).convert('RGBA'))[:, :, 3]
        got += int(ndimage.binary_fill_holes(a > A).sum())
    잃음 = max(0.0, (orig - got) / orig)
    rows.append((os.path.basename(후보[0])[:-4], 잃음, orig, got))

rows.sort(key=lambda t: -t[1])
나쁜 = [t for t in rows if t[1] >= 경보]
print(f'📐 {len(rows)}칸 대조 (원본 대비 {경보:.0%} 이상 사라지면 깨짐)\n')
print(f'🍽 접시가 깨진 컷 — {len(나쁜)} / {len(rows)}')
for n, r, o, g in 나쁜[:20]:
    print(f'   {n:14s} 원본 {o:7d} → {g:7d}   **{r:.1%} 사라짐**')
if not 나쁜:
    print('   없다 ✅')
sys.exit(1 if 나쁜 else 0)
