# ✂️ 시트를 «칸»으로 먼저 가른다 — 자르기 «전» 단계
#
# ⛔⛔ 왜 필요한가 (2026-08-23 실측)
#   `cut.py` 는 «덩어리»로 자르는데, 시트에서 그릇끼리 가까우면
#   흰 접시 가장자리가 이어져 **옆 컷 조각이 «흰 갈고리»로 딸려 온다.**
#   ⭐ 칸으로 먼저 가르면 그 일이 «구조적으로» 안 난다 — 칸 안에 딴 그림이 없으니까.
#
# ⛔ `cut.py` 는 건드리지 않는다 (창업자 절대원칙 2026-08-18).
#    이건 그 «앞»에 서는 별개 도구다.
#
# 쓰기:  python3 tools/시트-칸별로-쪼개기.py <시트> <낼폴더> <접두어> <행> <열>
import os
import sys

from PIL import Image

src, out, pre = sys.argv[1], sys.argv[2], sys.argv[3]
R = int(sys.argv[4]) if len(sys.argv) > 4 else 2
C = int(sys.argv[5]) if len(sys.argv) > 5 else 3

os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
W, H = im.size
rs, cs = H // R, W // C
n = 0
for r in range(R):
    for c in range(C):
        y0, y1 = r * rs, (H if r == R - 1 else (r + 1) * rs)
        x0, x1 = c * cs, (W if c == C - 1 else (c + 1) * cs)
        칸 = im.crop((x0, y0, x1, y1))
        # ⭐ 칸 둘레에 흰 여백을 준다 — cut.py 가 「가장자리에 닿았다」로 보고 잘림 경보를 내지 않게
        판 = Image.new('RGB', (칸.width + 40, 칸.height + 40), (255, 255, 255))
        판.paste(칸, (20, 20))
        n += 1
        판.save(os.path.join(out, f'{pre}{n:02d}.png'))
print(f'✅ {n}칸 ({R}행 × {C}열)')
