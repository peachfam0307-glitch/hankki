# 🏷 시트에서 «라벨 글자 띠»만 찾아 흰색으로 덮는다 (자르기 전처리)
#
# 쓰는 법:  python3 tools/시트-라벨지우기.py <시트> <낼파일> [행수] [열수]
#           행수·열수를 주면 **칸(cell)마다 따로** 본다 ← 이게 정답이다(아래 사고 ③)
#
# ⛔⛔⛔ 2026-08-15 하루에 «세 번» 틀렸다. 세 번 다 «어디를 지울지»를 잘못 잡은 것이다.
#   ⑴ 딱 맞게 지웠더니 글자 가장자리가 남아 「소고기솥밥」의 **「솥」 한 글자**가 컷에 붙었다.
#   ⑵ 그래서 위아래로 34px 씩 넓혔더니 — 📮 창업자 *"소스 바닥잘렸어"*
#      **라벨은 그림 «아래»에 있으므로 «위»로 넓히면 그릇 바닥을 먹는다.** 20컷 중 10컷이 잘렸다.
#      🔢 실측 = 소스 컷 맨 아랫줄이 최대폭의 **54~58%**(둥근 그릇이면 10% 아래여야 한다)
#   ⑶ 위를 8px 로 줄여 바닥은 살렸는데 **「솥」 조각이 다시 붙었다.**
#      📮 창업자 *"수정할 거 다 끝난거야?"* 로 다시 재다가 찾았다.
#      🔢 격자 주기가 찍은 자리 **964~1008** ↔ 진짜 글자 **924~977** = 위쪽 40px 이 안 지워졌다.
#      ⭐⭐ **옛 34px 이 «두 일»을 하고 있었다** — 글자 가장자리 덮기 ＋ 이 40px 어긋남 메우기.
#         그래서 하나(바닥)를 고치면 다른 하나(조각)가 터진다. **값 하나로 두 문제를 덮지 말 것.**
#
# ⛔ 「가로 뻗침이 넓으면 글자 줄」도 시도했다가 틀렸다 —
#    한 줄에 그림이 셋 나란히 있으면 **그림 줄도 시트 폭을 가로지른다**(시트01 y874 가 그랬다).
#
# ✅✅ 그래서 지금 규칙 = **칸마다 따로 본다.**
#    한 칸 안에서는 접시와 글자 사이에 «흰 틈»이 반드시 있다(그 칸엔 딴 그림이 없으니까).
#    → 이미 검증된 원래 규칙(빈 줄로 끊어 얇은 띠를 찾기)을 **칸 단위로** 그대로 쓴다.
#    📌 새 잣대를 발명하지 않았다. **보는 «범위»만 좁혔다.**
#
# 🔎 얇은 띠 판정 — 글자 띠는 «얇다». 행마다 어두운 픽셀 수를 세면
#    그림 영역은 두껍고(수백 px) 글자 띠는 40~60px 높이의 낮은 봉우리다.
import sys
import numpy as np
from PIL import Image

UP, DOWN = 8, 40
# ⭐ 위 8 · 아래 40 — **위로 넓히면 그릇 바닥이 잘린다**(사고 ⑵).
#    이제 «자리»를 칸마다 정확히 찾으므로 여유로 메울 일이 없다 → 위는 작게 유지한다.

MINH = 14          # 이보다 얇은 띠는 «글자가 아니다» — 그림 아래 티끌이다
MAXH = 90          # 이보다 두꺼운 띠는 그림
MAXINK = 0.30      # 이보다 꽉 찬 띠는 그림
# ⛔ MINH 가 없으면 시트03 의 **2×2px 티끌**을 라벨로 보고 위 8px 을 지워
#    국수 그림 바닥을 7px 문다(실측: 그림이 y737 에서 끝나는데 y731 부터 지운다).
#    🔢 진짜 라벨 높이는 37~61px 이었다 — 14 는 그 아래로 한참 여유가 있다.


def bands_of(mask):
    """빈 줄로 끊어 «띠»(y0, y1) 목록을 만든다."""
    h, w = mask.shape
    empty = mask.sum(axis=1) < max(1, w * 0.002)
    out, s = [], None
    for y in range(h):
        if not empty[y] and s is None:
            s = y
        elif empty[y] and s is not None:
            out.append((s, y - 1)); s = None
    if s is not None:
        out.append((s, h - 1))
    return out


src, dst = sys.argv[1], sys.argv[2]
rowsN = int(sys.argv[3]) if len(sys.argv) > 3 else 1
colsN = int(sys.argv[4]) if len(sys.argv) > 4 else 1

im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
H, W = a.shape[:2]
dark = (a.max(axis=2) < 235)            # 흰 배경이 아닌 픽셀

killed = 0
rstep, cstep = H // rowsN, W // colsN
for r in range(rowsN):
    for c in range(colsN):
        y0c, y1c = r * rstep, (H if r == rowsN - 1 else (r + 1) * rstep)
        x0c, x1c = c * cstep, (W if c == colsN - 1 else (c + 1) * cstep)
        cell = dark[y0c:y1c, x0c:x1c]
        for (s, e) in bands_of(cell):
            seg = cell[s:e + 1]
            if not (MINH <= (e - s + 1) <= MAXH) or seg.mean() > MAXINK:
                continue                                  # 그림이다
            ys, ye = y0c + s, y0c + e
            a[max(y0c, ys - UP):min(y1c, ye + 1 + DOWN), x0c:x1c] = 255
            killed += 1
            print(f'   🏷 칸({r+1},{c+1}) 라벨 지움  y {ys}~{ye}'
                  f'  (높이 {e - s + 1}px · 아래로 {DOWN}px 더)')

Image.fromarray(a.astype(np.uint8)).save(dst)
print(f'✅ {src.split("/")[-1]} — 라벨 {killed}개 지움  ({rowsN}행 × {colsN}열)')
