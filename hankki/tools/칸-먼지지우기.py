# 🧹 칸에서 «눈에 안 보이는 먼지»만 지운다 — 자르기 «전» 단계 (2026-08-24)
#
# 📮 왜 = 창업자 시트 몇 칸에 **34~52px 짜리 옅은 얼룩**(밝기 242~249)이 있다.
#    눈으로는 안 보이는데 `cut.py` 의 절대원칙 「본체에서 떨어진 조각 0개」에 걸려
#    **그 칸이 통째로 안 잘린다.**
#
# ⛔ `cut.py` 는 건드리지 않는다(창업자 절대원칙 2026-08-18). 이건 그 «앞»에 서는 별개 도구다.
# ⛔ **본체는 한 픽셀도 안 건드린다** — 제일 큰 덩어리와 「충분히 큰」 덩어리는 그대로 둔다.
#    ⚠️ 접시 테가 «떨어진 조각»으로 잡히는 일이 있어서(2026-08-24 파먹힘 사고) 문턱을 넉넉히 잡는다.
#
# 쓰기:  python3 tools/칸-먼지지우기.py <칸.png> <낼파일.png> [최대비율=0.005] [최소밝기=235]
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
최대비율 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.005   # 본체의 0.5% 미만만 먼지로 본다
최소밝기 = int(sys.argv[4]) if len(sys.argv) > 4 else 235       # 이보다 어두우면 «그림»이라 안 지운다

im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
g = a.max(axis=2)
lab, n = ndimage.label(g < 254)          # ⭐ 254 — 「보이는 것」 기준(칼보다 넓게 본다)
if n == 0:
    im.save(dst); sys.exit(f'· 덩어리가 없다 — 그대로 저장')
sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
본체 = max(sz)
지움 = 0
for i, s in enumerate(sz):
    if s >= 본체 * 최대비율:
        continue                          # 크면 그림이다 — 안 건드린다
    ys, xs = np.where(lab == i + 1)
    if g[ys, xs].min() < 최소밝기:
        continue                          # 진한 것이 있으면 그림이다 — 안 건드린다
    a[ys, xs] = 255
    지움 += 1
    print(f'   🧹 먼지 {int(s)}px  x{xs.min()}~{xs.max()} y{ys.min()}~{ys.max()}  밝기 {g[ys,xs].min()}~{g[ys,xs].max()}')
Image.fromarray(a.astype(np.uint8)).save(dst)
print(f'✅ {src.split("/")[-1]} — 먼지 {지움}개 지움 (본체 {int(본체):,}px · 문턱 {최대비율*100:.1f}% · 밝기 {최소밝기}↑)')
