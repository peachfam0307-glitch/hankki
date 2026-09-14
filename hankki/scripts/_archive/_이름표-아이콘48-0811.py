# 🏷 새 48컷에 «이름»을 붙이기 위한 확인표.
#
# ⛔ 짐작으로 이름을 붙이면 안 된다 — 2026-08-04 에 컨택트시트에서 칸을 밀려 읽어
#    엉뚱한 컷을 골랐다(규칙 18). 그래서 «기계»가 짝을 짓게 한다.
#
# ⭐ 방법 = 시트는 3×2 격자이고 라벨이 «그 칸 아래»에 인쇄돼 있다.
#    칸마다 라벨 띠를 잘라서 «잘린 컷 옆에» 붙인다 → 짝이 눈에 보이는 채로 확정된다.
#    cut.py 는 무게중심으로 칸을 배정하고 읽는 순서(왼→오, 위→아래)로 번호를 매긴다.
import sys
from PIL import Image
from pathlib import Path

뿌리 = Path(__file__).resolve().parent.parent
폴더 = 뿌리 / 'docs/stickers/음식아이콘-창업자-2026-08-11'
시트들 = sorted((폴더 / '원본시트').glob('*.png'))

칸W, 칸H = 300, 260          # 확인표 한 칸
줄, 칸 = 0, 0
판 = Image.new('RGB', (칸W * 3, 칸H * 16), (247, 244, 236))

행 = []
for s in 시트들:
    n = s.stem[-2:]                       # 시트07 → '07'
    im = Image.open(s).convert('RGB')
    W, H = im.size
    for r in range(2):
        for c in range(3):
            # 격자 한 칸
            x0, y0 = int(W * c / 3), int(H * r / 2)
            x1, y1 = int(W * (c + 1) / 3), int(H * (r + 1) / 2)
            # 라벨 띠 = 칸의 아래 34%.
            # ⛔ 처음엔 22% 로 잡았다가 «아랫줄 라벨이 잘려» 안 읽혔다 —
            #    아래 칸은 시트 밑 여백이 좁아 라벨이 칸 «안»에서 더 위에 앉는다.
            #    윗줄만 보고 통과시킬 뻔했다(규칙 18: 「안 보인다」는 내 자르는 자리부터 의심).
            라벨 = im.crop((x0, y0 + int((y1 - y0) * 0.66), x1, y1))
            키 = f'n{n}{r * 3 + c + 1:02d}'
            컷경로 = 폴더 / '낱개' / f'{키}.png'
            행.append((키, 컷경로, 라벨))

판 = Image.new('RGB', (칸W * 3, 칸H * ((len(행) + 2) // 3)), (247, 244, 236))
for i, (키, 컷경로, 라벨) in enumerate(행):
    ox, oy = (i % 3) * 칸W, (i // 3) * 칸H
    if 컷경로.exists():
        c = Image.open(컷경로).convert('RGBA')
        c.thumbnail((150, 150))
        바탕 = Image.new('RGB', c.size, (247, 244, 236))
        바탕.paste(c, (0, 0), c)
        판.paste(바탕, (ox + (150 - c.width) // 2 + 8, oy + 14))
    else:
        print(f'⛔ 컷 없음 {키}')
    라벨.thumbnail((136, 90))
    판.paste(라벨, (ox + 160, oy + 40))
    # 키를 글자로 그린다 (글꼴 없이 — 위치만 알면 되니 작은 눈금으로)
from PIL import ImageDraw, ImageFont
d = ImageDraw.Draw(판)
try:
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except OSError:
    f = ImageFont.load_default()
for i, (키, _, _) in enumerate(행):
    d.text(((i % 3) * 칸W + 10, (i // 3) * 칸H + 168), 키, fill=(90, 70, 50), font=f)

out = 뿌리 / 'docs/stickers/음식아이콘-창업자-2026-08-11/_검수/이름표-확인.png'
out.parent.mkdir(parents=True, exist_ok=True)
판.save(out)
print(f'OK {out}  {판.size}  · {len(행)}칸')
