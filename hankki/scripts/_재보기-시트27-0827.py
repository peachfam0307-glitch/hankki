# 🔒 시트27 자르기 잣대 — 「원본 잉크(<246) 중 컷에 없는 것」의 총량 (2026-08-27)
#
# ⛔⛔ 이 잣대에 오기까지 넷을 버렸다 (2026-08-27 실측) —
#    bbox · 넓이 · 「어두운 픽셀 보존율」 · 「덩어리 크기」 = **넷 다 아무것도 안 잡는다.**
#    잃는 게 1~2px 굵기의 «선»이라 넓이로는 0.2% 고 덩어리로는 20px 밖에 안 된다.
#    ⭐ 그런데 눈으로는 「손잡이가 잘렸다」로 또렷이 보인다(창업자가 그렇게 잡았다).
#
# 쓰기: python3 scripts/_재보기-시트27-0827.py <시트> <컷1> <컷2> ...

import sys, numpy as np
from PIL import Image

시트 = np.asarray(Image.open(sys.argv[1]).convert('L')).astype(int)
H, W = 시트.shape
행, 열 = 2, 3
ch, cw = H // 행, W // 열
컷들 = sys.argv[2:]
총 = 0
for i, p in enumerate(컷들):
    r, c = i // 열, i % 열
    칸 = 시트[r*ch:(r+1)*ch, c*cw:(c+1)*cw]
    잉크 = 칸 < 246
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im)[:, :, 3] > 20
    # 컷을 칸 안에서 찾는다 — 컷은 칸의 잉크 bbox 를 12px 여백과 함께 잘라낸 것
    ys, xs = np.where(잉크)
    if not len(ys): continue
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    ch2, cw2 = a.shape
    # 컷 안에서 알파가 있는 bbox
    ay, ax = np.where(a)
    # 원본 잉크 bbox 중심을 컷 알파 bbox 중심에 맞춘다
    oy = y0 - ay.min() if len(ay) else 0
    ox = x0 - ax.min() if len(ax) else 0
    덮개 = np.zeros_like(잉크)
    for yy in range(ch2):
        ty = yy + oy
        if 0 <= ty < 칸.shape[0]:
            row = a[yy]
            tx0, tx1 = ox, ox + cw2
            s0, s1 = max(0, tx0), min(칸.shape[1], tx1)
            if s1 > s0:
                덮개[ty, s0:s1] |= row[s0-ox:s1-ox]
    잃음 = int((잉크 & ~덮개).sum())
    총 += 잃음
    print(f'   {p.split("/")[-1]:12s} 원본잉크 {int(잉크.sum()):7,}  ·  컷에 없는 잉크 {잃음:6,}  ({잃음/max(1,잉크.sum())*100:5.2f}%)')
print(f'\n🔒 잃은 잉크 총량 = {총:,}px')
