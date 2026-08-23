# 🍽🍽 「접시가 깨졌나」 — **원본 칸과 대조해서** 잰다 (창업자 2026-08-23)
#   📮 창업자 = *"접시가 멀쩡하다고?"* → *"1.6.9빼고 다깨짐."* → *"너 검수도 이제 정확히 못하네 어떻하지"*
#
# ⛔⛔ **내가 눈으로 놓쳤다.** 280px 로 봐서 12컷 중 3컷만 멀쩡한 걸 「거의 다 멀쩡」이라고 했다.
#    자르기 카드에 *"작은 잔재는 «키워야» 보인다 — 3배로 다시 그려서 보는 것이 확실하다"* 라고
#    적혀 있는데 안 지켰다. **눈을 믿은 게 잘못이다.**
#
# ⭐⭐ 그래서 «숫자»로 잡는다 — **원본 칸이 손에 있으니 대조가 가능하다.**
#    원본에서 「그림」이던 픽셀이 자른 뒤 «사라졌으면» 그게 깨짐이다.
#    ⛔ 기존 검사 셋이 전부 이걸 못 본다:
#       · `check-cutouts`   = 가장자리에 «닿았나»(잘림)·떨어진 조각·계단
#       · `_검사-파먹힘`     = 밖으로 «삐져나온» 가는 것
#       · `_검사-음식구멍`   = 안쪽에 «뚫린» 구멍
#       셋 다 «원본을 안 본다». 그래서 원본보다 작아져도 아무도 모른다.
#
# 쓰기:  python3 scripts/_검사-접시깨짐-0823.py <칸폴더> <낱개폴더>
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

칸폴더 = sys.argv[1] if len(sys.argv) > 1 else 'docs/stickers/음식아이콘-창업자-2026-08-23/칸별'
컷폴더 = sys.argv[2] if len(sys.argv) > 2 else 'docs/stickers/음식아이콘-창업자-2026-08-23/낱개'
BG = 250      # 원본에서 「그림」의 문턱 — cut.py 와 같은 눈
A = 60        # 자른 컷에서 「그림」의 문턱
경보 = 0.03   # 원본 그림의 3% 이상이 사라지면 깨짐

rows = []
for cf in sorted(glob.glob(os.path.join(칸폴더, '*.png'))):
    b = os.path.basename(cf)[:-4]                 # c05_01
    n = 'n' + b[1:]
    후보 = [os.path.join(컷폴더, n + '.png')] + sorted(glob.glob(os.path.join(컷폴더, n + '_*.png')))
    후보 = [p for p in 후보 if os.path.exists(p)]
    if not 후보:
        continue
    src = np.asarray(Image.open(cf).convert('RGB'))
    m0 = src.max(axis=2) < BG
    if not m0.any():
        continue
    # ⭐ 원본 «그림 덩어리»의 넓이 — 그 칸에서 실제로 살려야 할 양
    orig = int(ndimage.binary_fill_holes(m0).sum())
    # 자른 컷들의 넓이 합 (한 칸에서 여러 컷이 나올 수 있다)
    got = 0
    for p in 후보:
        a = np.asarray(Image.open(p).convert('RGBA'))[:, :, 3]
        got += int(ndimage.binary_fill_holes(a > A).sum())
    잃음 = max(0.0, (orig - got) / orig)
    rows.append((b, ' + '.join(os.path.basename(p)[:-4] for p in 후보), 잃음, orig, got))

rows.sort(key=lambda t: -t[2])
나쁜 = [t for t in rows if t[2] >= 경보]
print(f'📐 {len(rows)}칸 대조 (원본 대비 {경보:.0%} 이상 사라지면 깨짐)\n')
print(f'🍽 접시가 깨진 칸 — {len(나쁜)}개')
for b, n, r, o, g in 나쁜:
    print(f'   {n:24s} 원본 {o:7d} → {g:7d}   **{r:.1%} 사라짐**')
if not 나쁜:
    print('   없다 ✅')
print('\n📊 상위 12')
for b, n, r, o, g in rows[:12]:
    print(f'   {n:24s} {r:6.1%}')
sys.exit(1 if 나쁜 else 0)
