# 🕳 자른 컷에서 «진짜 구멍»만 뚫는다 — 자르기 «뒤» 단계 (창업자 2026-08-24)
#
# 📮 창업자 = *"냄비에 손잡이부분도 파야하고, 종지4개짜리는 가운데 하얀부분 파야해."*
#            → *"냄비마다 손잡이 구멍이 있는게 있고 없는게 있다고"*
#
# ⛔⛔ `cut.py --punch` 로는 못 푼다 (전부 실측) —
#    · 0.004 = 손잡이는 뚫리는데 **접시 테의 밝은 띠까지 초승달로 뚫린다**(s08_01 등 여러 컷)
#    · 0.012·0.015 = **아무 일도 안 일어난다** — 그 흰색은 알파에서 「구멍」이 아니라 «불투명한 몸통»이다
#    · 크기(px)로도 못 가른다 — 손잡이 579px ↔ 테 하이라이트 6,230px 으로 **테가 오히려 크다**
#
# ⭐⭐ 가르는 것은 «크기»가 아니라 **모양**이다 (실측)
#    | | 채움률(넓이÷상자) | 두께 |
#    | 🍲 손잡이 구멍 | **0.67~0.73** 동글 | 12~18px |
#    | 🥣 종지 가운데 | 0.30 | **49px** 압도적 |
#    | ⛔ 테 하이라이트 | 0.05~0.30 길고 얇다 | 4~30px |
#    → 뚫는다 = (채움률 ≥ 0.5 이고 두께 ≥ 10) «또는» 두께 ≥ 40
#
# ⛔ `cut.py` 는 건드리지 않는다 (창업자 절대원칙 2026-08-18). 이건 그 «뒤»에 서는 별개 도구다.
# ⛔ 흰 테(다이컷)는 지킨다 — 컷 가장자리에서 N px 안쪽만 뚫는다.
#
# 쓰기:  python3 tools/컷-구멍뚫기.py <컷.png> <원본칸.png> [흰테보호=6]
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

컷경로, 칸경로 = sys.argv[1], sys.argv[2]
보호 = int(sys.argv[3]) if len(sys.argv) > 3 else 6

컷 = Image.open(컷경로).convert('RGBA')
rgba = np.asarray(컷).copy()
al = rgba[:, :, 3]
g = np.asarray(Image.open(칸경로).convert('L')).astype(int)

lab, cnt = ndimage.label(g >= 250)
가장자리 = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
가장자리.discard(0)

뚫기 = np.zeros(g.shape, bool)
잡은것 = []
for i in range(1, cnt + 1):
    if i in 가장자리:
        continue                       # 바깥과 이어진 것은 어차피 배경 — cut 이 이미 처리한다
    m = lab == i
    s = int(m.sum())
    if s < 200:
        continue
    ys, xs = np.where(m)
    채움 = s / max(1, (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1))
    두께 = float(ndimage.distance_transform_edt(m).max()) * 2
    # ⛔ 「두께 ≥ 20」으로 넓혔더니 **접시 테 하이라이트가 다시 걸렸다**(s03·s04·s05·s08 · 두께 20~30 · 채움 0.12~0.30).
    #    종지 가운데(두께 49.2)만 넘기면 되므로 40 으로 되돌린다.
    if (채움 >= 0.6 and 두께 >= 12) or 두께 >= 40:
        뚫기 |= m
        잡은것.append((s, round(채움, 2), round(두께, 1)))

if not 잡은것:
    print(f'   · {컷경로.split("/")[-1]} — 뚫을 구멍 없다')
    sys.exit(0)

# ── 컷과 자리 맞추기 (덩어리 상자 · 가운데 정렬)
l2, n2 = ndimage.label(g < 250)
sz = ndimage.sum(np.ones_like(l2), l2, range(1, n2 + 1))
ys, xs = np.where(l2 == int(np.argmax(sz)) + 1)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
bh, bw = y1 - y0 + 1, x1 - x0 + 1
py, px = (al.shape[0] - bh) // 2, (al.shape[1] - bw) // 2
if py < 0 or px < 0:
    sys.exit('⛔ 컷이 덩어리보다 작다 — 자리를 못 맞춘다')

옮김 = np.zeros(al.shape, bool)
옮김[py:py + bh, px:px + bw] = 뚫기[y0:y1 + 1, x0:x1 + 1]

# ⛔⛔ [2026-08-24] **테를 물어뜯는 것을 막는다.** 창업자 = *"종지는 아직도 좀 삐뚤해"*
#    s11_01(땅콩버터소스)에서 그릇 «테 가장자리»의 밝은 자리를 구멍으로 보고 뚫어 **테가 패였다.**
#    ⭐ 진짜 구멍은 «완전히 안쪽»에 있다 — 손잡이 구멍은 사방이 그릇으로 둘러싸여 있다.
#    ✅ 그래서 «흰 테 보호선 안에 통째로 들어오는» 덩어리만 뚫는다. 한 픽셀이라도 걸치면 «안» 뚫는다.
안쪽 = ndimage.binary_erosion(al > 8, np.ones((보호 * 2 + 1, 보호 * 2 + 1)))
검사, k = ndimage.label(옮김)
살릴것 = np.zeros(al.shape, bool)
for j in range(1, k + 1):
    조각 = 검사 == j
    if (조각 & ~안쪽).any():
        print(f'   ⛔ 테에 걸친 덩어리 {int(조각.sum()):,}px — 안 뚫는다')
        continue
    살릴것 |= 조각
옮김 = 살릴것

# 🪶 가장자리 다듬기 — ⛔ «원본 밝기로 알파를 재는» 방식은 쓰지 않는다.
#    2026-08-24 에 그렇게 했더니 원본의 253 잡티가 알파로 그대로 옮아 **얼룩덜룩**해졌다
#    (창업자 = *"종지는 아직도 좀 삐뚤해"*). 잡티는 «모양»을 다듬어야 없어진다.
#    ✅ ⑴열고 닫아 모양을 고르게 ⑵2px 만 흐려 톱니만 없앤다.
옮김 = ndimage.binary_opening(옮김, np.ones((3, 3)))
옮김 = ndimage.binary_closing(옮김, np.ones((5, 5)))
옮김 &= 안쪽

before = int((al > 8).sum())
부드럽 = ndimage.gaussian_filter(옮김.astype(np.float32), 1.2)
rgba[:, :, 3] = np.minimum(al, (255 * (1.0 - np.clip(부드럽 * 1.6, 0, 1))).astype(np.uint8))

# 🏷🏷 뚫은 «안쪽 가장자리»에도 바깥과 «같은 흰 테»를 두른다 (창업자 = *"종지는 아직도 좀 삐뚤해"*)
#    ⛔ 바깥엔 다이컷 흰 테가 있는데 뚫은 안쪽만 «맨살»이면 그 자리만 삐뚤해 보인다.
#       s11_05(종지 4개) 가운데가 딱 그랬다 — 그릇 테가 흰 테 없이 그냥 끊겨 있었다.
#    ⭐ 두께는 바깥과 같은 3px (cut.py --diecut 3 과 맞춘다).
테두께 = 3
남음 = rgba[:, :, 3] > 8
링 = ndimage.binary_dilation(남음, np.ones((테두께 * 2 + 1, 테두께 * 2 + 1))) & ~남음 & ndimage.binary_dilation(옮김, np.ones((3, 3)))
rgba[링, 0:3] = 255
rgba[링, 3] = 255
Image.fromarray(rgba).save(컷경로)
print(f'   🕳 {컷경로.split("/")[-1]} — {before - int((rgba[:,:,3] > 8).sum()):,}px 뚫음 · {잡은것}')
