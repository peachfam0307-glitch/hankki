# 🕳 자른 컷이 «파먹혔나» 재는 판 (창업자 2026-08-24 *"확대해서 보면 파먹인 그림들이 있어"*)
#   ⭐ 방식 = 시트에서 cut.py 와 «같은 눈»(<250)으로 덩어리를 찾아 구멍을 메운 것 ↔ 실제 컷 알파를 견준다.
#      찜닭(2026-08-24)을 그렇게 잡았다 — 109,304px 중 20,671px 이 «한 덩어리»로 사라져 있었다.
#   ⛔ 눈으로만 보면 놓친다. 작은 파먹힘은 축소판에서 안 보인다.
import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage

시트폴더 = sys.argv[1] if len(sys.argv) > 1 else '/tmp/cut0824/시트'
컷뿌리 = sys.argv[2] if len(sys.argv) > 2 else '/tmp/cut0824/새컷'
문턱 = 8   # 이 % 넘게 사라졌으면 알린다

print(f"{'컷':<14}{'덩어리':>10}{'컷':>10}{'사라짐':>9}{'제일 큰 조각':>13}")
나쁨 = []
for 시트 in sorted(glob.glob(f'{시트폴더}/s??.png')):
    n = os.path.basename(시트)[:-4]
    컷들 = sorted(glob.glob(f'{컷뿌리}/{n}/*.png'))
    if not 컷들:
        continue
    g = np.asarray(Image.open(시트).convert('L')).astype(int)
    lab, cnt = ndimage.label(g < 250)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, cnt + 1))
    blobs = []
    for i, s in enumerate(sizes):
        if s > 8000:
            ys, xs = np.where(lab == i + 1)
            m = np.zeros_like(lab, bool); m[ys, xs] = True
            blobs.append((xs.min(), ys.min(), ndimage.binary_fill_holes(m), ys.min(), ys.max(), xs.min(), xs.max()))
    blobs.sort(key=lambda b: (b[1] // 300, b[0]))   # 위→아래, 왼→오른
    for c, b in zip(컷들, blobs):
        _, _, blob, y0, y1, x0, x1 = b
        sub = blob[y0:y1 + 1, x0:x1 + 1]
        al = np.asarray(Image.open(c).convert('RGBA'))[:, :, 3] > 8
        py = (al.shape[0] - sub.shape[0]) // 2; px = (al.shape[1] - sub.shape[1]) // 2
        if py < 0 or px < 0: continue
        cs = al[py:py + sub.shape[0], px:px + sub.shape[1]]
        lost = sub & ~cs
        pct = 100 * lost.sum() / max(1, sub.sum())
        l2, n2 = ndimage.label(lost)
        큰 = int(max(ndimage.sum(np.ones_like(l2), l2, range(1, n2 + 1)))) if n2 else 0
        나쁜가 = pct >= 문턱
        if 나쁜가: 나쁨.append((os.path.basename(c), round(pct, 1), 큰))
        print(f"{'⛔' if 나쁜가 else '  '}{os.path.basename(c)[:-4]:<12}{sub.sum():>10,}{cs.sum():>10,}{pct:>8.1f}%{큰:>13,}")
print(f"\n{'⛔ 파먹힌 컷 ' + str(len(나쁨)) + '개' if 나쁨 else '✅ 파먹힌 컷 없다'} (문턱 {문턱}%)")
for n, p, k in 나쁨: print(f"   {n}  {p}%  제일 큰 조각 {k:,}px")
