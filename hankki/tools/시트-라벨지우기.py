# 🏷 시트에서 «라벨 글자 띠»만 찾아 흰색으로 덮는다 (자르기 전처리)
#
# ⛔⛔ 2026-08-15 사고 둘 — 이 파일은 «두 번 틀린 뒤» 고친 판이다.
#   ⑴ 딱 맞게 지웠더니 글자 가장자리가 남아 「소고기솥밥」의 **「솥」 한 글자**가 컷에 붙었다.
#   ⑵ 그래서 위아래로 34px 씩 넓혔더니 — 📮 창업자 *"소스 바닥잘렸어"*
#      **라벨은 그림 «아래»에 있으므로 «위»로 넓히면 그릇 바닥을 먹는다.** 20컷 중 10컷이 잘렸다.
#      🔢 실측 = 소스 컷 맨 아랫줄이 최대폭의 **54~58%**(둥근 그릇이면 10% 아래여야 한다)
#
# ✅ 그래서 지금 규칙 = **위로는 «안» 넓히고, 아래로만 넓힌다.**
#    · 글자 «위» 가장자리는 라벨 띠 판정에 이미 들어와 있다(잉크가 있는 행이니까)
#    · 남는 건 글자 «아래» 가장자리라, 아래로만 넉넉히 주면 된다
#    · ＋ 자를 때 `--join 2` 로 묶는 거리를 줄여 떨어진 글자가 본체에 안 붙게 한다
#
# 🔎 어떻게 가르나 — 글자 띠는 «얇다». 행마다 어두운 픽셀 수를 세면
#    그림 영역은 두껍고(수백 px) 글자 띠는 40~60px 높이의 낮은 봉우리다.
import sys
import numpy as np
from PIL import Image

UP, DOWN = 8, 40
# ⭐ 위 8 · 아래 40 — **위로 넓히면 그릇 바닥이 잘린다**(2026-08-15 창업자 *"소스 바닥잘렸어"*).
#    🔢 실측으로 찾은 값 — 위 34px = 소스 10컷 바닥 잘림 / 위 0px = 「솥」 글자 조각이 남음
#       위 4·8·12·16 은 **전부** 조각 0 ＋ 바닥 온전 → 가운데인 **8** 로 잡았다(양쪽에 여유가 있다).

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
H, W = a.shape[:2]
dark = (a.max(axis=2) < 235)            # 흰 배경이 아닌 픽셀
rows = dark.sum(axis=1)
empty = rows < (W * 0.002)              # 거의 빈 행

# 빈 행으로 끊어 «띠»를 만든다
bands, s = [], None
for y in range(H):
    if not empty[y] and s is None:
        s = y
    elif empty[y] and s is not None:
        bands.append((s, y - 1))
        s = None
if s is not None:
    bands.append((s, H - 1))

thin = [b for b in bands if (b[1] - b[0] + 1) <= 90]
killed = 0
for (y0, y1) in thin:
    seg = dark[y0:y1 + 1]
    if seg.sum() / max(1, seg.size) > 0.30:   # 너무 꽉 차면 그림 조각
        continue
    a[max(0, y0 - UP):min(H, y1 + 1 + DOWN)] = 255
    killed += 1
    print(f'   🏷 라벨 띠 지움  y {y0}~{y1}  (높이 {y1 - y0 + 1}px · 아래로 {DOWN}px 더)')

# ── 그림에 «닿아 있는» 라벨 ──
# ⛔ 시트1·2는 아래줄 라벨이 그림과 붙어 한 띠(>90px)가 되어 위 판정을 빠져나간다.
# ⭐ 시트는 격자라 **라벨 간격이 일정하다** — 찾은 첫 띠에 «줄 높이»를 더해 같은 자리를 지운다.
if killed and len(sys.argv) > 3:
    rowsN = int(sys.argv[3])
    if rowsN >= 2:
        step = H // rowsN
        y0, y1 = thin[0]
        for k in range(1, rowsN):
            p, q = y0 + step * k, y1 + step * k
            if q >= H:
                continue
            seg = (a[p:q + 1].max(axis=2) < 235)
            if seg.sum() / max(1, seg.size) > 0.30:   # 그림이면 건드리지 않는다
                continue
            a[max(0, p - UP):min(H, q + 1 + DOWN)] = 255
            print(f'   🏷 (격자 주기) 라벨 띠 지움  y {p}~{q}')
            killed += 1

Image.fromarray(a.astype(np.uint8)).save(dst)
print(f'✅ {src.split("/")[-1]} — 띠 {killed}개 지움')
