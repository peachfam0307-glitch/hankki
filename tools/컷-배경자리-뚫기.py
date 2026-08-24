# 🕳 자른 컷에서 «원본이 배경이던 자리»만 뚫는다 — 자르기 «뒤» 단계 (2026-08-24)
#
# 📮 창업자 = *"냄비에 손잡이부분도 파야하고, 종지4개짜리는 가운데 하얀부분 파야해."*
#
# ⛔⛔ `cut.py --punch` 로는 못 푼다 (실측) —
#    · punch 를 걸면 손잡이는 뚫리는데 **접시 테의 밝은 띠까지 초승달로 뚫린다**(s08_01 등 여러 컷).
#    · 크기·두께로 갈라 보려 했으나 **겹친다** — 손잡이 구멍 1,088px ↔ 테 금 691px.
#
# ⭐⭐ 그래서 «크기»로 짐작하지 않고 **원본에게 물어본다.**
#    원본 칸에서 «바깥과 이어진 흰색»을 물 붓듯 찾으면 그게 «진짜 배경»이다.
#    손잡이 안쪽·종지 사이는 바깥과 이어져 있고, 접시 테는 안 이어져 있다. 구조가 다르다.
#    → 짐작이 0이다.
#
# ⛔ `cut.py` 는 건드리지 않는다 (창업자 절대원칙 2026-08-18).
# ⛔ 흰 테(다이컷)는 지킨다 — 배경 자리라도 «컷 가장자리에서 N px 안»은 안 뚫는다.
#
# 쓰기:  python3 tools/컷-배경자리-뚫기.py <컷.png> <원본칸.png> [흰테보호=6]
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

컷경로, 칸경로 = sys.argv[1], sys.argv[2]
보호 = int(sys.argv[3]) if len(sys.argv) > 3 else 6

컷 = Image.open(컷경로).convert('RGBA')
al = np.asarray(컷)[:, :, 3]
g = np.asarray(Image.open(칸경로).convert('L')).astype(int)

# ── 원본에서 «바깥과 이어진 흰색» = 진짜 배경
배경후보 = g >= 250
lab, n = ndimage.label(배경후보)
가장자리 = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
가장자리.discard(0)
배경 = np.isin(lab, list(가장자리))

# ── 컷과 자리 맞추기 (덩어리 상자 기준 · 가운데 정렬)
칼 = ndimage.binary_fill_holes(g < 250)
l2, n2 = ndimage.label(g < 250)
sz = ndimage.sum(np.ones_like(l2), l2, range(1, n2 + 1))
if not n2:
    sys.exit('⛔ 원본에서 덩어리를 못 찾았다')
ys, xs = np.where(l2 == int(np.argmax(sz)) + 1)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
bh, bw = y1 - y0 + 1, x1 - x0 + 1
py, px = (al.shape[0] - bh) // 2, (al.shape[1] - bw) // 2
if py < 0 or px < 0:
    sys.exit('⛔ 컷이 덩어리보다 작다 — 자리를 못 맞춘다')

뚫을것 = np.zeros(al.shape, bool)
뚫을것[py:py + bh, px:px + bw] = 배경[y0:y1 + 1, x0:x1 + 1]

# ⛔ 흰 테 지키기 = 컷의 «바깥 실루엣»에서 보호 px 안쪽은 안 뚫는다
실루엣 = al > 8
안쪽 = ndimage.binary_erosion(실루엣, np.ones((보호 * 2 + 1, 보호 * 2 + 1)))
뚫을것 &= 안쪽

before = int((al > 8).sum())
a2 = np.asarray(컷).copy()
a2[뚫을것, 3] = 0
after = int((a2[:, :, 3] > 8).sum())
Image.fromarray(a2).save(컷경로)
l3, n3 = ndimage.label(뚫을것)
print(f'   🕳 {컷경로.split("/")[-1]} — {before - after:,}px 뚫음 ({n3}곳)')
